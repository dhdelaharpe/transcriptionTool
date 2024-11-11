import useAppStore from "@/store/useAppStore";
import React, { memo, useEffect, useState } from "react";
import { updateWordHighlights } from "@/hooks/wordHighlights";
import { useAudio } from "@/hooks/useAudio"; 

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

/**
 * Component that renders the audio controls for the application
 * @returns {JSX.Element}
 */
const AudioControls: React.FC = ():JSX.Element => {
  const [updateInterval, setUpdateInterval] = useState<
    number | NodeJS.Timeout | null
  >(null); // number+nodejstimeout for diff environments
  const editor = useAppStore((state) => state.editor);
  const { audioFile, transcriptionData } = useAppStore();
  const {rate, isPlaying, currentTime, duration, isLoaded, error, controls } =
    useAudio(audioFile);

/**
 * Handles key events for the audio controls
 */

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if(event.key==='F2'){
        const newRate = rate+0.25;
        controls.rate(newRate);
      }else if(event.key==='F1'){
        const newRate = rate-0.25;
        controls.rate(newRate);
      }
    }
    window.addEventListener('keydown',handleKeyDown);
    return () => window.removeEventListener('keydown',handleKeyDown);
  },[rate,controls])

  /**
   * Handles the play/pause button click
   */
  const handlePlayPause = () => {
    if (isPlaying) {
      controls.pause();
    } else {
      controls.play();
    }
  };
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

  return (
    <div className="flex flex-col gap-2 w-full max-w-xl mx-auto p-4 bg-gray-100 rounded-lg">
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

export default memo(AudioControls);
