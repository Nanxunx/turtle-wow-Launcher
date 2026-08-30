# Recovered Native serialization/type evidence

Only fields that survive as serde/Tauri serialization strings or are independently visible in recovered frontend source are recorded. Rust type names/layouts lost to LLVM optimization are not invented.

## `ManifestItem`

Native serde strings preserve:

```text
ManifestItem
name
type
hash
mtime
size
mirrors
struct ManifestItem with 6 elements
```

Recovered frontend Zod schema additionally accepts `tags` and, for MPQ containers, nested `files`. This may be a JS-side superset and is not forced into the six-element Native struct without machine evidence.

## `ProgressEvent`

Native strings preserve a tagged event name and fields/variants including `initial`, `revert`, `fileDone`, `finalizing`, `mpqBuild`, `file`, `current`, `total`, `bytes`. Recovered frontend source consumes variants `initial`, `progress`, `revert`, `fileDone`, `finalizing`, and `mpqBuild`.

## Git repository result

A contiguous Native serializer string preserves `git`, `gitRef`, `upToDate`, `branches`, `changes`, `gitError`, `conflicted`, `untracked`, `modified`, `deleted`, `renamed`, `other`. Recovered TypeScript consumes this as `RepositoryInfo`.

## Command argument serializers

Native codegen preserves argument-key sequences including `run_detached workingDir envVars channel`, `extract_mpq target`, `build_mpq source`, `set_mpq_file fileName`, `verify_mpq prefix files cache`, `git_change_remote dir`, `update_mpq appHandle primaryMirror`, `git_pull branch force`, `verify_file hash mtime`, `is_game_running forceClose`, `prepare_self_update`, `git_push`, `available_space`, `git_clone onProgress`, and `git_status`.
