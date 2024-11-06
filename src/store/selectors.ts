import { AppState } from '@/types/state';

// Basic selectors
export const selectAudioFile = (state: AppState) => state.audioFile;
export const selectEditor = (state: AppState) => state.editor;
export const selectTranscriptionData = (state: AppState) => state.transcriptionData;

// Computed selectors
export const selectCanTranscribe = (state: AppState) => 
  state.audioFile !== null && !state.transcriptionData;

export const selectCanExport = (state: AppState) =>
  state.transcriptionData !== null && state.editor !== null;

export const selectTranscriptionState = (state: AppState) => ({
  transcriptionData: state.transcriptionData,
  highConfidence: state.highConfidence,
  lowConfidence: state.lowConfidence,
  includeConfidence: state.includeConfidence,
}); 

