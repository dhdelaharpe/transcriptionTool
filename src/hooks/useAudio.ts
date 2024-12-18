import { useState, useEffect, useCallback, useRef } from "react";
import { Howl } from "howler";

//interface for the audio state *move to types  TODO
interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoaded: boolean;
  error: string | null;
  rate: number;
}
/**
 * Hook that manages the audio playback and controls with Howler.js
 * @param {string | null} audioUrl - The URL of the audio file to play
 * @returns {Object} An object containing the audio state and controls
 */
export const useAudio = (audioUrl: string | null) => {
  const [sound, setSound] = useState<Howl | null>(null);
  const [id, setId] = useState<number>(-1);
  const soundRef = useRef<Howl | null>(null); //solve tracking issues with current sound instance for cleanup
  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isLoaded: false,
    error: null,
    rate: 1,
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
      return;
    }
    //decode and convert the audio path
    const decodedPath = decodeURIComponent(audioUrl.replace("media://", ""));
    const convertedPath = decodedPath.replace(
      /input_files\/(.+)\.(DS2|wav)/i,
      "output_files/$1.wav"
    );
    const finalPath = `media://${encodeURIComponent(convertedPath)}`;
    let isMounted = true;
    //function to load the audio file
    const loadAudio = async () => {
      try {
        const response = await fetch(audioUrl);
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
            if (isNaN(duration) || duration === Infinity) {
              console.error("Invalid audio duration:", duration);
              setState((prev) => ({
                ...prev,
                error: "Invalid audio duration",
                isLoaded: false,
              }));
            } else {
              setState((prev) => ({
                ...prev,
                duration: duration,
                isLoaded: true,
                error: null,
              }));
            }
          },
          onplay: (playId) => {
            setState((prev) => ({ ...prev, isPlaying: true }));
            cleanupInterval();
            intervalRef.current = setInterval(() => {
              if (newSound.playing(playId)) {
                const currentTime = newSound.seek(playId);
                setState((prev) => ({
                  ...prev,
                  currentTime:
                    typeof currentTime === "number" ? currentTime : 0,
                }));
              }
            }, 250);
          },
          onpause: (pauseId) => {
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
        setState((prev) => ({ ...prev, rate: 1 })); //? do we need this?
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
    play: useCallback(
      (id?: number) => {
        if (sound?.state() === "loaded") {
          const playId = id ? sound.play(id) : sound.play();
          return playId;
        }
      },
      [sound]
    ),

    pause: useCallback(
      (id?: number) => {
        if (sound && (id ? sound.playing(id) : sound.playing())) {
          sound.pause(id);
        }
      },
      [sound]
    ),

    stop: useCallback(() => {
      if (sound) {
        sound.stop();
        cleanupInterval();
      }
    }, [sound, cleanupInterval]),
    rate: useCallback(
      (rate: number) => {
        if (sound) {
          const clampedRate = Math.max(0.5, Math.min(rate, 4)); //force max + min rates
          sound.rate(clampedRate);
          setState((prev) => ({ ...prev, rate: clampedRate })); //sync state with new rate
        }
      },
      [sound]
    ),
    isPlaying: useCallback(
      (id?: number) => {
        return sound ? sound.playing(id) : false;
      },
      [sound]
    ),
    getCurrentTime: useCallback(
      (id?: number) => {
        if (!sound) return 0;
        return sound.seek(id);
      },
      [sound]
    ),

    getDuration: useCallback(() => {
      if (!sound) return 0;
      return sound.duration();
    }, [sound]),

    seek: useCallback(
      (time: number, id?: number) => {
        if (sound) {
          if (id) {
            sound.seek(time, id);
          } else {
            sound.seek(time);
          }
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
