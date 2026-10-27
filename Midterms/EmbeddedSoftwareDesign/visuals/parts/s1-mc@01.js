const hex8 = n => '0x' + (n >>> 0).toString(16).toUpperCase().padStart(8, '0');

QV.register('s1-mc5', function (q) {
  const { s, svg, steps } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);

  const W = svg(viz('lanes'), 780, 262, { label: 'counter++ on x86 and on the Cortex-M0+: one instruction against three, two bus accesses on both', minWidth: 560 });
  const X0 = 112, CW = 172, GAP = 8;
  const cx = k => X0 + k * CW;
  const cols = [[], [], []];
  ['1 · read counter', '2 · add 1', '3 · write counter'].forEach((t, k) => {
    cols[k].push(s('text', { x: cx(k) + (CW - GAP) / 2, y: 14, 'text-anchor': 'middle', class: 't-fg t-bold fade' }, W, t));
  });
  const BUS = ['bus read · counter = 41', null, 'bus write · counter = 42'];
  [
    { y: 26, name: 'x86 · register–memory', cls: 'sec', idle: 'adds inside, no bus', instr: [[0, 3, 'add dword [counter], 1']], total: '1 instruction' },
    { y: 144, name: 'Cortex-M0+ · load–store', cls: 'pri', idle: 'r0 only, no bus', instr: [[0, 1, 'ldr r0, [r1]'], [1, 1, 'adds r0, r0, #1'], [2, 1, 'str r0, [r1]']], total: '3 instructions' },
  ].forEach(L => {
    s('text', { x: 0, y: L.y + 6, class: `t-${L.cls} t-bold` }, W, L.name);
    s('text', { x: 0, y: L.y + 38, dy: '0.35em', class: 't-sm' }, W, 'instruction');
    s('text', { x: 0, y: L.y + 82, dy: '0.35em', class: 't-sm' }, W, 'memory bus');
    L.instr.forEach(([k, n, t]) => {
      const g = s('g', { class: 'fade' }, W);
      if (n === 1) cols[k].push(g);
      s('rect', { x: cx(k), y: L.y + 20, width: n * CW - GAP, height: 36, rx: 5, class: `f-${L.cls}` }, g);
      s('text', { x: cx(k) + (n * CW - GAP) / 2, y: L.y + 38, dy: '0.35em', 'text-anchor': 'middle', class: 't-on t-bold' }, g, t);
    });
    BUS.forEach((b, k) => {
      const g = s('g', { class: 'fade' }, W);
      cols[k].push(g);
      s('rect', { x: cx(k), y: L.y + 66, width: CW - GAP, height: 32, rx: 5, class: b ? 'f-ter-soft' : 'f-none s-line dash' }, g);
      s('text', { x: cx(k) + (CW - GAP) / 2, y: L.y + 82, dy: '0.35em', 'text-anchor': 'middle', class: b ? 't-fg' : 't-muted' }, g, b || L.idle);
    });
    s('text', { x: cx(3) + 4, y: L.y + 38, dy: '0.35em', class: `t-${L.cls} t-bold` }, W, L.total);
    s('text', { x: cx(3) + 4, y: L.y + 82, dy: '0.35em', class: 't-ter t-bold' }, W, '2 bus accesses');
  });

  const NOTES = [
    'All three phases. Both machines read counter once and write it once. The x86 packs the read, the add and the write into one instruction. The Cortex-M0+ spells them out as three, and only ldr and str cross to memory.',
    'Read. The x86 add fetches counter (41) as its memory operand. On the Cortex-M0+, ldr r0, [r1] copies counter into r0. One bus read on each machine.',
    'Add. Both add 1 inside the CPU, 41 + 1 = 42. On the Cortex-M0+ this is adds r0, r0, #1: the ALU sees registers only, so this instruction makes no bus access.',
    'Write. The same x86 instruction writes 42 back. On the Cortex-M0+, str r0, [r1] stores r0. One bus write on each, so the totals are 2 and 2: more instructions, the same memory traffic.',
  ];
  const note = role('lanes-note');
  steps(viz('lanes-steps'), ['All', '1 · read', '2 · add', '3 · write'], k => {
    cols.forEach((gs, i) => gs.forEach(g => g.classList.toggle('dim', k > 0 && i !== k - 1)));
    note.textContent = NOTES[k];
  });
});

QV.register('s1-mc6', function (q) {
  const { s, svg, slider } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const M = 2 ** 32, H = 2 ** 31, LIM = 100, BH = 22;
  const grp = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const dec = v => (v < 0 ? '−' + -v : String(v));

  const W = svg(viz('lines'), 800, 214, { label: 'The bit pattern of delta on a signed and an unsigned number line, with the ok and alarm regions of delta < 100', minWidth: 560 });
  // −10..110 to scale; the unsigned top of range (2³²−10 .. 2³²−1) drawn after a break
  const xs = v => 120 + (v + 10) * 4.5;
  const xt = u => 700 + (u - (M - 10) + 0.5) * 4.5;
  const R1 = 52, R2 = 136;
  const band = (x0, x1, y, cls, label) => {
    s('rect', { x: x0, y, width: x1 - x0, height: BH, class: cls }, W);
    if (label) s('text', { x: (x0 + x1) / 2, y: y + BH / 2, dy: '0.35em', 'text-anchor': 'middle', class: (cls === 'f-ok-soft' ? 't-ok' : 't-bad') + ' t-sm t-bold' }, W, label);
  };
  band(xs(-10), xs(99.5), R1, 'f-ok-soft', 'ok()');
  band(xs(99.5), xs(110), R1, 'f-bad-soft', 'alarm()');
  band(xs(-0.5), xs(99.5), R2, 'f-ok-soft', 'ok()');
  band(xs(99.5), xs(110), R2, 'f-bad-soft', 'alarm()');
  band(700, 745, R2, 'f-bad-soft', 'alarm()');
  [[R1, 'int32_t', 'signed: blt / bge'], [R2, 'uint32_t', 'unsigned: bcc / bcs']].forEach(([y, a, b]) => {
    s('text', { x: 0, y: y + 7, class: 't-fg t-bold' }, W, a);
    s('text', { x: 0, y: y + 21, class: 't-sm' }, W, b);
  });
  const tick = (x, y, label, anchor) => {
    s('line', { x1: x, x2: x, y1: y + BH, y2: y + BH + 5, class: 'l-axis' }, W);
    s('text', { x, y: y + BH + 17, 'text-anchor': anchor || 'middle' }, W, label);
  };
  [-10, 0, 50, 100].forEach(v => tick(xs(v), R1, dec(v)));
  [0, 50, 100].forEach(v => tick(xs(v), R2, String(v)));
  s('text', { x: 722, y: R2 + BH + 17, 'text-anchor': 'middle' }, W, '2³²−10 … 2³²−1');
  s('text', { x: 108, y: R1 + BH / 2, dy: '0.35em', 'text-anchor': 'end', class: 't-muted' }, W, '…');
  s('text', { x: 668, y: R1 + BH / 2, dy: '0.35em', class: 't-muted' }, W, '…');
  [[672, 678], [682, 688]].forEach(([a, b]) => s('line', { x1: a, y1: R2 + BH + 4, x2: b, y2: R2 - 4, class: 's-muted' }, W));
  const mk = s('g', {}, W);

  const mark = (x, y, label) => {
    const anchor = x > 690 ? 'end' : x < 150 ? 'start' : 'middle';
    s('line', { x1: x, x2: x, y1: y - 4, y2: y + BH + 3, class: 's-fg', style: 'stroke-width: 2' }, mk);
    s('polygon', { points: `${x - 5},${y - 11} ${x + 5},${y - 11} ${x},${y - 4}`, class: 'f-fg' }, mk);
    s('text', { x: anchor === 'end' ? x + 6 : anchor === 'start' ? x - 6 : x, y: y - 16, 'text-anchor': anchor, class: 't-fg t-bold' }, mk, label);
  };

  slider(viz('slider'), { label: 'get_offset() returns', min: -10, max: 110, step: 1, value: -3, fmt: dec }, v => {
    const a = v < 0 ? v + M : v, r = (a - LIM + M) % M;
    const N = r >= H ? 1 : 0, Z = r === 0 ? 1 : 0, C = a >= LIM ? 1 : 0;
    const V = (a >= H) !== (LIM >= H) && (r >= H) !== (a >= H) ? 1 : 0;
    const blt = N !== V, bcc = C === 0;
    role('hex').textContent = hex8(a);
    role('flags').textContent = `${N} ${Z} ${C} ${V}`;
    role('signed').textContent = blt ? 'ok()' : 'alarm()';
    role('signed-sub').textContent = blt ? `${dec(v)} < 100: blt taken (N ≠ V)` : `${dec(v)} ≥ 100: bge taken (N = V)`;
    role('unsigned').textContent = bcc ? 'ok()' : 'alarm()';
    role('unsigned-sub').textContent = bcc ? `${grp(a)} < 100: bcc taken (C = 0)` : `${grp(a)} ≥ 100: bcs taken (C = 1)`;
    role('verdict').innerHTML = v < 0
      ? `<b>${dec(v)}</b> is stored as <b>${hex8(a)}</b>. Read as signed it is left of 0, so <code>blt</code> would call <code>ok()</code>. Read as unsigned the same bits are <b>${grp(a)}</b>, near the top of the range, so the board calls <code>alarm()</code>.`
      : `<b>${v}</b>: both readings put the bits at the same place, so the signed and the unsigned branch agree on <code>${blt ? 'ok()' : 'alarm()'}</code>. Only negative values, the bottom of the signed range, tell the two apart.`;
    mk.textContent = '';
    const x1 = xs(v), x2 = v < 0 ? xt(a) : xs(v);
    s('line', { x1, y1: R1 + BH + 4, x2, y2: R2 - 12, class: 's-muted dash', style: 'stroke-width: 1.5' }, mk);
    s('text', { x: (x1 + x2) / 2 + 8, y: (R1 + BH + R2) / 2 + 2, class: 't-muted t-sm halo' }, mk, 'same 32 bits');
    mark(x1, R1, dec(v));
    mark(x2, R2, grp(a));
  });
});

QV.register('s1-mc7', function (q) {
  const { s, svg, steps, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);

  const W = svg(viz('lr'), 780, 276, { label: 'main in flash with bl clock_init at 0x08000312; LR becomes 0x08000317 and bx lr returns to 0x08000316', minWidth: 560 });
  const RX = 20, RW = 290, AW = 92, HH = 28, Y0 = 34;
  s('text', { x: RX, y: 16, class: 't-fg t-bold' }, W, 'main, in flash');
  const rows = [['0x0800030E', 'movs r0, #1', 1], ['0x08000310', 'movs r1, #8', 1], ['0x08000312', 'bl clock_init', 2], ['0x08000316', 'str r0, [r4]', 1], ['0x08000318', '…', 1]];
  const rowG = [];
  let y = Y0;
  const yOf = {};
  rows.forEach(([addr, text, n]) => {
    const g = s('g', { class: 'fade' }, W);
    rowG.push(g);
    const hl = n === 2;
    s('rect', { x: RX + AW, y, width: RW - AW, height: n * HH, class: (hl ? 'f-pri' : 'f-surface') + ' box' }, g);
    s('text', { x: RX + AW + 12, y: y + n * HH / 2, dy: '0.35em', class: hl ? 't-on t-bold' : 't-fg' }, g, text);
    s('text', { x: RX, y: y + HH / 2, dy: '0.35em', class: 't-sm' }, g, addr);
    if (hl) {
      s('text', { x: RX, y: y + HH * 1.5, dy: '0.35em', class: 't-sm' }, g, '0x08000314');
      s('line', { x1: RX + AW, x2: RX + RW, y1: y + HH, y2: y + HH, class: 's-line dash' }, g);
      s('text', { x: RX + RW - 10, y: y + n * HH / 2, dy: '0.35em', 'text-anchor': 'end', class: 't-on t-sm' }, g, '4 bytes');
    }
    yOf[addr] = y + n * HH / 2;
    y += n * HH;
  });
  const callY = yOf['0x08000312'], retY = yOf['0x08000316'];

  const cb = s('g', { class: 'fade' }, W);
  QV.box(cb, 560, callY - 34, 200, 68, 'clock_init:\n…\nbx lr', { textCls: 't-fg' });
  const gCall = s('g', { class: 'fade' }, W);
  arrow(gCall, RX + RW, callY, 556, callY, { cls: 'a-pri', label: 'bl: PC ← clock_init', labelCls: 't-pri t-bold' });

  const LB = { x: 500, y: 184, w: 260, h: 82 };
  const gLR = s('g', { class: 'fade' }, W);
  s('rect', { x: LB.x, y: LB.y, width: LB.w, height: LB.h, rx: 6, class: 'f-pri-soft outline-pri' }, gLR);
  s('text', { x: LB.x + 12, y: LB.y + 20, class: 't-pri t-bold t-lg' }, gLR, 'LR = 0x08000317');
  s('text', { x: LB.x + 12, y: LB.y + 47, dy: '0.35em', class: 't-sm' }, gLR, 'low byte');
  const bits = (0x17).toString(2).padStart(8, '0');
  bits.split('').forEach((b, i) => {
    const on = i === 7;
    s('rect', { x: LB.x + 70 + i * 20, y: LB.y + 36, width: 18, height: 22, rx: 2, class: on ? 'f-ok' : 'f-surface box' }, gLR);
    s('text', { x: LB.x + 79 + i * 20, y: LB.y + 47, dy: '0.35em', 'text-anchor': 'middle', class: on ? 't-on t-bold' : 't-fg' }, gLR, b);
  });
  s('text', { x: LB.x + 239, y: LB.y + 72, 'text-anchor': 'end', class: 't-ok t-bold t-sm' }, gLR, 'bit 0 = 1, Thumb');

  const gW = s('g', { class: 'fade' }, W);
  arrow(gW, RX + RW, callY + 16, LB.x - 4, LB.y + 20, { cls: 'a-pri', dash: true });
  s('text', { x: 400, y: 178, 'text-anchor': 'middle', class: 't-pri halo' }, gW, 'LR ← 0x08000316 | 1');
  const gRet = s('g', { class: 'fade' }, W);
  arrow(gRet, LB.x - 4, LB.y + 60, RX + RW + 4, retY, { cls: 'a-ok', width: 2 });
  s('text', { x: 404, y: 244, 'text-anchor': 'middle', class: 't-ok t-bold halo' }, gRet, 'bx lr: PC ← LR & ~1 = 0x08000316');

  const CALC = [
    'next instruction = 0x08000312 + 4 = 0x08000316     bl is 4 bytes',
    'LR               = 0x08000316 | 1 = 0x08000317     bit 0 = Thumb',
    'bx lr: PC        = LR & ~1        = 0x08000316     back at str r0, [r4]',
  ];
  const NOTES = [
    'The whole round trip. bl writes the address of the next instruction, plus the Thumb bit, into LR and jumps. bx lr clears that bit again and lands right after the call.',
    'bl clock_init executes. It is 4 bytes, rows 0x08000312 and 0x08000314, so the next instruction is at 0x08000316. bl writes 0x08000316 | 1 into LR and jumps. Nothing goes on the stack: this is a link-register machine.',
    'Stopped at the first instruction of clock_init, the debugger shows LR = 0x08000317. The odd value is not a bug: bits 31:1 are the address, bit 0 says "Thumb code".',
    'clock_init ends with bx lr. The core reads bit 0 as the instruction set to resume in (Thumb, the only one it has), clears it and branches to 0x08000316, the str right after the call.',
  ];
  const calc = role('lr-calc'), note = role('lr-note');
  const bl = rowG[2], str = rowG[3];
  const all = rowG.concat([cb, gCall, gW, gLR, gRet]);
  steps(viz('lr-steps'), ['All', '1 · bl', '2 · stopped in clock_init', '3 · bx lr'], k => {
    const on = [null, [bl, cb, gCall, gW, gLR], [cb, gLR], [str, cb, gLR, gRet]][k];
    all.forEach(g => g.classList.toggle('dim', !!on && on.indexOf(g) < 0));
    note.textContent = NOTES[k];
    calc.textContent = (k === 0 ? CALC : k === 1 ? CALC.slice(0, 2) : k === 2 ? CALC.slice(1, 2) : CALC.slice(2)).join('\n');
  });
});

QV.register('s1-mc8', function (q) {
  const { s, svg, arrow, table } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);

  // Figure 1: two 16-bit encodings and the 32-bit constant, bit by bit
  const B = svg(viz('bits'), 790, 236, { label: 'Bit fields of movs r2, #7 and ldr r2, [pc, #44] next to the 32 bits of 0x40022000', minWidth: 560 });
  const X0 = 168, CW = 19;
  const row = (y, value, n, name, sub, fields) => {
    s('text', { x: 0, y: y + 8, class: 't-fg t-bold' }, B, name);
    s('text', { x: 0, y: y + 23, class: 't-sm' }, B, sub);
    const bits = value.toString(2).padStart(n, '0');
    bits.split('').forEach((b, i) => {
      s('rect', { x: X0 + i * CW, y, width: CW - 1, height: 26, rx: 2, class: b === '1' ? 'f-pri' : 'f-seg' }, B);
      s('text', { x: X0 + i * CW + (CW - 1) / 2, y: y + 13, dy: '0.35em', 'text-anchor': 'middle', class: b === '1' ? 't-on' : 't-muted' }, B, b);
    });
    (fields || []).forEach(([a, w, label, hl]) => {
      s('rect', { x: X0 + a * CW - 2, y: y - 3, width: w * CW + 2, height: 32, rx: 3, class: 'f-none ' + (hl ? 'outline-pri' : 's-muted') }, B);
      s('text', { x: X0 + a * CW + (w * CW) / 2, y: y - 9, 'text-anchor': 'middle', class: hl ? 't-pri t-bold' : 't-sm' }, B, label);
    });
  };
  row(34, 0x2207, 16, 'movs r2, #7', '0x2207 · 16 bits', [[0, 5, 'op'], [5, 3, 'Rd = 2'], [8, 8, 'imm8: 0 to 255', true]]);
  row(110, 0x40022000, 32, '0x40022000', 'the constant · 32 bits');
  s('rect', { x: X0 + 24 * CW - 2, y: 107, width: 8 * CW + 2, height: 32, rx: 3, class: 'f-none outline-pri dash' }, B);
  s('text', { x: X0 + 24 * CW + 4 * CW, y: 154, 'text-anchor': 'middle', class: 't-pri' }, B, 'all that imm8 can hold');
  s('text', { x: X0 + 12 * CW, y: 154, 'text-anchor': 'middle', class: 't-bad t-bold' }, B, 'these 24 bits have nowhere to go');
  row(196, 0x4A0B, 16, 'ldr r2, [pc, #44]', '0x4A0B · 16 bits', [[0, 5, 'op'], [5, 3, 'Rt = 2'], [8, 8, 'imm8 = 11 words', true]]);

  // Figure 2: SystemInit in flash and its literal pool
  const P = svg(viz('pool'), 720, 392, { label: 'SystemInit code from 0x0800022C and its literal pool from 0x08000260; ldr r2, [pc, #44] at 0x08000230 loads the word at 0x08000260', minWidth: 540 });
  const RH = 22, CX = [0, 96, 186];
  const items = [
    ['h', 'SystemInit, code: 2-byte instructions'],
    ['r', '0x0800022C', '2007', 'movs r0, #7'],
    ['r', '0x0800022E', '2301', 'movs r3, #1'],
    ['r', '0x08000230', '4A0B', 'ldr  r2, [pc, #44]', 'pri'],
    ['r', '0x08000232', '6811', 'ldr  r1, [r2, #0]'],
    ['r', '0x08000234', '4381', 'bics r1, r0'],
    ['r', '0x08000236', '430B', 'orrs r3, r1'],
    ['r', '0x08000238', '6013', 'str  r3, [r2, #0]'],
    ['m', '…  the rest of SystemInit, up to 0x0800025F'],
    ['h', 'literal pool: 4-byte words'],
    ['r', '0x08000260', '40022000', '.word  FLASH base', 'ok'],
    ['r', '0x08000264', '40021000', '.word  RCC base'],
    ['r', '0x08000268', 'FFFFC7FF', '.word  ~(7 << 11), HSIDIV mask'],
    ['r', '0x0800026C', '20000000', '.word  &SystemCoreClock'],
    ['r', '0x08000270', '02DC6C00', '.word  48000000'],
  ];
  const ys = {};
  let y = 8;
  items.forEach(([kind, a, b, c, hl]) => {
    if (kind === 'h') { s('text', { x: 0, y: y + 16, class: 't-fg t-bold' }, P, a); y += RH + 4; return; }
    if (kind === 'm') { s('text', { x: CX[2], y: y + RH / 2, dy: '0.35em', class: 't-muted' }, P, a); y += RH + 6; return; }
    s('rect', { x: 0, y, width: 470, height: RH - 2, rx: 3, class: hl === 'pri' ? 'f-pri-soft' : hl === 'ok' ? 'f-ok-soft' : 'f-seg' }, P);
    s('text', { x: 8, y: y + RH / 2 - 1, dy: '0.35em', class: 't-sm' }, P, a);
    s('text', { x: CX[1], y: y + RH / 2 - 1, dy: '0.35em', class: hl ? 't-' + hl + ' t-bold' : 't-fg' }, P, b);
    s('text', { x: CX[2], y: y + RH / 2 - 1, dy: '0.35em', class: hl ? 't-' + hl + ' t-bold' : 't-fg' }, P, c);
    ys[a] = y + RH / 2 - 1;
    y += RH;
  });
  const y1 = ys['0x08000230'], y2 = ys['0x08000260'];
  s('path', { d: `M474 ${y1} H530 V${y2}`, class: 's-pri', style: 'stroke-width: 2' }, P);
  arrow(P, 530, y2, 476, y2, { cls: 'a-pri', width: 2 });
  [['PC-relative load', 't-pri t-bold'], ['(0x08000230 + 4) + 44', 't-pri'], ['= 0x08000234 + 44', 't-pri'], ['= 0x08000260', 't-pri t-bold']].forEach(([t, c], i) => {
    s('text', { x: 542, y: (y1 + y2) / 2 - 24 + i * 16, class: c }, P, t);
  });
  s('text', { x: 542, y: y1, dy: '0.35em', class: 't-sm' }, P, 'r2 ← word at 0x08000260');

  const tbl = table(viz('machines'), [{ text: 'Machine', cls: 'l' }, { text: 'How a 32-bit constant reaches a register', cls: 'l' }, { text: 'Option', cls: 'l' }], [
    ['Cortex-M0+, Thumb-1', 'no immediate wider than 8 bits (movs #0–255)', 'A cannot be encoded'],
    ['ARM / Thumb, this chip', 'literal pool next to the code, ldr Rt, [pc, #imm]', 'B'],
    ['RISC-V', 'two halves: lui, then addi', 'C'],
    ['Cortex-M3 / M4, Thumb-2', 'two halves: movw, then movt', 'D, not on the M0+'],
    ['x86', 'the instruction grows: the constant is embedded', ''],
  ].map((r, i) => r.map(c => ({ text: c, cls: 'l' + (i === 1 ? ' hl' : '') }))));
  tbl.rows[1].classList.add('on');
});
