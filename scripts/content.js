// content.js

// 1. Inject the OpenDyslexic font face into the page
const fontStyle = document.createElement('style');
fontStyle.id = 'dyslexiview-font';
fontStyle.textContent = `
  @font-face {
    font-family: 'OpenDyslexic';
    src: url('https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/etc/open-dyslexic-regular.woff') format('woff');
    font-weight: normal;
    font-style: normal;
  }
  
  .dyslexiview-active * {
    font-family: 'OpenDyslexic', sans-serif !important;
  }
`;
document.head.appendChild(fontStyle);

// 2. Listen for messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Return selected text back to popup.js for text-to-speech
  if (request.action === 'get_selected_text') {
    const selectedText = window.getSelection().toString();
    sendResponse({ text: selectedText });
  }

  // Toggle font on or off across the page
  if (request.action === 'toggle_font') {
    if (request.enabled) {
      document.body.classList.add('dyslexiview-active');
    } else {
      document.body.classList.remove('dyslexiview-active');
    }
  }
});