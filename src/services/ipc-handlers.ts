import { ipcMain } from "electron";
import { Services } from "./create-services";

export const setupIpcHandlers = (services: Services) => {
  ipcMain.handle("hid:list", async () => {
    try {
      const devices = await services.hidService.list();
      return devices;
    } catch (error) {
      console.error("Error in hid:list handler:", error);
      throw error;
    }
  });

  ipcMain.handle("hid:connect", async (_, vendorId: number, productId: number) => {
    try {
      const success = await services.hidService.connect(vendorId, productId);
      return success;
    } catch (error) {
      console.error("Error in hid:connect handler:", error);
      throw error;
    }
  });

  ipcMain.handle("hid:disconnect", async () => {
    try {
      const success = await services.hidService.disconnect();
      return success;
    } catch (error) {
      console.error("Error in hid:disconnect handler:", error);
      throw error;
    }
  });
  ipcMain.handle("file:open-dialog", async (event, options) => {
    try {
      const filePaths = await services.fileService.openDialog(options);
      return filePaths;
    } catch (error) {
      console.error("Error in open-file-dialog handler:", error);
      throw error;
    }
  });

  ipcMain.handle("file:get-app-path", async (event) => {
    try {
      const appPath = await services.appPathService.getAppPath();
      return appPath;
    } catch (error) {
      console.error("Error in get-app-path handler:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "transcription:start",
    async (_, path: string, model: string) => {
      try {
        await services.transcriptionService.startTranscription(path, model);
        return true;
      } catch (error) {
        console.error("Error in transcription:start handler:", error);
        throw error;
      }
    }
  );
  ipcMain.handle("transcription:cancel", async () => {
    try {
      await services.transcriptionService.cancelTranscription();
      return true;
    } catch (error) {
      console.error("Error in transcription:cancel handler:", error);
      throw error;
    }
  });
  ipcMain.handle("transcription:status", async () => {
    try {
      const status = await services.transcriptionService.getStatus();
      return status;
    } catch (error) {
      console.error("Error in transcription:status handler:", error);
      throw error;
    }
  });

  ipcMain.handle("file:copyToInputFiles", async (_, sourcePath: string) => {
    try {
      const destPath = await services.fileService.copyToInputFiles(sourcePath);
      return destPath;
    } catch (error) {
      console.error("Error in file:copyToInputFiles handler:", error);
      throw error;
    }
  });
  return () => {
    ipcMain.removeHandler("file:open-dialog");
    ipcMain.removeHandler("file:get-app-path");
    ipcMain.removeHandler("transcription:start");
    ipcMain.removeHandler("transcription:cancel");
    ipcMain.removeHandler("transcription:status");
    ipcMain.removeHandler("file:copyToInputFiles");
    ipcMain.removeHandler("hid:list");
    ipcMain.removeHandler("hid:connect");
    ipcMain.removeHandler("hid:disconnect");
  };
};
