import { DIALOGUES } from '../data/dialogues.js';
import { audioManager } from '../audio/AudioManager.js';

export class DialogueSystem {
  constructor(questSystem) {
    this.questSystem = questSystem;
    this.isOpen = false;
    this.currentNPC = null;
    this.currentNode = null;
    this.typewriterInterval = null;

    // Cache DOM
    this.overlayEl = document.getElementById('dialogue-overlay');
    this.portraitEl = document.getElementById('dialogue-portrait');
    this.speakerEl = document.getElementById('dialogue-speaker');
    this.textEl = document.getElementById('dialogue-text');
    this.optionsEl = document.getElementById('dialogue-options');
  }

  startDialogue(dialogueKey, nodeKey = 'default') {
    const data = DIALOGUES[dialogueKey];
    if (!data) return;

    this.isOpen = true;
    this.currentNPC = data;
    this.overlayEl.classList.remove('hidden');

    if (document.exitPointerLock) document.exitPointerLock();

    this.portraitEl.src = data.portrait;
    this.speakerEl.innerText = data.name;

    this.showNode(nodeKey);
  }

  showNode(nodeKey) {
    const node = this.currentNPC[nodeKey];
    if (!node) {
      this.closeDialogue();
      return;
    }
    this.currentNode = node;

    // If node specifies quest progression
    if (node.advanceQuest && this.questSystem) {
      this.questSystem.completeQuest(node.advanceQuest);
    }

    // Typewriter text animation
    this.animateText(node.text, () => {
      this.renderOptions(node.options || []);
    });
  }

  animateText(fullText, onComplete) {
    if (this.typewriterInterval) clearInterval(this.typewriterInterval);

    this.textEl.innerText = '';
    this.optionsEl.innerHTML = '';
    let charIdx = 0;

    this.typewriterInterval = setInterval(() => {
      if (charIdx < fullText.length) {
        this.textEl.innerText += fullText[charIdx];
        charIdx++;
      } else {
        clearInterval(this.typewriterInterval);
        this.typewriterInterval = null;
        if (onComplete) onComplete();
      }
    }, 20);
  }

  renderOptions(options) {
    this.optionsEl.innerHTML = '';

    if (options.length === 0) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'dialogue-btn';
      closeBtn.innerText = 'Rời khỏi [E / ESC]';
      closeBtn.onclick = () => this.closeDialogue();
      this.optionsEl.appendChild(closeBtn);
      return;
    }

    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'dialogue-btn';
      btn.innerText = opt.text;
      btn.onclick = () => {
        audioManager.playInteract();
        if (opt.advanceQuest && this.questSystem) {
          this.questSystem.completeQuest(opt.advanceQuest);
        }
        if (opt.next === 'close') {
          this.closeDialogue();
        } else {
          this.showNode(opt.next);
        }
      };
      this.optionsEl.appendChild(btn);
    });
  }

  closeDialogue() {
    this.isOpen = false;
    if (this.typewriterInterval) clearInterval(this.typewriterInterval);
    this.overlayEl.classList.add('hidden');
  }
}
