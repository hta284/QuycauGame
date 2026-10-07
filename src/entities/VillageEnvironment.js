import * as THREE from 'three';
import { TextureGenerator } from '../utils/TextureGenerator.js';
import { NPC } from './NPC.js';

export class VillageEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.interactables = [];
    this.lights = [];
    this.colliders = [];

    // Shared procedural textures & materials
    this.dirtTex = TextureGenerator.createDirtTexture();
    this.woodTex = TextureGenerator.createWoodTexture();
    this.stoneTex = TextureGenerator.createStoneTexture();
    this.tileTex = TextureGenerator.createRoofTileTexture();
    this.talismanTex = TextureGenerator.createTalismanTexture();

    this.dirtMat = new THREE.MeshStandardMaterial({ map: this.dirtTex, roughness: 1, flatShading: true });
    this.woodMat = new THREE.MeshStandardMaterial({ map: this.woodTex, roughness: 1, flatShading: true });
    this.stoneMat = new THREE.MeshStandardMaterial({ map: this.stoneTex, roughness: 1, flatShading: true });
    this.tileMat = new THREE.MeshStandardMaterial({ map: this.tileTex, roughness: 1, flatShading: true });
    // Boss fight specific references
    this.pedestals = [];
    this.brazierLight = null;
    this.sacredFlameMat = null;
    this.lanChiNPC = null;
    this.groundMaterials = new Map();
    this.wayfindingMaterials = new Map();
    this.pathMat = new THREE.MeshStandardMaterial({ color: 0x8c7554, roughness: 1, flatShading: true });
  }

  addColliderBox(width, height, depth, centerX, centerY, centerZ) {
    const minX = centerX - width / 2;
    const maxX = centerX + width / 2;
    const minZ = centerZ - depth / 2;
    const maxZ = centerZ + depth / 2;
    this.colliders.push({ minX, maxX, minZ, maxZ, minY: centerY - height / 2, maxY: centerY + height / 2 });
  }

  // --- MODULAR TERRAIN SEGMENT ---
  createTerrainSegment(parent, center, width = 80, depth = 80) {
    const groundKey = `${width}x${depth}`;
    let groundMaterial = this.groundMaterials.get(groundKey);
    if (!groundMaterial) {
      const groundTexture = this.dirtTex.clone();
      groundTexture.repeat.set(width / 12, depth / 12);
      groundTexture.needsUpdate = true;
      groundMaterial = new THREE.MeshStandardMaterial({
        map: groundTexture,
        color: 0xc8b88f,
        side: THREE.DoubleSide,
        roughness: 1,
        flatShading: true
      });
      this.groundMaterials.set(groundKey, groundMaterial);
    }
    const groundGeo = new THREE.PlaneGeometry(width, depth);
    const ground = new THREE.Mesh(groundGeo, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.copy(center);
    ground.position.y = -0.02;
    ground.receiveShadow = true;
    parent.add(ground);

    // A raised, clearly visible track prevents the route from disappearing into dark ground.
    const roadGeo = new THREE.BoxGeometry(7, 0.06, depth * 0.9);
    const road = new THREE.Mesh(roadGeo, this.pathMat);
    road.position.set(center.x, 0.02, center.z);
    parent.add(road);

    // Surrounding boundary trees
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 0.95 });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x0e140d, roughness: 0.9 });
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const radius = (width / 2) - 4 + Math.random() * 3;
      const tx = center.x + Math.cos(angle) * radius;
      const tz = center.z + Math.sin(angle) * radius;

      const tGroup = new THREE.Group();
      tGroup.position.set(tx, 0, tz);

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.45, 5.5, 6), treeMat);
      trunk.position.y = 2.75;
      tGroup.add(trunk);

      const top = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2 + Math.random() * 0.8), foliageMat);
      top.position.y = 5.5;
      tGroup.add(top);

      parent.add(tGroup);
    }
  }

  createPathSegment(parent, start, end, width = 5) {
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const length = Math.hypot(dx, dz);
    if (length < 0.1) return;

    const path = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.06, length),
      this.pathMat
    );
    path.position.set((start.x + end.x) / 2, 0.025, (start.z + end.z) / 2);
    path.rotation.y = Math.atan2(dx, dz);
    parent.add(path);
  }

  createWayfindingSign(parent, position, label, facingAngle = 0) {
    let material = this.wayfindingMaterials.get(label);
    if (!material) {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 160;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Không thể tạo texture cho biển chỉ đường.');

      context.fillStyle = '#3b2b1b';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = '#d2b56e';
      context.lineWidth = 10;
      context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
      context.fillStyle = '#fff0c4';
      context.font = 'bold 44px sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(label, canvas.width / 2, canvas.height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
      this.wayfindingMaterials.set(label, material);
    }

    const sign = new THREE.Group();
    sign.position.copy(position);

    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.16, 2.4, 8),
      this.woodMat
    );
    post.position.y = 1.2;
    sign.add(post);

    for (const rotation of [facingAngle, facingAngle + Math.PI]) {
      const board = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1), material);
      board.position.y = 2;
      board.rotation.y = rotation;
      sign.add(board);
    }

    const markerLight = new THREE.PointLight(0xffc96b, 1.1, 7, 2);
    markerLight.position.y = 2.5;
    sign.add(markerLight);
    parent.add(sign);
  }

  // --- 1. CỔNG LÀNG (VILLAGE GATE) ---
  createVillageGate(parent, pos) {
    const gateGroup = new THREE.Group();
    gateGroup.position.copy(pos);

    // Gate pillars
    [-3.2, 3.2].forEach(x => {
      const pillarGeo = new THREE.BoxGeometry(1.2, 5.5, 1.2);
      const pillar = new THREE.Mesh(pillarGeo, this.stoneMat);
      pillar.position.set(x, 2.75, 0);
      gateGroup.add(pillar);
    });

    // Arch beam
    const beamGeo = new THREE.BoxGeometry(8.2, 0.8, 1.4);
    const beam = new THREE.Mesh(beamGeo, this.woodMat);
    beam.position.set(0, 5.2, 0);
    gateGroup.add(beam);

    // Curved Traditional Vietnamese Roof
    const roofGeo = new THREE.ConeGeometry(5.2, 1.8, 4);
    const roof = new THREE.Mesh(roofGeo, this.tileMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(0, 6.4, 0);
    gateGroup.add(roof);

    // Banyan Tree (Cây đa cổng làng)
    this.createBanyanTree(gateGroup, new THREE.Vector3(-6.5, 0, 3));

    // Warm Gate Lanterns
    this.createLantern(gateGroup, new THREE.Vector3(-2.2, 4.2, 0.6));
    this.createLantern(gateGroup, new THREE.Vector3(2.2, 4.2, 0.6));

    parent.add(gateGroup);
  }

  createBanyanTree(parent, pos) {
    const trunkGeo = new THREE.CylinderGeometry(0.9, 1.5, 9, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x241d18, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.copy(pos);
    trunk.position.y = 4.5;
    parent.add(trunk);

    const leafMat = new THREE.MeshStandardMaterial({ color: 0x142010, roughness: 0.9 });
    for (let i = 0; i < 5; i++) {
      const foliageGeo = new THREE.DodecahedronGeometry(2.8 + Math.random() * 1.2);
      const foliage = new THREE.Mesh(foliageGeo, leafMat);
      foliage.position.set(
        pos.x + (Math.random() - 0.5) * 3,
        pos.y + 7.5 + Math.random() * 2,
        pos.z + (Math.random() - 0.5) * 3
      );
      parent.add(foliage);
    }
  }

  // --- 2. NHÀ NHÂN VẬT CHÍNH (NAM'S HOUSE) ---
  createPlayerHouse(parent, pos, interactablesList = null) {
    const houseGroup = new THREE.Group();
    houseGroup.position.copy(pos);

    // Base floor & Veranda
    const floor = new THREE.Mesh(new THREE.BoxGeometry(13, 0.4, 11), this.woodMat);
    floor.position.set(0, 0.2, 0);
    houseGroup.add(floor);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x3d3228, roughness: 0.85 });
    const doorWidth = 2.5;
    const halfWidth = 6;

    // Front wall with door opening
    const frontWallLeft = new THREE.Mesh(new THREE.BoxGeometry((12 - doorWidth) / 2, 3.5, 0.3), wallMat);
    frontWallLeft.position.set(-((doorWidth / 2) + (6 - doorWidth / 2) / 2), 2.0, 4.8);
    houseGroup.add(frontWallLeft);
    const frontWallRight = new THREE.Mesh(new THREE.BoxGeometry((12 - doorWidth) / 2, 3.5, 0.3), wallMat);
    frontWallRight.position.set(((doorWidth / 2) + (6 - doorWidth / 2) / 2), 2.0, 4.8);
    houseGroup.add(frontWallRight);

    this.addColliderBox(12, 3.5, 0.35, pos.x, 2.0, pos.z - 4.8);
    [-5.8, 5.8].forEach(x => {
      const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.5, 9.8), wallMat);
      sideWall.position.set(x, 2.0, 0);
      houseGroup.add(sideWall);
      this.addColliderBox(0.35, 3.5, 9.8, pos.x + x, 2.0, pos.z);
    });

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(12, 3.5, 0.3), wallMat);
    backWall.position.set(0, 2.0, -4.8);
    houseGroup.add(backWall);

    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.8, 0.2), this.woodMat);
    doorFrame.position.set(0, 1.4, 4.9);
    houseGroup.add(doorFrame);

    // Veranda pillars
    [-5, -1.8, 1.8, 5].forEach(x => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 3.5, 8), this.woodMat);
      col.position.set(x, 2.0, 4.8);
      houseGroup.add(col);
    });

    // Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(9.5, 2.5, 4), this.tileMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(0, 4.9, 0);
    houseGroup.add(roof);

    // Ancestral Altar
    const altar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 1.0), this.woodMat);
    altar.position.set(0, 0.8, -4.0);
    houseGroup.add(altar);

    // Incense burner
    const incense = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.25, 8), this.stoneMat);
    incense.position.set(0, 1.5, -4.0);
    houseGroup.add(incense);

    const incenseLight = new THREE.PointLight(0xff3300, 0.8, 4, 2.0);
    incenseLight.position.set(0, 1.65, -4.0);
    houseGroup.add(incenseLight);

    // CLUE 02: Family Photo on Altar
    this.createClueItem({
      id: 'CLUE_02',
      name: 'Bức Ảnh Gia Đình Cũ',
      position: new THREE.Vector3(pos.x, 1.5, pos.z - 3.8),
      parent: parent,
      interactablesList: interactablesList
    });

    const bedGroup = new THREE.Group();
    bedGroup.position.set(3, 0, 0);
    const bedWood = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.35, 1.2), this.woodMat);
    bedWood.position.y = 0.35;
    bedGroup.add(bedWood);
    const bedMat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.22, 1.05), new THREE.MeshStandardMaterial({
      color: 0x9b8a70,
      roughness: 1,
      flatShading: true
    }));
    bedMat.position.set(0, 0.64, 0);
    bedGroup.add(bedMat);
    const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.75), new THREE.MeshStandardMaterial({
      color: 0xc4b99d,
      roughness: 1,
      flatShading: true
    }));
    pillow.position.set(0.62, 0.82, 0);
    bedGroup.add(pillow);
    const sleepTarget = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.7, 1.5),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    sleepTarget.position.set(0, 0.85, 0);
    sleepTarget.userData = { type: 'bed', name: 'Nghỉ ngơi' };
    bedGroup.add(sleepTarget);
    houseGroup.add(bedGroup);
    if (interactablesList) interactablesList.push(sleepTarget);

    this.createLantern(houseGroup, new THREE.Vector3(0, 3.2, 4.8));
    parent.add(houseGroup);
  }

  createMarketStand(parent, pos) {
    const market = new THREE.Group();
    market.position.copy(pos);
    const wood = new THREE.MeshStandardMaterial({ color: 0x59412d, roughness: 1, flatShading: true });
    const awning = new THREE.MeshStandardMaterial({ color: 0x8b4a36, roughness: 1, flatShading: true });
    const counter = new THREE.Mesh(new THREE.BoxGeometry(5, 1.1, 1.2), wood);
    counter.position.y = 0.55;
    market.add(counter);

    [-2.1, 2.1].forEach(x => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.8, 0.16), wood);
      post.position.set(x, 1.4, -0.35);
      market.add(post);
    });

    const roof = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.18, 2.8), awning);
    roof.position.set(0, 2.85, -0.35);
    market.add(roof);
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 256;
    signCanvas.height = 64;
    const context = signCanvas.getContext('2d');
    if (!context) throw new Error('Không thể tạo biển hiệu chợ.');
    context.fillStyle = '#443225';
    context.fillRect(0, 0, 256, 64);
    context.fillStyle = '#e1cfaa';
    context.font = 'bold 28px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('TẠP HÓA', 128, 32);
    const signTexture = new THREE.CanvasTexture(signCanvas);
    signTexture.magFilter = THREE.NearestFilter;
    signTexture.minFilter = THREE.NearestFilter;
    signTexture.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 0.6),
      new THREE.MeshBasicMaterial({ map: signTexture, toneMapped: false })
    );
    sign.position.set(0, 2.35, 0.61);
    market.add(sign);
    parent.add(market);
  }

  createNPC1House(parent, pos) {
    this.createRuralHouse(parent, pos, 'Nhà Bà Lan');
    this.createLantern(parent, new THREE.Vector3(pos.x - 3, 2.5, pos.z + 4));
  }

  createNPC2House(parent, pos) {
    this.createRuralHouse(parent, pos, 'Nhà Ông Tư');
    this.createLantern(parent, new THREE.Vector3(pos.x - 3, 2.5, pos.z + 4));
  }

  createRuralHouse(parent, pos, name) {
    const house = new THREE.Group();
    house.position.copy(pos);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x302720, roughness: 0.85 });
    const building = new THREE.Mesh(new THREE.BoxGeometry(9, 3.2, 7), wallMat);
    building.position.set(0, 1.6, 0);
    house.add(building);

    const doorWidth = 2.2;
    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry((9 - doorWidth) / 2, 3.2, 0.3), wallMat);
    wallLeft.position.set(-((doorWidth / 2) + (9 - doorWidth) / 4), 1.6, 3.4);
    house.add(wallLeft);
    const wallRight = new THREE.Mesh(new THREE.BoxGeometry((9 - doorWidth) / 2, 3.2, 0.3), wallMat);
    wallRight.position.set(((doorWidth / 2) + (9 - doorWidth) / 4), 1.6, 3.4);
    house.add(wallRight);

    this.addColliderBox(9, 3.2, 0.35, pos.x, 1.6, pos.z - 3.3);
    [-4.1, 4.1].forEach(x => {
      this.addColliderBox(0.35, 3.2, 7, pos.x + x, 1.6, pos.z);
    });

    const roof = new THREE.Mesh(new THREE.ConeGeometry(7, 2.2, 4), this.tileMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(0, 4.2, 0);
    house.add(roof);

    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.4, 0.2), this.woodMat);
    doorFrame.position.set(0, 1.2, 3.55);
    house.add(doorFrame);

    for (let i = -6; i <= 6; i += 1.2) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 6), this.woodMat);
      pole.position.set(i, 0.7, 5.5);
      house.add(pole);
    }

    parent.add(house);
  }

  // --- 3. ĐÌNH LÀNG (COMMUNAL HOUSE) ---
  createCommunalHouse(parent, pos, interactablesList = null) {
    const dGroup = new THREE.Group();
    dGroup.position.copy(pos);

    this.addColliderBox(18, 5, 0.5, pos.x, 2.5, pos.z - 8.5);
    this.addColliderBox(18, 5, 0.5, pos.x, 2.5, pos.z + 8.5);
    this.addColliderBox(0.5, 5, 16, pos.x - 9, 2.5, pos.z);
    this.addColliderBox(0.5, 5, 16, pos.x + 9, 2.5, pos.z);

    const platform = new THREE.Mesh(new THREE.BoxGeometry(22, 0.6, 16), this.stoneMat);
    platform.position.set(0, 0.3, 0);
    dGroup.add(platform);

    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x6e1b1b, roughness: 0.6 });
    for (let x = -8; x <= 8; x += 4) {
      for (let z = -5; z <= 5; z += 5) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 5, 10), pillarMat);
        pillar.position.set(x, 3.0, z);
        dGroup.add(pillar);
      }
    }

    const roof = new THREE.Mesh(new THREE.ConeGeometry(15, 3.8, 4), this.tileMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(0, 7.2, 0);
    dGroup.add(roof);

    [-6, 6].forEach(x => {
      this.createLantern(dGroup, new THREE.Vector3(x, 4.2, 5.2), 0xff2200);
    });

    // CLUE 06: Old Shrine Photo
    this.createClueItem({
      id: 'CLUE_06',
      name: 'Ảnh Chụp Miếu Cũ',
      position: new THREE.Vector3(pos.x, 1.5, pos.z),
      parent: parent,
      interactablesList: interactablesList
    });

    parent.add(dGroup);
  }

  // --- 4. GIẾNG LÀNG (CURSED WELL) ---
  createVillageWell(parent, pos, interactablesList = null) {
    const wellGroup = new THREE.Group();
    wellGroup.position.copy(pos);

    const path = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), this.pathMat);
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, 0.03, 0);
    wellGroup.add(path);

    const stoneRing = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.1, 1.0, 18), this.stoneMat);
    stoneRing.position.set(0, 0.5, 0);
    wellGroup.add(stoneRing);

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 1.2, 16, 1, true), this.stoneMat);
    rim.position.set(0, 0.8, 0);
    wellGroup.add(rim);

    const hole = new THREE.Mesh(new THREE.CircleGeometry(1.5, 16), new THREE.MeshBasicMaterial({ color: 0x010203 }));
    hole.rotation.x = -Math.PI / 2;
    hole.position.set(0, 0.2, 0);
    wellGroup.add(hole);

    const ringGlow = new THREE.PointLight(0x59d9ff, 1.5, 12, 2.0);
    ringGlow.position.set(0, 1.0, 0);
    wellGroup.add(ringGlow);

    [-1.4, 1.4].forEach(x => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.5, 6), this.woodMat);
      post.position.set(x, 1.5, 0);
      wellGroup.add(post);
    });

    const crossBar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.0, 6), this.woodMat);
    crossBar.rotation.z = Math.PI / 2;
    crossBar.position.set(0, 2.7, 0);
    wellGroup.add(crossBar);

    const wellRoof = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.0, 4), this.tileMat);
    wellRoof.rotation.y = Math.PI / 4;
    wellRoof.position.set(0, 3.2, 0);
    wellGroup.add(wellRoof);

    const wellLight = new THREE.PointLight(0x116655, 1.8, 8, 2.0);
    wellLight.position.set(0, 0.5, 0);
    wellGroup.add(wellLight);

    this.addColliderBox(6, 2.5, 6, pos.x, 1.2, pos.z);

    // CLUES AT WELL
    this.createClueItem({
      id: 'CLUE_01',
      name: 'Chiếc Vòng Cổ Cũ',
      position: new THREE.Vector3(pos.x + 1.2, 1.0, pos.z + 0.6),
      parent: parent,
      interactablesList: interactablesList
    });

    this.createClueItem({
      id: 'CLUE_03',
      name: 'Dấu Chân Lớn Bất Thường',
      position: new THREE.Vector3(pos.x - 2.2, 0.1, pos.z + 1.8),
      parent: parent,
      interactablesList: interactablesList
    });

    this.createClueItem({
      id: 'CLUE_04',
      name: 'Mảnh Giấy Về Cái Giếng',
      position: new THREE.Vector3(pos.x - 1.2, 0.9, pos.z - 0.4),
      parent: parent,
      interactablesList: interactablesList
    });

    parent.add(wellGroup);
  }

  // --- 5. NGHĨA ĐỊA (GRAVEYARD) ---
  createGraveyard(parent, pos, interactablesList = null) {
    const graveGroup = new THREE.Group();
    graveGroup.position.copy(pos);

    const graveOffsets = [
      { x: -5, z: -4 }, { x: -2, z: -6 }, { x: 3, z: -5 },
      { x: -6, z: 0 }, { x: -1, z: 1 }, { x: 4, z: 2 },
      { x: -3, z: 6 }, { x: 2, z: 7 }, { x: 6, z: 5 }
    ];

    graveOffsets.forEach((g, idx) => {
      const mound = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0x1f1a14, roughness: 0.95 })
      );
      mound.scale.set(1.2, 0.45, 1.6);
      mound.position.set(g.x, 0.2, g.z);
      graveGroup.add(mound);

      const stele = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.1, 0.2), this.stoneMat);
      stele.position.set(g.x, 0.7, g.z - 0.9);
      stele.rotation.y = (Math.random() - 0.5) * 0.3;
      graveGroup.add(stele);

      if (idx % 2 === 0) {
        const incLight = new THREE.PointLight(0xff2200, 0.6, 3, 2.0);
        incLight.position.set(g.x, 0.35, g.z - 0.6);
        graveGroup.add(incLight);
      }
    });

    // Dead gnarled tree
    const deadTree = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.5, 5, 6),
      new THREE.MeshStandardMaterial({ color: 0x181310, roughness: 0.95 })
    );
    deadTree.position.set(0, 2.5, 0);
    deadTree.rotation.z = 0.15;
    graveGroup.add(deadTree);

    // CLUE 05: Trang nhật ký cũ
    this.createClueItem({
      id: 'CLUE_05',
      name: 'Trang Nhật Ký Cũ',
      position: new THREE.Vector3(pos.x - 2, 0.8, pos.z - 6.5),
      parent: parent,
      interactablesList: interactablesList
    });

    parent.add(graveGroup);
  }

  // --- 6. RUỘNG LÚA (PADDY FIELDS) ---
  createPaddyFields(parent, pos) {
    const paddyGroup = new THREE.Group();
    paddyGroup.position.copy(pos);

    const field = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 60),
      new THREE.MeshBasicMaterial({
        color: 0x3c5236,
        side: THREE.DoubleSide
      })
    );
    field.rotation.x = -Math.PI / 2;
    field.position.set(0, 0.005, 0);
    paddyGroup.add(field);

    // Scarecrow
    const strawMat = new THREE.MeshStandardMaterial({ color: 0x5a4a2a, roughness: 0.9 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8, 6), this.woodMat);
    pole.position.set(5, 1.4, 10);
    paddyGroup.add(pole);

    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 6), this.woodMat);
    arm.rotation.z = Math.PI / 2;
    arm.position.set(5, 2.2, 10);
    paddyGroup.add(arm);

    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.25, 8), strawMat);
    hat.position.set(5, 2.8, 10);
    paddyGroup.add(hat);

    parent.add(paddyGroup);
  }

  // --- 7. ĐƯỜNG DẪN VÀO RỪNG (FOREST PATH) ---
  createForestPath(parent, pos, interactablesList = null) {
    const forestGroup = new THREE.Group();
    forestGroup.position.copy(pos);

    const bambooMat = new THREE.MeshStandardMaterial({ color: 0x192812, roughness: 0.8 });
    for (let z = 0; z > -40; z -= 3) {
      [-5 - Math.random() * 2, 5 + Math.random() * 2].forEach(x => {
        const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 9 + Math.random() * 3, 6), bambooMat);
        stalk.position.set(x, 4.5, z);
        forestGroup.add(stalk);
      });
    }

    // CLUE 07: Mảnh vải người mất tích
    this.createClueItem({
      id: 'CLUE_07',
      name: 'Mảnh Vải Người Mất Tích',
      position: new THREE.Vector3(pos.x + 2.5, 0.6, pos.z - 4),
      parent: parent,
      interactablesList: interactablesList
    });

    parent.add(forestGroup);
  }

  // --- 8. MIẾU CŨ & BOSS ARENA ---
  createOldShrine(parent, pos, interactablesList = null) {
    const shrineGroup = new THREE.Group();
    shrineGroup.position.copy(pos);

    this.addColliderBox(10, 4.5, 0.5, pos.x, 2.25, pos.z - 9.5);
    this.addColliderBox(10, 4.5, 0.5, pos.x, 2.25, pos.z + 4.5);
    this.addColliderBox(0.5, 4.5, 8, pos.x - 5, 2.25, pos.z - 5);
    this.addColliderBox(0.5, 4.5, 8, pos.x + 5, 2.25, pos.z - 5);

    const shrineWall = new THREE.Mesh(new THREE.BoxGeometry(10, 4.5, 8), this.stoneMat);
    shrineWall.position.set(0, 2.25, -5);
    shrineGroup.add(shrineWall);

    const shrineRoof = new THREE.Mesh(new THREE.ConeGeometry(8.5, 2.6, 4), this.tileMat);
    shrineRoof.rotation.y = Math.PI / 4;
    shrineRoof.position.set(0, 5.8, -5);
    shrineGroup.add(shrineRoof);

    // Blood sigils / Talismans
    const talisMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 1.6),
      new THREE.MeshBasicMaterial({ map: this.talismanTex, transparent: true })
    );
    talisMesh.position.set(0, 2.5, -0.9);
    shrineGroup.add(talisMesh);

    // Central Altar
    const centerAltar = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.8, 1.8), this.stoneMat);
    centerAltar.position.set(0, 0.4, 2);
    shrineGroup.add(centerAltar);

    const candleLight = new THREE.PointLight(0xff2200, 2.0, 10, 1.5);
    candleLight.position.set(0, 1.5, 2);
    shrineGroup.add(candleLight);

    // 3 RITUAL PEDESTALS (BOSS PHASE 2)
    this.pedestals = [];
    const pedestalPositions = [
      { id: 'PEDESTAL_1', name: 'Bệ Thờ Bát Hương Cổ', x: -10, z: 8 },
      { id: 'PEDESTAL_2', name: 'Bệ Thờ Chuông Đồng', x: 10, z: 8 },
      { id: 'PEDESTAL_3', name: 'Bệ Thờ Bùa Trấn', x: 0, z: 18 }
    ];

    pedestalPositions.forEach(p => {
      const pedGroup = new THREE.Group();
      pedGroup.position.set(p.x, 0, p.z);

      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 1.6, 8), this.stoneMat);
      pillar.position.y = 0.8;
      pedGroup.add(pillar);

      const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.1, 8), new THREE.MeshStandardMaterial({ color: 0x331111 }));
      seal.position.y = 1.65;
      pedGroup.add(seal);

      const pedLight = new THREE.PointLight(0x00ff88, 0, 8, 2.0);
      pedLight.position.y = 2.0;
      pedGroup.add(pedLight);

      const hit = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.0, 1.5), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.y = 1.0;
      hit.userData = {
        type: 'pedestal',
        id: p.id,
        name: p.name,
        activated: false,
        light: pedLight,
        seal: seal.material
      };
      pedGroup.add(hit);

      if (interactablesList) interactablesList.push(hit);
      this.interactables.push(hit);
      shrineGroup.add(pedGroup);
      this.pedestals.push(hit.userData);
    });

    // SACRED BRAZIER (BOSS PHASE 3)
    const brazierGroup = new THREE.Group();
    brazierGroup.position.set(0, 0, 7);

    const brazier = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.4, 1.2, 8), this.woodMat);
    brazier.position.y = 0.6;
    brazierGroup.add(brazier);

    this.sacredFlameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const sacredFlame = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), this.sacredFlameMat);
    sacredFlame.position.y = 1.4;
    brazierGroup.add(sacredFlame);

    this.brazierLight = new THREE.PointLight(0xff6600, 0, 15, 1.8);
    this.brazierLight.position.y = 1.6;
    brazierGroup.add(this.brazierLight);

    const brazierHit = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.2, 1.8), new THREE.MeshBasicMaterial({ visible: false }));
    brazierHit.position.y = 1.0;
    brazierHit.userData = {
      type: 'sacred_flame',
      name: 'Ngọn Lửa Thiêng Trấn Quỷ',
      active: false
    };
    brazierGroup.add(brazierHit);
    if (interactablesList) interactablesList.push(brazierHit);
    this.interactables.push(brazierHit);

    shrineGroup.add(brazierGroup);
    parent.add(shrineGroup);
  }

  // --- LANTERN HELPER ---
  createLantern(parent, pos, color = 0xffaa22) {
    const lGroup = new THREE.Group();
    lGroup.position.copy(pos);

    const cage = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.24, 0.45, 6),
      new THREE.MeshStandardMaterial({ color: 0x110803, metalness: 0.7, roughness: 0.3 })
    );
    lGroup.add(cage);

    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), new THREE.MeshBasicMaterial({ color: color }));
    lGroup.add(flame);

    const pLight = new THREE.PointLight(color, 2.2, 12, 1.8);
    pLight.position.y = 0.05;
    lGroup.add(pLight);

    parent.add(lGroup);
    this.lights.push(pLight);
  }

  // --- CLUE ITEM HELPER ---
  createClueItem(options) {
    const itemGroup = new THREE.Group();
    itemGroup.position.copy(options.position);

    const itemMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.1, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.4, metalness: 0.2 })
    );
    itemGroup.add(itemMesh);

    const itemGlow = new THREE.PointLight(0xffcc44, 0.8, 3.5, 2.0);
    itemGlow.position.y = 0.2;
    itemGroup.add(itemGlow);

    const hitbox = new THREE.Mesh(
      new THREE.SphereGeometry(0.9, 8, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.userData = {
      type: 'clue',
      id: options.id,
      name: options.name,
      meshGroup: itemGroup
    };
    itemGroup.add(hitbox);

    if (options.parent) {
      options.parent.add(itemGroup);
    } else {
      this.scene.add(itemGroup);
    }

    if (options.interactablesList) {
      options.interactablesList.push(hitbox);
    }
    this.interactables.push(hitbox);
  }

  // --- NPC FACTORY ---
  createNPCInstance(npcId, position, isTrapped = false) {
    switch (npcId) {
      case 'ba_lan':
        return new NPC(this.scene, {
          id: 'ba_lan',
          name: 'Bà Lan',
          dialogueKey: 'ba_lan',
          position: position,
          robeColor: 0x4a3224,
          hasHat: true
        });
      case 'shopkeeper':
        return new NPC(this.scene, {
          id: 'shopkeeper',
          name: 'Cô Hảo',
          dialogueKey: 'shopkeeper',
          position,
          robeColor: 0x58634a,
          hasHat: false
        });
      case 'ong_tu':
        return new NPC(this.scene, {
          id: 'ong_tu',
          name: 'Ông Tư',
          dialogueKey: 'ong_tu',
          position: position,
          robeColor: 0x3d352b,
          hasHat: true
        });
      case 'minh':
        return new NPC(this.scene, {
          id: 'minh',
          name: 'Minh',
          dialogueKey: 'minh',
          position: position,
          robeColor: 0x223545,
          hasHat: false
        });
      case 'hanh':
        return new NPC(this.scene, {
          id: 'hanh',
          name: 'Hạnh',
          dialogueKey: 'hanh',
          position: position,
          robeColor: 0x5a2d32,
          hasHat: true
        });
      case 'thay_cung':
        return new NPC(this.scene, {
          id: 'thay_cung',
          name: 'Người Giữ Miếu',
          dialogueKey: 'thay_cung',
          position: position,
          robeColor: 0x661818,
          hasHat: true
        });
      case 'lan_chi':
        this.lanChiNPC = new NPC(this.scene, {
          id: 'lan_chi',
          name: 'Lan Chi (Em Gái)',
          dialogueKey: 'lan_chi',
          position: position,
          robeColor: 0x8a2b3b,
          hasHat: false,
          isTrapped: isTrapped
        });
        return this.lanChiNPC;
      default:
        return null;
    }
  }
}
