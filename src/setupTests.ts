import '@testing-library/jest-dom'
import 'jest-canvas-mock'

// Mock electron
jest.mock('electron', () => ({
  ipcRenderer: {
    on: jest.fn(),
    send: jest.fn(),
    invoke: jest.fn()
  }
}))