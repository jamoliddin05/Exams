QV.register('s1-mc15', function (q) {
  const { s, svg, steps, box } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const BYTES = [0x00, 0x30, 0x00, 0x20, 0x1D, 0x02, 0x00, 0x08];
  const hx = (v, n) => v.toString(16).toUpperCase().padStart(n, '0');
  const word = k => BYTES.slice(4 * k, 4 * k + 4).reduce((a, b, i) => a + b * 2 ** (8 * i), 0);
  const W = [word(0), word(1)];

  // Figure 1: memory order on top, value order below, little-endian as crossing lines
  const g = svg(viz('bytes'), 760, 312, { label: 'The bytes 00 30 00 20 1D 02 00 08 regrouped little-endian into SP = 0x20003000 and PC = 0x0800021D; the Thumb bit puts Reset_Handler at 0x0800021C', minWidth: 560 });
  const C = { x0: 130, pitch: 70, cw: 62, split: 26, y1: 44, y2: 140, h: 34 };
  const cx = i => C.x0 + i * C.pitch + (i >= 4 ? C.split : 0);
  const mid = k => (cx(4 * k) + cx(4 * k + 3) + C.cw) / 2;
  const tone = ['pri', 'sec'];
  s('text', { x: C.x0, y: 16, class: 't-fg t-bold' }, g, 'bytes in FLASH at 0x08000000 + offset, lowest address first');
  s('text', { x: 8, y: C.y1 + C.h / 2, dy: '0.35em', class: 't-fg t-bold' }, g, 'memory');
  s('text', { x: 8, y: C.y2 + C.h / 2 - 7, dy: '0.35em', class: 't-fg t-bold' }, g, '32-bit value');
  s('text', { x: 8, y: C.y2 + C.h / 2 + 8, dy: '0.35em', class: 't-sm' }, g, 'high byte left');
  const byteG = [0, 1].map(() => s('g', { class: 'fade' }, g));
  const wordG = [0, 1].map(() => s('g', { class: 'fade' }, g));
  const thumbG = s('g', { class: 'fade' }, g);
  BYTES.forEach((b, i) => {
    const k = i >> 2, x = cx(i);
    s('text', { x: x + C.cw / 2, y: C.y1 - 8, 'text-anchor': 'middle', class: 't-sm' }, byteG[k], '+' + i);
    s('rect', { x, y: C.y1, width: C.cw, height: C.h, rx: 4, class: `f-${tone[k]}-soft` }, byteG[k]);
    s('text', { x: x + C.cw / 2, y: C.y1 + C.h / 2, dy: '0.35em', 'text-anchor': 'middle', class: `t-${tone[k]} t-bold t-lg` }, byteG[k], hx(b, 2));
  });
  [0, 1].forEach(k => {
    const wg = wordG[k];
    for (let m = 0; m < 4; m++) {
      const from = 4 * k + m, to = 4 * k + 3 - m;
      s('line', { x1: cx(from) + C.cw / 2, y1: C.y1 + C.h, x2: cx(to) + C.cw / 2, y2: C.y2, class: `s-${tone[k]}`, style: 'stroke-width: 1.5' }, wg);
      s('rect', { x: cx(to), y: C.y2, width: C.cw, height: C.h, rx: 4, class: `f-${tone[k]}` }, wg);
      s('text', { x: cx(to) + C.cw / 2, y: C.y2 + C.h / 2, dy: '0.35em', 'text-anchor': 'middle', class: 't-on t-bold t-lg' }, wg, hx(BYTES[from], 2));
    }
    s('text', { x: mid(k), y: 200, 'text-anchor': 'middle', class: `t-${tone[k]} t-bold t-lg` }, wg, `word ${k} = 0x${hx(W[k], 8)}`);
    s('text', { x: mid(k), y: 220, 'text-anchor': 'middle', class: `t-${tone[k]}` }, wg, k === 0 ? 'the core loads it into SP' : 'the core loads it into PC');
  });
  box(wordG[0], cx(0), 240, cx(3) + C.cw - cx(0), 52, '0x20000000 + 12 KB (0x3000)\n= _estack, the top of RAM', { cls: 'f-pri-soft', textCls: 't-pri', stroke: 'outline-pri', lh: 16 });
  box(thumbG, cx(4), 240, cx(7) + C.cw - cx(4), 52, `0x${hx(W[1], 8)} = 0x${hx(W[1] - 1, 8)} + T bit\nReset_Handler starts at 0x${hx(W[1] - 1, 8)}`, { cls: 'f-ok-soft', textCls: 't-ok', stroke: 'box', lh: 16 });

  const NOTES = [
    'All four steps. The core reads two words from the start of FLASH before it runs any instruction. Each word is stored lowest byte first.',
    'The image stores bytes at increasing addresses: 00 30 00 20 at 0x08000000 to 0x08000003, then 1D 02 00 08 at 0x08000004 to 0x08000007.',
    'Word 0. ARM is little-endian, so the byte at the lowest address is the least significant. Read 00 30 00 20 right to left: 0x20003000, the top of the 12 KB RAM. The core loads it into SP.',
    'Word 1. Read 1D 02 00 08 right to left: 0x0800021D. The core loads it into PC. This is the reset vector, the address of Reset_Handler.',
    'Bit 0 of 0x0800021D is 1. It is the Thumb bit, which says "this target is Thumb code", so the first instruction of Reset_Handler is at 0x0800021C. An even entry here faults on the first instruction.',
  ];
  const BRIGHT = [null, [byteG[0], byteG[1]], [byteG[0], wordG[0]], [byteG[1], wordG[1]], [byteG[1], wordG[1], thumbG]];
  const all = [...byteG, ...wordG, thumbG];
  steps(viz('steps'), ['All', '1 · bytes', '2 · word 0 → SP', '3 · word 1 → PC', '4 · Thumb bit'], k => {
    all.forEach(el => el.classList.toggle('dim', !!BRIGHT[k] && BRIGHT[k].indexOf(el) < 0));
    role('note').textContent = NOTES[k];
  });

  // Figure 2: bits of the real address and of the table entry
  const b = svg(viz('bits'), 760, 164, { label: 'Bits of 0x0800021C, the address nm reports, and of 0x0800021D, the table entry: they differ only in bit 0, the Thumb bit', minWidth: 560 });
  const X = { x0: 170, cw: 15, pitch: 16, nib: 4, h: 24 };
  const bx = bit => { const col = 31 - bit; return X.x0 + col * X.pitch + Math.floor(col / 4) * X.nib; };
  [31, 24, 16, 8, 1, 0].forEach(bit => s('text', { x: bx(bit) + X.cw / 2, y: 36, 'text-anchor': 'middle', class: 't-sm' }, b, String(bit)));
  [['nm: Reset_Handler', W[1] - 1, 44, 80], ['vector table, word 1', W[1], 92, 128]].forEach(([name, v, y, hy]) => {
    s('text', { x: 8, y: y + 7, dy: '0.35em', class: 't-fg t-bold' }, b, name);
    s('text', { x: 8, y: y + 20, dy: '0.35em', class: 't-sm' }, b, '0x' + hx(v, 8));
    for (let bit = 31; bit >= 0; bit--) {
      const on = Math.floor(v / 2 ** bit) % 2 === 1, t = bit === 0 && on;
      s('rect', { x: bx(bit), y, width: X.cw, height: X.h, rx: 2, class: t ? 'f-sec' : on ? 'f-pri' : 'f-seg' }, b);
      s('text', { x: bx(bit) + X.cw / 2, y: y + X.h / 2, dy: '0.35em', 'text-anchor': 'middle', class: (on ? 't-on' : 't-muted') + ' t-sm' }, b, on ? '1' : '0');
    }
    for (let n = 7; n >= 0; n--) {
      const x = (bx(4 * n + 3) + bx(4 * n) + X.cw) / 2, d = Math.floor(v / 16 ** n) % 16;
      s('text', { x, y: hy, 'text-anchor': 'middle', class: n === 0 ? 't-fg t-bold' : 't-muted' }, b, d.toString(16).toUpperCase());
    }
  });
  s('rect', { x: bx(0) - 3, y: 41, width: X.cw + 6, height: 78, rx: 4, class: 'f-none outline-sec' }, b);
  s('path', { d: `M${bx(31)} 140 V146 H${bx(1) + X.cw} V140`, class: 's-muted' }, b);
  s('text', { x: (bx(31) + bx(1) + X.cw) / 2, y: 158, 'text-anchor': 'middle', class: 't-fg' }, b, 'bits 31:1, the address, identical in both rows');
  s('text', { x: bx(0) + X.cw / 2, y: 158, 'text-anchor': 'middle', class: 't-sec t-bold' }, b, 'T');
});

QV.register('s1-mc16', function (q) {
  const { s, svg, steps, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);

  // Figure 1: symbol table on the left, RAM on the right, rows aligned so the arrows are horizontal
  const g = svg(viz('sym'), 760, 254, { label: 'Linker symbols _sdata and _edata hold the addresses 0x20000000 and 0x20000064; RAM at those addresses holds unrelated contents', minWidth: 560 });
  const R = { ys: 40, ye: 168, h: 30, sx: 20, sw: 250, ax: 440, aw: 120, cx: 564, cw: 180 };
  s('text', { x: R.sx, y: 22, class: 't-fg t-bold' }, g, 'symbols made by link.ld');
  s('text', { x: R.ax, y: 22, class: 't-fg t-bold' }, g, 'RAM: address');
  s('text', { x: R.cx, y: 22, class: 't-fg t-bold' }, g, 'contents (example)');
  const symRow = (y, name, val) => {
    s('rect', { x: R.sx, y, width: R.sw, height: R.h, rx: 4, class: 'f-surface box' }, g);
    s('text', { x: R.sx + 12, y: y + R.h / 2, dy: '0.35em', class: 't-fg t-bold' }, g, name);
    return s('text', { x: R.sx + R.sw - 12, y: y + R.h / 2, dy: '0.35em', 'text-anchor': 'end', class: 't-fg' }, g, val);
  };
  const symS = symRow(R.ys, '_sdata', '= 0x20000000');
  const symE = symRow(R.ye, '_edata', '= 0x20000064');
  s('text', { x: R.sx, y: 108, class: 't-sm' }, g, 'no storage behind these names:');
  s('text', { x: R.sx, y: 122, class: 't-sm' }, g, 'each value is an address');
  const ROWS = [
    [R.ys, '0x20000000', '0x00C0FFEE', true],
    [R.ys + 34, '0x20000004', '…', true],
    [R.ye - 34, '0x20000060', '…', true],
    [R.ye, '0x20000064', '0x00000000', false],
  ];
  const addrCells = {}, contCells = {};
  ROWS.forEach(([y, a, c, data]) => {
    const ar = s('rect', { x: R.ax, y, width: R.aw, height: R.h, rx: 3, class: 'f-seg' }, g);
    const at = s('text', { x: R.ax + R.aw / 2, y: y + R.h / 2, dy: '0.35em', 'text-anchor': 'middle', class: 't-fg' }, g, a);
    const cr = s('rect', { x: R.cx, y, width: R.cw, height: R.h, rx: 3, class: data ? 'f-pri-soft' : 'f-seg' }, g);
    const ct = s('text', { x: R.cx + R.cw / 2, y: y + R.h / 2, dy: '0.35em', 'text-anchor': 'middle', class: data ? 't-pri' : 't-fg' }, g, c);
    addrCells[y] = [ar, at];
    contCells[y] = [cr, ct, data];
  });
  s('text', { x: R.cx + R.cw / 2, y: (R.ys + 34 + R.h + R.ye - 34) / 2, dy: '0.35em', 'text-anchor': 'middle', class: 't-pri t-sm' }, g, '⋮  .data: 25 words, 100 bytes');
  s('text', { x: R.cx, y: R.ye + R.h + 14, class: 't-sm' }, g, 'first word after .data');
  const layer = s('g', {}, g);
  const result = s('text', { x: R.sx, y: 242, class: 't-bold t-lg' }, g, '');

  const OPT = [
    { mode: 'load', res: 'n = 0xFF3F0012, garbage', ok: false,
      note: 'A, _edata - _sdata. Without &, each name stands for the word stored at its address, so the CPU loads both words and subtracts the contents. It compiles cleanly.',
      calc: '_edata   → load [0x20000064] = 0x00000000   (example contents)\n_sdata   → load [0x20000000] = 0x00C0FFEE\nn = 0x00000000 − 0x00C0FFEE = 0xFF3F0012   garbage, mod 2³²' },
    { mode: 'addr', res: 'n = 25, words, not bytes', ok: false,
      note: 'B, &_edata - &_sdata. The addresses are right, but both are uint32_t pointers, and pointer subtraction counts elements: 100 bytes / 4 bytes per element = 25.',
      calc: '&_edata = 0x20000064\n&_sdata = 0x20000000\nn = (0x20000064 − 0x20000000) / sizeof(uint32_t) = 100 / 4 = 25' },
    { mode: 'addr', res: 'n = 100 bytes', ok: true,
      note: 'C. Both addresses become integers first, then they are subtracted. No memory is read. 0x20000064 − 0x20000000 = 0x64 = 100 bytes.',
      calc: '(uintptr_t)&_edata = 0x20000064\n(uintptr_t)&_sdata = 0x20000000\nn = 0x20000064 − 0x20000000 = 0x64 = 100 bytes' },
    { mode: 'load', res: 'n = 0xFF3F0012, garbage', ok: false,
      note: 'D, (uintptr_t)_edata - (uintptr_t)_sdata. The cast applies to the value that was read, so the CPU still loads the two words, exactly as in A.',
      calc: '(uintptr_t)_edata → load [0x20000064] = 0x00000000   (example contents)\n(uintptr_t)_sdata → load [0x20000000] = 0x00C0FFEE\nn = 0x00000000 − 0x00C0FFEE = 0xFF3F0012   garbage, mod 2³²' },
  ];

  steps(viz('steps'), ['A', 'B', 'C', 'D'], k => {
    const o = OPT[k], load = o.mode === 'load';
    layer.textContent = '';
    [R.ys, R.ye].forEach(y => {
      const [ar, at] = addrCells[y], [cr, ct, data] = contCells[y];
      arrow(layer, R.sx + R.sw + 4, y + R.h / 2, R.ax - 4, y + R.h / 2, { cls: load ? 'a-muted' : 'a-ok', width: 2, label: load ? 'value = address' : '&: the address', labelCls: load ? 't-muted' : 't-ok' });
      ar.setAttribute('class', load ? 'f-seg' : 'f-ok-soft');
      at.setAttribute('class', load ? 't-fg' : 't-ok t-bold');
      cr.setAttribute('class', load ? 'f-bad-soft' : (data ? 'f-pri-soft' : 'f-seg'));
      ct.setAttribute('class', load ? 't-bad t-bold' : (data ? 't-pri' : 't-fg'));
      if (load) arrow(layer, R.ax + R.aw - 18, y + R.h / 2, R.cx + 16, y + R.h / 2, { cls: 'a-bad', width: 2, label: 'load', labelCls: 't-bad' });
    });
    [symS, symE].forEach(t => t.setAttribute('class', load ? 't-fg' : 't-ok t-bold'));
    result.textContent = (k === 0 ? 'A' : k === 1 ? 'B' : k === 2 ? 'C' : 'D') + ': ' + o.res;
    result.setAttribute('class', 't-bold t-lg ' + (o.ok ? 't-ok' : 't-bad'));
    role('note').textContent = o.note;
    role('calc').textContent = o.calc;
  }, 2);
});

QV.register('s1-mc17', function (q) {
  const { s, svg, steps } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);

  // Figure 1: two step traces over the lines of SystemInit(); red where 48 MHz meets 0 wait states
  const g = svg(viz('timeline'), 760, 276, { label: 'CPU clock and flash wait states line by line through SystemInit, for the slide order, the swapped order and the way back down', minWidth: 580 });
  const T = { x0: 110, x1: 744, ex: i => 176 + i * 130, clk: [86, 50], ws: [172, 136], top: 40, bot: 184 };
  s('text', { x: T.x0, y: 26, class: 't-pri t-bold' }, g, 'CPU clock');
  s('text', { x: T.x0, y: 114, class: 't-sec t-bold' }, g, 'flash wait states (FLASH->ACR LATENCY)');
  [['48 MHz', T.clk[1]], ['12 MHz', T.clk[0]], ['1 WS', T.ws[1]], ['0 WS', T.ws[0]]].forEach(([t, y]) => s('text', { x: 98, y, dy: '0.35em', 'text-anchor': 'end' }, g, t));
  [T.clk, T.ws].forEach(([lo, hi]) => [lo, hi].forEach(y => s('line', { x1: T.x0, x2: T.x1, y1: y, y2: y, class: 'l-grid' }, g)));
  const layer = s('g', {}, g);

  const SC = [
    { start: [0, 0], clkAt: 2, wsAt: 0, lines: [['LATENCY = 1', 'one wait state'], ['wait until', 'LATENCY reads 1'], ['HSIDIV = ÷1', '48 MHz'], ['wait until', 'HSIRDY'], ['SystemCoreClock', '= 48000000']],
      verdict: ['Never 48 MHz with 0 wait states: safe', 't-ok'],
      note: 'Slide 16\'s order. LATENCY goes to 1 and is read back first. Only then does HSIDIV drop to ÷1, so the clock never runs at 48 MHz with 0 wait states.' },
    { start: [0, 0], clkAt: 0, wsAt: 2, lines: [['HSIDIV = ÷1', '48 MHz'], ['wait until', 'HSIRDY'], ['LATENCY = 1', 'one wait state'], ['wait until', 'LATENCY reads 1'], ['SystemCoreClock', '= 48000000']],
      verdict: ['48 MHz with 0 wait states from the HSIDIV write until LATENCY = 1', 't-bad'],
      note: 'The swapped order. From the HSIDIV write until LATENCY = 1 takes effect, the CPU runs at 48 MHz with 0 wait states. The HSIRDY loop and the FLASH->ACR write are fetched from flash inside that window, so a fetch can come back before it is ready, and the part hangs with no error.' },
    { start: [1, 1], clkAt: 0, wsAt: 1, lines: [['HSIDIV = ÷4', '12 MHz'], ['LATENCY = 0', 'no wait state'], ['wait until', 'LATENCY reads 0'], ['SystemCoreClock', '= 12000000']],
      verdict: ['12 MHz with 1 wait state is only slower: safe', 't-ok'],
      note: 'Going back down, the order reverses: lower the frequency first, then remove the wait state. In between the chip runs at 12 MHz with a wait state it no longer needs, which is slower and never unsafe.' },
  ];

  steps(viz('steps'), ['Slide 16 order', 'Swapped order', 'Back down to 12 MHz'], k => {
    const sc = SC[k];
    layer.textContent = '';
    const xc = T.ex(sc.clkAt), xw = T.ex(sc.wsAt);
    const clkEnd = 1 - sc.start[0], wsEnd = 1 - sc.start[1];
    if (sc.start[0] === 0 && sc.start[1] === 0 && xc < xw) {
      [[T.top, 96], [124, T.bot]].forEach(([y0, y1]) => s('rect', { x: xc, y: y0, width: xw - xc, height: y1 - y0, class: 'f-bad-soft' }, layer));
      s('text', { x: (xc + xw) / 2, y: 68, dy: '0.35em', 'text-anchor': 'middle', class: 't-bad t-bold halo' }, layer, 'fetches may not be ready');
    }
    sc.lines.forEach(([a, b], i) => {
      const x = T.ex(i);
      [[T.top - 4, 96], [124, T.bot + 4]].forEach(([y1, y2]) => s('line', { x1: x, x2: x, y1, y2, class: 's-muted dash', style: 'stroke-width: 1; opacity: 0.6' }, layer));
      s('text', { x, y: 204, 'text-anchor': 'middle', class: 't-fg t-bold' }, layer, a);
      s('text', { x, y: 219, 'text-anchor': 'middle', class: 't-sm' }, layer, b);
    });
    const trace = (lv, from, to, at, cls) => {
      s('path', { d: `M${T.x0} ${lv[from]} H${at} V${lv[to]} H${T.x1}`, class: cls }, layer);
    };
    trace(T.clk, sc.start[0], clkEnd, xc, 's-pri');
    trace(T.ws, sc.start[1], wsEnd, xw, 's-sec');
    s('text', { x: T.x0, y: 258, class: 't-bold ' + sc.verdict[1] }, layer, sc.verdict[0]);
    role('note').textContent = sc.note;
  }, 1);
});
