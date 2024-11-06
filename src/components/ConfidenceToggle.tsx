import React from "react";

interface ConfidenceToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
  }
  
  /**
   * Component that renders the confidence toggle for the application
   * @param {ConfidenceToggleProps} props - The props for the confidence toggle
   * @param {boolean} checked - The checked state of the toggle
   * @param {Function} onChange - The function to handle the change event
   * @returns {JSX.Element}
   */
  const ConfidenceToggle = ({ checked, onChange }: ConfidenceToggleProps) => {
    return (
      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md mb-5">
        <span>Include Confidence</span>
        <label className="relative inline-block w-[30px] h-[17px]">
          <input
            type="checkbox"
            className="opacity-0 w-0 h-0"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)} />
          <span className={`absolute cursor-pointer inset-0 bg-gray-300 rounded-full transition-colors before:absolute before:content-[''] before:h-[13px] before:w-[13px] before:left-[2px] before:bottom-[2px] before:bg-white before:transition-transform before:rounded-full ${
            checked ? "bg-blue-500 before:transform before:translate-x-[13px]" : ""
          }`} />
        </label>
      </div>
    );
  };
  
  export default ConfidenceToggle;