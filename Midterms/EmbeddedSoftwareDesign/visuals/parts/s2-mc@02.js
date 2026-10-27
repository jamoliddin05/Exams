QV.register('s2-mc9', function (q) {
  const { s, svg, box, arrow, steps } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);

  const DEF = 'uint32_t SystemCoreClock = 12000000;';
  const EXT = 'extern uint32_t SystemCoreClock;';
  const OPT = {
    A: { h: 'nothing about SystemCoreClock', st: [DEF, 'SystemCoreClock = …;  sets it'], mn: [DEF, '… = SystemCoreClock;  reads it'], sd: 1, sn: 0, md: 1, mn2: 0, v: ['multiple definition of SystemCoreClock', 'bad'] },
    B: { h: EXT, st: [EXT + '  (pasted)', 'SystemCoreClock = …;  sets it'], mn: [EXT + '  (pasted)', '… = SystemCoreClock;  reads it'], sd: 0, sn: 1, md: 0, mn2: 1, v: ['undefined reference to SystemCoreClock', 'bad'] },
    C: { h: EXT, st: [EXT + '  (pasted)', DEF], mn: [EXT + '  (pasted)', '… = SystemCoreClock;  reads it'], sd: 1, sn: 0, md: 0, mn2: 1, v: ['linked: every need matched', 'ok'] },
    D: { h: DEF, st: [DEF + '  (pasted)', 'SystemCoreClock = …;  sets it'], mn: [DEF + '  (pasted)', '… = SystemCoreClock;  reads it'], sd: 1, sn: 0, md: 1, mn2: 0, v: ['multiple definition of SystemCoreClock', 'bad'] },
  };
  const W = svg(viz('link'), 780, 300, { label: 'clock.h pasted into startup.c and main.c; startup.o and main.o list definitions and needs; the linker verdict', minWidth: 560 });
  const layer = s('g', {}, W);
  const O = [{ x: 10, file: 'startup.c → startup.o' }, { x: 410, file: 'main.c → main.o' }], OW = 360, OY = 92, OH = 120;

  function draw(key) {
    layer.textContent = '';
    const o = OPT[key];
    box(layer, 220, 8, 340, 44, '', { cls: 'f-seg' });
    s('text', { x: 232, y: 26, class: 't-fg t-bold' }, layer, 'clock.h');
    s('text', { x: 232, y: 43, class: 't-fg t-sm' }, layer, o.h);
    arrow(layer, 300, 52, O[0].x + OW / 2, OY, { cls: 'a-muted', label: '#include', dx: -26, labelCls: 't-muted t-sm' });
    arrow(layer, 480, 52, O[1].x + OW / 2, OY, { cls: 'a-muted', label: '#include', dx: 26, labelCls: 't-muted t-sm' });
    const nDef = o.sd + o.md, nNeed = o.sn + o.mn2;
    const defCls = nDef === 1 ? 'ok' : 'bad', needCls = nDef === 1 ? 'ok' : 'bad';
    [[O[0], o.st, o.sd, o.sn], [O[1], o.mn, o.md, o.mn2]].forEach(([b, src, d, n]) => {
      box(layer, b.x, OY, OW, OH, '', { cls: 'f-surface' });
      s('text', { x: b.x + 12, y: OY + 20, class: 't-fg t-bold' }, layer, b.file);
      src.forEach((l, i) => s('text', { x: b.x + 12, y: OY + 40 + i * 15, class: 't-muted t-sm' }, layer, l));
      s('line', { x1: b.x + 12, x2: b.x + OW - 12, y1: OY + 74, y2: OY + 74, class: 's-line' }, layer);
      s('text', { x: b.x + 12, y: OY + 92, class: d ? 't-' + defCls + ' t-bold' : 't-muted' }, layer, 'defines: ' + (d ? 'SystemCoreClock' : '—'));
      s('text', { x: b.x + 12, y: OY + 110, class: n ? 't-' + needCls + ' t-bold' : 't-muted' }, layer, 'needs:   ' + (n ? 'SystemCoreClock' : '—'));
    });
    if (key === 'C') arrow(layer, O[1].x + 4, OY + 106, O[0].x + OW - 4, OY + 88, { cls: 'a-ok', width: 2 });
    [O[0], O[1]].forEach(b => arrow(layer, b.x + OW / 2, OY + OH, 390 + (b.x < 200 ? -60 : 60), 246, { cls: 'a-muted' }));
    box(layer, 170, 246, 440, 46, '', { cls: 'f-' + o.v[1] + '-soft' });
    s('text', { x: 390, y: 264, 'text-anchor': 'middle', class: 't-fg t-bold' }, layer, `linker: ${nDef} definition${nDef === 1 ? '' : 's'}, ${nNeed} need${nNeed === 1 ? '' : 's'}`);
    s('text', { x: 390, y: 282, 'text-anchor': 'middle', class: 't-' + o.v[1] + ' t-bold' }, layer, o.v[0]);
  }
  const NOTES = {
    A: 'A: each file defines its own <code>SystemCoreClock</code>. Each compiles fine alone, but the linker finds two definitions and will not choose for you.',
    B: 'B: both files only declare it. <code>extern</code> creates no storage, so both objects need the name and nobody defines it. This is the error the spike really hit: ST\'s header declares it, and ST\'s <code>system_stm32c0xx.c</code>, which the course does not use, defines it.',
    C: 'C: the header declares, <code>startup.c</code> defines. <code>startup.o</code> has the one definition, and the need in <code>main.o</code> is matched to it. Inside <code>startup.c</code> the declaration and the definition agree, so that is fine.',
    D: 'D: the definition sits in the header, and <code>#include</code> pastes it into both files before they are compiled. Two objects define the name, the same failure as A.',
  };
  const note = role('link-note');
  steps(viz('link-steps'), ['A', 'B', 'C', 'D'], k => {
    const key = 'ABCD'[k];
    draw(key);
    note.innerHTML = NOTES[key];
  }, 2);
});

QV.register('s2-mc10', function (q) {
  const { s, svg, steps, table } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);

  const CW = 7.8, PAD = 12, X0 = 92, GAP = 4, FH = 30;
  const W = svg(viz('hex'), 780, 272, { label: 'Record 1 fields: colon, 02, 0000, 04, 0800, F2. Record 2 fields: colon, 10, 0120, 00, data, FB. Address 0x0800 upper, 0x0120 lower: 0x08000120', minWidth: 560 });
  const NAMES = [':', 'LL', 'AAAA', 'TT', 'data', 'CC'];
  function record(y, fields, hiField, hiCls, label) {
    const g = s('g', { class: 'fade' }, W);
    s('text', { x: 0, y: y + FH / 2, dy: '0.35em', class: 't-fg t-bold' }, g, label);
    let x = X0;
    fields.forEach((f, i) => {
      const w = f.length * CW + PAD, on = i === hiField;
      s('rect', { x, y, width: w, height: FH, rx: 3, class: on ? hiCls : 'f-seg' }, g);
      s('text', { x: x + w / 2, y: y + FH / 2, dy: '0.35em', 'text-anchor': 'middle', class: (on ? 't-on' : 't-fg') + ' t-lg' }, g, f);
      s('text', { x: x + w / 2, y: y + FH + 14, 'text-anchor': 'middle', class: 't-sm' }, g, NAMES[i]);
      x += w + GAP;
    });
    return { g, end: x };
  }
  const r1 = record(30, [':', '02', '0000', '04', '0800', 'F2'], 4, 'f-pri', 'record 1');
  s('text', { x: r1.end + 14, y: 40, class: 't-pri t-bold' }, r1.g, 'TT = 04: extended linear address');
  s('text', { x: r1.end + 14, y: 56, class: 't-fg' }, r1.g, 'data 0800 = upper 16 bits from now on');
  const r2 = record(110, [':', '10', '0120', '00', '0A4B1B68013B0B4A13600B4B1A68FF21', 'FB'], 2, 'f-sec', 'record 2');
  s('text', { x: 92, y: 172, class: 't-sec' }, r2.g, 'LL = 0x10 = 16 bytes · AAAA = offset 0x0120 · TT = 00: data · first byte 0A');

  const ad = s('g', { class: 'fade' }, W);
  const AY = 200, BW = 112;
  s('text', { x: 0, y: AY + 18, dy: '0.35em', class: 't-fg t-bold' }, ad, 'address');
  s('text', { x: X0 + 12, y: AY + 18, dy: '0.35em', 'text-anchor': 'end', class: 't-fg t-lg' }, ad, '0x');
  s('rect', { x: X0 + 16, y: AY, width: BW, height: 36, rx: 4, class: 'f-pri' }, ad);
  s('text', { x: X0 + 16 + BW / 2, y: AY + 18, dy: '0.35em', 'text-anchor': 'middle', class: 't-on t-bold t-xl' }, ad, '0800');
  s('rect', { x: X0 + 20 + BW, y: AY, width: BW, height: 36, rx: 4, class: 'f-sec' }, ad);
  s('text', { x: X0 + 20 + BW * 1.5, y: AY + 18, dy: '0.35em', 'text-anchor': 'middle', class: 't-on t-bold t-xl' }, ad, '0120');
  [['bits 31:16', 'from record 1', X0 + 16 + BW / 2, 't-pri'], ['bits 15:0', 'from record 2', X0 + 20 + BW * 1.5, 't-sec']].forEach(([a, b, cx, c]) => {
    s('text', { x: cx, y: AY + 50, 'text-anchor': 'middle', class: c + ' t-sm' }, ad, a);
    s('text', { x: cx, y: AY + 63, 'text-anchor': 'middle', class: c + ' t-sm' }, ad, b);
  });
  s('text', { x: X0 + 40 + BW * 2, y: AY + 18, dy: '0.35em', class: 't-ok t-bold t-xl' }, ad, '= 0x08000120');

  table(viz('hex-table'), [{ text: 'Option', cls: 'l' }, { text: 'How it reads the records', cls: 'l' }, 'Address'], [
    [{ text: 'A', cls: 'l' }, { text: 'ignores the 04 record, offset only (8-bit AVR style)', cls: 'l' }, '0x00000120'],
    [{ text: 'B', cls: 'l' }, { text: '0800 as bits 31:16, 0120 as bits 15:0', cls: 'l' }, { text: '0x08000120', cls: 'hl' }],
    [{ text: 'C', cls: 'l' }, { text: 'takes the byte count 10 as the address', cls: 'l' }, '0x08000010'],
    [{ text: 'D', cls: 'l' }, { text: 'adds 0x0800 + 0x0120 without shifting', cls: 'l' }, '0x00000920'],
  ]).rows[1].classList.add('on');

  const groups = [r1.g, r2.g, ad];
  const NOTES = [
    'Both records and the address they build: <code>0x0800 × 0x10000 + 0x0120 = 0x08000120</code>.',
    'Record 1: <code>02</code> data bytes at offset <code>0000</code>, type <code>04</code>. It programs nothing. Its two data bytes <code>0800</code> become the upper half of every address that follows, until the next 04 record. The checksum <code>F2</code> makes all the bytes from LL to CC add up to 0 modulo 256.',
    'Record 2: <code>10</code> = 16 data bytes, offset <code>0120</code>, type <code>00</code> (data). The offset is only 16 bits wide, so on its own it can reach only the first 64 KB of addresses.',
    'The address: upper half from record 1, lower half from record 2, so the byte <code>0A</code> goes to <code>0x08000120</code>, inside flash (which starts at <code>0x08000000</code>).',
  ];
  const note = role('hex-note');
  steps(viz('hex-steps'), ['All', 'Record 1', 'Record 2', 'Address'], k => {
    groups.forEach((g, i) => g.classList.toggle('dim', k > 0 && k < 3 && i !== k - 1));
    note.innerHTML = NOTES[k];
  });
});

QV.register('s2-mc11', function (q) {
  const { s, svg, box, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);

  const W = svg(viz('mmu'), 780, 286, { label: 'Laptop: programs A and B both use virtual 0x400000, the MMU maps them to two physical pages. Chip: code uses 0x20000000, which is the SRAM word itself', minWidth: 560 });
  s('text', { x: 0, y: 16, class: 't-fg t-bold' }, W, 'Laptop: run-time binding');
  [[36, 'program A', 'f-pri', 't-on'], [156, 'program B', 'f-sec', 't-on']].forEach(([y, name, f, t]) => {
    box(W, 0, y, 136, 76, '', { cls: 'f-surface' });
    s('text', { x: 10, y: y + 18, class: 't-fg t-bold' }, W, name);
    s('text', { x: 10, y: y + 34, class: 't-sm' }, W, 'virtual addresses');
    s('rect', { x: 10, y: y + 44, width: 116, height: 24, rx: 3, class: f }, W);
    s('text', { x: 68, y: y + 56, dy: '0.35em', 'text-anchor': 'middle', class: t + ' t-bold' }, W, '0x400000');
  });
  box(W, 186, 112, 76, 50, 'MMU', { cls: 'f-fg', textCls: 't-on t-bold t-lg' });
  const PX = 316, PW = 132;
  s('text', { x: PX + PW / 2, y: 28, 'text-anchor': 'middle', class: 't-fg t-bold' }, W, 'physical RAM');
  const frames = [['f-seg', ''], ['f-pri', 'phys 0x1A2000'], ['f-seg', ''], ['f-seg', ''], ['f-seg', ''], ['f-sec', 'phys 0x7C5000'], ['f-seg', '']];
  frames.forEach(([f, t], i) => {
    const y = 38 + i * 30;
    s('rect', { x: PX, y, width: PW, height: 28, class: f + ' sep' }, W);
    if (t) s('text', { x: PX + PW / 2, y: y + 14, dy: '0.35em', 'text-anchor': 'middle', class: 't-on t-bold' }, W, t);
  });
  arrow(W, 136, 92, 186, 128, { cls: 'a-pri', width: 2 });
  arrow(W, 136, 200, 186, 148, { cls: 'a-sec', width: 2 });
  arrow(W, 262, 128, PX, 82, { cls: 'a-pri', width: 2 });
  arrow(W, 262, 148, PX, 202, { cls: 'a-sec', width: 2 });
  s('text', { x: 224, y: 184, 'text-anchor': 'middle', class: 't-sm' }, W, 'translates');
  s('text', { x: 224, y: 197, 'text-anchor': 'middle', class: 't-sm' }, W, 'every access');
  s('text', { x: 0, y: 270, class: 't-muted' }, W, 'Same 0x400000, two physical places.');

  s('line', { x1: 474, x2: 474, y1: 6, y2: 280, class: 's-line' }, W);
  s('text', { x: 492, y: 16, class: 't-fg t-bold' }, W, 'STM32C031C6: build-time binding');
  box(W, 492, 96, 132, 78, '', { cls: 'f-surface' });
  s('text', { x: 502, y: 116, class: 't-fg t-bold' }, W, 'code in flash');
  s('text', { x: 502, y: 134, class: 't-sm' }, W, 'reads the address');
  s('rect', { x: 502, y: 142, width: 112, height: 24, rx: 3, class: 'f-pri' }, W);
  s('text', { x: 558, y: 154, dy: '0.35em', 'text-anchor': 'middle', class: 't-on t-bold' }, W, '0x20000000');
  const SX = 664, SW = 112;
  s('text', { x: SX + SW / 2, y: 28, 'text-anchor': 'middle', class: 't-fg t-bold' }, W, 'SRAM');
  for (let i = 0; i < 7; i++) {
    const y = 38 + i * 30, on = i === 6;
    s('rect', { x: SX, y, width: SW, height: 28, class: (on ? 'f-pri' : 'f-seg') + ' sep' }, W);
    s('text', { x: SX + SW / 2, y: y + 14, dy: '0.35em', 'text-anchor': 'middle', class: on ? 't-on t-bold' : 't-sm' }, W, on ? '0x20000000' : '0x200000' + (24 - i * 4).toString(16).padStart(2, '0').toUpperCase());
  }
  s('text', { x: SX + SW / 2, y: 262, 'text-anchor': 'middle', class: 't-pri t-sm' }, W, 'SystemCoreClock');
  arrow(W, 624, 154, SX, 230, { cls: 'a-pri', width: 2 });
  s('text', { x: 628, y: 206, 'text-anchor': 'end', class: 't-muted t-sm' }, W, 'no MMU');
  s('text', { x: 492, y: 270, class: 't-muted' }, W, 'One address, one real word.');
});
