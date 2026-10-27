# SOC3050 — Answers and explanations B

Сначала реши [вариант B](Sample-B.md), затем проверь ответы. Это авторская тренировка по исходникам курса, а не прогноз реальных вопросов.

## Quick key

| Question | Answer | Lesson |
|---|---|---|
| 1 | B | 00 |
| 2 | C | 00 |
| 3 | A | 00 |
| 4 | A | 01 |
| 5 | B | 01 |
| 6 | C | 01 |
| 7 | B | 01 |
| 8 | A | 02 |
| 9 | D | 02 |
| 10 | C | 02 |
| 11 | D | 03 |
| 12 | B | 03 |
| 13 | C | 03 |
| 14 | A | 04 |
| 15 | A | 04 |
| 16 | B | 04 |
| 17 | C | 05 |
| 18 | B | 05 |
| 19 | C | 05 |
| 20 | D | 05 |
| 21 | C | 05 |
| 22 | D | 06 |
| 23 | D | 06 |
| 24 | A | 06 |
| 25 | B | 06 |
| 26 | A | 07 |
| 27 | D | 07 |
| 28 | D | 07 |
| 29 | A | 07 |
| 30 | B | 08 |
| 31 | C | 08 |
| 32 | D | 08 |
| 33 | A | 08 |

## Разбор

### 1. B — lesson 00

**Ответ:** HardFault because the word address is not naturally aligned

Слову из четырёх байт нужен адрес, кратный четырём. 0x...02 не подходит. Симулятор может моделировать это иначе; вопрос явно о silicon.

**Источник:** [Lesson 00, slides 10](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/00_Architecture/Slide.md).

### 2. C — lesson 00

**Ответ:** NVIC and SysTick

NVIC/SysTick описывает документация ARM и core_cm0plus.h. RCC/GPIO/USART/TIM/EXTI — устройство ST, stm32c031xx.h и reference manual.

**Источник:** [Lesson 00, slides 6, 7](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/00_Architecture/Slide.md).

### 3. A — lesson 00

**Ответ:** MRS (or the CMSIS __get_PRIMASK wrapper)

PRIMASK — специальный core register без memory-mapped адреса. Его читают MRS. BASEPRI у M0+ отсутствует.

**Источник:** [Lesson 00, slides 3b, 8](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/00_Architecture/Slide.md).

### 4. A — lesson 01

**Ответ:** 0xF3

BICS — bit clear: FF & ~0C = F3. Это не OR и не обычный AND с маской.

**Источник:** [Lesson 01, slides 5](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/01_Instruction_Set/Slide.md).

### 5. B — lesson 01

**Ответ:** 0xFFFFFFFC (-4)

Arithmetic shift сохраняет знак: старший бит заполняется единицей. Logical shift LSRS дал бы 0x7FFFFFFC. Для отрицательных нечётных чисел ASR не равен C-делению с округлением к нулю.

**Источник:** [Lesson 01, slides 6](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/01_Instruction_Set/Slide.md).

### 6. C — lesson 01

**Ответ:** 124 bytes

5 бит дают 0..31, умножаем на 4: 0,4,...,124. Отрицательный и некратный четырём offset этой формой не кодируется.

**Источник:** [Lesson 01, slides 9, 10](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/01_Instruction_Set/Slide.md).

### 7. B — lesson 01

**Ответ:** It may call __aeabi_uidiv because no hardware divide instruction exists

M0+ — Thumb-1 plus six, без divide и FPU. Compiler может использовать runtime helper; M3/M4 имеют другие возможности.

**Источник:** [Lesson 01, slides 16, 17](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/01_Instruction_Set/Slide.md).

### 8. A — lesson 02

**Ответ:** At build/link-and-locate time

Linker script задаёт фиксированную карту при сборке. Здесь нет loader/MMU, которые выбрали бы новую карту при запуске.

**Источник:** [Lesson 02, slides 1, 2](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/02_Development/Slide.md).

### 9. D — lesson 02

**Ответ:** Flash 1040 bytes; RAM 300 bytes

Flash=900+100+40=1040. RAM=40+60+200=300. .data учитывается дважды, .bss во flash не хранится.

**Источник:** [Lesson 02, slides 4, 5](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/02_Development/Slide.md).

### 10. C — lesson 02

**Ответ:** Main.elf

ELF содержит sections, адреса, symbols и debug info. BIN — только байты; HEX — записи байтов и адресов, но не полноценная debug-информация.

**Источник:** [Lesson 02, slides 7, 9](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/02_Development/Slide.md).

### 11. D — lesson 03

**Ответ:** Whether the shared object needs volatile so the loop reloads it

Без volatile компилятор может сохранить прочитанное значение и не читать его снова. Это проблема видимости accesses, отдельная от RMW-race.

**Источник:** [Lesson 03, slides 4](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/03_Execution_Concurrency/Slide.md).

### 12. B — lesson 03

**Ответ:** Main may get an old width paired with a new count

Атомарность каждого слова не даёт согласованности пары. Нужна короткая секция, копирующая оба значения без вмешательства writer.

**Источник:** [Lesson 03, slides 7](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/03_Execution_Concurrency/Slide.md).

### 13. C — lesson 03

**Ответ:** B can preempt A

У NVIC меньшее число срочнее. Если B имеет более высокий аппаратный приоритет, он может прервать A. Равный приоритет так не делает.

**Источник:** [Lesson 03, slides 8](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/03_Execution_Concurrency/Slide.md).

### 14. A — lesson 04

**Ответ:** The section-start address assigned by the linker

Linker symbol обозначает адрес. В принятом объявлении extern uint32_t _sdata чтение _sdata разыменовало бы этот адрес; & даёт саму границу section.

**Источник:** [Lesson 04, slides 12, 14](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/04_Startup_And_LinkerScript/Slide.md).

### 15. A — lesson 04

**Ответ:** 0x20003000

12*1024=12288=0x3000. Начальный SP указывает сразу за верхней границей RAM; push уменьшает его перед сохранением.

**Источник:** [Lesson 04, slides 3, 13](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/04_Startup_And_LinkerScript/Slide.md).

### 16. B — lesson 04

**Ответ:** At reset the core interprets instruction bytes as the initial SP and reset vector

Hardware не знает имён ELF sections. Оно читает два слова по reset mapping. Правильные checksums говорят о целостности записи, а не о верной компоновке.

**Источник:** [Lesson 04, slides 6, 20](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/04_Startup_And_LinkerScript/Slide.md).

### 17. C — lesson 05

**Ответ:** 0xEBFFFDFF

PA4 — bits9:8, mask=0x300. Очищаем: EBFFFCFF. Ставим 01: OR 0x100 → EBFFFDFF. Одним OR исходное 11 не изменить.

**Источник:** [Lesson 05, slides 5, 6, 15](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/05_GPIO_And_Interrupts/Slide.md).

### 18. B — lesson 05

**Ответ:** Low; any device pulling low wins

Open-drain активно тянет только вниз. Если хотя бы один участник тянет low, линия low; high появляется, когда отпускают все. Это wired-AND.

**Источник:** [Lesson 05, slides 7, 9](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/05_GPIO_And_Interrupts/Slide.md).

### 19. C — lesson 05

**Ответ:** EXTI->EXTICR[3] bits 15:8

У C0 EXTICR находится в EXTI. 13/4=3, 13 mod4=1; байт начинается с bit8. Port code занимает младшие биты этого байта.

**Источник:** [Lesson 05, slides 24](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/05_GPIO_And_Interrupts/Slide.md).

### 20. D — lesson 05

**Ответ:** IPR[1], contribution 0x00400000

6/4=1 → IPR[1]; byte6mod4=2 → shift16. Encoded byte=1<<6=0x40; 0x40<<16=0x00400000.

**Источник:** [Lesson 05, slides 26](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/05_GPIO_And_Interrupts/Slide.md).

### 21. C — lesson 05

**Ответ:** t=13 ms

В t10 сработал reset held=0; t11→1, t12→2, t13→3 и accept. Вопрос задаёт именно алгоритм курса, чтобы не было неоднозначного счёта samples.

**Источник:** [Lesson 05, slides 20, 21](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/05_GPIO_And_Interrupts/Slide.md).

### 22. D — lesson 06

**Ответ:** The old active prescaler may be used until the first update

PSC буферизован. EGR=UG принудительно переносит новый делитель в активную часть; после UG нужно очистить поднятый UIF перед включением interrupt.

**Источник:** [Lesson 06, slides 6](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/06_Time_And_Timers/Slide.md).

### 23. D — lesson 06

**Ответ:** 50 Hz frames with a 1.5 ms high pulse (7.5% duty)

Период=(19999+1) us=20 ms, частота50 Hz. High пока CNT<1500: 1500 us. Duty=1500/20000=7.5%.

**Источник:** [Lesson 06, slides 8, 9](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/06_Time_And_Timers/Slide.md).

### 24. A — lesson 06

**Ответ:** 1000 microseconds

(464-65000) mod65536=1000. Приведение к uint16_t оставляет результат по модулю16 бит; при одном микросекундном tick это1000 us.

**Источник:** [Lesson 06, slides 12, 13](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/06_Time_And_Timers/Slide.md).

### 25. B — lesson 06

**Ответ:** At least one wrap occurred, not that exactly five occurred

COUNTFLAG — один sticky bit, не очередь и не счётчик. Он теряет кратность событий. ISR tick тоже требует своевременного обслуживания: pending не хранит бесконечное число ticks.

**Источник:** [Lesson 06, slides 1, 2](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/06_Time_And_Timers/Slide.md).

### 26. A — lesson 07

**Ответ:** The switch is deferred until active handlers finish; PendSV has lowest priority

schedule выбирает задачу, PendSV выполняет переключение. Низший приоритет не даёт подменять task context внутри незавершённого другого handler.

**Источник:** [Lesson 07, slides 4b, 4c](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/07_RTOS/Slide.md).

### 27. D — lesson 07

**Ответ:** r4-r11

Hardware сохраняет r0-r3,r12,lr,pc,xPSR. Оставшиеся callee-saved r4-r11 сохраняет kernel. В Thumb-1 high regs проходят через low regs.

**Источник:** [Lesson 07, slides 5, 7](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/07_RTOS/Slide.md).

### 28. D — lesson 07

**Ответ:** The lower-priority task can starve; preemption alone does not guarantee it CPU time

Round-robin действует между равными task priorities. Высокоприоритетная READY задача не уступает низкоприоритетной только из-за tick; для ожидания нужны block/sleep.

**Источник:** [Lesson 07, slides 9, 10](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/07_RTOS/Slide.md).

### 29. A — lesson 07

**Ответ:** 108 words, or 432 bytes

Used=128-20=108 words. uint32_t word=4 bytes →432. Это наблюдавшийся максимум, не гарантия для непроверенных путей.

**Источник:** [Lesson 07, slides 16, 17](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/07_RTOS/Slide.md).

### 30. B — lesson 08

**Ответ:** Read RDR for RXNE; write ORECF=1 to ICR for ORE

Флаг приёма уходит при чтении data register RDR. Overrun очищается записью1 в отдельный clear register ICR, а не записью в ISR.

**Источник:** [Lesson 08, slides 4](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/08_UART_And_Python_Host/Slide.md).

### 31. C — lesson 08

**Ответ:** 255 bytes; the byte data before the new head

Один пустой slot различает full и empty, значит capacity=255. Сначала данные, затем индекс; иначе consumer может прочитать ещё не заполненный slot.

**Источник:** [Lesson 08, slides 5](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/08_UART_And_Python_Host/Slide.md).

### 32. D — lesson 08

**Ответ:** To serialize producers, prevent interleaved lines and protect non-reentrant printf state

Несколько tasks без сериализации — несколько writers head, что нарушает SPSC-предпосылку. say() делает вывод согласованным и защищает общее состояние newlib-nano.

**Источник:** [Lesson 08, slides 8, 9](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/08_UART_And_Python_Host/Slide.md).

### 33. A — lesson 08

**Ответ:** ESC may be the prefix of a multibyte key sequence

Один и тот же ESC начинает arrows/CSI и обозначает отдельную клавишу. Пока не пришёл следующий байт, их различает время. В коде key_timeout событие наступает при elapsed>50, а не ровно50.

**Источник:** [Lesson 08, slides 9b](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/08_UART_And_Python_Host/Slide.md).

## Как использовать результат

Каждая ошибка — повод вернуться к указанному слайду и объяснить механизм своими словами. Балл здесь — диагностика, не прогноз оценки. Повторяй вопросы после разбора без подсматривания.
