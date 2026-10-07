import * as THREE from 'three';

export class InteractionSystem {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 4.0; // Max interact reach in meters
    this.centerScreen = new THREE.Vector2(0, 0);

    this.currentTarget = null;
    this.onInteractCallback = null;

    // Cache DOM elements
    this.crosshairEl = document.getElementById('crosshair');
    this.promptEl = document.getElementById('interaction-prompt');
    this.promptTextEl = document.getElementById('interaction-text');

    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyE' && this.currentTarget) {
        if (this.onInteractCallback) {
          this.onInteractCallback(this.currentTarget);
        }
      }
    });
  }

  update(interactables) {
    if (!interactables || interactables.length === 0) {
      this.clearTarget();
      return;
    }

    this.raycaster.setFromCamera(this.centerScreen, this.camera);
    const intersects = this.raycaster.intersectObjects(interactables, false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const data = hit.object.userData;

      if (data && data.type) {
        this.setTarget(data);
        return;
      }
    }

    this.clearTarget();
  }

  setTarget(data) {
    this.currentTarget = data;
    if (this.crosshairEl) this.crosshairEl.classList.add('interactable');
    if (this.promptEl) this.promptEl.classList.remove('hidden');

    if (this.promptTextEl) {
      let actionText = 'Tương tác';
      if (data.type === 'npc') {
        actionText = `Nói chuyện với ${data.npc.name}`;
      } else if (data.type === 'gateway') {
        actionText = data.name;
      } else if (data.type === 'clue') {
        actionText = `Thu thập: ${data.name}`;
      } else if (data.type === 'pedestal') {
        actionText = data.activated ? `${data.name} (Đã kích hoạt)` : `Kích hoạt ${data.name}`;
      } else if (data.type === 'sacred_flame') {
        actionText = `Lấy Ngọn Lửa Thiêng Trấn Quỷ`;
      }
      this.promptTextEl.innerText = actionText;
    }
  }

  clearTarget() {
    this.currentTarget = null;
    if (this.crosshairEl) this.crosshairEl.classList.remove('interactable');
    if (this.promptEl) this.promptEl.classList.add('hidden');
  }

  onInteract(callback) {
    this.onInteractCallback = callback;
  }
}
