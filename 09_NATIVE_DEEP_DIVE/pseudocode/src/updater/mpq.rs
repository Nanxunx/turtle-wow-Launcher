//! RECONSTRUCTED RUST-LIKE PSEUDOCODE — NOT ORIGINAL SOURCE.

fn build_mpq(path: &Path, source: &Path, channel: Channel<ProgressEvent>) -> Result<(),String> {
    let ignore = if source.join(".patchignore").exists() {
        read_patchignore(source.join(".patchignore"))?
    } else {
        log("[RUST] build_mpq: .patchignore not found. Using .defaultignore as fallback.");
        built_in_default_ignore()
    };
    let files = walk_source_excluding(source, &ignore)?;
    let mut archive = open_or_create_stormlib_archive(path)?;
    ensure_archive_file_capacity(&mut archive, files.len())?;
    for (i,file) in files.iter().enumerate() {
        add_or_replace_archive_file(&mut archive, source, file)?;
        channel.send(MpqBuild { file: file.display(), current: i+1, total: files.len() })?;
    }
    finalize_or_compact_archive(&mut archive)?;
    Ok(())
}

fn extract_mpq(path: &Path, target: &Path, channel: Channel<ProgressEvent>) -> Result<(),String> {
    let archive = open_archive(path)?;
    for entry in archive_entries(&archive)? {
        extract_entry(&archive, &entry, target)?;
        channel.send(FileDone { file: entry.name, size: entry.size })?;
    }
    Ok(())
}

fn get_mpq_file(path: &Path, file_name: &str) -> Result<Option<Vec<u8>>,String> {
    let archive = open_archive(path)?;
    read_archive_entry_if_present(&archive,file_name)
}

fn set_mpq_file(path: &Path, file_name: &str, data: &[u8]) -> Result<(),String> {
    let mut archive = open_archive_mut(path)?;
    replace_archive_entry(&mut archive,file_name,data)?;
    Ok(())
}
