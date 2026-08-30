# `src/updater/fetcher.rs` — HTTP 可恢复下载

## 已定位函数

- `resumable_fetch` 相关大函数被内联/组合进 `update_mpq` 路径（`0x140561C30–0x140565994`）。
- `try_fetch`：`0x140568430–0x14056AC93`。
- `update_file` 构建中有第二份泛型/单态化 fetcher 代码，字符串重复出现在约 `0x1854DD8` 起。

Rust monomorphization 会导致同一源函数产生多份机器码，不能把重复字符串误认为两个独立源码文件。

## 协议行为（静态证据）

明确字符串：

`HEAD request failed`、`content-length`、`bytes=-`、`Already downloaded`、`Invalid range`、`Fetch failed`、`Size mismatch != +`、`Write failed`、`Timeout waiting for data chunk`。

由此可确认：

1. 先有 HEAD/Content-Length 路径。
2. 支持 HTTP `Range: bytes=<offset>-` 续传。
3. 已下载尺寸与远端长度会比较；完整时可直接结束。
4. 服务端 Range 不满足预期会进入 invalid-range/size-mismatch 错误。
5. 流式 chunk 接收存在超时。
6. 本地写失败独立报错。
7. 外层遍历 mirrors，全部失败才返回 `All download URLs failed`。

## 与前端进度事件的对应

前端处理 `initial / progress / revert`；Native 还对 MPQ 路径发送 `finalizing`。因此 partial 重用会通过 `initial` 把已完成字节计入，失败重试可通过 `revert` 抵消估算。
