import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Superscript from "@tiptap/extension-superscript";
import { WordMark } from "./extensions/WordMark";
import Underline from "@tiptap/extension-underline";
import Typography from "@tiptap/extension-typography";
import TextAlign from "@tiptap/extension-text-align";
import ListKeymap from "@tiptap/extension-list-keymap";
import Subscript from "@tiptap/extension-subscript";
import React, { useEffect } from "react";
import { processTranscriptionData } from "../utils/transcriptionRenderer";
import useAppStore from "../store/useAppStore";
import "./Editor.css";
interface EditorProps {
  content?: string;
  onChange?: (content: string) => void;
  showConfidence?: boolean;
}
/**
 * Component that renders the editor for the application
 * @param {EditorProps} props - The props for the editor
 * @param {string} content - The content of the editor
 * @param {boolean} showConfidence - Whether to show the confidence toggle
 * @returns {JSX.Element}
 */
const Editor = ({ content = "", onChange, showConfidence }: EditorProps) => {
  const transcriptionData = useAppStore((state) => state.transcriptionData);
  const setEditor = useAppStore((state) => state.setEditor);
  /**
   * init the editor instance
   */
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: {
          depth: 100,
          newGroupDelay: 500,
        },
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Superscript,
      WordMark,
      Typography,
      TextAlign.configure({
        alignments:['left','right','justify'],
        types:['heading','paragraph','wordMark']
      }),
      ListKeymap,
      Subscript
    ],
    content,
    /**
     * Handles the update event for the editor to save the content to local storage
     * @param {Object} editor - The editor instance
     */
    onUpdate: ({ editor }) => {
      const jsonContent = editor.getJSON();
      localStorage.setItem("editorContent", JSON.stringify(jsonContent));
    },
    editorProps:{
      //handle tab key to sink and lift list items
      handleKeyDown(view,event){
        if(event.key==='Tab'){
          event.preventDefault();
          if(event.shiftKey){
            editor.commands.liftListItem('listItem')
            return true;
          }
          editor.commands.sinkListItem('listItem')
          return true;
        }
        return false;
      }
    }
  });
  /**
   * Handles the editor instance to set the editor in the app store
   */
  useEffect(() => {
    if (!editor) return;
    setEditor(editor);
  }, [editor]);

  /**
   * Handles the transcription data to process and render
   */
  useEffect(() => {
    if (!transcriptionData) return;
    try {
      editor.commands.setContent('');
      processTranscriptionData(transcriptionData, editor); //render transcription data
    } catch (error) {
      console.error("Error processing transcription data", error);
    }
  }, [transcriptionData]);

  /**
   * Handles the undo button click
   */
  const handleUndo = () => {
    if (editor) {
      editor.chain().focus().undo().run();
    }
  };
  /**
   * Handles the redo button click
   */
  const handleRedo = () => {
    if (editor) {
      editor.chain().focus().redo().run();
    }
  };
  /**
   * Handles the restore button click
   */
  const handleRestore = () => {
    if (editor) {
      try {
        const confirm = window.confirm(
          "Are you sure you want to restore the last saved content?"
        );
        if (confirm) {
          const savedContent = JSON.parse(
            localStorage.getItem("editorContent")
          );
          editor.commands.setContent(savedContent);
        }
      } catch (error) {
        console.error("Error restoring editor content", error);
      }
    }
  };
  return (
    <div>
      <div className="flex space-x-2 mb-4">
        <button
          onClick={handleUndo}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Undo
        </button>
        <button
          onClick={handleRedo}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Redo
        </button>
        <button
          onClick={handleRestore}
          className="px-4 py-2 bg-red-200 rounded hover:bg-red-300"
        >
          Restore
        </button>
      </div>
      <div
        className={`border border-gray-200 rounded-md min-h-[400px] mt-5 ${
          showConfidence ? "" : "confidence-hidden"
        }`}
      >
        <EditorContent editor={editor} className="prose max-w-none p-4" />

      </div>
    </div>
  );
};

export default Editor;
