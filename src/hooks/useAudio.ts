import { useState, useEffect, useCallback, useRef } from "react";
import { Howl } from "howler";

//interface for the audio state *move to types  TODO
interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoaded: boolean;
  error: string | null;
}
/**
 * Hook that manages the audio playback and controls with Howler.js
 * @param {string | null} audioUrl - The URL of the audio file to play
 * @returns {Object} An object containing the audio state and controls
 */
export const useAudio = (audioUrl: string | null) => {
  const [sound, setSound] = useState<Howl | null>(null);
  const soundRef = useRef<Howl | null>(null); //solve tracking issues with current sound instance for cleanup
  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isLoaded: false,
    error: null,
  });

  // use ref for interval to prevent memory leaks
  const intervalRef = useRef<NodeJS.Timer>();

  // cleanup function
  const cleanupInterval = useCallback(() => {
    if (intervalRef.current) {
      // cast to number since NodeJS.Timer is not directly compatible with clearInterval
      clearInterval(intervalRef.current as unknown as number);
      intervalRef.current = undefined;
    }
  }, []);
  //effect to load the audio file
  useEffect(() => {
    if (!audioUrl) {
      console.log("No audio URL provided.");
      return;
    }
    //decode and convert the audio path
    const decodedPath = decodeURIComponent(audioUrl.replace("media://", ""));
    const convertedPath = decodedPath.replace(
      /input_files\/(.+)\.(DS2|wav)/i,
      "output_files/$1.wav"
    );
    const finalPath = `media://${encodeURIComponent(convertedPath)}`;
    //console.log("Loading audio from:", finalPath);
    let isMounted = true;
    //function to load the audio file
    const loadAudio = async () => {
      try {
        console.log("Fetching audio from:", audioUrl);
        const response = await fetch(audioUrl);
        console.log("Fetch response status:", response.status);

        if (!response.ok) {
          throw new Error(`Failed to fetch audio: ${response.statusText}`);
        }

        if (!isMounted) return;
        //create the new sound instance
        const newSound = new Howl({
          src: [finalPath],
          html5: true,
          preload: true,
          format: ["wav"],
          onload: () => {
            const duration = newSound.duration();
            console.log("Howler loaded audio. Duration:", duration);

            if (isNaN(duration) || duration === Infinity) {
              console.error("Invalid audio duration:", duration);
              setState((prev) => ({
                ...prev,
                error: "Invalid audio duration",
                isLoaded: false,
              }));
            } else {
              console.log("Audio loaded successfully.");
              setState((prev) => ({
                ...prev,
                duration: duration,
                isLoaded: true,
                error: null,
              }));
            }
          },
          onplay: () => {
            setState((prev) => ({ ...prev, isPlaying: true }));
            cleanupInterval();
            intervalRef.current = setInterval(() => {
              const currentTime = newSound.seek();
              setState((prev) => ({
                ...prev,
                currentTime: typeof currentTime === "number" ? currentTime : 0,
              }));
            }, 250);
          },
          onpause: () => {
            setState((prev) => ({ ...prev, isPlaying: false }));
            cleanupInterval();
          },
          onstop: () => {
            setState((prev) => ({
              ...prev,
              isPlaying: false,
              currentTime: 0,
            }));
            cleanupInterval();
          },
          onend: () => {
            setState((prev) => ({ ...prev, isPlaying: false }));
            cleanupInterval();
          },
          onloaderror: (id, error) => {
            console.error("Audio load error:", error, "Error Code:", id);
            setState((prev) => ({
              ...prev,
              error: "Failed to load audio",
              isLoaded: false,
            }));
          },
        });
        soundRef.current = newSound;
        setSound(newSound);
      } catch (error) {
        console.error("Error loading audio:", error);
        if (isMounted) {
          setState((prev) => ({
            ...prev,
            error: "Error loading audio",
            isLoaded: false,
          }));
        }
      }
    };

    loadAudio();

    // cleanup on unmount or when audioUrl changes
    return () => {
      isMounted = false;
      cleanupInterval();
      if (soundRef.current) {
        soundRef.current.unload();
        soundRef.current = null;
      }
    };
  }, [audioUrl, cleanupInterval]);
  //define audio controls
  const controls = {
    play: useCallback(() => {
      if (sound?.state() === "loaded") {
        sound.play();
      }
    }, [sound]),

    pause: useCallback(() => {
      if (sound?.playing()) {
        sound.pause();
      }
    }, [sound]),

    stop: useCallback(() => {
      if (sound) {
        sound.stop();
        cleanupInterval();
      }
    }, [sound, cleanupInterval]),

    seek: useCallback(
      (time: number) => {
        if (sound) {
          sound.seek(time);
          setState((prev) => ({
            ...prev,
            currentTime: time,
          }));
        }
      },
      [sound]
    ),
  };

  /*// Debug effect
  useEffect(() => {
    console.log("Audio state updated:", state);
  }, [state]);
*/
  return { ...state, controls };
};
