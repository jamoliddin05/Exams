QV.register('s3-mc27', function (q) {
  const { s, svg, steps } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const T = (g, x, y, str, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls }, g, str);

  const CW = 18, X = b => 100 + (31 - b) * CW;
  const R1 = 42, R2 = 104, RH = 26;
  const IMPL = [31, 30, 23, 22];
  const g = svg(viz('reg'), 700, 290, { label: 'SHPR3 as 32 bits: the value written, the bits the chip keeps, and the resulting NVIC priority of SysTick and PendSV', minWidth: 560 });
  [['SysTick · 31:24', 31, 24], ['PendSV · 23:16', 23, 16], ['reserved · 15:0', 15, 0]].forEach(([n, a, b]) => {
    s('path', { d: `M${X(a) + 1} 26 V22 H${X(b) + CW - 1} V26`, class: 's-muted' }, g);
    T(g, (X(a) + X(b) + CW) / 2, 12, n, a === 15 ? 't-muted' : 't-fg t-bold', 'middle');
  });
  [31, 30, 23, 22, 16, 0].forEach(b => T(g, X(b) + CW / 2, 34, String(b), 't-sm', 'middle'));
  T(g, 0, R1 + RH / 2, 'written', 't-fg t-bold');
  T(g, 0, 84, 'hex', 't-muted');
  T(g, 0, R2 + RH / 2, 'kept', 't-fg t-bold');
  T(g, 0, 230, 'NVIC level', 't-fg t-bold');
  const P = p => 200 + p * 140;
  s('line', { x1: P(0), x2: P(3), y1: 230, y2: 230, class: 'l-axis' }, g);
  ['0 · most urgent', '1', '2', '3 · least urgent'].forEach((l, p) => {
    s('line', { x1: P(p), x2: P(p), y1: 225, y2: 235, class: 'l-axis' }, g);
    T(g, P(p), 250, l, p === 3 ? 't-fg' : null, p === 0 ? 'start' : p === 3 ? 'end' : 'middle');
  });
  s('circle', { cx: P(3), cy: 230, r: 13, class: 'f-none s-ok dash', style: 'stroke-width: 1.5' }, g);
  T(g, P(3), 270, 'the goal', 't-ok', 'end');
  const layer = s('g', {}, g);

  function draw(v) {
    layer.textContent = '';
    const kept = v & 0xC0C00000;
    for (let b = 31; b >= 0; b--) {
      const w = (v >>> b) & 1, k = (kept >>> b) & 1, impl = IMPL.indexOf(b) >= 0;
      s('rect', { x: X(b), y: R1, width: CW, height: RH, class: (w ? (impl ? 'f-pri' : 'f-bad') : 'f-seg') + ' sep' }, layer);
      T(layer, X(b) + CW / 2, R1 + RH / 2, String(w), w ? 't-on t-bold' : 't-muted', 'middle');
      s('rect', { x: X(b), y: R2, width: CW, height: RH, class: (k ? 'f-pri' : 'f-seg') + ' sep' }, layer);
      T(layer, X(b) + CW / 2, R2 + RH / 2, String(k), k ? 't-on t-bold' : 't-muted', 'middle');
      if (impl) [R1, R2].forEach(y => s('rect', { x: X(b) + 1, y: y + 1, width: CW - 2, height: RH - 2, class: 'f-none outline-pri' }, layer));
    }
    for (let n = 7; n >= 0; n--) {
      const d = (v >>> (4 * n)) & 0xF;
      T(layer, X(4 * n + 3) + 2 * CW, 84, d.toString(16).toUpperCase(), d ? 't-fg t-bold' : 't-muted', 'middle');
    }
    const st = (kept >>> 30) & 3, pv = (kept >>> 22) & 3, ok = st === 3 && pv === 3;
    const bin = p => (p >> 1) + '' + (p & 1) + '₂';
    T(layer, 100, 156, `SysTick: bits 31:30 = ${bin(st)} = ${st}`, st === 3 ? 't-ok t-bold' : 't-bad t-bold');
    T(layer, 100, 176, `PendSV: bits 23:22 = ${bin(pv)} = ${pv}`, pv === 3 ? 't-ok t-bold' : 't-bad t-bold');
    T(layer, 420, 166, ok ? 'least urgent: runs after every other handler' : 'not the least urgent level', ok ? 't-ok' : 't-bad');
    s('circle', { cx: P(st), cy: 230, r: 8, class: ok ? 'f-ok' : 'f-bad' }, layer);
    T(layer, P(st), 206, 'SysTick, PendSV', ok ? 't-ok t-bold' : 't-bad t-bold', st === 0 ? 'start' : st === 3 ? 'end' : 'middle');
  }
  const VALS = [0x00000000, 0x03030000, 0xC0C00000, 0x80800000];
  const NOTE = [
    'A · 0x00000000 leaves both fields at 00: priority 0, the most urgent NVIC level. That is the kernel\'s numbering, where idle = 0 is least urgent, applied to the wrong ladder. PendSV could then run in the middle of another handler, which a switch must never do.',
    'B · 0x03030000 puts its 1s in bits 25:24 and 17:16. Only bits 31:30 and 23:22 exist, so the chip drops them and both priorities stay 0, the most urgent.',
    'C · 3 = 11₂ moved to the top of each byte: 3 << 6 = 0xC0. SysTick\'s byte is bits 31:24 and PendSV\'s is bits 23:16, so SHPR3 = 0xC0C00000. Both sit at 3, the least urgent level, as os_start leaves them.',
    'D · 0x80800000 sets only bits 31 and 23, so each field reads 10₂ = 2. Any interrupt at level 3 would then be less urgent than PendSV.',
  ];
  steps(viz('steps'), VALS.map((v, i) => 'ABCD'[i] + ' · 0x' + v.toString(16).toUpperCase().padStart(8, '0')), k => {
    draw(VALS[k]);
    role('note').textContent = NOTE[k];
  }, 2);
});

QV.register('s3-mc28', function (q) {
  const { s, svg, steps, box, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const T = (g, x, y, str, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls }, g, str);

  const C = { x: 20, w: 170, y0: 44, h: 20 };
  const BW = 13, BX = b => 270 + (31 - b) * BW;
  const g = svg(viz('frame'), 720, 384, { label: 'The 16 forged words of a new task and its xPSR bits, then the first switch into the task', minWidth: 580 });
  T(g, C.x, 16, 'forged stack · low addresses at the top', 't-fg t-bold');
  const layer = s('g', {}, g);

  function draw(xpsr) {
    layer.textContent = '';
    const tbit = (xpsr >>> 24) & 1, hexv = '0x' + xpsr.toString(16).toUpperCase().padStart(8, '0');
    const rows = ['r4', 'r5', 'r6', 'r7', 'r8', 'r9', 'r10', 'r11'].map(r => r + ' = 0')
      .concat(['r0 = arg', 'r1 = 0', 'r2 = 0', 'r3 = 0', 'r12 = 0', 'lr = task_exit', 'pc = fn & ~1', 'xPSR = ' + hexv]);
    rows.forEach((r, i) => {
      const y = C.y0 + i * C.h, last = i === 15;
      const f = last ? (tbit ? ['f-ok', 't-on t-bold'] : ['f-bad', 't-on t-bold']) : i < 8 ? ['f-pri-soft', 't-pri'] : ['f-sec-soft', 't-sec'];
      s('rect', { x: C.x, y, width: C.w, height: C.h, class: f[0] + ' sep' }, layer);
      T(layer, C.x + C.w / 2, y + C.h / 2, r, f[1] + ' t-sm', 'middle');
    });
    T(layer, C.x + C.w + 6, C.y0 + C.h / 2, '← tcb->sp', 't-pri');
    T(layer, C.x + C.w + 6, C.y0 + 8 * C.h + C.h / 2, '← PSP', 't-sec');

    T(layer, BX(31), 20, 'forged xPSR = ' + hexv, 't-fg t-bold');
    [['N', 31], ['Z', 30], ['C', 29], ['V', 28], ['T', 24]].forEach(([n, b]) => T(layer, BX(b) + BW / 2, 46, n, b === 24 ? (tbit ? 't-ok t-bold' : 't-bad t-bold') : 't-sm', 'middle'));
    T(layer, (BX(5) + BX(0) + BW) / 2, 46, 'ISR', 't-sm', 'middle');
    for (let b = 31; b >= 0; b--) {
      const v = (xpsr >>> b) & 1, t = b === 24;
      s('rect', { x: BX(b), y: 56, width: BW, height: 22, class: (t ? (v ? 'f-ok' : 'f-bad') : v ? 'f-pri' : 'f-seg') + ' sep' }, layer);
      T(layer, BX(b) + BW / 2, 67, String(v), t || v ? 't-on t-bold t-sm' : 't-muted t-sm', 'middle');
    }
    T(layer, BX(31), 96, tbit ? 'bit 24, T = 1: Thumb state, the only state the M0+ has' : 'bit 24, T = 0: asks for ARM state, which the M0+ lacks', tbit ? 't-ok t-bold' : 't-bad t-bold');

    const bx = 270, bw = 420;
    box(layer, bx, 122, bw, 44, '1 · PendSV_Handler loads r4–r11 from tcb->sp\nand sets PSP to the r0 slot', { textCls: 't-fg' });
    arrow(layer, bx + bw / 2, 166, bx + bw / 2, 186, { cls: 'a-muted', width: 1.5 });
    box(layer, bx, 188, bw, 44, '2 · bx 0xFFFFFFFD: the hardware pops 8 words\nr0 = arg, lr = task_exit, pc = fn, xPSR', { textCls: 't-fg' });
    arrow(layer, bx + bw / 2, 232, bx + bw / 2, 252, { cls: tbit ? 'a-ok' : 'a-bad', width: 1.5 });
    box(layer, bx, 254, bw, 50, tbit ? '3 · T = 1: the task\'s first instruction runs\nwith arg in r0, as if it had been preempted there' : '3 · T = 0: HardFault at the task\'s\nfirst instruction', { cls: tbit ? 'f-ok-soft' : 'f-bad-soft', textCls: tbit ? 't-ok t-bold' : 't-bad t-bold' });
    T(layer, bx, 330, 'The hardware never pushed this frame: os_task_create() wrote it.', 't-muted');
    T(layer, bx, 348, 'Each later exception stacks the live xPSR, whose T is always 1.', 't-muted');
  }
  const VALS = [0x01000000, 0x00000000];
  const NOTE = [
    'The deck\'s frame. xPSR = 0x01000000 sets only bit 24, T. On the first switch the hardware pops it, stays in Thumb state and jumps to fn with arg in r0, as if the task had just been interrupted at its first instruction.',
    'The student\'s frame. Every bit is 0, T included. The first switch goes to the most urgent READY task; the hardware pops T = 0, which asks for ARM state. The M0+ has only Thumb, so it HardFaults at that task\'s first instruction.',
  ];
  steps(viz('steps'), ['Deck: 0x01000000', 'Student: 0x00000000'], k => {
    draw(VALS[k]);
    role('note').textContent = NOTE[k];
  }, 1);
});

QV.register('s3-mc29', function (q) {
  const { s, svg, steps } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const T = (g, x, y, str, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls }, g, str);

  const tx = t => 110 + t * 3.6;
  const ROW = { high: 60, mid: 110, low: 160 }, BH = 24, MY = 196;
  const g = svg(viz('timeline'), 720, 250, { label: 'Timeline of high, mid and low over 160 ms, with the mutex holder, for priority inheritance off and on', minWidth: 580 });
  [['high', 'high · prio 3'], ['mid', 'mid · prio 2'], ['low', 'low · prio 1']].forEach(([k, n]) => {
    T(g, 0, ROW[k], n, 't-fg t-bold');
    s('line', { x1: tx(0), x2: tx(160), y1: ROW[k], y2: ROW[k], class: 'l-grid' }, g);
  });
  T(g, 0, MY, 'mutex', 't-muted t-bold');
  s('line', { x1: tx(0), x2: tx(160), y1: 222, y2: 222, class: 'l-axis' }, g);
  for (let t = 0; t <= 160; t += 20) {
    s('line', { x1: tx(t), x2: tx(t), y1: 222, y2: 227, class: 'l-axis' }, g);
    T(g, tx(t), 240, t + (t === 160 ? ' ms' : ''), null, 'middle');
  }
  const layer = s('g', {}, g);

  const run = (row, a, b, fill, label, text) => {
    s('rect', { x: tx(a), y: ROW[row] - BH / 2, width: tx(b) - tx(a), height: BH, rx: 2, class: fill + ' sep' }, layer);
    if (label) T(layer, (tx(a) + tx(b)) / 2, ROW[row], label, text || 't-on t-bold', 'middle');
  };
  const wait = (row, a, b, cls, label) => {
    s('line', { x1: tx(a), x2: tx(b), y1: ROW[row], y2: ROW[row], class: cls + ' dash', style: 'stroke-width: 2' }, layer);
    if (label) T(layer, (tx(a) + tx(b)) / 2, ROW[row] - 12, label, cls.replace('s-', 't-') + ' t-sm', 'middle');
  };
  const dot = (row, t, cls) => s('circle', { cx: tx(t), cy: ROW[row], r: 5, class: cls }, layer);
  const span = (a, b, label, cls) => {
    s('path', { d: `M${tx(a)} 34 V28 H${tx(b)} V34`, class: cls }, layer);
    T(layer, tx(a), 18, label, cls.replace('s-', 't-') + ' t-bold');
  };

  function draw(on) {
    layer.textContent = '';
    const unlock = on ? 30 : 150;
    run('low', 0, 10, 'f-pri', 'lock');
    dot('high', 10, 'f-sec');
    dot('mid', 10, 'f-ter');
    s('rect', { x: tx(0), y: MY - 6, width: tx(unlock) - tx(0), height: 12, rx: 2, class: 'f-pri-soft' }, layer);
    T(layer, tx(unlock) + 6, MY, 'unlock at ' + unlock + ' ms', 't-pri t-bold');
    if (on) {
      run('low', 10, 30, 'f-pri', 'prio 3');
      s('rect', { x: tx(10) + 1, y: ROW.low - BH / 2 + 1, width: tx(30) - tx(10) - 2, height: BH - 2, class: 'f-none outline-sec' }, layer);
      wait('high', 10, 30, 's-sec');
      run('high', 30, 36, 'f-sec');
      wait('mid', 10, 36, 's-ter', 'READY, low outranks it');
      run('mid', 36, 156, 'f-ter', 'mid computes 120 ms');
      span(10, 30, 'high waits 20 ms, only for low', 's-ok');
    } else {
      wait('low', 10, 130, 's-muted', 'preempted by mid, cannot unlock');
      run('low', 130, 150, 'f-pri');
      wait('high', 10, 150, 's-sec');
      run('high', 150, 156, 'f-sec');
      run('mid', 10, 130, 'f-ter', 'mid computes 120 ms');
      span(10, 150, 'high waits 140 ms: 120 of them for mid', 's-bad');
    }
    role('wait').textContent = (on ? 20 : 140) + ' ms';
    role('wait').className = 'v ' + (on ? 'ok' : '');
    role('formid').textContent = (on ? 0 : 120) + ' ms';
  }
  const NOTE = [
    'OS_PRIORITY_INHERIT 0. At 10 ms high asks for the mutex and blocks, which is ordinary blocking. Mid then preempts low and computes for 120 ms, and low cannot unlock. High waits 20 ms for low plus 120 ms for mid, a task it outranks: unbounded priority inversion.',
    'OS_PRIORITY_INHERIT 1. When high blocks, os_mutex_lock raises low to high\'s priority, 3. Mid (2) cannot preempt it, so low finishes its last 20 ms, unlocks, drops back to base_prio 1, and high goes. Mid still gets its 120 ms, afterwards.',
  ];
  steps(viz('steps'), ['Inheritance off', 'Inheritance on'], k => {
    draw(k === 1);
    role('note').textContent = NOTE[k];
  }, 1);
});

QV.register('s3-mc30', function (q) {
  const { s, svg, steps, box, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const T = (g, x, y, str, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls }, g, str);

  // Figure 1: the two halfwords, field by field
  const CW = 28, X = b => 110 + (15 - b) * CW;
  const e = svg(viz('enc'), 720, 206, { label: 'Encodings of stmia r0!, {r4-r7} = 0xC0F0 and mov r4, r8 = 0x4644, field by field', minWidth: 560 });
  function halfword(y, title, v, fields, hi, names) {
    T(e, 0, y - 28, title, 't-fg t-bold');
    if (names) names.forEach((n, b) => T(e, X(b) + CW / 2, y - 9, n, b >= 4 ? 't-pri t-sm t-bold' : 't-sm', 'middle'));
    for (let b = 15; b >= 0; b--) {
      const bit = (v >> b) & 1;
      s('rect', { x: X(b), y, width: CW, height: 26, class: (bit ? (hi(b) ? 'f-pri' : 'f-pri-soft') : 'f-seg') + ' sep' }, e);
      T(e, X(b) + CW / 2, y + 13, String(bit), bit && hi(b) ? 't-on t-bold' : bit ? 't-pri' : 't-muted', 'middle');
    }
    fields.forEach(([a, b, n1, n2, cls]) => {
      if (b > 0) s('line', { x1: X(b), x2: X(b), y1: y - 2, y2: y + 30, class: 's-fg' }, e);
      if (cls) s('rect', { x: X(a) + 1, y: y + 1, width: (a - b + 1) * CW - 2, height: 24, class: 'f-none ' + cls }, e);
      T(e, (X(a) + X(b) + CW) / 2, y + 40, n1, cls ? cls.replace('outline-', 't-') + ' t-bold' : 't-fg', 'middle');
      T(e, (X(a) + X(b) + CW) / 2, y + 54, n2, 't-muted', 'middle');
    });
  }
  halfword(42, 'stmia r0!, {r4-r7}  =  0xC0F0', 0xC0F0,
    [[15, 11, 'STMIA', '11000'], [10, 8, 'Rn', '000 = r0'], [7, 0, 'register list', 'r7–r4 set', 'outline-pri']],
    b => b <= 7, ['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7']);
  T(e, 572, 48, 'one bit per register,', 't-pri');
  T(e, 572, 64, 'r0–r7 only: no r8', 't-pri t-bold');
  halfword(146, 'mov r4, r8  =  0x4644', 0x4644,
    [[15, 8, 'MOV, high regs', '0x46'], [7, 7, 'D', '0'], [6, 3, 'Rm', '1000 = r8', 'outline-sec'], [2, 0, 'Rd', '100 = r4']],
    b => b >= 3 && b <= 6);
  T(e, 572, 152, '4-bit Rm:', 't-sec');
  T(e, 572, 168, 'reaches r8–r15', 't-sec t-bold');

  // Figure 2: the save and the restore
  const RX = i => 110 + i * 62, RW = 56, cx = i => RX(i) + RW / 2;
  const g = svg(viz('save'), 720, 250, { label: 'Registers r4 to r11 and the eight stack words: save through r4 to r7, restore in reverse', minWidth: 560 });
  T(g, 0, 70, 'registers', 't-fg t-bold');
  T(g, 0, 196, 'task stack', 't-fg t-bold');
  const layer = s('g', {}, g);
  const REG = ['r4', 'r5', 'r6', 'r7', 'r8', 'r9', 'r10', 'r11'];
  const val = (who, i) => who + '.r' + (i + 4);

  function draw(regs, stack, arrows) {
    layer.textContent = '';
    REG.forEach((r, i) => {
      box(layer, RX(i), 52, RW, 36, r + '\n' + regs[i], { cls: i < 4 ? 'f-pri-soft' : 'f-sec-soft', textCls: i < 4 ? 't-pri' : 't-sec', lh: 15 });
      const sv = stack[i];
      box(layer, RX(i), 178, RW, 36, '+' + 4 * i + '\n' + (sv || ''), { cls: sv ? 'f-ok-soft' : 'f-surface', textCls: sv ? 't-ok' : 't-muted', lh: 15 });
    });
    arrows.forEach(([x1, y1, x2, y2, label, lx, ly, anchor]) => {
      arrow(layer, x1, y1, x2, y2, { cls: 'a-fg' === 'a-fg' ? 'a-muted' : 'a-muted', width: 2 });
      T(layer, lx, ly, label, 't-fg t-bold', anchor || 'start');
    });
  }
  const A = i => val('A', i), B = i => val('B', i);
  const ALL = [0, 1, 2, 3, 4, 5, 6, 7];
  const lo = ALL.map(i => (i < 4 ? A(i + 4) : A(i)));
  const MOV = [cx(5.5), 34, cx(1.5), 34, '2 · mov r4, r8 … mov r7, r11', cx(3.5), 18, 'middle'];
  const ST1 = [cx(1.5) - 20, 92, cx(1.5) - 20, 174, '1 · stmia', cx(1.5) - 28, 133, 'end'];
  const ST3 = [cx(1.5) + 20, 92, cx(5.5), 174, '3 · stmia', cx(3.5) + 22, 128];
  const STATES = [
    [lo, ALL.map(A), [ST1, MOV, ST3]],
    [ALL.map(A), ALL.map(i => (i < 4 ? A(i) : '')), [ST1]],
    [lo, ALL.map(i => (i < 4 ? A(i) : '')), [MOV]],
    [lo, ALL.map(A), [ST3]],
    [ALL.map(B), ALL.map(B), [
      [cx(5.5), 174, cx(1.5) + 20, 92, '1 · ldmia from +16', cx(3.5) + 22, 128],
      [cx(1.5), 34, cx(5.5), 34, '2 · mov r8, r4 … mov r11, r7', cx(3.5), 18, 'middle'],
      [cx(1.5) - 20, 174, cx(1.5) - 20, 92, '3 · ldmia from +0', cx(1.5) - 28, 133, 'end'],
    ]],
  ];
  const NOTE = [
    'The whole save. Step 1 stores r4–r7 at +0. Step 2 copies r8–r11 into r4–r7, which are already saved and free. Step 3 stores those copies at +16, so the stack holds all eight of task A\'s values.',
    'Step 1. stmia r0!, {r4-r7} stores A\'s r4–r7 at +0 to +12, and r0 moves on to +16.',
    'Step 2. Four movs copy r8–r11 into r4–r7. mov is one of the few Thumb-1 instructions that can read r8–r12; A\'s own r4–r7 are safe on the stack already.',
    'Step 3. A second stmia r0!, {r4-r7} stores the copies at +16 to +28. A is fully saved.',
    'Restoring task B runs backwards. adds r0, #16 and ldmia load B\'s r8–r11 values into r4–r7, four movs put them in r8–r11, and only then does ldmia from +0 load B\'s real r4–r7. Doing r4–r7 first would let the copy overwrite them.',
  ];
  steps(viz('steps'), ['All', '1 · stmia r4–r7', '2 · mov ×4', '3 · stmia copies', 'Restore B'], k => {
    draw(...STATES[k]);
    role('note').textContent = NOTE[k];
  });
});
