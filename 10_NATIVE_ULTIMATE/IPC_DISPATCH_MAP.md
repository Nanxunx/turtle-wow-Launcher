# Tauri IPC command dispatch map

Derived from exact command-name literal bytes, RIP-relative references in `.text`, and `.pdata` boundaries.

| Command | XREF | `.pdata` function |
|---|---:|---|
| `get_default_dir` | `0x1402C987D` (log evidence) | `0x1402C9770–0x1402C993B` |
| `available_space` | `0x14065b7fe` | `0x14065b740–0x14065bfc7` |
| `client_version` | `0x1405f1f2f` | `0x1405f1e70–0x1405f2e69` |
| `git_status` | `0x14066d7ae` | `0x14066d6f0–0x14066efc1` |
| `git_pull` | `0x1405b4ac6` | `0x1405b4a00–0x1405b68d7` |
| `git_push` | `0x1406018de` | `0x140601820–0x140602d25` |
| `git_clone` | `0x140652213` | `0x140652150–0x140653420` |
| `git_change_remote` | `0x140646f5b` | `0x140646ea0–0x140647f54` |
| `verify_file` | `0x14067468a` | `0x1406745d0–0x14067532a` |
| `update_file` | `0x1406b0986` | `0x1406b08c0–0x1406b42a8` |
| `verify_mpq` | `0x1405aef4f` | `0x1405aee90–0x1405afd34` |
| `update_mpq` | `0x140561cbe` | `0x140561c30–0x140565994` |
| `build_mpq` | `0x1405d27d4` | `0x1405d26f0–0x1405d4ad1` |
| `extract_mpq` | `0x140614121` | `0x140614060–0x14061581c` |
| `get_mpq_file` | `0x140659ce1` | `0x140659c20–0x14065adfb` |
| `set_mpq_file` | `0x14061b243` | `0x14061b180–0x14061c1ff` |
| `is_game_running` | `0x14062469e` | `0x1406245e0–0x140625060` |
| `prepare_self_update` | `0x1405edc9e` | `0x1405edbe0–0x1405ee287` |
| `run_detached` | `0x140620ee7` | `0x140620e30–0x140621c18` |

Full candidate evidence is preserved in the snapshot.
