# Ultimate text snapshot

This directory stores a lossless Base64-split XZ archive of the UTF-8 reverse-engineering/source corpus.

The parts must be concatenated in lexicographic filename order, Base64-decoded, then XZ-decompressed. Use `../../tools/unpack_text_snapshot.py`.

Expected integrity:

- XZ SHA-256: `bceb7db4a41620a0d80ef85b99d99c80682da62320098284a1f23c22d1291f29`
- Restored UTF-8 snapshot SHA-256: `2b4e2dc93ae0925beb23292378daa0e4e9fef75bea9584718e381c851888705d`
- Restored text snapshot size: 1,510,882 bytes
- Corpus files represented: 382 UTF-8 source/analysis files

The binary launcher itself is not present in this archive.
