QV.register('exam1', function (q) {
  const lessons = [
    ['00', "Programmer's model", 4], ['01', 'Instruction set', 4], ['02', 'Development', 3], ['03', 'Execution and concurrency', 3],
    ['04', 'Startup and linker script', 3], ['05', 'GPIO and interrupts', 5], ['06', 'Time and timers', 4], ['07', 'RTOS', 4],
    ['08', 'UART and Python host', 3],
  ];
  const W = 480, rowH = 34, cell = 26, gap = 4, sx = 230;
  const yOf = i => 34 + i * rowH + (i >= 4 ? 30 : 0);
  const svg = QV.svg(q.querySelector('[data-viz="spread"]'), W, yOf(8) + rowH + 6, { label: 'The 33 questions of a sample, grouped by lesson', minWidth: 440 });
  QV.s('text', { x: 10, y: 20, class: 't-pri t-bold' }, svg, 'Part 0 · models · 14 questions');
  QV.s('line', { x1: 10, x2: W - 10, y1: yOf(4) - 22, y2: yOf(4) - 22, class: 's-line' }, svg);
  QV.s('text', { x: 10, y: yOf(4) - 6, class: 't-sec t-bold' }, svg, 'Part 1 · instances · 19 questions');
  let n = 1;
  lessons.forEach(([num, name, k], i) => {
    const y = yOf(i), part1 = i >= 4;
    const link = QV.s('a', { href: '#topic' + Number(num) }, svg);
    QV.s('text', { x: 10, y: y + cell / 2, dy: '0.35em', class: 't-fg' }, link, 'L' + num + ' ' + name);
    for (let j = 0; j < k; j++) {
      const x = sx + j * (cell + gap);
      QV.s('rect', { x, y, width: cell, height: cell, rx: 4, class: part1 ? 'f-sec' : 'f-pri' }, svg);
      QV.s('text', { x: x + cell / 2, y: y + cell / 2, dy: '0.35em', 'text-anchor': 'middle', class: 't-on t-sm' }, svg, String(n + j));
    }
    QV.s('text', { x: sx + 5 * (cell + gap) + 8, y: y + cell / 2, dy: '0.35em', class: 't-muted' }, svg, 'Q' + n + '–' + (n + k - 1));
    n += k;
  });
});
