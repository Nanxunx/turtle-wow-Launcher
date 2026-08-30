# Full Native graph inventory

The project-specific roots are the human-labeled entry points. To avoid losing unclassified Native code, the Ultimate stage also inventories the full mapped image.

## Scale

- `.pdata` function/unwind ranges: **74,476**
- Direct `call` instructions recovered from full disassembly: **227,328**
- Calls through recognized IAT slots: **3,460**
- Imported API entries: **600**
- Named PE exports: **951**
- Unique PE export target addresses: **915**
- Human-identified project Native roots after command-literal completion: **28**

All 951 named exports are libgit2-style `git_*` / `giterr_*` symbols. Aliases explain why 951 names resolve to 915 unique target VAs.

## Machine-readable inventories produced during analysis

- `all_pdata_functions.tsv` — every recoverable unwind/function range.
- `all_direct_calls.tsv` — whole-image direct call edges.
- `all_iat_calls.tsv` — whole-image calls through recognized import slots.
- `pe_imports.tsv` — full IAT/API inventory.
- `pe_exports.tsv` — full named export inventory.
- `import_dll_summary.tsv` — import count by DLL.
- `root_function_calls.json` — direct calls from identified project roots.
- reachable-capability maps — depth-capped reachability from project roots to imported APIs.

Large graph TSVs are intentionally not expanded as giant GitHub text files in the public tree; the repository preserves the analysis summary, reconstruction corpus, and reproducible address evidence without making the browser unusable.

## Interpretation warning

Rust/LLVM release builds heavily inline, monomorphize and share generic helpers. A reachable imported API does **not** prove that every runtime invocation of a root executes that API. Conversely, compiler inlining can erase a source-level call boundary. The graph is therefore an auditable address map, not a fabricated original source tree.
