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
    this.storyState = 'DAY_MORNING';
    this.dayVisits = new Set();
    this.afterNightmarePending = false;
    this.midnightSequenceSeen = false;
    this.midnightHuntStarted = false;

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
    this.quyCau.group.visible = false;
    this.npcs = [];
    this.setupNPCs();

    // Core Systems
    this.playerController = new PlayerController(this.camera, this.canvas);
    this.questSystem = new QuestSystem();
    this.evidenceSystem = new EvidenceSystem();
    this.dialogueSystem = new DialogueSystem(this.questSystem);
    this.horrorEvents = new HorrorEventSystem(this.scene, this.quyCau);
    this.areaManager = new AreaManager(this.scene, this.camera, this.playerController, this.villageEnv, this.questSystem);
    this.areaManager.preloadWorld();
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
      antialias: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(1);
    this.resizeRenderer();
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  resizeRenderer() {
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 300);
    this.camera.position.set(0, 1.7, 45); // Village gate
    this.scene.add(this.camera);
  }

  setupAtmosphere() {
    this.fogColor = new THREE.Color(0xb7c4a0);
    this.scene.fog = new THREE.FogExp2(this.fogColor, 0.004);
    this.scene.background = this.fogColor;

    this.ambientLight = new THREE.AmbientLight(0xd2d9b2, 0.72);
    this.scene.add(this.ambientLight);

    this.moonLight = new THREE.DirectionalLight(0xffe3ae, 1.15);
    this.moonLight.position.set(25, 45, 20);
    this.moonLight.castShadow = true;
    this.moonLight.shadow.mapSize.width = 1024;
    this.moonLight.shadow.mapSize.height = 1024;
    this.scene.add(this.moonLight);

    this.atmosphereProfile = {
      ambient: 0.72,
      directional: 1.15,
      fog: 0.004,
      exposure: 1.05
    };
    this.setBrightness(this.brightness);
    this.storyState = 'DAY_MORNING';
    const timeText = document.getElementById('time-text');
    if (timeText) timeText.innerText = 'BUỔI SÁNG';
  }

  setBrightness(value) {
    const normalized = Number.isFinite(value) ? Math.min(1.8, Math.max(0.4, value)) : 1;
    this.brightness = normalized;
    localStorage.setItem('quycau-brightness', String(normalized));

    this.renderer.toneMappingExposure = this.atmosphereProfile.exposure * normalized;
    this.ambientLight.intensity = this.atmosphereProfile.ambient * normalized;
    this.moonLight.intensity = this.atmosphereProfile.directional * normalized;
    if (this.scene.fog) {
      this.scene.fog.density = this.atmosphereProfile.fog;
    }
  }

  setTimeOfDay({ background, light, ambient, directional, fog, exposure }) {
    this.fogColor.setHex(background);
    this.scene.background = this.fogColor;
    this.moonLight.color.setHex(light);
    this.atmosphereProfile = { ambient, directional, fog, exposure };
    this.setBrightness(this.brightness);
  }

  setWorldState(state) {
    const profiles = {
      DAY_MORNING: { background: 0xb7c4a0, light: 0xffe3ae, ambient: 0.72, directional: 1.15, fog: 0.004, exposure: 1.05, label: 'BUỔI SÁNG' },
      DAY_NOON: { background: 0xc4c89f, light: 0xffedc4, ambient: 0.82, directional: 1.3, fog: 0.003, exposure: 1.08, label: 'BAN NGÀY' },
      DAY_AFTERNOON: { background: 0xa8ad88, light: 0xf2c58e, ambient: 0.68, directional: 1.0, fog: 0.005, exposure: 1, label: 'BUỔI CHIỀU' },
      EVENING: { background: 0x695449, light: 0xd68a54, ambient: 0.55, directional: 0.72, fog: 0.011, exposure: 0.95, label: 'HOÀNG HÔN' },
      NIGHT: { background: 0x101923, light: 0x536b8b, ambient: 0.38, directional: 0.65, fog: 0.022, exposure: 0.88, label: 'ĐÊM SÂU' },
      MIDNIGHT: { background: 0x101923, light: 0x536b8b, ambient: 0.32, directional: 0.52, fog: 0.024, exposure: 0.82, label: '02:13 AM' },
      HORROR: { background: 0x141018, light: 0x76616b, ambient: 0.3, directional: 0.48, fog: 0.026, exposure: 0.82, label: 'ĐÊM SÂU' },
      CHASE: { background: 0x100d12, light: 0x66525d, ambient: 0.26, directional: 0.42, fog: 0.028, exposure: 0.8, label: 'ĐANG BỊ SĂN ĐUỔI' },
      DAY_AFTER_NIGHTMARE: { background: 0xb89b68, light: 0xffd294, ambient: 0.78, directional: 0.95, fog: 0.006, exposure: 1.02, label: 'BÌNH MINH' },
      FINAL: { background: 0x141018, light: 0x76616b, ambient: 0.28, directional: 0.45, fog: 0.026, exposure: 0.82, label: 'ĐÊM CUỐI' },
      ENDING: { background: 0xb89b68, light: 0xffd294, ambient: 0.78, directional: 0.95, fog: 0.006, exposure: 1.02, label: 'BÌNH MINH' }
    };
    const profile = profiles[state];
    if (!profile) throw new Error(`World state không hợp lệ: ${state}`);
    this.storyState = state;
    if (this.areaManager) this.areaManager.storyState = state;
    this.setTimeOfDay(profile);
    const timeText = document.getElementById('time-text');
    if (timeText) timeText.innerText = profile.label;
    if (['DAY_MORNING', 'DAY_NOON', 'DAY_AFTERNOON', 'EVENING', 'NIGHT', 'MIDNIGHT', 'DAY_AFTER_NIGHTMARE'].includes(state)) {
      this.quyCau.group.visible = false;
    }
    if (state === 'DAY_AFTER_NIGHTMARE') this.playerController.enabled = true;
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

        if (target.npc.id === 'ba_lan' && this.afterNightmarePending) {
          this.afterNightmarePending = false;
          this.setWorldState('HORROR');
          this.setQuestObjective('Lần theo Mảnh Vải (CLUE 07) ở cửa rừng để tìm Lan Chi.');
          this.dialogueSystem.startDialogue('ba_lan', 'after_nightmare');
          this.autoSave();
          return;
        }
        if (target.npc.id === 'ba_lan' && this.questSystem.getCurrentQuest()?.id === 'Q02') {
          this.dayVisits.add('ba_lan');
        }
        if (target.npc.id === 'ong_tu' || target.npc.id === 'shopkeeper') {
          this.dayVisits.add(target.npc.id);
          if (this.questSystem.getCurrentQuest()?.id === 'Q03' &&
              this.dayVisits.has('ong_tu') && this.dayVisits.has('shopkeeper')) {
            this.questSystem.completeQuest('Q03');
          }
        }
        this.dialogueSystem.startDialogue(target.npc.dialogueKey);
      }

      // 2. Clearly marked area gateways
      else if (target.type === 'gateway') {
        if (this.areaManager.canEnterArea(target.targetAreaId)) {
          this.areaManager.transitionTo(target.targetAreaId, target.targetSpawn, true);
        }
      }

      else if (target.type === 'bed') {
        this.startMidnightSequence();
      }

      // 2. Clue Collection
      else if (target.type === 'clue') {
        if (target.id === 'CLUE_07' && !this.midnightSequenceSeen) {
          this.questSystem.showToast('CHƯA THỂ THEO DẤU VẾT', 'Hãy trở về nhà nghỉ ngơi; có thể tiếp tục điều tra sau khi trời tối.');
          return;
        }
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
    this.questSystem.onQuestAdvanced((currentQ, completedQ) => {
      const completedId = completedQ?.id;
      if (completedId === 'Q01') {
        this.setWorldState('DAY_NOON');
      } else if (completedId === 'Q02' || completedId === 'Q03' || completedId === 'Q04') {
        this.setWorldState('DAY_AFTERNOON');
      } else if (completedId === 'Q05') {
        this.setWorldState('EVENING');
      } else if (completedId === 'Q06') {
        this.setWorldState('NIGHT');
        audioManager.playDogBark(false);
      } else if (currentQ.id === 'Q07' || currentQ.id === 'Q08') {
        this.setWorldState('HORROR');
      } else if (currentQ.id === 'Q09') {
        this.setWorldState('ENDING');
      }
      if (currentQ.id === 'Q03' && this.dayVisits.has('ong_tu') && this.dayVisits.has('shopkeeper')) {
        queueMicrotask(() => this.questSystem.completeQuest('Q03'));
      }
      this.updateChapterTag(currentQ);
      this.autoSave();
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
    this.setWorldState('DAY_MORNING');

    this.introSequence.play(() => {
      this.isPaused = false;
      this.setWorldState('DAY_MORNING');
      this.chapterManager.startChapter(1);
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
    const savedStoryState = data.storyState || 'DAY_MORNING';
    const migratedStoryState = savedStoryState === 'INTRO' || savedStoryState === 'DAY'
      ? 'DAY_MORNING'
      : savedStoryState === 'MIDNIGHT'
        ? 'HORROR'
        : savedStoryState;
    try {
      this.setWorldState(migratedStoryState);
    } catch (error) {
      console.warn('Save contains an unknown story phase; resuming in the morning.', error);
      this.setWorldState('DAY_MORNING');
    }
    this.dayVisits = new Set(Array.isArray(data.dayVisits) ? data.dayVisits : []);
    this.afterNightmarePending = Boolean(data.afterNightmarePending);
    this.midnightSequenceSeen = Boolean(data.midnightSequenceSeen) ||
      (!data.storyState && Number(data.questIndex) >= 5);
    this.midnightHuntStarted = Boolean(data.midnightHuntStarted);
    this.updateChapterTag(this.questSystem.getCurrentQuest());
    if (this.questSystem.getCurrentQuest()?.id === 'Q06') {
      if (this.afterNightmarePending) {
        this.setQuestObjective('Kiểm tra dấu chân ngoài cửa, rồi hỏi Bà Lan về giấc mơ.');
      } else if (this.midnightSequenceSeen) {
        this.setQuestObjective('Lần theo Mảnh Vải (CLUE 07) ở cửa rừng để tìm Lan Chi.');
      }
    }
    if (this.midnightHuntStarted) {
      this.quyCau.group.position.set(this.camera.position.x + 13, 0, this.camera.position.z - 16);
      this.quyCau.group.visible = true;
      this.quyCau.state = 'CHASE';
      audioManager.startChaseMusic();
    }
    this.bossFight.isDefeated = Boolean(data.bossDefeated);
    if (this.bossFight.isDefeated) {
      this.bossFight.isActive = false;
      this.quyCau.group.visible = false;
      this.areaManager.areaCache.get('AREA_SHRINE_BOSS')?.npcs
        .find(npc => npc.id === 'lan_chi')?.freeFromTraps();
    }
    this.playerController.lockPointer();
  }

  autoSave() {
    const data = {
      questIndex: this.questSystem.currentIndex,
      storyState: this.storyState,
      dayVisits: [...this.dayVisits],
      afterNightmarePending: this.afterNightmarePending,
      midnightSequenceSeen: this.midnightSequenceSeen,
      midnightHuntStarted: this.midnightHuntStarted,
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

  setQuestObjective(objective) {
    const quest = this.questSystem.getCurrentQuest();
    if (!quest) return;
    quest.objective = objective;
    this.questSystem.updateHUD();
  }

  updateChapterTag(quest) {
    if (!quest) return;
    const chapters = {
      Q01: 'CHƯƠNG 01: TRỞ VỀ',
      Q02: 'CHƯƠNG 01: TRỞ VỀ',
      Q03: 'CHƯƠNG 02: LỜI ĐỒN',
      Q04: 'CHƯƠNG 03: DẤU VẾT',
      Q05: 'CHƯƠNG 04: CỬA RỪNG',
      Q06: 'CHƯƠNG 04: CỬA RỪNG',
      Q07: 'CHƯƠNG 05: MIẾU CŨ',
      Q08: 'CHƯƠNG 05: MIẾU CŨ',
      Q09: 'CHƯƠNG 06: BÌNH MINH'
    };
    const tag = document.getElementById('quest-chapter-tag');
    if (tag) tag.innerText = chapters[quest.id] || 'CHƯƠNG 01: TRỞ VỀ';
  }

  updateRouteIndicator() {
    const questId = this.questSystem.getCurrentQuest()?.id;
    let route;
    if (questId === 'Q01') route = 'LỐI ĐI: NHÀ CŨ (BÊN TRÁI CỔNG)';
    else if (questId === 'Q02') route = 'LỐI ĐI: NHÀ BÀ LAN (BÊN PHẢI)';
    else if (questId === 'Q03') {
      route = !this.dayVisits.has('shopkeeper')
        ? 'LỐI ĐI: CHỢ CẠNH GIẾNG LÀNG'
        : 'LỐI ĐI: ĐÌNH LÀNG & ÔNG TƯ';
    } else if (questId === 'Q04') route = 'LỐI ĐI: NGHĨA ĐỊA SAU ĐÌNH';
    else if (questId === 'Q05') route = 'LỐI ĐI: CỬA RỪNG THEO ĐƯỜNG ĐẤT';
    else if (questId === 'Q06' && this.afterNightmarePending) route = 'LỐI ĐI: HỎI BÀ LAN';
    else if (questId === 'Q06' && !this.midnightSequenceSeen) route = 'VỀ NHÀ NGHỈ NGƠI';
    else if (questId === 'Q06') route = 'LỐI ĐI: CỬA RỪNG (THEO DẤU CHÂN)';
    else if (questId === 'Q09') route = 'LỐI ĐI: CỔNG LÀNG';
    else route = 'LỐI ĐI: MIẾU CŨ';

    const routeText = this.areaManager.routeIndicatorText;
    if (routeText && routeText.innerText !== route) routeText.innerText = route;
  }

  triggerEnding() {
    this.isPaused = true;
    this.ui.showEndingScreen();
  }

  startMidnightSequence() {
    if (this.storyState !== 'EVENING') {
      this.questSystem.showToast('CHƯA THỂ NGHỈ NGƠI', 'Hãy hoàn thành việc trong ngày và trở về nhà khi trời tối.');
      return;
    }
    if (this.midnightSequenceSeen) {
      this.questSystem.showToast('ĐÊM ĐÃ XUỐNG', 'Hãy kiểm tra con đường dẫn về phía giếng làng.');
      return;
    }

    this.midnightSequenceSeen = true;
    this.isPaused = true;
    this.playerController.enabled = false;
    this.setWorldState('MIDNIGHT');
    this.setQuestObjective('Tỉnh dậy lúc 02:13 và ra ngoài kiểm tra tiếng động.');
    const overlay = document.createElement('div');
    overlay.className = 'night-cutscene';
    overlay.innerHTML = '<div><strong>02:13 AM</strong><span>Tiếng móng chân dừng lại bên ngoài cửa.</span></div>';
    document.body.appendChild(overlay);
    this.autoSave();

    setTimeout(() => {
      overlay.remove();
      this.playerController.enabled = true;
      this.isPaused = false;
      this.setWorldState('HORROR');
      audioManager.playHeavyBreathing();
      this.horrorEvents.triggerMidnightShadow(this.camera.position);
      this.questSystem.showToast('CÓ TIẾNG ĐỘNG NGOÀI SÂN', 'Nhìn về phía cửa rồi lần theo con đường làng.');
    }, 2400);
  }

  startNightHunt() {
    if (this.midnightHuntStarted || !this.midnightSequenceSeen ||
        this.questSystem.getCurrentQuest()?.id !== 'Q06' ||
        this.areaManager.currentAreaId === 'AREA_SHRINE_BOSS') return;
    this.midnightHuntStarted = true;
    this.setWorldState('CHASE');
    this.setQuestObjective('Rời khỏi sân nhà và lần theo dấu vết của Lan Chi trong đêm.');
    this.quyCau.group.position.set(this.camera.position.x + 13, 0, this.camera.position.z - 16);
    this.quyCau.group.visible = true;
    this.quyCau.state = 'CHASE';
    audioManager.startChaseMusic();
    this.horrorEvents.showThreat('TIẾNG CHÂN ĐANG ĐUỔI SÁT SAU LƯNG!', 5000);
    this.autoSave();
  }

  ensureFootprintClue() {
    const home = this.areaManager.areaCache.get('AREA_GATE_HOME');
    if (!home || home.interactables.some(item => item.userData.id === 'CLUE_09')) return;
    const wasHomeActive = this.areaManager.currentAreaId === 'AREA_GATE_HOME';
    this.villageEnv.createClueItem({
      id: 'CLUE_09',
      name: 'Dấu Chân Ướt Ngoài Cửa',
      position: new THREE.Vector3(-18, 0.08, 25.5),
      parent: home.group,
      interactablesList: home.interactables
    });
    if (!wasHomeActive) {
      const footprint = home.interactables[home.interactables.length - 1];
      this.villageEnv.interactables = this.villageEnv.interactables.filter(item => item !== footprint);
    }
  }

  documentUnlock() {
    if (document.exitPointerLock) document.exitPointerLock();
  }

  setupWindowResize() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.resizeRenderer();
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
      this.areaManager.areaNPCs.forEach(n => n.update(this.camera.position, this.storyState, delta));

      // 4. Quỷ Cẩu AI
      this.quyCau.update(delta, this.camera.position, moveState ? moveState.isRunning : false);

      // 5. Boss Fight loop
      this.bossFight.update(delta, this.camera.position);

      // 6. Horror Events spatial triggers
      if (this.areaManager.currentAreaId !== 'AREA_SHRINE_BOSS') {
        this.horrorEvents.update(this.camera.position, this.storyState);
      }
      if (this.storyState === 'HORROR' && this.midnightSequenceSeen && this.camera.position.z < 12) {
        this.startNightHunt();
      }

      // 7. Check distance to Quỷ Cẩu for screen tension vignette
      const distToMonster = this.quyCau.group.visible ? this.quyCau.group.position.distanceTo(this.camera.position) : 999;
      const isDanger = distToMonster < 20.0 || this.quyCau.state === 'CHASE';
      this.player.dangerLevel = Math.max(0, 1 - distToMonster / 25.0);

      // 8. Area transition checks
      this.areaManager.checkAreaTransitions();
      const currentQuestId = this.questSystem.getCurrentQuest()?.id;
      if (this.areaManager.currentAreaId === 'AREA_SHRINE_BOSS' &&
          (currentQuestId === 'Q07' || currentQuestId === 'Q08') &&
          !this.bossFight.isActive && !this.bossFight.isDefeated) {
        this.bossFight.startBossFight(currentQuestId === 'Q07');
      }
      this.updateRouteIndicator();

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
