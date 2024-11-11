import { BrowserWindow } from "electron";
import * as HID from "node-hid";

// Error handling
const createError = (message: string): Error =>
  new Error(`HIDService: ${message}`);

// Type for our async HID device
type AsyncHIDDevice = {
  close: () => Promise<void>;
  read: () => Promise<Buffer>;
  write: (data: number[]) => Promise<number>;
  on: (event: string, handler: (data: any) => void) => void;
  removeListener: (event: string, handler: (data: any) => void) => void;
};

/**
 * Creates a HID service to handle footpedal device interactions
 * @param {BrowserWindow} mainWindow - The main window instance
 */
export const createHidService = (mainWindow: BrowserWindow) => {
  let currentDevice: AsyncHIDDevice | null = null;
  let dataHandler: ((data: Buffer) => void) | null = null;
  let errorHandler: ((error: Error) => void) | null = null;

  const setupDeviceListeners = (device: AsyncHIDDevice) => {
    // Remove any existing listeners
    if (dataHandler) device.removeListener('data', dataHandler);
    if (errorHandler) device.removeListener('error', errorHandler);

    // Create new listeners
    dataHandler = (data: Buffer) => {
      mainWindow.webContents.send('hid:data', Array.from(data));
    };

    errorHandler = (error: Error) => {
      console.error('Device error:', error);
      mainWindow.webContents.send('hid:error', error.message);
    };

    // Attach new listeners
    device.on('data', dataHandler);
    device.on('error', errorHandler);
  };

  const cleanupDevice = async () => {
    if (currentDevice) {
      if (dataHandler) currentDevice.removeListener('data', dataHandler);
      if (errorHandler) currentDevice.removeListener('error', errorHandler);
      await currentDevice.close();
      currentDevice = null;
      dataHandler = null;
      errorHandler = null;
    }
  };

  /**
   * Lists all available HID devices
   */
  const list = async (): Promise<HID.Device[]> => {
    try {
      console.log('Listing HID devices...');
      const devices = await HID.devicesAsync();
      console.log('Found devices:', devices);
      
      return devices.map(device => ({
        vendorId: device.vendorId,
        productId: device.productId,
        manufacturer: device.manufacturer,
        product: device.product,
        release: device.release || 0, 
        path: device.path,
        serialNumber: device.serialNumber,
        interface: device.interface
      }));
    } catch (error) {
      console.error('Error listing HID devices:', error);
      throw createError(
        error instanceof Error
          ? error.message
          : "Unknown error listing HID devices"
      );
    }
  };

  /**
   * Connects to a specific HID device
   */
  const connect = async (
    vendorId: number,
    productId: number
  ): Promise<boolean> => {
    try {
      console.log(`Connecting to device: ${vendorId}:${productId}`);
      
      // Cleanup any existing connection
      await cleanupDevice();

      // Create new connection using async open
      const device = await HID.HIDAsync.open(vendorId, productId);
      
      // Verify device has required methods
      if (!device || 
          typeof device.close !== 'function' ||
          typeof device.read !== 'function' ||
          typeof device.write !== 'function' ||
          typeof device.on !== 'function' ||
          typeof device.removeListener !== 'function') {
        throw new Error('Invalid HID device instance');
      }

      currentDevice = device;
      
      // Setup listeners only after successful connection
      setupDeviceListeners(currentDevice);
      
      console.log('Successfully connected to device');
      return true;
    } catch (error) {
      await cleanupDevice();
      console.error('Error connecting to HID device:', error);
      throw createError(
        error instanceof Error
          ? error.message
          : "Unknown error connecting to HID device"
      );
    }
  };

  /**
   * Disconnects from the current HID device
   */
  const disconnect = async (): Promise<boolean> => {
    try {
      console.log('Disconnecting device');
      await cleanupDevice();
      return true;
    } catch (error) {
      console.error('Error disconnecting HID device:', error);
      throw createError(
        error instanceof Error
          ? error.message
          : "Unknown error disconnecting HID device"
      );
    }
  };

  // Cleanup on window close
  mainWindow.on('closed', () => {
    cleanupDevice().catch(error => {
      console.error('Error cleaning up device on window close:', error);
    });
  });

  // Initial debug log
  console.log('HID Service created');
  
  return {
    list,
    connect,
    disconnect,
  } as const;
};

// Type for the returned service
export type HIDService = ReturnType<typeof createHidService>;