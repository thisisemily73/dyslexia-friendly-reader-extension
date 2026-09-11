# DyslexiView: Dyslexia Reader & TTS

A Chrome extension that makes web pages easier to read with text-to-speech, adjustable spacing, and font options.

---

## Features

- **Text-to-Speech (TTS):** Highlight text on a webpage and listen to it using your system’s voices and speed controls.
- **Word Highlighting:** See each word highlighted as it is read aloud.
- **Floating Quickbar:** Play, pause, or stop reading from a control bar at the top of the page.
- **Dyslexia-Friendly Font:** Turn on the OpenDyslexic font for any website.
- **Text-Spacing Sliders:** Adjust these settings while viewing a page:
  - Letter Spacing
  - Word Spacing
  - Line Height
- **Saved Settings:** Spacing, font, and quickbar preferences are saved in Chrome Storage and reused in future tabs and sessions.

---

## Technical Overview

DyslexiView uses Manifest V3 and browser APIs. Its content script adds the reading features to web pages, applies spacing changes with CSS, and uses the Web Speech API to read selected text aloud.

- **Manifest V3:** Utilizes background scripts and modern extension APIs.
- **Chrome Storage API:** Handles state management and persistent user preferences across sessions.
- **Web Speech API:** Uses `SpeechSynthesisUtterance` and speech boundary events for text-to-speech and word highlighting.
- **DOM Manipulation & Dynamic Injection:** Finds selected text and adds the styles needed for the reading options.

---

## Installation & Local Setup

DyslexiView uses vanilla JavaScript and standard browser APIs, so there are no build steps or external dependencies.

1. Clone or download this repository:
   ```bash
  git clone https://github.com/your-username/DyslexiView.git
  ```