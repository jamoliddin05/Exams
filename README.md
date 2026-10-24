# Exams

Midterm preparation for my INHA University courses: lecture slides, study notes, solved homework, sample midterms with
worked answers, and interactive pages that explain the sample questions with figures.

## Courses

Each course lives in `Midterms/<Course>/`.

| Course | Contents |
|---|---|
| Artificial Intelligence | slides, notes, notebooks, 5 sample midterms, [visual page](https://claude.ai/artifact/NEzuNxcuxexbHSV5zDe7cn) |
| Big Data Analytics | slides, notes, HW1 solution |
| Embedded Software Design | slides, notes |
| Multimedia Computing | slides, notes, HW1 solution, 5 sample midterms, [visual page](https://claude.ai/artifact/FFfagp6CpEJvE15eAPJ6Zf) |
| Software Engineering | notes, sample midterms, revision checklist |

Sample midterm answers cite the slide they come from and link to the notes and to the question on the visual page.
The visual pages are private claude.ai artifacts, built from each course's `visuals/` folder.

## Claude Code skills

In `.claude/skills/`:

- **eclass-exam-prep**: takes an INHA eClass course link, downloads the lectures and homework, writes study notes per
  lecture, and solves the homework into `SOL.md` + `SOL.pdf`.
- **exam-visualizer**: turns sample exam questions into one interactive page per course, with a tab per sample. Each
  question gets the answer, a worked solution, step-through figures and a deep link such as `#s1-mc5`.
