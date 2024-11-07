import useAppStore from "@/store/useAppStore";
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
const FormatButton = ({
  format,
  icon,
  isActive,
  onClick,
}: FormatButtonProps) => (
  <button
    className={`p-2 rounded hover:bg-gray-100 ${isActive ? "bg-gray-200" : ""}`}
    onClick={onClick}
    aria-label={`Format text as ${format}`}
    data-format={format}
  >
    {icon}
  </button>
);

/**
 * Component that renders the formatting toolbar for the application
 * @returns {JSX.Element}
 */
const FormattingToolbar = () => {
  const editor = useAppStore((state) => state.editor);
  /**
   * Handles the formatting of the text
   * @param {string} format - The format to apply
   */
  const handleFormat = (format: string) => {
    switch (format) {
      case "bold":
        editor.commands.toggleBold();
        break;
      case "italic":
        editor.commands.toggleItalic();
        break;
      case "underline":
        editor.commands.toggleUnderline();
        break;
      case "superscript":
        editor.commands.toggleSuperscript();
        break;
      case "subscript":
        editor.commands.toggleSubscript();
        break;
      case "ordered-list":
        editor.commands.toggleOrderedList();
        break;
      case "bullet-list":
        editor.commands.toggleBulletList();
        break;
      case "align-left":
        editor.commands.setTextAlign('left');
        break;
      case "align-right":
        editor.commands.setTextAlign('right');
      case "align-justify":
        editor.commands.setTextAlign('justify');
    }
  };

  return (
    <div className="flex gap-2 mb-3 border-b border-gray-200 pb-2">
      <FormatButton
        format="bold"
        icon={<strong>B</strong>}
        onClick={() => handleFormat("bold")}
      />
      <FormatButton
        format="italic"
        icon={<em>I</em>}
        onClick={() => handleFormat("italic")}
      />
      <FormatButton
        format="underline"
        icon={<u>U</u>}
        onClick={() => handleFormat("underline")}
      />
      <FormatButton
        format="superscript"
        icon="x²"
        onClick={() => handleFormat("superscript")}
      />
      <FormatButton
        format="subscript"
        icon="x₂"
        onClick={() => handleFormat("subscript")}
      />
      <FormatButton
        format="ordered-list"
        icon="1."
        onClick={() => handleFormat("ordered-list")}
      />
      <FormatButton
        format="bullet-list"
        icon="•"
        onClick={() => handleFormat("bullet-list")}
      />
      <FormatButton 
      format="align-left"
      icon="<-"
      onClick={()=> handleFormat('align-left')}
      />
      <FormatButton
      format="align-right"
      icon="->"
      onClick={()=>handleFormat('align-right')}
      />
      <FormatButton
      format="align-justify"
      icon="||"
      onClick={()=>handleFormat("align-justify")}
      />
    </div>
  );
};

export default FormattingToolbar;
