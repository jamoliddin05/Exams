QV.register('topic9', function (q) {
  const { s, h, svg, grid, gray, steps, slider, axes, line, table, fmt } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  // each figure is isolated so one failure leaves the rest of the article drawn
  const fig = (name, fn) => { try { fn(); } catch (e) { QV.fail('topic9 ' + name, e); } };
  const tx = (g, x, y, text, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls || null }, g, text);
  const ring = (g, x, y, w, hh, cls) => {
    s('rect', { x, y, width: w, height: hh, class: 'f-none sep', style: 'stroke-width: 6' }, g);
    s('rect', { x, y, width: w, height: hh, class: 'f-none ' + cls, style: 'stroke-width: 3' }, g);
  };
  const rnd = v => Math.floor(v + 0.5);
  const sum = a => a.reduce((x, y) => x + y, 0);
  const clamp = v => Math.max(0, Math.min(255, v));
  const LV = [0, 1, 2, 3, 4, 5, 6, 7];
  const count = rows => LV.map(k => rows.flat().filter(v => v === k).length);
  const cumul = n => n.map((_, k) => sum(n.slice(0, k + 1)));
  const g7 = v => gray(v, 7);
  const SLIDE14 = [[4, 4, 3, 3], [4, 4, 3, 3], [4, 1, 2, 3], [0, 1, 2, 3]];
  const fade = (G, r, c) => { G.rects[r][c].style.opacity = 0.3; if (G.texts[r][c]) G.texts[r][c].style.opacity = 0.3; };

  // Figure 1: the slide 11 LUT applied to every pixel
  fig('lut', () => {
    const LUT = [0, 0, 1, 1, 2, 3, 4, 5];
    const IN = [[7, 7, 5, 4, 2], [7, 6, 4, 3, 0], [7, 6, 4, 3, 1], [6, 6, 4, 2, 0], [5, 5, 3, 1, 0]];
    const OUT = IN.map(r => r.map(v => LUT[v]));
    const NIN = count(IN);
    const g = s('g', {}, svg(viz('lut'), 800, 240, { label: 'The slide 11 image, the 3-bit look-up table and the output image', minWidth: 560 }));
    steps(viz('lut-steps'), ['All values'].concat(LV.map(v => 'r = ' + v)), k => {
      g.textContent = '';
      const sel = k - 1;
      const gi = grid(g, { x: 20, y: 50, data: IN, cell: 32, gap: 2, fill: g7, stroke: 'box', title: 'Input image f' });
      const go = grid(g, { x: 612, y: 50, data: OUT, cell: 32, gap: 2, fill: g7, stroke: 'box', title: 'Output image g' });
      const lt = grid(g, { x: 300, y: 104, data: [LV, LUT], cell: 30, gap: 2, stroke: 'box', rowLabels: ['index r', 'LUT[r]'], title: 'Look-up table',
        fill: (v, r) => (r === 0 ? { cls: 'f-seg', text: 't-fg' } : g7(v)) });
      QV.arrow(g, 196, 134, 240, 134);
      QV.arrow(g, 562, 134, 604, 134);
      tx(g, 427, 196, 'g(x, y) = LUT[f(x, y)]', 't-fg', 'middle');
      if (k > 0) {
        IN.forEach((row, r) => row.forEach((v, c) => {
          if (v === sel) { ring(g, gi.cx(c), gi.cy(r), 32, 32, 'outline-sec'); ring(g, go.cx(c), go.cy(r), 32, 32, 'outline-sec'); } else { fade(gi, r, c); fade(go, r, c); }
        }));
        ring(g, lt.cx(sel), 104, 30, 62, 'outline-pri');
      }
      const n = NIN[sel];
      role('lut-note').textContent = k === 0
        ? 'All 25 pixels use the same 8-entry table. Every entry is at most its index, so no pixel gets brighter. Levels 0 and 1 both become 0, and 2 and 3 both become 1: a LUT can merge levels.'
        : `${n} pixel${n > 1 ? 's have' : ' has'} value ${sel}. They all read index ${sel}, which holds ${LUT[sel]}, so they all become ${LUT[sel]}.`;
    });
  });

  // Figure 2: transfer curves read as LUTs
  fig('curves', () => {
    const P = (r, gm) => 255 * Math.pow(r / 255, gm);
    const CV = [
      { b: 'Identity', f: r => r, c: r => `s = r = ${r}`, n: 'The identity (null) transform: the diagonal. Every level stays where it is. This is the default LUT of slide 10.' },
      { b: '(a) Contrast stretching', f: r => (r === 0 ? 0 : 255 / (1 + Math.pow(128 / r, 4))), c: r => `s = 255 / (1 + (128/r)^4)    (textbook S-curve, m = 128)`, n: 'Slide 13(a). Below m = 128 levels get darker, above it brighter. The curve is steep around m, so levels near m spread apart.' },
      { b: '(b) Binarization', f: r => (r < 128 ? 0 : 255), c: r => `${r} ${r < 128 ? '<' : '≥'} 128, so s = ${r < 128 ? 0 : 255}`, n: 'Slide 13(b). A step at m = 128: every level below becomes 0 and every level from m up becomes 255.' },
      { b: 'Negative', f: r => 255 - r, c: r => `s = 255 − ${r} = ${255 - r}`, n: 'The NOT of slide 55. Dark and bright swap; the slope is −1, so contrast is kept.' },
      { b: 'Log', f: r => 255 * Math.log(1 + r) / Math.log(256), c: r => `s = 255 × log(${r + 1}) / log(256)`, n: '(textbook context) Steep at the dark end, flat at the bright end: dark levels spread out, bright ones crowd together.' },
      { b: 'Gamma 0.5', f: r => P(r, 0.5), c: r => `s = 255 × (${r}/255)^0.5`, n: 'γ < 1 lifts the curve above the diagonal: every level gets brighter, the dark end most.' },
      { b: 'Gamma 2.0', f: r => P(r, 2), c: r => `s = 255 × (${r}/255)^2`, n: 'γ > 1 bends the curve below the diagonal: every level gets darker.' },
      { b: 'Stretch 50–150', f: r => (r <= 50 ? 0 : r >= 150 ? 255 : 255 * (r - 50) / 100), c: r => (r <= 50 ? `${r} ≤ 50, so s = 0` : r >= 150 ? `${r} ≥ 150, so s = 255` : `s = 255 × (${r} − 50) / 100`), n: 'Lecture 6 slide 37. The band 50 to 150 is spread over 0 to 255 (slope 2.55); the rest clips.' },
    ];
    let cur = 1, rv = 100;
    const g0 = svg(viz('curve'), 760, 300, { label: 'A transfer curve s = T(r) and the gray ramp before and after it', minWidth: 560 });
    const ax = axes(g0, { x: 60, y: 30, w: 230, h: 220, xd: [0, 255], yd: [0, 255], xt: [0, 64, 128, 192, 255], yt: [0, 64, 128, 192, 255], xl: 'input level r', yl: 'output level s' });
    line(g0, [[ax.x(0), ax.y(0)], [ax.x(255), ax.y(255)]], 's-muted dash');
    const g = s('g', {}, g0);
    const RX = 360, RW = 380, cw = RW / 32;
    function draw() {
      g.textContent = '';
      const c = CV[cur], v = c.f(rv);
      line(g, Array.from({ length: 256 }, (_, r) => [ax.x(r), ax.y(c.f(r))]), 's-pri');
      line(g, [[ax.x(rv), ax.y(0)], [ax.x(rv), ax.y(v)], [ax.x(0), ax.y(v)]], 's-muted dash');
      s('circle', { cx: ax.x(rv), cy: ax.y(v), r: 5, class: 'f-pri' }, g);
      tx(g, 360, 46, 'input ramp r = 0 … 255', 't-fg t-bold');
      tx(g, 360, 146, 'output s = T(r)', 't-fg t-bold');
      for (let i = 0; i < 32; i++) {
        const r = rnd(i * 255 / 31);
        s('rect', { x: RX + i * cw, y: 58, width: cw + 0.5, height: 30, style: gray(r).style + '; shape-rendering: crispEdges' }, g);
        s('rect', { x: RX + i * cw, y: 158, width: cw + 0.5, height: 30, style: gray(c.f(r)).style + '; shape-rendering: crispEdges' }, g);
      }
      s('rect', { x: RX, y: 58, width: RW, height: 30, class: 'f-none box' }, g);
      s('rect', { x: RX, y: 158, width: RW, height: 30, class: 'f-none box' }, g);
      const xr = RX + rv / 255 * RW, xs = RX + v / 255 * RW, cx = x => Math.max(RX + 30, Math.min(RX + RW - 30, x));
      line(g, [[xr, 54], [xr, 92]], 's-pri');
      line(g, [[xs, 154], [xs, 192]], 's-pri');
      tx(g, cx(xr), 104, 'r = ' + rv, 't-pri t-bold', 'middle');
      tx(g, cx(xs), 204, 's = ' + rnd(v), 't-pri t-bold', 'middle');
      const sl = (c.f(Math.min(255, rv + 1)) - c.f(Math.max(0, rv - 1))) / (Math.min(255, rv + 1) - Math.max(0, rv - 1));
      role('curve-note').textContent = c.n;
      role('curve-calc').textContent = `${c.c(rv)}\nT(${rv}) = ${fmt(v, 2)}  →  s = ${rnd(v)}\nslope here ≈ ${fmt(sl, 2)}  (${sl > 1.05 ? 'steeper than the diagonal: levels spread apart, more contrast' : sl < -0.05 ? 'falling: the order of levels is reversed' : sl < 0.95 ? 'flatter than the diagonal: levels move together, less contrast' : 'about 1: contrast unchanged'})`;
    }
    steps(viz('curve-steps'), CV.map(c => c.b), k => { cur = k; draw(); }, 1);
    slider(viz('curve-slider'), { label: 'r', min: 0, max: 255, step: 1, value: 100 }, v => { rv = v; draw(); });
  });

  // Figure 3: + a and × k on a histogram, with clamping
  fig('bc', () => {
    const BASE = Array.from({ length: 256 }, (_, r) => rnd(40 * Math.exp(-Math.pow((r - 110) / 25, 2))));
    const N = sum(BASE);
    const stat = hst => { const l = hst.map((c, r) => (c ? r : -1)).filter(r => r >= 0); return { lo: l[0], hi: l[l.length - 1], mean: sum(hst.map((c, r) => c * r)) / N }; };
    const S0 = stat(BASE);
    let A = 40, K = 1;
    const g0 = svg(viz('bc'), 640, 256, { label: 'Histogram of an 8-bit image before and after s = k r + a', minWidth: 520 });
    const ax = axes(g0, { x: 64, y: 34, w: 512, h: 170, xd: [-0.5, 255.5], yd: [0, 90], xt: [0, 64, 128, 192, 255], yt: [0, 30, 60, 90], xl: 'gray level', yl: 'pixels' });
    const g = s('g', {}, g0);
    const ghost = [];
    BASE.forEach((c, r) => { ghost.push([ax.x(r - 0.5), ax.y(c)], [ax.x(r + 0.5), ax.y(c)]); });
    line(g0, ghost, 's-muted dash');
    const st = viz('bc-stats');
    function draw() {
      g.textContent = '';
      st.textContent = '';
      const H = Array(256).fill(0);
      let cl = 0;
      BASE.forEach((c, r) => { if (!c) return; const v = K * r + A; if (v < 0 || v > 255) cl += c; H[clamp(rnd(v))] += c; });
      H.forEach((c, r) => {
        if (!c) return;
        s('rect', { x: ax.x(r) - 1, y: ax.y(Math.min(c, 90)), width: 2, height: ax.y(0) - ax.y(Math.min(c, 90)), class: 'f-pri' }, g);
        if (c > 90) tx(g, r < 128 ? ax.x(r) + 4 : ax.x(r) - 4, 30, 'n = ' + c, 't-pri t-bold t-sm', r < 128 ? 'start' : 'end');
      });
      const S1 = stat(H);
      [[`${S1.lo} → ${S1.hi}`, `darkest → brightest (was ${S0.lo} → ${S0.hi})`],
        [String(S1.hi - S1.lo), `spread, contrast (was ${S0.hi - S0.lo})`],
        [fmt(S1.mean, 1), `mean, brightness (was ${fmt(S0.mean, 1)})`],
        [String(cl), `clamped pixels of ${N}`]].forEach(([v, sub]) => {
        const d = h('div', { class: 'stat' }, st);
        h('span', { class: 'v pri' }, d, v);
        h('span', { class: 'sub' }, d, sub);
      });
      const sp0 = S0.hi - S0.lo, sp1 = S1.hi - S1.lo;
      let t = `s = ${fmt(K, 1)} × r ${A < 0 ? '−' : '+'} ${Math.abs(A)}. Mean ${fmt(S0.mean, 1)} → ${fmt(S1.mean, 1)}, spread ${sp0} → ${sp1}. `;
      if (K === 1) t += A === 0 ? 'Nothing changes.' : 'Every level moves by the same amount, so only the brightness changes.';
      else if (K > 1) t += 'Neighbouring levels now land more than 1 apart, so gaps open between the bars (the comb of slide 17): contrast goes up.';
      else t += 'Neighbouring levels now land less than 1 apart, so some share a level and bars merge into taller ones: contrast goes down.';
      if (cl) t += ` ${cl} pixels left 0 to 255 and were clamped: the spike at the end.`;
      role('bc-note').textContent = t;
    }
    slider(viz('bc-a'), { label: 'add a', min: -100, max: 100, step: 10, value: 40, fmt: v => (v > 0 ? '+' : '') + v }, v => { A = v; draw(); });
    slider(viz('bc-k'), { label: 'multiply k', min: 0.5, max: 2, step: 0.1, value: 1, fmt: v => v.toFixed(1) }, v => { K = Math.round(v * 10) / 10; draw(); });
  });

  // Figure 4: slide 29-31 equalization, one level at a time
  fig('he', () => {
    const NK = count(SLIDE14), CUM = cumul(NK), NORM = CUM.map(c => c * 7 / 16), SK = NORM.map(rnd);
    const SHOW = ['0.43', '1.31', '2.18', '4.81', '7.00', '7.00', '7.00', '7.00'];
    const g = s('g', {}, svg(viz('he'), 760, 240, { label: 'The slide 29 image, its histogram and the normalized sum rounded on a 0 to 7 line', minWidth: 560 }));
    const tbl = table(viz('he-table'), [{ html: 'r<sub>k</sub>' }, { html: 'n<sub>k</sub>' }, 'cumulative sum', 'sum × 7/16', 'slide shows', { html: 's<sub>k</sub>' }],
      LV.map(k => [k, NK[k], CUM[k], fmt(NORM[k], 4), SHOW[k], { text: SK[k], cls: 'hl' }]));
    const NX = v => 490 + v * 250 / 7;
    steps(viz('he-steps'), ['All'].concat(LV.map(k => 'r = ' + k)), i => {
      g.textContent = '';
      const sel = i - 1;
      const gi = grid(g, { x: 24, y: 56, data: SLIDE14, cell: 36, gap: 2, fill: g7, stroke: 'box', title: 'Slide 29 image' });
      if (i > 0) SLIDE14.forEach((row, r) => row.forEach((v, c) => { if (v > sel) fade(gi, r, c); else if (v === sel) ring(g, gi.cx(c), gi.cy(r), 36, 36, 'outline-sec'); }));
      const ax = axes(g, { x: 236, y: 40, w: 200, h: 150, xd: [-0.5, 7.5], yd: [0, 7], xt: LV, yt: [0, 2, 4, 6], xl: 'gray level r', yl: 'pixels' });
      LV.forEach(k => {
        if (!NK[k]) return;
        const cls = i === 0 || k < sel ? 'f-pri' : k === sel ? 'f-sec' : 'f-seg';
        s('rect', { x: ax.x(k) - 10, y: ax.y(NK[k]), width: 20, height: ax.y(0) - ax.y(NK[k]), class: cls }, g);
        tx(g, ax.x(k), ax.y(NK[k]) - 8, NK[k], 't-fg', 'middle');
      });
      tx(g, 490, 44, 'cum × 7/16 on the 0–7 scale', 't-fg t-bold');
      line(g, [[NX(0), 120], [NX(7), 120]], 's-fg');
      LV.forEach(k => { s('line', { x1: NX(k), x2: NX(k), y1: 114, y2: 126, class: 'l-axis' }, g); tx(g, NX(k), 140, k, 't-sm', 'middle'); });
      const show = i === 0 ? [0, 1, 2, 3, 4] : [sel];
      show.forEach((k, j) => {
        const v = NORM[k];
        line(g, [[NX(v), 120], [NX(SK[k]), 120]], 's-ok');
        s('circle', { cx: NX(SK[k]), cy: 120, r: 5, class: 'f-ok' }, g);
        s('circle', { cx: NX(v), cy: 120, r: 4, class: 'f-pri' }, g);
        const lab = i === 0 ? (k === 4 ? 'r = 4…7' : 'r = ' + k) : fmt(v, 4);
        tx(g, Math.min(NX(v), 736), i === 0 ? 100 - (j % 2) * 14 : 100, lab, 't-pri t-sm', NX(v) > 720 ? 'end' : 'middle');
        tx(g, Math.min(NX(SK[k]), 736), 160, 's = ' + SK[k], 't-ok t-bold t-sm', NX(SK[k]) > 720 ? 'end' : 'middle');
      });
      tbl.rows.forEach((r, j) => r.classList.toggle('on', j === sel));
      role('he-note').textContent = i === 0
        ? `Normalized sums ${NORM.map(v => fmt(v, 4)).join(', ')} round to the LUT ${SK.join(' ')}.`
        : `r = ${sel}: n = ${NK[sel]}, pixels at level ${sel} or darker = ${CUM[sel]}, normalized sum ${CUM[sel]} × 7/16 = ${fmt(NORM[sel], 4)}, nearest integer s = ${SK[sel]}.` + (Math.floor(NORM[sel]) !== SK[sel] ? ` Floor would give ${Math.floor(NORM[sel])}.` : '');
    });
  });

  // Figure 5: HE on four input histograms
  fig('eff', () => {
    const SETS = [
      { b: 'Slide 29 image', n: [1, 2, 2, 6, 5, 0, 0, 0], t: 'The big bars at 3 and 4 move from 1 apart to 2 apart (5 and 7). The output spans 0 to 7 but leaves 3, 4 and 6 empty: not flat.' },
      { b: 'Dark', n: [20, 18, 12, 8, 4, 2, 0, 0], t: 'Every level moves up and the crowded dark levels move 2 apart (0 → 2, 1 → 4). Levels 4 and 5 merge into 7. Mean 1.44 → 4.09.' },
      { b: 'Low contrast', n: [0, 0, 8, 22, 26, 8, 0, 0], t: 'Only levels 2 to 5 are used. The peaks at 3 and 4 move from 1 apart to 3 apart: contrast stretched near the maxima. The range grows from 2–5 to 1–7.' },
      { b: 'Two peaks', n: [4, 16, 4, 2, 1, 6, 19, 12], t: 'The valley levels 2, 3 and 4 (7 pixels) all become 3: contrast compressed near the minima. Beside the peaks the gaps grow (1 → 2, 5 → 4 and 6 → 6).' },
    ];
    const X = k => 140 + k * 70;
    const g = s('g', {}, svg(viz('eff'), 720, 320, { label: 'Input histogram, equalized histogram and the bands that carry each level', minWidth: 540 }));
    steps(viz('eff-steps'), SETS.map(d => d.b), i => {
      g.textContent = '';
      const n = SETS[i].n, N = sum(n), cum = cumul(n), v = cum.map(c => c * 7 / N), sk = v.map(rnd);
      const out = LV.map(k => sum(LV.filter(r => sk[r] === k).map(r => n[r])));
      const mx = Math.max(...n, ...out), hh = c => c / mx * 80;
      tx(g, 20, 75, 'input', 't-fg t-bold');
      tx(g, 20, 255, 'output', 't-fg t-bold');
      LV.forEach(k => {
        if (n[k]) { s('rect', { x: X(k) - 17, y: 120 - hh(n[k]), width: 34, height: hh(n[k]), class: 'f-pri' }, g); tx(g, X(k), 112 - hh(n[k]), n[k], 't-pri t-bold', 'middle'); }
        tx(g, X(k), 132, k, 't-sm', 'middle');
        tx(g, X(k), 198, k, 't-sm', 'middle');
        if (out[k]) { s('rect', { x: X(k) - 17, y: 210, width: 34, height: hh(out[k]), class: 'f-ok' }, g); tx(g, X(k), 222 + hh(out[k]), out[k], 't-ok t-bold', 'middle'); }
        if (n[k]) line(g, [[X(k), 144], [X(sk[k]), 186]], 's-pri').setAttribute('style', `stroke-width: ${1 + 12 * n[k] / mx}; opacity: 0.6`);
      });
      const row = (lab, a) => lab.padEnd(11) + a.map(x => String(x).padStart(7)).join('');
      role('eff-calc').textContent = [row('r_k', LV), row('n_k', n), row('cumulative', cum), row(`× 7/${N}`, v.map(x => fmt(x, 3))), row('s_k', sk)].join('\n');
      role('eff-note').textContent = `${N} pixels, LUT ${sk.join(' ')}. ` + SETS[i].t;
    });
  });

  // Figure 6: slide 44 inverse LUT, closest G(z)
  fig('spec', () => {
    const G = cumul([0, 0, 0, 0, 0, 6, 5, 5]).map(c => c * 7 / 16);
    const pick = sv => LV.reduce((b, z) => (Math.abs(G[z] - sv) < Math.abs(G[b] - sv) ? z : b), 0);
    const INV = LV.map(pick);
    const GV = [0, 2.625, 4.8125, 7], ZL = ['z = 0…4', 'z = 5', 'z = 6', 'z = 7'];
    const X = v => 70 + v * 88, YL = 112;
    const g = s('g', {}, svg(viz('spec'), 760, 250, { label: 'Equalized levels s and the G(z) values of the desired histogram on one scale, with the inverse LUT', minWidth: 560 }));
    steps(viz('spec-steps'), ['All'].concat(LV.map(k => 's = ' + k)), i => {
      g.textContent = '';
      const sel = i - 1;
      tx(g, 70, 22, 's = T(r): the equalized levels of the image', 't-pri t-bold');
      line(g, [[X(0), YL], [X(7), YL]], 's-fg');
      LV.forEach(k => { s('line', { x1: X(k), x2: X(k), y1: 98, y2: YL, class: 'l-axis' }, g); tx(g, X(k), 70, k, 't-pri t-bold', 'middle'); });
      if (i > 0) {
        const lo = GV.filter(v => v <= sel).pop(), hi = GV.filter(v => v >= sel)[0], win = G[INV[sel]];
        [lo, hi].forEach(gv => {
          if (gv === sel) return;
          line(g, [[X(sel), YL], [X(gv), YL]], gv === win ? 's-ok' : 's-muted dash');
          tx(g, (X(sel) + X(gv)) / 2, 88, fmt(Math.abs(gv - sel), 4), gv === win ? 't-ok t-bold' : 't-muted', 'middle');
        });
        s('circle', { cx: X(sel), cy: YL, r: 7, class: 'f-pri' }, g);
      }
      GV.forEach((v, j) => {
        s('circle', { cx: X(v), cy: YL, r: 5, class: 'f-sec' }, g);
        tx(g, X(v), 132, 'G = ' + fmt(v, 4), 't-sec', 'middle');
        tx(g, X(v), 148, ZL[j], 't-sec t-sm', 'middle');
      });
      tx(g, 70, 176, 'G(z) of the desired histogram n5 = 6, n6 = 5, n7 = 5', 't-sec');
      tx(g, 70, 198, 'inverse LUT z = G⁻¹(s), one box per s', 't-fg t-bold');
      LV.forEach(k => {
        s('rect', { x: X(k) - 16, y: 210, width: 32, height: 28, rx: 4, class: (i === 0 || k === sel ? 'f-ok-soft' : 'f-seg') + ' box' }, g);
        tx(g, X(k), 224, INV[k], 't-fg t-bold', 'middle');
        if (k === sel) ring(g, X(k) - 16, 210, 32, 28, 's-ok');
      });
      const d = LV.map(z => fmt(Math.abs(G[z] - sel), 4));
      role('spec-note').textContent = i === 0
        ? `Inverse LUT s → z: ${INV.join(' ')}, as on slide 44. s = 0 and 1 go to 0, 2 and 3 to 5, 4 and 5 to 6, 6 and 7 to 7.`
        : `s = ${sel}: distances to G(z) for z = 0…7 are ${d.join(', ')}. The closest is G(${INV[sel]}) = ${fmt(G[INV[sel]], 4)}, so z = ${INV[sel]}.` + (INV[sel] === 0 ? ' G = 0 for z = 0 to 4, and the tie goes to the smallest, z = 0.' : '');
    });
  });

  // Figure 7: bitwise NOT, AND, OR, XOR
  fig('bits', () => {
    const OPS = [
      { b: 'NOT p', f: p => 255 - p, r: 'Every bit flips; for 8 bits this equals 255 − p (slide 55).' },
      { b: 'p AND q', f: (p, q) => p & q, r: '1 only where both bits are 1. AND with 255 keeps a pixel, AND with 0 makes it black.' },
      { b: 'p OR q', f: (p, q) => p | q, r: '1 where either bit is 1. OR with 0 keeps a pixel, OR with 255 makes it white.' },
      { b: 'p XOR q', f: (p, q) => p ^ q, r: '1 where the bits differ, 0 where they are the same, so p XOR q = 0 exactly when p = q.' },
    ];
    let op = 1, P = 147, Qv = 102;
    const g = s('g', {}, svg(viz('bits'), 700, 176, { label: 'Two 8-bit values and the result of a bitwise operation, bit by bit', minWidth: 540 }));
    const BX = i => 190 + i * 52;
    function draw() {
      g.textContent = '';
      const o = OPS[op], res = o.f(P, Qv);
      const row = (y, v, lab, ok, dim) => {
        const gg = s('g', { style: dim ? 'opacity: 0.25' : null }, g);
        tx(gg, 20, y + 15, lab, 't-fg t-bold');
        for (let i = 0; i < 8; i++) {
          const b = (v >> (7 - i)) & 1;
          s('rect', { x: BX(i), y, width: 44, height: 30, rx: 3, class: b ? (ok ? 'f-ok' : 'f-pri') : 'f-seg' }, gg);
          tx(gg, BX(i) + 22, y + 15, b, b ? 't-on t-bold' : 't-muted', 'middle');
        }
        tx(gg, 610, y + 15, '= ' + v, 't-fg t-bold');
      };
      for (let i = 0; i < 8; i++) tx(g, BX(i) + 22, 18, 128 >> i, 't-sm', 'middle');
      row(34, P, 'p', false, false);
      row(74, Qv, op === 0 ? 'q (unused)' : 'q', false, op === 0);
      line(g, [[BX(0), 120], [BX(7) + 44, 120]], 's-fg');
      row(130, res, o.b, true, false);
      role('bits-note').textContent = `${o.r} ${op === 0 ? `NOT ${P} = 255 − ${P} = ${res}.` : `${P} ${o.b.split(' ')[1]} ${Qv} = ${res}.`}`;
    }
    steps(viz('bits-steps'), OPS.map(o => o.b), k => { op = k; draw(); }, 1);
    slider(viz('bits-p'), { label: 'p', min: 0, max: 255, step: 1, value: 147 }, v => { P = v; draw(); });
    slider(viz('bits-q'), { label: 'q', min: 0, max: 255, step: 1, value: 102 }, v => { Qv = v; draw(); });
  });

  fig('cheat', () => {
    const L = t => ({ text: t, cls: 'l' });
    table(viz('cheat'), [L('Fact or formula'), L('Value or example')], [
      ['Image types', 'binary 1 bit · gray 8 bits (uint8, 0–255) · RGB 3 × 8 = 24 bits per pixel'],
      ['Point process', 'g(x, y) = T[f(x, y)] with a 1 × 1 neighbourhood: s = T(r)'],
      ['LUT', 'new value = LUT[old value], index from 0 · 0 0 1 1 2 3 4 5: 7 6 4 3 0 → 5 4 2 1 0'],
      ['Histogram', 'n_k = pixels at level k · p(r_k) = n_k / N² · slide 14: 1 2 2 6 5 0 0 0'],
      ['+ a, − a', 'brightness: the histogram shifts, contrast unchanged'],
      ['× k, ÷ k', 'contrast: the histogram stretches (comb) or compresses'],
      ['HE steps', '1. histogram · 2. normalized sum · 3. transform with the LUT'],
      ['HE rule', 's_k = round((L − 1)/N² × Σ n_j) · slide 29: 0 1 2 5 7 7 7 7'],
      ['HE theory', 'T = CDF → p_s(s) = 1 · (a) single-valued, monotonically increasing · (b) 0 ≤ T(r) ≤ 1'],
      ['HE effects', 'stretches near maxima, compresses near minima, not flat, no new levels'],
      ['Specification', 'z = G⁻¹[T(r)] · closest G(z), smallest z on a tie · slide 44: 0 0 5 5 6 6 7 7'],
      ['Clamping', '< 0 → 0, > 255 → 255 · 230 + 40 → 255 · 30 − 40 → 0'],
      ['Subtraction', 'motion and change detection'],
      ['Logic', 'NOT 147 = 108 · 147 AND 102 = 2 · 147 OR 102 = 247 · XOR: same bits 0, different 1'],
    ].map(r => r.map(L)));
  });
});
