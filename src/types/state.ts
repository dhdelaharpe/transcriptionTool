import type { Howl } from 'howler';
import type { Editor } from '@tiptap/react';
import { TranscriptionData } from './general';

export interface TranscriptionSegment {
    text: string;
    confidence: number;
    offsets: {
      from: number;
      to: number;
    };
    tokens: Array<{
      text: string;
      p: number;
      offsets: {
        from: number;
        to: number;
      };
    }>;
  }
  
  export interface AppState {
    // Audio-related state
    audioFile: string | null;
    // Editor-related state
    editor: Editor | null;
    transcriptionData: TranscriptionData|null;
    transcriptReady: boolean;
    currentDocumentPath: string | null;
  
    // Confidence settings
    highConfidence: number;
    lowConfidence: number;
    includeConfidence: boolean;
  
    // Actions
    setAudioFile: (file: string) => void;
    setEditor: (editor: Editor) => void;
    setTranscriptionData: (data: TranscriptionData) => void;
    toggleConfidence: (include: boolean) => void;
    setTranscriptReady: (ready: boolean) => void;
    resetState: () => void;
  }
