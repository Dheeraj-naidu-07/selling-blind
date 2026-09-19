/**
 * Mandi Saathi — Speech Recognition Engine (ASR)
 * Supports English (en-IN), Telugu (te-IN), and Hindi (hi-IN)
 * Graceful fallback when Speech Recognition is unavailable or denied.
 */

class MandiSpeechRecognition {
  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.isSupported = !!SpeechRecognition;
    this.recognition = this.isSupported ? new SpeechRecognition() : null;
    this.isListening = false;
    this.onResultCallback = null;
    this.onErrorCallback = null;
    this.onEndCallback = null;
    this.language = 'en-IN';

    if (this.isSupported) {
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (this.onResultCallback) {
          this.onResultCallback(transcript);
        }
      };

      this.recognition.onerror = (event) => {
        console.warn('[Mandi ASR Warning] Speech recognition error:', event.error);
        this.isListening = false;
        if (this.onErrorCallback) {
          this.onErrorCallback(event.error);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.onEndCallback) {
          this.onEndCallback();
        }
      };
    }
  }

  setLanguage(langCode) {
    const map = {
      'en': 'en-IN',
      'en-IN': 'en-IN',
      'te': 'te-IN',
      'te-IN': 'te-IN',
      'hi': 'hi-IN',
      'hi-IN': 'hi-IN'
    };
    this.language = map[langCode] || 'en-IN';
    if (this.recognition) {
      this.recognition.lang = this.language;
    }
  }

  start(onResult, onError, onEnd) {
    if (!this.isSupported) {
      if (onError) onError('NOT_SUPPORTED');
      return false;
    }

    if (this.isListening) {
      this.stop();
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onEndCallback = onEnd;

    try {
      this.recognition.lang = this.language;
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (err) {
      console.error('[Mandi ASR Exception] Failed to start recognition:', err);
      this.isListening = false;
      if (onError) onError(err.message);
      return false;
    }
  }

  stop() {
    if (this.isSupported && this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.isListening = false;
    }
  }
}

// Global instance
window.mandiSpeechEngine = new MandiSpeechRecognition();
