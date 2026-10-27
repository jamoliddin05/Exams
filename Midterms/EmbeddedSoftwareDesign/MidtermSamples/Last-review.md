# SOC3050 — повторить перед экзаменом

Официальный охват **00–08 ARM**, STM32C031C6/Cortex-M0+. **33 вопроса,60 минут**, один ответ A–D, без калькулятора. Отвечать на всё: штрафа за ошибку нет. Проверяют answer sheet. Синяя/чёрная нестираемая ручка; имя заглавными буквами, ID, **правильный section** на каждой странице.

## Что воспроизвести без подсказки

| Вопрос | Короткий ответ |
|---|---|
| Модель программиста? | Registers, memory, peripheral registers, modes/stacks, exceptions |
| Cortex-M address space? | Unified; memory-mapped I/O, обычные loads/stores |
| Почему peripheral молчит? | Clock gate → pin mode/AF → peripheral config → masks/NVIC/vector |
| `counter++`? | Load,modify,store:3 instructions,2 data accesses, RMW race |
| `volatile`? | Реальные обращения; не lock, не atomic increment |
| Один aligned32-bit writer/reader? | Нет torn word; volatile для повторных чтений |
| uint64/pair fields? | Нужен согласованный snapshot |
| Thumb? | M0+ только Thumb; hardware divide/FPU нет |
| Signed compare? | BLT/BGE; unsigned lower/higher-or-same BCC/BCS |
| Большая constant? | Literal pool через PC-relative LDR |
| BL return? | LR=next address OR1; non-leaf сохраняет LR |
| Function pointer vs xPSR? | Pointer bit0=1; xPSR T=bit24; actual PC чётный |
| Hardware frame? | r0,r1,r2,r3,r12,lr,pc,xPSR; PC index6 |
| Остальной context? | PendSV saves r4–r11 |
| Стек handler? | MSP; interrupted task frame может быть на PSP |
| EXC_RETURN? | FD=Thread/PSP; F9=Thread/MSP; F1=Handler/MSP |
| Кто выбирает/switches? | schedule/pick выбирает; PendSV переключает после handlers |
| Кто срочнее? | NVIC: меньше number. Kernel tasks: больше number |
| Busy high-priority task? | Может starve low tasks; equal priorities time-sliced |
| Mutex from ISR? | Нельзя block; ISR-safe queue put returns0 if full |
| Priority inheritance? | Low owner временно получает High waiter priority |
| Stack overflow? | Может молча повредить чужие данные; high-water mark+margin |
| .data? | Работает в RAM, initial copy во flash; copy до main |
| .bss? | RAM, zero loop до main, без payload zeros во flash |
| Linker boundary? | `&symbol`, не чтение `_sdata` как значения |
| Handler typo? | Weak alias не заменён → Default_Handler infinite loop |
| Raising clock? | Сначала flash wait state, потом frequency |

## Формулы

```
Pin n:
  1-bit register -> bit n
  2-bit register -> bits 2n+1:2n
  AFR[n/8]      -> shift 4*(n%8), width4
  EXTI EXTICR[n/4] -> shift 8*(n%4), byte per line (C0)
  BSRR          -> bit n set, bit n+16 reset
  MODER         -> 00 input,01 output,10 AF,11 analog
  PUPDR         -> 00 none,01 up,10 down

field = (old & ~(mask<<shift)) | (value<<shift)

vector_slot    = 16 + external_IRQ
vector_address = table_base + 4*vector_slot
NVIC priority  = prio << 6 in byte IRQ%4 of IPR[IRQ/4]

f_count  = f_timer/(PSC+1)
f_update = f_timer/((PSC+1)*(ARR+1))
SysTick LOAD = requested_ticks - 1; max24 bits
PWM high time = CCR/f_count; period=(ARR+1)/f_count

elapsed32 = (uint32_t)(now-start)
pulse16   = (uint16_t)(fall-rise)

BRR        = round(f_USART/baud)       // no -1 for this configuration
8N1 bits   = 10 per byte
byte rate  = baud/10
byte time  = 10/baud seconds
XOR        = bytes between '$' and '*', excluding delimiters
```

Модульное elapsed справедливо, когда не потерян целый дополнительный оборот счётчика. Для signed deadline comparison нужен горизонт менее половины диапазона.

## Очистка флагов

| Где | Действие |
|---|---|
| EXTI RPR1/FPR1 | `= mask`: write1-to-clear; не `|=` |
| TIM UIF | `SR = ~UIF`: write0-to-clear |
| TIM capture CC1IF | read CCR1 в capture path |
| USART RXNE / TXE | read RDR / write TDR |
| USART ORE | write1 ORECF в ICR |
| SysTick handler | отдельного peripheral flag clear нет |

## Пять расчётов в голове

1. **PA6 MODER:**13:12. **PA10 AF3:**AFR[1],11:8, value3. Не путать AF mode10 с AF number3.
2. **PB2 high+PB7 low:**BSRR00800004. Нули не меняют остальные outputs.
3. **IRQ19:**slot35;offset140=8C;при base08000000 vector word находится0800008C.
4. **48 MHz,1 MHz counter,20 ms:**PSC47,ARR19999;CCR1500→1.5 ms (7.5%). **19200 baud:**BRR2500,1920 bytes/s.
5. **Start FFFFFFF0,now20:**elapsed30 hex=48 decimal. **Capture65000→464:**1000 ticks через wrap16.

Little-endian:12345678→78 56 34 12. Initial SP20003000 из12 KiB RAM. Reset target080004A1 означает instruction080004A0.

## UART и keys: не забыть последнюю лекцию

RXISR→queue64→blocked protocol task. TX tasks→ring256,capacity255→ISR. Data прежде head; tasks producers сериализовать mutex. Пустой ring → **TXEIE off**, иначе storm. Print lock также защищает non-reentrant printf и целостность lines. Поставить bytes в ring не равно завершить передачу на pin.

`$LED,2*53`: XOR4C^45^44^2C^32=53. Два одинаковых bit flips в разных bytes могут не обнаружиться. Bad frame не применять. Seq10→13 →два missing, причина неизвестна.

ESC1B, CSI `ESC [` с final40..7E. `ESC [ A/B/C/D` =Up/Down/Right/Left. Lone Esc различается по timeout>50 ms; в текущем `task_proto` timeout проверяется при следующем byte. $frame не echo; telemetry не вклеивать в незавершённую human line.

## Если осталось мало времени

- **Около4 часов:**A60 мин,разбор30; повтор слабых лекций40;B60;разбор25;формулы15. C оставить как дополнительный банк.
- **Около2 часов:**A60,разбор35,формулы/flags/priorities25.
- **Около30 минут:**этот файл10, расчёты10, разобрать именно свои прежние ошибки10.

Не пытайся за ночь выучить AVR и lessons09–19: для заявленного ARM midterm они не входят. Лучше уметь объяснить причину каждого silent failure, чем запомнить много адресов.

[Полный конспект](Study-guide-RU.md) · [Варианты и разборы](README.md)
