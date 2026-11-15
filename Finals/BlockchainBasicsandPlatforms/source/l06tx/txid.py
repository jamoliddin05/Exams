import hashlib, sys
raw = bytes.fromhex(open(sys.argv[1]).read().strip())
h = hashlib.sha256(hashlib.sha256(raw).digest()).digest()
print(len(raw), "bytes  txid:", h[::-1].hex())
