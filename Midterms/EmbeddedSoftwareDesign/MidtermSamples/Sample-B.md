# SOC3050 — Practice Midterm B

Original practice questions based on the ARM 2026 course. Not an official or recovered exam.

**60 minutes · 33 questions · one correct answer A–D · 1 mark each · no calculator or notes.**

Target: STM32C031C6, Cortex-M0+. Assume unsigned 32-bit arithmetic where uint32_t is stated; 48 MHz unless a different clock is specified. Pin AF codes and IRQ numbers are supplied when needed.

Name: ____________________  Section: __________  Date: __________

## Answer sheet

| Questions | Answers |
|---|---|
| 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 | 1:___ 2:___ 3:___ 4:___ 5:___ 6:___ 7:___ 8:___ 9:___ 10:___ 11:___ |
| 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22 | 12:___ 13:___ 14:___ 15:___ 16:___ 17:___ 18:___ 19:___ 20:___ 21:___ 22:___ |
| 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33 | 23:___ 24:___ 25:___ 26:___ 27:___ 28:___ 29:___ 30:___ 31:___ 32:___ 33:___ |

## Questions

### 1.

A uint32_t load uses address 0x20000002 on actual Cortex-M0+ silicon. What is expected?

A. An undefined-reference linker error

B. HardFault because the word address is not naturally aligned

C. Automatic conversion to two safe halfword loads

D. A correct load with no penalty


### 2.

Which pair belongs to the ARM core rather than ST-specific peripheral blocks?

A. EXTI and GPIOB

B. USART2 and TIM3

C. NVIC and SysTick

D. GPIOA and RCC


### 3.

Which access correctly reads PRIMASK on this core?

A. MRS (or the CMSIS __get_PRIMASK wrapper)

B. IN from a dedicated x86-style I/O port

C. Reading BASEPRI, which is identical on M0+

D. LDR from GPIOA base plus offset 0x20


### 4.

r0=0xFF, r1=0x0C. What does BICS r0,r1 leave in r0?

A. 0xF3

B. 0xFF

C. 0x0C

D. 0x03


### 5.

A 32-bit register holds -8 (0xFFFFFFF8). What does ASRS by 1 produce?

A. 0x7FFFFFFC

B. 0xFFFFFFFC (-4)

C. 0xFFFFFFF0 (-16)

D. 0x00000004


### 6.

The narrow word-load form LDR r0,[r1,#n] has a 5-bit offset scaled by 4. Which offset is directly encodable?

A. 128 bytes

B. 126 bytes

C. 124 bytes

D. -4 bytes


### 7.

A Cortex-M0+ executes a C unsigned division whose divisor is not a compile-time constant. Which statement fits this core?

A. It switches to ARM state to perform division

B. It may call __aeabi_uidiv because no hardware divide instruction exists

C. It must use UDIV because all Cortex-M cores implement it

D. It uses the on-chip FPU for integer division


### 8.

When are final peripheral and section addresses bound in this bare-metal firmware?

A. At build/link-and-locate time

B. Only when a desktop loader starts the process

C. Continuously through an MMU

D. Only after printf initialises stdout


### 9.

Ignoring padding and all other sections, code uses 900 bytes, rodata 100 bytes, initialised writable globals 40 bytes, zeroed globals 60 bytes, reserved heap/stack 200 bytes. What are flash and RAM totals?

A. Flash 1040 bytes; RAM 260 bytes

B. Flash 1000 bytes; RAM 300 bytes

C. Flash 1100 bytes; RAM 260 bytes

D. Flash 1040 bytes; RAM 300 bytes


### 10.

Which file is normally the most useful to a debugger that needs function names and source-line information?

A. diagram.json

B. A screenshot of the serial monitor

C. Main.elf

D. Main.bin only


### 11.

A loop polling an ISR-updated ordinary global works at -O0 and hangs at -Os. What should be checked first?

A. Whether the compiler should silently change the vector number

B. Whether the ISR should use a larger uint64_t flag

C. Whether every variable should be moved to the heap

D. Whether the shared object needs volatile so the loop reloads it


### 12.

An ISR updates width and count. Main reads width, gets interrupted, then reads count. Each field is an aligned uint32_t. What can still go wrong?

A. Nothing: two atomic fields guarantee one atomic snapshot

B. Main may get an old width paired with a new count

C. Both reads are forced to return zero

D. The compiler must automatically insert a mutex


### 13.

IRQ A at NVIC priority 2 is running when IRQ B at priority 1 becomes pending. Interrupts are unmasked. What happens?

A. B can run only after main returns

B. A must finish because 2 is more urgent than 1

C. B can preempt A

D. The priorities are ignored for nested interrupts


### 14.

The linker defines _sdata as the start of .data. What does the C expression &_sdata provide?

A. The section-start address assigned by the linker

B. An allocation request for a new uint32_t

C. The size of all RAM

D. The first initialised uint32_t value inside .data


### 15.

RAM begins at 0x20000000 and its declared length is 12 KiB. What is _estack, assuming a descending stack?

A. 0x20003000

B. 0x20002FFF

C. 0x20000000

D. 0x20001200


### 16.

The linker places .text first and .isr_vector after it, without remapping the vector base. Why can the image fail to boot despite valid HEX checksums?

A. The compiler cannot compile C startup code

B. At reset the core interprets instruction bytes as the initial SP and reset vector

C. HEX checksums automatically relocate the vector table

D. The CPU searches all flash for a section named .isr_vector


### 17.

GPIOA->MODER starts at 0xEBFFFFFF. Only PA4 is changed to output with clear-then-set. What is the new value?

A. 0xEBFFFCFF

B. 0x00000100

C. 0xEBFFFDFF

D. 0xEBFFFFFF


### 18.

Two devices share an open-drain wire with a pull-up. Device A pulls low, device B releases. What level is on the wire?

A. High because the pull-up always wins

B. Low; any device pulling low wins

C. Undefined because open-drain actively drives high

D. A direct high-versus-low output short is unavoidable


### 19.

EXTI line 13 must monitor PC13. The supplied port code is C=2. Which field should contain 2?

A. EXTI->EXTICR[1] bits 27:26

B. GPIOC->AFR[1] bits 15:8

C. EXTI->EXTICR[3] bits 15:8

D. NVIC->IPR[3] bits 15:8


### 20.

For external IRQ 6 at logical NVIC priority 1, which priority word and encoded word contribution are correct?

A. IPR[0], contribution 0x40000000

B. IPR[6], contribution 0x00000001

C. IPR[1], contribution 0x00004000

D. IPR[1], contribution 0x00400000


### 21.

In the lesson debouncer, a changed sample sets held=0; each subsequent unchanged 1 ms sample increments held. With DEBOUNCE_MS=3, last raw change at t=10 ms and no later changes, when is the new stable state accepted?

A. t=11 ms

B. t=12 ms

C. t=13 ms

D. t=10 ms


### 22.

PSC is written while the timer is stopped. No update event is generated before starting. What can be wrong with the first period?

A. No timer register can be buffered

B. The write automatically changes the CPU clock

C. The timer permanently loses its counter

D. The old active prescaler may be used until the first update


### 23.

A PWM timer counts at 1 MHz with ARR=19999 and CCR1=1500, active-high PWM mode 1. What waveform results?

A. 1500 Hz frames with a 20 ms high pulse

B. 50 Hz with a 15 ms high pulse (75% duty)

C. 1 MHz frames with a 1500 ms high pulse

D. 50 Hz frames with a 1.5 ms high pulse (7.5% duty)


### 24.

A 16-bit capture timer counts at 1 MHz. Rising capture is 65000, falling capture is 464. The pulse is shorter than one full wrap. What is its width?

A. 1000 microseconds

B. 464 microseconds

C. 64536 microseconds

D. A negative width that cannot be recovered


### 25.

The main loop ignores a polled SysTick COUNTFLAG for 5 wrap periods, then reads it once. What can the flag tell it?

A. The addresses of all missed handlers

B. At least one wrap occurred, not that exactly five occurred

C. The exact count five stored in COUNTFLAG

D. That no wraps occurred because no reads were made


### 26.

An ISR makes a higher-priority task READY. Why is PendSV requested instead of swapping task context immediately inside that ISR?

A. The switch is deferred until active handlers finish; PendSV has lowest priority

B. Only PendSV can change a GPIO mode

C. The ISR must first copy all program flash to RAM

D. PendSV recompiles the selected task


### 27.

Which registers does PendSV save in addition to the eight-word hardware exception frame?

A. All peripheral registers including GPIO and UART

B. Only PC and xPSR

C. r0-r3 only

D. r4-r11


### 28.

A priority-3 task stays READY and busy-waits forever with interrupts enabled. A priority-1 task is READY. Which statement is correct for this kernel?

A. Busy-wait automatically marks the task SLEEPING

B. NVIC priority 1 makes the priority-1 task run first

C. The tick guarantees every priority exactly one equal time slice

D. The lower-priority task can starve; preemption alone does not guarantee it CPU time


### 29.

A stack contains 128 words. After exercising the task, 20 bottom words still contain the fill pattern and the remaining words have been touched. What is the measured maximum used space?

A. 108 words, or 432 bytes

B. The method proves future overflow is impossible

C. 128 bytes

D. 20 words, or 80 bytes


### 30.

Which pair correctly clears RXNE and ORE in the lesson UART?

A. Write 0 to ISR for both

B. Read RDR for RXNE; write ORECF=1 to ICR for ORE

C. Read TDR for RXNE; write 0 to CR1 for ORE

D. Write 1 to RDR for RXNE; read BRR for ORE


### 31.

A 256-slot TX ring leaves one slot unused so head==tail can mean empty. How many bytes can it hold, and what must the producer publish first?

A. 255 bytes; the tail before the data

B. 256 bytes; the head before the data

C. 255 bytes; the byte data before the new head

D. 128 bytes; head and tail simultaneously


### 32.

Two tasks can call printf. Why does the lesson wrap complete output operations in a print mutex?

A. To disable all UART interrupts for the full line duration

B. To change 8N1 to 9N1 automatically

C. To make XOR detect every possible multi-bit error

D. To serialize producers, prevent interleaved lines and protect non-reentrant printf state


### 33.

The decoder has received only ESC, and no continuation has arrived for longer than its 50 ms threshold. Why wait instead of immediately reporting a standalone Esc?

A. ESC may be the prefix of a multibyte key sequence

B. NMEA requires exactly 50 checksum bytes

C. The UART needs 50 ms to transmit every byte at 115200

D. Every ESC byte is an EXTI interrupt
