QV.register('s2-mc23', function (q) {
  const { s, svg, axes, slider, fmt } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const US = 0.5, ARR = 39999, FRAME = (ARR + 1) * US / 1000;

  // Figure 1: CNT ramp and PA6 for a chosen CCR1
  const W = svg(viz('pwm'), 760, 304, { label: 'TIM3 CNT ramp over two 20 ms frames with CCR1 marked, and the PA6 output below', minWidth: 580 });
  const ax = axes(W, { x: 80, y: 22, w: 580, h: 140, xd: [0, 40], yd: [0, 40000], yt: [0, 20000, 40000], xt: [], grid: false });
  s('text', { x: 72, y: 12, 'text-anchor': 'end', class: 't-fg' }, W, 'CNT');
  s('line', { x1: ax.x(0), x2: ax.x(40), y1: ax.y(ARR), y2: ax.y(ARR), class: 's-muted dash', style: 'stroke-width: 1' }, W);
  s('text', { x: ax.x(40) + 6, y: ax.y(ARR), dy: '0.35em' }, W, 'ARR = 39999');
  s('path', { d: `M${ax.x(0)} ${ax.y(0)} L${ax.x(20)} ${ax.y(ARR)} L${ax.x(20)} ${ax.y(0)} L${ax.x(40)} ${ax.y(ARR)} L${ax.x(40)} ${ax.y(0)}`, class: 's-pri', style: 'stroke-width: 2' }, W);
  const P = { hi: 196, lo: 222, dim: 244, axis: 262 };
  s('text', { x: 72, y: (P.hi + P.lo) / 2, dy: '0.35em', 'text-anchor': 'end', class: 't-fg t-bold' }, W, 'PA6');
  s('line', { x1: ax.x(0), x2: ax.x(40), y1: P.axis, y2: P.axis, class: 'l-axis' }, W);
  [0, 10, 20, 30, 40].forEach(t => {
    s('line', { x1: ax.x(t), x2: ax.x(t), y1: P.axis, y2: P.axis + 5, class: 'l-axis' }, W);
    s('text', { x: ax.x(t), y: P.axis + 18, 'text-anchor': 'middle' }, W, String(t));
  });
  s('text', { x: ax.x(20), y: P.axis + 36, 'text-anchor': 'middle' }, W, 'time (ms)');
  s('line', { x1: ax.x(0), x2: ax.x(20), y1: P.dim, y2: P.dim, class: 's-muted', style: 'stroke-width: 1' }, W);
  [0, 20].forEach(t => s('line', { x1: ax.x(t), x2: ax.x(t), y1: P.dim - 5, y2: P.dim + 5, class: 's-muted', style: 'stroke-width: 1' }, W));
  s('text', { x: ax.x(10), y: P.dim - 5, 'text-anchor': 'middle', class: 'halo' }, W, 'one frame: 40 000 counts × 0.5 µs = 20 ms');
  const layer = s('g', {}, W);

  slider(viz('slider'), { label: 'CCR1', min: 2000, max: 4000, step: 100, value: 3000, fmt: v => String(v) }, c => {
    layer.textContent = '';
    const w = c * US / 1000;
    [0, 20].forEach(t0 => {
      s('rect', { x: ax.x(t0), y: ax.y(ARR), width: ax.x(t0 + w) - ax.x(t0), height: ax.y(0) - ax.y(ARR), class: 'area-pri' }, layer);
    });
    s('line', { x1: ax.x(0), x2: ax.x(40), y1: ax.y(c), y2: ax.y(c), class: 's-sec dash', style: 'stroke-width: 1.5' }, layer);
    s('text', { x: ax.x(40) + 6, y: ax.y(c), dy: '0.35em', class: 't-sec t-bold' }, layer, 'CCR1 = ' + c);
    let d = `M${ax.x(0)} ${P.lo}`;
    [0, 20].forEach(t0 => { d += ` L${ax.x(t0)} ${P.hi} L${ax.x(t0 + w)} ${P.hi} L${ax.x(t0 + w)} ${P.lo}`; });
    d += ` L${ax.x(40)} ${P.lo}`;
    s('path', { d, class: 's-ok', style: 'stroke-width: 2' }, layer);
    [0, 20].forEach(t0 => s('text', { x: ax.x(t0 + w) + 6, y: P.hi + 4, dy: '0.35em', class: 't-ok t-bold' }, layer, fmt(w, 2) + ' ms high'));
    role('pulse').textContent = fmt(w, 2) + ' ms';
    const pos = w === 1 ? 'one end' : w === 1.5 ? 'centre' : w === 2 ? 'the other end' : (w < 1.5 ? 'between one end and centre' : 'between centre and the other end');
    role('servo').textContent = `${c} × 0.5 µs: ${pos}`;
  });

  // Figure 2: the four options as waveforms
  const F2 = svg(viz('four'), 760, 268, { label: 'PA6 waveforms described by options A to D over 40 ms', minWidth: 580 });
  const fx = t => 60 + t * 16;
  const ROWS = [
    { key: 'A', note: 'A · every count read as 1 µs: 3000 µs high, every 40 000 µs', hi: [[0, 3]] },
    { key: 'B', note: 'B · frame from the formula, CCR1 read as µs: 3 ms every 20 ms', hi: [[0, 3], [20, 23]] },
    { key: 'C', note: 'C · mode 1 read backwards: low while CNT < CCR1', hi: [[0, 18.5], [20, 38.5]] },
    { key: 'D', note: 'D · 0.5 µs per count: 1.5 ms high every 20 ms', hi: [[0, 1.5], [20, 21.5]] },
  ];
  ROWS.forEach((r, i) => {
    const y = 22 + i * 54, hi = y + 6, lo = y + 30, ok = r.key === 'D';
    s('text', { x: fx(0), y, class: (ok ? 't-ok' : 't-fg') + ' t-bold' }, F2, r.note);
    s('text', { x: 20, y: (hi + lo) / 2, dy: '0.35em', 'text-anchor': 'middle', class: 't-lg t-bold ' + (ok ? 't-ok' : 't-muted') }, F2, r.key);
    let d = `M${fx(0)} ${lo}`;
    r.hi.forEach(([a, b]) => { d += ` L${fx(a)} ${lo} L${fx(a)} ${hi} L${fx(b)} ${hi} L${fx(b)} ${lo}`; });
    d += ` L${fx(40)} ${lo}`;
    s('path', { d, class: ok ? 's-ok' : 's-bad', style: 'stroke-width: 2' }, F2);
  });
  const ay = 22 + 4 * 54 - 6;
  s('line', { x1: fx(0), x2: fx(40), y1: ay, y2: ay, class: 'l-axis' }, F2);
  [0, 10, 20, 30, 40].forEach(t => {
    s('line', { x1: fx(t), x2: fx(t), y1: ay, y2: ay + 5, class: 'l-axis' }, F2);
    s('text', { x: fx(t), y: ay + 18, 'text-anchor': 'middle' }, F2, t + (t === 40 ? ' ms' : ''));
  });
});

QV.register('s2-mc24', function (q) {
  const { s, svg, steps } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const T0 = 950, T1 = 1550, X0 = 120, PX = 1;
  const tx = t => X0 + (t - T0) * PX;
  const LANE = { ping: 40, report: 92, beat: 144 }, LH = 22;
  const W = svg(viz('tl'), 760, 222, { label: 'Timeline of the ping, report and heartbeat jobs from 950 to 1550 ms', minWidth: 580 });
  for (let t = 1000; t <= 1500; t += 100) s('line', { x1: tx(t), x2: tx(t), y1: 24, y2: 178, class: 'l-grid' }, W);
  [['ping, 100 ms', 'ping'], ['report, 1000 ms', 'report'], ['heartbeat, 500 ms', 'beat']].forEach(([n, k]) => s('text', { x: 0, y: LANE[k] + LH / 2, dy: '0.35em', class: 't-fg t-bold' }, W, n));
  s('line', { x1: tx(T0), x2: tx(T1), y1: 182, y2: 182, class: 'l-axis' }, W);
  for (let t = 1000; t <= 1500; t += 100) {
    s('line', { x1: tx(t), x2: tx(t), y1: 182, y2: 187, class: 'l-axis' }, W);
    s('text', { x: tx(t), y: 200, 'text-anchor': 'middle' }, W, String(t));
  }
  s('text', { x: tx(1250), y: 216, 'text-anchor': 'middle' }, W, 'time (ms)');
  const layer = s('g', {}, W);

  const MODES = [
    { ping: [1000, 1130, 1200, 1300, 1400, 1500], pingDue: [1000, 1100, 1200, 1300, 1400, 1500], report: [[1000, 1130]], beat: [1130, 1500],
      late: [['ping', 1100, 1130, '+30'], ['beat', 1000, 1130, '+130']],
      note: 'The code as given. The ping due at 1100 ms waits until the report returns at 1130 ms, and so does the heartbeat due at 1000 ms. Then ping_at += 100 sets ping_at to 1100, so the next ping is due at 1200 ms: the grid absorbs the lateness.' },
    { ping: [1000, 1130, 1230, 1330, 1430, 1530], pingDue: [1000, 1100, 1230, 1330, 1430, 1530], report: [[1000, 1130]], beat: [1130, 1500],
      late: [['ping', 1100, 1130, '+30'], ['beat', 1000, 1130, '+130']],
      note: 'With ping_at = now the late ping sets ping_at to 1130, so every later ping is due 30 ms off the grid: 1230, 1330, and so on. Each late pass adds its lateness to the schedule for good (option D). The heartbeat happens to stay on its grid because now was read as 1000 in that pass.' },
    { ping: [1000, 1100, 1200, 1300, 1400, 1500], pingDue: [1000, 1100, 1200, 1300, 1400, 1500], report: [[1000, 1100], [1101, 1131]], beat: [1000, 1500],
      late: [],
      note: 'Preemptive scheduling, lesson 07: each job is a task, and the kernel\'s tick can take the CPU away from the report when a more urgent task is ready. Every ping and heartbeat runs on time and the report finishes slightly later. The superloop of lesson 06 cannot do this (option A).' },
  ];
  const due = (k, t) => {
    const y = LANE[k] - 3;
    s('path', { d: `M${tx(t) - 5} ${y - 7} L${tx(t) + 5} ${y - 7} L${tx(t)} ${y} Z`, class: 'f-muted' }, layer);
  };
  steps(viz('steps'), ['Cooperative, += period', 'Cooperative, = now', 'Preemptive (lesson 07)'], m => {
    const M = MODES[m];
    layer.textContent = '';
    M.pingDue.filter(t => t <= T1).forEach(t => due('ping', t));
    due('report', 1000);
    [1000, 1500].forEach(t => due('beat', t));
    M.report.forEach(([a, b]) => s('rect', { x: tx(a), y: LANE.report, width: tx(b) - tx(a), height: LH, class: 'f-sec' }, layer));
    s('text', { x: tx(1065), y: LANE.report + LH / 2, dy: '0.35em', 'text-anchor': 'middle', class: 't-on t-bold' }, layer, '130 ms');
    M.ping.filter(t => t <= T1).forEach(t => s('rect', { x: tx(t) - 1.5, y: LANE.ping, width: 3, height: LH, class: 'f-pri' }, layer));
    M.beat.forEach(t => s('rect', { x: tx(t) - 1.5, y: LANE.beat, width: 3, height: LH, class: 'f-pri' }, layer));
    M.late.forEach(([k, a, b, lab]) => {
      const y = LANE[k] + LH + 8;
      s('line', { x1: tx(a), x2: tx(b), y1: y, y2: y, class: 's-bad', style: 'stroke-width: 2' }, layer);
      s('line', { x1: tx(a), x2: tx(a), y1: y - 4, y2: y + 4, class: 's-bad', style: 'stroke-width: 2' }, layer);
      s('text', { x: tx(b) + 6, y, dy: '0.35em', class: 't-bad t-bold' }, layer, lab + ' ms late');
    });
    if (m === 1) s('text', { x: tx(1380), y: LANE.ping + LH + 12, 'text-anchor': 'middle', class: 't-bad' }, layer, 'due 30 ms off the grid from now on');
    if (m === 0) s('text', { x: tx(1350), y: LANE.ping + LH + 12, 'text-anchor': 'middle', class: 't-ok' }, layer, 'back on the 100 ms grid');
    role('note').textContent = M.note;
  });
});

QV.register('s2-mc25', function (q) {
  const { s, svg, axes, box, arrow, steps } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const N = 48000;

  // Figure 1: the same ramp height at two time scales
  const W = svg(viz('ramps'), 760, 250, { label: 'CNT against time: the first 2 ms with the fast first period, and the first 3 s', minWidth: 580 });
  const L = axes(W, { x: 70, y: 40, w: 250, h: 140, xd: [0, 2], yd: [0, N], xt: [0, 0.5, 1, 1.5, 2], yt: [0, 24000, 48000], xl: 'time (ms)' });
  const R = axes(W, { x: 420, y: 40, w: 310, h: 140, xd: [0, 3], yd: [0, N], xt: [0, 1, 2, 3], yt: [], xl: 'time (s)' });
  s('text', { x: 70, y: 16, class: 't-fg t-bold' }, W, 'first 2 ms (zoom)');
  s('text', { x: 420, y: 16, class: 't-fg t-bold' }, W, 'first 3 s');
  s('text', { x: 62, y: 30, 'text-anchor': 'end', class: 't-fg' }, W, 'CNT');
  s('path', { d: `M${L.x(0)} ${L.y(0)} L${L.x(1)} ${L.y(N)} L${L.x(1)} ${L.y(0)} L${L.x(2)} ${L.y(48)}`, class: 's-pri', style: 'stroke-width: 2' }, W);
  s('text', { x: L.x(0) + 6, y: L.y(N) + 16, class: 't-bad t-bold' }, W, '48 MHz');
  s('text', { x: L.x(0) + 6, y: L.y(N) + 30, class: 't-bad' }, W, 'PSC still 0');
  s('text', { x: L.x(1.5), y: L.y(0) - 12, 'text-anchor': 'middle', class: 't-pri halo' }, W, '48 kHz now');
  s('circle', { cx: L.x(1), cy: L.y(0), r: 5, class: 'f-bad' }, W);
  s('text', { x: L.x(1) + 8, y: L.y(N) + 10, class: 't-bad t-bold' }, W, 'update 1 at 1 ms');
  let d = `M${R.x(0)} ${R.y(0)} L${R.x(0.001)} ${R.y(N)} L${R.x(0.001)} ${R.y(0)}`;
  [1, 2, 3].forEach(k => { d += k < 3 ? ` L${R.x(k + 0.001)} ${R.y(N)} L${R.x(k + 0.001)} ${R.y(0)}` : ` L${R.x(3)} ${R.y(N * (3 - 2.001))}`; });
  s('path', { d, class: 's-pri', style: 'stroke-width: 2' }, W);
  s('circle', { cx: R.x(0.001), cy: R.y(0), r: 5, class: 'f-bad' }, W);
  [1.001, 2.001].forEach(t => s('circle', { cx: R.x(t), cy: R.y(0), r: 5, class: 'f-pri' }, W));
  s('text', { x: R.x(0) + 8, y: R.y(N) + 10, class: 't-bad t-bold' }, W, '← update 1');
  s('text', { x: R.x(3), y: 30, 'text-anchor': 'end', class: 't-pri' }, W, 'then updates at 1.001 s, 2.001 s, ...');

  // Figure 2: preload vs shadow, step by step
  const S = svg(viz('shadow'), 760, 210, { label: 'PSC preload and shadow registers, ARR and the counter during start-up without UG', minWidth: 580 });
  const sl = s('g', {}, S);
  const STEPS = [
    { pre: '999', sh: '0', shCls: 'f-bad-soft', cnt: 'stopped', cntCls: 'f-surface', copy: false, ev: '',
      note: 'Step 1, the writes. PSC = 999 lands in the preload register; the shadow keeps its reset value 0. ARR has no preload while ARPE = 0, so 47999 is live at once.' },
    { pre: '999', sh: '0', shCls: 'f-bad-soft', cnt: '÷ 1: 48 MHz\n48 000 counts = 1 ms', cntCls: 'f-bad-soft', copy: false, ev: '',
      note: 'Step 2, CEN = 1. The counter divides by the shadow PSC + 1 = 1, so it counts 0 to 47 999 at 48 MHz and reaches ARR after only 1 ms.' },
    { pre: '999', sh: '999', shCls: 'f-pri-soft', cnt: 'CNT → 0', cntCls: 'f-surface', copy: true, ev: 'update 1 at 1 ms\nUIF = 1, interrupt',
      note: 'Step 3, the first update event at 1 ms. It raises UIF, so the first interrupt comes now, and it copies the preload 999 into the shadow.' },
    { pre: '999', sh: '999', shCls: 'f-pri-soft', cnt: '÷ 1000: 48 kHz\n48 000 counts = 1 s', cntCls: 'f-ok-soft', copy: false, ev: 'updates at 1.001 s,\n2.001 s, ...',
      note: 'Step 4, every period after that: the counter divides by 1000, so the same 48 000 counts take 1 s. Interrupts come at 1 ms, then 1.001 s, 2.001 s, and so on (option A). With EGR = UG before CEN, the copy happens before the first period and the 1 ms update never appears.' },
  ];
  steps(viz('sh-steps'), ['1 · writes', '2 · first period', '3 · first update', '4 · then 1 Hz'], k => {
    const st = STEPS[k];
    sl.textContent = '';
    box(sl, 20, 20, 170, 46, 'PSC preload\n' + st.pre, { cls: 'f-pri-soft' });
    box(sl, 20, 128, 170, 46, 'PSC shadow\n' + st.sh, { cls: st.shCls });
    arrow(sl, 105, 68, 105, 124, { cls: st.copy ? 'a-pri' : 'a-muted', dash: !st.copy, width: st.copy ? 2.5 : 1.5 });
    s('text', { x: 115, y: 100, class: st.copy ? 't-pri t-bold' : 't-muted' }, sl, st.copy ? 'copied now' : 'copied only at an update event');
    box(sl, 300, 20, 170, 46, 'ARR = 47999\nlive at once (ARPE = 0)', { cls: 'f-surface' });
    box(sl, 300, 128, 170, 46, 'counter\n' + st.cnt, { cls: st.cntCls, lh: 14 });
    arrow(sl, 192, 151, 296, 151, { cls: 'a-muted' });
    arrow(sl, 385, 68, 385, 124, { cls: 'a-muted' });
    s('text', { x: 395, y: 100, class: 't-muted' }, sl, 'counts 0 … ARR');
    if (st.ev) {
      arrow(sl, 472, 151, 556, 151, { cls: k === 2 ? 'a-bad' : 'a-pri' });
      box(sl, 560, 128, 180, 46, st.ev, { cls: k === 2 ? 'f-bad-soft' : 'f-pri-soft' });
    }
    role('sh-note').textContent = st.note;
  }, 3);
});

QV.register('s2-mc26', function (q) {
  const { s, svg, box, arrow, steps, table } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const EDGE = 12000, LAT = 35;
  const W = svg(viz('flow'), 760, 240, { label: 'Input capture flow: edge, CCR1 latched, CC1IF set, handler starts; and the result of the chosen handler body', minWidth: 580 });
  const BX = i => 16 + i * 184, BW = 160, BY = 20, BH = 50;
  [
    ['PA7 edge\nCNT = 12000', 'f-surface'],
    ['CCR1 ← CNT\nCCR1 = 12000', 'f-pri-soft'],
    ['CC1IF = 1\ninterrupt requested', 'f-pri-soft'],
    [`handler starts\nCNT = ${EDGE + LAT}`, 'f-sec-soft'],
  ].forEach(([t, cls], i) => {
    box(W, BX(i), BY, BW, BH, t, { cls });
    if (i < 3) arrow(W, BX(i) + BW + 2, BY + BH / 2, BX(i + 1) - 2, BY + BH / 2, { cls: 'a-muted' });
  });
  s('text', { x: BX(1), y: BY + BH + 16, class: 't-pri' }, W, 'hardware, at the edge');
  s('text', { x: BX(3), y: BY + BH + 16, class: 't-sec' }, W, `${LAT} µs of latency later`);
  const layer = s('g', {}, W);

  const OPTS = [
    { key: 'D', code: 't = (uint16_t)TIM14->CCR1;', src: 1, t: EDGE, flag: 'read of CCR1 clears it: 0', ok: true,
      note: 'D: t = 12000, the edge\'s own time, copied by the hardware before the handler existed. The same load clears CC1IF, so the handler returns and waits for the next edge.' },
    { key: 'A', code: 't = (uint16_t)TIM14->CNT;  TIM14->SR = TIM_SR_CC1IF;', src: 3, t: EDGE + LAT, flag: 'written 1: still 1', ok: false,
      note: 'A: t = 12035, the time the handler ran, 35 µs late. Writing TIM_SR_CC1IF puts a 1 on CC1IF, which leaves it set, and 0 on every other flag. The interrupt is still pending, so the handler re-enters forever.' },
    { key: 'B', code: 't = (uint16_t)TIM14->CNT;  TIM14->SR = ~TIM_SR_CC1IF;', src: 3, t: EDGE + LAT, flag: 'written 0: cleared', ok: false,
      note: 'B: the write-0 clear is right, so the handler returns. But t = 12035 includes the 35 µs latency, which changes with whatever else runs: this is the EXTI-style timestamp, not a capture.' },
    { key: 'C', code: 't = (uint16_t)TIM14->CNT;', src: 3, t: EDGE + LAT, flag: 'not touched: still 1', ok: false,
      note: 'C: reading CNT clears nothing; only a read of CCR1 does. CC1IF stays set and the handler re-enters forever, and t is 35 µs late anyway.' },
  ];
  steps(viz('opt-steps'), OPTS.map(o => o.key + (o.key === 'D' ? ' · read CCR1' : o.key === 'C' ? ' · CNT only' : o.key === 'A' ? ' · CNT, SR = flag' : ' · CNT, SR = ~flag')), k => {
    const o = OPTS[k];
    layer.textContent = '';
    const okT = o.t === EDGE, cleared = o.flag.indexOf('still') < 0;
    const sx = BX(o.src) + BW / 2;
    arrow(layer, sx, BY + BH + 24, 136, 118, { cls: okT ? 'a-ok' : 'a-bad', width: 2 });
    box(layer, 16, 120, 240, 54, `t = ${o.t}\n${okT ? 'the edge\'s time' : 'late by ' + LAT + ' µs'}`, { cls: okT ? 'f-ok-soft' : 'f-bad-soft' });
    box(layer, 270, 120, 230, 54, 'CC1IF after the handler\n' + o.flag, { cls: cleared ? 'f-ok-soft' : 'f-bad-soft' });
    box(layer, 514, 120, 230, 54, cleared ? 'handler returns' : 'interrupt still pending:\nre-enters forever', { cls: cleared ? 'f-ok-soft' : 'f-bad-soft' });
    s('text', { x: 16, y: 202, class: 't-fg t-bold t-lg' }, layer, o.code);
    s('text', { x: 16, y: 226, class: (o.ok ? 't-ok' : 't-bad') + ' t-bold' }, layer, o.ok ? 'right time, acknowledged' : !cleared ? 'wrong time, never acknowledged' : 'acknowledged, wrong time');
    role('note').textContent = o.note;
  });

  table(viz('conv'), [{ text: 'Flag', cls: 'l' }, { text: 'Clears by', cls: 'l' }, { text: 'The line', cls: 'l' }], [
    [{ text: 'TIM3 / TIM14 SR: UIF, CC1IF', cls: 'l' }, { text: 'writing 0', cls: 'l' }, { text: 'TIM3->SR = ~TIM_SR_UIF;', cls: 'l' }],
    [{ text: 'TIM14 CC1IF (capture)', cls: 'l' }, { text: 'reading CCR1', cls: 'l hl' }, { text: 't = (uint16_t)TIM14->CCR1;', cls: 'l hl' }],
    [{ text: 'EXTI RPR1, FPR1 pending bit', cls: 'l' }, { text: 'writing 1', cls: 'l' }, { text: 'EXTI->RPR1 = mask;', cls: 'l' }],
    [{ text: 'SysTick', cls: 'l' }, { text: 'nothing to clear', cls: 'l' }, { text: 'taking the exception acknowledges it', cls: 'l' }],
  ]);
});
