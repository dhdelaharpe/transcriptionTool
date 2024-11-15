import { BrowserWindow } from "electron";
import { spawn } from "child_process";
import { createAppPathService } from "./file-service";

/**
 * Creates a transcription service to handle audio file transcription
 * @param {BrowserWindow} mainWindow - The main window instance
 * @returns {TranscriptionService} A transcription service object containing methods to start, cancel, and get the status of transcription
 */
export const createTranscriptionService = (mainWindow: BrowserWindow) => {
  let currentProcess: ReturnType<typeof spawn> | null = null; //track current process
  const appPathService = createAppPathService(mainWindow); // TODO: migrate to use already running service

  /**
   * Starts the transcription process
   * @param {string} filePath - The path to the audio file to be transcribed
   * @param {string} model - The model to use for transcription, defaults to "base"
   * @returns {Promise<void>} A promise that resolves when the transcription is complete
   * @throws Will throw an error if transcription is already in progress or fails 
   */
  const startTranscription = async (
    filePath: string,
    model: string = "base"
  ): Promise<void> => {
    try {
      if (currentProcess) {
        // prevent starting transcription if already in progress
        throw new Error("Transcription already in progress");
      }
      //get the application path to locate the transcription executable
      const appPath = await appPathService.getAppPath();
      const transcribePath = `${appPath}/bin/${
        process.platform === "win32" ? "transcribe.exe" : "transcribe"
      }`;
      //start the transcription process
      return new Promise((resolve, reject) => {
        const decodePath = decodeURIComponent(filePath.replace("media://", ""));

        currentProcess = spawn(transcribePath, [decodePath, model]);

        currentProcess.stdout?.on("data", (data) => {
          console.log("Python output:", data.toString());
        });

        currentProcess.stderr?.on("data", (data) => {
          console.error("Python error:", data.toString());
        });

        currentProcess.on("close", (code) => {
          console.log("Python process finished with code:", code);
          currentProcess = null;
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Transcription failed with code ${code}`));
          }
        });
      });
    } catch (error) {
      console.error("Error in startTranscription:", error);
      console.error("Stack trace:", error.stack);
      throw new Error(
        `Transcription Service: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };
  const cancelTranscription = async (): Promise<void> => {
    if (currentProcess) {
      currentProcess.kill("SIGKILL");
      currentProcess = null;
    }
  };
  const getStatus = async (): Promise<"idle" | "processing"> => {
    return currentProcess ? "processing" : "idle";
  };
  return {
    startTranscription,
    cancelTranscription,
    getStatus,
  };
};

export type TranscriptionService = ReturnType<
  typeof createTranscriptionService
>;
