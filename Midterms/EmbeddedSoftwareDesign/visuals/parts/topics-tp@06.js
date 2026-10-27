QV.register('topic6', function (q) {
  const { s, svg, axes, line, box, arrow, steps, slider, table } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const L = t => ({ text: t, cls: 'l' });
  const H = t => ({ html: t, cls: 'l' });
  const ltable = (name, head, rows) => table(viz(name), head.map(L), rows.map(r => r.map(c => (typeof c === 'string' ? L(c) : c))));
  const hex = (v, n) => '0x' + v.toString(16).toUpperCase().padStart(n, '0');
  const grp = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const tx = (g, x, y, text, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls || null }, g, text);
  const fx = (v, d) => String(+v.toFixed(d));

  // ---------- tables ----------
  ltable('pins', ['Pin', 'Mode', 'Job in this lesson'], [
    ['PA2, PA3', 'AF1', 'USART2 TX and RX, the serial monitor at 115200 baud'],
    ['PA5', 'output', 'LD4 heartbeat, the on-board LED'],
    ['PA6', 'AF1', 'TIM3_CH1, PWM to the servo'],
    ['PA7', 'AF4', 'TIM14_CH1, capture of the HC-SR04 echo; also EXTI line 7 (slide 13b)'],
    ['PA8', 'output', 'HC-SR04 trigger'],
    ['PB0–PB7', 'output', 'proximity bar, one bit per LED'],
  ]);

  ltable('systick-regs', ['Offset', 'Register', 'Fields', 'Its job'], [
    ['0x00', 'CTRL (SYST_CSR)', '16 COUNTFLAG, 2 CLKSOURCE, 1 TICKINT, 0 ENABLE', 'on, interrupt on, clock source, and the wrap flag'],
    ['0x04', 'LOAD (SYST_RVR)', '23:0 RELOAD', 'the count to restart from: period − 1'],
    ['0x08', 'VAL (SYST_CVR)', '23:0 CURRENT', 'the live count, down to 0; any write clears it'],
    ['0x0C', 'CALIB (SYST_CALIB)', '31 NOREF, 30 SKEW, 23:0 TENMS', 'read-only: what the chip says 10 ms is'],
  ]);

  ltable('timregs', ['Offset', 'Register', 'Group', 'Its job', 'TIM3: servo PWM', 'TIM14: echo capture'], [
    ['0x00', 'CR1', 'control', 'run, preload, direction', 'CEN, ARPE', 'CEN'],
    ['0x0C', 'DIER', 'events', 'which events raise an interrupt', 'UIE', 'CC1IE'],
    ['0x10', 'SR', 'events', 'event flags: write 0 to clear', 'UIF', 'CC1IF'],
    ['0x14', 'EGR', 'events', 'make an event happen now, by software', 'UG', 'UG'],
    ['0x18', 'CCMR1', 'channel', 'channels 1–2: output mode or input mode', 'OC1M, OC1PE', 'CC1S'],
    ['0x20', 'CCER', 'channel', 'connect a channel to its pin, pick polarity', 'CC1E', 'CC1E, CC1P, CC1NP'],
    ['0x24', 'CNT', 'time base', 'the counter itself', 'counts; never read', 'read: stopwatch for the 10 µs trigger'],
    ['0x28', 'PSC', 'time base', 'prescaler: count every PSC + 1 clocks', '47', '47'],
    ['0x2C', 'ARR', 'time base', 'auto-reload: count 0 … ARR, then update', '19999', '0xFFFF'],
    ['0x34', 'CCR1', 'channel', 'channel 1 compare value or captured time', 'pulse width, µs', 'edge time, µs'],
  ]);

  ltable('pwmregs', ['TIM3 register', 'Value', 'Bits that make it'], [
    ['CCMR1', '0x00000068', 'OC1M, bits 6:4 = 110 (0x60), plus OC1PE, bit 3 (0x08). OC1M has a fourth bit, OC1M_3, far away at bit 16; it stays 0'],
    ['CR1', '0x0081', 'ARPE, bit 7 (0x80), then CEN, bit 0'],
    ['CCER', '0x0001', 'CC1E, bit 0: channel 1 reaches the pin'],
  ]);

  ltable('aftable', ['Signal', 'PA6', 'PB4', 'PB6', 'PB7', 'PC6'], [
    ['TIM3_CH1', { text: 'AF1', cls: 'l hl' }, 'AF1', 'AF12', 'AF11', 'AF1'],
  ]);

  ltable('capregs', ['TIM14 register', 'Value', 'Bits that make it'], [
    ['CCMR1', '0x0001', 'CC1S = 01: channel 1 is an input, from TI1 (the pin)'],
    ['CCER', '0x000B', 'CC1NP bit 3 and CC1P bit 1 = 1, 1: both edges; CC1E bit 0: capture enabled'],
    ['CCER, rising only', '0x0001', 'CC1P = CC1NP = 0: no falling edge, so no width (slide 17)'],
  ]);

  ltable('clears', ['Flag', 'Register', 'How it clears', 'The line'], [
    ['EXTI pending (lesson 05)', 'EXTI->RPR1, FPR1', 'write 1', H('<code>EXTI-&gt;FPR1 = mask;</code>')],
    ['timer update, UIF', 'TIM3->SR', 'write 0', H('<code>TIM3-&gt;SR = ~TIM_SR_UIF;</code>')],
    ['timer capture, CC1IF', 'TIM14->SR', 'read CCR1, no write', H('<code>t = TIM14-&gt;CCR1;</code>')],
    ['SysTick', 'none', 'taking the exception', '—'],
  ]);

  ltable('priotable', ['Source', 'Number', 'Priority', 'Why: the deadline'], [
    ['TIM14 capture', 'IRQ 19', '1', 'its read must happen before the next edge overwrites CCR1'],
    ['TIM3 update', 'IRQ 16', '2', 'must set CCR1 within the 20 ms frame: generous'],
    ['SysTick', 'exception 15', '3, the lowest', 'a late tick is still counted; nothing is lost'],
    ['EXTI4_15 (the Wokwi echo path)', 'IRQ 7', '1', 'the same edge job as capture (set in Main.c)'],
  ]);

  ltable('checklist', ['Forgot', 'Symptom', 'Why this symptom follows'], [
    [H('<code>RCC-&gt;APBENR1/2</code> clock gate (TIM3EN in APBENR1, TIM14EN in APBENR2)'), 'registers read 0, nothing counts',
      'Every peripheral clock is off at reset. Without it the timer\'s registers ignore writes and read back 0, so PSC, ARR and CEN never take effect and CNT never moves.'],
    [H('<code>EGR = UG</code> after setting PSC/ARR'), 'first period at the wrong rate',
      'PSC is buffered. The new value waits in preload until an update event, so the first period runs with the old prescaler, 0: 0.42 ms instead of 20 ms. After that first update every period is right.'],
    [H('<code>−1</code> in PSC or ARR'), '2% off, only a cross-check notices',
      'Both registers hold N − 1. PSC = 48 divides by 49: 48.98 Hz, 2 % slow (ARR = 20000 counts 20 001, only 0.005 % off). Nothing fails and no flag is set, so only a second clock, TIM3 counted against SysTick, shows it.'],
    ['clearing UIF by writing 1', 'handler re-enters forever',
      'Timer flags clear on 0 and ignore 1. SR = TIM_SR_UIF writes 0 to every other flag and 1 to UIF, so UIF stays set. On return the IRQ is still pending and the handler runs again at once. SysTick (priority 3) starves and time stops; the PWM keeps running in hardware.'],
    ['the pin\'s AF number', 'timer runs, pin is dead',
      'AFR picks which peripheral drives the pin. A wrong number connects PA6 to another signal or to nothing. The timer and its interrupt are untouched, so the report still says 50/s.'],
    [H('<code>CCER.CC1E</code>'), 'same: the channel never reaches the pin',
      'CC1E is the switch between the channel\'s output and the pin. The waveform exists inside the timer and stops there.'],
    ['both capture edges', 'rising edges only: no widths, ever',
      'A width is fall − rise. With CCER = 0x1 only rising edges capture, the falling branch of the ISR never runs, and echo_us never gets a value. CC1P = CC1NP = 1 (CCER = 0xB) captures both.'],
    ['handler name, exactly', H('vector stays <code>Default_Handler</code> (lesson 05)'),
      'The vector table holds weak aliases. Only a function with exactly the right name, TIM3_IRQHandler, replaces one at link time. A misspelt handler is an ordinary unused function, and the first interrupt parks the core in Default_Handler\'s for(;;).'],
  ]);

  ltable('contrast', ['Idea', 'Alternatives', 'This chip, this lesson', 'What follows'], [
    ['Scheduling', 'cooperative superloop vs preemptive kernel (RTOS)', 'both: lesson 06 cooperative, lesson 07 preemptive',
      'Cooperative: a job stops only when it returns, so one 50 ms job delays every other job by 50 ms. Preemptive: the kernel\'s SysTick takes the CPU away from a running job.'],
    ['Keeping time', 'polling a flag vs an interrupt', 'SysTick interrupt, ms_ticks++',
      'Polling depends on the loop coming back. COUNTFLAG remembers one wrap, so a busy loop loses ticks; the interrupt counts through any printf.'],
    ['The system tick', 'a vendor timer vs the core\'s own timer', 'SysTick, part of every Cortex-M',
      'Same address and registers on every Cortex-M, so every RTOS uses it as its heartbeat.'],
    ['Making a waveform', 'software toggles a pin vs hardware output compare', 'output compare, PWM mode 1 on TIM3',
      'No CPU per edge. The ISR only changes CCR1, and the preload keeps every pulse whole.'],
    ['Timestamping an edge', 'an ISR reads a clock vs hardware input capture', 'capture on silicon; EXTI + TIM14->CNT in Wokwi',
      'Capture stamps the edge itself, so latency changes when you read it, not the value. EXTI is right only while both edges see the same latency.'],
    ['Comparing times', 'absolute deadline vs elapsed time', 'elapsed: now − start, unsigned',
      'Modulo arithmetic is right across the wrap. >= deadline breaks at the wrap: 49.7 days for millis(), 65.5 ms for TIM14.'],
    ['Changing timer settings', 'take effect at once vs double-buffered', 'PSC always buffered; ARR with ARPE, CCR1 with OC1PE',
      'A duty change never cuts a pulse in half, but a new PSC waits for an update event: write EGR = UG.'],
    ['Clearing a flag', 'write 1, write 0, read, or nothing', 'all four, on one chip',
      'EXTI write 1, TIM SR write 0, CC1IF by reading CCR1, SysTick by taking the exception. The wrong one fails without a warning.'],
    ['Assigning priorities', 'by importance vs by deadline', 'by deadline (deadline-monotonic)',
      'TIM14 capture 1, TIM3 update 2, SysTick 3: the shortest deadline gets the most urgent number.'],
  ]);

  // ---------- Figure 1: polled COUNTFLAG vs SysTick interrupt ----------
  const P = { x0: 120, px: 44, wrap: 30, main: 82, isr: 124, cnt: 160, axis: 186, p0: 2.4, p1: 10.2 };
  const pX = t => P.x0 + t * P.px;
  const poll = svg(viz('poll'), 730, 214, { label: 'Twelve SysTick wraps with a printf blocking the loop: polling counts 5, the interrupt counts all 12', minWidth: 560 });
  [['SysTick wraps', P.wrap], ['main()', P.main], ['SysTick_Handler', P.isr], ['ms count', P.cnt]].forEach(([t, y]) => tx(poll, 0, y, t, 't-fg t-bold'));
  s('line', { x1: pX(0), x2: pX(12), y1: P.axis, y2: P.axis, class: 'l-axis' }, poll);
  for (let t = 0; t <= 12; t++) {
    s('line', { x1: pX(t), x2: pX(t), y1: P.axis, y2: P.axis + 5, class: 'l-axis' }, poll);
    if (t % 2 === 0) s('text', { x: pX(t), y: P.axis + 18, 'text-anchor': 'middle' }, poll, t === 12 ? '12 ms' : String(t));
  }
  const pg = s('g', {}, poll);
  function drawPoll(irq) {
    pg.textContent = '';
    s('rect', { x: pX(0), y: P.main - 3, width: pX(P.p0) - pX(0), height: 6, rx: 2, class: 'f-seg' }, pg);
    s('rect', { x: pX(P.p1), y: P.main - 3, width: pX(12) - pX(P.p1), height: 6, rx: 2, class: 'f-seg' }, pg);
    tx(pg, pX(0), P.main - 13, irq ? 'loop runs' : 'polls COUNTFLAG', 't-sm');
    s('rect', { x: pX(P.p0), y: P.main - 12, width: pX(P.p1) - pX(P.p0), height: 24, rx: 3, class: 'f-ter-soft' }, pg);
    tx(pg, (pX(P.p0) + pX(P.p1)) / 2, P.main, 'printf, 90 chars ≈ 7.8 ms', 't-fg', 'middle');
    for (let t = 1; t <= 12; t++) {
      const busy = t > P.p0 && t < P.p1;
      const st = irq || !busy ? 'ok' : t === 3 ? 'ter' : 'bad';
      s('circle', { cx: pX(t), cy: P.wrap, r: 7, class: 'f-' + st }, pg);
      if (st === 'bad') tx(pg, pX(t), P.wrap, '×', 't-on t-bold', 'middle');
      if (irq) s('rect', { x: pX(t) - 3, y: P.isr - 9, width: 6, height: 18, rx: 1, class: 'f-pri' }, pg);
    }
    const ev = irq ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((t, i) => [t, i + 1, 't-ok']) : [[1, 1, 't-ok'], [2, 2, 't-ok'], [P.p1, 3, 't-ter'], [11, 4, 't-ok'], [12, 5, 't-ok']];
    ev.forEach(([t, n, c]) => tx(pg, pX(t), P.cnt, String(n), c + ' t-bold', 'middle'));
    tx(pg, pX(12) + 14, P.cnt, irq ? '12 of 12' : '5 of 12', (irq ? 't-ok' : 't-bad') + ' t-bold');
    if (irq) {
      tx(pg, pX(1) - 3, P.isr - 18, 'ms_ticks++ at every wrap, even inside printf', 't-pri');
    } else {
      tx(pg, pX(0), P.isr, 'not used: lesson 05 polls', 't-muted');
      s('line', { x1: pX(3), x2: pX(P.p1), y1: P.wrap + 13, y2: P.wrap + 13, class: 's-ter', style: 'stroke-width: 1.5' }, pg);
      tx(pg, (pX(3) + pX(P.p1)) / 2, P.wrap + 22, 'COUNTFLAG = 1: one wrap remembered, 7 lost', 't-ter halo', 'middle');
      s('line', { x1: pX(P.p1), x2: pX(P.p1), y1: P.main + 14, y2: P.cnt - 9, class: 's-ter dash', style: 'stroke-width: 1.5' }, pg);
    }
  }
  steps(viz('poll-steps'), ['Polled COUNTFLAG (lesson 05)', 'SysTick interrupt (lesson 06)'], k => {
    drawPoll(k === 1);
    role('poll-note').textContent = k === 1
      ? 'Interrupt. Every wrap forces SysTick_Handler to run for a moment, even in the middle of printf, and ms_ticks++ counts it. After 12 ms the clock says 12.'
      : 'Polled. Wraps 1 and 2 are seen at once. Wrap 3 sets COUNTFLAG while printf runs, and the flag simply stays set: wraps 4 to 10 leave no trace. When printf returns at 10.2 ms the loop sees one wrap. After 12 ms the clock says 5.';
  });

  // ---------- Figure 2: LOAD in 24 bits ----------
  const PER = [1, 2, 10, 100, 200, 349, 350, 500, 1000];
  const B = { x0: 70, c: 19, y: 40, h: 26 };
  const bX = i => B.x0 + (31 - i) * B.c;
  const ld = svg(viz('load'), 700, 128, { label: 'SysTick LOAD drawn as 32 bits; only bits 23 to 0 exist', minWidth: 560 });
  tx(ld, bX(31), 10, 'not in SysTick', 't-muted');
  tx(ld, bX(23), 10, 'RELOAD, bits 23:0', 't-fg t-bold');
  [31, 24, 23, 16, 8, 0].forEach(i => tx(ld, bX(i) + B.c / 2, 27, String(i), 't-sm', 'middle'));
  tx(ld, 0, B.y + B.h / 2, 'LOAD', 't-fg t-bold');
  tx(ld, 0, B.y + B.h + 16, 'hex', 't-muted');
  const lg = s('g', {}, ld);
  s('line', { x1: bX(23), x2: bX(23), y1: B.y - 6, y2: B.y + B.h + 26, class: 's-fg' }, ld);
  function drawLoad(v) {
    lg.textContent = '';
    for (let i = 31; i >= 0; i--) {
      const bit = Math.floor(v / 2 ** i) % 2, hi = i > 23;
      s('rect', { x: bX(i), y: B.y, width: B.c, height: B.h, class: (bit ? (hi ? 'f-bad' : 'f-pri') : 'f-seg') + ' sep', style: hi && !bit ? 'opacity: 0.45' : null }, lg);
      tx(lg, bX(i) + B.c / 2, B.y + B.h / 2, String(bit), bit ? 't-on' : 't-muted', 'middle');
    }
    for (let n = 7; n >= 0; n--) {
      const d = Math.floor(v / 16 ** n) % 16;
      if (n < 7) s('line', { x1: bX(4 * n + 3), x2: bX(4 * n + 3), y1: B.y + B.h + 6, y2: B.y + B.h + 26, class: 's-line' }, lg);
      tx(lg, bX(4 * n + 3) + 2 * B.c, B.y + B.h + 16, d.toString(16).toUpperCase(), n > 5 ? (d ? 't-bad t-bold' : 't-muted') : 't-fg t-bold', 'middle');
    }
    const ok = v <= 0xFFFFFF;
    tx(lg, B.x0, B.y + B.h + 44, ok ? `${hex(v, 6)} ≤ 0xFFFFFF: fits in 24 bits` : `${hex(v, 7)} > 0xFFFFFF: needs bit 24, SysTick cannot hold it`, ok ? 't-ok t-bold' : 't-bad t-bold');
  }
  slider(viz('load-slider'), { label: 'tick period', min: 0, max: PER.length - 1, step: 1, value: 0, fmt: i => PER[i] + ' ms' }, i => {
    const ms = PER[i], ticks = 48000 * ms, v = ticks - 1, ok = v <= 0xFFFFFF;
    drawLoad(v);
    role('ticks').textContent = grp(ticks);
    role('loadv').textContent = hex(v, 4);
    role('loadd').textContent = grp(v);
    const r = role('ret');
    r.textContent = ok ? '0' : '1';
    r.className = ok ? 'v ok' : 'v';
    role('rets').textContent = ok ? `configured: ${fx(1000 / ms, 2)} ticks a second` : 'nothing configured';
  });

  // ---------- Figure 3: modular subtraction on the unrolled ring ----------
  const RG = { x0: 60, x1: 660, line: 62 };
  const ring = svg(viz('ring'), 720, 188, { label: 'A counter cut open around its wrap, with start, now and the forward distance now minus start', minWidth: 560 });
  const rgG = s('g', {}, ring);
  const RCASES = [
    { title: '32-bit millisecond counter around the wrap, to scale', lo: -512, hi: 512, wrap: '0xFFFFFFFF → 0x00000000',
      ticks: [[-512, '0xFFFFFE00'], [-256, '0xFFFFFF00'], [0, '0x00000000'], [256, '0x00000100'], [512, '0x00000200']],
      marks: [[-256, 'start', '0xFFFFFF00', 'pri', 'middle'], [256, 'now', '0x00000100', 'pri', 'middle']],
      span: [-256, 256, 'now − start = 0x200 = 512'],
      verdict: [['512 ≥ 500: expired, and the subtraction knows it across the wrap', 't-ok']],
      note: 'start was taken 256 ms before the wrap, and 512 ms have passed. now is a small number and start a huge one, yet now − start is exactly the distance between them, because unsigned subtraction wraps the same way the counter does.',
      calc: 'start        = 0xFFFFFF00\nnow          = 0x00000100      (512 ms later, after the wrap)\nnow - start  = 0x00000100 − 0xFFFFFF00, modulo 2³²\n             = 0x00000200 = 512\n512 ≥ 500    → the 500 ms timeout has expired' },
    { title: '32-bit millisecond counter around the wrap, to scale', lo: -512, hi: 512, wrap: '0xFFFFFFFF → 0x00000000',
      ticks: [[-512, '0xFFFFFE00'], [-256, '0xFFFFFF00'], [0, '0x00000000'], [256, '0x00000100'], [512, '0x00000200']],
      marks: [[-256, 'start', '0xFFFFFF00', 'pri', 'end'], [-240, 'now', '0xFFFFFF10', 'pri', 'start'], [244, 'deadline', '0x000000F4', 'bad', 'middle']],
      span: [-256, -240, 'now − start = 16'],
      verdict: [['wrong form: 0xFFFFFF10 ≥ 0x000000F4 is true, it fires 484 ms early', 't-bad'], ['right form: 16 < 500, keep waiting', 't-ok']],
      note: 'The deadline start + 500 overflows and wraps to the small number 0xF4. Only 16 ms after start, now is still a huge number, so now >= deadline is already true. The subtraction form measures the 16 ms that really passed.',
      calc: 'start        = 0xFFFFFF00\ndeadline     = start + 500 = 0x1000000F4 → wraps to 0x000000F4 = 244\nnow          = 0xFFFFFF10      (16 ms after start)\nWRONG  now >= deadline   4 294 967 056 ≥ 244   → true, fires 484 ms early\nRIGHT  now - start       0x10 = 16 < 500       → keep waiting' },
    { title: 'TIM14\'s 16-bit CNT around the wrap, to scale', lo: -10000, hi: 30000, wrap: '65535 → 0',
      ticks: [[-10000, '55536'], [0, '0'], [10000, '10000'], [20000, '20000'], [30000, '30000']],
      marks: [[-5536, 'rise', 'CCR1 = 60000', 'pri', 'middle'], [17664, 'fall', 'CCR1 = 17664', 'pri', 'middle']],
      span: [-5536, 17664, '(uint16_t)(17664 − 60000) = 23 200 µs'],
      verdict: [['23 200 µs / 58 µs per cm = 400 cm, the longest echo', 't-ok']],
      note: 'TIM14 counts microseconds in 16 bits and wraps every 65.536 ms. The echo rose at 60000 and fell after the wrap, at 17664. Cast to uint16_t, the subtraction wraps the same way, so it gives the true width. The longest echo, 23.2 ms, is far shorter than one wrap.',
      calc: 'rise = 60000, CNT wraps 65535 → 0, fall = 17664\n(uint16_t)(17664 − 60000) = −42336 + 65536 = 23200 µs\n23200 µs / 58 µs per cm   = 400 cm' },
  ];
  function drawRing(c) {
    rgG.textContent = '';
    const rx = v => RG.x0 + (v - c.lo) / (c.hi - c.lo) * (RG.x1 - RG.x0);
    tx(rgG, 0, 10, c.title, 't-fg t-bold');
    tx(rgG, rx(0), 26, 'wrap: ' + c.wrap, 't-ter t-bold', 'middle');
    s('line', { x1: RG.x0, x2: RG.x1, y1: RG.line, y2: RG.line, class: 's-muted' }, rgG);
    c.ticks.forEach(([v, t]) => {
      s('line', { x1: rx(v), x2: rx(v), y1: RG.line - 6, y2: RG.line, class: 'l-axis' }, rgG);
      tx(rgG, rx(v), 44, t, 't-sm', 'middle');
    });
    s('line', { x1: rx(0), x2: rx(0), y1: 51, y2: RG.line + 6, class: 's-ter dash', style: 'stroke-width: 1.5' }, rgG);
    c.marks.forEach(([v, name, val, cls, anchor]) => {
      const x = rx(v), lx = anchor === 'end' ? x - 7 : anchor === 'start' ? x + 7 : x;
      s('polygon', { points: `${x},${RG.line + 2} ${x - 5},${RG.line + 11} ${x + 5},${RG.line + 11}`, class: 'f-' + cls }, rgG);
      tx(rgG, lx, 84, name, 't-' + cls + ' t-bold', anchor);
      tx(rgG, lx, 98, val, 't-' + cls, anchor);
    });
    const [a, b, lab] = c.span, xa = rx(a), xb = rx(b);
    s('line', { x1: xa, x2: xb, y1: 116, y2: 116, class: 's-ok' }, rgG);
    [xa, xb].forEach(x => s('line', { x1: x, x2: x, y1: 110, y2: 122, class: 's-ok', style: 'stroke-width: 2' }, rgG));
    tx(rgG, (xa + xb) / 2, 132, lab, 't-ok t-bold', 'middle');
    c.verdict.forEach(([t, cls], i) => tx(rgG, RG.x0, 156 + i * 16, t, cls + ' t-bold'));
  }
  steps(viz('ring-steps'), ['Across the wrap', 'Wrong form: >= deadline', '16 bits: TIM14 echo'], k => {
    const c = RCASES[k];
    drawRing(c);
    role('ring-note').textContent = c.note;
    role('ring-calc').textContent = c.calc;
  });

  // ---------- Figure 4: the superloop schedule ----------
  const SL = { x0: 124, x1: 704, t1: 1100, axis: 196, lanes: [40, 98, 156] };
  const sX = t => SL.x0 + t / SL.t1 * (SL.x1 - SL.x0);
  const loop = svg(viz('loop'), 720, 228, { label: 'Superloop timeline: ping every 100 ms, report every 1000 ms, LED beat every 500 ms', minWidth: 560 });
  s('line', { x1: SL.x0, x2: SL.x1, y1: SL.axis, y2: SL.axis, class: 'l-axis' }, loop);
  for (let t = 0; t <= 1100; t += 100) {
    s('line', { x1: sX(t), x2: sX(t), y1: SL.axis, y2: SL.axis + 5, class: 'l-axis' }, loop);
    if (t % 200 === 0) s('text', { x: sX(t), y: SL.axis + 18, 'text-anchor': 'middle' }, loop, t === 1000 ? '1000 ms' : String(t));
  }
  const lpG = s('g', {}, loop);
  const range = (n, f) => Array.from({ length: n }, (_, k) => f(k));
  const late = (d, lim) => (d === 0 ? null : d > lim ? 't-bad' : 't-ter');
  const LOOPS = [
    { lanes: [
      { name: 'ping', sub: 'every 100 ms', per: 100, runs: range(11, k => [100 * k, 1, 0]) },
      { name: 'report', sub: 'every 1000 ms', per: 1000, runs: [[0, 8, 0], [1000, 8, 0]] },
      { name: 'beat', sub: 'every 500 ms', per: 500, runs: [[8, 1, 8], [500, 1, 0], [1008, 1, 8]] },
    ], note: 'Every job is short, so each runs within a few milliseconds of its grid line. The report\'s printf takes about 8 ms, so the beat due at the same moment starts 8 ms late; beat_at += 500 still puts the next beat on the grid.' },
    { lanes: [
      { name: 'ping', sub: 'ping_at += 100', per: 100, runs: range(11, k => [100 * k + 3, 1, 3]) },
      { name: 'ping', sub: 'ping_at = now', per: 100, cls: 'sec', runs: range(11, k => [103 * k + 3, 1, 3 * (k + 1)]) },
    ], note: 'Suppose every pass reaches the ping 3 ms after it is due. With ping_at += 100 each ping is 3 ms late and stays 3 ms late. With ping_at = now each late start becomes the new schedule, so the error grows: 33 ms behind after eleven pings, and it keeps growing.' },
    { lanes: [
      { name: 'ping', sub: 'every 100 ms', per: 100, runs: range(11, k => [100 * k, 1, 0]) },
      { name: 'report', sub: 'every 1000 ms', per: 1000, runs: [[0, 8, 0], [1000, 50, 0, 'bad']] },
      { name: 'beat', sub: 'every 500 ms', per: 500, runs: [[8, 1, 8], [500, 1, 0], [1050, 1, 50]] },
    ], busy: [1000, 1050], note: 'The report at 1000 ms takes 50 ms. Nothing else runs until it returns, so the beat due at 1000 ms starts at 1050 ms, and any ping due in that window would wait too. That is cooperative scheduling. Lesson 07\'s preemptive kernel would take the CPU away on a tick instead.' },
  ];
  function drawLoop(st) {
    lpG.textContent = '';
    if (st.busy) {
      const [a, b] = st.busy;
      s('rect', { x: sX(a), y: 18, width: sX(b) - sX(a), height: SL.axis - 18, class: 'area-sec' }, lpG);
      tx(lpG, sX(b) + 4, 14, 'loop stuck in report', 't-sec t-bold', 'end');
    }
    st.lanes.forEach((ln, i) => {
      const y = SL.lanes[i], cls = ln.cls || 'pri';
      tx(lpG, 0, y - 6, ln.name, 't-fg t-bold');
      tx(lpG, 0, y + 8, ln.sub, cls === 'sec' ? 't-sec t-sm' : 't-sm');
      for (let t = 0; t <= SL.t1; t += ln.per) s('line', { x1: sX(t), x2: sX(t), y1: y - 16, y2: y + 16, class: 's-muted dash', style: 'stroke-width: 1; opacity: 0.6' }, lpG);
      ln.runs.forEach(([t, d, off, c]) => {
        if (t > SL.t1) return;
        s('rect', { x: sX(t), y: y - 9, width: Math.max(3, sX(t + d) - sX(t)), height: 18, rx: 1, class: 'f-' + (c || cls) }, lpG);
        const lc = late(off, 10);
        if (lc) tx(lpG, sX(t) + 1, y + 22, '+' + off, lc + ' t-sm', 'middle');
      });
    });
  }
  steps(viz('loop-steps'), ['1 · Short jobs', '2 · Late passes: += vs = now', '3 · One 50 ms job'], k => {
    drawLoop(LOOPS[k]);
    role('loop-note').textContent = LOOPS[k].note;
  });

  // ---------- Figure 5: the time base ----------
  const TB = [
    { psc: 47, arr: 19999, note: 'PSC = 47 divides 48 MHz by 48, so CNT counts once per microsecond. ARR = 19999 gives 20 000 counts, 0 to 19999, so one update every 20 ms: 50 Hz, the servo frame.' },
    { psc: 48, arr: 19999, note: 'PSC = 48 divides by 49. Each count lasts 1.0208 µs and each frame 20.42 ms: 48.98 Hz instead of 50, about 2 % slow. The ramps slide away from the faint correct ones, and nothing in the hardware complains.' },
    { psc: 23, arr: 19999, note: 'PSC = 23 divides by 24, so CNT counts at 2 MHz and the same 20 000 counts take 10 ms: 100 Hz. With counts of 0.5 µs, CCR1 = 1500 is now a 750 µs pulse (Lab check T9).' },
    { psc: 47, arr: 65535, note: 'TIM14 for the echo: the same 1 µs count, and ARR = 0xFFFF lets CNT run through all 65 536 values. It wraps every 65.536 ms, which the 16-bit subtraction of slide 13 survives.' },
  ];
  const tb = svg(viz('tbase'), 720, 266, { label: 'Timer counter CNT against time for several PSC and ARR settings, with update events', minWidth: 560 });
  const a5 = axes(tb, { x: 70, y: 30, w: 620, h: 186, xd: [0, 140], yd: [0, 70000], xt: [0, 20, 40, 60, 80, 100, 120, 140], yt: [0, 19999, 65535], yf: v => String(v), xl: 'time (ms)', yl: 'CNT' });
  const tbG = s('g', {}, tb);
  const ramp = (psc, arr) => {
    const T = (psc + 1) * (arr + 1) / 48000, pts = [], ups = [];
    for (let k = 0; k * T < 140; k++) {
      const t0 = k * T, t1 = Math.min(t0 + T, 140);
      pts.push([a5.x(t0), a5.y(0)], [a5.x(t1), a5.y(arr * (t1 - t0) / T)]);
      if (t0 + T <= 140) ups.push(t0 + T);
    }
    return { T, pts, ups };
  };
  const ref = ramp(47, 19999);
  steps(viz('tbase-steps'), ['TIM3: PSC 47, ARR 19999', 'PSC 48: forgot the −1', 'PSC 23, ARR 19999', 'TIM14: PSC 47, ARR 0xFFFF'], k => {
    const c = TB[k], r = ramp(c.psc, c.arr);
    tbG.textContent = '';
    if (k > 0) line(tbG, ref.pts, 's-muted dash').setAttribute('style', 'opacity: 0.55; stroke-width: 1.5');
    line(tbG, r.pts, 's-pri');
    r.ups.forEach(t => s('circle', { cx: a5.x(t), cy: a5.y(0), r: 4, class: 'f-ok' }, tbG));
    const yb = a5.y(c.arr) - 9;
    s('line', { x1: a5.x(0), x2: a5.x(r.T), y1: yb, y2: yb, class: 's-fg', style: 'stroke-width: 1' }, tbG);
    [0, r.T].forEach(t => s('line', { x1: a5.x(t), x2: a5.x(t), y1: yb - 4, y2: yb + 4, class: 's-fg', style: 'stroke-width: 1' }, tbG));
    tx(tbG, a5.x(r.T / 2), yb - 10, 'period ' + fx(r.T, 2) + ' ms', 't-fg t-bold halo', 'middle');
    role('tbase-note').textContent = c.note;
    role('tb-step').textContent = fx((c.psc + 1) / 48, 4) + ' µs';
    role('tb-per').textContent = fx(r.T, 3) + ' ms';
    role('tb-f').textContent = fx(1000 / r.T, 2) + ' Hz';
  });

  // ---------- Figure 6: preload, shadow and UG ----------
  const sh = svg(viz('shadow'), 720, 232, { label: 'TIM3 preload and shadow registers through the five setup lines, and the first periods with and without UG', minWidth: 560 });
  const CODE6 = ['TIM3->PSC  = 47;', 'TIM3->ARR  = 19999;', 'TIM3->EGR  = TIM_EGR_UG;', 'TIM3->SR   = ~TIM_SR_UIF;', 'TIM3->DIER |= TIM_DIER_UIE;'];
  tx(sh, 8, 12, 'code', 't-fg t-bold');
  tx(sh, 320, 12, 'preload: what you write', 't-fg t-bold', 'middle');
  tx(sh, 540, 12, 'shadow: what counts', 't-fg t-bold', 'middle');
  tx(sh, 678, 12, 'flags', 't-fg t-bold', 'middle');
  const TL = { x0: 150, x1: 700, t1: 45, y: 200 };
  const tX = t => TL.x0 + t / TL.t1 * (TL.x1 - TL.x0);
  s('line', { x1: TL.x0, x2: TL.x1, y1: TL.y, y2: TL.y, class: 'l-axis' }, sh);
  [0, 10, 20, 30, 40].forEach(t => {
    s('line', { x1: tX(t), x2: tX(t), y1: TL.y, y2: TL.y + 5, class: 'l-axis' }, sh);
    s('text', { x: tX(t), y: TL.y + 18, 'text-anchor': 'middle' }, sh, t === 40 ? '40 ms' : String(t));
  });
  tx(sh, 8, TL.y - 12, 'first periods', 't-fg t-bold');
  const shG = s('g', {}, sh);
  // [current lines, struck line, PSC pre, PSC shadow, ARR pre, ARR used, UIF, UIE, periods, interrupts]
  const SH = [
    { on: [0], pre: '47', sh: '0  (÷ 1)', arr: 'not written', arrU: 'not written', uif: 0, uie: 0,
      note: 'PSC = 47 lands in the preload register. The counter still uses the shadow copy, 0, and would divide by PSC + 1 = 1.' },
    { on: [1], pre: '47', sh: '0  (÷ 1)', arr: '19999', arrU: '19999', uif: 0, uie: 0,
      note: 'ARR = 19999 takes effect at once, because ARPE, ARR\'s preload switch, is still off at this point. PSC has no such switch: it is always buffered.' },
    { on: [2], pre: '47', sh: '47  (÷ 48)', arr: '19999', arrU: '19999', uif: 1, uie: 0, copy: true,
      note: 'EGR = UG forces an update event now. The preload is copied into the shadow and CNT restarts at 0. The forced update also sets UIF, exactly as a real one would.' },
    { on: [3, 4], pre: '47', sh: '47  (÷ 48)', arr: '19999', arrU: '19999', uif: 0, uie: 1, periods: [[0, 20], [20, 40]], irq: [[20, 'pri'], [40, 'pri']],
      note: 'SR = ~TIM_SR_UIF clears that flag (write 0 to clear), then UIE turns the interrupt on. The first interrupt comes after a full 20 ms frame.' },
    { on: [3, 4], cut: 2, pre: '47', sh: '0, then 47', arr: '19999', arrU: '19999', uif: 0, uie: 1, periods: [[0, 0.4167, 'bad'], [0.4167, 20.4167], [20.4167, 40.4167]], irq: [[0.4167, 'bad'], [20.4167, 'pri'], [40.4167, 'pri']],
      note: 'Without UG the shadow keeps PSC = 0 until the first natural update. That first period is 20 000 counts at 48 MHz, 0.42 ms instead of 20 ms, with an interrupt at its end. After it, the copied PSC makes every frame right.' },
    { on: [4], cut: 3, pre: '47', sh: '47  (÷ 48)', arr: '19999', arrU: '19999', uif: 1, uie: 1, periods: [[0, 20], [20, 40]], irq: [[0, 'bad'], [20, 'pri'], [40, 'pri']],
      note: 'With UG but without clearing UIF, enabling UIE finds the flag already set. The handler runs at once: a phantom interrupt that no period ended.' },
  ];
  function drawShadow(st) {
    shG.textContent = '';
    CODE6.forEach((c, i) => {
      const y = 40 + i * 22, on = st.on.indexOf(i) >= 0, cut = st.cut === i;
      if (on) s('rect', { x: 2, y: y - 10, width: 208, height: 20, rx: 3, class: 'f-pri-soft' }, shG);
      const done = i < Math.max(...st.on) || on;
      tx(shG, 8, y, c, cut ? 't-bad' : on ? 't-pri t-bold' : done ? 't-fg' : 't-muted');
      if (cut) s('line', { x1: 6, x2: 200, y1: y, y2: y, class: 's-bad', style: 'stroke-width: 1.5' }, shG);
    });
    box(shG, 250, 28, 140, 40, 'PSC preload\n' + st.pre, { cls: 'f-surface', textCls: 't-fg' });
    box(shG, 470, 28, 140, 40, 'PSC shadow\n' + st.sh, { cls: st.sh.startsWith('0') ? 'f-bad-soft' : 'f-ok-soft', textCls: 't-fg' });
    arrow(shG, 392, 48, 466, 48, { cls: st.copy ? 'a-pri' : 'a-muted', label: 'at update', width: st.copy ? 2.5 : 1.5 });
    box(shG, 250, 92, 140, 40, 'ARR\n' + st.arr, { cls: 'f-surface', textCls: 't-fg' });
    box(shG, 470, 92, 140, 40, 'ARR in use\n' + st.arrU, { cls: st.arrU === '19999' ? 'f-ok-soft' : 'f-seg', textCls: 't-fg' });
    arrow(shG, 392, 112, 466, 112, { cls: 'a-muted', label: 'ARPE = 0: at once', dy: 28 });
    box(shG, 640, 28, 76, 40, 'UIF\n' + st.uif, { cls: st.uif ? 'f-bad-soft' : 'f-seg', textCls: st.uif ? 't-bad' : 't-fg' });
    box(shG, 640, 92, 76, 40, 'UIE\n' + st.uie, { cls: st.uie ? 'f-pri-soft' : 'f-seg', textCls: 't-fg' });
    if (!st.periods) {
      tx(shG, TL.x0 + 6, TL.y - 12, 'CEN not set yet: the counter is not running', 't-muted');
      return;
    }
    st.periods.forEach(([a, b, c]) => {
      const w = Math.max(3, Math.min(tX(b), TL.x1) - tX(a));
      s('rect', { x: tX(a), y: TL.y - 20, width: w, height: 16, rx: 2, class: c === 'bad' ? 'f-bad' : 'f-pri-soft sep' }, shG);
      if (!c && b - a > 10) tx(shG, (tX(a) + Math.min(tX(b), TL.x1)) / 2, TL.y - 12, '20 ms', 't-pri', 'middle');
    });
    st.irq.forEach(([t, c]) => {
      if (t > TL.t1) return;
      const x = tX(t);
      s('polygon', { points: `${x},${TL.y - 24} ${x - 5},${TL.y - 33} ${x + 5},${TL.y - 33}`, class: 'f-' + c }, shG);
    });
    const bad = st.irq.find(([, c]) => c === 'bad');
    if (bad) tx(shG, tX(bad[0]) + 9, TL.y - 34, bad[0] === 0 ? 'phantom interrupt at once' : 'first period 0.42 ms', 't-bad t-bold');
    else tx(shG, tX(20) + 9, TL.y - 34, 'first interrupt after 20 ms', 't-pri');
  }
  steps(viz('shadow-steps'), ['1 · PSC', '2 · ARR', '3 · UG', '4 · clear UIF, UIE', 'Without UG', 'UG, UIF not cleared'], k => {
    drawShadow(SH[k]);
    role('shadow-note').textContent = SH[k].note;
  }, 3);

  // ---------- Figure 7: write 0 to clear vs write 1 to clear ----------
  const sr = svg(viz('sr'), 720, 228, { label: 'TIM3 SR bits before a write, the value written, and the bits after; EXTI pending register for contrast', minWidth: 560 });
  const C7 = { x0: 150, c: 34, rows: [42, 100, 158], h: 28 };
  const cX = i => C7.x0 + (15 - i) * C7.c;
  const srG = s('g', {}, sr);
  const SR7 = [
    { reg: 'TIM3->SR', names: { 0: 'UIF', 1: 'CC1IF', 6: 'TIF', 9: 'CC1OF' }, before: 0b11, val: 0xFFFFFFFE, w1: false, target: 0,
      verdict: [['UIF cleared, CC1IF untouched. One str, no read needed.', 't-ok']],
      note: 'SR = ~TIM_SR_UIF writes 0xFFFFFFFE. The single 0 sits on UIF and clears it; every 1 leaves its flag as it was, so CC1IF survives for whoever needs it.' },
    { reg: 'TIM3->SR', names: { 0: 'UIF', 1: 'CC1IF', 6: 'TIF', 9: 'CC1OF' }, before: 0b11, val: 0x00000001, w1: false, target: 0,
      verdict: [['UIF still 1: the IRQ stays pending and the handler re-enters forever.', 't-bad'], ['CC1IF was wiped by a 0 nobody meant to write.', 't-bad']],
      note: 'SR = TIM_SR_UIF is the EXTI habit. The 1 on UIF leaves it set, and the 0s on all the other bits clear every other flag. It compiles without a warning.' },
    { reg: 'EXTI->FPR1', names: { 7: 'line 7', 3: 'line 3' }, before: (1 << 7) | (1 << 3), val: 0x00000080, w1: true, target: 7,
      verdict: [['Line 7 cleared by its 1; line 3 left pending by its 0.', 't-ok']],
      note: 'EXTI uses the opposite rule (lesson 05). FPR1 = mask writes a 1 only on the line to clear, and every 0 leaves its line alone.' },
  ];
  function drawSR(c) {
    srG.textContent = '';
    const lab = c.reg.split('->')[1];
    [[lab + ' before', null], ['you write', hex(c.val, 8)], [lab + ' after', null]].forEach(([t, v], r) => {
      tx(srG, 0, C7.rows[r] + (v ? 7 : 14), t, 't-fg t-bold');
      if (v) tx(srG, 0, C7.rows[r] + 21, v, 't-sec t-sm');
    });
    for (let i = 15; i >= 0; i--) {
      const x = cX(i), b0 = (c.before >> i) & 1, w = Math.floor(c.val / 2 ** i) % 2;
      tx(srG, x + C7.c / 2, 30, String(i), 't-sm', 'middle');
      if (c.names[i]) tx(srG, x + C7.c / 2, 14, c.names[i], 't-fg t-sm', 'middle');
      const after = c.w1 ? (b0 && !w ? 1 : 0) : (b0 && w ? 1 : 0);
      const cell = (r, cls, t, tc) => {
        s('rect', { x, y: C7.rows[r], width: C7.c, height: C7.h, class: cls + ' sep' }, srG);
        tx(srG, x + C7.c / 2, C7.rows[r] + C7.h / 2, t, tc, 'middle');
      };
      cell(0, b0 ? 'f-pri' : 'f-seg', String(b0), b0 ? 't-on' : 't-muted');
      const act = c.w1 ? w === 1 : w === 0;
      cell(1, act ? 'f-sec' : 'f-seg', String(w), act ? 't-on' : 't-muted');
      let cls = 'f-seg', tc = 't-muted';
      if (after) [cls, tc] = i === c.target ? ['f-bad', 't-on'] : ['f-pri', 't-on'];
      else if (b0) [cls, tc] = i === c.target ? ['f-ok', 't-on'] : ['f-bad-soft', 't-bad'];
      cell(2, cls, String(after), tc);
    }
    c.verdict.forEach(([t, cls], i) => tx(srG, C7.x0, 202 + i * 16, t, cls + ' t-bold'));
  }
  steps(viz('sr-steps'), ['Right: SR = ~TIM_SR_UIF', 'Wrong: SR = TIM_SR_UIF', 'EXTI: FPR1 = mask'], k => {
    drawSR(SR7[k]);
    role('sr-note').textContent = SR7[k].note;
  });

  // ---------- Figure 8: PWM and the servo ----------
  const pw = svg(viz('pwm'), 760, 246, { label: 'TIM3 counter ramps and the PA6 pulse, a zoom on the first 2.5 ms, and the servo horn', minWidth: 560 });
  const OV = { x0: 50, x1: 330, t1: 40 }, ZM = { x0: 390, x1: 610, t1: 2.5 };
  const Y8 = { c0: 130, c1: 44, hi: 166, lo: 192, axis: 204 };
  const oX = t => OV.x0 + t / OV.t1 * (OV.x1 - OV.x0), zX = t => ZM.x0 + t / ZM.t1 * (ZM.x1 - ZM.x0);
  const oY = v => Y8.c0 - v / 19999 * (Y8.c0 - Y8.c1), zY = v => Y8.c0 - v / 2500 * (Y8.c0 - Y8.c1);
  tx(pw, OV.x0, 12, 'two 20 ms frames, to scale', 't-fg t-bold');
  tx(pw, ZM.x0, 12, 'zoom: the first 2.5 ms', 't-fg t-bold');
  tx(pw, 0, (Y8.c0 + Y8.c1) / 2, 'CNT', 't-fg t-bold');
  tx(pw, 0, (Y8.hi + Y8.lo) / 2, 'PA6', 't-fg t-bold');
  s('line', { x1: OV.x0, x2: OV.x1, y1: oY(19999), y2: oY(19999), class: 's-line dash' }, pw);
  tx(pw, OV.x1 + 4, oY(19999), 'ARR', 't-sm');
  line(pw, [[oX(0), oY(0)], [oX(20), oY(19999)], [oX(20), oY(0)], [oX(40), oY(19999)], [oX(40), oY(0)]], 's-muted');
  line(pw, [[zX(0), zY(0)], [zX(2.5), zY(2500)]], 's-muted');
  s('rect', { x: oX(0) - 2, y: Y8.c1 - 6, width: oX(2.5) - oX(0) + 4, height: Y8.lo - Y8.c1 + 12, class: 'f-none s-muted dash', style: 'stroke-width: 1' }, pw);
  tx(pw, oX(0), Y8.c1 - 16, 'zoomed', 't-sm');
  [[OV, oX, [[0, '0'], [20, '20'], [40, '40 ms']]], [ZM, zX, [[0, '0'], [1, '1'], [2, '2 ms']]]].forEach(([o, f, ts]) => {
    s('line', { x1: o.x0, x2: o.x1, y1: Y8.axis, y2: Y8.axis, class: 'l-axis' }, pw);
    ts.forEach(([t, l]) => {
      s('line', { x1: f(t), x2: f(t), y1: Y8.axis, y2: Y8.axis + 5, class: 'l-axis' }, pw);
      s('text', { x: f(t), y: Y8.axis + 17, 'text-anchor': 'middle' }, pw, l);
    });
  });
  tx(pw, ZM.x0, Y8.axis + 34, 'PA6 high while CNT < CCR1, low after', 't-pri');
  const D8 = { cx: 690, cy: 132, r: 50 };
  s('path', { d: `M${D8.cx - D8.r} ${D8.cy} A${D8.r} ${D8.r} 0 0 1 ${D8.cx + D8.r} ${D8.cy}`, class: 's-muted', style: 'stroke-width: 6; opacity: 0.35' }, pw);
  tx(pw, D8.cx - D8.r, D8.cy + 14, '1.0 ms', 't-sm', 'middle');
  tx(pw, D8.cx, D8.cy - D8.r - 10, '1.5 ms', 't-sm', 'middle');
  tx(pw, D8.cx + D8.r, D8.cy + 14, '2.0 ms', 't-sm', 'middle');
  tx(pw, D8.cx, D8.cy + 34, 'servo horn', 't-fg t-bold', 'middle');
  tx(pw, D8.cx, D8.cy + 48, '(nominal ends)', 't-sm', 'middle');
  const pwG = s('g', {}, pw);
  slider(viz('pwm-slider'), { label: 'CCR1', min: 1000, max: 2000, step: 10, value: 1500, fmt: v => v + ' counts' }, v => {
    pwG.textContent = '';
    const w = v / 1000;
    s('line', { x1: OV.x0, x2: OV.x1, y1: oY(v), y2: oY(v), class: 's-sec dash', style: 'stroke-width: 1.5' }, pwG);
    line(pwG, [[oX(0), Y8.lo], [oX(0), Y8.hi], [oX(w), Y8.hi], [oX(w), Y8.lo], [oX(20), Y8.lo], [oX(20), Y8.hi], [oX(20 + w), Y8.hi], [oX(20 + w), Y8.lo], [oX(40), Y8.lo]], 's-pri');
    s('line', { x1: ZM.x0, x2: ZM.x1, y1: zY(v), y2: zY(v), class: 's-sec dash', style: 'stroke-width: 1.5' }, pwG);
    tx(pwG, ZM.x0 + 4, zY(v) - 9, 'CCR1 = ' + v, 't-sec t-bold');
    s('line', { x1: zX(w), x2: zX(w), y1: zY(v), y2: Y8.hi, class: 's-sec dash', style: 'stroke-width: 1' }, pwG);
    s('circle', { cx: zX(w), cy: zY(v), r: 4, class: 'f-sec' }, pwG);
    line(pwG, [[zX(0), Y8.lo], [zX(0), Y8.hi], [zX(w), Y8.hi], [zX(w), Y8.lo], [zX(2.5), Y8.lo]], 's-pri');
    tx(pwG, (zX(0) + zX(w)) / 2, Y8.hi - 9, fx(w, 2) + ' ms', 't-pri t-bold halo', 'middle');
    const th = Math.PI - (v - 1000) / 1000 * Math.PI;
    s('line', { x1: D8.cx, y1: D8.cy, x2: D8.cx + 44 * Math.cos(th), y2: D8.cy - 44 * Math.sin(th), class: 's-pri', style: 'stroke-width: 6; stroke-linecap: round' }, pwG);
    s('circle', { cx: D8.cx, cy: D8.cy, r: 6, class: 'f-fg' }, pwG);
    role('pw-w').textContent = fx(w, 2) + ' ms';
    role('pw-d').textContent = fx(v / 200, 2) + ' %';
  });

  // ---------- Figure 9: the AF selector ----------
  const af = svg(viz('af'), 720, 272, { label: 'Alternate-function selector for PA6 and the GPIOA AFR[0] register that drives it', minWidth: 560 });
  const iy = i => 42 + i * 18;
  s('polygon', { points: '330,18 380,40 380,164 330,186', class: 'f-seg box' }, af);
  for (let i = 0; i < 8; i++) {
    tx(af, 334, iy(i), 'AF' + i, 't-sm');
    if (i !== 1) s('line', { x1: 292, x2: 330, y1: iy(i), y2: iy(i), class: 's-line', style: 'stroke-width: 1.5' }, af);
  }
  tx(af, 288, iy(5), 'other signals, or none', 't-sm', 'end');
  box(af, 20, 34, 180, 52, 'TIM3 channel 1\nOC1: PWM mode 1', { cls: 'f-pri-soft', textCls: 't-fg' });
  arrow(af, 200, iy(1), 328, iy(1), { cls: 'a-pri', label: 'TIM3_CH1', width: 2 });
  box(af, 430, 84, 70, 36, 'PA6', { cls: 'f-surface', textCls: 't-fg t-bold' });
  const NIB = { x0: 120, w: 70, y: 216, h: 26 };
  tx(af, 0, NIB.y + 7, 'AFR[0]', 't-fg t-bold');
  ['PA7', 'PA6', 'PA5', 'PA4', 'PA3', 'PA2', 'PA1', 'PA0'].forEach((p, j) => {
    const x = NIB.x0 + j * NIB.w;
    tx(af, x + NIB.w / 2, NIB.y + NIB.h + 12, p + ' · ' + (31 - 4 * j) + ':' + (28 - 4 * j), 't-sm', 'middle');
  });
  const afG = s('g', {}, af);
  const AFS = [
    { sel: 1, note: 'AFR[0] bits 27:24 = 0001 picks input AF1, which is TIM3_CH1. The PWM reaches PA6 and the servo moves. With PA2 and PA3 on AF1 and PA7 on AF4, GPIOA AFR[0] = 0x41001100.' },
    { sel: 2, note: 'AFR[0] bits 27:24 = 0010 picks AF2 (Lab Part 5). TIM3 still counts, its interrupt still fires and the report still says 50 updates a second, but PA6 now follows another signal or nothing, and the servo does not move.' },
  ];
  steps(viz('af-steps'), ['AFR = 1: TIM3_CH1', 'AFR = 2: wrong number'], k => {
    afG.textContent = '';
    const { sel } = AFS[k], ok = sel === 1, c = ok ? 'pri' : 'bad';
    s('line', { x1: 330, y1: iy(sel), x2: 380, y2: 102, class: 's-' + c }, afG);
    arrow(afG, 380, 102, 428, 102, { cls: 'a-' + c, width: 2 });
    arrow(afG, 500, 102, 540, 102, { cls: ok ? 'a-pri' : 'a-muted', width: 2, dash: !ok });
    tx(afG, 548, 96, 'servo', 't-fg t-bold');
    tx(afG, 548, 110, ok ? 'moves' : 'does not move', ok ? 't-ok t-bold' : 't-bad t-bold');
    tx(afG, 20, 104, 'counts, 50 updates/s,', 't-sm');
    tx(afG, 20, 118, 'in both cases', 't-sm');
    const vals = [4, sel, 0, 0, 1, 1, 0, 0];
    vals.forEach((v, j) => {
      const x = NIB.x0 + j * NIB.w, on = j === 1;
      s('rect', { x, y: NIB.y, width: NIB.w, height: NIB.h, class: (on ? (ok ? 'f-pri' : 'f-bad') : 'f-seg') + ' sep' }, afG);
      tx(afG, x + NIB.w / 2, NIB.y + NIB.h / 2, v.toString(2).padStart(4, '0') + ' = ' + v, on ? 't-on t-bold' : 't-fg', 'middle');
    });
    const total = vals.reduce((a, v) => a * 16 + v, 0);
    tx(afG, 0, NIB.y + 21, hex(total, 8), 't-' + c + ' t-sm');
    const nx = NIB.x0 + NIB.w * 1.5;
    line(afG, [[nx, NIB.y], [nx, 200], [355, 200], [355, 176]], 's-' + c).setAttribute('style', 'stroke-width: 1.5');
    tx(afG, 250, 192, 'selects', 't-' + c + ' t-sm', 'middle');
    role('af-note').textContent = AFS[k].note;
  });

  // ---------- Figure 10: the rate limiter ----------
  const SLEWS = [20, 200, 1000, 2];
  const sl = svg(viz('slew'), 700, 270, { label: 'CCR1 frame by frame after the target jumps from 1000 to 2000 microseconds, for several SLEW values', minWidth: 560 });
  const a10 = axes(sl, { x: 64, y: 26, w: 610, h: 190, xd: [0, 1.2], yd: [900, 2100], xt: [0, 0.2, 0.4, 0.6, 0.8, 1, 1.2], yt: [1000, 1250, 1500, 1750, 2000], xf: v => v.toFixed(1), xl: 'time (s), one point per 20 ms frame', yl: 'CCR1 (µs)' });
  s('line', { x1: a10.x(0), x2: a10.x(1.2), y1: a10.y(2000), y2: a10.y(2000), class: 's-ok dash', style: 'stroke-width: 1.5' }, sl);
  tx(sl, a10.x(1.2), a10.y(2000) - 10, 'target 2000 µs', 't-ok', 'end');
  const seq = sv => range(61, k => Math.min(1000 + sv * k, 2000));
  const stair = vs => vs.flatMap((v, k) => [[a10.x(k * 0.02), a10.y(v)], [a10.x(Math.min(k + 1, 60) * 0.02), a10.y(v)]]);
  const faint = SLEWS.map(sv => line(sl, stair(seq(sv)), 's-line'));
  faint.forEach(p => p.setAttribute('style', 'stroke-width: 1.5'));
  const slG = s('g', {}, sl);
  steps(viz('slew-steps'), ['SLEW 20 (the lesson)', 'SLEW 200', 'SLEW 1000 (Lab Part 3)', 'SLEW 2 (Lab Part 3)'], k => {
    const sv = SLEWS[k], vs = seq(sv), n = Math.ceil(1000 / sv);
    slG.textContent = '';
    line(slG, stair(vs), 's-pri');
    vs.forEach((v, i) => s('circle', { cx: a10.x(i * 0.02), cy: a10.y(v), r: 2.2, class: 'f-pri' }, slG));
    if (n <= 60) tx(slG, a10.x(0.12), a10.y(2000) + 22, `reaches 2000 µs after ${n} frame${n > 1 ? 's' : ''} = ${fx(n * 0.02, 2)} s`, 't-pri t-bold halo');
    else tx(slG, a10.x(1.2), a10.y(vs[60]) - 12, `${vs[60]} µs after 1.2 s; 2000 only after ${n} frames = ${fx(n * 0.02, 1)} s`, 't-pri t-bold halo', 'end');
    role('sl-n').textContent = String(n);
    role('sl-t').textContent = fx(n * 0.02, 2) + ' s';
    role('sl-r').textContent = grp(sv * 50) + ' µs/s';
  });

  // ---------- Figure 11: capture vs EXTI timestamps ----------
  const cp = svg(viz('cap'), 740, 262, { label: 'An echo pulse with zooms on both edges: input capture stamps the edge, an EXTI handler stamps the time it runs', minWidth: 560 });
  const OE = { x0: 100, x1: 720, t1: 8000, hi: 30, lo: 54 };
  const eX = t => OE.x0 + t / OE.t1 * (OE.x1 - OE.x0);
  tx(cp, 0, (OE.hi + OE.lo) / 2, 'PA7 echo', 't-fg t-bold');
  line(cp, [[OE.x0, OE.lo], [eX(1000), OE.lo], [eX(1000), OE.hi], [eX(6800), OE.hi], [eX(6800), OE.lo], [OE.x1, OE.lo]], 's-fg');
  tx(cp, eX(1000), 16, 'rise at 1000 µs', 't-sm', 'middle');
  tx(cp, eX(6800), 16, 'fall at 6800 µs', 't-sm', 'middle');
  tx(cp, (eX(1000) + eX(6800)) / 2, (OE.hi + OE.lo) / 2, 'width 5800 µs = 100 cm', 't-fg', 'middle');
  const PN = [{ x0: 90, w0: 970, edge: 1000, rise: true, t: 'zoom on the rise, 80 µs' }, { x0: 440, w0: 6770, edge: 6800, rise: false, t: 'zoom on the fall, 80 µs' }];
  const Z11 = { px: 3.5, hi: 100, lo: 120, axis: 204 };
  PN.forEach(p => {
    const zx = t => p.x0 + (t - p.w0) * Z11.px;
    s('rect', { x: eX(p.w0) - 1, y: OE.hi - 6, width: eX(p.w0 + 80) - eX(p.w0) + 2, height: OE.lo - OE.hi + 12, class: 'f-none s-muted dash', style: 'stroke-width: 1' }, cp);
    tx(cp, p.x0, 80, p.t, 't-fg t-bold');
    const [y0, y1] = p.rise ? [Z11.lo, Z11.hi] : [Z11.hi, Z11.lo];
    line(cp, [[p.x0, y0], [zx(p.edge), y0], [zx(p.edge), y1], [p.x0 + 280, y1]], 's-fg');
    s('line', { x1: p.x0, x2: p.x0 + 280, y1: Z11.axis, y2: Z11.axis, class: 'l-axis' }, cp);
    for (let t = p.w0 + 10; t < p.w0 + 80; t += 20) {
      s('line', { x1: zx(t), x2: zx(t), y1: Z11.axis, y2: Z11.axis + 5, class: 'l-axis' }, cp);
      s('text', { x: zx(t), y: Z11.axis + 17, 'text-anchor': 'middle', class: 't-sm' }, cp, String(t));
    }
    tx(cp, p.x0 - 6, Z11.axis, 'CNT', 't-sm', 'end');
    p.zx = zx;
  });
  const cpG = s('g', {}, cp);
  const CAP = [
    { lat: [3, 3], cap: 1, exti: 0, res: [['capture: 6800 − 1000 = 5800 µs → 100 cm', 't-ok']],
      note: 'Input capture. At each edge the hardware copies CNT into CCR1, so the values are exactly 1000 and 6800. The ISR runs a few microseconds later and reads CCR1, which still says the edge time.' },
    { lat: [3, 3], cap: 0, exti: 1, res: [['EXTI: 6803 − 1003 = 5800 µs → 100 cm', 't-ok'], ['both reads are 3 µs late, and the lateness cancels', 't-muted']],
      note: 'EXTI, as in Wokwi. Each handler reads TIM14->CNT when it runs, 3 µs after its edge. Both timestamps are late by the same amount, so the width comes out right.' },
    { lat: [43, 3], cap: 0.35, exti: 1, held: true, res: [['EXTI: 6803 − 1043 = 5760 µs → 99 cm', 't-bad'], ['capture in the same situation: 6800 − 1000 = 5800 µs → 100 cm', 't-pri']],
      note: 'A critical section, or a handler of equal or higher priority, holds the rising edge\'s interrupt for 40 µs. The EXTI handler stamps 1043, and the width loses 40 µs. Capture would still read 1000, because the hardware took that timestamp at the edge.' },
  ];
  steps(viz('cap-steps'), ['Input capture', 'EXTI, equal latency', 'EXTI, rise held 40 µs'], k => {
    const c = CAP[k];
    cpG.textContent = '';
    PN.forEach((p, i) => {
      const xe = p.zx(p.edge), xr = p.zx(p.edge + c.lat[i]);
      if (c.cap) {
        const g = s('g', { style: c.cap < 1 ? 'opacity: 0.4' : null }, cpG);
        s('line', { x1: xe, x2: xe, y1: Z11.hi - 6, y2: Z11.axis, class: 's-pri', style: 'stroke-width: 2' }, g);
        s('polygon', { points: `${xe},${138} ${xe - 6},${146} ${xe},${154} ${xe + 6},${146}`, class: 'f-pri' }, g);
        tx(g, xe - 9, 146, 'CCR1 = ' + p.edge, 't-pri t-bold', 'end');
      }
      if (c.held && i === 0) {
        s('rect', { x: xe, y: 176, width: xr - xe, height: 14, rx: 2, class: 'f-ter-soft' }, cpG);
        tx(cpG, (xe + xr) / 2, 183, 'held 40 µs', 't-ter t-sm', 'middle');
      }
      const ec = c.exti ? 's-sec' : 's-muted';
      s('line', { x1: xr, x2: xr, y1: Z11.hi - 6, y2: Z11.axis, class: ec + ' dash', style: 'stroke-width: 1.5' }, cpG);
      s('circle', { cx: xr, cy: 166, r: 4.5, class: c.exti ? 'f-sec' : 'f-muted' }, cpG);
      const far = xr + 150 > p.x0 + 280;
      tx(cpG, far ? xr - 8 : xr + 8, 166, c.exti ? 'EXTI reads CNT = ' + (p.edge + c.lat[i]) : 'ISR reads CCR1 later', c.exti ? 't-sec t-bold' : 't-muted', far ? 'end' : 'start');
    });
    c.res.forEach(([t, cls], i) => tx(cpG, OE.x0, 236 + i * 16, t, cls + ' t-bold'));
    role('cap-note').textContent = c.note;
  });

  // ---------- Figure 12: priority bytes ----------
  const pr = svg(viz('prio'), 720, 206, { label: 'NVIC IPR4 and SCB SHPR3 as 32 bits each: two priority bits at the top of every byte', minWidth: 560 });
  const PR = { x0: 136, c: 18, rows: [44, 130], h: 24 };
  const qX = i => PR.x0 + (31 - i) * PR.c;
  const REG12 = [
    { name: 'NVIC IPR4', val: 0x40000080, bytes: ['IRQ 19 · TIM14', 'IRQ 18', 'IRQ 17', 'IRQ 16 · TIM3'], vals: [[3, '0x40 → 1'], [0, '0x80 → 2']] },
    { name: 'SCB SHPR3', val: 0xC0000000, bytes: ['SysTick (exc 15)', 'PendSV (exc 14)', 'reserved', 'reserved'], vals: [[3, '0xC0 → 3'], [2, '0x00 → 0']] },
  ];
  REG12.forEach((r, ri) => {
    const y = PR.rows[ri];
    tx(pr, 0, y + 6, r.name, 't-fg t-bold');
    tx(pr, 0, y + 19, hex(r.val, 8), 't-pri t-sm');
    r.bytes.forEach((b, j) => tx(pr, qX(31 - 8 * j) + 4 * PR.c, y - 24, b, 't-fg t-sm', 'middle'));
    [31, 24, 23, 16, 15, 8, 7, 0].forEach(i => tx(pr, qX(i) + PR.c / 2, y - 9, String(i), 't-sm', 'middle'));
    for (let i = 31; i >= 0; i--) {
      const bit = Math.floor(r.val / 2 ** i) % 2, impl = (i & 7) >= 6;
      s('rect', { x: qX(i), y, width: PR.c, height: PR.h, class: (bit ? 'f-pri' : 'f-seg') + ' sep', style: impl ? null : 'opacity: 0.4' }, pr);
      tx(pr, qX(i) + PR.c / 2, y + PR.h / 2, String(bit), bit ? 't-on' : 't-muted', 'middle');
    }
    for (let j = 0; j < 4; j++) s('rect', { x: qX(31 - 8 * j), y, width: 8 * PR.c, height: PR.h, class: 's-muted', style: 'stroke-width: 1' }, pr);
    r.vals.forEach(([b, t]) => tx(pr, qX(8 * b + 7) + 4 * PR.c, y + PR.h + 12, t, 't-fg t-sm', 'middle'));
  });
  tx(pr, 0, 198, 'Bits 7:6 of each byte hold the priority (p << 6, 0 = most urgent); bits 5:0 do not exist and read 0.', 't-sm');
  const prG = s('g', {}, pr);
  const PRS = [
    null,
    { r: 0, b: 0, note: 'TIM3 is IRQ 16. 16 / 4 = 4 and 16 mod 4 = 0, so its byte is IPR4 bits 7:0. Priority 2 is stored as 2 << 6 = 0x80.' },
    { r: 0, b: 3, note: 'TIM14 is IRQ 19. 19 / 4 = 4 and 19 mod 4 = 3, so its byte is IPR4 bits 31:24. Priority 1 is 1 << 6 = 0x40, which puts 0x40000000 in the register. With TIM3: IPR4 = 0x40000080.' },
    { r: 1, b: 3, note: 'SysTick is a system exception, not an IRQ, so its priority byte is in the SCB: SHPR3 bits 31:24. Priority 3 is 3 << 6 = 0xC0, so SHPR3 = 0xC0000000. PendSV next to it stays 0 here.' },
  ];
  steps(viz('prio-steps'), ['All', 'TIM3 · IRQ 16', 'TIM14 · IRQ 19', 'SysTick'], k => {
    prG.textContent = '';
    const c = PRS[k];
    role('prio-note').textContent = c ? c.note : 'Each source owns one byte, and only its top two bits exist. TIM14 (1) and TIM3 (2) share IPR4 because IRQs 16 to 19 all live in IPR[4]; SysTick (3) is in SHPR3.';
    if (!c) return;
    s('rect', { x: qX(8 * c.b + 7) - 3, y: PR.rows[c.r] - 3, width: 8 * PR.c + 6, height: PR.h + 6, rx: 3, class: 'f-none outline-sec' }, prG);
  });
});
