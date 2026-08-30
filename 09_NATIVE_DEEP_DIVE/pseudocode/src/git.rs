//! RECONSTRUCTED RUST-LIKE PSEUDOCODE — NOT ORIGINAL SOURCE.
//! Exact reachable libgit2 API sets are machine-derived; control ordering below is a readable model.

fn git_status(dir: &str) -> Option<RepositoryInfo> {
    let repo = Repository::open(dir).ok()?;
    let branches = enumerate_local_branches(&repo);
    let head = read_head(&repo);
    let changes = collect_status(&repo);
    let origin = read_origin_url(&repo);
    let up_to_date = compare_tracking_state(&repo);
    Some(RepositoryInfo { origin, head, branches, changes, up_to_date, .. })
}

fn git_pull(dir: &str, branch: Option<&str>, force: bool, progress: Channel<f64>) -> Result<(), String> {
    let repo = Repository::open(dir)?;
    let origin = repo.find_remote("origin")?;
    let stash = if worktree_dirty(&repo) {
        Some(repo.stash_save(signature(&repo)?, "WIP: Autostash by pull", /*flags*/)? )
    } else { None };
    fetch_origin(&repo, origin, progress)?;
    let target = resolve_requested_or_default_branch(&repo, branch, &["HEAD","main","master"])?;
    if force { hard_sync_worktree(&repo, &target)?; }
    else { update_checked_out_branch(&repo, &target)?; }
    if stash.is_some() { repo.stash_pop(0, /*apply options*/ None)?; }
    Ok(())
}

fn git_push(dir: &str, message: &str, progress: Channel<f64>) -> Result<(), String> {
    let repo = Repository::open(dir)?;
    let mut index = repo.index()?;
    index.add_all(/*worktree*/, /*flags*/, None)?;
    index.write()?;
    let tree_id = index.write_tree()?;
    let tree = repo.find_tree(tree_id)?;
    let sig = repo.signature()?;
    create_commit_for_head(&repo, &sig, message, &tree)?;
    push_origin(&repo, progress)?;
    Ok(())
}

fn git_clone(url: &str, dir: &str, branch: Option<&str>, progress: Channel<f64>) -> Result<(), String> {
    clone_with_callbacks(url, dir, branch, progress)
}

fn git_change_remote(dir: &str, url: &str) -> Result<(), String> {
    replace_or_create_origin(dir, url)
}
