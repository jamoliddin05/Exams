QV.register('s2-mc12', function (q) {
  const { s, svg, steps, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const t = (g, x, y, text, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls }, g, text);

  const NAMES = ['R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12', 'SP', 'LR', 'PC', 'xPSR'];
  const HW = new Set(['R0', 'R1', 'R2', 'R3', 'R12', 'LR', 'PC', 'xPSR']);
  const callee = n => /^R([4-9]|1[01])$/.test(n);
  const R = { x: 20, w: 64, y0: 26, h: 15, gap: 1, ax: 94 };
  const ry = i => R.y0 + i * (R.h + R.gap);
  const S = { x: 440, w: 150, top: 40, h: 22, ox: 432, mx: 598 };
  const FRAME = ['xPSR', 'PC', 'LR', 'R12', 'R3', 'R2', 'R1', 'R0'];
  const OFF = ['+0x1C', '+0x18', '+0x14', '+0x10', '+0x0C', '+0x08', '+0x04', '+0x00'];
  const PUSH = ['LR = 0xFFFFFFF9', 'R4'];
  const sy = i => S.top + i * S.h;

  const W = svg(viz('regs'), 760, 306, { label: 'Core registers and the stack during one interrupt: the hardware stacks R0 to R3, R12, LR, PC, xPSR; the prologue pushes R4 and LR', minWidth: 580 });
  t(W, R.x, 12, 'core registers', 't-fg t-bold');
  t(W, S.x, 12, 'stack (MSP), higher addresses at the top', 't-fg t-bold');
  const dyn = s('g', {}, W);

  const ANN = [
    { R1: 'R0–R3 caller-saved', R7: 'R4–R11 callee-saved', R12: 'caller-saved (scratch)', SP: 'MSP in a handler', LR: 'caller-saved', PC: 'where to resume', xPSR: 'flags, exception no.' },
    { R1: "main()'s values", SP: 'MSP', LR: "main()'s LR", PC: 'next instruction of main()', xPSR: 'flags; exception no. 0' },
    { SP: 'MSP − 32', LR: '= 0xFFFFFFF9, EXC_RETURN', PC: '= handler, from vector table', xPSR: 'low bits = exception no.' },
    { R1: 'free to use: saved in frame', R4: 'saved by push {r4, lr}', SP: 'MSP − 40', LR: '0xFFFFFFF9, pushed too' },
    { R1: "main()'s values again", R4: 'popped by the epilogue', SP: 'back to the old SP', PC: 'back in main()', xPSR: "main()'s flags again" },
  ];
  const marker = (y, text) => {
    s('line', { x1: S.x - 4, x2: S.x + S.w + 4, y1: y, y2: y, class: 's-fg' }, dyn);
    t(dyn, S.mx, y, '← ' + text, 't-sm t-fg');
  };

  function draw(k) {
    dyn.textContent = '';
    NAMES.forEach((n, i) => {
      let f = 'f-seg', c = 't-fg';
      if (k === 0) [f, c] = HW.has(n) ? ['f-pri', 't-on'] : callee(n) ? ['f-sec-soft', 't-fg'] : ['f-seg', 't-fg'];
      if (k === 2 || k === 4) [f, c] = HW.has(n) ? ['f-pri', 't-on'] : ['f-seg', 't-fg'];
      if (k === 3) [f, c] = n === 'R4' ? ['f-sec', 't-on'] : callee(n) ? ['f-sec-soft', 't-fg'] : HW.has(n) ? ['f-pri-soft', 't-fg'] : ['f-seg', 't-fg'];
      s('rect', { x: R.x, y: ry(i), width: R.w, height: R.h, rx: 2, class: f }, dyn);
      t(dyn, R.x + R.w / 2, ry(i) + R.h / 2, n, c + ' t-sm', 'middle');
      const a = ANN[k][n];
      if (a) t(dyn, R.ax, ry(i) + R.h / 2, a, 't-sm t-fg');
    });
    if (k === 0 || k >= 2) {
      const g = s('g', { class: k === 4 ? 'dim' : null }, dyn);
      FRAME.forEach((n, i) => {
        s('rect', { x: S.x, y: sy(i), width: S.w, height: S.h, class: 'f-pri sep' }, g);
        t(g, S.x + S.w / 2, sy(i) + S.h / 2, n, 't-on', 'middle');
        t(g, S.ox, sy(i) + S.h / 2, OFF[i], 't-sm', 'end');
      });
      t(g, S.ox, S.top - 12, 'offset from SP after entry', 't-sm', 'end');
      if (k === 0 || k >= 3) PUSH.forEach((n, i) => {
        s('rect', { x: S.x, y: sy(8 + i), width: S.w, height: S.h, class: (k === 3 ? 'f-sec' : 'f-sec-soft') + ' sep' }, g);
        t(g, S.x + S.w / 2, sy(8 + i) + S.h / 2, n, k === 3 ? 't-on' : 't-fg', 'middle');
      });
    }
    marker(S.top, k === 4 ? 'SP back here' : 'old SP');
    if (k === 0 || k === 2 || k === 3) marker(sy(8), 'SP after entry, −32');
    if (k === 0 || k === 3) marker(sy(10), 'SP in handler, −40');
    const A = { 2: ['a-pri', 262, 424, 'hardware pushes', '8 words, 32 bytes'], 3: ['a-sec', 262, 424, 'prologue', 'push {r4, lr}'], 4: ['a-pri', 424, 262, 'hardware pops', 'the same 8 words'] }[k];
    if (A) {
      arrow(dyn, A[1], 150, A[2], 150, { cls: A[0], width: 2.5 });
      t(dyn, 343, 126, A[3], A[0].replace('a-', 't-') + ' t-bold', 'middle');
      t(dyn, 343, 172, A[4], A[0].replace('a-', 't-'), 'middle');
    }
  }

  const NOTE = [
    'Who saves what. AAPCS lets a called function destroy R0–R3, R12 and LR, and the hardware stacks exactly those, plus PC and xPSR. R4–R11 must come back unchanged, and any C function that uses them pushes them in its prologue. Together the two halves cover every register.',
    'main() is running. Any register may hold a value it still needs, and it cannot know an interrupt is coming.',
    'Entry. Between two instructions of main(), the hardware pushes R0–R3, R12, LR, PC and xPSR: 8 words, 32 bytes. It writes the exception number into the low bits of xPSR, loads LR with EXC_RETURN 0xFFFFFFF9 and jumps to the address in the vector table.',
    'Handler. TIM3_IRQHandler is compiled like any function. Its prologue pushes the callee-saved registers it uses, here push {r4, lr}. It may destroy R0–R3 and R12 freely, because main()\'s values are safe in the frame.',
    'Exit. The handler returns like any function. Loading EXC_RETURN into PC (bx lr, or pop {r4, pc}) tells the hardware to pop the 8 words. main() resumes with every register as it was and never knows the handler ran.',
  ];
  steps(viz('steps'), ['Who saves what', '1 · main() runs', '2 · Entry', '3 · Handler', '4 · Exit'], k => {
    draw(k);
    role('note').textContent = NOTE[k];
  }, 0);
});

QV.register('s2-mc13', function (q) {
  const { s, svg, steps, arrow, table } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const t = (g, x, y, text, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls }, g, text);

  const B = { y: 40, h: 32, hw: 150 };
  const BAR = { before: 30, after: 430 };
  const VAL = { before: ['0x00000000', '0xFFFFFFFF'], after: ['0x00000001', '0x00000000'] };
  const RES = { x: 230, y: 196 };
  const W = svg(viz('tear'), 760, 300, { label: 'ticks before and after the SysTick increment, and the torn value main assembles from one old and one new word', minWidth: 580 });
  t(W, BAR.before + B.hw, 12, 'before: 0x00000000_FFFFFFFF', 't-fg t-bold', 'middle');
  t(W, BAR.after + B.hw, 12, 'after SysTick: 0x00000001_00000000', 't-fg t-bold', 'middle');
  ['before', 'after'].forEach(k => ['high word, addr + 4', 'low word, addr'].forEach((l, i) => t(W, BAR[k] + i * B.hw + B.hw / 2, 29, l, 't-sm', 'middle')));
  arrow(W, 336, 56, 424, 56, { cls: 'a-sec', width: 2, label: 'ticks++', labelCls: 't-sec t-bold' });
  t(W, RES.x - 8, RES.y + B.h / 2, 'main() gets', 't-fg t-bold', 'end');
  const dyn = s('g', {}, W);
  const half = (x, y, text, fill, cls) => {
    s('rect', { x, y, width: B.hw, height: B.h, class: fill + ' sep' }, dyn);
    t(dyn, x + B.hw / 2, y + B.h / 2, text, cls, 'middle');
  };

  const ORDER = [
    { picks: [['before', 1], ['after', 0]], res: '0x00000001_FFFFFFFF', dec: '= 8 589 934 591, about twice the true 4 294 967 296', tail: 'half old, half new: a value nobody ever stored',
      seq: ['main()    ldr r0, [r2]       ; low word  → 0xFFFFFFFF  (old)',
        'SysTick   ticks++            ; 0x00000000_FFFFFFFF → 0x00000001_00000000',
        'main()    ldr r1, [r2, #4]   ; high word → 0x00000001  (new)',
        'result    r1:r0 = 0x00000001_FFFFFFFF = 8 589 934 591, never stored'] },
    { picks: [['before', 0], ['after', 1]], res: '0x00000000_00000000', dec: '= 0, the count seems to jump backwards', tail: 'the same tearing, the other way round (option D)',
      seq: ['main()    ldr r1, [r2, #4]   ; high word → 0x00000000  (old)',
        'SysTick   ticks++            ; 0x00000000_FFFFFFFF → 0x00000001_00000000',
        'main()    ldr r0, [r2]       ; low word  → 0x00000000  (new)',
        'result    r1:r0 = 0x00000000_00000000 = 0, the count went backwards'] },
  ];

  steps(viz('steps'), ['Low word first (this question)', 'High word first'], k => {
    dyn.textContent = '';
    const o = ORDER[k];
    const picked = (bar, i) => o.picks.some(([b, j]) => b === bar && j === i);
    ['before', 'after'].forEach(bar => VAL[bar].forEach((v, i) => {
      const on = picked(bar, i), old = bar === 'before';
      half(BAR[bar] + i * B.hw, B.y, v, on ? (old ? 'f-pri' : 'f-sec') : (old ? 'f-pri-soft' : 'f-sec-soft'), on ? 't-on t-bold' : 't-fg');
    }));
    o.picks.forEach(([bar, i], n) => {
      const sx = BAR[bar] + i * B.hw + B.hw / 2, dx = RES.x + i * B.hw + B.hw / 2, old = bar === 'before';
      t(dyn, sx, 88, (n ? '2nd' : '1st') + ' load', (old ? 't-pri' : 't-sec') + ' t-bold', 'middle');
      arrow(dyn, sx, 98, dx, RES.y - 4, { cls: old ? 'a-pri' : 'a-sec', width: 2 });
      half(RES.x + i * B.hw, RES.y, VAL[bar][i], old ? 'f-pri' : 'f-sec', 't-on t-bold');
    });
    t(dyn, RES.x + B.hw, 248, '= ' + o.res, 't-bad t-bold t-lg', 'middle');
    t(dyn, RES.x + B.hw, 268, o.dec, 't-fg', 'middle');
    t(dyn, RES.x + B.hw, 286, o.tail, 't-muted', 'middle');
    role('seq').textContent = o.seq.join('\n');
  }, 0);

  const L = c => ({ text: c, cls: 'l' });
  const tb = table(viz('table'), ['Situation', 'Bus accesses', 'Safe?'].map(L), [
    ['ISR writes a uint8_t, main only reads it', '1', 'Yes: single aligned access, one writer'],
    ['ISR sets a flag, main reads and clears it', '1 read, 1 write', 'Usually: the clear is read-modify-write'],
    ['main does counter++, ISR also increments', 'ldr, adds, str', 'No: the lost update'],
    ['main reads a uint64_t the ISR writes', '2 loads', 'No: tearing, you can read half'],
    ['either side touches a multi-field struct', 'one per field', 'No: tearing, seen half-updated'],
  ].map(r => r.map(L)));
  tb.rows[3].classList.add('on');
});

QV.register('s2-mc14', function (q) {
  const { s, svg, steps, arrow, table } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const t = (g, x, y, text, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || 'start', class: cls }, g, text);

  const T = { x0: 112, sw: 68, n: 9, bh: 26, lanes: { main: 30, isr: 70, irq: 108, pm: 146, ram: 186 } };
  const sx = i => T.x0 + i * T.sw;
  const W = svg(viz('timeline'), 760, 236, { label: 'Timeline of main, the handler, the pending request, PRIMASK and counter, with and without masking', minWidth: 580 });
  [['main()', 'main', 't-pri'], ['handler()', 'isr', 't-sec'], ['timer request', 'irq', 't-fg'], ['PRIMASK bit 0', 'pm', 't-fg'], ['counter', 'ram', 't-fg']].forEach(([l, k, c]) => t(W, 0, T.lanes[k], l, c + ' t-bold'));
  arrow(W, T.x0, 222, sx(T.n), 222, { cls: 'a-muted' });
  t(W, sx(T.n) + 6, 222, 'time', 't-muted');
  const dyn = s('g', {}, W);
  const cell = (i, lane, text, fill, cls) => {
    const x = sx(i) + 2, w = T.sw - 4, y = T.lanes[lane] - T.bh / 2;
    s('rect', { x, y, width: w, height: T.bh, rx: 3, class: fill }, dyn);
    t(dyn, x + w / 2, T.lanes[lane], text, cls, 'middle');
  };

  const V = [
    { main: ['ldr ; 5', '', '', '', 'adds ; 6', 'str ; 6', '', '', ''], isr: ['', 'ldr ; 5', 'adds ; 6', 'str ; 6', '', '', '', '', ''],
      pm: [0, 0, 0, 0, 0, 0, 0, 0, 0], ram: ['5', '5', '5', '6', '6', '6', '', '', ''], req: 1, taken: 1, last: 5, ok: false },
    { main: ['cpsid i', 'ldr ; 5', 'adds ; 6', 'str ; 6', 'cpsie i', '', '', '', 'next'], isr: ['', '', '', '', '', 'ldr ; 6', 'adds ; 7', 'str ; 7', ''],
      pm: [1, 1, 1, 1, 0, 0, 0, 0, 0], ram: ['5', '5', '5', '6', '6', '6', '6', '7', ''], req: 2, taken: 5, last: 7, ok: true },
  ];
  const NOTE = [
    'No protection. The request is taken right after main()\'s ldr. The handler increments 5 to 6, then main() stores its own stale 6 over it. One update is lost: 6 instead of 7.',
    '__disable_irq() executes cpsid i and PRIMASK bit 0 becomes 1. The request arrives right after the ldr, but no configurable interrupt is taken while the bit is set, so the NVIC holds it pending. cpsie i clears the bit, the handler runs at once, reads 6 and stores 7. Nothing is lost.',
  ];

  steps(viz('steps'), ['No protection', '__disable_irq() / __enable_irq()'], k => {
    dyn.textContent = '';
    const v = V[k];
    for (let i = 0; i < T.n; i++) {
      const m = v.main[i];
      if (m) cell(i, 'main', m, /cps/.test(m) ? 'f-pri' : m === 'next' ? 'f-seg' : 'f-pri-soft', /cps/.test(m) ? 't-on t-bold' : 't-fg');
      if (v.isr[i]) cell(i, 'isr', v.isr[i], 'f-sec-soft', 't-fg');
      cell(i, 'pm', String(v.pm[i]), v.pm[i] ? 'f-pri' : 'f-seg', v.pm[i] ? 't-on t-bold' : 't-muted');
      if (v.ram[i]) {
        const end = i === v.last;
        cell(i, 'ram', v.ram[i], end ? (v.ok ? 'f-ok' : 'f-bad') : 'f-seg', end ? 't-on t-bold' : 't-fg');
      }
    }
    const rx = sx(v.req), ty = T.lanes.irq;
    s('circle', { cx: rx, cy: ty, r: 5, class: 'f-sec' }, dyn);
    if (v.taken > v.req) {
      s('rect', { x: rx, y: ty - 9, width: sx(v.taken) - rx, height: 18, rx: 3, class: 's-sec dash' }, dyn);
      t(dyn, (rx + sx(v.taken)) / 2, ty, 'held pending', 't-sec', 'middle');
    }
    arrow(dyn, sx(v.taken), ty - 6, sx(v.taken), T.lanes.isr + T.bh / 2 + 1, { cls: 'a-sec', width: 2 });
    t(dyn, sx(v.last + 1) + 6, T.lanes.ram, v.ok ? '7: both kept' : 'should be 7', (v.ok ? 't-ok' : 't-bad') + ' t-bold');
    role('note').textContent = NOTE[k];
  }, 1);

  const L = c => ({ text: c, cls: 'l' });
  const tb = table(viz('table'), ['Option', 'Tool', 'Made for', 'On this chip'].map(L), [
    ['A', 'volatile', 'the compiler: every access must happen', 'no: accesses are real, the update is still lost'],
    ['B', 'mutex', 'two threads under one OS', 'no: the hardware starts an ISR without the scheduler'],
    ['C', 'ldrex / strex loop', 'two cores', 'no: the Cortex-M0+ has neither instruction'],
    ['D', 'cpsid i / cpsie i (PRIMASK bit 0)', 'ISR vs main(), one core', 'yes: the ISR cannot start inside the region'],
  ].map(r => r.map(L)));
  tb.rows[3].classList.add('on');
});
