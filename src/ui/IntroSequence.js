import { audioManager } from '../audio/AudioManager.js';

export const INTRO_LINES = [
  "Đã nhiều năm tôi chưa quay lại ngôi làng này...",
  "Lan Chi rời nhà trước khi tôi kịp gặp em.",
  "Ngôi làng buổi sáng vẫn yên bình như tôi nhớ.",
  "Nhưng chẳng ai biết em đã đi đâu.",
  "Tôi sẽ hỏi thăm những người hàng xóm.",
  "Mặt trời vẫn còn trên cao."
];

export class IntroSequence {
  constructor() {
    this.introEl = document.getElementById('intro-sequence');
    this.textEl = document.getElementById('intro-narration-text');
    this.titleRevealEl = document.getElementById('intro-title-reveal');
    this.skipBtn = document.getElementById('btn-skip-intro');

    this.isPlaying = false;
    this.timeouts = [];
    this.onCompleteCallback = null;

    this.setupListeners();
  }

  setupListeners() {
    if (this.skipBtn) {
      this.skipBtn.onclick = () => this.skip();
    }

    window.addEventListener('keydown', (e) => {
      if (this.isPlaying && (e.code === 'Escape' || e.code === 'Space')) {
        this.skip();
      }
    });
  }

  play(onComplete) {
    this.isPlaying = true;
    this.onCompleteCallback = onComplete;

    this.introEl.classList.remove('hidden');
    this.introEl.style.opacity = '1';
    this.titleRevealEl.classList.add('hidden');

    // Start rain & car engine atmosphere
    audioManager.startIntroAtmosphere();

    // Line 0
    this.showLine(0, 500);

    // Line 1
    this.timeouts.push(setTimeout(() => this.showLine(1), 5500));

    // Line 2
    this.timeouts.push(setTimeout(() => this.showLine(2), 10500));

    // Line 3
    this.timeouts.push(setTimeout(() => this.showLine(3), 16000));

    // Line 4
    this.timeouts.push(setTimeout(() => this.showLine(4), 21500));

    // Line 5
    this.timeouts.push(setTimeout(() => this.showLine(5), 26500));

    // Dramatic Title Drop
    this.timeouts.push(setTimeout(() => {
      this.textEl.style.opacity = '0';
      setTimeout(() => {
        this.titleRevealEl.classList.remove('hidden');
      }, 800);
    }, 32000));

    // End Intro & Transition to Chapter 1
    this.timeouts.push(setTimeout(() => {
      this.finish();
    }, 37000));
  }

  showLine(index) {
    if (!this.isPlaying) return;
    this.textEl.style.opacity = '0';
    this.textEl.style.transform = 'translateY(8px)';

    setTimeout(() => {
      if (!this.isPlaying) return;
      this.textEl.innerText = `"${INTRO_LINES[index]}"`;
      this.textEl.style.opacity = '1';
      this.textEl.style.transform = 'translateY(0)';
    }, 400);
  }

  skip() {
    if (!this.isPlaying) return;
    this.finish();
  }

  finish() {
    this.isPlaying = false;
    this.timeouts.forEach(t => clearTimeout(t));
    this.timeouts = [];

    audioManager.stopIntroAtmosphere();

    this.introEl.style.opacity = '0';
    setTimeout(() => {
      this.introEl.classList.add('hidden');
      if (this.onCompleteCallback) {
        this.onCompleteCallback();
      }
    }, 900);
  }
}
