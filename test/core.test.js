const BL = require('../dist/core.js');
let pass = 0, fail = 0;
const fails = [];
function mkHost(log) {
  return Object.assign({}, BL.NULL_HOST, { print: (t) => log.push(t), table: (rows) => log.push('[table ' + rows.length + ']'), note: (t) => log.push('note: ' + t) });
}
function run(src, opts) {
  opts = opts || {};
  const log = [];
  let prog;
  try { prog = BL.parse(src, opts.ed || 'en'); } catch (e) { return { out: log, err: e, text: BL.errText(e, opts.ed || 'en'), phase: 'parse' }; }
  let r;
  try { r = new BL.Runner(prog, mkHost(log), { inputs: opts.inputs, test: !!opts.inputs, files: opts.files, noGuard: true }); }
  catch (e) { return { out: log, err: e, text: BL.errText(e, prog.ed), phase: 'define' }; }
  r.start();
  const st = r.runSync();
  return { out: log, err: r.error, text: r.error ? BL.errText(r.error, prog.ed) : '', state: st, r };
}
function t(name, fn) {
  try { fn(); pass++; } catch (e) { fail++; fails.push(name + ': ' + e.message); }
}
function eqOut(src, expected, opts) {
  const res = run(src, opts);
  if (res.err) throw new Error('error ' + (res.err.code || '') + ' ' + res.text + ' (line ' + (res.err.line) + ')');
  const got = res.out.join('\n');
  if (got !== expected) throw new Error('expected\n' + JSON.stringify(expected) + '\ngot\n' + JSON.stringify(got));
}
function errCode(src, code, opts, contains) {
  const res = run(src, opts);
  if (!res.err) throw new Error('expected error ' + code + ', got output ' + JSON.stringify(res.out));
  if (res.err.code !== code) throw new Error('expected ' + code + ' got ' + res.err.code + ': ' + res.text);
  if (contains && !res.text.includes(contains)) throw new Error('message "' + res.text + '" lacks "' + contains + '"');
  return res;
}

// ---------- basics ----------
t('print', () => eqOut('PRINT "Hello", 3, 2.5, TRUE, NOTHING', 'Hello 3 2.5 TRUE NOTHING'));
t('arith whole', () => eqOut('PRINT 7 + 3 * 2, 7 DIV 2, 7 MOD 3, -7 MOD 3, 2 ^ 10', '13 3 1 2 1024'));
t('division decimal', () => eqOut('PRINT 7 / 2, 4 / 2, 0.1 + 0.2', '3.5 2.0 0.30000000000000004'));
t('power precedence', () => eqOut('PRINT -2 ^ 2, 2 ^ 3 ^ 2', '-4 512'));
t('text concat', () => eqOut('x = "a" + "b"\nPRINT x * 3', 'ababab'));
t('mixed add error', () => errCode('age = 5\nPRINT "Age: " + age', 'E202', null, 'text(age)'));
t('div zero', () => errCode('PRINT 5 / 0', 'E210'));
t('unknown name suggestion', () => errCode('score = 5\nPRINT scroe', 'E201', null, 'score'));
t('case sensitive', () => errCode('Score = 1\nPRINT score', 'E201'));
t('keywords case-insensitive', () => eqOut('if 1 < 2 then\n  print "yes"\nend if', 'yes'));
t('if elseif else', () => eqOut('FOR x FROM 1 TO 3\n IF x == 1 THEN\n  PRINT "one"\n ELSE IF x == 2 THEN\n  PRINT "two"\n ELSE\n  PRINT "many"\n END IF\nEND FOR', 'one\ntwo\nmany'));
t('assign in if', () => errCode('x = 1\nIF x = 1 THEN\nPRINT x\nEND IF', 'E107'));
t('missing then', () => errCode('IF 1 < 2\nPRINT 1\nEND IF', 'E106'));
t('wrong closer', () => errCode('WHILE TRUE\n PRINT 1\nEND FOR', 'E102', null, 'END WHILE'));
t('unclosed inner', () => { const r = errCode('FOR i FROM 1 TO 2\n IF i == 1 THEN\n  PRINT i\nEND FOR', 'E101'); if (r.err.line !== 2) throw new Error('line ' + r.err.line); });
t('unclosed eof', () => errCode('REPEAT 3 TIMES\n PRINT 1', 'E101'));
t('bare end', () => errCode('IF TRUE THEN\nPRINT 1\nEND', 'E108'));
t('stray end', () => errCode('PRINT 1\nEND IF', 'E109'));
t('unterminated string', () => errCode('PRINT "abc', 'E103'));
t('bad char', () => errCode('x = 5 $ 3', 'E104'));
t('non bool condition', () => errCode('IF 5 THEN\nPRINT 1\nEND IF', 'E230'));
t('while', () => eqOut('n = 0\nWHILE n < 3\n n = n + 1\nEND WHILE\nPRINT n', '3'));
t('repeat', () => eqOut('c = 0\nREPEAT 4 TIMES\n c += 2\nEND REPEAT\nPRINT c', '8'));
t('for step', () => eqOut('s = []\nFOR i FROM 10 TO 1 STEP -3\n s.add(i)\nEND FOR\nPRINT s', '[10, 7, 4, 1]'));
t('for inclusive', () => eqOut('t = 0\nFOR i FROM 1 TO 5\n t += i\nEND FOR\nPRINT t', '15'));
t('for decimal step', () => eqOut('FOR x FROM 0 TO 1 STEP 0.25\n PRINT x\nEND FOR', '0.0\n0.25\n0.5\n0.75\n1.0'));
t('for each list text dict', () => eqOut('FOR EACH c IN "ab"\n PRINT c\nEND FOR\nd = {"x": 1, "y": 2}\nFOR EACH k IN d\n PRINT k, d[k]\nEND FOR', 'a\nb\nx 1\ny 2'));
t('break continue', () => eqOut('FOR i FROM 1 TO 10\n IF i MOD 2 == 0 THEN\n  CONTINUE\n END IF\n IF i > 7 THEN\n  BREAK\n END IF\n PRINT i\nEND FOR', '1\n3\n5\n7'));
t('break outside', () => errCode('BREAK', 'E118'));
t('and or not strict', () => eqOut('PRINT TRUE AND NOT FALSE, FALSE OR 1 > 0', 'TRUE TRUE'));
t('short circuit', () => eqOut('xs = []\nIF length(xs) > 0 AND xs[0] == 1 THEN\n PRINT "no"\nELSE\n PRINT "safe"\nEND IF', 'safe'));
t('in / not in', () => eqOut('PRINT 2 IN [1, 2], "ab" IN "cabd", "k" IN {"k": 1}, 5 NOT IN [1]', 'TRUE TRUE TRUE TRUE'));
t('compare mismatch', () => errCode('PRINT 5 < "a"', 'E225'));
t('chain compare error', () => errCode('PRINT 1 < 2 < 3', 'E105', null, 'AND'));
// ---------- functions ----------
t('function defaults', () => eqOut('FUNCTION greet(name, greeting = "Hello")\n RETURN greeting + ", " + name\nEND FUNCTION\nPRINT greet("Ana")\nPRINT greet("Ana", "Hi")', 'Hello, Ana\nHi, Ana'));
t('hoisting', () => eqOut('PRINT double(4)\nFUNCTION double(x)\n RETURN x * 2\nEND FUNCTION', '8'));
t('recursion', () => eqOut('FUNCTION fact(n)\n IF n <= 1 THEN\n  RETURN 1\n END IF\n RETURN n * fact(n - 1)\nEND FUNCTION\nPRINT fact(10)', '3628800'));
t('recursion limit', () => errCode('FUNCTION f(n)\n RETURN f(n + 1)\nEND FUNCTION\nPRINT f(1)', 'E213'));
t('arity', () => errCode('FUNCTION f(a, b)\n RETURN a\nEND FUNCTION\nPRINT f(1)', 'E208', null, '2 values'));
t('global read ok', () => eqOut('rate = 2\nFUNCTION f(x)\n RETURN x * rate\nEND FUNCTION\nPRINT f(5)', '10'));
t('global write error', () => errCode('score = 0\nFUNCTION add_point()\n score = score + 1\nEND FUNCTION\nadd_point()', 'E211', null, 'RETURN'));
t('local var', () => eqOut('FUNCTION f()\n y = 3\n RETURN y\nEND FUNCTION\nPRINT f()', '3'));
t('nothing arithmetic hint', () => errCode('FUNCTION f(x)\n y = x * 2\nEND FUNCTION\nPRINT f(3) + 1', 'E212', null, 'f(3)'));
t('functions as values', () => eqOut('FUNCTION sq(x)\n RETURN x * x\nEND FUNCTION\nFUNCTION apply(f, v)\n RETURN f(v)\nEND FUNCTION\nPRINT apply(sq, 7)', '49'));
t('return outside', () => errCode('RETURN 5', 'E117'));
t('nested function', () => errCode('IF TRUE THEN\n FUNCTION f()\n END FUNCTION\nEND IF', 'E112'));
t('call class without new', () => errCode('CLASS A\nEND CLASS\nx = A()', 'E226'));
// ---------- data structures ----------
t('list ops', () => eqOut('xs = [3, 1, 2]\nxs.add(5)\nxs.insert(0, 9)\nxs.remove(1)\nPRINT xs, xs.find(2), xs.find(99), length(xs)\nxs.sort()\nPRINT xs, xs[-1], xs[1:3]\nPRINT xs.remove_at(0), xs', '[9, 3, 2, 5] 2 -1 4\n[2, 3, 5, 9] 9 [3, 5]\n2 [3, 5, 9]'));
t('index error', () => errCode('scores = [1, 2, 3]\nPRINT scores[3]', 'E204', null, 'positions 0 to 2'));
t('dict ops', () => eqOut('d = {"a": 1}\nd["b"] = 2\nPRINT d, d.get("z", 0), d.keys(), d.values()\nd.remove("a")\nPRINT d, length(d)', '{"a": 1, "b": 2} 0 ["a", "b"] [1, 2]\n{"b": 2} 1'));
t('missing key', () => errCode('d = {"a": 1}\nPRINT d["zz"]', 'E205', null, '"a"'));
t('references', () => eqOut('a = [1]\nb = a\nb.add(2)\nc = copy(a)\nc.add(3)\nPRINT a, c', '[1, 2] [1, 2, 3]'));
t('comprehension', () => eqOut('PRINT [x * x FOR x IN [1, 2, 3, 4] IF x MOD 2 == 0]', '[4, 16]'));
t('text methods', () => eqOut('s = "  Hello World  "\nPRINT s.trim().upper(), s.trim().split(), "a,b".split(","), "hello".find("l"), "banana".count("an")\nPRINT "abc".contains("b"), "12".is_digits(), " -3.5 ".is_number(), "x".pad_left(3, "*"), "the cat".title(), "ab".repeat(2), "a-b".replace("-", "+")', 'HELLO WORLD ["Hello", "World"] ["a", "b"] 2 2\nTRUE TRUE TRUE **x The Cat abab a+b'));
t('text immutable', () => errCode('s = "abc"\ns[0] = "x"', 'E224'));
t('sort mixed', () => errCode('xs = [1, "a"]\nxs.sort()', 'E222'));
t('conversions', () => eqOut('PRINT whole("42") + 1, decimal("2.5"), whole(3.9), text(5) + "!", round(2.5), round(3.5), round(3.14159, 2), type(1), type(1.0), type("x"), type([]), type({})', '43 2.5 3 5! 2 4 3.14 whole number decimal number text list dictionary'));
t('conversion error', () => errCode('PRINT whole("abc")', 'E215'));
t('min max sum', () => eqOut('PRINT min([4, 2, 8]), max(3, 9), sum([1, 2, 3.5]), abs(-4), sqrt(16)', '2 9 6.5 4 4.0'));
t('join code char format', () => eqOut('PRINT join([1, 2, 3], "-"), code_of("A"), char_of(97), format(3.14159, 2)', '1-2-3 65 a 3.14'));
t('json', () => eqOut('d = from_json("{\\"a\\": [1, 2.5, true, null]}")\nPRINT d, to_json({"x": [1, "y"]})', '{"a": [1, 2.5, TRUE, NOTHING]} {"x":[1,"y"]}'));
t('random seeded', () => { const a = run('random_seed(3)\nPRINT random(1, 100), random(1, 100)').out[0]; const b = run('random_seed(3)\nPRINT random(1, 100), random(1, 100)').out[0]; if (a !== b) throw new Error(a + ' vs ' + b); });
// ---------- OOP ----------
const PETS = 'CLASS Pet\n INIT(name)\n  SELF.name = name\n  SELF.energy = 5\n END INIT\n FUNCTION play()\n  SELF.energy = SELF.energy - 2\n END FUNCTION\n FUNCTION describe()\n  RETURN SELF.name + " (" + text(SELF.energy) + ")"\n END FUNCTION\nEND CLASS\nCLASS Dog EXTENDS Pet\n INIT(name, breed)\n  PARENT.INIT(name)\n  SELF.breed = breed\n END INIT\n FUNCTION play()\n  PARENT.play()\n  SELF.energy = SELF.energy - 1\n END FUNCTION\nEND CLASS\n';
t('oop basics', () => eqOut(PETS + 'p = NEW Pet("Milo")\nd = NEW Dog("Rex", "collie")\np.play()\nd.play()\nPRINT p\nPRINT d, d.breed, is_a(d, Pet), is_a(p, Dog), type(d)', 'Milo (3)\nRex (2) collie TRUE FALSE Dog'));
t('oop describe in list uses default', () => eqOut(PETS + 'PRINT [NEW Pet("A")]', '[Pet(name="A", energy=5)]'));
t('new attr outside init', () => errCode(PETS + 'p = NEW Pet("M")\np.enrgy = 3', 'E206', null, 'energy'));
t('unknown method', () => errCode(PETS + 'p = NEW Pet("M")\np.jump()', 'E207'));
t('self outside', () => errCode('PRINT SELF.x', 'E121'));
t('init arity', () => errCode(PETS + 'p = NEW Pet()', 'E208'));
t('class extends unknown', () => errCode('CLASS A EXTENDS Zzz\nEND CLASS', 'E201'));
t('new non-class', () => errCode('x = 5\ny = NEW x()', 'E223'));
t('inherited init', () => eqOut('CLASS A\n INIT(v)\n  SELF.v = v\n END INIT\nEND CLASS\nCLASS B EXTENDS A\n FUNCTION twice()\n  RETURN SELF.v * 2\n END FUNCTION\nEND CLASS\nPRINT NEW B(4).twice()', '8'));
t('class body statement', () => errCode('CLASS A\n x = 1\nEND CLASS', 'E119'));
// ---------- try / fail ----------
t('try on error', () => eqOut('TRY\n x = whole("abc")\nON ERROR problem\n PRINT "Oops:", problem.contains("abc")\nEND TRY', 'Oops: TRUE'));
t('fail message', () => errCode('FUNCTION f(x)\n IF x < 0 THEN\n  FAIL "x must not be negative"\n END IF\nEND FUNCTION\nf(-1)', 'E214', null, 'x must not be negative'));
t('try fail catch', () => eqOut('TRY\n FAIL "boom"\nON ERROR e\n PRINT e\nEND TRY', 'boom'));
// ---------- ask ----------
t('ask scripted', () => eqOut('n = ASK("Name?")\nPRINT "Hi " + n', 'Hi Zoe', { inputs: ['Zoe'] }));
t('ask pause', () => { const prog = BL.parse('a = ASK("Q?")\nPRINT a', 'en'); const log = []; const r = new BL.Runner(prog, mkHost(log), {}); r.start(); const st = r.runSlice(50); if (st !== 'ask' || r.askPrompt !== 'Q?') throw new Error(st); r.answer('yes'); r.runSlice(50); if (log[0] !== 'yes') throw new Error(log.join()); });
// ---------- stepping ----------
t('step into over out', () => {
  const src = 'FUNCTION f(x)\n y = x + 1\n RETURN y\nEND FUNCTION\na = f(1)\nb = 2\nPRINT a + b';
  const prog = BL.parse(src, 'en'); const r = new BL.Runner(prog, BL.NULL_HOST, {}); r.start();
  r.pauseMode = { kind: 'into' }; let st = r.runSlice(50); if (st !== 'paused' || r.pausedNode.line !== 5) throw new Error('first ' + st + ' ' + (r.pausedNode && r.pausedNode.line));
  r.pauseMode = { kind: 'into' }; r.resume(); st = r.runSlice(50); if (r.pausedNode.line !== 2 || r.stack.length !== 2) throw new Error('into ' + r.pausedNode.line);
  r.pauseMode = { kind: 'out', depth: r.stack.length }; r.resume(); st = r.runSlice(50); if (r.pausedNode.line !== 6) throw new Error('out ' + r.pausedNode.line);
  r.pauseMode = { kind: 'over', depth: r.stack.length }; r.resume(); st = r.runSlice(50); if (r.pausedNode.line !== 7) throw new Error('over ' + r.pausedNode.line);
});
t('breakpoint condition', () => {
  const prog = BL.parse('FOR i FROM 1 TO 10\n x = i * 2\nEND FOR', 'en');
  const r = new BL.Runner(prog, BL.NULL_HOST, { breakpoints: new Map([[2, { src: 'i == 7' }]]) }); r.start();
  const st = r.runSlice(50); if (st !== 'paused' || r.globals.get('i') !== 7) throw new Error(st + ' ' + r.globals.get('i'));
});
t('watch eval', () => { const prog = BL.parse('xs = [1, 2, 3]\nPRINT 1', 'en'); const r = new BL.Runner(prog, BL.NULL_HOST, {}); r.start(); r.pauseMode = { kind: 'line', line: 2 }; r.runSlice(50); const v = r.evalWatch('length(xs) * 2'); if (v !== 6) throw new Error(v); });
t('trace', () => { const prog = BL.parse('a = 1\nb = a + 1', 'en'); const r = new BL.Runner(prog, BL.NULL_HOST, { trace: true }); r.start(); r.runSync(); if (r.trace.length !== 2 || r.trace[1].vars.a !== '1') throw new Error(JSON.stringify(r.trace)); });
t('steps builtin', () => eqOut('s = steps()\nx = 1\ny = 2\nPRINT steps() - s', '3'));
t('infinite loop guard maxSteps', () => { const prog = BL.parse('WHILE TRUE\nEND WHILE', 'en'); const r = new BL.Runner(prog, BL.NULL_HOST, { maxSteps: 1000 }); r.start(); const st = r.runSync(); if (st !== 'error' || r.error.code !== 'E231') throw new Error(st); });
t('empty loop yields', () => { const prog = BL.parse('WHILE TRUE\nEND WHILE', 'en'); const r = new BL.Runner(prog, BL.NULL_HOST, {}); r.start(); const t0 = Date.now(); const st = r.runSlice(30); if (st !== 'running' || Date.now() - t0 > 500) throw new Error(st); });
// ---------- graphics host calls ----------
t('turtle math', () => {
  const lines = []; const host = Object.assign({}, BL.NULL_HOST, { gfx: { line: (...a) => lines.push(a.slice(0, 4).map(v => Math.round(v))), turtle() {}, circle() {}, rect() {}, text() {}, clear() {}, chart() {}, network() {} } });
  const prog = BL.parse('forward(100)\nturn(90)\nforward(50)', 'en'); const r = new BL.Runner(prog, host, {}); r.start(); r.runSync();
  if (JSON.stringify(lines) !== JSON.stringify([[0, 0, 100, 0], [100, 0, 100, -50]])) throw new Error(JSON.stringify(lines));
});
// ---------- data ----------
t('csv load clean', () => eqOut('rows = load_csv("sample:students")\nPRINT length(rows), length(dedupe(rows)), length(drop_missing(rows, "score"))\nPRINT rows[0]["score"] + 1, type(rows[0]["name"])', '30 29 26\n89 text'));
t('summarize', () => eqOut('rows = [{"v": 1}, {"v": 2}, {"v": 3}, {"v": ""}]\ns = summarize(rows, "v")\nPRINT s["count"], s["sum"], s["mean"], s["median"], s["min"], s["max"]', '3 6 2.0 2 1 3'));
t('sort_by where group count', () => eqOut('r = [{"n": "a", "g": 7, "s": 50}, {"n": "b", "g": 8, "s": 90}, {"n": "c", "g": 7, "s": 70}]\nPRINT column(sort_by(r, "s", "desc"), "n"), length(where(r, "s", ">=", 70)), count_by(r, "g"), group_by(r, "g")[7][1]["n"]', '["b", "c", "a"] 2 {7: 2, 8: 1} c'));
t('column name error', () => errCode('r = [{"score": 1}]\nPRINT column(r, "scor")', 'E219', null, 'score'));
t('filter_rows fn', () => eqOut('FUNCTION big(row)\n RETURN row["s"] > 60\nEND FUNCTION\nr = [{"s": 50}, {"s": 70}]\nPRINT length(filter_rows(r, big))', '1'));
t('stats', () => eqOut('PRINT mean([1, 2, 3, 4]), median([5, 1, 3]), mode(["a", "b", "a"]), round(stdev([2, 4, 4, 4, 5, 5, 7, 9]), 3)', '2.5 3 a 2.138'));
t('text data', () => eqOut('PRINT clean_text("  a   b\\n c "), remove_punctuation("Hi, there!"), words("The cat, THE hat"), word_counts("a b a"), to_number("x", 0), to_number("3.5", 0)', 'a b c Hi there ["the", "cat", "the", "hat"] {"a": 2, "b": 1} 0 3.5'));
t('files', () => { const files = new Map([['main.bl', ''], ['notes.txt', 'hello']]); eqOut('PRINT load_text("notes.txt")\nsave_csv("out.csv", [{"a": 1, "b": "x,y"}])\nPRINT load_text("out.csv")\nPRINT list_files()', 'hello\na,b\n1,"x,y"\n["notes.txt", "out.csv"]', { files }); });
t('missing file', () => errCode('PRINT load_text("nope.txt")', 'E221'));
t('web sample', () => eqOut('d = get_json("sample:weather/lima")\nPRINT d["city"], length(d["hourly"]["temperature_2m"])\nc = get_json("sample:countries")\nPRINT c[0]["name"], length(c)', 'lima 24\nGreece 12'));
t('web offline', () => errCode('d = get_json("https://api.open-meteo.com/v1/forecast")', 'E220'));
t('post echo', () => eqOut('PRINT post_json("sample:echo", {"a": 1})["received"]', '{"a": 1}'));
t('charts note', () => { const r = run('bar_chart(["a", "b"], [3, 5], "T")'); if (!r.out[0].includes('highest is b')) throw new Error(r.out.join()); });
// ---------- network ----------
t('network basic', () => eqOut('net = NEW Network()\na = net.add_device("a", "10.0.0.1")\nb = net.add_router("r", "10.0.0.254")\nc = net.add_server("s", "10.0.1.1")\nnet.connect(a, b, 2)\nnet.connect("r", "s", 3)\nnet.add_dns("site.example", "10.0.1.1")\nPRINT net.route("a", "site.example"), net.ping("a", "s"), net.lookup("site.example")\nrep = net.send("a", "s", "hello world", 4)\nPRINT rep["delivered"], rep["packets"], rep["message"]', '["a", "r", "s"] 10 10.0.1.1\nTRUE 3 hello world'));
t('network sample + firewall', () => {
  const src = BL.SAMPLES.examples.find(e => e.id === 'network').code;
  const r = run(src);
  if (r.err) throw new Error(r.text + ' line ' + r.err.line);
  const out = r.out.join('\n');
  if (!out.includes('Hello from the laptop!')) throw new Error(out);
  if (!out.includes('Delivered: FALSE blocked:')) throw new Error(out);
  if (!out.includes('200 Mon: Maths')) throw new Error(out);
});
t('network loss fast', () => eqOut('net = NEW Network()\nnet.add_device("a", "10.0.0.1")\nnet.add_device("b", "10.0.0.2")\nnet.connect("a", "b")\nnet.set_loss(1)\nr = net.send("a", "b", "abcdef", 2, "fast")\nPRINT r["delivered"], r["lost"], r["message"]', 'FALSE 3 ???'));
t('packets helpers', () => eqOut('p = split_into_packets("abcdefg", 3)\nPRINT length(p), p[2]["data"]\np.reverse()\nPRINT reassemble(p), is_valid_ip("192.168.1.300"), same_subnet("10.0.0.1", "10.0.0.9")', '3 g\nabcdefg FALSE TRUE'));
t('bad ip', () => errCode('net = NEW Network()\nnet.add_device("a", "1.2.3")', 'E219'));
// ---------- security ----------
t('sha256', () => { if (BL.sha256('abc') !== 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad') throw new Error('sha'); if (BL.sha256('') !== 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855') throw new Error('empty'); if (BL.sha256('héllo ✓').length !== 64) throw new Error('len'); });
t('ciphers', () => eqOut('PRINT caesar("Hello, World", 3), caesar(caesar("Zebra", 5), -5), vigenere("ATTACKATDAWN", "LEMON"), vigenere_decrypt("LXFOPVEFRNHR", "LEMON")', 'Khoor, Zruog Zebra LXFOPVEFRNHR ATTACKATDAWN'));
t('freq', () => eqOut('PRINT letter_frequencies("aab c")', '{"A": 2, "B": 1, "C": 1}'));
t('password', () => eqOut('p = password_strength("qwerty")\nq = password_strength("Tr0ub4dor&3xyz!")\nPRINT p["score"], p["common"], q["score"], q["has_symbols"]', '0 TRUE 4 TRUE'));
t('brute force', () => eqOut('r = brute_force_demo(hash_text("cab"), "abc", 3)\nPRINT r["found"], r["attempts"]', 'Length 1: 3 candidates tried, 3 attempts so far.\nLength 2: 9 candidates tried, 12 attempts so far.\nLength 3: found after 32 attempts.\ncab 32'));
t('rsa', () => eqOut('k = make_toy_keys()\nPRINT toy_decrypt(toy_encrypt("Hola ñ!", k["public"]), k["private"])', 'Hola ñ!'));
t('access policy', () => eqOut('p = NEW AccessPolicy()\np.allow("teacher", "edit", "grades")\np.allow("student", "read", "*")\nPRINT p.can("teacher", "edit", "grades"), p.can("student", "edit", "grades"), p.can("student", "read", "x"), length(p.rules())', 'TRUE FALSE TRUE 2'));
// ---------- UI widgets with stub host ----------
t('widgets', () => {
  const made = []; const host = Object.assign({}, BL.NULL_HOST, { print() {}, ui: { create: (k, p) => { made.push([k, p]); return made.length - 1; }, update: (h, prop, v) => { made[h][1][prop] = v; }, read: (h, prop) => made[h][1][prop], bind() {} } });
  const prog = BL.parse('b = button("Go")\nl = label("x")\nl.text = "changed"\nn = number_box()\nPRINT l.text, n.value, b.enabled\nb.enabled = FALSE', 'en');
  const r = new BL.Runner(prog, host, {}); r.start(); r.runSync();
  if (r.error) throw new Error(BL.errText(r.error, 'en'));
  if (made[1][1].text !== 'changed' || made[0][1].enabled !== false) throw new Error(JSON.stringify(made));
});
t('events after main', () => {
  let cb; const host = Object.assign({}, BL.NULL_HOST, { print() {}, ui: { create: () => 0, update() {}, read: () => '', bind: (h, ev, f) => { cb = f; } } });
  const prog = BL.parse('count = 0\nb = button("Go")\nFUNCTION hit()\n PRINT "hit"\nEND FUNCTION\non_click(b, hit)', 'en');
  const log = []; host.print = (t) => log.push(t);
  const r = new BL.Runner(prog, host, {}); r.start(); let st = r.runSlice(50); if (st !== 'events') throw new Error(st);
  cb(); st = r.runSlice(50); if (log[0] !== 'hit' || st !== 'events') throw new Error(st + log);
});
// ---------- Spanish edition ----------
t('spanish program', () => eqOut('nombre = "Ana"\nSI longitud(nombre) > 2 ENTONCES\n MOSTRAR "Hola, " + nombre\nSINO SI VERDADERO ENTONCES\n MOSTRAR "x"\nFIN SI\nPARA i DESDE 3 HASTA 1 CON PASO -1\n MOSTRAR i\nFIN PARA\nPARA CADA c EN ["a"]\n MOSTRAR c.mayusculas()\nFIN PARA\nx = 5\ny = 2\nMOSTRAR x > 1 Y y < 3, x DIV y, x MOD y, NO FALSO', 'Hola, Ana\n3\n2\n1\nA\nVERDADERO 2 1 VERDADERO', { ed: 'es' }));
t('spanish class ok', () => eqOut('CLASE Mascota\n INICIAR(n)\n  ESTE.n = n\n FIN INICIAR\n FUNCIÓN describir()\n  DEVOLVER "M:" + ESTE.n\n FIN FUNCIÓN\nFIN CLASE\nm = NUEVO Mascota("Rex")\nMOSTRAR m\nINTENTAR\n FALLAR "mal"\nSI FALLA e\n MOSTRAR e\nFIN INTENTAR', 'M:Rex\nmal', { ed: 'es' }));
t('spanish error message', () => { const r = run('MOSTRAR "Edad: " + 5', { ed: 'es' }); if (!r.text.includes('No puedes sumar texto')) throw new Error(r.text); });
t('spanish firewall override', () => eqOut('CLASE Muro EXTIENDE Dispositivo\n FUNCIÓN al_recibir_paquete(p)\n  DEVOLVER FALSO\n FIN FUNCIÓN\nFIN CLASE\nred = NUEVO Red()\nred.agregar_dispositivo("a", "10.0.0.1")\nm = NUEVO Muro("m", "10.0.0.2")\nred.agregar(m)\nred.agregar_dispositivo("b", "10.0.0.3")\nred.conectar("a", "m")\nred.conectar("m", "b")\nr = red.enviar("a", "b", "hola")\nMOSTRAR r["delivered"], r["blocked"]', 'FALSO 1', { ed: 'es' }));
t('lowercase y variable in es', () => eqOut('x = 1\ny = 2\nMOSTRAR x + y', '3', { ed: 'es' }));
// ---------- tests runner ----------
t('runTests grades', () => {
  const src = BL.SAMPLES.examples.find(e => e.id === 'grades').code;
  const prog = BL.parse(src, 'en');
  const res = BL.runTests(prog, {});
  const bad = res.results.filter(r => !r.passed);
  if (bad.length) throw new Error(JSON.stringify(bad));
  if (res.results.length !== 4) throw new Error('count');
  if (!res.examples.length || !res.examples.every(e => e.ok)) throw new Error(JSON.stringify(res.examples));
});
t('runTests failing detail', () => {
  const prog = BL.parse('FUNCTION grade(s)\n IF s > 50 THEN\n  RETURN "pass"\n END IF\n RETURN "fail"\nEND FUNCTION\nTEST "b"\n EXPECT grade(50) == "pass"\nEND TEST\nTEST "loop"\n WHILE TRUE\n END WHILE\nEND TEST', 'en');
  const res = BL.runTests(prog, { maxSteps: 5000 });
  const c = res.results[0].checks[0];
  if (c.ok || !c.detail.includes('`grade(50)` gave `"fail"` but the test expected `"pass"`')) throw new Error(JSON.stringify(c));
  if (!res.results[1].error || res.results[1].error.code !== 'E231') throw new Error(JSON.stringify(res.results[1]));
});
t('plan warnings', () => {
  const prog = BL.parse(BL.SAMPLES.examples.find(e => e.id === 'grades').code, 'en');
  const w = BL.planWarnings(prog, [{ target: 'grade', kind: 'normal', test: 'normal scores' }], null);
  if (!w.some(x => x.text.includes('boundary'))) throw new Error(JSON.stringify(w));
  if (!w.some(x => x.text.includes('invalid-input'))) throw new Error(JSON.stringify(w));
});
t('doc checker', () => {
  const prog = BL.parse('DOC\n PURPOSE: x\n INPUTS: a (number), zz (text)\nEND DOC\nFUNCTION f(a, b)\n RETURN a\nEND FUNCTION', 'en');
  const w = BL.checkDocs(prog).map(x => x.text).join('\n');
  if (!w.includes('does not mention `b`') || !w.includes('lists `zz`') || !w.includes('no RETURNS')) throw new Error(w);
});
t('doc stray', () => errCode('DOC\n PURPOSE: x\nEND DOC\nPRINT 1', 'E122'));
// ---------- python ----------
t('python grades', () => {
  const py = BL.toPython(BL.parse(BL.SAMPLES.examples.find(e => e.id === 'grades').code, 'en'));
  for (const s of ['def grade(score):', 'raise ValueError("score must be 0 to 100")', 'while not answer.isdigit() or int(answer) > 100:', 'def test_boundary_at_50():', 'with pytest.raises(Exception, match=re.escape("0 to 100")):', 'def test_invalid_input_is_asked_again(monkeypatch, capsys):', 'if __name__ == "__main__":'])
    if (!py.includes(s)) throw new Error('missing ' + s + '\n' + py);
});
// ---------- edition conversion ----------
t('convert en->es->en', () => {
  for (const ex of BL.SAMPLES.examples) {
    const es = BL.convertEdition(ex.code, 'en', 'es');
    try { BL.parse(es.code, 'es'); } catch (e) { throw new Error(ex.id + ' es parse: ' + BL.errText(e, 'es') + ' line ' + e.line + '\n' + es.code.split('\n')[e.line - 1]); }
    const back = BL.convertEdition(es.code, 'es', 'en');
    if (back.code !== ex.code && !es.renamed.length) {
      const a = ex.code.split('\n'), b = back.code.split('\n');
      const i = a.findIndex((l, k) => l !== b[k]);
      throw new Error(ex.id + ' roundtrip differs at ' + (i + 1) + ':\n' + a[i] + '\n' + b[i]);
    }
  }
});
t('convert renames clash', () => { const r = BL.convertEdition('para = 3\nPRINT para', 'en', 'es'); if (!r.code.startsWith('para_ = 3') || !r.renamed.includes('para')) throw new Error(r.code); BL.parse(r.code, 'es'); });
// ---------- repo ----------
t('repo flow', () => {
  const R = new BL.Repo();
  let work = { 'main.bl': 'a\nb\nc' };
  const c1 = R.commit('first', work);
  work = { 'main.bl': 'a\nB\nc' };
  if (R.status(work)[0].state !== 'modified') throw new Error('status');
  const c2 = R.commit('second', work);
  R.branch('feature');
  R.switchTo('feature', work);
  work = { 'main.bl': 'a\nB\nc\nd' }; R.commit('add d', work);
  let threw = false; try { R.switchTo('main', { 'main.bl': 'changed' }); } catch (e) { threw = e.message === 'dirty'; }
  if (!threw) throw new Error('dirty switch allowed');
  const files = R.switchTo('main', work);
  if (files['main.bl'] !== 'a\nB\nc') throw new Error(files['main.bl']);
  if (R.log().length !== 3) throw new Error('log ' + R.log().length);
  if (R.diffFiles(R.filesAt(c1), R.filesAt(c2))[0].ops.filter(o => o.t !== ' ').length !== 2) throw new Error('diff');
});
t('repo merge + conflict', () => {
  const R = new BL.Repo();
  R.commit('base', { 'main.bl': 'x\ny\nz' });
  R.branch('f');
  R.commit('main change', { 'main.bl': 'x\nY-main\nz' });
  R.head = 'f';
  R.commit('f change', { 'main.bl': 'x\ny\nz\nw' });
  const m = R.merge('main', { 'main.bl': 'x\ny\nz\nw' });
  if (m.kind !== 'merged' || m.files['main.bl'] !== 'x\nY-main\nz\nw') throw new Error(JSON.stringify(m));
  R.commit('conflict side', { 'main.bl': 'x\nY-f\nz\nw' });
  R.head = 'main';
  R.commit('main again', { 'main.bl': 'x\nY-main2\nz' });
  const m2 = R.merge('f', { 'main.bl': 'x\nY-main2\nz' });
  if (m2.kind !== 'conflict') throw new Error(JSON.stringify(m2));
  const c = m2.conflicts[0];
  const txt = BL.mergedText(c.parts, (i) => c.chunks[i].ours.concat(c.chunks[i].theirs));
  if (txt !== 'x\nY-main2\nY-f\nz\nw') throw new Error(txt);
  R.finishMerge(m2, { 'main.bl': txt });
  if (R.headFiles()['main.bl'] !== txt) throw new Error('finish');
});
t('repo revert', () => {
  const R = new BL.Repo();
  R.commit('1', { 'main.bl': 'a' });
  const c2 = R.commit('2', { 'main.bl': 'a\nb' });
  R.commit('3', { 'main.bl': 'a\nb', 'x.csv': 'q' });
  const r = R.revert(c2, { 'main.bl': 'a\nb', 'x.csv': 'q' });
  if (r.kind !== 'reverted' || r.files['main.bl'] !== 'a' || r.files['x.csv'] !== 'q') throw new Error(JSON.stringify(r));
});
t('repo tag push', () => { const R = new BL.Repo(); R.commit('1', { 'main.bl': 'a' }); R.tag('v1'); if (R.resolve('v1') !== R.headId()) throw new Error('tag'); if (R.push() !== 1 || R.push() !== 0) throw new Error('push'); });
// ---------- all examples run ----------
for (const ex of BL.SAMPLES.examples) {
  t('example ' + ex.id, () => {
    const inputs = { hello: ['Sam', '12'], grades: ['abc', '77'] }[ex.id];
    const r = run(ex.code, { inputs });
    if (r.err) throw new Error(r.text + ' (line ' + r.err.line + ')');
    if (!['done', 'events'].includes(r.state)) throw new Error('state ' + r.state);
  });
  t('example es ' + ex.id, () => {
    const es = BL.convertEdition(ex.code, 'en', 'es').code;
    const inputs = { hello: ['Sam', '12'], grades: ['abc', '77'] }[ex.id];
    const r = run(es, { inputs, ed: 'es' });
    if (r.err) throw new Error(r.text + ' (line ' + r.err.line + ')\n' + es.split('\n')[r.err.line - 1]);
  });
}

console.log(`${pass} passed, ${fail} failed`);
if (fails.length) { console.log(fails.join('\n\n')); process.exit(1); }
