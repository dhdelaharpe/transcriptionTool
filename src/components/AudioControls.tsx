import useAppStore from "@/store/useAppStore";
import React, { memo, useEffect, useState, useCallback, useRef } from "react";
import { updateWordHighlights } from "@/hooks/wordHighlights";
import { useAudio } from "@/hooks/useAudio";
import { useFootPedal } from "@/hooks/useFootPedal";

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

/**
 * Component that renders the audio controls for the application
 * @returns {JSX.Element}
 */
const AudioControls: React.FC = (): JSX.Element => {
  const editor = useAppStore((state) => state.editor);
  const { audioFile, transcriptionData } = useAppStore();
  const [id, setId] = useState<number>(-1);
  const idRef = useRef<number>(-1);
  const { rate, isPlaying, currentTime, duration, isLoaded, error, controls } =
    useAudio(audioFile);

  /**
   * Handles key events for the audio controls
   */

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F2") {
        const newRate = rate + 0.25;
        controls.rate(newRate);
      } else if (event.key === "F1") {
        const newRate = rate - 0.25;
        controls.rate(newRate);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [rate, controls]);

  /**
   * Handles the play/pause button click
   */
  const handlePlayPause = useCallback(() => {
    if (!controls || !isLoaded) return;

    console.log("PlayPause - Current state:", {
      isPlaying,
      id: idRef.current,
      sound: controls,
    });

    if (isPlaying) {
      controls.pause(idRef.current);
    } else {
      if (idRef.current === -1) {
        const newId = controls.play();
        console.log("New audio instance created:", newId);
        idRef.current = newId;
        setId(newId);
      } else {
        console.log("Resuming existing audio:", idRef.current);
        controls.play(idRef.current);
      }
    }
  }, [controls, isLoaded, isPlaying]);

  const handleLeftPedal = useCallback(
    (pressed: boolean) => {
      if (!controls || !isLoaded || idRef.current === -1) return;

      const currentSeek = controls.getCurrentTime?.(idRef.current) || 0;

      console.log("Left pedal:", {
        pressed,
        currentId: idRef.current,
        currentSeek,
        hasControls: !!controls,
      });

      if (pressed) {
        // start continuous seeking backward
        const seekInterval = setInterval(() => {
          const currentTime = controls.getCurrentTime?.(idRef.current) || 0;
          const seekTo = Math.max(0, currentTime - 1);
          controls.seek(seekTo, idRef.current);
        }, 200);

        // store interval ID for cleanup
        (window as any).leftPedalInterval = seekInterval;
      } else {
        // clear interval on release
        clearInterval((window as any).leftPedalInterval);
      }
    },
    [controls, isLoaded]
  );

  const handleRightPedal = useCallback(
    (pressed: boolean) => {
      if (!controls || !isLoaded || idRef.current === -1) return;

      const currentSeek = controls.getCurrentTime?.(idRef.current) || 0;
      const totalDuration = controls.getDuration?.() || 0;

      console.log("Right pedal:", {
        pressed,
        currentId: idRef.current,
        currentSeek,
        totalDuration,
        hasControls: !!controls,
      });

      if (pressed) {
        // start continuous seeking forward
        const seekInterval = setInterval(() => {
          const currentTime = controls.getCurrentTime?.(idRef.current) || 0;
          const seekTo = Math.min(totalDuration, currentTime + 1);
          controls.seek(seekTo, idRef.current);
        }, 200);

        (window as any).rightPedalInterval = seekInterval;
      } else {
        clearInterval((window as any).rightPedalInterval);
      }
    },
    [controls, isLoaded]
  );

  const handleMiddlePedal = useCallback(
    (pressed: boolean) => {
      if (!controls || !isLoaded || idRef.current === -1) return;

      console.log("Middle pedal:", {
        pressed,
        currentId: idRef.current,
        hasControls: !!controls,
      });

      const isCurrentlyPlaying = controls.isPlaying?.(idRef.current);

      if (pressed) {
        if (!isCurrentlyPlaying) {
          controls.play(idRef.current);
        }
      } else {
        if (isCurrentlyPlaying) {
          controls.pause(idRef.current);
        }
      }
    },
    [controls, isLoaded]
  );

  // cleanup intervals on unmount
  useEffect(() => {
    return () => {
      clearInterval((window as any).leftPedalInterval);
      clearInterval((window as any).rightPedalInterval);
    };
  }, []);

  useEffect(() => {
    //using this to immediately set id of audio instance
    if (isLoaded && idRef.current === -1 && controls) {
      const newId = controls.play();
      idRef.current = newId;
      setId(newId);
      setTimeout(() => {
        // wait for audio to play before pausing
        controls.pause(newId);
      }, 50);
    }
  }, [isLoaded, controls]);
  useFootPedal({
    onLeftPedal: handleLeftPedal,
    onRightPedal: handleRightPedal,
    onMiddlePedal: handleMiddlePedal,
    enabled: isLoaded,
  });
  /**
   * Updates the word highlights when the audio is playing
   */
  useEffect(() => {
    if (isPlaying && editor && transcriptionData) {
      updateWordHighlights(currentTime * 1000, editor);
    }
  }, [isPlaying, currentTime]);
  /**
   * Handles the seek input change
   * @param {React.ChangeEvent<HTMLInputElement>} e - The change event
   */
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    controls.seek(parseFloat(e.target.value));
  };
  if (!audioFile || !isLoaded) return <></>;
  // Use the foot pedal hook

  return (
    <div
      className="flex flex-col gap-2 w-full max-w-xl mx-auto p-4 bg-gray-100 rounded-lg"
      data-audio-controls
    >
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{formatTime(currentTime)}</span>
        <span className="text-sm text-gray-600">/{rate}x/</span>
        <span className="text-sm text-gray-600">{formatTime(duration)}</span>
      </div>

      <input
        type="range"
        min="0"
        max={duration}
        value={currentTime}
        onChange={handleSeek}
        className="w-full"
      />

      <div className="flex justify-center">
        <button
          onClick={handlePlayPause}
          className="p-2 bg-blue-600 text-white rounded-full disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50 inline-flex items-center justify-center w-auto"
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
      </div>
    </div>
  );
};

AudioControls.displayName = "AudioControls";

const PlayIcon = memo(() => (
  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
      clipRule="evenodd"
    />
  </svg>
));

const PauseIcon = memo(() => (
  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
      clipRule="evenodd"
    />
  </svg>
));

PlayIcon.displayName = "PlayIcon";
PauseIcon.displayName = "PauseIcon";

export default AudioControls;
