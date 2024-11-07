import { processTranscriptionData } from "../../utils/transcriptionRenderer";
import { TranscriptionData } from "../../types/general";

describe("processTranscriptionData", () => {
  const mockEditor = {
    chain: jest.fn().mockReturnThis(),
    insertContent: jest.fn().mockReturnThis(),
    run: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should process valid transcription data correctly", () => {
    const mockData: TranscriptionData = {
      transcription: [
        {
          timestamps: {
            from: "00:00:00,000",
            to: "00:00:02,000",
          },
          offsets: {
            from: 0,
            to: 2000,
          },
          text: "Hello world",
          tokens: [
            {
              text: "[_BEG_]",
              timestamps: {
                from: "00:00:00,000",
                to: "00:00:00,000",
              },
              offsets: {
                from: 0,
                to: 0,
              },

              p: 0.939141,
              t_dtw: -1,
            },
            {
              text: "Hello",
              timestamps: {
                from: "00:00:00,100",
                to: "00:00:00,500",
              },
              offsets: {
                from: 100,
                to: 500,
              },

              p: 0.95,
              t_dtw: -1,
            },
            {
              text: "world",
              timestamps: {
                from: "00:00:00,600",
                to: "00:00:01,000",
              },
              offsets: {
                from: 600,
                to: 1000,
              },

              p: 0.88,
              t_dtw: -1,
            },
          ],
        },
      ],
    };

    const result = processTranscriptionData(mockData, mockEditor);

    // verify the structure
    expect(result).toHaveLength(1); // one segment
    expect(result[0]).toHaveLength(2); // two words

    // check first word processing
    expect(result[0][0]).toEqual({
      text: "Hello",
      confidence: 0.95,
      offsets: { from: 100, to: 500 },
      tokens: [mockData.transcription[0].tokens[1]],
    });

    // verify editor interactions
    expect(mockEditor.chain).toHaveBeenCalled();
    expect(mockEditor.insertContent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "text",
        text: "Hello ",
        marks: [
          expect.objectContaining({
            type: "wordMark",
            attrs: expect.objectContaining({
              confidence: "0.95",
              offsetFrom: 100,
              offsetTo: 500,
            }),
          }),
        ],
      })
    );
  });

  test("should handle multi-token words correctly", () => {
    const mockData: TranscriptionData = {
      transcription: [
        {
          timestamps: { from: "00:00:00,000", to: "00:00:03,000" },
          offsets: { from: 0, to: 3000 },
          text: "good bye",
          tokens: [
            {
              text: "good",
              timestamps: { from: "00:00:00,100", to: "00:00:00,300" },
              offsets: { from: 100, to: 300 },
              p: 0.9,
              t_dtw: -1,
            },
            {
              text: "bye",
              timestamps: { from: "00:00:00,300", to: "00:00:00,500" },
              offsets: { from: 300, to: 500 },
              p: 0.85,
              t_dtw: -1,
            },
          ],
        },
      ],
    };

    const result = processTranscriptionData(mockData, mockEditor);

    expect(result[0]).toHaveLength(2);
    expect(result[0][0]).toEqual({
      text: "good",
      confidence: 0.9,
      offsets: { from: 100, to: 300 },
      tokens: [mockData.transcription[0].tokens[0]],
    });
  });

  test("should skip special tokens correctly", () => {
    const mockData: TranscriptionData = {
      transcription: [
        {
          timestamps: { from: "00:00:00,000", to: "00:00:02,000" },
          offsets: { from: 0, to: 2000 },
          text: "hello world",
          tokens: [
            {
              text: "[_BEG_]",
              timestamps: { from: "00:00:00,000", to: "00:00:00,000" },
              offsets: { from: 0, to: 0 },
              p: 0.95,
              t_dtw: -1,
            },
            {
              text: "hello",
              timestamps: { from: "00:00:00,100", to: "00:00:00,500" },
              offsets: { from: 100, to: 500 },
              p: 0.95,
              t_dtw: -1,
            },
            {
              text: "[_TT_1]",
              timestamps: { from: "00:00:00,500", to: "00:00:00,600" },
              offsets: { from: 500, to: 600 },
              p: 0.95,
              t_dtw: -1,
            },
            {
              text: "world",
              timestamps: { from: "00:00:00,600", to: "00:00:01,000" },
              offsets: { from: 600, to: 1000 },
              p: 0.88,
              t_dtw: -1,
            },
          ],
        },
      ],
    };

    const result = processTranscriptionData(mockData, mockEditor);
    expect(result[0]).toHaveLength(2); 
    expect(result[0].map((w) => w.text)).toEqual(["hello", "world"]);
  });

  test("should throw error for invalid transcription data", () => {
    const invalidData = {
      transcription: null,
    } as unknown as TranscriptionData;

    expect(() => {
      processTranscriptionData(invalidData, mockEditor);
    }).toThrow("Invalid Transcription Data");
  });

  test("should handle empty segments correctly", () => {
    const mockData: TranscriptionData = {
      transcription: [
        {
          timestamps: { from: "00:00:00,000", to: "00:00:00,000" },
          offsets: { from: 0, to: 0 },
          text: "",
          tokens: [],
        },
      ],
    };

    const result = processTranscriptionData(mockData, mockEditor);
    expect(result[0]).toHaveLength(0);
    expect(mockEditor.chain).not.toHaveBeenCalled();
  });

  test("should calculate correct word confidence for multiple tokens", () => {
    const mockData: TranscriptionData = {
      transcription: [
        {
          timestamps: { from: "00:00:00,000", to: "00:00:02,000" },
          offsets: { from: 0, to: 2000 },
          text: "super complex",
          tokens: [
            {
              text: "sup",
              timestamps: { from: "00:00:00,100", to: "00:00:00,300" },
              offsets: { from: 100, to: 300 },
              p: 0.9,
              t_dtw: -1,
            },
            {
              text: "er",
              timestamps: { from: "00:00:00,300", to: "00:00:00,500" },
              offsets: { from: 300, to: 500 },
              p: 0.8,
              t_dtw: -1,
            },
            {
              text: "complex",
              timestamps: { from: "00:00:00,600", to: "00:00:01,000" },
              offsets: { from: 600, to: 1000 },
              p: 0.95,
              t_dtw: -1,
            },
          ],
        },
      ],
    };

    const result = processTranscriptionData(mockData, mockEditor);
    expect(result[0][0].confidence).toBe(0.85); 
    expect(result[0][0].offsets).toEqual({ from: 100, to: 500 });
  });
});
