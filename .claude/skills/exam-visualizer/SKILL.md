---
name: "exam-visualizer"
description: "Use when the user wants exam or homework questions explained with visualizations in an artifact: a pasted question with \"explain / visualize this\", a whole sample midterm or final to visualize, or more questions added to an existing visual study page such as Multimedia Midterm Visuals. Builds one claude.ai artifact per course with a tab per sample, one article per question (answer, worked solution, interactive SVG figures, exam line) and deep links like #s1-mc5."
---

# Exam visualizer

Output: one private claude.ai artifact per course that explains exam questions with figures. Sections are the sample
exams (tabs), parts are question types (multiple choice, written). Each question is an article with the answer, a short
worked solution, 1 to 4 figures (steppers and sliders where the method is a procedure) and an exam line with the slide
source. Every section and question has a deep link: `<artifact url>#s2` or `#s2-w3`.

```
.claude/skills/exam-visualizer/
  SKILL.md
  framework/
    shell.html     page shell: CSS tokens (light + dark), QV helper library, tabs, index, deep links, copy-link buttons
    build.py       assembles PROJECT/parts/* into one page, lints (ids, tabs, colors, syntax)
    check.py       headless Chrome: script errors, overflow, screenshots per question
    CONTRACT.md    the authoring spec for questions (markup, visual rules, writing rules, QV API, process)
<Course>/visuals/  the project, e.g. Midterms/MultimediaComputing/visuals
  project.json     title, texts, artifact URL, sources, parts, sections
  parts/<section>-<part>.html|.js
  dist/            built page and screenshots (gitignored)
```

`FRAMEWORK` below means `/Users/jamol/Exams/.claude/skills/exam-visualizer/framework`; `PROJECT` means the course's
visuals folder.

Existing projects:

| Course | PROJECT | Artifact |
|---|---|---|
| Multimedia Computing, midterm (5 samples × 10 MC + 8 written) | `Midterms/MultimediaComputing/visuals` | https://claude.ai/artifact/FFfagp6CpEJvE15eAPJ6Zf |
| Artificial Intelligence, midterm (5 samples × 10 MC + 6 written, weeks 2–6) | `Midterms/ArtificialIntelligence/visuals` | https://claude.ai/artifact/NEzuNxcuxexbHSV5zDe7cn |
| Embedded System and Software Design, midterm (3 samples × 33 MC, Topics tab `#topic0`–`#topic8`; see its `BRIEF.md`) | `Midterms/EmbeddedSoftwareDesign/visuals` | https://claude.ai/artifact/PLXMNL7atJ796AWntJCHtE |

About the user: keep messages short; they read the page in the claude.ai viewer, light or dark. They like being given
`#` links to the exact question.

## 1. Pick the project

- A course that already has `visuals/project.json`: use it.
- A pasted question with no course named: grep the question text in `/Users/jamol/Exams/*/*/MidtermSamples/*.md` (and
  the HW folders) to find the course, sample and number. If nothing matches, ask which course it belongs to.
- A new course: copy the Multimedia `project.json` to `<Course>/visuals/project.json` and change `title` (2 to 4 words,
  e.g. "Big Data Midterm Visuals"), `kicker`, `lede`, `foot`, `sources`, `sections` (one per sample: `id` `s1`...,
  `tab`, `title`, `meta`) and `parts` (`key`, `title`, `index`, `chip`: `num` for MC, `topic` for written). Leave
  `artifact` empty until the first publish. Set `out` to `dist/<slug>.html`.
- Add `**/visuals/dist/` to `/Users/jamol/Exams/.gitignore` if it is missing.

## 2. Write the questions

`FRAMEWORK/CONTRACT.md` is the spec. Read it before writing any article, every time; it carries the visual rules,
writing rules and the QV API, and its reference implementation (`s1-mc5`) sets the quality bar.

- One to three questions: write them yourself into the right `parts/<scope>.*` files, in question order.
- A whole sample or exam: one `general-purpose` agent per scope, all spawned in one message so they run in parallel
  (a 5-sample midterm = 10 agents, about 75 to 85 minutes each). Tell the user the expected time. Brief:

  > You are writing one part of a study web page, "<title>", which explains exam questions with interactive
  > visualizations. First read /Users/jamol/Exams/.claude/skills/exam-visualizer/framework/CONTRACT.md and follow it
  > exactly. PROJECT = <abs path>. Your scope: `<scope>` = <Sample N, part name, questions K to M (topics)>, from
  > <abs path of the source md>. You own only PROJECT/parts/<scope>.html and .js. Other agents are writing other
  > scopes in the same folder at the same time; don't touch their files and don't delete anything. When done, return
  > the final message described in the contract.

- Ids are permanent once published: they are the deep links.
- The source md answers were checked when they were written. If an agent reports an error in them, tell the user; don't
  edit their notes unasked.

## 3. Build and check

```
python3 -I FRAMEWORK/build.py PROJECT                     # full page -> PROJECT/<out>
python3 -I FRAMEWORK/check.py PROJECT/<out>               # whole page: errors, missing inits, overflow
python3 -I FRAMEWORK/check.py PROJECT/<out> s2-w3 s4-mc1  # plus screenshots of these questions
```

The full build must show 0 errors, 0 warnings, and `ALL: ... "errors": [], "missingInit": [], "overflow": []`. Then
look at screenshots of a few questions across sections and both themes yourself before publishing.

## 4. Publish

- New course: call `Artifact` `quickstart` (intent `other`) as the tool requires, then publish `PROJECT/<out>` with
  icon `chart` and a one-sentence description. Put the returned URL into `project.json` → `artifact`, rebuild and
  publish again to that URL: the Copy link buttons only appear once the URL is known.
- Update in the same session: publish the same file path again.
- Update in a later session: `Artifact` `read` the URL first (a publish without a read is refused), then publish
  `PROJECT/<out>` with `url` set. Never publish a partial build over the full page (`build.py` refuses `--only`
  without `--out`).

## 4b. Link back from the sample files

Once the artifact URL is known, every question in `sources.questions` gets a deep link next to its Source/Notes lines,
so the md and the page point at each other:

- multiple choice, last line of the answer blockquote: `> **Visual:** [Sample 1 › Part 1 Q5](<artifact url>#s1-mc5)`
- written, after the `**Source:**` / `**Notes:**` lines: `**Visual:** [Sample 1 › Part 2 Q3 <topic>](<artifact url>#s1-w3)`

The line before it needs two trailing spaces (markdown line break). New questions added later get their line too.

## 5. Report

Give the artifact link and the `#` links the user needs: `#s1` to `#sN` for sections, `#s1-mc5` and `#s1-w3` for
questions. Say that every question has a Copy link button, since the viewer's address bar does not follow in-page
navigation. Mention errors found in the source md, and figures that use illustrative data.

## Gotchas learned

- Headless Chrome cannot go below 500px wide; `check.py` uses 500 for the narrow check.
- The publish skeleton adds `[hidden]{display:none!important}` and a body reset. The shell includes both so local
  previews match the published page.
- `sips` ignores a zero crop offset and centers the crop; `check.py` crops from y ≥ 1.
- IBM Plex Sans and JetBrains Mono misplace combining marks (B̂, x̄); the shell sets letter + mark runs in STIX Two
  automatically, including text drawn later by figures.
- Several agents running Chrome at once: `check.py` uses a fresh profile per run and a 300 s timeout.
- `rm` with a glob after `cd` is blocked by a safety check. Don't clean `dist/` with `rm`; builds and screenshots
  overwrite their files.
- Only a plain `#token` reaches the page. Section and question ids (`s1`, `s1-mc5`) are safe; never use tokens like
  `settings`, `sidebar` or anything starting with `comment-`.
