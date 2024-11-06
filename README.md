# Project Name

## Overview
This project is a transcription and document export application built with Electron and React. It allows users to transcribe audio files and export the content as DOCX documents.
Python executable built from transcribe.py handles file conversion + calling whispercpp to create the json file. Edit for your setup before building. 
File conversion from DS2 to wav is handled by switch+ffmpeg currently (ensure they are installed along with wine if needed). 


## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/projectname.git
   ```
2. Navigate to the project directory:
   ```bash
   cd projectname
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Clone  [whispercpp](https://github.com/ggerganov/whisper.cpp) into bin/ and download + quantize used models (currently uses q8) -- all info is available on their page. 
5. Build transcription.py and place into bin

## Usage

- To start the application, run:
  ```bash
  npm start
  ```

## Contribution

- Fork the repository
- Create a new branch for your feature or bugfix
- Submit a pull request

## License

This project is licensed under the MIT License.
