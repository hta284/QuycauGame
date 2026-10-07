import * as THREE from 'three';
import { audioManager } from '../audio/AudioManager.js';

export const AIState = {
  IDLE: 'IDLE',
  PATROL: 'PATROL',
  INVESTIGATE: 'INVESTIGATE',
  DETECT_PLAYER: 'DETECT_PLAYER',
  CHASE: 'CHASE',
  ATTACK: 'ATTACK',
  SEARCH: 'SEARCH',
  RETURN: 'RETURN'
};

export class QuyCau {
  constructor(scene) {
    this.scene = scene;

    // AI & Combat Attributes
    this.state = AIState.IDLE;
    this.position = new THREE.Vector3(0, 0, -60);
    this.targetPosition = new THREE.Vector3(0, 0, -60);
    this.spawnPosition = new THREE.Vector3(0, 0, -60);

    this.patrolPoints = [
      new THREE.Vector3(-15, 0, -45),
      new THREE.Vector3(15, 0, -50),
      new THREE.Vector3(25, 0, -75),
      new THREE.Vector3(-20, 0, -80),
      new THREE.Vector3(0, 0, -110)
    ];
    this.currentPatrolIndex = 0;

    this.speed = 3.5;
    this.chaseSpeed = 7.8;
    this.searchTimer = 0;
    this.stateTimer = 0;
    this.detectionMeter = 0; // 0 to 1
    this.growlCooldown = 0;

    // Boss attributes
    this.isBoss = false;
    this.bossPhase = 1;
    this.bossHealth = 100;
    this.isShielded = true; // True in phase 1 & 2 until 3 altars activated

    this.group = new THREE.Group();
    this.createModel();
    this.scene.add(this.group);

    this.isVisible = true;
    this.group.visible = false;
  }

  createModel() {
    // Stylized Vietnamese Folklore Horror: Quỷ Cẩu
    // Emaciated black canine with elongated unnatural limbs and glowing crimson/yellow eyes
    const darkFurMat = new THREE.MeshStandardMaterial({
      color: 0x08090b,
      roughness: 1,
      metalness: 0,
      flatShading: true
    });

    const spineMat = new THREE.MeshStandardMaterial({
      color: 0x171619,
      roughness: 1,
      flatShading: true
    });

    // 1. Ribcage & Hunched Spine (Hóp sâu, lộ đốt sống nhô cao)
    const torsoGeo = new THREE.CylinderGeometry(0.38, 0.48, 1.8, 8);
    this.torso = new THREE.Mesh(torsoGeo, darkFurMat);
    this.torso.rotation.x = Math.PI / 2.3;
    this.torso.position.set(0, 1.4, 0);
    this.group.add(this.torso);

    // Spine spikes (gai xương sống)
    for (let i = 0; i < 7; i++) {
      const spikeGeo = new THREE.ConeGeometry(0.06, 0.22, 5);
      const spike = new THREE.Mesh(spikeGeo, spineMat);
      spike.rotation.x = -Math.PI / 6;
      spike.position.set(0, 1.75 + Math.sin(i * 0.4) * 0.15, -0.6 + i * 0.22);
      this.group.add(spike);
    }

    // 2. Elongated Menacing Canine Head
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.85, 0.9);

    const craniumGeo = new THREE.BoxGeometry(0.42, 0.36, 0.5);
    const cranium = new THREE.Mesh(craniumGeo, darkFurMat);
    this.headGroup.add(cranium);

    // Long pointed snout / jaw
    const snoutGeo = new THREE.ConeGeometry(0.24, 0.7, 6);
    const snout = new THREE.Mesh(snoutGeo, darkFurMat);
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, -0.06, 0.45);
    this.headGroup.add(snout);

    // Sharp fangs (răng nanh sắc nhọn)
    const fangMat = new THREE.MeshBasicMaterial({ color: 0xd8c2aa });
    [-0.1, 0.1].forEach(x => {
      const fang = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 4), fangMat);
      fang.rotation.x = Math.PI;
      fang.position.set(x, -0.2, 0.6);
      this.headGroup.add(fang);
    });

    // Pointed ragged ears
    [-0.18, 0.18].forEach(x => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.35, 4), darkFurMat);
      ear.rotation.z = x > 0 ? -0.3 : 0.3;
      ear.position.set(x, 0.28, -0.05);
      this.headGroup.add(ear);
    });

    // Fiery Reflective Glowing Eyes (Mắt quỷ phản chiếu ánh lửa)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff1100 });
    [-0.12, 0.12].forEach(x => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.055, 0.04), eyeMat);
      eye.position.set(x, 0.08, 0.28);
      this.headGroup.add(eye);
    });

    // Eye glow point light
    this.eyeLight = new THREE.PointLight(0xff1100, 1.8, 7, 2.0);
    this.eyeLight.position.set(0, 0.1, 0.4);
    this.headGroup.add(this.eyeLight);

    this.group.add(this.headGroup);

    // 3. Unnaturally Long Spindly Limbs (Chân dài bất thường, khuỷu gập sắc nhọn)
    this.legs = [];
    const legPositions = [
      { x: -0.35, z: 0.65, isFront: true },
      { x: 0.35, z: 0.65, isFront: true },
      { x: -0.38, z: -0.65, isFront: false },
      { x: 0.38, z: -0.65, isFront: false }
    ];

    legPositions.forEach((pos, idx) => {
      const legGroup = new THREE.Group();
      legGroup.position.set(pos.x, 1.2, pos.z);

      // Upper leg
      const upperGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.8, 6);
      const upper = new THREE.Mesh(upperGeo, darkFurMat);
      upper.position.y = -0.35;
      upper.rotation.x = pos.isFront ? -0.2 : 0.35;
      legGroup.add(upper);

      // Lower leg
      const lowerGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.9, 6);
      const lower = new THREE.Mesh(lowerGeo, darkFurMat);
      lower.position.set(0, -0.9, pos.isFront ? 0.1 : -0.15);
      lower.rotation.x = pos.isFront ? 0.3 : -0.4;
      legGroup.add(lower);

      // Paw with claws
      const pawGeo = new THREE.BoxGeometry(0.14, 0.08, 0.22);
      const paw = new THREE.Mesh(pawGeo, darkFurMat);
      paw.position.set(0, -1.35, pos.isFront ? 0.15 : -0.1);
      legGroup.add(paw);

      this.group.add(legGroup);
      this.legs.push({ group: legGroup, isFront: pos.isFront, index: idx });
    });

    // 4. Ragged Tail (Đuôi cọc dài uốn lượn)
    this.tailGroup = new THREE.Group();
    this.tailGroup.position.set(0, 1.45, -0.85);
    for (let t = 0; t < 4; t++) {
      const segGeo = new THREE.CylinderGeometry(0.06 - t * 0.01, 0.05 - t * 0.01, 0.3, 5);
      const seg = new THREE.Mesh(segGeo, darkFurMat);
      seg.rotation.x = -Math.PI / 3;
      seg.position.set(0, 0.15 + t * 0.18, -t * 0.2);
      this.tailGroup.add(seg);
    }
    this.group.add(this.tailGroup);

    // Dark miasma / Evil shield aura for boss fight
    const auraGeo = new THREE.SphereGeometry(2.2, 16, 16);
    this.auraMat = new THREE.MeshBasicMaterial({
      color: 0x550000,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    this.auraMesh = new THREE.Mesh(auraGeo, this.auraMat);
    this.auraMesh.position.y = 1.2;
    this.group.add(this.auraMesh);
    this.auraMesh.visible = false;
  }

  setBossMode(enabled, phase = 1) {
    this.isBoss = enabled;
    this.bossPhase = phase;
    this.auraMesh.visible = enabled && this.isShielded;
    if (enabled) {
      this.group.scale.set(1.4, 1.4, 1.4); // Larger intimidating boss silhouette
      this.eyeLight.color.setHex(0xff0000);
      this.eyeLight.intensity = 3.0;
    } else {
      this.group.scale.set(1, 1, 1);
    }
  }

  breakShield() {
    this.isShielded = false;
    this.auraMesh.visible = false;
    this.eyeLight.color.setHex(0xff5500);
    audioManager.playHorrorStinger();
  }

  update(delta, playerPos, isPlayerRunning) {
    if (!this.group.visible) return;

    this.stateTimer += delta;
    this.growlCooldown -= delta;

    const distToPlayer = this.group.position.distanceTo(playerPos);

    if (this.deathSystem && !this.deathSystem.isDead && !this.isBoss && distToPlayer < 2.3 && this.state === AIState.ATTACK) {
      this.deathSystem.triggerDeath(this);
      return;
    }

    // Growl occasionally when near
    if (distToPlayer < 25 && this.growlCooldown <= 0) {
      audioManager.playMonsterGrowl();
      this.growlCooldown = 6.0 + Math.random() * 5.0;
    }

    // AI State Machine
    switch (this.state) {
      case AIState.IDLE:
        if (this.stateTimer > 3.0) {
          this.state = AIState.PATROL;
          this.stateTimer = 0;
          this.pickNextPatrol();
        }
        this.checkPlayerDetection(distToPlayer, isPlayerRunning, playerPos);
        break;

      case AIState.PATROL:
        this.moveTo(this.targetPosition, this.speed, delta);
        if (this.group.position.distanceTo(this.targetPosition) < 2.0) {
          this.state = AIState.IDLE;
          this.stateTimer = 0;
        }
        this.checkPlayerDetection(distToPlayer, isPlayerRunning, playerPos);
        break;

      case AIState.INVESTIGATE:
        this.moveTo(this.targetPosition, this.speed * 1.3, delta);
        if (this.group.position.distanceTo(this.targetPosition) < 3.0) {
          this.state = AIState.SEARCH;
          this.stateTimer = 0;
          this.searchTimer = 4.0;
        }
        this.checkPlayerDetection(distToPlayer, isPlayerRunning, playerPos);
        break;

      case AIState.DETECT_PLAYER:
        this.lookAt(playerPos);
        if (this.stateTimer > 1.0) {
          this.state = AIState.CHASE;
          this.stateTimer = 0;
          audioManager.playMonsterRoar();
          audioManager.startChaseMusic();
        }
        break;

      case AIState.CHASE:
        this.targetPosition.copy(playerPos);
        this.moveTo(this.targetPosition, this.chaseSpeed, delta);

        if (distToPlayer < 2.5) {
          this.state = AIState.ATTACK;
          this.stateTimer = 0;
        } else if (distToPlayer > 38.0 && !this.isBoss) {
          // Lost player
          this.state = AIState.SEARCH;
          this.searchTimer = 5.0;
          audioManager.stopChaseMusic();
        }
        break;

      case AIState.ATTACK:
        this.lookAt(playerPos);
        // Attack lunge
        if (this.stateTimer > 0.8) {
          this.state = AIState.CHASE;
          this.stateTimer = 0;
        }
        break;

      case AIState.SEARCH:
        this.searchTimer -= delta;
        this.group.rotation.y += Math.sin(this.stateTimer * 2) * 0.02;
        if (this.searchTimer <= 0) {
          this.state = AIState.RETURN;
          this.targetPosition.copy(this.spawnPosition);
        }
        this.checkPlayerDetection(distToPlayer, isPlayerRunning, playerPos);
        break;

      case AIState.RETURN:
        this.moveTo(this.targetPosition, this.speed, delta);
        if (this.group.position.distanceTo(this.targetPosition) < 3.0) {
          this.state = AIState.IDLE;
        }
        this.checkPlayerDetection(distToPlayer, isPlayerRunning, playerPos);
        break;
    }

    // Procedural Walking / Breathing Animation
    this.animateMovement(delta);
  }

  checkPlayerDetection(dist, isRunning, playerPos) {
    if (this.isBoss) return; // Boss is handled by BossFightSystem

    // Running noise can be heard from 24 meters
    if (isRunning && dist < 24) {
      this.state = AIState.INVESTIGATE;
      this.targetPosition.copy(playerPos);
      return;
    }

    // Direct sight proximity
    if (dist < 10) {
      this.state = AIState.DETECT_PLAYER;
      this.stateTimer = 0;
      return;
    }

    // Front FOV check
    if (dist < 20) {
      const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.group.quaternion);
      const toPlayer = new THREE.Vector3().subVectors(playerPos, this.group.position).normalize();
      const dot = forward.dot(toPlayer);
      if (dot > 0.4) {
        // Player is in front
        this.state = AIState.DETECT_PLAYER;
        this.stateTimer = 0;
      }
    }
  }

  pickNextPatrol() {
    this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
    this.targetPosition.copy(this.patrolPoints[this.currentPatrolIndex]);
  }

  moveTo(target, speed, delta) {
    const dir = new THREE.Vector3().subVectors(target, this.group.position);
    dir.y = 0;
    const len = dir.length();
    if (len > 0.05) {
      dir.normalize();
      this.group.position.addScaledVector(dir, speed * delta);
      const angle = Math.atan2(dir.x, dir.z);
      this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, angle, 0.12);
    }
  }

  lookAt(target) {
    const dir = new THREE.Vector3().subVectors(target, this.group.position);
    dir.y = 0;
    const angle = Math.atan2(dir.x, dir.z);
    this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, angle, 0.15);
  }

  animateMovement(delta) {
    const isMoving = this.state === AIState.PATROL || this.state === AIState.CHASE || this.state === AIState.INVESTIGATE;
    const speedFactor = this.state === AIState.CHASE ? 14 : 7;
    const t = performance.now() * 0.001 * speedFactor;

    // Spine breathing / arching
    this.torso.position.y = 1.4 + Math.sin(t * 0.8) * 0.04;

    // Head bobbing & sniffing
    this.headGroup.position.y = 1.85 + Math.sin(t * 0.9) * 0.06;
    this.headGroup.rotation.x = Math.sin(t * 0.5) * 0.08;

    // Tail waving
    this.tailGroup.rotation.y = Math.sin(t * 0.8) * 0.3;

    // Leg swinging
    this.legs.forEach(leg => {
      if (isMoving) {
        const offset = (leg.index % 2 === 0 ? 0 : Math.PI) + (leg.isFront ? 0 : Math.PI / 2);
        leg.group.rotation.x = Math.sin(t + offset) * 0.45;
      } else {
        leg.group.rotation.x = THREE.MathUtils.lerp(leg.group.rotation.x, 0, 0.1);
      }
    });

    // Aura pulse if boss
    if (this.auraMesh && this.auraMesh.visible) {
      this.auraMesh.rotation.y += delta * 1.5;
      this.auraMesh.rotation.x += delta * 0.8;
      const s = 1.0 + Math.sin(performance.now() * 0.005) * 0.08;
      this.auraMesh.scale.set(s, s, s);
    }
  }
}
