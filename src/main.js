import './style.css';
import { DIVISIONS, agentById, divisionById } from '../shared/roster.js';
import { createStage } from './stage.js';
import { createTags } from './tags.js';
import { createPanel } from './panel.js';
import { fetchConfig, getCode, setCode } from './chat.js';
import { PITCH_X, PITCH_Z } from './office.js';

const $ = (id) => document.getElementById(id);
const mobile = matchMedia('(max-width: 760px)');

const config = { demo: false, needsCode: false, offline: false };

// ---------- scene ----------
const stage = createStage($('scene'));
const tags = createTags(stage, $('tags'));
const { byId, rooms } = stage.office;

// ---------- state tampilan ----------
let selectedId = null;
let view = { kind: 'overview', id: null };
const doneTimers = new Map();

// ---------- chips divisi ----------
const chipsEl = $('chips');
const chipDefs = [
  { id: 'overview', label: 'Seluruh kantor', color: '#1d2433' },
  ...DIVISIONS.map((d) => ({ id: d.id, label: d.name, color: d.color })),
  { id: 'pantry', label: 'Pantry', color: '#e08e5a' },
];
for (const c of chipDefs) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chip';
  b.dataset.id = c.id;
  b.style.setProperty('--c', c.color);
  b.innerHTML = c.id === 'overview' ? '' : '<span class="dot"></span>';
  b.append(c.label);
  b.addEventListener('click', () => goTo(c.id));
  chipsEl.appendChild(b);
}

function markChip(id) {
  for (const b of chipsEl.children) b.setAttribute('aria-pressed', String(b.dataset.id === id));
  const active = chipsEl.querySelector(`[aria-pressed="true"]`);
  active?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
}

function goTo(id) {
  if (selectedId) closeChat(false);
  if (id === 'overview') {
    stage.focus('overview');
    view = { kind: 'overview', id: null };
  } else if (id === 'pantry') {
    stage.focus('room', PITCH_X, PITCH_Z);
    view = { kind: 'pantry', id };
  } else {
    const r = rooms.get(id);
    stage.focus('room', r.center.x, r.center.z);
    view = { kind: 'room', id };
  }
  markChip(id);
  history.replaceState(null, '', location.pathname + location.search);
}

// ---------- panel chat ----------
function setInset() {
  if (!selectedId) return stage.setInset(0, 0);
  const el = $('panel');
  if (mobile.matches) stage.setInset(0, el.offsetHeight);
  else stage.setInset(el.offsetWidth + 24, 0);
}

function setStatus(id, status) {
  const c = byId.get(id);
  if (!c) return;
  clearTimeout(doneTimers.get(id));
  c.status = status;
  if (status === 'done') {
    doneTimers.set(id, setTimeout(() => { if (c.status === 'done') c.status = 'idle'; }, 5000));
  }
}

const panel = createPanel({
  onSelect: (id) => selectAgent(id),
  onClose: () => closeChat(true),
  onStatus: setStatus,
  onNeedCode: () => showGate('Kode akses salah atau belum diisi.'),
  isDemo: () => config.demo,
});

function selectAgent(id) {
  const agent = agentById(id);
  const c = byId.get(id);
  if (!agent || !c) return;
  if (selectedId && selectedId !== id) byId.get(selectedId).selected = false;

  selectedId = id;
  c.selected = true;
  c.wave();
  const div = divisionById(agent.division);

  document.body.classList.add('chatting');
  $('panel').setAttribute('aria-hidden', 'false');
  panel.open(id);
  const room = rooms.get(agent.division).center;
  stage.focus('agent', room.x + c.home.x, room.z + c.home.z + 0.9);
  stage.setRing(c, div.color);
  tags.setSelected(id);
  view = { kind: 'room', id: agent.division };
  markChip(agent.division);
  requestAnimationFrame(setInset);
  history.replaceState(null, '', `#${id}`);
}

function closeChat(refocus) {
  if (!selectedId) return;
  const c = byId.get(selectedId);
  const div = divisionById(c.agent.division);
  c.selected = false;
  selectedId = null;
  panel.close();
  document.body.classList.remove('chatting');
  $('panel').setAttribute('aria-hidden', 'true');
  $('banner').hidden = true;
  stage.setRing(null);
  tags.setSelected(null);
  stage.setInset(0, 0);
  if (refocus) {
    const r = rooms.get(div.id);
    stage.focus('room', r.center.x, r.center.z);
    history.replaceState(null, '', location.pathname + location.search);
  }
}

// ---------- input scene ----------
stage.onClick((id) => {
  if (id) selectAgent(id);
  else if (selectedId && mobile.matches) closeChat(true);
});
stage.onHover((id) => tags.setHovered(id));
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && selectedId) closeChat(true);
});
addEventListener('resize', () => requestAnimationFrame(setInset));
mobile.addEventListener?.('change', () => requestAnimationFrame(setInset));

// ---------- gate kode akses ----------
function showGate(msg) {
  $('gate').hidden = false;
  const err = $('gate-error');
  err.hidden = !msg;
  err.textContent = msg || '';
  setTimeout(() => $('gate-input').focus(), 50);
}

$('gate-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const code = $('gate-input').value.trim();
  if (!code) return;
  try {
    const r = await fetch('/api/verify', { headers: { 'x-access-code': code } });
    if (r.ok) {
      setCode(code);
      $('gate').hidden = true;
      $('gate-input').value = '';
      return;
    }
    showGate(r.status === 401 ? 'Kode salah.' : 'Server menolak. Coba lagi.');
  } catch {
    showGate('Tidak bisa menghubungi server.');
  }
});

// ---------- start ----------
(async function start() {
  const cfg = await fetchConfig();
  Object.assign(config, cfg);

  const banner = $('banner');
  if (config.offline) {
    banner.hidden = false;
    banner.textContent = 'Backend belum jalan. Jalankan "npm run dev" atau "npm start" agar chat bisa dipakai.';
  } else if (config.demo) {
    banner.textContent = 'Mode demo: server belum punya ANTHROPIC_API_KEY, jadi jawaban hanya contoh.';
  }
  banner.hidden = !(config.offline || (config.demo && selectedId));
  if (config.needsCode && !getCode()) showGate('');

  // buka karyawan dari URL, mis. https://office.devan.my.id/#rina
  const hash = decodeURIComponent(location.hash.slice(1));
  if (hash && byId.has(hash)) selectAgent(hash);
  else goTo('overview');

  const hide = () => {
    if (stage.frames < 3) return requestAnimationFrame(hide);
    $('loading').classList.add('gone');
    setTimeout(() => $('loading').remove(), 900);
  };
  hide();
})();

window.__kantor = { stage, selectAgent, goTo };
