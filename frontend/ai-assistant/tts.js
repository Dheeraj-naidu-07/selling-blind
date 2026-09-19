/**
 * Mandi Saathi — Text-to-Speech Engine (TTS)
 * Speaks final Qwen text responses in English (en-IN), Telugu (te-IN), or Hindi (hi-IN)
 * Graceful fallback when SpeechSynthesis is unavailable or voices are missing.
 */

class MandiTTS {
  constructor() {
    this.synth = window.speechSynthesis || null;
    this.isSupported = !!this.synth;
    this.isSpeaking = false;
    this.voices = [];
    
    if (this.isSupported) {
      this.loadVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  loadVoices() {
    if (this.synth) {
      this.voices = this.synth.getVoices();
    }
  }

  stop() {
    if (this.isSupported && this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }

  speak(text, langCode = 'en-IN', onStart = null, onEnd = null, onError = null) {
    if (!this.isSupported || !text || !text.trim()) {
      if (onEnd) onEnd();
      return;
    }

    // Cancel any ongoing speech to prevent overlap
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text.trim());
    
    const langMap = {
      'en': 'en-IN',
      'en-IN': 'en-IN',
      'te': 'te-IN',
      'te-IN': 'te-IN',
      'hi': 'hi-IN',
      'hi-IN': 'hi-IN'
    };

    const targetLang = langMap[langCode] || 'en-IN';
    utterance.lang = targetLang;
    utterance.rate = 0.95; // Slightly calmer speaking rate for clarity
    utterance.pitch = 1.0;

    // Find best matching voice
    if (this.voices.length > 0) {
      const match = this.voices.find(v => v.lang === targetLang || v.lang.startsWith(targetLang.slice(0, 2)));
      if (match) {
        utterance.voice = match;
      }
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    utterance.onerror = (err) => {
      console.warn('[Mandi TTS Warning] Speech synthesis error:', err);
      this.isSpeaking = false;
      if (onError) onError(err);
      if (onEnd) onEnd();
    };

    try {
      this.synth.speak(utterance);
    } catch (e) {
      console.error('[Mandi TTS Exception]:', e);
      this.isSpeaking = false;
      if (onEnd) onEnd();
    }
  }
}

// Global instance
window.mandiTTSEngine = new MandiTTS();
