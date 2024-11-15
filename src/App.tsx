import React, { useState } from "react";
import AudioControls from "./components/AudioControls";
import ConfidenceToggle from "./components/ConfidenceToggle";
import Controls from "./components/Controls";
import Editor from "./components/Editor";
import FormattingToolbar from "./components/FormattingToolbar";
import LoadingIndicator from "./components/LoadingIndicator";
import StatusMessage from "./components/StatusMessage";
import TemplateSelector from "./components/TemplateSelector";
import { exportDocx } from "./utils/exportDocx";
import useAppStore from "./store/useAppStore";
import type { ContentNode } from "./types/general";
/**
 *  Main App component that renders the UI and handles state and events
 * @returns {JSX.Element}
 */
const App = () => {
  //state management
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "error" | "success" | "";
    message: string;
  }>({
    type: "",
    message: "",
  });
  const [selectedTemplate, setSelectedTemplate] = useState("Document");
  const [showConfidence, setShowConfidence] = useState(true);
  const editor = useAppStore((state)=>state.editor);
  /**
   * Handles the export of the document using the selected template
   */
  const handleExport =()=>{
    if(!editor){
      setStatus({type:"error",message:"Editor not initialized yet"});
      return;
    }
    const content = editor.getJSON().content;
    exportDocx(content as ContentNode[], selectedTemplate);
    setStatus({ type: "success", message: "Document Exported" });
  };
  return (
    <div className="min-h-screen bg-gray-100 p-5">
      <div className="container mx-auto bg-white rounded-lg shadow-sm p-5 ">
        <TemplateSelector selectedTemplate={selectedTemplate}
        onSelectTemplate={setSelectedTemplate}
        />
        <Controls
          onExport={handleExport}
        />
        <LoadingIndicator isLoading={isLoading} />
        <AudioControls />
        <ConfidenceToggle
          checked={showConfidence}
          onChange={setShowConfidence}
        />
        <StatusMessage status={status} />
        <FormattingToolbar />
        <Editor showConfidence={showConfidence} />
      </div>
    </div>
  );
};

export default App;
