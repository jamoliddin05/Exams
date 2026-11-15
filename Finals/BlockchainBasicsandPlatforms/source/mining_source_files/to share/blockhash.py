import hashlib, sys
header = bytes.fromhex(open(sys.argv[1]).read().strip())
once  = hashlib.sha256(header).digest()
twice = hashlib.sha256(once).digest()
print(len(header), "bytes  block hash:", twice[::-1].hex())
