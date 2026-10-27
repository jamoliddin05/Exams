QV.register('topic0', function (q) {
  const { s, svg, arrow, steps, table } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const T = (g, x, y, text, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor, class: cls }, g, text);
  const hex = (v, n = 8) => '0x' + (v >>> 0).toString(16).toUpperCase().padStart(n, '0');
  const h2 = v => v.toString(16).toUpperCase().padStart(2, '0');
  // one figure failing must not blank the other eleven
  const part = (name, f) => { try { f(); } catch (e) { QV.fail('topic0 ' + name, e); } };
  const card = (g, x, y, w, h, lines, fill, stroke) => {
    const r = s('rect', { x, y, width: w, height: h, rx: 6, class: (fill || 'f-surface') + ' ' + (stroke || 'box') }, g);
    const lh = 15, t0 = y + h / 2 - (lines.length - 1) * lh / 2;
    const ts = lines.map(([t, c], i) => T(g, x + w / 2, t0 + i * lh, t, c || 't-fg', 'middle'));
    return { r, ts };
  };
  const setText = (els, lines) => els.forEach((e, i) => { e.textContent = lines[i] || ''; });

  // Figure 1: the five parts above the contract, the implementation below it
  part('parts', () => {
    const g = svg(viz('parts'), 800, 280, { label: 'The five parts of the programmer\'s model above the contract, the hidden implementation below it', minWidth: 560 });
    const P = [
      { name: 'Registers', d: ['working state', 'inside the CPU'], ex: 'R0–R15, xPSR' },
      { name: 'Memory', d: ['one flat', 'address space'], ex: 'int total;' },
      { name: 'Peripheral registers', d: ['memory-mapped', 'controls of hardware'], ex: 'USART2->ISR' },
      { name: 'Modes and stacks', d: ['which of two', 'contexts runs'], ex: 'Thread on MSP' },
      { name: 'Exceptions', d: ['how hardware takes', 'control away'], ex: 'slot 44 → handler' },
    ];
    T(g, 10, 14, 'THE PROGRAMMER\'S MODEL · everything software can name', 't-fg t-bold');
    const boxes = P.map((p, i) => {
      const x = 10 + i * 156, y = 30, gg = s('g', { class: 'fade' }, g);
      const r = s('rect', { x, y, width: 148, height: 120, rx: 7, class: 'f-surface box' }, gg);
      T(gg, x + 10, y + 13, 'PART ' + (i + 1), 't-sm t-muted');
      T(gg, x + 74, y + 34, p.name, 't-fg t-bold', 'middle');
      T(gg, x + 74, y + 54, p.d[0], null, 'middle');
      T(gg, x + 74, y + 69, p.d[1], null, 'middle');
      s('line', { x1: x + 12, x2: x + 136, y1: y + 84, y2: y + 84, class: 's-line' }, gg);
      const ex = T(gg, x + 74, y + 102, p.ex, 't-pri t-bold', 'middle');
      return { gg, r, ex, def: p.ex };
    });
    s('rect', { x: 10, y: 166, width: 780, height: 26, rx: 4, class: 'f-seg' }, g);
    T(g, 400, 179, 'the contract: documented, stable, the same on every chip of this family', 't-fg', 'middle');
    const ig = s('g', { class: 'fade' }, g);
    const ir = s('rect', { x: 10, y: 206, width: 780, height: 62, rx: 7, class: 'f-surface box dash' }, ig);
    T(ig, 400, 226, 'THE IMPLEMENTATION', 't-fg t-bold', 'middle');
    T(ig, 400, 248, 'pipeline · bus matrix · silicon · none of it named by your code', null, 'middle');

    const ITEMS = [
      { b: 'All', t: -1, note: 'Each part with one example. Everything software can name sits above the contract. The pipeline, the bus matrix and the silicon sit below it, out of reach.' },
      { b: 'R3', t: 0, ex: 'R3', note: 'R3 is one of the sixteen core registers, so it belongs to part 1. It has no address; an instruction names it with a few bits.' },
      { b: 'int total;', t: 1, ex: 'int total;', note: 'A global variable lives in SRAM, around 0x20000400. That is part 2, memory, reached by address with ldr and str.' },
      { b: 'const table[]', t: 1, ex: 'const table[]', note: 'A const array lives in flash at 0x0800xxxx. It is still part 2: the same flat address space, read with the same ldr.' },
      { b: 'USART2->ISR', t: 2, ex: 'USART2->ISR', note: 'USART2\'s status register sits in ST\'s peripheral region at 0x4000xxxx. That is part 3, peripheral registers, in the STATUS role.' },
      { b: 'PSP', t: 3, ex: 'PSP, Thread mode', note: 'Which stack Thread mode uses, MSP or PSP, and which mode is running belong to part 4, modes and stacks. Bit 1 of CONTROL picks the stack.' },
      { b: 'slot 44', t: 4, ex: 'USART2_IRQHandler', note: 'Vector slot 44 holds the address of USART2_IRQHandler. That is part 5, exceptions: how the hardware takes control away from main().' },
      { b: 'pipeline', t: 5, note: 'The pipeline is below the contract. No register names it, so it is left out of the model. It still leaks through: the PC reads ahead (slide 13).' },
    ];
    const note = role('parts-note');
    steps(viz('parts-steps'), ITEMS.map(it => it.b), k => {
      const it = ITEMS[k];
      boxes.forEach((b, i) => {
        const on = i === it.t;
        b.gg.classList.toggle('dim', k > 0 && !on);
        b.r.setAttribute('class', on ? 'f-pri-soft outline-pri' : 'f-surface box');
        b.ex.textContent = on ? it.ex : b.def;
      });
      ig.classList.toggle('dim', k > 0 && it.t !== 5);
      ir.setAttribute('class', it.t === 5 ? 'f-pri-soft outline-pri dash' : 'f-surface box dash');
      note.textContent = it.note;
    });
  });

  // Figure 2: register file, then an xPSR value bit by bit
  part('xpsr', () => {
    const g = svg(viz('xpsr'), 800, 300, { label: 'The sixteen core registers and xPSR, and an xPSR value decoded into its APSR, EPSR and IPSR fields', minWidth: 560 });
    const RX = i => 10 + i * 44 + (i >= 13 ? 10 : 0);
    const names = ['R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12', 'SP', 'LR', 'PC'];
    names.forEach((n, i) => {
      s('rect', { x: RX(i), y: 34, width: 40, height: 30, rx: 4, class: (i < 13 ? 'f-pri-soft' : 'f-sec-soft') + ' box' }, g);
      T(g, RX(i) + 20, 49, n, i < 13 ? 't-pri' : 't-sec t-bold', 'middle');
    });
    s('rect', { x: 734, y: 34, width: 56, height: 30, rx: 4, class: 'f-ter-soft box' }, g);
    T(g, 762, 49, 'xPSR', 't-ter t-bold', 'middle');
    const brace = (x1, x2, y, up, label, cls) => {
      const d = up ? 6 : -6;
      s('path', { d: `M${x1} ${y + d} V${y} H${x2} V${y + d}`, class: 's-muted', style: 'stroke-width: 1' }, g);
      T(g, (x1 + x2) / 2, y + (up ? -9 : 11), label, cls, 'middle');
    };
    brace(RX(0), RX(3) + 40, 22, true, 'arguments, result, scratch', 't-sm');
    brace(RX(4), RX(12) + 40, 22, true, 'locals the compiler keeps out of memory', 't-sm');
    brace(RX(13), RX(15) + 40, 22, true, 'fixed jobs', 't-sm t-sec');
    brace(RX(0), RX(12) + 40, 72, false, 'R0–R12: 13 registers freely yours', 't-pri t-bold');
    [['stack', 13], ['return', 14], ['next', 15]].forEach(([t, i]) => T(g, RX(i) + 20, 76, t, 't-sm', 'middle'));
    T(g, 762, 76, 'flags, ISR', 't-sm', 'middle');
    T(g, 400, 106, '16 registers × 4 bytes = 64 bytes, plus xPSR: the entire working state of the processor', 't-fg', 'middle');
    s('line', { x1: 10, x2: 790, y1: 122, y2: 122, class: 's-line' }, g);

    const CW = 22, X0 = 48, Y = 180;
    const bx = b => X0 + (31 - b) * CW;
    const title = T(g, 10, 142, '', 't-fg t-bold t-lg');
    T(g, 790, 142, 'one register, three views', null, 'end');
    const field = b => b >= 28 || b === 24 || b <= 5;
    const cells = [], bits = [], nib = [];
    for (let b = 31; b >= 0; b--) {
      cells[b] = s('rect', { x: bx(b), y: Y, width: CW, height: 26, class: 'f-seg sep' }, g);
      bits[b] = T(g, bx(b) + CW / 2, Y + 13, '0', 't-muted', 'middle');
    }
    for (let i = 0; i < 8; i++) {
      nib.push(T(g, X0 + (4 * i + 2) * CW, Y - 12, '0', 't-pri t-bold', 'middle'));
      if (i) s('line', { x1: X0 + 4 * i * CW, x2: X0 + 4 * i * CW, y1: Y - 4, y2: Y + 30, class: 's-muted' }, g);
    }
    [31, 28, 24, 5, 0].forEach(b => T(g, bx(b) + CW / 2, Y + 38, String(b), 't-sm', 'middle'));
    const view = (b1, b0, name) => {
      const x1 = bx(b1) + 1, x2 = bx(b0) + CW - 1, y = Y + 50;
      s('path', { d: `M${x1} ${y - 5} V${y} H${x2} V${y - 5}`, class: 's-muted', style: 'stroke-width: 1' }, g);
      T(g, (x1 + x2) / 2, y + 14, name, 't-fg t-bold', 'middle');
      return T(g, (x1 + x2) / 2, y + 30, '', 't-pri t-bold', 'middle');
    };
    const vA = view(31, 28, 'APSR · N Z C V');
    const vE = view(24, 24, 'EPSR · T');
    const vI = view(5, 0, 'IPSR · ISR');
    const meaning = T(g, X0, 286, '', 't-fg t-bold');

    const V = [
      { b: 'main()', v: 0x01000000, m: 'ISR = 0: Thread mode, main() is running', note: 'In main(). T = 1 as always. ISR = 0 because no exception is running, and the flags are all 0.' },
      { b: 'USART2 handler', v: 0x0100002C, m: 'ISR = 44 = 16 + 28: inside USART2_IRQHandler', note: 'ISR = 0x2C = 44. Exception 44 = 16 + 28, so the USART2 interrupt (IRQ 28) is being handled. This is slide 9\'s IPSR value.' },
      { b: 'N and C set', v: 0xA1000000, m: 'N = 1, C = 1, ISR = 0: main(), after a negative result with carry', note: 'Top hex digit A = 1010, so N = 1 and C = 1: the last flag-setting result was negative and carried out. ISR = 0, so this is still main().' },
      { b: 'EXTI0_1 handler', v: 0x81000015, m: 'N = 1, ISR = 21 = 16 + 5: inside EXTI0_1_IRQHandler', note: 'Top digit 8 = 1000, so N = 1. ISR = 0x15 = 21 = 16 + 5, the EXTI0_1 interrupt (IRQ 5). Flags and the exception number share one word.' },
    ];
    const note = role('xpsr-note'), calc = role('xpsr-calc');
    steps(viz('xpsr-steps'), V.map(x => x.b), k => {
      const { v, m } = V[k];
      const bit = b => (v >>> b) & 1;
      title.textContent = 'xPSR = ' + hex(v);
      for (let b = 0; b < 32; b++) {
        const f = field(b), one = bit(b);
        cells[b].setAttribute('class', (f ? (one ? 'f-pri' : 'f-pri-soft') : 'f-seg') + ' sep');
        bits[b].setAttribute('class', f ? (one ? 't-on t-bold' : 't-pri') : 't-muted');
        bits[b].textContent = one;
      }
      hex(v).slice(2).split('').forEach((c, i) => { nib[i].textContent = c; });
      const isr = v & 0x3f;
      vA.textContent = `N=${bit(31)} Z=${bit(30)} C=${bit(29)} V=${bit(28)}`;
      vE.textContent = `T = ${bit(24)}, Thumb`;
      vI.textContent = `ISR = ${isr}` + (isr ? ' = 0x' + h2(isr) : '');
      meaning.textContent = m;
      note.textContent = V[k].note;
      const groups = (v >>> 0).toString(2).padStart(32, '0').match(/.{4}/g).join(' ');
      calc.textContent = [
        `xPSR = ${hex(v)}`,
        `     = ${groups}`,
        `bits 31:28  N Z C V = ${bit(31)} ${bit(30)} ${bit(29)} ${bit(28)}     bit 24  T = ${bit(24)}     bits 5:0  ISR = ${(isr).toString(2).padStart(6, '0')} = ${isr}`,
        isr ? `exception ${isr} − 16 = IRQ ${isr - 16}` : 'ISR = 0: no exception running, Thread mode',
      ].join('\n');
    });
  });

  // Figure 3: AVR's separate spaces against one address space
  part('io', () => {
    const g = svg(viz('io'), 800, 300, { label: 'AVR reaches flash, SRAM and I/O with three different instructions; this chip reaches all three with ldr and str', minWidth: 560 });
    T(g, 10, 14, 'AVR: Harvard, port-mapped I/O', 't-sec t-bold');
    T(g, 420, 14, 'This chip: von Neumann, memory-mapped I/O', 't-pri t-bold');
    s('line', { x1: 405, x2: 405, y1: 30, y2: 290, class: 's-line' }, g);
    card(g, 14, 116, 70, 56, [['AVR', 't-fg t-bold'], ['CPU']]);
    card(g, 424, 116, 70, 56, [['Cortex-M', 't-fg t-bold'], ['CPU']]);
    s('rect', { x: 600, y: 30, width: 190, height: 238, rx: 8, class: 'f-none s-muted dash' }, g);
    T(g, 695, 282, 'one address space', 't-pri t-bold', 'middle');
    const ROWS = [
      { avr: ['program space · flash', '0x0100: a word of code'], ains: 'LPM', cm: ['flash · 0x08000000', 'const table[]'] },
      { avr: ['data space · SRAM', '0x0100: a variable'], ains: 'LD / ST', cm: ['SRAM · 0x20000000', 'int total;'] },
      { avr: ['I/O space', 'PORTB, DDRB, PINB'], ains: 'IN / OUT', cm: ['GPIO · 0x50000000', 'GPIOA->ODR'] },
    ];
    // labels sit on the open side of each slanted arrow
    const lab = i => [{ dx: -18, dy: -10 }, { dx: 0, dy: -8 }, { dx: -18, dy: 14 }][i];
    const rows = ROWS.map((r, i) => {
      const y = 34 + i * 84, ga = s('g', { class: 'fade' }, g), gc = s('g', { class: 'fade' }, g);
      const a = card(ga, 200, y, 186, 62, [[r.avr[0], 't-sec t-bold'], [r.avr[1]]]);
      const sy = 130 + i * 14;
      const aa = arrow(ga, 84, sy, 197, y + 31, { cls: 'a-sec', label: r.ains, labelCls: 't-sec t-bold', ...lab(i) });
      const c = card(gc, 610, y + 4, 170, 56, [[r.cm[0], 't-pri t-bold'], [r.cm[1]]]);
      const ca = arrow(gc, 494, sy, 607, y + 32, { cls: 'a-pri', label: 'ldr / str', labelCls: 't-pri t-bold', ...lab(i) });
      return { ga, gc, a, c, aa, ca };
    });
    const NOTES = [
      'Three kinds of access. The AVR needs a different instruction for each space. This chip uses ldr and str for all three; only the address differs.',
      'Read a constant table in flash. AVR: the table sits in program space, so C needs PROGMEM and pgm_read_byte(), which compiles to LPM. This chip: table[i] is an ordinary ldr from 0x0800xxxx.',
      'Read a global variable. Both machines use an ordinary data load: LD on the AVR, ldr from 0x2000xxxx here. On the AVR, address 0x0100 in data space is a different byte from 0x0100 in program space.',
      'Write a port. AVR: PORTB = x compiles to OUT into the separate I/O space. This chip: GPIOA->ODR = x is an ordinary str to 0x50000014.',
    ];
    const note = role('io-note');
    steps(viz('io-steps'), ['All', 'const table in flash', 'global variable', 'port register'], k => {
      rows.forEach((r, i) => {
        const on = k === i + 1;
        r.ga.classList.toggle('dim', k > 0 && !on);
        r.gc.classList.toggle('dim', k > 0 && !on);
        r.a.r.setAttribute('class', on ? 'f-sec-soft outline-sec' : 'f-surface box');
        r.c.r.setAttribute('class', on ? 'f-pri-soft outline-pri' : 'f-surface box');
      });
      note.textContent = NOTES[k];
    });
  });

  // Figure 4: memory map in address order with an address classifier
  part('map', () => {
    const g = svg(viz('map'), 800, 320, { label: 'Cortex-M memory map from the private peripheral bus down to the flash alias at zero, with an address classified into its region', minWidth: 560 });
    const R = [
      { base: 0xE0000000, name: 'PRIVATE PERIPHERAL BUS', sub: 'NVIC, SysTick, SCB · ARM\'s', who: 'fixed by ARM' },
      { base: 0x40000000, name: 'PERIPHERAL', sub: 'GPIO, USART, timers · ST\'s', who: 'filled in by ST' },
      { base: 0x20000000, name: 'SRAM', sub: 'variables, stack, heap · 12 KB', who: 'size chosen by ST' },
      { base: 0x08000000, name: 'CODE · flash', sub: '32 KB, vector table first', who: 'size chosen by ST' },
      { base: 0x00000000, name: 'ALIAS of flash', sub: 'flash seen again at reset', who: 'how the CPU finds the table "at zero"' },
    ];
    const ry = i => 16 + i * 60;
    const rows = R.map((r, i) => {
      const gg = s('g', { class: 'fade' }, g), y = ry(i);
      const rect = s('rect', { x: 150, y, width: 250, height: 50, rx: 6, class: 'f-surface box' + (i === 4 ? ' dash' : '') }, gg);
      T(gg, 275, y + 17, r.name, 't-fg t-bold', 'middle');
      T(gg, 275, y + 34, r.sub, null, 'middle');
      T(gg, 140, y + 25, hex(r.base), 't-fg', 'end');
      if (i < 4) s('line', { x1: 275, x2: 275, y1: y + 50, y2: y + 60, class: 's-muted dash', style: 'stroke-width: 1' }, gg);
      return { gg, rect, dflt: 'f-surface box' + (i === 4 ? ' dash' : '') };
    });
    const who = s('g', {}, g);
    R.forEach((r, i) => T(who, 414, ry(i) + 25, r.who, i === 0 ? 't-pri' : null));
    const ov = s('g', {}, g);
    const C = [
      null,
      { a: 0xE000E010, r: 0, l: ['SysTick, ARM\'s core timer', 'owner: ARM, same on any vendor', 'manual: ARM Generic User Guide'], note: 'Starts with 0xE: the private peripheral bus. SysTick is ARM\'s and identical on every Cortex-M, so ARM\'s Generic User Guide describes it.' },
      { a: 0x40004400, r: 1, l: ['USART2\'s registers', 'owner: ST', 'manual: ST reference manual'], note: '0x4000xxxx is the peripheral region, filled in by ST. USART2 is ST\'s block, so ST\'s reference manual describes it.' },
      { a: 0x50000014, r: 1, l: ['GPIOA base + 0x14 = ODR', 'owner: ST', 'a store here moves a pin'], note: '0x50000014 is GPIOA\'s base 0x50000000 plus offset 0x14, the output data register. It is still ST\'s peripheral region; on the STM32C0 GPIO sits at 0x5000xxxx.' },
      { a: 0x20000400, r: 2, l: ['a global variable or the stack', 'owner: your program', 'placed by the linker script'], note: '0x2000xxxx is SRAM: variables, stack and heap. 0x20000400 is 1 KB into the 12 KB of RAM, which ends at 0x20003000.' },
      { a: 0x00000004, r: 4, l: ['vector slot 1, the reset vector', 'really flash 0x08000004', 'filled in by your vector table'], note: '0x00000004 is inside the alias. At reset the chip shows flash at address 0, so this word is flash 0x08000004: slot 1 of the vector table, the reset vector.' },
    ];
    const note = role('map-note');
    steps(viz('map-steps'), ['All'].concat(C.slice(1).map(c => hex(c.a))), k => {
      ov.textContent = '';
      who.setAttribute('visibility', k ? 'hidden' : 'visible');
      rows.forEach((r, i) => {
        const on = k > 0 && C[k].r === i;
        r.gg.classList.toggle('dim', k > 0 && !on);
        r.rect.setAttribute('class', on ? 'f-pri-soft outline-pri' + (i === 4 ? ' dash' : '') : r.dflt);
      });
      if (!k) {
        note.textContent = 'The regions are the same on every Cortex-M; only the contents change. The top region is ARM\'s. The peripheral region is ST\'s. SRAM and flash hold your program. Pick an address to classify it.';
        return;
      }
      const c = C[k], y = ry(c.r);
      s('rect', { x: 436, y: y + 12, width: 110, height: 26, rx: 4, class: 'f-pri' }, ov);
      T(ov, 491, y + 25, hex(c.a), 't-on t-bold', 'middle');
      arrow(ov, 434, y + 25, 404, y + 25, { cls: 'a-pri', width: 2 });
      c.l.forEach((t, i) => T(ov, 560, y + 9 + i * 16, t, i ? null : 't-fg t-bold'));
      note.textContent = c.note;
    });
  });

  // Figure 5: the same access on a variable and on a register
  part('rv', () => {
    const g = svg(viz('rv'), 800, 206, { label: 'Two lanes: an access to a variable in SRAM and the same kind of access to a peripheral register, with their effects', minWidth: 560 });
    T(g, 10, 34, 'variable', 't-sec t-bold');
    T(g, 10, 50, 'in SRAM', 't-sm');
    T(g, 10, 124, 'register', 't-pri t-bold');
    T(g, 10, 140, 'peripheral', 't-sm');
    const dyn = s('g', {}, g);
    const RV = [
      { b: 'Write', v: ['str r1, [r0]', 'r1 = 0x20'], va: ['0x20000014', 'int x'], ve: ['x = 0x20', 'nothing else happens'],
        r: ['str r1, [r0]', 'r1 = 0x20'], ra: ['0x50000014', 'GPIOA->ODR'], re: ['bit 5 set: PA5 goes high', 'a LED lights, a motor turns'],
        verdict: 'Writing a variable changes memory. Writing a register makes something happen.' },
      { b: 'Read twice', v: ['ldr, then ldr', 'no write in between'], va: ['0x20000014', 'int x'], ve: ['0x00000020, then 0x00000020', 'the same value twice'],
        r: ['ldr, then ldr', 'no write in between'], ra: ['0x50000010', 'GPIOA->IDR'], re: ['0x00000000, then 0x00000010', 'PA4 went high in between'],
        verdict: 'A register shows the hardware as it is now. Two reads can differ with no write between them.' },
      { b: 'Read side effect', v: ['ldr', 'one read'], va: ['0x20000014', 'int x'], ve: ['returns 0x20', 'x is unchanged'],
        r: ['ldr', 'one read'], ra: ['USART2->RDR', 'received data'], re: ['returns 0x41, the byte \'A\'', 'RXNE clears: the byte is consumed'],
        verdict: 'Reading a variable is free. Reading a register can clear a flag or consume a byte.' },
      { b: 'Compiler', v: ['while (x == 0) {}', 'plain int'], va: ['0x20000014', 'int x'], ve: ['may load x only once', 'cached, reordered or deleted'],
        r: ['while (!(ISR & RXNE)) {}', 'volatile register'], ra: ['USART2->ISR', 'volatile uint32_t'], re: ['loads ISR on every pass', 'every access happens, as written'],
        verdict: 'The last row is why volatile exists: every access to a register must really happen, in order.' },
    ];
    steps(viz('rv-steps'), RV.map(x => x.b), k => {
      const c = RV[k];
      dyn.textContent = '';
      [[14, c.v, c.va, c.ve, 'f-sec-soft', 't-sec'], [104, c.r, c.ra, c.re, 'f-pri-soft', 't-pri']].forEach(([y, op, ad, ef, fill, tc]) => {
        card(dyn, 96, y, 180, 56, [[op[0], 't-fg t-bold'], [op[1], 't-sm']]);
        arrow(dyn, 276, y + 28, 304, y + 28, { cls: 'a-muted' });
        card(dyn, 306, y, 164, 56, [[ad[0], 't-fg t-bold'], [ad[1], tc + ' t-bold']]);
        arrow(dyn, 470, y + 28, 498, y + 28, { cls: 'a-muted' });
        card(dyn, 500, y, 290, 56, [[ef[0], tc + ' t-bold'], [ef[1], 't-fg']], fill);
      });
      T(dyn, 400, 188, c.verdict, 't-fg t-bold', 'middle');
    });
  });

  // Figure 6: control, status, data around a state machine
  part('roles', () => {
    const g = svg(viz('roles'), 700, 280, { label: 'Control, status and data registers around the peripheral state machine, filled in for five peripherals', minWidth: 540 });
    const P = [
      { b: 'Roles', name: 'the peripheral', c: 'settings', st: 'what happened', d: 'the payload', pins: 'the outside world' },
      { b: 'USART', name: 'USART', c: 'CR1: baud, enable, interrupts', st: 'ISR: is the buffer empty?', d: 'TDR / RDR', pins: 'TX, RX' },
      { b: 'SPI', name: 'SPI', c: 'CR1: clock speed, polarity', st: 'SR: transfer complete?', d: 'DR', pins: 'SCK, MISO, MOSI' },
      { b: 'ADC', name: 'ADC', c: 'CFGR: channel, resolution', st: 'ISR: conversion done?', d: 'DR', pins: 'analog inputs' },
      { b: 'Timer', name: 'Timer', c: 'CR1, PSC, ARR', st: 'SR: did it overflow?', d: 'CNT, CCR', pins: 'channel pins' },
      { b: 'GPIO', name: 'GPIO', c: 'MODER, PUPDR', st: 'IDR: what are the pins?', d: 'ODR, BSRR', pins: 'the port\'s pins' },
    ];
    const roleBox = (y, name, who) => {
      s('rect', { x: 16, y, width: 220, height: 64, rx: 6, class: 'f-surface box' }, g);
      T(g, 126, y + 16, name, 't-fg t-bold', 'middle');
      const reg = T(g, 126, y + 34, '', 't-pri t-bold', 'middle');
      T(g, 126, y + 51, who, 't-sm', 'middle');
      return reg;
    };
    const rc = roleBox(14, 'CONTROL', 'you write it');
    const rs = roleBox(100, 'STATUS', 'the hardware writes it, you read it');
    const rd = roleBox(186, 'DATA', 'both ways');
    s('rect', { x: 300, y: 14, width: 190, height: 236, rx: 8, class: 'f-pri-soft outline-pri' }, g);
    const pn = T(g, 395, 120, '', 't-pri t-bold t-lg', 'middle');
    T(g, 395, 142, 'a state machine', null, 'middle');
    arrow(g, 236, 46, 298, 46, { cls: 'a-muted', label: 'configure' });
    arrow(g, 300, 132, 238, 132, { cls: 'a-muted', label: 'report' });
    arrow(g, 236, 211, 298, 211, { cls: 'a-muted' });
    arrow(g, 300, 225, 238, 225, { cls: 'a-muted' });
    arrow(g, 490, 132, 556, 132, { cls: 'a-pri', width: 2 });
    s('rect', { x: 560, y: 100, width: 126, height: 64, rx: 6, class: 'f-surface box' }, g);
    T(g, 623, 120, 'pins', 't-fg t-bold', 'middle');
    const pp = T(g, 623, 140, '', 't-pri', 'middle');
    T(g, 350, 268, 'Configure with CONTROL. Watch with STATUS. Move bytes through DATA.', 't-fg', 'middle');
    const tbl = table(viz('roles-table'), ['Peripheral', 'Control', 'Status', 'Data'].map(t => ({ text: t, cls: 'l' })),
      P.slice(1).map(p => [p.name, p.c, p.st, p.d].map(t => ({ text: t, cls: 'l' }))));
    steps(viz('roles-steps'), P.map(p => p.b), k => {
      const p = P[k];
      setText([rc, rs, rd, pn, pp], [p.c, p.st, p.d, p.name, p.pins]);
      tbl.rows.forEach((r, i) => r.classList.toggle('on', i === k - 1));
    });
  });

  // Figure 7: CONTROL bits and the two modes
  part('ctl', () => {
    const g = svg(viz('ctl'), 760, 290, { label: 'CONTROL register bits SPSEL and nPRIV and their effect on Thread mode; Handler mode always runs privileged on MSP', minWidth: 560 });
    const val = T(g, 20, 31, '', 't-fg t-bold t-lg');
    s('rect', { x: 170, y: 16, width: 360, height: 30, class: 'f-seg sep' }, g);
    T(g, 350, 31, 'bits 31:2 reserved, read as 0', 't-muted', 'middle');
    const bitCell = x => ({ r: s('rect', { x, y: 16, width: 80, height: 30, class: 'f-pri-soft sep' }, g), t: T(g, x + 40, 31, '0', 't-pri', 'middle') });
    const b1 = bitCell(530), b0 = bitCell(610);
    [['bit 1', 'SPSEL', 570], ['bit 0', 'nPRIV', 650]].forEach(([a, b, x]) => { T(g, x, 58, a, 't-sm', 'middle'); T(g, x, 72, b, 't-fg t-bold', 'middle'); });
    s('rect', { x: 40, y: 92, width: 270, height: 124, rx: 8, class: 'f-pri-soft outline-pri' }, g);
    T(g, 175, 112, 'THREAD mode', 't-pri t-bold t-lg', 'middle');
    T(g, 175, 132, 'main(), later each RTOS task', null, 'middle');
    const tStack = T(g, 175, 162, '', 't-fg t-bold', 'middle');
    const tPriv = T(g, 175, 184, '', 't-fg t-bold', 'middle');
    T(g, 175, 202, 'set by CONTROL', 't-sm', 'middle');
    s('rect', { x: 450, y: 92, width: 270, height: 124, rx: 8, class: 'f-sec-soft box' }, g);
    T(g, 585, 112, 'HANDLER mode', 't-sec t-bold t-lg', 'middle');
    T(g, 585, 132, 'every interrupt and fault', null, 'middle');
    T(g, 585, 162, 'stack: always MSP', 't-fg t-bold', 'middle');
    T(g, 585, 184, 'always privileged', 't-fg t-bold', 'middle');
    T(g, 585, 202, 'CONTROL does not apply', 't-sm', 'middle');
    arrow(g, 312, 126, 448, 126, { cls: 'a-muted', label: 'interrupt' });
    arrow(g, 448, 184, 312, 184, { cls: 'a-muted', label: 'return', dy: 16 });
    const n1 = T(g, 380, 246, '', 't-fg', 'middle');
    const n2 = T(g, 380, 266, '', 't-fg', 'middle');
    const C = [
      { b: '0x0 reset', n: ['0x0 is the reset value: Thread mode runs privileged on MSP, the stack the handlers use.', 'Every program in this course runs this way until the RTOS lesson.'] },
      { b: '0x1', n: ['0x1: nPRIV = 1. Thread mode is unprivileged but still on MSP.', 'Thread code cannot raise its own privilege again; only a handler can.'] },
      { b: '0x2', n: ['0x2: SPSEL = 1. Thread mode is privileged and runs on PSP, a stack of its own.', 'An interrupt still switches the handler itself to MSP.'] },
      { b: '0x3 RTOS task', n: ['0x3: PSP and unprivileged, the typical RTOS task, each task with its own stack.', 'Handlers still run on MSP, privileged, so a fault handler survives a wrecked task.'] },
    ];
    steps(viz('ctl-steps'), C.map(c => c.b), k => {
      const sp = (k >> 1) & 1, np = k & 1;
      val.textContent = 'CONTROL = 0x' + k;
      [[b1, sp], [b0, np]].forEach(([c, v]) => {
        c.r.setAttribute('class', (v ? 'f-pri' : 'f-pri-soft') + ' sep');
        c.t.setAttribute('class', v ? 't-on t-bold' : 't-pri');
        c.t.textContent = v;
      });
      tStack.textContent = 'stack: ' + (sp ? 'PSP' : 'MSP');
      tPriv.textContent = np ? 'unprivileged' : 'privileged';
      setText([n1, n2], C[k].n);
    });
  });

  // Figure 8: one stray store, with and without an MMU
  part('stray', () => {
    const g = svg(viz('stray'), 800, 214, { label: 'A store through a stray pointer: on a desktop the MMU raises a segmentation fault, on this chip it writes GPIOA ODR with no error', minWidth: 560 });
    const lane = (y, name, sub, cls, mid, res, resFill, resCls) => {
      T(g, 10, y + 20, name, cls + ' t-bold');
      T(g, 10, y + 36, sub, 't-sm');
      card(g, 110, y, 170, 56, [['*p = 1;', 't-fg t-bold'], ['p = 0x50000014', 't-sm']]);
      arrow(g, 280, y + 28, 328, y + 28, { cls: 'a-muted' });
      card(g, 330, y, 200, 56, mid);
      arrow(g, 530, y + 28, 578, y + 28, { cls: 'a-muted' });
      card(g, 580, y, 210, 56, res, resFill, resCls);
    };
    lane(20, 'desktop', 'with an MMU', 't-sec', [['MMU: page table', 't-sec t-bold'], ['no mapping for this page', 't-fg']],
      [['segmentation fault', 't-sec t-bold'], ['the OS stops the program', 't-fg']], 'f-sec-soft');
    lane(112, 'this chip', 'no MMU', 't-pri', [['real address, no check', 't-pri t-bold'], ['0x50000014 = GPIOA->ODR', 't-fg']],
      [['PA0 goes high', 't-bad t-bold'], ['no error, nothing reported', 't-fg']], 'f-bad-soft');
    T(g, 400, 196, 'The desktop catches the bug. This chip carries it out, silently.', 't-fg t-bold', 'middle');
  });

  // Figure 9: vector table lookup
  part('vec', () => {
    const g = svg(viz('vec'), 800, 344, { label: 'Vector table lookup: IRQ number to exception number to slot address to handler', minWidth: 560 });
    T(g, 230, 14, 'vector table at 0x08000000 (also seen at 0x00000000)', 't-fg t-bold');
    const dyn = s('g', {}, g);
    const VC = [
      { b: 'USART2 · IRQ 28', src: ['USART2 fires', 'IRQ 28'], n: 28, h: 'USART2_IRQHandler',
        note: 'USART2 is IRQ 28. Exception number 16 + 28 = 44, slot offset 4 × 44 = 176 = 0xB0. The NVIC reads the word at 0x080000B0 and jumps to the address it finds there.' },
      { b: 'EXTI4_15 · IRQ 7', src: ['EXTI lines 4–15', 'IRQ 7'], n: 7, h: 'EXTI4_15_IRQHandler',
        note: 'EXTI lines 4 to 15 share IRQ 7. Exception 16 + 7 = 23, offset 4 × 23 = 92 = 0x5C, so the slot is at 0x0800005C (guide practice problem P5).' },
      { b: 'EXTI0_1 · IRQ 5', src: ['EXTI lines 0–1', 'IRQ 5'], n: 5, h: 'EXTI0_1_IRQHandler',
        note: 'IRQ 5. Exception 16 + 5 = 21, offset 4 × 21 = 84 = 0x54, slot 0x08000054. Inside the handler IPSR reads 21.' },
      { b: 'IRQ 0', src: ['vendor IRQ 0', 'IRQ 0'], n: 0, h: 'IRQ 0 handler',
        note: 'The first vendor interrupt comes right after ARM\'s 16 slots. Exception 16, offset 4 × 16 = 64 = 0x40, slot 0x08000040.' },
      { b: 'Reset', src: ['reset', 'exception 1'], n: null, h: 'Reset_Handler',
        note: 'Reset is exception 1, one of ARM\'s slots. The CPU loads MSP from slot 0 (0x20003000 on this chip) and starts at the address in slot 1.' },
    ];
    const note = role('vec-note');
    steps(viz('vec-steps'), VC.map(c => c.b), k => {
      const c = VC[k], slot = c.n === null ? 1 : 16 + c.n, addr = 0x08000000 + 4 * slot;
      dyn.textContent = '';
      const rows = [
        { a: 0x08000000, slot: '[0]', text: 'initial stack pointer' },
        { a: 0x08000004, slot: '[1]', text: 'Reset_Handler' },
        { a: 0x08000008, slot: '[2–15]', text: 'ARM\'s exceptions, faults' },
        { a: 0x08000040, slot: '[16]', text: 'IRQ 0 handler' },
      ];
      if (slot > 16) {
        if (slot > 17) rows.push({ text: '…' });
        rows.push({ a: addr, slot: `[${slot}]`, text: c.h });
      }
      rows.push({ text: '…' });
      const ti = slot === 1 ? 1 : slot === 16 ? 3 : rows.length - 2;
      const ry = i => 30 + i * 34;
      rows.forEach((r, i) => {
        const on = i === ti, y = ry(i);
        s('rect', { x: 230, y, width: 330, height: 30, rx: 4, class: on ? 'f-pri' : 'f-seg' }, dyn);
        if (r.a == null) { T(dyn, 395, y + 15, r.text, 't-muted', 'middle'); return; }
        T(dyn, 238, y + 15, hex(r.a), on ? 't-on' : 't-muted');
        T(dyn, 312, y + 15, r.slot, on ? 't-on t-bold' : 't-fg');
        T(dyn, 362, y + 15, r.text, on ? 't-on t-bold' : 't-fg');
      });
      card(dyn, 10, 40, 190, 46, [[c.src[0], 't-on t-bold'], [c.src[1], 't-on']], 'f-pri', 'sep');
      arrow(dyn, 105, 86, 105, 110, { cls: 'a-pri', width: 2 });
      const lines = c.n === null
        ? ['exception 1, no IRQ number', 'offset 4 × 1 = 4 = 0x04', '0x08000000 + 0x04', '= ' + hex(addr)]
        : [`exception 16 + ${c.n} = ${slot}`, `offset 4 × ${slot} = ${4 * slot} = 0x${h2(4 * slot)}`, `0x08000000 + 0x${h2(4 * slot)}`, '= ' + hex(addr)];
      card(dyn, 10, 112, 190, 86, lines.map((t, i) => [t, i === 3 ? 't-pri t-bold' : 't-fg']), 'f-pri-soft', 'outline-pri');
      const ty = ry(ti) + 15;
      arrow(dyn, 200, 155, 228, ty, { cls: 'a-pri', width: 2 });
      arrow(dyn, 560, ty, 602, ty, { cls: 'a-pri', width: 2, label: 'jump', labelCls: 't-pri t-bold' });
      card(dyn, 604, ty - 23, 186, 46, [[c.h, 't-fg t-bold'], ['your function', 't-sm']], 'f-surface', 'outline-pri');
      T(dyn, 400, 304, c.n === null ? 'Slot 0 is not code. It holds the initial stack pointer, 0x20003000 here.' : `While the handler runs, IPSR (xPSR bits 5:0) = ${slot} = 0x${h2(slot)}.`, 't-fg t-bold', 'middle');
      T(dyn, 400, 326, 'Put the wrong address in a slot and the chip jumps there anyway.', 't-bad', 'middle');
      note.textContent = c.note;
    });
  });

  // Figure 10: bytes at increasing addresses
  part('mem', () => {
    const g = svg(viz('mem'), 800, 196, { label: 'Eight bytes of memory with word boundaries: little-endian and big-endian byte order, and aligned and unaligned accesses', minWidth: 560 });
    const X0 = 140, CW = 80, YL = 56, YB = 136;
    const dyn = s('g', {}, g);
    const M = [
      { b: '0x12345678', base: 0x20000100, le: [0x78, 0x56, 0x34, 0x12], be: [0x12, 0x34, 0x56, 0x78], br: [[0, 3, 'word 0x12345678 at 0x20000100', 'ok']],
        note: 'Little-endian puts the least significant byte first: 0x78 at the lowest address, 0x12 at +3. Big-endian, below, would put 0x12 first. Every STM32 is little-endian.' },
      { b: '0xAABBCCDD', base: 0x20000100, le: [0xDD, 0xCC, 0xBB, 0xAA], be: [0xAA, 0xBB, 0xCC, 0xDD], br: [[0, 3, 'word 0xAABBCCDD at 0x20000100', 'ok']],
        note: 'Reading the first byte, *(uint8_t *)0x20000100, gives 0xDD, the low byte. On a big-endian machine it would give 0xAA.' },
      { b: 'vector table bytes', base: 0x08000000, le: [0x00, 0x30, 0x00, 0x20, 0xC5, 0x06, 0x00, 0x08], br: [[0, 3, 'slot 0 = 0x20003000, initial SP', 'ok'], [4, 7, 'slot 1 = 0x080006C5, reset vector', 'ok']],
        note: 'The first 8 bytes of a flash image (guide P10). Read each word from its highest byte down: 20 00 30 00 is 0x20003000, the top of RAM, and 08 00 06 C5 is 0x080006C5. Bit 0 is the Thumb bit, so the handler starts at 0x080006C4.' },
      { b: 'halfword at +2', base: 0x20000100, le: [0x78, 0x56, 0x34, 0x12, 0xDD, 0xCC, 0xBB, 0xAA], br: [[2, 3, 'halfword at 0x20000102 = 0x1234', 'ok']],
        note: '0x12345678 at 0x20000100 and 0xAABBCCDD after it. A halfword at 0x20000102: 0x20000102 mod 2 = 0, so it is aligned. Bytes 34 12 read as 0x1234.' },
      { b: 'word at +1', base: 0x20000100, le: [0x78, 0x56, 0x34, 0x12, 0xDD, 0xCC, 0xBB, 0xAA], br: [[1, 4, 'word at 0x20000101: crosses a word boundary', 'bad']],
        note: '(uint32_t *)(buf + 1) with buf = 0x20000100 gives 0x20000101, and 0x20000101 mod 4 = 1. The M0+ raises a HardFault at once. An M3 or M4 would read bytes 56 34 12 DD as 0xDD123456, using two bus accesses.' },
    ];
    T(g, 10, YL + 14, 'little-endian', 't-pri t-bold');
    T(g, 10, YL + 30, 'this chip', 't-sm');
    const beLab = s('g', {}, g);
    T(beLab, 10, YB + 14, 'big-endian', 't-sec t-bold');
    T(beLab, 10, YB + 30, 'network order', 't-sm');
    const note = role('mem-note');
    steps(viz('mem-steps'), M.map(m => m.b), k => {
      const m = M[k];
      dyn.textContent = '';
      const inBr = i => m.br.find(([a, z]) => i >= a && i <= z);
      for (let i = 0; i < 8; i++) {
        const x = X0 + i * CW, v = m.le[i], br = inBr(i);
        T(dyn, x + CW / 2, YL - 10, hex(m.base + i), 't-sm', 'middle');
        const fill = v == null ? 'f-seg' : br ? (br[3] === 'bad' ? 'f-bad' : 'f-pri') : 'f-pri-soft';
        s('rect', { x, y: YL, width: CW, height: 44, class: fill + ' sep' }, dyn);
        T(dyn, x + CW / 2, YL + 22, v == null ? '··' : h2(v), v == null ? 't-muted' : br ? 't-on t-bold t-lg' : 't-pri t-lg', 'middle');
        if (m.be) {
          const w = m.be[i];
          s('rect', { x, y: YB, width: CW, height: 44, class: (w == null ? 'f-seg' : 'f-sec-soft') + ' sep' }, dyn);
          T(dyn, x + CW / 2, YB + 22, w == null ? '··' : h2(w), w == null ? 't-muted' : 't-sec t-lg', 'middle');
        }
      }
      [0, 4, 8].forEach(i => s('line', { x1: X0 + i * CW, x2: X0 + i * CW, y1: YL - 4, y2: m.be ? YB + 48 : YL + 48, class: 's-fg', style: 'stroke-width: 3' }, dyn));
      m.br.forEach(([a, z, label, c]) => {
        const x1 = X0 + a * CW + 4, x2 = X0 + (z + 1) * CW - 4;
        s('path', { d: `M${x1} 32 V26 H${x2} V32`, class: c === 'bad' ? 's-bad' : 's-pri', style: 'stroke-width: 1.5' }, dyn);
        T(dyn, (x1 + x2) / 2, 13, label, (c === 'bad' ? 't-bad' : 't-pri') + ' t-bold', 'middle');
      });
      if (!m.be) T(dyn, X0, YB + 22, k === 2 ? 'little-endian words: 0x20003000 and 0x080006C5' : 'the same bytes as 0x12345678, then 0xAABBCCDD', 't-fg');
      beLab.setAttribute('visibility', m.be ? 'visible' : 'hidden');
      note.textContent = m.note;
    });
  });

  // Figure 11: oscillator to pin, with the faults that give no error
  part('gate', () => {
    const g = svg(viz('gate'), 800, 296, { label: 'Clock path from oscillator through divider, bus clock, RCC gate, USART2 and pin multiplexer to PA2, and what each fault looks like', minWidth: 560 });
    const B = [
      { x: 10, w: 100, l: ['HSI48', '48 MHz'] },
      { x: 140, w: 100, l: ['divider', ''] },
      { x: 270, w: 100, l: ['APB clock', ''] },
      { x: 400, w: 90, l: ['RCC gate', ''] },
      { x: 520, w: 110, l: ['USART2', ''] },
      { x: 660, w: 56, l: ['MUX', ''] },
      { x: 740, w: 50, l: ['PA2', 'TX'] },
    ];
    T(g, 125, 22, 'one oscillator, divided', 't-muted', 'middle');
    T(g, 445, 22, 'clock gate', 't-muted', 'middle');
    T(g, 688, 22, 'pin mux', 't-muted', 'middle');
    const boxes = B.map(b => card(g, b.x, 40, b.w, 60, [[b.l[0], 't-fg t-bold'], [b.l[1], 't-pri']]));
    B.slice(0, -1).forEach((b, i) => arrow(g, b.x + b.w, 70, B[i + 1].x - 2, 70, { cls: 'a-muted' }));
    const ov = s('g', {}, g);
    const OBS = ['USART2->CR1 read back', 'PA2 pin', 'bit rate on the wire', 'terminal set to 115200'];
    const vals = OBS.map((t, i) => {
      const y = 140 + i * 30;
      s('line', { x1: 10, x2: 790, y1: y - 15, y2: y - 15, class: 's-line' }, g);
      T(g, 20, y, t, 't-fg t-bold');
      return T(g, 260, y, '');
    });
    const verdict = T(g, 400, 278, '', 't-fg t-bold', 'middle');
    const C = [
      { b: 'Working', box: ['÷ 1', '48 MHz', 'USART2EN = 1', 'BRR = 417', 'AF1'], bad: [],
        obs: [['the value written', 1], ['carries the frames', 1], ['48 000 000 / 417 = 115 108 baud (−0.08 %)', 1], ['Hello', 1]],
        v: 'Both gates open, and the divisor was computed from the bus clock the USART really gets.' },
      { b: 'Clock gate shut', box: ['÷ 1', '48 MHz', 'USART2EN = 0', 'BRR = 417', 'AF1'], bad: [3],
        obs: [['0x00000000: every write was ignored', 0], ['idle, no signal', 0], ['none', 0], ['nothing', 0]],
        v: 'A peripheral with no clock reads back as zero and ignores every write. No error anywhere.' },
      { b: 'Wrong pin owner', box: ['÷ 1', '48 MHz', 'USART2EN = 1', 'BRR = 417', 'not AF1'], bad: [5],
        obs: [['the value written', 1], ['electrically healthy, no signal', 0], ['115 108 baud inside the chip, never reaches the pin', 0], ['nothing', 0]],
        v: 'The USART runs, but PA2 belongs to another owner, so the wire stays silent.' },
      { b: 'BRR from the wrong clock', box: ['÷ 4, reset', '12 MHz', 'USART2EN = 1', 'BRR = 417', 'AF1'], bad: [1, 2, 4],
        obs: [['the value written', 1], ['carries the frames', 1], ['12 000 000 / 417 = 28 777 baud, 4 times too slow', 0], ['garbage characters', 0]],
        v: 'The code assumed 48 MHz, but the clock was never raised from the reset 12 MHz.' },
    ];
    steps(viz('gate-steps'), C.map(c => c.b), k => {
      const c = C[k];
      ov.textContent = '';
      c.box.forEach((t, i) => {
        const bx = boxes[i + 1], bad = c.bad.indexOf(i + 1) >= 0;
        bx.ts[1].textContent = t;
        bx.ts[1].setAttribute('class', bad ? 't-bad t-bold' : 't-pri');
        bx.r.setAttribute('class', (bad ? 'f-bad-soft' : 'f-surface') + ' box');
        if (bad) s('rect', { x: B[i + 1].x, y: 40, width: B[i + 1].w, height: 60, rx: 6, class: 's-bad' }, ov);
      });
      c.obs.forEach(([t, ok], i) => {
        vals[i].textContent = t;
        vals[i].setAttribute('class', ok ? 't-ok t-bold' : 't-bad t-bold');
      });
      verdict.textContent = c.v;
    });
  });

  // Figure 12: slide 14's block diagram with the three leaks lit
  part('leak', () => {
    const g = svg(viz('leak'), 640, 322, { label: 'Block diagram of core, bus matrix, flash, SRAM, AHB, APB, pin mux and pins, with the pipeline, two buses and slow flash leaks highlighted', minWidth: 520 });
    T(g, 87, 10, 'ARM\'s', 't-pri t-bold', 'middle');
    T(g, 442, 10, 'ST\'s', 't-sec t-bold', 'middle');
    s('path', { d: 'M12 24 V20 H162 V24', class: 's-pri', style: 'stroke-width: 1.5' }, g);
    s('path', { d: 'M266 24 V20 H618 V24', class: 's-sec', style: 'stroke-width: 1.5' }, g);
    const wires = s('g', { class: 'fade' }, g);
    const blk = (x, y, w, h, lines) => {
      const gg = s('g', { class: 'fade' }, g);
      return { gg, ...card(gg, x, y, w, h, lines) };
    };
    const core = blk(12, 30, 150, 112, []);
    T(core.gg, 87, 44, 'Cortex-M core', 't-fg t-bold', 'middle');
    [['R0–R15', 54], ['NVIC', 80], ['SysTick', 106]].forEach(([t, y]) => card(core.gg, 24, y, 126, 22, [[t, 't-fg t-sm']], 'f-seg', 'sep'));
    const osc = blk(12, 160, 150, 36, [['oscillators']]);
    const mx = blk(186, 30, 52, 166, [['BUS', 't-fg t-bold'], ['MATRIX', 't-fg t-bold']]);
    const fl = blk(266, 30, 170, 38, [['FLASH', 't-fg t-bold'], ['+ wait states', 't-sm']]);
    const sr = blk(266, 76, 170, 34, [['SRAM', 't-fg t-bold']]);
    const ahb = blk(266, 118, 170, 42, [['AHB, fast', 't-fg t-bold'], ['GPIO, DMA, RCC', 't-sm']]);
    const br = blk(266, 170, 170, 26, [['APB bridge', 't-sm']]);
    const apb = blk(266, 206, 170, 42, [['APB, slow', 't-fg t-bold'], ['USART, SPI, I2C, TIM, ADC', 't-sm']]);
    const mux = blk(462, 118, 66, 130, [['PIN', 't-fg t-bold'], ['MUX', 't-fg t-bold']]);
    const pins = blk(552, 118, 66, 130, [['pins', 't-fg t-bold']]);
    [[162, 86, 184, 86], [238, 49, 264, 49], [238, 93, 264, 93], [238, 139, 264, 139], [238, 183, 264, 183], [436, 139, 460, 139], [436, 227, 460, 227], [528, 183, 550, 183]]
      .forEach(([a, b, c, d]) => arrow(wires, a, b, c, d, { cls: 'a-muted', head: 6 }));
    s('line', { x1: 351, x2: 351, y1: 196, y2: 206, class: 's-muted' }, wires);
    const all = [core, osc, mx, fl, sr, ahb, br, apb, mux, pins];
    const lines = [0, 1, 2].map(i => T(g, 12, 272 + i * 18, '', i ? 't-fg' : 't-fg t-bold'));
    const L = [
      { b: 'All', on: [], t: ['Left of the bus matrix is ARM\'s, identical on every Cortex-M. Right of it is ST\'s.', 'You never program these blocks directly.', 'Three of them still show up in code you must write. Pick one.'] },
      { b: 'Pipeline', on: [core], t: ['Pipelining: fetch, decode and execute of consecutive instructions overlap.', 'So the PC reads ahead of the instruction being executed,', 'and a taken branch throws away work already started.'] },
      { b: 'Two buses', on: [ahb, br, apb], t: ['A fast AHB and a slow APB, each with its own clock-enable register.', 'Enable a peripheral\'s clock on the bus it sits on:', 'RCC->AHBENR for AHB blocks, RCC->APBENR1 for USART2, TIM3 and the like.'] },
      { b: 'Slow flash', on: [fl], t: ['The processor–memory speed gap: the core runs at 48 MHz, the flash cannot.', 'FLASH->ACR sets the wait states, 1 for 48 MHz on this chip.', 'Set them before raising the clock, never after.'] },
    ];
    steps(viz('leak-steps'), L.map(l => l.b), k => {
      const on = L[k].on;
      all.forEach(b => {
        const lit = on.indexOf(b) >= 0;
        b.gg.classList.toggle('dim', k > 0 && !lit);
        b.r.setAttribute('class', lit ? 'f-pri-soft outline-pri' : 'f-surface box');
      });
      wires.classList.toggle('dim', k > 0);
      setText(lines, L[k].t);
    });
  });

  // General idea vs this chip; the first three rows are guide §2's contrasts for lesson 00
  part('contrast', () => {
    const rows = [
      ['I/O model', 'port-mapped (isolated) I/O: x86 in/out, AVR IN/OUT', 'memory-mapped I/O, no port space', 'peripherals are reached by ordinary ldr/str; only the address tells a register from a variable; with no MMU a stray pointer can write a peripheral'],
      ['Address spaces', 'Harvard: separate code and data spaces (AVR: LPM, PROGMEM)', 'von Neumann: one unified address space', 'a const array in flash is read by ordinary ldr; separate buses on some cores do not change the map'],
      ['Interrupt dispatch', 'non-vectored: one entry, software asks who called; vectored tables of jump instructions (AVR) or descriptors (x86)', 'vectored, a table of plain addresses built by your code', 'the handler\'s address in slot 16 + n connects it; no registration call; a wrong address is jumped to anyway'],
      ['Register file', 'one accumulator (6502, 8051), a stack (JVM, Forth), 32 × 8-bit (AVR), 32 × 32-bit (RISC-V)', '16 × 32-bit: R0–R12 free; SP, LR, PC fixed', 'the whole CPU state is small, so an interrupt saves it in a few cycles'],
      ['Privilege and protection', 'MMU: kernel and user mode, private virtual memory', 'two levels, no MMU, optional MPU', 'a stray pointer reaches a peripheral with no segfault; handlers always run privileged on MSP'],
      ['Word size', '8-bit (AVR)', '32-bit registers, ALU and bus', 'uint8_t is not cheaper than uint32_t; it often costs an extra mask'],
      ['Alignment', 'x86 permits it (slower); classic SPARC refuses; M3/M4 permit it', 'M0+: an unaligned access HardFaults', 'casting a uint8_t* buffer to uint32_t* crashes on this chip'],
      ['Byte order', 'big-endian: 68000, classic SPARC, network byte order', 'little-endian, every STM32', '0x12345678 is stored 78 56 34 12; bytes from the network need htonl()-style swapping'],
      ['Processor–memory gap', 'caches on large machines', 'flash wait states and a prefetch buffer', 'set FLASH->ACR before raising the clock'],
    ];
    const t = table(viz('contrast'), ['General idea', 'Alternatives', 'This chip', 'What follows'].map(x => ({ text: x, cls: 'l' })),
      rows.map(r => r.map((c, i) => ({ text: c, cls: i === 2 ? 'l hl' : 'l' }))));
    t.rows.slice(0, 3).forEach(r => r.classList.add('on'));
  });
});
