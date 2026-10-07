import * as THREE from 'three';
import { audioManager } from '../audio/AudioManager.js';

export class BossFightSystem {
  constructor(scene, quyCauEntity, villageEnv, questSystem, deathSystem = null) {
    this.scene = scene;
    this.quyCau = quyCauEntity;
    this.villageEnv = villageEnv;
    this.questSystem = questSystem;
    this.deathSystem = deathSystem;

    this.isActive = false;
    this.phase = 1;
    this.phaseTimer = 0;
    this.altarsActivatedCount = 0;
    this.hasSacredTorch = false;
    this.isDefeated = false;

    // HUD Elements
    this.bossHud = document.getElementById('boss-hud');
    this.bossHealthFill = document.getElementById('boss-health-fill');
    this.bossPhaseText = document.getElementById('boss-phase-text');
  }

  startBossFight() {
    if (this.isActive || this.isDefeated) return;
    this.isActive = true;
    this.phase = 1;
    this.phaseTimer = 0;

    // Setup Quỷ Cẩu for boss battle
    this.quyCau.group.visible = true;
    this.quyCau.group.position.set(0, 0, -100);
    this.quyCau.setBossMode(true, 1);
    this.quyCau.state = 'CHASE';

    // Show Boss HUD
    if (this.bossHud) this.bossHud.classList.remove('hidden');
    this.updateHUD(100, "GIAI ĐOẠN 1: NÉ TRÁNH CÁC ĐÒN LAO TỚI CỦA QUỶ CẨU");

    audioManager.startBossMusic();
    audioManager.playMonsterRoar();

    this.questSystem.completeQuest('Q07'); // Advance to Q08: Tiêu diệt Quỷ Cẩu
  }

  update(delta, playerPosition) {
    if (!this.isActive || this.isDefeated) return;

    this.phaseTimer += delta;

    // Phase 1: Survive 14 seconds of lunges
    if (this.phase === 1) {
      const remainingTime = Math.max(0, 14 - this.phaseTimer);
      const pct = Math.floor((this.phaseTimer / 14) * 33);
      this.updateHUD(100 - pct, `GIAI ĐOẠN 1: NÉ TRÁNH ĐÒN LAO TỚI (${Math.ceil(remainingTime)}s)`);

      if (this.phaseTimer >= 14) {
        this.transitionToPhase2();
      }
    }

    // Phase 2: Player must activate 3 pedestals
    else if (this.phase === 2) {
      this.updateHUD(66, `GIAI ĐOẠN 2: KÍCH HOẠT 3 BỆ THỜ TRẤN YỂM (${this.altarsActivatedCount}/3)`);
    }

    // Phase 3: Player carries holy flame to banish Quỷ Cẩu
    else if (this.phase === 3) {
      const dist = this.quyCau.group.position.distanceTo(playerPosition);
      if (this.hasSacredTorch) {
        this.updateHUD(33, `GIAI ĐOẠN 3: TIẾP CẬN VÀ THIÊU RỤI QUỶ CẨU BẰNG NGỌN LỬA THIÊNG! (Nhấn E khi lại gần)`);
      } else {
        this.updateHUD(33, `GIAI ĐOẠN 3: LẤY NGỌN LỬA THIÊNG TRÊN BÀN TẾ`);
      }
    }
  }

  transitionToPhase2() {
    this.phase = 2;
    this.phaseTimer = 0;
    audioManager.playHorrorStinger();

    // Light up the 3 ritual pedestals
    this.villageEnv.pedestals.forEach(p => {
      p.light.intensity = 2.5;
      p.light.color.setHex(0x00ff88);
    });

    this.questSystem.showToast(
      "PHÁ PHONG ẤN TÀ KHÍ",
      "Kích hoạt 3 Bệ Thờ Trấn Yểm xung quanh Miếu Cũ để phá vỡ lớp bảo vệ của Quỷ Cẩu!"
    );
  }

  activatePedestal(pedestalData) {
    if (this.phase !== 2 || pedestalData.activated) return;

    pedestalData.activated = true;
    pedestalData.light.color.setHex(0xffdd00);
    pedestalData.light.intensity = 4.0;
    this.altarsActivatedCount++;

    audioManager.playQuestComplete();

    if (this.altarsActivatedCount >= 3) {
      this.transitionToPhase3();
    }
  }

  transitionToPhase3() {
    this.phase = 3;
    this.phaseTimer = 0;

    // Break Quỷ Cẩu shield
    this.quyCau.breakShield();

    // Ignite Sacred Brazier
    this.villageEnv.brazierLight.intensity = 4.0;
    this.villageEnv.sacredFlameMat.color.setHex(0xff7700);

    audioManager.playHorrorStinger();
    this.questSystem.showToast(
      "LỚP MA CHƯỚNG ĐÃ BỊ PHÁ!",
      "Hãy tiến tới lấy Ngọn Lửa Thiêng trên bệ thờ để tiêu diệt Quỷ Cẩu!"
    );
  }

  takeSacredFlame() {
    if (this.phase !== 3) return;
    this.hasSacredTorch = true;
    audioManager.playPickup();
    this.questSystem.showToast(
      "ĐÃ LẤY NGỌN LỬA THIÊNG",
      "Hãy áp sát và dùng Lửa Thiêng thiêu rụi Quỷ Cẩu!"
    );
  }

  attackWithHolyFlame() {
    if (this.phase !== 3 || !this.hasSacredTorch || this.isDefeated) return;
    this.defeatBoss();
  }

  defeatBoss() {
    this.isDefeated = true;
    this.isActive = false;

    // Quỷ Cẩu dying animation & dissolve
    this.updateHUD(0, "QUỶ CẨU ĐÃ BỊ TIÊU DIỆT!");
    audioManager.playMonsterRoar();
    audioManager.playDawnVictory();

    // Hide Quỷ Cẩu
    setTimeout(() => {
      this.quyCau.group.visible = false;
      if (this.bossHud) this.bossHud.classList.add('hidden');
    }, 1800);

    // Free relative Lan Chi from traps!
    if (this.villageEnv.lanChiNPC) {
      this.villageEnv.lanChiNPC.freeFromTraps();
    }

    // Advance quest to Q09
    this.questSystem.completeQuest('Q08');
  }

  updateHUD(healthPct, phaseText) {
    if (this.bossHealthFill) {
      this.bossHealthFill.style.width = `${healthPct}%`;
    }
    if (this.bossPhaseText) {
      this.bossPhaseText.innerText = phaseText;
    }
  }
}
