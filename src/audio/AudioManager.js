// Procedural Web Audio Engine for Vietnamese Horror Game
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.volume = 0.8;
    this.isMuted = false;
    this.ambientRunning = false;

    // Ambient nodes
    this.windNode = null;
    this.droneOsc = null;
    this.droneGain = null;
    this.cricketInterval = null;

    // Dynamic states
    this.isChasing = false;
    this.isBossMusic = false;
    this.chaseInterval = null;
    this.heartbeatInterval = null;
    this.lastFootstepTime = 0;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.startAmbient();
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- AMBIENT SOUNDSCAPE ---
  startAmbient() {
    if (!this.ctx || this.ambientRunning) return;
    this.ambientRunning = true;

    // 1. Spooky Low Drone (Vietnamese temple sub-drone)
    this.droneOsc = this.ctx.createOscillator();
    this.droneOsc.type = 'sawtooth';
    this.droneOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A

    const droneFilter = this.ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.setValueAtTime(110, this.ctx.currentTime);

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    this.droneOsc.connect(droneFilter);
    droneFilter.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);
    this.droneOsc.start();

    // 2. Wind Howl (Filtered Noise)
    this.createWindGenerator();

    // 3. Crickets / Night Insects (Vietnamese countryside ambiance)
    this.cricketInterval = setInterval(() => {
      if (Math.random() < 0.6) {
        this.playCricketChirp();
      }
    }, 1800);
  }

  createWindGenerator() {
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(280, this.ctx.currentTime);
    windFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    const windGain = this.ctx.createGain();
    windGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    whiteNoise.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.masterGain);
    whiteNoise.start();

    // Subtle LFO on wind filter frequency
    setInterval(() => {
      if (!this.ctx) return;
      const targetFreq = 180 + Math.random() * 250;
      windFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 2.5);
    }, 3000);
  }

  playCricketChirp() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(4500 + Math.random() * 500, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.012, this.ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  // --- FOOTSTEPS ---
  playFootstep(isRunning = false) {
    if (!this.ctx) return;
    const now = performance.now();
    const minDelay = isRunning ? 280 : 480;
    if (now - this.lastFootstepTime < minDelay) return;
    this.lastFootstepTime = now;

    // Gravel/dirt crunch noise
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isRunning ? 600 : 420, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    const vol = isRunning ? 0.12 : 0.06;
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start();
  }

  // --- MONSTER & CANINE SOUNDS ---
  playDogBark(isDistant = true) {
    if (!this.ctx) return;
    const duration = isDistant ? 0.6 : 0.4;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    // Frequency drop for dog bark
    const startFreq = isDistant ? 280 : 380;
    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + duration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isDistant ? 450 : 800, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    const vol = isDistant ? 0.07 : 0.25;
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);

    // If distant, add a delayed echo
    if (isDistant) {
      setTimeout(() => {
        this.playDistantEcho(startFreq * 0.85);
      }, 250);
    }
  }

  playDistantEcho(freq) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.4);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.025, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  playMonsterGrowl() {
    if (!this.ctx) return;
    const duration = 1.4;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(65, this.ctx.currentTime);
    osc2.frequency.setValueAtTime(67.5, this.ctx.currentTime); // Dissonant beating

    // Frequency downward slide
    osc1.frequency.linearRampToValueAtTime(45, this.ctx.currentTime + duration);
    osc2.frequency.linearRampToValueAtTime(46, this.ctx.currentTime + duration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + duration);
    osc2.stop(this.ctx.currentTime + duration);
  }

  playMonsterRoar() {
    if (!this.ctx) return;
    this.playMonsterGrowl();
    this.playHorrorStinger();
  }

  // --- HORROR STINGER / JUMPSCARE ---
  playHorrorStinger() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const freqs = [185, 233, 277, 311, 415]; // Dissonant minor second cluster

    freqs.forEach(f => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 1.2);
    });

    // Sub thump
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(90, t);
    sub.frequency.exponentialRampToValueAtTime(30, t + 0.5);

    subGain.gain.setValueAtTime(0.25, t);
    subGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);

    sub.connect(subGain);
    subGain.connect(this.masterGain);
    sub.start(t);
    sub.stop(t + 0.5);
  }

  // --- HEARTBEAT PULSE ---
  playHeartbeat() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const playThump = (time, freq, vol) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);

      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + 0.15);
    };

    playThump(t, 85, 0.22);
    playThump(t + 0.18, 70, 0.16);
  }

  setDangerLevel(level) { // 0.0 to 1.0
    if (level > 0.3 && !this.heartbeatInterval) {
      const rate = Math.max(450, 1100 - level * 650);
      this.heartbeatInterval = setInterval(() => {
        this.playHeartbeat();
      }, rate);
    } else if (level <= 0.3 && this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // --- UI & GAMEPLAY SOUNDS ---
  playPickup() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    // Harmonic bell chord (Vietnamese crystal chime)
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + idx * 0.04);

      gain.gain.setValueAtTime(0.06, t + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.0);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + idx * 0.04);
      osc.stop(t + 1.0);
    });
  }

  playQuestComplete() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    // Deep bronze temple gong (Chuông đồng cổ)
    const gong = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    gong.type = 'triangle';
    gong.frequency.setValueAtTime(146.83, t); // D3

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 3.0);

    gong.connect(gain);
    gain.connect(this.masterGain);
    gong.start(t);
    gong.stop(t + 3.0);

    // Overtone
    const gongHigh = this.ctx.createOscillator();
    const gainHigh = this.ctx.createGain();
    gongHigh.type = 'sine';
    gongHigh.frequency.setValueAtTime(440, t);
    gainHigh.gain.setValueAtTime(0.08, t);
    gainHigh.gain.exponentialRampToValueAtTime(0.0001, t + 2.0);

    gongHigh.connect(gainHigh);
    gainHigh.connect(this.masterGain);
    gongHigh.start(t);
    gongHigh.stop(t + 2.0);
  }

  playInteract() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.07);

    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  // --- DYNAMIC MUSIC: CHASE & BOSS ---
  startChaseMusic() {
    if (this.isChasing || !this.ctx) return;
    this.isChasing = true;
    let step = 0;
    this.chaseInterval = setInterval(() => {
      if (!this.isChasing) return;
      this.playHeartbeat();
      // Fast driving synth percussion
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      const freq = step % 2 === 0 ? 80 : 95;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
      step++;
    }, 320);
  }

  stopChaseMusic() {
    this.isChasing = false;
    if (this.chaseInterval) {
      clearInterval(this.chaseInterval);
      this.chaseInterval = null;
    }
  }

  startBossMusic() {
    this.startChaseMusic();
    this.isBossMusic = true;
  }

  stopBossMusic() {
    this.stopChaseMusic();
    this.isBossMusic = false;
  }

  playDawnVictory() {
    this.stopChaseMusic();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    // Serene peaceful bamboo flute/bell pentatonic chord (D, F#, A, B, D)
    [293.66, 369.99, 440.00, 493.88, 587.33].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.25);

      gain.gain.setValueAtTime(0.001, t + i * 0.25);
      gain.gain.linearRampToValueAtTime(0.06, t + i * 0.25 + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.25 + 4.0);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + i * 0.25);
      osc.stop(t + i * 0.25 + 4.5);
    });
  }

  // --- JUMPSCARE & DEATH AUDIO ---
  playJumpscareDeath() {
    this.stopChaseMusic();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // 1. Terrifying high screech cluster (Dissonant minor seconds)
    [820, 875, 1150, 1220, 1640].forEach(f => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.9);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.9);
    });

    // 2. Monstrous roar & distorted impact
    const roarOsc = this.ctx.createOscillator();
    const roarGain = this.ctx.createGain();
    roarOsc.type = 'sawtooth';
    roarOsc.frequency.setValueAtTime(120, t);
    roarOsc.frequency.linearRampToValueAtTime(40, t + 1.2);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, t);

    roarGain.gain.setValueAtTime(0.4, t);
    roarGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

    roarOsc.connect(filter);
    filter.connect(roarGain);
    roarGain.connect(this.masterGain);
    roarOsc.start(t);
    roarOsc.stop(t + 1.2);

    // 3. Sub-bass boom
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(120, t);
    sub.frequency.exponentialRampToValueAtTime(25, t + 0.7);

    subGain.gain.setValueAtTime(0.6, t);
    subGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);

    sub.connect(subGain);
    subGain.connect(this.masterGain);
    sub.start(t);
    sub.stop(t + 0.7);
  }

  // --- NIGHTMARE HEAVY BREATHING ---
  playHeavyBreathing() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const playBreath = (time, isExhale = false) => {
      const bufferSize = this.ctx.sampleRate * 0.7;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(isExhale ? 650 : 850, time);
      filter.Q.setValueAtTime(2.0, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.7);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start(time);
    };

    playBreath(t);
    playBreath(t + 0.8, true);
    playBreath(t + 1.8);
    playBreath(t + 2.6, true);
  }

  // --- INTRO AUDIO: RAIN & CAR ENGINE ---
  startIntroAtmosphere() {
    this.init();
    if (!this.ctx) return;

    // Rain sound (continuous pink/white noise)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.rainSource = this.ctx.createBufferSource();
    this.rainSource.buffer = noiseBuffer;
    this.rainSource.loop = true;

    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0.07, this.ctx.currentTime);

    this.rainSource.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);
    this.rainSource.start();

    // Engine stopping sound (low frequency descending tone)
    const carOsc = this.ctx.createOscillator();
    const carGain = this.ctx.createGain();
    carOsc.type = 'sawtooth';
    carOsc.frequency.setValueAtTime(80, this.ctx.currentTime);
    carOsc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 3.0);

    const carFilter = this.ctx.createBiquadFilter();
    carFilter.type = 'lowpass';
    carFilter.frequency.setValueAtTime(180, this.ctx.currentTime);

    carGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    carGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 3.5);

    carOsc.connect(carFilter);
    carFilter.connect(carGain);
    carGain.connect(this.masterGain);
    carOsc.start();
    carOsc.stop(this.ctx.currentTime + 3.5);
  }

  stopIntroAtmosphere() {
    if (this.rainGain && this.ctx) {
      this.rainGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.0);
      setTimeout(() => {
        if (this.rainSource) {
          try { this.rainSource.stop(); } catch (e) {}
        }
      }, 1000);
    }
  }

  // --- AREA SPECIFIC SOUNDSCAPES ---
  setAreaAmbience(areaId) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    if (areaId === 'AREA_HOME') {
      // Clock ticking simulation
      this.playClockTick();
    } else if (areaId === 'AREA_WELL') {
      // Water droplet in deep stone well
      this.playWaterDrop();
    } else if (areaId === 'AREA_CEMETERY') {
      // Eerie low whistle
      this.playGhostWhisper();
    } else if (areaId === 'AREA_SHRINE') {
      // Resonant deep temple bell
      this.playTempleChime();
    }
  }

  playClockTick() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.03);
  }

  playWaterDrop() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1800, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playGhostWhisper() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(260, this.ctx.currentTime + 1.2);

    gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 1.2);
  }

  playTempleChime() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(185, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 3.0);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 3.0);
  }
}

export const audioManager = new AudioManager();

