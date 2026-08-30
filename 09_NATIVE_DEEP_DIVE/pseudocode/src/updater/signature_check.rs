//! RECONSTRUCTED RUST-LIKE PSEUDOCODE — NOT ORIGINAL SOURCE.

fn signature_check(path: &Path) -> Result<String, String> {
    let image = parse_pe_signed_image(path)?;
    let status = pe_sign_verify(image)?;
    if status != PeSignStatus::Valid {
        log("[RUST] sign_check Failed to verify signature: ...");
        return Err("signature verification failed".into());
    }
    for subject_field in signer_certificate_subject_fields(image) {
        if let Some(cn) = subject_field.strip_prefix("CN=") {
            return Ok(cn.to_owned());
        }
    }
    Err("signer CN not found".into())
}
