QV.register('s2-mc1', function (q) {
  const { s, svg, steps, table, arrow, box } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const BYTES = ['11', '22', '33', '44', '55', '66', '77', '88'];
  const LANES = ['31:24', '23:16', '15:8', '7:0'];
  const M = { x0: 120, cw: 74, y: 52, h: 40 };
  const R = { x0: 176, sw: 120, y: 206, h: 40 };
  const mx = k => M.x0 + k * M.cw, mc = k => mx(k) + M.cw / 2;
  const rx = j => R.x0 + j * R.sw, rc = j => rx(j) + R.sw / 2;

  const g = svg(viz('field'), 760, 320, { label: 'Eight buffer bytes with word boundaries, and the 32-bit register v filled by the chosen line', minWidth: 560 });
  s('text', { x: 0, y: M.y + 16, class: 't-fg t-bold' }, g, 'memory');
  s('text', { x: 0, y: M.y + 31, class: 't-sm' }, g, 'buf, lowest left');
  [0, 1].forEach(w => {
    s('line', { x1: mx(4 * w) + 6, x2: mx(4 * w + 4) - 6, y1: 22, y2: 22, class: 's-muted' }, g);
    s('text', { x: mx(4 * w) + 2 * M.cw, y: 14, 'text-anchor': 'middle', class: 't-sm' }, g, `aligned word at 0x2000010${4 * w}`);
  });
  BYTES.forEach((b, k) => {
    const field = k >= 1 && k <= 4;
    s('text', { x: mc(k), y: M.y - 8, 'text-anchor': 'middle', class: 't-sm' }, g, `buf[${k}]`);
    s('rect', { x: mx(k), y: M.y, width: M.cw, height: M.h, class: (field ? 'f-pri-soft' : 'f-seg') + ' sep' }, g);
    s('text', { x: mc(k), y: M.y + M.h / 2, dy: '0.35em', 'text-anchor': 'middle', class: (field ? 't-pri' : 't-fg') + ' t-bold t-lg' }, g, b);
    s('text', { x: mc(k), y: M.y + M.h + 16, 'text-anchor': 'middle', class: 't-sm' }, g, '0x2000010' + k);
  });
  [0, 4, 8].forEach(k => s('line', { x1: mx(k), x2: mx(k), y1: 28, y2: M.y + M.h + 4, class: 's-fg', style: 'stroke-width: 2.5' }, g));
  s('text', { x: 0, y: R.y + 16, class: 't-fg t-bold' }, g, 'v');
  s('text', { x: 0, y: R.y + 31, class: 't-sm' }, g, 'bit 31 left');
  LANES.forEach((l, j) => s('text', { x: rc(j), y: R.y + R.h + 16, 'text-anchor': 'middle', class: 't-sm' }, g, 'bits ' + l));
  const layer = s('g', {}, g);

  // map: [buffer index, register slot], slot 0 = bits 31:24
  const OPT = {
    B: { map: [[1, 0], [2, 1], [3, 2], [4, 3]], slots: ['22', '33', '44', '55'], win: [[1, 1], [2, 1], [3, 1], [4, 1]], res: 'v = 0x22334455', sub: 'big-endian: buf[1] lands on top', ok: false },
    C: { map: [[1, 3], [2, 2], [3, 1]], slots: ['00', '44', '33', '22'], win: [[0, 4]], res: 'v = 0x44332211 >> 8 = 0x00443322', sub: 'the field\'s top byte, 0x55, is never loaded', ok: false },
    D: { map: [[1, 3], [2, 2], [3, 1], [4, 0]], slots: ['55', '44', '33', '22'], win: [[1, 1], [2, 1], [3, 1], [4, 1]], res: 'v = 0x55443322', sub: 'four byte loads, buf[1] in bits 7:0', ok: true },
  };
  const NOTE = {
    A: 'Line A loads one word from buf + 1 = 0x20000101. The address is not a multiple of 4, so the Cortex-M0+ HardFaults before v is written. A Cortex-M3 or M4 would return 0x55443322, more slowly.',
    B: 'Line B puts buf[1] in bits 31:24 and buf[4] in bits 7:0. That is big-endian assembly, so v = 0x22334455. Every load is a byte, so nothing faults, and the value is still wrong.',
    C: 'Line C loads the aligned word at 0x20000100, which is 0x44332211, and shifts it right by 8. That drops 0x11 and gives 0x00443322. The field\'s top byte, 0x55 at buf[4], is never loaded.',
    D: 'Line D loads the four bytes one at a time, and a byte load is aligned at any address. buf[1] goes to bits 7:0 and buf[4] to bits 31:24, so v = 0x55443322, the little-endian value of 22 33 44 55.',
  };

  const tb = table(viz('field-table'), [{ text: 'Line', cls: 'l' }, { text: 'What it loads', cls: 'l' }, 'v on the Cortex-M0+'], [
    [{ text: 'A', cls: 'l' }, { text: 'one word from 0x20000101, addr % 4 = 1', cls: 'l' }, 'HardFault'],
    [{ text: 'B', cls: 'l' }, { text: 'four bytes, buf[1] in the top byte', cls: 'l' }, '0x22334455'],
    [{ text: 'C', cls: 'l' }, { text: 'the aligned word at 0x20000100, then >> 8', cls: 'l' }, '0x00443322'],
    [{ text: 'D', cls: 'l' }, { text: 'four bytes, buf[1] in the low byte', cls: 'l' }, { text: '0x55443322', cls: 'hl' }],
  ]);

  const note = role('field-note');
  steps(viz('field-steps'), ['A', 'B', 'C', 'D'], k => {
    const key = 'ABCD'[k];
    layer.textContent = '';
    tb.rows.forEach((r, i) => r.classList.toggle('on', i === k));
    note.textContent = NOTE[key];
    if (key === 'A') {
      s('rect', { x: mx(1) + 2, y: M.y + 2, width: 4 * M.cw - 4, height: M.h - 4, rx: 3, class: 's-bad' }, layer);
      s('text', { x: mx(1) + 2 * M.cw, y: M.y + M.h + 36, 'text-anchor': 'middle', class: 't-bad t-bold' }, layer, 'one ldr from 0x20000101, and 0x101 % 4 = 1');
      arrow(layer, mx(1) + 2 * M.cw, M.y + M.h + 46, mx(1) + 2 * M.cw, R.y - 4, { cls: 'a-bad', width: 2 });
      box(layer, R.x0, R.y, 4 * R.sw, R.h, 'HardFault: v is never written', { cls: 'f-bad-soft', textCls: 't-bad t-bold', stroke: 'sep' });
      s('text', { x: R.x0 + 2 * R.sw, y: 294, 'text-anchor': 'middle', class: 't-bad t-bold t-lg' }, layer, 'Cortex-M0+: HardFault');
      s('text', { x: R.x0 + 2 * R.sw, y: 312, 'text-anchor': 'middle', class: 't-sm' }, layer, 'a Cortex-M3 or M4 would load 0x55443322, more slowly');
      return;
    }
    const o = OPT[key];
    o.win.forEach(([a, n]) => s('rect', { x: mx(a) + 3, y: M.y + 3, width: n * M.cw - 6, height: M.h - 6, rx: 3, class: 'f-none outline-pri' }, layer));
    o.map.forEach(([c, j]) => arrow(layer, mc(c), M.y + M.h + 24, rc(j), R.y - 4, { cls: 'a-pri', width: 1.5 }));
    if (key === 'C') {
      s('text', { x: mc(0), y: M.y + M.h + 34, 'text-anchor': 'middle', class: 't-bad t-sm' }, layer, 'shifted out');
      s('text', { x: mc(4), y: M.y + M.h + 34, 'text-anchor': 'middle', class: 't-bad t-sm' }, layer, 'never loaded');
    }
    o.slots.forEach((v, j) => {
      const zero = key === 'C' && j === 0;
      s('rect', { x: rx(j), y: R.y, width: R.sw, height: R.h, class: (zero ? 'f-bad-soft' : 'f-pri-soft') + ' sep' }, layer);
      s('text', { x: rc(j), y: R.y + R.h / 2, dy: '0.35em', 'text-anchor': 'middle', class: (zero ? 't-bad' : 't-pri') + ' t-bold t-lg' }, layer, v);
    });
    s('text', { x: R.x0 + 2 * R.sw, y: 294, 'text-anchor': 'middle', class: (o.ok ? 't-ok' : 't-bad') + ' t-bold t-lg' }, layer, o.res);
    s('text', { x: R.x0 + 2 * R.sw, y: 312, 'text-anchor': 'middle', class: 't-sm' }, layer, o.sub);
  }, 3);

  // Figure 2: which start addresses each access size may use
  const A = { x0: 200, cw: 62, y: 40, rh: 34 };
  const a = svg(viz('align'), 760, 220, { label: 'Grid of addresses 0x20000100 to 0x20000107 against byte, halfword and word accesses, with the legal start addresses lit', minWidth: 560 });
  const ROWS = [['byte', 1], ['halfword', 2], ['word', 4]];
  for (let c = 0; c < 8; c++) s('text', { x: A.x0 + c * A.cw + A.cw / 2, y: A.y - 8, 'text-anchor': 'middle', class: c === 1 ? 't-bad t-bold' : 't-sm' }, a, '…10' + c);
  s('text', { x: A.x0 - 10, y: A.y - 8, 'text-anchor': 'end', class: 't-sm' }, a, 'address 0x20000…');
  ROWS.forEach(([name, n], r) => {
    const y = A.y + r * A.rh;
    s('text', { x: A.x0 - 10, y: y + A.rh / 2, dy: '0.35em', 'text-anchor': 'end', class: 't-fg' }, a, `${name}, n = ${n}`);
    for (let c = 0; c < 8; c++) {
      const ok = c % n === 0, x = A.x0 + c * A.cw;
      s('rect', { x, y, width: A.cw, height: A.rh, class: (ok ? 'f-pri' : 'f-seg') + ' sep' }, a);
      const t = ok ? 'start' : c === 1 ? 'HardFault' : '';
      if (t) s('text', { x: x + A.cw / 2, y: y + A.rh / 2, dy: '0.35em', 'text-anchor': 'middle', class: ok ? 't-on t-sm' : 't-bad t-sm t-bold' }, a, t);
    }
  });
  s('rect', { x: A.x0 + A.cw + 1, y: A.y - 24, width: A.cw - 2, height: 3 * A.rh + 30, rx: 4, class: 's-bad' }, a);
  s('text', { x: A.x0 + 1.5 * A.cw, y: A.y + 3 * A.rh + 22, 'text-anchor': 'middle', class: 't-bad t-bold' }, a, 'buf + 1');
  s('text', { x: A.x0, y: A.y + 3 * A.rh + 50, class: 't-muted' }, a, 'M0+: an unaligned access faults at once.');
  s('text', { x: A.x0, y: A.y + 3 * A.rh + 66, class: 't-muted' }, a, 'M3 / M4: ordinary loads work, slower.');
});

QV.register('s2-mc2', function (q) {
  const { s, svg, steps, box, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);

  // Figure 1: two AVR spaces against the one STM32C031 map
  const g = svg(viz('hv'), 760, 310, { label: 'AVR program and data memory both holding an address 0x0100, against the single STM32C031 map where the table is in flash', minWidth: 600 });
  const gAvr = s('g', { class: 'fade' }, g);
  s('text', { x: 10, y: 18, class: 't-fg t-bold' }, gAvr, 'AVR: two address spaces');
  const COL = [{ x: 60, name: 'program memory', sub: 'flash', row: 'gamma[0], gamma[1] …', hit: true }, { x: 240, name: 'data memory', sub: 'SRAM', row: 'some variable', hit: false }];
  const CW = 120, TOP = 60, BOT = 236, ROW = 116;
  COL.forEach(c => {
    s('text', { x: c.x + CW / 2, y: 38, 'text-anchor': 'middle', class: 't-fg' }, gAvr, c.name);
    s('text', { x: c.x + CW / 2, y: 52, 'text-anchor': 'middle', class: 't-sm' }, gAvr, c.sub);
    s('rect', { x: c.x, y: TOP, width: CW, height: BOT - TOP, class: 'f-surface box' }, gAvr);
    s('rect', { x: c.x, y: ROW, width: CW, height: 30, class: (c.hit ? 'f-pri-soft' : 'f-seg') + ' box' }, gAvr);
    s('text', { x: c.x + CW / 2, y: ROW + 15, dy: '0.35em', 'text-anchor': 'middle', class: c.hit ? 't-pri t-sm t-bold' : 't-sm' }, gAvr, c.row);
    s('text', { x: c.x - 6, y: ROW + 30, dy: '0.35em', 'text-anchor': 'end', class: 't-sm' }, gAvr, '0x0100');
    s('text', { x: c.x - 6, y: BOT, dy: '0.35em', 'text-anchor': 'end', class: 't-sm' }, gAvr, '0x0000');
  });
  box(gAvr, 145, 262, 130, 30, 'Z = 0x0100', { cls: 'f-seg', textCls: 't-fg t-bold' });

  s('line', { x1: 400, x2: 400, y1: 8, y2: 302, class: 's-line' }, g);
  const gStm = s('g', { class: 'fade' }, g);
  s('text', { x: 420, y: 18, class: 't-fg t-bold' }, gStm, 'STM32C031: one address space');
  const MAP = [['0xE0000000', 'PPB', 'NVIC, SysTick'], ['0x50000000', 'IOPORT', 'GPIO'], ['0x40000000', 'peripherals', 'USART, TIM, RCC'], ['0x20000000', 'SRAM', 'variables, stack'], ['0x08000000', 'flash', 'code, gamma[ ]'], ['0x00000000', 'alias', 'flash, at reset']];
  const mxL = 590, mw = 160, my = i => 34 + i * 34;
  MAP.forEach(([addr, name, what], i) => {
    const hit = i === 4;
    s('rect', { x: mxL, y: my(i), width: mw, height: 34, class: (hit ? 'f-pri-soft' : 'f-seg') + ' sep' }, gStm);
    s('text', { x: mxL + mw / 2, y: my(i) + 13, 'text-anchor': 'middle', class: hit ? 't-pri t-bold' : 't-fg t-bold' }, gStm, name);
    s('text', { x: mxL + mw / 2, y: my(i) + 27, 'text-anchor': 'middle', class: 't-sm' }, gStm, what);
    s('text', { x: mxL - 6, y: my(i) + 34, dy: '0.35em', 'text-anchor': 'end', class: 't-sm' }, gStm, addr);
  });
  box(gStm, 420, my(4) - 10, 96, 54, 'ldrb\ngamma[i]', { cls: 'f-pri', textCls: 't-on t-bold', stroke: 'sep', lh: 16 });
  s('text', { x: 420, y: 274, class: 't-muted' }, gStm, 'one ordinary load, one place');
  s('text', { x: 420, y: 292, class: 't-muted' }, gStm, 'the address alone says where');
  const layer = s('g', {}, g);

  const NOTES = [
    'On the AVR, an ordinary LD with Z = 0x0100 reads data memory at 0x0100. That is some SRAM byte, not the table. Option A describes this, and it is true only on a Harvard machine.',
    'LPM reads program memory at the same number, 0x0100, and gets gamma[0]. PROGMEM put the table in program memory, and pgm_read_byte() is a wrapper around LPM.',
    'The STM32C031 has one map. gamma\'s address is a flash address, and nothing else answers to it. The ordinary ldrb that gamma[i] compiles to reads flash directly. There is no special instruction, no fault and no copy.',
  ];
  const note = role('hv-note');
  steps(viz('hv-steps'), ['AVR · LD', 'AVR · LPM', 'STM32C031 · ldrb'], k => {
    layer.textContent = '';
    gAvr.classList.toggle('dim', k === 2);
    gStm.classList.toggle('dim', k < 2);
    if (k < 2) {
      const c = COL[k === 1 ? 0 : 1], good = k === 1;
      arrow(layer, 210, 260, c.x + CW / 2, ROW + 34, { cls: good ? 'a-ok' : 'a-bad', width: 2 });
      s('text', { x: k === 1 ? 130 : 290, y: 200, 'text-anchor': 'middle', class: (good ? 't-ok' : 't-bad') + ' t-bold t-lg' }, layer, good ? 'LPM' : 'LD');
      s('rect', { x: c.x + 2, y: ROW + 2, width: CW - 4, height: 26, rx: 3, class: good ? 's-ok' : 's-bad' }, layer);
      s('text', { x: c.x + CW / 2, y: ROW - 10, 'text-anchor': 'middle', class: (good ? 't-ok' : 't-bad') + ' t-sm' }, layer, good ? 'the table' : 'not the table');
    } else {
      arrow(layer, 518, my(4) + 17, mxL - 4, my(4) + 17, { cls: 'a-ok', width: 2 });
      s('rect', { x: mxL + 2, y: my(4) + 2, width: mw - 4, height: 30, rx: 3, class: 's-ok' }, layer);
    }
    note.textContent = NOTES[k];
  }, 2);

  // Figure 2: what the startup code copies, and what stays in flash
  const f = svg(viz('sections'), 760, 236, { label: 'Flash holds the vector table, code, rodata with gamma and the data image; startup copies only data to SRAM', minWidth: 600 });
  const FX = 130, FY = 56, SY = 166, BH = 44;
  s('text', { x: 0, y: FY + 18, class: 't-fg t-bold' }, f, 'flash');
  s('text', { x: 0, y: FY + 34, class: 't-sm' }, f, '0x08000000');
  s('text', { x: 0, y: SY + 18, class: 't-fg t-bold' }, f, 'SRAM');
  s('text', { x: 0, y: SY + 34, class: 't-sm' }, f, '0x20000000');
  const seg = (y, list) => {
    let x = FX;
    return list.map(([name, sub, w, cls]) => {
      s('rect', { x, y, width: w, height: BH, class: cls + ' sep' }, f);
      s('text', { x: x + w / 2, y: y + 18, 'text-anchor': 'middle', class: cls === 'f-pri-soft' ? 't-pri t-bold' : 't-fg t-bold' }, f, name);
      s('text', { x: x + w / 2, y: y + 34, 'text-anchor': 'middle', class: 't-sm' }, f, sub);
      const mid = x + w / 2;
      x += w;
      return mid;
    });
  };
  const fm = seg(FY, [['.isr_vector', 'vector table', 90, 'f-seg'], ['.text', 'code', 190, 'f-seg'], ['.rodata', 'gamma[256]', 170, 'f-pri-soft'], ['.data image', 'initial values', 110, 'f-seg']]);
  const sm = seg(SY, [['.data', 'initialised', 110, 'f-seg'], ['.bss', 'zeroed', 120, 'f-seg'], ['', '', 230, 'f-surface'], ['stack', '', 100, 'f-seg']]);
  arrow(f, fm[3], FY + BH + 4, sm[0], SY - 4, { cls: 'a-muted', width: 1.5 });
  s('text', { x: 300, y: 124, 'text-anchor': 'middle', class: 't-fg' }, f, 'Reset_Handler copies .data');
  arrow(f, fm[2], 14, fm[2], FY - 4, { cls: 'a-ok', width: 2 });
  s('text', { x: fm[2] + 10, y: 26, class: 't-ok t-bold' }, f, 'ldrb for gamma[i] reads here');
  arrow(f, fm[2], FY + BH + 4, fm[2], SY - 4, { cls: 'a-bad', width: 1.5, dash: true });
  s('text', { x: fm[2] + 10, y: 142, class: 't-bad' }, f, 'no copy of gamma (option D)');
  s('text', { x: 380, y: 230, 'text-anchor': 'middle', class: 't-muted' }, f, 'Only .data is copied. A const table is read in place by an ordinary load.');
});

QV.register('s2-mc3', function (q) {
  const { s, svg, steps, box, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const g = svg(viz('disp'), 760, 330, { label: 'Non-vectored dispatch reading status registers one by one, against vectored dispatch indexing slot 44 of the vector table', minWidth: 600 });
  s('text', { x: 10, y: 18, class: 't-fg t-bold' }, g, 'non-vectored, the 8-bit controller');
  s('text', { x: 400, y: 18, class: 't-fg t-bold' }, g, 'vectored, the STM32C031');
  s('line', { x1: 380, x2: 380, y1: 6, y2: 322, class: 's-line' }, g);

  const L1 = s('g', { class: 'fade' }, g), L2 = s('g', { class: 'fade' }, g), L3 = s('g', { class: 'fade' }, g);
  ['pin', 'timer', 'UART'].forEach((n, i) => {
    const x = 20 + i * 115;
    box(L1, x, 32, 100, 28, n, { cls: i === 2 ? 'f-pri' : 'f-surface', textCls: i === 2 ? 't-on t-bold' : 't-fg' });
    arrow(L1, x + 50, 62, 185, 90, { cls: i === 2 ? 'a-pri' : 'a-muted', width: i === 2 ? 2 : 1.2 });
  });
  box(L1, 100, 92, 170, 30, 'one fixed address', { cls: 'f-seg', textCls: 't-fg t-bold' });
  const READS = [['read pin status', 'no'], ['read timer status', 'no'], ['read UART status', 'yes']];
  READS.forEach(([t, r], i) => {
    const y = 140 + i * 30, yes = r === 'yes';
    s('rect', { x: 70, y, width: 230, height: 26, rx: 4, class: (yes ? 'f-sec-soft' : 'f-surface') + ' box' }, L2);
    s('text', { x: 82, y: y + 13, dy: '0.35em', class: 't-fg' }, L2, t);
    s('text', { x: 288, y: y + 13, dy: '0.35em', 'text-anchor': 'end', class: yes ? 't-sec t-bold' : 't-muted' }, L2, r);
  });
  arrow(L2, 185, 124, 185, 138, { cls: 'a-muted', head: 6 });
  s('text', { x: 310, y: 172, class: 't-sec t-bold' }, L2, '3 reads');
  s('text', { x: 310, y: 186, class: 't-sec t-sm' }, L2, 'software');
  arrow(L3, 185, 228, 185, 244, { cls: 'a-muted', head: 6 });
  box(L3, 70, 246, 230, 28, 'call uart_handler()', { cls: 'f-surface', textCls: 't-fg' });
  arrow(L3, 185, 276, 185, 290, { cls: 'a-muted', head: 6 });
  box(L3, 100, 292, 170, 28, 'UART routine runs', { cls: 'f-ok-soft', textCls: 't-ok t-bold' });

  const R1 = s('g', { class: 'fade' }, g), R2 = s('g', { class: 'fade' }, g), R3 = s('g', { class: 'fade' }, g);
  [['EXTI4_15', 7], ['TIM3', 16], ['USART2', 28]].forEach(([n, irq], i) => {
    const x = 400 + i * 118;
    box(R1, x, 32, 104, 28, n, { cls: i === 2 ? 'f-pri' : 'f-surface', textCls: i === 2 ? 't-on t-bold' : 't-fg' });
    s('text', { x: x + 52, y: 74, 'text-anchor': 'middle', class: i === 2 ? 't-pri t-bold t-sm' : 't-sm' }, R1, 'IRQ ' + irq);
  });
  box(R2, 600, 92, 150, 30, '16 + 28 = 44', { cls: 'f-pri-soft', textCls: 't-pri t-bold' });
  arrow(R2, 688, 80, 688, 90, { cls: 'a-pri', head: 6 });
  const T = { x: 410, w: 220, y: 146, rh: 26 };
  s('text', { x: T.x, y: T.y - 8, class: 't-sm' }, R2, 'vector table, 0x08000000');
  [['[23]', 'EXTI4_15_IRQHandler'], ['[32]', 'TIM3_IRQHandler'], ['[44]', 'USART2_IRQHandler']].forEach(([slot, h], i) => {
    const y = T.y + i * T.rh, hit = i === 2;
    s('rect', { x: T.x, y, width: T.w, height: T.rh, class: (hit ? 'f-pri-soft' : 'f-seg') + ' sep' }, R2);
    s('text', { x: T.x + 8, y: y + T.rh / 2, dy: '0.35em', class: hit ? 't-pri t-bold' : 't-muted' }, R2, slot);
    s('text', { x: T.x + 50, y: y + T.rh / 2, dy: '0.35em', class: hit ? 't-pri t-bold' : 't-fg' }, R2, h);
  });
  arrow(R2, 675, 124, T.x + T.w + 4, T.y + 2.5 * T.rh, { cls: 'a-pri', width: 2 });
  s('text', { x: 642, y: 236, class: 't-pri t-bold' }, R2, 'hardware,');
  s('text', { x: 642, y: 250, class: 't-pri t-bold' }, R2, 'no code');
  arrow(R3, T.x + T.w / 2, T.y + 3 * T.rh + 2, T.x + T.w / 2, 290, { cls: 'a-pri', width: 2, label: 'address → PC', dx: 50, dy: 4 });
  box(R3, T.x + 20, 292, T.w - 40, 28, 'USART2_IRQHandler runs', { cls: 'f-ok-soft', textCls: 't-ok t-bold' });

  const NOTES = [
    'Both reach the UART\'s code. The non-vectored controller runs dispatcher code that reads status registers until one says yes. The STM32C031\'s hardware turns USART2\'s number into a slot and jumps, with no code in between.',
    'Non-vectored: every source enters at the same fixed address, so the entry alone says nothing about who called. Vectored: USART2 arrives with its number, IRQ 28.',
    'Non-vectored: software reads one status register after another, three reads here, before it knows the source. Vectored: the hardware indexes slot 16 + 28 = 44, the word at 0x080000B0.',
    'Non-vectored: the dispatcher finally calls the UART routine. Vectored: the address in slot 44 goes into the PC, and USART2_IRQHandler runs.',
  ];
  const note = role('disp-note');
  steps(viz('disp-steps'), ['All', '1 · enter', '2 · find the source', '3 · run the handler'], k => {
    [[L1, R1], [L2, R2], [L3, R3]].forEach((pair, i) => pair.forEach(x => x.classList.toggle('dim', k > 0 && k !== i + 1)));
    note.textContent = NOTES[k];
  });

  // Figure 2: what one slot holds on three vectored machines
  const f = svg(viz('slots'), 760, 236, { label: 'One vector slot on the AVR holds a jump instruction, on x86 a descriptor, on the STM32C031 a plain address', minWidth: 600 });
  const P = [
    { x: 10, name: 'AVR', l1: 'jmp handler', l2: 'an instruction', act: 'the CPU executes it', cap: 'what option C says this chip uses', capCls: 't-bad', hit: false },
    { x: 260, name: 'x86', l1: 'descriptor', l2: 'selector, offset, type', act: 'the CPU decodes it', cap: 'checked before the jump', capCls: 't-muted', hit: false },
    { x: 510, name: 'STM32C031', l1: '32-bit address', l2: 'of the handler', act: 'loaded into the PC', cap: 'this chip', capCls: 't-ok', hit: true },
  ];
  P.forEach(p => {
    const w = 240, cx = p.x + w / 2;
    s('text', { x: cx, y: 20, 'text-anchor': 'middle', class: p.hit ? 't-pri t-bold t-lg' : 't-fg t-bold t-lg' }, f, p.name);
    s('rect', { x: p.x + 20, y: 34, width: w - 40, height: 58, rx: 6, class: (p.hit ? 'f-pri-soft' : 'f-seg') + ' box' }, f);
    s('text', { x: p.x + 28, y: 48, class: 't-sm' }, f, 'one slot');
    s('text', { x: cx, y: 66, 'text-anchor': 'middle', class: p.hit ? 't-pri t-bold' : 't-fg t-bold' }, f, p.l1);
    s('text', { x: cx, y: 82, 'text-anchor': 'middle', class: 't-sm' }, f, p.l2);
    arrow(f, cx, 96, cx, 128, { cls: p.hit ? 'a-pri' : 'a-muted' });
    box(f, p.x + 20, 130, w - 40, 36, p.act, { cls: 'f-surface' });
    arrow(f, cx, 168, cx, 190, { cls: p.hit ? 'a-pri' : 'a-muted', head: 6 });
    s('text', { x: cx, y: 204, 'text-anchor': 'middle', class: 't-fg' }, f, 'handler');
    s('text', { x: cx, y: 226, 'text-anchor': 'middle', class: p.capCls + ' t-sm' }, f, p.cap);
  });
});

QV.register('s2-mc4', function (q) {
  const { s, svg, steps, box, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const P = {
    I2C1: { regs: [['CR1', 'PE, interrupt enables'], ['ISR', 'TXIS, RXNE, BUSY'], ['TXDR / RXDR', 'a byte out, a byte in']], pins: ['SCL', 'SDA'] },
    USART2: { regs: [['CR1', 'UE, TE, RE, interrupts'], ['ISR', 'TXE, RXNE'], ['TDR / RDR', 'a byte out, a byte in']], pins: ['TX', 'RX'] },
    GPIO: { regs: [['MODER, PUPDR', 'mode and pull per pin'], ['IDR', 'what are the pins?'], ['ODR, BSRR', 'drive the pins']], pins: ['PA0', '… PA15'] },
  };
  const ROLE = [['CONTROL', 'you write', 'pri'], ['STATUS', 'hardware writes', 'sec'], ['DATA', 'both ways', 'ter']];
  const g = svg(viz('roles'), 760, 270, { label: 'CPU, the control, status and data registers, the peripheral state machine and its pins, filled in for the chosen peripheral', minWidth: 600 });
  box(g, 10, 105, 80, 60, 'CPU', { cls: 'f-surface', textCls: 't-fg t-bold' });
  const RB = { x: 160, w: 220, h: 64 };
  const ry = i => 14 + i * 89;
  const names = [], subs = [];
  ROLE.forEach(([r, who, c], i) => {
    s('rect', { x: RB.x, y: ry(i), width: RB.w, height: RB.h, rx: 6, class: `f-${c}-soft box` }, g);
    s('text', { x: RB.x + 10, y: ry(i) + 16, class: `t-${c} t-sm t-bold` }, g, r + ' · ' + who);
    names.push(s('text', { x: RB.x + 10, y: ry(i) + 38, class: 't-fg t-bold t-lg' }, g, ''));
    subs.push(s('text', { x: RB.x + 10, y: ry(i) + 55, class: 't-sm' }, g, ''));
  });
  s('rect', { x: 450, y: 14, width: 150, height: 242, rx: 8, class: 'f-seg box' }, g);
  const pName = s('text', { x: 525, y: 126, 'text-anchor': 'middle', class: 't-fg t-bold t-lg' }, g, '');
  s('text', { x: 525, y: 146, 'text-anchor': 'middle', class: 't-sm' }, g, 'a state machine');
  box(g, 650, 105, 100, 60, '', { cls: 'f-surface' });
  const pins = [0, 1].map(i => s('text', { x: 700, y: 128 + i * 16, 'text-anchor': 'middle', class: 't-fg' }, g, ''));

  arrow(g, 90, 118, RB.x - 4, ry(0) + 40, { cls: 'a-pri', width: 2, label: 'write', dx: -24, dy: -4, labelCls: 't-pri' });
  arrow(g, RB.x + RB.w, ry(0) + 32, 446, ry(0) + 32, { cls: 'a-pri' });
  arrow(g, 450, ry(1) + 32, RB.x + RB.w + 4, ry(1) + 32, { cls: 'a-sec', label: 'sets flags', labelCls: 't-sec' });
  arrow(g, RB.x, ry(1) + 32, 94, ry(1) + 22, { cls: 'a-sec', width: 2, label: 'read', dy: -8, labelCls: 't-sec' });
  arrow(g, 90, 152, RB.x - 4, ry(2) + 24, { cls: 'a-muted', width: 1.5 });
  arrow(g, RB.x - 2, ry(2) + 42, 90, 162, { cls: 'a-muted', width: 1.5 });
  arrow(g, RB.x + RB.w, ry(2) + 24, 446, ry(2) + 24, { cls: 'a-muted' });
  arrow(g, 450, ry(2) + 42, RB.x + RB.w + 4, ry(2) + 42, { cls: 'a-muted' });
  arrow(g, 600, 128, 646, 128, { cls: 'a-muted', head: 6 });
  arrow(g, 650, 144, 604, 144, { cls: 'a-muted', head: 6 });

  const NOTES = {
    I2C1: 'In I2C1, CR1 holds the enable bit and the interrupt enables, ISR holds the flags the hardware sets, and TXDR and RXDR carry each byte out and in. The course never covered this block, and the template still reads it.',
    USART2: 'USART2, the lesson-08 peripheral, has the same shape. CR1 configures, ISR reports whether the transmit register is empty and whether a byte has arrived, and TDR and RDR carry the bytes.',
    GPIO: 'GPIO fills the same three roles. MODER and PUPDR configure each pin, IDR reports what the pins are, and ODR and BSRR drive them.',
  };
  const note = role('roles-note');
  const KEYS = ['I2C1', 'USART2', 'GPIO'];
  steps(viz('roles-steps'), KEYS, k => {
    const p = P[KEYS[k]];
    p.regs.forEach(([n, sub], i) => { names[i].textContent = n; subs[i].textContent = sub; });
    pName.textContent = KEYS[k];
    pins.forEach((t, i) => { t.textContent = p.pins[i]; });
    note.textContent = NOTES[KEYS[k]];
  });

  // Figure 2: ARM's blocks and ST's blocks, and the manual for each
  const f = svg(viz('manuals'), 760, 250, { label: 'ARM supplies NVIC, SysTick, SCB and MPU, described in the Cortex-M Generic User Guide; ST supplies GPIO, USART, TIM, ADC, RCC and I2C1, described in ST\'s reference manual', minWidth: 600 });
  const B = [
    { x: 20, cls: 'f-surface', who: 'ARM supplies', blocks: 'NVIC · SysTick · SCB · MPU', where: 'private peripheral bus, 0xE0000000', hdr: 'core_cm0plus.h', man: 'Cortex-M Generic User Guide', cap: 'options B and D look here', capCls: 't-bad' },
    { x: 400, cls: 'f-pri-soft', who: 'ST supplies', blocks: 'GPIO · USART · TIM · ADC · RCC', where: 'peripherals at 0x40000000, 0x50000000', hdr: 'stm32c031xx.h', man: 'ST reference manual (RM0490)', cap: 'options A and C look here', capCls: 't-ok' },
  ];
  B.forEach((b, i) => {
    const cx = b.x + 170;
    s('rect', { x: b.x, y: 10, width: 340, height: 196, rx: 8, class: b.cls + ' box' }, f);
    s('text', { x: cx, y: 34, 'text-anchor': 'middle', class: 't-fg t-bold t-lg' }, f, b.who);
    s('text', { x: cx, y: 58, 'text-anchor': 'middle', class: 't-fg' }, f, b.blocks);
    if (i === 1) box(f, cx - 40, 70, 80, 26, 'I2C1', { cls: 'f-pri', textCls: 't-on t-bold', stroke: 'sep' });
    s('text', { x: cx, y: 118, 'text-anchor': 'middle', class: 't-sm' }, f, b.where);
    s('text', { x: cx, y: 136, 'text-anchor': 'middle', class: 't-sm' }, f, b.hdr);
    s('text', { x: cx, y: 166, 'text-anchor': 'middle', class: i ? 't-pri t-bold' : 't-fg t-bold' }, f, b.man);
    s('text', { x: cx, y: 190, 'text-anchor': 'middle', class: b.capCls + ' t-sm t-bold' }, f, b.cap);
  });
  s('text', { x: 380, y: 230, 'text-anchor': 'middle', class: 't-muted' }, f, 'ARM\'s box transfers to every Cortex-M. ST\'s box transfers to the next STM32, and no further.');
});
