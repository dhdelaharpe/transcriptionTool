import type { ElectronBridge } from "./general";

declare global {
    interface Window {
        electron: ElectronBridge;
    }
}