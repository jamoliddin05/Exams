QV.register('topic3', function (q) {
  const { s, svg, arrow, steps, table, axes } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const T = (g, x, y, text, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || null, class: cls || null }, g, text);
  const R = (g, x, y, w, h, cls, rx) => s('rect', { x, y, width: w, height: h, rx: rx == null ? 4 : rx, class: cls }, g);
  const hex = (v, n = 8) => '0x' + (v >>> 0).toString(16).toUpperCase().padStart(n, '0');
  const L = t => ({ text: t, cls: 'l' });
  // one figure failing must not blank the other nine
  const part = (name, f) => { try { f(); } catch (e) { QV.fail('topic3 ' + name, e); } };
  const chip = (g, x, y, w, h, text, fill, tcls) => {
    const r = R(g, x, y, w, h, fill);
    if (text) T(g, x + w / 2, y + h / 2, text, tcls, 'middle');
    return r;
  };
  const brace = (g, x1, x2, y, label, cls) => {
    s('path', { d: `M${x1} ${y - 4} V${y} H${x2} V${y - 4}`, class: 's-muted', style: 'stroke-width: 1' }, g);
    T(g, (x1 + x2) / 2, y + 11, label, cls || 't-sm', 'middle');
  };
  const KIND = {
    pri: ['f-pri-soft', 't-pri'], sec: ['f-sec-soft', 't-sec'], ter: ['f-ter-soft', 't-ter'], ctl: ['f-seg', 't-fg'],
    work: ['f-seg', 't-muted'], ok: ['f-ok-soft', 't-ok t-bold'], bad: ['f-bad-soft', 't-bad t-bold'],
  };

  // Figure 1: CPU time under polling, interrupt and DMA
  part('ways', () => {
    const g = svg(viz('ways'), 800, 250, { label: 'CPU time while waiting for a peripheral under polling, an interrupt and DMA', minWidth: 560 });
    const X0 = 120, X1 = 780, P = 48, H = 30;
    const LY = { poll: 40, int: 108, dma: 176 };
    const lanes = {};
    [['poll', 'POLL', 'asks, nothing else'], ['int', 'INTERRUPT', 'works until told'], ['dma', 'DMA', 'CPU not involved']].forEach(([k, a, b]) => {
      const gg = s('g', { class: 'fade' }, g);
      T(gg, 10, LY[k] + 9, a, 't-fg t-bold');
      T(gg, 10, LY[k] + 24, b, 't-sm');
      lanes[k] = { gg, dyn: s('g', {}, gg) };
    });
    T(g, X1, 14, 'time →', 't-sm', 'end');
    const top = s('g', {}, g);
    const seg = (gg, x, y, w, kind, text, h) => {
      const [f, t] = KIND[kind];
      chip(gg, x, y, w, h || H, w >= text.length * 6.6 + 6 ? text : '', f, t + (kind === 'poll' ? '' : ''));
    };
    const polls = (gg, a, b) => { for (let x = a; x + 44 <= b; x += P) seg(gg, x, LY.poll, 44, 'sec', 'ready?'); };
    const C = [
      { b: 'All', te: X0 + 6 * P, hi: null, br: [],
        note: 'Polling spends the wait asking. An interrupt lets the CPU work until the peripheral is done, then pays an entry and an exit around the handler. DMA keeps the CPU out of it. Pick a situation.' },
      { b: 'few-cycle wait', te: X0 + 2 * P, hi: 'poll', br: [['poll', X0, X0 + 2 * P - 4, 'the whole wait: two polls'], ['int', X0 + 2 * P, X0 + 2 * P + 190, 'entry and exit alone cost more than the wait']],
        note: 'FLASH->ACR has a new wait state, and LATENCY reads back the new value a few cycles later. The whole wait is shorter than an interrupt\'s entry and exit, and there is nothing else to do meanwhile, so the four-instruction polling loop wins.' },
      { b: 'button press', te: X0 + 11 * P, hi: 'int', br: [['poll', X0, X0 + 11 * P - 4, 'minutes of asking, nothing else done'], ['int', X0, X0 + 11 * P - 4, 'minutes of useful work, then the handler']],
        note: 'A user presses a button minutes from now, while main() has other work. Polling would burn those minutes asking. An interrupt lets main() work until the press and still catches it. The same holds for any edge that must not be missed.' },
      { b: '2 KB block', stream: true, hi: 'dma', br: [['poll', X0, X1, 'busy for the whole transfer'], ['int', X0, X1, 'an entry and an exit for every one of 2048 bytes']],
        note: 'A 2 KB block arrives byte by byte while the CPU runs a control loop. Polling keeps the CPU busy for the whole transfer, and one interrupt per byte pays 2048 entries and exits. DMA moves the bytes in hardware.' },
    ];
    const note = role('ways-note');
    steps(viz('ways-steps'), C.map(c => c.b), k => {
      const c = C[k], te = c.te;
      Object.values(lanes).forEach(l => { l.dyn.textContent = ''; });
      top.textContent = '';
      const lp = lanes.poll.dyn, li = lanes.int.dyn, ld = lanes.dma.dyn;
      if (c.stream) {
        for (let x = X0; x + 46 <= X1; x += 54) {
          s('line', { x1: x, x2: x, y1: 22, y2: 30, class: 's-muted' }, top);
          seg(li, x, LY.int, 12, 'ter', '');
          seg(li, x + 14, LY.int, 18, 'pri', '');
          seg(li, x + 34, LY.int, 12, 'ter', '');
        }
        T(top, X0, 14, 'a byte is ready, again and again', 't-sm');
        polls(lp, X0, X1);
        seg(ld, X0, LY.dma, X1 - X0, 'work', 'useful work, all the time');
        seg(ld, X0, LY.dma + 36, X1 - X0 - 80, 'pri', 'hardware: DMA moves 2 KB into RAM', 22);
      } else {
        s('line', { x1: te, x2: te, y1: 24, y2: 240, class: 's-muted dash', style: 'stroke-width: 1' }, top);
        T(top, te, 14, 'peripheral done', 't-fg', 'middle');
        polls(lp, X0, te);
        seg(lp, te + 4, LY.poll, 60, 'pri', 'handle');
        seg(lp, te + 68, LY.poll, X1 - te - 68, 'work', 'useful work');
        if (te - X0 > 8) seg(li, X0, LY.int, te - X0 - 4, 'work', 'useful work');
        seg(li, te, LY.int, 56, 'ter', 'entry');
        seg(li, te + 60, LY.int, 70, 'pri', 'handler');
        seg(li, te + 134, LY.int, 56, 'ter', 'exit');
        seg(li, te + 194, LY.int, X1 - te - 194, 'work', 'useful work');
        seg(ld, X0, LY.dma, X1 - X0, 'work', 'useful work');
        seg(ld, X0, LY.dma + 36, te - X0 - 4, 'pri', 'hardware: DMA moves the bytes', 22);
      }
      c.br.forEach(([ln, a, b, label]) => brace(lanes[ln].dyn, a, b, LY[ln] + H + 8, label, ln === c.hi ? 't-pri t-bold' : 't-sm'));
      Object.keys(lanes).forEach(n => lanes[n].gg.classList.toggle('dim', !!c.hi && c.hi !== n));
      note.textContent = c.note;
    });
  });

  // Figure 2: entry, vector, handler, return, with the stacked frame
  part('entry', () => {
    const g = svg(viz('entry'), 800, 314, { label: 'Interrupt entry and exit for TIM3: eight registers stacked, vector 32 read at 0x08000080, handler run, frame popped by bx lr to EXC_RETURN', minWidth: 560 });
    const F = [
      ['main() running', 'TIM3 fires: IRQ 16'],
      ['push 8 registers', 'R0–R3, R12, LR, PC, xPSR'],
      ['read the vector table', 'slot 32 at 0x08000080'],
      ['handler runs', 'TIM3_IRQHandler, on MSP'],
      ['pop and resume', 'bx lr to EXC_RETURN'],
    ];
    const fy = i => 14 + i * 56;
    const flow = F.map(([a, b], i) => {
      const gg = s('g', { class: 'fade' }, g);
      const r = R(gg, 24, fy(i), 230, 42, 'f-surface box', 6);
      T(gg, 139, fy(i) + 14, a, 't-fg t-bold', 'middle');
      T(gg, 139, fy(i) + 29, b, 't-sm', 'middle');
      if (i < 4) arrow(gg, 139, fy(i) + 42, 139, fy(i + 1) - 1, { cls: 'a-muted', head: 6 });
      return { gg, r };
    });
    s('path', { d: `M24 ${fy(4) + 21} H10 V${fy(0) + 21} H16`, class: 's-muted', style: 'stroke-width: 1.5' }, g);
    arrow(g, 14, fy(0) + 21, 23, fy(0) + 21, { cls: 'a-muted', head: 6 });

    T(g, 290, 20, 'CORE REGISTERS', 't-fg t-bold');
    const regs = ['SP', 'LR', 'PC', 'IPSR'].map((n, i) => {
      T(g, 290, 48 + i * 26, n, 't-fg t-bold');
      return T(g, 336, 48 + i * 26, '', 't-pri');
    });
    T(g, 290, 168, 'VECTOR TABLE', 't-fg t-bold');
    const vrows = [['0x0800007C', '[31]', '…'], ['0x08000080', '[32]', 'TIM3_IRQHandler'], ['0x08000084', '[33]', '…']].map(([a, sl, nm], i) => {
      const y = 180 + i * 26;
      const r = R(g, 290, y, 270, 24, 'f-seg', 3);
      const ts = [T(g, 298, y + 12, a, 't-muted'), T(g, 380, y + 12, sl, 't-fg'), T(g, 420, y + 12, nm, 't-fg')];
      return { r, ts };
    });

    T(g, 790, 12, 'stack (MSP), higher addresses up', 't-sm', 'end');
    const NAMES = ['main()\'s data', 'xPSR (flags)', 'PC (resume)', 'LR (main\'s)', 'R12', 'R3', 'R2', 'R1', 'R0'];
    const sy = i => 26 + i * 28;
    const cells = NAMES.map((n, i) => {
      const a = 0x20002FF0 - 4 * i;
      T(g, 676, sy(i) + 13, hex(a), 't-sm', 'end');
      const r = R(g, 682, sy(i), 108, 26, 'f-seg', 3);
      const t = T(g, 736, sy(i) + 13, i ? '' : n, 't-muted', 'middle');
      return { r, t, n };
    });
    const spg = s('g', {}, g);
    T(g, 400, 302, '8 registers × 4 bytes = 32 bytes:  0x20002FF0 − 0x20 = 0x20002FD0', 't-fg', 'middle');

    const MAINPC = 'main()\'s next instruction';
    const S = {
      run: { on: 0, sp: 0x20002FF0, lr: 'main()\'s value', pc: MAINPC, ipsr: '0, Thread mode', frame: 0, vec: false,
        note: 'main() runs in Thread mode on MSP with SP = 0x20002FF0 and IPSR = 0. TIM3 raises IRQ 16. The hardware acts between two instructions of main().' },
      push: { on: 1, sp: 0x20002FD0, lr: 'main()\'s value', pc: MAINPC, ipsr: '0', frame: 1, vec: false,
        note: 'The hardware pushes 8 words, so SP drops by 32, from 0x20002FF0 to 0x20002FD0. R0 lands at the lowest address and xPSR at the highest. The stacked PC is where main() will resume.' },
      vec: { on: 2, sp: 0x20002FD0, lr: '0xFFFFFFF9  EXC_RETURN', pc: 'word at 0x08000080', ipsr: '32 = 0x20', frame: 1, vec: true,
        note: 'Exception 16 + 16 = 32: IPSR becomes 32 = 0x20, and LR gets EXC_RETURN 0xFFFFFFF9 (back to Thread mode, MSP). The NVIC reads the word at 0x08000080 and jumps to it.' },
      hand: { on: 3, sp: 0x20002FD0, lr: '0xFFFFFFF9  EXC_RETURN', pc: 'inside TIM3_IRQHandler', ipsr: '32 = 0x20', frame: 1, vec: true,
        note: 'TIM3_IRQHandler is an ordinary C function. Its prologue pushes any of R4–R11 it uses below the frame, as every function does, and its last instruction is an ordinary bx lr.' },
      pop: { on: 4, sp: 0x20002FF0, lr: 'main()\'s value, restored', pc: MAINPC, ipsr: '0', frame: 2, vec: false,
        note: 'bx lr branches to 0xFFFFFFF9, which is not a code address. The hardware pops the 8 words: SP is back at 0x20002FF0, IPSR at 0, and main() resumes at the stacked PC as if nothing happened.' },
    };
    const ORDER = [null, 'run', 'push', 'vec', 'hand', 'pop'];
    const note = role('entry-note');
    steps(viz('entry-steps'), ['All', '1 event', '2 push 8', '3 vector', '4 handler', '5 return'], k => {
      const st = S[ORDER[k] || 'hand'];
      flow.forEach((f, i) => {
        const on = k > 0 && i === st.on;
        f.gg.classList.toggle('dim', k > 0 && !on);
        f.r.setAttribute('class', on ? 'f-pri-soft outline-pri' : 'f-surface box');
      });
      [hex(st.sp), st.lr, st.pc, st.ipsr].forEach((v, i) => { regs[i].textContent = v; });
      vrows.forEach((v, i) => {
        const on = i === 1 && st.vec;
        v.r.setAttribute('class', on ? 'f-pri' : 'f-seg');
        v.ts.forEach((t, j) => t.setAttribute('class', on ? 't-on' + (j ? ' t-bold' : '') : j ? 't-fg' : 't-muted'));
      });
      cells.forEach((c, i) => {
        if (!i) return;
        c.r.setAttribute('class', st.frame === 1 ? 'f-pri-soft' : 'f-seg');
        c.t.textContent = st.frame === 1 ? c.n : st.frame === 2 ? 'popped' : '';
        c.t.setAttribute('class', st.frame === 1 ? 't-pri t-bold' : 't-muted');
      });
      spg.textContent = '';
      const row = st.sp === 0x20002FF0 ? 0 : 8;
      T(spg, 582, sy(row) + 13, 'SP', 't-pri t-bold', 'end');
      arrow(spg, 586, sy(row) + 13, 610, sy(row) + 13, { cls: 'a-pri', head: 6, width: 2 });
      if (st.frame === 1) brace(spg, 682, 790, sy(9) + 6, '');
      note.textContent = st.note;
    });
  });

  // Figure 3: who preserves each register across an interrupt
  part('saves', () => {
    const g = svg(viz('saves'), 800, 196, { label: 'Core registers coloured by who preserves them across an interrupt: hardware stacking, the handler prologue, or neither', minWidth: 560 });
    T(g, 16, 14, 'R0–R15 and xPSR, by who preserves them when an interrupt arrives', 't-fg t-bold');
    const N = ['R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12', 'SP', 'LR', 'PC', 'xPSR'];
    const hw = [0, 1, 2, 3, 12, 14, 15, 16];
    const cx = i => 16 + i * 45;
    N.forEach((n, i) => {
      const kind = hw.indexOf(i) >= 0 ? ['f-pri', 't-on t-bold'] : i === 13 ? ['f-seg', 't-muted'] : ['f-sec-soft', 't-sec t-bold'];
      chip(g, cx(i), 34, 43, 32, n, kind[0], kind[1]);
    });
    brace(g, cx(0), cx(3) + 43, 76, 'caller-saved', 't-sm t-pri');
    brace(g, cx(4), cx(11) + 43, 76, 'callee-saved', 't-sm t-sec');
    brace(g, cx(12), cx(12) + 43, 76, 'caller', 't-sm t-pri');
    brace(g, cx(14), cx(14) + 43, 76, 'caller', 't-sm t-pri');
    brace(g, cx(15), cx(16) + 43, 76, 'added', 't-sm t-pri');
    const leg = [
      ['f-pri', 'stacked by the hardware on entry: R0–R3, R12, LR (caller-saved in AAPCS) plus PC and xPSR'],
      ['f-sec-soft', 'saved by the handler\'s own prologue, only the ones it uses: R4–R11 (callee-saved)'],
      ['f-seg', 'SP is not stacked: it moves down by 32 on entry and back up on return'],
    ];
    leg.forEach(([f, t], i) => {
      R(g, 16, 104 + i * 22, 14, 14, f + ' box', 2);
      T(g, 38, 111 + i * 22, t, 't-fg');
    });
    T(g, 16, 182, 'Nothing the interrupted code relies on changes, so the handler can be an ordinary C function.', 't-fg t-bold');
  });

  // Figure 4: plain flag read once, volatile flag read every pass
  part('asif', () => {
    const g = svg(viz('asif'), 800, 240, { label: 'A wait loop on a plain flag loads it once and spins forever; on a volatile flag it loads on every pass and exits after the ISR writes 1', minWidth: 560 });
    const X0 = 150, X1 = 780, XI = 520;
    T(g, 10, 33, 'uint8_t flag', 't-fg t-bold');
    T(g, 10, 48, 'plain, -Os', 't-sm');
    chip(g, X0, 26, 96, 28, 'ldrb r1, [r0]', 'f-pri-soft', 't-pri t-bold');
    let x = X0 + 104;
    for (; x + 34 <= X1 - 64; x += 40) chip(g, x, 26, 34, 28, 'b .', 'f-seg', 't-muted');
    T(g, X1, 40, 'hangs', 't-bad t-bold', 'end');
    arrow(g, X0 + 48, 95, X0 + 48, 56, { cls: 'a-pri', width: 2, head: 7 });
    T(g, X0 + 104, 70, 'r1 stays 0; RAM is never read again', 't-sm t-bad');

    chip(g, XI - 50, 60, 100, 22, 'ISR: flag = 1', 'f-sec-soft', 't-sec t-bold');
    arrow(g, XI, 82, XI, 95, { cls: 'a-sec', head: 6 });
    T(g, 10, 107, 'flag in RAM', 't-fg t-bold');
    chip(g, X0, 96, XI - X0, 22, 'flag = 0', 'f-seg', 't-fg');
    chip(g, XI, 96, X1 - XI, 22, 'flag = 1', 'f-sec-soft', 't-sec t-bold');

    T(g, 10, 157, 'volatile uint8_t', 't-fg t-bold');
    T(g, 10, 172, 'every pass reads', 't-sm');
    for (let k = 0; ; k++) {
      const px = X0 + 82 * k, v = px + 12 > XI ? 1 : 0;
      arrow(g, px + 12, 119, px + 12, 149, { cls: 'a-pri', head: 6, label: String(v), dx: 9, dy: 4, labelCls: v ? 't-ok t-bold' : 't-pri' });
      chip(g, px, 150, 74, 28, 'r1 = ' + v, v ? 'f-ok-soft' : 'f-pri-soft', v ? 't-ok t-bold' : 't-pri');
      if (v) {
        chip(g, px + 82, 150, 80, 28, 'led_on()', 'f-ok', 't-on t-bold');
        T(g, X1, 164, 'exits', 't-ok t-bold', 'end');
        break;
      }
    }
    T(g, 10, 204, 'plain: one load before the loop, then b . (a branch to itself). clang may delete the loop instead.', 't-fg');
    T(g, 10, 224, 'volatile: 1: ldrb r1, [r0] / cmp r1, #0 / beq 1b, a real load on every pass.', 't-fg');
  });

  // Figure 5: the lost update, then the masked version
  part('lost', () => {
    const g = svg(viz('lost'), 800, 268, { label: 'counter++ in main interrupted after its load by a handler that also increments: the counter ends at 6; with masking it ends at 7', minWidth: 560 });
    const X0 = 130, W = 650;
    const Y = { main: 30, h: 82, pm: 130, c: 166, r0: 204 };
    [['main()', Y.main + 15, 't-pri t-bold'], ['handler()', Y.h + 15, 't-sec t-bold'], ['PRIMASK.PM', Y.pm + 11, 't-fg t-bold'],
      ['counter, RAM', Y.c + 12, 't-fg t-bold'], ['main()\'s r0', Y.r0 + 11, 't-fg t-bold']].forEach(([t, y, c]) => T(g, 10, y, t, c));
    const dyn = s('g', {}, g);
    const U = [
      ['main', 'ldr r0 → 5', 5, '5', 0], ['h', 'ldr → 5', 5, '5, stacked', 0], ['h', 'adds → 6', 5, '5, stacked', 0],
      ['h', 'str 6', 6, '5, stacked', 0], ['main', 'adds r0 → 6', 6, '6', 0], ['main', 'str r0: 6', 6, '6', 0],
    ];
    const M = [
      ['main', 'cpsid i', 5, '–', 1], ['main', 'ldr → 5', 5, '5', 1], ['main', 'adds → 6', 5, '6', 1], ['main', 'str 6', 6, '6', 1],
      ['main', 'cpsie i', 6, '6', 0], ['h', 'ldr → 6', 6, '6, stacked', 0], ['h', 'adds → 7', 6, '6, stacked', 0], ['h', 'str 7', 7, '6, stacked', 0],
    ];
    const NOTES = [
      'The whole unprotected run. Both contexts did ldr, adds, str, yet the counter went from 5 to 6. Step through it, then pick Masked.',
      'main() executes ldr r0, [counter], so r0 = 5. The timer interrupt is taken right after this instruction.',
      'Entry stacks main()\'s r0, still 5. The handler loads counter, which is still 5 in RAM.',
      'The handler adds 1 in its own registers and gets 6. RAM still holds 5.',
      'The handler stores 6, and its bx lr pops the frame. main()\'s r0 comes back as 5, a stale copy.',
      'main() adds 1 to its stale 5, so r0 = 6.',
      'main() stores 6 over the handler\'s 6. Two increments, and one vanished. volatile would not change a single step here.',
      'cpsid i sets PRIMASK.PM, so the timer request that arrives after the ldr is held pending. cpsie i clears PM, the handler runs at once, loads the stored 6 and writes 7.',
    ];
    const note = role('lost-note');
    steps(viz('lost-steps'), ['Unprotected', '1 ldr', '2 ISR ldr', '3 ISR adds', '4 ISR str', '5 adds', '6 str', 'Masked'], k => {
      dyn.textContent = '';
      const masked = k === 7, S = masked ? M : U, w = W / S.length, cur = k >= 1 && k <= 6 ? k - 1 : -1;
      S.forEach(([lane, t, c, r0, pm], i) => {
        const gg = s('g', { class: 'fade' }, dyn), x = X0 + i * w + 3, cw = w - 6;
        if (cur >= 0 && i > cur) gg.classList.add('dim');
        const on = i === cur, ln = lane === 'main' ? 'pri' : 'sec';
        chip(gg, x, lane === 'main' ? Y.main : Y.h, cw, 30, t, on ? 'f-' + ln : KIND[ln][0], on ? 't-on t-bold' : KIND[ln][1]);
        chip(gg, x, Y.pm, cw, 22, String(pm), pm ? 'f-pri' : 'f-seg', pm ? 't-on t-bold' : 't-muted');
        const last = i === S.length - 1;
        chip(gg, x, Y.c, cw, 26, String(c), last ? (masked ? 'f-ok-soft' : 'f-bad-soft') : 'f-seg', last ? (masked ? 't-ok t-bold' : 't-bad t-bold') : 't-fg');
        chip(gg, x, Y.r0, cw, 22, r0, 'f-none', 't-sm');
      });
      if (masked) {
        const a = X0 + 1.5 * w, b = X0 + 5 * w;
        s('rect', { x: a, y: Y.h + 2, width: b - a - 4, height: 26, rx: 4, class: 'f-none s-sec dash', style: 'stroke-width: 1.5' }, dyn);
        T(dyn, (a + b) / 2, Y.h + 15, 'request pending', 't-sec', 'middle');
        arrow(dyn, a, 64, a, 82, { cls: 'a-sec', head: 6 });
        T(dyn, a + 6, 72, 'TIM3 request', 't-sm t-sec');
        arrow(dyn, b, 64, b, 82, { cls: 'a-sec', head: 6 });
        T(dyn, b + 6, 72, 'taken', 't-sm t-sec');
        T(dyn, 400, 252, 'counter = 7: the request waited for cpsie i, then the handler read the stored 6', 't-ok t-bold', 'middle');
      } else {
        const show = i => cur < 0 || cur >= i;
        if (show(1)) { arrow(dyn, X0 + w, 64, X0 + w, 82, { cls: 'a-sec', head: 6 }); T(dyn, X0 + w + 6, 72, 'interrupt', 't-sm t-sec'); }
        if (show(4)) { arrow(dyn, X0 + 4 * w, 82, X0 + 4 * w, 64, { cls: 'a-sec', head: 6 }); T(dyn, X0 + 4 * w + 6, 72, 'return', 't-sm t-sec'); }
        if (cur < 0 || cur === 5) T(dyn, 400, 252, 'counter = 6 after two increments: one update vanished (should be 7)', 't-bad t-bold', 'middle');
      }
      note.textContent = NOTES[k];
    });
  });

  // Figure 6: mutual exclusion by kind of contention
  part('mutex', () => {
    const g = svg(viz('mutex'), 800, 236, { label: 'Two contexts incrementing one counter: masking on one core, a mutex between threads, masking failing on two cores, and ldrex/strex retrying', minWidth: 560 });
    const X0 = 110, P = 74, CW = 70, YA = 34, YB = 92;
    const la = T(g, 10, YA + 15, '', 't-pri t-bold'), lb = T(g, 10, YB + 15, '', 't-sec t-bold');
    T(g, 10, 148, 'result', 't-fg t-bold');
    const dyn = s('g', {}, g);
    const C = [
      { b: 'ISR vs main()', l: ['main()', 'ISR'],
        a: [[0, 1, 'cpsid i', 'ctl'], [1, 1, 'ldr 5', 'pri'], [2, 1, 'adds 6', 'pri'], [3, 1, 'str 6', 'pri'], [4, 1, 'cpsie i', 'ctl']],
        bb: [[5, 1, 'ldr 6', 'sec'], [6, 1, 'adds 7', 'sec'], [7, 1, 'str 7', 'sec']], pend: [1.5, 5, 'pending, PM = 1'], req: [1.5, 'request'],
        res: ['counter = 7', 1], t: ['Mask interrupts: __disable_irq() is cpsid i, which sets PRIMASK bit 0.', '"The other context cannot run if it cannot start." This is the chip\'s answer.'] },
      { b: 'two threads', l: ['thread A', 'thread B'],
        a: [[0, 1, 'lock', 'ctl'], [1, 1, 'ldr 5', 'pri'], [3, 1, 'adds 6', 'pri'], [4, 1, 'str 6', 'pri'], [5, 1, 'unlock', 'ctl']], susA: [2, 3, 'preempted'],
        bb: [[2, 1, 'lock: held', 'bad'], [6, 1, 'lock', 'ctl'], [7, 2, 'ldr adds str → 7', 'sec']], pend: [3, 6, 'blocked'],
        res: ['counter = 7', 1], t: ['A mutex: B blocks on the held lock, and the scheduler does not run a waiter.', 'An ISR cannot use one: the hardware starts an ISR without asking the scheduler.'] },
      { b: 'two cores, masked', l: ['core 0', 'core 1'],
        a: [[0, 1, 'cpsid i', 'ctl'], [1, 1, 'ldr 5', 'pri'], [2, 1, 'adds 6', 'pri'], [3, 1, 'str 6', 'pri'], [4, 1, 'cpsie i', 'ctl']],
        bb: [[1, 1, 'ldr 5', 'sec'], [2, 1, 'adds 6', 'sec'], [3, 1, 'str 6', 'sec']], txtB: [4.2, 'still running: PRIMASK is core 0\'s alone'],
        res: ['counter = 6: both cores read 5, one update lost', 0], t: ['Masking stops interrupts on its own core only. Core 1 runs its ldr, adds, str at the same time.', 'Two cores need an atomic read-modify-write instruction.'] },
      { b: 'two cores, ldrex/strex', l: ['core 0', 'core 1'],
        a: [[0, 1, 'ldrex 5', 'pri'], [1, 1, 'adds 6', 'pri'], [3, 1, 'strex fail', 'bad'], [4, 1, 'ldrex 6', 'pri'], [5, 1, 'adds 7', 'pri'], [6, 1, 'strex ok', 'ok']],
        bb: [[0, 1, 'ldrex 5', 'sec'], [1, 1, 'adds 6', 'sec'], [2, 1, 'strex ok', 'ok']],
        res: ['counter = 7: core 0 retried after its strex failed', 1], t: ['strex stores only if nothing wrote the address since the ldrex; otherwise it fails and the loop retries.', 'x86 does the same with lock cmpxchg. The Cortex-M0+ has neither, and with one core needs neither.'] },
    ];
    const lane = (y, list) => list.forEach(([sl, span, t, kind]) => {
      const [f, tc] = KIND[kind];
      chip(dyn, X0 + sl * P, y, span * P - (P - CW), 30, t, f, tc + ' t-sm');
    });
    const dashBox = (y, a, b, t, cls, tcls) => {
      s('rect', { x: X0 + a * P, y: y + 2, width: (b - a) * P - (P - CW), height: 26, rx: 4, class: 'f-none dash ' + cls, style: 'stroke-width: 1.5' }, dyn);
      T(dyn, X0 + (a + b) / 2 * P - (P - CW) / 2, y + 15, t, tcls + ' t-sm', 'middle');
    };
    steps(viz('mutex-steps'), C.map(c => c.b), k => {
      const c = C[k];
      dyn.textContent = '';
      la.textContent = c.l[0];
      lb.textContent = c.l[1];
      lane(YA, c.a);
      lane(YB, c.bb);
      if (c.susA) dashBox(YA, c.susA[0], c.susA[1], c.susA[2], 's-muted', 't-muted');
      if (c.pend) dashBox(YB, c.pend[0], c.pend[1], c.pend[2], 's-sec', 't-sec');
      if (c.req) { const x = X0 + c.req[0] * P; arrow(dyn, x, 68, x, 92, { cls: 'a-sec', head: 6 }); T(dyn, x + 6, 78, c.req[1], 't-sm t-sec'); }
      if (c.txtB) T(dyn, X0 + c.txtB[0] * P, YB + 15, c.txtB[1], 't-sm t-muted');
      T(dyn, X0, 148, c.res[0], (c.res[1] ? 't-ok' : 't-bad') + ' t-bold');
      T(dyn, 10, 184, c.t[0], 't-fg');
      T(dyn, 10, 206, c.t[1], 't-fg');
    });
  });

  // Figure 7: lost updates over one day at three interrupt rates
  part('rare', () => {
    const g = svg(viz('rare'), 800, 216, { label: 'Lost updates over 24 hours of running at 100, 1000 and 10000 interrupts per second, with a one-hour bench test shaded', minWidth: 560 });
    const ax = axes(g, { x: 60, y: 54, w: 700, h: 56, xd: [0, 24], yd: [0, 1], xt: [0, 4, 8, 12, 16, 20, 24], yt: [], xf: v => v + ' h', xl: 'hours of running', grid: false });
    R(g, ax.x(0), 54, ax.x(1) - ax.x(0), 56, 'area-pri', 0);
    T(g, 60, 42, '1-hour bench test', 't-sm t-pri');
    // unit exponential gaps: one fixed random sample, scaled by the mean spacing
    const G = [1.13, 1.54, 0.73, 0.72, 0.5, 5.75, 0.34, 0.16, 0.3, 0.3, 0.4, 0.31, 0.11, 0.39, 0.37, 0.84, 0.23, 0.07, 0.23, 0.78, 0.49, 1.32, 1.62, 0.54, 0.1,
      1.3, 1.41, 0.5, 1.07, 0.36, 2.46, 1.79, 1.57, 3.08, 0.27, 0.79, 1.31, 1.62, 0.49, 0.15, 0.98, 0.11, 1.22, 0.01, 0.61];
    const PER = 25.2e6;
    const head = T(g, 60, 16, '', 't-fg t-bold');
    const marks = s('g', {}, g);
    const l1 = T(g, 60, 176, '', 't-fg'), l2 = T(g, 60, 198, '', 't-fg t-bold');
    const RATES = [100, 1000, 10000];
    const n = v => v.toLocaleString('en-US').replace(/,/g, ' ');
    steps(viz('rare-steps'), RATES.map(r => n(r) + ' /s'), k => {
      const rate = RATES[k], mean = PER / rate / 3600;
      marks.textContent = '';
      const ts = [];
      let t = 0;
      for (const x of G) { t += x * mean; if (t > 24) break; ts.push(t); }
      ts.forEach(v => s('line', { x1: ax.x(v), x2: ax.x(v), y1: 58, y2: 106, class: 's-bad' }, marks));
      const in1 = ts.filter(v => v <= 1).length;
      const sp = mean >= 1 ? QV.fmt(mean, 1) + ' h' : Math.round(mean * 60) + ' min';
      head.textContent = `${n(rate)} interrupts/s, about 1 in 25 million lands in the 41.7 ns window`;
      l1.textContent = `${n(rate * 3600)} interrupts per hour · average spacing ${sp} · about ${QV.fmt(24 / mean, 2)} lost updates a day`;
      l2.textContent = `this sample: ${ts.length} in 24 h, ${in1} in the 1-hour test` + (in1 ? '' : ', so the test passes and the bug ships');
      l2.setAttribute('class', 't-bold ' + (in1 ? 't-fg' : 't-bad'));
    }, 1);
  });

  // Figure 8: slide 7's rows as interleavings
  part('rows', () => {
    const g = svg(viz('rows'), 800, 240, { label: 'The five rows of slide 7 as interleavings of main and an ISR, with the shared data in RAM after each step', minWidth: 560 });
    const X0 = 120, P = 165, CW = 155, Y = { m: 30, i: 86, r: 142 };
    T(g, 10, Y.m + 15, 'main()', 't-pri t-bold');
    T(g, 10, Y.i + 15, 'ISR', 't-sec t-bold');
    T(g, 10, Y.r + 13, 'in RAM', 't-fg t-bold');
    arrow(g, X0 + P - 5, 62, X0 + P - 5, 84, { cls: 'a-sec', head: 6 });
    T(g, X0 + P + 1, 72, 'interrupt', 't-sm t-sec');
    arrow(g, X0 + 2 * P - 5, 84, X0 + 2 * P - 5, 62, { cls: 'a-sec', head: 6 });
    T(g, X0 + 2 * P + 1, 72, 'return', 't-sm t-sec');
    const dyn = s('g', {}, g);
    const C = [
      { b: '1 uint8_t', m: [[0, 'ldrb ready → 0'], [2, 'ldrb ready → 1']], i: 'strb ready = 1', r: ['ready = 0', 'ready = 1', 'ready = 1'], ok: 'ok',
        v: 'Safe. Each read is one access, so it returns the old value or the new one.', sub: 'One aligned access, one writer. It still needs volatile, so main() really reads it each time.' },
      { b: '2 flag, clear', m: [[0, 'ldrb flags → 0b01'], [2, 'bics BIT0 → 0b00'], [3, 'strb flags = 0b00']], i: 'sets BIT1 → 0b11', r: ['0b01', '0b11', '0b11', '0b00'], ok: 'warn',
        v: 'Usually safe. Here main() wipes the ISR\'s BIT1, because flags &= ~BIT0 is read-modify-write.', sub: 'A flag in a byte of its own is cleared with one store. Packed beside other bits, the clear needs protecting.' },
      { b: '3 counter++', m: [[0, 'ldr counter → 5'], [2, 'adds → 6'], [3, 'str counter = 6']], i: 'ldr, adds, str → 6', r: ['5', '6', '6', '6'], ok: 'bad',
        v: 'Not safe. 6 after two increments: the lost update of section 5.', sub: 'Mask interrupts around counter++ in main().' },
      { b: '4 uint64_t', m: [[0, 'ldr low → FFFFFFFF'], [2, 'ldr high → 00000001']], i: 'ticks++: low 0, high 1', r: ['00000000_FFFFFFFF', '00000001_00000000', '00000001_00000000'], ok: 'bad',
        v: 'Tearing. main() gets 0x00000001_FFFFFFFF, half old and half new.', sub: 'Nobody stored that value: 8 589 934 591, about double the count. Copy it inside a critical section.' },
      { b: '5 struct', m: [[0, 'ldr width → 120'], [2, 'ldr count → 5']], i: 'width = 80, count = 5', r: ['width 120, count 4', 'width 80, count 5', 'width 80, count 5'], ok: 'bad',
        v: 'Tearing. main() pairs width 120 with count 5, a pair nobody ever stored.', sub: 'The old pair was (120, 4), the new one (80, 5). Read both fields inside a critical section.' },
    ];
    steps(viz('rows-steps'), C.map(c => c.b), k => {
      const c = C[k];
      dyn.textContent = '';
      c.m.forEach(([sl, t]) => chip(dyn, X0 + sl * P, Y.m, CW, 30, t, 'f-pri-soft', 't-pri'));
      chip(dyn, X0 + P, Y.i, CW, 30, c.i, 'f-sec-soft', 't-sec');
      c.r.forEach((t, i) => {
        const last = i === c.r.length - 1, f = last ? { ok: 'f-ok-soft', warn: 'f-ter-soft', bad: 'f-bad-soft' }[c.ok] : 'f-seg';
        chip(dyn, X0 + i * P, Y.r, CW, 26, t, f, 't-fg t-sm');
      });
      T(dyn, 10, 194, c.v, { ok: 't-ok', warn: 't-ter', bad: 't-bad' }[c.ok] + ' t-bold');
      T(dyn, 10, 216, c.sub, 't-fg');
    });
  });

  // Figure 9: preemption, equal priority, masked region
  part('prio', () => {
    const g = svg(viz('prio'), 800, 244, { label: 'Timeline of main, a timer handler and a uart handler: preemption, waiting at equal priority, and waiting behind a masked region', minWidth: 560 });
    const Y = { m: 34, t: 86, u: 138 }, BH = 18;
    const names = [['main()', 't-pri', Y.m], ['timer handler', 't-sec', Y.t], ['uart handler', 't-ter', Y.u]].map(([n, c, y]) => {
      T(g, 10, y + 4, n, c + ' t-bold');
      return T(g, 10, y + 18, '', 't-sm');
    });
    const dyn = s('g', {}, g);
    const C = [
      { b: 'Preemption', sub: ['Thread mode', 'priority 2', 'priority 1'],
        run: { m: [[150, 250], [600, 780]], t: [[250, 350], [480, 600]], u: [[350, 480]] }, sus: { m: [[250, 600]], t: [[350, 480]] },
        sw: [[250, 'm', 't'], [350, 't', 'u'], [480, 'u', 't'], [600, 't', 'm']], req: 350,
        lat: null, t: ['uart (level 1) is more urgent than the timer (level 2), so it preempts the running timer handler.', 'The timer handler was itself interrupted. Everything it shares with the uart handler is at risk too.'] },
      { b: 'Equal priority', sub: ['Thread mode', 'priority 2', 'priority 2'],
        run: { m: [[150, 250], [560, 780]], t: [[250, 450]], u: [[450, 560]] }, sus: { m: [[250, 560]] }, pend: [330, 450],
        sw: [[250, 'm', 't'], [450, 't', 'u'], [560, 'u', 'm']], req: 330,
        lat: [330, 450, 'latency: the rest of the timer handler'], t: ['At equal priority the uart request waits until the timer handler returns, then runs.', '"Anything slow in a handler delays every interrupt of equal or lower priority."'] },
      { b: 'Masked in main()', sub: ['__disable_irq()', 'priority 2', 'priority 0'],
        run: { m: [[150, 560], [660, 780]], u: [[560, 660]] }, sus: { m: [[560, 660]] }, pend: [290, 560], mask: [200, 560],
        sw: [[560, 'm', 'u'], [660, 'u', 'm']], req: 290,
        lat: [290, 560, 'latency: the rest of the masked region'], t: ['PRIMASK holds back every level, 0 included. The request waits, pending, until __enable_irq().', 'The longest critical section anywhere in the program sets the worst-case latency.'] },
    ];
    const cls = { m: 'f-pri', t: 'f-sec', u: 'f-ter' };
    steps(viz('prio-steps'), C.map(c => c.b), k => {
      const c = C[k];
      dyn.textContent = '';
      c.sub.forEach((t, i) => { names[i].textContent = t; });
      Object.keys(Y).forEach(l => s('line', { x1: 150, x2: 780, y1: Y[l] + BH / 2, y2: Y[l] + BH / 2, class: 's-line' }, dyn));
      if (c.mask) {
        s('rect', { x: c.mask[0], y: Y.m - 5, width: c.mask[1] - c.mask[0], height: BH + 10, rx: 4, class: 'f-bad-soft' }, dyn);
        T(dyn, (c.mask[0] + c.mask[1]) / 2, Y.m - 13, 'interrupts off: counter++ and a 5 ms print', 't-sm t-bad', 'middle');
      }
      Object.keys(c.sus).forEach(l => c.sus[l].forEach(([a, b]) => s('line', { x1: a, x2: b, y1: Y[l] + BH / 2, y2: Y[l] + BH / 2, class: 's-muted dash' }, dyn)));
      Object.keys(c.run).forEach(l => c.run[l].forEach(([a, b]) => R(dyn, a, Y[l], b - a, BH, cls[l], 3)));
      if (c.pend) {
        s('rect', { x: c.pend[0], y: Y.u - 1, width: c.pend[1] - c.pend[0], height: BH + 2, rx: 3, class: 'f-none s-ter dash', style: 'stroke-width: 1.5' }, dyn);
        T(dyn, (c.pend[0] + c.pend[1]) / 2, Y.u + BH / 2, 'pending', 't-sm t-ter', 'middle');
      }
      c.sw.forEach(([x, a, b]) => {
        const down = Y[b] > Y[a];
        arrow(dyn, x, down ? Y[a] + BH + 1 : Y[a] - 1, x, down ? Y[b] - 1 : Y[b] + BH + 1, { cls: 'a-muted', head: 6 });
      });
      T(dyn, c.req + 4, Y.u + BH + 10, 'uart request', 't-sm t-ter');
      s('line', { x1: c.req, x2: c.req, y1: Y.u - 4, y2: Y.u + BH + 14, class: 's-ter', style: 'stroke-width: 1.5' }, dyn);
      if (c.lat) {
        s('path', { d: `M${c.lat[0]} 170 V176 H${c.lat[1]} V170`, class: 's-bad', style: 'stroke-width: 1.5' }, dyn);
        T(dyn, c.lat[1] + 8, 176, c.lat[2], 't-sm t-bad');
      } else {
        T(dyn, 360, 176, 'latency: entry only, the uart handler starts at once', 't-sm t-ok');
      }
      T(dyn, 10, 208, c.t[0], 't-fg');
      T(dyn, 10, 228, c.t[1], 't-fg');
    });
  });

  // Figure 10: an IPR word with the two implemented bits of each byte
  part('ipr', () => {
    const g = svg(viz('ipr'), 800, 226, { label: 'An NVIC IPR word: four priority bytes, only bits 7:6 of each implemented, and the four levels 0x00, 0x40, 0x80, 0xC0', minWidth: 560 });
    const CW = 22, X0 = 48, Y = 72;
    const bx = b => X0 + (31 - b) * CW;
    const title = T(g, 10, 14, '', 't-fg t-bold t-lg');
    const blab = [3, 2, 1, 0].map(j => T(g, bx(8 * j + 4), 42, '', 't-sm', 'middle'));
    const cells = [], bits = [], nib = [];
    for (let b = 31; b >= 0; b--) {
      cells[b] = R(g, bx(b), Y, CW, 26, 'f-seg sep', 0);
      bits[b] = T(g, bx(b) + CW / 2, Y + 13, '0', 't-muted', 'middle');
    }
    for (let i = 0; i < 8; i++) nib.push(T(g, X0 + (4 * i + 2) * CW, Y - 12, '0', 't-pri t-bold', 'middle'));
    for (let i = 0; i <= 4; i++) s('line', { x1: X0 + 8 * i * CW, x2: X0 + 8 * i * CW, y1: Y - 4, y2: Y + 30, class: 's-fg', style: 'stroke-width: 2' }, g);
    [31, 30, 24, 23, 22, 16, 15, 14, 8, 7, 6, 0].forEach(b => T(g, bx(b) + CW / 2, Y + 38, String(b), 't-sm', 'middle'));
    const fld = s('g', {}, g);
    const lv = [0, 1, 2, 3].map(p => {
      const x = 60 + p * 172;
      const r = R(g, x, 150, 160, 44, 'f-seg', 6);
      const a = T(g, x + 80, 165, `level ${p} = ${hex(p << 6, 2)}`, 't-fg t-bold', 'middle');
      const b = T(g, x + 80, 182, `bits 7:6 = ${(p >> 1) & 1}${p & 1}`, 't-sm', 'middle');
      return { r, a, b };
    });
    T(g, 60, 210, '← more urgent (0 is the most urgent)', 't-sm');
    T(g, 740, 210, 'less urgent →', 't-sm', 'end');
    const C = [
      { n: 1, p: 2, name: '' }, { n: 6, p: 3, name: '' }, { n: 7, p: 1, name: 'EXTI4_15' }, { n: 16, p: 2, name: 'TIM3' }, { n: 28, p: 1, name: 'USART2' },
    ];
    const calc = role('ipr-calc');
    steps(viz('ipr-steps'), C.map(c => `IRQ ${c.n}${c.name ? ' ' + c.name : ''} · level ${c.p}`), k => {
      const { n, p, name } = C[k], reg = n >> 2, j = n & 3, byte = p << 6, word = (byte << (8 * j)) >>> 0;
      title.textContent = `NVIC->IPR[${reg}] = ${hex(word)}`;
      blab.forEach((t, i) => { const jj = 3 - i; t.textContent = `byte ${jj} · IRQ ${4 * reg + jj}`; t.setAttribute('class', jj === j ? 't-pri t-bold' : 't-sm'); });
      for (let b = 0; b < 32; b++) {
        const impl = (b & 7) >= 6, one = (word >>> b) & 1, mine = (b >> 3) === j;
        cells[b].setAttribute('class', (impl ? (one ? 'f-pri' : mine ? 'f-pri-soft' : 'f-pri-soft') : 'f-seg') + ' sep');
        bits[b].setAttribute('class', impl ? (one ? 't-on t-bold' : 't-pri') : 't-muted');
        bits[b].textContent = one;
      }
      hex(word).slice(2).split('').forEach((c, i) => { nib[i].textContent = c; });
      fld.textContent = '';
      const hi = 8 * j + 7;
      s('rect', { x: bx(hi) - 1, y: Y - 1, width: 2 * CW + 2, height: 28, class: 'f-none outline-pri' }, fld);
      T(fld, bx(hi) + CW, Y + 54, `IRQ ${n}: bits ${hi}:${hi - 1}`, 't-pri t-bold', 'middle');
      lv.forEach((l, i) => {
        const on = i === p;
        l.r.setAttribute('class', on ? 'f-pri' : 'f-seg');
        l.a.setAttribute('class', on ? 't-on t-bold' : 't-fg t-bold');
        l.b.setAttribute('class', on ? 't-on' : 't-sm');
      });
      calc.textContent = [
        `IRQ ${n}${name ? ' (' + name + ')' : ''}, level ${p}`,
        `register   IPR[${n} / 4] = IPR[${reg}]`,
        `byte       ${n} mod 4 = ${j} → bits ${8 * j + 7}:${8 * j}, implemented bits ${hi}:${hi - 1}`,
        `value      ${p} << 6 = ${hex(byte, 2)} = ${byte.toString(2).padStart(8, '0')}`,
        `in word    ${hex(byte, 2)} << ${8 * j} = ${hex(word)}   (the other three bytes belong to other IRQs)`,
      ].join('\n');
    });
  });

  // General idea vs this chip; the first two rows are guide §2 and §7's contrasts for lesson 03
  part('contrast', () => {
    const rows = [
      ['Meeting the hardware', 'polling, interrupt, DMA', 'all three: polling for short waits (FLASH->ACR LATENCY), interrupts for rare or must-not-miss events',
        'polling depends on the loop coming back and can miss a fast event; an interrupt sees every edge, wanted or not; DMA keeps the CPU out of streams'],
      ['Mutual exclusion', 'mask interrupts (one core); a mutex (threads under an OS); an atomic read-modify-write instruction, ldrex/strex or x86 lock cmpxchg (two cores)',
        'masking: __disable_irq() = cpsid i = PRIMASK bit 0', 'right here because the M0+ is single-core with no ldrex/strex, wrong on a phone; keep it short, the longest critical section sets the worst-case latency'],
      ['Saving state on interrupt entry', 'the hardware saves only the return address and a marked handler saves the rest (AVR\'s ISR() macro)',
        'the hardware stacks 8 registers: the AAPCS caller-saved set plus PC and xPSR', 'an ISR is an ordinary C function; its name puts it in the vector table; a misspelt name compiles and does nothing'],
      ['What the compiler must keep', 'only the observable behaviour C defines (the as-if rule)', 'volatile marks an object whose every access is observable',
        'a shared flag without volatile is read once: works at -O0, hangs at -Os; volatile is not a lock and makes nothing atomic'],
      ['A value wider than one access', 'one indivisible access, or several that an interrupt can split', '32-bit accesses: a uint64_t or a struct takes two or more',
        'tearing; copy such values inside a critical section; a single aligned word with one writer is safe'],
      ['Choosing among waiting interrupts', 'a fixed order, or priorities with preemption', 'NVIC: 4 levels from the top 2 bits of each IPR byte, 0 most urgent; a more urgent one preempts',
        'handlers must be short; ISRs share data with ISRs too; priority inversion (lesson 07)'],
    ];
    const t = table(viz('contrast'), ['General idea', 'Alternatives', 'This chip', 'What follows'].map(L),
      rows.map(r => r.map((c, i) => ({ text: c, cls: i === 2 ? 'l hl' : 'l' }))));
    t.rows.slice(0, 2).forEach(r => r.classList.add('on'));
  });
});
