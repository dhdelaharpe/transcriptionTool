import React from "react";

interface ProgressBarProps {
    progress: number;
    className?: string;
  }
  
  const ProgressBar = ({ progress, className = '' }: ProgressBarProps) => {
    return (
      <div 
        className={`flex-grow h-5 bg-gray-200 rounded-full overflow-hidden ${className}`}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div 
          className="h-full bg-blue-600 transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    );
  };
  
  export default ProgressBar;