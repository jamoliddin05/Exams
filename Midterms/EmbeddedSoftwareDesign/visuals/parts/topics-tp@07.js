QV.register('topic7', function (q) {
  const { s, svg, table, steps, arrow, scale } = QV;
  const viz = name => q.querySelector(`[data-viz="${name}"]`);
  const role = name => q.querySelector(`[data-role="${name}"]`);
  const T = (g, x, y, text, cls, anchor) => s('text', { x, y, dy: '0.35em', 'text-anchor': anchor || null, class: cls || null }, g, text);
  const R = (g, x, y, w, h, cls, rx) => s('rect', { x, y, width: w, height: h, rx: rx == null ? 4 : rx, class: cls }, g);
  const L = t => ({ text: t, cls: 'l' });
  const rows = r => r.map(row => row.map(L));
  const hex8 = v => '0x' + (v >>> 0).toString(16).toUpperCase().padStart(8, '0');
  const tri = (g, x, y, cls) => s('polygon', { points: `${x - 4},${y - 10} ${x + 4},${y - 10} ${x},${y - 3}`, class: cls }, g);

  // Tables
  table(viz('terms'), ['Term', 'What it is', 'In this kernel'].map(L), rows([
    ['Task', 'a C function that runs as if it had the CPU to itself', 'bar, button, hog, report, idle'],
    ['Context', 'everything that function needs to carry on: registers + stack pointer', '16 words on the task\'s own stack'],
    ['Context switch', 'save one task\'s context, restore another\'s', 'PendSV_Handler, 34 instructions'],
    ['Task control block (TCB)', 'the kernel\'s record of one task', 'os_task_t; sp is its first field'],
  ]));

  table(viz('special'), ['Register', 'What it holds', 'Read / write (CMSIS)', 'This kernel'].map(L), rows([
    ['xPSR = APSR + IPSR + EPSR', 'flags N Z C V (31:28); the active exception number ISR (5:0, 0 in Thread mode); the Thumb bit T (24)', '__get_xPSR(); no write', 'forged into every new task\'s frame; decoded after a fault'],
    ['MSP', 'main stack pointer', '__get_MSP() / __set_MSP()', 'handlers, and main() before the first switch; read by HardFault_Handler when a handler faulted'],
    ['PSP', 'process stack pointer', '__get_PSP() / __set_PSP()', 'every task; saved and loaded by PendSV_Handler, read by HardFault_Handler'],
    ['PRIMASK', 'bit 0 PM: 1 = interrupts masked', '__get_PRIMASK() / __set_PRIMASK(); cpsid i / cpsie i', 'enter() and leave() around all kernel bookkeeping; PendSV_Handler'],
    ['CONTROL', 'bit 1 SPSEL: which stack Thread mode uses; bit 0 nPRIV: privilege', '__get_CONTROL() / __set_CONTROL()', 'never written: EXC_RETURN sets SPSEL'],
    ['BASEPRI, FAULTMASK', 'priority-threshold masks', '–', 'not on this core: Thumb-2 only'],
  ]));

  table(viz('decide'), ['', 'Deciding: schedule()', 'Switching: PendSV_Handler'].map(L), rows([
    ['What it does', 'picks the next task, pends PendSV if it differs', 'saves the old context, restores the new one'],
    ['Where it runs', 'the tick, os_delay, mutex unlock, queue put: in tasks and in ISRs', 'in one place only'],
    ['When', 'the moment something changes', 'when no other handler is active: priority 3, the lowest'],
    ['Can it change its mind?', 'yes: if the current task should keep running it writes PENDSVCLR', 'no: once PendSV runs, the switch happens'],
  ]));

  table(viz('flow'), ['Step', 'What happens', 'Who'].map(L), rows([
    ['1 → 2', 'Task A runs in Thread mode on PSP. SysTick (every 1 ms) interrupts it, and the hardware pushes half of A\'s context (r0–r3, r12, lr, pc, xPSR) onto A\'s own stack.', 'hardware'],
    ['3 → 4', 'SysTick_Handler decides: ticks++, wake sleepers, pick() finds the most urgent READY task. If that is A, return to A.', 'kernel: SysTick_Handler'],
    ['5', 'If not A, SCB->ICSR = PENDSVSET. The decision is made; the switch is only requested.', 'kernel: schedule()'],
    ['6', 'PendSV waits until no other handler is running, then tail-chains.', 'hardware'],
    ['7 → 8', 'The switch: push A\'s r4–r11, A.tcb->sp = PSP − 32; os_current = B, pop B\'s r4–r11, PSP = B\'s frame.', 'kernel: PendSV_Handler'],
    ['9 → 10', 'bx 0xFFFFFFFD: the exception return pops B\'s 8 words, B\'s pc included, and B runs from exactly where it stopped.', 'hardware'],
  ]));

  table(viz('desktop'), ['', 'This kernel (Cortex-M0+)', 'Windows (x86-64)', 'Linux (x86-64)'].map(L), rows([
    ['Unit switched', 'task: a stack + a TCB', 'thread: KTHREAD + kernel stack', 'task: task_struct + kernel stack'],
    ['The deferred step', 'PendSV, priority 3, when no handler is busy', 'DISPATCH_LEVEL software interrupt (IRQL 2)', 'TIF_NEED_RESCHED, acted on at the next return from interrupt or syscall'],
    ['Saved on entry', 'hardware: r0–r3, r12, lr, pc, xPSR (8 words)', 'trap frame: the volatile registers', 'pt_regs: every user register'],
    ['Saved by the switch', 'r4–r11 (8 words), 34 instructions', 'SwapContext: nonvolatile integer registers + xmm6–xmm15', '__switch_to_asm: rbx, rbp, r12–r15, then the stack pointer'],
    ['Floating point', 'none: the M0+ has no FPU', 'XSAVE area per thread', 'XSAVE area'],
    ['Address space', 'one, shared: no MMU', 'CR3 reloaded if the thread is in another process', 'CR3 reloaded unless the next task shares the mm'],
    ['Also flushed', 'nothing', 'TLB entries (unless PCID), kernel stack in the TSS', 'TLB (unless PCID), TSS.sp0, FS/GS base'],
    ['Rough cost', 'tens of cycles', 'a few µs once cache and TLB misses count', 'a few µs, the same reasons'],
  ]));

  table(viz('policies'), ['Policy', 'Who stops a running task', 'Used here'].map(L), rows([
    ['Cooperative', 'nobody: it runs until it returns or yields', 'lesson 06\'s superloop (slide 1)'],
    ['Fixed-priority preemptive', 'a more urgent task becoming READY', 'yes: the rule pick() applies'],
    ['Round-robin time slicing', 'the tick, among tasks of equal priority', 'yes: the search starts after the current task'],
    ['Idle task', 'nobody: it runs only when nothing else can', 'idle, priority 0, always READY'],
  ]));

  const pr = table(viz('prio'), ['', 'This kernel (and FreeRTOS)', 'The NVIC (hardware)'].map(L), rows([
    ['Most urgent', 'the highest number', '0'],
    ['Least urgent', '0: idle', '3: PendSV and SysTick here'],
    ['Range here', '0 (idle) … 3 (button); a task at 4 is legal', '0 … 3: __NVIC_PRIO_BITS = 2, byte = p << 6'],
    ['Ranks', 'tasks, in Thread mode', 'interrupts and exceptions, in Handler mode'],
    ['Applied by', 'pick(), in software', 'the NVIC, in hardware'],
    ['Example', 'bar (2) outranks report (1)', 'USART2 at 1 outranks PendSV at 3'],
  ]));
  pr.rows[0].classList.add('on');

  table(viz('states'), ['State', 'Means', 'Gets there by', 'Leaves by'].map(L), rows([
    ['READY', 'could run now; the one running is simply the READY task pick() chose, os_current', 'created; woken', 'being picked, then running'],
    ['SLEEPING', 'waiting for a time', 'os_delay, os_delay_until', 'the tick reaching wake'],
    ['BLOCKED', 'waiting for a thing', 'a held mutex; an empty or full queue', 'the owner unlocks; an item arrives or leaves'],
  ]));

  table(viz('mutex'), ['', 'Masking interrupts (PRIMASK)', 'A mutex'].map(L), rows([
    ['Who is held up', 'everything: every task and every interrupt, the tick included', 'only tasks that want this resource'],
    ['How long it may last', 'a few instructions', 'as long as the work takes'],
    ['A waiter, meanwhile', 'nothing else runs', 'BLOCKED, off the CPU'],
    ['Usable from an ISR', 'yes', 'no: an ISR cannot block'],
    ['Used here for', 'the kernel\'s own lists and counters', 'shared, which low and high take turns with (scenario 2)'],
  ]));

  table(viz('inv'), ['Term', 'Meaning', 'Here'].map(L), rows([
    ['Blocking', 'a task waits for a resource another task holds', 'high waits for low\'s mutex: expected, at most 30 ms'],
    ['Priority inversion', 'a task waits, in effect, for a task it outranks', 'high waits behind mid'],
    ['Unbounded inversion', 'that wait has no limit: it lasts as long as mid runs', 'up to 120 ms here; forever if mid never stops'],
  ]));

  table(viz('queue'), ['', 'Mutex', 'Queue, task API', 'Queue, ISR API'].map(L), rows([
    ['The data', 'stays where it is, shared', 'copied to whoever needs it', 'copied in'],
    ['When it cannot go on', 'the caller is BLOCKED while another task holds it', 'the caller blocks while full (put) or empty (get)', 'returns at once: 0 means "full"'],
    ['Why', 'a task can be put to sleep', 'a task can be put to sleep', 'a handler has no task to put to sleep'],
    ['From an ISR', 'never', 'never', 'yes: os_queue_put_from_isr() only'],
  ]));

  table(viz('adds'), ['This kernel', 'FreeRTOS / Zephyr add'].map(L), rows([
    ['fixed-priority preemptive, round-robin', 'tickless idle, deadline scheduling (Zephyr)'],
    ['sleep, mutex with inheritance, queue', 'semaphores, event groups, timers, message buffers'],
    ['one mutex\'s inheritance', 'nested inheritance, recursive mutexes'],
    ['high-water marks by pattern', 'overflow checks on every switch, MPU guard regions'],
    ['34-instruction PendSV', 'the same switch, with FPU state on an M4F'],
  ]));

  table(viz('contrast'), ['Idea', 'Alternatives', 'This chip', 'What follows'].map(L), rows([
    ['Scheduling', 'cooperative (superloop) or preemptive (RTOS)', 'both: lesson 06 cooperative; lesson 07 fixed-priority preemptive with round-robin among equals',
      'cooperative: a job stops only when it returns, so one hog freezes everything. Preemptive: the tick takes the CPU away, but a hog at the top priority still starves the rest.'],
    ['Priority numbering', 'bigger = more urgent, or smaller = more urgent', 'both on one chip: kernel and FreeRTOS bigger = more urgent; NVIC 0 = most urgent',
      'always say which one you mean. A task at 4 is the most urgent task; an interrupt at 3 is the least urgent interrupt.'],
    ['Where the switch happens', 'inside the tick handler, or in a deferred lowest-priority step', 'PendSV at priority 3, pended by software through ICSR',
      'a switch never happens under another handler\'s half-finished frame. Deciding happens anywhere, switching only in PendSV.'],
    ['Saving a context', 'all in software, or split between hardware and software', 'hardware stacks r0–r3, r12, lr, pc, xPSR; PendSV saves r4–r11',
      'a paused task is 16 words on its own stack and one pointer in its TCB.'],
    ['Stacks', 'one stack for everything, or one per task plus one for handlers', 'MSP for handlers, PSP for tasks, chosen by EXC_RETURN',
      'a task\'s stack holds only that task plus the 8-word frame; handlers never use it.'],
    ['Mutual exclusion', 'mask interrupts, or a mutex that blocks only the waiters', 'PRIMASK for the kernel\'s few instructions, a mutex for long sections',
      'an ISR can mask but never lock a mutex. A long masked section freezes every task and interrupt.'],
    ['Passing data', 'share it under a lock, or copy it through a queue', 'both; ISRs use os_queue_put_from_isr()',
      'an ISR never blocks: the put returns 0 when full and the handler decides.'],
    ['Priority inversion', 'accept it, or lend the holder the waiter\'s priority', 'inheritance, right for one mutex at a time',
      'high waits at most for low\'s critical section. Pathfinder was fixed by switching this on.'],
    ['Catching a stack overflow', 'MPU guard region, a check on every switch, a fill pattern', '0xDEADBEEF fill and a high-water mark',
      'nothing faults on this core; the symptom is another task\'s data quietly wrong.'],
    ['Context switch cost', 'a desktop OS also switches address space, FPU state, TLB', 'none of those: one address space, no FPU',
      'tens of cycles instead of a few µs, and one bad pointer can hit every task.'],
  ]));

  // Figure 1: superloop vs RTOS, lane per job
  const cp = svg(viz('coop'), 840, 240, { label: 'Timeline of the button task, the LED bar task, the hog and the loop or idle over 125 ms under a superloop, an RTOS with the hog at priority 1, and at priority 4', minWidth: 560 });
  const cx = scale(0, 125, 170, 820);
  const cy = i => 28 + i * 44;
  s('line', { x1: cx(0), x2: cx(125), y1: 198, y2: 198, class: 'l-axis' }, cp);
  for (let t = 0; t <= 125; t += 25) {
    s('line', { x1: cx(t), x2: cx(t), y1: 198, y2: 203, class: 'l-axis' }, cp);
    T(cp, cx(t), 214, String(t), null, 'middle');
  }
  T(cp, cx(62.5), 232, 'time (ms)', null, 'middle');
  const cg = s('g', {}, cp);
  const BTN = Array.from({ length: 26 }, (_, i) => 5 * i), BAR = [0, 60, 120];
  const COOP = [
    { lab: 'Superloop', hog: 'never returns', last: 'loop checking', hogTxt: 'for (;;): never returns to the loop', stop: true,
      note: 'Lesson 06\'s superloop is cooperative: each job runs until it chooses to return. At 15 ms the loop calls the hog, whose for (;;) never returns, so the loop never comes back. Every due time after that is missed: the bar freezes, the buttons die, the report stops.' },
    { lab: 'RTOS, hog at priority 1', hog: 'priority 1', last: 'idle, priority 0', hogTxt: 'hog, priority 1: every spare cycle', stop: false,
      note: 'The RTOS is preemptive. The hog runs whenever nothing more urgent is READY. Every 5 ms the tick wakes the button task (priority 3); pick() chooses it, PendSV switches to it, it works a few µs and sleeps, and the hog carries on from exactly where it was. Every due time is met. Before the hog is on, idle runs.' },
    { lab: 'RTOS, hog at priority 4', hog: 'priority 4', last: 'idle, priority 0', hogTxt: 'hog, priority 4: always READY, always picked', stop: true,
      note: 'Lab part 1: the same hog created at priority 4. In the kernel the highest number is most urgent, and the hog never sleeps, so pick() chooses it at every tick. The bar, the buttons and the report starve, as in the superloop. Priority must follow deadline, and the hog has none.' },
  ];
  steps(viz('coop-steps'), COOP.map(c => c.lab), k => {
    cg.textContent = '';
    const c = COOP[k];
    [['button', 'due every 5 ms'], ['LED bar', 'due every 60 ms'], ['hog', c.hog], [k ? 'idle' : 'loop', c.last]].forEach(([a, b], i) => {
      T(cg, 0, cy(i) + 5, a, 't-fg t-bold');
      T(cg, 0, cy(i) + 19, b, 't-sm');
    });
    const runs = (lane, ts, cls) => ts.forEach(t => R(cg, cx(t), cy(lane), 3, 22, cls, 1));
    const live = t => !c.stop || t <= 15;
    runs(0, BTN.filter(live), 'f-pri');
    runs(1, BAR.filter(live), 'f-sec');
    R(cg, cx(0) + 4, cy(3), cx(15) - cx(0) - 4, 22, 'f-seg', 2);
    R(cg, cx(15) + 4, cy(2), cx(125) - cx(15) - 4, 22, 'f-ter', 2);
    T(cg, (cx(15) + cx(125)) / 2, cy(2) + 11, c.hogTxt, 't-on', 'middle');
    BTN.forEach(t => tri(cg, cx(t) + 1.5, cy(0), live(t) ? 'f-pri' : 'f-bad'));
    BAR.forEach(t => tri(cg, cx(t) + 1.5, cy(1), live(t) ? 'f-sec' : 'f-bad'));
    role('coop-note').textContent = c.note;
  });

  // Figure 2: EXC_RETURN bits 3 and 2
  const ex = svg(viz('exc'), 760, 206, { label: 'EXC_RETURN bit by bit: bits 31 to 4 all ones, bit 3 selects Thread or Handler mode, bit 2 selects PSP or MSP', minWidth: 560 });
  T(ex, 0, 50, 'EXC_RETURN', 't-fg t-bold');
  T(ex, 0, 66, 'the value in lr', 't-sm');
  T(ex, 300, 28, '31 … 4', 't-sm', 'middle');
  R(ex, 150, 40, 300, 40, 'f-seg', 3);
  T(ex, 300, 60, 'all ones: 0xFFFFFFF in hex', 't-fg', 'middle');
  const ebx = b => 462 + (3 - b) * 62;
  [3, 2, 1, 0].forEach(b => T(ex, ebx(b) + 29, 28, String(b), 't-sm', 'middle'));
  const eg = s('g', {}, ex);
  const EXC = [
    { lab: '0xFFFFFFFD', v: 0xD, res: 'return to Thread mode, restore from PSP, keep using PSP', seen: 'every switch in this kernel; lr in HardFault_Handler when a task faulted', ctl: 'CONTROL afterwards = 0x00000002: SPSEL = 1 (PSP), nPRIV = 0',
      note: 'Low nibble 1101: bit 3 = 1 (Thread mode), bit 2 = 1 (PSP). PendSV returns with this value, so the hardware pops the next task\'s 8 words from PSP and leaves CONTROL.SPSEL = 1. HardFault_Handler\'s tst r0, r1 with r0 = 4 finds bit 2 set and reads the frame from PSP: a task faulted.' },
    { lab: '0xFFFFFFF9', v: 0x9, res: 'return to Thread mode, on MSP', seen: 'main() after reset, before os_start(); the textbook value', ctl: 'CONTROL afterwards = 0x00000000: SPSEL = 0 (MSP)',
      note: 'Low nibble 1001: bit 3 = 1 (Thread mode), bit 2 = 0 (MSP). This is what code running from main() would return to. The first switch interrupts main() on MSP but returns with 0xFFFFFFFD, so execution never goes back to main(), and no task ever uses this value.' },
    { lab: '0xFFFFFFF1', v: 0x1, res: 'return to Handler mode, on MSP', seen: 'a handler was interrupted; lr in HardFault_Handler when a handler faulted', ctl: 'Handler mode always uses MSP, whatever SPSEL says',
      note: 'Low nibble 0001: bit 3 = 0 (Handler mode), bit 2 = 0 (MSP). The exception interrupted another handler. In HardFault_Handler, bit 2 = 0 makes tst take the MSP branch: a handler faulted. No value means Handler mode on PSP, because handlers always run on MSP.' },
  ];
  steps(viz('exc-steps'), EXC.map(e => e.lab), k => {
    eg.textContent = '';
    const e = EXC[k];
    T(eg, 0, 86, '= ' + e.lab, 't-pri t-bold t-lg');
    [3, 2, 1, 0].forEach(b => {
      const v = (e.v >> b) & 1, key = b > 1;
      const cls = key ? (v ? 'f-pri' : 'f-sec') : 'f-seg';
      R(eg, ebx(b), 40, 58, 40, cls, 3);
      T(eg, ebx(b) + 29, 60, String(v), key ? 't-on t-bold t-lg' : 't-fg t-lg', 'middle');
    });
    const m3 = (e.v >> 3) & 1, m2 = (e.v >> 2) & 1;
    T(eg, ebx(3) + 29, 96, 'mode', 't-sm', 'middle');
    T(eg, ebx(3) + 29, 110, m3 ? 'Thread' : 'Handler', (m3 ? 't-pri' : 't-sec') + ' t-bold', 'middle');
    T(eg, ebx(2) + 29, 96, 'stack', 't-sm', 'middle');
    T(eg, ebx(2) + 29, 110, m2 ? 'PSP' : 'MSP', (m2 ? 't-pri' : 't-sec') + ' t-bold', 'middle');
    T(eg, 0, 140, '→ ' + e.res, 't-fg t-bold');
    T(eg, 0, 162, 'seen: ' + e.seen, 't-sm');
    T(eg, 0, 184, e.ctl, 't-sm');
    role('exc-note').textContent = e.note;
  });

  // Figure 3: ICSR and SHPR3 values, 32 cells each
  const sb = svg(viz('scb-bits'), 860, 336, { label: 'ICSR written with PENDSVSET and with PENDSVCLR, SHPR3 with both priorities at 3, and a wrong SHPR3 value in unimplemented bits', minWidth: 560 });
  const SBW = 21, sbx = b => 168 + (31 - b) * SBW;
  for (let b = 31; b >= 0; b--) T(sb, sbx(b) + SBW / 2, 12, String(b), 't-sm', 'middle');
  const IMPL = [31, 30, 23, 22];
  [
    { name: 'ICSR', sub: 'pend PendSV', v: 0x10000000, f: [[28, 28, 'PENDSVSET']] },
    { name: 'ICSR', sub: 'cancel it', v: 0x08000000, f: [[27, 27, 'PENDSVCLR']] },
    { name: 'SHPR3', sub: 'both at priority 3', v: 0xC0C00000, f: [[31, 30, 'SysTick'], [23, 22, 'PendSV']], impl: true },
    { name: 'SHPR3', sub: 'wrong: 3, not 3 << 6', v: 0x03030000, f: [[29, 16, 'bits 25:24 and 17:16 do not exist']], impl: true, bad: true },
  ].forEach((r, i) => {
    const y = 28 + i * 74;
    T(sb, 0, y + 22, r.name, 't-fg t-bold');
    T(sb, 0, y + 37, r.sub, r.bad ? 't-bad t-sm' : 't-sm');
    T(sb, 0, y + 54, '= ' + hex8(r.v), (r.bad ? 't-bad' : 't-pri') + ' t-bold');
    r.f.forEach(([hi, lo, t]) => T(sb, (sbx(hi) + sbx(lo) + SBW) / 2, y + 6, t, (r.bad ? 't-bad' : 't-pri') + ' t-sm t-bold', 'middle'));
    for (let b = 31; b >= 0; b--) {
      const on = (r.v >>> b) & 1;
      R(sb, sbx(b) + 1, y + 14, SBW - 2, 26, on ? (r.bad ? 'f-bad' : 'f-pri') : 'f-seg', 2);
      T(sb, sbx(b) + SBW / 2, y + 27, String(on), on ? 't-on t-bold' : 't-muted', 'middle');
    }
    if (r.impl) IMPL.forEach(b => R(sb, sbx(b) + 1, y + 14, SBW - 2, 26, 'f-none outline-sec', 2));
    for (let n = 7; n >= 0; n--) {
      const d = (r.v >>> (4 * n)) & 0xF;
      T(sb, sbx(4 * n + 3) + 2 * SBW, y + 52, d.toString(16).toUpperCase(), d ? (r.bad ? 't-bad t-bold' : 't-pri t-bold') : 't-fg', 'middle');
      if (n < 7) s('line', { x1: sbx(4 * n + 3), x2: sbx(4 * n + 3), y1: y + 44, y2: y + 60, class: 'l-grid' }, sb);
    }
    if (r.bad) T(sb, 168, y + 70, 'reads back 0x00000000: SysTick and PendSV at priority 0, the most urgent level', 't-bad t-sm');
  });

  // Figure 4: deciding vs switching, lanes over time
  const pd = svg(viz('pend'), 820, 236, { label: 'Lanes for the USART2 handler, SysTick, PendSV, task A and task B: the decision pends PendSV, which runs only when no other handler is active', minWidth: 560 });
  const px = scale(0, 10, 180, 810);
  const pyy = i => 24 + i * 38;
  [['USART2 handler', 'NVIC 1'], ['SysTick_Handler', 'NVIC 3'], ['PendSV_Handler', 'NVIC 3, the switch'], ['task A', 'Thread mode, PSP'], ['task B', 'Thread mode, PSP']].forEach(([a, b], i) => {
    T(pd, 0, pyy(i) + 5, a, 't-fg t-bold');
    T(pd, 0, pyy(i) + 19, b, 't-sm');
    s('line', { x1: px(0), x2: px(10), y1: pyy(i) + 12, y2: pyy(i) + 12, class: 'l-grid' }, pd);
  });
  s('line', { x1: px(0), x2: px(10), y1: 214, y2: 214, class: 'l-axis' }, pd);
  T(pd, px(5), 228, 'time →, not to scale', null, 'middle');
  const pg = s('g', {}, pd);
  const LANE = { U: 0, S: 1, P: 2, A: 3, B: 4 };
  const SEGC = { U: ['f-seg', 't-fg'], S: ['f-seg', 't-fg'], P: ['f-pri', 't-on'], A: ['f-pri-soft', 't-pri'], B: ['f-sec-soft', 't-sec'] };
  const PEND = [
    { lab: 'SysTick decides', segs: [['A', 0, 3], ['S', 3, 5.6, 'decides: PENDSVSET'], ['P', 5.6, 7, 'switch A → B'], ['B', 7, 10, 'B runs']], pend: [5.2, 5.6],
      note: 'The tick interrupts A and the hardware stacks A\'s 8 words. SysTick_Handler wakes sleepers and pick() returns B, so schedule() writes PENDSVSET. Nothing is switched yet. When SysTick returns, PendSV is pending and no other handler is active, so it tail-chains: it saves A, loads B and returns into B.' },
    { lab: 'A UART interrupt decides', segs: [['A', 0, 3], ['U', 3, 5.6, 'queue put: PENDSVSET'], ['P', 5.6, 7, 'switch A → B'], ['B', 7, 10, 'B runs']], pend: [5.2, 5.6],
      note: 'Deciding can happen in any handler. The USART2 handler puts a byte in a queue, which makes the waiting task B READY, and schedule() pends PendSV. B does not run inside the handler: the switch happens after the handler returns.' },
    { lab: 'Nested handlers', segs: [['A', 0, 2], ['S', 2, 3, 'tick'], ['U', 3, 5.6, 'queue put: PENDSVSET'], ['S', 5.6, 7, 'finishes'], ['P', 7, 8.4, 'switch A → B'], ['B', 8.4, 10, 'B runs']], pend: [5.2, 7], held: [3, 5.6],
      note: 'SysTick (3) is running when the UART interrupt (1) arrives and preempts it, because 1 is more urgent. The UART handler pends PendSV, but PendSV (3) cannot preempt SysTick (3): equal priorities never preempt. SysTick finishes its half-done work on MSP first, and only then does PendSV switch. Switching inside the UART handler would have returned SysTick into the wrong world.' },
    { lab: 'No switch needed', segs: [['A', 0, 3], ['S', 3, 5.6, 'pick() = A: PENDSVCLR'], ['A', 5.6, 10, 'A carries on']],
      note: 'Deciding includes deciding not to switch. pick() returns A again, so schedule() writes PENDSVCLR, which cancels any switch requested earlier from information that is now stale. SysTick returns straight into A, and PendSV never runs.' },
  ];
  steps(viz('pend-steps'), PEND.map(c => c.lab), k => {
    pg.textContent = '';
    const c = PEND[k];
    if (c.held) {
      R(pg, px(c.held[0]), pyy(LANE.S), px(c.held[1]) - px(c.held[0]), 24, 'f-none s-muted dash', 2);
      T(pg, (px(c.held[0]) + px(c.held[1])) / 2, pyy(LANE.S) + 12, 'preempted, waiting', 't-sm', 'middle');
    }
    if (c.pend) {
      R(pg, px(c.pend[0]), pyy(LANE.P), px(c.pend[1]) - px(c.pend[0]), 24, 'f-none s-pri dash', 2);
      if (px(c.pend[1]) - px(c.pend[0]) > 60) T(pg, (px(c.pend[0]) + px(c.pend[1])) / 2, pyy(LANE.P) + 12, 'pending', 't-pri t-sm', 'middle');
    }
    c.segs.forEach(([ln, a, b, t]) => {
      R(pg, px(a) + 1, pyy(LANE[ln]), px(b) - px(a) - 2, 24, SEGC[ln][0], 3);
      if (t) T(pg, (px(a) + px(b)) / 2, pyy(LANE[ln]) + 12, t, SEGC[ln][1] + ' t-sm', 'middle');
    });
    role('pend-note').textContent = c.note;
  });

  // Figure 5: the switch on two stacks, slide 6's steps
  const sw = svg(viz('sw'), 840, 412, { label: 'Task A\'s and task B\'s stacks, 16 words each, during PendSV: A\'s r4 to r11 saved below its hardware frame, B\'s restored, with r0, PSP and tcb->sp pointers', minWidth: 560 });
  const SWX = { A: 110, B: 530 }, SWW = 150, RH = 17, TY = 44;
  const BASE = { A: 0x20000440, B: 0x20000640 };
  const REGN = ['r4', 'r5', 'r6', 'r7', 'r8', 'r9', 'r10', 'r11', 'r0', 'r1', 'r2', 'r3', 'r12', 'lr', 'pc', 'xPSR'];
  T(sw, SWX.A + SWW / 2, 12, 'task A\'s stack: being saved', 't-fg t-bold', 'middle');
  T(sw, SWX.B + SWW / 2, 12, 'task B\'s stack: being restored', 't-fg t-bold', 'middle');
  T(sw, 395, 28, 'low addresses at the top', 't-sm', 'middle');
  ['A', 'B'].forEach(side => {
    for (let i = 0; i <= 16; i += 4) T(sw, SWX[side] - 6, TY + i * RH, hex8(BASE[side] + 4 * i), 't-sm', 'end');
    R(sw, SWX[side], TY + 16 * RH + 4, SWW, 20, 'f-none box dash', 0);
    T(sw, SWX[side] + SWW / 2, TY + 16 * RH + 14, side + '\'s own locals', 't-sm', 'middle');
  });
  const swg = s('g', {}, sw);
  const CELL = { write: ['f-pri', 't-on'], read: ['f-ok', 't-on'], sw: ['f-pri-soft', 't-pri'], hw: ['f-sec-soft', 't-sec'], stale: ['f-seg', 't-muted'], free: ['f-surface box dash', 't-muted'] };
  const stA = k => REGN.map((_, i) => i >= 8 ? 'hw' : k < 3 ? 'free' : k === 3 ? (i < 4 ? 'write' : 'free') : k === 4 ? (i < 4 ? 'sw' : 'write') : 'sw');
  const stB = k => REGN.map((_, i) => {
    const lo = i < 4, mid = i >= 4 && i < 8;
    if (k === 9) return i < 8 ? 'stale' : 'read';
    if (k === 8) return lo ? 'read' : mid ? 'stale' : 'hw';
    if (k === 7) return mid ? 'stale' : lo ? 'sw' : 'hw';
    if (k === 6) return mid ? 'read' : lo ? 'sw' : 'hw';
    return i < 8 ? 'sw' : 'hw';
  });
  const R0 = [null, 0x20000460, 0x20000440, 0x20000450, 0x20000460, 0x20000640, 0x20000660, 0x20000660, 0x20000650, null];
  const PSPV = k => (k < 7 ? 0x20000460 : k < 9 ? 0x20000660 : 0x20000680);
  const REGS = k => [
    ['r0', R0[k] ? hex8(R0[k]) : k ? 'B\'s r0, popped' : 'scratch'],
    ['PSP', hex8(PSPV(k))],
    ['r4–r7 hold', k < 4 ? 'A\'s r4–r7' : k < 6 ? 'A\'s r8–r11' : k < 8 ? 'B\'s r8–r11' : 'B\'s r4–r7'],
    ['r8–r11 hold', k < 6 ? 'A\'s r8–r11' : 'B\'s r8–r11'],
    ['os_current', k < 5 ? 'A' : 'B'],
  ];
  const SWS = [
    { lab: 'Entry', calc: 'PendSV entered. The hardware already pushed A\'s r0–r3, r12, lr, pc, xPSR\nPSP = 0x20000460   (A\'s r0 slot)',
      note: 'PendSV starts. When SysTick interrupted A, the hardware pushed half of A\'s context onto A\'s own stack, through PSP. r4–r11 still hold A\'s values, and the 8 words below the frame are free.' },
    { lab: '1 mrs', calc: 'mrs   r0, psp          r0 = PSP = 0x20000460',
      note: 'Step 1: copy PSP into r0. PendSV runs in Handler mode on MSP, so it reaches A\'s stack through r0; a push would land on MSP.' },
    { lab: '2 subs, str', calc: 'subs  r0, #32          r0 = 0x20000460 − 0x20 = 0x20000440\nstr   r0, [r1]         A.tcb->sp = 0x20000440',
      note: 'Step 2: reserve 8 words below the hardware frame and store that address in A\'s TCB, at [tcb + 0]. From now on A.tcb->sp points at where A\'s r4 goes.' },
    { lab: '3 stmia', calc: 'stmia r0!, {r4-r7}     [0x20000440 … 0x2000044C] = r4 … r7\n                       r0 = 0x20000450',
      note: 'Step 3: stmia stores r4–r7 at +0 to +12 and moves r0 on by 16 bytes.' },
    { lab: '4 mov, stmia', calc: 'mov   r4, r8 … mov r7, r11\nstmia r0!, {r4-r7}     [0x20000450 … 0x2000045C] = r8 … r11\n                       r0 = 0x20000460',
      note: 'Step 4: Thumb-1 stmia cannot name r8–r11, so four movs copy them into r4–r7, which are already saved, and a second stmia stores them at +16. A is fully saved: 16 words and A.tcb->sp.' },
    { lab: '5 ldr', calc: 'str   r1, [r3]         os_current = os_next = B\nldr   r0, [r1]         r0 = B.tcb->sp = 0x20000640',
      note: 'Between the halves, os_current = os_next = B. Step 5: r0 = B\'s saved sp, read from [tcb + 0]. It points at B\'s r4.' },
    { lab: '6 adds, ldmia, mov', calc: 'adds  r0, #16          r0 = 0x20000650\nldmia r0!, {r4-r7}     r4 … r7 = [0x20000650 … 0x2000065C], r0 = 0x20000660\nmov   r8, r4 … mov r11, r7',
      note: 'Step 6: skip 16 bytes to B\'s r8–r11, load them into r4–r7, then mov them into r8–r11. r0 ends at B\'s hardware frame. r8–r11 must come first, because loading them uses r4–r7 as scratch.' },
    { lab: '7 msr', calc: 'msr   psp, r0          PSP = 0x20000660   (B\'s r0 slot)',
      note: 'Step 7: PSP = r0, B\'s hardware frame. The 8 words just read stay in memory as stale copies.' },
    { lab: '8 subs, ldmia', calc: 'subs  r0, #32          r0 = 0x20000640\nldmia r0!, {r4-r7}     r4 … r7 = [0x20000640 … 0x2000064C], r0 = 0x20000650',
      note: 'Step 8: step back 32 bytes and load B\'s own r4–r7, last, over the scratch copies of r8–r11.' },
    { lab: '9 bx', calc: 'ldr   r0, =0xFFFFFFFD\nbx    r0               the hardware pops 8 words: PSP = 0x20000660 + 32 = 0x20000680\n                       B resumes at the pc it saved at 0x20000678 (+56)',
      note: 'Step 9: return with EXC_RETURN 0xFFFFFFFD, Thread mode on PSP. The hardware pops r0–r3, r12, lr, pc and xPSR from B\'s stack, PSP ends 64 bytes above B.tcb->sp, and B runs from where it was stopped.' },
  ];
  steps(viz('sw-steps'), SWS.map(x => x.lab), k => {
    swg.textContent = '';
    [['A', stA(k)], ['B', stB(k)]].forEach(([side, st]) => {
      st.forEach((kind, i) => {
        const x = SWX[side], y = TY + i * RH;
        R(swg, x, y, SWW, RH, CELL[kind][0] + (kind === 'free' ? '' : ' sep'), 0);
        T(swg, x + 8, y + RH / 2, REGN[i], CELL[kind][1] + (kind === 'write' || kind === 'read' ? ' t-bold' : ''));
        T(swg, x + SWW - 8, y + RH / 2, '+' + 4 * i, CELL[kind][1] + ' t-sm', 'end');
      });
    });
    const ptr = [];
    if (R0[k]) ptr.push(['r0', R0[k]]);
    ptr.push(['PSP', PSPV(k)]);
    if (k >= 2) ptr.push(['tcb->sp', BASE.A]);
    ptr.push(['tcb->sp', BASE.B]);
    const at = {};
    ptr.forEach(([n, a]) => { (at[a] = at[a] || []).push(n); });
    Object.keys(at).forEach(a => {
      const side = a >= BASE.B ? 'B' : 'A', y = TY + (a - BASE[side]) / 4 * RH, x = SWX[side] + SWW;
      arrow(swg, x + 26, y, x + 2, y, { cls: 'a-pri', head: 6 });
      T(swg, x + 30, y, at[a].join(', '), 't-pri t-bold');
    });
    const prev = k ? REGS(k - 1) : null;
    REGS(k).forEach(([n, v], i) => {
      const x = 16 + i * 164, y = 352, ch = prev && prev[i][1] !== v;
      R(swg, x, y, 152, 46, ch ? 'f-pri-soft' : 'f-seg', 4);
      if (ch) R(swg, x, y, 152, 46, 'f-none outline-pri', 4);
      T(swg, x + 10, y + 14, n, 't-sm');
      T(swg, x + 10, y + 32, v, ch ? 't-pri t-bold' : 't-fg');
    });
    role('sw-note').textContent = SWS[k].note;
    role('sw-calc').textContent = SWS[k].calc;
  }, 9);

  // Figure 6: two Thumb-1 encodings
  const en = svg(viz('enc'), 780, 232, { label: 'Encodings of stmia r0!, {r4-r7} = 0xC0F0 with an 8-bit register list r0 to r7, and mov r4, r8 = 0x4644 with a 4-bit Rm', minWidth: 560 });
  const EW = 38, enx = b => 150 + (15 - b) * EW;
  [
    { name: 'stmia r0!, {r4-r7}', v: 0xC0F0, key: [7, 0],
      f: [[15, 11, 'STMIA 11000'], [10, 8, 'Rn = 000: r0'], [7, 0, 'register list: one bit per register']],
      sub: b => (b <= 7 ? 'r' + b : null), extra: 'bits 7:0 name r0 … r7 only: no bit exists for r8–r12' },
    { name: 'mov r4, r8', v: 0x4644, key: [6, 3],
      f: [[15, 8, 'MOV, high registers: 0x46'], [7, 7, 'D'], [6, 3, 'Rm = 1000: r8'], [2, 0, 'Rd = 100']],
      sub: () => null, extra: 'destination = D:Rd = 0100 = r4; a 4-bit Rm reaches r0 … r15' },
  ].forEach((r, i) => {
    const y = 10 + i * 112;
    T(en, 0, y + 30, r.name, 't-fg t-bold');
    T(en, 0, y + 46, '= 0x' + r.v.toString(16).toUpperCase(), 't-pri t-bold');
    for (let b = 15; b >= 0; b--) {
      const v = (r.v >> b) & 1, key = b <= r.key[0] && b >= r.key[1];
      T(en, enx(b) + EW / 2, y + 6, String(b), 't-sm', 'middle');
      R(en, enx(b) + 1, y + 14, EW - 2, 34, key ? (v ? 'f-pri' : 'f-pri-soft') : 'f-seg', 3);
      const sub = r.sub(b);
      T(en, enx(b) + EW / 2, y + (sub ? 25 : 31), String(v), key && v ? 't-on t-bold' : key ? 't-pri t-bold' : 't-fg', 'middle');
      if (sub) T(en, enx(b) + EW / 2, y + 40, sub, (v ? 't-on' : 't-pri') + ' t-sm', 'middle');
    }
    r.f.forEach(([hi, lo, t]) => {
      const a = enx(hi) + 3, b = enx(lo) + EW - 3, key = hi === r.key[0];
      s('path', { d: `M${a} ${y + 54} V${y + 60} H${b} V${y + 54}`, class: key ? 's-pri' : 's-muted', style: 'stroke-width: 1.5' }, en);
      T(en, (a + b) / 2, y + 72, t, key ? 't-pri t-bold t-sm' : 't-sm', 'middle');
    });
    T(en, 150, y + 92, r.extra, i ? 't-fg t-sm' : 't-bad t-sm t-bold');
  });

  // Figure 7: forged frame vs preempted frame
  const fg = svg(viz('forge'), 780, 440, { label: 'Two 16-word stack frames side by side: the forged frame of a new task with xPSR 0x01000000, pc, lr task_exit, r0 arg and zeros, and a real preempted task with the same layout', minWidth: 560 });
  const FX = { L: 130, R: 470 }, FW = 200, FH = 20, FY = 70;
  const FREG = ['r4', 'r5', 'r6', 'r7', 'r8', 'r9', 'r10', 'r11', 'r0', 'r1', 'r2', 'r3', 'r12', 'lr', 'pc', 'xPSR'];
  const FORGED = ['0', '0', '0', '0', '0', '0', '0', '0', 'arg', '0', '0', '0', '0', 'task_exit', '0x08000228', '0x01000000'];
  const REAL = ['A\'s r4', 'A\'s r5', 'A\'s r6', 'A\'s r7', 'A\'s r8', 'A\'s r9', 'A\'s r10', 'A\'s r11', 'A\'s r0', 'A\'s r1', 'A\'s r2', 'A\'s r3', 'A\'s r12', 'A\'s lr', 'where A stopped', 'A\'s flags, T = 1'];
  T(fg, FX.L + FW / 2, 12, 'button: forged by os_task_create()', 't-fg t-bold', 'middle');
  T(fg, FX.R + FW / 2, 12, 'task A: saved by a real switch', 't-fg t-bold', 'middle');
  T(fg, FX.L - 8, 56, 'order', 't-sm', 'end');
  R(fg, FX.L, FY - 26, FW, 20, 'f-seg', 0);
  T(fg, FX.L + FW / 2, FY - 16, '0xDEADBEEF … the rest of the stack', 't-muted t-sm', 'middle');
  R(fg, FX.R, FY - 26, FW, 20, 'f-none box dash', 0);
  T(fg, FX.R + FW / 2, FY - 16, 'free stack below', 't-muted t-sm', 'middle');
  FREG.forEach((n, i) => {
    const y = FY + i * FH, hw = i >= 8, key = [8, 13, 14, 15].includes(i);
    [['L', FORGED[i]], ['R', REAL[i]]].forEach(([side, v]) => {
      R(fg, FX[side], y, FW, FH, (hw ? 'f-sec-soft' : 'f-pri-soft') + ' sep', 0);
      T(fg, FX[side] + 8, y + FH / 2, n, hw ? 't-sec t-bold' : 't-pri t-bold');
      T(fg, FX[side] + FW - 8, y + FH / 2, v, side === 'L' && key ? 't-fg t-bold' : 't-fg', 'end');
    });
    T(fg, FX.L - 8, y + FH / 2, String(16 - i), 't-sm', 'end');
    T(fg, FX.L + FW + 8, y + FH / 2, '+' + 4 * i, 't-sm');
  });
  [[FX.L + FW + 26, FX.L + FW + 66], [FX.R + FW + 2, FX.R + FW + 34]].forEach(([tip, tail]) => {
    arrow(fg, tail, FY, tip, FY, { cls: 'a-pri', head: 6 });
    T(fg, tail + 4, FY, 'tcb->sp', 't-pri t-bold');
  });
  T(fg, FX.L + FW / 2, FY + 16 * FH + 14, 'top: (stack + stack_words) & ~7', 't-sm', 'middle');
  T(fg, FX.R + FW / 2, FY + 16 * FH + 14, 'A\'s own locals above', 't-sm', 'middle');
  T(fg, 400, FY + 16 * FH + 38, 'PendSV restores both the same way: r4–r11 by its own code, the 8-word frame by the exception return.', 't-fg', 'middle');

  // Figure 8: pick() over scenario 1's task array
  const pk = svg(viz('pick'), 760, 210, { label: 'Five task boxes in array order with the visit order of pick() circled and the chosen task highlighted', minWidth: 560 });
  const TASKS = [['bar', 2], ['button', 3], ['hog', 1], ['report', 1], ['idle', 0]];
  const PKX = i => 22 + i * 144;
  const pkg = s('g', {}, pk);
  const MOM = [
    { lab: 'First switch', cur: -1, ready: [1, 1, 1, 1, 1],
      note: 'The first switch: os_current is 0, so cur = 0 and the walk starts at index 1. Every task is READY. button (p3) is found first and nothing beats 3, so button runs first. That is why lab part 2\'s broken xPSR faulted in button.' },
    { lab: 'hog running', cur: 2, ready: [0, 0, 1, 1, 1],
      note: 'The hog is running; bar and button sleep. The walk starts after the hog, at report (p1), and takes it. The hog\'s own 1 at the end is not strictly higher, so it does not replace report: equal priorities take turns, one tick each.' },
    { lab: 'report running', cur: 3, ready: [0, 0, 1, 1, 1],
      note: 'One tick later report is current. The walk starts at idle (p0), then finds the hog (p1), which beats 0. report\'s own 1 does not beat the hog\'s 1. Back to the hog: round-robin.' },
    { lab: 'bar wakes', cur: 2, ready: [1, 0, 1, 1, 1],
      note: 'The tick woke the bar (p2) while the hog ran. The walk finds report (p1) first, then the bar (p2) beats it. The bar preempts the hog at once: fixed-priority preemption.' },
  ];
  steps(viz('pick-steps'), MOM.map(m => m.lab), k => {
    pkg.textContent = '';
    const m = MOM[k], n = TASKS.length, cur = m.cur < 0 ? 0 : m.cur;
    let best = -1;
    const trace = [`cur = ${cur}${m.cur < 0 ? ' (os_current == 0)' : ' (' + TASKS[cur][0] + ')'}`];
    for (let i = 1; i <= n; i++) {
      const j = (cur + i) % n, [nm, p] = TASKS[j];
      let why;
      if (!m.ready[j]) why = 'SLEEPING: skip';
      else if (best < 0) { best = j; why = 'first READY: best = ' + nm; }
      else if (p > TASKS[best][1]) { why = `${p} > ${TASKS[best][1]}: best = ${nm}`; best = j; }
      else why = `${p} > ${TASKS[best][1]}? no`;
      trace.push(`i = ${i}  tasks[${j}]  ${nm.padEnd(6)} p${p}  ${why}`);
      const cxp = PKX(j) + 65;
      s('circle', { cx: cxp, cy: 26, r: 11, class: 'f-surface s-muted', style: 'stroke-width: 1.5' }, pkg);
      T(pkg, cxp, 26, String(i), 't-fg t-bold', 'middle');
    }
    trace.push('→ ' + TASKS[best][0]);
    TASKS.forEach(([nm, p], j) => {
      const x = PKX(j), pick = j === best, rd = m.ready[j];
      R(pkg, x, 50, 130, 76, pick ? 'f-ok' : rd ? 'f-pri-soft' : 'f-seg', 6);
      if (j === m.cur) R(pkg, x, 50, 130, 76, 'f-none outline-sec', 6);
      const tc = pick ? 't-on' : rd ? 't-pri' : 't-muted';
      T(pkg, x + 65, 68, nm, tc + ' t-bold t-lg', 'middle');
      T(pkg, x + 65, 88, `index ${j} · prio ${p}`, tc, 'middle');
      T(pkg, x + 65, 108, rd ? (j === m.cur ? 'READY, current' : 'READY') : 'SLEEPING', tc + ' t-sm', 'middle');
    });
    T(pkg, 22, 150, 'visit order: ' + Array.from({ length: n }, (_, i) => (cur + i + 1) % n).join(', ') + (m.cur < 0 ? '  (no current task: cur = 0)' : '  (starts after the current task, outlined)'), 't-sm');
    T(pkg, 22, 176, `picked: ${TASKS[best][0]} (p${TASKS[best][1]})`, 't-ok t-bold t-lg');
    role('pick-note').textContent = m.note;
    role('pick-calc').textContent = trace.join('\n');
  });

  // Figure 9: the urgency ladder with both numberings
  const ld = svg(viz('ladder'), 660, 372, { label: 'Urgency ladder: NVIC levels 0 to 3 above, with 0 at the top, then the kernel task priorities 3 to 0, with 3 at the top', minWidth: 520 });
  arrow(ld, 22, 350, 22, 40, { cls: 'a-muted', width: 2 });
  T(ld, 10, 26, 'more urgent', 't-fg t-bold');
  T(ld, 10, 362, 'less urgent', 't-sm');
  const LRW = 30, rowL = (g, y, num, text, cls) => {
    R(g, 70, y, 70, LRW - 4, cls[0], 4);
    T(g, 105, y + (LRW - 4) / 2, num, cls[1] + ' t-bold t-lg', 'middle');
    R(g, 146, y, 300, LRW - 4, 'f-surface box', 4);
    T(g, 156, y + (LRW - 4) / 2, text, 't-fg');
  };
  T(ld, 70, 44, 'Exceptions · NVIC number, 0 = most urgent', 't-sec t-bold');
  [['0', 'nothing in this lesson'], ['1', 'e.g. USART2 (lesson 08), an EXTI line'], ['2', '(free)'], ['3', 'SysTick and PendSV: the least urgent']].forEach(([n, t], i) => rowL(ld, 56 + i * LRW, 'NVIC ' + n, t, ['f-sec-soft', 't-sec']));
  s('line', { x1: 60, x2: 640, y1: 188, y2: 188, class: 's-muted dash', style: 'stroke-width: 1' }, ld);
  T(ld, 70, 200, 'Handler mode above, Thread mode below: any enabled interrupt preempts any task', 't-sm');
  T(ld, 70, 226, 'Tasks · kernel priority, highest number = most urgent', 't-pri t-bold');
  [['3', 'button'], ['2', 'bar'], ['1', 'hog, report: round-robin'], ['0', 'idle, always READY']].forEach(([n, t], i) => rowL(ld, 238 + i * LRW, 'prio ' + n, t, ['f-pri-soft', 't-pri']));
  arrow(ld, 470, 60, 470, 166, { cls: 'a-sec', width: 2 });
  T(ld, 482, 104, 'number grows', 't-sec t-bold');
  T(ld, 482, 120, 'going down', 't-sec');
  arrow(ld, 470, 352, 470, 244, { cls: 'a-pri', width: 2 });
  T(ld, 482, 290, 'number grows', 't-pri t-bold');
  T(ld, 482, 306, 'going up', 't-pri');

  // Figure 10: inversion timeline, without and with inheritance
  const iv = svg(viz('invfig'), 820, 248, { label: 'Timeline of high, mid and low over 160 ms: without inheritance high waits 140 ms, 120 of them for mid; with inheritance it waits 20 ms', minWidth: 560 });
  const ix = scale(0, 160, 130, 800);
  const iy = i => 40 + i * 46;
  [['high', 'priority 3'], ['mid', 'priority 2'], ['low', 'priority 1']].forEach(([a, b], i) => {
    T(iv, 0, iy(i) + 5, a, 't-fg t-bold');
    T(iv, 0, iy(i) + 19, b, 't-sm');
  });
  s('line', { x1: ix(0), x2: ix(160), y1: 176, y2: 176, class: 'l-axis' }, iv);
  for (let t = 0; t <= 160; t += 20) {
    s('line', { x1: ix(t), x2: ix(t), y1: 176, y2: 181, class: 'l-axis' }, iv);
    T(iv, ix(t), 192, String(t), null, 'middle');
  }
  T(iv, ix(80), 208, 'time (ms)', null, 'middle');
  const ivg = s('g', {}, iv);
  const INV = [
    { lab: 'Without inheritance', unlock: 150,
      segs: [[2, 0, 10, 'f-ter'], [0, 10, 11, 'f-pri'], [0, 11, 20, 'f-seg'], [2, 11, 20, 'f-ter'], [1, 20, 140, 'f-sec', 'mid runs 120 ms', 't-on'],
        [0, 20, 140, 'f-bad', 'blocked: waiting for mid', 't-on'], [2, 140, 150, 'f-ter'], [0, 140, 150, 'f-seg'], [0, 150, 154, 'f-pri']],
      sum: 'high waited 10 → 150 = 140 ms: 20 ms for low, 120 ms for mid', cls: 't-bad',
      note: 'Low locks at 0. High asks at 10 and blocks: legitimate, low holds what high needs. At 20 mid wakes. Mid (2) outranks low (1), so pick() runs mid for 120 ms, and low cannot finish and unlock. High (3) waits behind mid, a task it outranks that never touches the mutex. Only at 150 does low unlock.' },
    { lab: 'With inheritance', unlock: 30, inherit: true,
      segs: [[2, 0, 10, 'f-ter'], [0, 10, 11, 'f-pri'], [0, 11, 30, 'f-seg', 'blocked', 't-fg'], [2, 11, 30, 'f-ter', 'at p3', 't-on'], [1, 20, 34, 'f-sec-soft'],
        [0, 30, 34, 'f-pri'], [1, 34, 154, 'f-sec', 'mid runs 120 ms', 't-on']],
      sum: 'high waited 10 → 30 = 20 ms, all of it for low\'s critical section', cls: 't-ok',
      note: 'At 10 high blocks on the mutex, and os_mutex_lock() lends low high\'s priority: low runs at 3. When mid wakes at 20 it is READY but not picked, because low (3) outranks it. Low finishes its 30 ms, unlocks at 30 and drops back to base_prio 1; high goes at once. Mid still gets its 120 ms, just later.' },
  ];
  steps(viz('inv-steps'), INV.map(c => c.lab), k => {
    ivg.textContent = '';
    const c = INV[k];
    [[0, 'lock', 1], [10, 'high asks', 2], [20, 'mid wakes', 1], [c.unlock, 'unlock', c.unlock < 40 ? 2 : 1]].forEach(([t, txt, row]) => {
      s('line', { x1: ix(t), x2: ix(t), y1: 30, y2: 172, class: 's-muted dash', style: 'stroke-width: 1' }, ivg);
      T(ivg, ix(t), row === 1 ? 10 : 23, txt, 't-sm', t === 0 ? null : 'middle');
    });
    c.segs.forEach(([ln, a, b, cls, txt, tc]) => {
      R(ivg, ix(a), iy(ln), Math.max(3, ix(b) - ix(a)), 24, cls, 2);
      if (txt) T(ivg, (ix(a) + ix(b)) / 2, iy(ln) + 12, txt, tc + ' t-sm', 'middle');
    });
    T(ivg, ix(0), 236, c.sum, c.cls + ' t-bold');
    role('inv-note').textContent = c.note;
  });

  // Figure 11: ISR -> queue -> task
  const qf = svg(viz('qfig'), 820, 206, { label: 'The USART2 receive handler puts bytes into a four-slot queue with os_queue_put_from_isr, and the protocol task blocks in os_queue_get', minWidth: 560 });
  const qg = s('g', {}, qf);
  const QS = [
    { lab: '1 · Empty', q: '', isr: false, isrTxt: 'idle', task: ['BLOCKED in os_queue_get()', '0% CPU'], taskCls: 'f-seg', st: 'The hog or idle has the CPU.', stCls: 't-fg',
      note: 'The queue is empty, so os_queue_get() marked the protocol task BLOCKED. It costs no CPU at all: the hog or idle runs instead.' },
    { lab: '2 · A byte arrives', q: 'L', isr: true, isrTxt: 'c = RDR = \'L\'', task: ['READY: woken by the put', 'not running yet'], taskCls: 'f-pri-soft', put: true, st: 'put_from_isr(&q, &c) → 1 · schedule() pends PendSV', stCls: 't-fg',
      note: 'RXNE: the handler reads RDR and calls os_queue_put_from_isr(), which copies the byte in and returns 1. It wakes the waiting task and calls schedule(), so the task is READY and PendSV is pending. The task does not run inside the handler.' },
    { lab: '3 · Handler returns', q: '', isr: false, isrTxt: 'returned', task: ['running', 'os_queue_get() returns \'L\''], taskCls: 'f-pri', get: true, st: 'PendSV tail-chains: switch to the protocol task', stCls: 't-fg',
      note: 'The handler returns; no other handler is active, so PendSV switches to the protocol task. Its os_queue_get() copies \'L\' out, and the queue is empty again.' },
    { lab: '4 · Queue full', q: '$LED', isr: true, isrTxt: 'c = RDR = \',\'', task: ['READY, not run yet', 'a more urgent task has the CPU'], taskCls: 'f-pri-soft', drop: true, st: 'put_from_isr(&q, &c) → 0 · dropped++', stCls: 't-bad',
      note: 'The task fell behind and 4 bytes wait. The next byte finds the queue full: os_queue_put_from_isr() returns 0 at once instead of blocking. The handler decides what to do, here: count the lost byte and return.' },
    { lab: '5 · Spin instead?', q: '$LED', isr: true, spin: true, isrTxt: 'while (!put…) { }', task: ['READY, never runs', 'the handler holds the CPU'], taskCls: 'f-bad-soft', st: 'the handler spins forever: nothing below NVIC 1 runs again', stCls: 't-bad',
      note: 'The tempting fix, while (!os_queue_put_from_isr(...)) { }, never sleeps but never ends. The only thing that can empty the queue is the task, and a task runs only after every handler has returned. The handler waits for the task, the task waits for the handler: the board hangs.' },
  ];
  steps(viz('q-steps'), QS.map(x => x.lab), k => {
    qg.textContent = '';
    const c = QS[k];
    R(qg, 10, 40, 230, 64, c.spin ? 'f-bad' : c.isr ? 'f-seg' : 'f-surface box', 6);
    const hc = c.spin ? 't-on' : 't-fg';
    T(qg, 125, 60, 'USART2_IRQHandler', hc + ' t-bold', 'middle');
    T(qg, 125, 78, 'NVIC 1, on MSP', c.spin ? 't-on t-sm' : 't-sm', 'middle');
    T(qg, 125, 94, c.isrTxt, c.isr ? hc : 't-muted', 'middle');
    T(qg, 400, 30, 'rx queue: 4 slots', 't-fg t-bold', 'middle');
    for (let i = 0; i < 4; i++) {
      const ch = c.q[i], full = c.q.length === 4;
      R(qg, 290 + i * 56, 46, 52, 44, ch ? (full ? 'f-ter-soft' : 'f-pri') : 'f-seg', 4);
      if (ch) T(qg, 316 + i * 56, 68, ch, (full ? 't-ter' : 't-on') + ' t-bold t-lg', 'middle');
    }
    R(qg, 580, 40, 230, 64, c.taskCls, 6);
    const tc = c.taskCls === 'f-pri' ? 't-on' : 't-fg';
    T(qg, 695, 58, 'task_proto', tc + ' t-bold', 'middle');
    T(qg, 695, 76, c.task[0], tc + ' t-sm', 'middle');
    T(qg, 695, 92, c.task[1], tc + ' t-sm', 'middle');
    arrow(qg, 242, 68, 286, 68, { cls: c.put ? 'a-pri' : c.drop || c.spin ? 'a-bad' : 'a-muted', width: c.put || c.drop ? 2.5 : 1.5, dash: !c.put && !c.drop && !c.spin });
    arrow(qg, 516, 68, 576, 68, { cls: c.get ? 'a-pri' : 'a-muted', width: c.get ? 2.5 : 1.5, dash: !c.get });
    T(qg, 264, 124, 'put_from_isr', 't-sm', 'middle');
    T(qg, 546, 124, 'get', 't-sm', 'middle');
    T(qg, 10, 160, c.st, c.stCls + ' t-bold');
    T(qg, 10, 184, `dropped = ${k >= 3 ? 1 : 0}`, k === 3 ? 't-bad' : 't-sm');
    role('q-note').textContent = c.note;
  });

  // Figure 12: high-water mark and overflow, one cell per word
  const hw = svg(viz('hw'), 860, 236, { label: 'The top of the report task\'s stack as a strip of words: the 0xDEADBEEF fill, the high-water mark at 115 words, and 19 words written below a 96-word stack onto primes', minWidth: 560 });
  const HWN = 136, HWX = k => 834 - (k + 1) * 4;
  const hwg = s('g', {}, hw);
  const brace = (g, k0, k1, y, up, txt, cls) => {
    const a = HWX(k1), b = HWX(k0) + 4, e = up ? y + 6 : y - 6;
    s('path', { d: `M${a} ${e} V${y} H${b} V${e}`, class: cls.indexOf('t-bad') >= 0 ? 's-bad' : cls.indexOf('t-pri') >= 0 ? 's-pri' : 's-muted', style: 'stroke-width: 1.5' }, g);
    T(g, (a + b) / 2, up ? y - 10 : y + 12, txt, cls, 'middle');
  };
  const HWS = [
    { lab: 'Created', kind: k => (k < 16 ? 'f-pri' : 'f-seg'), left: '← 376 more words, all 0xDEADBEEF',
      top: [[0, 15, '16 forged words']], note: 'os_task_create() fills the whole 512-word array with 0xDEADBEEF, then forges the top 16 words (Figure 7). The stack pointer starts at the right end and moves left as the task calls functions.' },
    { lab: '512 words, after a run', kind: k => (k < 115 ? 'f-pri-soft' : 'f-seg'), left: '← 376 more words, still 0xDEADBEEF',
      top: [[0, 114, '115 words used: printf alone needs 460 bytes']], mark: 115,
      note: 'After every path has run, the deepest point was 115 words from the top. Every word below still reads 0xDEADBEEF: never reached. os_stack_used() counts them and the report prints 115 / 512. Size = 115 plus a margin.' },
    { lab: '96 words: overflow', kind: k => (k < 96 ? 'f-pri-soft' : k < 115 ? 'f-bad' : 'f-surface'), over: true,
      top: [[0, 95, 'stk_report: 96 / 96 OVERFLOW'], [96, 114, '19 words too many']],
      note: 'The stack cut to 96 words. printf still goes 115 words deep, so it writes 19 words below stk_report[0]. The word right below is primes, the hog\'s counter. Nothing faults: the hog\'s count becomes 536 871 010 = 0x20000062, a stack address. The mark saturates at the size, so 96 / 96 means at least full, not by how much.' },
  ];
  steps(viz('hw-steps'), HWS.map(x => x.lab), k => {
    hwg.textContent = '';
    const c = HWS[k];
    for (let w = 0; w < HWN; w++) s('rect', { x: HWX(w), y: 96, width: 4, height: 32, class: c.kind(w) + ' sep', style: 'stroke-width: 0.5' }, hwg);
    T(hwg, 838, 112, 'top', 't-sm');
    if (c.left) T(hwg, 284, 112, c.left, 't-sm', 'end');
    c.top.forEach(([a, b, t], i) => brace(hwg, a, b, 80, true, t, i ? 't-bad t-bold' : 't-pri t-bold'));
    if (c.mark) {
      const x = HWX(c.mark - 1);
      s('line', { x1: x, x2: x, y1: 90, y2: 150, class: 's-ok', style: 'stroke-width: 2' }, hwg);
      T(hwg, x, 162, 'high-water mark: the deepest word ever written', 't-ok t-bold', 'middle');
      T(hwg, x, 182, '0xDEADBEEF to the left: never reached', 't-sm', 'middle');
    }
    if (c.over) {
      const xs = HWX(95), xp = HWX(96);
      s('line', { x1: xs, x2: xs, y1: 90, y2: 150, class: 's-fg', style: 'stroke-width: 2' }, hwg);
      T(hwg, xs + 4, 162, 'stk_report[0] at 0x20000088', 't-fg t-bold');
      R(hwg, xp - 1, 95, 6, 34, 'f-none outline-sec', 0);
      arrow(hwg, xp + 2, 196, xp + 2, 132, { cls: 'a-sec', head: 6 });
      T(hwg, xp + 8, 204, 'primes, the hog\'s counter, at 0x20000084', 't-sec t-bold');
      T(hwg, HWX(114), 162, 'deepest: 0x2000003C', 't-bad t-sm', 'middle');
      T(hwg, 284, 112, 'other variables ←', 't-sm', 'end');
    }
    T(hwg, 290, 228, 'one cell = one word; lower addresses on the left; the stack grows to the left', 't-sm');
    role('hw-note').textContent = c.note;
  }, 1);
});
