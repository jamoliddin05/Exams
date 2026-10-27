QV.register('s2-mc31', function (q) {
  const { s, svg, steps, scale } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const TR = 1e6 / 115200;
  const TEXT = '=== S', T0 = 8, TEND = 360;
  const X0 = 84, PX = 652 / TEND, HI = 40, LO = 78;
  const tx = t => X0 + t * PX;
  const group = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const hex = v => v.toString(16).toUpperCase().padStart(2, '0');

  // Figure 1: the board's line and the terminal's samples on one µs axis
  const W = svg(viz('wave'), 760, 214, { label: 'The start of the banner on the board TX line, the terminal samples at 115 200 baud, and the bytes the terminal builds from them', minWidth: 560 });
  [['board TX', 59], ['bits read', 114], ['bytes read', 145]].forEach(([t, y]) => s('text', { x: 0, y, dy: '0.35em', class: 't-fg t-bold' }, W, t));
  s('line', { x1: X0, x2: tx(TEND), y1: 180, y2: 180, class: 'l-axis' }, W);
  for (let t = 0; t <= 350; t += 50) {
    s('line', { x1: tx(t), x2: tx(t), y1: 180, y2: 185, class: 'l-axis' }, W);
    s('text', { x: tx(t), y: 199, 'text-anchor': 'middle' }, W, t === 350 ? '350 µs' : String(t));
  }
  const layer = s('g', {}, W);

  const CASES = [
    { clk: 12e6, brr: 417, verdict: '<b>417</b> clocks of 12 MHz last 34.75 µs, four times the terminal\'s 8.68 µs bit. All nine samples of the first frame fall inside the board\'s first three bits, so the terminal reads <b>0x78</b> with a framing error, then <b>0x80</b>. Garbage.' },
    { clk: 48e6, brr: 417, verdict: '<b>417</b> clocks of 48 MHz last 8.69 µs, 0.08 % longer than the terminal\'s bit. Every sample lands in the right bit, and the four bytes read are <b>=== </b>.' },
    { clk: 12e6, brr: 104, verdict: '<b>104</b> clocks of 12 MHz last 8.67 µs, 0.16 % shorter. This is the right <code>BRR</code> for the clock the chip really runs, and the terminal reads <b>=== </b> again.' },
  ];
  steps(viz('clk-steps'), ['12 MHz, BRR 417', '48 MHz, BRR 417', '12 MHz, BRR 104'], k => {
    layer.textContent = '';
    const c = CASES[k], tb = c.brr / c.clk * 1e6;
    const bits = [];
    [...TEXT].forEach((ch, i) => {
      const v = ch.charCodeAt(0), b0 = T0 + i * 10 * tb;
      [0, ...[0, 1, 2, 3, 4, 5, 6, 7].map(j => (v >> j) & 1), 1].forEach((bv, j) => bits.push({ t0: b0 + j * tb, t1: b0 + (j + 1) * tb, v: bv, i, j }));
    });
    const level = t => { const b = bits.find(x => t >= x.t0 && t < x.t1); return b ? b.v : 1; };

    [...TEXT].forEach((ch, i) => {
      const a = T0 + i * 10 * tb, b = a + 10 * tb;
      if (a >= TEND) return;
      if (i % 2 === 0) s('rect', { x: tx(a), y: HI - 8, width: tx(Math.min(b, TEND)) - tx(a), height: LO - HI + 16, class: 'f-seg' }, layer);
      if (b <= TEND) s('text', { x: tx((a + b) / 2), y: 20, 'text-anchor': 'middle', class: 't-fg t-bold' }, layer, `'${ch}' 0x${hex(ch.charCodeAt(0))}`);
    });
    if (tb * PX >= 30) {
      bits.filter(b => b.t1 <= TEND).forEach(b => {
        if (b.j > 0) s('line', { x1: tx(b.t0), x2: tx(b.t0), y1: HI - 8, y2: LO + 8, class: 'l-grid' }, layer);
        s('text', { x: tx((b.t0 + b.t1) / 2), y: LO + 18, 'text-anchor': 'middle', class: 't-sm' }, layer, b.j === 0 ? 'st' : b.j === 9 ? 'sp' : 'b' + (b.j - 1));
      });
    }
    let d = `M${X0} ${HI}`, lv = 1;
    bits.filter(b => b.t0 < TEND).forEach(b => {
      if (b.v !== lv) { d += ` H${tx(b.t0).toFixed(1)} V${b.v ? HI : LO}`; lv = b.v; }
    });
    s('path', { d: d + ` H${tx(TEND)}`, class: 's-fg', style: 'stroke-width: 2' }, layer);

    // the terminal locks on to each falling edge, then samples mid-bit at its own rate
    const frames = [];
    let ready = 0;
    bits.forEach(b => {
      if (b.v !== 0 || b.t0 < ready || level(b.t0 - 1e-6) !== 1 || b.t0 + 10 * TR > TEND) return;
      const smp = [1, 2, 3, 4, 5, 6, 7, 8].map(j => level(b.t0 + (j + 0.5) * TR));
      frames.push({ st: b.t0, smp, stop: level(b.t0 + 9.5 * TR), val: smp.reduce((acc, v, j) => acc | (v << j), 0) });
      ready = b.t0 + 9.5 * TR;
    });
    frames.forEach((f, n) => {
      s('line', { x1: tx(f.st), x2: tx(f.st), y1: HI - 8, y2: 130, class: 's-muted dash', style: 'stroke-width: 1' }, layer);
      [...f.smp, f.stop].forEach((v, j) => {
        const x = tx(f.st + (j + 1.5) * TR), stop = j === 8;
        const cls = stop ? (v ? 'ok' : 'bad') : 'pri';
        s('circle', { cx: x, cy: v ? HI : LO, r: stop ? 4 : 3.2, class: 'f-' + cls }, layer);
        s('text', { x, y: 114, dy: '0.35em', 'text-anchor': 'middle', class: `t-${cls}` + (stop ? ' t-bold' : '') }, layer, String(v));
      });
      const good = k > 0;
      const label = good ? `0x${hex(f.val)} '${String.fromCharCode(f.val)}'` : `0x${hex(f.val)} · ` + (f.stop ? 'wrong byte' : 'framing error');
      QV.box(layer, tx(f.st), 132, 10 * TR * PX - 2, 26, label, { cls: good ? 'f-ok-soft' : 'f-bad-soft', textCls: (good ? 't-ok' : 't-bad') + ' t-bold', rx: 3 });
    });
    role('board').textContent = group(c.clk / c.brr);
    role('read').textContent = frames.map(f => hex(f.val)).join(' ');
    role('verdict').innerHTML = c.verdict;
  }, 0);

  // Figure 2: the baud rates to scale, with a zoom on the tolerance band
  const R = svg(viz('rates'), 760, 230, { label: 'Baud rates on a line: 28 777 far outside a plus or minus 3 percent band around 115 200, while 115 108 and 115 385 sit inside it', minWidth: 560 });
  const L = 40, RR = 720;
  const a = scale(0, 130000, L, RR);
  s('text', { x: L, y: 14, class: 't-fg t-bold' }, R, 'Whole range, 0 to 130 000 baud');
  s('rect', { x: a(111744), y: 56, width: a(118656) - a(111744), height: 24, class: 'f-ok-soft' }, R);
  s('line', { x1: L, x2: RR, y1: 80, y2: 80, class: 'l-axis' }, R);
  [0, 20000, 40000, 60000, 80000, 100000, 120000].forEach(v => {
    s('line', { x1: a(v), x2: a(v), y1: 80, y2: 85, class: 'l-axis' }, R);
    s('text', { x: a(v), y: 98, 'text-anchor': 'middle' }, R, group(v));
  });
  s('line', { x1: a(115200), x2: a(115200), y1: 40, y2: 80, class: 's-pri', style: 'stroke-width: 2' }, R);
  s('text', { x: a(115200), y: 33, 'text-anchor': 'middle', class: 't-pri t-bold' }, R, 'terminal 115 200, ±3 % band');
  s('line', { x1: a(28777), x2: a(28777), y1: 56, y2: 76, class: 's-bad', style: 'stroke-width: 1' }, R);
  s('circle', { cx: a(28777), cy: 80, r: 5, class: 'f-bad' }, R);
  s('text', { x: a(28777), y: 48, 'text-anchor': 'middle', class: 't-bad t-bold' }, R, '417 at 12 MHz: 28 777 baud, −75 %');

  const z = scale(111000, 119500, L, RR);
  s('text', { x: L, y: 128, class: 't-fg t-bold' }, R, 'Near 115 200, enlarged: 111 000 to 119 500 baud');
  s('rect', { x: z(111744), y: 160, width: z(118656) - z(111744), height: 40, class: 'f-ok-soft' }, R);
  s('text', { x: z(111744) + 5, y: 171, class: 't-ok t-sm' }, R, '−3 %');
  s('text', { x: z(118656) - 5, y: 171, 'text-anchor': 'end', class: 't-ok t-sm' }, R, '+3 %');
  s('line', { x1: L, x2: RR, y1: 200, y2: 200, class: 'l-axis' }, R);
  [112000, 114000, 116000, 118000].forEach(v => {
    s('line', { x1: z(v), x2: z(v), y1: 200, y2: 205, class: 'l-axis' }, R);
    s('text', { x: z(v), y: 218, 'text-anchor': 'middle' }, R, group(v));
  });
  s('line', { x1: z(115200), x2: z(115200), y1: 150, y2: 200, class: 's-pri', style: 'stroke-width: 2' }, R);
  s('text', { x: z(115200), y: 144, 'text-anchor': 'middle', class: 't-pri t-bold' }, R, 'terminal 115 200');
  [[115108, '417 at 48 MHz: 115 108, −0.08 %', -8, 'end'], [12e6 / 104, '104 at 12 MHz: 115 385, +0.16 %', 8, 'start']].forEach(([v, t, dx, anchor]) => {
    s('circle', { cx: z(v), cy: 200, r: 4.5, class: 'f-ok' }, R);
    s('text', { x: z(v) + dx, y: 186, 'text-anchor': anchor, class: 't-ok t-bold' }, R, t);
  });
});

QV.register('s2-mc32', function (q) {
  const { s, svg, steps } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const SENT = 'LED,85', CARRIED = 0x6C;
  const hex = v => v.toString(16).toUpperCase().padStart(2, '0');
  const bit = (v, c) => (v >> (7 - c)) & 1;
  const xor = b => [...b].reduce((acc, ch) => acc ^ ch.charCodeAt(0), 0);
  const G = { x0: 170, y0: 58, cell: 28, pitch: 32 };
  const cx = c => G.x0 + c * G.pitch;
  const ry = r => G.y0 + r * G.pitch;
  const XY = ry(6) + 10, CY = XY + 36;

  const W = svg(viz('cols'), 620, CY + 40, { label: 'The six body bytes of LED,85 in binary with the damaged bits outlined, the XOR of the received body, and the checksum 6C the frame carries', minWidth: 520 });
  s('text', { x: G.x0 - 14, y: 26, 'text-anchor': 'end', class: 't-sm' }, W, 'bits changed');
  for (let c = 0; c < 8; c++) s('text', { x: cx(c) + G.cell / 2, y: G.y0 - 9, 'text-anchor': 'middle', class: 't-sm' }, W, 'b' + (7 - c));
  s('line', { x1: cx(0) - 4, x2: cx(7) + G.cell + 4, y1: XY - 6, y2: XY - 6, class: 's-fg' }, W);
  const layer = s('g', {}, W);
  const cell = (x, y, v, on, extra) => {
    s('rect', { x, y, width: G.cell, height: G.cell, rx: 3, class: v ? on[0] : 'f-seg', style: extra }, layer);
    s('text', { x: x + G.cell / 2, y: y + G.cell / 2, dy: '0.35em', 'text-anchor': 'middle', class: v ? on[1] : 't-muted', style: extra }, layer, String(v));
  };

  const COPIES = [
    { label: 'Sent · LED,85', body: 'LED,85', note: 'The frame as sent. Each checksum bit is 1 when its column of the body holds an odd number of 1s, which gives 0110 1100 = 6C, the checksum the frame carries.' },
    { label: 'A · LED,84', body: 'LED,84', short: '6C ^ (35 ^ 34) = 6C ^ 01 = 6D', note: '5 → 4 flips one bit, b0 of the last byte. Column b0 now holds an odd number of 1s, so the XOR becomes 6D and the board rejects the frame.' },
    { label: 'B · LED,86', body: 'LED,86', short: '6C ^ (35 ^ 36) = 6C ^ 03 = 6F', note: '5 → 6 changes two bits of one byte, b0 and b1. Each of the two columns changes once, so two checksum bits flip: 6F. A change inside one byte always shows.' },
    { label: 'C · LED,94', body: 'LED,94', short: '6C ^ (38 ^ 39) ^ (35 ^ 34) = 6C ^ 01 ^ 01 = 6C', note: '8 → 9 and 5 → 4 each flip b0, in two different bytes. Column b0 changes twice, so its parity is back where it started and the XOR is still 6C. The board accepts the frame and sets the bar to 94.' },
    { label: 'D · LED,8', body: 'LED,8', short: '6C ^ 35 = 59', note: 'The 5 is lost. Its 1s leave columns b5, b4, b2 and b0, so those four checksum bits flip: 6C ^ 35 = 59. The board rejects the frame.' },
  ];
  const note = role('col-note'), calc = role('col-calc');
  steps(viz('col-steps'), COPIES.map(x => x.label), k => {
    layer.textContent = '';
    const { body } = COPIES[k];
    const cnt = [0, 0, 0, 0, 0, 0, 0, 0];
    let run = 0;
    [...SENT].forEach((och, r) => {
      const o = och.charCodeAt(0), lost = r >= body.length;
      const g = lost ? o : body.charCodeAt(r), changed = !lost && g !== o;
      const label = lost ? `${och}  lost` : changed ? `${och}→${body[r]}  0x${hex(g)}` : `${och}  0x${hex(o)}`;
      s('text', { x: G.x0 - 14, y: ry(r) + G.cell / 2, dy: '0.35em', 'text-anchor': 'end', class: (lost ? 't-bad' : changed ? 't-sec' : 't-fg') + ' t-bold' }, layer, label);
      for (let c = 0; c < 8; c++) {
        cell(cx(c), ry(r), bit(g, c), ['f-pri', 't-on t-bold'], lost ? 'opacity: 0.3' : null);
        if (changed && bit(o, c) !== bit(g, c)) {
          s('rect', { x: cx(c) - 2, y: ry(r) - 2, width: G.cell + 4, height: G.cell + 4, rx: 4, class: 'f-none outline-sec' }, layer);
          cnt[c]++;
        }
        if (lost && bit(o, c)) cnt[c]++;
      }
      if (lost) {
        s('line', { x1: cx(0) - 4, x2: cx(7) + G.cell + 4, y1: ry(r) + G.cell / 2, y2: ry(r) + G.cell / 2, class: 's-bad', style: 'stroke-width: 2' }, layer);
        s('text', { x: cx(7) + G.cell + 14, y: ry(r) + G.cell / 2, dy: '0.35em', class: 't-bad t-bold' }, layer, 'not in the XOR');
      } else {
        run ^= g;
        s('text', { x: cx(7) + G.cell + 14, y: ry(r) + G.cell / 2, dy: '0.35em', class: r === body.length - 1 ? 't-fg t-bold' : 't-muted' }, layer, '→ ' + hex(run));
      }
    });
    cnt.forEach((n, c) => s('text', { x: cx(c) + G.cell / 2, y: 26, 'text-anchor': 'middle', class: n ? 't-sec t-bold t-lg' : 't-muted' }, layer, String(n)));

    const v = xor(body), ok = v === CARRIED;
    s('text', { x: G.x0 - 14, y: XY + G.cell / 2, dy: '0.35em', 'text-anchor': 'end', class: 't-ok t-bold' }, layer, 'XOR = ' + hex(v));
    s('text', { x: G.x0 - 14, y: CY + G.cell / 2, dy: '0.35em', 'text-anchor': 'end', class: 't-ter t-bold' }, layer, 'carried ' + hex(CARRIED));
    for (let c = 0; c < 8; c++) {
      cell(cx(c), XY, bit(v, c), ['f-ok', 't-on t-bold']);
      cell(cx(c), CY, bit(CARRIED, c), ['f-ter', 't-on t-bold']);
      if (bit(v, c) !== bit(CARRIED, c)) s('rect', { x: cx(c) - 2, y: XY - 2, width: G.cell + 4, height: CY - XY + G.cell + 4, rx: 4, class: 'f-none s-bad' }, layer);
    }
    s('text', { x: cx(7) + G.cell + 14, y: (XY + CY + G.cell) / 2, dy: '0.35em', class: (ok ? 't-ok' : 't-bad') + ' t-bold t-lg' }, layer, ok ? 'match: accepted' : `${hex(v)} ≠ 6C: rejected`);

    note.textContent = COPIES[k].note;
    let acc = body.charCodeAt(0);
    const lines = [`${body[0]}         ${hex(acc)}`];
    [...body].slice(1).forEach(ch => {
      const b = ch.charCodeAt(0);
      lines.push(`^ ${ch} ${hex(b)}  = ${hex(acc ^ b)}`);
      acc ^= b;
    });
    lines[lines.length - 1] += ok ? '   = 6C carried: accepted' : '   ≠ 6C carried: rejected';
    if (COPIES[k].short) lines.push('', 'shortcut: ' + COPIES[k].short);
    calc.textContent = lines.join('\n');
  }, 3);
});

QV.register('s2-mc33', function (q) {
  const { s, svg, steps, table } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const ISR_N = ['TXE', 'TC', 'RXNE', 'IDLE', 'ORE', 'NE', 'FE', 'PE'];
  const R = { x0: 170, cw: 62, gap: 4, h: 34, rows: [76, 134, 192] };
  const cx = c => R.x0 + c * (R.cw + R.gap);
  const mid = c => cx(c) + R.cw / 2;
  const hex = v => '0x' + v.toString(16).toUpperCase().padStart(2, '0');

  const LINES = [
    { label: 'A · read RDR', code: 'uint8_t c = (uint8_t)USART2->RDR;', reg: 'USART2->ISR', names: ISR_N, before: 0xE0, mode: 'read', target: 5, row: 3,
      wsub: 'no write: a read of RDR', verdict: ['RXNE cleared: this line works', 't-ok'],
      note: 'USART2 has a byte waiting (RXNE) and an idle transmitter (TC, TXE). Reading RDR hands over the byte and clears RXNE, bit 5. Nothing is written and no other flag changes.' },
    { label: 'B · write ISR', code: 'USART2->ISR &= ~USART_ISR_TXE;', reg: 'USART2->ISR', names: ISR_N, before: 0xC0, write: 0x40, mode: 'ro', target: 7, row: 3,
      wsub: 'ignored: ISR is read only', verdict: ['TXE still 1: the write did nothing', 't-bad'],
      note: 'The line reads ISR = 0xC0, clears bit 7 in its copy and writes 0x40 back. ISR is read only, so the write is ignored and TXE stays 1. TXE clears when a byte is written to TDR.' },
    { label: 'C · TIM3->SR', code: 'TIM3->SR = TIM_SR_UIF;', reg: 'TIM3->SR', names: ['—', 'TIF', '—', 'CC4IF', 'CC3IF', 'CC2IF', 'CC1IF', 'UIF'], before: 0x03, write: 0x01, mode: 'w0', target: 0, row: 1,
      wsub: 'a 0 clears, a 1 does nothing', verdict: ['UIF still 1, and CC1IF lost', 't-bad'],
      note: 'TIM3 has an update (UIF) and a capture (CC1IF) pending. The line writes 0x01. In SR a 0 clears a flag and a 1 does nothing, so UIF stays set and CC1IF, which nobody handled, is cleared. Right: TIM3->SR = ~TIM_SR_UIF.' },
    { label: 'D · EXTI->FPR1', code: 'EXTI->FPR1 &= ~(1u << 1);', reg: 'EXTI->FPR1', names: ['FPIF7', 'FPIF6', 'FPIF5', 'FPIF4', 'FPIF3', 'FPIF2', 'FPIF1', 'FPIF0'], before: 0x03, write: 0x01, mode: 'w1', target: 1, row: 0,
      wsub: 'a 1 clears, a 0 does nothing', verdict: ['line 1 still pending, and line 0 lost', 't-bad'],
      note: 'EXTI lines 0 and 1 are both pending. The line reads 0x03 and writes back 0x01. In FPR1 a 1 clears and a 0 does nothing, so line 1 stays pending and line 0, which nobody handled, is cleared. Right: EXTI->FPR1 = 1u << 1.' },
  ];
  const after = L => L.mode === 'read' ? L.before & ~(1 << L.target) : L.mode === 'ro' ? L.before : L.mode === 'w0' ? L.before & L.write : L.before & ~L.write;

  const P = svg(viz('flag'), 760, 262, { label: 'One register, bits 7 to 0: its value before the line, the value the line writes, and the value after, with the target flag outlined', minWidth: 560 });
  for (let c = 0; c < 8; c++) s('text', { x: mid(c), y: 48, 'text-anchor': 'middle', class: 't-sm' }, P, 'bit ' + (7 - c));
  const layer = s('g', {}, P);
  const note = role('flag-note');

  const T = table(viz('flag-table'), ['Flag', 'Clears by', 'Lesson', 'A line that clears it'], [
    [{ text: 'EXTI FPR1', cls: 'l' }, { text: 'write 1 to it', cls: 'l' }, '05', { text: 'EXTI->FPR1 = 1u << 1;', cls: 'l' }],
    [{ text: 'TIM UIF', cls: 'l' }, { text: 'write 0 to it', cls: 'l' }, '06', { text: 'TIM3->SR = ~TIM_SR_UIF;', cls: 'l' }],
    [{ text: 'TIM CC1IF', cls: 'l' }, { text: 'read CCR1', cls: 'l' }, '06', { text: 'uint32_t t = TIM3->CCR1;', cls: 'l' }],
    [{ text: 'USART RXNE / TXE', cls: 'l' }, { text: 'read RDR / write TDR', cls: 'l' }, '08', { text: 'c = USART2->RDR; / USART2->TDR = b;', cls: 'l' }],
    [{ text: 'USART ORE', cls: 'l' }, { text: 'write 1 to ICR', cls: 'l' }, '08', { text: 'USART2->ICR = USART_ICR_ORECF;', cls: 'l' }],
  ]);

  steps(viz('flag-steps'), LINES.map(L => L.label), k => {
    layer.textContent = '';
    const L = LINES[k], aft = after(L);
    s('text', { x: 0, y: 18, class: 't-fg t-bold t-lg' }, layer, L.code);
    for (let c = 0; c < 8; c++) s('text', { x: mid(c), y: 64, 'text-anchor': 'middle', class: c === 7 - L.target ? 't-fg t-bold' : 't-muted' }, layer, L.names[c]);
    [['before', L.reg], ['line writes', L.wsub], ['after', L.reg]].forEach(([a, b], r) => {
      s('text', { x: 0, y: R.rows[r] + 12, class: 't-fg t-bold' }, layer, a);
      s('text', { x: 0, y: R.rows[r] + 27, class: 't-sm' }, layer, b);
    });
    for (let c = 0; c < 8; c++) {
      const b = 7 - c, was = (L.before >> b) & 1, now = (aft >> b) & 1;
      [[R.rows[0], was], [R.rows[2], now]].forEach(([y, v]) => {
        s('rect', { x: cx(c), y, width: R.cw, height: R.h, rx: 3, class: v ? 'f-pri' : 'f-seg' }, layer);
        s('text', { x: mid(c), y: y + R.h / 2, dy: '0.35em', 'text-anchor': 'middle', class: v ? 't-on t-bold t-lg' : 't-muted t-lg' }, layer, String(v));
      });
      const y = R.rows[1];
      if (L.mode === 'read') {
        s('rect', { x: cx(c), y, width: R.cw, height: R.h, rx: 3, class: 'f-seg', style: 'opacity: 0.5' }, layer);
        s('text', { x: mid(c), y: y + R.h / 2, dy: '0.35em', 'text-anchor': 'middle', class: 't-muted' }, layer, '·');
      } else {
        const w = (L.write >> b) & 1;
        s('rect', { x: cx(c), y, width: R.cw, height: R.h, rx: 3, class: w ? 'f-ter' : 'f-seg' }, layer);
        s('text', { x: mid(c), y: y + R.h / 2, dy: '0.35em', 'text-anchor': 'middle', class: w ? 't-on t-bold t-lg' : 't-muted t-lg' }, layer, String(w));
      }
      if (b === L.target) s('rect', { x: cx(c) - 3, y: R.rows[2] - 3, width: R.cw + 6, height: R.h + 6, rx: 5, class: 'f-none ' + (now ? 'outline-sec' : 's-ok') }, layer);
      else if (was && !now) s('rect', { x: cx(c) - 3, y: R.rows[2] - 3, width: R.cw + 6, height: R.h + 6, rx: 5, class: 'f-none s-bad' }, layer);
    }
    if (L.mode === 'ro') s('line', { x1: cx(0) - 6, x2: cx(7) + R.cw + 6, y1: R.rows[1] + R.h / 2, y2: R.rows[1] + R.h / 2, class: 's-bad', style: 'stroke-width: 2' }, layer);
    [[R.rows[0], hex(L.before)], [R.rows[1], L.mode === 'read' ? '—' : hex(L.write)], [R.rows[2], hex(aft)]].forEach(([y, t]) => s('text', { x: cx(7) + R.cw + 10, y: y + R.h / 2, dy: '0.35em', class: 't-fg t-bold' }, layer, t));
    s('text', { x: R.x0, y: 250, class: L.verdict[1] + ' t-bold t-lg' }, layer, L.verdict[0]);
    T.rows.forEach((tr, i) => tr.classList.toggle('on', i === L.row));
    note.textContent = L.note;
  }, 0);
});
