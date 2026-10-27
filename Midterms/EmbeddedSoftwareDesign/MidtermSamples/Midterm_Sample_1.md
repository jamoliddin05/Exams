# Embedded System and Software Design: Midterm Sample 1

Lessons 00-08 (the scope of the professor's guide, `../slides/exam_midterm_overview.md`) · 60 minutes · 33 multiple choice × 1 mark, options A-D, closed book, no calculator · Q1-4 L00 · Q5-8 L01 · Q9-11 L02 · Q12-14 L03 · Q15-17 L04 · Q18-22 L05 · Q23-26 L06 · Q27-30 L07 · Q31-33 L08 · Answer and explanation under each question

Each answer has a **Source** line with the slides (L05 slide 12 = lesson 05 deck, slide 12; decks in `../slides/source/`) and a **Notes** link to the notes section that explains it.

## Multiple choice (33 × 1 = 33 marks)

**1.** `uint32_t x = 0x1A2B3C4D;` is stored at address `0x20000100` on the STM32C031. A debugger's memory view lists the bytes from `0x20000100` to `0x20000103`, lowest address first. What does it show?  
A) `1A 2B 3C 4D`  
B) `4D 3C 2B 1A`  
C) `D4 C3 B2 A1`  
D) `3C 4D 1A 2B`

> **Answer: B)** Every STM32 is little-endian, so the least significant byte goes to the lowest address. `0x4D` sits at `0x20000100`, then `0x3C` and `0x2B`, and `0x1A` sits at `0x20000103`. A is big-endian, the convention of the 68000 and of internet headers (network byte order). C reverses the hex digits instead of the bytes, and D puts the low halfword first but writes each halfword big-endian.  
> **Source:** L00 slide 10 little-endian, `0x12345678` puts `0x78` at byte 0 · L00 slide 10 big-endian machines and network byte order  
> **Notes:** [L00 › 11. The data model: width, alignment, byte order](../notes/01_Week2_L00_ProgrammersModel.md#11-the-data-model-width-alignment-byte-order-slide-10)  
> **Visual:** [Sample 1 › Q1](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc1)

**2.** An AVR reaches `PORTB` with the `IN` and `OUT` instructions, and reads a constant table in flash with `LPM` (the `PROGMEM` keyword). The STM32C031 reaches a GPIO register, a global variable and a `const` table in flash with the same `ldr` instruction. Which option names both machines' choices correctly?  
A) AVR: port-mapped I/O, Harvard. STM32C031: memory-mapped I/O, one von Neumann address space  
B) AVR: memory-mapped I/O, Harvard. STM32C031: port-mapped I/O, one von Neumann address space  
C) AVR: port-mapped I/O, von Neumann. STM32C031: memory-mapped I/O, Harvard  
D) AVR: port-mapped I/O, Harvard. STM32C031: memory-mapped I/O, Harvard, since some Cortex-M cores fetch code and data over separate buses

> **Answer: A)** `IN` and `OUT` reach a separate I/O space through dedicated instructions, which is port-mapped I/O. `LPM` exists because code and data live in separate address spaces, which is Harvard. The STM32C031 has no port space and one unified address space, so one `ldr` reaches everything and only the address tells a register from a variable. D is the trap: separate buses on some cores are an implementation choice, and the address map stays single.  
> **Source:** L00 slide 4 port-mapped vs memory-mapped I/O, Harvard vs von Neumann · L00 slide 15 AVR vs Cortex-M · L00 slide 17 items 12 and 13  
> **Notes:** [L00 › 4. Reaching a device: memory mapped vs port mapped IO](../notes/01_Week2_L00_ProgrammersModel.md#4-reaching-a-device-memory-mapped-vs-port-mapped-io-slide-4)  
> **Visual:** [Sample 1 › Q2](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc2)

**3.** In `startup.c`, a copy-paste slip puts `USART2_IRQHandler` in the vector-table entry that belongs to TIM3. The code builds with no warning. What happens when TIM3 raises its interrupt?  
A) The NVIC notices that the address is not TIM3's handler and raises a HardFault  
B) The NVIC looks up `TIM3_IRQHandler` by name and runs it, so the slip does no harm  
C) The CPU runs `Default_Handler`, because the function in TIM3's entry has the wrong name  
D) The CPU jumps to `USART2_IRQHandler` and runs it, because nothing checks what an entry holds

> **Answer: D)** Dispatch on this chip is vectored. TIM3's number indexes a table of plain addresses, and the hardware loads the address in that slot and jumps there, so "put the wrong address in a slot and the chip jumps there anyway". The hardware never sees names (B, C): a name only decides, at build time, which address goes into the table. Nothing checks who owns an address, so there is no fault (A).  
> **Source:** L00 slide 9 vectored dispatch, a table of plain addresses, the wrong address is jumped to anyway · L00 slide 17 item 11  
> **Notes:** [L00 › 10. The exception model: vectored dispatch](../notes/01_Week2_L00_ProgrammersModel.md#10-the-exception-model-vectored-dispatch-slide-9)  
> **Visual:** [Sample 1 › Q3](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc3)

**4.** Right after reset, the code writes `USART2->CR1 = 0x0000000D;` and then reads `USART2->CR1` back. It reads `0x00000000`. The build had no warnings and nothing faulted. What is the first suspect?  
A) The pin multiplexer: PA2 still belongs to GPIO, so USART2 cannot drive it  
B) The clock gate: USART2's enable bit in RCC is still 0, so the peripheral ignores the write  
C) The baud divisor: it was computed from the CPU clock instead of USART2's bus clock  
D) The register role: `CR1` is a status register, so the hardware overwrites what software writes

> **Answer: B)** Every peripheral powers up with its clock switched off, and "a peripheral with no clock reads back as zero and ignores every write", with no error. A wrong pin owner (A) leaves the pin silent, but `CR1` would still read back `0x0000000D`. A wrong divisor (C) puts garbage on the wire, and `CR1` still reads back too. `CR1` is a control register, which software writes (D).  
> **Source:** L00 slide 11 the clock gate, a peripheral with no clock reads back as zero · L00 slide 17 item 7 · L00 slide 6 control, status, data · L00 slide 12 a baud rate is a division  
> **Notes:** [L00 › 12. Two gates: clock gate and pin multiplexer](../notes/01_Week2_L00_ProgrammersModel.md#12-two-gates-clock-gate-and-pin-multiplexer-slide-11)  
> **Visual:** [Sample 1 › Q4](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc4)

**5.** On an x86 PC, `counter++` on a global `int` compiles to one instruction, `add dword [counter], 1`. On the STM32C031 the same line compiles to three: `ldr r0, [r1]`, `adds r0, r0, #1`, `str r0, [r1]`. What explains the difference, and what does it cost?  
A) The Cortex-M0+ is a register–memory machine, so its ALU must copy the value into a register before it can add to it  
B) The Cortex-M0+ is a load–store machine, so its three instructions make three bus accesses where the x86 makes one  
C) The x86 is a load–store machine too, but its decoder hides the load and the store inside one long instruction  
D) The Cortex-M0+ is a load–store machine: only `ldr` and `str` touch memory, so it needs more instructions, but both versions make the same two bus accesses

> **Answer: D)** On a load–store machine the ALU sees registers only, and memory is reached only by `ldr` and `str`. The x86 is register–memory, so one instruction reads `counter`, adds 1 and writes it back. Both versions read memory once and write it once: "load–store costs instructions, not memory traffic". B is the trap: `adds` works on `r0` and never touches the bus. A swaps the two models, and C misnames the x86, which is register–memory.  
> **Source:** L01 slide 4 Load / Store, two machine models, `counter++` costs 1 vs 3 instructions and 2 bus accesses each · Guide §2 key contrasts, load–store vs register–memory  
> **Notes:** [L01 › 4. Load and store: the two machine models](../notes/02_Week2_L01_InstructionSet_Thumb.md#4-load-and-store-the-two-machine-models-slide-4)  
> **Visual:** [Sample 1 › Q5](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc5)

**6.** A calibration offset is declared `uint32_t` by mistake. This time `get_offset()` returns −3. The code is built with `gcc -Os`. What does the board do?  
```c
uint32_t delta = get_offset();   /* returns -3 this time */
if (delta < 100) { ok(); } else { alarm(); }
```

A) It calls `ok()`, because −3 is less than 100  
B) It calls `ok()`, because `cmp` leaves N = 1 and the compiler branches on N with `blt`  
C) Nothing runs: the build fails, because −3 cannot be stored in a `uint32_t`  
D) It calls `alarm()`: `delta` is unsigned, so the compiler uses an unsigned branch (`bcc`/`bcs`), and `0xFFFFFFFD` read as unsigned is 4 294 967 293, which is not below 100

> **Answer: D)** −3 stored in a `uint32_t` is the bit pattern `0xFFFFFFFD`. The compiler picks the branch from the variable's type: an unsigned `<` becomes `cmp` and `bcc`/`bcs`, which read the carry flag. 4 294 967 293 ≥ 100, so C = 1 and `alarm()` runs. A and B describe a signed `int`, where `blt` reads N and V and −3 < 100 holds. C is wrong: the conversion is legal C and compiles without an error. This is the slide's "comparison that behaves oddly at the extremes of a range".  
> **Source:** L01 slide 7 Flags and conditional branches, `blt`/`bge` signed vs `bcc`/`bcs` unsigned · Guide §2 key contrasts, condition codes  
> **Notes:** [L01 › 7. Flags and conditional branches](../notes/02_Week2_L01_InstructionSet_Thumb.md#7-flags-and-conditional-branches-slide-7)  
> **Visual:** [Sample 1 › Q6](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc6)

**7.** In `main`, the instruction `bl clock_init` sits at address `0x08000312`. You stop the debugger at the first instruction of `clock_init`. What does `LR` read, and where does execution continue when `clock_init` returns with `bx lr`?  
A) `LR` is unchanged, because `bl` pushed the return address `0x08000316` onto the stack  
B) `LR = 0x08000316`, and execution continues at `0x08000316`  
C) `LR = 0x08000317`, and execution continues at `0x08000316`  
D) `LR = 0x08000315`, and execution continues at `0x08000314`

> **Answer: C)** `bl` is one of the six 32-bit instructions on this chip, so the next instruction starts at `0x08000312 + 4 = 0x08000316`. `bl` writes that address into `LR` with bit 0 set, the Thumb bit: `0x08000316 | 1 = 0x08000317`. `bx lr` branches to `LR & ~1 = 0x08000316`, so nothing is skipped. A describes a stack-based machine such as the AVR; this chip is a link-register machine. B forgets the Thumb bit, and D counts `bl` as 2 bytes.  
> **Source:** L01 slide 20 LR is odd too, `LR = next | 1`, `PC <- LR & ~1` · L01 slide 8 link register vs stack-based return · L01 slide 17 `bl` is 4 bytes  
> **Notes:** [L01 › 19. LR is odd too: reading a return address](../notes/02_Week2_L01_InstructionSet_Thumb.md#19-lr-is-odd-too-reading-a-return-address-slide-20)  
> **Visual:** [Sample 1 › Q7](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc7)

**8.** `SystemInit()` needs the FLASH base address `0x40022000` in `r2`. Which instruction or pair does `arm-none-eabi-gcc` emit for the Cortex-M0+?  
A) `movs r2, #0x40022000`  
B) `ldr r2, [pc, #44]`, which loads the word `0x40022000` from a literal pool stored in flash just after the function  
C) `lui r2, 0x40022` followed by `addi r2, r2, 0`  
D) `movw r2, #0x2000` followed by `movt r2, #0x4002`

> **Answer: B)** A 16-bit instruction cannot hold a 32-bit constant: the `movs` immediate is 8 bits, 0 to 255, so A cannot be encoded. ARM's answer is a literal pool: the compiler parks the word after the function and loads it relative to the PC. C is RISC-V's answer, two halves with `lui` and `addi`. D is the Thumb-2 answer on a Cortex-M3 or M4; `movw`/`movt` are not among the M0+'s six 32-bit instructions.  
> **Source:** L01 slide 12 Where do big constants live, literal pool loaded PC-relative · L01 slide 17 Thumb-1 plus six, M4 uses `movw`/`movt`  
> **Notes:** [L01 › 12. Literal pools: where big constants live](../notes/02_Week2_L01_InstructionSet_Thumb.md#12-literal-pools-where-big-constants-live-slide-12)  
> **Visual:** [Sample 1 › Q8](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc8)

**9.** Your laptop builds `hello.c` without any linker script from you, and the same binary runs at a different address on every launch. The STM32C031C6 build needs a hand-written `link.ld`, and `SystemCoreClock` is at `0x20000000` on every run. Which build stage reads `link.ld`, and why does only the embedded build need you to write it?  
A) Compile: the compiler needs the chip's addresses to generate Thumb instructions, and an x86 compiler does not  
B) Preprocess: `link.ld` supplies the `#define`s for the register addresses, which a laptop gets from the OS headers  
C) Link and locate: with no loader and no MMU, every name is bound to its real address at build time, so you must describe the memory map; the laptop binds at run time with an MMU  
D) Assemble: Thumb instructions are 16 bits wide, so the assembler needs `link.ld` to know where each instruction goes

> **Answer: C)** A name can be bound to its address at compile time, load time or run time. A laptop binds at run time: an MMU translates addresses while the program runs, so the same binary works wherever it lands. This chip has no loader and no MMU, so binding happens at build time and is burned into the image, and the locate stage does it from the memory map in `link.ld`. Preprocess, compile and assemble work on one file at a time and assign no final addresses (A, B, D).  
> **Source:** L02 slide 2 five stages, locate is the embedded one, address binding table · L02 slide 10 items 1 and 7  
> **Notes:** [L02 › 2. Five stages, not one, and address binding](../notes/03_Week3_L02_Development_Toolchain.md#2-five-stages-not-one-and-address-binding-slide-2)  
> **Visual:** [Sample 1 › Q9](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc9)

**10.** A project builds and runs. You add the three globals below. By how much do FLASH used and RAM used in the build's memory report grow? Ignore alignment.  
```c
const uint8_t lut[64] = {1, 2, 3};
uint32_t samples[32];
uint32_t gain = 3;
```

A) FLASH +196 B, RAM +196 B  
B) FLASH +64 B, RAM +132 B  
C) FLASH +68 B, RAM +132 B  
D) FLASH +68 B, RAM +196 B

> **Answer: C)** `lut` is `const`, so it goes in `.rodata`: 64 B of flash and no RAM. `samples` starts at zero, so it goes in `.bss`: 128 B of RAM and nothing in flash, because the image records only how many bytes to clear. `gain` has a starting value, so it is `.data` and costs both, 4 B of RAM for the variable and 4 B of flash for its initial value: FLASH 64 + 4 = 68, RAM 128 + 4 = 132. B forgets the flash copy of `.data`, D puts the `const` table in RAM, and A charges everything twice.  
> **Source:** L02 slide 4 four sections in flash and SRAM · L02 slide 5 `.data` exists twice, `.bss` costs nothing in flash · L02 slide 10 item 8  
> **Notes:** [L02 › 5. The awkward one: .data, and why .bss is free](../notes/03_Week3_L02_Development_Toolchain.md#5-the-awkward-one-data-and-why-bss-is-free-slide-5)  
> **Visual:** [Sample 1 › Q10](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc10)

**11.** In a student's `Reset_Handler` the `.data` copy is present, but the `.bss` loop was deleted by mistake. `static uint32_t presses;` counts button presses. Every test right after plugging the board in passes, but after pressing the reset button the count sometimes starts at a large number. What explains this?  
A) Without the `.bss` loop, `presses` starts as whatever that RAM held, and a reset does not clear SRAM, so after a reset it keeps the previous run's count  
B) The hardware zeroes RAM when power is applied, but the reset button skips that step  
C) `presses` is in `.data`, so its first value is copied from flash, and flash still holds the count from the last run  
D) The RAM `LENGTH` in `link.ld` is too large, so the linker placed `presses` past the end of real RAM

> **Answer: A)** A global or static with no initial value is in `.bss`, and only the `.bss` loop in `Reset_Handler` sets it to zero. Without that loop it starts as whatever RAM held, so the program works on a cold boot and misbehaves after a reset: what it sees depends on what ran before. The hardware's only act at reset is loading SP and PC from two words of flash, and it never clears RAM (B). Stores go to RAM and never back to flash (C), and `presses` sits near the start of `.bss`, far from the end of RAM (D).  
> **Source:** L02 slide 5 skip the `.bss` loop · L02 slide 8 the only step the hardware does · L02 slide 10 item 4  
> **Notes:** [L02 › 5. The awkward one: .data, and why .bss is free](../notes/03_Week3_L02_Development_Toolchain.md#5-the-awkward-one-data-and-why-bss-is-free-slide-5)  
> **Visual:** [Sample 1 › Q11](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc11)

**12.** A timer ISR sets a flag and `main()` waits for it. Built at `-O0`, the LED turns on. Built at `-Os`, it never does, although the ISR runs and sets `done`. What explains this, and what is the fix?  
```c
uint8_t done = 0;                         /* global */
void TIM3_IRQHandler(void) { /* ... */ done = 1; }
int main(void) {
    /* ... start the timer ... */
    while (done == 0) { }
    led_on();
}
```

A) The ISR's write lands in the middle of `main()`'s read-modify-write; wrap the loop in `__disable_irq()` / `__enable_irq()`.  
B) A one-byte flag tears when the ISR writes it; declare it `uint32_t`.  
C) At `-Os` interrupts stay masked while `main()` sits in an empty loop; call `__enable_irq()` inside the loop.  
D) By the as-if rule the compiler reads `done` once and loops on a register copy; declare it `volatile uint8_t done`.

> **Answer: D)** The loop body does not modify `done`, so by C's rules `done` cannot change inside it. The compiler may read it once and spin on the register (gcc emits one load and a branch to itself; clang may delete the loop). The ISR is an observer C does not know about, and `volatile` makes every read actually happen. A is the fix for the other hazard, and masking around the loop would even stop the ISR from ever running. B is wrong because a single byte is one access with one writer and cannot tear. C is wrong because optimisation does not touch `PRIMASK`.  
> **Source:** L03 slide 4 as-if rule and `volatile` · L01 slide 21 works at `-O0`, hangs at `-Os`  
> **Notes:** [L03 › 4. Hazard one: the compiler does not believe you](../notes/05_Week4_L03_Execution_Concurrency.md#4-hazard-one-the-compiler-does-not-believe-you-slide-4)  
> **Visual:** [Sample 1 › Q12](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc12)

**13.** `counter` holds 40. `main()` executes `counter++` as `ldr r0, [r1]` / `adds r0, #1` / `str r0, [r1]`. A timer interrupt is taken right after the `ldr`, and its handler executes `counter += 3` in full before `main()` resumes. Nothing else touches `counter`. What does `counter` hold after `main()`'s `str`?  
A) 41  
B) 43  
C) 44  
D) 40

> **Answer: A)** `main()` loaded 40 into `r0` before the interrupt. The handler reads 40, adds 3 and stores 43. Then `main()` adds 1 to its stale copy and stores 41 over the 43, so the handler's update is lost. 44 (C) is the correct total, which a critical section would give. 43 (B) would mean `main()`'s store was lost instead, and 40 (D) would need both updates lost.  
> **Source:** L03 slide 5 the interrupt lands mid-update · L01 slide 4 `x++` is three instructions on a load–store machine  
> **Notes:** [L03 › 5. Hazard two: the interrupt lands mid-update](../notes/05_Week4_L03_Execution_Concurrency.md#5-hazard-two-the-interrupt-lands-mid-update-slide-5)  
> **Visual:** [Sample 1 › Q13](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc13)

**14.** On the single-core STM32C031, `__disable_irq(); counter++; __enable_irq();` makes `main()`'s increment safe from an ISR. The same code is moved to a dual-core chip, where code on the other core also increments `counter`. What happens?  
A) It stays safe: `__disable_irq()` sets `PRIMASK` on both cores, so the other core waits too.  
B) Updates can still be lost: masking stops only the other context on this core, and the second core keeps running. Two cores need an atomic read-modify-write instruction such as `ldrex`/`strex`.  
C) Updates can still be lost, and declaring `counter` as `volatile` fixes it.  
D) It stays safe, because larger ARM cores do `counter++` in a single instruction.

> **Answer: B)** `PRIMASK` belongs to one core and only stops that core from taking interrupts. The other core runs its own `ldr`, `adds`, `str` at the same time, and the two sequences can interleave exactly as in the lost update. Mutual exclusion between cores needs an atomic read-modify-write instruction (`ldrex`/`strex` on larger ARM cores, `lock cmpxchg` on x86). The Cortex-M0+ has neither, which is why masking is this chip's answer. C fails because `volatile` makes accesses real, not indivisible. D fails because larger ARM cores are load–store too.  
> **Source:** L03 slide 5 how you get mutual exclusion, by contexts · L03 slide 10 item 10  
> **Notes:** [L03 › 5. Hazard two: the interrupt lands mid-update](../notes/05_Week4_L03_Execution_Concurrency.md#5-hazard-two-the-interrupt-lands-mid-update-slide-5)  
> **Visual:** [Sample 1 › Q14](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc14)

**15.** The first eight bytes of a firmware image, from `0x08000000` upward, are `00 30 00 20 1D 02 00 08`. At reset the core loads SP and PC from them before any instruction runs. What is the initial SP, and at which address is the first instruction of `Reset_Handler`?  
A) SP = `0x20003000`, `Reset_Handler` at `0x0800021C`  
B) SP = `0x20003000`, `Reset_Handler` at `0x0800021D`  
C) SP = `0x00300020`, `Reset_Handler` at `0x1D020008`  
D) SP = `0x0800021D`, `Reset_Handler` at `0x20003000`

> **Answer: A)** ARM is little-endian, so each group of four bytes reads right to left. Word 0 is `0x20003000`, the top of the 12 KB RAM, and the core loads it into SP. Word 1 is `0x0800021D`, and the core loads it into PC. Bit 0 of a code address is the Thumb bit, not part of the address, so `Reset_Handler` starts at `0x0800021C`. B keeps the Thumb bit in the address, C reads the bytes big-endian, and D swaps the two words.  
> **Source:** L04 slide 7 The first eight bytes of your own firmware · L04 slide 5 Reset, in hardware, before any code  
> **Notes:** [L04 › 9. The vector table, an array at a known address](../notes/04_Week3_L04_Startup_LinkerScript.md#9-the-vector-table-an-array-at-a-known-address-slides-6-7)  
> **Visual:** [Sample 1 › Q15](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc15)

**16.** `link.ld` places `.data` from `0x20000000` up to `0x20000064`, and `startup.c` declares the two boundary symbols as below. Which line stores the size of `.data` in bytes, 100, in `n`?  
```c
extern uint32_t _sdata, _edata;   /* defined in link.ld */
```

A) `uint32_t n = _edata - _sdata;`  
B) `uint32_t n = &_edata - &_sdata;`  
C) `uint32_t n = (uintptr_t)&_edata - (uintptr_t)&_sdata;`  
D) `uint32_t n = (uintptr_t)_edata - (uintptr_t)_sdata;`

> **Answer: C)** The linker creates no storage for `_sdata` and `_edata`. Each symbol's value is an address, so a linker symbol is only ever used with `&`. C subtracts the two addresses as integers: `0x20000064 − 0x20000000 = 0x64` = 100. A and D read the four bytes that happen to live at each address, which compiles cleanly and gives garbage. B subtracts two `uint32_t *` pointers, which counts words, 100 / 4 = 25.  
> **Source:** L04 slide 12 Linker symbols are addresses, not variables · L04 slide 14 `_sdata = .;`  
> **Notes:** [L04 › 13. Linker symbols are addresses, not variables](../notes/04_Week3_L04_Startup_LinkerScript.md#13-linker-symbols-are-addresses-not-variables-slide-12)  
> **Visual:** [Sample 1 › Q16](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc16)

**17.** A student swaps the two halves of `SystemInit()`, so the clock is raised before the flash wait state is set, as below. It builds with no warnings. What happens on a real chip?  
```c
RCC->CR &= ~RCC_CR_HSIDIV;                 /* divide by 1 -> 48 MHz */
while (!(RCC->CR & RCC_CR_HSIRDY)) { }
FLASH->ACR = (FLASH->ACR & ~FLASH_ACR_LATENCY) | FLASH_ACR_LATENCY_0;
while ((FLASH->ACR & FLASH_ACR_LATENCY) != FLASH_ACR_LATENCY_0) { }
SystemCoreClock = 48000000UL;
```

A) Nothing changes, because the compiler moves the `FLASH->ACR` write back in front of the clock switch  
B) For a while the CPU runs at 48 MHz with zero flash wait states, so it can fetch an instruction that is not ready and hang with no error, somewhere unrelated to the bug  
C) The chip stays at 12 MHz, because `HSIDIV` cannot change while `LATENCY` is 0  
D) The clock switch raises a HardFault, and the fault handler restores 12 MHz and carries on

> **Answer: B)** Flash cannot be read as fast as the CPU runs at 48 MHz, so it needs one wait state. The rule is that wait states go up before the frequency and come down after it. In the swapped order the CPU runs at 48 MHz while `LATENCY` is still 0, so a fetch from flash may not be ready, and the part hangs with no error. A is wrong because register accesses are `volatile`, and the compiler keeps them in program order. Nothing in hardware ties `HSIDIV` to `LATENCY` (C), and nothing reports the mistake (D); the default fault handler is an infinite loop.  
> **Source:** L04 slide 16 The clock, 48 MHz in one register write  
> **Notes:** [L04 › 17. The clock, 12 to 48 MHz in one register write](../notes/04_Week3_L04_Startup_LinkerScript.md#17-the-clock-12-to-48-mhz-in-one-register-write-slide-16)  
> **Visual:** [Sample 1 › Q17](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc17)

**18.** `GPIOA->MODER` holds its reset value `0xEBFFFFFF`. The program runs the line below to make PA6 an output. What does `GPIOA->MODER` read afterwards?  
```c
GPIOA->MODER = (GPIOA->MODER & ~(3u << 12)) | (1u << 12);
```

A) `0xEBFFDFFF`  
B) `0x00001000`  
C) `0xEBFFFFFF`  
D) `0xEBFFEFFF`

> **Answer: A)** PA6's field is bits 13:12, and the mask `3u << 12` = `0x00003000` clears it, giving `0xEBFFCFFF`. OR-ing `1u << 12` = `0x00001000` writes `01` there, so the hex digit for pins 7 and 6 goes from F (`11 11`) to D (`11 01`) and the result is `0xEBFFDFFF`. B is what `MODER = 1u << 12` would leave, with the other 15 pins, the debug pins included, turned into inputs; C is what `MODER |= 1u << 12` alone leaves, since OR cannot clear the `11`; D writes `10`, alternate function.  
> **Source:** L05 slide 15 the helper taken apart · L05 slide 4 pin n at bits 2n+1:2n · L05 slides 5–6 MODER codes and reset value  
> **Notes:** [L05 › 9. The helpers pin mode and pin pull, traced](../notes/06_Week4_L05_GPIO_Interrupts.md#9-the-helpers-pin-mode-and-pin-pull-traced-slides-15-17)  
> **Visual:** [Sample 1 › Q18](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc18)

**19.** One write must turn PB2 on (high) and PB7 off (low) and leave every other pin of port B as it is. Which line does that?  
A) `GPIOB->BSRR = 0x00000084;`  
B) `GPIOB->BSRR = 0x00800004;`  
C) `GPIOB->BSRR = 0x00040080;`  
D) `GPIOB->ODR = 0x00000004;`

> **Answer: B)** In `BSRR`, bit n sets pin n and bit n + 16 resets it, so PB2 needs bit 2 (`0x00000004`) and PB7 needs bit 23 (`0x00800000`), together `0x00800004`. Every 0 bit leaves its pin alone. A sets both pins high, and C swaps the halves, so it resets PB2 and sets PB7. D is one store too and gets PB2 and PB7 right, and it also forces every other port-B pin low.  
> **Source:** L05 slide 12 BSRR set and reset halves · L05 slide 4 BSRR set bit n, reset bit n+16  
> **Notes:** [L05 › 7. BSRR, the safe one](../notes/06_Week4_L05_GPIO_Interrupts.md#7-bsrr-the-safe-one-slides-12-13)  
> **Visual:** [Sample 1 › Q19](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc19)

**20.** A button on PB3 is to raise an interrupt through EXTI. On this chip EXTI lines 0–1 share IRQ 5, lines 2–3 share IRQ 6, and lines 4–15 share IRQ 7. Which IRQ fires, what is its vector number, and at which address is its vector?  
A) IRQ 3, vector 19, address `0x0800004C`  
B) IRQ 6, vector 22, address `0x08000016`  
C) IRQ 6, vector 22, address `0x08000058`  
D) IRQ 6, vector 6, address `0x08000018`

> **Answer: C)** PB3 is pin 3, so it feeds EXTI line 3 (once `EXTICR` selects port B), and line 3 reaches the NVIC as IRQ 6. The first 16 vectors belong to the core, so the vector number is 16 + 6 = 22, and each vector is 4 bytes, so the address is `0x08000000 + 22 × 4 = 0x08000058`. A uses the line number as the IRQ number, B forgets the × 4, and D forgets the 16 core vectors.  
> **Source:** L05 slide 27 vector number and address · L05 slide 26 shared vectors · L05 slide 24 line n watches pin n  
> **Notes:** [L05 › 17. The vector table and the handler](../notes/06_Week4_L05_GPIO_Interrupts.md#17-the-vector-table-and-the-handler-slides-27-28) · [L05 › 16. Hop 3: NVIC enable and priority](../notes/06_Week4_L05_GPIO_Interrupts.md#16-hop-3-nvic-enable-and-priority-slide-26)  
> **Visual:** [Sample 1 › Q20](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc20)

**21.** Button A (PA0, wired to GND, internal pull-up on) is polled every 1 ms through the debouncer, and it works. A student deletes the line below and rebuilds. The build has zero warnings. What does the program see from button A now?  
```c
pin_mode(GPIOA, 0, MODE_INPUT);
```

A) A button that is always pressed, because PA0 stays analog and an analog pin reads 0 in `IDR`  
B) Random presses nobody made, because the released pin now floats  
C) Nothing at all, because writes to port A now vanish and reads return 0  
D) The same as before, because input is the mode every pin has after reset

> **Answer: A)** After reset every pin except PA13 and PA14 is `11`, analog, and an analog pin reads 0 in `IDR` whatever the voltage. Button A is active low, so `button_down()` sees 0 and the debouncer accepts a press about 20 ms after reset that nobody made; after that the level never changes. B is the symptom of a missing pull-up and C of a missing `IOPENR` clock gate, and this change touches neither. D assumes the reset mode is input; it is analog, which is why input mode is written, never assumed.  
> **Source:** L05 slide 33 seven ways to get silence, row 2 · L05 slide 6 a pin wakes up analog · L05 slide 19 active low  
> **Notes:** [L05 › 4. MODER reset and the analog trap](../notes/06_Week4_L05_GPIO_Interrupts.md#4-moder-reset-and-the-analog-trap-slides-5-6) · [L05 › 20. Seven ways to get silence, and the debugger](../notes/06_Week4_L05_GPIO_Interrupts.md#20-seven-ways-to-get-silence-and-the-debugger-slides-33-33b)  
> **Visual:** [Sample 1 › Q21](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc21)

**22.** Both buttons bounce. For one press, polled button A (sampled every 1 ms) reports one level change, now and then three, while button B's EXTI handler counts tens of edges. Why do the counts differ?  
A) EXTI records each edge twice, once in `RPR1` and once in `FPR1`  
B) `debounce_step()` removes button A's bounce before the level changes are counted  
C) A 1 kHz poll sees only the level at each sample, so most bounce transitions, microseconds apart, fall between samples, while EXTI latches every edge  
D) Button B bounces more, because a pin used for an interrupt has no pull-up

> **Answer: C)** Bounce transitions come microseconds apart and button A is looked at once per millisecond, so most of them fall between two samples and are never seen; polling is a filter. EXTI latches every edge in hardware, so button B's handler runs once per bounce edge. A is wrong since each edge sets one bit, a rising edge in `RPR1` and a falling edge in `FPR1`; B is wrong since `changes` counts every move of the raw sample, before the debouncer accepts anything; D is wrong since both buttons have the same pull-up and the same bounce.  
> **Source:** L05 slide 22 what polling costs and hides · L05 slide 32 what you will measure · L05 slide 20 a press is not one edge  
> **Notes:** [L05 › 12. Button A: the polled debouncer](../notes/06_Week4_L05_GPIO_Interrupts.md#12-button-a-the-polled-debouncer-slides-21-22) · [L05 › 19. Count in the handler, decide in main](../notes/06_Week4_L05_GPIO_Interrupts.md#19-count-in-the-handler-decide-in-main-slides-31-32)  
> **Visual:** [Sample 1 › Q22](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc22)

**23.** TIM3 runs from the 48 MHz clock. It must count at 2 MHz and raise an update event every 10 ms. Which register values do that?  
A) `PSC = 24`, `ARR = 20000`  
B) `PSC = 23`, `ARR = 9999`  
C) `PSC = 23`, `ARR = 19999`  
D) `PSC = 47`, `ARR = 19999`

> **Answer: C)** The counter steps once every PSC + 1 clocks, so 48 MHz / 24 = 2 MHz needs `PSC = 23`. 10 ms at 2 MHz is 20 000 counts, 0 to 19 999, so `ARR = 19999`, and 48 000 000 / (24 × 20 000) = 100 Hz. A writes N instead of N − 1 in both registers (10.42 ms, about 4 % slow, and nothing complains); B is 10 000 counts, 5 ms; D counts at 1 MHz and gives the lesson's 20 ms servo frame.  
> **Source:** L06 slide 5b a timer is a counter with three registers · L06 slide 17 the −1 in PSC or ARR  
> **Notes:** [L06 › 6. Time base: PSC, ARR, CNT](../notes/07_Week5_L06_Time_Timers.md#6-time-base-psc-arr-cnt-slide-5b)  
> **Visual:** [Sample 1 › Q23](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc23)

**24.** TIM3 raises an update interrupt every 20 ms at NVIC priority 2. SysTick, at priority 3, drives `millis()`, and TIM3 channel 1 drives the servo on PA6 in PWM mode. The update handler below builds with zero warnings. What does the board do once the timer starts?  
```c
void TIM3_IRQHandler(void)
{
    if (TIM3->SR & TIM_SR_UIF) {
        TIM3->SR = TIM_SR_UIF;
        frames++;
    }
}
```

A) It runs normally: writing 1 to a flag clears it, as it does for EXTI  
B) Only the first frame is lost: the flag clears itself at the next update event  
C) The timer stops counting, and the servo pulse on PA6 stops with it  
D) The handler re-enters forever, `millis()` stops advancing, and the servo holds its position

> **Answer: D)** Timer flags clear by writing 0, so `TIM3->SR = TIM_SR_UIF` leaves UIF set and clears every other flag instead. The handler re-enters as soon as it returns, and SysTick at the less urgent priority 3 never runs, so `millis()` stops. The PWM is hardware, so PA6 keeps its last pulse and the servo holds still. A is the EXTI convention, nothing clears UIF by itself (B), and the timer never stopped (C).  
> **Source:** L06 slide 7 TIM3_IRQHandler and the opposite convention · L06 slide 17 clearing UIF by writing 1  
> **Notes:** [L06 › 8. TIM3 IRQHandler and write 0 to clear](../notes/07_Week5_L06_Time_Timers.md#8-tim3-irqhandler-and-write-0-to-clear-slide-7)  
> **Visual:** [Sample 1 › Q24](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc24)

**25.** A timeout starts with `start = millis();`, which returns `0xFFFFFC18`, 1000 ms before the 32-bit millisecond counter wraps. Which test becomes true exactly when 1000 ms have passed, here and for any other start value?  
A) `if (millis() >= start + 1000u)`  
B) `if (millis() - start >= 1000u)`  
C) `if (start - millis() >= 1000u)`  
D) `if (millis() > start && millis() - start >= 1000u)`

> **Answer: B)** Unsigned subtraction is modulo 2³², so `millis() - start` is the true elapsed time across the wrap: at `millis()` = `0x00000000` it gives 1000. In A, `start + 1000u` wraps to 0, and `millis() >= 0` is true at once, 1000 ms early. C subtracts the wrong way round: 1 ms after the start it gives `0xFFFFFFFF` and fires. D never fires: while `millis() > start` holds, the difference is at most 999, and after the wrap `millis() > start` is false.  
> **Source:** L06 slide 3 millis() and the wrap that does not matter · L06 slide 18 now − then is the only comparison you write  
> **Notes:** [L06 › 3. millis and the wrap that does not matter](../notes/07_Week5_L06_Time_Timers.md#3-millis-and-the-wrap-that-does-not-matter-slide-3)  
> **Visual:** [Sample 1 › Q25](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc25)

**26.** TIM14 counts at 1 MHz and captures both edges of the HC-SR04 echo on PA7. Its interrupt handler sometimes starts 1 µs after an edge and sometimes 100 µs after, depending on what else is running. Why is the measured echo width still exact to the microsecond?  
A) At the edge the hardware copies `CNT` into `CCR1` before the interrupt is even requested, so latency changes when the handler reads the time, not what the time says  
B) TIM14 has NVIC priority 1, the most urgent in the program, so its handler starts with no latency  
C) Reading `CCR1` clears `CC1IF`, so no edge is ever missed  
D) Both edges are delayed by the same latency, so it cancels in the subtraction

> **Answer: A)** Input capture takes the timestamp in hardware: the edge copies `CNT` into `CCR1`, and only then raises `CC1IF`. The handler is a courier, not a stopwatch, so a late handler reads the same number. B is false because priority 1 shortens the wait but cannot remove it, and C is true but is about acknowledging the interrupt, not about accuracy. D is the argument for the EXTI fallback of slide 13b, and it holds only while nothing delays one of the two interrupts.  
> **Source:** L06 slide 12 input capture, the hardware takes the timestamp · L06 slide 13b no capture in Wokwi, so EXTI  
> **Notes:** [L06 › 13. Input capture, the hardware takes the timestamp](../notes/07_Week5_L06_Time_Timers.md#13-input-capture-the-hardware-takes-the-timestamp-slide-12)  
> **Visual:** [Sample 1 › Q26](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc26)

**27.** In this course's kernel, the button task has priority 3 and the hog task has priority 1. On the same chip, an EXTI interrupt has NVIC priority 1 and SysTick has NVIC priority 3. Which statement is correct?  
A) The button task outranks the hog, and the EXTI interrupt outranks SysTick  
B) The hog outranks the button task, and the EXTI interrupt outranks SysTick  
C) The button task outranks the hog, and SysTick outranks the EXTI interrupt  
D) The hog outranks the button task, and SysTick outranks the EXTI interrupt

> **Answer: A)** The chip has two numberings. In the kernel, as in FreeRTOS, a higher number is more urgent, so the button task (3) outranks the hog (1). In the NVIC, 0 is most urgent, so the EXTI interrupt (1) outranks SysTick (3). B applies the NVIC rule to the tasks, C applies the kernel rule to the interrupts, and D reverses both.  
> **Source:** L07 slide 9 two numberings on one chip · L07 slide 4b PendSV and SysTick at priority 3, the lowest  
> **Notes:** [L07 › 11. The scheduler rule: who runs next](../notes/08_Week6_L07_RTOS.md#11-the-scheduler-rule-who-runs-next-slide-9)  
> **Visual:** [Sample 1 › Q27](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc27)

**28.** Task B was switched out by this kernel's `PendSV_Handler`, and B's TCB now holds `sp = 0x20000400`. At which address is B's saved `pc`, the instruction B will resume at?  
A) `0x20000418`  
B) `0x2000043C`  
C) `0x200003C8`  
D) `0x20000438`

> **Answer: D)** `tcb->sp` points at r4. PendSV saved r4–r11 there (8 words, 32 bytes), so the hardware frame r0, r1, r2, r3, r12, lr, pc, xPSR starts 32 bytes on, at `0x20000420`. The pc is word 6 of that frame: 0x400 + 32 + 24 = 0x400 + 0x38 = `0x20000438`. A forgets the 32 bytes PendSV saved and lands on r10, B is xPSR, the last word, and C counts downward, although the saved words sit at higher addresses than `tcb->sp`.  
> **Source:** L07 slide 5 the switch, drawn · L07 slide 6 the stack after the save, tcb->sp at r4  
> **Notes:** [L07 › 7. The exception stack frame, 16 words](../notes/08_Week6_L07_RTOS.md#7-the-exception-stack-frame-16-words-slide-5)  
> **Visual:** [Sample 1 › Q28](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc28)

**29.** The report task calls `printf` and needs 115 words of stack at its deepest. A student shrinks its stack from 512 to 96 words. The linker happens to place the hog task's counter `primes` in the word just below the report task's stack. What does the board most likely do?  
A) It HardFaults at the first `printf`, and the fault report names the report task  
B) Nothing crashes; the report keeps printing, but the hog's `primes` count suddenly shows a huge, wrong value  
C) The kernel detects the overflow at the next context switch and stops the report task  
D) The build fails, because the linker sees that 115 words do not fit in a 96-word array

> **Answer: B)** The stack grows down, so the report task's 19 extra words land below its array, on `primes` and whatever lies under it. Nothing on this core checks the stack pointer, so nothing faults: another task's data goes quietly wrong, and the bug looks like it is in the hog. A is what people expect, but an MPU guard region is for bigger cores; C describes FreeRTOS's check on every switch, while this kernel only shows the high-water mark in its report; and the linker in D cannot know how deep a stack will go at run time.  
> **Source:** L07 slide 16 sizing a stack, the high-water mark · L07 slide 17 when it is too small  
> **Notes:** [L07 › 18. Sizing a stack: the high-water mark and overflow](../notes/08_Week6_L07_RTOS.md#18-sizing-a-stack-the-high-water-mark-and-overflow-slides-16-17)  
> **Visual:** [Sample 1 › Q29](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc29)

**30.** A UART receive interrupt handler must pass each received byte `b` to a protocol task that waits in `os_queue_get(&q, ...)`. Which line belongs in the handler?  
A) `os_queue_put(&q, &b);`  
B) `os_mutex_lock(&m); rx[n++] = b; os_mutex_unlock(&m);`  
C) `while (!os_queue_put_from_isr(&q, &b)) { }`  
D) `if (!os_queue_put_from_isr(&q, &b)) { dropped++; }`

> **Answer: D)** An interrupt handler must never block: there is no task to put to sleep, only a handler on MSP. `os_queue_put_from_isr()` never blocks; it returns 0 when the queue is full and lets the handler decide, here by counting the lost byte. A and B call task APIs that can block, on a full queue or a held mutex. C never sleeps, but on a full queue it spins forever, because the task that would empty the queue cannot run until the handler returns.  
> **Source:** L07 slide 15 queues, task API vs ISR API · L07 slide 12 a mutex is not usable from an ISR  
> **Notes:** [L07 › 17. Queues, from tasks and from interrupts](../notes/08_Week6_L07_RTOS.md#17-queues-from-tasks-and-from-interrupts-slide-15)  
> **Visual:** [Sample 1 › Q30](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc30)

**31.** USART2 is clocked at 48 MHz and must run at 38 400 baud, 8N1. Which `BRR` value is right, and how long does the receive handler have to read `RDR` after a byte arrives, before the next byte overwrites it?  
A) `BRR` = 1250; about 208 µs  
B) `BRR` = 313; about 260 µs  
C) `BRR` = 1250; about 26 µs  
D) `BRR` = 1250; about 260 µs

> **Answer: D)** `BRR` counts clocks per bit: 48 000 000 / 38 400 = 1250. The next byte needs one whole byte time to arrive, and 8N1 puts 10 bits on the wire per byte (start, 8 data, stop), so 10 / 38 400 s ≈ 260 µs. A counts only the 8 data bits and C is a single bit time; B is 12 000 000 / 38 400 = 312.5, the value for the 12 MHz reset clock.  
> **Source:** L08 slide 1b BRR, clocks per bit · L08 slide 2 ten bit-times per byte, the overrun  
> **Notes:** [L08 › 2. Clock gate, pins and baud rate](../notes/09_Week7_L08_UART_PythonHost.md#2-clock-gate-pins-and-baud-rate-slide-1b) · [L08 › 3. One byte on the wire](../notes/09_Week7_L08_UART_PythonHost.md#3-one-byte-on-the-wire-slide-2)  
> **Visual:** [Sample 1 › Q31](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc31)

**32.** `host.py --frame "PING"` prints the NMEA-style frame for the body `PING`. In ASCII, `P` = `0x50`, `I` = `0x49`, `N` = `0x4E`, `G` = `0x47`. What does it print?  
A) `$PING*2E`  
B) `$PING*34`  
C) `$PING*10`  
D) `$PING*16`

> **Answer: C)** The checksum is the XOR of every byte between `$` and `*`: `50 ^ 49` = `19`, `^ 4E` = `57`, `^ 47` = `10`, written as two hex digits. A is the low byte of the sum (`0x12E`), B also XORs in the `$` (`0x24`), and D writes `0x10` in decimal.  
> **Source:** L08 slide 10 the frame, borrowed from GPS · L08 slide 12 host.py --frame  
> **Notes:** [L08 › 13. The frame: NMEA 0183 and its XOR checksum](../notes/09_Week7_L08_UART_PythonHost.md#13-the-frame-nmea-0183-and-its-xor-checksum-slide-10)  
> **Visual:** [Sample 1 › Q32](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc32)

**33.** A student's `USART2_IRQHandler` (below) has no `ORE` branch, so it never writes `ICR`. Typing works until, once, interrupts stay masked for longer than one byte time: a byte is overwritten and `ORE` is set. What happens from then on?  
```c
void USART2_IRQHandler(void)
{
    uint32_t isr = USART2->ISR;
    if (isr & USART_ISR_RXNE_RXFNE) {
        uint8_t c = (uint8_t)USART2->RDR;
        os_queue_put_from_isr(&rx_queue, &c);
    }
    /* TX branch as in the lesson */
}
```

A) Nothing visible: reading `RDR` in the handler clears `ORE` together with `RXNE`  
B) Reception stops: `ORE` stays set, and only writing 1 to `ORECF` in `ICR` clears it  
C) One byte is lost and reception carries on: `ORE` clears itself when the next byte arrives  
D) Reception resumes after the board's next reply: writing `TDR` clears `ORE`

> **Answer: B)** "Clearing `ORE`" is a row of slide 14's checklist: forget it and reception stops after the first overrun. `ORE` is cleared by writing 1 to a different register, `USART2->ICR = USART_ICR_ORECF`. Reading `RDR` clears only `RXNE`, writing `TDR` clears only `TXE`, and the flag never clears itself. C is what the lesson's handler gives, because it clears `ORE` and counts the lost byte.  
> **Source:** L08 slide 4 one interrupt, three jobs; five clearing conventions · L08 slide 14 clearing ORE  
> **Notes:** [L08 › 6. Five ways a flag clears](../notes/09_Week7_L08_UART_PythonHost.md#6-five-ways-a-flag-clears-slide-4) · [L08 › 16. The silent-failure checklist, UART edition](../notes/09_Week7_L08_UART_PythonHost.md#16-the-silent-failure-checklist-uart-edition-slide-14)  
> **Visual:** [Sample 1 › Q33](https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE#s1-mc33)
