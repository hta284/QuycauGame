import * as THREE from 'three';
import { HORROR_EVENTS } from '../data/horrorEvents.js';
import { audioManager } from '../audio/AudioManager.js';

export class HorrorEventSystem {
  constructor(scene, quyCauEntity) {
    this.scene = scene;
    this.quyCau = quyCauEntity;
    this.events = { ...HORROR_EVENTS };

    // Threat banner on HUD
    this.threatEl = document.getElementById('threat-indicator');
    this.threatTextEl = document.getElementById('threat-text');
  }

  showThreat(msg, duration = 3500) {
    if (!this.threatEl) return;
    this.threatTextEl.innerText = msg;
    this.threatEl.classList.remove('hidden');
    clearTimeout(this.threatTimer);
    this.threatTimer = setTimeout(() => {
      this.threatEl.classList.add('hidden');
    }, duration);
  }

  // --- EVENT 1: TIẾNG SỦA VỌNG TỪ XA ---
  triggerEvent1() {
    if (this.events.EVENT_1_BARK.triggered) return;
    this.events.EVENT_1_BARK.triggered = true;

    audioManager.playDogBark(true);
    this.showThreat("BẠN NGHE TIẾNG CHÓ SỦA VỌNG LẠI TỪ PHÍA GIẾNG...");
  }

  // --- EVENT 2: BÓNG MA QUỶ CẨU VỤT QUA CUỐI ĐƯỜNG ---
  triggerEvent2(playerPosition) {
    if (this.events.EVENT_2_SHADOW.triggered) return;
    this.events.EVENT_2_SHADOW.triggered = true;

    // Temporary shadow silhouette object
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x050505, transparent: true, opacity: 0.85 });
    const shadow = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 2.5), shadowMat);
    shadow.position.set(playerPosition.x + 8, 1.0, playerPosition.z - 25);
    this.scene.add(shadow);

    audioManager.playHorrorStinger();
    this.showThreat("MỘT BÓNG ĐEN VỪA VỤT QUA CUỐI ĐƯỜNG LÀNG!");

    // Dash across and vanish
    const startX = shadow.position.x;
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 0.05;
      shadow.position.x = startX - elapsed * 20;
      if (elapsed > 0.8) {
        clearInterval(interval);
        this.scene.remove(shadow);
      }
    }, 50);
  }

  // --- EVENT 3: DẤU CHÂN MÁU XUẤT HIỆN ---
  triggerEvent3(pos) {
    if (this.events.EVENT_3_FOOTPRINTS.triggered) return;
    this.events.EVENT_3_FOOTPRINTS.triggered = true;

    audioManager.playMonsterGrowl();
    this.showThreat("CÓ MÙI MÁU TANH BẤT THƯỜNG TRÊN NỀN ĐẤT!");
  }

  // --- EVENT 4: QUỶ CẨU NHÌN TỪ XA TẠI NGHĨA ĐỊA ---
  triggerEvent4() {
    if (this.events.EVENT_4_RED_EYES.triggered) return;
    this.events.EVENT_4_RED_EYES.triggered = true;

    // Position Quỷ Cẩu behind a grave, looking at player
    this.quyCau.group.visible = true;
    this.quyCau.group.position.set(30, 0, -75);
    this.quyCau.state = 'IDLE';

    audioManager.playMonsterGrowl();
    this.showThreat("HAI ĐỐM MẮT ĐỎ RỰC ĐANG NHÌN BẠN TỪ BÓNG TỐI NGHĨA ĐỊA...");
  }

  // --- EVENT 5: RƯỢT ĐUỔI BẤT NGỜ ---
  triggerEvent5(playerPosition) {
    if (this.events.EVENT_5_SURPRISE_CHASE.triggered) return;
    this.events.EVENT_5_SURPRISE_CHASE.triggered = true;

    // Spawn Quỷ Cẩu near player and trigger CHASE
    this.quyCau.group.visible = true;
    this.quyCau.group.position.set(playerPosition.x - 12, 0, playerPosition.z - 15);
    this.quyCau.state = 'CHASE';

    audioManager.playMonsterRoar();
    audioManager.startChaseMusic();
    this.showThreat("QUỶ CẨU PHÁT HIỆN RA BẠN! HÃY CHẠY MAU!", 5000);
  }

  update(playerPosition) {
    const pz = playerPosition.z;
    const px = playerPosition.x;

    // Spatial triggers based on player journey through the village
    if (pz < 30 && pz > 15 && !this.events.EVENT_1_BARK.triggered) {
      this.triggerEvent1();
    } else if (pz < 10 && pz > -5 && !this.events.EVENT_2_SHADOW.triggered) {
      this.triggerEvent2(playerPosition);
    } else if (px > 18 && pz < -45 && !this.events.EVENT_4_RED_EYES.triggered) {
      this.triggerEvent4();
    } else if (pz < -65 && !this.events.EVENT_5_SURPRISE_CHASE.triggered) {
      this.triggerEvent5(playerPosition);
    }
  }
}
