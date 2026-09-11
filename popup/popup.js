document.addEventListener('DOMContentLoaded', () => {
    const speakBtn = document.getElementById('speak');
    const pauseBtn = document.getElementById('pause');
    const stopBtn = document.getElementById('stop');
    const speedInput = document.getElementById('speed');
    const speedValue = document.getElementById('speedValue');
    const voiceSelect = document.getElementById('voice');
    const fontToggle = document.getElementById('font');
    const highlightToggle = document.getElementById('highlight');
    const alwaysBarToggle = document.getElementById('alwaysBar');

    const letterSpacing = document.getElementById('letterSpacing');
    const wordSpacing = document.getElementById('wordSpacing');
    const lineHeight = document.getElementById('lineHeight');

    // Load saved settings from Chrome Storage (defaults alwaysBarEnabled to true)
    chrome.storage.local.get(
        ['fontEnabled', 'highlightEnabled', 'alwaysBarEnabled', 'letterSpacing', 'wordSpacing', 'lineHeight', 'speed'],
        (saved) => {
            if (fontToggle && saved.fontEnabled !== undefined) {
                fontToggle.checked = saved.fontEnabled;
            }
            if (highlightToggle && saved.highlightEnabled !== undefined) {
                highlightToggle.checked = saved.highlightEnabled;
            }
            
            // Default QuickBar to true/checked if it's the user's first time opening
            const isAlwaysBarOn = saved.alwaysBarEnabled !== undefined ? saved.alwaysBarEnabled : true;
            if (alwaysBarToggle) {
                alwaysBarToggle.checked = isAlwaysBarOn;
            }

            if (letterSpacing && saved.letterSpacing !== undefined) letterSpacing.value = saved.letterSpacing;
            if (wordSpacing && saved.wordSpacing !== undefined) wordSpacing.value = saved.wordSpacing;
            if (lineHeight && saved.lineHeight !== undefined) lineHeight.value = saved.lineHeight;

            if (speedInput && saved.speed !== undefined) {
                speedInput.value = saved.speed;
                if (speedValue) speedValue.textContent = `${Number(saved.speed).toFixed(1)}×`;
            }

            // Sync all states immediately to content script
            updateSpacing();
            if (fontToggle) sendTabMessage({ action: 'toggle_font', enabled: fontToggle.checked });
            if (highlightToggle) sendTabMessage({ action: 'set_highlight_enabled', enabled: highlightToggle.checked });
            sendTabMessage({ action: 'toggle_always_bar', enabled: isAlwaysBarOn });
        }
    );

    function loadVoices() {
        const voices = speechSynthesis.getVoices();
        voiceSelect.innerHTML = '<option value="">Default Voice</option>';
        voices.forEach((voice) => {
            const opt = document.createElement('option');
            opt.value = voice.name;
            opt.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(opt);
        });
    }

    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
    }

    if (speedInput && speedValue) {
        speedInput.addEventListener('input', () => {
            speedValue.textContent = `${Number(speedInput.value).toFixed(1)}×`;
            chrome.storage.local.set({ speed: speedInput.value });
        });
    }

    async function sendTabMessage(message) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) return;

        if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('edge://')) {
            alert('DyslexiView cannot run on internal browser pages.');
            return;
        }

        chrome.tabs.sendMessage(tab.id, message, async () => {
            if (chrome.runtime.lastError) {
                try {
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ['scripts/content.js']
                    });

                    setTimeout(() => {
                        chrome.tabs.sendMessage(tab.id, message);
                    }, 100);
                } catch (err) {
                    console.error('Failed to inject content script:', err);
                }
            }
        });
    }

    function updateSpacing() {
        if (!letterSpacing || !wordSpacing || !lineHeight) return;

        const spacingData = {
            letterSpacing: letterSpacing.value,
            wordSpacing: wordSpacing.value,
            lineHeight: lineHeight.value
        };

        chrome.storage.local.set(spacingData);
        sendTabMessage({ action: 'adjust_spacing', ...spacingData });
    }

    if (speakBtn) {
        speakBtn.addEventListener('click', () => {
            sendTabMessage({
                action: 'start_reading',
                speed: parseFloat(speedInput.value),
                voiceName: voiceSelect.value,
                highlightEnabled: highlightToggle ? highlightToggle.checked : true
            });
        });
    }

    if (pauseBtn) pauseBtn.addEventListener('click', () => sendTabMessage({ action: 'pause_reading' }));
    if (stopBtn) stopBtn.addEventListener('click', () => sendTabMessage({ action: 'stop_reading' }));

    if (fontToggle) {
        fontToggle.addEventListener('change', () => {
            chrome.storage.local.set({ fontEnabled: fontToggle.checked });
            sendTabMessage({ action: 'toggle_font', enabled: fontToggle.checked });
        });
    }

    if (highlightToggle) {
        highlightToggle.addEventListener('change', () => {
            chrome.storage.local.set({ highlightEnabled: highlightToggle.checked });
            sendTabMessage({ action: 'set_highlight_enabled', enabled: highlightToggle.checked });
        });
    }

    if (alwaysBarToggle) {
        alwaysBarToggle.addEventListener('change', () => {
            chrome.storage.local.set({ alwaysBarEnabled: alwaysBarToggle.checked });
            sendTabMessage({ action: 'toggle_always_bar', enabled: alwaysBarToggle.checked });
        });
    }

    if (letterSpacing && wordSpacing && lineHeight) {
        letterSpacing.addEventListener('input', updateSpacing);
        wordSpacing.addEventListener('input', updateSpacing);
        lineHeight.addEventListener('input', updateSpacing);
    }
});