# Native backend module recovery matrix

| Recovered source-path module | Evidence | Behavioral reconstruction | Exact original Rust? |
|---|---|---|---|
| `src/lib.rs` | confirmed | high | no |
| `src/git.rs` | confirmed; five Git roots | very high; exact reachable libgit2 APIs mapped | no |
| `src/default_dir.rs` | confirmed | high | no |
| `src/spawn_process.rs` | confirmed | high; process APIs mapped | no |
| `src/updater.rs` | confirmed | very high for update/security paths | no |
| `src/updater/fetcher.rs` | confirmed | high; HEAD/Range/partial/hash/retry recovered | no |
| `src/updater/mpq.rs` | confirmed | high | no |
| `src/updater/signature_check.rs` | confirmed | very high; PE signature verification + `CN=` extraction | no |

The release binary does not contain the original Rust token stream. Comments, formatting, many local names, generic source boundaries and some type names were optimized away. Evidence, analysis, and reconstructed pseudocode are therefore kept conceptually separate.
