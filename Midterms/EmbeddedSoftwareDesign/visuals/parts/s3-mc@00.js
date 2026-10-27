QV.register('s3-mc1', function (q) {
  const { s, svg, steps, table, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const B = ['00', '01', '86', 'A0'];
  const BITS = ['31:24', '23:16', '15:8', '7:0'];
  const ORD = ['first', 'second', 'third', 'fourth'];
  const L = { x0: 150, bw: 110, step: 122, mem: 52, reg: 178, bh: 38 };
  const bx = k => L.x0 + k * L.step, bc = k => bx(k) + L.bw / 2;

  const g = svg(viz('nb'), 680, 270, { label: 'Bytes 00 01 86 A0 in buf, loaded little-endian into n as 0xA0860100', minWidth: 540 });
  s('text', { x: L.x0, y: 14, class: 't-ok t-sm' }, g, 'buf % 4 = 0, so the word load is aligned and legal');
  s('text', { x: 0, y: L.mem + 13, class: 't-fg t-bold' }, g, 'memory');
  s('text', { x: 0, y: L.mem + 29, class: 't-sm' }, g, 'buf, arrival order');
  s('text', { x: 0, y: L.reg + 13, class: 't-fg t-bold' }, g, 'n');
  s('text', { x: 0, y: L.reg + 29, class: 't-sm' }, g, 'bit 31 left');
  const top = B.map((v, k) => {
    const grp = s('g', { class: 'fade' }, g);
    s('text', { x: bc(k), y: L.mem - 8, 'text-anchor': 'middle', class: 't-sm' }, grp, `+${k}, arrived ${['1st', '2nd', '3rd', '4th'][k]}`);
    s('rect', { x: bx(k), y: L.mem, width: L.bw, height: L.bh, rx: 4, class: 'f-seg box' }, grp);
    s('text', { x: bc(k), y: L.mem + L.bh / 2, dy: '0.35em', 'text-anchor': 'middle', class: 't-fg t-bold t-lg' }, grp, v);
    return grp;
  });
  BITS.forEach((b, j) => s('text', { x: bc(j), y: L.reg + L.bh + 16, 'text-anchor': 'middle', class: 't-sm' }, g, 'bits ' + b));
  const layer = s('g', {}, g);

  const tb = table(viz('nb-table'), [{ text: 'Reading', cls: 'l' }, 'n', 'decimal'], [
    [{ text: '*(uint32_t *)buf on the STM32C031, option D', cls: 'l' }, { text: '0xA0860100', cls: 'hl' }, '2693136640'],
    [{ text: 'after ntohl(n), the sender\'s value, option A', cls: 'l' }, '0x000186A0', '100000'],
    [{ text: 'hex digits reversed, option C', cls: 'l' }, '0x0A681000', '174592000'],
  ]);

  const note = role('nb-note');
  steps(viz('nb-steps'), ['All', '+0', '+1', '+2', '+3', 'ntohl(n)'], k => {
    layer.textContent = '';
    const sw = k === 5, on = k >= 1 && k <= 4 ? k - 1 : -1, cls = sw ? 'sec' : 'pri';
    const dst = a => sw ? a : 3 - a;
    top.forEach((grp, i) => grp.classList.toggle('dim', on >= 0 && i !== on));
    for (let a = 0; a < 4; a++) {
      const lit = on < 0 || a === on;
      const grp = s('g', { class: lit ? '' : 'dim' }, layer);
      arrow(grp, bc(a), L.mem + L.bh + 3, bc(dst(a)), L.reg - 4, { cls: 'a-' + cls, width: lit && on >= 0 ? 2.5 : 1.5 });
      s('rect', { x: bx(dst(a)), y: L.reg, width: L.bw, height: L.bh, rx: 4, class: `f-${cls}-soft outline-${cls}` }, grp);
      s('text', { x: bc(dst(a)), y: L.reg + L.bh / 2, dy: '0.35em', 'text-anchor': 'middle', class: `t-${cls} t-bold t-lg` }, grp, B[a]);
    }
    s('text', { x: 680, y: 262, 'text-anchor': 'end', class: `t-${cls} t-bold` }, layer, sw ? 'after ntohl(): 0x000186A0 = 100000, option A' : 'n = 0xA0860100 = 2693136640, option D');
    tb.rows.forEach((r, i) => r.classList.toggle('on', i === (sw ? 1 : 0)));
    if (k === 0) note.textContent = 'The CPU puts the byte at the lowest address in bits 7:0. The first byte to arrive, 0x00, ends up least significant, and the last, 0xA0, most significant. n reads 0xA0860100.';
    else if (sw) note.textContent = 'ntohl() swaps the four bytes and turns the load back into 0x000186A0 = 100000. That is option A. It takes a byte swap or a big-endian machine, and the plain load in the question does neither.';
    else note.textContent = `buf + ${on} holds 0x${B[on]}, the ${ORD[on]} byte to arrive. Little-endian puts it in bits ${BITS[3 - on]}` + (on === 0 ? ', the least significant byte.' : on === 3 ? ', the most significant byte, so n is about 2.69 billion.' : '.');
  });
});

QV.register('s3-mc2', function (q) {
  const { s, svg, steps, box, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const g = svg(viz('mmu'), 760, 270, { label: 'A store to 0x50000414 on a desktop with an MMU, on the STM32C031 with no MMU, and under an MPU rule', minWidth: 600 });
  const CY = 91;
  box(g, 10, CY - 35, 150, 70, '*p = 0x08;\np = 0x50000414', { cls: 'f-surface', textCls: 't-fg t-bold', lh: 20 });
  arrow(g, 162, CY, 196, CY, { cls: 'a-muted', head: 6 });
  const M = { x: 440, w: 140, y: 40, rh: 34 };
  const my = i => M.y + i * M.rh;
  const layer = s('g', {}, g);

  const REAL = [['PPB', 'NVIC, SysTick', '0xE0000000'], ['IOPORT', 'GPIOA, GPIOB', '0x50000000'], ['peripherals', 'USART, TIM, RCC', '0x40000000'], ['SRAM', 'variables, stack', '0x20000000'], ['flash', 'code, constants', '0x08000000']];
  const VIRT = [['stack', 'mapped', null], ['no page', '0x50000414', 'bad'], ['heap', 'mapped', null], ['.data, .bss', 'mapped', null], ['code', 'mapped', null]];
  const map = (rows, title, hit, dimAll) => {
    const grp = s('g', { class: dimAll ? 'dim' : '' }, layer);
    s('text', { x: M.x, y: 28, class: 't-fg t-bold' }, grp, title);
    rows.forEach(([name, sub, addr], i) => {
      const bad = addr === 'bad', on = i === hit;
      s('rect', { x: M.x, y: my(i), width: M.w, height: M.rh, class: (bad ? 'f-bad-soft' : on ? 'f-pri-soft' : 'f-seg') + ' sep' + (bad ? ' dash' : '') }, grp);
      s('text', { x: M.x + M.w / 2, y: my(i) + 13, 'text-anchor': 'middle', class: bad ? 't-bad t-bold' : on ? 't-pri t-bold' : 't-fg t-bold' }, grp, name);
      s('text', { x: M.x + M.w / 2, y: my(i) + 27, 'text-anchor': 'middle', class: bad ? 't-bad t-sm' : 't-sm' }, grp, sub);
      if (addr && !bad) s('text', { x: M.x + M.w + 6, y: my(i) + M.rh, dy: '0.35em', class: 't-sm' }, grp, addr);
    });
  };
  const stage = (lines, cls, dashed) => {
    s('rect', { x: 200, y: CY - 45, width: 150, height: 90, rx: 6, class: dashed ? 'f-none s-muted dash' : cls + ' box' }, layer);
    lines.forEach(([t, c], i) => s('text', { x: 275, y: CY - 22 + i * 20, dy: '0.35em', 'text-anchor': 'middle', class: c }, layer, t));
  };
  const fault = (l1, l2) => {
    arrow(layer, 275, CY + 47, 275, 168, { cls: 'a-bad', width: 2 });
    box(layer, 200, 170, 150, 48, l1 + '\n' + l2, { cls: 'f-bad-soft', textCls: 't-bad t-bold', lh: 18 });
  };
  const foot = (t, c) => s('text', { x: 380, y: 256, 'text-anchor': 'middle', class: c }, layer, t);

  const NOTES = [
    'A desktop program sees a private virtual map. The MMU looks up 0x50000414, finds no page, and the kernel kills the program with a segmentation fault. That is option A, and it needs an MMU.',
    'This chip has no MMU. The number 0x50000414 goes straight onto the bus, lands in GPIOB\'s ODR, and PB3 goes high. No error is raised, and the motor driver turns on.',
    'An MPU, where a chip has one, checks permission rules over the same real addresses. It faults only after software has programmed a rule that forbids the store. It never gives a program a private map, and in the question it is not configured.',
  ];
  const note = role('mmu-note');
  steps(viz('mmu-steps'), ['Desktop with an MMU', 'STM32C031, no MMU', 'With an MPU rule'], k => {
    layer.textContent = '';
    if (k === 0) {
      stage([['MMU', 't-fg t-bold t-lg'], ['page table lookup', 't-sm'], ['0x50000414: no page', 't-bad t-sm t-bold']], 'f-surface');
      arrow(layer, 352, CY, M.x - 4, CY, { cls: 'a-muted', dash: true, label: 'lookup' });
      map(VIRT, 'this program\'s virtual map', -1, false);
      fault('segmentation', 'fault');
      foot('The address is virtual. With no page behind it, the store never happens.', 't-bad');
    } else if (k === 1) {
      stage([['no MMU', 't-fg t-bold t-lg'], ['the number goes', 't-sm'], ['onto the bus as is', 't-sm']], '', true);
      arrow(layer, 352, CY, M.x - 4, CY, { cls: 'a-pri', width: 2.5, label: 'str' });
      map(REAL, 'the one real address space', 1, false);
      arrow(layer, M.x + M.w + 2, CY, M.x + M.w + 68, CY, { cls: 'a-ok', width: 2 });
      box(layer, M.x + M.w + 72, CY - 24, 100, 48, 'PB3 high\nmotor on', { cls: 'f-ok-soft', textCls: 't-ok t-bold', lh: 18 });
      foot('The address is physical. It reaches GPIOB\'s ODR, and nothing reports an error.', 't-ok');
    } else {
      stage([['MPU', 't-fg t-bold t-lg'], ['checks a rule that', 't-sm'], ['software programmed', 't-sm']], 'f-surface');
      map(REAL, 'the one real address space', 1, true);
      fault('HardFault', 'store blocked');
      foot('Same real addresses. A rule, once set, blocks the store. There is still no private map.', 't-muted');
    }
    note.textContent = NOTES[k];
  }, 1);

  // Figure 2: the address decoded, and the 16 ODR bits after the store
  const f = svg(viz('odr'), 760, 230, { label: 'Address 0x50000414 as IOPORT base plus GPIOB block plus ODR offset, and ODR bits 15 to 0 with only bit 3 set', minWidth: 600 });
  const CH = [[20, 150, '0x50000000', 'IOPORT base', 'f-seg'], [200, 120, '0x400', 'GPIOB block', 'f-seg'], [350, 110, '0x14', 'ODR offset', 'f-seg'], [490, 150, '0x50000414', 'GPIOB ODR', 'f-pri-soft']];
  CH.forEach(([x, w, a, b, cls], i) => {
    s('rect', { x, y: 16, width: w, height: 44, rx: 6, class: cls + ' box' }, f);
    s('text', { x: x + w / 2, y: 34, 'text-anchor': 'middle', class: i === 3 ? 't-pri t-bold' : 't-fg t-bold' }, f, a);
    s('text', { x: x + w / 2, y: 50, 'text-anchor': 'middle', class: 't-sm' }, f, b);
  });
  [[185, '+'], [335, '+'], [475, '=']].forEach(([x, t]) => s('text', { x, y: 38, dy: '0.35em', 'text-anchor': 'middle', class: 't-fg t-bold t-lg' }, f, t));
  const OX = 160, OW = 30, OY = 110;
  const ox = b => OX + (15 - b) * OW;
  s('text', { x: OX - 10, y: OY + 15, dy: '0.35em', 'text-anchor': 'end', class: 't-fg t-bold' }, f, 'ODR');
  for (let b = 15; b >= 0; b--) {
    const one = b === 3;
    s('text', { x: ox(b) + OW / 2, y: OY - 6, 'text-anchor': 'middle', class: one ? 't-pri t-bold t-sm' : 't-sm' }, f, b);
    s('rect', { x: ox(b), y: OY, width: OW, height: 30, class: (one ? 'f-pri' : 'f-seg') + ' sep' }, f);
    s('text', { x: ox(b) + OW / 2, y: OY + 15, dy: '0.35em', 'text-anchor': 'middle', class: one ? 't-on t-bold' : 't-muted' }, f, one ? 1 : 0);
  }
  s('text', { x: ox(0) + OW + 10, y: OY + 15, dy: '0.35em', class: 't-pri t-bold' }, f, '= 0x0008');
  arrow(f, ox(3) + OW / 2, OY + 34, ox(3) + OW / 2, 168, { cls: 'a-ok', width: 2 });
  s('text', { x: ox(3) + OW / 2, y: 186, 'text-anchor': 'middle', class: 't-ok t-bold' }, f, 'PB3 goes high, and the motor driver turns on');
  s('text', { x: OX, y: 216, class: 't-sm' }, f, 'The other fifteen bits are written as 0, so every other port B output pin goes low too.');
});

QV.register('s3-mc3', function (q) {
  const { s, svg, steps, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const VAL = 0x01000020;
  const X0 = 70, CW = 19, CY = 60;
  const bx = b => { const i = 31 - b; return X0 + i * CW + Math.floor(i / 4) * 4; };
  const g = svg(viz('psr'), 760, 210, { label: 'xPSR = 0x01000020 as 32 bits, with the APSR, EPSR and IPSR views', minWidth: 600 });
  s('text', { x: X0 - 8, y: CY - 6, 'text-anchor': 'end', class: 't-sm' }, g, 'bit');
  s('text', { x: X0 - 8, y: CY + 13, dy: '0.35em', 'text-anchor': 'end', class: 't-fg t-bold' }, g, 'xPSR');
  s('text', { x: X0 - 8, y: CY + 48, 'text-anchor': 'end', class: 't-sm' }, g, 'hex');
  const VIEW = [[31, 30, 29, 28], [24], [5, 4, 3, 2, 1, 0]];
  const cells = [];
  for (let b = 31; b >= 0; b--) {
    const v = (VAL >>> b) & 1, x = bx(b);
    const grp = s('g', { class: 'fade' }, g);
    s('text', { x: x + CW / 2, y: CY - 6, 'text-anchor': 'middle', class: 't-sm' }, grp, b);
    s('rect', { x, y: CY, width: CW, height: 26, class: (v ? 'f-pri' : 'f-seg') + ' sep' }, grp);
    s('text', { x: x + CW / 2, y: CY + 13, dy: '0.35em', 'text-anchor': 'middle', class: v ? 't-on t-bold' : 't-muted' }, grp, v);
    cells[b] = grp;
  }
  for (let n = 0; n < 8; n++) {
    const hi = 31 - 4 * n;
    s('text', { x: bx(hi) + 2 * CW, y: CY + 48, 'text-anchor': 'middle', class: 't-fg t-bold t-lg' }, g, ((VAL >>> (hi - 3)) & 0xF).toString(16).toUpperCase());
  }
  const labs = [
    ['N', 31], ['Z', 30], ['C', 29], ['V', 28], ['T', 24],
  ].map(([t, b]) => s('text', { x: bx(b) + CW / 2, y: CY - 22, 'text-anchor': 'middle', class: 't-fg t-bold' }, g, t));
  const isrLab = s('g', { class: 'fade' }, g);
  s('line', { x1: bx(5) + 2, x2: bx(0) + CW - 2, y1: CY - 20, y2: CY - 20, class: 's-fg' }, isrLab);
  s('text', { x: (bx(5) + bx(0) + CW) / 2, y: CY - 26, 'text-anchor': 'middle', class: 't-fg t-bold' }, isrLab, 'ISR');
  const layer = s('g', {}, g);

  const READ = [
    ['APSR view, bits 31:28', 'N = 0, Z = 0, C = 0, V = 0', 'no condition flag is set'],
    ['EPSR view, bit 24', 'T = 1', 'Thumb state, always 1 on this core'],
    ['IPSR view, bits 5:0', 'ISR = 10 0000 = 0x20 = 32', 'exception 32 is running, so slot 32 and IRQ 32 − 16 = 16'],
  ];
  const NOTES = [
    'The APSR view shows only bits 31:28, the condition flags. All four are 0 here. The flags say nothing about which handler is running.',
    'The EPSR view shows only bit 24, the Thumb bit T. It is always 1 on this core, and it is where the 1 in 0x01000020 comes from.',
    'The IPSR view shows only bits 5:0. They read 10 0000 in binary, which is 0x20 = 32. That is the exception number the hardware took, so the slot is 32 and the IRQ is 32 − 16 = 16.',
  ];
  const note = role('psr-note');
  steps(viz('psr-steps'), ['APSR flags', 'EPSR Thumb bit', 'IPSR exception number'], k => {
    layer.textContent = '';
    const on = VIEW[k];
    for (let b = 0; b < 32; b++) cells[b].classList.toggle('dim', on.indexOf(b) < 0);
    labs.forEach((t, i) => t.classList.toggle('dim', k !== (i < 4 ? 0 : 1)));
    isrLab.classList.toggle('dim', k !== 2);
    const lo = Math.min(...on), hi = Math.max(...on);
    s('rect', { x: bx(hi) - 2, y: CY - 2, width: bx(lo) - bx(hi) + CW + 4, height: 30, rx: 3, class: 'f-none outline-pri' }, layer);
    const [a, b, c] = READ[k];
    s('text', { x: X0, y: 146, class: 't-fg t-bold' }, layer, a);
    s('text', { x: X0, y: 170, class: 't-pri t-bold t-lg' }, layer, b);
    s('text', { x: X0, y: 192, class: 't-muted' }, layer, c);
    note.textContent = NOTES[k];
  }, 2);

  // Figure 2: the slot each option's reading lands on
  const SX = 50, SW = 13, SY = 62;
  const sx = n => SX + n * SW, sc = n => sx(n) + SW / 2;
  const f = svg(viz('slot'), 760, 200, { label: 'Vector table slots 0 to 48, ARM slots 0 to 15 and vendor IRQs from 16, with the slot each option names', minWidth: 600 });
  for (let n = 0; n <= 48; n++) s('rect', { x: sx(n), y: SY, width: SW, height: 28, class: (n < 16 ? 'f-seg' : 'f-pri-soft') + ' sep' }, f);
  s('text', { x: sx(0), y: SY - 10, class: 't-sm' }, f, 'slots 0–15, ARM\'s');
  s('text', { x: sx(16), y: SY - 10, class: 't-sm' }, f, 'slot 16 and up, vendor IRQs: slot = 16 + IRQ');
  s('text', { x: SX - 8, y: SY + 14, dy: '0.35em', 'text-anchor': 'end', class: 't-sm' }, f, 'slot');
  s('text', { x: SX - 8, y: SY + 64, 'text-anchor': 'end', class: 't-sm' }, f, 'IRQ');
  [0, 16, 20, 32, 36, 48].forEach(n => s('text', { x: sc(n), y: SY + 44, 'text-anchor': 'middle', class: 't-sm' }, f, n));
  [16, 20, 32, 36, 48].forEach(n => s('text', { x: sc(n), y: SY + 64, 'text-anchor': 'middle', class: 't-sm' }, f, n - 16));
  s('rect', { x: sx(32) - 1, y: SY - 3, width: SW + 2, height: 34, rx: 2, class: 's-ok dash' }, f);
  const mark = s('g', {}, f);
  const OPT = { A: [20, 4], B: [48, 32], C: [32, 16], D: [36, 20] };
  const NOTE = {
    A: 'Option A reads ISR = 0x20 as twenty, so it lands on slot 20 and IRQ 4. The value is hex, and 0x20 is 32.',
    B: 'Option B takes 32 as the IRQ and adds 16 again, landing on slot 48. ISR is already the slot number, with ARM\'s 16 slots counted.',
    C: 'Option C. ISR = 0x20 = 32 is the slot. Subtract ARM\'s 16 to get IRQ 16, TIM3, whose vector is the word at 0x08000000 + 4 × 32 = 0x08000080.',
    D: 'Option D reads 0x20 as twenty and treats it as the IRQ, so it adds 16 and lands on slot 36. Both numbers are wrong.',
  };
  const snote = role('slot-note');
  steps(viz('slot-steps'), ['A', 'B', 'C', 'D'], k => {
    const key = 'ABCD'[k], [slot, irq] = OPT[key], ok = key === 'C';
    mark.textContent = '';
    s('rect', { x: sx(slot), y: SY, width: SW, height: 28, class: ok ? 'f-ok' : 'f-bad' }, mark);
    const x = sc(slot), anc = x > 560 ? 'end' : 'middle', tx = x > 560 ? x + SW / 2 : x;
    arrow(mark, x, 158, x, SY + 72, { cls: ok ? 'a-ok' : 'a-bad', width: 1.5, head: 6 });
    s('text', { x: tx, y: 174, 'text-anchor': anc, class: (ok ? 't-ok' : 't-bad') + ' t-bold' }, mark, `option ${key} · IRQ ${irq} · slot ${slot}`);
    s('text', { x: tx, y: 192, 'text-anchor': anc, class: ok ? 't-ok t-sm' : 't-bad t-sm' }, mark, ok ? 'vector at 0x08000000 + 4 × 32 = 0x08000080' : 'xPSR says slot 32 (dashed), not ' + slot);
    snote.textContent = NOTE[key];
  }, 2);
});

QV.register('s3-mc4', function (q) {
  const { s, svg, steps, box, arrow, line } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const g = svg(viz('vol'), 760, 300, { label: 'The two stores for each definition of GPIOA_ODR, where they land, and PA5 over time', minWidth: 600 });
  s('text', { x: 10, y: 18, class: 't-fg t-bold' }, g, 'the two lines become');
  s('text', { x: 10, y: 124, class: 't-fg t-bold' }, g, 'what the compiler sees');
  const D = { x: 350, w: 250, h: 66, ram: 26, reg: 112 };
  const layer = s('g', {}, g);
  s('text', { x: D.x - 14, y: 228, dy: '0.35em', 'text-anchor': 'end', class: 't-sm' }, g, '1');
  s('text', { x: D.x - 14, y: 270, dy: '0.35em', 'text-anchor': 'end', class: 't-sm' }, g, '0');
  s('text', { x: D.x - 34, y: 249, dy: '0.35em', 'text-anchor': 'end', class: 't-fg t-bold' }, g, 'PA5');

  const REG = '0x50000014', RAM = 'GPIOA_ODR in RAM';
  const OPT = {
    A: { st: [['store 0x00000020 → ' + REG, 'reg'], ['store 0x00000000 → ' + REG, 'reg']], def: ['an object at 0x50000014', 'volatile, so every access happens'], ram: null, reg: 'bit 5 goes 1, then 0', pulse: true },
    B: { st: [['may be removed, a dead store', 'gone'], ['store 0x00000000 → ' + REG, 'reg']], def: ['an object at 0x50000014', 'not volatile, so a dead store may go'], ram: null, reg: 'only the store of 0 is certain', pulse: false },
    C: { st: [['store 0x20 → ' + RAM, 'ram'], ['store 0 → ' + RAM, 'ram']], def: ['a variable in RAM', 'its initial value is 0x50000014'], ram: 'holds 0x50000014, then 0', reg: null, pulse: false },
    D: { st: [['store 0x20 → ' + RAM, 'ram'], ['store 0 → ' + RAM, 'ram']], def: ['a volatile variable in RAM', 'its initial value is 0x50000014'], ram: 'holds 0x50000014, 0x20, then 0', reg: null, pulse: false },
  };
  const NOTE = {
    A: 'Definition A makes GPIOA_ODR an object at address 0x50000014, and volatile tells the compiler that every access must happen as written. Two stores reach ODR in order, and PA5 pulses high, then low.',
    B: 'Definition B reaches the same address, but without volatile the compiler treats it like memory. The first store is overwritten before anything reads it, so the compiler may delete it. Then only the store of 0 reaches ODR, and PA5 never goes high.',
    C: 'Definition C makes an ordinary variable in RAM whose initial value is the number 0x50000014. The two lines overwrite that variable. No store reaches 0x50000014, so PA5 never moves.',
    D: 'Definition D is C with volatile. Both stores really happen, and both go to the RAM variable. volatile makes accesses happen; it does not send them to another address.',
  };
  const dest = (y, l1, l2, l3, cls, on) => {
    const grp = s('g', { class: on ? '' : 'dim' }, layer);
    s('rect', { x: D.x, y, width: D.w, height: D.h, rx: 6, class: (on ? cls : 'f-seg') + ' box' }, grp);
    s('text', { x: D.x + 10, y: y + 16, class: 't-sm' }, grp, l1);
    s('text', { x: D.x + 10, y: y + 36, class: 't-fg t-bold' }, grp, l2);
    s('text', { x: D.x + 10, y: y + 55, class: on ? 't-fg' : 't-muted' }, grp, l3);
  };
  const note = role('vol-note');
  steps(viz('vol-steps'), ['A', 'B', 'C', 'D'], k => {
    const key = 'ABCD'[k], o = OPT[key];
    layer.textContent = '';
    o.st.forEach(([t, where], i) => {
      const y = 30 + i * 40, gone = where === 'gone';
      s('rect', { x: 10, y, width: 260, height: 30, rx: 4, class: (gone ? 'f-bad-soft' : 'f-surface') + ' box' + (gone ? ' dash' : '') }, layer);
      s('text', { x: 20, y: y + 15, dy: '0.35em', class: gone ? 't-bad t-bold' : 't-fg' }, layer, t);
      if (!gone) arrow(layer, 272, y + 15, D.x - 4, where === 'reg' ? D.reg + 22 + i * 16 : D.ram + 22 + i * 16, { cls: where === 'reg' ? 'a-pri' : 'a-sec', width: 1.8 });
    });
    s('rect', { x: 10, y: 134, width: 260, height: 54, rx: 4, class: 'f-seg' }, layer);
    o.def.forEach((t, i) => s('text', { x: 20, y: 152 + i * 20, class: i ? 't-muted' : 't-fg' }, layer, t));
    dest(D.ram, 'SRAM, 0x2000xxxx', 'variable GPIOA_ODR', o.ram || 'not involved', 'f-sec-soft', !!o.ram);
    dest(D.reg, 'IOPORT, 0x50000014', 'GPIOA ODR, bit 5 drives PA5', o.reg || 'never written', 'f-pri-soft', !!o.reg);
    const lo = 270, hi = 228;
    if (o.pulse) {
      line(layer, [[D.x, lo], [460, lo], [460, hi], [600, hi], [600, lo], [740, lo]], 's-ok');
      s('text', { x: 460, y: 290, 'text-anchor': 'middle', class: 't-sm' }, layer, 'store 0x20');
      s('text', { x: 600, y: 290, 'text-anchor': 'middle', class: 't-sm' }, layer, 'store 0');
      s('text', { x: 530, y: 218, 'text-anchor': 'middle', class: 't-ok t-bold' }, layer, 'PA5 high, then low');
    } else {
      line(layer, [[D.x, lo], [740, lo]], 's-bad');
      s('text', { x: 545, y: 250, 'text-anchor': 'middle', class: 't-bad t-bold' }, layer, key === 'B' ? 'PA5 may never go high' : 'PA5 never moves');
    }
    note.textContent = NOTE[key];
  });
});
