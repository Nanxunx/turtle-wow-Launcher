//! RECONSTRUCTED RUST-LIKE PSEUDOCODE — NOT ORIGINAL SOURCE.

fn get_exe_path() -> Option<PathBuf> {
    // CONFIRMED: APPIMAGE literal + GetEnvironmentVariableW reachability.
    if let Ok(appimage) = std::env::var("APPIMAGE") {
        if !appimage.is_empty() {
            log("[RUST] get_exe_path: Found APPIMAGE at ...");
            return Some(PathBuf::from(appimage));
        }
    }
    match std::env::current_exe() {
        Ok(p) => { log("[RUST] get_exe_path: Using current_exe path: ..."); Some(p) }
        Err(e) => { log("[RUST] get_exe_path: Failed to get current_exe: ..."); None }
    }
}

fn get_default_dir() -> Result<String, String> {
    // CONFIRMED root 0x1402C9770..0x1402C993B.
    let exe = get_exe_path().ok_or("unable to resolve launcher executable")?;
    // HIGH CONFIDENCE: derive a client/install directory from launcher path.
    // Exact original parent/join rules differ by platform and are not fabricated.
    let dir = derive_install_dir(exe)?;
    log("[RUST] get_default_dir: Resolved to ...");
    Ok(dir.to_string_lossy().into_owned())
}
