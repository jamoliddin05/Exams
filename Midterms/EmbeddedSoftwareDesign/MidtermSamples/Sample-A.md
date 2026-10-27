# SOC3050 — Practice Midterm A

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

A Cortex-M program reads a constant array in flash with an ordinary LDR. Which model explains this?

A. A unified address space for code and data

B. Run-time virtual addresses supplied by an MMU

C. Port-mapped I/O requiring IN

D. Separate Harvard spaces requiring LPM


### 2.

A word 0xA1B2C3D4 is stored at address a on this STM32. Which bytes appear at a, a+1, a+2, a+3?

A. C3 D4 A1 B2

B. D4 C3 B2 A1

C. A1 B2 C3 D4

D. B2 A1 D4 C3


### 3.

A task is in Thread mode with CONTROL.SPSEL=1. An interrupt arrives. Which stack does the handler use to execute?

A. MSP; the interrupted task hardware frame is placed on PSP

B. A new stack allocated by the NVIC

C. PSP for both the task frame and handler execution

D. MSP only if CONTROL.nPRIV=1


### 4.

Ignoring address setup and instruction fetches, an aligned RAM counter++ is LDR, ADDS, STR on this core. How many instructions and data-memory accesses are involved?

A. 3 instructions, 2 data accesses

B. 1 instruction, 1 data access

C. 2 instructions, 2 data accesses

D. 3 instructions, 3 data accesses


### 5.

Function f calls g using BL and must later return to its own caller. Why does f save LR before calling g?

A. BL overwrites LR with the return address from g

B. The Thumb bit forbids nested calls

C. LR is a memory-mapped peripheral register

D. BL always pushes LR automatically


### 6.

After CMP r0,r1, the program must branch when unsigned r0 is lower than unsigned r1. Which branch is appropriate?

A. BGE

B. BLT

C. BEQ

D. BCC


### 7.

Reset_Handler starts at 0x080004A0. What should its vector-table entry contain?

A. 0x080004A0

B. 0x200004A1

C. 0x080004A4

D. 0x080004A1


### 8.

Assume these non-optimised-away globals: const uint32_t table[4]={1,2,3,4}; uint32_t count; uint32_t limit=7;. Which storage assignment is correct?

A. table: both; count: both; limit: flash only

B. All three use RAM only

C. table: flash; count: RAM; limit: RAM plus a flash initialiser

D. table and count: flash; limit: RAM only


### 9.

main.o calls sensor_read(), but no linked object defines it. What failure should be expected?

A. Linker: undefined reference to sensor_read

B. The linker automatically inserts an empty function

C. Compiler: multiple definition of sensor_read

D. HardFault before the linker runs


### 10.

An Intel HEX type-04 record sets the upper address to 0x0800. A following data record has offset 0x0120. Where do its data begin?

A. 0x01200800

B. 0x00000920

C. 0x08001200

D. 0x08000120


### 11.

Both main and an ISR increment the same volatile uint32_t. Some increments disappear. What is the best explanation?

A. An aligned word always makes counter++ atomic

B. Volatile forces accesses but does not make read-modify-write atomic

C. The compiler is required to ignore volatile at -Os

D. Volatile disables every interrupt


### 12.

An ISR is the only writer of an aligned volatile uint32_t; main only reads it. Must main mask interrupts solely to prevent a torn read?

A. No: a single aligned word load sees the old or new value

B. Yes: only a mutex can read an ISR variable

C. Yes: every volatile load is split into four byte loads

D. No, because volatile prevents the ISR from preempting


### 13.

Why should a critical section implemented with PRIMASK remain very short?

A. It makes the CPU run at 12 MHz

B. It delays configurable interrupts and increases worst-case latency

C. It moves all globals from RAM to flash

D. It changes NVIC priorities permanently


### 14.

The first eight firmware bytes are 00 30 00 20 A1 04 00 08. What are the initial SP and actual Reset_Handler address?

A. SP=0x00300020; handler=0xA1040008

B. SP=0x20003000; handler=0x080004A0

C. SP=0x080004A0; handler=0x20003000

D. SP=0x20003000; handler=0x080004A1


### 15.

The intended TIM3 handler is accidentally named TIM3_IRQhandler. The build succeeds. The first timer IRQ arrives. What is the likely result?

A. The CPU skips this IRQ and continues normally

B. The compiler repairs the spelling at -Os

C. The linker guesses the intended name

D. The vector still selects Default_Handler and the board hangs there


### 16.

When increasing the clock from 12 MHz to 48 MHz, which order is safe?

A. Increase flash wait states, then increase clock frequency

B. Change SystemCoreClock only; hardware follows it

C. Disable the vector table, then set the baud rate

D. Increase clock frequency, then increase flash wait states


### 17.

Which MODER bits configure PB6, and which two-bit value selects output mode?

A. Bit 6, value 1

B. Bits 7:6, value 01

C. Bits 25:24, value 10

D. Bits 13:12, value 01


### 18.

Which single GPIOB->BSRR value sets PB2 and resets PB7, leaving all other pins unchanged?

A. 0x00800000

B. 0x00040080

C. 0x00000084

D. 0x00800004


### 19.

PA10 must use alternate function 3, as specified in a supplied pin table. Which field receives the value 3?

A. AFR[1] bits 11:8

B. AFR[1] bits 23:20

C. AFR[0] bits 21:20

D. MODER bits 11:8


### 20.

RPR1 has rising pending bits 1 and 4 set. You have handled only line 1. Which statement clears only that line?

A. EXTI->RPR1 = 0;

B. EXTI->RPR1 = 1u << 1;

C. EXTI->RPR1 &= ~(1u << 1);

D. EXTI->RPR1 |= 1u << 1;


### 21.

An EXTI falling pending bit is set, IMR1 is unmasked, but its NVIC IRQ is disabled. What follows?

A. The event bypasses the NVIC through GPIO->IDR

B. The linker rewrites the vector table at run time

C. The pin automatically changes to analog mode

D. The pending event does not execute the handler until the IRQ can be serviced


### 22.

At a 48 MHz core clock, what LOAD value produces a 2 ms SysTick period using the core clock?

A. 47999

B. 96000

C. 95999

D. 23999


### 23.

A 48 MHz timer must count at 1 MHz and update every 10 ms. Choose PSC and ARR.

A. PSC=48, ARR=10000

B. PSC=47, ARR=9999

C. PSC=47, ARR=1000

D. PSC=479, ARR=9999


### 24.

uint32_t start=0xFFFFFFF0 and now=0x00000020. Using unsigned subtraction, what is now-start, and has a 40 ms timeout expired?

A. 16 ms; no

B. 32 ms; no

C. 48 ms; yes

D. A negative result; unsigned subtraction is invalid


### 25.

UIF is a write-0-to-clear timer flag. Which statement clears UIF while preserving other status flags?

A. TIM3->SR |= TIM_SR_UIF;

B. TIM3->SR = TIM_SR_UIF;

C. TIM3->SR = ~TIM_SR_UIF;

D. TIM3->DIER = TIM_SR_UIF;


### 26.

A handler returns using EXC_RETURN=0xFFFFFFFD. What does this request?

A. Jump to the ordinary code address 0xFFFFFFFC

B. Return to Thread mode using PSP

C. Return to Handler mode using MSP

D. Return to Thread mode using MSP


### 27.

READY tasks have kernel priorities 1, 2 and 3. Which runs, and how does this compare with NVIC numbering?

A. Kernel task 3 runs; NVIC priority 0 is most urgent

B. Both use 0 as most urgent

C. Kernel task 1 runs; NVIC priority 3 is most urgent

D. Both use the largest number as most urgent


### 28.

Low owns a mutex wanted by High. Medium, which never uses that mutex, keeps preempting Low. What directly addresses this inversion?

A. Make High spin forever without releasing the CPU

B. Declare the mutex volatile and change nothing else

C. Temporarily raise Low to High's priority while High waits

D. Raise Medium above High


### 29.

An ISR calls os_queue_put_from_isr() when the queue is full. What does this course API do?

A. Call os_mutex_lock() and sleep

B. Block the ISR until a task consumes an item

C. Return 0 immediately

D. Overwrite the oldest item automatically


### 30.

USART clock is 48 MHz, baud is 19200, format is 8N1. What are BRR and the maximum payload-byte rate?

A. BRR=2499; 19200 bytes/s

B. BRR=19200; 2500 bytes/s

C. BRR=2500; 1920 bytes/s

D. BRR=2500; 2400 bytes/s


### 31.

TX ring is empty but TXEIE remains enabled. TXE stays set. What is the likely symptom?

A. The baud rate becomes half its value

B. The UART automatically disables UE

C. Only the next received byte is discarded

D. Repeated UART interrupts starve lower-priority work


### 32.

ASCII values are L=4C, E=45, D=44, comma=2C, 2=32 (hex). What frame encodes body LED,2?

A. $LED,2*57

B. $LED,2*53

C. $LED,2*32

D. $LED,2*50


### 33.

A raw terminal sends bytes ESC [ A. What is the best interpretation?

A. A corrupt NMEA checksum

B. Three ordinary shell commands that must execute separately

C. One Up-arrow key encoded as a three-byte escape sequence

D. A request to switch the CPU into ARM state
