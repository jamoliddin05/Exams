QV.register('topic5', function (q) {
  const { s, h, svg, steps, slider, axes, line, box, arrow, table, fmt } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const tx = (g, x, y, text, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls || null }, g, text);
  // each figure is isolated so one failure leaves the rest of the article drawn
  const fig = (name, fn) => { try { fn(); } catch (e) { QV.fail('topic5 ' + name, e); } };
  const SYM = ['A', 'B', 'C', 'D', 'E', 'F', '$'];
  const CUT = [0, 4, 6, 10, 11, 17, 18, 20];
  const P = ['0.2', '0.1', '0.2', '0.05', '0.3', '0.05', '0.1'];
  const slices = (g, x0, w, y, bh, pick) => SYM.forEach((sym, j) => {
    const sx = x0 + w * CUT[j] / 20, sw = w * (CUT[j + 1] - CUT[j]) / 20;
    s('rect', { x: sx, y, width: sw, height: bh, class: (j === pick ? 'f-pri' : 'f-seg') + ' sep' }, g);
    tx(g, sx + sw / 2, y + bh / 2, sym, j === pick ? 't-on t-bold' : 't-muted', 'middle');
  });

  // Figure 1: encoder with exact decimals (numerators over 20^n)
  fig('enc', () => {
    const X0 = 160, W = 520, RH = 58, BH = 26, MAX = 6;
    const dec = (num, n) => {
      if (n === 0) return num.toString();
      const d = 2 * n, digits = (num * 5n ** BigInt(n)).toString().padStart(d + 1, '0');
      const fp = digits.slice(digits.length - d).replace(/0+$/, '');
      return digits.slice(0, digits.length - d) + (fp ? '.' + fp : '');
    };
    const host = viz('enc');
    const pad = h('div', { class: 'steps', role: 'group', 'aria-label': 'Type a message' }, viz('enc-keys'));
    let msg = [...'CAEE$'];
    const btn = (label, fn) => { const b = h('button', { type: 'button' }, pad, label); b.addEventListener('click', () => { fn(); draw(); }); return b; };
    const keys = SYM.map(sym => btn(sym, () => { if (msg.length < MAX && msg[msg.length - 1] !== '$') msg.push(sym); }));
    const back = btn('Back', () => msg.pop());
    btn('Clear', () => { msg = []; });
    btn('CAEE$', () => { msg = [...'CAEE$']; });
    function draw() {
      host.textContent = '';
      const n = msg.length, done = n > 0 && msg[n - 1] === '$';
      const iv = [{ L: 0n, H: 1n }];
      msg.forEach(sym => {
        const j = SYM.indexOf(sym), { L, H } = iv[iv.length - 1], R = H - L;
        iv.push({ L: L * 20n + R * BigInt(CUT[j]), H: L * 20n + R * BigInt(CUT[j + 1]) });
      });
      const rows = n ? n + 1 : 1;
      const g = svg(host, 790, 16 + rows * RH, { label: 'One bar per symbol: the current interval cut into the seven slices, the chosen slice stretched into the next bar', minWidth: 560 });
      const calc = [`start  [0, 1)   range 1`];
      for (let i = 0; i < rows; i++) {
        const y = 10 + i * RH, { L, H } = iv[i];
        tx(g, X0 - 6, y + BH / 2, dec(L, i), 't-fg', 'end');
        tx(g, X0 + W + 6, y + BH / 2, dec(H, i), 't-fg');
        if (i < n) {
          const j = SYM.indexOf(msg[i]);
          slices(g, X0, W, y, BH, j);
          tx(g, 0, y + BH / 2 - 7, `${i + 1}. ${msg[i]}`, 't-fg t-bold');
          tx(g, 0, y + BH / 2 + 8, 'p = ' + P[j], 't-sm');
          const sx = X0 + W * CUT[j] / 20, ex = X0 + W * CUT[j + 1] / 20;
          s('polygon', { points: `${sx},${y + BH} ${ex},${y + BH} ${X0 + W},${y + RH} ${X0},${y + RH}`, class: 'area-pri' }, g);
          const lo = dec(L, i), rg = dec(H - L, i), nx = iv[i + 1];
          calc.push(`${msg[i]}      low  = ${lo} + ${rg} × ${dec(BigInt(CUT[j]), 1)} = ${dec(nx.L, i + 1)}`);
          calc.push(`       high = ${lo} + ${rg} × ${dec(BigInt(CUT[j + 1]), 1)} = ${dec(nx.H, i + 1)}      range = ${dec(nx.H - nx.L, i + 1)}`);
        } else if (n) {
          s('rect', { x: X0, y, width: W, height: BH, class: done ? 'f-ok' : 'f-pri-soft' }, g);
          tx(g, X0 + W / 2, y + BH / 2, done ? 'any number in here encodes ' + msg.join('') : 'interval so far: end it with $', done ? 't-on t-bold' : 't-fg', 'middle');
          tx(g, 0, y + BH / 2, done ? 'final' : 'so far', 't-fg t-bold');
        } else {
          slices(g, X0, W, y, BH, -1);
          tx(g, 0, y + BH / 2, 'start', 't-fg t-bold');
        }
      }
      const last = iv[n], R = last.H - last.L;
      role('enc-calc').textContent = calc.join('\n');
      role('enc-msg').textContent = n ? msg.join('') : '(empty)';
      role('enc-w').textContent = dec(R, n);
      role('enc-b').textContent = (n * Math.log2(20) - Math.log2(Number(R))).toFixed(2);
      role('enc-note').textContent = done
        ? `${msg.join('')} ends with the terminator. Final interval [${dec(last.L, n)}, ${dec(last.H, n)}), width ${dec(R, n)} = ${msg.map(c => P[SYM.indexOf(c)]).join(' × ')}.`
        : n ? 'Keep typing (up to 6 symbols) and end the message with $.' : 'Type a message. The bar is [0, 1) cut into one slice per symbol, as wide as its probability.';
      const full = done || n >= MAX;
      keys.forEach(b => { b.disabled = full; b.style.opacity = full ? '0.4' : ''; });
      back.disabled = !n; back.style.opacity = n ? '' : '0.4';
    }
    draw();
  });

  // Figure 2: Procedure 7.2 as a binary search
  fig('code', () => {
    const EX = [{ lo: 0.33184, hi: 0.3322, los: '0.33184', his: '0.3322' }, { lo: 0.694, hi: 0.7, los: '0.694', his: '0.7' }];
    const X0 = 150, W = 400, RH = 50, BH = 24;
    const host = viz('code'), kHost = viz('code-steps');
    const trace = ex => {
      const rows = [];
      let c = 0, k = 1, bits = '';
      while (c < ex.lo) {
        const t = c + 2 ** -k, keep = t <= ex.hi;
        const tryBits = bits + '1';
        bits += keep ? '1' : '0';
        rows.push({ k, w0: c, t, keep, tryBits, bits, code: keep ? t : c });
        if (keep) c = t;
        k++;
      }
      return rows;
    };
    steps(viz('code-ex'), ['CAEE$ [0.33184, 0.3322)', 'EC$ [0.694, 0.7)'], e => {
      const ex = EX[e], rows = trace(ex);
      kHost.textContent = '';
      steps(kHost, rows.map(r => 'Bit ' + r.k), k => {
        host.textContent = '';
        const g = svg(host, 800, 12 + rows.length * RH, { label: 'One row per bit: the window of possible codes split at the tried value, with the target interval in green', minWidth: 560 });
        rows.slice(0, k + 1).forEach((r, i) => {
          const y = 8 + i * RH, size = 2 ** -(r.k - 1), x = v => X0 + (v - r.w0) / size * W, mid = x(r.t);
          s('rect', { x: X0, y, width: mid - X0, height: BH, class: (r.keep ? 'f-seg' : 'f-pri-soft') + ' sep' }, g);
          s('rect', { x: mid, y, width: X0 + W - mid, height: BH, class: (r.keep ? 'f-pri-soft' : 'f-seg') + ' sep' }, g);
          const a = x(ex.lo), b = Math.max(x(ex.hi), a + 3);
          s('rect', { x: a, y: y + 4, width: b - a, height: BH - 8, class: 'f-ok' }, g);
          s('line', { x1: mid, x2: mid, y1: y - 3, y2: y + BH + 3, class: 's-sec', style: 'stroke-width: 2' }, g);
          tx(g, 0, y + BH / 2, 'bit ' + r.k, i === k ? 't-pri t-bold' : 't-fg t-bold');
          tx(g, X0 - 6, y + BH / 2, fmt(r.w0, 10), 't-sm', 'end');
          tx(g, X0 + W + 6, y + BH / 2, fmt(r.w0 + size, 10), 't-sm');
          tx(g, 630, y + 6, `try ${fmt(r.t, 10)} ${r.keep ? '≤' : '>'} high → ${r.keep ? 1 : 0}`, r.keep ? 't-pri' : 't-sec');
          tx(g, 630, y + 21, `code 0.${r.bits}₂`, 't-fg');
          if (i < k) {
            const kx0 = r.keep ? mid : X0, kx1 = r.keep ? X0 + W : mid;
            s('polygon', { points: `${kx0},${y + BH} ${kx1},${y + BH} ${X0 + W},${y + RH} ${X0},${y + RH}`, class: 'area-pri' }, g);
          }
        });
        const r = rows[k], stop = r.code >= ex.lo;
        role('code-note').textContent = `Bit ${r.k}: try 0.${r.tryBits}₂ = ${fmt(r.t, 10)}. ` +
          (r.keep ? `Not above high ${ex.his}, so bit ${r.k} = 1. ` : `Above high ${ex.his}, so bit ${r.k} goes back to 0. `) +
          `The code 0.${r.bits}₂ = ${fmt(r.code, 10)} ` +
          (stop ? `has reached low ${ex.los}: stop. Codeword ${r.bits}, ${r.k} bits.` : `is still below low ${ex.los}: go on.`);
      }, rows.length - 1);
    });
  });

  // Figure 3: decoder on the slide-10 values
  fig('dec', () => {
    const ROWS = [
      [0.33203125, '0.33203125', 2, '(0.33203125 − 0.3) / 0.2', '= 0.16015625'],
      [0.16015625, '0.16015625', 0, '(0.16015625 − 0) / 0.2', '= 0.80078125'],
      [0.80078125, '0.80078125', 4, '(0.80078125 − 0.55) / 0.3', '= 0.8359375'],
      [0.8359375, '0.8359375', 4, '(0.8359375 − 0.55) / 0.3', '= 0.953125'],
      [0.953125, '0.953125', 6, '$ is the terminator', 'stop: CAEE$'],
    ];
    const X0 = 120, W = 440, RH = 46, BH = 24;
    const host = viz('dec');
    const NOTES = [
      '0.33203125 lies in C\'s slice [0.3, 0.5), so the first symbol is C. Stretch that slice to [0, 1): (0.33203125 − 0.3) / 0.2 = 0.16015625.',
      '0.16015625 lies in A\'s slice [0, 0.2). Output A. Next value 0.16015625 / 0.2 = 0.80078125.',
      '0.80078125 lies in E\'s slice [0.55, 0.85). Output E. Next value (0.80078125 − 0.55) / 0.3 = 0.8359375.',
      '0.8359375 is again in E\'s slice. Output E. Next value (0.8359375 − 0.55) / 0.3 = 0.953125.',
      '0.953125 lies in $\'s slice [0.9, 1.0), the terminator, so the decoder stops. Output CAEE$.',
    ];
    steps(viz('dec-steps'), ROWS.map((_, i) => 'Step ' + (i + 1)), k => {
      host.textContent = '';
      const g = svg(host, 800, 14 + ROWS.length * RH, { label: 'Decoder rows: the value marked on the symbol table, the slice it falls in, and the rescaled next value', minWidth: 560 });
      ROWS.slice(0, k + 1).forEach(([v, vs, j, f1, f2], i) => {
        const y = 12 + i * RH, x = X0 + v * W;
        slices(g, X0, W, y, BH, j);
        s('line', { x1: x, x2: x, y1: y - 6, y2: y + BH + 2, class: 's-sec' }, g);
        s('polygon', { points: `${x - 5},${y - 10} ${x + 5},${y - 10} ${x},${y - 3}`, class: 'f-sec' }, g);
        tx(g, X0 - 8, y + BH / 2, 'v = ' + vs, i === k ? 't-sec t-bold' : 't-fg', 'end');
        tx(g, 576, y + 5, `→ ${SYM[j]}   ${f1}`, 't-fg');
        tx(g, 590, y + 20, f2, i === 4 ? 't-ok t-bold' : 't-pri');
      });
      role('dec-note').textContent = NOTES[k];
    }, ROWS.length - 1);
  });

  // Figure 4: frequency masking around a 1 kHz tone
  fig('fmask', () => {
    const lg = Math.log10;
    const Tq = f => { const k = f / 1000; return 3.64 * k ** -0.8 - 6.5 * Math.exp(-0.6 * (k - 3.3) ** 2) + 1e-3 * k ** 4; };
    const bark = f => 13 * Math.atan(0.00076 * f) + 3.5 * Math.atan((f / 7500) ** 2);
    const FM = 1000, PROBE = 30;
    const spread = (f, L) => { const dz = bark(f) - bark(FM); return dz < 0 ? L - 10 + 27 * dz : L - 10 - (24 + 230 / FM - 0.2 * L) * dz; };
    const thr = (f, L) => 10 * Math.log10(10 ** (Tq(f) / 10) + 10 ** (spread(f, L) / 10));
    const g0 = svg(viz('fm'), 720, 300, { label: 'Threshold in quiet and the masked threshold around a 1 kHz masker, with a 30 dB test tone', minWidth: 560 });
    const ax = axes(g0, { x: 52, y: 24, w: 640, h: 220, xd: [2, 4], yd: [-10, 90], xt: [100, 200, 500, 1000, 2000, 5000, 10000].map(lg), yt: [-10, 0, 20, 40, 60, 80], xf: v => { const f = Math.round(10 ** v); return f >= 1000 ? f / 1000 + 'k' : String(f); }, xl: 'frequency (Hz, log scale)', yl: 'level (dB)' });
    const FS = Array.from({ length: 301 }, (_, i) => 10 ** (2 + 2 * i / 300));
    const cy = v => ax.y(Math.max(-10, Math.min(90, v)));
    line(g0, FS.map(f => [ax.x(lg(f)), cy(Tq(f))]), 's-muted dash');
    tx(g0, ax.x(lg(130)), cy(Tq(130)) - 30, 'threshold in quiet', 't-muted halo');
    const g = s('g', {}, g0);
    let L = 60, pf = 1200;
    const hz = f => f >= 1000 ? (f / 1000).toFixed(2) + ' kHz' : Math.round(f) + ' Hz';
    function draw() {
      g.textContent = '';
      const pts = FS.map(f => [ax.x(lg(f)), cy(thr(f, L))]);
      const qp = FS.map(f => [ax.x(lg(f)), cy(Tq(f))]).reverse();
      s('path', { d: 'M' + pts.concat(qp).map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L') + ' Z', class: 'area-pri' }, g);
      line(g, pts, 's-pri');
      const mx = ax.x(lg(FM));
      s('line', { x1: mx, x2: mx, y1: ax.y(-10), y2: ax.y(L), class: 's-pri', style: 'stroke-width: 4' }, g);
      tx(g, mx - 8, ax.y(L) - 4, `masker ${L} dB`, 't-pri t-bold halo', 'end');
      const t = thr(pf, L), heard = PROBE > t, px = ax.x(lg(pf));
      s('line', { x1: px, x2: px, y1: ax.y(-10), y2: ax.y(PROBE), class: 's-ter' + (heard ? '' : ' dash') }, g);
      s('circle', { cx: px, cy: ax.y(PROBE), r: 5, class: heard ? 'f-ter' : 'f-surface s-ter' }, g);
      const right = pf < 4000;
      tx(g, px + (right ? 8 : -8), ax.y(PROBE) + 12, heard ? 'heard' : 'masked', 't-ter t-bold halo', right ? 'start' : 'end');
      let lo = null, hi = null;
      for (let i = 0; i < 2000; i++) {
        const f = 10 ** (2 + 2 * i / 1999);
        if (thr(f, L) > PROBE) { if (lo === null) lo = f; hi = f; }
      }
      role('fm-t').textContent = t.toFixed(1) + ' dB';
      role('fm-v').textContent = heard ? 'heard' : 'masked';
      role('fm-s').textContent = `${hz(pf)}, ${pf < FM ? 'below' : 'above'} the masker`;
      role('fm-r').textContent = lo === null ? 'none' : `${Math.round(lo)}–${Math.round(hi)} Hz`;
      role('fm-rs').textContent = lo === null ? 'the masker is too weak' : `${Math.round(FM - lo)} Hz below, ${Math.round(hi - FM)} Hz above`;
    }
    slider(viz('fm-l'), { label: 'masker level', min: 40, max: 80, step: 1, value: 60, fmt: v => v + ' dB' }, v => { L = v; draw(); });
    slider(viz('fm-f'), { label: 'test tone', min: 2, max: 4, step: 0.005, value: lg(1200), fmt: v => hz(10 ** v) }, v => { pf = 10 ** v; draw(); });
  });

  // Figure 5: encoder block diagram (slide 29)
  fig('pipe', () => {
    const g0 = svg(viz('pipe'), 800, 270, { label: 'MPEG audio encoder: filter bank and psychoacoustic model in parallel, then quantization and bit allocation, then the entropy coder', minWidth: 600 });
    const g = s('g', {}, g0);
    const B = {
      fb: [170, 40, 150, 56, 'filter bank\ntime → frequency'],
      pm: [170, 180, 150, 56, 'psychoacoustic\nmodel'],
      q: [440, 40, 180, 56, 'quantization,\nbit/noise allocation'],
      ec: [440, 180, 180, 56, 'multiplexer,\nentropy coder'],
    };
    const ACT = [null, 'fb', 'pm', 'q', 'ec'];
    const USE = { fb: ['in', 'fb'], pm: ['in', 'pm'], q: ['fb', 'pm', 'q'], ec: ['q', 'ec'] };
    const NOTES = [
      'Uncompressed audio goes to the filter bank and, in parallel, to the psychoacoustic model. The filter bank makes what gets coded. The model only decides how coarsely each sub-band may be quantized.',
      'Filter bank: "divides input into multiple sub-bands (32 equal frequency sub-bands)". This moves the sound from the time domain to the frequency domain.',
      'Psychoacoustic model: uses masking and the threshold of hearing to find how much noise each sub-band can hide. Its output is the signal-to-mask ratio SMR of each sub-band (textbook context).',
      'Quantization, bit/noise allocation: "If noise level is high => rough quantization; if noise level is low => finer quantization is applied." Bits go to the sub-band with the lowest MNR (section 12).',
      'Multiplexer and entropy coder: Huffman coding of the quantized values, packed with side information into the compressed frames.',
    ];
    steps(viz('pipe-steps'), ['All', 'Filter bank', 'Psychoacoustic model', 'Bit allocation', 'Entropy coder'], k => {
      g.textContent = '';
      const act = ACT[k], on = id => !act || (USE[act] || []).includes(id);
      const ac = id => act && on(id) ? 'a-pri' : 'a-muted';
      box(g, 10, 110, 120, 56, 'PCM audio\n16-bit samples', { cls: 'f-surface' });
      line(g, [[130, 138], [145, 138]], 's-muted');
      line(g, [[145, 68], [145, 208]], 's-muted');
      arrow(g, 145, 68, 170, 68, { cls: ac('in') });
      arrow(g, 145, 208, 170, 208, { cls: ac('in') });
      arrow(g, 320, 68, 440, 68, { cls: ac('fb'), label: '32 sub-bands', labelCls: 't-fg' });
      line(g, [[320, 208], [390, 208], [390, 86]], act && on('pm') ? 's-pri' : 's-muted').setAttribute('style', 'stroke-width: 1.5');
      arrow(g, 390, 86, 440, 86, { cls: ac('pm') });
      tx(g, 382, 140, 'SMR per', 't-fg', 'end');
      tx(g, 382, 154, 'sub-band', 't-fg', 'end');
      arrow(g, 530, 96, 530, 180, { cls: ac('q') });
      tx(g, 538, 138, 'quantized values', 't-fg');
      arrow(g, 620, 208, 680, 208, { cls: ac('ec') });
      tx(g, 686, 208, 'MP3 frames', 't-fg t-bold');
      Object.keys(B).forEach(id => {
        const [x, y, w, hh, label] = B[id], hot = act === id;
        const grp = s('g', { style: act && !hot ? 'opacity: 0.45' : null }, g);
        box(grp, x, y, w, hh, label, { cls: hot ? 'f-pri' : 'f-pri-soft', textCls: hot ? 't-on t-bold' : 't-fg' });
      });
      role('pipe-note').textContent = NOTES[k];
    });
  });

  // Figure 6: greedy bit allocation, MNR = M - N
  fig('alloc', () => {
    const S = [70, 64, 52, 45], M = [50, 51, 47, 48], NB = 8;
    const rounds = [[0, 0, 0, 0]], got = [];
    const mnrOf = bits => bits.map((n, i) => 6 * n - (S[i] - M[i]));
    for (let b = 0; b < NB; b++) {
      const bits = rounds[b].slice(), mnr = mnrOf(bits), i = mnr.indexOf(Math.min(...mnr));
      got.push(i); bits[i]++; rounds.push(bits);
    }
    const g0 = svg(viz('alloc'), 720, 330, { label: 'Four sub-bands: signal bar, mask line and noise line; the gap from noise to mask is the MNR', minWidth: 560 });
    const ax = axes(g0, { x: 52, y: 40, w: 640, h: 220, xd: [0, 4], yd: [0, 80], yt: [0, 20, 40, 60, 80], yl: 'level (dB)' });
    const g = s('g', {}, g0);
    steps(viz('alloc-steps'), ['Start'].concat(got.map((_, b) => 'Bit ' + (b + 1))), k => {
      g.textContent = '';
      const bits = rounds[k], mnr = mnrOf(bits), next = k < NB ? got[k] : -1;
      S.forEach((sv, i) => {
        const cx = ax.x(i + 0.5), N = sv - 6 * bits[i];
        s('rect', { x: cx - 24, y: ax.y(sv), width: 48, height: ax.y(0) - ax.y(sv), class: 'f-pri-soft' }, g);
        tx(g, cx, ax.y(sv) - 9, 'S ' + sv, 't-pri t-bold', 'middle');
        line(g, [[cx - 34, ax.y(M[i])], [cx + 34, ax.y(M[i])]], 's-sec');
        tx(g, cx - 38, ax.y(M[i]), 'M ' + M[i], 't-sec', 'end');
        line(g, [[cx - 34, ax.y(N)], [cx + 34, ax.y(N)]], 's-ter dash');
        tx(g, cx + 38, ax.y(N), 'N ' + N, 't-ter');
        line(g, [[cx, ax.y(N)], [cx, ax.y(M[i])]], mnr[i] >= 0 ? 's-ok' : 's-bad').setAttribute('style', 'stroke-width: 4');
        if (i === next) {
          s('rect', { x: cx - 44, y: ax.y(sv) - 30, width: 88, height: ax.y(0) - ax.y(sv) + 30, class: 'f-none outline-pri' }, g);
          tx(g, cx, ax.y(sv) - 22, 'next bit', 't-pri t-bold', 'middle');
        }
        tx(g, cx, ax.y(0) + 16, 'sub-band ' + (i + 1), 't-fg t-bold', 'middle');
        tx(g, cx, ax.y(0) + 32, 'bits ' + bits[i], 't-pri', 'middle');
        tx(g, cx, ax.y(0) + 48, 'MNR ' + (mnr[i] > 0 ? '+' : '') + mnr[i], mnr[i] >= 0 ? 't-ok t-bold' : 't-bad t-bold', 'middle');
      });
      const prev = k ? mnrOf(rounds[k - 1])[got[k - 1]] : 0;
      role('alloc-note').textContent = k === 0
        ? 'Start: no bits, so the noise is as loud as the signal. MNR = −20, −13, −5, +3 dB. Sub-band 4\'s signal is already under its mask, so it needs no bits. Sub-band 1 has the lowest MNR.'
        : `Bit ${k} goes to sub-band ${got[k - 1] + 1}, whose MNR ${prev} dB was the lowest. Its noise drops 6 dB, so its MNR becomes ${prev + 6} dB.` +
          (k === NB ? ' Every MNR is now positive: all noise is under the masks. Bits 4, 3, 1, 0.' : '');
    }, NB);
  });

  fig('cheat', () => {
    const c = t => ({ text: t, cls: 'l' });
    table(viz('cheat'), [c('Fact or formula'), c('Value or example')], [
      ['Encoder update', 'low′ = low + range·R_low(s), high′ = low + range·R_high(s), both from the old low'],
      ['Final range', 'product of the probabilities; CAEE$: 0.00036'],
      ['CAEE$', '[0.33184, 0.3322) → 0.01010101₂ = 0.33203125, 8 bits'],
      ['EC$', '[0.694, 0.7) → 0.1011001₂ = 0.6953125, 7 bits'],
      ['Codeword (Proc. 7.2)', 'try bit k = 1; if value > high → 0; stop when value ≥ low'],
      ['Decoder', 'v ← (v − R_low(s)) / p(s), stop at $'],
      ['Lossy', 'close approximation, much higher compression ratio'],
      ['Main source of loss', 'quantization; uniform or nonuniform (logarithmic) levels'],
      ['Rate–distortion', 'R(0) = H, R(Dmax) = 0'],
      ['Threshold of hearing', '≈ 0 dB at 2 kHz, 3.37 dB at 1 kHz, −4.98 dB at 3.3 kHz'],
      ['Frequency masking', 'lower masks higher; louder → wider; far apart → little'],
      ['Temporal masking', 'pre ≈ 20 ms, post ≈ 150 ms'],
      ['Data rate', '44100 × 16 × 2 = 1,411,200 bit/s; ÷ 128 kbps = 11.025'],
      ['MPEG-1 layers', 'L1 32–448 (192), L2 32–384 (128), L3 32–320 (64) kbps'],
      ['Encoder', 'filter bank (32 sub-bands) + psychoacoustic model → bit allocation → Huffman'],
      ['Bit allocation', 'MNR = SNR − SMR; next bit to the lowest MNR; 1 bit ≈ 6 dB'],
      ['AAC / MP4', 'MPEG-2 Part 7 (1997), MPEG-4 (1999), pure MDCT / MPEG-4 Part 14 container'],
    ].map(r => r.map(c)));
  });
});
