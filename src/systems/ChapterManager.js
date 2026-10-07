import { audioManager } from '../audio/AudioManager.js';

export const CHAPTERS = [
  {
    index: 1,
    numStr: "CHƯƠNG 01",
    title: "TRỞ VỀ",
    areaId: "AREA_GATE_HOME",
    questId: "Q01",
    checkpointId: "CHECKPOINT_HOME"
  },
  {
    index: 2,
    numStr: "CHƯƠNG 02",
    title: "DẤU CHÂN",
    areaId: "AREA_WELL",
    questId: "Q03",
    checkpointId: "CHECKPOINT_WELL"
  },
  {
    index: 3,
    numStr: "CHƯƠNG 03",
    title: "BÍ MẬT CỦA NGÔI LÀNG",
    areaId: "AREA_CEMETERY",
    questId: "Q04",
    checkpointId: "CHECKPOINT_CEMETERY"
  },
  {
    index: 4,
    numStr: "CHƯƠNG 04",
    title: "MIẾU CŨ",
    areaId: "AREA_FOREST",
    questId: "Q06",
    checkpointId: "CHECKPOINT_FOREST"
  },
  {
    index: 5,
    numStr: "CHƯƠNG 05",
    title: "ĐÊM CUỐI",
    areaId: "AREA_SHRINE_BOSS",
    questId: "Q08",
    checkpointId: "CHECKPOINT_SHRINE"
  }
];

export class ChapterManager {
  constructor(areaManager, questSystem) {
    this.areaManager = areaManager;
    this.questSystem = questSystem;
    this.currentChapterIndex = 1;

    // Cache DOM
    this.announcementEl = document.getElementById('chapter-announcement');
    this.annNumEl = document.getElementById('ann-chapter-num');
    this.annTitleEl = document.getElementById('ann-chapter-title');
    this.hudChapterTag = document.getElementById('quest-chapter-tag');
  }

  getCurrentChapter() {
    return CHAPTERS.find(c => c.index === this.currentChapterIndex) || CHAPTERS[0];
  }

  async startChapter(chapterIndex) {
    const ch = CHAPTERS.find(c => c.index === chapterIndex);
    if (!ch) return;

    this.currentChapterIndex = ch.index;

    // 1. Show Chapter Title Card
    if (this.annNumEl) this.annNumEl.innerText = ch.numStr;
    if (this.annTitleEl) this.annTitleEl.innerText = ch.title;
    if (this.hudChapterTag) this.hudChapterTag.innerText = `${ch.numStr}: ${ch.title}`;

    if (this.announcementEl) {
      this.announcementEl.classList.remove('hidden');
      this.announcementEl.style.opacity = '1';
      audioManager.playTempleChime();

      // Hold announcement
      await new Promise(r => setTimeout(r, 2600));

      this.announcementEl.style.opacity = '0';
      setTimeout(() => {
        this.announcementEl.classList.add('hidden');
      }, 1000);
    }

    // 2. Transition to corresponding area
    await this.areaManager.transitionTo(ch.areaId);

    // 3. Set matching quest
    this.questSystem.completeQuest(ch.questId);
  }

  advanceToNextChapter() {
    if (this.currentChapterIndex < CHAPTERS.length) {
      this.startChapter(this.currentChapterIndex + 1);
    }
  }
}
