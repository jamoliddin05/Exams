QV.register('s3-mc31', function (q) {
  const { s, svg, steps } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const X0 = 80, X1 = 736;
  const BIT = 1e3 / 9600;
  const fx = t => X0 + t / (10 * BIT) * (X1 - X0);
  const mx = t => X0 + t / 50 * (X1 - X0);

  // Figure 1: one frame, then the 48 frames of the line
  const W = svg(viz('calc'), 760, 296, { label: 'One 8N1 byte at 9600 baud as ten bit cells, then 48 such bytes on a 0 to 50 ms axis, with 4.2, 40 and 50 ms bracketed', minWidth: 560 });
  const grp = () => s('g', {}, W);
  const bracket = (g, a, b, y, cls, label, where) => {
    const up = where === 'above';
    s('path', { d: `M${a} ${y + (up ? 6 : -5)} V${y} H${b} V${y + (up ? 6 : -5)}`, class: 's-' + cls, style: 'stroke-width: 1.5' }, g);
    const t = where === 'right' ? { x: b + 8, y, dy: '0.35em', 'text-anchor': 'start' } : { x: (a + b) / 2, y: up ? y - 7 : y + 14, 'text-anchor': 'middle' };
    s('text', Object.assign(t, { class: `t-${cls} t-bold` }), g, label);
  };
  const gTen = grp(), gFrame = grp(), gOne = grp(), gEight = grp(), gZoom = grp(), gRow = grp(), gA = grp(), gC = grp(), gB = grp();
  bracket(gTen, X0, X1, 22, 'fg', '10 bits = 10 / 9600 s = 1.04 ms: one byte', 'above');
  ['st', 'b0', 'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'sp'].forEach((t, i) => {
    const frame = i === 0 || i === 9;
    QV.box(gFrame, fx(i * BIT), 30, fx(BIT) - X0, 30, t, { cls: frame ? 'f-ter-soft' : 'f-pri-soft', textCls: (frame ? 't-ter' : 't-pri') + ' t-bold', stroke: 'sep', rx: 2 });
  });
  bracket(gOne, X0, fx(BIT), 70, 'pri', '1 bit = 5000 clocks of 48 MHz = 104.2 µs, so 9600 baud', 'right');
  bracket(gEight, fx(BIT), fx(9 * BIT), 92, 'muted', '8 data bits = 833 µs');
  s('line', { x1: X0, x2: X0, y1: 114, y2: 150, class: 's-muted dash', style: 'stroke-width: 1' }, gZoom);
  s('line', { x1: X1, x2: mx(10 * BIT), y1: 114, y2: 150, class: 's-muted dash', style: 'stroke-width: 1' }, gZoom);
  s('text', { x: 0, y: 163, dy: '0.35em', class: 't-fg t-bold' }, gRow, '48 bytes');
  for (let i = 0; i < 48; i++) s('rect', { x: mx(i * 10 * BIT), y: 150, width: mx(10 * BIT) - X0, height: 26, class: (i ? 'f-pri-soft' : 'f-pri') + ' sep' }, gRow);
  s('line', { x1: X0, x2: X1, y1: 182, y2: 182, class: 'l-axis' }, gRow);
  [0, 10, 20, 30, 40, 50].forEach(t => {
    s('line', { x1: mx(t), x2: mx(t), y1: 182, y2: 187, class: 'l-axis' }, gRow);
    s('text', { x: mx(t), y: 200, 'text-anchor': 'middle' }, gRow, t === 50 ? '50 ms' : String(t));
  });
  bracket(gA, X0, mx(48 * 10 / 115.2), 220, 'muted', '4.2 ms = 48 bytes at 115 200 baud · option A', 'right');
  bracket(gC, X0, mx(40), 242, 'sec', '48 × 8 bits / 9600 = 40 ms · option C');
  bracket(gB, X0, X1, 274, 'ok', '48 × 10 bits / 9600 = 50 ms · option B');

  const ALL = [gTen, gFrame, gOne, gEight, gZoom, gRow, gA, gC, gB];
  const SHOW = [ALL, [gFrame, gOne], [gFrame, gOne, gTen, gEight], [gFrame, gTen, gZoom, gRow, gB]];
  const STEP = [
    ['The whole calculation. BRR gives the bit time, 8N1 gives 10 bits per byte, and 48 bytes at 960 bytes a second take 50 ms.',
      'baud     = 48 000 000 / 5000      = 9600 bits a second\none byte = 10 bits (start + 8 + stop), 9600 / 10 = 960 bytes a second\n48 bytes = 48 / 960 s = 1/20 s     = 50 ms'],
    ['BRR is a count of clocks per bit. 5000 clocks of a 48 MHz clock last 104.2 µs, so the line carries 9600 bits a second.',
      '1 bit = 5000 / 48 000 000 s = 104.2 µs\nbaud  = 48 000 000 / 5000   = 9600'],
    ['8N1 puts a start bit and a stop bit around the 8 data bits, so each byte costs 10 bit times. Counting only the 8 data bits is where option C comes from.',
      '1 byte = 10 bits × 104.2 µs = 1.04 ms\n9600 / 10 = 960 bytes a second'],
    ['The polled _write() waits for each byte in turn, so printf holds the CPU for all 48 of them.',
      '48 bytes × 10 bits = 480 bits\n480 / 9600 s = 1/20 s = 50 ms\n(48 × 8 = 384 bits would give 40 ms: option C)'],
  ];
  const note = role('calc-note'), pre = role('calc-pre');
  steps(viz('calc-steps'), ['All', '1 · baud', '2 · one byte', '3 · 48 bytes'], k => {
    ALL.forEach(g => g.setAttribute('class', SHOW[k].indexOf(g) >= 0 ? '' : 'dim'));
    note.textContent = STEP[k][0];
    pre.textContent = STEP[k][1];
  }, 0);

  // Figure 2: CPU time with the polled and the ring _write()
  const C = svg(viz('cpu'), 760, 214, { label: 'CPU time for one 48-byte printf: lesson 04 polled _write keeps the CPU for 50 ms, lesson 08 ring _write returns at once and takes one short interrupt per byte', minWidth: 560 });
  const L = 170, R = 736, tm = t => L + t / 55 * (R - L);
  const BYTE = 10 * BIT;
  [['TX pin', 'the same in both', 24], ['lesson 04', 'polled _write()', 82], ['lesson 08', 'ring _write()', 142]].forEach(([a, b, y]) => {
    s('text', { x: 0, y: y + 11, class: 't-fg t-bold' }, C, a);
    s('text', { x: 0, y: y + 25, class: 't-sm' }, C, b);
  });
  s('text', { x: L, y: 15, class: 't-muted' }, C, '48 bytes leave the pin at 9600 baud, one per 1.04 ms');
  for (let i = 0; i < 48; i++) s('rect', { x: tm(i * BYTE), y: 24, width: tm(BYTE) - L, height: 24, class: 'f-seg box' }, C);
  s('rect', { x: L, y: 82, width: tm(50) - L, height: 28, class: 'f-pri' }, C);
  s('text', { x: tm(25), y: 96, dy: '0.35em', 'text-anchor': 'middle', class: 't-on t-bold' }, C, 'inside printf: wait for TXE, write TDR, 48 times');
  s('rect', { x: tm(50), y: 82, width: R - tm(50), height: 28, class: 'f-ter-soft' }, C);
  s('line', { x1: tm(50), x2: tm(50), y1: 62, y2: 114, class: 's-ok', style: 'stroke-width: 2' }, C);
  s('text', { x: tm(50) - 6, y: 72, 'text-anchor': 'end', class: 't-ok t-bold' }, C, 'printf returns after 50 ms');
  s('rect', { x: L, y: 142, width: tm(0.6) - L, height: 28, class: 'f-pri' }, C);
  s('rect', { x: tm(0.6), y: 142, width: R - tm(0.6), height: 28, class: 'f-ter-soft' }, C);
  s('text', { x: tm(27.5), y: 150, dy: '0.35em', 'text-anchor': 'middle', class: 't-ter t-bold t-sm' }, C, 'CPU free for other tasks');
  for (let i = 0; i < 48; i++) s('rect', { x: tm(i * BYTE) + 1, y: 158, width: 2, height: 12, class: 'f-sec' }, C);
  s('line', { x1: tm(0.6), x2: tm(0.6), y1: 122, y2: 174, class: 's-ok', style: 'stroke-width: 2' }, C);
  s('text', { x: tm(0.6) + 6, y: 132, class: 't-ok t-bold' }, C, 'printf returns once the 48 bytes are in the ring');
  s('line', { x1: L, x2: R, y1: 182, y2: 182, class: 'l-axis' }, C);
  [0, 10, 20, 30, 40, 50].forEach(t => {
    s('line', { x1: tm(t), x2: tm(t), y1: 182, y2: 187, class: 'l-axis' }, C);
    s('text', { x: tm(t), y: 202, 'text-anchor': 'middle' }, C, t === 50 ? '50 ms' : String(t));
  });
});

QV.register('s3-mc32', function (q) {
  const { s, svg, steps, box } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const SENT = '$TEL,5000,4,500,0,0*75', RECV = '$TEL,5000,4,600,0,0*75', BAD = 12, END = 18;
  const hex = v => v.toString(16).toUpperCase().padStart(2, '0');
  const bin = v => { const b = v.toString(2).padStart(8, '0'); return b.slice(0, 4) + ' ' + b.slice(4); };
  const running = f => { let acc = 0; return [...f].map((ch, i) => (i >= 1 && i <= END ? (acc ^= ch.charCodeAt(0)) : null)); };
  const RS = running(SENT), RR = running(RECV);

  // Figure 1: the frame, its hex bytes and the running XOR, as sent and as received
  const X0 = 74, P = 31, CW = 29;
  const x = i => X0 + i * P;
  const F = svg(viz('frame'), 770, 132, { label: 'The frame $TEL,5000,4,600,0,0*75 byte by byte with the running XOR of its body as sent, ending at 75, and as received, ending at 76', minWidth: 560 });
  [['frame', 20], ['hex', 48], ['sent', 74], ['received', 106]].forEach(([t, y]) => s('text', { x: 0, y, dy: '0.35em', class: 't-fg t-bold' }, F, t));
  const layer = s('g', {}, F);

  const STEPS = [
    { label: '1 · as sent', note: 'The frame as the board built it. The XOR of the 18 body bytes, run from left to right, ends at 75, the checksum the frame carries.' },
    { label: '2 · as received', note: 'In transit 5 became 6. Only that byte changed, and 35 ^ 36 = 03 flips bits 0 and 1. From that byte on, every running value differs from the sent one by 03, so the received body gives 76.' },
    { label: '3 · the check', note: 'host.py recomputes the XOR of the body it received, 76, and compares it with the 75 the line carries. They differ, so the line is counted bad and none of it is used.' },
  ];
  const note = role('frame-note'), calc = role('frame-calc');
  steps(viz('frame-steps'), STEPS.map(t => t.label), k => {
    layer.textContent = '';
    const f = k === 0 ? SENT : RECV;
    [...f].forEach((ch, i) => {
      const body = i >= 1 && i <= END, cs = i > END + 1;
      box(layer, x(i), 6, CW, 28, ch, { cls: body ? 'f-pri-soft' : cs ? 'f-ter-soft' : 'f-seg', textCls: (body ? 't-pri' : cs ? 't-ter' : 't-muted') + ' t-bold t-lg', stroke: 'sep', rx: 3 });
      s('text', { x: x(i) + CW / 2, y: 48, dy: '0.35em', 'text-anchor': 'middle', class: i === BAD && k > 0 ? 't-sec t-bold' : 't-sm' }, layer, hex(ch.charCodeAt(0)));
      if (i === BAD && k > 0) s('rect', { x: x(i) - 2, y: 4, width: CW + 4, height: 54, rx: 4, class: 'f-none outline-sec' }, layer);
    });
    const row = (vals, y, bad, dim) => {
      const g = s('g', { class: dim ? 'dim' : null }, layer);
      vals.forEach((v, i) => {
        if (v == null) return;
        const last = i === END, diff = bad && i >= BAD;
        box(g, x(i), y, CW, 24, hex(v), { cls: last ? (bad ? 'f-bad' : 'f-ok') : diff ? 'f-bad-soft' : 'f-seg', textCls: last ? 't-on t-bold' : diff ? 't-bad t-bold' : 't-fg', stroke: 'sep', rx: 3 });
      });
      return g;
    };
    const gs = row(RS, 62, false, k === 1);
    if (k > 0) row(RR, 94, true, false);
    const vx = x(END + 1), vw = x(END + 3) - x(END + 1) + CW - P + 2;
    if (k !== 1) s('text', { x: vx + vw / 2, y: 74, dy: '0.35em', 'text-anchor': 'middle', class: 't-ok t-bold' }, gs, '= 75');
    if (k === 2) s('text', { x: vx + vw / 2, y: 106, dy: '0.35em', 'text-anchor': 'middle', class: 't-bad t-bold' }, layer, '76 ≠ 75');
    note.textContent = STEPS[k].note;
    if (k === 0) {
      const ops = [];
      [...SENT.slice(2, END + 1)].forEach((ch, j) => ops.push(`^ ${hex(ch.charCodeAt(0))} = ${hex(RS[j + 2])}`));
      const lines = [`54 ${ops.slice(0, 5).join(' ')}`];
      for (let j = 5; j < ops.length; j += 5) lines.push('   ' + ops.slice(j, j + 5).join(' '));
      lines[lines.length - 1] += '   = 75 carried: match';
      calc.textContent = lines.join('\n');
    } else if (k === 1) {
      calc.textContent = [`'5' 0x35 = ${bin(0x35)}`, `'6' 0x36 = ${bin(0x36)}`, ` 35 ^ 36 = ${bin(0x35 ^ 0x36)} = 03   one byte, two bits`, '', 'every running value from there on: sent ^ 03'].join('\n');
    } else {
      calc.textContent = ['received body: 75 ^ 03 = 76', 'carried:       75', '76 ≠ 75, so the check fails: bad += 1'].join('\n');
    }
  }, 2);

  // Figure 2: host.py's counters fed line by line
  const C = svg(viz('count'), 760, 236, { label: 'Ten telemetry lines fed to host.py: seq 4 fails its checksum, the good frames jump from seq 3 to 5, and the counters end at good 9, bad 1, lost 1', minWidth: 560 });
  const LX = 92, LP = 66, LW = 60;
  const lx = i => LX + i * LP;
  [['lines', 'in order', 30], ['good seq', '', 104], ['counters', '', 160]].forEach(([a, b, y]) => {
    s('text', { x: 0, y: y + 12, class: 't-fg t-bold' }, C, a);
    if (b) s('text', { x: 0, y: y + 26, class: 't-sm' }, C, b);
  });
  const cl = s('g', {}, C);
  const CSTEP = [
    { label: 'seq 0–3', upto: 3, note: 'Lines seq 0 to 3 pass the checksum. Each is counted good, and each seq is one more than the last, so nothing is lost.' },
    { label: 'seq 4', upto: 4, note: 'Line seq 4 fails the checksum, 76 ≠ 75. It is counted bad and thrown away whole, so its seq 4 never reaches the gap check.' },
    { label: 'seq 5', upto: 5, note: 'The next good frame carries seq 5, but the last good one carried 3. host.py adds 5 − 3 − 1 = 1 to lost.' },
    { label: 'All ten', upto: 9, note: 'All ten lines: good 9, bad 1, lost 1. The damaged line counts twice, once as bad and once as a gap. Option B forgets the gap, option C the bad line.' },
  ];
  const cnote = role('count-note');
  steps(viz('count-steps'), CSTEP.map(t => t.label), k => {
    cl.textContent = '';
    const upto = CSTEP[k].upto;
    let good = 0, bad = 0, lost = 0, last = null;
    for (let i = 0; i < 10; i++) {
      const done = i <= upto, isBad = i === 4;
      const g = s('g', { class: done ? null : 'dim' }, cl);
      box(g, lx(i), 30, LW, 46, `seq ${i}\n${isBad ? 'bad' : 'good'}`, { cls: isBad ? 'f-bad-soft' : 'f-ok-soft', textCls: (isBad ? 't-bad' : 't-ok') + ' t-bold', lh: 16, rx: 4 });
      if (!done) continue;
      if (isBad) { bad++; continue; }
      good++;
      const gap = last !== null && i !== last + 1;
      if (gap) lost += i - last - 1;
      s('circle', { cx: lx(i) + LW / 2, cy: 120, r: 15, class: 'f-ok' }, cl);
      s('text', { x: lx(i) + LW / 2, y: 120, dy: '0.35em', 'text-anchor': 'middle', class: 't-on t-bold t-lg' }, cl, String(i));
      if (last !== null) {
        const a = lx(last) + LW / 2 + 17, b = lx(i) + LW / 2 - 17;
        QV.arrow(cl, a, 120, b, 120, { cls: gap ? 'a-bad' : 'a-muted', width: gap ? 2 : 1.2, head: gap ? 9 : 6 });
        if (gap) s('text', { x: (a + b) / 2, y: 148, 'text-anchor': 'middle', class: 't-ter t-bold' }, cl, `gap: ${i} − ${last} − 1 = ${i - last - 1}`);
      }
      last = i;
    }
    if (upto >= 4) s('text', { x: lx(4) + LW / 2, y: 120, dy: '0.35em', 'text-anchor': 'middle', class: 't-bad t-bold' }, cl, '—');
    [['good', good, 'f-ok-soft', 't-ok'], ['bad', bad, 'f-bad-soft', 't-bad'], ['lost', lost, 'f-ter-soft', 't-ter']].forEach(([n, v, f, t], j) => {
      box(cl, LX + j * 150, 162, 130, 34, `${n} ${v}`, { cls: f, textCls: `${t} t-bold t-lg`, rx: 4 });
    });
    s('text', { x: LX, y: 222, class: 't-fg t-bold' }, cl, `frames good ${good}, bad ${bad}, lost (sequence gaps) ${lost}`);
    cnote.textContent = CSTEP[k].note;
  }, 3);
});

QV.register('s3-mc33', function (q) {
  const { s, svg, steps, box, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const X0 = 170, X1 = 744, U = (X1 - X0) / 100;
  const ux = u => X0 + u * U;
  const LANE = { thread: 26, handler: 70, eie: [114, 134], txe: [156, 176], pin: 196 };

  // Figure 1: who has the CPU, TXEIE, TXE and the pin, for the lesson's handler and for the question's
  const W = svg(viz('storm'), 760, 252, { label: 'Timeline after reset: thread, USART2 handler, TXEIE, TXE and the TX pin, with the else branch and without it', minWidth: 560 });
  [['thread', 'main, tasks, printf', LANE.thread], ['USART2 handler', 'NVIC priority 1', LANE.handler], ['TXEIE', 'CR1 bit 7', LANE.eie[0]], ['TXE', 'ISR bit 7', LANE.txe[0]], ['TX pin', '115 200 baud', LANE.pin]].forEach(([a, b, y]) => {
    s('text', { x: 0, y: y + 9, class: 't-fg t-bold' }, W, a);
    s('text', { x: 0, y: y + 23, class: 't-sm' }, W, b);
  });
  [LANE.eie, LANE.txe].forEach(([hi, lo]) => {
    s('text', { x: X0 - 8, y: hi, dy: '0.35em', 'text-anchor': 'end', class: 't-sm' }, W, '1');
    s('text', { x: X0 - 8, y: lo, dy: '0.35em', 'text-anchor': 'end', class: 't-sm' }, W, '0');
  });
  const layer = s('g', {}, W);
  const trace = (g, [hi, lo], edges) => {
    let d = `M${X0} ${edges[0][1] ? hi : lo}`;
    edges.slice(1).forEach(([u, v]) => { d += ` H${ux(u).toFixed(1)} V${v ? hi : lo}`; });
    s('path', { d: d + ` H${X1}`, class: 's-fg', style: 'stroke-width: 2' }, g);
  };

  const CASES = [
    {
      label: 'With the else',
      thread: [[0, 6], [7.5, 30], [31.5, 40], [41, 50], [51, 100]],
      handler: [[6, 7], [7, 7.5], [30, 30.6], [30.6, 31.5], [40, 41], [50, 51]],
      eie: [[0, 0], [6, 1], [7.5, 0], [30, 1], [51, 0]],
      txe: [[0, 1], [6, 0], [6.6, 1], [30, 0], [30.4, 1], [31, 0], [40.3, 1], [40.6, 0], [50.2, 1]],
      pin: [[6.6, '1st'], [30.4, '2nd'], [40.3, '3rd'], [50.2, '4th']],
      events: [[6, '_write() #1'], [30, '_write() #2']],
      marks: [[7.5, 'ring empty: TXEIE off'], [51, 'ring empty: TXEIE off']],
      note: 'The lesson\'s handler. When the ring is empty it turns TXEIE off, so the interrupt stops and the thread runs again. The next _write() turns TXEIE back on, and the handler then runs once per byte time while there is work.',
    },
    {
      label: 'else deleted',
      thread: [[0, 6]],
      handler: [[6, 7]],
      storm: 7,
      eie: [[0, 0], [6, 1]],
      txe: [[0, 1], [6, 0], [6.6, 1]],
      pin: [[6.6, '1st']],
      events: [[6, '_write() #1']],
      marks: [[8, 'ring empty, return, enter again: TXE and TXEIE both stay 1']],
      note: 'The question\'s handler. It sends the first character, finds the ring empty and returns with TXEIE still on. TXE is 1 because the transmit register is empty, so the interrupt is pending again at once, forever. The thread never runs again, so nothing more reaches the ring. The banner starts with a line break, so the one character that left shows nothing.',
    },
  ];
  const note = role('storm-note');
  steps(viz('storm-steps'), CASES.map(c => c.label), k => {
    layer.textContent = '';
    const c = CASES[k];
    c.thread.forEach(([a, b]) => s('rect', { x: ux(a), y: LANE.thread, width: ux(b) - ux(a), height: 26, class: 'f-pri-soft' }, layer));
    if (c.storm) {
      s('rect', { x: ux(c.storm), y: LANE.thread, width: X1 - ux(c.storm), height: 26, class: 'f-seg' }, layer);
      s('text', { x: (ux(c.storm) + X1) / 2, y: LANE.thread + 13, dy: '0.35em', 'text-anchor': 'middle', class: 't-bad t-bold' }, layer, 'never runs again: the rest of the banner never reaches the ring');
      for (let u = c.storm; u < 99.5; u += 1.25) s('rect', { x: ux(u), y: LANE.handler, width: U * 0.95, height: 26, class: 'f-sec' }, layer);
    }
    c.handler.forEach(([a, b]) => s('rect', { x: ux(a), y: LANE.handler, width: Math.max(ux(b) - ux(a) - 1, 3), height: 26, class: 'f-sec' }, layer));
    c.events.forEach(([u, t]) => {
      s('line', { x1: ux(u), x2: ux(u), y1: LANE.thread - 4, y2: LANE.eie[1], class: 's-muted dash', style: 'stroke-width: 1' }, layer);
      s('text', { x: ux(u), y: LANE.thread - 8, 'text-anchor': 'middle', class: 't-pri t-bold' }, layer, t);
    });
    c.marks.forEach(([u, t]) => s('text', { x: ux(u) + 4, y: LANE.handler + 36, class: (k ? 't-bad' : 't-ok') + ' t-bold t-sm' }, layer, t));
    trace(layer, LANE.eie, c.eie);
    trace(layer, LANE.txe, c.txe);
    s('line', { x1: X0, x2: X1, y1: LANE.pin + 12, y2: LANE.pin + 12, class: 'l-axis' }, layer);
    c.pin.forEach(([u, t]) => box(layer, ux(u), LANE.pin, 10 * U - 2, 24, t, { cls: 'f-seg', textCls: 't-fg t-bold', rx: 3 }));
    const p0 = ux(c.pin[0][0]);
    s('path', { d: `M${p0} 225 V230 H${p0 + 10 * U - 2} V225`, class: 's-muted', style: 'stroke-width: 1.5' }, layer);
    s('text', { x: p0 + 10 * U + 6, y: 230, dy: '0.35em', class: 't-sm' }, layer, 'one byte time, 86.8 µs');
    note.textContent = c.note;
  }, 1);

  // Figure 2: the loop and the priority ladder
  const P = svg(viz('loop'), 760, 236, { label: 'Left: TXE and TXEIE both 1 keep USART2 pending; the handler finds the ring empty, returns and is entered again. Right: priority 1 above the kernel and all thread code', minWidth: 560 });
  box(P, 10, 18, 190, 42, 'TXE = 1\nonly a TDR write clears it', { cls: 'f-surface', textCls: 't-fg' });
  box(P, 220, 18, 200, 42, 'TXEIE = 1\nonly the deleted else cleared it', { cls: 'f-surface', textCls: 't-fg' });
  box(P, 110, 96, 210, 34, 'USART2 pending, priority 1', { cls: 'f-sec-soft', textCls: 't-sec t-bold' });
  box(P, 110, 166, 210, 42, 'handler: ring empty\nnothing to send, returns', { cls: 'f-sec', textCls: 't-on t-bold' });
  arrow(P, 105, 60, 175, 95, { cls: 'a-muted' });
  arrow(P, 320, 60, 255, 95, { cls: 'a-muted' });
  arrow(P, 215, 130, 215, 165, { cls: 'a-sec', width: 2, label: 'entered', dx: 30, dy: 4 });
  s('path', { d: 'M320 187 H372 V113 H330', class: 's-bad', style: 'stroke-width: 2' }, P);
  arrow(P, 340, 113, 322, 113, { cls: 'a-bad', width: 2 });
  s('text', { x: 380, y: 140, class: 't-bad t-bold' }, P, 'returns, and');
  s('text', { x: 380, y: 156, class: 't-bad t-bold' }, P, 'both bits are');
  s('text', { x: 380, y: 172, class: 't-bad t-bold' }, P, 'still 1');
  s('text', { x: 10, y: 228, class: 't-muted' }, P, 'The fix, deleted here: USART2->CR1 &= ~TXEIE when the ring is empty.');

  const LXP = 486, RW = 270;
  s('text', { x: LXP, y: 12, class: 't-fg t-bold' }, P, 'NVIC: 0 = most urgent');
  [
    ['0', 'nothing here', 'f-seg', 't-muted'],
    ['1', 'USART2 handler: always running', 'f-sec', 't-on t-bold'],
    ['3', 'SysTick, PendSV: starved', 'f-seg', 't-muted'],
    ['thread', 'tasks, printf, _write(): starved', 'f-seg', 't-muted'],
  ].forEach(([pr, t, f, tc], i) => {
    const y = 24 + i * 44;
    s('text', { x: LXP + 22, y: y + 18, dy: '0.35em', 'text-anchor': 'middle', class: 't-fg t-bold' }, P, pr);
    box(P, LXP + 48, y, RW - 48, 36, t, { cls: f, textCls: tc, rx: 4 });
  });
});
