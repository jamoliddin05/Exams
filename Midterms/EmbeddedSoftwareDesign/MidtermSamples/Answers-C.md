# SOC3050 — Answers and explanations C

Сначала реши [вариант C](Sample-C.md), затем проверь ответы. Это авторская тренировка по исходникам курса, а не прогноз реальных вопросов.

## Quick key

| Question | Answer | Lesson |
|---|---|---|
| 1 | B | 00 |
| 2 | B | 00 |
| 3 | B | 00 |
| 4 | A | 01 |
| 5 | B | 01 |
| 6 | A | 01 |
| 7 | A | 01 |
| 8 | C | 02 |
| 9 | C | 02 |
| 10 | D | 02 |
| 11 | D | 03 |
| 12 | A | 03 |
| 13 | C | 03 |
| 14 | A | 04 |
| 15 | A | 04 |
| 16 | B | 04 |
| 17 | D | 05 |
| 18 | C | 05 |
| 19 | B | 05 |
| 20 | D | 05 |
| 21 | B | 05 |
| 22 | A | 06 |
| 23 | D | 06 |
| 24 | D | 06 |
| 25 | C | 06 |
| 26 | A | 07 |
| 27 | D | 07 |
| 28 | B | 07 |
| 29 | C | 07 |
| 30 | D | 08 |
| 31 | C | 08 |
| 32 | C | 08 |
| 33 | A | 08 |

## Разбор

### 1. B — lesson 00

**Ответ:** Enable its RCC peripheral clock gate

Без clock gate периферия в модели курса не отвечает на конфигурацию. Сначала clock, потом configure, потом use. Clean build не доказывает работу hardware.

**Источник:** [Lesson 00, slides 5, 11](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/00_Architecture/Slide.md).

### 2. B — lesson 00

**Ответ:** 44

Первые16 vector slots принадлежат core. Exception/vector number =16+IRQ=44=0x2C. IRQ number и exception number не одно и то же.

**Источник:** [Lesson 00, slides 3b, 9](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/00_Architecture/Slide.md).

### 3. B — lesson 00

**Ответ:** Tasks share a physical address space without an MMU providing private virtual maps

Отдельные стеки не создают отдельные address spaces. Без настроенной аппаратной защиты ошибочная запись в существующую RAM может повредить соседа; unmapped адрес может fault.

**Источник:** [Lesson 00, slides 8](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/00_Architecture/Slide.md).

### 4. A — lesson 01

**Ответ:** BLT is taken; BCC is not taken

Signed: FFFFFFFF=-1, и -1<1. Unsigned:4294967295>1. Поэтому signed BLT и unsigned BCC расходятся.

**Источник:** [Lesson 01, slides 7](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/01_Instruction_Set/Slide.md).

### 5. B — lesson 01

**Ответ:** r4; r0 is caller-saved and may carry the result

r0-r3 и r12 — scratch/caller-saved; r4-r11 — callee-saved в соглашении курса. Возврат обычного 32-битного результата происходит через r0.

**Источник:** [Lesson 01, slides 18](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/01_Instruction_Set/Slide.md).

### 6. A — lesson 01

**Ответ:** Read a 32-bit constant from a nearby literal pool

Полная 32-битная константа не помещается в 16-битную instruction. Literal pool хранит слово рядом с кодом; PC-relative load достаёт его.

**Источник:** [Lesson 01, slides 9, 12](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/01_Instruction_Set/Slide.md).

### 7. A — lesson 01

**Ответ:** LR=0x08000125; return instruction at 0x08000124

Следующая instruction начинается после4 байт:124. LR содержит next|1=125. BX использует bit0 как Thumb-признак, а адресом становится124.

**Источник:** [Lesson 01, slides 8, 20](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/01_Instruction_Set/Slide.md).

### 8. C — lesson 02

**Ответ:** A multiple-definition link error

Две внешние strong definitions одного символа конфликтуют. Weak/strong override — другой, явно объявленный механизм.

**Источник:** [Lesson 02, slides 3](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/02_Development/Slide.md).

### 9. C — lesson 02

**Ответ:** Its promised zero initial value is no longer guaranteed

В bare-metal исполнении обещание C обеспечивает startup. RAM может сохранить старое содержимое или иметь случайное; наблюдаемое0 на одном старте не исправляет bug.

**Источник:** [Lesson 02, slides 5, 8](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/02_Development/Slide.md).

### 10. D — lesson 02

**Ответ:** Preprocess, compile, assemble, link/locate; then the simulator executes the image

Симуляторы исполняют готовую firmware. Получение .o и размещение sections — задача toolchain; ни Wokwi, ни Renode не заменяет эти build stages.

**Источник:** [Lesson 02, slides 1, 7, 9](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/02_Development/Slide.md).

### 11. D — lesson 03

**Ответ:** Polling checks readiness; an interrupt invokes a handler; DMA transfers data without a CPU instruction per item

DMA требует настройки и обработки завершения, но убирает CPU из переноса каждого элемента. Ни interrupts, ни polling не дают бесконечный буфер или гарантию при любой нагрузке.

**Источник:** [Lesson 03, slides 1](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/03_Execution_Concurrency/Slide.md).

### 12. A — lesson 03

**Ответ:** PRIMASK affects local interrupt handling, not execution on the other core

Masking даёт исключение конкурента на одном core. Другой core продолжает работу; нужны подходящие межъядерные atomics/locks. Сам учебный M0+ — single-core.

**Источник:** [Lesson 03, slides 5](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/03_Execution_Concurrency/Slide.md).

### 13. C — lesson 03

**Ответ:** Restore the saved PRIMASK value

enter/leave в os.c сохраняет старую маску. Безусловный enable из внутренней секции преждевременно нарушил бы защиту внешней. Для simple snippets с парой disable/enable предполагается известное исходное состояние.

**Источник:** [Lesson 03, slides 5](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/03_Execution_Concurrency/Slide.md).

### 14. A — lesson 04

**Ответ:** Its strong symbol overrides the weak symbol during linking

Замена происходит у linker, который заполняет таблицу адресом strong definition. NVIC не знает ни C, ни имён функций.

**Источник:** [Lesson 04, slides 6, 8](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/04_Startup_And_LinkerScript/Slide.md).

### 15. A — lesson 04

**Ответ:** Run-time address in RAM, load image stored in flash

VMA — рабочий RAM address; LMA — flash address исходного образа. Startup копирует между ними. Это не desktop virtual memory.

**Источник:** [Lesson 04, slides 10, 14](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/04_Startup_And_LinkerScript/Slide.md).

### 16. B — lesson 04

**Ответ:** _write

В этой newlib-среде printf вызывает _write. Сначала он polled, в lesson08 заменяется strong buffered implementation. Также нужно проверить UART init и _sbrk.

**Источник:** [Lesson 04, slides 4c, 17](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/04_Startup_And_LinkerScript/Slide.md).

### 17. D — lesson 05

**Ответ:** 11 (analog)

OR не очищает единицы:11|01=11. Сначала AND с инверсной2-битной маской, потом OR нового кода. Остальные поля нужно сохранить.

**Источник:** [Lesson 05, slides 5, 15](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/05_GPIO_And_Interrupts/Slide.md).

### 18. C — lesson 05

**Ответ:** PA2 and PB2

У line2 один port-select: она выбирает pin2 только одного порта. Разные номера pins используют разные линии; общий handler сам по себе не запрещает несколько линий.

**Источник:** [Lesson 05, slides 24](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/05_GPIO_And_Interrupts/Slide.md).

### 19. B — lesson 05

**Ответ:** 0x0800008C

Vector=16+19=35. Смещение=35*4=140=0x8C. Таблица хранит адрес handler, а вычисленное значение — адрес самого vector word.

**Источник:** [Lesson 05, slides 27](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/05_GPIO_And_Interrupts/Slide.md).

### 20. D — lesson 05

**Ответ:** No; bit 3 is 1, so the active-low button is released

0x8=1<<3 → pin high. Кнопка active-low: pressed означает0. IDR даёт уровень, MODER задаёт режим.

**Источник:** [Lesson 05, slides 9, 10, 19](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/05_GPIO_And_Interrupts/Slide.md).

### 21. B — lesson 05

**Ответ:** Clear pending flags, record edges, return; decide stable state outside the ISR

Handler должен быть коротким. Debounce ждёт20 ms тишины в main/task; ожидание в ISR задержит равные и менее срочные interrupts.

**Источник:** [Lesson 05, slides 29, 31](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/05_GPIO_And_Interrupts/Slide.md).

### 22. A — lesson 06

**Ответ:** It keeps future deadlines on the original time grid

+=period не переносит всю сетку вслед за разовым опозданием. Сам пропущенный deadline это не отменяет; долгий job по-прежнему задерживает superloop.

**Источник:** [Lesson 06, slides 4](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/06_Time_And_Timers/Slide.md).

### 23. D — lesson 06

**Ответ:** 100 Hz and 2.5 ms

Counter=48 MHz/480=100 kHz →10 us/count. Period=1000*10 us=10 ms →100 Hz. High=250*10 us=2.5 ms.

**Источник:** [Lesson 06, slides 5b, 8](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/06_Time_And_Timers/Slide.md).

### 24. D — lesson 06

**Ответ:** Wrong alternate-function selection or a disabled channel output

Работающий counter не гарантирует связь channel→pin. Проверяем CCER.CC1E, MODER=AF, AFR и wiring. Аналогично отсутствие capture в Wokwi — ограничение модели, не доказательство неверной формулы.

**Источник:** [Lesson 06, slides 10, 12, 13b](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/06_Time_And_Timers/Slide.md).

### 25. C — lesson 06

**Ответ:** Hardware latches CNT at the edge before ISR latency occurs

ISR читает уже сохранённый CCR timestamp. При EXTI счётчик читается позже на величину latency; различная задержка двух edges искажает width. Capture всё равно нужно прочесть до overwrite.

**Источник:** [Lesson 06, slides 12, 13](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/06_Time_And_Timers/Slide.md).

### 26. A — lesson 07

**Ответ:** 0x01000000

У xPSR T расположен в bit24:1<<24=0x01000000. Это не bit0 function pointer; при exception return состояние Thumb восстанавливается из frame.

**Источник:** [Lesson 07, slides 8](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/07_RTOS/Slide.md).

### 27. D — lesson 07

**Ответ:** Round-robin time slicing among equals

pick начинает поиск после current и заменяет best только строго большим priority. Поэтому равные highest READY tasks чередуются; low priorities могут ждать.

**Источник:** [Lesson 07, slides 9, 10](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/07_RTOS/Slide.md).

### 28. B — lesson 07

**Ответ:** Mutex: BLOCKED; delay: SLEEPING

В модели kernel BLOCKED означает ожидание объекта, SLEEPING — ожидание wake time. Обе задачи пока не используют CPU; running обозначается current среди READY.

**Источник:** [Lesson 07, slides 10, 12](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/07_RTOS/Slide.md).

### 29. C — lesson 07

**Ответ:** Index 6; PSP when bit 2 is 1, otherwise MSP

Порядок hardware frame:r0,r1,r2,r3,r12,lr,pc,xPSR. PC — index6. LR исключения определяет стек frame; addr2line затем связывает PC со строкой исходника.

**Источник:** [Lesson 07, slides 18](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/07_RTOS/Slide.md).

### 30. D — lesson 08

**Ответ:** 100 microseconds per byte; about 6.4 ms for 64 bytes

8N1=10 bits/byte.10/100000=100 us;64*100 us=6.4 ms. ISR всё равно должен вовремя снимать каждый hardware byte; queue лишь даёт task запас.

**Источник:** [Lesson 08, slides 2, 3](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/08_UART_And_Python_Host/Slide.md).

### 31. C — lesson 08

**Ответ:** The two XOR changes cancel and the corrupted body passes this checksum

XOR дельта равна01^01=00. Checksum обнаруживает любой одиночный bit flip, но не все комбинации ошибок; он не восстанавливает данные.

**Источник:** [Lesson 08, slides 10](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/08_UART_And_Python_Host/Slide.md).

### 32. C — lesson 08

**Ответ:** To avoid treating echoed commands as received frames and mixing telemetry into partial shell lines

На одной UART-линии сосуществуют shell и framed protocol. Эхо $frame могло бы выглядеть как ответ board, а telemetry посреди набираемой строки разрушила бы разметку.

**Источник:** [Lesson 08, slides 9, 9b](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/08_UART_And_Python_Host/Slide.md).

### 33. A — lesson 08

**Ответ:** Two sequence numbers are missing; it does not identify the physical cause

13-10-1=2: отсутствуют11 и12. Sequence gaps показывают недоставленные валидные frames, но не различают повреждение, drop, disconnect и другие причины.

**Источник:** [Lesson 08, slides 12, 13](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/08_UART_And_Python_Host/Slide.md).

## Как использовать результат

Каждая ошибка — повод вернуться к указанному слайду и объяснить механизм своими словами. Балл здесь — диагностика, не прогноз оценки. Повторяй вопросы после разбора без подсматривания.
