QV.register('topic6', function (q) {
  const { s, svg, steps, slider, axes, line, gray, fmt, table } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const tx = (g, x, y, text, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls || null }, g, text);
  const fig = (name, fn) => { try { fn(); } catch (e) { QV.fail('topic6 ' + name, e); } };
  const minus = v => String(v).replace('-', '−');
  const comma = n => Math.round(n).toLocaleString('en-US');
  const crisp = 'shape-rendering: crispEdges';
  const ramp = (g, x, y, w, h, f) => {
    for (let r = 0; r < 256; r++) s('rect', { x: x + r * w / 256, y, width: w / 256 + 0.3, height: h, style: gray(f(r)).style + '; ' + crisp }, g);
    s('rect', { x, y, width: w, height: h, class: 'f-none box' }, g);
  };

  // Figure 1: Weber ratio traced from Gonzalez Fig. 2.6 (slide 7)
  fig('weber', () => {
    const ROD = [[-2.95, 0.78], [-2.8, 0.55], [-2.6, 0.36], [-2.4, 0.22], [-2.2, 0.12], [-2, 0.03], [-1.5, -0.14], [-1, -0.26], [-0.5, -0.34], [0, -0.39], [0.1, -0.4]];
    const CONE = [[-0.25, -0.28], [-0.15, -0.42], [0, -0.55], [0.25, -0.72], [0.5, -0.86], [1, -1.1], [1.5, -1.32], [2, -1.48], [2.5, -1.58], [3, -1.64], [3.6, -1.67]];
    const at = (P, x) => {
      if (x < P[0][0] || x > P[P.length - 1][0]) return null;
      for (let i = 1; i < P.length; i++) if (x <= P[i][0]) {
        const [x0, y0] = P[i - 1], [x1, y1] = P[i];
        return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
      }
      return null;
    };
    const g0 = svg(viz('weber'), 680, 310, { label: 'Log Weber ratio against log background intensity, with a rod branch and a cone branch', minWidth: 520 });
    const ax = axes(g0, { x: 70, y: 30, w: 560, h: 220, xd: [-4, 4], yd: [-2, 1], xt: [-4, -3, -2, -1, 0, 1, 2, 3, 4], yt: [-2, -1.5, -1, -0.5, 0, 0.5, 1], xf: minus, yf: minus, xl: 'log I (background intensity)', yl: 'log ΔIc/I' });
    line(g0, ROD.map(([a, b]) => [ax.x(a), ax.y(b)]), 's-sec');
    line(g0, CONE.map(([a, b]) => [ax.x(a), ax.y(b)]), 's-pri');
    tx(g0, ax.x(-2.3), ax.y(0.55), 'rods (scotopic)', 't-sec t-bold');
    tx(g0, ax.x(1.7), ax.y(-0.85), 'cones (photopic)', 't-pri t-bold');
    const g = s('g', {}, g0);
    slider(viz('weber-slider'), { label: 'log I', min: -2.9, max: 3.6, step: 0.05, value: 1.5, fmt: v => minus(v.toFixed(2)) }, v => {
      g.textContent = '';
      s('line', { x1: ax.x(v), x2: ax.x(v), y1: ax.y(1), y2: ax.y(-2), class: 's-muted dash' }, g);
      const yr = at(ROD, v), yc = at(CONE, v);
      if (yr != null) s('circle', { cx: ax.x(v), cy: ax.y(yr), r: 6, class: 'f-sec' }, g);
      if (yc != null) s('circle', { cx: ax.x(v), cy: ax.y(yc), r: 6, class: 'f-pri' }, g);
      const y = yc != null ? yc : yr, ratio = Math.pow(10, y), I = Math.pow(10, v);
      role('w-i').textContent = I >= 10 ? fmt(I, 0) : String(Number(I.toPrecision(2)));
      role('w-r').textContent = ratio >= 1 ? fmt(ratio, 2) : String(Number(ratio.toPrecision(2)));
      role('w-rec').textContent = yr != null && yc != null ? 'rods → cones' : yc != null ? 'cones' : 'rods';
      role('w-vis').textContent = yc != null ? 'photopic, color' : 'scotopic, black and white';
      const pct = ratio * 100;
      role('weber-note').textContent = `log ΔIc/I ≈ ${minus(y.toFixed(2))}, so ΔIc/I ≈ ${role('w-r').textContent}: the circle must be about ${pct >= 10 ? fmt(pct, 0) : fmt(pct, 1)}% brighter than the background before it is seen. ` +
        (ratio > 0.3 ? 'A large ratio: poor brightness discrimination.' : ratio > 0.06 ? 'Discrimination improves as the light grows.' : 'A small ratio: good brightness discrimination.');
    });
  });

  // Figure 2: f = i · r on a log axis (slide 23)
  fig('ir', () => {
    const MAT = [['black velvet', 0.01], ['white pall', 0.8], ['snow', 0.93]];
    const LIGHT = [['office', 1000], ['cloudy day', 10000], ['clear day', 90000]];
    const X = v => 120 + Math.log10(v) * 112;
    const g0 = svg(viz('ir'), 720, 230, { label: 'Image values f = i times r for three materials under three illuminations, on a log scale', minWidth: 540 });
    [1, 10, 100, 1000, 10000, 100000].forEach(v => {
      s('line', { x1: X(v), x2: X(v), y1: 30, y2: 185, class: 'l-grid' }, g0);
      tx(g0, X(v), 200, comma(v), 't-sm', 'middle');
    });
    s('line', { x1: X(1), x2: X(100000), y1: 185, y2: 185, class: 'l-axis' }, g0);
    tx(g0, X(316), 220, 'f = i · r (log scale)', 't-sm', 'middle');
    const Y = [62, 108, 154];
    MAT.forEach(([n, r], j) => {
      tx(g0, 10, Y[j] - 7, n, 't-fg t-bold');
      tx(g0, 10, Y[j] + 8, 'r = ' + r, 't-sm');
    });
    const g = s('g', {}, g0);
    steps(viz('ir-steps'), LIGHT.map(([n, i]) => n + ' ' + comma(i)), k => {
      g.textContent = '';
      LIGHT.forEach(([, i], m) => {
        if (m === k) return;
        MAT.forEach(([, r], j) => s('circle', { cx: X(i * r), cy: Y[j], r: 4, class: 'f-muted', style: 'opacity: 0.35' }, g));
      });
      const i = LIGHT[k][1];
      s('line', { x1: X(i), x2: X(i), y1: 30, y2: 185, class: 's-ter dash', style: 'stroke-width: 1.5' }, g);
      tx(g, X(i), 18, 'i = ' + comma(i), 't-ter t-bold', 'middle');
      MAT.forEach(([, r], j) => {
        s('circle', { cx: X(i * r), cy: Y[j], r: 6.5, class: 'f-pri' }, g);
        tx(g, X(i * r) - 10, Y[j], comma(i * r), 't-pri t-bold halo', 'end');
      });
      role('ir-calc').textContent = [`i = ${comma(i)} lm/m² (${LIGHT[k][0]})`,
        ...MAT.map(([n, r]) => `${n.padEnd(13)}${comma(i)} × ${String(r).padEnd(5)}= ${comma(i * r)}`),
        'snow / velvet = 0.93 / 0.01 = 93 under every light;  every f < i'].join('\n');
    });
  });

  // Figure 3: one scan line, sampled and quantized (slide 24, Fig. 2.16)
  fig('scan', () => {
    const f = t => 0.5 + 0.28 * Math.sin(2 * Math.PI * 1.1 * t + 0.3) + 0.12 * Math.sin(2 * Math.PI * 3.3 * t + 1.2) + 0.05 * Math.sin(2 * Math.PI * 7.7 * t);
    const g0 = svg(viz('scan'), 760, 320, { label: 'An intensity profile along a scan line with samples, quantization levels and the resulting pixels', minWidth: 540 });
    const ax = axes(g0, { x: 70, y: 24, w: 620, h: 200, xd: [0, 1], yd: [0, 1], xt: [], yt: [0, 1], yf: v => v ? 'L − 1' : '0', grid: false });
    tx(g0, 70, 240, 'A', 't-fg t-bold', 'middle');
    tx(g0, 690, 240, 'B', 't-fg t-bold', 'middle');
    tx(g0, 380, 240, 'position along the scan line', 't-sm', 'middle');
    const g = s('g', {}, g0);
    const st = { n: 12, k: 3 };
    function draw() {
      g.textContent = '';
      const { n, k } = st, L = 2 ** k;
      for (let j = 0; j < L; j++) s('line', { x1: 70, x2: 690, y1: ax.y(j / (L - 1)), y2: ax.y(j / (L - 1)), class: 'l-grid' }, g);
      QV.plot(g, ax, f, 0, 1, 300, 's-muted dash');
      let err = 0;
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n, v = f(t), qv = Math.round(v * (L - 1)) / (L - 1);
        err = Math.max(err, Math.abs(v - qv));
        s('line', { x1: ax.x(t), x2: ax.x(t), y1: ax.y(0), y2: ax.y(v), class: 's-muted', style: 'stroke-width: 1' }, g);
        s('line', { x1: ax.x(i / n), x2: ax.x((i + 1) / n), y1: ax.y(qv), y2: ax.y(qv), class: 's-pri', style: 'stroke-width: 1.5; opacity: 0.6' }, g);
        s('line', { x1: ax.x(t), x2: ax.x(t), y1: ax.y(v), y2: ax.y(qv), class: 's-bad' }, g);
        s('circle', { cx: ax.x(t), cy: ax.y(v), r: 3, class: 'f-surface s-muted' }, g);
        s('circle', { cx: ax.x(t), cy: ax.y(qv), r: 4.5, class: 'f-pri' }, g);
        s('rect', { x: ax.x(i / n), y: 262, width: 620 / n, height: 30, style: gray(qv * 255).style + '; ' + crisp }, g);
      }
      s('rect', { x: 70, y: 262, width: 620, height: 30, class: 'f-none box' }, g);
      tx(g, 70, 306, `digital scan line: ${n} pixels, ${L} levels`, 't-sm');
      role('scan-note').textContent = `${n} samples × ${k} bits = ${n * k} bits for this line. L = 2^${k} = ${L} levels, one step = 1/${L - 1} of the range. ` +
        `Largest rounding error here: ${fmt(err * 100, 1)}% of the range (at most half a step, ${fmt(50 / (L - 1), 1)}%).`;
    }
    slider(viz('scan-n'), { label: 'samples', min: 4, max: 40, step: 1, value: 12 }, v => { st.n = v; draw(); });
    slider(viz('scan-k'), { label: 'bits k', min: 1, max: 5, step: 1, value: 3 }, v => { st.k = v; draw(); });
  });

  // Figure 4: spatial (N) and intensity (k) resolution with b = N·N·k (slides 27-31)
  fig('res', () => {
    const lx = -0.5, ly = -0.55, lz = 0.67;
    const scene = (u, v) => {
      const dx = (u - 0.36) / 0.27, dy = (v - 0.4) / 0.27, d2 = dx * dx + dy * dy;
      if (d2 < 1) return Math.min(1, 0.12 + 0.85 * Math.max(0, dx * lx + dy * ly + Math.sqrt(1 - d2) * lz));
      if (u >= 0.6 && u < 0.95 && v >= 0.6 && v < 0.95) {
        const p = v < 0.775 ? 1 / 8 : 1 / 16;
        return ((u - 0.6) % p) < p / 2 ? 0.95 : 0.05;
      }
      return 0.22 + 0.4 * v;
    };
    const g0 = svg(viz('res'), 600, 300, { label: 'A test scene and the same scene as an N by N image with k bits per pixel', minWidth: 480 });
    const S = 256;
    const raster = (g, x0, y0, N, k) => {
      const ss = Math.max(1, 128 / N), L = 2 ** k, c = S / N;
      for (let r = 0; r < N; r++) for (let col = 0; col < N; col++) {
        let sum = 0;
        for (let a = 0; a < ss; a++) for (let b = 0; b < ss; b++) sum += scene((col + (b + 0.5) / ss) / N, (r + (a + 0.5) / ss) / N);
        const qv = Math.round(sum / (ss * ss) * (L - 1)) / (L - 1);
        s('rect', { x: x0 + col * c, y: y0 + r * c, width: c + 0.3, height: c + 0.3, style: gray(qv * 255).style + '; ' + crisp }, g);
      }
      s('rect', { x: x0, y: y0, width: S, height: S, class: 'f-none box' }, g);
    };
    tx(g0, 20, 18, 'scene (64 × 64, 8 bits)', 't-fg t-bold');
    raster(g0, 20, 34, 64, 8);
    const g = s('g', {}, g0);
    const NS = [8, 16, 32, 64];
    const st = { i: 2, k: 4 };
    function draw() {
      g.textContent = '';
      const N = NS[st.i], k = st.k, b = N * N * k;
      tx(g, 324, 18, `digital image (${N} × ${N}, ${k} bit${k > 1 ? 's' : ''})`, 't-pri t-bold');
      raster(g, 324, 34, N, k);
      role('res-nn').textContent = `${N} × ${N}`;
      role('res-l').textContent = String(2 ** k);
      role('res-b').textContent = comma(b);
      role('res-by').textContent = `${N} × ${N} × ${k} = ${comma(b)} bits = ${comma(b / 8)} bytes`;
    }
    slider(viz('res-n'), { label: 'N', min: 0, max: 3, step: 1, value: 2, fmt: v => String(NS[v]) }, v => { st.i = v; draw(); });
    slider(viz('res-k'), { label: 'k', min: 1, max: 8, step: 1, value: 4 }, v => { st.k = v; draw(); });
  });

  // Figure 5: bilinear as three 1D interpolations (notes example, textbook formula)
  fig('bil', () => {
    const V = { f00: 10, f10: 20, f01: 30, f11: 60 };
    const g0 = svg(viz('bil'), 760, 300, { label: 'Four pixels with a new point P, and the three linear interpolations on number lines', minWidth: 560 });
    const g = s('g', {}, g0);
    const SQ = { x: 60, y: 60, d: 180 };
    const NX = v => 380 + v * 5.6;
    const st = { a: 0.3, b: 0.6 };
    const nline = (y, title, v0, v1, t, name, cls, l0, l1) => {
      const v = v0 + t * (v1 - v0);
      tx(g, 380, y - 26, title, 't-fg t-bold');
      s('line', { x1: NX(0), x2: NX(60), y1: y, y2: y, class: 'l-axis' }, g);
      [0, 30, 60].forEach(m => { s('line', { x1: NX(m), x2: NX(m), y1: y - 3, y2: y + 3, class: 'l-axis' }, g); tx(g, NX(m), y + 22, String(m), 't-sm', 'middle'); });
      s('line', { x1: NX(Math.min(v0, v1)), x2: NX(Math.max(v0, v1)), y1: y, y2: y, class: cls, style: 'stroke-width: 4; opacity: 0.35' }, g);
      [[v0, l0], [v1, l1]].forEach(([w, l]) => { s('circle', { cx: NX(w), cy: y, r: 4.5, class: 'f-muted' }, g); tx(g, NX(w), y + 11, l, 't-sm', 'middle'); });
      s('circle', { cx: NX(v), cy: y, r: 6.5, class: cls.replace('s-', 'f-') }, g);
      tx(g, NX(v), y - 13, name + ' = ' + fmt(v, 2), cls.replace('s-', 't-') + ' t-bold halo', 'middle');
      return v;
    };
    function draw() {
      g.textContent = '';
      const { a, b } = st, X = SQ.x + a * SQ.d, Y = SQ.y + b * SQ.d;
      s('rect', { x: SQ.x, y: SQ.y, width: SQ.d, height: SQ.d, class: 'f-seg s-line' }, g);
      s('line', { x1: X, x2: X, y1: SQ.y, y2: SQ.y + SQ.d, class: 's-ok dash', style: 'stroke-width: 1.5' }, g);
      const C = [['f₀₀', V.f00, 0, 0], ['f₁₀', V.f10, 1, 0], ['f₀₁', V.f01, 0, 1], ['f₁₁', V.f11, 1, 1]];
      const nn = C.find(c => c[2] === Math.round(a) && c[3] === Math.round(b));
      C.forEach(([n, v, cx, cy]) => {
        const px = SQ.x + cx * SQ.d, py = SQ.y + cy * SQ.d;
        if (nn[0] === n) s('circle', { cx: px, cy: py, r: 11, class: 'f-none s-ter' }, g);
        s('circle', { cx: px, cy: py, r: 6, class: 'f-fg' }, g);
        tx(g, px + (cx ? 14 : -14), py + (cy ? 12 : -12), `${n} = ${v}`, 't-fg t-bold', cx ? 'start' : 'end');
      });
      s('circle', { cx: X, cy: SQ.y, r: 5, class: 'f-pri' }, g);
      tx(g, X, SQ.y - 12, 'T', 't-pri t-bold', 'middle');
      s('circle', { cx: X, cy: SQ.y + SQ.d, r: 5, class: 'f-sec' }, g);
      tx(g, X, SQ.y + SQ.d + 14, 'B', 't-sec t-bold', 'middle');
      s('circle', { cx: X, cy: Y, r: 6.5, class: 'f-ok' }, g);
      tx(g, X + 10, Y - 10, 'P', 't-ok t-bold halo');
      const T = nline(66, `top row: a = ${fmt(a, 2)} of the way from f₀₀ to f₁₀`, V.f00, V.f10, a, 'T', 's-pri', '10', '20');
      const B = nline(148, `bottom row: a = ${fmt(a, 2)} of the way from f₀₁ to f₁₁`, V.f01, V.f11, a, 'B', 's-sec', '30', '60');
      const P = nline(230, `between rows: b = ${fmt(b, 2)} of the way from T to B`, T, B, b, 'P', 's-ok', 'T', 'B');
      role('bil-calc').textContent = [
        `top row     10 + ${fmt(a, 2)} × (20 − 10) = ${fmt(T, 2)}`,
        `bottom row  30 + ${fmt(a, 2)} × (60 − 30) = ${fmt(B, 2)}`,
        `between     ${fmt(T, 2)} + ${fmt(b, 2)} × (${fmt(B, 2)} − ${fmt(T, 2)}) = ${fmt(P, 2)}`,
        `nearest     a → ${Math.round(a)}, b → ${Math.round(b)}   → ${nn[0]} = ${nn[1]}`,
      ].join('\n');
    }
    slider(viz('bil-a'), { label: 'a (across)', min: 0, max: 1, step: 0.05, value: 0.3, fmt: v => v.toFixed(2) }, v => { st.a = v; draw(); });
    slider(viz('bil-b'), { label: 'b (down)', min: 0, max: 1, step: 0.05, value: 0.6, fmt: v => v.toFixed(2) }, v => { st.b = v; draw(); });
  });

  const lutAxes = (g0, x, y) => axes(g0, { x, y, w: 240, h: 240, xd: [0, 255], yd: [0, 255], xt: [0, 128, 255], yt: [0, 128, 255], xl: 'input r', yl: 'output s' });
  const curve = (g, ax, f, cls) => {
    const pts = [];
    for (let r = 0; r <= 255; r++) pts.push([ax.x(r), ax.y(Math.max(0, Math.min(255, f(r))))]);
    return line(g, pts, cls);
  };

  // Figure 6: point transformations as LUTs (slides 44-57)
  fig('lut', () => {
    const cl = v => Math.max(0, Math.min(255, v));
    const T = [
      ['Null', r => r, 'Null transform: new pixel = old pixel. The output ramp equals the input ramp.'],
      ['Negative', r => 255 - r, 'Negative, y = −x + 255: black and white swap. Used to display medical images and to produce negative prints.'],
      ['Slicing', r => (r >= 100 && r <= 150 ? 255 : 0), 'Intensity level slicing: the range [100, 150] is set to 255, everything else to 0. Used for segmentation of certain gray-level regions.'],
      ['Posterize', r => Math.floor(r / 32) * 255 / 7, '8-level posterize: a staircase. Every 32 input levels collapse onto one output level.'],
      ['Threshold', r => (r >= 128 ? 255 : 0), 'Threshold at 128: posterizing to 2 levels. The output is black or white only.'],
      ['Bounded', r => (r < 64 || r > 192 ? r : r < 128 ? 64 : 192), 'Bounded threshold: inside [64, 192] the values are thresholded to 64 or 192; outside it the null transform keeps them.'],
      ['Stretch', r => cl(255 * (r - 40) / 150), 'Contrast stretch, low 40, high 190: a steep line. Below 40 clips to 0, above 190 to 255.'],
      ['Compress', r => 50 + r * 155 / 255, 'Contrast compression: a shallow line from 50 to 205. The output uses fewer levels, so contrast drops.'],
      ['Bit clip', r => r % 64, '2-bit bit-clipping: the top 2 bits are dropped, so the ramp repeats 4 times and the output stays below 64.'],
      ['Contour', r => ([64, 96, 128, 160, 192, 224].some(c => Math.abs(r - c) <= 1) ? 0 : r), 'Iso-intensity contouring: the image is kept, but a few chosen levels are set to 0. They draw black contour lines.'],
      ['Highlight', r => (r >= 100 && r <= 150 ? 255 : r), 'Range highlighting: [100, 150] is set to 255 and the rest is kept, unlike slicing.'],
      ['Solarize', r => (r <= 150 ? r : 255 - r), 'Solarize with threshold 150: identity up to 150, inverted (255 − r) above it.'],
      ['Parabola ∩', r => 255 - 255 * (r / 127.5 - 1) ** 2, 'First parabola: mid grays become bright, both ends become dark.'],
      ['Parabola ∪', r => 255 * (r / 127.5 - 1) ** 2, 'Second parabola: mid grays become dark, both ends become bright.'],
    ];
    const g0 = svg(viz('lut'), 720, 320, { label: 'A look-up table curve with an input gray ramp and the transformed output ramp', minWidth: 540 });
    const ax = lutAxes(g0, 60, 30);
    s('line', { x1: ax.x(0), y1: ax.y(0), x2: ax.x(255), y2: ax.y(255), class: 's-muted dash', style: 'stroke-width: 1' }, g0);
    tx(g0, 360, 64, 'input r = 0 … 255', 't-sm');
    ramp(g0, 360, 76, 340, 40, r => r);
    const g = s('g', {}, g0);
    steps(viz('lut-steps'), T.map(t => t[0]), k => {
      g.textContent = '';
      const [n, f, note] = T[k];
      curve(g, ax, f, 's-pri');
      tx(g, 360, 30, n, 't-pri t-bold t-lg');
      tx(g, 360, 164, 'output s = LUT[r]', 't-sm');
      ramp(g, 360, 176, 340, 40, r => cl(Math.round(f(r))));
      role('lut-note').textContent = note;
    }, 6);
  });

  // Figure 7: gamma in the two slide conventions (slides 47-49)
  fig('gam', () => {
    const g0 = svg(viz('gam'), 700, 320, { label: 'Gamma curves s = 255 (r/255) to the gamma and to one over gamma, with gray ramps', minWidth: 540 });
    const ax = lutAxes(g0, 60, 30);
    s('line', { x1: ax.x(0), y1: ax.y(0), x2: ax.x(255), y2: ax.y(255), class: 's-muted dash', style: 'stroke-width: 1' }, g0);
    tx(g0, 360, 26, 'input r', 't-sm');
    ramp(g0, 360, 38, 320, 36, r => r);
    const g = s('g', {}, g0);
    slider(viz('gam-slider'), { label: 'γ', min: 0.1, max: 3, step: 0.05, value: 0.5, fmt: v => v.toFixed(2) }, gm => {
      g.textContent = '';
      const A = r => 255 * (r / 255) ** gm, B = r => 255 * (r / 255) ** (1 / gm);
      curve(g, ax, B, 's-sec dash');
      curve(g, ax, A, 's-pri');
      tx(g, 360, 106, 's = 255 (r/255)^γ      slides 47–48', 't-pri t-bold');
      ramp(g, 360, 118, 320, 36, A);
      tx(g, 360, 186, 's = 255 (r/255)^(1/γ)  slide 49', 't-sec t-bold');
      ramp(g, 360, 198, 320, 36, B);
      const a = A(64), b = B(64), verb = v => (v > 64.5 ? 'brighter' : v < 63.5 ? 'darker' : 'unchanged');
      role('gam-calc').textContent = [
        `r = 64, γ = ${gm.toFixed(2)}`,
        `slides 47–48:  255 × (64/255)^${gm.toFixed(2)}     = ${fmt(a, 2).padEnd(7)} → uint8 ${Math.floor(a)}   ${verb(a)}`,
        `slide 49:      255 × (64/255)^(1/${gm.toFixed(2)}) = ${fmt(b, 2).padEnd(7)} → uint8 ${Math.floor(b)}   ${verb(b)}`,
      ].join('\n');
    });
  });

  fig('cheat', () => {
    table(viz('cheat'), ['Fact or formula', 'Value or example'], [
      ['Rods / cones', 'rods: dim light, no color, scotopic · cones: fovea, color, photopic'],
      ['Weber ratio ΔIc / I', '2/100 = 0.02 good · 20/100 = 0.2 poor'],
      ['Retinal image', '15/100 = h/17 → h = 2.55 mm'],
      ['Thin lens, FOV', '1/S₁ + 1/S₂ = 1/f · ω = 2 arctan(d/f), longer f → smaller ω'],
      ['EM', 'λ = c/ν, E = hν · 5 × 10¹⁴ Hz → 599.6 nm, 3.313 × 10⁻¹⁹ J'],
      ['Image model', 'f = i · r, 0 < r < 1 · office × snow = 930'],
      ['Sampling / quantization', 'coordinates / amplitude'],
      ['Levels', 'L = 2^k, 0 ≤ f ≤ L − 1 · 100 levels → k = 7'],
      ['Dynamic range', 'I_max / I_min = saturation / noise'],
      ['Storage', 'b = M × N × k · 1024² × 8 = 8,388,608 bits = 1 MiB'],
      ['Resolution', 'spatial: smallest discernible detail · intensity: smallest discernible change'],
      ['m-adjacency', 'q ∈ N₄(p), or q ∈ N_D(p) with N₄(p) ∩ N₄(q) free of V'],
      ['Interpolation', 'NN 1 (fast, checkerboard) · bilinear 4 · bicubic 16 (sharpest, slow)'],
      ['Bilinear', '10, 20, 30, 60 at (0.3, 0.6) → 28.6 · NN 30'],
      ['Stretch, negative', '255(x − low)/(high − low) · 255 − r'],
      ['Gamma', '255(r/255)^γ, γ < 1 brightens · r = 64, γ = 0.5 → 127'],
      ['Histogram equalization', 'histogram → normalized sum → map'],
    ].map(([a, b]) => [{ text: a, cls: 'l' }, { text: b, cls: 'l' }]));
  });
});
