//src/utils/transcriptionRenderer.ts -> renders transcription data to html for editor
import {
  Token,
  Segment,
  TranscriptionData,
  ConsolidatedWord,
} from "../types/general";

/**
 * Processes transcription data and inserts it into the editor.
 * @param {TranscriptionData} data - The transcription data to be processed.
 * @param {any} editor - The editor instance to insert the content into.
 * @returns {ConsolidatedWord[][]} An array of arrays containing consolidated words.
 */
export const processTranscriptionData = (
  data: TranscriptionData,
  editor: any
): ConsolidatedWord[][] => {
  console.log(data);
  if (!data.transcription || !Array.isArray(data.transcription)) {
    throw new Error("Invalid Transcription Data");
  }
  
  //map over each segment 
  const processedContent = data.transcription.map((segment) => {
    //split segment text into words and filter out empty strings
    const words = segment.text.split(" ").filter((word) => word !== "");
    const tokens = segment.tokens;
    const consolidated: ConsolidatedWord[] = [];
    let tokenIndex = 0;
    //process each word
    words.forEach((word) => {
      const wordTokens: Token[] = [];
      let wordConfidence = 0;
      let wordOffsetFrom: number | null = null; //initialize to null for calculation
      let wordOffsetTo = 0;
      let tokenText = "";
        //match tokens to the current word
      while (tokenIndex < tokens.length) {
        const token = tokens[tokenIndex];
        if (token.text === "[_BEG_]" || /^\[_TT_\d+\]$/.test(token.text)) {
          //skip placeholders
          tokenIndex++;
          continue;
        }
        tokenText += token.text;
        if (tokenText.trim() === word) {
            //if token text matches word, finalize the word
          wordTokens.push(token);
          wordConfidence += token.p;
          wordOffsetFrom =
            wordOffsetFrom === null ? token.offsets.from : wordOffsetFrom;
          wordOffsetTo = token.offsets.to;
          tokenIndex++;
          break;
        } else {
            //accumulate tokens until word is matched
          wordTokens.push(token);
          wordConfidence += token.p;
          wordOffsetTo = token.offsets.to;
          tokenIndex++;
        }
      }
      //calculate average confidence for the word
      wordConfidence = wordConfidence / wordTokens.length;
      consolidated.push({
        text: word,
        confidence: wordConfidence,
        offsets: { from: wordOffsetFrom!, to: wordOffsetTo },
        tokens: wordTokens,
      });
    });
    //insert each consolidated word into the editor
    consolidated.forEach((word, index) => {
      editor
        .chain()
        .insertContent({
          type: "text",
          text: word.text + " ",
          marks: [
            {
              type: "wordMark",
              attrs: {
                confidence: word.confidence.toFixed(2),
                offsetFrom: word.offsets.from,
                offsetTo: word.offsets.to,
                duration: word.offsets.to - word.offsets.from,
                wordIndex: index,
              },
            },
          ],
        })
        .run();
    });

    // return consolidated words for processing elsewhere
    return consolidated;

  });
  return processedContent;
};
