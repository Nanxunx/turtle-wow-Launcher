//! RECONSTRUCTED RUST-LIKE PSEUDOCODE — NOT ORIGINAL SOURCE.

async fn resumable_fetch(urls: &[String], partial: &Path, expected_size: Option<u64>, channel: Channel<ProgressEvent>) -> Result<(),String> {
    if urls.is_empty() { return Err("No download urls".into()); }
    let existing = partial_len(partial).unwrap_or(0);
    if existing > 0 { channel.send(Initial{initial: existing})?; }
    let mut errors = Vec::new();
    for url in urls {
        match try_fetch(url, partial, existing, expected_size, &channel).await {
            Ok(()) => return Ok(()),
            Err(e) => errors.push(e),
        }
    }
    Err(format!("All download URLs failed for ...: {:?}", errors))
}

async fn try_fetch(url: &str, partial: &Path, offset: u64, expected_size: Option<u64>, channel: &Channel<ProgressEvent>) -> Result<(),String> {
    let remote_len = head_content_length(url).await?;
    if offset == remote_len { return Ok(()); }
    if offset > remote_len { return Err("Invalid range".into()); }
    let response = if offset > 0 {
        get_with_header(url, "Range", format!("bytes={offset}-")).await?
    } else { get(url).await? };
    let mut file = open_partial_for_append_or_create(partial, offset)?;
    while let Some(chunk) = next_chunk_with_timeout(response).await? {
        file.write_all(&chunk).map_err(|_| "Write failed")?;
        channel.send(Progress{bytes: chunk.len() as u64})?;
    }
    let final_len = partial_len(partial)?;
    if let Some(n) = expected_size.or(Some(remote_len)) {
        if final_len != n { return Err("Size mismatch".into()); }
    }
    Ok(())
}
