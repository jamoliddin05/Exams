const L5 = (() => {
  const { s } = QV;
  const hex8 = v => '0x' + (v >>> 0).toString(16).toUpperCase().padStart(8, '0');
  const bitOf = (v, b) => (v >>> b) & 1;
  const txt = (g, x, y, t, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls || null }, g, t);
  const cellCls = k => {
    if (!k) return ['f-seg', null];
    return k.endsWith('-soft') ? ['f-' + k, 't-' + k.slice(0, -5) + ' t-bold'] : ['f-' + k, 't-on t-bold'];
  };
  // A register bit by bit, bit n-1 on the left; hl(b, v) names a fill such as 'pri' or 'ok-soft', text(b, v) overrides the cell label
  const reg = (g, o) => {
    const n = o.bits || 32, cw = o.cw || 16, ch = o.ch || 22, grp = o.group || 4, gap = o.gap == null ? 3 : o.gap;
    const bx = b => { const i = n - 1 - b; return o.x + i * cw + Math.floor(i / grp) * gap; };
    for (let b = n - 1; b >= 0; b--) {
      const v = o.value == null ? null : bitOf(o.value, b);
      const [f, t] = cellCls(o.hl ? o.hl(b, v) : null);
      s('rect', { x: bx(b), y: o.y, width: cw, height: ch, rx: 2, class: f + ' sep' }, g);
      const label = o.text ? o.text(b, v) : v == null ? null : String(v);
      if (label != null) txt(g, bx(b) + cw / 2, o.y + ch / 2, label, t || (v ? 't-fg t-bold' : 't-muted'), 'middle');
    }
    if (o.hex && o.value != null) {
      for (let d = 0; d < n / 4; d++) txt(g, (bx(4 * d + 3) + bx(4 * d) + cw) / 2, o.y - 7, ((o.value >>> (4 * d)) & 15).toString(16).toUpperCase(), 't-sm', 'middle');
    }
    return { bx, cx: b => bx(b) + cw / 2, mid: (hi, lo) => (bx(hi) + bx(lo) + cw) / 2, y: o.y, ch, cw };
  };
  return { hex8, bitOf, txt, reg };
})();

QV.register('s2-mc18', function (q) {
  const { s, svg, steps } = QV;
  const { hex8, txt, reg } = L5;
  const viz = n => q.querySelector(`[data-viz="${n}"]`);
  const role = n => q.querySelector(`[data-role="${n}"]`);

  // Figure 1: where each option's mask and its 1 land
  const OPTS = [
    { r: 1, hi: 11, lo: 8, name: 'A · AFR[1], bits 11:8', verdict: 'PA10\'s field', ok: true },
    { r: 0, hi: 11, lo: 8, name: 'B · AFR[0], bits 11:8', verdict: 'PA2\'s field, wrong register' },
    { r: 1, hi: 21, lo: 20, name: 'C · AFR[1], bits 21:20', verdict: 'inside PA13\'s field' },
    { r: 1, hi: 13, lo: 10, name: 'D · AFR[1], bits 13:10', verdict: 'half PA11, half PA10' },
  ];
  const M = svg(viz('masks'), 780, 262, { label: 'The four options drawn on AFR[1] or AFR[0]: only A clears and sets inside PA10\'s field, AFR[1] bits 11:8', minWidth: 600 });
  const MX = 204, MY = 38, MP = 56;
  let R = null;
  OPTS.forEach((o, i) => {
    const y = MY + i * MP;
    const inMask = b => b <= o.hi && b >= o.lo;
    R = reg(M, {
      x: MX, y, value: (1 << o.lo) >>> 0,
      hl: b => (inMask(b) ? (b === o.lo ? 'pri' : 'sec-soft') : null),
      text: (b, v) => (inMask(b) ? String(v) : null),
    });
    for (let d = 0; d < 8; d++) {
      const pin = o.r * 8 + d, hit = o.lo <= 4 * d + 3 && o.hi >= 4 * d;
      const cls = o.r === 1 && pin === 10 ? 't-ok t-bold' : hit ? 't-bad t-bold' : 't-sm';
      txt(M, R.mid(4 * d + 3, 4 * d), y - 9, 'PA' + pin, cls, 'middle');
    }
    if (o.r === 1) s('rect', { x: R.bx(11) - 2, y: y - 2, width: R.bx(8) + R.cw - R.bx(11) + 4, height: R.ch + 4, rx: 3, class: 'f-none s-ok' }, M);
    txt(M, 0, y + 4, o.name, o.ok ? 't-ok t-bold' : 't-fg t-bold');
    txt(M, 0, y + 19, o.verdict, o.ok ? 't-ok' : 't-bad');
  });
  const yb = MY + 3 * MP + R.ch + 16;
  txt(M, 0, yb, 'bits', 't-sm');
  for (let d = 0; d < 8; d++) txt(M, R.mid(4 * d + 3, 4 * d), yb, `${4 * d + 3}:${4 * d}`, d === 2 ? 't-ok t-sm t-bold' : 't-sm', 'middle');

  // Figure 2: the five values of line A on an example AFR[1]
  const RD = 0x00002300, MASK = ~(0xF << 8) >>> 0, AND = (RD & MASK) >>> 0, NEW = 1 << 8, RES = (AND | NEW) >>> 0;
  const inField = b => b >= 8 && b <= 11;
  const ROWS = [
    { name: 'AFR[1], read', v: RD, k: 'pri-soft' },
    { name: '~(0xFu << 8)', v: MASK, k: 'sec-soft' },
    { name: 'AFR[1] & mask', v: AND, k: 'pri-soft' },
    { name: '1u << 8', v: NEW, k: 'pri-soft' },
    { name: 'OR, written back', v: RES, k: 'ok' },
  ];
  const W = svg(viz('cts'), 780, 300, { label: 'AFR[1] bit by bit through line A: 0x00002300, mask 0xFFFFF0FF, 0x00002000, 0x00000100, result 0x00002100', minWidth: 600 });
  const X0 = 176, Y0 = 58, P = 48;
  const rows = ROWS.map((r, i) => {
    const g = s('g', { class: 'fade' }, W);
    const y = Y0 + i * P;
    const RR = reg(g, { x: X0, y, value: r.v, gap: 6, hex: true, hl: b => (inField(b) ? r.k : null) });
    txt(g, 0, y + 4, r.name, 't-fg t-bold');
    txt(g, 0, y + 19, hex8(r.v), i === 4 ? 't-ok t-bold' : 't-muted');
    return { g, R: RR };
  });
  const R0 = rows[0].R;
  txt(W, 0, 26, 'pin', 't-sm');
  for (let d = 0; d < 8; d++) txt(W, R0.mid(4 * d + 3, 4 * d), 26, 'PA' + (8 + d), d === 2 ? 't-pri t-bold' : 't-sm', 'middle');
  const yb2 = Y0 + 4 * P + 36;
  txt(W, 0, yb2, 'bit', 't-sm');
  txt(W, R0.cx(31), yb2, '31', 't-sm', 'middle');
  txt(W, R0.mid(11, 8), yb2, '11:8', 't-pri t-bold', 'middle');
  txt(W, R0.cx(0), yb2, '0', 't-sm', 'middle');

  const NOTES = [
    'All five values. Each hex digit of AFR[1] is one pin\'s AF number, so only the third digit from the right, PA10\'s, changes, from 3 to 1. PA11 keeps AF2.',
    'Read AFR[1], an example value 0x00002300. From the right, the digits are PA8 AF0, PA9 AF0, PA10 AF3, PA11 AF2, and AF0 for the rest.',
    'PA10 is in AFR[10 / 8] = AFR[1], at bit 4 × (10 mod 8) = 8. The mask 0xFu << 8 = 0x00000F00 covers bits 11:8, and its complement 0xFFFFF0FF has 0s only there.',
    'AND clears bits 11:8 and keeps the other 28 bits, giving 0x00002000. PA10\'s field is now 0000.',
    'AF1 moved into place, 1u << 8 = 0x00000100.',
    'OR writes 0001 into bits 11:8, giving 0x00002100. PA10 is on AF1, and every other pin keeps its number.',
  ];
  steps(viz('cts-steps'), ['All', '1 · read', '2 · mask', '3 · AND', '4 · AF1', '5 · OR'], k => {
    rows.forEach(({ g }, i) => g.classList.toggle('dim', k > 0 && i >= k));
    role('cts-note').textContent = NOTES[k];
  });
});

QV.register('s2-mc19', function (q) {
  const { s, svg, steps } = QV;
  const { hex8, bitOf, txt, reg } = L5;
  const viz = n => q.querySelector(`[data-viz="${n}"]`);
  const role = n => q.querySelector(`[data-role="${n}"]`);
  const LEDS = 0x0C, NOT8 = (~LEDS) & 0xFF, VAL = ((NOT8 << 16) | LEDS) >>> 0;

  // Figure 1: the expression, value by value
  const ROWS = [
    { name: 'leds', sub: '0x0C, 8 bits', v: LEDS, hl: (b, v) => (v ? 'pri' : null) },
    { name: '~leds', sub: 'an int, ' + hex8(~LEDS), v: ~LEDS >>> 0, hl: (b, v) => (v ? (b >= 8 ? 'bad-soft' : 'sec-soft') : null) },
    { name: '(uint8_t)~leds', sub: '0xF3', v: NOT8, hl: (b, v) => (v ? 'sec-soft' : null) },
    { name: '(uint32_t) … << 16', sub: hex8(NOT8 << 16), v: NOT8 << 16, hl: (b, v) => (v ? 'sec' : null) },
    { name: '| leds, the value', sub: hex8(VAL), v: VAL, hl: (b, v) => (v ? (b >= 16 ? 'sec' : 'pri') : null) },
  ];
  const B = svg(viz('build'), 780, 322, { label: 'BSRR bit by bit: leds 0x0C, ~leds 0xFFFFFFF3, cast to 0xF3, shifted to 0x00F30000, OR leds gives 0x00F3000C', minWidth: 600 });
  const X0 = 176, Y0 = 62, P = 48;
  const rows = ROWS.map((r, i) => {
    const g = s('g', { class: 'fade' }, B);
    const y = Y0 + i * P;
    const R = reg(g, { x: X0, y, value: r.v, hex: true, hl: r.hl });
    txt(g, 0, y + 4, r.name, i === 4 ? 't-ok t-bold' : 't-fg t-bold');
    txt(g, 0, y + 19, r.sub, i === 4 ? 't-ok' : 't-muted');
    return { g, R };
  });
  const R = rows[0].R;
  s('line', { x1: R.bx(31), x2: R.bx(16) + 16, y1: 18, y2: 18, class: 's-sec', style: 'stroke-width: 2' }, B);
  s('line', { x1: R.bx(15), x2: R.bx(0) + 16, y1: 18, y2: 18, class: 's-pri', style: 'stroke-width: 2' }, B);
  txt(B, R.mid(31, 16), 8, 'reset half, BR15 … BR0', 't-sec t-bold', 'middle');
  txt(B, R.mid(15, 0), 8, 'set half, BS15 … BS0', 't-pri t-bold', 'middle');
  txt(B, 0, 32, 'pin', 't-sm');
  for (let b = 31; b >= 0; b--) txt(B, R.cx(b), 32, String(b % 16), 't-sm', 'middle');
  const yb = Y0 + 4 * P + 38;
  txt(B, R.mid(23, 16), yb, 'reset PB7–PB0', 't-sec t-bold', 'middle');
  txt(B, R.mid(7, 0), yb, 'set PB7–PB0', 't-pri t-bold', 'middle');
  txt(B, R.mid(31, 24), yb, 'all 0, PB15–PB8 kept', 't-sm', 'middle');
  [31, 16, 15, 0].forEach(b => txt(B, R.cx(b), yb + 16, String(b), 't-sm', 'middle'));
  txt(B, 0, yb + 16, 'bit', 't-sm');

  const NOTES = [
    'All five values. The set half ends up holding leds, 0x000C, and the reset half its 8-bit complement, 0x00F3, so each bar LED gets exactly one 1.',
    'leds = 0x0C = 0000 1100. PB3 and PB2 should be on, the other six bar LEDs off.',
    '~ works on an int, so ~leds is 0xFFFFFFF3. The low eight bits are flipped, and the 24 bits above them are all 1s.',
    'The (uint8_t) cast keeps bits 7:0 only, 1111 0011 = 0xF3. Without it the 1s in bits 31:8 survive the shift, and that is option B.',
    '<< 16 moves 0xF3 into bits 23:16, the reset bits of PB7–PB0, giving 0x00F30000. Bits 31:24 stay 0, so PB15–PB8 are left alone.',
    'OR with leds puts 0x000C in the set half, giving 0x00F3000C. One store turns PB3 and PB2 on and the other six bar LEDs off.',
  ];
  steps(viz('build-steps'), ['All', '1 · leds', '2 · ~leds', '3 · (uint8_t)', '4 · << 16', '5 · OR'], k => {
    rows.forEach(({ g }, i) => g.classList.toggle('dim', k > 0 && i >= k));
    role('build-note').textContent = NOTES[k];
  });

  // Figure 2: port B after each option, from ODR = 0x2430
  const START = 0x2430, TARGET = (START & 0xFF00) | LEDS;
  const via = v => ((START | (v & 0xFFFF)) & ~(v >>> 16)) & 0xFFFF;
  const OPTS = [
    ['before', 'ODR = 0x2430', START, 'bar 0011 0000'],
    ['A', '0x000C00F3', via(0x000C00F3), 'bar inverted'],
    ['B', '0xFFF3000C', via(0xFFF3000C), 'PB13 and PB10 reset too'],
    ['C', '0x0000000C', via(0x0000000C), 'PB5 and PB4 left on'],
    ['D', '0x00F3000C', via(0x00F3000C), 'bar = leds, rest kept'],
  ];
  const E = svg(viz('port'), 780, 226, { label: 'Pins PB15 to PB0 before the write and after each of options A to D', minWidth: 600 });
  const EX = 176, EW = 32, EG = 3, EY = 42, EP = 36, EH = 28;
  const ex = p => EX + (15 - p) * (EW + EG) + (p <= 7 ? 10 : 0);
  s('line', { x1: ex(15), x2: ex(8) + EW, y1: 16, y2: 16, class: 's-muted', style: 'stroke-width: 1.5' }, E);
  s('line', { x1: ex(7), x2: ex(0) + EW, y1: 16, y2: 16, class: 's-pri', style: 'stroke-width: 2' }, E);
  txt(E, (ex(15) + ex(8) + EW) / 2, 7, 'PB15–PB8, other uses', 't-sm', 'middle');
  txt(E, (ex(7) + ex(0) + EW) / 2, 7, 'PB7–PB0, the LED bar', 't-pri t-bold', 'middle');
  for (let p = 15; p >= 0; p--) txt(E, ex(p) + EW / 2, 30, 'PB' + p, 't-sm', 'middle');
  OPTS.forEach(([key, what, v, verdict], r) => {
    const y = EY + r * EP, good = v === TARGET;
    txt(E, 0, y + 7, key + '  ' + what, key === 'D' ? 't-ok t-bold' : 't-fg t-bold');
    txt(E, 0, y + 21, verdict, r === 0 ? 't-sm' : good ? 't-ok t-sm' : 't-bad t-sm');
    for (let p = 15; p >= 0; p--) {
      const lv = bitOf(v, p);
      s('rect', { x: ex(p), y, width: EW, height: EH, rx: 4, class: lv ? 'f-pri' : 'f-seg' }, E);
      txt(E, ex(p) + EW / 2, y + EH / 2, String(lv), lv ? 't-on t-bold' : 't-muted', 'middle');
      if (r === 0) continue;
      const bad = lv !== bitOf(TARGET, p), moved = lv !== bitOf(START, p);
      if (bad || moved) s('rect', { x: ex(p) + 1.5, y: y + 1.5, width: EW - 3, height: EH - 3, rx: 3, class: bad ? 's-bad' : 's-ok' }, E);
    }
  });
});

QV.register('s2-mc20', function (q) {
  const { s, svg, box, arrow, steps } = QV;
  const { txt, reg } = L5;
  const viz = n => q.querySelector(`[data-viz="${n}"]`);
  const role = n => q.querySelector(`[data-role="${n}"]`);

  // Figure 1: the chain IRQ 16 -> 0x08000080, with the binary of x 4 and the wrong options
  const C = svg(viz('calc'), 780, 300, { label: 'IRQ 16 plus 16 is vector 32, times 4 is 128 bytes, 0x80, plus 0x08000000 is 0x08000080; B, C and D each skip or add a step', minWidth: 600 });
  const BW = 112, BS = 158, BX = 18, BY = 24, BH = 40;
  const CH = [
    ['IRQ 16', 'given'],
    ['vector 32', '16 core vectors first'],
    ['128 bytes', '4 bytes per vector'],
    ['0x80', '128 = 8 × 16'],
    ['0x08000080', 'table start + 0x80'],
  ];
  const ARR = ['+ 16', '× 4', 'to hex', '+ base'];
  const chain = CH.map(([label, cap], i) => {
    const g = s('g', { class: 'fade' }, C);
    const x = BX + i * BS;
    if (i > 0) arrow(g, x - BS + BW + 2, BY + BH / 2, x - 2, BY + BH / 2, { cls: 'a-pri', label: ARR[i - 1], labelCls: 't-pri t-bold' });
    box(g, x, BY, BW, BH, label, { cls: i === 4 ? 'f-ok' : 'f-pri-soft', textCls: i === 4 ? 't-on t-bold' : 't-pri t-bold' });
    txt(g, x + BW / 2, BY + BH + 14, cap, 't-sm', 'middle');
    return g;
  });

  const bin = s('g', { class: 'fade' }, C);
  const BNX = 230;
  const r1 = reg(bin, { x: BNX, y: 122, bits: 8, cw: 24, ch: 24, gap: 6, value: 0x20, hex: true, hl: (b, v) => (v ? 'pri' : null) });
  reg(bin, { x: BNX, y: 170, bits: 8, cw: 24, ch: 24, gap: 6, value: 0x80, hex: true, hl: (b, v) => (v ? 'ok' : null) });
  for (let b = 7; b >= 0; b--) txt(bin, r1.cx(b), 102, String(b), 't-sm', 'middle');
  txt(bin, 18, 102, 'bit', 't-sm');
  txt(bin, 18, 127, '32', 't-fg t-bold');
  txt(bin, 18, 141, '0x20', 't-muted');
  txt(bin, 18, 175, '32 × 4 = 32 << 2', 't-fg t-bold');
  txt(bin, 18, 189, '128 = 0x80', 't-ok');
  arrow(bin, r1.cx(5), 148, r1.cx(7), 168, { cls: 'a-pri', head: 6 });
  txt(bin, 470, 136, 'two left shifts move bit 5 up to bit 7', 't-fg');
  txt(bin, 470, 154, 'every bit moves 2 places, nothing is lost', 't-sm');
  txt(bin, 470, 182, '0x20 × 4 = 0x80', 't-ok t-bold');

  const WRONG = [
    ['B', 'forgets + 16: 16 × 4 = 64 = 0x40, so 0x08000040 (vector 16, IRQ 0)'],
    ['C', 'forgets × 4: 32 = 0x20, so 0x08000020 (vector 8)'],
    ['D', 'adds the Thumb bit to the slot address: 0x08000081, not a multiple of 4'],
  ];
  const wrong = WRONG.map(([k, t], i) => {
    const g = s('g', { class: 'fade' }, C);
    const y = 226 + i * 26;
    s('circle', { cx: 28, cy: y, r: 10, class: 'f-bad' }, g);
    txt(g, 28, y, k, 't-on t-bold', 'middle');
    txt(g, 48, y, t, 't-bad');
    return g;
  });

  const LIT = [null, { c: 1, b: false, w: 0 }, { c: 2, b: true, w: 1 }, { c: 3, b: true, w: -1 }, { c: 4, b: false, w: 2 }];
  const NOTES = [
    'IRQ 16 → vector 32 → 128 bytes → 0x80 → 0x08000080. Each wrong option skips a step or adds one.',
    'The first 16 vectors belong to the core (initial SP, Reset, NMI, HardFault, … SysTick). IRQ 16 comes after them, at vector 16 + 16 = 32. Skipping this step gives B.',
    'Each vector is a 4-byte address, so vector 32 starts 32 × 4 = 128 bytes in. × 4 is two left shifts. Skipping it counts vectors as bytes and gives C.',
    '128 = 8 × 16 + 0, so 128 is 0x80. In binary, 0010 0000 shifted left twice is 1000 0000.',
    'Add the table start, 0x08000000 + 0x80 = 0x08000080, a multiple of 4. The Thumb bit is in the word stored there, and adding it to the address gives D.',
  ];
  steps(viz('calc-steps'), ['All', '1 · + 16', '2 · × 4', '3 · to hex', '4 · + base'], k => {
    const L = LIT[k];
    chain.forEach((g, i) => g.classList.toggle('dim', !!L && i > L.c));
    bin.classList.toggle('dim', !!L && !L.b);
    wrong.forEach((g, i) => g.classList.toggle('dim', !!L && i !== L.w));
    role('calc-note').textContent = NOTES[k];
  });

  // Figure 2: the table to scale, with slot 32's four bytes enlarged
  const T = svg(viz('table'), 780, 256, { label: 'Vector table slots 0 to 33 at 4 bytes each; A lands on slot 32, B on slot 16, C on slot 8; slot 32 enlarged shows D one byte into the word', minWidth: 600 });
  const SX = 40, SW = 21, SY = 64, SH = 28;
  const bx = byte => SX + byte * SW / 4;
  for (let k = 0; k < 34; k++) {
    const f = k === 32 ? 'f-ok' : k >= 16 ? 'f-pri-soft' : 'f-seg';
    s('rect', { x: SX + k * SW, y: SY, width: SW, height: SH, class: f + ' sep' }, T);
    txt(T, SX + k * SW + SW / 2, SY + SH / 2, String(k), k === 32 ? 't-on t-bold t-sm' : k >= 16 ? 't-pri t-sm' : 't-sm', 'middle');
  }
  txt(T, 0, SY + SH / 2, 'slot', 't-sm');
  [0x00, 0x20, 0x40, 0x60, 0x80].forEach(b => {
    s('line', { x1: bx(b), x2: bx(b), y1: SY + SH, y2: SY + SH + 5, class: 'l-axis' }, T);
    txt(T, bx(b), SY + SH + 15, '0x' + b.toString(16).toUpperCase().padStart(2, '0'), b === 0x80 ? 't-ok t-bold' : 't-sm', 'middle');
  });
  txt(T, 0, SY + SH + 15, '+', 't-sm');
  [['A', 0x80, 18, 'end', '0x08000080, vector 32'], ['C', 0x20, 18, 'start', '0x08000020, vector 8'], ['B', 0x40, 40, 'start', '0x08000040, vector 16 = IRQ 0']].forEach(([k, b, y, side, label]) => {
    const x = bx(b), ok = k === 'A';
    s('line', { x1: x, x2: x, y1: y + 9, y2: SY, class: ok ? 's-ok' : 's-bad', style: 'stroke-width: 1.5' }, T);
    s('circle', { cx: x, cy: y, r: 9, class: ok ? 'f-ok' : 'f-bad' }, T);
    txt(T, x, y, k, 't-on t-bold', 'middle');
    txt(T, side === 'end' ? x - 14 : x + 14, y, label, ok ? 't-ok t-bold' : 't-bad', side);
  });
  const ZX = 430, ZW = 80, ZY = 168, ZH = 30;
  s('line', { x1: bx(0x80), y1: SY + SH, x2: ZX, y2: ZY, class: 's-muted dash', style: 'stroke-width: 1' }, T);
  s('line', { x1: bx(0x84), y1: SY + SH, x2: ZX + 4 * ZW, y2: ZY, class: 's-muted dash', style: 'stroke-width: 1' }, T);
  ['bits 7:0', 'bits 15:8', 'bits 23:16', 'bits 31:24'].forEach((t, i) => {
    s('rect', { x: ZX + i * ZW, y: ZY, width: ZW, height: ZH, class: 'f-ok-soft sep' }, T);
    txt(T, ZX + i * ZW + ZW / 2, ZY + ZH / 2, t, i === 0 ? 't-ok t-bold' : 't-ok', 'middle');
    txt(T, ZX + i * ZW + ZW / 2, ZY + ZH + 13, '0x0800008' + i, 't-sm', 'middle');
  });
  txt(T, 40, 172, 'Slot 32 enlarged. TIM3\'s vector is the word', 't-sm');
  txt(T, 40, 188, 'TIM3_IRQHandler\'s address + 1, low byte first.', 't-sm');
  txt(T, 40, 204, 'Bit 0 of the byte at 0x08000080 is the Thumb bit.', 't-sm');
  [['A', ZX, 'end', 'the slot starts here', true], ['D', ZX + ZW, 'start', 'one byte in, not a multiple of 4', false]].forEach(([k, x, side, label, ok]) => {
    s('line', { x1: x, x2: x, y1: ZY + ZH, y2: 227, class: ok ? 's-ok' : 's-bad', style: 'stroke-width: 1.5' }, T);
    s('circle', { cx: x, cy: 236, r: 9, class: ok ? 'f-ok' : 'f-bad' }, T);
    txt(T, x, 236, k, 't-on t-bold', 'middle');
    txt(T, side === 'end' ? x - 14 : x + 14, 236, label, ok ? 't-ok t-bold' : 't-bad', side);
  });
});

QV.register('s2-mc21', function (q) {
  const { s, svg, box, arrow, steps } = QV;
  const { txt } = L5;
  const viz = n => q.querySelector(`[data-viz="${n}"]`);
  const role = n => q.querySelector(`[data-role="${n}"]`);

  // Figure 1: what the linker puts in vector 21 for each spelling
  const F = svg(viz('link'), 780, 236, { label: 'startup.c weak placeholder and main.c handler feed the linker, which fills vector 21; with the misspelt name vector 21 keeps Default_Handler', minWidth: 600 });
  const dyn = s('g', {}, F);
  const render = exact => {
    dyn.textContent = '';
    box(dyn, 0, 8, 236, 56, 'startup.c\nweak EXTI0_1_IRQHandler\n→ Default_Handler', { cls: 'f-surface', textCls: 't-fg', lh: 15 });
    box(dyn, 0, 96, 236, 56, 'main.c\nvoid EXTI0_1_IRQ' + (exact ? 'H' : 'h') + 'andler(void)\n' + (exact ? 'strong, the same name' : 'another name, unused'), { cls: exact ? 'f-pri-soft' : 'f-bad-soft', textCls: exact ? 't-pri t-bold' : 't-bad t-bold', lh: 15 });
    box(dyn, 330, 40, 170, 80, 'linker\nfills vector 21 with\nEXTI0_1_IRQHandler', { cls: 'f-surface', textCls: 't-fg', lh: 16 });
    arrow(dyn, 236, 36, 328, 62, exact ? { cls: 'a-muted', dash: true, label: 'overridden' } : { cls: 'a-bad', label: 'used', labelCls: 't-bad t-bold' });
    arrow(dyn, 236, 124, 328, 98, exact ? { cls: 'a-ok', label: 'replaces it', labelCls: 't-ok t-bold', dy: 16 } : { cls: 'a-muted', dash: true, label: 'no match', dy: 16 });
    arrow(dyn, 500, 80, 554, 80, { cls: exact ? 'a-ok' : 'a-bad' });
    box(dyn, 556, 40, 224, 80, 'vector 21, 0x08000054\nholds the address + 1 of\n' + (exact ? 'EXTI0_1_IRQHandler' : 'Default_Handler'), { cls: exact ? 'f-ok-soft' : 'f-bad-soft', textCls: exact ? 't-ok t-bold' : 't-bad t-bold', lh: 16 });
    box(dyn, 0, 176, 236, 48, 'nm Main.elf\n' + (exact ? 'T' : 'W') + ' EXTI0_1_IRQHandler', { cls: 'f-surface', textCls: exact ? 't-ok t-bold' : 't-bad t-bold', lh: 16 });
    box(dyn, 266, 176, 234, 48, exact ? 'FLASH 7156 B\nzero warnings' : 'FLASH 7120 B, zero warnings\n36 B of handler removed', { cls: 'f-surface', textCls: 't-fg', lh: 16 });
    arrow(dyn, 668, 120, 668, 174, { cls: exact ? 'a-ok' : 'a-bad' });
    box(dyn, 556, 176, 224, 48, exact ? 'first press: handler runs,\nclears, counts, returns' : 'first press: Default_Handler,\nloops forever, board hangs', { cls: exact ? 'f-ok' : 'f-bad', textCls: 't-on t-bold', lh: 16 });
    role('link-note').textContent = exact
      ? 'Spelt exactly, main.c defines a strong EXTI0_1_IRQHandler. It replaces the weak placeholder, vector 21 holds its address + 1, and nm shows T for your function.'
      : 'With a lower-case h the function has another name. Nothing refers to it, so the linker removes it (36 bytes), vector 21 keeps the weak placeholder, and nm shows W. The build has zero warnings either way.';
  };
  steps(viz('link-steps'), ['name exact, IRQHandler', 'misspelt, IRQhandler'], k => render(k === 0), 1);

  // Figure 2: what the CPU runs after the first press, one lane per option
  const G = svg(viz('lanes'), 780, 248, { label: 'Four timelines after the first press: A handler runs once, B stuck in Default_Handler, C main keeps running with FPR1 set, D handler re-entered forever', minWidth: 600 });
  const LX = 196, LE = 770, PX = 300, BH = 24;
  const ly = i => 30 + i * 52;
  const block = (y, x1, x2, kind) => {
    const cls = { main: 'f-pri-soft', hand: 'f-sec', def: 'f-bad' }[kind];
    s('rect', { x: x1, y, width: x2 - x1, height: BH, rx: 3, class: cls }, G);
    if (kind === 'main' && x2 - x1 > 60) txt(G, (x1 + x2) / 2, y + BH / 2, 'main()', 't-pri t-bold', 'middle');
    if (kind === 'def') txt(G, (x1 + x2) / 2, y + BH / 2, 'Default_Handler, an infinite loop', 't-on t-bold', 'middle');
  };
  const LANES = [
    ['A · name right', [['main', LX, PX], ['hand', PX, PX + 18], ['main', PX + 18, LE]], 'the handler runs once, main() goes on'],
    ['B · this code', [['main', LX, PX], ['def', PX, LE]], 'heartbeat stops, serial goes quiet, the board hangs'],
    ['C · line masked', [['main', LX, LE]], 'FPR1 bit 1 goes to 1 and stays, no handler runs'],
    ['D · no clear', [['main', LX, PX]].concat(Array.from({ length: 11 }, (_, j) => ['hand', PX + j * 42 + 2, PX + j * 42 + 40])), 'tail-chained straight back in, main() never runs again'],
  ];
  s('line', { x1: PX, x2: PX, y1: 18, y2: ly(3) + BH + 4, class: 's-muted dash', style: 'stroke-width: 1' }, G);
  txt(G, PX, 9, 'first press', 't-fg t-bold', 'middle');
  LANES.forEach(([name, blocks, note], i) => {
    const y = ly(i);
    txt(G, 0, y + BH / 2, name, i === 1 ? 't-ok t-bold' : 't-fg t-bold');
    blocks.forEach(([kind, x1, x2]) => block(y, x1, Math.min(x2, LE), kind));
    txt(G, LX, y + BH + 12, note, i === 1 ? 't-bad t-sm' : 't-sm');
  });
  txt(G, LE, 240, 'time →', 't-sm', 'end');
});

QV.register('s2-mc22', function (q) {
  const { s, svg, box, steps } = QV;
  const { txt } = L5;
  const viz = n => q.querySelector(`[data-viz="${n}"]`);
  const role = n => q.querySelector(`[data-role="${n}"]`);

  // Figure 1: two output stages and a shared wire
  const F = svg(viz('circuit'), 780, 272, { label: 'Two chips with P-MOS and N-MOS output stages on one wire, with or without a pull-up resistor, showing which transistors conduct and the wire level', minWidth: 600 });
  const dyn = s('g', {}, F);
  const RAIL = 30, GND = 250, WIRE = 140, CX = [300, 500];
  const ODR = [[1, 1], [0, 1], [1, 0], [0, 0]];
  let mode = 1, pair = 1;
  const render = () => {
    dyn.textContent = '';
    const odr = ODR[pair], pp = mode === 0, pull = mode === 1;
    const P = c => pp && odr[c] === 1, N = c => odr[c] === 0;
    const anyP = P(0) || P(1), anyN = N(0) || N(1);
    const st = anyP && anyN ? 'short' : anyN ? 'low' : anyP || pull ? 'high' : 'float';
    s('line', { x1: 40, x2: 740, y1: RAIL, y2: RAIL, class: 's-fg' }, dyn);
    txt(dyn, 40, 16, '3.3 V', 't-fg t-bold');
    s('line', { x1: 40, x2: 740, y1: GND, y2: GND, class: 's-fg' }, dyn);
    txt(dyn, 40, 264, 'GND', 't-fg t-bold');
    if (pull) {
      s('line', { x1: 130, x2: 130, y1: RAIL, y2: 62, class: 's-fg' }, dyn);
      s('rect', { x: 122, y: 62, width: 16, height: 44, rx: 2, class: 'f-surface box' }, dyn);
      s('line', { x1: 130, x2: 130, y1: 106, y2: WIRE, class: 's-fg' }, dyn);
      txt(dyn, 146, 84, 'pull-up', 't-fg');
    } else {
      s('rect', { x: 122, y: 62, width: 16, height: 44, rx: 2, class: 'f-none s-muted dash', style: 'stroke-width: 1' }, dyn);
      txt(dyn, 146, 84, 'no resistor', 't-muted');
    }
    const wireCls = { high: 's-pri', low: 's-muted', short: 's-bad', float: 's-ter dash' }[st];
    s('line', { x1: 60, x2: 760, y1: WIRE, y2: WIRE, class: wireCls, style: 'stroke-width: 3' }, dyn);
    txt(dyn, 760, 126, 'shared wire, e.g. I²C SDA', 't-fg', 'end');
    if (pull) s('circle', { cx: 130, cy: WIRE, r: 4, class: 'f-fg' }, dyn);
    CX.forEach((x, c) => {
      const pOn = P(c), nOn = N(c);
      s('line', { x1: x, x2: x, y1: RAIL, y2: 52, class: 's-fg' }, dyn);
      s('line', { x1: x, x2: x, y1: 82, y2: WIRE, class: 's-fg' }, dyn);
      s('line', { x1: x, x2: x, y1: WIRE, y2: 178, class: 's-fg' }, dyn);
      s('line', { x1: x, x2: x, y1: 208, y2: GND, class: 's-fg' }, dyn);
      if (pp) box(dyn, x - 40, 52, 80, 30, 'P-MOS ' + (pOn ? 'on' : 'off'), { cls: pOn ? (st === 'short' ? 'f-bad' : 'f-pri') : 'f-seg', textCls: pOn ? 't-on t-bold' : 't-muted', rx: 3 });
      else {
        s('rect', { x: x - 40, y: 52, width: 80, height: 30, rx: 3, class: 'f-none s-muted dash', style: 'stroke-width: 1' }, dyn);
        txt(dyn, x, 67, 'P-MOS, off', 't-muted', 'middle');
      }
      box(dyn, x - 40, 178, 80, 30, 'N-MOS ' + (nOn ? 'on' : 'off'), { cls: nOn ? (st === 'short' ? 'f-bad' : 'f-pri') : 'f-seg', textCls: nOn ? 't-on t-bold' : 't-muted', rx: 3 });
      s('circle', { cx: x, cy: WIRE, r: 4, class: 'f-fg' }, dyn);
      txt(dyn, x + 10, 100, 'chip ' + (c + 1), 't-fg t-bold');
      txt(dyn, x + 10, 116, 'ODR = ' + odr[c], 't-fg');
    });
    const RES = {
      high: ['wire = 1', 'f-pri', 't-on t-bold'],
      low: ['wire = 0', 'f-seg', 't-fg t-bold'],
      short: ['short circuit\n3.3 V to GND', 'f-bad', 't-on t-bold'],
      float: ['floats\nreads randomly', 'f-ter-soft', 't-ter t-bold'],
    }[st];
    box(dyn, 600, 166, 160, 48, RES[0], { cls: RES[1], textCls: RES[2], lh: 16 });
    const lows = [0, 1].filter(c => odr[c] === 0).map(c => 'chip ' + (c + 1));
    const who = lows.join(' and ');
    let note;
    if (st === 'short') {
      const hi = odr[0] === 1 ? 1 : 2, lo = 3 - hi;
      note = `Chip ${hi} drives high through its P-MOS while chip ${lo} pulls low through its N-MOS. 3.3 V meets GND through two transistors, a short. A faster OSPEEDR (option B) only steepens the edges into it.`;
    } else if (pp) note = st === 'high' ? 'Both chips drive high with their P-MOS. Fine until one of them wants to pull low.' : 'Both chips drive low with their N-MOS. Fine, because neither drives high.';
    else if (st === 'float') note = 'Both chips let go and nothing makes the high. The wire floats and reads randomly.';
    else if (st === 'high') note = 'Both chips let go. Nothing pulls down, so the pull-up resistor makes the wire 1.';
    else note = `${who} ${lows.length > 1 ? 'pull' : 'pulls'} low through the N-MOS, so the wire is 0. No P-MOS ever drives high, so nothing fights${pull ? ', and the resistor only limits the current' : ''}.`;
    role('circuit-note').textContent = note;
  };
  steps(viz('mode-steps'), ['A, B · push-pull', 'C · open-drain + pull-up', 'D · open-drain, no resistor'], k => { mode = k; render(); }, 1);
  steps(viz('odr-steps'), ['ODR 1 and 1', 'chip 1 writes 0', 'chip 2 writes 0', 'both write 0'], k => { pair = k; render(); }, 1);

  // Figure 2: the wire for each pair of ODR bits, per wiring
  const T = svg(viz('truth'), 780, 178, { label: 'Truth grids: push-pull shorts when the bits differ, open-drain with pull-up is the AND of the bits, open-drain without a resistor floats when both let go', minWidth: 600 });
  const CELL = {
    1: ['1', 'f-pri', 't-on t-bold'],
    0: ['0', 'f-seg', 't-fg t-bold'],
    short: ['short', 'f-bad', 't-on t-bold'],
    float: ['floats', 'f-ter-soft', 't-ter t-bold'],
  };
  const GR = [
    ['A, B · push-pull', [[1, 'short'], ['short', 0]], 'clash when the bits differ', 't-bad'],
    ['C · open-drain + pull-up', [[1, 0], [0, 0]], 'wired-AND, 1 only if both let go', 't-ok'],
    ['D · open-drain, no resistor', [['float', 0], [0, 0]], 'nothing makes the high', 't-bad'],
  ];
  GR.forEach(([title, cells, verdict, vcls], g) => {
    const x0 = 104 + g * 252, y0 = 54;
    txt(T, x0 + 65, 14, title, g === 1 ? 't-ok t-bold' : 't-fg t-bold', 'middle');
    ['chip 2: 1', 'chip 2: 0'].forEach((t, c) => txt(T, x0 + c * 66 + 32, 42, t, 't-sm', 'middle'));
    ['chip 1: 1', 'chip 1: 0'].forEach((t, r) => txt(T, x0 - 8, y0 + r * 42 + 20, t, 't-sm', 'end'));
    cells.forEach((row, r) => row.forEach((v, c) => {
      const [label, f, tc] = CELL[v];
      s('rect', { x: x0 + c * 66, y: y0 + r * 42, width: 64, height: 40, rx: 4, class: f }, T);
      txt(T, x0 + c * 66 + 32, y0 + r * 42 + 20, label, tc, 'middle');
    }));
    txt(T, x0 + 65, 160, verdict, vcls + ' t-bold', 'middle');
  });
});
