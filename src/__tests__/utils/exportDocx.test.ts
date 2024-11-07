import { exportDocx } from "../../utils/exportDocx";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import type { ContentNode } from "../../types/general";

// mock dependencies
jest.mock("docx", () => ({
  Document: jest.fn(),
  Packer: {
    toBlob: jest.fn(),
  },
  Paragraph: jest.fn(),
  TextRun: jest.fn(),
  Header: jest.fn(),
  Footer: jest.fn(),
  PageOrientation: {
    PORTRAIT: "portrait",
    LANDSCAPE: "landscape",
  },
}));

jest.mock("file-saver", () => ({
  saveAs: jest.fn(),
}));

describe("exportDocx", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Packer.toBlob as jest.Mock).mockResolvedValue(new Blob());
    // mock constructor implementations
    (Document as jest.Mock).mockImplementation(() => ({}));
    (Paragraph as jest.Mock).mockImplementation(() => ({}));
    (TextRun as jest.Mock).mockImplementation(() => ({}));
  });

  test("should export document with basic text content", async () => {
    const content = [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Hello World",
          },
        ],
      },
    ] as ContentNode[];

    await exportDocx(content, "Document");

    expect(Document).toHaveBeenCalledWith(
      expect.objectContaining({
        sections: expect.arrayContaining([
          expect.objectContaining({
            children: expect.any(Array),
          }),
        ]),
      })
    );

    expect(saveAs).toHaveBeenCalledWith(
      expect.any(Blob),
      "Document_document.docx"
    );
  });

  test("should apply correct template configuration", async () => {
    const content = [
      {
        type: "paragraph",
        content: [{ type: "text", text: "Test" }],
      },
    ] as ContentNode[];

    await exportDocx(content, "Letter");

    expect(Document).toHaveBeenCalledWith(
      expect.objectContaining({
        styles: expect.objectContaining({
          default: expect.objectContaining({
            document: expect.objectContaining({
              run: {
                font: "Times New Roman",
                size: 24,
              },
            }),
          }),
        }),
      })
    );
  });

  test("should handle text formatting marks", async () => {
    const content = [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Formatted Text",
            marks: [
              { type: "bold" },
              { type: "italic" },
              { type: "underline" },
            ],
          },
        ],
      },
    ] as ContentNode[];

    await exportDocx(content, "Document");

    expect(TextRun).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "Formatted Text",
        bold: true,
        italics: true,
        underline: { type: "single" },
      })
    );
  });

  test("should handle ordered lists correctly", async () => {
    const content = [
      {
        type: "orderedList",
        content: [
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "List Item 1" }],
              },
            ],
          },
        ],
      },
    ] as ContentNode[];

    await exportDocx(content, "Document");

    expect(Paragraph).toHaveBeenCalledWith(
      expect.objectContaining({
        numbering: expect.objectContaining({
          reference: "ordered-list",
          level: 0,
        }),
      })
    );
  });

  test("should handle errors during export", async () => {
    const error = new Error("Export failed");
    (Packer.toBlob as jest.Mock).mockRejectedValue(error);

    const content = [
      {
        type: "paragraph",
        content: [{ type: "text", text: "Test" }],
      },
    ] as ContentNode[];

    await expect(exportDocx(content, "Document")).rejects.toThrow();
  });
});
