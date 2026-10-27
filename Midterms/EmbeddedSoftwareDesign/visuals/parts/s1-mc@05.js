const L5 = (() => {
  const { s } = QV;
  const hex8 = v => '0x' + (v >>> 0).toString(16).toUpperCase().padStart(8, '0');
  const bitOf = (v, b) => (v >>> b) & 1;
  const txt = (g, x, y, t, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls || null }, g, t);
  const cellCls = k => {
    if (!k) return ['f-seg', null];
    return k.endsWith('-soft') ? ['f-' + k, 't-' + k.slice(0, -5) + ' t-bold'] : ['f-' + k, 't-on t-bold'];
  };
  // A register bit by bit, bit n-1 on the left; hl(b, v) names a fill such as 'pri' or 'ok-soft'
  const reg = (g, o) => {
    const n = o.bits || 32, cw = o.cw || 16, ch = o.ch || 22, grp = o.group || 4, gap = o.gap == null ? 3 : o.gap;
    const bx = b => { const i = n - 1 - b; return o.x + i * cw + Math.floor(i / grp) * gap; };
    for (let b = n - 1; b >= 0; b--) {
      const v = o.value == null ? null : bitOf(o.value, b);
      const [f, t] = cellCls(o.hl ? o.hl(b, v) : null);
      s('rect', { x: bx(b), y: o.y, width: cw, height: ch, rx: 2, class: f + ' sep' }, g);
      if (v != null) txt(g, bx(b) + cw / 2, o.y + ch / 2, String(v), t || (v ? 't-fg t-bold' : 't-muted'), 'middle');
    }
    if (o.hex && o.value != null) {
      for (let d = 0; d < n / 4; d++) txt(g, (bx(4 * d + 3) + bx(4 * d) + cw) / 2, o.y - 7, ((o.value >>> (4 * d)) & 15).toString(16).toUpperCase(), 't-sm', 'middle');
    }
    return { bx, cx: b => bx(b) + cw / 2, mid: (hi, lo) => (bx(hi) + bx(lo) + cw) / 2, y: o.y, ch, cw };
  };
  return { hex8, bitOf, txt, reg };
})();

QV.register('s1-mc18', function (q) {
  const { s, svg, steps } = QV;
  const { hex8, txt, reg } = L5;
  const viz = n => q.querySelector(`[data-viz="${n}"]`);
  const role = n => q.querySelector(`[data-role="${n}"]`);
  const RESET = 0xEBFFFFFF, MASK = ~(3 << 12) >>> 0, AND = (RESET & MASK) >>> 0, NEW = 1 << 12, RES = (AND | NEW) >>> 0;
  const inField = b => b === 12 || b === 13;

  // Figure 1: the five values of (MODER & ~(3u << 12)) | (1u << 12)
  const ROWS = [
    { name: 'MODER, read', v: RESET, k: 'pri-soft' },
    { name: '~(3u << 12)', v: MASK, k: 'sec-soft' },
    { name: 'MODER & mask', v: AND, k: 'pri-soft' },
    { name: '1u << 12', v: NEW, k: 'pri-soft' },
    { name: 'OR, written back', v: RES, k: 'ok' },
  ];
  const W = svg(viz('cts'), 780, 300, { label: 'MODER bit by bit through clear-then-set: 0xEBFFFFFF, mask 0xFFFFCFFF, 0xEBFFCFFF, 0x00001000, result 0xEBFFDFFF', minWidth: 600 });
  const X0 = 176, Y0 = 58, P = 48;
  const rows = ROWS.map((r, i) => {
    const g = s('g', { class: 'fade' }, W);
    const y = Y0 + i * P;
    const R = reg(g, { x: X0, y, value: r.v, group: 2, gap: 4, hex: true, hl: b => (inField(b) ? r.k : null) });
    txt(g, 0, y + 4, r.name, 't-fg t-bold');
    txt(g, 0, y + 19, hex8(r.v), i === 4 ? 't-ok t-bold' : 't-muted');
    return { g, R };
  });
  const R = rows[0].R;
  txt(W, 0, 26, 'pin', 't-sm');
  for (let p = 0; p < 16; p++) txt(W, R.mid(2 * p + 1, 2 * p), 26, String(p), p === 6 ? 't-pri t-bold' : 't-sm', 'middle');
  const yb = Y0 + 4 * P + 36;
  txt(W, 0, yb, 'bit', 't-sm');
  txt(W, R.cx(31), yb, '31', 't-sm', 'middle');
  txt(W, R.mid(13, 12), yb, '13:12', 't-pri t-bold', 'middle');
  txt(W, R.cx(0), yb, '0', 't-sm', 'middle');

  const NOTES = [
    'All five values. Only bits 13:12, PA6\'s field, differ between the first row and the last; the other 30 bits pass through unchanged.',
    'Read MODER, 0xEBFFFFFF. PA6\'s field holds 11, analog, like every pin except PA14 and PA13, which hold 10 for the debugger.',
    'The mask 3u << 12 = 0x00003000 covers bits 13:12. Its complement, 0xFFFFCFFF, has 0s only there.',
    'AND keeps every bit where the mask has a 1 and clears bits 13:12, giving 0xEBFFCFFF. PA6\'s field is now 00.',
    'The new mode, 01 for output, moved into place with 1u << 12 = 0x00001000.',
    'OR sets bit 12, giving 0xEBFFDFFF. The hex digit for pins 7 and 6 went from F (11 11) to D (11 01), and the other 15 pins are as they were.',
  ];
  steps(viz('cts-steps'), ['All', '1 · read', '2 · mask', '3 · AND', '4 · new mode', '5 · OR'], k => {
    rows.forEach(({ g }, i) => g.classList.toggle('dim', k > 0 && i >= k));
    role('cts-note').textContent = NOTES[k];
  });

  // Figure 2: each option's 16 fields decoded
  const OPTS = [['reset', RESET, 'as at reset'], ['A', 0xEBFFDFFF, 'PA6 out, rest kept'], ['B', 0x00001000, 'all inputs, SWD pins lost'], ['C', 0xEBFFFFFF, 'PA6 still analog'], ['D', 0xEBFFEFFF, 'PA6 alternate function']];
  const MODE = ['in', 'out', 'AF', 'an'];
  const D = svg(viz('decode'), 780, 214, { label: 'The 16 pin fields of the reset value and of options A to D, decoded as in, out, AF or analog', minWidth: 600 });
  const DX = 168, DW = 36, DG = 2, DY = 30, DP = 36, DH = 28;
  const dx = p => DX + (15 - p) * (DW + DG);
  for (let p = 15; p >= 0; p--) txt(D, dx(p) + DW / 2, 14, 'PA' + p, p === 6 ? 't-pri t-bold' : 't-sm', 'middle');
  OPTS.forEach(([key, v, verdict], r) => {
    const y = DY + r * DP;
    txt(D, 0, y + 7, (key === 'reset' ? 'reset' : key) + '  ' + hex8(v), key === 'A' ? 't-ok t-bold' : 't-fg t-bold');
    txt(D, 0, y + 21, verdict, key === 'A' ? 't-ok t-sm' : 't-sm');
    for (let p = 15; p >= 0; p--) {
      const m = (v >>> (2 * p)) & 3, m0 = (RESET >>> (2 * p)) & 3;
      let f = 'f-seg', t = m === 3 ? 't-muted' : 't-fg';
      if (r > 0 && p === 6) [f, t] = m === 1 ? ['f-ok', 't-on t-bold'] : ['f-bad', 't-on t-bold'];
      else if (r > 0 && m !== m0) [f, t] = ['f-bad', 't-on t-bold'];
      s('rect', { x: dx(p), y, width: DW, height: DH, rx: 3, class: f }, D);
      txt(D, dx(p) + DW / 2, y + DH / 2, MODE[m], t, 'middle');
    }
  });
});

QV.register('s1-mc19', function (q) {
  const { s, svg, steps } = QV;
  const { hex8, bitOf, txt, reg } = L5;
  const viz = n => q.querySelector(`[data-viz="${n}"]`);
  const role = n => q.querySelector(`[data-role="${n}"]`);

  // Figure 1: the two bits and their OR
  const B = svg(viz('bsrr'), 780, 232, { label: 'BSRR bit by bit: bit 2 sets PB2, bit 23 resets PB7, together 0x00800004', minWidth: 600 });
  const X0 = 176, Y0 = 62, P = 50;
  const kOf = b => (b === 2 ? 'pri' : b === 23 ? 'sec' : null);
  const ROWS = [
    { name: 'PB2 high', sub: '1u << 2', v: 0x00000004 },
    { name: 'PB7 low', sub: '1u << (7 + 16)', v: 0x00800000 },
    { name: 'OR, the value', sub: hex8(0x00800004), v: 0x00800004 },
  ];
  const rows = ROWS.map((r, i) => {
    const g = s('g', { class: 'fade' }, B);
    const y = Y0 + i * P;
    const R = reg(g, { x: X0, y, value: r.v, hex: true, hl: (b, v) => (v ? kOf(b) : null) });
    txt(g, 0, y + 4, r.name, i === 2 ? 't-ok t-bold' : 't-fg t-bold');
    txt(g, 0, y + 19, r.sub, 't-muted');
    return { g, R };
  });
  const R = rows[0].R;
  s('line', { x1: R.bx(31), x2: R.bx(16) + 16, y1: 18, y2: 18, class: 's-sec', style: 'stroke-width: 2' }, B);
  s('line', { x1: R.bx(15), x2: R.bx(0) + 16, y1: 18, y2: 18, class: 's-pri', style: 'stroke-width: 2' }, B);
  txt(B, R.mid(31, 16), 8, 'reset half, BR15 … BR0', 't-sec t-bold', 'middle');
  txt(B, R.mid(15, 0), 8, 'set half, BS15 … BS0', 't-pri t-bold', 'middle');
  txt(B, 0, 32, 'pin', 't-sm');
  for (let b = 31; b >= 0; b--) txt(B, R.cx(b), 32, String(b % 16), b === 23 ? 't-sec t-bold' : b === 2 ? 't-pri t-bold' : 't-sm', 'middle');
  const yb = Y0 + 2 * P + 36;
  txt(B, R.cx(23), yb, 'BR7', 't-sec t-bold', 'middle');
  txt(B, R.cx(2), yb, 'BS2', 't-pri t-bold', 'middle');
  [31, 16, 15, 0].forEach(b => txt(B, R.cx(b), yb + 16, String(b), 't-sm', 'middle'));
  txt(B, 0, yb + 16, 'bit', 't-sm');

  const NOTES = [
    'Two 1 bits and thirty 0s. Each 0 leaves its pin alone, which is why one store can set one pin and reset another.',
    'PB2 high is a 1 in the set half at bit 2, 1u << 2 = 0x00000004.',
    'PB7 low is a 1 in the reset half at bit 7 + 16 = 23, 1u << 23 = 0x00800000. The hex digit for bits 23:20 is 8, binary 1000.',
    'The OR holds both bits, 0x00800004. One store sets PB2, resets PB7 and leaves the other 14 pins of port B alone.',
  ];
  steps(viz('bsrr-steps'), ['All', '1 · PB2 high', '2 · PB7 low', '3 · OR'], k => {
    rows.forEach(({ g }, i) => g.classList.toggle('dim', k > 0 && i >= k));
    role('bsrr-note').textContent = NOTES[k];
  });

  // Figure 2: PB7..PB0 after each option, from ODR low byte 0xA3
  const START = 0xA3, TARGET = (START | 0x04) & ~0x80;
  const viaBsrr = v => ((START | (v & 0xFFFF)) & ~(v >>> 16)) & 0xFF;
  const OPTS = [
    ['before', 'ODR = 0x...A3', START, 'PB7, PB5, PB1, PB0 on'],
    ['A', 'BSRR = 0x00000084', viaBsrr(0x84), 'PB7 still on'],
    ['B', 'BSRR = 0x00800004', viaBsrr(0x00800004), 'PB2 on, PB7 off, rest kept'],
    ['C', 'BSRR = 0x00040080', viaBsrr(0x00040080), 'PB2 kept off, PB7 kept on'],
    ['D', 'ODR = 0x00000004', 0x04, 'PB5, PB1, PB0 lost, PB15 to PB8 too'],
  ];
  const E = svg(viz('effect'), 780, 214, { label: 'Pins PB7 to PB0 before the write and after each of options A to D', minWidth: 600 });
  const EX = 176, EW = 40, EG = 4, EY = 30, EP = 36, EH = 28;
  const ex = p => EX + (7 - p) * (EW + EG);
  for (let p = 7; p >= 0; p--) txt(E, ex(p) + EW / 2, 14, 'PB' + p, p === 2 || p === 7 ? 't-fg t-bold' : 't-sm', 'middle');
  OPTS.forEach(([key, what, v, verdict], r) => {
    const y = EY + r * EP, good = v === TARGET;
    txt(E, 0, y + 7, key, key === 'B' ? 't-ok t-bold' : 't-fg t-bold');
    txt(E, 0, y + 21, what, 't-sm');
    for (let p = 7; p >= 0; p--) {
      const lv = bitOf(v, p);
      s('rect', { x: ex(p), y, width: EW, height: EH, rx: 4, class: lv ? 'f-pri' : 'f-seg' }, E);
      txt(E, ex(p) + EW / 2, y + EH / 2, String(lv), lv ? 't-on t-bold' : 't-muted', 'middle');
      if (r === 0) continue;
      const bad = lv !== bitOf(TARGET, p), moved = lv !== bitOf(START, p);
      if (bad || moved) s('rect', { x: ex(p) + 1.5, y: y + 1.5, width: EW - 3, height: EH - 3, rx: 3, class: bad ? 's-bad' : 's-ok' }, E);
    }
    txt(E, ex(0) + EW + 16, y + EH / 2, verdict, r === 0 ? 't-muted' : good ? 't-ok t-bold' : 't-bad');
  });
});

QV.register('s1-mc20', function (q) {
  const { s, svg, box, arrow } = QV;
  const { txt } = L5;
  const viz = n => q.querySelector(`[data-viz="${n}"]`);

  // Figure 1: PB3, line 3, IRQ 6, vector 22
  const P = svg(viz('path'), 780, 300, { label: 'PB3 feeds EXTI line 3, lines 2 and 3 share IRQ 6, IRQ 6 is vector 22 at 0x08000058', minWidth: 600 });
  const LX = 110, LS = 40, LW = 36, LY = 104;
  const lx = l => LX + l * LS;
  box(P, LX, 12, 70, 36, 'PB3', { cls: 'f-pri', textCls: 't-on t-bold' });
  arrow(P, LX + 70, 30, LX + 104, 30, { cls: 'a-pri' });
  box(P, LX + 106, 8, 360, 44, 'EXTICR[0] bits 31:24 = 1, port B\nline 3: register 3 / 4 = 0, bits 8 × 3 + 7 : 8 × 3', { cls: 'f-pri-soft', stroke: 'outline-pri', textCls: 't-pri', lh: 16 });
  arrow(P, lx(3) + LW / 2, 52, lx(3) + LW / 2, LY - 2, { cls: 'a-pri' });
  txt(P, 0, 30, 'pin', 't-fg t-bold');
  txt(P, 0, LY + 15, 'EXTI line', 't-fg t-bold');
  for (let l = 0; l < 16; l++) {
    s('rect', { x: lx(l), y: LY, width: LW, height: 30, rx: 3, class: l === 3 ? 'f-pri' : 'f-seg' }, P);
    txt(P, lx(l) + LW / 2, LY + 15, String(l), l === 3 ? 't-on t-bold' : 't-fg', 'middle');
  }
  const IY = 172;
  txt(P, 0, IY + 18, 'NVIC', 't-fg t-bold');
  [[0, 1, 5, 'EXTI0_1'], [2, 3, 6, 'EXTI2_3'], [4, 15, 7, 'EXTI4_15']].forEach(([a, b, irq, name]) => {
    const on = irq === 6;
    for (let l = a; l <= b; l++) s('line', { x1: lx(l) + LW / 2, x2: lx(l) + LW / 2, y1: LY + 30, y2: IY, class: l === 3 ? 's-pri' : 's-line', style: l === 3 ? 'stroke-width: 2' : null }, P);
    box(P, lx(a), IY, lx(b) + LW - lx(a), 38, 'IRQ ' + irq + '\n' + name, { cls: on ? 'f-pri' : 'f-surface', textCls: on ? 't-on t-bold' : 't-fg', lh: 15 });
  });
  const VY = 248, cx6 = (lx(2) + lx(3) + LW) / 2;
  txt(P, 0, VY + 18, 'vector', 't-fg t-bold');
  arrow(P, cx6, IY + 38, cx6, VY - 2, { cls: 'a-ok' });
  box(P, LX, VY, 200, 36, 'vector = 16 + 6 = 22', { cls: 'f-ok-soft', textCls: 't-ok t-bold' });
  arrow(P, LX + 200, VY + 18, LX + 236, VY + 18, { cls: 'a-ok' });
  box(P, LX + 238, VY, 402, 36, 'address = 0x08000000 + 22 × 4 = 0x08000058', { cls: 'f-ok', textCls: 't-on t-bold' });

  // Figure 2: the vector table to scale, with each option's address marked
  const T = svg(viz('table'), 780, 196, { label: 'Vector table slots 0 to 23 at 4 bytes each, with options A to D marked; only C lands on slot 22', minWidth: 600 });
  const SX = 36, SW = 29, SY = 96, SH = 30;
  const bx = byte => SX + byte * SW / 4;
  for (let k = 0; k < 24; k++) {
    const f = k === 22 ? 'f-ok' : k >= 16 ? 'f-pri-soft' : 'f-seg';
    s('rect', { x: SX + k * SW, y: SY, width: SW, height: SH, class: f + ' sep' }, T);
    txt(T, SX + k * SW + SW / 2, SY + SH / 2, String(k), k === 22 ? 't-on t-bold' : k >= 16 ? 't-pri t-sm' : 't-sm', 'middle');
  }
  txt(T, 0, SY + SH / 2, 'slot', 't-sm');
  [0x00, 0x10, 0x20, 0x30, 0x40, 0x50, 0x58].forEach(b => {
    s('line', { x1: bx(b), x2: bx(b), y1: SY + SH, y2: SY + SH + 5, class: 'l-axis' }, T);
    txt(T, bx(b), SY + SH + 15, '0x' + b.toString(16).toUpperCase().padStart(2, '0'), b === 0x58 ? 't-ok t-bold' : 't-sm', 'middle');
  });
  txt(T, 0, SY + SH + 15, '+', 't-sm');
  const BY = SY + SH + 34;
  s('line', { x1: SX, x2: SX + 16 * SW - 2, y1: BY, y2: BY, class: 's-muted' }, T);
  txt(T, SX + 8 * SW, BY + 13, 'vectors 0 to 15: the core (initial SP, Reset, NMI, HardFault, ... SysTick)', 't-sm', 'middle');
  s('line', { x1: SX + 16 * SW + 2, x2: SX + 24 * SW, y1: BY, y2: BY, class: 's-pri' }, T);
  txt(T, SX + 20 * SW, BY + 13, 'vector 16 + n = IRQ n', 't-pri t-sm', 'middle');
  [['A', 0x4C, 56, 'end', '0x0800004C, slot 19'], ['B', 0x16, 24, 'start', '0x08000016, mid-slot 5'], ['C', 0x58, 56, 'start', '0x08000058'], ['D', 0x18, 56, 'start', '0x08000018, slot 6']].forEach(([k, b, y, side, label]) => {
    const x = bx(b), ok = k === 'C';
    s('line', { x1: x, x2: x, y1: y + 9, y2: SY, class: ok ? 's-ok' : 's-bad', style: 'stroke-width: 1.5' }, T);
    s('circle', { cx: x, cy: y, r: 9, class: ok ? 'f-ok' : 'f-bad' }, T);
    txt(T, x, y, k, 't-on t-bold', 'middle');
    txt(T, side === 'end' ? x - 14 : x + 14, y, label, ok ? 't-ok t-bold' : 't-bad', side);
  });
});

QV.register('s1-mc21', function (q) {
  const { s, svg, box, arrow, steps, line, scale } = QV;
  const { txt } = L5;
  const viz = n => q.querySelector(`[data-viz="${n}"]`);
  const role = n => q.querySelector(`[data-role="${n}"]`);

  // Figure 1: the input path, for either mode and either button state
  const P = svg(viz('path'), 780, 236, { label: 'PA0 input path: pull-up and button, digital input enabled by MODER, IDR bit 0, button_down, result', minWidth: 600 });
  const dyn = s('g', {}, P);
  let mode = 1, btn = 0;
  const render = () => {
    dyn.textContent = '';
    const analog = mode === 1, pressed = btn === 1;
    const pin = pressed ? 0 : 1, idr = analog ? 0 : pin, down = idr === 0, right = down === pressed;
    txt(dyn, 70, 12, '3.3 V', 't-fg', 'middle');
    s('line', { x1: 70, x2: 70, y1: 20, y2: 30, class: 's-fg' }, dyn);
    s('rect', { x: 62, y: 30, width: 16, height: 40, rx: 2, class: 'f-surface box' }, dyn);
    txt(dyn, 84, 50, 'pull-up', 't-sm');
    s('line', { x1: 70, x2: 70, y1: 70, y2: 140, class: 's-fg' }, dyn);
    s('line', { x1: 70, x2: 150, y1: 112, y2: 112, class: 's-fg' }, dyn);
    s('circle', { cx: 70, cy: 112, r: 4, class: 'f-fg' }, dyn);
    txt(dyn, 82, 100, 'PA0 = ' + (pin ? '3.3 V' : '0 V'), pressed ? 't-fg t-bold' : 't-fg');
    s('line', { x1: 70, y1: 140, x2: pressed ? 70 : 92, y2: pressed ? 176 : 168, class: pressed ? 's-pri' : 's-fg' }, dyn);
    s('circle', { cx: 70, cy: 140, r: 3, class: 'f-fg' }, dyn);
    s('line', { x1: 70, x2: 70, y1: 176, y2: 200, class: 's-fg' }, dyn);
    s('line', { x1: 56, x2: 84, y1: 200, y2: 200, class: 's-fg' }, dyn);
    txt(dyn, 70, 214, 'GND', 't-sm', 'middle');
    txt(dyn, 100, 160, pressed ? 'button pressed' : 'button released', 't-sm');
    box(dyn, 160, 8, 150, 44, 'MODER bits 1:0\n' + (analog ? '11, analog' : '00, input'), { cls: analog ? 'f-bad-soft' : 'f-pri-soft', textCls: analog ? 't-bad t-bold' : 't-pri t-bold', lh: 15 });
    arrow(dyn, 235, 52, 235, 88, { cls: analog ? 'a-bad' : 'a-pri', label: analog ? 'off' : 'on', dx: 16, dy: 2 });
    box(dyn, 160, 90, 150, 44, 'digital input\n' + (analog ? 'cut off, gives 0' : 'follows the pin'), { cls: analog ? 'f-bad-soft' : 'f-surface', textCls: analog ? 't-bad' : 't-fg', lh: 15 });
    arrow(dyn, 310, 112, 344, 112, {});
    box(dyn, 346, 90, 120, 44, 'IDR bit 0\n= ' + idr, { cls: 'f-surface', textCls: 't-fg t-bold', lh: 15 });
    arrow(dyn, 466, 112, 500, 112, {});
    box(dyn, 502, 90, 140, 44, 'button_down()\n' + idr + ' == 0 → ' + (down ? 'true' : 'false'), { cls: 'f-surface', textCls: 't-fg', lh: 15 });
    arrow(dyn, 642, 112, 676, 112, {});
    box(dyn, 678, 90, 98, 44, down ? 'pressed' : 'released', { cls: right ? 'f-ok' : 'f-bad', textCls: 't-on t-bold' });
    txt(dyn, 727, 152, right ? 'matches the button' : 'wrong', right ? 't-ok t-bold' : 't-bad t-bold', 'middle');
    role('path-note').textContent = analog
      ? `PA0 is left at its reset mode, 11, analog. The digital input is cut off, so IDR bit 0 reads 0 although the pin is at ${pressed ? '0 V' : '3.3 V'}. button_down() sees 0 and reports pressed${pressed ? ', which happens to be right this time' : ' while nobody touches the button'}.`
      : `With 00 written, the digital input follows the pin. ${pressed ? 'Pressed, the switch pulls PA0 to 0 V, IDR reads 0' : 'Released, the pull-up holds PA0 at 3.3 V, IDR reads 1'}, and button_down() reports ${pressed ? 'pressed' : 'released'}.`;
  };
  steps(viz('mode-steps'), ['pin_mode written, 00', 'line deleted, 11'], k => { mode = k; render(); }, 1);
  steps(viz('btn-steps'), ['button released', 'button pressed'], k => { btn = k; render(); }, 0);

  // Figure 2: 200 ms after reset, with and without the input mode
  const T = svg(viz('time'), 780, 268, { label: 'Timing over 200 ms: the pin, IDR in input mode and in analog mode, and the debouncer events for each', minWidth: 600 });
  const x = scale(0, 200, 176, 760);
  const ROW = [
    { name: 'PA0 pin', y: 24, f: t => (t >= 80 && t < 140 ? 0 : 1), cls: 's-fg' },
    { name: 'IDR, input (00)', y: 72, f: t => (t >= 80 && t < 140 ? 0 : 1), cls: 's-pri' },
    { name: 'IDR, analog (11)', y: 120, f: () => 0, cls: 's-bad' },
  ];
  ROW.forEach(({ name, y, f, cls }) => {
    txt(T, 0, y + 12, name, cls === 's-bad' ? 't-bad t-bold' : cls === 's-pri' ? 't-pri t-bold' : 't-fg t-bold');
    txt(T, 168, y, '1', 't-sm', 'end');
    txt(T, 168, y + 24, '0', 't-sm', 'end');
    const pts = [];
    for (let t = 0; t <= 200; t += 1) {
      const lv = f(t), yy = lv ? y : y + 24;
      if (pts.length && pts[pts.length - 1][1] !== yy) pts.push([x(t), pts[pts.length - 1][1]]);
      pts.push([x(t), yy]);
    }
    line(T, pts, cls);
  });
  const EV = [{ name: 'events, input', y: 170, ev: [[100, 'press'], [160, 'release']], cls: 'pri' }, { name: 'events, analog', y: 202, ev: [[21, 'press nobody made']], cls: 'bad' }];
  EV.forEach(({ name, y, ev, cls }) => {
    txt(T, 0, y, name, 't-' + cls + ' t-bold');
    s('line', { x1: x(0), x2: x(200), y1: y, y2: y, class: 's-line' }, T);
    ev.forEach(([t, label]) => {
      s('circle', { cx: x(t), cy: y, r: 5, class: 'f-' + cls }, T);
      txt(T, x(t) + 9, y, label, 't-' + cls + ' t-bold');
    });
  });
  txt(T, x(150), 202, 'nothing after, IDR never changes', 't-bad', 'middle');
  [[80, 100], [140, 160]].forEach(([a, b]) => {
    s('line', { x1: x(a), x2: x(a), y1: 96, y2: 170, class: 's-muted dash', style: 'stroke-width: 1' }, T);
    txt(T, (x(a) + x(b)) / 2, 158, '20 ms', 't-sm', 'middle');
  });
  const AY = 226;
  s('line', { x1: x(0), x2: x(200), y1: AY, y2: AY, class: 'l-axis' }, T);
  [0, 50, 100, 150, 200].forEach(t => {
    s('line', { x1: x(t), x2: x(t), y1: AY, y2: AY + 5, class: 'l-axis' }, T);
    txt(T, x(t), AY + 16, String(t), null, 'middle');
  });
  txt(T, x(100), AY + 34, 'time after reset (ms)', null, 'middle');
});

QV.register('s1-mc22', function (q) {
  const { s, svg, line, slider, scale } = QV;
  const { txt } = L5;
  const viz = n => q.querySelector(`[data-viz="${n}"]`);
  const role = n => q.querySelector(`[data-role="${n}"]`);
  // one drawn press: 13 transitions in about 1.3 ms, settling low
  const EDGES = [2000, 2090, 2160, 2290, 2370, 2520, 2600, 2770, 2860, 3030, 3110, 3260, 3330];
  const level = t => (EDGES.filter(e => e <= t).length % 2 ? 0 : 1);
  const V = svg(viz('wave'), 860, 236, { label: 'A bouncing press with 13 transitions, the EXTI edges, and five 1 kHz poll samples', minWidth: 600 });
  const x = scale(0, 5000, 150, 846);
  const HI = 30, LO = 66, EY = 92, PY = 132;
  txt(V, 0, (HI + LO) / 2, 'pin level', 't-fg t-bold');
  txt(V, 142, HI, '1', 't-sm', 'end');
  txt(V, 142, LO, '0', 't-sm', 'end');
  const pts = [[x(0), HI]];
  let lv = 1;
  EDGES.forEach(e => { pts.push([x(e), lv ? HI : LO]); lv ^= 1; pts.push([x(e), lv ? HI : LO]); });
  pts.push([x(5000), lv ? HI : LO]);
  line(V, pts, 's-fg');
  txt(V, 0, EY, 'EXTI', 't-sec t-bold');
  EDGES.forEach(e => s('polygon', { points: `${x(e) - 3.5},${EY - 6} ${x(e) + 3.5},${EY - 6} ${x(e)},${EY + 2}`, class: 'f-sec' }, V));
  txt(V, x(2665), 10, '13 edges latched, 13 handler runs', 't-sec t-bold', 'middle');
  txt(V, 0, PY + 2, '1 kHz poll', 't-pri t-bold');
  const AY = 176;
  s('line', { x1: x(0), x2: x(5000), y1: AY, y2: AY, class: 'l-axis' }, V);
  for (let k = 0; k <= 5; k++) {
    s('line', { x1: x(1000 * k), x2: x(1000 * k), y1: AY, y2: AY + 5, class: 'l-axis' }, V);
    txt(V, x(1000 * k), AY + 16, String(k), null, 'middle');
  }
  txt(V, x(2500), AY + 36, 'time (ms)', null, 'middle');
  const layer = s('g', {}, V);

  slider(viz('slider'), { label: 'samples taken at', min: 0, max: 990, step: 10, value: 400, fmt: v => v + ' µs after each ms' }, ph => {
    layer.textContent = '';
    const ts = [0, 1, 2, 3, 4].map(k => ph + 1000 * k), lvs = ts.map(level);
    let changes = 0;
    ts.forEach((t, i) => {
      const changed = i > 0 && lvs[i] !== lvs[i - 1];
      if (changed) changes++;
      s('line', { x1: x(t), x2: x(t), y1: HI - 8, y2: PY - 12, class: 's-pri dash', style: 'stroke-width: 1' }, layer);
      s('circle', { cx: x(t), cy: lvs[i] ? HI : LO, r: 4.5, class: 'f-pri' }, layer);
      s('rect', { x: x(t) - 13, y: PY - 11, width: 26, height: 22, rx: 3, class: changed ? 'f-ter' : 'f-pri-soft' }, layer);
      txt(layer, x(t), PY, String(lvs[i]), changed ? 't-on t-bold' : 't-pri t-bold', 'middle');
    });
    role('changes').textContent = String(changes);
    const inside = ts.filter(t => t >= EDGES[0] && t < EDGES[EDGES.length - 1]);
    role('verdict').innerHTML = changes > 1
      ? `Two samples land inside the bounce and read different levels, so the poll counts <b>${changes}</b> changes. This is the occasional extra count. EXTI still latched all <b>13</b> edges.`
      : `${inside.length === 0 ? 'No sample lands inside the bounce' : inside.length === 1 ? 'One sample lands inside the bounce' : 'The samples inside the bounce read the same level'}, so the poll sees the level change <b>once</b>. The other transitions fall between samples and never exist for <code>main()</code>. EXTI latched all <b>13</b>.`;
  });
});
