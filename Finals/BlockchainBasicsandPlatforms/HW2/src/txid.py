import hashlib, sys
raw = bytes.fromhex(open(sys.argv[1]).read().strip())
once = hashlib.sha256(raw).digest()
twice = hashlib.sha256(once).digest()
print(len(raw), "bytes  txid:", twice[::-1].hex())
