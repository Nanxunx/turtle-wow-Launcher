# `src/spawn_process.rs` — 脱离进程启动器

## 两层结构

- Tauri command `run_detached` 的业务范围已定位为 `0x140620E30–0x140621C18`。
- 另一个明确引用 `src\spawn_process.rs` 的子进程 wait/exit helper 位于 `0x140526060–0x1405265C3`。

## 前端 ABI

`run_detached({ program, workingDir?, args?, envVars?, channel })`。

实际使用场景：

1. Windows 启动 `WoW.exe`。
2. Linux/Wine 启动用户配置命令。
3. Dev Patch 打开 VS Code `code.cmd`。
4. 启动 Launcher 自更新程序。

## 已确认错误路径

Native 字符串：

- `[RUST] run_detached Failed to wait on child process: ...`
- `[RUST] run_detached Failed to send exit code: ...`

说明进程不是简单 `spawn()` 后丢弃：后台等待子进程退出，并将退出码通过 Tauri Channel 回传。前端正依赖该退出事件恢复 Launcher 窗口并重新校验游戏。

`workingDir`、args、envVars 均由 IPC 层显式传入。

## Ultimate：Win32 进程链证据

全调用图的系统 API 映射确认：

- `run_detached` root `0x140620E30` 的静态可达路径包含 `kernel32!CreateProcessW`。
- wait/exit helper `0x140526060` 直接/可达 `WaitForSingleObject` 与 `GetExitCodeProcess`。
- 该路径还涉及 environment-string、handle duplicate/close、path resolution 等 Win32 helper。

因此“创建子进程 → 后台等待 → 读取 exit code → 通过 Channel 发回前端”的生命周期已由日志、前端消费和 Win32 API 三路交叉确认。
