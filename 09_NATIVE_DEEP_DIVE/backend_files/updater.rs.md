# `src/updater.rs` — 更新器总控 Native

## 已定位的主要函数

| 功能 | 地址范围 |
|---|---|
| `update_mpq` | `0x140561C30–0x140565994` |
| `verify_mpq` | `0x1405AEE90–0x1405AFD34` |
| `build_mpq` | `0x1405D26F0–0x1405D4AD1` |
| `extract_mpq` | `0x140614060–0x14061581C` |
| `get_mpq_file` | `0x140659C20–0x14065ADFB` |
| `set_mpq_file` | `0x14061B180–0x14061C1FF` |
| `update_file` 主状态机 | `0x1406B08C0–0x1406B42A8` |
| `update_file` progress/辅助路径 | `0x1406AC040–0x1406AE8A3` |

## Manifest Native 结构

二进制中出现字段：`ManifestItem name type hash mtime size mirrors`；前端 Zod schema 另确认 `tags`。文件类型为 `file/del/cache/mpq`，MPQ 子项为 `file/del`。

## 普通文件更新的重要新发现

`update_file` 对目标名以 `.exe` 或 `.dll` 结尾时进入额外安全分支。机器码明确：

- 检查扩展名 `.exe` / `.dll`。
- 比较 16 字节常量 `TURTLE_SIGNATURE`。
- 调用已定位的 `signature_check` 函数 `0x140006C30`。
- 对返回 signer 字符串做长度 10 与字节比较，目标是 **`Turtle WoW`**。
- 失败文本：`Failed to verify signature in ...`、`[RUST] update_file Invalid signer for "...": expected "Turtle WoW", got "..."`、`signature not found`。

这证明更新器对可执行代码文件存在比单纯 SHA hash 更进一步的 signer 验证路径。`TURTLE_SIGNATURE` 标记的精确业务语义仍应保持为“已观察到条件标记”，不能在没有源码的情况下武断命名其字段来源。

## 下载与失败恢复

确定存在：hash mismatch、删除错误 partial、复用匹配 partial、无 URL、所有 URL 失败、下载失败、进度 Channel、primary mirror。

`update_file` 与 `update_mpq` 都依赖 `fetcher.rs` 的 resumable fetch。
