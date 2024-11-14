/**
 * Function to update the word highlights based on the current time and the editor instance
 * @param {number} currentTime - The current time of the audio playback
 * @param {any} editor - The editor instance
 */
export const updateWordHighlights = (currentTime: number, editor: any) => {
    //get current words
  const oldCw = Array.from(document.querySelectorAll(".current-word"));
  //get all wordMark elements with data-offset-from and data-offset-to attributes
  const wordElements = document.querySelectorAll(
    `[data-offset-from][data-offset-to]`
  );
  //filter word elements to find the ones that are currently being spoken
  const cws = Array.from(wordElements).filter((word) => {
    const from = parseFloat(word.getAttribute("data-offset-from"));
    const to = parseFloat(word.getAttribute("data-offset-to"));
    return currentTime >= from && currentTime <= to;
  });

  if (cws.length > 0) {
    //check if first matching word isalready highlighted
    const alreadyHighlighted =
      cws.indexOf(oldCw.length > 0 ? oldCw[0] : null) > -1; //returns -1 if null
    if (!alreadyHighlighted) {
      //get the position of the first matching word
      const pos = editor.view.posAtDOM(cws[0], 0);

      //add css highlights to the current word with class current-word
      cws.forEach((word) => {
        word.classList.add("current-word");
      });
      //remove css highlights from old current words
      oldCw.forEach((word) => {
        word.classList.remove("current-word");
      });
    }
  }
};
