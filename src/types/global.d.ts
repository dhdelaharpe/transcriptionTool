import type { ElectronBridge } from "./general";
import '@testing-library/jest-dom';
declare global {
    interface Window {
        electron: ElectronBridge;
    }
}