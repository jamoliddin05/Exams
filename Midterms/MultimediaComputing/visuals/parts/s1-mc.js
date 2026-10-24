QV.register('s1-mc1', function (q) {
  const { s, svg, line, slider, arrow, fmt } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const T = 20;
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const share = phi => (phi === 360 ? '1' : `${phi / gcd(phi, 360)}/${360 / gcd(phi, 360)}`);
  const OPT = { 45: 'a', 90: 'b', 180: 'c', 360: 'd' };

  // Figure 1: phase circle and the two waves
  const W = svg(viz('wave'), 760, 254, { label: 'A 50 Hz sine wave at 0 degrees and the same wave with phase phi; the time shift between their peaks is marked', minWidth: 560 });
  const C = { cx: 92, cy: 118, r: 54 };
  const px = t => 214 + t * 13;
  const Y0 = 72, Y1 = 170, AMP = 30, ARW = 121, AXIS = 214;
  s('circle', { cx: C.cx, cy: C.cy, r: C.r, class: 'f-seg box' }, W);
  const sector = s('path', { class: 'f-pri-soft' }, W);
  s('line', { x1: C.cx - C.r, x2: C.cx + C.r, y1: C.cy, y2: C.cy, class: 's-line' }, W);
  s('line', { x1: C.cx, x2: C.cx, y1: C.cy - C.r, y2: C.cy + C.r, class: 's-line' }, W);
  [['0°', C.cx + C.r + 6, C.cy + 4, 'start'], ['90°', C.cx, C.cy - C.r - 7, 'middle'], ['180°', C.cx - C.r - 6, C.cy + 4, 'end'], ['270°', C.cx, C.cy + C.r + 15, 'middle']]
    .forEach(([t, x, y, a]) => s('text', { x, y, 'text-anchor': a, class: 't-sm' }, W, t));
  const hand = s('line', { x1: C.cx, y1: C.cy, class: 's-pri' }, W);
  const tip = s('circle', { r: 4, class: 'f-pri' }, W);
  const cap1 = s('text', { x: C.cx, y: C.cy + C.r + 36, 'text-anchor': 'middle', class: 't-pri t-bold' }, W);
  const cap2 = s('text', { x: C.cx, y: C.cy + C.r + 52, 'text-anchor': 'middle', class: 't-fg' }, W);

  for (let t = 0; t <= 40; t += 5) s('line', { x1: px(t), x2: px(t), y1: 38, y2: AXIS, class: 'l-grid' }, W);
  s('line', { x1: px(0), x2: px(40), y1: AXIS, y2: AXIS, class: 'l-axis' }, W);
  for (let t = 0; t <= 40; t += 5) {
    s('line', { x1: px(t), x2: px(t), y1: AXIS, y2: AXIS + 5, class: 'l-axis' }, W);
    s('text', { x: px(t), y: AXIS + 18, 'text-anchor': 'middle' }, W, t === 40 ? '40 ms' : String(t));
  }
  [Y0, Y1].forEach(y => s('line', { x1: px(0), x2: px(40), y1: y, y2: y, class: 's-line' }, W));
  s('path', { d: `M${px(0)} 21 L${px(0)} 28 L${px(20)} 28 L${px(20)} 21`, class: 's-fg', style: 'stroke-width: 1.2' }, W);
  s('text', { x: px(10), y: 16, 'text-anchor': 'middle', class: 't-fg t-bold' }, W, 'one period, T = 1/50 s = 20 ms');

  const wave = (ph, y0) => {
    const pts = [];
    for (let i = 0; i <= 400; i++) { const t = i / 10; pts.push([px(t), y0 - AMP * Math.sin(2 * Math.PI * t / T + ph)]); }
    return pts;
  };
  line(W, wave(0, Y0), 's-sec');
  s('text', { x: 204, y: Y0 + 4, 'text-anchor': 'end', class: 't-sec t-bold' }, W, '0°');
  const shifted = s('path', { class: 's-pri' }, W);
  const lab1 = s('text', { x: 204, y: Y1 + 4, 'text-anchor': 'end', class: 't-pri t-bold' }, W);
  const dyn = s('g', {}, W);

  function draw(phi) {
    const ph = phi * Math.PI / 180, dt = phi / 360 * T;
    shifted.setAttribute('d', wave(ph, Y1).map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' '));
    lab1.textContent = phi + '°';
    const ex = C.cx + C.r * Math.cos(ph), ey = C.cy - C.r * Math.sin(ph);
    if (phi === 0) sector.setAttribute('d', 'M0 0');
    else if (phi >= 360) sector.setAttribute('d', `M${C.cx - C.r} ${C.cy} a${C.r} ${C.r} 0 1 0 ${2 * C.r} 0 a${C.r} ${C.r} 0 1 0 ${-2 * C.r} 0`);
    else sector.setAttribute('d', `M${C.cx} ${C.cy} L${C.cx + C.r} ${C.cy} A${C.r} ${C.r} 0 ${phi > 180 ? 1 : 0} 0 ${ex.toFixed(1)} ${ey.toFixed(1)} Z`);
    hand.setAttribute('x2', ex); hand.setAttribute('y2', ey);
    tip.setAttribute('cx', ex); tip.setAttribute('cy', ey);
    cap1.textContent = `${phi}° of 360°`;
    cap2.textContent = phi === 0 ? 'no shift' : phi === 360 ? 'a full cycle' : `${share(phi)} of a cycle`;

    dyn.textContent = '';
    const xr = px(25), xs = px(25 - dt);
    s('line', { x1: xr, x2: xr, y1: Y0 - AMP, y2: ARW, class: 's-sec dash', style: 'stroke-width: 1' }, dyn);
    s('line', { x1: xs, x2: xs, y1: ARW, y2: Y1 - AMP, class: 's-pri dash', style: 'stroke-width: 1' }, dyn);
    s('circle', { cx: xr, cy: Y0 - AMP, r: 4, class: 'f-sec' }, dyn);
    s('circle', { cx: xs, cy: Y1 - AMP, r: 4, class: 'f-pri' }, dyn);
    if (dt > 0) arrow(dyn, xr, ARW, xs, ARW, { cls: 'a-pri', width: 2 });
    s('text', { x: xr + 8, y: ARW + 4, class: 't-pri t-bold' }, dyn, `Δt = ${fmt(dt)} ms`);
  }

  slider(viz('slider'), { label: 'φ', min: 0, max: 360, step: 15, value: 90, fmt: v => v + '°' }, phi => {
    draw(phi);
    const dt = fmt(phi / 360 * T) + ' ms';
    role('phi').textContent = phi + '°';
    role('frac').textContent = phi === 0 ? '0' : share(phi);
    role('dt').textContent = dt;
    let v;
    if (phi === 0) v = 'At 0° the two waves are the same wave. Drag φ to shift the bottom one.';
    else if (phi === 360) v = 'A full turn of 360° moves the wave by a whole period, <b>20 ms</b>, so it lands back on itself. That is option d.';
    else v = `${phi}° is ${share(phi)} of a cycle, so the wave moves by ${share(phi)} × 20 ms = <b>${dt}</b>.`;
    if (phi === 90) v += ' That is option b, the answer.';
    else if (OPT[phi] && phi !== 360) v += ` That is option ${OPT[phi]}.`;
    role('verdict').innerHTML = v;
  });

  // Figure 2: each option as a share of the period
  const B = svg(viz('options'), 640, 200, { label: 'Four bars of one 20 ms period, filled to 2.5, 5, 10 and 20 ms', minWidth: 500 });
  const bx = t => 168 + t * 22.5;
  [['a', 2.5, '45°', '1/8 period'], ['b', 5, '90°', '1/4 period'], ['c', 10, '180°', '1/2 period'], ['d', 20, '360°', 'a full period']].forEach(([k, dt, deg, fr], i) => {
    const y = 8 + i * 40, ok = k === 'b';
    s('text', { x: 0, y: y + 17, class: ok ? 't-ok t-bold' : 't-fg' }, B, `${k} · ${dt} ms`);
    s('rect', { x: bx(0), y, width: bx(20) - bx(0), height: 26, rx: 3, class: 'f-seg' }, B);
    s('rect', { x: bx(0), y, width: bx(dt) - bx(0), height: 26, rx: 3, class: ok ? 'f-ok' : 'f-sec-soft' }, B);
    s('text', { x: bx(20) - 8, y: y + 17, 'text-anchor': 'end', class: ok ? 't-ok t-bold' : 't-fg' }, B, `${deg} = ${fr}`);
  });
  s('line', { x1: bx(0), x2: bx(20), y1: 170, y2: 170, class: 'l-axis' }, B);
  [0, 5, 10, 15, 20].forEach(t => {
    s('line', { x1: bx(t), x2: bx(t), y1: 170, y2: 175, class: 'l-axis' }, B);
    s('text', { x: bx(t), y: 188, 'text-anchor': 'middle' }, B, t === 20 ? '20 ms' : String(t));
  });
});

QV.register('s1-mc2', function (q) {
  const { s, svg, axes, plot, slider, fmt, scale } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const F = 12, PH = Math.PI / 4;
  // f in kHz and t in µs, so f · t / 1000 is the number of cycles
  const sig = (f, t) => Math.sin(2 * Math.PI * f * t / 1000 + PH);
  const tx = (g, attrs, parts) => {
    const t = s('text', attrs, g);
    let lift = false;
    parts.forEach(p => {
      if (typeof p === 'string') { s('tspan', lift ? { dy: -3 } : {}, t, p); lift = false; } else { s('tspan', { dy: 3, class: 't-sm' }, t, p[0]); lift = true; }
    });
    return t;
  };

  // Figure 1: the tone, its samples and the wave they rebuild
  const W = svg(viz('wave'), 760, 236, { label: 'A 12 kHz tone over 500 microseconds with its samples and the wave rebuilt from them', minWidth: 560 });
  const ax = axes(W, { x: 44, y: 12, w: 696, h: 180, xd: [0, 500], yd: [-1.3, 1.3], xt: [0, 100, 200, 300, 400, 500], yt: [-1, 0, 1], xl: 'time (µs)' });
  plot(W, ax, t => sig(F, t), 0, 500, 1500, 's-pri');
  const layer = s('g', {}, W);

  const R = svg(viz('rule'), 760, 114, { label: 'Frequency line from 0 to 60 kHz: below 24 kHz aliasing, above 24 kHz the tone is kept; options a to d marked', minWidth: 560 });
  const rx = scale(0, 60, 56, 736);
  s('rect', { x: rx(0), y: 34, width: rx(24) - rx(0), height: 26, class: 'f-bad-soft' }, R);
  s('rect', { x: rx(24), y: 34, width: rx(60) - rx(24), height: 26, class: 'f-ok-soft' }, R);
  s('text', { x: rx(12), y: 51, 'text-anchor': 'middle', class: 't-bad t-bold' }, R, 'aliasing');
  tx(R, { x: rx(42), y: 51, 'text-anchor': 'middle', class: 't-ok t-bold' }, ['f', ['s'], ' > 24 kHz, the tone is kept']);
  s('line', { x1: rx(0), x2: rx(60), y1: 60, y2: 60, class: 'l-axis' }, R);
  [0, 12, 24, 36, 48, 60].forEach(v => {
    s('line', { x1: rx(v), x2: rx(v), y1: 60, y2: 65, class: 'l-axis' }, R);
    s('text', { x: rx(v), y: 78, 'text-anchor': 'middle' }, R, v === 60 ? '60 kHz' : String(v));
  });
  s('line', { x1: rx(24), x2: rx(24), y1: 24, y2: 60, class: 's-fg' }, R);
  tx(R, { x: rx(24), y: 16, 'text-anchor': 'middle', class: 't-fg t-bold' }, ['2 × f', ['max'], ' = 24 kHz, the Nyquist sampling frequency']);
  const mark = s('g', {}, R);
  s('text', { x: 0, y: 102, class: 't-sm' }, R, 'options');
  [['a', 6], ['b', 12], ['c', 24], ['d', 48]].forEach(([k, v]) => {
    s('circle', { cx: rx(v), cy: 98, r: 9, class: k === 'c' ? 'f-ok' : 'f-surface box' }, R);
    s('text', { x: rx(v), y: 98, dy: '0.35em', 'text-anchor': 'middle', class: k === 'c' ? 't-on t-bold' : 't-fg' }, R, k);
  });

  slider(viz('slider'), { label: 'sampling rate', min: 4, max: 60, step: 1, value: 16, fmt: v => v + ' kHz' }, fs => {
    layer.textContent = '';
    const amb = fs === 2 * F;
    const k = amb ? 0 : Math.round(F / fs);
    const fa = F - k * fs;
    if (amb) plot(layer, ax, t => sig(-F, t), 0, 500, 1500, 's-bad dash');
    else plot(layer, ax, t => sig(fa, t), 0, 500, 1500, (k === 0 ? 's-ok' : 's-bad') + ' dash');
    for (let n = 0; n * 1000 / fs <= 500 + 1e-9; n++) {
      const t = n * 1000 / fs;
      s('circle', { cx: ax.x(t), cy: ax.y(sig(F, t)), r: 4.5, class: 'f-fg' }, layer);
    }
    mark.textContent = '';
    s('line', { x1: rx(fs), x2: rx(fs), y1: 30, y2: 62, class: 's-pri', style: 'stroke-width: 3' }, mark);
    s('circle', { cx: rx(fs), cy: 30, r: 4, class: 'f-pri' }, mark);

    role('fs').textContent = fs + ' kHz';
    role('per').textContent = fmt(fs / F, 2);
    const fav = role('fa');
    fav.textContent = amb ? 'ambiguous' : Math.abs(fa) + ' kHz';
    fav.className = 'v' + (k === 0 && !amb ? ' ok' : '');
    let v;
    if (amb) v = 'Exactly <b>24 kHz</b>, option c, the Nyquist sampling frequency itself. Two samples per cycle cannot tell the tone from its mirror image (dashed). Both pass through every dot, which is why f<sub>s</sub> must be <b>greater than</b> 24 kHz.';
    else if (k === 0) v = `<b>${fs} kHz</b> is more than 2 × 12 = 24 kHz, so the samples pin down the 12 kHz tone.` + (fs === 48 ? ' This is option d. It works, but it is 4 × f<sub>max</sub>, not the Nyquist sampling frequency.' : '');
    else if (fa === 0) v = `<b>${fs} kHz</b> is below 24 kHz. The samples land on the same point of every cycle they hit, so they rebuild a flat line (0 Hz). This is aliasing.` + (fs === 6 ? ' Option a.' : fs === 12 ? ' Option b.' : '');
    else v = `<b>${fs} kHz</b> is below 24 kHz. The samples fit a <b>${Math.abs(fa)} kHz</b> wave instead of the 12 kHz tone. This is aliasing.`;
    role('verdict').innerHTML = v;
  });
});

QV.register('s1-mc3', function (q) {
  const { s, svg, slider, fmt, scale } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);

  // Figure 1: voltage as the side of a square, power as its area
  const SQ = svg(viz('squares'), 600, 300, { label: 'Squares with sides 100, 10 and 1 drawn to scale: areas 10,000, 100 and 1', minWidth: 460 });
  const u = 2.4, x0 = 30, yb = 268;
  s('rect', { x: x0, y: yb - 100 * u, width: 100 * u, height: 100 * u, class: 'f-pri-soft outline-pri' }, SQ);
  s('rect', { x: x0, y: yb - 10 * u, width: 10 * u, height: 10 * u, class: 'f-pri' }, SQ);
  s('rect', { x: x0, y: yb - u, width: u, height: u, class: 'f-sec' }, SQ);
  s('circle', { cx: x0 + u / 2, cy: yb - u / 2, r: 6, class: 's-sec', style: 'stroke-width: 1.5' }, SQ);
  s('text', { x: x0 + 12, y: yb - 100 * u + 22, class: 't-pri t-bold' }, SQ, 'signal: side 100');
  s('text', { x: x0 + 12, y: yb - 100 * u + 38, class: 't-pri' }, SQ, 'power 100² = 10,000');
  s('text', { x: x0 + 10 * u + 8, y: yb - 10 * u + 12, class: 't-fg' }, SQ, 'slide 6: side 10, power 100');
  s('line', { x1: x0 + 4, y1: yb + 5, x2: x0 + 14, y2: yb + 14, class: 's-sec', style: 'stroke-width: 1' }, SQ);
  s('text', { x: x0 + 18, y: yb + 22, class: 't-sec' }, SQ, 'noise: side 1, power 1');
  [
    [84, ['Power ∝ V²'], 't-fg t-bold t-lg'],
    [108, ['voltage ratio 100'], 't-fg'],
    [126, ['power ratio 100² = 10,000'], 't-fg'],
    [162, ['SNR = 10 log', '10', '(10,000)'], 't-fg'],
    [180, ['= 10 × 4 = 40 dB'], 't-fg', 46],
    [212, ['same as 20 log', '10', '(100)'], 't-fg'],
    [230, ['= 20 × 2 = 40 dB'], 't-ok t-bold', 46],
  ].forEach(([y, parts, cls, dx]) => {
    const t = s('text', { x: 300 + (dx || 0), y, class: cls }, SQ);
    parts.forEach((p, i) => s('tspan', i === 1 ? { dy: 3, class: 't-sm' } : i === 2 ? { dy: -3 } : {}, t, p));
  });

  // Figure 2: three log scales lined up
  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const pow10 = n => '10' + String(n).split('').map(d => SUP[+d]).join('');
  const big = e => {
    if (Math.abs(e - Math.round(e)) < 1e-9 && e >= 4) return pow10(Math.round(e));
    const v = Number(Math.pow(10, e).toPrecision(3));
    return v >= 1000 ? Math.round(v).toLocaleString('en-US') : String(v);
  };
  const RU = svg(viz('ruler'), 760, 212, { label: 'Aligned scales for voltage ratio, power ratio and SNR in decibels, with the four options on the decibel scale', minWidth: 560 });
  const X = scale(0, 5, 140, 730);
  const ROWS = [
    { y: 40, name: 'voltage ratio', ticks: ['1', '10', '100', '1,000', pow10(4), pow10(5)] },
    { y: 100, name: 'power ratio', ticks: ['1', pow10(2), pow10(4), pow10(6), pow10(8), pow10(10)] },
    { y: 160, name: 'SNR (dB)', ticks: ['0', '20', '40', '60', '80', '100'] },
  ];
  ROWS.forEach(r => {
    s('text', { x: 0, y: r.y + 4, class: 't-fg t-bold' }, RU, r.name);
    s('line', { x1: X(0), x2: X(5), y1: r.y, y2: r.y, class: 'l-axis' }, RU);
    r.ticks.forEach((t, i) => {
      s('line', { x1: X(i), x2: X(i), y1: r.y, y2: r.y + 5, class: 'l-axis' }, RU);
      s('text', { x: X(i), y: r.y + 18, 'text-anchor': 'middle' }, RU, t);
    });
  });
  s('text', { x: 0, y: 200, class: 't-sm' }, RU, 'options');
  [['d', 2], ['b', 20], ['a', 40], ['c', 100]].forEach(([k, db]) => {
    s('circle', { cx: X(db / 20), cy: 196, r: 9, class: k === 'a' ? 'f-ok' : 'f-surface box' }, RU);
    s('text', { x: X(db / 20), y: 196, dy: '0.35em', 'text-anchor': 'middle', class: k === 'a' ? 't-on t-bold' : 't-fg' }, RU, k);
  });
  const mk = s('g', {}, RU);

  slider(viz('slider'), { label: 'voltage ratio', min: 0, max: 5, step: 0.1, value: 2, fmt: v => big(v) }, v => {
    const db = fmt(20 * v, 1);
    const vals = [big(v), big(2 * v), db + ' dB'];
    mk.textContent = '';
    const x = X(v), right = x < 620;
    s('line', { x1: x, x2: x, y1: 24, y2: 166, class: 's-pri', style: 'stroke-width: 2' }, mk);
    ROWS.forEach((r, i) => {
      s('circle', { cx: x, cy: r.y, r: 4.5, class: 'f-pri' }, mk);
      s('text', { x: right ? x + 8 : x - 8, y: r.y - 8, 'text-anchor': right ? 'start' : 'end', class: 't-pri t-bold halo' }, mk, vals[i]);
    });
    role('v').textContent = vals[0];
    role('p').textContent = vals[1];
    role('db').textContent = vals[2];
    let t = `20 log₁₀(${vals[0]}) = <b>${db} dB</b>, the same as 10 log₁₀(${vals[1]}).`;
    if (Math.abs(v - 2) < 1e-9) t += ' This is option a. On the same scale, option b (20 dB) belongs to a voltage ratio of 10, option d (2 dB) to about 1.26, and option c (100 dB) to 100,000.';
    else if (Math.abs(v - 1) < 1e-9) t += ' This is the slide-6 example, and the value option b gives by mistake for a ratio of 100.';
    role('verdict').innerHTML = t;
  });
});

QV.register('s1-mc4', function (q) {
  const { s, svg, box, steps, table } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);

  const edge = (g, A, B, bit, on, cls) => {
    s('line', { x1: A.x, y1: A.y, x2: B.x, y2: B.y, class: on ? cls : 's-muted', style: on ? 'stroke-width: 3' : 'stroke-width: 1.2' }, g);
    const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy);
    const nx = bit === '0' ? -dy / L : dy / L, ny = bit === '0' ? dx / L : -dx / L;
    s('text', { x: (A.x + B.x) / 2 + nx * 10, y: (A.y + B.y) / 2 + ny * 10, dy: '0.35em', 'text-anchor': 'middle', class: on ? 't-pri t-bold' : 't-muted' }, g, bit);
  };

  // Figure 1: slide-24 tree, decode 1001110110
  const N = {
    root: { x: 360, y: 106, t: '39' },
    n24: { x: 500, y: 164, t: '24' },
    n13: { x: 420, y: 222, t: '13' },
    n11: { x: 580, y: 222, t: '11' },
    A: { x: 220, y: 164, t: 'A 15', leaf: true },
    B: { x: 380, y: 280, t: 'B 7', leaf: true },
    C: { x: 460, y: 280, t: 'C 6', leaf: true },
    D: { x: 540, y: 280, t: 'D 6', leaf: true },
    E: { x: 620, y: 280, t: 'E 5', leaf: true },
  };
  const EDGES = [['root', 'A', '0'], ['root', 'n24', '1'], ['n24', 'n13', '0'], ['n24', 'n11', '1'], ['n13', 'B', '0'], ['n13', 'C', '1'], ['n11', 'D', '0'], ['n11', 'E', '1']];
  const CODE = { A: '0', B: '100', C: '101', D: '110', E: '111' };
  const MSG = ['B', 'E', 'A', 'D'];
  const BITS = MSG.map(m => CODE[m]).join('').split('');
  const SEG = [];
  MSG.reduce((at, m) => { SEG.push([at, at + CODE[m].length]); return at + CODE[m].length; }, 0);
  const pathOf = sym => {
    const ids = ['root'];
    CODE[sym].split('').forEach(b => ids.push(EDGES.find(e => e[0] === ids[ids.length - 1] && e[2] === b)[1]));
    return ids;
  };

  const TR = svg(viz('tree'), 720, 316, { label: 'Huffman tree for A 15, B 7, C 6, D 6, E 5 and the bitstream 1001110110 decoded as BEAD', minWidth: 560 });
  const layer = s('g', {}, TR);
  const CW = 28, CG = 2, BX = 360 - (BITS.length * (CW + CG) - CG) / 2, BY = 10;

  function draw(k) {
    layer.textContent = '';
    const cur = k ? MSG[k - 1] : null;
    const path = cur ? pathOf(cur) : [];
    s('text', { x: BX - 12, y: BY + CW / 2, dy: '0.35em', 'text-anchor': 'end', class: 't-fg t-bold' }, layer, 'bitstream');
    BITS.forEach((b, i) => {
      const j = SEG.findIndex(([a, z]) => i >= a && i < z);
      const st = k === 0 || j < k - 1 ? 'done' : j === k - 1 ? 'now' : 'todo';
      const x = BX + i * (CW + CG);
      s('rect', { x, y: BY, width: CW, height: CW, rx: 3, class: st === 'now' ? 'f-pri' : st === 'done' ? 'f-pri-soft' : 'f-seg' }, layer);
      s('text', { x: x + CW / 2, y: BY + CW / 2, dy: '0.35em', 'text-anchor': 'middle', class: st === 'now' ? 't-on t-bold' : st === 'done' ? 't-pri' : 't-fg' }, layer, b);
    });
    SEG.forEach(([a, z], j) => {
      if (k !== 0 && j > k - 1) return;
      const x1 = BX + a * (CW + CG) + 2, x2 = BX + z * (CW + CG) - CG - 2, y = BY + CW + 6;
      s('path', { d: `M${x1} ${y - 3} L${x1} ${y} L${x2} ${y} L${x2} ${y - 3}`, class: 's-pri', style: 'stroke-width: 1.5' }, layer);
      s('text', { x: (x1 + x2) / 2, y: y + 14, 'text-anchor': 'middle', class: 't-pri t-bold' }, layer, MSG[j]);
    });
    EDGES.forEach(([a, b, bit]) => edge(layer, N[a], N[b], bit, path.includes(a) && path.includes(b), 's-pri'));
    Object.entries(N).forEach(([id, n]) => {
      if (n.leaf) {
        const hit = id === cur;
        box(layer, n.x - 24, n.y - 13, 48, 26, n.t, { cls: hit ? 'f-pri' : 'f-surface', textCls: hit ? 't-on t-bold' : 't-fg', stroke: hit ? 'outline-pri' : 'box' });
        s('text', { x: n.x, y: n.y + 28, 'text-anchor': 'middle', class: 't-pri t-bold' }, layer, CODE[id]);
      } else {
        const on = path.includes(id);
        s('circle', { cx: n.x, cy: n.y, r: 15, class: on ? 'f-pri-soft outline-pri' : 'f-surface box' }, layer);
        s('text', { x: n.x, y: n.y, dy: '0.35em', 'text-anchor': 'middle', class: on ? 't-pri t-bold' : 't-fg' }, layer, n.t);
      }
    });
  }

  const note = role('note');
  steps(viz('steps'), ['All', '1 · B', '2 · E', '3 · A', '4 · D'], k => {
    draw(k);
    if (!k) {
      note.textContent = 'The stream splits as 100 | 111 | 0 | 110 = BEAD. The decoder needs no separators. It starts at the root, follows one branch per bit, and stops at the first leaf it reaches.';
    } else {
      const sym = MSG[k - 1], c = CODE[sym].split('');
      note.textContent = `Step ${k}: the bits ${c.join(' ')} go ${c.map(b => (b === '0' ? 'left' : 'right')).join(', ')} from the root and reach the leaf ${sym}. Output ${sym}, then start again at the root with the next bit.`;
    }
  });

  // Figure 2: same code lengths, with and without the prefix property
  const P = svg(viz('pair'), 720, 278, { label: 'Two codes with the same lengths: the Huffman code reads 010 one way, the second code reads it two ways', minWidth: 560 });
  const side = o => {
    s('text', { x: o.ox, y: 18, class: o.tcls + ' t-bold' }, P, o.title);
    o.edges.forEach(([a, b, bit]) => edge(P, o.nodes[a], o.nodes[b], bit, false));
    Object.entries(o.nodes).forEach(([id, n]) => {
      if (n.code) {
        const bad = id === o.bad;
        box(P, n.x - 16, n.y - 12, 32, 24, id, { cls: bad ? 'f-sec-soft' : 'f-surface', textCls: bad ? 't-sec t-bold' : 't-fg', stroke: bad ? 'outline-sec' : 'box' });
        if (n.left) s('text', { x: n.x - 22, y: n.y, dy: '0.35em', 'text-anchor': 'end', class: o.tcls + ' t-bold' }, P, n.code);
        else s('text', { x: n.x, y: n.y + 24, 'text-anchor': 'middle', class: o.tcls + ' t-bold' }, P, n.code);
      } else {
        s('circle', { cx: n.x, cy: n.y, r: 10, class: 'f-surface box' }, P);
      }
    });
    const cw = 26, bx0 = o.nodes.root.x - (3 * cw + 4) / 2;
    ['0', '1', '0'].forEach((b, i) => {
      s('rect', { x: bx0 + i * (cw + 2), y: 186, width: cw, height: cw, rx: 3, class: 'f-seg' }, P);
      s('text', { x: bx0 + i * (cw + 2) + cw / 2, y: 186 + cw / 2, dy: '0.35em', 'text-anchor': 'middle', class: 't-fg t-bold' }, P, b);
    });
    o.parses.forEach((segs, pi) => {
      const y = 222 + pi * 30;
      segs.forEach(([a, z, sym]) => {
        const x1 = bx0 + a * (cw + 2) + 2, x2 = bx0 + z * (cw + 2) - 4;
        s('path', { d: `M${x1} ${y - 4} L${x1} ${y} L${x2} ${y} L${x2} ${y - 4}`, class: o.scls, style: 'stroke-width: 1.5' }, P);
        s('text', { x: (x1 + x2) / 2, y: y + 13, 'text-anchor': 'middle', class: o.tcls + ' t-bold' }, P, sym);
      });
      s('text', { x: bx0 + 3 * (cw + 2) + 14, y: y + 6, class: o.tcls }, P, o.readings[pi]);
    });
  };
  side({
    ox: 10, title: 'Huffman: A = 0, B = 10, C = 11', tcls: 't-pri', scls: 's-pri',
    nodes: { root: { x: 170, y: 52 }, A: { x: 110, y: 102, code: '0' }, n1: { x: 230, y: 102 }, B: { x: 190, y: 150, code: '10' }, C: { x: 270, y: 150, code: '11' } },
    edges: [['root', 'A', '0'], ['root', 'n1', '1'], ['n1', 'B', '0'], ['n1', 'C', '1']],
    parses: [[[0, 1, 'A'], [1, 3, 'B']]], readings: ['one reading: A B'],
  });
  side({
    ox: 380, title: 'Second code: A = 0, B = 01, C = 10', tcls: 't-sec', scls: 's-sec', bad: 'A',
    nodes: { root: { x: 545, y: 52 }, A: { x: 485, y: 102, code: '0', left: true }, n1: { x: 605, y: 102 }, B: { x: 525, y: 150, code: '01' }, C: { x: 585, y: 150, code: '10' } },
    edges: [['root', 'A', '0'], ['A', 'B', '1'], ['root', 'n1', '1'], ['n1', 'C', '0']],
    parses: [[[0, 1, 'A'], [1, 3, 'C']], [[0, 2, 'B'], [2, 3, 'A']]], readings: ['reading 1: A C', 'reading 2: B A'],
  });
  s('text', { x: 463, y: 128, 'text-anchor': 'end', class: 't-sec t-sm' }, P, '0 starts 01');

  const L = t => ({ text: t, cls: 'l' });
  const tb = table(viz('checks'), ['Property', 'Huffman: 0, 10, 11', 'Second: 0, 01, 10'].map(L), [
    ['a · two least frequent have the same length', 'yes, B and C: 2 bits', 'yes, B and C: 2 bits'],
    ['b · average length < entropy + 1', 'yes, 1.5 < 2.5', 'yes, 1.5 < 2.5'],
    ['c · more frequent symbols get shorter codes', 'yes, A: 1 bit', 'yes, A: 1 bit'],
    ['d · no codeword is a prefix of another', 'yes', 'no, 0 starts 01'],
    ['010 decodes as', 'A B', 'A C or B A'],
  ].map(r => r.map(L)));
  tb.rows[3].classList.add('on');
  tb.rows[4].classList.add('on');
});
QV.register('s1-mc5', function (q) {
  const { s, svg, axes, line, steps, slider, table } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const H2 = p => (p <= 0 || p >= 1) ? 0 : -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));

  // Figure 1: bits per symbol against p(A), plus a 20-symbol tape
  const curve = svg(viz('curve'), 640, 270, { label: 'Bits per symbol against p(A): Huffman is flat at 1 bit, entropy falls toward 0', minWidth: 520 });
  const ax = axes(curve, { x: 52, y: 22, w: 568, h: 202, xd: [0.5, 1], yd: [0, 1.1], xt: [0.5, 0.6, 0.7, 0.8, 0.9, 1], yt: [0, 0.25, 0.5, 0.75, 1], xf: v => v.toFixed(1), yf: v => v.toFixed(2), xl: 'p(A), probability of the likely symbol', yl: 'bits per symbol' });
  const pts = [];
  for (let p = 0.5; p < 1; p += 0.0025) pts.push([p, H2(p)]);
  pts.push([1, 0]);
  const back = pts.slice().reverse().map(([p, b]) => 'L' + ax.x(p).toFixed(1) + ' ' + ax.y(b).toFixed(1)).join(' ');
  s('path', { d: `M${ax.x(0.5)} ${ax.y(1)} L${ax.x(1)} ${ax.y(1)} ${back} Z`, class: 'area-sec' }, curve);
  line(curve, [[ax.x(0.5), ax.y(1)], [ax.x(1), ax.y(1)]], 's-sec');
  line(curve, pts.map(([p, b]) => [ax.x(p), ax.y(b)]), 's-pri');
  s('text', { x: ax.x(0.5) + 4, y: ax.y(1) - 8, class: 't-sec t-bold' }, curve, 'Huffman: 1 bit per symbol');
  s('text', { x: ax.x(0.8), y: ax.y(0.87), dy: '0.35em', 'text-anchor': 'middle', class: 't-sec halo' }, curve, 'wasted bits');
  s('text', { x: ax.x(0.53), y: ax.y(0.52), class: 't-pri t-bold' }, curve, 'Entropy H(p)');
  s('text', { x: ax.x(0.53), y: ax.y(0.52) + 15, class: 't-pri' }, curve, 'what arithmetic coding approaches');
  const marker = s('g', {}, curve);
  const mLine = s('line', { y1: ax.y(0), y2: ax.y(1.1), class: 's-fg dash', style: 'opacity: 0.45' }, marker);
  const mGap = s('line', { class: 's-sec', style: 'stroke-width: 3' }, marker);
  const mHuff = s('circle', { r: 5, class: 'f-sec' }, marker);
  const mArith = s('circle', { r: 5, class: 'f-pri' }, marker);

  const tape = svg(viz('tape'), 720, 112, { label: 'Bit tape for a 20-symbol message, Huffman against arithmetic coding', minWidth: 560 });
  const T = { lab: 100, px: 26, rowH: 28, y1: 8, y2: 48, axis: 88, n: 20 };
  const tapeLayer = s('g', {}, tape);
  s('text', { x: 0, y: T.y1 + T.rowH / 2, dy: '0.35em', class: 't-sec t-bold' }, tape, 'Huffman');
  s('text', { x: 0, y: T.y2 + T.rowH / 2, dy: '0.35em', class: 't-pri t-bold' }, tape, 'Arithmetic');
  s('line', { x1: T.lab, x2: T.lab + T.n * T.px, y1: T.axis, y2: T.axis, class: 'l-axis' }, tape);
  [0, 5, 10, 15, 20].forEach(b => {
    s('line', { x1: T.lab + b * T.px, x2: T.lab + b * T.px, y1: T.axis, y2: T.axis + 5, class: 'l-axis' }, tape);
    s('text', { x: T.lab + b * T.px, y: T.axis + 18, 'text-anchor': 'middle' }, tape, b + (b === 20 ? ' bits' : ''));
  });

  function drawTape(p) {
    tapeLayer.textContent = '';
    const k = Math.max(1, Math.round(T.n * (1 - p)));
    const msg = [];
    for (let i = 0; i < T.n; i++) msg.push(Math.floor((i + 1) * k / T.n) > Math.floor(i * k / T.n) ? 'B' : 'A');
    msg.forEach((sym, i) => {
      const x = T.lab + i * T.px;
      s('rect', { x: x + 1, y: T.y1, width: T.px - 2, height: T.rowH, rx: 2, class: sym === 'A' ? 'f-sec-soft' : 'f-sec' }, tapeLayer);
      s('text', { x: x + T.px / 2, y: T.y1 + T.rowH / 2, dy: '0.35em', 'text-anchor': 'middle', class: sym === 'A' ? 't-sec' : 't-on' }, tapeLayer, sym);
    });
    s('text', { x: T.lab + T.n * T.px + 8, y: T.y1 + T.rowH / 2, dy: '0.35em', class: 't-sec t-bold' }, tapeLayer, T.n + ' bits');
    let x = T.lab, total = 0;
    msg.forEach(sym => {
      const bits = -Math.log2(sym === 'A' ? p : 1 - p);
      const w = bits * T.px;
      s('rect', { x, y: T.y2, width: w, height: T.rowH, class: (sym === 'A' ? 'f-pri-soft' : 'f-pri') + ' sep' }, tapeLayer);
      if (w >= 12) s('text', { x: x + w / 2, y: T.y2 + T.rowH / 2, dy: '0.35em', 'text-anchor': 'middle', class: sym === 'A' ? 't-pri' : 't-on' }, tapeLayer, sym);
      x += w; total += bits;
    });
    s('text', { x: x + 8, y: T.y2 + T.rowH / 2, dy: '0.35em', class: 't-pri t-bold' }, tapeLayer, '≈ ' + total.toFixed(1) + ' bits');
    role('tape-msg').textContent = 'Message: ' + msg.join('') + ' · Huffman ' + T.n + ' bits · arithmetic ≈ ' + total.toFixed(1) + ' bits, rounded up once for the whole message';
  }

  slider(viz('slider'), { label: 'p(A)', min: 0.5, max: 0.99, step: 0.01, value: 0.9, fmt: v => v.toFixed(2) }, p => {
    const hh = H2(p);
    role('info').textContent = (-Math.log2(p)).toFixed(3);
    role('h').textContent = hh.toFixed(3);
    role('verdict').innerHTML = p === 0.5
      ? 'At p = 0.5 both symbols carry exactly 1 bit, so Huffman is already optimal. Huffman only matches the entropy when every probability is a power of ½.'
      : 'Huffman spends <b>' + (1 / hh).toFixed(2) + '×</b> the bits this source needs. The gap is <b>' + (1 - hh).toFixed(3) + '</b> bits on every symbol.';
    [mLine, mGap].forEach(l => { l.setAttribute('x1', ax.x(p)); l.setAttribute('x2', ax.x(p)); });
    mGap.setAttribute('y1', ax.y(1)); mGap.setAttribute('y2', ax.y(hh));
    mHuff.setAttribute('cx', ax.x(p)); mHuff.setAttribute('cy', ax.y(1));
    mArith.setAttribute('cx', ax.x(p)); mArith.setAttribute('cy', ax.y(hh));
    drawTape(p);
  });

  // Figure 3: interval ladder for CAEE$ (slide 5 table, Fig. 7.8)
  const SYMS = [['A', 0.2], ['B', 0.1], ['C', 0.2], ['D', 0.05], ['E', 0.3], ['F', 0.05], ['$', 0.1]];
  const RANGE = {};
  let acc = 0;
  SYMS.forEach(([sym, p]) => { RANGE[sym] = [acc, acc + p]; acc += p; });
  const MSG = ['C', 'A', 'E', 'E', '$'];
  const LOWS = ['0', '0.3', '0.3', '0.322', '0.3286', '0.33184'];
  const HIGHS = ['1', '0.5', '0.34', '0.334', '0.3322', '0.3322'];
  const RANGES = ['1', '0.2', '0.04', '0.012', '0.0036', '0.00036'];
  const PROB = { A: '0.2', C: '0.2', E: '0.3', $: '0.1' };

  const ladder = svg(viz('ladder'), 850, 362, { label: 'Interval ladder for encoding CAEE$: each column zooms into the chosen symbol slice', minWidth: 680 });
  const L = { top: 52, bot: 322, x0: 64, dx: 124, cw: 38 };
  const ys = f => L.bot - f * (L.bot - L.top);
  const cols = [], fans = [];
  for (let i = 0; i < 6; i++) {
    const x = L.x0 + i * L.dx;
    if (i < 5) {
      const [r0, r1] = RANGE[MSG[i]];
      const fg = s('g', { class: 'fade' }, ladder);
      s('polygon', { points: `${x + L.cw},${ys(r1)} ${x + L.cw},${ys(r0)} ${x + L.dx},${L.bot} ${x + L.dx},${L.top}`, class: 'area-pri' }, fg);
      s('line', { x1: x + L.cw, y1: ys(r1), x2: x + L.dx, y2: L.top, class: 's-pri dash', style: 'stroke-width: 1; opacity: 0.6' }, fg);
      s('line', { x1: x + L.cw, y1: ys(r0), x2: x + L.dx, y2: L.bot, class: 's-pri dash', style: 'stroke-width: 1; opacity: 0.6' }, fg);
      fans.push(fg);
    }
    const g = s('g', { class: 'fade' }, ladder);
    cols.push(g);
    s('text', { x: x + L.cw / 2, y: 16, 'text-anchor': 'middle', class: 't-fg t-bold' }, g, i === 0 ? 'start' : 'after ' + MSG[i - 1]);
    s('text', { x: x + L.cw / 2, y: L.top - 10, 'text-anchor': 'middle' }, g, HIGHS[i]);
    s('text', { x: x + L.cw / 2, y: L.bot + 17, 'text-anchor': 'middle' }, g, LOWS[i]);
    if (i < 5) {
      SYMS.forEach(([sym]) => {
        const [r0, r1] = RANGE[sym];
        const on = sym === MSG[i];
        s('rect', { x, y: ys(r1), width: L.cw, height: ys(r0) - ys(r1), class: (on ? 'f-pri' : 'f-seg') + ' sep' }, g);
        s('text', { x: x + L.cw / 2, y: (ys(r0) + ys(r1)) / 2, dy: '0.35em', 'text-anchor': 'middle', class: (on ? 't-on t-bold' : 't-fg') + ' t-sm' }, g, sym);
      });
      s('text', { x: x + L.cw / 2, y: L.bot + 35, 'text-anchor': 'middle', class: 't-pri t-bold' }, g, 'next: ' + MSG[i]);
    } else {
      s('rect', { x, y: L.top, width: L.cw, height: L.bot - L.top, class: 'f-pri-soft outline-pri' }, g);
      const f = (0.33203125 - 0.33184) / 0.00036;
      s('line', { x1: x - 4, x2: x + L.cw + 10, y1: ys(f), y2: ys(f), class: 's-fg', style: 'stroke-width: 2' }, g);
      s('text', { x: x + L.cw + 14, y: ys(f) - 5, class: 't-fg t-bold' }, g, 'code 0.33203125');
      s('text', { x: x + L.cw + 14, y: ys(f) + 11, class: 't-fg' }, g, '= 0.01010101₂');
      s('text', { x: x + L.cw / 2, y: L.bot + 35, 'text-anchor': 'middle', class: 't-pri t-bold' }, g, 'width 0.00036');
    }
  }

  const tbl = table(viz('ladder-table'), ['Step', 'Symbol', 'Slice', 'low', 'high', 'range'].map((t, i) => ({ text: t, cls: i < 3 ? 'l' : '' })), [
    ['0', 'start', '', '0', '1', '1'],
    ['1', 'C', '[0.3, 0.5)', '0.3', '0.5', '0.2'],
    ['2', 'A', '[0, 0.2)', '0.3', '0.34', '0.04'],
    ['3', 'E', '[0.55, 0.85)', '0.322', '0.334', '0.012'],
    ['4', 'E', '[0.55, 0.85)', '0.3286', '0.3322', '0.0036'],
    ['5', '$', '[0.9, 1.0)', { text: '0.33184', cls: 'hl' }, { text: '0.3322', cls: 'hl' }, { text: '0.00036', cls: 'hl' }],
  ].map(r => r.map((c, i) => (i < 3 ? { text: c, cls: 'l' } : c))));

  const note = role('step-note');
  steps(viz('ladder-steps'), ['All', '1 · C', '2 · A', '3 · E', '4 · E', '5 · $'], k => {
    cols.forEach((g, i) => g.classList.toggle('dim', k > 0 && i !== k - 1 && i !== k));
    fans.forEach((g, i) => g.classList.toggle('dim', k > 0 && i !== k - 1));
    tbl.rows.forEach((r, i) => r.classList.toggle('on', k > 0 && i === k));
    if (k === 0) {
      note.textContent = 'All five steps. Each step keeps only the chosen slice, so the interval shrinks by that symbol\'s probability. Pick a step to follow it.';
    } else {
      const sym = MSG[k - 1];
      note.textContent = `Step ${k}, ${sym}: inside [${LOWS[k - 1]}, ${HIGHS[k - 1]}) take ${sym}'s slice, giving [${LOWS[k]}, ${HIGHS[k]}). Width ${RANGES[k - 1]} × ${PROB[sym]} = ${RANGES[k]}.`;
    }
  });

  // Figure 2: the same encoding as one zoom per step, after a decimal-digit warm-up
  const num = v => String(+v.toPrecision(10));
  const ZOOM = [{ syms: '0123456789'.split('').map(d => [d, 0.1]), lo: 0, hi: 1, pick: 3, label: 'digits', tokens: ['3', '7'], cur: 0, tail: '→ 0.37…' }];
  let zlo = 0, zhi = 1;
  MSG.forEach((sym, i) => {
    ZOOM.push({ syms: SYMS, lo: zlo, hi: zhi, pick: SYMS.findIndex(([t]) => t === sym), label: 'message', tokens: MSG, cur: i });
    const r = zhi - zlo;
    [zlo, zhi] = [zlo + r * RANGE[sym][0], zlo + r * RANGE[sym][1]];
  });
  // Procedure 7.2 (slide 8): try a 1 in each bit, drop it if the value passes high
  const trace = [];
  let zcode = 0, zbits = '';
  for (let k = 1; zcode < zlo; k++) {
    const t = zcode + 2 ** -k, keep = t <= zhi;
    trace.push({ k, tried: zbits + '1', t, keep });
    if (keep) zcode = t;
    zbits += keep ? '1' : '0';
  }
  const lo7 = Math.floor(zlo * 128) / 128, hi7 = lo7 + 1 / 128;
  const bin = (v, n) => '0.' + Math.round(v * 2 ** n).toString(2).padStart(n, '0');

  const Z = { x0: 70, x1: 740, top: 62, bh: 38, bot: 182 };
  const zoom = svg(viz('zoom'), 760, 248, { label: 'Arithmetic encoding of CAEE$ one step at a time: the current interval cut into symbol slices, and the chosen slice stretched into the next interval', minWidth: 580 });
  const zg = s('g', {}, zoom);
  const zx = f => Z.x0 + Math.min(f, 1) * (Z.x1 - Z.x0);
  const zt = (x, y, text, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor, class: cls }, zg, text);

  function strip(st) {
    zt(0, 13, st.label, 't-fg t-bold');
    st.tokens.forEach((t, i) => {
      const [f, c] = i < st.cur ? ['f-pri-soft', 't-pri'] : i === st.cur ? ['f-pri', 't-on t-bold'] : ['f-seg', 't-muted'];
      s('rect', { x: Z.x0 + i * 30, y: 2, width: 26, height: 22, rx: 3, class: f }, zg);
      zt(Z.x0 + i * 30 + 13, 13, t, c, 'middle');
    });
    if (st.tail) zt(Z.x0 + st.tokens.length * 30 + 6, 13, st.tail, 't-fg');
  }

  function drawSlices(st) {
    const { syms, lo, hi, pick } = st, r = hi - lo, cum = [0];
    syms.forEach(([, p]) => cum.push(cum[cum.length - 1] + p));
    const c0 = cum[pick], c1 = cum[pick + 1], p = syms[pick][1], nlo = lo + r * c0, nhi = lo + r * c1, yb = Z.top + Z.bh;
    zt(0, Z.top + Z.bh / 2, 'current', 't-fg t-bold');
    syms.forEach(([t], i) => {
      const x = zx(cum[i]), w = zx(cum[i + 1]) - x, on = i === pick;
      s('rect', { x, y: Z.top, width: w, height: Z.bh, class: (on ? 'f-pri' : 'f-seg') + ' sep' }, zg);
      zt(x + w / 2, Z.top + Z.bh / 2, t, on ? 't-on t-bold' : 't-fg', 'middle');
    });
    // two label rows so neighbouring cut points (0.5 / 0.55, 0.85 / 0.9) don't collide
    cum.forEach((c, i) => {
      const on = i === pick || i === pick + 1, y = i % 2 ? 36 : 50;
      s('line', { x1: zx(c), x2: zx(c), y1: y + 7, y2: Z.top, class: on ? 's-pri' : 's-line', style: on ? 'stroke-width: 1.5' : null }, zg);
      zt(zx(c), y, num(lo + r * c), on ? 't-pri t-bold' : null, i === 0 ? 'start' : i === cum.length - 1 ? 'end' : 'middle');
    });
    s('polygon', { points: `${zx(c0)},${yb} ${zx(c1)},${yb} ${Z.x1},${Z.bot} ${Z.x0},${Z.bot}`, class: 'area-pri' }, zg);
    [[zx(c0), Z.x0], [zx(c1), Z.x1]].forEach(([a, b]) => s('line', { x1: a, y1: yb, x2: b, y2: Z.bot, class: 's-pri dash', style: 'stroke-width: 1' }, zg));
    zt(((zx(c0) + zx(c1)) / 2 + (Z.x0 + Z.x1) / 2) / 2, (yb + Z.bot) / 2, `stretch × ${num(+(1 / p).toFixed(2))} = 1 / ${num(p)}`, 't-pri t-bold halo', 'middle');
    zt(0, Z.bot + Z.bh / 2, 'next', 't-fg t-bold');
    s('rect', { x: Z.x0, y: Z.bot, width: Z.x1 - Z.x0, height: Z.bh, class: 'f-pri-soft outline-pri' }, zg);
    zt((Z.x0 + Z.x1) / 2, Z.bot + Z.bh / 2, `[${num(nlo)}, ${num(nhi)}) · width ${num(nhi - nlo)}`, 't-pri t-bold', 'middle');
    zt(Z.x0, Z.bot + Z.bh + 14, 'low′ = ' + num(nlo), 't-pri');
    zt(Z.x1, Z.bot + Z.bh + 14, 'high′ = ' + num(nhi), 't-pri', 'end');
    return { r, c0, c1, p, nlo, nhi };
  }

  function drawCode() {
    const d0 = 0.327, d1 = 0.337, yb = Z.top + Z.bh;
    const cx = v => Z.x0 + (v - d0) / (d1 - d0) * (Z.x1 - Z.x0);
    zt(0, Z.top + Z.bh / 2, 'final', 't-fg t-bold');
    s('rect', { x: Z.x0, y: Z.top, width: Z.x1 - Z.x0, height: Z.bh, class: 'f-seg' }, zg);
    s('rect', { x: cx(zlo), y: Z.top, width: cx(zhi) - cx(zlo), height: Z.bh, class: 'f-pri' }, zg);
    zt(Z.x0, 50, String(d0), null, 'start');
    zt(Z.x1, 50, String(d1), null, 'end');
    zt(cx(zlo) - 4, 50, 'low ' + num(zlo), 't-pri t-bold', 'end');
    zt(cx(zhi) + 4, 50, 'high ' + num(zhi), 't-pri t-bold');
    [[lo7, 7, 'bad', 'below low'], [zcode, zbits.length, 'ok', 'inside'], [hi7, 7, 'bad', 'above high']].forEach(([v, n, c, where]) => {
      s('line', { x1: cx(v), x2: cx(v), y1: Z.top - 4, y2: yb + 6, class: 's-' + c }, zg);
      zt(cx(v), yb + 18, num(v), 't-' + c + ' t-bold', 'middle');
      zt(cx(v), yb + 32, bin(v, n) + '₂ · ' + where, 't-' + c, 'middle');
    });
    zt(0, Z.bot + Z.bh / 2, 'code', 't-fg t-bold');
    zbits.split('').forEach((b, i) => {
      s('rect', { x: Z.x0 + i * 30, y: Z.bot + 4, width: 26, height: 30, rx: 3, class: b === '1' ? 'f-ok' : 'f-seg' }, zg);
      zt(Z.x0 + i * 30 + 13, Z.bot + Z.bh / 2, b, b === '1' ? 't-on t-bold' : 't-fg', 'middle');
    });
    zt(Z.x0 + zbits.length * 30 + 8, Z.bot + Z.bh / 2, `= ${num(zcode)}, the whole message in ${zbits.length} bits`, 't-fg t-bold');
  }

  // Algorithm 7.6 (slides 9-10): find the slice holding the value, output it, stretch the slice back to [0, 1)
  const dec = [];
  for (let v = zcode, n = 0; n < 10; n++) {
    const i = SYMS.findIndex(([t]) => v >= RANGE[t][0] && v < RANGE[t][1]);
    const [sym, p] = SYMS[i], [a, b] = RANGE[sym];
    const next = sym === '$' ? null : +num((v - a) / p);
    dec.push({ v, i, sym, p, a, b, next });
    if (next === null) break;
    v = next;
  }

  function drawDecode() {
    const D = { x0: 130, x1: 560, y0: 60, rh: 26, gap: 56 };
    const dx = f => D.x0 + Math.min(f, 1) * (D.x1 - D.x0);
    strip({ label: 'decoded', tokens: dec.map(d => d.sym), cur: dec.length, tail: 'from ' + bin(zcode, zbits.length) + '₂ = ' + num(zcode) });
    zt(118, 38, 'value', 't-fg t-bold', 'end');
    zt(D.x0, 38, 'the slide-5 table on [0, 1)', 't-fg t-bold');
    zt(576, 38, 'output', 't-fg t-bold');
    dec.forEach((d, r) => {
      const y = D.y0 + r * D.gap, vx = dx(d.v);
      let cum = 0;
      SYMS.forEach(([t, p], i) => {
        const x = dx(cum), w = dx(cum + p) - x, on = i === d.i;
        // keep the chosen letter clear of the value mark
        const lx = !on || Math.abs(x + w / 2 - vx) > 10 ? x + w / 2 : (vx - x > x + w - vx ? (x + vx) / 2 : (vx + x + w) / 2);
        s('rect', { x, y, width: w, height: D.rh, class: (on ? 'f-pri' : 'f-seg') + ' sep' }, zg);
        zt(lx, y + D.rh / 2, t, on ? 't-on t-bold' : 't-fg', 'middle');
        cum += p;
      });
      zt(118, y + D.rh / 2, num(d.v), 't-ok t-bold', 'end');
      s('polygon', { points: `${vx - 5},${y - 9} ${vx + 5},${y - 9} ${vx},${y - 2}`, class: 'f-ok' }, zg);
      s('line', { x1: vx, x2: vx, y1: y - 2, y2: y + D.rh, class: 's-ok', style: 'stroke-width: 2' }, zg);
      zt(576, y + D.rh / 2, '→ ' + d.sym, 't-pri t-bold t-lg');
      zt(612, y + D.rh / 2, d.next === null ? 'terminator, stop' : `in [${num(d.a)}, ${num(d.b)})`);
      if (d.next === null) return;
      const yb = y + D.rh, yn = y + D.gap;
      s('polygon', { points: `${dx(d.a)},${yb} ${dx(d.b)},${yb} ${D.x1},${yn} ${D.x0},${yn}`, class: 'area-pri' }, zg);
      [[dx(d.a), D.x0], [dx(d.b), D.x1]].forEach(([a, b]) => s('line', { x1: a, y1: yb, x2: b, y2: yn, class: 's-pri dash', style: 'stroke-width: 1' }, zg));
      s('line', { x1: vx, y1: yb, x2: dx(d.next), y2: yn - 9, class: 's-ok dash', style: 'stroke-width: 1.5' }, zg);
      zt(576, (yb + yn) / 2, `stretch × ${num(+(1 / d.p).toFixed(2))}`, 't-pri t-sm');
    });
  }

  const zcalc = role('zoom-calc'), znote = role('zoom-note'), zkey = role('zoom-key'), keyText = zkey.textContent;
  const row = (a, b, c) => a.padEnd(28) + '= ' + b.padEnd(24) + '= ' + c;
  const pct = v => num(v * 100) + '%';
  steps(viz('zoom-steps'), ['Idea', '1 · C', '2 · A', '3 · E', '4 · E', '5 · $', 'Code', 'Decode'], k => {
    const CODE = ZOOM.length, DECODE = ZOOM.length + 1;
    zg.textContent = '';
    zoom.setAttribute('viewBox', `0 0 760 ${k === DECODE ? 318 : 248}`);
    role('zoom-stats').hidden = k === DECODE;
    zkey.textContent = k === CODE
      ? 'Top bar: a close-up of the number line from 0.327 to 0.337, with the final interval in blue. Each bit halves the candidates, so 7 bits can only land on multiples of 1/128, and 8 bits on multiples of 1/256. Bottom row: the 8 bits that are sent.'
      : k === DECODE
        ? 'Each row is the slide-5 table on [0, 1). The green mark is the current value and the blue slice is the symbol it falls in. The shaded band stretches that slice back to [0, 1) for the next row, which moves the mark. This is Algorithm 7.6 (slides 9-10).'
        : keyText;
    if (k === DECODE) {
      drawDecode();
      znote.textContent = `Decoding runs the zoom backwards. The decoder knows the table and receives ${num(zcode)}. It finds the slice that holds the value and outputs that symbol: ${num(zcode)} is in C's slice [0.3, 0.5). Then it stretches that slice back to [0, 1), value′ = (value − low) / p, and repeats. It stops at $, the terminator. Without one it would need to be told the message length.`;
      zcalc.textContent = ['value'.padEnd(13) + 'slice'.padEnd(15) + 'output  ' + 'next value = (value − low) / p'].concat(dec.map(d =>
        num(d.v).padEnd(13) + `[${num(d.a)}, ${num(d.b)})`.padEnd(15) + d.sym.padEnd(8) + (d.next === null ? 'terminator, stop' : `(${num(d.v)} − ${num(d.a)}) / ${num(d.p)}`.padEnd(27) + '= ' + num(d.next)))).join('\n');
      return;
    }
    if (k === CODE) {
      strip({ label: 'message', tokens: MSG, cur: MSG.length, tail: '→ ' + zbits });
      drawCode();
      role('zoom-w').textContent = num(zhi - zlo);
      role('zoom-b').textContent = Math.log2(1 / (zhi - zlo)).toFixed(2);
      znote.textContent = `Send one number from [${num(zlo)}, ${num(zhi)}). Procedure 7.2 (slide 8) finds the shortest binary fraction inside it. The nearest 7-bit fractions, ${num(lo7)} and ${num(hi7)}, both miss. With 8 bits, ${num(zcode)} lands inside, so CAEE$ is sent as ${zbits}: ${zbits.length} bits for 5 symbols.`;
      zcalc.textContent = ['k'.padEnd(4) + 'try bit k = 1'.padEnd(17) + 'value'.padEnd(14) + 'vs high ' + num(zhi)].concat(trace.map(({ k, tried, t, keep }) =>
        String(k).padEnd(4) + ('0.' + tried).padEnd(17) + num(t).padEnd(14) + (keep ? 'ok, keep 1' : 'above high, bit 0') + (k === trace.length ? `, now ≥ low ${num(zlo)}: stop` : ''))).join('\n');
      return;
    }
    const st = ZOOM[k];
    strip(st);
    const { r, c0, c1, p, nlo, nhi } = drawSlices(st);
    const sym = st.syms[st.pick][0];
    role('zoom-w').textContent = num(nhi - nlo);
    role('zoom-b').textContent = Math.log2(1 / (nhi - nlo)).toFixed(2);
    znote.textContent = k === 0
      ? 'The idea, with decimal digits. Cut [0, 1) into ten equal slices. The digit 3 keeps [0.3, 0.4), and that slice is stretched to full width so the next digit, 7, can cut it into tenths again and keep [0.37, 0.38). The number 0.37… lies inside every interval on the way.'
      : `Step ${k}, ${sym}. In the table ${sym} owns [${num(c0)}, ${num(c1)}), the part from ${pct(c0)} to ${pct(c1)} of the way along. Cut [${num(st.lo)}, ${num(st.hi)}) at the same places and keep that part, [${num(nlo)}, ${num(nhi)}). The width is multiplied by p(${sym}) = ${num(p)}, which adds −log₂ ${num(p)} = ${(-Math.log2(p)).toFixed(2)} bits.` + (sym === '$' ? ' $ is the terminator, so the message is complete.' : '');
    zcalc.textContent = [
      k === 0 ? `digit 3: slice [${num(c0)}, ${num(c1)}), every digit has p = 0.1` : `${sym}: slice [${num(c0)}, ${num(c1)}) in the table, p(${sym}) = ${num(p)}`,
      row('range = high − low', `${num(st.hi)} − ${num(st.lo)}`, num(r)),
      row(`low′  = low + range × ${num(c0)}`, `${num(st.lo)} + ${num(r)} × ${num(c0)}`, num(nlo)),
      row(`high′ = low + range × ${num(c1)}`, `${num(st.lo)} + ${num(r)} × ${num(c1)}`, num(nhi)),
    ].join('\n');
  }, 0);

  // Figure 4: bit ledger for CAEE$
  const ledger = svg(viz('ledger'), 700, 160, { label: 'Bits for CAEE$: Huffman 12 bits in whole-bit blocks, information content 11.44 bits, arithmetic codeword 8 bits', minWidth: 560 });
  const G = { lab: 110, px: 40, rowH: 30, rows: [10, 52, 94], axis: 134, max: 13 };
  for (let b = 0; b <= G.max; b++) {
    s('line', { x1: G.lab + b * G.px, x2: G.lab + b * G.px, y1: 4, y2: G.axis, class: 'l-grid' }, ledger);
    if (b % 2 === 0) s('text', { x: G.lab + b * G.px, y: G.axis + 16, 'text-anchor': 'middle' }, ledger, b + (b === 12 ? ' bits' : ''));
  }
  s('line', { x1: G.lab, x2: G.lab + G.max * G.px, y1: G.axis, y2: G.axis, class: 'l-axis' }, ledger);
  [
    { name: 'Huffman', cls: 't-sec', fill: 'f-sec', text: 't-on', total: '12 bits',
      parts: [['C', 2], ['A', 3], ['E', 2], ['E', 2], ['$', 3]].map(([sym, b]) => [sym + ' · ' + b, b]) },
    { name: '−log₂ p', cls: 't-fg', fill: 'f-seg', text: 't-fg', total: '11.44 bits',
      parts: [['C', 0.2], ['A', 0.2], ['E', 0.3], ['E', 0.3], ['$', 0.1]].map(([sym, p]) => [sym + ' ' + (-Math.log2(p)).toFixed(2), -Math.log2(p)]) },
    { name: 'Arithmetic', cls: 't-pri', fill: 'f-pri', text: 't-on', total: '8 bits', parts: [['01010101', 8]] },
  ].forEach((row, ri) => {
    const y = G.rows[ri];
    s('text', { x: 0, y: y + G.rowH / 2, dy: '0.35em', class: row.cls + ' t-bold' }, ledger, row.name);
    let x = G.lab;
    row.parts.forEach(([label, bits]) => {
      const w = bits * G.px;
      s('rect', { x, y, width: w, height: G.rowH, class: row.fill + ' sep' }, ledger);
      s('text', { x: x + w / 2, y: y + G.rowH / 2, dy: '0.35em', 'text-anchor': 'middle', class: row.text }, ledger, label);
      x += w;
    });
    s('text', { x: x + 8, y: y + G.rowH / 2, dy: '0.35em', class: row.cls + ' t-bold' }, ledger, row.total);
  });
});

QV.register('s1-mc6', function (q) {
  const { s, svg, line, steps, gray } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const cone = (g, x, y, h) => s('path', { d: `M${x - 4.5} ${y} L${x + 4.5} ${y} L${x + 1.5} ${y - h} Q${x} ${y - h - 6} ${x - 1.5} ${y - h} Z`, class: 'f-pri' }, g);
  const rod = (g, x, y, h) => s('rect', { x: x - 2, y: y - h, width: 4, height: h, rx: 2, class: 'f-sec' }, g);

  // Figure 1: eye cross-section and a strip of retina around the fovea
  const E = svg(viz('eye'), 760, 228, { label: 'Eye cross-section with light focused on the fovea, and a strip of retina: cones packed in the fovea, rods around it', minWidth: 560 });
  const O = { cx: 150, cy: 118, r: 92 };
  const at = deg => [O.cx + O.r * Math.cos(deg * Math.PI / 180), O.cy - O.r * Math.sin(deg * Math.PI / 180)];
  s('circle', { cx: O.cx, cy: O.cy, r: O.r, class: 'f-seg box' }, E);
  const [c1x, c1y] = at(148), [c2x, c2y] = at(212);
  s('path', { d: `M${c1x} ${c1y} A60 60 0 0 0 ${c2x} ${c2y}`, class: 'f-surface box' }, E);
  s('ellipse', { cx: 90, cy: O.cy, rx: 10, ry: 28, class: 'f-surface box' }, E);
  const [r1x, r1y] = at(58), [r2x, r2y] = at(-58);
  s('path', { d: `M${r1x} ${r1y} A${O.r} ${O.r} 0 0 1 ${r2x} ${r2y}`, class: 's-muted', style: 'stroke-width: 5' }, E);
  const fov = at(0);
  line(E, [[4, O.cy - 30], [90, O.cy - 14], fov], 's-ter');
  line(E, [[4, O.cy + 30], [90, O.cy + 14], fov], 's-ter');
  s('circle', { cx: fov[0], cy: fov[1], r: 5, class: 'f-pri' }, E);
  s('text', { x: 4, y: O.cy - 40, class: 't-ter t-bold' }, E, 'light');
  s('text', { x: 26, y: 56, class: 't-fg' }, E, 'cornea');
  s('text', { x: 90, y: O.cy - 38, 'text-anchor': 'middle', class: 't-fg' }, E, 'lens');
  s('text', { x: r1x + 6, y: r1y - 8, class: 't-fg' }, E, 'retina');
  s('text', { x: fov[0] - 8, y: O.cy + 30, 'text-anchor': 'end', class: 't-pri t-bold' }, E, 'fovea');

  const S = { x: 322, y: 30, w: 420, h: 176, base: 192, n: 41, mid: 532 };
  s('line', { x1: fov[0] + 4, y1: fov[1] - 6, x2: S.x, y2: S.y, class: 's-muted dash', style: 'stroke-width: 1' }, E);
  s('line', { x1: fov[0] + 4, y1: fov[1] + 6, x2: S.x, y2: S.y + S.h, class: 's-muted dash', style: 'stroke-width: 1' }, E);
  s('rect', { x: S.x, y: S.y, width: S.w, height: S.h, rx: 6, class: 'f-surface box' }, E);
  for (let i = 0; i < S.n; i++) {
    const x = S.x + 10 + i * 10, k = Math.abs(x - S.mid) / 10;
    if (k <= 3 || (k <= 8 && k % 2 === 0) || k % 6 === 0) cone(E, x, S.base - 2, 50); else rod(E, x, S.base - 2, 94);
  }
  s('line', { x1: S.x + 8, x2: S.x + S.w - 8, y1: S.base, y2: S.base, class: 's-muted', style: 'stroke-width: 2' }, E);
  s('text', { x: S.mid, y: 86, 'text-anchor': 'middle', class: 't-pri t-bold' }, E, 'fovea: cones only');
  s('text', { x: S.x + 10, y: 56, class: 't-sec t-bold' }, E, 'mostly rods');
  s('text', { x: S.x + S.w - 10, y: 56, 'text-anchor': 'end', class: 't-sec t-bold' }, E, 'mostly rods');

  // Figure 2: the same patches in photopic and scotopic vision
  const COLORS = [['red', 210, 60, 50], ['orange', 229, 138, 46], ['yellow', 230, 197, 60], ['green', 63, 154, 82], ['blue', 47, 108, 180], ['violet', 124, 77, 163]];
  const SC = svg(viz('scene'), 640, 196, { label: 'Six colored patches in good light and in low light, and which receptors are in use', minWidth: 500 });
  const PW = 88, PG = 10, PX = (640 - (6 * PW + 5 * PG)) / 2;
  const patches = COLORS.map(([name], i) => {
    const x = PX + i * (PW + PG);
    s('text', { x: x + PW / 2, y: 86, 'text-anchor': 'middle', class: 't-fg' }, SC, name);
    return s('rect', { x, y: 8, width: PW, height: 60, rx: 4, class: 'box' }, SC);
  });
  const rows = [['cones', 126, cone, 26], ['rods', 172, rod, 34]].map(([name, y, draw, h]) => {
    s('text', { x: PX, y: y - 6, class: name === 'cones' ? 't-pri t-bold' : 't-sec t-bold' }, SC, name);
    const g = s('g', { class: 'fade' }, SC);
    for (let i = 0; i < 12; i++) draw(g, 120 + i * 16, y, h);
    return { g, status: s('text', { x: 330, y: y - 6, class: 't-fg' }, SC) };
  });

  const note = role('note');
  steps(viz('steps'), ['Photopic · good light', 'Scotopic · low light'], k => {
    patches.forEach((r, i) => {
      const [, R, G, B] = COLORS[i];
      if (k === 0) r.setAttribute('style', `fill: rgb(${R},${G},${B})`); // data-color
      else r.setAttribute('style', gray(0.55 * (0.299 * R + 0.587 * G + 0.114 * B)).style);
    });
    rows[0].g.style.opacity = k === 0 ? '1' : '0.25';
    rows[1].g.style.opacity = k === 1 ? '1' : '0.25';
    rows[0].status.textContent = k === 0 ? 'in use: they see color' : 'not in use: too little light';
    rows[1].status.textContent = k === 1 ? 'in use: no color, only light and dark' : 'not in use in good light';
    note.textContent = k === 0
      ? 'Photopic vision, good illumination. "Photopic vision uses cones and provides color" (slide 5), so every patch shows its color.'
      : 'Scotopic vision, low illumination. It "uses only rods to see, meaning that objects are visible, but appear in black and white" (slide 5). The patches are still there, but their colors are gone.';
  });
});

QV.register('s1-mc7', function (q) {
  const { s, svg, grid, steps } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const P = [1, 2], QQ = [6, 4], ROWS = 8, COLS = 7;
  const M = {
    d8: { name: 'D8, chessboard', f: (r, c) => Math.max(Math.abs(r - P[0]), Math.abs(c - P[1])), path: [[2, 3], [3, 4], [4, 4], [5, 4]],
      lines: ['D8 = max(|x − s|, |y − t|)', '= max(|1 − 6|, |2 − 4|)', '= max(5, 2)', '= 5'], walk: ['2 diagonal + 3 down = 5 moves', 'the 2 columns ride along free'] },
    d4: { name: 'D4, city block', f: (r, c) => Math.abs(r - P[0]) + Math.abs(c - P[1]), path: [[2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [6, 3]],
      lines: ['D4 = |x − s| + |y − t|', '= |1 − 6| + |2 − 4|', '= 5 + 2', '= 7'], walk: ['5 down + 2 right = 7 moves', 'no diagonal moves allowed'] },
    de: { name: 'De, Euclidean', f: (r, c) => Math.hypot(r - P[0], c - P[1]), path: [],
      lines: ['De = √((x − s)² + (y − t)²)', '= √(5² + 2²)', '= √29', '≈ 5.39'], walk: ['one straight line,', 'not a walk along pixels'] },
  };

  const G = svg(viz('grid'), 600, 346, { label: 'Pixel grid with p at (1, 2) and q at (6, 4), showing chessboard, city-block or Euclidean distance from p', minWidth: 480 });
  const CELL = 33, GAP = 2, X0 = 60, Y0 = 52, PITCH = CELL + GAP;
  const ccx = c => X0 + c * PITCH + CELL / 2, ccy = r => Y0 + r * PITCH + CELL / 2;
  for (let c = 0; c < COLS; c++) s('text', { x: ccx(c), y: Y0 - 8, 'text-anchor': 'middle', class: 't-sm' }, G, c);
  for (let r = 0; r < ROWS; r++) s('text', { x: X0 - 8, y: ccy(r), dy: '0.35em', 'text-anchor': 'end', class: 't-sm' }, G, r);
  s('text', { x: X0, y: Y0 - 26, class: 't-fg t-bold' }, G, 'y →');
  s('text', { x: X0 - 8, y: Y0 - 8, 'text-anchor': 'end', class: 't-fg t-bold' }, G, 'x ↓');
  const layer = s('g', {}, G);

  function draw(key) {
    layer.textContent = '';
    const m = M[key];
    const target = m.f(QQ[0], QQ[1]);
    const data = Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLS }, (__, c) => m.f(r, c)));
    const isP = (r, c) => r === P[0] && c === P[1], isQ = (r, c) => r === QQ[0] && c === QQ[1];
    const onPath = (r, c) => m.path.some(([a, b]) => a === r && b === c);
    grid(layer, { x: X0, y: Y0, data, cell: CELL, gap: GAP, round: 3, text: false,
      fill: (v, r, c) => (isP(r, c) ? 'f-pri' : isQ(r, c) ? 'f-ok' : onPath(r, c) ? 'f-pri-soft' : 'f-seg') });
    if (key === 'de') {
      s('line', { x1: ccx(P[1]), y1: ccy(P[0]), x2: ccx(QQ[1]), y2: ccy(QQ[0]), class: 's-pri', style: 'stroke-width: 2' }, layer);
      const R = target * PITCH, gx1 = X0, gy1 = Y0, gx2 = X0 + COLS * PITCH - GAP, gy2 = Y0 + ROWS * PITCH - GAP;
      let run = [];
      const flush = () => { if (run.length > 1) QV.line(layer, run, 's-sec dash'); run = []; };
      for (let a = 0; a <= 360; a += 1) {
        const x = ccx(P[1]) + R * Math.cos(a * Math.PI / 180), y = ccy(P[0]) + R * Math.sin(a * Math.PI / 180);
        if (x >= gx1 && x <= gx2 && y >= gy1 && y <= gy2) run.push([x, y]); else flush();
      }
      flush();
    } else {
      data.forEach((row, r) => row.forEach((v, c) => {
        if (Math.abs(v - target) < 1e-9 && !isQ(r, c)) s('rect', { x: X0 + c * PITCH + 1.5, y: Y0 + r * PITCH + 1.5, width: CELL - 3, height: CELL - 3, rx: 2, class: 'f-none outline-sec' }, layer);
      }));
    }
    data.forEach((row, r) => row.forEach((v, c) => {
      const label = isP(r, c) ? 'p' : key === 'de' ? v.toFixed(isQ(r, c) ? 2 : 1) : String(v);
      const cls = isP(r, c) || isQ(r, c) ? 't-on t-bold' : onPath(r, c) ? 't-pri t-bold' : 't-muted';
      s('text', { x: ccx(c), y: ccy(r), dy: '0.35em', 'text-anchor': 'middle', class: cls + (key === 'de' ? ' halo' : '') }, layer, label);
    }));
    const tx = 336;
    s('text', { x: tx, y: 86, class: 't-fg t-bold t-lg' }, layer, m.name);
    m.lines.forEach((t, i) => s('text', { x: tx + (i ? 18 : 0), y: 116 + i * 22, class: i === 3 ? (key === 'd8' ? 't-ok t-bold t-lg' : 't-fg t-bold t-lg') : 't-fg' }, layer, t));
    m.walk.forEach((t, i) => s('text', { x: tx, y: 222 + i * 18, class: 't-muted' }, layer, t));
    s('text', { x: tx, y: 278, class: key === 'd8' ? 't-ok t-bold' : 't-muted' }, layer, key === 'd8' ? 'option d, the answer' : key === 'd4' ? 'option c' : 'option b');
  }
  steps(viz('steps'), ['D8 · chessboard', 'D4 · city block', 'De · Euclidean'], k => draw(['d8', 'd4', 'de'][k]));

  // Figure 2: D4 ≤ 2 diamond and D8 ≤ 2 square (slide contour figures)
  const RG = svg(viz('rings'), 520, 234, { label: 'Pixels within distance 2 of the center: a D4 diamond of 13 pixels and a D8 square of 25 pixels', minWidth: 420 });
  const OFF = [-2, -1, 0, 1, 2];
  [['D4 ≤ 2: diamond, 13 pixels', 'D4 = 1: the 4-neighbors', (a, b) => Math.abs(a) + Math.abs(b), 40], ['D8 ≤ 2: square, 25 pixels', 'D8 = 1: the 8-neighbors', (a, b) => Math.max(Math.abs(a), Math.abs(b)), 300]]
    .forEach(([title, cap, f, x]) => {
      const data = OFF.map(a => OFF.map(b => f(a, b)));
      grid(RG, { x, y: 34, data, cell: 32, gap: 2, round: 3,
        fill: v => (v === 0 ? 'f-pri' : v === 1 ? 'f-pri-soft' : v === 2 ? 'f-ter-soft' : 'f-seg'),
        text: v => (v <= 2 ? v : ''), textCls: v => (v === 0 ? 't-on t-bold' : 't-fg') });
      s('text', { x, y: 20, class: 't-fg t-bold' }, RG, title);
      s('text', { x, y: 224, class: 't-muted' }, RG, cap);
    });
});

QV.register('s1-mc8', function (q) {
  const { s, svg, axes, plot, steps, arrow, mat } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const tx = (g, attrs, parts) => {
    const t = s('text', attrs, g);
    let lift = false;
    parts.forEach(p => {
      if (typeof p === 'string') { s('tspan', lift ? { dy: -3 } : {}, t, p); lift = false; } else { s('tspan', { dy: 3, class: 't-sm' }, t, p[0]); lift = true; }
    });
    return t;
  };

  // Figure 1: p_r(r) = 2 − 2r, T(r) = 2r − r², p_s(s) = 1 (slide 25)
  const pr = r => 2 - 2 * r, T = r => 2 * r - r * r;
  const BND = [0, 0.2, 0.4, 0.6, 0.8, 1].map(v => 1 - Math.sqrt(1 - v));
  const band = i => (i % 2 ? 'f-pri-soft' : 'f-pri');
  const bandT = i => (i % 2 ? 't-pri' : 't-on');
  const CD = svg(viz('cdf'), 840, 254, { label: 'Input density 2 minus 2r cut into five 20 percent bands, the mapping T(r) = 2r minus r squared, and the flat output density', minWidth: 560 });
  const A1 = axes(CD, { x: 36, y: 36, w: 200, h: 170, xd: [0, 1], yd: [0, 2.2], xt: [0, 0.5, 1], yt: [0, 1, 2], xl: 'r, input level' });
  for (let i = 0; i < 5; i++) {
    const a = BND[i], b = BND[i + 1];
    s('polygon', { points: [[a, 0], [a, pr(a)], [b, pr(b)], [b, 0]].map(([x, y]) => A1.x(x) + ',' + A1.y(y)).join(' '), class: band(i) + ' sep' }, CD);
    const lx = A1.x((a + b) / 2), ly = A1.y(i < 4 ? 0.5 : 0.2);
    s('text', { x: lx, y: ly, dy: '0.35em', 'text-anchor': 'middle', class: bandT(i) + ' t-sm', transform: i < 4 ? `rotate(-90 ${lx} ${ly})` : null }, CD, '20%');
  }
  QV.line(CD, [[A1.x(0), A1.y(2)], [A1.x(1), A1.y(0)]], 's-fg');
  tx(CD, { x: 36, y: 14, class: 't-fg t-bold' }, ['Input: p', ['r'], '(r) = 2 − 2r']);

  const A2 = axes(CD, { x: 330, y: 36, w: 200, h: 170, xd: [0, 1], yd: [0, 1], xt: [0, 0.5, 1], yt: [0, 0.2, 0.4, 0.6, 0.8, 1], xl: 'r', grid: false });
  for (let i = 1; i < 5; i++) {
    const r = BND[i], v = i / 5;
    QV.line(CD, [[A2.x(r), A2.y(0)], [A2.x(r), A2.y(v)], [A2.x(0), A2.y(v)]], 's-muted dash');
  }
  for (let i = 0; i < 5; i++) {
    s('rect', { x: A2.x(BND[i]), y: A2.y(0) - 7, width: A2.x(BND[i + 1]) - A2.x(BND[i]), height: 7, class: band(i) }, CD);
    s('rect', { x: A2.x(0), y: A2.y((i + 1) / 5), width: 7, height: A2.y(i / 5) - A2.y((i + 1) / 5), class: band(i) }, CD);
  }
  plot(CD, A2, T, 0, 1, 200, 's-pri');
  tx(CD, { x: 330, y: 14, class: 't-fg t-bold' }, ['Mapping: s = T(r) = 2r − r²']);
  s('text', { x: A2.x(0.6), y: A2.y(0.4), class: 't-muted t-sm' }, CD, 'unequal on r,');
  s('text', { x: A2.x(0.6), y: A2.y(0.4) + 13, class: 't-muted t-sm' }, CD, '0.2 each on s');

  const A3 = axes(CD, { x: 620, y: 36, w: 200, h: 170, xd: [0, 1], yd: [0, 2.2], xt: [0, 0.2, 0.4, 0.6, 0.8, 1], yt: [0, 1, 2], xl: 's, output level' });
  for (let i = 0; i < 5; i++) {
    s('rect', { x: A3.x(i / 5), y: A3.y(1), width: A3.x(0.2) - A3.x(0), height: A3.y(0) - A3.y(1), class: band(i) + ' sep' }, CD);
    s('text', { x: A3.x(i / 5 + 0.1), y: A3.y(0.5), dy: '0.35em', 'text-anchor': 'middle', class: bandT(i) + ' t-sm' }, CD, '20%');
  }
  tx(CD, { x: 620, y: 14, class: 't-fg t-bold' }, ['Output: p', ['s'], '(s) = 1, uniform']);
  arrow(CD, 246, 121, 290, 121, { cls: 'a-muted' });
  arrow(CD, 540, 121, 590, 121, { cls: 'a-muted' });

  // Figure 2: the four options on the slide-29 image
  const IMG = [[4, 4, 3, 3], [4, 4, 3, 3], [4, 1, 2, 3], [0, 1, 2, 3]];
  const hist = img => { const h = Array(8).fill(0); img.flat().forEach(v => { h[v] += 1; }); return h; };
  const H0 = hist(IMG);
  const OPTS = [
    { map: [0, 1, 2, 5, 7, 7, 7, 7], name: 'a · equalized', cls: 'f-ok',
      note: 'Equalization maps r → s = round(7 × cdf(r)): 0→0, 1→1, 2→2, 3→5, 4→7. The crowded levels 3 and 4 move apart and the histogram now spans 0 to 7. It is not perfectly flat, because the 6 pixels on one level cannot be split. Slide 26 says the same: the resulting histogram is not flat.' },
    { map: [2, 3, 4, 5, 6, 7, 7, 7], name: 'b · plus 2', cls: 'f-sec',
      note: 'Adding 2 to every pixel moves every bar two levels to the right. The image gets brighter, but the shape of the histogram does not change, so the crowding is still there.' },
    { map: [0, 0, 5, 6, 7, 7, 7, 7], name: 'c · specified', cls: 'f-sec', desired: [0, 0, 0, 0, 0, 6, 5, 5],
      note: 'Specification needs a second input, the desired histogram n₅ = 6, n₆ = 5, n₇ = 5 (ochre outlines, slide 44). The map r → z is 0→0, 1→0, 2→5, 3→6, 4→7, which pushes the output toward that target shape, not toward a flat one.' },
    { map: [0, 0, 2, 2, 4, 4, 6, 6], name: 'd · 4 levels', cls: 'f-sec',
      note: 'Keeping only 4 levels (r → 2⌊r/2⌋, 2 bits instead of 3) merges 0 with 1 and 2 with 3. The histogram gets fewer, taller bars, which is the opposite of spreading it out.' },
  ];
  const HS = svg(viz('hist'), 760, 230, { label: 'Input histogram of the slide-29 image and the histogram after the chosen option', minWidth: 560 });
  const layer = s('g', {}, HS);
  const bars = (ax, h, cls) => h.forEach((n, v) => {
    if (!n) return;
    s('rect', { x: ax.x(v) - 13, y: ax.y(n), width: 26, height: ax.y(0) - ax.y(n), class: cls }, layer);
    s('text', { x: ax.x(v), y: ax.y(n) - 5, 'text-anchor': 'middle', class: 't-fg t-sm' }, layer, n);
  });
  const LV = [0, 1, 2, 3, 4, 5, 6, 7];
  const mats = viz('mats');
  const note = role('note');
  steps(viz('steps'), ['a · Equalize', 'b · Add 2', 'c · Specify', 'd · Fewer levels'], k => {
    const o = OPTS[k];
    const out = IMG.map(row => row.map(v => o.map[v]));
    layer.textContent = '';
    const ax1 = axes(layer, { x: 40, y: 34, w: 300, h: 150, xd: [-0.5, 7.5], yd: [0, 8], xt: LV, yt: [0, 2, 4, 6, 8], xl: 'gray level r' });
    const ax2 = axes(layer, { x: 440, y: 34, w: 300, h: 150, xd: [-0.5, 7.5], yd: [0, 8], xt: LV, yt: [0, 2, 4, 6, 8], xl: 'output level' });
    s('text', { x: 40, y: 16, class: 't-fg t-bold' }, layer, 'Input histogram (pixels per level)');
    s('text', { x: 440, y: 16, class: (k === 0 ? 't-ok' : 't-sec') + ' t-bold' }, layer, 'After option ' + o.name);
    bars(ax1, H0, 'f-pri');
    bars(ax2, hist(out), o.cls);
    if (o.desired) o.desired.forEach((n, v) => {
      if (n) s('rect', { x: ax2.x(v) - 15, y: ax2.y(n), width: 30, height: ax2.y(0) - ax2.y(n), class: 's-ter dash', style: 'stroke-width: 1.5' }, layer);
    });
    [ax1, ax2].forEach(ax => s('line', { x1: ax.box.x, x2: ax.box.x + ax.box.w, y1: ax.y(2), y2: ax.y(2), class: 's-fg dash', style: 'stroke-width: 1' }, layer));
    arrow(layer, 360, 109, 418, 109, { cls: 'a-muted', label: 'map', labelCls: 't-muted' });
    mats.textContent = '';
    mat(mats, IMG, { caption: 'input image r' });
    mat(mats, out, { caption: 'output, option ' + o.name.charAt(0), hl: (v, r, c) => (v !== IMG[r][c] ? 'hl' : null) });
    note.textContent = o.note;
  });
});

QV.register('s1-mc9', function (q) {
  const { s, svg, grid, steps, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const A = ['0000000000000', '0111011100000', '0111011100000', '0111111111110', '0111111100000', '0111111100000', '0111111100000', '0111111100010', '0000000000000']
    .map(r => r.split('').map(Number));
  const R = A.length, C = A[0].length;
  const at = (I, r, c) => (r >= 0 && r < R && c >= 0 && c < C ? I[r][c] : 0);
  const op = (I, all) => I.map((row, r) => row.map((_, c) => {
    let n = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) n += at(I, r + dr, c + dc);
    return all ? +(n === 9) : +(n > 0);
  }));
  const ero = I => op(I, true), dil = I => op(I, false);
  const minus = (X, Y) => X.map((row, r) => row.map((v, c) => (v && !Y[r][c] ? 1 : 0)));
  const EA = ero(A), DA = dil(A);
  const STATES = [
    { panels: [['A', A], ['A ⊖ B', EA], ['(A ⊖ B) ⊕ B = A ∘ B', dil(EA)]], ops: ['⊖ B', '⊕ B'], diff: true, fit: true,
      note: 'Opening, the answer. Erosion keeps a pixel only where B fits inside A. The solid plum square fits in the body, so its center survives. The dashed one sits on the thin line and does not fit, so the line and the noise pixel vanish. Dilation then grows the body back, and the notch stays open. 52 → 19 → 47 pixels.' },
    { panels: [['A', A], ['A ⊕ B', DA], ['(A ⊕ B) ⊖ B = A • B', ero(DA)]], ops: ['⊕ B', '⊖ B'], diff: true,
      note: 'Option a is closing. Dilation first fills the notch and fattens everything, then erosion shrinks the shape back. The notch stays filled, while the thin line and the noise pixel survive. 52 → 102 → 54 pixels.' },
    { panels: [['A ⊕ B', DA], ['A ⊖ B', EA], ['(A ⊕ B) − (A ⊖ B)', minus(DA, EA)]], ops: ['−', '='], sym: true,
      note: 'Option b is the morphological gradient, the difference between the dilation and the erosion. It leaves a band along every boundary, an edge map rather than a cleaned shape.' },
    { panels: [['A', A], ['A ⊖ B', EA], ['(A ⊖ B) ⊖ B', ero(EA)]], ops: ['⊖ B', '⊖ B'], diff: true,
      note: 'Option d erodes twice. Each erosion only removes pixels, so the shape keeps shrinking and nothing grows back. 52 → 19 → 3 pixels.' },
  ];

  const CELL = 17, PW = C * CELL, PH = R * CELL, PX = [16, 290, 564], PY = 40;
  const MS = svg(viz('morph'), 800, 222, { label: 'Three binary images showing the steps of the chosen option on a shape with a notch, a thin line and a noise pixel', minWidth: 560 });
  const layer = s('g', {}, MS);
  const sq = (r, c, n, cls) => s('rect', { x: PX[0] + c * CELL, y: PY + r * CELL, width: n * CELL, height: n * CELL, class: cls }, layer);
  const note = role('note');
  steps(viz('steps'), ['c · Opening', 'a · Closing', 'b · Gradient', 'd · Erode twice'], k => {
    const st = STATES[k];
    layer.textContent = '';
    st.panels.forEach(([title, I], i) => {
      grid(layer, { x: PX[i], y: PY, data: I, cell: CELL, text: false, fill: v => (v ? 'f-pri' : 'f-seg') });
      s('text', { x: PX[i] + PW / 2, y: PY - 12, 'text-anchor': 'middle', class: 't-fg t-bold' }, layer, title);
      s('text', { x: PX[i] + PW / 2, y: PY + PH + 18, 'text-anchor': 'middle', class: 't-muted' }, layer, I.flat().reduce((a, b) => a + b, 0) + ' pixels');
    });
    if (st.diff) {
      const out = st.panels[2][1];
      out.forEach((row, r) => row.forEach((v, c) => {
        if (v === A[r][c]) return;
        s('rect', { x: PX[2] + c * CELL + 2, y: PY + r * CELL + 2, width: CELL - 4, height: CELL - 4, class: (v ? 's-ok' : 's-bad') + ' dash', style: 'stroke-width: 1.5' }, layer);
      }));
    }
    if (st.fit) {
      sq(4, 3, 3, 'f-none outline-sec');
      sq(2, 8, 3, 'f-none outline-sec dash');
    }
    st.ops.forEach((o, i) => {
      const x1 = PX[i] + PW + 8, x2 = PX[i + 1] - 8, y = PY + PH / 2;
      if (st.sym) s('text', { x: (x1 + x2) / 2, y, dy: '0.35em', 'text-anchor': 'middle', class: 't-fg t-bold t-xl' }, layer, o);
      else arrow(layer, x1, y, x2, y, { cls: 'a-muted', label: o, labelCls: 't-fg t-bold', dy: -9 });
    });
    note.textContent = st.note;
  });
});

QV.register('s1-mc10', function (q) {
  const { s, svg, axes } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const SALMON = [[2.0, 3.6], [3.8, 2.9], [3.4, 4.2], [2.0, 2.3], [4.2, 4.1], [2.9, 3.1], [5.1, 3.1], [3.9, 3.5], [1.6, 3.9], [5.6, 3.3], [3.7, 2.2], [2.8, 3.8], [3.1, 2.5]];
  const BASS = [[7.1, 5.8], [8.1, 6.0], [7.4, 6.3], [7.6, 6.9], [7.0, 6.8], [5.8, 6.1], [7.1, 7.6], [6.0, 8.0], [8.5, 7.8], [6.5, 6.7], [6.6, 7.5], [6.0, 7.0], [5.2, 5.7]];
  const ALL = SALMON.concat(BASS);
  const mean = pts => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

  const SV = svg(viz('scatter'), 800, 300, { label: 'Two scatter plots of lightness against width: labelled salmon and sea bass with a decision boundary, and the same points without labels grouped into two clusters', minWidth: 560 });
  const opt = x => ({ x, y: 40, w: 300, h: 214, xd: [0, 10], yd: [0, 10], xt: [0, 2, 4, 6, 8, 10], yt: [0, 2, 4, 6, 8, 10], xl: 'lightness', yl: 'width' });
  const L = axes(SV, opt(44)), U = axes(SV, opt(470));
  s('text', { x: 44, y: 12, class: 't-fg t-bold' }, SV, 'Supervised: labels from a teacher');
  s('text', { x: 470, y: 12, class: 't-fg t-bold' }, SV, 'Unsupervised: no labels, groups found');

  // left: labelled classes and the nearest-class-mean boundary
  const m1 = mean(SALMON), m2 = mean(BASS);
  const mid = [(m1[0] + m2[0]) / 2, (m1[1] + m2[1]) / 2], dir = [-(m2[1] - m1[1]), m2[0] - m1[0]];
  let t0 = -Infinity, t1 = Infinity;
  [0, 1].forEach(i => { if (dir[i]) { const a = (0 - mid[i]) / dir[i], b = (10 - mid[i]) / dir[i]; t0 = Math.max(t0, Math.min(a, b)); t1 = Math.min(t1, Math.max(a, b)); } });
  const e0 = [mid[0] + t0 * dir[0], mid[1] + t0 * dir[1]], e1 = [mid[0] + t1 * dir[0], mid[1] + t1 * dir[1]];
  s('line', { x1: L.x(e0[0]), y1: L.y(e0[1]), x2: L.x(e1[0]), y2: L.y(e1[1]), class: 's-fg dash', style: 'stroke-width: 1.5' }, SV);
  SALMON.forEach(p => s('circle', { cx: L.x(p[0]), cy: L.y(p[1]), r: 4.5, class: 'f-pri' }, SV));
  BASS.forEach(p => s('rect', { x: L.x(p[0]) - 4, y: L.y(p[1]) - 4, width: 8, height: 8, class: 'f-sec' }, SV));
  s('text', { x: L.x(1.4), y: L.y(1.2), class: 't-pri t-bold' }, SV, 'salmon');
  s('text', { x: L.x(6.6), y: L.y(9.0), class: 't-sec t-bold' }, SV, 'sea bass');
  const by = 9.3, bx = mid[0] + (by - mid[1]) / dir[1] * dir[0];
  s('text', { x: L.x(bx) + 10, y: L.y(by), class: 't-fg halo' }, SV, 'decision boundary');

  // right: the same points without labels, grouped by 2-means
  let cen = [ALL.reduce((a, p) => (p[0] < a[0] ? p : a)), ALL.reduce((a, p) => (p[0] > a[0] ? p : a))];
  let lab = [];
  for (let it = 0; it < 20; it++) {
    lab = ALL.map(p => (d2(p, cen[0]) <= d2(p, cen[1]) ? 0 : 1));
    cen = [0, 1].map(k => mean(ALL.filter((_, i) => lab[i] === k)));
  }
  const sx = U.x(1) - U.x(0), sy = U.y(0) - U.y(1);
  cen.forEach((c, k) => {
    const pts = ALL.filter((_, i) => lab[i] === k);
    const ax = Math.sqrt(pts.reduce((a, p) => a + (p[0] - c[0]) ** 2, 0) / pts.length);
    const ay = Math.sqrt(pts.reduce((a, p) => a + (p[1] - c[1]) ** 2, 0) / pts.length);
    const f = Math.max(...pts.map(p => Math.hypot((p[0] - c[0]) / ax, (p[1] - c[1]) / ay)));
    const rx = f * ax * sx + 10, ry = f * ay * sy + 10;
    s('ellipse', { cx: U.x(c[0]), cy: U.y(c[1]), rx, ry, class: 'f-ter-soft' }, SV);
    s('ellipse', { cx: U.x(c[0]), cy: U.y(c[1]), rx, ry, class: 's-ter dash', style: 'stroke-width: 2' }, SV);
    s('text', { x: U.x(c[0]), y: U.y(c[1]) - ry - 6, 'text-anchor': 'middle', class: 't-ter t-bold halo' }, SV, 'cluster ' + (k + 1));
  });
  ALL.forEach(p => s('circle', { cx: U.x(p[0]), cy: U.y(p[1]), r: 4.5, class: 'f-muted' }, SV));
  cen.forEach(c => {
    s('line', { x1: U.x(c[0]) - 6, x2: U.x(c[0]) + 6, y1: U.y(c[1]), y2: U.y(c[1]), class: 's-ter' }, SV);
    s('line', { x1: U.x(c[0]), x2: U.x(c[0]), y1: U.y(c[1]) - 6, y2: U.y(c[1]) + 6, class: 's-ter' }, SV);
  });
});
