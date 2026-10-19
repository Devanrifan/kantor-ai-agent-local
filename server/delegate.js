// Delegasi: leader memecah tugas -> anggota tim mengerjakan -> leader mereview & merangkum.
// Deterministik (dikendalikan server), jadi tidak bergantung pada tool-calling model kecil.
import { agentsOf } from '../shared/roster.js';
import { buildSystemPrompt } from './prompts.js';

const MAX_TASKS = 3;
const TRIGGER = /(\/tim\b|delegasi|delegasikan|delegate|suruh (tim|anak buah)|minta (tim|anak buah)|kerjakan (sama|bareng|oleh) tim|tugasin (ke )?(tim|anak buah)|libatkan tim)/i;

export const wantsDelegation = (text) => TRIGGER.test(text || '');

function planPrompt(team) {
  return [
    'MODE DELEGASI. Pecah permintaan user menjadi 1 sampai ' + MAX_TASKS + ' tugas untuk anggota timmu.',
    'Anggota tim yang bisa diberi tugas:',
    ...team.map((m) => `- ${m.id}: ${m.name}, ${m.role} (${m.focus})`),
    'Balas HANYA dengan JSON valid, tanpa teks lain, tanpa tanda ```. Format:',
    '{"tugas":[{"agent":"<id>","brief":"instruksi singkat dan spesifik untuk anggota itu"}]}',
    'Satu anggota maksimal satu tugas. Pilih hanya anggota yang benar-benar relevan.',
  ].join('\n');
}

export function parsePlan(text, team) {
  const m = String(text || '').match(/\{[\s\S]*\}/);
  if (!m) return [];
  let obj;
  try { obj = JSON.parse(m[0]); } catch { return []; }
  const ids = new Set(team.map((t) => t.id));
  const seen = new Set();
  const out = [];
  for (const t of Array.isArray(obj?.tugas) ? obj.tugas : []) {
    const id = String(t?.agent || '').toLowerCase().trim();
    const brief = String(t?.brief || '').trim().slice(0, 600);
    if (!ids.has(id) || !brief || seen.has(id)) continue;
    seen.add(id);
    out.push({ member: team.find((x) => x.id === id), brief });
    if (out.length >= MAX_TASKS) break;
  }
  return out;
}

// run({ model, system, messages, maxTokens, onText }) -> Promise (disediakan index.js)
export async function delegate({ leader, messages, run, modelFor, maxTokens, send, isClosed }) {
  const team = agentsOf(leader.division).filter((a) => !a.leader);
  const userMsg = messages[messages.length - 1].content.replace(TRIGGER, '').trim() || messages[messages.length - 1].content;

  // 1) Rencana (tidak ditampilkan mentah)
  send({ t: `🧭 **${leader.name.split(' ')[0]}** lagi memecah tugas...\n\n` });
  let planText = '';
  await run({
    model: modelFor(leader),
    system: buildSystemPrompt(leader) + '\n\n' + planPrompt(team),
    messages: [{ role: 'user', content: userMsg }],
    maxTokens: 300,
    onText: (t) => { planText += t; },
  });
  const plan = parsePlan(planText, team);

  if (!plan.length) {
    send({ t: '_Tidak ada yang perlu didelegasikan, gue kerjain sendiri._\n\n' });
    await run({ model: modelFor(leader), system: buildSystemPrompt(leader), messages, maxTokens, onText: (t) => send({ t }) });
    return;
  }

  // 2) Anggota tim mengerjakan (berurutan; model lokal hanya satu slot)
  const results = [];
  for (const { member, brief } of plan) {
    if (isClosed()) return;
    send({ t: `\n---\n### 👤 ${member.name.split(' ')[0]} (${member.role})\n_Tugas: ${brief}_\n\n` });
    let out = '';
    await run({
      model: modelFor(member),
      system: buildSystemPrompt(member),
      messages: [{ role: 'user', content: `Tugas dari ${leader.name.split(' ')[0]} (leader):\n${brief}\n\nKonteks permintaan asli user:\n${userMsg}` }],
      maxTokens,
      onText: (t) => { out += t; send({ t }); },
    });
    results.push({ member, brief, out: out.trim() });
  }

  // 3) Leader mereview dan merangkum
  if (isClosed()) return;
  send({ t: `\n---\n### 🧑‍💼 Review ${leader.name.split(' ')[0]}\n\n` });
  const bundle = results.map((r) => `## ${r.member.name} (${r.member.role})\nTugas: ${r.brief}\nHasil:\n${r.out}`).join('\n\n');
  await run({
    model: modelFor(leader),
    system: buildSystemPrompt(leader),
    messages: [{
      role: 'user',
      content: `Permintaan user:\n${userMsg}\n\nHasil kerja anggota timmu:\n${bundle}\n\nReview singkat sebagai leader: apa yang sudah bagus, apa yang lemah, lalu tulis versi final yang digabung dan siap dipakai. Ringkas.`,
    }],
    maxTokens,
    onText: (t) => send({ t }),
  });
}
