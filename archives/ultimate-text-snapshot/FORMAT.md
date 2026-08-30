# Snapshot format

After running `tools/unpack_text_snapshot.py`, `ULTIMATE_TEXT_SNAPSHOT.txt` is a deterministic concatenation of **382 UTF-8 repository files**.

Each file is delimited by:

```text
===== BEGIN FILE: relative/path =====
...exact UTF-8 file content...
===== END FILE: relative/path =====
```

This makes the snapshot independently parseable even without Git tooling. The archive exists to guarantee that the complete text analysis/source corpus was uploaded losslessly while selected high-value files are also expanded directly in the GitHub tree for browsing.
