import React from "react";

interface FormatButtonProps {
    format: string;
    icon: React.ReactNode;
    isActive?: boolean;
    onClick: () => void;
  }
  
  /**
   * Component that renders a formatting button for the application
   * @param {FormatButtonProps} props - The props for the formatting button
   * @returns {JSX.Element}
   */
  const FormatButton = ({ format, icon, isActive, onClick }: FormatButtonProps) => (
    <button
      className={`p-2 rounded hover:bg-gray-100 ${isActive ? 'bg-gray-200' : ''}`}
      onClick={onClick}
      aria-label={`Format text as ${format}`}
      data-format={format}
    >
      {icon}
    </button>
  );
  
  const FormattingToolbar = () => {
    const handleFormat = (format: string) => {
      // Implement formatting logic
    };
  
    return (
      <div className="flex gap-2 mb-3 border-b border-gray-200 pb-2">
        <FormatButton
          format="bold"
          icon={<strong>B</strong>}
          onClick={() => handleFormat('bold')}
        />
        <FormatButton
          format="italic"
          icon={<em>I</em>}
          onClick={() => handleFormat('italic')}
        />
        <FormatButton
          format="underline"
          icon={<u>U</u>}
          onClick={() => handleFormat('underline')}
        />
        <FormatButton
          format="superscript"
          icon="x²"
          onClick={() => handleFormat('superscript')}
        />
      </div>
    );
  };
  
  export default FormattingToolbar;