# Release status — Ultimate Static Reverse Engineering

Prepared 2026-08-30.

## Scope

- Source-level recovery of the active React/TypeScript frontend from embedded source-map `sourcesContent`.
- Two historical embedded frontend source-map builds retained for comparison.
- Eight recoverable Native Rust project modules analyzed.
- 28 project-specific Native root functions identified.
- 19 Tauri IPC commands mapped to Native evidence (18 direct command-literal mappings plus independently identified `get_default_dir`).
- Whole-image inventories produced during analysis: 74,476 `.pdata` function ranges, 227,328 direct-call instructions, 3,460 recognized IAT calls, 600 imported APIs, 951 named libgit2 exports / 915 unique libgit2 export targets.
- Authenticode PKCS#7/certificate/timestamp evidence and independent image-digest recomputation completed.

## Canonical sample

`58b5f61bf70bbab56dc16af0d20d7351ac6ddb6051eea1058f56ee2a204be4f6` — 32,981,736 bytes.

The original binary and credential/private-key material are excluded from this public tree.
