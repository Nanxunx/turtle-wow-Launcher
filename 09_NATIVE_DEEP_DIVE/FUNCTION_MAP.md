# Native function map

| Function range | Size | Project evidence |
|---|---:|---|
| `0x140003a80–0x1400055a3` | 6947 | `[RUST] verify_mpq: Failed to open "" in patch ` |
| `0x140006c30–0x14000725f` | 1583 | `[RUST] sign_check Failed to verify signature:  / src\.\signature_check.rs` |
| `0x1401f4850–0x1401f62da` | 6794 | `[RUST] Creating archive " / [RUST] Failed to check if file "" exists:  / [RUST] Failed to find file "": Not found` |
| `0x1401f6b00–0x1401f8aca` | 8138 | `[RUST] Creating archive " / [RUST] Failed to check if file "" exists:  / [RUST] Failed to find file "": Not found` |
| `0x1402c9040–0x1402c9563` | 1315 | `[RUST] get_exe_path: Failed to get current_exe: H` |
| `0x1402c9770–0x1402c993b` | 459 | `[RUST] get_default_dir: Resolved to ` |
| `0x140526060–0x1405265c3` | 1379 | `[RUST] run_detached Failed to send exit code:  / [RUST] run_detached Failed to wait on child process: ` |
| `0x140561c30–0x140565994` | 15716 | `[RUST] resumable_fetch [] " / [RUST] resumable_fetch [final] "h / [RUST] update_mpq: ` |
| `0x140568430–0x14056ac93` | 10339 | `[RUST] try_fetch "": Starting fetch with timeout of ` |
| `0x1405aee90–0x1405afd34` | 3748 | `[RUST] verify_mpq: ` |
| `0x1405b4a00–0x1405b68d7` | 7895 | `[RUST] git_pull:  / src\git.rs` |
| `0x1405d26f0–0x1405d4ad1` | 9185 | `[RUST] build_mpq:  / [RUST] build_mpq: .patchignore not found. Using .defaultignore as fallback. / [RUST] build_mpq: Failed to read entry: ` |
| `0x140601820–0x140602d25` | 5381 | `[RUST] git_push:  / src\git.rs` |
| `0x140614060–0x14061581c` | 6076 | `[RUST] build_mpq: Failed to send progress event:  / [RUST] extract_mpq Extracted file "" to " / [RUST] extract_mpq Missing archive ` |
| `0x14061b180–0x14061c1ff` | 4223 | `[RUST] set_mpq_file: ` |
| `0x140620e30–0x140621c18` | 3560 | `[RUST] run_detached: ` |
| `0x1406245e0–0x140625060` | 2688 | `[RUST] is_game_running: Failed to kill process  (PID: ) / [RUST] is_game_running: Successfully killed process ` |
| `0x140646ea0–0x140647f54` | 4276 | `[RUST] git_change_remote:  / src\git.rs` |
| `0x140652150–0x140653420` | 4816 | `[RUST] git_clone:  / src\git.rs` |
| `0x140659c20–0x14065adfb` | 4571 | `[RUST] get_mpq_file: ` |
| `0x14065b740–0x14065bfc7` | 2183 | `[RUST] available_space: Disk for path  not foundP` |
| `0x14066d6f0–0x14066efc1` | 6353 | `[RUST] git_status:  / src\git.rs` |
| `0x1406ac040–0x1406ae8a3` | 10339 | `[RUST] try_fetch "": Starting fetch with timeout of  / [RUST] update_file: Failed to send progress event: ` |
| `0x1406b08c0–0x1406b42a8` | 14824 | `[RUST] resumable_fetch [] " / [RUST] resumable_fetch [final] " / [RUST] update_file Invalid signer for "": expected "Turtle WoW", got "` |
| `0x141048eb0–0x141049086` | 470 | `src\updater.rs` |

The Ultimate stage additionally identifies `prepare_self_update`, `client_version`, and `verify_file`, bringing project-specific Native roots to 28; see the restored full corpus for the complete map and evidence.
