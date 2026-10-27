# SOC3050 ARM midterm practice

Three original practice exams based on the instructor's [Fall 2026 ARM midterm guide](https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/exam_midterm/overview.md) and lessons **00–08**. Target: STM32C031C6 / Cortex-M0+.

**33 multiple-choice questions, one answer A–D, 60 minutes, no calculator.** These are independently written practice questions, not official or recovered past papers. Each sample covers every lesson, with 3–5 questions per lesson.

## Start here

- [Online practice](https://exams.eessketit.uz/) — hosted separately on the contributor's VDS.
- [Standalone trainer](Trainer.html) — download and open in a browser for offline practice; instant green/red answer feedback, explanations, timer and scoring work without a server. The first answer is locked for scoring. On the GitHub file page use Download raw file.
- [Study guide in Russian](Study-guide-RU.md) — all nine lessons, formulas, failure modes and implementation nuances.
- [Last review](Last-review.md) — compact revision sheet and preparation plans.

| Sample | Questions | Key and worked explanations |
|---|---|---|
| A | [Sample A](Sample-A.md) | [Answers A](Answers-A.md) |
| B | [Sample B](Sample-B.md) | [Answers B](Answers-B.md) |
| C | [Sample C](Sample-C.md) | [Answers C](Answers-C.md) |

Questions are in English; explanations are in Russian. Every answer links to the relevant instructor deck and slide numbers at the pinned source commit. The trainer keeps an attempt only in its current tab: reloading resets it. A score is diagnostic, not a prediction of the real exam grade.

## Coverage and source conventions

| Lesson | Topic | Questions per sample |
|---|---|---|
| 00 | Programmer's model | 3 |
| 01 | Instruction set | 4 |
| 02 | Development | 3 |
| 03 | Concurrency | 3 |
| 04 | Startup and linker | 3 |
| 05 | GPIO and interrupts | 5 |
| 06 | Time and timers | 4 |
| 07 | RTOS | 4 |
| 08 | UART and Python host, including terminal keys slide 9b | 4 |

The study guide distinguishes the instructor's simplified model from implementation details: saved PRIMASK for nested critical sections, PWM preload enables, task versus NVIC priorities, serialized task-side TX producers, counter-wrap assumptions and the delayed lone-Esc timeout check in the actual protocol task. Lessons 09 onward are outside the published midterm scope.

## Rebuild and check

Python 3.10+ and its standard library are sufficient for the bank and standalone trainer:

```bash
python Midterms/EmbeddedSoftwareDesign/MidtermSamples/build_materials.py
python Midterms/EmbeddedSoftwareDesign/MidtermSamples/build_trainer.py
python Midterms/EmbeddedSoftwareDesign/MidtermSamples/verify_materials.py
```

`question-bank.json` is generated from the readable question definitions in `build_materials.py`. Correct answer positions are shuffled deterministically and balanced across A–D. The verifier checks all 99 questions, 34 numerical exercises, lesson distribution and local Markdown links.

The full online site is generated with `scripts/build_exam_site.py`; instructions are in [the deployment guide](../../../deploy/README.md). It uses ordinary static hosting; this PR does not configure GitHub Pages or require hosting permissions in this repository.

Prepared 2026-10-27 from `gnoejh/soc3050code` commit `7906b2fdc7895f9656402033bb5af66f5fd3eee8`. Original instructor materials remain upstream; existing course slides and notes are preserved.
