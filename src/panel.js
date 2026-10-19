import { agentById, agentsOf, divisionById } from '../shared/roster.js';
import { renderMarkdown } from './md.js';
import { getHistory, setHistory, clearHistory, streamChat } from './chat.js';

const $ = (id) => document.getElementById(id);
const initials = (name) => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

export function createPanel({ onSelect, onClose, onStatus, onNeedCode, isDemo }) {
  const els = {
    avatar: $('avatar'),
    name: $('who-name'),
    role: $('who-role'),
    mates: $('mates'),
    messages: $('messages'),
    quick: $('quick'),
    form: $('composer'),
    input: $('input'),
    send: $('btn-send'),
    reset: $('btn-reset'),
    close: $('btn-close'),
  };

  let currentId = null;
  const live = new Map(); // agentId -> { text, el, abort }

  const scrollDown = (force = false) => {
    const m = els.messages;
    const near = m.scrollHeight - m.scrollTop - m.clientHeight < 140;
    if (force || near) m.scrollTop = m.scrollHeight;
  };

  function bubble(role, html, { text } = {}) {
    const wrap = document.createElement('div');
    wrap.className = `msg ${role}`;
    const b = document.createElement('div');
    b.className = 'bubble';
    if (role === 'user') b.textContent = text;
    else b.innerHTML = html;
    wrap.appendChild(b);
    if (role === 'assistant') {
      const tools = document.createElement('div');
      tools.className = 'tools';
      tools.innerHTML = '<button type="button" data-copy>Salin</button>';
      wrap.appendChild(tools);
    }
    return wrap;
  }

  const typingHtml = '<span class="typing" aria-label="Sedang mengetik"><i></i><i></i><i></i></span>';

  function paint(l) {
    if (!l.el) return;
    const b = l.el.querySelector('.bubble');
    b.innerHTML = l.text ? renderMarkdown(l.text) : typingHtml;
    scrollDown();
  }

  function renderEmpty(agent) {
    const first = agent.name.split(' ')[0];
    const e = document.createElement('div');
    e.className = 'empty';
    e.innerHTML = `<b>Halo, gue ${first}</b>${agent.role}. Tanya soal ${agent.focus}.`;
    els.messages.appendChild(e);
    els.quick.innerHTML = '';
    for (const q of agent.quick) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'q';
      btn.textContent = q;
      btn.addEventListener('click', () => submit(q));
      els.quick.appendChild(btn);
    }
  }

  function render(agentId) {
    const agent = agentById(agentId);
    const div = divisionById(agent.division);
    document.body.style.setProperty('--c', div.color);
    els.avatar.style.setProperty('--c', div.color);
    els.avatar.textContent = initials(agent.name);
    els.name.textContent = agent.name;
    els.role.textContent = `${agent.role} · ${div.name}`;

    // rekan satu divisi
    els.mates.innerHTML = '';
    const team = agentsOf(agent.division);
    if (team.length > 1) {
      for (const m of team) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'mate';
        b.style.setProperty('--c', div.color);
        b.setAttribute('aria-current', String(m.id === agentId));
        b.innerHTML = `<i>${initials(m.name)}</i>${m.name.split(' ')[0]}`;
        b.addEventListener('click', () => onSelect(m.id));
        els.mates.appendChild(b);
      }
    }

    els.messages.innerHTML = '';
    els.quick.innerHTML = '';
    const history = getHistory(agentId);
    const l = live.get(agentId);
    if (!history.length && !l) renderEmpty(agent);
    for (const m of history) {
      els.messages.appendChild(m.role === 'user' ? bubble('user', '', { text: m.content }) : bubble('assistant', renderMarkdown(m.content)));
    }
    if (l) {
      l.el = bubble('assistant', typingHtml);
      els.messages.appendChild(l.el);
      paint(l);
    }
    scrollDown(true);
    syncSend();
  }

  function syncSend() {
    const busy = live.has(currentId);
    els.send.disabled = busy || !els.input.value.trim();
    els.input.placeholder = busy ? `${agentById(currentId).name.split(' ')[0]} lagi ngetik…` : 'Tulis pesan…';
  }

  async function submit(text) {
    const id = currentId;
    text = (text || '').trim();
    if (!id || !text || live.has(id)) return;

    const history = getHistory(id);
    const sent = [...history, { role: 'user', content: text }];
    setHistory(id, sent);

    els.messages.querySelector('.empty')?.remove();
    els.quick.innerHTML = '';
    els.messages.appendChild(bubble('user', '', { text }));
    els.input.value = '';
    autosize();

    const l = { text: '', el: null, abort: new AbortController() };
    live.set(id, l);
    l.el = bubble('assistant', typingHtml);
    els.messages.appendChild(l.el);
    scrollDown(true);
    onStatus(id, 'working');
    syncSend();

    try {
      const full = await streamChat(id, sent, {
        signal: l.abort.signal,
        onText: (_t, all) => {
          l.text = all;
          if (!l.raf) {
            l.raf = requestAnimationFrame(() => {
              l.raf = 0;
              paint(l);
            });
          }
        },
      });
      setHistory(id, [...sent, { role: 'assistant', content: full }]);
      live.delete(id);
      if (l.el && currentId === id) l.el.querySelector('.bubble').innerHTML = renderMarkdown(full);
      onStatus(id, 'done');
    } catch (err) {
      live.delete(id);
      onStatus(id, 'idle');
      if (err.name === 'AbortError') {
        setHistory(id, sent.slice(0, -1));
      } else {
        // kembalikan teks ke kolom input supaya bisa dikirim ulang
        setHistory(id, sent.slice(0, -1));
        if (currentId === id) {
          l.el?.remove();
          const e = bubble('assistant', '');
          e.classList.add('error');
          e.querySelector('.bubble').textContent = err.message;
          e.querySelector('.tools')?.remove();
          els.messages.appendChild(e);
          els.input.value = text;
          autosize();
          scrollDown(true);
        }
        if (err.code === 401) onNeedCode();
      }
    } finally {
      if (currentId === id) syncSend();
    }
  }

  function autosize() {
    els.input.style.height = 'auto';
    els.input.style.height = `${Math.min(els.input.scrollHeight, 140)}px`;
  }

  // ---------- event ----------
  els.form.addEventListener('submit', (e) => {
    e.preventDefault();
    submit(els.input.value);
  });
  els.input.addEventListener('input', () => {
    autosize();
    syncSend();
  });
  els.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      submit(els.input.value);
    }
  });
  els.close.addEventListener('click', () => onClose());
  els.reset.addEventListener('click', () => {
    if (!currentId) return;
    live.get(currentId)?.abort.abort();
    clearHistory(currentId);
    render(currentId);
  });
  els.messages.addEventListener('click', (e) => {
    const copyCode = e.target.closest('.copy');
    const copyMsg = e.target.closest('[data-copy]');
    const flash = (btn, t) => {
      const old = btn.textContent;
      btn.textContent = t;
      setTimeout(() => { btn.textContent = old; }, 1200);
    };
    const write = async (text, btn) => {
      try {
        await navigator.clipboard.writeText(text);
        flash(btn, 'Tersalin');
      } catch {
        flash(btn, 'Gagal');
      }
    };
    if (copyCode) write(copyCode.parentElement.querySelector('code').textContent, copyCode);
    else if (copyMsg) write(copyMsg.closest('.msg').querySelector('.bubble').innerText, copyMsg);
  });

  return {
    open(agentId) {
      currentId = agentId;
      render(agentId);
      if (isDemo()) document.getElementById('banner').hidden = false;
      setTimeout(() => {
        if (matchMedia('(hover: hover)').matches) els.input.focus({ preventScroll: true });
      }, 350);
    },
    close() {
      currentId = null;
    },
    get current() {
      return currentId;
    },
  };
}
