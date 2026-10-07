import * as THREE from 'three';

export class PlayerController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    this.isLocked = false;
    this.enabled = true;
    this.mouseSensitivity = 0.0022;
    this.colliders = [];

    // Camera rotation angles
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.camera.rotation.order = 'YXZ';
    this.minPolarAngle = -Math.PI / 2.3;
    this.maxPolarAngle = Math.PI / 2.3;

    // Keyboard states
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      run: false,
      jump: false
    };

    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();

    this.jumpVelocity = 0;
    this.gravity = 18;
    this.jumpForce = 6.8;
    this.isGrounded = true;

    // Head bobbing & Camera Shake
    this.bobTimer = 0;
    this.baseHeight = 1.7;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTimer = 0;

    this.setupPointerLock();
    this.setupKeyboard();
  }

  setSensitivity(factor) {
    // 1 to 10
    this.mouseSensitivity = 0.0008 + factor * 0.00045;
  }

  normalizeYaw(angle) {
    const TAU = Math.PI * 2;
    return ((angle + Math.PI) % TAU + TAU) % TAU - Math.PI;
  }

  setColliders(colliders) {
    this.colliders = Array.isArray(colliders) ? colliders : [];
  }

  isBlocked(x, z, radius = 0.8) {
    for (const box of this.colliders) {
      const nearestX = Math.max(box.minX, Math.min(x, box.maxX));
      const nearestZ = Math.max(box.minZ, Math.min(z, box.maxZ));
      const dx = x - nearestX;
      const dz = z - nearestZ;
      if (dx * dx + dz * dz < radius * radius) {
        return true;
      }
    }
    return false;
  }

  syncCameraFromEuler() {
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.x = this.euler.x;
    this.camera.rotation.y = this.euler.y;
    this.camera.rotation.z = 0;
  }

  triggerShake(intensity = 0.25, duration = 0.5) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }

  setupPointerLock() {
    this.domElement.addEventListener('click', () => {
      if (!this.isLocked && document.pointerLockElement !== this.domElement) {
        this.domElement.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.domElement;
    });

    document.addEventListener('mousemove', (event) => {
      if (!this.isLocked || !this.enabled) return;

      const movementX = event.movementX || 0;
      const movementY = event.movementY || 0;

      // Standard FPS yaw/pitch: right drag = yaw right, mouse up = pitch up.
      this.euler.y -= movementX * this.mouseSensitivity;
      this.euler.x -= movementY * this.mouseSensitivity;

      this.euler.x = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.euler.x));
      this.euler.y = this.normalizeYaw(this.euler.y);

      this.syncCameraFromEuler();
    });
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.run = true;
          break;
        case 'Space':
          if (!this.keys.jump && this.isGrounded) {
            this.keys.jump = true;
            this.jumpVelocity = this.jumpForce;
            this.isGrounded = false;
          }
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.run = false;
          break;
        case 'Space':
          this.keys.jump = false;
          break;
      }
    });
  }

  update(delta, playerEntity) {
    if (!this.isLocked || !this.enabled) return null;

    this.direction.z = Number(this.keys.forward) - Number(this.keys.backward);
    this.direction.x = Number(this.keys.right) - Number(this.keys.left);
    this.direction.normalize();

    const { currentSpeed, canRun, staminaRatio } = playerEntity.update(delta, this.direction, this.keys.run);

    if (this.keys.forward || this.keys.backward) {
      this.velocity.z = this.direction.z * currentSpeed;
    } else {
      this.velocity.z = 0;
    }

    if (this.keys.left || this.keys.right) {
      this.velocity.x = this.direction.x * currentSpeed;
    } else {
      this.velocity.x = 0;
    }

    // Jump / gravity
    if (!this.isGrounded) {
      this.jumpVelocity -= this.gravity * delta;
      this.camera.position.y += this.jumpVelocity * delta;
      if (this.camera.position.y <= this.baseHeight) {
        this.camera.position.y = this.baseHeight;
        this.jumpVelocity = 0;
        this.isGrounded = true;
      }
    }

    // Move in camera orientation (on horizontal XZ plane)
    const moveVector = new THREE.Vector3(this.velocity.x, 0, -this.velocity.z);
    moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.euler.y);

    const nextX = this.camera.position.x + moveVector.x * delta;
    const nextZ = this.camera.position.z + moveVector.z * delta;

    if (!this.isBlocked(nextX, this.camera.position.z)) {
      this.camera.position.x = nextX;
    }
    if (!this.isBlocked(this.camera.position.x, nextZ)) {
      this.camera.position.z = nextZ;
    }

    this.syncCameraFromEuler();

    // Subtle Head Bobbing (only when grounded)
    const isMoving = this.direction.lengthSq() > 0.01;
    if (this.isGrounded) {
      if (isMoving) {
        const bobFreq = canRun ? 14 : 8;
        const bobAmp = canRun ? 0.055 : 0.028;
        this.bobTimer += delta * bobFreq;
        this.camera.position.y = this.baseHeight + Math.sin(this.bobTimer) * bobAmp;
      } else {
        this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, this.baseHeight, 0.1);
      }
    }

    // Camera Shake System (for attacks, horror jumpscares)
    if (this.shakeTimer > 0) {
      this.shakeTimer -= delta;
      const progress = this.shakeTimer / this.shakeDuration;
      const shakeAmt = this.shakeIntensity * progress;
      this.camera.position.x += (Math.random() - 0.5) * shakeAmt;
      this.camera.position.y += (Math.random() - 0.5) * shakeAmt;
      this.camera.rotation.z = (Math.random() - 0.5) * shakeAmt * 0.5;
    } else {
      this.camera.rotation.z = 0;
    }

    // Keep player within village bounds
    this.camera.position.x = Math.max(-100, Math.min(100, this.camera.position.x));
    this.camera.position.z = Math.max(-130, Math.min(65, this.camera.position.z));

    return {
      isRunning: canRun,
      staminaRatio: staminaRatio
    };
  }

  unlockPointer() {
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
  }

  lockPointer() {
    if (this.domElement.requestPointerLock) {
      this.domElement.requestPointerLock();
    }
  }

  resetKeys() {
    this.keys.forward = false;
    this.keys.backward = false;
    this.keys.left = false;
    this.keys.right = false;
    this.keys.run = false;
  }
}
