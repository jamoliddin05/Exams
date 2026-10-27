const hex8 = n => '0x' + (n >>> 0).toString(16).toUpperCase().padStart(8, '0');

QV.register('s2-mc5', function (q) {
  const { s, svg, arrow, steps } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const W = svg(viz('flags'), 800, 286, { label: 'RISC-V compares inside each branch; the Cortex-M0+ compares once with cmp, sets N Z C V in APSR, and two branches read them', minWidth: 560 });

  // RISC-V: each branch carries its own comparison
  s('text', { x: 10, y: 16, class: 't-sec t-bold' }, W, 'RISC-V · compare-and-branch');
  const rv = [['blt a0, a1, less', 40], ['beq a0, a1, equal', 120]].map(([t, y]) => {
    const g = s('g', { class: 'fade' }, W);
    s('rect', { x: 10, y, width: 250, height: 48, rx: 6, class: 'f-sec' }, g);
    s('text', { x: 24, y: y + 17, class: 't-on t-bold' }, g, t);
    const sub = s('text', { x: 24, y: y + 35, class: 't-on t-sm' }, g, '');
    const res = s('text', { x: 270, y: y + 24, dy: '0.35em', class: 't-fg t-bold' }, g, '');
    return { g, sub, res };
  });
  s('text', { x: 10, y: 206, class: 't-muted' }, W, 'No flags register: each branch');
  s('text', { x: 10, y: 222, class: 't-muted' }, W, 'compares a0 with a1 by itself.');
  s('line', { x1: 392, x2: 392, y1: 6, y2: 276, class: 's-line' }, W);

  // Cortex-M0+: cmp → APSR → two branches
  const X = 420;
  s('text', { x: X, y: 16, class: 't-pri t-bold' }, W, 'Cortex-M0+ · condition codes');
  s('rect', { x: X, y: 30, width: 190, height: 34, rx: 6, class: 'f-pri' }, W);
  s('text', { x: X + 95, y: 47, dy: '0.35em', 'text-anchor': 'middle', class: 't-on t-bold' }, W, 'cmp r0, r1');
  const regs = s('text', { x: X + 202, y: 47, dy: '0.35em', class: 't-fg' }, W, '');
  arrow(W, X + 95, 66, X + 95, 92, { cls: 'a-pri', label: 'sets', dx: 22, dy: 4, labelCls: 't-pri' });
  s('text', { x: X, y: 112, dy: '0.35em', class: 't-fg t-bold' }, W, 'APSR');
  const cells = ['N', 'Z', 'C', 'V'].map((f, i) => {
    const x = X + 50 + i * 54;
    const r = s('rect', { x, y: 96, width: 48, height: 32, rx: 4, class: 'f-seg' }, W);
    const t = s('text', { x: x + 24, y: 112, dy: '0.35em', 'text-anchor': 'middle', class: 't-fg t-bold' }, W, f);
    s('text', { x: x + 24, y: 142, 'text-anchor': 'middle', class: 't-sm' }, W, 'bit ' + (31 - i));
    return { r, t, f };
  });
  const br = [['blt less', 'reads N ≠ V', X, 168, X + 60], ['beq equal', 'reads Z = 1', X + 196, 168, X + 104]].map(([t, c, x, w, from]) => {
    const g = s('g', { class: 'fade' }, W);
    arrow(g, from, 150, x + w / 2, 186, { cls: 'a-pri' });
    s('rect', { x, y: 188, width: w, height: 34, rx: 6, class: 'f-pri' }, g);
    s('text', { x: x + w / 2, y: 205, dy: '0.35em', 'text-anchor': 'middle', class: 't-on t-bold' }, g, t);
    s('text', { x: x + w / 2, y: 238, 'text-anchor': 'middle', class: 't-pri' }, g, c);
    const res = s('text', { x: x + w / 2, y: 256, 'text-anchor': 'middle', class: 't-fg t-bold' }, g, '');
    return { g, res };
  });
  s('text', { x: X, y: 278, class: 't-muted' }, W, 'One cmp, two branches, the same four flags.');

  const CASES = [[3, 5], [5, 5], [7, 5]];
  const note = role('flags-note'), calc = role('flags-calc');
  steps(viz('flags-steps'), CASES.map(([a, b]) => `a = ${a}, b = ${b}`), k => {
    const [a, b] = CASES[k], r = (a - b) >>> 0;
    const F = { N: r >>> 31, Z: r === 0 ? 1 : 0, C: a >= b ? 1 : 0, V: 0 };
    const lt = F.N !== F.V, eq = F.Z === 1;
    regs.textContent = `r0 = ${a}, r1 = ${b}`;
    cells.forEach(c => {
      c.r.setAttribute('class', F[c.f] ? 'f-pri' : 'f-seg');
      c.t.setAttribute('class', (F[c.f] ? 't-on' : 't-fg') + ' t-bold');
      c.t.textContent = `${c.f} = ${F[c.f]}`;
    });
    const set = (o, text, cls, dim) => { o.res.textContent = text; o.res.setAttribute('class', cls + ' t-bold'); o.g.classList.toggle('dim', dim); };
    rv[0].sub.textContent = `compares ${a} < ${b} itself`;
    rv[1].sub.textContent = `compares ${a} == ${b} itself`;
    set(rv[0], lt ? 'taken' : 'not taken', lt ? 't-ok' : 't-muted', false);
    set(rv[1], lt ? 'not reached' : eq ? 'taken' : 'not taken', eq && !lt ? 't-ok' : 't-muted', lt);
    set(br[0], lt ? 'taken: a < b' : 'not taken', lt ? 't-ok' : 't-muted', false);
    set(br[1], lt ? 'not reached' : eq ? 'taken: a == b' : 'not taken: a > b', eq && !lt ? 't-ok' : 't-muted', lt);
    note.textContent = lt
      ? `${a} < ${b}. cmp computes ${a} − ${b} = −${b - a}, keeps only the flags, and N = 1 with V = 0 makes blt jump to less. RISC-V gets the same jump from blt a0, a1, less, which compares on its own.`
      : eq
        ? `${a} == ${b}. The difference is 0, so Z = 1 and N = V = 0. blt falls through, and beq reads the same flags that cmp set two instructions earlier. RISC-V's beq has to compare a0 with a1 again.`
        : `${a} > ${b}. The difference is ${a - b}: N = 0, Z = 0. Neither branch is taken and the code falls through to the a > b case. On ARM one cmp answered both questions.`;
    calc.textContent = [
      `cmp r0, r1    ${a} − ${b} = ${a - b < 0 ? '−' + (b - a) : a - b} = ${hex8(r)}    result thrown away, r0 still ${a}`,
      `flags         N = ${F.N}   Z = ${F.Z}   C = ${F.C}   V = ${F.V}`,
      `blt less      N ≠ V ? ${lt ? 'yes, taken' : 'no'}`,
      `beq equal     Z = 1 ? ${lt ? 'not reached' : eq ? 'yes, taken' : 'no, fall through'}`,
    ].join('\n');
  });
});

QV.register('s2-mc6', function (q) {
  const { s, svg, arrow, steps } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const W = svg(viz('calls'), 800, 290, { label: 'main calls log_value, log_value calls uart_send; the second bl overwrites LR, so bx lr in log_value branches to itself forever', minWidth: 560 });
  const RH = 26;
  const fns = [
    { x: 20, w: 230, name: 'main', rows: [['0x08000200', 'bl log_value', 2], ['0x08000204', 'rest of main', 1]] },
    { x: 290, w: 230, name: 'log_value', rows: [['0x08000300', 'movs r0, #65', 1], ['0x08000302', 'bl uart_send', 2], ['0x08000306', 'bx lr', 1]] },
    { x: 560, w: 220, name: 'uart_send, a leaf', rows: [['0x08000400', '…', 1], ['…', 'bx lr', 1]] },
  ];
  const at = {};
  fns.forEach(f => {
    s('text', { x: f.x, y: 16, class: 't-fg t-bold' }, W, f.name);
    let y = 26;
    f.rows.forEach(([addr, text, n]) => {
      const r = s('rect', { x: f.x, y, width: f.w, height: n * RH, class: 'f-surface box' }, W);
      s('text', { x: f.x + 8, y: y + RH / 2, dy: '0.35em', class: 't-sm' }, W, addr);
      s('text', { x: f.x + 82, y: y + n * RH / 2, dy: '0.35em', class: 't-fg' }, W, text);
      at[f.name.split(',')[0] + ':' + text] = { r, x: f.x, w: f.w, y, h: n * RH, cy: y + n * RH / 2 };
      y += n * RH;
    });
  });
  const LB = s('rect', { x: 20, y: 196, width: 400, height: 76, rx: 6, class: 'f-pri-soft outline-pri' }, W);
  s('text', { x: 34, y: 220, class: 't-pri t-bold t-lg' }, W, 'LR');
  const lrV = s('text', { x: 66, y: 220, class: 't-pri t-bold t-lg' }, W, '');
  const lrS = s('text', { x: 34, y: 242, class: 't-fg' }, W, '');
  const lrS2 = s('text', { x: 34, y: 260, class: 't-sm' }, W, '');
  const lost = s('text', { x: 440, y: 220, class: 't-bad t-bold' }, W, '');
  const lost2 = s('text', { x: 440, y: 238, class: 't-bad' }, W, '');
  const layer = s('g', {}, W);

  const A = at['main:bl log_value'], B = at['main:rest of main'];
  const C = at['log_value:bl uart_send'], D = at['log_value:bx lr'], E = at['log_value:movs r0, #65'];
  const U0 = at['uart_send:…'], U1 = at['uart_send:bx lr'];
  const draw = {
    1: () => arrow(layer, A.x + A.w, A.cy, E.x - 2, E.cy, { cls: 'a-pri', width: 2, label: 'bl', labelCls: 't-pri t-bold' }),
    2: () => arrow(layer, C.x + C.w, C.cy, U0.x - 2, U0.cy, { cls: 'a-pri', width: 2, label: 'bl', labelCls: 't-pri t-bold' }),
    3: () => arrow(layer, U1.x, U1.cy, D.x + D.w + 2, D.cy, { cls: 'a-ok', width: 2, label: 'bx lr', labelCls: 't-ok t-bold', dy: 14 }),
    4: () => {
      s('path', { d: `M${D.x + 150} ${D.y + D.h} V${D.y + D.h + 22} H${D.x + 100}`, class: 's-bad', style: 'stroke-width: 2' }, layer);
      arrow(layer, D.x + 100, D.y + D.h + 22, D.x + 100, D.y + D.h + 2, { cls: 'a-bad', width: 2 });
      s('text', { x: D.x + 160, y: D.y + D.h + 26, class: 't-bad t-bold' }, layer, 'bx lr → 0x08000306 → bx lr …');
      arrow(layer, D.x - 2, D.cy, B.x + B.w + 2, B.cy, { cls: 'a-bad', dash: true, label: 'never', labelCls: 't-bad', dy: 16 });
    },
  };
  const hl = rows => Object.values(at).forEach(o => o.r.setAttribute('class', (rows.indexOf(o) >= 0 ? 'f-pri-soft' : 'f-surface') + ' box'));
  const STATE = [
    ['0x08000307', 'written by bl uart_send at 0x08000302', 'the way back to main is gone', [C, D], 'Overwritten: 0x08000205,', 'the return address into main', 'The whole story. bl log_value saves the way back to main in LR, bl uart_send overwrites it, and bx lr in log_value then branches to its own address forever. No fault, no error: the board just stops doing anything.'],
    ['0x08000205', 'written by bl log_value at 0x08000200', '0x08000204 | 1: back to main', [A, E], '', '', 'main executes bl log_value, a 4-byte instruction. LR = 0x08000204 | 1 = 0x08000205, the way back to main. Nothing goes on the stack.'],
    ['0x08000307', 'written by bl uart_send at 0x08000302', '0x08000306 | 1: back into log_value', [C, U0], 'Overwritten: 0x08000205,', 'the return address into main', 'log_value has no prologue, so it never saved LR. bl uart_send writes 0x08000306 | 1 = 0x08000307 into LR, and main\'s return address is gone.'],
    ['0x08000307', 'uart_send is a leaf, it left LR alone', 'bx lr: PC = 0x08000306', [U1, D], 'Overwritten: 0x08000205,', 'the return address into main', 'uart_send ends with bx lr: PC = 0x08000307 & ~1 = 0x08000306. That is correct for uart_send, and it lands on the bx lr of log_value.'],
    ['0x08000307', 'still the value bl uart_send wrote', 'bx lr: PC = 0x08000306 again', [D], 'Overwritten: 0x08000205,', 'the return address into main', 'log_value now runs its own bx lr. LR still holds 0x08000307, so PC = 0x08000306: the same bx lr, again and again. main is never reached.'],
  ];
  const note = role('calls-note');
  steps(viz('calls-steps'), ['All', '1 · bl log_value', '2 · bl uart_send', '3 · uart_send returns', '4 · bx lr'], k => {
    layer.textContent = '';
    (k === 0 ? [1, 2, 3, 4] : [k]).forEach(i => draw[i]());
    const [v, s1, s2, rows, l1, l2, n] = STATE[k];
    lrV.textContent = '= ' + v;
    lrS.textContent = s1;
    lrS2.textContent = s2;
    lost.textContent = l1;
    lost2.textContent = l2;
    hl(rows);
    note.textContent = n;
  });
});

QV.register('s2-mc7', function (q) {
  const { s, svg, arrow, steps, table } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const W = svg(viz('rmw'), 800, 214, { label: 'GPIOA ODR low 16 bits, register r2 and mask r0 through ldr, orrs, str: ODR goes from 0x0101 to 0x0121', minWidth: 560 });
  const X0 = 150, CW = 31, BIT5 = 10;
  for (let i = 0; i < 16; i++) s('text', { x: X0 + i * CW + (CW - 2) / 2, y: 14, 'text-anchor': 'middle', class: 't-sm' + (i === BIT5 ? ' t-sec t-bold' : '') }, W, String(15 - i));
  const mkRow = (y, name) => {
    s('text', { x: 0, y: y + 12, class: 't-fg t-bold' }, W, name);
    const hex = s('text', { x: 0, y: y + 27, class: 't-sm' }, W, '');
    const cells = [];
    for (let i = 0; i < 16; i++) {
      const r = s('rect', { x: X0 + i * CW, y, width: CW - 2, height: 32, rx: 2, class: 'f-seg' }, W);
      const t = s('text', { x: X0 + i * CW + (CW - 2) / 2, y: y + 16, dy: '0.35em', 'text-anchor': 'middle', class: 't-muted' }, W, '');
      cells.push({ r, t });
    }
    s('rect', { x: X0 + BIT5 * CW - 2, y: y - 3, width: CW + 2, height: 38, rx: 3, class: 'f-none outline-sec' }, W);
    return { hex, cells };
  };
  const odr = mkRow(24, 'GPIOA->ODR'), r2 = mkRow(96, 'r2'), r0 = mkRow(166, 'r0');
  const fill = (row, v, fresh, label) => {
    row.hex.textContent = v == null ? 'not loaded yet' : label + (v >>> 0).toString(16).toUpperCase().padStart(4, '0');
    row.cells.forEach((c, i) => {
      const b = v == null ? null : (v >> (15 - i)) & 1;
      const isNew = fresh && i === BIT5;
      c.r.setAttribute('class', b == null ? 'f-seg' : isNew ? 'f-ok' : b ? 'f-pri' : 'f-seg');
      c.t.setAttribute('class', b == null ? 't-muted' : b ? 't-on t-bold' : 't-fg');
      c.t.textContent = b == null ? '–' : String(b);
    });
  };
  fill(r0, 0x20, false, 'mask 1u << 5 = 0x');
  const gL = s('g', { class: 'fade' }, W), gO = s('g', { class: 'fade' }, W), gS = s('g', { class: 'fade' }, W);
  arrow(gL, 684, 58, 684, 94, { cls: 'a-ter', width: 2 });
  s('text', { x: 692, y: 80, class: 't-ter t-bold' }, gL, 'ldr');
  arrow(gS, 752, 94, 752, 58, { cls: 'a-ter', width: 2 });
  s('text', { x: 760, y: 80, class: 't-ter t-bold' }, gS, 'str');
  arrow(gO, 718, 164, 718, 130, { cls: 'a-pri', width: 2 });
  s('text', { x: 726, y: 151, class: 't-pri t-bold' }, gO, 'orrs');
  const STATES = [
    [0x0101, null, false, false, [], 'ODR has PA0 and PA8 high. The goal is to raise PA5 and leave every other pin alone. The ALU cannot reach ODR in memory, so the work goes through r2.'],
    [0x0101, 0x0101, false, false, [gL], 'ldr r2, [r1, #0x14]: one bus read copies ODR into r2. From here until the str, ODR in memory and the copy in r2 can drift apart; that gap is lesson 03.'],
    [0x0101, 0x0121, true, false, [gO], 'orrs r2, r0: r2 = 0x0101 | 0x0020 = 0x0121. This is the | of |=, done in a register. No bus access.'],
    [0x0121, 0x0121, true, true, [gS], 'str r2, [r1, #0x14]: one bus write puts 0x0121 back. PA5 is high, PA0 and PA8 kept their value. Three instructions, two bus accesses.'],
  ];
  const note = role('rmw-note');
  steps(viz('rmw-steps'), ['Before', '1 · ldr', '2 · orrs', '3 · str'], k => {
    const [o, r, f2, f1, on, n] = STATES[k];
    fill(odr, o, f1, '0x');
    fill(r2, r, f2, '0x');
    [gL, gO, gS].forEach(g => g.classList.toggle('dim', on.indexOf(g) < 0));
    note.textContent = n;
  });

  const tbl = table(viz('opts'), ['Option', 'Sequence', 'ODR after', 'Pins'].map(t => ({ text: t, cls: 'l' })), [
    ['A', 'orrs [r1, #0x14], r0', '—', 'not an instruction: the ALU takes no memory operand'],
    ['B', 'ldr, bics, str', '0x0101', 'PA5 cleared (it stays low): bics is &= ~'],
    ['C', 'str r0', '0x0020', 'PA5 high, but PA0 and PA8 switched off'],
    ['D', 'ldr, orrs, str', '0x0121', 'PA5 high, every other pin kept'],
  ].map(r => r.map(c => ({ text: c, cls: 'l' }))));
  tbl.rows[3].classList.add('on');
});

QV.register('s2-mc8', function (q) {
  const { s, svg, steps } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const W = svg(viz('enc'), 780, 246, { label: 'Encoding 01101 imm5 Rn Rt of a 16-bit ldr, and the offsets 0 to 124 it can reach; 0x80 needs a sixth bit', minWidth: 560 });
  const X0 = 160, CW = 34;
  [[0, 5, '15:11 op'], [5, 5, '10:6 imm5, offset ÷ 4'], [10, 3, '5:3 Rn = r4'], [13, 3, '2:0 Rt = r0']].forEach(([a, n, t], i) => {
    s('text', { x: X0 + (a + n / 2) * CW, y: 16, 'text-anchor': 'middle', class: i === 1 ? 't-pri t-bold' : 't-sm' }, W, t);
  });
  s('text', { x: 0, y: 38, class: 't-fg t-bold' }, W, 'ldr r0, [r4, #off]');
  const encT = s('text', { x: 0, y: 54, class: 't-sm' }, W, '');
  const cells = [];
  for (let i = 0; i < 16; i++) {
    const r = s('rect', { x: X0 + i * CW, y: 24, width: CW - 2, height: 34, rx: 2, class: 'f-seg' }, W);
    const t = s('text', { x: X0 + i * CW + (CW - 2) / 2, y: 41, dy: '0.35em', 'text-anchor': 'middle', class: 't-fg' }, W, '');
    cells.push({ r, t });
  }
  s('rect', { x: X0 + 5 * CW - 3, y: 20, width: 5 * CW + 2, height: 42, rx: 3, class: 'f-none outline-pri' }, W);
  const under = s('g', {}, W);

  const xo = o => 60 + o * 4.8, LY = 166;
  s('rect', { x: xo(0), y: LY, width: xo(124) - xo(0), height: 16, class: 'f-ok-soft' }, W);
  s('rect', { x: xo(124), y: LY, width: xo(140) - xo(124), height: 16, class: 'f-bad-soft' }, W);
  for (let o = 0; o <= 124; o += 4) s('line', { x1: xo(o), x2: xo(o), y1: LY + 16, y2: LY + 20, class: 'l-axis' }, W);
  s('line', { x1: xo(0), x2: xo(140), y1: LY + 16, y2: LY + 16, class: 'l-axis' }, W);
  [[0, 'middle'], [28, 'middle'], [64, 'middle'], [124, 'end'], [128, 'start']].forEach(([o, a]) => {
    s('text', { x: xo(o) + (a === 'end' ? 4 : a === 'start' ? -4 : 0), y: LY + 34, 'text-anchor': a }, W, String(o));
  });
  s('text', { x: xo(62), y: LY + 12, 'text-anchor': 'middle', class: 't-ok t-sm t-bold' }, W, 'one 16-bit ldr: 0, 4, 8 … 124 bytes');
  s('text', { x: xo(140) + 6, y: LY + 12, class: 't-bad t-sm t-bold' }, W, 'add first');
  s('text', { x: 0, y: LY + 64, class: 't-sm' }, W, 'offset in bytes from r4 · a Cortex-M3/M4 32-bit ldr reaches up to 4095');
  const OPTS = [['A', 0x1C], ['B', 0x7C], ['C', 0x80], ['D', 0x40]];
  const marks = OPTS.map(([k, o]) => {
    const c = s('circle', { cx: xo(o), cy: LY - 14, r: 8.5, class: 'f-surface box' }, W);
    const t = s('text', { x: xo(o), y: LY - 14, dy: '0.35em', 'text-anchor': 'middle', class: 't-fg t-bold' }, W, k);
    return { c, t };
  });

  const note = role('enc-note');
  steps(viz('enc-steps'), OPTS.map(([k, o]) => `${k} · 0x${o.toString(16).toUpperCase()}`), k => {
    const [key, off] = OPTS[k], w = off / 4, fits = w <= 31;
    const enc = fits ? (0b01101 << 11) | (w << 6) | (4 << 3) : null;
    const bits = fits ? enc.toString(2).padStart(16, '0') : '01101?????100000';
    cells.forEach((c, i) => {
      const b = bits[i], inF = i >= 5 && i < 10;
      c.r.setAttribute('class', b === '?' ? 'f-bad-soft' : b === '1' ? (inF ? 'f-pri' : 'f-fg') : (inF ? 'f-pri-soft' : 'f-seg'));
      c.t.setAttribute('class', b === '?' ? 't-bad t-bold' : b === '1' ? 't-on t-bold' : inF ? 't-pri' : 't-muted');
      c.t.textContent = b;
    });
    encT.textContent = fits ? '0x' + enc.toString(16).toUpperCase() + ' · 16 bits' : 'no 16-bit encoding';
    under.textContent = '';
    const wb = w.toString(2);
    wb.split('').forEach((b, i) => {
      const col = 10 - wb.length + i, out = col < 5;
      s('rect', { x: X0 + col * CW, y: 74, width: CW - 2, height: 26, rx: 2, class: out ? 'f-bad' : fits ? 'f-pri-soft' : 'f-bad-soft' }, under);
      s('text', { x: X0 + col * CW + (CW - 2) / 2, y: 87, dy: '0.35em', 'text-anchor': 'middle', class: out ? 't-on t-bold' : fits ? 't-pri' : 't-bad' }, under, b);
    });
    s('text', { x: X0 + 10 * CW + 8, y: 87, dy: '0.35em', class: (fits ? 't-pri' : 't-bad') + ' t-bold' }, under, `${off} ÷ 4 = ${w} = ${wb}₂` + (fits ? '' : ': 6 bits'));
    if (!fits) s('text', { x: X0 + 4 * CW + (CW - 2) / 2, y: 116, 'text-anchor': 'middle', class: 't-bad t-sm' }, under, 'no room');
    marks.forEach((m, i) => {
      const on = i === k;
      m.c.setAttribute('class', on ? (fits ? 'f-pri' : 'f-bad') : 'f-surface box');
      m.t.setAttribute('class', (on ? 't-on' : 't-fg') + ' t-bold');
    });
    note.textContent = fits
      ? `${key} · 0x${off.toString(16).toUpperCase()} = ${off} bytes = ${w} words. ${w} fits in the 5-bit field (${wb.padStart(5, '0')}), so the load is one 16-bit instruction, 0x${enc.toString(16).toUpperCase()}.` + (off === 124 ? ' 31 is the largest 5-bit value, so 124 is the farthest field a 16-bit ldr reaches.' : '')
      : `${key} · 0x80 = 128 bytes = 32 words. 32 is 100000 in binary, six bits, one more than the field has. The compiler first moves the base with an add, then loads with a small offset. A Cortex-M4 has a 32-bit ldr whose offset field reaches 4095.`;
  }, 2);
});
