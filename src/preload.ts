import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import type {
  ElectronBridge,
  DocumentChangeCallback,
  DocumentChangeEvent,
  FileDialogOptions,
  DocumentData,
  ExportOptions,
  TranscriptionOptions,
} from '@/types/general';

/**
 * Exposes the Electron Bridge to the renderer process
 * @type {ElectronBridge}
 * provides access to file, document, and transcription services
 */
const electronBridge: ElectronBridge = {
  file: {
    /**
     * Opens a file dialog to select files
     * @param {FileDialogOptions} options - The options for the file dialog
     * @returns {Promise<string[]>} A promise that resolves to an array of file paths
     */
    openDialog: (options: FileDialogOptions) => ipcRenderer.invoke('file:open-dialog', options),
    /**
     * Gets the application path
     * @returns {Promise<string>} A promise that resolves to the application path
     */
    getAppPath: () => ipcRenderer.invoke('file:get-app-path'),
    /**
     * Copies a file to the input_files directory
     * @param {string} path - The path to the source file
     * @returns {Promise<string>} A promise that resolves to the path to the copied file
     */
    copyToInputFiles: (path: string) => ipcRenderer.invoke('file:copyToInputFiles', path),
  },
  document: {
    /**
     * Saves the document data to a file
     * @param {DocumentData} data - The document data to save
     * @param {string} path - The path to save the document to
     * @returns {Promise<void>} A promise that resolves when the document is saved
     */
    save: (data:DocumentData, path:string) => ipcRenderer.invoke('document:save', data, path),
    /**
     * Loads a document from a file
     * @param {string} path - The path to the document file
     * @returns {Promise<DocumentData>} A promise that resolves to the document data
     */
    load: (path:string) => ipcRenderer.invoke('document:load', path),
    /**
     * Exports the document data to a file
     * @param {DocumentData} data - The document data to export
     * @param {ExportOptions} options - The export options
     * @returns {Promise<void>} A promise that resolves when the document is exported
     */
    export: (data:DocumentData, options:ExportOptions) => ipcRenderer.invoke('document:export', data, options),
    /**
     * Watches for changes to the document
     * @param {DocumentChangeCallback} callback - The callback function to handle the document change event
     * @returns {Function} A function to remove the document change listener
     */
    watch: (callback: DocumentChangeCallback) => {
        const ipcCallback = (_event: IpcRendererEvent, type: DocumentChangeEvent, path?: string) => {
            callback(type, path);
          };
          
      ipcRenderer.on('document:change', ipcCallback);
      return () => ipcRenderer.removeListener('document:change', ipcCallback);
    },
  },
  transcription: {
    /**
     * Starts the transcription process
     * @param {string} path - The path to the audio file to be transcribed
     * @param {string} model - The model to use for transcription, defaults to "base"
     * @returns {Promise<void>} A promise that resolves when the transcription is complete
     */
    start: (path:string, model:string) => ipcRenderer.invoke('transcription:start', path,model),
    /**
     * Gets the status of the transcription
     * @returns {Promise<string>} A promise that resolves to the transcription status
     */
    getStatus: () => ipcRenderer.invoke('transcription:status'),
    /**
     * Cancels the transcription process
     * @returns {Promise<void>} A promise that resolves when the transcription is canceled
     */
    cancel: () => ipcRenderer.invoke('transcription:cancel'),
  },
};
//expose the electron bridge to the renderer process
contextBridge.exposeInMainWorld('electron', electronBridge);