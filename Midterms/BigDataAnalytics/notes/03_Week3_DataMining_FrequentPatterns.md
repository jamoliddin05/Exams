# Week 3: K-means on MapReduce, Silhouette, Data Mining Overview, Frequent Patterns & Apriori

**What this lecture is about:** finishing MapReduce (K-means as a key/value job + silhouette score), a tour of data-mining data types and functions (Han Ch. 1), then frequent itemsets, association rules, closed/max patterns and the Apriori algorithm (Han Ch. 6).

Admin: office hours Mon 11:30–12:30, Thu 5:00–6:00, room 2-402, building A.
Course outline slide ("This Class"): Introduction (Hadoop: keys and values; Word count, PageRank, K-means clustering) → Basic Concepts of Analytics → Frequent Patterns → Classification → Neural Network → Real-world projects in telco business.

---

## 1. K-means clustering (K = 2 illustration)

Slides credit: Kyuseok Shim, VLDB 2012 tutorial.

- Points: (1,1) (2,1) (1,2) (5,5) (6,5) (5,6) (7,7). Current centers: **A = (7/3, 8/3)**, **B = (20/4, 19/4)**.
- **Assign step:** each point, one at a time, goes to the closest center.

| Point | Class |
|---|---|
| (1,1), (2,1), (1,2) | A |
| (5,5), (6,5), (5,6), (7,7) | B |

- **Update step ("Update the cluster means"):**
  - $A' = \left(\frac{1+2+1}{3}, \frac{1+1+2}{3}\right) = (4/3,\ 4/3)$
  - $B' = \left(\frac{5+6+5+7}{4}, \frac{5+5+6+7}{4}\right) = (23/4,\ 23/4)$
- Repeat assign + update until centers stop changing. (My check: with A', B' no point changes cluster, so the next iteration converges.)

## 2. K-means using Map/Reduce (keys & values)

- Iteratively improves partitioning of data into *k* clusters. **Do** {Map; Reduce} **until all new centers are not changed**.
- **Map** — input: one data point; the *k* centers are **broadcast** to every map function ("Broadcasting is used!"). Finds the closest center → emits **key = closest center, value = point**: `(center1, p11) (center1, p12) (center2, p21) (center3, p31) …`
- **Shuffle** groups by key → Reduce input: `(center1, [p11, p12])`, `(center2, [p21, p22, p23])`, …
- **Reduce** — input: one of the *k* centers + all points whose closest center it is. Calculates the new center → emits `(center_i, center_i')`.
- **K-means for large data** (refined version):

| Phase | Input | Output |
|---|---|---|
| Map (center[1…k] broadcast) | point *p* | $\langle c_i, (p, d)\rangle$; $c_i$ = closest center to *p*, *d* = **squared distance** between $c_i$ and *p* |
| Reduce | $\langle c_i, ((p,d)_1 \dots (p,d)_n)\rangle$ | $\langle c_i, (\sum p)/n \rangle$ (new center) and $\langle \text{"SSD"}, \sum d \rangle$ (sum of squared distances) |

## 3. Silhouette score (performance metric of clustering)

$$s = \frac{n - i}{\max(n, i)}$$

- *n* = mean **nearest-cluster** distance (to points of the nearest other cluster); *i* = mean **intra-cluster** distance.
- (textbook context) Range $[-1, 1]$: ≈1 well clustered, ≈0 on a boundary, <0 likely in the wrong cluster. Usually written $(b-a)/\max(a,b)$.
- Example: *i* = 2, *n* = 6 → (6 − 2)/6 = **0.67**.

---

## 4. Data mining overview (reading: Han, Kamber, Pei, 3rd ed., Ch. 1)

**On what kinds of data?**
- Database-oriented: relational database, transactional database.
- Advanced: data streams & sensor data; time-series & sequence data (incl. bio-sequences); graphs & social networks; spatial data; the World-Wide Web; multimedia data.
- Scale illustrations: Google index ≈ 45–65 billion webpages (2016–2021 chart), Bing ≈ up to ~17 billion; YouTube: **500 hours of video uploaded every minute** = 720,000 hours/day (Tubefilter 2019).

**Data mining functions**

| Function | Key points from slides |
|---|---|
| Association & correlation | Frequent patterns/itemsets ("what is bought together in your Walmart?"); association, correlation **vs. causality**; typical rule `Diaper → Beer [0.5%, 75%]` = (support, confidence); challenge: mine efficiently in large datasets |
| Classification | Build models from training examples; describe/distinguish classes for future prediction (countries by climate, cars by gas mileage); predict unknown labels. Methods: decision trees, naïve Bayes, SVM, neural nets, rule-based, pattern-based, logistic regression. Apps: credit-card fraud, direct marketing, classifying stars/diseases/web pages |
| Cluster analysis | **Unsupervised** (class label unknown); group data into new categories (e.g., houses → distribution patterns); principle: **maximize intra-class similarity, minimize inter-class similarity** |
| Outlier analysis | Outlier = object not complying with general behavior; noise or exception ("one person's garbage could be another's treasure"); found as by-product of clustering/regression; fraud detection, rare events |
| Structure & network analysis | **Graph mining**: frequent subgraphs (chemical compounds), trees (XML), substructures (web fragments). **Information networks**: social networks = actors (nodes) + relationships (edges), e.g., author/terrorist networks; multiple heterogeneous networks (friends, family, classmates); links carry semantics → **link mining**. **Web mining**: web as a big information network, PageRank → Google; community discovery, opinion mining, usage mining |

---

## 5. Frequent patterns: basic concepts (Han Ch. 6)

- **Frequent pattern**: a pattern (set of items, subsequences, substructures…) that occurs frequently in a data set. First proposed by Agrawal, Imielinski, Swami [AIS93] for frequent itemsets & association rule mining.
- Motivation: inherent regularities — what is bought together (beer & diapers?!), what is bought after a PC? Applications: basket data, web log (click-stream), DNA sequence analysis.
- Importance: intrinsic property of datasets; foundation for association/correlation, sequential & structural (sub-graph) patterns, frequent-pattern-based clustering.

**Running DB (5 transactions):**

| Tid | Items bought |
|---|---|
| 10 | Beer, Nuts, Diaper |
| 20 | Beer, Coffee, Diaper |
| 30 | Beer, Diaper, Eggs |
| 40 | Nuts, Eggs, Milk |
| 50 | Nuts, Coffee, Diaper, Eggs, Milk |

**Definitions**
- **Itemset**: set of one or more items. **k-itemset**: $X = \{x_1, \dots, x_k\}$.
- **(Absolute) support / support count** of X: number of transactions containing X.
- **(Relative) support** *s*: fraction of transactions containing X = probability a transaction contains X.
$$s(X) = \frac{\text{count}(X)}{|D|}$$
- **X is frequent** if its support is **no less than** minsup: $\text{sup}(X) \ge \text{minsup}$ (equality counts as frequent).

## 6. Association rules

Find all rules $X \to Y$ with minimum support **and** minimum confidence.

$$\text{support}(X \to Y) = P(X \cup Y) = \frac{\text{count}(X \cup Y)}{|D|}$$
$$\text{confidence}(X \to Y) = P(Y \mid X) = \frac{\text{count}(X \cup Y)}{\text{count}(X)} = \frac{\text{sup}(X \cup Y)}{\text{sup}(X)}$$

- $X \cup Y$ = transaction contains **both** X and Y (Venn diagram: "customer buys both").
- Format: `X → Y (support, confidence)` — support first.

**Slide example:** minsup = 50%, minconf = 50% → count ≥ 2.5, i.e. ≥ 3 of 5.
Frequent patterns: Beer:3, Nuts:3, Diaper:4, Eggs:3, {Beer, Diaper}:3.

| Rule | Support | Confidence |
|---|---|---|
| Beer → Diaper | 3/5 = **60%** | 3/3 = **100%** |
| Diaper → Beer | 3/5 = **60%** | 3/4 = **75%** |

Same support both directions; confidence differs (denominator = antecedent's count). Slide says "(many more!)", but at these thresholds {Beer, Diaper} is the only frequent 2-itemset, so these are the only two rules.

**Deriving rules from a frequent itemset** (textbook context; the slides only show the example above):
1. For each frequent itemset *l* with |l| ≥ 2, for every non-empty proper subset *s* ⊂ *l*, form $s \to (l - s)$.
2. Support = sup(*l*) (the same for all rules from *l*); confidence = sup(*l*)/sup(*s*). Keep if conf ≥ minconf.
3. A k-itemset gives $2^k - 2$ candidate rules.

## 7. Closed patterns and max-patterns

- Problem: a long pattern has a combinatorial number of sub-patterns: $\{a_1..a_{100}\}$ has $\binom{100}{1} + \binom{100}{2} + \dots + \binom{100}{100} = 2^{100} - 1 \approx 1.27 \times 10^{30}$ sub-patterns. **Solution: mine closed patterns and max-patterns instead.**
- **Closed**: X is frequent and there is **no super-pattern Y ⊃ X with the same support** as X (Pasquier et al., ICDT'99).
- **Max-pattern**: X is frequent and there is **no frequent super-pattern Y ⊃ X** (Bayardo, SIGMOD'98).
- (textbook context) max ⊆ closed ⊆ frequent; closed keeps every support count (lossless), max loses them (lossy).

**Exercise (slides):** DB = {⟨a1,…,a100⟩, ⟨a1,…,a50⟩}, min_sup = 1.

| Question | Answer | Why |
|---|---|---|
| Closed itemsets | ⟨a1,…,a100⟩: 1 and ⟨a1,…,a50⟩: 2 | Any proper subset of {a1..a50} has support 2, the same as its superset {a1..a50} → not closed. {a1..a50}'s only superset with more items has support 1 ≠ 2 → closed |
| Max-patterns | ⟨a1,…,a100⟩: 1 | {a1..a50} has a frequent superset (support 1 ≥ min_sup) → not max |

## 8. Complexity of frequent itemset mining

- The number of frequent itemsets is sensitive to minsup; when minsup is low, it can be exponential.
- Worst case vs. expected probability: Walmart has $10^4$ products → chance to pick one given product $10^{-4}$; a particular set of 10 products ≈ $10^{-40}$.
- Scalable methods: **Apriori** (candidate generation-and-test), improving Apriori's efficiency, **FPGrowth** (pattern growth), **ECLAT** (vertical data format).

---

## 9. Apriori

**Downward closure property:** *any subset of a frequent itemset must be frequent.* If {beer, diaper, nuts} is frequent, so is {beer, diaper}: every transaction containing {beer, diaper, nuts} also contains {beer, diaper}.
(Slide DB: 1 Beer,Diaper,Eggs; 2 Beer,Diaper,Nuts; 3 Diaper,Nuts,Eggs,Coffee; 4 Beer,Diaper,Nuts,Eggs,Coffee,Milk → {beer,diaper,nuts}: 2 ≤ {beer,diaper}: 3.)

**Apriori pruning principle:** if **any** itemset is infrequent, its supersets should not be generated or tested (Agrawal & Srikant VLDB'94; Mannila et al. KDD'94).

**Method:**
1. Scan the DB once to get frequent 1-itemsets (running DB, min count 3): {Beer}, {Nuts}, {Diaper}, {Eggs}. Coffee and Milk (2 each) are dropped.
2. Generate length-(k+1) **candidates** from length-k **frequent** itemsets. Slide animation pairs each item with every later one: {Beer,Nuts}, {Beer,Diaper}, {Beer,Eggs}, {Nuts,Diaper}, {Nuts,Eggs}, {Diaper,Eggs}.
3. Test the candidates against the DB. (My counts: B,N 1; B,D 3; B,E 1; N,D 2; N,E 2; D,E 2 → only {Beer,Diaper} is frequent.)
4. Terminate when no frequent or candidate set can be generated.

**Pseudo-code (as on slide):**
```
Ck: Candidate itemset of size k
Lk: frequent itemset of size k

L1 = {frequent items};
for (k = 1; Lk != ∅; k++) do begin
    Ck+1 = candidates generated from Lk;
    for each transaction t in database do
        increment the count of all candidates in Ck+1 that are contained in t
    Lk+1 = candidates in Ck+1 with min_support
end
return ∪k Lk;
```

### Candidate generation: self-join and pruning (examined)

| Term | Professor's meaning | Notation |
|---|---|---|
| **Self-join result** | Pairs of itemsets in $L_k$ merged into (k+1)-itemsets: $L_k * L_k$ | e.g. $L_3 * L_3$ |
| **Candidate (after pruning)** | Self-join results that survive pruning: remove any (k+1)-itemset that has a k-subset **not in $L_k$**. **No DB scan yet** | $C_{k+1}$ |
| **Frequent** | Candidates whose support counted in a DB scan is ≥ min_support | $L_{k+1}$ |

**Slide example:** $L_3$ = {abc, abd, acd, ace, bcd}
- Self-joining $L_3 * L_3$: **abcd** from abc + abd; **acde** from acd + ace → self-join result = {abcd, acde}.
- Pruning: **acde is removed because ade is not in $L_3$** (cde is missing too). abcd: abc, abd, acd, bcd all ∈ $L_3$ → kept.
- **$C_4$ = {abcd}**. $L_4$ would then need a DB scan (no DB given).
- (textbook context) Join rule: two k-itemsets are joined only if their **first k−1 items match** (items in sorted order). That is why abc + acd is not joined, and why the self-join gives exactly {abcd, acde} as on the slide.
- **Professor's HW1 answer key uses a looser rule:** join any two k-itemsets whose union has k+1 items (any k−1 shared items, not only the prefix). From L2 = {AC, AD, AE, CD, DE} the key lists CDE (from CD + DE) in the self-join result. Pruning removes the extra itemsets anyway, so $C_{k+1}$ is the same under both rules. Only the "self-join result" line differs, so on the exam use the looser rule for that line.

### Full worked example: Supmin 2 (count)

**TDB:** 10: A,C,D · 20: B,C,E · 30: A,B,C,E · 40: B,E

| C1 (1st scan) | sup | | L1 | sup |
|---|---|---|---|---|
| {A} | 2 | | {A} | 2 |
| {B} | 3 | | {B} | 3 |
| {C} | 3 | | {C} | 3 |
| {D} | **1** ✗ | | {E} | 3 |
| {E} | 3 | | | |

| C2 (from L1, 2nd scan) | sup | | L2 | sup |
|---|---|---|---|---|
| {A,B} | **1** ✗ | | {A,C} | 2 |
| {A,C} | 2 | | {B,C} | 2 |
| {A,E} | **1** ✗ | | {B,E} | 3 |
| {B,C} | 2 | | {C,E} | 2 |
| {B,E} | 3 | | | |
| {C,E} | 2 | | | |

- C2 = all 6 pairs of L1 items; nothing pruned at k = 2 because every 1-subset is in L1.
- **C3:** self-join L2 by shared first item: {B,C}+{B,E} → {B,C,E}. {A,C} and {C,E} have no partner. Prune check: BC, BE, CE ∈ L2 ✓ → **C3 = {B,C,E}**.
- **3rd scan:** {B,C,E} in Tids 20, 30 → **L3 = {B,C,E}: 2**.
- C4: L3 has one itemset → nothing to join → stop. Result = L1 ∪ L2 ∪ L3. Three DB scans.

---

## 10. Exam focus

- **Definitions to state exactly:** frequent (support ≥ minsup), closed (no superset with the *same* support), max (no *frequent* superset), downward closure, Apriori pruning principle.
- **Rule numbers from the Supmin=2 TDB** (|D| = 4), from L3 = {B,C,E}: 2:

| Rule | Support | Confidence |
|---|---|---|
| BC → E | 2/4 = 50% | 2/2 = 100% |
| CE → B | 50% | 2/2 = 100% |
| BE → C | 50% | 2/3 = 67% |
| B → CE | 50% | 2/3 = 67% |
| C → BE | 50% | 2/3 = 67% |
| E → BC | 50% | 2/3 = 67% |

  With minconf = 70%, only BC → E and CE → B pass. From L2: B → E and E → B (75%, 100%); A → C (50%, 100%), C → A (50%, 67%).
- **Closed/max on the running Beer DB** (my example, min count 3): frequent = Beer 3, Nuts 3, Diaper 4, Eggs 3, {Beer,Diaper} 3.
  - Closed = {Nuts, Diaper, Eggs, {Beer,Diaper}}. Beer is not closed: {Beer,Diaper} has the same support, 3.
  - Max = {Nuts, Eggs, {Beer,Diaper}}. Diaper and Beer are not max because {Beer,Diaper} is a frequent superset.
- **Self-join vs. candidate trap:** given $L_k$, list (1) the self-join result, (2) what pruning removes and which missing subset causes it, (3) $C_{k+1}$. Never call $C_{k+1}$ "frequent" before a DB scan.
- **Relative ↔ absolute minsup:** 50% of 5 transactions → count ≥ 2.5 → ≥ 3.
- **K-means MR:** map emits (closest center, point) or ⟨c_i, (p, d)⟩; reduce emits the new center (Σp/n) and ⟨"SSD", Σd⟩; centers are **broadcast**; loop until centers stop changing.
- **Silhouette:** (n − i)/max(n, i); n = nearest-cluster mean distance, i = intra-cluster mean distance.
