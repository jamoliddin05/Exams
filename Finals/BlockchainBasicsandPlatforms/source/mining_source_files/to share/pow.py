import hashlib, sys, time
text, zeros = sys.argv[1], int(sys.argv[2])
nonce, t0 = 0, time.perf_counter()
while not (h := hashlib.sha256(f"{text} {nonce}".encode()).hexdigest()).startswith("0" * zeros):
    nonce += 1
print(f"nonce {nonce:,} · {time.perf_counter() - t0:.2f} s")
print(h)
