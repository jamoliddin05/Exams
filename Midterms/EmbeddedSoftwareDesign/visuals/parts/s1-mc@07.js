QV.register('s1-mc27', function (q) {
  const { s, svg, steps, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const T = (g, x, y, str, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls }, g, str);

  const g = svg(viz('ladders'), 700, 300, { label: 'Two priority ladders: kernel task priorities 3 to 0 and NVIC levels 0 to 3, most urgent at the top', minWidth: 540 });
  const ry = i => 92 + i * 44;
  const LAD = [
    { x: 20, title: 'Kernel: task priorities', sub: 'bigger number = more urgent', nums: [3, 2, 1, 0],
      items: [['button'], ['bar'], ['report', 'hog'], ['idle']], hi: ['button', 'hog'], ax: 262 },
    { x: 370, title: 'NVIC: interrupt priorities', sub: '0 = most urgent', nums: [0, 1, 2, 3],
      items: [[], ['EXTI'], [], ['PendSV', 'SysTick']], hi: ['EXTI', 'SysTick'], ax: 612 },
  ];
  const where = {};
  LAD.forEach(L => {
    T(g, L.x, 18, L.title, 't-fg t-bold');
    T(g, L.x, 36, L.sub, 't-muted');
    T(g, L.x, 62, '▲ more urgent', 't-sm');
    T(g, L.x, ry(3) + 30, '▼ less urgent', 't-sm');
    L.nums.forEach((n, i) => {
      const y = ry(i);
      s('line', { x1: L.x + 40, x2: L.x + 222, y1: y, y2: y, class: 'l-grid' }, g);
      s('circle', { cx: L.x + 22, cy: y, r: 13, class: 'f-seg box' }, g);
      T(g, L.x + 22, y, String(n), 't-fg t-bold t-lg', 'middle');
      L.items[i].forEach((name, k) => {
        const bx = L.x + 48 + k * 84, on = L.hi.indexOf(name) >= 0;
        s('rect', { x: bx, y: y - 13, width: 76, height: 26, rx: 4, class: on ? 'f-pri' : 'f-surface box' }, g);
        T(g, bx + 38, y, name, on ? 't-on t-bold' : 't-fg', 'middle');
        where[name] = { y, right: bx + 76, L };
      });
    });
  });
  T(g, 350, 284, 'A task runs in Thread mode, so any enabled interrupt can preempt it, whatever the two numbers.', 't-muted', 'middle');

  const layer = s('g', {}, g);
  function claim(win, lose, ok) {
    const a = where[win], b = where[lose], x = a.L.ax, c = ok ? 'ok' : 'bad';
    [a, b].forEach(p => s('line', { x1: p.right + 4, x2: x, y1: p.y, y2: p.y, class: 's-' + c + ' dash', style: 'stroke-width: 1.5' }, layer));
    arrow(layer, x, b.y, x, a.y, { cls: 'a-' + c, width: 2.5, head: 10 });
    T(layer, x + 8, (a.y + b.y) / 2 - 8, ok ? 'right' : 'wrong', 't-' + c + ' t-bold');
    T(layer, x + 8, (a.y + b.y) / 2 + 8, win + ' first', 't-' + c + ' t-sm');
  }
  const OPT = { A: ['button', 'EXTI'], B: ['hog', 'EXTI'], C: ['button', 'SysTick'], D: ['hog', 'SysTick'] };
  const NOTE = {
    A: 'Option A. Tasks: 3 sits above 1 on the kernel ladder, so the button task outranks the hog. Interrupts: 1 sits above 3 on the NVIC ladder, so EXTI outranks SysTick. Both orders are right.',
    B: 'Option B reads the kernel ladder like the NVIC, smaller first, and puts the hog (1) above the button task (3). Wrong for the tasks, right for the interrupts.',
    C: 'Option C reads the NVIC ladder like the kernel, bigger first, and puts SysTick (3) above EXTI (1). Right for the tasks, wrong for the interrupts.',
    D: 'Option D reverses both ladders: smaller first for the tasks, bigger first for the interrupts.',
  };
  const keys = ['A', 'B', 'C', 'D'];
  steps(viz('steps'), keys.map(k => 'Option ' + k), i => {
    const k = keys[i], [tw, iw] = OPT[k];
    layer.textContent = '';
    claim(tw, tw === 'button' ? 'hog' : 'button', tw === 'button');
    claim(iw, iw === 'EXTI' ? 'SysTick' : 'EXTI', iw === 'EXTI');
    role('note').textContent = NOTE[k];
  });
});

QV.register('s1-mc28', function (q) {
  const { s, svg, steps, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const T = (g, x, y, str, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls }, g, str);
  const hex = v => '0x' + v.toString(16).toUpperCase().padStart(8, '0');

  const NAMES = ['r4', 'r5', 'r6', 'r7', 'r8', 'r9', 'r10', 'r11', 'r0', 'r1', 'r2', 'r3', 'r12', 'lr', 'pc', 'xPSR'];
  const BASE = 0x20000400;
  const C = { x: 230, w: 170, y0: 70, h: 22 };
  const yy = i => C.y0 + i * C.h, yc = i => yy(i) + C.h / 2;
  const g = svg(viz('stack'), 720, 480, { label: 'Task B stack after the switch: 16 words from tcb->sp = 0x20000400, with the saved pc at 0x20000438', minWidth: 560 });
  T(g, 0, 12, 'Task B\'s stack · low addresses at the top', 't-fg t-bold');
  const layer = s('g', {}, g);

  function pointer(i, top, label, sub, cls) {
    const y = top ? yy(i) : yc(i);
    T(layer, 150, sub ? y - 7 : y, label, cls + ' t-bold', 'end');
    if (sub) T(layer, 150, y + 8, sub, cls, 'end');
    arrow(layer, 156, y, C.x - 2, y, { cls: cls.replace('t-', 'a-'), width: 2 });
  }
  function bracket(i0, i1, l1, l2, cls) {
    const y0 = yy(i0) + 3, y1 = yy(i1) - 3, x = 542;
    s('path', { d: `M${x - 6} ${y0} H${x} V${y1} H${x - 6}`, class: cls }, layer);
    T(layer, x + 10, (y0 + y1) / 2 - 8, l1, cls.replace('s-', 't-') + ' t-bold');
    T(layer, x + 10, (y0 + y1) / 2 + 8, l2, 't-muted');
  }
  function bubble(i, k, ok) {
    s('circle', { cx: 522, cy: yc(i), r: 9, class: ok ? 'f-ok' : 'f-surface box' }, layer);
    T(layer, 522, yc(i), k, ok ? 't-on t-bold' : 't-fg', 'middle');
  }

  function draw(k) {
    layer.textContent = '';
    const fill = i => {
      if (k === 1 && i < 8) return null;
      if (i === 14 && k !== 1) return ['f-ok', 't-on t-bold'];
      return i < 8 ? ['f-pri-soft', 't-pri'] : ['f-sec-soft', 't-sec'];
    };
    s('rect', { x: C.x, y: yy(-1), width: C.w, height: C.h, class: 'f-none box dash' }, layer);
    T(layer, C.x + C.w / 2, yc(-1), 'free stack', 't-muted t-sm', 'middle');
    NAMES.forEach((n, i) => {
      const f = fill(i);
      s('rect', { x: C.x, y: yy(i), width: C.w, height: C.h, class: (f ? f[0] : 'f-surface') + (f ? ' sep' : ' box dash'), style: k === 3 ? 'opacity: 0.55' : null }, layer);
      if (f) T(layer, C.x + C.w / 2, yc(i), n, f[1], 'middle');
      T(layer, 408, yc(i), '+' + 4 * i, 't-muted t-sm');
      T(layer, 440, yc(i), hex(BASE + 4 * i), i === 14 ? 't-ok t-bold' : null);
    });
    s('rect', { x: C.x, y: yy(16), width: C.w, height: 2 * C.h, class: 'f-none box dash' }, layer);
    T(layer, C.x + C.w / 2, yy(17), 'B\'s own locals', 't-muted', 'middle');
    T(layer, 440, yc(16), hex(BASE + 64), null);

    if (k !== 1) bracket(0, 8, 'saved by PendSV', 'r4–r11, 8 words', 's-pri');
    bracket(8, 16, 'pushed by the hardware', 'on exception entry', 's-sec');

    if (k === 0) {
      pointer(0, false, 'tcb->sp', hex(BASE), 't-pri');
      [[0, 8, '+32 (8 words)'], [8, 14, '+24 (6 words)']].forEach(([a, b, l]) => {
        arrow(layer, 200, yc(a) + 10, 200, yc(b), { cls: 'a-ok', width: 2 });
        T(layer, 194, (yc(a) + yc(b)) / 2, l, 't-ok t-bold', 'end');
      });
      bubble(6, 'A', false);
      bubble(14, 'D', true);
      bubble(15, 'B', false);
      s('circle', { cx: C.x - 14, cy: 32, r: 9, class: 'f-surface box' }, layer);
      T(layer, C.x - 14, 32, 'C', 't-fg', 'middle');
      T(layer, C.x, 32, '0x200003C8 is 56 bytes lower, further up the page: no saved word of B', 't-muted');
    } else if (k === 1) {
      pointer(8, false, 'PSP', hex(BASE + 32), 't-sec');
    } else if (k === 2) {
      pointer(0, false, 'tcb->sp', 'PSP − 32', 't-pri');
      pointer(8, false, 'PSP', hex(BASE + 32), 't-sec');
    } else {
      pointer(16, true, 'PSP after bx', hex(BASE + 64), 't-sec');
      pointer(14, false, 'B resumes at', 'the saved pc', 't-ok');
    }
  }

  const NOTE = [
    'All 16 words. tcb->sp points at r4. Count 8 words (32 bytes) to r0, where the hardware frame starts, then 6 words (24 bytes) more to pc: 0x20000400 + 0x38 = 0x20000438. Options A, B and C point at other words.',
    'Step 1. B was running on PSP when an exception arrived. The hardware pushed r0, r1, r2, r3, r12, lr, pc and xPSR onto B\'s own stack, so PSP = 0x20000420 points at r0.',
    'Step 2. PendSV_Handler: mrs r0, psp; subs r0, #32; str r0, [r1]. It reserves 8 words above the frame, stores r4–r7 and then r8–r11 (copied through r4–r7). tcb->sp = 0x20000420 − 32 = 0x20000400.',
    'Step 3. When B is picked again, PendSV loads r4–r11 from tcb->sp, sets PSP = tcb->sp + 32 and returns with 0xFFFFFFFD. The hardware pops the 8 frame words, pc included, and B continues at the address stored at 0x20000438. PSP ends at tcb->sp + 64.',
  ];
  steps(viz('steps'), ['All', '1 · Exception entry', '2 · PendSV saves B', '3 · B resumes'], k => {
    draw(k);
    role('note').textContent = NOTE[k];
  });
});

QV.register('s1-mc29', function (q) {
  const { s, svg, slider, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const T = (g, x, y, str, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls }, g, str);
  const hex = v => '0x' + v.toString(16).toUpperCase().padStart(8, '0');

  const SIZE = 96, BELOW = 19, TOP = 0x20000088 + SIZE * 4, PW = 5.6;
  const x = i => 40 + (i + BELOW) * PW;
  const S = { y: 64, h: 40 };
  const g = svg(viz('ram'), 720, 206, { label: 'The report task stack as 96 word cells from 0x20000088 to 0x20000208, with 19 words of other data below it', minWidth: 580 });
  const cells = [];
  for (let i = -BELOW; i < SIZE; i++) cells.push(s('rect', { x: x(i), y: S.y, width: PW, height: S.h, class: 'f-seg sep' }, g));
  s('path', { d: `M${x(0)} 44 V38 H${x(SIZE)} V44`, class: 's-pri' }, g);
  T(g, (x(0) + x(SIZE)) / 2, 24, 'stk_report: 96 words, filled with 0xDEADBEEF', 't-pri t-bold', 'middle');
  s('path', { d: `M${x(-BELOW)} 44 V38 H${x(0) - 3} V44`, class: 's-muted' }, g);
  T(g, (x(-BELOW) + x(0)) / 2, 24, 'other data', 't-fg t-bold', 'middle');
  s('rect', { x: x(-1), y: S.y - 3, width: PW, height: S.h + 6, class: 'f-none outline-sec' }, g);
  s('line', { x1: x(-1) + PW / 2, x2: x(-1) + PW / 2, y1: S.y + S.h + 3, y2: 142, class: 's-sec', style: 'stroke-width: 1.5' }, g);
  T(g, 40, 150, 'primes, the hog\'s counter, 0x20000084', 't-sec t-bold');
  T(g, x(0) + 2, 120, '0x20000088', 't-sm');
  T(g, x(SIZE), 120, 'top 0x20000208', 't-sm', 'end');
  T(g, x(-BELOW), 120, '0x2000003C', 't-sm');
  const dyn = s('g', {}, g);

  slider(viz('slider'), { label: 'deepest point', min: 10, max: 115, step: 1, value: 115, fmt: v => v + ' words' }, d => {
    const used = Math.min(d, SIZE), over = Math.max(0, d - SIZE);
    cells.forEach((c, k) => {
      const i = k - BELOW;
      const cls = i >= 0 ? (i >= SIZE - d ? 'f-pri' : 'f-seg') : (i >= SIZE - d ? 'f-bad' : 'f-surface box');
      c.setAttribute('class', cls + (i >= 0 || i >= SIZE - d ? ' sep' : ''));
    });
    dyn.textContent = '';
    const hw = x(SIZE - used);
    s('line', { x1: hw, x2: hw, y1: S.y - 6, y2: S.y + S.h + 6, class: 's-fg', style: 'stroke-width: 2' }, dyn);
    T(dyn, hw + (used > 80 ? 6 : -6), S.y - 12, 'high-water mark', 't-fg t-bold', used > 80 ? 'start' : 'end');
    const sx = x(SIZE - d);
    arrow(dyn, x(SIZE), 178, sx, 178, { cls: over ? 'a-bad' : 'a-pri', width: 2 });
    T(dyn, (sx + x(SIZE)) / 2, 192, 'sp grows down to ' + hex(TOP - 4 * d), over ? 't-bad t-bold' : 't-pri t-bold', 'middle');
    role('depth').textContent = String(d);
    role('mark').textContent = used + ' / ' + SIZE;
    const ov = role('over');
    ov.textContent = String(over);
    ov.className = 'v' + (over ? '' : ' ok');
    role('verdict').innerHTML = over
      ? `<b>${over}</b> words land below the array. The first is <b>primes</b> at 0x20000084. Nothing faults, so the hog's count just turns into a stack value. The mark saturates at <b>96 / 96</b>: it says "at least full", not by how much.`
      : `Fits. <b>${SIZE - d}</b> words still read 0xDEADBEEF, and the mark reads <b>${d} / 96</b>. Size the stack to the measured use plus a margin.`;
  });
});

QV.register('s1-mc30', function (q) {
  const { s, svg, steps } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const T = (g, x, y, str, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls }, g, str);

  const LANES = ['UART handler · MSP', 'PendSV', 'protocol task', 'hog'];
  const ly = i => 58 + i * 44, LH = 28;
  const g = svg(viz('lanes'), 720, 250, { label: 'Lanes for the UART handler, PendSV, the protocol task and the hog, with time running to the right', minWidth: 560 });
  LANES.forEach((n, i) => {
    T(g, 0, ly(i), n, 't-fg t-bold');
    s('line', { x1: 140, x2: 712, y1: ly(i), y2: ly(i), class: 'l-grid' }, g);
  });
  s('line', { x1: 250, x2: 250, y1: 26, y2: ly(3) + 20, class: 's-muted dash', style: 'stroke-width: 1' }, g);
  T(g, 250, 18, 'a byte arrives', 't-fg t-bold', 'middle');
  s('line', { x1: 140, x2: 712, y1: 232, y2: 232, class: 'l-axis' }, g);
  T(g, 712, 244, 'time →', 't-sm', 'end');
  const layer = s('g', {}, g);

  const run = (lane, a, b, label, fill, text) => {
    s('rect', { x: a, y: ly(lane) - LH / 2, width: b - a, height: LH, rx: 4, class: fill }, layer);
    T(layer, (a + b) / 2, ly(lane), label, text, 'middle');
  };
  const wait = (lane, a, b, label, cls) => {
    s('line', { x1: a, x2: b, y1: ly(lane), y2: ly(lane), class: (cls || 's-muted') + ' dash', style: 'stroke-width: 2' }, layer);
    if (label) T(layer, (a + b) / 2, ly(lane) - 11, label, (cls || 's-muted').replace('s-', 't-') + ' t-sm', 'middle');
  };

  const SCEN = [
    () => {
      run(3, 140, 250, 'hog runs', 'f-seg', 't-fg');
      wait(3, 250, 560, 'preempted: 8 words on its stack');
      wait(3, 560, 712, 'READY');
      run(0, 250, 470, 'put_from_isr(&q, &b) → 1', 'f-pri', 't-on t-bold');
      wait(1, 400, 470, 'pended', 's-ter');
      run(1, 470, 560, 'switch', 'f-ter', 't-on t-bold');
      wait(2, 140, 400, 'BLOCKED in os_queue_get');
      s('circle', { cx: 400, cy: ly(2), r: 6, class: 'f-ok' }, layer);
      wait(2, 406, 560, 'READY', 's-ok');
      run(2, 560, 712, 'get returns b', 'f-ok', 't-on t-bold');
    },
    () => {
      run(2, 140, 250, 'busy, queue full', 'f-ok', 't-on t-bold');
      wait(2, 250, 450, 'preempted');
      run(2, 450, 712, 'carries on, drains the queue', 'f-ok', 't-on t-bold');
      run(0, 250, 450, 'put_from_isr → 0; dropped++', 'f-pri', 't-on t-bold');
      wait(3, 140, 712, 'READY, lower priority');
    },
    () => {
      run(2, 140, 250, 'busy, queue full', 'f-ok', 't-on t-bold');
      wait(2, 250, 712, 'preempted: no task runs while a handler runs', 's-bad');
      run(0, 250, 712, 'while (!put_from_isr(&q, &b)) { } · spins forever', 'f-bad', 't-on t-bold');
      wait(3, 140, 712, 'READY, lower priority');
    },
  ];
  const NOTE = [
    'Queue has room. The task is BLOCKED in os_queue_get, so the hog runs. The UART handler preempts the hog on MSP. os_queue_put_from_isr copies b, makes the task READY and calls schedule(), which pends PendSV. When the handler returns, PendSV switches to the task and os_queue_get returns b.',
    'Full queue, option D. The task is still busy with earlier bytes. os_queue_put_from_isr returns 0 at once; the handler counts the byte as dropped and returns. The task carries on and drains the queue.',
    'Full queue, option C. The handler retries forever. Only the task can make room, and no task runs while a handler is active, so the retry never succeeds and every task stops.',
  ];
  steps(viz('steps'), ['Queue has room', 'Full queue, option D', 'Full queue, option C'], k => {
    layer.textContent = '';
    SCEN[k]();
    role('note').textContent = NOTE[k];
  });
});
