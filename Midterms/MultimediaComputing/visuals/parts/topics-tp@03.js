QV.register('topic3', function (q) {
  const { s, svg, steps, slider, box, arrow, axes, line, plot, table, fmt } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const tx = (g, x, y, text, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls || null }, g, text);
  const nf = (v, d) => Number(v).toLocaleString('en-US', { maximumFractionDigits: d == null ? 2 : d });
  const bin8 = v => v.toString(2).padStart(8, '0');
  const hex2 = v => v.toString(16).toUpperCase().padStart(2, '0');
  // each figure is isolated so one failure leaves the rest of the article drawn
  const fig = (name, fn) => { try { fn(); } catch (e) { QV.fail('topic3 ' + name, e); } };

  // Figure 1: a signal plus noise of size 1 / ratio (slides 4-6)
  fig('snr', () => {
    const RATIOS = [1, 2, 5, 10, 20, 50, 100, 1000];
    const g0 = svg(viz('snr'), 760, 220, { label: 'A sine signal with random noise added, for a chosen signal-to-noise voltage ratio', minWidth: 520 });
    const ax = axes(g0, { x: 60, y: 20, w: 680, h: 150, xd: [0, 2], yd: [-2, 2], yt: [-2, -1, 0, 1, 2], xl: 'time (two cycles)' });
    s('text', { x: 4, y: 12, class: 't-sm' }, g0, 'voltage');
    // fixed pseudo-random noise in [-1, 1] so the picture is the same on every load
    let seed = 7;
    const noise = Array.from({ length: 241 }, () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 1073741824 - 1; });
    plot(g0, ax, t => Math.sin(Math.PI * t), 0, 2, 200, 's-muted dash');
    const g = s('g', {}, g0);
    slider(viz('snr-slider'), { label: 'Vsignal / Vnoise', min: 0, max: 7, step: 1, value: 3, fmt: i => nf(RATIOS[i]) }, i => {
      const r = RATIOS[i], db = 20 * Math.log10(r);
      g.textContent = '';
      line(g, noise.map((n, k) => { const t = k / 120; return [ax.x(t), ax.y(Math.sin(Math.PI * t) + n / r)]; }), 's-pri');
      role('snr-v').textContent = nf(r);
      role('snr-p').textContent = nf(r * r);
      role('snr-db').textContent = fmt(db, 2) + ' dB';
      const extra = {
        1: 'The noise is as strong as the signal: 10 log₁₀ 1 = 0 dB.',
        10: 'This is the slide-6 example: Vsignal = 10 × Vnoise gives 20 log₁₀ 10 = 20 dB.',
        100: 'Sample 1, Q3: 100 × the voltage is 10,000 × the power, 40 dB. 20 dB would be the power formula used on a voltage ratio.',
      }[r] || '';
      role('snr-note').textContent = `20 log₁₀(${nf(r)}) = 10 log₁₀(${nf(r * r)}) = ${fmt(db, 2)} dB. ${extra}`;
    });
  });

  // Figure 2: an N-bit quantizer on 0..1 V and its error (slides 7-8)
  fig('quant', () => {
    const g0 = svg(viz('quant'), 760, 330, { label: 'One cycle of a signal, its quantized staircase for N bits, and the quantization error on a fixed scale', minWidth: 540 });
    const top = axes(g0, { x: 60, y: 20, w: 680, h: 170, xd: [0, 1], yd: [0, 1], yt: [0, 0.5, 1], yf: v => fmt(v) + ' V' });
    const bot = axes(g0, { x: 60, y: 222, w: 680, h: 70, xd: [0, 1], yd: [-0.25, 0.25], yt: [-0.25, 0, 0.25], xl: 'time (one cycle)' });
    s('text', { x: 4, y: 210, class: 't-sm' }, g0, 'error (V)');
    const sig = t => 0.5 + 0.47 * Math.sin(2 * Math.PI * t);
    plot(g0, top, sig, 0, 1, 200, 's-muted');
    const g = s('g', {}, g0);
    slider(viz('quant-slider'), { label: 'bits per sample N', min: 1, max: 8, step: 1, value: 3 }, N => {
      const L = 2 ** N, d = 1 / L;
      const qv = x => (Math.min(Math.floor(x / d), L - 1) + 0.5) * d;
      g.textContent = '';
      if (N <= 4) for (let k = 0; k < L; k++) s('line', { x1: top.x(0), x2: top.x(1), y1: top.y((k + 0.5) * d), y2: top.y((k + 0.5) * d), class: 's-line dash' }, g);
      const pts = [], err = [];
      for (let i = 0; i <= 800; i++) {
        const t = i / 800, x = sig(t);
        pts.push([top.x(t), top.y(qv(x))]);
        err.push([bot.x(t), bot.y(x - qv(x))]);
      }
      line(g, pts, 's-pri');
      line(g, err, 's-sec');
      [d / 2, -d / 2].forEach(e => s('line', { x1: bot.x(0), x2: bot.x(1), y1: bot.y(e), y2: bot.y(e), class: 's-sec dash', style: 'stroke-width: 1' }, g));
      tx(g, bot.x(1) - 4, bot.y(d / 2) - 8, '±δ/2', 't-sec t-sm halo', 'end');
      const mv = v => Number((v * 1000).toPrecision(3)).toString();
      role('q-levels').textContent = nf(L);
      role('q-step').textContent = mv(d);
      role('q-err').textContent = mv(d / 2);
      role('q-sqnr').textContent = (6.02 * N).toFixed(2);
    });
  });

  // Figure 3: smallest N with 6.02N >= target (slide 9)
  fig('bits', () => {
    const g0 = svg(viz('bits'), 760, 290, { label: 'Bars of 6.02N dB for N = 1 to 20 against a target SQNR line', minWidth: 540 });
    const ax = axes(g0, { x: 60, y: 24, w: 680, h: 210, xd: [0.5, 20.5], yd: [0, 125], yt: [0, 20, 40, 60, 80, 100, 120], xt: Array.from({ length: 20 }, (_, i) => i + 1), xl: 'bits per sample N', yl: 'SQNR (dB)' });
    const g = s('g', {}, g0);
    const bw = 680 / 20 * 0.66;
    slider(viz('bits-slider'), { label: 'target SQNR', min: 20, max: 120, step: 1, value: 50, fmt: v => v + ' dB' }, T => {
      const n1 = Math.ceil(T / 6.02 - 1e-9), n2 = Math.ceil((T - 1.76) / 6.02 - 1e-9);
      g.textContent = '';
      for (let N = 1; N <= 20; N++) {
        const v = 6.02 * N;
        s('rect', { x: ax.x(N) - bw / 2, y: ax.y(v), width: bw, height: ax.y(0) - ax.y(v), class: N === n1 ? 'f-ok' : N < n1 ? 'f-seg box' : 'f-pri-soft' }, g);
        s('circle', { cx: ax.x(N), cy: ax.y(v + 1.76), r: 2.6, class: 'f-ter' }, g);
      }
      s('line', { x1: ax.x(0.5), x2: ax.x(20.5), y1: ax.y(T), y2: ax.y(T), class: 's-fg dash' }, g);
      tx(g, ax.x(0.5) + 6, ax.y(T) - 9, `target ${T} dB`, 't-fg t-bold halo');
      tx(g, ax.x(n1), ax.y(6.02 * n1) - 18, (6.02 * n1).toFixed(2), 't-ok t-bold halo', 'middle');
      role('b-n').textContent = n1;
      role('b-n2').textContent = n2;
      role('b-lv').textContent = nf(2 ** n1);
      let t = `${T} / 6.02 = ${(T / 6.02).toFixed(2)} → round up → N = ${n1}. Check: ${n1 - 1} bits give ${(6.02 * (n1 - 1)).toFixed(2)} dB, below ${T}; ${n1} bits give ${(6.02 * n1).toFixed(2)} dB.`;
      if (n2 !== n1) t += ` With 6.02N + 1.76 the answer is ${n2} bits, so say which formula you use.`;
      role('bits-note').textContent = t;
    });
  });

  // Figure 4: Table 6.2 bitrates (slides 11-12)
  fig('rate', () => {
    const ROWS = [
      { name: 'Telephone', fs: 8000, b: 8, ch: 1, top: 3400, slide: '8' },
      { name: 'AM radio', fs: 11025, b: 8, ch: 1, top: 5500, slide: '11.0' },
      { name: 'FM radio', fs: 22050, b: 16, ch: 2, top: 11000, slide: '88.2' },
      { name: 'CD', fs: 44100, b: 16, ch: 2, top: 20000, slide: '176.4' },
      { name: 'CD in mono', fs: 44100, b: 16, ch: 1, top: 20000, slide: null },
    ];
    const g0 = svg(viz('rate'), 760, 236, { label: 'Uncompressed bitrates of Table 6.2 as bars in kbps', minWidth: 520 });
    const X0 = 130, W = 600, MAX = 1600, xs = v => X0 + v / MAX * W;
    [0, 400, 800, 1200, 1600].forEach(v => {
      s('line', { x1: xs(v), x2: xs(v), y1: 16, y2: 196, class: 'l-grid' }, g0);
      tx(g0, xs(v), 208, String(v), 't-sm', 'middle');
    });
    tx(g0, X0 + W / 2, 226, 'kbps = fₛ × bits × channels / 1000', 't-sm', 'middle');
    const g = s('g', {}, g0);
    steps(viz('rate-steps'), ROWS.map(r => r.name), k => {
      g.textContent = '';
      ROWS.forEach((r, i) => {
        const kbps = r.fs * r.b * r.ch / 1000, y = 22 + i * 35;
        tx(g, 0, y + 11, r.name, i === k ? 't-pri t-bold' : 't-fg');
        s('rect', { x: X0, y, width: xs(kbps) - X0, height: 22, class: i === k ? 'f-pri' : 'f-pri-soft' }, g);
        tx(g, xs(kbps) + 6, y + 11, nf(kbps, 1), i === k ? 't-pri t-bold' : 't-muted');
      });
      const r = ROWS[k], bps = r.fs * r.b * r.ch, Bps = bps / 8;
      role('rate-calc').textContent = [
        `${nf(r.fs)} samples/s × ${r.b} bits × ${r.ch} channel${r.ch > 1 ? 's' : ''} = ${nf(bps)} bit/s = ${nf(bps / 1000, 1)} kbps`,
        `${nf(bps)} / 8 = ${nf(Bps)} bytes/s = ${nf(Bps / 1000, 3)} kB/s` + (r.slide ? `        slide: ${r.slide} kB/s` : '        half the stereo CD: mono halves it'),
        `1 minute = ${nf(Bps / 1000, 3)} × 60 = ${nf(Bps * 60 / 1000, 1)} kB`,
        `Nyquist: 2 × ${nf(r.top)} Hz = ${nf(2 * r.top)} ≤ ${nf(r.fs)} Hz  ✓`,
      ].join('\n');
    }, 3);
  });

  // Figure 5: ADSR envelope (slides 25-26, Fig. 6.10)
  fig('adsr', () => {
    const g0 = svg(viz('adsr'), 760, 250, { label: 'A note as a wave inside its attack, decay, sustain and release envelope', minWidth: 520 });
    const ax = axes(g0, { x: 40, y: 16, w: 700, h: 180, xd: [0, 10], yd: [-1.15, 1.15], xl: 'time' });
    const P = [[0, 0], [1, 1], [2.5, 0.6], [7, 0.6], [9.5, 0]];
    const env = t => {
      if (t >= 9.5) return 0;
      for (let i = 0; i < 4; i++) if (t <= P[i + 1][0]) return P[i][1] + (P[i + 1][1] - P[i][1]) * (t - P[i][0]) / (P[i + 1][0] - P[i][0]);
      return 0;
    };
    plot(g0, ax, t => env(t) * Math.sin(2 * Math.PI * 3 * t), 0, 10, 1200, 's-muted');
    s('line', { x1: ax.x(0), x2: ax.x(10), y1: ax.y(0), y2: ax.y(0), class: 'l-grid' }, g0);
    [[0, 'Note On'], [7, 'Note Off']].forEach(([t, l]) => {
      s('line', { x1: ax.x(t), x2: ax.x(t), y1: ax.y(1.15), y2: ax.y(-1.15), class: 's-fg dash', style: 'stroke-width: 1' }, g0);
      tx(g0, ax.x(t), 214, l, 't-fg t-bold', t ? 'middle' : 'start');
    });
    const NAMES = ['Attack', 'Decay', 'Sustain', 'Release'];
    const NOTES = [
      'All four phases. The envelope only shapes the amplitude; the pitch of the wave stays the same throughout.',
      'Attack: Note On arrives and the amplitude rises from 0 to its peak.',
      'Decay: right after the peak the amplitude falls back to the sustain level.',
      'Sustain: while the key is held the amplitude stays at the sustain level, however long that is.',
      'Release: Note Off arrives and the amplitude falls to 0. The sound does not stop at the instant the key is let go.',
    ];
    const g = s('g', {}, g0);
    steps(viz('adsr-steps'), ['All', ...NAMES], k => {
      g.textContent = '';
      for (let i = 0; i < 4; i++) {
        const on = k === 0 || k === i + 1, a = P[i], b = P[i + 1];
        if (on) {
          const area = [[ax.x(a[0]), ax.y(0)], [ax.x(a[0]), ax.y(a[1])], [ax.x(b[0]), ax.y(b[1])], [ax.x(b[0]), ax.y(0)]];
          s('path', { d: 'M' + area.map(p => p.join(' ')).join(' L') + ' Z', class: 'area-pri' }, g);
        }
        line(g, [[ax.x(a[0]), ax.y(a[1])], [ax.x(b[0]), ax.y(b[1])]], on ? 's-pri' : 's-muted');
        line(g, [[ax.x(a[0]), ax.y(-a[1])], [ax.x(b[0]), ax.y(-b[1])]], (on ? 's-pri' : 's-muted') + ' dash');
        const mid = (a[0] + b[0]) / 2;
        tx(g, ax.x(mid), ax.y(1.05), NAMES[i], (on ? 't-pri t-bold' : 't-muted') + ' halo', 'middle');
      }
      role('adsr-note').textContent = NOTES[k];
    });
  });

  // Figure 6: 10-bit bytes and a chord on a 31.25 kbps wire (slides 31, 34)
  fig('wire', () => {
    const g0 = svg(viz('wire'), 760, 230, { label: 'One MIDI byte with start and stop bits, and a timeline of Note On and Note Off messages at 31.25 kbps', minWidth: 540 });
    const C = 38, F0 = 190;
    tx(g0, F0 - 10, 34, 'one byte = 10 bits', 't-fg t-bold', 'end');
    const bits = ['start', ...bin8(0x90).split(''), 'stop'];
    bits.forEach((b, i) => {
      const edge = i === 0 || i === 9;
      s('rect', { x: F0 + i * C, y: 20, width: C, height: 28, class: (edge ? 'f-ter-soft' : b === '1' ? 'f-pri' : 'f-seg') + ' sep' }, g0);
      tx(g0, F0 + i * C + C / 2, 34, b, edge ? 't-fg t-sm' : b === '1' ? 't-on' : 't-muted', 'middle');
    });
    tx(g0, F0 + 5 * C, 62, '8 bits of the byte, here &H90 = 1001 0000', 't-sm', 'middle');
    const ax = axes(g0, { x: 40, y: 92, w: 700, h: 70, xd: [0, 20], yd: [0, 1], xt: [0, 5, 10, 15, 20], xl: 'time (ms) at 31,250 bit/s; one 3-byte message = 30 bits = 0.96 ms' });
    const g = s('g', {}, g0);
    slider(viz('wire-slider'), { label: 'notes in the chord', min: 1, max: 10, step: 1, value: 10 }, n => {
      g.textContent = '';
      const ms = 30 / 31250 * 1000;
      for (let i = 0; i < 2 * n; i++) {
        const off = i >= n, x = ax.x(i * ms);
        s('rect', { x: x + 0.5, y: 104, width: ax.x(ms) - ax.x(0) - 1, height: 46, rx: 2, class: off ? 'f-sec' : 'f-pri' }, g);
        tx(g, x + (ax.x(ms) - ax.x(0)) / 2, 127, off ? 'Off' : 'On', 't-on t-sm', 'middle');
      }
      [n * ms, 2 * n * ms].forEach(t => s('line', { x1: ax.x(t), x2: ax.x(t), y1: 96, y2: 158, class: 's-fg dash', style: 'stroke-width: 1' }, g));
      role('w-bits').textContent = String(30 * n);
      role('w-on').textContent = fmt(n * ms, 2) + ' ms';
      role('w-off').textContent = fmt(2 * n * ms, 2) + ' ms';
    });
  });

  // Figure 7: parse a MIDI byte stream (slides 25, 35, Table 6.3)
  fig('stream', () => {
    const MSG = [
      { bytes: [0x90, 0x3C, 0x64], d: ['key number', 'velocity'], hear: 'Piano on channel 0: plays key 60 at velocity 100.', ok: true },
      { bytes: [0x91, 0x40, 0x50], d: ['key number', 'velocity'], hear: 'Piano on channel 0: ignores it. The message is for channel 1.', ok: false },
      { bytes: [0xC0, 0x05], d: ['program number'], hear: 'Piano on channel 0: switches to program (patch) 5. Instruments can change midstream.', ok: true },
      { bytes: [0x80, 0x3C, 0x00], d: ['key number', 'velocity'], hear: 'Piano on channel 0: stops key 60.', ok: true },
    ];
    const TYPES = { 8: 'Note off', 9: 'Note on', 10: 'Poly key pressure', 11: 'Control change', 12: 'Program change', 13: 'Channel pressure', 14: 'Pitch bend' };
    const g0 = svg(viz('stream'), 760, 290, { label: 'Eleven MIDI bytes split into four messages, with the selected status byte decoded into flag, message type and channel', minWidth: 560 });
    const BW = 56, GAP = 4, MG = 14;
    let x = (760 - (11 * BW + 7 * GAP + 3 * MG)) / 2;
    const pos = MSG.map(m => { const xs = m.bytes.map((_, i) => x + i * (BW + GAP)); x = xs[xs.length - 1] + BW + MG; return xs; });
    const g = s('g', {}, g0);
    const NOTE0 = 'Bytes 0x90, 0x91, 0xC0 and 0x80 have bit 7 = 1 (blue): each one starts a message. The others have bit 7 = 0 and are data. So the stream splits into 3 + 3 + 2 + 3 bytes without any separator.';
    steps(viz('stream-steps'), ['All 11 bytes', 'Message 1', 'Message 2', 'Message 3', 'Message 4'], k => {
      g.textContent = '';
      MSG.forEach((m, mi) => {
        const grp = s('g', { class: 'fade' + (k && k !== mi + 1 ? ' dim' : '') }, g);
        const xs = pos[mi];
        tx(grp, (xs[0] + xs[xs.length - 1] + BW) / 2, 14, 'message ' + (mi + 1), 't-sm', 'middle');
        m.bytes.forEach((b, i) => {
          const st = b >= 128;
          s('rect', { x: xs[i], y: 26, width: BW, height: 32, rx: 3, class: st ? 'f-pri' : 'f-seg box' }, grp);
          tx(grp, xs[i] + BW / 2, 42, hex2(b), (st ? 't-on' : 't-fg') + ' t-lg t-bold', 'middle');
          tx(grp, xs[i] + BW / 2, 70, bin8(b), 't-sm', 'middle');
        });
      });
      if (!k) {
        tx(g, 40, 120, 'bit 7 = 1  →  status byte, 128 to 255, starts a new message', 't-pri t-bold');
        tx(g, 40, 144, 'bit 7 = 0  →  data byte, 0 to 127, a value for the message before it', 't-fg t-bold');
        tx(g, 40, 168, 'status byte = 1 ttt nnnn: three message bits (Table 6.3), four channel bits', 't-fg');
        role('stream-note').textContent = NOTE0;
        return;
      }
      const m = MSG[k - 1], st = m.bytes[0], C = 40, X = 40, Y = 120;
      tx(g, X, 102, `status byte &H${hex2(st)} = ${st}`, 't-fg t-bold');
      bin8(st).split('').forEach((b, i) => {
        const cls = i === 0 ? 'f-pri' : i < 4 ? 'f-pri-soft' : 'f-ter-soft';
        s('rect', { x: X + i * C, y: Y, width: C, height: 30, class: cls + ' sep' }, g);
        tx(g, X + i * C + C / 2, Y + 15, b, i === 0 ? 't-on t-bold' : 't-fg t-bold', 'middle');
      });
      const t = (st >> 4) & 7, n = st & 15;
      [[X + C / 2, 'flag', '1 = status'], [X + 2.5 * C, 'message', bin8(st).slice(1, 4) + ' = ' + TYPES[st >> 4]], [X + 6 * C, 'channel', bin8(st).slice(4) + ' = ' + n]].forEach(([cx, a, b]) => {
        tx(g, cx, Y + 46, a, 't-sm', 'middle');
        tx(g, cx, Y + 62, b, 't-fg t-bold', 'middle');
      });
      s('line', { x1: X + C, x2: X + C, y1: Y - 4, y2: Y + 34, class: 's-fg', style: 'stroke-width: 2' }, g);
      s('line', { x1: X + 4 * C, x2: X + 4 * C, y1: Y - 4, y2: Y + 34, class: 's-fg', style: 'stroke-width: 2' }, g);
      m.bytes.slice(1).forEach((b, i) => tx(g, 420, 116 + i * 24, `data ${i + 1}: ${bin8(b)} = ${b}  ${m.d[i]}`, 't-fg'));
      if (m.bytes.length === 2) tx(g, 420, 140, 'no data 2: program change has one', 't-muted');
      tx(g, 40, 230, m.hear, (m.ok ? 't-ok' : 't-sec') + ' t-bold t-lg');
      role('stream-note').textContent = `${TYPES[st >> 4]} = &H${(st >> 4).toString(16).toUpperCase()}n with n = ${n}, so the status byte is &H${hex2(st)}. Message bits ${t.toString(2).padStart(3, '0')}, channel bits ${bin8(st).slice(4)}.`;
    });
  });

  // Figure 8: a signal through the PCM encoder and decoder (slide 44, Fig. 6.15)
  fig('pcm', () => {
    const MU = 255, K = 32, BITS = 4, LV = 2 ** BITS, D = 2 / LV;
    const speech = t => 0.55 * Math.sin(2 * Math.PI * 2 * t) + 0.3 * Math.sin(2 * Math.PI * 5 * t + 0.6);
    const hiss = t => 0.08 * Math.sin(2 * Math.PI * 41 * t) + 0.05 * Math.sin(2 * Math.PI * 67 * t);
    const C = x => Math.sign(x) * Math.log(1 + MU * Math.abs(x)) / Math.log(1 + MU);
    const E = y => Math.sign(y) * (Math.pow(1 + MU, Math.abs(y)) - 1) / MU;
    const code = y => Math.max(0, Math.min(LV - 1, Math.floor((y + 1) / D)));
    const rec = c => -1 + (c + 0.5) * D;
    const codes = Array.from({ length: K }, (_, k) => code(C(speech((k + 0.5) / K))));
    const hold = t => rec(codes[Math.min(K - 1, Math.floor(t * K))]);
    const N = 640, W = N / K;
    const exp = Array.from({ length: N }, (_, i) => E(hold((i + 0.5) / N)));
    // moving average over one sample period stands in for the low-pass filter
    const lp = exp.map((_, i) => { let a = 0, c = 0; for (let j = i - W / 2; j < i + W / 2; j++) { const v = exp[Math.max(0, Math.min(N - 1, j))]; a += v; c++; } return a / c; });

    const g0 = svg(viz('pcm'), 760, 400, { label: 'Fig. 6.15 encoder and decoder blocks, with the signal after the selected block plotted below', minWidth: 560 });
    const BWD = 120, BG = 28, BX = 24;
    const ENC = ['input analog\nspeech', 'bandlimiting\nfilter', 'μ-law or A-law\ncompressor', 'linear PCM', 'transmission'];
    const DEC = ['digital-to-analog\nconverter', 'μ-law or A-law\nexpander', 'low-pass\nfilter', 'output analog\nspeech'];
    tx(g0, BX, 10, 'Encoder', 't-fg t-bold');
    tx(g0, BX, 104, 'Decoder', 't-fg t-bold');
    for (let i = 0; i < 4; i++) {
      const xa = BX + i * (BWD + BG) + BWD;
      arrow(g0, xa + 2, 44, xa + BG - 2, 44);
      if (i < 3) arrow(g0, xa + 2, 138, xa + BG - 2, 138);
    }
    const tx5 = BX + 4 * (BWD + BG) + BWD / 2;
    line(g0, [[tx5, 66], [tx5, 86], [BX + BWD / 2, 86], [BX + BWD / 2, 112]], 's-muted dash');
    s('polygon', { points: `${BX + BWD / 2},${116} ${BX + BWD / 2 - 4},${108} ${BX + BWD / 2 + 4},${108}`, class: 'a-muted' }, g0);
    const gb = s('g', {}, g0);
    const ax = axes(g0, { x: 50, y: 186, w: 690, h: 160, xd: [0, 1], yd: [-1.1, 1.1], yt: [-1, 0, 1], xl: 'time' });
    const g = s('g', {}, g0);
    const curve = (f, cls) => plot(g, ax, f, 0, 1, 500, cls);
    const arr = (a, cls) => line(g, a.map((v, i) => [ax.x((i + 0.5) / N), ax.y(v)]), cls);
    const NOTES = [
      'Input analog speech: the wanted sound plus fast high-frequency noise.',
      'Bandlimiting filter: the frequencies above the band are screened out, so the high-frequency noise is gone.',
      'μ-law compressor: quiet parts are boosted and loud parts squeezed, y = ln(1 + μ|x|) / ln(1 + μ). Faint: the signal before it.',
      'Linear PCM: 32 samples, each rounded to one of 16 equal levels of the compressed signal. Uniform steps in this bent signal are fine steps for quiet sounds and coarse steps for loud ones.',
      'Transmission: each sample is sent as a 4-bit codeword, level 0 = 0000 to level 15 = 1111. Columns are samples, read top to bottom; blue = 1.',
      'Digital-to-analog converter: each codeword becomes its level again and is held until the next sample, a staircase of the compressed signal.',
      'μ-law expander: the inverse curve undoes the compression. Near 0 the steps are tiny; at the peaks they are large, so loud parts come back coarser.',
      'Low-pass filter: smooths the staircase, with the same cutoff as the top of the bandlimiting filter. Green: output speech; faint: the band-limited input. The difference is the quantization loss.',
    ];
    steps(viz('pcm-steps'), ['Input', 'Bandlimit', 'Compress', 'Linear PCM', 'Transmit', 'DAC', 'Expand', 'Low-pass'], k => {
      gb.textContent = '';
      g.textContent = '';
      const hiE = k <= 4 ? k : -1, hiD = k >= 5 ? k - 5 : -1;
      ENC.forEach((l, i) => box(gb, BX + i * (BWD + BG), 22, BWD, 44, l, { cls: i === hiE ? 'f-pri' : 'f-surface', textCls: (i === hiE ? 't-on' : 't-fg') + ' t-sm', lh: 13 }));
      DEC.forEach((l, i) => box(gb, BX + i * (BWD + BG), 116, BWD, 44, l, { cls: i === hiD || (k === 7 && i === 3) ? 'f-pri' : 'f-surface', textCls: (i === hiD || (k === 7 && i === 3) ? 't-on' : 't-fg') + ' t-sm', lh: 13 }));
      if (k > 0 && k !== 4) curve(speech, 's-muted');
      if (k === 0) curve(t => speech(t) + hiss(t), 's-pri');
      if (k === 1) curve(speech, 's-pri');
      if (k === 2) curve(t => C(speech(t)), 's-pri');
      if (k === 3) {
        for (let c = 0; c < LV; c++) s('line', { x1: ax.x(0), x2: ax.x(1), y1: ax.y(rec(c)), y2: ax.y(rec(c)), class: 's-line dash' }, g);
        curve(t => C(speech(t)), 's-muted dash');
        codes.forEach((c, i) => {
          const t = (i + 0.5) / K;
          s('line', { x1: ax.x(t), x2: ax.x(t), y1: ax.y(0), y2: ax.y(rec(c)), class: 's-pri', style: 'stroke-width: 1.5' }, g);
          s('circle', { cx: ax.x(t), cy: ax.y(rec(c)), r: 3.5, class: 'f-pri' }, g);
        });
      }
      if (k === 4) {
        const cw = 690 / K, ch = 26, y0 = 200;
        codes.forEach((c, i) => c.toString(2).padStart(BITS, '0').split('').forEach((b, r) => {
          s('rect', { x: 50 + i * cw, y: y0 + r * ch, width: cw, height: ch, class: (b === '1' ? 'f-pri' : 'f-seg') + ' sep' }, g);
          tx(g, 50 + i * cw + cw / 2, y0 + r * ch + ch / 2, b, b === '1' ? 't-on t-sm' : 't-muted t-sm', 'middle');
        }));
        tx(g, 50, 320, `${K} samples × ${BITS} bits = ${K * BITS} bits sent`, 't-fg t-bold');
      }
      if (k === 5) line(g, Array.from({ length: N + 1 }, (_, i) => [ax.x(i / N), ax.y(hold(Math.min(i / N, 0.9999)))]), 's-pri');
      if (k === 6) arr(exp, 's-pri');
      if (k === 7) arr(lp, 's-ok');
      role('pcm-note').textContent = NOTES[k];
    });
  });

  // Cheat sheet
  fig('cheat', () => {
    table(viz('cheat'), [{ text: 'Fact or formula', cls: 'l' }, { text: 'Value or example', cls: 'l' }], [
      ['1 bel', '10 dB'],
      ['SNR from powers', '10 log₁₀(Ps / Pn)'],
      ['SNR from voltages', '20 log₁₀(Vs / Vn), since power ∝ V²'],
      ['×10 voltage · ×10 power', '+20 dB · +10 dB'],
      ['×2 voltage · ×2 power', '+6.02 dB · +3.01 dB'],
      ['0 dB in Table 1', 'just-audible sound at 1 kHz'],
      ['levels · step · largest error', '2ᴺ · range / 2ᴺ · step / 2'],
      ['SQNR', '20 log₁₀(2ᴺ⁻¹ / ½) = 6.02N dB; realistic 6.02N + 1.76'],
      ['8 · 12 · 16 bits', '48.16 · 72.24 · 96.32 ≈ 96 dB'],
      ['bits for target T', 'N = ⌈T / 6.02⌉; 50 dB → 9 bits'],
      ['bitrate', 'fₛ × bits × channels; ÷ 8 for bytes'],
      ['CD · telephone', '1,411.2 kbps = 176.4 kB/s · 64 kbps = 8 kB/s'],
      ['speech · music band', '50 Hz–10 kHz · 20 Hz–20 kHz'],
      ['decoder filter', 'low-pass after DA, same cutoff as bandpass top'],
      ['MIDI', 'early 1980s protocol; codes events; 3 min ≈ 3 kB'],
      ['status · data byte', '1ttt nnnn, 128–255 · 0ddddddd, 0–127'],
      ['channels', '16, numbered 0–15, low four bits'],
      ['Note On · Note Off', '&H9n · &H8n; then key number, velocity'],
      ['MIDI wire', '31.25 kbps, 10-bit bytes; 3-byte message = 0.96 ms'],
      ['General MIDI', '128 patches, ch 10 percussion, 47 drums, ≥ 24 voices'],
      ['ports', 'IN, OUT, THRU (copies IN); half-duplex'],
      ['envelope', 'attack, decay, sustain, release'],
      ['compression stages', 'transformation, loss (quantization), coding'],
      ['PCM encoder', 'bandlimiting filter → compressor → linear PCM'],
      ['PCM decoder', 'DAC → expander → low-pass filter'],
    ].map(([a, b]) => [{ text: a, cls: 'l' }, { text: b, cls: 'l' }]));
  });
});
