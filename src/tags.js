import * as THREE from 'three';

// Tag nama (DOM) yang mengikuti kepala tiap karakter.
export function createTags(stage, container) {
  const items = new Map();
  const v = new THREE.Vector3();

  for (const c of stage.office.chars) {
    const el = document.createElement('div');
    el.className = 'tag';
    el.innerHTML = '<span class="s"></span><span class="n"></span><small></small><span class="st"></span>';
    el.querySelector('.n').textContent = c.agent.name;
    el.querySelector('small').textContent = c.agent.role;
    container.appendChild(el);
    const single = stage.office.chars.filter((x) => x.agent.division === c.agent.division).length === 1;
    items.set(c.agent.id, { c, el, st: el.querySelector('.st'), last: '', single });
  }

  let hoveredId = null;
  let selectedId = null;

  stage.onFrame(() => {
    const { w, h } = stage.size;
    const zoom = stage.zoom;
    const showAll = zoom >= 1.15;
    const showHeads = zoom >= 0.5;

    for (const [id, it] of items) {
      const { c, el } = it;
      const head = c.agent.leader;
      const single = it.single;
      const active = c.status !== 'idle' || id === hoveredId || id === selectedId;
      const visible = active || showAll || (showHeads && (head || single));

      c.headAnchor(v);
      v.project(stage.camera);
      const x = (v.x * 0.5 + 0.5) * w;
      const y = (-v.y * 0.5 + 0.5) * h;
      const inView = v.z > -1 && v.z < 1 && x > -80 && x < w + 80 && y > -40 && y < h + 40;

      const state = `${visible && inView ? 1 : 0}|${c.status}|${id === selectedId ? 1 : 0}`;
      if (state !== it.last) {
        it.last = state;
        el.classList.toggle('on', visible && inView);
        el.classList.toggle('working', c.status === 'working');
        el.classList.toggle('done', c.status === 'done');
        el.classList.toggle('selected', id === selectedId);
        it.st.textContent = c.status === 'working' ? 'mengetik…' : c.status === 'done' ? 'selesai' : '';
      }
      if (visible && inView) {
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
      }
    }
  });

  return {
    setHovered(id) { hoveredId = id; },
    setSelected(id) { selectedId = id; },
  };
}
