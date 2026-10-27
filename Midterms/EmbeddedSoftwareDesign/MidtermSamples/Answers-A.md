# SOC3050 — Answers and explanations A

Сначала реши [вариант A](Sample-A.md), затем проверь ответы. Это авторская тренировка по исходникам курса, а не прогноз реальных вопросов.

## Quick key

| Question | Answer | Lesson |
|---|---|---|
| 1 | A | 00 |
| 2 | B | 00 |
| 3 | A | 00 |
| 4 | A | 01 |
| 5 | A | 01 |
| 6 | D | 01 |
| 7 | D | 01 |
| 8 | C | 02 |
| 9 | A | 02 |
| 10 | D | 02 |
| 11 | B | 03 |
| 12 | A | 03 |
| 13 | B | 03 |
| 14 | B | 04 |
| 15 | D | 04 |
| 16 | A | 04 |
| 17 | D | 05 |
| 18 | D | 05 |
| 19 | A | 05 |
| 20 | B | 05 |
| 21 | D | 05 |
| 22 | C | 06 |
| 23 | B | 06 |
| 24 | C | 06 |
| 25 | C | 06 |
| 26 | B | 07 |
| 27 | A | 07 |
| 28 | C | 07 |
| 29 | C | 07 |
| 30 | C | 08 |
| 31 | D | 08 |
| 32 | B | 08 |
| 33 | C | 08 |

## Разбор

### 1. A — lesson 00

**Ответ:** A unified address space for code and data

У Cortex-M единая карта адресов: обычный load читает и RAM, и flash. Отдельные внутренние шины не создают отдельные пространства адресов.

**Источник:** [Lesson 00, slides 4, 5](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/00_Architecture/Slide.md).

### 2. B — lesson 00

**Ответ:** D4 C3 B2 A1

Little-endian: младший байт идёт по младшему адресу. Разбиваем слово на A1 B2 C3 D4 и записываем в обратном порядке.

**Источник:** [Lesson 00, slides 10](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/00_Architecture/Slide.md).

### 3. A — lesson 00

**Ответ:** MSP; the interrupted task hardware frame is placed on PSP

Контекст прерванной задачи аппаратно сохраняется на её PSP. Сам handler исполняется с MSP. Это разные действия при входе в исключение.

**Источник:** [Lesson 00, slides 8, 3b](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/00_Architecture/Slide.md).

### 4. A — lesson 01

**Ответ:** 3 instructions, 2 data accesses

LDR читает данные, ADDS работает внутри CPU, STR записывает данные. Больше инструкций не означает больше обращений к данным.

**Источник:** [Lesson 01, slides 4](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/01_Instruction_Set/Slide.md).

### 5. A — lesson 01

**Ответ:** BL overwrites LR with the return address from g

LR хранит один адрес возврата. Вложенный BL заменит его, поэтому non-leaf функция сохраняет свой старый LR, обычно в стеке.

**Источник:** [Lesson 01, slides 8, 18](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/01_Instruction_Set/Slide.md).

### 6. D — lesson 01

**Ответ:** BCC

BCC проверяет unsigned lower, то есть отсутствие carry при сравнении. BLT — signed less: для значений с установленным старшим битом результат может отличаться.

**Источник:** [Lesson 01, slides 7](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/01_Instruction_Set/Slide.md).

### 7. D — lesson 01

**Ответ:** 0x080004A1

В указателе обработчика установлен бит 0, Thumb: 0x080004A0 | 1. Адрес первой инструкции при этом остаётся чётным.

**Источник:** [Lesson 01, slides 19](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/01_Instruction_Set/Slide.md).

### 8. C — lesson 02

**Ответ:** table: flash; count: RAM; limit: RAM plus a flash initialiser

table попадает в .rodata, count — в .bss, limit — в .data. Только .data требует одновременно рабочую RAM и сохранённые начальные значения во flash.

**Источник:** [Lesson 02, slides 4, 5](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/02_Development/Slide.md).

### 9. A — lesson 02

**Ответ:** Linker: undefined reference to sensor_read

При отдельной компиляции вызов может остаться неразрешённым до link. Если определения нет, linker выдаёт undefined reference; multiple definition означает противоположную проблему.

**Источник:** [Lesson 02, slides 3](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/02_Development/Slide.md).

### 10. D — lesson 02

**Ответ:** 0x08000120

Type 04 задаёт старшие 16 бит: (0x0800 << 16) + 0x0120 = 0x08000120.

**Источник:** [Lesson 02, slides 7](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/02_Development/Slide.md).

### 11. B — lesson 03

**Ответ:** Volatile forces accesses but does not make read-modify-write atomic

Сам aligned load/store неделим, но ++ состоит из чтения, изменения и записи. ISR может вклиниться между ними; нужна короткая критическая секция.

**Источник:** [Lesson 03, slides 4, 5](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/03_Execution_Concurrency/Slide.md).

### 12. A — lesson 03

**Ответ:** No: a single aligned word load sees the old or new value

В условиях задачи один writer и одно выровненное машинное слово. Чтение не разрывается на половины. Volatile нужен для реальных чтений, но сам по себе не запрещает прерывания.

**Источник:** [Lesson 03, slides 7](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/03_Execution_Concurrency/Slide.md).

### 13. B — lesson 03

**Ответ:** It delays configurable interrupts and increases worst-case latency

Пока PRIMASK маскирует настраиваемые исключения, они не обслуживаются. NMI и HardFault этой маской не отключаются.

**Источник:** [Lesson 03, slides 5, 8](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/03_Execution_Concurrency/Slide.md).

### 14. B — lesson 04

**Ответ:** SP=0x20003000; handler=0x080004A0

Декодируем каждую четвёрку little-endian. Второе слово — 0x080004A1; убираем Thumb bit для адреса инструкции.

**Источник:** [Lesson 04, slides 5, 7](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/04_Startup_And_LinkerScript/Slide.md).

### 15. D — lesson 04

**Ответ:** The vector still selects Default_Handler and the board hangs there

Имена символов чувствительны к регистру. Неверное имя не заменяет weak alias; Default_Handler в этом репозитории — бесконечный цикл.

**Источник:** [Lesson 04, slides 8](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/04_Startup_And_LinkerScript/Slide.md).

### 16. A — lesson 04

**Ответ:** Increase flash wait states, then increase clock frequency

Сначала flash должна выдерживать будущую скорость. SystemCoreClock — программная переменная, а не команда переключения генератора.

**Источник:** [Lesson 04, slides 16](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/04_Startup_And_LinkerScript/Slide.md).

### 17. D — lesson 05

**Ответ:** Bits 13:12, value 01

MODER выделяет по два бита на pin: 2*6=12, значит 13:12. Коды: 00 input, 01 output, 10 AF, 11 analog.

**Источник:** [Lesson 05, slides 4, 5](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/05_GPIO_And_Interrupts/Slide.md).

### 18. D — lesson 05

**Ответ:** 0x00800004

Set PB2: 1<<2 = 0x4. Reset PB7: 1<<(7+16)=0x00800000. Объединяем OR.

**Источник:** [Lesson 05, slides 12](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/05_GPIO_And_Interrupts/Slide.md).

### 19. A — lesson 05

**Ответ:** AFR[1] bits 11:8

10/8=1, 10 mod 8=2; 4*2=8. Поле AFR[1] — 11:8. MODER отдельно должен выбирать AF mode.

**Источник:** [Lesson 05, slides 14](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/05_GPIO_And_Interrupts/Slide.md).

### 20. B — lesson 05

**Ответ:** EXTI->RPR1 = 1u << 1;

RPR1 — write-1-to-clear. Присваивание пишет 1 только в bit1. |= читает bit4=1 и записывает его обратно, тем самым также очищая необработанный bit4.

**Источник:** [Lesson 05, slides 25](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/05_GPIO_And_Interrupts/Slide.md).

### 21. D — lesson 05

**Ответ:** The pending event does not execute the handler until the IRQ can be serviced

В цепочке pin → EXTI → NVIC → vector нужны все разрешения. Наличие pending в EXTI ещё не доказывает, что handler может запуститься.

**Источник:** [Lesson 05, slides 23, 25, 26](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/05_GPIO_And_Interrupts/Slide.md).

### 22. C — lesson 06

**Ответ:** 95999

48 000 000 * 0.002 = 96 000 тактов. LOAD хранит ticks-1 = 95 999.

**Источник:** [Lesson 06, slides 2](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/06_Time_And_Timers/Slide.md).

### 23. B — lesson 06

**Ответ:** PSC=47, ARR=9999

Делитель 48 даёт 1 MHz, значит PSC=47. За 10 ms проходит 10 000 отсчётов: ARR=9999.

**Источник:** [Lesson 06, slides 5b](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/06_Time_And_Timers/Slide.md).

### 24. C — lesson 06

**Ответ:** 48 ms; yes

До нуля от FFFFFFF0 — 16, затем ещё 32: всего 48. Проверка 48>=40 истинна. Предполагается, что не прошло целое дополнительное переполнение.

**Источник:** [Lesson 06, slides 3](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/06_Time_And_Timers/Slide.md).

### 25. C — lesson 06

**Ответ:** TIM3->SR = ~TIM_SR_UIF;

Записываем 0 в UIF и 1 в остальные status flags. EXTI-стиль с записью 1 оставит UIF установленным и может вызвать бесконечный вход в ISR.

**Источник:** [Lesson 06, slides 7](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/06_Time_And_Timers/Slide.md).

### 26. B — lesson 07

**Ответ:** Return to Thread mode using PSP

FD — специальный код exception return, не обычный указатель. Он выбирает Thread mode и PSP; F9 выбирает Thread/MSP.

**Источник:** [Lesson 07, slides 3b, 5](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/07_RTOS/Slide.md).

### 27. A — lesson 07

**Ответ:** Kernel task 3 runs; NVIC priority 0 is most urgent

В учебном kernel большее число означает более срочную задачу. В NVIC ноль — самый срочный уровень. Это две независимые шкалы.

**Источник:** [Lesson 07, slides 9](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/07_RTOS/Slide.md).

### 28. C — lesson 07

**Ответ:** Temporarily raise Low to High's priority while High waits

Priority inheritance даёт владельцу mutex приоритет ожидающей High. Тогда Medium не задерживает освобождение ресурса; после unlock приоритет возвращается.

**Источник:** [Lesson 07, slides 13, 14](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/07_RTOS/Slide.md).

### 29. C — lesson 07

**Ответ:** Return 0 immediately

ISR API никогда не блокирует: full → 0. Handler должен учесть потерю или выбрать другую политику; task API в такой ситуации может блокировать задачу.

**Источник:** [Lesson 07, slides 15](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/07_RTOS/Slide.md).

### 30. C — lesson 08

**Ответ:** BRR=2500; 1920 bytes/s

BRR=48 000 000/19 200=2500. У 8N1 на байт 10 бит: start+8 data+stop, поэтому 19 200/10=1920 bytes/s.

**Источник:** [Lesson 08, slides 1b, 2](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/08_UART_And_Python_Host/Slide.md).

### 31. D — lesson 08

**Ответ:** Repeated UART interrupts starve lower-priority work

TXE означает свободный TDR, а свободный он и в idle. Если нечего отправлять, ISR должен выключить TXEIE; включить обратно можно при появлении данных.

**Источник:** [Lesson 08, slides 6](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/08_UART_And_Python_Host/Slide.md).

### 32. B — lesson 08

**Ответ:** $LED,2*53

4C^45=09; ^44=4D; ^2C=61; ^32=53. Символы $ и * в checksum не входят.

**Источник:** [Lesson 08, slides 10](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/08_UART_And_Python_Host/Slide.md).

### 33. C — lesson 08

**Ответ:** One Up-arrow key encoded as a three-byte escape sequence

Клавиши могут быть многобайтными. Декодер сохраняет состояние между байтами; ESC [ A — Up. Одиночный ESC отличают ожиданием таймаута.

**Источник:** [Lesson 08, slides 9b](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/08_UART_And_Python_Host/Slide.md).

## Как использовать результат

Каждая ошибка — повод вернуться к указанному слайду и объяснить механизм своими словами. Балл здесь — диагностика, не прогноз оценки. Повторяй вопросы после разбора без подсматривания.
