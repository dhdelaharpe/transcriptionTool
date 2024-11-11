import { app, BrowserWindow, protocol, net } from "electron";
import { createServices } from "./services/create-services";
import { setupIpcHandlers } from "./services/ipc-handlers";
import path from "path";
import fs from "fs";
// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

//create safe local fetch protocol scheme
protocol.registerSchemesAsPrivileged([
  {
    scheme: "media",
    privileges: {
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      stream: true,
    },
  },
]);
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

/**
 * Initializes the Electron App and create the main window
 */
let mainWindow: BrowserWindow | null = null;

const createWindow = (): void => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      webSecurity: true,
      
      nodeIntegration: true,
      contextIsolation: true,
    },
  });

  // Set CSP headers
  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [
            "default-src 'self' 'unsafe-inline' data:; media-src 'self' media: data: blob:; script-src 'self' 'unsafe-eval' 'unsafe-inline';",
          ],
        },
      });
    }
  );

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};





// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

app.on("ready", () => {
  //setup protocol for loading local files
  protocol.handle("media", async (request) => {
    try {
      const filePath = decodeURIComponent(request.url.slice("media://".length));
      const absolutePath = path.resolve(filePath);

      // Basic security check to prevent directory traversal
      if (!absolutePath || !require("fs").existsSync(absolutePath)) {
        return new Response("File not found", { status: 404 });
      }

      // get mime type 
      const ext = path.extname(absolutePath).toLowerCase();
      const mimeTypeMap: { [key: string]: string } = {
        ".mp3": "audio/mpeg",
        ".wav": "audio/wav",
        ".ogg": "audio/ogg",
      };
      const mimeType = mimeTypeMap[ext] || "application/octet-stream";

      const fileSize = fs.statSync(absolutePath).size;
      const range =request.headers.get("Range");
      //if range is provided, handle partial content request -- howler requires this to get duration properly 
      if(range){
        const parts = range.replace(/bytes=/,"").split("-");
        const start = parseInt(parts[0],10);
        const end = parts[1]? parseInt(parts[1],10): fileSize-1;

        if(start>=fileSize||end>=fileSize){
          return new Response('Requested range not satisfiable',{
            status:416,
            headers:{
              "Content-Range":`bytes */${fileSize}`
            }
          });
        }
        const chunkSize = (end-start)+1;
          // file as buffer and return as stream
      const stream = fs.createReadStream(absolutePath,{start,end}); //{start,end}
        const readableStream = new ReadableStream({
          start(controller){
            stream.on('data',(chunk)=>controller.enqueue(chunk));
            stream.on('end',()=>controller.close());
            stream.on('error',(err)=>controller.error(err));
          }
        });
      return new Response(readableStream,{
        status:206,
        headers:{
          'Content-Range':`bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges':'bytes',
          'Content-Length':chunkSize.toString(),
          'Content-Type':mimeType,
        },
      });
      }else{
        const stream = fs.createReadStream(absolutePath);
        const readableStream = new ReadableStream({
          start(controller){
            stream.on('data',(chunk)=>controller.enqueue(chunk));
            stream.on('end',()=>controller.close());
            stream.on('error',(err)=>controller.error(err));
          }
        });
        return new Response(readableStream,{
          headers:{
            'Content-Length':fileSize.toString(),
            'Content-Type':mimeType,
            'Accept-Ranges':'bytes',
          },
        });
      }
    } catch (error) {
      console.error("Protocol handler error:", error);
      return new Response("Error accessing file", { status: 500 });
    }
  });

  createWindow();
  if (mainWindow) {
    const services = createServices(mainWindow);
    const cleanupHandlers = setupIpcHandlers(services);
    console.log("Services created and IPC handlers set up");
    mainWindow.on("close", () => {
      cleanupHandlers();
      mainWindow = null;
    });
  }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
