#!/usr/bin/env python3
from pathlib import Path
import base64, hashlib, lzma, sys

ROOT = Path(__file__).resolve().parents[1]
PARTS = ROOT / "archives" / "ultimate-text-snapshot"
EXPECTED_XZ = "bceb7db4a41620a0d80ef85b99d99c80682da62320098284a1f23c22d1291f29"
EXPECTED_TEXT = "2b4e2dc93ae0925beb23292378daa0e4e9fef75bea9584718e381c851888705d"

files = sorted(p for p in PARTS.glob("*.b64"))
if not files:
    raise SystemExit("no snapshot parts found")
b64 = b"".join(p.read_bytes().strip() for p in files)
xz = base64.b64decode(b64, validate=True)
if hashlib.sha256(xz).hexdigest() != EXPECTED_XZ:
    raise SystemExit("XZ SHA-256 mismatch")
text = lzma.decompress(xz)
if hashlib.sha256(text).hexdigest() != EXPECTED_TEXT:
    raise SystemExit("restored text SHA-256 mismatch")
out = ROOT / "ULTIMATE_TEXT_SNAPSHOT.txt"
out.write_bytes(text)
print(f"restored {len(text):,} bytes -> {out}")
