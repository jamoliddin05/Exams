# L08 UART and a Python Host: Talking to the Board, Properly

What this lecture is about: USART2 as the fourth instance of the L00 peripheral model, now driven by interrupts in both directions (receive: the ISR feeds a kernel queue that a task blocks on; transmit: a lock-free ring drained by the TXE interrupt), a line protocol with two audiences (a shell for people, NMEA-style checksummed `$BODY*CS` frames for programs), and `host.py`, the first Python in the course, on the PC side.

## 1. The lesson pins and the peripheral model (pin maps, slide 1)

| Pin | Use | Mode |
|---|---|---|
| PA2 / PA3 | USART2 TX / RX, interrupt driven | AF1, MODER `10` |
| PA0 / PA1 | buttons A / B, counted by a polling task, pull-up | in `00` |
| PB0-PB7 | LED bar, one bit per LED, set by `led` / `$LED` | out `01` |

Slide 1, the model filled in for USART2 (model: see 01_Week2_L00_ProgrammersModel.md):

| Model slot | USART2 |
|---|---|
| clock gate | `RCC->APBENR1` `USART2EN` (bit 17) |
| pins | PA2 (TX), PA3 (RX), alternate function 1 |
| control | `CR1`: `UE` (0), `RE` (2), `TE` (3), `RXNEIE` (5), `TXEIE` (7) |
| status | `ISR`: `ORE` (3, overrun), `RXNE` (5, a byte arrived), `TXE` (7, room to send) |
| data | `RDR` in, `TDR` out |
| event | `USART2_IRQn` = 28, **one vector for everything** |
| rate | `BRR` = 48 000 000 / 115 200 = 416.67 -> **417** |

"The fourth peripheral is not a fourth new thing." USART1 and USART2 share one register set (`USART_TypeDef`); **USART2 base `0x40004400`**. Bold = used by this lesson:

| Offset | Register | Job | Here |
|---|---|---|---|
| 0x00 | **CR1** | enable, directions, interrupt enables, frame format | `UE RE TE RXNEIE`; `TXEIE` on and off |
| 0x04 / 0x08 | CR2 / CR3 | stop bits, pin swap / DMA, flow control | reset values |
| 0x0C | **BRR** | baud rate: **clocks per bit** | 417 |
| 0x1C | **ISR** | status flags, **read only** | `RXNE`, `TXE`, `ORE` |
| 0x20 | **ICR** | **write 1 to clear** a flag of ISR | `ORECF` (bit 3) |
| 0x24 | **RDR** | received byte; **reading clears RXNE** | read in the ISR |
| 0x28 | **TDR** | byte to send; **writing clears TXE** | written in the ISR |
| 0x2C | PRESC | kernel clock prescaler | reset: divide by 1 |

- Six of twelve registers do the work: set up once (`BRR`, `CR1`), status (`ISR`, `ICR`), data (`RDR`, `TDR`, 9 bits wide, 8 used).
- `CR2`, `CR3`, `PRESC` keep reset values: 8 data bits, 1 stop bit, no parity, no flow control: **8N1**.
- The header spells the bits with their FIFO-mode names: `USART_CR1_RXNEIE_RXFNEIE`, `USART_ISR_TXE_TXFNF`.

## 2. Clock gate, pins and baud rate (slide 1b)

| Register | Value | Why |
|---|---|---|
| `RCC->APBENR1` | bit 17 `USART2EN` = `0x00020000` | the clock gate, off at reset |
| `GPIOA->AFR[0]` | `0x00001100` | PA2 bits 11:8 = 1, PA3 bits 15:12 = 1 (L05 rule: 4n) |
| `USART2->BRR` | 417 = `0x000001A1` | `(pclk + baud / 2) / baud`, rounded |

- **BRR = f / baud** (clocks per bit). 48 000 000 / 115 200 = 416.67 -> 417, giving 48 000 000 / 417 = **115 108 baud, 0.08 % slow**. "Far inside the few percent a UART tolerates, because the receiver resynchronises on every start bit." The banner prints `BRR = 417` read back (measured).
- Worked BRR values (verified in Python):

| Baud | BRR at 48 MHz | BRR at 12 MHz (reset clock) | Byte time (10 bits) |
|---|---|---|---|
| 9 600 | 5000 | 1250 | 1.04 ms |
| 19 200 | 2500 | 625 | 521 µs |
| 38 400 | 1250 | 312.5 -> 313 | 260 µs |
| 57 600 | 833.3 -> 833 | 208 | 174 µs |
| 115 200 | 416.67 -> **417** | 104.17 -> 104 | **86.8 µs** |

- **The wrong-clock trap.** BRR is a count of clocks, so it is only right for the clock it was computed for. BRR = 417 with the core still at the reset 12 MHz (HSI48 / 4) gives 12 000 000 / 417 = 28 777 baud, about **a quarter** of 115 200: garbage characters (slide 14).

## 3. One byte on the wire (slide 2)

- Idle line **high**; **start bit low**; **8 data bits, least significant bit first**; **stop bit high**: **10 bit-times per byte**.
- Worked: `'A'` = `0x41` = `0100 0001`. On the wire, in time order: start `0`, then b0..b7 = `1 0 0 0 0 0 1 0`, stop `1`.
- **Byte time = 10 / baud.** 115 200 / 10 = **11 520 bytes a second, 86.8 µs per byte**. That one number drives both halves:
  - Sending: a 90-character line takes 90 × 86.8 µs = 7.8 ms (~8 ms). A polled `printf` holds the CPU for all of it.
  - Receiving: the UART holds **one** received byte. The next arrives 86.8 µs later and overwrites it unless software has read it: the **overrun**, `ORE`.

## 4. Why receive must be an interrupt (slide 3)

- Polling works only if **every path** through the program returns to the UART within 86.8 µs. In lesson 07's system one `printf` holds a task for 8 ms, and the hog never comes back at all.
- So receive becomes a **producer and a consumer**: `RDR` (1 byte) -> `USART2_IRQHandler` (NVIC priority 1, every 86.8 µs) -> `os_queue` (64 bytes) -> `task_proto` (blocked: 0 % CPU).
- The ISR meets the **hard** 86.8 µs deadline with a few dozen instructions; the queue turns it into a **soft** one: catch up before 64 bytes pile up, 64 × 86.8 µs = **5.5 ms**. While nothing arrives the task costs **nothing**: it is blocked in `os_queue_get()` (L07 slide 15).
- Two different losses, two counters: `rx_overruns` = the UART's own 1-byte buffer was overwritten (`ORE`, the ISR was late); `rx_dropped` = the ISR got the byte but the queue was full (the task was late).
- Priority 1 is **above the kernel** (SysTick and PendSV are 3; NVIC: 0 = most urgent). IRQ 28 -> vector 16 + 28 = 44 at `0x08000000 + 44 × 4` = `0x080000B0`; `NVIC_SetPriority(USART2_IRQn, 1)` writes `1 << 6` = `0x40` into `IPR[7]` byte 0.
- Measured: 77 bytes typed back to back, `rx overruns 0, rx dropped 0`.

## 5. One interrupt, three jobs (slide 4)

```c
void USART2_IRQHandler(void)
{
    uint32_t isr = USART2->ISR;                   /* read the status once            */
    if (isr & USART_ISR_ORE) {                    /* bit 3: overrun                  */
        USART2->ICR = USART_ICR_ORECF;            /* clear: write 1, a different reg */
        stats.rx_overruns++;
    }
    if (isr & USART_ISR_RXNE_RXFNE) {             /* bit 5: a byte arrived           */
        uint8_t c = (uint8_t)USART2->RDR;         /* reading RDR clears RXNE         */
        if (!os_queue_put_from_isr(&rx_queue, &c)) stats.rx_dropped++;   /* never blocks */
    }
    if ((USART2->CR1 & TXEIE) && (isr & USART_ISR_TXE_TXFNF)) { ... }    /* bit 7: slide 6 */
}
```

- One vector (`USART2_IRQn` = 28) for every USART2 event: the handler **asks `ISR` which job** is due. `ISR` bit 3 `ORE` and `ICR` bit 3 `ORECF` are the same bit position in two registers.
- The TX branch also tests `TXEIE` in `CR1`: `TXE` is set whenever the transmitter is idle, so only an enabled `TXEIE` means "the ISR is supposed to send".

## 6. Five ways a flag clears (slide 4)

| Flag | How it clears | Lesson | Do it the wrong way |
|---|---|---|---|
| EXTI `RPR1` / `FPR1` | **write 1** to it (`EXTI->FPR1 = mask`) | 05 | `FPR1 \|= mask` writes back other lines' 1s and clears them too |
| TIM `UIF` | **write 0** to it (`TIM3->SR = ~TIM_SR_UIF`) | 06 | `SR = TIM_SR_UIF` (EXTI style) clears every other flag, leaves UIF set |
| TIM `CC1IF` | **read** `CCR1` | 06 | |
| USART `RXNE` / `TXE` | **read `RDR`** / **write `TDR`** | 08 | writing to `ISR` does nothing: it is read only |
| USART `ORE` | **write 1 to a different register**, `ICR` (`ORECF`) | 08 | reading `RDR` clears `RXNE`, not `ORE` |

"Five conventions on one chip. There is no rule to memorise, only the habit: **for every flag, look up how it clears.** The penalty for guessing is an interrupt that never stops."

## 7. Transmit: a lock-free ring (slide 5)

```c
static uint8_t           tx_ring[256];
static volatile uint16_t tx_head;   /* written ONLY by tasks (producer)   */
static volatile uint16_t tx_tail;   /* written ONLY by the ISR (consumer) */

static void tx_put(uint8_t c)
{
    uint16_t next = (tx_head + 1) % 256;
    while (next == tx_tail) { os_delay(1); }   /* full: let the ISR drain */
    tx_ring[tx_head] = c;                       /* 1. the data             */
    tx_head = next;                             /* 2. THEN publish it      */
}
```

- Sending goes the other way: **tasks produce, the interrupt consumes.** No mutex, no masked interrupts, because **each index has exactly one writer** (L03 slide 7's safe case, applied twice): tasks read `tail` and write `head`; the ISR reads `head` and writes `tail`.
- **Data before index.** If `head` moved first, the ISR could send a slot that has not been filled yet.
- **One slot always empty.** `head == tail` means **empty**; full is `(head + 1) % 256 == tail`, so 255 of 256 slots are usable. If the ring could fill completely, full would look identical to empty.
- `TX_SIZE` 256 is a power of two, so `% 256` compiles to a mask. RX uses a kernel queue **with** locking, TX a ring **without**, on purpose.

## 8. TXEIE on only while there is work (slide 6)

- `TXE` means "the transmit register is empty". Idle, it is empty **all the time**, and only a write to `TDR` clears it. A permanently enabled `TXEIE` would interrupt continuously, so the ISR switches it off when the ring is empty:

```c
if (tx_tail != tx_head) {
    USART2->TDR = tx_ring[tx_tail];           /* send one, clears TXE */
    tx_tail = (tx_tail + 1) % 256;
} else {
    USART2->CR1 &= ~USART_CR1_TXEIE_TXFNFIE;  /* nothing left: stop   */
}
```

| `CR1` state | Value | Bits set |
|---|---|---|
| idle (`uart_init()`) | `0x0000002D` | `UE` 0, `RE` 2, `TE` 3, `RXNEIE` 5 |
| sending (`_write()`) | `0x000000AD` | the same + `TXEIE` 7 |

- **Measured, with the `else` line removed: nothing is printed at all, not even the banner.** The first `_write()` enabled `TXEIE`; the ISR sent the first character, found the ring empty, and was called again, and again, at priority 1, above everything that could ever put more data in. L05's endless interrupt in a new costume.
- `_write()` turns `TXEIE` back on with a read-modify-write of `CR1`, which the ISR also writes. That one line is a **critical section**, two instructions long: `__disable_irq(); USART2->CR1 |= TXEIE; __enable_irq();`. `CR1` has two writers; each ring index has one (section 7).

## 9. Replacing the printf back end: weak again (slide 7)

- `printf` has called `_write()` since lesson 04. `_lib/retarget.c` defines it `__attribute__((weak))` and **polls**; `uart.c` defines an ordinary (strong) `_write()` that fills the ring.
- **Same mechanism as the vector table** (L05 slide 30): a strong definition beats a weak one at link time. `printf` does not know anything changed; it now **returns as soon as the text is in the ring**, not when the last bit has left the pin.

## 10. Two tasks, one serial port (slide 8)

- The telemetry task (priority 2) and the protocol task (priority 3; kernel numbers: bigger = more urgent) both print. Without coordination two lines interleave character by character, and a line that is half one frame and half another **fails its checksum on the PC**.
- L07's mutex makes each line atomic: `say()` wraps `vprintf` in `os_mutex_lock(&print_lock)` / `os_mutex_unlock`.
- Second reason: newlib-nano's `printf` keeps state in one shared structure and is **not re-entrant**.
- No measured claim: Renode's UART sends instantly, so the window never opened. On silicon: telemetry is mid-line, a byte arrives, the protocol task becomes ready, preempts, and prints its reply into the middle of the `$TEL` line (Lab Part 5b).

## 11. Lines for people and for programs (slide 9)

| Line starts with | It is | Example | Reply |
|---|---|---|---|
| anything else | a **shell command** from a person | `led 170` | `bar = 0xAA` |
| `$` | a **frame** from a program | `$LED,85*6C` | `$ACK,LED,85*09` |

- One UART, two audiences. A person wants words and forgiveness; a program wants a parseable format and **proof the line arrived intact**, because a serial line picks up noise, drops bytes when a buffer overflows, and gets cut in half when a cable is pulled.
- The protocol task collects bytes until `\r` or `\n`. A line longer than 63 characters (`LINE_MAX` 64) is **thrown away whole**, not acted on in part.

## 12. Keys: a third kind of frame (slide 9b)

| Key | Bytes | Board does |
|---|---|---|
| Up / Down | `ESC [ A` / `ESC [ B` | halve / double the telemetry period (20-5000 ms) |
| Right / Left | `ESC [ C` / `ESC [ D` | move the lit LED along the bar |
| Esc | `ESC` alone | cancel the half-typed line |
| F1, Home, Delete | `ESC O P`, `ESC [ H`, `ESC [ 3 ~` | spell the bytes out |

- On a raw terminal each key is sent when pressed; a letter is one byte, **an arrow key is three**. `ESC` = `0x1B`. `keys.c` is a state machine shaped like a frame: a start byte, a body, a byte that ends it.
- **CSI**: `ESC [`, parameter bytes `0x20-0x3F`, then one **final byte `0x40-0x7E`** (it plays the part of the `*` in a frame). **SS3**: `ESC O` plus exactly one byte. `ESC [ 1 ; 5 C` (Ctrl-Right) ends at `C`, the first byte in the final range.
- A **lone Esc** is the same `0x1B` that starts every sequence. **Only time tells them apart**: 50 ms of silence (`KEY_ESC_WAIT`). Because `uart_getc()` blocks, the silence is only noticed when the next key arrives.
- **Echo**: the terminal does not draw what you type; the board sends each byte back, and `\b \b` for Backspace (`0x7F` or `0x08`).
- **A `$` line is never echoed** (host.py would read its own command as a frame from the board). **Telemetry waits while a line is half typed** (otherwise `sta$TEL,...`, which host.py skips because it does not start with `$`); `seq` is not advanced, so no gap.

## 13. The frame: NMEA 0183 and its XOR checksum (slide 10)

```
$LED,170*57
 \_____/ \/
  body   checksum: XOR of every byte of the body, two hex digits
```

- **NMEA 0183**, the sentence format GPS receivers have printed since the 1980s. The checksum covers the bytes **between `$` and `*`** (neither is included). `proto_check()` returns `NO_DOLLAR`, `NO_STAR`, `BAD_HEX` or `MISMATCH`; the board replies `$NAK,CHECKSUM` or `$NAK,NOSTAR`.
- Worked by hand (slide 10), each step verified in Python:

| Byte | `L` | `E` | `D` | `,` | `1` | `7` | `0` |
|---|---|---|---|---|---|---|---|
| hex | 4C | 45 | 44 | 2C | 31 | 37 | 30 |
| running XOR | 4C | 09 | 4D | 61 | 50 | 67 | **57** |

- More, all verified: `LED,1` -> `50` (guide P9); `PING` (`50 49 4E 47`) -> `50 ^ 49 = 19`, `^ 4E = 57`, `^ 47 = 10`: **`$PING*10`** (Lab Part 1); `LED,85` -> `6C`; `RATE,250` -> `19`; `STAT` -> `12`; `TEL,1000,0,500,0,0` -> `75`.
- `host.py --selftest` checks the arithmetic against a real GPS sentence (`$GPGGA,...*47`), so it is **the** NMEA checksum, not one that merely agrees with itself.

## 14. What XOR catches and what it misses (slide 10)

- **Catches any single flipped bit**: `$LED,171*57` (`0` -> `1`, one bit) is rejected; the checksum comes out `56`. A flipped bit flips the same bit of the XOR.
- More generally (from proto.c): any change **confined to one byte** (two bits of `5` -> `6`: `35 ^ 36 = 03`), and any **odd number** of flips in one bit position. A lost byte changes the XOR by that byte (`LED,8` -> `59`, not `6C`).
- **Misses two errors in the same bit position of different bytes**: they cancel. `$LED,94*6C` passes as if it were `$LED,85*6C` (`8` -> `9` and `5` -> `4` both flip bit 0). The same rule means XOR ignores order: `LED,58` also gives `6C`.
- A **CRC** catches those; MAVLink (lessons 13-14) uses one. XOR is what NMEA chose: two hex digits a person can check by eye.
- Shortcut: from `$LED,85*6C`, the body `LED,84` differs in bit 0 of one byte, so its checksum is `6C ^ 01` = `6D`.

## 15. A measured session and host.py (slides 11-13)

| Typed | Reply |
|---|---|
| `led 170` | `bar = 0xAA` |
| `$LED,85*6C` | `$ACK,LED,85*09` |
| `$LED,85*00` (damaged on purpose) | `$NAK,CHECKSUM*65` |
| `$LED,85` (no checksum) | `$NAK,NOSTAR*7D` |
| `bogus` | `unknown command 'bogus' - try help` |
| `$RATE,250*19` | `$ACK,RATE,250*7C`; telemetry every 250 ms |
| `$STAT*12` | `$STAT,71,3,2,0,0,0*25` (bytes in, frames ok, bad, ...) |

- Telemetry: `$TEL,<ms>,<seq>,<tri>,<A presses>,<B presses>*CS`, e.g. `$TEL,1000,0,500,0,0*75`. `seq` lets host.py spot a lost line.
- `host.py` (230 lines, pyserial only): `--selftest`, `--frame "LED,170"` (prints `$LED,170*57` to paste), `--file capture.txt`, `--port rfc2217://localhost:4000` (Wokwi VS Code extension), `--port COM5 --send "RATE,100"` (real Nucleo), `--demo` (fake telemetry with a damaged and a lost line).
- **Three routes**, because the browser keeps Wokwi's serial port inside the browser: copy the serial monitor text into a file; the VS Code extension forwards the port as RFC2217 (`rfc2217ServerPort = 4000`); a real board is `COM5`. **The protocol is printable because of the copy-and-paste route**: a binary protocol could not survive a text box.
- `--file` on the session: `frames good 9, bad 0, lost (sequence gaps) 0, other lines 11`. Every C-built frame passed the Python check, every Python-built frame passed the C check: two implementations, one arithmetic.
- **A line altered in transit is counted bad, and the sequence number it carried never arrives intact, so it is also a gap.** Ten frames, one digit changed in seq 4: good 9, bad 1, lost 1 (run through host.py's own `Telemetry` class).

## 16. The silent-failure checklist, UART edition (slide 14)

| Forgot | Symptom | Why this symptom follows |
|---|---|---|
| `USART2EN` in `APBENR1` | nothing sent, nothing received | clock gate off: USART2 register writes vanish, the UART never runs |
| AF1 on PA2/PA3 | UART works internally; the pins carry nothing | without AF1 the pins are not handed to USART2 (at reset they are analog); its flags and interrupts still work |
| `BRR` for the wrong clock | **garbage characters**, the most recognisable UART fault | the two ends disagree on the bit time and sample the wrong bits (417 at 12 MHz = 28 777 baud) |
| clearing `ORE` | reception stops after the first overrun | only `ICR.ORECF` clears it; while set it blocks reception (uart.c: with `RXNEIE` it also keeps the interrupt asserted) |
| turning `TXEIE` off when empty | interrupt storm; **measured: not even the banner** | `TXE` stays 1 while idle and only a `TDR` write clears it, so the handler re-enters forever at priority 1 |
| blocking in the ISR | impossible to do right: the ISR version of `put` never blocks | a handler is not a task; there is nothing to put to sleep, so a full queue drops the byte (`rx_dropped`) |
| a lock around printing | lines interleave; checksums fail on the PC | a preempting task prints into the middle of another's line; `printf` is not re-entrant |

All build with zero warnings. "The last two are design, not configuration: which context may wait, and which data is shared." Lessons 03 and 07 are why you can reason about them.

## 17. What carries forward (slide 15)

- Every later peripheral that moves a stream of data looks like this: **an interrupt that feeds or drains a buffer, and a task that blocks**. Lesson 10 replaces the per-byte interrupt with **DMA**, one interrupt per block.
- The board now has a partner: lesson 09 sends real sensor readings in `$TEL` frames; Part 3 swaps this protocol for **MAVLink** and host.py for mission software.
- **Checked data, not trusted data**: a frame that fails its checksum is thrown away and counted, never half-used.

## Lab takeaways

| Part | What you do or break | Result | Why |
|---|---|---|---|
| 0 | build and talk to it | FLASH 11 868 B (36.22 % of 32 KB), RAM 6 520 B (53.06 % of 12 KB), zero warnings; banner `BRR = 417`; `led 170` lights LEDs 1, 3, 5, 7 | ~4 KB more than L07: printf formatting (`svfprintf` 688 B), `_divsi3` 468 B (the M0+ has no divide), `strtol` 545 B, shell text, ~1 KB keys |
| 1 | `--selftest`, `--frame`, damaged frames | GPS accepted; `$LED,85*6C` -> ACK; `*00` -> `$NAK,CHECKSUM*65`; no `*` -> `$NAK,NOSTAR*7D` | the board refuses and changes nothing; `PING` by hand: `$PING*10` |
| 2 | `--file`, then change one digit and delete one line | changed line **bad** and a **gap**; deleted line a gap | its `seq` never arrived intact |
| 4 | `RX_DEPTH` 4, paste a long line | `rx dropped 29`, `overruns 0`, `bar = 0x00` | the ISR caught every byte, the queue held 4; the shell acted on the remains (`strtol` found no number) |
| 5a | leave `TXEIE` on | nothing printed, not even the banner | `TXE` is true whenever idle |
| 5b | remove the print lock | one warning, `'print_lock' defined but not used`; nothing visible in Renode | reason it: protocol task (3) preempts telemetry (2) when a byte arrives |
| 6 | seventh `$TEL` field (`bar`) | `$TEL,1000,0,500,0,0,1*68`; old host.py still reads it | forward compatibility: `len(f) >= 6`, not `== 6` |
| 7 | keys and echo | arrows decoded; Esc reported only at the next key; typing pauses telemetry | sequences are frames; `uart_getc()` has no timeout |

## Exam focus

1. **BRR for 115 200 at 48 MHz?** 416.67 -> **417** (`0x1A1`), 115 108 baud, 0.08 % slow, tolerated (resync on every start bit).
2. **BRR for 38 400 at 48 MHz, byte time?** 48 000 000 / 38 400 = **1250**; 10 / 38 400 = **260 µs** (26 µs is one bit; 208 µs forgets start and stop).
3. **BRR reads 5000 at 48 MHz; a 48-character line, polled `printf`?** 9600 baud, 960 bytes/s, 48 / 960 s = **50 ms** (40 ms if you forget start and stop).
4. **BRR 417 but the core is still at the reset 12 MHz?** 12 000 000 / 417 ≈ 28 800 baud, a quarter of 115 200: **garbage characters**. Right value at 12 MHz: 104.
5. **`'A'` (`0x41`) on the wire?** start 0, `1 0 0 0 0 0 1 0` (LSB first), stop 1: 10 bits.
6. **Why must receive be an interrupt, and what does the 64-byte queue buy?** One byte in the UART, overwritten after 86.8 µs; the queue stretches the deadline to 64 × 86.8 µs = 5.5 ms.
7. **USART2's vector and priority byte?** IRQ 28 -> vector 44 at `0x080000B0`; priority 1 -> `IPR[7]` byte 0 = `0x40`.
8. **Which line clears ORE?** `USART2->ICR = USART_ICR_ORECF;` Not `USART2->ISR &= ~USART_ISR_ORE` (ISR is read only), not a read of `RDR` (clears `RXNE`).
9. **The five clearing conventions?** EXTI write 1; UIF write 0; CC1IF read `CCR1`; RXNE read `RDR` / TXE write `TDR`; ORE write 1 to `ICR`.
10. **Handler never clears ORE: predict.** Fine until the first overrun, then reception stops for good.
11. **`else` removed, `TXEIE` left on: predict.** Nothing printed, not even the banner; zero warnings.
12. **`CR1` idle and sending?** `0x2D` (UE, RE, TE, RXNEIE) and `0xAD` (+ TXEIE).
13. **Why is `CR1 |= TXEIE` in `_write()` a critical section but the ring needs no lock?** `CR1` has two writers (task and ISR); each ring index has one.
14. **Ring full test, and why one slot stays empty?** `(head + 1) % 256 == tail`; otherwise full and empty both read `head == tail`.
15. **Why does `printf` reach the ring without editing `printf`?** Strong `_write()` in `uart.c` beats the weak one in `retarget.c` at link time.
16. **NMEA checksum of `PING`?** `50 ^ 49 ^ 4E ^ 47` = **`10`**: `$PING*10`. Not `2E` (a sum), not `34` (`$` included), not `16` (decimal).
17. **Which damaged copy of `$LED,85*6C` passes?** `$LED,94*6C` (bit 0 flipped in two bytes cancels). `84` (one bit), `86` (two bits, one byte) and `8` (a byte lost) are rejected.
18. **host.py, one digit changed in one `$TEL` line of ten?** good 9, bad 1, lost 1.
19. **Arrow key vs Esc key?** Both start with `0x1B`; only 50 ms of silence tells a lone Esc. A CSI sequence ends at the first byte in `0x40-0x7E`.
20. **Why is a `$` line never echoed, and why does telemetry wait while typing?** host.py would read its own command as a board frame; `sta$TEL,...` does not start with `$` and would be skipped.
