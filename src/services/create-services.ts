import { BrowserWindow } from "electron";
import { createFileService, createAppPathService } from "./file-service";
import { createTranscriptionService } from "./transcription-service";
import { createHidService } from "./hid-service";

export const createServices = (mainWindow: BrowserWindow) => {
  const fileService = createFileService(mainWindow);
  const appPathService = createAppPathService(mainWindow);
  const transcriptionService = createTranscriptionService(mainWindow);
  const hidService = createHidService(mainWindow);

  return {
    fileService,
    appPathService,
    transcriptionService,
    hidService,
  } as const;
};

export type Services = ReturnType<typeof createServices>;
