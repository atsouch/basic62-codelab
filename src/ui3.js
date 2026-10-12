// ===== UI part 3: debugger and visualizations =====
const DBG = { view: 'vars', listMode: new Map() };
function renderDebugToolbar() {
  const tb = $('#dbgToolbar'); if (!tb) return;
  const act = runnerActive();
  const paused = act && S.runner.state === 'paused';
  for (const b of $$('button[data-step]', tb)) {
    const k = b.dataset.step;
    b.disabled = (k === 'back' && !(paused && S.runner.steps > 1)) || ((k === 'out') && !(paused && S.runner.stack.length > 1)) || (k === 'continue' && !paused);
  }
}
function buildDebugTab() {
  const tab = $('#tab-debug'); tab.innerHTML = '';
  const tb = h('div', { class: 'toolbar', id: 'dbgToolbar' },
    h('button', { class: 'btn tiny', 'data-step': 'into', title: 'F11', onclick: () => stepCmd('into') }, '↳ ' + T('into')),
    h('button', { class: 'btn tiny', 'data-step': 'over', title: 'F10', onclick: () => stepCmd('over') }, '⤼ ' + T('over')),
    h('button', { class: 'btn tiny', 'data-step': 'out', title: 'Shift+F11', onclick: () => stepCmd('out') }, '↰ ' + T('out')),
    h('button', { class: 'btn tiny', 'data-step': 'back', onclick: () => stepBack() }, '↶ ' + T('back')),
    h('button', { class: 'btn tiny', 'data-step': 'continue', title: 'F5', onclick: () => stepCmd('continue') }, '▶ ' + T('cont')),
    h('button', { class: 'btn tiny', 'data-step': 'cursor', onclick: () => stepCmd('cursor') }, '⇥ ' + T('toCursor')),
    h('span', { class: 'sep' }),
    h('label', null, h('input', { type: 'checkbox', id: 'chkAnimate', checked: S.animate || null, onchange: (e) => { S.animate = e.target.checked; } }), T('animate')),
    h('label', null, T('speed'), h('input', { type: 'range', min: 40, max: 1200, value: 1240 - S.delay, 'aria-label': T('speed'), oninput: (e) => { S.delay = 1240 - +e.target.value; } }))
  );
  const sub = h('div', { class: 'sub', role: 'group' });
  for (const [k, lab] of [['vars', 'vVars'], ['memory', 'vMemory'], ['trace', 'vTrace'], ['classes', 'vClasses'], ['flow', 'vFlow']])
    sub.append(h('button', { class: 'seg2', 'aria-pressed': String(DBG.view === k), onclick: () => { DBG.view = k; buildDebugTab(); } }, T(lab)));
  const grid = h('div', { class: 'dbgGrid' }, h('div', { id: 'dbgMain' }), h('div', { id: 'dbgSide' }));
  tab.append(tb, sub, grid);
  renderDebugToolbar();
  refreshDebug(true);
}
function refreshDebug(force) {
  if (currentTab !== 'debug' && !force) { DBG.dirty = true; return; }
  const main = $('#dbgMain'), side = $('#dbgSide'); if (!main) return;
  main.innerHTML = ''; side.innerHTML = '';
  const r = S.runner;
  try {
    if (DBG.view === 'vars') main.append(r ? renderVars(r) : h('div', { class: 'empty' }, T('noRun')));
    else if (DBG.view === 'memory') main.append(r ? renderMemory(r) : h('div', { class: 'empty' }, T('noRun')));
    else if (DBG.view === 'trace') main.append(renderTrace(r));
    else if (DBG.view === 'classes') main.append(renderClassDiagram());
    else if (DBG.view === 'flow') main.append(renderFlow());
  } catch (e) { main.append(h('div', { class: 'empty' }, String(e.message))); console.error(e); }
  side.append(renderStack(r), renderWatch(r), renderBreakpoints());
  renderDebugToolbar();
}
// ----- values -----
function prim(v) {
  if (v === null || v === undefined) return h('span', { class: 'val v-none' }, BL.kwName('nothing', ED));
  if (typeof v === 'string') return h('span', { class: 'val v-str' }, JSON.stringify(v));
  if (typeof v === 'boolean') return h('span', { class: 'val v-bool' }, BL.kwName(v ? 'true' : 'false', ED));
  if (BL.isNum(v)) return h('span', { class: 'val v-num' }, BL.show(v, ED));
  return null;
}
function isPrim(v) { return v === null || v === undefined || typeof v === 'string' || typeof v === 'boolean' || BL.isNum(v); }
function renderValue(v, ctx, depth) {
  depth = depth || 0;
  const p = prim(v); if (p) return p;
  if (v instanceof BL.Func || v instanceof BL.Builtin || v instanceof BL.Bound || v instanceof BL.Cls) return h('span', { class: 'val v-none' }, BL.show(v, ED));
  if (depth > 3) return h('span', { class: 'val' }, BL.show(v, ED, true).slice(0, 80));
  if (BL.isList(v)) {
    if (v.every(isPrim) && v.length <= 60) {
      const allNum = v.length > 0 && v.every(x => BL.isNum(x));
      const key = ctx && ctx.key;
      const mode = key && DBG.listMode.get(key) === 'bars' && allNum ? 'bars' : 'cells';
      const marks = new Map();
      if (ctx && ctx.markers) for (const [n, x] of ctx.markers) if (x >= 0 && x < v.length) { if (!marks.has(x)) marks.set(x, []); marks.get(x).push(n); }
      const wrap = h('div');
      if (mode === 'bars') {
        const max = Math.max(1, ...v.map(x => Math.abs(BL.nv(x))));
        wrap.append(h('div', { class: 'bars' }, v.map((x, i) => h('div', { class: 'bar' + (marks.has(i) ? ' marked' : ''), style: `height:${Math.max(3, Math.abs(BL.nv(x)) / max * 76)}px;width:${Math.max(14, Math.min(34, 400 / v.length))}px`, title: `[${i}] = ${BL.show(x, ED)}` },
          h('em', null, BL.show(x, ED)), h('span', null, marks.has(i) ? marks.get(i).join(',') : String(i))))));
        wrap.style.paddingBottom = '16px';
      } else {
        if (!v.length) wrap.append(h('span', { class: 'val v-none' }, '[ ]'));
        wrap.append(h('div', { class: 'cells' }, v.map((x, i) => h('div', { class: 'cell' + (marks.has(i) ? ' marked' : '') },
          h('span', { class: 'ix' }, String(i)), h('span', { class: 'cv' }, isPrim(x) ? (typeof x === 'string' ? JSON.stringify(x) : BL.show(x, ED)) : '…'),
          marks.size ? h('span', { class: 'mk' }, marks.has(i) ? marks.get(i).join(' ') : '') : null))));
      }
      if (allNum && key) wrap.append(h('button', { class: 'btn tiny ghost', onclick: () => { DBG.listMode.set(key, mode === 'bars' ? 'cells' : 'bars'); refreshDebug(); } }, mode === 'bars' ? T('cells') : T('bars')));
      return wrap;
    }
    return tree(v, depth);
  }
  if (BL.isDict(v)) {
    if ([...v.values()].every(isPrim) && v.size <= 30) {
      if (!v.size) return h('span', { class: 'val v-none' }, '{ }');
      return h('table', { class: 'dtable' }, [...v].map(([k, x]) => h('tr', null, h('td', null, BL.show(k, ED, true)), h('td', null, prim(x)))));
    }
    return tree(v, depth);
  }
  if (v instanceof BL.Obj) {
    const card = h('div', { class: 'objcard' }, h('div', { class: 'oh' }, v.cls.name + (v.native && v.cls.name === 'Network' ? ` (${v.native.devices.size} devices)` : '')));
    for (const [k, x] of v.attrs) card.append(h('div', { class: 'orow' }, h('b', null, k), isPrim(x) ? prim(x) : renderValue(x, null, depth + 1)));
    if (v.native && v.native.kind) card.append(h('div', { class: 'orow' }, h('b', null, 'control'), v.native.kind));
    return card;
  }
  return h('span', { class: 'val' }, BL.show(v, ED));
}
function tree(v, depth) {
  const label = BL.isList(v) ? `${BL.typeName(v, ED)} (${v.length})` : BL.isDict(v) ? `${BL.typeName(v, ED)} (${v.size})` : BL.show(v, ED);
  const d = h('details', { class: 'tree', open: depth < 1 || null }, h('summary', null, label));
  const kids = h('div', { class: 'kids' });
  const entries = BL.isList(v) ? v.slice(0, 50).map((x, i) => [String(i), x]) : [...v].slice(0, 50).map(([k, x]) => [BL.show(k, ED, true), x]);
  for (const [k, x] of entries) kids.append(h('div', { style: 'display:flex;gap:8px;align-items:flex-start' }, h('span', { class: 'mono small muted' }, k + ':'), renderValue(x, null, depth + 1)));
  if ((BL.isList(v) ? v.length : v.size) > 50) kids.append(h('div', { class: 'muted small' }, '…'));
  d.append(kids);
  return d;
}
function renderVars(r) {
  const out = h('div');
  const frames = r.stack.slice().reverse();
  frames.forEach((f, idx) => {
    const box = h('div', { class: 'frame' + (idx === 0 ? ' top' : '') }, h('div', { class: 'fh' }, h('span', null, f.name), h('span', { class: 'muted small' }, f.line ? T('line') + ' ' + f.line : '')));
    const markers = [];
    for (const [k, v] of f.vars) if (typeof v === 'number') markers.push([k, v]);
    let any = false;
    const sorted = [...f.vars];
    if (f.self) sorted.unshift([BL.kwName('self', ED), f.self]);
    for (const [k, v] of sorted) {
      if (v instanceof BL.Func || v instanceof BL.Cls) continue;
      any = true;
      const key = f.name + '|' + k;
      const snap = BL.show(v, ED, true);
      const prev = S.prevSnap.get(key);
      const changed = prev !== undefined && prev !== snap;
      S.prevSnap.set(key, snap);
      box.append(h('div', { class: 'vrow' + (changed ? ' changed' : '') }, h('span', { class: 'vn', title: k }, k), h('span', { class: 'vt' }, BL.typeName(v, ED)), h('div', null, renderValue(v, { key, markers: markers.filter(([n]) => n !== k) }))));
    }
    if (!any) box.append(h('div', { class: 'vrow' }, h('span', { class: 'muted small' }, '–')));
    out.append(box);
  });
  return out;
}
// ----- memory diagram -----
function renderMemory(r) {
  const NS = 'http://www.w3.org/2000/svg';
  const S_ = (tag, attrs, text) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text !== undefined) e.textContent = text; return e; };
  const heap = []; const ids = new Map();
  const isRef = (v) => BL.isList(v) || BL.isDict(v) || v instanceof BL.Obj;
  const reg = (v) => { if (!ids.has(v) && heap.length < 40) { ids.set(v, heap.length); heap.push(v); } return ids.get(v); };
  const frames = r.stack.slice().reverse();
  for (const f of frames) { if (f.self) reg(f.self); for (const [, v] of f.vars) if (isRef(v)) reg(v); }
  for (let i = 0; i < heap.length; i++) {
    const v = heap[i];
    const kids = BL.isList(v) ? v : BL.isDict(v) ? [...v.values()] : [...v.attrs.values()];
    for (const k of kids) if (isRef(k)) reg(k);
  }
  const RH = 20, FW = 230, HX = 330, HW = 250;
  const shortv = (v) => { const s = BL.show(v, ED, true); return s.length > 24 ? s.slice(0, 22) + '…' : s; };
  const svg = S_('svg', { role: 'img', 'aria-label': 'Memory diagram' });
  const defs = S_('defs', {}); const mk = S_('marker', { id: 'arr', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' });
  mk.append(S_('path', { d: 'M0,0 L10,5 L0,10 z', fill: '#2750D8' })); defs.append(mk); svg.append(defs);
  const arrows = [];
  let y = 26;
  svg.append(S_('text', { x: 10, y: 16, 'font-size': 12, fill: '#5B6778', 'font-weight': 700 }, T('callStack')));
  svg.append(S_('text', { x: HX, y: 16, 'font-size': 12, fill: '#5B6778', 'font-weight': 700 }, ED === 'es' ? 'Objetos en memoria' : 'Objects in memory'));
  for (const f of frames) {
    const rows = [...f.vars].filter(([, v]) => !(v instanceof BL.Func || v instanceof BL.Cls));
    if (f.self) rows.unshift([BL.kwName('self', ED), f.self]);
    const hh = 24 + Math.max(1, rows.length) * RH + 6;
    svg.append(S_('rect', { x: 10, y, width: FW, height: hh, rx: 6, fill: f === frames[0] ? '#FFF6CC' : '#F7F9FC', stroke: '#D8DEE8' }));
    svg.append(S_('text', { x: 20, y: y + 16, 'font-size': 12.5, 'font-weight': 700, fill: '#1B2430' }, f.name));
    rows.forEach(([k, v], i) => {
      const ry = y + 24 + i * RH + 14;
      svg.append(S_('text', { x: 20, y: ry, 'font-size': 12, class: 'mono', fill: '#1B2430' }, k));
      if (isRef(v) && ids.has(v)) { svg.append(S_('circle', { cx: FW - 6, cy: ry - 4, r: 4, fill: '#2750D8' })); arrows.push({ x1: FW - 6, y1: ry - 4, to: ids.get(v), from: 'frame' }); }
      else svg.append(S_('text', { x: 110, y: ry, 'font-size': 12, class: 'mono', fill: '#B4461B' }, shortv(v)));
    });
    y += hh + 12;
  }
  const leftH = y;
  const pos = [];
  let hy = 26;
  heap.forEach((v, i) => {
    const entries = BL.isList(v) ? v.map((x, j) => [String(j), x]) : BL.isDict(v) ? [...v].map(([k, x]) => [BL.show(k, ED, true), x]) : [...v.attrs].map(([k, x]) => [k, x]);
    const shown = entries.slice(0, 12);
    const hh = 24 + Math.max(1, shown.length) * RH + (entries.length > 12 ? RH : 0) + 6;
    pos[i] = { y: hy, h: hh };
    const title = BL.isList(v) ? `${BL.typeName(v, ED)} [${v.length}]` : BL.isDict(v) ? `${BL.typeName(v, ED)} {${v.size}}` : v.cls.name;
    svg.append(S_('rect', { x: HX, y: hy, width: HW, height: hh, rx: 6, fill: v instanceof BL.Obj ? '#F6F9FF' : '#FFFFFF', stroke: v instanceof BL.Obj ? '#BFD0EA' : '#D8DEE8' }));
    svg.append(S_('text', { x: HX + 10, y: hy + 16, 'font-size': 12.5, 'font-weight': 700, fill: v instanceof BL.Obj ? '#0E7490' : '#1B2430' }, title));
    shown.forEach(([k, x], j) => {
      const ry = hy + 24 + j * RH + 14;
      svg.append(S_('text', { x: HX + 10, y: ry, 'font-size': 11.5, class: 'mono', fill: '#5B6778' }, k));
      if (isRef(x) && ids.has(x)) { svg.append(S_('circle', { cx: HX + HW - 8, cy: ry - 4, r: 4, fill: '#2750D8' })); arrows.push({ x1: HX + HW - 8, y1: ry - 4, to: ids.get(x), from: 'heap' }); }
      else svg.append(S_('text', { x: HX + 90, y: ry, 'font-size': 11.5, class: 'mono', fill: '#B4461B' }, shortv(x)));
    });
    if (entries.length > 12) svg.append(S_('text', { x: HX + 10, y: hy + 24 + 12 * RH + 14, 'font-size': 11, fill: '#5B6778' }, `… ${entries.length - 12} more`));
    hy += hh + 12;
  });
  for (const a of arrows) {
    const t = pos[a.to]; if (!t) continue;
    let d;
    if (a.from === 'frame') { const x2 = HX, y2 = t.y + 14; d = `M${a.x1},${a.y1} C${a.x1 + 50},${a.y1} ${x2 - 50},${y2} ${x2},${y2}`; }
    else { const x2 = HX + HW, y2 = t.y + 14; const bend = HX + HW + 30 + Math.abs(a.y1 - y2) * 0.08; d = `M${a.x1},${a.y1} C${bend},${a.y1} ${bend},${y2} ${x2 + 2},${y2}`; }
    svg.append(S_('path', { d, fill: 'none', stroke: '#2750D8', 'stroke-width': 1.5, 'marker-end': 'url(#arr)', opacity: 0.85 }));
  }
  const H = Math.max(leftH, hy) + 10, Wd = HX + HW + 70;
  svg.setAttribute('viewBox', `0 0 ${Wd} ${H}`); svg.setAttribute('width', Wd); svg.setAttribute('height', H);
  if (!heap.length) svg.append(S_('text', { x: HX, y: 44, 'font-size': 12.5, fill: '#5B6778' }, ED === 'es' ? 'No hay listas, diccionarios ni objetos todavía.' : 'No lists, dictionaries or objects yet.'));
  return h('div', { class: 'tblWrap' }, svg);
}
// ----- trace -----
function renderTrace(r) {
  if (!r || !r.trace.length) return h('div', { class: 'empty' }, T('noTrace'));
  const cols = [];
  for (const row of r.trace) for (const k of Object.keys(row.vars)) if (!cols.includes(k) && cols.length < 12) cols.push(k);
  const rows = r.trace.slice(-300);
  const t = h('table', { class: 'trace' }, h('tr', null, h('th', null, ED === 'es' ? 'paso' : 'step'), h('th', null, T('line')), h('th', null, ED === 'es' ? 'marco' : 'frame'), cols.map(c => h('th', null, c))));
  const last = {};
  rows.forEach((row, i) => {
    const tr = h('tr', { class: i === rows.length - 1 ? 'cur' : '' }, h('td', null, String(row.step)), h('td', null, h('button', { class: 'linkbtn', onclick: () => editor.gotoLine(row.line, true) }, String(row.line))), h('td', null, row.frame));
    for (const c of cols) {
      const v = row.vars[c]; const k = row.frame + c;
      const chg = v !== undefined && last[k] !== undefined && last[k] !== v;
      if (v !== undefined) last[k] = v;
      tr.append(h('td', { class: chg ? 'chg' : '' }, v === undefined ? '' : v));
    }
    t.append(tr);
  });
  const wrap = h('div');
  wrap.append(h('div', { class: 'toolbar' }, h('span', { class: 'muted small' }, r.trace.length > 300 ? (ED === 'es' ? `Últimos 300 de ${r.trace.length} pasos` : `Last 300 of ${r.trace.length} steps`) : ''),
    h('button', { class: 'btn tiny', onclick: () => {
      const all = r.trace; const lines = [['step', 'line', 'frame', ...cols].join(',')];
      for (const row of all) lines.push([row.step, row.line, row.frame, ...cols.map(c => row.vars[c] === undefined ? '' : '"' + String(row.vars[c]).replace(/"/g, '""') + '"')].join(','));
      offerDownload((P.name || 'trace') + '-trace.csv', lines.join('\n'));
    } }, T('exportCsv'))));
  const tw = h('div', { class: 'tblWrap', style: 'max-height:100%' }, t);
  wrap.append(tw);
  setTimeout(() => { tw.scrollTop = tw.scrollHeight; const tb = $('#tab-debug'); if (tb) tb.scrollTop = tb.scrollHeight; }, 0);
  return wrap;
}
// ----- class diagram -----
function currentProg() { return S.prog && S.prog.src === editor.value ? S.prog : compile(true); }
function renderClassDiagram() {
  const prog = currentProg();
  if (!prog) return h('div', { class: 'empty' }, T('fixFirst'));
  if (!prog.classes.size) return h('div', { class: 'empty' }, T('noClasses'));
  const NS = 'http://www.w3.org/2000/svg';
  const S_ = (tag, attrs, text) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text !== undefined) e.textContent = text; return e; };
  const boxes = new Map();
  for (const [name, c] of prog.classes) boxes.set(name, { name, parent: c.parent, attrs: BL.selfAttrs(c.init), methods: [c.init ? BL.kwName('init', ED) + '(' + c.init.params.map(p => p.name).join(', ') + ')' : null, ...c.methods.map(m => m.name + '(' + m.params.map(p => p.name).join(', ') + ')')].filter(Boolean), native: false });
  for (const [, b] of [...boxes]) if (b.parent && !boxes.has(b.parent)) {
    const spec = BL.REG.classes.find(c => c.n.toLowerCase() === b.parent.toLowerCase() || (c.es && c.es.toLowerCase() === b.parent.toLowerCase()));
    boxes.set(b.parent, { name: b.parent, parent: null, attrs: spec ? (spec.attrs || []).map(a => BL.localMember(a.n, ED)) : [], methods: spec ? (spec.methods || []).map(m => BL.localMember(m.n, ED) + '(' + (m.p || '') + ')') : [], native: true });
  }
  const depth = (b) => { let d = 0, x = b; while (x.parent && boxes.has(x.parent) && d < 20) { x = boxes.get(x.parent); d++; } return d; };
  const levels = [];
  for (const b of boxes.values()) { const d = depth(b); (levels[d] = levels[d] || []).push(b); }
  const BW = 220, gapX = 30, gapY = 50;
  const svg = S_('svg', { role: 'img', 'aria-label': 'Class diagram' });
  let y = 10; let maxW = 0;
  const pos = new Map();
  levels.forEach((lv) => {
    let x = 10, rowH = 0;
    for (const b of lv) {
      const hh = 26 + Math.max(1, b.attrs.length) * 17 + 8 + Math.max(1, b.methods.length) * 17 + 8;
      pos.set(b.name, { x, y, h: hh }); rowH = Math.max(rowH, hh); x += BW + gapX;
    }
    maxW = Math.max(maxW, x); y += rowH + gapY;
  });
  for (const b of boxes.values()) {
    const p = pos.get(b.name);
    if (b.parent && pos.has(b.parent)) {
      const q = pos.get(b.parent);
      const x1 = p.x + BW / 2, y1 = p.y, x2 = q.x + BW / 2, y2 = q.y + q.h;
      svg.append(S_('path', { d: `M${x1},${y1} L${x1},${y1 - gapY / 2} L${x2},${y1 - gapY / 2} L${x2},${y2 + 10}`, fill: 'none', stroke: '#5B6778', 'stroke-width': 1.5 }));
      svg.append(S_('path', { d: `M${x2 - 8},${y2 + 12} L${x2},${y2} L${x2 + 8},${y2 + 12} Z`, fill: '#fff', stroke: '#5B6778', 'stroke-width': 1.5 }));
    }
  }
  for (const b of boxes.values()) {
    const p = pos.get(b.name);
    svg.append(S_('rect', { x: p.x, y: p.y, width: BW, height: p.h, rx: 6, fill: b.native ? '#F7F9FC' : '#F6F9FF', stroke: b.native ? '#98A2B3' : '#6E8CC9', 'stroke-dasharray': b.native ? '5 4' : 'none', 'stroke-width': 1.5 }));
    svg.append(S_('text', { x: p.x + BW / 2, y: p.y + 18, 'text-anchor': 'middle', 'font-size': 13.5, 'font-weight': 700, fill: '#0E7490' }, b.name + (b.native ? (ED === 'es' ? ' (incorporada)' : ' (built in)') : '')));
    let yy = p.y + 26;
    svg.append(S_('line', { x1: p.x, y1: yy, x2: p.x + BW, y2: yy, stroke: '#D8DEE8' }));
    (b.attrs.length ? b.attrs : ['–']).forEach((a, i) => svg.append(S_('text', { x: p.x + 10, y: yy + 14 + i * 17, 'font-size': 12, class: 'mono', fill: '#1B2430' }, a)));
    yy += Math.max(1, b.attrs.length) * 17 + 8;
    svg.append(S_('line', { x1: p.x, y1: yy, x2: p.x + BW, y2: yy, stroke: '#D8DEE8' }));
    (b.methods.length ? b.methods : ['–']).forEach((m, i) => svg.append(S_('text', { x: p.x + 10, y: yy + 14 + i * 17, 'font-size': 12, class: 'mono', fill: '#7C3AED' }, m.length > 28 ? m.slice(0, 27) + '…' : m)));
  }
  svg.setAttribute('viewBox', `0 0 ${maxW} ${y}`); svg.setAttribute('width', maxW); svg.setAttribute('height', y);
  return h('div', { class: 'tblWrap' }, svg);
}
// ----- flowchart -----
function renderFlow() {
  const prog = currentProg();
  if (!prog) return h('div', { class: 'empty' }, T('fixFirst'));
  const line = S.runner && runnerActive() ? S.runner.curLine : editor.caretLine;
  let target = null, title = T('mainProgram');
  const defs = BL.allDefs(prog);
  for (const d of defs) if (line >= d.def.line && line <= d.def.endLine) { target = d.def; title = d.label; }
  const stmts = target ? target.body : prog.body.filter(s => !['FuncDef', 'ClassDef', 'Test'].includes(s.k));
  const lines = prog.src.split('\n');
  const cur = S.runner && runnerActive() ? S.runner.curLine : -1;
  const NS = 'http://www.w3.org/2000/svg';
  const S_ = (tag, attrs, text) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text !== undefined) e.textContent = text; return e; };
  const trunc = (s) => (s.length > 34 ? s.slice(0, 33) + '…' : s);
  const lineText = (n) => trunc((lines[n - 1] || '').trim());
  const GAP = 22;
  const g = S_('g', {});
  const arrow = (x1, y1, x2, y2) => g.append(S_('path', { d: `M${x1},${y1} L${x2},${y2}`, stroke: '#5B6778', fill: 'none', 'stroke-width': 1.3, 'marker-end': 'url(#fa)' }));
  const poly = (pts) => g.append(S_('path', { d: 'M' + pts.map(p => p.join(',')).join(' L'), stroke: '#5B6778', fill: 'none', 'stroke-width': 1.3, 'marker-end': 'url(#fa)' }));
  const label = (x, y, t) => g.append(S_('text', { x, y, 'font-size': 11, fill: '#5B6778' }, t));
  const textW = (t) => Math.max(90, t.length * 7 + 26);
  function box(text, ln, shape) {
    const w = textW(text), hh = 30;
    return { w, h: hh, draw(x, y) {
      const fill = ln === cur ? '#FFE58A' : shape === 'term' ? '#EEF3FF' : '#FFFFFF';
      if (shape === 'term') g.append(S_('rect', { x: x - w / 2, y, width: w, height: hh, rx: 15, fill, stroke: '#6E8CC9' }));
      else g.append(S_('rect', { x: x - w / 2, y, width: w, height: hh, rx: 4, fill, stroke: '#98A2B3' }));
      g.append(S_('text', { x, y: y + 19, 'text-anchor': 'middle', 'font-size': 12, class: 'mono', fill: '#1B2430' }, text));
      return y + hh;
    } };
  }
  function diamond(text, ln) {
    const w = Math.max(130, text.length * 6.6 + 50), hh = 46;
    return { w, h: hh, draw(x, y) {
      g.append(S_('path', { d: `M${x},${y} L${x + w / 2},${y + hh / 2} L${x},${y + hh} L${x - w / 2},${y + hh / 2} Z`, fill: ln === cur ? '#FFE58A' : '#FDF8EC', stroke: '#C9A24A' }));
      g.append(S_('text', { x, y: y + hh / 2 + 4, 'text-anchor': 'middle', 'font-size': 11.5, class: 'mono', fill: '#1B2430' }, text));
      return y + hh;
    } };
  }
  function seq(list) {
    const parts = list.map(node);
    const w = Math.max(100, ...parts.map(p => p.w)); const hh = parts.reduce((s, p) => s + p.h, 0) + Math.max(0, parts.length - 1) * GAP;
    return { w, h: hh || 0, empty: !parts.length, draw(x, y) { let yy = y; parts.forEach((p, i) => { if (i) { arrow(x, yy, x, yy + GAP); yy += GAP; } yy = p.draw(x, yy); }); return yy; } };
  }
  function node(s) {
    switch (s.k) {
      case 'If': {
        const b0 = s.branches[0];
        const d = diamond(trunc(b0.cond.src) + ' ?', b0.line);
        const thenB = seq(b0.body);
        let elseStmts = s.elseBody || [];
        if (s.branches.length > 1) elseStmts = [{ k: 'If', branches: s.branches.slice(1), elseBody: s.elseBody, line: s.branches[1].line }];
        const elseB = seq(elseStmts);
        const colW = Math.max(thenB.w, 100), colE = Math.max(elseB.w, 60);
        const w = Math.max(d.w + 60, colW + colE + 40); const hh = d.h + 26 + Math.max(thenB.h, elseB.h) + 30;
        return { w, h: hh, draw(x, y) {
          const lx = Math.min(x - d.w / 2 - 10, x - w / 2 + colW / 2), rx = Math.max(x + d.w / 2 + 10, x + w / 2 - colE / 2);
          const yd = d.draw(x, y);
          const mid = y + d.h / 2;
          poly([[x - d.w / 2, mid], [lx, mid], [lx, yd + 26]]); label(lx + 4, mid - 4, ED === 'es' ? 'sí' : 'yes');
          const endL = thenB.empty ? yd + 26 : thenB.draw(lx, yd + 26);
          poly([[x + d.w / 2, mid], [rx, mid], [rx, yd + 26]]); label(rx - 20, mid - 4, 'no');
          const endR = elseB.empty ? yd + 26 : elseB.draw(rx, yd + 26);
          const bottom = y + hh - 8;
          poly([[lx, endL], [lx, bottom], [x - 4, bottom]]); poly([[rx, endR], [rx, bottom], [x + 4, bottom]]);
          return bottom;
        } };
      }
      case 'While': case 'For': case 'ForEach': case 'Repeat': {
        const txt = s.k === 'While' ? s.cond.src + ' ?' : lineText(s.line);
        const d = diamond(trunc(txt), s.line);
        const body = seq(s.body);
        const w = Math.max(d.w, body.w) + 90; const hh = d.h + 24 + body.h + 40;
        return { w, h: hh, draw(x, y) {
          const yd = d.draw(x, y);
          arrow(x, yd, x, yd + 24); label(x + 5, yd + 14, ED === 'es' ? 'sí' : 'yes');
          const yb = body.empty ? yd + 24 : body.draw(x, yd + 24);
          const lx = x - Math.max(d.w, body.w) / 2 - 22;
          poly([[x, yb], [x, yb + 14], [lx, yb + 14], [lx, y + d.h / 2], [x - d.w / 2, y + d.h / 2]]);
          const rx = x + Math.max(d.w, body.w) / 2 + 22;
          const bottom = y + hh - 4;
          poly([[x + d.w / 2, y + d.h / 2], [rx, y + d.h / 2], [rx, bottom], [x + 4, bottom]]); label(x + d.w / 2 + 4, y + d.h / 2 - 4, 'no');
          return bottom;
        } };
      }
      case 'Try': {
        const a = box(BL.kwName('try', ED), s.line), b = seq(s.body), c = box(BL.kwName('on_error', ED), s.line), dd = seq(s.handler);
        return seqNodes([a, b, c, dd]);
      }
      case 'Return': case 'Break': case 'Continue': case 'Fail': return box(lineText(s.line), s.line, 'term');
      default: return box(lineText(s.line), s.line);
    }
  }
  function seqNodes(parts) {
    parts = parts.filter(p => !p.empty);
    const w = Math.max(...parts.map(p => p.w)); const hh = parts.reduce((s, p) => s + p.h, 0) + (parts.length - 1) * GAP;
    return { w, h: hh, draw(x, y) { let yy = y; parts.forEach((p, i) => { if (i) { arrow(x, yy, x, yy + GAP); yy += GAP; } yy = p.draw(x, yy); }); return yy; } };
  }
  const start = box(target ? (target.isInit ? BL.kwName('init', ED) : target.name) + '(' + target.params.map(p => p.name).join(', ') + ')' : (ED === 'es' ? 'inicio' : 'start'), target ? target.line : 0, 'term');
  const end = box(ED === 'es' ? 'fin' : 'end', target ? target.endLine : 0, 'term');
  const all = seqNodes([start, seq(stmts), end]);
  const Wd = all.w + 80; const x0 = Wd / 2;
  const endY = all.draw(x0, 10);
  const svg = S_('svg', { role: 'img', 'aria-label': 'Flowchart' });
  const svgDefs = S_('defs', {}); const mk = S_('marker', { id: 'fa', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' });
  mk.append(S_('path', { d: 'M0,0 L10,5 L0,10 z', fill: '#5B6778' })); svgDefs.append(mk); svg.append(svgDefs, g);
  svg.setAttribute('viewBox', `0 0 ${Wd} ${endY + 20}`); svg.setAttribute('width', Wd); svg.setAttribute('height', endY + 20);
  return h('div', null, h('div', { class: 'muted small', style: 'margin-bottom:6px' }, T('flowFor') + ' ', h('code', null, title), ED === 'es' ? '. Mueve el cursor a otra función para ver la suya.' : '. Move the cursor into another function to see its flowchart.'), h('div', { class: 'tblWrap' }, svg));
}
// ----- side panels -----
function renderStack(r) {
  const box = h('div', { class: 'box stack', style: 'margin-bottom:10px' }, h('h4', null, T('callStack')));
  if (!r) { box.append(h('div', { class: 'muted small' }, '–')); return box; }
  r.stack.slice().reverse().forEach((f, i) => box.append(h('div', { class: 'sf' + (i === 0 ? ' top' : '') }, h('button', { class: 'linkbtn', onclick: () => editor.gotoLine(f.line || 1, true) }, f.name), h('span', { class: 'muted' }, f.line ? `  ${T('line')} ${f.line}` : ''))));
  return box;
}
function renderWatch(r) {
  const box = h('div', { class: 'box', style: 'margin-bottom:10px' }, h('h4', null, T('watch')));
  const inp = h('input', { type: 'text', class: 'mono', placeholder: T('watchPh'), style: 'flex:1;border:1px solid var(--line);border-radius:6px;padding:3px 6px;min-width:0', 'aria-label': T('watch') });
  const add = () => { const v = inp.value.trim(); if (!v) return; P.watches.push(v); saveSoon(); refreshDebug(); };
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') add(); });
  for (const [i, w] of P.watches.entries()) {
    let val;
    if (r && (r.state === 'paused' || r.state === 'done' || r.state === 'events' || r.state === 'error' || r.state === 'guard')) {
      try { const v = r.evalWatch(w); val = h('span', { class: 'val' }, BL.show(v, ED, true)); }
      catch (e) { val = h('span', { class: 'muted small' }, BL.errText(e, ED)); }
    } else val = h('span', { class: 'muted small' }, '–');
    box.append(h('div', { class: 'watchRow' }, h('code', null, w), val, h('span', { class: 'grow' }), h('button', { class: 'btn tiny ghost', 'aria-label': T('remove'), onclick: () => { P.watches.splice(i, 1); saveSoon(); refreshDebug(); } }, '×')));
  }
  box.append(h('div', { style: 'display:flex;gap:6px;margin-top:6px' }, inp, h('button', { class: 'btn tiny', onclick: add }, T('addWatch'))));
  return box;
}
function renderBreakpoints() {
  const box = h('div', { class: 'box' }, h('h4', null, T('breakpoints')));
  const keys = Object.keys(P.breakpoints).map(Number).sort((a, b) => a - b);
  if (!keys.length) box.append(h('div', { class: 'muted small' }, T('noBps')));
  for (const l of keys) {
    const bp = P.breakpoints[l] || {};
    const inp = h('input', { type: 'text', class: 'mono', value: bp.src || '', placeholder: T('condPh'), style: 'flex:1;min-width:0;border:1px solid var(--line);border-radius:6px;padding:2px 6px;font-size:12px', 'aria-label': 'Condition for line ' + l });
    inp.addEventListener('change', () => { P.breakpoints[l] = inp.value.trim() ? { src: inp.value.trim() } : {}; applyBreakpoints(); });
    box.append(h('div', { class: 'watchRow' }, h('button', { class: 'linkbtn', onclick: () => editor.gotoLine(l, true) }, T('goLine', { n: l })), inp, h('button', { class: 'btn tiny ghost', 'aria-label': T('remove'), onclick: () => { delete P.breakpoints[l]; applyBreakpoints(); refreshDebug(); } }, '×')));
  }
  return box;
}
function applyBreakpoints() {
  editor.bps = new Map(Object.keys(P.breakpoints).map(k => [+k, P.breakpoints[k]]));
  editor.paintGutter();
  if (S.runner) S.runner.breakpoints = bpMap();
  saveSoon();
}
