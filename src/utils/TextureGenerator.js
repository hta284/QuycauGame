import * as THREE from 'three';

// Procedural Canvas Texture Generator for Vietnamese Rural Aesthetics
export class TextureGenerator {
  static createDirtTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base earth tone
    ctx.fillStyle = '#69543e';
    ctx.fillRect(0, 0, 512, 512);

    // Dirt noise & pebbles
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = Math.random() * 3 + 1;
      const shade = Math.floor(Math.random() * 38);
      ctx.fillStyle = `rgb(${72 + shade}, ${57 + shade}, ${41 + shade})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mud patches
    for (let i = 0; i < 25; i++) {
      const cx = Math.random() * 512;
      const cy = Math.random() * 512;
      const rad = 20 + Math.random() * 60;
      const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, rad);
      grad.addColorStop(0, 'rgba(15, 10, 8, 0.4)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  static createWoodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Dark rustic Vietnamese wood
    ctx.fillStyle = '#2a1a10';
    ctx.fillRect(0, 0, 512, 512);

    // Wood grains
    ctx.lineWidth = 2;
    for (let y = 0; y < 512; y += 4) {
      const darkness = Math.floor(Math.random() * 25);
      ctx.strokeStyle = `rgb(${35 + darkness}, ${20 + darkness}, ${12 + darkness})`;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x < 512; x += 30) {
        ctx.lineTo(x, y + Math.sin(x * 0.02) * 3 + (Math.random() - 0.5) * 2);
      }
      ctx.stroke();
    }

    // Wood knots
    for (let k = 0; k < 6; k++) {
      const kx = Math.random() * 512;
      const ky = Math.random() * 512;
      ctx.fillStyle = '#150a04';
      ctx.beginPath();
      ctx.ellipse(kx, ky, 8, 16, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  static createStoneTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#26282a';
    ctx.fillRect(0, 0, 512, 512);

    // Weathered specks
    for (let i = 0; i < 6000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 2.5;
      const v = 30 + Math.floor(Math.random() * 35);
      ctx.fillStyle = `rgb(${v}, ${v + 3}, ${v + 2})`;
      ctx.fillRect(x, y, size, size);
    }

    // Moss streaks (greenish dark moss)
    for (let m = 0; m < 15; m++) {
      const mx = Math.random() * 512;
      const my = Math.random() * 512;
      const rad = 15 + Math.random() * 45;
      const grad = ctx.createRadialGradient(mx, my, 2, mx, my, rad);
      grad.addColorStop(0, 'rgba(28, 48, 22, 0.45)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(mx, my, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  static createRoofTileTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Ancient Vietnamese Yin-Yang terracotta tile color
    ctx.fillStyle = '#4a251b';
    ctx.fillRect(0, 0, 256, 256);

    ctx.lineWidth = 3;
    for (let y = 0; y < 256; y += 32) {
      // Tile line
      ctx.strokeStyle = '#2d140e';
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();

      // Individual scallops
      for (let x = 0; x < 256; x += 32) {
        ctx.strokeStyle = '#633324';
        ctx.beginPath();
        ctx.arc(x + 16, y + 16, 14, 0, Math.PI);
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  static createTalismanTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Aged yellow parchment
    ctx.fillStyle = '#d9b66a';
    ctx.fillRect(0, 0, 256, 512);

    // Weathered border
    ctx.strokeStyle = '#852020';
    ctx.lineWidth = 8;
    ctx.strokeRect(12, 12, 232, 488);

    // Red cinnabar blood calligraphy (Bùa chú)
    ctx.fillStyle = '#a61b1b';
    ctx.font = 'bold 36px serif';
    ctx.textAlign = 'center';
    ctx.fillText('敕令', 128, 80);
    ctx.fillText('鎮', 128, 160);
    ctx.fillText('鬼', 128, 250);
    ctx.fillText('惡', 128, 340);
    ctx.fillText('滅', 128, 430);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
}
