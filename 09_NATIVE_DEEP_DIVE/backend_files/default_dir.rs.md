# `src/default_dir.rs` — 默认客户端目录

## 已定位函数

- `0x1402C9040–0x1402C9563`：`get_exe_path` 相关路径解析/日志路径。
- `0x1402C9770–0x1402C993B`：`get_default_dir` 相关结果构造。

## 可确认行为

静态字符串依次出现：

- `APPIMAGE`
- `[RUST] get_exe_path: Found APPIMAGE at ...`
- `[RUST] get_exe_path: Using current_exe path: ...`
- `[RUST] get_exe_path: Failed to get current_exe: ...`
- `[RUST] get_default_dir: Resolved to ...`

因此 Native 会优先考虑 Linux AppImage 的 `APPIMAGE` 环境变量；否则使用 `std::env::current_exe()`，再从可执行文件位置推导默认目录。前端在 Native 调用失败时另有 `~/Games/TurtleWoW` fallback，这一 fallback 属于 TS 层，不应误记成 Rust 常量。

## 结论

此模块的跨平台路径逻辑是真实存在的，而不是 Windows-only 死代码；但当前样本是 Windows PE，AppImage 版具体打包布局仍需要 Linux 样本验证。

## Ultimate：系统调用交叉验证

`get_exe_path` root 的递归静态调用图包含 `kernel32!GetEnvironmentVariableW`，与函数中 `APPIMAGE` 字面量完全一致。当前 Windows PE 只能证明跨平台分支被编译进公共逻辑；AppImage 自身的 Linux-only编译分支仍需对应 ELF/AppImage 样本。
