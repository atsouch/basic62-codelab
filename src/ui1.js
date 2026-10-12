// ===== UI part 1: strings, helpers, storage, editor =====
const I18N = {
  about: ['About', 'Acerca de'], aboutMenu: ['About BASIC62 CodeLab', 'Acerca de BASIC62 CodeLab'],
  ftConcept: ['Concept & language design', 'Concepto y diseño del lenguaje'], ftLang: ['Learn BASIC62, a pathway to Python', 'Aprende BASIC62, un camino hacia Python'],
  ftSupported: ['Supported by', 'Con el apoyo de'], ftBuilt: ['Built with', 'Desarrollado con'], ftMit: ['MIT License', 'Licencia MIT'],
  abIntro: ['BASIC62 CodeLab is a browser-based educational programming environment for learning BASIC62, a modern, beginner-friendly language inspired by classic BASIC and designed to provide a progressive pathway to Python.', 'BASIC62 CodeLab es un entorno educativo de programación en el navegador para aprender BASIC62, un lenguaje moderno y accesible para principiantes, inspirado en el BASIC clásico y diseñado como un camino progresivo hacia Python.'],
  abLang: ["BASIC62: Binary's Accessible Syntax for Introductory Computing", "BASIC62: Binary's Accessible Syntax for Introductory Computing"],
  abTag: ['62 Years of BASIC. A New Pathway to Python.', '62 años de BASIC. Un nuevo camino hacia Python.'],
  abConcept: ['Original Concept, BASIC62 Language Design & Educational Direction', 'Concepto original, diseño del lenguaje BASIC62 y dirección educativa'],
  abAI: ['AI-Assisted Software Implementation', 'Implementación del software asistida por IA'],
  abInspired: ['BASIC62 CodeLab was created to celebrate the 62nd anniversary of BASIC, honoring the educational vision of John G. Kemeny and Thomas E. Kurtz, who introduced BASIC at Dartmouth College on May 1, 1964.', 'BASIC62 CodeLab se creó para celebrar el 62.º aniversario de BASIC, en homenaje a la visión educativa de John G. Kemeny y Thomas E. Kurtz, que presentaron BASIC en Dartmouth College el 1 de mayo de 1964.'],
  abIndependent: ['BASIC62 CodeLab is an independent educational project. It is not affiliated with or endorsed by Dartmouth College, or by any organization or individual that created, published or maintains a version or dialect of BASIC.', 'BASIC62 CodeLab es un proyecto educativo independiente. No está afiliado a Dartmouth College ni cuenta con su respaldo, ni con el de ninguna organización o persona que haya creado, publicado o mantenga una versión o dialecto de BASIC.'],
  abBinary: ['Binary Logic publishes K-12 Computing, Computer Science and AI Literacy teaching and learning resources.', 'Binary Logic publica recursos de enseñanza y aprendizaje de Informática, Ciencias de la Computación y Alfabetización en IA para K-12.'],
  abLicenseLabel: ['License', 'Licencia'], abStatusLabel: ['Development Status', 'Estado de desarrollo'],
  abLicense: ['MIT License. BASIC62 and BASIC62 CodeLab are the names of the original project. The license does not grant trademark rights or imply endorsement by Andreas Tsouchlaris or Binary Logic.', 'Licencia MIT. BASIC62 y BASIC62 CodeLab son los nombres del proyecto original. La licencia no concede derechos de marca ni implica el respaldo de Andreas Tsouchlaris o Binary Logic.'],
  abFeedback: ['Any corrections or suggestions are always welcome.', 'Cualquier corrección o sugerencia es siempre bienvenida.'],
  abVersion: ['Prototype | BASIC62 Language Specification v0.1', 'Prototipo | Especificación del lenguaje BASIC62 v0.1'],
  examples: ['Examples', 'Ejemplos'], canvas: ['Canvas', 'Lienzo'], project: ['Project', 'Proyecto'], run: ['Run', 'Ejecutar'], stop: ['Stop', 'Detener'], step: ['Step', 'Paso'],
  runTests: ['Run tests', 'Ejecutar pruebas'], output: ['Output', 'Salida'], clear: ['Clear', 'Borrar'],
  tDebug: ['Debug', 'Depurar'], tTests: ['Tests', 'Pruebas'], tDocs: ['Docs & credits', 'Documentación y créditos'], tHistory: ['History', 'Historial'],
  tPython: ['Python', 'Python'], tFiles: ['Files', 'Archivos'], tReference: ['Reference', 'Referencia'],
  ready: ['Ready', 'Listo'], running: ['Running', 'Ejecutando'], paused: ['Paused at line {n}', 'En pausa en la línea {n}'], waitingInput: ['Waiting for your answer', 'Esperando tu respuesta'],
  waitingEvents: ['Waiting for clicks and keys', 'Esperando clics y teclas'], finished: ['Finished', 'Terminado'], errorAt: ['Error on line {n}', 'Error en la línea {n}'],
  stopped: ['Stopped', 'Detenido'], waiting: ['Waiting', 'Esperando'], guardMsg: ['This has run for 5 seconds without any output. It may be stuck in a loop.', 'Lleva 5 segundos sin mostrar nada. Puede estar atascado en un bucle.'],
  keepRunning: ['Keep running', 'Seguir'], answer: ['Answer', 'Responder'], line: ['line', 'línea'], goLine: ['Line {n}', 'Línea {n}'],
  whyBtn: ['Why?', '¿Por qué?'], finishedIn: ['Finished in {n} steps.', 'Terminado en {n} pasos.'],
  into: ['Step into', 'Entrar'], over: ['Step over', 'Pasar'], out: ['Step out', 'Salir'], back: ['Step back', 'Retroceder'], cont: ['Continue', 'Continuar'],
  toCursor: ['Run to cursor', 'Hasta el cursor'], animate: ['Animate', 'Animar'], speed: ['Speed', 'Velocidad'],
  vVars: ['Variables', 'Variables'], vMemory: ['Memory', 'Memoria'], vTrace: ['Trace table', 'Tabla de traza'], vClasses: ['Classes', 'Clases'], vFlow: ['Flowchart', 'Diagrama de flujo'],
  callStack: ['Call stack', 'Pila de llamadas'], watch: ['Watch', 'Vigilar'], addWatch: ['Add', 'Añadir'], watchPh: ['expression, e.g. length(xs)', 'expresión, p. ej. longitud(xs)'],
  breakpoints: ['Breakpoints', 'Puntos de parada'], noBps: ['Click a line number to add a breakpoint.', 'Haz clic en un número de línea para añadir un punto de parada.'],
  condPh: ['condition (optional), e.g. i == 7', 'condición (opcional), p. ej. i == 7'], remove: ['Remove', 'Quitar'],
  noRun: ['Run or step through the program to see its variables here.', 'Ejecuta el programa o avanza paso a paso para ver aquí sus variables.'],
  bars: ['bars', 'barras'], cells: ['cells', 'celdas'], exportCsv: ['Export CSV', 'Exportar CSV'], noTrace: ['The trace fills in as the program runs.', 'La traza se llena mientras se ejecuta el programa.'],
  noClasses: ['This program has no classes yet.', 'Este programa aún no tiene clases.'], flowFor: ['Flowchart of', 'Diagrama de'], mainProgram: ['main program', 'programa principal'],
  testsNone: ['This program has no TEST blocks yet. Write one like this:', 'Este programa aún no tiene bloques PRUEBA. Escribe uno así:'],
  passedOf: ['{a} of {b} tests passed', '{a} de {b} pruebas superadas'], examplesOk: ['{a} of {b} DOC examples correct', '{a} de {b} ejemplos DOC correctos'],
  showCov: ['Show coverage in the editor', 'Mostrar cobertura en el editor'], testPlan: ['Test plan', 'Plan de pruebas'], addRow: ['Add case', 'Añadir caso'],
  pTarget: ['Function', 'Función'], pKind: ['Case type', 'Tipo de caso'], pInput: ['Input', 'Entrada'], pExpected: ['Expected', 'Esperado'], pTest: ['Linked test', 'Prueba enlazada'], pStatus: ['Status', 'Estado'],
  kNormal: ['normal', 'normal'], kBoundary: ['boundary', 'límite'], kError: ['error', 'error'], kInvalid: ['invalid input', 'entrada no válida'],
  notAuto: ['not automated', 'no automatizado'], passed: ['passed', 'superada'], failed: ['failed', 'fallida'], planWarn: ['Plan checks', 'Revisión del plan'],
  docExamples: ['DOC examples', 'Ejemplos DOC'], dRef: ['Project reference', 'Referencia del proyecto'], dCheck: ['Checker', 'Revisión'], dAbout: ['About', 'Acerca de'], dCredits: ['Credits', 'Créditos'],
  addTemplate: ['Add DOC template', 'Añadir plantilla DOC'], noDefs: ['Write a FUNCTION or CLASS to start its reference page.', 'Escribe una FUNCIÓN o CLASE para empezar su página de referencia.'],
  docsOk: ['Every function and class is documented. Nice work.', 'Todas las funciones y clases están documentadas. Buen trabajo.'],
  aTitle: ['Title', 'Título'], aAuthors: ['Made by', 'Hecho por'], aPurpose: ['What it does', 'Qué hace'], aAudience: ['Who it is for', 'Para quién es'], aHow: ['How to use it', 'Cómo usarlo'],
  aLimits: ['Known limits', 'Límites conocidos'], aVersion: ['Version', 'Versión'], preview: ['Preview', 'Vista previa'],
  cSource: ['Source', 'Fuente'], cWhat: ['What I used', 'Qué usé'], cLicence: ['Licence', 'Licencia'], cLink: ['Link or notes', 'Enlace o notas'],
  addCredit: ['Add credit', 'Añadir crédito'], draftCredits: ['Find sources used by the program', 'Buscar fuentes usadas por el programa'],
  unknownLic: ['Some credits have an unknown licence. Check before you share.', 'Algunos créditos tienen una licencia desconocida. Revísalos antes de compartir.'],
  hStatus: ['Changes since last version', 'Cambios desde la última versión'], hNoChanges: ['No changes since the last saved version.', 'No hay cambios desde la última versión guardada.'],
  hWhat: ['What changed?', '¿Qué cambió?'], hWhy: ['Why? (optional)', '¿Por qué? (opcional)'], hSave: ['Save version', 'Guardar versión'],
  hStaging: ['Choose which files to include (staging)', 'Elegir qué archivos incluir (preparación)'], hTimeline: ['Versions', 'Versiones'],
  hBranch: ['Branch', 'Rama'], hNewBranch: ['New branch', 'Nueva rama'], hMerge: ['Merge into this branch', 'Fusionar en esta rama'], hTag: ['Tag', 'Etiqueta'],
  hPush: ['Push', 'Subir'], hPull: ['Pull', 'Bajar'], hView: ['View', 'Ver'], hRestore: ['Restore this version', 'Restaurar esta versión'], hUndo: ['Undo this change', 'Deshacer este cambio'],
  hCompare: ['Changes in this version', 'Cambios en esta versión'], hConsole: ['Git console', 'Consola git'], hCmds: ['Equivalent git commands', 'Comandos git equivalentes'],
  hEmpty: ['No versions yet. Describe your work and save the first version.', 'Aún no hay versiones. Describe tu trabajo y guarda la primera versión.'],
  hShortMsg: ['Say what changed in a few words, for example "Add boundary tests for grade".', 'Di qué cambió en pocas palabras, por ejemplo "Añadir pruebas límite a nota".'],
  hConflicts: ['Merge conflicts', 'Conflictos de fusión'], hMine: ['Keep mine', 'Quedarme la mía'], hTheirs: ['Keep theirs', 'Quedarme la otra'], hBoth: ['Keep both', 'Quedarme ambas'],
  hFinish: ['Run tests and finish merge', 'Ejecutar pruebas y terminar la fusión'], hCancel: ['Cancel merge', 'Cancelar fusión'], hRemote: ['Remote copy (origin)', 'Copia remota (origin)'],
  pyNote: ['The same program in Python. Data, network and security helpers come from a small teaching module, blstudent.', 'El mismo programa en Python. Las ayudas de datos, red y seguridad vienen de un pequeño módulo didáctico, blstudent.'],
  copy: ['Copy', 'Copiar'], copied: ['Copied', 'Copiado'], download: ['Download', 'Descargar'], fUpload: ['Upload CSV or text file', 'Subir archivo CSV o de texto'],
  fSamples: ['Sample datasets', 'Datos de ejemplo'], fAdd: ['Add to project', 'Añadir al proyecto'], fProject: ['Project files', 'Archivos del proyecto'], fSave: ['Save file', 'Guardar archivo'],
  fDelete: ['Delete', 'Eliminar'], fTooBig: ['Files can be at most 1 MB.', 'Los archivos pueden tener como máximo 1 MB.'], fUseHint: ['Use it with load_csv("{n}") or load_text("{n}").', 'Úsalo con cargar_csv("{n}") o cargar_texto("{n}").'],
  refSearch: ['Search functions, methods and keywords', 'Buscar funciones, métodos y palabras clave'], keywords: ['Keywords', 'Palabras clave'],
  newProject: ['New project', 'Nuevo proyecto'], openProject: ['Open project', 'Abrir proyecto'], dupProject: ['Duplicate', 'Duplicar'], delProject: ['Delete project', 'Eliminar proyecto'],
  exportProject: ['Export project (.json)', 'Exportar proyecto (.json)'], importProject: ['Import project (.json)', 'Importar proyecto (.json)'], untitled: ['Untitled', 'Sin título'],
  confirmDel: ['Delete this project? This cannot be undone.', '¿Eliminar este proyecto? No se puede deshacer.'], saved: ['Saved', 'Guardado'],
  converted: ['Code converted to the {e} edition.', 'Código convertido a la edición {e}.'], renamedIds: ['Renamed because they are keywords in this edition: {x}', 'Renombrados porque son palabras clave en esta edición: {x}'],
  close: ['Close', 'Cerrar'], dlUnavailable: ['Downloads are not available here. Copy the text below instead.', 'Las descargas no están disponibles aquí. Copia el texto de abajo.'],
  gradeHelp: ['Tip: Ctrl+Enter runs, F10 steps over, F11 steps into.', 'Consejo: Ctrl+Intro ejecuta, F10 pasa, F11 entra.'],
  fixFirst: ['Fix the error in the code first.', 'Primero corrige el error del código.']
};
let ED = 'en';
function T(k, vars) { const e = I18N[k]; let s = e ? e[ED === 'es' ? 1 : 0] : k; if (vars) s = s.replace(/\{(\w+)\}/g, (_, x) => (vars[x] !== undefined ? vars[x] : '')); return s; }
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'class') el.className = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) { if (c === null || c === undefined || c === false) continue; el.append(c.nodeType ? c : document.createTextNode(String(c))); }
  return el;
}
function codeMsg(s) { return esc(s).replace(/`([^`]+)`/g, '<code>$1</code>'); }
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 2600); }
function uid() { return Math.random().toString(36).slice(2, 10); }
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

// ----- storage -----
const STORE_KEY = 'bl-student-lang.v1';
const Store = {
  data: { current: null, projects: {} },
  load() { try { const s = localStorage.getItem(STORE_KEY); if (s) this.data = JSON.parse(s); } catch (e) { } if (!this.data.projects) this.data.projects = {}; },
  save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(this.data)); } catch (e) { } }
};
function newProjectData(name, code, edition) {
  return { id: uid(), name: name || T('untitled'), edition: edition || ED, files: { 'main.bl': code || '' }, plan: [], about: {}, credits: [], repo: null,
    breakpoints: {}, watches: [], settings: { staging: false, coverage: false }, created: Date.now(), updated: Date.now() };
}
let P = null; // current project
function saveProject() { if (!P) return; P.updated = Date.now(); if (repoObj) P.repo = repoObj.toJSON(); Store.data.projects[P.id] = P; Store.data.current = P.id; Store.save(); }
const saveSoon = debounce(saveProject, 500);
let repoObj = null;

// ----- editor -----
const OPENERS = { if: 'if', while: 'while', repeat: 'repeat', for: 'for', for_each: 'for', function: 'function', class: 'class', try: 'try', test: 'test', init: 'init', doc: 'doc' };
class Editor {
  constructor(root) {
    this.root = root;
    root.innerHTML = '<div class="edInner"><div class="gutter"></div><div class="codeArea"><pre class="hl" aria-hidden="true"></pre><textarea class="ta" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off" aria-label="Code"></textarea></div></div>';
    this.gut = $('.gutter', root); this.hl = $('.hl', root); this.ta = $('.ta', root); this.area = $('.codeArea', root);
    this.marks = { cur: 0, err: 0, cov: null, nocov: null }; this.bps = new Map(); this.lines = 0; this.caretLine = 1;
    this.onChange = () => {}; this.onCaret = () => {}; this.onGutter = () => {};
    this.ta.addEventListener('input', () => { this.render(); this.onChange(this.ta.value); });
    this.ta.addEventListener('keydown', (e) => this.key(e));
    const caret = () => { const l = this.lineAt(this.ta.selectionStart); if (l !== this.caretLine) { this.caretLine = l; this.paintRows(); } this.onCaret(); };
    for (const ev of ['click', 'keyup', 'select', 'focus']) this.ta.addEventListener(ev, caret);
    this.gut.addEventListener('click', (e) => { const g = e.target.closest('.gl'); if (g) this.onGutter(+g.dataset.l, e); });
  }
  get value() { return this.ta.value; }
  set value(v) { this.ta.value = v; this.render(); }
  lineAt(pos) { let n = 1; const v = this.ta.value; for (let i = 0; i < pos && i < v.length; i++) if (v.charCodeAt(i) === 10) n++; return n; }
  lineStart(n) { const v = this.ta.value; let pos = 0; for (let l = 1; l < n; l++) { const i = v.indexOf('\n', pos); if (i < 0) return v.length; pos = i + 1; } return pos; }
  gotoLine(n, focus) {
    const s = this.lineStart(n); const v = this.ta.value; let e = v.indexOf('\n', s); if (e < 0) e = v.length;
    if (focus) { this.ta.focus(); this.ta.setSelectionRange(s, s); }
    this.caretLine = n; this.paintRows(); this.scrollTo(n);
  }
  scrollTo(n) {
    const lh = 21; const top = (n - 1) * lh; const r = this.root;
    if (top < r.scrollTop + 10 || top > r.scrollTop + r.clientHeight - 3 * lh) r.scrollTop = Math.max(0, top - r.clientHeight / 3);
  }
  wordAtCaret() {
    const v = this.ta.value, p = this.ta.selectionStart;
    let s = p, e = p;
    while (s > 0 && /[\p{L}\p{N}_]/u.test(v[s - 1])) s--;
    while (e < v.length && /[\p{L}\p{N}_]/u.test(v[e])) e++;
    const dot = s > 0 && v[s - 1] === '.';
    return { word: v.slice(s, e), dot };
  }
  render() {
    const src = this.ta.value;
    let toks;
    try { toks = BL.lex(src, ED, true); } catch (e) { toks = []; }
    const classes = new Set();
    for (let i = 0; i < toks.length - 1; i++) if (toks[i].t === 'kw' && ['class', 'new', 'extends'].includes(toks[i].v) && toks[i + 1].t === 'id') classes.add(toks[i + 1].v);
    const segs = []; let pos = 0;
    const push = (text, cls) => { if (text) segs.push([text, cls]); };
    let prev = null;
    for (const t of toks) {
      if (t.t === 'nl' || t.t === 'eof') continue;
      push(src.slice(pos, t.s), '');
      let cls = '';
      if (t.t === 'kw') cls = 't-kw';
      else if (t.t === 'str') cls = t.bad ? 't-bad' : 't-str';
      else if (t.t === 'num') cls = 't-num';
      else if (t.t === 'comment') cls = 't-com';
      else if (t.t === 'doc') cls = 't-doc';
      else if (t.t === 'bad') cls = 't-bad';
      else if (t.t === 'id') {
        const afterDot = prev && prev.t === 'op' && prev.v === '.';
        if (classes.has(t.v) || nativeClassSet.has(t.v.toLowerCase())) cls = 't-cls';
        else if (!afterDot && builtinSet.has(t.v.toLowerCase())) cls = 't-bi';
      }
      push(src.slice(t.s, t.e), cls);
      pos = t.e;
      if (!t.skip) prev = t;
    }
    push(src.slice(pos), '');
    const rows = [[]];
    for (const [text, cls] of segs) {
      const parts = text.split('\n');
      parts.forEach((p, i) => { if (i) rows.push([]); if (p) rows[rows.length - 1].push(cls ? `<span class="${cls}">${esc(p)}</span>` : esc(p)); });
    }
    this.lines = rows.length;
    this.hl.innerHTML = rows.map((r, i) => `<div class="row" data-l="${i + 1}">${r.join('') || ' '}</div>`).join('');
    let maxLen = 0; for (const l of src.split('\n')) maxLen = Math.max(maxLen, l.length);
    const w = `max(100%, ${maxLen + 6}ch)`;
    this.ta.style.width = w; this.hl.style.minWidth = w;
    this.renderGutter();
    this.paintRows();
  }
  renderGutter() {
    const n = this.lines; const digits = String(n).length;
    this.root.style.setProperty('--gw', (30 + digits * 8 + 12) + 'px');
    this.gut.style.width = (30 + digits * 8 + 12) + 'px';
    let html = '';
    for (let i = 1; i <= n; i++) html += `<div class="gl" data-l="${i}">${i}</div>`;
    this.gut.innerHTML = html;
    this.gut.style.height = (n * 21 + 60) + 'px';
    this.area.style.height = (n * 21 + 60) + 'px';
    this.paintGutter();
  }
  paintGutter() {
    for (const g of this.gut.children) {
      const l = +g.dataset.l;
      g.classList.toggle('bp', this.bps.has(l)); g.classList.toggle('cond', !!(this.bps.get(l) && this.bps.get(l).src));
      g.classList.toggle('cur', l === this.marks.cur); g.classList.toggle('errl', l === this.marks.err);
      g.title = this.bps.has(l) ? (this.bps.get(l) && this.bps.get(l).src ? 'Breakpoint if ' + this.bps.get(l).src : 'Breakpoint') : '';
    }
  }
  paintRows() {
    const m = this.marks;
    for (const r of this.hl.children) {
      const l = +r.dataset.l;
      r.classList.toggle('cur', l === m.cur); r.classList.toggle('errl', l === m.err);
      r.classList.toggle('cov', !!(m.cov && m.cov.has(l))); r.classList.toggle('nocov', !!(m.nocov && m.nocov.has(l)));
      r.classList.toggle('caret', l === this.caretLine);
    }
    this.paintGutter();
  }
  setMarks(m) { Object.assign(this.marks, m); this.paintRows(); if (m.cur) this.scrollTo(m.cur); else if (m.err) this.scrollTo(m.err); }
  insert(text, selStart, selEnd) {
    const ta = this.ta;
    if (selStart !== undefined) ta.setSelectionRange(selStart, selEnd);
    ta.focus();
    const ok = document.execCommand && document.execCommand('insertText', false, text);
    if (!ok) { ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); }
  }
  key(e) {
    const ta = this.ta, v = ta.value;
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = ta.selectionStart, en = ta.selectionEnd;
      const ls = v.lastIndexOf('\n', s - 1) + 1;
      if (s === en && !e.shiftKey) { this.insert('    '); return; }
      const le = v.indexOf('\n', en - (en > s && v[en - 1] === '\n' ? 1 : 0)); const end = le < 0 ? v.length : le;
      const block = v.slice(ls, end);
      const nb = block.split('\n').map(l => (e.shiftKey ? l.replace(/^ {1,4}/, '') : '    ' + l)).join('\n');
      this.insert(nb, ls, end);
      ta.setSelectionRange(ls, ls + nb.length);
      return;
    }
    if (e.key === '/' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const s = ta.selectionStart, en = ta.selectionEnd;
      const ls = v.lastIndexOf('\n', s - 1) + 1; const le0 = v.indexOf('\n', en); const le = le0 < 0 ? v.length : le0;
      const lines = v.slice(ls, le).split('\n');
      const all = lines.every(l => /^\s*#/.test(l) || !l.trim());
      const nb = lines.map(l => (all ? l.replace(/^(\s*)# ?/, '$1') : (l.trim() ? l.replace(/^(\s*)/, '$1# ') : l))).join('\n');
      this.insert(nb, ls, le);
      return;
    }
    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const s = ta.selectionStart;
      const ls = v.lastIndexOf('\n', s - 1) + 1;
      const line = v.slice(ls, s);
      const indent = (line.match(/^\s*/) || [''])[0];
      let toks = [];
      try { toks = BL.lex(line, ED, true).filter(t => !['nl', 'eof', 'comment'].includes(t.t)); } catch (err) { }
      const first = toks[0], last = toks[toks.length - 1];
      let opener = null;
      if (first && first.t === 'kw') {
        if (first.v === 'if') { if (last && last.t === 'kw' && last.v === 'then') opener = 'if'; }
        else if (['else', 'else_if', 'on_error'].includes(first.v)) opener = 'mid';
        else if (OPENERS[first.v]) opener = first.v;
      }
      if (!opener && first && first.t === 'doc') opener = 'doc';
      if (!opener) { this.insert('\n' + indent); return; }
      const inner = indent + '    ';
      if (opener === 'mid') { this.insert('\n' + inner); return; }
      const closer = OPENERS[opener];
      // count openers vs closers of this kind
      let opens = 0, closes = 0;
      const lines = v.split('\n');
      for (const l of lines) {
        let tk = [];
        try { tk = BL.lex(l, ED, true).filter(t => !['nl', 'eof', 'comment'].includes(t.t)); } catch (err) { }
        if (!tk.length) continue;
        const f = tk[0];
        if (f.t === 'doc' && closer === 'doc') opens++;
        if (f.t === 'kw' && OPENERS[f.v] === closer && (f.v !== 'if' || (tk[tk.length - 1].t === 'kw' && tk[tk.length - 1].v === 'then'))) opens++;
        if (f.t === 'kw' && f.v === 'end' && tk[1] && ((tk[1].t === 'kw' && (BL_CLOSER[tk[1].v] || tk[1].v) === closer))) closes++;
        if (closer === 'doc' && /^\s*\S+\s+DOC\s*$/i.test(l) && f.t === 'kw' && f.v === 'end') closes++;
      }
      const docLine = opener === 'doc' ? true : false;
      if (opens > closes) {
        const endText = BL.kwName('end', ED) + ' ' + (closer === 'doc' ? 'DOC' : BL.kwName(closer, ED));
        const insertion = '\n' + inner + '\n' + indent + endText;
        this.insert(insertion);
        const caret = s + 1 + inner.length;
        ta.setSelectionRange(caret, caret);
      } else this.insert('\n' + (docLine ? indent + '  ' : inner));
      return;
    }
  }
}
const BL_CLOSER = { if: 'if', while: 'while', repeat: 'repeat', for: 'for', for_each: 'for', function: 'function', class: 'class', init: 'init', try: 'try', test: 'test', doc: 'doc' };
const builtinSet = new Set(); const nativeClassSet = new Set();
function buildNameSets() {
  builtinSet.clear(); nativeClassSet.clear();
  for (const b of BL.REG.builtins) { builtinSet.add(b.n.toLowerCase()); if (b.es) builtinSet.add(b.es.toLowerCase()); }
  for (const c of BL.REG.classes) { if (c.hidden) continue; nativeClassSet.add(c.n.toLowerCase()); if (c.es) nativeClassSet.add(c.es.toLowerCase()); }
}
