# Turtle WoW Launcher Reverse-Engineering Archive

Static reverse-engineering archive for the supplied Windows x64 Turtle WoW launcher sample.

## Canonical sample identity

- Size: `32,981,736` bytes
- SHA-256: `58b5f61bf70bbab56dc16af0d20d7351ac6ddb6051eea1058f56ee2a204be4f6`
- SHA-1: `b32243a1c5e53122ad92e2c32349d9ee892126ee`
- MD5: `d14f9bd959c1c48060182706f355362d`
- Platform: Windows x86-64
- Stack: Rust + Tauri 2.x + React/TypeScript

The original executable is intentionally **not redistributed** here.

## Analysis coverage

The production executable embeds JavaScript source maps with `sourcesContent`, allowing source-level recovery of the active React/TypeScript frontend and two historical builds. Native Rust does not contain equivalent source maps, so Native material is evidence-based reconstruction and Rust-like pseudocode rather than claimed original source.

The full UTF-8 analysis/source corpus is stored losslessly under `archives/ultimate-text-snapshot/`. It contains **382 text source/analysis files** and can be restored with `tools/unpack_text_snapshot.py`.

Snapshot integrity:

- XZ SHA-256: `bceb7db4a41620a0d80ef85b99d99c80682da62320098284a1f23c22d1291f29`
- Restored text SHA-256: `2b4e2dc93ae0925beb23292378daa0e4e9fef75bea9584718e381c851888705d`

## Native findings

The analysis identifies 8 recoverable project Native Rust modules, 28 project-specific Native root functions, 19 Tauri IPC commands, Git/libgit2 behavior, resumable updater/fetcher behavior, StormLib/MPQ operations, process launching, and executable/DLL signature-validation control flow.

The current sample contains a complete Authenticode `WIN_CERTIFICATE`; its code-signing leaf subject is `O=Turtle WoW, CN=Turtle WoW`, issued by `Sectigo Public Code Signing CA EV R36`. The independently recomputed Authenticode SHA-256 image digest matches the digest carried by the PKCS#7 signed content.

## Safety / provenance

Credential-like literals are redacted. The Stronghold unlock literal is not published, and private-key PEM bodies are not redistributed. Reconstructed Native code is explicitly labeled pseudocode.

See `NOTICE.md`, `SECURITY.md`, `RELEASE_STATUS.md`, and the restored corpus for the complete evidence set.
