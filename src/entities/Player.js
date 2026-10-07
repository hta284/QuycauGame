import * as THREE from 'three';
import { audioManager } from '../audio/AudioManager.js';

export class Player {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;

    // Movement attributes
    this.position = new THREE.Vector3(0, 1.7, 45); // Start at village gate
    this.velocity = new THREE.Vector3();
    this.walkSpeed = 5.2;
    this.runSpeed = 9.0;
    this.stamina = 100;
    this.maxStamina = 100;
    this.staminaDrain = 22; // per second when running
    this.staminaRecovery = 15; // per second when walking/idle
    this.isExhausted = false;

    // Flashlight
    this.flashlightOn = true;
    this.createFlashlight();

    // Camera rig
    this.camera.position.copy(this.position);

    // Audio & Danger
    this.dangerLevel = 0; // 0 to 1
  }

  createFlashlight() {
    this.flashlight = new THREE.SpotLight(0xfff2d6, 3.2, 35, Math.PI / 5.5, 0.45, 1.8);
    this.flashlight.position.set(0.2, -0.2, 0.1);
    this.flashlightTarget = new THREE.Object3D();
    this.flashlightTarget.position.set(0, 0, -10);

    this.camera.add(this.flashlight);
    this.camera.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;

    // Soft surrounding light so player isn't completely pitch black
    this.lanternAmbient = new THREE.PointLight(0xffe2b0, 0.6, 6, 2.0);
    this.camera.add(this.lanternAmbient);
  }

  toggleFlashlight() {
    this.flashlightOn = !this.flashlightOn;
    this.flashlight.intensity = this.flashlightOn ? 3.2 : 0;
    this.lanternAmbient.intensity = this.flashlightOn ? 0.6 : 0.1;
    audioManager.playInteract();
  }

  update(delta, moveDir, isRunning) {
    // Stamina calculation
    const moving = moveDir.lengthSq() > 0.001;
    const canRun = isRunning && moving && !this.isExhausted && this.stamina > 5;

    if (canRun) {
      this.stamina = Math.max(0, this.stamina - this.staminaDrain * delta);
      if (this.stamina <= 0) {
        this.isExhausted = true;
      }
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRecovery * delta);
      if (this.isExhausted && this.stamina > 30) {
        this.isExhausted = false;
      }
    }

    // Footstep sound & movement
    const currentSpeed = canRun ? this.runSpeed : this.walkSpeed;
    if (moving) {
      audioManager.playFootstep(canRun);
    }

    // Flashlight subtle bobbing
    if (moving) {
      const bobFreq = canRun ? 12 : 8;
      const bobAmount = canRun ? 0.04 : 0.02;
      this.flashlight.position.y = -0.2 + Math.sin(performance.now() * 0.001 * bobFreq) * bobAmount;
      this.flashlight.position.x = 0.2 + Math.cos(performance.now() * 0.001 * bobFreq * 0.5) * (bobAmount * 0.5);
    }

    // Dynamic danger sound feedback
    audioManager.setDangerLevel(this.dangerLevel);

    return {
      canRun,
      currentSpeed,
      staminaRatio: this.stamina / this.maxStamina
    };
  }
}
