// ===== UI part 4: tool tabs =====
// ----- downloads -----
let DL = null; let dlTried = false;
async function getDownloads() { if (dlTried) return DL; dlTried = true; try { DL = window.claude && window.claude.use ? await window.claude.use('downloads') : null; } catch (e) { DL = null; } return DL; }
async function offerDownload(filename, data) {
  const d = await getDownloads();
  if (d) {
    try { await d.save({ filename, data }); return; }
    catch (e) { if (e && e.code === 'declined') return; }
  }
  if (typeof data !== 'string') { toast(T('dlUnavailable')); return; }
  showModal(h('div', null, h('h3', null, filename), h('p', { class: 'muted' }, T('dlUnavailable')), h('textarea', { class: 'fileEdit', readonly: true, style: 'min-height:320px' }, data),
    h('div', { class: 'toolbar', style: 'margin-top:8px' }, h('button', { class: 'btn', onclick: () => copyText(data) }, T('copy')), h('button', { class: 'btn', onclick: closeModal }, T('close')))));
}
function copyText(t) { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast(T('copied')), () => { const ta = h('textarea', null, t); document.body.append(ta); ta.select(); try { document.execCommand('copy'); toast(T('copied')); } catch (e) { } ta.remove(); }); }
function showModal(node) { $('#modalBody').innerHTML = ''; $('#modalBody').append(node); $('#modal').hidden = false; const f = $('#modalBody button, #modalBody input, #modalBody textarea'); if (f) f.focus(); }
function closeModal() { $('#modal').hidden = true; }
// tiny zip (store) for Python downloads
function crc32(bytes) { let c, crc = 0xFFFFFFFF; for (let n = 0; n < bytes.length; n++) { c = (crc ^ bytes[n]) & 0xFF; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xEDB88320 : c >>> 1; crc = (crc >>> 8) ^ c; } return (crc ^ 0xFFFFFFFF) >>> 0; }
function makeZip(files) {
  const enc = new TextEncoder(); const chunks = []; const central = []; let offset = 0;
  const u16 = (v) => [v & 255, (v >> 8) & 255], u32 = (v) => [v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255];
  for (const [name, text] of files) {
    const nb = enc.encode(name), data = enc.encode(text), crc = crc32(data);
    const local = [0x50, 0x4b, 3, 4, ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nb.length), ...u16(0)];
    chunks.push(new Uint8Array(local), nb, data);
    central.push([0x50, 0x4b, 1, 2, ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nb.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset), ...nb]);
    offset += local.length + nb.length + data.length;
  }
  const cd = central.flat(); const end = [0x50, 0x4b, 5, 6, ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cd.length), ...u32(offset), ...u16(0)];
  chunks.push(new Uint8Array(cd), new Uint8Array(end));
  return new Blob(chunks, { type: 'application/zip' });
}

// ----- tests tab -----
S.testRun = null;
function runTestsUI() {
  const prog = compile(); if (!prog) { selectTab('tests'); return; }
  const res = BL.runTests(prog, { files: Object.entries(P.files) });
  S.testRun = { res, src: prog.src, prog };
  applyCoverage();
  const passed = res.results.filter(r => r.passed).length;
  const badge = $('[data-tab=tests] .badge'); if (badge) badge.remove();
  if (res.results.length) $('[data-tab=tests]').append(h('span', { class: 'badge chip ' + (passed === res.results.length ? 'ok' : 'bad') }, `${passed}/${res.results.length}`));
  selectTab('tests');
}
function applyCoverage() {
  if (!P.settings.coverage || !S.testRun || S.testRun.src !== editor.value) { editor.setMarks({ cov: null, nocov: null }); return; }
  const cov = new Set(), nocov = new Set();
  for (const d of BL.allDefs(S.testRun.prog)) {
    const lines = new Set(); BL.walk(d.def.body, (n) => { if (n.line && !n.src) lines.add(n.line); });
    for (const l of lines) (S.testRun.res.coverage.has(l) ? cov : nocov).add(l);
  }
  editor.setMarks({ cov, nocov });
}
function renderTests() {
  const tab = $('#tab-tests'); tab.innerHTML = '';
  const prog = compile(true);
  tab.append(h('div', { class: 'toolbar' }, h('button', { class: 'btn primary', onclick: runTestsUI }, '✓ ' + T('runTests')),
    h('label', null, h('input', { type: 'checkbox', checked: P.settings.coverage || null, onchange: (e) => { P.settings.coverage = e.target.checked; applyCoverage(); saveSoon(); } }), T('showCov'))));
  const cols = h('div', { class: 'cols' }); const left = h('div'), right = h('div'); cols.append(left, right); tab.append(cols);
  const tr = S.testRun && prog && S.testRun.src === prog.src ? S.testRun.res : null;
  if (prog && !prog.tests.length) {
    left.append(h('div', { class: 'empty' }, T('testsNone')), h('pre', { class: 'codeView' }, `${BL.kwName('test', ED)} "${ED === 'es' ? 'suma básica' : 'adding works'}"\n    ${BL.kwName('expect', ED)} 2 + 2 == 4\n${BL.kwName('end', ED)} ${BL.kwName('test', ED)}`));
  } else if (tr) {
    const passed = tr.results.filter(r => r.passed).length;
    left.append(h('div', { class: 'summary' }, h('span', { class: 'bigcount' }, T('passedOf', { a: passed, b: tr.results.length })),
      tr.examples.length ? h('span', { class: 'chip ' + (tr.examples.every(e => e.ok) ? 'ok' : 'bad') }, T('examplesOk', { a: tr.examples.filter(e => e.ok).length, b: tr.examples.length })) : null));
    for (const r of tr.results) {
      const box = h('div', { class: 'tres ' + (r.passed ? 'pass' : 'fail') }, h('div', { class: 'th' }, h('span', null, r.name), h('span', { class: 'grow' }), h('button', { class: 'linkbtn small', onclick: () => editor.gotoLine(r.line, true) }, T('goLine', { n: r.line }))));
      for (const c of r.checks) if (!c.ok) box.append(h('div', { class: 'chk bad' }, h('button', { class: 'linkbtn', onclick: () => editor.gotoLine(c.line, true) }, T('goLine', { n: c.line })), ' ', h('span', { html: codeMsg(c.detail || c.src) })));
      if (r.error) box.append(h('div', { class: 'chk bad' }, h('button', { class: 'linkbtn', onclick: () => editor.gotoLine(r.error.line, true) }, T('goLine', { n: r.error.line })), ' ', h('span', { html: codeMsg(r.error.text) })));
      if (r.passed) box.append(h('div', { class: 'chk muted' }, `${r.checks.length} ${ED === 'es' ? 'comprobaciones' : 'checks'}`));
      left.append(box);
    }
    if (tr.examples.length) {
      left.append(h('h3', { style: 'margin-top:12px' }, T('docExamples')));
      for (const e of tr.examples) left.append(h('div', { class: 'tres ' + (e.ok ? 'pass' : 'fail') }, h('div', { class: 'th' }, h('code', null, e.text), h('span', { class: 'grow' }), h('span', { class: 'muted small' }, e.owner)), e.ok ? null : h('div', { class: 'chk bad', html: codeMsg(e.detail) })));
    }
  } else if (prog) left.append(h('div', { class: 'empty' }, ED === 'es' ? `Hay ${prog.tests.length} pruebas. Pulsa Ejecutar pruebas.` : `There are ${prog.tests.length} tests. Press Run tests.`));
  else left.append(h('div', { class: 'empty' }, T('fixFirst')));
  // plan
  right.append(h('h3', null, T('testPlan')));
  const fnames = prog ? BL.allDefs(prog).filter(d => d.kind !== 'init').map(d => d.label) : [];
  const tnames = prog ? prog.tests.map(t => t.name) : [];
  const kinds = [['normal', 'kNormal'], ['boundary', 'kBoundary'], ['error', 'kError'], ['invalid', 'kInvalid']];
  const tbl = h('table', { class: 'plan' }, h('tr', null, [T('pTarget'), T('pKind'), T('pInput'), T('pExpected'), T('pTest'), T('pStatus'), ''].map(x => h('th', null, x))));
  P.plan.forEach((row, i) => {
    const upd = (k) => (e) => { row[k] = e.target.value; saveSoon(); if (k === 'target' || k === 'kind' || k === 'test') renderTests(); };
    const sel = (k, opts) => { const s = h('select', { onchange: upd(k), 'aria-label': k }, opts.map(([v, l]) => h('option', { value: v, selected: row[k] === v || null }, l))); return s; };
    let status = h('span', { class: 'chip' }, T('notAuto'));
    if (row.test && tr) { const rr = tr.results.find(x => x.name === row.test); if (rr) status = h('span', { class: 'chip ' + (rr.passed ? 'ok' : 'bad') }, rr.passed ? T('passed') : T('failed')); }
    tbl.append(h('tr', null,
      h('td', null, sel('target', [['', '–'], ...fnames.map(f => [f, f]), ...(row.target && !fnames.includes(row.target) ? [[row.target, row.target]] : [])])),
      h('td', null, sel('kind', kinds.map(([v, l]) => [v, T(l)]))),
      h('td', null, h('input', { value: row.input || '', onchange: upd('input'), 'aria-label': T('pInput') })),
      h('td', null, h('input', { value: row.expected || '', onchange: upd('expected'), 'aria-label': T('pExpected') })),
      h('td', null, sel('test', [['', '–'], ...tnames.map(t => [t, t])])),
      h('td', null, status),
      h('td', null, h('button', { class: 'btn tiny ghost', 'aria-label': T('remove'), onclick: () => { P.plan.splice(i, 1); saveSoon(); renderTests(); } }, '×'))));
  });
  right.append(h('div', { class: 'tblWrap' }, tbl), h('div', { class: 'toolbar', style: 'margin-top:6px' }, h('button', { class: 'btn tiny', onclick: () => { P.plan.push({ target: fnames[0] || '', kind: 'normal', input: '', expected: '', test: '' }); saveSoon(); renderTests(); } }, '+ ' + T('addRow'))));
  if (prog) {
    const warns = BL.planWarnings(prog, P.plan, tr ? { coverage: tr.coverage } : null);
    if (warns.length) right.append(h('h3', { style: 'margin-top:10px' }, T('planWarn')), h('div', { class: 'warnList' }, warns.map(w => h('div', { class: w.level, html: codeMsg(w.text) }))));
  }
}

// ----- docs tab -----
DBG.docView = 'ref';
function renderDocs() {
  const tab = $('#tab-docs'); tab.innerHTML = '';
  const sub = h('div', { class: 'sub' });
  for (const [k, l] of [['ref', 'dRef'], ['check', 'dCheck'], ['about', 'dAbout'], ['credits', 'dCredits']]) sub.append(h('button', { class: 'seg2', 'aria-pressed': String(DBG.docView === k), onclick: () => { DBG.docView = k; renderDocs(); } }, T(l)));
  tab.append(sub);
  const prog = compile(true);
  const v = DBG.docView;
  if (v === 'ref') {
    if (!prog) { tab.append(h('div', { class: 'empty' }, T('fixFirst'))); return; }
    const defs = [];
    for (const [, c] of prog.classes) { defs.push({ def: c, label: c.name + (c.parent ? ` ${BL.kwName('extends', ED)} ${c.parent}` : ''), cls: true }); if (c.init) defs.push({ def: c.init, label: c.name + '.' + BL.kwName('init', ED) }); for (const m of c.methods) defs.push({ def: m, label: c.name + '.' + m.name }); }
    for (const [, f] of prog.funcs) defs.push({ def: f, label: f.name });
    if (!defs.length) { tab.append(h('div', { class: 'empty' }, T('noDefs'))); return; }
    const ex = S.testRun && S.testRun.src === prog.src ? S.testRun.res.examples : BL.runTests({ ...prog, tests: [] }, { files: Object.entries(P.files) }).examples;
    for (const d of defs) {
      const F = d.def.doc ? d.def.doc.fields : {};
      const sig = d.cls ? d.label : d.label + '(' + d.def.params.map(p => p.name + (p.def ? ' = ' + p.def.src : '')).join(', ') + ')';
      const dl = h('dl');
      const field = (k) => { if (F[k]) dl.append(h('dt', null, BL.DOC_FIELDS[k][ED === 'es' ? 1 : 0].toLowerCase()), h('dd', null, F[k])); };
      ['purpose', 'inputs', 'returns', 'attributes', 'errors'].forEach(field);
      const exs = ex.filter(e => d.def.doc && d.def.doc.examples.some(x => x.line === e.line));
      if (exs.length) dl.append(h('dt', null, BL.DOC_FIELDS.example[ED === 'es' ? 1 : 0].toLowerCase()), h('dd', null, exs.map(e => h('div', null, h('code', null, e.text), ' ', h('span', { class: 'chip ' + (e.ok ? 'ok' : 'bad') }, e.ok ? '✓' : '✗ ' + e.detail)))));
      if (!d.def.doc) dl.append(h('dt', null, ''), h('dd', { class: 'muted' }, ED === 'es' ? 'Sin documentar.' : 'Not documented yet.'));
      tab.append(h('div', { class: 'docEntry' }, h('h4', null, h('button', { class: 'linkbtn', style: 'font-family:var(--code)', onclick: () => editor.gotoLine(d.def.line, true) }, sig)), dl));
    }
  } else if (v === 'check') {
    if (!prog) { tab.append(h('div', { class: 'empty' }, T('fixFirst'))); return; }
    const w = BL.checkDocs(prog);
    if (!w.length) tab.append(h('div', { class: 'empty' }, T('docsOk')));
    const list = h('div', { class: 'warnList' });
    for (const x of w) {
      const row = h('div', { class: x.level }, h('span', { html: codeMsg(x.text) }), ' ', h('button', { class: 'linkbtn small', onclick: () => editor.gotoLine(x.line, true) }, T('goLine', { n: x.line })));
      if (/no DOC|no tiene bloque DOC/.test(x.text)) row.append(' ', h('button', { class: 'btn tiny', onclick: () => addDocTemplate(prog, x.target) }, T('addTemplate')));
      list.append(row);
    }
    tab.append(list);
  } else if (v === 'about') {
    const a = P.about;
    const f = (k, lab, ta) => { const el = ta ? h('textarea', { id: 'ab-' + k }, a[k] || '') : h('input', { id: 'ab-' + k, value: a[k] || '' }); el.addEventListener('input', () => { a[k] = el.value; saveSoon(); renderAboutPreview(); }); return [h('label', { for: 'ab-' + k }, lab), el]; };
    const ver = repoObj && Object.keys(repoObj.tags).length ? Object.keys(repoObj.tags).slice(-1)[0] : (repoObj && repoObj.headId() ? repoObj.headId() : '–');
    tab.append(h('div', { class: 'cols' }, h('div', { class: 'form' }, f('title', T('aTitle')), f('authors', T('aAuthors')), f('purpose', T('aPurpose'), true), f('audience', T('aAudience')), f('how', T('aHow'), true), f('limits', T('aLimits'), true),
      h('span', null, T('aVersion')), h('span', { class: 'mono small' }, ver)), h('div', { id: 'aboutPreview' })));
    renderAboutPreview();
  } else if (v === 'credits') {
    const rows = P.credits;
    const lic = ['', 'Own work', 'CC BY 4.0', 'CC BY-SA 4.0', 'CC0 / public domain', 'Open data (attribution)', 'Sample data provided with this app', 'Unknown'];
    const t = h('table', { class: 'plan' }, h('tr', null, [T('cSource'), T('cWhat'), T('cLicence'), T('cLink'), ''].map(x => h('th', null, x))));
    rows.forEach((r, i) => {
      const inp = (k) => h('input', { value: r[k] || '', onchange: (e) => { r[k] = e.target.value; saveSoon(); renderDocs(); }, 'aria-label': k });
      t.append(h('tr', null, h('td', null, inp('source')), h('td', null, inp('what')), h('td', null, h('select', { onchange: (e) => { r.licence = e.target.value; saveSoon(); renderDocs(); }, 'aria-label': T('cLicence') }, lic.map(l => h('option', { value: l, selected: r.licence === l || null }, l || '–')))), h('td', null, inp('link')),
        h('td', null, h('button', { class: 'btn tiny ghost', 'aria-label': T('remove'), onclick: () => { rows.splice(i, 1); saveSoon(); renderDocs(); } }, '×'))));
    });
    tab.append(h('div', { class: 'toolbar' }, h('button', { class: 'btn tiny', onclick: draftCredits }, T('draftCredits')), h('button', { class: 'btn tiny', onclick: () => { rows.push({ source: '', what: '', licence: '', link: '' }); saveSoon(); renderDocs(); } }, '+ ' + T('addCredit'))), h('div', { class: 'tblWrap' }, t));
    if (rows.some(r => !r.licence || r.licence === 'Unknown')) tab.append(h('div', { class: 'warnList', style: 'margin-top:8px' }, h('div', { class: 'warn' }, T('unknownLic'))));
  }
}
function renderAboutPreview() {
  const p = $('#aboutPreview'); if (!p) return; const a = P.about;
  p.innerHTML = '';
  const card = h('div', { class: 'about' }, h('h2', null, a.title || P.name), a.authors ? h('div', { class: 'muted' }, a.authors) : null,
    a.purpose ? h('p', null, a.purpose) : null, a.audience ? h('p', null, h('b', null, T('aAudience') + ': '), a.audience) : null,
    a.how ? h('p', null, h('b', null, T('aHow') + ': '), a.how) : null, a.limits ? h('p', null, h('b', null, T('aLimits') + ': '), a.limits) : null,
    P.credits.length ? h('div', null, h('b', null, T('dCredits')), h('ul', null, P.credits.map(c => h('li', null, [c.source, c.what, c.licence].filter(Boolean).join(', '))))) : null);
  p.append(h('div', { class: 'muted small', style: 'margin-bottom:4px' }, T('preview')), card);
}
function draftCredits() {
  const found = new Map();
  const src = P.files['main.bl'] || '';
  for (const m of src.matchAll(/["'](sample:[\w-]+)(?:\/[\w-]*)?["']/g)) found.set(m[1], { what: /network/.test(m[1]) ? 'network' : 'data', licence: 'Sample data provided with this app' });
  for (const m of src.matchAll(/["'](https?:\/\/[^"'\s/]+)[^"']*["']/g)) found.set(m[1], { what: 'web API', licence: '' });
  for (const n of Object.keys(P.files)) if (n !== 'main.bl' && src.includes(n)) found.set(n, { what: 'project file', licence: '' });
  if (S.runner) for (const c of S.runner.credits) { const k = c.replace(/^(file|api):/, ''); if (!found.has(k)) found.set(k, { what: c.startsWith('api') ? 'web API' : 'data', licence: c.startsWith('sample') ? 'Sample data provided with this app' : '' }); }
  let added = 0;
  for (const [k, v] of found) if (!P.credits.some(c => c.source === k)) { P.credits.push({ source: k, what: v.what, licence: v.licence, link: '' }); added++; }
  saveSoon(); renderDocs(); toast((ED === 'es' ? 'Fuentes añadidas: ' : 'Sources added: ') + added);
}
function addDocTemplate(prog, label) {
  const d = BL.allDefs(prog).find(x => x.label === label);
  let def, isClass = false, cls = null;
  if (d) def = d.def; else { cls = prog.classes.get(label); def = cls; isClass = true; }
  if (!def) return;
  const lines = editor.value.split('\n');
  const indent = (lines[def.line - 1].match(/^\s*/) || [''])[0];
  const tpl = BL.docTemplate(def, ED, isClass, isClass ? cls : (label.includes('.') ? 'method' : null)).split('\n').map(l => indent + l).join('\n');
  lines.splice(def.line - 1, 0, tpl);
  setCode(lines.join('\n'));
  editor.gotoLine(def.line + 1, true);
  renderDocs();
}

// ----- history tab -----
S.histSel = null; S.pendingMerge = null; S.gitOut = [];
function workFiles() { return { ...P.files }; }
function histErr(e) {
  const m = { dirty: ['Save a version or undo your changes before switching or merging.', 'Guarda una versión o deshaz los cambios antes de cambiar de rama o fusionar.'], nothing: ['Nothing has changed since the last version.', 'No ha cambiado nada desde la última versión.'],
    exists: ['That branch already exists.', 'Esa rama ya existe.'], 'bad-name': ['Use letters, numbers, - and _ only.', 'Usa solo letras, números, - y _.'], 'no-commits': ['Save a first version first.', 'Primero guarda una versión.'],
    'no-branch': ['There is no branch with that name.', 'No hay ninguna rama con ese nombre.'], 'empty-message': ['Describe what changed.', 'Describe qué cambió.'], 'no-commit': ['There is no version with that id.', 'No hay ninguna versión con ese id.'] }[e.message];
  toast(m ? m[ED === 'es' ? 1 : 0] : String(e.message));
}
function loadWork(files) { P.files = { ...files }; if (!('main.bl' in P.files)) P.files['main.bl'] = ''; setCode(P.files['main.bl']); saveSoon(); }
function renderHistory() {
  const tab = $('#tab-history'); tab.innerHTML = '';
  const R = repoObj;
  const work = workFiles();
  const left = h('div'), right = h('div');
  tab.append(h('div', { class: 'hist' }, left, right));
  // branch bar
  const bsel = h('select', { 'aria-label': T('hBranch'), onchange: (e) => { try { loadWork(R.switchTo(e.target.value, work)); } catch (err) { histErr(err); } saveSoon(); renderHistory(); } }, Object.keys(R.branches).map(b => h('option', { value: b, selected: b === R.head || null }, b)));
  const nb = h('input', { placeholder: T('hNewBranch'), style: 'width:120px;border:1px solid var(--line);border-radius:6px;padding:3px 6px', 'aria-label': T('hNewBranch') });
  const others = Object.keys(R.branches).filter(b => b !== R.head);
  const msel = h('select', { 'aria-label': T('hMerge') }, others.map(b => h('option', { value: b }, b)));
  const tg = h('input', { placeholder: 'v1.0', style: 'width:70px;border:1px solid var(--line);border-radius:6px;padding:3px 6px', 'aria-label': T('hTag') });
  left.append(h('div', { class: 'toolbar' }, h('span', { class: 'small muted' }, T('hBranch')), bsel,
    nb, h('button', { class: 'btn tiny', onclick: () => { try { R.branch(nb.value.trim()); toast('git branch ' + nb.value.trim()); } catch (e) { histErr(e); } saveSoon(); renderHistory(); } }, '+'),
  ));
  if (others.length) left.append(h('div', { class: 'toolbar' }, h('span', { class: 'small muted' }, T('hMerge')), msel, h('button', { class: 'btn tiny', onclick: () => doMerge(msel.value) }, '⑂ ' + T('hMerge').split(' ')[0])));
  left.append(h('div', { class: 'toolbar' }, tg, h('button', { class: 'btn tiny', onclick: () => { try { R.tag(tg.value.trim()); } catch (e) { histErr(e); } saveSoon(); renderHistory(); } }, T('hTag')),
    h('span', { class: 'sep' }), h('button', { class: 'btn tiny', onclick: () => { if (!R.headId()) return histErr(new Error('no-commits')); const n = R.push(); toast(ED === 'es' ? `${n} versiones subidas a origin/${R.head}` : `${n} versions pushed to origin/${R.head}`); saveSoon(); renderHistory(); } }, '↑ ' + T('hPush')),
    h('button', { class: 'btn tiny', onclick: () => { const n = R.pull(); if (n) loadWork(R.headFiles()); toast(n ? 'Updated' : (ED === 'es' ? 'Ya está actualizado' : 'Already up to date')); saveSoon(); renderHistory(); } }, '↓ ' + T('hPull'))));
  const rem = R.remote.branches[R.head];
  left.append(h('div', { class: 'small muted', style: 'margin-bottom:8px' }, T('hRemote') + ': ', rem ? h('span', { class: 'sha' }, 'origin/' + R.head + ' ' + rem) : '–'));
  // status + commit
  const st = R.status(work);
  const statusBox = h('div', { class: 'box', style: 'margin-bottom:10px' }, h('h4', null, T('hStatus')));
  if (!st.length) statusBox.append(h('div', { class: 'muted small' }, T('hNoChanges')));
  const staging = P.settings.staging;
  const include = new Set(st.map(s => s.name));
  for (const s of st) {
    const cb = staging ? h('input', { type: 'checkbox', checked: true, 'aria-label': s.name, onchange: (e) => { e.target.checked ? include.add(s.name) : include.delete(s.name); } }) : null;
    statusBox.append(h('div', { class: 'fileRow' }, cb, h('code', null, s.name), h('span', { class: 'chip ' + (s.state === 'added' ? 'ok' : s.state === 'deleted' ? 'bad' : 'acc') }, s.state), h('span', { class: 'small', style: 'color:var(--ok)' }, '+' + s.plus), h('span', { class: 'small', style: 'color:var(--bad)' }, '−' + s.minus)));
  }
  const what = h('input', { id: 'hWhat' }), why = h('textarea', { id: 'hWhy' });
  const hint = h('div', { class: 'small muted' });
  what.addEventListener('input', () => { const v = what.value.trim(); hint.textContent = v && (v.length < 8 || /^(update|updates|fix|changes|stuff|cambios|arreglo|actualizar)$/i.test(v)) ? T('hShortMsg') : ''; });
  statusBox.append(h('div', { class: 'field', style: 'margin-top:8px' }, h('label', { for: 'hWhat' }, T('hWhat')), what, hint), h('div', { class: 'field' }, h('label', { for: 'hWhy' }, T('hWhy')), why),
    h('label', { class: 'small muted', style: 'display:flex;gap:6px;align-items:center;margin-bottom:6px' }, h('input', { type: 'checkbox', checked: staging || null, onchange: (e) => { P.settings.staging = e.target.checked; saveSoon(); renderHistory(); } }), T('hStaging')),
    h('button', { class: 'btn primary', disabled: !st.length || null, onclick: () => {
      const msg = what.value.trim() + (why.value.trim() ? '\n\n' + why.value.trim() : '');
      try {
        if (staging) { R.add([...include], work); R.commit(msg, work, { useStaging: true }); }
        else R.commit(msg, work);
        toast(T('saved') + ' ' + R.headId()); S.histSel = R.headId();
      } catch (e) { histErr(e); }
      saveSoon(); renderHistory();
    } }, T('hSave')));
  left.append(statusBox);
  // timeline
  const log = R.log();
  const tl = h('div', { class: 'box' }, h('h4', null, T('hTimeline')));
  if (!log.length) tl.append(h('div', { class: 'muted small' }, T('hEmpty')));
  const colorOf = (b) => { let x = 0; for (const c of b || '') x = (x * 31 + c.charCodeAt(0)) >>> 0; return b === 'main' ? '#2750D8' : ['#1F8A4C', '#B4461B', '#7C3AED', '#0E7490', '#A86A12'][x % 5]; };
  const heads = {}; for (const b in R.branches) if (R.branches[b]) (heads[R.branches[b]] = heads[R.branches[b]] || []).push(b);
  const tags = {}; for (const t in R.tags) (tags[R.tags[t]] = tags[R.tags[t]] || []).push(t);
  for (const c of log) {
    const dot = h('span', { style: `display:inline-block;width:12px;height:12px;border-radius:50%;background:${colorOf(c.branch)};${c.parents.length > 1 ? 'outline:2px solid ' + colorOf(c.branch) + ';outline-offset:2px;background:#fff' : ''}` });
    tl.append(h('div', { class: 'commitItem' + (S.histSel === c.id ? ' sel' : ''), tabindex: 0, onclick: () => { S.histSel = c.id; S.pendingMerge = null; renderHistory(); }, onkeydown: (e) => { if (e.key === 'Enter') { S.histSel = c.id; renderHistory(); } } }, dot,
      h('div', null, h('div', { class: 'msg' }, c.message.split('\n')[0]), h('div', { class: 'meta' }, h('span', { class: 'sha' }, c.id), ' ', new Date(c.time).toLocaleString(), ' ',
        (heads[c.id] || []).map(b => h('span', { class: 'chip acc', style: 'margin-left:4px' }, (b === R.head ? 'HEAD → ' : '') + b)), (tags[c.id] || []).map(t => h('span', { class: 'chip warn', style: 'margin-left:4px' }, '🏷 ' + t))))));
  }
  left.append(tl);
  // right side
  if (S.pendingMerge) right.append(renderConflicts());
  else if (S.histSel && R.commits[S.histSel]) {
    const c = R.commits[S.histSel];
    const parent = R.filesAt(c.parents[0]);
    right.append(h('div', { class: 'box', style: 'margin-bottom:10px' }, h('h4', null, c.message.split('\n')[0]),
      c.message.includes('\n') ? h('p', { class: 'small', style: 'white-space:pre-wrap;margin:0 0 6px' }, c.message.split('\n').slice(1).join('\n').trim()) : null,
      h('div', { class: 'small muted' }, h('span', { class: 'sha' }, c.id), ' · '.replace('·', ''), c.parents.length ? (ED === 'es' ? 'padre ' : 'parent ') + c.parents.join(', ') : ''),
      h('div', { class: 'toolbar', style: 'margin-top:6px' },
        h('button', { class: 'btn tiny', onclick: () => showModal(h('div', null, h('h3', null, c.id + ' – main.bl'), h('pre', { class: 'codeView' }, c.files['main.bl'] || ''), h('button', { class: 'btn', style: 'margin-top:8px', onclick: closeModal }, T('close')))) }, T('hView')),
        h('button', { class: 'btn tiny', onclick: () => { loadWork(c.files); R.logCmd('git checkout ' + c.id + ' -- .'); toast(T('hRestore')); saveSoon(); renderHistory(); } }, T('hRestore')),
        h('button', { class: 'btn tiny', disabled: !c.parents.length || null, onclick: () => { try { const res = R.revert(c.id, workFiles()); if (res.kind === 'reverted') { loadWork(res.files); S.histSel = res.id; toast('Reverted'); } else toast(ED === 'es' ? 'No se puede deshacer automáticamente: cambios posteriores tocan las mismas líneas.' : 'Cannot undo automatically: later changes touch the same lines.'); } catch (e) { histErr(e); } saveSoon(); renderHistory(); } }, T('hUndo')))),
      h('h4', null, T('hCompare')), renderDiff(R.diffFiles(parent, c.files)));
  }
  // console
  const out = h('div', { class: 'gitConsole', 'aria-live': 'polite' });
  for (const l of S.gitOut.slice(-60)) out.append(h('div', { class: l.cmd ? 'cmd' : '' }, l.text));
  const ci = h('input', { class: 'mono', placeholder: 'git status', style: 'flex:1;border:1px solid var(--line);border-radius:6px;padding:4px 8px;min-width:0', 'aria-label': T('hConsole') });
  ci.addEventListener('keydown', (e) => { if (e.key === 'Enter') { gitCommand(ci.value); } });
  right.append(h('div', { class: 'box', style: 'margin-top:10px' }, h('h4', null, T('hConsole')), out, h('div', { style: 'display:flex;gap:6px;margin-top:6px' }, ci, h('button', { class: 'btn tiny', onclick: () => gitCommand(ci.value) }, '⏎'))));
  right.append(h('div', { class: 'box', style: 'margin-top:10px' }, h('h4', null, T('hCmds')), h('div', { class: 'gitConsole' }, R.cmdlog.slice(-14).join('\n') || '–')));
  setTimeout(() => { out.scrollTop = out.scrollHeight; }, 0);
}
function renderDiff(files) {
  const d = h('div', { class: 'diff' });
  if (!files.length) d.append(h('div', { class: 'dl ctx' }, ED === 'es' ? 'Sin cambios.' : 'No changes.'));
  for (const f of files) {
    d.append(h('div', { class: 'fh' }, f.name));
    let ctxRun = [];
    const flush = (end) => { if (ctxRun.length > 6) { const keep = end ? ctxRun.slice(0, 3) : ctxRun.slice(0, 3).concat([null], ctxRun.slice(-3)); ctxRun = keep; } for (const o of ctxRun) d.append(o ? h('div', { class: 'dl ctx' }, '  ' + o.s) : h('div', { class: 'dl ctx' }, '  ⋯')); ctxRun = []; };
    let first = true;
    for (const o of f.ops) {
      if (o.t === ' ') { ctxRun.push(o); continue; }
      if (first && ctxRun.length > 3) ctxRun = [null].concat(ctxRun.slice(-3));
      first = false; flush(false);
      d.append(h('div', { class: 'dl ' + (o.t === '+' ? 'add' : 'del') }, o.t + ' ' + o.s));
    }
    if (ctxRun.length) { ctxRun = ctxRun.slice(0, 3); flush(true); }
  }
  return d;
}
function doMerge(name) {
  const R = repoObj;
  try {
    const res = R.merge(name, workFiles());
    if (res.kind === 'uptodate') toast(ED === 'es' ? 'Ya está actualizado' : 'Already up to date');
    else if (res.kind === 'fastforward' || res.kind === 'merged') { loadWork(res.files); toast(res.kind === 'merged' ? (ED === 'es' ? 'Fusionado' : 'Merged') : (ED === 'es' ? 'Avance rápido' : 'Fast-forward')); S.histSel = R.headId(); }
    else { S.pendingMerge = { res, choice: res.conflicts.map(c => c.whole ? { mode: 'ours' } : c.chunks.map(() => ({ mode: 'ours' }))) }; }
  } catch (e) { histErr(e); }
  saveSoon(); renderHistory();
}
function resolvedFiles() {
  const pm = S.pendingMerge; const files = { ...pm.res.files };
  pm.res.conflicts.forEach((c, i) => {
    if (c.whole) { const m = pm.choice[i].mode; const t = m === 'ours' ? c.ours : m === 'theirs' ? c.theirs : c.ours + '\n' + c.theirs; if (t !== '') files[c.name] = t; return; }
    files[c.name] = BL.mergedText(c.parts, (k) => { const ch = c.chunks[k], m = pm.choice[i][k]; if (m.mode === 'edit') return m.text.split('\n'); return m.mode === 'ours' ? ch.ours : m.mode === 'theirs' ? ch.theirs : ch.ours.concat(ch.theirs); });
  });
  return files;
}
function renderConflicts() {
  const pm = S.pendingMerge; const box = h('div', { class: 'box' }, h('h4', null, T('hConflicts') + ': ' + pm.res.name + ' → ' + repoObj.head));
  box.append(h('p', { class: 'small muted', style: 'margin:0 0 6px' }, ED === 'es' ? 'Las dos ramas cambiaron las mismas líneas. Elige qué conservar en cada conflicto. La fusión solo termina si las pruebas pasan.' : 'Both branches changed the same lines. Choose what to keep for each conflict. The merge only finishes if the tests pass.'));
  pm.res.conflicts.forEach((c, i) => {
    const chunks = c.whole ? [{ ours: c.ours.split('\n'), theirs: c.theirs.split('\n') }] : c.chunks;
    chunks.forEach((ch, k) => {
      const choice = c.whole ? pm.choice[i] : pm.choice[i][k];
      const btn = (mode, lab) => h('button', { class: 'btn tiny' + (choice.mode === mode ? ' primary' : ''), onclick: () => { choice.mode = mode; renderHistory(); } }, lab);
      const div = h('div', { class: 'conflict' }, h('div', { class: 'ch' }, h('code', null, c.name), ' #' + (k + 1), h('span', { class: 'grow' }), btn('ours', T('hMine')), btn('theirs', T('hTheirs')), btn('both', T('hBoth')), btn('edit', '✎')),
        h('div', { class: 'side' }, h('pre', { class: 'ours' }, repoObj.head + ':\n' + ch.ours.join('\n')), h('pre', { class: 'theirs' }, pm.res.name + ':\n' + ch.theirs.join('\n'))));
      if (choice.mode === 'edit') { if (choice.text === undefined) choice.text = ch.ours.join('\n'); const ta = h('textarea', { class: 'fileEdit', style: 'min-height:80px;border-radius:0', 'aria-label': 'Edit resolution' }, choice.text); ta.addEventListener('input', () => { choice.text = ta.value; }); div.append(ta); }
      box.append(div);
    });
  });
  const msg = h('div', { class: 'small', style: 'margin-top:6px' });
  box.append(h('div', { class: 'toolbar' }, h('button', { class: 'btn primary', onclick: () => {
    const files = resolvedFiles();
    let prog;
    try { prog = BL.parse(files['main.bl'] || '', ED); } catch (e) { msg.innerHTML = codeMsg((ED === 'es' ? 'El código fusionado tiene un error: ' : 'The merged code has an error: ') + BL.errText(e, ED) + ` (${T('line')} ${e.line})`); return; }
    const tr = BL.runTests(prog, { files: Object.entries(files) });
    const bad = tr.results.filter(r => !r.passed);
    if (bad.length) { msg.innerHTML = codeMsg((ED === 'es' ? 'Estas pruebas fallan: ' : 'These tests fail: ') + bad.map(b => b.name).join(', ')); return; }
    repoObj.finishMerge(pm.res, files);
    S.pendingMerge = null; loadWork(files); S.histSel = repoObj.headId();
    toast((ED === 'es' ? 'Fusión terminada. Pruebas superadas: ' : 'Merge finished. Tests passed: ') + tr.results.length);
    saveSoon(); renderHistory();
  } }, T('hFinish')), h('button', { class: 'btn', onclick: () => { S.pendingMerge = null; repoObj.logCmd('git merge --abort'); renderHistory(); } }, T('hCancel'))), msg);
  return box;
}
function gitCommand(line) {
  const R = repoObj; const out = (t) => S.gitOut.push({ text: t }); S.gitOut.push({ text: '$ ' + line, cmd: true });
  const args = (line.match(/"[^"]*"|\S+/g) || []).map(a => a.replace(/^"|"$/g, ''));
  if (args[0] === 'git') args.shift();
  const work = workFiles();
  try {
    switch (args[0]) {
      case undefined: break;
      case 'help': out('status, add <file|.>, commit -m "message", log [--oneline], diff [id], branch [name], switch <branch>, checkout <branch|id>, merge <branch>, revert <id>, tag <name> [id], push, pull, restore --staged .'); break;
      case 'status': { const st = R.status(work); out('On branch ' + R.head); if (!st.length) out('nothing to commit, working tree clean'); for (const s of st) out(`  ${s.staged ? '(staged) ' : ''}${s.state}: ${s.name}`); break; }
      case 'add': { const names = args[1] === '.' || args[1] === '-A' ? R.status(work).map(s => s.name) : args.slice(1); R.add(names, work); P.settings.staging = true; out('staged ' + names.join(', ')); break; }
      case 'restore': if (args.includes('--staged')) { R.unstage(); out('unstaged'); } else if (args[1]) { const f = R.headFiles(); if (args[1] in f) { P.files[args[1]] = f[args[1]]; if (args[1] === 'main.bl') setCode(f[args[1]]); out('restored ' + args[1]); } } break;
      case 'commit': { const i = args.indexOf('-m'); const m = i >= 0 ? args[i + 1] : ''; R.commit(m, work, { useStaging: !!R.staging }); out(`[${R.head} ${R.headId()}] ${m}`); break; }
      case 'log': for (const c of R.log().slice(0, 20)) out(args[1] === '--oneline' ? `${c.id} ${c.message.split('\n')[0]}` : `commit ${c.id}\nDate: ${new Date(c.time).toLocaleString()}\n    ${c.message.split('\n')[0]}\n`); break;
      case 'diff': { const base = args[1] ? R.filesAt(R.resolve(args[1])) : R.headFiles(); for (const f of R.diffFiles(base, work)) { out('--- ' + f.name); for (const o of f.ops) if (o.t !== ' ') out(o.t + ' ' + o.s); } break; }
      case 'branch': if (args[1]) { R.branch(args[1]); out('created ' + args[1]); } else for (const b in R.branches) out((b === R.head ? '* ' : '  ') + b); break;
      case 'switch': case 'checkout': {
        if (R.branches[args[1]] !== undefined) { loadWork(R.switchTo(args[1], work)); out('Switched to branch ' + args[1]); }
        else { const id = R.resolve(args[1]); if (!id) throw new Error('no-commit'); S.histSel = id; out('Showing ' + id + ' (use Restore to copy it into your work)'); }
        break;
      }
      case 'merge': doMerge(args[1]); out('merge ' + args[1]); return;
      case 'revert': { const id = R.resolve(args[1]); const r = R.revert(id, work); if (r.kind === 'reverted') { loadWork(r.files); out('Reverted as ' + r.id); } else out('conflict in ' + r.conflicts.join(', ')); break; }
      case 'tag': R.tag(args[1], args[2] ? R.resolve(args[2]) : undefined); out('tagged ' + args[1]); break;
      case 'push': out(R.push() + ' commits pushed to origin/' + R.head); break;
      case 'pull': out(R.pull() ? 'fast-forwarded' : 'Already up to date.'); break;
      case 'show': { const id = R.resolve(args[1]); if (!id) throw new Error('no-commit'); S.histSel = id; out(R.commits[id].message); break; }
      default: out((ED === 'es' ? 'No conozco ese comando. Prueba help.' : 'Unknown command. Try help.'));
    }
  } catch (e) { const m = { dirty: 'error: your local changes would be overwritten; save a version first', nothing: 'nothing to commit', 'no-commit': 'fatal: unknown revision', 'no-branch': 'error: no such branch', 'empty-message': 'error: empty commit message', exists: 'fatal: branch already exists', 'bad-name': 'fatal: not a valid name', 'no-commits': 'fatal: no commits yet' }[e.message]; out(m || String(e.message)); }
  saveSoon(); renderHistory();
  const ci = $('#tab-history input[placeholder="git status"]'); if (ci) ci.focus();
}

// ----- python tab -----
const PY_KW = /\b(def|class|return|if|elif|else|for|while|in|not|and|or|import|from|as|try|except|raise|with|pass|break|continue|True|False|None|assert|lambda|self|super)\b/g;
function pyHighlight(code) {
  return code.split('\n').map(l => {
    const ci = l.indexOf('#');
    let body = l, com = '';
    if (ci >= 0 && !/["']/.test(l.slice(0, ci))) { body = l.slice(0, ci); com = l.slice(ci); }
    let s = esc(body).replace(/(&quot;.*?&quot;|&#39;.*?&#39;)/g, '\u0001$1\u0002').replace(PY_KW, '<span class="t-kw">$1</span>').replace(/\u0001(.*?)\u0002/g, '<span class="t-str">$1</span>');
    return s + (com ? `<span class="t-com">${esc(com)}</span>` : '');
  }).join('\n');
}
function renderPython() {
  const tab = $('#tab-python'); tab.innerHTML = '';
  const prog = compile(true);
  if (!prog) { tab.append(h('div', { class: 'empty' }, T('fixFirst'))); return; }
  const code = BL.toPython(prog);
  tab.append(h('p', { class: 'muted small', style: 'margin:0 0 8px' }, T('pyNote')),
    h('div', { class: 'toolbar' }, h('button', { class: 'btn tiny', onclick: () => copyText(code) }, T('copy')),
      h('button', { class: 'btn tiny', onclick: () => offerDownload((P.name || 'program').replace(/[^\w-]+/g, '_') + '_python.zip', makeZip([['main.py', code], ['blstudent.py', BLSTUDENT_PY]])) }, T('download') + ' (.zip: main.py + blstudent.py)')),
    h('pre', { class: 'codeView', html: pyHighlight(code) }));
}
const BLSTUDENT_PY = `"""blstudent: teaching helpers used by Python code generated from BASIC62 programs.

Covers text helpers, data tools, charts (with matplotlib if installed), turtle shapes and the
security demos. The simulated network and screen controls exist only in the browser app.
"""
import csv, datetime, hashlib, math, os, random, re, string, time, turtle

_start = time.time()

def frange(a, b, step=1):
    x, out = a, []
    while (step > 0 and x <= b + 1e-12) or (step < 0 and x >= b - 1e-12):
        out.append(round(x, 10)); x += step
    return out

def is_number(t):
    return bool(re.fullmatch(r"\\s*[-+]?(\\d+(\\.\\d+)?|\\.\\d+)\\s*", t))

def now():
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def timer():
    return time.time() - _start

# ---- graphics (turtle) ----
_fill = None
def fill_color(c):
    global _fill
    _fill = None if c == "none" else c
def _shape(draw):
    turtle.penup(); h = turtle.heading(); p = turtle.position()
    if _fill: turtle.fillcolor(_fill); turtle.begin_fill()
    draw()
    if _fill: turtle.end_fill()
    turtle.penup(); turtle.goto(p); turtle.setheading(h); turtle.pendown()
def circle(x, y, r):
    def d(): turtle.goto(x, y - r); turtle.setheading(0); turtle.pendown(); turtle.circle(r)
    _shape(d)
def rect(x, y, w, h):
    def d():
        turtle.goto(x, y); turtle.setheading(0); turtle.pendown()
        for side in (w, h, w, h): turtle.forward(side); turtle.right(90)
    _shape(d)
def line(x1, y1, x2, y2):
    turtle.penup(); turtle.goto(x1, y1); turtle.pendown(); turtle.goto(x2, y2)
def write(x, y, text):
    turtle.penup(); turtle.goto(x, y); turtle.write(str(text), font=("Arial", 12, "normal"))
def clear():
    turtle.clear()

# ---- data tools ----
MISSING = {"", "N/A", "NA", "n/a", "na", "-", "null", "NULL"}
def is_missing(v):
    return v is None or (isinstance(v, str) and v.strip() in MISSING)
def _auto(s):
    t = s.strip()
    try: return int(t)
    except ValueError: pass
    try: return float(t)
    except ValueError: return s
def load_csv(name):
    with open(name, newline="", encoding="utf-8") as f:
        return [{k.strip(): _auto(v or "") for k, v in row.items()} for row in csv.DictReader(f)]
def save_csv(name, rows):
    cols = []
    for r in rows:
        for k in r:
            if k not in cols: cols.append(k)
    with open(name, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cols); w.writeheader(); w.writerows(rows)
def load_text(name):
    with open(name, encoding="utf-8") as f: return f.read()
def save_text(name, text):
    with open(name, "w", encoding="utf-8") as f: f.write(str(text))
def list_files():
    return sorted(os.listdir("."))
def show_table(rows):
    for r in rows: print(r)
def column(rows, col): return [r.get(col) for r in rows]
def select(rows, cols): return [{c: r.get(c) for c in cols} for r in rows]
def unique(xs):
    out = []
    for x in xs:
        if x not in out: out.append(x)
    return out
def sort_by(rows, col, order="asc"):
    present = [r for r in rows if not is_missing(r.get(col))]
    missing = [r for r in rows if is_missing(r.get(col))]
    return sorted(present, key=lambda r: r[col], reverse=(order == "desc")) + missing
def where(rows, col, op, value):
    ops = {"==": lambda a: a == value, "!=": lambda a: a != value, "<": lambda a: a < value, ">": lambda a: a > value,
           "<=": lambda a: a <= value, ">=": lambda a: a >= value, "contains": lambda a: str(value).lower() in str(a).lower()}
    return [r for r in rows if (op in ("==", "!=", "contains") or not is_missing(r.get(col))) and ops[op](r.get(col))]
def filter_rows(rows, fn): return [r for r in rows if fn(r)]
def group_by(rows, col):
    g = {}
    for r in rows: g.setdefault(r.get(col), []).append(r)
    return g
def count_by(rows, col):
    c = {}
    for r in rows: c[r.get(col)] = c.get(r.get(col), 0) + 1
    return c
def _nums(xs): return [x for x in xs if not is_missing(x)]
def mean(xs): xs = _nums(xs); return sum(xs) / len(xs)
def median(xs):
    s = sorted(_nums(xs)); m = len(s) // 2
    return s[m] if len(s) % 2 else (s[m - 1] + s[m]) / 2
def mode(xs):
    xs = _nums(xs); return max(xs, key=xs.count)
def stdev(xs):
    xs = _nums(xs); m = mean(xs)
    return math.sqrt(sum((x - m) ** 2 for x in xs) / (len(xs) - 1)) if len(xs) > 1 else 0.0
def summarize(rows, col):
    xs = _nums(column(rows, col))
    return {"count": len(xs), "sum": sum(xs), "mean": round(mean(xs), 6), "median": median(xs), "mode": mode(xs), "min": min(xs), "max": max(xs)}
def drop_missing(rows, col): return [r for r in rows if not is_missing(r.get(col))]
def fill_missing(rows, col, value): return [{**r, col: (value if is_missing(r.get(col)) else r.get(col))} for r in rows]
def dedupe(rows):
    out = []
    for r in rows:
        if r not in out: out.append(r)
    return out
def rename_column(rows, old, new): return [{(new if k == old else k): v for k, v in r.items()} for r in rows]
def convert_column(rows, col, kind):
    def conv(v):
        if kind == "number":
            x = _auto(str(v)) if v is not None else None
            return x if isinstance(x, (int, float)) else None
        return "" if is_missing(v) else str(v)
    return [{**r, col: conv(r.get(col))} for r in rows]
def clean_text(t): return " ".join(t.split())
def remove_punctuation(t): return "".join(c for c in t if c not in string.punctuation)
def words(t): return remove_punctuation(t.lower()).split()
def word_counts(t):
    c = {}
    for w in words(t): c[w] = c.get(w, 0) + 1
    return dict(sorted(c.items(), key=lambda kv: -kv[1]))
def to_number(t, default):
    x = _auto(str(t)); return x if isinstance(x, (int, float)) else default
def _chart(kind, xs, ys, title):
    try:
        import matplotlib.pyplot as plt
    except ImportError:
        print(title, list(zip(xs, ys))); return
    {"bar": plt.bar, "line": plt.plot, "scatter": plt.scatter}[kind](xs, ys)
    plt.title(title); plt.show()
def bar_chart(labels, values, title=""): _chart("bar", labels, values, title)
def line_chart(xs, ys, title=""): _chart("line", xs, ys, title)
def scatter_chart(xs, ys, title=""): _chart("scatter", xs, ys, title)
def histogram(values, bins, title=""):
    try:
        import matplotlib.pyplot as plt
        plt.hist(_nums(values), bins=bins); plt.title(title); plt.show()
    except ImportError:
        print(title, values)

# ---- security ----
def caesar(text, shift):
    out = []
    for c in text:
        if "A" <= c <= "Z": out.append(chr((ord(c) - 65 + shift) % 26 + 65))
        elif "a" <= c <= "z": out.append(chr((ord(c) - 97 + shift) % 26 + 97))
        else: out.append(c)
    return "".join(out)
def _vig(text, key, d):
    key = [ord(k) - 65 for k in key.upper() if "A" <= k <= "Z"]; out, j = [], 0
    for c in text:
        if c.isascii() and c.isalpha(): out.append(caesar(c, d * key[j % len(key)])); j += 1
        else: out.append(c)
    return "".join(out)
def vigenere(text, key): return _vig(text, key, 1)
def vigenere_decrypt(text, key): return _vig(text, key, -1)
def letter_frequencies(text):
    c = {}
    for ch in text.upper():
        if "A" <= ch <= "Z": c[ch] = c.get(ch, 0) + 1
    return dict(sorted(c.items(), key=lambda kv: (-kv[1], kv[0])))
def hash_text(text): return hashlib.sha256(str(text).encode("utf-8")).hexdigest()
def random_salt(): return "".join(random.choice("0123456789abcdef") for _ in range(8))
def checksum(text): return sum(ord(c) for c in str(text)) % 256

def _unavailable(*args, **kwargs):
    raise NotImplementedError("This part runs in the browser app only (simulated network, screen controls).")
Network = Device = load_network = button = label = input_box = number_box = slider = dropdown = checkbox = on_click = on_change = _unavailable
`;

// ----- files tab -----
S.fileSel = null;
function renderFiles() {
  const tab = $('#tab-files'); tab.innerHTML = '';
  const cols = h('div', { class: 'cols' }); const left = h('div'), right = h('div'); cols.append(left, right); tab.append(cols);
  const up = h('input', { type: 'file', accept: '.csv,.txt,.json,.tsv,.md', id: 'fileUp', style: 'max-width:260px' });
  up.addEventListener('change', () => {
    const f = up.files[0]; if (!f) return;
    if (f.size > 1024 * 1024) { toast(T('fTooBig')); return; }
    const rd = new FileReader(); rd.onload = () => { const name = f.name.replace(/[^\w.\-]+/g, '_'); P.files[name] = String(rd.result); S.fileSel = name; saveSoon(); renderFiles(); toast(T('fUseHint', { n: name })); }; rd.readAsText(f);
  });
  left.append(h('h3', null, T('fProject')), h('div', { class: 'toolbar' }, h('label', { for: 'fileUp', class: 'small muted' }, T('fUpload')), up));
  for (const [name, text] of Object.entries(P.files)) {
    left.append(h('div', { class: 'fileRow' }, h('code', null, name), h('span', { class: 'muted small' }, (text.length / 1024).toFixed(1) + ' KB, ' + text.split('\n').length + ' ' + (ED === 'es' ? 'líneas' : 'lines')), h('span', { class: 'grow' }),
      name === 'main.bl' ? h('span', { class: 'chip' }, ED === 'es' ? 'tu programa' : 'your program') : [h('button', { class: 'btn tiny', onclick: () => { S.fileSel = name; renderFiles(); } }, '✎'), h('button', { class: 'btn tiny danger', onclick: () => { if (confirm(T('fDelete') + ' ' + name + '?')) { delete P.files[name]; if (S.fileSel === name) S.fileSel = null; saveSoon(); renderFiles(); } } }, T('fDelete'))]));
  }
  left.append(h('h3', { style: 'margin-top:14px' }, T('fSamples')));
  for (const k of Object.keys(BL.SAMPLES.csv)) {
    const rows = BL.SAMPLES.csv[k].split('\n');
    left.append(h('div', { class: 'fileRow' }, h('code', null, 'sample:' + k), h('span', { class: 'muted small' }, rows[0].split(',').join(', ') + ` (${rows.length - 1} ${ED === 'es' ? 'filas' : 'rows'})`), h('span', { class: 'grow' }),
      h('button', { class: 'btn tiny', onclick: () => { P.files[k + '.csv'] = BL.SAMPLES.csv[k]; S.fileSel = k + '.csv'; saveSoon(); renderFiles(); toast(T('fUseHint', { n: k + '.csv' })); } }, T('fAdd'))));
  }
  left.append(h('p', { class: 'small muted' }, ED === 'es' ? 'También puedes cargar los ejemplos directamente: cargar_csv("sample:students"). APIs sin conexión: sample:weather, sample:countries, sample:trivia, sample:echo.' : 'You can also load samples directly: load_csv("sample:students"). Offline APIs: sample:weather, sample:countries, sample:trivia, sample:echo.'));
  if (S.fileSel && P.files[S.fileSel] !== undefined && S.fileSel !== 'main.bl') {
    const ta = h('textarea', { class: 'fileEdit', 'aria-label': S.fileSel, spellcheck: 'false' }, P.files[S.fileSel]);
    right.append(h('h3', null, S.fileSel), ta, h('div', { class: 'toolbar', style: 'margin-top:6px' }, h('button', { class: 'btn tiny primary', onclick: () => { P.files[S.fileSel] = ta.value; saveSoon(); toast(T('saved')); renderFiles(); } }, T('fSave'))));
    if (/\.csv$/i.test(S.fileSel)) { try { right.append(renderTable(BL.csvToRows(P.files[S.fileSel]), ED, 50)); } catch (e) { } }
  }
}

// ----- reference tab -----
S.refQuery = '';
function renderReference() {
  const tab = $('#tab-reference'); tab.innerHTML = '';
  const q = h('input', { class: 'refSearch', type: 'search', placeholder: T('refSearch'), value: S.refQuery, 'aria-label': T('refSearch') });
  const list = h('div');
  const draw = () => {
    list.innerHTML = ''; const s = q.value.trim().toLowerCase(); S.refQuery = q.value;
    const match = (...xs) => !s || xs.some(x => x && String(x).toLowerCase().includes(s));
    const kwRows = Object.keys(BL.KW).filter(k => match(BL.KW[k][0], BL.KW[k][1]));
    if (kwRows.length) {
      list.append(h('div', { class: 'refCat' }, T('keywords')));
      const t = h('table', { class: 'data' }, h('tr', null, h('th', null, 'English'), h('th', null, 'Español')));
      for (const k of kwRows) t.append(h('tr', null, h('td', null, BL.KW[k][0]), h('td', null, BL.KW[k][1])));
      list.append(h('div', { class: 'tblWrap' }, t));
    }
    const cats = { core: ['Core', 'Básico'], text: ['Text', 'Texto'], graphics: ['Turtle and drawing', 'Tortuga y dibujo'], ui: ['Screen controls', 'Controles de pantalla'], web: ['Web data', 'Datos web'],
      data: ['Data tools', 'Herramientas de datos'], network: ['Simulated network', 'Red simulada'], security: ['Security', 'Seguridad'], testing: ['Testing', 'Pruebas'] };
    const item = (name, other, p, d, isM) => h('div', { class: 'refItem' }, h('div', null, h('code', null, (isM ? '.' : '') + name + '(' + (p || '') + ')'), other && other !== name ? h('div', { class: 'muted small' }, (ED === 'es' ? 'English: ' : 'Español: ') + other) : null), h('div', null, d));
    for (const c in cats) {
      const bs = BL.REG.builtins.filter(b => b.cat === c && match(b.n, b.es, b.d));
      if (!bs.length) continue;
      list.append(h('div', { class: 'refCat' }, cats[c][ED === 'es' ? 1 : 0]));
      for (const b of bs) list.append(item(ED === 'es' ? (b.es || b.n) : b.n, ED === 'es' ? b.n : b.es, b.p, b.d));
    }
    for (const [grp, lab] of [[BL.REG.text, ['Text methods', 'Métodos de texto']], [BL.REG.list, ['List methods', 'Métodos de lista']], [BL.REG.dict, ['Dictionary methods', 'Métodos de diccionario']]]) {
      const ms = grp.filter(m => match(m.n, m.es, m.d)); if (!ms.length) continue;
      list.append(h('div', { class: 'refCat' }, lab[ED === 'es' ? 1 : 0]));
      for (const m of ms) list.append(item(ED === 'es' ? m.es || m.n : m.n, ED === 'es' ? m.n : m.es, m.p, m.d, true));
    }
    for (const c of BL.REG.classes.filter(c => !c.hidden)) {
      const ms = (c.methods || []).filter(m => match(m.n, m.es, m.d, c.n, c.es));
      if (!ms.length && !match(c.n, c.es)) continue;
      list.append(h('div', { class: 'refCat' }, `${BL.kwName('class', ED)} ${ED === 'es' ? c.es || c.n : c.n}`));
      list.append(item(BL.kwName('new', ED) + ' ' + (ED === 'es' ? c.es || c.n : c.n), '', c.initP || '', ED === 'es' ? 'Crea un objeto de esta clase.' : 'Creates an object of this class.'));
      for (const m of ms) list.append(item(ED === 'es' ? m.es || m.n : m.n, ED === 'es' ? m.n : m.es, m.p, m.d, true));
      if (c.attrs) list.append(h('div', { class: 'muted small', style: 'padding:4px 0' }, (ED === 'es' ? 'Atributos: ' : 'Attributes: ') + c.attrs.map(a => ED === 'es' ? a.es : a.n).join(', ')));
    }
    if (!list.children.length) list.append(h('div', { class: 'empty' }, '–'));
  };
  q.addEventListener('input', draw);
  tab.append(q, list); draw();
}
