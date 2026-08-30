//! RECONSTRUCTED RUST-LIKE PSEUDOCODE — NOT ORIGINAL SOURCE.

fn run_detached(
    program: String,
    working_dir: Option<String>,
    args: Vec<String>,
    env_vars: Option<Vec<(String,String)>>,
    channel: Channel<i32>,
) -> Result<(), String> {
    let mut cmd = Command::new(program);
    if let Some(dir) = working_dir { cmd.current_dir(dir); }
    cmd.args(args);
    if let Some(env) = env_vars { for (k,v) in env { cmd.env(k,v); } }
    let mut child = spawn_detached(cmd)?;
    spawn_background(move || {
        match child.wait() {
            Ok(status) => {
                let code = status.code().unwrap_or_default();
                if let Err(e) = channel.send(code) {
                    log("[RUST] run_detached Failed to send exit code: ...");
                }
            }
            Err(e) => log("[RUST] run_detached Failed to wait on child process: ..."),
        }
    });
    Ok(())
}
