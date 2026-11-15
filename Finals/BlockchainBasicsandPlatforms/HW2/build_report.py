"""Fill the SOC4190 HW2 template and export report.pdf + the submission ZIP.

Run with a Python that has python-docx:  python build_report.py
User-only values come from my_inputs.json, screenshots and handwriting photos from screens/.
"""
import copy
import json
import subprocess
import sys
import zipfile
from datetime import datetime
from pathlib import Path

import docx
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor
from docx.table import Table
from docx.text.paragraph import Paragraph

HERE = Path(__file__).resolve().parent
# Name and ID live in ../student.json (git-ignored); see student.example.json.
ME = json.loads((HERE.parent / "student.json").read_text())
FULL_NAME = f"{ME['surname']} {ME['given_name']}"
TEMPLATE = HERE / "SOC4190 Homework 2 Template.docx"
OUT = HERE / "out"
SCREENS = HERE / "screens"
INP = json.loads((HERE / "my_inputs.json").read_text())

STUDENT_ID = ME["student_id"]
SURNAME = ME["surname"]
H2 = "850,097"
D = SURNAME.upper()
VARIANT = "C"
T_TXID = "fad44ff289827dcb3c54bc63754c816a3ed4ddb3636cbe9a9024c1411370c866"
ZIP_NAME = f"SOC4190_HW2_{STUDENT_ID}_{SURNAME}.zip"

missing = []


def v(x, label):
    if x in (None, ""):
        missing.append(label)
        return None
    return str(x)


def set_text(cell, text, mono=False, size=None):
    """Replace a grey placeholder with black answer text; lines split on \\n."""
    if text is None:
        return
    for p in cell.paragraphs[1:]:
        p._element.getparent().remove(p._element)
    p = cell.paragraphs[0]
    for r in list(p.runs):
        r._element.getparent().remove(r._element)
    for i, line in enumerate(str(text).split("\n")):
        if i:
            p.add_run().add_break()
        run = p.add_run(line)
        run.font.color.rgb = RGBColor(0, 0, 0)
        run.italic = False
        if mono:
            run.font.name = "Courier New"
            run._element.rPr.rFonts.set(qn("w:eastAsia"), "Courier New")
        if size:
            run.font.size = Pt(size)


def drop_height(cell):
    tr = cell._tc.getparent()
    trpr = tr.find(qn("w:trPr"))
    if trpr is not None:
        for h in trpr.findall(qn("w:trHeight")):
            trpr.remove(h)


def set_image(cell, name, label, width=6.6):
    """Put screens/<name>.(png|jpg|jpeg) into a SCREENSHOT/PHOTO box, or record it as missing."""
    for ext in ("png", "jpg", "jpeg", "PNG", "JPG", "JPEG", "heic"):
        f = SCREENS / f"{name}.{ext}"
        if f.exists():
            break
    else:
        missing.append(f"screens/{name}.png  ({label})")
        return
    for p in cell.paragraphs[1:]:
        p._element.getparent().remove(p._element)
    p = cell.paragraphs[0]
    for r in list(p.runs):
        r._element.getparent().remove(r._element)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run().add_picture(str(f), width=Inches(width))
    drop_height(cell)


doc = docx.Document(TEMPLATE)
body = doc.element.body
T = [Table(el, doc) for el in body.iterchildren() if el.tag == qn("w:tbl")]

# --- header block ---
set_text(T[2].cell(0, 1), FULL_NAME)
set_text(T[2].cell(1, 1), STUDENT_ID)
set_text(T[2].cell(2, 1),
         "Claude (Anthropic, in Claude Code): fetched the block 850,097 data from the mempool.space API, "
         "checked the arithmetic and the raw-hex byte offsets, helped word the written answers and filled "
         "this template. The wallet actions, screenshots and handwritten sheets are my own.")

set_text(T[4].cell(0, 1), f"{H2}   (840,000 + 10097)")
set_text(T[4].cell(1, 1), D)
set_text(T[4].cell(2, 1), T_TXID, mono=True, size=9)
set_text(T[4].cell(3, 1), f"{VARIANT}   (last digit 7 → C)")
set_text(T[4].cell(4, 1), v(INP["account1_address"], "account1_address"), mono=True, size=9)

# --- Part 1 ---
for col, key in ((1, "tx1_course"), (2, "tx2_account2")):
    for row, f in enumerate(("from", "to", "value", "block", "status"), start=1):
        set_text(T[5].cell(row, col), v(INP[key][f], f"{key}.{f}"), mono=f in ("from", "to"), size=8 if f in ("from", "to") else None)
set_image(T[6].cell(0, 0), "1_1_tx1", "Etherscan page of tx 1, address bar visible")
set_image(T[7].cell(0, 0), "1_1_tx2", "Etherscan page of tx 2, address bar visible")
set_image(T[8].cell(0, 0), "1_1_metamask", "MetaMask showing the sender address", width=3.2)
set_image(T[9].cell(0, 0), "1_2_accounts", "MetaMask with Account 1 and Account 2", width=3.2)

set_text(T[10].cell(0, 0),
         "MetaMask is a hierarchical deterministic wallet (BIP-39/BIP-32/BIP-44): the twelve words are turned into "
         "one 512-bit seed, and every account is derived from that seed along the path m/44'/60'/0'/0/i, so "
         "Account 1 is index 0, Account 2 is index 1, and the same phrase always regenerates the same keys and "
         "addresses. If the phrase is lost (and the browser copy is gone), every private key derived from it is "
         "lost, so nobody can ever sign for those addresses again: the coins stay on the chain but are frozen "
         "forever, because no one can recompute the keys.")
set_image(T[11].cell(0, 0), "1_3_restored", "restored wallet, same Account 1 address", width=3.2)
set_text(T[12].cell(0, 0),
         "The account lives on the chain: its balance and history are part of the Sepolia state kept by every "
         "node, while the browser only holds an encrypted copy of the private key used to sign, and MetaMask the "
         "company never has it, which is why importing the phrase in a fresh profile showed the same Account 1.")

set_image(T[13].cell(0, 0), "1_4_metamask", "broken address in MetaMask Send to", width=3.2)
set_image(T[14].cell(0, 0), "1_4_etherscan", "sepolia.etherscan.io/address/<broken>")
rm = INP["reaction_metamask"]
re_ = INP["reaction_etherscan"]
set_text(T[15].cell(0, 0),
         "Broken address (one character in the middle changed, A → 9): 0x02B75C782186B76157309246D0b366d54Fa38772. "
         f"MetaMask {rm}, Etherscan {re_}, so MetaMask caught the typo. "
         "EIP-55: the address is hashed with Keccak-256 (in lower case), and each letter a–f is written in capitals "
         "exactly when the matching hex digit of that hash is 8 or higher, so the pattern of capitals is a "
         "checksum that the wallet recomputes and compares.")
set_text(T[16].cell(0, 0),
         "Written in all small letters the address carries no checksum at all (EIP-55 treats all-lowercase as "
         "unchecked), so any 40 hex digits look valid and the wallet would accept the typo; with mixed case one "
         "changed character breaks the capital-letter pattern and is detected unless all ~15 letter cases happen "
         "to match by chance, about 1 in 2^15.")

set_text(T[17].cell(1, 1), "0 BTC")
set_text(T[17].cell(1, 2), "199")
set_text(T[17].cell(1, 3), "04.10.2026 19:32 UTC (block 969,889)")
set_text(T[17].cell(2, 1), "0 ETH")
set_text(T[17].cell(2, 2), "6,120")
set_text(T[17].cell(2, 3), "06.11.2026 15:15 UTC")
set_text(T[18].cell(0, 1),
         "09.11.2026, 00:05 (Tashkent, UTC+5). Bitcoin: mempool.space. Ethereum: etherscan.io showed a "
         "Cloudflare check, so I used the explorer eth.blockscout.com.")
set_text(T[19].cell(0, 0),
         "The private key 1 is public knowledge, so anyone can sign for these addresses: sweeper bots watch them "
         "and, the moment coins arrive, broadcast a transaction that moves them out with a higher fee, so they win "
         "the race and are often included in the very same block. The money is taken by whoever runs the fastest "
         "bot (the miner or validator only gets the fee), and the sender never sees it again; the balance of 0 "
         "after 199 and 6,120 transactions shows exactly this.")

# --- Part 2 ---
set_text(T[20].cell(0, 1), T_TXID, mono=True, size=9)
set_image(T[21].cell(0, 0), "2_1_tx", "mempool.space page of T, txid visible")
set_image(T[22].cell(0, 0), "2_1_hand", "handwritten sheet 2.1", width=5.5)
set_image(T[23].cell(0, 0), "2_2_outputs", "outputs of T with spent markers, address bar visible")
set_text(T[24].cell(0, 1), v(INP["utxo_screenshot_time"], "utxo_screenshot_time"))
set_text(T[24].cell(1, 1),
         "None. T has one output (#0, 0.00446827 BTC to bc1qzlefdrv5k9hz86rt0yj26fmjn42g0ue5nzrln7) and it is "
         "spent by transaction 06edc70d…f71ea7aa.")
set_text(T[25].cell(0, 0),
         "The UTXO set is the list, kept by every full node, of all transaction outputs that exist and have not "
         "been spent yet; together they are all the bitcoins that can be spent right now. Every input must point "
         "to an entry of this set and is removed from it when the transaction is accepted, so a second transaction "
         "that tries to spend the same output no longer finds it and is rejected as a double spend.")
set_text(T[26].cell(0, 1), "C   (2 outputs, 226 bytes, block 940,000)")
set_image(T[27].cell(0, 0), "2_3_hand", "handwritten bracketed hex, variant C", width=5.5)
set_text(T[28].cell(0, 1),
         "Output 0: 9d86010000000000 → 0x01869d = 99,997 sat\n"
         "Output 1: ea33010000000000 → 0x0133ea = 78,826 sat")
set_text(T[28].cell(1, 1), "0.00099997 BTC = 99,997 sat;  0.00078826 BTC = 78,826 sat (match)")
set_text(T[29].cell(0, 0),
         "The 32 bytes after the input count, 4995a361…48cfb77a, appear nowhere on the explorer, but read "
         "backwards two hex digits at a time they give 7ab7cf48…61a39549, exactly the txid the explorer shows "
         "for the transaction that this input spends.")
set_image(T[31].cell(0, 0), "2_4_ab", f"terminal: echo {STUDENT_ID} + python3 txid.py variant.hex next to explorer")
set_image(T[32].cell(0, 0), "2_4_c", "terminal: old and new txid after one changed hex digit")
set_text(T[33].cell(0, 0),
         "Transaction malleability means the bytes of a transaction can be changed without making it invalid "
         "(for example the signature can be rewritten as (r, n − s) or the scriptSig re-encoded), so the same "
         "payment gets a different txid. The signature cannot protect the txid because in a legacy transaction "
         "the signature sits inside the scriptSig, which is hashed into the txid but is left out of the message "
         "that is signed (a signature cannot sign itself), so the signature still verifies after those bytes "
         "change; SegWit fixes this by moving signatures into the witness, which the txid does not cover.")
set_text(T[34].cell(0, 0),
         "No: on the hex of T the program printed 192 bytes, txid 6d0eb8e3…ce6cc8b5, not fad44ff2…1370c866. "
         "T is SegWit, so the API hex contains the marker, flag and witness, and hashing it gives the wtxid; the "
         "txid is the double SHA-256 of the 82 bytes without them, which does give fad44ff2…1370c866.")

leg = ("223", "223", "892", "40,280")
sw = ("222", "141", "561", "42,300")
for c, x in enumerate(leg, start=1):
    set_text(T[35].cell(1, c), x)
for c, x in enumerate(sw, start=1):
    set_text(T[35].cell(2, c), x)
set_text(T[36].cell(0, 1), "79b47c7f02d21e84d983706550e01f4e6a2b85f26dd01e3263d6d41576b57fd0", mono=True, size=8)
set_text(T[36].cell(1, 1), "eea239c0259f77ae26e0c076b73cca1ab2242b0e86ea8ef6fcec52c8631a7d03", mono=True, size=8)
set_image(T[37].cell(0, 0), "2_5_hand", "handwritten sheet 2.5", width=5.5)

rows = (("fees_morning", "morning"), ("fees_afternoon", "afternoon"), ("fees_evening", "late evening"))
same_all = True
for r, (key, name) in enumerate(rows, start=1):
    d = INP[key]
    t = v(d["time"], f"{key}.time")
    set_text(T[38].cell(r, 0), f"{name}  {t}" if t else None)
    for c, f in enumerate(("low", "medium", "high", "blocks"), start=1):
        set_text(T[38].cell(r, c), v(d[f], f"{key}.{f}"))
    if not (d["low"] is not None and d["low"] == d["medium"] == d["high"]):
        same_all = False
set_image(T[39].cell(0, 0), "2_6_morning", "mempool.space front page, morning, clock visible")
set_image(T[40].cell(0, 0), "2_6_afternoon", "mempool.space front page, afternoon, clock visible")
set_image(T[41].cell(0, 0), "2_6_evening", "mempool.space front page, late evening, clock visible")
fee_text = ("The supply of block space is fixed (one block of at most 4 million weight units about every ten "
            "minutes) while demand changes with the hour, so when more people are awake and sending, the mempool "
            "fills and senders outbid each other, and when activity drops the queue drains and the estimates fall.")
if same_all:
    fee_text += (" All three tiers showed the same number, which means fewer transactions are waiting than one "
                 "block can hold: even the minimum fee gets into the next block, so demand for space is low.")
set_text(T[42].cell(0, 0), fee_text)

# --- Part 3 ---
set_text(T[43].cell(0, 1), "7")
set_text(T[43].cell(1, 1), "7   (hash 0b2c40588d7b6064…2ea96ff)")
set_image(T[44].cell(0, 0), "3_1_miner", f"Human Miner, D = {D}, nonce 7")
set_text(T[45].cell(0, 1), "77")
set_text(T[45].cell(1, 1), "77   (hash 00527d79ab5a2afa…1f6909b)")
set_image(T[46].cell(0, 0), "3_2_miner", f"Human Miner, D = {D}, nonce 77")
set_image(T[47].cell(0, 0), "3_2_hand", "handwritten sheet 3.2", width=5.5)
set_text(T[48].cell(0, 0),
         "Lucky both times: one zero took 7 attempts against 16 expected, and two zeros took 77 attempts against "
         "256 expected, about a third of the average.")
set_text(T[49].cell(0, 0),
         "Because SHA-256 cannot be predicted, the only way to find a nonce is to try them one by one (16^k tries "
         "on average for k leading zeros), while checking a claimed nonce takes a single hash. So every node can "
         "verify a new block instantly and for free, but nobody can fake or rewrite a block without redoing all "
         "that expensive work, and that is what lets strangers trust the chain without trusting the miner.")
set_image(T[50].cell(0, 0), "3_4_coinbase", "coinbase of block 850,097, address bar visible")
set_image(T[51].cell(0, 0), "3_4_hand", "handwritten sheet 3.4", width=5.5)
set_text(T[52].cell(0, 1), "F2Pool  (coinbase text “/F2Pool/”)")

c1, c2 = INP["conf_first"], INP["conf_second"]
set_text(T[53].cell(0, 1), v(c1["time"], "conf_first.time"))
set_text(T[53].cell(1, 1), v(c1["count"], "conf_first.count"))
set_text(T[53].cell(2, 1), v(c2["time"], "conf_second.time"))
set_text(T[53].cell(3, 1), v(c2["count"], "conf_second.count"))
set_image(T[54].cell(0, 0), "3_5_first", "Etherscan Block confirmations, first look, clock visible")
set_image(T[55].cell(0, 0), "3_5_second", "Etherscan Block confirmations, second look, clock visible")
set_image(T[56].cell(0, 0), "3_5_hand", "handwritten sheet 3.5", width=5.5)
sec = None
try:
    fmt = "%H:%M"
    mins = (datetime.strptime(c2["time"][-5:], fmt) - datetime.strptime(c1["time"][-5:], fmt)).seconds / 60
    sec = mins * 60 / (int(str(c2["count"]).replace(",", "")) - int(str(c1["count"]).replace(",", "")))
except (TypeError, ValueError, ZeroDivisionError):
    pass
per = f"about {sec:.1f} seconds" if sec else "about 12 seconds"
set_text(T[57].cell(0, 0),
         f"A Sepolia block came every {per}, roughly fifty times faster than Bitcoin's ten minutes (600 s), because "
         "Ethereum's proof of stake has fixed 12-second slots while Bitcoin's difficulty is tuned for one block "
         "every ten minutes, so blocks built on top of mine pile up about fifty times faster.")

# --- remove the yellow instruction box and the closing checklist ---
T[0]._element.getparent().remove(T[0]._element)
els = list(body.iterchildren())
start = next(i for i, el in enumerate(els)
             if el.tag == qn("w:p") and Paragraph(el, doc).text.strip() == "Before you submit")
for el in els[start:]:
    if el.tag != qn("w:sectPr"):
        body.remove(el)

OUT.mkdir(exist_ok=True)
docx_path = OUT / "report.docx"
doc.save(docx_path)
subprocess.run(["soffice", "--headless", "--convert-to", "pdf", "--outdir", str(OUT), str(docx_path)],
               check=True, capture_output=True)

with zipfile.ZipFile(OUT / ZIP_NAME, "w", zipfile.ZIP_DEFLATED) as z:
    z.write(OUT / "report.pdf", "report.pdf")
    z.write(HERE / "src" / "txid.py", "src/txid.py")

print("built", OUT / "report.pdf", "and", OUT / ZIP_NAME)
if missing:
    print(f"\nSTILL MISSING ({len(missing)}):")
    for m in missing:
        print("  -", m)
    sys.exit(2)
