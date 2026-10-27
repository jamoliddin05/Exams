QV.register('s3-mc9', function (q) {
  const { s, svg, box, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);

  // Figure 1: the two boot chains
  const C = svg(viz('chain'), 800, 210, { label: 'PC boot chain: CPU fixed address, firmware, bootloader, kernel, your program, four handoffs. This chip: CPU loads SP and PC, then Reset_Handler and your code, one link', minWidth: 560 });
  const chainRow = (y, items) => {
    let x = 70;
    items.forEach((it, i) => {
      box(C, x, y, it.w, 46, it.t, { cls: it.f, textCls: 't-on t-sm', lh: 13 });
      if (i < items.length - 1) {
        const nx = x + it.w + it.gap;
        arrow(C, x + it.w + 2, y + 23, nx - 2, y + 23, { cls: it.hand ? 'a-sec' : 'a-muted', width: it.hand ? 2 : 1.5 });
        if (it.hand) s('text', { x: x + it.w + it.gap / 2, y: y + 13, 'text-anchor': 'middle', class: 't-sec t-bold' }, C, it.hand);
        x = nx;
      }
    });
  };
  s('text', { x: 0, y: 43, class: 't-fg t-bold' }, C, 'PC');
  chainRow(20, [
    { t: 'CPU starts at\na fixed address', f: 'f-ter', w: 112, gap: 34, hand: '1' },
    { t: 'firmware', f: 'f-sec', w: 112, gap: 34, hand: '2' },
    { t: 'bootloader', f: 'f-sec', w: 112, gap: 34, hand: '3' },
    { t: 'kernel', f: 'f-sec', w: 112, gap: 34, hand: '4' },
    { t: 'your program', f: 'f-pri', w: 112 },
  ]);
  s('text', { x: 70, y: 86, class: 't-sec' }, C, 'four handoffs, several seconds');
  s('text', { x: 0, y: 157, class: 't-fg t-bold' }, C, 'this chip');
  chainRow(134, [
    { t: 'CPU loads SP, PC\nfrom flash words 0, 1', f: 'f-ter', w: 150, gap: 34, hand: '1' },
    { t: 'Reset_Handler', f: 'f-pri', w: 112, gap: 30 },
    { t: 'copy .data\nzero .bss', f: 'f-pri', w: 104, gap: 30 },
    { t: 'SystemInit', f: 'f-pri', w: 104, gap: 30 },
    { t: 'main()', f: 'f-pri', w: 100 },
  ]);
  s('path', { d: 'M254 126 V120 H764 V126', class: 's-pri' }, C);
  s('text', { x: 509, y: 114, 'text-anchor': 'middle', class: 't-pri' }, C, 'code you can read: Reset_Handler calls the rest');
  s('text', { x: 70, y: 200, class: 't-pri' }, C, 'one link: two words, then your code');

  // Figure 2: word 0 and word 1 of flash into SP and PC
  const W = svg(viz('words'), 780, 212, { label: 'Flash word 0 at 0x08000000 holds 0x20003000 and goes to SP; word 1 at 0x08000004 holds 0x08000275 and goes to PC as 0x08000274 with the Thumb bit', minWidth: 560 });
  const FX = 112, FW = 150, RY = [40, 86, 132], RH = 38;
  s('text', { x: FX + FW / 2, y: 24, 'text-anchor': 'middle', class: 't-fg t-bold' }, W, 'flash');
  s('text', { x: 520, y: 24, 'text-anchor': 'middle', class: 't-fg t-bold' }, W, 'CPU registers after reset');
  [['0x08000000', '0x20003000', 'word 0', 'f-pri'], ['0x08000004', '0x08000275', 'word 1', 'f-pri'], ['0x08000008', '…', 'more vectors', 'f-seg']].forEach(([a, v, w, f], i) => {
    const y = RY[i];
    s('text', { x: FX - 8, y: y + RH / 2, dy: '0.35em', 'text-anchor': 'end', class: 't-sm' }, W, a);
    s('rect', { x: FX, y, width: FW, height: RH, class: f + ' sep' }, W);
    s('text', { x: FX + FW / 2, y: y + 14, dy: '0.35em', 'text-anchor': 'middle', class: (f === 'f-pri' ? 't-on' : 't-muted') + ' t-bold' }, W, v);
    s('text', { x: FX + FW / 2, y: y + 29, dy: '0.35em', 'text-anchor': 'middle', class: (f === 'f-pri' ? 't-on' : 't-muted') + ' t-sm' }, W, w);
  });
  arrow(W, FX + FW + 4, RY[0] + RH / 2, 440, RY[0] + RH / 2, { cls: 'a-pri', width: 2, label: 'into SP', labelCls: 't-pri t-sm' });
  arrow(W, FX + FW + 4, RY[1] + RH / 2, 440, RY[1] + RH / 2, { cls: 'a-pri', width: 2, label: 'into PC, bit 0 → T', labelCls: 't-pri t-sm' });
  box(W, 440, RY[0], 160, RH, 'SP = 0x20003000', { cls: 'f-surface', textCls: 't-fg t-bold' });
  box(W, 440, RY[1], 160, RH, 'PC = 0x08000274', { cls: 'f-surface', textCls: 't-fg t-bold' });
  s('text', { x: 610, y: RY[0] + 14, class: 't-fg' }, W, 'top of 12 KB RAM');
  s('text', { x: 610, y: RY[0] + 30, class: 't-sm' }, W, 'a value, not code');
  s('text', { x: 610, y: RY[1] + 14, class: 't-fg' }, W, 'Reset_Handler');
  s('text', { x: 610, y: RY[1] + 30, class: 't-sm' }, W, 'first instruction run');
  s('text', { x: 0, y: 196, class: 't-fg' }, W, '0x08000275: low byte 0x75 = 0111 0101₂, bit 0 = 1 is the Thumb bit, so the code starts at 0x08000274.');
});

QV.register('s3-mc10', function (q) {
  const { s, svg, arrow, steps } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);

  const W = svg(viz('when'), 800, 248, { label: 'Four moments: build, writing the hex, reset, run. Option A claims build, D writing, B reset, C run. Only build is where this chip binds', minWidth: 560 });
  const X0 = 110, CW = 166, CG = 6;
  const cx = c => X0 + c * (CW + CG);
  const HEAD = ['build: locate', 'write hex to flash', 'reset: Reset_Handler', 'run'];
  const CLAIM = [['A', 'bound by locate,', 'fixed in the image'], ['D', 'programmer picks', 'a free RAM address'], ['B', 'Reset_Handler picks', 'a new .data base'], ['C', 'an MMU maps it', 'per board']];
  const REAL = [
    ['locate: .data at', '0x20000000, written into', 'the code that uses it'],
    ['bytes copied as they', 'are, to the addresses', 'in the records'],
    ['copies .data values', 'to 0x20000000, the', 'address locate chose'],
    ['ldr uses 0x20000000', 'directly: no MMU,', 'the real SRAM word'],
  ];
  HEAD.forEach((h, c) => s('text', { x: cx(c) + CW / 2, y: 16, 'text-anchor': 'middle', class: 't-fg t-bold' }, W, h));
  arrow(W, X0, 28, cx(3) + CW, 28, { cls: 'a-muted' });
  [['option', 'claims', 62], ['what this', 'chip does', 140], ['in flash', '', 212]].forEach(([a, b, y]) => {
    s('text', { x: 0, y, class: 't-fg t-bold' }, W, a);
    if (b) s('text', { x: 0, y: y + 15, class: 't-fg t-bold' }, W, b);
  });
  const claimRects = [], cols = [];
  CLAIM.forEach(([k, l1, l2], c) => {
    const g = s('g', { class: 'fade' }, W), x = cx(c);
    cols.push(g);
    claimRects.push(s('rect', { x, y: 40, width: CW, height: 54, rx: 4, class: 'f-seg' }, g));
    s('circle', { cx: x + 18, cy: 67, r: 11, class: k === 'A' ? 'f-ok' : 'f-bad' }, g);
    s('text', { x: x + 18, y: 67, dy: '0.35em', 'text-anchor': 'middle', class: 't-on t-bold' }, g, k);
    s('text', { x: x + 36, y: 62, class: 't-fg t-sm' }, g, l1);
    s('text', { x: x + 36, y: 77, class: 't-fg t-sm' }, g, l2);
    s('rect', { x, y: 108, width: CW, height: 70, rx: 4, class: c === 0 ? 'f-pri' : 'f-surface box' }, g);
    REAL[c].forEach((l, i) => s('text', { x: x + 8, y: 127 + i * 16, class: (c === 0 ? 't-on' : 't-fg') + ' t-sm' }, g, l));
  });
  s('rect', { x: X0, y: 194, width: cx(3) + CW - X0, height: 34, rx: 4, class: 'f-pri-soft' }, W);
  s('text', { x: X0 + 10, y: 211, dy: '0.35em', class: 't-pri t-bold' }, W, 'literal bytes 00 00 00 20 = 0x20000000: the same on every board and every run');

  const NOTES = [
    'All four claims. Only the first moment, build, is where this chip binds. The other three moments exist, but none of them changes an address.',
    'A: correct. Locate places <code>.data</code> at <code>0x20000000</code> and writes that address into every instruction sequence that uses <code>SystemCoreClock</code>. From then on it is just bytes in the image.',
    'B: load-time binding would need a loader that picks a base and patches addresses. <code>Reset_Handler</code> only copies the initial values to the addresses already chosen.',
    'C: run-time binding needs an MMU to translate every access. This chip has none, so <code>0x20000000</code> on the bus is the SRAM word itself.',
    'D: the programmer writes each record\'s bytes to the address the record states. The RAM layout was settled before the hex file existed.',
  ];
  const COL = [null, 0, 2, 3, 1];
  const note = role('when-note');
  steps(viz('when-steps'), ['All', 'A', 'B', 'C', 'D'], k => {
    cols.forEach((g, c) => g.classList.toggle('dim', k > 0 && c !== COL[k]));
    claimRects.forEach((r, c) => r.setAttribute('class', k === 0 || c === COL[k] ? (c === 0 ? 'f-ok-soft' : 'f-bad-soft') : 'f-seg'));
    note.innerHTML = NOTES[k];
  });
});

QV.register('s3-mc11', function (q) {
  const { s, svg, slider, scale, fmt } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);

  const W = svg(viz('len'), 780, 182, { label: 'Address line from 0x20000000 to 0x20004000: real SRAM ends at 0x20003000, the linker region ends at the chosen LENGTH, where the initial SP sits', minWidth: 560 });
  const x = scale(0, 16, 110, 750);
  const R1 = 26, R2 = 80, RH = 30, AX = 150;
  s('text', { x: 0, y: R1 + RH / 2, dy: '0.35em', class: 't-fg t-bold' }, W, 'chip SRAM');
  s('text', { x: 0, y: R2 + RH / 2, dy: '0.35em', class: 't-fg t-bold' }, W, 'link.ld RAM');
  s('rect', { x: x(0), y: R1, width: x(12) - x(0), height: RH, class: 'f-pri-soft' }, W);
  s('text', { x: (x(0) + x(12)) / 2, y: R1 + RH / 2, dy: '0.35em', 'text-anchor': 'middle', class: 't-pri t-bold' }, W, 'real SRAM: 0x20000000 to 0x20002FFF');
  s('rect', { x: x(12), y: R1, width: x(16) - x(12), height: RH, class: 'f-bad' }, W);
  s('text', { x: (x(12) + x(16)) / 2, y: R1 + RH / 2, dy: '0.35em', 'text-anchor': 'middle', class: 't-on t-bold' }, W, 'no memory');
  s('line', { x1: x(0), x2: x(16), y1: AX, y2: AX, class: 'l-axis' }, W);
  [0, 4, 8, 12, 16].forEach(k => {
    s('line', { x1: x(k), x2: x(k), y1: AX, y2: AX + 5, class: 'l-axis' }, W);
    s('text', { x: x(k), y: AX + 18, 'text-anchor': k === 16 ? 'end' : k === 0 ? 'start' : 'middle', class: k === 12 ? 't-fg t-bold' : null }, W, '0x2000' + (k * 1024).toString(16).toUpperCase().padStart(4, '0'));
  });
  const layer = s('g', {}, W);
  const hex = n => '0x' + n.toString(16).toUpperCase();

  slider(viz('len-slider'), { label: 'LENGTH', min: 4, max: 16, step: 1, value: 16, fmt: v => v + 'K' }, L => {
    layer.textContent = '';
    const bytes = L * 1024, sp = 0x20000000 + bytes, bad = L > 12;
    s('rect', { x: x(0), y: R2, width: x(L) - x(0), height: RH, class: 'f-seg' }, layer);
    s('rect', { x: x(0), y: R2, width: x(L) - x(0), height: RH, class: 'f-none ' + (bad ? 's-bad' : 's-pri'), style: 'stroke-width: 1.5' }, layer);
    s('text', { x: x(0) + 8, y: R2 + RH / 2, dy: '0.35em', class: 't-fg' }, layer, `LENGTH ${L}K`);
    s('line', { x1: x(L), x2: x(L), y1: R2 - 10, y2: AX, class: bad ? 's-bad' : 's-ok', style: 'stroke-width: 2.5' }, layer);
    s('polygon', { points: `${x(L) - 6},${R2 - 10} ${x(L) + 6},${R2 - 10} ${x(L)},${R2 - 2}`, class: bad ? 'f-bad' : 'f-ok' }, layer);
    const right = L >= 8;
    s('text', { x: x(L) + (right ? -6 : 6), y: R2 + RH + 15, 'text-anchor': right ? 'end' : 'start', class: (bad ? 't-bad' : 't-ok') + ' t-bold' }, layer, 'initial SP = ' + hex(sp) + ', stack grows down');
    role('len-hex').textContent = hex(bytes);
    role('sp').textContent = hex(sp);
    role('pct').textContent = fmt(2000 / bytes * 100, 2) + '%';
    let v;
    if (bad) v = `<b>${L}K</b> is ${L - 12} KB more than the chip has. The build succeeds and reports only ${fmt(2000 / bytes * 100, 2)}% of RAM used. SP starts at <b>${hex(sp)}</b>, above the last real byte <b>0x20002FFF</b>, so the first push writes to memory that does not exist.`;
    else if (L === 12) v = '<b>12K</b> matches the datasheet. SP starts at <b>0x20003000</b>, one past the last RAM byte, and the first push stores just below it. The report says 16.28%, the slide\'s figure.';
    else v = `<b>${L}K</b> is smaller than the real RAM. The program runs as long as it fits, but the top ${12 - L} KB of SRAM is never used.`;
    role('len-verdict').innerHTML = v;
  });
});
