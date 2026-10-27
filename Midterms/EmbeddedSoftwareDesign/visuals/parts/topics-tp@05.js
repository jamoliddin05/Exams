QV.register('topic5', function (q) {
  const { s, svg, steps, slider, arrow, box, axes, line, table } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const hex = v => '0x' + (v >>> 0).toString(16).toUpperCase().padStart(8, '0');
  const tx = (g, x, y, text, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls || null }, g, text);
  // keep a centred label of n characters between lo and hi
  const clampX = (x, n, lo, hi, cw) => Math.max(lo + n * (cw || 6.6) / 2, Math.min(hi - n * (cw || 6.6) / 2, x));
  // each figure is isolated so one failure leaves the rest of the article drawn
  const fig = (name, fn) => { try { fn(); } catch (e) { QV.fail('topic5 ' + name, e); } };
  const bit = (g, x, y, w, h, one, label) => {
    s('rect', { x, y, width: w, height: h, class: (one ? 'f-pri' : 'f-seg') + ' sep' }, g);
    tx(g, x + w / 2, y + h / 2, label != null ? label : String(one), one ? 't-on' : 't-muted', 'middle');
  };

  // Figure 1: pin n's field in each register kind (slide 4)
  fig('pins', () => {
    const C = 19, X0 = 186, END = X0 + 32 * C;
    const bx = b => X0 + (31 - b) * C;
    const g0 = svg(viz('pin-bars'), 800, 284, { label: 'Pin n field in IDR, BSRR, MODER and AFR, drawn to one bit scale', minWidth: 560 });
    [31, 24, 16, 8, 0].forEach(b => tx(g0, bx(b) + C / 2, 12, String(b), 't-sm', 'middle'));
    const g = s('g', {}, g0);
    const Y = [30, 100, 166, 232];
    const cell = (y, hi, w, label, cls) => {
      s('rect', { x: bx(hi), y, width: w * C, height: 24, class: cls + ' sep' }, g);
      tx(g, bx(hi) + w * C / 2, y + 12, label, (cls === 'f-seg' ? 't-muted' : 't-on') + ' t-sm', 'middle');
    };
    const caption = (y, hi, w, text, cls) => tx(g, clampX(bx(hi) + w * C / 2, text.length, X0, END, 7), y + 38, text, cls + ' t-bold', 'middle');
    const pad = (a, b, c, d) => a.padEnd(24) + b.padEnd(14) + c.padEnd(14) + '= ' + d;
    function draw(n) {
      g.textContent = '';
      const k = n >> 3, m = n % 8;
      [['IDR  ODR  OTYPER', '1 bit per pin'], ['BSRR', 'set bit + reset bit'], ['MODER  OSPEEDR  PUPDR', '2 bits per pin'], [`AFR[${n} / 8] = AFR[${k}]`, '4 bits per pin']].forEach(([a, b], i) => {
        tx(g, 0, Y[i] + 5, a, 't-fg t-bold');
        tx(g, 0, Y[i] + 20, b, 't-sm');
      });
      let y = Y[0];
      s('rect', { x: bx(31), y, width: 16 * C, height: 24, class: 'f-none s-line dash' }, g);
      tx(g, bx(31) + 8 * C, y + 12, 'reserved', 't-sm', 'middle');
      for (let p = 15; p >= 0; p--) cell(y, p, 1, String(p), p === n ? 'f-pri' : 'f-seg');
      caption(y, n, 1, 'bit ' + n, 't-pri');
      y = Y[1];
      tx(g, bx(31) + 8 * C, y - 8, 'reset half: pins 15–0', 't-sec t-sm', 'middle');
      tx(g, bx(15) + 8 * C, y - 8, 'set half: pins 15–0', 't-pri t-sm', 'middle');
      for (let p = 15; p >= 0; p--) {
        cell(y, p + 16, 1, String(p), p === n ? 'f-sec' : 'f-seg');
        cell(y, p, 1, String(p), p === n ? 'f-pri' : 'f-seg');
      }
      caption(y, n + 16, 1, 'reset: bit ' + (n + 16), 't-sec');
      caption(y, n, 1, 'set: bit ' + n, 't-pri');
      y = Y[2];
      for (let p = 15; p >= 0; p--) cell(y, 2 * p + 1, 2, String(p), p === n ? 'f-pri' : 'f-seg');
      caption(y, 2 * n + 1, 2, `bits ${2 * n + 1}:${2 * n}`, 't-pri');
      y = Y[3];
      for (let p = 7; p >= 0; p--) cell(y, 4 * p + 3, 4, String(8 * k + p), p === m ? 'f-pri' : 'f-seg');
      caption(y, 4 * m + 3, 4, `bits ${4 * m + 3}:${4 * m}`, 't-pri');
      role('pin-calc').textContent = [
        `pin n = ${n}`,
        pad('IDR, ODR, OTYPER', `bit ${n}`, `1u << ${n}`, hex(2 ** n)),
        pad('MODER, OSPEEDR, PUPDR', `bits ${2 * n + 1}:${2 * n}`, `3u << ${2 * n}`, hex(3 * 2 ** (2 * n))),
        pad(`AFR[${n} / 8] = AFR[${k}]`, `bits ${4 * m + 3}:${4 * m}`, `0xFu << ${4 * m}`, hex(15 * 2 ** (4 * m))),
        pad('BSRR set', `bit ${n}`, `1u << ${n}`, hex(2 ** n)),
        pad('BSRR reset', `bit ${n + 16}`, `1u << ${n + 16}`, hex(2 ** (n + 16))),
      ].join('\n');
    }
    slider(viz('pin-slider'), { label: 'pin n', min: 0, max: 15, step: 1, value: 5 }, draw);
  });

  // Figure 2: MODER read as hex, bits and two-bit fields (slides 5-6, 16)
  fig('moder', () => {
    const C = 22, X0 = 80;
    const bx = b => X0 + (31 - b) * C;
    const g0 = svg(viz('moder'), 800, 166, { label: 'A MODER value split into hex digits, bits and one two-bit mode field per pin', minWidth: 560 });
    const g = s('g', {}, g0);
    const MODE = [
      { code: '00', name: 'in', fill: 'f-ter-soft', text: 't-ter' },
      { code: '01', name: 'out', fill: 'f-pri-soft', text: 't-pri' },
      { code: '10', name: 'AF', fill: 'f-sec-soft', text: 't-sec' },
      { code: '11', name: 'an', fill: 'f-seg', text: 't-muted' },
    ];
    const VALS = [0xEBFFFFFF, 0xEBFFF7A0];
    const NOTES = [
      'Reset value 0xEBFFFFFF. E = 1110 and B = 1011 hold pins 15 to 12: 11, 10, 10, 11. Every other digit is F = 1111, two pins at 11. So every pin is analog except PA14 and PA13, which are 10, alternate function, for the SWD debugger.',
      'After start-up, 0xEBFFF7A0. Only the last three digits changed. 7 = 0111 makes PA5 01 (output) and keeps PA4 at 11. A = 1010 makes PA3 and PA2 10 (alternate function, USART2). 0 = 0000 makes PA1 and PA0 00 (input). The framed fields are the five the program wrote.',
    ];
    steps(viz('moder-steps'), ['Reset 0xEBFFFFFF', 'After start-up 0xEBFFF7A0'], k => {
      g.textContent = '';
      const v = VALS[k] >>> 0, r0 = VALS[0] >>> 0;
      [['hex', 34], ['bits', 70], ['fields', 106], ['pin', 136], ['mode', 154]].forEach(([t, y]) => tx(g, 0, y, t, 't-fg t-bold'));
      tx(g, bx(31) + C / 2, 10, '31', 't-sm', 'middle');
      tx(g, bx(0) + C / 2, 10, '0', 't-sm', 'middle');
      for (let d = 7; d >= 0; d--) {
        s('rect', { x: bx(4 * d + 3) + 1, y: 20, width: 4 * C - 2, height: 28, rx: 3, class: 'f-surface box' }, g);
        tx(g, bx(4 * d + 3) + 2 * C, 34, ((v >>> (4 * d)) & 15).toString(16).toUpperCase(), 't-fg t-bold t-lg', 'middle');
      }
      for (let b = 31; b >= 0; b--) bit(g, bx(b), 58, C, 24, (v >>> b) & 1);
      for (let p = 15; p >= 0; p--) {
        const f = (v >>> (2 * p)) & 3, md = MODE[f], x = bx(2 * p + 1);
        s('rect', { x, y: 92, width: 2 * C, height: 28, class: md.fill + ' sep' }, g);
        tx(g, x + C, 106, md.code, 't-fg t-bold', 'middle');
        if (f !== ((r0 >>> (2 * p)) & 3)) s('rect', { x: x + 2, y: 94, width: 2 * C - 4, height: 24, class: 'f-none outline-pri' }, g);
        tx(g, x + C, 136, String(p), 't-sm', 'middle');
        tx(g, x + C, 154, md.name, md.text + ' t-bold', 'middle');
      }
      role('moder-note').textContent = NOTES[k];
    });
  });

  // Figure 3: push-pull and open-drain drawn as switches (slide 7)
  fig('drive', () => {
    const g0 = svg(viz('drive'), 760, 290, { label: 'A push-pull output with its P-MOS and N-MOS, and two chips sharing one wire with a pull-up resistor', minWidth: 560 });
    const g = s('g', {}, g0);
    const RAIL = 52, NODE = 150, GND = 252, PY = 76, NY = 188, TH = 36;
    const sw = (p, x, y, name, on, gone) => box(p, x - 40, y, 80, TH, name + '\n' + (gone ? 'off for good' : on ? 'on' : 'off'), {
      cls: on ? 'f-ok' : 'f-seg', textCls: (on ? 't-on' : 't-muted') + ' t-sm', stroke: gone ? 'box dash' : 'sep', lh: 13,
    });
    const wire = (p, pts, st) => line(p, pts, st === 'bad' ? 's-bad' : st ? 's-pri' : 's-muted');
    const dot = (p, x, y) => s('circle', { cx: x, cy: y, r: 3.5, class: 'f-fg' }, p);
    const NOTES = [
      'Push-pull, ODR = 1. The gates get NOT ODR = 0. A low gate turns the P-MOS on and the N-MOS off, so the pin is connected to 3.3 V and reads 1.',
      'Push-pull, ODR = 0. The gates get 1. The N-MOS turns on and the P-MOS off, so the pin is pulled to ground and reads 0. The output drives both levels itself.',
      'Open-drain, both chips let go. Each P-MOS is off for good and both N-MOS are off. Nothing drives the wire, so the pull-up resistor holds it at 1.',
      'Open-drain, chip B pulls low. B\'s N-MOS connects the wire to ground, so the wire reads 0, and the resistor limits the current. The wire is 1 only if every chip lets go, which is a wired-AND.',
      'Two push-pull outputs on one wire. Chip A drives high through its P-MOS while chip B drives low through its N-MOS. Current flows from 3.3 V through both transistors to ground with nothing to limit it. That is a short.',
    ];
    steps(viz('drive-steps'), ['Push-pull, ODR = 1', 'Push-pull, ODR = 0', 'Open-drain, both let go', 'Open-drain, B pulls low', 'Two push-pull on one wire'], k => {
      g.textContent = '';
      // left panel: one push-pull output, x centre 210
      const L = s('g', { class: 'fade' + (k >= 2 ? ' dim' : '') }, g);
      const odr = k === 1 ? 0 : 1, hi = odr === 1;
      tx(L, 16, 16, 'Push-pull · OTYPER = 0', 't-fg t-bold');
      line(L, [[150, RAIL], [290, RAIL]], 's-fg');
      line(L, [[150, GND], [290, GND]], 's-fg');
      tx(L, 150, RAIL - 12, '3.3 V', 't-sm');
      tx(L, 150, GND + 14, 'GND', 't-sm');
      wire(L, [[210, RAIL], [210, PY]], hi);
      wire(L, [[210, PY + TH], [210, NODE]], hi);
      wire(L, [[210, NODE], [210, NY]], !hi);
      wire(L, [[210, NY + TH], [210, GND]], !hi);
      wire(L, [[210, NODE], [296, NODE]], true);
      sw(L, 210, PY, 'P-MOS', hi);
      sw(L, 210, NY, 'N-MOS', !hi);
      dot(L, 210, NODE);
      tx(L, 302, NODE, 'pin', 't-fg t-bold');
      tx(L, 302, NODE + 18, '= ' + odr, 't-pri t-bold');
      box(L, 12, NODE - 18, 64, 36, 'ODR\n= ' + odr, { cls: 'f-pri-soft', textCls: 't-fg', lh: 13 });
      box(L, 94, NODE - 14, 40, 28, 'NOT', { textCls: 't-fg t-sm' });
      line(L, [[76, NODE], [94, NODE]], 's-muted');
      line(L, [[134, NODE], [150, NODE]], 's-muted');
      line(L, [[150, PY + TH / 2], [150, NY + TH / 2]], 's-muted');
      line(L, [[150, PY + TH / 2], [170, PY + TH / 2]], 's-muted');
      line(L, [[150, NY + TH / 2], [170, NY + TH / 2]], 's-muted');
      tx(L, 114, NODE + 30, 'gate = ' + (1 - odr), 't-sm', 'middle');

      // right panel: one wire, a pull-up, chips A and B
      const R = s('g', { class: 'fade' + (k <= 1 ? ' dim' : '') }, g);
      const fight = k === 4, bLow = k >= 3, A = 570, B = 690, RX = 450;
      tx(R, 410, 16, fight ? 'Same wire · two push-pull outputs' : 'One wire · open-drain, OTYPER = 1', 't-fg t-bold');
      line(R, [[420, RAIL], [740, RAIL]], 's-fg');
      line(R, [[420, GND], [740, GND]], 's-fg');
      tx(R, 420, RAIL - 12, '3.3 V', 't-sm');
      tx(R, 420, GND + 14, 'GND', 't-sm');
      const rg = s('g', { style: fight ? 'opacity: 0.3' : null }, R);
      wire(rg, [[RX, RAIL], [RX, 72]], !fight);
      wire(rg, [[RX, 122], [RX, NODE]], !fight);
      s('rect', { x: RX - 8, y: 72, width: 16, height: 50, rx: 2, class: 'f-surface box' }, rg);
      tx(rg, RX, 97, 'R', 't-fg t-sm', 'middle');
      tx(rg, RX + 14, 97, 'pull-up', 't-sm');
      wire(R, [[RX, NODE], [A, NODE]], !fight);
      wire(R, [[A, NODE], [B, NODE]], fight ? 'bad' : true);
      wire(R, [[B, NODE], [740, NODE]], !fight);
      [[A, 'chip A', fight, false], [B, 'chip B', false, bLow]].forEach(([x, name, pOn, nOn]) => {
        wire(R, [[x, RAIL], [x, PY]], pOn ? 'bad' : false);
        wire(R, [[x, PY + TH], [x, NODE]], pOn ? 'bad' : false);
        wire(R, [[x, NODE], [x, NY]], nOn ? (fight ? 'bad' : true) : false);
        wire(R, [[x, NY + TH], [x, GND]], nOn ? (fight ? 'bad' : true) : false);
        sw(R, x, PY, 'P-MOS', pOn, !fight);
        sw(R, x, NY, 'N-MOS', nOn, false);
        dot(R, x, NODE);
        tx(R, x, GND + 22, name, 't-fg t-bold', 'middle');
      });
      dot(R, RX, NODE);
      tx(R, RX + 14, NODE - 12, 'wire', 't-sm');
      tx(R, RX + 14, NODE + 18, fight ? 'short' : bLow ? 'wire = 0' : 'wire = 1', (fight ? 't-bad' : 't-pri') + ' t-bold');
      role('drive-note').textContent = NOTES[k];
    });
  });

  // Figure 4: a BSRR (or BRR) value and its effect on the port (slide 12)
  fig('bsrr', () => {
    const C = 22, X0 = 76;
    const bx = b => X0 + (31 - b) * C;
    const g0 = svg(viz('bsrr'), 800, 146, { label: 'A BSRR value as 32 bits, its hex digits, and what it does to each of the 16 pins', minWidth: 560 });
    const g = s('g', {}, g0);
    const EX = [
      { reg: 'BSRR', port: 'PA', v: 0x00000020,
        calc: 'GPIOA->BSRR = 1u << 5\n            = 0x00000020        set bit 5: PA5 high',
        note: 'Only bit 5 of the set half is 1, so PA5 goes high. Every 0 means leave alone, so the other 15 pins keep their levels.' },
      { reg: 'BSRR', port: 'PA', v: 0x00200000,
        calc: 'GPIOA->BSRR = 1u << (5 + 16) = 1u << 21\n            = 0x00200000        reset bit 21: PA5 low',
        note: 'Bit 21 is PA5\'s reset bit, so PA5 goes low. No read happens, and no other pin changes.' },
      { reg: 'BSRR', port: 'PB', v: 0x00FA0005,
        calc: 'leds           = 0000 0101   low half  0x0005: set PB0, PB2\n~leds (8 bits) = 1111 1010   high half 0x00FA: reset PB1, PB3..PB7\nGPIOB->BSRR    = (0xFA << 16) | 0x05 = 0x00FA0005   PB8..PB15 untouched',
        note: 'The LED bar with leds = 0b00000101. The low byte sets PB0 and PB2. The inverted byte, moved up 16 places, resets PB1 and PB3 to PB7. One store drives all eight LEDs, and PB8 to PB15 are untouched.' },
      { reg: 'BSRR', port: 'PA', v: 0x00200001,
        calc: '(1u << 0) | (1u << (5 + 16))\n= 0x00000001 | 0x00200000 = 0x00200001      PA0 high, PA5 low',
        note: 'Set and reset in the same write. Bit 0 sets PA0 and bit 21 resets PA5, in one store.' },
      { reg: 'BRR', port: 'PA', v: 0x00000020,
        calc: 'GPIOA->BRR = 1u << 5 = 0x00000020        BRR bit 5: PA5 low\nsame effect as GPIOA->BSRR = 1u << 21',
        note: 'BRR at offset 0x28 is the reset half of BSRR on its own, in bits 15:0. A 1 at bit n sets pin n low.' },
    ];
    steps(viz('bsrr-steps'), ['PA5 high', 'PA5 low', 'LED bar 0b00000101', 'PA0 high + PA5 low', 'BRR: PA5 low'], k => {
      g.textContent = '';
      const e = EX[k], v = e.v >>> 0, brr = e.reg === 'BRR';
      tx(g, 0, 53, e.reg, 't-fg t-bold');
      tx(g, 0, 80, 'hex', 't-fg t-bold');
      tx(g, 0, 118, 'pins', 't-fg t-bold');
      tx(g, bx(31) + 8 * C, 10, brr ? 'reserved' : 'BR15 … BR0: 1 = reset, pin low', brr ? 't-sm' : 't-sec t-sm', 'middle');
      tx(g, bx(15) + 8 * C, 10, brr ? 'BR15 … BR0: 1 = reset, pin low' : 'BS15 … BS0: 1 = set, pin high', (brr ? 't-sec' : 't-pri') + ' t-sm', 'middle');
      if (brr) {
        s('rect', { x: bx(31), y: 40, width: 16 * C, height: 26, class: 'f-none s-line dash' }, g);
      }
      for (let b = 31; b >= 0; b--) {
        if (brr && b > 15) continue;
        const one = (v >>> b) & 1, reset = brr || b > 15;
        tx(g, bx(b) + C / 2, 28, String(b % 16), 't-sm', 'middle');
        s('rect', { x: bx(b), y: 40, width: C, height: 26, class: (one ? (reset ? 'f-sec' : 'f-pri') : 'f-seg') + ' sep' }, g);
        tx(g, bx(b) + C / 2, 53, String(one), one ? 't-on t-bold' : 't-muted', 'middle');
      }
      for (let d = 7; d >= 0; d--) {
        if (brr && d > 3) continue;
        tx(g, bx(4 * d + 3) + 2 * C, 80, ((v >>> (4 * d)) & 15).toString(16).toUpperCase(), 't-fg t-bold', 'middle');
        if (d < 7) s('line', { x1: bx(4 * d + 3), x2: bx(4 * d + 3), y1: 72, y2: 88, class: 's-line' }, g);
      }
      for (let p = 15; p >= 0; p--) {
        const set = !brr && (v >>> p) & 1, rst = brr ? (v >>> p) & 1 : (v >>> (p + 16)) & 1;
        const x = X0 + (15 - p) * 2 * C;
        const [f, t, word] = set ? ['f-pri-soft', 't-pri', 'high'] : rst ? ['f-sec-soft', 't-sec', 'low'] : ['f-seg', 't-muted', '–'];
        s('rect', { x, y: 98, width: 2 * C, height: 40, class: f + ' sep' }, g);
        tx(g, x + C, 110, e.port + p, 't-sm ' + t, 'middle');
        tx(g, x + C, 126, word, t + ' t-bold', 'middle');
      }
      role('bsrr-calc').textContent = e.calc;
      role('bsrr-note').textContent = e.note;
    });
  });

  // Figure 5: the lost update inside ODR |=, and BSRR (slides 11, 13)
  fig('rmw', () => {
    const g0 = svg(viz('rmw'), 780, 236, { label: 'main and an interrupt handler both update ODR; with read-modify-write the handler update is lost, with BSRR both survive', minWidth: 560 });
    const g = s('g', {}, g0);
    const CX = c => 112 + c * 166, BW = 150, BH = 44, LANE = { main: 40, handler: 100 }, LED = 196;
    const RMW = [
      { lane: 'main', t: 'ldr r1, [ODR]\nr1 = 0x00', odr: 0x00 },
      { lane: 'handler', t: 'ldr, orrs, str\nODR |= 0x40', odr: 0x40 },
      { lane: 'main', t: 'orrs r3, r1\nr3 = 0x00 | 0x20', odr: 0x40 },
      { lane: 'main', t: 'str r3, [ODR]\nODR = 0x20', odr: 0x20, lost: true },
    ];
    const BS = [
      { lane: 'main', t: 'movs, lsls\nbuild 0x20, no read', odr: 0x00 },
      { lane: 'handler', t: 'str [BSRR]\nBSRR = 0x40', odr: 0x40 },
      { lane: 'main', t: 'str r2, [r3, #24]\nBSRR = 0x20', odr: 0x60 },
    ];
    const NOTES = [
      'The whole story. main() reads ODR (0x00), the interrupt lands, the handler sets PA6 (ODR = 0x40), and main() finishes with the copy it read before, 0x00 | 0x20 = 0x20. PA6 is off again. Pick a step.',
      'main() starts ODR |= 1 << 5 with a load. ldr r1, [r2, #20] puts the current ODR, 0x00, in r1. The interrupt arrives right after it, before the store.',
      'The handler runs its own ldr, orrs, str on ODR and sets PA6. ODR is now 0x40 and that LED is on. The handler returns into the middle of main()\'s sequence.',
      'main() continues with orrs r3, r1. r1 still holds 0x00, read before the handler ran, so r3 = 0x00 | 0x20 = 0x20. ODR itself is still 0x40.',
      'str r3, [r2, #20] writes 0x20. PA5 turns on and PA6 turns off again. The handler\'s update is lost with no warning: lesson 03\'s lost update.',
      'With BSRR each side writes once and reads nothing. The handler stores 0x40 (set PA6), main() stores 0x20 (set PA5), and the zeros leave every other pin alone. In either order ODR ends at 0x60 with both LEDs on.',
    ];
    steps(viz('rmw-steps'), ['All', '1 · main reads', '2 · handler', '3 · main modifies', '4 · main writes', 'With BSRR'], k => {
      g.textContent = '';
      const bsrr = k === 5, cols = bsrr ? BS : RMW;
      tx(g, 0, LANE.main + BH / 2, 'main()', 't-pri t-bold');
      tx(g, 0, LANE.handler + BH / 2, 'handler', 't-sec t-bold');
      tx(g, 0, LED - 14, 'ODR after', 't-fg t-bold');
      tx(g, 0, LED + 8, 'PA6  PA5', 't-sm');
      [LANE.main + BH + 8, LANE.handler + BH + 8].forEach(y => s('line', { x1: 0, x2: 780, y1: y, y2: y, class: 's-line' }, g));
      [[CX(1) - 8, 'interrupt'], [CX(2) - 8, 'return']].forEach(([x, t]) => {
        s('line', { x1: x, x2: x, y1: 30, y2: 156, class: 's-sec dash', style: 'stroke-width: 1.5' }, g);
        tx(g, x, 20, t, 't-sec t-sm', 'middle');
      });
      if (!bsrr) {
        const st = s('g', { class: 'fade' + (k === 0 || k >= 3 ? '' : ' dim') }, g);
        arrow(st, CX(0) + BW + 2, LANE.main + BH / 2, CX(2) - 2, LANE.main + BH / 2, { cls: 'a-sec', dash: true, label: 'stale r1 = 0x00', labelCls: 't-sec t-sm', dy: -8 });
      }
      cols.forEach((c, i) => {
        const cg = s('g', { class: 'fade' + (k >= 1 && k <= 4 && i !== k - 1 ? ' dim' : '') }, g);
        box(cg, CX(i), LANE[c.lane], BW, BH, c.t, { cls: c.lane === 'main' ? 'f-pri-soft' : 'f-sec-soft', textCls: 't-fg', lh: 15 });
        const cx = CX(i) + BW / 2;
        tx(cg, cx, LED - 14, 'ODR = ' + '0x' + c.odr.toString(16).toUpperCase().padStart(2, '0'), 't-fg t-bold', 'middle');
        [[6, -22], [5, 22]].forEach(([p, dx]) => {
          const on = (c.odr >> p) & 1;
          s('circle', { cx: cx + dx, cy: LED + 12, r: 9, class: on ? 'f-pri' : 'f-seg s-line' }, cg);
          if (c.lost && p === 6) s('circle', { cx: cx + dx, cy: LED + 12, r: 13, class: 's-bad' }, cg);
        });
        if (c.lost) tx(cg, cx - 44, LED + 12, 'lost', 't-bad t-bold', 'end');
      });
      if (bsrr) box(g, CX(3), LANE.main, BW, BH, 'both stores land\nboth LEDs on', { cls: 'f-ok-soft', textCls: 't-ok', lh: 15 });
      role('rmw-note').textContent = NOTES[k];
    });
  });

  // Figure 6: clear-then-set on MODER for pin 5, and the two shortcuts (slide 15)
  fig('cts', () => {
    const C = 17, GAP = 3, X0 = 176;
    const bx = b => X0 + (31 - b) * C + Math.floor((31 - b) / 2) * GAP;
    const g0 = svg(viz('cts'), 780, 236, { label: 'pin_mode for PA5 shown as 32-bit rows: read, mask, erased, new mode, written back', minWidth: 560 });
    const g = s('g', {}, g0);
    const MAIN = [['MODER (read)', 0xEBFFFFFF], ['~(3u << 10)', 0xFFFFF3FF], ['MODER & mask', 0xEBFFF3FF], ['1u << 10', 0x00000400], ['result', 0xEBFFF7FF]];
    const OR = [['MODER (read)', 0xEBFFFFFF], ['1u << 10', 0x00000400], ['MODER | 0x400', 0xEBFFFFFF]];
    const EQ = [['1u << 10', 0x00000400], ['MODER = 0x400', 0x00000400]];
    const NOTES = [
      'All five steps. Rows 1 to 3 erase pin 5\'s field with an AND whose mask is 0 only at bits 11:10. Rows 4 and 5 insert the new mode with an OR. Every bit outside the frame passes through unchanged.',
      'Read MODER. At reset it is 0xEBFFFFFF, and pin 5\'s field is 11, analog.',
      'Build the mask. 3u << 10 = 0x00000C00 covers bits 11:10, and ~ flips it to 0xFFFFF3FF, which is 1 everywhere except pin 5\'s field.',
      'AND keeps every bit where the mask is 1 and clears pin 5\'s field. MODER & mask = 0xEBFFF3FF, and the field is now 00.',
      'The new mode in place. MODE_OUTPUT = 1, shifted by pin × 2 = 10, gives 0x00000400, a single 1 at bit 10.',
      'OR puts it in. 0xEBFFF3FF | 0x400 = 0xEBFFF7FF. Pin 5 is 01, output, and the other 15 fields are exactly as they were.',
      'Bug, OR alone: MODER |= 1u << 10. OR can only turn bits on, so the field goes from 11 to 11. MODER does not change and PA5 stays analog.',
      'Bug, assignment alone: MODER = 1u << 10. Pin 5 becomes 01, but the other 15 fields become 00, input. That includes PA14 and PA13 (red frame), the SWD lines, so the debugger loses its pins.',
    ];
    steps(viz('cts-steps'), ['All', '1 · read', '2 · mask', '3 · erase', '4 · new mode', '5 · insert', 'Bug: |= only', 'Bug: = only'], k => {
      g.textContent = '';
      const rows = k === 6 ? OR : k === 7 ? EQ : MAIN;
      for (let p = 15; p >= 0; p--) tx(g, bx(2 * p + 1) + C, 14, String(p), 't-sm', 'middle');
      tx(g, 0, 14, 'pin', 't-sm');
      rows.forEach(([name, v], i) => {
        const y = 30 + i * 42, rg = s('g', { class: 'fade' + (k >= 1 && k <= 5 && i !== k - 1 ? ' dim' : '') }, g);
        tx(rg, 0, y + 5, name, 't-fg t-bold');
        tx(rg, 0, y + 19, hex(v), 't-pri');
        for (let b = 31; b >= 0; b--) bit(rg, bx(b), y, C, 24, (v >>> b) & 1);
      });
      const yEnd = 30 + (rows.length - 1) * 42 + 24;
      s('rect', { x: bx(11) - 2, y: 25, width: 2 * C + 4, height: yEnd - 21, class: 'f-none outline-sec' }, g);
      if (k === 7) s('rect', { x: bx(29) - 2, y: 25, width: 4 * C + GAP + 4, height: yEnd - 21, class: 'f-none s-bad' }, g);
      role('cts-note').textContent = NOTES[k];
    });
  });

  // Figure 7: one bouncing press against 1 kHz samples (slides 20, 22)
  fig('bounce', () => {
    const T = [2.00, 2.07, 2.16, 2.24, 2.39, 2.47, 2.62, 2.71, 2.86, 2.95, 3.08, 3.17, 3.30];
    const level = t => (T.filter(e => e <= t + 1e-9).length % 2 ? 0 : 1);
    const g0 = svg(viz('bounce'), 760, 236, { label: 'PA1 level during one bouncing press, with the sample points of a 1 kHz polling loop', minWidth: 560 });
    const ax = axes(g0, { x: 70, y: 30, w: 660, h: 110, xd: [0, 9], yd: [-0.3, 1.45], xt: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], yt: [0, 1], xl: 'time, ms', yl: 'PA1 level', grid: false });
    s('rect', { x: ax.x(2), y: 30, width: ax.x(3.3) - ax.x(2), height: 110, class: 'area-sec' }, g0);
    tx(g0, ax.x(2.65), 40, 'bounce', 't-sec t-sm', 'middle');
    const pts = [[ax.x(0), ax.y(1)]];
    T.forEach((t, i) => { const a = i % 2 ? 0 : 1; pts.push([ax.x(t), ax.y(a)], [ax.x(t), ax.y(1 - a)]); });
    pts.push([ax.x(9), ax.y(0)]);
    line(g0, pts, 's-sec');
    tx(g0, ax.x(0.1), ax.y(1) - 12, 'released: the pull-up holds 1', 't-sm');
    tx(g0, ax.x(4.1), ax.y(0) - 12, 'pressed: the switch holds 0', 't-sm');
    const dyn = s('g', {}, g0);
    tx(g0, 0, 207, 'poll reads', 't-fg t-bold');
    slider(viz('bounce-slider'), { label: 'sample phase, ms', min: 0, max: 0.95, step: 0.05, value: 0.5, fmt: v => v.toFixed(2) }, ph => {
      dyn.textContent = '';
      const ts = [], vals = [];
      for (let t = ph; t <= 9 + 1e-9; t += 1) { ts.push(t); vals.push(level(t)); }
      let changes = 0, inside = 0;
      vals.forEach((v, i) => {
        const x = ax.x(ts[i]), chg = i > 0 && v !== vals[i - 1], inb = ts[i] >= 2 && ts[i] < 3.3;
        if (chg) changes++;
        if (inb) inside++;
        s('line', { x1: x, x2: x, y1: ax.y(v), y2: 196, class: 's-pri dash', style: 'stroke-width: 1; opacity: 0.5' }, dyn);
        s('circle', { cx: x, cy: ax.y(v), r: 5, class: 'f-pri' }, dyn);
        bit(dyn, x - 11, 196, 22, 22, v);
        if (chg) s('rect', { x: x - 12.5, y: 194.5, width: 25, height: 25, class: 'f-none outline-sec' }, dyn);
      });
      role('bounce-poll').textContent = String(changes);
      role('bounce-edges').textContent = String(T.length);
      role('bounce-note').textContent = `Samples at ${ph.toFixed(2)}, ${(ph + 1).toFixed(2)}, ${(ph + 2).toFixed(2)} … ms read ${vals.join(' ')}. ${inside === 1 ? 'One sample lands inside the bounce' : 'Two samples land inside the bounce'}, and the poll sees ${changes === 1 ? 'one clean change from 1 to 0 (framed)' : changes + ' level changes for one press (framed)'}. The signal has ${T.length} edges, 7 falling and 6 rising, and EXTI with both edges enabled sees every one.`;
    });
  });

  // Figure 8: debounce_step traced with DEBOUNCE_MS = 3 (slide 21 continued)
  fig('deb', () => {
    const RAW = [0, 0, 1, 0, 1, 1, 1, 1, 1], DB = 3;
    const d = { stable: 0, raw: 0, held: 0, changes: 0 }, rows = [];
    RAW.forEach((raw, i) => {
      let kind = 'full';
      if (raw !== d.raw) { d.raw = raw; d.held = 0; d.changes++; kind = 'moved'; }
      else if (d.held < DB) {
        d.held++;
        kind = 'count';
        if (d.held === DB && raw !== d.stable) { d.stable = raw; kind = 'accept'; }
      }
      rows.push({ ms: i + 1, raw, held: d.held, stable: d.stable, changes: d.changes, kind });
    });
    const X0 = 96, P = 64, CW = 58;
    const cx = i => X0 + i * P;
    const g0 = svg(viz('deb'), 690, 198, { label: 'The debouncer struct after each of nine one-millisecond calls', minWidth: 560 });
    const g = s('g', {}, g0);
    const EVT = { 3: ['bounce', 'restart'], 4: ['bounce', 'restart'], 5: ['restart'], 8: ['PRESS', '+1'] };
    const note = r => {
      if (r.kind === 'moved') return `ms ${r.ms}: raw = ${r.raw} differs from the last sample, so the level moved. Remember it, held_ms = 0, changes = ${r.changes}, return 0.` + (r.ms < 5 ? ' This is bounce.' : ' The contact is back to pressed, and the count starts again.');
      if (r.kind === 'count') return `ms ${r.ms}: the same as the last sample, so count: held_ms = ${r.held}. Not yet DEBOUNCE_MS = 3.`;
      if (r.kind === 'accept') return `ms ${r.ms}: held_ms reaches DEBOUNCE_MS = 3, and raw = 1 differs from stable = 0. Accept it: stable = 1, return +1. PRESS, five milliseconds after the contact first touched.`;
      return `ms ${r.ms}: held_ms is already 3, so nothing happens. The press was reported once.`;
    };
    steps(viz('deb-steps'), ['All'].concat(rows.map(r => 'ms ' + r.ms)), k => {
      g.textContent = '';
      [['ms', 12], ['raw', 37], ['held_ms', 71], ['stable', 105], ['changes', 139], ['event', 172]].forEach(([t, y]) => tx(g, 0, y, t, 't-fg t-bold'));
      rows.forEach((r, i) => {
        const x = cx(i), cg = s('g', { class: 'fade' + (k > 0 && i >= k ? ' dim' : '') }, g);
        tx(cg, x + CW / 2, 12, String(r.ms), 't-fg t-bold', 'middle');
        bit(cg, x, 24, CW, 26, r.raw);
        s('rect', { x, y: 58, width: CW, height: 26, class: 'f-seg sep' }, cg);
        if (r.held) s('rect', { x, y: 79, width: CW * r.held / DB, height: 5, class: 'f-ter' }, cg);
        tx(cg, x + CW / 2, 70, String(r.held), 't-fg', 'middle');
        s('rect', { x, y: 92, width: CW, height: 26, class: (r.stable ? 'f-ok' : 'f-seg') + ' sep' }, cg);
        tx(cg, x + CW / 2, 105, String(r.stable), r.stable ? 't-on t-bold' : 't-muted', 'middle');
        s('rect', { x, y: 126, width: CW, height: 26, class: 'f-seg sep' }, cg);
        tx(cg, x + CW / 2, 139, String(r.changes), r.kind === 'moved' ? 't-sec t-bold' : 't-fg', 'middle');
        (EVT[r.ms] || []).forEach((t, j) => tx(cg, x + CW / 2, 166 + j * 14, t, (r.ms === 8 ? 't-ok' : 't-bad') + ' t-bold', 'middle'));
      });
      if (k > 0) s('rect', { x: cx(k - 1) - 3, y: 2, width: CW + 6, height: 190, rx: 4, class: 'f-none outline-pri' }, g);
      role('deb-note').textContent = k === 0
        ? 'All nine calls. The bounces at ms 3 and 4, and the return to pressed at ms 5, each restart the count. Only three quiet samples in a row, ms 6 to 8, finish it, so one press gives one event, at ms 8. changes ends at 3.'
        : note(rows[k - 1]);
    });
  });

  // Figure 9: the interrupt path, hop by hop (slides 23-28)
  fig('path', () => {
    const BW = 88, PITCH = 102, X0 = 6, BY = 44, BH = 56;
    const bxp = i => X0 + i * PITCH;
    const g0 = svg(viz('path'), 820, 184, { label: 'The path of an edge from PA1 through EXTICR, the EXTI edge, latch and mask, the NVIC and the vector table to the handler', minWidth: 560 });
    const g = s('g', {}, g0);
    const BOX = [
      { t: 'PA1\npin', v: 'input, pull-up', hop: 'GPIO' },
      { t: 'EXTICR[0]\nline 1 ← A', v: '0x00000000', hop: 'hop 1' },
      { t: 'RTSR1\nFTSR1\nedge', v: '0x00000002', hop: 'hop 2' },
      { t: 'RPR1\nFPR1\nlatch', v: 'bit 1 on edge', hop: 'hop 2' },
      { t: 'IMR1\nmask', v: '0x00000002', hop: 'hop 2' },
      { t: 'NVIC\nIRQ 5', v: 'IRQ 5 enabled', hop: 'hop 3' },
      { t: 'vector 21\n0x08000054', v: '0x0800023D', hop: 'last hop' },
      { t: 'EXTI0_1_\nIRQHandler', v: 'clear, count', hop: 'your code' },
    ];
    const GROUPS = [[1, 4, 'EXTI (ST), base 0x40021800'], [5, 5, 'NVIC (ARM)'], [6, 6, 'flash']];
    const NOTES = [
      'An edge on PA1 crosses all of these in order. Each switch is a bit, and all of them except PRIMASK are off at reset. Miss one and nothing happens, with no error, no fault and no warning.',
      'Hop 1, EXTICR. Line 1 is a multiplexer, and its byte in EXTICR[0] selects port A, code 0. That is also the reset value, so forgetting this write still works for a port-A button. A port-C button would go unheard (slide 33, row 4).',
      'Hop 2, the edge detectors. RTSR1 bit 1 fires on a rising edge (release) and FTSR1 bit 1 on a falling edge (press). With both bits 0, no edge is ever latched.',
      'The latch. On an edge, hardware sets bit 1 of RPR1 or FPR1, and it stays set until software writes a 1 to it. This is the pending bit the handler must clear (slide 29).',
      'The mask. IMR1 bit 1 passes line 1 on to the NVIC. With it 0, edges still latch in FPR1 and never reach the NVIC (slide 33, row 5). The code unmasks last.',
      'Hop 3, the NVIC. Lines 0 and 1 share IRQ 5. ISER bit 5 enables it and IPR[1] gives it priority 2. PRIMASK, a core register, must also be 0, and it is the one switch that starts on. Without NVIC_EnableIRQ the IRQ stays pending and the handler never runs (row 6).',
      'The last hop. The core reads vector 16 + 5 = 21 at 0x08000054 and jumps to the address stored there, 0x0800023D, the handler plus the Thumb bit. A misspelt handler name leaves Default_Handler in this slot (row 7).',
      'The handler checks RPR1 | FPR1 bit 1, clears both with =, counts one edge and returns with bx lr. If it does not clear the bit, it is entered again at once and main() never runs.',
    ];
    const CALC = [
      'EXTI->EXTICR[0]: line 1 byte = EXTI_PORT_A (0)     EXTICR[0] = 0x00000000\nEXTI->RTSR1 |= 1u << 1;  EXTI->FTSR1 |= 1u << 1;   both 0x00000002\nEXTI->RPR1 = 1u << 1;    EXTI->FPR1 = 1u << 1;     clear stale edges\nEXTI->IMR1 |= 1u << 1;                             unmask last\nNVIC_SetPriority(EXTI0_1_IRQn, 2);                 IPR[1] = 0x00008000\nNVIC_EnableIRQ(EXTI0_1_IRQn);                      ISER = 0x00000020',
      'line 1 → EXTICR[1 / 4] = EXTICR[0], bits 15:8\nEXTI_PORT_A = 0  →  EXTICR[0] = 0x00000000, the reset value',
      'EXTI->RTSR1 |= 1u << 1;    RTSR1 = 0x00000002    rising, release\nEXTI->FTSR1 |= 1u << 1;    FTSR1 = 0x00000002    falling, press',
      'press   → hardware sets FPR1 bit 1\nrelease → hardware sets RPR1 bit 1\nclear:    EXTI->FPR1 = 1u << 1;    write 1 to clear, assign with =',
      'EXTI->IMR1 |= 1u << 1;     IMR1 bit 1 = 1, line 1 on to the NVIC',
      'NVIC_EnableIRQ(EXTI0_1_IRQn);        ISER = 1 << 5 = 0x00000020\nNVIC_SetPriority(EXTI0_1_IRQn, 2);   IPR[1] byte 1 = 2 << 6 = 0x80  →  0x00008000\nPRIMASK = 0                          interrupts on',
      'vector  = 16 + 5 = 21\naddress = 0x08000000 + 21 × 4 = 0x08000054\nword    = 0x0800023D = EXTI0_1_IRQHandler (0x0800023C) + 1, the Thumb bit',
      'if ((EXTI->RPR1 | EXTI->FPR1) & mask) {\n    EXTI->RPR1 = mask;  EXTI->FPR1 = mask;  b_edges++;\n}\nbx lr        lr holds EXC_RETURN, so the core restores main()',
    ];
    steps(viz('path-steps'), ['All', '1 · EXTICR', '2 · edge', '3 · latch', '4 · mask', '5 · NVIC', '6 · vector', '7 · handler'], k => {
      g.textContent = '';
      GROUPS.forEach(([a, b, t]) => {
        const x1 = bxp(a), x2 = bxp(b) + BW;
        s('path', { d: `M${x1} 34 V28 H${x2} V34`, class: 's-muted', style: 'stroke-width: 1' }, g);
        tx(g, (x1 + x2) / 2, 16, t, 't-fg t-bold t-sm', 'middle');
      });
      BOX.forEach((b, i) => {
        const cur = k > 0 && i === k, reached = k === 0 || i < k;
        box(g, bxp(i), BY, BW, BH, b.t, { cls: cur ? 'f-pri' : reached ? 'f-pri-soft' : 'f-seg', textCls: cur ? 't-on t-bold' : reached ? 't-fg' : 't-muted', lh: 14 });
        if (i < BOX.length - 1) arrow(g, bxp(i) + BW + 1, BY + BH / 2, bxp(i + 1) - 1, BY + BH / 2, { cls: k === 0 || i < k ? 'a-pri' : 'a-muted', head: 6 });
        tx(g, bxp(i) + BW / 2, BY + BH + 16, b.v, (reached || cur ? 't-pri' : 't-muted') + ' t-sm', 'middle');
        tx(g, bxp(i) + BW / 2, BY + BH + 30, b.hop, 't-sm', 'middle');
      });
      const on5 = k === 0 || k >= 5;
      box(g, bxp(5) - 10, 150, 120, 26, 'PRIMASK = 0 (on)', { cls: on5 ? 'f-ok-soft' : 'f-seg', textCls: on5 ? 't-ok t-sm' : 't-muted t-sm' });
      arrow(g, bxp(5) + 4, 150, bxp(5) + 4, BY + BH + 1, { cls: on5 ? 'a-ok' : 'a-muted', head: 6 });
      role('path-note').textContent = NOTES[k];
      role('path-calc').textContent = CALC[k];
    });
  });

  // Figure 10: EXTI line n as a multiplexer and its EXTICR byte (slide 24)
  fig('exti', () => {
    const PORTS = [['A', 0], ['B', 1], ['C', 2], ['D', 3], ['F', 5]];
    const IRQN = { 5: 'EXTI0_1', 6: 'EXTI2_3', 7: 'EXTI4_15' };
    const C = 19, X0 = 150;
    const bx = b => X0 + (31 - b) * C;
    const g0 = svg(viz('exti'), 780, 262, { label: 'EXTI line n as a multiplexer of pin n from each port, selected by a byte of EXTICR', minWidth: 560 });
    const g = s('g', {}, g0);
    let port = 0, n = 1;
    function draw() {
      g.textContent = '';
      const [pl, code] = PORTS[port], k = n >> 2, j = n % 4, lo = 8 * j, irq = n < 2 ? 5 : n < 4 ? 6 : 7;
      const MX0 = 120, MX1 = 190, MID = 98;
      PORTS.forEach(([p, c], i) => {
        const y = 38 + i * 30, on = i === port;
        tx(g, 6, y, `code ${c} · P${p}${n}`, on ? 't-pri t-bold' : 't-muted');
        line(g, [[100, y], [MX0, y]], on ? 's-pri' : 's-line');
      });
      s('polygon', { points: `${MX0},22 ${MX1},62 ${MX1},134 ${MX0},174`, class: 'f-surface box' }, g);
      PORTS.forEach((_, i) => { if (i === port) line(g, [[MX0, 38 + i * 30], [MX1, MID]], 's-pri'); });
      tx(g, (MX0 + MX1) / 2, MID, 'line ' + n, 't-fg t-bold halo', 'middle');
      arrow(g, MX1, MID, 290, MID, { cls: 'a-pri', width: 2.5 });
      tx(g, 298, MID, `EXTI line ${n} ← P${pl}${n}`, 't-pri t-bold');
      tx(g, 298, MID + 20, `edge, pending, mask: bit ${n} = ${hex(2 ** n)}`, 't-fg');
      tx(g, 298, MID + 40, `→ IRQ ${irq} (${IRQN[irq]}_IRQn), vector ${16 + irq}`, 't-fg');
      tx(g, 0, 210, `EXTICR[${k}]`, 't-fg t-bold');
      tx(g, 0, 225, hex(code * 2 ** lo), 't-pri t-bold');
      for (let b = 31; b >= 0; b--) {
        const inByte = b >= lo && b < lo + 8;
        bit(g, bx(b), 204, C, 24, inByte ? (code >> (b - lo)) & 1 : 0);
      }
      for (let jj = 0; jj < 4; jj++) {
        const on = jj === j;
        tx(g, bx(8 * jj + 7) + 4 * C, 242, `line ${4 * k + jj} · ${8 * jj + 7}:${8 * jj}`, on ? 't-pri t-bold t-sm' : 't-sm', 'middle');
        if (jj) s('line', { x1: bx(8 * jj - 1), x2: bx(8 * jj - 1), y1: 200, y2: 232, class: 's-muted', style: 'stroke-width: 1' }, g);
      }
      s('rect', { x: bx(lo + 7) - 1.5, y: 202.5, width: 8 * C + 3, height: 27, class: 'f-none outline-sec' }, g);
      arrow(g, bx(lo + 7) + 4 * C, 198, (MX0 + MX1) / 2, 156, { cls: 'a-sec', dash: true, label: 'select = ' + code, labelCls: 't-sec t-sm', dx: 0, dy: -6 });
      role('exti-calc').textContent = [
        `P${pl}${n} → EXTI line ${n}`,
        `EXTICR[${n} / 4] = EXTICR[${k}], bits 8 × (${n} mod 4) + 7 : 8 × (${n} mod 4) = ${lo + 7}:${lo}`,
        `port ${pl} code ${code} << ${lo} = ${hex(code * 2 ** lo)}        other lines left at reset`,
        `RTSR1, FTSR1, RPR1, FPR1, IMR1: bit ${n} = 1u << ${n} = ${hex(2 ** n)}`,
        `IRQ ${irq} (${IRQN[irq]}_IRQn), vector 16 + ${irq} = ${16 + irq}, at 0x08000000 + ${16 + irq} × 4 = ${hex(0x08000000 + 4 * (16 + irq))}`,
      ].join('\n');
    }
    steps(viz('exti-port'), PORTS.map(p => 'Port ' + p[0]), k => { port = k; draw(); });
    slider(viz('exti-slider'), { label: 'line n = pin n', min: 0, max: 15, step: 1, value: 1 }, v => { n = v; draw(); });
  });

  // Figure 11: ISER, IPR[1] and the vector table for IRQs 5, 6, 7 (slides 26-27)
  fig('vec', () => {
    const C = 12, X0 = 70;
    const bx = b => X0 + (31 - b) * C;
    const g0 = svg(viz('vec'), 800, 290, { label: 'Enable bit in ISER, priority byte in IPR[1] and vector table slot for the three EXTI IRQs', minWidth: 560 });
    const g = s('g', {}, g0);
    const IRQ = [
      { n: 5, name: 'EXTI0_1', lines: 'lines 0 and 1',
        note: 'IRQ 5 carries EXTI lines 0 and 1, so one handler serves both and must read the pending bits to see which fired. Button B uses line 1. Its slot, vector 21, holds 0x0800023D.' },
      { n: 6, name: 'EXTI2_3', lines: 'lines 2 and 3',
        note: 'IRQ 6 carries lines 2 and 3. This lesson defines no EXTI2_3_IRQHandler, so the weak placeholder keeps Default_Handler in vector 22.' },
      { n: 7, name: 'EXTI4_15', lines: 'lines 4 to 15',
        note: 'IRQ 7 carries lines 4 to 15, twelve lines on one vector. A PC13 button (Lab Part 7) needs EXTI4_15_IRQHandler, and it must check bit 13 of the pending registers.' },
    ];
    const VT = [['0', '0x08000000', 'initial SP'], ['1', '0x08000004', 'Reset_Handler'], ['2–15', '…', 'core exceptions']]
      .concat([0, 1, 2, 3, 4, 5, 6, 7].map(i => [String(16 + i), hex(0x08000040 + 4 * i), 'IRQ ' + i + (i >= 5 ? ' ' + IRQ[i - 5].name : '')]));
    steps(viz('vec-steps'), ['IRQ 5 · lines 0–1', 'IRQ 6 · lines 2–3', 'IRQ 7 · lines 4–15'], k => {
      g.textContent = '';
      const r = IRQ[k], n = r.n, byte = n % 4, vec = 16 + n;
      tx(g, 0, 40, 'ISER', 't-fg t-bold');
      tx(g, 0, 54, hex(2 ** n), 't-pri t-sm');
      tx(g, bx(31) + C / 2, 22, '31', 't-sm', 'middle');
      tx(g, bx(0) + C / 2, 22, '0', 't-sm', 'middle');
      tx(g, bx(n) + C / 2, 22, 'IRQ ' + n, 't-pri t-bold t-sm', 'middle');
      for (let b = 31; b >= 0; b--) bit(g, bx(b), 34, C, 22, b === n ? 1 : 0, '');
      tx(g, 0, 110, 'IPR[1]', 't-fg t-bold');
      tx(g, 0, 124, hex(0x80 * 2 ** (8 * byte)), 't-pri t-sm');
      for (let b = 31; b >= 0; b--) {
        const by = b >> 3, top = b % 8 >= 6, one = by === byte && b % 8 === 7;
        const cg = s('g', { style: top ? null : 'opacity: 0.35' }, g);
        bit(cg, bx(b), 104, C, 22, one ? 1 : 0, '');
      }
      for (let by = 0; by < 4; by++) {
        const on = by === byte;
        tx(g, bx(8 * by + 7) + 4 * C, 140, 'IRQ ' + (4 + by), on ? 't-pri t-bold t-sm' : 't-sm', 'middle');
        if (on) tx(g, bx(8 * by + 7) + C, 92, 'prio 2 = 10', 't-pri t-sm', 'middle');
      }
      s('rect', { x: bx(8 * byte + 7) - 1.5, y: 102.5, width: 8 * C + 3, height: 25, class: 'f-none outline-sec' }, g);
      tx(g, 0, 172, `vector ${vec} at ${hex(0x08000000 + 4 * vec)}`, 't-fg t-bold');
      if (n === 5) {
        ['3d', '02', '00', '08'].forEach((b, i) => {
          box(g, 70 + i * 54, 188, 50, 26, b, { cls: 'f-pri-soft', textCls: 't-fg t-bold' });
          tx(g, 95 + i * 54, 226, '…' + (0x54 + i).toString(16).toUpperCase(), 't-sm', 'middle');
        });
        arrow(g, 290, 201, 322, 201, { cls: 'a-pri' });
        tx(g, 330, 195, '0x0800023D', 't-pri t-bold');
        tx(g, 330, 211, '= 0x0800023C + 1', 't-sm');
        tx(g, 0, 248, 'little-endian: the lowest address holds the lowest byte', 't-sm');
      } else {
        tx(g, 0, 194, `no ${r.name}_IRQHandler in this lesson:`, 't-sm');
        tx(g, 0, 210, 'the weak placeholder points this slot at Default_Handler', 't-sm');
      }
      const VX = 530, VW = 260, RH = 22;
      tx(g, VX + 6, 12, 'vec', 't-sm');
      tx(g, VX + 46, 12, 'address', 't-sm');
      tx(g, VX + 132, 12, 'entry', 't-sm');
      VT.forEach(([v, a, e], i) => {
        const on = v === String(vec), y = 24 + i * RH;
        s('rect', { x: VX, y, width: VW, height: RH, class: (on ? 'f-pri' : i < 3 ? 'f-surface' : 'f-seg') + ' sep' }, g);
        const c = on ? 't-on t-bold' : 't-fg';
        tx(g, VX + 6, y + RH / 2, v, c);
        tx(g, VX + 46, y + RH / 2, a, c);
        tx(g, VX + 132, y + RH / 2, e, c);
      });
      s('rect', { x: VX, y: 24, width: VW, height: 3 * RH, class: 'f-none box' }, g);
      role('vec-calc').textContent = [
        `IRQ ${n} (${r.name}_IRQn): EXTI ${r.lines}`,
        `ISER = 1u << ${n} = ${hex(2 ** n)}`,
        `IPR[${n} / 4] = IPR[1], byte ${n} mod 4 = ${byte}, bits ${8 * byte + 7}:${8 * byte}`,
        `priority 2 → 2 << 6 = 0x80 in that byte → IPR[1] = ${hex(0x80 * 2 ** (8 * byte))}`,
        `vector 16 + ${n} = ${vec} → 0x08000000 + ${vec} × 4 = ${hex(0x08000000 + 4 * vec)}`,
      ].join('\n');
      role('vec-note').textContent = r.note;
    });
  });

  // Figure 12: pending bit cleared or not (slide 29)
  fig('pend', () => {
    const g0 = svg(viz('pend'), 760, 196, { label: 'Timeline of main, the handler and FPR1 bit 1, with the pending bit cleared and not cleared', minWidth: 560 });
    const g = s('g', {}, g0);
    const X0 = 110, X1 = 740, EDGE = 250, LH = 26, YM = 34, YH = 80, Y1 = 134, Y0 = 164;
    const bar = (x1, x2, y, cls, t) => {
      s('rect', { x: x1, y, width: x2 - x1, height: LH, rx: 3, class: cls }, g);
      if (t) tx(g, (x1 + x2) / 2, y + LH / 2, t, 't-on t-sm', 'middle');
    };
    const NOTES = [
      'The handler writes 1 to FPR1 bit 1. The bit drops to 0, the NVIC stops seeing the line, and when the handler returns with bx lr, main() continues where it was interrupted.',
      'The handler returns with the bit still 1. The NVIC still sees the line pending, so the core enters the handler again at once (tail-chaining), again and again. main() never gets the CPU back: the heartbeat stops and the serial port goes quiet. Nothing has crashed.',
    ];
    steps(viz('pend-steps'), ['Bit cleared', 'Bit not cleared'], k => {
      g.textContent = '';
      tx(g, 0, YM + LH / 2, 'main()', 't-pri t-bold');
      tx(g, 0, YH + LH / 2, 'handler', 't-sec t-bold');
      tx(g, 0, (Y1 + Y0) / 2, 'FPR1 bit 1', 't-fg t-bold');
      tx(g, X0 - 8, Y1, '1', 't-sm', 'end');
      tx(g, X0 - 8, Y0, '0', 't-sm', 'end');
      s('line', { x1: EDGE, x2: EDGE, y1: 24, y2: 178, class: 's-muted dash', style: 'stroke-width: 1' }, g);
      tx(g, EDGE, 12, 'press: falling edge on PA1', 't-sm', 'middle');
      bar(X0, EDGE, YM, 'f-pri', 'main() running');
      if (k === 0) {
        bar(EDGE + 4, EDGE + 70, YH, 'f-sec', 'handler');
        bar(EDGE + 76, X1, YM, 'f-pri', 'main() continues');
        line(g, [[X0, Y0], [EDGE, Y0], [EDGE, Y1], [EDGE + 50, Y1], [EDGE + 50, Y0], [X1, Y0]], 's-ok');
        tx(g, EDGE + 58, Y1 + 2, 'FPR1 = mask clears it', 't-ok t-sm');
      } else {
        for (let x = EDGE + 4, i = 0; x + 62 <= X1; x += 68, i++) bar(x, x + 62, YH, 'f-sec', i ? 'again' : 'handler');
        tx(g, EDGE + 20, YM + LH / 2, 'main() never runs again: heartbeat stops, serial quiet', 't-bad t-bold');
        tx(g, EDGE + 70, YH + LH + 12, 'return: still pending → straight back in', 't-sec t-sm');
        line(g, [[X0, Y0], [EDGE, Y0], [EDGE, Y1], [X1, Y1]], 's-bad');
        tx(g, X1, Y1 + 16, 'never cleared', 't-bad t-sm', 'end');
      }
      role('pend-note').textContent = NOTES[k];
    });
  });

  // General idea vs this chip (guide §2 contrasts and the deck's own)
  fig('contrast', () => {
    const rows = [
      ['Reaching a device (I/O model)', 'memory-mapped vs port-mapped (isolated) I/O', 'memory-mapped: GPIOA at 0x50000000, each register a struct member at base + offset', 'GPIOA->ODR is an ordinary ldr / str; with no MMU a stray pointer can write a peripheral'],
      ['Changing one output bit', 'read-modify-write on ODR vs a set/reset register', 'both exist; this lesson drives pins through BSRR', 'on a load–store core ODR |= is ldr, orrs, str, and an interrupt in the gap loses an update; BSRR is one str, atomic'],
      ['Noticing an input change', 'polling vs interrupt (vs DMA)', 'both here: button A polled at 1 kHz, button B on EXTI', 'polling depends on the loop coming back and filters fast events (1–3 changes per press); an interrupt sees every edge, wanted or not (tens per press)'],
      ['Finding the handler (dispatch)', 'vectored (a table of addresses) vs non-vectored (one entry, software asks who)', 'vectored: vector 16 + IRQ at 0x08000000 + 4 × vector', 'the handler\'s exact name puts its address in the slot; EXTI lines share IRQs 5, 6 and 7, so the handler still reads the pending bits'],
      ['Output driver', 'push-pull vs open-drain', 'both, per pin, by OTYPER; reset is push-pull', 'push-pull drives both levels; open-drain lets chips share a wire (wired-AND, I²C); two push-pull outputs fighting make a short'],
      ['Clearing an event flag', 'write 1 to clear vs write 0 to clear (TIM UIF) vs clear by reading or writing data (USART RXNE, TXE)', 'EXTI RPR1 / FPR1: write 1 to clear', 'assign with =, never |=, or other lines\' pending edges are cleared too; forget it and the handler runs forever'],
      ['Latching edges', 'one pending register PR (older STM32) vs separate rising and falling registers', 'separate RPR1 and FPR1 on the C0', 'the handler checks and clears both'],
      ['Choosing the port for a line', 'SYSCFG->EXTICR (STM32F4) vs EXTI->EXTICR', 'in EXTI on the STM32C0', 'F4 tutorial code does not compile here; port A (code 0) is the reset value, so a missing write hides on port A'],
      ['Priority numbering', 'smaller = more urgent vs bigger = more urgent', 'NVIC: 4 levels, 0 most urgent, top 2 bits of each byte', 'priority 2 is 0x80 in its byte; the kernel of lesson 07 counts the other way'],
      ['Where to debounce', 'wait in the handler vs record in the handler and decide in main()', 'the handler counts edges, main() runs a 20 ms quiet stopwatch', 'a 20 ms wait in a handler would block every interrupt of equal or lower priority'],
    ];
    table(viz('contrast'), ['Idea', 'Alternatives', 'This chip', 'What follows'].map(t => ({ text: t, cls: 'l' })), rows.map(r => r.map(c => ({ text: c, cls: 'l' }))));
  });
});
