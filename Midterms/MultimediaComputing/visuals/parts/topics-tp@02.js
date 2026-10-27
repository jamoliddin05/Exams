QV.register('topic2', function (q) {
  const { s, svg, steps, slider, axes, line, plot, table, fmt } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const fig = (name, fn) => { try { fn(); } catch (e) { QV.fail('topic2 ' + name, e); } };
  const tx = (g, x, y, text, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls || null }, g, text);
  const comma = n => {
    const [i, d] = String(n).split('.');
    return i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (d ? '.' + d : '');
  };
  const pathOf = pts => pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');

  // Figure 1: superposition of slide 12's five sine waves
  fig('cx', () => {
    const H = [[1, 1, '1'], [2, 0.5, '0.5'], [3, 0.33, '0.33'], [4, 0.25, '0.25'], [5, 0.5, '0.5']];
    const sum = (k, t) => H.slice(0, k).reduce((a, [m, w]) => a + w * Math.sin(2 * Math.PI * m * t), 0);
    const g0 = svg(viz('cx'), 760, 250, { label: 'A sum of sine waves at 1 to 5 times the fundamental frequency, with its weights as bars', minWidth: 560 });
    const tl = { 0: '0', 0.5: '0.5T', 1: 'T', 1.5: '1.5T', 2: '2T' };
    const L = axes(g0, { x: 44, y: 16, w: 470, h: 180, xd: [0, 2], yd: [-2, 2], xt: [0, 0.5, 1, 1.5, 2], yt: [-2, -1, 0, 1, 2], xf: v => tl[v], xl: 'time, in periods T of the fundamental' });
    const R = axes(g0, { x: 588, y: 16, w: 150, h: 180, xd: [0, 6], yd: [0, 1.2], xt: [1, 2, 3, 4, 5], yt: [0, 0.5, 1], xf: v => v + 'f', xl: 'frequency' });
    const g = s('g', {}, g0);
    const NOTES = [
      'The fundamental alone: one sine wave at frequency f with weight 1. A simple signal, which "cannot be decomposed into simpler signals".',
      'Add 0.5 × a sine at 2f. The sum is no longer a sine wave, and it still repeats every period T of the fundamental.',
      'Add 0.33 × a sine at 3f. Each new wave changes the shape and leaves the period alone.',
      'Add 0.25 × a sine at 4f. The shape gets more detail, because faster waves carry the fine wiggles.',
      'Add 0.5 × a sine at 5f. This is the composite signal of slide 12: five sine waves, so five bars. Fourier says every periodic, continuous signal can be built this way (section 10).',
    ];
    steps(viz('cx-steps'), ['f', '+ 0.5 × 2f', '+ 0.33 × 3f', '+ 0.25 × 4f', '+ 0.5 × 5f'], k => {
      g.textContent = '';
      const n = k + 1;
      if (k > 0) plot(g, L, t => sum(k, t), 0, 2, 400, 's-muted dash');
      const [m, w] = H[k];
      if (k > 0) plot(g, L, t => w * Math.sin(2 * Math.PI * m * t), 0, 2, 400, 's-ter').style.strokeWidth = '1.5';
      plot(g, L, t => sum(n, t), 0, 2, 400, 's-pri');
      H.forEach(([mm, ww, lab], i) => {
        const x = R.x(mm), y0 = R.y(0), y1 = R.y(ww);
        if (i < n) s('rect', { x: x - 6, y: y1, width: 12, height: y0 - y1, class: i === k && k > 0 ? 'f-ter' : 'f-pri' }, g);
        else s('rect', { x: x - 6, y: y1, width: 12, height: y0 - y1, class: 'f-none s-line dash' }, g);
        tx(g, x, y1 - 8, lab, 't-sm' + (i < n ? ' t-fg' : ''), 'middle');
      });
      role('cx-note').textContent = NOTES[k];
    }, 4);
  });

  // Figure 2: A/D on one signal, 8 kHz and 3 bits, then D/A
  fig('ad', () => {
    const x = t => 4 + 2.6 * Math.sin(2 * Math.PI * t / 1.5) + 0.9 * Math.sin(2 * Math.PI * 3 * t / 1.5 + 0.6);
    const T = 0.125, N = 12;
    const S = Array.from({ length: N }, (_, n) => {
      const v = x(n * T), k = Math.min(7, Math.max(0, Math.round(v)));
      return { t: n * T, v, k, code: k.toString(2).padStart(3, '0') };
    });
    const g0 = svg(viz('ad'), 760, 290, { label: 'An analog signal sampled every 125 microseconds, rounded to 8 levels with 3-bit codes, and joined back by D/A', minWidth: 560 });
    const A = axes(g0, { x: 56, y: 30, w: 600, h: 200, xd: [0, 1.5], yd: [0, 8], xt: [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5], yt: [0, 2, 4, 6, 8], grid: false, xf: v => (v === 1.5 ? '1.5 ms' : fmt(v)), yf: v => v + ' V' });
    const g = s('g', {}, g0);
    const NOTES = [
      'The analog signal x(t) has a value at every instant, and any value between 0 and 8 V. A computer cannot store infinitely many values.',
      'Sampling keeps x(t) only at t = nT, once every 125 µs. Twelve numbers remain, for example x(0) = 4.508 V. They are still exact values with any number of decimals.',
      'Quantization rounds each sample to the nearest level. b = 3 bits give 2³ = 8 levels, δ = 8 / 2³ = 1 V apart. 4.508 V becomes 5 V. The red gaps are the quantization error, here never more than half a step.',
      'Each level is stored as its 3-bit number: level 5 is 101. These codes are the digital signal, 12 samples × 3 bits = 36 bits.',
      'D/A conversion (interpolation) joins the stored levels back into a continuous signal, here with straight lines. It follows the original closely, and the rounding errors stay in it.',
    ];
    steps(viz('ad-steps'), ['Analog x(t)', 'Sample in time', 'Quantize in amplitude', 'Store the codes', 'D/A: interpolate'], k => {
      g.textContent = '';
      if (k >= 2) {
        for (let L = 0; L < 8; L++) {
          s('line', { x1: A.x(0), x2: A.x(1.5), y1: A.y(L), y2: A.y(L), class: 'l-grid' }, g);
          tx(g, A.x(1.5) + 8, A.y(L), L.toString(2).padStart(3, '0'), 't-sm t-pri');
        }
        s('line', { x1: A.x(0), x2: A.x(1.5), y1: A.y(8), y2: A.y(8), class: 's-muted dash', style: 'stroke-width: 1' }, g);
        tx(g, A.x(1.5) + 8, A.y(8), 'R = 8 V', 't-sm');
      }
      if (k >= 1) {
        S.forEach(p => s('line', { x1: A.x(p.t), x2: A.x(p.t), y1: A.y(0), y2: A.y(8), class: 'l-grid dash' }, g));
        s('path', { d: `M${A.x(0)} 14 L${A.x(0)} 20 L${A.x(T)} 20 L${A.x(T)} 14`, class: 's-fg', style: 'stroke-width: 1.2' }, g);
        tx(g, A.x(T) + 8, 16, 'T = 125 µs', 't-fg t-bold');
      }
      plot(g, A, x, 0, 1.5, 300, k >= 4 ? 's-sec dash' : 's-sec').style.strokeWidth = k >= 1 ? '1.5' : '2.5';
      if (k >= 4) line(g, S.map(p => [A.x(p.t), A.y(p.k)]), 's-pri');
      S.forEach(p => {
        if (k >= 1 && k < 2) s('line', { x1: A.x(p.t), x2: A.x(p.t), y1: A.y(0), y2: A.y(p.v), class: 's-sec', style: 'stroke-width: 1.2' }, g);
        if (k >= 2) s('line', { x1: A.x(p.t), x2: A.x(p.t), y1: A.y(p.v), y2: A.y(p.k), class: 's-bad', style: 'stroke-width: 3' }, g);
        if (k >= 1) s('circle', { cx: A.x(p.t), cy: A.y(p.v), r: k >= 2 ? 3 : 4.5, class: 'f-sec' }, g);
        if (k >= 2) s('circle', { cx: A.x(p.t), cy: A.y(p.k), r: 4.5, class: 'f-pri' }, g);
        if (k >= 3) tx(g, A.x(p.t), 272, p.code, 't-pri t-bold', 'middle');
      });
      if (k >= 3) tx(g, 0, 272, 'codes', 't-fg t-bold');
      role('ad-note').textContent = NOTES[k];
    }, 4);
  });

  // Figure 3: A, f and φ of A sin(2πft + φ)
  fig('sine', () => {
    const g0 = svg(viz('sine'), 760, 250, { label: 'A sine wave with adjustable amplitude, frequency and phase against a zero-phase reference, with the period and the time shift marked', minWidth: 560 });
    const X = axes(g0, { x: 56, y: 34, w: 680, h: 170, xd: [0, 10], yd: [-5.5, 5.5], xt: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], yt: [-5, 0, 5], xf: v => (v === 10 ? '10 ms' : String(v)), yf: v => v + ' V', xl: 'time t (ms)' });
    const g = s('g', {}, g0);
    const st = { A: 4, f: 500, p: 90 };
    const gcd = (a, b) => (b ? gcd(b, a % b) : a);
    const piFrac = p => {
      if (p === 0) return '0';
      const d = gcd(p, 180), n = p / d, m = 180 / d;
      return (n === 1 ? '' : n) + 'π' + (m === 1 ? '' : '/' + m);
    };
    function draw() {
      g.textContent = '';
      const { A, f, p } = st, T = 1000 / f, dt = p / 360 * T, ph = p * Math.PI / 180;
      plot(g, X, t => A * Math.sin(2 * Math.PI * f * t / 1000), 0, 10, 800, 's-sec dash').style.strokeWidth = '1.5';
      plot(g, X, t => A * Math.sin(2 * Math.PI * f * t / 1000 + ph), 0, 10, 800, 's-pri');
      s('path', { d: `M${X.x(0)} 14 L${X.x(0)} 20 L${X.x(T)} 20 L${X.x(T)} 14`, class: 's-fg', style: 'stroke-width: 1.2' }, g);
      tx(g, X.x(T) + 8, 16, `T = ${fmt(T)} ms`, 't-fg t-bold');
      const kr = Math.max(0, Math.ceil(p / 360 - 0.25 - 1e-9));
      const tr = (0.25 + kr) * T, ts = tr - dt, yp = X.y(A);
      s('circle', { cx: X.x(tr), cy: yp, r: 4, class: 'f-sec' }, g);
      s('circle', { cx: X.x(ts), cy: yp, r: 4, class: 'f-pri' }, g);
      if (dt > 1e-9 && p < 360) {
        QV.arrow(g, X.x(tr), yp - 10, X.x(ts), yp - 10, { cls: 'a-pri', width: 2 });
        tx(g, X.x(tr) + 8, yp - 10, `Δt = ${fmt(dt)} ms`, 't-pri t-bold halo');
      }
      role('sine-eq').textContent = `x(t) = ${fmt(A)} sin(2π·${f}t${p ? ' + ' + piFrac(p) : ''})`;
      role('sine-T').textContent = fmt(T) + ' ms';
      role('sine-rad').textContent = `${piFrac(p)} = ${fmt(ph, 3)}`;
      role('sine-dt').textContent = fmt(dt) + ' ms';
    }
    slider(viz('sine-a'), { label: 'amplitude A', min: 1, max: 5, step: 0.5, value: st.A, fmt: v => v + ' V' }, v => { st.A = v; draw(); });
    slider(viz('sine-f'), { label: 'frequency f', min: 200, max: 1000, step: 50, value: st.f, fmt: v => v + ' Hz' }, v => { st.f = v; draw(); });
    slider(viz('sine-p'), { label: 'phase φ', min: 0, max: 360, step: 15, value: st.p, fmt: v => v + '°' }, v => { st.p = v; draw(); });
  });

  // Figure 4: quantization of five samples in 0 to 8 V
  fig('qz', () => {
    const R = 8, X = [0.2, 2.6, 5.3, 6.8, 3.9];
    const g0 = svg(viz('qz'), 760, 250, { label: 'Five samples rounded to the nearest of 2 to the b levels between 0 and 8 volts, with codes and errors', minWidth: 560 });
    const A = axes(g0, { x: 56, y: 16, w: 600, h: 190, xd: [-0.5, 4.5], yd: [0, 8], xt: [0, 1, 2, 3, 4], yt: [0, 2, 4, 6, 8], grid: false, yf: v => v + ' V', xl: 'sample n' });
    const g = s('g', {}, g0);
    slider(viz('qz-slider'), { label: 'bits b', min: 2, max: 5, step: 1, value: 3 }, b => {
      g.textContent = '';
      const N = 2 ** b, d = R / N;
      for (let L = 0; L < N; L++) s('line', { x1: A.x(-0.5), x2: A.x(4.5), y1: A.y(L * d), y2: A.y(L * d), class: 'l-grid' }, g);
      s('line', { x1: A.x(-0.5), x2: A.x(4.5), y1: A.y(R), y2: A.y(R), class: 's-muted dash', style: 'stroke-width: 1' }, g);
      tx(g, A.x(4.5) + 8, A.y(R), 'R = 8 V', 't-sm');
      tx(g, A.x(4.5) + 8, A.y(0), 'level 0', 't-sm');
      const rows = X.map((v, n) => {
        const k = Math.min(N - 1, Math.max(0, Math.round(v / d))), xq = k * d, code = k.toString(2).padStart(b, '0');
        const cx = A.x(n);
        s('line', { x1: cx, x2: cx, y1: A.y(v), y2: A.y(xq), class: 's-bad', style: 'stroke-width: 3' }, g);
        s('circle', { cx, cy: A.y(v), r: 6.5, class: 's-sec', style: 'stroke-width: 2' }, g);
        s('circle', { cx, cy: A.y(xq), r: 4, class: 'f-pri' }, g);
        tx(g, cx + 12, A.y(xq), code, 't-pri t-bold halo');
        tx(g, cx - 12, A.y(v), fmt(v) + ' V', 't-sec t-sm halo', 'end');
        return [fmt(v) + ' V', fmt(v / d, 3), String(k), fmt(xq, 3) + ' V', code, fmt(Math.abs(v - xq), 3) + ' V'];
      });
      const host = viz('qz-table');
      host.textContent = '';
      table(host, [{ html: 'sample x<sub>s</sub>' }, { html: 'x<sub>s</sub> / δ' }, 'nearest level', { html: 'x<sub>q</sub>' }, 'code', 'error'], rows);
      role('qz-levels').textContent = String(N);
      role('qz-levels-sub').textContent = '2' + '⁰¹²³⁴⁵'[b];
      role('qz-step').textContent = fmt(d, 4) + ' V';
      role('qz-step-sub').textContent = `δ = R / 2${'⁰¹²³⁴⁵'[b]} = 8 / ${N}`;
      role('qz-err').textContent = fmt(d / 2, 4) + ' V';
    });
  });

  // Figure 5: bit rate as the area fs × (b × channels)
  fig('br', () => {
    const P = [
      { name: 'Speech', fs: 8000, b: 8, c: 1 },
      { name: 'AM radio', fs: 11000, b: 8, c: 1 },
      { name: 'Teleconferencing', fs: 16000, b: 16, c: 1 },
      { name: 'FM radio', fs: 22000, b: 16, c: 2 },
      { name: 'Audio CD', fs: 44100, b: 16, c: 2 },
    ];
    const g0 = svg(viz('br'), 760, 270, { label: 'Rectangles of width samples per second and height bits per instant; the area is the bit rate', minWidth: 560 });
    const A = axes(g0, { x: 76, y: 30, w: 640, h: 192, xd: [0, 45000], yd: [0, 34], xt: [0, 10000, 20000, 30000, 40000], yt: [0, 8, 16, 32], xf: v => (v ? v / 1000 + 'k' : '0'), yf: v => v + ' bits', xl: 'samples per second, fs', yl: 'bits per sampling instant = bits per sample × channels' });
    const g = s('g', {}, g0);
    steps(viz('br-steps'), P.map(p => p.name), k => {
      g.textContent = '';
      P.forEach((p, i) => {
        if (i === k) return;
        s('rect', { x: A.x(0), y: A.y(p.b * p.c), width: A.x(p.fs) - A.x(0), height: A.y(0) - A.y(p.b * p.c), class: 'f-none s-muted dash', style: 'stroke-width: 1' }, g);
      });
      const p = P[k], h = p.b * p.c, rate = p.fs * h;
      const x1 = A.x(p.fs), y1 = A.y(h);
      s('rect', { x: A.x(0), y: y1, width: x1 - A.x(0), height: A.y(0) - y1, class: 'f-pri-soft s-pri', style: 'stroke-width: 2' }, g);
      const cx = (A.x(0) + x1) / 2, cy = (y1 + A.y(0)) / 2;
      tx(g, cx, cy - 8, p.name, 't-fg t-bold', 'middle');
      tx(g, cx, cy + 8, comma(rate) + ' bps', 't-pri t-bold', 'middle');
      tx(g, x1 + 6, y1 + 10, `${comma(p.fs)} × ${p.b} × ${p.c}`, 't-pri t-sm halo');
      const T = 1e6 / p.fs, bits = rate * 60, bytes = bits / 8;
      role('br-calc').textContent = [
        `bit rate = fs × bits per sample × channels`,
        `         = ${comma(p.fs)} × ${p.b} × ${p.c} = ${comma(rate)} bps = ${comma(fmt(rate / 1000, 1))} kbps`,
        `one sample period T = 1/${comma(p.fs)} s = ${fmt(T, 2)} µs, ${h} bits each`,
        `1 minute = ${comma(rate)} × 60 = ${comma(bits)} bits; / 8 = ${comma(bytes)} bytes = ${fmt(bytes / 1e6, 3)} MB`,
      ].join('\n');
    }, 4);
  });

  // Figure 6: aliasing at fs = 8 kHz, time view and folding diagram
  fig('al', () => {
    const FS = 8, PH = Math.PI / 4;
    const gT = svg(viz('al-time'), 760, 200, { label: 'A tone over one millisecond, its samples at 8 kHz, and the slowest wave through the samples', minWidth: 560 });
    const T = axes(gT, { x: 44, y: 10, w: 696, h: 140, xd: [0, 1], yd: [-1.3, 1.3], xt: [0, 0.25, 0.5, 0.75, 1], yt: [-1, 0, 1], xf: v => (v === 1 ? '1 ms' : fmt(v)), xl: 'time (ms)' });
    const t1 = s('g', {}, gT);
    const gF = svg(viz('al-fold'), 760, 230, { label: 'Heard frequency against tone frequency at 8 kHz sampling: a zigzag between 0 and 4 kHz', minWidth: 560 });
    const F = axes(gF, { x: 56, y: 36, w: 660, h: 140, xd: [0, 16], yd: [0, 4.6], xt: [0, 2, 4, 6, 8, 10, 12, 14, 16], yt: [0, 1, 2, 3, 4], xl: 'tone frequency f (kHz)' });
    s('text', { x: 0, y: 0, transform: `translate(14 ${F.y(2.3)}) rotate(-90)`, 'text-anchor': 'middle' }, gF, 'heard (kHz)');
    const back = s('g', {}, gF);
    s('rect', { x: F.x(0), y: F.y(4.6), width: F.x(4) - F.x(0), height: F.y(0) - F.y(4.6), class: 'f-pri-soft' }, back);
    gF.insertBefore(back, gF.firstChild);
    tx(gF, F.x(2), F.y(0) - 12, 'kept', 't-pri t-bold', 'middle');
    tx(gF, F.x(10), F.y(0) - 12, 'aliased: folded back below 4 kHz', 't-bad t-bold', 'middle');
    [[4, 'fs/2 = 4 kHz'], [8, 'fs = 8 kHz'], [16, '2fs = 16 kHz']].forEach(([v, lab]) => {
      s('line', { x1: F.x(v), x2: F.x(v), y1: F.y(4.6), y2: F.y(0), class: 's-muted dash', style: 'stroke-width: 1' }, gF);
      tx(gF, F.x(v), 22, lab, 't-fg t-sm', v === 16 ? 'end' : 'middle');
    });
    line(gF, [[F.x(0), F.y(0)], [F.x(4), F.y(4)], [F.x(8), F.y(0)], [F.x(12), F.y(4)], [F.x(16), F.y(0)]], 's-fg');
    const f1 = s('g', {}, gF);

    slider(viz('al-slider'), { label: 'tone f', min: 0.5, max: 16, step: 0.5, value: 6, fmt: v => v + ' kHz' }, f => {
      const k = Math.round(f / FS), fa = f - k * FS, heard = Math.abs(fa), kept = k === 0, amb = f === FS / 2;
      t1.textContent = '';
      plot(t1, T, t => Math.sin(2 * Math.PI * f * t + PH), 0, 1, 1600, 's-pri').style.strokeWidth = '1.2';
      plot(t1, T, t => Math.sin(2 * Math.PI * fa * t + PH), 0, 1, 400, (kept ? 's-pri' : 's-bad') + ' dash');
      for (let n = 0; n <= 8; n++) s('circle', { cx: T.x(n / FS), cy: T.y(Math.sin(2 * Math.PI * f * n / FS + PH)), r: 4.5, class: 'f-fg' }, t1);

      f1.textContent = '';
      const cls = kept ? 'pri' : 'bad';
      s('line', { x1: F.x(f), x2: F.x(f), y1: F.y(0), y2: F.y(heard), class: `s-${cls} dash`, style: 'stroke-width: 1.5' }, f1);
      s('line', { x1: F.x(0), x2: F.x(f), y1: F.y(heard), y2: F.y(heard), class: `s-${cls} dash`, style: 'stroke-width: 1.5' }, f1);
      s('circle', { cx: F.x(f), cy: F.y(heard), r: 6, class: `f-${cls}` }, f1);
      const lab = `${fmt(f)} kHz → heard ${fmt(heard)} kHz`, right = f < 11;
      tx(f1, F.x(f) + (right ? 12 : -12), F.y(heard) - 12, lab, `t-${cls} t-bold halo`, right ? 'start' : 'end');

      role('al-spc').textContent = fmt(FS / f, 2);
      const out = role('al-out');
      out.textContent = amb ? '4 kHz ?' : fmt(heard) + ' kHz';
      out.className = 'v ' + (kept && !amb ? 'pri' : '');
      let v;
      if (amb) v = 'Exactly f<sub>s</sub>/2 = 4 kHz: 2 samples per cycle. A second wave passes through the same dots, so the tone is ambiguous. The rule needs f<sub>s</sub> greater than 2f.';
      else if (kept) v = `${fmt(f)} kHz is below f<sub>s</sub>/2 = 4 kHz, with ${fmt(FS / f, 2)} samples per cycle, more than 2. The samples rebuild the tone itself.`;
      else if (heard === 0) v = `${fmt(f)} kHz is a multiple of f<sub>s</sub>. The samples hit the same point of every cycle, so they rebuild a constant (0 Hz). The tone is lost completely.`;
      else if (k === 1 && f < FS) v = `${fmt(f)} kHz is above f<sub>s</sub>/2 = 4 kHz, only ${fmt(FS / f, 2)} samples per cycle. The dots fit a slower wave at f<sub>s</sub> − f = 8 − ${fmt(f)} = <b>${fmt(heard)} kHz</b>. That false tone is the alias.`;
      else v = `The nearest multiple of f<sub>s</sub> is ${k} × 8 = ${k * FS} kHz, so the tone is heard at |${fmt(f)} − ${k * FS}| = <b>${fmt(heard)} kHz</b>, an alias.`;
      role('al-note').innerHTML = v;
    });
  });

  // Cheat sheet
  fig('cheat', () => {
    const l = t => ({ text: t, cls: 'l' });
    const rows = [
      ['A/D conversion', 'sampling (time) + quantization (amplitude); D/A = interpolation'],
      ['Period and frequency', 'T = 1/f; 12 Hz → 83.3 ms'],
      ['Phase to time shift', 'Δt = (φ/360°) × T; 90° = π/2 = T/4; 180° = π = T/2'],
      ['Wavelength', 'λ = vT = v/f; 1 kHz in air (340 m/s) → 0.34 m'],
      ['Sampling', 'xₛ(n) = x(nT); fs = 1/T; 8 kHz → T = 125 µs'],
      ['Audio numbers', 'rates 8 to 48 kHz; hearing 20 Hz to 20 kHz; voice about 4 kHz'],
      ['Levels and step', 'N = 2ᵇ; δ = R/2ᵇ; 8 bits → 256, 16 bits → 65,536'],
      ['Bits per sample', 'music 16, speech 8'],
      ['Bit rate', 'fs × b × channels; CD 44,100 × 16 × 2 = 1,411,200 bps'],
      ['File size', 'bit rate × seconds / 8 bytes; CD, 1 min = 10,584,000 bytes'],
      ['Nyquist', 'fs > 2 fmax; 2 fmax = Nyquist sampling frequency; 10 kHz → 20 kHz'],
      ['Alias (textbook context)', '|f − k·fs|; 6 kHz at fs = 8 kHz → 2 kHz'],
      ['Over- / undersampling', 'same signal, more data / aliasing, information lost'],
      ['Time vs frequency domain', 'one spike per sine wave; 0 Hz = constant level'],
      ['LTI', 'y = h * x; Y = H × X; transfer function = Fourier transform of h'],
      ['Delta, sinc', 'δ: 0 except at 0, integral 1; sinc(x) = sin(πx)/(πx), sinc(0) = 1'],
      ['Fourier', '1768–1830, 1807; periodic continuous signal = sum of sinusoids'],
    ].map(([a, b]) => [l(a), l(b)]);
    table(viz('cheat'), [l('Fact or formula'), l('Value or example')], rows);
  });
});
