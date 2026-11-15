# HW2: what is left for you (due today, 09.11.2026 23:55 on eClass)

Everything that can be done without your wallet, your screen or your hand is already in `out/report.pdf`.
For each step below: save the screenshot into `screens/` under the given name (png or jpg),
type the numbers into `my_inputs.json`, then ask Claude to rebuild. The build lists what is still missing.

Screenshots: use `Cmd+Shift+4` (or `Cmd+Shift+5`). Explorer pages need the **address bar** visible; 2.6 and 3.5
need the **menu-bar clock** visible. Never show the Secret Recovery Phrase or a private key.

## Do first (they take time)

1. **1.1 MetaMask** (Sepolia): get test ETH from a faucet, send **0.001** to `0x02B75C782186B7615730A246D0b366d54Fa38772`,
   add Account 2, send **0.002** to it.
   - `1_1_tx1` and `1_1_tx2`: each tx page on sepolia.etherscan.io
   - `1_1_metamask`: MetaMask showing Account 1 address
   - `my_inputs.json`: `account1_address`, From / To / Block of both txs
2. **3.5** right after tx 1: open its Etherscan page, screenshot **Block confirmations** with the clock (`3_5_first`),
   again **≥ 30 min later** (`3_5_second`). Times and counts go into `conf_first` / `conf_second`.
3. **2.6** mempool.space front page **morning, afternoon, late evening** with the clock: `2_6_morning`, `2_6_afternoon`,
   `2_6_evening`; low / medium / high sat/vB and blocks waiting go into `fees_*`.

## Wallet

4. **1.2** `1_2_accounts`: MetaMask account list with Account 1 and Account 2 addresses.
5. **1.3** new Chrome profile → MetaMask → Import wallet with your phrase → `1_3_restored` (same Account 1). Then delete that profile.
6. **1.4** paste the broken address `0x02B75C782186B76157309246D0b366d54Fa38772` into MetaMask "Send to" (`1_4_metamask`),
   open `https://sepolia.etherscan.io/address/0x02B75C782186B76157309246D0b366d54Fa38772` (`1_4_etherscan`). Send nothing.
   If the reactions differ from "MetaMask refused it / Etherscan showed an empty page", change them in `my_inputs.json`.

## Done by Claude on 09.11 00:12–00:16

Explorer shots `2_1_tx`, `2_2_outputs`, `3_4_coinbase` and terminal shots `2_4_ab`, `2_4_c` are in `screens/`.
The handout says to **type txid.py yourself**; retype it over `src/txid.py` if you want to follow that literally.

## Handwriting

12. Copy `HANDWRITING.md` onto paper (name + ID on every sheet), print `variantC_print.pdf` and bracket the fields for 2.3,
    photograph: `2_1_hand`, `2_3_hand`, `2_5_hand`, `3_2_hand`, `3_4_hand`, `3_5_hand`.

## Note on 3.1 / 3.2

The nonces (7 and 77) were found with a script and then checked on the demo page (screenshots already in `screens/`).
The handout wants you to try nonces by hand on the page; stepping 1 → 77 takes a few minutes if you want to do it that way.

## Submit

the ZIP in `out/` (report.pdf + src/txid.py) on the Assignment 2 page.
