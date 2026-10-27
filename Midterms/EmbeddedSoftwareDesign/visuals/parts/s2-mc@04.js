QV.register('s2-mc15', function (q) {
  const { s, svg, steps, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);

  // Figure 1: FLASH and RAM bars (not to scale), the .data slot in each, and the two checks
  const g = svg(viz('map'), 760, 304, { label: 'FLASH and RAM with the .data section placed by each option, and whether limit is writable and holds 50 after power-on', minWidth: 580 });
  const F = { y: 52, h: 44, slot: [490, 590] }, M = { y: 172, h: 44, slot: [120, 220] };
  const bar = (y, name, base, blocks, note) => {
    s('text', { x: 8, y: y + 12, dy: '0.35em', class: 't-fg t-bold' }, g, name);
    s('text', { x: 8, y: y + 28, dy: '0.35em', class: 't-sm' }, g, base);
    s('text', { x: 8, y: y + 44, dy: '0.35em', class: 't-sm' }, g, note);
    blocks.forEach(([x0, x1, label, cls]) => {
      s('rect', { x: x0, y, width: x1 - x0, height: 44, class: (cls || 'f-seg') + ' sep' }, g);
      if (label) s('text', { x: (x0 + x1) / 2, y: y + 22, dy: '0.35em', 'text-anchor': 'middle', class: 't-muted t-sm' }, g, label);
    });
  };
  bar(F.y, 'FLASH (rx)', '0x08000000', [[120, 170, 'vect'], [170, 390, '.text'], [390, 490, '.rodata'], [490, 590, null, 'f-surface'], [590, 740, 'free', 'f-surface']], 'kept at power-off');
  bar(M.y, 'RAM (rw)', '0x20000000', [[120, 220, null, 'f-surface'], [220, 320, '.bss'], [320, 640, 'heap, free', 'f-surface'], [640, 740, 'stack']], 'empty at reset');
  const layer = s('g', {}, g);

  const OPT = [
    { fl: ['f-pri', 'limit = 50', 't-on', 'runs and is stored here'], ram: null, checks: [[false, 'FLASH is (rx), an ordinary store cannot change it'], [true, 'the 50 is in FLASH']],
      note: 'A, >FLASH. The variable lives where its value is stored, in FLASH. The 50 survives power-off, but FLASH is read-only to ordinary stores, so limit can never change.' },
    { fl: null, ram: ['f-pri', 'limit = 50 ?', 't-on', 'runs here, LOADADDR is the same address'], checks: [[true, 'RAM is writable'], [false, 'nothing in FLASH holds the 50, and RAM is empty at reset']],
      note: 'B, >RAM with no AT>. The section has only a RAM address. Nothing is stored in FLASH, LOADADDR(.data) equals _sdata, and the copy loop copies RAM onto itself.' },
    { fl: ['f-pri', 'limit', 't-on', 'runs here (VMA)'], ram: ['f-pri-soft', 'limit = 50', 't-pri', 'stored here (LMA)'], back: true, checks: [[false, 'it runs from FLASH'], [false, 'its stored copy would be in RAM, empty at reset']],
      note: 'C, >FLASH AT> RAM. The two addresses are swapped. The variable would run from read-only FLASH, and its initial value would have to be stored in RAM, which loses everything at power-off.' },
    { fl: ['f-pri-soft', 'limit = 50', 't-pri', 'stored here (LMA), _sidata'], ram: ['f-pri', 'limit', 't-on', 'runs here (VMA), _sdata'], copy: true, checks: [[true, 'it runs in RAM'], [true, 'Reset_Handler copies 50 from FLASH at every reset']],
      note: 'D, >RAM AT> FLASH. Two addresses: limit runs in RAM at _sdata and is stored in FLASH at _sidata = LOADADDR(.data). Reset_Handler copies the stored 50 into RAM before main(), at every reset.' },
  ];

  steps(viz('steps'), ['A', 'B', 'C', 'D'], k => {
    const o = OPT[k];
    layer.textContent = '';
    [[o.fl, F, F.y - 10], [o.ram, M, M.y + M.h + 16]].forEach(([d, B, ty]) => {
      if (!d) return;
      const [x0, x1] = B.slot;
      s('rect', { x: x0 + 1, y: B.y + 1, width: x1 - x0 - 2, height: B.h - 2, class: d[0] + ' outline-pri' }, layer);
      s('text', { x: (x0 + x1) / 2, y: B.y + B.h / 2, dy: '0.35em', 'text-anchor': 'middle', class: d[2] + ' t-bold' }, layer, d[1]);
      s('text', { x: x0 === 120 ? x0 : (x0 + x1) / 2, y: ty, 'text-anchor': x0 === 120 ? 'start' : 'middle', class: 't-pri t-bold' }, layer, d[3]);
    });
    if (o.copy) arrow(layer, 540, F.y + F.h + 4, 176, M.y - 4, { cls: 'a-pri', width: 2, label: 'Reset_Handler copies', labelCls: 't-pri t-bold', dx: 112, dy: 8 });
    if (o.back) arrow(layer, 176, M.y - 4, 540, F.y + F.h + 4, { cls: 'a-bad', width: 2, dash: true, label: 'copy source is empty RAM', labelCls: 't-bad t-bold', dx: 112, dy: 12 });
    o.checks.forEach(([ok, why], i) => {
      const t = s('text', { x: 8, y: 270 + i * 20 }, layer);
      s('tspan', { class: 't-fg' }, t, i === 0 ? 'Can the program set limit = 60? ' : 'Is limit 50 again after power-on? ');
      s('tspan', { class: (ok ? 't-ok' : 't-bad') + ' t-bold' }, t, ok ? 'yes' : 'no');
      s('tspan', { class: 't-muted' }, t, ', ' + why);
    });
    role('note').textContent = o.note;
  }, 3);
});

QV.register('s2-mc16', function (q) {
  const { s, svg, steps, table } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const SEC = [
    ['.isr_vector', 180, 1, 0, 'f-seg', 't-fg'],
    ['.text', 4000, 1, 0, 'f-seg', 't-fg'],
    ['.rodata', 800, 1, 0, 'f-seg', 't-fg'],
    ['.data', 120, 1, 1, 'f-pri', 't-pri'],
    ['.bss', 400, 0, 1, 'f-sec-soft', 't-sec'],
    ['._user_heap_stack', 1536, 0, 1, 'f-ter-soft', 't-ter'],
  ];
  const FL = SEC.reduce((a, r) => a + r[1] * r[2], 0), RAM = SEC.reduce((a, r) => a + r[1] * r[3], 0);

  // Figure 1: used FLASH and used RAM on one byte scale
  const g = svg(viz('bars'), 760, 224, { label: `Used FLASH ${FL} bytes and used RAM ${RAM} bytes drawn to scale, built section by section`, minWidth: 560 });
  const K = 0.11, X0 = 100, BY = { f: 46, r: 128 }, H = 36;
  const bx = v => X0 + v * K;
  s('text', { x: 8, y: BY.f + H / 2, dy: '0.35em', class: 't-fg t-bold' }, g, 'FLASH');
  s('text', { x: 8, y: BY.r + H / 2, dy: '0.35em', class: 't-fg t-bold' }, g, 'RAM');
  const groups = SEC.map(() => s('g', { class: 'fade' }, g));
  let fx = 0, rx = 0;
  // label placement for blocks too narrow to hold their text
  const OUT = { '.isr_vector': { f: [X0, BY.f - 8, 'start', 'vectors 180'] }, '.data': { f: [null, BY.f - 8, 'end', 'data copy 120'], r: [X0, BY.r - 8, 'start', 'data 120'] }, '.bss': { r: [null, BY.r + H + 14, 'middle', 'bss 400'] } };
  SEC.forEach(([name, size, inF, inR, fill, tc], i) => {
    [[inF, 'f', fx], [inR, 'r', rx]].forEach(([on, which, at]) => {
      if (!on) return;
      const x = bx(at), w = size * K, y = BY[which];
      s('rect', { x, y, width: w, height: H, class: fill + ' sep' }, groups[i]);
      const out = OUT[name] && OUT[name][which];
      if (out) {
        const lx = out[0] != null ? out[0] : (out[2] === 'end' ? x + w + 6 : x + w / 2);
        s('text', { x: lx, y: out[1], 'text-anchor': out[2], class: tc + ' t-bold' }, groups[i], out[3]);
      } else {
        s('text', { x: x + w / 2, y: y + H / 2, dy: '0.35em', 'text-anchor': 'middle', class: (fill === 'f-pri' ? 't-on' : tc) + ' t-bold' }, groups[i], (name === '._user_heap_stack' ? 'heap + stack' : name) + ' ' + size);
      }
    });
    if (inF) fx += size;
    if (inR) rx += size;
  });
  s('text', { x: bx(FL) + 8, y: BY.f + H / 2, dy: '0.35em', class: 't-fg t-bold t-lg' }, g, `= ${FL} B`);
  s('text', { x: bx(RAM) + 8, y: BY.r + H / 2, dy: '0.35em', class: 't-fg t-bold t-lg' }, g, `= ${RAM} B`);
  const AY = 194;
  s('line', { x1: bx(0), x2: bx(FL), y1: AY, y2: AY, class: 'l-axis' }, g);
  [0, 1000, 2000, 3000, 4000, 5000].forEach(v => {
    s('line', { x1: bx(v), x2: bx(v), y1: AY, y2: AY + 5, class: 'l-axis' }, g);
    s('text', { x: bx(v), y: AY + 18, 'text-anchor': 'middle' }, g, v === 5000 ? '5000 B' : String(v));
  });

  const rows = SEC.map(([name, size, inF, inR]) => [{ text: name, cls: 'l' }, String(size), inF ? String(size) : '0', inR ? String(size) : '0']);
  rows.push([{ text: 'used', cls: 'l' }, '', { text: String(FL), cls: 'hl' }, { text: String(RAM), cls: 'hl' }]);
  const tbl = table(viz('table'), [{ text: 'Section', cls: 'l' }, 'size', 'FLASH', 'RAM'], rows);

  const NOTES = [
    'All six sections. FLASH = 180 + 4000 + 800 + 120 = 5100. RAM = 120 + 400 + 1536 = 2056. Only .data is in both bars.',
    '.isr_vector, 180 bytes: the vector table, FLASH only. Running totals: FLASH 180, RAM 0.',
    '.text, 4000 bytes: the code, which runs in place from FLASH. Running totals: FLASH 4180, RAM 0.',
    '.rodata, 800 bytes: const data, read in place from FLASH. Running totals: FLASH 4980, RAM 0. Stopping here gives option A.',
    '.data, 120 bytes: initialised globals. They live in RAM and their values are stored in FLASH, so .data adds 120 to both. Running totals: FLASH 5100, RAM 120.',
    '.bss, 400 bytes: zeroed globals. RAM only; FLASH records just the size. Running totals: FLASH 5100, RAM 520. Stopping here gives option D. Adding it to FLASH gives option B, 5500.',
    '._user_heap_stack, 1536 bytes: a RAM reservation for the heap and the stack. Final totals: FLASH 5100, RAM 2056.',
  ];
  steps(viz('steps'), ['All', '.isr_vector', '.text', '.rodata', '.data', '.bss', 'heap + stack'], k => {
    groups.forEach((gr, i) => gr.classList.toggle('dim', k > 0 && i !== k - 1));
    tbl.rows.forEach((r, i) => r.classList.toggle('on', k > 0 && i === k - 1));
    role('note').textContent = NOTES[k];
  });
});

QV.register('s2-mc17', function (q) {
  const { s, svg, steps, box, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const WANT = 'TIM3_IRQHandler';

  // Figure 1: object-file symbols, a letter-by-letter name match, the vector slot and the interrupt path
  const g = svg(viz('link'), 760, 296, { label: 'Symbol resolution for TIM3_IRQHandler: a misspelt handler leaves the weak Default_Handler in vector 32, and the interrupt hangs in for (;;)', minWidth: 580 });
  const P = { y: 34, h: 78 };
  s('text', { x: 10, y: 24, class: 't-fg t-bold' }, g, 'startup.o');
  s('rect', { x: 10, y: P.y, width: 230, height: P.h, rx: 6, class: 'f-surface box' }, g);
  s('text', { x: 260, y: 24, class: 't-fg t-bold' }, g, 'main.o, the student\'s file');
  s('rect', { x: 260, y: P.y, width: 230, height: P.h, rx: 6, class: 'f-surface box' }, g);
  s('text', { x: 510, y: 24, class: 't-fg t-bold' }, g, 'vector table, TIM3 slot');
  const layer = s('g', {}, g);

  const SC = [
    { name: 'TIM3_IRQhandler', ok: false,
      slot: ['0x08000679', 'Default_Handler 0x08000678 + T bit'],
      main: 'matches no table entry',
      flow: ['Default_Handler\nfor (;;) { }', 'board hangs,\nno error'],
      note: 'As written. TIM3_IRQhandler is a different symbol, so the linker has nothing to replace. TIM3_IRQHandler stays the weak alias of Default_Handler, nm shows it as W, and the slot holds 0x08000678 with the Thumb bit, 0x08000679. The unused function may even be deleted as dead code.' },
    { name: WANT, ok: true,
      slot: ['your handler + 1', 'its address with the T bit set'],
      main: 'replaces the weak alias',
      flow: ['TIM3_IRQHandler\nyour code runs', 'returns to\nthe main loop'],
      note: 'Spelled exactly. The ordinary definition replaces the weak alias at link time, nm shows TIM3_IRQHandler as T, and the slot holds your function\'s address with bit 0 set. No ISR() macro and no vector number: the name is the registration.' },
  ];

  steps(viz('steps'), ['Misspelt: IRQhandler', 'Spelled right: IRQHandler'], k => {
    const sc = SC[k], st = sc.ok ? 'ok' : 'bad';
    layer.textContent = '';
    const t = (x, y, text, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor, class: cls }, layer, text);
    t(22, 52, WANT, sc.ok ? 't-muted' : 't-fg t-bold');
    t(228, 52, 'W', sc.ok ? 't-muted' : 't-sec t-bold', 'end');
    t(22, 70, '= alias of Default_Handler', 't-sm');
    t(22, 94, 'Default_Handler', 't-fg');
    t(228, 94, 'T', 't-fg t-bold', 'end');
    t(272, 56, sc.name, 't-fg t-bold');
    t(478, 56, 'T', 't-fg t-bold', 'end');
    t(272, 76, 'an ordinary definition', 't-sm');
    t(272, 96, sc.main, `t-${st} t-bold t-sm`);
    s('rect', { x: 510, y: P.y, width: 240, height: P.h, rx: 6, class: `f-${st}-soft box` }, layer);
    t(522, 52, 'vector 32, at 0x08000080', 't-sm');
    t(522, 74, sc.slot[0], `t-${st} t-bold t-lg`);
    t(522, 96, sc.slot[1], 't-sm');

    t(140, 160, 'table asks for', 't-sm', 'end');
    t(140, 196, 'you wrote', 't-sm', 'end');
    WANT.split('').forEach((ch, i) => {
      const x = 150 + i * 20, diff = sc.name[i] !== ch;
      s('rect', { x, y: 147, width: 18, height: 26, rx: 3, class: diff ? 'f-bad-soft outline-sec' : 'f-seg' }, layer);
      t(x + 9, 160, ch, diff ? 't-bad t-bold' : 't-fg', 'middle');
      s('rect', { x, y: 183, width: 18, height: 26, rx: 3, class: diff ? 'f-bad-soft outline-sec' : (sc.ok ? 'f-ok-soft' : 'f-seg') }, layer);
      t(x + 9, 196, sc.name[i], diff ? 't-bad t-bold' : (sc.ok ? 't-ok' : 't-fg'), 'middle');
    });
    t(466, 160, sc.ok ? 'all 15 letters match' : 'letter 9 differs, H against h', `t-${st} t-bold`);
    t(466, 178, sc.ok ? 'the same symbol: override' : 'a different symbol: no override', `t-${st}`);
    t(466, 196, 'no error and no warning either way', 't-sm');

    const FB = [[10, 140, 'TIM3 interrupt', 'f-seg', 't-fg'], [176, 120, 'vector 32', 'f-seg', 't-fg'], [332, 200, sc.flow[0], `f-${st}-soft`, `t-${st}`], [568, 182, sc.flow[1], `f-${st}`, 't-on']];
    FB.forEach(([x, w, label, cls, tc], i) => {
      box(layer, x, 238, w, 44, label, { cls, textCls: tc + ' t-bold', lh: 15 });
      if (i < FB.length - 1) arrow(layer, x + w + 3, 260, FB[i + 1][0] - 3, 260, { cls: 'a-muted', width: 1.5 });
    });
    t(10, 226, 'when the first TIM3 interrupt arrives', 't-fg t-bold');
    role('note').textContent = sc.note;
  });
});
