QV.register('topic8', function (q) {
  const { s, svg, table, steps, arrow, box, line } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const T = (g, x, y, text, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || null, class: cls || null }, g, text);
  const R = (g, x, y, w, h, cls, rx) => s('rect', { x, y, width: w, height: h, rx: rx == null ? 4 : rx, class: cls }, g);
  const L = t => ({ text: t, cls: 'l' });
  const rows = r => r.map(row => row.map(L));
  const hex2 = v => v.toString(16).toUpperCase().padStart(2, '0');
  const bin8 = v => v.toString(2).padStart(8, '0');
  const nib = v => bin8(v).slice(0, 4) + ' ' + bin8(v).slice(4);
  const show = c => (c === '\r' ? '\\r' : c === '\n' ? '\\n' : c);
  const xor = str => [...str].reduce((a, c) => a ^ c.charCodeAt(0), 0);
  const bitsOf = v => [0, 1, 2, 3, 4, 5, 6, 7].map(i => (v >> i) & 1);

  // Tables
  table(viz('model'), ['Model slot', 'USART2', 'Bits and values'].map(L), rows([
    ['clock gate', 'RCC->APBENR1 USART2EN', 'bit 17'],
    ['pins', 'PA2 TX, PA3 RX, alternate function 1', 'AFR[0] = 0x00001100'],
    ['control', 'CR1: UE, RE, TE, RXNEIE, TXEIE', 'bits 0, 2, 3, 5, 7'],
    ['status', 'ISR: ORE (overrun), RXNE (a byte arrived), TXE (room to send)', 'bits 3, 5, 7'],
    ['clear', 'ICR: write 1 to ORECF', 'bit 3'],
    ['data', 'RDR in, TDR out', '8 of 9 bits used'],
    ['event', 'USART2_IRQn = 28, one vector for everything', 'vector 44 at 0x080000B0'],
    ['rate', 'BRR = 48 000 000 / 115 200 = 416.67 → 417', '0x1A1'],
  ]));

  const regs = [
    ['0x00', 'CR1', 'control: enable, directions, interrupt enables, frame format', 'UE, RE, TE, RXNEIE; TXEIE on and off'],
    ['0x0C', 'BRR', 'baud rate: clocks per bit', '417'],
    ['0x1C', 'ISR', 'status flags, read only', 'RXNE, TXE, ORE'],
    ['0x20', 'ICR', 'write 1 to clear a flag of ISR', 'ORECF'],
    ['0x24', 'RDR', 'the received byte; reading clears RXNE', 'read in the ISR'],
    ['0x28', 'TDR', 'the byte to send; writing clears TXE', 'written in the ISR'],
    ['0x04, 0x08, 0x2C', 'CR2, CR3, PRESC', 'stop bits; DMA and flow control; clock prescaler', 'reset values: 1 stop bit, ÷1'],
    ['0x10, 0x14, 0x18', 'GTPR, RTOR, RQR', 'smartcard and IrDA; receiver timeout; requests', 'never touched'],
  ];
  table(viz('regs'), ['Offset', 'Register', 'Its job', 'USART2 here'].map(L),
    regs.map((r, i) => r.map((c, j) => ({ text: c, cls: j === 1 && i < 6 ? 'l hl' : 'l' }))));

  const clr = table(viz('clear'), ['Flag', 'How it clears', 'Lesson', 'The line'].map(L), rows([
    ['EXTI FPR1 (and RPR1)', 'write 1 to it', '05', 'EXTI->FPR1 = 1u << n;'],
    ['TIM UIF', 'write 0 to it', '06', 'TIM3->SR = ~TIM_SR_UIF;'],
    ['TIM CC1IF', 'read CCR1', '06', 't = TIM14->CCR1;'],
    ['USART RXNE / TXE', 'read RDR / write TDR', '08', 'c = USART2->RDR;  USART2->TDR = b;'],
    ['USART ORE', 'write 1 to a different register, ICR', '08', 'USART2->ICR = USART_ICR_ORECF;'],
  ]));
  clr.rows[3].classList.add('on');
  clr.rows[4].classList.add('on');

  table(viz('lines'), ['Line starts with', 'It is', 'Example', 'Reply'].map(L), rows([
    ['anything else', 'a shell command from a person', 'led 170', 'bar = 0xAA'],
    ['$', 'a frame from a program', '$LED,85*6C', '$ACK,LED,85*09'],
  ]));

  table(viz('keys'), ['Key', 'Bytes', 'Board does'].map(L), rows([
    ['Up / Down', 'ESC [ A / ESC [ B', 'halve / double the telemetry period'],
    ['Right / Left', 'ESC [ C / ESC [ D', 'move the lit LED along the bar'],
    ['Esc', 'ESC alone', 'cancel the half-typed line'],
    ['F1, Home, Delete', 'ESC O P, ESC [ H, ESC [ 3 ~', 'spell the bytes out'],
  ]));

  table(viz('host'), ['Command', 'Does'].map(L), rows([
    ['host.py --selftest', 'checks the checksum against the GPS sentence'],
    ['host.py --frame "LED,170"', 'prints $LED,170*57, to paste into Wokwi'],
    ['host.py --file capture.txt', 'checks and charts a saved log'],
    ['host.py --port rfc2217://localhost:4000', 'live, through the Wokwi VS Code extension'],
    ['host.py --port COM5 --send "RATE,100"', 'live, on a real Nucleo'],
    ['host.py --demo', 'no board at all: fake telemetry, with a damaged and a lost line'],
  ]));

  table(viz('check'), ['Forgot', 'Symptom', 'Why this symptom follows'].map(L), rows([
    ['USART2EN in APBENR1', 'nothing sent, nothing received',
      'The clock gate is off at reset. An unclocked USART ignores the writes to BRR and CR1, so UE, TE and RE stay 0. No fault and no warning: printf fills the ring and nothing ever drains it.'],
    ['AF1 on PA2/PA3', 'UART works internally; the pins carry nothing',
      'Without MODER = 10 and AFR = 1, PA2 and PA3 are not connected to the USART. It still shifts bytes out, TXE still rises and the ISR still drains the ring, so the software sees nothing wrong.'],
    ['BRR for the wrong clock', 'garbage characters, the most recognisable UART fault',
      'BRR counts clocks per bit. On the wrong clock every bit is too long or too short (4 times at 12 MHz instead of 48 MHz), and the receiver samples the wrong bits (Figure 3). Bytes still arrive, so you see garbage instead of silence.'],
    ['clearing ORE', 'reception stops after the first overrun',
      'Reading RDR does not clear ORE. Only writing 1 to ORECF in ICR does. While ORE stays set, the bytes that arrive are lost, and with RXNEIE on it keeps requesting the interrupt.'],
    ['turning TXEIE off when empty', 'interrupt storm; measured: not even the banner',
      'TXE is 1 whenever TDR is empty, which is always when idle. With TXEIE on, the request never drops, and at NVIC priority 1 the handler re-enters as soon as it returns. Nothing below it runs, so nothing refills the ring (Figure 7).'],
    ['blocking in the ISR', 'impossible to do right: the ISR version of put never blocks',
      'An ISR is not a task, so the kernel has nothing to put to sleep. Spinning until the queue has room fails too, because the task that empties it can never run while an interrupt holds the CPU. So os_queue_put_from_isr() drops the byte and counts it.'],
    ['a lock around printing', 'lines interleave; checksums fail on the PC',
      'The protocol task (priority 3) can preempt the telemetry task (priority 2) half-way through a line, and its characters land in the ring between the others (Figure 9). newlib-nano printf is also not re-entrant. host.py sees foreign bytes inside a frame, and the XOR no longer matches.'],
  ]));

  table(viz('contrast'), ['Idea', 'Alternatives', 'This chip', 'What follows'].map(L), rows([
    ['Getting received bytes to software', 'polling, interrupt, DMA', 'an interrupt per byte (RXNEIE) into a kernel queue',
      'polling must come back within 86.8 µs, and one 8 ms printf breaks that. DMA (lesson 10) moves a whole block per interrupt.'],
    ['Passing data between an ISR and tasks', 'a buffer guarded by a lock, or a lock-free buffer with one writer per index', 'RX: kernel queue, locking inside. TX: SPSC ring, no lock',
      'the ring is safe only because head has one writer (tasks) and tail one writer (the ISR), and the data is stored before head moves.'],
    ['Waiting for room in a buffer', 'block, spin, or drop', 'tx_put() waits in os_delay(1); the ISR drops and counts (rx_dropped)',
      'an ISR is not a task and has nothing to put to sleep, so it never blocks.'],
    ['Sharing the serial port between tasks', 'no coordination, masking interrupts, a mutex', 'a mutex in say() around vprintf',
      'each line is atomic. Without it, lines interleave and checksums fail.'],
    ['Flag as an interrupt source', 'an event that fires once, or a level that fires while true', 'TXE is a level: 1 whenever TDR is empty',
      'TXEIE must be on only while the ring has data.'],
    ['Replacing a library default', 'edit the library, or a weak default with a strong override', 'retarget.c weak _write, uart.c strong _write',
      'the linker keeps the strong one, as with vector-table handlers. printf returns once the text is in the ring.'],
    ['Error detection', 'XOR checksum, CRC', 'XOR, the NMEA 0183 checksum, two hex digits',
      'catches any single flipped bit, misses two flips in the same bit position. MAVLink uses a CRC.'],
    ['Message encoding', 'printable text lines, binary packets', 'printable ASCII: $BODY*CS',
      'a person can read and type it, and it survives copy and paste out of Wokwi. A binary protocol could not survive a text box.'],
    ['Clearing a flag', 'one rule for the chip, or a convention per flag', 'five conventions',
      'look up how each flag clears. A wrong guess gives an interrupt that never stops.'],
  ]));

  // Figure 1: low bytes of CR1, ISR, ICR
  const fb = svg(viz('bits'), 760, 262, { label: 'Low byte of CR1 idle and sending, ISR and ICR: enable, flag and clear bits line up at bits 3, 5 and 7', minWidth: 560 });
  const B = { x0: 160, w: 62, h: 38, y0: 36, gap: 14 };
  const bx = b => B.x0 + (7 - b) * B.w;
  for (let b = 7; b >= 0; b--) T(fb, bx(b) + B.w / 2, 20, 'bit ' + b, 't-sm', 'middle');
  const CR1F = ['UE', 'UESM', 'RE', 'TE', 'IDLEIE', 'RXNEIE', 'TCIE', 'TXEIE'];
  [
    { name: 'CR1, idle', sub: 'after uart_init()', f: CR1F, on: [0, 2, 3, 5], val: true, out: '= 0x2D' },
    { name: 'CR1, sending', sub: 'after _write()', f: CR1F, on: [0, 2, 3, 5, 7], val: true, out: '= 0xAD' },
    { name: 'ISR', sub: 'status, read only', f: ['PE', 'FE', 'NE', 'ORE', 'IDLE', 'RXNE', 'TC', 'TXE'], on: [3, 5, 7], out: 'tested' },
    { name: 'ICR', sub: 'write 1 to clear', f: ['PECF', 'FECF', 'NECF', 'ORECF', 'IDLECF', '–', 'TCCF', '–'], on: [3], out: 'write 0x08' },
  ].forEach((r, i) => {
    const y = B.y0 + i * (B.h + B.gap);
    T(fb, 0, y + 11, r.name, 't-fg t-bold');
    T(fb, 0, y + 27, r.sub, 't-sm');
    for (let b = 0; b < 8; b++) {
      const on = r.on.includes(b), tc = on ? 't-on' : 't-muted';
      R(fb, bx(b) + 1, y, B.w - 2, B.h, on ? 'f-pri' : 'f-seg', 3);
      if (r.val) {
        T(fb, bx(b) + B.w / 2, y + 12, r.f[b], tc + ' t-sm', 'middle');
        T(fb, bx(b) + B.w / 2, y + 27, on ? '1' : '0', tc + ' t-bold', 'middle');
      } else {
        T(fb, bx(b) + B.w / 2, y + B.h / 2, r.f[b], tc + (on ? ' t-bold' : ''), 'middle');
      }
    }
    T(fb, B.x0 + 8 * B.w + 12, y + B.h / 2, r.out, 't-pri t-bold');
  });
  [[7, 'transmit'], [5, 'receive'], [3, 'overrun']].forEach(([b, t]) => T(fb, bx(b) + B.w / 2, B.y0 + 4 * (B.h + B.gap) + 2, t, 't-pri t-sm t-bold', 'middle'));

  // Figure 2: one character's frame on the wire
  const fr = svg(viz('frame'), 760, 196, { label: 'UART frame of one character: idle high, start bit low, eight data bits least significant first, stop bit high, 86.8 microseconds', minWidth: 560 });
  const F = { x0: 80, w: 56, hi: 52, lo: 96 };
  const fx = i => F.x0 + i * F.w;
  const usAt = i => (i * 1e6 / 115200).toFixed(1);
  s('line', { x1: fx(0), x2: fx(10), y1: 150, y2: 150, class: 'l-axis' }, fr);
  for (let i = 0; i <= 10; i++) {
    s('line', { x1: fx(i), x2: fx(i), y1: 150, y2: 155, class: 'l-axis' }, fr);
    if (i % 2 === 0) T(fr, fx(i), 166, i === 10 ? usAt(i) + ' µs' : i ? usAt(i) : '0', null, 'middle');
  }
  T(fr, (fx(0) + fx(10)) / 2, 186, 'time at 115 200 baud: 8.68 µs per bit, 86.8 µs per byte', null, 'middle');
  T(fr, 46, 40, 'idle', 't-sm', 'middle');
  T(fr, fx(10) + 46, 40, 'idle', 't-sm', 'middle');
  const fg = s('g', {}, fr);
  const CH = ['$', 'L', 'E', 'D', '*'];
  steps(viz('frame-steps'), CH.map(c => `${c}  0x${hex2(c.charCodeAt(0))}`), k => {
    fg.textContent = '';
    const v = CH[k].charCodeAt(0), lv = [0, ...bitsOf(v), 1];
    lv.forEach((b, i) => {
      const edge = i === 0 || i === 9;
      R(fg, fx(i) + 1, 40, F.w - 2, 68, edge ? 'f-ter-soft' : 'f-pri-soft', 3);
      T(fg, fx(i) + F.w / 2, 24, String(b), (edge ? 't-ter' : 't-pri') + ' t-bold t-lg', 'middle');
      T(fg, fx(i) + F.w / 2, 124, i === 0 ? 'start' : i === 9 ? 'stop' : 'b' + (i - 1), edge ? 't-ter t-bold' : 't-fg', 'middle');
    });
    const pts = [[20, F.hi], [fx(0), F.hi]];
    lv.forEach((b, i) => pts.push([fx(i), b ? F.hi : F.lo], [fx(i + 1), b ? F.hi : F.lo]));
    pts.push([740, F.hi]);
    line(fg, pts, 's-fg').setAttribute('style', 'stroke-width: 2.5');
    role('frame-note').textContent = `${CH[k]} = 0x${hex2(v)} = ${nib(v)}₂. On the wire, b0 first: ${lv.slice(1, 9).join(' ')}. Read the data bits from right to left to get the number back. Start (0) and stop (1) add 2 bits, so every byte costs 10 bit times.`;
  }, 1);

  // Figure 3: receiver sampling against the board's bit time
  const sp = svg(viz('sample'), 760, 242, { label: 'The PC samples the middle of each bit time after the start edge; with BRR for the wrong clock the samples read wrong bits', minWidth: 560 });
  const S = { x0: 80, px: 60, xmax: 726, hi: 40, lo: 78 };
  const sx = t => S.x0 + t * S.px;
  const LB = 0x4C, LBITS = [0, ...bitsOf(LB), 1];
  T(sp, 0, 54, 'board', 't-fg t-bold');
  T(sp, 0, 124, 'PC reads', 't-fg t-bold');
  s('line', { x1: sx(0), x2: sx(10.6), y1: 202, y2: 202, class: 'l-axis' }, sp);
  for (let t = 0; t <= 10; t++) {
    s('line', { x1: sx(t), x2: sx(t), y1: 202, y2: 207, class: 'l-axis' }, sp);
    if (t % 2 === 0) T(sp, sx(t), 217, String(t), null, 'middle');
  }
  T(sp, sx(5.3), 230, 'time in PC bit times (8.68 µs each at 115 200 baud)', null, 'middle');
  const sg = s('g', {}, sp);
  const CASES = [
    { lab: 'BRR 417 at 48 MHz', ts: 115200 / (48e6 / 417), head: 'board at 48 000 000 / 417 = 115 108 baud: its bit is 1.0008 PC bits',
      note: 'Right: 417 clocks of 48 MHz per bit is 115 108 baud, 0.08% slow. By the stop bit the samples have drifted 9.5 × 0.0008 = 0.008 of a bit, far from the half bit that would cause an error. The next start bit resynchronises the receiver, so the error never adds up across bytes. The PC reads 0x4C, L.' },
    { lab: 'BRR 417, clock still 12 MHz', ts: 115200 / (12e6 / 417), head: 'board at 12 000 000 / 417 = 28 777 baud: its bit is 4 PC bits; the frame runs on to 40',
      note: 'The clock stayed at the 12 MHz reset value, so 417 clocks per bit gives 28 777 baud, 4 times too slow. All 10 samples land in the board\'s start bit and b0, which are both 0 for L. The PC reads 0x00 and finds 0 where the stop bit should be: a framing error.' },
    { lab: 'BRR 104 at 48 MHz', ts: 115200 / (48e6 / 104), head: 'board at 48 000 000 / 104 = 461 538 baud: the whole frame lasts 2.5 PC bits',
      note: 'BRR was computed for 12 MHz (104), but the chip runs at 48 MHz: 461 538 baud, 4 times too fast. The whole frame is over after 2.5 of the PC\'s bit times and the line idles high. The PC reads 0xFE, a wrong character with no error flag.' },
  ];
  steps(viz('sample-steps'), CASES.map(c => c.lab), k => {
    sg.textContent = '';
    const { ts, head, note } = CASES[k];
    T(sg, S.x0, 9, head, 't-sm');
    for (let i = 0; i < 10; i++) {
      const a = sx(i * ts), b = Math.min(sx((i + 1) * ts), S.xmax);
      if (a >= S.xmax) break;
      const edge = i === 0 || i === 9;
      R(sg, a, 20, b - a, 68, (edge ? 'f-ter-soft' : 'f-pri-soft') + ' sep', 0);
      if (b - a >= 30) T(sg, (a + b) / 2, 29, i === 0 ? 'start' : i === 9 ? 'stop' : 'b' + (i - 1), edge ? 't-ter t-sm' : 't-pri t-sm', 'middle');
    }
    const pts = [[30, S.hi], [sx(0), S.hi]];
    for (let i = 0; i < 10 && sx(i * ts) < S.xmax; i++) {
      const y = LBITS[i] ? S.hi : S.lo;
      pts.push([sx(i * ts), y], [Math.min(sx((i + 1) * ts), S.xmax), y]);
    }
    if (sx(10 * ts) < S.xmax) pts.push([sx(10 * ts), S.hi], [S.xmax, S.hi]);
    line(sg, pts, 's-fg').setAttribute('style', 'stroke-width: 2.5');
    const got = [];
    for (let j = 0; j < 10; j++) {
      const t = j + 0.5, i = Math.floor(t / ts), v = i < 10 ? LBITS[i] : 1;
      got.push(v);
      s('line', { x1: sx(t), x2: sx(t), y1: v ? S.hi : S.lo, y2: 110, class: 's-muted dash', style: 'stroke-width: 1' }, sg);
      s('circle', { cx: sx(t), cy: v ? S.hi : S.lo, r: 4.5, class: 'f-sec' }, sg);
      R(sg, sx(t) - 16, 112, 32, 24, v === LBITS[j] ? 'f-ok-soft' : 'f-bad-soft', 3);
      T(sg, sx(t), 124, String(v), 't-fg t-bold', 'middle');
      T(sg, sx(t), 148, j === 0 ? 'start' : j === 9 ? 'stop' : 'b' + (j - 1), 't-sm', 'middle');
    }
    const data = got.slice(1, 9).reduce((a, b, j) => a | (b << j), 0);
    const ch = data >= 0x20 && data < 0x7F ? `, ${String.fromCharCode(data)}` : data === 0 ? ', NUL' : ', not ASCII';
    const good = data === LB && got[9] === 1;
    T(sg, S.x0, 176, `PC gets ${nib(data)}₂ = 0x${hex2(data)}${ch} · stop sample ${got[9]}${got[9] ? ', no error flag' : ': framing error'}`, (good ? 't-ok' : 't-bad') + ' t-bold');
    role('sample-note').textContent = note;
  });

  // Figure 4: receive pipeline and its two deadlines
  const rx = svg(viz('rx'), 800, 170, { label: 'Receive path: pin, RDR, interrupt handler, 64-byte queue, blocked task, with the hard and soft deadlines and where bytes are lost', minWidth: 600 });
  const RB = [
    { x: 10, w: 90, t: 'RX pin\nPA3', cls: 'f-seg', tc: 't-fg' },
    { x: 130, w: 100, t: 'RDR\n1 byte', cls: 'f-seg', tc: 't-fg' },
    { x: 260, w: 180, t: 'USART2_IRQHandler\nNVIC priority 1', cls: 'f-pri', tc: 't-on' },
    { x: 470, w: 120, t: 'os_queue\n64 bytes', cls: 'f-pri-soft', tc: 't-pri' },
    { x: 620, w: 170, t: 'task_proto\nblocked: 0% CPU', cls: 'f-surface', tc: 't-fg' },
  ];
  const RY = 40, RH = 52;
  RB.forEach((b, i) => {
    box(rx, b.x, RY, b.w, RH, b.t, { cls: b.cls, textCls: b.tc });
    if (i) arrow(rx, RB[i - 1].x + RB[i - 1].w + 2, RY + RH / 2, b.x - 2, RY + RH / 2, { cls: 'a-muted' });
  });
  T(rx, 180, 20, 'late: ORE, byte lost', 't-bad t-sm', 'middle');
  T(rx, 350, 20, 'put_from_isr, never blocks', 't-sm', 'middle');
  T(rx, 530, 20, 'full: rx_dropped++', 't-bad t-sm', 'middle');
  T(rx, 705, 20, 'os_queue_get() blocks', 't-sm', 'middle');
  [[180, 350, 's-sec', 't-sec', 'hard: read RDR within 86.8 µs', 'a few dozen instructions'],
    [530, 705, 's-pri', 't-pri', 'soft: 64 × 86.8 µs = 5.56 ms', 'the task only has to catch up']].forEach(([a, b, sc, tc, t1, t2]) => {
    s('path', { d: `M${a} 106 V114 H${b} V106`, class: sc, style: 'stroke-width: 1.5' }, rx);
    T(rx, (a + b) / 2, 132, t1, tc + ' t-bold', 'middle');
    T(rx, (a + b) / 2, 150, t2, 't-sm', 'middle');
  });

  // Figure 5: the handler's three checks
  const fl = svg(viz('isr'), 760, 322, { label: 'Flow of USART2_IRQHandler: ORE cleared through ICR, RXNE by reading RDR, TXE by writing TDR or by turning TXEIE off', minWidth: 580 });
  const G = {};
  const grp = n => (G[n] = s('g', { class: 'fade' }, fl));
  const node = (n, x, y, w, h, a, b, cls) => {
    const g = grp(n);
    R(g, x, y, w, h, cls + ' box', 6);
    if (b) {
      T(g, x + w / 2, y + h / 2 - 8, a, 't-fg t-bold', 'middle');
      T(g, x + w / 2, y + h / 2 + 9, b, 't-muted t-sm', 'middle');
    } else T(g, x + w / 2, y + h / 2, a, 't-fg t-bold', 'middle');
  };
  const edge = (n, x1, y1, x2, y2, label, dy) => arrow(grp(n), x1, y1, x2, y2, { cls: 'a-muted', label, labelCls: 't-fg', dy });
  box(fl, 20, 8, 240, 32, 'isr = USART2->ISR', { cls: 'f-surface', textCls: 't-fg t-bold' });
  box(fl, 20, 280, 240, 32, 'return', { cls: 'f-surface', textCls: 't-fg t-bold' });
  [[40, 66], [106, 136], [176, 206], [246, 280]].forEach(([a, b]) => arrow(fl, 140, a, 140, b - 2, { cls: 'a-muted' }));
  node('d1', 20, 66, 240, 40, 'ORE set?', null, 'f-seg');
  node('d2', 20, 136, 240, 40, 'RXNE set?', null, 'f-seg');
  node('d3', 20, 206, 240, 40, 'TXEIE on and TXE set?', null, 'f-seg');
  node('a1', 320, 60, 420, 52, 'USART2->ICR = USART_ICR_ORECF;', 'ORE: write 1 to a different register, ICR', 'f-pri-soft');
  node('a2', 320, 130, 420, 52, 'c = USART2->RDR;  put_from_isr(c);', 'RXNE: reading RDR clears it. Queue full: rx_dropped++', 'f-pri-soft');
  node('d4', 320, 206, 130, 40, 'ring empty?', null, 'f-seg');
  node('a3', 500, 178, 240, 46, 'TDR = ring[tail]; tail++', 'TXE: writing TDR clears it', 'f-pri-soft');
  node('a4', 500, 238, 240, 46, 'CR1 &= ~TXEIE;', 'TXE stays 1: stop asking', 'f-pri-soft');
  edge('e1', 262, 86, 318, 86, 'yes');
  edge('e2', 262, 156, 318, 156, 'yes');
  edge('e3', 262, 226, 318, 226, 'yes');
  edge('e4', 452, 220, 498, 201, 'no', -8);
  edge('e5', 452, 232, 498, 261, 'yes', 16);
  const PATHS = [[], ['d1', 'e1', 'a1'], ['d2', 'e2', 'a2'], ['d3', 'e3', 'd4', 'e4', 'a3'], ['d3', 'e3', 'd4', 'e5', 'a4']];
  const ISRN = [
    'One vector, three causes. The handler reads ISR once, then checks ORE, RXNE and TXE in turn. More than one can be set on the same entry, so it handles every one that is.',
    'A byte arrived before the previous one was read: ORE. Reading RDR does not clear it. Only writing 1 to ORECF in ICR, a different register, does. Left set, it blocks further reception and, with RXNEIE on, keeps requesting the interrupt.',
    'A byte arrived: RXNE. Reading RDR clears it, so the read is also the acknowledgement. The byte goes into the queue with the ISR-safe put, which returns 0 instead of waiting when the queue is full.',
    'TDR is empty and the ring has data. Writing TDR sends the next byte and clears TXE until that byte moves on into the shift register. Then tail advances. Only the ISR writes tail.',
    'TDR is empty and the ring is empty. Nothing is written to TDR, so nothing clears TXE. The ISR turns TXEIE off instead, or the request stays on and the handler runs forever (section 8).',
  ];
  steps(viz('isr-steps'), ['All', 'ORE', 'RXNE', 'TXE, data waiting', 'TXE, ring empty'], k => {
    Object.keys(G).forEach(n => G[n].classList.toggle('dim', k > 0 && !PATHS[k].includes(n)));
    role('isr-note').textContent = ISRN[k];
  });

  // Figure 6: the TX ring, 8 slots for the drawing
  const rg = svg(viz('ring'), 760, 228, { label: 'Lock-free transmit ring with 8 slots: head written by tasks, tail written by the ISR', minWidth: 580 });
  const RG = { x0: 130, w: 62, y: 74, h: 54 };
  const rsx = i => RG.x0 + i * RG.w;
  T(rg, RG.x0 - 12, RG.y + RG.h / 2, 'tx_ring', 't-fg t-bold', 'end');
  T(rg, rsx(8) + 12, RG.y + RG.h / 2 - 8, 'slot 7 + 1', 't-sm');
  T(rg, rsx(8) + 12, RG.y + RG.h / 2 + 8, 'wraps to 0', 't-sm');
  const rgg = s('g', {}, rg);
  const free = () => Array(8).fill(['', 'free']);
  const lv = str => [...str].map(c => [c, 'live']);
  const old = str => [...str].map(c => [c, 'old']);
  const RING = [
    { lab: 'Wrapped', head: 2, tail: 6, on: true, slots: [...lv('\r\n'), ...old('hi\r\n'), ...lv('OK')],
      note: 'A ring in use. Four bytes wait, O K \\r \\n, and they wrap from slot 7 to slot 0. The ISR sends from tail, tasks add at head. Bytes waiting = (head − tail) mod 8 = (2 − 6) mod 8 = 4.' },
    { lab: '1 · Empty', head: 0, tail: 0, on: false, slots: free(),
      note: 'Start: head = tail = 0. head == tail means empty, so the ISR has nothing to send and TXEIE is off.' },
    { lab: '2 · Store', head: 0, tail: 0, on: false, mark: [0, 'pri'], slots: [['h', 'new'], ...free().slice(1)],
      note: 'tx_put(\'h\'), step 1, the data: tx_ring[0] = \'h\'. head is still 0, so the ISR still sees head == tail and cannot send the slot early.' },
    { lab: '3 · Publish', head: 1, tail: 0, on: false, mark: [0, 'pri'], slots: [...lv('h'), ...free().slice(1)],
      note: 'Step 2, publish: head = 1. Only now does the byte exist for the ISR. If head had moved first, the ISR could have sent slot 0 before \'h\' was in it.' },
    { lab: '4 · Line queued', head: 4, tail: 0, on: true, slots: [...lv('hi\r\n'), ...free().slice(4)],
      note: '_write("hi\\n") puts \\r before \\n, so 4 bytes go in and head = 4. Then _write() sets TXEIE inside a two-instruction critical section.' },
    { lab: '5 · ISR sends', head: 4, tail: 1, on: true, mark: [0, 'sec'], slots: [...old('h'), ...lv('i\r\n'), ...free().slice(4)],
      note: 'TXE interrupt: the ISR copies tx_ring[0] to TDR, which clears TXE, then sets tail = 1. It reads head and writes only tail.' },
    { lab: '6 · Full', head: 0, tail: 1, on: true, mark: [7, 'pri'], slots: [...old('h'), ...lv('i\r\nok\r\n')],
      note: 'Tasks printed "ok\\n" before the ISR got further. head wrapped: (7 + 1) mod 8 = 0. Now next = (0 + 1) mod 8 = 1 = tail, so the ring is full with 7 bytes in 8 slots. The next tx_put() waits in os_delay(1) for the ISR to drain it.' },
    { lab: '7 · Drained', head: 0, tail: 0, on: false, slots: old('hi\r\nok\r\n'),
      note: 'The ISR sent all 7 bytes and tail caught up: tail = 0 = head, empty again. On its next TXE interrupt it finds the ring empty and turns TXEIE off.' },
  ];
  const SLOT = { live: ['f-pri-soft', 't-pri t-bold'], new: ['f-ter-soft', 't-ter t-bold'], old: ['f-seg', 't-muted'], free: ['f-seg', 't-muted'] };
  steps(viz('ring-steps'), RING.map(r => r.lab), k => {
    rgg.textContent = '';
    const st = RING[k];
    st.slots.forEach(([c, kind], i) => {
      R(rgg, rsx(i) + 2, RG.y, RG.w - 4, RG.h, SLOT[kind][0] + ' box', 4);
      T(rgg, rsx(i) + 8, RG.y + 10, String(i), 't-sm');
      if (c) T(rgg, rsx(i) + RG.w / 2, RG.y + RG.h / 2 + 4, show(c), SLOT[kind][1] + ' t-lg', 'middle');
    });
    if (st.mark) R(rgg, rsx(st.mark[0]) + 2, RG.y, RG.w - 4, RG.h, 'f-none outline-' + st.mark[1], 4);
    const hx = rsx(st.head) + RG.w / 2, tlx = rsx(st.tail) + RG.w / 2;
    arrow(rgg, hx, 30, hx, RG.y - 4, { cls: 'a-pri', width: 2 });
    T(rgg, hx, 18, 'head = ' + st.head, 't-pri t-bold', 'middle');
    arrow(rgg, tlx, RG.y + RG.h + 38, tlx, RG.y + RG.h + 4, { cls: 'a-sec', width: 2 });
    T(rgg, tlx, RG.y + RG.h + 50, 'tail = ' + st.tail, 't-sec t-bold', 'middle');
    const n = (st.head - st.tail + 8) % 8;
    T(rgg, 380, 214, `waiting = (head − tail) mod 8 = (${st.head} − ${st.tail}) mod 8 = ${n} · room for ${7 - n} more · TXEIE ${st.on ? 'on' : 'off'}`, 't-fg', 'middle');
    role('ring-note').textContent = st.note;
  });

  // Figure 7: TXE, TXEIE and the request on a byte-time axis
  const tx = svg(viz('txe'), 760, 290, { label: 'Timeline of TXE, TXEIE, the interrupt request and the handler, with and without turning TXEIE off', minWidth: 580 });
  const X = t => 150 + (t + 0.5) * 84;
  const TMAX = 6.3, D = 0.07;
  const RW = { pin: 26, txe: 72, ie: 116, req: 160, run: 208 };
  [['TX pin', RW.pin + 11], ['TXE', RW.txe + 11], ['TXEIE', RW.ie + 11], ['TXE and TXEIE', RW.req + 11], ['handler runs', RW.run + 11]].forEach(([t, y]) => T(tx, 0, y, t, 't-fg t-bold'));
  s('line', { x1: X(-0.5), x2: X(TMAX), y1: 250, y2: 250, class: 'l-axis' }, tx);
  for (let t = 0; t <= 6; t++) {
    s('line', { x1: X(t), x2: X(t), y1: 250, y2: 255, class: 'l-axis' }, tx);
    T(tx, X(t), 265, String(t), null, 'middle');
    s('line', { x1: X(t), x2: X(t), y1: 22, y2: 250, class: 'l-grid' }, tx);
  }
  T(tx, X(2.9), 282, 'time in byte times (86.8 µs each at 115 200 baud)', null, 'middle');
  T(tx, X(0), 10, '_write(): 3 bytes in the ring, TXEIE on', 't-sm');
  [['h', 0], ['i', 1], ['\n', 2]].forEach(([c, t]) => {
    R(tx, X(t) + 1, RW.pin, 82, 22, 'f-pri-soft', 3);
    T(tx, X(t) + 42, RW.pin + 11, show(c), 't-pri t-bold', 'middle');
  });
  T(tx, X(4.5), RW.pin + 11, 'idle', 't-muted', 'middle');
  const level = (g, segs, y, cls) => {
    const pts = [];
    segs.forEach(([a, b, v]) => { const yy = v ? y : y + 22; pts.push([X(a), yy], [X(b), yy]); });
    line(g, pts, cls).setAttribute('style', 'stroke-width: 2');
  };
  level(tx, [[-0.5, D, 1], [D, 1, 0], [1, 1 + D, 1], [1 + D, 2, 0], [2, TMAX, 1]], RW.txe, 's-fg');
  const tg = s('g', {}, tx);
  const TXN = [
    'With the else line, the handler runs 4 times. Twice at time 0: h goes straight on into the shift register, so TDR is empty again at once and takes i. Once at time 1, when i moves on and TDR takes \\n. Once at time 2, when the ring is empty and it turns TXEIE off. TXE then stays 1, but the request stays 0.',
    'Without it, at time 2 the ring is empty and TXEIE stays on. TXE is 1 and stays 1 because nothing writes TDR, so the request never drops. The handler returns and is entered again at once, forever, at NVIC priority 1. Main, the tasks and the kernel at priority 3 never run again, so nothing can refill the ring. Measured: not even the banner.',
  ];
  steps(viz('txe-steps'), ['With the else line', 'Without it'], k => {
    tg.textContent = '';
    const storm = k === 1;
    level(tg, storm ? [[-0.5, 0, 0], [0, TMAX, 1]] : [[-0.5, 0, 0], [0, 2 + D, 1], [2 + D, TMAX, 0]], RW.ie, 's-pri');
    const req = [[-0.5, 0, 0], [0, D, 1], [D, 1, 0], [1, 1 + D, 1], [1 + D, 2, 0]];
    level(tg, req.concat(storm ? [[2, TMAX, 1]] : [[2, 2 + D, 1], [2 + D, TMAX, 0]]), RW.req, storm ? 's-bad' : 's-sec');
    [[0, 2 * D], [1, D]].concat(storm ? [] : [[2, D]]).forEach(([t, w]) => R(tg, X(t), RW.run, Math.max(5, w * 84), 22, 'f-pri', 1));
    T(tg, X(0), RW.run - 10, 'sends h, i', 't-sm');
    T(tg, X(1), RW.run - 10, 'sends \\n', 't-sm');
    if (storm) {
      R(tg, X(2), RW.run, X(TMAX) - X(2), 22, 'f-bad', 1);
      T(tg, (X(2) + X(TMAX)) / 2, RW.run + 11, 'runs again and again', 't-on t-bold', 'middle');
      T(tg, X(2), RW.run - 10, 'ring empty, TXEIE still on', 't-bad t-sm t-bold');
    } else {
      T(tg, X(2), RW.run - 10, 'ring empty: TXEIE off', 't-ok t-sm t-bold');
    }
    role('txe-note').textContent = TXN[k];
  });

  // Figure 8: weak and strong definitions at link time
  const wk = svg(viz('weak'), 760, 252, { label: 'The linker keeps the strong definition: uart.c _write over retarget.c weak _write, and USART2_IRQHandler over the weak Default_Handler alias', minWidth: 580 });
  [
    { y: 0, head: '_write, called by printf', weak: 'retarget.c: weak _write, polled', strong: 'uart.c: _write, strong, ring', out: 'printf → uart.c\'s _write\nreturns once text is in the ring' },
    { y: 128, head: 'vector 44, USART2', weak: 'startup.c: weak Default_Handler', strong: 'uart.c: USART2_IRQHandler', out: 'vector 44 holds\nUSART2_IRQHandler' },
  ].forEach(r => {
    T(wk, 20, r.y + 12, r.head, 't-fg t-bold');
    box(wk, 20, r.y + 28, 250, 40, r.weak, { cls: 'f-seg', textCls: 't-muted' });
    box(wk, 20, r.y + 76, 250, 40, r.strong, { cls: 'f-pri-soft', textCls: 't-pri t-bold' });
    box(wk, 320, r.y + 46, 120, 52, 'linker:\nstrong wins', { cls: 'f-surface', textCls: 't-fg t-bold' });
    box(wk, 490, r.y + 46, 250, 52, r.out, { cls: 'f-pri', textCls: 't-on' });
    arrow(wk, 272, r.y + 48, 318, r.y + 62, { cls: 'a-muted', dash: true, label: 'dropped', dy: -10 });
    arrow(wk, 272, r.y + 96, 318, r.y + 82, { cls: 'a-pri' });
    arrow(wk, 442, r.y + 72, 488, r.y + 72, { cls: 'a-pri' });
  });

  // Figure 9: two tasks printing with and without the mutex
  const mx = svg(viz('mix'), 780, 222, { label: 'Characters of a telemetry frame and a protocol reply on the wire, in order, with and without the print lock, and what host.py makes of each line', minWidth: 600 });
  const TEL = '$TEL,2000,1,1000,0,0*43\r\n', ACK = '$ACK,LED,85*09\r\n', CUT = 14;
  const tag = (str, who) => [...str].map(c => [c, who]);
  const ORDER = [tag(TEL, 0).concat(tag(ACK, 1)), tag(TEL.slice(0, CUT), 0).concat(tag(ACK, 1), tag(TEL.slice(CUT), 0))];
  const M = { x0: 20, w: 18 };
  T(mx, M.x0, 12, 'telemetry task, priority 2', 't-pri t-bold');
  T(mx, M.x0, 58, 'protocol task, priority 3', 't-sec t-bold');
  T(mx, M.x0, 104, 'the wire, in order', 't-fg t-bold');
  const mg = s('g', {}, mx);
  const MIXN = [
    'With the lock, the protocol task wakes while the telemetry task holds print_lock, so it blocks in os_mutex_lock() until the whole $TEL line is in the ring. The PC gets two intact frames.',
    'Without it, the protocol task preempts in the middle of the $TEL line, and its reply goes into the ring between two characters. host.py sees $TEL,2000,1,10$ACK,LED,85*09: the XOR of that body is 6E, not 09, so it is bad. The rest, 00,0,0*43, has no $ and is not a frame. Both frames are lost, and the missing sequence number 1 also counts as a gap.',
  ];
  steps(viz('mix-steps'), ['With the lock', 'Without the lock'], k => {
    mg.textContent = '';
    ORDER[k].forEach(([c, who], i) => {
      const x = M.x0 + i * M.w, y = who ? 66 : 20;
      R(mg, x, y, M.w - 2, 22, who ? 'f-sec-soft' : 'f-pri-soft', 2);
      T(mg, x + (M.w - 2) / 2, y + 11, show(c), (who ? 't-sec' : 't-pri') + (c < ' ' ? ' t-sm' : ''), 'middle');
      R(mg, x, 112, M.w - 2, 22, who ? 'f-sec' : 'f-pri', 2);
      T(mg, x + (M.w - 2) / 2, 123, show(c), 't-on' + (c < ' ' ? ' t-sm' : ''), 'middle');
    });
    const lines = ORDER[k].map(([c]) => c).join('').split('\n').map(l => l.replace('\r', '')).filter(Boolean);
    T(mg, M.x0, 152, 'host.py reads', 't-fg t-bold');
    let good = 0, bad = 0, other = 0;
    lines.forEach((ln, i) => {
      const y = 172 + i * 20, star = ln.indexOf('*');
      let verdict, cls;
      if (ln[0] !== '$') { verdict = 'no $ at the start: not a frame'; cls = 't-bad'; other++; }
      else {
        const sum = xor(ln.slice(1, star)), sent = parseInt(ln.slice(star + 1, star + 3), 16);
        if (sum === sent) { verdict = `good frame: XOR = ${hex2(sum)}`; cls = 't-ok'; good++; }
        else { verdict = `bad frame: XOR = ${hex2(sum)}, the line says ${hex2(sent)}`; cls = 't-bad'; bad++; }
      }
      T(mg, M.x0, y, ln, 't-fg');
      T(mg, 260, y, verdict, cls + ' t-bold');
    });
    T(mg, 130, 152, `frames good ${good}, bad ${bad}, other lines ${other}`, (bad || other ? 't-bad' : 't-ok') + ' t-bold');
    role('mix-note').textContent = MIXN[k];
  });

  // Figure 10: how task_proto sorts the byte stream
  const cl = svg(viz('cls'), 800, 284, { label: 'State machine of the protocol task: ESC starts a key sequence, other bytes build a line, Enter sends a $ line to the frame check and any other line to the shell', minWidth: 620 });
  const C = {};
  const cnode = (n, x, y, w, h, t, cls, tc) => { C[n] = s('g', { class: 'fade' }, cl); box(C[n], x, y, w, h, t, { cls, textCls: tc || 't-fg' }); };
  const cedge = (n, x1, y1, x2, y2, label) => { C[n] = s('g', { class: 'fade' }, cl); arrow(C[n], x1, y1, x2, y2, { cls: 'a-muted', label, labelCls: 't-fg' }); };
  cnode('A', 10, 126, 120, 44, 'byte from\nuart_getc()', 'f-surface');
  cnode('B', 170, 126, 110, 44, 'ESC (0x1B)?', 'f-seg', 't-fg t-bold');
  cnode('C', 330, 56, 110, 44, 'ESC seen\nclock starts', 'f-ter-soft');
  cnode('D1', 490, 8, 170, 40, '[ : CSI, wait for a\nfinal byte 0x40–0x7E', 'f-ter-soft');
  cnode('D2', 490, 56, 170, 40, 'O : SS3, take\nthe next byte', 'f-ter-soft');
  cnode('D3', 490, 104, 170, 40, '50 ms of silence', 'f-ter-soft');
  cnode('E1', 700, 32, 90, 40, 'key done\nUp, Left…', 'f-ter', 't-on');
  cnode('E2', 700, 104, 90, 40, 'KEY_ESC:\ncancel line', 'f-ter', 't-on');
  cnode('F', 330, 196, 130, 44, 'KEY_CHAR:\nadd to the line', 'f-pri-soft', 't-pri');
  cnode('G', 500, 196, 130, 44, 'Enter: first\ncharacter?', 'f-seg');
  cnode('H1', 670, 172, 120, 40, '$: frame\ncheck, no echo', 'f-pri', 't-on');
  cnode('H2', 670, 232, 120, 40, 'else: shell\nechoed', 'f-pri', 't-on');
  cedge('AB', 132, 148, 168, 148);
  cedge('BC', 248, 124, 328, 84, 'yes');
  cedge('BF', 248, 172, 328, 214, 'no');
  cedge('CD1', 442, 70, 488, 30);
  cedge('CD2', 442, 78, 488, 76);
  cedge('CD3', 442, 86, 488, 122);
  cedge('D1E', 662, 28, 698, 46);
  cedge('D2E', 662, 76, 698, 60);
  cedge('D3E', 662, 124, 698, 124);
  cedge('FG', 462, 218, 498, 218);
  cedge('GH1', 632, 210, 668, 194);
  cedge('GH2', 632, 226, 668, 250);
  const CP = [[], ['A', 'AB', 'B', 'BF', 'F', 'FG', 'G', 'GH2', 'H2'], ['A', 'AB', 'B', 'BF', 'F', 'FG', 'G', 'GH1', 'H1'],
    ['A', 'AB', 'B', 'BC', 'C', 'CD1', 'D1', 'D1E', 'E1'], ['A', 'AB', 'B', 'BC', 'C', 'CD3', 'D3', 'D3E', 'E2']];
  const CLN = [
    'Three kinds of input share one line. A byte that is not ESC is an ordinary character. ESC (0x1B) starts a key sequence, CSI (ESC [) or SS3 (ESC O), or it is a lone Esc if 50 ms of silence follow it.',
    'l, e, d, space, 1, 7, 0 are not ESC, so each is KEY_CHAR: added to the line and echoed back to the terminal. Enter: the first character is l, so it is a shell command. Reply: bar = 0xAA.',
    'The first byte is $, so nothing in this line is echoed. Enter: proto_check() takes the body LED,85, its XOR is 6C as the frame says, and the board replies $ACK,LED,85*09.',
    'ESC starts a sequence and [ makes it CSI. A (0x41) lies in 0x40–0x7E, so it is the final byte and ends the key: Up, which halves the telemetry period. The final byte plays the part of the * in a frame.',
    'The Esc key sends the same 0x1B that starts every sequence. Only time tells them apart: after 50 ms with no more bytes the decoder reports KEY_ESC, and the half-typed line is cancelled. The silence is noticed late, when the next byte arrives.',
  ];
  steps(viz('cls-steps'), ['All', 'led 170 ⏎', '$LED,85*6C ⏎', 'ESC [ A', 'ESC, then silence'], k => {
    Object.keys(C).forEach(n => C[n].classList.toggle('dim', k > 0 && !CP[k].includes(n)));
    role('cls-note').textContent = CLN[k];
  });

  // Figures 11 and 12: the body as a bit grid, one row per byte
  const BODY = 'LED,170';
  const X0 = { ch: 30, hex: 78, b: 116, cw: 34, run: 410 };
  const gx = b => X0.b + (7 - b) * X0.cw;
  const gridHead = (g, last) => {
    T(g, X0.ch, 22, 'char', 't-sm', 'middle');
    T(g, X0.hex, 22, 'hex', 't-sm', 'middle');
    for (let b = 7; b >= 0; b--) T(g, gx(b) + X0.cw / 2, 22, 'b' + b, 't-sm', 'middle');
    T(g, X0.run, 22, last, 't-sm');
  };
  const cell = (g, b, y, v, cls) => {
    R(g, gx(b) + 2, y, X0.cw - 4, 26, cls[0], 3);
    T(g, gx(b) + X0.cw / 2, y + 13, String(v), cls[1], 'middle');
  };
  const rowY = i => 36 + i * 30;

  const xs = svg(viz('xor'), 560, 288, { label: 'XOR of the bytes of LED,170, one row per byte, with the running XOR, ending at 0x57', minWidth: 500, maxWidth: 680 });
  gridHead(xs, 'running XOR');
  const xg = s('g', {}, xs);
  const ACC = [];
  [...BODY].reduce((a, c) => { const v = a ^ c.charCodeAt(0); ACC.push(v); return v; }, 0);
  steps(viz('xor-steps'), ['All'].concat([...BODY].map((c, i) => `${i + 1} · ${c}`)), k => {
    xg.textContent = '';
    const upto = k || BODY.length, cur = k ? k - 1 : -1;
    [...BODY].forEach((c, i) => {
      const v = c.charCodeAt(0), y = rowY(i), g = s('g', { class: i < upto ? '' : 'dim' }, xg);
      T(g, X0.ch, y + 13, c, 't-fg t-bold t-lg', 'middle');
      T(g, X0.hex, y + 13, hex2(v), i === cur ? 't-pri t-bold' : 't-fg', 'middle');
      bitsOf(v).forEach((bit, b) => cell(g, b, y, bit, bit ? (i === cur ? ['f-pri', 't-on t-bold'] : ['f-pri-soft', 't-pri']) : ['f-seg', 't-muted']));
      if (i < upto) T(g, X0.run, y + 13, (i ? hex2(ACC[i - 1]) + ' ^ ' + hex2(v) + ' = ' : '00 ^ ' + hex2(v) + ' = ') + hex2(ACC[i]), i === cur ? 't-pri t-bold' : 't-fg');
    });
    const acc = ACC[upto - 1], fin = upto === BODY.length, y = rowY(7) + 8;
    s('line', { x1: X0.b, x2: X0.b + 8 * X0.cw, y1: y - 5, y2: y - 5, class: 's-fg' }, xg);
    T(xg, X0.ch + 10, y + 13, fin ? 'checksum' : 'so far', 't-fg t-bold', 'middle');
    bitsOf(acc).forEach((bit, b) => cell(xg, b, y, bit, bit ? [fin ? 'f-ok' : 'f-pri', 't-on t-bold'] : ['f-seg', 't-muted']));
    T(xg, X0.run, y + 13, '= 0x' + hex2(acc) + (fin ? ', so *57' : ''), (fin ? 't-ok' : 't-pri') + ' t-bold t-lg');
    let note;
    if (!k) note = 'All seven bytes. Each checksum bit is the parity of its column. Column b0 has 1s in E, 1 and 7, three of them, an odd count, so checksum bit 0 is 1. The result 0101 0111 is 0x57, and the frame is $LED,170*57.';
    else {
      const p = k > 1 ? ACC[k - 2] : 0, v = BODY.charCodeAt(k - 1), a = ACC[k - 1];
      const nb = (x, sh) => (x >> sh) & 15, h1 = n => n.toString(16).toUpperCase(), b4 = n => n.toString(2).padStart(4, '0');
      note = `${hex2(p)} ^ ${hex2(v)} = ${hex2(a)}. High digits: ${h1(nb(p, 4))} ^ ${h1(nb(v, 4))} = ${b4(nb(p, 4))} ^ ${b4(nb(v, 4))} = ${b4(nb(a, 4))} = ${h1(nb(a, 4))}. Low digits: ${h1(nb(p, 0))} ^ ${h1(nb(v, 0))} = ${b4(nb(p, 0))} ^ ${b4(nb(v, 0))} = ${b4(nb(a, 0))} = ${h1(nb(a, 0))}.` + (k === 1 ? ' The XOR starts from 0.' : '') + (k === 7 ? ' That is the checksum: $LED,170*57.' : '');
    }
    role('xor-note').textContent = note;
  });

  const ds = svg(viz('det'), 560, 318, { label: 'Received body with flipped bits ringed, the recomputed XOR compared with the 57 sent in the frame', minWidth: 500, maxWidth: 680 });
  gridHead(ds, 'received');
  const dg = s('g', {}, ds);
  const SENT = xor(BODY);
  const DET = [
    { lab: 'Sent: LED,170', body: 'LED,170', note: 'The body as sent. Its XOR is 57, the checksum the frame carries.' },
    { lab: 'One bit: LED,171', body: 'LED,171', note: 'The last byte 0 (0x30) arrives as 1 (0x31): one flipped bit, in column b0. That column now holds an even number of 1s, so the recomputed XOR is 56. 56 ≠ 57, rejected with $NAK,CHECKSUM. A single flipped bit always changes exactly one column, so it is always caught.' },
    { lab: 'Two bits, same column: LED,060', body: 'LED,060', note: '1 → 0 and 7 → 6 are two flips, both in column b0. The column\'s parity changes twice, which leaves it as it was, so the XOR is still 57. The frame is accepted and the board sets the bar to 60 instead of 170. A CRC would catch this.' },
    { lab: 'Two bits, two columns: LED,371', body: 'LED,371', note: '1 → 3 flips b1 and 0 → 1 flips b0. Flips in different columns change two parity bits, so the XOR is 54 and the frame is rejected. XOR misses only flips that pair up in the same column.' },
  ];
  steps(viz('det-steps'), DET.map(d => d.lab), k => {
    dg.textContent = '';
    const body = DET[k].body;
    [...body].forEach((c, i) => {
      const v = c.charCodeAt(0), was = BODY.charCodeAt(i), y = rowY(i), hit = v !== was;
      T(dg, X0.ch, y + 13, c, (hit ? 't-bad' : 't-fg') + ' t-bold t-lg', 'middle');
      T(dg, X0.hex, y + 13, hex2(v), hit ? 't-bad t-bold' : 't-fg', 'middle');
      bitsOf(v).forEach((bit, b) => {
        cell(dg, b, y, bit, bit ? ['f-pri-soft', 't-pri'] : ['f-seg', 't-muted']);
        if (((v ^ was) >> b) & 1) s('circle', { cx: gx(b) + X0.cw / 2, cy: y + 13, r: 12, class: 's-bad' }, dg);
      });
      if (hit) T(dg, X0.run, y + 13, `was ${BODY[i]} (${hex2(was)})`, 't-bad');
    });
    const got = xor(body), y = rowY(7) + 8, ok = got === SENT;
    s('line', { x1: X0.b, x2: X0.b + 8 * X0.cw, y1: y - 5, y2: y - 5, class: 's-fg' }, dg);
    T(dg, X0.ch + 10, y + 13, 'XOR', 't-fg t-bold', 'middle');
    bitsOf(got).forEach((bit, b) => {
      cell(dg, b, y, bit, bit ? ['f-pri', 't-on t-bold'] : ['f-seg', 't-muted']);
      if (((got ^ SENT) >> b) & 1) R(dg, gx(b) + 1, y - 1, X0.cw - 2, 28, 'f-none outline-sec', 4);
    });
    T(dg, X0.run, y + 13, '= 0x' + hex2(got), 't-fg t-bold t-lg');
    const accepted = k === 0 ? 'equal: good frame' : ok ? 'equal: accepted, damage unseen' : 'different: rejected';
    T(dg, X0.ch - 18, y + 50, `recomputed ${hex2(got)} vs ${hex2(SENT)} in the frame: ${accepted}`, (ok && k !== 2 ? 't-ok' : 't-bad') + ' t-bold');
    role('det-note').textContent = DET[k].note;
  });
});
