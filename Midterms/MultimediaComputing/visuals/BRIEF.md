# Multimedia midterm visuals: brief for topic authors (addendum to CONTRACT.md)

`FRAMEWORK/CONTRACT.md` is the spec for markup, visual rules, writing rules and the QV API. This file adds the Topics
tab and overrides the contract where they differ. Read both, every time.

- `WT` = `/Users/jamol/Exams/.claude/worktrees/mc-topics` (a git worktree; work only inside it)
- `FRAMEWORK` = `WT/.claude/skills/exam-visualizer/framework` (use this copy, not the one in the main checkout)
- `PROJECT` = `WT/Midterms/MultimediaComputing/visuals`
- `COURSE` = `WT/Midterms/MultimediaComputing`
- `REF` = `/private/tmp/claude-501/-Users-jamol-Exams/2792f7ba-67f8-4920-bdfe-fc840320d0fb/scratchpad/ref`

## What the Topics tab is

The page already explains all 90 sample questions (5 samples × 10 MC + 8 written). The new first tab, Topics, has one
beginner explainer per lecture in the exam scope: lectures 2, 3, 4, 5, 6, 7, 9, 10, 11, 12. A reader who has never
seen the lecture must be able to study only this article and then answer every sample question on it.

Two references, read both before writing:

1. **Format and tone**: `REF/ai-gradient-descent-from-zero.html`, an "X from Zero" page from the user's AI course. It
   is the model to copy: start from the idea in plain words, define every term before using it, one idea per
   section, a formula box after the plain explanation, a small worked example by hand, "Try it" figures with a slider
   or step buttons, the common mistakes, a cheat sheet, and "how to write it on the exam". It is a standalone page
   with its own CSS; you write the same content with the shell's classes instead.
2. **Integration into this framework**: `REF/topics-tp@05.html` + `.js`, a topic article of the ESD course built on
   the same shell (numbered `.sol-part` blocks, figures, tables, the exam line, the related list at the end).

## Your files

Topic author for lecture `L` owns `PROJECT/parts/topics-tp@LL.html` + `.js` (`LL` two digits: `topics-tp@04`,
`topics-tp@12`). One article, id `topic<L>` (no leading zero: `topic4`). Other authors write other lectures in the
same folder at the same time; touch nothing else and delete nothing.

| L | Notes file (`COURSE/notes/`) | Slides (`COURSE/slides/`) | Week | Sample questions | `data-topic` | Title |
|---|---|---|---|---|---|---|
| 2 | `02_Week1_Sound_Sampling_Quantization_Fourier.md` | `Multimedia Computing L2 (2).pptx` | 1 | 8 | `Sound and sampling` | Sound and Sampling from Zero |
| 3 | `03_Week2_Audio_SNR_MIDI_PCM.md` | `Multimedia Computing L3 (3).pptx` | 2 | 7 | `SNR, MIDI and PCM` | SNR, MIDI and PCM from Zero |
| 4 | `04_Week2_DPCM_Entropy_Huffman_LZW.md` | `Multimedia Computing L4_update (2).pptx` | 2 | 10 | `Lossless coding` | Lossless Coding from Zero |
| 5 | `05_Week3_ArithmeticCoding_LossyCompression_MPEG.md` | `Multimedia Computing L5 (1) (1).pptx` | 3 | 8 | `Arithmetic coding and MPEG` | Arithmetic Coding and MPEG Audio from Zero |
| 6 | `06_Week3_Image_Basics_Perception_Resampling.md` | `Multimedia Computing_L6 (1) (1).pptx` | 3 | 9 | `Image basics` | Digital Images from Zero |
| 7 | `07_Week4_Pixel_Relationships_Color_XYZ.md` | `Multimedia Computing_L7 (3) (1).pptx` | 4 | 8 | `Pixels and color` | Pixel Relationships and Color from Zero |
| 9 | `09_Week5_Intensity_Transforms_Histogram.md` | `Multimedia Computing_L9_up (1).pptx` | 5 | 12 | `Intensity and histograms` | Histograms and Point Operations from Zero |
| 10 | `10_Week5_Morphology.md` | `Multimedia Computing L10_up (1).pptx` | 5 | 10 | `Morphology` | Morphology from Zero |
| 11 | `11_Week6_Spatial_Filtering_Edges.md` | `Multimedia_Computing L11_up (2).pptx` | 6 | 11 | `Filtering and edges` | Filtering and Edges from Zero |
| 12 | `12_Week7_Pattern_Recognition.md` | `Multimedia Computing_L12_up (1).pptx` | 7 | 10 | `Pattern recognition` | Pattern Recognition from Zero |

- The notes cover the lecture slide by slide and are the main source. For a slide the notes skip or you doubt, read the
  deck's text: `unzip -p "<pptx>" ppt/slides/slideN.xml | sed -e 's/<[^>]*>/ /g' | tr -s ' '`.
- Sample questions: `COURSE/MidtermSamples/Midterm_Sample_1.md` … `_5.md`. Find the ones on your lecture (their
  `**Source:**` lines name `L<your lecture>`) and read them and their answers: they show what the exam asks. The
  article must teach everything they need. Don't solve them in the article; the shell lists them under it.
- The existing question articles for those questions are in `PROJECT/parts/s*-mc.html` and `s*-w.html` (look for
  `data-ref="topic<L>"`). Read them so the topic article uses the same terms, numbers and conventions, and so your
  figures explain the mechanism from the ground up rather than repeat theirs.

## Article template

```html
<article class="q" id="topic4" data-part="tp" data-num="4" data-topic="Lossless coding">
  <div class="q-head">
    <p class="eyebrow">Lecture 4 · Week 2 · 10 sample questions</p>
    <h3 class="q-title">Lossless Coding from Zero</h3>
    <p class="fig-lede">Two or three sentences: what this lecture is about, why it matters, what it builds on.
      Plain words, no symbol undefined.</p>
  </div>

  <div class="sol-part">
    <h4>Words you need</h4>
    <div class="why-grid">                       <!-- 5 to 10 cards, the lecture's core terms -->
      <div class="mini"><h5>Entropy η</h5><p>One line in plain words. Symbol, unit.</p></div>
      ...
    </div>
  </div>

  <div class="sol-part">
    <h4>1. The idea in one picture (slides 2–4)</h4>
    <p>Start with the problem this solves, in everyday words. Then the rule.</p>
    <p class="formula">η = −Σ pᵢ log₂ pᵢ   (bits per symbol)</p>
    <pre class="calc">a worked example with small numbers, every step written</pre>
    <figure class="fig">                         <!-- "Try it" figures: QV.slider / QV.steps -->
      <div class="fig-head"><span class="fig-no">Figure 1</span><h4>Try it: ...</h4></div>
      <p class="fig-lede">What to do and what to look at.</p>
      <div data-viz="entropy"></div>
      <p class="step-note" data-role="entropy-note" aria-live="polite"></p>
    </figure>
  </div>
  ... one .sol-part per idea, in slide order, usually 8 to 14 ...

  <div class="sol-part">
    <h4>Mistakes that cost marks</h4>
    <ul><li>4 to 8 traps from the samples and slides, each with the correct version.</li></ul>
  </div>
  <div class="sol-part">
    <h4>Cheat sheet</h4>
    <div data-viz="cheat"></div>                 <!-- QV.table: fact or formula | value or example -->
  </div>
  <div class="sol-part">
    <h4>How to write it on the exam</h4>
    <pre class="calc">the answer skeleton for each written-question type of this lecture, with the
lines that earn marks (definition, method, working, result, check)</pre>
  </div>
  <div class="exam-line">
    <span class="label">Exam focus</span>
    <ul><li>The facts and calculations most likely to be asked, short lines with worked numbers.</li></ul>
    <p class="source">Slides: L4 p.2–35 · Notes: 04_Week2_DPCM_Entropy_Huffman_LZW.md</p>
  </div>
  <div class="sol-part">
    <h4>Sample questions on this lecture</h4>
    <div data-role="related"></div>              <!-- the shell fills this; leave it empty -->
  </div>
</article>
```

## Rules for the topic article

- Beginner level. Assume the reader knows school math and nothing of the lecture. Define each term the first time it
  appears, in the "Words you need" cards or inline. Say why before how. Prefer a small concrete example to an abstract
  statement.
- Cover every slide of the deck that carries content, in deck order; join neighbouring slides that make one idea into
  one block. Headings `N. Short heading (slides a–b)`. Quote the slide wording for definitions.
- 6 to 12 figures, one per mechanism that a picture explains better than text. Most should be interactive ("Try it"):
  a slider for a continuous parameter (frequency vs sampling rate, bits per sample, gamma, threshold), step buttons for
  procedures (building a Huffman tree, filling an LZW dictionary, narrowing the arithmetic-coding interval, sliding a
  structuring element or a 3×3 mask, accumulating a histogram CDF, assigning a point to the nearest class mean). The
  default state must already be meaningful. Same visual rules as question figures (CONTRACT.md).
- Short blocks: 2 to 6 bullets or short sentences per block. Tables for comparisons and parameter lists. No filler.
- Mark anything that is not on the slides as "(textbook context)", as the reference page does.
- Every number you print or draw is recomputed with `python3 -I` (plain Python, no numpy).
- Only the article has an id. Sub-blocks get no ids and no anchors. Hosts are `data-viz`, text slots `data-role`.
- Copy-link buttons and the related list are added by the shell; don't write either.

## Build and check

```
python3 -I FRAMEWORK/build.py PROJECT --only topics-tp@LL --out PROJECT/dist/LL-t.html
python3 -I FRAMEWORK/check.py PROJECT/dist/LL-t.html topic<L>
```

In a topic-only build the related list says "No sample question is on this topic yet". That is expected.
0 errors, 0 warnings, and `"errors": [], "missingInit": [], "overflow": []` are required. Read every 900-light chunk
screenshot of your article and at least a third of the 500-dark chunks (the ones with the widest figures). At most two
screenshot rounds.

## Final message

At most 20 lines: the id you finished, one line per figure, anything you were unsure of, and any error you found in
the notes or the sample answers (with the evidence).
