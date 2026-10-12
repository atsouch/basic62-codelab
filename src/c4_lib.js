// ===== Core part 4: standard library =====
function E(ctx, en, es) {
  const nm = ctx.isMethod ? localMember(ctx.fnName || '?', ctx.r.ed) : localName(ctx.fnName || '?', ctx.r.ed);
  return new LangError('E219', { fn: nm, msg: ctx.r.ed === 'es' ? es : en }, ctx.line);
}
function needNum(ctx, v, what) {
  if (!isNum(v)) throw E(ctx, `${what || 'this value'} must be a number, not ${aTypeName(v, 'en')}.`, `${what || 'este valor'} debe ser un número, no ${aTypeName(v, 'es')}.`);
  return nv(v);
}
function needWhole(ctx, v, what) {
  if (v instanceof Dec && Number.isInteger(v.v)) v = v.v;
  if (!isWhole(v)) throw E(ctx, `${what || 'this value'} must be a whole number.`, `${what || 'este valor'} debe ser un número entero.`);
  return v;
}
function needText(ctx, v, what) {
  if (!isText(v)) throw E(ctx, `${what || 'this value'} must be text, not ${aTypeName(v, 'en')}.`, `${what || 'este valor'} debe ser texto, no ${aTypeName(v, 'es')}.`);
  return v;
}
function needList(ctx, v, what) {
  if (!isList(v)) throw E(ctx, `${what || 'this value'} must be a list, not ${aTypeName(v, 'en')}.`, `${what || 'este valor'} debe ser una lista, no ${aTypeName(v, 'es')}.`);
  return v;
}
function needRows(ctx, v) {
  needList(ctx, v, 'the rows');
  for (const r of v) if (!isDict(r)) throw E(ctx, 'the rows must be a list of dictionaries (one per row).', 'las filas deben ser una lista de diccionarios (uno por fila).');
  return v;
}
function needFunc(ctx, v) {
  if (!isCallable(v)) throw E(ctx, 'this needs the name of a function (without brackets).', 'esto necesita el nombre de una función (sin paréntesis).');
  return v;
}
function toJS(v) {
  if (v instanceof Dec) return v.v;
  if (isList(v)) return v.map(toJS);
  if (isDict(v)) { const o = {}; for (const [k, x] of v) o[k] = toJS(x); return o; }
  if (v instanceof Obj) { const o = {}; for (const [k, x] of v.attrs) o[k] = toJS(x); return o; }
  return v === undefined ? null : v;
}
function fromJS(x) {
  if (x === null || x === undefined) return null;
  if (typeof x === 'number') return Number.isInteger(x) ? x : new Dec(x);
  if (Array.isArray(x)) return x.map(fromJS);
  if (typeof x === 'object') { const m = new Map(); for (const k of Object.keys(x)) m.set(k, fromJS(x[k])); return m; }
  return x;
}
function numOut(x) { return Number.isInteger(x) ? x : new Dec(x); }
function decOut(x) { return new Dec(x); }
function roundHalfEven(x) {
  const r = Math.round(x);
  if (Math.abs(x % 1) === 0.5) return 2 * Math.round(x / 2);
  return r;
}

const B = (spec) => REG.builtins.push(spec);
const M = (grp, spec) => grp.push(spec);

// ---------- core ----------
B({ n: 'ASK', es: 'PREGUNTAR', p: 'question', min: 0, max: 1, cat: 'core', gen: true,
  d: 'Shows a question and waits for the user to type an answer. Always returns text.',
  f: function* (a, ctx) { const q = a.length ? show(a[0], ctx.r.ed) : ''; const v = yield { req: 'ask', prompt: q }; return String(v); } });
B({ n: 'type', es: 'tipo', p: 'value', min: 1, cat: 'core', d: 'The type of a value as text, such as "whole number" or "list". For an object, its class name.',
  f: (a, ctx) => typeName(a[0], ctx.r.ed) });
B({ n: 'whole', es: 'entero', p: 'value', min: 1, cat: 'core', d: 'Converts text or a decimal to a whole number (decimals are cut, not rounded).',
  f: (a, ctx) => {
    const v = a[0];
    if (isWhole(v)) return v;
    if (v instanceof Dec) return Math.trunc(v.v);
    if (typeof v === 'boolean') return v ? 1 : 0;
    if (isText(v) && /^\s*[-+]?\d+\s*$/.test(v)) return parseInt(v, 10);
    throw new LangError('E215', { fn: localName('whole', ctx.r.ed), val: describeValue(v, ctx.r.ed), kind: ctx.r.L('a whole number', 'un número entero') }, ctx.line);
  } });
B({ n: 'decimal', es: 'decimal', p: 'value', min: 1, cat: 'core', d: 'Converts text or a whole number to a decimal number.',
  f: (a, ctx) => {
    const v = a[0];
    if (isNum(v)) return new Dec(nv(v));
    if (isText(v) && /^\s*[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?\s*$/.test(v)) return new Dec(parseFloat(v));
    throw new LangError('E215', { fn: localName('decimal', ctx.r.ed), val: describeValue(v, ctx.r.ed), kind: ctx.r.L('a decimal number', 'un número decimal') }, ctx.line);
  } });
B({ n: 'text', es: 'texto', p: 'value', min: 1, cat: 'core', gen: true, d: 'Converts any value to text.',
  f: function* (a, ctx) { return yield* ctx.r.display(a[0]); } });
B({ n: 'round', es: 'redondear', p: 'number, places = 0', min: 1, max: 2, cat: 'core',
  d: 'Rounds a number. With no places it gives a whole number (halves round to the even neighbour, as in Python).',
  f: (a, ctx) => {
    const x = needNum(ctx, a[0], 'the number');
    if (a.length < 2 || nv(a[1]) === 0) return a.length < 2 ? roundHalfEven(x) : new Dec(roundHalfEven(x));
    const n = needWhole(ctx, a[1], 'places');
    const f = Math.pow(10, n);
    return new Dec(Math.round(x * f + (x >= 0 ? 1e-9 : -1e-9)) / f);
  } });
B({ n: 'length', es: 'longitud', p: 'value', min: 1, cat: 'core', d: 'How many items a list or dictionary has, or how many characters a text has.',
  f: (a, ctx) => { const v = a[0]; if (isList(v) || isText(v)) return v.length; if (isDict(v)) return v.size; throw E(ctx, `works with a list, text or dictionary, not ${aTypeName(v, 'en')}.`, `funciona con una lista, un texto o un diccionario, no con ${aTypeName(v, 'es')}.`); } });
B({ n: 'copy', es: 'copiar', p: 'list_or_dict', min: 1, cat: 'core', d: 'Makes an independent copy of a list or dictionary.',
  f: (a) => deepCopy(a[0]) });
B({ n: 'is_a', es: 'es_un', p: 'object, Class', min: 2, cat: 'core', d: 'TRUE if the object was made from the class or from a class that extends it.',
  f: (a, ctx) => {
    const [o, c] = a;
    if (!(c instanceof Cls)) throw E(ctx, 'the second value must be a class.', 'el segundo valor debe ser una clase.');
    if (!(o instanceof Obj)) return false;
    for (let k = o.cls; k; k = k.parent) if (k === c) return true;
    return false;
  } });
B({ n: 'random', es: 'aleatorio', p: 'low, high', min: 2, cat: 'core', d: 'A random whole number from low to high, including both.',
  f: (a, ctx) => { const lo = needWhole(ctx, a[0], 'low'), hi = needWhole(ctx, a[1], 'high'); if (hi < lo) throw E(ctx, 'high must not be smaller than low.', 'el máximo no puede ser menor que el mínimo.'); return lo + Math.floor(ctx.r.rng() * (hi - lo + 1)); } });
B({ n: 'random_seed', es: 'semilla_aleatoria', p: 'seed', min: 1, cat: 'core', d: 'Makes random numbers repeat the same sequence every run, for testing and comparing algorithms.',
  f: (a, ctx) => { ctx.r.rng = makeRng(needWhole(ctx, a[0], 'the seed')); return null; } });
B({ n: 'sqrt', es: 'raiz', p: 'number', min: 1, cat: 'core', d: 'Square root, as a decimal number.',
  f: (a, ctx) => { const x = needNum(ctx, a[0], 'the number'); if (x < 0) throw E(ctx, 'negative numbers have no square root here.', 'los números negativos no tienen raíz cuadrada aquí.'); return new Dec(Math.sqrt(x)); } });
B({ n: 'abs', es: 'abs', p: 'number', min: 1, cat: 'core', d: 'The number without its minus sign.',
  f: (a, ctx) => { needNum(ctx, a[0], 'the number'); return mkNum(Math.abs(nv(a[0])), isWhole(a[0])); } });
function minmax(a, ctx, sign) {
  const xs = a.length === 1 ? (isList(a[0]) ? a[0] : null) : a;
  if (!xs) throw E(ctx, 'give a list, or two or more values.', 'da una lista, o dos o más valores.');
  if (!xs.length) throw E(ctx, 'the list is empty.', 'la lista está vacía.');
  let best = xs[0];
  for (const x of xs) {
    const ok = (isNum(x) && isNum(best)) || (isText(x) && isText(best));
    if (!ok) throw E(ctx, 'values must all be numbers or all be text.', 'los valores deben ser todos números o todos texto.');
    if (sign * (nv(x) < nv(best) ? -1 : nv(x) > nv(best) ? 1 : 0) > 0) best = x;
  }
  return best;
}
B({ n: 'min', es: 'min', p: 'list', min: 1, max: Infinity, cat: 'core', d: 'The smallest value in a list (or of several values).', f: (a, ctx) => minmax(a, ctx, -1) });
B({ n: 'max', es: 'max', p: 'list', min: 1, max: Infinity, cat: 'core', d: 'The largest value in a list (or of several values).', f: (a, ctx) => minmax(a, ctx, 1) });
B({ n: 'sum', es: 'suma', p: 'list', min: 1, cat: 'core', d: 'Adds up all the numbers in a list.',
  f: (a, ctx) => { const xs = needList(ctx, a[0], 'the value'); let s = 0, w = true; for (const x of xs) { needNum(ctx, x, 'every item'); s += nv(x); if (!isWhole(x)) w = false; } return mkNum(s, w); } });
B({ n: 'now', es: 'ahora', p: '', min: 0, cat: 'core', d: 'The current date and time as text, such as "2026-09-24 14:05:09".',
  f: () => { const d = new Date(); const p = (x) => String(x).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`; } });
B({ n: 'timer', es: 'cronometro', p: '', min: 0, cat: 'core', d: 'Seconds since the program started, as a decimal. Use it to time parts of a program.',
  f: (a, ctx) => new Dec(Math.round((Date.now() - ctx.r.startTime)) / 1000) });
B({ n: 'steps', es: 'pasos', p: '', min: 0, cat: 'core', d: 'How many statements the program has run so far. Compare algorithms without depending on computer speed.',
  f: (a, ctx) => ctx.r.steps });
B({ n: 'join', es: 'unir', p: 'list, separator = ""', min: 1, max: 2, cat: 'text', d: 'Joins the items of a list into one text, with the separator between them.',
  f: (a, ctx) => { const xs = needList(ctx, a[0], 'the first value'); const sep = a.length > 1 ? needText(ctx, a[1], 'the separator') : ''; return xs.map(x => show(x, ctx.r.ed)).join(sep); } });
B({ n: 'code_of', es: 'codigo_de', p: 'character', min: 1, cat: 'text', d: 'The number code of a single character (for example 65 for "A").',
  f: (a, ctx) => { const t = needText(ctx, a[0], 'the value'); if ([...t].length !== 1) throw E(ctx, 'give exactly one character.', 'da exactamente un carácter.'); return t.codePointAt(0); } });
B({ n: 'char_of', es: 'caracter_de', p: 'code', min: 1, cat: 'text', d: 'The character for a number code (for example "A" for 65).',
  f: (a, ctx) => { const n = needWhole(ctx, a[0], 'the code'); if (n < 0 || n > 0x10FFFF) throw E(ctx, 'that is not a valid character code.', 'ese no es un código de carácter válido.'); return String.fromCodePoint(n); } });
B({ n: 'format', es: 'formato', p: 'number, places', min: 2, cat: 'text', d: 'The number as text with exactly this many decimal places.',
  f: (a, ctx) => { const x = needNum(ctx, a[0], 'the number'); const n = needWhole(ctx, a[1], 'places'); return x.toFixed(Math.max(0, Math.min(20, n))); } });
B({ n: 'from_json', es: 'desde_json', p: 'text', min: 1, cat: 'web', d: 'Turns JSON text into dictionaries and lists.',
  f: (a, ctx) => { try { return fromJS(JSON.parse(needText(ctx, a[0], 'the value'))); } catch (e) { if (e.isLang) throw e; throw new LangError('E228', { msg: e.message }, ctx.line); } } });
B({ n: 'to_json', es: 'a_json', p: 'value', min: 1, cat: 'web', d: 'Turns dictionaries and lists into JSON text.',
  f: (a) => JSON.stringify(toJS(a[0])) });
B({ n: 'wait', es: 'esperar', p: 'seconds', min: 1, cat: 'graphics', gen: true, d: 'Pauses the program for this many seconds.',
  f: function* (a, ctx) { const s = needNum(ctx, a[0], 'the seconds'); yield { req: 'wait', ms: Math.max(0, s * 1000) }; return null; } });
B({ n: 'every', es: 'repetir_cada', p: 'seconds, function', min: 2, cat: 'graphics', d: 'Runs a function again and again, every this many seconds, until the program is stopped.',
  f: (a, ctx) => { const s = needNum(ctx, a[0], 'the seconds'); const fn = needFunc(ctx, a[1]); const r = ctx.r; if (s < 0.02) throw E(ctx, 'use at least 0.02 seconds.', 'usa al menos 0,02 segundos.'); r.listeners++; if (r.host.every) r.timers.push(r.host.every(s * 1000, () => r.enqueue(fn, []))); return null; } });
B({ n: 'on_key', es: 'al_pulsar_tecla', p: 'key, function', min: 2, cat: 'graphics', d: 'Runs the function when a key is pressed: "left", "right", "up", "down", "space" or a letter.',
  f: (a, ctx) => { const k = needText(ctx, a[0], 'the key').toLowerCase(); const fn = needFunc(ctx, a[1]); const r = ctx.r; r.listeners++; if (r.host.onKey) r.host.onKey(k, () => r.enqueue(fn, [])); return null; } });
B({ n: 'mouse_x', es: 'raton_x', p: '', min: 0, cat: 'graphics', d: 'The mouse x position over the canvas.', f: (a, ctx) => (ctx.r.host.mouse ? ctx.r.host.mouse().x : 0) });
B({ n: 'mouse_y', es: 'raton_y', p: '', min: 0, cat: 'graphics', d: 'The mouse y position over the canvas.', f: (a, ctx) => (ctx.r.host.mouse ? ctx.r.host.mouse().y : 0) });

// ---------- turtle & shapes ----------
function T(r) {
  if (!r.turtle) r.turtle = { x: 0, y: 0, h: 0, down: true, color: '#1f2a44', size: 2, fill: null, visible: true };
  return r.turtle;
}
function syncTurtle(r) { const t = T(r); r.host.gfx.turtle(t.x, t.y, t.h, t.visible); r.touch(); }
function moveTo(r, nx, ny) {
  const t = T(r);
  if (t.down) r.host.gfx.line(t.x, t.y, nx, ny, t.color, t.size);
  t.x = nx; t.y = ny; syncTurtle(r);
}
B({ n: 'forward', es: 'avanzar', p: 'distance', min: 1, cat: 'graphics', d: 'Moves the turtle forward, drawing a line if the pen is down.',
  f: (a, ctx) => { const d = needNum(ctx, a[0], 'the distance'); const t = T(ctx.r); const ang = -t.h * Math.PI / 180; moveTo(ctx.r, t.x + d * Math.cos(ang), t.y + d * Math.sin(ang)); return null; } });
B({ n: 'back', es: 'retroceder', p: 'distance', min: 1, cat: 'graphics', d: 'Moves the turtle backwards.',
  f: (a, ctx) => { const d = needNum(ctx, a[0], 'the distance'); const t = T(ctx.r); const ang = -t.h * Math.PI / 180; moveTo(ctx.r, t.x - d * Math.cos(ang), t.y - d * Math.sin(ang)); return null; } });
B({ n: 'turn', es: 'girar', p: 'degrees', min: 1, cat: 'graphics', d: 'Turns the turtle clockwise. Use a negative number to turn anticlockwise.',
  f: (a, ctx) => { const t = T(ctx.r); t.h = (t.h + needNum(ctx, a[0], 'the degrees')) % 360; syncTurtle(ctx.r); return null; } });
B({ n: 'go_to', es: 'ir_a', p: 'x, y', min: 2, cat: 'graphics', d: 'Moves the turtle to a point. (0, 0) is the centre; y goes up.',
  f: (a, ctx) => { moveTo(ctx.r, needNum(ctx, a[0], 'x'), needNum(ctx, a[1], 'y')); return null; } });
B({ n: 'pen_up', es: 'subir_lapiz', p: '', min: 0, cat: 'graphics', d: 'Stops the turtle drawing when it moves.', f: (a, ctx) => { T(ctx.r).down = false; return null; } });
B({ n: 'pen_down', es: 'bajar_lapiz', p: '', min: 0, cat: 'graphics', d: 'Makes the turtle draw when it moves.', f: (a, ctx) => { T(ctx.r).down = true; return null; } });
B({ n: 'hide_turtle', es: 'ocultar_tortuga', p: '', min: 0, cat: 'graphics', d: 'Hides the turtle arrow.', f: (a, ctx) => { T(ctx.r).visible = false; syncTurtle(ctx.r); return null; } });
B({ n: 'show_turtle', es: 'mostrar_tortuga', p: '', min: 0, cat: 'graphics', d: 'Shows the turtle arrow again.', f: (a, ctx) => { T(ctx.r).visible = true; syncTurtle(ctx.r); return null; } });
B({ n: 'pen_color', es: 'color_lapiz', p: 'color', min: 1, cat: 'graphics', d: 'Sets the line color: a name such as "teal" or a code such as "#1a9e8f".',
  f: (a, ctx) => { T(ctx.r).color = needText(ctx, a[0], 'the color'); return null; } });
B({ n: 'pen_size', es: 'grosor_lapiz', p: 'width', min: 1, cat: 'graphics', d: 'Sets the line width.', f: (a, ctx) => { T(ctx.r).size = Math.max(0.5, needNum(ctx, a[0], 'the width')); return null; } });
B({ n: 'fill_color', es: 'color_relleno', p: 'color', min: 1, cat: 'graphics', d: 'Sets the fill color for circles and rectangles. Use "none" for no fill.',
  f: (a, ctx) => { const c = needText(ctx, a[0], 'the color'); T(ctx.r).fill = c === 'none' ? null : c; return null; } });
B({ n: 'circle', es: 'circulo', p: 'x, y, radius', min: 3, cat: 'graphics', d: 'Draws a circle centred on (x, y).',
  f: (a, ctx) => { const t = T(ctx.r); ctx.r.host.gfx.circle(needNum(ctx, a[0], 'x'), needNum(ctx, a[1], 'y'), Math.abs(needNum(ctx, a[2], 'the radius')), t.color, t.fill, t.size); ctx.r.touch(); return null; } });
B({ n: 'rect', es: 'rectangulo', p: 'x, y, width, height', min: 4, cat: 'graphics', d: 'Draws a rectangle whose top-left corner is at (x, y).',
  f: (a, ctx) => { const t = T(ctx.r); ctx.r.host.gfx.rect(needNum(ctx, a[0], 'x'), needNum(ctx, a[1], 'y'), needNum(ctx, a[2], 'the width'), needNum(ctx, a[3], 'the height'), t.color, t.fill, t.size); ctx.r.touch(); return null; } });
B({ n: 'line', es: 'linea', p: 'x1, y1, x2, y2', min: 4, cat: 'graphics', d: 'Draws a straight line between two points.',
  f: (a, ctx) => { const t = T(ctx.r); ctx.r.host.gfx.line(needNum(ctx, a[0], 'x1'), needNum(ctx, a[1], 'y1'), needNum(ctx, a[2], 'x2'), needNum(ctx, a[3], 'y2'), t.color, t.size); ctx.r.touch(); return null; } });
B({ n: 'write', es: 'escribir', p: 'x, y, text', min: 3, cat: 'graphics', d: 'Writes text on the canvas at (x, y).',
  f: (a, ctx) => { const t = T(ctx.r); ctx.r.host.gfx.text(needNum(ctx, a[0], 'x'), needNum(ctx, a[1], 'y'), show(a[2], ctx.r.ed), t.color); ctx.r.touch(); return null; } });
B({ n: 'clear', es: 'borrar', p: '', min: 0, cat: 'graphics', d: 'Clears the canvas.', f: (a, ctx) => { ctx.r.host.gfx.clear(); ctx.r.touch(); return null; } });

// ---------- UI widgets ----------
const WIDGET_ATTRS = [{ n: 'value', es: 'valor' }, { n: 'text', es: 'texto' }, { n: 'visible', es: 'visible' }, { n: 'enabled', es: 'activo' }];
REG.classes.push({
  n: 'Widget', es: 'Control', hidden: true, attrs: WIDGET_ATTRS, methods: [],
  hooks: {
    get(o, name, r) {
      const w = o.native; if (!w) return undefined;
      if (name === 'value') {
        const raw = r.host.ui.read(w.h, 'value');
        if (w.kind === 'number_box' || w.kind === 'slider') { if (raw === '' || raw === null || raw === undefined) return null; const x = Number(raw); return isNaN(x) ? null : numOut(x); }
        if (w.kind === 'checkbox') return !!raw;
        return raw === undefined ? w.props.value : raw;
      }
      if (name === 'text' || name === 'visible' || name === 'enabled') return w.props[name];
      return undefined;
    },
    set(o, name, v, r) {
      const w = o.native; if (!w) return false;
      if (!['value', 'text', 'visible', 'enabled'].includes(name)) return false;
      if ((name === 'visible' || name === 'enabled') && typeof v !== 'boolean') throw new LangError('E219', { fn: name, msg: r.L('must be TRUE or FALSE.', 'debe ser VERDADERO o FALSO.') }, r.curLine);
      const val = name === 'text' ? show(v, r.ed) : (name === 'value' ? toJS(v) : v);
      w.props[name] = val;
      r.host.ui.update(w.h, name, val);
      r.touch();
      return true;
    }
  }
});
function makeWidget(ctx, kind, props) {
  const r = ctx.r;
  const cls = r.nativeNames.get('widget');
  const o = new Obj(cls);
  props = Object.assign({ visible: true, enabled: true }, props);
  o.native = { kind, props, h: r.host.ui.create(kind, props) };
  o.attrs.set('kind', kind);
  r.touch();
  return o;
}
B({ n: 'button', es: 'boton', p: 'caption', min: 1, cat: 'ui', d: 'Adds a button. Use on_click to choose what it does.', f: (a, ctx) => makeWidget(ctx, 'button', { text: show(a[0], ctx.r.ed) }) });
B({ n: 'label', es: 'etiqueta', p: 'text', min: 1, cat: 'ui', d: 'Adds a line of text that the program can change with .text.', f: (a, ctx) => makeWidget(ctx, 'label', { text: show(a[0], ctx.r.ed) }) });
B({ n: 'input_box', es: 'caja_texto', p: 'placeholder', min: 0, max: 1, cat: 'ui', d: 'Adds a text box. Read what was typed with .value.', f: (a, ctx) => makeWidget(ctx, 'input_box', { text: a.length ? show(a[0], ctx.r.ed) : '', value: '' }) });
B({ n: 'number_box', es: 'caja_numero', p: 'placeholder', min: 0, max: 1, cat: 'ui', d: 'Adds a box for numbers. .value is a number, or NOTHING when empty.', f: (a, ctx) => makeWidget(ctx, 'number_box', { text: a.length ? show(a[0], ctx.r.ed) : '', value: '' }) });
B({ n: 'slider', es: 'deslizador', p: 'min, max', min: 2, cat: 'ui', d: 'Adds a slider between two whole numbers.',
  f: (a, ctx) => { const lo = needWhole(ctx, a[0], 'min'), hi = needWhole(ctx, a[1], 'max'); return makeWidget(ctx, 'slider', { min: lo, max: hi, value: lo, text: '' }); } });
B({ n: 'dropdown', es: 'desplegable', p: 'options', min: 1, cat: 'ui', d: 'Adds a drop-down list of options. .value is the chosen option.',
  f: (a, ctx) => { const xs = needList(ctx, a[0], 'the options').map(x => show(x, ctx.r.ed)); return makeWidget(ctx, 'dropdown', { options: xs, value: xs[0] || '', text: '' }); } });
B({ n: 'checkbox', es: 'casilla', p: 'caption', min: 1, cat: 'ui', d: 'Adds a checkbox. .value is TRUE when ticked.', f: (a, ctx) => makeWidget(ctx, 'checkbox', { text: show(a[0], ctx.r.ed), value: false }) });
function bindWidget(ctx, a, ev) {
  const w = a[0];
  if (!(w instanceof Obj) || !w.native || w.native.h === undefined) throw E(ctx, 'the first value must be a button, box or other control.', 'el primer valor debe ser un botón, una caja u otro control.');
  const fn = needFunc(ctx, a[1]);
  const r = ctx.r; r.listeners++;
  if (r.host.ui.bind) r.host.ui.bind(w.native.h, ev, () => r.enqueue(fn, []));
  return null;
}
B({ n: 'on_click', es: 'al_hacer_clic', p: 'control, function', min: 2, cat: 'ui', d: 'Runs the function whenever the control is clicked.', f: (a, ctx) => bindWidget(ctx, a, 'click') });
B({ n: 'on_change', es: 'al_cambiar', p: 'control, function', min: 2, cat: 'ui', d: 'Runs the function whenever the control\'s value changes.', f: (a, ctx) => bindWidget(ctx, a, 'change') });

// ---------- web (offline samples) ----------
function sampleFetch(ctx, url) {
  const u = needText(ctx, url, 'the address').trim();
  const m = u.match(/^sample:([\w-]+)(\/.*)?$/i);
  if (!m) {
    let host = u; try { host = new URL(u).host; } catch (e) {}
    ctx.r.credits.add('api:' + host);
    throw new LangError('E220', { url: u }, ctx.line);
  }
  const key = m[1].toLowerCase();
  const s = SAMPLES.web[key] || (SAMPLES.data[key] ? { json: SAMPLES.data[key] } : null);
  if (!s) throw new LangError('E221', { name: u, hint: ctx.r.L(' Samples: ', ' Ejemplos: ') + Object.keys(SAMPLES.web).map(k => 'sample:' + k).join(', ') }, ctx.line);
  ctx.r.credits.add('sample:' + key);
  return typeof s.json === 'function' ? s.json(m[2] || '') : JSON.parse(JSON.stringify(s.json));
}
B({ n: 'get_json', es: 'obtener_json', p: 'address', min: 1, cat: 'web', d: 'Gets data from a web API as dictionaries and lists. This offline app answers sample: addresses.',
  f: (a, ctx) => fromJS(sampleFetch(ctx, a[0])) });
B({ n: 'get_text', es: 'obtener_texto', p: 'address', min: 1, cat: 'web', d: 'Gets a web page or file as text.',
  f: (a, ctx) => { const v = sampleFetch(ctx, a[0]); return typeof v === 'string' ? v : JSON.stringify(v); } });
B({ n: 'post_json', es: 'enviar_json', p: 'address, data', min: 2, cat: 'web', d: 'Sends data to a web API. Only sample:echo works offline; it returns what you sent.',
  f: (a, ctx) => { const u = needText(ctx, a[0], 'the address'); if (!/^sample:echo/i.test(u)) throw new LangError('E220', { url: u }, ctx.line); return fromJS({ status: 200, received: toJS(a[1]) }); } });

// ---------- files ----------
function fileGet(ctx, name) {
  const r = ctx.r;
  const n = needText(ctx, name, 'the file name');
  const m = n.match(/^sample:([\w-]+)$/i);
  if (m) {
    const k = m[1].toLowerCase();
    if (SAMPLES.csv[k]) { r.credits.add('sample:' + k); return SAMPLES.csv[k]; }
    throw new LangError('E221', { name: n, hint: r.L(' Sample datasets: ', ' Datos de ejemplo: ') + Object.keys(SAMPLES.csv).map(k => 'sample:' + k).join(', ') }, ctx.line);
  }
  if (!r.files.has(n)) {
    const names = [...r.files.keys()].filter(x => x !== 'main.bl');
    throw new LangError('E221', { name: n, hint: names.length ? r.L(' Files: ', ' Archivos: ') + names.join(', ') : '' }, ctx.line);
  }
  r.credits.add('file:' + n);
  return r.files.get(n);
}
function fileSet(ctx, name, text) {
  const n = needText(ctx, name, 'the file name');
  if (n === 'main.bl' || /^sample:/i.test(n)) throw E(ctx, 'choose another file name.', 'elige otro nombre de archivo.');
  if (text.length > 1024 * 1024) throw E(ctx, 'files can be at most 1 MB.', 'los archivos pueden tener como máximo 1 MB.');
  ctx.r.files.set(n, text);
  if (ctx.r.host.fileChanged) ctx.r.host.fileChanged(n, text);
}
function parseCSV(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => !(r.length === 1 && r[0] === ''));
}
function autoType(s) {
  const t = s.trim();
  if (/^[-+]?\d+$/.test(t) && t.length < 16) return parseInt(t, 10);
  if (/^[-+]?(\d+\.\d*|\.\d+|\d+)([eE][-+]?\d+)?$/.test(t)) return new Dec(parseFloat(t));
  return s;
}
function csvToRows(text) {
  const rows = parseCSV(text);
  if (!rows.length) return [];
  const head = rows[0].map(h => h.trim());
  return rows.slice(1).map(r => { const m = new Map(); head.forEach((h, i) => m.set(h, autoType(r[i] === undefined ? '' : r[i]))); return m; });
}
function rowsToCSV(rows, ed) {
  const cols = [];
  for (const r of rows) for (const k of r.keys()) if (!cols.includes(k)) cols.push(k);
  const esc = (v) => { const s = v === null || v === undefined ? '' : show(v, ed); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  return [cols.map(esc).join(','), ...rows.map(r => cols.map(c => esc(r.has(c) ? r.get(c) : '')).join(','))].join('\n');
}
B({ n: 'load_csv', es: 'cargar_csv', p: 'file', min: 1, cat: 'data', d: 'Loads a CSV file (or a sample: dataset) as a list of dictionaries, one per row. Numbers are detected automatically.',
  f: (a, ctx) => csvToRows(fileGet(ctx, a[0])) });
B({ n: 'save_csv', es: 'guardar_csv', p: 'file, rows', min: 2, cat: 'data', d: 'Saves a list of dictionaries as a CSV file in the project.',
  f: (a, ctx) => { fileSet(ctx, a[0], rowsToCSV(needRows(ctx, a[1]), ctx.r.ed)); return null; } });
B({ n: 'save_text', es: 'guardar_texto', p: 'file, text', min: 2, cat: 'data', d: 'Saves text as a file in the project.',
  f: (a, ctx) => { fileSet(ctx, a[0], show(a[1], ctx.r.ed)); return null; } });
B({ n: 'load_text', es: 'cargar_texto', p: 'file', min: 1, cat: 'data', d: 'Loads a project file as text.', f: (a, ctx) => fileGet(ctx, a[0]) });
B({ n: 'list_files', es: 'listar_archivos', p: '', min: 0, cat: 'data', d: 'The names of the files in this project.', f: (a, ctx) => [...ctx.r.files.keys()].filter(x => x !== 'main.bl') });

// ---------- data tools ----------
const MISSING = ['', 'N/A', 'NA', 'n/a', 'na', '-', 'null', 'NULL'];
function isMissingV(v) { return v === null || v === undefined || (isText(v) && MISSING.includes(v.trim())); }
function colOf(ctx, rows, col) {
  const c = needText(ctx, col, 'the column name');
  if (rows.length && !rows.some(r => r.has(c))) {
    const cols = [...rows[0].keys()];
    const s = closest(c, cols);
    throw E(ctx, `there is no column "${c}". Columns: ${cols.join(', ')}.${s ? ` Did you mean "${s}"?` : ''}`, `no hay ninguna columna "${c}". Columnas: ${cols.join(', ')}.${s ? ` ¿Querías decir "${s}"?` : ''}`);
  }
  return c;
}
function cmpVals(ctx, a, b) {
  const ma = isMissingV(a), mb = isMissingV(b);
  if (ma || mb) return ma === mb ? 0 : ma ? 1 : -1;
  if (isNum(a) && isNum(b)) return nv(a) - nv(b);
  if (isText(a) && isText(b)) return a < b ? -1 : a > b ? 1 : 0;
  if (typeof a === 'boolean' && typeof b === 'boolean') return (a ? 1 : 0) - (b ? 1 : 0);
  throw new LangError('E222', { a: aTypeName(a, ctx.r.ed), b: aTypeName(b, ctx.r.ed) }, ctx.line);
}
function numsOf(ctx, xs) {
  const out = [];
  for (const x of needList(ctx, xs, 'the value')) { if (isMissingV(x)) continue; if (!isNum(x)) throw E(ctx, `every value must be a number, but found ${describeValue(x, ctx.r.ed)}.`, `todos los valores deben ser números, pero encontré ${describeValue(x, ctx.r.ed)}.`); out.push(nv(x)); }
  return out;
}
function statMean(xs) { return xs.reduce((s, x) => s + x, 0) / xs.length; }
function statMedian(xs) { const s = xs.slice().sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
function statMode(vals) { const c = new Map(); let best = null, bc = 0; for (const v of vals) { const k = isNum(v) ? nv(v) : v; const n = (c.get(k) || 0) + 1; c.set(k, n); if (n > bc) { bc = n; best = v; } } return best; }
function statStdev(xs) { if (xs.length < 2) return 0; const m = statMean(xs); return Math.sqrt(xs.reduce((s, x) => s + (x - m) * (x - m), 0) / (xs.length - 1)); }
B({ n: 'show_table', es: 'mostrar_tabla', p: 'rows', min: 1, cat: 'data', d: 'Shows a list of dictionaries (or a list of lists) as a table in the output.',
  f: (a, ctx) => { const v = needList(ctx, a[0], 'the rows'); ctx.r.host.table(v, ctx.r.ed); ctx.r.touch(); return null; } });
B({ n: 'describe', es: 'describir', p: 'rows', min: 1, cat: 'data', d: 'Shows each column with its detected type, how many values are missing, and its range. A start for a data dictionary.',
  f: (a, ctx) => {
    const rows = needRows(ctx, a[0]); const cols = [];
    for (const r of rows) for (const k of r.keys()) if (!cols.includes(k)) cols.push(k);
    const out = cols.map(c => {
      const vals = rows.map(r => r.get(c));
      const present = vals.filter(v => !isMissingV(v));
      const kinds = new Set(present.map(v => typeKey(v)));
      let kind = kinds.size === 0 ? 'nothing' : kinds.size === 1 ? [...kinds][0] : (kinds.has('text') ? 'mixed' : (kinds.has('decimal') ? 'decimal' : 'mixed'));
      const kindName = kind === 'mixed' ? ctx.r.L('mixed', 'mixto') : TYPE_NAMES[kind][ED_INDEX[ctx.r.ed]];
      const m = new Map([['column', c], ['type', kindName], ['count', present.length], ['missing', vals.length - present.length]]);
      if (present.length && present.every(isNum)) { const xs = present.map(nv); m.set('min', numOut(Math.min(...xs))); m.set('max', numOut(Math.max(...xs))); }
      else { const u = [...new Set(present.map(v => show(v, ctx.r.ed)))]; m.set('distinct', u.length); m.set('examples', u.slice(0, 3).join(' | ')); }
      return m;
    });
    ctx.r.host.table(out, ctx.r.ed); ctx.r.touch();
    return out;
  } });
B({ n: 'column', es: 'columna', p: 'rows, column', min: 2, cat: 'data', d: 'All the values of one column, as a list.',
  f: (a, ctx) => { const rows = needRows(ctx, a[0]); const c = colOf(ctx, rows, a[1]); return rows.map(r => (r.has(c) ? r.get(c) : null)); } });
B({ n: 'select', es: 'seleccionar', p: 'rows, columns', min: 2, cat: 'data', d: 'New rows with only the listed columns.',
  f: (a, ctx) => { const rows = needRows(ctx, a[0]); const cs = needList(ctx, a[1], 'the columns').map(c => colOf(ctx, rows, c)); return rows.map(r => new Map(cs.map(c => [c, r.has(c) ? r.get(c) : null]))); } });
B({ n: 'unique', es: 'unicos', p: 'list', min: 1, cat: 'data', d: 'The list without repeated values, in first-seen order.',
  f: (a, ctx) => { const out = []; for (const x of needList(ctx, a[0], 'the value')) if (!out.some(y => eq(x, y))) out.push(x); return out; } });
B({ n: 'sort_by', es: 'ordenar_por', p: 'rows, column, order = "asc"', min: 2, max: 3, cat: 'data', d: 'New rows sorted by a column. Use "desc" for largest first. Missing values go last.',
  f: (a, ctx) => {
    const rows = needRows(ctx, a[0]); const c = colOf(ctx, rows, a[1]);
    const ord = a.length > 2 ? needText(ctx, a[2], 'the order').toLowerCase() : 'asc';
    if (!['asc', 'desc'].includes(ord)) throw E(ctx, 'the order must be "asc" or "desc".', 'el orden debe ser "asc" o "desc".');
    const s = ord === 'desc' ? -1 : 1;
    return rows.map((r, i) => [r, i]).sort((x, y) => {
      const va = x[0].get(c), vb = y[0].get(c);
      if (isMissingV(va) || isMissingV(vb)) return (isMissingV(va) ? 1 : 0) - (isMissingV(vb) ? 1 : 0) || x[1] - y[1];
      return s * cmpVals(ctx, va, vb) || x[1] - y[1];
    }).map(x => x[0]);
  } });
B({ n: 'where', es: 'donde', p: 'rows, column, operator, value', min: 4, cat: 'data', d: 'Rows where the column matches, for example where(rows, "score", ">=", 50). Operators: == != < > <= >= contains.',
  f: (a, ctx) => {
    const rows = needRows(ctx, a[0]); const c = colOf(ctx, rows, a[1]); const op = needText(ctx, a[2], 'the operator'); const v = a[3];
    const ops = ['==', '!=', '<', '>', '<=', '>=', 'contains'];
    if (!ops.includes(op)) throw E(ctx, `the operator must be one of ${ops.join(' ')}.`, `el operador debe ser uno de ${ops.join(' ')}.`);
    return rows.filter(r => {
      const x = r.get(c);
      if (op === '==') return eq(x, v); if (op === '!=') return !eq(x, v);
      if (op === 'contains') return isText(x) && x.toLowerCase().includes(show(v, ctx.r.ed).toLowerCase());
      if (isMissingV(x)) return false;
      const d = cmpVals(ctx, x, v);
      return op === '<' ? d < 0 : op === '>' ? d > 0 : op === '<=' ? d <= 0 : d >= 0;
    });
  } });
B({ n: 'filter_rows', es: 'filtrar_filas', p: 'rows, test_function', min: 2, cat: 'data', gen: true, d: 'Rows for which your function returns TRUE. The function receives one row.',
  f: function* (a, ctx) {
    const rows = needList(ctx, a[0], 'the rows'); const fn = needFunc(ctx, a[1]); const out = [];
    for (const r of rows) { const v = yield* ctx.r.call(fn, [r], ctx.node, ctx.f); if (typeof v !== 'boolean') throw E(ctx, 'the test function must RETURN TRUE or FALSE.', 'la función de prueba debe DEVOLVER VERDADERO o FALSO.'); if (v) out.push(r); }
    return out;
  } });
B({ n: 'group_by', es: 'agrupar_por', p: 'rows, column', min: 2, cat: 'data', d: 'A dictionary from each value of the column to the list of rows that have it.',
  f: (a, ctx) => { const rows = needRows(ctx, a[0]); const c = colOf(ctx, rows, a[1]); const m = new Map(); for (const r of rows) { let k = r.get(c); if (isMissingV(k)) k = ''; k = isWhole(k) || isText(k) ? k : show(k, ctx.r.ed); if (!m.has(k)) m.set(k, []); m.get(k).push(r); } return m; } });
B({ n: 'count_by', es: 'contar_por', p: 'rows, column', min: 2, cat: 'data', d: 'A dictionary from each value of the column to how many rows have it.',
  f: (a, ctx) => { const rows = needRows(ctx, a[0]); const c = colOf(ctx, rows, a[1]); const m = new Map(); for (const r of rows) { let k = r.get(c); if (isMissingV(k)) k = ''; k = isWhole(k) || isText(k) ? k : show(k, ctx.r.ed); m.set(k, (m.get(k) || 0) + 1); } return m; } });
B({ n: 'summarize', es: 'resumir', p: 'rows, column', min: 2, cat: 'data', d: 'Count, sum, mean, median, mode, min and max of a number column, as a dictionary.',
  f: (a, ctx) => {
    const rows = needRows(ctx, a[0]); const c = colOf(ctx, rows, a[1]);
    const xs = numsOf(ctx, rows.map(r => r.get(c)));
    const m = new Map([['count', xs.length]]);
    if (!xs.length) return m;
    const sum = xs.reduce((s, x) => s + x, 0);
    m.set('sum', numOut(sum)); m.set('mean', new Dec(Math.round(statMean(xs) * 1e6) / 1e6)); m.set('median', numOut(statMedian(xs)));
    m.set('mode', numOut(statMode(xs))); m.set('min', numOut(Math.min(...xs))); m.set('max', numOut(Math.max(...xs)));
    return m;
  } });
B({ n: 'mean', es: 'media', p: 'list', min: 1, cat: 'data', d: 'The average of a list of numbers (missing values skipped).', f: (a, ctx) => { const xs = numsOf(ctx, a[0]); if (!xs.length) throw E(ctx, 'the list has no numbers.', 'la lista no tiene números.'); return new Dec(statMean(xs)); } });
B({ n: 'median', es: 'mediana', p: 'list', min: 1, cat: 'data', d: 'The middle value of a list of numbers.', f: (a, ctx) => { const xs = numsOf(ctx, a[0]); if (!xs.length) throw E(ctx, 'the list has no numbers.', 'la lista no tiene números.'); return numOut(statMedian(xs)); } });
B({ n: 'mode', es: 'moda', p: 'list', min: 1, cat: 'data', d: 'The most common value in a list.', f: (a, ctx) => { const xs = needList(ctx, a[0], 'the value').filter(x => !isMissingV(x)); if (!xs.length) throw E(ctx, 'the list is empty.', 'la lista está vacía.'); return statMode(xs); } });
B({ n: 'stdev', es: 'desviacion', p: 'list', min: 1, cat: 'data', d: 'The sample standard deviation: how spread out the numbers are.', f: (a, ctx) => new Dec(statStdev(numsOf(ctx, a[0]))) });
B({ n: 'is_missing', es: 'es_vacio', p: 'value', min: 1, cat: 'data', d: 'TRUE for NOTHING, empty text and markers such as "N/A".', f: (a) => isMissingV(a[0]) });
B({ n: 'drop_missing', es: 'quitar_vacios', p: 'rows, column', min: 2, cat: 'data', d: 'New rows without the ones where the column is missing.',
  f: (a, ctx) => { const rows = needRows(ctx, a[0]); const c = colOf(ctx, rows, a[1]); return rows.filter(r => !isMissingV(r.get(c))); } });
B({ n: 'fill_missing', es: 'rellenar_vacios', p: 'rows, column, value', min: 3, cat: 'data', d: 'New rows where missing values in the column are replaced.',
  f: (a, ctx) => { const rows = needRows(ctx, a[0]); const c = colOf(ctx, rows, a[1]); return rows.map(r => { const m = new Map(r); if (isMissingV(m.get(c))) m.set(c, a[2]); return m; }); } });
B({ n: 'dedupe', es: 'quitar_duplicados', p: 'rows', min: 1, cat: 'data', d: 'New rows with exact duplicate rows removed.',
  f: (a, ctx) => { const rows = needRows(ctx, a[0]); const out = []; for (const r of rows) if (!out.some(x => eq(x, r))) out.push(r); return out; } });
B({ n: 'rename_column', es: 'renombrar_columna', p: 'rows, old, new', min: 3, cat: 'data', d: 'New rows with a column renamed.',
  f: (a, ctx) => { const rows = needRows(ctx, a[0]); const o = colOf(ctx, rows, a[1]); const nn = needText(ctx, a[2], 'the new name'); return rows.map(r => new Map([...r].map(([k, v]) => [k === o ? nn : k, v]))); } });
B({ n: 'convert_column', es: 'convertir_columna', p: 'rows, column, "number" or "text"', min: 3, cat: 'data', d: 'New rows with a column converted. Values that cannot be converted become NOTHING.',
  f: (a, ctx) => {
    const rows = needRows(ctx, a[0]); const c = colOf(ctx, rows, a[1]); const kind = needText(ctx, a[2], 'the kind').toLowerCase();
    if (!['number', 'text', 'numero', 'número', 'texto'].includes(kind)) throw E(ctx, 'the kind must be "number" or "text".', 'el tipo debe ser "number" o "text".');
    const toNum = kind.startsWith('n');
    return rows.map(r => { const m = new Map(r); const v = m.get(c); if (toNum) { if (isNum(v)) return m; const t = isText(v) ? v.trim().replace(',', '.') : ''; const x = autoType(t); m.set(c, isNum(x) ? x : null); } else m.set(c, isMissingV(v) ? '' : show(v, ctx.r.ed)); return m; });
  } });
B({ n: 'clean_text', es: 'limpiar_texto', p: 'text', min: 1, cat: 'data', d: 'Trims the text and turns runs of spaces, tabs and new lines into single spaces.',
  f: (a, ctx) => needText(ctx, a[0], 'the value').replace(/\s+/g, ' ').trim() });
B({ n: 'remove_punctuation', es: 'quitar_puntuacion', p: 'text', min: 1, cat: 'data', d: 'The text without punctuation marks.',
  f: (a, ctx) => needText(ctx, a[0], 'the value').replace(/[\p{P}\p{S}]/gu, '') });
B({ n: 'words', es: 'palabras', p: 'text', min: 1, cat: 'data', d: 'The words of a text in lower case, without punctuation.',
  f: (a, ctx) => needText(ctx, a[0], 'the value').toLowerCase().replace(/[\p{P}\p{S}]/gu, ' ').split(/\s+/).filter(Boolean) });
B({ n: 'word_counts', es: 'contar_palabras', p: 'text', min: 1, cat: 'data', d: 'A dictionary from each word to how many times it appears, most common first.',
  f: (a, ctx) => { const ws = needText(ctx, a[0], 'the value').toLowerCase().replace(/[\p{P}\p{S}]/gu, ' ').split(/\s+/).filter(Boolean); const m = new Map(); for (const w of ws) m.set(w, (m.get(w) || 0) + 1); return new Map([...m].sort((x, y) => y[1] - x[1])); } });
B({ n: 'to_number', es: 'a_numero', p: 'text, default', min: 2, cat: 'data', d: 'Converts text to a number, or gives the default when it cannot.',
  f: (a) => { const v = a[0]; if (isNum(v)) return v; if (!isText(v)) return a[1]; const x = autoType(v.trim()); return isNum(x) ? x : a[1]; } });
function chartOut(ctx, spec, summaryEn, summaryEs) {
  const r = ctx.r;
  spec.summary = r.ed === 'es' ? summaryEs : summaryEn;
  r.host.gfx.chart(spec);
  if (r.host.note) r.host.note((r.ed === 'es' ? 'Gráfico: ' : 'Chart: ') + spec.summary);
  r.touch();
  return null;
}
B({ n: 'bar_chart', es: 'grafico_barras', p: 'labels, values, title = ""', min: 2, max: 3, cat: 'data', d: 'Draws a bar chart on the canvas.',
  f: (a, ctx) => {
    const labels = needList(ctx, a[0], 'the labels').map(x => show(x, ctx.r.ed)); const ys = numsOf(ctx, a[1]);
    if (labels.length !== ys.length) throw E(ctx, 'labels and values must have the same length.', 'las etiquetas y los valores deben tener la misma longitud.');
    const title = a.length > 2 ? show(a[2], ctx.r.ed) : '';
    const mi = ys.indexOf(Math.max(...ys));
    return chartOut(ctx, { kind: 'bar', labels, ys, title }, `${title || 'Bar chart'}: ${labels.length} bars, highest is ${labels[mi]} at ${fmtNum(ys[mi])}.`, `${title || 'Gráfico de barras'}: ${labels.length} barras, la más alta es ${labels[mi]} con ${fmtNum(ys[mi])}.`);
  } });
function fmtNum(x) { return Number.isInteger(x) ? String(x) : String(Math.round(x * 100) / 100); }
function xyChart(kind) {
  return (a, ctx) => {
    const xs = numsOf(ctx, a[0]), ys = numsOf(ctx, a[1]);
    if (xs.length !== ys.length) throw E(ctx, 'x and y lists must have the same length.', 'las listas x e y deben tener la misma longitud.');
    if (!xs.length) throw E(ctx, 'there is nothing to draw.', 'no hay nada que dibujar.');
    const title = a.length > 2 ? show(a[2], ctx.r.ed) : '';
    const trend = ys.length > 1 ? (ys[ys.length - 1] > ys[0] ? ['rises', 'sube'] : ys[ys.length - 1] < ys[0] ? ['falls', 'baja'] : ['stays level', 'se mantiene']) : ['has one point', 'tiene un punto'];
    return chartOut(ctx, { kind, xs, ys, title }, `${title || (kind === 'line' ? 'Line chart' : 'Scatter chart')}: ${xs.length} points, y from ${fmtNum(Math.min(...ys))} to ${fmtNum(Math.max(...ys))}${kind === 'line' ? ', ' + trend[0] + ' overall' : ''}.`,
      `${title || (kind === 'line' ? 'Gráfico de líneas' : 'Gráfico de dispersión')}: ${xs.length} puntos, y de ${fmtNum(Math.min(...ys))} a ${fmtNum(Math.max(...ys))}${kind === 'line' ? ', en general ' + trend[1] : ''}.`);
  };
}
B({ n: 'line_chart', es: 'grafico_lineas', p: 'xs, ys, title = ""', min: 2, max: 3, cat: 'data', d: 'Draws a line chart on the canvas.', f: xyChart('line') });
B({ n: 'scatter_chart', es: 'grafico_dispersion', p: 'xs, ys, title = ""', min: 2, max: 3, cat: 'data', d: 'Draws a scatter chart on the canvas.', f: xyChart('scatter') });
B({ n: 'histogram', es: 'histograma', p: 'values, bins, title = ""', min: 2, max: 3, cat: 'data', d: 'Draws a histogram: how many values fall in each range.',
  f: (a, ctx) => {
    const xs = numsOf(ctx, a[0]); const bins = needWhole(ctx, a[1], 'bins'); if (bins < 1 || bins > 50) throw E(ctx, 'use 1 to 50 bins.', 'usa de 1 a 50 intervalos.');
    if (!xs.length) throw E(ctx, 'there is nothing to draw.', 'no hay nada que dibujar.');
    const lo = Math.min(...xs), hi = Math.max(...xs), w = (hi - lo) / bins || 1;
    const counts = new Array(bins).fill(0);
    for (const x of xs) counts[Math.min(bins - 1, Math.floor((x - lo) / w))]++;
    const labels = counts.map((_, i) => fmtNum(lo + i * w) + '–' + fmtNum(lo + (i + 1) * w));
    const title = a.length > 2 ? show(a[2], ctx.r.ed) : '';
    const mi = counts.indexOf(Math.max(...counts));
    return chartOut(ctx, { kind: 'bar', labels, ys: counts, title, hist: true }, `${title || 'Histogram'}: ${xs.length} values in ${bins} ranges, most in ${labels[mi]}.`, `${title || 'Histograma'}: ${xs.length} valores en ${bins} intervalos, la mayoría en ${labels[mi]}.`);
  } });

// ---------- text methods ----------
const tm = (spec) => M(REG.text, spec);
tm({ n: 'upper', es: 'mayusculas', p: '', min: 0, d: 'The text in capital letters.', f: (s) => s.toUpperCase() });
tm({ n: 'lower', es: 'minusculas', p: '', min: 0, d: 'The text in small letters.', f: (s) => s.toLowerCase() });
tm({ n: 'title', es: 'titulo', p: '', min: 0, d: 'The text with each word starting with a capital.', f: (s) => s.toLowerCase().replace(/(^|[^\p{L}])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()) });
tm({ n: 'trim', es: 'recortar', p: '', min: 0, d: 'The text without spaces at the start and end.', f: (s) => s.trim() });
tm({ n: 'trim_start', es: 'recortar_inicio', p: '', min: 0, d: 'The text without spaces at the start.', f: (s) => s.replace(/^\s+/, '') });
tm({ n: 'trim_end', es: 'recortar_final', p: '', min: 0, d: 'The text without spaces at the end.', f: (s) => s.replace(/\s+$/, '') });
tm({ n: 'split', es: 'dividir', p: 'separator', min: 0, max: 1, d: 'A list of the parts between separators. With no separator, splits at spaces.',
  f: (s, a, ctx) => { if (!a.length) return s.split(/\s+/).filter(Boolean); const sep = needText(ctx, a[0], 'the separator'); if (sep === '') throw E(ctx, 'the separator can\'t be empty.', 'el separador no puede estar vacío.'); return s.split(sep); } });
tm({ n: 'split_lines', es: 'dividir_lineas', p: '', min: 0, d: 'A list of the lines of the text.', f: (s) => s.split(/\r?\n/) });
tm({ n: 'contains', es: 'contiene', p: 'part', min: 1, d: 'TRUE if the part appears in the text.', f: (s, a, ctx) => s.includes(needText(ctx, a[0], 'the part')) });
tm({ n: 'starts_with', es: 'empieza_con', p: 'part', min: 1, d: 'TRUE if the text starts with the part.', f: (s, a, ctx) => s.startsWith(needText(ctx, a[0], 'the part')) });
tm({ n: 'ends_with', es: 'termina_con', p: 'part', min: 1, d: 'TRUE if the text ends with the part.', f: (s, a, ctx) => s.endsWith(needText(ctx, a[0], 'the part')) });
tm({ n: 'find', es: 'buscar', p: 'part', min: 1, d: 'The position of the part in the text, or -1 if it is not there.', f: (s, a, ctx) => s.indexOf(needText(ctx, a[0], 'the part')) });
tm({ n: 'count', es: 'contar', p: 'part', min: 1, d: 'How many times the part appears.', f: (s, a, ctx) => { const p = needText(ctx, a[0], 'the part'); if (!p) return s.length + 1; return s.split(p).length - 1; } });
tm({ n: 'replace', es: 'reemplazar', p: 'old, new', min: 2, d: 'The text with every old part replaced by the new one.', f: (s, a, ctx) => s.split(needText(ctx, a[0], 'the old part')).join(show(a[1], ctx.r.ed)) });
tm({ n: 'repeat', es: 'repetir', p: 'times', min: 1, d: 'The text repeated this many times.', f: (s, a, ctx) => { const n = needWhole(ctx, a[0], 'times'); return n > 0 ? s.repeat(n) : ''; } });
tm({ n: 'is_number', es: 'es_numero', p: '', min: 0, d: 'TRUE if the text is a number such as "12", "-3.5" or " 7 ".', f: (s) => /^\s*[-+]?(\d+(\.\d+)?|\.\d+)\s*$/.test(s) });
tm({ n: 'is_letters', es: 'es_letras', p: '', min: 0, d: 'TRUE if the text has only letters.', f: (s) => /^\p{L}+$/u.test(s) });
tm({ n: 'is_digits', es: 'es_digitos', p: '', min: 0, d: 'TRUE if the text has only digits 0 to 9.', f: (s) => /^[0-9]+$/.test(s) });
tm({ n: 'is_blank', es: 'esta_vacio', p: '', min: 0, d: 'TRUE if the text is empty or only spaces.', f: (s) => s.trim() === '' });
tm({ n: 'pad_left', es: 'rellenar_izquierda', p: 'width, fill = " "', min: 1, max: 2, d: 'The text made at least this wide by adding characters on the left.',
  f: (s, a, ctx) => s.padStart(needWhole(ctx, a[0], 'the width'), a.length > 1 ? needText(ctx, a[1], 'the fill') : ' ') });
tm({ n: 'pad_right', es: 'rellenar_derecha', p: 'width, fill = " "', min: 1, max: 2, d: 'The text made at least this wide by adding characters on the right.',
  f: (s, a, ctx) => s.padEnd(needWhole(ctx, a[0], 'the width'), a.length > 1 ? needText(ctx, a[1], 'the fill') : ' ') });

// ---------- list methods ----------
const lm = (spec) => M(REG.list, spec);
lm({ n: 'add', es: 'agregar', p: 'value', min: 1, d: 'Adds a value to the end of the list.', f: (xs, a) => { xs.push(a[0]); return null; } });
lm({ n: 'insert', es: 'insertar', p: 'position, value', min: 2, d: 'Inserts a value at a position, moving the rest along.',
  f: (xs, a, ctx) => { let i = needWhole(ctx, a[0], 'the position'); if (i < 0) i = Math.max(0, xs.length + i); xs.splice(Math.min(i, xs.length), 0, a[1]); return null; } });
lm({ n: 'remove', es: 'quitar', p: 'value', min: 1, d: 'Removes the first item equal to the value.',
  f: (xs, a, ctx) => { const i = xs.findIndex(x => eq(x, a[0])); if (i < 0) throw E(ctx, `${show(a[0], ctx.r.ed, true)} is not in \`${ctx.src}\`.`, `${show(a[0], ctx.r.ed, true)} no está en \`${ctx.src}\`.`); xs.splice(i, 1); return null; } });
lm({ n: 'remove_at', es: 'quitar_en', p: 'position', min: 1, d: 'Removes the item at a position and gives it back.',
  f: (xs, a, ctx) => { const i = ctx.r.normIndex(xs, needWhole(ctx, a[0], 'the position'), { line: ctx.line, o: { src: ctx.src } }); return xs.splice(i, 1)[0]; } });
lm({ n: 'find', es: 'buscar', p: 'value', min: 1, d: 'The position of the first item equal to the value, or -1.', f: (xs, a) => xs.findIndex(x => eq(x, a[0])) });
lm({ n: 'sort', es: 'ordenar', p: '', min: 0, d: 'Sorts the list from smallest to largest (numbers or text, not mixed).',
  f: (xs, a, ctx) => { const s = xs.map((x, i) => [x, i]).sort((p, q) => cmpVals(ctx, p[0], q[0]) || p[1] - q[1]); for (let i = 0; i < s.length; i++) xs[i] = s[i][0]; return null; } });
lm({ n: 'reverse', es: 'invertir', p: '', min: 0, d: 'Reverses the order of the list.', f: (xs) => { xs.reverse(); return null; } });

// ---------- dictionary methods ----------
const dm = (spec) => M(REG.dict, spec);
dm({ n: 'get', es: 'obtener', p: 'key, default = NOTHING', min: 1, max: 2, d: 'The value for the key, or the default if the key is missing.',
  f: (d, a, ctx) => { const k = ctx.r.dictKey(a[0], ctx.line); return d.has(k) ? d.get(k) : (a.length > 1 ? a[1] : null); } });
dm({ n: 'keys', es: 'claves', p: '', min: 0, d: 'A list of the keys.', f: (d) => [...d.keys()] });
dm({ n: 'values', es: 'valores', p: '', min: 0, d: 'A list of the values.', f: (d) => [...d.values()] });
dm({ n: 'remove', es: 'quitar', p: 'key', min: 1, d: 'Removes a key and its value.',
  f: (d, a, ctx) => { const k = ctx.r.dictKey(a[0], ctx.line); if (!d.has(k)) throw new LangError('E232', { key: show(k, ctx.r.ed, true) }, ctx.line); d.delete(k); return null; } });
