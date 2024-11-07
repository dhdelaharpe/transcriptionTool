import { renderHook, act } from '@testing-library/react-hooks';
import { useAudio } from '../../hooks/useAudio';
import { Howl } from 'howler';

// Create a mock Howl class with event handlers
let mockHowlInstance: any;
const createMockHowl = (config: any) => {
  mockHowlInstance = {
    state: jest.fn().mockReturnValue('loaded'),
    play: jest.fn().mockImplementation(() => config.onplay?.()),
    pause: jest.fn().mockImplementation(() => config.onpause?.()),
    stop: jest.fn().mockImplementation(() => config.onstop?.()),
    seek: jest.fn(),
    unload: jest.fn(),
    playing: jest.fn().mockReturnValue(true),
    duration: jest.fn().mockReturnValue(100),
    onload: config.onload,
    onplay: config.onplay,
    onpause: config.onpause,
    onstop: config.onstop,
    onend: config.onend,
    onloaderror: config.onloaderror
  };
  return mockHowlInstance;
};

// Mock howler
jest.mock('howler', () => ({
  Howl: jest.fn().mockImplementation((config) => createMockHowl(config))
}));

// Setup fetch mock
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK'
  } as Response)
) as jest.Mock;

describe('useAudio', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (global.fetch as jest.Mock).mockClear();
    mockHowlInstance = null;
    jest.spyOn(global, 'setInterval');
    jest.spyOn(global, 'clearInterval');
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('should initialize with default state', () => {
    const { result } = renderHook(() => useAudio(null));
    expect(result.current).toEqual({
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      isLoaded: false,
      error: null,
      controls: expect.any(Object)
    });
  });

  test('should load audio when URL is provided', async () => {
    const audioUrl = 'media://test.wav';
    const { result } = renderHook(() => useAudio(audioUrl));

    await act(async () => {
      await Promise.resolve(); // Wait for fetch
      mockHowlInstance.onload();
    });

    expect(result.current.isLoaded).toBe(true);
    expect(result.current.duration).toBe(100);
    expect(result.current.error).toBeNull();
  });

  test('should handle play control', async () => {
    const audioUrl = 'media://test.wav';
    const { result } = renderHook(() => useAudio(audioUrl));

    await act(async () => {
      await Promise.resolve();
      mockHowlInstance.onload();
    });

    act(() => {
      result.current.controls.play();
      mockHowlInstance.onplay();
    });

    expect(result.current.isPlaying).toBe(true);
  });

  test('should handle pause control', async () => {
    const audioUrl = 'media://test.wav';
    const { result } = renderHook(() => useAudio(audioUrl));

    await act(async () => {
      await Promise.resolve();
      mockHowlInstance.onload();
    });

    act(() => {
      result.current.controls.pause();
      mockHowlInstance.onpause();
    });

    expect(result.current.isPlaying).toBe(false);
  });

  test('should handle seek control', async () => {
    const audioUrl = 'media://test.wav';
    const { result } = renderHook(() => useAudio(audioUrl));

    await act(async () => {
      await Promise.resolve();
      mockHowlInstance.onload();
    });

    act(() => {
      result.current.controls.seek(50);
    });

    expect(result.current.currentTime).toBe(50);
  });

  test('should handle load errors', async () => {
    const audioUrl = 'media://test.wav';
    const { result } = renderHook(() => useAudio(audioUrl));

    await act(async () => {
      await Promise.resolve();
      mockHowlInstance.onloaderror(1, 'Load failed');
    });

    expect(result.current.error).toBe('Failed to load audio');
    expect(result.current.isLoaded).toBe(false);
  });

  test('should handle fetch errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Fetch failed'));
    
    const audioUrl = 'media://test.wav';
    const { result } = renderHook(() => useAudio(audioUrl));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBe('Error loading audio');
    expect(result.current.isLoaded).toBe(false);
  });

  test('should cleanup on unmount', async () => {
    const audioUrl = 'media://test.wav';
    
    // Create a promise to track when Howl is instantiated
    let resolveHowl: (value: void) => void;
    const howlCreated = new Promise<void>(resolve => {
      resolveHowl = resolve;
    });

    (Howl as jest.Mock).mockImplementationOnce(config => {
      mockHowlInstance = createMockHowl(config);
      resolveHowl();
      return mockHowlInstance;
    });

    const { unmount } = renderHook(() => useAudio(audioUrl));

    // Wait for Howl to be created and loaded
    await act(async () => {
      await howlCreated;
      mockHowlInstance.onload();
    });

    // Unmount and wait for cleanup
    await act(async () => {
      unmount();
      await Promise.resolve(); // Flush effects
    });

    expect(mockHowlInstance.unload).toHaveBeenCalled();
  });

  // Let's also add a test for sound state cleanup
  test('should cleanup sound state when audioUrl changes', async () => {
    const firstUrl = 'media://test1.wav';
    const secondUrl = 'media://test2.wav';
    let firstHowlInstance: any;
    let secondHowlInstance: any;
    let howlCallCount = 0;

    (Howl as jest.Mock).mockImplementation(config => {
      const instance = createMockHowl(config);
      if (howlCallCount === 0) {
        firstHowlInstance = instance;
      } else {
        secondHowlInstance = instance;
      }
      howlCallCount++;
      return instance;
    });

    const { rerender } = renderHook(
      (url) => useAudio(url),
      { initialProps: firstUrl }
    );

    // Wait for first Howl to load
    await act(async () => {
      await Promise.resolve();
      firstHowlInstance.onload();
    });

    // Change URL
    rerender(secondUrl);

    // Verify first instance was cleaned up
    expect(firstHowlInstance.unload).toHaveBeenCalled();
  });

  test('should cleanup interval when audio stops', async () => {
    const audioUrl = 'media://test.wav';
    const { result } = renderHook(() => useAudio(audioUrl));

    await act(async () => {
      await Promise.resolve();
      mockHowlInstance.onload();
    });

    // Start playing
    act(() => {
      result.current.controls.play();
      mockHowlInstance.onplay();
      jest.runOnlyPendingTimers();
    });

    expect(global.setInterval).toHaveBeenCalled();

    // Stop playing
    act(() => {
      result.current.controls.stop();
      mockHowlInstance.onstop();
    });

    expect(global.clearInterval).toHaveBeenCalled();
  });

  test('should update currentTime while playing', async () => {
    const audioUrl = 'media://test.wav';
    const { result } = renderHook(() => useAudio(audioUrl));

    await act(async () => {
      await Promise.resolve();
      mockHowlInstance.onload();
    });

    // Mock seek to return increasing time values
    let currentTime = 0;
    mockHowlInstance.seek.mockImplementation(() => currentTime);

    act(() => {
      result.current.controls.play();
      mockHowlInstance.onplay();
    });

    // Advance timers and update currentTime
    act(() => {
      currentTime = 1.5;
      jest.advanceTimersByTime(250);
    });

    expect(result.current.currentTime).toBe(1.5);
  });
});
