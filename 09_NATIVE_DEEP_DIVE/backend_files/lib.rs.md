# `src/lib.rs` — Native 入口与 Tauri 命令面

> 类型：高可信静态重建；不是原始 Rust 源文件。

## 已确认职责

`src/lib.rs` 是 Native 总入口。二进制直接保留 `src\lib.rs` 路径，同时 Tauri command 名单、插件名和前端 `invoke()` 调用形成闭环。

### 注册的项目命令

共确认 19 个业务 command：

`get_default_dir`, `available_space`, `client_version`, `git_status`, `git_pull`, `git_push`, `git_clone`, `git_change_remote`, `verify_file`, `update_file`, `verify_mpq`, `update_mpq`, `build_mpq`, `extract_mpq`, `get_mpq_file`, `set_mpq_file`, `is_game_running`, `prepare_self_update`, `run_detached`。

参数 ABI 见仓库 `07_INVENTORIES/tauri_invoke_calls.json` 与 `05_NATIVE_BACKEND_RECONSTRUCTION/backend_command_contracts.md`。

## Tauri/插件层

静态依赖确认：Tauri 2.9.4 / Wry；dialog、fs、http、log、opener、os、shell、single-instance、stronghold、window-state。单实例会将第二次启动转为聚焦/显示 `main` 窗口。

## 本文件内/附近可归属的 Native 业务

- `available_space(path)`：按目标路径解析所在磁盘并返回可用空间；找不到磁盘时日志为 `[RUST] available_space: Disk for path ... not found`。
- `is_game_running(forceClose?)`：枚举 `WoW.exe`；可在 `forceClose=true` 时终止进程，并有成功/失败 PID 日志。
- `client_version(path)`：打开目标 PE，供前端得到 `[version, build]`；没有足够符号恢复开发者原始局部变量。
- IPC wrapper：Tauri 自动生成的反序列化/错误包装层与真实业务函数是分开的，反编译时不要把 wrapper 当业务主体。

## 证据边界

完整 `tauri.conf.json`、capabilities JSON 与 ACL 原文件未以可逆文本存在于样本中；只能由插件/运行时字符串和实际调用面重建。

## Ultimate 命令入口补全

Tauri 命令字面量 → RIP XREF → `.pdata` 的反查补出了此前没有日志函数名的入口：

- `client_version`: command literal `0x14184A101` → XREF `0x1405F1F2F` → dispatch root `0x1405F1E70–0x1405F2E69`。
- `verify_file`: command literal `0x14184A19F` → XREF `0x14067468A` → dispatch root `0x1406745D0–0x14067532A`。
- `prepare_self_update`: command literal `0x14184A1CC` → XREF `0x1405EDC9E` → dispatch root `0x1405EDBE0–0x1405EE287`。

`client_version` 的 root 在 `0x1405F20EC` 还引用了一个静态格式结构，其中指向 `Failed to open exe "": ` 与 `src\lib.rs`；递归静态可达 API 包含 `CreateFileW`。因此“打开给定 WoW.exe 并读取其版本/Build，再以 `[string,string] | null` 返回”是由 Native + 前端 ABI 双重证据支持的行为，而不是仅由命令名推测。

`verify_file` 的前端契约已精确到 `path/hash/mtime -> [hash,mtime]`。它承担 mtime 命中时的缓存优化以及需要时的文件 hash 计算；具体原始 Rust hash helper 名/类型已被优化，不伪造。

完整 19-command 映射见 `10_NATIVE_ULTIMATE/IPC_DISPATCH_MAP.md`。

### 系统 API 交叉证据

- `available_space` 静态可达 `kernel32!GetDiskFreeSpaceExW`。
- `get_exe_path` 静态可达 `kernel32!GetEnvironmentVariableW`，与 `APPIMAGE` 字符串一致。
- `client_version` 静态可达文件打开/句柄路径，包括 `CreateFileW`/`CloseHandle`。
