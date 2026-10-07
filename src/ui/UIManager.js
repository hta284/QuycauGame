import { audioManager } from '../audio/AudioManager.js';
import { SaveSystem } from '../systems/SaveSystem.js';

export class UIManager {
  constructor(game) {
    this.game = game;

    // Cache Overlays & Menus
    this.mainMenuEl = document.getElementById('main-menu');
    this.pauseMenuEl = document.getElementById('pause-menu');
    this.hudEl = document.getElementById('hud');
    this.evidenceLogEl = document.getElementById('evidence-log-modal');
    this.questLogEl = document.getElementById('quest-log-modal');
    this.settingsModalEl = document.getElementById('settings-modal');
    this.creditsModalEl = document.getElementById('credits-modal');
    this.endingScreenEl = document.getElementById('ending-screen');
    this.debugMenuEl = document.getElementById('debug-menu');
    this.heartbeatOverlay = document.getElementById('heartbeat-overlay');
    this.staminaFill = document.getElementById('stamina-fill');
    this.cluesGrid = document.getElementById('clues-grid');

    // Setup All UI Handlers
    this.initMainMenu();
    this.initPauseMenu();
    this.initLogs();
    this.initSettings();
    this.initEnding();
    this.initDebugMenu();
    this.initKeyboardShortcuts();
  }

  // --- MAIN MENU ---
  initMainMenu() {
    const btnNewGame = document.getElementById('btn-new-game');
    const btnContinue = document.getElementById('btn-continue');
    const btnMainSettings = document.getElementById('btn-main-settings');
    const btnCredits = document.getElementById('btn-credits');

    if (SaveSystem.hasSave()) {
      btnContinue.disabled = false;
    }

    btnNewGame.onclick = () => {
      audioManager.init();
      audioManager.playInteract();
      this.game.startNewGame();
    };

    btnContinue.onclick = () => {
      audioManager.init();
      audioManager.playInteract();
      this.game.loadSavedGame();
    };

    btnMainSettings.onclick = () => {
      audioManager.playInteract();
      this.settingsModalEl.classList.remove('hidden');
    };

    btnCredits.onclick = () => {
      audioManager.playInteract();
      this.creditsModalEl.classList.remove('hidden');
    };

    document.getElementById('close-credits-btn').onclick = () => {
      this.creditsModalEl.classList.add('hidden');
    };
  }

  // --- PAUSE MENU ---
  initPauseMenu() {
    document.getElementById('btn-resume').onclick = () => {
      this.resumeGame();
    };

    document.getElementById('btn-pause-evidence').onclick = () => {
      this.openEvidenceLog();
    };

    document.getElementById('btn-pause-quests').onclick = () => {
      this.openQuestLog();
    };

    document.getElementById('btn-pause-settings').onclick = () => {
      this.settingsModalEl.classList.remove('hidden');
    };

    document.getElementById('btn-restart').onclick = () => {
      this.pauseMenuEl.classList.add('hidden');
      this.game.startNewGame();
    };

    document.getElementById('btn-quit-to-main').onclick = () => {
      this.pauseMenuEl.classList.add('hidden');
      this.hudEl.classList.add('hidden');
      this.mainMenuEl.classList.remove('hidden');
      this.game.isPaused = true;
    };
  }

  // --- EVIDENCE & QUEST LOGS (TAB & J) ---
  initLogs() {
    // Clues grid (TAB)
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        if (this.evidenceLogEl.classList.contains('hidden')) {
          this.openEvidenceLog();
        } else {
          this.closeEvidenceLog();
        }
      } else if (e.code === 'KeyJ') {
        if (this.questLogEl.classList.contains('hidden')) {
          this.openQuestLog();
        } else {
          this.closeQuestLog();
        }
      }
    });
  }

  openEvidenceLog() {
    this.renderEvidenceGrid();
    this.evidenceLogEl.classList.remove('hidden');
    if (document.exitPointerLock) document.exitPointerLock();
  }

  closeEvidenceLog() {
    this.evidenceLogEl.classList.add('hidden');
  }

  renderEvidenceGrid() {
    this.cluesGrid.innerHTML = '';
    const allClues = this.game.evidenceSystem.clues;

    allClues.forEach(clue => {
      const card = document.createElement('div');
      card.className = `clue-card ${clue.collected ? '' : 'locked'}`;

      const thumb = document.createElement('div');
      thumb.className = 'clue-card-thumb';
      const img = document.createElement('img');
      img.src = clue.collected ? clue.image : '/assets/boicanh/lang/gieng lang.png';
      thumb.appendChild(img);

      const info = document.createElement('div');
      info.className = 'clue-card-info';
      info.innerHTML = `
        <div class="clue-card-num">${clue.id}</div>
        <div class="clue-card-title">${clue.collected ? clue.title : '??? Chưa khám phá'}</div>
      `;

      card.appendChild(thumb);
      card.appendChild(info);

      if (clue.collected) {
        card.onclick = () => {
          this.game.evidenceSystem.showClueModal(clue);
        };
      }

      this.cluesGrid.appendChild(card);
    });
  }

  openQuestLog() {
    const currentQ = this.game.questSystem.getCurrentQuest();
    const allQ = this.game.questSystem.quests;

    const activeContainer = document.getElementById('active-quest-details');
    const completedContainer = document.getElementById('completed-quest-list');

    if (currentQ) {
      activeContainer.innerHTML = `
        <div class="quest-item-box">
          <div class="quest-item-name">${currentQ.name}</div>
          <div class="quest-item-desc">${currentQ.description}</div>
          <div style="margin-top: 8px; color: var(--color-gold); font-size: 13px;"><b>Mục tiêu:</b> ${currentQ.objective}</div>
        </div>
      `;
    }

    completedContainer.innerHTML = '';
    const completedList = allQ.filter(q => q.completed);
    if (completedList.length === 0) {
      completedContainer.innerHTML = '<div style="color: #666; font-size: 13px;">Chưa có nhiệm vụ nào hoàn thành.</div>';
    } else {
      completedList.forEach(q => {
        const item = document.createElement('div');
        item.className = 'quest-item-box completed';
        item.innerHTML = `
          <div class="quest-item-name">✓ ${q.name}</div>
          <div class="quest-item-desc">${q.description}</div>
        `;
        completedContainer.appendChild(item);
      });
    }

    this.questLogEl.classList.remove('hidden');
    if (document.exitPointerLock) document.exitPointerLock();
  }

  closeQuestLog() {
    this.questLogEl.classList.add('hidden');
  }

  // --- SETTINGS MODAL ---
  initSettings() {
    const sliderVol = document.getElementById('slider-master-volume');
    const valVol = document.getElementById('val-master-volume');
    const sliderBrightness = document.getElementById('slider-brightness');
    const valBrightness = document.getElementById('val-brightness');
    const sliderSens = document.getElementById('slider-mouse-sens');
    const valSens = document.getElementById('val-mouse-sens');
    const closeBtn = document.getElementById('close-settings-btn');

    const storedBrightness = Number(localStorage.getItem('quycau-brightness') || '1');
    const initialBrightnessPct = Math.round(Math.min(180, Math.max(40, storedBrightness * 100)));
    sliderBrightness.value = String(initialBrightnessPct);
    valBrightness.innerText = `${initialBrightnessPct}%`;

    sliderVol.oninput = (e) => {
      const v = Number(e.target.value);
      valVol.innerText = `${v}%`;
      audioManager.setVolume(v / 100);
    };

    sliderBrightness.oninput = (e) => {
      const pct = Number(e.target.value);
      valBrightness.innerText = `${pct}%`;
      this.game.setBrightness(pct / 100);
    };

    sliderSens.oninput = (e) => {
      const s = Number(e.target.value);
      valSens.innerText = `${s}`;
      this.game.playerController.setSensitivity(s);
    };

    closeBtn.onclick = () => {
      this.settingsModalEl.classList.add('hidden');
    };
  }

  // --- ENDING SCREEN ---
  initEnding() {
    document.getElementById('btn-ending-return').onclick = () => {
      this.endingScreenEl.classList.add('hidden');
      this.mainMenuEl.classList.remove('hidden');
      this.hudEl.classList.add('hidden');
      this.game.isPaused = true;
    };
  }

  showEndingScreen() {
    if (document.exitPointerLock) document.exitPointerLock();
    this.hudEl.classList.add('hidden');
    this.endingScreenEl.classList.remove('hidden');

    // Show ominous post-credit tease after 4 seconds
    setTimeout(() => {
      const tease = document.getElementById('ending-eerie-tease');
      if (tease) {
        tease.classList.remove('hidden');
        audioManager.playDogBark(true);
      }
    }, 4500);
  }

  // --- DEBUG MENU (F1) ---
  initDebugMenu() {
    const bindButton = (id, handler) => {
      const el = document.getElementById(id);
      if (el) {
        el.onclick = handler;
      }
    };

    bindButton('close-debug-btn', () => {
      this.debugMenuEl.classList.add('hidden');
    });

    bindButton('dbg-complete-quest', () => {
      this.game.questSystem.completeQuest();
    });

    bindButton('dbg-give-all-clues', () => {
      this.game.evidenceSystem.unlockAll();
    });

    bindButton('dbg-ch-1', () => {
      this.game.questSystem.setQuestByIndex(0);
      this.game.teleportPlayer(0, 1.7, 45);
    });
    bindButton('dbg-ch-2', () => {
      this.game.questSystem.setQuestByIndex(1);
      this.game.teleportPlayer(0, 1.7, -2);
    });
    bindButton('dbg-ch-3', () => {
      this.game.questSystem.setQuestByIndex(2);
      this.game.teleportPlayer(28, 1.7, -60);
    });
    bindButton('dbg-ch-4', () => {
      this.game.questSystem.setQuestByIndex(3);
      this.game.teleportPlayer(0, 1.7, -95);
    });
    bindButton('dbg-ch-5', () => {
      this.game.questSystem.setQuestByIndex(this.game.questSystem.quests.length - 1);
      this.game.teleportPlayer(0, 1.7, -95);
      this.game.bossFight.startBossFight();
    });

    bindButton('dbg-tp-home', () => {
      this.game.teleportPlayer(0, 1.7, 45);
    });
    bindButton('dbg-tp-well', () => {
      this.game.teleportPlayer(0, 1.7, -2);
    });
    bindButton('dbg-tp-cemetery', () => {
      this.game.teleportPlayer(30, 1.7, -60);
    });
    bindButton('dbg-tp-forest', () => {
      this.game.teleportPlayer(0, 1.7, -48);
    });
    bindButton('dbg-tp-shrine', () => {
      this.game.teleportPlayer(0, 1.7, -95);
    });

    bindButton('dbg-trigger-jumpscare', () => {
      this.game.quyCau.triggerDeathSequence?.();
    });
    bindButton('dbg-trigger-nightmare', () => {
      this.game.ui.showNightmareSequence?.();
    });
    bindButton('dbg-spawn-quycau', () => {
      this.game.quyCau.group.visible = true;
      this.game.quyCau.group.position.set(this.game.camera.position.x, 0, this.game.camera.position.z - 15);
      this.game.quyCau.state = 'CHASE';
      audioManager.playMonsterRoar();
    });
    bindButton('dbg-trigger-chase', () => {
      this.game.quyCau.group.visible = true;
      this.game.quyCau.state = 'CHASE';
      audioManager.startChaseMusic();
    });
    bindButton('dbg-win-boss', () => {
      this.game.bossFight.defeatBoss();
    });

    bindButton('dbg-reset-save', () => {
      SaveSystem.clear();
      location.reload();
    });
  }

  // --- SHORTCUTS & ESC HANDLER ---
  initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // F1: Toggle Debug Menu
      if (e.code === 'F1') {
        e.preventDefault();
        this.debugMenuEl.classList.toggle('hidden');
        if (!this.debugMenuEl.classList.contains('hidden') && document.exitPointerLock) {
          document.exitPointerLock();
        }
      }

      // F: Toggle Flashlight
      if (e.code === 'KeyF') {
        this.game.player.toggleFlashlight();
      }

      // ESC: Toggle Pause Menu
      if (e.code === 'Escape') {
        if (!this.evidenceLogEl.classList.contains('hidden')) {
          this.closeEvidenceLog();
          return;
        }
        if (!this.questLogEl.classList.contains('hidden')) {
          this.closeQuestLog();
          return;
        }
        if (!this.settingsModalEl.classList.contains('hidden')) {
          this.settingsModalEl.classList.add('hidden');
          return;
        }
        if (this.game.dialogueSystem.isOpen) {
          this.game.dialogueSystem.closeDialogue();
          return;
        }
        if (!this.mainMenuEl.classList.contains('hidden') || !this.endingScreenEl.classList.contains('hidden')) {
          return;
        }

        this.togglePause();
      }
    });
  }

  togglePause() {
    this.game.isPaused = !this.game.isPaused;
    if (this.game.isPaused) {
      if (document.exitPointerLock) document.exitPointerLock();
      this.pauseMenuEl.classList.remove('hidden');
    } else {
      this.pauseMenuEl.classList.add('hidden');
      this.game.playerController.lockPointer();
    }
  }

  resumeGame() {
    this.game.isPaused = false;
    this.pauseMenuEl.classList.add('hidden');
    this.game.playerController.lockPointer();
  }

  updateHUD(staminaRatio, isDanger) {
    if (this.staminaFill) {
      this.staminaFill.style.width = `${Math.floor(staminaRatio * 100)}%`;
      if (staminaRatio < 0.25) {
        this.staminaFill.style.background = '#e61919';
      } else {
        this.staminaFill.style.background = 'linear-gradient(90deg, #608855, #8bc34a)';
      }
    }

    if (this.heartbeatOverlay) {
      if (isDanger) {
        this.heartbeatOverlay.classList.add('pulsing');
      } else {
        this.heartbeatOverlay.classList.remove('pulsing');
      }
    }
  }
}
