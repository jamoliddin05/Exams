# SOC3050 — Practice Midterm C

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

A peripheral control register reads back 0 and ignores writes. The code builds cleanly. Which missing step is the first suspect?

A. Insert a desktop system call to request an I/O port

B. Enable its RCC peripheral clock gate

C. Add a printf before every access

D. Mark the entire flash memory writable


### 2.

While USART2_IRQHandler runs, USART2 has external IRQ number 28. What exception number is reported by IPSR?

A. 112

B. 44

C. 12

D. 28


### 3.

Why can one task's bad pointer silently corrupt another task's data on this MCU?

A. Every task receives its own separate RAM chip

B. Tasks share a physical address space without an MMU providing private virtual maps

C. The RTOS converts every pointer to a safe virtual address

D. All misdirected writes are guaranteed to become segmentation faults


### 4.

r0=0xFFFFFFFF and r1=1. After CMP r0,r1, which statement about BLT and BCC is correct?

A. BLT is taken; BCC is not taken

B. Both are taken

C. BCC is taken; BLT is not taken

D. Neither is taken


### 5.

An assembly function uses r0 and r4 as temporary registers. Under the taught AAPCS convention, what must it restore before returning?

A. Only r0; r4 is always scratch

B. r4; r0 is caller-saved and may carry the result

C. Neither register because all registers are caller-saved

D. Both r0 and r4 must always retain their entry values


### 6.

What does LDR r2,[PC,#offset] commonly do when loading a large peripheral base address on M0+?

A. Read a 32-bit constant from a nearby literal pool

B. Store the PC into a peripheral register

C. Ask the linker to allocate a new register at run time

D. Switch from Thumb to ARM instructions


### 7.

A four-byte BL is located at 0x08000120. What LR value does it create, and where does an ordinary BX LR return?

A. LR=0x08000125; return instruction at 0x08000124

B. LR=0x08000128; return instruction at 0x08000128

C. LR=0x08000124; return instruction at 0x08000125

D. LR=0x08000121; return instruction at 0x08000120


### 8.

Two ordinary source files both provide strong definitions of int sensor_read(void). Neither is static. What happens when they are linked together?

A. The first alphabetically is silently selected

B. The CPU chooses one randomly at reset

C. A multiple-definition link error

D. The definitions become weak automatically


### 9.

The startup routine skips .bss zeroing. What is guaranteed about a .bss counter when main begins?

A. It must always equal 0xFFFFFFFF

B. It is guaranteed to equal its last flash initialiser

C. Its promised zero initial value is no longer guaranteed

D. The C compiler inserts zeroing into every later read


### 10.

Which sequence best describes the firmware build and use of a simulator?

A. The HEX file is C source that the CPU compiles on reset

B. Wokwi first compiles every C file, then the linker simulates the board

C. Renode replaces the need for a compiler and a linker script

D. Preprocess, compile, assemble, link/locate; then the simulator executes the image


### 11.

Which statement best distinguishes polling, interrupts and DMA at the level used in this course?

A. DMA means that every byte must be copied by the ISR

B. Polling always outperforms the other two in CPU use

C. Interrupts mean the peripheral can never miss a second event

D. Polling checks readiness; an interrupt invokes a handler; DMA transfers data without a CPU instruction per item


### 12.

Why does disabling interrupts on core A fail to protect shared data from core B on a dual-core system?

A. PRIMASK affects local interrupt handling, not execution on the other core

B. PRIMASK disables writes to RAM globally

C. Volatile automatically stops core B instead

D. Core B has no registers


### 13.

A reusable critical-section helper may be called while interrupts are already disabled. What is the correct exit policy?

A. Always call __enable_irq(), even for a nested section

B. Always leave PRIMASK at 1

C. Restore the saved PRIMASK value

D. Set CONTROL.SPSEL instead of restoring the mask


### 14.

Why is a correctly named ordinary handler selected instead of the default weak alias?

A. Its strong symbol overrides the weak symbol during linking

B. The NVIC parses C function names at run time

C. volatile on the function makes it higher priority

D. The CPU searches source files on each interrupt


### 15.

What does .data >RAM AT>FLASH express in the linker script?

A. Run-time address in RAM, load image stored in flash

B. Use RAM only, with no nonvolatile initial values

C. Execute all .data bytes as instructions in flash

D. Delay address binding until an MMU maps the section


### 16.

printf is linked successfully but the serial port stays silent. Which supplied function is the C-library-to-UART output bridge?

A. __get_PRIMASK

B. _write

C. NVIC_EnableIRQ

D. main


### 17.

A pin's MODER field is currently 11. Software executes MODER |= (1u << (2*n)) hoping to select output 01. What mode remains in that field?

A. 10 (alternate function)

B. 00 (input)

C. 01 (output)

D. 11 (analog)


### 18.

Which GPIO interrupt-source pair cannot both be selected at the same time through EXTI?

A. PA2 and PB3

B. PA0 and PB7

C. PA2 and PB2

D. PA1 and PA6


### 19.

External IRQ number is 19 and the vector table starts at 0x08000000. At what address is this IRQ's vector word?

A. 0x08000088

B. 0x0800008C

C. 0x08000023

D. 0x0800004C


### 20.

GPIOA->IDR reads 0x00000008. PA3 is a digital input with a pull-up and a button to GND. Is the button pressed?

A. Yes; every set IDR bit means pressed

B. Impossible because a pull-up forces a permanent 0

C. Yes; 0x8 selects analog mode

D. No; bit 3 is 1, so the active-low button is released


### 21.

A button press produces many bounce edges. Which handler design matches the lesson?

A. Disable SysTick permanently to make the contact stable

B. Clear pending flags, record edges, return; decide stable state outside the ISR

C. Treat each falling bounce edge as a separate user press

D. Wait 20 ms inside the ISR, then leave all pending bits set


### 22.

A periodic job runs 3 ms late once. Why does last += period preserve timing better than last = now?

A. It keeps future deadlines on the original time grid

B. It changes a cooperative loop into a preemptive kernel

C. It makes unsigned wrap impossible

D. It guarantees that every job always finishes before its deadline


### 23.

A 48 MHz timer uses PSC=479 and ARR=999. In active-high PWM mode 1 with CCR1=250, what are the update frequency and high-pulse width?

A. 1000 Hz and 2.5 ms

B. 50 Hz and 5 ms

C. 100 Hz and 250 microseconds

D. 100 Hz and 2.5 ms


### 24.

A hardware timer runs and IRQ counts look right, but its PWM pin has no signal. Which configuration is a strong suspect?

A. A type-04 HEX record always disables PWM

B. Missing volatile on a constant lookup table

C. A signed branch in the Python host

D. Wrong alternate-function selection or a disabled channel output


### 25.

Why is real hardware input capture more accurate than taking a timer reading after entering an EXTI ISR?

A. Capture disables every other interrupt permanently

B. An ISR can always run at zero latency

C. Hardware latches CNT at the edge before ISR latency occurs

D. Capture uses the wall-clock time on the Python host


### 26.

A new task is started from a fabricated exception frame. Which xPSR value sets the required Thumb T bit?

A. 0x01000000

B. 0x00000000

C. 0x10000000

D. 0x00000001


### 27.

Two tasks at the highest READY kernel priority are CPU-bound and never block; all others are lower priority. What scheduling policy applies to those two?

A. Always select the task with the lower RAM address

B. Give the lower-priority tasks an equal slice after each one

C. Run-to-completion with no preemption

D. Round-robin time slicing among equals


### 28.

Which state best describes a task waiting for a held mutex, and which describes a task waiting for a time delay?

A. Mutex: SLEEPING; delay: BLOCKED

B. Mutex: BLOCKED; delay: SLEEPING

C. Both must spin in READY state

D. Both execute in Handler mode on MSP


### 29.

A HardFault frame has eight uint32_t words, indexed from 0. Which frame index gives the saved PC, and what does EXC_RETURN bit 2 select?

A. Index 4; flash versus SRAM execution

B. Index 7; the UART baud rate

C. Index 6; PSP when bit 2 is 1, otherwise MSP

D. Index 0; Thread versus Handler priority number


### 30.

A continuous 8N1 stream arrives at 100000 baud. Ignoring other buffering, how much time is there per incoming byte, and how long does an initially empty 64-byte queue absorb it without a consumer?

A. 80 microseconds per byte; about 5.12 ms

B. 10 microseconds per byte; about 0.64 ms

C. 1 millisecond per byte; about 64 ms

D. 100 microseconds per byte; about 6.4 ms for 64 bytes


### 31.

Two transmitted body bytes both have bit 0 flipped, and the transmitted XOR checksum bytes are unchanged. What can happen?

A. The receiver discovers the original bytes from the checksum

B. Every such pair is guaranteed to be rejected

C. The two XOR changes cancel and the corrupted body passes this checksum

D. XOR automatically corrects both bytes


### 32.

Why are machine lines beginning with $ not echoed, and why is telemetry paused while a human is typing?

A. Because GPIO cannot send data while a key is held

B. To double the physical UART baud rate

C. To avoid treating echoed commands as received frames and mixing telemetry into partial shell lines

D. To disable checksum validation for human input


### 33.

The host accepts valid TEL frames with sequence numbers 10 and then 13. What gap is inferred, and what does it prove?

A. Two sequence numbers are missing; it does not identify the physical cause

B. Three missing frames; both must be UART overruns

C. No loss is inferred because both received checksums passed

D. One missing frame; XOR corrected the other
