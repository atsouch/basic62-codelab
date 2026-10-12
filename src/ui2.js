// ===== UI part 2: stage host and run control =====
const WHY = {
  E101: ['Every block that opens (IF, WHILE, FOR, FUNCTION...) must be closed with END and the same word, so the computer knows exactly where the block stops.', 'Cada bloque que se abre (SI, MIENTRAS, PARA, FUNCIÓN...) debe cerrarse con FIN y la misma palabra, para que el ordenador sepa dónde termina.'],
  E106: ['IF lines always end with THEN. It separates the question from what happens when the answer is TRUE.', 'Las líneas SI siempre terminan con ENTONCES. Separa la pregunta de lo que pasa cuando la respuesta es VERDADERO.'],
  E107: ['= means "store this value", == means "are these equal?". A condition must ask a question, so it needs ==.', '= significa "guarda este valor" y == significa "¿son iguales?". Una condición hace una pregunta, así que necesita ==.'],
  E201: ['A name must exist before it is used: create it with =, as a FUNCTION or CLASS, or as a parameter. Names are case-sensitive, so Score and score are different.', 'Un nombre debe existir antes de usarse: créalo con =, como FUNCIÓN o CLASE, o como parámetro. Se distinguen mayúsculas y minúsculas: Nota y nota son distintos.'],
  E202: ['Text and numbers are different types. "5" + 5 is unclear: should it be 10 or "55"? Convert one of them with text() or whole() so the meaning is clear.', 'El texto y los números son tipos distintos. ¿"5" + 5 es 10 o "55"? Convierte uno con texto() o entero() para que quede claro.'],
  E204: ['List positions start at 0, so a list of 3 items has positions 0, 1 and 2. The last position is length(list) - 1.', 'Las posiciones de una lista empiezan en 0: una lista de 3 elementos tiene las posiciones 0, 1 y 2. La última es longitud(lista) - 1.'],
  E205: ['A dictionary only has the keys you put in it. Use IN to check first, or .get(key, default).', 'Un diccionario solo tiene las claves que le pusiste. Comprueba antes con EN, o usa .obtener(clave, valor_por_defecto).'],
  E206: ['All the attributes of an object are created in INIT. That keeps every object of a class the same shape and catches typing mistakes.', 'Todos los atributos de un objeto se crean en INICIAR. Así todos los objetos de una clase tienen la misma forma y se detectan errores de escritura.'],
  E211: ['A function gets information through its parameters and gives results back with RETURN. It can read global variables but not change them, so every change is visible where the function is called.', 'Una función recibe información por sus parámetros y devuelve resultados con DEVOLVER. Puede leer variables globales pero no cambiarlas, así cada cambio se ve donde se llama la función.'],
  E212: ['A function that never reaches RETURN gives back NOTHING. If you use its result, make sure every path ends with RETURN and a value.', 'Una función que no llega a DEVOLVER da NADA. Si usas su resultado, asegúrate de que todos los caminos terminan con DEVOLVER y un valor.'],
  E213: ['Each call waits for the call inside it. A recursive function needs a stopping case that does not call itself, or the calls never end.', 'Cada llamada espera a la llamada que tiene dentro. Una función recursiva necesita un caso de parada que no se llame a sí misma.'],
  E210: ['Dividing by zero has no answer. Check the divisor with IF before dividing.', 'Dividir entre cero no tiene respuesta. Comprueba el divisor con SI antes de dividir.'],
  E215: ['Conversion only works when the text looks like the kind of value you want. Check it first, for example with .is_digits(), or use TRY.', 'La conversión solo funciona si el texto parece el tipo de valor que quieres. Compruébalo antes, por ejemplo con .es_digitos(), o usa INTENTAR.'],
  E225: ['Numbers compare with numbers and text compares with text (alphabetically). Convert one side so both are the same type.', 'Los números se comparan con números y el texto con texto (alfabéticamente). Convierte un lado para que ambos sean del mismo tipo.'],
  E230: ['Conditions must be TRUE or FALSE. Write a comparison such as x > 0 or name != "".', 'Las condiciones deben ser VERDADERO o FALSO. Escribe una comparación como x > 0 o nombre != "".'],
  E231: ['A loop only stops when its condition changes. Check that something inside the loop moves it towards the end.', 'Un bucle solo termina cuando su condición cambia. Comprueba que algo dentro del bucle lo acerca al final.']
};
WHY.E102 = WHY.E101; WHY.E108 = WHY.E101; WHY.E109 = WHY.E101;

// ----- canvas host -----
const G = { cv: null, ctx: null, tc: null, tctx: null, turtle: { x: 0, y: 0, h: 0, v: true }, mouse: { x: 0, y: 0 }, anim: 0 };
function initCanvas() {
  G.cv = $('#cv'); G.ctx = G.cv.getContext('2d'); G.tc = $('#cvT'); G.tctx = G.tc.getContext('2d');
  G.ctx.setTransform(2, 0, 0, 2, 0, 0); G.tctx.setTransform(2, 0, 0, 2, 0, 0);
  G.cv.addEventListener('mousemove', (e) => {
    const r = G.cv.getBoundingClientRect();
    G.mouse.x = Math.round((e.clientX - r.left) / r.width * 600 - 300); G.mouse.y = Math.round(200 - (e.clientY - r.top) / r.height * 400);
    $('#mousePos').textContent = `x ${G.mouse.x}, y ${G.mouse.y}`;
  });
  G.cv.addEventListener('mouseleave', () => { $('#mousePos').textContent = ''; });
  clearCanvas();
}
const cx = (x) => 300 + x, cy = (y) => 200 - y;
function showCanvas(on) { $('#canvasWrap').classList.toggle('off', on === false); }
function clearCanvas() { cancelAnimationFrame(G.anim); G.ctx.clearRect(0, 0, 600, 400); G.tctx.clearRect(0, 0, 600, 400); G.cv.setAttribute('aria-label', 'Drawing canvas'); G.turtle = { x: 0, y: 0, h: 0, v: true }; drawTurtle(); }
function drawTurtle() {
  const t = G.turtle, c = G.tctx;
  c.clearRect(0, 0, 600, 400);
  if (!t.v) return;
  c.save(); c.translate(cx(t.x), cy(t.y)); c.rotate(t.h * Math.PI / 180);
  c.beginPath(); c.moveTo(12, 0); c.lineTo(-7, -7); c.lineTo(-3, 0); c.lineTo(-7, 7); c.closePath();
  c.fillStyle = '#1B2430'; c.globalAlpha = 0.85; c.fill(); c.restore();
}
const gfx = {
  line(x1, y1, x2, y2, color, size) { showCanvas(); const c = G.ctx; c.strokeStyle = color; c.lineWidth = size; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx(x1), cy(y1)); c.lineTo(cx(x2), cy(y2)); c.stroke(); },
  circle(x, y, r, stroke, fill, size) { showCanvas(); const c = G.ctx; c.beginPath(); c.arc(cx(x), cy(y), r, 0, Math.PI * 2); if (fill) { c.fillStyle = fill; c.fill(); } c.strokeStyle = stroke; c.lineWidth = size; c.stroke(); },
  rect(x, y, w, hh, stroke, fill, size) { showCanvas(); const c = G.ctx; if (fill) { c.fillStyle = fill; c.fillRect(cx(x), cy(y), w, hh); } c.strokeStyle = stroke; c.lineWidth = size; c.strokeRect(cx(x), cy(y), w, hh); },
  text(x, y, s, color) { showCanvas(); const c = G.ctx; c.fillStyle = color; c.font = '15px "Atkinson Hyperlegible", sans-serif'; c.textBaseline = 'alphabetic'; c.fillText(s, cx(x), cy(y)); },
  clear() { showCanvas(); cancelAnimationFrame(G.anim); G.ctx.clearRect(0, 0, 600, 400); drawTurtle(); },
  turtle(x, y, h, v) { showCanvas(); G.turtle = { x, y, h, v }; drawTurtle(); },
  chart(spec) { showCanvas(); drawChart(spec); },
  network(spec) { showCanvas(); drawNetwork(spec); }
};
function niceTicks(lo, hi, n) {
  if (lo === hi) { lo -= 1; hi += 1; }
  const span = hi - lo; const step0 = span / n; const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const step = [1, 2, 5, 10].map(m => m * mag).find(s => span / s <= n) || mag * 10;
  const out = []; const top = Math.ceil(hi / step - 1e-9) * step; for (let v = Math.floor(lo / step) * step; v <= top + step * 1e-9; v += step) out.push(Math.round(v * 1e6) / 1e6);
  return out;
}
function drawChart(spec) {
  const c = G.ctx; c.clearRect(0, 0, 600, 400); G.turtle.v = false; drawTurtle();
  c.fillStyle = '#fff'; c.fillRect(0, 0, 600, 400);
  const L = 56, R = 20, Tp = spec.title ? 40 : 18, B = 64;
  const W = 600 - L - R, H = 400 - Tp - B;
  c.fillStyle = '#1B2430'; c.font = 'bold 16px "Atkinson Hyperlegible", sans-serif'; c.textAlign = 'left';
  if (spec.title) c.fillText(spec.title, L, 26);
  const ys = spec.ys; const xs = spec.xs;
  let lo = Math.min(0, ...ys), hi = Math.max(...ys);
  if (spec.kind !== 'bar') lo = Math.min(...ys);
  const ticks = niceTicks(lo, hi, 5); lo = ticks[0]; hi = ticks[ticks.length - 1];
  const Y = (v) => Tp + H - (v - lo) / (hi - lo || 1) * H;
  c.font = '12px "Atkinson Hyperlegible", sans-serif'; c.textAlign = 'right'; c.textBaseline = 'middle';
  for (const t of ticks) { c.strokeStyle = '#E7EBF2'; c.lineWidth = 1; c.beginPath(); c.moveTo(L, Y(t)); c.lineTo(L + W, Y(t)); c.stroke(); c.fillStyle = '#5B6778'; c.fillText(String(t), L - 6, Y(t)); }
  c.strokeStyle = '#5B6778'; c.beginPath(); c.moveTo(L, Tp); c.lineTo(L, Tp + H); c.lineTo(L + W, Tp + H); c.stroke();
  if (spec.kind === 'bar') {
    const n = ys.length; const bw = W / n;
    ys.forEach((v, i) => {
      c.fillStyle = '#2750D8'; const y0 = Y(Math.max(lo, 0)), y1 = Y(v);
      c.fillRect(L + i * bw + bw * 0.15, Math.min(y0, y1), bw * 0.7, Math.abs(y0 - y1));
      c.fillStyle = '#1B2430'; c.textAlign = 'center'; c.textBaseline = 'bottom'; if (n <= 24) c.fillText(fmt(v), L + i * bw + bw / 2, y1 - 2);
      c.save(); c.translate(L + i * bw + bw / 2, Tp + H + 8); if (n > 6) c.rotate(-0.6); c.textAlign = n > 6 ? 'right' : 'center'; c.textBaseline = 'top'; c.fillStyle = '#5B6778';
      const lab = spec.labels[i].length > 16 ? spec.labels[i].slice(0, 15) + '…' : spec.labels[i]; c.fillText(lab, 0, 0); c.restore();
    });
  } else {
    let xlo = Math.min(...xs), xhi = Math.max(...xs);
    const xt = niceTicks(xlo, xhi, 6); xlo = xt[0]; xhi = xt[xt.length - 1];
    const X = (v) => L + (v - xlo) / (xhi - xlo || 1) * W;
    c.textAlign = 'center'; c.textBaseline = 'top'; c.fillStyle = '#5B6778';
    for (const t of xt) c.fillText(String(t), X(t), Tp + H + 6);
    if (spec.kind === 'line') { c.strokeStyle = '#2750D8'; c.lineWidth = 2.5; c.beginPath(); xs.forEach((x, i) => { i ? c.lineTo(X(x), Y(ys[i])) : c.moveTo(X(x), Y(ys[i])); }); c.stroke(); }
    c.fillStyle = spec.kind === 'line' ? '#2750D8' : 'rgba(39,80,216,.75)';
    xs.forEach((x, i) => { c.beginPath(); c.arc(X(x), Y(ys[i]), spec.kind === 'line' ? 3 : 4.5, 0, Math.PI * 2); c.fill(); });
  }
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  G.cv.setAttribute('aria-label', spec.summary || 'Chart');
}
function fmt(v) { return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100); }
function drawNetwork(spec) {
  cancelAnimationFrame(G.anim);
  const pos = new Map(spec.nodes.map(n => [n.name, [cx(n.x * 0.95), cy(n.y)]]));
  const base = () => {
    const c = G.ctx; c.clearRect(0, 0, 600, 400); c.fillStyle = '#fff'; c.fillRect(0, 0, 600, 400);
    c.font = '11px "Fira Code", monospace';
    for (const l of spec.links) {
      const [x1, y1] = pos.get(l.a), [x2, y2] = pos.get(l.b);
      c.strokeStyle = '#B9C3D3'; c.lineWidth = 2; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
      c.fillStyle = '#5B6778'; c.textAlign = 'center'; c.fillText(l.ms + ' ms', (x1 + x2) / 2, (y1 + y2) / 2 - 5);
    }
    for (const n of spec.nodes) {
      const [x, y] = pos.get(n.name);
      const col = n.kind === 'router' ? '#0E7490' : n.kind === 'server' ? '#6B46C1' : (n.cls !== 'Device' ? '#C8372D' : '#2750D8');
      c.fillStyle = '#fff'; c.strokeStyle = col; c.lineWidth = 2;
      c.beginPath();
      if (n.kind === 'router') { c.moveTo(x, y - 16); c.lineTo(x + 16, y); c.lineTo(x, y + 16); c.lineTo(x - 16, y); c.closePath(); }
      else if (n.kind === 'server') c.rect(x - 13, y - 16, 26, 32);
      else c.arc(x, y, 14, 0, Math.PI * 2);
      c.fill(); c.stroke();
      c.fillStyle = '#1B2430'; c.textAlign = 'center'; c.font = 'bold 12px "Atkinson Hyperlegible", sans-serif';
      c.fillText(n.name, x, y + 31);
      c.font = '10.5px "Fira Code", monospace'; c.fillStyle = '#5B6778'; c.fillText(n.ip, x, y + 44);
    }
  };
  base();
  G.turtle.v = false; drawTurtle();
  G.cv.setAttribute('aria-label', `Network with ${spec.nodes.length} devices and ${spec.links.length} links`);
  if (!spec.last || !spec.last.journeys.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const js = spec.last.journeys.slice(0, 40);
  const hop = 320, gap = 260; const t0 = performance.now();
  const total = (js.length - 1) * gap + (spec.last.path.length) * hop + 600;
  const frame = (now) => {
    const t = now - t0; const c = G.tctx; c.clearRect(0, 0, 600, 400);
    js.forEach((j, k) => {
      const local = t - k * gap; if (local < 0) return;
      const stopAt = j.lostAt !== null ? j.lostAt : j.blockedAt !== null ? j.blockedAt : j.path.length - 1;
      const f = Math.min(local / hop, stopAt);
      const seg = Math.min(Math.floor(f), j.path.length - 2); const u = f - seg;
      const [x1, y1] = pos.get(j.path[Math.max(0, seg)]), [x2, y2] = pos.get(j.path[Math.min(seg + 1, j.path.length - 1)]);
      let x = x1 + (x2 - x1) * u, y = y1 + (y2 - y1) * u;
      const ended = local / hop >= stopAt;
      if (ended && j.lostAt !== null) { const [a1, b1] = pos.get(j.path[j.lostAt - 1]), [a2, b2] = pos.get(j.path[j.lostAt]); x = (a1 + a2) / 2; y = (b1 + b2) / 2; }
      if (ended && local > stopAt * hop + 900) return;
      c.fillStyle = ended && (j.lostAt !== null || j.blockedAt !== null) ? '#C8372D' : '#E0A800';
      c.beginPath(); c.arc(x, y, 7, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#1B2430'; c.font = 'bold 9px "Fira Code", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(j.seq), x, y + 0.5);
      if (ended && j.lostAt !== null) { c.strokeStyle = '#C8372D'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 9, y - 9); c.lineTo(x + 9, y + 9); c.moveTo(x + 9, y - 9); c.lineTo(x - 9, y + 9); c.stroke(); }
    });
    c.textBaseline = 'alphabetic';
    if (t < total) G.anim = requestAnimationFrame(frame); else c.clearRect(0, 0, 600, 400);
  };
  G.anim = requestAnimationFrame(frame);
}

// ----- widgets host -----
const W = { els: [] };
const uiHost = {
  create(kind, props) {
    const box = $('#widgets'); box.hidden = false;
    const row = h('div', { class: 'w-row' });
    let el;
    const id = 'w' + W.els.length;
    switch (kind) {
      case 'button': el = h('button', { type: 'button', id }, props.text); break;
      case 'label': el = h('label', { class: 'w-label', id }, props.text); break;
      case 'input_box': el = h('input', { type: 'text', id, placeholder: props.text, 'aria-label': props.text || 'Text' }); break;
      case 'number_box': el = h('input', { type: 'number', id, placeholder: props.text, 'aria-label': props.text || 'Number' }); break;
      case 'slider': {
        el = h('input', { type: 'range', id, min: props.min, max: props.max, value: props.value, 'aria-label': 'Slider' });
        const out = h('output', { for: id, class: 'mono small' }, String(props.value));
        el.addEventListener('input', () => { out.textContent = el.value; });
        row.append(el, out); box.append(row); W.els.push({ kind, el, row, props }); return W.els.length - 1;
      }
      case 'dropdown': el = h('select', { id, 'aria-label': 'Options' }, props.options.map(o => h('option', null, o))); break;
      case 'checkbox': { const cb = h('input', { type: 'checkbox', id }); el = h('label', { class: 'w-check' }, cb, ' ', h('span', null, props.text)); el.cb = cb; break; }
    }
    row.append(el); box.append(row);
    W.els.push({ kind, el, row, props });
    return W.els.length - 1;
  },
  update(hd, prop, v) {
    const w = W.els[hd]; if (!w) return;
    if (prop === 'text') { if (w.kind === 'checkbox') $('span', w.el).textContent = v; else if (w.kind === 'input_box' || w.kind === 'number_box') w.el.placeholder = v; else if (w.kind !== 'slider' && w.kind !== 'dropdown') w.el.textContent = v; }
    if (prop === 'value') { if (w.kind === 'checkbox') w.el.cb.checked = !!v; else { w.el.value = v === null ? '' : v; if (w.kind === 'slider') w.el.dispatchEvent(new Event('input')); } }
    if (prop === 'visible') w.row.hidden = !v;
    if (prop === 'enabled') { const t = w.kind === 'checkbox' ? w.el.cb : w.el; t.disabled = !v; }
  },
  read(hd, prop) {
    const w = W.els[hd]; if (!w) return undefined;
    if (prop === 'value') { if (w.kind === 'checkbox') return w.el.cb.checked; if (w.kind === 'label' || w.kind === 'button') return undefined; return w.el.value; }
    return undefined;
  },
  bind(hd, ev, cb) {
    const w = W.els[hd]; if (!w) return;
    const target = w.kind === 'checkbox' ? w.el.cb : w.el;
    const type = ev === 'click' ? 'click' : (w.kind === 'slider' ? 'input' : 'change');
    target.addEventListener(type, () => { if (!S.runner) return; cb(); wake(); });
  },
  clear() { W.els = []; const b = $('#widgets'); b.innerHTML = ''; b.hidden = true; }
};

// ----- console -----
const Con = {
  el: null,
  add(node) { this.el.append(node); if (this.el.children.length > 3000) this.el.firstChild.remove(); this.el.scrollTop = this.el.scrollHeight; return node; },
  print(text) { this.add(h('div', { class: 'o' }, text)); },
  note(text) { this.add(h('div', { class: 'o note' }, text)); },
  echo(prompt, ans) { const d = h('div', { class: 'o echo' }, (prompt ? prompt + ' ' : ''), h('b', null, ans)); this.add(d); },
  clear() { this.el.innerHTML = ''; },
  table(rows, ed) { this.add(renderTable(rows, ed, 200)); },
  error(e, ed) {
    const text = BL.errText(e, ed);
    const why = WHY[e.code];
    const box = h('div', { class: 'err', role: 'alert' });
    const head = h('div', { class: 'eh' }, h('span', { class: 'code' }, e.code || ''), h('span', { html: codeMsg(text) }));
    box.append(head);
    const links = h('div', { class: 'eh', style: 'margin-top:4px' });
    if (e.line) links.append(h('button', { class: 'linkbtn', onclick: () => { editor.gotoLine(e.line, true); } }, T('goLine', { n: e.line })));
    if (why) { const w = h('div', { class: 'why', hidden: true }, why[ED === 'es' ? 1 : 0]); links.append(h('button', { class: 'linkbtn', onclick: () => { w.hidden = !w.hidden; } }, T('whyBtn'))); box.append(links, w); }
    else box.append(links);
    this.add(box);
  }
};
function renderTable(rows, ed, limit) {
  if (!BL.isList(rows) || !rows.length) return h('div', { class: 'o note' }, '(empty table)');
  const wrap = h('div', { class: 'tblWrap' });
  const t = h('table', { class: 'data' });
  let cols = null;
  if (rows.every(r => BL.isDict(r))) { cols = []; for (const r of rows) for (const k of r.keys()) if (!cols.includes(k)) cols.push(k); }
  if (cols) t.append(h('tr', null, cols.map(c => h('th', null, BL.show(c, ed)))));
  for (const r of rows.slice(0, limit)) {
    const cells = cols ? cols.map(c => (r.has(c) ? r.get(c) : null)) : (BL.isList(r) ? r : [r]);
    t.append(h('tr', null, cells.map(v => { const miss = v === null || (typeof v === 'string' && ['', 'N/A', '-'].includes(v.trim())); return h('td', { class: (BL.isNum(v) ? 'n' : '') + (miss ? ' miss' : '') }, v === null ? '' : BL.show(v, ed)); })));
  }
  wrap.append(t);
  if (rows.length > limit) wrap.append(h('div', { class: 'o note' }, `… ${rows.length - limit} more rows`));
  return wrap;
}

// ----- host object -----
const host = {
  print: (t) => Con.print(t), note: (t) => Con.note(t), table: (rows, ed) => Con.table(rows, ed), echoInput: (p, a) => Con.echo(p, a),
  gfx, ui: uiHost, now: () => Date.now(),
  every(ms, cb) { const id = setInterval(() => { if (!S.runner) return; cb(); wake(); }, ms); S.intervals.push(id); return id; },
  onKey(key, cb) { S.keys.push({ key, cb }); },
  mouse: () => G.mouse,
  fileChanged(name, text) { P.files[name] = text; saveSoon(); if (currentTab === 'files') renderFiles(); }
};
const KEYMAP = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', ' ': 'space', Enter: 'enter', Escape: 'escape' };
document.addEventListener('keydown', (e) => {
  if (!S.runner || !S.keys.length) return;
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'textarea' || tag === 'input' || tag === 'select') return;
  const k = KEYMAP[e.key] || (e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase());
  let hit = false;
  for (const x of S.keys) if (x.key === k) { x.cb(); hit = true; }
  if (hit) { e.preventDefault(); wake(); }
});

// ----- session -----
const S = { runner: null, prog: null, tick: null, intervals: [], keys: [], animate: false, delay: 350, seed: 1, lastState: 'idle', askBox: null, prevSnap: new Map() };
function setStatus(kind, text) { const s = $('#status'); s.className = 'status ' + kind; s.innerHTML = ''; s.append(h('span', { class: 'dot' }), text); }
function runnerActive() { return S.runner && !['done', 'error', 'stopped'].includes(S.runner.state); }
function updateButtons() {
  const act = runnerActive();
  $('#btnStop').disabled = !act;
  if (typeof renderDebugToolbar === 'function') renderDebugToolbar();
}
function compile(quiet) {
  const src = editor.value;
  try { return BL.parse(src, ED); }
  catch (e) {
    if (!quiet) { Con.clear(); Con.error(e, ED); editor.setMarks({ err: e.line, cur: 0 }); setStatus('error', T('errorAt', { n: e.line })); }
    return null;
  }
}
function filesMap() { return new Map(Object.entries(P.files)); }
function bpMap() { const m = new Map(); for (const k in P.breakpoints) m.set(+k, P.breakpoints[k] && P.breakpoints[k].src ? { src: P.breakpoints[k].src } : null); return m; }
function stopTimers() { clearTimeout(S.tick); S.tick = null; for (const i of S.intervals) clearInterval(i); S.intervals = []; S.keys = []; }
function resetStage() { stopTimers(); Con.clear(); uiHost.clear(); clearCanvas(); showCanvas(false); S.askBox = null; S.prevSnap = new Map(); }
function makeRunner(prog, extra) {
  let r;
  try { r = new BL.Runner(prog, host, Object.assign({ seed: S.seed, breakpoints: bpMap(), trace: true, files: filesMap() }, extra || {})); }
  catch (e) { Con.error(e, ED); editor.setMarks({ err: e.line, cur: 0 }); setStatus('error', T('errorAt', { n: e.line })); return null; }
  return r;
}
function startRunner(pauseFirst) {
  stopRun(true);
  const prog = compile(); if (!prog) return false;
  S.prog = prog; S.seed = 1 + Math.floor(Math.random() * 1e6);
  resetStage();
  editor.setMarks({ err: 0, cur: 0 });
  const r = makeRunner(prog); if (!r) return false;
  S.runner = r; r.start();
  if (pauseFirst) r.pauseMode = { kind: 'into' };
  setStatus('running', T('running'));
  loop();
  return true;
}
function run() { S.playing = S.animate; startRunner(S.animate); }
function stopRun(silent) {
  stopTimers();
  if (S.runner && runnerActive()) { S.runner.state = 'stopped'; if (!silent) { setStatus('', T('stopped')); } }
  if (S.askBox) { S.askBox.remove(); S.askBox = null; }
  cancelAnimationFrame(G.anim);
  editor.setMarks({ cur: 0 });
  updateButtons();
}
function wake() { if (S.runner && ['events', 'running'].includes(S.runner.state) && !S.tick) S.tick = setTimeout(loop, 0); }
function loop() {
  S.tick = null;
  const r = S.runner; if (!r || r.state === 'stopped') return;
  const st = r.runSlice(16);
  handleState(st);
}
function handleState(st) {
  const r = S.runner;
  updateButtons();
  switch (st) {
    case 'running': setStatus('running', T('running')); S.tick = setTimeout(loop, 0); return;
    case 'paused': {
      const line = r.pausedNode.line;
      setStatus('paused', T('paused', { n: line }));
      editor.setMarks({ cur: line, err: 0 });
      refreshDebug();
      if (S.animate && S.playing) S.tick = setTimeout(() => { S.tick = null; if (S.runner !== r) return; r.pauseMode = { kind: 'into' }; r.resume(); loop(); }, S.delay);
      return;
    }
    case 'ask': {
      setStatus('paused', T('waitingInput'));
      editor.setMarks({ cur: r.curLine });
      const inp = h('input', { type: 'text', 'aria-label': r.askPrompt || T('answer') });
      const box = h('div', { class: 'ask' }, h('span', null, r.askPrompt), inp, h('button', { class: 'btn tiny', onclick: () => submit() }, T('answer')));
      const submit = () => { const v = inp.value; box.remove(); S.askBox = null; Con.echo(r.askPrompt, v); r.answer(v); editor.setMarks({ cur: 0 }); loop(); };
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
      Con.add(box); S.askBox = box; setTimeout(() => inp.focus(), 0);
      return;
    }
    case 'waiting': setStatus('running', T('waiting')); S.tick = setTimeout(loop, Math.max(0, r.resumeAt - Date.now())); return;
    case 'events': setStatus('running', T('waitingEvents')); editor.setMarks({ cur: 0 }); refreshDebug(); return;
    case 'done':
      setStatus('done', T('finished')); editor.setMarks({ cur: 0 });
      Con.add(h('div', { class: 'done' }, T('finishedIn', { n: r.steps.toLocaleString('en') })));
      refreshDebug(); updateButtons(); return;
    case 'error':
      Con.error(r.error, ED); editor.setMarks({ err: r.error.line, cur: 0 });
      setStatus('error', T('errorAt', { n: r.error.line })); refreshDebug(); updateButtons();
      if (r.error.internal) console.error(r.error.internal);
      return;
    case 'guard': {
      setStatus('paused', T('paused', { n: r.curLine }));
      editor.setMarks({ cur: r.curLine });
      const box = h('div', { class: 'guard', role: 'alert' }, h('span', null, T('guardMsg')),
        h('button', { class: 'btn tiny', onclick: () => { box.remove(); r.state = 'running'; loop(); } }, T('keepRunning')),
        h('button', { class: 'btn tiny', onclick: () => { box.remove(); stopRun(); } }, T('stop')));
      Con.add(box); refreshDebug();
      return;
    }
    case 'stopped': return;
  }
}
// ----- stepping -----
function ensurePaused() {
  if (runnerActive()) return false;
  S.playing = false;
  startRunner(true);
  return true;
}
function stepCmd(kind) {
  if (ensurePaused()) return;
  const r = S.runner;
  if (!r || r.state === 'ask') return;
  S.playing = false;
  if (kind === 'into') r.pauseMode = { kind: 'into' };
  else if (kind === 'over') r.pauseMode = { kind: 'over', depth: r.stack.length };
  else if (kind === 'out') r.pauseMode = { kind: 'out', depth: r.stack.length };
  else if (kind === 'cursor') r.pauseMode = { kind: 'line', line: editor.caretLine };
  else if (kind === 'continue') { r.pauseMode = null; S.playing = S.animate; if (S.animate) r.pauseMode = { kind: 'into' }; }
  if (r.state === 'events') { r.state = 'running'; }
  r.resume();
  clearTimeout(S.tick); S.tick = null;
  loop();
}
function stepBack() {
  const r = S.runner;
  if (!r || !S.prog || r.steps <= 1) return;
  const target = r.steps - 1;
  const inputs = r.inputsLog.slice();
  stopTimers();
  resetStage();
  const nr = makeRunner(S.prog, { replayInputs: inputs, fastReplay: true, breakpoints: new Map() });
  if (!nr) return;
  S.runner = nr; nr.start(); nr.pauseMode = { kind: 'count', target };
  let st; const t0 = Date.now();
  do { st = nr.runSlice(200); } while (st === 'running' && Date.now() - t0 < 8000);
  nr.breakpoints = bpMap();
  S.playing = false;
  handleState(st);
}
