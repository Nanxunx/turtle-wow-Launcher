# Native Ultimate Deep Dive

This directory pushes the launcher Native analysis beyond string-level reconstruction into function-boundary, call-graph, API-reachability and serialization evidence. Facts, high-confidence reconstructions and unresolved details are separated.

## Ultimate-stage coverage

- Complete PE export inventory: **951 named libgit2 exports / 915 unique export target addresses**.
- Complete parsed IAT inventory: **600 imported APIs**.
- `.pdata` inventory: **74,476 function/unwind ranges**.
- Whole-image direct-call inventory: **227,328 call instructions**.
- Recognized IAT call sites: **3,460**.
- Static capability maps from project-identified roots.
- Shortest call paths from launcher Git commands to exact libgit2 APIs.
- IPC ABI/dispatch cross-checking frontend invoke sites with Native literals and `.pdata` boundaries.
- Native project error/diagnostic catalog and source-path evidence.
- State-machine reports for downloader, executable update security, Git, MPQ and process lifecycle.

## Confidence model

- **Confirmed:** source-map content, binary bytes, PE metadata, disassembly/XREF, import/export symbol, or frontend invoke call.
- **High confidence:** behavior supported by several independent static signals.
- **Inferred:** a readable model whose original Rust type/name was optimized away.
- **Unknown:** information not recoverable from this build without dynamic execution, a PDB, original Rust source, or another artifact.

The complete Ultimate text corpus is recoverable from `archives/ultimate-text-snapshot/` using `tools/unpack_text_snapshot.py`.
