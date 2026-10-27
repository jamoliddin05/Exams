QV.register('s1-mc12', function (q) {
  const { s, svg, steps } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const t = (g, x, y, text, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls }, g, text);
  const P = { x0: 140, cw: 66, n: 8, rows: [30, 72, 114], rh: 30, isr: 3 };
  const cx = i => P.x0 + i * P.cw;

  const W = svg(viz('passes'), 760, 182, { label: 'Eight passes of the wait loop: the value in RAM, whether RAM is loaded, and the value the loop tests', minWidth: 560 });
  t(W, 0, 12, 'loop pass', 't-muted');
  for (let i = 0; i < P.n; i++) t(W, cx(i) + P.cw / 2, 12, String(i + 1), 't-fg t-bold', 'middle');
  ['done in RAM', 'load from RAM', 'value tested'].forEach((l, r) => t(W, 0, P.rows[r] + P.rh / 2, l, 't-fg t-bold'));
  const layer = s('g', {}, W);
  const xi = cx(P.isr);
  s('line', { x1: xi, x2: xi, y1: 22, y2: 152, class: 's-sec dash', style: 'stroke-width: 2' }, W);
  t(W, xi, 168, 'ISR runs here: done = 1', 't-sec t-bold', 'middle');

  const cell = (x, y, w, fill, cls, text) => {
    s('rect', { x, y, width: w, height: P.rh, rx: 3, class: fill }, layer);
    t(layer, x + w / 2, y + P.rh / 2, text, cls, 'middle');
  };

  function draw(vol) {
    layer.textContent = '';
    for (let i = 0; i < P.n; i++) {
      const x = cx(i) + 3, w = P.cw - 6, ram = i >= P.isr ? 1 : 0;
      cell(x, P.rows[0], w, ram ? 'f-sec' : 'f-seg', ram ? 't-on t-bold' : 't-fg', String(ram));
      if (vol && i > P.isr) continue;
      const load = vol || i === 0;
      cell(x, P.rows[1], w, load ? 'f-pri' : 'f-seg', load ? 't-on' : 't-muted', load ? 'ldrb' : 'none');
      const val = load ? ram : 0, stale = !vol && ram === 1, ok = vol && val === 1;
      cell(x, P.rows[2], w, ok ? 'f-ok' : stale ? 'f-bad-soft' : 'f-seg', ok ? 't-on t-bold' : stale ? 't-bad t-bold' : 't-fg', String(val));
    }
    if (vol) {
      t(layer, cx(P.isr + 1) + 8, P.rows[1] + P.rh / 2, 'loop exits after pass 4', 't-ok t-bold');
      t(layer, cx(P.isr + 1) + 8, P.rows[2] + P.rh / 2, '→ led_on() runs', 't-ok t-bold');
    } else {
      t(layer, cx(P.n) + 8, P.rows[2] + P.rh / 2, '… forever', 't-bad t-bold');
    }
  }

  const ASM = [
    ['    ldrb r1, [r0]      ; read done once, before the loop',
      '1:  cmp  r1, #0        ; test the register copy',
      '    beq  1b            ; r1 never changes: spins forever',
      '    bl   led_on'].join('\n'),
    ['1:  ldrb r1, [r0]      ; read done on every pass',
      '    cmp  r1, #0',
      '    beq  1b            ; still 0: load again',
      '    bl   led_on'].join('\n'),
  ];
  const NOTE = [
    'Plain uint8_t. The loop body never writes done, so the compiler reads it once and tests the register copy. RAM holds 1 from pass 4 on, but the loop never looks at RAM again and spins forever. gcc even turns it into a branch to itself, and clang may delete the loop. All of these are legal under the as-if rule.',
    'volatile uint8_t. Every pass really loads done from RAM. Pass 4 loads the 1 the ISR wrote, the test fails, and led_on() runs. One load per pass is exactly what the source asked for.',
  ];
  steps(viz('steps'), ['uint8_t done', 'volatile uint8_t done'], k => {
    draw(k === 1);
    role('asm').textContent = ASM[k];
    role('note').textContent = NOTE[k];
  }, 0);
});

QV.register('s1-mc13', function (q) {
  const { s, svg, steps, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const t = (g, x, y, text, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls }, g, text);

  // Figure 1: the interleaving, one row per instruction
  const ROWS = [
    { m: 'ldr  r0, [r1]   ; r0 = 40', h: '', r0: '40', ram: '40' },
    { m: 'interrupted here', gap: true, h: 'ldr   ; reads 40', r0: '40', ram: '40' },
    { m: '', h: 'adds  ; 40 + 3 = 43', r0: '40', ram: '40' },
    { m: '', h: 'str   ; writes 43', r0: '40', ram: '43', isr: true },
    { m: 'adds r0, #1     ; r0 = 41', h: '', r0: '41', ram: '43' },
    { m: 'str  r0, [r1]   ; writes 41', h: '', r0: '41', ram: '41', bad: true },
  ];
  const C = { mx: 34, mw: 250, hx: 304, hw: 230, rx: 556, rw: 84, kx: 656, kw: 96, y0: 34, rh: 34, bh: 28 };
  const L = svg(viz('lanes'), 760, 240, { label: 'Interleaving of main and the handler: main loads 40, the handler stores 43, main stores 41', minWidth: 580 });
  t(L, C.mx, 16, 'main()', 't-pri t-bold');
  t(L, C.hx, 16, 'handler()', 't-sec t-bold');
  t(L, C.rx + C.rw / 2, 16, "main's r0", 't-fg t-bold', 'middle');
  t(L, C.kx + C.kw / 2, 16, 'counter in RAM', 't-fg t-bold', 'middle');
  const groups = ROWS.map((r, i) => {
    const g = s('g', { class: 'fade' }, L), y = C.y0 + i * C.rh;
    t(g, 14, y + C.bh / 2, String(i + 1), 't-muted', 'middle');
    if (r.gap) {
      s('rect', { x: C.mx, y, width: C.mw, height: C.bh, rx: 4, class: 's-muted dash' }, g);
      t(g, C.mx + C.mw / 2, y + C.bh / 2, r.m, 't-muted', 'middle');
    } else if (r.m) {
      s('rect', { x: C.mx, y, width: C.mw, height: C.bh, rx: 4, class: 'f-pri-soft' }, g);
      t(g, C.mx + 10, y + C.bh / 2, r.m, 't-fg');
    }
    if (r.h) {
      s('rect', { x: C.hx, y, width: C.hw, height: C.bh, rx: 4, class: 'f-sec-soft' }, g);
      t(g, C.hx + 10, y + C.bh / 2, r.h, 't-fg');
    }
    s('rect', { x: C.rx, y, width: C.rw, height: C.bh, rx: 4, class: 'f-seg' }, g);
    t(g, C.rx + C.rw / 2, y + C.bh / 2, r.r0, 't-pri t-bold', 'middle');
    s('rect', { x: C.kx, y, width: C.kw, height: C.bh, rx: 4, class: r.bad ? 'f-bad' : r.isr ? 'f-sec' : 'f-seg' }, g);
    t(g, C.kx + C.kw / 2, y + C.bh / 2, r.ram + (r.bad ? ', not 44' : ''), r.bad || r.isr ? 't-on t-bold' : 't-fg', 'middle');
    return g;
  });
  const NOTE = [
    'All six steps. main() loads 40, the handler runs a complete ldr, adds, str and leaves 43, then main() finishes with its stale 40 and stores 41 over the 43.',
    'Step 1. main() loads counter into r0: 40.',
    'Step 2. The interrupt is taken between two of main()\'s instructions. The hardware stacks r0 with the other caller-saved registers, and the handler loads counter: still 40.',
    'Step 3. The handler adds 3 in its own register: 43. RAM still holds 40.',
    'Step 4. The handler stores 43 and returns. The hardware restores main()\'s r0, which still holds 40.',
    'Step 5. main() resumes and adds 1 to its copy: 41. Nothing tells it that RAM changed.',
    'Step 6. main() stores 41 over the 43. The handler\'s +3 is lost. The correct total is 40 + 3 + 1 = 44.',
  ];
  steps(viz('steps'), ['All', '1', '2', '3', '4', '5', '6'], k => {
    groups.forEach((g, i) => g.classList.toggle('dim', k > 0 && i !== k - 1));
    role('note').textContent = NOTE[k];
  }, 0);

  // Figure 2: the four places an interrupt can be taken
  const B = { x0: 40, w: 150, gap: 56, y: 72, h: 34 };
  const slot = i => B.x0 + i * (B.w + B.gap) + B.gap / 2;
  const bx = i => B.x0 + B.gap + i * (B.w + B.gap);
  const Wn = svg(viz('window'), 760, 182, { label: 'main executes ldr, adds, str; an interrupt taken after ldr or after adds gives 41, before ldr or after str gives 44', minWidth: 560 });
  s('rect', { x: bx(0) + B.w, y: B.y - 10, width: bx(2) - bx(0) - B.w, height: B.h + 20, rx: 6, class: 'f-bad-soft' }, Wn);
  ['ldr  r0, [r1]', 'adds r0, #1', 'str  r0, [r1]'].forEach((ins, i) => {
    s('rect', { x: bx(i), y: B.y, width: B.w, height: B.h, rx: 4, class: 'f-pri-soft box' }, Wn);
    t(Wn, bx(i) + B.w / 2, B.y + B.h / 2, ins, 't-fg', 'middle');
  });
  [['before ldr', 44], ['after ldr', 41], ['after adds', 41], ['after str', 44]].forEach(([name, v], i) => {
    const x = slot(i), c = v === 44 ? 'ok' : 'bad';
    t(Wn, x, 16, name, 't-' + c + ' t-bold', 'middle');
    arrow(Wn, x, 28, x, B.y - 2, { cls: 'a-' + c, width: 2 });
    t(Wn, x, 132, String(v), 't-' + c + ' t-bold t-lg', 'middle');
    t(Wn, x, 150, v === 44 ? '+3 kept' : '+3 lost', 't-' + c, 'middle');
  });
  t(Wn, (bx(0) + B.w + bx(2)) / 2, 172, 'the window: inside it the handler\'s update is overwritten', 't-bad', 'middle');
});

QV.register('s1-mc14', function (q) {
  const { s, svg, box, arrow, table } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const t = (g, x, y, text, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls }, g, text);

  const W = svg(viz('cores'), 760, 312, { label: 'Two cores increment the same counter; masking on core 0 does not stop core 1, so both store 6', minWidth: 580 });
  box(W, 30, 8, 250, 72, 'Core 0\ncpsid i: its PRIMASK = 1\nits own interrupts wait', { cls: 'f-pri-soft', lh: 18 });
  box(W, 480, 8, 250, 72, 'Core 1\nits PRIMASK is still 0\nnot stopped, keeps running', { cls: 'f-sec-soft', lh: 18 });
  box(W, 290, 102, 180, 36, 'counter in RAM', { cls: 'f-seg', textCls: 't-fg t-bold' });
  arrow(W, 190, 82, 288, 116, { cls: 'a-pri', width: 2 });
  arrow(W, 570, 82, 472, 116, { cls: 'a-sec', width: 2 });
  t(W, 226, 110, 'ldr / str', 't-pri', 'end');
  t(W, 534, 110, 'ldr / str', 't-sec');

  const T = { x0: 90, sw: 114, lanes: [188, 226, 264], bh: 28 };
  const sx = i => T.x0 + i * T.sw;
  [['core 0', 't-pri'], ['core 1', 't-sec'], ['counter', 't-fg']].forEach(([l, c], r) => t(W, 0, T.lanes[r], l, c + ' t-bold'));
  const C0 = ['cpsid i', 'ldr  ; 5', 'adds ; 6', 'str  ; 6', 'cpsie i'];
  const C1 = ['', 'ldr  ; 5', 'adds ; 6', 'str  ; 6', ''];
  const RAM = ['5', '5', '5', '6', '6'];
  for (let i = 0; i < 5; i++) {
    const x = sx(i) + 3, w = T.sw - 6;
    const mask = i === 0 || i === 4;
    s('rect', { x, y: T.lanes[0] - T.bh / 2, width: w, height: T.bh, rx: 4, class: mask ? 'f-seg' : 'f-pri-soft' }, W);
    t(W, x + w / 2, T.lanes[0], C0[i], mask ? 't-pri t-bold' : 't-fg', 'middle');
    if (C1[i]) {
      s('rect', { x, y: T.lanes[1] - T.bh / 2, width: w, height: T.bh, rx: 4, class: 'f-sec-soft' }, W);
      t(W, x + w / 2, T.lanes[1], C1[i], 't-fg', 'middle');
    }
    const last = i === 4;
    s('rect', { x, y: T.lanes[2] - T.bh / 2, width: w, height: T.bh, rx: 4, class: last ? 'f-bad' : 'f-seg' }, W);
    t(W, x + w / 2, T.lanes[2], RAM[i], last ? 't-on t-bold' : 't-fg', 'middle');
  }
  s('rect', { x: sx(1), y: T.lanes[0] - T.bh / 2 - 5, width: 3 * T.sw, height: T.bh + 10, rx: 6, class: 'f-none outline-pri dash' }, W);
  t(W, sx(5) + 6, T.lanes[2], 'should be 7', 't-bad t-bold');
  t(W, sx(1) + 1.5 * T.sw, 158, 'PRIMASK = 1 on core 0 only', 't-pri t-bold', 'middle');
  arrow(W, T.x0, 300, sx(5), 300, { cls: 'a-muted' });
  t(W, sx(5) + 6, 300, 'time', 't-muted');

  const L = c => ({ text: c, cls: 'l' });
  const tb = table(viz('table'), ['Contexts', 'How you get mutual exclusion', 'Why it works there'].map(L), [
    ['ISR vs main(), one core (this chip)', 'turn interrupts off: cpsid i sets PRIMASK bit 0', 'the other context cannot run if it cannot start'],
    ['two threads, one OS', 'a mutex', 'it asks the scheduler not to switch'],
    ['two cores', 'atomic read-modify-write: ldrex/strex, x86 lock cmpxchg', 'masking and mutexes act on one core; the other keeps running'],
  ].map(r => r.map(L)));
  tb.rows[2].classList.add('on');
});
