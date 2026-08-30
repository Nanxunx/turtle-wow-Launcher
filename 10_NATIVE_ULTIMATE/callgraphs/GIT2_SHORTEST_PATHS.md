# Git command → libgit2 shortest call paths

These are representative shortest static direct-call paths from identified launcher Git command roots to named libgit2 PE exports. Generic Rust/git2 wrappers remain addresses because their original Rust symbols are stripped.

## `git_pull` root `0x1405B4A00`

- `git_remote_fetch`: `0x1405B4A00 → 0x14011AC20 → 0x140F594C0`
- `git_checkout_tree`: `0x1405B4A00 → 0x140BD0A20 → 0x140F79E00`
- `git_reset`: `0x1405B4A00 → 0x140BD1790 → 0x140FB1380`
- `git_stash_save`: `0x1405B4A00 → 0x140BD0290 → 0x140BD07C0 → 0x140F99210`
- `git_stash_pop`: `0x1405B4A00 → 0x140BD2F30 → 0x140F991E0`
- `git_repository_set_head`: `0x1405B4A00 → 0x140BD2BC0 → 0x140BD12C0 → 0x140F53C70`

## `git_push` root `0x140601820`

- `git_index_add_all`: `0x140601820 → 0x14032F7D0 → 0x140F5E3A0`
- `git_index_write`: `0x140601820 → 0x140BCDB60 → 0x140F614B0`
- `git_index_write_tree`: `0x140601820 → 0x140BCDA40 → 0x140F61780`
- `git_commit_create`: `0x140601820 → 0x140BD1DA0 → 0x140F85200`
- `git_remote_push`: `0x140601820 → 0x14011A8F0 → 0x140F5AB30`

## `git_clone` root `0x140652150`

- `git_clone`: `0x140652150 → 0x140BCF550 → 0x140F88810`
- `git_clone_init_options`: `0x140652150 → 0x140BCF550 → 0x140F88850`
- `git_remote_init_callbacks`: `0x140652150 → 0x140BCF550 → 0x140BCE860 → 0x140F598B0`

## `git_change_remote` root `0x140646EA0`

- `git_remote_create`: `0x140646EA0 → 0x140BD24C0 → 0x140F58720`
- `git_remote_delete`: `0x140646EA0 → 0x140BD0D50 → 0x140F590D0`
- `git_remote_fetch`: `0x140646EA0 → 0x14011AC20 → 0x140F594C0`
- `git_checkout_tree`: `0x140646EA0 → 0x140BD0A20 → 0x140F79E00`
- `git_repository_set_head`: `0x140646EA0 → 0x140BD2BC0 → 0x140BD12C0 → 0x140F53C70`

## `git_status` root `0x14066D6F0`

Reachable named APIs include `git_branch_iterator_new`, `git_branch_next`, `git_branch_name`, `git_repository_head`, `git_repository_open`, `git_remote_lookup`, `git_remote_url`, `git_status_init_options`, `git_status_list_new`, `git_status_list_entrycount`, `git_status_byindex`, reference/object helpers and OID comparison.

Reachability is stronger evidence than global symbol presence, but does not imply every runtime branch executes every reachable API.
