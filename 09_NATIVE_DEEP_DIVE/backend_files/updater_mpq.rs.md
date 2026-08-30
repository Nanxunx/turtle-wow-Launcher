# `src/updater/mpq.rs` — StormLib MPQ 操作层

## 已定位底层 MPQ helper

两组高度相似的单态化函数：

- `0x1401F4850–0x1401F62DA`
- `0x1401F6B00–0x1401F8ACA`

两组都引用 `src\.\mpq.rs`，并包含 `Creating archive`、`Failed to check if file exists`、`Failed to find file`、`Failed to remove file` 等日志。重复是 Rust 泛型/调用上下文单态化的典型结果。

## 特殊文件

明确识别并在 build ignore 中排除：

`(listfile)`、`(attributes)`、`(signature)`、`(user data)`。

## Dev Patch 构建

`build_mpq`：

- 优先读取 `.patchignore`。
- 不存在时使用编译进程序的 default ignore。
- 默认忽略 `.git/**`、`.github/**`、`.gitignore` 和 json/yml/yaml/exe/dll/db/csv/png/psd/txt/md/sql，以及 MPQ 特殊文件。
- 通过 Channel 发送 `mpqBuild` 进度。

## UI 直接读写

`get_mpq_file(path,fileName)` 与 `set_mpq_file(path,fileName,data)` 被用于 `Patch.toc`，因此不是只读校验器，而是具有修改 archive 内容的能力。

## 尚需样本验证

StormLib 的具体 create/open flags、压缩 mask、sector size、MPQ format version 没有足够高层符号可安全恢复成原作者常量名；不要把 StormLib 默认值当作该 Launcher 的已证实配置。
