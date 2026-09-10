document.addEventListener('DOMContentLoaded', () => {
  // Grab references to all HTML elements
  const speakBtn = document.getElementById('speak');
  const stopBtn = document.getElementById('stop');
  const speedInput = document.getElementById('speed');
  const speedValue = document.getElementById('speedValue');
  const voiceSelect = document.getElementById('voice');
  const fontToggle = document.getElementById('font');
  const highlightToggle = document.getElementById('highlight');

  // Load available Text-to-Speech voices
  function loadVoices() {
    const voices = speechSynthesis.getVoices();
    voiceSelect.innerHTML = '<option value="">Default Voice</option>';

    voices.forEach((voice) => {
      const option = document.createElement('option');
      option.value = voice.name;
      option.textContent = `${voice.name} (${voice.lang})`;
      voiceSelect.appendChild(option);
    });
  }

  // Chrome loads voices asynchronously
  loadVoices();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
  }

  // Update the speed display when slider moves
  speedInput.addEventListener('input', () => {
    speedValue.textContent = `${Number(speedInput.value).toFixed(1)}×`;
  });

  // Handle "Start Reading" button
  speakBtn.addEventListener('click', async () => {
    speechSynthesis.cancel(); // Stop any active speech

    // Send a message to the active tab's content.js to get selected page text
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'get_selected_text' }, (response) => {
        const textToRead = response?.text || 'No text selected. Please select text on the page to read.';
        
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.rate = parseFloat(speedInput.value);

        const selectedVoice = voiceSelect.value;
        if (selectedVoice) {
          const voices = speechSynthesis.getVoices();
          utterance.voice = voices.find((v) => v.name === selectedVoice);
        }

        speechSynthesis.speak(utterance);
      });
    }
  });

  // Handle "Stop" button
  stopBtn.addEventListener('click', () => {
    speechSynthesis.cancel();
  });

  // Send font toggle changes to the active tab
  fontToggle.addEventListener('change', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'toggle_font',
        enabled: fontToggle.checked
      });
    }
  });
});