# Transcription tool

## Overview
This project is a transcription application built with Electron. It is a personal use project intended to improve the transcribing of DS2 files. 

### Process
The application allows importing an DS2 audio file, which then gets copied into /input_files. A python executable built from transcribe.py + utils.py handles file conversion calling switch (+wine if needed). The file is then run through ffmpeg to fit the recomendations for whispercpp and saved in /output_files. [whispercpp](https://github.com/ggerganov/whisper.cpp) is called against this with whichever models have been selected in the application controls to create a .json output (gpu availability is checked and the call is modified accordingly). This is processed by the application to render the transcription in the editor and loaded into a basic Howler.js audio player. 

### Editor 
- built with [tiptap](https://tiptap.dev/)
- uses a custom wordMark extension to track the data from the json file
- provides a toggle to show confidence on each word 
- includes timestamping which allows word highlighting + selection to run alongside the audio playback -- so that the user can spot any mistakes by whispercpp and correct them in the editor. 
- includes basic editing features (undo, redo, text formatting, numbering etc) + a restore feature to return to last saved state (uses localstorage to save the editor state) -> TODO: reload the audio file upon restore. 
- allows exporting the editor content as a DOCX file according to templates. 

###Footpedal support
- uses a custom HID device to send commands to the application.
- ensure permissions are set for the device in the system settings.
- [node-hid](https://github.com/node-hid/node-hid/blob/master/README.md#linux-notes) describes how to set this up.
- device used for testing, sends mouse events which interfere with the user, a naive workaround in place, is to identify the device and disable mouse input in a small window when hid data is received from the device


## Installation

### Prerequisites

- **Node.js:** 
- **Python:** 
- **[FFMPEG](https://ffmpeg.org/):**
- **[switch](https://www.nch.com.au/switch):** or your preferred audio conversion tool (edit transcribe.py / utils.py to reflect this)


1. Clone the repository

2. Install dependencies

3. Clone  [whispercpp](https://github.com/ggerganov/whisper.cpp) into bin/ and download + quantize used models (currently uses q8) so the transcribe.py calls ggml-modelname-q8_0.bin (edit as you see fit) -- all info is available on their page. 

4. Build transcription.py and place the executable into bin/

## Usage
```yarn start```

### Importing and Transcribing Files

1. **Import Audio File:**

   - Click on the "Import Audio File" button to select a DS2 audio file. The file will be copied to the `/input_files` directory.

2. **Generate Transcript:**

   - After importing, click on the "Generate Transcript" button. The application will process the file using `whispercpp` and display the transcription in the editor.

![Import and generation](https://github.com/user-attachments/assets/92364396-e475-4567-98a0-bfe157271852)
![Follow along highlights](https://github.com/user-attachments/assets/47f17adf-4b8a-4839-94c9-37b522cfcf0d)
![export](https://github.com/user-attachments/assets/e84956a8-f918-4a65-8472-f66fee37a7e4)




## Acknowledgements
- [whispercpp](https://github.com/ggerganov/whisper.cpp) for providing the transcription capabilities.
- [tiptap](https://tiptap.dev/) for the rich text editor foundation.
- [Howler.js](https://howlerjs.com/) for audio playback integration.
- [Electron](https://www.electronjs.org/) for the desktop application framework.
