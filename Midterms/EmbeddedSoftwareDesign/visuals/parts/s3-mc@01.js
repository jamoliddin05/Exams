QV.register('s3-mc5', function (q) {
  const { s, svg, steps, table } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const W = svg(viz('stream'), 840, 332, { label: 'counter++, a call and a return as x86 bytes and as Thumb halfwords on one byte scale: the x86 decoder steps 7, 5 and 1 bytes and must decode each instruction to find the next; the Thumb decoder steps 2 or 4 bytes, told by the top five bits of the first halfword', minWidth: 560 });
  const X0 = 150, BW = 48, bx = b => X0 + b * BW;
  const hop = (g, a, b, yt, yb, cls, label, bold) => {
    const x1 = bx(a) + 10, x2 = bx(b) + 4;
    s('path', { d: `M${x1} ${yb - 2} V${yt} H${x2} V${yb - 8}`, class: 's-' + cls, style: 'stroke-width: 1.5' }, g);
    s('polygon', { points: `${x2 - 4},${yb - 8} ${x2 + 4},${yb - 8} ${x2},${yb - 1}`, class: 'f-' + cls }, g);
    s('text', { x: (x1 + x2) / 2, y: yt - 4, 'text-anchor': 'middle', class: `t-${cls} t-sm` + (bold ? ' t-bold' : '') }, g, label);
  };

  const gx = s('g', { class: 'fade' }, W);
  s('text', { x: 0, y: 16, class: 't-sec t-bold' }, gx, 'x86');
  s('text', { x: 0, y: 32, class: 't-sm' }, gx, 'register–memory');
  s('text', { x: 0, y: 46, class: 't-sm' }, gx, '1 to 15 bytes');
  const XB = ['83', '05', '00', '00', '00', '20', '01', 'E8', 'F4', '00', '00', '00', 'C3'];
  [[0, 7, 'add dword [counter], 1', 2], [7, 5, 'call uart_send', 1], [12, 1, 'ret', 1]].forEach(([a, n, name, known]) => {
    s('rect', { x: bx(a) + 2, y: 52, width: n * BW - 4, height: 28, rx: 4, class: 'f-sec-soft box' }, gx);
    for (let i = 1; i < n; i++) s('line', { x1: bx(a + i), x2: bx(a + i), y1: 55, y2: 77, class: 's-line' }, gx);
    for (let i = 0; i < known; i++) s('rect', { x: bx(a + i) + 5, y: 55, width: BW - 10, height: 22, rx: 3, class: 'f-sec' }, gx);
    for (let i = 0; i < n; i++) s('text', { x: bx(a + i) + BW / 2, y: 66, dy: '0.35em', 'text-anchor': 'middle', class: i < known ? 't-on t-bold' : 't-fg' }, gx, XB[a + i]);
    s('text', { x: bx(a) + n * BW / 2, y: 96, 'text-anchor': 'middle', class: 't-fg t-sm' }, gx, name);
    hop(gx, a, a + n, 30, 50, 'sec', '+' + n);
  });
  [['83', ' → ALU op with an 8-bit immediate; a ModRM byte comes next'],
    ['05', ' → ModRM: add, to memory at a 4-byte address; 4 + 1 more bytes'],
    ['', 'the length, 7, is known only after two bytes. E8 → 4 more. C3 → none.']].forEach(([b, t], i) => {
    const tx = s('text', { x: X0, y: 116 + i * 15, class: 't-sm t-fg' }, gx);
    if (b) s('tspan', { class: 't-sec t-bold' }, tx, b);
    s('tspan', {}, tx, t);
  });

  s('line', { x1: bx(0), x2: bx(14), y1: 160, y2: 160, class: 'l-axis' }, W);
  for (let b = 0; b <= 14; b++) s('line', { x1: bx(b), x2: bx(b), y1: 160, y2: b % 2 ? 163 : 166, class: 'l-axis' }, W);
  for (let b = 0; b <= 14; b += 2) s('text', { x: bx(b), y: 178, 'text-anchor': 'middle', class: 't-sm' }, W, String(b));
  s('text', { x: 0, y: 178, class: 't-sm' }, W, 'byte offset');

  const gt = s('g', { class: 'fade' }, W);
  s('text', { x: 0, y: 212, class: 't-pri t-bold' }, gt, 'Thumb');
  s('text', { x: 0, y: 228, class: 't-sm' }, gt, 'load–store');
  s('text', { x: 0, y: 242, class: 't-sm' }, gt, '2 or 4 bytes');
  [[0, ['B510'], 'push {r4, lr}'], [2, ['6808'], 'ldr r0, [r1]'], [4, ['1C40'], 'adds r0, r0, #1'],
    [6, ['6008'], 'str r0, [r1]'], [8, ['F000', 'F87A'], 'bl uart_send'], [12, ['BD10'], 'pop {r4, pc}']].forEach(([a, hw, name]) => {
    const n = 2 * hw.length, top5 = (parseInt(hw[0], 16) >>> 11).toString(2).padStart(5, '0');
    s('rect', { x: bx(a) + 2, y: 248, width: n * BW - 4, height: 28, rx: 4, class: 'f-pri-soft box' }, gt);
    if (n === 4) s('line', { x1: bx(a + 2), x2: bx(a + 2), y1: 251, y2: 273, class: 's-line' }, gt);
    hw.forEach((h, k) => s('text', { x: bx(a + 2 * k) + BW, y: 262, dy: '0.35em', 'text-anchor': 'middle', class: 't-fg' + (k === 0 ? ' t-bold' : '') }, gt, h));
    s('text', { x: bx(a) + n * BW / 2, y: 292, 'text-anchor': 'middle', class: 't-fg t-sm' }, gt, name);
    s('text', { x: bx(a) + BW, y: 309, 'text-anchor': 'middle', class: 't-pri t-sm' + (n === 4 ? ' t-bold' : '') }, gt, `${top5} → ${n}`);
    hop(gt, a, a + n, 226, 246, 'pri', '+' + n, n === 4);
  });
  s('text', { x: X0, y: 326, class: 't-sm t-fg' }, gt, 'top five bits of the first halfword: 11101, 11110 or 11111 → 4 bytes; anything else → 2');

  const NOTES = [
    'Both streams on one byte scale. The x86 decoder steps 7, then 5, then 1 byte, and each step is known only after it has read into the instruction. The Thumb decoder steps 2 bytes, or 4 when the first halfword says so.',
    'x86. Byte 83 says a ModRM byte follows; ModRM 05 says a 4-byte address follows, then the immediate. Only after two bytes does the decoder know this instruction is 7 bytes long and where the call starts. Prefix bytes can stretch an instruction to 15.',
    'Thumb. The decoder reads one halfword and looks at its top five bits. 11101, 11110 or 11111 means a second halfword belongs to it, as for bl (11110); anything else is a whole instruction. The next start is always 2 or 4 bytes on, and every opcode goes through the same pipeline stages.',
  ];
  const note = role('stream-note');
  steps(viz('stream-steps'), ['Both', '1 · x86 decoder', '2 · Thumb decoder'], k => {
    gx.classList.toggle('dim', k === 2);
    gt.classList.toggle('dim', k === 1);
    note.textContent = NOTES[k];
  });

  const tbl = table(viz('models'), ['', 'Register–memory (x86)', 'Load–store (M0+)', 'Option'].map(t => ({ text: t, cls: 'l' })), [
    ['ALU operand', 'a register or memory', 'a register only', 'B is the x86'],
    ['Instruction length', 'variable, 1 to 15 bytes', 'fixed, 2 or 4 bytes', 'C, the gain'],
    ['counter++ costs', '1 instruction', '3 instructions', 'A reverses the cost'],
    ['…and bus accesses', '2', '2', ''],
    ['Set one peripheral bit', 'one or [addr], imm', 'ldr, orrs, str', 'D is the AVR\'s sbi'],
  ].map((r, i) => r.map(c => ({ text: c, cls: 'l' + (i === 1 ? ' hl' : '') }))));
  tbl.rows[1].classList.add('on');
});

QV.register('s3-mc6', function (q) {
  const { s, svg, steps, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);

  // Figure 1: the listing and the state it works on
  const W = svg(viz('loop'), 800, 250, { label: 'The -Os listing beside USART ISR, r6, r0, r6 AND r0 and the Z flag: r6 keeps the 0 read before the loop while ISR becomes 0x80, so tst gives Z = 1 and beq loops forever', minWidth: 560 });
  const LX = 30, LW = 360, RY = [34, 70, 106, 142], RH = 32;
  const LINES = [['', 'ldr', 'r6, [r4, #28]', '; read USART->ISR'], ['loop:', 'tst', 'r6, r0', ''], ['', 'beq', 'loop', ''], ['', 'str', 'r5, [r4, #40]', '; write USART->TDR']];
  s('text', { x: LX, y: 18, class: 't-fg t-bold' }, W, 'the listing, -Os');
  const rowR = LINES.map(([lab, op, args, cm], i) => {
    const r = s('rect', { x: LX, y: RY[i], width: LW, height: RH, rx: 4, class: 'f-surface box' }, W);
    const cy = RY[i] + RH / 2;
    if (lab) s('text', { x: LX + 10, y: cy, dy: '0.35em', class: 't-pri t-bold' }, W, lab);
    s('text', { x: LX + 62, y: cy, dy: '0.35em', class: 't-fg t-bold' }, W, op);
    s('text', { x: LX + 100, y: cy, dy: '0.35em', class: 't-fg' }, W, args);
    if (cm) s('text', { x: LX + 216, y: cy, dy: '0.35em', class: 't-sm' }, W, cm);
    return r;
  });
  const cy1 = RY[1] + RH / 2, cy2 = RY[2] + RH / 2;
  s('path', { d: `M${LX} ${cy2} H${LX - 16} V${cy1}`, class: 's-pri', style: 'stroke-width: 2' }, W);
  arrow(W, LX - 16, cy1, LX - 1, cy1, { cls: 'a-pri', width: 2 });
  s('text', { x: LX, y: 196, class: 't-sm' }, W, 'beq jumps back to tst, so the ldr is outside the loop');
  const never = s('text', { x: LX, y: 216, class: 't-bad t-bold' }, W, '');

  const CX = 560, CW = 22;
  for (let i = 0; i < 8; i++) s('text', { x: CX + i * CW + (CW - 2) / 2, y: 22, 'text-anchor': 'middle', class: 't-sm' + (i === 0 ? ' t-sec t-bold' : '') }, W, String(7 - i));
  const mkRow = (y, name) => {
    s('text', { x: 430, y: y + 11, class: 't-fg t-bold' }, W, name);
    const sub = s('text', { x: 430, y: y + 25, class: 't-sm' }, W, '');
    const cells = [];
    for (let i = 0; i < 8; i++) {
      const r = s('rect', { x: CX + i * CW, y, width: CW - 2, height: 26, rx: 2, class: 'f-seg' }, W);
      const t = s('text', { x: CX + i * CW + (CW - 2) / 2, y: y + 13, dy: '0.35em', 'text-anchor': 'middle', class: 't-fg' }, W, '');
      cells.push({ r, t });
    }
    s('rect', { x: CX - 2, y: y - 2, width: CW + 2, height: 30, rx: 3, class: 'f-none outline-sec' }, W);
    return { sub, cells };
  };
  const isr = mkRow(30, 'USART->ISR'), r6 = mkRow(76, 'r6'), r0 = mkRow(122, 'r0'), and = mkRow(168, 'r6 AND r0');
  s('text', { x: 430, y: 225, class: 't-fg t-bold' }, W, 'Z flag');
  s('text', { x: 430, y: 239, class: 't-sm' }, W, 'in APSR');
  const zR = s('rect', { x: CX, y: 214, width: 64, height: 26, rx: 3, class: 'f-seg' }, W);
  const zT = s('text', { x: CX + 32, y: 227, dy: '0.35em', 'text-anchor': 'middle', class: 't-fg t-bold' }, W, '');
  const zS = s('text', { x: CX + 74, y: 227, dy: '0.35em', class: 't-fg' }, W, '');
  const gL = s('g', {}, W);
  arrow(gL, 752, 58, 752, 76, { cls: 'a-ter', width: 2 });
  s('text', { x: 760, y: 70, class: 't-ter t-bold' }, gL, 'ldr');
  const hx = v => '0x' + v.toString(16).toUpperCase().padStart(2, '0');
  const fill = (row, v, sub) => {
    row.sub.textContent = sub + (v == null ? '' : ' · ' + hx(v));
    row.cells.forEach((c, i) => {
      const b = v == null ? null : (v >> (7 - i)) & 1;
      c.r.setAttribute('class', b ? 'f-pri' : 'f-seg');
      c.t.setAttribute('class', b == null ? 't-muted' : b ? 't-on t-bold' : 't-fg');
      c.t.textContent = b == null ? '–' : String(b);
    });
  };
  fill(r0, 0x80, 'mask');

  // isr, r6, AND, Z, rows just run, ldr arrow, never-reached text
  const ST = [
    [0x80, 0x00, 0x00, 1, [1, 2], false, 'str never runs: TDR is never written'],
    [0x00, 0x00, null, null, [0], true, ''],
    [0x00, 0x00, 0x00, 1, [1], false, ''],
    [0x00, 0x00, 0x00, 1, [2], false, ''],
    [0x80, 0x00, 0x00, 1, [], false, ''],
    [0x80, 0x00, 0x00, 1, [1, 2], false, 'str never runs: TDR is never written'],
  ];
  const NOTES = [
    'Where it ends. The hardware has set TXE, so ISR in memory reads 0x80. r6 still holds the 0 read before the loop, tst gives 0 on every pass, Z stays 1 and beq always jumps back. The str to TDR is never reached.',
    'ldr r6, [r4, #28] reads USART->ISR once and gets 0x00000000. It is the only instruction in the listing that reads ISR, and it runs before the loop label.',
    'tst r6, r0 computes 0x00 AND 0x80 = 0. It throws the result away and keeps the flags: the result is zero, so Z = 1. r6 is unchanged.',
    'beq loop is taken when Z = 1, so it jumps back to loop:, the tst. It does not go back to the ldr.',
    'A few microseconds later the hardware sets TXE, and ISR in memory reads 0x80. Nothing copies it into r6.',
    'tst tests the stale 0 in r6 again: Z = 1, beq taken, and the same two instructions repeat forever. The board hangs with no fault and no warning.',
  ];
  const note = role('loop-note');
  steps(viz('loop-steps'), ['All', '1 · ldr', '2 · tst', '3 · beq', '4 · TXE = 1', '5 · tst, beq …'], k => {
    const [vi, v6, va, z, on, ldr, nv] = ST[k];
    fill(isr, vi, 'memory');
    fill(r6, v6, 'copy');
    fill(and, va, 'dropped');
    zR.setAttribute('class', z ? 'f-pri' : 'f-seg');
    zT.setAttribute('class', (z ? 't-on' : 't-muted') + ' t-bold');
    zT.textContent = z == null ? 'Z = ?' : 'Z = ' + z;
    zS.textContent = z == null ? 'not set yet' : 'beq taken: back to tst';
    rowR.forEach((r, i) => r.setAttribute('class', on.indexOf(i) >= 0 ? 'f-pri-soft' : 'f-surface box'));
    gL.style.display = ldr ? '' : 'none';
    never.textContent = nv;
    note.textContent = NOTES[k];
  });

  // Figure 2: bus reads over time, without and with volatile
  const T = svg(viz('time'), 800, 204, { label: 'Timeline: TXE rises partway; without volatile ISR is read once and the loop never ends; with volatile ISR is read every pass and the first read after TXE rises exits the loop and writes TDR', minWidth: 560 });
  const px = i => 172 + i * 24, XR = 448;
  s('text', { x: 0, y: 34, class: 't-fg t-bold' }, T, 'TXE in ISR');
  s('text', { x: 0, y: 48, class: 't-sm' }, T, 'set by hardware');
  s('path', { d: `M170 48 H${XR} V24 H784`, class: 's-sec', style: 'stroke-width: 2' }, T);
  s('text', { x: 170, y: 42, class: 't-sec t-sm' }, T, '0');
  s('text', { x: XR + 8, y: 18, class: 't-sec t-sm t-bold' }, T, 'hardware sets TXE, 1');
  s('line', { x1: XR, x2: XR, y1: 50, y2: 172, class: 's-line dash' }, T);

  s('text', { x: 0, y: 88, class: 't-fg t-bold' }, T, 'no volatile');
  s('text', { x: 0, y: 102, class: 't-sm' }, T, 'ldr before the loop');
  s('rect', { x: px(0) - 3, y: 78, width: 6, height: 22, rx: 1, class: 'f-ter' }, T);
  for (let i = 1; i <= 25; i++) s('circle', { cx: px(i), cy: 89, r: 2.5, class: 'f-muted' }, T);
  s('text', { x: px(0) - 3, y: 118, class: 't-bad t-sm t-bold halo' }, T, 'reads 0 once, then tests r6 forever; TDR is never written');

  s('text', { x: 0, y: 146, class: 't-fg t-bold' }, T, 'volatile (__IO)');
  s('text', { x: 0, y: 160, class: 't-sm' }, T, 'ldr inside the loop');
  for (let i = 0; i <= 12; i++) s('rect', { x: px(i) - 3, y: 136, width: 6, height: 22, rx: 1, class: i === 12 ? 'f-ok' : 'f-ter' }, T);
  s('rect', { x: px(12) + 14, y: 135, width: 112, height: 24, rx: 4, class: 'f-ok-soft' }, T);
  s('text', { x: px(12) + 70, y: 147, dy: '0.35em', 'text-anchor': 'middle', class: 't-ok t-bold' }, T, 'str to TDR');
  s('text', { x: px(0) - 3, y: 176, class: 't-ok t-sm t-bold' }, T, 'the first read after TXE rises sees 1, the loop exits and TDR is written');
  s('line', { x1: 170, x2: 784, y1: 186, y2: 186, class: 'l-axis' }, T);
  s('text', { x: 784, y: 199, 'text-anchor': 'end', class: 't-sm' }, T, 'time →');
});

QV.register('s3-mc7', function (q) {
  const { s, svg, steps, arrow, table } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const W = svg(viz('frame'), 820, 300, { label: 'Stack, registers and code of process: push {r4, r5, lr} saves three words, the inner bl overwrites LR, and only pop {r4, r5, pc} restores r4, r5 and returns to main at 0x08000244', minWidth: 560 });

  // stack, higher addresses on top
  s('text', { x: 10, y: 16, class: 't-fg t-bold' }, W, 'stack, in SRAM');
  s('text', { x: 10, y: 30, class: 't-sm' }, W, 'higher addresses on top');
  const SA = ['0x20002FF8', '0x20002FF4', '0x20002FF0', '0x20002FEC', '0x20002FE8'];
  const sy = i => 44 + 36 * i;
  SA.forEach((a, i) => s('text', { x: 10, y: sy(i) + 16, dy: '0.35em', class: 't-sm' }, W, a));
  s('rect', { x: 90, y: sy(0), width: 150, height: 32, rx: 4, class: 'f-seg' }, W);
  s('text', { x: 100, y: sy(0) + 16, dy: '0.35em', class: 't-muted' }, W, "main's data");
  s('rect', { x: 90, y: sy(4), width: 150, height: 32, rx: 4, class: 'f-none s-line dash' }, W);
  s('text', { x: 100, y: sy(4) + 16, dy: '0.35em', class: 't-muted' }, W, 'free');
  const SLOT = [['0x08000245', 'saved LR'], ['0x00000003', 'saved r5'], ['0x20000100', 'saved r4']].map(([v, tag], k) => {
    const y = sy(k + 1);
    const r = s('rect', { x: 90, y, width: 150, height: 32, rx: 4, class: 'f-none s-line dash' }, W);
    const t = s('text', { x: 100, y: y + 16, dy: '0.35em', class: 't-muted' }, W, '');
    const g = s('text', { x: 232, y: y + 16, dy: '0.35em', 'text-anchor': 'end', class: 't-sm' }, W, '');
    return { r, t, g, v, tag };
  });
  const spL = s('g', {}, W);

  // registers
  s('text', { x: 330, y: 16, class: 't-fg t-bold' }, W, 'registers');
  const REG = ['r4', 'r5', 'LR', 'SP', 'PC'].map((n, i) => {
    const y = sy(i);
    s('text', { x: 330, y: y + 16, dy: '0.35em', class: 't-fg t-bold' }, W, n);
    const r = s('rect', { x: 366, y, width: 124, height: 32, rx: 4, class: 'f-surface box' }, W);
    const t = s('text', { x: 428, y: y + 16, dy: '0.35em', 'text-anchor': 'middle', class: 't-fg' }, W, '');
    return { r, t };
  });
  s('text', { x: 330, y: 246, class: 't-sm' }, W, 'r4, r5: callee-saved, AAPCS');
  s('text', { x: 330, y: 262, class: 't-sm' }, W, 'args r0 = 0x20000200, r1 = 0x10');

  // code
  s('text', { x: 540, y: 16, class: 't-fg t-bold' }, W, 'code, in flash');
  const CODE = [['h', 'main'], ['r', '0x08000240', 'bl process'], ['r', '0x08000244', 'movs r6, r0'], ['h', 'process'],
    ['r', '0x08000300', 'push {r4, r5, lr}'], ['r', '0x08000302', 'movs r4, r0'], ['r', '0x08000304', 'movs r5, r1'],
    ['r', '0x08000306', 'bl helper'], ['r', '0x0800030A', 'adds r0, r0, r4'], ['r', '0x0800030C', 'adds r0, r0, r5'],
    ['r', '0x0800030E', ''], ['m', 'after it: literal pool, data']];
  const row = {};
  let epi = null;
  CODE.forEach(([k, a, t], i) => {
    const y = 26 + i * 22;
    if (k === 'h') { s('text', { x: 540, y: y + 15, class: 't-fg t-bold' }, W, a); return; }
    if (k === 'm') { s('text', { x: 548, y: y + 11, dy: '0.35em', class: 't-muted' }, W, a); row.pool = { cy: y + 11 }; return; }
    const r = s('rect', { x: 540, y, width: 244, height: 20, rx: 3, class: 'f-seg' }, W);
    s('text', { x: 548, y: y + 10, dy: '0.35em', class: 't-sm' }, W, a);
    const tx = s('text', { x: 626, y: y + 10, dy: '0.35em', class: 't-fg' }, W, t);
    row[a] = { r, cy: y + 10 };
    if (!t) epi = tx;
  });
  const pcL = s('g', {}, W);

  const CALLER = ['0x20000100', '0x00000003'], OWN = ['0x20000200', '0x00000010'];
  // regs r4 r5 LR SP PC as [value, look], stack slots, SP row, row just run, epilogue, PC arrow target, arrow look
  const ST = [
    [[[CALLER[0], ''], [CALLER[1], ''], ['0x08000245', 'new'], ['0x20002FF8', ''], ['0x08000300', 'new']], 'fff', 0, '0x08000240', 'epilogue: ?', null],
    [[[CALLER[0], ''], [CALLER[1], ''], ['0x08000245', ''], ['0x20002FEC', 'new'], ['0x08000302', '']], 'uuu', 3, '0x08000300', 'epilogue: ?', null],
    [[[OWN[0], 'new'], [OWN[1], 'new'], ['0x0800030B', 'new'], ['0x20002FEC', ''], ['0x0800030E', '']], 'uuu', 3, '0x08000306', 'epilogue: ?', null],
    [[[CALLER[0], 'ok'], [CALLER[1], 'ok'], ['0x0800030B', 'mute'], ['0x20002FF4', 'bad'], ['0x0800030A', 'bad']], 'uss', 1, '0x0800030E', 'pop {r4, r5}; bx lr', ['0x0800030A', 'bad']],
    [[[CALLER[0], 'ok'], [CALLER[1], 'ok'], ['0x08000245', 'new'], ['0x20002FF8', 'ok'], ['runs on', 'bad']], 'sss', 0, '0x0800030E', 'pop {r4, r5, lr}', ['pool', 'bad']],
    [[[OWN[0], 'bad'], [OWN[1], 'bad'], ['0x0800030B', 'mute'], ['0x20002FEC', 'bad'], ['0x0800030A', 'bad']], 'uuu', 3, '0x0800030E', 'bx lr', ['0x0800030A', 'bad']],
    [[[CALLER[0], 'ok'], [CALLER[1], 'ok'], ['0x0800030B', 'mute'], ['0x20002FF8', 'ok'], ['0x08000244', 'ok']], 'sss', 0, '0x0800030E', 'pop {r4, r5, pc}', ['0x08000244', 'ok']],
  ];
  const LOOK = { '': ['f-surface box', 't-fg'], new: ['f-pri-soft', 't-pri t-bold'], ok: ['f-ok', 't-on t-bold'], bad: ['f-bad', 't-on t-bold'], mute: ['f-surface box', 't-muted'] };
  const NOTES = [
    'main runs bl process at 0x08000240. bl is 4 bytes, so LR = 0x08000244 | 1 = 0x08000245, the way back to main. r4 and r5 hold main\'s values, and main expects to find them again.',
    'push {r4, r5, lr} stores three words and moves SP down 12 bytes, to 0x20002FEC. The lowest register goes to the lowest address: r4 at SP, r5 at SP + 4, LR at SP + 8.',
    'process uses r4 and r5 for itself and calls helper with bl at 0x08000306, which writes LR = 0x0800030A | 1 = 0x0800030B. The only copy of the way back to main is now the word on the stack.',
    'A · pop {r4, r5} gives r4 and r5 back. Then bx lr branches to 0x0800030B & ~1 = 0x0800030A, inside process. The saved LR word is still on the stack, so SP is 4 bytes low.',
    'B · pop {r4, r5, lr} restores all three words and SP is right, but nothing branches. The core fetches the halfword after the function, here the literal pool, and runs data as code. On the M0+ it would not even assemble: pop cannot name LR.',
    'C · bx lr alone branches to 0x0800030A inside process. r4 and r5 still hold process\'s values, and the three saved words are still on the stack, so SP is 12 bytes low.',
    'D · pop {r4, r5, pc} loads r4, r5 and PC from the three words. PC = 0x08000245 & ~1 = 0x08000244, the instruction after the call in main, and SP is back at 0x20002FF8. One instruction restores and returns.',
  ];
  const note = role('frame-note');
  steps(viz('frame-steps'), ['1 · entry', '2 · push', '3 · bl helper', 'A', 'B', 'C', 'D'], k => {
    const [regs, slots, spRow, ran, epTxt, dest] = ST[k];
    regs.forEach(([v, look], i) => {
      REG[i].r.setAttribute('class', LOOK[look][0]);
      REG[i].t.setAttribute('class', LOOK[look][1]);
      REG[i].t.textContent = v;
    });
    SLOT.forEach((o, i) => {
      const st = slots[i];
      o.r.setAttribute('class', st === 'u' ? 'f-pri-soft' : 'f-none s-line dash');
      o.t.setAttribute('class', st === 'u' ? 't-fg' : 't-muted');
      o.t.textContent = st === 'f' ? 'free' : o.v;
      o.g.setAttribute('class', st === 'u' ? 't-pri t-sm' : 't-muted t-sm');
      o.g.textContent = st === 'f' ? '' : st === 'u' ? o.tag : 'stale';
    });
    spL.textContent = '';
    arrow(spL, 290, sy(spRow) + 16, 244, sy(spRow) + 16, { cls: 'a-pri', width: 2 });
    s('text', { x: 296, y: sy(spRow) + 16, dy: '0.35em', class: 't-pri t-bold' }, spL, 'SP');
    Object.keys(row).forEach(a => { if (row[a].r) row[a].r.setAttribute('class', a === ran ? 'f-pri-soft' : 'f-seg'); });
    epi.textContent = epTxt;
    epi.setAttribute('class', k < 3 ? 't-muted' : 't-fg t-bold');
    pcL.textContent = '';
    if (dest) {
      const ye = row['0x0800030E'].cy, yt = row[dest[0]].cy, c = dest[1];
      s('path', { d: `M786 ${ye} H808 V${yt} H798`, class: 's-' + c, style: 'stroke-width: 2' }, pcL);
      arrow(pcL, 800, yt, 786, yt, { cls: 'a-' + c, width: 2 });
    }
    note.textContent = NOTES[k];
  }, 6);

  const tbl = table(viz('opts'), ['Option', 'Epilogue', 'r4, r5', 'PC after', 'SP after'].map(t => ({ text: t, cls: 'l' })), [
    ['A', 'pop {r4, r5}; bx lr', "main's", '0x0800030A, in process', '0x20002FF4, 4 low'],
    ['B', 'pop {r4, r5, lr}', "main's", 'runs on past the code', '0x20002FF8'],
    ['C', 'bx lr', "process's", '0x0800030A, in process', '0x20002FEC, 12 low'],
    ['D', 'pop {r4, r5, pc}', "main's", '0x08000244, in main', '0x20002FF8'],
  ].map(r => r.map(c => ({ text: c, cls: 'l' }))));
  tbl.rows[3].classList.add('on');
});

QV.register('s3-mc8', function (q) {
  const { s, svg, steps, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);

  // Figure 1: set the Thumb bit, split into bytes, store lowest byte first
  const B = svg(viz('build'), 780, 262, { label: 'Reset_Handler 0x08000190 gets bit 0 set to 0x08000191, splits into bytes 08 00 01 91, and is stored little-endian as 91 01 00 08 at 0x08000004 to 0x08000007', minWidth: 560 });
  const bitsRow = (g, x, v, label) => {
    s('text', { x, y: 14, class: 't-sm' }, g, label);
    v.toString(2).padStart(8, '0').split('').forEach((b, i) => {
      const last = i === 7, on = b === '1';
      s('rect', { x: x + i * 26, y: 22, width: 24, height: 28, rx: 2, class: last ? (on ? 'f-ok' : 'f-bad-soft') : on ? 'f-pri' : 'f-seg' }, g);
      s('text', { x: x + i * 26 + 12, y: 36, dy: '0.35em', 'text-anchor': 'middle', class: on ? 't-on t-bold' : last ? 't-bad t-bold' : 't-fg' }, g, b);
    });
  };
  const g1 = s('g', { class: 'fade' }, B);
  s('text', { x: 0, y: 32, class: 't-fg t-bold' }, g1, 'Reset_Handler');
  s('text', { x: 0, y: 48, class: 't-sm' }, g1, '0x08000190, even');
  bitsRow(g1, 170, 0x90, 'low byte 0x90');
  s('text', { x: 170, y: 66, class: 't-bad t-sm' }, g1, 'bit 0 = 0');
  arrow(g1, 386, 36, 432, 36, { cls: 'a-pri', width: 2, label: '| 1', labelCls: 't-pri t-bold', dy: -10 });
  bitsRow(g1, 440, 0x91, 'low byte 0x91');
  s('text', { x: 440, y: 66, class: 't-ok t-sm t-bold' }, g1, 'bit 0 = 1, Thumb');
  s('text', { x: 664, y: 36, dy: '0.35em', class: 't-pri t-bold t-lg' }, g1, '0x08000191');
  s('text', { x: 664, y: 58, class: 't-sm' }, g1, 'the vector');

  const CXm = k => 170 + k * 72, BX = j => CXm(4 + j);
  const g2 = s('g', { class: 'fade' }, B);
  s('text', { x: 0, y: 110, class: 't-fg t-bold' }, g2, '0x08000191');
  s('text', { x: 0, y: 126, class: 't-sm' }, g2, 'bytes, MSB first');
  ['08', '00', '01', '91'].forEach((v, j) => {
    s('text', { x: BX(j) + 34, y: 92, 'text-anchor': 'middle', class: 't-sm' }, g2, ['bits 31:24', '23:16', '15:8', '7:0'][j]);
    s('rect', { x: BX(j), y: 98, width: 68, height: 30, rx: 4, class: 'f-pri-soft' }, g2);
    s('text', { x: BX(j) + 34, y: 113, dy: '0.35em', 'text-anchor': 'middle', class: 't-pri t-bold t-lg' }, g2, v);
  });

  const g3 = s('g', { class: 'fade' }, B);
  [0, 1, 2, 3].forEach(j => arrow(g3, BX(j) + 34, 130, CXm(7 - j) + 34, 186, { cls: 'a-pri', width: 1.5 }));
  s('text', { x: 0, y: 202, class: 't-fg t-bold' }, B, 'flash image');
  s('text', { x: 0, y: 218, class: 't-sm' }, B, 'one byte per address');
  ['00', '30', '00', '20', '91', '01', '00', '08'].forEach((v, k) => {
    const vec = k >= 4;
    s('rect', { x: CXm(k), y: 188, width: 68, height: 30, rx: 3, class: vec ? 'f-pri' : 'f-seg' }, vec ? g3 : B);
    s('text', { x: CXm(k) + 34, y: 203, dy: '0.35em', 'text-anchor': 'middle', class: vec ? 't-on t-bold t-lg' : 't-muted t-lg' }, vec ? g3 : B, v);
    s('text', { x: CXm(k) + 34, y: 232, 'text-anchor': 'middle', class: 't-sm' + (vec ? ' t-fg' : '') }, B, '0x0800000' + k);
  });
  s('text', { x: CXm(0) + 142, y: 252, 'text-anchor': 'middle', class: 't-muted t-sm' }, B, 'initial SP = 0x20003000');
  s('text', { x: CXm(4) + 142, y: 252, 'text-anchor': 'middle', class: 't-pri t-sm t-bold' }, g3, 'reset vector = 0x08000191');

  const NOTES = [
    'Two rules, one after the other. Set bit 0, the Thumb bit, then store the lowest byte at the lowest address. The crossing arrows are the little-endian reversal.',
    'Reset_Handler is at 0x08000190, an even address. Every code address handed to the core carries bit 0 = 1, the Thumb bit: 0x90 | 1 = 0x91, so the vector is 0x08000191.',
    'Split 0x08000191 into bytes, most significant first: 08, 00, 01, 91. Written this way it reads like the number, which is big-endian order, options B and C.',
    'The Cortex-M is little-endian: the lowest byte goes to the lowest address. 0x91 lands at 0x08000004 and 0x08 at 0x08000007, so the image holds 91 01 00 08. The initial SP before it follows the same rule: 0x20003000 is stored as 00 30 00 20.',
  ];
  const bnote = role('build-note');
  steps(viz('build-steps'), ['All', '1 · Thumb bit', '2 · bytes', '3 · little-endian'], k => {
    const on = [null, [g1], [g1, g2], [g2, g3]][k];
    [g1, g2, g3].forEach(g => g.classList.toggle('dim', !!on && on.indexOf(g) < 0));
    bnote.textContent = NOTES[k];
  });

  // Figure 2: read each option back the way the core does
  const R = svg(viz('read'), 780, 176, { label: 'The four option byte sequences at 0x08000004 to 0x08000007 read back little-endian: only 91 01 00 08 gives 0x08000191 with bit 0 set', minWidth: 560 });
  s('text', { x: 0, y: 36, class: 't-fg t-bold' }, R, 'flash');
  s('text', { x: 0, y: 52, class: 't-sm' }, R, 'as the option wrote it');
  s('text', { x: 0, y: 128, class: 't-fg t-bold' }, R, 'word read');
  s('text', { x: 0, y: 144, class: 't-sm' }, R, 'byte at …07 on top');
  const mem = [0, 1, 2, 3].map(k => {
    s('text', { x: CXm(k) + 34, y: 14, 'text-anchor': 'middle', class: 't-sm' }, R, '0x0800000' + (4 + k));
    const r = s('rect', { x: CXm(k), y: 20, width: 68, height: 30, rx: 3, class: 'f-seg' }, R);
    const t = s('text', { x: CXm(k) + 34, y: 35, dy: '0.35em', 'text-anchor': 'middle', class: 't-fg t-bold t-lg' }, R, '');
    arrow(R, CXm(k) + 34, 52, CXm(3 - k) + 34, 110, { cls: 'a-muted' });
    return { r, t };
  });
  const word = [0, 1, 2, 3].map(j => {
    const r = s('rect', { x: CXm(j), y: 112, width: 68, height: 30, rx: 3, class: 'f-seg' }, R);
    const t = s('text', { x: CXm(j) + 34, y: 127, dy: '0.35em', 'text-anchor': 'middle', class: 't-fg t-bold t-lg' }, R, '');
    s('text', { x: CXm(j) + 34, y: 160, 'text-anchor': 'middle', class: 't-sm' }, R, ['bits 31:24', '23:16', '15:8', '7:0'][j]);
    return { r, t };
  });
  const out = [36, 60, 84, 108].map((y, i) => s('text', { x: 470, y, class: i === 0 ? 't-fg t-bold t-lg' : 't-fg' }, R, ''));

  const OPTS = [['A', '90 01 00 08'], ['B', '08 00 01 91'], ['C', '08 00 01 90'], ['D', '91 01 00 08']];
  const RNOTES = {
    A: 'A · 90 01 00 08 reads back as 0x08000190. The address is right, but bit 0 = 0 asks for ARM state, which a Cortex-M does not have. The chip faults at once, before Reset_Handler runs a single instruction.',
    B: 'B · 08 00 01 91 is the vector written most significant first. Read little-endian it is 0x91010008: bit 0 = 0, and the address is nowhere near the code in flash. The chip faults on reset.',
    C: 'C · 08 00 01 90 is big-endian and even. The core reads 0x90010008 with bit 0 = 0, and the chip faults on reset.',
    D: 'D · 91 01 00 08 reads back as 0x08000191. Bit 0 = 1 says Thumb, PC = 0x08000191 & ~1 = 0x08000190, and Reset_Handler runs.',
  };
  const rnote = role('read-note');
  steps(viz('read-steps'), OPTS.map(([k, b]) => `${k} · ${b}`), k => {
    const [key, bytes] = OPTS[k], by = bytes.split(' ');
    const w = by.slice().reverse().join(''), v = parseInt(w, 16), T = v & 1;
    const ok = T === 1 && (v & ~1) === 0x08000190;
    mem.forEach((m, i) => { m.t.textContent = by[i]; m.r.setAttribute('class', ok ? 'f-pri-soft' : 'f-bad-soft'); });
    word.forEach((c, j) => {
      c.t.textContent = by[3 - j];
      c.r.setAttribute('class', j === 3 ? (T ? 'f-ok' : 'f-bad') : 'f-seg');
      c.t.setAttribute('class', (j === 3 ? 't-on' : 't-fg') + ' t-bold t-lg');
    });
    out[0].textContent = 'word = 0x' + w.toUpperCase();
    out[1].textContent = T ? 'bit 0 = 1: Thumb' : 'bit 0 = 0: ARM state, none here';
    out[1].setAttribute('class', (T ? 't-ok' : 't-bad') + ' t-bold');
    out[2].textContent = 'PC = 0x' + ((v & ~1) >>> 0).toString(16).toUpperCase().padStart(8, '0');
    out[3].textContent = ok ? 'Reset_Handler runs' : 'HardFault on reset';
    out[3].setAttribute('class', (ok ? 't-ok' : 't-bad') + ' t-bold');
    rnote.textContent = RNOTES[key];
  }, 3);
});
