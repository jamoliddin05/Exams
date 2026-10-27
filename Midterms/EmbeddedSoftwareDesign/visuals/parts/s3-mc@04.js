QV.register('s3-mc15', function (q) {
  const { s, svg, slider, box, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const hx = v => '0x' + v.toString(16).toUpperCase().padStart(8, '0');
  const le = v => [0, 1, 2, 3].map(i => (Math.floor(v / 256 ** i) % 256).toString(16).toUpperCase().padStart(2, '0')).join(' ');
  const ORG = 0x20000000;

  // Figure 1: the chip's 12 KB SRAM, the declared part, and _estack at its end
  const r = svg(viz('ram'), 760, 156, { label: 'SRAM from 0x20000000 to 0x20003000 with the region declared by LENGTH and _estack at its end', minWidth: 560 });
  const R = { x0: 110, kb: 50, y: 52, h: 40 };
  const rx = kb => R.x0 + kb * R.kb;
  s('text', { x: 8, y: R.y + R.h / 2 - 7, dy: '0.35em', class: 't-fg t-bold' }, r, 'SRAM');
  s('text', { x: 8, y: R.y + R.h / 2 + 8, dy: '0.35em', class: 't-sm' }, r, '12 KB on chip');
  s('line', { x1: rx(0), x2: rx(12), y1: 112, y2: 112, class: 'l-axis' }, r);
  [0, 2, 4, 6, 8, 10, 12].forEach(k => {
    s('line', { x1: rx(k), x2: rx(k), y1: 112, y2: 117, class: 'l-axis' }, r);
    s('text', { x: rx(k), y: 130, 'text-anchor': 'middle' }, r, hx(ORG + k * 1024));
    s('text', { x: rx(k), y: 146, 'text-anchor': 'middle', class: 't-sm' }, r, k + ' KB');
  });
  const layer = s('g', {}, r);

  // Figure 1, lower part: link.ld to SP, values follow the slider
  const c = svg(viz('chain'), 760, 112, { label: 'Chain from link.ld to SP: _estack, vectors[0], the first four bytes of the hex file, and the core loading SP at reset', minWidth: 560 });
  const chain = s('g', {}, c);

  slider(viz('slider'), { label: 'LENGTH', min: 1, max: 12, step: 1, value: 6, fmt: v => v + 'K' }, k => {
    const len = k * 1024, top = ORG + len;
    layer.textContent = '';
    s('rect', { x: rx(0), y: R.y, width: rx(k) - rx(0), height: R.h, class: 'f-pri-soft outline-pri' }, layer);
    if (k < 12) {
      s('rect', { x: rx(k), y: R.y, width: rx(12) - rx(k), height: R.h, class: 'f-seg' }, layer);
      if (k <= 10) s('text', { x: (rx(k) + rx(12)) / 2, y: R.y + R.h / 2, dy: '0.35em', 'text-anchor': 'middle', class: 't-muted' }, layer, 'not declared');
    }
    s('rect', { x: rx(0), y: R.y, width: 24, height: R.h, class: 'f-sec-soft sep' }, layer);
    s('text', { x: rx(0), y: R.y - 8, class: 't-sec t-sm' }, layer, '.data .bss');
    if (k >= 3) {
      arrow(layer, rx(k) - 6, R.y + R.h / 2, rx(k) - Math.min(130, k * 50 - 44), R.y + R.h / 2, { cls: 'a-pri', width: 2 });
      s('text', { x: rx(k) - 12, y: R.y + R.h / 2 - 9, 'text-anchor': 'end', class: 't-pri t-sm' }, layer, 'stack grows down');
    }
    s('line', { x1: rx(k), x2: rx(k), y1: R.y - 14, y2: R.y + R.h + 6, class: 's-pri' }, layer);
    const anchor = k >= 10 ? 'end' : k <= 2 ? 'start' : 'middle';
    s('text', { x: rx(k), y: 26, 'text-anchor': anchor, class: 't-pri t-bold' }, layer, '_estack = ' + hx(top));

    role('len').textContent = String(len);
    role('top').textContent = hx(top);
    role('bytes').textContent = le(top);
    role('calc').textContent = [
      `LENGTH  = ${k}K = ${k} × 1024 = ${len} = 0x${len.toString(16).toUpperCase()}`,
      `_estack = ORIGIN(RAM) + LENGTH(RAM) = 0x20000000 + 0x${len.toString(16).toUpperCase()} = ${hx(top)}`,
      `word 0  = ${le(top)}   (lowest byte first, at 0x08000000)`,
    ].join('\n') + (k === 6 ? '\noption D reads 6K as 6000 = 0x1770; in link.ld, K is 1024' : '');

    chain.textContent = '';
    const B = [
      ['link.ld', `_estack =\nORIGIN + LENGTH\n= ${hx(top)}`],
      ['startup.c', 'vectors[0] =\n&_estack\na value, not code'],
      ['Main.hex', `first 4 bytes\n${le(top)}\nat 0x08000000`],
      ['the core, at reset', `word 0 → SP\nSP = ${hx(top)}\nbefore any code`],
    ];
    B.forEach(([title, text], i) => {
      const x = 10 + i * 192;
      s('text', { x, y: 18, class: 't-fg t-bold' }, chain, title);
      box(chain, x, 28, 168, 66, text, { cls: i === 3 ? 'f-pri-soft' : 'f-surface', textCls: i === 3 ? 't-pri' : 't-fg', lh: 16 });
      if (i < 3) arrow(chain, x + 171, 61, x + 189, 61, { cls: 'a-pri', width: 2 });
    });
  });
});

QV.register('s3-mc16', function (q) {
  const { s, svg, steps, box, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const hx = v => '0x' + v.toString(16).toUpperCase().padStart(8, '0');
  const SIZE = { vec: 180, text: 5684, rodata: 1652 };
  const NAME = { vec: '.isr_vector', text: '.text', rodata: '.rodata' };

  // Figure 1: FLASH order, the first eight bytes and what SP and PC become
  const g = svg(viz('flash'), 760, 272, { label: 'FLASH layout before and after moving .isr_vector after .text, the first eight bytes at 0x08000000, and the SP and PC the core loads from them', minWidth: 580 });
  const F = { x0: 110, w: 600, y: 48, h: 34 }, K = F.w / (SIZE.vec + SIZE.text + SIZE.rodata);
  const BX = i => 110 + i * 62 + (i >= 4 ? 20 : 0), BY = 126, BH = 34;
  s('text', { x: 8, y: F.y + F.h / 2, dy: '0.35em', class: 't-fg t-bold' }, g, 'FLASH');
  s('text', { x: 8, y: BY + BH / 2 - 7, dy: '0.35em', class: 't-fg t-bold' }, g, 'first 8 bytes');
  s('text', { x: 8, y: BY + BH / 2 + 8, dy: '0.35em', class: 't-sm' }, g, 'read at reset');
  const layer = s('g', {}, g);

  const SC = [
    { order: ['vec', 'text', 'rodata'], bytes: [0x00, 0x30, 0x00, 0x20, 0xC5, 0x06, 0x00, 0x08], ok: true,
      checks: ['SP: top of the 12 KB RAM', 'PC: odd, inside FLASH'],
      verdict: 'Reset_Handler runs with a valid stack',
      note: 'link.ld as given. .isr_vector is first, so word 0 is _estack = 0x20003000 and word 1 is Reset_Handler with the Thumb bit, 0x080006C5 (slide 7).' },
    { order: ['text', 'vec', 'rodata'], bytes: [0x00, 0x22, 0x43, 0x08, 0x8B, 0x42, 0x74, 0xD3], ok: false,
      checks: ['SP: not RAM, past the 32 KB FLASH', 'PC: nothing is mapped there'],
      verdict: 'The core locks up: SP and PC are machine code',
      note: 'Moved after .text. .text now starts at 0x08000000 and .isr_vector at 0x08001634. The core still reads the first two words, which are instruction bytes. In the lab build they give SP = 0x08432200 and PC = 0xD374428B, and the core locks up.' },
  ];

  steps(viz('steps'), ['link.ld as given', 'moved after .text'], k => {
    const sc = SC[k], st = sc.ok ? 'ok' : 'bad';
    layer.textContent = '';
    let x = F.x0;
    sc.order.forEach((sec, i) => {
      const w = SIZE[sec] * K, vec = sec === 'vec';
      s('rect', { x, y: F.y, width: w, height: F.h, class: (vec ? 'f-pri' : 'f-seg') + ' sep' }, layer);
      if (vec) {
        s('text', { x: i === 0 ? x : x + w / 2, y: F.y - 8, 'text-anchor': i === 0 ? 'start' : 'middle', class: 't-pri t-bold' }, layer, `.isr_vector at ${hx(0x08000000 + (i === 0 ? 0 : SIZE.text))}`);
      } else {
        s('text', { x: x + w / 2, y: F.y + F.h / 2, dy: '0.35em', 'text-anchor': 'middle', class: 't-fg' }, layer, `${NAME[sec]} ${SIZE[sec]}`);
      }
      x += w;
    });
    s('polygon', { points: `${F.x0},${F.y + F.h} ${F.x0 + 6},${F.y + F.h} ${BX(7) + 58},${BY} ${BX(0)},${BY}`, class: sc.ok ? 'area-pri' : 'area-sec' }, layer);
    sc.bytes.forEach((b, i) => {
      s('rect', { x: BX(i), y: BY, width: 58, height: BH, rx: 4, class: sc.ok ? 'f-pri-soft' : 'f-seg' }, layer);
      s('text', { x: BX(i) + 29, y: BY + BH / 2, dy: '0.35em', 'text-anchor': 'middle', class: (sc.ok ? 't-pri' : 't-fg') + ' t-bold t-lg' }, layer, b.toString(16).toUpperCase().padStart(2, '0'));
    });
    [0, 1].forEach(w => {
      const v = sc.bytes.slice(4 * w, 4 * w + 4).reduce((a, b, i) => a + b * 256 ** i, 0);
      const cx = (BX(4 * w) + BX(4 * w + 3) + 58) / 2;
      s('text', { x: cx, y: 184, 'text-anchor': 'middle', class: 't-fg t-bold' }, layer, `word ${w} = ${hx(v)} → ${w ? 'PC' : 'SP'}`);
      s('text', { x: cx, y: 202, 'text-anchor': 'middle', class: `t-${st}` }, layer, sc.checks[w]);
    });
    box(layer, BX(0), 222, BX(7) + 58 - BX(0), 40, sc.verdict, { cls: `f-${st}-soft`, textCls: `t-${st} t-bold` });
    role('note').textContent = sc.note;
  }, 1);

  // Figure 2: every tool in the chain passes
  const c = svg(viz('checks'), 760, 124, { label: 'Compiler, linker and objcopy all pass; only the chip at reset fails', minWidth: 560 });
  [['compiler', 'checks the language', '0 errors, 0 warnings', true],
    ['linker', 'checks the arithmetic', 'fits, sizes identical', true],
    ['objcopy', 'writes Main.hex', 'checksums correct', true],
    ['the chip, at reset', 'loads SP and PC', 'cannot start', false]].forEach(([t, a, b, ok], i) => {
    const x = 10 + i * 192, st = ok ? 'ok' : 'bad';
    box(c, x, 12, 168, 70, `${t}\n${a}\n${b}`, { cls: `f-${st}-soft`, textCls: `t-${st}`, lh: 17 });
    if (i < 3) arrow(c, x + 171, 47, x + 189, 47, { cls: 'a-muted', width: 1.5 });
  });
  s('text', { x: 380, y: 110, 'text-anchor': 'middle', class: 't-fg' }, c, 'The compiler checks your language. The linker checks your arithmetic. Neither checks your intent.');
});

QV.register('s3-mc17', function (q) {
  const { s, svg, steps, box, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const hx = v => '0x' + v.toString(16).toUpperCase().padStart(8, '0');
  const REGS = ['MODER', 'OTYPER', 'OSPEEDR', 'PUPDR', 'IDR', 'ODR', 'BSRR', 'LCKR', 'AFR[0]', 'AFR[1]', 'BRR'];

  // Figure 1: GPIO_TypeDef laid over memory at the port's base; the chosen member lit
  const g = svg(viz('struct'), 760, 336, { label: 'GPIO_TypeDef over memory: eleven 32-bit registers at offsets 0x00 to 0x28 from the port base; GPIOA->ODR is 0x50000000 + 0x14', minWidth: 560 });
  const S = { x: 300, w: 170, y0: 40, rh: 24 };
  const ry = i => S.y0 + i * S.rh;
  s('text', { x: S.x, y: 24, class: 't-fg t-bold' }, g, 'GPIO_TypeDef');
  s('text', { x: 480, y: 24, class: 't-sm' }, g, 'offset');
  s('text', { x: 524, y: 24, class: 't-sm' }, g, 'address');
  const layer = s('g', {}, g);

  const SC = [
    { port: 'GPIOA', base: 0x50000000, reg: 5, note: 'GPIOA->ODR. The base 0x50000000 plus ODR\'s offset 0x14 gives 0x50000014, the register the line toggles. The compiler knows both numbers, so the address is a constant.' },
    { port: 'GPIOA', base: 0x50000000, reg: 6, note: 'GPIOA->BSRR. The same base and a different constant offset, 0x18, so 0x50000018. One base in a register serves MODER, ODR, BSRR and the rest.' },
    { port: 'GPIOB', base: 0x50000400, reg: 5, note: 'GPIOB->ODR. The same struct, pinned at GPIOB\'s base, 0x50000400. Ports are 0x400 apart, so ODR is at 0x50000414.' },
  ];

  steps(viz('steps'), ['GPIOA->ODR', 'GPIOA->BSRR', 'GPIOB->ODR'], k => {
    const sc = SC[k], off = sc.reg * 4, addr = sc.base + off;
    layer.textContent = '';
    REGS.forEach((name, i) => {
      const on = i === sc.reg, y = ry(i);
      s('rect', { x: S.x, y, width: S.w, height: S.rh, class: (on ? 'f-pri' : i === 0 ? 'f-pri-soft' : 'f-seg') + ' sep' }, layer);
      s('text', { x: S.x + S.w / 2, y: y + S.rh / 2, dy: '0.35em', 'text-anchor': 'middle', class: on ? 't-on t-bold' : 't-fg' }, layer, name);
      s('text', { x: 480, y: y + S.rh / 2, dy: '0.35em', class: on ? 't-pri t-bold' : 't-sm' }, layer, '+0x' + (i * 4).toString(16).toUpperCase().padStart(2, '0'));
      s('text', { x: 524, y: y + S.rh / 2, dy: '0.35em', class: on ? 't-pri t-bold' : 't-muted' }, layer, hx(sc.base + i * 4));
    });
    box(layer, 10, 40, 196, 62, `${sc.port} =\n(GPIO_TypeDef *)\n${hx(sc.base)}`, { cls: 'f-pri-soft', textCls: 't-pri t-bold', stroke: 'outline-pri', lh: 16 });
    arrow(layer, 208, ry(0) + S.rh / 2, S.x - 4, ry(0) + S.rh / 2, { cls: 'a-pri', width: 2, label: 'base', labelCls: 't-pri', dy: -7, dx: -10 });
    arrow(layer, 280, ry(0) + S.rh / 2 + 6, 280, ry(sc.reg) + S.rh / 2, { cls: 'a-sec', width: 2 });
    s('text', { x: 272, y: (ry(0) + ry(sc.reg)) / 2 + S.rh / 2 + 3, dy: '0.35em', 'text-anchor': 'end', class: 't-sec t-bold' }, layer, '+ 0x' + off.toString(16).toUpperCase());
    s('text', { x: 604, y: ry(sc.reg) + S.rh / 2 - 8, dy: '0.35em', class: 't-pri t-bold' }, layer, `${sc.port}->${REGS[sc.reg]}`);
    s('text', { x: 604, y: ry(sc.reg) + S.rh / 2 + 8, dy: '0.35em', class: 't-pri t-sm' }, layer, 'an ordinary ldr / str');
    s('text', { x: S.x + S.w / 2, y: 326, 'text-anchor': 'middle', class: 't-ok t-bold t-lg' }, layer, `${hx(sc.base)} + 0x${off.toString(16).toUpperCase()} = ${hx(addr)}`);
    role('note').textContent = sc.note;
  });
});
