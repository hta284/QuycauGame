import * as THREE from 'three';
import { audioManager } from '../audio/AudioManager.js';

export class DeathSystem {
  constructor(game) {
    this.game = game;
    this.isDead = false;

    // Cache DOM
    this.jumpscareOverlay = document.getElementById('jumpscare-overlay');
    this.gameOverScreen = document.getElementById('game-over-screen');
    this.nightmareScreen = document.getElementById('nightmare-sequence');

    this.setupListeners();
  }

  setupListeners() {
    // Game Over buttons
    const btnRestartCheckpoint = document.getElementById('btn-restart-checkpoint');
    const btnWakeNightmare = document.getElementById('btn-wake-nightmare');
    const btnRestartBeginning = document.getElementById('btn-restart-beginning');
    const btnGameOverMain = document.getElementById('btn-gameover-main');

    if (btnRestartCheckpoint) {
      btnRestartCheckpoint.onclick = () => {
        this.restartFromCheckpoint();
      };
    }

    if (btnWakeNightmare) {
      btnWakeNightmare.onclick = () => {
        this.playNightmareSequence();
      };
    }

    if (btnRestartBeginning) {
      btnRestartBeginning.onclick = () => {
        this.gameOverScreen.classList.add('hidden');
        this.game.startNewGame();
      };
    }

    if (btnGameOverMain) {
      btnGameOverMain.onclick = () => {
        this.gameOverScreen.classList.add('hidden');
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
        this.game.isPaused = true;
      };
    }

    // Nightmare continue button
    const btnNightmareContinue = document.getElementById('btn-nightmare-continue');
    if (btnNightmareContinue) {
      btnNightmareContinue.onclick = () => {
        this.completeNightmare();
      };
    }
  }

  triggerDeath(quyCauEntity) {
    if (this.isDead) return;
    this.isDead = true;

    // 1. Lock player control and stop movement
    this.game.playerController.enabled = false;
    this.game.playerController.triggerShake(0.65, 1.2);

    // 2. Snap Quỷ Cẩu right into camera face
    if (quyCauEntity) {
      const forward = new THREE.Vector3(0, 0, -1.3).applyQuaternion(this.game.camera.quaternion);
      quyCauEntity.group.position.copy(this.game.camera.position).add(forward);
      quyCauEntity.lookAt(this.game.camera.position);
      quyCauEntity.state = 'ATTACK';
    }

    // 3. Audio & Visual shock
    audioManager.playJumpscareDeath();

    if (this.jumpscareOverlay) {
      this.jumpscareOverlay.classList.remove('hidden');
      document.body.classList.add('camera-shake');
    }

    // 4. The death is followed by the recurring nightmare and a safe wake-up.
    setTimeout(() => {
      document.body.classList.remove('camera-shake');
      if (this.jumpscareOverlay) this.jumpscareOverlay.classList.add('hidden');
      if (document.exitPointerLock) document.exitPointerLock();

      // Reset Quỷ Cẩu state & stop chase
      if (quyCauEntity) {
        quyCauEntity.state = 'IDLE';
        quyCauEntity.group.visible = false;
      }
      audioManager.stopChaseMusic();

      this.playNightmareSequence();
    }, 1400);
  }

  restartFromCheckpoint() {
    this.isDead = false;
    this.gameOverScreen.classList.add('hidden');
    this.nightmareScreen.classList.add('hidden');

    // Teleport back to current area's checkpoint spawn
    const config = this.game.areaManager.getAreaConfig(this.game.areaManager.currentAreaId);
    this.game.areaManager.transitionTo(config.id, config.playerSpawn);
  }

  playNightmareSequence() {
    this.gameOverScreen.classList.add('hidden');
    this.nightmareScreen.classList.remove('hidden');

    // Heavy breathing audio
    audioManager.playHeavyBreathing();

    // Step 1: "Tôi... vừa gặp ác mộng sao?"
    const s1 = document.getElementById('nightmare-step-1');
    const s2 = document.getElementById('nightmare-step-2');
    const paw = document.getElementById('nightmare-pawprint-wrapper');
    const btn = document.getElementById('btn-nightmare-continue');

    s1.classList.remove('hidden');
    s2.classList.add('hidden');
    paw.classList.add('hidden');
    btn.classList.add('hidden');

    // Step 2 after 2.5s: "Bạn giật mình tỉnh dậy..."
    setTimeout(() => {
      s2.classList.remove('hidden');
    }, 2400);

    // Step 3 after 5.0s: Reveal bloody pawprint and distant bark!
    setTimeout(() => {
      paw.classList.remove('hidden');
      btn.classList.remove('hidden');
      audioManager.playDogBark(true);
    }, 5000);
  }

  completeNightmare() {
    this.nightmareScreen.classList.add('hidden');
    this.isDead = false;
    this.game.midnightHuntStarted = false;
    this.game.afterNightmarePending = true;
    this.game.areaManager.transitionTo(
      'AREA_GATE_HOME',
      new THREE.Vector3(-18, 1.7, 22),
      false
    );
    this.game.ensureFootprintClue();
    this.game.setWorldState('DAY_AFTER_NIGHTMARE');
    this.game.setQuestObjective('Kiểm tra dấu chân ngoài cửa, rồi hỏi Bà Lan về giấc mơ.');
    this.game.playerController.enabled = true;
    this.game.isPaused = false;
    this.game.autoSave();
    audioManager.stopChaseMusic();
    this.game.questSystem.showToast('BẠN TỈNH DẬY Ở NHÀ', 'Bà Lan đang ở ngoài sân. Hãy hỏi bà về giấc mơ.');
  }
}
