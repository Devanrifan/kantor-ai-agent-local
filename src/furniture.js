import * as THREE from 'three';
import { box, mat } from './character.js';

const glowMats = new Map();
export function glow(color) {
  if (!glowMats.has(color)) glowMats.set(color, new THREE.MeshBasicMaterial({ color }));
  return glowMats.get(color);
}

const group = (...kids) => {
  const g = new THREE.Group();
  kids.forEach((k) => k && g.add(k));
  return g;
};

// Meja: atas di y=0.9. Orang duduk di sisi -z, layar laptop menghadap -z.
export function desk(w = 2.2, d = 1.2, top = '#e9d8bd', accent = '#b99a6b') {
  const g = new THREE.Group();
  g.add(box(w, 0.08, d, top, 0, 0.86, 0));
  g.add(box(0.08, 0.82, d - 0.1, accent, -w / 2 + 0.06, 0.41, 0));
  g.add(box(0.08, 0.82, d - 0.1, accent, w / 2 - 0.06, 0.41, 0));
  g.add(box(w - 0.2, 0.5, 0.05, accent, 0, 0.55, d / 2 - 0.08));
  return g;
}

export function laptop(screenColor = '#8ec5ff') {
  const g = new THREE.Group();
  g.add(box(0.62, 0.03, 0.42, '#c9ced6', 0, 0.915, -0.08));
  const screen = new THREE.Group();
  screen.position.set(0, 0.93, 0.12);
  screen.rotation.x = 0.22;
  screen.add(box(0.62, 0.4, 0.03, '#b7bcc6', 0, 0.2, 0));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.33), glow(screenColor));
  face.position.set(0, 0.2, -0.017);
  face.rotation.y = Math.PI;
  screen.add(face);
  g.add(screen);
  return g;
}

export function mug(color = '#ffffff') {
  return group(box(0.1, 0.12, 0.1, color, 0, 0.96, 0));
}

export function chair(color = '#445066') {
  const g = new THREE.Group();
  g.add(box(0.56, 0.1, 0.56, color, 0, 0.42, 0));
  g.add(box(0.56, 0.62, 0.08, color, 0, 0.78, -0.27));
  g.add(box(0.08, 0.3, 0.08, '#2a2f3a', 0, 0.22, 0));
  g.add(box(0.7, 0.05, 0.12, '#2a2f3a', 0, 0.05, 0));
  g.add(box(0.12, 0.05, 0.7, '#2a2f3a', 0, 0.05, 0));
  return g;
}

export function plant(h = 1) {
  const g = new THREE.Group();
  g.add(box(0.4, 0.35, 0.4, '#c2724a', 0, 0.175, 0));
  g.add(box(0.46, 0.06, 0.46, '#a85d3a', 0, 0.37, 0));
  g.add(box(0.1, 0.4 * h, 0.1, '#5a7d3a', 0, 0.6, 0));
  g.add(box(0.5, 0.3 * h, 0.5, '#3f9b52', 0, 0.85 * h, 0));
  g.add(box(0.34, 0.26 * h, 0.34, '#52b565', 0.08, 1.12 * h, -0.05));
  return g;
}

const BOOK_COLORS = ['#e4572e', '#4f7cff', '#f5b82e', '#2fbf71', '#8a5cf6', '#ff5fa2', '#14b8a6'];
export function bookshelf(w = 2.4, h = 2.2) {
  const g = new THREE.Group();
  const depth = 0.45;
  g.add(box(w, h, 0.05, '#b08d62', 0, h / 2, -depth / 2 + 0.03));
  g.add(box(0.06, h, depth, '#b08d62', -w / 2, h / 2, 0));
  g.add(box(0.06, h, depth, '#b08d62', w / 2, h / 2, 0));
  const shelves = 4;
  for (let s = 0; s <= shelves; s += 1) {
    const y = (s * h) / shelves;
    g.add(box(w, 0.05, depth, '#9a7a52', 0, y + 0.03, 0));
    if (s === shelves) continue;
    let x = -w / 2 + 0.15;
    let i = s * 3;
    while (x < w / 2 - 0.2) {
      const bw = 0.08 + ((i * 7) % 4) * 0.025;
      const bh = 0.3 + ((i * 5) % 4) * 0.06;
      g.add(box(bw, bh, 0.3, BOOK_COLORS[i % BOOK_COLORS.length], x + bw / 2, y + 0.06 + bh / 2, 0));
      x += bw + 0.02;
      i += 1;
    }
  }
  return g;
}

// Menempel di dinding belakang (menghadap +z)
export function whiteboard(w = 3, h = 1.6) {
  const g = new THREE.Group();
  g.add(box(w + 0.12, h + 0.12, 0.06, '#9aa3b0', 0, 0, 0));
  g.add(box(w, h, 0.04, '#fbfcfe', 0, 0, 0.03));
  const cols = ['#4f7cff', '#ff8a3d', '#2fbf71', '#ff5fa2'];
  for (let i = 0; i < 4; i += 1) {
    g.add(box(w * 0.26, 0.05, 0.02, cols[i], -w * 0.3 + (i % 2) * w * 0.3, h * 0.25 - Math.floor(i / 2) * 0.35, 0.06));
  }
  g.add(box(w * 0.7, 0.04, 0.02, '#c7ccd6', 0, -h * 0.28, 0.06));
  g.add(box(w, 0.05, 0.12, '#9aa3b0', 0, -h / 2 - 0.08, 0.08));
  return g;
}

export function windowPane(w = 1.6, h = 1.3) {
  const g = new THREE.Group();
  g.add(box(w + 0.16, h + 0.16, 0.05, '#f1f3f7', 0, 0, 0));
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glow('#bfe3ff'));
  pane.position.z = 0.03;
  g.add(pane);
  g.add(box(0.05, h, 0.03, '#f1f3f7', 0, 0, 0.04));
  g.add(box(w, 0.05, 0.03, '#f1f3f7', 0, 0, 0.04));
  return g;
}

export function clock() {
  const g = new THREE.Group();
  g.add(box(0.6, 0.6, 0.06, '#2a2f3a'));
  g.add(box(0.5, 0.5, 0.03, '#ffffff', 0, 0, 0.03));
  g.add(box(0.04, 0.2, 0.02, '#222', 0, 0.08, 0.05));
  g.add(box(0.14, 0.04, 0.02, '#222', 0.05, 0, 0.05));
  return g;
}

export function rug(w, d, color) {
  return box(w, 0.03, d, color, 0, 0.1, 0, { transparent: false });
}

export function sofa(w = 2.6, color = '#6b7a99') {
  const g = new THREE.Group();
  g.add(box(w, 0.4, 0.9, color, 0, 0.3, 0));
  g.add(box(w, 0.6, 0.25, color, 0, 0.6, -0.33));
  g.add(box(0.25, 0.55, 0.9, color, -w / 2 + 0.12, 0.45, 0));
  g.add(box(0.25, 0.55, 0.9, color, w / 2 - 0.12, 0.45, 0));
  g.add(box(0.5, 0.45, 0.14, '#f5b82e', 0.5, 0.65, -0.12));
  return g;
}

export function table(w = 1.6, d = 1.0, color = '#e9d8bd') {
  const g = new THREE.Group();
  g.add(box(w, 0.08, d, color, 0, 0.62, 0));
  g.add(box(0.1, 0.58, 0.1, '#8a6f48', -w / 2 + 0.12, 0.29, -d / 2 + 0.12));
  g.add(box(0.1, 0.58, 0.1, '#8a6f48', w / 2 - 0.12, 0.29, -d / 2 + 0.12));
  g.add(box(0.1, 0.58, 0.1, '#8a6f48', -w / 2 + 0.12, 0.29, d / 2 - 0.12));
  g.add(box(0.1, 0.58, 0.1, '#8a6f48', w / 2 - 0.12, 0.29, d / 2 - 0.12));
  return g;
}

export function coffeeMachine() {
  const g = new THREE.Group();
  g.add(box(0.9, 1.0, 0.6, '#2a2f3a', 0, 0.5, 0));
  g.add(box(0.6, 0.3, 0.05, '#4f7cff', 0, 0.8, 0.31));
  g.add(box(0.5, 0.05, 0.4, '#c9ced6', 0, 0.35, 0.2));
  g.add(box(0.12, 0.16, 0.12, '#ffffff', 0, 0.45, 0.22));
  return g;
}

export function waterCooler() {
  const g = new THREE.Group();
  g.add(box(0.5, 0.9, 0.5, '#e6eaf0', 0, 0.45, 0));
  g.add(box(0.4, 0.55, 0.4, '#8ec5ff', 0, 1.15, 0, { transparent: true, opacity: 0.7 }));
  return g;
}

export function filingCabinet() {
  const g = new THREE.Group();
  g.add(box(0.7, 1.3, 0.6, '#9aa3b0', 0, 0.65, 0));
  for (let i = 0; i < 3; i += 1) {
    g.add(box(0.5, 0.08, 0.04, '#6b7482', 0, 0.3 + i * 0.4, 0.31));
  }
  return g;
}

// ---------- Properti khas tiap divisi ----------
export function ringLight() {
  const g = new THREE.Group();
  g.add(box(0.06, 1.4, 0.06, '#2a2f3a', 0, 0.7, 0));
  g.add(box(0.5, 0.05, 0.05, '#2a2f3a', 0, 0.04, 0));
  g.add(box(0.05, 0.05, 0.5, '#2a2f3a', 0, 0.04, 0));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.05, 8, 24), glow('#fff6d6'));
  ring.position.set(0, 1.55, 0);
  g.add(ring);
  g.add(box(0.14, 0.14, 0.1, '#222', 0, 1.55, 0.02));
  return g;
}

export function deviceShelf() {
  const g = new THREE.Group();
  g.add(box(2.4, 0.08, 0.5, '#d5dae2', 0, 1.0, 0));
  g.add(box(0.08, 1.0, 0.5, '#9aa3b0', -1.15, 0.5, 0));
  g.add(box(0.08, 1.0, 0.5, '#9aa3b0', 1.15, 0.5, 0));
  const cols = ['#8ec5ff', '#ffd68a', '#b6f0c8', '#f7b6d0', '#cdb8ff'];
  for (let i = 0; i < 5; i += 1) {
    const w = i % 2 ? 0.34 : 0.22;
    const h = i % 2 ? 0.5 : 0.4;
    const dev = group(box(w, h, 0.04, '#222', 0, 0, 0), new THREE.Mesh(new THREE.PlaneGeometry(w - 0.04, h - 0.04), glow(cols[i])));
    dev.children[1].position.z = 0.025;
    dev.position.set(-0.9 + i * 0.45, 1.3, 0);
    dev.rotation.x = -0.1;
    g.add(dev);
  }
  g.add(box(2.4, 0.08, 0.5, '#d5dae2', 0, 0.45, 0));
  return g;
}

export function serverRack() {
  const g = new THREE.Group();
  g.add(box(0.9, 1.9, 0.7, '#2a2f3a', 0, 0.95, 0));
  for (let i = 0; i < 6; i += 1) {
    g.add(box(0.74, 0.18, 0.04, '#3a4150', 0, 0.3 + i * 0.28, 0.36));
    g.add(box(0.06, 0.06, 0.02, i % 2 ? '#2fbf71' : '#ffb020', 0.28, 0.3 + i * 0.28, 0.39));
  }
  return g;
}

export function chartWall(w = 3.4, h = 1.9) {
  const g = new THREE.Group();
  g.add(box(w + 0.12, h + 0.12, 0.06, '#2a2f3a'));
  g.add(box(w, h, 0.04, '#f8fbff', 0, 0, 0.03));
  const bars = [0.35, 0.55, 0.45, 0.8, 0.65, 1.0];
  bars.forEach((v, i) => {
    const bh = v * (h * 0.7);
    g.add(box(0.28, bh, 0.03, i % 2 ? '#14b8a6' : '#4f7cff', -w / 2 + 0.45 + i * 0.5, -h / 2 + 0.2 + bh / 2, 0.06));
  });
  g.add(box(w - 0.4, 0.04, 0.02, '#c7ccd6', 0, -h / 2 + 0.17, 0.06));
  return g;
}

export function paperStack() {
  const g = new THREE.Group();
  g.add(box(0.36, 0.1, 0.28, '#ffffff', 0, 0.95, 0));
  g.add(box(0.34, 0.06, 0.26, '#eef1f6', 0.02, 1.03, 0.01));
  return g;
}

export function megaphone() {
  const g = new THREE.Group();
  g.add(box(0.2, 0.2, 0.2, '#ff8a3d', 0, 0, 0));
  g.add(box(0.36, 0.36, 0.3, '#ffb27a', 0, 0, 0.22));
  g.add(box(0.5, 0.5, 0.06, '#ff8a3d', 0, 0, 0.4));
  return g;
}

export function safe() {
  const g = new THREE.Group();
  g.add(box(0.9, 1.0, 0.8, '#4a5361', 0, 0.5, 0));
  g.add(box(0.7, 0.8, 0.04, '#5b6576', 0, 0.5, 0.42));
  g.add(box(0.14, 0.14, 0.06, '#f5b82e', 0.1, 0.5, 0.46));
  return g;
}

export function calculator() {
  const g = new THREE.Group();
  g.add(box(0.2, 0.03, 0.28, '#2a2f3a', 0, 0.93, 0));
  g.add(box(0.16, 0.01, 0.06, '#9ee2b0', 0, 0.955, -0.09));
  return g;
}
