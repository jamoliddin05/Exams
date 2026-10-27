# Embedded System and Software Design: Midterm Sample 2

Lessons 00-08 (the scope of the professor's guide, `../slides/exam_midterm_overview.md`) · 60 minutes · 33 multiple choice × 1 mark, options A-D, closed book, no calculator · Q1-4 L00 · Q5-8 L01 · Q9-11 L02 · Q12-14 L03 · Q15-17 L04 · Q18-22 L05 · Q23-26 L06 · Q27-30 L07 · Q31-33 L08 · Answer and explanation under each question

Each answer has a **Source** line with the slides (L05 slide 12 = lesson 05 deck, slide 12; decks in `../slides/source/`) and a **Notes** link to the notes section that explains it.

## Multiple choice (33 × 1 = 33 marks)

**1.** A packet arrives in `uint8_t buf[8]` at address `0x20000100`. It holds the bytes `11 22 33 44 55 66 77 88`, `buf[0]` first. One field is the little-endian `uint32_t` stored at `buf + 1`. Which line puts that field into `uint32_t v` on the Cortex-M0+?  
A) `v = *(uint32_t *)(buf + 1);`  
B) `v = (uint32_t)buf[1] << 24 | buf[2] << 16 | buf[3] << 8 | buf[4];`  
C) `v = *(uint32_t *)buf >> 8;`  
D) `v = buf[1] | buf[2] << 8 | buf[3] << 16 | (uint32_t)buf[4] << 24;`

> **Answer: D)** The field is the bytes `22 33 44 55`, and little-endian puts the first byte lowest, so the value is `0x55443322`. D builds exactly that from byte loads, which are always aligned. A is a word load from `0x20000101`, which is not a multiple of 4, so the M0+ HardFaults (an M3 or M4 would return `0x55443322`, more slowly). B assembles the bytes big-endian (`0x22334455`), and C loads the aligned word `0x44332211` and shifts it to `0x00443322`, which loses `0x55`.  
> **Source:** L00 slide 10 natural alignment, the M0+ faults on an unaligned access, casting a `uint8_t*` buffer to `uint32_t*` · L00 slide 10 little-endian · L00 slide 17 item 9  
> **Notes:** [L00 › 11. The data model: width, alignment, byte order](../notes/01_Week2_L00_ProgrammersModel.md#11-the-data-model-width-alignment-byte-order-slide-10)  
> **Visual:** [Sample 2 › Q1](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc1)

**2.** On an AVR, a lookup table was declared `PROGMEM` and read with `pgm_read_byte()`. Ported to the STM32C031, it becomes the code below, and the table is placed in flash. What does the second line do?
```c
const uint8_t gamma[256] = { 0, 0, 1, 1, 2, 2, 3, 4, /* ... */ };
uint8_t y = gamma[i];
```

A) It reads SRAM at the table's address, because an ordinary load reaches only the data space  
B) It raises a HardFault, because an ordinary load may not read the flash region  
C) It reads the byte from flash with an ordinary load, because code and data share one address space  
D) It reads a copy of the table that the startup code placed in SRAM, so the load never touches flash

> **Answer: C)** The STM32C031 has one unified (von Neumann) address space, and a `const` array in flash is read by the same `ldr` as anything else. `PROGMEM` "has no equivalent here and needs none". A is Harvard thinking: on the AVR one address names two places, which is why `LPM` existed. Nothing faults (B), and a `const` table stays in flash with no SRAM copy (D).  
> **Source:** L00 slide 4 Harvard vs von Neumann, `PROGMEM` has no equivalent here · L00 slide 15 code and data · L00 slide 17 item 13  
> **Notes:** [L00 › 4. Reaching a device: memory mapped vs port mapped IO](../notes/01_Week2_L00_ProgrammersModel.md#4-reaching-a-device-memory-mapped-vs-port-mapped-io-slide-4)  
> **Visual:** [Sample 2 › Q2](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc2)

**3.** A small 8-bit controller sends every interrupt to one fixed address. The code there reads status registers one by one to find which source fired, then calls the right routine. What is this scheme called, and what does the STM32C031 do instead?  
A) Vectored dispatch. The STM32C031 instead polls each peripheral's status register from `main()`  
B) Non-vectored dispatch. The STM32C031 is vectored: the source's number indexes a table of handler addresses  
C) Non-vectored dispatch. The STM32C031 is vectored, and like the AVR its table entries are jump instructions  
D) Vectored dispatch. The STM32C031 uses the same scheme, with the NVIC as the status register that software reads

> **Answer: B)** One fixed entry point whose code must "interrogate the hardware to discover who called" is non-vectored dispatch, cheap in silicon and slower in software. On this chip the source has a number, the number indexes a table, and the hardware goes straight to the handler. Vectored machines differ in what a slot holds: jump instructions on the AVR, descriptors on x86, plain addresses here, so C is wrong. A and D give the described scheme the wrong name.  
> **Source:** L00 slide 9 vectored vs non-vectored dispatch, what the table holds · L00 slide 15 interrupt vectors  
> **Notes:** [L00 › 10. The exception model: vectored dispatch](../notes/01_Week2_L00_ProgrammersModel.md#10-the-exception-model-vectored-dispatch-slide-9)  
> **Visual:** [Sample 2 › Q3](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc3)

**4.** You meet a peripheral the course never covers, ST's I2C1. Its chapter lists `CR1` (peripheral enable, interrupt enables), `ISR` (flags such as `TXIS`, `RXNE`, `BUSY`), `TXDR` and `RXDR`. Using the programmer's model, which reading is right?  
A) Control: `CR1`. Status: `ISR`. Data: `TXDR`, `RXDR`. Look it up in ST's reference manual  
B) Control: `CR1`. Status: `ISR`. Data: `TXDR`, `RXDR`. Look it up in ARM's Cortex-M Generic User Guide  
C) Control: `ISR`. Status: `CR1`. Data: `TXDR`, `RXDR`. Look it up in ST's reference manual  
D) Control: `TXDR`. Status: `RXDR`. Data: `CR1`, `ISR`. Look it up in ARM's Cortex-M Generic User Guide

> **Answer: A)** "Configure with CONTROL. Watch with STATUS. Move bytes through DATA." You write the settings in `CR1`, the hardware reports what happened in `ISR`, and `TXDR` and `RXDR` carry the payload out and in, the same roles as USART's `CR1`, `ISR`, `TDR` and `RDR`. I2C is ST's peripheral, so ST's reference manual describes it (B and D are wrong). ARM's Generic User Guide covers only ARM's own blocks: NVIC, SysTick, SCB and MPU.  
> **Source:** L00 slide 6 control, status, data · L00 slide 7 two kinds of peripheral, two manuals · L00 slide 2 which part of the model is this · L00 slide 17 items 5 and 6  
> **Notes:** [L00 › 7. Every peripheral has the same three registers](../notes/01_Week2_L00_ProgrammersModel.md#7-every-peripheral-has-the-same-three-registers-slide-6)  
> **Visual:** [Sample 2 › Q4](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc4)

**5.** With signed `int`s, `if (a < b) goto L;` compiles to one instruction on RISC-V, `blt a0, a1, L`, but to two on the Cortex-M0+, `cmp r0, r1` and then `blt L`. What is the reason?  
A) The Cortex-M0+ is a condition-code machine: `cmp` subtracts, throws the result away and sets N Z C V in APSR, and the next branch reads those flags; RISC-V has no flags register and compares inside the branch  
B) The Cortex-M0+ is a register–memory machine, so `cmp` must first fetch `a` and `b` from memory  
C) `cmp` writes `a − b` into `r0`, and `blt` then tests whether `r0` is negative  
D) ARM flags can feed only one branch, so a `cmp` must come before every conditional branch

> **Answer: A)** This chip remembers a comparison in four flag bits at the top of APSR. `cmp` sets them and a later branch reads them. RISC-V is a compare-and-branch machine with no flags register, so `blt a0, a1, L` does both jobs at once. B is wrong: both machines are load–store and both compare registers. C is wrong: `cmp` discards the difference, and `r0` keeps `a`. D has it backwards: what ARM gains from flags is density, because one `cmp` can feed several branches.  
> **Source:** L01 slide 7 Flags and conditional branches, condition-code vs compare-and-branch machines · Guide §2 key contrasts, condition codes vs compare-and-branch  
> **Notes:** [L01 › 7. Flags and conditional branches](../notes/02_Week2_L01_InstructionSet_Thumb.md#7-flags-and-conditional-branches-slide-7)  
> **Visual:** [Sample 2 › Q5](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc5)

**6.** `main` calls this hand-written function with `bl log_value`. `uart_send` is a leaf function that returns with `bx lr`. What happens when `log_value` runs?  
```text
08000300 <log_value>:
 8000300:  movs  r0, #65
 8000302:  bl    8000400 <uart_send>
 8000306:  bx    lr
```

A) It returns to `main` normally, because `bl log_value` pushed `main`'s return address onto the stack  
B) It never returns: `bl uart_send` overwrote `LR` with `0x08000307`, so `bx lr` keeps branching to itself  
C) It returns to `main` normally, because `uart_send` restores `main`'s return address in `LR` before it returns  
D) It HardFaults at `bx lr`, because `LR` holds an even address

> **Answer: B)** This chip keeps a return address in one link register. `bl log_value` put the way back to `main` in `LR`, and `bl uart_send` at `0x08000302` replaced it with `0x08000306 | 1 = 0x08000307`. After `uart_send` returns, `bx lr` branches to `0x08000306`, which is the `bx lr` itself, so the board hangs with no error. A function that calls another must `push {lr}` first and return with `pop {pc}`. A describes a stack-based machine such as the AVR. C is wrong: nothing writes `main`'s address back. D is wrong: `LR` is odd.  
> **Source:** L01 slide 8 Branches, calls and returns, link register vs stack-based, `push {lr}` in every non-leaf prologue · L01 slide 20 `LR = next | 1`  
> **Notes:** [L01 › 8. Branches, calls and returns](../notes/02_Week2_L01_InstructionSet_Thumb.md#8-branches-calls-and-returns-slide-8)  
> **Visual:** [Sample 2 › Q6](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc6)

**7.** `r1` holds the GPIOA base address, `ODR` is at offset `0x14`, and `r0` holds `0x20`. Which instruction sequence does the Cortex-M0+ execute for `GPIOA->ODR |= (1u << 5);`?  
A) `orrs [r1, #0x14], r0`  
B) `ldr r2, [r1, #0x14]`, then `bics r2, r0`, then `str r2, [r1, #0x14]`  
C) `str r0, [r1, #0x14]`  
D) `ldr r2, [r1, #0x14]`, then `orrs r2, r0`, then `str r2, [r1, #0x14]`

> **Answer: D)** The M0+ is load–store: the ALU takes registers only, so `|=` on a register in memory is a read (`ldr`), a modify (`orrs`) and a write (`str`). That is three instructions and two bus accesses, with a gap between the read and the write. A does not exist: an ALU operand in memory is the register–memory model, and the M0+ has no single-instruction bit set like the AVR's `sbi`. B is `&= ~` and clears PA5. C is a plain `=`: it writes `0x20` to the whole register and switches off every other pin of port A.  
> **Source:** L01 slide 4 Load / Store, setting one bit is a read, a modify and a write, no `sbi` on M0+ · L01 slide 5 `orrs` is `|=`, `bics` is `&= ~` · L01 slide 11 the same pattern in `SystemInit`  
> **Notes:** [L01 › 4. Load and store: the two machine models](../notes/02_Week2_L01_InstructionSet_Thumb.md#4-load-and-store-the-two-machine-models-slide-4)  
> **Visual:** [Sample 2 › Q7](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc7)

**8.** `r4` holds the base address of a peripheral with 32-bit registers. On the Cortex-M0+, which of these loads cannot be encoded as one 16-bit `ldr`, so the compiler must first add to the base (a Cortex-M4 does it in one instruction)?  
A) `ldr r0, [r4, #0x1C]`  
B) `ldr r0, [r4, #0x7C]`  
C) `ldr r0, [r4, #0x80]`  
D) `ldr r0, [r4, #0x40]`

> **Answer: C)** The 16-bit `ldr Rt, [Rn, #imm]` keeps the offset in a 5-bit field counted in words, so it reaches 0 to 31 × 4 = 124 bytes. `0x80` = 128 bytes = 32 words, one past the limit. `0x1C` = 28 (field 7), `0x7C` = 124 (field 31, the last offset that fits) and `0x40` = 64 (field 16) all fit. The Cortex-M3 and M4 have 32-bit encodings that reach ±4095.  
> **Source:** L01 slide 10 Offsets are small, `ldr` 5 bits scaled by 4 reaches 0 to 124 bytes · L01 slide 16 Thumb-1 vs Thumb-2, `ldr` offset 0–124 vs ±4095  
> **Notes:** [L01 › 10. Offsets are small, and you can see when they run out](../notes/02_Week2_L01_InstructionSet_Thumb.md#10-offsets-are-small-and-you-can-see-when-they-run-out-slide-10)  
> **Visual:** [Sample 2 › Q8](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc8)

**9.** `startup.c` sets `SystemCoreClock` and `main.c` reads it. Both files include `clock.h`. Which arrangement builds and links without an error?  
A) `uint32_t SystemCoreClock = 12000000;` in both `startup.c` and `main.c`  
B) `extern uint32_t SystemCoreClock;` in `clock.h`, and no definition anywhere  
C) `extern uint32_t SystemCoreClock;` in `clock.h`, plus `uint32_t SystemCoreClock = 12000000;` in `startup.c` only  
D) `uint32_t SystemCoreClock = 12000000;` in `clock.h`

> **Answer: C)** Each `.c` file is compiled alone. `extern` is a declaration, so `main.o` leaves a hole and a note saying it needs `SystemCoreClock`. The linker matches every need to exactly one definition, and C has exactly one, in `startup.o`. A and D give two definitions (a definition in a header lands in every file that includes it), so the linker stops with `multiple definition of SystemCoreClock`; B gives none, so it stops with `undefined reference to SystemCoreClock`, the error the course's spike really hit.  
> **Source:** L02 slide 3 the linker matches every "needs" to exactly one "defines", `undefined reference`, `multiple definition`  
> **Notes:** [L02 › 3. The compiler sees one file at a time](../notes/03_Week3_L02_Development_Toolchain.md#3-the-compiler-sees-one-file-at-a-time-slide-3)  
> **Visual:** [Sample 2 › Q9](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc9)

**10.** A hex file for the STM32C031C6 contains these two consecutive records. At which address is the first data byte of the second record (`0A`) programmed?  
```text
:020000040800F2
:100120000A4B1B68013B0B4A13600B4B1A68FF21FB
```

A) `0x00000120`  
B) `0x08000120`  
C) `0x08000010`  
D) `0x00000920`

> **Answer: B)** The first record has type `04`, extended linear address: its data `0800` becomes the upper 16 bits of every following address. The second record reads `10` (16 data bytes), `0120` (offset) and `00` (data), so the address is `0x0800` in the upper half and `0x0120` in the lower half, `0x08000120`. A ignores the `04` record, which works only when all of flash fits in 16 bits of address, as on the 8-bit AVR. C takes the byte count `10` as the address, and D adds `0x0800 + 0x0120` instead of putting `0800` in the upper half.  
> **Source:** L02 slide 7 record fields, extended linear address record · L02 slide 10 item 6  
> **Notes:** [L02 › 7. What actually gets programmed: elf, bin, hex](../notes/03_Week3_L02_Development_Toolchain.md#7-what-actually-gets-programmed-elf-bin-hex-slide-7)  
> **Visual:** [Sample 2 › Q10](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc10)

**11.** On a laptop, two programs run at the same time, and each keeps its own data at address `0x400000` without disturbing the other. What makes this possible, and why can't the STM32C031C6 do the same?  
A) The compiler gives each program its own `0x400000`; the chip's compiler cannot, because the chip has only one RAM  
B) The loader moves one of the two programs to a free address when it starts; the chip has no loader  
C) An MMU translates every address while the programs run (run-time binding), so `0x400000` means a different physical place for each; the chip has no MMU, so its addresses are bound at build time and each is one real location  
D) The OS saves one program's `0x400000` to disk while the other runs; the chip has no disk

> **Answer: C)** This is run-time binding: an MMU translates each program's addresses while it runs, so two programs can both believe they own `0x400000`. This chip has no MMU and no loader, so binding happens at build time and is burned into the image, and `0x20000000` is one real SRAM word for every piece of code. B is load-time binding, which gives the second program a different address, so it would no longer use `0x400000`. The compiler sees one file at a time and fixes no final address (A), and swapping to disk does not let two running programs share an address (D).  
> **Source:** L02 slide 2 a desktop binds late, run time with an MMU · L02 slide 10 item 7 · Guide §2 key contrasts, address binding  
> **Notes:** [L02 › 2. Five stages, not one, and address binding](../notes/03_Week3_L02_Development_Toolchain.md#2-five-stages-not-one-and-address-binding-slide-2)  
> **Visual:** [Sample 2 › Q11](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc11)

**12.** On the STM32C031 an interrupt handler is an ordinary function, `void TIM3_IRQHandler(void) { ... }`, with no special keyword or macro. Why can a plain C function safely interrupt any code?  
A) The compiler sees the `_IRQHandler` suffix and adds code that saves all sixteen registers.  
B) Handler mode has its own bank of `R0`–`R12`, so the interrupted code's registers are never touched.  
C) On entry the hardware itself stacks `R0`–`R3`, `R12`, `LR`, `PC` and `xPSR`, exactly the registers AAPCS lets a function destroy; the compiler saves any `R4`–`R11` the handler uses, as in every function.  
D) The startup code calls every handler through a wrapper function that saves and restores all registers.

> **Answer: C)** The eight hardware-stacked registers (8 words, 32 bytes) are the caller-saved set of AAPCS plus `PC` and `xPSR`. The callee-saved `R4`–`R11` are preserved by the handler's ordinary prologue. From the interrupted code's point of view, nothing it relies on changes, so the handler can be an ordinary C function. A is wrong because the name only matters to the linker, which puts the address in the vector table; a misspelt name compiles to an unused function. B is wrong because the core has one set of `R0`–`R12`. D is wrong because the hardware jumps straight to the address in the vector table.  
> **Source:** L03 slide 2 an interrupt is a hardware-forced function call · L01 slide 18 caller-saved and callee-saved registers  
> **Notes:** [L03 › 2. Interrupt entry and exit](../notes/05_Week4_L03_Execution_Concurrency.md#2-interrupt-entry-and-exit-slide-2)  
> **Visual:** [Sample 2 › Q12](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc12)

**13.** `volatile uint64_t ticks;` is incremented by the SysTick handler and read in `main()` without masking. The read compiles to two 32-bit loads, low word first. `ticks` is `0x00000000_FFFFFFFF` when `main()` loads the low word, and the SysTick handler runs before `main()` loads the high word. What value does `main()` get?  
A) `0x00000000_FFFFFFFF`  
B) `0x00000001_FFFFFFFF`  
C) `0x00000001_00000000`  
D) `0x00000000_00000000`

> **Answer: B)** The low word is loaded before the increment, so it is the old `0xFFFFFFFF`. The increment carries into the high word, which becomes `0x00000001`, and `main()` loads that new high word. Half old and half new gives `0x00000001_FFFFFFFF` = 8 589 934 591, a value nobody ever stored and about twice the real count. This is tearing; `volatile` does not prevent it. A is the old value and C the new one: a critical section around the copy gives one of them. D is what a high-word-first read would give, the counter seeming to jump back to 0.  
> **Source:** L03 slide 7 tearing, `uint64_t` row · L03 slide 10 item 11  
> **Notes:** [L03 › 7. What needs protecting, and tearing](../notes/05_Week4_L03_Execution_Concurrency.md#7-what-needs-protecting-and-tearing-slide-7)  
> **Visual:** [Sample 2 › Q13](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc13)

**14.** `main()` and a timer ISR both increment `uint32_t counter` on the STM32C031, which has one Cortex-M0+ core. Which code in `main()` makes its increment safe?  
A) `volatile uint32_t counter;` and a plain `counter++;`  
B) `os_mutex_lock(&m); counter++; os_mutex_unlock(&m);`  
C) `do { v = __LDREXW(&counter); } while (__STREXW(v + 1, &counter));`  
D) `__disable_irq(); counter++; __enable_irq();`

> **Answer: D)** Between an ISR and `main()` on one core, mutual exclusion comes from turning interrupts off: the other context cannot run if it cannot start. `__disable_irq()` is `cpsid i`, which sets bit 0 of `PRIMASK`, so the `ldr`, `adds`, `str` become indivisible; `cpsie i` clears it. A only makes the accesses real, and the lost update still happens. B is the tool for two threads under an OS: a mutex asks the scheduler not to switch, but the hardware starts an ISR without asking the scheduler. C is the two-core tool, and the Cortex-M0+ has neither `ldrex` nor `strex`.  
> **Source:** L03 slide 5 this chip's answer, a critical section by masking · L03 slide 5 how you get mutual exclusion, by contexts  
> **Notes:** [L03 › 5. Hazard two: the interrupt lands mid-update](../notes/05_Week4_L03_Execution_Concurrency.md#5-hazard-two-the-interrupt-lands-mid-update-slide-5)  
> **Visual:** [Sample 2 › Q14](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc14)

**15.** `int limit = 50;` is a global that the program changes at run time, and it must hold 50 again after every power-on. `Reset_Handler` copies `.data` from `_sidata`, defined in `link.ld` as `_sidata = LOADADDR(.data);`. Which `link.ld` line places `.data` correctly?  
A) `.data : { _sdata = .; *(.data*) _edata = .; } >FLASH`  
B) `.data : { _sdata = .; *(.data*) _edata = .; } >RAM`  
C) `.data : { _sdata = .; *(.data*) _edata = .; } >FLASH AT> RAM`  
D) `.data : { _sdata = .; *(.data*) _edata = .; } >RAM AT> FLASH`

> **Answer: D)** `>RAM AT> FLASH` gives `.data` two addresses. It lives in RAM, where the program can write it (the VMA), and it is stored in FLASH, which keeps 50 through power-off (the LMA). `LOADADDR(.data)` is the FLASH copy, so `Reset_Handler` copies 50 into RAM before `main()`. A leaves `limit` in FLASH, which ordinary stores cannot change. B stores nothing in FLASH, so the 50 is gone after power-off, and the copy loop copies RAM onto itself. C is backwards: the variable would run from FLASH and be stored in RAM, which is empty at reset.  
> **Source:** L04 slide 14 `link.ld`, part 2, placing the sections · L04 slide 10 Why `.data` has two addresses  
> **Notes:** [L04 › 15. link.ld part 2, SECTIONS and the location counter](../notes/04_Week3_L04_Startup_LinkerScript.md#15-linkld-part-2-sections-and-the-location-counter-slide-14)  
> **Visual:** [Sample 2 › Q15](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc15)

**16.** `arm-none-eabi-size -A` prints the sections below for a build, and there are no others. How much FLASH and how much RAM does the linker report as used?  
```text
section               size
.isr_vector            180
.text                 4000
.rodata                800
.data                  120
.bss                   400
._user_heap_stack     1536
```

A) FLASH 4980 B, RAM 2056 B  
B) FLASH 5500 B, RAM 2056 B  
C) FLASH 5100 B, RAM 2056 B  
D) FLASH 5100 B, RAM 520 B

> **Answer: C)** FLASH holds the vectors, `.text`, `.rodata` and the stored copy of `.data`: 180 + 4000 + 800 + 120 = 5100. RAM holds `.data`, `.bss` and the heap and stack reservation: 120 + 400 + 1536 = 2056. `.data` is counted in both, because it lives in RAM and is stored in FLASH. A forgets the FLASH copy of `.data`. B also counts `.bss`, which gets no FLASH at all, only a size. D leaves out the 1536-byte heap and stack reservation.  
> **Source:** L04 slide 15 Where the memory actually went · L04 slide 9 Your program has four kinds of bytes  
> **Notes:** [L04 › 16. Where the memory actually went](../notes/04_Week3_L04_Startup_LinkerScript.md#16-where-the-memory-actually-went-slide-15)  
> **Visual:** [Sample 2 › Q16](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc16)

**17.** `startup.c` declares the line below, and `nm` shows `Default_Handler` at `0x08000678`. A student enables the TIM3 interrupt and defines `void TIM3_IRQhandler(void) { ... }` in `main.c`. The build has no errors and no warnings. Which value does TIM3's entry in the vector table hold?  
```c
void TIM3_IRQHandler(void) __attribute__((weak, alias("Default_Handler")));
```

A) `0x08000679`, the address of `Default_Handler` with the Thumb bit set  
B) `0x08000678`, the address of `Default_Handler`  
C) `0x00000000`, because no `TIM3_IRQHandler` was defined  
D) The address of the student's `TIM3_IRQhandler` plus 1, because it is the only TIM3 handler in the program

> **Answer: A)** The name is the registration. `TIM3_IRQhandler` has a lower-case `h`, so it is a different symbol and overrides nothing. The weak alias stays, and the table holds `Default_Handler`'s address with the Thumb bit, `0x08000678 + 1 = 0x08000679`. The first TIM3 interrupt runs `Default_Handler`'s `for (;;)`, and the board hangs. B has bit 0 clear, and an even entry faults on the first instruction. C is wrong because the weak alias always fills the slot. D is wrong because the linker matches names exactly.  
> **Source:** L04 slide 8 Weak aliases, and the trap that costs an afternoon · L04 slide 7 the Thumb bit  
> **Notes:** [L04 › 10. Weak aliases and the misspelling trap](../notes/04_Week3_L04_Startup_LinkerScript.md#10-weak-aliases-and-the-misspelling-trap-slide-8)  
> **Visual:** [Sample 2 › Q17](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc17)

**18.** PA10 must carry alternate function 1 (AF1), and its `MODER` field already holds `10`. Which line writes AF1 into PA10's field and leaves every other pin's AF number as it was?  
A) `GPIOA->AFR[1] = (GPIOA->AFR[1] & ~(0xFu << 8)) | (1u << 8);`  
B) `GPIOA->AFR[0] = (GPIOA->AFR[0] & ~(0xFu << 8)) | (1u << 8);`  
C) `GPIOA->AFR[1] = (GPIOA->AFR[1] & ~(3u << 20)) | (1u << 20);`  
D) `GPIOA->AFR[1] = (GPIOA->AFR[1] & ~(0xFu << 10)) | (1u << 10);`

> **Answer: A)** `AFR` gives each pin 4 bits, pins 0–7 in `AFR[0]` and pins 8–15 in `AFR[1]`. PA10 is in `AFR[10 / 8]` = `AFR[1]` at bits 4 × (10 mod 8) + 3 : 4 × (10 mod 8) = 11:8, so the mask is `0xFu << 8` and AF1 is `1u << 8`. B uses the right bits of the wrong register, which are PA2's field; C uses the 2-bit rule and lands inside PA13's field (bits 23:20), a debug pin; D shifts by n, which puts a 1 at bit 10 (AF4 in PA10's field) and clears half of PA11's field.  
> **Source:** L05 slide 14 AFR, which peripheral gets the pin · L05 slide 4 AFR[n / 8] bits 4(n mod 8)+3 : 4(n mod 8)  
> **Notes:** [L05 › 8. AFR, which peripheral gets the pin](../notes/06_Week4_L05_GPIO_Interrupts.md#8-afr-which-peripheral-gets-the-pin-slide-14) · [L05 › 3. The one rule: pin n lives at n, 2n or 4n](../notes/06_Week4_L05_GPIO_Interrupts.md#3-the-one-rule-pin-n-lives-at-n-2n-or-4n-slide-4)  
> **Visual:** [Sample 2 › Q18](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc18)

**19.** The LED bar on PB7–PB0 is written with the line below. What value is written to `BSRR` when `leds` is `0x0C`?  
```c
GPIOB->BSRR = ((uint32_t)(uint8_t)~leds << 16) | leds;
```

A) `0x000C00F3`  
B) `0xFFF3000C`  
C) `0x0000000C`  
D) `0x00F3000C`

> **Answer: D)** The low half is `leds` = `0x000C`, which sets PB3 and PB2. `~leds` cut to 8 bits is `0xF3`, and shifted up 16 it becomes the reset half, which resets PB7–PB4, PB1 and PB0; bits 31:24 stay 0, so PB8–PB15 are untouched. A swaps the halves, B is the value without the `(uint8_t)` cast (its extra 1s in bits 31:24 also reset PB8–PB15), and C sets PB3 and PB2 but leaves the other six LEDs as they were.  
> **Source:** L05 slide 12 BSRR, the LED bar worked example · L05 slide 4 BSRR set bit n, reset bit n+16  
> **Notes:** [L05 › 7. BSRR, the safe one](../notes/06_Week4_L05_GPIO_Interrupts.md#7-bsrr-the-safe-one-slides-12-13)  
> **Visual:** [Sample 2 › Q19](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc19)

**20.** TIM3's interrupt is IRQ 16, and the vector table starts at `0x08000000`. At which address does the CPU read TIM3's vector?  
A) `0x08000080`  
B) `0x08000040`  
C) `0x08000020`  
D) `0x08000081`

> **Answer: A)** The first 16 vectors belong to the core, so IRQ 16 is vector 16 + 16 = 32, and each vector is 4 bytes, so the address is `0x08000000 + 32 × 4` = `0x08000000 + 0x80` = `0x08000080`. B forgets the 16 core vectors and C forgets the × 4. D adds the Thumb bit to the wrong number; bit 0 is set in the word stored in the vector, the handler's address, while the vector itself sits at a multiple of 4.  
> **Source:** L05 slide 27 vector number = 16 + IRQ, address 0x08000000 + vector × 4 · L05 slide 27 the Thumb bit in the stored word  
> **Notes:** [L05 › 17. The vector table and the handler](../notes/06_Week4_L05_GPIO_Interrupts.md#17-the-vector-table-and-the-handler-slides-27-28)  
> **Visual:** [Sample 2 › Q20](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc20)

**21.** Button B's handler is written as below. Everything else in button B's setup is right, and the build reports zero warnings. What happens at the first press of button B?  
```c
void EXTI0_1_IRQhandler(void)          /* lower-case h */
{
    uint32_t mask = 1u << 1;
    if ((EXTI->RPR1 | EXTI->FPR1) & mask) {
        EXTI->RPR1 = mask;
        EXTI->FPR1 = mask;
        b_edges++;
    }
}
```

A) The handler runs as usual, because the linker matches symbol names without regard to case  
B) The CPU jumps to `Default_Handler`, an infinite loop, and the board hangs  
C) Nothing visible happens; the edge stays latched in `FPR1` and `main()` keeps running  
D) The handler is entered again and again, because its pending bit is never cleared

> **Answer: B)** `startup.c` fills vector 21 with a weak `EXTI0_1_IRQHandler` that points at `Default_Handler`, and only a function with exactly that name replaces it. The misspelt function is a different symbol that nothing calls, so the linker drops it as dead code, the build stays clean, and the first press jumps to `Default_Handler` and loops there. A is wrong since C names are case-sensitive, C describes a masked line (`IMR1` not set or the NVIC not enabled), and D is the missing pending clear, which needs the handler to run in the first place.  
> **Source:** L05 slide 30 the name is the only connection · L05 slide 33 seven ways to get silence, row 7  
> **Notes:** [L05 › 18. Write 1 to clear, and the handler name](../notes/06_Week4_L05_GPIO_Interrupts.md#18-write-1-to-clear-and-the-handler-name-slides-29-30) · [L05 › 20. Seven ways to get silence, and the debugger](../notes/06_Week4_L05_GPIO_Interrupts.md#20-seven-ways-to-get-silence-and-the-debugger-slides-33-33b)  
> **Visual:** [Sample 2 › Q21](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc21)

**22.** Two chips must share one wire, and either one may pull it low at any moment, as on I²C's data line. How should each chip's pin be set up?  
A) Push-pull (`OTYPER` = 0) on both, so each chip drives the wire firmly high and low  
B) Push-pull with `OSPEEDR` = `11`, so the faster edges let the right chip win  
C) Open-drain (`OTYPER` = 1) on both, with a pull-up resistor on the wire  
D) Open-drain (`OTYPER` = 1) on both, with no resistor, since each chip drives the high itself

> **Answer: C)** An open-drain pin can only pull low or let go, and the pull-up makes the high. The worst case is then both chips pulling low, and the wire reads 1 only when every chip lets go, a wired-AND. With push-pull (A, B), one chip driving high while the other drives low connects 3.3 V to GND through two transistors, a short, and `OSPEEDR` only changes the slope of the edges. D has nothing to make the high, so the released wire floats.  
> **Source:** L05 slide 7 OTYPER, push-pull and open-drain · L05 slide 8 OSPEEDR is the edge slope  
> **Notes:** [L05 › 5. OTYPER, OSPEEDR and PUPDR in detail](../notes/06_Week4_L05_GPIO_Interrupts.md#5-otyper-ospeedr-and-pupdr-in-detail-slides-7-9)  
> **Visual:** [Sample 2 › Q22](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc22)

**23.** At 48 MHz, TIM3 channel 1 runs in PWM mode 1 on PA6 with `PSC = 23`, `ARR = 39999` and `CCR1 = 3000`. What signal does PA6 carry?  
A) A 3.0 ms high pulse every 40 ms  
B) A 3.0 ms high pulse every 20 ms  
C) 18.5 ms high, then 1.5 ms low, every 20 ms  
D) A 1.5 ms high pulse every 20 ms, the servo's centre position

> **Answer: D)** 48 MHz / (23 + 1) = 2 MHz, so one count is 0.5 µs. The frame is ARR + 1 = 40 000 counts = 20 ms (50 Hz), and PWM mode 1 holds the pin high while `CNT < CCR1`: 3000 counts × 0.5 µs = 1.5 ms. "CCR1 is the pulse width in microseconds" holds only at the lesson's 1 µs count (`PSC = 47`); A applies it to both registers and B to `CCR1` alone. C reads mode 1 backwards.  
> **Source:** L06 slide 5b f_update = f_clk / ((PSC+1)(ARR+1)) · L06 slide 8 PWM mode 1 · L06 slide 9 the signal a servo reads  
> **Notes:** [L06 › 9. Output compare, the timer draws a waveform](../notes/07_Week5_L06_Time_Timers.md#9-output-compare-the-timer-draws-a-waveform-slide-8)  
> **Visual:** [Sample 2 › Q23](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc23)

**24.** The superloop below runs three jobs, and `now` is read once per pass. The report job is changed so that it takes 130 ms. At t = 1000 ms the loop runs the ping, then starts the report. When does the next ping run, and when is the one after it due?  
```c
for (;;) {
    uint32_t now = millis();
    if (now - ping_at   >= 100)  { ping_at   += 100;  ranger_ping(); }
    if (now - report_at >= 1000) { report_at += 1000; report();      }
    if (now - beat_at   >= 500)  { beat_at   += 500;  toggle_ld4();  }
}
```

A) At 1100 ms: the SysTick interrupt stops the report and runs the ping on time  
B) The 1100 ms ping is skipped; the next ping runs at 1200 ms  
C) At about 1130 ms, when the report returns; the one after it is still due at 1200 ms  
D) At about 1130 ms, and every later ping is 30 ms late too: 1230, 1330, ...

> **Answer: C)** This is cooperative scheduling: a job stops only when it returns, so the ping due at 1100 ms waits for the report and runs at 1130 ms. `ping_at += 100` makes `ping_at` 1100, so the schedule stays on the 100 ms grid and the next ping is due at 1200 ms. A describes preemption: the SysTick handler only counts milliseconds, and taking the CPU away from a job is what lesson 07's kernel adds. B is wrong because `now - ping_at` is 130 when the loop comes back, so the late ping still runs; D is what `ping_at = now` would do.  
> **Source:** L06 slide 4 doing several things at once without waiting · L06 slide 18 the superloop has a ceiling  
> **Notes:** [L06 › 4. Cooperative scheduling without waiting](../notes/07_Week5_L06_Time_Timers.md#4-cooperative-scheduling-without-waiting-slide-4)  
> **Visual:** [Sample 2 › Q24](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc24)

**25.** At 48 MHz a fresh TIM3 is set up as below for one update per second, but the `EGR = UG` line was left out. When do the update interrupts come?  
```c
TIM3->PSC   = 999;
TIM3->ARR   = 47999;
TIM3->DIER |= TIM_DIER_UIE;
TIM3->CR1  |= TIM_CR1_CEN;     /* ARPE stays 0 */
```

A) The first after 1 ms, then one every second  
B) Never: `PSC` stays in its preload register, so the counter never counts  
C) One every second from the start, since both registers take effect when written  
D) One every millisecond, forever

> **Answer: A)** `PSC` is double-buffered: the write lands in the preload register, and the counter keeps the reset prescaler of 0 until the next update event. The first period is therefore 48 000 counts at 48 MHz = 1 ms (`ARR` took effect at once because `ARPE` is 0). That update copies 999 across, and from then on 48 000 000 / (1000 × 48 000) = 1 Hz. B and D forget that the counter runs and that the update copies the preload; C forgets the preload.  
> **Source:** L06 slide 6 shadow registers, and why UG comes first · L06 slide 17 EGR = UG after setting PSC/ARR  
> **Notes:** [L06 › 7. Shadow registers, and why UG comes first](../notes/07_Week5_L06_Time_Timers.md#7-shadow-registers-and-why-ug-comes-first-slide-6)  
> **Visual:** [Sample 2 › Q25](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc25)

**26.** TIM14 counts at 1 MHz and captures both edges of the echo on PA7, with `CC1IE` set. Which body of `TIM14_IRQHandler` stores the edge's own timestamp in `t` and acknowledges the capture interrupt?  
A) `t = (uint16_t)TIM14->CNT;  TIM14->SR = TIM_SR_CC1IF;`  
B) `t = (uint16_t)TIM14->CNT;  TIM14->SR = ~TIM_SR_CC1IF;`  
C) `t = (uint16_t)TIM14->CNT;`  
D) `t = (uint16_t)TIM14->CCR1;`

> **Answer: D)** At the edge the hardware copied `CNT` into `CCR1`, so `CCR1` holds the edge's time, and reading `CCR1` clears `CC1IF`, the only clearing convention that needs no write. `CNT` is the time now, late by the interrupt latency, so A, B and C store the wrong time. B at least clears the flag, since timer flags clear by writing 0; A writes 1, which leaves `CC1IF` set, and C clears nothing, so both re-enter forever.  
> **Source:** L06 slide 13 reading CCR1 clears CC1IF · L06 slide 12 the hardware takes the timestamp · L06 slide 7 timer flags clear by writing 0  
> **Notes:** [L06 › 14. Measuring the echo with TIM14](../notes/07_Week5_L06_Time_Timers.md#14-measuring-the-echo-with-tim14-slide-13)  
> **Visual:** [Sample 2 › Q26](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc26)

**27.** A student wants the CPU hog to be the least urgent task. Thinking of the NVIC, where 0 is most urgent, they create it with priority 4. The other tasks keep theirs: button 3, bar 2, report 1, idle 0. The hog never sleeps. What does the board do?  
A) The hog is now the most urgent task and is always READY, so the bar, the buttons and the report never run again  
B) The hog runs only when every other task is asleep, as the student intended  
C) `os_task_create()` rejects priority 4, because `__NVIC_PRIO_BITS = 2` allows only 0–3, so the hog never runs  
D) Round-robin gives each of the five tasks one tick in turn, so the hog gets a fifth of the CPU

> **Answer: A)** In this kernel a higher number is more urgent, so 4 puts the hog above every other task. `pick()` always runs the highest-priority READY task, and the hog never leaves READY, so nothing else is ever picked: the LED bar freezes, the buttons die and the report stops. `__NVIC_PRIO_BITS` limits interrupt priorities, not the kernel's task numbers (C), and round-robin (D) only shares the CPU among tasks of equal priority.  
> **Source:** L07 slide 9 who runs next, two numberings · L07 slide 1 the job that never yields  
> **Notes:** [L07 › 11. The scheduler rule: who runs next](../notes/08_Week6_L07_RTOS.md#11-the-scheduler-rule-who-runs-next-slide-9)  
> **Visual:** [Sample 2 › Q27](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc27)

**28.** In this kernel, `schedule()` runs inside `SysTick_Handler` and inside other handlers, such as a UART receive interrupt. When it finds that another task should run, it only writes `SCB->ICSR = SCB_ICSR_PENDSVSET_Msk`. Why is the switch itself left to `PendSV_Handler`?  
A) Handlers run unprivileged, and only PendSV is allowed to write PSP  
B) A switch must never happen inside another handler; PendSV has the lowest priority, so it runs only when no other handler is active, on the way back to a task  
C) PendSV is the most urgent exception, so pending it makes the switch happen before the deciding handler's next instruction  
D) Only PendSV's entry makes the hardware stack r4–r11; other exceptions stack only 8 words

> **Answer: B)** Deciding can happen anywhere; switching happens in one place, PendSV, which is pended by software and set to priority 3, the lowest. A handler's own frame is on MSP and half-finished, and swapping the task beneath it would return it into the wrong world, so PendSV waits until every other handler has finished and tail-chains on the way back to a task. Handlers always run privileged (A), priority 3 is the least urgent NVIC level (C), and every exception entry stacks the same 8 words while r4–r11 are saved by PendSV's own code (D).  
> **Source:** L07 slide 4b PendSV, deciding vs switching · L07 slide 4c task switching, the flow  
> **Notes:** [L07 › 6. PendSV: deciding vs switching](../notes/08_Week6_L07_RTOS.md#6-pendsv-deciding-vs-switching-slides-4b-4c)  
> **Visual:** [Sample 2 › Q28](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc28)

**29.** Inside `HardFault_Handler`, the `lr` register holds `0xFFFFFFF1`. The handler tests bit 2 of `lr` to find which stack holds the faulting frame. Which reading is correct?  
A) The frame is on PSP; a task was running in Thread mode  
B) The frame is on MSP; an exception handler was running  
C) The frame is on PSP; an exception handler was running  
D) The frame is on MSP; `main()` was running in Thread mode, before the first switch

> **Answer: B)** The low nibble of `0xFFFFFFF1` is `0001`: bit 2 = 0 selects MSP, and bit 3 = 0 means the return goes to Handler mode, so a handler faulted. A task's fault gives `0xFFFFFFFD` (low nibble `1101`: Thread mode, PSP), the value every switch in this kernel returns with. D is `0xFFFFFFF9` (`1001`: Thread mode, MSP), and C matches no EXC_RETURN value, since handlers always run on MSP.  
> **Source:** L07 slide 3b two stack pointers, EXC_RETURN · L07 slide 18 bit 2 of lr says which stack  
> **Notes:** [L07 › 4. MSP vs PSP and the EXC RETURN values](../notes/08_Week6_L07_RTOS.md#4-msp-vs-psp-and-the-exc-return-values-slides-3b-18)  
> **Visual:** [Sample 2 › Q29](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc29)

**30.** Tasks low (priority 1) and high (priority 2) share a table. Low's update of the table takes about 30 ms; high only reads it, using the same protection as low. The button task (priority 3) never touches the table and must stay on time. Which code should surround low's update?  
A) `__disable_irq(); update_table(); __enable_irq();`  
B) `while (busy) { } busy = 1; update_table(); busy = 0;`  
C) `SCB->ICSR = SCB_ICSR_PENDSVCLR_Msk; update_table();`  
D) `os_mutex_lock(&m); update_table(); os_mutex_unlock(&m);`

> **Answer: D)** A mutex holds up only the tasks that want this table: high, if it asks during the update, is BLOCKED off the CPU, while the button task and every interrupt carry on. Masking interrupts (A) is for a few instructions; for 30 ms it freezes every task and every interrupt, the tick included. In B, high spins on `busy` at a higher priority than low, so low never runs again to clear it. C cancels only the switch pending now; the next tick pends PendSV again, and high can read a half-written table.  
> **Source:** L07 slide 12 masking interrupts vs a mutex · L07 slide 4b PENDSVCLR cancels a pending switch  
> **Notes:** [L07 › 14. The mutex](../notes/08_Week6_L07_RTOS.md#14-the-mutex-slide-12)  
> **Visual:** [Sample 2 › Q30](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc30)

**31.** A firmware sets `USART2->BRR = 417`, computed for 48 MHz and 115 200 baud, but it never raises the clock: the core and USART2 still run at the reset 12 MHz. The PC terminal is set to 115 200 baud, 8N1. What does the terminal show when the board prints its banner?  
A) Nothing at all: USART2 cannot run from a 12 MHz clock  
B) Garbage characters  
C) The banner, arriving four times more slowly  
D) The banner: the receiver resynchronises on every start bit, so the rate error does not matter

> **Answer: B)** `BRR` counts clocks per bit, so 417 clocks of 12 MHz make every bit four times too long: the board sends at 12 000 000 / 417 ≈ 28 800 baud, a quarter of the terminal's rate, and the terminal samples the wrong bits. Slide 14: `BRR` for the wrong clock gives "garbage characters". C fails because a UART shares no clock, so both ends must agree on the rate beforehand, and D because resynchronising on each start bit absorbs a few percent, not a factor of four. A is the symptom of a missing `USART2EN` clock gate.  
> **Source:** L08 slide 1b BRR, 0.08 % and the few percent a UART tolerates · L08 slide 14 BRR for the wrong clock  
> **Notes:** [L08 › 2. Clock gate, pins and baud rate](../notes/09_Week7_L08_UART_PythonHost.md#2-clock-gate-pins-and-baud-rate-slide-1b) · [L08 › 16. The silent-failure checklist, UART edition](../notes/09_Week7_L08_UART_PythonHost.md#16-the-silent-failure-checklist-uart-edition-slide-14)  
> **Visual:** [Sample 2 › Q31](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc31)

**32.** The board receives four damaged copies of the frame `$LED,85*6C`. In ASCII, `4` = `0x34`, `5` = `0x35`, `6` = `0x36`, `8` = `0x38`, `9` = `0x39`. Which one passes the board's checksum check?  
A) `$LED,84*6C`  
B) `$LED,86*6C`  
C) `$LED,94*6C`  
D) `$LED,8*6C`

> **Answer: C)** XOR misses two errors in the same bit position of different bytes, because they cancel: `8` → `9` flips bit 0 (`38 ^ 39` = `01`) and `5` → `4` flips bit 0 again (`35 ^ 34` = `01`), so the checksum stays `6C` and the board sets the bar to 94. A is a single flipped bit, which XOR always catches (`6D`). B flips two bits inside one byte (`35 ^ 36` = `03`, giving `6F`), and D loses a byte, which takes `0x35` out of the XOR (`59`).  
> **Source:** L08 slide 10 what XOR catches, and what it does not  
> **Notes:** [L08 › 14. What XOR catches and what it misses](../notes/09_Week7_L08_UART_PythonHost.md#14-what-xor-catches-and-what-it-misses-slide-10)  
> **Visual:** [Sample 2 › Q32](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc32)

**33.** Each line below is meant to clear the interrupt flag named after it, on the STM32C031. Which line does clear it?  
A) `uint8_t c = (uint8_t)USART2->RDR;` for USART2 `RXNE`  
B) `USART2->ISR &= ~USART_ISR_TXE;` for USART2 `TXE`  
C) `TIM3->SR = TIM_SR_UIF;` for TIM3 `UIF`  
D) `EXTI->FPR1 &= ~(1u << 1);` for EXTI line 1

> **Answer: A)** Reading `RDR` clears `RXNE`, one of five clearing conventions on this chip. B writes to `ISR`, which is read only, so nothing changes; `TXE` clears when a byte is written to `TDR`. C is the EXTI habit used on a timer: `UIF` clears by writing 0, so the 1 leaves it set and the 0s clear every other flag (right: `TIM3->SR = ~TIM_SR_UIF`). D does the reverse on a write-1-to-clear register: the 0 at bit 1 does nothing, and the 1s it writes back clear every other pending line.  
> **Source:** L08 slide 4 five conventions on one chip · L08 slide 1 ISR read only, ICR write 1 to clear  
> **Notes:** [L08 › 6. Five ways a flag clears](../notes/09_Week7_L08_UART_PythonHost.md#6-five-ways-a-flag-clears-slide-4)  
> **Visual:** [Sample 2 › Q33](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s2-mc33)
