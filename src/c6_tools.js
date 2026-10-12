// ===== Core part 6: tests, docs, Python, editions, history =====
B({ n: 'printed', es: 'mostrado', p: '', min: 0, cat: 'testing', d: 'In a TEST: the list of lines the code has printed so far.', f: (a, ctx) => ctx.r.printed.slice() });

function inputsToText(r, v) {
  if (v === null || v === undefined) return null;
  if (!isList(v)) throw new LangError('E219', { fn: kwName('with_inputs', r.ed), msg: r.L('give a list of answers, like ["5", "abc"].', 'da una lista de respuestas, como ["5", "abc"].') }, 0);
  return v.map(x => show(x, r.ed));
}
function runTests(prog, opts) {
  opts = opts || {};
  const results = []; const coverage = new Set();
  for (const t of prog.tests) {
    const res = { name: t.name, line: t.line, passed: false, checks: [], error: null, printed: [] };
    let r;
    try {
      r = new Runner(prog, NULL_HOST, { test: true, files: new Map(opts.files || []), maxSteps: opts.maxSteps || 300000, seed: 12345 });
      let inputs = null;
      if (t.inputs) inputs = inputsToText(r, r.evs(t.inputs, r.gframe));
      r.scripted = inputs;
      r.testLog = [];
      r.task = { gen: r.block(t.body, r.gframe), kind: 'test' };
      r.state = 'running';
      const st = r.runSync();
      res.checks = r.testLog;
      res.printed = r.printed;
      if (st === 'error') res.error = { text: errText(r.error, r.ed), line: r.error.line, code: r.error.code };
      res.passed = !res.error && res.checks.every(c => c.ok);
      for (const l of r.coverage) coverage.add(l);
    } catch (e) {
      res.error = { text: errText(e, prog.ed), line: e.line || t.line, code: e.code };
    }
    results.push(res);
  }
  // DOC examples
  const examples = [];
  const defs = [];
  for (const [, f] of prog.funcs) defs.push({ def: f, owner: f.name });
  for (const [, c] of prog.classes) { defs.push({ def: c, owner: c.name }); if (c.init) defs.push({ def: c.init, owner: c.name }); for (const m of c.methods) defs.push({ def: m, owner: c.name + '.' + m.name }); }
  for (const { def, owner } of defs) {
    if (!def.doc) continue;
    for (const ex of def.doc.examples) {
      const item = { owner, line: ex.line, text: ex.text, ok: false, detail: '' };
      const cut = splitArrow(ex.text);
      if (cut && (!cut[0].trim() || !cut[1].trim() || /\(\s*,|,\s*,|,\s*\)/.test(cut[0]))) continue; // template not filled in yet: reported by the checker
      if (!cut) { item.detail = prog.ed === 'es' ? 'Escribe el ejemplo como: llamada -> resultado' : 'Write the example as: call -> result'; examples.push(item); continue; }
      try {
        const lhs = parseExprOnly(cut[0], prog.ed), rhs = parseExprOnly(cut[1], prog.ed);
        const r = new Runner(prog, NULL_HOST, { test: true, files: new Map(opts.files || []), maxSteps: 100000 });
        let got, want;
        r.task = { gen: (function* () { got = yield* r.ev(lhs, r.gframe); want = yield* r.ev(rhs, r.gframe); })(), kind: 'example' };
        r.state = 'running';
        const st = r.runSync();
        if (st === 'error') item.detail = errText(r.error, r.ed);
        else { item.ok = eq(got, want); if (!item.ok) item.detail = (prog.ed === 'es' ? 'dio ' : 'gave ') + show(got, prog.ed, true); }
        for (const l of r.coverage) coverage.add(l);
      } catch (e) { item.detail = errText(e, prog.ed); }
      examples.push(item);
    }
  }
  return { results, examples, coverage };
}
function splitArrow(t) {
  let q = null;
  for (let i = 0; i < t.length - 1; i++) {
    const c = t[i];
    if (q) { if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { q = c; continue; }
    if (c === '-' && t[i + 1] === '>') return [t.slice(0, i).trim(), t.slice(i + 2).trim()];
  }
  return null;
}
function walk(nodes, fn) {
  const visit = (n) => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) { n.forEach(visit); return; }
    if (n.k) fn(n);
    for (const key in n) { if (key === 'doc' || key === 'pure' || key === 'src') continue; const v = n[key]; if (v && typeof v === 'object') visit(v); }
  };
  visit(nodes);
}
function callsAsk(def) {
  let found = false;
  walk(def.body, (n) => { if (n.k === 'Call' && n.f.k === 'Name' && ['ASK', 'PREGUNTAR'].includes(norm(n.f.name))) found = true; });
  return found;
}
function functionLines(def) {
  const lines = new Set();
  walk(def.body, (n) => { if (n.line && ['Print', 'Assign', 'ExprStmt', 'If', 'While', 'Repeat', 'For', 'ForEach', 'Return', 'Try', 'Fail', 'Break', 'Continue'].includes(n.k)) lines.add(n.line); });
  return lines;
}
function allDefs(prog) {
  const out = [];
  for (const [, f] of prog.funcs) out.push({ def: f, label: f.name, kind: 'function' });
  for (const [, c] of prog.classes) {
    if (c.init) out.push({ def: c.init, label: c.name + '.' + kwName('init', prog.ed), kind: 'init', cls: c });
    for (const m of c.methods) out.push({ def: m, label: c.name + '.' + m.name, kind: 'method', cls: c });
  }
  return out;
}
function planWarnings(prog, plan, testRun) {
  const ed = prog.ed; const L = (en, es) => (ed === 'es' ? es : en);
  const w = [];
  const testNames = new Set(prog.tests.map(t => t.name));
  for (const d of allDefs(prog)) {
    if (d.kind === 'init') continue;
    const rows = plan.filter(r => r.target === d.label || r.target === d.def.name);
    if (d.def.params.length) {
      if (!rows.some(r => r.kind === 'boundary')) w.push({ level: 'warn', target: d.label, text: L(`\`${d.label}\` has no boundary case in the test plan.`, `\`${d.label}\` no tiene ningún caso límite en el plan de pruebas.`) });
      if (!rows.some(r => r.kind === 'error' || r.kind === 'invalid')) w.push({ level: 'info', target: d.label, text: L(`\`${d.label}\` has no error case yet. What should happen with bad values?`, `\`${d.label}\` aún no tiene un caso de error. ¿Qué debe pasar con valores incorrectos?`) });
    }
    if (callsAsk(d.def) && !rows.some(r => r.kind === 'invalid')) w.push({ level: 'warn', target: d.label, text: L(`\`${d.label}\` asks the user for input but the plan has no invalid-input case.`, `\`${d.label}\` pide datos al usuario pero el plan no tiene un caso de entrada no válida.`) });
  }
  for (const r of plan) {
    if (r.test && !testNames.has(r.test)) w.push({ level: 'warn', target: r.target, text: L(`The plan links to a test "${r.test}" that does not exist.`, `El plan enlaza con una prueba "${r.test}" que no existe.`) });
  }
  if (testRun) {
    for (const d of allDefs(prog)) {
      const lines = functionLines(d.def);
      if (lines.size && ![...lines].some(l => testRun.coverage.has(l))) w.push({ level: 'info', target: d.label, text: L(`No test runs \`${d.label}\`.`, `Ninguna prueba ejecuta \`${d.label}\`.`) });
    }
  }
  return w;
}
// ----- docs -----
function selfAttrs(def) {
  const out = [];
  if (!def) return out;
  walk(def.body, (n) => { if (n.k === 'Assign' && n.target.k === 'Attr' && n.target.o.k === 'Self' && !out.includes(n.target.name)) out.push(n.target.name); });
  return out;
}
function returnsValue(def) { let r = false; walk(def.body, (n) => { if (n.k === 'Return' && n.value) r = true; }); return r; }
function docLabel(f, ed) { return DOC_FIELDS[f][ED_INDEX[ed] || 0]; }
function checkDocs(prog) {
  const ed = prog.ed; const L = (en, es) => (ed === 'es' ? es : en);
  const out = [];
  const check = (def, label, isClass, cls) => {
    const doc = def.doc;
    if (!doc) { out.push({ level: 'info', target: label, line: def.line, text: L(`\`${label}\` has no DOC block.`, `\`${label}\` no tiene bloque DOC.`) }); return; }
    const F = doc.fields;
    for (const ex of doc.examples) { const c = splitArrow(ex.text); if (c && (!c[0].trim() || !c[1].trim() || /\(\s*,|,\s*,|,\s*\)/.test(c[0]))) out.push({ level: 'warn', target: label, line: ex.line, text: L(`An ${docLabel('example', ed)} for \`${label}\` is not finished: write a call and its result, like add(2, 3) -> 5.`, `Un ${docLabel('example', ed)} de \`${label}\` no está terminado: escribe una llamada y su resultado, como suma(2, 3) -> 5.`) }); }
    if (!F.purpose) out.push({ level: 'warn', target: label, line: doc.line, text: L(`The DOC for \`${label}\` has no ${docLabel('purpose', ed)}.`, `El DOC de \`${label}\` no tiene ${docLabel('purpose', ed)}.`) });
    if (!isClass) {
      const ins = F.inputs || '';
      for (const p of def.params) if (!new RegExp('(^|[^\\p{L}\\p{N}_])' + p.name + '([^\\p{L}\\p{N}_]|$)', 'u').test(ins)) out.push({ level: 'warn', target: label, line: doc.line, text: L(`${docLabel('inputs', ed)} for \`${label}\` does not mention \`${p.name}\`.`, `${docLabel('inputs', ed)} de \`${label}\` no menciona \`${p.name}\`.`) });
      const listed = [...ins.matchAll(/(?:^|[,;]\s*)([\p{L}_][\p{L}\p{N}_]*)\s*[(:]/gu)].map(m => m[1]);
      for (const n of listed) if (!def.params.some(p => p.name === n)) out.push({ level: 'warn', target: label, line: doc.line, text: L(`${docLabel('inputs', ed)} for \`${label}\` lists \`${n}\`, which is not a parameter.`, `${docLabel('inputs', ed)} de \`${label}\` incluye \`${n}\`, que no es un parámetro.`) });
      if (returnsValue(def) && !F.returns) out.push({ level: 'warn', target: label, line: doc.line, text: L(`\`${label}\` returns a value but its DOC has no ${docLabel('returns', ed)}.`, `\`${label}\` devuelve un valor pero su DOC no tiene ${docLabel('returns', ed)}.`) });
    } else {
      const attrs = selfAttrs(cls.init);
      const txt = F.attributes || '';
      for (const a of attrs) if (!txt.includes(a)) out.push({ level: 'warn', target: label, line: doc.line, text: L(`${docLabel('attributes', ed)} for \`${label}\` does not mention \`${a}\`.`, `${docLabel('attributes', ed)} de \`${label}\` no menciona \`${a}\`.`) });
    }
  };
  for (const [, f] of prog.funcs) check(f, f.name, false);
  for (const [, c] of prog.classes) { check(c, c.name, true, c); for (const m of c.methods) check(m, c.name + '.' + m.name, false); }
  return out;
}
function docTemplate(def, ed, isClass, cls) {
  const K = (f) => docLabel(f, ed);
  const lines = ['DOC', `  ${K('purpose')}: `];
  if (isClass) lines.push(`  ${K('attributes')}: ` + selfAttrs(cls.init).map(a => a + ' ()').join(', '));
  else {
    if (def.params.length) lines.push(`  ${K('inputs')}: ` + def.params.map(p => p.name + ' ()').join(', '));
    if (returnsValue(def)) lines.push(`  ${K('returns')}: `);
    if (!cls) lines.push(`  ${K('example')}: ${def.name}(${def.params.map(() => '').join(', ')}) -> `);
  }
  lines.push(kwName('end', ed) + ' DOC');
  return lines.join('\n');
}

// ----- Python generator -----
const PY_NAMES = {
  ASK: 'input', whole: 'int', decimal: 'float', text: 'str', round: 'round', length: 'len', is_a: 'isinstance', random: 'random.randint', random_seed: 'random.seed',
  sqrt: 'math.sqrt', abs: 'abs', min: 'min', max: 'max', sum: 'sum', code_of: 'ord', char_of: 'chr', from_json: 'json.loads', to_json: 'json.dumps', wait: 'time.sleep',
  forward: 'turtle.forward', back: 'turtle.back', turn: 'turtle.right', go_to: 'turtle.goto', pen_up: 'turtle.penup', pen_down: 'turtle.pendown',
  hide_turtle: 'turtle.hideturtle', show_turtle: 'turtle.showturtle', pen_color: 'turtle.pencolor', pen_size: 'turtle.pensize', copy: 'copy.copy'
};
const PY_IMPORTS = { random: 'import random', math: 'import math', json: 'import json', time: 'import time', turtle: 'import turtle', copy: 'import copy', blstudent: 'import blstudent  # teaching helpers for data, network and security tools', pytest: 'import pytest', re: 'import re' };
const PY_METHODS = { add: 'append', remove_at: 'pop', trim: 'strip', trim_start: 'lstrip', trim_end: 'rstrip', split_lines: 'splitlines', starts_with: 'startswith', ends_with: 'endswith',
  is_letters: 'isalpha', is_digits: 'isdigit', pad_left: 'rjust', pad_right: 'ljust' };
const DICT_BUILTINS = ['count_by', 'group_by', 'summarize', 'word_counts', 'letter_frequencies', 'password_strength', 'make_toy_keys'];
function toPython(prog) {
  const ed = prog.ed;
  const imports = new Set();
  const userNames = new Set([...prog.funcs.keys(), ...prog.classes.keys()]);
  const dictVars = new Set();
  const builtinCanon = (name) => {
    if (userNames.has(name)) return null;
    const low = name.toLowerCase();
    for (const b of REG.builtins) if (b.n.toLowerCase() === low || (b.es && b.es.toLowerCase() === low)) return b.n;
    for (const c of REG.classes) if (c.n.toLowerCase() === low || (c.es && c.es.toLowerCase() === low)) return c.n;
    return null;
  };
  const PREC = { or: 1, and: 2, not: 3, cmp: 4, add: 5, mul: 6, neg: 7, pow: 8, post: 9, atom: 10 };
  const wrap = (p, need) => (p[1] < need ? '(' + p[0] + ')' : p[0]);
  let usesPrinted = false;
  const E = (e) => {
    switch (e.k) {
      case 'Num': return [e.dec ? String(e.src || e.v) : String(e.v), PREC.atom];
      case 'Str': return [JSON.stringify(e.v), PREC.atom];
      case 'Bool': return [e.v ? 'True' : 'False', PREC.atom];
      case 'Nothing': return ['None', PREC.atom];
      case 'Self': return ['self', PREC.atom];
      case 'Name': {
        const c = builtinCanon(e.name);
        if (c && PY_NAMES[c]) { const m = PY_NAMES[c]; if (m.includes('.')) imports.add(m.split('.')[0]); return [m, PREC.atom]; }
        if (c) { imports.add('blstudent'); return ['blstudent.' + c, PREC.post]; }
        return [e.name, PREC.atom];
      }
      case 'Paren': return ['(' + E(e.e)[0] + ')', PREC.atom];
      case 'List': return ['[' + e.items.map(x => E(x)[0]).join(', ') + ']', PREC.atom];
      case 'Dict': return ['{' + e.pairs.map(([k, v]) => E(k)[0] + ': ' + E(v)[0]).join(', ') + '}', PREC.atom];
      case 'Comp': return ['[' + E(e.e)[0] + ' for ' + e.v + ' in ' + E(e.iter)[0] + (e.cond ? ' if ' + E(e.cond)[0] : '') + ']', PREC.atom];
      case 'Index': return [wrap(E(e.o), PREC.post) + '[' + E(e.i)[0] + ']', PREC.post];
      case 'Slice': return [wrap(E(e.o), PREC.post) + '[' + (e.a ? E(e.a)[0] : '') + ':' + (e.b ? E(e.b)[0] : '') + ']', PREC.post];
      case 'Attr': return [wrap(E(e.o), PREC.post) + '.' + canonMember(e.name), PREC.post];
      case 'Bin': {
        const map = { '+': ['+', PREC.add], '-': ['-', PREC.add], '*': ['*', PREC.mul], '/': ['/', PREC.mul], div: ['//', PREC.mul], mod: ['%', PREC.mul], '^': ['**', PREC.pow] };
        const [op, p] = map[e.op];
        if (e.op === '^') return [wrap(E(e.l), PREC.post) + ' ** ' + wrap(E(e.r), PREC.neg), p];
        return [wrap(E(e.l), p) + ' ' + op + ' ' + wrap(E(e.r), p + 1), p];
      }
      case 'Cmp': { const op = e.op === 'notin' ? 'not in' : e.op; return [wrap(E(e.l), PREC.add) + ' ' + op + ' ' + wrap(E(e.r), PREC.add), PREC.cmp]; }
      case 'Logic': return [wrap(E(e.l), e.op === 'or' ? PREC.or : PREC.and) + ' ' + e.op + ' ' + wrap(E(e.r), (e.op === 'or' ? PREC.or : PREC.and) + 1), e.op === 'or' ? PREC.or : PREC.and];
      case 'Not': return ['not ' + wrap(E(e.e), PREC.not), PREC.not];
      case 'Neg': return ['-' + wrap(E(e.e), PREC.neg), PREC.neg];
      case 'New': return [e.cls + '(' + e.args.map(x => E(x)[0]).join(', ') + ')', PREC.post];
      case 'ParentRef': return [e.name ? 'super().' + e.name : 'super().__init__', PREC.post];
      case 'Call': return callPy(e);
    }
    return ['None  # ?', PREC.atom];
  };
  const callPy = (e) => {
    const args = e.args.map(a => E(a)[0]);
    const f = e.f;
    if (f.k === 'Attr') {
      const o = wrap(E(f.o), PREC.post);
      const m = canonMember(f.name);
      const isDictRecv = f.o.k === 'Name' && dictVars.has(f.o.name);
      switch (m) {
        case 'contains': return [args[0] + ' in ' + o, PREC.cmp];
        case 'find': return [`(${o}.index(${args[0]}) if ${args[0]} in ${o} else -1)`, PREC.atom];
        case 'repeat': return [o + ' * ' + wrap(E(e.args[0]), PREC.mul + 1), PREC.mul];
        case 'is_blank': return [o + '.strip() == ""', PREC.cmp];
        case 'is_number': imports.add('blstudent'); return ['blstudent.is_number(' + o + ')', PREC.post];
        case 'keys': return ['list(' + o + '.keys())', PREC.post];
        case 'values': return ['list(' + o + '.values())', PREC.post];
        case 'remove': if (isDictRecv) return [o + '.pop(' + args[0] + ')', PREC.post]; break;
        case 'split': if (!args.length) return [o + '.split()', PREC.post]; break;
      }
      return [o + '.' + (PY_METHODS[m] || m) + '(' + args.join(', ') + ')', PREC.post];
    }
    if (f.k === 'ParentRef') return [E(f)[0] + '(' + args.join(', ') + ')', PREC.post];
    if (f.k === 'Name') {
      const c = builtinCanon(f.name);
      switch (c) {
        case 'type': return ['type(' + args[0] + ').__name__', PREC.post];
        case 'join': return [(args[1] || '""') + '.join(str(x) for x in ' + args[0] + ')', PREC.post];
        case 'format': return [`f"{${args[0]}:.${e.args[1].k === 'Num' ? e.args[1].v : '{' + args[1] + '}'}f}"`, PREC.atom];
        case 'now': imports.add('blstudent'); return ['blstudent.now()', PREC.post];
        case 'printed': usesPrinted = true; return ['capsys.readouterr().out.splitlines()', PREC.post];
        case 'ASK': return ['input(' + (args[0] ? args[0] + ' + " "' : '') + ')', PREC.post];
        case 'round': if (args.length === 2 && e.args[1].k === 'Num' && e.args[1].v === 0) return ['float(round(' + args[0] + '))', PREC.post]; break;
      }
    }
    return [wrap(E(f), PREC.post) + '(' + args.join(', ') + ')', PREC.post];
  };
  const out = [];
  const ind = (n) => '    '.repeat(n);
  const S = (s, n) => {
    const I = ind(n);
    switch (s.k) {
      case 'Print': out.push(I + 'print(' + s.exprs.map(x => E(x)[0]).join(', ') + ')'); return;
      case 'Assign': {
        if (s.target.k === 'Name' && s.op === '=') {
          const v = s.value;
          const isD = v.k === 'Dict' || (v.k === 'Call' && v.f.k === 'Name' && DICT_BUILTINS.includes(builtinCanon(v.f.name)));
          if (isD) dictVars.add(s.target.name);
        }
        out.push(I + E(s.target)[0] + ' ' + s.op + ' ' + E(s.value)[0]); return;
      }
      case 'ExprStmt': {
        const e = s.e;
        if (e.k === 'Call' && e.f.k === 'Attr' && canonMember(e.f.name) === 'remove' && e.f.o.k === 'Name' && dictVars.has(e.f.o.name)) { out.push(I + 'del ' + E(e.f.o)[0] + '[' + E(e.args[0])[0] + ']'); return; }
        out.push(I + E(e)[0]); return;
      }
      case 'If':
        s.branches.forEach((b, i) => { out.push(I + (i ? 'elif ' : 'if ') + E(b.cond)[0] + ':'); B_(b.body, n + 1); });
        if (s.elseBody) { out.push(I + 'else:'); B_(s.elseBody, n + 1); }
        return;
      case 'While': out.push(I + 'while ' + E(s.cond)[0] + ':'); B_(s.body, n + 1); return;
      case 'Repeat': out.push(I + 'for _ in range(' + E(s.count)[0] + '):'); B_(s.body, n + 1); return;
      case 'For': {
        const litVal = (x) => (x.k === 'Num' ? x.v : x.k === 'Neg' && x.e.k === 'Num' ? -x.e.v : null);
        const decimal = [s.from, s.to, s.step].some(x => x && (x.k === 'Num' && x.dec || x.k === 'Neg' && x.e.k === 'Num' && x.e.dec));
        const a = E(s.from)[0];
        const stepV = s.step ? litVal(s.step) : 1;
        if (decimal) { imports.add('blstudent'); out.push(I + `for ${s.v} in blstudent.frange(${a}, ${E(s.to)[0]}, ${s.step ? E(s.step)[0] : 1}):`); B_(s.body, n + 1); return; }
        const neg = stepV !== null && stepV < 0;
        const tv = litVal(s.to);
        const end = tv !== null && s.to.k === 'Num' ? String(tv + (neg ? -1 : 1)) : wrap(E(s.to), PREC.add) + (neg ? ' - 1' : ' + 1');
        if (stepV === null) out.push(I + '# The step is not a fixed number: this assumes it is positive.');
        out.push(I + `for ${s.v} in range(${a}, ${end}${s.step ? ', ' + E(s.step)[0] : ''}):`);
        B_(s.body, n + 1); return;
      }
      case 'ForEach': out.push(I + `for ${s.v} in ${E(s.iter)[0]}:`); B_(s.body, n + 1); return;
      case 'Break': out.push(I + 'break'); return;
      case 'Continue': out.push(I + 'continue'); return;
      case 'Return': out.push(I + 'return' + (s.value ? ' ' + E(s.value)[0] : '')); return;
      case 'Try':
        out.push(I + 'try:'); B_(s.body, n + 1);
        out.push(I + 'except Exception as error:');
        if (s.errVar) out.push(ind(n + 1) + s.errVar + ' = str(error)');
        B_(s.handler, n + 1); return;
      case 'Fail': out.push(I + 'raise ValueError(' + E(s.msg)[0] + ')'); return;
      case 'Expect': out.push(I + 'assert ' + E(s.e)[0]); return;
      case 'ExpectError':
        imports.add('pytest');
        if (s.contains) { imports.add('re'); out.push(I + `with pytest.raises(Exception, match=re.escape(${E(s.contains)[0]})):`); }
        else out.push(I + 'with pytest.raises(Exception):');
        out.push(ind(n + 1) + E(s.e)[0]); return;
      case 'FuncDef': case 'ClassDef': case 'Test': return;
    }
  };
  const B_ = (list, n) => { const before = out.length; for (const s of list) S(s, n); if (out.length === before) out.push(ind(n) + 'pass'); };
  const docstring = (doc, n) => {
    if (!doc) return;
    const F = doc.fields; const parts = [];
    if (F.purpose) parts.push(F.purpose);
    if (F.inputs) parts.push('', 'Args: ' + F.inputs);
    if (F.attributes) parts.push('', 'Attributes: ' + F.attributes);
    if (F.returns) parts.push('Returns: ' + F.returns);
    if (F.errors) parts.push('Raises: ' + F.errors);
    for (const ex of doc.examples) { const c = splitArrow(ex.text); if (c) parts.push('', '>>> ' + c[0], c[1]); }
    out.push(ind(n) + '"""' + parts.join('\n' + ind(n)).replace(/"""/g, '\\"\\"\\"') + '\n' + ind(n) + '"""');
  };
  const fn = (def, n, isMethod, pyName) => {
    const ps = def.params.map(p => p.name + (p.def ? '=' + E(p.def)[0] : ''));
    if (isMethod) ps.unshift('self');
    out.push(ind(n) + 'def ' + (pyName || def.name) + '(' + ps.join(', ') + '):');
    docstring(def.doc, n + 1);
    B_(def.body, n + 1);
  };
  // pre-scan dict variables in order
  walk(prog.body, (s) => { if (s.k === 'Assign' && s.target.k === 'Name' && s.op === '=') { const v = s.value; if (v.k === 'Dict' || (v.k === 'Call' && v.f.k === 'Name' && DICT_BUILTINS.includes(builtinCanon(v.f.name)))) dictVars.add(s.target.name); } });
  // classes, parents first
  const order = []; const seen = new Set();
  const visitC = (name) => { if (seen.has(name)) return; seen.add(name); const c = prog.classes.get(name); if (c.parent && prog.classes.has(c.parent)) visitC(c.parent); order.push(c); };
  for (const name of prog.classes.keys()) visitC(name);
  for (const c of order) {
    let parent = c.parent || '';
    if (parent && !prog.classes.has(parent)) { const bc = builtinCanon(parent); if (bc) { imports.add('blstudent'); parent = 'blstudent.' + bc; } }
    out.push('class ' + c.name + (parent ? '(' + parent + ')' : '') + ':');
    const mark = out.length;
    docstring(c.doc, 1);
    if (c.init) { out.push(''); fn(c.init, 1, true, '__init__'); }
    for (const m of c.methods) {
      out.push(''); fn(m, 1, true);
      if (['describe', 'describir'].includes(m.name) && !m.params.length) { out.push(''); out.push('    def __str__(self):'); out.push('        return self.' + m.name + '()'); }
    }
    if (out.length === mark) out.push('    pass');
    out.push('', '');
  }
  for (const [, f] of prog.funcs) { fn(f, 0, false); out.push('', ''); }
  const mainStmts = prog.body.filter(s => !['FuncDef', 'ClassDef', 'Test'].includes(s.k));
  const hasTests = prog.tests.length > 0;
  if (mainStmts.length) {
    if (hasTests) { out.push('if __name__ == "__main__":'); B_(mainStmts, 1); }
    else for (const s of mainStmts) S(s, 0);
    out.push('');
  }
  for (const t of prog.tests) {
    usesPrinted = false;
    const slug = 'test_' + (t.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'unnamed');
    const bodyStart = out.length;
    out.push('');
    out.push('def ' + slug + '(PARAMS):');
    const hdr = out.length - 1;
    if (t.inputs) {
      out.push('    answers = iter([' + (t.inputs.k === 'List' ? t.inputs.items.map(x => E(x)[0]).map(s => (s.startsWith('"') ? s : 'str(' + s + ')')).join(', ') : E(t.inputs)[0]) + '])');
      out.push('    monkeypatch.setattr("builtins.input", lambda prompt="": next(answers))');
    }
    B_(t.body, 1);
    const params = []; if (t.inputs) params.push('monkeypatch'); if (usesPrinted) params.push('capsys');
    out[hdr] = out[hdr].replace('PARAMS', params.join(', '));
    void bodyStart;
  }
  const head = ['# Python version generated from main.bl (' + (ed === 'es' ? 'Spanish' : 'English') + ' edition).', '# Every construct maps to the Python a Grade 9-10 course uses.'];
  const imp = [...imports].sort().map(k => PY_IMPORTS[k]);
  const code = head.concat(imp.length ? [''].concat(imp) : [], ['', ''], out).join('\n').replace(/\n{4,}/g, '\n\n\n').trimEnd() + '\n';
  return code;
}

// ----- edition converter -----
function convertEdition(src, from, to) {
  if (from === to) return { code: src, renamed: [] };
  const toks = lex(src, from, true);
  const tgt = kwTable(to);
  const userNames = new Set();
  const sig = toks.filter(t => !t.skip && t.t !== 'nl');
  for (let i = 0; i < sig.length; i++) {
    const t = sig[i], p = sig[i - 1], nx = sig[i + 1];
    if (t.t !== 'id') continue;
    if (p && p.t === 'kw' && ['function', 'class', 'for', 'for_each', 'extends', 'new'].includes(p.v)) userNames.add(t.v);
    if (nx && nx.t === 'op' && ['=', '+=', '-=', '*=', '/='].includes(nx.v) && !(p && p.t === 'op' && p.v === '.')) userNames.add(t.v);
  }
  // parameters
  for (let i = 0; i < sig.length; i++) {
    if (sig[i].t === 'kw' && (sig[i].v === 'function' || sig[i].v === 'init')) {
      let j = i + 1; while (j < sig.length && !(sig[j].t === 'op' && sig[j].v === '(')) j++;
      for (j++; j < sig.length && !(sig[j].t === 'op' && sig[j].v === ')'); j++) if (sig[j].t === 'id' && sig[j + 1] && sig[j + 1].t === 'op' && (sig[j + 1].v === ',' || sig[j + 1].v === ')' || sig[j + 1].v === '=')) userNames.add(sig[j].v);
    }
  }
  const renamed = new Set();
  const clash = (w) => { const nw = norm(w); const c = tgt.single.get(nw); if (!c) return false; if (w.length === 1 && w !== w.toUpperCase()) return false; return true; };
  const builtinFor = (w) => {
    const low = w.toLowerCase();
    if (from === 'en') {
      for (const b of REG.builtins) if (b.n.toLowerCase() === low) return b.n;
      for (const c of REG.classes) if (c.n.toLowerCase() === low) return c.n;
    } else {
      if (ALIAS.names.has(low)) return ALIAS.names.get(low);
      for (const b of REG.builtins) if (b.n.toLowerCase() === low) return b.n;
    }
    return null;
  };
  const memberFor = (w) => {
    if (from === 'en') { return ALIAS.membersRev.has(w) ? w : null; }
    return ALIAS.members.get(w.toLowerCase()) || null;
  };
  let out = ''; let pos = 0; let prevSig = null;
  const label = (line) => {
    const m = line.match(/^(\s*)([\p{L}]+)(\s*:)/u);
    if (!m) return line;
    for (const f in DOC_FIELDS) if (norm(DOC_FIELDS[f][ED_INDEX[from]]) === norm(m[2])) return m[1] + DOC_FIELDS[f][ED_INDEX[to]] + line.slice(m[1].length + m[2].length);
    return line;
  };
  for (const t of toks) {
    if (t.t === 'nl' || t.t === 'eof') continue;
    out += src.slice(pos, t.s);
    let rep = src.slice(t.s, t.e);
    if (t.t === 'kw') rep = kwName(t.v, to);
    else if (t.t === 'id') {
      const afterDot = prevSig && prevSig.t === 'op' && prevSig.v === '.';
      if (afterDot) { const c = memberFor(t.v); if (c) rep = localMember(c, to); }
      else if (!userNames.has(t.v)) { const c = builtinFor(t.v); if (c) rep = localName(c, to); }
      if (rep === src.slice(t.s, t.e) && !afterDot && clash(rep)) { renamed.add(rep); rep = rep + '_'; }
    } else if (t.t === 'doc') {
      const raw = src.slice(t.s, t.e);
      const lines = raw.split('\n');
      rep = lines.map((ln, i) => {
        if (i === 0) return ln;
        if (i === lines.length - 1 && t.closeE > t.closeS) return ln.replace(new RegExp(norm(kwName('end', from)), 'i'), kwName('end', to)).replace(/^(\s*)\S+/, (m0, sp) => sp + kwName('end', to));
        return label(ln);
      }).join('\n');
    }
    out += rep;
    pos = t.e;
    if (!t.skip) prevSig = t;
  }
  out += src.slice(pos);
  // rename clashing identifiers consistently (all occurrences)
  return { code: out, renamed: [...renamed] };
}

// ----- change history (git simulation) -----
function lineDiff(a, b) {
  const A = a === '' ? [] : a.split('\n'), Bl = b === '' ? [] : b.split('\n');
  const n = A.length, m = Bl.length;
  if (n * m > 4e6) return [...A.map(x => ({ t: '-', s: x })), ...Bl.map(x => ({ t: '+', s: x }))];
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = A[i] === Bl[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ops = []; let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i] === Bl[j]) { ops.push({ t: ' ', s: A[i], ai: i, bj: j }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push({ t: '-', s: A[i], ai: i }); i++; }
    else { ops.push({ t: '+', s: Bl[j], bj: j }); j++; }
  }
  while (i < n) { ops.push({ t: '-', s: A[i], ai: i }); i++; }
  while (j < m) { ops.push({ t: '+', s: Bl[j], bj: j }); j++; }
  return ops;
}
function hunks(base, other) {
  const ops = lineDiff(base, other);
  const hs = []; let bi = 0, cur = null;
  for (const op of ops) {
    if (op.t === ' ') { if (cur) { hs.push(cur); cur = null; } bi++; continue; }
    if (!cur) cur = { s: bi, e: bi, lines: [] };
    if (op.t === '-') { bi++; cur.e = bi; } else cur.lines.push(op.s);
  }
  if (cur) hs.push(cur);
  return hs;
}
function merge3(base, ours, theirs) {
  const B0 = base === '' ? [] : base.split('\n');
  const ha = hunks(base, ours).map(h => ({ ...h, side: 'a' })), hb = hunks(base, theirs).map(h => ({ ...h, side: 'b' }));
  const all = ha.concat(hb).sort((x, y) => x.s - y.s || x.e - y.e);
  const out = []; const conflicts = []; let pos = 0; let k = 0;
  const apply = (hs, s, e) => { const r = []; let p = s; for (const h of hs) { r.push(...B0.slice(p, h.s)); r.push(...h.lines); p = h.e; } r.push(...B0.slice(p, e)); return r; };
  while (k < all.length) {
    const grp = [all[k]]; let gs = all[k].s, ge = all[k].e; k++;
    while (k < all.length && (all[k].s < ge || (all[k].s === ge && (all[k].s === all[k].e || grp.some(g => g.s === g.e && g.s === all[k].s))))) { grp.push(all[k]); ge = Math.max(ge, all[k].e); k++; }
    out.push(...B0.slice(pos, gs));
    const ga = grp.filter(h => h.side === 'a'), gb = grp.filter(h => h.side === 'b');
    const ra = apply(ga, gs, ge), rb = apply(gb, gs, ge);
    if (!ga.length) out.push(...rb);
    else if (!gb.length) out.push(...ra);
    else if (ra.join('\n') === rb.join('\n')) out.push(...ra);
    else { conflicts.push({ index: out.length, base: B0.slice(gs, ge), ours: ra, theirs: rb }); out.push({ conflict: conflicts.length - 1 }); }
    pos = ge;
  }
  out.push(...B0.slice(pos));
  return { parts: out, conflicts };
}
function mergedText(parts, choose) {
  const lines = [];
  for (const p of parts) { if (typeof p === 'string') lines.push(p); else lines.push(...choose(p.conflict)); }
  return lines.join('\n');
}
class Repo {
  constructor(data) {
    const d = data || {};
    this.commits = d.commits || {}; this.branches = d.branches || { main: null }; this.head = d.head || 'main';
    this.tags = d.tags || {}; this.remote = d.remote || { branches: {} }; this.cmdlog = d.cmdlog || []; this.staging = d.staging || null;
    this.counter = d.counter || 0;
  }
  toJSON() { return { commits: this.commits, branches: this.branches, head: this.head, tags: this.tags, remote: this.remote, cmdlog: this.cmdlog.slice(-200), staging: this.staging, counter: this.counter }; }
  logCmd(c) { this.cmdlog.push(c); }
  headId() { return this.branches[this.head] || null; }
  filesAt(id) { return id && this.commits[id] ? this.commits[id].files : {}; }
  headFiles() { return this.filesAt(this.headId()); }
  status(work) {
    const base = this.headFiles(); const staged = this.staging;
    const names = new Set([...Object.keys(base), ...Object.keys(work)]);
    const out = [];
    for (const n of names) {
      const inB = n in base, inW = n in work;
      if (inB && inW && base[n] === work[n]) continue;
      const state = !inB ? 'added' : !inW ? 'deleted' : 'modified';
      const isStaged = !!staged && (inW ? staged[n] === work[n] : !(n in staged));
      const d = lineDiff(inB ? base[n] : '', inW ? work[n] : '');
      out.push({ name: n, state, staged: isStaged, plus: d.filter(x => x.t === '+').length, minus: d.filter(x => x.t === '-').length });
    }
    return out.sort((a, b) => (a.name === 'main.bl' ? -1 : b.name === 'main.bl' ? 1 : a.name < b.name ? -1 : 1));
  }
  add(names, work) {
    const st = this.staging ? { ...this.staging } : { ...this.headFiles() };
    for (const n of names) { if (n in work) st[n] = work[n]; else delete st[n]; }
    this.staging = st;
    this.logCmd('git add ' + (names.length > 1 ? '.' : names[0]));
  }
  unstage() { this.staging = null; this.logCmd('git restore --staged .'); }
  makeId(parent, message, files) { this.counter++; return sha256(String(parent) + '\n' + message + '\n' + this.counter + '\n' + JSON.stringify(files) + Date.now()).slice(0, 7); }
  commit(message, work, opts) {
    opts = opts || {};
    const files = opts.useStaging && this.staging ? { ...this.staging } : { ...work };
    const parent = this.headId();
    if (!message || !message.trim()) throw new Error('empty-message');
    if (parent && JSON.stringify(sortObj(files)) === JSON.stringify(sortObj(this.headFiles())) && !opts.parents) throw new Error('nothing');
    const id = this.makeId(parent, message, files);
    this.commits[id] = { id, parents: opts.parents || (parent ? [parent] : []), message: message.trim(), files, time: Date.now(), branch: this.head };
    this.branches[this.head] = id;
    this.staging = null;
    if (!opts.silent) this.logCmd('git commit -m "' + message.trim().split('\n')[0].replace(/"/g, '\\"') + '"');
    return id;
  }
  ancestors(id) { const s = new Set(); const st = [id]; while (st.length) { const x = st.pop(); if (!x || s.has(x)) continue; s.add(x); st.push(...(this.commits[x] ? this.commits[x].parents : [])); } return s; }
  log() {
    const ids = new Set();
    for (const b in this.branches) for (const x of this.ancestors(this.branches[b])) ids.add(x);
    return [...ids].map(i => this.commits[i]).filter(Boolean).sort((a, b) => b.time - a.time || (b.id < a.id ? -1 : 1));
  }
  resolve(ref) {
    if (!ref) return null;
    if (this.branches[ref] !== undefined) return this.branches[ref];
    if (this.tags[ref]) return this.tags[ref];
    const hits = Object.keys(this.commits).filter(k => k.startsWith(ref));
    return hits.length === 1 ? hits[0] : null;
  }
  diffFiles(a, b) {
    const names = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
    return names.filter(n => a[n] !== b[n]).map(n => ({ name: n, ops: lineDiff(a[n] || '', b[n] || '') }));
  }
  branch(name) {
    if (!/^[\w.-]+$/.test(name)) throw new Error('bad-name');
    if (this.branches[name] !== undefined) throw new Error('exists');
    if (!this.headId()) throw new Error('no-commits');
    this.branches[name] = this.headId(); this.logCmd('git branch ' + name);
  }
  switchTo(name, work) {
    if (this.branches[name] === undefined) throw new Error('no-branch');
    if (this.status(work).length) throw new Error('dirty');
    this.head = name; this.logCmd('git switch ' + name);
    return { ...this.headFiles() };
  }
  mergeBase(a, b) {
    const A = this.ancestors(a); const st = [b]; const seen = new Set(); let best = null, bt = -1;
    while (st.length) { const x = st.pop(); if (!x || seen.has(x)) continue; seen.add(x); if (A.has(x) && this.commits[x].time > bt) { best = x; bt = this.commits[x].time; } st.push(...this.commits[x].parents); }
    return best;
  }
  merge(name, work) {
    const theirs = this.branches[name];
    if (theirs === undefined) throw new Error('no-branch');
    if (this.status(work).length) throw new Error('dirty');
    const ours = this.headId();
    this.logCmd('git merge ' + name);
    if (!theirs || this.ancestors(ours).has(theirs)) return { kind: 'uptodate' };
    if (!ours || this.ancestors(theirs).has(ours)) { this.branches[this.head] = theirs; return { kind: 'fastforward', files: { ...this.filesAt(theirs) } }; }
    const base = this.filesAt(this.mergeBase(ours, theirs)), A = this.filesAt(ours), Bf = this.filesAt(theirs);
    const names = [...new Set([...Object.keys(base), ...Object.keys(A), ...Object.keys(Bf)])];
    const files = {}; const conflicts = [];
    for (const n of names) {
      const b0 = base[n], a0 = A[n], c0 = Bf[n];
      if (a0 === c0) { if (a0 !== undefined) files[n] = a0; continue; }
      if (a0 === b0) { if (c0 !== undefined) files[n] = c0; continue; }
      if (c0 === b0) { if (a0 !== undefined) files[n] = a0; continue; }
      if (a0 === undefined || c0 === undefined) { conflicts.push({ name: n, whole: true, ours: a0 || '', theirs: c0 || '' }); continue; }
      const m = merge3(b0 || '', a0, c0);
      if (m.conflicts.length) conflicts.push({ name: n, parts: m.parts, chunks: m.conflicts });
      else files[n] = mergedText(m.parts, () => []);
    }
    if (!conflicts.length) {
      const id = this.commit(`Merge branch '${name}' into ${this.head}`, files, { parents: [ours, theirs], silent: true });
      return { kind: 'merged', id, files };
    }
    return { kind: 'conflict', files, conflicts, ours, theirs, name };
  }
  finishMerge(pending, resolvedFiles, message) {
    const id = this.commit(message || `Merge branch '${pending.name}' into ${this.head}`, resolvedFiles, { parents: [pending.ours, pending.theirs], silent: true });
    this.logCmd('git commit   # conflicts resolved');
    return id;
  }
  revert(id, work) {
    const c = this.commits[id];
    if (!c) throw new Error('no-commit');
    if (this.status(work).length) throw new Error('dirty');
    const parentFiles = this.filesAt(c.parents[0]);
    const headF = this.headFiles();
    const names = [...new Set([...Object.keys(parentFiles), ...Object.keys(c.files), ...Object.keys(headF)])];
    const files = {}; const conflicts = [];
    for (const n of names) {
      const base = c.files[n], ours = headF[n], theirs = parentFiles[n];
      if (ours === base) { if (theirs !== undefined) files[n] = theirs; continue; }
      if (theirs === base) { if (ours !== undefined) files[n] = ours; continue; }
      const m = merge3(base || '', ours || '', theirs || '');
      if (m.conflicts.length) conflicts.push(n); else files[n] = mergedText(m.parts, () => []);
    }
    this.logCmd('git revert ' + id);
    if (conflicts.length) return { kind: 'conflict', conflicts };
    const nid = this.commit('Revert "' + c.message.split('\n')[0] + '"', files, { silent: true });
    return { kind: 'reverted', id: nid, files };
  }
  tag(name, id) { if (!/^[\w.-]+$/.test(name)) throw new Error('bad-name'); const t = id || this.headId(); if (!t) throw new Error('no-commits'); this.tags[name] = t; this.logCmd('git tag ' + name + (id ? ' ' + id : '')); }
  push() {
    const id = this.headId(); const old = this.remote.branches[this.head];
    const n = id ? [...this.ancestors(id)].filter(x => !old || !this.ancestors(old).has(x)).length : 0;
    this.remote.branches[this.head] = id; this.logCmd('git push origin ' + this.head);
    return n;
  }
  pull() { this.logCmd('git pull origin ' + this.head); const r = this.remote.branches[this.head]; if (!r || this.ancestors(this.headId()).has(r)) return 0; this.branches[this.head] = r; return 1; }
}
function sortObj(o) { const r = {}; for (const k of Object.keys(o).sort()) r[k] = o[k]; return r; }
