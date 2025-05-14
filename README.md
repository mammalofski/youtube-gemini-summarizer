# YouTube Gemini Assistant

This Chrome extension adds a button next to the like button on YouTube videos. Its main purpose is to help you get the best summary of the video for free. Clicking this button will open Gemini AI, allowing you to interact with it in the context of the video you are watching.

## Features

*   Adds a button to YouTube video pages.
*   Opens Gemini AI on button click.

## Installation

1.  **Download or Clone the Repository:**
    *   Download the ZIP and extract it, or clone this repository to your local machine using `git clone https://github.com/mammalofski/youtube-gemini-summarizer`.

2.  **Open Chrome/Edge Extensions Page:**
    *   Open your Chrome or Edge browser and navigate to `chrome://extensions` or `edge://extensions`.

3.  **Enable Developer Mode:**
    *   In the top right corner of the Extensions page, toggle the "Developer mode" switch to the on position.

4.  **Load Unpacked Extension:**
    *   Click the "Load unpacked" button that appears after enabling Developer mode.
    *   In the file dialog that opens, navigate to the directory where you downloaded or cloned this repository (the directory containing `manifest.json`).
    *   Select the folder and click "Open" or "Select Folder".

5.  **Verify Installation:**
    *   The "YouTube Gemini Assistant" extension should now appear in your list of installed extensions.
    *   Make sure the toggle switch for the extension is enabled.

## How to Use

This tool is meant to give you the best summary of the video for free by doing the following:

1.  Navigate to any YouTube video page (e.g., `https://www.youtube.com/watch?v=...`).
2.  You should see a new button appearing near the "Like" and "Dislike" buttons. The button's appearance will be styled by `css/overlay.css` and its functionality is managed by `js/content.js`.
3.  Click this button. This will copy the video's transcript (if available) to your clipboard and open the Gemini AI webpage in a new tab.
4.  Once navigated to the Gemini webpage, press `Ctrl+V` (or `Cmd+V` on Mac) to paste the transcript into the input field.
5.  Hit Enter. Gemini will read the transcription and give you the best summary so you don't have to watch the entire video yet learn all it has to offer.

## Files

*   `manifest.json`: The manifest file for the Chrome extension, defining its properties, permissions, and scripts.
*   `js/content.js`: The content script that injects the button onto YouTube pages and handles its click event.
*   `css/overlay.css`: Styles for the button and any other UI elements injected by the extension.
*   `images/`: Contains the icons for the extension.
*   `README.md`: This file.
*   `.gitignore`: Specifies intentionally untracked files that Git should ignore.

## Permissions Used

*   `activeTab`: Allows the extension to interact with the currently active tab when the user invokes the extension. (Though in this manifest, it's not strictly necessary as content scripts are used).
*   `clipboardWrite`: Allows the extension to write to the clipboard. This might be used by Gemini AI functionality.

## Development

To make changes to the extension:

1.  Edit the relevant files (`js/content.js`, `css/overlay.css`, `manifest.json`).
2.  After saving your changes, go back to the `chrome://extensions` page.
3.  Find the "YouTube Gemini Assistant" extension and click the "Reload" button (it looks like a circular arrow).
4.  Refresh the YouTube page to see your changes.