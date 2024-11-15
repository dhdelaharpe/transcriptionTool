import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Controls from '../../components/Controls';
import useAppStore from '../../store/useAppStore';
import { DocumentData, ExportOptions } from '@/types/general';

// Mock the useAppStore hook
jest.mock('../../store/useAppStore', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    audioFile: null,
    setAudioFile: jest.fn(),
    setTranscriptionData: jest.fn(),
  })),
}));

// Mock window.electron API
global.window.electron = {
  document: {
      save: function (data: DocumentData, path?: string): Promise<string> {
          throw new Error('Function not implemented.');
      },
      load: function (path: string): Promise<DocumentData> {
          throw new Error('Function not implemented.');
      },
      export: function (data: DocumentData, options: ExportOptions): Promise<boolean> {
          throw new Error('Function not implemented.');
      },
      watch: function (callback: (event: 'change' | 'delete', path?: string) => void): () => void {
          throw new Error('Function not implemented.');
      }
  }, // Added missing 'document' property
  //TODO: add hid routes
  //hid:{
    //list: ,
  //}
  file: {
      openDialog: jest.fn().mockResolvedValue(['input_files/test.wav']),
      copyToInputFiles: jest.fn().mockResolvedValue('input_files/test.wav'),
      getAppPath: jest.fn().mockResolvedValue('mocked/app/path'), // Implemented function
  },
  transcription: {
      start: jest.fn(),
      getStatus: jest.fn().mockResolvedValue('idle'), // Implemented function
      cancel: jest.fn().mockResolvedValue(''), // Implemented function
  },
};
          

describe('Controls Component', () => {
  const mockOnExport = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders buttons and model selector', () => {
    render(<Controls onExport={mockOnExport} />);

    expect(screen.getByLabelText('Open audio file')).toBeInTheDocument();
    expect(screen.getByLabelText('Generate transcript')).toBeInTheDocument();
    expect(screen.getByLabelText('Export to Word')).toBeInTheDocument();
    expect(screen.getByLabelText('Select transcription model')).toBeInTheDocument();
  });

  test('opens file dialog when "Import Audio File" button is clicked', async () => {
    render(<Controls onExport={mockOnExport} />);

    fireEvent.click(screen.getByLabelText('Open audio file'));

    await waitFor(() => {
      expect(window.electron.file.openDialog).toHaveBeenCalledWith({
        type: 'audio',
        multiple: false,
      });
    });
  });


  /* need to think about how test this*
  test('starts transcription when "Generate Transcript" button is clicked', async () => {
    const mockSetAudioFile = jest.fn();
    (useAppStore as unknown as jest.Mock).mockReturnValue({
      audioFile: 'media://test.wav',
      setAudioFile: mockSetAudioFile,
      setTranscriptionData: jest.fn(),
    });

    render(<Controls onExport={mockOnExport} />);

    fireEvent.click(screen.getByLabelText('Generate transcript'));

    await waitFor(() => {
      expect(window.electron.transcription.start).toHaveBeenCalled();
    });
  });
*/
  test('calls onExport when "Export to Word" button is clicked', () => {
    render(<Controls onExport={mockOnExport} />);

    fireEvent.click(screen.getByLabelText('Export to Word'));

    expect(mockOnExport).toHaveBeenCalled();
  });

  test('changes model when a different option is selected', () => {
    render(<Controls onExport={mockOnExport} />);

    fireEvent.change(screen.getByLabelText('Select transcription model'), {
      target: { value: 'large-v2' },
    });

    expect(screen.getByLabelText('Select transcription model')).toHaveValue('large-v2');
  });
});
