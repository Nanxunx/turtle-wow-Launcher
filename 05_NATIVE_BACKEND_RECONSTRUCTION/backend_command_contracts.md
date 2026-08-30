# Rust / Tauri 后端重建（高可信静态重建，非原始 Rust 源码）

> 精度标记：命令名与前端调用参数是确定事实；Rust 文件名来自编译路径；内部步骤来自二进制日志/字符串及前端行为交叉验证。没有 Rust source map/PDB 符号，因此不能声称恢复了开发者原始 Rust 源文件、变量名或注释。

## 已恢复 Rust 模块骨架

- `src/lib.rs`：Tauri 初始化、插件、命令注册、单实例、窗口聚焦、进程/磁盘/客户端版本类命令。
- `src/git.rs`：libgit2 仓库状态、clone/pull/push、切分支、改 remote、autostash。
- `src/default_dir.rs`：默认游戏目录解析；兼容 AppImage/current_exe。
- `src/spawn_process.rs`：脱离启动子进程、working dir、args/env、stdout/stderr、退出码 Channel。
- `src/updater.rs`：普通文件更新、MPQ 更新、校验、自更新准备、进程检测、磁盘空间等。
- `src/updater/fetcher.rs`：可恢复 HTTP 下载、HEAD/Content-Length/Range、partial、超时/镜像重试/哈希。
- `src/updater/mpq.rs`：StormLib MPQ open/create/compact/read/write/build/extract/listfile/attributes。
- `src/updater/signature_check.rs`：通过 `pe-sign` 校验启动器自更新 PE 签名。

## IPC 命令面（19 个）

| 命令 | 前端可见参数/返回 | 作用 |
|---|---|---|
| `get_default_dir` | 无 | 解析默认客户端目录 |
| `available_space` | `path` -> number/null | 查询磁盘可用空间 |
| `client_version` | `path` -> `[version, build]`/null | 读取 WoW.exe 版本/Build |
| `git_status` | `dir` -> repository info/null | remote、branch、changes、upToDate |
| `git_pull` | `dir, branch?, force, channel` | pull/切分支/强制同步；有 autostash 逻辑 |
| `git_push` | `dir, message, channel` | 提交并 push dev patch |
| `git_clone` | `url, dir, branch?, channel/onProgress` | Addon Git clone |
| `git_change_remote` | `dir, url` | 修改 origin remote |
| `verify_file` | `path, hash, mtime` -> `[hash,mtime]` | 本地文件增量哈希缓存 |
| `update_file` | `path, file, primaryMirror, channel` | 可恢复/镜像容错下载普通文件 |
| `verify_mpq` | `path,prefix,files,cache,channel` | MPQ 内文件级校验 |
| `update_mpq` | `path,files,primaryMirror,channel` | 增量更新 MPQ，并支持 finalizing |
| `build_mpq` | `path,source,channel` | 从开发目录构建 MPQ，遵守 `.patchignore` |
| `extract_mpq` | `path,target,channel` | 解包 MPQ |
| `get_mpq_file` | `path,fileName` | 从 MPQ 读取文件（UI 用 `Patch.toc`） |
| `set_mpq_file` | `path,fileName,data` | 向 MPQ 写/覆盖文件（UI 用 `Patch.toc`） |
| `is_game_running` | `forceClose?` -> bool | 查找 `WoW.exe`，可尝试杀进程 |
| `prepare_self_update` | `path` -> program | 自更新启动前的平台相关准备/返回待运行 program；Windows 样本未证明这里再次做签名校验（签名 gate 已定位在 `update_file`） |
| `run_detached` | `program,workingDir?,args?,envVars?,channel` | 脱离启动并回传退出码 |

## 下载器证据

二进制中可见：`HEAD request failed`、`content-length`、`bytes=-`、`Already downloaded`、`Invalid range`、`Size mismatch`、`Write failed`、`Timeout waiting for data chunk`、`Hash mismatch ... after download`、`All download URLs failed`。这与前端 `.partial` 清理、缓存和镜像选择形成闭环。

## Git 证据

二进制中可见 `origin`、`HEAD/main/master`、`refs/remotes/origin/`、`user.name`、`user.email`、`WIP: Autostash by pull`，并存在 clone/pull/push/status/change_remote 命令。

## MPQ 证据

后端包含 StormLib Rust binding；特殊 MPQ 文件 `(listfile)`、`(attributes)`、`(signature)`、`(user data)` 被识别。Dev patch 默认忽略 Git 元数据，以及 json/yml/yaml/exe/dll/db/csv/png/psd/txt/md/sql 等与补丁无关的文件。
