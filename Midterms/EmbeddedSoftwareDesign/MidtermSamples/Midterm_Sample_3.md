# Embedded System and Software Design: Midterm Sample 3

Lessons 00-08 (the scope of the professor's guide, `../slides/exam_midterm_overview.md`) · 60 minutes · 33 multiple choice × 1 mark, options A-D, closed book, no calculator · Q1-4 L00 · Q5-8 L01 · Q9-11 L02 · Q12-14 L03 · Q15-17 L04 · Q18-22 L05 · Q23-26 L06 · Q27-30 L07 · Q31-33 L08 · Answer and explanation under each question

Each answer has a **Source** line with the slides (L05 slide 12 = lesson 05 deck, slide 12; decks in `../slides/source/`) and a **Notes** link to the notes section that explains it.

## Multiple choice (33 × 1 = 33 marks)

**1.** A sensor sends a 32-bit count most significant byte first, in network byte order: `00 01 86 A0`, which is `0x000186A0` = 100000. The bytes are stored in arrival order in a 4-byte-aligned buffer `buf`, and the STM32C031 reads them with `uint32_t n = *(uint32_t *)buf;`. What is `n`?  
A) `0x000186A0`  
B) Nothing: the load raises a HardFault  
C) `0x0A681000`  
D) `0xA0860100`

> **Answer: D)** The load is aligned, so it works, and every STM32 is little-endian, so the byte at the lowest address becomes the least significant. `buf[0] = 0x00` lands in bits 7:0 and `buf[3] = 0xA0` in bits 31:24, which gives `0xA0860100`, about 2.69 billion. A needs a big-endian machine or a byte swap (what `ntohl()` does), and C reverses the hex digits instead of the bytes. "The other convention reaches you only when bytes arrive from somewhere else."  
> **Source:** L00 slide 10 little-endian, big-endian network byte order and `htonl()` · L00 slide 10 natural alignment  
> **Notes:** [L00 › 11. The data model: width, alignment, byte order](../notes/01_Week2_L00_ProgrammersModel.md#11-the-data-model-width-alignment-byte-order-slide-10)  
> **Visual:** [Sample 3 › Q1](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc1)

**2.** On a desktop, a store through a corrupted pointer usually ends in a segmentation fault. On the STM32C031, the program drives PB3 as an output that enables a motor driver, and a corrupted pointer `p` now holds `0x50000414`, the address of GPIOB's `ODR`. The code runs `*p = 0x08;`. The MPU is not configured. What happens?  
A) A segmentation fault: the MMU traps the store, because `0x50000414` is outside the program's virtual address space  
B) Nothing: peripherals sit in a separate I/O space, so an ordinary store cannot reach them  
C) A HardFault: the MPU gives each program a private map of memory, and `0x50000414` is not in it  
D) The store goes through and PB3 goes high: there is no MMU and one real address space, so the pointer reaches a peripheral

> **Answer: D)** The hardware that turns a bad pointer into a segmentation fault is the MMU, which gives each desktop program a private virtual map. This chip has the two privilege levels "and none of the virtual memory": one real address space, shared by everything, with peripherals at ordinary addresses. So the store is an ordinary `str` to GPIOB's `ODR`, `0x08` is bit 3, PB3 goes high and the motor turns, with no error (A, B wrong). An MPU only sets permission rules over the real addresses, and only once software programs it; it never builds a private map (C).  
> **Source:** L00 slide 8 privilege without virtual memory, MMU vs MPU, a stray pointer reaches a peripheral · L00 slide 5 a store has a side effect in the physical world · L00 slide 17 item 14  
> **Notes:** [L00 › 9. Modes and stacks: Thread, Handler, MSP, PSP](../notes/01_Week2_L00_ProgrammersModel.md#9-modes-and-stacks-thread-handler-msp-psp-slide-8)  
> **Visual:** [Sample 3 › Q2](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc2)

**3.** A breakpoint stops the STM32C031 inside an interrupt handler, and the debugger shows `xPSR = 0x01000020`. Which IRQ is being serviced, and which vector-table slot holds its handler's address?  
A) IRQ 4, slot 20  
B) IRQ 32, slot 48  
C) IRQ 16, slot 32  
D) IRQ 20, slot 36

> **Answer: C)** The bottom of `xPSR`, the IPSR view (bits 5:0), holds the exception number, which is the slot the hardware took: `0x20` = 32. Bit 24 is the Thumb bit T, always 1, and the flags N Z C V are 0. The first 16 slots are ARM's, so the vendor IRQ is 32 − 16 = 16 (TIM3). A and D read `0x20` as decimal 20, and B takes 32 for the IRQ and adds 16 a second time.  
> **Source:** L00 slide 9 IPSR holds the exception number, 16 + 28 = 44 for USART2 · L00 slide 3b `xPSR` read three ways, ISR in bits 5:0  
> **Notes:** [L00 › 3. Every core register and the special registers](../notes/01_Week2_L00_ProgrammersModel.md#3-every-core-register-and-the-special-registers-slide-3b)  
> **Visual:** [Sample 3 › Q3](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc3)

**4.** GPIOA's output data register `ODR` is at `0x50000014`, and PA5 is an output. The two lines below must drive PA5 high and then low. Which definition of `GPIOA_ODR` guarantees that both stores reach the pin?
```c
GPIOA_ODR = 1u << 5;   /* PA5 high */
GPIOA_ODR = 0;         /* PA5 low  */
```

A) `#define GPIOA_ODR (*(volatile uint32_t *)0x50000014u)`  
B) `#define GPIOA_ODR (*(uint32_t *)0x50000014u)`  
C) `uint32_t GPIOA_ODR = 0x50000014u;`  
D) `volatile uint32_t GPIOA_ODR = 0x50000014u;`

> **Answer: A)** A register is an address, and A turns that address into an object the compiler must access "exactly as written": two stores to `0x50000014`, so PA5 goes high and then low. B reaches the right address, but without `volatile` the compiler may cache, reorder or delete accesses, and the first store is dead because the second overwrites it. C and D declare variables in RAM that merely hold the number `0x50000014`, so the stores change RAM and the pin never moves.  
> **Source:** L00 slide 5 a register is not a variable, every access must happen exactly as written · L00 slide 4 only the address tells a register from a variable · L00 slide 17 item 4  
> **Notes:** [L00 › 6. A register is not a variable](../notes/01_Week2_L00_ProgrammersModel.md#6-a-register-is-not-a-variable-slide-5)  
> **Visual:** [Sample 3 › Q4](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc4)

**5.** x86 instructions are 1 to 15 bytes long. On the Cortex-M0+ every instruction is 2 or 4 bytes, and only `ldr` and `str` touch memory. What does this load–store design buy the Cortex-M0+?  
A) Fewer instructions for the same C code, because each instruction does more work  
B) Arithmetic instructions that take an operand straight from SRAM, so no register is needed for it  
C) A fixed-length encoding: the decoder never has to work out how long an instruction is before it can find the next one, and every opcode goes through the same pipeline stages  
D) A single uninterruptible instruction that sets one bit in a peripheral register, as the AVR's `sbi` did

> **Answer: C)** Keeping memory out of arithmetic lets every instruction have a fixed length, 2 bytes or, when 16 bits cannot do the job, 4. The decoder finds the next instruction without decoding the current one first, and the pipeline has the same stages for every opcode. A 48 MHz part with no cache is built from those properties. A is the cost, not the gain: load–store needs more instructions. B describes register–memory machines such as the x86. D is wrong: the M0+ has no `sbi`, and setting a bit takes `ldr`, `orrs`, `str`.  
> **Source:** L01 slide 4 Load / Store, what the admission buys: fixed-length encoding, simple decoder, uniform pipeline · L01 slide 2 Thumb 16 bits, widening to 32 only when it must · Guide §2 key contrasts, RISC vs CISC  
> **Notes:** [L01 › 4. Load and store: the two machine models](../notes/02_Week2_L01_InstructionSet_Thumb.md#4-load-and-store-the-two-machine-models-slide-4)  
> **Visual:** [Sample 3 › Q5](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc5)

**6.** A driver defines its own USART register struct and forgets `volatile`. At `-Os` the wait for TXE (bit 7, mask `0x80` in `r0`) compiles to the listing below. The first read of `ISR` returns `0x00000000`; a few microseconds later the hardware sets TXE. What happens?  
```text
        ldr   r6, [r4, #28]    ; read USART->ISR
loop:   tst   r6, r0
        beq   loop
        str   r5, [r4, #40]    ; write USART->TDR
```

A) It writes `TDR` as soon as TXE becomes 1, because `tst` reads `ISR` again on every pass  
B) It writes `TDR` at once, because `tst` stores `r6 AND r0` in `r6` and `beq` is taken only when that value is non-zero  
C) It hangs: the only `ldr` is outside the loop, so `tst` keeps testing the stale 0 in `r6`; Z stays 1 and `beq` is always taken  
D) It HardFaults, because `tst` cannot test a value that came from a peripheral register

> **Answer: C)** `tst` is an AND that throws the result away and keeps the flags: `0 AND 0x80 = 0`, so Z = 1 and `beq` loops. Without `volatile` the compiler read `ISR` once, before the loop, and `r6` never changes again, so the loop spins forever on a value that never changes. This is the classic "works at `-O0`, hangs at `-Os`". A would be true with `volatile` (CMSIS `__IO`), which puts the `ldr` inside the loop. B is wrong twice: `tst` writes no register, and `beq` is taken when the result is zero. D is wrong: `r6` is an ordinary register value.  
> **Source:** L01 slide 7 `tst` is an AND that keeps only the flags · L01 slide 13 without `volatile` the compiler reads once and loops forever · L01 slide 21 works at `-O0`, hangs at `-Os`  
> **Notes:** [L01 › 20. What the compiler is allowed to do, and volatile](../notes/02_Week2_L01_InstructionSet_Thumb.md#20-what-the-compiler-is-allowed-to-do-and-volatile-slide-21)  
> **Visual:** [Sample 3 › Q6](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc6)

**7.** A C function uses `r4` and `r5` and calls another function, so gcc gives it the prologue `push {r4, r5, lr}`. Which epilogue returns to the caller correctly?  
A) `pop {r4, r5}` followed by `bx lr`  
B) `pop {r4, r5, lr}` with nothing after it  
C) `bx lr` alone  
D) `pop {r4, r5, pc}`

> **Answer: D)** The saved `LR` word is popped straight into `PC`, and popping into `PC` is the return. The same instruction gives `r4` and `r5` back, which AAPCS requires because they are callee-saved. A and C branch to `LR`, but the inner `bl` has overwritten it, so they jump back into this function; they also leave the stack pointer wrong. B restores `LR` but does not branch, so execution runs on into whatever bytes follow.  
> **Source:** L01 slide 8 `pop {r4, pc}`, popping into PC returns; `push {lr}` in every non-leaf prologue · L01 slide 18 AAPCS, `r4`–`r11` callee-saved  
> **Notes:** [L01 › 8. Branches, calls and returns](../notes/02_Week2_L01_InstructionSet_Thumb.md#8-branches-calls-and-returns-slide-8)  
> **Visual:** [Sample 3 › Q7](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc7)

**8.** The linker map puts `Reset_Handler` at `0x08000190`. A student writes the vector table by hand in assembly. Which four bytes must the image hold at addresses `0x08000004` to `0x08000007`, the reset vector?  
A) `90 01 00 08`  
B) `08 00 01 91`  
C) `08 00 01 90`  
D) `91 01 00 08`

> **Answer: D)** Every code address handed to the core has bit 0 set, the Thumb bit, so the reset vector is `0x08000190 | 1 = 0x08000191`. The Cortex-M is little-endian: the lowest byte goes to the lowest address, giving `91 01 00 08`. A is the even address: bit 0 = 0 asks for ARM state, which a Cortex-M does not have, so the chip faults immediately on reset. B and C store the bytes in big-endian order.  
> **Source:** L01 slide 19 The Thumb bit, vector `0x08000275` for `Reset_Handler` at `0x08000274`, even vector faults on reset · L01 slide 2 Cortex-M has no ARM state  
> **Notes:** [L01 › 18. The Thumb bit in the vector table](../notes/02_Week2_L01_InstructionSet_Thumb.md#18-the-thumb-bit-in-the-vector-table-slide-19)  
> **Visual:** [Sample 3 › Q8](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc8)

**9.** A classmate says: "Booting a microcontroller must work like booting a PC. Some firmware has to load a bootloader before my program can run." Which statement describes how the STM32C031C6 actually boots?  
A) Like a PC, in four handoffs: boot firmware, bootloader, kernel, then `main()`  
B) In two handoffs: the hardware runs `SystemInit`, and `SystemInit` calls `main()`  
C) In one link: the hardware reads two 32-bit words from the start of flash, the initial SP and the reset vector, and runs `Reset_Handler`; everything after that is code you can read  
D) With no handoff at all: the CPU starts executing `main()` at `0x08000000`, the first address of flash

> **Answer: C)** Bootstrapping always starts with one fixed act by the hardware. A PC's CPU starts at a fixed address near the top of its address space and hands off four times: firmware, bootloader, kernel, program. This chip's chain has one link: load SP from word 0 and PC from word 1, then `Reset_Handler` runs and does the rest in code (copy `.data`, zero `.bss`, `SystemInit`, `main()`), which B wrongly gives to the hardware. The first word at `0x08000000` is the stack pointer, not an instruction (D).  
> **Source:** L02 slide 8 what runs before `main()`, bootstrapping · L02 slide 10 item 9  
> **Notes:** [L02 › 8. What runs before main, and bootstrapping](../notes/03_Week3_L02_Development_Toolchain.md#8-what-runs-before-main-and-bootstrapping-slide-8)  
> **Visual:** [Sample 3 › Q9](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc9)

**10.** The map file of a build says `SystemCoreClock` is at `0x20000000`. You program the same `Main.hex` into two boards and press reset on each many times. Where is `SystemCoreClock` on each board and each run, and why?  
A) Always at `0x20000000`: the locate stage bound it at build time, and the address is burned into the image  
B) It can move after each reset, because `Reset_Handler` works as a loader and picks a new base for `.data`  
C) It can differ between the boards, because an MMU maps `0x20000000` to a different physical address on each  
D) The programmer picks a free RAM address when it writes the hex file, so each board can get a different one

> **Answer: A)** A name can be bound to its address at compile time, load time or run time. With no loader and no MMU, this chip binds at build time: the code that uses `SystemCoreClock` carries `0x20000000` inside the image, so the address is the same on every board and every run until you re-link. `Reset_Handler` only copies `.data` to the addresses the linker chose (B), there is no MMU to translate (C), and the hex file holds flash bytes that already contain their addresses (D).  
> **Source:** L02 slide 2 address binding, "binding happens at build time and is burned into the image" · L02 slide 10 item 7  
> **Notes:** [L02 › 2. Five stages, not one, and address binding](../notes/03_Week3_L02_Development_Toolchain.md#2-five-stages-not-one-and-address-binding-slide-2)  
> **Visual:** [Sample 3 › Q10](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc10)

**11.** A linker script for the STM32C031C6, which has 12 KB of SRAM, says `RAM (rw) : ORIGIN = 0x20000000, LENGTH = 16K`, and the stack top is `ORIGIN(RAM) + LENGTH(RAM)`. What initial SP ends up in the image, and what happens?  
A) `0x20003000`, and the program runs normally, because the hardware limits SP to the real end of RAM  
B) `0x20004000`: the build succeeds, but the stack starts above the real 12 KB, so the program fails at run time  
C) `0x20004000`, but the linker stops with an error because the chip has only 12 KB, so no image is produced  
D) `0x20010000`, because 16K is `0x10000`, and the program fails at run time

> **Answer: B)** 16K = 16 × 1024 = 16384 = `0x4000`, so the stack top is `0x20000000 + 0x4000 = 0x20004000`, while real SRAM ends at `0x20002FFF` (12K = `0x3000`). The linker knows nothing about your chip, so the build succeeds and even reports a smaller RAM percentage; the failure arrives later, when the stack is used in memory that does not exist. `0x10000` is 64K, not 16K (D), and the hardware never corrects SP (A).  
> **Source:** L02 slide 6 the linker script is the memory map, get `LENGTH` wrong and the build succeeds · L02 slide 10 item 5  
> **Notes:** [L02 › 6. The linker script is the memory map, written down](../notes/03_Week3_L02_Development_Toolchain.md#6-the-linker-script-is-the-memory-map-written-down-slide-6)  
> **Visual:** [Sample 3 › Q11](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc11)

**12.** `main()` and a 1 kHz timer ISR both do `count++` on a shared global. Every bench test passes, but in the field the count comes out wrong roughly once every 7 hours. The timer is then changed to 10 kHz. Which statement is right?  
A) It is a compiler optimisation problem; declaring `count` as `volatile` fixes it at any interrupt rate.  
B) It is a stack overflow that builds up with uptime; at 10 kHz it appears about 10 times less often.  
C) It is a race condition; at 10 kHz it appears about 10 times as often, roughly every 40 minutes, and running more tests will not find it.  
D) It is tearing of a 32-bit value; at 10 kHz the window closes and the bug disappears.

> **Answer: C)** An update is lost only when the interrupt lands in `main()`'s two-instruction window between `ldr` and `str`, about 40 ns at 48 MHz (2 × 20.8 ns). Each interrupt has the same small chance of hitting it, so ten times the interrupts give about ten times the failures: 7 h / 10 ≈ 42 min. The result depends on the relative timing of two contexts, which is a race condition, and more testing only resamples the timing. A fails because `volatile` does not make `count++` indivisible. D fails because an aligned 32-bit value is read in one access, and the window does not depend on the rate. Nothing in B builds up over time.  
> **Source:** L03 slide 6 a bug that only appears sometimes · L03 slide 10 item 7  
> **Notes:** [L03 › 6. A bug that only appears sometimes](../notes/05_Week4_L03_Execution_Concurrency.md#6-a-bug-that-only-appears-sometimes-slide-6)  
> **Visual:** [Sample 3 › Q12](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc12)

**13.** In which of these situations is polling the right choice?  
A) Waiting for a user to press a button, which may take minutes, while `main()` has other work to do.  
B) Moving a 2 KB block of received UART data into a buffer while the CPU runs a control loop.  
C) Waiting, after writing a new wait state into `FLASH->ACR`, until its `LATENCY` field reads back the new value, a wait of a few cycles.  
D) Catching every edge of a signal that can arrive at any moment while `main()` is busy elsewhere.

> **Answer: C)** Polling is the right answer whenever the wait is shorter than the cost of being interrupted. An interrupt costs an entry (push 8 registers, read the vector) and an exit (pop 8). The flash controller acknowledges the new latency within a few cycles, so the 4-instruction read, test, branch loop is cheaper and simpler. A and D are rare events, or events that must not be missed, so they need an interrupt. B is a stream of data, which is the job of DMA.  
> **Source:** L03 slide 1 three ways to meet the hardware · L01 slide 13 a polling loop in four instructions  
> **Notes:** [L03 › 1. Three ways to meet the hardware](../notes/05_Week4_L03_Execution_Concurrency.md#1-three-ways-to-meet-the-hardware-slide-1)  
> **Visual:** [Sample 3 › Q13](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc13)

**14.** To protect a shared counter, a student writes this in `main()`. A UART receive interrupt with NVIC priority 0 is enabled. What does this code do to that interrupt?  
```c
__disable_irq();
counter++;
print_count(counter);    /* takes about 5 ms */
__enable_irq();
```

A) A request that arrives inside the region waits until `__enable_irq()`, up to about 5 ms. The longest critical section sets the worst-case interrupt latency, so only `counter++` belongs inside.  
B) Nothing: priority 0 is the most urgent level, so the UART interrupt still preempts `main()` inside the region.  
C) The request is discarded, so that byte is lost, but the latency of later interrupts is unchanged.  
D) Nothing: `__disable_irq()` only asks the scheduler not to switch threads, like a mutex.

> **Answer: A)** `__disable_irq()` is `cpsid i`. It sets `PRIMASK` bit 0, and while that bit is set no configurable interrupt is taken, whatever its priority. The NVIC holds the request pending and the handler runs right after `cpsie i`, so a request can wait for the whole 5 ms region. Keep the region to the three instructions of `counter++`. B is wrong because `PRIMASK` masks priority 0 too. C is wrong because the request is held pending, and the wait is exactly the latency. D describes a mutex, which is the tool for two threads, not for an ISR.  
> **Source:** L03 slide 5 keep it short · L03 slide 8 interrupt latency, the longest critical section sets its worst case  
> **Notes:** [L03 › 5. Hazard two: the interrupt lands mid-update](../notes/05_Week4_L03_Execution_Concurrency.md#5-hazard-two-the-interrupt-lands-mid-update-slide-5) · [L03 › 8. Priority: which interrupt wins](../notes/05_Week4_L03_Execution_Concurrency.md#8-priority-which-interrupt-wins-slide-8)  
> **Visual:** [Sample 3 › Q14](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc14)

**15.** A student edits the `MEMORY` block of `link.ld` to `RAM (rw) : ORIGIN = 0x20000000, LENGTH = 6K` and rebuilds. The line `_estack = ORIGIN(RAM) + LENGTH(RAM);` is unchanged. Which value does the core load into SP at reset?  
A) `0x20001800`  
B) `0x20003000`  
C) `0x20000000`  
D) `0x20001770`

> **Answer: A)** `6K` is 6 × 1024 = 6144 bytes = `0x1800`, so `_estack = 0x20000000 + 0x1800 = 0x20001800`. `vectors[0]` holds `&_estack`, the table is the first word of FLASH, and the hardware loads that word into SP before any code runs, so no line of C has to change. B is the old 12 KB top, but `_estack` is computed and moves with `LENGTH`. C is the bottom of RAM, and the stack grows down from the top. D reads 6K as 6000 = `0x1770`.  
> **Source:** L04 slide 13 `link.ld`, part 1, declaring the map · L04 slide 5 Reset, in hardware, before any code  
> **Notes:** [L04 › 14. link.ld part 1, MEMORY and the computed stack top](../notes/04_Week3_L04_Startup_LinkerScript.md#14-linkld-part-1-memory-and-the-computed-stack-top-slide-13)  
> **Visual:** [Sample 3 › Q15](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc15)

**16.** In `link.ld` a student moves the `.isr_vector` output section so that it comes after `.text` in FLASH, and changes nothing else. What happens?  
A) The linker stops with an error, because `.isr_vector` must be the first section in FLASH  
B) It builds with no error and no warning and gives a valid hex file, but a real chip cannot start, because the first two words of FLASH are now instruction bytes  
C) It builds and runs normally, because the core finds the section named `.isr_vector` at reset  
D) It builds and runs normally until the first interrupt, which hangs the board

> **Answer: B)** The core reads word 0 of FLASH into SP and word 1 into PC before any instruction runs, wherever the linker put the table. After the move those two words are the first bytes of `.text`, machine code, so SP and PC get meaningless values and the chip cannot start. Nothing complains. The compiler checks the language, the linker checks the arithmetic, and the hex checksums are correct, so A is wrong. Section names do not exist on the chip (C), and the failure comes at reset, before any interrupt (D).  
> **Source:** L04 slide 20 The lab, break it on purpose (exercise 3) · L04 slide 5 Reset, in hardware, before any code  
> **Notes:** [L04 › Lab takeaways](../notes/04_Week3_L04_Startup_LinkerScript.md#lab-takeaways)  
> **Visual:** [Sample 3 › Q16](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc16)

**17.** `GPIOA->ODR ^= (1u << 5);` toggles LD4 on PA5. The names `GPIOA` and `ODR` come from CMSIS, here ST's device header `stm32c031xx.h`. What does CMSIS do to make this line reach the pin?  
A) It links ST's HAL library, and `GPIOA->ODR` calls a library function that writes the register  
B) It supplies a special I/O instruction for the GPIO port, because GPIO sits outside the peripheral region at `0x50000000`  
C) `startup.c` fills a table of register addresses in RAM at reset, and `->` looks the address up at run time  
D) Nothing is linked or called: `GPIOA` is a pointer to a struct at a fixed address, so `GPIOA->ODR` is base + offset, `0x50000000 + 0x14 = 0x50000014`, worked out at compile time

> **Answer: D)** CMSIS is headers, not a library. It is `#define`s and struct declarations that put names on the addresses in ST's reference manual. `GPIOA` is a struct pointer with the value `0x50000000`, `ODR` sits at offset `0x14`, and the compiler turns the line into an ordinary load and store at `0x50000014`. CMSIS is not ST's HAL, which is a real library (A). This chip has no I/O instruction and no I/O address space, even for GPIO at `0x50000000` (B). Nothing is looked up at run time (C).  
> **Source:** L04 slide 4 The I/O map, `GPIOA->MODER` is an address · L04 slide 4b GPIO, every register on one page  
> **Notes:** [L04 › 4. The IO map, CMSIS, and base plus offset](../notes/04_Week3_L04_Startup_LinkerScript.md#4-the-io-map-cmsis-and-base-plus-offset-slide-4)  
> **Visual:** [Sample 3 › Q17](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc17)

**18.** Button C is wired from PA9 to GND, and PA9 is an input with the internal pull-up. `GPIOA->IDR` reads `0x0000A5F3`. What does `(GPIOA->IDR >> 9) & 1u` give, and is button C pressed?  
A) 1, so button C is released  
B) 0, so button C is released  
C) `0x52`, so button C is released  
D) 0, so button C is pressed

> **Answer: D)** `0xA5F3` is `1010 0101 1111 0011`, and bits 11:8 are the digit 5, `0101`, so bit 9 is 0. Shifting right by 9 brings bit 9 to bit 0 and `& 1u` keeps only that bit, giving 0. With a pull-up and a switch to GND the button is active low, so 0 means pressed. A reads a neighbouring bit (bits 8 and 10 are both 1), B forgets that the button is active low, and C forgets the mask (`0xA5F3 >> 9` = `0x52`).  
> **Source:** L05 slide 10 IDR, shift down and mask · L05 slide 19 pull-ups and active low · L05 slide 2 one hex digit is four bits  
> **Notes:** [L05 › 6. IDR, ODR and read-modify-write](../notes/06_Week4_L05_GPIO_Interrupts.md#6-idr-odr-and-read-modify-write-slides-10-11) · [L05 › 11. Buttons: pull-up, active low, bounce](../notes/06_Week4_L05_GPIO_Interrupts.md#11-buttons-pull-up-active-low-bounce-slides-19-20)  
> **Visual:** [Sample 3 › Q18](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc18)

**19.** `main()` used to turn PA5 on and PA4 off with the two lines below, and now and then PA6, which an interrupt handler turns on, went off again. It now runs `GPIOA->BSRR = 0x00100020;` instead. What does that write do, and why can the handler's change no longer be lost?  
```c
GPIOA->ODR |= 1u << 5;
GPIOA->ODR &= ~(1u << 4);
```

A) PA5 goes high and PA4 goes low in one store that reads nothing, so there is no stale copy of the port to write back  
B) PA5 goes high and PA4 goes low, and the handler's change is kept because `BSRR` is `volatile` and `ODR` is not  
C) PA5 goes high and every other pin of port A goes low, so PA6 still turns off  
D) PA4 goes high and PA5 goes low, in one store that an interrupt cannot split

> **Answer: A)** In `0x00100020`, bit 5 is in the set half (PA5 high) and bit 20 = 4 + 16 is in the reset half (PA4 low); every 0 bit leaves its pin alone. Each `ODR` line is a load, a change and a store, and a handler that runs between the load and the store has its change overwritten by `main()`'s stale copy. `BSRR` needs no load, so the single store is atomic. B is wrong because `volatile` only makes every access happen and cannot stop an interrupt between a load and a store, C treats a 0 bit as low, and D swaps the two halves.  
> **Source:** L05 slide 13 why BSRR is the safe one · L05 slide 12 BSRR set and reset halves · L05 slide 11 ODR is read, modify, write  
> **Notes:** [L05 › 7. BSRR, the safe one](../notes/06_Week4_L05_GPIO_Interrupts.md#7-bsrr-the-safe-one-slides-12-13) · [L05 › 6. IDR, ODR and read-modify-write](../notes/06_Week4_L05_GPIO_Interrupts.md#6-idr-odr-and-read-modify-write-slides-10-11)  
> **Visual:** [Sample 3 › Q19](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc19)

**20.** The vector table starts at `0x08000000`. The word at address `0x08000070` reads `0x08000A1D`. Which IRQ is this vector for, and where does its handler's first instruction sit?  
A) IRQ 12; the handler starts at `0x08000A1C`  
B) IRQ 28; the handler starts at `0x08000A1C`  
C) IRQ 12; the handler starts at `0x08000A1D`  
D) IRQ 12; the handler starts at `0x08000070`

> **Answer: A)** `0x70` is 112 bytes from the start of the table, and 112 / 4 = 28 is the vector number; the first 16 vectors belong to the core, so this is IRQ 28 − 16 = 12. The word is the handler's address with bit 0 set, the Thumb bit, so the code starts at `0x08000A1C`. B forgets to subtract 16, C keeps the Thumb bit in the address, and D takes the vector's own address for the handler's.  
> **Source:** L05 slide 27 the last hop, the vector table · L05 slide 27 the +1 is the Thumb bit  
> **Notes:** [L05 › 17. The vector table and the handler](../notes/06_Week4_L05_GPIO_Interrupts.md#17-the-vector-table-and-the-handler-slides-27-28)  
> **Visual:** [Sample 3 › Q20](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc20)

**21.** A third button is wired from PB9 to GND. It is set up with the lines below, and `EXTI4_15_IRQHandler` checks and clears bit 9 correctly. `EXTICR` is never written. The build has zero warnings. What happens when the PB9 button is pressed?  
```c
RCC->IOPENR |= RCC_IOPENR_GPIOBEN;
pin_mode(GPIOB, 9, MODE_INPUT);
pin_pull(GPIOB, 9, PULL_UP);
EXTI->FTSR1 |= 1u << 9;
EXTI->FPR1   = 1u << 9;
EXTI->IMR1  |= 1u << 9;
NVIC_EnableIRQ(EXTI4_15_IRQn);
```

A) It works, because the reset value of `EXTICR` lets every port's pin 9 into line 9  
B) The first press jumps to `Default_Handler` and the board hangs  
C) The edge latches in `FPR1` bit 9 but never reaches the NVIC  
D) Nothing happens, because line 9 still selects port A and watches PA9

> **Answer: D)** EXTI line 9 is a multiplexer that passes pin 9 of one port, chosen by line 9's field in `EXTICR[2]` (bits 15:8). That field resets to 0, port A, so the line watches PA9, PB9's edges never reach EXTI, `FPR1` bit 9 stays 0 and the handler never runs. The fix is code 1 (port B) in that field, `EXTICR[2]` = `0x00000100`. A is wrong because only one port at a time gets through, B is the misspelt-handler symptom, and C is the missing-`IMR1` symptom, where the edge does latch.  
> **Source:** L05 slide 33 seven ways to get silence, row 4 · L05 slide 24 hop 1, EXTICR selects the port  
> **Notes:** [L05 › 14. Hop 1: EXTICR, which port feeds this line](../notes/06_Week4_L05_GPIO_Interrupts.md#14-hop-1-exticr-which-port-feeds-this-line-slide-24) · [L05 › 20. Seven ways to get silence, and the debugger](../notes/06_Week4_L05_GPIO_Interrupts.md#20-seven-ways-to-get-silence-and-the-debugger-slides-33-33b)  
> **Visual:** [Sample 3 › Q21](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc21)

**22.** `EXTI4_15_IRQHandler` serves lines 4 to 15. After it has handled line 9's falling edge, it must clear line 9's pending bit and leave every other line's pending edge for the next call. Which line does that?  
A) `EXTI->FPR1 |= 1u << 9;`  
B) `EXTI->FPR1 = 1u << 9;`  
C) `EXTI->FPR1 &= ~(1u << 9);`  
D) `EXTI->FPR1 = 0;`

> **Answer: B)** `FPR1` is write 1 to clear. Writing a 1 clears that line's pending bit and writing a 0 does nothing, so `1u << 9` clears line 9 alone. A reads `FPR1` first and writes every other pending 1 back, which clears edges nobody has handled. C writes 0 to bit 9, so line 9 stays pending and the handler is entered again and again, and it clears the other lines' edges as well; D writes only zeros, clears nothing, and the handler runs forever.  
> **Source:** L05 slide 25 pending registers are write 1 to clear · L05 slide 29 write 1 to clear, or run forever · L05 slide 26 vectors are shared  
> **Notes:** [L05 › 15. Hop 2: edges, pending, mask](../notes/06_Week4_L05_GPIO_Interrupts.md#15-hop-2-edges-pending-mask-slide-25) · [L05 › 18. Write 1 to clear, and the handler name](../notes/06_Week4_L05_GPIO_Interrupts.md#18-write-1-to-clear-and-the-handler-name-slides-29-30)  
> **Visual:** [Sample 3 › Q22](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc22)

**23.** TIM3 is a 16-bit timer clocked at 48 MHz. It must raise an update event every 100 ms. Which register values do that?  
A) `PSC = 4799`, `ARR = 999`  
B) `PSC = 47`, `ARR = 99999`  
C) `PSC = 4800`, `ARR = 1000`  
D) `PSC = 479`, `ARR = 999`

> **Answer: A)** 48 MHz / 4800 = 10 kHz, one count every 100 µs, and 1000 counts of 100 µs make 100 ms: 48 000 000 / (4800 × 1000) = 10 Hz. B would be right with a 1 µs count, but 100 000 counts do not fit a 16-bit `ARR` (at most 65 535): only the low 16 bits of `0x1869F` stay, `0x869F` = 34 463, and the period is 34.464 ms. C forgets the −1 in both registers (100.1 ms, and nothing complains); D counts at 100 kHz and updates every 10 ms.  
> **Source:** L06 slide 5b a timer is a counter with three registers · L06 slide 5 TIM3 and TIM14 are 16-bit timers  
> **Notes:** [L06 › 6. Time base: PSC, ARR, CNT](../notes/07_Week5_L06_Time_Timers.md#6-time-base-psc-arr-cnt-slide-5b)  
> **Visual:** [Sample 3 › Q23](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc23)

**24.** `TIM3_CH1` is AF1 on PA6, but the code puts PA6 in alternate-function mode with AF number 2. Everything else is as in the lesson: 1 µs counts, a 20 ms frame, and a report line that counts TIM3 updates per second. What does the board show?  
A) The report still reads `TIM3 50/s` and `CCR1` still follows the target, but the servo never moves  
B) TIM3 stops counting, so the report reads `TIM3 0/s`  
C) The servo moves, but every pulse is about 2 % too long  
D) The update handler re-enters forever and `millis()` stops

> **Answer: A)** The AF number only picks which peripheral drives the pin. With AF2, PA6 is electrically fine but driven by another peripheral or by nothing, while TIM3 inside the chip still counts, interrupts and updates `CCR1`: the timer works, the pin doesn't. B is the symptom of a missing clock gate, C of a missing −1 in `PSC`, and D of clearing `UIF` by writing 1.  
> **Source:** L06 slide 10 getting the signal out, the AF table · L06 slide 17 the pin's AF number  
> **Notes:** [L06 › 11. Getting the signal out, the AF table](../notes/07_Week5_L06_Time_Timers.md#11-getting-the-signal-out-the-af-table-slide-10)  
> **Visual:** [Sample 3 › Q24](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc24)

**25.** In the lesson the TIM14 echo capture gets NVIC priority 1, the TIM3 update priority 2 and SysTick priority 3 (0 is the most urgent), though a viewer cares more about the servo, driven by TIM3, than about the clock. Which rule picks this order?  
A) Importance to the user: the job that matters most gets the most urgent priority  
B) Deadline: the job that must be served soonest gets the most urgent priority  
C) IRQ number: the lower IRQ number gets the more urgent priority  
D) Origin: a core exception such as SysTick always ranks below the vendor's peripheral interrupts

> **Answer: B)** Priority follows deadline, not significance (deadline-monotonic). The capture must be read before the next edge overwrites `CCR1`, the update only has to set `CCR1` within the 20 ms frame, and a late SysTick tick is still counted. A is the rule the slide rejects. C cannot be it, because TIM3 is IRQ 16 and TIM14 is IRQ 19, and the IRQ number only breaks ties between equal priorities; D is false, because `SysTick_Config` chose 3 and SysTick's level sits in `SHPR3` like any other.  
> **Source:** L06 slide 15 three interrupts, three priorities · L06 slide 2 priority 3, the lowest  
> **Notes:** [L06 › 18. Three interrupts, three priorities](../notes/07_Week5_L06_Time_Timers.md#18-three-interrupts-three-priorities-slide-15)  
> **Visual:** [Sample 3 › Q25](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc25)

**26.** At 48 MHz, LD4 must toggle once a second while the superloop also prints report lines that each take several milliseconds. Which code does it?  
A) `SysTick_Config(SystemCoreClock);` and toggle LD4 in `SysTick_Handler`  
B) `SysTick_Config(SystemCoreClock / 1000u);` and, in the loop, `if (now - beat_at >= 1000) { beat_at += 1000; toggle_ld4(); }`  
C) SysTick at 1 ms with no interrupt; the loop waits for `COUNTFLAG` and toggles LD4 on every 1000th wrap  
D) `SysTick->LOAD = SystemCoreClock - 1u;  SysTick->CTRL = 7u;` and toggle LD4 in `SysTick_Handler`

> **Answer: B)** SysTick is a 24-bit down-counter, so its longest period is 2²⁴ clocks, about 350 ms at 48 MHz. A asks for `LOAD` = 47 999 999, more than `0xFFFFFF` = 16 777 215, so `SysTick_Config` returns 1 and configures nothing: LD4 never toggles. D writes the same value directly, only its low 24 bits (`0xDC6BFF`) stay, and LD4 toggles about every 0.3 s. C polls, and `COUNTFLAG` remembers only one wrap, so all but one millisecond of every print is lost and the heartbeat runs slow.  
> **Source:** L06 slide 2 SysTick_Config() is five lines you can read · L06 slide 1 the millisecond that lied · L06 slide 3 millis()  
> **Notes:** [L06 › 2. SysTick Config, five readable lines](../notes/07_Week5_L06_Time_Timers.md#2-systick-config-five-readable-lines-slide-2)  
> **Visual:** [Sample 3 › Q26](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc26)

**27.** `os_start()` must make PendSV and SysTick the least urgent exceptions on the chip. In `SHPR3`, SysTick's priority is bits 31:30 and PendSV's is bits 23:22; these are the only implemented bits (`__NVIC_PRIO_BITS = 2`). Which 32-bit value written to `SHPR3` does it?  
A) `0x00000000`  
B) `0x03030000`  
C) `0xC0C00000`  
D) `0x80800000`

> **Answer: C)** In the NVIC numbering 0 is most urgent, so the least urgent level is 3, binary `11`. Each priority byte keeps only its top two bits, so 3 becomes `3 << 6` = `0xC0` in SysTick's byte (bits 31:24) and in PendSV's byte (bits 23:16): `0xC0C00000`. A sets both to 0, the most urgent level, which is the kernel's numbering (idle = 0) applied to the NVIC. B writes 3 into the low bits, which are not implemented, so both stay at 0, and D sets only bits 31 and 23, which is priority 2.  
> **Source:** L07 slide 4 SHPR3, two implemented bits per byte · L07 slide 4b both system handlers at priority 3 · L07 slide 9 two numberings  
> **Notes:** [L07 › 5. The System Control Block: ICSR and SHPR3](../notes/08_Week6_L07_RTOS.md#5-the-system-control-block-icsr-and-shpr3-slide-4)  
> **Visual:** [Sample 3 › Q27](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc27)

**28.** A student edits `os_task_create()` so that every new task's forged frame holds `xPSR = 0x00000000` instead of `0x01000000`. Everything else is unchanged. What happens after `os_start()`?  
A) The tasks run normally: the flags N, Z, C and V simply start at 0  
B) The first switch into a task HardFaults at that task's first instruction, because T = 0 asks for ARM state, which the M0+ does not have  
C) The tasks run on MSP instead of PSP, because the forged xPSR no longer selects the process stack  
D) The kernel runs until the first SysTick, which faults because the frame the hardware pushes now has T = 0

> **Answer: B)** The hardware pops the forged xPSR on the first switch into each task, when PendSV returns with `0xFFFFFFFD`. Bit 24, T, must be 1: the M0+ runs only Thumb code, so T = 0 asks for ARM state and the core HardFaults at the task's first instruction. The flags (A) are harmless; the stack is chosen by EXC_RETURN bit 2, not by xPSR (C); and the hardware always stacks the live xPSR, whose T bit is 1, so only the forged word is wrong, and it is read on the first switch (D).  
> **Source:** L07 slide 8 the first switch, forging a frame · L07 slide 3b EXC_RETURN picks PSP  
> **Notes:** [L07 › 10. Forging the first frame](../notes/08_Week6_L07_RTOS.md#10-forging-the-first-frame-slide-8)  
> **Visual:** [Sample 3 › Q28](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc28)

**29.** Three tasks run on this kernel: high (priority 3), mid (2) and low (1). Low locks a mutex. While low holds it, high asks for the same mutex and blocks. Then mid, which never uses the mutex, becomes READY and computes for 120 ms. With `OS_PRIORITY_INHERIT` set to 1, what does the kernel do?  
A) Low inherits mid's priority, 2, so low and mid take turns, one tick each  
B) Nothing: high waiting for low is ordinary blocking, so mid runs its 120 ms first  
C) Low runs at high's priority, 3, until it unlocks, so mid cannot preempt it and high waits only for low's critical section  
D) Mid's priority is lowered to 0 while high waits, so low can finish first

> **Answer: C)** Without a fix this is priority inversion: mid preempts low, low cannot unlock, and high ends up waiting for mid, a task it outranks, for as long as mid runs. Priority inheritance lends the holder the waiter's priority, so low runs at 3 until it unlocks, drops back to its `base_prio` 1, and high goes. A lends the wrong priority, so high would still wait through mid's turns; B is the unbounded inversion itself; and D is not what the kernel does, since it raises the holder and never lowers a third task.  
> **Source:** L07 slide 13 priority inversion · L07 slide 14 priority inheritance  
> **Notes:** [L07 › 16. Priority inheritance, measured](../notes/08_Week6_L07_RTOS.md#16-priority-inheritance-measured-slide-14)  
> **Visual:** [Sample 3 › Q29](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc29)

**30.** In `PendSV_Handler` on the Cortex-M0+, the old task's r4–r7 are already stored and `r0` points at the next free word of its stack. Which sequence stores r8–r11 next?  
A) `stmia r0!, {r8-r11}`  
B) `push {r8-r11}`  
C) `str r8, [r0, #0]` … `str r11, [r0, #12]`  
D) `mov r4, r8` / `mov r5, r9` / `mov r6, r10` / `mov r7, r11`, then `stmia r0!, {r4-r7}`

> **Answer: D)** The M0+ runs Thumb-1, where `stm` and `ldm` have an 8-bit register list, one bit for each of r0–r7, so they cannot name r8–r11. The kernel copies r8–r11 into r4–r7, which are already saved and free, with `mov`, one of the few Thumb-1 instructions that reach r8–r12, and stores those. A is the Cortex-M3 form, which does not exist on this core; `str` also takes only r0–r7 (C); and `push` lists only r0–r7 and lr, and in PendSV it would use MSP, not the task's stack (B).  
> **Source:** L07 slide 7 why r8–r11 go the long way round · L07 slide 6 the switch, as compiled  
> **Notes:** [L07 › 9. Why r8-r11 go the long way round](../notes/08_Week6_L07_RTOS.md#9-why-r8-r11-go-the-long-way-round-slide-7)  
> **Visual:** [Sample 3 › Q30](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc30)

**31.** USART2 is clocked at 48 MHz and `BRR` reads 5000 (8N1). Lesson 04's polled `_write()` sends a 48-character line. For about how long does that `printf` call hold the CPU?  
A) 4.2 ms  
B) 50 ms  
C) 40 ms  
D) Almost no time: `printf` returns as soon as the text is in a buffer

> **Answer: B)** 48 000 000 / 5000 = 9600 baud. Each byte is 10 bits on the wire (start, 8 data, stop), so 960 bytes a second, and 48 bytes take 48 / 960 s = 50 ms, all of it spent by the polled `_write()` waiting on each byte. C counts only the 8 data bits, and A uses the 86.8 µs byte time of 115 200 baud. D describes lesson 08's interrupt-driven `_write()`, which returns once the text is in the ring.  
> **Source:** L08 slide 1b BRR · L08 slide 2 ten bits per byte, a polled printf holds the CPU · L08 slide 7 printf returns when the text is in the ring  
> **Notes:** [L08 › 3. One byte on the wire](../notes/09_Week7_L08_UART_PythonHost.md#3-one-byte-on-the-wire-slide-2) · [L08 › 9. Replacing the printf back end: weak again](../notes/09_Week7_L08_UART_PythonHost.md#9-replacing-the-printf-back-end-weak-again-slide-7)  
> **Visual:** [Sample 3 › Q31](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc31)

**32.** `host.py --file` reads a capture of ten `$TEL` frames, `seq` 0 to 9, and nothing else. In transit the `seq` 4 frame `$TEL,5000,4,500,0,0*75` arrived as `$TEL,5000,4,600,0,0*75`; nothing else was damaged or lost. What does host.py's summary line `frames good …, bad …, lost (sequence gaps) …` report?  
A) good 10, bad 0, lost 0  
B) good 9, bad 1, lost 0  
C) good 9, bad 0, lost 1  
D) good 9, bad 1, lost 1

> **Answer: D)** `5` → `6` changes one byte (`35 ^ 36` = `03`), and XOR catches any change confined to one byte: the body now gives `76`, not `75`, so the line is counted bad and never half-used. Its `seq` 4 therefore never arrives intact, and the next good frame jumps from `seq` 3 to 5, which host.py counts as a gap. A assumes XOR misses a changed digit, B forgets the gap, and C forgets that a damaged line is counted, not silently dropped.  
> **Source:** L08 slide 10 any single flipped bit · L08 slide 13 a line altered in transit is counted bad and is also a gap · L08 slide 15 checked data, not trusted data  
> **Notes:** [L08 › 15. A measured session and host.py](../notes/09_Week7_L08_UART_PythonHost.md#15-a-measured-session-and-hostpy-slides-11-13) · [L08 › 14. What XOR catches and what it misses](../notes/09_Week7_L08_UART_PythonHost.md#14-what-xor-catches-and-what-it-misses-slide-10)  
> **Visual:** [Sample 3 › Q32](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc32)

**33.** The `else` branch that turns `TXEIE` off is deleted from `USART2_IRQHandler`, leaving the transmit branch below; `_write()` still turns `TXEIE` on after filling the ring. What happens after reset?  
```c
if ((USART2->CR1 & USART_CR1_TXEIE_TXFNFIE) && (isr & USART_ISR_TXE_TXFNF)) {
    if (tx_tail != tx_head) {
        USART2->TDR = tx_ring[tx_tail];
        tx_tail = (tx_tail + 1) % 256;
    }
}
```

A) Every line prints normally; after each line the handler runs once more, finds the ring empty and returns  
B) Nothing is printed, not even the banner  
C) Every line prints, a little slower: while the UART is idle, the handler runs once per byte time  
D) The build warns that `TXEIE` is turned on but never off, so the fault is caught before it runs

> **Answer: B)** `TXE` means the transmit register is empty, so it stays 1 whenever the UART is idle, and only a write to `TDR` clears it. Once the ring is empty nothing writes `TDR`, `TXEIE` stays on, and the handler is entered again the instant it returns, at priority 1, above everything that could put more data in: measured, not even the banner, from a build with zero warnings (so not D). A and C picture an interrupt that fires once, or on a timer, but an enabled interrupt whose flag stays set fires continuously.  
> **Source:** L08 slide 6 TXEIE on only while there is work · L08 slide 14 turning TXEIE off when empty  
> **Notes:** [L08 › 8. TXEIE on only while there is work](../notes/09_Week7_L08_UART_PythonHost.md#8-txeie-on-only-while-there-is-work-slide-6) · [L08 › 16. The silent-failure checklist, UART edition](../notes/09_Week7_L08_UART_PythonHost.md#16-the-silent-failure-checklist-uart-edition-slide-14)  
> **Visual:** [Sample 3 › Q33](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s3-mc33)
