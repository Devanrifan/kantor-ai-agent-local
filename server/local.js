// Model lokal (llama.cpp / LM Studio / Ollama / llamafile) lewat API OpenAI-compatible.
// Dipakai bila MODEL_LEADER / MODEL_TEAM diawali "local:", contoh: local:qwen3-8b
export const isLocal = (model = '') => String(model).startsWith('local:');

const cfg = () => ({
  base: (process.env.LOCAL_LLM_URL || 'http://127.0.0.1:8080/v1').replace(/\/$/, ''),
  key: process.env.LOCAL_LLM_KEY || '',
  noThink: process.env.LOCAL_NO_THINK !== '0',
});
export const localBase = () => cfg().base;

// Buang blok <think>...</think> (mode thinking Qwen3) dari stream, termasuk tag yang terpotong antar potongan.
function thinkFilter() {
  let inThink = false;
  let buf = '';
  const OPEN = '<think>';
  const CLOSE = '</think>';
  const partial = (s, tag) => {
    for (let n = Math.min(tag.length - 1, s.length); n > 0; n -= 1) if (tag.startsWith(s.slice(-n))) return n;
    return 0;
  };
  return {
    push(chunk) {
      buf += chunk;
      let out = '';
      for (;;) {
        if (inThink) {
          const i = buf.indexOf(CLOSE);
          if (i < 0) { buf = buf.slice(Math.max(0, buf.length - (CLOSE.length - 1))); return out; }
          buf = buf.slice(i + CLOSE.length).replace(/^\s+/, '');
          inThink = false;
        } else {
          const i = buf.indexOf(OPEN);
          if (i >= 0) { out += buf.slice(0, i); buf = buf.slice(i + OPEN.length); inThink = true; continue; }
          const keep = partial(buf, OPEN);
          out += buf.slice(0, buf.length - keep);
          buf = buf.slice(buf.length - keep);
          return out;
        }
      }
    },
    flush() { const r = inThink ? '' : buf; buf = ''; return r; },
  };
}

// messages: [{role, content:string}] (format yang sama dengan server). Mengembalikan { input, output } token.
export async function streamLocal({ model, system, messages, maxTokens = 1500, signal, onText }) {
  const c = cfg();
  const msgs = [{ role: 'system', content: system }, ...messages];
  if (c.noThink) { // matikan mode thinking supaya cepat
    for (let i = msgs.length - 1; i >= 0; i -= 1) {
      if (msgs[i].role === 'user') { msgs[i] = { ...msgs[i], content: `${msgs[i].content} /no_think` }; break; }
    }
  }
  let res;
  try {
    res = await fetch(`${c.base}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(c.key ? { authorization: `Bearer ${c.key}` } : {}) },
      body: JSON.stringify({ model: model.slice('local:'.length) || 'local', messages: msgs, max_tokens: maxTokens, stream: true, stream_options: { include_usage: true }, temperature: 0.6 }),
      signal,
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw Object.assign(new Error(`Server model lokal tidak bisa dihubungi di ${c.base}. Pastikan llama-server / LM Studio sedang jalan.`), { local: true });
  }
  if (!res.ok) {
    const body = (await res.text().catch(() => '')).slice(0, 200);
    throw Object.assign(new Error(`Model lokal membalas HTTP ${res.status}: ${body}`), { local: true });
  }

  const usage = { input: 0, output: 0 };
  const f = thinkFilter();
  const dec = new TextDecoder();
  let buf = '';
  const reader = res.body.getReader();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      let j;
      try { j = JSON.parse(data); } catch { continue; }
      if (j.usage) { usage.input = j.usage.prompt_tokens || 0; usage.output = j.usage.completion_tokens || 0; }
      const t = j.choices?.[0]?.delta?.content;
      if (t) { const vis = f.push(t); if (vis) onText(vis); }
    }
  }
  const rest = f.flush();
  if (rest) onText(rest);
  return usage;
}
