QV.register('s3-mc23', function (q) {
  const { s, svg, axes, box, arrow, steps, fmt } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const sp = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const F = 48e6;

  // Figure 1: the hand calculation
  const C = svg(viz('calc'), 760, 262, { label: 'Time base for a 100 ms update, and the counts 100 ms takes at four count rates against the 16-bit limit', minWidth: 560 });
  const B = { y: 8, h: 46, w: 128, gap: 24, x0: 10 };
  const bx = i => B.x0 + i * (B.w + B.gap);
  for (let i = 0; i < 4; i++) arrow(C, bx(i) + B.w + 2, B.y + B.h / 2, bx(i + 1) - 2, B.y + B.h / 2, { cls: 'a-muted' });
  const chain = s('g', {}, C);
  const L = { x0: 160, x1: 700, y0: 104, row: 28, axis: 212 };
  const lx = n => L.x0 + (Math.log10(n) - 2) / 5 * (L.x1 - L.x0);
  const ry = i => L.y0 + i * L.row;
  const RATES = [
    { f: '48 MHz', psc: 0, n: 4800000 },
    { f: '1 MHz', psc: 47, n: 100000 },
    { f: '100 kHz', psc: 479, n: 10000 },
    { f: '10 kHz', psc: 4799, n: 1000 },
  ];
  const hl = s('g', {}, C);
  s('line', { x1: L.x0, x2: L.x1, y1: L.axis, y2: L.axis, class: 'l-axis' }, C);
  [2, 3, 4, 5, 6, 7].forEach(e => {
    s('line', { x1: lx(10 ** e), x2: lx(10 ** e), y1: L.axis, y2: L.axis + 5, class: 'l-axis' }, C);
    s('text', { x: lx(10 ** e), y: L.axis + 18, 'text-anchor': 'middle' }, C, sp(10 ** e));
  });
  s('text', { x: (L.x0 + L.x1) / 2, y: L.axis + 36, 'text-anchor': 'middle' }, C, 'counts needed for 100 ms (log scale)');
  const xl = lx(65536);
  s('line', { x1: xl, x2: xl, y1: L.y0 - 18, y2: L.axis, class: 's-bad dash', style: 'stroke-width: 1.5' }, C);
  s('text', { x: xl, y: L.y0 - 24, 'text-anchor': 'middle', class: 't-bad t-bold' }, C, '16-bit limit: ARR + 1 ≤ 65 536');
  RATES.forEach((r, i) => {
    const y = ry(i), fits = r.n <= 65536;
    s('text', { x: 4, y, dy: '0.35em', class: 't-fg' }, C, `${r.f} · PSC ${r.psc}`);
    s('line', { x1: L.x0, x2: lx(r.n), y1: y, y2: y, class: fits ? 's-ok' : 's-bad', style: 'stroke-width: 2' }, C);
    s('circle', { cx: lx(r.n), cy: y, r: 5, class: fits ? 'f-ok' : 'f-bad' }, C);
    s('text', { x: lx(r.n) + 14, y, dy: '0.35em', class: (fits ? 't-ok' : 't-bad') + ' t-bold' }, C, sp(r.n));
  });

  const CHAIN = [
    ['48 MHz\ntimer clock', 'PSC = ?\n÷ ?', 'CNT +1 every\n100 µs (10 kHz)', 'ARR = ?\n? counts', 'update every\n100 ms'],
    ['48 MHz\ntimer clock', 'PSC = 4799\n÷ 4800', 'CNT +1 every\n100 µs (10 kHz)', 'ARR = ?\n? counts', 'update every\n100 ms'],
    ['48 MHz\ntimer clock', 'PSC = 4799\n÷ 4800', 'CNT +1 every\n100 µs (10 kHz)', 'ARR = 999\n1 000 counts', 'update every\n100 ms'],
    ['48 MHz\ntimer clock', 'PSC = 4799\n÷ 4800', 'CNT +1 every\n100 µs (10 kHz)', 'ARR = 999\n1 000 counts', 'update every\n100 ms (10 Hz)'],
  ];
  const CALC = [
    ['1  100 ms × 1 MHz  = 100 000 counts   more than 65 536: does not fit',
      '   100 ms × 10 kHz =   1 000 counts   fits; one count = 100 µs'],
    ['2  PSC + 1 = 48 000 000 / 10 000 = 4800    →  PSC = 4799'],
    ['3  ARR + 1 = 100 ms / 100 µs = 1000         →  ARR = 999'],
    ['4  48 000 000 / (4800 × 1000) = 10 Hz       →  one update every 100 ms'],
  ];
  const NOTES = [
    'Step 1, the count rate. At the lesson\'s 1 MHz, 100 ms is 100 000 counts, and a 16-bit ARR allows at most 65 536. So slow the count down first. 10 kHz is a round choice: 48 MHz / 10 kHz is a whole number, and 100 ms is then 1000 counts.',
    'Step 2, PSC. The counter steps once every PSC + 1 clocks, so PSC + 1 = 48 000 000 / 10 000 = 4800 and PSC = 4799. PSC is 16 bits too, and 4799 fits.',
    'Step 3, ARR. One count is 100 µs, so 100 ms is 1000 counts, 0 to 999: ARR = 999.',
    'Step 4, the check with the slide-5b formula: 48 000 000 / (4800 × 1000) = 10 Hz, one update every 100 ms. That is option A.',
  ];
  steps(viz('calc-steps'), ['1 · count rate', '2 · PSC', '3 · ARR', '4 · check'], k => {
    chain.textContent = '';
    const on = [2, 1, 3, 4][k];
    CHAIN[k].forEach((t, i) => box(chain, bx(i), B.y, B.w, B.h, t, { cls: i === on ? (k === 3 ? 'f-ok-soft' : 'f-pri-soft') : 'f-surface' }));
    hl.textContent = '';
    s('rect', { x: 0, y: ry(3) - 12, width: L.x1 + 60, height: 24, rx: 4, class: 'f-ok-soft' }, hl);
    role('calc').textContent = CALC.slice(0, k + 1).flat().join('\n');
    role('calc-note').textContent = NOTES[k];
  }, 3);

  // Figure 2: the four options
  const OPTS = [
    { key: 'A', psc: 4799, arr: 999, verdict: '<b>A</b>: 48 MHz / 4800 = 10 kHz, and 1000 counts of 100 µs take 100 ms. Every update lands on a target line: 10 Hz.' },
    { key: 'B', psc: 47, arr: 99999, verdict: '<b>B</b>: 1 µs counts, but 99 999 = 0x1869F needs 17 bits. TIM3 keeps 0x869F = 34 463, so the counter wraps after 34 464 counts, every 34.464 ms. It builds with no warning.' },
    { key: 'C', psc: 4800, arr: 1000, verdict: '<b>C</b>: 48 MHz / 4801, and 1001 counts: 4801 × 1001 / 48 MHz = 100.12 ms. Too small to see here; the error grows by 0.12 ms every period, and nothing complains.' },
    { key: 'D', psc: 479, arr: 999, verdict: '<b>D</b>: 48 MHz / 480 = 100 kHz, so 1000 counts take only 10 ms: ten updates for every one asked for.' },
  ];
  const W = svg(viz('ramp'), 760, 300, { label: 'ARR value in binary against the 16-bit register, and CNT over 210 ms with update events and the 100 ms targets', minWidth: 560 });
  const R = { x0: 150, cell: 26, y: 20, h: 26 };
  const rx = b => R.x0 + (16 - b) * R.cell;
  for (let b = 16; b >= 0; b--) s('text', { x: rx(b) + R.cell / 2, y: 13, 'text-anchor': 'middle', class: 't-sm' }, W, String(b));
  s('text', { x: 0, y: R.y + 9, class: 't-fg t-bold' }, W, 'value written');
  s('text', { x: 0, y: R.y + 23, class: 't-sm' }, W, 'to TIM3 ARR');
  s('line', { x1: rx(15) + 2, x2: rx(0) + R.cell - 2, y1: R.y + R.h + 8, y2: R.y + R.h + 8, class: 's-pri', style: 'stroke-width: 1.5' }, W);
  s('text', { x: (rx(15) + rx(0) + R.cell) / 2, y: R.y + R.h + 22, 'text-anchor': 'middle', class: 't-pri' }, W, 'the register: bits 15:0');
  const reg = s('g', {}, W);
  s('text', { x: 62, y: 98, 'text-anchor': 'end', class: 't-fg' }, W, 'CNT');
  const layer = s('g', {}, W);
  const rateTxt = r => r >= 1e6 ? fmt(r / 1e6, 3) + ' MHz' : fmt(r / 1e3, 3) + ' kHz';

  steps(viz('pick'), OPTS.map(o => `${o.key} · ${o.psc} / ${o.arr}`), k => {
    const o = OPTS[k], ae = o.arr & 0xFFFF, right = o.key === 'A';
    const rate = F / (o.psc + 1), T = (ae + 1) / rate * 1000;

    reg.textContent = '';
    for (let b = 16; b >= 0; b--) {
      const bit = (o.arr >> b) & 1;
      if (b === 16) {
        s('rect', { x: rx(b) + 1, y: R.y + 1, width: R.cell - 2, height: R.h - 2, rx: 3, class: (bit ? 'f-bad-soft' : 'f-none') + ' s-muted dash' }, reg);
      } else {
        s('rect', { x: rx(b), y: R.y, width: R.cell, height: R.h, class: (bit ? 'f-pri' : 'f-seg') + ' sep' }, reg);
      }
      s('text', { x: rx(b) + R.cell / 2, y: R.y + R.h / 2, dy: '0.35em', 'text-anchor': 'middle', class: b === 16 ? (bit ? 't-bad t-bold' : 't-muted') : (bit ? 't-on t-bold' : 't-muted') }, reg, String(bit));
    }
    s('text', { x: rx(16) + R.cell / 2, y: R.y + R.h + 22, 'text-anchor': 'middle', class: (o.arr > 0xFFFF ? 't-bad t-bold' : 't-muted') + ' t-sm' }, reg, o.arr > 0xFFFF ? 'lost' : 'no bit 16');
    const hx = '0x' + ae.toString(16).toUpperCase();
    s('text', { x: 604, y: R.y + 9, class: 't-fg' }, reg, 'written ' + sp(o.arr));
    s('text', { x: 604, y: R.y + 23, class: o.arr > 0xFFFF ? 't-bad t-bold' : 't-fg' }, reg, `kept ${sp(ae)} = ${hx}`);

    layer.textContent = '';
    const ax = axes(layer, { x: 70, y: 106, w: 660, h: 150, xd: [0, 210], yd: [0, ae], xt: [0, 50, 100, 150, 200], yt: [0, ae], xl: 'time (ms)' });
    [100, 200].forEach(t => s('line', { x1: ax.x(t), x2: ax.x(t), y1: ax.y(ae) - 4, y2: ax.y(0), class: 's-ok dash', style: 'stroke-width: 1.5' }, layer));
    s('text', { x: ax.x(210), y: 98, 'text-anchor': 'end', class: 't-ok t-bold' }, layer, 'target: an update every 100 ms');
    let d = `M${ax.x(0)} ${ax.y(0)}`;
    const dots = [];
    for (let i = 0; i * T < 210; i++) {
      const t1 = (i + 1) * T;
      if (t1 <= 210 + 1e-9) {
        d += ` L${ax.x(t1).toFixed(1)} ${ax.y(ae).toFixed(1)} L${ax.x(t1).toFixed(1)} ${ax.y(0)}`;
        dots.push(t1);
      } else {
        d += ` L${ax.x(210)} ${ax.y(ae * (210 - i * T) / T).toFixed(1)}`;
      }
    }
    s('path', { d, class: 's-pri', style: 'stroke-width: 2' }, layer);
    dots.forEach(t => s('circle', { cx: ax.x(t), cy: ax.y(0), r: 4.5, class: right ? 'f-ok' : 'f-pri' }, layer));

    role('rate').textContent = rateTxt(rate);
    role('counts').textContent = sp(ae + 1);
    const per = role('period');
    per.textContent = fmt(T, 3) + ' ms';
    per.className = 'v' + (right ? ' ok' : '');
    role('verdict').innerHTML = o.verdict;
  });
});

QV.register('s3-mc24', function (q) {
  const { s, svg, box, arrow, steps } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);

  // Figure 1: timer, AF selector, pin
  const W = svg(viz('af'), 760, 340, { label: 'TIM3 inside the chip, the PA6 alternate-function selector driven by AFR[0] bits 27:24, and the signal at the servo', minWidth: 580 });
  s('rect', { x: 6, y: 26, width: 340, height: 216, rx: 8, class: 'f-none s-muted dash' }, W);
  s('text', { x: 14, y: 16, class: 't-fg t-bold' }, W, 'inside the chip: TIM3');
  box(W, 20, 40, 140, 44, 'TIM3 counter\nCNT 0 … 19999', { cls: 'f-ok-soft' });
  box(W, 184, 40, 150, 44, 'update interrupt\nreport: TIM3 50/s', { cls: 'f-ok-soft' });
  box(W, 184, 108, 150, 44, 'rate limiter\nCCR1 follows target', { cls: 'f-ok-soft' });
  box(W, 184, 176, 150, 44, 'CH1 compare\nhigh while CNT < CCR1', { cls: 'f-ok-soft' });
  arrow(W, 162, 62, 182, 62, { cls: 'a-muted' });
  arrow(W, 259, 86, 259, 106, { cls: 'a-muted' });
  arrow(W, 259, 154, 259, 174, { cls: 'a-muted' });
  s('path', { d: 'M90 86 V198', class: 's-muted' }, W);
  arrow(W, 90, 198, 182, 198, { cls: 'a-muted' });
  s('text', { x: 96, y: 150, class: 't-sm' }, W, 'CNT');
  s('text', { x: 14, y: 234, class: 't-ok t-bold' }, W, 'all of this works with any AF number');

  const M = { x0: 450, x1: 510, top: 36, bot: 220, y0: 58, dy: 20, out: 128 };
  const iy = i => M.y0 + i * M.dy;
  s('polygon', { points: `${M.x0},${M.top} ${M.x1},${M.top + 24} ${M.x1},${M.bot - 24} ${M.x0},${M.bot}`, class: 'f-surface box' }, W);
  s('text', { x: (M.x0 + M.x1) / 2, y: M.top - 8, 'text-anchor': 'middle', class: 't-fg t-bold' }, W, 'PA6 AF');
  for (let i = 0; i < 8; i++) {
    s('text', { x: M.x0 + 5, y: iy(i), dy: '0.35em', class: 't-sm' }, W, 'AF' + i);
    if (i !== 1 && i !== 2) s('line', { x1: M.x0 - 16, x2: M.x0, y1: iy(i), y2: iy(i), class: 's-muted', style: 'stroke-width: 1' }, W);
  }
  s('path', { d: `M334 198 H380 V${iy(1)} H${M.x0 - 1}`, class: 's-pri', style: 'stroke-width: 2' }, W);
  s('text', { x: 386, y: iy(1) - 6, class: 't-pri t-bold' }, W, 'TIM3_CH1');

  s('text', { x: 568, y: 108, 'text-anchor': 'middle', class: 't-fg t-bold' }, W, 'PA6');
  s('rect', { x: 556, y: 116, width: 24, height: 24, rx: 3, class: 'f-fg' }, W);
  const FR = { x0: 530, w: 70, hi: 184, lo: 206 };
  s('line', { x1: FR.x0, x2: FR.x0 + 3 * FR.w, y1: FR.lo + 14, y2: FR.lo + 14, class: 'l-axis' }, W);
  [0, 1, 2, 3].forEach(i => {
    s('line', { x1: FR.x0 + i * FR.w, x2: FR.x0 + i * FR.w, y1: FR.lo + 14, y2: FR.lo + 19, class: 'l-axis' }, W);
    s('text', { x: FR.x0 + i * FR.w, y: FR.lo + 30, 'text-anchor': 'middle', class: 't-sm' }, W, (i * 20) + (i === 3 ? ' ms' : ''));
  });

  const A = { x0: 150, w: 70, y: 282, h: 26 };
  const ax = i => A.x0 + i * A.w;
  s('text', { x: 0, y: A.y + 9, class: 't-fg t-bold' }, W, 'GPIOA->AFR[0]');
  s('text', { x: 0, y: A.y + 23, class: 't-sm' }, W, 'PA6: bits 27:24');
  for (let i = 0; i < 8; i++) {
    const pin = 7 - i;
    s('text', { x: ax(i) + A.w / 2, y: A.y - 20, 'text-anchor': 'middle', class: pin === 6 ? 't-sec t-bold' : 't-fg' }, W, 'PA' + pin);
    s('text', { x: ax(i) + A.w / 2, y: A.y - 7, 'text-anchor': 'middle', class: 't-sm' }, W, `${4 * pin + 3}:${4 * pin}`);
  }
  s('path', { d: `M${ax(1) + A.w / 2} ${A.y - 32} V250 H480`, class: 's-sec dash', style: 'stroke-width: 1.5' }, W);
  arrow(W, 480, 250, 480, M.bot - 13, { cls: 'a-sec', width: 1.5 });
  s('text', { x: 474, y: 242, 'text-anchor': 'end', class: 't-sec' }, W, 'selects the input');
  const dyn = s('g', {}, W);

  const STATES = [
    { af: 2, note: 'As written: AFR[0] bits 27:24 = 0010, so the selector connects PA6 to its AF2 input, some other peripheral or nothing. TIM3 still counts, still interrupts 50 times a second, and the rate limiter still moves CCR1 towards the target. None of it reaches the pin, and the servo never moves.' },
    { af: 1, note: 'Fixed: AFR[0] bits 27:24 = 0001 connects PA6 to TIM3_CH1, AF1 in the datasheet\'s table. The same timer, now with a pin: a pulse of CCR1 µs every 20 ms, and the servo follows the target.' },
  ];
  steps(viz('af-steps'), ['As written: AF2', 'Fixed: AF1'], k => {
    const st = STATES[k], ok = st.af === 1;
    dyn.textContent = '';
    s('line', { x1: M.x0 - 40, x2: M.x0, y1: iy(2), y2: iy(2), class: ok ? 's-muted' : 's-bad', style: 'stroke-width: ' + (ok ? 1 : 2) }, dyn);
    s('text', { x: M.x0 - 46, y: iy(2), dy: '0.35em', 'text-anchor': 'end', class: ok ? 't-muted' : 't-bad t-bold' }, dyn, '?');
    s('line', { x1: M.x0 + 26, x2: M.x1, y1: iy(st.af), y2: M.out, class: ok ? 's-pri' : 's-bad', style: 'stroke-width: 2.5' }, dyn);
    s('line', { x1: M.x1, x2: 556, y1: M.out, y2: M.out, class: ok ? 's-pri' : 's-muted', style: 'stroke-width: 2' }, dyn);
    s('line', { x1: 580, x2: 640, y1: M.out, y2: M.out, class: ok ? 's-pri' : 's-muted', style: 'stroke-width: 2' }, dyn);
    box(dyn, 640, 104, 114, 48, ok ? 'servo\nfollows the target' : 'servo\nnever moves', { cls: ok ? 'f-ok-soft' : 'f-bad-soft' });
    let d = `M${FR.x0} ${FR.lo}`;
    if (ok) {
      [0, 1, 2].forEach(i => {
        const x = FR.x0 + i * FR.w, pw = FR.w * 1.5 / 20;
        d += ` L${x} ${FR.lo} L${x} ${FR.hi} L${(x + pw).toFixed(1)} ${FR.hi} L${(x + pw).toFixed(1)} ${FR.lo}`;
      });
    }
    d += ` L${FR.x0 + 3 * FR.w} ${FR.lo}`;
    s('path', { d, class: ok ? 's-ok' : 's-bad', style: 'stroke-width: 2' }, dyn);
    s('text', { x: FR.x0, y: 170, class: (ok ? 't-ok' : 't-bad') + ' t-bold' }, dyn, ok ? 'PA6: 1.5 ms high, every 20 ms' : 'PA6: flat, nothing drives it');

    const v = (0x41001100 & ~(0xF << 24)) | (st.af << 24);
    for (let i = 0; i < 8; i++) {
      const pin = 7 - i, nib = (v >>> (4 * pin)) & 0xF;
      s('rect', { x: ax(i) + 1, y: A.y, width: A.w - 2, height: A.h, rx: 3, class: (pin === 6 ? (ok ? 'f-ok-soft' : 'f-bad-soft') : 'f-seg') + ' box' }, dyn);
      s('text', { x: ax(i) + A.w / 2, y: A.y + A.h / 2, dy: '0.35em', 'text-anchor': 'middle', class: pin === 6 ? 't-fg t-bold' : 't-fg' }, dyn, nib.toString(2).padStart(4, '0'));
    }
    s('rect', { x: ax(1) - 1, y: A.y - 2, width: A.w + 2, height: A.h + 4, rx: 4, class: 'f-none outline-sec' }, dyn);
    s('text', { x: ax(8), y: A.y + A.h + 20, 'text-anchor': 'end', class: (ok ? 't-ok' : 't-bad') + ' t-bold' }, dyn,
      `= 0x${(v >>> 0).toString(16).toUpperCase()}: PA6 = AF${st.af}` + (ok ? ', TIM3_CH1' : ', not TIM3'));
    role('af-note').textContent = st.note;
  });

  // Figure 2: fingerprints of four faults
  const G = svg(viz('matrix'), 760, 262, { label: 'Four timer faults against five observations: counter, update interrupt, report line, pulse on PA6, servo', minWidth: 580 });
  const COLS = ['counter', 'update IRQ', 'report line', 'pulse on PA6', 'servo'];
  const cx = c => 206 + c * 109, CW = 105, ry = r => 30 + r * 48, RH = 42;
  COLS.forEach((c, i) => s('text', { x: cx(i) + CW / 2, y: 18, 'text-anchor': 'middle', class: 't-fg t-bold' }, G, c));
  const ROWS = [
    ['A · wrong AF number', 'this question', [['counts', 'ok'], ['50 per second', 'ok'], ['TIM3 50/s', 'ok'], ['none', 'bad'], ['never moves', 'bad']]],
    ['B · clock gate off', 'RCC APBENR1', [['stopped\nreads 0', 'bad'], ['none', 'bad'], ['TIM3 0/s', 'bad'], ['none', 'bad'], ['never moves', 'bad']]],
    ['C · PSC = 48', 'the −1 left out', [['counts\n2 % slow', 'off'], ['48.98\nper second', 'off'], ['TIM3 48\nor 49/s', 'off'], ['2 % too long', 'off'], ['moves,\nslightly off', 'off']]],
    ['D · SR = TIM_SR_UIF', 'UIF written with 1', [['counts', 'ok'], ['re-enters\nforever', 'bad'], ['stops:\nmillis() frozen', 'bad'], ['keeps\npulsing', 'ok'], ['holds still', 'bad']]],
  ];
  const FILL = { ok: 'f-ok-soft', off: 'f-ter-soft', bad: 'f-bad-soft' };
  ROWS.forEach(([name, sub, cells], r) => {
    s('text', { x: 0, y: ry(r) + 15, class: 't-fg t-bold' }, G, name);
    s('text', { x: 0, y: ry(r) + 30, class: 't-sm' }, G, sub);
    cells.forEach(([t, st], c) => box(G, cx(c), ry(r), CW, RH, t, { cls: FILL[st], rx: 4, lh: 13 }));
  });
  s('rect', { x: cx(0) - 4, y: ry(0) - 4, width: 5 * 109 + 4, height: RH + 8, rx: 6, class: 'f-none outline-pri' }, G);
  [['works', 'f-ok-soft'], ['works, wrong value', 'f-ter-soft'], ['fails', 'f-bad-soft']].forEach(([t, cls], i) => {
    const x = 206 + i * 170;
    s('rect', { x, y: 236, width: 14, height: 14, rx: 2, class: cls + ' box' }, G);
    s('text', { x: x + 20, y: 243, dy: '0.35em' }, G, t);
  });
});

QV.register('s3-mc25', function (q) {
  const { s, svg, steps } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);

  // Figure 1: the order each rule gives
  const W = svg(viz('ladder'), 760, 206, { label: 'NVIC priority ladder: the lesson\'s order next to the order each rule gives, with the sort keys', minWidth: 580 });
  const RY = p => 44 + p * 44, CH = 30, CW = 136;
  const COL = { lesson: 196, rule: 362, key: 440 };
  for (let p = 0; p <= 4; p++) s('line', { x1: 0, x2: 760, y1: RY(p) - 22, y2: RY(p) - 22, class: 'l-grid' }, W);
  ['most urgent', '', '', 'least urgent'].forEach((t, p) => {
    s('text', { x: 4, y: RY(p) - (t ? 6 : 0), dy: '0.35em', class: 't-fg t-bold' }, W, 'prio ' + p);
    if (t) s('text', { x: 4, y: RY(p) + 9, dy: '0.35em', class: 't-sm' }, W, t);
  });
  s('text', { x: COL.lesson, y: 12, 'text-anchor': 'middle', class: 't-fg t-bold' }, W, 'lesson, slide 15');
  const head = s('text', { x: COL.rule, y: 12, 'text-anchor': 'middle', class: 't-fg t-bold' }, W, '');
  s('text', { x: COL.key, y: 12, class: 't-fg t-bold' }, W, 'sort key');
  const LESSON = { TIM14: 1, TIM3: 2, SysTick: 3 };
  const NAME = { TIM14: 'TIM14 capture', TIM3: 'TIM3 update', SysTick: 'SysTick' };
  const chip = (g, x, p, t, cls, txt) => {
    s('rect', { x: x - CW / 2, y: RY(p) - CH / 2, width: CW, height: CH, rx: 6, class: cls }, g);
    s('text', { x, y: RY(p), dy: '0.35em', 'text-anchor': 'middle', class: txt || 't-fg' }, g, t);
  };
  Object.keys(LESSON).forEach(k => chip(W, COL.lesson, LESSON[k], NAME[k], 'f-pri-soft box'));
  s('text', { x: COL.lesson, y: RY(0), dy: '0.35em', 'text-anchor': 'middle', class: 't-muted' }, W, 'unused');
  const layer = s('g', {}, W);

  const RULES = [
    { key: 'B', head: 'rule B: deadline', order: [['TIM14', 1, 'next edge overwrites CCR1'], ['TIM3', 2, 'CCR1 due within the 20 ms frame'], ['SysTick', 3, 'none: a late tick still counts']],
      note: 'Deadline. The capture must be read before the next edge overwrites CCR1, which can be as little as 116 µs away (a 2 cm echo). The update only has to set CCR1 within the 20 ms frame. A late SysTick tick is still counted. Shortest deadline, most urgent: 1, 2, 3, the lesson\'s order.' },
    { key: 'A', head: 'rule A: importance', order: [['TIM3', 1, 'the servo: what a viewer watches'], ['TIM14', 2, 'a distance reading'], ['SysTick', 3, 'the clock: matters least']],
      note: 'Importance to a viewer puts the servo first, so TIM3 would get priority 1. Slide 15 rejects this rule: the servo matters more than the clock to someone watching, but it has 20 ms of slack.' },
    { key: 'C', head: 'rule C: IRQ number', order: [['SysTick', 1, 'exception 15, SysTick_IRQn = −1'], ['TIM3', 2, 'IRQ 16, exception 32'], ['TIM14', 3, 'IRQ 19, exception 35']],
      note: 'Lower IRQ number first would put SysTick (exception 15) at the top and TIM14 (IRQ 19) at the bottom, upside down. The IRQ number only breaks ties between equal priorities: they queue, and the NVIC takes the lower number first.' },
    { key: 'D', head: 'rule D: origin', order: [['?', 1, 'TIM14 or TIM3: both ST peripherals'], ['?', 2, 'the rule cannot order them'], ['SysTick', 3, 'core exception: last by this rule']],
      note: 'Origin says nothing about TIM14 against TIM3, and its premise is false. SysTick\'s level is a 2-bit field in SCB SHPR3 like any other: SysTick_Config wrote 3, and any level from 0 to 3 would work.' },
  ];
  steps(viz('rule-steps'), RULES.map(r => r.key + ' · ' + r.head.split(': ')[1]), k => {
    const R = RULES[k];
    layer.textContent = '';
    head.textContent = R.head;
    let same = true;
    R.order.forEach(([job, p, key]) => {
      if (job === '?') {
        same = false;
        s('rect', { x: COL.rule - CW / 2, y: RY(p) - CH / 2, width: CW, height: CH, rx: 6, class: 'f-none s-muted dash' }, layer);
        s('text', { x: COL.rule, y: RY(p), dy: '0.35em', 'text-anchor': 'middle', class: 't-muted' }, layer, 'TIM14 or TIM3');
        s('text', { x: COL.key, y: RY(p), dy: '0.35em', class: 't-muted' }, layer, key);
        return;
      }
      const ok = LESSON[job] === p;
      if (!ok) same = false;
      chip(layer, COL.rule, p, NAME[job], (ok ? 'f-ok-soft' : 'f-bad-soft') + ' box');
      s('text', { x: COL.key, y: RY(p), dy: '0.35em', class: ok ? 't-fg' : 't-bad' }, layer, key);
    });
    s('text', { x: COL.rule, y: RY(0), dy: '0.35em', 'text-anchor': 'middle', class: 't-muted' }, layer, 'unused');
    s('text', { x: COL.key, y: RY(0), dy: '0.35em', class: (same ? 't-ok' : 't-bad') + ' t-bold' }, layer, same ? 'same order as the lesson' : 'not the lesson\'s order');
    role('rule-note').textContent = R.note;
  });

  // Figure 2: IPR4 and SHPR3, bit by bit
  const G = svg(viz('regs'), 760, 206, { label: 'NVIC IPR4 = 0x40000080 and SCB SHPR3 = 0xC0000000 bit by bit, with the 2-bit priority fields', minWidth: 580 });
  const cell = 17, bgap = 8, x0 = 160;
  const bxp = b => x0 + (31 - b) * cell + Math.floor((31 - b) / 8) * bgap;
  const REGS = [
    { y: 40, name: 'NVIC IPR4', v: 0x40000080, bytes: ['IRQ 19 · TIM14', 'IRQ 18', 'IRQ 17', 'IRQ 16 · TIM3'], prio: { 3: 'TIM14', 0: 'TIM3' } },
    { y: 132, name: 'SCB SHPR3', v: 0xC0000000, bytes: ['SysTick', 'PendSV', 'reserved', 'reserved'], prio: { 3: 'SysTick' } },
  ];
  REGS.forEach(R => {
    s('text', { x: 0, y: R.y + 6, class: 't-fg t-bold' }, G, R.name);
    s('text', { x: 0, y: R.y + 20, class: 't-fg' }, G, '= 0x' + (R.v >>> 0).toString(16).toUpperCase().padStart(8, '0'));
    for (let byte = 3; byte >= 0; byte--) {
      const xb = bxp(byte * 8 + 7), used = byte in R.prio;
      s('text', { x: xb + 4 * cell, y: R.y - 8, 'text-anchor': 'middle', class: used ? 't-fg t-bold' : 't-sm' }, G, R.bytes[3 - byte]);
      for (let b = byte * 8 + 7; b >= byte * 8; b--) {
        const bit = (R.v >>> b) & 1, impl = b % 8 >= 6;
        s('rect', { x: bxp(b), y: R.y, width: cell, height: 22, class: (bit ? 'f-pri' : 'f-seg') + ' sep', style: impl ? null : 'opacity: 0.4' }, G);
        s('text', { x: bxp(b) + cell / 2, y: R.y + 11, dy: '0.35em', 'text-anchor': 'middle', class: bit ? 't-on t-bold' : 't-muted', style: 'font-size: 10px' }, G, String(bit));
      }
      if (used) {
        const xf = bxp(byte * 8 + 7), p = (R.v >>> (byte * 8 + 6)) & 3;
        s('rect', { x: xf - 1, y: R.y - 2, width: 2 * cell + 2, height: 26, rx: 3, class: 'f-none outline-sec' }, G);
        s('text', { x: xf, y: R.y + 38, class: 't-sec t-bold' }, G, `${p.toString(2).padStart(2, '0')} = prio ${p}`);
        s('text', { x: xf + 4 * cell, y: R.y + 52, 'text-anchor': 'middle', class: 't-sm' }, G, `byte 0x${((p << 6) >>> 0).toString(16).toUpperCase().padStart(2, '0')} = ${p} << 6`);
      }
    }
  });
});

QV.register('s3-mc26', function (q) {
  const { s, svg, steps, fmt } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const sp = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const hex = v => '0x' + (v >>> 0).toString(16).toUpperCase();
  const F = 48e6, MASK = 0xFFFFFF;

  // Figure 1: the 24-bit LOAD
  const W = svg(viz('load'), 760, 236, { label: 'SysTick reload value asked for and what LOAD holds, bit by bit, and LD4 over 3 seconds', minWidth: 580 });
  const cell = 19, x0 = 140, r1 = 22, r2 = 82, rh = 24;
  const bx = b => x0 + (31 - b) * cell;
  for (let b = 31; b >= 0; b--) s('text', { x: bx(b) + cell / 2, y: 14, 'text-anchor': 'middle', class: 't-sm' }, W, String(b));
  s('text', { x: 0, y: r1 + 8, class: 't-fg t-bold' }, W, 'asked for');
  s('text', { x: 0, y: r1 + 22, class: 't-sm' }, W, 'ticks − 1');
  s('text', { x: 0, y: r2 + 8, class: 't-fg t-bold' }, W, 'LOAD holds');
  s('text', { x: 0, y: r2 + 22, class: 't-sm' }, W, 'RELOAD, 23:0');
  s('rect', { x: bx(31) + 1, y: r2 + 1, width: 8 * cell - 2, height: rh - 2, rx: 3, class: 'f-none s-muted dash' }, W);
  s('text', { x: bx(31) + 4 * cell, y: r2 + rh / 2, dy: '0.35em', 'text-anchor': 'middle', class: 't-muted' }, W, 'no bits here');
  const T = { x0: 140, x1: 740, hi: 160, lo: 182, axis: 194 };
  const tx = t => T.x0 + t / 3 * (T.x1 - T.x0);
  s('text', { x: 0, y: (T.hi + T.lo) / 2, dy: '0.35em', class: 't-fg t-bold' }, W, 'LD4');
  s('line', { x1: T.x0, x2: T.x1, y1: T.axis, y2: T.axis, class: 'l-axis' }, W);
  [0, 0.5, 1, 1.5, 2, 2.5, 3].forEach(t => {
    s('line', { x1: tx(t), x2: tx(t), y1: T.axis, y2: T.axis + 5, class: 'l-axis' }, W);
    s('text', { x: tx(t), y: T.axis + 18, 'text-anchor': 'middle' }, W, String(t));
  });
  s('text', { x: (T.x0 + T.x1) / 2, y: T.axis + 36, 'text-anchor': 'middle' }, W, 'time (s)');
  const layer = s('g', {}, W);

  const OPTS = [
    { key: 'A', ask: 47999999, load: null, period: null,
      calc: ['SysTick_Config(48 000 000):  ticks − 1 = 47 999 999 = 0x2DC6BFF',
        '24-bit maximum               0xFFFFFF   = 16 777 215',
        '47 999 999 > 16 777 215  →  return 1: LOAD, VAL, CTRL not written',
        'SysTick never starts, SysTick_Handler never runs, LD4 never toggles'] },
    { key: 'B', ask: 47999, load: 47999, period: 1,
      calc: ['SysTick_Config(48 000 000 / 1000):  ticks − 1 = 47 999 = 0xBB7F  fits',
        'tick = 48 000 / 48 MHz = 1 ms; SysTick_Handler: ms_ticks++',
        'loop: now − beat_at ≥ 1000  →  beat_at += 1000, toggle LD4',
        'LD4 toggles at 1000, 2000, 3000 ms; a print only delays a toggle'] },
    { key: 'D', ask: 47999999, load: 47999999 & MASK, period: ((47999999 & MASK) + 1) / F,
      calc: ['LOAD = 47 999 999 = 0x2DC6BFF; LOAD has no bits 31:24',
        'kept: 0x2DC6BFF & 0xFFFFFF = 0xDC6BFF = 14 445 567',
        'period = 14 445 568 / 48 MHz = 0.301 s',
        'LD4 toggles every 0.3 s, about 3.3 times a second'] },
  ];
  const drawRow = (v, y, maxBit, lostFrom) => {
    for (let b = maxBit; b >= 0; b--) {
      const bit = (v >>> b) & 1, lost = b >= lostFrom;
      if (b > 27 && !bit) continue;
      s('rect', { x: bx(b), y, width: cell, height: rh, class: (lost ? (bit ? 'f-bad-soft' : 'f-none') : (bit ? 'f-pri' : 'f-seg')) + ' sep' }, layer);
      s('text', { x: bx(b) + cell / 2, y: y + rh / 2, dy: '0.35em', 'text-anchor': 'middle', class: lost ? (bit ? 't-bad t-bold' : 't-muted') : (bit ? 't-on t-bold' : 't-muted'), style: 'font-size: 10px' }, layer, String(bit));
    }
  };
  steps(viz('load-steps'), ['A · SysTick_Config(SystemCoreClock)', 'B · 1 ms tick, count 1000', 'D · LOAD = SystemCoreClock − 1'], k => {
    const o = OPTS[k];
    layer.textContent = '';
    drawRow(o.ask, r1, 27, 24);
    const big = o.ask > MASK;
    s('text', { x: x0, y: r1 + rh + 14, class: big ? 't-bad t-bold' : 't-fg' }, layer,
      `${sp(o.ask)} = ${hex(o.ask)}: ` + (big ? 'needs 26 bits, more than 24' : 'fits in 24 bits'));
    if (o.load == null) {
      for (let b = 23; b >= 0; b--) s('rect', { x: bx(b), y: r2, width: cell, height: rh, class: 'f-seg sep', style: 'opacity: 0.45' }, layer);
      s('text', { x: bx(12), y: r2 + rh / 2, dy: '0.35em', 'text-anchor': 'middle', class: 't-bad t-bold halo' }, layer, 'not written: SysTick_Config returned 1');
    } else {
      drawRow(o.load, r2, 23, 99);
      s('text', { x: x0, y: r2 + rh + 14, class: big ? 't-bad t-bold' : 't-ok t-bold' }, layer,
        `${sp(o.load)} = ${hex(o.load)}` + (big ? ': bits 25:24 dropped' : ': as asked'));
    }
    let d = `M${T.x0} ${T.lo}`, lvl = 0;
    if (o.period) {
      for (let t = o.period; t <= 3 + 1e-9; t += o.period) {
        const y0 = lvl ? T.hi : T.lo, y1 = lvl ? T.lo : T.hi;
        d += ` L${tx(t).toFixed(1)} ${y0} L${tx(t).toFixed(1)} ${y1}`;
        lvl = 1 - lvl;
      }
    }
    d += ` L${T.x1} ${lvl ? T.hi : T.lo}`;
    s('path', { d, class: o.key === 'B' ? 's-ok' : 's-bad', style: 'stroke-width: 2' }, layer);
    const msg = o.key === 'A' ? 'never toggles' : o.key === 'B' ? 'toggles once a second' : 'toggles every ' + fmt(o.period, 3) + ' s';
    s('text', { x: T.x0 + 6, y: o.period ? T.hi - 8 : T.lo - 8, class: (o.key === 'B' ? 't-ok' : 't-bad') + ' t-bold' }, layer, msg);
    role('load-calc').textContent = o.calc.join('\n');
  });

  // Figure 2: polled COUNTFLAG against the interrupt, around one print
  const P = svg(viz('poll'), 760, 262, { label: 'SysTick wraps over 20 ms, an 8 ms print in the loop, and the milliseconds counted by polling and by the interrupt', minWidth: 580 });
  const X0 = 150, PX = 29, px = t => X0 + t * PX;
  const Y = { val: [22, 46], loop: 62, lh: 22, ev: 104, cnt: [146, 196], axis: 210 };
  [['SysTick VAL', Y.val[0] + 12], ['main loop', Y.loop + 11], ['', Y.ev + 11], ['ms counted', (Y.cnt[0] + Y.cnt[1]) / 2]]
    .forEach(([t, y]) => t && s('text', { x: 0, y, dy: '0.35em', class: 't-fg t-bold' }, P, t));
  let saw = `M${px(0)} ${Y.val[0]}`;
  for (let t = 1; t <= 20; t++) saw += ` L${px(t)} ${Y.val[1]} L${px(t)} ${Y.val[0]}`;
  s('path', { d: saw, class: 's-pri', style: 'stroke-width: 1.5' }, P);
  s('rect', { x: px(0), y: Y.loop, width: px(20) - px(0), height: Y.lh, class: 'f-seg' }, P);
  s('rect', { x: px(5.5), y: Y.loop, width: px(13.5) - px(5.5), height: Y.lh, class: 'f-sec' }, P);
  s('text', { x: px(9.5), y: Y.loop + Y.lh / 2, dy: '0.35em', 'text-anchor': 'middle', class: 't-on t-bold' }, P, 'printf, 8 ms');
  s('text', { x: px(2.75), y: Y.loop + Y.lh / 2, dy: '0.35em', 'text-anchor': 'middle', class: 't-muted' }, P, 'jobs');
  s('text', { x: px(16.75), y: Y.loop + Y.lh / 2, dy: '0.35em', 'text-anchor': 'middle', class: 't-muted' }, P, 'jobs');
  s('line', { x1: px(0), x2: px(20), y1: Y.axis, y2: Y.axis, class: 'l-axis' }, P);
  [0, 5, 10, 15, 20].forEach(t => {
    s('line', { x1: px(t), x2: px(t), y1: Y.axis, y2: Y.axis + 5, class: 'l-axis' }, P);
    s('text', { x: px(t), y: Y.axis + 18, 'text-anchor': 'middle' }, P, String(t));
  });
  s('text', { x: px(10), y: Y.axis + 36, 'text-anchor': 'middle' }, P, 'time (ms)');
  const cy = n => Y.cnt[1] - n / 20 * (Y.cnt[1] - Y.cnt[0]);
  s('line', { x1: px(0), x2: px(20), y1: cy(20), y2: cy(20), class: 'l-grid' }, P);
  s('text', { x: px(0) - 6, y: cy(20), dy: '0.35em', 'text-anchor': 'end', class: 't-sm' }, P, '20');
  s('text', { x: px(0) - 6, y: cy(0), dy: '0.35em', 'text-anchor': 'end', class: 't-sm' }, P, '0');
  const pl = s('g', {}, P);

  const inPrint = t => t > 5.5 && t < 13.5;
  const MODES = [
    { name: 'COUNTFLAG', counted: 13, sub: 'by the loop, polling',
      note: 'Option C. Outside the print the loop reads COUNTFLAG right after each wrap and counts it. During the print nobody asks: COUNTFLAG is set at 6 ms and stays 1, and the wraps at 7 to 13 ms set a bit that is already set. When the loop comes back at 13.5 ms it counts one. 8 wraps, 1 counted, 7 ms gone for good, on every print.' },
    { name: 'SysTick_Handler', counted: 20, sub: 'by the interrupt',
      note: 'Option B. Every wrap forces SysTick_Handler to run, whatever the loop is doing, and ms_ticks++ takes a fraction of a microsecond. The print is interrupted 8 times and never notices. The loop then compares now − beat_at with 1000, so the heartbeat stays on its 1000 ms grid.' },
  ];
  steps(viz('poll-steps'), ['C · poll COUNTFLAG', 'B · SysTick interrupt'], k => {
    const M = MODES[k], hi = Y.ev + 2, lo = Y.ev + 20;
    pl.textContent = '';
    s('text', { x: 0, y: Y.ev + 11, dy: '0.35em', class: 't-fg t-bold' }, pl, M.name);
    const seen = [];
    if (k === 0) {
      let d = `M${px(0)} ${lo}`;
      for (let t = 1; t <= 20; t++) {
        if (t === 6) {
          d += ` L${px(6)} ${lo} L${px(6)} ${hi} L${px(13.5)} ${hi} L${px(13.5)} ${lo}`;
          seen.push(13.5);
        } else if (inPrint(t)) {
          s('text', { x: px(t), y: Y.ev - 4, 'text-anchor': 'middle', class: 't-bad t-bold' }, pl, '×');
        } else {
          d += ` L${px(t)} ${lo} L${px(t)} ${hi} L${px(t + 0.12)} ${hi} L${px(t + 0.12)} ${lo}`;
          seen.push(t);
        }
      }
      d += ` L${px(20)} ${lo}`;
      s('path', { d, class: 's-pri', style: 'stroke-width: 2' }, pl);
      s('text', { x: px(13.5) + 4, y: Y.ev - 4, class: 't-pri t-bold' }, pl, 'read: counts 1');
    } else {
      for (let t = 1; t <= 20; t++) {
        s('rect', { x: px(t) - 1.5, y: Y.ev, width: 3, height: 22, class: 'f-pri' }, pl);
        seen.push(t);
      }
    }
    let d = `M${px(0)} ${cy(0)}`;
    seen.forEach((t, i) => { d += ` L${px(t).toFixed(1)} ${cy(i).toFixed(1)} L${px(t).toFixed(1)} ${cy(i + 1).toFixed(1)}`; });
    d += ` L${px(20)} ${cy(seen.length).toFixed(1)}`;
    s('path', { d: `M${px(0)} ${cy(0)} L${px(20)} ${cy(20)}`, class: 's-muted dash', style: 'stroke-width: 1' }, pl);
    s('text', { x: px(12) - 6, y: cy(12) - 8, 'text-anchor': 'end', class: 't-muted' }, pl, 'true time');
    s('path', { d, class: k === 0 ? 's-bad' : 's-ok', style: 'stroke-width: 2' }, pl);
    s('text', { x: px(20) + 6, y: cy(seen.length), dy: '0.35em', class: (k === 0 ? 't-bad' : 't-ok') + ' t-bold' }, pl, String(seen.length));
    role('counted').textContent = String(M.counted);
    role('counted').className = 'v ' + (k === 0 ? 'sec' : 'ok');
    role('counted-sub').textContent = M.sub;
    role('lost').textContent = (20 - M.counted) + ' ms';
    role('poll-note').textContent = M.note;
  });
});
