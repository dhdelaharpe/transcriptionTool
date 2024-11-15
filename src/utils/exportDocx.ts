import { JSONContent } from "@tiptap/react";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Header,
  Footer,
  PageOrientation,
} from "docx";
import { saveAs } from "file-saver";
import type { ContentNode } from "../types/general";

//TODO add loading a tmeplate file -> needs a ipc call to readFileSync most likey

interface TemplateConfig {
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  header?: string;
  footer?: string;
  orientation: string;
  spacing: {
    line: number;
    before: number;
    after: number;
  };
  defaultFontSize: number;
  defaultFont: string;
}

const templateConfigs: Record<string, TemplateConfig> = {
  Document: {
    margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
    header: "DOCUMENT",
    orientation: PageOrientation.PORTRAIT,
    spacing: { line: 360, before: 120, after: 120 },
    defaultFontSize: 24,
    defaultFont: "Calibri",
  },
  Letter: {
    margins: { top: 1440, right: 1800, bottom: 1440, left: 1800 },
    header: "LETTER",
    footer: "Page {#} of {total}",
    orientation: PageOrientation.PORTRAIT,
    spacing: { line: 480, before: 0, after: 240 },
    defaultFontSize: 24,
    defaultFont: "Times New Roman",
  },
};
// process a text node and return a TextRun
const processTextNode = (node: ContentNode): TextRun => {
  return new TextRun({
    text: node.text || "",
    bold: node.marks?.some((mark: { type: string }) => mark.type === "bold"),
    underline: {
      type: node.marks?.some(
        (mark: { type: string }) => mark.type === "underline"
      )
        ? "single"
        : "none",
    },
    italics: node.marks?.some(
      (mark: { type: string }) => mark.type === "italic"
    ),
    superScript: node.marks?.some(
      (mark: { type: string }) => mark.type === "superscript"
    ),
    subScript: node.marks?.some(
      (mark: { type: string }) => mark.type === "subscript"
    ),
  });
};

// process a node and return an array of paragraphs
const processNode = (node: ContentNode, level: number = 0): Paragraph[] => {
  if (!node) {
    return [];
  }

  switch (node.type) {
    case "paragraph":
      if (!node.content) {
        return [new Paragraph({ children: [] })];
      }

      // collect all text runs within this paragraph
      const textRuns = node.content.map((child: ContentNode) => {
        if (child.type === "text") {
          return processTextNode(child);
        }
        return new TextRun({ text: "" });
      });

      return [new Paragraph({ children: textRuns })];

    case "text":
      return [
        new Paragraph({
          children: [processTextNode(node)],
        }),
      ];

    case "orderedList":
      if (!node.content) {
        return [];
      }

      // process each list item
      return node.content.flatMap((child: ContentNode) => {
        if (child.type === "listItem") {
          return processNode(child, level);
        }
        return [];
      });

    case "listItem":
      if (!node.content) {
        return [
          new Paragraph({
            children: [],
            numbering: {
              reference: "ordered-list",
              level: level,
            },
          }),
        ];
      }

      const paragraphs: Paragraph[] = [];
      //process each child of the list item

      for (const child of node.content) {
        if (child.type === "paragraph") {
          //handle with current indentation
          const textRuns =
            child.content?.map((textChild: ContentNode) => {
              if (textChild.type === "text") {
                return processTextNode(textChild);
              }
              return new TextRun({ text: "" });
            }) || [];
          paragraphs.push(
            new Paragraph({
              children: textRuns,
              numbering: { reference: "ordered-list", level: level },
            })
          );
        } else if (child.type === "orderedList") {
          paragraphs.push(...processNode(child, level + 1));
        }
      }
      return paragraphs;

    default:
      return [];
  }
};

/**
 * Exports content to a DOCX file using a specified template.
 * @param {ContentNode[]} content - The content to be exported.
 * @param {'Document'|'Letter'|string} template - The template to use for the document.
 * @returns {Promise<void>} A promise that resolves when the document is exported.
 */
export const exportDocx = async (
  content: ContentNode[],
  template: "Document" | "Letter" | string
): Promise<void> => {
  let documentConfig;
  if (template.endsWith(".docx")) {
    // TODO -- load from docx file
  } else {
    documentConfig = getDefaultConfig(template as "Document" | "Letter");
  }

  const doc = new Document({
    //...documentConfig,
    styles: {
      default: {
        document: {
          run: {
            font: documentConfig.defaultFont,
            size: documentConfig.defaultFontSize,
          },
          paragraph: {
            spacing: {
              line: documentConfig.spacing.line,
              before: documentConfig.spacing.before,
              after: documentConfig.spacing.after,
            },
          },
        },
      },
      paragraphStyles: styles[template as keyof typeof styles].paragraphStyles,
    },
    sections: [
      {
        properties: {
          page: {
            margin: documentConfig.margins,
            //orientation: documentConfig.orientation
          },
        },
        headers: documentConfig.header
          ? {
              default: new Header({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: documentConfig.header,
                        bold: true,
                      }),
                    ],
                  }),
                ],
              }),
            }
          : undefined,
        footers: documentConfig.footer
          ? {
              default: new Footer({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: documentConfig.footer
                          .replace("{#}", "{currentPage}")
                          .replace("{total", "{totalPages"),
                      }),
                    ],
                  }),
                ],
              }),
            }
          : undefined,
        children: content.flatMap((node: ContentNode) => {
          const result = processNode(node);
          return result;
        }),
      },
    ],
    numbering: {
      config: [
        {
          reference: "ordered-list",
          levels: [
            {
              level: 0,
              format: "decimal",
              text: "%1.",
              alignment: "start",
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 260 },
                },
              },
            },
            {
              level: 1,
              format: "decimal",
              text: "%1.%2.",
              alignment: "start",
              style: {
                paragraph: {
                  indent: { left: 1440, hanging: 260 },
                },
              },
            },
            {
              level: 2,
              format: "decimal",
              text: "%1.%2.%3.",
              alignment: "start",
              style: {
                paragraph: {
                  indent: { left: 2160, hanging: 260 },
                },
              },
            },
          ],
        },
      ],
    },
  });
  try {
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${template.replace(".docx", "")}.docx`);
  } catch (error) {
    console.error("Failed to export document:", error);
    throw error;
  }
};

const getDefaultConfig = (
  templateType: "Document" | "Letter"
): TemplateConfig => {
  const config = templateConfigs[templateType] || templateConfigs["Document"];
  return {
    margins: config.margins,
    orientation: config.orientation,
    header: config.header,
    footer: config.footer,
    spacing: config.spacing,
    defaultFont: config.defaultFont,
    defaultFontSize: config.defaultFontSize,
  };
};
// basic styles for the document
const styles = {
  Document: {
    paragraphStyles: [
      {
        id: "normal",
        name: "Normal",
        run: {
          size: 24,
          font: "Calibri",
        },
      },
      {
        id: "heading1",
        name: "Heading 1",
        run: {
          size: 28,
          bold: true,
          font: "Calibri",
        },
      },
    ],
  },
  Letter: {
    paragraphStyles: [
      {
        id: "normal",
        name: "Normal",
        run: {
          size: 24,
          font: "Times New Roman",
        },
      },
      {
        id: "heading1",
        name: "Heading 1",
        run: {
          size: 28,
          bold: true,
          font: "Times New Roman",
        },
      },
    ],
  },
};
