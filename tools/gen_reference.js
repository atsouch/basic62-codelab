// Generates docs/language-reference.md from the engine itself, so the reference always
// matches what is implemented. Run after `python build.py`:  node tools/gen_reference.js
const fs = require('fs');
const path = require('path');
const BL = require('../dist/core.js');

const out = [];
const P = (s = '') => out.push(s);
const cell = (s) => String(s === undefined || s === null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

P('# BASIC62 language reference');
P();
P('This reference is generated from the BASIC62 CodeLab engine source (`node tools/gen_reference.js`), so it lists exactly what the current build implements. Names are given for both editions: English and Spanish.');
P();
P('## Keywords');
P();
P('Keywords are not case-sensitive (`print`, `Print` and `PRINT` all work); the Spanish single-letter operators `Y` and `O` must be written in capitals. Variable and function names are case-sensitive.');
P();
P('| English | Spanish |');
P('| --- | --- |');
for (const k of Object.keys(BL.KW)) P(`| \`${cell(BL.KW[k][0])}\` | \`${cell(BL.KW[k][1])}\` |`);
P();
P('## Block structure');
P();
P('```');
P('IF condition THEN ... ELSE IF condition THEN ... ELSE ... END IF');
P('REPEAT n TIMES ... END REPEAT');
P('FOR i FROM a TO b [STEP s] ... END FOR        # both ends included');
P('FOR EACH x IN list_text_or_dictionary ... END FOR');
P('WHILE condition ... END WHILE');
P('FUNCTION name(a, b = default) ... RETURN value ... END FUNCTION');
P('CLASS Name [EXTENDS Parent] INIT(...) ... END INIT  FUNCTION method() ... END FUNCTION END CLASS');
P('TRY ... ON ERROR [message] ... END TRY');
P('TEST "name" [WITH INPUTS [...]] EXPECT condition  EXPECT ERROR call CONTAINS "text" END TEST');
P('DOC  PURPOSE: ...  INPUTS: ...  RETURNS: ...  EXAMPLE: call -> result  END DOC');
P('```');
P();
P('DOC block fields: ' + Object.keys(BL.DOC_FIELDS).map(k => `\`${BL.DOC_FIELDS[k][0]}\` / \`${BL.DOC_FIELDS[k][1]}\``).join(', ') + '.');
P();
const cats = { core: 'Core', text: 'Text', graphics: 'Turtle and drawing', ui: 'Screen controls', web: 'Web data (offline samples)', data: 'Data tools and charts', network: 'Simulated network', security: 'Security', testing: 'Testing' };
P(`## Built-in functions (${BL.REG.builtins.length})`);
for (const c of Object.keys(cats)) {
  const bs = BL.REG.builtins.filter(b => b.cat === c);
  if (!bs.length) continue;
  P();
  P(`### ${cats[c]}`);
  P();
  P('| Function | Spanish | Description |');
  P('| --- | --- | --- |');
  for (const b of bs) P(`| \`${cell(b.n)}(${cell(b.p)})\` | \`${cell(b.es || b.n)}\` | ${cell(b.d)} |`);
}
for (const [grp, title] of [[BL.REG.text, 'Text methods'], [BL.REG.list, 'List methods'], [BL.REG.dict, 'Dictionary methods']]) {
  P();
  P(`## ${title} (${grp.length})`);
  P();
  P('| Method | Spanish | Description |');
  P('| --- | --- | --- |');
  for (const m of grp) P(`| \`.${cell(m.n)}(${cell(m.p || '')})\` | \`.${cell(m.es || m.n)}\` | ${cell(m.d)} |`);
}
P();
P('## Built-in classes');
for (const c of BL.REG.classes.filter(x => !x.hidden)) {
  P();
  P(`### ${c.n} (\`${c.es || c.n}\`)`);
  P();
  P(`Create with \`NEW ${c.n}(${c.initP || ''})\`.` + (c.attrs && c.attrs.length ? ' Attributes: ' + c.attrs.map(a => `\`${a.n}\``).join(', ') + '.' : ''));
  if (c.methods && c.methods.length) {
    P();
    P('| Method | Spanish | Description |');
    P('| --- | --- | --- |');
    for (const m of c.methods) P(`| \`.${cell(m.n)}(${cell(m.p || '')})\` | \`.${cell(m.es || m.n)}\` | ${cell(m.d)} |`);
  }
}
P();
P(`## Error messages (${Object.keys(BL.MSG).length})`);
P();
P('Placeholders in braces are filled in with names and values from the student\'s own program.');
P();
P('| Code | English message | Spanish message |');
P('| --- | --- | --- |');
for (const k of Object.keys(BL.MSG)) {
  const m = BL.MSG[k];
  P(`| ${k} | ${cell(Array.isArray(m) ? m[0] : m)} | ${cell(Array.isArray(m) ? m[1] : '')} |`);
}
P();
P('## Built-in samples');
P();
P('Programs read these offline sources by name, so lessons work without internet access and every student sees the same data.');
P();
P('- CSV datasets: ' + Object.keys(BL.SAMPLES.csv).map(k => `\`sample:${k}\``).join(', '));
P('- Web API samples for `get_json` / `post_json`: ' + Object.keys(BL.SAMPLES.web).map(k => `\`sample:${k}\``).join(', '));
P('- Networks for `load_network`: ' + Object.keys(BL.SAMPLES.networks).map(k => `\`sample:${k}\``).join(', '));
P('- Example programs: ' + BL.SAMPLES.examples.map(e => e.title).join('; '));
P();
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'language-reference.md'), out.join('\n'));
console.log('docs/language-reference.md written,', out.length, 'lines');
