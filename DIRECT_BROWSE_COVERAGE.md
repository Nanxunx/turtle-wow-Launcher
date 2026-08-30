# Direct-browse coverage / 直接浏览覆盖说明

本仓库包含两层交付：

1. **权威完整文本快照**：`archives/ultimate-text-snapshot/`，覆盖最终交付中的 **382 个 UTF-8 源码/分析文件**。这是完整性基线。
2. **GitHub 直接浏览层**：将最重要的报告、Native 后端、前端核心业务与主要 UI 源文件直接展开到正常目录，便于网页阅读、代码搜索与继续逆向。

## 权威快照校验

- XZ SHA-256: `bceb7db4a41620a0d80ef85b99d99c80682da62320098284a1f23c22d1291f29`
- 解压后文本集合 SHA-256: `2b4e2dc93ae0925beb23292378daa0e4e9fef75bea9584718e381c851888705d`

恢复脚本与分片说明位于 `archives/ultimate-text-snapshot/` 及仓库工具说明中。

## 已直接展开的重点内容

- `00_REPORT/`：完整中文逆向报告、UI 功能目录、安全/脱敏说明。
- `05_NATIVE_BACKEND_RECONSTRUCTION/`：Native IPC command contracts、依赖清单。
- `09_NATIVE_DEEP_DIVE/`：8 个 Rust 模块逐文件分析、28 个核心函数地址、Rust-like reconstructed pseudocode。
- `10_NATIVE_ULTIMATE/`：Authenticode、IPC dispatch、Git2 精确 API、签名控制流、全映像图谱说明。
- `01_ACTIVE_FRONTEND_SOURCE/src/`：应用入口、Auth/API、Patcher、Addons、stores、窗口/迁移、主要 Tabs、首次设置和 Mods/Addon 详情等源码。

## 关于 `updater.ts`

`src/server/modules/updater.ts` 的**完整、原样、已脱敏版本已经存在于权威快照中**。由于 GitHub 连接器的长文本传输在该文件上出现过截断风险，因此没有把任何不完整副本放进直接浏览层。宁可让它从已校验快照恢复，也不提交截断/伪完整文件。

## 完整性与安全边界

- 原始 `turtle-wow(6).exe` 不在公开仓库中；仓库仅记录其哈希与取证事实。
- Stronghold 固定解锁字面量保持 `[REDACTED_APP_VAULT_KEY]`，不公开原值。
- StormLib 历史 Blizzard weak MPQ private-key PEM 正文不重新发布。
- GitHub 直接浏览层是便捷视图；**权威快照才是 382 个文本文件的完整交付基线**。
