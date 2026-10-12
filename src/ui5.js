// ===== UI part 5: app wiring =====
let editor; let currentTab = 'debug';
const TAB_RENDER = { debug: () => buildDebugTab(), tests: () => renderTests(), docs: () => renderDocs(), history: () => renderHistory(), python: () => renderPython(), files: () => renderFiles(), reference: () => renderReference() };
function selectTab(name) {
  currentTab = name;
  for (const b of $$('.tabs [role=tab]')) b.setAttribute('aria-selected', String(b.dataset.tab === name));
  for (const p of $$('.tabBody')) p.hidden = p.id !== 'tab-' + name;
  if ($('#dock').classList.contains('short')) $('#dock').classList.remove('short');
  TAB_RENDER[name]();
}
function applyI18n() {
  document.documentElement.lang = ED;
  for (const el of $$('[data-i18n]')) el.textContent = T(el.dataset.i18n);
  for (const b of $$('.edition .seg')) b.setAttribute('aria-pressed', String(b.dataset.ed === ED));
  $('#btnRun').title = ED === 'es' ? 'Ejecutar (Ctrl+Intro)' : 'Run (Ctrl+Enter)';
}
function setCode(code) { editor.value = code; P.files['main.bl'] = code; saveSoon(); }
const refreshTabSoon = debounce(() => { if (['python', 'docs', 'tests'].includes(currentTab)) TAB_RENDER[currentTab](); if (currentTab === 'debug' && ['classes', 'flow'].includes(DBG.view)) refreshDebug(); }, 700);
function onCodeChange(v) {
  P.files['main.bl'] = v; saveSoon();
  if (editor.marks.err) editor.setMarks({ err: 0 });
  if (P.settings.coverage) applyCoverage();
  refreshTabSoon();
  $('#editorInfo').textContent = '';
}
// ----- context help -----
function contextHelp() {
  const bar = $('#helpBar');
  const { word, dot } = editor.wordAtCaret();
  const low = word.toLowerCase();
  let html = '';
  if (word) {
    const b = !dot && BL.REG.builtins.find(x => x.n.toLowerCase() === low || (x.es && x.es.toLowerCase() === low));
    if (b) html = `<code>${esc((ED === 'es' ? b.es || b.n : b.n) + '(' + b.p + ')')}</code> ${esc(b.d)}`;
    if (!html && dot) {
      const canon = BL.canonMember(word);
      const all = [...BL.REG.text.map(m => [m, 'text']), ...BL.REG.list.map(m => [m, 'list']), ...BL.REG.dict.map(m => [m, 'dict'])];
      for (const c of BL.REG.classes) for (const m of c.methods || []) all.push([m, c.n]);
      const hits = all.filter(([m]) => m.n === canon);
      if (hits.length) html = hits.slice(0, 2).map(([m, g]) => `<code>.${esc((ED === 'es' ? m.es || m.n : m.n) + '(' + (m.p || '') + ')')}</code> <span class="muted">(${esc(g)})</span> ${esc(m.d)}`).join('  ');
    }
    if (!html && !dot) {
      const tab = BL.kwTable(ED);
      const kw = tab.single.get(BL.norm(word));
      if (kw) html = `<code>${esc(BL.kwName(kw, ED))}</code> ${esc(KW_HELP[kw] ? KW_HELP[kw][ED === 'es' ? 1 : 0] : '')}`;
    }
    if (!html) {
      const prog = S.prog && S.prog.src === editor.value ? S.prog : null;
      let p = prog; if (!p) { try { p = BL.parse(editor.value, ED); S.progLite = p; } catch (e) { p = S.progLite; } }
      if (p && p.funcs.has(word)) { const f = p.funcs.get(word); html = `<code>${esc(word + '(' + f.params.map(x => x.name).join(', ') + ')')}</code> ${esc(f.doc && f.doc.fields.purpose ? f.doc.fields.purpose : (ED === 'es' ? 'Tu función (sin DOC todavía).' : 'Your function (no DOC yet).'))}`; }
      else if (p && p.classes.has(word)) { const c = p.classes.get(word); html = `<code>${BL.kwName('class', ED)} ${esc(word)}</code> ${esc(c.doc && c.doc.fields.purpose ? c.doc.fields.purpose : '')}`; }
    }
  }
  bar.innerHTML = html || `<span>${esc(T('gradeHelp'))}</span>`;
  $('#editorInfo').textContent = (ED === 'es' ? 'Línea ' : 'Line ') + editor.caretLine;
}
const KW_HELP = {
  if: ['Runs a block only when a condition is TRUE. End the line with THEN and the block with END IF.', 'Ejecuta un bloque solo si una condición es VERDADERO. Termina la línea con ENTONCES y el bloque con FIN SI.'],
  while: ['Repeats a block while a condition is TRUE. Checked before each repeat.', 'Repite un bloque mientras una condición sea VERDADERO.'],
  repeat: ['REPEAT n TIMES repeats a block an exact number of times.', 'REPETIR n VECES repite un bloque un número exacto de veces.'],
  for: ['FOR i FROM a TO b counts from a to b, both included. Add STEP to count in other steps.', 'PARA i DESDE a HASTA b cuenta de a a b, ambos incluidos. Añade CON PASO para contar de otra forma.'],
  function: ['Defines a function with parameters. Use RETURN to give back a value.', 'Define una función con parámetros. Usa DEVOLVER para devolver un valor.'],
  class: ['Defines a class. Put INIT first; add methods with FUNCTION. EXTENDS inherits from another class.', 'Define una clase. Pon INICIAR primero; añade métodos con FUNCIÓN. EXTIENDE hereda de otra clase.'],
  init: ['Runs when NEW creates an object. Create every attribute here with SELF.name = value.', 'Se ejecuta cuando NUEVO crea un objeto. Crea aquí todos los atributos con ESTE.nombre = valor.'],
  test: ['TEST "name" ... END TEST checks your functions. Run it from the Tests tab.', 'PRUEBA "nombre" ... FIN PRUEBA comprueba tus funciones. Ejecútala desde la pestaña Pruebas.'],
  expect: ['EXPECT a condition that must be TRUE, such as EXPECT add(2, 2) == 4.', 'COMPROBAR una condición que debe ser VERDADERO, como COMPROBAR suma(2, 2) == 4.'],
  try: ['TRY runs a block; if something fails, the ON ERROR block runs instead of stopping.', 'INTENTAR ejecuta un bloque; si algo falla, se ejecuta SI FALLA en vez de parar.'],
  fail: ['FAIL "message" stops the function with your own error message.', 'FALLAR "mensaje" detiene la función con tu propio mensaje de error.'],
  print: ['Shows values in the output, separated by spaces.', 'Muestra valores en la salida, separados por espacios.'],
  return: ['Gives a value back from a function and leaves it.', 'Devuelve un valor desde una función y sale de ella.'],
  doc: ['DOC ... END DOC documents the next FUNCTION or CLASS: PURPOSE, INPUTS, RETURNS, EXAMPLE.', 'DOC ... FIN DOC documenta la siguiente FUNCIÓN o CLASE: PROPÓSITO, ENTRADAS, DEVUELVE, EJEMPLO.'],
  self: ['Inside a method, SELF is the object the method was called on.', 'Dentro de un método, ESTE es el objeto sobre el que se llamó.'],
  parent: ['PARENT.INIT(...) or PARENT.method(...) calls the version in the parent class.', 'PADRE.INICIAR(...) o PADRE.metodo(...) llama a la versión de la clase padre.'],
  new: ['NEW ClassName(values) creates an object and runs its INIT.', 'NUEVO NombreClase(valores) crea un objeto y ejecuta su INICIAR.'],
  div: ['Whole-number division: 7 DIV 2 is 3.', 'División entera: 7 DIV 2 es 3.'], mod: ['Remainder: 7 MOD 2 is 1.', 'Resto: 7 MOD 2 es 1.'],
  break: ['Leaves the loop straight away.', 'Sale del bucle inmediatamente.'], continue: ['Skips to the next repeat of the loop.', 'Salta a la siguiente repetición del bucle.'],
  nothing: ['NOTHING means "no value".', 'NADA significa "sin valor".'], in: ['x IN list is TRUE when x is in the list, text or dictionary keys.', 'x EN lista es VERDADERO si x está en la lista, el texto o las claves.']
};
// ----- menus -----
function showMenu(anchor, items) {
  const m = $('#menu'); m.innerHTML = '';
  for (const it of items) {
    if (it === 'hr') m.append(h('hr'));
    else if (it.header) m.append(h('div', { class: 'mh' }, it.header));
    else m.append(h('button', { role: 'menuitem', onclick: () => { hideMenu(); it.onclick(); } }, it.label));
  }
  const r = anchor.getBoundingClientRect();
  m.style.left = Math.min(r.left, innerWidth - 280) + 'px'; m.style.top = (r.bottom + 4) + 'px';
  m.hidden = false; const f = $('button', m); if (f) f.focus();
}
function hideMenu() { $('#menu').hidden = true; }
document.addEventListener('mousedown', (e) => { if (!$('#menu').hidden && !e.target.closest('#menu') && !e.target.closest('.menus')) hideMenu(); });
// ----- projects -----
function openProject(id) {
  stopRun(true);
  P = Store.data.projects[id];
  if (!P) return;
  P.settings = P.settings || { staging: false, coverage: false }; P.plan = P.plan || []; P.about = P.about || {}; P.credits = P.credits || []; P.watches = P.watches || []; P.breakpoints = P.breakpoints || {};
  ED = P.edition || 'en';
  repoObj = new BL.Repo(P.repo);
  Store.data.current = id; Store.save();
  $('#projName').value = P.name;
  applyI18n();
  editor.value = P.files['main.bl'] || '';
  editor.bps = new Map(Object.keys(P.breakpoints).map(k => [+k, P.breakpoints[k]]));
  editor.setMarks({ cur: 0, err: 0, cov: null, nocov: null });
  resetStage(); S.runner = null; S.prog = null; S.testRun = null; S.histSel = null; S.pendingMerge = null; S.gitOut = []; S.fileSel = null;
  const badge = $('[data-tab=tests] .badge'); if (badge) badge.remove();
  setStatus('', T('ready'));
  selectTab(currentTab);
  contextHelp();
}
function createProject(name, code, edition) { const p = newProjectData(name, code, edition); Store.data.projects[p.id] = p; Store.save(); openProject(p.id); return p; }
function loadExample(ex) {
  let code = ex.code;
  if (ED !== 'en') code = BL.convertEdition(code, 'en', ED).code;
  createProject(ED === 'es' ? ex.titleEs : ex.title, code, ED);
  if (ex.id === 'grades') { P.plan = [{ target: 'grade', kind: 'normal', input: '72', expected: '"pass"', test: 'normal scores' }, { target: 'grade', kind: 'boundary', input: '49, 50, 100', expected: '"fail", "pass", "pass"', test: 'boundary at 50' }, { target: 'grade', kind: 'error', input: '101', expected: 'error', test: 'impossible scores' }, { target: 'ask_score', kind: 'invalid', input: '"abc", "150"', expected: 'asks again', test: 'invalid input is asked again' }]; saveProject(); }
  toast(ED === 'es' ? 'Ejemplo abierto como nuevo proyecto' : 'Example opened as a new project');
}
function projectMenu() {
  const items = [
    { label: '＋ ' + T('newProject'), onclick: () => createProject(T('untitled'), '', ED) },
    { label: T('openProject') + '…', onclick: openProjectDialog },
    { label: T('dupProject'), onclick: () => { const c = JSON.parse(JSON.stringify(P)); c.id = uid(); c.name = P.name + ' (2)'; Store.data.projects[c.id] = c; Store.save(); openProject(c.id); } },
    'hr',
    { label: T('exportProject'), onclick: () => { saveProject(); offerDownload((P.name || 'project').replace(/[^\w-]+/g, '_') + '.json', JSON.stringify(P, null, 1)); } },
    { label: T('importProject'), onclick: () => $('#importFile').click() },
    'hr',
    { label: T('delProject'), onclick: () => { if (!confirm(T('confirmDel'))) return; delete Store.data.projects[P.id]; Store.save(); const ids = Object.keys(Store.data.projects); if (ids.length) openProject(ids[0]); else loadExample(BL.SAMPLES.examples[0]); } },
    'hr',
    { label: T('aboutMenu'), onclick: showAbout }
  ];
  showMenu($('#btnProject'), items);
}
function openProjectDialog() {
  const list = Object.values(Store.data.projects).sort((a, b) => b.updated - a.updated);
  showModal(h('div', null, h('h3', null, T('openProject')), ...list.map(p => h('div', { class: 'fileRow' }, h('button', { class: 'linkbtn', onclick: () => { closeModal(); openProject(p.id); } }, p.name), h('span', { class: 'chip' }, p.edition.toUpperCase()), h('span', { class: 'muted small' }, new Date(p.updated).toLocaleString()))),
    h('div', { class: 'toolbar', style: 'margin-top:10px' }, h('button', { class: 'btn', onclick: closeModal }, T('close')))));
}
function showAbout() {
  const logo = $('#btnBrand img.logo');
  showModal(h('div', { class: 'aboutBox' },
    h('img', { class: 'aboutLogo', src: logo ? logo.src : '', alt: 'BASIC62', width: 254, height: 48 }),
    h('h2', null, 'BASIC62 CodeLab'),
    h('p', { class: 'lead' }, T('abIntro')),
    h('p', { class: 'tag' }, T('abLang') + '. ' + T('abTag')),
    h('dl', null,
      h('dt', null, T('abConcept')), h('dd', null, 'Andreas Tsouchlaris'),
      h('dt', null, T('ftSupported')), h('dd', null, h('a', { href: 'https://binarylogic.net', target: '_blank', rel: 'noopener' }, 'Binary Logic')),
      h('dt', null, T('abAI')), h('dd', null, 'Claude (Anthropic)')),
    h('p', null, T('abBinary')),
    h('p', null, T('abInspired')),
    h('p', { class: 'feedback' }, T('abFeedback')),
    h('p', { class: 'fine' }, T('abIndependent')),
    h('p', { class: 'fine' }, '© 2026 Andreas Tsouchlaris'),
    h('p', { class: 'fine' }, h('b', null, T('abLicenseLabel') + ': '), T('abLicense')),
    h('p', { class: 'fine' }, h('b', null, T('abStatusLabel') + ': '), T('abVersion')),
    h('div', { class: 'toolbar', style: 'margin-top:12px' }, h('button', { class: 'btn', onclick: closeModal }, T('close')))));
}
function examplesMenu() {
  showMenu($('#btnExamples'), BL.SAMPLES.examples.map(ex => ({ label: ED === 'es' ? ex.titleEs : ex.title, onclick: () => loadExample(ex) })));
}
function setEdition(ed) {
  if (ed === ED) return;
  stopRun(true);
  const from = ED;
  const res = BL.convertEdition(editor.value, from, ed);
  ED = ed; P.edition = ed;
  applyI18n();
  setCode(res.code);
  editor.setMarks({ err: 0, cur: 0 });
  S.prog = null; S.testRun = null; S.runner = null; resetStage(); setStatus('', T('ready'));
  selectTab(currentTab);
  toast(T('converted', { e: ed === 'es' ? 'Español' : 'English' }) + (res.renamed.length ? ' ' + T('renamedIds', { x: res.renamed.join(', ') }) : ''));
}
// ----- init -----
function init() {
  buildNameSets();
  initCanvas();
  Con.el = $('#console');
  editor = new Editor($('#editor'));
  editor.onChange = onCodeChange;
  editor.onCaret = contextHelp;
  editor.onGutter = (line, e) => {
    if (P.breakpoints[line] !== undefined) delete P.breakpoints[line]; else P.breakpoints[line] = {};
    applyBreakpoints();
    if (currentTab === 'debug') refreshDebug();
  };
  $('#btnRun').addEventListener('click', run);
  $('#btnStop').addEventListener('click', () => stopRun());
  $('#btnStepTop').addEventListener('click', () => stepCmd('over'));
  $('#btnTests').addEventListener('click', runTestsUI);
  $('#btnClearOut').addEventListener('click', () => Con.clear());
  $('#btnCanvas').addEventListener('click', () => showCanvas($('#canvasWrap').classList.contains('off')));
  $('#btnExamples').addEventListener('click', examplesMenu);
  $('#btnProject').addEventListener('click', projectMenu);
  $('#btnBrand').addEventListener('click', showAbout);
  $('#btnAboutFoot').addEventListener('click', showAbout);
  $('#btnDock').addEventListener('click', () => { const d = $('#dock'); if (d.classList.contains('tall')) { d.classList.remove('tall'); d.classList.add('short'); } else if (d.classList.contains('short')) d.classList.remove('short'); else d.classList.add('tall'); });
  for (const b of $$('.edition .seg')) b.addEventListener('click', () => setEdition(b.dataset.ed));
  for (const b of $$('.tabs [role=tab]')) b.addEventListener('click', () => selectTab(b.dataset.tab));
  $('#projName').addEventListener('input', (e) => { P.name = e.target.value; saveSoon(); });
  $('#modal').addEventListener('mousedown', (e) => { if (e.target.id === 'modal') closeModal(); });
  const imp = h('input', { type: 'file', id: 'importFile', accept: '.json', hidden: true });
  imp.addEventListener('change', () => {
    const f = imp.files[0]; if (!f) return;
    const rd = new FileReader(); rd.onload = () => { try { const p = JSON.parse(String(rd.result)); if (!p.files || typeof p.files['main.bl'] !== 'string') throw new Error('bad'); p.id = uid(); Store.data.projects[p.id] = p; Store.save(); openProject(p.id); } catch (e) { toast(ED === 'es' ? 'Ese archivo no es un proyecto válido.' : 'That file is not a valid project.'); } imp.value = ''; }; rd.readAsText(f);
  });
  document.body.append(imp);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { hideMenu(); closeModal(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); }
    else if (e.key === 'F10') { e.preventDefault(); stepCmd('over'); }
    else if (e.key === 'F11' && e.shiftKey) { e.preventDefault(); stepCmd('out'); }
    else if (e.key === 'F11') { e.preventDefault(); stepCmd('into'); }
    else if (e.key === 'F5' && runnerActive()) { e.preventDefault(); stepCmd('continue'); }
  });
  window.addEventListener('beforeunload', saveProject);
  Store.load();
  const ids = Object.keys(Store.data.projects);
  if (Store.data.current && Store.data.projects[Store.data.current]) openProject(Store.data.current);
  else if (ids.length) openProject(ids[0]);
  else { ED = (navigator.language || 'en').toLowerCase().startsWith('es') ? 'es' : 'en'; loadExample(BL.SAMPLES.examples.find(e => e.id === 'grades')); }
  getDownloads();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
