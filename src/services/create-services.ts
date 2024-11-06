import { BrowserWindow } from "electron";
import { createFileService, createAppPathService } from "./file-service";
import { createTranscriptionService } from "./transcription-service";

export const createServices = (mainWindow: BrowserWindow) => {
  const fileService = createFileService(mainWindow);
  const appPathService = createAppPathService(mainWindow);
  const transcriptionService = createTranscriptionService(mainWindow);
  return {
    fileService,
    appPathService,
    transcriptionService,
  } as const;
};

export type Services = ReturnType<typeof createServices>;
