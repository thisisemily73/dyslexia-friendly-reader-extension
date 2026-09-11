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
        sendTabMessage({
            action: 'adjust_spacing',
            letterSpacing: letterSpacing.value,
            wordSpacing: wordSpacing.value,
            lineHeight: lineHeight.value
        });
    }

    if (speakBtn) {
        speakBtn.addEventListener('click', () => {
            sendTabMessage({
                action: 'start_reading',
                speed: parseFloat(speedInput.value),
                voiceName: voiceSelect.value,
                highlightEnabled: highlightToggle ? highlightToggle.checked : false
            });
        });
    }

    if (pauseBtn) pauseBtn.addEventListener('click', () => sendTabMessage({ action: 'pause_reading' }));
    if (stopBtn) stopBtn.addEventListener('click', () => sendTabMessage({ action: 'stop_reading' }));

    if (fontToggle) {
        fontToggle.addEventListener('change', () => {
            sendTabMessage({ action: 'toggle_font', enabled: fontToggle.checked });
        });
    }

    if (alwaysBarToggle) {
        alwaysBarToggle.addEventListener('change', () => {
            sendTabMessage({ action: 'toggle_always_bar', enabled: alwaysBarToggle.checked });
        });
    }

    if (letterSpacing && wordSpacing && lineHeight) {
        letterSpacing.addEventListener('input', updateSpacing);
        wordSpacing.addEventListener('input', updateSpacing);
        lineHeight.addEventListener('input', updateSpacing);
    }
});