import * as THREE from 'three';
import { Player } from './entities/Player.js';
import { NPC } from './entities/NPC.js';
import { QuyCau } from './entities/QuyCau.js';
import { VillageEnvironment } from './entities/VillageEnvironment.js';
import { PlayerController } from './systems/PlayerController.js';
import { InteractionSystem } from './systems/InteractionSystem.js';
import { QuestSystem } from './systems/QuestSystem.js';
import { EvidenceSystem } from './systems/EvidenceSystem.js';
import { DialogueSystem } from './systems/DialogueSystem.js';
import { HorrorEventSystem } from './systems/HorrorEventSystem.js';
import { BossFightSystem } from './systems/BossFightSystem.js';
import { AreaManager } from './systems/AreaManager.js';
import { ChapterManager } from './systems/ChapterManager.js';
import { DeathSystem } from './systems/DeathSystem.js';
import { SaveSystem } from './systems/SaveSystem.js';
import { UIManager } from './ui/UIManager.js';
import { IntroSequence } from './ui/IntroSequence.js';
import { audioManager } from './audio/AudioManager.js';

export class Game {
  constructor() {
    this.isPaused = true;
    this.clock = new THREE.Clock();
    this.brightness = Number(localStorage.getItem('quycau-brightness') || '1');
    this.storyState = 'INTRO';

    // Scene & Engine
    this.canvas = document.getElementById('webgl-canvas');
    this.scene = new THREE.Scene();
    this.setupRenderer();
    this.setupCamera();
    this.setupAtmosphere();

    // World & Entities
    this.villageEnv = new VillageEnvironment(this.scene);
    this.player = new Player(this.camera, this.scene);
    this.quyCau = new QuyCau(this.scene);
    this.npcs = [];
    this.setupNPCs();

    // Core Systems
    this.playerController = new PlayerController(this.camera, this.canvas);
    this.questSystem = new QuestSystem();
    this.evidenceSystem = new EvidenceSystem();
    this.dialogueSystem = new DialogueSystem(this.questSystem);
    this.horrorEvents = new HorrorEventSystem(this.scene, this.quyCau);
    this.areaManager = new AreaManager(this.scene, this.camera, this.playerController, this.villageEnv, this.questSystem);
    this.chapterManager = new ChapterManager(this.areaManager, this.questSystem);
    this.deathSystem = new DeathSystem(this);
    this.bossFight = new BossFightSystem(this.scene, this.quyCau, this.villageEnv, this.questSystem, this.deathSystem);
    this.interactionSystem = new InteractionSystem(this.camera, this.scene);
    this.introSequence = new IntroSequence();
    this.quyCau.deathSystem = this.deathSystem;
    this.storyState = 'INTRO';

    // UI Orchestrator
    this.ui = new UIManager(this);

    // Wire up events
    this.setupInteractions();
    this.setupQuestHooks();
    this.setupWindowResize();

    // Start loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 300);
    this.camera.position.set(0, 1.7, 45); // Village gate
    this.scene.add(this.camera);
  }

  setupAtmosphere() {
    // Spooky Vietnamese Night Fog
    this.fogColor = new THREE.Color(0x0a0c10);
    this.scene.fog = new THREE.FogExp2(this.fogColor, 0.022);
    this.scene.background = this.fogColor;

    // Ambient Moonlight
    this.ambientLight = new THREE.AmbientLight(0x182030, 0.45);
    this.scene.add(this.ambientLight);

    // Distant Moon directional light
    this.moonLight = new THREE.DirectionalLight(0x405575, 0.85);
    this.moonLight.position.set(25, 45, 20);
    this.moonLight.castShadow = true;
    this.moonLight.shadow.mapSize.width = 1024;
    this.moonLight.shadow.mapSize.height = 1024;
    this.scene.add(this.moonLight);

    this.setBrightness(this.brightness);
  }

  setBrightness(value) {
    const normalized = Number.isFinite(value) ? Math.min(1.8, Math.max(0.4, value)) : 1;
    this.brightness = normalized;
    localStorage.setItem('quycau-brightness', String(normalized));

    this.renderer.toneMappingExposure = 0.8 * normalized;
    this.ambientLight.intensity = 0.45 * normalized;
    this.moonLight.intensity = 0.85 * normalized;

    const fogIntensity = 0.022 * normalized;
    if (this.scene.fog) {
      this.scene.fog.density = fogIntensity;
    }
  }

  setupNPCs() {
    // 1. Bà Lan (NPC 1 - Elder Woman)
    const baLan = new NPC(this.scene, {
      id: 'ba_lan',
      name: 'Bà Lan',
      dialogueKey: 'ba_lan',
      position: new THREE.Vector3(20, 0, 24),
      robeColor: 0x4a3224,
      hasHat: true
    });
    this.npcs.push(baLan);

    // 2. Ông Tư (NPC 2 - Village Elder)
    const ongTu = new NPC(this.scene, {
      id: 'ong_tu',
      name: 'Ông Tư',
      dialogueKey: 'ong_tu',
      position: new THREE.Vector3(24, 0, -17),
      robeColor: 0x3d352b,
      hasHat: true
    });
    this.npcs.push(ongTu);

    // 3. Minh (NPC 3 - Skeptical Youth)
    const minh = new NPC(this.scene, {
      id: 'minh',
      name: 'Minh',
      dialogueKey: 'minh',
      position: new THREE.Vector3(-18, 0, -22),
      robeColor: 0x223545,
      hasHat: false
    });
    this.npcs.push(minh);

    // 4. Hạnh (NPC 4 - Village Girl)
    const hanh = new NPC(this.scene, {
      id: 'hanh',
      name: 'Hạnh',
      dialogueKey: 'hanh',
      position: new THREE.Vector3(-14, 0, -25),
      robeColor: 0x5a2d32,
      hasHat: true
    });
    this.npcs.push(hanh);

    // 5. Người Giữ Miếu (NPC 5 - Shrine Keeper)
    const thayCung = new NPC(this.scene, {
      id: 'thay_cung',
      name: 'Người Giữ Miếu',
      dialogueKey: 'thay_cung',
      position: new THREE.Vector3(2, 0, -48),
      robeColor: 0x661818,
      hasHat: true
    });
    this.npcs.push(thayCung);

    // 6. Lan Chi (Trapped relative at Miếu Cũ Altar)
    this.lanChi = new NPC(this.scene, {
      id: 'lan_chi',
      name: 'Lan Chi (Em Gái)',
      dialogueKey: 'lan_chi',
      position: new THREE.Vector3(0, 0, -108),
      robeColor: 0x8a2b3b,
      hasHat: false,
      isTrapped: true
    });
    this.villageEnv.lanChiNPC = this.lanChi;
    this.npcs.push(this.lanChi);
  }

  setupInteractions() {
    this.interactionSystem.onInteract((target) => {
      // 1. NPC Interaction
      if (target.type === 'npc') {
        // If Lan Chi is freed after boss fight, trigger ending!
        if (target.npc.id === 'lan_chi' && this.bossFight.isDefeated) {
          this.questSystem.completeQuest('Q09');
          this.triggerEnding();
          return;
        }

        this.dialogueSystem.startDialogue(target.npc.dialogueKey);
      }

      // 2. Clearly marked area gateways
      else if (target.type === 'gateway') {
        if (this.areaManager.canEnterArea(target.targetAreaId)) {
          this.areaManager.transitionTo(target.targetAreaId, target.targetSpawn);
        }
      }

      // 2. Clue Collection
      else if (target.type === 'clue') {
        this.evidenceSystem.collectClue(target.id);

        // Advance specific quests on finding key clues
        if (target.id === 'CLUE_02') {
          this.questSystem.completeQuest('Q01');
        } else if (target.id === 'CLUE_01' || target.id === 'CLUE_03') {
          this.questSystem.completeQuest('Q03');
        } else if (target.id === 'CLUE_05') {
          this.questSystem.completeQuest('Q04');
        } else if (target.id === 'CLUE_07') {
          this.questSystem.completeQuest('Q06');
        }

        this.autoSave();
      }

      // 3. Ritual Pedestal (Boss Phase 2)
      else if (target.type === 'pedestal') {
        this.bossFight.activatePedestal(target);
      }

      // 4. Sacred Flame (Boss Phase 3)
      else if (target.type === 'sacred_flame') {
        this.bossFight.takeSacredFlame();
      }
    });

    // Also listen for clicking or pressing E when carrying sacred flame near Quỷ Cẩu in Boss Phase 3
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyE' && this.bossFight.phase === 3 && this.bossFight.hasSacredTorch) {
        const dist = this.quyCau.group.position.distanceTo(this.camera.position);
        if (dist < 8.0) {
          this.bossFight.attackWithHolyFlame();
        }
      }
    });
  }

  setupQuestHooks() {
    this.questSystem.onQuestAdvanced((currentQ) => {
      this.autoSave();

      // Atmospheric changes based on quest progression
      if (currentQ.id === 'Q01') {
        this.storyState = 'DAY';
        this.scene.fog.color.setHex(0x0d1117);
        this.moonLight.color.setHex(0x7382a4);
        document.getElementById('time-text').innerText = 'BAN NGÀY';
      } else if (currentQ.id === 'Q03') {
        this.storyState = 'EVENING';
        this.scene.fog.color.setHex(0x090d14);
        this.moonLight.color.setHex(0x4f5e79);
        document.getElementById('time-text').innerText = 'CHIỀU TỐI';
      } else if (currentQ.id === 'Q06') {
        this.storyState = 'NIGHT';
        this.scene.fog.color.setHex(0x18080c);
        this.moonLight.color.setHex(0x661818);
        document.getElementById('time-text').innerText = 'ĐÊM SÂU';
        audioManager.playDogBark(false);
      } else if (currentQ.id === 'Q07' || currentQ.id === 'Q08') {
        this.storyState = 'HORROR';
        if (!this.bossFight.isActive && !this.bossFight.isDefeated) {
          this.bossFight.startBossFight();
        }
      } else if (currentQ.id === 'Q09') {
        this.storyState = 'ENDING';
        this.scene.fog.color.setHex(0x302518);
        this.moonLight.color.setHex(0xbfa573);
        this.ambientLight.intensity = 1.0;
        document.getElementById('time-text').innerText = 'BÌNH MINH';
      }
    });
  }

  teleportPlayer(x, y, z) {
    this.camera.position.set(x, y, z);
    this.playerController.euler.set(0, 0, 0);
    this.playerController.syncCameraFromEuler();
  }

  startNewGame() {
    this.isPaused = true;
    this.documentUnlock();
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');

    this.teleportPlayer(0, 1.7, 45);
    this.areaManager.currentAreaId = 'AREA_GATE_HOME';
    this.areaManager.loadAreaObjects('AREA_GATE_HOME');

    this.introSequence.play(() => {
      this.isPaused = false;
      this.chapterManager.startChapter(1);
      this.playerController.lockPointer();
    });
  }

  loadSavedGame() {
    const data = SaveSystem.load();
    if (!data) {
      this.startNewGame();
      return;
    }

    const areaIds = ['AREA_GATE_HOME', 'AREA_WELL', 'AREA_CEMETERY', 'AREA_FOREST', 'AREA_SHRINE_BOSS'];
    const questAreaFallback = ['AREA_GATE_HOME', 'AREA_GATE_HOME', 'AREA_WELL', 'AREA_CEMETERY', 'AREA_CEMETERY', 'AREA_FOREST', 'AREA_SHRINE_BOSS', 'AREA_SHRINE_BOSS', 'AREA_SHRINE_BOSS'];
    const savedAreaId = areaIds.includes(data.currentArea)
      ? data.currentArea
      : questAreaFallback[data.questIndex] || 'AREA_GATE_HOME';
    const areaBounds = {
      AREA_GATE_HOME: { minX: -40, maxX: 40, minZ: -15, maxZ: 65 },
      AREA_WELL: { minX: -40, maxX: 40, minZ: -40, maxZ: 40 },
      AREA_CEMETERY: { minX: -25, maxX: 65, minZ: -95, maxZ: -5 },
      AREA_FOREST: { minX: -35, maxX: 35, minZ: -100, maxZ: -30 },
      AREA_SHRINE_BOSS: { minX: -40, maxX: 40, minZ: -145, maxZ: -65 }
    };
    const bounds = areaBounds[savedAreaId];
    const savedPosition = data.playerPosition;
    const hasValidSavedPosition = Boolean(
      data.currentArea &&
      savedPosition &&
      savedPosition.x >= bounds.minX && savedPosition.x <= bounds.maxX &&
      savedPosition.z >= bounds.minZ && savedPosition.z <= bounds.maxZ
    );
    const areaConfig = this.areaManager.getAreaConfig(savedAreaId);
    this.areaManager.currentAreaId = savedAreaId;
    this.areaManager.loadAreaObjects(savedAreaId);
    if (this.areaManager.areaIndicatorText) {
      this.areaManager.areaIndicatorText.innerText = areaConfig.name;
    }
    audioManager.setAreaAmbience(savedAreaId);

    this.isPaused = false;
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');

    if (hasValidSavedPosition) {
      this.teleportPlayer(savedPosition.x, savedPosition.y, savedPosition.z);
    } else {
      this.teleportPlayer(
        areaConfig.playerSpawn.x,
        areaConfig.playerSpawn.y,
        areaConfig.playerSpawn.z
      );
    }

    if (data.clueIds && Array.isArray(data.clueIds)) {
      data.clueIds.forEach(id => {
        const c = this.evidenceSystem.clues.find(clue => clue.id === id);
        if (c) c.collected = true;
      });
      this.evidenceSystem.updateHUD();
    }
    if (data.questIndex !== undefined) {
      this.questSystem.setQuestByIndex(data.questIndex);
    }
    this.playerController.lockPointer();
  }

  autoSave() {
    const data = {
      questIndex: this.questSystem.currentIndex,
      currentArea: this.areaManager.currentAreaId,
      clueIds: this.evidenceSystem.clues.filter(c => c.collected).map(c => c.id),
      playerPosition: {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z
      },
      bossDefeated: this.bossFight.isDefeated
    };
    SaveSystem.save(data);
  }

  triggerEnding() {
    this.isPaused = true;
    this.ui.showEndingScreen();
  }

  documentUnlock() {
    if (document.exitPointerLock) document.exitPointerLock();
  }

  setupWindowResize() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (!this.isPaused) {
      // 1. Player movement
      const moveState = this.playerController.update(delta, this.player);

      // 2. Interactables check
      this.interactionSystem.update(this.areaManager.getAllInteractables());

      // 3. NPC face player
      this.npcs.forEach(n => n.update(this.camera.position));

      // 4. Quỷ Cẩu AI
      this.quyCau.update(delta, this.camera.position, moveState ? moveState.isRunning : false);

      // 5. Boss Fight loop
      this.bossFight.update(delta, this.camera.position);

      // 6. Horror Events spatial triggers
      this.horrorEvents.update(this.camera.position);

      // 7. Check distance to Quỷ Cẩu for screen tension vignette
      const distToMonster = this.quyCau.group.visible ? this.quyCau.group.position.distanceTo(this.camera.position) : 999;
      const isDanger = distToMonster < 20.0 || this.quyCau.state === 'CHASE';
      this.player.dangerLevel = Math.max(0, 1 - distToMonster / 25.0);

      // 8. Area transition checks
      this.areaManager.checkAreaTransitions();

      // 9. Update HUD
      if (moveState) {
        this.ui.updateHUD(moveState.staminaRatio, isDanger);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Safely instantiate game instance on DOM ready or immediately if already parsed
function initGame() {
  if (!window.gameInstance) {
    window.gameInstance = new Game();
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
