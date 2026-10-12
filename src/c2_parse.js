// ===== Core part 2: parser =====
const CLOSER_OF = { if: 'if', while: 'while', repeat: 'repeat', for: 'for', for_each: 'for', function: 'function',
  class: 'class', init: 'init', try: 'try', test: 'test' };

class Parser {
  constructor(src, ed) {
    this.src = src; this.ed = ed || 'en';
    this.toks = lex(src, this.ed, false).filter(t => !t.skip);
    this.p = 0; this.blocks = []; this.funcDepth = 0; this.loopDepth = 0; this.inTest = 0;
    this.inMethod = 0; this.prevEnd = 0; this.classDepth = 0;
    this.funcs = new Map(); this.classes = new Map(); this.tests = []; this.docs = [];
  }
  K(c) { return kwName(c, this.ed); }
  peek(o = 0) { return this.toks[Math.min(this.p + o, this.toks.length - 1)]; }
  next() { const t = this.toks[this.p]; if (this.p < this.toks.length - 1) this.p++; this.prevEnd = t.e; return t; }
  isKw(c, o = 0) { const t = this.peek(o); return t.t === 'kw' && t.v === c; }
  isOp(v, o = 0) { const t = this.peek(o); return t.t === 'op' && t.v === v; }
  tokText(t) {
    if (t.t === 'nl') return this.ed === 'es' ? 'fin de línea' : 'end of line';
    if (t.t === 'eof') return this.ed === 'es' ? 'fin del programa' : 'end of program';
    if (t.t === 'doc') return 'DOC';
    return this.src.slice(t.s, t.e);
  }
  err(code, params, t) { return new LangError(code, params, (t || this.peek()).line); }
  expectKw(c) {
    if (!this.isKw(c)) throw this.err('E120', { want: this.K(c) });
    return this.next();
  }
  expectOp(v) {
    if (!this.isOp(v)) {
      const t = this.peek();
      if (t.t === 'nl' || t.t === 'eof') throw this.err('E120', { want: v });
      throw this.err('E105', { tok: this.tokText(t), hint: this.ed === 'es' ? ` Esperaba \`${v}\`.` : ` I expected \`${v}\`.` });
    }
    return this.next();
  }
  name() {
    const t = this.peek();
    if (t.t === 'id') { this.next(); return t.v; }
    if (t.t === 'kw') throw this.err('E115', { word: this.tokText(t) });
    throw this.err('E111', {});
  }
  skipNl() { while (this.peek().t === 'nl') this.next(); }
  endStmt() {
    const t = this.peek();
    if (t.t === 'nl') { this.next(); return; }
    if (t.t === 'eof') return;
    let hint = '';
    if (t.t === 'op' && t.v === '=' ) hint = this.ed === 'es' ? ' Para comparar usa `==`.' : ' To compare, use `==`.';
    throw this.err('E105', { tok: this.tokText(t), hint });
  }

  parseProgram() {
    const body = this.statements(new Set());
    return { body, funcs: this.funcs, classes: this.classes, tests: this.tests, src: this.src, ed: this.ed };
  }

  // parse statements until a terminator keyword (not consumed)
  statements(terms) {
    const out = [];
    for (;;) {
      this.skipNl();
      const t = this.peek();
      if (t.t === 'eof') {
        if (this.blocks.length) {
          const b = this.blocks[this.blocks.length - 1];
          throw new LangError('E101', { kw: this.K(b.kw), open: b.line, end: this.K('end') + ' ' + this.K(CLOSER_OF[b.kw]) }, b.line);
        }
        return out;
      }
      if (t.t === 'kw' && terms.has(t.v)) return out;
      if (t.t === 'kw' && t.v === 'end') {
        if (!this.blocks.length) {
          const nx = this.peek(1);
          const said = this.tokText(t) + (nx.t === 'kw' ? ' ' + this.tokText(nx) : '');
          throw this.err('E109', { said, line: t.line, kw: nx.t === 'kw' ? this.tokText(nx) : '' }, t);
        }
        return out;
      }
      if (t.t === 'kw' && (t.v === 'else' || t.v === 'else_if' || t.v === 'on_error')) {
        throw this.err('E105', { tok: this.tokText(t), hint: '' });
      }
      out.push(this.statement());
    }
  }

  // consume END <kw> for the innermost block
  closeBlock() {
    const b = this.blocks[this.blocks.length - 1];
    const endTok = this.peek();
    if (!(endTok.t === 'kw' && endTok.v === 'end')) {
      throw new LangError('E101', { kw: this.K(b.kw), open: b.line, end: this.K('end') + ' ' + this.K(CLOSER_OF[b.kw]) }, b.line);
    }
    this.next();
    const kt = this.peek();
    const want = CLOSER_OF[b.kw];
    if (!(kt.t === 'kw' && (BLOCK_KW.includes(kt.v) || kt.v === 'for_each'))) {
      throw this.err('E108', { end: this.tokText(endTok), example: this.K('end') + ' ' + this.K(want) }, endTok);
    }
    const said = CLOSER_OF[kt.v] || kt.v;
    if (said !== want) {
      // does it match an outer block? then the inner one is unclosed
      const outer = this.blocks.slice(0, -1).some(x => CLOSER_OF[x.kw] === said);
      if (outer) throw new LangError('E101', { kw: this.K(b.kw), open: b.line, end: this.K('end') + ' ' + this.K(want) }, b.line);
      throw this.err('E102', { line: endTok.line, said: this.tokText(endTok) + ' ' + this.tokText(kt), kw: this.K(b.kw),
        open: b.line, end: this.K('end') + ' ' + this.K(want) }, endTok);
    }
    this.next();
    this.blocks.pop();
    const endLine = endTok.line;
    this.endStmt();
    return endLine;
  }

  body(kw, line) {
    this.blocks.push({ kw, line });
    const st = this.statements(new Set());
    return st;
  }

  statement() {
    const t = this.peek();
    const line = t.line;
    if (t.t === 'doc') {
      this.next();
      const doc = this.parseDoc(t);
      this.skipNl();
      const nx = this.peek();
      if (!(nx.t === 'kw' && (nx.v === 'function' || nx.v === 'class'))) throw this.err('E122', { doc: 'DOC', function: this.K('function'), class: this.K('class') }, t);
      const node = this.statement();
      node.doc = doc;
      return node;
    }
    if (t.t === 'kw') {
      switch (t.v) {
        case 'print': {
          this.next();
          const exprs = [];
          if (!(this.peek().t === 'nl' || this.peek().t === 'eof')) {
            exprs.push(this.expr());
            while (this.isOp(',')) { this.next(); exprs.push(this.expr()); }
          }
          this.endStmt();
          return { k: 'Print', exprs, line };
        }
        case 'if': return this.parseIf();
        case 'while': {
          this.next();
          const cond = this.expr();
          if (this.isOp('=')) throw this.err('E107', {});
          this.endStmt();
          this.loopDepth++;
          const body = this.body('while', line);
          this.loopDepth--;
          const endLine = this.closeBlock();
          return { k: 'While', cond, body, line, endLine };
        }
        case 'repeat': {
          this.next();
          const count = this.expr();
          this.expectKw('times');
          this.endStmt();
          this.loopDepth++;
          const body = this.body('repeat', line);
          this.loopDepth--;
          const endLine = this.closeBlock();
          return { k: 'Repeat', count, body, line, endLine };
        }
        case 'for': {
          this.next();
          const v = this.name();
          this.expectKw('from');
          const from = this.expr();
          this.expectKw('to');
          const to = this.expr();
          let step = null;
          if (this.isKw('step')) { this.next(); step = this.expr(); }
          this.endStmt();
          this.loopDepth++;
          const body = this.body('for', line);
          this.loopDepth--;
          const endLine = this.closeBlock();
          return { k: 'For', v, from, to, step, body, line, endLine };
        }
        case 'for_each': {
          this.next();
          const v = this.name();
          this.expectKw('in');
          const iter = this.expr();
          this.endStmt();
          this.loopDepth++;
          const body = this.body('for_each', line);
          this.loopDepth--;
          const endLine = this.closeBlock();
          return { k: 'ForEach', v, iter, body, line, endLine };
        }
        case 'break': case 'continue': {
          this.next();
          if (!this.loopDepth) throw this.err('E118', { kw: this.tokText(t) }, t);
          this.endStmt();
          return { k: t.v === 'break' ? 'Break' : 'Continue', line };
        }
        case 'function': {
          if (this.blocks.length && !(this.classDepth && this.blocks.length === 1)) throw this.err('E112', {}, t);
          return this.parseFunc();
        }
        case 'class': {
          if (this.blocks.length) throw this.err('E112', {}, t);
          return this.parseClass();
        }
        case 'return': {
          this.next();
          if (!this.funcDepth) throw this.err('E117', { ret: this.tokText(t) }, t);
          let value = null;
          if (!(this.peek().t === 'nl' || this.peek().t === 'eof')) value = this.expr();
          this.endStmt();
          return { k: 'Return', value, line };
        }
        case 'try': {
          this.next(); this.endStmt();
          this.blocks.push({ kw: 'try', line });
          const body = this.statements(new Set(['on_error']));
          let errVar = null, handler = [];
          if (this.isKw('on_error')) {
            this.next();
            if (this.peek().t === 'id') errVar = this.name();
            this.endStmt();
            handler = this.statements(new Set());
          }
          const endLine = this.closeBlock();
          return { k: 'Try', body, errVar, handler, line, endLine };
        }
        case 'fail': {
          this.next();
          const msg = this.expr();
          this.endStmt();
          return { k: 'Fail', msg, line };
        }
        case 'test': {
          if (this.blocks.length) throw this.err('E112', {}, t);
          this.next();
          const nt = this.peek();
          let name;
          if (nt.t === 'str') { this.next(); name = nt.v; } else throw this.err('E120', { want: '"..."' });
          let inputs = null;
          if (this.isKw('with_inputs')) { this.next(); inputs = this.expr(); }
          this.endStmt();
          this.inTest++;
          const body = this.body('test', line);
          this.inTest--;
          const endLine = this.closeBlock();
          const node = { k: 'Test', name, inputs, body, line, endLine };
          this.tests.push(node);
          return node;
        }
        case 'expect': case 'expect_error': {
          this.next();
          if (!this.inTest) throw this.err('E116', { kw: this.tokText(t), test: this.K('test') }, t);
          const st = this.peek().s;
          const e = this.expr();
          e.src = this.src.slice(st, this.prevEnd);
          if (t.v === 'expect') { this.endStmt(); return { k: 'Expect', e, line }; }
          let contains = null;
          if (this.isKw('contains')) { this.next(); contains = this.expr(); }
          this.endStmt();
          return { k: 'ExpectError', e, contains, line };
        }
        case 'else': case 'else_if': case 'then': case 'on_error': case 'times': case 'from': case 'to': case 'step':
        case 'extends': case 'contains': case 'with_inputs':
          throw this.err('E105', { tok: this.tokText(t), hint: '' }, t);
        case 'init':
          throw this.err('E119', { class: this.K('class'), init: this.K('init'), function: this.K('function'), doc: 'DOC' }, t);
      }
    }
    // assignment or expression statement
    const st = t.s;
    const e = this.expr();
    const op = this.peek();
    if (op.t === 'op' && ['=', '+=', '-=', '*=', '/='].includes(op.v)) {
      if (!['Name', 'Index', 'Attr'].includes(e.k)) throw this.err('E114', {}, op);
      this.next();
      const value = this.expr();
      this.endStmt();
      return { k: 'Assign', target: e, op: op.v, value, line };
    }
    this.endStmt();
    e.src = e.src || this.src.slice(st, this.prevEnd);
    return { k: 'ExprStmt', e, line };
  }

  parseIf() {
    const t = this.next();
    const line = t.line;
    const branches = [];
    let cond = this.expr();
    if (this.isOp('=')) throw this.err('E107', {});
    if (!this.isKw('then')) {
      const nx = this.peek();
      if (nx.t === 'nl' || nx.t === 'eof') throw this.err('E106', { if: this.K('if'), then: this.K('then') });
      throw this.err('E105', { tok: this.tokText(nx), hint: '' });
    }
    this.next(); this.endStmt();
    this.blocks.push({ kw: 'if', line });
    let body = this.statements(new Set(['else', 'else_if']));
    branches.push({ cond, body, line });
    let elseBody = null, elseLine = null;
    for (;;) {
      if (this.isKw('else_if')) {
        const bl = this.next().line;
        const c = this.expr();
        if (this.isOp('=')) throw this.err('E107', {});
        if (!this.isKw('then')) throw this.err('E106', { if: this.K('else_if'), then: this.K('then') });
        this.next(); this.endStmt();
        const b = this.statements(new Set(['else', 'else_if']));
        branches.push({ cond: c, body: b, line: bl });
        continue;
      }
      if (this.isKw('else')) {
        elseLine = this.next().line; this.endStmt();
        elseBody = this.statements(new Set());
      }
      break;
    }
    const endLine = this.closeBlock();
    return { k: 'If', branches, elseBody, elseLine, line, endLine };
  }

  params() {
    this.expectOp('(');
    const ps = [];
    let sawDefault = false;
    if (!this.isOp(')')) {
      for (;;) {
        const name = this.name();
        let def = null;
        if (this.isOp('=')) { this.next(); def = this.expr(); sawDefault = true; }
        else if (sawDefault) throw this.err('E105', { tok: name, hint: this.ed === 'es' ? ' Los parámetros con valor por defecto van al final.' : ' Parameters with default values must come last.' });
        ps.push({ name, def });
        if (this.isOp(',')) { this.next(); continue; }
        break;
      }
    }
    this.expectOp(')');
    return ps;
  }

  parseFunc(isMethod) {
    const t = this.next();
    const line = t.line;
    const name = this.name();
    const params = this.params();
    this.endStmt();
    this.funcDepth++;
    if (isMethod) this.inMethod++;
    const body = this.body('function', line);
    this.funcDepth--;
    if (isMethod) this.inMethod--;
    const endLine = this.closeBlock();
    const node = { k: 'FuncDef', name, params, body, line, endLine };
    if (!isMethod) this.funcs.set(name, node);
    return node;
  }

  parseClass() {
    const t = this.next();
    const line = t.line;
    const name = this.name();
    let parent = null;
    if (this.isKw('extends')) { this.next(); parent = this.name(); }
    this.endStmt();
    this.blocks.push({ kw: 'class', line });
    this.classDepth++;
    let init = null; const methods = []; let pendingDoc = null;
    for (;;) {
      this.skipNl();
      const m = this.peek();
      if (m.t === 'kw' && m.v === 'end') break;
      if (m.t === 'eof') throw new LangError('E101', { kw: this.K('class'), open: line, end: this.K('end') + ' ' + this.K('class') }, line);
      if (m.t === 'doc') { this.next(); pendingDoc = this.parseDoc(m); continue; }
      if (m.t === 'kw' && m.v === 'init') {
        this.next();
        const params = this.params();
        this.endStmt();
        this.funcDepth++; this.inMethod++;
        const body = this.body('init', m.line);
        this.funcDepth--; this.inMethod--;
        const endLine = this.closeBlock();
        init = { k: 'FuncDef', name: 'INIT', params, body, line: m.line, endLine, isInit: true, doc: pendingDoc };
        pendingDoc = null;
        continue;
      }
      if (m.t === 'kw' && m.v === 'function') {
        const f = this.parseFunc(true);
        f.doc = pendingDoc; pendingDoc = null;
        methods.push(f);
        continue;
      }
      throw this.err('E119', { class: this.K('class'), init: this.K('init'), function: this.K('function'), doc: 'DOC' }, m);
    }
    this.classDepth--;
    const endLine = this.closeBlock();
    const node = { k: 'ClassDef', name, parent, init, methods, line, endLine };
    this.classes.set(name, node);
    return node;
  }

  parseDoc(t) {
    const fields = {}; const examples = []; let last = null;
    const labels = {};
    for (const f in DOC_FIELDS) { labels[norm(DOC_FIELDS[f][0])] = f; labels[norm(DOC_FIELDS[f][1])] = f; }
    for (const ln of t.lines) {
      const m = ln.text.match(/^\s*([\p{L}]+)\s*:\s*(.*)$/u);
      if (m && labels[norm(m[1])]) {
        const f = labels[norm(m[1])];
        if (f === 'example') { examples.push({ text: m[2].trim(), line: ln.line }); last = null; }
        else { fields[f] = (fields[f] ? fields[f] + ' ' : '') + m[2].trim(); last = f; }
      } else if (ln.text.trim()) {
        if (last) fields[last] += ' ' + ln.text.trim();
        else { fields._free = (fields._free ? fields._free + ' ' : '') + ln.text.trim(); }
      }
    }
    return { fields, examples, line: t.line, endLine: t.endLine };
  }

  // ----- expressions -----
  expr() {
    const st = this.peek().s;
    const e = this.orExpr();
    if (!e.src) e.src = this.src.slice(st, this.prevEnd);
    return e;
  }
  mk(node, st) { node.src = this.src.slice(st, this.prevEnd); return node; }
  orExpr() {
    const st = this.peek().s;
    let l = this.andExpr();
    while (this.isKw('or')) { const line = this.next().line; const r = this.andExpr(); l = this.mk({ k: 'Logic', op: 'or', l, r, line }, st); }
    return l;
  }
  andExpr() {
    const st = this.peek().s;
    let l = this.notExpr();
    while (this.isKw('and')) { const line = this.next().line; const r = this.notExpr(); l = this.mk({ k: 'Logic', op: 'and', l, r, line }, st); }
    return l;
  }
  notExpr() {
    const st = this.peek().s;
    if (this.isKw('not')) { const line = this.next().line; const e = this.notExpr(); return this.mk({ k: 'Not', e, line }, st); }
    return this.cmpExpr();
  }
  cmpExpr() {
    const st = this.peek().s;
    const l = this.addExpr();
    const t = this.peek();
    let op = null;
    if (t.t === 'op' && ['==', '!=', '<', '>', '<=', '>='].includes(t.v)) op = t.v;
    else if (t.t === 'kw' && t.v === 'in') op = 'in';
    else if (t.t === 'kw' && t.v === 'not' && this.peek(1).t === 'kw' && this.peek(1).v === 'in') { this.next(); op = 'notin'; }
    if (!op) return l;
    this.next();
    const r = this.addExpr();
    const t2 = this.peek();
    if (t2.t === 'op' && ['==', '!=', '<', '>', '<=', '>='].includes(t2.v)) {
      throw this.err('E105', { tok: t2.v, hint: this.ed === 'es' ? ' Usa `Y` para unir dos comparaciones.' : ' Use `AND` to join two comparisons.' });
    }
    return this.mk({ k: 'Cmp', op, l, r, line: t.line }, st);
  }
  addExpr() {
    const st = this.peek().s;
    let l = this.mulExpr();
    for (;;) {
      const t = this.peek();
      if (t.t === 'op' && (t.v === '+' || t.v === '-')) { this.next(); const r = this.mulExpr(); l = this.mk({ k: 'Bin', op: t.v, l, r, line: t.line }, st); }
      else return l;
    }
  }
  mulExpr() {
    const st = this.peek().s;
    let l = this.unary();
    for (;;) {
      const t = this.peek();
      let op = null;
      if (t.t === 'op' && (t.v === '*' || t.v === '/')) op = t.v;
      else if (t.t === 'kw' && (t.v === 'div' || t.v === 'mod')) op = t.v;
      if (!op) return l;
      this.next();
      const r = this.unary();
      l = this.mk({ k: 'Bin', op, l, r, line: t.line }, st);
    }
  }
  unary() {
    const st = this.peek().s;
    if (this.isOp('-')) { const line = this.next().line; const e = this.unary(); return this.mk({ k: 'Neg', e, line }, st); }
    if (this.isOp('+')) { this.next(); return this.unary(); }
    return this.power();
  }
  power() {
    const st = this.peek().s;
    const b = this.postfix();
    if (this.isOp('^')) { const line = this.next().line; const ex = this.unary(); return this.mk({ k: 'Bin', op: '^', l: b, r: ex, line }, st); }
    return b;
  }
  args() {
    const out = [];
    if (this.isOp(')')) { this.next(); return out; }
    for (;;) {
      out.push(this.expr());
      if (this.isOp('=')) throw this.err('E105', { tok: '=', hint: this.ed === 'es' ? ' Escribe solo los valores, en orden.' : ' Write only the values, in order.' });
      if (this.isOp(',')) { this.next(); continue; }
      break;
    }
    this.expectOp(')');
    return out;
  }
  postfix() {
    const st = this.peek().s;
    let e = this.primary();
    for (;;) {
      const t = this.peek();
      if (t.t === 'op' && t.v === '(') { this.next(); const args = this.args(); e = this.mk({ k: 'Call', f: e, args, line: t.line }, st); continue; }
      if (t.t === 'op' && t.v === '[') {
        this.next();
        let a = null, b = null, slice = false;
        if (!this.isOp(':')) a = this.expr();
        if (this.isOp(':')) { slice = true; this.next(); if (!this.isOp(']')) b = this.expr(); }
        this.expectOp(']');
        e = slice ? this.mk({ k: 'Slice', o: e, a, b, line: t.line }, st) : this.mk({ k: 'Index', o: e, i: a, line: t.line }, st);
        continue;
      }
      if (t.t === 'op' && t.v === '.') {
        this.next();
        const nt = this.peek();
        let name;
        if (nt.t === 'id') { this.next(); name = nt.v; }
        else if (nt.t === 'kw') { this.next(); name = this.tokText(nt); }
        else throw this.err('E111', {});
        if (e.k === 'Parent') {
          const isInit = norm(name) === norm(this.K('init')) || norm(name) === 'INIT' || norm(name) === 'INICIAR';
          e = this.mk({ k: 'ParentRef', name: isInit ? null : name, line: t.line }, st);
          continue;
        }
        e = this.mk({ k: 'Attr', o: e, name, line: t.line }, st);
        continue;
      }
      return e;
    }
  }
  primary() {
    const t = this.peek();
    const st = t.s;
    if (t.t === 'num') { this.next(); return this.mk({ k: 'Num', v: t.v, dec: t.dec, line: t.line }, st); }
    if (t.t === 'str') { this.next(); return this.mk({ k: 'Str', v: t.v, line: t.line }, st); }
    if (t.t === 'id') { this.next(); return this.mk({ k: 'Name', name: t.v, line: t.line }, st); }
    if (t.t === 'kw') {
      switch (t.v) {
        case 'true': this.next(); return this.mk({ k: 'Bool', v: true, line: t.line }, st);
        case 'false': this.next(); return this.mk({ k: 'Bool', v: false, line: t.line }, st);
        case 'nothing': this.next(); return this.mk({ k: 'Nothing', line: t.line }, st);
        case 'self':
          this.next();
          if (!this.inMethod) throw this.err('E121', { self: this.tokText(t) }, t);
          return this.mk({ k: 'Self', line: t.line }, st);
        case 'parent':
          this.next();
          if (!this.inMethod) throw this.err('E121', { self: this.tokText(t) }, t);
          if (!this.isOp('.')) throw this.err('E120', { want: '.' });
          return { k: 'Parent', line: t.line };
        case 'new': {
          this.next();
          const cname = this.name();
          let args = [];
          if (this.isOp('(')) { this.next(); args = this.args(); }
          return this.mk({ k: 'New', cls: cname, args, line: t.line }, st);
        }
      }
      throw this.err('E115', { word: this.tokText(t) }, t);
    }
    if (t.t === 'op' && t.v === '(') {
      this.next();
      const e = this.expr();
      this.expectOp(')');
      return this.mk({ k: 'Paren', e, line: t.line }, st);
    }
    if (t.t === 'op' && t.v === '[') {
      this.next();
      const items = [];
      if (this.isOp(']')) { this.next(); return this.mk({ k: 'List', items, line: t.line }, st); }
      const first = this.expr();
      if (this.isKw('for') || this.isKw('for_each')) {
        this.next();
        const v = this.name();
        this.expectKw('in');
        const iter = this.expr();
        let cond = null;
        if (this.isKw('if')) { this.next(); cond = this.expr(); }
        this.expectOp(']');
        return this.mk({ k: 'Comp', e: first, v, iter, cond, line: t.line }, st);
      }
      items.push(first);
      while (this.isOp(',')) { this.next(); if (this.isOp(']')) break; items.push(this.expr()); }
      this.expectOp(']');
      return this.mk({ k: 'List', items, line: t.line }, st);
    }
    if (t.t === 'op' && t.v === '{') {
      this.next();
      const pairs = [];
      while (!this.isOp('}')) {
        const key = this.expr();
        this.expectOp(':');
        const val = this.expr();
        pairs.push([key, val]);
        if (this.isOp(',')) { this.next(); continue; }
        break;
      }
      this.expectOp('}');
      return this.mk({ k: 'Dict', pairs, line: t.line }, st);
    }
    if (t.t === 'nl' || t.t === 'eof') throw this.err('E110', {});
    throw this.err('E105', { tok: this.tokText(t), hint: '' });
  }
}

function parse(src, ed) {
  return new Parser(src, ed).parseProgram();
}
function parseExprOnly(src, ed, inMethod) {
  const p = new Parser(src, ed);
  if (inMethod) p.inMethod = 1;
  const e = p.expr();
  p.skipNl();
  if (p.peek().t !== 'eof') throw p.err('E105', { tok: p.tokText(p.peek()), hint: '' });
  return e;
}
