QV.register('topic10', function (q) {
  const { s, svg, grid, steps, slider, axes, table } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  // each figure is isolated so one failure leaves the rest of the article drawn
  const fig = (name, fn) => { try { fn(); } catch (e) { QV.fail('topic10 ' + name, e); } };
  const tx = (g, x, y, text, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls || null }, g, text);
  const parse = rows => rows.map(r => r.split('').map(Number));
  const at = (I, r, c) => (r >= 0 && r < I.length && c >= 0 && c < I[0].length ? I[r][c] : 0);
  const dil = (I, se) => I.map((row, r) => row.map((_, c) => (se.some(([dr, dc]) => at(I, r - dr, c - dc)) ? 1 : 0)));
  const ero = (I, se) => I.map((row, r) => row.map((_, c) => (se.every(([dr, dc]) => at(I, r + dr, c + dc)) ? 1 : 0)));
  const count = I => I.flat().reduce((a, b) => a + b, 0);
  const idx = n => Array.from({ length: n }, (_, i) => String(i));
  const SQ = [-1, 0, 1].flatMap(dr => [-1, 0, 1].map(dc => [dr, dc]));
  const CROSS = [[-1, 0], [0, -1], [0, 0], [0, 1], [1, 0]];
  const ROW3 = [[0, -1], [0, 0], [0, 1]];
  const ring = (g, x, y, w, h, cls) => {
    s('rect', { x, y, width: w, height: h, class: 'f-none sep', style: 'stroke-width: 6' }, g);
    s('rect', { x, y, width: w, height: h, class: 'f-none ' + cls, style: 'stroke-width: 3' }, g);
  };
  const setCls = (rect, cls) => rect.setAttribute('class', cls + ' sep');

  // Figure 1: fit and hit on the slide-6 image
  fig('fit', () => {
    const I = parse([
      '000000000000', '000110000000', '001111100000', '011111110000', '011111110000',
      '001111110000', '001111111000', '001111111110', '000001111110', '000000000000',
    ]);
    const WIN = { A: [5, 2], B: [1, 2], C: [1, 8] };
    const LAB = { A: [8, 3], B: [0, 3], C: [0, 9] };
    const SES = [['s₁', '3 × 3 square', SQ], ['s₂', 'cross', CROSS]];
    const CS = 22, X0 = 34, Y0 = 44;
    const g0 = svg(viz('fit'), 640, 290, { label: 'The slide 6 image with windows A, B and C, and a zoom of the chosen window under s1 or s2', minWidth: 540 });
    grid(g0, { x: X0, y: Y0, data: I, cell: CS, fill: v => (v ? 'f-pri' : 'f-seg'), text: false, rowLabels: idx(10), colLabels: idx(12) });
    const g = s('g', {}, g0);
    const combos = [];
    ['A', 'B', 'C'].forEach(w => SES.forEach(se => combos.push([w, se])));
    steps(viz('fit-steps'), combos.map(([w, se]) => `${w} · ${se[0]} ${se[1]}`), k => {
      g.textContent = '';
      const [w, [sn, sname, se]] = combos[k];
      Object.keys(WIN).forEach(key => {
        const [r0, c0] = WIN[key];
        if (key === w) ring(g, X0 + c0 * CS, Y0 + r0 * CS, 3 * CS, 3 * CS, 'outline-sec');
        else s('rect', { x: X0 + c0 * CS, y: Y0 + r0 * CS, width: 3 * CS, height: 3 * CS, class: 'f-none s-fg dash' }, g);
        tx(g, X0 + (LAB[key][1] + 0.5) * CS, Y0 + (LAB[key][0] + 0.5) * CS, key, (key === w ? 't-sec' : 't-fg') + ' t-bold', 'middle');
      });
      const [r0, c0] = WIN[w];
      const ZX = 350, ZY = 60, ZC = 40;
      tx(g, ZX, 36, `window ${w} under ${sn}`, 't-fg t-bold');
      let ones = 0, on = 0;
      for (let dr = 0; dr < 3; dr++) for (let dc = 0; dc < 3; dc++) {
        const v = I[r0 + dr][c0 + dc];
        const used = se.some(([a, b]) => a === dr - 1 && b === dc - 1);
        if (used) { ones++; if (v) on++; }
        const x = ZX + dc * ZC, y = ZY + dr * ZC;
        s('rect', { x, y, width: ZC, height: ZC, class: (v ? 'f-pri' : 'f-seg') + ' sep', style: used ? null : 'opacity: 0.3' }, g);
        tx(g, x + ZC / 2, y + ZC / 2, String(v), v ? 't-on t-bold' : 't-fg', 'middle');
        if (used && !v) s('rect', { x: x + 3, y: y + 3, width: ZC - 6, height: ZC - 6, class: 's-bad' }, g);
      }
      tx(g, ZX, ZY + 3 * ZC + 18, 'faded: 0 in ' + sn + ', ignored', 't-sm');
      const fit = on === ones, hit = on > 0;
      const TX = 492;
      tx(g, TX, 72, `1s in ${sn}: ${ones}`, 't-fg');
      tx(g, TX, 94, `on a 1 of the image: ${on}`, 't-fg');
      tx(g, TX, 126, 'fit: ' + (fit ? 'yes' : 'no'), (fit ? 't-ok' : 't-bad') + ' t-bold t-lg');
      tx(g, TX, 150, 'hit: ' + (hit ? 'yes' : 'no'), (hit ? 't-ok' : 't-bad') + ' t-bold t-lg');
      let note = `Window ${w}, ${sn} (${sname}): ${on} of its ${ones} ones land on a 1. `;
      if (fit) note += 'All of them, so it fits, and a fit is also a hit.';
      else if (hit) note += `At least one does, so it hits. The red outline marks a 1 of ${sn} over a 0, so it does not fit.`;
      else note += 'None does, so it neither fits nor hits.';
      if (w === 'B' && sn === 's₂') note += ' The only 0 of the window is a corner, which the cross ignores.';
      role('fit-note').textContent = note;
    }, 2);
  });

  // Figure 2: slide B over A, dilation = hit, erosion = fit
  fig('slide', () => {
    const A = parse([
      '000000000000', '000000000000', '001111000000', '001111100010',
      '001111000000', '001111011100', '000000000000', '000000000000',
    ]);
    const R = 8, C = 12, CS = 24;
    const SES = [['3 × 3 square', SQ], ['cross', CROSS], ['1 × 3 row', ROW3]];
    const g0 = svg(viz('slide'), 720, 510, { label: 'Image A with B placed at z, a zoom of the window, and the complete dilation and erosion of A', minWidth: 560 });
    const GA = [40, 48], GD = [40, 300], GE = [400, 300];
    const fill = v => (v ? 'f-pri' : 'f-seg');
    grid(g0, { x: GA[0], y: GA[1], data: A, cell: CS, fill, text: false, rowLabels: idx(R), colLabels: idx(C), title: 'A' });
    const gD = grid(g0, { x: GD[0], y: GD[1], data: A, cell: CS, fill, text: false, rowLabels: idx(R), colLabels: idx(C), title: 'A ⊕ B' });
    const gE = grid(g0, { x: GE[0], y: GE[1], data: A, cell: CS, fill, text: false, rowLabels: idx(R), colLabels: idx(C), title: 'A ⊖ B' });
    const tD = s('text', { x: GD[0] + 60, y: GD[1] - 22, class: 't-sm' }, g0);
    const tE = s('text', { x: GE[0] + 60, y: GE[1] - 22, class: 't-sm' }, g0);
    const g = s('g', {}, g0);
    let se = 0, z = 41;
    function draw() {
      g.textContent = '';
      const [name, B] = SES[se];
      const D = dil(A, B), E = ero(A, B);
      D.forEach((row, r) => row.forEach((v, c) => {
        setCls(gD.rects[r][c], v ? (A[r][c] ? 'f-pri' : 'f-ok') : 'f-seg');
        setCls(gE.rects[r][c], E[r][c] ? 'f-pri' : (A[r][c] ? 'f-bad' : 'f-seg'));
      }));
      tD.textContent = `${count(D)} ones (A has ${count(A)})`;
      tE.textContent = `${count(E)} ones`;
      const r = Math.floor(z / C), c = z % C;
      B.forEach(([dr, dc]) => {
        const rr = r + dr, cc = c + dc;
        if (rr >= 0 && rr < R && cc >= 0 && cc < C) ring(g, GA[0] + cc * CS, GA[1] + rr * CS, CS, CS, 'outline-sec');
      });
      [GD, GE].forEach(o => ring(g, o[0] + c * CS, o[1] + r * CS, CS, CS, 'outline-sec'));
      const ZX = 400, ZY = 60, ZC = 36;
      tx(g, ZX, 36, `B at z = (${r},${c})`, 't-fg t-bold');
      let on = 0;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const v = at(A, r + dr, c + dc), used = B.some(([a, b]) => a === dr && b === dc);
        const inside = r + dr >= 0 && r + dr < R && c + dc >= 0 && c + dc < C;
        if (used && v) on++;
        const x = ZX + (dc + 1) * ZC, y = ZY + (dr + 1) * ZC;
        s('rect', { x, y, width: ZC, height: ZC, class: (v ? 'f-pri' : 'f-seg') + ' sep', style: used ? null : 'opacity: 0.3' }, g);
        tx(g, x + ZC / 2, y + ZC / 2, inside ? String(v) : 'out', (v ? 't-on t-bold' : 't-fg') + (inside ? '' : ' t-sm'), 'middle');
        if (used && !v) s('rect', { x: x + 3, y: y + 3, width: ZC - 6, height: ZC - 6, class: 's-bad' }, g);
      }
      const hit = on > 0, fit = on === B.length;
      const TX = 530;
      tx(g, TX, 72, `1s of B: ${B.length}`, 't-fg');
      tx(g, TX, 92, `on a 1 of A: ${on}`, 't-fg');
      tx(g, TX, 124, hit ? 'hit → A ⊕ B = 1' : 'no hit → A ⊕ B = 0', (hit ? 't-ok' : 't-muted') + ' t-bold');
      tx(g, TX, 146, fit ? 'fit → A ⊖ B = 1' : 'no fit → A ⊖ B = 0', (fit ? 't-ok' : 't-muted') + ' t-bold');
      tx(g, ZX, ZY + 3 * ZC + 18, `B = ${name}; faded cells are not in B`, 't-sm');
      let note = `z = (${r},${c}), B = ${name}: ${on} of the ${B.length} pixels of B lie on a 1 of A. `;
      note += hit ? 'B hits, so the dilation writes 1' : 'B misses A, so the dilation writes 0';
      note += fit ? ' and B fits, so the erosion writes 1.' : (hit ? ', but a 1 of B lies on a 0 (red outline), so the erosion writes 0.' : ' and the erosion writes 0.');
      note += ` Totals: A ⊕ B has ${count(D)} ones, A ⊖ B has ${count(E)}.`;
      role('slide-note').textContent = note;
    }
    steps(viz('slide-steps'), SES.map(x => x[0]), k => { se = k; draw(); });
    slider(viz('slide-z'), { label: 'z', min: 0, max: R * C - 1, step: 1, value: z, fmt: v => `(${Math.floor(v / C)},${v % C})` }, v => { z = v; draw(); });
  });

  // Figure 3: Fig 9.7, squares eroded and restored by a k x k square
  fig('squares', () => {
    const SIDES = [1, 3, 5, 7, 9, 15], U = 7, BASE = 145;
    const XS = [];
    SIDES.reduce((x, sd) => { XS.push(x); return x + (sd + 5) * U; }, 24);
    const g0 = svg(viz('sq'), 680, 200, { label: 'Squares of side 1 to 15 eroded by a k by k square, then dilated back', minWidth: 540 });
    const g = s('g', {}, g0);
    slider(viz('sq-slider'), { label: 'k', min: 1, max: 15, step: 2, value: 13 }, k => {
      g.textContent = '';
      const live = [];
      SIDES.forEach((sd, i) => {
        const x = XS[i], y = BASE - sd * U, w = sd * U;
        if (sd >= k) {
          live.push(sd);
          s('rect', { x, y, width: w, height: w, class: 'f-pri' }, g);
          const cs = (sd - k + 1) * U, off = (w - cs) / 2;
          s('rect', { x: x + off, y: y + off, width: cs, height: cs, class: 'f-ter' }, g);
          tx(g, x + w / 2, BASE + 32, 'core ' + (sd - k + 1), 't-ter t-sm', 'middle');
        } else {
          s('rect', { x, y, width: w, height: w, class: 'f-seg s-muted dash' }, g);
          tx(g, x + w / 2, BASE + 32, 'gone', 't-sm', 'middle');
        }
        tx(g, x + w / 2, BASE + 16, String(sd), 't-fg', 'middle');
      });
      s('rect', { x: 540, y: BASE - k * U, width: k * U, height: k * U, class: 'f-none outline-sec' }, g);
      tx(g, 540, BASE - k * U - 12, `B: ${k} × ${k}`, 't-sec t-bold');
      tx(g, 540, BASE + 16, 'element', 't-sm');
      const dead = SIDES.filter(sd => sd < k);
      role('sq-note').textContent = `k = ${k}: ` + (dead.length ? `the squares of side ${dead.join(', ')} are smaller than B and vanish. ` : 'every square survives. ')
        + live.map(sd => `Side ${sd} erodes to ${sd - k + 1} × ${sd - k + 1}`).join(', ') + ', and dilation restores each to its full size.';
    });
  });

  // Figure 4: opening and closing with a digital disk of radius r
  fig('disk', () => {
    const R = 24, C = 46, CS = 11;
    const A = Array.from({ length: R }, () => Array(C).fill(0));
    const put = (r0, r1, c0, c1, v) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) A[r][c] = v; };
    [[4, 17, 4, 14, 1], [10, 11, 15, 19, 1], [5, 19, 20, 33, 1], [5, 10, 27, 28, 0], [10, 10, 24, 24, 0], [15, 16, 25, 26, 0],
      [13, 13, 34, 39, 1], [17, 19, 34, 36, 1], [5, 6, 38, 39, 1], [20, 20, 8, 8, 1]].forEach(a => put(...a));
    const disk = r => { const d = []; for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) if (a * a + b * b <= (r + 0.5) ** 2) d.push([a, b]); return d; };
    const g0 = svg(viz('disk'), 640, 300, { label: 'A binary shape opened or closed by a disk of radius r, with removed and added pixels coloured', minWidth: 560 });
    const title = s('text', { x: 12, y: 16, class: 't-fg t-bold' }, g0);
    const G = grid(g0, { x: 12, y: 28, data: A, cell: CS, fill: v => (v ? 'f-pri' : 'f-seg'), text: false });
    const side = s('g', {}, g0);
    const NOTES = [
      ['The 3 × 3 disk cannot fit in the isthmus, the 1-pixel protrusion or the specks, so they go. The 3-pixel stub stays.',
        'The 3-pixel stub goes too, the corners of the blobs are rounded, and the bites around the holes grow.',
        'The disk is 7 pixels wide. The left part of the right blob, between its edge, the gulf and the holes, is too narrow for it and vanishes. Too large an element destroys the object.'],
      ['Both holes, the 2-pixel gulf and the 2-pixel gap above the bottom speck are filled. Nothing is removed: A ⊆ A • B.',
        'The disk also fills the inner corners where the isthmus and the stubs meet the blobs.',
        'The 5-pixel gap between the two blobs is fused into one region, and both specks join a blob. Too large an element merges separate objects.'],
    ];
    let op = 0, rad = 2;
    function draw() {
      const B = disk(rad);
      const Rz = op === 0 ? dil(ero(A, B), B) : ero(dil(A, B), B);
      let diff = 0;
      Rz.forEach((row, r) => row.forEach((v, c) => {
        const a = A[r][c];
        if (v !== a) diff++;
        setCls(G.rects[r][c], v ? (a ? 'f-pri' : 'f-ok') : (a ? 'f-bad' : 'f-seg'));
      }));
      title.textContent = op === 0 ? 'A ∘ B = (A ⊖ B) ⊕ B' : 'A • B = (A ⊕ B) ⊖ B';
      side.textContent = '';
      tx(side, 540, 40, 'B = disk', 't-fg t-bold');
      const n = 2 * rad + 1;
      for (let a = -rad; a <= rad; a++) for (let b = -rad; b <= rad; b++) {
        const inB = B.some(([p, q]) => p === a && q === b);
        s('rect', { x: 540 + (b + rad) * CS, y: 56 + (a + rad) * CS, width: CS, height: CS, class: (inB ? 'f-sec' : 'f-seg') + ' sep' }, side);
      }
      tx(side, 540, 56 + n * CS + 16, `r = ${rad}, ${B.length} pixels`, 't-sm');
      role('disk-note').textContent = (op === 0
        ? `Opening, r = ${rad}: ${count(Rz)} of the ${count(A)} pixels of A stay, ${diff} are removed. `
        : `Closing, r = ${rad}: ${count(Rz)} pixels, ${diff} added to the ${count(A)} of A. `) + NOTES[op][rad - 1];
    }
    steps(viz('disk-steps'), ['Opening A ∘ B', 'Closing A • B'], k => { op = k; if (G) draw(); });
    slider(viz('disk-slider'), { label: 'disk radius r', min: 1, max: 3, step: 1, value: 2 }, v => { rad = v; draw(); });
  });

  // Figure 5: hit-or-miss with a 1 x 3 bar and its 3 x 5 window
  fig('hmt', () => {
    const A = parse([
      '00000000000000', '01110000111000', '00000000111000', '00000000000000', '01111100000000',
      '00000000000000', '00000001110110', '00000000000110', '00000000000000',
    ]);
    const R = A.length, C = A[0].length, CS = 22;
    const X = [[0, -1], [0, 0], [0, 1]];
    const WX = [-1, 0, 1].flatMap(a => [-2, -1, 0, 1, 2].map(b => [a, b])).filter(([a, b]) => !(a === 0 && Math.abs(b) <= 1));
    // outside the image counts as background, so it belongs to the complement
    const bg = (r, c) => !at(A, r, c);
    const E1 = A.map((row, r) => row.map((_, c) => (X.every(([a, b]) => at(A, r + a, c + b)) ? 1 : 0)));
    const E2 = A.map((row, r) => row.map((_, c) => (WX.every(([a, b]) => bg(r + a, c + b)) ? 1 : 0)));
    const H = E1.map((row, r) => row.map((v, c) => v & E2[r][c]));
    const g0 = svg(viz('hmt'), 720, 380, { label: 'Hit-or-miss template, image A, and the two erosions and their intersection', minWidth: 560 });
    grid(g0, { x: 40, y: 40, data: [[0, 0, 0, 0, 0], [0, 1, 1, 1, 0], [0, 0, 0, 0, 0]], cell: CS, fill: v => (v ? { cls: 'f-pri', text: 't-on' } : { cls: 'f-seg', text: 't-fg' }), title: 'B = (X, W − X)' });
    ring(g0, 40 + 2 * CS, 40 + CS, CS, CS, 'outline-sec');
    tx(g0, 170, 52, 'X = 1 × 3 bar (the 1s), origin = centre', 't-fg');
    tx(g0, 170, 72, 'W = 3 × 5 window, W − X = 12 ring pixels (the 0s)', 't-fg');
    tx(g0, 170, 92, 'outside the image counts as background', 't-sm');
    const opts = { cell: CS, text: false, rowLabels: idx(R), colLabels: idx(C) };
    const gA = s('g', {}, g0);
    grid(gA, Object.assign({ x: 40, y: 160, data: A, fill: v => (v ? 'f-pri' : 'f-seg'), title: 'A' }, opts));
    const marks = s('g', {}, g0);
    const right = s('g', {}, g0);
    const ST = [
      ['A ⊖ X', E1, 'f-ter', 'A ⊖ X marks every centre where the bar fits in A: once in each 1 × 3 bar, three times in the 1 × 5 bar and twice in the 2 × 3 block. 7 points, too many.'],
      ['Aᶜ ⊖ (W − X)', E2, 'f-sec', 'Aᶜ ⊖ (W − X) marks every centre where the 12-pixel ring lies wholly in the background. Large empty areas qualify too: 31 points.'],
      ['A ⊛ B', H, 'f-ok', 'The intersection keeps only (1,2) and (6,8), the centres of the two exact 1 × 3 bars. The long bar fails the ring test and the 2 × 2 block fails the bar test.'],
    ];
    steps(viz('hmt-steps'), ST.map(x => x[0]), k => {
      const [name, M, cls, note] = ST[k];
      right.textContent = '';
      marks.textContent = '';
      grid(right, Object.assign({ x: 390, y: 160, data: M, fill: (v, r, c) => (v ? cls : (A[r][c] ? 'f-pri-soft' : 'f-seg')), title: `${name}: ${count(M)} points` }, opts));
      if (k === 2) H.forEach((row, r) => row.forEach((v, c) => { if (v) ring(marks, 40 + (c - 2) * CS, 160 + (r - 1) * CS, 5 * CS, 3 * CS, 'outline-sec'); }));
      role('hmt-note').textContent = note;
    }, 2);
  });

  // Figure 6: gray-scale morphology on one row, window 3, border replicated
  fig('gray', () => {
    const f = [10, 50, 20, 80, 30, 30, 90, 40];
    const w = (a, i) => [i - 1, i, i + 1].map(j => a[Math.max(0, Math.min(a.length - 1, j))]);
    const gd = a => a.map((_, i) => Math.max(...w(a, i)));
    const ge = a => a.map((_, i) => Math.min(...w(a, i)));
    const D = gd(f), E = ge(f), O = gd(ge(f)), CL = ge(gd(f));
    const sub = (a, b) => a.map((v, i) => v - b[i]);
    const ST = [
      ['f', null, null, null, 'The input row. Bright peaks at positions 1, 3 and 6.'],
      ['dilation', D, null, null, 'Each pixel takes the maximum of its window of 3. The bright peaks spread to their neighbours and the dark dips at 2 and 4 disappear.'],
      ['erosion', E, null, null, 'Each pixel takes the minimum of its window. The peaks at 1 and 3 are gone and the dark values spread.'],
      ['gradient', null, E, D, 'Gradient = dilation − erosion, the height of the band between the two. It is large wherever the gray level changes inside the window, so it marks edges.'],
      ['opening', O, null, null, 'Erosion, then dilation. Peaks narrower than the window are cut down. The image never gets brighter than f.'],
      ['white top hat', null, O, f, 'White top hat = f − opening. Only the narrow bright peaks remain: 30, 50 and 50 at positions 1, 3 and 6.'],
      ['closing', CL, null, null, 'Dilation, then erosion. Dips narrower than the window are filled. The image never gets darker than f.'],
      ['black top hat', null, f, CL, 'Black top hat = closing − f. Only the narrow dark dips remain.'],
    ];
    const g0 = svg(viz('gray'), 640, 260, { label: 'A row of eight gray values as bars, with the chosen morphological result', minWidth: 520 });
    const ax = axes(g0, { x: 64, y: 24, w: 552, h: 180, xd: [-0.5, 7.5], yd: [0, 100], xt: [0, 1, 2, 3, 4, 5, 6, 7], yt: [0, 20, 40, 60, 80, 100], xl: 'position', yl: 'gray level' });
    f.forEach((v, i) => s('rect', { x: ax.x(i) - 22, y: ax.y(v), width: 44, height: ax.y(0) - ax.y(v), class: 'f-pri-soft' }, g0));
    const g = s('g', {}, g0);
    const row = a => a.map(v => String(v).padStart(4)).join('');
    steps(viz('gray-steps'), ST.map(x => x[0]), k => {
      g.textContent = '';
      const [name, res, lo, hi, note] = ST[k];
      const lines = ['f'.padEnd(15) + row(f)];
      if (!res && !lo) f.forEach((v, i) => tx(g, ax.x(i), ax.y(v) - 9, String(v), 't-fg t-sm', 'middle'));
      if (res) {
        res.forEach((v, i) => {
          s('rect', { x: ax.x(i) - 9, y: ax.y(v), width: 18, height: ax.y(0) - ax.y(v), class: 'f-pri' }, g);
          tx(g, ax.x(i), ax.y(v) - 9, String(v), 't-pri t-bold t-sm', 'middle');
        });
        lines.push(name.padEnd(15) + row(res));
      }
      if (lo) {
        const d = sub(hi, lo);
        d.forEach((v, i) => {
          if (v > 0) s('rect', { x: ax.x(i) - 22, y: ax.y(hi[i]), width: 44, height: ax.y(lo[i]) - ax.y(hi[i]), class: 'f-ok', style: 'opacity: 0.75' }, g);
          tx(g, ax.x(i), ax.y(hi[i]) - 9, String(v), 't-ok t-bold t-sm', 'middle');
        });
        const loName = lo === E ? 'erosion' : lo === O ? 'opening' : 'f';
        const hiName = hi === D ? 'dilation' : hi === CL ? 'closing' : 'f';
        lines.push(hiName.padEnd(15) + row(hi), loName.padEnd(15) + row(lo), (name + ' = ' + hiName + ' − ' + loName).padEnd(15));
        lines.push(''.padEnd(15) + row(d));
      }
      role('gray-calc').textContent = lines.join('\n');
      role('gray-note').textContent = note;
    }, 3);
  });

  fig('cheat', () => {
    const L = t => ({ text: t, cls: 'l' });
    table(viz('cheat'), [L('Fact or formula'), L('Value or example')], [
      ['Morphology', '"a collection of non-linear operations related to the shape or morphology of features in an image"'],
      ['Structuring element', 'small binary matrix; size, shape, origin (usually the centre, odd dimensions)'],
      ['Fit / hit', 'every 1 of B on a 1 / at least one 1 of B on a 1; 0s of B ignored'],
      ['Dilation A ⊕ B', '{ z | (B̂)z ∩ A ≠ ∅ }; local max; hit; bright regions grow, gaps join'],
      ['Erosion A ⊖ B', '{ z | (B)z ⊆ A }; local min; fit; foreground shrinks, holes grow'],
      ['Duality', '(A ⊖ B)ᶜ = Aᶜ ⊕ B̂'],
      ['Opening A ∘ B', '(A ⊖ B) ⊕ B; removes small bright spots, thin protrusions, isthmuses; A ∘ B ⊆ A'],
      ['Closing A • B', '(A ⊕ B) ⊖ B; removes small dark spots, fills holes and narrow breaks; A ⊆ A • B'],
      ['Sizes, side d, d/4 square', 'dilation 5d/4, erosion 3d/4'],
      ['Fig 9.7, 13 × 13 erosion', 'only side 15 survives, as 3 × 3; dilation restores 15 × 15'],
      ['Hit-or-miss', '(A ⊖ X) ∩ [Aᶜ ⊖ (W − X)]: X in A and its ring W − X in Aᶜ'],
      ['Boundary', 'β(A) = A − (A ⊖ B), B = 3 × 3 square'],
      ['Region filling', 'Xk = (Xk−1 ⊕ B) ∩ Aᶜ, cross, X0 = p; answer Xk ∪ A'],
      ['Connected components', 'Xk = (Xk−1 ⊕ B) ∩ A, 3 × 3 square; stop when Xk = Xk−1'],
      ['Thinning / thickening', 'A ⊗ B = A − (A ⊛ B); A ⊙ B = A ∪ (A ⊛ B)'],
      ['Gradient', '(f ⊕ b) − (f ⊖ b), highlights edges'],
      ['Top hat', 'white = f − (f ∘ b); black = (f • b) − f'],
    ].map(r => r.map(L)));
  });
});
