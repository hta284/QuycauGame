import { QUESTS } from '../data/quests.js';
import { audioManager } from '../audio/AudioManager.js';

export class QuestSystem {
  constructor() {
    this.quests = QUESTS.map(q => ({ ...q }));
    this.currentIndex = 0;
    this.onQuestAdvancedCallback = null;

    // Cache HUD elements
    this.titleEl = document.getElementById('quest-title');
    this.objectiveEl = document.getElementById('quest-objective');
    this.toastEl = document.getElementById('notification-toast');
    this.toastTitleEl = document.getElementById('toast-title');
    this.toastDescEl = document.getElementById('toast-desc');

    this.updateHUD();
  }

  getCurrentQuest() {
    return this.quests[this.currentIndex];
  }

  completeQuest(questId) {
    const current = this.getCurrentQuest();
    if (!current) return;

    if (!questId || current.id === questId) {
      current.completed = true;
      audioManager.playQuestComplete();

      this.showToast('HOÀN THÀNH NHIỆM VỤ', current.name);

      if (this.currentIndex < this.quests.length - 1) {
        this.currentIndex++;
        this.updateHUD();
      }

      if (this.onQuestAdvancedCallback) {
        this.onQuestAdvancedCallback(this.getCurrentQuest(), current);
      }
      return;
    }

    const target = this.quests.find(q => q.id === questId);
    if (target) {
      target.completed = true;
      if (this.currentIndex < this.quests.length - 1) {
        this.currentIndex = Math.min(this.currentIndex + 1, this.quests.length - 1);
      }
      this.updateHUD();
      if (this.onQuestAdvancedCallback) {
        this.onQuestAdvancedCallback(this.getCurrentQuest(), target);
      }
    }
  }

  setQuestByIndex(index) {
    if (index >= 0 && index < this.quests.length) {
      this.currentIndex = index;
      for (let i = 0; i < this.currentIndex; i++) {
        this.quests[i].completed = true;
      }
      this.updateHUD();
      if (this.onQuestAdvancedCallback) {
        this.onQuestAdvancedCallback(this.getCurrentQuest());
      }
    }
  }

  updateHUD() {
    const q = this.getCurrentQuest();
    if (!q) return;

    if (this.titleEl) {
      this.titleEl.innerText = `Nhiệm vụ: ${q.name}`;
    }
    if (this.objectiveEl) {
      this.objectiveEl.innerText = q.objective;
    }
  }

  showToast(title, desc) {
    if (!this.toastEl) return;
    this.toastTitleEl.innerText = title;
    this.toastDescEl.innerText = desc;
    this.toastEl.classList.remove('hidden');

    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastEl.classList.add('hidden');
    }, 4000);
  }

  onQuestAdvanced(callback) {
    this.onQuestAdvancedCallback = callback;
  }
}
