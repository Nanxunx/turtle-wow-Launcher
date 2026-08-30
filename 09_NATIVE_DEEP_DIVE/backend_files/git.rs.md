# `src/git.rs` — Git / Addon / Dev Patch Native 后端

> 类型：机器码 + libgit2 常量 + 前端 ABI 的高可信重建。

## 已定位的真实 Native 函数边界

| 功能 | `.pdata` 函数范围 |
|---|---|
| `git_pull` | `0x1405B4A00–0x1405B68D7` |
| `git_push` | `0x140601820–0x140602D25` |
| `git_clone` | `0x140652150–0x140653420` |
| `git_change_remote` | `0x140646EA0–0x140647F54` |
| `git_status` | `0x14066D6F0–0x14066EFC1` |

对应反汇编位于 `09_NATIVE_DEEP_DIVE/evidence/disasm/`。

## 静态字符串证明的 Git 模型

二进制包含：`origin`、`HEAD`、`main`、`master`、`refs/remotes/origin/`、`refs/heads/`、`user.name`、`user.email`、`WIP: Autostash by pull`、`Invalid remote reference target`、`Invalid local reference target`、`Failed to initialize repository`、`Failed to find remote`、`Failed to open repository`。

因此可以确认：

1. 使用 libgit2/git2 crate，不是启动外部 `git.exe`。
2. `git_pull` 有 autostash 路径，stash commit message 固定为 `WIP: Autostash by pull`。
3. 对 `origin`、远端跟踪引用、本地 branch 引用做显式处理。
4. 默认分支兼容 `HEAD/main/master`。
5. `git_push` 会涉及 repository identity（`user.name` / `user.email`）。
6. `git_change_remote` 直接修改 `origin` URL。

## 前端调用语义

- Addon 更新调用 `git_pull(force=true)`；Dev Patch 手动 Pull 使用 `force=false`。
- `git_clone(url, dir, branch?, onProgress)` 的进度通道是数值百分比。
- `git_push(dir, message, channel)` 的 commit message 来自 Dev Patch UI。
- `git_status(dir)` 返回 `RepositoryInfo | null`，前端消费 remote/branch/changes/upToDate 等状态。

## 尚不能诚实声称的内容

没有 DWARF/PDB/Rust 源码，故不能证明原作者函数名、局部变量名，也不能仅凭字符串断言所有 conflict/reset/rebase 分支。仓库中的 `pseudocode/src/git.rs` 只表达已验证的行为骨架。
