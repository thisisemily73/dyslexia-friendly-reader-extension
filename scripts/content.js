(function () {
  if (window.hasDyslexiViewLoaded) return;
  window.hasDyslexiViewLoaded = true;

  // 1. Inject Styles
  if (!document.getElementById('dyslexiview-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'dyslexiview-styles';
    styleElement.textContent = `
      @font-face {
        font-family: 'OpenDyslexic';
        src: url('https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/etc/open-dyslexic-regular.woff') format('woff');
      }
      
      body.dyslexiview-font-active, 
      body.dyslexiview-font-active * {
        font-family: 'OpenDyslexic', sans-serif !important;
      }

      /* Active Word Highlight */
      .dv-word-active {
        background-color: #fef08a !important;
        color: #0f172a !important;
        border-radius: 3px;
        box-shadow: 0 0 0 2px #fde047;
      }

      /* Top Middle Floating Toolbar */
      #dyslexiview-toolbar {
        position: fixed;
        top: 15px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 2147483647;
        background: #ffffff;
        border: 1px solid #cbd5e1;
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2);
        border-radius: 30px;
        padding: 6px 14px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: system-ui, -apple-system, sans-serif;
      }

      #dyslexiview-toolbar button {
        background: #2563eb;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 20px;
        cursor: pointer;
        font-weight: 600;
        font-size: 12px;
      }

      #dyslexiview-toolbar button.pause-btn { background: #f59e0b; }
      #dyslexiview-toolbar button.stop-btn { background: #ef4444; }
      #dyslexiview-toolbar button.close-btn { background: #94a3b8; padding: 6px 10px; }
    `;
    document.head.appendChild(styleElement);
  }

  // Inject element for dynamic text spacing rules
  let spacingStyleTag = document.getElementById('dyslexiview-spacing-styles');
  if (!spacingStyleTag) {
    spacingStyleTag = document.createElement('style');
    spacingStyleTag.id = 'dyslexiview-spacing-styles';
    document.head.appendChild(spacingStyleTag);
  }

  function ensureToolbar() {
    let toolbar = document.getElementById('dyslexiview-toolbar');
    if (!toolbar) {
      toolbar = document.createElement('div');
      toolbar.id = 'dyslexiview-toolbar';
      toolbar.innerHTML = `
        <span style="font-size: 12px; font-weight: 700; color: #1e293b;">DyslexiView</span>
        <button id="dv-read-btn">▶ Read Selected</button>
        <button id="dv-pause-btn" class="pause-btn">⏸ Pause</button>
        <button id="dv-stop-btn" class="stop-btn">■ Stop</button>
        <button id="dv-close-btn" class="close-btn">✕</button>
      `;
      document.body.appendChild(toolbar);

      document.getElementById('dv-read-btn').onclick = () => startReadingText({ highlightEnabled: window.dvHighlightEnabled });
      document.getElementById('dv-pause-btn').onclick = () => togglePauseSpeech();
      document.getElementById('dv-stop-btn').onclick = () => stopReadingText();
      document.getElementById('dv-close-btn').onclick = () => {
        stopReadingText();
        toolbar.remove();
      };
    }
  }

  let currentSpans = [];
  window.dvHighlightEnabled = true;

  function clearHighlights() {
    currentSpans.forEach(span => {
      const parent = span.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(span.textContent), span);
        parent.normalize();
      }
    });
    currentSpans = [];
  }

  function togglePauseSpeech() {
    const pauseBtn = document.getElementById('dv-pause-btn');
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      if (pauseBtn) pauseBtn.textContent = '▶ Resume';
    } else if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      if (pauseBtn) pauseBtn.textContent = '⏸ Pause';
    }
  }

  function stopReadingText() {
    window.speechSynthesis.cancel();
    clearHighlights();
    const pauseBtn = document.getElementById('dv-pause-btn');
    if (pauseBtn) pauseBtn.textContent = '⏸ Pause';
  }

  function startReadingText(options = {}) {
    window.speechSynthesis.cancel();
    clearHighlights();

    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (!selectedText) {
      alert('Please highlight text on the web page first!');
      return;
    }

    if (options.highlightEnabled) {
      const range = selection.getRangeAt(0);
      const fragment = range.extractContents();
      const div = document.createElement('div');
      div.style.display = 'inline';
      div.appendChild(fragment);

      const words = selectedText.split(/(\s+)/);
      div.innerHTML = '';
      
      words.forEach(word => {
        if (word.trim().length > 0) {
          const span = document.createElement('span');
          span.className = 'dv-word';
          span.textContent = word;
          div.appendChild(span);
          currentSpans.push(span);
        } else {
          div.appendChild(document.createTextNode(word));
        }
      });

      range.insertNode(div);
    }

    const utterance = new SpeechSynthesisUtterance(selectedText);
    utterance.rate = options.speed || 1.0;

    if (options.voiceName) {
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find((v) => v.name === options.voiceName);
      if (matchedVoice) utterance.voice = matchedVoice;
    }

    if (options.highlightEnabled) {
      let wordIndex = 0;
      utterance.addEventListener('boundary', (event) => {
        if (event.name === 'word' && currentSpans.length > 0) {
          currentSpans.forEach(s => s.classList.remove('dv-word-active'));
          if (currentSpans[wordIndex]) {
            currentSpans[wordIndex].classList.add('dv-word-active');
            wordIndex++;
          }
        }
      });
    }

    utterance.onend = stopReadingText;
    utterance.onerror = stopReadingText;

    window.speechSynthesis.speak(utterance);
  }

  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'toggle_font') {
      document.body.classList.toggle('dyslexiview-font-active', request.enabled);
    }

    if (request.action === 'toggle_always_bar') {
      if (request.enabled) {
        ensureToolbar();
      } else {
        const toolbar = document.getElementById('dyslexiview-toolbar');
        if (toolbar) toolbar.remove();
      }
    }

    if (request.action === 'adjust_spacing') {
      // Sets rule globally via style tag so highlighted/wrapped text keeps spacing!
      spacingStyleTag.textContent = `
        p, h1, h2, h3, h4, h5, h6, li, article, section, .dv-word, span:not(#dyslexiview-toolbar *) {
          letter-spacing: ${request.letterSpacing}px !important;
          word-spacing: ${request.wordSpacing}px !important;
          line-height: ${request.lineHeight} !important;
        }
      `;
    }

    if (request.action === 'start_reading') {
      window.dvHighlightEnabled = request.highlightEnabled;
      ensureToolbar();
      startReadingText(request);
    }

    if (request.action === 'pause_reading') togglePauseSpeech();
    if (request.action === 'stop_reading') stopReadingText();
  });
})();