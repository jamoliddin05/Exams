QV.register('s1-mc31', function (q) {
  const { s, svg, table } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const BIT = 1e6 / 38400;
  const X0 = 50, PX = 1.3, HI = 62, LO = 98;
  const tx = t => X0 + t * PX;

  // Figure 1: two frames back to back on a µs axis
  const F = svg(viz('frame'), 760, 236, { label: 'Two UART bytes at 38 400 baud on a time axis, with one bit, the 8 data bits, the whole byte and the read deadline marked', minWidth: 560 });
  const BYTES = [{ v: 0x41, name: "byte 1 · 'A' = 0x41", soft: 'f-pri-soft', txt: 't-pri' }, { v: 0x42, name: "byte 2 · 'B' = 0x42", soft: 'f-sec-soft', txt: 't-sec' }];
  let d = `M20 ${HI} H${X0}`, level = 1;
  BYTES.forEach((b, i) => {
    const t0 = i * 10 * BIT;
    const bits = [0, ...[0, 1, 2, 3, 4, 5, 6, 7].map(k => (b.v >> k) & 1), 1];
    s('rect', { x: tx(t0), y: HI - 6, width: 10 * BIT * PX, height: LO - HI + 12, class: b.soft }, F);
    bits.forEach((v, k) => {
      const x = tx(t0 + k * BIT);
      if (k > 0) s('line', { x1: x, x2: x, y1: HI - 6, y2: LO + 6, class: 'l-grid' }, F);
      if (v !== level) { d += ` H${x.toFixed(1)} V${v ? HI : LO}`; level = v; }
      s('text', { x: x + BIT * PX / 2, y: LO + 16, 'text-anchor': 'middle', class: 't-sm' }, F, k === 0 ? 'st' : k === 9 ? 'sp' : 'b' + (k - 1));
    });
    s('text', { x: tx(t0 + 5 * BIT), y: 46, 'text-anchor': 'middle', class: b.txt + ' t-bold' }, F, b.name);
  });
  s('path', { d: d + ' H745', class: 's-fg', style: 'stroke-width: 2' }, F);
  [[10 * BIT, 'byte 1 in RDR, RXNE = 1', 'middle'], [20 * BIT, 'byte 2 complete: ORE if RDR unread', 'end']].forEach(([t, label, anchor]) => {
    s('line', { x1: tx(t), x2: tx(t), y1: 22, y2: LO + 4, class: 's-fg dash', style: 'stroke-width: 1' }, F);
    s('text', { x: tx(t), y: 16, 'text-anchor': anchor, class: 't-fg' }, F, label);
  });
  const bracket = (t0, t1, y, cls, label, right) => {
    const a = tx(t0), b = tx(t1);
    s('path', { d: `M${a} ${y - 5} V${y} H${b} V${y - 5}`, class: 's-' + cls, style: 'stroke-width: 1.5' }, F);
    s('text', { x: right ? b + 8 : (a + b) / 2, y: right ? y : y - 7, dy: right ? '0.35em' : null, 'text-anchor': right ? 'start' : 'middle', class: 't-' + cls + ' t-bold halo' }, F, label);
  };
  bracket(0, BIT, 138, 'muted', '1 bit = 26 µs · option C', true);
  bracket(BIT, 9 * BIT, 162, 'muted', '8 data bits = 208 µs · option A');
  bracket(0, 10 * BIT, 186, 'pri', '10 bits = 260 µs · option D');
  bracket(10 * BIT, 20 * BIT, 138, 'ok', 'the handler has 260 µs to read RDR');
  s('line', { x1: X0, x2: tx(520), y1: 204, y2: 204, class: 'l-axis' }, F);
  [0, 130, 260, 390, 520].forEach(t => {
    s('line', { x1: tx(t), x2: tx(t), y1: 204, y2: 209, class: 'l-axis' }, F);
    s('text', { x: tx(t), y: 222, 'text-anchor': 'middle' }, F, t === 520 ? '520 µs' : String(t));
  });

  // Figure 2: the same bit time in clock cycles at 48 MHz and at 12 MHz
  const C = svg(viz('clock'), 760, 196, { label: 'One 26 microsecond bit drawn as clock cycles: 1250 cycles at 48 MHz, 312.5 cycles at 12 MHz', minWidth: 560 });
  const BX = 130, BW = 600;
  s('path', { d: `M${BX} 26 V20 H${BX + BW} V26`, class: 's-muted', style: 'stroke-width: 1.5' }, C);
  s('text', { x: BX + BW / 2, y: 14, 'text-anchor': 'middle', class: 't-fg t-bold' }, C, 'one bit at 38 400 baud = 26.04 µs');
  [
    { mhz: 48, cyc: 1250, y: 34, cls: 'pri', marks: [0, 250, 500, 750, 1000], end: '1250 cycles', note: 'BRR = 48 000 000 / 38 400 = 1250' },
    { mhz: 12, cyc: 312.5, y: 118, cls: 'sec', marks: [0, 100, 200], end: '312.5 cycles', note: 'BRR = 12 000 000 / 38 400 = 312.5 → 313, option B' },
  ].forEach(r => {
    const cx = c => BX + c / r.cyc * BW;
    s('text', { x: 0, y: r.y + 15, dy: '0.35em', class: `t-${r.cls} t-bold` }, C, r.mhz + ' MHz');
    s('rect', { x: BX, y: r.y, width: BW, height: 30, class: `f-${r.cls}-soft` }, C);
    for (let c = 0; c <= r.cyc; c += 50) s('line', { x1: cx(c), x2: cx(c), y1: r.y, y2: r.y + 30, class: 's-' + r.cls, style: 'stroke-width: 1' }, C);
    s('line', { x1: cx(r.cyc), x2: cx(r.cyc), y1: r.y, y2: r.y + 30, class: 's-' + r.cls }, C);
    r.marks.forEach(c => s('text', { x: cx(c), y: r.y + 44, 'text-anchor': 'middle', class: 't-sm' }, C, String(c)));
    s('text', { x: BX + BW, y: r.y + 44, 'text-anchor': 'end', class: 't-sm' }, C, r.end);
    s('text', { x: BX, y: r.y + 64, class: `t-${r.cls} t-bold` }, C, r.note);
  });

  const T = table(viz('brr-table'), ['Baud', 'BRR at 48 MHz', 'BRR at 12 MHz', 'One byte (10 bits)'], [
    ['9 600', '5000', '1250', '1.04 ms'],
    ['19 200', '2500', '625', '521 µs'],
    ['38 400', { text: '1250', cls: 'hl' }, '312.5 → 313', { text: '260 µs', cls: 'hl' }],
    ['115 200', '416.67 → 417', '104.17 → 104', '86.8 µs'],
  ]);
  T.rows[2].classList.add('on');
});

QV.register('s1-mc32', function (q) {
  const { s, svg, steps } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const BODY = [['P', 0x50], ['I', 0x49], ['N', 0x4E], ['G', 0x47]];
  const hex = v => v.toString(16).toUpperCase().padStart(2, '0');
  const bin = v => { const b = v.toString(2).padStart(8, '0'); return b.slice(0, 4) + ' ' + b.slice(4); };
  const bit = (v, c) => (v >> (7 - c)) & 1;
  const RUN = [0];
  BODY.forEach(([, v]) => RUN.push(RUN[RUN.length - 1] ^ v));

  const W = svg(viz('xor'), 640, 316, { label: 'The bytes of PING in binary and their running XOR, which ends at 0x10', minWidth: 520 });
  // the frame as sent, with the body bracketed
  ['$', 'P', 'I', 'N', 'G', '*', '1', '0'].forEach((ch, i) => {
    const x = 20 + i * 30, body = i >= 1 && i <= 4, cs = i >= 6;
    s('rect', { x, y: 6, width: 26, height: 26, rx: 3, class: body ? 'f-pri-soft' : cs ? 'f-ok' : 'f-seg' }, W);
    s('text', { x: x + 13, y: 19, dy: '0.35em', 'text-anchor': 'middle', class: body ? 't-pri t-bold' : cs ? 't-on t-bold' : 't-muted' }, W, ch);
  });
  s('path', { d: 'M50 38 V43 H166 V38', class: 's-pri', style: 'stroke-width: 1.5' }, W);
  s('text', { x: 108, y: 57, 'text-anchor': 'middle', class: 't-pri' }, W, 'body: XOR these');
  s('text', { x: 262, y: 19, dy: '0.35em', class: 't-ok t-bold' }, W, '← checksum, two hex digits');

  const G = { x0: 210, y0: 96, cell: 34, gap: 4, runY: 258 };
  const cx = c => G.x0 + c * (G.cell + G.gap);
  const ry = r => G.y0 + r * (G.cell + G.gap);
  for (let c = 0; c < 8; c++) s('text', { x: cx(c) + G.cell / 2, y: G.y0 - 8, 'text-anchor': 'middle', class: 't-sm' }, W, 'b' + (7 - c));
  s('line', { x1: cx(0) - 4, x2: cx(7) + G.cell + 4, y1: G.runY - 8, y2: G.runY - 8, class: 's-fg' }, W);
  const layer = s('g', {}, W);
  const cellAt = (g, x, y, v, on, off) => {
    s('rect', { x, y, width: G.cell, height: G.cell, rx: 3, class: v ? on[0] : 'f-seg' }, g);
    s('text', { x: x + G.cell / 2, y: y + G.cell / 2, dy: '0.35em', 'text-anchor': 'middle', class: v ? on[1] : off }, g, String(v));
  };

  const note = role('xor-note'), calc = role('xor-calc');
  steps(viz('xor-steps'), ['All', '1 · P', '2 · I', '3 · N', '4 · G'], k => {
    layer.textContent = '';
    const upto = k === 0 ? 4 : k;
    BODY.forEach(([ch, v], r) => {
      const g = s('g', { class: k > 0 && r >= k ? 'dim' : null }, layer);
      s('text', { x: G.x0 - 14, y: ry(r) + G.cell / 2, dy: '0.35em', 'text-anchor': 'end', class: 't-fg t-bold' }, g, `${ch}  0x${hex(v)}`);
      for (let c = 0; c < 8; c++) cellAt(g, cx(c), ry(r), bit(v, c), ['f-pri', 't-on t-bold'], 't-muted');
      if (r < upto) s('text', { x: cx(7) + G.cell + 14, y: ry(r) + G.cell / 2, dy: '0.35em', class: r === upto - 1 ? 't-ok t-bold' : 't-muted' }, g, '→ ' + hex(RUN[r + 1]));
      if (k > 0 && r === k - 1) s('rect', { x: cx(0) - 4, y: ry(r) - 4, width: 8 * G.cell + 7 * G.gap + 8, height: G.cell + 8, rx: 5, class: 'f-none outline-pri' }, g);
    });
    const v = RUN[upto];
    s('text', { x: G.x0 - 14, y: G.runY + G.cell / 2, dy: '0.35em', 'text-anchor': 'end', class: 't-ok t-bold' }, layer, k === 0 ? 'XOR = 0x10' : 'running 0x' + hex(v));
    for (let c = 0; c < 8; c++) {
      cellAt(layer, cx(c), G.runY, bit(v, c), ['f-ok', 't-on t-bold'], 't-muted');
      if (k > 0 && bit(BODY[k - 1][1], c)) s('rect', { x: cx(c) - 2, y: G.runY - 2, width: G.cell + 4, height: G.cell + 4, rx: 4, class: 'f-none outline-sec' }, layer);
    }
    if (k === 0) {
      s('text', { x: G.x0 - 14, y: G.runY + G.cell + 16, 'text-anchor': 'end', class: 't-sm' }, layer, '1s in the column');
      for (let c = 0; c < 8; c++) {
        const n = BODY.reduce((a, [, b]) => a + bit(b, c), 0);
        s('text', { x: cx(c) + G.cell / 2, y: G.runY + G.cell + 16, 'text-anchor': 'middle', class: n % 2 ? 't-ok t-bold' : 't-muted' }, layer, String(n));
      }
      s('text', { x: cx(7) + G.cell + 14, y: G.runY + G.cell / 2, dy: '0.35em', class: 't-ok t-bold' }, layer, '$PING*10');
    }

    if (k === 0) {
      note.textContent = 'All four bytes. Each checksum bit is 1 when its column holds an odd number of 1s. Only column b4 does (P alone), so the XOR is 0001 0000 = 0x10 and the frame is $PING*10.';
      calc.textContent = BODY.map(([ch, b]) => `${ch}   ${bin(b)}   ${hex(b)}`).concat(['    ---------', `    ${bin(0x10)}   10   → $PING*10`]).join('\n');
    } else {
      const [ch, b] = BODY[k - 1];
      note.textContent = k === 1
        ? `Start from 0 and XOR in P = 0x50. The running value is simply 50.`
        : `XOR in ${ch} = 0x${hex(b)}. Every 1 in ${ch} flips that bit of the running value (outlined): ${hex(RUN[k - 1])} ^ ${hex(b)} = ${hex(RUN[k])}.` + (k === 4 ? ' That is the last byte of the body, so the checksum is 10.' : '');
      calc.textContent = [`running   ${bin(RUN[k - 1])}   ${hex(RUN[k - 1])}`, `^ ${ch}       ${bin(b)}   ${hex(b)}`, `=         ${bin(RUN[k])}   ${hex(RUN[k])}`].join('\n');
    }
  }, 0);
});

QV.register('s1-mc33', function (q) {
  const { s, svg, steps, box, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);

  // Figure 1: ISR low byte under each option's action
  const ISR_N = ['TXE', 'TC', 'RXNE', 'IDLE', 'ORE', 'NE', 'FE', 'PE'];
  const ICR_N = ['', 'TCCF', '', 'IDLECF', 'ORECF', 'NECF', 'FECF', 'PECF'];
  const START = 0xE8;
  const R = { x0: 170, cw: 62, gap: 4, isrY: 60, icrY: 172, h: 34 };
  const cx = c => R.x0 + c * (R.cw + R.gap);
  const mid = c => cx(c) + R.cw / 2;
  const colOf = b => 7 - b;
  const P = svg(viz('isr'), 760, 236, { label: 'USART2 ISR bits 7 to 0 and ICR bits 7 to 0, showing which action clears which flag', minWidth: 560 });
  for (let c = 0; c < 8; c++) {
    s('text', { x: mid(c), y: 32, 'text-anchor': 'middle', class: 't-sm' }, P, 'bit ' + (7 - c));
    s('text', { x: mid(c), y: 50, 'text-anchor': 'middle', class: 't-fg t-bold' }, P, ISR_N[c]);
    s('text', { x: mid(c), y: R.icrY + R.h + 16, 'text-anchor': 'middle', class: ICR_N[c] ? 't-fg t-bold' : 't-muted' }, P, ICR_N[c] || '—');
  }
  s('text', { x: 0, y: R.isrY + 12, class: 't-fg t-bold t-lg' }, P, 'ISR');
  s('text', { x: 0, y: R.isrY + 28, class: 't-sm' }, P, 'status, read only');
  s('text', { x: 0, y: R.icrY + 12, class: 't-fg t-bold t-lg' }, P, 'ICR');
  s('text', { x: 0, y: R.icrY + 28, class: 't-sm' }, P, 'write 1 to clear');
  const layer = s('g', {}, P);

  const ACT = [
    { label: 'After the overrun', after: START, icr: 0, note: 'Just after the overrun: RXNE (a byte waits in RDR), ORE (the next one was lost), TC and TXE (the transmitter is idle) read 1. ISR = 0xE8.' },
    { label: 'A · read RDR', after: START & ~0x20, icr: 0, src: ['read RDR', [5]], note: 'Option A. Reading RDR takes the waiting byte and clears RXNE, bit 5. ORE, bit 3, is still 1, so reception stays blocked.' },
    { label: 'B · ICR = ORECF', after: START & ~0x08, icr: 0x08, note: 'Option B. Writing 1 to ORECF, bit 3 of a different register, clears ORE, bit 3 of ISR. Reception resumes. This is the line the lesson\'s handler has: USART2->ICR = USART_ICR_ORECF.' },
    { label: 'C · wait', after: START, icr: 0, src: ['next byte', null], note: 'Option C. No flag on this chip clears itself. The next byte arrives, but while ORE is set it is not received: ISR is unchanged.' },
    { label: 'D · write TDR', after: START & ~0xC0, icr: 0, src: ['write TDR', [7, 6]], note: 'Option D. Writing TDR starts a transmission and clears TXE and TC, the transmit side\'s flags. ORE is untouched.' },
  ];
  const note = role('isr-note');
  steps(viz('isr-steps'), ACT.map(a => a.label), k => {
    layer.textContent = '';
    const a = ACT[k];
    for (let c = 0; c < 8; c++) {
      const b = 7 - c, v = (a.after >> b) & 1, was = (START >> b) & 1;
      s('rect', { x: cx(c), y: R.isrY, width: R.cw, height: R.h, rx: 3, class: v ? 'f-pri' : 'f-seg' }, layer);
      s('text', { x: mid(c), y: R.isrY + R.h / 2, dy: '0.35em', 'text-anchor': 'middle', class: v ? 't-on t-bold t-lg' : 't-muted t-lg' }, layer, String(v));
      if (was !== v) s('text', { x: mid(c), y: R.isrY + R.h + 14, 'text-anchor': 'middle', class: 't-pri t-bold t-sm' }, layer, '1 → 0');
      const w = (a.icr >> b) & 1;
      s('rect', { x: cx(c), y: R.icrY, width: R.cw, height: R.h, rx: 3, class: w ? 'f-ok' : 'f-seg', style: k === 2 ? null : 'opacity: 0.5' }, layer);
      s('text', { x: mid(c), y: R.icrY + R.h / 2, dy: '0.35em', 'text-anchor': 'middle', class: w ? 't-on t-bold t-lg' : 't-muted' }, layer, k === 2 ? String(w) : '·');
    }
    const ore = (a.after >> 3) & 1;
    s('rect', { x: cx(4) - 3, y: R.isrY - 3, width: R.cw + 6, height: R.h + 6, rx: 5, class: 'f-none ' + (ore ? 'outline-sec' : 'outline-pri') }, layer);
    s('text', { x: cx(7) + R.cw + 8, y: R.isrY + R.h / 2, dy: '0.35em', class: 't-fg t-bold' }, layer, '0x' + a.after.toString(16).toUpperCase());
    if (k !== 2) s('text', { x: cx(7) + R.cw + 8, y: R.icrY + R.h / 2, dy: '0.35em', class: 't-muted' }, layer, 'not written');
    if (k === 2) arrow(layer, mid(4), R.icrY - 2, mid(4), R.isrY + R.h + 20, { cls: 'a-ok', width: 2.5, label: 'write 1: clears ORE', dx: 70, dy: 2 });
    if (a.src) {
      box(layer, 4, 112, 112, 30, a.src[0], { cls: a.src[1] ? 'f-surface' : 'f-bad-soft', textCls: a.src[1] ? 't-fg t-bold' : 't-bad t-bold' });
      if (a.src[1]) a.src[1].forEach(b => arrow(layer, 116, 127, mid(colOf(b)), R.isrY + R.h + 20, { cls: 'a-pri', width: 1.5 }));
      else s('text', { x: 124, y: 127, dy: '0.35em', class: 't-bad t-bold' }, layer, 'not received: ORE blocks it');
    }
    s('text', { x: mid(4), y: R.isrY - 30, 'text-anchor': 'middle', class: (ore ? 't-sec' : 't-pri') + ' t-bold' }, layer, ore ? 'still set' : 'cleared');
    note.textContent = a.note;
  }, 2);

  // Figure 2: the typed line, lesson handler against the student's
  const CH = ['l', 'e', 'd', 'sp', '1', '7', '0', 'CR'];
  const S = { x0: 130, w: 76, rows: [40, 96, 150], h: 30 };
  const T = svg(viz('timeline'), 760, 236, { label: 'Eight typed bytes on the wire; with the ICR write one byte is lost, without it every byte after the overrun is never received', minWidth: 560 });
  const sx = i => S.x0 + i * S.w;
  s('rect', { x: sx(0), y: S.rows[0] - 8, width: 2 * S.w + 12, height: S.rows[2] + S.h + 8 - S.rows[0] + 8, class: 'f-ter-soft' }, T);
  s('text', { x: sx(1) + 6, y: 24, 'text-anchor': 'middle', class: 't-ter t-bold' }, T, 'interrupts masked');
  s('line', { x1: sx(2), x2: sx(2), y1: 28, y2: S.rows[2] + S.h + 6, class: 's-bad dash', style: 'stroke-width: 1.5' }, T);
  s('text', { x: sx(2) + 16, y: 24, class: 't-bad t-bold' }, T, 'byte 2 lands on unread byte 1: ORE = 1');
  [['on the wire', 'one byte per 87 µs'], ['lesson handler', 'writes ICR'], ['student handler', 'never writes ICR']].forEach(([a, b], r) => {
    s('text', { x: 0, y: S.rows[r] + 11, class: 't-fg t-bold' }, T, a);
    s('text', { x: 0, y: S.rows[r] + 26, class: 't-sm' }, T, b);
  });
  CH.forEach((ch, i) => {
    const kinds = ['wire', i === 1 ? 'lost' : 'ok', i === 1 ? 'lost' : i === 0 ? 'ok' : 'never'];
    kinds.forEach((kind, r) => {
      const cls = { wire: ['f-surface', 't-fg t-bold'], ok: ['f-ok', 't-on t-bold'], lost: ['f-bad', 't-on t-bold'], never: ['f-seg', 't-muted'] }[kind];
      box(T, sx(i) + 4, S.rows[r], S.w - 8, S.h, ch, { cls: cls[0], textCls: cls[1], stroke: kind === 'wire' ? 'box' : 'sep' });
      if (kind === 'never') s('line', { x1: sx(i) + 10, x2: sx(i) + S.w - 10, y1: S.rows[r] + S.h - 6, y2: S.rows[r] + 6, class: 's-muted', style: 'stroke-width: 1' }, T);
    });
  });
  s('text', { x: 0, y: 206, class: 't-ok t-bold' }, T, 'lesson: the queue gets l d sp 1 7 0 CR. One byte lost, rx_overruns = 1, reception goes on.');
  s('text', { x: 0, y: 226, class: 't-bad t-bold' }, T, 'student: the queue gets l, then nothing. ORE stays 1 and no byte is ever received again.');
});
