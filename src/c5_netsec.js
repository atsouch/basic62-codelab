// ===== Core part 5: simulated network and security =====
function sha256(str) {
  const bytes = new TextEncoder().encode(str);
  const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a, h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const l = bytes.length;
  const withPad = new Uint8Array(((l + 9 + 63) >> 6) << 6);
  withPad.set(bytes); withPad[l] = 0x80;
  const bits = l * 8;
  const dv = new DataView(withPad.buffer);
  dv.setUint32(withPad.length - 4, bits >>> 0); dv.setUint32(withPad.length - 8, Math.floor(bits / 4294967296));
  const w = new Uint32Array(64);
  for (let off = 0; off < withPad.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = ((w[i - 15] >>> 7) | (w[i - 15] << 25)) ^ ((w[i - 15] >>> 18) | (w[i - 15] << 14)) ^ (w[i - 15] >>> 3);
      const s1 = ((w[i - 2] >>> 17) | (w[i - 2] << 15)) ^ ((w[i - 2] >>> 19) | (w[i - 2] << 13)) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + w[i]) | 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0; h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
  }
  return [h0, h1, h2, h3, h4, h5, h6, h7].map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
}

// ---------- network ----------
function validIp(t) { return isText(t) && /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.test(t.trim()) && t.trim().split('.').every(x => +x >= 0 && +x <= 255); }
function isDevice(o) { if (!(o instanceof Obj)) return false; for (let c = o.cls; c; c = c.parent) if (c.native && c.name === 'Device') return true; return false; }
function netState(o) { return o.native; }
function devName(d) { return show(d.attrs.get('name'), 'en'); }
function logNet(N, event, from, to, detail) {
  N.logs.push(new Map([['time', Math.round(N.t)], ['event', event], ['from', from || ''], ['to', to || ''], ['detail', detail || '']]));
}
function resolveDev(ctx, N, v, allowDns) {
  if (isDevice(v)) {
    const n = devName(v);
    if (!N.devices.has(n)) throw E(ctx, `${n} is not part of this network. Use add first.`, `${n} no forma parte de esta red. Usa agregar primero.`);
    return N.devices.get(n);
  }
  if (isText(v)) {
    if (N.devices.has(v)) return N.devices.get(v);
    let ip = v;
    const hostOnly = v.replace(/^\w+:\/\//, '').split('/')[0];
    if (!validIp(hostOnly)) {
      if (!allowDns || !N.dns.has(hostOnly)) throw E(ctx, `I can't find a device or name "${v}" in the network.`, `No encuentro un dispositivo o nombre "${v}" en la red.`);
      ip = N.dns.get(hostOnly);
      logNet(N, 'dns', '', hostOnly, ip);
    } else ip = hostOnly;
    for (const d of N.devices.values()) if (d.attrs.get('ip') === ip) return d;
    throw E(ctx, `no device has the address ${ip}.`, `ningún dispositivo tiene la dirección ${ip}.`);
  }
  throw E(ctx, 'give a device, its name or its address.', 'da un dispositivo, su nombre o su dirección.');
}
function shortestPath(N, a, b) {
  const dist = new Map(), prev = new Map(), todo = new Set(N.devices.keys());
  for (const k of todo) dist.set(k, Infinity);
  dist.set(a, 0);
  while (todo.size) {
    let u = null, best = Infinity;
    for (const k of todo) if (dist.get(k) < best) { best = dist.get(k); u = k; }
    if (u === null) break;
    todo.delete(u);
    if (u === b) break;
    for (const [v, ms] of (N.adj.get(u) || new Map())) {
      const nd = dist.get(u) + ms;
      if (nd < dist.get(v)) { dist.set(v, nd); prev.set(v, u); }
    }
  }
  if (dist.get(b) === Infinity) return null;
  const path = [b];
  while (path[0] !== a) path.unshift(prev.get(path[0]));
  return path;
}
function linkMs(N, a, b) { return (N.adj.get(a) || new Map()).get(b) || 0; }
function makeDevice(r, kind, name, ip) {
  const cls = r.nativeNames.get('device');
  const o = new Obj(cls);
  o.attrs.set('name', name); o.attrs.set('ip', ip); o.attrs.set('kind', kind);
  o.native = { handler: null };
  return o;
}
function registerDevice(ctx, N, d) {
  const name = devName(d), ip = d.attrs.get('ip');
  if (!validIp(ip)) throw E(ctx, `"${ip}" is not a valid IP address such as 192.168.1.10.`, `"${ip}" no es una dirección IP válida como 192.168.1.10.`);
  if (N.devices.has(name)) throw E(ctx, `there is already a device called ${name}.`, `ya hay un dispositivo llamado ${name}.`);
  for (const x of N.devices.values()) if (x.attrs.get('ip') === ip) throw E(ctx, `the address ${ip} is already used by ${devName(x)}.`, `la dirección ${ip} ya la usa ${devName(x)}.`);
  N.devices.set(name, d); N.adj.set(name, new Map());
  if (!d.native) d.native = { handler: null };
  ctx.r.touch();
  return d;
}
function splitPackets(message, size, src, dst) {
  const chunks = [];
  for (let i = 0; i < message.length; i += size) chunks.push(message.slice(i, i + size));
  if (!chunks.length) chunks.push('');
  return chunks.map((c, i) => new Map([['seq', i + 1], ['total', chunks.length], ['src', src], ['dst', dst], ['data', c], ['checksum', checksumOf(c)]]));
}
function checksumOf(t) { let s = 0; for (const ch of t) s = (s + ch.codePointAt(0)) % 256; return s; }
function* passPacket(ctx, N, path, pk, journey) {
  // returns 'ok' | 'lost' | 'blocked'
  for (let i = 1; i < path.length; i++) {
    const ms = linkMs(N, path[i - 1], path[i]);
    N.t += ms;
    if (N.loss > 0 && N.rng() < N.loss) { journey.lostAt = i; logNet(N, 'lost', path[i - 1], path[i], `packet ${pk.get('seq')}`); return 'lost'; }
    const dev = N.devices.get(path[i]);
    const fm = ctx.r.findMethod(dev.cls, 'on_packet');
    if (fm) {
      const ok = yield* ctx.r.call(new Bound(dev, fm.m, fm.owner), [pk], ctx.node, ctx.f);
      if (ok === false) { journey.blockedAt = i; logNet(N, 'blocked', path[i - 1], path[i], `packet ${pk.get('seq')} blocked by ${path[i]}`); return 'blocked'; }
      if (ok !== true) throw E(ctx, `on_packet of ${path[i]} must RETURN TRUE or FALSE.`, `al_recibir_paquete de ${path[i]} debe DEVOLVER VERDADERO o FALSO.`);
    }
  }
  return 'ok';
}
const NET_METHODS = [
  { n: 'add_device', es: 'agregar_dispositivo', p: 'name, ip', min: 2, d: 'Adds a computer, phone or other device and gives it back.', f: (o, a, ctx) => registerDevice(ctx, netState(o), makeDevice(ctx.r, 'device', needText(ctx, a[0], 'the name'), needText(ctx, a[1], 'the address'))) },
  { n: 'add_router', es: 'agregar_router', p: 'name, ip', min: 2, d: 'Adds a router that passes packets between links.', f: (o, a, ctx) => registerDevice(ctx, netState(o), makeDevice(ctx.r, 'router', needText(ctx, a[0], 'the name'), needText(ctx, a[1], 'the address'))) },
  { n: 'add_server', es: 'agregar_servidor', p: 'name, ip', min: 2, d: 'Adds a server that can answer requests (see on_request).', f: (o, a, ctx) => registerDevice(ctx, netState(o), makeDevice(ctx.r, 'server', needText(ctx, a[0], 'the name'), needText(ctx, a[1], 'the address'))) },
  { n: 'add', es: 'agregar', p: 'device', min: 1, d: 'Adds a device object you made yourself, for example NEW Firewall(...).',
    f: (o, a, ctx) => { if (!isDevice(a[0])) throw E(ctx, 'give an object made from Device or a class that extends it.', 'da un objeto creado con Dispositivo o con una clase que lo extienda.'); if (!a[0].attrs.has('kind')) a[0].attrs.set('kind', 'device'); return registerDevice(ctx, netState(o), a[0]); } },
  { n: 'connect', es: 'conectar', p: 'a, b, latency = 1', min: 2, max: 3, d: 'Connects two devices. The latency is the time in milliseconds for a packet to cross the link.',
    f: (o, a, ctx) => { const N = netState(o); const x = devName(resolveDev(ctx, N, a[0])), y = devName(resolveDev(ctx, N, a[1])); if (x === y) throw E(ctx, 'a device can\'t connect to itself.', 'un dispositivo no puede conectarse consigo mismo.'); const ms = a.length > 2 ? needNum(ctx, a[2], 'the latency') : 1; if (ms <= 0) throw E(ctx, 'the latency must be more than 0.', 'la latencia debe ser mayor que 0.'); N.adj.get(x).set(y, ms); N.adj.get(y).set(x, ms); ctx.r.touch(); return null; } },
  { n: 'disconnect', es: 'desconectar', p: 'a, b', min: 2, d: 'Removes the link between two devices.',
    f: (o, a, ctx) => { const N = netState(o); const x = devName(resolveDev(ctx, N, a[0])), y = devName(resolveDev(ctx, N, a[1])); N.adj.get(x).delete(y); N.adj.get(y).delete(x); logNet(N, 'link down', x, y, ''); ctx.r.touch(); return null; } },
  { n: 'add_dns', es: 'agregar_dns', p: 'name, ip', min: 2, d: 'Adds a name such as "school.example" to the network\'s phone book (DNS).',
    f: (o, a, ctx) => { const ip = needText(ctx, a[1], 'the address'); if (!validIp(ip)) throw E(ctx, `"${ip}" is not a valid IP address.`, `"${ip}" no es una dirección IP válida.`); netState(o).dns.set(needText(ctx, a[0], 'the name').toLowerCase(), ip); return null; } },
  { n: 'lookup', es: 'buscar_nombre', p: 'name', min: 1, d: 'The IP address for a name, or NOTHING.', f: (o, a, ctx) => { const N = netState(o); const n = needText(ctx, a[0], 'the name').toLowerCase(); logNet(N, 'dns', '', n, N.dns.get(n) || 'not found'); return N.dns.has(n) ? N.dns.get(n) : null; } },
  { n: 'devices', es: 'dispositivos', p: '', min: 0, d: 'A list of all devices.', f: (o) => [...netState(o).devices.values()] },
  { n: 'route', es: 'ruta', p: 'from, to', min: 2, d: 'The names of the devices a packet passes through (fastest path). Empty if there is no path.',
    f: (o, a, ctx) => { const N = netState(o); const p = shortestPath(N, devName(resolveDev(ctx, N, a[0])), devName(resolveDev(ctx, N, a[1], true))); return p || []; } },
  { n: 'ping', es: 'ping', p: 'from, to', min: 2, d: 'Round-trip time in milliseconds, or -1 if the destination can\'t be reached.',
    f: (o, a, ctx) => { const N = netState(o); const x = devName(resolveDev(ctx, N, a[0])), y = devName(resolveDev(ctx, N, a[1], true)); const p = shortestPath(N, x, y); if (!p) { logNet(N, 'ping', x, y, 'unreachable'); return -1; } let ms = 0; for (let i = 1; i < p.length; i++) ms += linkMs(N, p[i - 1], p[i]); logNet(N, 'ping', x, y, `${2 * ms} ms`); return numOut(2 * ms); } },
  { n: 'trace', es: 'trazar', p: 'from, to', min: 2, d: 'Each hop on the way, with its time so far (like traceroute).',
    f: (o, a, ctx) => { const N = netState(o); const x = devName(resolveDev(ctx, N, a[0])), y = devName(resolveDev(ctx, N, a[1], true)); const p = shortestPath(N, x, y); if (!p) return []; let ms = 0; return p.map((n, i) => { if (i) ms += linkMs(N, p[i - 1], n); return new Map([['hop', i], ['name', n], ['ip', N.devices.get(n).attrs.get('ip')], ['ms', numOut(ms)]]); }); } },
  { n: 'set_loss', es: 'fijar_perdida', p: 'fraction', min: 1, d: 'Makes links drop this fraction of packets, for example 0.1 for 10%.',
    f: (o, a, ctx) => { const p = needNum(ctx, a[0], 'the fraction'); if (p < 0 || p > 1) throw E(ctx, 'use a number from 0 to 1.', 'usa un número de 0 a 1.'); netState(o).loss = p; return null; } },
  { n: 'send', es: 'enviar', p: 'from, to, message, size = 8, mode = "reliable"', min: 3, max: 5, gen: true,
    d: 'Sends a message split into packets. "reliable" resends lost packets (like TCP); "fast" does not (like UDP). Gives back a report.',
    f: function* (o, a, ctx) {
      const N = netState(o);
      const src = resolveDev(ctx, N, a[0]); const dst = resolveDev(ctx, N, a[1], true);
      const msg = show(a[2], ctx.r.ed);
      const size = a.length > 3 ? needWhole(ctx, a[3], 'the packet size') : 8;
      if (size < 1) throw E(ctx, 'the packet size must be at least 1.', 'el tamaño de paquete debe ser al menos 1.');
      const mode = a.length > 4 ? needText(ctx, a[4], 'the mode').toLowerCase() : 'reliable';
      if (!['reliable', 'fast', 'fiable', 'rapido', 'rápido'].includes(mode)) throw E(ctx, 'the mode must be "reliable" or "fast".', 'el modo debe ser "reliable" o "fast".');
      const reliable = mode === 'reliable' || mode === 'fiable';
      const x = devName(src), y = devName(dst);
      const path = shortestPath(N, x, y);
      const t0 = N.t;
      const report = new Map([['delivered', false], ['packets', 0], ['lost', 0], ['resent', 0], ['blocked', 0], ['time_ms', 0], ['message', ''], ['route', path || []]]);
      if (!path) { logNet(N, 'send', x, y, 'no route'); report.set('message', ''); N.lastSend = null; ctx.r.touch(); return report; }
      const pks = splitPackets(msg, size, src.attrs.get('ip'), dst.attrs.get('ip'));
      report.set('packets', pks.length);
      logNet(N, 'send', x, y, `${pks.length} packets`);
      const arrived = []; const journeys = [];
      let maxT = 0;
      for (const pk of pks) {
        let tries = 0, res;
        for (;;) {
          const jr = { seq: pk.get('seq'), path, lostAt: null, blockedAt: null, start: N.t - t0 };
          N.t = t0 + (pk.get('seq') - 1) * 1 + tries * 50;
          res = yield* passPacket(ctx, N, path, pk, jr);
          journeys.push(jr);
          yield { req: 'tick' };
          if (res === 'lost') { report.set('lost', report.get('lost') + 1); if (reliable && tries < 20) { tries++; report.set('resent', report.get('resent') + 1); logNet(N, 'resend', x, y, `packet ${pk.get('seq')}`); continue; } }
          if (res === 'blocked') report.set('blocked', report.get('blocked') + 1);
          break;
        }
        if (res === 'ok') { const jitter = N.rng() * 3; arrived.push({ pk, t: N.t - t0 + jitter }); maxT = Math.max(maxT, N.t - t0 + jitter); logNet(N, 'arrive', x, y, `packet ${pk.get('seq')}`); }
      }
      arrived.sort((p, q) => p.t - q.t);
      const got = arrived.map(z => z.pk);
      const text = reassembleText(got, pks.length);
      report.set('delivered', got.length === pks.length);
      report.set('time_ms', numOut(Math.round(maxT * 10) / 10));
      report.set('message', text);
      report.set('arrival_order', arrived.map(z => z.pk.get('seq')));
      N.lastSend = { journeys, path };
      N.t = t0 + maxT;
      ctx.r.touch();
      return report;
    } },
  { n: 'request', es: 'solicitar', p: 'from, address', min: 2, gen: true,
    d: 'Sends a web-style request such as "http://school.example/timetable" and gives back a response with status and body.',
    f: function* (o, a, ctx) {
      const N = netState(o);
      const url = needText(ctx, a[1], 'the address');
      const m = url.match(/^(?:https?:\/\/)?([^\/]+)(\/.*)?$/i);
      if (!m) throw E(ctx, 'write the address like "http://school.example/page".', 'escribe la dirección como "http://school.example/pagina".');
      const src = resolveDev(ctx, N, a[0]);
      const dst = resolveDev(ctx, N, m[1].toLowerCase(), true);
      const path = shortestPath(N, devName(src), devName(dst));
      const resp = new Map([['status', 0], ['body', ''], ['time_ms', 0]]);
      if (!path) { logNet(N, 'request', devName(src), devName(dst), 'unreachable'); resp.set('body', 'unreachable'); return resp; }
      const pk = new Map([['seq', 1], ['total', 1], ['src', src.attrs.get('ip')], ['dst', dst.attrs.get('ip')], ['data', 'GET ' + (m[2] || '/')], ['checksum', 0]]);
      const jr = { seq: 1, path, lostAt: null, blockedAt: null };
      const t0 = N.t;
      const res = yield* passPacket(ctx, N, path, pk, jr);
      N.lastSend = { journeys: [jr], path };
      if (res !== 'ok') { resp.set('status', 0); resp.set('body', res === 'blocked' ? 'blocked' : 'lost'); logNet(N, 'request', devName(src), devName(dst), res); return resp; }
      const h = dst.native && dst.native.handler;
      if (!h) { resp.set('status', 404); resp.set('body', 'no service on ' + devName(dst)); }
      else {
        const req = new Map([['method', 'GET'], ['path', m[2] || '/'], ['from', src.attrs.get('ip')]]);
        const out = yield* ctx.r.call(h, [req], ctx.node, ctx.f);
        if (isDict(out) && out.has('status')) { resp.set('status', out.get('status')); resp.set('body', out.has('body') ? out.get('body') : ''); }
        else { resp.set('status', 200); resp.set('body', out); }
      }
      let ms = 0; for (let i = 1; i < path.length; i++) ms += linkMs(N, path[i - 1], path[i]);
      resp.set('time_ms', numOut(2 * ms));
      N.t = t0 + 2 * ms;
      logNet(N, 'request', devName(src), devName(dst), `${m[2] || '/'} -> ${resp.get('status')}`);
      ctx.r.touch();
      return resp;
    } },
  { n: 'logs', es: 'registros', p: '', min: 0, d: 'Every network event so far, as rows (time, event, from, to, detail).', f: (o) => netState(o).logs.slice() },
  { n: 'draw', es: 'dibujar', p: '', min: 0, d: 'Draws the network on the canvas and animates the last message sent.',
    f: (o, a, ctx) => { const N = netState(o); ctx.r.host.gfx.network(netLayout(N)); ctx.r.touch(); return null; } }
];
function netLayout(N) {
  const names = [...N.devices.keys()];
  const layer = new Map();
  if (names.length) {
    const q = [names[0]]; layer.set(names[0], 0);
    for (const n of names) if (!layer.has(n)) { /* disconnected handled below */ }
    while (q.length) { const u = q.shift(); for (const v of (N.adj.get(u) || new Map()).keys()) if (!layer.has(v)) { layer.set(v, layer.get(u) + 1); q.push(v); } }
    let maxL = Math.max(0, ...layer.values());
    for (const n of names) if (!layer.has(n)) layer.set(n, ++maxL);
  }
  const cols = new Map();
  for (const n of names) { const l = layer.get(n); if (!cols.has(l)) cols.set(l, []); cols.get(l).push(n); }
  const L = cols.size || 1;
  const nodes = [];
  for (const [l, ns] of cols) ns.forEach((n, i) => {
    const d = N.devices.get(n);
    nodes.push({ name: n, ip: d.attrs.get('ip'), kind: show(d.attrs.get('kind'), 'en'), cls: d.cls.name,
      x: L === 1 ? 0 : -250 + (500 * l) / (L - 1), y: ns.length === 1 ? 0 : 140 - (280 * i) / (ns.length - 1) });
  });
  const links = [];
  for (const [a, m] of N.adj) for (const [b, ms] of m) if (a < b) links.push({ a, b, ms });
  return { nodes, links, last: N.lastSend };
}
REG.classes.push({
  n: 'Network', es: 'Red', initMin: 0, initMax: 0, initP: '',
  init(o) { o.native = { devices: new Map(), adj: new Map(), dns: new Map(), loss: 0, rng: makeRng(42), logs: [], t: 0, lastSend: null }; },
  methods: NET_METHODS
});
REG.classes.push({
  n: 'Device', es: 'Dispositivo', initMin: 2, initMax: 2, initP: 'name, ip',
  attrs: [{ n: 'name', es: 'nombre' }, { n: 'ip', es: 'ip' }, { n: 'kind', es: 'clase' }],
  init(o, a, ctx) { o.attrs.set('name', needText(ctx, a[0], 'the name')); o.attrs.set('ip', needText(ctx, a[1], 'the address')); o.attrs.set('kind', 'device'); o.native = { handler: null }; },
  methods: [
    { n: 'on_packet', es: 'al_recibir_paquete', p: 'packet', min: 1, d: 'Called for every packet that reaches this device. RETURN TRUE to accept or pass it on, FALSE to block it. Override it in your own class.', f: () => true },
    { n: 'on_request', es: 'al_recibir_solicitud', p: 'function', min: 1, d: 'Sets the function that answers requests to this device. It receives a request dictionary (method, path, from) and returns the body text or a dictionary with status and body.',
      f: (o, a, ctx) => { o.native = o.native || {}; o.native.handler = needFunc(ctx, a[0]); return null; } }
  ]
});
B({ n: 'split_into_packets', es: 'dividir_en_paquetes', p: 'message, size', min: 2, cat: 'network', d: 'Splits a message into packets: dictionaries with seq, total, src, dst, data and checksum.',
  f: (a, ctx) => { const s = needWhole(ctx, a[1], 'the size'); if (s < 1) throw E(ctx, 'the size must be at least 1.', 'el tamaño debe ser al menos 1.'); return splitPackets(show(a[0], ctx.r.ed), s, '', ''); } });
function reassembleText(pks, total) {
  const bySeq = new Map();
  for (const p of pks) bySeq.set(nv(p.get('seq')), p.get('data'));
  const n = total || Math.max(0, ...pks.map(p => nv(p.get('total')) || 0));
  let out = '';
  for (let i = 1; i <= n; i++) out += bySeq.has(i) ? bySeq.get(i) : '?';
  return out;
}
B({ n: 'reassemble', es: 'reensamblar', p: 'packets', min: 1, cat: 'network', d: 'Puts packets back in order and joins their data. Missing packets show as "?".',
  f: (a, ctx) => { const xs = needList(ctx, a[0], 'the packets'); for (const p of xs) if (!isDict(p) || !p.has('seq') || !p.has('data')) throw E(ctx, 'each packet must be a dictionary with seq and data.', 'cada paquete debe ser un diccionario con seq y data.'); return reassembleText(xs, 0); } });
B({ n: 'is_valid_ip', es: 'es_ip_valida', p: 'text', min: 1, cat: 'network', d: 'TRUE for addresses like 192.168.1.10 (four numbers from 0 to 255).', f: (a) => validIp(a[0]) });
B({ n: 'same_subnet', es: 'misma_subred', p: 'ip1, ip2', min: 2, cat: 'network', d: 'TRUE if the first three numbers match, so the devices share a local network (/24).',
  f: (a, ctx) => { if (!validIp(a[0]) || !validIp(a[1])) throw E(ctx, 'both values must be valid IP addresses.', 'los dos valores deben ser direcciones IP válidas.'); return a[0].split('.').slice(0, 3).join('.') === a[1].split('.').slice(0, 3).join('.'); } });
B({ n: 'load_network', es: 'cargar_red', p: 'sample', min: 1, cat: 'network', gen: true, d: 'A ready-made network: "sample:home_network" or "sample:internet_small".',
  f: function* (a, ctx) {
    const key = needText(ctx, a[0], 'the sample').replace(/^sample:/i, '').toLowerCase();
    const spec = SAMPLES.networks[key];
    if (!spec) throw new LangError('E221', { name: a[0], hint: ' sample:' + Object.keys(SAMPLES.networks).join(', sample:') }, ctx.line);
    const r = ctx.r;
    const net = yield* r.construct(r.nativeNames.get('network'), [], ctx.node || { line: ctx.line });
    const N = net.native;
    for (const [kind, name, ip] of spec.devices) registerDevice(ctx, N, makeDevice(r, kind, name, ip));
    for (const [x, y, ms] of spec.links) { N.adj.get(x).set(y, ms); N.adj.get(y).set(x, ms); }
    for (const [n, ip] of spec.dns) N.dns.set(n, ip);
    for (const [name, pages] of spec.sites || []) {
      const dev = N.devices.get(name);
      dev.native.handler = new Builtin({ n: 'site', min: 1, max: 1, f: (args) => { const p = args[0].get('path'); return pages[p] !== undefined ? pages[p] : new Map([['status', 404], ['body', 'not found']]); } });
    }
    r.credits.add('sample:' + key);
    return net;
  } });

// ---------- security ----------
function shiftChar(ch, k) {
  const c = ch.charCodeAt(0);
  if (c >= 65 && c <= 90) return String.fromCharCode(((c - 65 + k) % 26 + 26) % 26 + 65);
  if (c >= 97 && c <= 122) return String.fromCharCode(((c - 97 + k) % 26 + 26) % 26 + 97);
  return ch;
}
B({ n: 'caesar', es: 'cesar', p: 'text, shift', min: 2, cat: 'security', d: 'Shifts each letter A to Z along the alphabet. Use a negative shift to decode. Not safe for real secrets.',
  f: (a, ctx) => { const k = needWhole(ctx, a[1], 'the shift'); return [...needText(ctx, a[0], 'the text')].map(c => shiftChar(c, k)).join(''); } });
function vig(ctx, a, dir) {
  const t = needText(ctx, a[0], 'the text'); const key = needText(ctx, a[1], 'the key').toUpperCase().replace(/[^A-Z]/g, '');
  if (!key) throw E(ctx, 'the key needs at least one letter A to Z.', 'la clave necesita al menos una letra de la A a la Z.');
  let j = 0;
  return [...t].map(c => { if (/[A-Za-z]/.test(c)) { const k = key.charCodeAt(j++ % key.length) - 65; return shiftChar(c, dir * k); } return c; }).join('');
}
B({ n: 'vigenere', es: 'vigenere', p: 'text, key', min: 2, cat: 'security', d: 'Encrypts letters with a keyword: each letter of the key gives a different shift.', f: (a, ctx) => vig(ctx, a, 1) });
B({ n: 'vigenere_decrypt', es: 'vigenere_descifrar', p: 'text, key', min: 2, cat: 'security', d: 'Decrypts text made with vigenere and the same key.', f: (a, ctx) => vig(ctx, a, -1) });
B({ n: 'letter_frequencies', es: 'frecuencia_letras', p: 'text', min: 1, cat: 'security', d: 'A dictionary from each letter to how many times it appears, most common first. The basis of frequency analysis.',
  f: (a, ctx) => { const m = new Map(); for (const c of needText(ctx, a[0], 'the text').toUpperCase()) if (/[A-Z]/.test(c)) m.set(c, (m.get(c) || 0) + 1); return new Map([...m].sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1))); } });
B({ n: 'hash_text', es: 'hash_texto', p: 'text', min: 1, cat: 'security', d: 'The SHA-256 hash of the text as 64 hexadecimal characters. Any change to the text changes the hash completely.',
  f: (a, ctx) => sha256(show(a[0], ctx.r.ed)) });
B({ n: 'random_salt', es: 'sal_aleatoria', p: '', min: 0, cat: 'security', d: 'Eight random hexadecimal characters to add to a password before hashing.',
  f: (a, ctx) => { let s = ''; for (let i = 0; i < 8; i++) s += Math.floor(ctx.r.rng() * 16).toString(16); return s; } });
B({ n: 'checksum', es: 'suma_verificacion', p: 'text', min: 1, cat: 'security', d: 'A simple checksum: the sum of the character codes, from 0 to 255. Easy to fool, unlike a hash.',
  f: (a, ctx) => checksumOf(show(a[0], ctx.r.ed)) });
const COMMON_PW = ['123456', 'password', '123456789', 'qwerty', '12345678', '111111', '12345', 'abc123', 'password1', '1234', 'iloveyou', 'admin', 'welcome', 'football', 'monkey', 'letmein', 'dragon', 'sunshine', 'princess', 'qwerty123'];
function humanTime(sec, ed) {
  const es = ed === 'es';
  if (sec < 1) return es ? 'al instante' : 'instantly';
  const units = es ? [['siglos', 3.15e9], ['años', 3.15e7], ['días', 86400], ['horas', 3600], ['minutos', 60], ['segundos', 1]] : [['centuries', 3.15e9], ['years', 3.15e7], ['days', 86400], ['hours', 3600], ['minutes', 60], ['seconds', 1]];
  for (const [u, s] of units) if (sec >= s) { const n = sec / s; return (n >= 1e6 ? n.toExponential(1) : Math.round(n).toLocaleString('en')) + ' ' + u; }
  return '';
}
B({ n: 'password_strength', es: 'fuerza_contrasena', p: 'password', min: 1, cat: 'security', d: 'Checks a password: length, character sets, estimated guesses, crack time at 10 billion guesses per second, and a score from 0 to 4.',
  f: (a, ctx) => {
    const p = needText(ctx, a[0], 'the password');
    const lower = /[a-z]/.test(p), upper = /[A-Z]/.test(p), digits = /[0-9]/.test(p), symbols = /[^a-zA-Z0-9]/.test(p);
    const cs = (lower ? 26 : 0) + (upper ? 26 : 0) + (digits ? 10 : 0) + (symbols ? 33 : 0);
    const common = COMMON_PW.includes(p.toLowerCase());
    const log10g = common ? 1 : p.length * Math.log10(Math.max(cs, 1));
    const sec = Math.pow(10, log10g) / 1e10;
    const score = common ? 0 : log10g < 6 ? 0 : log10g < 9 ? 1 : log10g < 12 ? 2 : log10g < 15 ? 3 : 4;
    const tips = [];
    if (p.length < 12) tips.push(ctx.r.L('Use at least 12 characters.', 'Usa al menos 12 caracteres.'));
    if (!(upper && lower)) tips.push(ctx.r.L('Mix capital and small letters.', 'Mezcla mayúsculas y minúsculas.'));
    if (!digits) tips.push(ctx.r.L('Add numbers.', 'Añade números.'));
    if (!symbols) tips.push(ctx.r.L('Add symbols such as ! or #.', 'Añade símbolos como ! o #.'));
    if (common) tips.unshift(ctx.r.L('This is one of the most common passwords. Never use it.', 'Esta es una de las contraseñas más comunes. No la uses nunca.'));
    const guesses = Math.pow(10, log10g);
    return new Map([['length', p.length], ['has_lower', lower], ['has_upper', upper], ['has_digits', digits], ['has_symbols', symbols], ['charset_size', cs],
      ['guesses', guesses < 9e15 ? Math.round(guesses) : guesses.toExponential(2)], ['crack_time', common ? humanTime(0, ctx.r.ed) : humanTime(sec, ctx.r.ed)], ['score', score], ['common', common], ['tips', tips]]);
  } });
B({ n: 'brute_force_demo', es: 'demo_fuerza_bruta', p: 'target_hash, charset, max_length', min: 3, cat: 'security', gen: true,
  d: 'Tries every password up to max_length (at most 4) from the charset and reports how many attempts it took. Shows why long passwords matter.',
  f: function* (a, ctx) {
    const target = needText(ctx, a[0], 'the hash').toLowerCase(); const cs = [...new Set(needText(ctx, a[1], 'the charset'))];
    const max = needWhole(ctx, a[2], 'the maximum length');
    if (max < 1 || max > 4) throw E(ctx, 'the maximum length must be 1 to 4 in this demo.', 'la longitud máxima debe ser de 1 a 4 en esta demostración.');
    if (cs.length < 1 || cs.length > 40) throw E(ctx, 'the charset must have 1 to 40 characters.', 'el conjunto debe tener de 1 a 40 caracteres.');
    const r = ctx.r; let attempts = 0; const t0 = Date.now();
    for (let len = 1; len <= max; len++) {
      const idx = new Array(len).fill(0);
      const total = Math.pow(cs.length, len);
      for (let k = 0; k < total; k++) {
        const cand = idx.map(i => cs[i]).join('');
        attempts++;
        if (sha256(cand) === target) {
          r.out(r.L(`Length ${len}: found after ${attempts.toLocaleString('en')} attempts.`, `Longitud ${len}: encontrada tras ${attempts.toLocaleString('en')} intentos.`));
          return new Map([['found', cand], ['attempts', attempts], ['seconds', new Dec((Date.now() - t0) / 1000)]]);
        }
        for (let j = len - 1; j >= 0; j--) { if (++idx[j] < cs.length) break; idx[j] = 0; }
        if ((attempts & 2047) === 0) yield { req: 'tick' };
      }
      r.out(r.L(`Length ${len}: ${total.toLocaleString('en')} candidates tried, ${attempts.toLocaleString('en')} attempts so far.`, `Longitud ${len}: ${total.toLocaleString('en')} candidatas probadas, ${attempts.toLocaleString('en')} intentos hasta ahora.`));
    }
    return new Map([['found', null], ['attempts', attempts], ['seconds', new Dec((Date.now() - t0) / 1000)]]);
  } });
function modpow(b, e, m) { let r = 1n, x = BigInt(b) % BigInt(m), k = BigInt(e); const M = BigInt(m); while (k > 0n) { if (k & 1n) r = (r * x) % M; x = (x * x) % M; k >>= 1n; } return Number(r); }
function egcd(a, b) { if (b === 0) return [a, 1, 0]; const [g, x, y] = egcd(b, a % b); return [g, y, x - Math.floor(a / b) * y]; }
const TOY_PRIMES = [101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233];
B({ n: 'make_toy_keys', es: 'crear_claves_juguete', p: '', min: 0, cat: 'security', d: 'A tiny RSA key pair from two small primes: public [e, n] and private [d, n]. Far too small to protect anything.',
  f: (a, ctx) => {
    const r = ctx.r; const p = TOY_PRIMES[Math.floor(r.rng() * TOY_PRIMES.length)]; let q = p;
    while (q === p) q = TOY_PRIMES[Math.floor(r.rng() * TOY_PRIMES.length)];
    const n = p * q, phi = (p - 1) * (q - 1);
    let e = 17; while (egcd(e, phi)[0] !== 1) e += 2;
    let d = egcd(e, phi)[1]; d = ((d % phi) + phi) % phi;
    return new Map([['public', [e, n]], ['private', [d, n]], ['p', p], ['q', q]]);
  } });
function keyOf(ctx, k) { if (!isList(k) || k.length !== 2 || !isWhole(k[0]) || !isWhole(k[1])) throw E(ctx, 'the key must be a list of two whole numbers, like keys["public"].', 'la clave debe ser una lista de dos números enteros, como claves["public"].'); return k; }
B({ n: 'toy_encrypt', es: 'cifrar_juguete', p: 'message, public_key', min: 2, cat: 'security', d: 'Encrypts each character with the public key. Gives a list of numbers.',
  f: (a, ctx) => { const [e, n] = keyOf(ctx, a[1]); return [...show(a[0], ctx.r.ed)].map(c => { const m = c.codePointAt(0); if (m >= n) throw E(ctx, `the character "${c}" is too big for this toy key.`, `el carácter "${c}" es demasiado grande para esta clave de juguete.`); return modpow(m, e, n); }); } });
B({ n: 'toy_decrypt', es: 'descifrar_juguete', p: 'numbers, private_key', min: 2, cat: 'security', d: 'Decrypts a list of numbers made by toy_encrypt, using the private key.',
  f: (a, ctx) => { const [d, n] = keyOf(ctx, a[1]); return needList(ctx, a[0], 'the numbers').map(x => String.fromCodePoint(modpow(needWhole(ctx, x, 'each number'), d, n))).join(''); } });
REG.classes.push({
  n: 'AccessPolicy', es: 'PoliticaAcceso', initMin: 0, initMax: 0,
  init(o) { o.native = { rules: [] }; },
  methods: [
    { n: 'allow', es: 'permitir', p: 'role, action, resource', min: 3, d: 'Adds a rule: this role may do this action on this resource. Use "*" for any resource.',
      f: (o, a, ctx) => { o.native.rules.push([needText(ctx, a[0], 'the role'), needText(ctx, a[1], 'the action'), needText(ctx, a[2], 'the resource')]); return null; } },
    { n: 'can', es: 'puede', p: 'role, action, resource', min: 3, d: 'TRUE if a rule allows it. Everything else is denied (deny by default).',
      f: (o, a, ctx) => { const [ro, ac, re] = [needText(ctx, a[0], 'the role'), needText(ctx, a[1], 'the action'), needText(ctx, a[2], 'the resource')]; return o.native.rules.some(([x, y, z]) => x === ro && y === ac && (z === re || z === '*')); } },
    { n: 'rules', es: 'reglas', p: '', min: 0, d: 'All rules as rows (role, action, resource).', f: (o) => o.native.rules.map(([x, y, z]) => new Map([['role', x], ['action', y], ['resource', z]])) }
  ]
});
