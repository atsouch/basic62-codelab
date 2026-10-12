// ===== Core part 3: runtime =====
class Dec { constructor(v) { this.v = v; } }
class Func { constructor(def, cls) { this.def = def; this.name = def.name; this.cls = cls || null; } }
class Builtin { constructor(spec) { Object.assign(this, spec); this.name = spec.n; } }
class NativeMethod { constructor(spec) { Object.assign(this, spec); this.name = spec.n; } }
class Cls {
  constructor(name, parent) {
    this.name = name; this.parent = parent || null; this.methods = new Map(); this.init = null;
    this.native = false; this.def = null; this.hooks = null; this.es = null;
  }
}
let OBJ_ID = 0;
class Obj { constructor(cls) { this.cls = cls; this.attrs = new Map(); this.initDepth = 0; this.native = null; this.oid = ++OBJ_ID; } }
class Bound { constructor(obj, m, owner) { this.obj = obj; this.m = m; this.owner = owner; this.name = m.name; } }
class RetSig { constructor(v) { this.v = v; } }
const BREAK = { sig: 'break' }, CONT = { sig: 'continue' };

const isNum = v => typeof v === 'number' || v instanceof Dec;
const nv = v => (v instanceof Dec ? v.v : v);
const isWhole = v => typeof v === 'number';
const isText = v => typeof v === 'string';
const isList = v => Array.isArray(v);
const isDict = v => v instanceof Map;
const mkNum = (x, whole) => (whole ? x : new Dec(x));

const TYPE_NAMES = {
  whole: ['whole number', 'número entero'], decimal: ['decimal number', 'número decimal'], text: ['text', 'texto'],
  boolean: ['boolean', 'booleano'], nothing: ['nothing', 'nada'], list: ['list', 'lista'], dictionary: ['dictionary', 'diccionario'],
  function: ['function', 'función'], class: ['class', 'clase'], object: ['object', 'objeto']
};
function typeKey(v) {
  if (v === null || v === undefined) return 'nothing';
  if (typeof v === 'number') return 'whole';
  if (v instanceof Dec) return 'decimal';
  if (typeof v === 'string') return 'text';
  if (typeof v === 'boolean') return 'boolean';
  if (Array.isArray(v)) return 'list';
  if (v instanceof Map) return 'dictionary';
  if (v instanceof Func || v instanceof Builtin || v instanceof Bound || v instanceof NativeMethod) return 'function';
  if (v instanceof Cls) return 'class';
  if (v instanceof Obj) return 'object';
  return 'object';
}
function typeName(v, ed) {
  if (v instanceof Obj) return v.cls.name;
  return TYPE_NAMES[typeKey(v)][ED_INDEX[ed] || 0];
}
function aTypeName(v, ed) {
  const t = typeName(v, ed);
  if (v instanceof Obj) return (ed === 'es' ? 'un objeto ' : 'a ') + t;
  if (ed === 'es') return ({ lista: 'una lista', nada: 'NADA', 'número entero': 'un número entero', 'número decimal': 'un número decimal',
    texto: 'texto', booleano: 'un booleano', diccionario: 'un diccionario', 'función': 'una función', clase: 'una clase' })[t] || t;
  if (t === 'nothing') return 'NOTHING';
  if (t === 'text') return 'text';
  return (/^[aeiou]/.test(t) ? 'an ' : 'a ') + t;
}
function fmtDec(x) {
  if (!isFinite(x)) return isNaN(x) ? 'nan' : (x > 0 ? 'inf' : '-inf');
  if (Number.isInteger(x) && Math.abs(x) < 1e16) return x.toFixed(1);
  let s = String(x);
  if (s.includes('e')) { s = x.toExponential().replace(/e\+?/, 'e+').replace('e+-', 'e-'); }
  return s;
}
function show(v, ed, nested, seen) {
  ed = ed || 'en';
  if (v === null || v === undefined) return kwName('nothing', ed);
  if (typeof v === 'number') return Object.is(v, -0) ? '0' : String(v);
  if (v instanceof Dec) return fmtDec(v.v);
  if (typeof v === 'string') return nested ? JSON.stringify(v) : v;
  if (typeof v === 'boolean') return kwName(v ? 'true' : 'false', ed);
  seen = seen || new Set();
  if (Array.isArray(v)) {
    if (seen.has(v)) return '[...]';
    seen.add(v);
    const s = '[' + v.map(x => show(x, ed, true, seen)).join(', ') + ']';
    seen.delete(v); return s;
  }
  if (v instanceof Map) {
    if (seen.has(v)) return '{...}';
    seen.add(v);
    const parts = [];
    for (const [k, x] of v) parts.push(show(k, ed, true, seen) + ': ' + show(x, ed, true, seen));
    seen.delete(v);
    return '{' + parts.join(', ') + '}';
  }
  if (v instanceof Obj) {
    if (seen.has(v)) return v.cls.name + '(...)';
    seen.add(v);
    const parts = [];
    for (const [k, x] of v.attrs) if (!k.startsWith('_')) parts.push(k + '=' + show(x, ed, true, seen));
    seen.delete(v);
    return v.cls.name + '(' + parts.join(', ') + ')';
  }
  if (v instanceof Cls) return '<' + TYPE_NAMES.class[ED_INDEX[ed]] + ' ' + v.name + '>';
  if (v instanceof Func || v instanceof Builtin || v instanceof Bound || v instanceof NativeMethod) return '<' + TYPE_NAMES.function[ED_INDEX[ed]] + ' ' + v.name + '>';
  return String(v);
}
function describeValue(v, ed) {
  const s = show(v, ed, true);
  return '`' + (s.length > 40 ? s.slice(0, 37) + '...' : s) + '` (' + aTypeName(v, ed) + ')';
}
function eq(a, b) {
  if (isNum(a) && isNum(b)) return nv(a) === nv(b);
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!eq(a[i], b[i])) return false;
    return true;
  }
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false;
    for (const [k, v] of a) { if (!b.has(k) || !eq(v, b.get(k))) return false; }
    return true;
  }
  if ((a === null || a === undefined) && (b === null || b === undefined)) return true;
  return a === b;
}
function deepCopy(v) {
  if (Array.isArray(v)) return v.slice();
  if (v instanceof Map) return new Map(v);
  return v;
}
function isCallable(v) { return v instanceof Func || v instanceof Builtin || v instanceof Bound || v instanceof NativeMethod; }

// mulberry32
function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NULL_HOST = {
  print() {}, clearOutput() {}, table() {}, note() {},
  gfx: new Proxy({}, { get: () => () => {} }),
  ui: { create: () => ({}), update() {}, read: (h, p) => (p === 'value' ? '' : undefined), clear() {} },
  now: () => Date.now()
};

// ----- Registries filled by later parts -----
const REG = { builtins: [], list: [], text: [], dict: [], classes: [] };
const ALIAS = { names: new Map(), members: new Map(), namesRev: new Map(), membersRev: new Map() };
function buildAliases() {
  ALIAS.names.clear(); ALIAS.members.clear(); ALIAS.namesRev.clear(); ALIAS.membersRev.clear();
  for (const b of REG.builtins) if (b.es) { ALIAS.names.set(b.es.toLowerCase(), b.n); ALIAS.namesRev.set(b.n, b.es); }
  for (const c of REG.classes) {
    if (c.es) { ALIAS.names.set(c.es.toLowerCase(), c.n); ALIAS.namesRev.set(c.n, c.es); }
    for (const m of c.methods || []) if (m.es) { ALIAS.members.set(m.es.toLowerCase(), m.n); ALIAS.membersRev.set(m.n, m.es); }
    for (const a of c.attrs || []) if (a.es) { ALIAS.members.set(a.es.toLowerCase(), a.n); ALIAS.membersRev.set(a.n, a.es); }
  }
  for (const grp of [REG.list, REG.text, REG.dict]) for (const m of grp) if (m.es) { ALIAS.members.set(m.es.toLowerCase(), m.n); ALIAS.membersRev.set(m.n, m.es); }
  ALIAS.members.set('describir', 'describe'); ALIAS.membersRev.set('describe', 'describir');
}
function canonMember(name) { return ALIAS.members.get(name.toLowerCase()) || name; }
function localName(canon, ed) { return ed === 'es' ? (ALIAS.namesRev.get(canon) || canon) : canon; }
function localMember(canon, ed) { return ed === 'es' ? (ALIAS.membersRev.get(canon) || canon) : canon; }

class Runner {
  constructor(prog, host, opts) {
    opts = opts || {};
    this.prog = prog; this.host = host || NULL_HOST; this.ed = prog.ed || opts.ed || 'en'; this.opts = opts;
    this.globals = new Map();
    this.gframe = { vars: this.globals, name: this.ed === 'es' ? 'principal' : 'main', isGlobal: true, line: 0 };
    this.stack = [this.gframe];
    this.steps = 0; this.printed = []; this.seed = opts.seed || 12345; this.rng = makeRng(this.seed);
    this.queue = []; this.task = null; this.state = 'ready'; this.listeners = 0;
    this.files = opts.files || new Map();
    this.trace = []; this.traceOn = !!opts.trace; this.coverage = new Set();
    this.inputsLog = []; this.replay = opts.replayInputs ? opts.replayInputs.slice() : null;
    this.scripted = opts.inputs ? opts.inputs.slice() : null;
    this.breakpoints = opts.breakpoints || new Map();
    this.pauseMode = null; this.execMs = 0; this.lastOutMs = 0; this.startTime = Date.now();
    this.curLine = 0; this.sendVal = undefined; this.error = null; this.result = null;
    this.maxSteps = opts.maxSteps || 0; this.loopTicks = 0;
    this.network = null; this.credits = new Set();
    this.nativeNames = new Map();
    this.timers = [];
    this.isTest = !!opts.test;
    this.testLog = null;
    this.defineNatives();
    this.defineProgram();
  }
  L(en, es) { return this.ed === 'es' ? es : en; }
  K(c) { return kwName(c, this.ed); }
  err(code, params, line) { return new LangError(code, params, line || this.curLine); }

  defineNatives() {
    for (const spec of REG.classes) {
      const c = new Cls(spec.n, null);
      c.native = true; c.spec = spec; c.es = spec.es;
      if (spec.init) c.init = new NativeMethod({ n: 'INIT', f: spec.init, min: spec.initMin || 0, max: spec.initMax === undefined ? 0 : spec.initMax, p: spec.initP || '' });
      for (const m of spec.methods || []) c.methods.set(m.n, new NativeMethod(m));
      c.hooks = spec.hooks || null;
      this.nativeNames.set(spec.n.toLowerCase(), c);
      if (spec.es) this.nativeNames.set(spec.es.toLowerCase(), c);
    }
    for (const spec of REG.classes) if (spec.parent) this.nativeNames.get(spec.n.toLowerCase()).parent = this.nativeNames.get(spec.parent.toLowerCase());
    this.builtinMap = new Map();
    for (const b of REG.builtins) {
      const bi = new Builtin(b);
      this.builtinMap.set(b.n.toLowerCase(), bi);
      if (b.es) this.builtinMap.set(b.es.toLowerCase(), bi);
    }
  }
  defineProgram() {
    const prog = this.prog;
    const made = new Map();
    for (const [name, def] of prog.classes) { const c = new Cls(name, null); c.def = def; made.set(name, c); this.globals.set(name, c); }
    for (const [name, def] of prog.classes) {
      const c = made.get(name);
      if (def.parent) {
        let p = made.get(def.parent) || this.nativeNames.get(def.parent.toLowerCase());
        if (!p) throw new LangError('E201', { name: def.parent, hint: this.hint(def.parent, [...made.keys()]) }, def.line);
        c.parent = p;
      }
      if (def.init) c.init = new Func(def.init, c);
      for (const m of def.methods) c.methods.set(m.name, new Func(m, c));
    }
    // cycle check
    for (const c of made.values()) { let x = c.parent, n = 0; while (x) { if (x === c || ++n > 50) throw new LangError('E227', { msg: this.L('A class cannot extend itself.', 'Una clase no puede extenderse a sí misma.') }, c.def.line); x = x.parent; } }
    for (const [name, def] of prog.funcs) this.globals.set(name, new Func(def, null));
  }
  hint(name, extra) {
    const cands = new Set(extra || []);
    for (const fr of this.stack) for (const k of fr.vars.keys()) cands.add(k);
    for (const k of this.globals.keys()) cands.add(k);
    for (const b of REG.builtins) cands.add(localName(b.n, this.ed));
    const c = closest(name, cands);
    return c ? this.L(` Did you mean \`${c}\`?`, ` ¿Querías decir \`${c}\`?`) : '';
  }

  // ----- output -----
  out(text) {
    this.printed.push(text);
    this.host.print(text);
    this.lastOutMs = this.execMs;
  }
  touch() { this.lastOutMs = this.execMs; }

  // ----- lookup -----
  lookup(name, f, line) {
    for (let fr = f; fr; fr = fr.outer) if (fr.vars.has(name)) return fr.vars.get(name);
    if (this.globals.has(name)) return this.globals.get(name);
    const low = name.toLowerCase();
    const b = this.builtinMap.get(low);
    if (b) return b;
    const c = this.nativeNames.get(low);
    if (c) return c;
    throw this.err('E201', { name, hint: this.hint(name) }, line);
  }
  assignName(name, v, f, line) {
    if (f.isGlobal) { this.globals.set(name, v); return; }
    for (let fr = f; fr; fr = fr.outer) if (fr.vars.has(name)) { fr.vars.set(name, v); return; }
    if (this.globals.has(name) && !f.comp) throw this.err('E211', { name, ret: this.K('return') }, line);
    f.vars.set(name, v);
  }

  // ----- helpers -----
  checkBool(v, kw, line) {
    if (typeof v !== 'boolean') throw this.err('E230', { kw: this.K(kw), t: this.K('true'), f: this.K('false'), what: describeValue(v, this.ed) }, line);
    return v;
  }
  nothingErr(node, side) {
    const src = side && side.src ? side.src : (node.src || '?');
    return this.err('E212', { src, nothing: this.K('nothing'), ret: this.K('return') }, node.line);
  }
  binop(op, a, b, node) {
    const line = node.line;
    if (a === null || a === undefined) throw this.nothingErr(node, node.l);
    if (b === null || b === undefined) throw this.nothingErr(node, node.r);
    const opName = { div: this.K('div'), mod: this.K('mod') }[op] || op;
    if (isNum(a) && isNum(b)) {
      const x = nv(a), y = nv(b), w = isWhole(a) && isWhole(b);
      switch (op) {
        case '+': return mkNum(x + y, w);
        case '-': return mkNum(x - y, w);
        case '*': return mkNum(x * y, w);
        case '/': if (y === 0) throw this.err('E210', {}, line); return new Dec(x / y);
        case 'div': if (y === 0) throw this.err('E210', {}, line); return mkNum(Math.floor(x / y), w);
        case 'mod': if (y === 0) throw this.err('E210', {}, line); return mkNum(((x % y) + y) % y, w);
        case '^': if (w && y >= 0) return Math.pow(x, y); return new Dec(Math.pow(x, y));
      }
    }
    if (op === '+') {
      if (isText(a) && isText(b)) return a + b;
      if (isList(a) && isList(b)) return a.concat(b);
      if ((isText(a) && isNum(b)) || (isNum(a) && isText(b))) {
        const ls = node.l ? node.l.src : 'a', rs = node.r ? node.r.src : 'b';
        const fix = isText(a) ? `${ls} + ${localName('text', this.ed)}(${rs})` : `${localName('text', this.ed)}(${ls}) + ${rs}`;
        throw this.err('E202', { fix }, line);
      }
    }
    if (op === '*') {
      if (isText(a) && isWhole(b)) return b > 0 ? a.repeat(b) : '';
      if (isList(a) && isWhole(b)) { let r = []; for (let i = 0; i < b; i++) r = r.concat(a); return r; }
    }
    throw this.err('E203', { op: opName, a: aTypeName(a, this.ed), b: aTypeName(b, this.ed) }, line);
  }
  compare(op, a, b, node) {
    switch (op) {
      case '==': return eq(a, b);
      case '!=': return !eq(a, b);
      case 'in': case 'notin': {
        let r;
        if (isText(b)) { if (!isText(a)) throw this.err('E203', { op: this.K('in'), a: aTypeName(a, this.ed), b: aTypeName(b, this.ed) }, node.line); r = b.includes(a); }
        else if (isList(b)) r = b.some(x => eq(x, a));
        else if (isDict(b)) r = b.has(nv(a));
        else throw this.err('E203', { op: this.K('in'), a: aTypeName(a, this.ed), b: aTypeName(b, this.ed) }, node.line);
        return op === 'in' ? r : !r;
      }
    }
    let x, y;
    if (isNum(a) && isNum(b)) { x = nv(a); y = nv(b); }
    else if (isText(a) && isText(b)) { x = a; y = b; }
    else {
      if (a === null || a === undefined) throw this.nothingErr(node, node.l);
      if (b === null || b === undefined) throw this.nothingErr(node, node.r);
      throw this.err('E225', { a: aTypeName(a, this.ed), b: aTypeName(b, this.ed), op }, node.line);
    }
    switch (op) { case '<': return x < y; case '>': return x > y; case '<=': return x <= y; case '>=': return x >= y; }
  }
  normIndex(o, i, node) {
    if (i instanceof Dec) { if (Number.isInteger(i.v)) i = i.v; }
    if (!isWhole(i)) throw this.err('E217', { what: describeValue(i, this.ed) }, node.line);
    const n = o.length;
    const j = i < 0 ? n + i : i;
    if (j < 0 || j >= n) throw this.err('E204', { name: node.o ? node.o.src : '?', n, last: n - 1, i }, node.line);
    return j;
  }
  getIndex(o, i, node) {
    if (isList(o)) return o[this.normIndex(o, i, node)];
    if (isText(o)) return o[this.normIndex(o, i, node)];
    if (isDict(o)) {
      const k = this.dictKey(i, node.line);
      if (!o.has(k)) {
        const keys = [...o.keys()].slice(0, 12).map(x => show(x, this.ed, true)).join(', ') || '-';
        throw this.err('E205', { name: node.o ? node.o.src : '?', key: show(k, this.ed, true), keys }, node.line);
      }
      return o.get(k);
    }
    if (o === null || o === undefined) throw this.nothingErr(node, node.o);
    throw this.err('E203', { op: '[ ]', a: aTypeName(o, this.ed), b: aTypeName(i, this.ed) }, node.line);
  }
  dictKey(k, line) {
    if (k instanceof Dec && Number.isInteger(k.v)) k = k.v;
    if (!(isText(k) || isWhole(k))) throw this.err('E218', {}, line);
    return k;
  }
  setIndex(o, i, v, node) {
    if (isList(o)) { o[this.normIndex(o, i, node)] = v; return; }
    if (isDict(o)) { o.set(this.dictKey(i, node.line), v); return; }
    if (isText(o)) throw this.err('E224', {}, node.line);
    throw this.err('E203', { op: '[ ]', a: aTypeName(o, this.ed), b: aTypeName(i, this.ed) }, node.line);
  }
  slice(o, a, b, node) {
    if (!(isList(o) || isText(o))) throw this.err('E203', { op: '[ : ]', a: aTypeName(o, this.ed), b: aTypeName(a, this.ed) }, node.line);
    const n = o.length;
    const fix = (x, d) => {
      if (x === null || x === undefined) return d;
      if (x instanceof Dec && Number.isInteger(x.v)) x = x.v;
      if (!isWhole(x)) throw this.err('E217', { what: describeValue(x, this.ed) }, node.line);
      if (x < 0) x = Math.max(0, n + x);
      return Math.min(x, n);
    };
    return o.slice(fix(a, 0), fix(b, n));
  }
  iterItems(v, node) {
    if (isList(v)) return { list: v, live: true };
    if (isText(v)) return { list: Array.from(v) };
    if (isDict(v)) return { list: [...v.keys()] };
    throw this.err('E216', { what: aTypeName(v, this.ed) }, node.line);
  }
  // ----- classes -----
  findMethod(cls, name) {
    const canon = canonMember(name);
    const loc = ALIAS.membersRev.get(canon);
    for (let c = cls; c; c = c.parent) {
      if (c.methods.has(name)) return { m: c.methods.get(name), owner: c };
      if (c.native) { if (c.methods.has(canon)) return { m: c.methods.get(canon), owner: c }; continue; }
      if (c.methods.has(canon)) return { m: c.methods.get(canon), owner: c };
      if (loc && c.methods.has(loc)) return { m: c.methods.get(loc), owner: c };
    }
    return null;
  }
  findInit(cls) {
    for (let c = cls; c; c = c.parent) if (c.init) return { m: c.init, owner: c };
    return null;
  }
  nativeHook(o, kind, name) {
    for (let c = o.cls; c; c = c.parent) if (c.hooks && c.hooks[kind]) return c.hooks[kind];
    return null;
  }
  getAttr(o, name, node) {
    if (o instanceof Obj) {
      const gh = this.nativeHook(o, 'get');
      if (gh) { const r = gh(o, canonMember(name), this); if (r !== undefined) return r; }
      if (o.attrs.has(name)) return o.attrs.get(name);
      const cn = canonMember(name);
      if (o.cls.native || this.nativeHook(o, 'get')) { if (o.attrs.has(cn)) return o.attrs.get(cn); }
      const fm = this.findMethod(o.cls, name);
      if (fm) return new Bound(o, fm.m, fm.owner);
      const cands = [...o.attrs.keys()];
      const c = closest(name, cands);
      throw this.err('E207', { what: this.L(`\`${o.cls.name}\` objects`, `Los objetos \`${o.cls.name}\``), attr: name, hint: c ? this.L(` Did you mean \`${c}\`?`, ` ¿Querías decir \`${c}\`?`) : '' }, node.line);
    }
    if (o === null || o === undefined) throw this.nothingErr(node, node.o);
    throw this.err('E207', { what: this.L('`' + node.o.src + '` (' + aTypeName(o, this.ed) + ')', '`' + node.o.src + '` (' + aTypeName(o, this.ed) + ')'), attr: name, hint: '' }, node.line);
  }
  setAttr(o, name, v, node) {
    if (!(o instanceof Obj)) {
      if (o === null || o === undefined) throw this.nothingErr(node, node.o);
      throw this.err('E207', { what: '`' + node.o.src + '`', attr: name, hint: '' }, node.line);
    }
    const sh = this.nativeHook(o, 'set');
    if (sh && sh(o, canonMember(name), v, this)) return;
    if (o.attrs.has(name) || o.initDepth > 0) { o.attrs.set(name, v); return; }
    const c = closest(name, [...o.attrs.keys()]);
    throw this.err('E206', { cls: o.cls.name, attr: name, init: this.K('init'), hint: c ? this.L(` Did you mean \`${c}\`?`, ` ¿Querías decir \`${c}\`?`) : '' }, node.line);
  }
  arityText(min, max) {
    const v = this.L(['value', 'values'], ['valor', 'valores']);
    if (min === max) return `${min} ${min === 1 ? v[0] : v[1]}`;
    if (max === Infinity || max === undefined) return this.L(`at least ${min} ${min === 1 ? v[0] : v[1]}`, `al menos ${min} ${min === 1 ? v[0] : v[1]}`);
    return this.L(`${min} to ${max} values`, `de ${min} a ${max} valores`);
  }

  // ----- calls -----
  *call(fn, args, node, f) {
    const line = node ? node.line : this.curLine;
    if (fn instanceof Builtin || fn instanceof NativeMethod) {
      const max = fn.max === undefined ? fn.min : fn.max;
      if (args.length < (fn.min || 0) || args.length > max) throw this.err('E208', { name: localName(fn.n, this.ed), want: this.arityText(fn.min || 0, max), got: args.length }, line);
      const ctx = { r: this, f, node, line, fnName: fn.n };
      if (fn.gen) return yield* fn.f(args, ctx);
      return fn.f(args, ctx);
    }
    if (fn instanceof Func) return yield* this.invoke(fn.def, args, null, null, node);
    if (fn instanceof Bound) {
      if (fn.m instanceof NativeMethod) {
        const m = fn.m; const max = m.max === undefined ? m.min : m.max;
        if (args.length < (m.min || 0) || args.length > max) throw this.err('E208', { name: localMember(m.n, this.ed), want: this.arityText(m.min || 0, max), got: args.length }, line);
        const ctx = { r: this, f, node, line, fnName: m.n, isMethod: true };
        if (m.gen) return yield* m.f(fn.obj, args, ctx);
        return m.f(fn.obj, args, ctx);
      }
      return yield* this.invoke(fn.m.def, args, fn.obj, fn.owner, node);
    }
    if (fn instanceof Cls) throw this.err('E226', { name: fn.name, new: this.K('new') }, line);
    throw this.err('E209', { what: describeValue(fn, this.ed) }, line);
  }
  *invoke(def, args, selfObj, cls, node) {
    const ps = def.params;
    const req = ps.filter(p => !p.def).length;
    if (args.length < req || args.length > ps.length) {
      throw this.err('E208', { name: def.isInit ? (cls ? cls.name : 'INIT') : def.name, want: this.arityText(req, ps.length), got: args.length }, node ? node.line : this.curLine);
    }
    if (this.stack.length > 500) throw this.err('E213', {}, node ? node.line : this.curLine);
    const fr = { vars: new Map(), name: def.isInit ? (cls ? cls.name + '.' + this.K('init') : 'INIT') : (cls ? cls.name + '.' + def.name : def.name),
      self: selfObj, cls, def, isInit: !!def.isInit, line: def.line, isGlobal: false, callLine: node ? node.line : 0 };
    for (let i = 0; i < ps.length; i++) {
      const v = i < args.length ? args[i] : yield* this.ev(ps[i].def, fr);
      fr.vars.set(ps[i].name, v);
    }
    this.stack.push(fr);
    try {
      yield* this.block(def.body, fr);
    } catch (e) {
      if (e instanceof RetSig) return e.v;
      throw e;
    } finally {
      this.stack.pop();
      if (this.stack.length) this.curLine = this.stack[this.stack.length - 1].line;
    }
    return null;
  }
  *construct(cls, args, node) {
    const o = new Obj(cls);
    const fi = this.findInit(cls);
    if (fi) {
      o.initDepth++;
      try {
        if (fi.m instanceof NativeMethod) {
          const m = fi.m; const max = m.max === undefined ? m.min : m.max;
          if (args.length < (m.min || 0) || args.length > max) throw this.err('E208', { name: cls.name, want: this.arityText(m.min || 0, max), got: args.length }, node.line);
          const ctx = { r: this, node, line: node.line, fnName: cls.name };
          if (m.gen) yield* m.f(o, args, ctx); else m.f(o, args, ctx);
        } else {
          yield* this.invoke(fi.m.def, args, o, fi.owner, node);
        }
      } finally { o.initDepth--; }
    } else if (args.length) {
      throw this.err('E208', { name: cls.name, want: this.arityText(0, 0), got: args.length }, node.line);
    }
    return o;
  }
  *callMethod(o, name, args, node, f) {
    const line = node.line;
    const canon = canonMember(name);
    const pick = (grp) => grp.find(m => m.n === canon || m.n === name);
    let m = null;
    if (isList(o)) m = pick(REG.list);
    else if (isText(o)) m = pick(REG.text);
    else if (isDict(o)) m = pick(REG.dict);
    else if (o instanceof Obj) {
      const v = this.getAttr(o, name, node.f);
      return yield* this.call(v, args, node, f);
    } else if (o === null || o === undefined) throw this.nothingErr(node, node.f.o);
    if (!m) {
      const grp = isList(o) ? REG.list : isText(o) ? REG.text : isDict(o) ? REG.dict : [];
      const c = closest(name, grp.map(x => localMember(x.n, this.ed)));
      throw this.err('E207', { what: '`' + node.f.o.src + '` (' + aTypeName(o, this.ed) + ')', attr: name, hint: c ? this.L(` Did you mean \`${c}\`?`, ` ¿Querías decir \`${c}\`?`) : '' }, line);
    }
    const max = m.max === undefined ? m.min : m.max;
    if (args.length < (m.min || 0) || args.length > max) throw this.err('E208', { name: localMember(m.n, this.ed), want: this.arityText(m.min || 0, max), got: args.length }, line);
    const ctx = { r: this, f, node, line, src: node.f.o.src, fnName: m.n, isMethod: true };
    if (m.gen) return yield* m.f(o, args, ctx);
    return m.f(o, args, ctx);
  }
  *display(v) {
    if (v instanceof Obj) {
      const fm = this.findMethod(v.cls, 'describe');
      if (fm && !(fm.m instanceof NativeMethod)) {
        const r = yield* this.invoke(fm.m.def, [], v, fm.owner, null);
        return show(r, this.ed);
      }
    }
    return show(v, this.ed);
  }

  // ----- expressions -----
  isPure(e) {
    if (e.pure !== undefined) return e.pure;
    let p;
    switch (e.k) {
      case 'Call': case 'New': case 'Comp': p = false; break;
      case 'Num': case 'Str': case 'Bool': case 'Nothing': case 'Name': case 'Self': p = true; break;
      case 'List': p = e.items.every(x => this.isPure(x)); break;
      case 'Dict': p = e.pairs.every(([a, b]) => this.isPure(a) && this.isPure(b)); break;
      case 'Index': p = this.isPure(e.o) && this.isPure(e.i); break;
      case 'Slice': p = this.isPure(e.o) && (!e.a || this.isPure(e.a)) && (!e.b || this.isPure(e.b)); break;
      case 'Attr': p = this.isPure(e.o); break;
      case 'Bin': case 'Cmp': case 'Logic': p = this.isPure(e.l) && this.isPure(e.r); break;
      case 'Not': case 'Neg': case 'Paren': p = this.isPure(e.e); break;
      default: p = false;
    }
    e.pure = p; return p;
  }
  selfOf(f, line) {
    for (let fr = f; fr; fr = fr.outer) if (fr.self) return fr.self;
    throw this.err('E121', { self: this.K('self') }, line);
  }
  // synchronous evaluation for call-free expressions
  evs(e, f) {
    switch (e.k) {
      case 'Num': return e.dec ? new Dec(e.v) : e.v;
      case 'Str': return e.v;
      case 'Bool': return e.v;
      case 'Nothing': return null;
      case 'Name': return this.lookup(e.name, f, e.line);
      case 'Self': return this.selfOf(f, e.line);
      case 'Paren': return this.evs(e.e, f);
      case 'List': return e.items.map(x => this.evs(x, f));
      case 'Dict': { const m = new Map(); for (const [k, v] of e.pairs) m.set(this.dictKey(this.evs(k, f), e.line), this.evs(v, f)); return m; }
      case 'Index': return this.getIndex(this.evs(e.o, f), this.evs(e.i, f), e);
      case 'Slice': return this.slice(this.evs(e.o, f), e.a ? this.evs(e.a, f) : null, e.b ? this.evs(e.b, f) : null, e);
      case 'Attr': return this.getAttr(this.evs(e.o, f), e.name, e);
      case 'Bin': return this.binop(e.op, this.evs(e.l, f), this.evs(e.r, f), e);
      case 'Cmp': return this.compare(e.op, this.evs(e.l, f), this.evs(e.r, f), e);
      case 'Logic': {
        const a = this.checkBool(this.evs(e.l, f), e.op, e.line);
        if (e.op === 'and' ? !a : a) return a;
        return this.checkBool(this.evs(e.r, f), e.op, e.line);
      }
      case 'Not': return !this.checkBool(this.evs(e.e, f), 'not', e.line);
      case 'Neg': { const v = this.evs(e.e, f); if (!isNum(v)) { if (v === null) throw this.nothingErr(e, e.e); throw this.err('E203', { op: '-', a: aTypeName(v, this.ed), b: aTypeName(v, this.ed) }, e.line); } return mkNum(-nv(v), isWhole(v)); }
    }
    throw this.err('E227', { msg: 'Cannot evaluate ' + e.k }, e.line);
  }
  *ev(e, f) {
    if (this.isPure(e)) return this.evs(e, f);
    switch (e.k) {
      case 'Paren': return yield* this.ev(e.e, f);
      case 'List': { const r = []; for (const x of e.items) r.push(yield* this.ev(x, f)); return r; }
      case 'Dict': { const m = new Map(); for (const [k, v] of e.pairs) { const kk = this.dictKey(yield* this.ev(k, f), e.line); m.set(kk, yield* this.ev(v, f)); } return m; }
      case 'Index': { const o = yield* this.ev(e.o, f); const i = yield* this.ev(e.i, f); return this.getIndex(o, i, e); }
      case 'Slice': { const o = yield* this.ev(e.o, f); const a = e.a ? yield* this.ev(e.a, f) : null; const b = e.b ? yield* this.ev(e.b, f) : null; return this.slice(o, a, b, e); }
      case 'Attr': { const o = yield* this.ev(e.o, f); return this.getAttr(o, e.name, e); }
      case 'Bin': { const a = yield* this.ev(e.l, f); const b = yield* this.ev(e.r, f); return this.binop(e.op, a, b, e); }
      case 'Cmp': { const a = yield* this.ev(e.l, f); const b = yield* this.ev(e.r, f); return this.compare(e.op, a, b, e); }
      case 'Logic': {
        const a = this.checkBool(yield* this.ev(e.l, f), e.op, e.line);
        if (e.op === 'and' ? !a : a) return a;
        return this.checkBool(yield* this.ev(e.r, f), e.op, e.line);
      }
      case 'Not': return !this.checkBool(yield* this.ev(e.e, f), 'not', e.line);
      case 'Neg': { const v = yield* this.ev(e.e, f); if (!isNum(v)) throw this.err('E203', { op: '-', a: aTypeName(v, this.ed), b: aTypeName(v, this.ed) }, e.line); return mkNum(-nv(v), isWhole(v)); }
      case 'Call': {
        const fe = e.f;
        if (fe.k === 'Attr') {
          const o = yield* this.ev(fe.o, f);
          const args = []; for (const a of e.args) args.push(yield* this.ev(a, f));
          return yield* this.callMethod(o, fe.name, args, e, f);
        }
        if (fe.k === 'ParentRef') {
          const args = []; for (const a of e.args) args.push(yield* this.ev(a, f));
          return yield* this.parentCall(fe, args, e, f);
        }
        const fn = yield* this.ev(fe, f);
        const args = []; for (const a of e.args) args.push(yield* this.ev(a, f));
        return yield* this.call(fn, args, e, f);
      }
      case 'New': {
        let c;
        try { c = this.lookup(e.cls, f, e.line); } catch (er) { throw er; }
        if (!(c instanceof Cls)) throw this.err('E223', { name: e.cls, new: this.K('new') }, e.line);
        const args = []; for (const a of e.args) args.push(yield* this.ev(a, f));
        return yield* this.construct(c, args, e);
      }
      case 'Comp': {
        const it = yield* this.ev(e.iter, f);
        const { list } = this.iterItems(it, e);
        const fr = { vars: new Map(), outer: f, comp: true, self: f.self, cls: f.cls, name: f.name, isGlobal: false };
        const out = [];
        for (let i = 0; i < list.length; i++) {
          fr.vars.set(e.v, list[i]);
          if (e.cond && !this.checkBool(yield* this.ev(e.cond, fr), 'if', e.line)) continue;
          out.push(yield* this.ev(e.e, fr));
        }
        return out;
      }
      case 'ParentRef': throw this.err('E120', { want: '(' }, e.line);
    }
    return this.evs(e, f);
  }
  *parentCall(ref, args, node, f) {
    let fr = f; while (fr && !fr.cls) fr = fr.outer;
    const self = this.selfOf(f, node.line);
    const cls = fr && fr.cls;
    const parent = cls && cls.parent;
    if (!parent) throw this.err('E227', { msg: this.L(`\`${cls ? cls.name : '?'}\` has no parent class.`, `\`${cls ? cls.name : '?'}\` no tiene clase padre.`) }, node.line);
    if (ref.name === null) {
      const fi = this.findInit(parent);
      if (!fi) { if (args.length) throw this.err('E208', { name: parent.name, want: this.arityText(0, 0), got: args.length }, node.line); return null; }
      self.initDepth++;
      try {
        if (fi.m instanceof NativeMethod) {
          const m = fi.m; const max = m.max === undefined ? m.min : m.max;
          if (args.length < (m.min || 0) || args.length > max) throw this.err('E208', { name: parent.name, want: this.arityText(m.min || 0, max), got: args.length }, node.line);
          const ctx = { r: this, f, node, line: node.line, fnName: parent.name };
          if (m.gen) yield* m.f(self, args, ctx); else m.f(self, args, ctx);
          return null;
        }
        return yield* this.invoke(fi.m.def, args, self, fi.owner, node);
      } finally { self.initDepth--; }
    }
    const fm = this.findMethod(parent, ref.name);
    if (!fm) throw this.err('E207', { what: '`' + parent.name + '`', attr: ref.name, hint: '' }, node.line);
    return yield* this.call(new Bound(self, fm.m, fm.owner), args, node, f);
  }

  // ----- statements -----
  *block(list, f) { for (let i = 0; i < list.length; i++) yield* this.exec(list[i], f); }
  *exec(s, f) {
    if (s.k === 'FuncDef' || s.k === 'ClassDef' || s.k === 'Test') return;
    this.curLine = s.line; f.line = s.line;
    yield s;
    switch (s.k) {
      case 'Print': {
        const parts = [];
        for (const e of s.exprs) { const v = yield* this.ev(e, f); parts.push(yield* this.display(v)); }
        this.out(parts.join(' '));
        return;
      }
      case 'Assign': {
        let v = yield* this.ev(s.value, f);
        const t = s.target;
        if (s.op !== '=') {
          const cur = yield* this.ev(t, f);
          v = this.binop(s.op[0], cur, v, { line: s.line, l: t, r: s.value, src: t.src });
        }
        if (t.k === 'Name') { this.assignName(t.name, v, f, s.line); return; }
        if (t.k === 'Index') { const o = yield* this.ev(t.o, f); const i = yield* this.ev(t.i, f); this.setIndex(o, i, v, t); return; }
        if (t.k === 'Attr') { const o = yield* this.ev(t.o, f); this.setAttr(o, t.name, v, t); return; }
        return;
      }
      case 'ExprStmt': yield* this.ev(s.e, f); return;
      case 'If': {
        for (const br of s.branches) {
          const c = this.checkBool(yield* this.ev(br.cond, f), 'if', br.line);
          if (c) { yield* this.block(br.body, f); return; }
        }
        if (s.elseBody) yield* this.block(s.elseBody, f);
        return;
      }
      case 'While': {
        for (;;) {
          this.curLine = s.line;
          const c = this.checkBool(yield* this.ev(s.cond, f), 'while', s.line);
          if (!c) return;
          try { yield* this.block(s.body, f); }
          catch (e) { if (e === BREAK) return; if (e !== CONT) throw e; }
          yield { req: 'loop', line: s.line };
        }
      }
      case 'Repeat': {
        let n = yield* this.ev(s.count, f);
        if (n instanceof Dec && Number.isInteger(n.v)) n = n.v;
        if (!isWhole(n) || n < 0) throw this.err('E219', { fn: this.K('repeat'), msg: this.L('the number of times must be a whole number, 0 or more.', 'el número de veces debe ser un número entero, 0 o más.') }, s.line);
        for (let i = 0; i < n; i++) {
          try { yield* this.block(s.body, f); }
          catch (e) { if (e === BREAK) return; if (e !== CONT) throw e; }
          yield { req: 'loop', line: s.line };
        }
        return;
      }
      case 'For': {
        const a = yield* this.ev(s.from, f), b = yield* this.ev(s.to, f);
        const st = s.step ? yield* this.ev(s.step, f) : 1;
        for (const [v, nm] of [[a, s.from], [b, s.to], [st, s.step]]) if (!isNum(v)) {
          if (v === null) throw this.nothingErr(s, nm);
          throw this.err('E219', { fn: this.K('for'), msg: this.L('FROM, TO and STEP need numbers.', 'DESDE, HASTA y CON PASO necesitan números.') }, s.line);
        }
        const x0 = nv(a), x1 = nv(b), dx = nv(st);
        if (dx === 0) throw this.err('E219', { fn: this.K('for'), msg: this.L('STEP can\'t be 0.', 'CON PASO no puede ser 0.') }, s.line);
        const whole = isWhole(a) && isWhole(st);
        for (let x = x0; dx > 0 ? x <= x1 + 1e-12 : x >= x1 - 1e-12; x += dx) {
          this.assignName(s.v, whole ? x : new Dec(Math.round(x * 1e10) / 1e10), f, s.line);
          try { yield* this.block(s.body, f); }
          catch (e) { if (e === BREAK) return; if (e !== CONT) throw e; }
          yield { req: 'loop', line: s.line };
        }
        return;
      }
      case 'ForEach': {
        const it = yield* this.ev(s.iter, f);
        const { list, live } = this.iterItems(it, s);
        for (let i = 0; live ? i < list.length : i < list.length; i++) {
          this.assignName(s.v, list[i], f, s.line);
          try { yield* this.block(s.body, f); }
          catch (e) { if (e === BREAK) return; if (e !== CONT) throw e; }
          yield { req: 'loop', line: s.line };
        }
        return;
      }
      case 'Break': throw BREAK;
      case 'Continue': throw CONT;
      case 'Return': { const v = s.value ? yield* this.ev(s.value, f) : null; throw new RetSig(v); }
      case 'Try': {
        try { yield* this.block(s.body, f); }
        catch (e) {
          if (e instanceof RetSig || e === BREAK || e === CONT || e.stopSignal) throw e;
          const msg = e.isLang ? errText(e, this.ed) : String(e.message || e);
          if (s.errVar) this.assignName(s.errVar, msg, f, s.line);
          yield* this.block(s.handler, f);
        }
        return;
      }
      case 'Fail': {
        const v = yield* this.ev(s.msg, f);
        const e = this.err('E214', { msg: show(v, this.ed) }, s.line);
        e.userFail = true;
        throw e;
      }
      case 'Expect': {
        const log = this.testLog;
        const e = s.e;
        let ok, detail = null;
        if (e.k === 'Cmp' && (e.op === '==' || e.op === '!=')) {
          const a = yield* this.ev(e.l, f), b = yield* this.ev(e.r, f);
          ok = e.op === '==' ? eq(a, b) : !eq(a, b);
          if (!ok) detail = e.op === '==' ?
            this.L(`\`${e.l.src}\` gave \`${show(a, this.ed, true)}\` but the test expected \`${show(b, this.ed, true)}\``, `\`${e.l.src}\` dio \`${show(a, this.ed, true)}\` pero la prueba esperaba \`${show(b, this.ed, true)}\``) :
            this.L(`\`${e.l.src}\` gave \`${show(a, this.ed, true)}\`, which the test said it should not`, `\`${e.l.src}\` dio \`${show(a, this.ed, true)}\`, que la prueba decía que no debía dar`);
        } else {
          const v = yield* this.ev(e, f);
          if (typeof v !== 'boolean') { ok = false; detail = this.L(`\`${e.src}\` should be TRUE or FALSE, but gave ${describeValue(v, this.ed)}`, `\`${e.src}\` debería ser VERDADERO o FALSO, pero dio ${describeValue(v, this.ed)}`); }
          else { ok = v; if (!ok) detail = this.L(`\`${e.src}\` was ${this.K('false')}`, `\`${e.src}\` fue ${this.K('false')}`); }
        }
        if (log) log.push({ ok, line: s.line, src: e.src, detail });
        return;
      }
      case 'ExpectError': {
        const log = this.testLog;
        let failed = null;
        try { yield* this.ev(s.e, f); }
        catch (er) { if (er instanceof RetSig || er === BREAK || er === CONT || er.stopSignal) throw er; failed = er; }
        let ok, detail = null;
        if (!failed) { ok = false; detail = this.L(`\`${s.e.src}\` should have failed, but it didn't`, `\`${s.e.src}\` debería haber fallado, pero no falló`); }
        else if (s.contains) {
          const want = show(yield* this.ev(s.contains, f), this.ed);
          const got = errText(failed, this.ed);
          ok = got.includes(want);
          if (!ok) detail = this.L(`\`${s.e.src}\` failed with "${got}", which does not contain "${want}"`, `\`${s.e.src}\` falló con "${got}", que no contiene "${want}"`);
        } else ok = true;
        if (log) log.push({ ok, line: s.line, src: s.e.src, detail });
        return;
      }
    }
  }

  // ----- driving -----
  *mainGen() { yield* this.block(this.prog.body, this.gframe); }
  start() { this.task = { gen: this.mainGen(), kind: 'main' }; this.state = 'running'; return this; }
  enqueue(fn, args) { this.queue.push({ fn, args: args || [] }); }
  *handlerGen(fn, args) { yield* this.call(fn, args, null, this.gframe); }
  topFrame() { return this.stack[this.stack.length - 1]; }
  snapshotVars(fr) {
    const o = {};
    for (const [k, v] of fr.vars) { if (!(v instanceof Func || v instanceof Cls)) { const s = show(v, this.ed, true); o[k] = s.length > 60 ? s.slice(0, 57) + '...' : s; } }
    return o;
  }
  onStep(node) {
    this.steps++;
    this.coverage.add(node.line);
    if (this.traceOn && this.trace.length < 5000) {
      const fr = this.topFrame();
      this.trace.push({ step: this.steps, line: node.line, frame: fr.name, vars: this.snapshotVars(fr) });
    }
    if (this.maxSteps && this.steps > this.maxSteps) throw this.err('E231', { n: this.maxSteps.toLocaleString('en') }, node.line);
    const pm = this.pauseMode;
    if (pm) {
      const d = this.stack.length;
      if (pm.kind === 'into') return true;
      if (pm.kind === 'over' && d <= pm.depth) return true;
      if (pm.kind === 'out' && d < pm.depth) return true;
      if (pm.kind === 'line' && node.line === pm.line) return true;
      if (pm.kind === 'count' && this.steps >= pm.target) return true;
    }
    if (this.breakpoints.size && this.breakpoints.has(node.line)) {
      const cond = this.breakpoints.get(node.line);
      if (!cond) return true;
      try { const ast = cond.ast || (cond.ast = parseExprOnly(cond.src, this.ed)); const v = this.evs(ast, this.topFrame()); if (v === true) return true; }
      catch (e) { if (cond.after && this.stepsAtLine) {} }
    }
    return false;
  }
  // Run until paused / needs input / budget exhausted. Returns state string.
  runSlice(budgetMs) {
    const t0 = Date.now();
    const deadline = t0 + (budgetMs || 20);
    let count = 0;
    try {
      for (;;) {
        if (!this.task) {
          if (this.queue.length) {
            const q = this.queue.shift();
            this.task = { gen: this.handlerGen(q.fn, q.args), kind: 'handler' };
          } else {
            this.state = this.listeners > 0 && !this.isTest ? 'events' : 'done';
            return this.state;
          }
        }
        const r = this.task.gen.next(this.sendVal);
        this.sendVal = undefined;
        if (r.done) { this.task = null; this.stack.length = 1; continue; }
        const v = r.value;
        if (v.k) {
          if (this.onStep(v)) { this.pauseMode = null; this.state = 'paused'; this.pausedNode = v; return 'paused'; }
        } else if (v.req === 'ask') {
          this.touch();
          if (this.replay && this.replay.length) { const a = this.replay.shift(); this.inputsLog.push(a); this.sendVal = a; this.host.echoInput && this.host.echoInput(v.prompt, a); continue; }
          if (this.scripted) {
            if (!this.scripted.length) throw this.err('E229', { with: this.K('with_inputs') }, this.curLine);
            const a = this.scripted.shift(); this.sendVal = a; continue;
          }
          this.state = 'ask'; this.askPrompt = v.prompt; return 'ask';
        } else if (v.req === 'loop') {
          if (this.maxSteps && ++this.loopTicks > this.maxSteps) throw this.err('E231', { n: this.maxSteps.toLocaleString('en') }, v.line);
        } else if (v.req === 'wait') {
          this.touch();
          if (this.isTest || (this.replay && this.opts.fastReplay)) continue;
          this.state = 'waiting'; this.resumeAt = Date.now() + v.ms; return 'waiting';
        }
        if ((++count & 31) === 0) {
          const now = Date.now();
          if (now >= deadline) {
            this.execMs += now - t0;
            if (!this.isTest && this.execMs - this.lastOutMs > 5000 && !this.opts.noGuard) { this.state = 'guard'; this.lastOutMs = this.execMs; return 'guard'; }
            this.state = 'running'; return 'running';
          }
        }
      }
    } catch (e) {
      this.execMs += Date.now() - t0;
      if (e && e.stopSignal) { this.state = 'stopped'; return 'stopped'; }
      if (e === BREAK || e === CONT) e = this.err('E227', { msg: 'BREAK/CONTINUE outside loop' });
      if (e instanceof RetSig) e = this.err('E227', { msg: 'RETURN outside function' });
      if (e instanceof RangeError && /call stack/i.test(e.message)) e = this.err('E213', {}, this.curLine);
      if (!e.isLang) {
        const w = this.err('E227', { msg: this.L('Internal problem: ', 'Problema interno: ') + (e && e.message || e) }, this.curLine);
        w.internal = e; e = w;
      }
      if (!e.line) e.line = this.curLine;
      this.error = e; this.state = 'error'; this.task = null;
      return 'error';
    }
  }
  answer(text) { this.inputsLog.push(text); this.sendVal = text; this.state = 'running'; }
  resume() { this.state = 'running'; }
  // run to completion synchronously (tests, node)
  runSync(maxSlices) {
    let st;
    for (let i = 0; i < (maxSlices || 100000); i++) {
      st = this.runSlice(1000);
      if (st !== 'running' && st !== 'paused') return st;
      if (st === 'paused') this.state = 'running';
    }
    return st;
  }
  // evaluate a watch/condition expression synchronously in the current frame
  evalWatch(src) {
    const ast = parseExprOnly(src, this.ed, true);
    const f = this.topFrame();
    if (this.isPure(ast)) return this.evs(ast, f);
    const g = this.ev(ast, f);
    let r = g.next();
    let n = 0;
    while (!r.done) { if (r.value.req === 'ask' || r.value.req === 'wait' || ++n > 100000) throw this.err('E227', { msg: this.L('A watch can\'t ask for input or run that long.', 'Una expresión vigilada no puede pedir datos ni tardar tanto.') }); r = g.next(); }
    return r.value;
  }
}
