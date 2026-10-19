import * as THREE from 'three';
import { buildOffice } from './office.js';

const damp = (cur, target, rate, dt) => cur + (target - cur) * (1 - Math.exp(-rate * dt));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Kamera isometrik (orthographic) dengan gerak yang di-damp supaya halus.
const CAM_DIR = new THREE.Vector3(1, 0.82, 1).normalize();
const CAM_DIST = 70;
const SIN_ELEV = CAM_DIR.y; // sudut elevasi: y komponen dari arah ternormalisasi
const VIEW_H = 11; // setengah tinggi frustum pada zoom = 1

export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, -50, 400);

  // ---------- cahaya ----------
  scene.add(new THREE.HemisphereLight('#ffffff', '#b8c4d8', 1.55));
  const sun = new THREE.DirectionalLight('#fff6e8', 2.1);
  sun.position.set(14, 46, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  const sc = sun.shadow.camera;
  sc.left = -40; sc.right = 40; sc.top = 40; sc.bottom = -40; sc.near = 1; sc.far = 140;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  scene.add(sun);

  // ---------- kantor ----------
  const office = buildOffice(scene);
  const { bounds } = office;

  // cincin penanda karyawan terpilih
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.62, 0.82, 40),
    new THREE.MeshBasicMaterial({ color: '#4f7cff', transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;
  ring.renderOrder = 2;
  scene.add(ring);
  let ringTarget = null;
  const ringPos = new THREE.Vector3();

  // ---------- state kamera ----------
  const cam = {
    target: new THREE.Vector3(0, 0, 0),
    goal: new THREE.Vector3(0, 0, 0),
    zoom: 0.3,
    goalZoom: 0.5,
    fit: 0.5,
    min: 0.45,
    max: 3,
    inset: { x: 0, y: 0 },
    insetGoal: { x: 0, y: 0 },
  };

  let W = 1;
  let H = 1;
  const resize = () => {
    W = canvas.clientWidth || window.innerWidth;
    H = canvas.clientHeight || window.innerHeight;
    renderer.setSize(W, H, false);
    const aspect = W / H;
    // zoom agar seluruh kantor muat
    cam.fit = Math.min(VIEW_H / 19.5, (VIEW_H * aspect) / 27);
    cam.min = cam.fit * 0.92;
    cam.goalZoom = clamp(cam.goalZoom, cam.min, cam.max);
  };
  resize();
  window.addEventListener('resize', resize);
  cam.zoom = cam.fit * 0.55; // intro: zoom-in halus
  cam.goalZoom = cam.fit;

  const flatFwd = new THREE.Vector3(-CAM_DIR.x, 0, -CAM_DIR.z).normalize();
  const right = new THREE.Vector3().crossVectors(flatFwd, new THREE.Vector3(0, 1, 0)).normalize();

  const clampTarget = (v) => {
    v.x = clamp(v.x, bounds.minX - 2, bounds.maxX + 2);
    v.z = clamp(v.z, bounds.minZ - 2, bounds.maxZ + 2);
  };

  function applyCamera() {
    const aspect = W / H;
    const h = VIEW_H / cam.zoom;
    const hw = h * aspect;
    // geser frustum agar titik fokus tampil di tengah area yang tidak tertutup panel
    const sx = (cam.inset.x * hw) / W;
    const sy = (cam.inset.y * h) / H;
    camera.left = -hw + sx;
    camera.right = hw + sx;
    camera.top = h - sy;
    camera.bottom = -h - sy;
    camera.position.copy(cam.target).addScaledVector(CAM_DIR, CAM_DIST);
    camera.lookAt(cam.target);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }

  // ---------- API fokus ----------
  const zoomFor = {
    overview: () => cam.fit,
    room: () => clamp(Math.min(VIEW_H / 8.6, (VIEW_H * (W / H)) / 12.2), cam.min, cam.max),
    agent: () => clamp(Math.min(VIEW_H / 5.2, (VIEW_H * (W / H)) / 6.5), cam.min, cam.max),
  };

  function focus(kind, x = 0, z = 0) {
    cam.goal.set(kind === 'overview' ? 0 : x, 0, kind === 'overview' ? 0 : z);
    clampTarget(cam.goal);
    cam.goalZoom = zoomFor[kind]();
  }

  function setInset(x, y) {
    cam.insetGoal.x = x;
    cam.insetGoal.y = y;
  }

  // ---------- input: geser, zoom, klik ----------
  const pointers = new Map();
  let drag = null;
  let pinch = null;
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const listeners = { click: [], hover: [] };

  const unitsPerPx = () => (2 * (VIEW_H / cam.zoom)) / H;

  function pick(cx, cy) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(office.pickables, false);
    return hits.length ? hits[0].object.userData.agentId : null;
  }

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      drag = { sx: e.clientX, sy: e.clientY, lx: e.clientX, ly: e.clientY, moved: 0, t: performance.now() };
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: cam.goalZoom };
      drag = null;
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId);
    if (p) { p.x = e.clientX; p.y = e.clientY; }

    if (pinch && pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      cam.goalZoom = clamp(pinch.z * (d / pinch.d), cam.min, cam.max);
      return;
    }
    if (drag && pointers.size === 1) {
      const dx = e.clientX - drag.lx;
      const dy = e.clientY - drag.ly;
      drag.lx = e.clientX;
      drag.ly = e.clientY;
      drag.moved += Math.abs(dx) + Math.abs(dy);
      if (drag.moved > 6) {
        canvas.classList.add('grab');
        const u = unitsPerPx();
        cam.goal.addScaledVector(right, -dx * u);
        cam.goal.addScaledVector(flatFwd, (dy * u) / SIN_ELEV);
        clampTarget(cam.goal);
      }
      return;
    }
    if (e.pointerType === 'mouse' && !e.buttons) {
      const id = pick(e.clientX, e.clientY);
      canvas.classList.toggle('point', Boolean(id));
      listeners.hover.forEach((fn) => fn(id));
    }
  });

  const endPointer = (e) => {
    const was = drag;
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    canvas.classList.remove('grab');
    if (pointers.size === 0) {
      drag = null;
      if (was && was.moved <= 6 && performance.now() - was.t < 600 && e.type === 'pointerup') {
        const id = pick(e.clientX, e.clientY);
        listeners.click.forEach((fn) => fn(id, e));
      }
    }
  };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('pointerleave', () => listeners.hover.forEach((fn) => fn(null)));

  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : 1;
      const f = Math.exp(-e.deltaY * unit * 0.0016);
      cam.goalZoom = clamp(cam.goalZoom * f, cam.min, cam.max);
    },
    { passive: false },
  );

  // ---------- loop ----------
  const clock = new THREE.Clock();
  const frameHooks = [];
  let elapsed = 0;
  let frames = 0;

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    elapsed += dt;

    cam.target.x = damp(cam.target.x, cam.goal.x, 5.5, dt);
    cam.target.z = damp(cam.target.z, cam.goal.z, 5.5, dt);
    cam.zoom = damp(cam.zoom, cam.goalZoom, 5, dt);
    cam.inset.x = damp(cam.inset.x, cam.insetGoal.x, 6, dt);
    cam.inset.y = damp(cam.inset.y, cam.insetGoal.y, 6, dt);

    office.update(dt, elapsed);

    if (ringTarget) {
      ring.visible = true;
      ringTarget.root.getWorldPosition(ringPos);
      ring.position.set(ringPos.x, 0.14, ringPos.z);
      const s = 1 + Math.sin(elapsed * 3.2) * 0.07;
      ring.scale.set(s, s, s);
    } else {
      ring.visible = false;
    }

    applyCamera();
    renderer.render(scene, camera);
    frameHooks.forEach((fn) => fn(dt, elapsed));
    frames += 1;
    requestAnimationFrame(frame);
  }
  applyCamera();
  requestAnimationFrame(frame);

  return {
    office,
    camera,
    renderer,
    get size() { return { w: W, h: H }; },
    get zoom() { return cam.zoom; },
    get frames() { return frames; },
    focus,
    setInset,
    pick,
    setRing(char, color) {
      ringTarget = char;
      if (char) ring.material.color.set(color);
    },
    onClick: (fn) => listeners.click.push(fn),
    onHover: (fn) => listeners.hover.push(fn),
    onFrame: (fn) => frameHooks.push(fn),
  };
}
