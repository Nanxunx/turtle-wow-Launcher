//! RECONSTRUCTED RUST-LIKE PSEUDOCODE — NOT ORIGINAL SOURCE.
//! CONFIRMED ABI + machine evidence; exact source syntax/local names were optimized away.

mod git;
mod default_dir;
mod spawn_process;
mod updater;

fn available_space(path: String) -> Option<u64> {
    match query_disk_free_bytes(&path) {
        Some(bytes) => Some(bytes),
        None => {
            log("[RUST] available_space: Disk for path ... not found");
            None
        }
    }
}

fn client_version(path: String) -> Option<(String, String)> {
    let exe = open_pe(&path).ok()?;
    let version = read_client_version_string(&exe)?;
    let build = read_client_build_string(&exe)?;
    Some((version, build))
}

fn verify_file(path: String, cached_hash: String, cached_mtime: u64) -> Result<(String,u64), String> {
    let mtime = metadata_mtime_ms(&path)?;
    if file_exists(&path) && cached_mtime != 0 && mtime == cached_mtime && !cached_hash.is_empty() {
        return Ok((cached_hash, mtime));
    }
    if !file_exists(&path) {
        return Ok((String::new(), 0));
    }
    let hash = hash_file(&path)?;
    Ok((hash, mtime))
}

fn is_game_running(force_close: Option<bool>) -> bool {
    let matches = enumerate_processes_named("WoW.exe");
    if force_close.unwrap_or(false) {
        for p in &matches {
            if let Err(e) = p.kill() { log_kill_failure(p.pid(), e); }
            else { log_kill_success(p.pid()); }
        }
    }
    !matches.is_empty()
}
