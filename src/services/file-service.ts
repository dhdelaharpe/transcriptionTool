import {
  BrowserWindow,
  dialog,
  FileFilter,
  OpenDialogOptions,
  app,
} from "electron";
import type { FileDialogOptions } from "../types/general";
import fs from "fs";
import path from "path";
// Types
type DialogFilters = Record<FileDialogOptions["type"], FileFilter[]>;
type DialogProperty = "openFile" | "multiSelections";

// Constants
const DIALOG_FILTERS: DialogFilters = {
  audio: [{ name: "Audio Files", extensions: ["wav", "mp3", "flac", "DS2"] }],
  document: [{ name: "Documents", extensions: ["json", "docx"] }],
};

// Pure functions
const getDialogProperties = (multiple: boolean): DialogProperty[] =>
  multiple ? ["openFile", "multiSelections"] : ["openFile"];

const getFiltersForType = (type: FileDialogOptions["type"]): FileFilter[] =>
  DIALOG_FILTERS[type] ?? [];

const createDialogOptions = (
  options: FileDialogOptions
): OpenDialogOptions => ({
  properties: getDialogProperties(options.multiple ?? false),
  filters: getFiltersForType(options.type),
});

// Error handling
const createError = (message: string): Error =>
  new Error(`FileService: ${message}`);

/**
 * Creates a file service to handle file dialogs and copying files to the input_files directory
 * @param {BrowserWindow} mainWindow - The main window instance
 * @returns {FileService} A file service object containing methods to open a file dialog and copy files to the input_files directory
 */
export const createFileService = (mainWindow: BrowserWindow) => {
  /**
   * Opens a file dialog to select one or multiple files
   * @param {FileDialogOptions} options - The options for the file dialog
   * @returns {Promise<string[]>} An array of file paths
   * @throws Will throw an error if the file dialog fails to open
   */
  const openDialog = async (options: FileDialogOptions): Promise<string[]> => {
    try {
      const dialogOptions = createDialogOptions(options);
      const result = await dialog.showOpenDialog(mainWindow, dialogOptions);

      if (result.canceled) {
        return [];
      }

      return result.filePaths;
    } catch (error) {
      throw createError(
        error instanceof Error
          ? error.message
          : "Unknown error during file dialog operation"
      );
    }
  };
  /**
   * Copies a file to the input_files directory
   * @param {string} sourcePath - The path to the source file
   * @returns {Promise<string>} The path to the copied file
   * @throws Will throw an error if the file fails to copy
   */
  const copyToInputFiles = async (sourcePath: string): Promise<string> => {
    try {
      const basePath = path.dirname(path.dirname(__dirname));
      const inputFilesDir = path.join(basePath, "input_files");

      if (!fs.existsSync(inputFilesDir)) {
        fs.mkdirSync(inputFilesDir, { recursive: true });
      }
      const fileName = path.basename(sourcePath);
      const destPath = path.join(inputFilesDir, fileName);
      await fs.promises.copyFile(sourcePath, destPath);
      return destPath;
    } catch (error) {
      throw createError("Error copying file to input_files directory");
    }
  };

  return {
    openDialog,
    copyToInputFiles,
  } as const;
};

export const createAppPathService = (mainWindow: BrowserWindow) => {
  const getAppPath = async (): Promise<string> => {
    try {
      const appPath = app.getAppPath();
      return appPath;
    } catch (error) {
      throw new Error(
        `FileService: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  return {
    getAppPath,
  } as const;
};

// Type for the returned service
export type FileService = ReturnType<typeof createFileService>;
export type AppPathService = ReturnType<typeof createAppPathService>;
