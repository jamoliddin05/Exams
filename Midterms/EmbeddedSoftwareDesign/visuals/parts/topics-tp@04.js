QV.register('topic4', function (q) {
  const { s, svg, box, arrow, steps, slider, table } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const hex = (v, n) => '0x' + (v >>> 0).toString(16).toUpperCase().padStart(n || 8, '0');
  const T = (g, x, y, text, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls || null }, g, text);
  // each figure draws on its own, so one failing figure leaves the others intact
  const fig = (name, fn) => { try { fn(); } catch (e) { QV.fail('topic4 ' + name, e); } };

  // Figure 1: memory map
  fig('map', () => {
    const g = svg(viz('map'), 780, 436, { label: 'STM32C031C6 memory map: FLASH, SRAM, peripherals, IOPORT and the core region, with the two rows the link.ld MEMORY block declares', minWidth: 560 });
    const X = 100, W = 300, SX = 446;
    T(g, X + W / 2, 12, 'one flat 4 GB address space, high addresses at the top', 't-fg t-bold', 'middle');
    const rows = [
      { y: 26, h: 56, cls: 'f-seg', lines: ['SCS: core peripherals', 'SysTick 0xE000E010 · NVIC 0xE000E100', 'SCB 0xE000ED00'], base: '0xE0000000', side: ['ARM defines it,', 'identical on every Cortex-M'] },
      { y: 94, h: 56, cls: 'f-sec-soft', lines: ['IOPORT: the GPIO ports', 'GPIOA 0x50000000 · GPIOB 0x50000400', 'ports 0x400 apart'], base: '0x50000000', side: ['not in the peripheral region', 'an F1/F4 GPIO address is wrong here'], sideCls: 't-sec t-bold' },
      { y: 162, h: 56, cls: 'f-seg', lines: ['Peripherals', 'RCC 0x40021000 · FLASH 0x40022000', 'USART2 0x40004400'], base: '0x40000000', side: ['ST fills these in', 'no clock: reads 0, ignores writes'] },
      { y: 274, h: 56, cls: 'f-pri-soft', mem: true, lines: ['SRAM · 12 KB', '.data · .bss · heap · stack', '0x20000000 .. 0x20002FFF'], base: '0x20000000', top: '0x20003000', side: ['RAM (rw) : ORIGIN = 0x20000000, LENGTH = 12K', '_estack = ORIGIN + LENGTH = 0x20003000'] },
      { y: 342, h: 56, cls: 'f-pri-soft', mem: true, lines: ['FLASH · 32 KB', '.isr_vector · .text · .rodata', '0x08000000 .. 0x08007FFF'], base: '0x08000000', side: ['FLASH (rx) : ORIGIN = 0x08000000, LENGTH = 32K', 'reset reads SP and PC from its first 8 bytes'] },
      { y: 406, h: 24, cls: 'f-seg', lines: ['FLASH aliased here on reset'], base: '0x00000000' },
    ];
    s('rect', { x: X, y: 232, width: W, height: 32, rx: 5, class: 'f-none s-muted dash', style: 'opacity: 0.6' }, g);
    T(g, X + W / 2, 248, 'unmapped: reading here is a fault', 't-muted', 'middle');
    T(g, SX, 256, 'link.ld MEMORY block = these two rows', 't-pri t-bold');
    rows.forEach(r => {
      box(g, X, r.y, W, r.h, r.lines.join('\n'), { cls: r.cls, stroke: r.mem ? 'outline-pri' : 'box', lh: 15, rx: 5 });
      T(g, X - 8, r.y + r.h - 8, r.base, 't-fg', 'end');
      if (r.top) T(g, X - 8, r.y + 8, r.top, 't-pri t-bold', 'end');
      if (!r.side) return;
      if (r.mem) arrow(g, SX - 6, r.y + r.h / 2, X + W + 6, r.y + r.h / 2, { cls: 'a-pri' });
      r.side.forEach((l, i) => T(g, SX, r.y + r.h / 2 + (i ? 9 : -9), l, i ? 't-muted' : (r.sideCls || (r.mem ? 't-pri t-bold' : 't-fg'))));
    });
  });

  // Figure 2: base + offset
  fig('addr', () => {
    const GPIO = [['MODER', 0x00], ['OTYPER', 0x04], ['OSPEEDR', 0x08], ['PUPDR', 0x0C], ['IDR', 0x10], ['ODR', 0x14], ['BSRR', 0x18], ['LCKR', 0x1C], ['AFR[0]', 0x20], ['AFR[1]', 0x24], ['BRR', 0x28]];
    const BLK = {
      GPIOA: { base: 0x50000000, type: 'GPIO_TypeDef', regs: GPIO },
      GPIOB: { base: 0x50000400, type: 'GPIO_TypeDef', regs: GPIO },
      RCC: { base: 0x40021000, type: 'RCC_TypeDef', regs: [['CR', 0x00], ['ICSCR', 0x04], ['CFGR', 0x08], ['CIER, CIFR, CICR', 0x18, '+0x18–20'], ['IOPRSTR … APBRSTR2', 0x24, '+0x24–30'], ['IOPENR', 0x34], ['AHBENR', 0x38], ['APBENR1', 0x3C], ['APBENR2', 0x40], ['IOPSMENR … APBSMENR2', 0x44, '+0x44–50'], ['CCIPR', 0x54], ['CSR1', 0x5C], ['CSR2', 0x60]] },
      USART2: { base: 0x40004400, type: 'USART_TypeDef', regs: [['CR1', 0x00], ['CR2', 0x04], ['CR3', 0x08], ['BRR', 0x0C], ['GTPR', 0x10], ['RTOR', 0x14], ['RQR', 0x18], ['ISR', 0x1C], ['ICR', 0x20], ['RDR', 0x24], ['TDR', 0x28], ['PRESC', 0x2C]] },
      FLASH: { base: 0x40022000, type: 'FLASH_TypeDef', regs: [['ACR', 0x00]] },
    };
    const PICK = [
      ['GPIOA', 'ODR', 'The register slide 4 toggles. The compiler builds 0x50000000 once (movs #160, lsls #23) and reaches ODR with ldr and str at offset #20.'],
      ['GPIOB', 'ODR', 'GPIOB uses the same GPIO_TypeDef, 0x400 higher. Only the base changes; ODR is still offset 0x14. This is the LED bar byte.'],
      ['GPIOA', 'MODER', 'MODER is the first word of the struct, offset 0, so its address is the base itself.'],
      ['GPIOA', 'AFR[0]', 'AFR[0] is the ninth word. It selects AF1 for PA2 and PA3.'],
      ['GPIOB', 'BSRR', 'BSRR, the atomic set and reset register, is the seventh word. Lesson 05 uses it.'],
      ['RCC', 'IOPENR', 'The GPIO clock gates. RCC sits in the peripheral region at 0x40021000, unlike GPIO.'],
      ['RCC', 'APBENR1', 'The gate register that holds USART2EN (bit 17).'],
      ['USART2', 'BRR', 'The baud divisor: 417 at 48 MHz and 115 200 baud.'],
      ['USART2', 'TDR', 'Every printf character ends as one store to this address.'],
      ['FLASH', 'ACR', 'The flash wait-state register of slide 16, the first word of the FLASH block. The deck uses no other FLASH register.'],
    ];
    const off2 = v => '0x' + v.toString(16).toUpperCase().padStart(2, '0');
    const g = svg(viz('addr'), 780, 300, { label: 'Base plus offset: a CMSIS register name resolves to the block base plus the register offset in its struct', minWidth: 560 });
    const layer = s('g', {}, g);
    const note = role('addr-note');
    steps(viz('addr-steps'), PICK.map(([b, r]) => b + '->' + r), k => {
      layer.textContent = '';
      const [bn, rn, remark] = PICK[k], B = BLK[bn];
      const off = B.regs.find(r => r[0] === rn)[1], addr = B.base + off;
      box(layer, 20, 22, 360, 36, bn + '->' + rn, { cls: 'f-surface', textCls: 't-fg t-bold t-lg' });
      arrow(layer, 105, 58, 105, 88, { cls: 'a-muted' });
      arrow(layer, 295, 58, 295, 88, { cls: 'a-muted' });
      box(layer, 20, 92, 170, 46, bn + '\n' + hex(B.base), { cls: 'f-pri-soft', textCls: 't-fg', lh: 16 });
      T(layer, 200, 115, '+', 't-fg t-bold t-lg', 'middle');
      box(layer, 210, 92, 170, 46, rn + '\noffset ' + off2(off), { cls: 'f-ter-soft', textCls: 't-fg', lh: 16 });
      T(layer, 105, 152, 'the base, a #define', 't-muted', 'middle');
      T(layer, 295, 152, 'a struct member', 't-muted', 'middle');
      arrow(layer, 105, 164, 150, 188, { cls: 'a-muted' });
      arrow(layer, 295, 164, 250, 188, { cls: 'a-muted' });
      box(layer, 60, 192, 280, 46, hex(addr) + '\nan ordinary ldr / str address', { cls: 'f-pri', textCls: 't-on', lh: 16 });
      T(layer, 200, 258, `ldr r1, [r2, #${off}]   with r2 = ${hex(B.base)}`, 't-fg', 'middle');
      T(layer, 200, 278, 'base in a register, offset inside the instruction', 't-muted', 'middle');
      const CX = 420, CW = 340, RH = 17;
      const words = B.regs.length === 11 ? 'eleven words' : B.regs.length === 12 ? 'twelve registers' : bn === 'RCC' ? 'its whole map' : 'the one register used';
      T(layer, CX, 22, `${B.type} at ${bn}: ${words}`, 't-fg t-bold');
      B.regs.forEach((r, i) => {
        const y = 36 + i * (RH + 2), on = r[0] === rn;
        s('rect', { x: CX, y, width: CW, height: RH, rx: 3, class: on ? 'f-pri' : 'f-seg' }, layer);
        T(layer, CX + 8, y + RH / 2, r[2] || '+' + off2(r[1]), on ? 't-on t-bold' : 't-muted');
        T(layer, CX + 96, y + RH / 2, r[0], on ? 't-on t-bold' : 't-fg');
        T(layer, CX + CW - 8, y + RH / 2, hex(B.base + r[1]), on ? 't-on' : 't-muted', 'end');
      });
      note.textContent = `${bn}->${rn} = ${hex(B.base)} + ${off2(off)} = ${hex(addr)}. ${remark}`;
    });
  });

  // Figure 3: register fields written or polled
  fig('regs', () => {
    const REGS = [
      { step: 'RCC IOPENR', name: 'RCC->IOPENR', addr: 0x40021034, job: 'clock gate, one bit per GPIO port', val: 0x3, hexLabel: 'value',
        fields: [[0, 0, 'GPIOAEN', 'w', '1'], [1, 1, 'GPIOBEN', 'w', '1'], [2, 2, 'C'], [3, 3, 'D'], [5, 5, 'F']],
        row: ['GPIOAEN 0, GPIOBEN 1', '|= 0x00000003', '4a'],
        note: 'One gate bit per GPIO port: A is bit 0, B is bit 1 (C 2, D 3, F 5). (1 << 0) | (1 << 1) = 0x00000003. Until its gate is 1 a port reads back zero and ignores writes, so led_init() sets GPIOAEN before anything else.' },
      { step: 'RCC APBENR1', name: 'RCC->APBENR1', addr: 0x4002103C, job: 'clock gate for APB peripherals', val: 0x20000, hexLabel: 'value',
        fields: [[17, 17, 'USART2EN', 'w', '1'], [1, 1, 'TIM3EN'], [10, 10, 'RTCAPBEN'], [11, 11, 'WWDGEN'], [21, 21, 'I2C1EN'], [27, 27, 'DBGEN'], [28, 28, 'PWREN']],
        row: ['USART2EN 17', '|= 0x00020000', '4a'],
        note: 'USART2EN is bit 17, so 1 << 17 = 0x00020000: hex digit 2 in the nibble of bits 19:16. The same register gates TIM3 (bit 1), I2C1, WWDG and PWR.' },
      { step: 'GPIOA MODER', name: 'GPIOA->MODER', addr: 0x50000000, job: 'mode, 2 bits per pin', val: 0x4A0, hexLabel: 'fields',
        fields: [[11, 10, 'PA5', 'w', '01'], [7, 6, 'PA3', 'w', '10'], [5, 4, 'PA2', 'w', '10']],
        row: ['PA5 11:10 = 01, PA3 7:6 = 10, PA2 5:4 = 10', '0x400, 0xA0 (clear, then set)', '4b'],
        note: 'Two bits per pin, pin n at bits 2n+1:2n. PA5 = 01 (output) is bits 11:10, 1 << 10 = 0x400. PA2 and PA3 = 10 (alternate function) are bits 5:4 and 7:6, 0x20 + 0x80 = 0xA0. Each field is cleared first, then set, so the other pins keep their modes.' },
      { step: 'GPIOA AFR[0]', name: 'GPIOA->AFR[0]', addr: 0x50000020, job: 'alternate function, 4 bits per pin 0–7', val: 0x1100, hexLabel: 'fields',
        fields: [[15, 12, 'PA3 = AF1', 'w', '0001'], [11, 8, 'PA2 = AF1', 'w', '0001']],
        row: ['PA3 15:12 = 1, PA2 11:8 = 1', '0x00001100', '4b'],
        note: 'Four bits per pin for pins 0–7, pin n at bits 4n+3:4n. AF1 on PA2 (bits 11:8) and PA3 (bits 15:12) gives 0x1100. MODER = 10 says a peripheral drives the pin; AFR = 1 says which one, USART2.' },
      { step: 'GPIOB MODER', name: 'GPIOB->MODER', addr: 0x50000400, job: 'mode, 2 bits per pin', val: 0x5555, hexLabel: 'fields',
        fields: [7, 6, 5, 4, 3, 2, 1, 0].map(n => [2 * n + 1, 2 * n, 'PB' + n, 'w', '01']),
        row: ['PB7–PB0 15:0 = 01 each', '0x00005555', '18'],
        note: 'PB0–PB7 all outputs: 01 in each of the eight low fields gives 0101 0101 0101 0101 = 0x5555. ledbar_init() writes this once.' },
      { step: 'GPIOB ODR', name: 'GPIOB->ODR', addr: 0x50000414, job: 'output data, 1 bit per pin', val: 0xA5, hexLabel: 'value',
        fields: [[7, 0, 'the LED bar: one byte', 'w', '10100101']],
        row: ['PB7–PB0 7:0', 'one byte per frame, e.g. 0xA5', '18'],
        note: 'Each frame of a pattern is one byte written to ODR, bit n driving PBn. The example 0xA5 = 1010 0101 lights PB7, PB5, PB2 and PB0. The LEDs go from pin to GND, so 1 = lit.' },
      { step: 'USART2 CR1', name: 'USART2->CR1', addr: 0x40004400, job: 'control, set once', val: 0xD, hexLabel: 'value',
        fields: [[0, 0, 'UE', 'w', '1'], [2, 2, 'RE', 'w', '1'], [3, 3, 'TE', 'w', '1'], [5, 5, 'RXNEIE'], [7, 7, 'TXEIE'], [10, 10, 'PCE'], [12, 12, 'M0'], [15, 15, 'OVER8'], [28, 28, 'M1'], [29, 29, 'FIFOEN']],
        row: ['UE 0, RE 2, TE 3', '0x0000000D', '4c'],
        note: 'UE (bit 0) enables the USART, RE (bit 2) the receiver and TE (bit 3) the transmitter: 1 + 4 + 8 = 0xD. The interrupt enables RXNEIE and TXEIE stay 0, because this lesson polls.' },
      { step: 'USART2 BRR', name: 'USART2->BRR', addr: 0x4000440C, job: 'baud divisor', val: 0x1A1, hexLabel: 'value',
        fields: [[15, 0, 'BRR = 417', 'w', '0000000110100001']],
        row: ['BRR 15:0', '417 = 0x01A1', '4c'],
        note: 'The baud divisor fills bits 15:0. (48 000 000 + 57 600) / 115 200 = 417 = 0x01A1 = 0000 0001 1010 0001.' },
      { step: 'USART2 ISR', name: 'USART2->ISR', addr: 0x4000441C, job: 'status flags, read-only', val: 0x80, hexLabel: 'mask',
        fields: [[7, 7, 'TXE_TXFNF', 'p', '?'], [1, 1, 'FE'], [3, 3, 'ORE'], [5, 5, 'RXNE_RXFNE'], [6, 6, 'TC'], [16, 16, 'BUSY'], [21, 21, 'TEACK']],
        row: ['TXE_TXFNF 7', 'polled, read-only', '4c, 17'],
        note: 'Read-only status. uart2_putc() waits while TXE_TXFNF (bit 7) says the transmit register is still full, then writes the byte to TDR (offset 0x28, bits 8:0).' },
      { step: 'FLASH ACR', name: 'FLASH->ACR', addr: 0x40022000, job: 'flash access control', val: 0x1, hexLabel: 'value',
        fields: [[2, 0, 'LATENCY', 'w', '001'], [8, 8, 'PRFTEN'], [9, 9, 'ICEN'], [11, 11, 'ICRST'], [16, 16, 'PROGEMPTY'], [18, 18, 'DBG_SWEN']],
        row: ['LATENCY 2:0 = 001', '1 wait state', '16'],
        note: 'LATENCY (bits 2:0) = 001, one flash wait state. SystemInit() writes it first and waits until it reads back, before it raises the clock.' },
      { step: 'RCC CR', name: 'RCC->CR', addr: 0x40021000, job: 'oscillators and the HSI divider', val: 0x3800, hexLabel: 'clear mask',
        fields: [[13, 11, 'HSIDIV', 'w', '000'], [10, 10, 'HSIRDY', 'p', '?'], [7, 5, 'HSIKERDIV'], [8, 8, 'HSION'], [9, 9, 'HSIKERON'], [16, 16, 'HSEON'], [17, 17, 'HSERDY'], [18, 18, 'HSEBYP'], [19, 19, 'CSSON']],
        row: ['HSIDIV 13:11 = 000, HSIRDY 10', 'clear mask 0x3800, then poll', '16'],
        note: 'RCC->CR &= ~RCC_CR_HSIDIV clears HSIDIV (bits 13:11, mask 0x3800) to 000, divide by 1. Then SystemInit() polls HSIRDY (bit 10). At reset HSIDIV divides HSI48 by 4, which gives 12 MHz.' },
    ];
    const X0 = 50, CW = 21, NG = 4, CY = 76, CHt = 28;
    const bx = b => X0 + (31 - b) * CW + Math.floor((31 - b) / 4) * NG;
    const g = svg(viz('regs'), 780, 160, { label: '32-bit register with the fields this lesson writes or polls', minWidth: 600 });
    const layer = s('g', {}, g);
    const tbl = table(viz('regs-table'), ['Register', 'Address', 'Field, bits', 'Written', 'Slide'].map(t => ({ text: t, cls: 'l' })),
      REGS.map(r => [r.name, hex(r.addr), ...r.row].map(c => ({ text: c, cls: 'l' }))));
    const note = role('regs-note');
    steps(viz('regs-steps'), REGS.map(r => r.step), k => {
      layer.textContent = '';
      const R = REGS[k];
      T(layer, X0, 14, `${R.name} · ${hex(R.addr)} · ${R.job}`, 't-fg t-bold');
      const at = b => R.fields.find(f => b <= f[0] && b >= f[1]);
      for (let b = 0; b < 32; b++) {
        const f = at(b), x = bx(b);
        const cls = !f ? 'f-seg' : f[3] === 'w' ? 'f-pri' : f[3] === 'p' ? 'f-ter' : 'f-seg';
        s('rect', { x, y: CY, width: CW - 2, height: CHt, rx: 2, class: cls, style: f ? null : 'opacity: 0.45' }, layer);
        if (f && f[3]) T(layer, x + (CW - 2) / 2, CY + CHt / 2, f[3] === 'w' ? f[4][f[0] - b] : '?', 't-on t-bold', 'middle');
        T(layer, x + (CW - 2) / 2, CY + CHt + 12, String(b), 't-sm', 'middle');
      }
      // stack labels in up to three rows so neighbouring narrow fields never overlap
      const rowsY = [62, 48, 34], lastRight = [-1e9, -1e9, -1e9];
      R.fields.slice().sort((a, c) => c[0] - a[0]).forEach(f => {
        const x1 = bx(f[0]), x2 = bx(f[1]) + CW - 2, cx = (x1 + x2) / 2;
        const w = f[2].length * (f[3] ? 6.8 : 6.1), left = cx - w / 2;
        let r = lastRight.findIndex(e => e + 5 <= left);
        if (r < 0) r = lastRight.indexOf(Math.min(...lastRight));
        lastRight[r] = cx + w / 2;
        const cls = f[3] === 'w' ? 't-pri t-bold' : f[3] === 'p' ? 't-ter t-bold' : 't-muted t-sm';
        s('line', { x1: x1 + 1, x2: x2 - 1, y1: 70, y2: 70, class: f[3] === 'w' ? 's-pri' : f[3] === 'p' ? 's-ter' : 's-muted', style: 'stroke-width: 1.5' }, layer);
        if (r > 0) s('line', { x1: cx, x2: cx, y1: rowsY[r] + 6, y2: 70, class: 's-line' }, layer);
        T(layer, cx, rowsY[r], f[2], cls, 'middle');
      });
      T(layer, X0 - 8, CY + CHt + 12, 'bit', 't-sm', 'end');
      T(layer, X0 - 8, CY + CHt + 36, R.hexLabel === 'value' || R.hexLabel === 'fields' ? 'hex' : 'mask', 't-sm', 'end');
      for (let n = 0; n < 8; n++) {
        const d = (R.val >>> (4 * n)) & 0xF, cx = (bx(4 * n + 3) + bx(4 * n) + CW - 2) / 2;
        T(layer, cx, CY + CHt + 36, d.toString(16).toUpperCase(), d ? 't-pri t-bold t-lg' : 't-muted t-lg', 'middle');
      }
      tbl.rows.forEach((tr, i) => tr.classList.toggle('on', i === k));
      note.textContent = `${R.name} at ${hex(R.addr)}, ${R.hexLabel} ${hex(R.val)}. ${R.note}`;
    });
  });

  // Figure 4: vector table and the slot of IRQ n
  fig('vectors', () => {
    const SYS = { 0: 'SP value', 1: 'Reset', 2: 'NMI', 3: 'HardFault', 11: 'SVCall', 14: 'PendSV', 15: 'SysTick' };
    const IRQ = { 0: 'WWDG', 5: 'EXTI0_1', 7: 'EXTI4_15', 16: 'TIM3', 28: 'USART2' };
    const X = 110, CWd = 80, RH = 42, Y = 34;
    const g = svg(viz('vectors'), 780, 300, { label: 'The 45-entry vector table at 0x08000000, eight 4-byte entries per row, with the chosen IRQ highlighted', minWidth: 560 });
    for (let c = 0; c < 8; c++) T(g, X + c * CWd + 38, 22, '+0x' + (c * 4).toString(16).toUpperCase().padStart(2, '0'), 't-sm', 'middle');
    for (let r = 0; r < 6; r++) T(g, X - 8, Y + r * RH + 18, hex(0x08000000 + r * 32), 't-fg', 'end');
    const cells = [];
    for (let i = 0; i < 45; i++) {
      const x = X + (i % 8) * CWd, y = Y + Math.floor(i / 8) * RH;
      const reserved = (i >= 4 && i <= 10) || i === 12 || i === 13;
      const cls = i === 0 ? 'f-ter-soft' : i < 16 ? (reserved ? 'f-seg' : 'f-sec-soft') : 'f-pri-soft';
      const tc = reserved ? 't-muted' : 't-fg';
      const rect = s('rect', { x, y, width: 76, height: 36, rx: 4, class: cls }, g);
      const t1 = T(g, x + 38, y + 11, i >= 16 ? `${i} · IRQ${i - 16}` : String(i), tc + ' t-sm', 'middle');
      const t2 = T(g, x + 38, y + 25, i < 16 ? (reserved ? 'reserved' : SYS[i]) : (IRQ[i - 16] || ''), tc, 'middle');
      cells.push({ rect, cls, t1, t2, tc });
    }
    const ex = X + 5 * CWd, ey = Y + 5 * RH;
    s('rect', { x: ex, y: ey, width: 3 * CWd - 4, height: 36, rx: 4, class: 'f-none s-muted dash', style: 'opacity: 0.7' }, g);
    T(g, ex + (3 * CWd - 4) / 2, ey + 18, '.text starts at 0x080000B4', 't-muted', 'middle');
    let prev = null;
    slider(viz('vec-slider'), { label: 'IRQ n', min: 0, max: 28, step: 1, value: 16 }, n => {
      if (prev) {
        prev.rect.setAttribute('class', prev.cls);
        prev.t1.setAttribute('class', prev.tc + ' t-sm');
        prev.t2.setAttribute('class', prev.tc);
      }
      const v = 16 + n, c = cells[v], a = 0x08000000 + 4 * v;
      c.rect.setAttribute('class', 'f-pri');
      c.t1.setAttribute('class', 't-on t-sm t-bold');
      c.t2.setAttribute('class', 't-on t-bold');
      prev = c;
      role('vec-num').textContent = String(v);
      role('vec-addr').textContent = hex(a);
      const row = 0x08000000 + 32 * Math.floor(v / 8), col = 4 * (v % 8);
      role('vec-calc').textContent = [
        `vector  = 16 + n = 16 + ${n} = ${v}` + (IRQ[n] ? `   (${IRQ[n]})` : ''),
        `address = 0x08000000 + ${v} × 4 = 0x08000000 + ${4 * v} (0x${(4 * v).toString(16).toUpperCase()}) = ${hex(a)}`,
        `in the dump: row ${hex(row)}, column +0x${col.toString(16).toUpperCase().padStart(2, '0')}`,
      ].join('\n');
    });
  });

  // Figure 5: decoding the first record, and what the core loads
  fig('decode', () => {
    const BY = ['00', '30', '00', '20', 'C5', '06', '00', '08', '79', '06', '00', '08', '79', '06', '00', '08'];
    const g = svg(viz('decode'), 740, 318, { label: 'The first 16 bytes of Main.hex grouped into little-endian words: initial SP, Reset_Handler with the Thumb bit, and two Default_Handler entries', minWidth: 560 });
    const BW = 38, wx = i => 30 + i * 172, bxx = (i, j) => wx(i) + j * 40;
    const head = s('g', { class: 'fade' }, g);
    T(head, 370, 10, ':10 0000 00  00300020 C5060008 79060008 79060008  BF', 't-fg t-bold', 'middle');
    T(head, 370, 27, 'count 0x10 · address 0000 = 0x08000000 · type 00 data · 16 data bytes · checksum', 't-muted t-sm', 'middle');
    const byteG = [], wordG = [];
    for (let i = 0; i < 4; i++) {
      const bg = s('g', { class: 'fade' }, g);
      byteG.push(bg);
      for (let j = 0; j < 4; j++) {
        const k = i * 4 + j, x = bxx(i, j);
        T(bg, x + BW / 2, 48, '+' + k.toString(16).toUpperCase(), 't-sm', 'middle');
        s('rect', { x, y: 56, width: BW, height: 28, rx: 3, class: 'f-pri-soft' }, bg);
        T(bg, x + BW / 2, 70, BY[k], 't-fg t-bold', 'middle');
      }
    }
    const word = i => '0x' + BY.slice(4 * i, 4 * i + 4).reverse().join('');
    const drawWord = (grp, i) => {
      s('rect', { x: wx(i) - 3, y: 110, width: 164, height: 52, rx: 5, class: 'f-surface box' }, grp);
      for (let j = 0; j < 4; j++) {
        s('line', { x1: bxx(i, j) + BW / 2, y1: 86, x2: bxx(i, 3 - j) + BW / 2, y2: 114, class: 's-muted', style: 'stroke-width: 1' }, grp);
        s('rect', { x: bxx(i, j), y: 114, width: BW, height: 22, rx: 3, class: 'f-seg' }, grp);
        T(grp, bxx(i, j) + BW / 2, 125, BY[4 * i + 3 - j], 't-fg', 'middle');
      }
      T(grp, wx(i) + 79, 150, `word ${i} = ${word(i)}`, 't-pri t-bold', 'middle');
      arrow(grp, wx(i) + 79, 162, wx(i) + 79, 180, { cls: 'a-muted' });
    };
    for (let i = 0; i < 2; i++) {
      const grp = s('g', { class: 'fade' }, g);
      wordG.push(grp);
      drawWord(grp, i);
      box(grp, wx(i), 182, 158, 44, i === 0 ? 'SP ← 0x20003000\ntop of 12 KB RAM' : 'PC ← 0x080006C5\nReset_Handler', { cls: 'f-pri', textCls: 't-on', lh: 16 });
    }
    const w23 = s('g', { class: 'fade' }, g);
    drawWord(w23, 2);
    drawWord(w23, 3);
    box(w23, wx(2), 182, wx(3) + 158 - wx(2), 44, 'NMI and HardFault: both 0x08000679\nthe one weak Default_Handler (0x08000678)', { cls: 'f-sec-soft', textCls: 't-fg', lh: 16 });
    const th = s('g', { class: 'fade' }, g);
    T(th, 30, 270, 'low byte of word 1, C5 =', 't-fg');
    T(th, 30, 288, 'bit', 't-sm');
    const bits = (0xC5).toString(2).padStart(8, '0');
    for (let j = 0; j < 8; j++) {
      const x = 210 + j * 26, b = 7 - j, t = b === 0;
      s('rect', { x, y: 256, width: 24, height: 26, rx: 3, class: t ? 'f-ok' : 'f-seg' }, th);
      T(th, x + 12, 269, bits[j], t ? 't-on t-bold' : 't-fg', 'middle');
      T(th, x + 12, 292, String(b), 't-sm', 'middle');
    }
    T(th, 432, 262, 'bit 0 = T = 1: Thumb code', 't-ok t-bold');
    T(th, 432, 280, 'address = bits 31:1 = 0x080006C4', 't-fg');
    const FOCUS = [
      null,
      [head, ...byteG],
      [byteG[0], wordG[0]],
      [byteG[1], wordG[1]],
      [wordG[1], th],
      [byteG[2], byteG[3], w23],
    ];
    const NOTES = [
      'All of it: 16 bytes at 0x08000000 become four words. On reset the core loads word 0 into SP and word 1 into PC before any instruction runs. Pick a step to follow one part.',
      'Record 2 of Main.hex: byte count 0x10 (16 bytes), load address 0000 (the start of FLASH, 0x08000000), record type 00 (data), the 16 data bytes, checksum BF. The bytes sit at increasing addresses, +0 to +F.',
      'Word 0 is the bytes 00 30 00 20. ARM is little-endian: the byte at the lowest address is the least significant, so the group reads right to left, 0x20003000. The core loads it into SP. It is 0x20000000 + 0x3000, the top of 12 KB of RAM, computed by the linker as _estack.',
      'Word 1 is C5 06 00 08, read right to left 0x080006C5. The core loads it into PC and starts fetching Reset_Handler. The first instruction already has a valid stack, so Reset_Handler can be written in C.',
      'nm reports Reset_Handler at 0x080006C4, but the table holds 0x080006C5. Bit 0 is the Thumb bit: the core reads it as "this target is Thumb code" and takes the address from bits 31:1. An even entry here faults on the first instruction.',
      'Words 2 and 3, NMI_Handler and HardFault_Handler, are both 0x08000679. Both are weak aliases of one Default_Handler at 0x08000678, so they share one address. Slide 8 explains why that matters.',
    ];
    const all = [head, ...byteG, ...wordG, w23, th];
    const note = role('dec-note');
    steps(viz('dec-steps'), ['All', '1 · bytes', '2 · word 0 → SP', '3 · word 1 → PC', '4 · Thumb bit', '5 · words 2, 3'], k => {
      all.forEach(el => el.classList.toggle('dim', !!FOCUS[k] && FOCUS[k].indexOf(el) < 0));
      note.textContent = NOTES[k];
    });
  });

  // Figure 6: weak alias resolution for vector 32
  fig('weak', () => {
    const g = svg(viz('weak'), 780, 196, { label: 'How the linker fills vector 32: a correctly spelled strong handler replaces the weak alias; a misspelled one leaves Default_Handler', minWidth: 560 });
    const layer = s('g', {}, g);
    const CASES = [
      { pre: 'void TIM3_IRQHandler(void) { ... }', bad: '', post: '', mineCls: 't-ok', nm: ['nm Main.elf:', 'T TIM3_IRQHandler', 'strong, yours: it wins'], slot: 'your handler, odd', target: 'TIM3_IRQHandler\nruns your code', tcls: 'f-ok-soft',
        note: 'Spelled right: your strong definition replaces the weak alias at link time, and the linker writes its address, with the Thumb bit set, into vector 32. The name is the registration.' },
      { pre: 'void TIM3_IRQ', bad: 'h', post: 'andler(void) { ... }', mineCls: 't-fg', nm: ['nm Main.elf:', 'W TIM3_IRQHandler', 'TIM3_IRQhandler: unused,', 'removed as dead code'], slot: '0x08000679', target: 'Default_Handler\nfor (;;) { }: parks', tcls: 'f-bad-soft',
        note: 'One letter wrong: it compiles, links and runs, with no warning. TIM3_IRQhandler is a new function nobody calls. The weak alias still fills vector 32, so the first TIM3 interrupt parks the board in Default_Handler.' },
      { pre: '(no TIM3 handler written)', bad: '', post: '', mineCls: 't-muted', nm: ['nm Main.elf:', 'W TIM3_IRQHandler', 'still the weak default'], slot: '0x08000679', target: 'Default_Handler\nfor (;;) { }: parks', tcls: 'f-bad-soft',
        note: 'No handler at all gives the same table as the typo. This lesson defines no TIM3 handler, so vector 32 holds 0x08000679, the same Default_Handler as NMI and HardFault.' },
    ];
    const note = role('weak-note');
    steps(viz('weak-steps'), ['Spelled right', 'One letter wrong', 'No handler'], k => {
      layer.textContent = '';
      const C = CASES[k];
      box(layer, 16, 20, 290, 60, 'startup.c\nvoid TIM3_IRQHandler(void) WEAK_ALIAS;\nweak: a default, alias of Default_Handler', { cls: 'f-sec-soft', textCls: 't-fg', lh: 16 });
      s('rect', { x: 16, y: 108, width: 290, height: 60, rx: 6, class: 'f-surface box' }, layer);
      T(layer, 161, 124, 'your timer code', 't-fg', 'middle');
      const code = s('text', { x: 161, y: 148, dy: '0.35em', 'text-anchor': 'middle', class: C.mineCls + ' t-bold' }, layer, C.pre);
      if (C.bad) {
        s('tspan', { class: 't-bad', style: 'text-decoration: underline' }, code, C.bad);
        s('tspan', {}, code, C.post);
      }
      box(layer, 342, 30, 208, 128, C.nm.join('\n'), { cls: 'f-seg', textCls: 't-fg', lh: 18 });
      T(layer, 446, 18, 'the linker resolves names', 't-muted', 'middle');
      box(layer, 590, 20, 174, 50, 'vector 32 · 0x08000080\nholds ' + C.slot, { cls: 'f-pri-soft', textCls: 't-fg', lh: 16 });
      box(layer, 590, 108, 174, 60, C.target, { cls: C.tcls, textCls: 't-fg t-bold', lh: 18 });
      arrow(layer, 308, 50, 340, 76, { cls: 'a-muted' });
      arrow(layer, 308, 138, 340, 112, { cls: k === 0 ? 'a-ok' : 'a-muted', dash: k !== 0 });
      arrow(layer, 552, 94, 588, 50, { cls: 'a-muted' });
      arrow(layer, 677, 70, 677, 106, { cls: k === 0 ? 'a-ok' : 'a-bad' });
      T(layer, 677, 186, 'when TIM3 fires', 't-muted', 'middle');
      note.textContent = C.note;
    });
  });

  // Figure 7: Reset_Handler step-through
  fig('boot', () => {
    const g = svg(viz('boot'), 800, 312, { label: 'Reset_Handler step by step: FLASH and RAM with the .data copy, the .bss zero, the clock switch and the call to main', minWidth: 600 });
    const FX = 20, FW = 230, RX = 330, RW = 240, CX = 600;
    T(g, FX, 12, 'FLASH: where .data is stored (LMA)', 't-fg t-bold');
    T(g, RX, 12, 'RAM: where it runs (VMA)', 't-fg t-bold');
    T(g, CX, 12, 'Reset_Handler', 't-fg t-bold');
    s('rect', { x: FX, y: 26, width: FW, height: 30, rx: 5, class: 'f-none s-muted dash', style: 'opacity: 0.6' }, g);
    T(g, FX + FW / 2, 41, 'free, up to 0x08007FFF', 't-muted', 'middle');
    s('rect', { x: FX, y: 64, width: FW, height: 88, rx: 5, class: 'f-pri-soft outline-pri' }, g);
    T(g, FX + 10, 78, '.data, stored copy · 100 B', 't-pri t-bold');
    T(g, FX + 10, 95, '_sidata = 0x08001D64', 't-fg');
    [['data_witness', '0x00C0FFEE'], ['SystemCoreClock', '12000000']].forEach(([n, v], i) => {
      const y = 106 + i * 22;
      s('rect', { x: FX + 8, y, width: FW - 16, height: 18, rx: 3, class: 'f-surface' }, g);
      T(g, FX + 14, y + 9, n, 't-fg');
      T(g, FX + FW - 14, y + 9, v, 't-fg', 'end');
    });
    box(g, FX, 160, FW, 28, '.rodata · 1652 B · 0x080016E8', { cls: 'f-seg', textCls: 't-fg', rx: 5 });
    box(g, FX, 196, FW, 40, '.text · 5684 B · 0x080000B4\nReset_Handler, main, ...', { cls: 'f-seg', textCls: 't-fg', rx: 5, lh: 15 });
    box(g, FX, 244, FW, 28, '.isr_vector · 180 B · 0x08000000', { cls: 'f-seg', textCls: 't-fg', rx: 5 });

    box(g, RX, 26, RW, 36, 'stack, down from _estack = 0x20003000', { cls: 'f-ter-soft', textCls: 't-fg', rx: 5 });
    s('rect', { x: RX, y: 70, width: RW, height: 30, rx: 5, class: 'f-none s-muted dash', style: 'opacity: 0.6' }, g);
    T(g, RX + RW / 2, 85, 'free: heap grows up, stack down', 't-muted', 'middle');
    box(g, RX, 108, RW, 28, 'heap from end = 0x200001D8 (_sbrk)', { cls: 'f-seg', textCls: 't-fg', rx: 5 });
    const blocks = [
      { y: 144, title: '.bss · 0x20000064 .. 0x200001D8', vars: ['bss_witness', 'frame_count'] },
      { y: 216, title: '.data · 0x20000000 .. 0x20000064', vars: ['data_witness', 'SystemCoreClock'] },
    ];
    const vals = {};
    blocks.forEach((b, bi) => {
      s('rect', { x: RX, y: b.y, width: RW, height: 64, rx: 5, class: bi ? 'f-pri-soft outline-pri' : 'f-seg box' }, g);
      T(g, RX + 10, b.y + 13, b.title, bi ? 't-pri t-bold' : 't-fg t-bold');
      b.vars.forEach((n, i) => {
        const y = b.y + 24 + i * 20;
        s('rect', { x: RX + 8, y, width: RW - 16, height: 17, rx: 3, class: 'f-surface' }, g);
        T(g, RX + 14, y + 8.5, n, 't-fg');
        vals[n] = T(g, RX + RW - 14, y + 8.5, '', 't-fg', 'end');
      });
    });
    T(g, RX, 296, '_sdata = 0x20000000, the bottom of RAM', 't-muted');
    const copyA = arrow(g, FX + FW + 4, 108, RX - 4, 250, { cls: 'a-pri', width: 2, label: 'copy 100 B', dx: -14, dy: -10 });
    const zeroT = T(g, (FX + FW + RX) / 2, 176, 'write 0s', 't-ok t-bold', 'middle');
    const zeroT2 = T(g, (FX + FW + RX) / 2, 192, '372 B', 't-ok', 'middle');
    copyA.classList.add('fade');
    [zeroT, zeroT2].forEach(t => t.classList.add('fade'));

    const LINES = ['SP, PC loaded by the core', 'src = &_sidata;', 'for (dst = &_sdata; ...)', 'for (dst = &_sbss; ...)', 'SystemInit();', '__libc_init_array();', '(void)main();', 'for (;;) { }'];
    const LINE_STEP = [0, 1, 1, 2, 3, 4, 5, 5];
    const hl = s('g', {}, g);
    LINES.forEach((l, i) => T(g, CX + 8, 36 + i * 24, l, i ? 't-fg' : 't-muted'));
    T(g, CX, 238, 'CPU clock', 't-muted');
    const clk = T(g, CX, 256, '', 't-fg t-bold');
    const done = T(g, CX, 280, '', 't-ok t-bold');
    const UNK = '????????';
    const STATE = [
      { data_witness: UNK, SystemCoreClock: UNK, bss_witness: UNK, frame_count: UNK },
      { data_witness: '0x00C0FFEE', SystemCoreClock: '12000000', bss_witness: UNK, frame_count: UNK },
      { data_witness: '0x00C0FFEE', SystemCoreClock: '12000000', bss_witness: '0x00000000', frame_count: '0' },
      { data_witness: '0x00C0FFEE', SystemCoreClock: '48000000', bss_witness: '0x00000000', frame_count: '0' },
    ];
    const CHANGED = [[], ['data_witness', 'SystemCoreClock'], ['bss_witness', 'frame_count'], ['SystemCoreClock'], [], []];
    const NOTES = [
      'Reset: the core has loaded SP = 0x20003000 and PC = Reset_Handler from the vector table. RAM holds whatever it held: random after power-on, the previous program\'s data after a warm reset. None of C\'s promises is kept yet, and the clock is 12 MHz.',
      'Step 1 copies .data from its stored copy in FLASH (_sidata = 0x08001D64) to where it runs, &_sdata = 0x20000000 up to &_edata = 0x20000064: 100 bytes, 25 words. data_witness now reads 0x00C0FFEE and SystemCoreClock 12000000.',
      'Step 2 writes 0 to every word from &_sbss = 0x20000064 to &_ebss = 0x200001D8: 372 bytes, 93 words. bss_witness and frame_count are now 0. .bss has no copy in FLASH, only a size.',
      'Step 3, SystemInit(), sets one flash wait state, switches HSIDIV to ÷1 and writes SystemCoreClock = 48000000. SystemCoreClock lives in .data, so the copy had to run first, or it would put 12000000 back.',
      'Step 4, __libc_init_array(), runs the C++ constructors and the functions marked __attribute__((constructor)). Nothing in RAM changes for this lesson.',
      'Step 5 calls main() with every promise kept: .data copied, .bss zeroed, the clock at 48 MHz. If main() ever returns, for (;;) stops the core from running into whatever bytes follow in FLASH. "The infinite loop is a wall."',
    ];
    const note = role('boot-note');
    steps(viz('boot-steps'), ['Reset', '1 · copy .data', '2 · zero .bss', '3 · SystemInit', '4 · constructors', '5 · main()'], k => {
      const st = STATE[Math.min(k, 3)];
      Object.keys(vals).forEach(n => {
        vals[n].textContent = st[n];
        vals[n].setAttribute('class', st[n] === UNK ? 't-bad t-bold' : CHANGED[k].indexOf(n) >= 0 ? 't-ok t-bold' : 't-fg');
      });
      copyA.classList.toggle('dim', k !== 1);
      [zeroT, zeroT2].forEach(t => t.classList.toggle('dim', k !== 2));
      hl.textContent = '';
      LINE_STEP.forEach((sk, i) => {
        if (sk === k) s('rect', { x: CX, y: 36 + i * 24 - 10, width: 192, height: 20, rx: 3, class: 'f-pri-soft' }, hl);
      });
      clk.textContent = k >= 3 ? '48 MHz (HSI48 ÷ 1)' : '12 MHz (HSI48 ÷ 4)';
      clk.setAttribute('class', k === 3 ? 't-ok t-bold' : 't-fg t-bold');
      done.textContent = k === 5 ? 'main() can trust its globals' : '';
      note.textContent = NOTES[k];
    }, 5);
  });

  // Figure 8: linker symbols are addresses
  fig('sym', () => {
    const g = svg(viz('sym'), 720, 190, { label: 'Linker symbols _sdata and _edata are flags on the address line; reading them without an ampersand reads the words stored there', minWidth: 560 });
    const layer = s('g', {}, g);
    const ADDR = ['0x20000000', '0x20000004', '0x20000008', '…', '0x2000005C', '0x20000060', '0x20000064', '0x20000068'];
    const X = 40, W = 80, Y = 80;
    const EXPR = [
      { label: '&_sdata', touch: 'flag', at: [0], res: '&_sdata  →  0x20000000', cls: 't-ok',
        note: '&_sdata is the value of the symbol: the address the linker chose, 0x20000000. This is what the copy loop needs.' },
      { label: '_sdata', touch: 'cell', at: [0], res: '_sdata  →  the word stored at 0x20000000', cls: 't-bad',
        note: '_sdata without & reads the four bytes at 0x20000000, the first .data variable, whatever it is. It compiles cleanly, with no warning, and the value is garbage for this purpose.' },
      { label: '_edata − _sdata', touch: 'cell', at: [0, 6], res: '_edata − _sdata  →  word at …64 − word at …00', cls: 't-bad',
        note: 'The slide\'s WRONG line. It subtracts two memory contents, the word after .data minus the first word of .data. The result means nothing.' },
      { label: '&_edata − &_sdata', touch: 'flag', at: [0, 6], res: '&_edata − &_sdata  →  25 (words)', cls: 't-fg',
        note: 'Both are uint32_t pointers, so C pointer arithmetic divides the byte distance by 4: (0x20000064 − 0x20000000) / 4 = 100 / 4 = 25 words. Right for a word loop, wrong if you wanted bytes.' },
      { label: '(uintptr_t) difference', touch: 'flag', at: [0, 6], res: '(uintptr_t)&_edata − (uintptr_t)&_sdata  →  100 (bytes)', cls: 't-ok',
        note: 'Cast both addresses to integers first: 0x20000064 − 0x20000000 = 0x64 = 100 bytes, the .data size Main.c prints.' },
    ];
    const note = role('sym-note');
    steps(viz('sym-steps'), EXPR.map(e => e.label), k => {
      layer.textContent = '';
      const E = EXPR[k];
      ADDR.forEach((a, i) => {
        const x = X + i * W, gap = a === '…', on = E.touch === 'cell' && E.at.indexOf(i) >= 0;
        s('rect', { x, y: Y, width: W - 4, height: 34, rx: 3, class: on ? 'f-bad-soft' : gap ? 'f-none' : i < 6 ? 'f-pri-soft' : 'f-seg' }, layer);
        if (on) s('rect', { x, y: Y, width: W - 4, height: 34, rx: 3, class: 'f-none s-bad', style: 'stroke-width: 2' }, layer);
        T(layer, x + (W - 4) / 2, Y + 17, gap ? '…' : i < 6 ? '.data word' : '.bss word', on ? 't-bad t-bold' : 't-fg', 'middle');
        if (!gap) T(layer, x + (W - 4) / 2, Y + 48, a, 't-sm', 'middle');
      });
      s('line', { x1: X, x2: X + 8 * W, y1: Y + 38, y2: Y + 38, class: 'l-axis' }, layer);
      [[0, '_sdata = 0x20000000'], [6, '_edata = _sbss = 0x20000064']].forEach(([i, l]) => {
        const x = X + i * W - 2, on = E.touch === 'flag' && E.at.indexOf(i) >= 0;
        s('line', { x1: x, x2: x, y1: 36, y2: Y + 38, class: on ? 's-ok' : 's-muted', style: on ? 'stroke-width: 2.5' : 'stroke-width: 1.5' }, layer);
        s('polygon', { points: `${x},28 ${x + 12},33 ${x},38`, class: on ? 'f-ok' : 'f-muted' }, layer);
        T(layer, x + 16, 33, l, on ? 't-ok t-bold' : 't-fg', 'start');
      });
      T(layer, X, 18, 'symbols: labels the linker puts on addresses, no storage', 't-muted');
      T(layer, X, 166, E.res, E.cls + ' t-bold t-lg');
      note.textContent = E.note;
    });
  });

  // Figure 9: the location counter through link.ld
  fig('ld', () => {
    const g = svg(viz('ld'), 780, 280, { label: 'The linker location counter placing sections in FLASH then RAM, with the boundary addresses and linker symbols', minWidth: 600 });
    const X0 = 40;
    const FL = [['.isr_vector', '180 B', 92], ['.text', '5684 B', 176], ['.rodata', '1652 B', 120], ['4 + 4', '8 B', 46], ['.data copy', '100 B', 86], ['free', '25144 B', 180]];
    const RM = [['.data', '100 B', 86], ['.bss', '372 B', 120], ['heap', '512 B', 96], ['stack room', '1024 B', 130], ['free', '10280 B', 268]];
    const FB = [0x08000000, 0x080000B4, 0x080016E8, 0x08001D5C, 0x08001D64, 0x08001DC8, 0x08008000];
    const RB = [0x20000000, 0x20000064, 0x200001D8, 0x200003D8, 0x200007D8, 0x20003000];
    const lay = (list, y, bounds, rowsY) => {
      let x = X0;
      const xs = [x], rects = [];
      list.forEach(([n, sz, w], i) => {
        const free = n === 'free';
        const r = s('rect', { x, y, width: w, height: 36, class: (free ? 'f-none s-muted dash' : 'f-pri-soft sep') + ' fade', style: free ? 'opacity: 0.6' : null }, g);
        const t1 = T(g, x + w / 2, y + 12, n, (free ? 't-muted' : 't-fg t-bold') + ' fade', 'middle');
        const t2 = T(g, x + w / 2, y + 26, sz, 't-muted t-sm fade', 'middle');
        rects.push([r, t1, t2]);
        x += w;
        xs.push(x);
      });
      bounds.forEach((b, i) => {
        const bx = xs[i], ry = rowsY[i % 2];
        s('line', { x1: bx, x2: bx, y1: y + 36, y2: ry - 6, class: 's-line' }, g);
        T(g, bx, ry, hex(b), 't-sm', i === 0 ? 'start' : i === bounds.length - 1 ? 'end' : 'middle');
      });
      return { xs, rects };
    };
    T(g, X0, 12, 'FLASH · 0x08000000, 32 KB · used 7624 B = 23.27%', 't-fg t-bold');
    const F = lay(FL, 44, FB, [92, 106]);
    T(g, X0, 150, 'RAM · 0x20000000, 12 KB · used 2008 B = 16.34%', 't-fg t-bold');
    const R = lay(RM, 180, RB, [228, 242]);
    const flag = (x, y, l, anchor) => {
      s('line', { x1: x, x2: x, y1: y + 5, y2: y + 12, class: 's-pri', style: 'stroke-width: 1.5' }, g);
      T(g, x, y, l, 't-pri t-bold t-sm', anchor || 'middle');
    };
    flag(F.xs[4], 32, '_sidata = LOADADDR(.data)');
    flag(R.xs[0], 168, '_sdata', 'start');
    flag(R.xs[1], 168, '_edata = _sbss');
    flag(R.xs[2], 168, '_ebss = end');
    flag(R.xs[5], 168, '_estack: SP starts here, grows down', 'end');
    const cur = s('g', {}, g);
    const tbl = table(viz('ld-table'), ['section', 'size', 'addr (size -A)', 'region'].map((t, i) => ({ text: t, cls: i === 0 || i === 3 ? 'l' : '' })), [
      ['.isr_vector', '180', '0x08000000', 'FLASH'],
      ['.text', '5684', '0x080000b4', 'FLASH'],
      ['.rodata', '1652', '0x080016e8', 'FLASH'],
      ['.data', '100', '0x20000000', 'RAM, stored in FLASH'],
      ['.bss', '372', '0x20000064', 'RAM'],
      ['._user_heap_stack', '1536', '0x20000218 *', 'RAM'],
    ].map(r => r.map((c, i) => ({ text: c, cls: i === 0 || i === 3 ? 'l' : '' }))));
    // [flash blocks shown, ram blocks shown, current flash block, current ram blocks, flash dot, ram dot, table row]
    const STEPS = [
      { f: 6, r: 5, cf: [], cr: [], fd: null, rd: null, row: -1,
        ld: 'FLASH = 180 + 5684 + 1652 + 4 + 4 + 100 = 7624 B   (23.27% of 32 KB)\nRAM   = 100 + 372 + 1536             = 2008 B   (16.34% of 12 KB)\n* size -A prints 0x20000218; the sums and the serial report give 0x200001D8',
        note: 'The finished layout. FLASH holds the vectors, code, constants and the stored copy of .data. RAM holds .data, .bss and the heap and stack room. Step through to watch the dot place each section.' },
      { f: 1, r: 0, cf: [0], cr: [], fd: 1, rd: null, row: 0,
        ld: '.isr_vector : { . = ALIGN(4); KEEP(*(.isr_vector)) . = ALIGN(4); } >FLASH\n/* . = 0x08000000 + 180 = 0x080000B4 */',
        note: '.isr_vector is placed first, so it lands at the start of FLASH, 0x08000000, where the core reads SP and PC. KEEP() stops --gc-sections from deleting a table no code references.' },
      { f: 2, r: 0, cf: [1], cr: [], fd: 2, rd: null, row: 1,
        ld: '.text : { *(.text) *(.text*) ... _etext = .; } >FLASH\n/* . = 0x080000B4 + 5684 = 0x080016E8 */',
        note: '.text starts where the dot stopped, 0x080000B4, right after the 180-byte table, and moves the dot on by 5684.' },
      { f: 3, r: 0, cf: [2], cr: [], fd: 3, rd: null, row: 2,
        ld: '.rodata : { *(.rodata) *(.rodata*) } >FLASH\n/* . = 0x080016E8 + 1652 = 0x08001D5C */',
        note: 'const data goes to FLASH only. It is read in place and costs no RAM.' },
      { f: 4, r: 0, cf: [3], cr: [], fd: 4, rd: null, row: -1,
        ld: '/* two 4-byte sections the slide does not list */\n/* . = 0x08001D5C + 4 + 4 = 0x08001D64 */\n_sidata = LOADADDR(.data);   /* = 0x08001D64 */',
        note: 'Two small 4-byte sections come next; they are the 4 + 4 in the slide\'s FLASH sum. The dot is now 0x08001D64, which is where .data will be stored: _sidata.' },
      { f: 5, r: 1, cf: [4], cr: [0], fd: 5, rd: 1, row: 3,
        ld: '.data : { _sdata = .; *(.data*) _edata = .; } >RAM AT> FLASH\n/* VMA: . = 0x20000000 -> 0x20000064   (_sdata, _edata) */\n/* LMA: 0x08001D64 -> 0x08001DC8 in FLASH                */',
        note: '>RAM AT> FLASH gives .data two places. Its addresses (VMA) are in RAM, 0x20000000 to 0x20000064, and its bytes are stored (LMA) in FLASH at 0x08001D64. Both regions grow by 100 bytes: .data costs you both.' },
      { f: 6, r: 2, cf: [], cr: [1], fd: null, rd: 2, row: 4,
        ld: '.bss : { _sbss = .; *(.bss*) *(COMMON); _ebss = .; } >RAM\n/* . = 0x20000064 + 372 = 0x200001D8; no AT>, nothing stored */',
        note: '.bss takes RAM only. There is no AT>, so FLASH does not grow: .bss costs no FLASH at all.' },
      { f: 6, r: 4, cf: [], cr: [2, 3], fd: null, rd: 4, row: 5,
        ld: '._user_heap_stack : { . = ALIGN(8); PROVIDE(end = .);\n    . = . + _Min_Heap_Size; . = . + _Min_Stack_Size; } >RAM\n/* end = 0x200001D8; . = 0x200001D8 + 0x200 + 0x400 = 0x200007D8 */',
        note: 'The heap and stack room only reserves 512 + 1024 = 1536 bytes so the link fails if they do not fit. The real stack starts at _estack = 0x20003000 and grows down. end marks where _sbrk starts the heap.' },
    ];
    const note = role('ld-note');
    steps(viz('ld-steps'), ['All', '1 · .isr_vector', '2 · .text', '3 · .rodata', '4 · small tables', '5 · .data', '6 · .bss', '7 · heap + stack'], k => {
      const S = STEPS[k];
      F.rects.forEach((els, i) => els.forEach(el => el.classList.toggle('dim', i >= S.f && i < 5)));
      R.rects.forEach((els, i) => els.forEach(el => el.classList.toggle('dim', i >= S.r && i < 4)));
      cur.textContent = '';
      const mark = (xs, list, i, y) => s('rect', { x: xs[i], y, width: list[i][2], height: 36, class: 'f-none outline-sec' }, cur);
      S.cf.forEach(i => mark(F.xs, FL, i, 44));
      S.cr.forEach(i => mark(R.xs, RM, i, 180));
      const dot = (x, y, ly, v) => {
        s('line', { x1: x, x2: x, y1: y - 4, y2: y + 40, class: 's-sec', style: 'stroke-width: 2' }, cur);
        T(cur, x, ly, '. = ' + hex(v), 't-sec t-bold', x < 110 ? 'start' : x > 670 ? 'end' : 'middle');
      };
      if (S.fd != null) dot(F.xs[S.fd], 44, 126, FB[S.fd]);
      if (S.rd != null) dot(R.xs[S.rd], 180, 264, RB[S.rd]);
      tbl.rows.forEach((tr, i) => tr.classList.toggle('on', i === S.row));
      role('ld-line').textContent = S.ld;
      note.textContent = S.note;
    });
  });

  // Figure 10: clock states and the order of the two writes
  fig('clk', () => {
    const g = svg(viz('clk'), 700, 300, { label: 'Clock states: wait states against CPU frequency; raising the frequency before the wait state reaches the state that hangs', minWidth: 540 });
    const cx = [230, 500], cy = [200, 70], BW = 210, BH = 62;
    T(g, 350, 14, 'HSI48 (48 MHz) → HSIDIV → CPU clock: ÷4 at reset, ÷1 after SystemInit()', 't-muted', 'middle');
    T(g, 20, 34, 'FLASH->ACR', 't-fg t-bold');
    T(g, 20, cy[1], 'LATENCY = 1', 't-fg');
    T(g, 20, cy[0], 'LATENCY = 0', 't-fg');
    T(g, cx[0], 262, '12 MHz: HSIDIV ÷4 (reset)', 't-fg', 'middle');
    T(g, cx[1], 262, '48 MHz: HSIDIV ÷1', 't-fg', 'middle');
    T(g, 365, 286, 'RCC->CR HSIDIV', 't-fg t-bold', 'middle');
    const ST = [
      [0, 0, '12 MHz · 0 wait states\nreset state: safe', 'f-seg'],
      [0, 1, '12 MHz · 1 wait state\nsafe: flash has time to spare', 'f-seg'],
      [1, 1, '48 MHz · 1 wait state\nthe target: safe', 'f-ok-soft'],
      [1, 0, '48 MHz · 0 wait states\nflash not ready: hangs', 'f-bad-soft'],
    ];
    ST.forEach(([f, w, l, c]) => box(g, cx[f] - BW / 2, cy[w] - BH / 2, BW, BH, l, { cls: c, textCls: 't-fg', lh: 17 }));
    const ov = s('g', {}, g);
    const up = [cx[0], cy[0] - BH / 2 - 2, cx[0], cy[1] + BH / 2 + 2];
    const across = y => [cx[0] + BW / 2 + 2, y, cx[1] - BW / 2 - 2, y];
    const PATHS = [
      [[up, 'a-ok', '1 · LATENCY = 1', 62, 4], [across(cy[1]), 'a-ok', '2 · ÷1', 0, -10]],
      [[across(cy[0]), 'a-bad', '÷1 first', 0, -10]],
      [[[across(cy[1])[2], cy[1], across(cy[1])[0], cy[1]], 'a-ok', '1 · ÷4', 0, -10], [[up[2], up[3], up[0], up[1]], 'a-ok', '2 · LATENCY = 0', 66, 4]],
    ];
    const NOTES = [
      'Right order: raise the wait state first and wait until LATENCY reads back 1, then clear HSIDIV to ÷1 and poll HSIRDY. Every state on the way is safe.',
      'Wrong order: switch to 48 MHz while LATENCY is still 0. The CPU now fetches faster than the flash can deliver, reads an instruction that is not ready, and the part hangs with no error, somewhere that has nothing to do with the bug.',
      'Slowing down reverses the order: lower the frequency first, then the wait state. "Wait states go up before the frequency, and come down after it."',
    ];
    const note = role('clk-note');
    steps(viz('clk-steps'), ['Right order', 'Wrong order', 'Slowing down'], k => {
      ov.textContent = '';
      PATHS[k].forEach(([[x1, y1, x2, y2], cls, label, dx, dy]) => arrow(ov, x1, y1, x2, y2, { cls, width: 2.5, head: 10, label, dx, dy, labelCls: cls.replace('a-', 't-') + ' t-bold' }));
      if (k === 1) s('rect', { x: cx[1] - BW / 2 - 3, y: cy[0] - BH / 2 - 3, width: BW + 6, height: BH + 6, rx: 8, class: 'f-none s-bad' }, ov);
      note.textContent = NOTES[k];
    });
  });

  // Figure 11: printf to the pin
  fig('printf', () => {
    const g = svg(viz('printf'), 780, 232, { label: 'printf calls the C library, which calls your _write, which calls uart2_putc, which writes USART2 TDR; the heap for its buffer comes from _sbrk', minWidth: 560 });
    const B = [
      [10, 'C library (newlib-nano)', 'printf("n=%d\\n", 5)\nformats "n=5\\n"', 'f-seg', 't-fg'],
      [210, 'retarget.c (yours)', '_write(fd, buf, len)\nadds \\r before each \\n', 'f-pri-soft', 't-fg'],
      [410, 'retarget.c (yours)', 'uart2_putc(c)\nwait ISR.TXE_TXFNF,\nthen store c in TDR', 'f-pri-soft', 't-fg'],
      [610, 'USART2 0x40004400', 'TX on PA2, AF1\n115 200 baud\nto the serial monitor', 'f-seg', 't-fg'],
    ];
    B.forEach(([x, head, body, cls, tc], i) => {
      const w = i === 3 ? 160 : 170;
      T(g, x + w / 2, 12, head, i === 1 || i === 2 ? 't-pri t-bold' : 't-muted', 'middle');
      box(g, x, 24, w, 60, body, { cls, textCls: tc, lh: 16 });
      if (i < 3) arrow(g, x + w + 2, 54, x + 198, 54, { cls: 'a-muted' });
    });
    T(g, 10, 118, 'bytes on the wire', 't-fg t-bold');
    [['n', '6E'], ['=', '3D'], ['5', '35'], ['\\r', '0D'], ['\\n', '0A']].forEach(([c, h], i) => {
      const x = 150 + i * 46, ins = c === '\\r';
      s('rect', { x, y: 104, width: 40, height: 28, rx: 3, class: ins ? 'f-sec' : 'f-pri-soft' }, g);
      T(g, x + 20, 118, c, ins ? 't-on t-bold' : 't-fg t-bold', 'middle');
      T(g, x + 20, 144, h, 't-sm', 'middle');
    });
    T(g, 392, 112, '\\r inserted by _write: 4 characters, 5 bytes', 't-sec t-bold');
    T(g, 392, 130, 'one TDR store per byte', 't-muted');
    T(g, 10, 170, 'RAM: printf\'s buffer comes from malloc → _sbrk', 't-fg t-bold');
    const SEG = [[10, 150, '.data .bss', 'f-seg', 't-fg'], [160, 260, 'heap ↑ from end = 0x200001D8', 'f-pri-soft', 't-fg'], [420, 200, 'free', null, 't-muted'], [620, 150, 'stack ↓ from _estack', 'f-ter-soft', 't-fg']];
    SEG.forEach(([x, w, l, cls, tc]) => {
      s('rect', { x, y: 184, width: w, height: 28, class: cls ? cls + ' sep' : 'f-none s-muted dash', style: cls ? null : 'opacity: 0.6' }, g);
      T(g, x + w / 2, 198, l, tc, 'middle');
    });
    T(g, 290, 225, 'wrong _sbrk: printf prints nothing', 't-bad t-bold', 'middle');
  });

  // Figure 12: lab exercises 3 and 4
  fig('ex3', () => {
    const g = svg(viz('ex3'), 740, 200, { label: 'Exercise 3: with .isr_vector moved after .text, the first eight bytes of FLASH are instructions and decode to an SP in FLASH and an unmapped PC', minWidth: 560 });
    const layer = s('g', {}, g);
    const CASES = [
      { blocks: [['.isr_vector', 110, 'f-pri'], ['.text', 300, 'f-seg'], ['.rodata', 140, 'f-seg'], ['…', 90, 'f-seg']], bytes: ['00', '30', '00', '20', 'C5', '06', '00', '08'], rec: ':10000000 00300020 C5060008 …',
        sp: ['SP ← 0x20003000', 'in RAM, the top of 12 KB: OK'], pc: ['PC ← 0x080006C5', 'in FLASH and odd (Thumb): OK'], ok: true,
        note: 'As built: .isr_vector is the first section, so the first two words of FLASH are _estack and Reset_Handler | 1. The core gets a stack in RAM and starts Reset_Handler.' },
      { blocks: [['.text', 300, 'f-seg'], ['.isr_vector', 110, 'f-bad'], ['.rodata', 140, 'f-seg'], ['…', 90, 'f-seg']], bytes: ['00', '22', '43', '08', '8B', '42', '74', 'D3'], rec: ':10000000 00224308 8B4274D3 …',
        sp: ['SP ← 0x08432200', 'in FLASH, not writable RAM: bad'], pc: ['PC ← 0xD374428B', 'unmapped: the fetch faults'], ok: false,
        note: 'Moved: .text now starts FLASH and the table sits at 0x08001634. The build reports 0 errors, 0 warnings and identical sizes, and the hex checksums are valid. The core still reads the first two words, which are now machine code, and locks up before any handler exists.' },
    ];
    const note = role('ex3-note');
    steps(viz('ex3-steps'), ['Ex. 3 · as built', 'Ex. 3 · .isr_vector after .text'], k => {
      layer.textContent = '';
      const C = CASES[k];
      T(layer, 30, 12, '0x08000000: the core reads the first 8 bytes here', 't-fg t-bold');
      s('polygon', { points: '30,22 38,22 30,30', class: 'f-fg' }, layer);
      let x = 30;
      C.blocks.forEach(([n, w, cls]) => {
        s('rect', { x, y: 30, width: w, height: 30, class: cls + ' sep' }, layer);
        T(layer, x + w / 2, 45, n, cls === 'f-seg' ? 't-fg' : 't-on t-bold', 'middle');
        x += w;
      });
      if (!C.ok) T(layer, 30 + 300 + 55, 72, 'now at 0x08001634', 't-bad t-sm', 'middle');
      C.bytes.forEach((b, j) => {
        const bx = 30 + j * 44 + (j >= 4 ? 10 : 0);
        s('rect', { x: bx, y: 86, width: 40, height: 28, rx: 3, class: C.ok ? 'f-pri-soft' : 'f-bad-soft' }, layer);
        T(layer, bx + 20, 100, b, 't-fg t-bold', 'middle');
      });
      T(layer, 410, 92, 'Main.hex, first data record', 't-muted');
      T(layer, 410, 110, C.rec, 't-fg');
      [[30, C.sp], [380, C.pc]].forEach(([bx, [a, b]]) => box(layer, bx, 134, 330, 50, a + '\n' + b, { cls: C.ok ? 'f-ok-soft' : 'f-bad-soft', textCls: 't-fg t-bold', lh: 17 }));
      note.textContent = C.note;
    });
  });

  fig('ex4', () => {
    const g = svg(viz('ex4'), 740, 128, { label: 'Exercise 4: the RAM region drawn to scale for 12K, 8K, 2K and 1K against the 2008 bytes the program uses', minWidth: 560 });
    const layer = s('g', {}, g);
    const X = 40, PX = 660 / 12288, USED = 2008;
    const CASES = [
      { k: 12, note: 'Baseline: _estack = 0x20000000 + 12 × 1024 = 0x20003000, and 2008 of 12 288 bytes are used.' },
      { k: 8, note: 'Only the stack top moves, to 0x20002000, and the hex now starts 00 20 00 20. Everything else is placed bottom-up from 0x20000000, so no other printed address changes. The value reaches SP with no code involved.' },
      { k: 2, note: 'It still builds, at 2008 / 2048 = 98.05%. It is not safe: the heap and stack sizes are a reservation, not a limit, so a deeper stack can grow through the heap into .bss with no error.' },
      { k: 1, note: 'The link fails: section ._user_heap_stack will not fit in region RAM, overflowed by 2008 − 1024 = 984 bytes. "A linker checks what it can compute; it cannot check what happens later."' },
    ];
    const note = role('ex4-note');
    steps(viz('ex4-steps'), CASES.map(c => 'Ex. 4 · RAM ' + c.k + 'K'), i => {
      layer.textContent = '';
      const C = CASES[i], len = C.k * 1024, end = 0x20000000 + len, rw = len * PX, uw = USED * PX, over = USED > len;
      T(layer, X, 12, `RAM (rw) : ORIGIN = 0x20000000, LENGTH = ${C.k}K, drawn to scale`, 't-fg t-bold');
      s('rect', { x: X, y: 30, width: rw, height: 34, rx: 3, class: 'f-seg box' }, layer);
      s('rect', { x: X, y: 30, width: Math.min(uw, rw), height: 34, rx: 3, class: 'f-pri' }, layer);
      if (over) s('rect', { x: X + rw, y: 30, width: uw - rw, height: 34, class: 'f-bad' }, layer);
      T(layer, X, 80, 'used 2008 B: .data + .bss + heap/stack room', 't-pri');
      s('line', { x1: X + rw, x2: X + rw, y1: 24, y2: 70, class: 's-ter', style: 'stroke-width: 2' }, layer);
      T(layer, X + rw + (over ? -4 : 6), over ? 104 : 47, '_estack = ' + hex(end), 't-ter t-bold', over ? 'start' : 'start');
      if (over) T(layer, X + uw + 6, 47, 'overflowed by 984 bytes', 't-bad t-bold');
      T(layer, X, 118, over ? 'link fails: 196.09% of the region' : `${(USED / len * 100).toFixed(2)}% used`, over ? 't-bad t-bold' : 't-fg');
      role('ram-estack').textContent = hex(end);
      role('ram-hex').textContent = over ? 'no image' : hex(end).slice(2).match(/../g).reverse().join(' ');
      role('ram-pct').textContent = (USED / len * 100).toFixed(2) + '%';
      note.textContent = C.note;
    });
  });
});
