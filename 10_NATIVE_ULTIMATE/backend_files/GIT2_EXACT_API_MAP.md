# Exact libgit2 API map for launcher Git commands

The executable exports libgit2 symbols, allowing static call targets inside launcher Git command paths to resolve to exact API names rather than guesses.

## `git_pull`
Confirmed reachable APIs include `git_remote_fetch`, `git_checkout_tree`, `git_reset`, `git_stash_save`, `git_stash_pop`, `git_repository_set_head`, `git_branch_create`, `git_repository_head`, `git_reference_lookup`, `git_reference_target`, `git_status_list_new`, and related reference/error helpers.

## `git_push`
Confirmed reachable APIs include `git_repository_index`, `git_index_add_all`, `git_index_write`, `git_index_write_tree`, `git_tree_lookup`, `git_signature_default`, `git_commit_create`, `git_remote_push`, and remote callback/error helpers.

## `git_clone`
Confirmed reachable APIs include `git_clone`, `git_clone_init_options`, `git_remote_init_callbacks`, branch iterator/name helpers, and error helpers.

## `git_change_remote`
Confirmed reachable APIs include `git_remote_create`, `git_remote_delete`, `git_remote_fetch`, `git_repository_init_ext`, `git_checkout_tree`, `git_repository_set_head`, and reference/object helpers.

## `git_status`
Confirmed reachable APIs include branch iteration/name, repository head/open, remote lookup/url/fetch, status init/list/byindex, references, OID comparison, tree IDs and object helpers.

Exact shortest address paths are preserved in the lossless Ultimate text snapshot.
