QV.register('topic12', function (q) {
  const { s, svg, steps, slider, arrow, box, axes, table, fmt } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const tx = (g, x, y, text, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls || null }, g, text);
  // each figure is isolated so one failure leaves the rest of the article drawn
  const fig = (name, fn) => { try { fn(); } catch (e) { QV.fail('topic12 ' + name, e); } };
  const sum = a => a.reduce((t, v) => t + v, 0);
  const LEN = { name: 'length (cm)', sym: 'l*', v0: 4, dv: 2, S: [1, 2, 5, 5, 3, 2, 1, 1, 0, 0], B: [0, 1, 2, 3, 4, 4, 3, 2, 1, 0], best: 4 };
  const LIT = { name: 'lightness', sym: 'x*', v0: 1, dv: 1, S: [2, 3, 4, 5, 3, 2, 1, 0, 0, 0], B: [0, 0, 0, 2, 2, 3, 5, 4, 2, 2], best: 5 };
  const errs = (F, b) => [sum(F.B.slice(0, b)), sum(F.S.slice(b))];

  fig('hist', () => {
    let cur = LEN;
    const thr = b => cur.v0 + (b - 0.5) * cur.dv;
    const g0 = svg(viz('hist'), 640, 270, { label: 'Histograms of salmon and sea bass for one feature with a movable threshold', minWidth: 500 });
    const g = s('g', {}, g0);
    const inp = slider(viz('hist-slider'), { label: 'threshold', min: 0, max: 10, step: 1, value: 4, fmt: b => fmt(thr(b)) }, b => {
      g.textContent = '';
      const ax = axes(g, { x: 50, y: 34, w: 560, h: 180, xd: [-0.5, 9.5], yd: [0, 6], xt: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], xf: i => fmt(cur.v0 + i * cur.dv), yt: [0, 2, 4, 6], xl: cur.name, yl: 'number of fish' });
      for (let i = 0; i < 10; i++) {
        const bar = (x0, v, cls) => { if (v) s('rect', { x: ax.x(x0), y: ax.y(v), width: ax.x(0.36) - ax.x(0), height: ax.y(0) - ax.y(v), class: cls }, g); };
        bar(i - 0.38, cur.S[i], i >= b ? 'f-pri' : 'f-pri-soft');
        bar(i + 0.02, cur.B[i], i < b ? 'f-sec' : 'f-sec-soft');
      }
      const xt = ax.x(b - 0.5);
      s('line', { x1: xt, x2: xt, y1: 30, y2: 214, class: 's-fg', style: 'stroke-width: 2' }, g);
      tx(g, xt, 20, `${cur.sym} = ${fmt(thr(b))}`, 't-fg t-bold', 'middle');
      if (b > 0) tx(g, xt - 8, 44, '← salmon', 't-pri t-bold', 'end');
      if (b < 10) tx(g, xt + 8, 44, 'sea bass →', 't-sec t-bold');
      const [bs, sb] = errs(cur, b);
      role('hist-bs').textContent = bs;
      role('hist-sb').textContent = sb;
      role('hist-tot').textContent = `${bs + sb} = ${fmt(100 * (bs + sb) / 40, 1)} %`;
    });
    steps(viz('hist-steps'), ['Length (slides 8–9)', 'Lightness (slide 10)'], k => {
      cur = k ? LIT : LEN;
      inp.value = cur.best;
      inp.dispatchEvent(new Event('input'));
    });
  });

  fig('cost', () => {
    const g0 = svg(viz('cost'), 640, 290, { label: 'Total cost of each lightness threshold for a chosen cost c', minWidth: 500 });
    const ax = axes(g0, { x: 50, y: 30, w: 560, h: 200, xd: [1, 8], yd: [0, 60], xt: [1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5], yt: [0, 10, 20, 30, 40, 50, 60], xl: 'threshold x* (lightness)', yl: 'total cost' });
    const g = s('g', {}, g0);
    slider(viz('cost-slider'), { label: 'c', min: 1, max: 5, step: 1, value: 2 }, c => {
      g.textContent = '';
      const rows = [1, 2, 3, 4, 5, 6, 7].map(b => { const [bs, sb] = errs(LIT, b); return { t: b + 0.5, bs, sb, tot: c * bs + sb }; });
      const best = rows.reduce((m, r) => (r.tot < m.tot ? r : m));
      const x5 = ax.x(5.5);
      s('line', { x1: x5, x2: x5, y1: 30, y2: 230, class: 's-muted dash' }, g);
      tx(g, x5 + 6, 40, 'fewest errors', 't-muted t-sm');
      rows.forEach(r => {
        const x = ax.x(r.t) - 20;
        s('rect', { x, y: ax.y(r.sb), width: 40, height: ax.y(0) - ax.y(r.sb), class: 'f-pri' }, g);
        s('rect', { x, y: ax.y(r.tot), width: 40, height: ax.y(r.sb) - ax.y(r.tot), class: 'f-sec' }, g);
        tx(g, x + 20, ax.y(r.tot) - 8, String(r.tot), r === best ? 't-ok t-bold' : 't-fg', 'middle');
        if (r === best) {
          s('rect', { x: x - 3, y: ax.y(r.tot) - 3, width: 46, height: ax.y(0) - ax.y(r.tot) + 3, class: 'f-none s-ok' }, g);
          tx(g, x + 20, ax.y(r.tot) - 22, 'lowest', 't-ok t-bold', 'middle');
        }
      });
      role('cost-note').textContent = `c = ${c}: the lowest total cost is ${best.tot} at x* = ${best.t}: ${best.bs} sea bass → salmon × ${c} + ${best.sb} salmon → sea bass × 1.` +
        (best.t < 5.5 ? ' The boundary moved left of 5.5, toward smaller lightness.' : ' Every error costs the same, so the cheapest threshold is the one with the fewest errors.');
    });
  });

  fig('flow', () => {
    const g0 = svg(viz('flow'), 640, 540, { label: 'Pattern recognition system drawn stroke by stroke, input at the bottom, decision at the top', minWidth: 500 });
    const BX = 210, BW = 200, BH = 40, CX = 310;
    const ST = [['sensing', 420, 'transducer:', 'camera or microphone'], ['segmentation', 340, 'isolate each pattern,', 'no overlap'], ['feature extraction', 260, 'discriminative,', 'invariant features'], ['classification', 180, 'feature vector →', 'one category'], ['post-processing', 100, 'context and costs', 'improve the result']];
    const G = [0, 1, 2, 3, 4].map(() => s('g', {}, g0));
    ST.forEach(([n, y], i) => box(G[0], BX, y, BW, BH, n, { cls: i === 3 ? 'f-surface outline-pri' : 'f-surface', textCls: 't-fg t-lg t-bold' }));
    tx(G[0], CX, 528, 'input', 't-fg t-bold', 'middle');
    tx(G[0], CX, 16, 'decision', 't-fg t-bold', 'middle');
    arrow(G[1], CX, 514, CX, 462, { width: 2 });
    arrow(G[1], CX, 98, CX, 28, { width: 2 });
    for (let i = 0; i < 4; i++) {
      const lo = ST[i][1], hi = ST[i + 1][1] + BH;
      arrow(G[1], CX - 30, lo - 2, CX - 30, hi + 2, { width: 2 });
      arrow(G[2], CX + 30, hi + 2, CX + 30, lo - 2, { dash: true });
    }
    arrow(G[3], 470, 110, BX + BW + 2, 110, { cls: 'a-sec' });
    s('path', { d: 'M470 160 L440 160 M440 126 L440 194', class: 'a-sec', style: 'stroke-width: 1.5; fill: none' }, G[3]);
    arrow(G[3], 440, 126, BX + BW + 2, 126, { cls: 'a-sec' });
    arrow(G[3], 440, 194, BX + BW + 2, 194, { cls: 'a-sec' });
    arrow(G[3], 470, 210, BX + BW + 2, 210, { cls: 'a-sec' });
    tx(G[3], 478, 110, 'costs', 't-sec');
    tx(G[3], 478, 153, 'adjustments for', 't-sec');
    tx(G[3], 478, 167, 'context', 't-sec');
    tx(G[3], 478, 210, 'adjustments for', 't-sec');
    tx(G[3], 478, 224, 'missing features', 't-sec');
    ST.forEach(([, y, a, b]) => { tx(G[4], 200, y + 13, a, 't-sm', 'end'); tx(G[4], 200, y + 27, b, 't-sm', 'end'); });
    const NOTES = [
      'Five boxes in a column, sensing at the bottom, post-processing at the top. "input" below, "decision" above. Slide 18 frames classification in red.',
      'Solid arrows (black on the slide) carry the data up: input → sensing → segmentation → feature extraction → classification → post-processing → decision.',
      'Dotted arrows (gray on the slide) go back down from each stage to the stage below it.',
      'Side inputs: costs → post-processing; adjustments for context → post-processing and classification; adjustments for missing features → classification.',
      'For part (b), one line per stage in slide wording (slides 17 and 19). Short versions are on the left.',
    ];
    steps(viz('flow-steps'), ['1. Boxes', '2. Data up', '3. Arrows down', '4. Side inputs', '5. One line each'], k => {
      G.forEach((g, i) => { g.style.display = i <= k ? '' : 'none'; });
      role('flow-note').textContent = NOTES[k];
    }, 4);
  });

  fig('cycle', () => {
    const g0 = svg(viz('cycle'), 600, 380, { label: 'Design cycle with the current step highlighted', minWidth: 480 });
    const names = ['collect data', 'choose features', 'choose model', 'train classifier', 'evaluate classifier'];
    const BXc = 200, BWc = 180, ys = i => 46 + i * 60, fy = i => ys(i) + 18;
    tx(g0, 290, 14, 'start', 't-fg t-bold', 'middle');
    arrow(g0, 290, 24, 290, 44);
    for (let i = 0; i < 4; i++) arrow(g0, 290, ys(i) + 36, 290, ys(i + 1) - 2);
    arrow(g0, 290, ys(4) + 36, 290, 352);
    tx(g0, 290, 366, 'end', 't-fg t-bold', 'middle');
    tx(g0, 14, 150, 'prior knowledge', 't-muted');
    tx(g0, 14, 164, '(e.g., invariances)', 't-muted');
    arrow(g0, 150, 145, BXc - 2, fy(1), { dash: true });
    arrow(g0, 150, 170, BXc - 2, fy(2), { dash: true });
    tx(g0, 488, 190, 'evaluation', 't-muted');
    tx(g0, 488, 204, 'feeds back', 't-muted');
    const fb = s('g', {}, g0);
    const bx = s('g', {}, g0);
    const RUN = [
      [0, 'collect data      40 fish of known species: 20 salmon, 20 sea bass'],
      [1, 'choose features   length'],
      [2, 'choose model      one threshold: length < l* → salmon'],
      [3, 'train classifier  try every l*, keep the fewest errors: l* = 11'],
      [4, `evaluate          ${sum(errs(LEN, 4))} of 40 wrong = ${fmt(100 * sum(errs(LEN, 4)) / 40, 1)} %, too many`],
      [1, 'choose features   feedback: switch to lightness'],
      [2, 'choose model      keep one threshold: lightness < x* → salmon'],
      [3, 'train classifier  keep x* = 5.5'],
      [4, `evaluate          ${sum(errs(LIT, 5))} of 40 wrong = ${fmt(100 * sum(errs(LIT, 5)) / 40, 1)} %, better → end (or add width)`],
    ];
    steps(viz('cycle-steps'), ['1 Collect', '2 Features', '3 Model', '4 Train', '5 Evaluate', '6 Back to features', '7 Model', '8 Train', '9 Evaluate'], k => {
      fb.textContent = ''; bx.textContent = '';
      const cls = k === 5 ? 'a-pri' : 'a-muted';
      s('path', { d: `M${BXc + BWc} ${fy(4)} L480 ${fy(4)} L480 ${fy(0)}`, class: cls, style: 'stroke-width: 1.5; fill: none' }, fb);
      for (let i = 0; i < 4; i++) arrow(fb, 480, fy(i), BXc + BWc + 2, fy(i), { cls });
      names.forEach((n, i) => box(bx, BXc, ys(i), BWc, 36, n, { cls: RUN[k][0] === i ? 'f-pri' : 'f-surface', textCls: RUN[k][0] === i ? 't-on t-bold' : 't-fg' }));
      role('cycle-log').textContent = RUN.slice(0, k + 1).map((r, i) => `${i + 1}. ${r[1]}`).join('\n');
    }, 8);
  });

  const A = [[1, 1], [2, 1], [1, 2], [4, 4]], B = [[6, 6], [8, 6], [7, 8], [7, 4]];
  const mean = P => [sum(P.map(p => p[0])) / P.length, sum(P.map(p => p[1])) / P.length];
  const mA = mean(A), mB = mean(B);
  const dist = (p, r) => Math.hypot(p[0] - r[0], p[1] - r[1]);
  const plane = (host, label) => {
    const g0 = svg(host, 760, 364, { label, minWidth: 560 });
    const ax = axes(g0, { x: 44, y: 24, w: 300, h: 300, xd: [0, 10], yd: [0, 10], xt: [0, 2, 4, 6, 8, 10], yt: [0, 2, 4, 6, 8, 10], xl: 'x₁', yl: 'x₂', grid: false });
    return { g0, ax };
  };
  const dots = (g, ax) => {
    A.forEach(p => s('circle', { cx: ax.x(p[0]), cy: ax.y(p[1]), r: 5, class: 'f-pri sep' }, g));
    B.forEach(p => s('circle', { cx: ax.x(p[0]), cy: ax.y(p[1]), r: 5, class: 'f-sec sep' }, g));
  };
  const cross = (g, ax, m, cls) => {
    const x = ax.x(m[0]), y = ax.y(m[1]);
    s('path', { d: `M${x - 7} ${y - 7} L${x + 7} ${y + 7} M${x - 7} ${y + 7} L${x + 7} ${y - 7}`, class: cls }, g);
  };

  fig('ncm', () => {
    const { g0, ax } = plane(viz('ncm'), 'Nearest class mean with reject circles and the discriminant functions');
    s('line', { x1: ax.x(0), y1: ax.y(9.625), x2: ax.x(7.7), y2: ax.y(0), class: 's-muted dash' }, g0);
    s('circle', { cx: ax.x(mA[0]), cy: ax.y(mA[1]), r: 90, class: 's-pri dash', style: 'stroke-width: 1.5' }, g0);
    s('circle', { cx: ax.x(mB[0]), cy: ax.y(mB[1]), r: 90, class: 's-sec dash', style: 'stroke-width: 1.5' }, g0);
    dots(g0, ax);
    cross(g0, ax, mA, 's-pri');
    cross(g0, ax, mB, 's-sec');
    tx(g0, ax.x(2) + 10, ax.y(2) - 12, 'mean A', 't-pri t-bold halo');
    tx(g0, ax.x(7) + 10, ax.y(6) - 18, 'mean B', 't-sec t-bold halo');
    const g = s('g', {}, g0);
    const X = [5, 4];
    const draw = () => {
      g.textContent = '';
      const dA = dist(X, mA), dB = dist(X, mB), w = dA < dB ? 'A' : 'B', dm = Math.min(dA, dB), rej = dm > 3;
      const px = ax.x(X[0]), py = ax.y(X[1]);
      s('line', { x1: px, y1: py, x2: ax.x(mA[0]), y2: ax.y(mA[1]), class: 's-pri', style: 'stroke-width: 1.5' }, g);
      s('line', { x1: px, y1: py, x2: ax.x(mB[0]), y2: ax.y(mB[1]), class: 's-sec', style: 'stroke-width: 1.5' }, g);
      s('circle', { cx: px, cy: py, r: 6, class: 'f-fg sep' }, g);
      tx(g, px + 10, py + 14, 'x', 't-fg t-bold halo');
      box(g, 470, 30, 170, 40, `x = (${fmt(X[0])}, ${fmt(X[1])})`, { textCls: 't-fg t-bold' });
      box(g, 390, 110, 170, 50, `f₁: to mean A\n${dA.toFixed(3)}`, { cls: w === 'A' ? 'f-pri-soft' : 'f-surface', lh: 16 });
      box(g, 570, 110, 170, 50, `f₂: to mean B\n${dB.toFixed(3)}`, { cls: w === 'B' ? 'f-sec-soft' : 'f-surface', lh: 16 });
      box(g, 470, 200, 170, 50, 'compare and decide\nsmallest, and ≤ 3?', { lh: 16 });
      box(g, 470, 290, 170, 40, `C(x) = ${rej ? 'reject' : w}`, { cls: rej ? 'f-bad-soft' : w === 'A' ? 'f-pri' : 'f-sec', textCls: (rej ? 't-fg' : 't-on') + ' t-bold' });
      arrow(g, 555, 70, 475, 108); arrow(g, 555, 70, 655, 108);
      arrow(g, 475, 160, 530, 198); arrow(g, 655, 160, 580, 198);
      arrow(g, 555, 250, 555, 288);
      const sq = (a, b) => fmt((a - b) ** 2);
      role('ncm-calc').textContent = [
        `d_A = √((${fmt(X[0])} − 2)² + (${fmt(X[1])} − 2)²) = √(${sq(X[0], 2)} + ${sq(X[1], 2)}) = ${dA.toFixed(3)}`,
        `d_B = √((${fmt(X[0])} − 7)² + (${fmt(X[1])} − 6)²) = √(${sq(X[0], 7)} + ${sq(X[1], 6)}) = ${dB.toFixed(3)}`,
        `smallest: ${w}, ${dm.toFixed(3)} ${rej ? '> 3 → reject class' : '≤ 3 → class ' + w}`,
      ].join('\n');
    };
    slider(viz('ncm-x1'), { label: 'x₁', min: 0, max: 10, step: 0.5, value: 5 }, v => { X[0] = v; draw(); });
    slider(viz('ncm-x2'), { label: 'x₂', min: 0, max: 10, step: 0.5, value: 4 }, v => { X[1] = v; draw(); });
  });

  fig('knn', () => {
    const { g0, ax } = plane(viz('knn'), 'Class regions of 1-NN, k-NN and nearest class mean, with the query point');
    const reg = s('g', {}, g0);
    const top = s('g', {}, g0);
    const S = A.map(p => ({ p, c: 'A' })).concat(B.map(p => ({ p, c: 'B' })));
    const Q = [5, 4];
    const rank = x => S.map(o => ({ ...o, d: dist(x, o.p) })).sort((a, b) => a.d - b.d);
    const classify = (x, k) => {
      if (!k) return dist(x, mA) < dist(x, mB) ? 'A' : 'B';
      const r = rank(x).slice(0, k);
      return r.filter(o => o.c === 'A').length * 2 > k ? 'A' : 'B';
    };
    const K = [1, 3, 5, 7, 0];
    const NOTES = [
      '1-NN: the nearest sample is (4, 4), class A, at 1.000, so x → A. The lone A sample makes an island of A inside B\'s side.',
      '3-NN: (4, 4) A, (7, 4) B, (6, 6) B. B wins 2 to 1, and the island is gone.',
      '5-NN: adds (8, 6) B and (2, 1) A. B wins 3 to 2.',
      '7-NN: adds (1, 2) A and (7, 8) B, both at 4.472. B wins 4 to 3.',
      'Nearest class mean: 2.828 to mean B, 3.606 to mean A, so x → B. The boundary is a straight line.',
    ];
    steps(viz('knn-steps'), ['1-NN', '3-NN', '5-NN', '7-NN', 'Nearest mean'], i => {
      const k = K[i];
      reg.textContent = ''; top.textContent = '';
      for (let r = 0; r < 50; r++) for (let c = 0; c < 50; c++) {
        const x = [c * 0.2 + 0.1, r * 0.2 + 0.1];
        s('rect', { x: ax.x(c * 0.2), y: ax.y(r * 0.2 + 0.2), width: 6, height: 6, class: classify(x, k) === 'A' ? 'area-pri' : 'area-sec', style: 'shape-rendering: crispEdges' }, reg);
      }
      dots(top, ax);
      const R = rank(Q), win = classify(Q, k);
      if (k) {
        s('circle', { cx: ax.x(Q[0]), cy: ax.y(Q[1]), r: R[k - 1].d * 30, class: 's-fg dash', style: 'stroke-width: 1.5' }, top);
        R.slice(0, k).forEach(o => s('circle', { cx: ax.x(o.p[0]), cy: ax.y(o.p[1]), r: 9, class: 'f-none s-ok', style: 'stroke-width: 2' }, top));
      } else {
        cross(top, ax, mA, 's-pri');
        cross(top, ax, mB, 's-sec');
      }
      s('circle', { cx: ax.x(Q[0]), cy: ax.y(Q[1]), r: 6, class: 'f-fg sep' }, top);
      tx(top, ax.x(Q[0]) + 8, ax.y(Q[1]) + 14, 'x', 't-fg t-bold halo');
      if (k) {
        tx(top, 400, 40, 'rank  sample  class  distance', 't-muted');
        R.forEach((o, j) => tx(top, 400, 62 + j * 22, `${j + 1}.    (${o.p[0]}, ${o.p[1]})  ${o.c}      ${o.d.toFixed(3)}`, j < k ? 't-bold ' + (o.c === 'A' ? 't-pri' : 't-sec') : 't-muted'));
        const nA = R.slice(0, k).filter(o => o.c === 'A').length;
        tx(top, 400, 250, `votes: A ${nA}, B ${k - nA}`, 't-fg');
      } else {
        tx(top, 400, 62, `mean A (2, 2)  ${dist(Q, mA).toFixed(3)}`, 't-pri');
        tx(top, 400, 84, `mean B (7, 6)  ${dist(Q, mB).toFixed(3)}`, 't-sec t-bold');
      }
      tx(top, 400, 280, '→ class ' + win, 't-lg t-bold ' + (win === 'A' ? 't-pri' : 't-sec'));
      role('knn-note').textContent = NOTES[i];
    });
  });

  fig('cheat', () => {
    table(viz('cheat'), ['Fact', 'Value or example'], [
      ['Pattern / feature / pattern class', '"arrangement of descriptors" / a descriptor / "family of patterns that share some common properties"'],
      ['System, bottom to top', 'input → sensing → segmentation → feature extraction → classification → post-processing → decision'],
      ['Side inputs', 'costs → post-processing; context → post-processing and classification; missing features → classification'],
      ['Design cycle', 'collect data → features → model → train → evaluate, feedback; prior knowledge → features, model'],
      ['Supervised / unsupervised', 'teacher gives labels / system forms clusters'],
      ['Statistical / structural', 'vectors of numbers / grammar or graph, parsing and graph matching'],
      ['Nearest class mean', 'd = √Σ(x[i] − x_c[i])², closest mean, reject if too far'],
      ['Scaled distance', 'divide each difference by σᵢ of that class'],
      ['Nearest neighbour', 'keep all samples, class of the nearest; k-NN = majority of k'],
      ['Bayes', 'P(ωᵢ | x) = p(x | ωᵢ) P(ωᵢ) / p(x), largest wins'],
      ['Template matching', 'pad (m − 1)/2 rows, (n − 1)/2 columns; best match = max γ'],
      ['Fish', 'length poor alone; lightness better; add width; move x* left to cut sea bass → salmon'],
    ].map(r => [{ text: r[0], cls: 'l' }, { text: r[1], cls: 'l' }]));
  });
});
