QV.register('s2-mc27', function (q) {
  const { s, svg, steps, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const T = (g, x, y, str, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls }, g, str);

  const g = svg(viz('ladder'), 720, 290, { label: 'Kernel priority ladder 4 to 0 and a 20 ms timeline of who runs, for the hog at priority 1 and at priority 4', minWidth: 580 });
  const ry = i => 70 + i * 40;
  const tx = t => 330 + t * 18.5, rowY = { button: 100, bar: 150, hog: 200 };
  T(g, 0, 14, 'Kernel priority', 't-fg t-bold');
  T(g, 0, 30, 'bigger number = more urgent', 't-muted');
  T(g, 330, 14, 'Who has the CPU, first 20 ms', 't-fg t-bold');
  Object.keys(rowY).forEach(n => {
    T(g, 322, rowY[n], n, 't-fg', 'end');
    s('line', { x1: tx(0), x2: tx(20), y1: rowY[n], y2: rowY[n], class: 'l-grid' }, g);
  });
  s('line', { x1: tx(0), x2: tx(20), y1: 236, y2: 236, class: 'l-axis' }, g);
  [0, 5, 10, 15, 20].forEach(t => {
    s('line', { x1: tx(t), x2: tx(t), y1: 236, y2: 241, class: 'l-axis' }, g);
    T(g, tx(t), 252, t + (t === 20 ? ' ms' : ''), null, 'middle');
  });
  const layer = s('g', {}, g);

  function ladder(hogP, state) {
    const rungs = [4, 3, 2, 1, 0];
    const at = { 3: ['button'], 2: ['bar'], 1: ['report'], 0: ['idle'], 4: [] };
    at[hogP].push('hog');
    rungs.forEach((p, i) => {
      const y = ry(i);
      s('circle', { cx: 18, cy: y, r: 12, class: 'f-seg box' }, layer);
      T(layer, 18, y, String(p), 't-fg t-bold', 'middle');
      at[p].forEach((n, k) => {
        const bx = 42 + k * 82, st = state[n];
        const fill = { pick: ['f-ok', 't-on t-bold'], ready: ['f-pri-soft', 't-pri'], sleep: ['f-seg', 't-muted'], starve: ['f-bad', 't-on t-bold'] }[st];
        s('rect', { x: bx, y: y - 13, width: 74, height: 26, rx: 4, class: fill[0] }, layer);
        T(layer, bx + 37, y, n, fill[1], 'middle');
        if (st === 'pick') {
          arrow(layer, 250, y, bx + 80, y, { cls: 'a-ok', width: 2 });
          T(layer, 210, y - 12, 'pick()', 't-ok t-bold', 'middle');
        }
      });
    });
  }
  const run = (n, a, b) => s('rect', { x: tx(a), y: rowY[n] - 11, width: Math.max(tx(b) - tx(a), 4), height: 22, rx: 2, class: 'f-ok sep' }, layer);

  const NOTE = [
    'The deck\'s priorities. At 5 ms the button task wakes and is the most urgent READY task, so pick() returns it at once: it preempts the hog, works for microseconds and sleeps again. The bar does the same at 8 ms. The hog gets every spare cycle.',
    'The student\'s hog at 4 sits above the button task. Every task starts READY, but pick() always returns the hog, which never sleeps, so the button, bar and report tasks never get a first turn. The LED bar freezes, the buttons die and the report stops.',
  ];
  steps(viz('steps'), ['Deck: hog at 1', 'Student: hog at 4'], k => {
    layer.textContent = '';
    if (k === 0) {
      ladder(1, { button: 'pick', bar: 'sleep', report: 'sleep', hog: 'ready', idle: 'ready' });
      T(layer, 0, 268, 'at 5 ms: the button task has just woken', 't-muted');
      const ev = [[0, 'button'], [0.5, 'bar'], [5, 'button'], [8, 'bar'], [10, 'button'], [15, 'button']];
      let t = 0;
      ev.forEach(([at, n]) => { if (at > t) run('hog', t, at); run(n, at, at + 0.5); t = at + 0.5; });
      run('hog', t, 20);
    } else {
      ladder(4, { button: 'starve', bar: 'starve', report: 'starve', hog: 'pick', idle: 'ready' });
      T(layer, 0, 268, 'at any moment: everything else is READY', 't-muted');
      run('hog', 0, 20);
      ['button', 'bar'].forEach(n => {
        s('line', { x1: tx(0), x2: tx(20), y1: rowY[n], y2: rowY[n], class: 's-bad dash', style: 'stroke-width: 2' }, layer);
        T(layer, tx(10), rowY[n] - 14, 'READY since 0 ms, never picked', 't-bad t-sm', 'middle');
      });
    }
    role('note').textContent = NOTE[k];
  }, 1);
});

QV.register('s2-mc28', function (q) {
  const { s, svg, steps } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const T = (g, x, y, str, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls }, g, str);

  const ROWS = [['EXTI · NVIC 0', 50], ['UART · NVIC 1', 100], ['PendSV · NVIC 3', 150], ['Thread · PSP', 212]];
  const RY = ROWS.map(r => r[1]), BH = 26;
  const g = svg(viz('levels'), 720, 262, { label: 'Execution levels over time: task A, a UART handler that pends PendSV, a nested EXTI handler, PendSV switching, then task B', minWidth: 580 });
  ROWS.forEach(([n, y]) => {
    T(g, 0, y, n, 't-fg t-bold');
    s('line', { x1: 140, x2: 712, y1: y, y2: y, class: 'l-grid' }, g);
  });
  s('path', { d: 'M128 36 H122 V164 H128', class: 's-muted' }, g);
  T(g, 116, 174, 'Handler mode, MSP', 't-sm', 'end');
  T(g, 712, 250, 'time →', 't-sm', 'end');

  const parts = [];
  const grp = k => { const e = s('g', { class: 'fade' }, g); parts.push([[].concat(k), e]); return e; };
  const blk = (k, row, a, b, label, fill, text) => {
    const e = grp(k);
    s('rect', { x: a, y: RY[row] - BH / 2, width: b - a, height: BH, rx: 4, class: fill }, e);
    T(e, (a + b) / 2, RY[row], label, text, 'middle');
    return e;
  };
  const link = (k, x, r0, r1) => s('line', { x1: x, x2: x, y1: RY[r0], y2: RY[r1], class: 's-muted dash', style: 'stroke-width: 1' }, grp(k));

  blk(1, 3, 140, 230, 'task A', 'f-seg', 't-fg');
  link(2, 230, 3, 1);
  blk(2, 1, 230, 340, 'decides', 'f-pri', 't-on t-bold');
  T(grp(2), 285, 76, 'schedule(): PENDSVSET', 't-pri t-sm t-bold', 'middle');
  const pend = grp([2, 3, 4]);
  s('line', { x1: 330, x2: 480, y1: RY[2], y2: RY[2], class: 's-ter dash', style: 'stroke-width: 2' }, pend);
  T(pend, 405, RY[2] - 12, 'pending, waits', 't-ter t-sm t-bold', 'middle');
  s('circle', { cx: 330, cy: RY[2], r: 5, class: 'f-ter' }, pend);
  link(3, 340, 1, 0);
  blk(3, 0, 340, 420, 'EXTI', 'f-pri', 't-on t-bold');
  link(4, 420, 0, 1);
  blk(4, 1, 420, 480, 'ends', 'f-pri', 't-on t-bold');
  link(5, 480, 1, 2);
  blk(5, 2, 480, 600, 'save A, load B', 'f-ter', 't-on t-bold');
  T(grp(5), 540, RY[2] + 24, 'tail-chained', 't-ter t-sm', 'middle');
  const wa = grp([2, 3, 4, 5]);
  s('line', { x1: 230, x2: 600, y1: RY[3], y2: RY[3], class: 's-muted dash', style: 'stroke-width: 2' }, wa);
  T(wa, 415, RY[3] - 12, 'A interrupted: 8 words on A\'s stack', 't-muted t-sm', 'middle');
  link(6, 600, 2, 3);
  blk(6, 3, 600, 712, 'task B', 'f-ok', 't-on t-bold');

  const NOTE = [
    'The whole sequence. The decision is made inside the UART handler (step 2). The switch happens only at step 5, after every handler has returned.',
    'Step 1. Task A runs in Thread mode on PSP.',
    'Step 2. A UART interrupt arrives. The hardware stacks 8 words on A\'s stack and the handler runs on MSP. It wakes task B, and schedule() decides B should run: it writes PENDSVSET. Nothing is switched yet; the handler carries on.',
    'Step 3. An EXTI interrupt, NVIC 0, preempts the UART handler. PendSV is still only pending: at priority 3 it cannot preempt anything.',
    'Step 4. EXTI returns to the UART handler, which finishes and returns.',
    'Step 5. No other handler is active, so PendSV tail-chains on the way back to a task. PendSV_Handler saves A\'s r4–r11, sets os_current = B and loads B\'s.',
    'Step 6. PendSV returns with 0xFFFFFFFD and the hardware pops B\'s 8 words: B runs from where it stopped.',
  ];
  steps(viz('steps'), ['All', '1 · Task A', '2 · UART decides', '3 · EXTI nests', '4 · Handlers end', '5 · PendSV switches', '6 · Task B'], k => {
    parts.forEach(([ks, e]) => e.classList.toggle('dim', k > 0 && ks.indexOf(k) < 0));
    role('note').textContent = NOTE[k];
  });
});

QV.register('s2-mc29', function (q) {
  const { s, svg, steps } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const T = (g, x, y, str, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls }, g, str);

  const g = svg(viz('bits'), 720, 340, { label: 'EXC_RETURN decoded: the last hex digit split into bits 3 to 0, and the hardware frame on MSP or PSP', minWidth: 580 });
  T(g, 40, 16, 'EXC_RETURN in lr', 't-fg t-bold');
  const H = { x: 40, w: 40, gap: 4, y: 34, h: 40 };
  const hx = i => H.x + i * (H.w + H.gap);
  for (let i = 0; i < 7; i++) {
    s('rect', { x: hx(i), y: H.y, width: H.w, height: H.h, rx: 3, class: 'f-seg' }, g);
    T(g, hx(i) + H.w / 2, H.y + H.h / 2, 'F', 't-muted t-lg', 'middle');
  }
  s('path', { d: `M${hx(0)} ${H.y + H.h + 6} V${H.y + H.h + 12} H${hx(6) + H.w} V${H.y + H.h + 6}`, class: 's-muted' }, g);
  T(g, (hx(0) + hx(6) + H.w) / 2, H.y + H.h + 24, 'bits 31:4, all ones', 't-muted', 'middle');
  const B = { x: 470, w: 46, gap: 6 };
  const bx = b => B.x + (3 - b) * (B.w + B.gap);
  [3, 2, 1, 0].forEach(b => T(g, bx(b) + B.w / 2, 22, 'bit ' + b, 't-sm', 'middle'));
  const layer = s('g', {}, g);

  const STK = [{ x: 40, name: 'MSP · main stack', sub: 'every handler; main() before os_start' }, { x: 370, name: 'PSP · process stack', sub: 'every task, each on its own stack' }];
  const F = { y: 180, h: 16, w: 150 };
  const FR = ['r0', 'r1', 'r2', 'r3', 'r12', 'lr', 'pc', 'xPSR'];

  function draw(v) {
    layer.textContent = '';
    const nib = v & 0xF, b3 = (nib >> 3) & 1, b2 = (nib >> 2) & 1;
    s('rect', { x: hx(7), y: H.y, width: H.w, height: H.h, rx: 3, class: 'f-pri' }, layer);
    T(layer, hx(7) + H.w / 2, H.y + H.h / 2, nib.toString(16).toUpperCase(), 't-on t-bold t-lg', 'middle');
    s('polygon', { points: `${hx(7) + H.w},${H.y} ${bx(3)},${H.y} ${bx(0) + B.w},${H.y + H.h} ${hx(7) + H.w},${H.y + H.h}`, class: 'area-pri' }, layer);
    [3, 2, 1, 0].forEach(b => {
      const bit = (nib >> b) & 1, key = b === 3 || b === 2;
      s('rect', { x: bx(b), y: H.y, width: B.w, height: H.h, rx: 3, class: key ? (b === 3 ? 'f-ter' : 'f-sec') : 'f-seg' }, layer);
      T(layer, bx(b) + B.w / 2, H.y + H.h / 2, String(bit), key ? 't-on t-bold t-lg' : 't-muted t-lg', 'middle');
    });
    T(layer, B.x, 100, 'bit 3 = ' + b3 + ' → ' + (b3 ? 'Thread mode' : 'Handler mode'), 't-ter t-bold');
    T(layer, B.x, 118, 'bit 2 = ' + b2 + ' → ' + (b2 ? 'PSP' : 'MSP'), 't-sec t-bold');
    T(layer, 40, 126, 'lr = 0x' + v.toString(16).toUpperCase(), 't-fg t-bold t-lg');
    STK.forEach((st, i) => {
      const on = i === b2, cx = st.x + F.w / 2;
      T(layer, st.x, 150, st.name, on ? 't-sec t-bold' : 't-muted t-bold');
      T(layer, st.x, 166, st.sub, 't-muted t-sm');
      if (!on) {
        s('rect', { x: st.x, y: F.y, width: F.w, height: F.h * 8, class: 'f-none box dash' }, layer);
        T(layer, cx, F.y + F.h * 4, 'no frame here', 't-muted', 'middle');
        return;
      }
      FR.forEach((n, w) => {
        const pc = n === 'pc';
        s('rect', { x: st.x, y: F.y + w * F.h, width: F.w, height: F.h, class: (pc ? 'f-ok' : 'f-sec-soft') + ' sep' }, layer);
        T(layer, cx, F.y + w * F.h + F.h / 2, n, pc ? 't-on t-bold t-sm' : 't-sec t-sm', 'middle');
      });
      T(layer, st.x + F.w + 8, F.y + 6 * F.h + F.h / 2, '← frame[6]: faulting pc', 't-ok t-bold');
      T(layer, st.x + F.w + 8, F.y + F.h / 2, '← r0 = the frame address', 't-muted');
      T(layer, st.x, F.y + 8 * F.h + 16, b3 ? (b2 ? 'a task was running' : 'main() was running, no task yet') : 'a handler was running', 't-fg t-bold');
    });
  }
  const VALS = [0xFFFFFFF1, 0xFFFFFFF9, 0xFFFFFFFD];
  const NOTE = [
    '0xFFFFFFF1: the last digit 1 is 0001. Bit 3 = 0, Handler mode; bit 2 = 0, MSP. A handler was running when the fault hit, and its frame is on MSP. This is option B.',
    '0xFFFFFFF9: 9 is 1001. Bit 3 = 1, Thread mode; bit 2 = 0, MSP. Thread code on the main stack, as main() runs before os_start. Option D describes this value, not 0xFFFFFFF1.',
    '0xFFFFFFFD: D is 1101. Bit 3 = 1, Thread mode; bit 2 = 1, PSP. A task was running; every switch in this kernel returns with this value. Option A describes this value.',
  ];
  steps(viz('steps'), VALS.map(v => '0x' + v.toString(16).toUpperCase()), k => {
    draw(VALS[k]);
    role('note').textContent = NOTE[k];
  });
});

QV.register('s2-mc30', function (q) {
  const { s, svg, steps } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const T = (g, x, y, str, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls }, g, str);

  const tx = t => 130 + t * 14.25;
  const ROW = { tick: 44, button: 100, high: 154, low: 208 };
  const BH = 22;
  const g = svg(viz('timeline'), 720, 270, { label: 'Forty milliseconds of the tick, the button task, high and low under one of four protections', minWidth: 580 });
  [['tick', 'tick, every 1 ms'], ['button', 'button · prio 3'], ['high', 'high · prio 2'], ['low', 'low · prio 1']].forEach(([k, n]) => {
    T(g, 0, ROW[k], n, 't-fg t-bold');
    s('line', { x1: tx(0), x2: tx(40), y1: ROW[k], y2: ROW[k], class: 'l-grid' }, g);
  });
  s('line', { x1: tx(0), x2: tx(40), y1: 240, y2: 240, class: 'l-axis' }, g);
  [0, 10, 20, 30, 40].forEach(t => {
    s('line', { x1: tx(t), x2: tx(t), y1: 240, y2: 245, class: 'l-axis' }, g);
    T(g, tx(t), 256, t + (t === 40 ? ' ms' : ''), null, 'middle');
  });
  const layer = s('g', {}, g);

  const run = (row, a, b, fill) => s('rect', { x: tx(a), y: ROW[row] - BH / 2, width: tx(b) - tx(a), height: BH, rx: 2, class: fill + ' sep' }, layer);
  const wait = (row, a, b, cls) => s('line', { x1: tx(a), x2: tx(b), y1: ROW[row], y2: ROW[row], class: cls + ' dash', style: 'stroke-width: 2' }, layer);
  const note = (row, t, str, cls, anchor) => T(layer, tx(t), ROW[row] - 21, str, cls + ' t-sm', anchor || 'middle');
  const dot = (row, t, cls) => s('circle', { cx: tx(t), cy: ROW[row], r: 5, class: cls }, layer);
  const ticks = held => {
    for (let t = 1; t <= 40; t++) {
      const h = held && t < 30;
      s('line', { x1: tx(t), x2: tx(t), y1: ROW.tick - 8, y2: ROW.tick + 8, class: h ? 's-bad dash' : 's-muted', style: 'stroke-width: 1.5' }, layer);
    }
  };
  const button = () => [5, 15, 25, 35].forEach(t => run('button', t, t + 0.5, 'f-ter'));

  const OPT = [
    () => {
      ticks(true);
      note('tick', 15, 'ticks 1–29 held off', 't-bad t-bold');
      run('low', 0, 30, 'f-pri');
      T(layer, tx(15), ROW.low, 'PRIMASK = 1 for 30 ms', 't-on t-bold', 'middle');
      [5, 15, 25].forEach(t => dot('button', t, 'f-bad'));
      wait('button', 5, 30, 's-bad');
      note('button', 17.5, 'wake-ups at 5, 15, 25 ms held off', 't-bad');
      dot('high', 10, 'f-bad');
      wait('high', 10, 30, 's-bad');
      note('high', 20, 'cannot wake until 30 ms', 't-bad');
      T(layer, tx(35), ROW.high, 'late', 't-bad t-bold', 'middle');
      T(layer, tx(35), ROW.button, 'late', 't-bad t-bold', 'middle');
    },
    () => {
      ticks(false);
      button();
      run('low', 0, 5, 'f-pri');
      run('low', 5.5, 10, 'f-pri');
      note('low', 2.5, 'busy = 1', 't-pri t-bold');
      wait('low', 10, 40, 's-bad');
      note('low', 25, 'READY, never runs again: busy stays 1', 't-bad t-bold');
      [[10, 15], [15.5, 25], [25.5, 35], [35.5, 40]].forEach(([a, b]) => run('high', a, b, 'f-bad'));
      note('high', 25, 'while (busy) { } spins forever', 't-bad t-bold');
    },
    () => {
      ticks(false);
      button();
      [[0, 5], [5.5, 10], [11, 15], [15.5, 25], [25.5, 32.5]].forEach(([a, b]) => run('low', a, b, 'f-pri'));
      note('low', 0, 'PENDSVCLR', 't-pri t-bold', 'start');
      run('high', 10, 11, 'f-bad');
      note('high', 10, 'reads a part-written table', 't-bad t-bold', 'start');
    },
    () => {
      ticks(false);
      button();
      [[0, 5], [5.5, 10], [10.5, 15], [15.5, 25], [25.5, 32]].forEach(([a, b]) => run('low', a, b, 'f-pri'));
      note('low', 0, 'lock', 't-pri t-bold', 'start');
      note('low', 32, 'unlock', 't-pri t-bold');
      run('high', 10, 10.5, 'f-sec');
      wait('high', 10.5, 32, 's-muted');
      note('high', 21, 'BLOCKED in os_mutex_lock, off the CPU', 't-muted');
      run('high', 32, 33, 'f-sec');
      T(layer, tx(33) + 6, ROW.high, 'reads all of it', 't-sec t-bold');
    },
  ];
  const NOTE = [
    'A · masking. For 30 ms PRIMASK holds off every interrupt, the 1 ms tick included, so no task can wake. The button task misses its 5, 15 and 25 ms wake-ups and high its 10 ms one. Fine for a few instructions, not for 30 ms.',
    'B · a busy flag. High wakes at 10 ms, finds busy = 1 and spins. High (2) outranks low (1) and never sleeps, so low never runs again and busy is never cleared. Only the button task, above both, still runs.',
    'C · PENDSVCLR. It cancels only the switch pending at that moment. At 10 ms the tick wakes high and pends PendSV again, so high preempts low and reads a table that is only partly written.',
    'D · a mutex. High wakes at 10 ms, calls os_mutex_lock and is BLOCKED, off the CPU, until low unlocks. The tick and the button task are never held up. While high waits, low runs at high\'s priority (slide 14).',
  ];
  steps(viz('steps'), ['A · mask IRQs', 'B · busy flag', 'C · PENDSVCLR', 'D · mutex'], k => {
    layer.textContent = '';
    OPT[k]();
    role('note').textContent = NOTE[k];
  }, 3);
});
