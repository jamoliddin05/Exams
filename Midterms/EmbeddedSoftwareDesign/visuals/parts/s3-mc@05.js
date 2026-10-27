const L5 = (() => {
  const { s } = QV;
  const hex8 = v => '0x' + (v >>> 0).toString(16).toUpperCase().padStart(8, '0');
  const hex2 = v => '0x' + v.toString(16).toUpperCase().padStart(2, '0');
  const bitOf = (v, b) => (v >>> b) & 1;
  const txt = (g, x, y, t, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls || null }, g, t);
  const cellCls = k => {
    if (!k) return ['f-seg', null];
    return k.endsWith('-soft') ? ['f-' + k, 't-' + k.slice(0, -5) + ' t-bold'] : ['f-' + k, 't-on t-bold'];
  };
  // A register bit by bit, bit n-1 on the left; hl(b, v) names a fill such as 'pri' or 'ok-soft'
  const reg = (g, o) => {
    const n = o.bits || 32, cw = o.cw || 16, ch = o.ch || 22, grp = o.group || 4, gap = o.gap == null ? 3 : o.gap;
    const bx = b => { const i = n - 1 - b; return o.x + i * cw + Math.floor(i / grp) * gap; };
    for (let b = n - 1; b >= 0; b--) {
      const v = o.value == null ? null : bitOf(o.value, b);
      const [f, t] = cellCls(o.hl ? o.hl(b, v) : null);
      s('rect', { x: bx(b), y: o.y, width: cw, height: ch, rx: 2, class: f + ' sep' }, g);
      if (v != null) txt(g, bx(b) + cw / 2, o.y + ch / 2, String(v), t || (v ? 't-fg t-bold' : 't-muted'), 'middle');
    }
    if (o.hex && o.value != null) {
      for (let d = 0; d < n / 4; d++) txt(g, (bx(4 * d + 3) + bx(4 * d) + cw) / 2, o.y - 7, ((o.value >>> (4 * d)) & 15).toString(16).toUpperCase(), 't-sm', 'middle');
    }
    return { bx, cx: b => bx(b) + cw / 2, mid: (hi, lo) => (bx(hi) + bx(lo) + cw) / 2, y: o.y, ch, cw };
  };
  return { hex8, hex2, txt, reg };
})();

QV.register('s3-mc18', function (q) {
  const { s, svg, steps, arrow } = QV;
  const { txt, reg } = L5;
  const viz = n => q.querySelector(`[data-viz="${n}"]`);
  const role = n => q.querySelector(`[data-role="${n}"]`);
  const ROWS = [
    { name: 'GPIOA->IDR', sub: '0x0000A5F3', v: 0xA5F3, hex: true, hl: b => (b === 9 ? 'pri' : null) },
    { name: 'IDR >> 9', sub: '0x00000052', v: 0x52, hl: (b, v) => (b === 0 ? 'pri' : b <= 6 && v ? 'pri-soft' : null) },
    { name: '1u', sub: '0x00000001', v: 1, hl: b => (b === 0 ? 'sec-soft' : null) },
    { name: '(IDR >> 9) & 1u', sub: '= 0, PA9 low, pressed', v: 0, hl: b => (b === 0 ? 'ok' : null) },
  ];
  const W = svg(viz('shift'), 780, 248, { label: 'IDR 0xA5F3 bit by bit; bit 9 is 0; shifted right by 9 it lands on bit 0; AND 1 gives 0', minWidth: 600 });
  const X0 = 200, Y0 = 56, P = 52;
  const rows = ROWS.map((r, i) => {
    const g = s('g', { class: 'fade' }, W);
    const y = Y0 + i * P;
    const R = reg(g, { x: X0, y, bits: 16, cw: 30, ch: 24, gap: 6, value: r.v, hex: r.hex, hl: r.hl });
    txt(g, 0, y + 5, r.name, i === 3 ? 't-ok t-bold' : 't-fg t-bold');
    txt(g, 0, y + 19, r.sub, i === 3 ? 't-ok' : 't-muted');
    return { g, R };
  });
  const R = rows[0].R;
  txt(W, 0, 24, 'pin', 't-sm');
  for (let b = 15; b >= 0; b--) txt(W, R.cx(b), 24, String(b), b === 9 ? 't-pri t-bold' : 't-sm', 'middle');
  arrow(rows[1].g, R.cx(9), Y0 + 26, R.cx(0), Y0 + P - 2, { cls: 'a-pri', label: '>> 9', labelCls: 't-pri t-bold halo' });
  const NOTES = [
    'Bit 9 of IDR moves down to bit 0, and the mask keeps only it. The result is 0, the level of PA9.',
    'IDR reads 0x0000A5F3. One hex digit is four bits, so A 5 F 3 is 1010 0101 1111 0011. Bit 9 sits in the digit 5 = 0101 and is 0. Bits 10 and 8 next to it are 1.',
    'Shifting right by 9 moves every bit down 9 places. Bit 9 lands on bit 0, and bits 15:10 land on bits 6:1, so IDR >> 9 is 0x52. Option C stops here.',
    '1u has only bit 0 set, so AND with it clears every bit except bit 0.',
    'The result is 0. PA9 is low, and with a pull-up and a switch to GND, low means pressed.',
  ];
  steps(viz('shift-steps'), ['All', '1 · IDR', '2 · >> 9', '3 · 1u', '4 · AND'], k => {
    rows.forEach(({ g }, i) => g.classList.toggle('dim', k > 0 && i >= k));
    role('shift-note').textContent = NOTES[k];
  });
});

QV.register('s3-mc19', function (q) {
  const { s, svg, box, arrow, steps } = QV;
  const { hex2, txt } = L5;
  const viz = n => q.querySelector(`[data-viz="${n}"]`);
  const role = n => q.querySelector(`[data-role="${n}"]`);
  const OPS = ['ldr', 'orr', 'str', 'ldr', 'bic', 'str'];
  const LBL = ['ldr\nread ODR', 'orrs\nset bit 5', 'str\nwrite ODR', 'ldr\nread ODR', 'bics\nclear bit 4', 'str\nwrite ODR'];
  const run = k => {
    let odr = 0x10, r1 = 0;
    const out = [];
    for (let i = 0; i <= 6; i++) {
      if (i === k) odr |= 0x40;
      if (i === 6) break;
      const op = OPS[i];
      if (op === 'ldr') r1 = odr; else if (op === 'orr') r1 |= 0x20; else if (op === 'bic') r1 &= ~0x10; else odr = r1;
      out.push([r1, odr]);
    }
    return { out, odr };
  };
  const W = svg(viz('race'), 780, 268, { label: 'Six instructions of the two ODR lines with the interrupt at a chosen gap, r1 and ODR after each; below, the BSRR line is one store', minWidth: 600 });
  const IX = 44, IW = 92, IS = 112;
  const gx = k => IX + k * IS - 10;
  LBL.forEach((l, i) => box(W, IX + i * IS, 46, IW, 40, l, { cls: OPS[i] === 'ldr' || OPS[i] === 'str' ? 'f-pri-soft' : 'f-surface', textCls: 't-fg', lh: 15 }));
  txt(W, 0, 104, 'r1', 't-fg t-bold');
  txt(W, 0, 124, 'ODR', 't-fg t-bold');
  txt(W, IX + IS + IW / 2, 144, 'GPIOA->ODR |= 1u << 5;', 't-sm', 'middle');
  txt(W, IX + 4 * IS + IW / 2, 144, 'GPIOA->ODR &= ~(1u << 4);', 't-sm', 'middle');
  const dyn = s('g', {}, W);
  s('line', { x1: 0, x2: 780, y1: 184, y2: 184, class: 's-line' }, W);
  txt(W, 0, 198, 'BSRR version', 't-fg t-bold');
  box(W, 44, 212, 204, 40, 'movs, lsls\nno port access', { cls: 'f-surface', textCls: 't-fg', lh: 15 });
  box(W, 268, 212, 92, 40, 'str\nwrite BSRR', { cls: 'f-pri-soft', textCls: 't-fg', lh: 15 });
  [258, 370].forEach(x => arrow(W, x, 200, x, 250, { cls: 'a-sec', dash: true, head: 6 }));
  txt(W, 400, 214, 'interrupt before the store: 0x10 → 0x50 → 0x60', 't-sm');
  txt(W, 400, 230, 'interrupt after the store: 0x10 → 0x20 → 0x60', 't-sm');
  txt(W, 400, 248, 'PA6 stays on either way', 't-ok t-bold');
  const NOTES = [
    'The handler runs before main() starts. ODR is 0x50 when main() reads it, so both lines keep PA6.',
    'main() has read ODR = 0x10 into r1. The handler makes ODR 0x50, then main() ORs bit 5 into its stale copy and stores 0x30. PA6 is off again.',
    'r1 already holds 0x30. The handler\'s 0x50 is overwritten by the store of 0x30, and PA6 is lost.',
    'Between the lines no copy is held in a register. The handler makes ODR 0x70, the second line reads that, and PA6 survives.',
    'The second line has read 0x30. The handler makes ODR 0x70, and main() stores 0x30 & ~0x10 = 0x20. PA6 is lost.',
    'r1 holds 0x20, ready to store. The handler\'s PA6 is overwritten.',
    'The handler runs after both stores, and ODR goes from 0x20 to 0x60. PA6 survives.',
  ];
  steps(viz('race-steps'), ['before both', 'after 1st ldr', 'after orrs', 'between lines', 'after 2nd ldr', 'after bics', 'after both'], k => {
    dyn.textContent = '';
    const { out, odr } = run(k), x = gx(k);
    arrow(dyn, x, 30, x, 92, { cls: 'a-sec', width: 2 });
    txt(dyn, x, 20, 'handler: ODR |= 1u << 6', 't-sec t-bold', k === 0 ? 'start' : k === 6 ? 'end' : 'middle');
    out.forEach(([r1, o], i) => {
      txt(dyn, IX + i * IS + IW / 2, 104, hex2(r1), 't-fg', 'middle');
      txt(dyn, IX + i * IS + IW / 2, 124, hex2(o), o & 0x40 ? 't-fg t-bold' : 't-muted', 'middle');
    });
    const kept = (odr & 0x40) !== 0;
    txt(dyn, 0, 166, `ODR ends ${hex2(odr)}. PA5 on, PA4 off, PA6 ${kept ? 'kept' : 'off again, so the handler\'s change is lost'}.`, kept ? 't-ok t-bold' : 't-bad t-bold');
    role('race-note').textContent = NOTES[k];
  }, 1);
});

QV.register('s3-mc20', function (q) {
  const { s, svg, box, arrow, steps } = QV;
  const { txt } = L5;
  const viz = n => q.querySelector(`[data-viz="${n}"]`);
  const role = n => q.querySelector(`[data-role="${n}"]`);
  const W = svg(viz('calc'), 780, 260, { label: '0x08000070 minus the base is 112 bytes, divided by 4 is vector 28, minus 16 is IRQ 12; the word 0x08000A1D with bit 0 cleared is 0x08000A1C', minWidth: 600 });
  const BW = 136, BS = 194, BX = 30;
  const CH = [['0x08000070', 'the vector\'s address'], ['0x70 = 112 bytes', '7 × 16 = 112'], ['vector 28', '4 bytes per vector'], ['IRQ 12', '16 core vectors first']];
  const ARR = ['− base', '÷ 4', '− 16'];
  const chain = CH.map(([l, cap], i) => {
    const g = s('g', { class: 'fade' }, W);
    const x = BX + i * BS;
    if (i > 0) arrow(g, x - BS + BW + 2, 42, x - 2, 42, { cls: 'a-pri', label: ARR[i - 1], labelCls: 't-pri t-bold' });
    box(g, x, 22, BW, 40, l, { cls: i === 3 ? 'f-ok' : 'f-pri-soft', textCls: i === 3 ? 't-on t-bold' : 't-pri t-bold' });
    txt(g, x + BW / 2, 76, cap, 't-sm', 'middle');
    return g;
  });
  const th = s('g', { class: 'fade' }, W);
  box(th, 30, 106, 220, 40, 'word read: 0x08000A1D', { cls: 'f-pri-soft', textCls: 't-pri t-bold' });
  arrow(th, 252, 126, 348, 126, { cls: 'a-pri', label: 'clear bit 0', labelCls: 't-pri t-bold' });
  box(th, 350, 106, 220, 40, 'handler at 0x08000A1C', { cls: 'f-ok', textCls: 't-on t-bold' });
  txt(th, 140, 160, 'the handler\'s address + 1', 't-sm', 'middle');
  txt(th, 460, 160, 'last digit D = 1101 → C = 1100', 't-sm', 'middle');
  const WR = [['B', 'stops at vector 28 and calls it IRQ 28'], ['C', 'keeps bit 0, 0x08000A1D, an odd address'], ['D', 'takes the vector\'s own address, 0x08000070']];
  const wrong = WR.map(([k, t], i) => {
    const g = s('g', { class: 'fade' }, W);
    const y = 192 + i * 26;
    s('circle', { cx: 40, cy: y, r: 10, class: 'f-bad' }, g);
    txt(g, 40, y, k, 't-on t-bold', 'middle');
    txt(g, 60, y, t, 't-bad');
    return g;
  });
  const LIT = [null, [1, false, []], [2, false, []], [3, false, [0]], [3, true, [1, 2]]];
  const NOTES = [
    '0x08000070 is vector 28, which is IRQ 12, and the word stored there, 0x08000A1D, points at a handler starting at 0x08000A1C.',
    'Subtract the table start. 0x08000070 − 0x08000000 = 0x70, and 0x70 = 7 × 16 = 112 bytes into the table.',
    'Each vector is 4 bytes, so this is vector 112 / 4 = 28. By hand, ÷ 4 is two right shifts, and 0111 0000 becomes 0001 1100 = 0x1C = 28.',
    'The first 16 vectors are the core\'s, so vector 28 is IRQ 28 − 16 = 12. Stopping at 28 gives B.',
    'The word read is 0x08000A1D. Bit 0 is the Thumb bit, so the last digit D = 1101 becomes C = 1100, and the handler starts at 0x08000A1C. Keeping bit 0 gives C, and taking the vector\'s own address gives D.',
  ];
  steps(viz('calc-steps'), ['All', '1 · offset', '2 · ÷ 4', '3 · − 16', '4 · Thumb bit'], k => {
    const L = LIT[k];
    chain.forEach((g, i) => g.classList.toggle('dim', !!L && i > L[0]));
    th.classList.toggle('dim', !!L && !L[1]);
    wrong.forEach((g, i) => g.classList.toggle('dim', !!L && L[2].indexOf(i) < 0));
    role('calc-note').textContent = NOTES[k];
  });
});

QV.register('s3-mc21', function (q) {
  const { s, svg, box, arrow, steps } = QV;
  const { txt } = L5;
  const viz = n => q.querySelector(`[data-viz="${n}"]`);
  const role = n => q.querySelector(`[data-role="${n}"]`);
  const W = svg(viz('mux'), 780, 236, { label: 'EXTI line 9 multiplexer with PA9 and PB9 in, selected by EXTICR[2] bits 15:8, feeding FPR1, IMR1, NVIC IRQ 7 and vector 23', minWidth: 600 });
  const dyn = s('g', {}, W);
  const render = fixed => {
    dyn.textContent = '';
    const IN = [['PA9', 'code 0', 'no button', 60], ['PB9', 'code 1', 'pressed, falling edge', 110]];
    IN.forEach(([pin, code, sub, y], i) => {
      const sel = fixed ? i === 1 : i === 0;
      txt(dyn, 0, y, pin, 't-fg t-bold');
      s('line', { x1: 40, x2: 170, y1: y, y2: y, class: sel ? 's-pri' : 's-line' }, dyn);
      txt(dyn, 110, y - 10, code, 't-sm', 'middle');
      txt(dyn, 40, y + 14, sub, i === 1 ? 't-sec t-sm' : 't-sm');
      if (sel) s('line', { x1: 170, y1: y, x2: 230, y2: 98, class: 's-pri' }, dyn);
    });
    txt(dyn, 0, 150, 'codes 2, 3, 5 pick ports C, D, F', 't-sm');
    s('polygon', { points: '170,36 230,60 230,136 170,160', class: 'f-none s-muted', style: 'stroke-width: 1.5' }, dyn);
    txt(dyn, 200, 124, 'line 9', 't-sm', 'middle');
    box(dyn, 100, 184, 200, 40, 'EXTICR[2] bits 15:8\n' + (fixed ? '= 1, port B' : '= 0, port A (reset)'), { cls: fixed ? 'f-ok-soft' : 'f-bad-soft', textCls: fixed ? 't-ok t-bold' : 't-bad t-bold', lh: 15 });
    arrow(dyn, 200, 184, 200, 152, { cls: fixed ? 'a-ok' : 'a-bad' });
    const a = fixed ? { cls: 'a-pri' } : { cls: 'a-muted', dash: true };
    arrow(dyn, 230, 98, 268, 98, a);
    box(dyn, 270, 74, 150, 48, 'FTSR1, FPR1 bit 9\n' + (fixed ? '= 1, edge latched' : '= 0, no edge'), { cls: fixed ? 'f-pri-soft' : 'f-bad-soft', textCls: fixed ? 't-pri t-bold' : 't-bad t-bold', lh: 15 });
    arrow(dyn, 420, 98, 448, 98, a);
    box(dyn, 450, 74, 140, 48, 'IMR1 bit 9\n→ NVIC IRQ 7', { cls: fixed ? 'f-pri-soft' : 'f-seg', textCls: fixed ? 't-pri t-bold' : 't-muted', lh: 15 });
    arrow(dyn, 590, 98, 618, 98, a);
    box(dyn, 620, 74, 160, 48, 'EXTI4_15_IRQHandler\n' + (fixed ? 'runs, vector 23' : 'never runs'), { cls: fixed ? 'f-ok' : 'f-seg', textCls: fixed ? 't-on t-bold' : 't-muted', lh: 15 });
    role('mux-note').textContent = fixed
      ? 'With code 1 in EXTICR[2] bits 15:8, line 9 passes PB9. The press sets FPR1 bit 9, IMR1 lets it through, and the NVIC runs vector 23, EXTI4_15_IRQHandler. EXTICR[2] = 0x00000100.'
      : 'EXTICR[2] was never written, so line 9\'s field holds its reset value 0, port A. The multiplexer passes PA9, which has no button. PB9\'s falling edge reaches nothing, FPR1 bit 9 stays 0, and IRQ 7 never fires.';
  };
  steps(viz('mux-steps'), ['EXTICR never written', 'EXTICR[2] = 0x00000100'], k => render(k === 1), 0);
});

QV.register('s3-mc22', function (q) {
  const { s, svg, steps } = QV;
  const { hex8, txt, reg } = L5;
  const viz = n => q.querySelector(`[data-viz="${n}"]`);
  const role = n => q.querySelector(`[data-role="${n}"]`);
  const F0 = 0x1200;
  const OPTS = [
    { w: F0 | 0x200, sub: 'reads, ORs bit 9: ', note: '|= is a load, an OR and a store. It reads 0x00001200, ORs in bit 9 (already 1) and writes 0x00001200 back. Both 1s clear their lines.', verdict: 'Line 9 cleared, and line 12 cleared too. Its edge is lost before the handler sees it.' },
    { w: 0x200, sub: 'no read: ', note: 'A plain store writes 0x00000200. The 1 at bit 9 clears line 9, and every 0, bit 12 included, does nothing.', verdict: 'Line 9 cleared, line 12 still pending. The handler is called again for line 12.' },
    { w: F0 & ~0x200, sub: 'reads, clears bit 9: ', note: '&= ~ is a load, an AND and a store. It reads 0x00001200, clears bit 9 in its copy and writes 0x00001000. The 0 at bit 9 does nothing, and the 1 at bit 12 clears line 12.', verdict: 'Line 9 still pending, so the handler is entered again and again, and line 12 is lost.' },
    { w: 0, sub: 'no read: ', note: 'Writing 0x00000000 does nothing to any line, because a 0 written to a write-1-to-clear register is ignored.', verdict: 'Nothing cleared. Line 9 stays pending and the handler runs forever.' },
  ];
  const W = svg(viz('w1c'), 780, 214, { label: 'FPR1 before, the value each option writes, and FPR1 after, for lines 15 to 0', minWidth: 600 });
  const X0 = 200, cfg = { x: X0, bits: 16, cw: 30, ch: 24, gap: 6 };
  const dyn = s('g', {}, W);
  const R = reg(s('g', {}, W), Object.assign({ y: 34, value: F0, hl: (b, v) => (v ? (b === 9 ? 'pri' : 'ter') : null) }, cfg));
  txt(W, 0, 18, 'line', 't-sm');
  for (let b = 15; b >= 0; b--) txt(W, R.cx(b), 18, String(b), b === 9 ? 't-pri t-bold' : b === 12 ? 't-ter t-bold' : 't-sm', 'middle');
  txt(W, 0, 39, 'FPR1 before', 't-fg t-bold');
  txt(W, 0, 53, hex8(F0), 't-muted');
  steps(viz('w1c-steps'), ['A · |=', 'B · =', 'C · &= ~', 'D · = 0'], k => {
    dyn.textContent = '';
    const o = OPTS[k], after = F0 & ~o.w, good = k === 1;
    reg(dyn, Object.assign({ y: 88, value: o.w, hl: (b, v) => (v ? 'sec' : null) }, cfg));
    txt(dyn, 0, 93, 'written', 't-fg t-bold');
    txt(dyn, 0, 107, o.sub + hex8(o.w), 't-muted t-sm');
    reg(dyn, Object.assign({ y: 142, value: after, hl: (b, v) => (b === 9 ? (v ? 'bad' : 'ok') : b === 12 ? (v ? 'ok' : 'bad') : null) }, cfg));
    txt(dyn, 0, 147, 'FPR1 after', 't-fg t-bold');
    txt(dyn, 0, 161, hex8(after), 't-muted');
    txt(dyn, 0, 196, o.verdict, good ? 't-ok t-bold' : 't-bad t-bold');
    role('w1c-note').textContent = o.note;
  }, 1);
});
