import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AppState } from "@/types/state";

/**
 * Zustand store for managing the application state
 * @returns {AppState}
 */
const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      audioFile: null,
      editor: null,
      transcriptionData: null,
      currentDocumentPath: null,
      highConfidence: 0.8,
      lowConfidence: 0.6,
      includeConfidence: true,
      transcriptReady: false,

      // Actions to update state
      setAudioFile: (file) => set({ audioFile: file }),
      setEditor: (editor) => set({ editor }),
      setTranscriptionData: (data) => set({ transcriptionData: data }),
      toggleConfidence: (include) => set({ includeConfidence: include }),
      setTranscriptReady: (ready) => set({ transcriptReady: ready }),
      resetState: () =>
        set({
          audioFile: null,
          editor: null,
          transcriptionData: null,
          currentDocumentPath: null,
          highConfidence: 0.8,
          lowConfidence: 0.6,
          includeConfidence: true,
          transcriptReady: false,
        }),
    }),
    {
      name: "transcription-app-storage", // unique name
      storage: createJSONStorage(() => localStorage), // use localStorage for persistence
      partialize: (state) => ({
        currentDocumentPath: state.currentDocumentPath,
        includeConfidence: state.includeConfidence,
        highConfidence: state.highConfidence,
        lowConfidence: state.lowConfidence,
      }),
    }
  )
);

export default useAppStore;
