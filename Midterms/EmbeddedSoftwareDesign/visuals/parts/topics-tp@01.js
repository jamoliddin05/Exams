QV.register('topic1', function (q) {
  const { s, svg, arrow, steps, table } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const T = (g, x, y, text, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor, class: cls }, g, text);
  const R = (g, x, y, w, h, cls, rx) => s('rect', { x, y, width: w, height: h, rx: rx == null ? 4 : rx, class: cls }, g);
  const hex = (v, n = 8) => '0x' + (v >>> 0).toString(16).toUpperCase().padStart(n, '0');
  const h2 = v => (v >>> 0).toString(16).toUpperCase().padStart(2, '0');
  const num = v => String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const sgn = v => (v < 0 ? '−' : '') + num(v);
  const L = t => ({ text: t, cls: 'l' });
  // one figure failing must not blank the other eleven
  const part = (name, f) => { try { f(); } catch (e) { QV.fail('topic1 ' + name, e); } };
  const card = (g, x, y, w, h, lines, fill, stroke) => {
    const r = s('rect', { x, y, width: w, height: h, rx: 6, class: (fill || 'f-surface') + ' ' + (stroke || 'box') }, g);
    const lh = 15, t0 = y + h / 2 - (lines.length - 1) * lh / 2;
    const ts = lines.map(([t, c], i) => T(g, x + w / 2, t0 + i * lh, t, c || 't-fg', 'middle'));
    return { r, ts };
  };
  const fade = el => { el.setAttribute('class', 'fade'); return el; };

  // Figure 1: four instructions to scale in bytes, ARM against Thumb
  part('density', () => {
    const g = svg(viz('density'), 760, 236, { label: 'The same four instructions take 16 bytes in ARM and 10 bytes in Thumb; Cortex-A and Cortex-R run both sets, Cortex-M runs Thumb only', minWidth: 540 });
    const X0 = 130, B = 28;
    const ins = [['movs r0, #7', 'movs', 2], ['ldr r1, [r2]', 'ldr', 2], ['bl SystemInit', 'bl SystemInit', 4], ['str r3, [r2]', 'str', 2]];
    T(g, 10, 41, 'ARM (A32)', 't-sec t-bold');
    T(g, 10, 56, 'always 4 bytes', 't-sm');
    ins.forEach(([full], i) => {
      R(g, X0 + i * 4 * B, 30, 4 * B, 34, 'f-sec-soft sep', 0);
      T(g, X0 + i * 4 * B + 2 * B, 47, (i + 1) + ' ' + full, 't-sec', 'middle');
    });
    T(g, X0 + 16 * B + 12, 47, '16 bytes', 't-sec t-bold');
    T(g, 10, 97, 'Thumb (T32)', 't-pri t-bold');
    T(g, 10, 112, '2 or 4 bytes', 't-sm');
    let x = X0;
    ins.forEach(([, short, n], i) => {
      const wide = n === 4;
      R(g, x, 86, n * B, 34, (wide ? 'f-pri' : 'f-pri-soft') + ' sep', 0);
      T(g, x + n * B / 2, 103, (i + 1) + ' ' + short, wide ? 't-on t-bold' : 't-pri', 'middle');
      x += n * B;
    });
    T(g, x + 12, 103, '10 bytes', 't-pri t-bold');
    T(g, 496, 103, 'bl widens: a call must reach anywhere', 't-sm');
    s('line', { x1: X0, x2: X0 + 16 * B, y1: 132, y2: 132, class: 'l-axis' }, g);
    [0, 4, 8, 12, 16].forEach(b => {
      s('line', { x1: X0 + b * B, x2: X0 + b * B, y1: 132, y2: 137, class: 'l-axis' }, g);
      T(g, X0 + b * B, 147, String(b), 't-sm', 'middle');
    });
    T(g, X0 + 16 * B + 12, 147, 'bytes', 't-sm');
    card(g, 40, 168, 320, 56, [['Cortex-A, Cortex-R', 't-fg t-bold'], ['both sets, switched at run time']]);
    card(g, 400, 168, 320, 56, [['Cortex-M, this chip', 't-pri t-bold'], ['Thumb only. No ARM state exists.', 't-fg']], 'f-pri-soft', 'outline-pri');
  });

  // Figure 2: counter++ on a register-memory machine and on this load-store one
  part('rmw', () => {
    const g = svg(viz('rmw'), 800, 296, { label: 'counter++ as one x86 instruction and as ldr, adds, str on this chip, with the bus accesses and an interrupt landing between ldr and str', minWidth: 560 });
    T(g, 10, 14, 'REGISTER–MEMORY · x86', 't-sec t-bold');
    card(g, 20, 28, 160, 54, [['memory', 't-fg t-bold'], ['counter = 41 → 42', 't-sec']]);
    card(g, 300, 28, 100, 54, [['ALU', 't-fg t-bold'], ['+1']], 'f-sec-soft');
    arrow(g, 182, 44, 298, 44, { cls: 'a-sec', label: 'read', labelCls: 't-sec' });
    arrow(g, 298, 66, 182, 66, { cls: 'a-sec', label: 'write', labelCls: 't-sec', dy: 14 });
    T(g, 430, 44, 'add dword [counter], 1', 't-fg t-bold');
    T(g, 430, 64, '1 instruction · 2 bus accesses', 't-sec');
    s('line', { x1: 10, x2: 790, y1: 100, y2: 100, class: 's-line' }, g);

    T(g, 10, 118, 'LOAD–STORE · this chip', 't-pri t-bold');
    const mem = card(g, 20, 136, 160, 64, [['memory', 't-fg t-bold'], ['', 't-pri t-bold']]);
    s('line', { x1: 216, x2: 216, y1: 126, y2: 236, class: 's-muted dash' }, g);
    T(g, 216, 248, 'only ldr / str cross here', 't-sm', 'middle');
    const reg = card(g, 252, 136, 150, 64, [['registers', 't-fg t-bold'], ['r1 = &counter', 't-sm'], ['', 't-pri t-bold']], 'f-pri-soft');
    card(g, 460, 136, 90, 64, [['ALU', 't-fg t-bold'], ['+1']]);
    const aLdr = fade(arrow(g, 182, 154, 250, 154, { cls: 'a-pri', width: 2, label: 'ldr', labelCls: 't-pri t-bold', dx: -16 }));
    const aStr = fade(arrow(g, 250, 184, 182, 184, { cls: 'a-pri', width: 2, label: 'str', labelCls: 't-pri t-bold', dx: -16, dy: 15 }));
    const aAlu = fade(s('g', {}, g));
    arrow(aAlu, 404, 154, 458, 154, { cls: 'a-muted' });
    arrow(aAlu, 458, 184, 404, 184, { cls: 'a-muted' });
    T(g, 505, 214, 'registers only', 't-sm', 'middle');

    const LST = ['ldr   r0, [r1]', 'adds  r0, r0, #1', 'str   r0, [r1]'];
    const ry = i => 140 + i * 28;
    const hl = LST.map((t, i) => R(g, 576, ry(i) - 10, 150, 20, 'f-none', 3));
    LST.forEach((t, i) => T(g, 584, ry(i), t, 't-fg'));
    const isr = s('g', {}, g);
    s('line', { x1: 576, x2: 760, y1: 154, y2: 154, class: 's-bad', style: 'stroke-width: 2' }, isr);
    s('line', { x1: 760, x2: 760, y1: 154, y2: 222, class: 's-bad', style: 'stroke-width: 1.5' }, isr);
    card(isr, 590, 222, 200, 40, [['interrupt here: the ISR', 't-bad t-bold'], ['runs counter++, stores 42', 't-bad']], 'f-bad-soft');
    const sum = T(g, 400, 284, '', 't-fg t-bold', 'middle');

    const S = [
      { b: 'All', mem: 'counter = 41 → 42', r0: 'r0 = 41 → 42', on: [1, 1, 1], stat: '3 · 2',
        sum: 'Three instructions, two bus accesses: the same two as the x86\'s one instruction.',
        note: 'The whole counter++. Only ldr and str touch the bus. adds works on r0 inside the CPU, so the bus does the same work as on the x86.' },
      { b: '1 ldr', mem: 'counter = 41', r0: 'r0 = 41', on: [1, 0, 0], stat: '1 · 1',
        sum: 'Bus access 1: memory → register.',
        note: 'ldr r0, [r1] copies counter from memory into r0. Bus access 1. r1 already holds the address of counter.' },
      { b: '2 adds', mem: 'counter = 41', r0: 'r0 = 41 → 42', on: [0, 1, 0], stat: '2 · 1',
        sum: 'No bus access: the ALU works on r0.',
        note: 'adds r0, r0, #1 works on the register only. The ALU never sees an address, and the bus is idle. The s means it also sets the flags.' },
      { b: '3 str', mem: 'counter = 42', r0: 'r0 = 42', on: [0, 0, 1], stat: '3 · 2',
        sum: 'Bus access 2: register → memory.',
        note: 'str r0, [r1] writes 42 back. Bus access 2. The x86 made the same read and the same write inside its one instruction.' },
      { b: 'interrupt in the gap', mem: 'counter: 41 → 42 → 42', r0: 'r0 = 41 → 42', on: [1, 1, 1], stat: '3 · 2', isr: 1,
        sum: 'Two increments, but counter rose by one: an update was lost.',
        note: 'An interrupt arrives just after the ldr. The ISR runs its own counter++ and stores 42. main resumes with the stale 41 in r0, adds 1 and stores 42 again. Lesson 03 closes this gap.' },
    ];
    const note = role('rmw-note'), stat = role('rmw-arm');
    steps(viz('rmw-steps'), S.map(x => x.b), k => {
      const c = S[k];
      mem.ts[1].textContent = c.mem;
      mem.ts[1].setAttribute('class', c.isr ? 't-bad t-bold' : 't-pri t-bold');
      reg.ts[2].textContent = c.r0;
      [aLdr, aAlu, aStr].forEach((a, i) => a.classList.toggle('dim', !c.on[i]));
      hl.forEach((r, i) => r.setAttribute('class', k > 0 && k < 4 && i === k - 1 ? 'f-pri-soft' : 'f-none'));
      isr.setAttribute('visibility', c.isr ? 'visible' : 'hidden');
      sum.textContent = c.sum;
      sum.setAttribute('class', c.isr ? 't-bad t-bold' : 't-fg t-bold');
      stat.textContent = c.stat;
      note.textContent = c.note;
    });
  });

  // Figure 3: lsls, lsrs and asrs moving 32 bits
  part('shift', () => {
    const g = svg(viz('shift'), 800, 234, { label: 'Logical shift left, logical shift right and arithmetic shift right on 32 bits, with the bits that enter and the bits that fall off', minWidth: 560 });
    const X0 = 64, CW = 22, YI = 44, YO = 150, H = 24;
    const bx = b => X0 + (31 - b) * CW;
    const top = T(g, X0, 16, '', 't-fg t-bold');
    T(g, bx(31) + CW / 2, YI - 10, '31', 't-sm', 'middle');
    T(g, bx(0) + CW / 2, YI - 10, '0', 't-sm', 'middle');
    T(g, 10, YI + H / 2, 'r1', 't-fg t-bold');
    T(g, 10, YO + H / 2, 'r0', 't-fg t-bold');
    const op = T(g, 10, (YI + H + YO) / 2, '', 't-pri t-bold');
    const lines = s('g', {}, g);
    const cin = [], tin = [], cout = [], tout = [];
    for (let b = 31; b >= 0; b--) {
      cin[b] = R(g, bx(b), YI, CW, H, 'f-seg sep', 0);
      tin[b] = T(g, bx(b) + CW / 2, YI + H / 2, '0', 't-muted', 'middle');
      cout[b] = R(g, bx(b), YO, CW, H, 'f-seg sep', 0);
      tout[b] = T(g, bx(b) + CW / 2, YO + H / 2, '0', 't-muted', 'middle');
    }
    for (let i = 1; i < 8; i++) {
      const x = X0 + 4 * i * CW;
      [YI, YO].forEach(y => s('line', { x1: x, x2: x, y1: y - 3, y2: y + H + 3, class: 's-muted' }, g));
    }
    const outl = s('g', {}, g);
    const res = T(g, X0, YO + H + 20, '', 't-fg t-bold');
    const verdict = T(g, X0, YO + H + 42, '', 't-fg');
    const C = [
      { b: 'lsls: 2u << 10', op: 'lsls #10', v: 2, n: 10, k: 'lsl',
        top: 'r1 = 0x00000002 = 2u, the AF code for MODER',
        res: 'r0 = 0x00000800: bits 11:10 = 10, PA5\'s MODER field set to AF',
        verdict: 'Zeros enter at the right. A shift left by 10 multiplies by 1024.', vc: 't-ok',
        note: 'GPIOA->MODER |= (2u << (pin * 2)) with pin = 5 shifts 2 left by 10. Every bit moves up 10 places, the top 10 fall off, and zeros fill the bottom. That is why lsls is 4% of all code.' },
      { b: 'lsrs: −8 >> 3', op: 'lsrs #3', v: 0xFFFFFFF8, n: 3, k: 'lsr',
        top: 'r1 = 0xFFFFFFF8 · as int −8 · as unsigned 4 294 967 288',
        res: 'r0 = 0x1FFFFFFF = 536 870 911',
        verdict: 'Zeros enter at the top. Right for an unsigned ÷ 8, wrong for −8.', vc: 't-bad',
        note: 'lsrs treats the register as unsigned, and the compiler picks it for unsigned types. On the bits of −8 it gives 536 870 911: the small negative number became a very large positive one.' },
      { b: 'asrs: −8 >> 3', op: 'asrs #3', v: 0xFFFFFFF8, n: 3, k: 'asr',
        top: 'r1 = 0xFFFFFFF8 · as int −8 · as unsigned 4 294 967 288',
        res: 'r0 = 0xFFFFFFFF = −1',
        verdict: 'Copies of bit 31 enter at the top, so the sign is kept: −8 ÷ 8 = −1.', vc: 't-ok',
        note: 'asrs copies bit 31 into every bit that enters, so a negative number stays negative. The compiler picks it for signed types: an int −8 >> 3 is −1.' },
    ];
    const note = role('shift-note');
    steps(viz('shift-steps'), C.map(c => c.b), k => {
      const c = C[k], n = c.n;
      const out = c.k === 'lsl' ? (c.v << n) >>> 0 : c.k === 'lsr' ? c.v >>> n : ((c.v | 0) >> n) >>> 0;
      const paint = (cells, texts, v) => {
        for (let b = 0; b < 32; b++) {
          const one = (v >>> b) & 1;
          cells[b].setAttribute('class', (one ? 'f-pri' : 'f-seg') + ' sep');
          texts[b].setAttribute('class', one ? 't-on' : 't-muted');
          texts[b].textContent = one;
        }
      };
      paint(cin, tin, c.v);
      paint(cout, tout, out);
      lines.textContent = '';
      outl.textContent = '';
      const mark = (b, y, cls) => s('rect', { x: bx(b) + 1, y: y + 1, width: CW - 2, height: H - 2, class: 'f-none ' + cls, style: 'stroke-width: 2' }, outl);
      for (let r = 0; r < 32; r++) {
        let src = c.k === 'lsl' ? r - n : r + n;
        let enters = src < 0 || src > 31;
        if (enters && c.k === 'asr') { src = 31; enters = false; mark(r, YO, 's-sec'); }
        if (enters) { mark(r, YO, 's-sec'); continue; }
        const sign = c.k === 'asr' && r > 31 - n;
        s('line', { x1: bx(src) + CW / 2, y1: YI + H, x2: bx(r) + CW / 2, y2: YO, class: sign ? 's-sec' : 's-muted', style: 'stroke-width: ' + (sign ? 1.5 : 1) }, lines);
      }
      for (let i = 0; i < n; i++) mark(c.k === 'lsl' ? 31 - i : i, YI, 's-bad');
      top.textContent = c.top;
      op.textContent = c.op;
      res.textContent = c.res;
      verdict.textContent = c.verdict;
      verdict.setAttribute('class', c.vc + ' t-bold');
      note.textContent = c.note;
    }, 0);
  });

  // Figure 4: cmp sets N Z C V, the branches read them
  part('flags', () => {
    const g = svg(viz('flags'), 800, 196, { label: 'cmp r0, r1 subtracts, discards the result and sets the N, Z, C and V flags in APSR; the same bits read as signed and as unsigned', minWidth: 560 });
    card(g, 10, 20, 150, 46, [['cmp r0, r1', 't-fg t-bold t-lg'], ['subtract, then drop it', 't-sm']]);
    arrow(g, 160, 43, 208, 43, { cls: 'a-muted' });
    R(g, 210, 20, 250, 46, 'f-seg box dash', 6);
    const diffT = T(g, 335, 36, '', 't-fg t-bold', 'middle');
    T(g, 335, 54, 'the result is thrown away', 't-sm', 'middle');
    arrow(g, 460, 43, 508, 43, { cls: 'a-muted' });
    T(g, 616, 10, 'APSR, bits 31:28 of xPSR', 't-sm', 'middle');
    const FL = ['N', 'Z', 'C', 'V'];
    const fx = i => 510 + i * 54;
    const fc = FL.map((f, i) => R(g, fx(i), 20, 50, 46, 'f-seg sep', 0));
    const fn = FL.map((f, i) => T(g, fx(i) + 25, 31, f + ' · ' + (31 - i), 't-sm', 'middle'));
    const fv = FL.map((f, i) => T(g, fx(i) + 25, 52, '0', 't-muted t-lg', 'middle'));
    R(g, 726, 20, 64, 46, 'f-seg sep', 0);
    T(g, 758, 43, '27:0', 't-sm', 'middle');
    T(g, 200, 86, 'as int (blt, bge)', 't-pri t-bold');
    T(g, 470, 86, 'as unsigned (bcc, bcs)', 't-sec t-bold');
    const rv = [0, 1].map(i => [T(g, 10, 108 + i * 20, '', 't-fg t-bold'), T(g, 200, 108 + i * 20, '', 't-pri'), T(g, 470, 108 + i * 20, '', 't-sec')]);
    s('line', { x1: 10, x2: 790, y1: 140, y2: 140, class: 's-line' }, g);
    const cs = T(g, 200, 154, '', 't-pri t-bold'), cu = T(g, 470, 154, '', 't-sec t-bold');
    T(g, 10, 154, 'r0 < r1 ?', 't-fg t-bold');
    T(g, 10, 182, 'N negative · Z zero · C carry, 1 = no borrow · V signed overflow', 't-sm');

    const BR = [
      ['beq', 'equal', 'Z = 1', 'if (a == b)', f => f.Z],
      ['bne', 'not equal', 'Z = 0', 'if (a != b)', f => !f.Z],
      ['blt', 'signed less', 'N ≠ V', 'int: a < b', f => f.N !== f.V],
      ['bge', 'signed greater or equal', 'N = V', 'int: a >= b', f => f.N === f.V],
      ['bcc', 'unsigned lower', 'C = 0', 'unsigned: a < b', f => !f.C],
      ['bcs', 'unsigned higher or same', 'C = 1', 'unsigned: a >= b', f => f.C],
      ['bmi', 'negative', 'N = 1', 'sign test', f => f.N],
      ['bpl', 'positive or zero', 'N = 0', 'sign test', f => !f.N],
    ];
    const tb = table(viz('flags-table'), ['Branch', 'Taken when', 'Flags', 'From C', 'This pair'].map(L), BR.map(r => r.slice(0, 4).map(L).concat([L('')])));
    const P = [
      { b: '5 vs 5', a: 5, c: 5, note: 'Equal: the difference is 0, so Z = 1. Nothing borrows, so C = 1. beq, bge and bcs are taken.' },
      { b: '3 vs 7', a: 3, c: 7, note: '3 − 7 is negative and borrows: N = 1, C = 0. Both readings agree that 3 < 7, so blt and bcc are both taken.' },
      { b: '7 vs 3', a: 7, c: 3, note: '7 − 3 = 4: N = 0, Z = 0, C = 1. Both readings agree that 7 > 3, so bge and bcs are taken.' },
      { b: '−1 vs 1', a: 0xFFFFFFFF, c: 1, note: 'The same bits, read two ways. As int, −1 < 1, so blt is taken. As unsigned, 4 294 967 295 ≥ 1, so C = 1 and bcc is not taken. The compiler picks the branch from the variable\'s type.' },
      { b: '0x7FFFFFFF vs −1', a: 0x7FFFFFFF, c: 0xFFFFFFFF, note: '2 147 483 647 − (−1) = 2 147 483 648 does not fit in an int, so V = 1 and N has the wrong sign. blt tests N ≠ V and is correctly not taken. bmi alone would call the result negative.' },
    ];
    const note = role('flags-note');
    steps(viz('flags-steps'), P.map(p => p.b), k => {
      const { a, c } = P[k];
      const d = (a - c) >>> 0;
      const f = { N: d >>> 31, Z: d === 0 ? 1 : 0, C: a >= c ? 1 : 0, V: (((a ^ c) & (a ^ d)) >>> 31) };
      diffT.textContent = 'r0 − r1 = ' + hex(d);
      FL.forEach((x, i) => {
        const one = f[x];
        fc[i].setAttribute('class', (one ? 'f-pri' : 'f-seg') + ' sep');
        fn[i].setAttribute('class', 't-sm ' + (one ? 't-on' : 't-muted'));
        fv[i].setAttribute('class', 't-lg t-bold ' + (one ? 't-on' : 't-muted'));
        fv[i].textContent = one;
      });
      [a, c].forEach((v, i) => {
        rv[i][0].textContent = `r${i} = ${hex(v)}`;
        rv[i][1].textContent = sgn(v | 0);
        rv[i][2].textContent = num(v);
      });
      const sl = (a | 0) < (c | 0), ul = a < c;
      cs.textContent = `${sgn(a | 0)} ${sl ? '<' : '≥'} ${sgn(c | 0)}: blt ${sl ? 'taken' : 'not taken'}`;
      cu.textContent = `${num(a)} ${ul ? '<' : '≥'} ${num(c)}: bcc ${ul ? 'taken' : 'not taken'}`;
      BR.forEach((r, i) => {
        const taken = !!r[4](f);
        const td = tb.rows[i].lastChild;
        td.textContent = taken ? 'taken' : 'not taken';
        td.className = taken ? 'l hl' : 'l';
        tb.rows[i].classList.toggle('on', taken);
      });
      note.textContent = P[k].note;
    }, 3);
  });

  // Figure 5: a call chain with a link register, against a stack-based machine
  part('call', () => {
    const g = svg(viz('call'), 800, 258, { label: 'main calls f, f saves LR on the stack and calls the leaf g; PC, LR, SP and the stack after each instruction', minWidth: 560 });
    const LST = [
      { h: 'main:' },
      { a: 0x08000100, t: 'bl   f' },
      { a: 0x08000104, t: '…    main continues' },
      { h: 'f:  calls g, so it saves LR' },
      { a: 0x08000200, t: 'push {r4, lr}' },
      { a: 0x08000202, t: 'bl   g' },
      { a: 0x08000206, t: 'pop  {r4, pc}' },
      { h: 'g:  a leaf, no prologue' },
      { a: 0x08000300, t: 'adds r0, r0, #1' },
      { a: 0x08000302, t: 'bx   lr' },
    ];
    const ry = i => 22 + i * 24;
    const hl = [], pcm = [];
    LST.forEach((r, i) => {
      if (r.h) { T(g, 10, ry(i), r.h, 't-muted t-bold'); return; }
      hl[i] = R(g, 8, ry(i) - 10, 322, 20, 'f-none', 3);
      T(g, 16, ry(i), hex(r.a).slice(2), 't-muted');
      T(g, 90, ry(i), r.t, 't-fg');
      pcm[i] = s('rect', { x: 8, y: ry(i) - 10, width: 322, height: 20, rx: 3, class: 'f-none s-ok', style: 'stroke-width: 2' }, g);
    });
    const regBox = (y, name) => {
      const r = R(g, 370, y, 190, 40, 'f-surface box', 6);
      const n = T(g, 382, y + 20, name, 't-fg t-bold');
      const v = T(g, 548, y + 20, '', 't-fg', 'end');
      return { r, n, v };
    };
    const regs = { pc: regBox(24, 'PC'), lr: regBox(78, 'LR'), sp: regBox(132, 'SP') };
    T(g, 465, 192, 'one return address fits in LR', 't-sm', 'middle');

    T(g, 620, 14, 'stack (MSP)', 't-fg t-bold');
    R(g, 620, 30, 170, 24, 'f-none box dash', 4);
    T(g, 705, 42, '0x20003000 · top, empty', 't-sm', 'middle');
    const cell = y => {
      const r = R(g, 620, y, 170, 40, 'f-seg sep', 0);
      const a = T(g, 628, y + 11, '', 't-sm');
      const v = T(g, 705, y + 27, '', 't-muted t-bold', 'middle');
      return { r, a, v };
    };
    const c1 = cell(54), c2 = cell(94);
    c1.a.textContent = '0x20002FFC';
    c2.a.textContent = '0x20002FF8';
    const spm = s('g', {}, g);

    const ST = [
      { b: '1 bl f', run: 1, pc: 0x08000200, lr: 0x08000105, sp: 0x20003000, chg: ['pc', 'lr'], st: 0, lrm: 0, avr: 1,
        note: 'bl f writes the return address, 0x08000104 with the Thumb bit set, into LR and jumps. No memory is touched. The AVR\'s rcall would push it on the stack: 1 memory access.' },
      { b: '2 push {r4, lr}', run: 4, pc: 0x08000202, lr: 0x08000105, sp: 0x20002FF8, chg: ['sp'], st: 1, lrm: 1, avr: 1,
        note: 'f is about to call g, and bl g will overwrite LR. So the prologue saves LR (and r4, which f uses) on the stack, and SP drops by 8. This is what push {lr} in every non-leaf prologue is for.' },
      { b: '3 bl g', run: 5, pc: 0x08000300, lr: 0x08000207, sp: 0x20002FF8, chg: ['pc', 'lr'], st: 1, lrm: 1, avr: 2,
        note: 'bl g replaces LR with 0x08000207. The way back to main survives only because the prologue saved it.' },
      { b: '4 adds', run: 8, pc: 0x08000302, lr: 0x08000207, sp: 0x20002FF8, chg: ['pc'], st: 1, lrm: 1, avr: 2,
        note: 'g is a leaf: it calls nothing, so it has no prologue and never touches the stack.' },
      { b: '5 bx lr', run: 9, pc: 0x08000206, lr: 0x08000207, sp: 0x20002FF8, chg: ['pc'], st: 1, lrm: 1, avr: 3,
        note: 'bx lr branches to LR & ~1 = 0x08000206, back in f. The leaf call cost no memory access at all: bl in, bx lr out. The AVR\'s ret pops its return address from memory.' },
      { b: '6 pop {r4, pc}', run: 6, pc: 0x08000104, lr: 0x08000207, sp: 0x20003000, chg: ['pc', 'sp'], st: 2, lrm: 2, avr: 4,
        note: 'pop {r4, pc} restores r4 and loads the saved LR straight into PC, which is the return to main. It replaces pop {r4, lr} and bx lr. Return addresses cost 2 memory accesses here and 4 on a stack-based machine.' },
    ];
    const note = role('call-note'), sLr = role('call-lr'), sSt = role('call-stack');
    steps(viz('call-steps'), ST.map(x => x.b), k => {
      const c = ST[k];
      const nextRow = LST.findIndex(r => r.a === c.pc);
      LST.forEach((r, i) => {
        if (r.h) return;
        hl[i].setAttribute('class', i === c.run ? 'f-pri-soft' : 'f-none');
        pcm[i].setAttribute('visibility', i === nextRow ? 'visible' : 'hidden');
      });
      Object.keys(regs).forEach(key => {
        const on = c.chg.indexOf(key) >= 0, rg = regs[key];
        rg.r.setAttribute('class', (on ? 'f-pri' : 'f-surface') + ' box');
        rg.n.setAttribute('class', (on ? 't-on' : 't-fg') + ' t-bold');
        rg.v.setAttribute('class', on ? 't-on t-bold' : 't-fg');
        rg.v.textContent = hex(c[key]);
      });
      const live = c.st === 1, fresh = k === 1;
      [[c1, '0x08000105 · saved LR'], [c2, 'r4 of main']].forEach(([cl, t]) => {
        cl.v.textContent = c.st ? t : '··';
        cl.r.setAttribute('class', (fresh ? 'f-pri' : live ? 'f-pri-soft' : 'f-seg') + ' sep');
        cl.v.setAttribute('class', (fresh ? 't-on' : live ? 't-pri' : 't-muted') + ' t-bold');
        cl.a.setAttribute('class', 't-sm ' + (fresh ? 't-on' : 't-muted'));
      });
      spm.textContent = '';
      const y = c.sp === 0x20003000 ? 42 : 114;
      T(spm, 592, y, 'SP', 't-pri t-bold', 'end');
      arrow(spm, 596, y, 617, y, { cls: 'a-pri', head: 6 });
      if (c.st === 2) T(spm, 705, 148, 'popped, free again', 't-sm', 'middle');
      sLr.textContent = String(c.lrm);
      sSt.textContent = String(c.avr);
      note.textContent = c.note;
    });
  });

  // Figure 6: how far a 16-bit [r4, #n] reaches, by access size
  part('off', () => {
    const g = svg(viz('off'), 820, 254, { label: 'Memory from the USART2 base in r4 with the range one 16-bit load or store can reach, and the 16-bit encoding of the chosen instruction', minWidth: 560 });
    const X0 = 70, K = 5, YS = 56, HS = 28;
    const ox = o => X0 + o * K;
    T(g, 10, 14, 'memory from r4 = 0x40004400, the USART2 base', 't-fg t-bold');
    const cells = [];
    for (let o = -8; o <= 140; o += 4) cells.push({ o, r: R(g, ox(o), YS, 4 * K, HS, 'f-seg sep', 0) });
    [['CR1', 0], ['ISR', 28], ['TDR', 40]].forEach(([n, o]) => T(g, ox(o) + 2 * K, YS + HS / 2, n, 't-sm t-fg', 'middle'));
    s('line', { x1: ox(0), x2: ox(0), y1: YS - 6, y2: YS + HS + 6, class: 's-fg', style: 'stroke-width: 2' }, g);
    [0, 32, 64, 96, 128].forEach(o => {
      s('line', { x1: ox(o), x2: ox(o), y1: YS + HS, y2: YS + HS + 5, class: 'l-axis' }, g);
      T(g, ox(o), YS + HS + 14, String(o), 't-sm', 'middle');
    });
    T(g, ox(-8), YS + HS + 14, '−8', 't-sm');
    const dyn = s('g', {}, g);

    const X1 = 180, CB = 28, YE = 158;
    const ex = i => X1 + i * CB;
    const ecell = [], etxt = [];
    for (let i = 0; i < 16; i++) {
      ecell.push(R(g, ex(i), YE, CB, 26, 'f-seg sep', 0));
      etxt.push(T(g, ex(i) + CB / 2, YE + 13, '', 't-fg', 'middle'));
    }
    const FIELDS = [[0, 5, '15:11 op'], [5, 5, '10:6 imm5'], [10, 3, '5:3 Rn'], [13, 3, '2:0 Rt']];
    const fmean = FIELDS.map(([i0, n, name]) => {
      const cx = ex(i0) + n * CB / 2;
      T(g, cx, YE - 10, name, 't-sm', 'middle');
      if (i0) s('line', { x1: ex(i0), x2: ex(i0), y1: YE - 3, y2: YE + 29, class: 's-fg', style: 'stroke-width: 2' }, g);
      return T(g, cx, YE + 42, '', 't-fg', 'middle');
    });
    const insT = T(g, 10, YE + 13, '', 't-fg t-bold');
    const hexT = T(g, ex(16) + 14, YE + 13, '', 't-pri t-bold t-lg');
    const verdict = T(g, 10, 240, '', 't-fg t-bold');

    const OPS = { ldr: [0b01101, 4, 'ldr'], str: [0b01100, 4, 'str'], ldrh: [0b10001, 2, 'ldrh'], ldrb: [0b01111, 1, 'ldrb'] };
    const C = [
      { m: 'ldr', o: 28, rt: 6, reg: 'ISR', note: 'USART2->ISR sits at offset 28 = 0x1C. 28 ÷ 4 = 7 fits in 5 bits, so one 16-bit ldr reaches it: 0x69E6, the real instruction at 80002d0.' },
      { m: 'str', o: 40, rt: 5, reg: 'TDR', note: 'USART2->TDR sits at offset 40 = 0x28, so imm5 = 10. The store has the same format with opcode 01100: 0x62A5, the real instruction at 80002d6.' },
      { m: 'ldr', o: 124, rt: 6, note: '124 ÷ 4 = 31 = 11111, the largest number 5 bits hold. Offset 124 is the last word one 16-bit ldr reaches.' },
      { m: 'ldr', o: 128, rt: 6, note: '128 ÷ 4 = 32 needs 6 bits. The compiler first adds to the base, then loads. This is why a far field of a large peripheral struct costs an extra instruction.' },
      { m: 'ldr', o: -4, rt: 6, note: 'There is no negative offset in 16-bit Thumb. To step backwards the compiler adjusts the base register first.' },
      { m: 'ldrh', o: 62, rt: 6, note: 'A halfword access scales by 2, so the same 5 bits reach only 31 × 2 = 62 bytes.' },
      { m: 'ldrb', o: 31, rt: 6, note: 'A byte access is unscaled: 0 to 31 bytes.' },
      { m: 'ldrb', o: 32, rt: 6, note: 'Offset 32 is in reach of ldr and ldrh, but not of ldrb. The reach depends on the access size.' },
    ];
    const note = role('off-note');
    steps(viz('off-steps'), C.map(c => `${c.m} #${c.o < 0 ? '−' + -c.o : c.o}`), k => {
      const c = C[k], [opc, size, mn] = OPS[c.m];
      const reach = 32 * size, imm = c.o / size;
      const ok = c.o >= 0 && c.o % size === 0 && imm <= 31;
      const ins = `${mn} r${c.rt}, [r4, #${c.o < 0 ? '−' + -c.o : c.o}]`;
      cells.forEach(({ o, r }) => r.setAttribute('class', (o >= 0 && o < reach ? 'f-pri-soft' : 'f-seg') + ' sep'));
      dyn.textContent = '';
      const mx = ox(c.o) + size * K / 2;
      s('rect', { x: ox(c.o), y: YS, width: size * K, height: HS, class: 'f-none ' + (ok ? 's-pri' : 's-bad'), style: 'stroke-width: 2.5' }, dyn);
      arrow(dyn, mx, 34, mx, YS - 3, { cls: ok ? 'a-pri' : 'a-bad', head: 6 });
      T(dyn, mx, 27, '#' + (c.o < 0 ? '−' + -c.o : c.o), (ok ? 't-pri' : 't-bad') + ' t-bold', 'middle');
      const by = YS + HS + 24;
      s('path', { d: `M${ox(0)} ${by - 5} V${by} H${ox(reach)} V${by - 5}`, class: 's-pri', style: 'stroke-width: 1.5' }, dyn);
      T(dyn, ox(reach / 2), by + 12, `one 16-bit ${mn} reaches 0 to ${31 * size}`, 't-pri', 'middle');
      insT.textContent = ins;
      const bits = ok ? ((opc << 11) | (imm << 6) | (4 << 3) | c.rt) : null;
      for (let i = 0; i < 16; i++) {
        const b = bits == null ? null : (bits >>> (15 - i)) & 1;
        ecell[i].setAttribute('class', (bits == null ? 'f-bad-soft' : b ? 'f-pri' : 'f-pri-soft') + ' sep');
        etxt[i].setAttribute('class', bits == null ? 't-bad' : b ? 't-on' : 't-pri');
        etxt[i].textContent = bits == null ? (i >= 5 && i < 10 ? '?' : '') : b;
      }
      const opBits = opc.toString(2).padStart(5, '0');
      if (ok) {
        fmean[0].textContent = mn + ' ' + opBits;
        fmean[1].textContent = size === 1 ? `${imm}, unscaled` : `${imm} × ${size} = ${c.o}`;
        fmean[2].textContent = 'r4';
        fmean[3].textContent = 'r' + c.rt;
        fmean.forEach(t => t.setAttribute('class', 't-fg'));
        hexT.textContent = '= ' + hex(bits, 4);
        hexT.setAttribute('class', 't-pri t-bold t-lg');
      } else {
        fmean[0].textContent = '';
        fmean[1].textContent = c.o < 0 ? 'no sign bit: never negative' : `${c.o} ÷ ${size} = ${imm} > 31`;
        fmean[2].textContent = '';
        fmean[3].textContent = '';
        fmean[1].setAttribute('class', 't-bad t-bold');
        hexT.textContent = 'no 16-bit encoding';
        hexT.setAttribute('class', 't-bad t-bold');
      }
      verdict.textContent = ok
        ? `One 16-bit instruction${c.reg ? ': USART2->' + c.reg : ''}.`
        : c.o < 0 ? 'Two instructions: subs moves the base back first. A Cortex-M4 has negative offsets.'
          : `Two instructions: an add moves the base first. A Cortex-M4 does ${c.m} r6, [r4, #${c.o}] in one.`;
      verdict.setAttribute('class', (ok ? 't-ok' : 't-bad') + ' t-bold');
      note.textContent = c.note;
    });
  });

  // Figure 7: SystemInit's first line, instruction by instruction
  part('acr', () => {
    const g = svg(viz('acr'), 800, 334, { label: 'SystemInit read-modify-write of FLASH ACR: the seven instructions, the registers they change, and the bits of ACR and the working copy', minWidth: 560 });
    T(g, 10, 14, '0800022c <SystemInit>:', 't-fg t-bold');
    const LST = [
      ['800022c', '2007', 'movs r0, #7', 'mask'],
      ['800022e', '2301', 'movs r3, #1', 'value'],
      ['8000230', '4a0b', 'ldr  r2, [pc, #44]', 'FLASH base'],
      ['8000232', '6811', 'ldr  r1, [r2, #0]', 'LOAD'],
      ['8000234', '4381', 'bics r1, r0', 'MODIFY'],
      ['8000236', '430b', 'orrs r3, r1', 'MODIFY'],
      ['8000238', '6013', 'str  r3, [r2, #0]', 'STORE'],
    ];
    const ly = i => 36 + i * 22;
    const hl = LST.map((r, i) => R(g, 8, ly(i) - 10, 392, 20, 'f-none', 3));
    LST.forEach(([a, h, t, tag], i) => {
      T(g, 14, ly(i), a, 't-muted');
      T(g, 74, ly(i), h, 't-muted');
      T(g, 120, ly(i), t, 't-fg');
      T(g, 290, ly(i), tag, 't-sm ' + (tag === 'LOAD' || tag === 'STORE' ? 't-pri t-bold' : 't-muted'));
    });
    const regBox = (x, y, name) => {
      const r = R(g, x, y, 175, 38, 'f-surface box', 6);
      const n = T(g, x + 12, y + 19, name, 't-fg t-bold');
      const v = T(g, x + 165, y + 19, '', 't-fg', 'end');
      return { r, n, v };
    };
    const RG = [regBox(430, 28, 'r0'), regBox(615, 28, 'r1'), regBox(430, 74, 'r2'), regBox(615, 74, 'r3')];
    const bus = T(g, 430, 132, '', 't-fg t-bold');
    T(g, 430, 152, 'the ldr from the pool reads flash, not ACR', 't-sm');

    const BX = b => 166 + (19 - b) * 30, YA = 228, YC = 284, HB = 26;
    [[18, 'DBG_SWEN', 198], [16, 'PROGEMPTY', 212], [11, 'ICRST', 212], [9, 'ICEN', 198], [8, 'PRFTEN', 212]].forEach(([b, n, y]) => T(g, BX(b) + 15, y, n, 't-sm', 'middle'));
    T(g, BX(1) + 15, 212, 'LATENCY', 't-sec t-bold', 'middle');
    const row = (y, name, sub) => {
      const nm = T(g, 10, y + 7, name, 't-fg t-bold');
      T(g, 10, y + 21, sub, 't-sm');
      R(g, 110, y, 50, HB, 'f-seg sep', 0);
      T(g, 135, y + HB / 2, '0…0', 't-muted', 'middle');
      const cs = [], ts = [];
      for (let b = 19; b >= 0; b--) {
        cs[b] = R(g, BX(b), y, 30, HB, 'f-seg sep', 0);
        ts[b] = T(g, BX(b) + 15, y + HB / 2, '0', 't-muted', 'middle');
      }
      s('rect', { x: BX(2), y: y - 2, width: 90, height: HB + 4, class: 'f-none outline-sec' }, g);
      return { nm, cs, ts };
    };
    const ra = row(YA, 'FLASH->ACR', 'the register');
    const rc = row(YC, 'r1', 'working copy');
    T(g, 135, YC + HB + 12, '31:20', 't-sm', 'middle');
    [19, 16, 11, 8, 2, 0].forEach(b => T(g, BX(b) + 15, YC + HB + 12, String(b), 't-sm', 'middle'));
    const paint = (rw, v) => {
      for (let b = 0; b < 20; b++) {
        const one = v == null ? 0 : (v >>> b) & 1;
        rw.cs[b].setAttribute('class', (v == null ? 'f-seg' : one ? 'f-pri' : 'f-pri-soft') + ' sep');
        rw.ts[b].setAttribute('class', v == null ? 't-muted' : one ? 't-on' : 't-pri');
        rw.ts[b].textContent = v == null ? '·' : one;
      }
    };

    const A0 = 0x300, BASE = 0x40022000;
    const ST = [
      { b: 'movs r0', r: [7, null, null, null], acr: A0, cp: null, rd: 0, wr: 0, chg: 0,
        note: 'movs r0, #7 puts the LATENCY mask, bits 2:0, in r0. 7 fits in the 8-bit immediate, so no memory is read.' },
      { b: 'movs r3', r: [7, null, null, 1], acr: A0, cp: null, rd: 0, wr: 0, chg: 3,
        note: 'movs r3, #1 puts the new LATENCY value, FLASH_ACR_LATENCY_0, in r3.' },
      { b: 'ldr r2', r: [7, null, BASE, 1], acr: A0, cp: null, rd: 0, wr: 0, chg: 2,
        note: 'ldr r2, [pc, #44] fetches 0x40022000, the FLASH base, from the literal pool after the function (block 10). That reads flash, not FLASH->ACR.' },
      { b: 'ldr r1', r: [7, A0, BASE, 1], acr: A0, cp: ['r1', A0], rd: 1, wr: 0, chg: 1,
        note: 'LOAD. ldr r1, [r2, #0] reads FLASH->ACR into r1, the first bus event on the register. The offset is 0 because ACR is the first register of the FLASH block.' },
      { b: 'bics', r: [7, A0 & ~7, BASE, 1], acr: A0, cp: ['r1', A0 & ~7], rd: 1, wr: 0, chg: 1,
        note: 'MODIFY. bics r1, r0 computes r1 AND NOT 7, the & ~ of the C line. LATENCY was already 0 in this example, so r1 stays 0x300. From any other value it would clear bits 2:0. Every other bit is kept.' },
      { b: 'orrs', r: [7, A0 & ~7, BASE, (A0 & ~7) | 1], acr: A0, cp: ['r3', (A0 & ~7) | 1], rd: 1, wr: 0, chg: 3,
        note: 'MODIFY. orrs r3, r1 computes 1 OR r1 = 0x301, the | of the C line. ICEN and PRFTEN are still set because they came through the read.' },
      { b: 'str', r: [7, A0 & ~7, BASE, (A0 & ~7) | 1], acr: (A0 & ~7) | 1, cp: ['r3', (A0 & ~7) | 1], rd: 1, wr: 1, chg: 'acr',
        note: 'STORE. str r3, [r2, #0] writes 0x301 back, the second and last bus event. One C statement changed one field and left every other bit as it was.' },
    ];
    const note = role('acr-note');
    steps(viz('acr-steps'), ST.map(x => x.b), k => {
      const c = ST[k];
      hl.forEach((r, i) => r.setAttribute('class', i === k ? 'f-pri-soft' : 'f-none'));
      RG.forEach((rg, i) => {
        const on = c.chg === i, v = c.r[i];
        rg.r.setAttribute('class', (on ? 'f-pri' : 'f-surface') + ' box');
        rg.n.setAttribute('class', (on ? 't-on' : 't-fg') + ' t-bold');
        rg.v.setAttribute('class', on ? 't-on t-bold' : v == null ? 't-muted' : 't-fg');
        rg.v.textContent = v == null ? 'not set yet' : hex(v);
      });
      paint(ra, c.acr);
      ra.nm.setAttribute('class', c.chg === 'acr' ? 't-pri t-bold' : 't-fg t-bold');
      paint(rc, c.cp ? c.cp[1] : null);
      rc.nm.textContent = c.cp ? c.cp[0] : 'r1';
      bus.textContent = `FLASH->ACR on the bus: read ${c.rd} · written ${c.wr}`;
      note.textContent = c.note;
    }, 6);
  });

  // Figure 8: PC-relative literal load and PC-relative branch in SystemInit
  part('pc', () => {
    const g = svg(viz('pc'), 760, 304, { label: 'SystemInit halfwords and its literal pool: ldr r2, [pc, #44] reaches forward to the pool, bne.n reaches back to the ldr, and the HSIDIV mask word in bits', minWidth: 540 });
    const X0 = 20, HW = 28, GAP = 60, YS = 92, HS = 30;
    const HWS = [[0x22c, '2007'], [0x22e, '2301'], [0x230, '4a0b'], [0x232, '6811'], [0x234, '4381'], [0x236, '430b'], [0x238, '6013'], [0x23a, '6813'], [0x23c, '4003'], [0x23e, '2b01'], [0x240, 'd1fb'], [0x242, null], [0x244, null]];
    const POOL = [[0x260, '40022000'], [0x264, '40021000'], [0x268, 'ffffc7ff'], [0x26c, '20000000'], [0x270, '02dc6c00']];
    const xh = i => X0 + i * HW;
    const xp = j => X0 + HWS.length * HW + GAP + j * 2 * HW;
    const title = T(g, 10, 14, '', 't-fg t-bold');
    const hc = HWS.map(([a, v], i) => {
      const r = R(g, xh(i), YS, HW, HS, 'f-seg sep', 0);
      const t = T(g, xh(i) + HW / 2, YS + HS / 2, v || '··', 't-sm ' + (v ? 't-fg' : 't-muted'), 'middle');
      T(g, xh(i) + HW / 2, YS + HS + 12, a.toString(16), 't-sm', 'middle');
      return { r, t, v };
    });
    const gx = xh(HWS.length) + GAP / 2;
    T(g, gx, YS + HS / 2, '…', 't-muted t-lg', 'middle');
    T(g, gx, YS + HS + 12, '246–25e', 't-sm', 'middle');
    const pc = POOL.map(([a, v], j) => {
      const r = R(g, xp(j), YS, 2 * HW, HS, 'f-ter-soft sep', 0);
      const t = T(g, xp(j) + HW, YS + HS / 2, v, 't-sm t-fg', 'middle');
      T(g, xp(j) + HW, YS + HS + 12, a.toString(16), 't-sm', 'middle');
      return { r, t };
    });
    T(g, (xh(0) + xh(HWS.length)) / 2, YS + HS + 30, 'SystemInit at 0x80002__, 2 bytes per instruction', 't-muted', 'middle');
    T(g, (xp(0) + xp(5)) / 2, YS + HS + 30, 'literal pool, 4 bytes per word', 't-ter', 'middle');
    const dyn = s('g', {}, g);
    const calc = [0, 1, 2].map(i => T(g, 10, 180 + i * 20, '', i === 1 ? 't-fg t-bold' : 't-fg'));

    const mg = s('g', { class: 'fade' }, g);
    const MX = b => 60 + (31 - b) * 20, MY = 256;
    T(mg, 60, 238, 'pool word 3 = 0xFFFFC7FF = ~(7 << 11)', 't-fg');
    const MV = 0xFFFFC7FF;
    for (let b = 31; b >= 0; b--) {
      const one = (MV >>> b) & 1;
      R(mg, MX(b), MY, 20, 22, (one ? 'f-pri' : 'f-seg') + ' sep', 0);
      T(mg, MX(b) + 10, MY + 11, String(one), one ? 't-on' : 't-muted', 'middle');
    }
    for (let i = 1; i < 8; i++) s('line', { x1: 60 + 4 * i * 20, x2: 60 + 4 * i * 20, y1: MY - 3, y2: MY + 25, class: 's-muted' }, mg);
    s('rect', { x: MX(13), y: MY - 2, width: 60, height: 26, class: 'f-none outline-sec' }, mg);
    T(mg, MX(12) + 10, 240, 'HSIDIV', 't-sec t-bold', 'middle');
    [31, 13, 11, 0].forEach(b => T(mg, MX(b) + 10, MY + 34, String(b), 't-sm', 'middle'));
    T(mg, 730, MY + 11, 'RCC->CR', 't-sm', 'end');

    const hi = (cell, cls, tcls) => { cell.r.setAttribute('class', cls + ' sep'); cell.t.setAttribute('class', 't-sm ' + tcls); };
    const reset = () => {
      hc.forEach(c => hi(c, 'f-seg', c.v ? 't-fg' : 't-muted'));
      pc.forEach(c => hi(c, 'f-ter-soft', 't-fg'));
    };
    const elbow = (sx, tx, label) => {
      s('path', { d: `M${sx} ${YS - 2} V56 H${tx}`, class: 's-pri', style: 'stroke-width: 2' }, dyn);
      arrow(dyn, tx, 56, tx, YS - 2, { cls: 'a-pri', width: 2, head: 7 });
      T(dyn, (sx + tx) / 2, 46, label, 't-pri t-bold', 'middle');
    };
    const pcMark = x => {
      s('line', { x1: x, x2: x, y1: 82, y2: YS + HS, class: 's-ok', style: 'stroke-width: 2' }, dyn);
      T(dyn, x, 74, 'PC', 't-ok t-bold', 'middle');
    };
    const C = [
      { b: 'ldr r2, [pc, #44]', go: () => {
        hi(hc[2], 'f-pri', 't-on t-bold');
        hi(pc[0], 'f-pri', 't-on t-bold');
        elbow(xh(2) + HW / 2, xp(0) + HW, '+ 4 × 11 = 44 bytes from PC');
        pcMark(xh(4));
      },
      title: 'ldr r2, [pc, #44] at 0x8000230 reaches forward into the pool',
      calc: ['0x4A0B = 01001 010 00001011: ldr from PC, Rt = r2, imm8 = 11',
        'PC = Align(0x8000230 + 4, 4) = 0x8000234;   0x8000234 + 4 × 11 = 0x8000260',
        'the word at 0x8000260 is 0x40022000, the FLASH base, so r2 = 0x40022000'],
      note: 'A 16-bit instruction cannot hold 0x40022000, so the compiler stored it after the function and loads it relative to PC. imm8 counts words, so 11 means 44 bytes.' },
      { b: 'bne.n 800023a', go: () => {
        [7, 8, 9].forEach(i => hi(hc[i], 'f-pri-soft', 't-pri t-bold'));
        hi(hc[10], 'f-pri', 't-on t-bold');
        elbow(xh(10) + HW / 2, xh(7) + HW / 2, '2 × (−5) = −10 bytes from PC');
        pcMark(xh(12));
      },
      title: 'bne.n 800023a at 0x8000240 reaches back to the ldr',
      calc: ['0xD1FB = 1101 0001 11111011: conditional branch, cond 0001 = NE, imm8 = 0xFB = −5',
        'PC = 0x8000240 + 4 = 0x8000244;   0x8000244 + 2 × (−5) = 0x800023A',
        'the target is the ldr at 0x800023A: read, test, branch back, four instructions a pass'],
      note: 'The polling loop of slide 13. The branch offset counts halfwords and is signed, so 0xFB = −5 jumps 10 bytes back from PC to the ldr.' },
      { b: 'pool word 3', go: () => { hi(pc[2], 'f-pri', 't-on t-bold'); },
      title: 'the third pool word is a mask, all ones except one field',
      calc: ['the word at 0x8000268 is 0xFFFFC7FF = ~(7 << 11)',
        'all ones except bits 13:11, the HSIDIV field of RCC->CR',
        'an ands with it clears exactly HSIDIV and keeps every other bit'],
      note: '7 << 11 = 0x3800 sets bits 13:11, and ~ flips every bit. The pool holds every constant SystemInit needs: two peripheral bases, this mask, the address of SystemCoreClock and 48 000 000.' },
    ];
    const note = role('pc-note');
    steps(viz('pc-steps'), C.map(c => c.b), k => {
      const c = C[k];
      reset();
      dyn.textContent = '';
      c.go();
      title.textContent = c.title;
      calc.forEach((t, i) => { t.textContent = c.calc[i]; });
      mg.classList.toggle('dim', k !== 2);
      note.textContent = c.note;
    });
  });

  // Figure 9: _write in source order against address order
  part('map', () => {
    const g = svg(viz('map'), 800, 340, { label: 'The C source of _write and uart2_putc on the left, the address ranges they became on the right, joined by lines that cross', minWidth: 560 });
    const C = [
      'static void uart2_putc(char c) {',
      '    while (!(USART2->ISR & TXE)) { }',
      '    USART2->TDR = (uint8_t)c;',
      '}',
      'int _write(int fd, const char *buf, int len) {',
      '    (void)fd;',
      '    for (int i = 0;',
      '         i < len;',
      '         i++) {',
      '        if (buf[i] == \'\\n\')',
      '            uart2_putc(\'\\r\');',
      '        uart2_putc(buf[i]);',
      '    }',
      '    return len;',
      '}',
    ];
    const B = [
      ['80002b8', 'push {r4–r7, lr}'],
      ['80002ba–c0', 'i = 0, #128, #13, USART2'],
      ['80002c2–c4', 'cmp i, len; blt body'],
      ['80002c6–c8', 'return len; pop {…, pc}'],
      ['80002ca–ce', 'c = buf[i]; c == 10 ?'],
      ['80002d0–d6', 'wait TXE; TDR = 13'],
      ['80002d8–e0', 'c = buf[i]; wait TXE; TDR = c'],
      ['80002e2–e4', 'i++; b 80002c2'],
    ];
    const cy = i => 34 + i * 20, by = j => 24 + j * 38;
    T(g, 10, 12, 'SOURCE ORDER', 't-muted t-bold');
    T(g, 470, 12, 'ADDRESS ORDER', 't-muted t-bold');
    const chl = C.map((t, i) => R(g, 6, cy(i) - 10, 364, 20, 'f-none', 3));
    C.forEach((t, i) => T(g, 10, cy(i), t, i === 0 || i === 4 ? 't-fg t-bold' : 't-fg').setAttribute('style', 'white-space: pre'));
    T(g, 110, cy(5), '→ no instruction', 't-sm');
    const links = s('g', {}, g);
    const blk = B.map(([a, d], j) => {
      const r = R(g, 470, by(j), 320, 30, 'f-surface box', 5);
      T(g, 478, by(j) + 15, a, 't-pri t-bold');
      T(g, 556, by(j) + 15, d, 't-fg');
      return r;
    });
    const BASE = [[4, 0], [6, 1], [7, 2], [9, 4], [10, 5], [11, 6], [8, 7], [13, 3], [14, 3]];
    const S = [
      { b: 'All', ln: [], bl: [],
        note: 'Each line of _write became a run of addresses. Read down the right column and the lines cross: the order of the machine code is not the order of the source.' },
      { b: 'Hoisting', ln: [[1, 1], [10, 1]], bl: [1],
        note: 'The TXE mask, 128, and the USART2 base come from the loop inside uart2_putc, and #13 from the \'\\r\' argument. They never change, so they are loaded once at 80002bc–c0, before the loop.' },
      { b: 'Inlining', ln: [[1, 5], [2, 5], [1, 6], [2, 6], [10, 5], [11, 6]], bl: [5, 6],
        note: 'uart2_putc is never called. Its poll and its store appear twice: once for \'\\r\' at 80002d0–d6 and once for the character at 80002d8–e0. _write contains no bl.' },
      { b: 'Rotation', ln: [[7, 2], [8, 7], [13, 3], [14, 3]], bl: [2, 3, 7],
        note: 'The for test sits at 80002c2, the top of the loop. When it fails, execution falls through to return len at 80002c6, in the middle of the function. i++ and the jump back sit at the end. A debugger stepping this code appears to jump around.' },
      { b: 'buf[i] twice', ln: [[9, 4], [11, 6]], bl: [4, 6],
        note: 'buf[i] is loaded at 80002ca and again at 80002d8. A char may alias anything, so the store to USART2->TDR might have changed buf[i] as far as the C standard knows.' },
    ];
    const link = ([i, j], on) => s('line', { x1: 376, y1: cy(i), x2: 468, y2: by(j) + 15, class: on ? 's-pri' : 's-muted', style: 'stroke-width: ' + (on ? 2 : 1) + (on ? '' : '; opacity: 0.6') }, links);
    const note = role('map-note');
    steps(viz('map-steps'), S.map(x => x.b), k => {
      const c = S[k];
      links.textContent = '';
      BASE.forEach(p => link(p, false));
      c.ln.forEach(p => link(p, true));
      const lines = c.ln.map(p => p[0]);
      chl.forEach((r, i) => r.setAttribute('class', lines.indexOf(i) >= 0 ? 'f-pri-soft' : 'f-none'));
      blk.forEach((r, j) => r.setAttribute('class', c.bl.indexOf(j) >= 0 ? 'f-pri-soft outline-pri' : 'f-surface box'));
      note.textContent = c.note;
    });
  });

  // Figure 10: the top five bits of a halfword decide 16 or 32 bits
  part('hw', () => {
    const g = svg(viz('hw'), 800, 232, { label: 'A halfword in binary with its top five bits outlined, the fields of its format, and whether the next halfword belongs to it', minWidth: 560 });
    const X1 = 40, X2 = 416, CW = 22, Y = 70, H = 28;
    const title = T(g, 10, 14, '', 't-fg t-bold');
    T(g, X1, 34, 'this halfword', 't-sm');
    T(g, X2, 34, 'the next halfword', 't-sm');
    const mk = X => {
      const cs = [], ts = [], nb = [];
      for (let i = 15; i >= 0; i--) {
        cs[i] = R(g, X + (15 - i) * CW, Y, CW, H, 'f-seg sep', 0);
        ts[i] = T(g, X + (15 - i) * CW + CW / 2, Y + H / 2, '', 't-muted', 'middle');
      }
      for (let n = 0; n < 4; n++) nb.push(T(g, X + (4 * n + 2) * CW, Y - 10, '', 't-pri t-bold', 'middle'));
      [15, 0].forEach(i => T(g, X + (15 - i) * CW + CW / 2, Y - 24, String(i), 't-sm', 'middle'));
      return { X, cs, ts, nb };
    };
    const A = mk(X1), Bh = mk(X2);
    const dashBox = s('g', {}, g);
    R(dashBox, X2, Y, 16 * CW, H, 'f-surface box dash', 4);
    T(dashBox, X2 + 8 * CW, Y + H / 2, 'a new instruction, decoded on its own', 't-muted', 'middle');
    s('rect', { x: X1 - 1, y: Y - 1, width: 5 * CW + 2, height: H + 2, class: 'f-none outline-sec' }, g);
    const fl = s('g', {}, g);
    const dec = T(g, 10, 172, '', 't-fg');
    const verdict = T(g, 10, 194, '', 't-pri t-bold');
    const mean = T(g, 10, 216, '', 't-fg');
    const paint = (h, v) => {
      for (let i = 0; i < 16; i++) {
        const one = (v >>> i) & 1;
        h.cs[i].setAttribute('class', (one ? 'f-pri' : 'f-pri-soft') + ' sep');
        h.ts[i].setAttribute('class', one ? 't-on' : 't-pri');
        h.ts[i].textContent = one;
      }
      hex(v, 4).slice(2).split('').forEach((c, n) => { h.nb[n].textContent = c; });
    };
    const fields = (h, F) => F.forEach(([hi, lo, name, val]) => {
      const x1 = h.X + (15 - hi) * CW + 2, x2 = h.X + (16 - lo) * CW - 2;
      s('path', { d: `M${x1} ${Y + H + 4} V${Y + H + 9} H${x2} V${Y + H + 4}`, class: 's-muted', style: 'stroke-width: 1' }, fl);
      if (name) T(fl, (x1 + x2) / 2, Y + H + 22, name, 't-fg t-bold t-sm', 'middle');
      T(fl, (x1 + x2) / 2, Y + H + 38, val, 't-pri t-sm', 'middle');
    });
    const HWD = [
      { b: '2007 movs', a: '0x800022c', w: [0x2007], asm: 'movs r0, #7',
        f: [[15, 11, 'op', '00100'], [10, 8, 'Rd', 'r0'], [7, 0, 'imm8', '7']],
        m: 'movs r0, #7: the constant fits in 8 bits, inside the instruction' },
      { b: '4A0B ldr pc', a: '0x8000230', w: [0x4A0B], asm: 'ldr r2, [pc, #44]',
        f: [[15, 11, 'op', '01001'], [10, 8, 'Rt', 'r2'], [7, 0, 'imm8', '11 × 4 = 44']],
        m: 'ldr r2, [pc, #44]: 44 bytes from PC, into the literal pool' },
      { b: '6811 ldr', a: '0x8000232', w: [0x6811], asm: 'ldr r1, [r2, #0]',
        f: [[15, 11, 'op', '01101'], [10, 6, 'imm5', '0'], [5, 3, 'Rn', 'r2'], [2, 0, 'Rt', 'r1']],
        m: 'ldr r1, [r2, #0]: 3 bits per register, so only r0–r7 fit' },
      { b: 'D1FB bne', a: '0x8000240', w: [0xD1FB], asm: 'bne.n 800023a',
        f: [[15, 12, 'op', '1101'], [11, 8, 'cond', '0001 NE'], [7, 0, 'imm8', '0xFB = −5']],
        m: 'bne.n: an 8-bit halfword offset reaches −256 to +254 bytes' },
      { b: 'E7ED b', a: '0x80002e4', w: [0xE7ED], asm: 'b.n 80002c2',
        f: [[15, 11, 'op', '11100'], [10, 0, 'imm11', '0x7ED = −19 halfwords']],
        m: 'b.n: 11100 is one short of 11101, so 16 bits; it reaches about ±2 KB' },
      { b: 'F7FF FFCF bl', a: '0x800028a', w: [0xF7FF, 0xFFCF], asm: 'bl 800022c <SystemInit>',
        f: [[15, 11, 'op', '11110'], [10, 10, 'S', '1'], [9, 0, 'imm10', '0x3FF']],
        f2: [[15, 14, '', '11'], [13, 13, 'J1', '1'], [12, 12, '', '1'], [11, 11, 'J2', '1'], [10, 0, 'imm11', '0x7CF']],
        m: 'bl: offset S:I1:I2:imm10:imm11:0 = −98, and 0x800028e − 98 = 0x800022c' },
    ];
    steps(viz('hw-steps'), HWD.map(x => x.b), k => {
      const c = HWD[k], wide = c.w.length === 2;
      const top5 = (c.w[0] >>> 11).toString(2).padStart(5, '0');
      title.textContent = `${c.w.map(v => hex(v, 4).slice(2)).join(' ')} at ${c.a} · ${c.asm}`;
      paint(A, c.w[0]);
      fl.textContent = '';
      fields(A, c.f);
      dashBox.setAttribute('visibility', wide ? 'hidden' : 'visible');
      [...Bh.cs, ...Bh.ts, ...Bh.nb].forEach(e => e.setAttribute('visibility', wide ? 'visible' : 'hidden'));
      if (wide) { paint(Bh, c.w[1]); fields(Bh, c.f2); }
      dec.textContent = `top five bits ${top5}: ` + (wide ? 'one of the 32-bit prefixes 11101, 11110, 11111' : 'not 11101, 11110 or 11111');
      verdict.textContent = wide ? '32 bits: the next halfword belongs to this instruction' : '16 bits: the next halfword starts a new instruction';
      verdict.setAttribute('class', (wide ? 't-sec' : 't-pri') + ' t-bold');
      mean.textContent = c.m;
    });
  });

  // Figure 11: hex bytes to a little-endian word to an address plus the Thumb bit
  part('tbit', () => {
    const g = svg(viz('tbit'), 800, 292, { label: 'The first hex record bytes in file order, one word read little-endian into a value, and the last hex digit in bits with bit 0 as the Thumb bit; then LR after bl and the return', minWidth: 560 });
    const BY = [0x00, 0x30, 0x00, 0x20, 0x75, 0x02, 0x00, 0x08, 0x29, 0x02, 0x00, 0x08, 0x29, 0x02, 0x00, 0x08];
    const X0 = 48, CW = 44, Y1 = 34, H = 30;
    const title = T(g, 10, 14, '', 't-fg t-bold');
    const r1 = s('g', { class: 'fade' }, g);
    T(r1, 10, Y1 + H / 2, 'file', 't-sm');
    const bc = BY.map((v, i) => {
      const r = R(r1, X0 + i * CW, Y1, CW, H, 'f-seg sep', 0);
      const t = T(r1, X0 + i * CW + CW / 2, Y1 + H / 2, h2(v), 't-fg', 'middle');
      return { r, t };
    });
    for (let w = 1; w < 4; w++) s('line', { x1: X0 + 4 * w * CW, x2: X0 + 4 * w * CW, y1: Y1 - 4, y2: Y1 + H + 4, class: 's-fg', style: 'stroke-width: 2.5' }, r1);
    ['slot 0 · 0x08000000', 'slot 1 · 0x08000004', 'slot 2 · 0x08000008', 'slot 3 · 0x0800000C'].forEach((t, w) => T(r1, X0 + (4 * w + 2) * CW, Y1 + H + 12, t, 't-sm', 'middle'));
    const lst = s('g', {}, g);
    T(lst, 48, 40, '800028a:  f7ff ffcf   bl  800022c <SystemInit>', 't-fg t-bold');
    T(lst, 48, 62, '800028e:  f000 fb31   bl  80008f4', 't-fg');
    const cross = s('g', {}, g);

    const Y2 = 128, VX = 260, VW = 60;
    const vlab = T(g, 10, Y2 + H / 2, '', 't-fg t-bold');
    const vsub = T(g, 10, Y2 + H / 2 + 15, '', 't-sm');
    const vc = [0, 1, 2, 3].map(i => ({ r: R(g, VX + i * VW, Y2, VW, H, 'f-pri-soft sep', 0), t: T(g, VX + i * VW + VW / 2, Y2 + H / 2, '', 't-pri t-lg', 'middle') }));
    const vtxt = T(g, VX + 4 * VW + 16, Y2 + H / 2, '', 't-fg t-bold t-lg');

    const Y3 = 202, BW = 44;
    T(g, 10, Y3 + H / 2, 'last hex digit', 't-sm');
    const dig = T(g, 10, Y3 + H / 2 + 15, '', 't-fg t-bold');
    const nc = [3, 2, 1, 0].map((b, i) => {
      T(g, VX + i * BW + BW / 2, Y3 - 10, 'bit ' + b, 't-sm', 'middle');
      return { r: R(g, VX + i * BW, Y3, BW, H, 'f-seg sep', 0), t: T(g, VX + i * BW + BW / 2, Y3 + H / 2, '', 't-fg t-lg', 'middle') };
    });
    const t0 = s('rect', { x: VX + 3 * BW - 1, y: Y3 - 1, width: BW + 2, height: H + 2, class: 'f-none outline-sec' }, g);
    const b1 = T(g, VX + 4 * BW + 16, Y3 + 6, '', 't-sec t-bold');
    const b2 = T(g, VX + 4 * BW + 16, Y3 + 26, '', 't-fg');
    const verdict = T(g, 10, 272, '', 't-fg t-bold');

    const ST = [
      { b: 'slot 0 · SP', w: 0, v: 0x20003000, lab: ['slot 0', 'MSB first'], title: 'Main.hex, first record: 16 data bytes in file order',
        b1: 'slot 0 is data, not a code address', b2: '0x20000000 + 12 KB = 0x20003000, the top of SRAM', bc: 't-fg',
        v2: 'The core loads SP from slot 0 at reset. Nothing branches here, so bit 0 carries no meaning.' },
      { b: 'slot 1 · reset', w: 1, v: 0x08000275, lab: ['slot 1', 'MSB first'], title: 'Main.hex, first record: 16 data bytes in file order',
        b1: 'bit 0 = T = 1: Thumb code', b2: 'Reset_Handler = 0x08000275 & ~1 = 0x08000274', bc: 't-ok',
        v2: 'Execution begins at 0x08000274, in Thumb state. Every function pointer on the chip is odd.' },
      { b: 'even vector', w: 1, v: 0x08000274, patch: 0x74, lab: ['slot 1', '"fixed"'], title: 'The same record with the reset vector "fixed" to the even address',
        b1: 'bit 0 = 0: asks for ARM state', b2: 'a Cortex-M has no ARM state', bc: 't-bad',
        v2: 'HardFault immediately on reset. A vector table full of even addresses is a dead chip.' },
      { b: 'bl → LR', v: 0x0800028F, lab: ['LR', 'after bl'], title: 'A real call in Reset_Handler: bl is 4 bytes',
        b1: 'bit 0 = 1, set by bl', b2: '0x0800028a + 4 = 0x0800028e, | 1 = 0x0800028f', bc: 't-ok',
        v2: 'LR is odd on purpose: the address of the next instruction plus the Thumb bit.' },
      { b: 'bx lr → PC', v: 0x0800028E, lab: ['PC', 'after bx lr'], title: 'The return: bx lr, or pop {…, pc}',
        b1: 'bit 0 read as "Thumb", then cleared', b2: 'PC ← LR & ~1 = 0x0800028e', bc: 't-ok',
        v2: 'Execution resumes at 0x0800028e, right after the 4-byte bl. Nothing is skipped and nothing is off by one.' },
    ];
    steps(viz('tbit-steps'), ST.map(x => x.b), k => {
      const c = ST[k], mem = c.w != null;
      title.textContent = c.title;
      r1.setAttribute('visibility', mem ? 'visible' : 'hidden');
      lst.setAttribute('visibility', mem ? 'hidden' : 'visible');
      bc.forEach((b, i) => {
        const inW = mem && Math.floor(i / 4) === c.w;
        const patched = c.patch != null && i === 4;
        b.t.textContent = h2(patched ? c.patch : BY[i]);
        b.r.setAttribute('class', (patched ? 'f-bad' : inW ? 'f-pri' : 'f-seg') + ' sep');
        b.t.setAttribute('class', patched || inW ? 't-on t-bold' : 't-fg');
      });
      cross.textContent = '';
      if (mem) {
        for (let i = 0; i < 4; i++) {
          const x1 = X0 + (4 * c.w + i) * CW + CW / 2, x2 = VX + (3 - i) * VW + VW / 2;
          arrow(cross, x1, Y1 + H + 22, x2, Y2 - 3, { cls: 'a-muted', head: 6, width: 1 });
        }
      }
      [0, 1, 2, 3].forEach(i => { vc[i].t.textContent = h2((c.v >>> (24 - 8 * i)) & 0xFF); });
      vlab.textContent = c.lab[0];
      vsub.textContent = c.lab[1];
      vtxt.textContent = '= ' + hex(c.v);
      const d = c.v & 0xF;
      dig.textContent = hex(d, 1).slice(2) + ' = ' + d.toString(2).padStart(4, '0');
      nc.forEach((n, i) => {
        const one = (d >>> (3 - i)) & 1;
        n.r.setAttribute('class', (one ? 'f-pri' : 'f-seg') + ' sep');
        n.t.setAttribute('class', one ? 't-on t-bold t-lg' : 't-muted t-lg');
        n.t.textContent = one;
      });
      t0.setAttribute('class', 'f-none ' + (c.bc === 't-bad' ? 's-bad' : 'outline-sec'));
      b1.textContent = c.b1;
      b1.setAttribute('class', (c.bc === 't-fg' ? 't-fg' : c.bc) + ' t-bold');
      b2.textContent = c.b2;
      verdict.textContent = c.v2;
      verdict.setAttribute('class', (c.bc === 't-bad' ? 't-bad' : 't-fg') + ' t-bold');
    }, 1);
  });

  // Figure 12: the polling loop with and without volatile, pass by pass
  part('vol', () => {
    const g = svg(viz('vol'), 800, 256, { label: 'Passes of the LATENCY polling loop: with volatile every pass reads FLASH ACR and the loop exits when it reads 1; without volatile one read is cached in r3 and the loop never ends', minWidth: 560 });
    const X0 = 210, CW = 62, GAP = 8, N = 8;
    const cx = i => X0 + i * (CW + GAP);
    for (let i = 0; i < N; i++) T(g, cx(i) + CW / 2, 16, 'pass ' + (i + 1), 't-sm', 'middle');
    const lab = (y, a, b, cls) => { T(g, 10, y + 9, a, cls + ' t-bold'); T(g, 10, y + 24, b, 't-sm'); };
    const HWV = [0, 0, 0, 1, 1, 1, 1, 1];
    lab(30, 'hardware', 'LATENCY field in ACR', 't-fg');
    HWV.forEach((v, i) => {
      R(g, cx(i), 30, CW, 30, (v ? 'f-ok-soft' : 'f-seg') + ' sep', 3);
      T(g, cx(i) + CW / 2, 45, String(v), v ? 't-ok t-bold' : 't-muted', 'middle');
    });
    T(g, cx(3) + CW / 2, 72, 'the controller applies the write', 't-ok t-sm', 'middle');
    lab(96, 'volatile', 'CMSIS __IO: read every pass', 't-pri');
    HWV.slice(0, 4).forEach((v, i) => {
      R(g, cx(i), 96, CW, 30, 'f-pri sep', 3);
      T(g, cx(i) + CW / 2, 111, 'read ' + v, 't-on t-bold', 'middle');
    });
    T(g, cx(4) + 8, 111, 'loop exits, SystemInit goes on', 't-ok t-bold');
    lab(162, 'no volatile', '-Os: read once, kept in r3', 't-bad');
    R(g, cx(0), 162, CW, 30, 'f-pri sep', 3);
    T(g, cx(0) + CW / 2, 177, 'read 0', 't-on t-bold', 'middle');
    for (let i = 1; i < N; i++) {
      R(g, cx(i), 162, CW, 30, 'f-bad-soft sep', 3);
      T(g, cx(i) + CW / 2, 177, 'r3 = 0', 't-bad', 'middle');
    }
    T(g, cx(N - 1) + CW / 2, 204, 'forever', 't-bad t-bold', 'middle');
    T(g, 10, 228, 'volatile: one bus read per pass, so pass 4 sees the change and the loop exits.', 't-fg');
    T(g, 10, 246, 'no volatile: r3 never changes, so the loop spins forever. Works at -O0, hangs at -Os.', 't-bad t-bold');
  });

  // General idea vs this chip; the first four rows are guide §2's contrasts for lesson 01
  part('contrast', () => {
    const rows = [
      ['Instruction-set model', 'register–memory: an ALU operand may be memory (x86, 68000, S/360; the VAX allowed both operands)', 'load–store: only ldr and str touch memory (also RISC-V, MIPS, AVR)', 'counter++ is ldr, adds, str: 3 instructions, but the same 2 bus accesses as x86\'s one; setting a register bit is read-modify-write with a gap an interrupt can land in; no sbi, so BSRR (lesson 05)'],
      ['RISC vs CISC', 'CISC: variable-length instructions, x86 1 to 15 bytes, memory operands', 'RISC: fixed 2- or 4-byte Thumb instructions', 'a decoder that never asks how long an instruction is, the same pipeline stages for every opcode; costs more instructions, not more memory traffic'],
      ['Remembering a comparison', 'compare-and-branch, no flags register (RISC-V blt a0, a1, L; MIPS)', 'condition codes: N Z C V in APSR', 'cmp then a branch; one cmp can feed several branches; signed blt/bge read N and V, unsigned bcc/bcs read C'],
      ['Where the return address goes', 'stack-based: call pushes it, ret pops it (x86, 68000, AVR rcall/ret)', 'link register: bl writes LR (also RISC-V ra, MIPS $ra, PowerPC)', 'a leaf call touches no memory; a non-leaf must push {lr} first and returns with pop {pc}'],
      ['Code density', 'wide fixed-length (ARM A32), variable-length (x86), a compressed set beside the full one (MIPS16, RISC-V "C")', 'Thumb only: 16 bits, widened to 32 only when it must; Thumb-1 plus six 32-bit instructions', 'about 30% smaller code; no ARM state to switch to; the six 32-bit ones are bl, mrs, msr, dsb, dmb, isb'],
      ['A 32-bit constant', 'x86 makes the instruction longer; RISC-V lui + addi; AArch64 movz + movk; Thumb-2 movw + movt', 'a literal pool after the function, loaded PC-relative', 'ldr r2, [pc, #44]; every peripheral base the function uses sits in plain sight in the pool'],
      ['Calling convention (ABI)', 'SysV AMD64 on Linux, the RISC-V and MIPS conventions', 'AAPCS', 'arguments r0–r3, result r0, r4–r11 callee-saved: _write pushes r4–r7 and LR, 20 bytes'],
      ['Instruction-set state', 'Cortex-A switches between ARM and Thumb; bit 0 of a branch target says which', 'always Thumb, so bit 0 is always 1', 'vectors and LR are odd; an even target faults; return goes to LR & ~1'],
      ['Divide', 'hardware sdiv / udiv (Cortex-M3 and above)', 'none on ARMv6-M: a call to __aeabi_uidiv', 'division is far slower than multiply; the .map shows libgcc.a(_udivsi3.o)'],
      ['What the compiler may change', 'it preserves only behaviour the C standard can observe', 'volatile on every register, CMSIS __IO', 'without it a status read is cached in a register: works at -O0, hangs at -Os'],
    ];
    const t = table(viz('contrast'), ['General idea', 'Alternatives', 'This chip', 'What follows'].map(L),
      rows.map(r => r.map((c, i) => ({ text: c, cls: i === 2 ? 'l hl' : 'l' }))));
    t.rows.slice(0, 4).forEach(r => r.classList.add('on'));
  });
});
