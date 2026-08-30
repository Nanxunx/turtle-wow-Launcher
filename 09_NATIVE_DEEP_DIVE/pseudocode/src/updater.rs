//! RECONSTRUCTED RUST-LIKE PSEUDOCODE — NOT ORIGINAL SOURCE.

struct ManifestItem {
    name: String,
    kind: String,
    hash: Option<String>,
    mtime: Option<u64>,
    size: Option<u64>,
    mirrors: Option<Map<String,String>>,
}

fn update_file(path: &Path, file: &ManifestItem, primary_mirror: Option<&str>, channel: Channel<ProgressEvent>) -> Result<(String,u64),String> {
    let partial = partial_path(path)?;
    let urls = ordered_mirrors(file, primary_mirror)?;
    resumable_fetch(&urls, &partial, file.size, channel)?;
    let downloaded_hash = hash_file(&partial)?;
    if let Some(expected) = &file.hash {
        if &downloaded_hash != expected {
            remove_wrong_partial(&partial)?;
            return Err("Hash mismatch after download".into());
        }
    }
    if extension_is_exe_or_dll(path) && turtle_signature_condition(&partial) {
        let signer = signature_check(&partial)?;
        if signer != "Turtle WoW" {
            return Err(format!("Invalid signer: expected Turtle WoW, got {signer}"));
        }
    }
    atomically_replace_target_with_partial(path, &partial)?;
    Ok((downloaded_hash, metadata_mtime_ms(path)?))
}

fn verify_file(path: &Path, cached_hash: &str, cached_mtime: u64) -> Result<(String,u64),String> {
    verify_file_cached(path, cached_hash, cached_mtime)
}

fn verify_mpq(path: &Path, prefix: &str, files: &[ManifestItem], cache: &Cache, channel: Channel<ProgressEvent>) -> Result<(Vec<ManifestItem>,CacheUpdates),String> {
    verify_mpq_entries(path,prefix,files,cache,channel)
}

fn update_mpq(path: &Path, files: &[ManifestItem], primary_mirror: Option<&str>, channel: Channel<ProgressEvent>) -> Result<Vec<ManifestItem>,String> {
    update_mpq_entries(path,files,primary_mirror,channel)
}

fn prepare_self_update(path: &Path) -> Result<String,String> {
    platform_prepare_launcher_artifact(path)
}
