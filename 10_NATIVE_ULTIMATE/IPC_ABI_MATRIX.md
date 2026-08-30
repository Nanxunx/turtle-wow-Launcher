# Tauri IPC ABI reconstruction

Command names and frontend argument keys are directly observed. Type annotations combine recovered TypeScript call sites with Native serialization strings; Native Rust parameter type names optimized away are not fabricated.

| Command | Observed argument shape | Frontend-visible result | Purpose |
|---|---|---|---|
| `get_default_dir` | none | `string` | Resolve default client directory |
| `available_space` | `path: string` | `number | null` | Disk free space |
| `client_version` | `path: string` | `[string,string] | null` | WoW version/build |
| `git_status` | `dir: string` | `RepositoryInfo | null` | Repository status |
| `git_pull` | `dir; branch?; force; channel` | Result | Fetch/sync branch with autostash paths |
| `git_push` | `dir; message; channel` | Result | Stage, commit and push |
| `git_clone` | `url; dir; branch?; progress channel` | Result | Clone repository |
| `git_change_remote` | `dir; url` | Result | Replace/create origin remote |
| `verify_file` | `path; hash?; mtime?` | `[string,number]` | Hash/mtime verification |
| `update_file` | `path; file; primaryMirror?; channel` | `[string,number]` | Resumable file update; executable signer policy |
| `verify_mpq` | `path; prefix; files; cache; channel?` | verification result | Per-entry MPQ verification |
| `update_mpq` | `path; files; primaryMirror?; channel` | items | Incremental MPQ update |
| `build_mpq` | `path; source; channel` | Result | Build dev MPQ |
| `extract_mpq` | `path; target; channel` | Result | Extract MPQ |
| `get_mpq_file` | `path; fileName` | byte array/undefined | Read archive entry |
| `set_mpq_file` | `path; fileName; data` | Result | Write/replace archive entry |
| `is_game_running` | `forceClose?` | bool | Detect/optionally terminate WoW.exe |
| `prepare_self_update` | `path` | string | Platform preparation after update-file security gate |
| `run_detached` | `program; workingDir?; args?; envVars?; channel` | Result | Spawn child, report exit code |

Native serialization strings independently preserve the command/field sequences, and recovered frontend source provides the consuming TypeScript contract.
