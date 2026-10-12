// ===== Core part 1: utilities, editions, messages, lexer =====
const ED_INDEX = { en: 0, es: 1 };

const KW = {
  if: ['IF', 'SI'], then: ['THEN', 'ENTONCES'], else: ['ELSE', 'SINO'], end: ['END', 'FIN'],
  while: ['WHILE', 'MIENTRAS'], repeat: ['REPEAT', 'REPETIR'], times: ['TIMES', 'VECES'],
  for: ['FOR', 'PARA'], from: ['FROM', 'DESDE'], to: ['TO', 'HASTA'], step: ['STEP', 'CON PASO'],
  in: ['IN', 'EN'], break: ['BREAK', 'SALIR'], continue: ['CONTINUE', 'CONTINUAR'],
  function: ['FUNCTION', 'FUNCIÓN'], return: ['RETURN', 'DEVOLVER'], class: ['CLASS', 'CLASE'],
  extends: ['EXTENDS', 'EXTIENDE'], init: ['INIT', 'INICIAR'], new: ['NEW', 'NUEVO'],
  self: ['SELF', 'ESTE'], parent: ['PARENT', 'PADRE'], try: ['TRY', 'INTENTAR'],
  on_error: ['ON ERROR', 'SI FALLA'], fail: ['FAIL', 'FALLAR'], test: ['TEST', 'PRUEBA'],
  expect: ['EXPECT', 'COMPROBAR'], expect_error: ['EXPECT ERROR', 'COMPROBAR ERROR'],
  with_inputs: ['WITH INPUTS', 'CON ENTRADAS'], contains: ['CONTAINS', 'CONTIENE'],
  doc: ['DOC', 'DOC'], div: ['DIV', 'DIV'], mod: ['MOD', 'MOD'], and: ['AND', 'Y'], or: ['OR', 'O'],
  not: ['NOT', 'NO'], true: ['TRUE', 'VERDADERO'], false: ['FALSE', 'FALSO'],
  nothing: ['NOTHING', 'NADA'], print: ['PRINT', 'MOSTRAR'],
  else_if: ['ELSE IF', 'SINO SI'], for_each: ['FOR EACH', 'PARA CADA']
};
// Keywords that can follow END
const BLOCK_KW = ['if', 'while', 'repeat', 'for', 'function', 'class', 'init', 'try', 'test', 'doc'];

const DOC_FIELDS = {
  purpose: ['PURPOSE', 'PROPÓSITO'], inputs: ['INPUTS', 'ENTRADAS'], returns: ['RETURNS', 'DEVUELVE'],
  attributes: ['ATTRIBUTES', 'ATRIBUTOS'], errors: ['ERRORS', 'ERRORES'], example: ['EXAMPLE', 'EJEMPLO']
};

function norm(w) { return w.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase(); }
function kwName(canon, ed) { return KW[canon] ? KW[canon][ED_INDEX[ed] || 0] : canon; }

const KW_TABLES = {};
function kwTable(ed) {
  if (KW_TABLES[ed]) return KW_TABLES[ed];
  const single = new Map(), phrase = new Map();
  for (const canon in KW) {
    const word = KW[canon][ED_INDEX[ed]];
    const parts = word.split(' ');
    if (parts.length === 1) single.set(norm(word), canon);
    else {
      const k = norm(parts[0]);
      if (!phrase.has(k)) phrase.set(k, []);
      phrase.get(k).push({ second: norm(parts[1]), canon });
    }
  }
  return (KW_TABLES[ed] = { single, phrase });
}

// ----- Messages -----
const MSG = {
  E101: ['The `{kw}` on line {open} is never closed. Add `{end}` where the block should finish.',
         'El `{kw}` de la línea {open} nunca se cierra. Añade `{end}` donde deba terminar el bloque.'],
  E102: ['Line {line} says `{said}`, but the block open here is the `{kw}` from line {open}. Did you mean `{end}`?',
         'La línea {line} dice `{said}`, pero el bloque abierto aquí es el `{kw}` de la línea {open}. ¿Querías decir `{end}`?'],
  E103: ['This text is missing its closing quote. Add `{q}` at the end of the text.',
         'A este texto le falta la comilla de cierre. Añade `{q}` al final del texto.'],
  E104: ['I don\'t understand the character `{ch}` here.', 'No entiendo el carácter `{ch}` aquí.'],
  E105: ['I didn\'t expect `{tok}` here.{hint}', 'No esperaba `{tok}` aquí.{hint}'],
  E106: ['An `{if}` line needs `{then}` at the end.', 'Una línea `{if}` necesita `{then}` al final.'],
  E107: ['To compare, use `==`. A single `=` stores a value.', 'Para comparar usa `==`. Un solo `=` guarda un valor.'],
  E108: ['`{end}` needs the name of the block it closes, such as `{example}`.',
         '`{end}` necesita el nombre del bloque que cierra, por ejemplo `{example}`.'],
  E109: ['`{said}` on line {line} has no matching `{kw}` to close.', '`{said}` en la línea {line} no tiene un `{kw}` que cerrar.'],
  E110: ['I expected a value or an expression here.', 'Esperaba un valor o una expresión aquí.'],
  E111: ['I expected a name here.', 'Esperaba un nombre aquí.'],
  E112: ['Functions and classes can only be created at the top level, not inside another block.',
         'Las funciones y clases solo se pueden crear en el nivel principal, no dentro de otro bloque.'],
  E113: ['A `{open}` is missing its closing `{close}`.', 'A un `{open}` le falta su `{close}` de cierre.'],
  E114: ['You can only store a value in a variable, a list position, a dictionary key or an attribute.',
         'Solo puedes guardar un valor en una variable, una posición de lista, una clave de diccionario o un atributo.'],
  E115: ['`{word}` is a keyword, so it can\'t be used as a name.', '`{word}` es una palabra clave y no se puede usar como nombre.'],
  E116: ['`{kw}` can only be used inside a `{test}` block.', '`{kw}` solo se puede usar dentro de un bloque `{test}`.'],
  E117: ['`{ret}` can only be used inside a function.', '`{ret}` solo se puede usar dentro de una función.'],
  E118: ['`{kw}` can only be used inside a loop.', '`{kw}` solo se puede usar dentro de un bucle.'],
  E119: ['Inside a `{class}` you can only write `{init}`, `{function}` and `{doc}` blocks.',
         'Dentro de una `{class}` solo puedes escribir bloques `{init}`, `{function}` y `{doc}`.'],
  E120: ['I expected `{want}` here.', 'Esperaba `{want}` aquí.'],
  E121: ['`{self}` can only be used inside a method of a class.', '`{self}` solo se puede usar dentro de un método de una clase.'],
  E122: ['A `{doc}` block must come right before a `{function}` or `{class}`.',
         'Un bloque `{doc}` debe ir justo antes de una `{function}` o una `{class}`.'],
  E201: ['I don\'t know `{name}` yet.{hint}', 'Todavía no conozco `{name}`.{hint}'],
  E202: ['You can\'t add text and a number. Try `{fix}`.', 'No puedes sumar texto y un número. Prueba `{fix}`.'],
  E203: ['`{op}` doesn\'t work with {a} and {b}.', '`{op}` no funciona con {a} y {b}.'],
  E204: ['`{name}` has {n} items, positions 0 to {last}. You asked for {i}.',
         '`{name}` tiene {n} elementos, posiciones 0 a {last}. Pediste la {i}.'],
  E205: ['`{name}` has no key {key}. Its keys are: {keys}.', '`{name}` no tiene la clave {key}. Sus claves son: {keys}.'],
  E206: ['`{cls}` objects have no attribute `{attr}`.{hint} New attributes belong in `{init}`.',
         'Los objetos `{cls}` no tienen el atributo `{attr}`.{hint} Los atributos nuevos van en `{init}`.'],
  E207: ['{what} has no attribute or method `{attr}`.{hint}', '{what} no tiene el atributo o método `{attr}`.{hint}'],
  E208: ['`{name}` expects {want}, but received {got}.', '`{name}` espera {want}, pero recibió {got}.'],
  E209: ['{what} can\'t be called like a function.', '{what} no se puede llamar como una función.'],
  E210: ['You can\'t divide by zero.', 'No se puede dividir entre cero.'],
  E211: ['Inside a function you can read `{name}` but not change it. `{ret}` the new value instead.',
         'Dentro de una función puedes leer `{name}` pero no cambiarlo. Usa `{ret}` para devolver el nuevo valor.'],
  E212: ['`{src}` gave `{nothing}`, which can\'t be used in a calculation. Does the function use `{ret}`?',
         '`{src}` dio `{nothing}`, que no se puede usar en un cálculo. ¿La función usa `{ret}`?'],
  E213: ['Too many calls inside calls (more than 500). A recursive function probably has no stopping case, or it goes too deep.',
         'Demasiadas llamadas anidadas (más de 500). Seguramente a una función recursiva le falta el caso de parada o llega demasiado hondo.'],
  E214: ['{msg}', '{msg}'],
  E215: ['`{fn}` can\'t turn {val} into {kind}.', '`{fn}` no puede convertir {val} en {kind}.'],
  E216: ['You can only loop through a list, text or dictionary, not {what}.',
         'Solo puedes recorrer una lista, un texto o un diccionario, no {what}.'],
  E217: ['Positions must be whole numbers, not {what}.', 'Las posiciones deben ser números enteros, no {what}.'],
  E218: ['Dictionary keys must be text or whole numbers.', 'Las claves de un diccionario deben ser texto o números enteros.'],
  E219: ['`{fn}`: {msg}', '`{fn}`: {msg}'],
  E220: ['This app runs offline, so it can\'t reach `{url}`. Use a sample address such as `sample:weather`.',
         'Esta aplicación funciona sin conexión y no puede acceder a `{url}`. Usa una dirección de ejemplo como `sample:weather`.'],
  E221: ['There is no file called `{name}`.{hint}', 'No hay ningún archivo llamado `{name}`.{hint}'],
  E222: ['I can\'t sort a list that mixes {a} and {b}.', 'No puedo ordenar una lista que mezcla {a} y {b}.'],
  E223: ['`{name}` is not a class, so `{new}` can\'t create it.', '`{name}` no es una clase, así que `{new}` no puede crearla.'],
  E224: ['Text can\'t be changed in place. Build new text instead, for example with `replace`.',
         'El texto no se puede cambiar directamente. Crea un texto nuevo, por ejemplo con `replace`.'],
  E225: ['I can\'t compare {a} and {b} with `{op}`.', 'No puedo comparar {a} y {b} con `{op}`.'],
  E226: ['`{name}` is a class. To create an object write `{new} {name}(...)`.',
         '`{name}` es una clase. Para crear un objeto escribe `{new} {name}(...)`.'],
  E227: ['{msg}', '{msg}'],
  E228: ['This text is not valid JSON: {msg}', 'Este texto no es JSON válido: {msg}'],
  E229: ['The test ran out of scripted inputs. Add more values to `{with}`.',
         'La prueba se quedó sin entradas preparadas. Añade más valores a `{with}`.'],
  E230: ['`{kw}` needs `{t}` or `{f}`, but got {what}.', '`{kw}` necesita `{t}` o `{f}`, pero recibió {what}.'],
  E231: ['This took too long (more than {n} steps). There may be a loop that never ends.',
         'Esto tardó demasiado (más de {n} pasos). Puede haber un bucle que nunca termina.'],
  E232: ['Keys can only be removed from a dictionary that has them. `{key}` is not there.',
         'Solo se pueden quitar claves que existen. `{key}` no está.']
};

class LangError extends Error {
  constructor(code, params, line) {
    super(code);
    this.code = code; this.params = params || {}; this.line = line || 0;
    this.isLang = true;
  }
}
function fmtMsg(code, params, ed) {
  const m = MSG[code];
  if (!m) return code;
  let s = m[ED_INDEX[ed] || 0];
  return s.replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? String(params[k]) : ''));
}
function errText(e, ed) {
  if (e && e.isLang) return fmtMsg(e.code, e.params, ed);
  return String(e && e.message || e);
}

// Levenshtein for suggestions
function lev(a, b) {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 3) return 99;
  const d = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
function closest(name, candidates) {
  let best = null, bd = 99;
  const lim = name.length <= 3 ? 1 : 2;
  for (const c of candidates) {
    const dd = lev(name.toLowerCase(), String(c).toLowerCase());
    if (dd < bd && dd <= lim) { bd = dd; best = c; }
  }
  return best;
}

// ----- Lexer -----
const OPS3 = [];
const OPS2 = ['==', '!=', '<=', '>=', '+=', '-=', '*=', '/=', '->'];
const OPS1 = '+-*/^()[]{},:.=<>';

function isIdStart(ch) { return /[\p{L}_]/u.test(ch); }
function isIdPart(ch) { return /[\p{L}\p{N}_]/u.test(ch); }

// tolerant: never throws, marks bad tokens (for highlighting & conversion)
function lex(src, ed, tolerant) {
  const table = kwTable(ed);
  const toks = [];
  let i = 0, line = 1, col = 1, depth = 0;
  const brStack = [];
  const n = src.length;
  let lineStart = true;
  const push = (t) => { toks.push(t); if (t.t !== 'nl') lineStart = false; };
  const prevSig = () => { for (let k = toks.length - 1; k >= 0; k--) { if (toks[k].t !== 'nl') return toks[k]; } return null; };
  while (i < n) {
    const ch = src[i];
    if (ch === '\n') {
      if (depth === 0) { if (toks.length && toks[toks.length - 1].t !== 'nl') toks.push({ t: 'nl', line, s: i, e: i + 1 }); lineStart = true; }
      i++; line++; col = 1; continue;
    }
    if (ch === ' ' || ch === '\t' || ch === '\r') { i++; col++; continue; }
    if (ch === '#') {
      const s = i;
      while (i < n && src[i] !== '\n') i++;
      toks.push({ t: 'comment', v: src.slice(s, i), line, s, e: i, skip: true });
      continue;
    }
    const s = i, sl = line;
    if (ch === '"' || ch === "'") {
      const q = ch; i++;
      let v = '', closed = false;
      while (i < n) {
        const c = src[i];
        if (c === '\\' && i + 1 < n) {
          const nx = src[i + 1];
          v += nx === 'n' ? '\n' : nx === 't' ? '\t' : nx; i += 2; continue;
        }
        if (c === q) { closed = true; i++; break; }
        if (c === '\n') break;
        v += c; i++;
      }
      if (!closed) {
        if (!tolerant) throw new LangError('E103', { q }, sl);
        push({ t: 'str', v, line: sl, s, e: i, bad: true }); continue;
      }
      push({ t: 'str', v, line: sl, s, e: i }); col += i - s; continue;
    }
    if (/[0-9]/.test(ch)) {
      while (i < n && /[0-9]/.test(src[i])) i++;
      let dec = false;
      if (src[i] === '.' && /[0-9]/.test(src[i + 1] || '')) { dec = true; i++; while (i < n && /[0-9]/.test(src[i])) i++; }
      const text = src.slice(s, i);
      push({ t: 'num', v: dec ? parseFloat(text) : parseInt(text, 10), dec, line, s, e: i });
      col += i - s; continue;
    }
    if (isIdStart(ch)) {
      while (i < n && isIdPart(src[i])) i++;
      const word = src.slice(s, i);
      const nw = norm(word);
      const pv = prevSig();
      const afterDot = pv && pv.t === 'op' && pv.v === '.';
      // DOC raw block
      if (!afterDot && lineStart && table.single.get(nw) === 'doc') {
        // capture until END DOC line
        let j = i;
        while (j < n && src[j] !== '\n') j++;
        const lines = [];
        let k = j + 1, ln = line + 1, closed = false, endS = j, endE = j;
        while (k <= n) {
          let le = src.indexOf('\n', k); if (le === -1) le = n;
          const text = src.slice(k, le);
          const tt = norm(text.trim());
          const endWord = norm(kwName('end', ed)), docWord = 'DOC';
          if (tt.replace(/\s+/g, ' ') === endWord + ' ' + docWord) { closed = true; endS = k; endE = le; i = le; line = ln; break; }
          lines.push({ text, line: ln, s: k });
          if (le >= n) { k = n + 1; break; }
          k = le + 1; ln++;
        }
        if (!closed) {
          if (!tolerant) throw new LangError('E101', { kw: kwName('doc', ed), open: sl, end: kwName('end', ed) + ' DOC' }, sl);
          i = n; line = ln;
        }
        push({ t: 'doc', lines, line: sl, s, e: i, endLine: line, kwS: s, kwE: s + word.length, closeS: endS, closeE: endE });
        continue;
      }
      let canon = afterDot ? null : table.single.get(nw);
      if (canon && word.length === 1 && word !== word.toUpperCase()) canon = null; // Y / O only uppercase
      let e = i;
      if (!afterDot && table.phrase.has(nw)) {
        let j = i;
        while (j < n && (src[j] === ' ' || src[j] === '\t')) j++;
        let k = j;
        while (k < n && isIdPart(src[k])) k++;
        if (k > j) {
          const w2 = norm(src.slice(j, k));
          const hit = table.phrase.get(nw).find(p => p.second === w2);
          if (hit) { canon = hit.canon; e = k; i = k; }
        }
      }
      if (canon) push({ t: 'kw', v: canon, raw: src.slice(s, e), line, s, e });
      else push({ t: 'id', v: word, line, s, e: i });
      col += i - s; continue;
    }
    const two = src.slice(i, i + 2);
    if (OPS2.includes(two)) { push({ t: 'op', v: two, line, s, e: i + 2 }); i += 2; col += 2; continue; }
    if (OPS1.includes(ch)) {
      if ('([{'.includes(ch)) { depth++; brStack.push({ ch, line }); }
      if (')]}'.includes(ch)) { depth = Math.max(0, depth - 1); brStack.pop(); }
      push({ t: 'op', v: ch, line, s, e: i + 1 }); i++; col++; continue;
    }
    if (!tolerant) throw new LangError('E104', { ch }, line);
    push({ t: 'bad', v: ch, line, s, e: i + 1 }); i++;
  }
  if (!tolerant && brStack.length) {
    const b = brStack[brStack.length - 1];
    throw new LangError('E113', { open: b.ch, close: { '(': ')', '[': ']', '{': '}' }[b.ch] }, b.line);
  }
  if (toks.length && toks[toks.length - 1].t !== 'nl') toks.push({ t: 'nl', line, s: n, e: n });
  toks.push({ t: 'eof', line, s: n, e: n });
  return toks;
}
