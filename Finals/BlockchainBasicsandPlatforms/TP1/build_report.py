"""Fills the TP1 template (which stops after A.1) and builds the submission ZIP in out/."""
import copy
import json
import subprocess
import sys
import zipfile
from decimal import Decimal
from pathlib import Path

import docx
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor
from docx.table import Table
from docx.text.paragraph import Paragraph

HERE = Path(__file__).parent
# Name and ID live in ../student.json (git-ignored); see student.example.json.
ME = json.loads((HERE.parent / "student.json").read_text())
FULL_NAME = f"{ME['surname']} {ME['given_name']}"
SCREENS = HERE / "screens"
OUT = HERE / "out"
TEMPLATE = HERE / "SOC4190 Term Project 1 Template.docx"
ZIP_NAME = f"SOC4190_TP1_{ME['student_id']}_{ME['surname']}.zip"

V = json.loads((HERE / "my_values.json").read_text())
C = json.loads((HERE / "chain_data.json").read_text())
ADDR = "0x1F8457aB11aC563252C8E3D7a7e65d924e6b386C"
COURSE = "0x02B75C782186B7615730A246D0b366d54Fa38772"
GUESTBOOK = "0x683da2EF81ea1a9a68506033c21575F254A73B54"
STORAGE = "0x84F223cC8D1c40EB0B125d34768856dE2F7A673c"
missing = []


def dec(wei, places):
    """Etherscan style: exact decimal, trailing zeros dropped."""
    s = format(Decimal(wei) / (Decimal(10) ** places), "f")
    return s.rstrip("0").rstrip(".") if "." in s else s


def gwei(wei):
    return f"{dec(wei, 9)} Gwei"


def eth(wei):
    return f"{dec(wei, 18)} ETH"


def clear(cell):
    for p in cell.paragraphs[1:]:
        p._element.getparent().remove(p._element)
    p = cell.paragraphs[0]
    for r in list(p.runs):
        r._element.getparent().remove(r._element)
    return p


def set_text(cell, text, mono=False, size=None, bold=False):
    """Replace a grey placeholder with black answer text; lines split on \\n."""
    p = clear(cell)
    for i, line in enumerate(str(text).split("\n")):
        if i:
            p.add_run().add_break()
        run = p.add_run(line)
        run.font.color.rgb = RGBColor(0, 0, 0)
        run.italic = False
        run.bold = bold
        if mono:
            run.font.name = "Courier New"
            run._element.get_or_add_rPr().get_or_add_rFonts().set(qn("w:eastAsia"), "Courier New")
        if size:
            run.font.size = Pt(size)


def set_image(cell, name, label, width=6.7):
    for ext in ("png", "jpg", "jpeg", "PNG", "JPG", "JPEG"):
        f = SCREENS / f"{name}.{ext}"
        if f.exists():
            break
    else:
        missing.append(f"screens/{name}.jpg  ({label})")
        return
    p = clear(cell)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run().add_picture(str(f), width=Inches(width))
    tr = cell._tc.getparent()
    trpr = tr.find(qn("w:trPr"))
    if trpr is not None:
        for h in trpr.findall(qn("w:trHeight")):
            trpr.remove(h)


doc = docx.Document(TEMPLATE)
body = doc.element.body
T = [Table(el, doc) for el in body.iterchildren() if el.tag == qn("w:tbl")]
P = {p.text.strip(): p for p in doc.paragraphs if p.text.strip()}
# Snapshot the blank building blocks before anything in the template is filled.
H2_TPL = copy.deepcopy(P["Your own numbers"]._element)
H3_TPL = copy.deepcopy(P["A.1 — Deploy Storage from your registered address   [8]"]._element)
NORMAL_TPL = copy.deepcopy(P["Work them out once and write them here, at the top of the report."]._element)
KV_TPL = copy.deepcopy(T[4]._tbl)
SHOT_TPL = copy.deepcopy(T[5]._tbl)
anchor = P["etc…"]._element

# --- header ---
T[0]._tbl.getparent().remove(T[0]._tbl)
for p in doc.paragraphs:
    if p.text.strip() == "`":
        for r in p.runs:
            r.text = ""
set_text(T[1].cell(1, 2), FULL_NAME)
set_text(T[1].cell(2, 2), ME["student_id"])
for r in T[1].rows[0].cells:
    for p in r.paragraphs:
        for run in p.runs:
            if run.text.strip() == "`":
                run.text = ""

set_text(T[3].cell(0, 1), f"{V['N']}   ({ME['student_id']} → last five digits {V['N']})")
set_text(T[3].cell(1, 1), "10098")
set_text(T[3].cell(2, 1), ADDR, mono=True, size=9)
set_text(T[3].cell(3, 1), STORAGE, mono=True, size=9)
set_text(T[3].cell(4, 1), GUESTBOOK, mono=True, size=9)

# --- A.1 (already in the template) ---
set_text(T[4].cell(0, 1), STORAGE, mono=True, size=9)
set_text(T[4].cell(1, 1), C["deploy"]["hash"], mono=True, size=8)
set_image(T[5].cell(0, 0), "a1_remix", "A.1 Remix: Environment + Account")
set_image(T[6].cell(0, 0), "a1_etherscan", "A.1 deploy on Etherscan")


def put(el):
    anchor.addprevious(el)
    return el


def heading(text, level=3):
    el = put(copy.deepcopy(H3_TPL if level == 3 else H2_TPL))
    p = Paragraph(el, doc)
    for r in p.runs[1:]:
        r._element.getparent().remove(r._element)
    p.runs[0].text = text


def para(text, bold_prefix=None):
    el = put(copy.deepcopy(NORMAL_TPL))
    p = Paragraph(el, doc)
    for r in list(p.runs):
        r._element.getparent().remove(r._element)
    if bold_prefix:
        p.add_run(bold_prefix).bold = True
    p.add_run(text)


def kv(rows, mono_values=False, size=None):
    el = put(copy.deepcopy(KV_TPL))
    t = Table(el, doc)
    while len(t.rows) < len(rows):
        el.append(copy.deepcopy(t.rows[-1]._tr))
    while len(t.rows) > len(rows):
        el.remove(t.rows[-1]._tr)
    for i, (k, v) in enumerate(rows):
        set_text(t.cell(i, 0), k, bold=True, size=9)
        set_text(t.cell(i, 1), v, mono=mono_values, size=size)
    return t


def placeholder(cell, title, lines):
    """Keep the template's grey look: bold title paragraph, then one italic paragraph per line."""
    p_title, p_desc = cell.paragraphs[0], cell.paragraphs[1]
    p_title.runs[0].text = title
    p_desc.runs[0].text = lines[0]
    prev = p_desc._element
    for line in lines[1:]:
        el = copy.deepcopy(p_desc._element)
        prev.addnext(el)
        Paragraph(el, doc).runs[0].text = line
        prev = el


def shot(name, caption, title="SCREENSHOT", lines=None, width=6.7):
    el = put(copy.deepcopy(SHOT_TPL))
    t = Table(el, doc)
    before = len(missing)
    set_image(t.cell(0, 0), name, caption, width)
    if len(missing) > before:
        placeholder(t.cell(0, 0), title, lines or [caption])
    sp = Paragraph(put(copy.deepcopy(NORMAL_TPL)), doc)
    for r in list(sp.runs):
        r._element.getparent().remove(r._element)


def grid(header, rows, first_w=1.45, total_w=7.0, size=7.5):
    """Table in the KV style with len(header) columns; header row uses the label style."""
    el = put(copy.deepcopy(KV_TPL))
    t = Table(el, doc)
    ncol = len(header)
    other_w = (total_w - first_w) / (ncol - 1)
    widths = [first_w] + [other_w] * (ncol - 1)
    grid_el = el.find(qn("w:tblGrid"))
    for g in list(grid_el):
        grid_el.remove(g)
    for w in widths:
        gc = grid_el.makeelement(qn("w:gridCol"), {qn("w:w"): str(int(w * 1440))})
        grid_el.append(gc)
    tr_tpl = t.rows[0]._tr
    label_tc, value_tc = tr_tpl.findall(qn("w:tc"))
    for tr in list(el.findall(qn("w:tr"))):
        el.remove(tr)
    for r_i, row in enumerate([header] + rows):
        tr = copy.deepcopy(tr_tpl)
        for tc in tr.findall(qn("w:tc")):
            tr.remove(tc)
        for c_i in range(ncol):
            tc = copy.deepcopy(label_tc if (r_i == 0 or c_i == 0) else value_tc)
            tcw = tc.find(qn("w:tcPr")).find(qn("w:tcW"))
            if tcw is not None:
                tcw.set(qn("w:w"), str(int(widths[c_i] * 1440)))
                tcw.set(qn("w:type"), "dxa")
            tr.append(tc)
        el.append(tr)
    for r_i, row in enumerate([header] + rows):
        for c_i, val in enumerate(row):
            set_text(t.cell(r_i, c_i), val, size=size, bold=(r_i == 0 or c_i == 0))
    return t


# --- A.2 ---
heading("A.2 — Store N   [6]")
kv([("Transaction hash of store(10097)", C["store_n"]["hash"])], mono_values=True, size=8)
shot("a2_etherscan", "A.2 store(N) on Etherscan")

# --- A.3 ---
heading("A.3 — Retrieve   [5]")
para("retrieve returned 0: uint256: 10097 (a call: no MetaMask window, no transaction).")
shot("a3_retrieve_N", "A.3 Remix retrieve = N")

# --- A.4 ---
heading("A.4 — Store N+1, retrieve again   [8]")
kv([("Transaction hash of store(10098)", C["store_n1"]["hash"])], mono_values=True, size=8)
shot("a4_etherscan", "A.4 store(N+1) on Etherscan")
shot("a4_retrieve_N1", "A.4 Remix retrieve = N+1")

# --- A.5 ---
heading("A.5 — Transaction or call? And the nonce   [8]")
para("", bold_prefix="(a)")
kv([("A.1 deploy", "transaction"),
    ("A.2 store(10097)", "transaction"),
    ("A.3 retrieve", "call"),
    ("A.4 store(10098)", "transaction"),
    ("A.4 retrieve", "call")])
para(" retrieve is a view function: Remix asked one Sepolia node to run it locally and send back the answer, "
     "so nothing was signed, nothing changed in the account book and no validator was paid, which is why it cost nothing. "
     "Because it never became a transaction, it was never put in a block, and Etherscan only lists what is in blocks.",
     bold_prefix="(b)")
para(f" Nonce before the deploy: {C['deploy']['nonce']} (the Nonce on the deploy's page). "
     f"Nonce after the second store: {C['store_n1']['nonce']} + 1 = {C['store_n1']['nonce'] + 1}. "
     "It grew by 4, not 3, because every transaction from my address uses exactly one nonce, and I sent four: "
     "the deploy, store(10097), store(10097) a second time (Remix showed an error, so I pressed Transact again and "
     f"MetaMask had queued both; nonce 2, tx {C['store_n_dup']['hash'][:10]}…, same value), and store(10098). "
     "The two calls to retrieve did not touch the nonce.",
     bold_prefix="(c)")
para(" The contract address is computed from the sender's address and the sender's nonce "
     "(keccak256 of rlp(sender, nonce)), so the same deploy sent one transaction later would use nonce 1 instead of 0 "
     "and get a different address.",
     bold_prefix="(d)")

# --- Part B ---
heading("Part B — The gas diary   [35 points]", level=2)
heading("B.1 — One plain transfer   [3]")
kv([("Transaction hash", C["transfer"]["hash"]),
    ("From → To", f"{ADDR} → {COURSE}"),
    ("Value", "0.001 ETH")], mono_values=True, size=8)
shot("b1_etherscan", "B.1 transfer on Etherscan")

heading("B.2 — The table   [12]")
order = [("deploy", "Deploy (A.1)"), ("store_n", "Store N (A.2)"), ("store_n1", "Store N+1 (A.4)"),
         ("sign", "Guestbook (C.2)"), ("transfer", "Transfer (B.1)")]
rows = [
    ["Nonce"] + [str(C[k]["nonce"]) for k, _ in order],
    ["Gas limit"] + [f"{C[k]['gas_limit']:,}" for k, _ in order],
    ["Gas used"] + [f"{C[k]['gas_used']:,}" for k, _ in order],
    ["Base fee"] + [gwei(C[k]["base_wei"]) for k, _ in order],
    ["Priority (tip)"] + [gwei(C[k]["tip_wei"]) for k, _ in order],
    ["Max fee"] + [gwei(C[k]["max_wei"]) for k, _ in order],
    ["Gas price"] + [gwei(C[k]["price_wei"]) for k, _ in order],
    ["Transaction fee"] + [eth(C[k]["fee_wei"]) for k, _ in order],
    ["Burnt"] + [eth(C[k]["burnt_wei"]) for k, _ in order],
    ["Savings"] + [eth(C[k]["savings_wei"]) for k, _ in order],
]
grid([""] + [h for _, h in order], rows)
para("All values copied from sepolia.etherscan.io (Gas Limit & Usage by Txn, Gas Fees, Gas Price, Transaction Fee, "
     "Burnt & Txn Savings Fees, Other Attributes → Nonce). The extra store(10097) with nonce 2 is not one of the five "
     "and is left out of the table.")

heading("B.3 ✍ — Check Etherscan's arithmetic by hand   [14]")
shot("b3_hand_1", "B.3 handwritten sheet, page 1: transfer (B.1)", width=5.4)
shot("b3_hand_2", "B.3 handwritten sheet, page 2: store N (A.2) and conclusion")

heading("B.4 — Read your diary   [6]")
para(f" The deploy used the most gas ({C['deploy']['gas_used']:,}). A deploy creates a whole new account and writes "
     "the contract's code into it, and since October Sepolia charges extra for every new line in the account book, "
     "so it is far more expensive than a store transaction that only changes one number.",
     bold_prefix="(a)")
para(f" Store N used {C['store_n']['gas_used']:,} gas and store N+1 used {C['store_n1']['gas_used']:,}. "
     "Before A.2 the contract's number was 0, an empty slot, so A.2 had to create a new storage entry, which is "
     "charged as new state (and extra on Sepolia); A.4 only overwrote a slot that already existed, which is much cheaper.",
     bold_prefix="(b)")
para(" 21,000 gas is the fixed base cost that every transaction pays for being signed, checked and included. "
     "The course address is a plain account with no code (eth_getCode returns 0x) and my transfer carried no input "
     "data, so nothing else ran and nothing above the base cost was charged.",
     bold_prefix="(c)")

# --- Part C ---
heading("Part C — The class guestbook   [30 points]", level=2)
heading("C.2 — Sign once   [12]")
kv([("Transaction hash of sign(10097)", C["sign"]["hash"])], mono_values=True, size=8)
shot("c2_etherscan", "C.2 sign(N) on Etherscan")

heading("C.3 — Read your entry and the total   [10]")
kv([("numberOf(my address)", "10097"),
    ("count()", f"{V['guestbook_count_seen']}  (read on 14.11.2026 at about 23:02, Tashkent time)")])
shot("c3_guestbook", "C.3 Remix numberOf + count")

heading("C.4 — Your contract or ours?   [8]")
para(" My N now lives in the guestbook's account, the instructor's contract at 0x683d…3B54, not in any contract of mine. "
     "The guestbook keeps 300 students apart with the mapping numberOf: each entry is stored under the sender's address "
     "(msg.sender), so my 10097 sits in the line for my address and nobody else can write to it.",
     bold_prefix="(a)")
para(" The instructor paid the gas for deploying the guestbook, and I paid the gas for my line in it with my sign transaction. "
     "Nobody pays when the grader reads all the entries, because numberOf, count and signers are calls: "
     "a node answers them locally and nothing goes into a block.",
     bold_prefix="(b)")

anchor.getparent().remove(anchor)
cp = doc.core_properties
cp.title = "SOC4190 Term Project I — Report"
cp.author = cp.last_modified_by = f"{FULL_NAME} ({ME['student_id']})"

OUT.mkdir(exist_ok=True)
docx_path = OUT / "report.docx"
doc.save(docx_path)
subprocess.run(["soffice", "--headless", "--convert-to", "pdf", "--outdir", str(OUT), str(docx_path)],
               check=True, capture_output=True)
with zipfile.ZipFile(OUT / ZIP_NAME, "w", zipfile.ZIP_DEFLATED) as z:
    z.write(OUT / "report.pdf", "report.pdf")
print("built", OUT / ZIP_NAME)
if missing:
    print("STILL MISSING:")
    for m in missing:
        print("  -", m)
    sys.exit(2)
