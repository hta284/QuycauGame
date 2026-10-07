import * as THREE from 'three';
import { audioManager } from '../audio/AudioManager.js';
import { SaveSystem } from './SaveSystem.js';

export const FOLKLORE_QUOTES = [
  "Đêm càng sâu, con đường càng im lặng.",
  "Đừng quay đầu lại. Có những thứ chỉ xuất hiện sau lưng bạn.",
  "Tiếng chó không phải lúc nào cũng đến từ phía trước.",
  "Có những thứ chỉ xuất hiện sau khi trời tối.",
  "Ai nghe tiếng thở dài dưới nước thì tuyệt đối không được nhìn xuống giếng.",
  "Một khi đã bước qua cổng miếu, không còn đường lui."
];

export class AreaManager {
  constructor(scene, camera, playerController, villageEnv, questSystem) {
    this.scene = scene;
    this.camera = camera;
    this.playerController = playerController;
    this.villageEnv = villageEnv;
    this.questSystem = questSystem;
    this.storyState = 'DAY_MORNING';

    this.currentAreaId = null;
    this.currentAreaGroup = null;
    this.areaCache = new Map();

    this.areaNPCs = [];
    this.areaInteractables = [];
    this.areaTransitionPoints = {
      AREA_GATE_HOME: { targetAreaId: 'AREA_WELL', spawn: new THREE.Vector3(0, 1.7, 10), position: new THREE.Vector3(0, 1.7, 4) },
      AREA_WELL: { targetAreaId: 'AREA_CEMETERY', spawn: new THREE.Vector3(18, 1.7, -35), position: new THREE.Vector3(16, 1.7, -18) },
      AREA_CEMETERY: { targetAreaId: 'AREA_FOREST', spawn: new THREE.Vector3(2, 1.7, -48), position: new THREE.Vector3(2, 1.7, -44) },
      AREA_FOREST: { targetAreaId: 'AREA_SHRINE_BOSS', spawn: new THREE.Vector3(0, 1.7, -86), position: new THREE.Vector3(0, 1.7, -78) }
    };

    // Cache Loading Screen DOM
    this.loadingScreenEl = document.getElementById('loading-screen');
    this.loadingAreaNameEl = document.getElementById('loading-area-name');
    this.loadingQuoteEl = document.getElementById('loading-quote');
    this.areaIndicatorText = document.getElementById('area-text');
    this.routeIndicatorText = document.getElementById('route-text');
    this.checkpointToast = document.getElementById('checkpoint-toast');

    // Transitions & Gateways
    this.gateways = [];
  }

  getAreaConfig(areaId) {
    switch (areaId) {
      case 'AREA_GATE_HOME':
        return {
          id: 'AREA_GATE_HOME',
          name: 'CỔNG LÀNG & NHÀ CŨ',
          quote: 'Đêm càng sâu, con đường càng im lặng.',
          playerSpawn: new THREE.Vector3(0, 1.7, 36),
          checkpointId: 'CHECKPOINT_HOME'
        };
      case 'AREA_WELL':
        return {
          id: 'AREA_WELL',
          name: 'GIẾNG LÀNG',
          quote: 'Ai nghe tiếng thở dài dưới giếng thì tuyệt đối không được nhìn xuống.',
          playerSpawn: new THREE.Vector3(0, 1.7, 10),
          checkpointId: 'CHECKPOINT_WELL'
        };
      case 'AREA_CEMETERY':
        return {
          id: 'AREA_CEMETERY',
          name: 'NGHĨA ĐỊA & ĐÌNH LÀNG',
          quote: 'Tiếng chó không phải lúc nào cũng đến từ phía trước...',
          playerSpawn: new THREE.Vector3(18, 1.7, -35),
          checkpointId: 'CHECKPOINT_CEMETERY'
        };
      case 'AREA_FOREST':
        return {
          id: 'AREA_FOREST',
          name: 'CỬA RỪNG NỨA',
          quote: 'Đừng quay đầu lại. Bóng đen luôn rình rập sau lưng.',
          playerSpawn: new THREE.Vector3(2, 1.7, -46),
          checkpointId: 'CHECKPOINT_FOREST'
        };
      case 'AREA_SHRINE_BOSS':
        return {
          id: 'AREA_SHRINE_BOSS',
          name: 'MIẾU CŨ HOANG PHẾ',
          quote: 'Nơi lời nguyền 30 năm trước đã bắt đầu...',
          playerSpawn: new THREE.Vector3(0, 1.7, -88),
          checkpointId: 'CHECKPOINT_SHRINE'
        };
      default:
        return this.getAreaConfig('AREA_GATE_HOME');
    }
  }

  canEnterArea(targetAreaId) {
    const phase = this.questSystem?.getCurrentQuest?.()?.id ?? 'Q01';

    if (targetAreaId === 'AREA_FOREST' && !['Q05', 'Q06', 'Q07', 'Q08', 'Q09'].includes(phase)) {
      this.showGateHint(targetAreaId, 'CỬA RỪNG BỊ KHÓA', 'Hãy gặp Người Giữ Miếu để mở lối đi.');
      return false;
    }

    if (targetAreaId === 'AREA_SHRINE_BOSS' && !['Q06', 'Q07', 'Q08', 'Q09'].includes(phase)) {
      this.showGateHint(targetAreaId, 'MIẾU CŨ CÒN PHONG ẤN', 'Cần thêm manh mối và bùa trấn yểm trước khi bước vào.');
      return false;
    }

    if (targetAreaId === 'AREA_SHRINE_BOSS' &&
        !['NIGHT', 'HORROR', 'CHASE', 'FINAL', 'ENDING'].includes(this.storyState)) {
      this.showGateHint(targetAreaId, 'TRỜI CHƯA TỐI', 'Hãy trở về nhà nghỉ ngơi; cửa miếu chỉ mở sau khi đêm xuống.');
      return false;
    }

    return true;
  }

  showGateHint(targetAreaId, title, message) {
    if (this.lastGateHintTarget === targetAreaId && Date.now() - this.lastGateHintAt < 4000) return;
    this.lastGateHintTarget = targetAreaId;
    this.lastGateHintAt = Date.now();
    this.questSystem?.showToast?.(title, message);
  }

  checkAreaTransitions() {
    if (!this.currentAreaId || this.isTransitioning) return;

    const point = this.areaTransitionPoints[this.currentAreaId];
    if (!point) return;

    const pos = this.camera.position;
    const dx = pos.x - point.position.x;
    const dz = pos.z - point.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < 2.5) {
      if (!this.canEnterArea(point.targetAreaId)) {
        return;
      }
      this.transitionTo(point.targetAreaId, point.spawn, true);
    }
  }

  async transitionTo(targetAreaId, targetSpawn = null, preservePosition = false) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    const config = this.getAreaConfig(targetAreaId);
    this.playerController.enabled = false;

    this.unloadCurrentArea();
    this.loadAreaObjects(config.id);

    if (!preservePosition) {
      const spawnPos = targetSpawn || config.playerSpawn;
      this.camera.position.copy(spawnPos);
      this.playerController.euler.set(0, 0, 0);
      this.playerController.syncCameraFromEuler();
    }

    this.currentAreaId = config.id;
    if (this.areaIndicatorText) this.areaIndicatorText.innerText = config.name;
    this.showCheckpointToast(config.checkpointId);
    SaveSystem.save({
      currentArea: config.id,
      currentCheckpoint: config.checkpointId,
      playerPosition: {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z
      }
    });

    audioManager.setAreaAmbience(config.id);
    this.playerController.enabled = true;
    this.isTransitioning = false;
  }

  unloadCurrentArea() {
    this.villageEnv.interactables = [];
    this.villageEnv.lights = [];
    this.villageEnv.colliders = [];
    this.playerController.setColliders([]);
    this.areaNPCs = [];
    this.areaInteractables = [];
    this.gateways = [];
  }

  loadAreaObjects(areaId) {
    const cachedArea = this.areaCache.get(areaId);
    if (cachedArea) {
      this.activateArea(cachedArea);
      return;
    }

    const v = this.villageEnv;
    v.colliders = [];
    v.interactables = [];
    v.lights = [];
    this.areaNPCs = [];
    this.areaInteractables = [];
    this.gateways = [];
    this.currentAreaGroup = new THREE.Group();
    this.currentAreaGroup.userData.areaId = areaId;
    this.scene.add(this.currentAreaGroup);

    switch (areaId) {
      case 'AREA_GATE_HOME':
        v.createTerrainSegment(this.currentAreaGroup, new THREE.Vector3(0, 0, 25), 80, 80);
        v.createVillageGate(this.currentAreaGroup, new THREE.Vector3(0, 0, 38));
        v.createPlayerHouse(this.currentAreaGroup, new THREE.Vector3(-18, 0, 20), this.areaInteractables);
        v.createNPC1House(this.currentAreaGroup, new THREE.Vector3(18, 0, 22));

        // NPC Bà Lan
        this.addNPC('ba_lan', new THREE.Vector3(16, 0, 24));

        // Gateway to Well
        this.createGateway(
          new THREE.Vector3(0, 0.5, 4),
          'AREA_WELL',
          'Đi về phía Giếng Làng',
          new THREE.Vector3(0, 1.7, 10),
          'ĐI: GIẾNG LÀNG',
          0
        );
        break;

      case 'AREA_WELL':
        v.createTerrainSegment(this.currentAreaGroup, new THREE.Vector3(0, 0, 0), 80, 80);
        v.createVillageWell(this.currentAreaGroup, new THREE.Vector3(0, 0, -4), this.areaInteractables);
        v.createMarketStand(this.currentAreaGroup, new THREE.Vector3(-22, 0, 7));
        this.addNPC('shopkeeper', new THREE.Vector3(-22, 0, 9));
        v.createPaddyFields(this.currentAreaGroup, new THREE.Vector3(-25, 0, 0));
        v.createPathSegment(
          this.currentAreaGroup,
          new THREE.Vector3(0, 0, 10),
          new THREE.Vector3(16, 0, -20),
          5
        );

        // Gateway back to Home
        this.createGateway(
          new THREE.Vector3(0, 0.5, 16),
          'AREA_GATE_HOME',
          'Quay lại Cổng & Nhà',
          new THREE.Vector3(0, 1.7, 8),
          'VỀ: CỔNG LÀNG',
          Math.PI
        );

        // Gateway to Cemetery
        this.createGateway(
          new THREE.Vector3(16, 0.5, -20),
          'AREA_CEMETERY',
          'Đi sang Nghĩa Địa & Đình Làng',
          new THREE.Vector3(18, 1.7, -35),
          'ĐI: NGHĨA ĐỊA',
          -0.5
        );
        break;

      case 'AREA_CEMETERY':
        v.createTerrainSegment(this.currentAreaGroup, new THREE.Vector3(20, 0, -50), 90, 90);
        v.createGraveyard(this.currentAreaGroup, new THREE.Vector3(25, 0, -55), this.areaInteractables);
        v.createCommunalHouse(this.currentAreaGroup, new THREE.Vector3(-15, 0, -45), this.areaInteractables);
        v.createNPC2House(this.currentAreaGroup, new THREE.Vector3(20, 0, -28));
        v.createPathSegment(
          this.currentAreaGroup,
          new THREE.Vector3(18, 0, -35),
          new THREE.Vector3(2, 0, -44),
          5
        );

        // NPCs: Ông Tư, Minh, Hạnh
        this.addNPC('ong_tu', new THREE.Vector3(18, 0, -25));
        this.addNPC('minh', new THREE.Vector3(-12, 0, -40));
        this.addNPC('hanh', new THREE.Vector3(-8, 0, -42));

        // Gateway back to Well
        this.createGateway(
          new THREE.Vector3(22, 0.5, -15),
          'AREA_WELL',
          'Quay lại Giếng Làng',
          new THREE.Vector3(14, 1.7, -18),
          'VỀ: GIẾNG LÀNG',
          Math.PI
        );

        // Gateway forward to Forest
        this.createGateway(
          new THREE.Vector3(2, 0.5, -44),
          'AREA_FOREST',
          'Tiến vào Cửa Rừng',
          new THREE.Vector3(2, 1.7, -48),
          'ĐI: CỬA RỪNG',
          1.1
        );
        break;

      case 'AREA_FOREST':
        v.createTerrainSegment(this.currentAreaGroup, new THREE.Vector3(0, 0, -65), 70, 70);
        v.createForestPath(this.currentAreaGroup, new THREE.Vector3(0, 0, -60), this.areaInteractables);
        v.createPathSegment(
          this.currentAreaGroup,
          new THREE.Vector3(2, 0, -48),
          new THREE.Vector3(0, 0, -78),
          5
        );

        // NPC Người Giữ Miếu
        this.addNPC('thay_cung', new THREE.Vector3(2, 0, -52));

        // Gateway back to Cemetery
        this.createGateway(
          new THREE.Vector3(2, 0.5, -42),
          'AREA_CEMETERY',
          'Quay lại Nghĩa Địa',
          new THREE.Vector3(4, 1.7, -46),
          'VỀ: NGHĨA ĐỊA',
          Math.PI
        );

        // Gateway into Shrine
        this.createGateway(
          new THREE.Vector3(0, 0.5, -78),
          'AREA_SHRINE_BOSS',
          'Bước vào Miếu Cũ',
          new THREE.Vector3(0, 1.7, -86),
          'ĐI: MIẾU CŨ',
          0
        );
        break;

      case 'AREA_SHRINE_BOSS':
        v.createTerrainSegment(this.currentAreaGroup, new THREE.Vector3(0, 0, -105), 80, 80);
        v.createOldShrine(this.currentAreaGroup, new THREE.Vector3(0, 0, -108), this.areaInteractables);

        // NPC Lan Chi trapped
        this.addNPC('lan_chi', new THREE.Vector3(0, 0, -106), true);

        // Gateway back to Forest (if allowed)
        this.createGateway(
          new THREE.Vector3(0, 0.5, -84),
          'AREA_FOREST',
          'Rời khỏi Miếu',
          new THREE.Vector3(0, 1.7, -76),
          'VỀ: CỬA RỪNG',
          Math.PI
        );
        break;
    }

    const nextStops = {
      AREA_GATE_HOME: 'LỐI ĐI: GIẾNG LÀNG',
      AREA_WELL: 'LỐI ĐI: NGHĨA ĐỊA',
      AREA_CEMETERY: 'LỐI ĐI: CỬA RỪNG',
      AREA_FOREST: 'LỐI ĐI: MIẾU CŨ',
      AREA_SHRINE_BOSS: 'ĐIỂM ĐẾN: MIẾU CŨ'
    };
    if (this.routeIndicatorText) {
      this.routeIndicatorText.innerText = nextStops[areaId] || 'LỐI ĐI: THEO ĐƯỜNG ĐẤT';
    }

    const area = {
      id: areaId,
      group: this.currentAreaGroup,
      npcs: this.areaNPCs,
      interactables: this.areaInteractables,
      gateways: this.gateways,
      colliders: [...this.villageEnv.colliders],
      lights: [...this.villageEnv.lights]
    };
    this.areaCache.set(areaId, area);
    this.activateArea(area);
  }

  activateArea(area) {
    this.currentAreaGroup = area.group;
    this.currentAreaId = area.id;
    this.areaNPCs = area.npcs;
    this.areaInteractables = area.interactables;
    this.gateways = area.gateways;
    this.villageEnv.colliders = area.colliders;
    this.villageEnv.interactables = area.interactables;
    this.villageEnv.lights = area.lights;
    this.playerController.setColliders(area.colliders);
  }

  preloadWorld() {
    const areaIds = [
      'AREA_GATE_HOME',
      'AREA_WELL',
      'AREA_CEMETERY',
      'AREA_FOREST',
      'AREA_SHRINE_BOSS'
    ];
    areaIds.forEach(areaId => this.loadAreaObjects(areaId));
    this.loadAreaObjects('AREA_GATE_HOME');
  }

  createGateway(position, targetAreaId, promptText, targetSpawn, signLabel, signFacingAngle = 0) {
    const gateGeo = new THREE.BoxGeometry(3.5, 2.5, 1.2);
    const gateMat = new THREE.MeshBasicMaterial({ visible: false });
    const gateMesh = new THREE.Mesh(gateGeo, gateMat);
    gateMesh.position.copy(position);

    // Glowing gate indicator
    const lantern = new THREE.PointLight(0xd4af37, 1.2, 5, 2.0);
    lantern.position.set(0, 1.5, 0);
    gateMesh.add(lantern);

    gateMesh.userData = {
      type: 'gateway',
      targetAreaId: targetAreaId,
      targetSpawn: targetSpawn,
      name: promptText
    };

    this.currentAreaGroup.add(gateMesh);
    this.areaInteractables.push(gateMesh);
    this.gateways.push(gateMesh);

    const signOffset = new THREE.Vector3(
      Math.sin(signFacingAngle) * 5 + Math.cos(signFacingAngle) * 4,
      0,
      Math.cos(signFacingAngle) * 5 - Math.sin(signFacingAngle) * 4
    );
    const signPosition = position.clone().add(signOffset);
    signPosition.y = 0;
    this.villageEnv.createWayfindingSign(
      this.currentAreaGroup,
      signPosition,
      signLabel || promptText.toLocaleUpperCase('vi'),
      signFacingAngle
    );
  }

  addNPC(npcId, position, isTrapped = false) {
    const npcObj = this.villageEnv.createNPCInstance(npcId, position, isTrapped);
    if (npcObj) {
      this.currentAreaGroup.add(npcObj.group);
      this.areaNPCs.push(npcObj);
      this.areaInteractables.push(npcObj.hitbox);
      if (npcId === 'lan_chi') this.villageEnv.lanChiNPC = npcObj;
    }
  }

  showCheckpointToast(checkpointId) {
    if (!this.checkpointToast) return;
    this.checkpointToast.classList.remove('hidden');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.checkpointToast.classList.add('hidden');
    }, 3200);
  }

  getAllInteractables() {
    return this.areaInteractables;
  }
}
