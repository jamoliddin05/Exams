QV.register('s3-mc12', function (q) {
  const { s, svg, axes, plot, slider, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const t = (g, x, y, text, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls }, g, text);
  // slide 6 calibration: 7 h at 1000/s = 25.2 million interrupts per lost update
  const PER = 7 * 3600 * 1000;
  const span = sec => sec >= 3600 ? (+(sec / 3600).toFixed(1)) + ' h' : Math.round(sec / 60) + ' min';

  const C = svg(viz('curve'), 640, 262, { label: 'Hours between lost updates against interrupt rate: 7 hours at 1 kHz, about 40 minutes at 10 kHz', minWidth: 520 });
  const ax = axes(C, { x: 56, y: 20, w: 560, h: 190, xd: [0, 10], yd: [0, 14], xt: [0, 2, 4, 6, 8, 10], yt: [0, 2, 4, 6, 8, 10, 12, 14], xl: 'interrupt rate (kHz)', yl: 'hours between lost updates' });
  plot(C, ax, k => 7 / k, 0.5, 10, 300, 's-bad');
  [[1, 7, 'slide 6: 1000/s, about 7 h', 'start', 10, -10], [10, 0.7, 'slide 6: 10 000/s, about 40 min', 'end', -10, -24]].forEach(([k, h, l, a, dx, dy]) => {
    s('circle', { cx: ax.x(k), cy: ax.y(h), r: 4, class: 'f-fg' }, C);
    t(C, ax.x(k) + dx, ax.y(h) + dy, l, 't-fg t-bold', a);
  });
  const mk = s('g', {}, C);
  const mLine = s('line', { y1: ax.y(0), y2: ax.y(14), class: 's-pri dash', style: 'stroke-width: 1.5' }, mk);
  const mDot = s('circle', { r: 6, class: 'f-pri' }, mk);

  slider(viz('slider'), { label: 'interrupt rate', min: 500, max: 10000, step: 500, value: 1000, fmt: v => v + ' per second' }, r => {
    const sec = PER / r, k = r / 1000;
    mLine.setAttribute('x1', ax.x(k)); mLine.setAttribute('x2', ax.x(k));
    mDot.setAttribute('cx', ax.x(k)); mDot.setAttribute('cy', ax.y(7 / k));
    role('rate').textContent = String(r);
    role('mtbf').textContent = span(sec);
  });

  const W = svg(viz('window'), 760, 186, { label: 'One millisecond of main between two interrupts, and the three instructions of count++ with the 41.7 ns window between ldr and str', minWidth: 580 });
  t(W, 40, 14, 'one millisecond of main() between two interrupts at 1 kHz = 48 000 cycles', 't-fg t-bold');
  s('rect', { x: 40, y: 36, width: 680, height: 22, rx: 3, class: 'f-pri-soft' }, W);
  [40, 720].forEach(x => {
    s('line', { x1: x, x2: x, y1: 28, y2: 66, class: 's-sec', style: 'stroke-width: 2' }, W);
    t(W, x, 76, 'IRQ', 't-sec t-bold', 'middle');
  });
  s('rect', { x: 379, y: 33, width: 2, height: 28, class: 'f-bad' }, W);
  t(W, 388, 47, 'count++, drawn 70× too wide', 't-bad t-sm');
  s('polygon', { points: '379,61 381,61 660,104 100,104', class: 'area-pri' }, W);
  s('rect', { x: 260, y: 100, width: 240, height: 48, rx: 6, class: 'f-bad-soft' }, W);
  ['ldr  r0, [r1]', 'adds r0, #1', 'str  r0, [r1]'].forEach((ins, i) => {
    const x = 100 + i * 200;
    s('rect', { x, y: 110, width: 160, height: 28, rx: 4, class: 'f-pri-soft box' }, W);
    t(W, x + 80, 124, ins, 't-fg', 'middle');
  });
  t(W, 380, 164, 'window ≈ two instructions ≈ 2 × 20.8 ns = 41.7 ns', 't-bad t-bold', 'middle');
  t(W, 380, 180, 'an interrupt taken anywhere else is harmless', 't-muted', 'middle');
});

QV.register('s3-mc13', function (q) {
  const { s, svg, steps, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const t = (g, x, y, text, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls }, g, text);

  const X0 = 112, X1 = 740, Y = { poll: 40, irq: 84, dma: 128, hw: 158 }, BH = 26;
  const W = svg(viz('lanes'), 760, 204, { label: 'CPU time under polling, interrupt and DMA for the situation chosen', minWidth: 580 });
  [['polling', 'poll', 't-pri'], ['interrupt', 'irq', 't-sec'], ['DMA, CPU', 'dma', 't-ok'], ['DMA, hw', 'hw', 't-ter']].forEach(([l, k, c]) => t(W, 0, Y[k], l, c + ' t-bold'));
  arrow(W, X0, 188, X1 - 30, 188, { cls: 'a-muted' });
  t(W, X1 - 24, 188, 'time', 't-muted');
  const dyn = s('g', {}, W);
  const FILL = { poll: ['f-pri-soft', 't-fg'], seg: ['f-seg', 't-muted'], in: ['f-sec', 't-on'], isr: ['f-sec-soft', 't-fg'], work: ['f-ok', 't-on'], hw: ['f-ter-soft', 't-fg'] };

  const SIT = [
    { span: 32, ev: [6], evl: 'LATENCY reads back',
      poll: [[0, 3, 'poll'], [3, 6, 'poll'], [6, 9, 'sees it'], [9, 32, 'next instruction: done at unit 9', 'work']],
      irq: [[0, 6, 'nothing to do', 'seg'], [6, 15, 'push 8 + vector', 'in'], [15, 17, 'ISR', 'isr'], [17, 25, 'pop 8', 'in'], [25, 32, 'next', 'work']],
      dma: null,
      note: 'C · a wait of a few cycles. Polling sees the new LATENCY on the pass after it changes and goes on at unit 9. The interrupt version has no other work to do during the wait, then spends 17 units entering and leaving the handler and goes on at unit 25. The wait is shorter than the cost of being interrupted, so poll.' },
    { span: 100, ev: [80], evl: 'button pressed (really minutes later)',
      poll: [[0, 80, 'ready? ready? ready? … the CPU does nothing else'], [80, 83, ''], [83, 100, 'work', 'work']],
      irq: [[0, 80, 'useful work until told', 'work'], [80, 89, 'entry', 'in'], [89, 91, '', 'isr'], [91, 99, 'exit', 'in'], [99, 100, '', 'work']],
      dma: null,
      note: 'A and D · a rare event, or one that must not be missed. Polling spends the whole wait asking and does no useful work, and for D it only sees the signal when the loop comes back. The interrupt version works until told and pays for entry and exit once. Use an interrupt.' },
    { span: 100, ev: [0, 25, 50, 75], evl: 'byte',
      poll: [[0, 100, 'poll RXNE and copy every byte: the CPU is busy the whole time']],
      irq: [0, 1, 2, 3].flatMap(b => [[25 * b, 25 * b + 9, 'entry', 'in'], [25 * b + 9, 25 * b + 11, '', 'isr'], [25 * b + 11, 25 * b + 19, 'exit', 'in'], [25 * b + 19, 25 * b + 25, '', 'work']]),
      dma: [[0, 100, 'useful work: the CPU is not involved', 'work']],
      hw: [0, 1, 2, 3].map(b => [25 * b, 25 * b + 4, '', 'hw']),
      note: 'B · a stream of data. Polling keeps the CPU busy for the whole transfer. One interrupt per byte spends most of the time entering and leaving handlers. With DMA the hardware moves every byte and the CPU keeps working. 2 KB is 2048 bytes; four are drawn.' },
  ];

  function lane(segs, y, h, span) {
    const ux = u => X0 + u * (X1 - X0) / span;
    segs.forEach(([a, b, label, kind]) => {
      const [f, c] = FILL[kind || 'poll'], x = ux(a), w = ux(b) - ux(a);
      s('rect', { x, y: y - h / 2, width: w, height: h, class: f + ' sep' }, dyn);
      if (label && label.length * 6 + 6 <= w) t(dyn, x + w / 2, y, label, c + ' t-sm', 'middle');
    });
  }

  steps(viz('steps'), ['C · few cycles', 'A, D · rare event', 'B · 2 KB stream'], k => {
    dyn.textContent = '';
    const st = SIT[k], ux = u => X0 + u * (X1 - X0) / st.span;
    lane(st.poll, Y.poll, BH, st.span);
    lane(st.irq, Y.irq, BH, st.span);
    if (st.dma) {
      lane(st.dma, Y.dma, BH, st.span);
      lane(st.hw, Y.hw, 16, st.span);
    } else {
      t(dyn, X0, Y.dma, 'DMA moves blocks of data; there is nothing to move here', 't-muted');
    }
    st.ev.forEach(u => {
      s('line', { x1: ux(u), x2: ux(u), y1: 22, y2: st.dma ? 172 : Y.irq + 18, class: 's-fg dash', style: 'stroke-width: 1; opacity: 0.6' }, dyn);
      const [lx, anchor] = st.ev.length > 1 ? [ux(u) + (u === 0 ? 2 : 0), u === 0 ? 'start' : 'middle'] : k === 0 ? [ux(u) + 4, 'start'] : [ux(u) - 4, 'end'];
      t(dyn, lx, 10, st.evl, 't-fg t-sm', anchor);
    });
    role('note').textContent = st.note;
  }, 0);
});

QV.register('s3-mc14', function (q) {
  const { s, svg, steps, arrow, box } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const t = (g, x, y, text, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls }, g, text);

  const X0 = 112, MS = 102, x = ms => X0 + ms * MS, Y = { main: 40, pm: 92, irq: 140, lat: 176 }, BH = 26;
  const W = svg(viz('timeline'), 760, 222, { label: 'Six milliseconds of main: the masked region, PRIMASK, the UART request and its latency', minWidth: 580 });
  [['main()', 'main', 't-pri'], ['PRIMASK bit 0', 'pm', 't-fg'], ['UART request', 'irq', 't-sec']].forEach(([l, k, c]) => t(W, 0, Y[k], l, c + ' t-bold'));
  s('line', { x1: X0, x2: x(6), y1: 196, y2: 196, class: 'l-axis' }, W);
  for (let m = 0; m <= 6; m++) {
    s('line', { x1: x(m), x2: x(m), y1: 196, y2: 201, class: 'l-axis' }, W);
    t(W, x(m), 212, m + (m === 6 ? ' ms' : ''), null, 'middle');
  }
  const dyn = s('g', {}, W);
  const seg = (a, b, y, label, fill, cls) => {
    const w = Math.max(3, x(b) - x(a));
    s('rect', { x: x(a), y: y - BH / 2, width: w, height: BH, rx: 3, class: fill + ' sep' }, dyn);
    if (label) t(dyn, x(a) + w / 2, y, label, cls, 'middle');
  };
  const wave = (hi0, hi1) => {
    const lo = Y.pm + 9, hi = Y.pm - 9, a = x(hi0), b = Math.max(x(hi1), a + 3);
    s('path', { d: `M${X0} ${lo} H${a} V${hi} H${b} V${lo} H${x(6)}`, class: 's-pri' }, dyn);
    t(dyn, X0 - 6, lo, '0', 't-sm', 'end');
    t(dyn, X0 - 6, hi, '1', 't-sm', 'end');
  };

  const NOTE = [
    'The student\'s code. cpsid i at 0.5 ms sets PRIMASK bit 0 for 5 ms. The UART request at 1 ms is held pending until cpsie i at 5.5 ms: 4.5 ms of latency. A request just after cpsid i would wait the full 5 ms, at priority 0 or any other.',
    'Only counter++ inside. The masked region is five instructions, well under a microsecond, and print_count() runs with interrupts on. The request at 1 ms is taken at once and print_count() simply resumes after the handler.',
  ];
  steps(viz('steps'), ['print_count() inside', 'only counter++ inside'], k => {
    dyn.textContent = '';
    seg(0, 0.5, Y.main, 'work', 'f-seg', 't-fg');
    s('circle', { cx: x(1), cy: Y.irq, r: 5, class: 'f-sec' }, dyn);
    t(dyn, x(1) - 8, Y.irq, 'byte in', 't-sec t-sm', 'end');
    if (k === 0) {
      seg(0.5, 5.5, Y.main, 'masked: counter++, then print_count()', 'f-pri', 't-on t-bold');
      seg(5.8, 6, Y.main, '', 'f-seg');
      wave(0.5, 5.5);
      s('rect', { x: x(1), y: Y.irq - 9, width: x(5.5) - x(1), height: 18, rx: 3, class: 's-sec dash' }, dyn);
      t(dyn, x(3.25), Y.irq, 'held pending', 't-sec', 'middle');
      seg(5.5, 5.8, Y.irq, 'ISR', 'f-sec', 't-on t-sm');
      s('line', { x1: x(1), x2: x(5.5), y1: Y.lat, y2: Y.lat, class: 's-bad' }, dyn);
      [1, 5.5].forEach(m => s('line', { x1: x(m), x2: x(m), y1: Y.lat - 6, y2: Y.lat + 6, class: 's-bad' }, dyn));
      t(dyn, x(3.25), Y.lat - 10, 'latency 4.5 ms; up to 5 ms', 't-bad t-bold', 'middle');
    } else {
      seg(0.5, 0.5, Y.main, '', 'f-pri');
      t(dyn, x(0.5) + 6, Y.main - 22, 'masked: 5 instructions', 't-pri t-bold');
      seg(0.53, 1, Y.main, '', 'f-ok-soft');
      seg(1.3, 5.6, Y.main, 'print_count(), interrupts on', 'f-ok-soft', 't-fg');
      seg(5.6, 6, Y.main, '', 'f-seg');
      wave(0.5, 0.5);
      seg(1, 1.3, Y.irq, 'ISR', 'f-sec', 't-on t-sm');
      t(dyn, x(1.3) + 8, Y.irq, 'taken at once: latency is only the entry', 't-ok t-bold');
    }
    role('note').textContent = NOTE[k];
  }, 0);

  const G = svg(viz('gate'), 680, 200, { label: 'Four NVIC priority levels feed the NVIC; PRIMASK set to 1 blocks all of them from the core', minWidth: 540 });
  ['level 0 · UART RX', 'level 1', 'level 2', 'level 3'].forEach((l, i) => {
    box(G, 20, 18 + i * 40, 170, 30, l + (i === 0 ? '' : i === 3 ? ', least urgent' : ''), { cls: i === 0 ? 'f-sec' : 'f-seg', textCls: i === 0 ? 't-on t-bold' : 't-fg' });
    arrow(G, 192, 33 + i * 40, 252, 93, { cls: i === 0 ? 'a-sec' : 'a-muted', width: i === 0 ? 2 : 1.2 });
  });
  t(G, 105, 182, '0 = most urgent', 't-sm', 'middle');
  box(G, 256, 58, 130, 70, 'NVIC\npicks the most\nurgent pending', { cls: 'f-surface', lh: 16 });
  arrow(G, 388, 93, 450, 93, { cls: 'a-sec', width: 2 });
  s('rect', { x: 454, y: 52, width: 12, height: 82, rx: 2, class: 'f-bad' }, G);
  t(G, 460, 36, 'PRIMASK = 1', 't-bad t-bold', 'middle');
  t(G, 460, 150, 'nothing passes', 't-bad t-sm', 'middle');
  box(G, 520, 62, 140, 62, 'core\nmain() keeps\nrunning', { cls: 'f-pri-soft', lh: 16 });
  arrow(G, 470, 93, 516, 93, { cls: 'a-muted', dash: true });
  t(G, 460, 182, 'only NMI and HardFault ignore PRIMASK', 't-sm', 'middle');
});
