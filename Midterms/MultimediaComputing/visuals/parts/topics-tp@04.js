QV.register('topic4', function (q) {
  const { s, h, svg, steps, slider, arrow, box, axes, line, plot, table } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const tx = (g, x, y, text, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls || null }, g, text);
  // each figure is isolated so one failure leaves the rest of the article drawn
  const fig = (name, fn) => { try { fn(); } catch (e) { QV.fail('topic4 ' + name, e); } };
  const f3 = v => v.toFixed(3);

  // Figure 1: DPCM with a closed and an open prediction loop
  fig('dpcm', () => {
    const F = [50, 52, 56, 59, 61, 63, 65, 59, 55, 51];
    const g0 = svg(viz('dpcm'), 760, 236, { label: 'Original samples, DPCM reconstruction and open-loop reconstruction for a chosen quantizer step', minWidth: 540 });
    const g = s('g', {}, g0);
    const tHost = viz('dpcm-table');
    const run = d => {
      const Q = e => d * Math.round(e / d);
      const rec = [F[0]], pred = [null], err = [null], qe = [null];
      for (let n = 1; n < F.length; n++) {
        const p = rec[n - 1], e = F[n] - p;
        pred.push(p); err.push(e); qe.push(Q(e)); rec.push(p + Q(e));
      }
      const ol = [F[0]];
      for (let n = 1; n < F.length; n++) ol.push(ol[n - 1] + Q(F[n] - F[n - 1]));
      return { rec, pred, err, qe, ol };
    };
    slider(viz('dpcm-slider'), { label: 'quantizer step Δ', min: 1, max: 9, step: 2, value: 5 }, d => {
      g.textContent = '';
      tHost.textContent = '';
      const r = run(d);
      const ax = axes(g, { x: 56, y: 22, w: 680, h: 160, xd: [0.5, 10.5], yd: [30, 70], xt: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], yt: [30, 40, 50, 60, 70], xl: 'sample n', yl: 'value' });
      const pts = a => a.map((v, i) => [ax.x(i + 1), ax.y(v)]);
      line(g, pts(r.ol), 's-sec dash');
      line(g, pts(r.rec), 's-pri');
      r.ol.forEach((v, i) => s('rect', { x: ax.x(i + 1) - 3.5, y: ax.y(v) - 3.5, width: 7, height: 7, class: 'f-sec' }, g));
      F.forEach((v, i) => s('circle', { cx: ax.x(i + 1), cy: ax.y(v), r: 6.5, class: 'f-none s-fg' }, g));
      r.rec.forEach((v, i) => s('circle', { cx: ax.x(i + 1), cy: ax.y(v), r: 3.5, class: 'f-pri' }, g));
      const dErr = F.map((v, i) => v - r.rec[i]), oErr = F.map((v, i) => v - r.ol[i]);
      const mD = Math.max(...dErr.map(Math.abs)), mO = Math.max(...oErr.map(Math.abs));
      role('dpcm-max').textContent = String(mD);
      role('dpcm-ol').textContent = String(mO);
      const cell = v => (v == null ? '' : String(v).replace('-', '−'));
      table(tHost, ['n'].concat(F.map((_, i) => String(i + 1))), [
        ['f'].concat(F.map(cell)),
        ['f̂ = f̃ₙ₋₁'].concat(r.pred.map(cell)),
        ['e = f − f̂'].concat(r.err.map(cell)),
        ['ẽ = Q[e]'].concat(r.qe.map(cell)),
        [{ text: 'f̃ = f̂ + ẽ', cls: 'hl' }].concat(r.rec.map(v => ({ text: cell(v), cls: 'hl' }))),
        ['f − f̃'].concat(dErr.map(cell)),
      ].map(row => row.map((c, i) => (i ? c : (typeof c === 'string' ? { text: c, cls: 'l' } : Object.assign(c, { cls: 'l hl' }))))));
      role('dpcm-note').textContent = d === 1
        ? 'Δ = 1 keeps every error exactly, so this is lossless predictive coding. Both decoders give f back.'
        : `Δ = ${d}: DPCM errors stay within ±${mD}, because each one is only that sample's own rounding. Predicting from the original samples, the decoder adds up every rounding error and ends ${Math.abs(oErr[9])} off at sample 10.`;
    });
  });

  // Figure 2: entropy of a two-value source
  fig('entropy', () => {
    const g0 = svg(viz('ent'), 760, 232, { label: 'Histogram of two gray values with their self-information, and the entropy curve with the current probability marked', minWidth: 540 });
    const g = s('g', {}, g0);
    const info = p => Math.log2(1 / p);
    const Hb = p => p * info(p) + (1 - p) * info(1 - p);
    const gcd = (a, b) => (b ? gcd(b, a % b) : a);
    const frac = k => { const c = gcd(k, 24); return `${k / c}/${24 / c}`; };
    slider(viz('ent-slider'), { label: 'p(light)', min: 1, max: 23, step: 1, value: 8, fmt: k => `${frac(k)} = ${f3(k / 24)}` }, k => {
      g.textContent = '';
      const p = k / 24, H = Hb(p);
      const a1 = axes(g, { x: 60, y: 22, w: 240, h: 140, xd: [0, 2], yd: [0, 1], yt: [0, 0.5, 1], yl: 'p' });
      [['dark', 1 - p, 60], ['light', p, 200]].forEach(([name, pp, gv], i) => {
        const cx = a1.x(i + 0.5), top = a1.y(pp);
        s('rect', { x: cx - 35, y: top, width: 70, height: a1.y(0) - top, class: 'box', style: QV.gray(gv).style }, g); // data-color: the two gray levels
        tx(g, cx, 180, name + '  p = ' + f3(pp), 't-fg', 'middle');
        tx(g, cx, 197, info(pp).toFixed(3) + ' bits', 't-pri', 'middle');
      });
      tx(g, 60, 216, 'self-information log₂(1/p) of each value', 't-sm');
      const a2 = axes(g, { x: 430, y: 22, w: 300, h: 140, xd: [0, 1], yd: [0, 1], xt: [0, 0.25, 0.5, 0.75, 1], yt: [0, 0.5, 1], xl: 'p(light)', yl: 'η, bits/symbol' });
      plot(g, a2, Hb, 0.001, 0.999, 200, 's-pri');
      s('line', { x1: a2.x(p), x2: a2.x(p), y1: a2.y(0), y2: a2.y(H), class: 's-muted dash' }, g);
      s('circle', { cx: a2.x(p), cy: a2.y(H), r: 5, class: 'f-pri' }, g);
      const lx = Math.max(470, Math.min(690, a2.x(p)));
      tx(g, lx, a2.y(H) + (H > 0.75 ? 16 : -14), 'η = ' + f3(H), 't-pri t-bold halo', 'middle');
      role('ent-note').textContent = `Light pixels carry ${info(p).toFixed(3)} bits each, dark ones ${info(1 - p).toFixed(3)} bits. Weighted by how often each occurs: η = ${f3(p)} × ${info(p).toFixed(3)} + ${f3(1 - p)} × ${info(1 - p).toFixed(3)} = ${f3(H)} bits per pixel.` +
        (k === 12 ? ' Equal probabilities give the maximum, log₂ 2 = 1 bit.' : k === 8 || k === 16 ? ' This is Fig. 7.2(b), 0.92 on the slide.' : '');
    });
  });

  // Figure 3: Shannon-Fano splits drawn as nested segments (slides 19-23)
  fig('sf', () => {
    const g0 = svg(viz('sf'), 760, 300, { label: 'Shannon-Fano splits for HELLO as nested segments, with the candidate cuts of the current split', minWidth: 540 });
    const g = s('g', {}, g0);
    const CNT = { L: 2, H: 1, E: 1, O: 1 };
    const U = 120, X0 = 110, RY = [34, 96, 158, 220], RH = 40;
    const T73 = { s: 'LHEO', k: [{ s: 'L' }, { s: 'HEO', k: [{ s: 'H' }, { s: 'EO', k: [{ s: 'E' }, { s: 'O' }] }] }] };
    const T74 = { s: 'LHEO', k: [{ s: 'LH', k: [{ s: 'L' }, { s: 'H' }] }, { s: 'EO', k: [{ s: 'E' }, { s: 'O' }] }] };
    const sum = str => [...str].reduce((a, c) => a + CNT[c], 0);
    const CFG = [
      { t: T73, depth: 3 },
      { t: T73, depth: 1, at: 'LHEO', pick: 1 },
      { t: T73, depth: 2, at: 'HEO', pick: 1 },
      { t: T73, depth: 3, at: 'EO', pick: 1 },
      { t: T74, depth: 2, at: 'LHEO', pick: 2 },
    ];
    const NOTES = [
      'Fig. 7.3. Sorted counts L 2, H 1, E 1, O 1. Each row splits every group of the row above into two parts with counts as equal as possible, left 0 and right 1. Codes: L 0, H 10, E 110, O 111.',
      'Split 1 on all 5 counts. After L gives 2 | 3 and after H gives 3 | 2, both differ by 1: a tie. Fig. 7.3 cuts after L. After E gives 4 | 1, worse.',
      'Split 2 on H, E, O. After H gives 1 | 2, after E gives 2 | 1: another tie. The slide cuts after H, so H = 10.',
      'Split 3 on E, O: 1 | 1. Every part now holds one symbol, so the splitting stops. E = 110, O = 111.',
      'Fig. 7.4 takes the other cut at split 1: L, H (3) | E, O (2). Then L | H and E | O. Every code has 2 bits: L 00, H 01, E 10, O 11.',
    ];
    steps(viz('sf-steps'), ['Fig. 7.3', 'Split 1', 'Split 2', 'Split 3', 'Fig. 7.4'], k => {
      g.textContent = '';
      const c = CFG[k];
      ['all', 'split 1', 'split 2', 'split 3'].forEach((l, d) => { if (d <= c.depth) tx(g, 0, RY[d] + RH / 2, l, 't-fg t-bold'); });
      const codes = {};
      const draw = (n, d, x, code) => {
        if (d > c.depth) return;
        const leaf = !n.k, w = sum(n.s) * U;
        if (leaf) codes[n.s] = code;
        box(g, x + 2, RY[d], w - 4, RH, `${n.s.split('').join(' ')} : ${sum(n.s)}` + (code ? '\ncode ' + code : ''), {
          cls: leaf ? 'f-pri' : 'f-pri-soft', textCls: leaf ? 't-on' : 't-fg', rx: 4, lh: 14, stroke: 'sep',
        });
        if (n.s === c.at && d < c.depth) {
          let run = 0;
          for (let i = 1; i < n.s.length; i++) {
            run += CNT[n.s[i - 1]];
            const cx = x + run * U, diff = Math.abs(2 * run - sum(n.s)), chosen = i === c.pick;
            s('line', { x1: cx, x2: cx, y1: RY[d] - 3, y2: RY[d] + RH + 3, class: chosen ? 's-sec' : 's-muted dash' }, g);
            tx(g, cx, RY[d] - 9, `${run} | ${sum(n.s) - run}, diff ${diff}`, chosen ? 't-sec t-bold t-sm' : 't-sm', 'middle');
          }
        }
        if (n.k) { draw(n.k[0], d + 1, x, code + '0'); draw(n.k[1], d + 1, x + sum(n.k[0].s) * U, code + '1'); }
      };
      draw(c.t, 0, X0, '');
      const done = Object.keys(codes).length === 4;
      if (done) {
        const bits = Object.entries(codes).map(([sy, cd]) => CNT[sy] * cd.length);
        tx(g, X0, 284, Object.entries(codes).map(([sy, cd]) => `${sy} ${cd}`).join('   ') + `   total ${bits.join(' + ')} = ${bits.reduce((a, b) => a + b, 0)} bits`, 't-ok t-bold');
      }
      role('sf-note').textContent = NOTES[k];
    });
  });

  // Figure 4: Huffman merges on slide 24's counts
  fig('huffman', () => {
    const g0 = svg(viz('hf'), 760, 336, { label: 'Huffman tree for A 15, B 7, C 6, D 6, E 5, built by four merges', minWidth: 540 });
    const NODES = {
      root: { x: 330, y: 100, c: 39, step: 4 },
      A: { x: 200, y: 166, c: 15, leaf: 'A', code: '0' },
      n24: { x: 470, y: 166, c: 24, step: 3 },
      n13: { x: 380, y: 230, c: 13, step: 2 },
      n11: { x: 560, y: 230, c: 11, step: 1 },
      B: { x: 330, y: 296, c: 7, leaf: 'B', code: '100' },
      C: { x: 430, y: 296, c: 6, leaf: 'C', code: '101' },
      D: { x: 510, y: 296, c: 6, leaf: 'D', code: '110' },
      E: { x: 610, y: 296, c: 5, leaf: 'E', code: '111' },
    };
    const EDGES = [['root', 'A', '0'], ['root', 'n24', '1'], ['n24', 'n13', '0'], ['n24', 'n11', '1'], ['n13', 'B', '0'], ['n13', 'C', '1'], ['n11', 'D', '0'], ['n11', 'E', '1']];
    const LISTS = [
      [['A', 15], ['B', 7], ['C', 6], ['D', 6], ['E', 5]],
      [['A', 15], ['DE', 11], ['B', 7], ['C', 6]],
      [['A', 15], ['BC', 13], ['DE', 11]],
      [['BCDE', 24], ['A', 15]],
      [['ABCDE', 39]],
    ];
    const NEW = [null, 'DE', 'BC', 'BCDE', 'ABCDE'];
    const NOTES = [
      'The finished tree. A, the most common symbol, sits next to the root with the 1-bit code 0. B, C, D and E get 3 bits. Total 15 × 1 + (7 + 6 + 6 + 5) × 3 = 87 bits.',
      'Merge 1. The lowest count is E 5. The next is a tie, C 6 and D 6; the slide takes D. Their parent DE has 6 + 5 = 11 and goes back into the list.',
      'Merge 2. Now the two lowest are C 6 and B 7. Parent BC = 13.',
      'Merge 3. The two lowest are the two parents, DE 11 and BC 13. Parent BCDE = 24. A 15 still waits.',
      'Merge 4. A 15 and BCDE 24 make the root, 39. Label the branches 0 and 1 from the root and read each code downward.',
    ];
    const g = s('g', {}, g0);
    steps(viz('hf-steps'), ['All', 'Merge 1', 'Merge 2', 'Merge 3', 'Merge 4'], k => {
      g.textContent = '';
      const shown = n => !n.step || k === 0 || n.step <= k, full = k === 0 || k === 4;
      EDGES.forEach(([a, b, bit]) => {
        const A = NODES[a], B = NODES[b];
        if (!shown(A)) return;
        s('line', { x1: A.x, y1: A.y, x2: B.x, y2: B.y, class: 's-muted' }, g);
        if (full) tx(g, (A.x + B.x) / 2 + (bit === '0' ? -12 : 12), (A.y + B.y) / 2 - 4, bit, 't-fg t-bold halo', 'middle');
      });
      Object.values(NODES).forEach(n => {
        if (!shown(n)) return;
        if (n.leaf) {
          box(g, n.x - 30, n.y - 13, 60, 26, `${n.leaf} ${n.c}`, { rx: 5 });
          if (full) tx(g, n.x, n.y + 26, n.code, 't-ok t-bold t-lg', 'middle');
        } else {
          const fresh = k > 0 && n.step === k;
          s('circle', { cx: n.x, cy: n.y, r: 18, class: fresh ? 'f-pri' : 'f-pri-soft outline-pri' }, g);
          tx(g, n.x, n.y, String(n.c), (fresh ? 't-on' : 't-pri') + ' t-bold', 'middle');
        }
      });
      tx(g, 0, 32, k === 0 ? 'list, start' : 'list after ' + k, 't-fg t-bold');
      LISTS[k].forEach(([n, c], i) => {
        const fresh = n === NEW[k];
        box(g, 110 + i * 104, 18, 96, 28, `${n} ${c}`, { cls: fresh ? 'f-pri' : 'f-surface', textCls: fresh ? 't-on t-bold' : 't-fg', rx: 5 });
      });
      role('hf-note').textContent = NOTES[k];
    });
  });

  // Figure 5: extended Huffman, p(a) = 0.9
  fig('extended', () => {
    const PA = 0.9, PB = 0.1;
    const ETA = PA * Math.log2(1 / PA) + PB * Math.log2(1 / PB);
    const lengths = ps => {
      let nodes = ps.map((p, i) => ({ p, i, m: [i] }));
      const L = ps.map(() => 0);
      let nxt = ps.length;
      while (nodes.length > 1) {
        nodes.sort((a, b) => (a.p - b.p) || (a.i - b.i));
        const a = nodes.shift(), b = nodes.shift();
        a.m.concat(b.m).forEach(j => { L[j] += 1; });
        nodes.push({ p: a.p + b.p, i: nxt++, m: a.m.concat(b.m) });
      }
      return L;
    };
    const DATA = [1, 2, 3, 4].map(k => {
      const syms = [];
      for (let v = 0; v < 2 ** k; v++) syms.push([...v.toString(2).padStart(k, '0')].map(b => (b === '0' ? 'a' : 'b')).join(''));
      const ps = syms.map(sy => { let p = 1; for (const ch of sy) p *= ch === 'a' ? PA : PB; return p; });
      const L = lengths(ps);
      const lb = ps.reduce((a, p, i) => a + p * L[i], 0);
      return { k, syms, ps, L, lb, per: lb / k };
    });
    const g0 = svg(viz('ext'), 760, 236, { label: 'Bits per original symbol of extended Huffman codes for k = 1 to 4, with the entropy and the bound', minWidth: 540 });
    const g = s('g', {}, g0);
    const chips = role('ext-codes');
    slider(viz('ext-slider'), { label: 'group size k', min: 1, max: 4, step: 1, value: 2 }, k => {
      g.textContent = '';
      const ax = axes(g, { x: 70, y: 22, w: 600, h: 150, xd: [0.5, 4.5], yd: [0, 1.6], yt: [0, 0.4, 0.8, 1.2, 1.6], xt: [1, 2, 3, 4], xf: v => 'k = ' + v, yl: 'bits per original symbol' });
      DATA.forEach(d => {
        const cx = ax.x(d.k), cur = d.k === k;
        s('rect', { x: cx - 35, y: ax.y(d.per), width: 70, height: ax.y(0) - ax.y(d.per), class: cur ? 'f-pri' : 'f-pri-soft' }, g);
        tx(g, cx, ax.y(d.per) - 9, d.per.toFixed(3), (cur ? 't-pri t-bold' : 't-muted'), 'middle');
        s('line', { x1: cx - 44, x2: cx + 44, y1: ax.y(ETA + 1 / d.k), y2: ax.y(ETA + 1 / d.k), class: 's-sec', style: cur ? null : 'opacity: 0.45' }, g);
        tx(g, cx, 210, `${2 ** d.k} groups`, 't-sm', 'middle');
      });
      s('line', { x1: 70, x2: 670, y1: ax.y(ETA), y2: ax.y(ETA), class: 's-ok dash', style: 'stroke-width: 1.5' }, g);
      tx(g, 676, ax.y(ETA), 'η = ' + f3(ETA), 't-ok t-bold');
      const cx = ax.x(k);
      tx(g, Math.min(cx + 48, 600), ax.y(ETA + 1 / k), 'η + 1/k = ' + f3(ETA + 1 / k), 't-sec t-sm');
      const d = DATA[k - 1];
      chips.textContent = '';
      d.syms.forEach((sy, i) => h('span', { class: i === 0 ? 'out' : null }, chips, `${sy} ${Number(d.ps[i].toPrecision(4))} → ${d.L[i]} bit${d.L[i] > 1 ? 's' : ''}`));
      role('ext-note').textContent = `k = ${k}: ${2 ** k} groups. Huffman spends ${Number(d.lb.toFixed(4))} bits per group, so ${f3(d.per)} bits per symbol, inside [${f3(ETA)}, ${f3(ETA + 1 / k)}). Efficiency η / l̄ = ${f3(ETA / d.per)}.` +
        (k === 1 ? ' Each symbol costs a whole bit although the entropy is less than half a bit.' : '');
    });
  });

  // Figure 6: adaptive Huffman node swapping, Fig. 7.6 (slide 36)
  fig('adaptive', () => {
    const Lf = (n, sym, c) => ({ n, sym, c });
    const In = (n, c, a, b) => ({ n, c, kids: [a, b] });
    const sub = () => In(4, '2', Lf(1, 'D', '1'), Lf(2, 'B', '1'));
    const TB = A => In(9, '10', In(7, '5', In(5, '2', Lf(1, 'D', '1'), Lf(2, 'B', '1')), In(6, '3', Lf(3, 'C', '1'), Lf(4, 'A', A))), Lf(8, 'P', '5'));
    const ST = [
      { t: In(9, '9', In(7, '4', In(5, '2', Lf(1, 'A', '1'), Lf(2, 'B', '1')), In(6, '2', Lf(3, 'C', '1'), Lf(4, 'D', '1'))), Lf(8, 'P', '5')), inc: [], moved: [] },
      { t: TB('2'), inc: [4], moved: [1] },
      { t: TB('2+1'), inc: [], moved: [], swap: [5, 4], bad: [4] },
      { t: In(9, '10', In(7, '5+1', Lf(5, 'A', '3'), In(6, '3', Lf(3, 'C', '1'), sub())), Lf(8, 'P', '5')), inc: [5], moved: [4], swap: [7, 8], bad: [7] },
      { t: In(9, '11', Lf(7, 'P', '5'), In(8, '6', Lf(5, 'A', '3'), In(6, '3', Lf(3, 'C', '1'), sub()))), inc: [5], moved: [7, 8] },
    ];
    const NOTES = [
      '(a) A tree with the sibling property. Counts in node order 1 to 9: 1, 1, 1, 1, 2, 2, 4, 5, 9, never decreasing. A\'s code is 000, P\'s is 1.',
      '(b) The 2nd A arrives. A (node 1) would go from 1 to 2, above nodes 2 to 4 that hold 1. So A first swaps with the farthest node with count 1, node 4 (D). Then A becomes 2, and nodes 6, 7 and 9 go up by one. A\'s code is now 011.',
      '(c-1) The 3rd A arrives. A, now node 4, would go from 2 to 3, above node 5 with count 2. The farthest node with count 2 is node 5, a whole subtree (D, B). Swap them.',
      '(c-2) A is now node 5 with count 3, and the D, B subtree hangs under node 6 as node 4. Node 7 must go from 5 to 6, above node 8 (P, 5). Another swap: node 7 with node 8.',
      '(c-3) The tree after the 3rd A. Counts in node order: 1, 1, 1, 2, 3, 3, 5, 6, 11, never decreasing. A now has the 2-bit code 10 (it was 000), and P moved from 1 to 0.',
    ];
    const g0 = svg(viz('ah'), 760, 350, { label: 'Adaptive Huffman tree of Fig. 7.6 at each stage, with the counts listed in node order', minWidth: 540 });
    const g = s('g', {}, g0);
    steps(viz('ah-steps'), ['(a)', '(b)', '(c-1)', '(c-2)', '(c-3)'], k => {
      g.textContent = '';
      const st = ST[k], pos = {}, counts = {};
      let slot = 0;
      const lay = (n, d) => {
        if (n.kids) { n.kids.forEach(c => lay(c, d + 1)); n.x = (n.kids[0].x + n.kids[1].x) / 2; } else n.x = 120 + 130 * slot++;
        n.y = 30 + d * 54;
        pos[n.n] = n; counts[n.n] = n.c;
      };
      lay(st.t, 0);
      const edges = n => {
        if (!n.kids) return;
        n.kids.forEach((c, i) => {
          s('line', { x1: n.x, y1: n.y, x2: c.x, y2: c.y, class: 's-muted' }, g);
          tx(g, (n.x + c.x) / 2 + (i ? 9 : -9), (n.y + c.y) / 2 - 5, String(i), 't-sm');
          edges(c);
        });
      };
      edges(st.t);
      Object.values(pos).forEach(n => {
        const w = n.sym ? 82 : 62;
        const inc = st.inc.indexOf(n.n) >= 0, bad = (st.bad || []).indexOf(n.n) >= 0;
        const lab = `${n.n}. ${n.sym ? n.sym + ':' : ''}(${n.c})`;
        box(g, n.x - w / 2, n.y - 12, w, 24, lab, { cls: inc ? 'f-pri' : bad ? 'f-bad-soft' : 'f-surface', textCls: inc ? 't-on t-bold' : bad ? 't-bad t-bold' : 't-fg', rx: 5 });
        if (st.moved.indexOf(n.n) >= 0) s('rect', { x: n.x - w / 2 - 3, y: n.y - 15, width: w + 6, height: 30, rx: 7, class: 'f-none outline-sec' }, g);
      });
      if (st.swap) {
        const [a, b] = st.swap.map(i => pos[i]);
        const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, off = 48;
        const p1 = [a.x + ux * off, a.y + uy * off + 14], p2 = [b.x - ux * off, b.y - uy * off + 14];
        arrow(g, p1[0], p1[1], p2[0], p2[1], { cls: 'a-sec', width: 2 });
        arrow(g, p2[0], p2[1], p1[0], p1[1], { cls: 'a-sec', width: 2 });
      }
      tx(g, 0, 296, 'node', 't-fg t-bold');
      tx(g, 0, 322, 'count', 't-fg t-bold');
      for (let i = 1; i <= 9; i++) {
        const x = 110 + (i - 1) * 64, inc = st.inc.indexOf(i) >= 0, bad = (st.bad || []).indexOf(i) >= 0;
        tx(g, x + 30, 296, String(i), 't-sm', 'middle');
        s('rect', { x, y: 308, width: 60, height: 28, rx: 4, class: inc ? 'f-pri-soft' : bad ? 'f-bad-soft' : 'f-seg' }, g);
        tx(g, x + 30, 322, counts[i], (bad ? 't-bad' : inc ? 't-pri' : 't-fg') + ' t-bold', 'middle');
        if (i < 9) tx(g, x + 62, 322, '≤', 't-sm', 'middle');
      }
      role('ah-note').textContent = NOTES[k];
    });
  });

  // Figure 7: LZW encoding of Example 7.2 (slides 39-41)
  fig('lzw', () => {
    const IN = 'ABABBABCABABBA';
    const dict = { A: 1, B: 2, C: 3 };
    const rows = [], pieces = [];
    let nxt = 4, sStr = IN[0], start = 0;
    for (let i = 1; i <= IN.length; i++) {
      const c = i < IN.length ? IN[i] : 'EOF';
      if (c !== 'EOF' && dict[sStr + c]) { rows.push({ s: sStr, c, piece: pieces.length }); sStr += c; continue; }
      const add = c === 'EOF' ? null : { code: nxt, str: sStr + c };
      rows.push({ s: sStr, c, out: dict[sStr], add, piece: pieces.length });
      pieces.push({ start, len: sStr.length, str: sStr, code: dict[sStr], add });
      if (add) dict[add.str] = nxt++;
      start += sStr.length;
      sStr = c;
    }
    const ENTRIES = [[1, 'A'], [2, 'B'], [3, 'C']].concat(pieces.filter(p => p.add).map(p => [p.add.code, p.add.str]));
    const X0 = 110, CW = 40, DW = 56;
    const g0 = svg(viz('lzw'), 760, 196, { label: 'LZW encoding of ABABBABCABABBA: input pieces, output codes and the growing dictionary', minWidth: 540 });
    const g = s('g', {}, g0);
    const tb = table(viz('lzw-table'), ['S', 'C', 'Output', 'Code', 'String'], rows.map(r => [r.s, r.c, r.out || '', r.add ? r.add.code : '', r.add ? r.add.str : '']).map(r => r.map(c => ({ text: String(c), cls: 'l' }))));
    steps(viz('lzw-steps'), ['All'].concat(pieces.map(p => `${p.str}→${p.code}`)), k => {
      g.textContent = '';
      const cur = k - 1;
      tx(g, 0, 40, 'input', 't-fg t-bold');
      tx(g, 0, 84, 'output', 't-fg t-bold');
      tx(g, 0, 150, 'dictionary', 't-fg t-bold');
      pieces.forEach((p, i) => {
        for (let j = 0; j < p.len; j++) {
          const x = X0 + (p.start + j) * CW;
          const on = i === cur, done = k === 0 || i < cur;
          s('rect', { x, y: 26, width: CW, height: 30, class: (on ? 'f-pri' : done ? 'f-pri-soft' : 'f-seg') + ' sep' }, g);
          tx(g, x + CW / 2, 41, IN[p.start + j], on ? 't-on t-bold' : 't-fg', 'middle');
        }
        if (k === 0 || i <= cur) {
          const x1 = X0 + p.start * CW + 4, x2 = X0 + (p.start + p.len) * CW - 4;
          line(g, [[x1, 62], [x1, 68], [x2, 68], [x2, 62]], i === cur ? 's-pri' : 's-muted');
          tx(g, (x1 + x2) / 2, 84, String(p.code), (i === cur ? 't-pri' : 't-fg') + ' t-bold t-lg', 'middle');
        }
      });
      if (k > 0 && cur < pieces.length - 1) {
        const ci = pieces[cur].start + pieces[cur].len, x = X0 + ci * CW;
        s('rect', { x, y: 26, width: CW, height: 30, class: 'f-sec sep' }, g);
        tx(g, x + CW / 2, 41, IN[ci], 't-on t-bold', 'middle');
      }
      ENTRIES.forEach(([code, str], i) => {
        const x = X0 + i * DW, made = pieces.findIndex(p => p.add && p.add.code === code);
        const fresh = k > 0 && made === cur, known = code <= 3 || k === 0 || made < cur;
        if (!fresh && !known) {
          s('rect', { x: x + 2, y: 130, width: DW - 4, height: 40, rx: 4, class: 'f-none box dash' }, g);
          tx(g, x + DW / 2, 141, String(code), 't-sm', 'middle');
          return;
        }
        box(g, x + 2, 130, DW - 4, 40, `${code}\n${str}`, { cls: fresh ? 'f-ok' : code <= 3 ? 'f-seg' : 'f-ok-soft', textCls: fresh ? 't-on t-bold' : 't-fg', rx: 4, lh: 15, stroke: 'sep' });
        if (k > 0 && code === pieces[cur].code) s('rect', { x: x, y: 128, width: DW, height: 44, rx: 5, class: 'f-none outline-pri' }, g);
      });
      tb.rows.forEach((r, i) => r.classList.toggle('on', k > 0 && rows[i].piece === cur));
      if (k === 0) {
        role('lzw-note').textContent = `Output ${pieces.map(p => p.code).join(' ')}: ${pieces.length} codes for ${IN.length} characters, ratio ${IN.length}/${pieces.length} = ${(IN.length / pieces.length).toFixed(2)}. Each new entry is a piece plus the next character.`;
      } else {
        const p = pieces[cur];
        role('lzw-note').textContent = p.add
          ? `s = ${p.str}, c = ${p.add.str.slice(-1)}: ${p.add.str} is not in the dictionary. Output ${p.code}, the code of ${p.str}. Add ${p.add.code} = ${p.add.str}. Restart with s = ${p.add.str.slice(-1)}.`
          : `s = ${p.str}, then EOF. Output ${p.code}, the code of ${p.str}. Nothing is added.`;
      }
    });
  });

  // Figure 8: LZW decoding one step behind the encoder, with the exception
  fig('decode', () => {
    const COLS = [
      { reads: 'A', sends: '1', eadd: '3 = AB', knows: '1–2', out: 'A', dadd: 'nothing' },
      { reads: 'B', sends: '2', eadd: '4 = BA', knows: '1–3', out: 'B', dadd: '3 = AB' },
      { reads: 'AB', sends: '3', eadd: '5 = ABA', knows: '1–3', out: 'AB', dadd: '4 = BA' },
      { reads: 'ABA', sends: '5', eadd: 'EOF', knows: '1–4, no 5', out: 'AB + A = ABA', dadd: '5 = ABA', exc: true },
    ];
    const ROWS = [['encoder reads', 'reads', 30], ['sends', 'sends', 66], ['encoder adds', 'eadd', 102], ['decoder knows', 'knows', 156], ['decoder outputs', 'out', 192], ['decoder adds', 'dadd', 228]];
    const CX = [234, 368, 502, 636], CWD = 124;
    const NOTES = [
      'The decoder makes the same entries as the encoder, one code later. The encoder adds 3 = AB while sending 1; the decoder adds it on receiving 2. Code 5 is sent right after the encoder made it, before the decoder can.',
      'Code 1 arrives. The decoder outputs A. s was NIL, so nothing is added. s = A.',
      'Code 2 arrives: B. Add s + entry[0] = A + B = AB as 3, the entry the encoder made one code earlier. s = B.',
      'Code 3 arrives: AB, already known. Add s + entry[0] = B + A = BA as 4. s = AB.',
      'Code 5 is not in the dictionary: the decoder only has 1 to 4. Algorithm 7.3 fails here. Algorithm 7.4 sets entry = s + s[0] = AB + A = ABA, outputs it and adds 5 = ABA. Decoded: A B AB ABA = ABABABA.',
    ];
    const g0 = svg(viz('dec'), 760, 250, { label: 'LZW encoder and decoder side by side for ABABABA, codes 1 2 3 5', minWidth: 560 });
    const g = s('g', {}, g0);
    // the decoder knows the entries made so far, before it decodes the current code
    COLS[1].knows = '1–2';
    steps(viz('dec-steps'), ['All', 'Code 1', 'Code 2', 'Code 3', 'Code 5'], k => {
      g.textContent = '';
      ROWS.forEach(([lab, , y]) => tx(g, 0, y, lab, 't-fg t-bold'));
      s('line', { x1: 0, x2: 700, y1: 129, y2: 129, class: 's-line dash' }, g);
      COLS.forEach((c, i) => {
        if (k > 0 && i >= k) return;
        const cur = k > 0 && i === k - 1;
        ROWS.forEach(([, key, y]) => {
          let cls = 'f-surface', tc = 't-fg';
          if (key === 'sends') { cls = cur ? 'f-pri' : 'f-pri-soft'; tc = cur ? 't-on t-bold' : 't-pri t-bold'; }
          if ((key === 'eadd' || key === 'dadd') && /=/.test(c[key])) cls = 'f-ok-soft';
          if (c.exc && key === 'knows') { cls = 'f-bad-soft'; tc = 't-bad t-bold'; }
          if (c.exc && key === 'out') { cls = 'f-ter-soft'; tc = 't-ter t-bold'; }
          box(g, CX[i] - CWD / 2 + 3, y - 14, CWD - 6, 28, c[key], { cls, textCls: tc, rx: 4 });
        });
        if (cur) s('rect', { x: CX[i] - CWD / 2, y: 12, width: CWD, height: 234, rx: 6, class: 'f-none outline-pri' }, g);
      });
      if (k === 0 || k === 4) arrow(g, CX[2] + 52, 98, CX[3] - 54, 72, { cls: 'a-sec', width: 2 });
      role('dec-note').textContent = NOTES[k];
    });
  });

  // Cheat sheet
  fig('cheat', () => {
    const R = [
      ['Compression ratio', 'B₀ / B₁ (before / after), want ≫ 1'],
      ['Lossless vs lossy', 'exact copy back vs close approximation; quantization is the main loss'],
      ['Self-information', 'log₂(1/pᵢ) bits; HELLO: L 1.32, H E O 2.32'],
      ['Entropy', 'η = Σ pᵢ log₂(1/pᵢ) bits/symbol; HELLO 1.922'],
      ['Maximum entropy', 'N equally likely: log₂ N (256 → 8, 8 → 3)'],
      ['Two values 1/3, 2/3', 'η = 0.918 (slide 0.92)'],
      ['Fixed-length code', '⌈log₂ n⌉ bits per symbol (5 symbols → 3)'],
      ['Run-length coding', 'count then symbol; 22 → 10 symbols, ratio 2.2'],
      ['Shannon-Fano', 'top-down: sort, split into equal counts; HELLO 10 bits'],
      ['Huffman', 'bottom-up: merge the two smallest; A15 B7 C6 D6 E5 → 87 bits'],
      ['Average length, efficiency', 'l̄ = Σ pᵢlᵢ, η / l̄; slide 26: 2.63, 0.9792'],
      ['Huffman bound', 'η ≤ l̄ < η + 1'],
      ['Extended Huffman', 'η ≤ l̄ < η + 1/k, nᵏ symbols'],
      ['Adaptive Huffman', 'sibling property; swap farthest node with count N with the node going to N + 1'],
      ['LZW encode', 's + c known → s = s + c, else output code(s), add s + c, s = c'],
      ['LZW Example 7.2', '1 2 4 5 2 3 4 6 1, ratio 14/9 = 1.56'],
      ['LZW decode', 'add s + entry[0]; unknown code → entry = s + s[0]'],
      ['LZW code size', 'l from l₀ to l_max, 2^l₀ entries at start; then flush or LRU'],
      ['DPCM', 'e = f − f̂, ẽ = Q[e], f̃ = f̂ + ẽ; predict from f̃'],
      ['Modulation', 'AM height, FM frequency, PM phase of the carrier'],
    ];
    table(viz('cheat'), [{ text: 'Fact or formula', cls: 'l' }, { text: 'Value or example', cls: 'l' }], R.map(([a, b]) => [{ text: a, cls: 'l' }, { text: b, cls: 'l' }]));
  });
});
