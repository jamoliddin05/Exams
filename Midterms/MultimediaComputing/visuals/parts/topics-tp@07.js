QV.register('topic7', function (q) {
  const { s, svg, steps, slider, axes, line, table } = QV;
  const viz = n => q.querySelector(`[data-viz="${n}"]`);
  const role = n => q.querySelector(`[data-role="${n}"]`);
  const tx = (g, x, y, text, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls || null }, g, text);
  // each figure is isolated so one failure leaves the rest of the article drawn
  const fig = (name, fn) => { try { fn(); } catch (e) { QV.fail('topic7 ' + name, e); } };
  const M = '−';
  const link = (g, a, b, cls, dash) => {
    s('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: 'sep', style: 'stroke-width: 8' }, g);
    s('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: cls + (dash ? ' dash' : ''), style: 'stroke-width: 3' }, g);
  };

  // Figure 1: N4, ND, N8 around p (slide 21)
  fig('nb', () => {
    const C = 60, X0 = 96, Y0 = 92;
    const g0 = svg(viz('nb'), 420, 422, { label: 'A 5 by 5 pixel grid with the neighbours of p lit', minWidth: 340, maxWidth: 520 });
    const g = s('g', {}, g0);
    const N4 = [[1, 0, 'x+1, y'], [-1, 0, 'x' + M + '1, y'], [0, 1, 'x, y+1'], [0, -1, 'x, y' + M + '1']];
    const ND = [[1, 1, 'x+1, y+1'], [1, -1, 'x+1, y' + M + '1'], [-1, 1, 'x' + M + '1, y+1'], [-1, -1, 'x' + M + '1, y' + M + '1']];
    const crd = (r, c) => `(${String(r).replace('-', M)},${String(c).replace('-', M)})`;
    const NOTES = [
      'N₄(p) for p = (2, 2): (3, 2), (1, 2), (2, 3), (2, 1). Each shares an edge with p: one step down, up, right or left.',
      'ND(p): (3, 3), (3, 1), (1, 3), (1, 1). Each touches p only at a corner, so both coordinates change by 1.',
      'N₈(p) = N₄(p) ∪ ND(p), all 8 pixels around p. These are exactly the pixels at chessboard distance D₈ = 1.',
      'p = (0, 0) sits in the corner. Five of its 8 neighbour positions fall outside the image, so only (1, 0), (0, 1) and (1, 1) exist (textbook context).',
    ];
    steps(viz('nb-steps'), ['N₄(p)', 'ND(p)', 'N₈(p)', 'p at the corner'], k => {
      g.textContent = '';
      const p = k === 3 ? [0, 0] : [2, 2];
      const lit = new Map();
      if (k !== 1) N4.forEach(([dr, dc, f]) => lit.set((p[0] + dr) + ',' + (p[1] + dc), ['f-pri', f]));
      if (k >= 1) ND.forEach(([dr, dc, f]) => lit.set((p[0] + dr) + ',' + (p[1] + dc), ['f-sec', f]));
      for (let i = 0; i < 5; i++) {
        tx(g, X0 + i * C + C / 2, 22, String(i), 't-sm', 'middle');
        tx(g, 18, Y0 + i * C + C / 2, String(i), 't-sm', 'middle');
      }
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const x = X0 + c * C, y = Y0 + r * C, L = lit.get(r + ',' + c), isP = r === p[0] && c === p[1];
          s('rect', { x, y, width: C, height: C, class: (isP ? 'f-ter' : L ? L[0] : 'f-seg') + ' sep' }, g);
          if (isP) {
            tx(g, x + C / 2, y + C / 2 - 8, 'p', 't-on t-bold t-lg', 'middle');
            tx(g, x + C / 2, y + C / 2 + 10, crd(r, c), 't-on t-sm', 'middle');
          } else if (L) {
            tx(g, x + C / 2, y + C / 2 - 8, crd(r, c), 't-on t-sm', 'middle');
            tx(g, x + C / 2, y + C / 2 + 9, L[1], 't-on t-sm', 'middle');
          } else tx(g, x + C / 2, y + C / 2, crd(r, c), 't-muted t-sm', 'middle');
        }
      }
      lit.forEach((v, key) => {
        const [r, c] = key.split(',').map(Number);
        if (r >= 0 && c >= 0) return;
        const x = X0 + c * C, y = Y0 + r * C;
        s('rect', { x: x + 2, y: y + 2, width: C - 4, height: C - 4, class: 'f-none s-muted dash', style: 'stroke-width: 1' }, g);
        tx(g, x + C / 2, y + C / 2 - 8, crd(r, c), 't-muted t-sm', 'middle');
        tx(g, x + C / 2, y + C / 2 + 9, 'outside', 't-muted t-sm', 'middle');
      });
      tx(g, X0, Y0 + 5 * C + 18, 'x = row (down) · y = column (right)', 't-sm');
      role('nb-note').textContent = NOTES[k];
    });
  });

  // Figure 2: 4-, 8- and m-links on one binary image (slides 22-24)
  fig('adj', () => {
    const IMG = [[0, 1, 1, 0, 0], [0, 1, 0, 0, 1], [1, 0, 0, 1, 0], [0, 0, 0, 1, 0]];
    const R = 4, Cn = 5, C = 64, X0 = 50, Y0 = 44;
    const inV = (r, c) => r >= 0 && r < R && c >= 0 && c < Cn && IMG[r][c] === 1;
    const n4 = ([r, c]) => [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]];
    const ones = [];
    for (let r = 0; r < R; r++) for (let c = 0; c < Cn; c++) if (inV(r, c)) ones.push([r, c]);
    const kindOf = (p, t) => {
      const dr = Math.abs(p[0] - t[0]), dc = Math.abs(p[1] - t[1]);
      if (dr + dc === 1) return '4';
      if (dr === 1 && dc === 1) {
        const common = n4(p).filter(a => n4(t).some(b => b[0] === a[0] && b[1] === a[1]));
        return common.some(([r, c]) => inV(r, c)) ? 'd-drop' : 'd-keep';
      }
      return null;
    };
    const pairs = [];
    ones.forEach((p, i) => ones.slice(i + 1).forEach(t => { const k = kindOf(p, t); if (k) pairs.push([p, t, k]); }));
    const g0 = svg(viz('adj'), 400, 316, { label: 'A 4 by 5 binary image with the links between adjacent 1-pixels', minWidth: 340, maxWidth: 520 });
    const g = s('g', {}, g0);
    const ctr = ([r, c]) => [X0 + c * C + C / 2, Y0 + r * C + C / 2];
    const NOTES = [
      '4-adjacency links only edge neighbours. Diagonal pairs stay apart, so the 1s fall into 4 pieces, and (2, 0) and (1, 4) are alone.',
      '8-adjacency adds every diagonal pair: 2 pieces. But (0, 2) now reaches (1, 1) in two ways, directly and through (0, 1). That is the multiple path connection.',
      'm-adjacency keeps the 4-links and tests each diagonal. (0, 2)–(1, 1) is dropped: their shared 4-neighbour (0, 1) is 1. (1, 1)–(2, 0) and (1, 4)–(2, 3) share only 0s, so they stay. Same 2 pieces as 8, one route.',
    ];
    steps(viz('adj-steps'), ['4-adjacency', '8-adjacency', 'm-adjacency'], k => {
      g.textContent = '';
      tx(g, X0, 14, 'V = {1}', 't-fg t-bold');
      for (let c = 0; c < Cn; c++) tx(g, X0 + c * C + C / 2, Y0 - 9, String(c), 't-sm', 'middle');
      for (let r = 0; r < R; r++) tx(g, X0 - 12, Y0 + r * C + C / 2, String(r), 't-sm', 'middle');
      for (let r = 0; r < R; r++) {
        for (let c = 0; c < Cn; c++) {
          const x = X0 + c * C, y = Y0 + r * C, one = IMG[r][c] === 1;
          s('rect', { x, y, width: C, height: C, class: (one ? 'f-pri' : 'f-seg') + ' sep' }, g);
          tx(g, x + 9, y + 11, String(IMG[r][c]), (one ? 't-on' : 't-muted') + ' t-sm', 'middle');
        }
      }
      const live = pairs.filter(([, , t]) => t === '4' || (k === 1 && t !== '4') || (k === 2 && t === 'd-keep'));
      pairs.forEach(([a, b, t]) => {
        if (live.indexOf(pairs.find(p => p[0] === a && p[1] === b)) >= 0) link(g, ctr(a), ctr(b), 's-ter');
        else if (k === 2 && t === 'd-drop') link(g, ctr(a), ctr(b), 's-bad', true);
      });
      ones.forEach(p => { const [x, y] = ctr(p); s('circle', { cx: x, cy: y, r: 6, class: 'f-ter sep' }, g); });
      const par = new Map(ones.map(p => [p.join(), p.join()]));
      const find = v => { while (par.get(v) !== v) v = par.get(v); return v; };
      live.forEach(([a, b]) => par.set(find(a.join()), find(b.join())));
      const pieces = new Set(ones.map(p => find(p.join()))).size;
      const adjList = new Map(ones.map(p => [p.join(), []]));
      live.forEach(([a, b]) => { adjList.get(a.join()).push(b.join()); adjList.get(b.join()).push(a.join()); });
      let routes = 0;
      const dfs = (u, seen) => { if (u === '1,1') { routes++; return; } adjList.get(u).forEach(v => { if (!seen.has(v)) dfs(v, new Set([...seen, v])); }); };
      dfs('0,2', new Set(['0,2']));
      role('adj-links').textContent = String(live.length);
      role('adj-pieces').textContent = String(pieces);
      role('adj-routes').textContent = String(routes);
      role('adj-note').textContent = NOTES[k];
    }, 2);
  });

  // Figure 3: the D4, D8 and Euclidean walks from p to q (slides 31-33)
  fig('dist', () => {
    const C = 26, RW = 6, CL = 7, PX = [30, 250, 470], Y0 = 40, P = [1, 1];
    const g0 = svg(viz('dist'), 680, 240, { label: 'Three 6 by 7 grids with the city-block walk, the chessboard walk and the straight line from p to q', minWidth: 560 });
    const g = s('g', {}, g0);
    let S = 5, T = 4;
    function draw() {
      g.textContent = '';
      const dx = Math.abs(S - P[0]), dy = Math.abs(T - P[1]), sx = Math.sign(S - P[0]), sy = Math.sign(T - P[1]);
      const d4 = dx + dy, d8 = Math.max(dx, dy), de = Math.hypot(dx, dy);
      const w4 = [], w8 = [];
      let r = P[0], c = P[1];
      for (let i = 0; i < dx; i++) { r += sx; w4.push([r, c]); }
      for (let i = 0; i < dy; i++) { c += sy; w4.push([r, c]); }
      r = P[0]; c = P[1];
      for (let i = 0; i < d8; i++) { if (r !== S) r += sx; if (c !== T) c += sy; w8.push([r, c]); }
      const panels = [
        ['D₄ city-block', w4, '|Δx| + |Δy|', `= ${dx} + ${dy} = ${d4}`],
        ['D₈ chessboard', w8, 'max(|Δx|, |Δy|)', `= max(${dx}, ${dy}) = ${d8}`],
        ['Dₑ Euclidean', null, '√(Δx² + Δy²)', `= √(${dx * dx} + ${dy * dy}) = ${de.toFixed(2)}`],
      ];
      panels.forEach(([title, walk, f1, f2], k) => {
        const X0 = PX[k];
        const cx = cc => X0 + cc * C + C / 2, cy = rr => Y0 + rr * C + C / 2;
        tx(g, X0, 14, title, 't-fg t-bold');
        for (let cc = 0; cc < CL; cc++) tx(g, cx(cc), Y0 - 7, String(cc), 't-sm', 'middle');
        for (let rr = 0; rr < RW; rr++) tx(g, X0 - 9, cy(rr), String(rr), 't-sm', 'middle');
        for (let rr = 0; rr < RW; rr++) {
          for (let cc = 0; cc < CL; cc++) {
            const isP = rr === P[0] && cc === P[1], isQ = rr === S && cc === T;
            const step = walk ? walk.findIndex(([a, b]) => a === rr && b === cc) : -1;
            const cls = isQ ? 'f-ok' : isP ? 'f-pri' : step >= 0 ? 'f-pri-soft' : 'f-seg';
            s('rect', { x: X0 + cc * C, y: Y0 + rr * C, width: C, height: C, class: cls + ' sep' }, g);
            const lab = isQ && walk ? String(walk.length) : isQ ? 'q' : isP ? 'p' : step >= 0 ? String(step + 1) : null;
            if (lab) tx(g, cx(cc), cy(rr), lab, (isP || isQ ? 't-on' : 't-fg') + ' t-bold', 'middle');
          }
        }
        if (!walk && (dx || dy)) {
          line(g, [[cx(P[1]), cy(P[0])], [cx(P[1]), cy(S)], [cx(T), cy(S)]], 's-muted dash').setAttribute('style', 'stroke-width: 1.5');
          line(g, [[cx(P[1]), cy(P[0])], [cx(T), cy(S)]], 's-ter');
        }
        tx(g, X0, Y0 + RW * C + 16, f1, 't-fg');
        tx(g, X0, Y0 + RW * C + 32, f2, 't-pri t-bold');
      });
      role('dist-note').textContent = `q = (${S}, ${T}): |Δx| = ${dx}, |Δy| = ${dy}. D₈ = ${d8} ≤ Dₑ = ${de.toFixed(2)} ≤ D₄ = ${d4}.`;
    }
    slider(viz('dist-s'), { label: 's, row of q', min: 0, max: 5, value: 5 }, v => { S = v; draw(); });
    slider(viz('dist-t'), { label: 't, column of q', min: 0, max: 6, value: 4 }, v => { T = v; draw(); });
  });

  // Figure 4: D <= r is a disk, a diamond, a square (slides 32-33)
  fig('ring', () => {
    const C = 20, N = 9, PX = [20, 260, 500], Y0 = 30;
    const g0 = svg(viz('ring'), 700, 246, { label: 'Three 9 by 9 grids shading the pixels within distance r for the Euclidean, city-block and chessboard metrics', minWidth: 560 });
    const g = s('g', {}, g0);
    const MET = [
      ['Dₑ ≤ r: a disk', (a, b) => Math.hypot(a, b), r => 'pixels inside'],
      ['D₄ ≤ r: a diamond', (a, b) => Math.abs(a) + Math.abs(b), r => `2r² + 2r + 1 = ${2 * r * r + 2 * r + 1}`],
      ['D₈ ≤ r: a square', (a, b) => Math.max(Math.abs(a), Math.abs(b)), r => `(2r + 1)² = ${(2 * r + 1) ** 2}`],
    ];
    slider(viz('ring-slider'), { label: 'r', min: 0, max: 4, value: 2 }, r => {
      g.textContent = '';
      MET.forEach(([title, D, f], k) => {
        const X0 = PX[k];
        let n = 0;
        tx(g, X0, 14, title, 't-fg t-bold');
        for (let i = 0; i < N; i++) {
          for (let j = 0; j < N; j++) {
            const d = D(i - 4, j - 4), inside = d <= r + 1e-9, edge = k > 0 && d === r;
            if (inside) n++;
            const cls = i === 4 && j === 4 ? 'f-pri' : edge ? 'f-pri' : inside ? 'f-pri-soft' : 'f-seg';
            s('rect', { x: X0 + j * C, y: Y0 + i * C, width: C, height: C, class: cls + ' sep' }, g);
            if (k > 0 && inside) tx(g, X0 + j * C + C / 2, Y0 + i * C + C / 2, String(d), (edge || d === 0 ? 't-on' : 't-fg') + ' t-sm', 'middle');
          }
        }
        if (k === 0 && r > 0) s('circle', { cx: X0 + 4.5 * C, cy: Y0 + 4.5 * C, r: r * C, class: 's-pri', style: 'stroke-width: 1.5' }, g);
        tx(g, X0, Y0 + N * C + 16, `${n} pixels`, 't-pri t-bold');
        tx(g, X0 + 72, Y0 + N * C + 16, k ? f(r) : 'centre inside the circle', 't-sm');
      });
    });
  });

  // Shared chromaticity helpers (CIE 1931 2° spectral locus)
  const LOCUS = [[380, 0.1741, 0.0050], [400, 0.1733, 0.0048], [420, 0.1714, 0.0051], [430, 0.1689, 0.0069], [440, 0.1644, 0.0109], [450, 0.1566, 0.0177], [460, 0.1440, 0.0297], [470, 0.1241, 0.0578], [475, 0.1096, 0.0868], [480, 0.0913, 0.1327], [485, 0.0687, 0.2007], [490, 0.0454, 0.2950], [495, 0.0235, 0.4127], [500, 0.0082, 0.5384], [505, 0.0039, 0.6548], [510, 0.0139, 0.7502], [515, 0.0389, 0.8120], [520, 0.0743, 0.8338], [525, 0.1142, 0.8262], [530, 0.1547, 0.8059], [535, 0.1929, 0.7816], [540, 0.2296, 0.7543], [545, 0.2658, 0.7243], [550, 0.3016, 0.6923], [555, 0.3373, 0.6589], [560, 0.3731, 0.6245], [565, 0.4087, 0.5896], [570, 0.4441, 0.5547], [575, 0.4788, 0.5202], [580, 0.5125, 0.4866], [585, 0.5448, 0.4544], [590, 0.5752, 0.4242], [595, 0.6029, 0.3965], [600, 0.6270, 0.3725], [610, 0.6658, 0.3340], [620, 0.6915, 0.3083], [630, 0.7079, 0.2920], [640, 0.7190, 0.2809], [650, 0.7260, 0.2740], [660, 0.7300, 0.2700], [680, 0.7334, 0.2666], [700, 0.7347, 0.2653]];
  const atNm = nm => {
    for (let i = 1; i < LOCUS.length; i++) {
      const [a, ax, ay] = LOCUS[i - 1], [b, bx, by] = LOCUS[i];
      if (nm <= b) { const t = (nm - a) / (b - a); return [ax + t * (bx - ax), ay + t * (by - ay)]; }
    }
    return LOCUS[LOCUS.length - 1].slice(1);
  };
  const insideLocus = (x, y) => {
    let c = false;
    for (let i = 0, j = LOCUS.length - 1; i < LOCUS.length; j = i++) {
      const [, xi, yi] = LOCUS[i], [, xj, yj] = LOCUS[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  const enc = v => Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055));
  const xyColor = (x, y) => {
    const X = x / y, Z = (1 - x - y) / y;
    let r = 3.2406 * X - 1.5372 - 0.4986 * Z, g = -0.9689 * X + 1.8758 + 0.0415 * Z, b = 0.0557 * X - 0.2040 + 1.0570 * Z;
    const lo = Math.min(r, g, b);
    if (lo < 0) { r -= lo; g -= lo; b -= lo; }
    const hi = Math.max(r, g, b);
    return `rgb(${enc(r / hi)}, ${enc(g / hi)}, ${enc(b / hi)})`; // data-color
  };
  const diagram = (g, ax, step, xmax, ymax, labels) => {
    for (let x = 0; x < xmax; x += step) {
      for (let y = 0; y < ymax; y += step) {
        if (!insideLocus(x + step / 2, y + step / 2)) continue;
        s('rect', { x: ax.x(x).toFixed(2), y: ax.y(y + step).toFixed(2), width: (ax.x(x + step) - ax.x(x) + 0.6).toFixed(2), height: (ax.y(y) - ax.y(y + step) + 0.6).toFixed(2), style: `fill: ${xyColor(x + step / 2, y + step / 2)}; opacity: 0.85` }, g); // data-color
      }
    }
    line(g, LOCUS.map(([, x, y]) => [ax.x(x), ax.y(y)]).concat([[ax.x(LOCUS[0][1]), ax.y(LOCUS[0][2])]]), 's-fg').setAttribute('style', 'stroke-width: 1');
    labels.forEach(nm => {
      const [x, y] = atNm(nm), dx = x - 0.33, dy = y - 0.33, d = Math.hypot(dx, dy);
      s('text', { x: ax.x(x) + 12 * dx / d, y: ax.y(y) - 12 * dy / d, dy: '0.35em', 'text-anchor': dx / d < -0.4 ? 'end' : dx / d > 0.4 ? 'start' : 'middle', class: 't-sm t-fg' }, g, nm);
    });
  };
  const dot = (g, x, y, cls, r) => s('circle', { cx: x, cy: y, r: r || 5, class: cls + ' sep' }, g);

  // Figure 5: X, Y, Z to (x, y), and gamut triangles (slides 54-59)
  fig('xyz', () => {
    const GAM = [
      { name: 'CIE-RGB', white: 'E', W: [1 / 3, 1 / 3], P: [[0.7347, 0.2653], [0.2738, 0.7174], [0.1666, 0.0089]] },
      { name: 'PAL', white: 'D65', W: [0.3127, 0.3290], P: [[0.64, 0.33], [0.29, 0.60], [0.15, 0.06]] },
      { name: 'NTSC', white: 'C', W: [0.3101, 0.3162], P: [[0.67, 0.33], [0.21, 0.71], [0.14, 0.08]] },
    ];
    const g0 = svg(viz('xyz'), 430, 400, { label: 'CIE xy chromaticity diagram with a gamut triangle, its white point and the point for the chosen X, Y, Z', minWidth: 400, maxWidth: 560 });
    const ax = axes(g0, { x: 50, y: 22, w: 330, h: 330, xd: [0, 1], yd: [0, 1], xt: [0, 0.2, 0.4, 0.6, 0.8, 1], yt: [0, 0.2, 0.4, 0.6, 0.8, 1], xf: v => v.toFixed(1), yf: v => v.toFixed(1), xl: 'x', yl: 'y' });
    diagram(g0, ax, 0.0125, 0.75, 0.85, [460, 480, 500, 520, 560, 600, 700]);
    line(g0, [[ax.x(0), ax.y(1)], [ax.x(1), ax.y(0)]], 's-muted dash').setAttribute('style', 'stroke-width: 1');
    tx(g0, ax.x(0.5), ax.y(0.62), 'x + y = 1 (z = 0)', 't-sm t-muted');
    const g = s('g', {}, g0);
    let gi = 0, X = 50, Y = 40, Z = 10;
    const inTri = ([x, y], [[x1, y1], [x2, y2], [x3, y3]]) => {
      const d1 = (x - x2) * (y1 - y2) - (x1 - x2) * (y - y2), d2 = (x - x3) * (y2 - y3) - (x2 - x3) * (y - y3), d3 = (x - x1) * (y3 - y1) - (x3 - x1) * (y - y1);
      return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
    };
    function draw() {
      g.textContent = '';
      const G = GAM[gi], P = G.P.map(([x, y]) => [ax.x(x), ax.y(y)]);
      line(g, P.concat([P[0]]), 's-fg').setAttribute('style', 'stroke-width: 1.5');
      ['R', 'G', 'B'].forEach((n, i) => {
        const [x, y] = G.P[i], dx = x - G.W[0], dy = y - G.W[1], d = Math.hypot(dx, dy);
        tx(g, ax.x(x) + 12 * dx / d, ax.y(y) - 12 * dy / d, n, 't-fg t-bold halo', 'middle');
      });
      const Wp = [ax.x(G.W[0]), ax.y(G.W[1])];
      const sum = X + Y + Z, calc = role('xyz-calc'), stIn = role('xyz-in');
      role('xyz-Y').textContent = String(Y);
      role('xyz-insub').textContent = G.name + ' triangle';
      if (!sum) {
        dot(g, Wp[0], Wp[1], 'f-surface', 4);
        tx(g, Wp[0] + 8, Wp[1] + 10, G.white, 't-fg t-bold halo');
        role('xyz-xy').textContent = 'none';
        stIn.textContent = '–';
        stIn.className = 'v';
        calc.textContent = 'X + Y + Z = 0: black has no chromaticity.';
        role('xyz-note').textContent = 'Move a slider above 0.';
        return;
      }
      const x = X / sum, y = Y / sum, z = Z / sum, d = Math.hypot(x - G.W[0], y - G.W[1]);
      const Sp = [ax.x(x), ax.y(y)];
      line(g, [Wp, Sp], 's-fg dash').setAttribute('style', 'stroke-width: 1.2');
      dot(g, Wp[0], Wp[1], 'f-surface', 4);
      tx(g, Wp[0] + 8, Wp[1] + 10, G.white, 't-fg t-bold halo');
      dot(g, Sp[0], Sp[1], 'f-fg', 6);
      tx(g, Sp[0] + (x > 0.6 ? -10 : 10), Sp[1] - 12, `(${x.toFixed(3)}, ${y.toFixed(3)})`, 't-fg t-bold halo', x > 0.6 ? 'end' : 'start');
      const inG = inTri([x, y], G.P), inL = insideLocus(x, y);
      role('xyz-xy').textContent = `(${x.toFixed(3)}, ${y.toFixed(3)})`;
      stIn.textContent = inG ? 'yes' : 'no';
      stIn.className = 'v ' + (inG ? 'ok' : 'sec');
      calc.textContent = [
        `S = X + Y + Z = ${X} + ${Y} + ${Z} = ${sum}`,
        `x = X / S = ${X} / ${sum} = ${x.toFixed(3)}`,
        `y = Y / S = ${Y} / ${sum} = ${y.toFixed(3)}`,
        `z = Z / S = ${Z} / ${sum} = ${z.toFixed(3)}      x + y + z = 1`,
        `distance to ${G.white} (${G.W[0].toFixed(4)}, ${G.W[1].toFixed(4)}) = ${d.toFixed(3)}`,
      ].join('\n');
      role('xyz-note').textContent = !inL
        ? 'Outside the horseshoe: no real light has these chromaticity coordinates.'
        : inG ? `Inside the horseshoe and inside the ${G.name} triangle, so a positive mix of its three primaries matches this color.`
          : `A real color, but outside the ${G.name} triangle: no positive mix of its primaries reaches it, so that system cannot show it.`;
    }
    steps(viz('xyz-steps'), ['CIE-RGB primaries', 'PAL (white D65)', 'NTSC (white C)'], k => { gi = k; draw(); });
    const host = viz('xyz-sliders');
    slider(host, { label: 'X', min: 0, max: 100, value: 50 }, v => { X = v; draw(); });
    slider(host, { label: 'Y', min: 0, max: 100, value: 40 }, v => { Y = v; draw(); });
    slider(host, { label: 'Z', min: 0, max: 100, value: 10 }, v => { Z = v; draw(); });
  });

  // Figure 6: dominant wavelength, complementary wavelength and purity (slides 61-65)
  fig('pur', () => {
    const W = [0.31, 0.32];
    const g0 = svg(viz('pur'), 430, 406, { label: 'CIE xy chromaticity diagram with white W, a ray at angle theta to the dominant wavelength point D and the opposite ray to the complementary point', minWidth: 400, maxWidth: 560 });
    const ax = axes(g0, { x: 50, y: 22, w: 300, h: 337.5, xd: [0, 0.8], yd: [0, 0.9], xt: [0, 0.2, 0.4, 0.6, 0.8], yt: [0, 0.2, 0.4, 0.6, 0.8], xf: v => v.toFixed(1), yf: v => v.toFixed(1), xl: 'x', yl: 'y' });
    diagram(g0, ax, 0.01, 0.75, 0.85, [460, 480, 500, 520, 560, 600, 700]);
    const g = s('g', {}, g0);
    const segs = LOCUS.slice(1).map((b, i) => [LOCUS[i], b]).concat([[LOCUS[LOCUS.length - 1], LOCUS[0]]]);
    const hit = ang => {
      const ux = Math.cos(ang * Math.PI / 180), uy = Math.sin(ang * Math.PI / 180);
      let best = null;
      segs.forEach(([a, b], i) => {
        const ex = b[1] - a[1], ey = b[2] - a[2], den = ux * ey - uy * ex;
        if (Math.abs(den) < 1e-12) return;
        const t = ((a[1] - W[0]) * ey - (a[2] - W[1]) * ex) / den, u = ((a[1] - W[0]) * uy - (a[2] - W[1]) * ux) / den;
        if (t > 0 && u >= -1e-9 && u <= 1 + 1e-9 && (!best || t < best.t)) best = { t, x: W[0] + t * ux, y: W[1] + t * uy, nm: i === segs.length - 1 ? null : a[0] + u * (b[0] - a[0]) };
      });
      return best;
    };
    let th = 0, pu = 0.38;
    function draw() {
      g.textContent = '';
      const D = hit(th), Dc = hit(th + 180);
      const Sx = W[0] + pu * (D.x - W[0]), Sy = W[1] + pu * (D.y - W[1]);
      const Wp = [ax.x(W[0]), ax.y(W[1])], Dp = [ax.x(D.x), ax.y(D.y)], Cp = [ax.x(Dc.x), ax.y(Dc.y)], Sp = [ax.x(Sx), ax.y(Sy)];
      line(g, [Wp, Cp], 's-sec dash').setAttribute('style', 'stroke-width: 2');
      line(g, [Wp, Dp], 's-pri').setAttribute('style', 'stroke-width: 2');
      line(g, [Wp, Sp], 's-pri').setAttribute('style', 'stroke-width: 5; opacity: 0.6');
      if (th > 0) {
        const R = 26, a = th * Math.PI / 180;
        s('path', { d: `M ${Wp[0] + R} ${Wp[1]} A ${R} ${R} 0 ${th > 180 ? 1 : 0} 0 ${(Wp[0] + R * Math.cos(a)).toFixed(1)} ${(Wp[1] - R * Math.sin(a)).toFixed(1)}`, class: 's-fg', style: 'stroke-width: 1' }, g);
      }
      line(g, [Wp, [Wp[0] + 34, Wp[1]]], 's-fg dash').setAttribute('style', 'stroke-width: 1');
      dot(g, Cp[0], Cp[1], 'f-sec', 4.5);
      dot(g, Dp[0], Dp[1], 'f-sec', 5.5);
      dot(g, Sp[0], Sp[1], 'f-pri', 6);
      dot(g, Wp[0], Wp[1], 'f-fg', 4.5);
      const lab = (p, text, cls, ref) => {
        const dx = p[0] - ref[0], dy = p[1] - ref[1], d = Math.hypot(dx, dy) || 1;
        tx(g, p[0] + 12 * dx / d, p[1] + 12 * dy / d, text, cls + ' t-bold halo', dx / d < -0.4 ? 'end' : dx / d > 0.4 ? 'start' : 'middle');
      };
      lab(Dp, D.nm ? `D ${Math.round(D.nm)} nm` : 'D', 't-sec', Wp);
      lab(Cp, Dc.nm ? `D′ ${Math.round(Dc.nm)} nm` : 'D′', 't-sec', Wp);
      tx(g, Wp[0] - 8, Wp[1] + 12, 'W', 't-fg t-bold halo', 'end');
      tx(g, Sp[0], Sp[1] - 13, 'S', 't-pri t-bold halo', 'middle');
      const ws = Math.hypot(Sx - W[0], Sy - W[1]), wd = Math.hypot(D.x - W[0], D.y - W[1]);
      role('pur-dom').textContent = D.nm ? `${Math.round(D.nm)} nm` : 'none';
      role('pur-comp').textContent = Dc.nm ? `${Math.round(Dc.nm)} nm` : 'none';
      role('pur-p').textContent = pu.toFixed(2);
      role('pur-calc').textContent = [
        `θ = ${th}°   W = (0.31, 0.32)`,
        `D = (${D.x.toFixed(3)}, ${D.y.toFixed(3)})   ${D.nm ? 'on the spectral locus, ' + Math.round(D.nm) + ' nm' : 'on the line of purples'}`,
        `S = (${Sx.toFixed(3)}, ${Sy.toFixed(3)})`,
        `|WS| = ${ws.toFixed(3)}   |WD| = ${wd.toFixed(3)}`,
        `purity = |WS| / |WD| = ${pu.toFixed(2)}`,
      ].join('\n');
      role('pur-note').textContent = D.nm
        ? `The ray from W meets the spectral locus at about ${Math.round(D.nm)} nm, the dominant wavelength (the hue). ` + (Dc.nm ? `Backwards it meets the locus at about ${Math.round(Dc.nm)} nm, the complementary wavelength.` : 'Backwards it hits the line of purples, so this color has no complementary wavelength (like S₂ on slide 64).')
        : `The ray hits the line of purples, which holds no single wavelength, so S has no dominant wavelength. Its complementary wavelength, about ${Math.round(Dc.nm)} nm, is used instead (textbook context). Purity is still |WS| / |WD| (like S₃ on slide 64).`;
    }
    const host = viz('pur-sliders');
    slider(host, { label: 'θ', min: 0, max: 355, step: 5, value: 0, fmt: v => v + '°' }, v => { th = v; draw(); });
    slider(host, { label: 'purity', min: 0, max: 1, step: 0.01, value: 0.38, fmt: v => v.toFixed(2) }, v => { pu = v; draw(); });
  });

  fig('cheat', () => {
    const L = t => ({ text: t, cls: 'l' });
    table(viz('cheat'), [L('Fact or formula'), L('Value or example')], [
      ['Coordinates', '(0, 0) top-left; x = row (down), y = column (right)'],
      ['Flattened index of f[i][j]', 'row-major i·N + j; column-major j·M + i'],
      ['Photon', 'f = cₙ / λ, q = hc / λ; 555 nm → 5.41 × 10¹⁴ Hz, 3.58 × 10⁻¹⁹ J'],
      ['Photopic / scotopic peak', '555 nm (half at 510, 610) / 507 nm'],
      ['Radiance / luminance / brightness', 'W / lm / subjective'],
      ['Storage', 'B = M × N × k bits, L = 2ᵏ'],
      ['N₄(p) / ND(p) / N₈(p)', '(x±1, y), (x, y±1) / (x±1, y±1) / both'],
      ['m-adjacent', 'q ∈ N₄(p), or q ∈ ND(p) and N₄(p) ∩ N₄(q) has no pixel in V'],
      ['Path length n', 'number of steps'],
      ['D₄ city-block', '|x − s| + |y − t|; diamond; 2r² + 2r + 1 pixels'],
      ['D₈ chessboard', 'max(|x − s|, |y − t|); square; (2r + 1)² pixels'],
      ['Dₑ Euclidean', '√((x − s)² + (y − t)²); always D₈ ≤ Dₑ ≤ D₄'],
      ['Logic', 'black = 0, white = 1; same-size images, pixel by pixel'],
      ['Munsell', 'value 0–10, chroma 0–20, 10 principal hues'],
      ['CIE-RGB', '700, 546.1, 435.8 nm; 17 observers; 2°; r̄ negative'],
      ['XYZ', 'Y luminance, X red mix, Z blue response'],
      ['Chromaticity', 'x = X/(X+Y+Z), y = Y/(X+Y+Z), x + y + z = 1'],
      ['Illuminants', 'A tungsten, B sunset, C blue sky, D65 daylight, E equal energy'],
      ['TV', 'PAL: D65, 625 lines; NTSC: C, 525 lines'],
      ['Purity', '|WS| / |WD|: 0 at white, 1 on the locus'],
    ].map(r => r.map(L)));
  });
});
