QV.register('topic2', function (q) {
  const { s, svg, arrow, steps, table } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const T = (g, x, y, text, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor, class: cls }, g, text);
  // code lines keep their alignment spaces
  const C = (g, x, y, text, cls) => s('text', { x, y, dy: '0.35em', class: cls || 't-fg', style: 'white-space: pre' }, g, text);
  // one figure failing must not blank the other nine
  const part = (name, f) => { try { f(); } catch (e) { QV.fail('topic2 ' + name, e); } };
  const card = (g, x, y, w, h, lines, fill, stroke) => {
    const r = s('rect', { x, y, width: w, height: h, rx: 6, class: (fill || 'f-surface') + ' ' + (stroke || 'box') }, g);
    const lh = 15, t0 = y + h / 2 - (lines.length - 1) * lh / 2;
    const ts = lines.map(([t, c], i) => T(g, x + w / 2, t0 + i * lh, t, c || 't-fg', 'middle'));
    return { r, ts };
  };
  const brace = (g, x1, x2, y, label, cls) => {
    s('path', { d: `M${x1} ${y + 6} V${y} H${x2} V${y + 6}`, class: 's-muted', style: 'stroke-width: 1' }, g);
    T(g, (x1 + x2) / 2, y - 9, label, cls || 't-sm', 'middle');
  };
  const setText = (els, lines) => els.forEach((e, i) => { e.textContent = lines[i] || ''; });

  // Figure 1: SystemCoreClock through the five stages
  part('tc', () => {
    const g = svg(viz('tc'), 820, 316, { label: 'SystemCoreClock through preprocess, compile, assemble, link and locate; only locate gives it the address 0x20000000', minWidth: 560 });
    const X = [10, 145, 280, 415, 560, 695], W = 115, Y = 30, H = 46;
    const NAMES = [['main.c', 'your source'], ['preprocess', '→ main.i'], ['compile', '→ main.s'], ['assemble', '→ main.o'], ['link', 'match names'], ['locate', '→ Main.elf']];
    brace(g, 145, 530, 20, 'one .c file at a time, knowing nothing of the others');
    brace(g, 560, 810, 20, 'the linker: every file at once', 't-sm t-pri');
    const boxes = NAMES.map(([a, b], i) => card(g, X[i], Y, W, H, [[a, 't-fg t-bold'], [b, 't-sm']]));
    X.slice(0, -1).forEach((x, i) => arrow(g, x + W, Y + H / 2, X[i + 1] - 2, Y + H / 2, { cls: 'a-muted', head: 6 }));
    card(g, 560, 98, W, 36, [['startup.o', 't-fg'], ['libc_nano.a', 't-fg']]);
    card(g, 695, 98, W, 36, [['link.ld', 't-pri t-bold'], ['the memory map', 't-sm']]);
    arrow(g, 617, 98, 617, 78, { cls: 'a-muted', head: 6 });
    arrow(g, 752, 98, 752, 78, { cls: 'a-pri', head: 6 });
    T(g, 337, 100, 'a name the file lacks becomes', 't-sm', 'middle');
    T(g, 337, 114, 'a hole and a note for the linker', 't-sm', 'middle');
    s('rect', { x: 10, y: 148, width: 570, height: 158, rx: 6, class: 'f-seg' }, g);
    const head = T(g, 24, 166, '', 't-fg t-bold');
    const lines = [0, 1, 2, 3, 4].map(i => C(g, 24, 192 + i * 22, ''));
    s('rect', { x: 596, y: 148, width: 214, height: 158, rx: 6, class: 'f-surface box' }, g);
    T(g, 703, 168, 'address of', 't-sm', 'middle');
    T(g, 703, 184, 'SystemCoreClock', 't-fg t-bold', 'middle');
    const val = T(g, 703, 222, '', 't-xl t-bold', 'middle');
    const sub = [0, 1].map(i => T(g, 703, 256 + i * 16, '', 't-sm', 'middle'));
    const S = [
      { b: 'All', head: 'main.c · the source you write', v: '0x20000000', vc: 't-ok', sub: ['given at the last stage,', 'locate, from link.ld'], code: [
        '#include "clock.h"                 // declares SystemCoreClock',
        'int main(void) {',
        '    uint32_t f = SystemCoreClock;  // used here, defined in startup.c',
        '    ...',
        '}'],
        note: 'Five stages turn main.c into bytes at fixed addresses. The first three see only main.c, so to them SystemCoreClock stays a name. Only the last stage, locate, gives it a real address. Pick a stage.' },
      { b: 'preprocess', head: 'main.i · preprocessor output', v: 'unknown', vc: 't-muted', sub: ['declared, so main.c', 'may use the name'], code: [
        'extern uint32_t SystemCoreClock;   // pasted in from clock.h',
        'int main(void) {',
        '    uint32_t f = SystemCoreClock;',
        '    ...',
        '}'],
        note: 'The preprocessor pastes clock.h in place of the #include line and expands macros. The result is plain C with no # lines. extern only declares SystemCoreClock, so there is no storage and no address yet.' },
      { b: 'compile', head: 'main.s · Thumb assembly for this core', v: 'unknown', vc: 't-muted', sub: ['still only a name', 'in the assembly'], code: [
        'main:',
        '    ldr   r3, =SystemCoreClock     @ the address, from a literal word',
        '    ldr   r0, [r3]                 @ the value stored at that address',
        '    ...',
        ''],
        note: 'The compiler turns C into Thumb assembly. It sees only main.c, so it still refers to SystemCoreClock by name and leaves the address for later.' },
      { b: 'assemble', head: 'main.o · object file', v: '00 00 00 00', vc: 't-bad', sub: ['a hole, and a note', 'saying what goes there'], code: [
        '.text     4B01 6818 ...      machine code for main',
        '          00 00 00 00        the hole for SystemCoreClock\'s address',
        'note:     write &SystemCoreClock into the hole',
        'symbols:  defines main, _write · needs SystemCoreClock, printf',
        ''],
        note: 'The assembler turns each instruction into bytes. Where it needs an address it does not have, it leaves a hole of four zero bytes and a note naming the symbol that belongs there.' },
      { b: 'link', head: 'link · match every need to one definition', v: 'unknown', vc: 't-muted', sub: ['matched to its definition', 'in startup.o, no address yet'], code: [
        'main.o       needs SystemCoreClock  →  startup.o defines it',
        'main.o       needs printf           →  libc_nano.a defines it',
        'startup.o    needs main             →  main.o defines it',
        'libc_nano.a  needs _write           →  main.o defines it',
        'none left over, none duplicated'],
        note: 'The linker reads all the object files at once and matches every need to exactly one definition. Now it knows which SystemCoreClock is meant, but not yet where it lives.' },
      { b: 'locate', head: 'locate · assign real addresses from link.ld', v: '0x20000000', vc: 't-ok', sub: ['fixed in the image,', 'the same on every run'], code: [
        'RAM   ORIGIN 0x20000000  →  .data first:  SystemCoreClock = 0x20000000',
        'FLASH ORIGIN 0x08000000  →  .text:        SystemInit      = 0x0800022C',
        'the hole 00 00 00 00 becomes 00 00 00 20   (0x20000000, little-endian)',
        'output: Main.elf, then Main.hex and Main.bin for the programmer',
        ''],
        note: 'Locate places each section where link.ld says and writes each final address into its hole. This is the embedded stage. On a PC it is invisible; here you write its input by hand.' },
    ];
    const note = role('tc-note');
    steps(viz('tc-steps'), S.map(x => x.b), k => {
      const st = S[k];
      boxes.forEach((b, i) => b.r.setAttribute('class', i === k && k > 0 ? (k === 5 ? 'f-ok-soft outline-pri' : 'f-pri-soft outline-pri') : 'f-surface box'));
      head.textContent = st.head;
      setText(lines, st.code);
      val.textContent = st.v;
      val.setAttribute('class', 't-xl t-bold ' + st.vc);
      setText(sub, st.sub);
      note.textContent = st.note;
    });
  });

  // Figure 2: three binding moments on a time line
  part('bind', () => {
    const g = svg(viz('bind'), 820, 300, { label: 'Compile-time, load-time and run-time binding on a time line from build to load to run', minWidth: 560 });
    const CX = [175, 390, 605], CW = 200;
    [['BUILD', 'link and locate'], ['LOAD', 'the program starts'], ['RUN', 'every memory access']].forEach(([a, b], i) => {
      T(g, CX[i] + CW / 2, 12, a, 't-fg t-bold', 'middle');
      T(g, CX[i] + CW / 2, 27, b, 't-sm', 'middle');
    });
    [382, 597].forEach(x => s('line', { x1: x, x2: x, y1: 4, y2: 258, class: 's-line' }, g));
    const LY = i => 46 + i * 72, LH = 64;
    const L = [
      { name: 'compile time', sub: ['this chip,', 'MS-DOS .com'], c: 'pri', at: 0, cells: [
        [['SystemCoreClock', 't-fg t-bold'], ['→ 0x20000000,', 't-pri t-bold'], ['burned into the image', 't-sm']],
        [['no loader', 't-muted'], ['the image already sits', 't-sm'], ['at its addresses', 't-sm']],
        [['0x20000000', 't-fg t-bold'], ['every board, every run;', 't-sm'], ['no MMU to translate', 't-sm']]],
        note: 'The locate stage writes 0x20000000 into every instruction that uses SystemCoreClock. Nothing at load or run time can change it, so the address is the same on every board and every run until you re-link. MS-DOS .com files worked the same way.' },
      { name: 'load time', sub: ['classic relocatable', 'executables'], c: 'ter', at: 1, cells: [
        [['counter', 't-fg t-bold'], ['base + 0x1234', 't-fg'], ['a relative address', 't-sm']],
        [['loader picks a base', 't-ter t-bold'], ['0x00500000 + 0x1234', 't-fg'], ['= 0x00501234', 't-ter t-bold']],
        [['0x00501234', 't-fg t-bold'], ['fixed until', 't-sm'], ['the program exits', 't-sm']]],
        note: 'The image holds addresses relative to a base. When the program starts, the loader picks a free base and patches them, so the next launch may get another one. After that the address stays fixed until the program exits.' },
      { name: 'run time', sub: ['every desktop', 'and phone OS'], c: 'sec', at: 2, cells: [
        [['counter', 't-fg t-bold'], ['virtual 0x00400000', 't-fg'], ['the same in every program', 't-sm']],
        [['the OS builds', 't-fg'], ['a page table', 't-fg'], ['for each program', 't-sm']],
        [['MMU translates each access', 't-sec t-bold'], ['A: 0x400000 → frame 0x1F3000', 't-sm'], ['B: 0x400000 → frame 0x2A8000', 't-sm']]],
        note: 'Both programs use virtual address 0x400000. The MMU translates every access while they run, so each reaches its own physical frame and neither disturbs the other. The frame numbers are examples.' },
    ];
    const lanes = L.map((l, i) => {
      const gg = s('g', { class: 'fade' }, g), y = LY(i);
      T(gg, 10, y + 18, l.name, `t-${l.c} t-bold t-lg`);
      T(gg, 10, y + 38, l.sub[0], 't-sm');
      T(gg, 10, y + 52, l.sub[1], 't-sm');
      l.cells.forEach((lines, j) => {
        const on = j === l.at;
        card(gg, CX[j], y, CW, LH, lines, on ? `f-${l.c}-soft` : 'f-surface', i === 0 && j === 1 ? 'box dash' : 'box');
        if (on) s('rect', { x: CX[j], y, width: CW, height: LH, rx: 6, class: `s-${l.c}` }, gg);
      });
      return gg;
    });
    T(g, 410, 282, 'This chip has no loader and no MMU, so binding happens at build time and is burned into the image.', 't-fg t-bold', 'middle');
    const note = role('bind-note');
    steps(viz('bind-steps'), ['All', 'compile time', 'load time', 'run time'], k => {
      lanes.forEach((gg, i) => gg.classList.toggle('dim', k > 0 && i !== k - 1));
      note.textContent = k ? L[k - 1].note : 'The later a system binds, the more hardware it needs: a loader for load time, an MMU for run time. This chip has neither, so it binds at build time and you describe the memory in link.ld.';
    });
  });

  // Figure 3: needs matched to definitions
  part('sym', () => {
    const g = svg(viz('sym'), 820, 318, { label: 'main.o, startup.o and libc_nano.a with their defined and needed symbols, and the linker matching each need to one definition', minWidth: 560 });
    const OX = [10, 285, 560], OW = 250;
    const objs = ['main.o', 'startup.o', 'libc_nano.a'].map((n, i) => {
      const r = s('rect', { x: OX[i], y: 8, width: OW, height: 108, rx: 6, class: 'f-surface box' }, g);
      T(g, OX[i] + OW / 2, 26, n, 't-fg t-bold t-lg', 'middle');
      T(g, OX[i] + 14, 50, 'defines', 't-sm');
      T(g, OX[i] + 14, 86, 'needs', 't-sm');
      return { r, def: T(g, OX[i] + 14, 66, '', 't-pri t-bold'), need: T(g, OX[i] + 14, 102, ['printf, SystemCoreClock', 'main', '_write, _sbrk'][i], 't-sec') };
    });
    const COLS = [20, 190, 340, 600];
    ['symbol', 'needed by', 'defined by', 'linker'].forEach((t, i) => T(g, COLS[i], 138, t, 't-sm t-bold'));
    s('line', { x1: 10, x2: 810, y1: 148, y2: 148, class: 's-line' }, g);
    const ROWS = [['SystemCoreClock', 'main.o'], ['printf', 'main.o', 'libc_nano.a'], ['main', 'startup.o', 'main.o'], ['_write', 'libc_nano.a', 'main.o']];
    const rows = ROWS.map((r, i) => {
      const y = 164 + i * 24;
      const bg = s('rect', { x: 10, y: y - 11, width: 800, height: 22, rx: 3, class: 'f-none' }, g);
      T(g, COLS[0], y, r[0], 't-fg t-bold');
      T(g, COLS[1], y, r[1], 't-fg');
      const by = T(g, COLS[2], y, r[2] || '', 't-fg');
      const res = T(g, COLS[3], y, 'one definition', 't-ok t-bold');
      return { bg, by, res };
    });
    const src = C(g, 20, 266, '');
    const msg = T(g, 20, 290, '', 't-ok t-bold');
    T(g, 20, 310, '_sbrk, which printf also needs, is defined beside _write in the course\'s code (L04 slide 17).', 't-sm');
    const CASES = [
      { b: 'Links', defs: ['main, _write', 'Reset_Handler, SystemCoreClock', 'printf'], by: 'startup.o', res: 'one definition', bad: [],
        src: 'clock.h: extern uint32_t SystemCoreClock;   startup.c: uint32_t SystemCoreClock = 12000000;',
        msg: 'Every need is matched to exactly one definition, so the linker produces Main.elf.',
        note: 'main.o leaves a hole for SystemCoreClock and a note that it needs it. startup.o defines it once. The linker pairs every need with its one definition, none left over and none duplicated.' },
      { b: 'undefined reference', defs: ['main, _write', 'Reset_Handler', 'printf'], by: 'nobody', res: 'none: error', bad: [1],
        src: 'clock.h: extern uint32_t SystemCoreClock;   no .c file defines it',
        msg: 'undefined reference to SystemCoreClock: the linker stops, no image.',
        note: 'The header only declares SystemCoreClock and no object defines it. This is the spike\'s real error: ST\'s system_stm32c0xx.c defines it, and the course does not use that file. The compiler saw nothing wrong, because each file compiled alone is fine.' },
      { b: 'multiple definition', defs: ['main, _write, SystemCoreClock', 'Reset_Handler, SystemCoreClock', 'printf'], by: 'main.o and startup.o', res: 'two: error', bad: [0, 1],
        src: 'main.c and startup.c both: uint32_t SystemCoreClock = 12000000;',
        msg: 'multiple definition of SystemCoreClock: the linker will not choose for you.',
        note: 'Two objects define SystemCoreClock. A definition placed in clock.h does the same, because it lands in every .c file that includes the header.' },
    ];
    const note = role('sym-note');
    steps(viz('sym-steps'), CASES.map(c => c.b), k => {
      const c = CASES[k], bad = k > 0;
      objs.forEach((o, i) => {
        o.def.textContent = c.defs[i];
        o.r.setAttribute('class', c.bad.indexOf(i) >= 0 ? 'f-bad-soft box' : 'f-surface box');
      });
      rows[0].by.textContent = c.by;
      rows[0].by.setAttribute('class', bad ? 't-bad t-bold' : 't-fg');
      rows[0].res.textContent = c.res;
      rows[0].res.setAttribute('class', bad ? 't-bad t-bold' : 't-ok t-bold');
      rows[0].bg.setAttribute('class', bad ? 'f-bad-soft' : 'f-none');
      src.textContent = c.src;
      msg.textContent = c.msg;
      msg.setAttribute('class', bad ? 't-bad t-bold' : 't-ok t-bold');
      note.textContent = c.note;
    });
  });

  // Figure 4: sections in flash and SRAM, and the cost of a declaration
  part('sec', () => {
    const g = svg(viz('sec'), 820, 316, { label: 'Sections placed into flash and SRAM, and where a declaration lands with its flash and RAM cost', minWidth: 560 });
    const FX = 30, RX = 530, BW = 260, BH = 38, BY = i => 28 + i * 44;
    T(g, FX + BW / 2, 12, 'FLASH · 0x08000000 · 32 KB', 't-fg t-bold', 'middle');
    T(g, RX + BW / 2, 12, 'SRAM · 0x20000000 · 12 KB', 't-fg t-bold', 'middle');
    const mk = (x, i, [n, d], dashed) => {
      const gg = s('g', { class: 'fade' }, g);
      const dflt = (dashed ? 'f-seg' : 'f-surface') + ' box' + (dashed ? ' dash' : '');
      const r = s('rect', { x, y: BY(i), width: BW, height: BH, rx: 5, class: dflt }, gg);
      T(gg, x + 12, BY(i) + 13, n, 't-fg t-bold');
      T(gg, x + 12, BY(i) + 28, d, 't-sm');
      return { gg, r, dflt };
    };
    const F = [['.isr_vector', '180 B at 0x08000000 · the vector table'], ['.text', '4792 B at 0x080000B4 · code'], ['.rodata', '184 B · const data, string literals'], ['.data (a copy)', '96 B · the initial values']].map((d, i) => mk(FX, i, d));
    const R = [['.data (the real one)', '96 B at 0x20000000 · the variables'], ['.bss', '364 B at 0x20000060 · starts at zero'], ['heap', 'grows up'], ['stack', 'grows down from the top, 0x20003000']].map((d, i) => mk(RX, i, d, i >= 2));
    const cp = s('g', { class: 'fade' }, g);
    s('path', { d: `M${FX + BW} ${BY(3) + 19} H410 V${BY(0) + 19} H${RX - 8}`, class: 's-pri', style: 'stroke-width: 2' }, cp);
    arrow(cp, RX - 10, BY(0) + 19, RX - 2, BY(0) + 19, { cls: 'a-pri', head: 8 });
    T(cp, 418, BY(1) + 12, 'Reset_Handler', 't-pri t-bold');
    T(cp, 418, BY(1) + 27, 'copies 96 B', 't-pri');
    T(cp, 418, BY(2) + 12, 'before main()', 't-sm');
    s('rect', { x: 10, y: 212, width: 800, height: 96, rx: 6, class: 'f-seg' }, g);
    const code = C(g, 24, 232, '', 't-fg t-bold t-lg');
    const sec = T(g, 360, 232, '', 't-pri t-bold t-lg');
    const req = T(g, 24, 258, '', 't-fg');
    const cost = T(g, 360, 258, '', 't-pri t-bold');
    const why = T(g, 24, 286, '', 't-fg');
    const D = [
      { b: 'All', code: 'four needs, four sections', sec: '', hl: [], req: 'code → .text · constants → .rodata · initialised → .data · zero → .bss', cost: '', why: '.data is the only section in both memories: its values in flash, its variables in RAM.' },
      { b: 'code', code: 'int main(void) { ... }', sec: '→ .text', hl: [[F, 1]], req: 'executable, never changes', cost: 'flash: its instructions · RAM: 0', why: 'Code runs straight from flash and is never copied to RAM.' },
      { b: 'const array', code: 'const char msg[] = "hi";', sec: '→ .rodata', hl: [[F, 2]], req: 'never changes, needs no execution', cost: 'flash +3 B · RAM +0 B', why: '"hi" is 3 bytes with its terminating 0. const keeps it out of RAM entirely.' },
      { b: 'int limit = 50', code: 'int limit = 50;', sec: '→ .data', hl: [[F, 3], [R, 0]], req: 'writable and remembered', cost: 'flash +4 B · RAM +4 B', why: 'The variable lives in RAM and its starting value 50 lives in flash, so it costs both.' },
      { b: 'int total', code: 'int total;', sec: '→ .bss', hl: [[R, 1]], req: 'writable, starts at zero', cost: 'flash +0 B · RAM +4 B', why: 'A zero needs no stored value. The image records only how many bytes to clear.' },
      { b: 'int count = 0', code: 'int count = 0;', sec: '→ .bss', hl: [[R, 1]], req: 'writable, starts at zero', cost: 'flash +0 B · RAM +4 B', why: 'An explicit 0 is still a zero start, so it goes to .bss as well. Only a non-zero start needs .data.' },
    ];
    steps(viz('sec-steps'), D.map(d => d.b), k => {
      const d = D[k];
      [F, R].forEach(list => list.forEach(b => {
        const on = d.hl.some(([l, i]) => l === list && l[i] === b);
        b.gg.classList.toggle('dim', k > 0 && !on);
        b.r.setAttribute('class', on ? 'f-pri-soft outline-pri' : b.dflt);
      }));
      cp.classList.toggle('dim', k > 0 && k !== 3);
      code.textContent = d.code;
      sec.textContent = d.sec;
      req.textContent = d.req;
      cost.textContent = d.cost;
      why.textContent = d.why;
    });
  });

  // Figure 5: Reset_Handler copies .data and zeroes .bss
  part('init', () => {
    const g = svg(viz('init'), 820, 354, { label: 'Reset_Handler copies .data from flash to RAM and zeroes .bss, between the linker symbols _sidata, _sdata, _edata, _sbss and _ebss', minWidth: 560 });
    const FX = 110, FW = 190, RX = 500, RW = 200, CH = 26;
    T(g, FX + FW / 2, 14, 'FLASH · .data values', 't-fg t-bold', 'middle');
    T(g, RX + RW / 2, 14, 'SRAM', 't-fg t-bold', 'middle');
    const dY = i => 34 + i * 30, bY = i => 156 + i * 30;
    const DATA = [['SystemCoreClock', '0x00B71B00'], ['gain', '0x00000003'], ['limit', '0x00000032']];
    const BSS = ['presses', 'total', 'buf[0]'];
    const JUNK_D = ['0x5A3C91E2', '0x0000D1F0', '0xFFFF7B21'], JUNK_B = ['0x00000029', '0x8C01F3A7', '0x00400010'];
    DATA.forEach(([, v], i) => {
      s('rect', { x: FX, y: dY(i), width: FW, height: CH, rx: 3, class: 'f-ter-soft box' }, g);
      T(g, FX + FW / 2, dY(i) + CH / 2, v, 't-ter t-bold', 'middle');
    });
    T(g, FX + FW / 2, 134, '⋯ 24 words, 96 B', 't-sm', 'middle');
    s('line', { x1: 98, x2: FX, y1: dY(0), y2: dY(0), class: 's-muted' }, g);
    T(g, 94, dY(0), '_sidata', 't-ter t-bold', 'end');
    T(g, 94, dY(0) + 14, 'in flash', 't-sm', 'end');
    const cell = (y, name) => {
      const r = s('rect', { x: RX, y, width: RW, height: CH, rx: 3, class: 'f-seg box' }, g);
      T(g, RX + 8, y + CH / 2, name, 't-sm');
      return { r, t: T(g, RX + RW - 8, y + CH / 2, '', 't-muted', 'end') };
    };
    const dc = DATA.map(([n], i) => cell(dY(i), n));
    const bc = BSS.map((n, i) => cell(bY(i), n));
    T(g, RX + RW / 2, 134, '⋯ 24 words, 96 B', 't-sm', 'middle');
    T(g, RX + RW / 2, 256, '⋯ 91 words, 364 B', 't-sm', 'middle');
    T(g, RX - 10, 134, '.data', 't-fg t-bold', 'end');
    T(g, RX - 10, 256, '.bss', 't-fg t-bold', 'end');
    [[dY(0), '_sdata', '0x20000000'], [150, '_edata = _sbss', '0x20000060'], [270, '_ebss', '0x200001CC']].forEach(([y, n, a]) => {
      s('line', { x1: RX + RW, x2: RX + RW + 8, y1: y, y2: y, class: 's-muted' }, g);
      T(g, RX + RW + 12, y, n, 't-pri t-bold');
      T(g, RX + RW + 12, y + 14, a, 't-sm');
    });
    s('line', { x1: RX, x2: RX + RW, y1: 150, y2: 150, class: 's-muted dash' }, g);
    s('line', { x1: RX, x2: RX + RW, y1: 270, y2: 270, class: 's-muted dash' }, g);
    const arrows = s('g', {}, g);
    DATA.forEach((d, i) => arrow(arrows, FX + FW + 2, dY(i) + CH / 2, RX - 2, dY(i) + CH / 2, { cls: 'a-pri', label: i === 0 ? '*dst++ = *src++' : null, labelCls: 't-pri t-bold' }));
    const CODE = ['src = &_sidata;', 'for (dst = &_sdata; dst < &_edata; ) { *dst++ = *src++; }', 'for (dst = &_sbss;  dst < &_ebss;  ) { *dst++ = 0; }'];
    const hl = CODE.map((t, i) => s('rect', { x: 14, y: 290 + i * 20, width: 452, height: 20, rx: 3, class: 'f-none' }, g));
    CODE.forEach((t, i) => C(g, 22, 300 + i * 20, t));
    const NOTES = [
      'At reset SRAM holds whatever it held: a random pattern after power-up, the previous run\'s values after the reset button. The initial values of .data sit in flash, starting at _sidata.',
      'The first loop copies 96 bytes, 24 words, from _sidata in flash to _sdata in RAM until dst reaches _edata. SystemCoreClock now reads 12000000 (0x00B71B00).',
      'The second loop writes 0 from _sbss to _ebss, 364 bytes or 91 words. The image stores no zeros, only the two addresses.',
      'Every global now holds its C starting value, and Reset_Handler can call main(). The five symbols are not variables: the linker invented them, and their values are the addresses it chose.',
    ];
    const note = role('init-note');
    steps(viz('init-steps'), ['Power on', 'Copy .data', 'Zero .bss', 'Ready for main()'], k => {
      dc.forEach((c, i) => {
        const v = k >= 1;
        c.t.textContent = v ? DATA[i][1] : JUNK_D[i];
        c.t.setAttribute('class', v ? (k === 1 ? 't-pri t-bold' : 't-fg') : 't-muted');
        c.r.setAttribute('class', (k === 1 ? 'f-pri-soft' : v ? 'f-surface' : 'f-seg') + ' box');
      });
      bc.forEach((c, i) => {
        const z = k >= 2;
        c.t.textContent = z ? '0x00000000' : JUNK_B[i];
        c.t.setAttribute('class', z ? (k === 2 ? 't-pri t-bold' : 't-fg') : 't-muted');
        c.r.setAttribute('class', (k === 2 ? 'f-pri-soft' : z ? 'f-surface' : 'f-seg') + ' box');
      });
      arrows.setAttribute('visibility', k === 1 ? 'visible' : 'hidden');
      hl.forEach((r, i) => r.setAttribute('class', (k === 1 && i < 2) || (k === 2 && i === 2) ? 'f-pri-soft' : 'f-none'));
      note.textContent = NOTES[k];
    }, 3);
  });

  // Figure 6: presses with and without the .bss loop
  part('bss', () => {
    const g = svg(viz('bss'), 820, 236, { label: 'The value of presses with and without the .bss loop across a power-on, a run, a reset button press and the next start', minWidth: 560 });
    const CX = i => 160 + i * 110, CW = 104;
    const EV = [['power on', 'power-up pattern'], ['Reset_Handler', 'zero .bss, or not'], ['main() runs', '41 presses'], ['reset button', 'SRAM not cleared'], ['Reset_Handler', 'zero .bss, or not'], ['main() starts', 'first value read']];
    const cols = EV.map(([a, b], i) => {
      const gg = s('g', { class: 'fade' }, g);
      T(gg, CX(i) + CW / 2, 12, a, 't-fg t-bold', 'middle');
      T(gg, CX(i) + CW / 2, 27, b, 't-sm', 'middle');
      return gg;
    });
    const LANES = [
      { y: 42, name: 'with the loop', sub: 'Reset_Handler zeroes .bss', c: 't-ok', v: ['0', '0', '41', '41', '0', '0'], cap: ['', 'zeroed', '', 'kept', 'zeroed', 'correct'] },
      { y: 100, name: 'loop missing', sub: 'nobody zeroes .bss', c: 't-bad', v: ['0', '0', '41', '41', '41', '41'], cap: ['', 'left as is', '', 'kept', 'left as is', 'wrong'] },
    ];
    LANES.forEach((l, li) => {
      T(g, 10, l.y + 15, l.name, l.c + ' t-bold');
      T(g, 10, l.y + 31, l.sub, 't-sm');
      l.v.forEach((v, i) => {
        const gg = cols[i];
        const wrong = li === 1 && i >= 4, fixed = li === 0 && (i === 1 || i >= 4);
        const fill = wrong ? 'f-bad-soft' : fixed ? 'f-ok-soft' : 'f-surface';
        s('rect', { x: CX(i), y: l.y, width: CW, height: 46, rx: 5, class: fill + ' box' }, gg);
        T(gg, CX(i) + CW / 2, l.y + 16, v, (wrong ? 't-bad' : fixed ? 't-ok' : 't-fg') + ' t-bold t-lg', 'middle');
        T(gg, CX(i) + CW / 2, l.y + 34, l.cap[i], 't-sm', 'middle');
      });
    });
    const ph = s('g', {}, g);
    brace(ph, CX(0), CX(2) + CW, 172, '');
    brace(ph, CX(3), CX(5) + CW, 172, '');
    const p1 = T(g, (CX(0) + CX(2) + CW) / 2, 192, 'cold boot: both rows start at 0', 't-fg', 'middle');
    const p2 = T(g, (CX(3) + CX(5) + CW) / 2, 192, 'after a reset: only the loop gives 0', 't-fg', 'middle');
    const verdict = T(g, 410, 220, '', 't-fg t-bold', 'middle');
    const V = [
      'The same code passes after plugging in and fails after the reset button. The bug depends on history.',
      'Power-up: in these tests RAM read 0, so the missing loop changes nothing and every test passes.',
      'Reset: SRAM still holds 41. Only the .bss loop puts presses back to 0, so the bottom row starts at 41.',
    ];
    steps(viz('bss-steps'), ['All', 'Cold boot', 'After reset'], k => {
      cols.forEach((c, i) => c.classList.toggle('dim', (k === 1 && i > 2) || (k === 2 && i < 3)));
      p1.setAttribute('class', k === 2 ? 't-muted' : 't-fg t-bold');
      p2.setAttribute('class', k === 1 ? 't-muted' : 't-fg t-bold');
      verdict.textContent = V[k];
    });
  });

  // Figure 7: RAM LENGTH, the initial SP and the real SRAM, to scale
  part('ld', () => {
    const g = svg(viz('ld'), 820, 296, { label: 'Linker script RAM LENGTH against the real 12 KB of SRAM: with 16K the initial stack pointer and the stack land above real memory', minWidth: 560 });
    s('rect', { x: 10, y: 8, width: 400, height: 92, rx: 6, class: 'f-seg' }, g);
    C(g, 22, 22, 'MEMORY');
    C(g, 22, 38, '{');
    C(g, 22, 54, '  FLASH (rx) : ORIGIN = 0x08000000, LENGTH = 32K');
    const ramLine = C(g, 22, 70, '');
    C(g, 22, 86, '}');
    const res = [0, 1, 2, 3].map(i => C(g, 430, 22 + i * 20, '', i === 2 ? 't-bold' : 't-fg'));
    const x = b => 60 + b / 16384 * 720;
    T(g, 10, 136, 'linker', 't-sm');
    T(g, 10, 172, 'chip', 't-sm');
    const lk = s('rect', { x: 60, y: 124, width: 0, height: 24, rx: 3, class: 'f-seg box' }, g);
    const lkText = T(g, 68, 136, '', 't-fg');
    const lkStack = s('rect', { x: 0, y: 124, width: x(1024) - 60, height: 24, class: 'f-ter-soft box' }, g);
    const lkStackT = T(g, 0, 136, 'stack', 't-ter t-bold t-sm', 'middle');
    s('rect', { x: 60, y: 160, width: x(12288) - 60, height: 24, rx: 3, class: 'f-pri-soft box' }, g);
    T(g, 68, 172, 'real SRAM: 12 KB, last byte 0x20002FFF', 't-pri t-bold');
    s('rect', { x: x(12288), y: 160, width: x(16384) - x(12288), height: 24, class: 'f-none s-muted dash' }, g);
    const none = T(g, (x(12288) + x(16384)) / 2, 172, 'no memory here', 't-sm', 'middle');
    const chipStack = s('rect', { x: x(16384 - 1024), y: 160, width: x(1024) - 60, height: 24, class: 'f-bad-soft s-bad' }, g);
    const chipStackT = T(g, x(16384 - 512), 172, 'stack', 't-bad t-bold t-sm', 'middle');
    const sp = s('line', { x1: 0, x2: 0, y1: 112, y2: 192, class: 's-ok' }, g);
    const spT = T(g, 0, 110, '', 't-ok t-bold', 'end');
    [0, 4096, 8192, 12288, 16384].forEach(b => {
      s('line', { x1: x(b), x2: x(b), y1: 192, y2: 198, class: 'l-axis' }, g);
      T(g, x(b), 210, '0x' + (0x20000000 + b).toString(16).toUpperCase(), 't-sm', b === 0 ? 'start' : 'middle');
    });
    const rep = T(g, 10, 240, '', 't-fg');
    const v1 = T(g, 10, 262, '', 't-fg t-bold');
    const v2 = T(g, 10, 282, '', 't-fg');
    const L = [
      { b: 'LENGTH = 12K', len: 12288, k: '12K', hex: '0x3000', top: '0x20003000', pct: '16.28',
        v: ['Matches the datasheet. The stack starts one past the last real byte and grows down into real RAM.', 'The build succeeds and the program runs.'],
        note: 'ORIGIN and LENGTH come from the datasheet: 12 KB of SRAM from 0x20000000. The initial SP, ORIGIN + LENGTH, is the top of real RAM.' },
      { b: 'LENGTH = 16K', len: 16384, k: '16K', hex: '0x4000', top: '0x20004000', pct: '12.21',
        v: ['The build succeeds, and the report even looks better. The stack sits above the real 12 KB.', 'The first push writes memory that does not exist, so the program fails at run time.'],
        note: 'The linker knows nothing about the chip, so it trusts 16K. 16K = 16 × 1024 = 0x4000, so the initial SP becomes 0x20004000, 4 KB above the end of real SRAM. Nothing warns you.' },
    ];
    const note = role('ld-note');
    steps(viz('ld-steps'), L.map(l => l.b), k => {
      const l = L[k], bad = k === 1, top = x(l.len);
      ramLine.textContent = '';
      s('tspan', {}, ramLine, '  RAM   (rw) : ORIGIN = 0x20000000, LENGTH = ');
      s('tspan', { class: (bad ? 't-bad' : 't-ok') + ' t-bold' }, ramLine, l.k);
      setText(res, ['initial SP = ORIGIN(RAM) + LENGTH(RAM)', '           = 0x20000000 + ' + l.hex, '           = ' + l.top, bad ? 'build: no error, no warning' : 'top of the real 12 KB']);
      res[2].setAttribute('class', (bad ? 't-bad' : 't-ok') + ' t-bold');
      lk.setAttribute('width', top - 60);
      lkText.textContent = 'linker\'s RAM: ORIGIN to ORIGIN + ' + l.k;
      lkStack.setAttribute('x', x(l.len - 1024));
      lkStack.setAttribute('class', (bad ? 'f-bad-soft' : 'f-ter-soft') + ' box');
      lkStackT.setAttribute('x', x(l.len - 512));
      lkStackT.setAttribute('class', (bad ? 't-bad' : 't-ter') + ' t-bold t-sm');
      chipStack.setAttribute('visibility', bad ? 'visible' : 'hidden');
      chipStackT.setAttribute('visibility', bad ? 'visible' : 'hidden');
      none.setAttribute('x', bad ? (x(12288) + x(16384 - 1024)) / 2 : (x(12288) + x(16384)) / 2);
      sp.setAttribute('x1', top);
      sp.setAttribute('x2', top);
      sp.setAttribute('class', bad ? 's-bad' : 's-ok');
      spT.setAttribute('x', top - 6);
      spT.setAttribute('class', (bad ? 't-bad' : 't-ok') + ' t-bold');
      spT.textContent = 'initial SP ' + l.top;
      rep.textContent = `build report   RAM: 2000 B used of ${l.k.replace('K', ' KB')}   2000 / ${l.len} = ${l.pct} %`;
      setText([v1, v2], l.v);
      v1.setAttribute('class', (bad ? 't-bad' : 't-ok') + ' t-bold');
      note.textContent = l.note;
    });
  });

  // Figure 8: the two hex records decoded
  part('hex', () => {
    const g = svg(viz('hex'), 820, 300, { label: 'Two Intel HEX records split into byte count, offset, type, data and checksum, with the stack pointer and reset vector decoded', minWidth: 560 });
    const CW = 17, X0 = 30, Y1 = 30, Y2 = 100;
    const FILL = { LL: 'f-pri-soft', AAAA: 'f-ter-soft', TT: 'f-sec-soft', data: 'f-surface', CC: 'f-ok-soft' };
    const TXT = { LL: 't-pri', AAAA: 't-ter', TT: 't-sec', data: 't-fg', CC: 't-ok' };
    const drawRec = (rec, y) => {
      s('rect', { x: X0, y, width: CW, height: 26, class: 'f-seg box' }, g);
      T(g, X0 + CW / 2, y + 13, ':', 't-muted t-bold t-lg', 'middle');
      const bs = rec.slice(1).match(/../g), n = bs.length;
      return bs.map((b, j) => {
        const k = j === 0 ? 'LL' : j <= 2 ? 'AAAA' : j === 3 ? 'TT' : j === n - 1 ? 'CC' : 'data';
        const x = X0 + CW + j * 2 * CW, gg = s('g', { class: 'fade' }, g);
        s('rect', { x, y, width: 2 * CW, height: 26, class: FILL[k] + ' box' }, gg);
        T(gg, x + CW, y + 13, b, TXT[k] + ' t-bold t-lg', 'middle');
        return { gg, x, k };
      });
    };
    const bx = j => X0 + CW + j * 2 * CW;
    T(g, X0, 14, 'record 1', 't-sm');
    T(g, X0, 86, 'record 2', 't-sm');
    const r1 = drawRec(':020000040800F2', Y1);
    const r2 = drawRec(':1000000000300020750200082902000829020008BB', Y2);
    const lab = (j0, j1, y, t, c) => T(g, (bx(j0) + bx(j1) + 2 * CW) / 2, y, t, c + ' t-sm', 'middle');
    lab(0, 0, 68, 'LL', 't-pri'); lab(1, 2, 68, 'AAAA', 't-ter'); lab(3, 3, 68, 'TT', 't-sec'); lab(4, 5, 68, 'data', 't-fg'); lab(6, 6, 68, 'CC', 't-ok');
    lab(0, 0, 138, 'LL', 't-pri'); lab(1, 2, 138, 'AAAA', 't-ter'); lab(3, 3, 138, 'TT', 't-sec'); lab(20, 20, 138, 'CC', 't-ok');
    ['word 0 · SP', 'word 1 · reset vector', 'word 2 · NMI', 'word 3 · HardFault'].forEach((t, i) => {
      lab(4 + 4 * i, 7 + 4 * i, 138, t, 't-fg');
      lab(4 + 4 * i, 7 + 4 * i, 90, '0x' + (0x08000000 + 4 * i).toString(16).toUpperCase().padStart(8, '0'), 't-muted');
    });
    [8, 12, 16].forEach(j => s('line', { x1: bx(j), x2: bx(j), y1: Y2 - 3, y2: Y2 + 29, class: 's-fg', style: 'stroke-width: 2' }, g));
    s('rect', { x: 10, y: 152, width: 800, height: 140, rx: 6, class: 'f-seg' }, g);
    const lines = [0, 1, 2, 3, 4].map(i => C(g, 24, 170 + i * 22, '', i === 2 ? 't-pri t-bold' : 't-fg'));
    const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
    const S = [
      { b: 'Fields', h1: null, h2: null, l: [
        'every record   :  LL  AAAA  TT  data ...  CC',
        'LL    how many data bytes follow           AAAA  16-bit address offset',
        'TT    00 data · 01 end of file · 04 extended linear address',
        'data  LL bytes, in the order they go into flash',
        'CC    checksum: makes every byte from LL to CC sum to 0, mod 256'] },
      { b: 'Type 04', h1: range(0, 6), h2: [1, 2], l: [
        'record 1   LL 02 · AAAA 0000 · TT 04 · data 0800',
        'type 04 = extended linear address: 0800 is the upper 16 bits from now on',
        'record 2   offset 0000  →  0x0800 << 16 | 0x0000 = 0x08000000',
        'a later record with offset 0120 lands at 0x08000120, not at 0x0800 + 0x0120',
        'an 8-bit AVR never needed one: its whole flash fits in 16 bits of address'] },
      { b: 'Word 0: SP', h1: null, h2: range(4, 7), l: [
        'bytes at 0x08000000 to 0x08000003:   00 30 00 20',
        'little-endian: the lowest address holds the lowest byte, so read from the last',
        'word 0 = 0x20003000, the initial stack pointer',
        '0x20003000 = 0x20000000 + 0x3000 (12K): one past the last byte of RAM',
        'the stack grows down from here'] },
      { b: 'Word 1: reset vector', h1: null, h2: range(8, 11), l: [
        'bytes at 0x08000004 to 0x08000007:   75 02 00 08   →   0x08000275',
        'the last hex digit 5 = 0101: bit 0 = 1 is the Thumb bit',
        'Reset_Handler starts at 0x08000274 (bit 0 cleared)',
        'words 2 and 3, 0x08000229: NMI and HardFault, the default handler at 0x08000228',
        'the hardware loads word 0 into SP and word 1 into PC, and that is the whole boot'] },
      { b: 'Checksum', h1: range(0, 6), h2: range(0, 20), l: [
        'record 2   10+00+00+00 + 00+30+00+20 + 75+02+00+08 + 29+02+00+08 + 29+02+00+08',
        '           = 0x145, low byte 0x45',
        '           CC = 0x100 − 0x45 = 0xBB',
        'record 1   02+00+00+04+08+00 = 0x0E,   CC = 0x100 − 0x0E = 0xF2',
        'check: 0x145 + 0xBB = 0x200, which is 0 mod 256'] },
    ];
    steps(viz('hex-steps'), S.map(x => x.b), k => {
      const st = S[k], any = k > 0;
      r1.forEach((c, j) => c.gg.classList.toggle('dim', any && !(st.h1 && st.h1.indexOf(j) >= 0)));
      r2.forEach((c, j) => c.gg.classList.toggle('dim', any && !(st.h2 && st.h2.indexOf(j) >= 0)));
      setText(lines, st.l);
    });
  });

  // Figure 9: the reset sequence and the state after each step
  part('boot', () => {
    const g = svg(viz('boot'), 820, 290, { label: 'Reset sequence: the hardware loads SP and PC, then Reset_Handler copies .data, zeroes .bss, runs SystemInit and calls main, with the machine state after each step', minWidth: 560 });
    const B = [
      { l: [['power on / reset', 't-fg t-bold']], who: 'hardware' },
      { l: [['hardware loads SP and PC', 't-fg t-bold'], ['from vector[0], vector[1]', 't-sm']], who: 'hardware' },
      { l: [['Reset_Handler', 't-fg t-bold'], ['starts at 0x08000274', 't-sm']], who: 'your code' },
      { l: [['copy .data · zero .bss', 't-fg t-bold']], who: 'your code' },
      { l: [['SystemInit · __libc_init_array', 't-fg t-bold']], who: 'your code' },
      { l: [['main()', 't-fg t-bold']], who: 'your code' },
    ];
    const by = i => 6 + i * 47, BH = 38, BX = 20, BW = 300;
    const boxes = B.map((b, i) => {
      const gg = s('g', { class: 'fade' }, g);
      const c = card(gg, BX, by(i), BW, BH, b.l);
      T(gg, BX + BW + 12, by(i) + BH / 2, b.who, b.who === 'hardware' ? 't-sec t-bold' : 't-pri');
      if (i < B.length - 1) arrow(gg, BX + BW / 2, by(i) + BH, BX + BW / 2, by(i + 1) - 1, { cls: 'a-muted', head: 6 });
      return { gg, r: c.r };
    });
    s('rect', { x: 450, y: 6, width: 360, height: 182, rx: 6, class: 'f-seg' }, g);
    T(g, 462, 20, 'state after this step', 't-sm');
    const ROWS = ['SP', 'PC', 'SystemCoreClock', '.bss globals', 'clock'];
    const vals = ROWS.map((r, i) => {
      T(g, 462, 46 + i * 30, r, 't-fg t-bold');
      return T(g, 600, 46 + i * 30, '', 't-fg');
    });
    const fw = s('g', {}, g);
    const fwr = [0, 1].map(i => s('rect', { x: 450, y: 202 + i * 40, width: 360, height: 34, rx: 6, class: 'f-surface box' }, fw));
    C(fw, 462, 219, 'flash word 0   0x20003000   → SP');
    C(fw, 462, 259, 'flash word 1   0x08000275   → PC 0x08000274, T = 1');
    const ST = [
      ['not loaded', 'not loaded', 'whatever RAM held', 'whatever RAM held', '12 MHz (reset)'],
      ['0x20003000', '0x08000274, T = 1', 'whatever RAM held', 'whatever RAM held', '12 MHz (reset)'],
      ['0x20003000', 'in Reset_Handler', 'whatever RAM held', 'whatever RAM held', '12 MHz'],
      ['grows down', 'in Reset_Handler', '12000000, copied', '0, zeroed', '12 MHz'],
      ['grows down', 'in SystemInit', '48000000', '0', '48 MHz'],
      ['grows down', 'in main()', '48000000', '0', '48 MHz'],
    ];
    const NOTES = [
      'Power on or reset. Nothing has run. SRAM holds a random pattern after power-up, or the previous run\'s values after the reset button.',
      'The only step the hardware does for you: two 32-bit words from the start of flash. Word 0 goes to SP. Word 1 goes to PC, with bit 0 setting the Thumb bit, so execution starts at 0x08000274.',
      'From here on everything is code you can read. Reset_Handler is an ordinary function whose address sits in vector slot 1.',
      'The two loops of slide 5: .data values copied from flash, .bss cleared. SystemCoreClock now reads its C starting value, 12000000.',
      'SystemInit raises the clock from 12 MHz to 48 MHz and stores 48000000 in SystemCoreClock, so it must run after the copy. __libc_init_array runs the C library\'s start-up list. Lesson 04 has the details.',
      'main() runs with a stack, initialised globals and a 48 MHz clock. On a PC the OS and the loader did all of this. Here the hardware did two loads and your startup code did the rest.',
    ];
    const note = role('boot-note');
    steps(viz('boot-steps'), ['Reset', 'Two loads', 'Reset_Handler', 'Copy, zero', 'SystemInit', 'main()'], k => {
      boxes.forEach((b, i) => {
        b.gg.classList.toggle('dim', i > k);
        b.r.setAttribute('class', i === k ? (i < 2 ? 'f-sec-soft outline-sec' : 'f-pri-soft outline-pri') : 'f-surface box');
      });
      vals.forEach((v, i) => {
        const t = ST[k][i], prev = k ? ST[k - 1][i] : t;
        v.textContent = t;
        v.setAttribute('class', t !== prev ? 't-pri t-bold' : t.indexOf('whatever') === 0 || t === 'not loaded' ? 't-muted' : 't-fg');
      });
      fwr.forEach(r => r.setAttribute('class', k === 1 ? 'f-sec-soft outline-sec' : 'f-surface box'));
      note.textContent = NOTES[k];
    }, 5);
  });

  // Figure 10: boot chains compared
  part('chain', () => {
    const g = svg(viz('chain'), 820, 206, { label: 'Boot chain of a PC with four handoffs and of this chip with one link', minWidth: 560 });
    const PX = [130, 266, 402, 538, 674], PW = 116;
    T(g, 10, 44, 'PC', 't-sec t-bold t-lg');
    T(g, 10, 62, 'four handoffs,', 't-sm');
    T(g, 10, 76, 'several seconds', 't-sm');
    [[['CPU starts at a', 't-sec t-bold'], ['fixed address', 't-sec t-bold']], [['firmware', 't-fg t-bold']], [['bootloader', 't-fg t-bold']], [['kernel', 't-fg t-bold']], [['your program', 't-fg t-bold']]]
      .forEach((l, i) => card(g, PX[i], 34, PW, 50, l, i ? 'f-surface' : 'f-sec-soft'));
    PX.slice(0, -1).forEach((x, i) => {
      arrow(g, x + PW + 2, 59, PX[i + 1] - 2, 59, { cls: 'a-sec', head: 6 });
      T(g, x + PW + 10, 24, 'handoff ' + (i + 1), 't-sec t-sm', 'middle');
    });
    T(g, 10, 132, 'this chip', 't-pri t-bold t-lg');
    T(g, 10, 150, 'one link', 't-sm');
    card(g, 130, 122, PW, 50, [['CPU loads SP', 't-pri t-bold'], ['and PC: 2 words', 't-pri t-bold']], 'f-pri-soft');
    arrow(g, 248, 147, 264, 147, { cls: 'a-pri', head: 6 });
    T(g, 256, 112, 'one link', 't-pri t-sm', 'middle');
    card(g, 266, 122, 524, 50, [['your code: Reset_Handler, copy and zero, SystemInit, main()', 't-fg t-bold'], ['every step is code you can read', 't-sm']], 'f-surface', 'outline-pri');
    T(g, 410, 194, 'If one of the two words is wrong, nothing else exists to catch it.', 't-bad t-bold', 'middle');
  });

  // General idea vs this chip; the first row is guide §2's contrast for lesson 02
  part('contrast', () => {
    const rows = [
      ['Address binding', 'compile time (MS-DOS .com); load time, a loader picks a base (relocatable executables); run time, an MMU translates (desktop and phone OSes)', 'build (compile) time: no loader, no MMU', 'you write link.ld; SystemCoreClock is at 0x20000000 on every board and every run; two programs cannot both own one address'],
      ['Sections', 'one blob in source order; ELF sorts by need, with the same names on Linux and macOS', '.isr_vector, .text, .rodata in flash; .data in RAM with its values in flash; .bss in RAM only', 'const data costs flash only; .data costs flash and RAM; .bss costs RAM only'],
      ['Who sets up globals', 'on a PC, the loader and the C runtime', 'Reset_Handler\'s two loops, between the linker\'s symbols', 'skip the .bss loop and globals start as whatever RAM held; the bug shows only after a reset'],
      ['Bootstrapping', 'PC: fixed address near the top, firmware, bootloader, kernel, program: four handoffs', 'one link: SP and reset vector from the first two words of flash, then your code', 'the whole boot is readable; a wrong SP or reset vector is caught by nothing'],
      ['Addresses in a hex file', '8-bit AVR: flash fits in 16 bits, so the 16-bit offset is enough', 'flash at 0x08000000: a type 04 extended linear address record sets the upper 16 bits', 'ignore the 04 record and the bytes seem to belong at 0x0000xxxx'],
    ];
    const t = table(viz('contrast'), ['General idea', 'Alternatives', 'This chip', 'What follows'].map(x => ({ text: x, cls: 'l' })),
      rows.map(r => r.map((c, i) => ({ text: c, cls: i === 2 ? 'l hl' : 'l' }))));
    t.rows[0].classList.add('on');
  });
});
