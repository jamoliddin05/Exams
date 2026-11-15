# B.3 ✍: copy this onto paper by hand

At the top of the sheet: **your full name and student ID**.
Copy every line, including the arithmetic, not only the results. Photograph the sheet and save it as `screens/b3_hand.jpg`.
1 Gwei = 1,000,000,000 wei. 1 ETH = 10^18 wei = 1,000,000,000,000,000,000 wei.

## Transaction 1: Transfer (B.1), 0x95328a47…da55

**1. Prices in wei**
```
Base fee  = 0.000000025 Gwei = 0.000000025 x 1,000,000,000 =            25 wei
Tip       = 1.5 Gwei         = 1.5 x 1,000,000,000         = 1,500,000,000 wei
Max fee   = 1.500000033 Gwei                               = 1,500,000,033 wei
Gas price = 1.500000025 Gwei                               = 1,500,000,025 wei
Check: base + tip = 25 + 1,500,000,000 = 1,500,000,025 wei = gas price  ✓
```
**2. Fee = gas used x gas price**
```
Gas used = 21,000
Fee = 21,000 x 1,500,000,025
    = 21,000 x 1,500,000,000  +  21,000 x 25
    = 31,500,000,000,000      +  525,000
    = 31,500,000,525,000 wei
```
**3. In ETH**
```
31,500,000,525,000 / 10^18 = 0.000031500000525 ETH
Etherscan Transaction Fee:   0.000031500000525 ETH   ✓ (digit by digit)
```
**4. Burnt = base fee x gas used**
```
Burnt = 25 x 21,000 = 525,000 wei = 0.000000000000525 ETH
Etherscan Burnt:                    0.000000000000525 ETH   ✓
```
**5. Savings = (max fee - gas price) x gas used**
```
Savings = (1,500,000,033 - 1,500,000,025) x 21,000 = 8 x 21,000 = 168,000 wei
        = 0.000000000000168 ETH
Etherscan Txn Savings: 0.000000000000168 ETH   ✓
```

## Transaction 2: Store N (A.2), 0x6b9bb1a2…84d7

**1. Prices in wei**
```
Base fee  = 0.000000017 Gwei = 0.000000017 x 1,000,000,000 =            17 wei
Tip       = 1.5 Gwei         = 1.5 x 1,000,000,000         = 1,500,000,000 wei
Max fee   = 1.500000023 Gwei                               = 1,500,000,023 wei
Gas price = 1.500000017 Gwei                               = 1,500,000,017 wei
Check: base + tip = 17 + 1,500,000,000 = 1,500,000,017 wei = gas price  ✓
```
**2. Fee = gas used x gas price**
```
Gas used = 125,650
Fee = 125,650 x 1,500,000,017
    = 125,650 x 1,500,000,000  +  125,650 x 17
    = 188,475,000,000,000      +  2,136,050
    = 188,475,002,136,050 wei

(125,650 x 1,500,000,000 = 125,650 x 15 x 100,000,000 = 1,884,750 x 100,000,000)
(125,650 x 17 = 1,256,500 + 879,550 = 2,136,050)
```
**3. In ETH**
```
188,475,002,136,050 / 10^18 = 0.00018847500213605 ETH
Etherscan Transaction Fee:    0.00018847500213605 ETH   ✓ (digit by digit)
```
**4. Burnt = base fee x gas used**
```
Burnt = 17 x 125,650 = 2,136,050 wei = 0.00000000000213605 ETH
Etherscan Burnt:                       0.00000000000213605 ETH   ✓
```
**5. Savings = (max fee - gas price) x gas used**
```
Savings = (1,500,000,023 - 1,500,000,017) x 125,650 = 6 x 125,650 = 753,900 wei
        = 0.0000000000007539 ETH
Etherscan Txn Savings: 0.0000000000007539 ETH   ✓
```

Conclusion (write it too): all five steps match Etherscan for both transactions. Almost the whole fee is the tip,
because the base fee on Sepolia was only 17–25 wei.
