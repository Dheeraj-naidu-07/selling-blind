/**
 * Mandi Saathi — Option 2 Live AI Voice Assistant UI & Controller
 * Fully isolated from Option 1 (Manual Price Check)
 */

class MandiAssistantUI {
  constructor() {
    this.sessionState = {
      crop: null,
      quantity: null,
      quantity_unit: 'kg',
      offered_price: null,
      price_unit: 'kg',
      location_name: null,
      latitude: null,
      longitude: null,
      language: 'en-IN'
    };

    this.currentLanguage = 'en-IN';
    this.status = 'IDLE'; // IDLE, LISTENING, PROCESSING, ANALYZING, SPEAKING, ERROR
    this.userCoords = null;
    this.isOpen = false;

    this.translations = {
      'en-IN': {
        title: 'Mandi Saathi AI',
        subtitle: 'Conversational Voice Assistant',
        idle: 'Tap the microphone and speak',
        listening: 'Listening...',
        processing: 'Understanding...',
        analyzing: 'Checking historical prices...',
        speaking: 'Speaking...',
        error: 'Something went wrong. Please try again.',
        placeholder: 'Type your message...',
        send: 'Send',
        welcome: 'Hello! I am your Mandi Saathi AI Assistant. Tell me what crop you are selling and what price you are being offered.',
        noVoice: 'Voice input is not supported in this browser. You can type your message below.'
      },
      'te-IN': {
        title: 'మండి సాథీ AI',
        subtitle: 'వాయిస్ అసిస్టెంట్',
        idle: 'మైక్రోఫోన్‌ను నొక్కి మాట్లాడండి',
        listening: 'వింటోంది...',
        processing: 'అర్థం చేసుకుంటోంది...',
        analyzing: 'చారిత్రక ధరలను తనిఖీ చేస్తోంది...',
        speaking: 'మాట్లాడుతోంది...',
        error: 'ఏదో పొరపాటు జరిగింది. మళ్ళీ ప్రయత్నించండి.',
        placeholder: 'మీ సందేశాన్ని టైప్ చేయండి...',
        send: 'పంపు',
        welcome: 'నమస్కారం! నేను మీ మండి సాథీ AI అసిస్టెంట్‌ని. మీరు ఏ పంట అమ్ముతున్నారు, మీకు ఎంత ధర ఇస్తున్నారు చెప్పండి.',
        noVoice: 'ఈ బ్రౌజర్‌లో వాయిస్ ఇన్పుట్ అందుబాటులో లేదు. మీరు కింద టైప్ చేయవచ్చు.'
      },
      'hi-IN': {
        title: 'मंडी साथी AI',
        subtitle: 'वॉइस असिस्टेंट',
        idle: 'माइक दबाएं और बोलें',
        listening: 'सुन रहा है...',
        processing: 'समझ रहा है...',
        analyzing: 'ऐतिहासिक कीमतों की जांच कर रहा है...',
        speaking: 'बोल रहा है...',
        error: 'कुछ गलत हो गया। फिर से प्रयास करें।',
        placeholder: 'अपना संदेश टाइप करें...',
        send: 'भेजें',
        welcome: 'नमस्कार! मैं आपका मंडी साथी AI असिस्टेंट हूं। मुझे बताएं कि आप कौन सी फसल बेच रहे हैं और आपको क्या कीमत मिल रही है।',
        noVoice: 'इस ब्राउज़र में वॉइस इनपुट उपलब्ध नहीं है। आप नीचे टाइप कर सकते हैं।'
      }
    };
  }

  init() {
    this.detectBrowserLocation();
  }

  detectBrowserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.userCoords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          };
          this.sessionState.latitude = pos.coords.latitude;
          this.sessionState.longitude = pos.coords.longitude;
        },
        (err) => {
          console.log('[Mandi Assistant Location Notice] GPS permission denied or unavailable.');
          this.userCoords = null;
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    }
  }

  openModal() {
    this.isOpen = true;
    const modalEl = document.getElementById('ai-assistant-modal');
    if (modalEl) {
      modalEl.style.display = 'flex';
      this.resetChatView();
      this.setStatus('IDLE');

      // Greet farmer if chat is empty
      const chatBody = document.getElementById('ast-chat-body');
      if (chatBody && chatBody.children.length === 0) {
        const t = this.translations[this.currentLanguage] || this.translations['en-IN'];
        this.addAssistantMessage(t.welcome);
        window.mandiTTSEngine.speak(t.welcome, this.currentLanguage);
      }
    }
  }

  closeModal() {
    this.isOpen = false;
    const modalEl = document.getElementById('ai-assistant-modal');
    if (modalEl) {
      modalEl.style.display = 'none';
    }
    window.mandiSpeechEngine.stop();
    window.mandiTTSEngine.stop();
    this.setStatus('IDLE');
  }

  setLanguage(langCode) {
    const map = { 'en': 'en-IN', 'en-IN': 'en-IN', 'te': 'te-IN', 'te-IN': 'te-IN', 'hi': 'hi-IN', 'hi-IN': 'hi-IN' };
    this.currentLanguage = map[langCode] || 'en-IN';
    this.sessionState.language = this.currentLanguage;

    window.mandiSpeechEngine.setLanguage(this.currentLanguage);

    // Update active pill UI
    document.querySelectorAll('.ast-lang-btn').forEach(btn => {
      if (btn.getAttribute('data-ast-lang') === this.currentLanguage) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const t = this.translations[this.currentLanguage];
    const subEl = document.getElementById('ast-header-subtitle');
    if (subEl) subEl.innerText = t.subtitle;

    const inputEl = document.getElementById('ast-text-input');
    if (inputEl) inputEl.placeholder = t.placeholder;

    const sendBtn = document.getElementById('ast-send-btn');
    if (sendBtn) sendBtn.innerText = t.send;

    this.setStatus(this.status);
  }

  setStatus(statusStr) {
    this.status = statusStr;
    const banner = document.getElementById('ast-status-banner');
    const textEl = document.getElementById('ast-status-text');
    const wrapper = document.getElementById('ast-mic-wrapper');
    const hint = document.getElementById('ast-mic-hint');

    const t = this.translations[this.currentLanguage] || this.translations['en-IN'];

    if (banner && textEl) {
      banner.className = `assistant-status-banner ${statusStr.toLowerCase()}`;
      textEl.innerText = t[statusStr.toLowerCase()] || t.idle;
    }

    if (wrapper) {
      wrapper.className = `mic-button-wrapper ${statusStr.toLowerCase()}`;
    }

    if (hint) {
      hint.innerText = statusStr === 'LISTENING' ? t.listening : (statusStr === 'SPEAKING' ? t.speaking : t.idle);
    }
  }

  toggleMicrophone() {
    // Interrupt TTS if currently speaking
    if (window.mandiTTSEngine.isSpeaking) {
      window.mandiTTSEngine.stop();
      this.setStatus('IDLE');
      return;
    }

    // Stop if currently listening
    if (window.mandiSpeechEngine.isListening) {
      window.mandiSpeechEngine.stop();
      this.setStatus('IDLE');
      return;
    }

    // Start listening
    this.setStatus('LISTENING');
    const started = window.mandiSpeechEngine.start(
      (transcript) => {
        this.handleUserTranscript(transcript);
      },
      (error) => {
        console.warn('[Mandi Assistant Speech Error]:', error);
        if (error === 'NOT_SUPPORTED' || error === 'not-allowed') {
          const t = this.translations[this.currentLanguage];
          this.addAssistantMessage(t.noVoice);
        }
        this.setStatus('IDLE');
      },
      () => {
        if (this.status === 'LISTENING') {
          this.setStatus('IDLE');
        }
      }
    );

    if (!started) {
      const t = this.translations[this.currentLanguage];
      this.addAssistantMessage(t.noVoice);
      this.setStatus('IDLE');
    }
  }

  handleTextSubmit() {
    const inputEl = document.getElementById('ast-text-input');
    if (!inputEl) return;
    const text = inputEl.value.trim();
    if (text) {
      inputEl.value = '';
      this.handleUserTranscript(text);
    }
  }

  addUserMessage(text) {
    const chatBody = document.getElementById('ast-chat-body');
    if (!chatBody) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-bubble user';
    msgDiv.innerText = text;

    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  addAssistantMessage(text) {
    const chatBody = document.getElementById('ast-chat-body');
    if (!chatBody) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-bubble assistant';
    msgDiv.innerText = text;

    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  resetChatView() {
    const chatBody = document.getElementById('ast-chat-body');
    if (chatBody) {
      chatBody.innerHTML = '';
    }
  }

  async handleUserTranscript(transcript) {
    if (!transcript || !transcript.trim()) return;

    // Display user message in chat bubble
    this.addUserMessage(transcript);
    this.setStatus('PROCESSING');

    try {
      const response = await fetch('https://selling-blind.onrender.com/api/assistant/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcript,
          session_state: this.sessionState,
          language: this.currentLanguage,
          user_location: this.userCoords
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update session state with extracted details
        if (data.session_state) {
          this.sessionState = { ...this.sessionState, ...data.session_state };
        }

        const replyText = data.reply_text || "Thank you. Processing your price query.";
        
        this.addAssistantMessage(replyText);

        // Speak the reply in farmer's language
        this.setStatus('SPEAKING');
        window.mandiTTSEngine.speak(
          replyText,
          this.currentLanguage,
          () => this.setStatus('SPEAKING'),
          () => this.setStatus('IDLE'),
          () => this.setStatus('IDLE')
        );

      } else {
        const errorData = await response.json().catch(() => ({}));
        const errText = errorData.message || "Unable to analyze request. Please try again.";
        this.addAssistantMessage(errText);
        this.setStatus('ERROR');
      }
    } catch (err) {
      console.error('[Mandi Assistant Network Error]:', err);
      const t = this.translations[this.currentLanguage];
      this.addAssistantMessage(t.error);
      this.setStatus('ERROR');
    }
  }
}

// Global instance
window.mandiAssistantUI = new MandiAssistantUI();
document.addEventListener('DOMContentLoaded', () => {
  window.mandiAssistantUI.init();
});
