import * as THREE from 'three';

export class NPC {
  constructor(scene, options) {
    this.scene = scene;
    this.id = options.id;
    this.name = options.name;
    this.dialogueKey = options.dialogueKey;
    this.position = options.position || new THREE.Vector3();
    this.portrait = options.portrait;
    this.interactDistance = options.interactDistance || 3.5;
    this.isTrapped = options.isTrapped || false;

    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    this.createModel(options);
    // NOTE: Do NOT auto-add to scene here.
    // The caller (AreaManager or Game) is responsible for adding this.group to the correct parent.
  }

  createModel(options) {
    // Traditional Vietnamese Rural NPC stylized visual
    const bodyMat = new THREE.MeshStandardMaterial({
      color: options.robeColor || 0x4a3b32,
      roughness: 0.8
    });

    // Torso / Áo bà ba / Áo dài nâu sồng
    const torsoGeo = new THREE.CylinderGeometry(0.3, 0.45, 1.1, 8);
    const torso = new THREE.Mesh(torsoGeo, bodyMat);
    torso.position.y = 1.05;
    this.group.add(torso);

    // Head
    const headMat = new THREE.MeshStandardMaterial({ color: 0xd6b69a, roughness: 0.6 });
    const headGeo = new THREE.SphereGeometry(0.2, 12, 12);
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.75;
    this.group.add(head);

    // Nón lá / Khăn rằn (Traditional Vietnamese Conical Hat or Headdress)
    if (options.hasHat !== false) {
      const hatGeo = new THREE.ConeGeometry(0.48, 0.28, 16);
      const hatMat = new THREE.MeshStandardMaterial({ color: 0xbaa479, roughness: 0.9 });
      const hat = new THREE.Mesh(hatGeo, hatMat);
      hat.position.y = 1.95;
      this.group.add(hat);
    }

    // Warm oil lamp at NPC's side
    const lampGroup = new THREE.Group();
    lampGroup.position.set(0.6, 0.6, 0.4);

    const lampGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.25, 6);
    const lampMat = new THREE.MeshStandardMaterial({
      color: 0x221105,
      metalness: 0.5,
      roughness: 0.5
    });
    const lampMesh = new THREE.Mesh(lampGeo, lampMat);
    lampGroup.add(lampMesh);

    // Glowing core
    const flameGeo = new THREE.SphereGeometry(0.04, 6, 6);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa33 });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.y = 0.05;
    lampGroup.add(flame);

    const lampLight = new THREE.PointLight(0xff9922, 1.6, 8, 1.8);
    lampLight.position.y = 0.1;
    lampGroup.add(lampLight);

    this.group.add(lampGroup);

    // Trapped bindings for Lan Chi at the shrine
    if (this.isTrapped) {
      this.createTrappedBrambles();
    }

    // Interactive hitbox
    const hitGeo = new THREE.CylinderGeometry(1.0, 1.0, 2.2, 8);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    this.hitbox = new THREE.Mesh(hitGeo, hitMat);
    this.hitbox.position.y = 1.1;
    this.hitbox.userData = {
      type: 'npc',
      npc: this
    };
    this.group.add(this.hitbox);
  }

  createTrappedBrambles() {
    const vineMat = new THREE.MeshStandardMaterial({ color: 0x331111, roughness: 0.9 });
    for (let i = 0; i < 6; i++) {
      const ringGeo = new THREE.TorusGeometry(0.4 + i * 0.05, 0.03, 6, 12);
      const ring = new THREE.Mesh(ringGeo, vineMat);
      ring.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.3;
      ring.position.y = 0.6 + i * 0.25;
      this.group.add(ring);
    }
  }

  freeFromTraps() {
    this.isTrapped = false;
    // Remove brambles
    const toRemove = [];
    this.group.children.forEach(child => {
      if (child.geometry && child.geometry.type === 'TorusGeometry') {
        toRemove.push(child);
      }
    });
    toRemove.forEach(c => this.group.remove(c));
  }

  update(playerPosition) {
    // Face player if nearby
    const dx = playerPosition.x - this.group.position.x;
    const dz = playerPosition.z - this.group.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 8) {
      const angle = Math.atan2(dx, dz);
      this.group.rotation.y = angle;
    }
  }
}
