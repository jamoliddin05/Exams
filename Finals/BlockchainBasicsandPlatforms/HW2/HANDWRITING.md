# HW2 handwriting sheets (copy these by hand)

Every ✍ answer must be a **photo of your handwriting**. Typed tables get zero.
At the top of **every** sheet write: your full name and student ID. Show the arithmetic, not only the result.
Save the photos as `screens/2_1_hand.jpg`, `2_3_hand.jpg`, `2_5_hand.jpg`, `3_2_hand.jpg`, `3_4_hand.jpg`, `3_5_hand.jpg`.

## 2.1 Fee = inputs - outputs

T = `fad44ff289827dcb3c54bc63754c816a3ed4ddb3636cbe9a9024c1411370c866` (block 850,097, 2nd tx)

```
Input  #0: 0.00447594 BTC x 100,000,000 = 447,594 sat   (from bc1qt47vgg8y9gvwszp693pj922amjfxwkrtzg5y43)
Sum of inputs                          = 447,594 sat

Output #0: 0.00446827 BTC x 100,000,000 = 446,827 sat  (to bc1qzlefdrv5k9hz86rt0yj26fmjn42g0ue5nzrln7)
Sum of outputs                         = 446,827 sat

Difference = 447,594 - 446,827 = 767 sat
Explorer fee: 767 sat  -> matches
```
Who receives the difference: the fee is not an output; the miner of block 850,097 (F2Pool) collects it in the coinbase transaction, together with the block subsidy.

## 2.3 Decode variant C by hand

Print `variantC_print.pdf` (same folder), bracket and label the fields in this order:

| Field | Bytes | Hex |
|---|---|---|
| Version | 4 | `01000000` (= 1) |
| Input count | 1 | `01` |
| Previous txid | 32 | `4995a361d0e39e52680ebc2056c5598f3b61497699197b4dd2ff525648cfb77a` |
| Output index | 4 | `01000000` (= 1) |
| Script length | 1 | `6b` (= 107) |
| Unlocking script | 107 | from `4830450221 00dbc6...` to `...7e3b52fd` |
| Sequence | 4 | `ffffffff` |
| Output count | 1 | `02` |
| Value 0 | 8 | `9d86010000000000` |
| Script length | 1 | `19` (= 25) |
| Locking script 0 | 25 | `76a91480078dd54f27ab2c3749a7cb1089028554cb017288ac` |
| Value 1 | 8 | `ea33010000000000` |
| Script length | 1 | `19` (= 25) |
| Locking script 1 | 25 | `76a914b5edee28418f066a9585c9f303185f822699fd4088ac` |
| Locktime | 4 | `00000000` |

Total: 4+1+32+4+1+107+4+1+(8+1+25)×2+4 = 226 bytes.

Values (reverse the bytes, read as hex, convert to decimal):
```
Value 0: 9d 86 01 00 00 00 00 00 -> 00 00 00 00 00 01 86 9d = 0x01869d
         = 1x65536 + 8x4096 + 6x256 + 9x16 + 13 = 65,536 + 32,768 + 1,536 + 144 + 13 = 99,997 sat
         explorer: 0.00099997 BTC = 99,997 sat  -> match

Value 1: ea 33 01 00 00 00 00 00 -> 00 00 00 00 00 01 33 ea = 0x0133ea
         = 1x65536 + 3x4096 + 3x256 + 14x16 + 10 = 65,536 + 12,288 + 768 + 224 + 10 = 78,826 sat
         explorer: 0.00078826 BTC = 78,826 sat  -> match
```
Previous txid reversed: `4995a361...48cfb77a` read backwards byte by byte = `7ab7cf48...61a39549` = the txid the explorer shows for the input.

## 2.5 SegWit discount

| | txid | Size | vsize | Weight | Fee |
|---|---|---|---|---|---|
| Legacy (1 input, 17BmnsnJ…) | `79b47c7f…6b57fd0` | 223 B | 223 vB | 892 WU | 40,280 sat |
| SegWit (bc1q input) | `eea239c0…c8631a7d03` | 222 B | 141 vB | 561 WU | 42,300 sat |

```
Legacy:  4 x 223 = 892 = weight  (exact)
         fee rate = 40,280 / 223 = 180.6 sat/vB
SegWit:  4 x 141 = 564 ≈ 561 = weight
         561 / 4 = 140.25 -> rounded up to 141 vB
         fee rate = 42,300 / 141 = 300.0 sat/vB
```
Why round up: a transaction cannot occupy part of a virtual byte, so vsize = ceil(weight / 4); rounding up never lets the fee rate look higher than it is or the block exceed its limit.

Why SegWit vsize < size: witness bytes (signatures, public keys) count 1 WU each, other bytes 4 WU, so its 222 real bytes weigh only 561 WU = 141 vB; a legacy tx has no witness, every byte counts 4 WU, so vsize = size. Fees are paid per vB, so for the same real bytes SegWit pays for ~141 instead of ~222 vB, about 36% less.

## 3.2 Expected attempts

```
One hash character is one of 16 hex digits 0..f.
P(first char = 0)       = 1/16      -> expected 16 attempts
P(first two chars = 00) = 1/16 x 1/16 = 1/256 -> expected 256 attempts
(on average, not a promise)

Mine (D = your surname in capitals, block 1, starting at nonce 1):
one zero:  nonce 7  -> 7 attempts  (< 16, lucky)
two zeros: nonce 77 -> 77 attempts (< 256, lucky)
```

## 3.4 Coinbase of block 850,097

```
Halving count = 850,097 / 210,000 = 4.048 -> whole part 4
Subsidy = 50 / 2^4 = 50 / 16 = 3.125 BTC = 3.125 x 100,000,000 = 312,500,000 sat   (check: ok)

Coinbase outputs:
  #0  0.00000546 BTC =         546 sat  (1K6KoYC69NnafWJ7YgtrpwJxBLiijWqwa6)
  #1  3.28409491 BTC = 328,409,491 sat  (1KGG9kvV5zXiqyQAMfY32sGt9eFLMmgpgX)
  #2..#5  OP_RETURN  =           0 sat
Total paid to miner = 546 + 328,409,491 = 328,410,037 sat = 3.28410037 BTC

Fees = total - subsidy = 328,410,037 - 312,500,000 = 15,910,037 sat = 0.15910037 BTC
Block page total fees: 0.15910037 BTC -> match
Mining pool: F2Pool
```

## 3.5 Confirmations grow (fill in your own numbers)

```
First look:  time t1 = __:__   confirmations c1 = ______
Second look: time t2 = __:__   confirmations c2 = ______   (t2 - t1 >= 30 min)

New blocks = c2 - c1 = ______
Seconds per block = (minutes between looks x 60) / new blocks = (__ x 60) / ___ = ___ s   (expect ~12 s)
```
