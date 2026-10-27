QV.register('s1-mc1', function (q) {
  const { s, svg, steps, table, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const VAL = ['1A', '2B', '3C', '4D'];
  const BITS = ['31:24', '23:16', '15:8', '7:0'];
  const ADDR = ['0x20000100', '0x20000101', '0x20000102', '0x20000103'];
  const L = { x0: 150, bw: 110, step: 122, top: 34, bh: 38, mem: 166 };
  const bx = k => L.x0 + k * L.step;

  const g = svg(viz('le'), 680, 250, { label: 'The bytes of 0x1A2B3C4D placed in memory, little-endian and big-endian', minWidth: 540 });
  s('text', { x: 0, y: L.top + 13, class: 't-fg t-bold' }, g, 'value');
  s('text', { x: 0, y: L.top + 29, class: 't-sm' }, g, 'x = 0x1A2B3C4D');
  s('text', { x: 0, y: L.mem + 13, class: 't-fg t-bold' }, g, 'memory');
  s('text', { x: 0, y: L.mem + 29, class: 't-sm' }, g, 'lowest address left');
  const top = VAL.map((v, k) => {
    const grp = s('g', { class: 'fade' }, g);
    s('text', { x: bx(k) + L.bw / 2, y: L.top - 10, 'text-anchor': 'middle', class: 't-sm' }, grp, 'bits ' + BITS[k]);
    s('rect', { x: bx(k), y: L.top, width: L.bw, height: L.bh, rx: 4, class: 'f-pri' }, grp);
    s('text', { x: bx(k) + L.bw / 2, y: L.top + L.bh / 2, dy: '0.35em', 'text-anchor': 'middle', class: 't-on t-bold t-lg' }, grp, v);
    return grp;
  });
  const layer = s('g', {}, g);

  const tbl = table(viz('le-table'), [{ text: 'Address', cls: 'l' }, 'Little-endian, every STM32', 'Big-endian, network order'],
    ADDR.map((a, k) => [{ text: a, cls: 'l' }, { text: '0x' + VAL[3 - k], cls: 'hl' }, '0x' + VAL[k]]));

  const note = role('le-note');
  steps(viz('le-steps'), ['All', '+0', '+1', '+2', '+3', 'Big-endian'], k => {
    layer.textContent = '';
    const be = k === 5, on = k >= 1 && k <= 4 ? k - 1 : -1;
    const src = a => be ? a : 3 - a;
    top.forEach((grp, i) => grp.classList.toggle('dim', on >= 0 && i !== src(on)));
    for (let a = 0; a < 4; a++) {
      const lit = on < 0 || a === on, cls = be ? 'sec' : 'pri';
      const grp = s('g', { class: lit ? '' : 'dim' }, layer);
      arrow(grp, bx(src(a)) + L.bw / 2, L.top + L.bh + 3, bx(a) + L.bw / 2, L.mem - 4, { cls: 'a-' + cls, width: lit && on >= 0 ? 2.5 : 1.5 });
      s('rect', { x: bx(a), y: L.mem, width: L.bw, height: L.bh, rx: 4, class: 'f-' + cls + '-soft outline-' + (be ? 'sec' : 'pri') }, grp);
      s('text', { x: bx(a) + L.bw / 2, y: L.mem + L.bh / 2, dy: '0.35em', 'text-anchor': 'middle', class: 't-' + cls + ' t-bold t-lg' }, grp, VAL[src(a)]);
      s('text', { x: bx(a) + L.bw / 2, y: L.mem + L.bh + 18, 'text-anchor': 'middle', class: lit && on >= 0 ? 't-fg t-bold' : null }, grp, ADDR[a]);
    }
    s('text', { x: 680, y: 244, 'text-anchor': 'end', class: be ? 't-sec t-bold' : 't-pri t-bold' }, layer, be ? 'big-endian: 1A 2B 3C 4D, option A' : 'little-endian: 4D 3C 2B 1A, option B');
    tbl.rows.forEach((r, i) => r.classList.toggle('on', i === on));
    if (k === 0) note.textContent = 'In little-endian order the least significant byte, 0x4D, goes to the lowest address and the most significant, 0x1A, to the highest. The memory view reads 4D 3C 2B 1A.';
    else if (be) note.textContent = 'Big-endian keeps the written order, 1A 2B 3C 4D, which is option A. The 68000, classic SPARC and every internet header use it. No STM32 does.';
    else note.textContent = `Address ${ADDR[on]} holds bits ${BITS[3 - on]}, the byte 0x${VAL[3 - on]}` + (on === 0 ? ', the least significant byte.' : on === 3 ? ', the most significant byte.' : '.');
  });
});

QV.register('s1-mc2', function (q) {
  const { s, svg, steps, box, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);

  // Figure 1: the AVR's three spaces against the STM32C031's one map
  const g = svg(viz('spaces'), 760, 290, { label: 'AVR program, data and I/O spaces each starting at 0, against the single STM32C031 address map reached by one ldr', minWidth: 600 });
  s('text', { x: 10, y: 18, class: 't-fg t-bold' }, g, 'AVR: three spaces');
  [['LPM', 'program', 'flash', 'const table'], ['LD / ST', 'data', 'SRAM', 'variables'], ['IN / OUT', 'I/O', 'space', 'PORTB']].forEach(([ins, a, b, ex], i) => {
    const x = 10 + i * 112;
    s('text', { x: x + 50, y: 46, 'text-anchor': 'middle', class: 't-sec t-bold' }, g, ins);
    arrow(g, x + 50, 51, x + 50, 62, { cls: 'a-sec', head: 6 });
    s('rect', { x, y: 64, width: 100, height: 150, rx: 4, class: 'f-sec-soft' }, g);
    s('text', { x: x + 50, y: 122, 'text-anchor': 'middle', class: 't-fg t-bold' }, g, a);
    s('text', { x: x + 50, y: 138, 'text-anchor': 'middle', class: 't-fg' }, g, b);
    s('text', { x: x + 50, y: 180, 'text-anchor': 'middle', class: 't-sm' }, g, ex);
    s('text', { x: x + 50, y: 230, 'text-anchor': 'middle', class: 't-sm' }, g, 'starts at 0x0000');
  });
  s('text', { x: 10, y: 256, class: 't-muted' }, g, 'one number, three different places');
  s('text', { x: 10, y: 276, class: 't-sec t-bold' }, g, 'port-mapped I/O + Harvard');
  s('line', { x1: 368, x2: 368, y1: 8, y2: 282, class: 's-line' }, g);

  s('text', { x: 392, y: 18, class: 't-fg t-bold' }, g, 'STM32C031: one map');
  const REG = [
    ['0xE0000000', 'PPB', 'NVIC, SysTick', false],
    ['0x50000000', 'IOPORT', 'GPIO register', true],
    ['0x40000000', 'peripherals', 'USART2, TIM3, RCC', false],
    ['0x20000000', 'SRAM', 'global variable', true],
    ['0x08000000', 'flash', 'const table', true],
    ['0x00000000', 'alias', 'flash, at reset', false],
  ];
  const cx = 480, cw = 150, ry = i => 34 + i * 34;
  REG.forEach(([addr, name, what, hit], i) => {
    s('rect', { x: cx, y: ry(i), width: cw, height: 34, class: (hit ? 'f-pri-soft' : 'f-seg') + ' sep' }, g);
    s('text', { x: cx + cw / 2, y: ry(i) + 13, 'text-anchor': 'middle', class: hit ? 't-pri t-bold' : 't-fg t-bold' }, g, name);
    s('text', { x: cx + cw / 2, y: ry(i) + 27, 'text-anchor': 'middle', class: 't-sm' }, g, what);
    s('text', { x: cx - 6, y: ry(i) + 34, dy: '0.35em', 'text-anchor': 'end', class: 't-sm' }, g, addr);
  });
  box(g, 690, 124, 66, 32, 'ldr', { cls: 'f-pri', textCls: 't-on t-bold', stroke: 'sep' });
  [1, 3, 4].forEach(i => arrow(g, 690, 140, cx + cw + 4, ry(i) + 17, { cls: 'a-pri', width: 1.5 }));
  s('text', { x: 723, y: 174, 'text-anchor': 'middle', class: 't-sm' }, g, 'one ldr');
  s('text', { x: 723, y: 188, 'text-anchor': 'middle', class: 't-sm' }, g, 'reaches all');
  s('text', { x: 392, y: 256, class: 't-muted' }, g, 'only the address tells them apart');
  s('text', { x: 392, y: 276, class: 't-pri t-bold' }, g, 'memory-mapped I/O + von Neumann');

  // Figure 2: the two contrasts as a 2 x 2 grid, with each option's placement
  const G = { x: 190, y: 56, w: 190, h: 86 };
  const gx = c => G.x + c * G.w, gy = r => G.y + r * G.h;
  const m = svg(viz('grid'), 600, 252, { label: 'Two by two grid: port-mapped or memory-mapped I/O against Harvard or von Neumann, with the AVR and STM32C031 placed', minWidth: 500 });
  s('text', { x: gx(1), y: 18, 'text-anchor': 'middle', class: 't-fg t-bold' }, m, 'How software reaches a device');
  s('text', { x: gx(0) + G.w / 2, y: 44, 'text-anchor': 'middle', class: 't-fg' }, m, 'port-mapped I/O');
  s('text', { x: gx(1) + G.w / 2, y: 44, 'text-anchor': 'middle', class: 't-fg' }, m, 'memory-mapped I/O');
  s('text', { x: 10, y: 44, class: 't-fg t-bold' }, m, 'Code and data');
  [['Harvard', 'two spaces'], ['von Neumann', 'one space']].forEach(([a, b], r) => {
    s('text', { x: G.x - 10, y: gy(r) + G.h / 2 - 6, 'text-anchor': 'end', class: 't-fg' }, m, a);
    s('text', { x: G.x - 10, y: gy(r) + G.h / 2 + 10, 'text-anchor': 'end', class: 't-sm' }, m, b);
  });
  for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) s('rect', { x: gx(c), y: gy(r), width: G.w, height: G.h, class: 'f-surface box' }, m);
  [[0, 0, 'the real AVR'], [1, 1, 'the real STM32C031']].forEach(([c, r, t]) => {
    s('rect', { x: gx(c) + 4, y: gy(r) + 4, width: G.w - 8, height: G.h - 8, rx: 4, class: 's-ok dash', style: 'stroke-width: 1.5' }, m);
    s('text', { x: gx(c) + 12, y: gy(r) + 20, class: 't-ok t-sm' }, m, t);
  });
  const chips = s('g', {}, m);
  const chip = (c, r, label, fill) => {
    const x = gx(c) + G.w / 2 - 60, y = gy(r) + 36;
    s('rect', { x, y, width: 120, height: 28, rx: 14, class: fill }, chips);
    s('text', { x: x + 60, y: y + 14, dy: '0.35em', 'text-anchor': 'middle', class: 't-on t-bold' }, chips, label);
  };
  // [AVR col, AVR row, STM32 col, STM32 row]: col 0 port-mapped, 1 memory-mapped; row 0 Harvard, 1 von Neumann
  const OPT = { A: [0, 0, 1, 1], B: [1, 0, 0, 1], C: [0, 1, 1, 0], D: [0, 0, 1, 0] };
  const NOTE = {
    A: 'Option A. The AVR reaches devices through IN and OUT in a separate space (port-mapped) and reads flash with LPM because code and data are apart (Harvard). The STM32C031 reaches everything with one ldr in one map. Both chips land on their real cells.',
    B: 'Option B swaps the I/O models. Dedicated IN and OUT instructions are what port-mapped means, and the STM32C031 has no port space at all.',
    C: 'Option C swaps the address spaces. The AVR needs LPM and PROGMEM because its code and data are apart, and the STM32C031 reads a const table with an ordinary ldr.',
    D: 'Option D calls the STM32C031 Harvard. Some Cortex-M cores fetch code and data over separate buses for speed, but that is the implementation underneath. The address map stays single and your code cannot tell.',
  };
  const note = role('grid-note');
  steps(viz('grid-steps'), ['A', 'B', 'C', 'D'], k => {
    const key = 'ABCD'[k], [ac, ar, sc, sr] = OPT[key];
    chips.textContent = '';
    chip(ac, ar, 'AVR', 'f-sec');
    chip(sc, sr, 'STM32C031', 'f-pri');
    note.textContent = NOTE[key];
  });
});

QV.register('s1-mc3', function (q) {
  const { s, svg, steps, box, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const g = svg(viz('vt'), 760, 290, { label: 'TIM3 interrupt indexes slot 32 of the vector table, which holds the address of USART2_IRQHandler', minWidth: 600 });
  const T = { x: 260, w: 220, y: 40, rh: 30 };
  const ry = i => T.y + i * T.rh;
  const ROWS = [['[0]', 'initial stack pointer'], ['[1]', 'Reset_Handler'], ['2–15', 'ARM: faults, SysTick'], ['16–31', 'IRQ 0 to 15'], ['[32]', null], ['33–43', 'IRQ 17 to 27'], ['[44]', 'USART2_IRQHandler']];

  const gFire = s('g', { class: 'fade' }, g);
  box(gFire, 10, 60, 140, 46, 'TIM3 fires\nIRQ 16', { cls: 'f-pri', textCls: 't-on t-bold', stroke: 'sep', lh: 16 });
  const gSlot = s('g', { class: 'fade' }, g);
  arrow(gSlot, 80, 108, 80, 146, { cls: 'a-pri' });
  box(gSlot, 10, 148, 140, 46, 'slot 16 + 16\n= 32', { cls: 'f-pri-soft', textCls: 't-pri t-bold', stroke: 'sep', lh: 16 });
  arrow(gSlot, 152, 171, T.x - 4, ry(4) + T.rh / 2, { cls: 'a-pri' });

  const gTable = s('g', { class: 'fade' }, g);
  s('text', { x: T.x, y: 26, class: 't-fg t-bold' }, gTable, 'vector table, 0x08000000');
  ROWS.forEach(([slot, what], i) => {
    s('rect', { x: T.x, y: ry(i), width: T.w, height: T.rh, class: (i === 4 ? 'f-surface' : 'f-seg') + ' sep' }, gTable);
    s('text', { x: T.x + 8, y: ry(i) + T.rh / 2, dy: '0.35em', class: i === 4 || i === 6 ? 't-fg t-bold' : 't-muted' }, gTable, slot);
    if (what) s('text', { x: T.x + 56, y: ry(i) + T.rh / 2, dy: '0.35em', class: 't-fg' }, gTable, what);
  });
  [[0, '0x08000000'], [4, '0x08000080'], [6, '0x080000B0']].forEach(([i, a]) => s('text', { x: T.x - 8, y: ry(i) + T.rh / 2 + 15, 'text-anchor': 'end', class: 't-sm' }, gTable, a));
  s('rect', { x: T.x, y: ry(4), width: T.w, height: T.rh, class: 'f-none outline-pri' }, gTable);

  const H = { x: 570, w: 180, h: 40, tim: 104, usart: 188 };
  const gH = s('g', { class: 'fade' }, g);
  s('text', { x: H.x, y: 26, class: 't-fg t-bold' }, gH, 'your functions in flash');
  const timBox = box(gH, H.x, H.tim, H.w, H.h, 'TIM3_IRQHandler', { cls: 'f-surface', textCls: 't-fg' });
  const timLab = s('text', { x: H.x + H.w / 2, y: H.tim + H.h + 16, 'text-anchor': 'middle', class: 't-sm' }, gH, '');
  box(gH, H.x, H.usart, H.w, H.h, 'USART2_IRQHandler', { cls: 'f-surface', textCls: 't-fg' });
  const usLab = s('text', { x: H.x + H.w / 2, y: H.usart + H.h + 16, 'text-anchor': 'middle', class: 't-sm' }, gH, '');
  arrow(gH, T.x + T.w + 2, ry(6) + T.rh / 2, H.x - 4, H.usart + 30, { cls: 'a-muted' });

  const gSlip = s('g', { class: 'fade' }, g);
  s('text', { x: T.x + 56, y: ry(4) + T.rh / 2, dy: '0.35em', class: 't-bad t-bold' }, gSlip, 'USART2_IRQHandler');
  const gJump = s('g', { class: 'fade' }, g);
  arrow(gJump, T.x + T.w + 2, ry(4) + T.rh / 2, H.x - 4, H.usart + 12, { cls: 'a-bad', width: 2.5 });
  const gFix = s('g', {}, g);
  s('text', { x: T.x + 56, y: ry(4) + T.rh / 2, dy: '0.35em', class: 't-ok t-bold' }, gFix, 'TIM3_IRQHandler');
  arrow(gFix, T.x + T.w + 2, ry(4) + T.rh / 2, H.x - 4, H.tim + H.h / 2, { cls: 'a-ok', width: 2.5 });

  const NOTES = [
    'TIM3 is IRQ 16, so the NVIC takes slot 16 + 16 = 32. The slot holds the address of USART2_IRQHandler, so that function runs. Nothing compares the slot with the source.',
    'TIM3 raises IRQ 16. The NVIC knows only the number.',
    'The number indexes the table. Exception 16 + 16 = 32 is the word at 0x08000000 + 4 × 32 = 0x08000080.',
    'The hardware loads that word into the PC and jumps. The word is USART2_IRQHandler\'s address, so USART2\'s code runs for a TIM3 event and TIM3_IRQHandler is never called.',
    'With TIM3_IRQHandler\'s address in slot 32, the same lookup reaches the right code. The name only mattered at build time, when it decided which address went into the slot.',
  ];
  const note = role('vt-note');
  steps(viz('vt-steps'), ['All', '1 · TIM3 fires', '2 · slot 32', '3 · load and jump', 'Fixed table'], k => {
    const fixed = k === 4;
    [gSlip, gJump].forEach(x => { x.style.display = fixed ? 'none' : ''; });
    gFix.style.display = fixed ? '' : 'none';
    gFire.classList.toggle('dim', k === 2 || k === 3);
    gSlot.classList.toggle('dim', k === 1 || k === 3);
    gTable.classList.toggle('dim', k === 1);
    gSlip.classList.toggle('dim', k === 1);
    gH.classList.toggle('dim', k === 1 || k === 2);
    gJump.classList.toggle('dim', k === 1 || k === 2);
    timBox.setAttribute('class', (fixed ? 'f-ok-soft' : 'f-surface') + ' box');
    timLab.textContent = fixed ? 'runs on every TIM3 interrupt' : 'never runs';
    usLab.textContent = fixed ? 'runs on USART2 only' : 'runs on every TIM3 interrupt';
    usLab.setAttribute('class', fixed ? 't-sm' : 't-bad t-sm');
    note.textContent = NOTES[k];
  });
});

QV.register('s1-mc4', function (q) {
  const { s, svg, steps, box, arrow, table } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const g = svg(viz('gate'), 760, 250, { label: 'Clock, RCC gate, USART2 with its CR1 register, pin multiplexer and pin PA2, with a store and a load from the CPU', minWidth: 600 });
  const Y = 180;
  box(g, 10, Y - 20, 90, 40, 'clock', { cls: 'f-surface' });
  const U = { x: 290, y: 90, w: 280, h: 130 };
  const CELL = { x: 336, y: 140, w: 46 };
  const layer = s('g', {}, g);
  box(g, 612, Y - 30, 58, 60, 'MUX', { cls: 'f-surface' });
  box(g, 700, Y - 20, 50, 40, 'PA2', { cls: 'f-surface' });
  s('line', { x1: 670, x2: 700, y1: Y, y2: Y, class: 's-muted' }, g);
  box(g, 320, 6, 140, 32, 'CPU', { cls: 'f-surface', textCls: 't-fg t-bold' });

  function draw(open) {
    layer.textContent = '';
    const val = open ? [1, 1, 0, 1] : [0, 0, 0, 0];
    s('line', { x1: 100, x2: 140, y1: Y, y2: Y, class: 's-pri' }, layer);
    box(layer, 140, Y - 30, 100, 60, 'RCC gate\n' + (open ? 'open' : 'shut'), { cls: open ? 'f-ok-soft' : 'f-bad-soft', textCls: open ? 't-ok t-bold' : 't-bad t-bold', lh: 16 });
    s('text', { x: 190, y: Y + 48, 'text-anchor': 'middle', class: 't-sm' }, layer, 'USART2EN = ' + (open ? 1 : 0));
    s('line', { x1: 240, x2: U.x, y1: Y, y2: Y, class: open ? 's-pri' : 's-line dash' }, layer);
    s('line', { x1: U.x + U.w, x2: 612, y1: Y, y2: Y, class: open ? 's-muted' : 's-line dash' }, layer);
    s('rect', { x: U.x, y: U.y, width: U.w, height: U.h, rx: 8, class: (open ? 'f-surface' : 'f-seg') + ' box' }, layer);
    s('text', { x: U.x + 12, y: U.y + 20, class: 't-fg t-bold' }, layer, 'USART2');
    s('text', { x: U.x + U.w - 12, y: U.y + 20, 'text-anchor': 'end', class: open ? 't-ok t-sm' : 't-bad t-sm' }, layer, open ? 'clocked' : 'no clock');
    s('text', { x: U.x + 12, y: CELL.y + 15, dy: '0.35em', class: 't-fg' }, layer, 'CR1');
    ['TE', 'RE', 'UESM', 'UE'].forEach((n, i) => {
      const x = CELL.x + i * CELL.w;
      s('text', { x: x + CELL.w / 2, y: CELL.y - 6, 'text-anchor': 'middle', class: 't-sm' }, layer, n);
      s('rect', { x, y: CELL.y, width: CELL.w, height: 30, class: (val[i] ? 'f-pri' : 'f-surface') + ' box' }, layer);
      s('text', { x: x + CELL.w / 2, y: CELL.y + 15, dy: '0.35em', 'text-anchor': 'middle', class: val[i] ? 't-on t-bold' : 't-fg' }, layer, val[i]);
    });
    s('text', { x: CELL.x + 4 * CELL.w + 8, y: CELL.y + 15, dy: '0.35em', class: 't-sm' }, layer, 'bits 3:0');
    s('text', { x: CELL.x, y: CELL.y + 52, class: open ? 't-pri t-bold' : 't-bad t-bold' }, layer, 'CR1 = ' + (open ? '0x0000000D' : '0x00000000'));
    arrow(layer, 360, 40, 360, CELL.y - 18, { cls: open ? 'a-pri' : 'a-bad', width: 2 });
    s('text', { x: 352, y: 62, 'text-anchor': 'end', class: 't-fg' }, layer, 'str 0x0000000D');
    if (!open) s('text', { x: 352, y: 78, 'text-anchor': 'end', class: 't-bad t-sm' }, layer, 'goes nowhere');
    arrow(layer, 420, CELL.y - 18, 420, 40, { cls: open ? 'a-ok' : 'a-bad', width: 2 });
    s('text', { x: 428, y: 62, class: open ? 't-ok t-bold' : 't-bad t-bold' }, layer, 'ldr → ' + (open ? '0x0000000D' : '0x00000000'));
    if (!open) s('text', { x: 428, y: 78, class: 't-bad t-sm' }, layer, 'no error, no fault');
  }
  const note = role('gate-note');
  steps(viz('gate-steps'), ['Gate shut, the reset state', 'Gate open'], k => {
    draw(k === 1);
    note.textContent = k === 0
      ? 'At reset USART2EN is 0. The store targets a real address, but the peripheral behind it has no clock, so the write vanishes and the load returns 0x00000000. Nothing faults and nothing warns.'
      : 'Set USART2\'s enable bit in RCC first. Now CR1 keeps 0x0000000D, with UE (bit 0), RE (bit 2) and TE (bit 3) set, and the load returns what was stored.';
  });

  const tb = table(viz('symptoms'), [{ text: 'Option', cls: 'l' }, { text: 'Suspect', cls: 'l' }, 'CR1 reads back', { text: 'What you see', cls: 'l' }], [
    [{ text: 'B', cls: 'l' }, { text: 'clock gate shut', cls: 'l' }, { text: '0x00000000', cls: 'hl' }, { text: 'every write vanishes, nothing works', cls: 'l' }],
    [{ text: 'A', cls: 'l' }, { text: 'pin given to the wrong owner', cls: 'l' }, '0x0000000D', { text: 'PA2 healthy but carries no signal', cls: 'l' }],
    [{ text: 'C', cls: 'l' }, { text: 'divisor from the CPU clock', cls: 'l' }, '0x0000000D', { text: 'garbage characters on the wire', cls: 'l' }],
  ]);
  tb.rows[0].classList.add('on');
});
