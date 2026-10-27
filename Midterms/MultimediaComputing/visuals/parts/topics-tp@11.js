QV.register('topic11', function (q) {
  const { s, svg, grid, gray, steps, slider, axes, line, table, fmt } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const tx = (g, x, y, text, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls || null }, g, text);
  // each figure is isolated so one failure leaves the rest of the article drawn
  const fig = (name, fn) => { try { fn(); } catch (e) { QV.fail('topic11 ' + name, e); } };
  const signFill = v => (v > 0 ? 'f-pri-soft' : v < 0 ? 'f-sec-soft' : 'f-seg');
  const apply = (W, M) => W.reduce((a, row, r) => a + row.reduce((b, v, c) => b + v * M[r][c], 0), 0);
  const avgRow = (x, n) => x.map((_, i) => {
    let t = 0;
    for (let d = -(n - 1) / 2; d <= (n - 1) / 2; d++) t += x[Math.max(0, Math.min(x.length - 1, i + d))];
    return t / n;
  });

  // Figure 1: one window, every mask (slide 14)
  fig('mask', () => {
    const WIN = [[11, 13, 15], [16, 11, 11], [16, 12, 11]];
    const MASKS = [
      { name: 'Average 1/9', w: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], div: 9, note: 'All nine weights are 1, then divide by 9: 116 / 9 = 12.89. The weights sum to 9/9 = 1, so a flat area keeps its value.' },
      { name: 'Gaussian 1/16', w: [[1, 2, 1], [2, 4, 2], [1, 2, 1]], div: 16, note: 'Corners × 1 (53), edge neighbours × 2 (104), centre × 4 (44): 201 / 16 = 12.5625. The centre weighs 4/16 = 0.25, more than the average\'s 1/9, so it blurs less.' },
      { name: 'Sharpen (5)', w: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]], div: 1, note: '5 × 11 − (13 + 16 + 11 + 12) = 55 − 52 = 3. Sum 1. The centre is darker than its neighbours, so sharpening pushes it further down: more contrast.' },
      { name: 'High pass 1/9', w: [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]], div: 9, note: '8 × 11 − 105 = −17, and −17 / 9 = −1.89. Sum 0, so a flat area gives 0. A negative output is clipped to 0 for display.' },
      { name: 'Laplacian (4)', w: [[0, -1, 0], [-1, 4, -1], [0, -1, 0]], div: 1, note: '4 × 11 − 52 = −8. Sum 0. It is the sharpening mask without the extra 1 on the centre: sharpen = 11 + (−8) = 3.' },
      { name: 'Sobel H_r', w: [[1, 0, -1], [2, 0, -2], [1, 0, -1]], div: 1, note: 'Left column minus right column, middle row doubled: 59 − 48 = 11. Positive means brighter on the left (slide 37 version).' },
      { name: 'Sobel H_c', w: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]], div: 1, note: 'Bottom row minus top row, middle column doubled: 51 − 52 = −1. Almost no change from top to bottom.' },
      { name: 'Prewitt H_r', w: [[1, 0, -1], [1, 0, -1], [1, 0, -1]], div: 1, note: 'Same as Sobel H_r with weights 1 1 1: 43 − 37 = 6.' },
    ];
    const g0 = svg(viz('mask'), 800, 196, { label: 'The slide 34 window times a chosen mask, the nine products, and their sum', minWidth: 560 });
    const g = s('g', {}, g0);
    steps(viz('mask-steps'), MASKS.map(m => m.name), k => {
      g.textContent = '';
      const m = MASKS[k];
      const prod = WIN.map((row, r) => row.map((v, c) => v * m.w[r][c]));
      const sum = apply(WIN, m.w);
      grid(g, { x: 20, y: 56, data: WIN, cell: 40, gap: 2, fill: () => 'f-seg', stroke: 'box', title: 'window' });
      tx(g, 168, 118, '×', 't-fg t-xl', 'middle');
      grid(g, { x: 190, y: 56, data: m.w, cell: 40, gap: 2, fill: signFill, stroke: 'box', title: m.div > 1 ? `mask (÷ ${m.div} at the end)` : 'mask' });
      tx(g, 338, 118, '=', 't-fg t-xl', 'middle');
      grid(g, { x: 360, y: 56, data: prod, cell: 46, gap: 2, fill: signFill, stroke: 'box', title: 'products' });
      tx(g, 540, 84, `sum = ${sum}`, 't-fg t-bold t-lg');
      if (m.div > 1) tx(g, 540, 112, `${sum} / ${m.div} = ${fmt(sum / m.div, 4)}`, 't-ok t-bold t-lg');
      else tx(g, 540, 112, `output = ${sum}`, 't-ok t-bold t-lg');
      const ws = m.w.flat().reduce((a, b) => a + b, 0) / m.div;
      tx(g, 540, 140, `mask sum = ${fmt(ws)}`, 't-muted');
      tx(g, 540, 160, 'written at the centre pixel', 't-muted');
      role('mask-note').textContent = m.note;
    });
  });

  // Figure 2: bigger average mask, more blur (slides 16-18)
  fig('size', () => {
    const N = 36, X = Array.from({ length: N }, (_, i) => (i === 8 || i >= 22 ? 200 : 40));
    const g0 = svg(viz('size'), 760, 300, { label: 'A row with a thin line and a step, before and after an n-point average', minWidth: 560 });
    const X0 = 104, C = 18;
    const ax = axes(g0, { x: X0, y: 100, w: N * C, h: 150, xd: [-0.5, N - 0.5], yd: [0, 220], xt: [0, 5, 10, 15, 20, 25, 30, 35], yt: [0, 50, 100, 150, 200], xl: 'pixel', yl: 'gray value' });
    line(g0, X.map((v, i) => [ax.x(i), ax.y(v)]), 's-muted dash').setAttribute('style', 'stroke-width: 1.5');
    tx(g0, 0, 25, 'original', 't-fg t-bold');
    tx(g0, 0, 55, 'blurred', 't-fg t-bold');
    grid(g0, { x: X0, y: 16, data: [X], cell: C, gap: 0, fill: v => gray(v), text: false, stroke: 'box' });
    const dyn = s('g', {}, g0);
    slider(viz('size-slider'), { label: 'mask size n', min: 1, max: 9, step: 2, value: 5, fmt: v => `${v} (${v} × ${v} mask, weights 1/${v * v})` }, n => {
      dyn.textContent = '';
      const Y = avgRow(X, n);
      grid(dyn, { x: X0, y: 46, data: [Y], cell: C, gap: 0, fill: v => gray(v), text: false, stroke: 'box' });
      line(dyn, Y.map((v, i) => [ax.x(i), ax.y(v)]), 's-pri');
      Y.forEach((v, i) => s('circle', { cx: ax.x(i), cy: ax.y(v), r: 2.5, class: 'f-pri' }, dyn));
      tx(dyn, ax.x(8) + 10, ax.y(Y[8]) - 8, `peak ${fmt(Y[8], 1)}`, 't-pri t-bold halo');
      role('size-note').textContent = n === 1
        ? 'n = 1: the mask is a single weight of 1, so nothing changes.'
        : `n = ${n}: each output is the mean of ${n} neighbours. The 1-pixel line spreads over ${n} pixels and its peak drops to 40 + 160 / ${n} = ${fmt(40 + 160 / n, 1)}. The step becomes a ramp ${n} pixels long. The bigger the mask, the greater the blurring.`;
    });
  });

  // Figure 3: Gaussian sigma and the 3x3 weights (slide 19)
  fig('gauss', () => {
    const g0 = svg(viz('gauss'), 760, 250, { label: 'The Gaussian curve sampled at -1, 0 and 1, and the normalized 3 by 3 mask', minWidth: 560 });
    const ax = axes(g0, { x: 56, y: 26, w: 300, h: 170, xd: [-3, 3], yd: [0, 1.1], xt: [-3, -2, -1, 0, 1, 2, 3], yt: [0, 0.5, 1], xl: 'distance from the centre', yl: 'e^(−x² / 2σ²)' });
    const dyn = s('g', {}, g0);
    slider(viz('gauss-slider'), { label: 'σ', min: 0.3, max: 3, step: 0.01, value: 0.85, fmt: v => v.toFixed(2) }, sg => {
      dyn.textContent = '';
      const e = d2 => Math.exp(-d2 / (2 * sg * sg));
      QV.plot(dyn, ax, x => e(x * x), -3, 3, 120, 's-pri');
      [-1, 0, 1].forEach(x => {
        s('line', { x1: ax.x(x), x2: ax.x(x), y1: ax.y(0), y2: ax.y(e(x * x)), class: 's-sec' }, dyn);
        s('circle', { cx: ax.x(x), cy: ax.y(e(x * x)), r: 4, class: 'f-sec' }, dyn);
      });
      tx(dyn, ax.x(1) + 8, ax.y(e(1)) - 10, fmt(e(1), 3), 't-sec t-bold halo');
      const raw = [-1, 0, 1].map(r => [-1, 0, 1].map(c => e(r * r + c * c)));
      const tot = raw.flat().reduce((a, b) => a + b, 0);
      const K = raw.map(row => row.map(v => v / tot));
      const kmax = K[1][1];
      const gk = grid(dyn, {
        x: 420, y: 42, data: K, cell: 60, gap: 2, stroke: 'box', title: '3 × 3 mask (sum 1)',
        fill: v => ({ cls: 'f-pri', style: 'opacity: ' + (0.15 + 0.85 * v / kmax).toFixed(2) }),
        text: v => v.toFixed(3), textCls: v => (v / kmax > 0.6 ? 't-on t-bold' : 't-fg'),
      });
      tx(dyn, 620, 60, '× 16', 't-fg t-bold');
      [['corner', K[0][0]], ['edge', K[0][1]], ['centre', K[1][1]]].forEach(([n, v], i) => tx(dyn, 620, 86 + i * 22, `${n} ${(16 * v).toFixed(2)}`, 't-fg'));
      tx(dyn, 620, 164, `edge / centre = ${(K[0][1] / K[1][1]).toFixed(3)}`, 't-sm');
      tx(dyn, 420, gk.h + 60, 'darker = heavier weight', 't-sm');
      const ratio = K[0][1] / K[1][1];
      role('gauss-note').textContent = Math.abs(ratio - 0.5) < 0.005
        ? `σ = ${sg.toFixed(2)}: each step away from the centre halves the weight, so × 16 gives 1, 2, 4: the slide's (1/16) [1 2 1; 2 4 2; 1 2 1].`
        : ratio < 0.5
          ? `σ = ${sg.toFixed(2)}: the curve is narrow, the centre keeps ${(100 * K[1][1]).toFixed(0)}% of the weight, and the mask blurs less than the slide's 1/16 mask.`
          : `σ = ${sg.toFixed(2)}: the curve is wide, the weights level out (centre ${K[1][1].toFixed(3)} against 1/9 = 0.111), and the mask moves toward the plain average.`;
    });
  });

  // Figure 4: high boost on a step (slides 21, 24-26)
  fig('boost', () => {
    const N = 20, X = Array.from({ length: N }, (_, i) => (i < 10 ? 60 : 160));
    const LP = avgRow(X, 3);
    const g0 = svg(viz('boost'), 760, 330, { label: 'A step row, its 3 by 3 average, and the high boost output for the chosen alpha', minWidth: 560 });
    const X0 = 130, C = 30;
    const ax = axes(g0, { x: X0, y: 110, w: N * C, h: 170, xd: [-0.5, N - 0.5], yd: [-50, 200], xt: [0, 5, 10, 15, 19], yt: [-50, 0, 50, 100, 150, 200], xl: 'pixel', yl: 'value' });
    tx(g0, 0, 31, 'original', 't-fg t-bold');
    tx(g0, 0, 67, 'high boost', 't-fg t-bold');
    tx(g0, 0, 81, '(clipped 0–255)', 't-sm');
    grid(g0, { x: X0, y: 16, data: [X], cell: C, gap: 0, fill: v => gray(v), text: false, stroke: 'box' });
    line(g0, X.map((v, i) => [ax.x(i), ax.y(v)]), 's-muted dash').setAttribute('style', 'stroke-width: 1.5');
    line(g0, LP.map((v, i) => [ax.x(i), ax.y(v)]), 's-ter');
    const dyn = s('g', {}, g0);
    slider(viz('boost-slider'), { label: 'α', min: 1, max: 2, step: 0.1, value: 1.2, fmt: v => v.toFixed(1) }, a => {
      dyn.textContent = '';
      const Y = X.map((v, i) => a * v - LP[i]);
      grid(dyn, { x: X0, y: 52, data: [Y], cell: C, gap: 0, fill: v => gray(Math.max(0, Math.min(255, v))), text: false, stroke: 'box' });
      line(dyn, Y.map((v, i) => [ax.x(i), ax.y(v)]), 's-pri');
      Y.forEach((v, i) => s('circle', { cx: ax.x(i), cy: ax.y(v), r: 3, class: 'f-pri' }, dyn));
      [[9, -1], [10, 1]].forEach(([i, sgn]) => tx(dyn, ax.x(i) + sgn * 10, ax.y(Y[i]) + (sgn < 0 ? 12 : -12), fmt(Y[i], 2), 't-pri t-bold halo', sgn < 0 ? 'end' : 'start'));
      const w = 9 * a - 1;
      role('boost-w').textContent = fmt(w, 1);
      role('boost-sum').textContent = fmt(a - 1, 1);
      role('boost-flat').textContent = `${fmt(60 * (a - 1), 1)} / ${fmt(160 * (a - 1), 1)}`;
    });
  });

  // Figure 5: point and line masks on six windows (slides 27-28)
  fig('line', () => {
    const MK = [
      ['Point', [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]]],
      ['Horizontal', [[-1, -1, -1], [2, 2, 2], [-1, -1, -1]]],
      ['+45°', [[-1, -1, 2], [-1, 2, -1], [2, -1, -1]]],
      ['Vertical', [[-1, 2, -1], [-1, 2, -1], [-1, 2, -1]]],
      ['−45°', [[2, -1, -1], [-1, 2, -1], [-1, -1, 2]]],
    ];
    const b = 20, f = 80;
    const WS = [
      ['Isolated point', [[b, b, b], [b, f, b], [b, b, b]]],
      ['Horizontal line', [[b, b, b], [f, f, f], [b, b, b]]],
      ['+45° line', [[b, b, f], [b, f, b], [f, b, b]]],
      ['Vertical line', [[b, f, b], [b, f, b], [b, f, b]]],
      ['−45° line', [[f, b, b], [b, f, b], [b, b, f]]],
      ['Flat area', [[b, b, b], [b, b, b], [b, b, b]]],
    ];
    const T = 400;
    const g0 = svg(viz('line'), 800, 196, { label: 'A window and the responses of the point mask and the four line masks', minWidth: 560 });
    const g = s('g', {}, g0);
    steps(viz('line-steps'), WS.map(w => w[0]), k => {
      g.textContent = '';
      const W = WS[k][1];
      grid(g, { x: 20, y: 56, data: W, cell: 40, gap: 2, fill: v => gray(v, 100), stroke: 'box', title: 'window' });
      const R = MK.map(m => apply(W, m[1]));
      const lineR = R.slice(1), best = Math.max(...lineR);
      MK.forEach(([name, M], i) => {
        const x = 200 + i * 118, y = 56;
        grid(g, { x, y, data: M, cell: 26, gap: 1, fill: signFill, stroke: 'box', title: name });
        const win = i > 0 && best > 0 && R[i] === best;
        const pt = i === 0;
        const cls = pt ? (Math.abs(R[0]) > T ? 't-ok t-bold' : 't-fg') : (win ? 't-pri t-bold' : 't-fg');
        tx(g, x + 40, y + 98, `R = ${R[i]}`, cls, 'middle');
        if (pt) tx(g, x + 40, y + 118, Math.abs(R[0]) > T ? `|R| > ${T}: point` : `|R| ≤ ${T}: no point`, Math.abs(R[0]) > T ? 't-ok t-sm' : 't-sm', 'middle');
        if (win) {
          s('rect', { x: x - 6, y: y - 24, width: 92, height: 152, rx: 4, class: 'f-none outline-pri' }, g);
          tx(g, x + 40, y + 118, 'largest', 't-pri t-sm', 'middle');
        }
      });
      s('line', { x1: 307, x2: 307, y1: 30, y2: 180, class: 's-line' }, g);
      const NOTES = [
        `Point mask: 8 × 80 − 8 × 20 = ${R[0]}, above T = ${T}, so a point is detected. The line masks give only ${lineR[0]} each.`,
        `Horizontal mask: 2 × (80 + 80 + 80) − 6 × 20 = ${R[1]}, the largest line response. The point mask gives ${R[0]}, below T, so a line is not mistaken for a point.`,
        `The +45° mask has its 2s on the rising diagonal and gives ${R[2]}; the others give 0.`,
        `The vertical mask gives ${R[3]}; the horizontal and diagonal masks give 0.`,
        `The −45° mask has its 2s on the falling diagonal and gives ${R[4]}.`,
        'Every mask sums to 0, so a constant background gives R = 0 everywhere.',
      ];
      role('line-note').textContent = NOTES[k];
    });
  });

  // Figure 6: edge angle against Sobel and Prewitt magnitude (slides 37-38, 43)
  fig('angle', () => {
    const area = (c, r, nx, ny) => {
      // clip the unit pixel square by the half-plane nx*x + ny*y > 0 and take its area
      let P = [[c - 0.5, r - 0.5], [c + 0.5, r - 0.5], [c + 0.5, r + 0.5], [c - 0.5, r + 0.5]];
      const d = p => nx * p[0] + ny * p[1];
      const out = [];
      P.forEach((p, i) => {
        const qn = P[(i + 1) % 4], dp = d(p), dq = d(qn);
        if (dp > 0) out.push(p);
        if ((dp > 0) !== (dq > 0)) { const t = dp / (dp - dq); out.push([p[0] + t * (qn[0] - p[0]), p[1] + t * (qn[1] - p[1])]); }
      });
      P = out;
      let a = 0;
      P.forEach((p, i) => { const qn = P[(i + 1) % P.length]; a += p[0] * qn[1] - qn[0] * p[1]; });
      return Math.abs(a) / 2;
    };
    const win = ph => {
      const t = ph * Math.PI / 180, nx = Math.cos(t), ny = Math.sin(t);
      return [-1, 0, 1].map(r => [-1, 0, 1].map(c => 50 + 100 * area(c, r, nx, ny)));
    };
    const SX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], SY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
    const PX = [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]], PY = [[-1, -1, -1], [0, 0, 0], [1, 1, 1]];
    const resp = ph => {
      const W = win(ph), sx = apply(W, SX), sy = apply(W, SY), px = apply(W, PX), py = apply(W, PY);
      return { W, sx, sy, px, py, s: Math.hypot(sx, sy), p: Math.hypot(px, py) };
    };
    const base = resp(0);
    const ANG = Array.from({ length: 91 }, (_, i) => i).map(resp);
    const g0 = svg(viz('angle'), 780, 270, { label: 'A step edge window at the chosen angle, and the Sobel and Prewitt magnitude against angle', minWidth: 560 });
    const ax = axes(g0, { x: 330, y: 28, w: 420, h: 190, xd: [0, 90], yd: [0.9, 1.1], xt: [0, 15, 30, 45, 60, 75, 90], yt: [0.9, 0.95, 1, 1.05, 1.1], xl: 'gradient angle φ, degrees', yl: '|G| ÷ |G| of a vertical edge' });
    line(g0, ANG.map((o, i) => [ax.x(i), ax.y(o.s / base.s)]), 's-pri');
    line(g0, ANG.map((o, i) => [ax.x(i), ax.y(o.p / base.p)]), 's-sec');
    tx(g0, ax.x(45), ax.y(1.061) - 12, 'Sobel', 't-pri t-bold halo', 'middle');
    tx(g0, ax.x(45), ax.y(0.943) + 14, 'Prewitt', 't-sec t-bold halo', 'middle');
    const dyn = s('g', {}, g0);
    slider(viz('angle-slider'), { label: 'φ', min: 0, max: 90, step: 1, value: 45, fmt: v => v + '°' }, ph => {
      dyn.textContent = '';
      const o = resp(ph);
      const gw = grid(dyn, { x: 40, y: 54, data: o.W, cell: 58, gap: 2, fill: v => gray(v), text: v => Math.round(v), stroke: 'box', title: 'window, 50 → 150' });
      const cx = gw.cx(1) + 29, cy = gw.cy(1) + 29, t = ph * Math.PI / 180;
      s('line', { x1: cx + 80 * Math.sin(t), y1: cy - 80 * Math.cos(t), x2: cx - 80 * Math.sin(t), y2: cy + 80 * Math.cos(t), class: 's-sec dash' }, dyn);
      QV.arrow(dyn, cx, cy, cx + 50 * Math.cos(t), cy + 50 * Math.sin(t), { cls: 'a-pri', width: 2.5 });
      s('line', { x1: ax.x(ph), x2: ax.x(ph), y1: 28, y2: 218, class: 's-muted dash' }, dyn).setAttribute('style', 'stroke-width: 1');
      s('circle', { cx: ax.x(ph), cy: ax.y(o.s / base.s), r: 4.5, class: 'f-pri' }, dyn);
      s('circle', { cx: ax.x(ph), cy: ax.y(o.p / base.p), r: 4.5, class: 'f-sec' }, dyn);
      const deg = (y, x) => (Math.atan2(y, x) * 180 / Math.PI).toFixed(1);
      role('angle-calc').textContent = [
        `φ = ${ph}°   (arrow: gradient, toward the bright side; dashed: the edge)`,
        `Sobel   Gx = ${o.sx.toFixed(1)}  Gy = ${o.sy.toFixed(1)}  |G| = ${o.s.toFixed(1)} = ${(o.s / base.s).toFixed(3)} × vertical   θ = ${deg(o.sy, o.sx)}°`,
        `Prewitt Gx = ${o.px.toFixed(1)}  Gy = ${o.py.toFixed(1)}  |G| = ${o.p.toFixed(1)} = ${(o.p / base.p).toFixed(3)} × vertical   θ = ${deg(o.py, o.px)}°`,
        'Gx, Gy use the slide-43 masks M_x and M_y, which are positive toward the bright side.',
      ].join('\n');
    });
  });

  // Figure 7: zero crossings with and without the threshold (slides 45-47)
  fig('zc', () => {
    const F = [40, 42, 39, 41, 40, 38, 41, 40, 39, 41, 120, 118, 121, 119, 122, 120, 118, 120, 121, 119, 100, 101, 99, 100, 102, 99, 101, 100];
    const N = F.length, at = (a, i) => a[Math.max(0, Math.min(N - 1, i))];
    const L = F.map((v, i) => 2 * v - at(F, i - 1) - at(F, i + 1));
    const ZC = L.map((v, i) => (i < N - 1 && ((v < 0 && L[i + 1] >= 0) || (v > 0 && L[i + 1] <= 0)) ? 1 : 0));
    const RNG = L.map((_, i) => Math.max(at(L, i - 1), L[i], at(L, i + 1)) - Math.min(at(L, i - 1), L[i], at(L, i + 1)));
    const X0 = 150, C = 22;
    const g0 = svg(viz('zc'), 790, 360, { label: 'A noisy row, its Laplacian, the zero crossings, the window range, and the edges kept by the threshold', minWidth: 560 });
    const a1 = axes(g0, { x: X0, y: 22, w: N * C, h: 80, xd: [-0.5, N - 0.5], yd: [0, 140], yt: [0, 50, 100], yl: 'row' });
    line(g0, F.map((v, i) => [a1.x(i), a1.y(v)]), 's-fg');
    const a2 = axes(g0, { x: X0, y: 134, w: N * C, h: 100, xd: [-0.5, N - 0.5], yd: [-90, 90], xt: [0, 5, 10, 15, 20, 25], yt: [-80, 0, 80], yl: 'Laplacian 2f(x) − f(x−1) − f(x+1)' });
    L.forEach((v, i) => {
      s('line', { x1: a2.x(i), x2: a2.x(i), y1: a2.y(0), y2: a2.y(v), class: 's-ter' }, g0);
      s('circle', { cx: a2.x(i), cy: a2.y(v), r: 2.5, class: 'f-ter' }, g0);
    });
    [['ZC (slide 46)', 272], ['max − min', 298], ['edge if > T', 324]].forEach(([t, y]) => tx(g0, 0, y + C / 2, t, 't-fg t-bold'));
    grid(g0, { x: X0, y: 272, data: [ZC], cell: C, gap: 0, fill: v => (v ? 'f-pri' : 'f-seg'), text: false, stroke: 'box' });
    const dyn = s('g', {}, g0);
    slider(viz('zc-slider'), { label: 'T', min: 0, max: 160, step: 2, value: 30 }, T => {
      dyn.textContent = '';
      const E = ZC.map((z, i) => (z && RNG[i] > T ? 1 : 0));
      grid(dyn, { x: X0, y: 298, data: [RNG], cell: C, gap: 0, fill: v => (v > T ? 'f-pri-soft' : 'f-seg'), textCls: v => (v > T ? 't-pri' : 't-muted'), stroke: 'box' });
      grid(dyn, { x: X0, y: 324, data: [E], cell: C, gap: 0, fill: v => (v ? 'f-ok' : 'f-seg'), text: false, stroke: 'box' });
      const kept = E.map((v, i) => (v ? i : -1)).filter(i => i >= 0);
      const total = ZC.reduce((a, b) => a + b, 0);
      role('zc-note').textContent = `The slide-46 code marks ${total} pixels, most of them noise. With T = ${T}, ${kept.length ? kept.length + ' remain, at pixels ' + kept.join(', ') : 'none remain'}. ` +
        (kept.some(i => i >= 18) ? 'Both the strong step (around 10) and the weak step (around 20) are kept.' : kept.length ? 'Only the strong step survives; the weak step (range 37) is gone.' : 'The threshold is above every range, so no edge is left.');
    });
  });

  // Figure 8: one noisy pixel against mean, median, min and max (slides 53-55, 60)
  fig('drag', () => {
    const BASE = [[13, 4, 8], [2, 9, 6], [7, null, 16]];
    const OTHERS = [13, 4, 8, 2, 9, 6, 7, 16], S = 65;
    const med = v => OTHERS.concat([v]).sort((a, b) => a - b)[4];
    const g0 = svg(viz('drag'), 760, 340, { label: 'The slide 55 window with one pixel set to v, its sorted values, and the filter outputs as v changes', minWidth: 560 });
    const ax = axes(g0, { x: 60, y: 170, w: 660, h: 120, xd: [0, 255], yd: [0, 60], xt: [0, 50, 100, 150, 200, 255], yt: [0, 20, 40, 60], xl: 'value of the noisy pixel v', yl: 'filter output' });
    const VS = Array.from({ length: 256 }, (_, i) => i);
    line(g0, VS.map(v => [ax.x(v), ax.y((S + v) / 9)]), 's-sec');
    line(g0, VS.map(v => [ax.x(v), ax.y(med(v))]), 's-pri');
    line(g0, VS.map(v => [ax.x(v), ax.y(Math.min(2, v))]), 's-ter');
    line(g0, VS.filter(v => v <= 60).map(v => [ax.x(v), ax.y(Math.max(16, v))]), 's-muted');
    tx(g0, ax.x(64), ax.y(58), 'max = v (leaves the chart)', 't-muted t-sm');
    tx(g0, ax.x(200), ax.y((S + 200) / 9) - 12, 'mean', 't-sec t-bold halo', 'middle');
    tx(g0, ax.x(200), ax.y(8) - 10, 'median', 't-pri t-bold halo', 'middle');
    tx(g0, ax.x(250), ax.y(2) - 9, 'min', 't-ter t-bold halo', 'end');
    const dyn = s('g', {}, g0);
    slider(viz('drag-slider'), { label: 'v', min: 0, max: 255, step: 1, value: 25 }, v => {
      dyn.textContent = '';
      const W = BASE.map(row => row.map(x => (x == null ? v : x)));
      grid(dyn, { x: 20, y: 30, data: W, cell: 36, gap: 2, fill: () => 'f-seg', stroke: 'box', title: 'window' });
      s('rect', { x: 20 + 38 - 1, y: 30 + 76 - 1, width: 38, height: 38, class: 'f-none outline-sec' }, dyn);
      const sorted = OTHERS.concat([v]).sort((a, b) => a - b);
      const vi = sorted.lastIndexOf(v);
      const gs = grid(dyn, { x: 200, y: 30, data: [sorted], cell: 44, gap: 4, fill: (x, r, c) => (c === 4 ? 'f-pri' : 'f-seg'), textCls: (x, r, c) => (c === 4 ? 't-on t-bold' : 't-fg'), stroke: 'box', title: 'sorted' });
      s('rect', { x: gs.cx(vi) - 2, y: 28, width: 48, height: 48, class: 'f-none outline-sec' }, dyn);
      [[0, 'min', 't-ter'], [4, 'median', 't-pri'], [8, 'max', 't-muted']].forEach(([c, t, cls]) => tx(dyn, gs.cx(c) + 22, 92, t, cls + ' t-bold', 'middle'));
      tx(dyn, gs.cx(vi) + 22, 110, 'v', 't-sec t-bold', 'middle');
      const mean = (S + v) / 9;
      s('line', { x1: ax.x(v), x2: ax.x(v), y1: 170, y2: 290, class: 's-sec dash' }, dyn).setAttribute('style', 'stroke-width: 1');
      [[mean, 'f-sec'], [med(v), 'f-pri'], [Math.min(2, v), 'f-ter']].forEach(([y, c]) => s('circle', { cx: ax.x(v), cy: ax.y(y), r: 4, class: c }, dyn));
      role('drag-med').textContent = String(med(v));
      role('drag-mean').textContent = fmt(mean, 2);
      role('drag-mm').textContent = `${Math.min(2, v)} / ${Math.max(16, v)}`;
    });
  });

  // Cheat sheet
  fig('cheat', () => {
    table(viz('cheat'), ['Fact or formula', 'Value or example'], [
      ['Apply a mask (slide 14)', 'Σ window × weight, written at the centre, no flip'],
      ['Average 3 × 3', '(1/9) all ones, sum 1; bigger mask, more blur'],
      ['Gaussian 3 × 3', '(1/16) [1 2 1; 2 4 2; 1 2 1], sum 1, σ ≈ 0.85'],
      ['Borders (slide 15)', 'zero padding · start at (1,1) · duplicate edges · wrap-around'],
      ['Sharpening', '[0 −1 0; −1 5 −1; 0 −1 0], sum 1 = identity + Laplacian'],
      ['High pass', '(1/9) [−1 −1 −1; −1 8 −1; −1 −1 −1], sum 0'],
      ['High boost', 'α·Original − Lowpass; centre (9α − 1)/9; sum α − 1; α = 1 → high pass'],
      ['Point detection', 'centre 8, others −1; point if |R| > T'],
      ['Line masks', '2s along the line, −1 elsewhere; 4 directions; sum 0'],
      ['Gradient', '√(H_r² + H_c²) or |H_r| + |H_c|; θ = tan⁻¹(H_c / H_r)'],
      ['Roberts / Prewitt / Sobel', 'small area, noisy / vertical-horizontal / diagonal'],
      ['Compass', '8 masks 45° apart; magnitude = largest response'],
      ['Laplacian', 'centre 4 or 8, sum 0; zero crossing; noise, double edges, no direction'],
      ['Zero crossing + T', 'edge if sign change and max − min in 3 × 3 > T'],
      ['LoG / DoG', 'Gaussian then Laplacian / difference of Gaussians, ratio 1.6'],
      ['Color edges', 'luminance · each RGB · √(G_R² + G_G² + G_B²)'],
      ['Median', '5th of 9 sorted; impulse noise, keeps edges'],
      ['Min / max', 'min removes white spikes, max removes dark; both fail on mixed'],
    ].map(r => [{ text: r[0], cls: 'l' }, { text: r[1], cls: 'l' }]));
  });
});
