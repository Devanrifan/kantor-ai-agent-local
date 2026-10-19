import * as THREE from 'three';
import { AGENTS, DIVISIONS, agentsOf } from '../shared/roster.js';
import { box, mat, createCharacter } from './character.js';
import * as F from './furniture.js';

export const ROOM_W = 10;
export const ROOM_D = 8;
export const PITCH_X = 12.5;
export const PITCH_Z = 10.5;
export const WALL_H = 3.6;
const FLOOR_TOP = 0.1;

function tint(hex, amount) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, amount);
  return `#${c.getHexString()}`;
}

function makeSign(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1024, 192);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(0, 150, 1024, 42);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 92px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), 512, 88);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return new THREE.Mesh(new THREE.PlaneGeometry(4.6, 0.86), new THREE.MeshBasicMaterial({ map: tex }));
}

function place(parent, obj, x, y, z, ry = 0) {
  obj.position.set(x, y, z);
  obj.rotation.y = ry;
  parent.add(obj);
  return obj;
}

function buildShell(inner, color, title) {
  const wall = tint(color, 0.36);
  const trim = tint(color, -0.08);
  const floor = tint(color, 0.42);

  inner.add(box(ROOM_W, 0.2, ROOM_D, floor, 0, -FLOOR_TOP, 0));

  // dinding belakang & kiri
  inner.add(box(ROOM_W + 0.3, WALL_H, 0.3, wall, 0, WALL_H / 2, -ROOM_D / 2 - 0.15));
  inner.add(box(0.3, WALL_H, ROOM_D + 0.3, wall, -ROOM_W / 2 - 0.15, WALL_H / 2, 0));
  inner.add(box(ROOM_W + 0.3, 0.14, 0.34, trim, 0, WALL_H + 0.07, -ROOM_D / 2 - 0.15));
  inner.add(box(0.34, 0.14, ROOM_D + 0.3, trim, -ROOM_W / 2 - 0.15, WALL_H + 0.07, 0));
  inner.add(box(ROOM_W, 0.22, 0.05, trim, 0, 0.11, -ROOM_D / 2 + 0.03));
  inner.add(box(0.05, 0.22, ROOM_D, trim, -ROOM_W / 2 + 0.03, 0.11, 0));

  // dinding rendah depan (ada pintu) & kanan
  const seg = ROOM_W / 2 - 1;
  inner.add(box(seg, 0.5, 0.2, wall, -(1 + seg / 2), 0.25, ROOM_D / 2 + 0.1));
  inner.add(box(seg, 0.5, 0.2, wall, 1 + seg / 2, 0.25, ROOM_D / 2 + 0.1));
  inner.add(box(0.2, 0.5, ROOM_D + 0.2, wall, ROOM_W / 2 + 0.1, 0.25, 0.1));
  inner.add(box(2.0, 0.04, 0.9, '#3b4252', 0, 0.02, ROOM_D / 2 + 0.1));

  // papan nama divisi
  inner.add(box(4.8, 1.0, 0.08, trim, 0, 3.0, -ROOM_D / 2 + 0.04));
  place(inner, makeSign(title, tint(color, -0.02)), 0, 3.0, -ROOM_D / 2 + 0.1);

  // jendela di dinding kiri
  place(inner, F.windowPane(1.6, 1.3), -ROOM_W / 2 + 0.03, 2.0, -1.4, Math.PI / 2);
  place(inner, F.windowPane(1.6, 1.3), -ROOM_W / 2 + 0.03, 2.0, 1.8, Math.PI / 2);
}

function addSeat(inner, chars, agent, x, z, opts) {
  const { deskW, deskD, color, index, laptopColor } = opts;
  const chairColor = tint(color, -0.18);
  place(inner, F.chair(chairColor), x, 0, z);
  const deskGroup = place(inner, F.desk(deskW, deskD), x, 0, z + deskD / 2 + 0.35);
  place(deskGroup, F.laptop(laptopColor), 0, 0, -0.2);
  place(deskGroup, F.mug(['#ffffff', '#ffd68a', '#cde8ff', '#f7c6d9'][index % 4]), deskW / 2 - 0.4, 0, 0.1);
  if (agent.leader) {
    deskGroup.add(box(0.5, 0.1, 0.04, color, -deskW / 2 + 0.55, 0.96, deskD / 2 - 0.12));
  }
  const ch = createCharacter(agent, color, index);
  ch.setHome(x, 0, z);
  inner.add(ch.root);
  chars.push(ch);
  return { ch, deskGroup };
}

function buildDivisionRoom(div, scene, chars) {
  const room = new THREE.Group();
  const cx = (div.col - 1) * PITCH_X;
  const cz = (div.row - 1) * PITCH_Z;
  room.position.set(cx, 0, cz);
  const inner = new THREE.Group();
  inner.position.y = FLOOR_TOP;
  room.add(inner);

  buildShell(inner, div.color, div.name);
  { const rug = F.rug(5.2, 3.2, tint(div.color, 0.3)); rug.position.set(0, 0.0, 1.0); inner.add(rug); }

  const members = agentsOf(div.id);
  const leader = members.find((m) => m.leader);
  const team = members.filter((m) => !m.leader);
  const glowColors = { proposal: '#cfe0ff', ads: '#ffd9bd', social: '#ffd0e6', qa: '#c9f2dc', dev: '#1f2a44', reporting: '#c8f3ee', account: '#fff0c4', finance: '#d9e2f2' };
  const lc = glowColors[div.id] || '#8ec5ff';

  if (leader) {
    // tim 4 orang: leader di belakang, 3 anggota satu baris
    const L = addSeat(inner, chars, leader, 0, -3.0, { deskW: 2.6, deskD: 1.3, color: div.color, index: 0, laptopColor: lc });
    L.ch.roams = true;
    L.ch.roamPath = [[1.75, -3.0], [1.75, 3.0]];
    team.forEach((m, i) => {
      addSeat(inner, chars, m, [-3.4, 0, 3.4][i], 0.3, { deskW: 2.2, deskD: 1.2, color: div.color, index: i + 1, laptopColor: lc });
    });
    place(inner, F.clock(), 0, 2.3, -ROOM_D / 2 + 0.05);
    place(inner, F.plant(1), -4.3, 0, 3.3);
    place(inner, F.plant(1.15), 4.3, 0, 3.3);
    place(inner, F.plant(0.9), 4.4, 0, -3.5);
  } else {
    const m = members[0];
    const S = addSeat(inner, chars, m, 0, -2.4, { deskW: 2.6, deskD: 1.3, color: div.color, index: 0, laptopColor: lc });
    S.ch.roams = true;
    S.ch.roamPath = [[2.2, -2.4], [2.2, 2.8]];
    place(inner, F.clock(), 0, 2.3, -ROOM_D / 2 + 0.05);
    place(inner, F.plant(1), -4.3, 0, 3.3);
    place(inner, F.plant(1.1), 4.3, 0, 3.3);
  }

  // properti khas divisi
  const wallZ = -ROOM_D / 2 + 0.2;
  switch (div.id) {
    case 'proposal':
      place(inner, F.whiteboard(2.6, 1.3), -3.3, 1.75, -ROOM_D / 2 + 0.06);
      place(inner, F.bookshelf(2.2, 2.1), 3.3, 0, wallZ + 0.1);
      break;
    case 'ads':
      place(inner, F.whiteboard(2.6, 1.3), -3.3, 1.75, -ROOM_D / 2 + 0.06);
      place(inner, F.bookshelf(2.2, 2.1), 3.3, 0, wallZ + 0.1);
      place(inner, F.megaphone(), 4.0, 1.4, 3.5, -0.5);
      break;
    case 'social':
      place(inner, F.whiteboard(2.6, 1.3), -3.3, 1.75, -ROOM_D / 2 + 0.06);
      place(inner, F.ringLight(), -4.2, 0, 2.6, 0.5);
      place(inner, F.bookshelf(2.2, 2.1), 3.3, 0, wallZ + 0.1);
      break;
    case 'qa':
      place(inner, F.whiteboard(2.6, 1.3), -3.3, 1.75, -ROOM_D / 2 + 0.06);
      place(inner, F.deviceShelf(), 3.3, 0, wallZ + 0.2);
      break;
    case 'dev':
      place(inner, F.whiteboard(2.6, 1.3), -3.3, 1.75, -ROOM_D / 2 + 0.06);
      place(inner, F.serverRack(), 3.9, 0, -3.2);
      break;
    case 'reporting':
      place(inner, F.chartWall(3.6, 1.9), -2.8, 1.75, -ROOM_D / 2 + 0.06);
      place(inner, F.bookshelf(2.2, 2.1), 3.5, 0, wallZ + 0.1);
      break;
    case 'account':
      place(inner, F.sofa(2.6), -3.3, 0, -3.3);
      place(inner, F.table(1.4, 0.9), -3.3, 0, -1.9);
      place(inner, F.whiteboard(2.4, 1.2), 3.3, 1.75, -ROOM_D / 2 + 0.06);
      break;
    case 'finance':
      place(inner, F.safe(), 3.8, 0, -3.3);
      place(inner, F.filingCabinet(), -3.8, 0, -3.5);
      place(inner, F.filingCabinet(), -3.0, 0, -3.5);
      place(inner, F.calculator(), 0.9, 0, -0.55);
      break;
    default:
  }

  scene.add(room);
  return { id: div.id, center: new THREE.Vector3(cx, 0, cz), group: room };
}

function buildLounge(scene) {
  const room = new THREE.Group();
  room.position.set(PITCH_X, 0, PITCH_Z);
  const inner = new THREE.Group();
  inner.position.y = FLOOR_TOP;
  room.add(inner);
  const color = '#e08e5a';
  buildShell(inner, color, 'Pantry');
  { const rug = F.rug(5.5, 3.6, '#f1d4b8'); rug.position.set(0, 0, 0.5); inner.add(rug); }
  place(inner, F.sofa(3.0, '#6b7a99'), 0, 0, -1.6);
  place(inner, F.table(1.5, 0.9, '#d9b98c'), 0, 0, 0.2);
  place(inner, F.mug('#ffffff'), -0.3, 0.0, 0.2);
  place(inner, F.coffeeMachine(), 3.6, 0, -3.4);
  place(inner, F.waterCooler(), 4.4, 0, -2.3);
  place(inner, F.bookshelf(2.2, 2.1), -3.3, 0, -ROOM_D / 2 + 0.3);
  place(inner, F.plant(1.2), -4.3, 0, 3.3);
  place(inner, F.plant(1), 4.3, 0, 3.3);
  scene.add(room);
  return room;
}

export function buildOffice(scene) {
  const chars = [];
  const rooms = new Map();

  // lantai koridor / dasar
  const baseW = PITCH_X * 2 + ROOM_W + 5;
  const baseD = PITCH_Z * 2 + ROOM_D + 5;
  const base = box(baseW, 0.4, baseD, '#d3dbe6', 0, -0.3, 0);
  base.castShadow = false;
  scene.add(base);
  const edge = box(baseW + 1.2, 0.3, baseD + 1.2, '#aeb9c9', 0, -0.55, 0);
  edge.castShadow = false;
  scene.add(edge);

  // jalur koridor (garis halus)
  for (let c = 0; c < 2; c += 1) {
    const x = (c - 0.5) * PITCH_X;
    const lane = box(0.12, 0.02, baseD - 2, '#c2ccda', x, -0.09, 0);
    lane.castShadow = false;
    scene.add(lane);
  }

  DIVISIONS.forEach((d) => rooms.set(d.id, buildDivisionRoom(d, scene, chars)));
  buildLounge(scene);

  const bounds = {
    minX: -(PITCH_X + ROOM_W / 2),
    maxX: PITCH_X + ROOM_W / 2,
    minZ: -(PITCH_Z + ROOM_D / 2),
    maxZ: PITCH_Z + ROOM_D / 2,
  };

  const byId = new Map(chars.map((c) => [c.agent.id, c]));
  const pickables = chars.map((c) => c.hit);

  return {
    chars,
    byId,
    rooms,
    pickables,
    bounds,
    update(dt, t) {
      for (const c of chars) c.update(dt, t);
    },
  };
}

export { AGENTS, mat };
