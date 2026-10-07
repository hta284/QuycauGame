import { CLUES } from '../data/clues.js';
import { audioManager } from '../audio/AudioManager.js';

export class EvidenceSystem {
  constructor() {
    this.clues = CLUES.map(c => ({ ...c, collected: false }));
    this.onClueCollectedCallback = null;

    // Cache DOM
    this.countEl = document.getElementById('clue-count');
    this.modalEl = document.getElementById('clue-modal');
    this.modalImg = document.getElementById('clue-modal-img');
    this.modalTitle = document.getElementById('clue-modal-title');
    this.modalDesc = document.getElementById('clue-modal-desc');
    this.modalLoc = document.getElementById('clue-modal-loc');
    this.modalId = document.getElementById('clue-modal-id');

    this.setupModalControls();
  }

  setupModalControls() {
    const closeBtn = document.getElementById('close-clue-modal');
    const inspectCloseBtn = document.getElementById('btn-inspect-close');

    if (closeBtn) closeBtn.onclick = () => this.hideClueModal();
    if (inspectCloseBtn) inspectCloseBtn.onclick = () => this.hideClueModal();

    window.addEventListener('keydown', (e) => {
      if ((e.code === 'Escape' || e.code === 'KeyE') && !this.modalEl.classList.contains('hidden')) {
        this.hideClueModal();
      }
    });
  }

  collectClue(clueId) {
    const clue = this.clues.find(c => c.id === clueId);
    if (!clue) return;

    if (!clue.collected) {
      clue.collected = true;
      audioManager.playPickup();
      this.showClueModal(clue);
      this.updateHUD();

      if (this.onClueCollectedCallback) {
        this.onClueCollectedCallback(clue);
      }
    } else {
      // Re-inspect
      this.showClueModal(clue);
    }
  }

  showClueModal(clue) {
    if (!this.modalEl) return;
    this.modalTitle.innerText = clue.title;
    this.modalDesc.innerText = clue.description + '\n\n' + clue.lore;
    this.modalLoc.innerText = clue.location;
    this.modalId.innerText = clue.id.replace('CLUE_', '');
    this.modalImg.src = clue.image;

    this.modalEl.classList.remove('hidden');
    if (document.exitPointerLock) document.exitPointerLock();
  }

  hideClueModal() {
    if (this.modalEl) {
      this.modalEl.classList.add('hidden');
    }
  }

  updateHUD() {
    if (this.countEl) {
      const count = this.clues.filter(c => c.collected).length;
      this.countEl.innerText = count;
    }
  }

  unlockAll() {
    this.clues.forEach(c => c.collected = true);
    this.updateHUD();
    audioManager.playQuestComplete();
  }

  getCollectedCount() {
    return this.clues.filter(c => c.collected).length;
  }

  onClueCollected(callback) {
    this.onClueCollectedCallback = callback;
  }
}
