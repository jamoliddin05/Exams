QV.register('s1-mc23', function (q) {
  const { s, svg, axes, box, arrow, steps, fmt } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const F = 48e6;
  const OPTS = [
    { key: 'C', psc: 23, arr: 19999, verdict: '<b>C</b>: 48 MHz / 24 = 2 MHz, and 20 000 counts of 0.5 µs take 10 ms. Every update lands on a target line: 100 Hz.' },
    { key: 'A', psc: 24, arr: 20000, verdict: '<b>A</b>: 48 MHz / 25 = 1.92 MHz, and 20 001 counts take 10.42 ms, about 4 % slow. The error grows every period, and only a cross-check against a second clock notices it.' },
    { key: 'B', psc: 23, arr: 9999, verdict: '<b>B</b>: the count rate is right, but 10 000 counts take only 5 ms, so the updates come twice as often, 200 Hz.' },
    { key: 'D', psc: 47, arr: 19999, verdict: '<b>D</b>: 48 MHz / 48 = 1 MHz, so 20 000 counts take 20 ms. That is the lesson\'s 50 Hz servo frame, half the rate asked for.' },
  ];

  const W = svg(viz('ramp'), 760, 330, { label: 'Timer time base: 48 MHz through PSC into CNT, compared with ARR, and CNT drawn over 30 ms with the 10 ms targets', minWidth: 560 });
  const B = { y: 8, h: 46, w: 128, gap: 24, x0: 10 };
  const bx = i => B.x0 + i * (B.w + B.gap);
  for (let i = 0; i < 4; i++) arrow(W, bx(i) + B.w + 2, B.y + B.h / 2, bx(i + 1) - 2, B.y + B.h / 2, { cls: 'a-muted' });
  const chain = s('g', {}, W);

  const ax = axes(W, { x: 70, y: 112, w: 660, h: 168, xd: [0, 30], yd: [0, 20000], xt: [0, 5, 10, 15, 20, 25, 30], yt: [0, 5000, 10000, 15000, 20000], xl: 'time (ms)' });
  s('text', { x: 62, y: 100, 'text-anchor': 'end', class: 't-fg' }, W, 'CNT');
  [10, 20, 30].forEach(t => s('line', { x1: ax.x(t), x2: ax.x(t), y1: ax.y(20000) - 4, y2: ax.y(0), class: 's-ok dash', style: 'stroke-width: 1.5' }, W));
  s('text', { x: ax.x(30) - 6, y: 104, 'text-anchor': 'end', class: 't-ok t-bold' }, W, 'target: an update every 10 ms');
  const layer = s('g', {}, W);

  steps(viz('pick'), OPTS.map(o => `${o.key} · ${o.psc} / ${o.arr}`), k => {
    const o = OPTS[k];
    const rate = F / (o.psc + 1), T = (o.arr + 1) / rate * 1000, right = o.key === 'C';
    chain.textContent = '';
    const rateTxt = rate >= 1e6 ? fmt(rate / 1e6, 2) + ' MHz' : fmt(rate / 1e3, 2) + ' kHz';
    [
      ['48 MHz\ntimer clock', 'f-surface'],
      [`PSC = ${o.psc}\n÷ ${o.psc + 1}`, 'f-pri-soft'],
      [`CNT +1 every\n${fmt(1e6 / rate, 4)} µs`, 'f-surface'],
      [`ARR = ${o.arr}\n${(o.arr + 1).toLocaleString('en-US').replace(/,/g, ' ')} counts`, 'f-pri-soft'],
      [`update every\n${fmt(T, 2)} ms`, right ? 'f-ok-soft' : 'f-bad-soft'],
    ].forEach(([t, cls], i) => box(chain, bx(i), B.y, B.w, B.h, t, { cls }));

    layer.textContent = '';
    let d = `M${ax.x(0)} ${ax.y(0)}`;
    const dots = [];
    for (let i = 0; i * T < 30; i++) {
      const t1 = (i + 1) * T;
      if (t1 <= 30 + 1e-9) {
        d += ` L${ax.x(t1).toFixed(1)} ${ax.y(o.arr).toFixed(1)} L${ax.x(t1).toFixed(1)} ${ax.y(0)}`;
        dots.push(t1);
      } else {
        d += ` L${ax.x(30)} ${ax.y(o.arr * (30 - i * T) / T).toFixed(1)}`;
      }
    }
    s('line', { x1: ax.x(0), x2: ax.x(30), y1: ax.y(o.arr), y2: ax.y(o.arr), class: 's-pri dash', style: 'stroke-width: 1' }, layer);
    s('text', { x: ax.x(0) + 6, y: ax.y(o.arr) - 6, class: 't-pri t-bold halo' }, layer, `ARR = ${o.arr}`);
    s('path', { d, class: 's-pri', style: 'stroke-width: 2' }, layer);
    dots.forEach(t => s('circle', { cx: ax.x(t), cy: ax.y(0), r: 5, class: 'f-pri' }, layer));

    role('rate').textContent = rateTxt;
    role('counts').textContent = (o.arr + 1).toLocaleString('en-US').replace(/,/g, ' ');
    const per = role('period');
    per.textContent = fmt(T, 2) + ' ms';
    per.className = 'v' + (right ? ' ok' : '');
    role('verdict').innerHTML = o.verdict;
  });
});

QV.register('s1-mc24', function (q) {
  const { s, svg, steps } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const LABELS = ['As written: SR = TIM_SR_UIF', 'Fixed: SR = ~TIM_SR_UIF'];

  // Figure 1: rc_w0 flags, after = before AND written
  const IMPL = [0, 1, 2, 3, 4, 6, 9, 10, 11, 12];
  const NAME = { 0: 'UIF', 1: 'CC1IF' };
  const before = b => (b === 0 || b === 1 ? 1 : 0);
  const G = { x0: 128, cell: 36, rows: [46, 90, 134], rh: 32 };
  const cx = b => G.x0 + (15 - b) * G.cell;
  const sr = svg(viz('sr'), 720, 196, { label: 'TIM3 SR low 16 bits: flags before, value written, flags after', minWidth: 560 });
  for (let b = 15; b >= 0; b--) {
    s('text', { x: cx(b) + G.cell / 2, y: 14, 'text-anchor': 'middle', class: 't-sm' }, sr, String(b));
    if (NAME[b] != null) s('text', { x: cx(b) + G.cell / 2, y: 32, 'text-anchor': 'middle', class: 't-sm t-fg t-bold' }, sr, NAME[b]);
  }
  const srLayer = s('g', {}, sr);
  s('rect', { x: cx(0) + 1, y: G.rows[0] - 4, width: G.cell - 2, height: G.rows[2] + G.rh - G.rows[0] + 8, rx: 4, class: 'f-none outline-sec' }, sr);
  const hex16 = v => '0x' + v.toString(16).toUpperCase().padStart(4, '0');

  function drawSR(k) {
    srLayer.textContent = '';
    const written = b => (k === 0 ? (b === 0 ? 1 : 0) : (b === 0 ? 0 : 1));
    const after = b => (IMPL.indexOf(b) >= 0 ? before(b) & written(b) : 0);
    const rows = [
      ['SR before', before, 'f-pri'],
      ['written', written, 'f-sec'],
      ['SR after', after, 'f-pri'],
    ];
    rows.forEach(([name, fn, on], r) => {
      const y = G.rows[r];
      let v = 0;
      for (let b = 15; b >= 0; b--) {
        const bit = fn(b), impl = IMPL.indexOf(b) >= 0 || r === 1;
        v |= bit << b;
        s('rect', { x: cx(b), y, width: G.cell, height: G.rh, class: (bit ? on : 'f-seg') + ' sep', style: impl ? null : 'opacity: 0.45' }, srLayer);
        s('text', { x: cx(b) + G.cell / 2, y: y + G.rh / 2, dy: '0.35em', 'text-anchor': 'middle', class: bit ? 't-on t-bold' : 't-muted' }, srLayer, String(bit));
      }
      s('text', { x: 0, y: y + 10, dy: '0.35em', class: 't-fg t-bold' }, srLayer, name);
      s('text', { x: 0, y: y + 24, dy: '0.35em' }, srLayer, hex16(v));
    });
    const msg = k === 0 ? 'UIF stays 1 · CC1IF cleared instead' : 'UIF cleared · CC1IF kept';
    s('text', { x: cx(0) + G.cell, y: 186, 'text-anchor': 'end', class: (k === 0 ? 't-bad' : 't-ok') + ' t-bold' }, srLayer, msg);
    s('text', { x: 0, y: 186, class: 't-fg' }, srLayer, 'after = before AND written');
    role('sr-note').textContent = k === 0
      ? 'As written: TIM3->SR = TIM_SR_UIF stores 0x00000001. Bit 0 gets a 1, which leaves UIF set; every other bit gets a 0, which clears CC1IF instead. UIF is still 1 when the handler returns, so the NVIC enters it again at once.'
      : 'Fixed: TIM3->SR = ~TIM_SR_UIF stores 0xFFFFFFFE, built by movs and negs and written by one str. Bit 0 gets the only 0, so UIF clears; the 1s leave every other flag alone, so CC1IF survives. No read is needed.';
  }

  // Figure 2: contexts over the first 60 ms
  const T = { x0: 130, px: 10, lanes: [44, 80, 116], lh: 20, pin: [150, 170], axis: 190 };
  const tx = t => T.x0 + t * T.px;
  const cpu = svg(viz('cpu'), 760, 240, { label: 'Timeline of main, SysTick, TIM3 handler and the PA6 PWM pin over 60 ms', minWidth: 580 });
  ['main()', 'SysTick, prio 3', 'TIM3, prio 2'].forEach((n, i) => s('text', { x: 0, y: T.lanes[i] + T.lh / 2, dy: '0.35em', class: 't-fg t-bold' }, cpu, n));
  s('text', { x: 0, y: (T.pin[0] + T.pin[1]) / 2, dy: '0.35em', class: 't-fg t-bold' }, cpu, 'PA6, PWM');
  s('line', { x1: tx(0), x2: tx(60), y1: T.axis, y2: T.axis, class: 'l-axis' }, cpu);
  [0, 10, 20, 30, 40, 50, 60].forEach(t => {
    s('line', { x1: tx(t), x2: tx(t), y1: T.axis, y2: T.axis + 5, class: 'l-axis' }, cpu);
    s('text', { x: tx(t), y: T.axis + 18, 'text-anchor': 'middle' }, cpu, String(t));
  });
  s('text', { x: tx(30), y: T.axis + 36, 'text-anchor': 'middle' }, cpu, 'time (ms)');
  let pin = `M${tx(0)} ${T.pin[1]}`;
  [0, 20, 40].forEach(t => { pin += ` L${tx(t)} ${T.pin[1]} L${tx(t)} ${T.pin[0]} L${tx(t + 1.5)} ${T.pin[0]} L${tx(t + 1.5)} ${T.pin[1]}`; });
  pin += ` L${tx(60)} ${T.pin[1]}`;
  s('path', { d: pin, class: 's-pri', style: 'stroke-width: 2' }, cpu);
  const cpuLayer = s('g', {}, cpu);

  function drawCPU(k) {
    cpuLayer.textContent = '';
    const stop = k === 0 ? 20 : 60;
    s('rect', { x: tx(0), y: T.lanes[0], width: tx(stop) - tx(0), height: T.lh, class: 'f-pri-soft' }, cpuLayer);
    for (let t = 1; t <= stop && t < 60; t++) s('rect', { x: tx(t), y: T.lanes[1], width: 2, height: T.lh, class: 'f-pri' }, cpuLayer);
    for (let t = 20; t < 60; t += 20) s('rect', { x: tx(t), y: T.lanes[2], width: 3, height: T.lh, class: 'f-pri' }, cpuLayer);
    if (k === 0) {
      s('rect', { x: tx(20), y: T.lanes[2], width: tx(60) - tx(20), height: T.lh, class: 'f-bad' }, cpuLayer);
      s('text', { x: tx(40), y: T.lanes[2] + T.lh / 2, dy: '0.35em', 'text-anchor': 'middle', class: 't-on t-bold' }, cpuLayer, 'UIF still 1: re-enters forever');
      s('rect', { x: tx(20) + 3, y: T.lanes[1] + 2, width: tx(60) - tx(20) - 4, height: T.lh - 4, rx: 3, class: 'f-none s-muted dash' }, cpuLayer);
      s('text', { x: tx(40), y: T.lanes[1] + T.lh / 2, dy: '0.35em', 'text-anchor': 'middle', class: 't-muted' }, cpuLayer, 'pending, never runs: millis() frozen at 20');
      s('text', { x: tx(40), y: T.lanes[0] + T.lh / 2, dy: '0.35em', 'text-anchor': 'middle', class: 't-muted' }, cpuLayer, 'never runs again');
      s('text', { x: tx(23), y: T.pin[0] + 10, class: 't-pri' }, cpuLayer, 'unchanged: hardware PWM');
    } else {
      s('text', { x: tx(45), y: T.lanes[1] - 5, 'text-anchor': 'middle', class: 't-pri' }, cpuLayer, 'every 1 ms: millis() reaches 60');
      s('text', { x: tx(30), y: T.lanes[2] + T.lh / 2, dy: '0.35em', 'text-anchor': 'middle', class: 't-muted' }, cpuLayer, 'a few µs every 20 ms');
    }
    s('text', { x: tx(0), y: 16, class: 't-fg t-bold' }, cpuLayer, k === 0 ? 'millis() at 60 ms: 20' : 'millis() at 60 ms: 60');
    role('cpu-note').textContent = k === 0
      ? 'As written: everything is normal until the first update at 20 ms. From then on UIF is never cleared, so TIM3\'s handler tail-chains into itself. SysTick (priority 3, less urgent) and main() never run again, so millis() freezes. PA6 keeps its pulse every 20 ms because the counter and the channel are hardware: the servo holds its position.'
      : 'Fixed: the handler runs for a few microseconds every 20 ms and returns. SysTick runs every millisecond, main() gets the rest of the time, and the PWM on PA6 is the same as before.';
  }

  steps(viz('sr-steps'), LABELS, drawSR, 0);
  steps(viz('cpu-steps'), LABELS, drawCPU, 0);
});

QV.register('s1-mc25', function (q) {
  const { s, svg, slider, table } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const START = 0xFFFFFC18;
  const hex = v => '0x' + (v >>> 0).toString(16).toUpperCase().padStart(8, '0');
  const TESTS = [
    { key: 'A', name: 'A · deadline', code: 'millis() >= start + 1000u', f: n => n >= ((START + 1000) >>> 0), val: () => 'start + 1000u = ' + hex(START + 1000) },
    { key: 'B', name: 'B · now − start', code: 'millis() - start >= 1000u', f: n => ((n - START) >>> 0) >= 1000, val: n => 'millis() − start = ' + ((n - START) >>> 0) },
    { key: 'C', name: 'C · start − now', code: 'start - millis() >= 1000u', f: n => ((START - n) >>> 0) >= 1000, val: n => 'start − millis() = ' + ((START - n) >>> 0) },
    { key: 'D', name: 'D · now > start', code: 'millis() > start && ...', f: n => n > START && ((n - START) >>> 0) >= 1000, val: n => 'millis() > start is ' + (n > START) },
  ];
  const X = { x0: 128, x1: 730, max: 1500 };
  const ex = e => X.x0 + e / X.max * (X.x1 - X.x0);
  const W = svg(viz('wrap'), 760, 268, { label: 'Four timeout tests across the 32-bit wrap: which are true at each moment after the start', minWidth: 580 });

  // raw value: near the top before the wrap, near zero after
  const R = { top: 40, bot: 70 };
  s('text', { x: 0, y: 46, class: 't-fg t-bold' }, W, 'raw millis()');
  s('text', { x: 0, y: 62, class: 't-sm' }, W, 'top 2³², bottom 0');
  s('line', { x1: X.x0, x2: X.x1, y1: R.bot, y2: R.bot, class: 'l-grid' }, W);
  s('line', { x1: X.x0, x2: X.x1, y1: R.top, y2: R.top, class: 'l-grid' }, W);
  const yraw = n => R.bot - (n / 2 ** 32) * (R.bot - R.top);
  s('path', { d: `M${ex(0)} ${yraw(START).toFixed(1)} L${ex(1000)} ${R.top} L${ex(1000)} ${R.bot} L${ex(1500)} ${yraw(500).toFixed(2)}`, class: 's-pri', style: 'stroke-width: 2' }, W);
  [[0, START], [500, START + 500], [1000, 0], [1500, 500]].forEach(([e, n]) => {
    s('text', { x: ex(e), y: 32, 'text-anchor': e === 0 ? 'start' : e === 1500 ? 'end' : 'middle', class: 't-sm' }, W, hex(n));
  });
  s('text', { x: ex(1000) + 6, y: R.bot - 8, class: 't-pri t-sm' }, W, 'wraps to 0');

  const rowY = i => 92 + i * 32, RH = 22;
  const segs = [];
  TESTS.forEach((t, i) => {
    s('text', { x: 0, y: rowY(i) + RH / 2, dy: '0.35em', class: 't-fg t-bold' }, W, t.name);
    let run = null;
    const cls = e => {
      const v = t.f((START + e) >>> 0), due = e >= 1000;
      return v ? (due ? 'f-ok' : 'f-bad') : (due ? 'f-sec-soft' : 'f-seg');
    };
    for (let e = 0; e <= X.max; e++) {
      const c = cls(e);
      if (!run || run.c !== c) { if (run) segs.push(run); run = { i, c, a: e, b: e }; } else run.b = e;
    }
    segs.push(run);
  });
  segs.forEach(r => s('rect', { x: ex(r.a), y: rowY(r.i), width: Math.max(1.5, ex(r.b + 1) - ex(r.a)), height: RH, class: r.c }, W));
  [[0, 500, 't-on', 'true at once, 1000 ms early'], [1, 1250, 't-on', 'true from 1000 ms'], [2, 500, 't-on', 'true from 1 ms after the start'], [3, 1250, 't-sec t-bold', 'never true']]
    .forEach(([i, e, cls, txt]) => s('text', { x: ex(e), y: rowY(i) + RH / 2, dy: '0.35em', 'text-anchor': 'middle', class: cls }, W, txt));
  const axisY = rowY(4) + 2;
  s('line', { x1: X.x0, x2: X.x1, y1: axisY, y2: axisY, class: 'l-axis' }, W);
  [0, 250, 500, 750, 1000, 1250, 1500].forEach(e => {
    s('line', { x1: ex(e), x2: ex(e), y1: axisY, y2: axisY + 5, class: 'l-axis' }, W);
    s('text', { x: ex(e), y: axisY + 18, 'text-anchor': 'middle' }, W, String(e));
  });
  s('text', { x: (X.x0 + X.x1) / 2, y: axisY + 34, 'text-anchor': 'middle' }, W, 'ms since start');
  s('line', { x1: ex(1000), x2: ex(1000), y1: R.top - 2, y2: axisY, class: 's-ok dash', style: 'stroke-width: 1' }, W);
  const cur = s('g', {}, W);

  slider(viz('slider'), { label: 'time since start', min: 0, max: 1500, step: 1, value: 1000, fmt: v => v + ' ms' }, e => {
    const n = (START + e) >>> 0;
    cur.textContent = '';
    s('line', { x1: ex(e), x2: ex(e), y1: R.top - 4, y2: axisY, class: 's-fg', style: 'stroke-width: 2' }, cur);
    s('circle', { cx: ex(e), cy: yraw(n), r: 4.5, class: 'f-fg' }, cur);
    const host = viz('vals');
    host.textContent = '';
    table(host, [{ text: 'Option', cls: 'l' }, { text: 'Test', cls: 'l' }, { text: 'At millis() = ' + hex(n), cls: 'l' }, 'Result'], TESTS.map(t => {
      const v = t.f(n), good = v === (e >= 1000);
      return [{ text: t.key, cls: 'l' }, { text: t.code, cls: 'l' }, { text: t.val(n), cls: 'l' }, { text: v ? 'true' : 'false', cls: good ? '' : 'hl' }];
    }));
  });
});

QV.register('s1-mc26', function (q) {
  const { s, svg, slider } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const RISE = 1000, FALL = 3900, LR = 5;
  const P = [{ x0: 40, c0: 990, edge: RISE, up: true, title: 'rising edge' }, { x0: 410, c0: 3890, edge: FALL, up: false, title: 'falling edge' }];
  const PW = 330, SPAN = 120, px = PW / SPAN;
  const Y = { sig: [34, 58], cap: 74, isr: 112, br: 146, axis: 164 };
  const W = svg(viz('edges'), 760, 214, { label: 'Zoom on the rising and falling edge of the echo: capture time versus handler start time', minWidth: 580 });
  P.forEach(p => {
    const x = c => p.x0 + (c - p.c0) * px;
    p.x = x;
    s('text', { x: p.x0, y: 14, class: 't-fg t-bold' }, W, 'PA7 ' + p.title);
    const lo = Y.sig[1], hi = Y.sig[0];
    const [a, b] = p.up ? [lo, hi] : [hi, lo];
    s('path', { d: `M${x(p.c0)} ${a} L${x(p.edge)} ${a} L${x(p.edge)} ${b} L${x(p.c0 + SPAN)} ${b}`, class: 's-fg', style: 'stroke-width: 2' }, W);
    s('line', { x1: x(p.c0), x2: x(p.c0 + SPAN), y1: Y.axis, y2: Y.axis, class: 'l-axis' }, W);
    for (let c = p.edge; c <= p.c0 + SPAN; c += 40) {
      s('line', { x1: x(c), x2: x(c), y1: Y.axis, y2: Y.axis + 5, class: 'l-axis' }, W);
      s('text', { x: x(c), y: Y.axis + 18, 'text-anchor': 'middle' }, W, String(c));
    }
    s('text', { x: p.x0 + PW / 2, y: Y.axis + 36, 'text-anchor': 'middle' }, W, 'TIM14 CNT (1 count = 1 µs)');
    s('line', { x1: x(p.edge), x2: x(p.edge), y1: Y.sig[0] - 4, y2: Y.axis, class: 's-pri', style: 'stroke-width: 2' }, W);
    s('text', { x: x(p.edge) + 6, y: Y.cap + 6, class: 't-pri t-bold' }, W, 'CCR1 = ' + p.edge);
    s('text', { x: x(p.edge) + 6, y: Y.cap + 20, class: 't-pri t-sm' }, W, 'hardware, at the edge');
  });
  s('text', { x: 390, y: (Y.sig[0] + Y.sig[1]) / 2, dy: '0.35em', 'text-anchor': 'middle', class: 't-muted t-bold' }, W, '…');
  s('text', { x: 390, y: Y.isr, 'text-anchor': 'middle', class: 't-sm' }, W, '2900');
  s('text', { x: 390, y: Y.isr + 12, 'text-anchor': 'middle', class: 't-sm' }, W, 'µs');
  const layer = s('g', {}, W);

  function handler(p, lat) {
    const xe = p.x(p.edge), xh = p.x(p.edge + lat), right = xh + 180 < p.x0 + PW;
    s('line', { x1: xh, x2: xh, y1: Y.isr - 14, y2: Y.axis, class: 's-sec', style: 'stroke-width: 2' }, layer);
    s('text', { x: right ? xh + 6 : xh - 6, y: Y.isr, 'text-anchor': right ? 'start' : 'end', class: 't-sec t-bold halo' }, layer, 'handler starts');
    s('text', { x: right ? xh + 6 : xh - 6, y: Y.isr + 14, 'text-anchor': right ? 'start' : 'end', class: 't-sec halo' }, layer, 'CNT = ' + (p.edge + lat));
    if (lat >= 3) {
      s('line', { x1: xe, x2: xh, y1: Y.br, y2: Y.br, class: 's-sec', style: 'stroke-width: 1.5' }, layer);
      s('text', { x: (xe + xh) / 2, y: Y.br - 5, 'text-anchor': 'middle', class: 't-sec t-sm halo' }, layer, lat + ' µs');
    }
  }

  slider(viz('slider'), { label: 'falling-edge latency', min: 1, max: 100, step: 1, value: 100, fmt: v => v + ' µs' }, lf => {
    layer.textContent = '';
    handler(P[0], LR);
    handler(P[1], lf);
    const cap = FALL - RISE, ex = (FALL + lf) - (RISE + LR);
    role('cap').textContent = cap + ' µs';
    role('exti').textContent = ex + ' µs';
    role('cm').textContent = Math.floor(cap / 58) + ' / ' + Math.floor(ex / 58) + ' cm';
    const row = (a, b, c, d) => a.padEnd(10) + b.padEnd(30) + ('= ' + c).padEnd(16) + '= ' + d;
    role('calc').textContent = [
      row('capture', 'CCR1 fall − CCR1 rise', `${FALL} − ${RISE}`, `${cap} µs → ${cap} / 58 = ${Math.floor(cap / 58)} cm`),
      row('EXTI', 'CNT in handler, fall − rise', `${FALL + lf} − ${RISE + LR}`, `${ex} µs → ${ex} / 58 = ${Math.floor(ex / 58)} cm`),
      row('error', 'latency fall − latency rise', `${lf} − ${LR}`, `${lf - LR} µs`),
    ].join('\n');
  });
});
