# ESD midterm visuals: brief for authors (addendum to CONTRACT.md)

`FRAMEWORK/CONTRACT.md` is the spec. This file adds what is specific to this course and overrides the contract where
they differ. Read both, every time.

- `FRAMEWORK` = `/Users/jamol/Exams/.claude/skills/exam-visualizer/framework`
- `PROJECT` = `/Users/jamol/Exams/Midterms/EmbeddedSoftwareDesign/visuals`
- `COURSE` = `/Users/jamol/Exams/Midterms/EmbeddedSoftwareDesign`
- `MD` = the per-lesson question drafts (session scratchpad, now gone); the assembled samples are `COURSE/MidtermSamples/Midterm_Sample_{1,2,3}.md`, which are the source of truth

## The real exam (from the professor's guide)

`COURSE/slides/exam_midterm_overview.md` is the professor's own midterm guide. Read §1 (format), §2 (scope and key
contrasts), §3 your lesson's section, §4 (fact sheet), §5 (glossary), §6 (practice problems) and §7 (how to prepare).

- 60 minutes, **33 multiple-choice questions**, one mark each, four options **A–D**, exactly one correct. Closed book,
  **no calculator**: every number must be workable by hand.
- Scope: lessons 00 to 08. Every lesson gives 2 to 5 questions.
- Questions test understanding and calculation: **predict behaviour** (often silent failures: compiles, no warning,
  does nothing or hangs), **calculate by hand** (bit positions, 32-bit hex values, little-endian bytes, vector
  addresses, PSC/ARR, BRR), **choose the correct line of code** out of four, **name the concept** (the general idea,
  the alternatives, and which one this chip picked; the question describes a situation rather than asking for a
  definition).
- Never: write code, recall a register address the question does not give, recall measured-run numbers (switch
  counts, byte counts, cycle counts from a run). Facts in the guide's §4 fact sheet (pin bit rules, MODER/PUPDR codes,
  vector = 16 + n, vector address formula, timer formulas, BRR, EXC_RETURN values, memory map) count as known.
- §6 practice problems are "similar in kind and difficulty to the exam". Don't copy them; variants with other pins,
  IRQs or values are welcome.

## Three samples, 33 questions each, by lesson

Every sample has the same layout. Each lesson is one topic `topic<L>` (L = 0..8). The **correct letter for every slot
is fixed** below (it balances the answer key); put the correct option at that letter.

| Lesson | Topic id | Deck source | Notes file | Guide §3 lines | Slots per sample | Correct letters |
|---|---|---|---|---|---|---|
| 00 Programmer's model | topic0 | `slides/source/00_Architecture.md` | `notes/01_Week2_L00_ProgrammersModel.md` | 105–218 | Q1–4 | S1 B A D B · S2 D C B A · S3 D D C A |
| 01 Instruction set | topic1 | `slides/source/01_Instruction_Set.md` | `notes/02_Week2_L01_InstructionSet_Thumb.md` | 219–327 | Q5–8 | S1 D D C B · S2 A B D C · S3 C C D D |
| 02 Development | topic2 | `slides/source/02_Development.md` | `notes/03_Week3_L02_Development_Toolchain.md` | 328–415 | Q9–11 | S1 C C A · S2 C B C · S3 C A B |
| 03 Execution and concurrency | topic3 | `slides/source/03_Execution_Concurrency.md` | `notes/05_Week4_L03_Execution_Concurrency.md` | 416–503 | Q12–14 | S1 D A B · S2 C B D · S3 C C A |
| 04 Startup and linker script | topic4 | `slides/source/04_Startup_And_LinkerScript.md` | `notes/04_Week3_L04_Startup_LinkerScript.md` | 504–609 | Q15–17 | S1 A C B · S2 D C A · S3 A B D |
| 05 GPIO and interrupts | topic5 | `slides/source/05_GPIO_And_Interrupts.md` | `notes/06_Week4_L05_GPIO_Interrupts.md` | 610–751 | Q18–22 | S1 A B C A C · S2 A D A B C · S3 D A A D B |
| 06 Time and timers | topic6 | `slides/source/06_Time_And_Timers.md` | `notes/07_Week5_L06_Time_Timers.md` | 752–861 | Q23–26 | S1 C D B A · S2 D C A D · S3 A A B B |
| 07 RTOS | topic7 | `slides/source/07_RTOS.md` | `notes/08_Week6_L07_RTOS.md` | 862–1000 | Q27–30 | S1 A D B D · S2 A B B D · S3 C B C D |
| 08 UART and Python host | topic8 | `slides/source/08_UART_And_Python_Host.md` (+ code in `slides/source/08_code/`) | `notes/09_Week7_L08_UART_PythonHost.md` (written by the L08 questions author) | 1001–1106 | Q31–33 | S1 D C B · S2 B C A · S3 B D B |

Paths are relative to `COURSE`. The deck source (`Slide.md`, headings `## Slide N: title`) is the newest and wins
over the notes if they disagree; report any disagreement. The rendered decks are `COURSE/slides/<deck>.html`.
Weeks: L00 W2, L01 W2, L02 W3, L03 W4, L04 W3, L05 W4, L06 W5, L07 W6, L08 W7.

### What the guide's "How to prepare" demands of the samples

Each sample, taken as a whole, must contain all of these (the lesson that owns each is in brackets):

- arithmetic: a pin's bit field or a clear-then-set result on a given register value [05]; a single BSRR value [05];
  an IRQ's vector number or vector address [05]; PSC/ARR or an update rate [06]; BRR or a byte time [08]; an NMEA XOR
  checksum or what XOR can and cannot detect [08]; little-endian bytes of a 32-bit value [00];
- how a flag clears (EXTI write 1, TIM UIF write 0, CC1IF read CCR1, RXNE/TXE read RDR/write TDR, ORE write ICR) [08,
  and 05/06 may add one];
- which priority numbering is in use (kernel: bigger = more urgent; NVIC: 0 = most urgent) [07];
- one silent-failure prediction from each checklist: L05 slide 33 [05], L06 slide 17 [06], L08 slide 14 [08];
- "general idea vs this chip's answer" (guide §2 key contrasts): I/O model and address spaces [00], dispatch [00],
  instruction-set model, flags, return address [01], address binding [02], mutual exclusion [03], scheduling [06/07];
- lessons 00–03: most questions come from the deck's last "What You Should Be Able to Say" slide.

Within one lesson, the 3 samples together should cover most of the deck, and no two questions may test the same fact
the same way. Mix the four question kinds in every sample.

## Who owns what

Several authors write into the same folders at the same time. Touch only your own files; never delete anything.

**Questions author for lesson LL** owns:
- `MD/s1@LL.md`, `MD/s2@LL.md`, `MD/s3@LL.md`: the sample questions in markdown (format below). Write these first.
- `PROJECT/parts/s1-mc@LL.html` + `.js`, `s2-mc@LL.*`, `s3-mc@LL.*`: one MC article per question, in question order.
- Lesson 08 only: first write `COURSE/notes/09_Week7_L08_UART_PythonHost.md` in the style of
  `notes/06_Week4_L05_GPIO_Interrupts.md` (title, one-line "What this lecture is about", `## N. Title (slide N)`
  sections, tables, worked examples verified in Python, an "Exam focus" list). Headings: plain ASCII only (letters,
  digits, spaces, `.`, `,`, `:`, `(`, `)`, `-`); no dashes other than `-`, no `&`, `=`, quotes, `**`, backticks.
  150 to 300 lines.

**Topic author for lesson LL** owns `PROJECT/parts/topics-tp@LL.html` + `.js`: one article, `topic<L>`.

Lessons 02 and 03 have one author doing both jobs.

`LL` is two digits (`05`), `L` has no leading zero (`topic5`).

## Markdown format of a sample question

Exactly this, one block per question, in question order, blank line between blocks. No headers in the file.

```
**18.** Question text, self-contained  
A) option  
B) option  
C) option  
D) option

> **Answer: A)** Two to four plain sentences: why A, and why the tempting wrong options are wrong.  
> **Source:** L05 slide 12 BSRR set and reset halves · L05 slide 4 pin n at bit n, 2n, 4n  
> **Notes:** [L05 › 7. BSRR, the safe one](../notes/06_Week4_L05_GPIO_Interrupts.md#7-bsrr-the-safe-one-slides-12-13)
```

- Lines inside the question and the blockquote end with two spaces (markdown line break), as shown.
- Code or a register dump in the stem: a fenced block (```c or ```text) right after the question line, then a blank
  line, then the options.
- Notes link slug (GitHub/GoLand): lowercase the heading text; remove every character except letters, digits, spaces,
  `-` and `_`; replace each space with `-`. `## 7. BSRR, the safe one (slides 12-13)` gives
  `#7-bsrr-the-safe-one-slides-12-13`. Check each slug against the real heading with grep.
- Plain Unicode math (×, −, ≤, ≥, ², µ), no LaTeX. Hex in backticks is fine in md.
- Verify every number with `python3 -I` (plain Python, no numpy).

## MC article: differences from the contract template

- `<article class="q" id="s1-mc18" data-part="mc" data-num="18" data-topic="BSRR" data-ref="topic5">`: the
  `data-ref` names your lesson's topic. The shell lists the question under that topic and adds an "Explained in" link
  to the exam line, so don't write that link yourself.
- Eyebrow: `Question 18 · L05, BSRR value`.
- Option keys are capital letters: `<span class="key">A</span>`. Answer: `<strong>Answer: A.</strong>`.
- Code in the stem: `<pre class="calc">...</pre>` inside `.q-head`, right after the `h3` (escape `<`, `>`, `&`).
- Exam line source: `Source: L05 slide 12 · Notes: L05 › 7. BSRR, the safe one`.
- One or two figures per question, each showing the mechanism: the register with its fields and the pin's field lit,
  the 32-bit value built bit by bit, the bytes in memory at increasing addresses, the vector table with the slot
  computed, the timer counter ramp with PSC and ARR marked, the UART frame on a time axis, the ring buffer with head
  and tail, the stack frame, the interrupt entering mid read-modify-write, the priority ladder. Use `QV.steps` when
  the answer comes from a procedure (clear-then-set, building a BSRR value, XOR across bytes, a context switch).

## Topic article (Topics tab)

One article per lesson. A reader who studies only this article must be able to answer any exam question on the lesson.
Cover every slide of the deck in deck order; join neighbouring slides that make one idea into one block.

```html
<article class="q" id="topic5" data-part="tp" data-num="5" data-topic="GPIO and interrupts">
  <div class="q-head">
    <p class="eyebrow">Lesson 05 · Week 4 · 5 of 33 exam questions</p>
    <h3 class="q-title">GPIO and Interrupts: One Pin, Two Ways to Listen</h3>   <!-- the deck title -->
    <p class="fig-lede">Two or three sentences: what the lesson is about and what it builds on.</p>
  </div>
  <div class="sol-part">
    <h4>1. Short heading (slides 3–4)</h4>
    <p>...</p> <ul><li>...</li></ul>
    <pre class="calc">code or worked arithmetic</pre>
    <div data-viz="regs"></div>                         <!-- tables via QV.table -->
    <figure class="fig">...</figure>
  </div>
  ... one .sol-part per idea, usually 10 to 16 ...
  <div class="sol-part">
    <h4>General idea vs this chip</h4>
    <div data-viz="contrast"></div>                     <!-- QV.table: idea | alternatives | this chip | what follows -->
  </div>
  <div class="exam-line">
    <span class="label">Exam focus</span>
    <ul><li>The facts and calculations most likely to be asked, as short lines with worked numbers.</li></ul>
    <p class="source">Slides: L05 slides 1–34 · Notes: 06_Week4_L05_GPIO_Interrupts.md · Guide: §3 Lesson 05</p>
  </div>
  <div class="sol-part">
    <h4>Sample questions on this lesson</h4>
    <div data-role="related"></div>                     <!-- the shell fills this; leave it empty -->
  </div>
</article>
```

- `data-topic` (exactly): 0 `Programmer's model`, 1 `Instruction set`, 2 `Development`, 3 `Execution and concurrency`,
  4 `Startup and linker script`, 5 `GPIO and interrupts`, 6 `Time and timers`, 7 `RTOS`, 8 `UART and Python host`.
  Eyebrow question counts: 00 4, 01 4, 02 3, 03 3, 04 3, 05 5, 06 4, 07 4, 08 3.
- 6 to 12 figures, one per mechanism that a picture explains better than text, with step-throughs for procedures
  (stacking on interrupt entry, PendSV switch, toolchain stages, .data copy and .bss zero, the EXTI → NVIC → vector
  path, the debouncer, PSC/ARR counting, the ring buffer, building a frame and its checksum). Same visual rules as
  question figures.
- Short blocks: 2 to 6 bullets or short sentences per block, tables for register fields and comparisons. Quote the
  slide's wording for definitions. No filler.
- From the guide's §7 "How to prepare":
  - lessons 00–03: a block "What you should be able to say" that answers every item of that slide in two or three
    lines each;
  - lessons 05, 06, 08: the silent-failure checklist (L05 slide 33, L06 slide 17, L08 slide 14) as a table with a
    third column "why this symptom follows";
  - lesson 08: the five clearing conventions table (slide 4); lessons 05 and 06 mention how their own flags clear;
  - lesson 07: which priority numbering is in use (slide 9), kernel vs NVIC, side by side;
  - every lesson: the "General idea vs this chip" table with the guide §2 contrasts that belong to it (an empty table
    is not allowed; if the guide names none, use the deck's own "general idea / this chip's answer" sections).
- Ids: only the article has an id. Sub-blocks get no ids and no anchors.

## Build and check

Questions author (example for lesson 05):
```
python3 -I FRAMEWORK/build.py PROJECT --only s1-mc@05,s2-mc@05,s3-mc@05 --out PROJECT/dist/L05-q.html
python3 -I FRAMEWORK/check.py PROJECT/dist/L05-q.html s1-mc18 s1-mc19 ...    # all your ids
```
Topic author:
```
python3 -I FRAMEWORK/build.py PROJECT --only topics-tp@05 --out PROJECT/dist/L05-t.html
python3 -I FRAMEWORK/check.py PROJECT/dist/L05-t.html topic5
```
In a topic-only build the related list says "No sample question is on this topic yet". That is expected.

0 errors, 0 warnings, and `"errors": [], "missingInit": [], "overflow": []` are required. Screenshots: read the
900-light shots of every article and the 500-dark shots of the articles with the widest figures (at least a third of
them, and every chunk of a topic article). At most two screenshot rounds.

## Final message

At most 25 lines: the ids you finished; for questions authors the correct letter per question as a check line per
sample (`S1: 18 A, 19 B, ...`) and the guide §7 items each sample covers; one line per article naming its figures;
anything you were unsure of; any disagreement between the notes and the deck.
