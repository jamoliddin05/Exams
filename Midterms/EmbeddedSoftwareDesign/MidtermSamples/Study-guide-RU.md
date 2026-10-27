# SOC3050: подготовка к ARM midterm

Формат и охват ARM midterm Fall 2026 взяты из [официального overview](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/exam_midterm/overview.md), snapshot `7906b2fdc7895f9656402033bb5af66f5fd3eee8` от 27 октября.

**60 минут, 33 MCQ, четыре варианта, один ответ, по одному баллу.** Лекции 00–08; 09 и далее исключены. Примерно 2–5 вопросов от каждой лекции. Closed book: без калькулятора, заметок и электроники. Синяя/чёрная нестираемая ручка. На каждой странице имя заглавными буквами, ID и правильный section number. Проверяют answer sheet на обложке. За неверные ответы штрафа нет: отвечай на всё.

Это самостоятельный конспект и объяснение механизмов. Формулировки ниже не являются официальными экзаменационными ответами. Варианты A–C — новые тренировочные задания по источникам, а не прошлогодние работы.

## 00. Programmer's model

Источник: [лекция 00](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/00_Architecture/Slide.md), slides 1–17.

Модель программиста — видимое состояние и контракт поведения, а не устройство silicon. Пять частей: **registers, memory, peripheral registers, modes/stacks, exceptions**. Pipeline и bus matrix относятся к реализации, хотя их последствия иногда видны.

| Что | Что нужно понимать |
|---|---|
| R0–R3 | первые четыре аргумента, scratch; обычный 32-bit result в R0 |
| R4–R11 | callee-saved в соглашении курса |
| R12 | scratch |
| R13/SP | выбранный stack pointer: MSP или PSP |
| R14/LR | адрес возврата; в handler — специальный EXC_RETURN |
| R15/PC | управление потоком инструкций |
| xPSR | APSR: N/Z/C/V в bits31:28; EPSR: T в bit24; IPSR: exception number |
| PRIMASK | bit0=1 маскирует configurable exceptions; NMI/HardFault остаются |
| CONTROL | bit1 SPSEL выбирает stack Thread mode; bit0 nPRIV задаёт privilege |

Special registers читаются/пишутся через **MRS/MSR**, а не через обычный memory address. **BASEPRI и FAULTMASK на M0+ нет.**

Cortex-M — **memory-mapped I/O**: обычный LDR/STR работает с peripheral registers. x86 IN/OUT — пример isolated/port-mapped I/O. В AVR есть IN/OUT и также aliases I/O в data space: сравнение курса упрощено до характерного способа доступа.

**Unified address space:** и код, и данные видны в одной карте, поэтому `const` во flash читается обычным load. В Harvard code/data имеют отдельные пространства, как в учебном сравнении с AVR/PROGMEM/LPM. Наличие нескольких физических buses само по себе не меняет programmer-visible карту.

| Область учебной платы | Адрес / объём |
|---|---|
| Flash | 32 KiB, `0x08000000`–`0x08007FFF`; при обычном flash boot alias с нуля |
| SRAM | 12 KiB, `0x20000000`–`0x20002FFF` |
| Начальный верх стека | `0x20003000`, stack растёт вниз |
| GPIOA / GPIOB | `0x50000000` / `0x50000400` |
| ST peripherals | в основном область `0x400...` |
| NVIC, SysTick, SCB | core ARM, область `0xE000...` |

Адресное пространство 4 GiB **не означает** 4 GiB физической памяти. Unmapped доступ может fault. Неверный указатель в существующую RAM или peripheral register может что-то испортить молча: MMU и отдельных virtual address spaces у задач здесь нет. Отдельный стек задачи не изолирует всю её память.

Peripheral register — hardware с побочными эффектами: два чтения могут различаться, чтение может снять флаг, запись — изменить вывод. Обобщённые роли: **control** (configure), **status** (what happened), **data** (payload). Пример USART: CR1 / ISR / RDR,TDR.

Проверять два условия: **clock gate** открыт и **pin mux** выбирает нужный сигнал. Если clock не включён, в модели курса writes не действуют, reads дают0. Если неверный AF, peripheral может работать внутри, но pin молчит. Неверная частота → неверный baud/delay.

**32-bit word, natural alignment, little-endian.** Word load по адресу, некратному4, на настоящем M0+ вызывает HardFault. M3/M4 допускает некоторые unaligned loads/stores, с ограничениями; это не общее разрешение для любых инструкций и периферии.

`0x12345678` → по возрастанию адресов **78 56 34 12**. Network byte order — big-endian. Размер `uint8_t` экономит место в массиве, но вычисление с ним не обязательно дешевле машинного слова.

Thread mode исполняет main/tasks, Handler mode — exceptions. Handler всегда использует **MSP**. Если прервана task на PSP, её hardware frame сначала попадает на **PSP**, после чего handler работает с MSP. Привилегии и выбор стека — разные оси.

Vectored dispatch: hardware индексирует table. Cortex-M entries — **адреса**, а не AVR jump instructions. Slot0 — initial SP, slot1 — reset vector, внешние IRQ начинаются с slot16.

Три утечки реализации: pipeline (branch costs/PC semantics), разные buses и clock gates, медленная flash. **Flash wait states повышаются до повышения frequency; снижаются после понижения frequency.**

Проверь себя: почему указатель на flash-константу не требует особой инструкции? Чем peripheral register отличается от RAM? На каком стеке frame и на каком исполняется handler?

## 01. Instruction set

Источник: [лекция 01](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/01_Instruction_Set/Slide.md), slides 1–22.

Cortex-M исполняет только **Thumb**, ARM/A32 state у него нет. M0+ — ARMv6-M, обычно 16-bit instructions, плюс шесть 32-bit: **BL, MRS, MSR, DSB, DMB, ISB**. M3/M4 имеет более богатый Thumb-2. Code density — причина сжатых encodings; «32-битный CPU» не означает «каждая instruction 32-bit».

**Load–store:** арифметика работает с registers. `counter++` по RAM: LDR → ADDS → STR. Три инструкции, но **два data accesses**; instruction fetches здесь отдельно. На register–memory x86 одна instruction может выразить тот же RMW. Она не обязательно атомарна между cores без соответствующего механизма.

| Mnemonic | Смысл |
|---|---|
| MOVS | immediate/register → register, само по себе не memory load |
| LDR/STR | 32-bit read/write |
| LDRB/STRB; LDRH/STRH | byte / halfword |
| LDRSH | halfword с sign extension |
| ADDS/SUBS/MULS | арифметика; `s` обозначает flags update |
| ANDS/ORRS/EORS | AND/OR/XOR |
| BICS | `x &= ~mask` |
| LSLS | сдвиг влево, в пределах ширины биты теряются |
| LSRS / ASRS | сдвиг вправо с нулями / с сохранением знака |
| CMP / TST | subtraction / AND для flags без сохранения результата |
| B / BEQ / BNE | jump / equal / not equal |
| BL / BX LR | call с записью LR / return |
| PUSH / POP | сохранить / восстановить registers; `pop {...,pc}` ещё и возвращает |

**Signed и unsigned branches различаются:** BLT/BGE — signed, BCC/BCS — unsigned lower/higher-or-same. CMP вычисляет flags; затем branch их читает. Между ними нельзя случайно испортить flags. N — negative, Z — zero, C — carry/no-borrow для subtraction, V — signed overflow. Для signed less важны N и V, а не только N. RISC-V compare-and-branch объединяет сравнение и переход без condition flags.

Пример: FFFFFFFF и1 → signed `-1<1` истинно, unsigned `4294967295<1` ложно. ASRS `-8>>1` даёт-4; ASR отрицательного нечётного числа округляет вниз и не совпадает с C signed division, которая округляет к нулю.

**Нет hardware divide/FPU на M0+.** Неконстантное `/` может вызывать `__aeabi_uidiv`; константное деление compiler иногда заменяет другими инструкциями. Нельзя заключать «любой `/` обязательно вызывает helper».

| Addressing mode | Пример | Смысл |
|---|---|---|
| register | `[r1]` | `*p` |
| immediate offset | `[r4,#28]` | `s->field` |
| register offset | `[r1,r3]` | `buf[i]` |
| SP-relative | `[sp,#8]` | stack local |
| PC-relative | `[pc,#offset]` | literal pool |

Для narrow immediate loads пределы: word offset **0..124 шаг4**, halfword0..62 шаг2, byte0..31; SP-relative word0..1020 шаг4. Большое поле структуры может требовать расчёта base отдельно. Scaled index, pre/post-indexed формы из M3 tutorial нельзя автоматически переносить на M0+.

Большой адрес вроде `0x40021000` часто находится в **literal pool** рядом с кодом: 32-bit immediate нельзя целиком вписать в 16-bit instruction. `LDR [PC,...]` читает готовое слово; RISC-V может строить constant частями LUI+ADDI.

**AAPCS:** caller сохраняет нужные scratch registers; callee восстанавливает r4–r11, если использовал их. BL сам не кладёт return на stack: он записывает **LR**. Leaf function может вернуть `bx lr` без сохранения LR; non-leaf сохраняет старый LR до нового BL.

Если BL стоит в `0x08000120`, он занимает4 bytes. Следующая instruction124; LR=125, потому что Thumb bit. При `bx lr` target124. Odd function pointer не означает, что CPU начинает со второго byte.

**Не путай три Thumb-представления:** function pointer/vector `address|1`; реальный instruction PC чётный; xPSR.T находится в **bit24**. В fabricated exception frame PC в коде курса чётный, Thumb задаёт xPSR.T.

Compiler может inline/hoist/reorder обычные вычисления, поэтому source order не совпадает с disassembly address order. CMSIS registers объявлены volatile. Но volatile не означает выключенную оптимизацию всего кода, global memory barrier или lock.

## 02. Development

Источник: [лекция 02](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/02_Development/Slide.md), slides 1–10.

Build: **preprocess → compile → assemble → link → locate**. Последние два часто выполняет один linker: разрешить символы и разместить sections по реальным адресам. Bare-metal **build-time address binding** задаётся linker script; desktop loader/MMU позволяют поздние формы binding.

Каждый `.c` компилируется отдельно. `extern` declaration не создаёт definition. Нет определения → **undefined reference**. Две ordinary external strong definitions → **multiple definition**. Static функции в разных files имеют локальную linkage и не тот же конфликт.

| Section | Содержимое | Flash | RAM |
|---|---|---|---|
| .isr_vector | vectors | да | нет |
| .text | code | да | нет |
| .rodata | сохранённые const/string literals | да | нет |
| .data | writable globals с initial values | да: initial image | да: working values |
| .bss | zero-initialised globals | нет payload zeros | да |
| stack/heap | dynamic execution data | обычно нет | да |

Это модель конкретной сборки, при условии что объект не оптимизирован полностью. `int x=0` обычно всё равно .bss. Статическое хранилище определяется storage duration, не тем, что переменная непременно написана вне function.

Пример без padding: text900+rodata100+data40 → **flash1040**. data40+bss60+heap/stack200 → **RAM300**. Нельзя забыть flash-копию `.data`.

ELF — code, sections, addresses, symbols, debug info; BIN — raw bytes; HEX — bytes/address records в тексте. В Intel HEX `:LLAAAATT...CC`: LL byte count, AAAA offset, TT type, CC checksum. Type00=data,01=EOF,04=extended linear address. Upper0800 + offset0120 → `(0x0800<<16)+0x0120 = 0x08000120`.

Reset hardware читает SP и reset target, затем startup создаёт среду C. Пропущенное zeroing .bss не гарантирует конкретный мусор: RAM может случайно содержать0. Поэтому разовый успешный старт ничего не доказывает.

**Wokwi/Renode исполняют firmware, не компилируют C.** Wokwi показывает circuit, Renode удобен для code/register/serial tests. Результаты simulator могут отличаться от silicon, если peripheral не смоделирован.

## 03. Execution and concurrency

Источник: [лекция 03](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/03_Execution_Concurrency/Slide.md), slides 1–10.

Polling многократно спрашивает ready; interrupt вызывает handler по событию; DMA переносит поток hardware без CPU instruction на каждый элемент. Polling подходит для очень короткого ожидания, когда interrupt overhead дороже. ISR подходит для своевременной реакции. DMA всё равно требует setup, буферов и завершения.

Exception entry сохраняет hardware frame: **r0,r1,r2,r3,r12,lr,pc,xPSR**, восемь32-bit words =32 bytes (без возможного alignment padding). CPU пишет IPSR и EXC_RETURN в LR, берёт handler из table. Поэтому обычный C handler допустим: compiler сохраняет используемые callee-saved registers, hardware уже сохранило caller-saved context.

**Две разные опасности:**

1. Compiler не делает повторное чтение shared/hardware object → volatile.
2. Другой context вмешивается между read и write → synchronization/critical section.

`volatile` не делает `counter++` атомарным. Trace: main читает5; ISR читает5, пишет6; main из старого5 пишет6. Два increments дали6 вместо7.

**Race** — результат зависит от interleaving; **critical section** — область, требующая indivisibility; **mutual exclusion** — не более одного context внутри; **atomic** — нет наблюдаемого промежуточного состояния; **tearing** — логическое значение собрано из несовместимых частей.

| Shared situation | Что требуется в условиях single-core курса |
|---|---|
| Один ISR пишет aligned uint32_t, main только читает | volatile, для одного word read masking не нужен |
| Оба делают ++ | короткая защита всего RMW |
| ISR пишет uint64_t, main читает | snapshot под защитой: два32-bit accesses могут разорваться |
| ISR пишет два связанных поля | защита согласованного чтения всей пары |
| ISR set flag, main test+clear | отдельно рассмотреть потерю события между test и clear |

Даже plain store flag=0 не всегда RMW; основная опасность **всей последовательности test-and-clear**, а не само название операции. Boolean flag также сливает несколько одинаковых событий, если нужна точная кратность — нужен counter/queue.

PRIMASK masking работает против configurable ISR на **этом core**. Не защищает от второго core, DMA, NMI/HardFault. В reusable/nested critical section сохраняй прежний PRIMASK и восстанавливай его; безусловный enable из вложенной секции опасен. В simple snippets курса исходные interrupts предполагаются включёнными.

NVIC: **4 приоритета, 0 самый срочный, 3 наименее**. Реализованы верхние2 бита priority byte: encoded=`prio<<6`. Более срочный IRQ может прервать handler, равный не прерывает. При одновременных равных pending побеждает меньший exception/IRQ number. Короткий handler уменьшает задержки остальных.

## 04. Startup and linker script

Источник: [лекция 04](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/04_Startup_And_LinkerScript/Slide.md), slides 1–21; [startup.c](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/04_Startup_And_LinkerScript/startup.c), [link.ld](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/04_Startup_And_LinkerScript/link.ld).

`link.ld` отвечает **где**, `startup.c` — **что запускается первым**. Vector array должен находиться в начале flash при принятой reset mapping. `section(".isr_vector")` создаёт выделенную section; `used` удерживает её на compiler stage; **KEEP** в linker script удерживает на link GC stage. Это связанные, но разные механизмы.

**При старте:** hardware: vector0→SP, vector1→reset target. Software: copy .data flash→RAM → zero .bss → SystemInit → __libc_init_array → main → защитный infinite loop, если main вернулся.

`&_sidata` — flash source; `&_sdata..&_edata` — RAM destination; `&_sbss..&_ebss` — RAM zero region. Linker symbols не переменные, содержащие адрес. В принятом extern declaration нужен **&symbol**. `.data >RAM AT>FLASH` означает RAM VMA и flash LMA, `LOADADDR(.data)` даёт LMA; точка `.` — location counter.

Vector external IRQ n: **slot=16+n; address=table_base+4*(16+n)**. Для n19:35*4=140=8C →0800008C. Это адрес записи в таблице, а не handler address внутри записи. Core slots: reset1, NMI2, HardFault3, SVC11, PendSV14, SysTick15.

Weak aliases указывают на Default_Handler. Правильная ordinary/strong функция **точно с тем же именем** заменяет weak на этапе link. Typo может собрать firmware без warnings, но первый IRQ уйдёт в infinite loop. `nm`: T обычно ваш text symbol, W weak; полезно проверить и фактический vector.

CMSIS в курсе — core/device headers со структурами/адресами, не linked ST HAL. Inline helpers вроде SysTick_Config определены в headers. `GPIOA->ODR` — base+offset, а не дорогостоящий driver call.

48 MHz clock: chip reset =HSI48/4=12 MHz. Сначала FLASH wait state1 и проверка, затем HSIDIV для/1, ready и SystemCoreClock=48000000. Простое присваивание SystemCoreClock само hardware не меняет.

printf→**_write**→USART. Первоначальный `_write` poll TXE и пишет TDR; lesson08 заменяет strong buffered version поверх weak retarget. `_sbrk` выдаёт heap newlib/malloc, его ошибка тоже может сделать printf молча неработающим.

Если `.isr_vector` после `.text`, HEX может иметь правильные checksums и всё равно не boot: hardware примет instruction bytes за SP/target. Если объявить в script больше RAM, чем реально есть, linker не проверит datasheet за тебя.

## 05. GPIO and interrupts

Источник: [лекция 05](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/05_GPIO_And_Interrupts/Slide.md), slides 1–34, включая33b.

**Pin n: один бит, два бита или четыре бита.**

| Register | Где pin n | Что значит |
|---|---|---|
| MODER | bits2n+1:2n | 00 input,01 output,10 AF,11 analog |
| OTYPER | bit n | 0 push-pull,1 open-drain |
| OSPEEDR | bits2n+1:2n | edge slew rate, не software toggle frequency |
| PUPDR | bits2n+1:2n | 00 none,01 up,10 down,11 reserved |
| IDR/ODR | bit n | actual input / commanded output level |
| AFR[n/8] | bits4(n mod8)+3:4(n mod8) | AF number из datasheet для этого pin |
| BSRR | bit n / bit n+16 | set / reset;0=не трогать |
| BRR | bit n | reset only |

Offsets от port base: MODER00, OTYPER04, OSPEEDR08, PUPDR0C, IDR10, ODR14, BSRR18, LCKR1C, AFR[0]20, AFR[1]24, BRR28. Если offset нужен для расчёта, в экзамене его дадут — не подменяй понимание зубрёжкой адресов.

Reset GPIOA MODER=`EBFFFFFF`: всё analog, кроме PA13/PA14 (SWD, AF). Analog input buffer выключен: IDR в модели курса0, active-low button выглядит постоянно нажатой. Input mode надо **выставить явно**. PUPDR reset24000000: pulls для debug lines, прочие pins float.

Clear-then-set field: `reg=(reg & ~(mask<<shift)) | (value<<shift)`. Для PA4 output: shift8,mask3; EBFFFFFF &FFFFFCFF=EBFFFCFF; OR100 → **EBFFFDFF**. Только OR не переводит11→01; прямое `reg=value` затирает чужие pins.

BSRR: одновременно PB2 high и PB7 low → **00800004**. Это один store, без stale read. `ODR |= mask` — RMW и может потерять изменение ISR. `BSRR |=...` не нужен: write-only register используют присваиванием.

Для LED bar8 bits `leds`: `((uint32_t)(uint8_t)~leds<<16)|leds`. Cast к8 битам ограничивает reset-mask PB0..7; PB8..15 не трогаются. ARM LED bar в схеме active-high, старый AVR bar active-low: не переносить convention между editions.

Push-pull активно high/low; open-drain тянет low либо отпускает, high обеспечивает pull-up. Общая open-drain линия — wired-AND: high лишь если отпустили все. Два push-pull outputs с противоположными уровнями конфликтуют.

Кнопка на GND + pull-up: released1, pressed0. IDR показывает фактический уровень, ODR — заданный output; это не всегда одно и то же при внешней нагрузке.

**Debounce:** механический press даёт много transitions. Poll1 kHz пропускает быстрые bounces между samples, то есть фильтрует, но также зависит от длительности loop. При изменении raw held=0; одинаковые последующие samples увеличивают held;20 quiet ms дают accept. Для interrupt-path ISR считает edges, main ждёт20 ms без новых edges и проверяет финальный pin level.

**Цепочка:** pin → EXTICR port mux → EXTI edge/pending/mask → NVIC → vector → handler.

- C0: `EXTI->EXTICR[n/4]`, **один byte на line**, shift=`8*(n%4)`. Port code в младших3 bits: A0,B1,C2,D3,F5. Не путать с4-bit spacing STM32F4.
- Line n выбирает pin n только одного port. PA2/PB2 одновременно через EXTI не обслужить. PA2/PB3 можно, даже если часть линий разделяет handler.
- RTSR1 rising; FTSR1 falling; RPR1/FPR1 separate pending; IMR1 bit1 означает unmask.
- Pending clear: **write1**, `EXTI->RPR1 = mask;`. `|=` случайно очистит и другие pending1.
- Configure edges → clear stale pending → unmask. Нужны также NVIC enable и PRIMASK=0.
- IRQ5: lines0–1; IRQ6:2–3; IRQ7:4–15. Shared handler смотрит pending flags.
- ISER write1 enables,0 ничего не меняет; ICER disable; ISPR pend; ICPR clear pending. Отдельный NVIC pending не заменяет acknowledge peripheral source.
- IPR[n/4], byte n%4; encoded byte=`prio<<6`. IRQ6 priority1: IPR[1], byte2, contribution00400000.

Не снятый EXTI pending → re-entry loop после каждого return. Handler typo → один вход в Default_Handler infinite loop. Внешне оба «freeze», причины различны.

Debugger33b: latch кнопку Ctrl-click, break на принятии stable state, а не на каждом poll; SWIER1 имитирует EXTI edge; NVIC ISPR пускает IRQ без EXTI flag, поэтому handler может войти, ничего не посчитать и корректно вернуться.

## 06. Time and timers

Источник: [лекция 06](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/06_Time_And_Timers/Slide.md), slides 1–18, включая13b.

SysTick —24-bit **downcounter**: CTRL ENABLE0/TICKINT1/CLKSOURCE2/COUNTFLAG16; LOAD=ticks−1, VAL текущий count (write clears), CALIB read-only. CMSIS SysTick_Config при core48 MHz и1000 Hz даёт LOAD47999, CTRL7, priority3. Для2 ms LOAD95999. Max period2^24/48e6≈349.5 ms. Нельзя записать 24-bit overflow и ждать корректного периода.

COUNTFLAG — лишь «хотя бы один wrap», не счётчик пропущенных ms. ISR `ms_ticks++` считает ticks при своевременном обслуживании; handler **не требует** отдельного peripheral flag clear. Долгое masking/долгий более срочный ISR может слить несколько ticks в один pending — фраза «interrupt считает всегда» имеет эту предпосылку.

`uint32_t millis` wrap≈49.7 days. **Unsigned `now-start>=period`** работает через wrap, пока реальный interval не неоднозначен из-за полного дополнительного оборота. Absolute `now>=start+period` может сработать рано. Signed deadline idiom kernel `(int32_t)(now-wake)>=0` требует горизонта менее2^31 ticks.

Superloop `last+=period` сохраняет исходную сетку; `last=now` накапливает lateness. Это не устраняет missed deadlines и не прерывает CPU hog. RTOS `os_delay_until` — аналог fixed grid.

**Timer formulas (timer input clock, не автоматически любой CPU clock):**

```
f_counter = f_timer / (PSC+1)
f_update  = f_timer / ((PSC+1)*(ARR+1))
T_update  = (PSC+1)*(ARR+1)/f_timer
T_high    = CCR1/f_counter       // active-high PWM mode 1
Duty      = CCR1/(ARR+1)         // для CCR1 в нормальном диапазоне
```

48 MHz →1 MHz: PSC47;20 ms: ARR19999; CCR1500→1.5 ms, duty7.5%. Если PSC479: counter100 kHz, tick10 us; ARR999→100 Hz, CCR250→2.5 ms. Ошибка +1 не всегда «ровно2%»: зависит от величин.

Registers: PSC divider, ARR reload, CNT live count; CR1.CEN run, ARPE ARR preload; EGR.UG forced update; DIER UIE/CC1IE enables; SR UIF/CC1IF flags; CCMR1 output/capture mode; CCER channel enable/polarity; CCR1 compare/capture value.

PSC buffered всегда; ARR preload включается **ARPE**, CCR preload — **OC1PE**. Обобщение overview «все всегда double-buffered» читай в контексте настроенной PWM-схемы. UG переносит preload→active; может поставить UIF. Затем clear UIF перед unmask, иначе первый IRQ окажется phantom.

**TIM SR write0-to-clear:** `SR=~UIF` снимает только UIF. Запись `SR=UIF` оставляет UIF, очищает другие flags: interrupt storm. RMW с readback может также потерять асинхронные события — лучше direct mask write по convention.

PWM mode1: high когда CNT<CCR1. Нужны correct CCMR mode, channel enable CCER.CC1E, MODER AF, правильный AFR. Timer работает, pin не двигается → проверить mux/channel/wiring. TIM3_CH1 PA6 AF1, PB6 AF12 в pin table курса; TIM14_CH1 PA7 AF4. AF number принадлежит паре signal/pin, не целому peripheral.

Servo: nominal pulse1–2 ms раз в20 ms;1.5 ms центр. Реальные пределы зависят от servo. Slew20 us/frame при50 Hz означает изменение pulse максимум1000 us/s; перемещение1000→2000 требует50 обновлений (1 s), если target не меняется.

Capture hardware копирует CNT→CCR1 **в момент edge**, а ISR читает позже; latency не меняет уже сохранённое время. Нужно обслужить до overwrite/overcapture. Обе edges нужны для pulse width; reading CCR1 снимает CC1IF в input-capture режиме с соответствующей последовательностью status/read.

16-bit1 MHz timer: wrap65536 us. Rise65000,fall464 → `(uint16_t)(464-65000)=1000 us`. Предполагается pulse короче65536 us. HC-SR04 учебная оценка≈58 us/cm; echo5800 us≈100 cm. Round-trip уже учтён в коэффициенте, второй раз делить на2 не нужно.

В snapshot курса **Wokwi input capture не смоделирован**, поэтому lesson06 имеет fallback EXTI+TIM14.CNT. Это timestamp после latency, не hardware capture. Проверять источник измерения и counters cap/exti. Точное поведение другого simulator/version не считать доказанным этими заметками.

Приоритеты по **deadline**, не по значимости для пользователя: capture NVIC1, timer update2, SysTick3. Для согласованных width/count нужен общий snapshot. Счёт50 TIM3 updates за1000 ms SysTick — относительный cross-check делителей; оба от одного oscillator, поэтому абсолютную точность oscillator он не доказывает.

## 07. RTOS

Источник: [лекция 07](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/07_RTOS/Slide.md), slides 1–20; [os.c](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/07_RTOS/os.c).

Cooperative job работает до return/yield; один бесконечный job замораживает остальные loop jobs. Preemptive kernel может отобрать CPU у task, если interrupts работают. Это **не гарантирует долю CPU всем приоритетам**: high-priority task, всегда READY, может голодать все low-priority tasks.

**Task context:** registers+SP на собственном stack. TCB хранит saved SP в первом поле: assembly обращается по offset0. Hardware saves8 words; PendSV saves r4–r11 ещё8; total16 words=64 bytes контекста без locals/alignment extras.

**Flow:** taskA на PSP → interrupt saves hardware frame → SysTick wakes sleepers/pick → schedule pends PendSV → active handlers finish → PendSV saves A r4–r11/SP → loads B SP/r4–r11 → exception return FD restores B hardware frame → B resumes.

PendSV software-pended, lowest priority3: `SCB->ICSR = PENDSVSET`. И `PENDSVCLR` direct assignment: write1-to-act. SysTick/PendSV priorities лежат в SCB SHPR, не external IRQ IPR. Решение **schedule** и фактический **switch** — разные действия. Инициализация kernel, sleep, unlock, queue event могут запросить schedule между ticks.

Thumb-1 STM/LDM не сохраняют r8–r11 напрямую. Сначала save r4–r7, затем скопировать high regs в low и save. Restore high через low **раньше**, чем восстановить настоящие low values.

Создание task подделывает frame: xPSR01000000 (T24), PC function start, LR task_exit, r0 argument, остальные registers0. При первом switch такая task выглядит уже прерванной. Нулевой T приводит к HardFault. task_exit паркует вернувшуюся task вместо прыжка в мусор.

EXC_RETURN: **F9 Thread/MSP, FD Thread/PSP, F1 Handler/MSP**. Bit2=1 выбирает PSP. Stack overflow может испортить чужую RAM без немедленного fault: отдельный task stack не защитный barrier.

**Scheduling:** highest-priority READY; larger kernel number более срочный; round-robin among equals. Idle priority0 всегда READY. Running — выбранная current READY task; enum RUNNING в этой реализации нет. Sleep→SLEEPING до wake, object wait→BLOCKED. Busy-wait не переводит state автоматически.

`os_delay(ms)` ждёт от текущего времени; `os_delay_until(&last,period)` сохраняет fixed grid. Sleeping task не использует CPU; более низкие READY tasks могут работать. Busy task всё равно может быть preempted более высокой priority, равные time-sliced, низкие ждут.

Mutex даёт exclusion для конкретного resource; waiter BLOCKED, прочие tasks/IRQs продолжаются. Kernel защищает собственные поля коротким PRIMASK masking. Нельзя держать interrupts disabled на всё длительное ожидание и **нельзя blocking mutex из ISR**.

Priority inversion: L holds mutex, H waits; M вытесняет L, поэтому H косвенно ждёт M. Наследование: L временно получает H priority, завершает critical section, unlock, возвращается base priority. Не убирает время законного владения ресурсом. В учебной реализации inheritance ограничено одним mutex; general nested mutex case сложнее.

Queues копируют items. Task put blocks if full, get blocks if empty; `put_from_isr` возвращает0 при full, не блокирует. Queue event может сделать task READY; switch — после handlers через PendSV. В отличие от reserved-slot TX ring учебная RX kernel queue хранит **count** и может использовать все64 slots.

High-water mark: заполнить stack DEADBEEF, прогнать paths, найти untouched region снизу.128 words,20 untouched→108 used=432 bytes. Добавить margin. Один прогон не доказывает максимум всех будущих путей; глубокий printf stack учесть отдельно. CPU ticks profiling — статистическая выборка, «0%» не доказывает, что task не работала.

HardFault: saved PC в frame index6 (с нуля), xPSR7. EXC_RETURN выбирает стек frame; `addr2line -e Main.elf PC` показывает source location. M0+ имеет существенно меньше fault diagnostics, чем M4. Kernel switch дешёвый: нет MMU address-space switch/FPU context/TLB работ большого OS.

## 08. UART and Python host

Источник: [лекция 08](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/08_UART_And_Python_Host/Slide.md), slides 1–15, **включая9b, отсутствующий в overview**; [uart.c](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/08_UART_And_Python_Host/uart.c), [keys.c](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/08_UART_And_Python_Host/keys.c), [host.py](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/08_UART_And_Python_Host/host.py).

USART2 gate APBENR1.USART2EN; PA2 TX/PA3 RX AF1; CR1 UE0/RE2/TE3/RXNEIE5/TXEIE7; ISR RXNE5/TXE7/ORE3; RDR input/TDR output; IRQ28. Полный путь всё равно требует GPIO clock, AF mode, correct AF, USART clock/config, NVIC/vector.

В настройке курса oversampling16 и PRESC1: **BRR=round(f_USART/baud)**. BRR здесь сам делитель, **не минус1**.48 MHz/9600=5000; /19200=2500; /115200≈417. Неверный peripheral clock даёт неправильный baud даже при «правильной» формуле.

**8N1:** idle high, start0, b0..b7 (LSB first), stop1.10 wire bits/byte. Byte rate=baud/10, byte time=10/baud.115200→11520 bytes/s,≈86.8 us/byte;90 bytes≈7.8 ms. Если backend добавляет CR к LF, считаем фактические bytes, не только видимые characters.

RX без FIFO в схеме урока: надо вовремя прочитать RDR. Иначе ORE, data loss. ISR быстро read RDR → queue put_from_isr; protocol task blocks on empty queue. Queue64 при115200 даёт≈5.56 ms запаса на64 bytes, но hardware deadline на каждый byte остаётся≈86.8 us. Долгий producer stream всё равно требует consumer со средней достаточной скоростью.

TX task→ring→ISR. Ring256 с одним reserved empty slot имеет capacity**255**. Empty=head==tail; full=next_head==tail. Сначала записать data, затем publish head. Head пишет producer, tail consumer. **Несколько tasks должны быть сериализованы** (в приложении print_lock), иначе это уже несколько producers, и одной фразы «каждый index имеет writer» недостаточно. Volatile indices не универсальный lock-free recipe для multicore; изучаем конкретный single-core course design.

TXEIE включать, когда появились данные, выключать при empty ring. Иначе TXE остаётся1, вызывает interrupt storm и starving tasks. Изменение общего с ISR CR1 через RMW защищено masking. Buffered `_write` может вернуться, пока bytes ещё передаются; при полном ring он ждёт освобождения. **TXE не означает, что последний stop bit уже покинул pin**; для полного transmit-complete существует TC.

Print mutex защищает операции output от interleaving, non-reentrant printf state и сериализует task producers. ISR сам mutex брать не должен.

| Flag / block | Как clear в контексте курса |
|---|---|
| EXTI RPR1/FPR1 | write1 в тот же pending register |
| Timer UIF | write0 в SR |
| Capture CC1IF | read CCR1 в capture path |
| UART RXNE | read RDR |
| UART TXE | write TDR |
| UART ORE | write1 ORECF в **ICR** |
| SysTick interrupt | acknowledge при exception servicing; отдельного peripheral clear нет |

Не переносить convention одного register на все остальные.

**Frames:** `$BODY*CS`, XOR ASCII bytes **между** $ и *, ровно две hex digits. `LED,2`:4C^45^44^2C^32=53 → `$LED,2*53`. XOR catches любой single-bit flip; два одинаковых bit flips в разных bytes могут отмениться. XOR не исправляет данные и не гарантирует обнаружение всех ошибок. CRC обычно даёт более сильные гарантии в рамках своей длины/polynomial, не магическую защиту от любых ошибок.

Валидный frame ACK; bad checksum→NAK и не применять команду частично. Shell line без$ для человека, frame с$ для машины. Overlong line (более63 accepted characters) отбрасывается целиком. CR/LF завершает line; CRLF обрабатывается как один Enter.

**Terminal keys, slide9b:** ESC=1B. CSI: ESC [ затем parameters, final byte40..7E; SS3: ESC O + byte. Arrows: A Up, B Down, C Right, D Left. `ESC [ 3 ~` Delete — это одна последовательность, не четыре отдельные команды. Конечный автомат держит промежуточное состояние между bytes. ESC alone отличают по тишине >50 ms; incomplete longer sequence→OTHER.

**Точная реализация:** `key_timeout` проверяет elapsed>50, но `task_proto` блокируется на uart_getc и вызывает timeout только при приходе **следующего byte**. Поэтому одиночный ESC в этом приложении может быть показан позже, а не автоматически ровно через50 ms. Это важное различие модели и конкретного loop.

Shell characters echo обратно человеку; Backspace отправляет `\b \b`. $frame не echo, иначе host примет свою команду за board frame. Telemetry ждёт, пока человек закончит line, чтобы не вклеить `$TEL` посреди текста. При пропуске telemetry из-за typing seq не увеличивается: сознательное молчание не создаёт gap.

Host: `--selftest` проверяет known GPS checksum; `--frame BODY` формирует frame; `--file` проверяет log; `--demo` synthetic telemetry; `--port rfc2217://localhost:4000` — VS Code forwarding; real board serial port — отдельный route. Browser Wokwi не предоставляет PC обычный local serial device, поэтому есть file copy route. pyserial требуется для live port, checksum/file modes работают на stdlib.

Sequence10→13 означает missing11/12:gap2. Checksum failure и sequence gap могут относиться к **одной** повреждённой строке, их нельзя бездумно складывать как разные lost packets. Gap не объясняет конкретную физическую причину.

## Последнее повторение: симптом → механизм

| Симптом | Что проверить |
|---|---|
| Peripheral read0, writes vanish | clock gate |
| Active-low button всегда pressed | MODER оставили analog |
| Phantom press на released input | pull-up/плавающая линия |
| Port A EXTI works, другой port dead | EXTICR port select |
| Pending виден, handler не входит | IMR, NVIC enable, PRIMASK и priority |
| Первый IRQ останавливает board | spelling/weak Default_Handler |
| Handler бесконечно re-enters | pending source не clear / неверная clear convention |
| Работает -O0, зависает -Os | volatile/shared accesses |
| Редко теряются increments | RMW race |
| Поля по отдельности нормальны, вместе несовместимы | tearing snapshot |
| Timer counts, pin silent | channel enable, MODER AF, AFR, wiring |
| Первый timer period неверный | PSC preload не загружен UG |
| UART garbage | baud/clock mismatch |
| UART stops after overrun | ORE clear ICR |
| TX empty, CPU занят ISR | TXEIE не выключен |
| Строки/checksums перемешаны | сериализация output/printf |
| Низкие task priorities не работают | high READY CPU hog |
| «Случайно» испорчены данные другой task | stack overflow/bad pointer |

**Перед сном:** без подсказки объясни weak symbol, .data в двух местах, volatile vs atomic, hardware frame vs PendSV frame, NVIC vs task priorities и все способы clear flags. Потом реши один полный variant за60 минут. Утром повтори только ошибки и формулы.
