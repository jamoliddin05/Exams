QV.register('s1-mc9', function (q) {
  const { s, svg, box, arrow, steps } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);

  // Figure 1: the five stages and what SystemCoreClock is after each
  const P = svg(viz('pipe'), 800, 262, { label: 'Build pipeline: main.c, preprocess, compile, assemble, link, locate, Main.elf; link.ld feeds locate', minWidth: 560 });
  const B = { x0: 18, w: 92, dx: 112, y: 92, h: 40 };
  const names = ['main.c', 'preprocess', 'compile', 'assemble', 'link', 'locate', 'Main.elf'];
  const bx = i => B.x0 + i * B.dx;
  const boxes = names.map((n, i) => {
    const g = s('g', { class: 'fade' }, P);
    const file = i === 0 || i === 6;
    box(g, bx(i), B.y, B.w, B.h, n, { cls: file ? 'f-seg' : 'f-surface', textCls: 't-fg t-bold' });
    if (i < 6) arrow(P, bx(i) + B.w, B.y + B.h / 2, bx(i + 1), B.y + B.h / 2, { cls: 'a-muted' });
    return g;
  });
  const hi = s('rect', { y: B.y - 3, width: B.w + 6, height: B.h + 6, rx: 8, class: 'f-none outline-pri' }, P);
  box(P, bx(4) + B.w / 2 - 56, 16, 112, 40, 'startup.o\nlibc_nano.a', { cls: 'f-seg', textCls: 't-fg' });
  arrow(P, bx(4) + B.w / 2, 56, bx(4) + B.w / 2, B.y, { cls: 'a-muted' });
  box(P, bx(5) + 10, 16, 72, 40, 'link.ld', { cls: 'f-pri-soft', stroke: 'outline-pri', textCls: 't-pri t-bold' });
  arrow(P, bx(5) + B.w / 2, 56, bx(5) + B.w / 2, B.y, { cls: 'a-pri', width: 2 });
  s('text', { x: bx(5) + 90, y: 30, class: 't-pri t-sm' }, P, 'you write');
  s('text', { x: bx(5) + 90, y: 43, class: 't-pri t-sm' }, P, 'it by hand');
  const brace = (i0, i1, text, cls) => {
    const x1 = bx(i0), x2 = bx(i1) + B.w, y = B.y + B.h + 12;
    s('path', { d: `M${x1} ${y - 4} V${y} H${x2} V${y - 4}`, class: cls }, P);
    s('text', { x: (x1 + x2) / 2, y: y + 15, 'text-anchor': 'middle', class: cls.replace('s-', 't-') }, P, text);
  };
  brace(1, 3, 'one file at a time, no final addresses', 's-muted');
  brace(4, 5, 'all objects together', 's-pri');

  s('rect', { x: 18, y: 178, width: 764, height: 72, rx: 6, class: 'f-seg' }, P);
  s('text', { x: 30, y: 198, class: 't-fg t-bold' }, P, 'SystemCoreClock in main.c after this stage');
  const stateT = s('text', { x: 30, y: 222, class: 't-fg' }, P, '');
  const state2 = s('text', { x: 30, y: 239, class: 't-muted t-sm' }, P, '');
  s('text', { x: 700, y: 198, 'text-anchor': 'middle', class: 't-fg t-bold' }, P, 'address');
  const addrR = s('rect', { x: 628, y: 208, width: 144, height: 30, rx: 4, class: 'f-surface box' }, P);
  const addrT = s('text', { x: 700, y: 223, dy: '0.35em', 'text-anchor': 'middle', class: 't-fg t-bold t-lg' }, P, '');

  const ST = [
    { k: 5, a: '0x20000000', t: 'every use of the name now carries 0x20000000', t2: 'Locate gave the name its real address, from the memory map in link.ld.' },
    { k: 1, a: 'none', t: '#include "clock.h" pasted in: extern uint32_t SystemCoreClock;', t2: 'Still C text. The name is declared, nothing more.' },
    { k: 2, a: '?', t: 'Thumb code with a hole where the address goes', t2: 'The compiler sees only main.c. It leaves a hole and a note: "needs SystemCoreClock".' },
    { k: 3, a: '?', t: 'main.o: code bytes, the hole, and the note in the symbol table', t2: 'Assembled bytes. The symbol is still undefined in this file.' },
    { k: 4, a: '? (not placed)', t: 'the need in main.o is matched to the one definition in startup.o', t2: 'Names are resolved. No section has an address yet.' },
    { k: 5, a: '0x20000000', t: 'link.ld: RAM starts at 0x20000000, .data goes there first', t2: 'Every hole is filled with a real address. Binding happened at build time.' },
  ];
  const NOTES = [
    'All five stages. Only locate turns names into addresses, and it needs your memory map to do it. Pick a stage.',
    'Preprocess: <code>#include</code> and <code>#define</code> are expanded. The result is still C text for one file.',
    'Compile: <code>main.c</code> becomes Thumb code, alone. It uses <code>SystemCoreClock</code> but has no address for it, so it leaves a hole and a note.',
    'Assemble: the code becomes an object file, <code>main.o</code>. The hole is still open. Nothing so far knows the chip\'s memory map.',
    'Link: all objects meet. Every "needs" is matched to exactly one "defines": <code>main.o</code> needs the name, <code>startup.o</code> defines it.',
    'Locate, the embedded stage: <code>link.ld</code> says RAM starts at <code>0x20000000</code>, so <code>.data</code>, with <code>SystemCoreClock</code> first, lands there. On a laptop no such step exists in the build: the MMU translates at run time instead.',
  ];
  const note = role('pipe-note');
  steps(viz('pipe-steps'), ['All', '1 · preprocess', '2 · compile', '3 · assemble', '4 · link', '5 · locate'], k => {
    const st = ST[k];
    boxes.forEach((g, i) => g.classList.toggle('dim', k > 0 && i !== st.k && i !== 0));
    hi.setAttribute('x', bx(st.k) - 3);
    stateT.textContent = st.t;
    state2.textContent = st.t2;
    addrT.textContent = st.a;
    const fixed = st.a.startsWith('0x');
    addrR.setAttribute('class', fixed ? 'f-pri' : 'f-surface box');
    addrT.setAttribute('class', (fixed ? 't-on' : 't-muted') + ' t-bold t-lg');
    note.innerHTML = NOTES[k];
  });

  // Figure 2: when the address becomes final, for the three binding moments
  const G = svg(viz('bind'), 760, 236, { label: 'Three rows: this chip binds at compile time, relocatable executables at load time, desktop and phone systems at run time with an MMU', minWidth: 560 });
  const C = { x0: 168, w: 190, gap: 6, y0: 46, h: 46, dy: 60 };
  const cx = c => C.x0 + c * (C.w + C.gap);
  ['build (compile, link, locate)', 'load (program starts)', 'run'].forEach((t, c) => s('text', { x: cx(c) + C.w / 2, y: 18, 'text-anchor': 'middle', class: 't-fg t-bold' }, G, t));
  arrow(G, C.x0, 30, cx(2) + C.w, 30, { cls: 'a-muted' });
  const ROWS = [
    { l1: 'this chip', l2: 'compile time', cells: [['f-pri', 't-on', 'SystemCoreClock → 0x20000000'], ['f-pri', 't-on', 'nothing to do: no loader'], ['f-pri', 't-on', 'real SRAM word, no MMU']] },
    { l1: 'relocatable .exe', l2: 'load time', cells: [['f-seg', 't-fg', 'x = base + 0x40, base ?'], ['f-pri', 't-on', 'loader picks base, patches'], ['f-pri', 't-on', 'x stays where it was put']] },
    { l1: 'desktop, phone OS', l2: 'run time, needs MMU', cells: [['f-sec-soft', 't-fg', 'x at virtual 0x400000'], ['f-sec-soft', 't-fg', 'loader maps pages'], ['f-sec-soft', 't-fg', 'MMU: 0x400000 → a page']] },
  ];
  ROWS.forEach((r, i) => {
    const y = C.y0 + i * C.dy;
    s('text', { x: 0, y: y + 18, class: 't-fg t-bold' }, G, r.l1);
    s('text', { x: 0, y: y + 34, class: i === 0 ? 't-pri t-bold' : 't-muted' }, G, r.l2);
    r.cells.forEach(([f, t, text], c) => {
      s('rect', { x: cx(c), y, width: C.w, height: C.h, rx: 4, class: f }, G);
      s('text', { x: cx(c) + C.w / 2, y: y + C.h / 2, dy: '0.35em', 'text-anchor': 'middle', class: t + ' t-sm' }, G, text);
    });
  });
  s('text', { x: C.x0, y: 230, class: 't-muted t-sm' }, G, 'Only the bottom row lets the same binary run at a different address every launch.');
});

QV.register('s1-mc10', function (q) {
  const { s, svg, steps, table } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);

  const PX = 4, X0 = 96;
  const S = svg(viz('cost'), 760, 176, { label: 'FLASH grows by 68 bytes (lut 64 plus gain 4), RAM grows by 132 bytes (samples 128 plus gain 4)', minWidth: 560 });
  const ROW = { FLASH: 34, RAM: 98 }, RH = 34;
  s('text', { x: 0, y: ROW.FLASH + RH / 2, dy: '0.35em', class: 't-fg t-bold' }, S, 'FLASH');
  s('text', { x: 0, y: ROW.RAM + RH / 2, dy: '0.35em', class: 't-fg t-bold' }, S, 'RAM');
  const groups = { lut: s('g', { class: 'fade' }, S), samples: s('g', { class: 'fade' }, S), gain: s('g', { class: 'fade' }, S) };
  const block = (v, row, x0, bytes, fill, text, label) => {
    const g = groups[v], y = ROW[row], w = bytes * PX;
    s('rect', { x: x0, y, width: w, height: RH, class: fill + ' sep' }, g);
    if (text) s('text', { x: x0 + w / 2, y: y + RH / 2, dy: '0.35em', 'text-anchor': 'middle', class: 't-on' }, g, text);
    if (label) {
      s('line', { x1: x0 + w / 2, x2: x0 + w / 2, y1: y - 2, y2: y - 8, class: 's-pri', style: 'stroke-width: 1.5' }, g);
      s('text', { x: x0 + w / 2, y: y - 12, 'text-anchor': 'middle', class: 't-pri t-sm' }, g, label);
    }
    return x0 + w;
  };
  let fx = block('lut', 'FLASH', X0, 64, 'f-ter', 'lut[64] · .rodata · 64 B');
  fx = block('gain', 'FLASH', fx, 4, 'f-pri', null, 'gain, initial value 3: 4 B');
  let rx = block('samples', 'RAM', X0, 128, 'f-sec', 'samples[32] · .bss · 128 B');
  rx = block('gain', 'RAM', rx, 4, 'f-pri', null, 'gain: 4 B');
  s('text', { x: fx + 10, y: ROW.FLASH + RH / 2, dy: '0.35em', class: 't-fg t-bold t-lg' }, S, '+68 B');
  s('text', { x: rx + 10, y: ROW.RAM + RH / 2, dy: '0.35em', class: 't-fg t-bold t-lg' }, S, '+132 B');
  const AY = 146;
  s('line', { x1: X0, x2: X0 + 132 * PX, y1: AY, y2: AY, class: 'l-axis' }, S);
  [0, 32, 64, 96, 128].forEach(b => {
    s('line', { x1: X0 + b * PX, x2: X0 + b * PX, y1: AY, y2: AY + 5, class: 'l-axis' }, S);
    s('text', { x: X0 + b * PX, y: AY + 18, 'text-anchor': 'middle' }, S, b === 128 ? '128 bytes' : String(b));
  });

  const tbl = table(viz('cost-table'), [{ text: 'Variable', cls: 'l' }, { text: 'Section', cls: 'l' }, { text: 'Why', cls: 'l' }, 'FLASH', 'RAM'], [
    [{ text: 'lut[64]', cls: 'l' }, { text: '.rodata', cls: 'l' }, { text: 'const: never changes', cls: 'l' }, '64', '0'],
    [{ text: 'samples[32]', cls: 'l' }, { text: '.bss', cls: 'l' }, { text: 'starts at zero: only a size is recorded', cls: 'l' }, '0', '128'],
    [{ text: 'gain', cls: 'l' }, { text: '.data', cls: 'l' }, { text: 'writable and has a starting value', cls: 'l' }, '4', '4'],
    [{ text: 'total', cls: 'l' }, '', '', { text: '+68', cls: 'hl' }, { text: '+132', cls: 'hl' }],
  ]);
  const KEYS = [null, 'lut', 'samples', 'gain'];
  const NOTES = [
    'All three. FLASH grows by 64 + 4 = 68 bytes, RAM by 128 + 4 = 132 bytes: option C.',
    '<code>lut</code> is <code>const</code>, so it lives in <code>.rodata</code> in flash with the code. All 64 bytes are stored, including the 61 zeros after <code>{1, 2, 3}</code>. It takes no RAM.',
    '<code>samples</code> has no initial value, so it is <code>.bss</code>: 32 × 4 = 128 bytes of RAM. The image stores only how many bytes to clear, so flash does not grow.',
    '<code>gain</code> must be writable, so the variable lives in RAM. Its starting value 3 must survive power-off, so a copy sits in flash, and <code>Reset_Handler</code> copies it before <code>main()</code>. It costs 4 bytes in each.',
  ];
  const note = role('cost-note');
  steps(viz('cost-steps'), ['All', 'lut', 'samples', 'gain'], k => {
    Object.keys(groups).forEach(v => groups[v].classList.toggle('dim', k > 0 && v !== KEYS[k]));
    tbl.rows.forEach((r, i) => r.classList.toggle('on', k > 0 && i === k - 1));
    note.innerHTML = NOTES[k];
  });
});

QV.register('s1-mc11', function (q) {
  const { s, svg, steps, arrow } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);

  const T = svg(viz('tl'), 780, 226, { label: 'Timeline of presses on two boards: with the .bss loop it restarts at 0 after reset, without it the old count 58 survives', minWidth: 560 });
  const L = { x0: 116, w: 104, gap: 6, y1: 58, y2: 122, h: 52 };
  const cx = c => L.x0 + c * (L.w + L.gap);
  const COLS = [['power on', 'HW loads SP, PC'], ['Reset_Handler', 'copy .data, …'], ['main() runs', '58 presses'], ['reset button', 'HW loads SP, PC'], ['Reset_Handler', 'copy .data, …'], ['main() again', 'first read']];
  // [value, caption, fill, text class] per column for the two boards
  const WITH = [['0', 'power-on RAM', 'f-seg', 't-fg'], ['0', 'zeroed', 'f-ok-soft', 't-ok'], ['58', 'counted', 'f-seg', 't-fg'], ['58', 'SRAM kept', 'f-seg', 't-fg'], ['0', 'zeroed', 'f-ok-soft', 't-ok'], ['0', 'correct', 'f-ok', 't-on']];
  const WITHOUT = [['0', 'power-on RAM', 'f-seg', 't-fg'], ['0', 'not touched', 'f-seg', 't-fg'], ['58', 'counted', 'f-seg', 't-fg'], ['58', 'SRAM kept', 'f-seg', 't-fg'], ['58', 'not touched', 'f-bad-soft', 't-bad'], ['58', 'wrong start', 'f-bad', 't-on']];
  s('text', { x: 0, y: L.y1 + 20, class: 't-fg t-bold' }, T, 'with the');
  s('text', { x: 0, y: L.y1 + 36, class: 't-fg t-bold' }, T, '.bss loop');
  s('text', { x: 0, y: L.y2 + 20, class: 't-bad t-bold' }, T, 'without the');
  s('text', { x: 0, y: L.y2 + 36, class: 't-bad t-bold' }, T, '.bss loop');
  const cols = COLS.map(([t1, t2], c) => {
    const g = s('g', { class: 'fade' }, T), x = cx(c);
    s('text', { x: x + L.w / 2, y: 18, 'text-anchor': 'middle', class: 't-fg t-bold' }, g, t1);
    s('text', { x: x + L.w / 2, y: 34, 'text-anchor': 'middle', class: 't-sm' }, g, t2);
    [[L.y1, WITH[c]], [L.y2, WITHOUT[c]]].forEach(([y, [v, cap, f, tc]]) => {
      s('rect', { x, y, width: L.w, height: L.h, rx: 4, class: f }, g);
      s('text', { x: x + L.w / 2, y: y + 20, dy: '0.35em', 'text-anchor': 'middle', class: tc + ' t-bold t-lg' }, g, v);
      s('text', { x: x + L.w / 2, y: y + 38, dy: '0.35em', 'text-anchor': 'middle', class: tc + ' t-sm' }, g, cap);
    });
    return g;
  });
  s('line', { x1: cx(3) - L.gap / 2, x2: cx(3) - L.gap / 2, y1: 6, y2: L.y2 + L.h + 6, class: 's-fg dash', style: 'stroke-width: 1' }, T);
  arrow(T, L.x0, 196, cx(5) + L.w, 196, { cls: 'a-muted' });
  s('text', { x: L.x0, y: 216, class: 't-sm' }, T, 'time: cold boot, then a run, then the reset button');

  const NOTES = [
    'The whole story. Both boards behave the same until the reset button. After it, only the board with the <code>.bss</code> loop starts <code>presses</code> at 0 again.',
    'Power on. The hardware loads SP and PC from the first two words of flash and does nothing else. Fresh RAM happened to read 0 here, which is why the tests after plugging in passed. Nothing promises that.',
    '<code>Reset_Handler</code> copies <code>.data</code> on both boards. Only the first one also runs the <code>.bss</code> loop, which writes 0 to <code>presses</code>.',
    '<code>main()</code> runs and counts 58 presses. The count is in SRAM.',
    'The reset button. Again the hardware only loads SP and PC. SRAM is not cleared, so <code>presses</code> still holds 58 on both boards.',
    'The <code>.bss</code> loop puts <code>presses</code> back to 0. On the board without it, nothing touches that word, so 58 survives.',
    '<code>main()</code> reads <code>presses</code>: 0 with the loop, 58 without. The wrong value depends on what ran before, so the bug appears only sometimes.',
  ];
  const note = role('tl-note');
  steps(viz('tl-steps'), ['All', '1 · power on', '2 · Reset_Handler', '3 · run', '4 · reset', '5 · Reset_Handler', '6 · main()'], k => {
    cols.forEach((g, i) => g.classList.toggle('dim', k > 0 && i !== k - 1));
    note.innerHTML = NOTES[k];
  });
});
