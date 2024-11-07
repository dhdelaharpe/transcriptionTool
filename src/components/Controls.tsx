import React, { useEffect, useState, useCallback } from "react";
import useAppStore from "../store/useAppStore";

import { selectTranscriptionData } from "@/store/selectors";
import { processTranscriptionData } from "@/utils/transcriptionRenderer";
interface ControlsProps {
  onExport: () => void; //potentially move transcribe and add as prop
}
/**
 * Controls component that provides UI elements for file handling, and transcription
 * @param {ControlsProps} props - 
 * @returns {JSX.Element}
 */
const Controls = ({ onExport }: ControlsProps) => {
  //state management for transcription model and file handling
  const [model, setModel] = useState<string>("base");
  const [isTranscribed, setIsTranscribed] = useState<boolean>(false);
  const [importPath, setImportPath] = useState<string | null>(null);
  const { audioFile, setAudioFile } = useAppStore();
  const setTranscriptionData = useAppStore(
    (state) => state.setTranscriptionData
  );
  /**
   * Handles the opening of a file dialog to select an audio file
   */
  const handleFileOpen = async () => {
    try {
      const filePaths = await window.electron.file.openDialog({
        type: "audio",
        multiple: false,
      });

      if (filePaths && filePaths.length > 0) {
        // use our custom protocol to load the file
        const selectedPath = filePaths[0];
        const isInInputFiles = selectedPath.includes("input_files");

        let finalPath = selectedPath;
        if (!isInInputFiles) {
          try {
            finalPath = await window.electron.file.copyToInputFiles(
              selectedPath
            );
          } catch (error) {
            console.error("Error importing file:", error);
          }
        }
        setImportPath(`media://${encodeURIComponent(finalPath)}`);
        setIsTranscribed(false);
        //resetState();
      }
    } catch (error) {
      console.error("Error in handleFileOpen:", error);
    }
  };

  const handleTranscribe = async () => {
    try {
      const res = await window.electron.transcription.start(importPath, model);
      setIsTranscribed(true);
    } catch (error) {
      console.error("Error in handleTranscribe:", error);
      setIsTranscribed(false); // Reset on error
    }
  };
  useEffect(() => {
    // trigger on importPath to handle setting audiofile
    if (!isTranscribed && !importPath) return;
    console.log("Transcription state updated:", isTranscribed);
    console.log("Import path:", importPath);
    console.log("Audio file:", audioFile);
    handleAudioLoad();
  }, [isTranscribed, importPath]);

  useEffect(() => {
    // trigger on audiofile update to fetch transcription file
    if (!audioFile) return;
    const decodedPath = decodeURIComponent(audioFile?.replace("media://", ""));
    const convertedPath = decodedPath.replace(
      /input_files\/(.+)\.(DS2|wav)/i,
      "output_files/$1.wav.json"
    );
    const finalPath = `media://${encodeURIComponent(convertedPath)}`;
    const fetchTranscription = async () => {
      try {
        const res = await fetch(finalPath);
        const data = await res.json();
        setTranscriptionData(data);
        console.log(data);
      } catch (error) {
        console.error("Error in handleTranscribe:", error);
      }
    };
    fetchTranscription();
  }, [audioFile]);

  const handleAudioLoad = async () => {
    if (importPath && isTranscribed) {
      setAudioFile(importPath);
      console.log("audio file set");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-5 p-3 bg-gray-50 rounded-md">
      <button
        onClick={handleFileOpen}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        aria-label="Open audio file"
      >
        Import Audio File
      </button>

      <button
        onClick={handleTranscribe}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        disabled={!importPath || isTranscribed}
        aria-label="Generate transcript"
      >
        Generate Transcript
      </button>


      <button
        onClick={onExport}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        disabled={false}
        aria-label="Export to Word"
      >
        Export to Word
      </button>
      <div className="flex items-center gap-2 ml-auto">
        <label className="text-gray-700 font-medium">Model:</label>
        <select
          className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          defaultValue="base"
          onChange={(e) => setModel(e.target.value)}
          aria-label="Select transcription model"
        >
          <option value="base">Base</option>
          <option value="large-v2">Large V2</option>
        </select>
      </div>
    </div>
  );
};

export default Controls;
