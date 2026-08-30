# `src/updater/signature_check.rs` — PE signer 提取/验证

## 已定位函数

`0x140006C30–0x14000725F`，函数大小约 1.5 KiB，直接引用 `src\.\signature_check.rs` 和 `[RUST] sign_check Failed to verify signature:`。

## 机器码可确认的算法轮廓

1. 读取/解析 PE 签名结构，依赖 `pe-sign 0.1.10`。
2. 验证 helper 返回后读取状态字节；`0x140006D4E` 执行 `cmp bl, 0x3`，非 3 直接进入失败路径。
3. `pe-sign 0.1.10` 的 `PeSignStatus` 字段顺序为 `UntrustedCertificateChain / Expired / Invalid / Valid`，因此高可信对应 `status == PeSignStatus::Valid`。
4. 只有通过该状态 gate 后才遍历证书 subject/属性集合。
5. `0x1400070FD–0x140007115` 直接比较 ASCII **`CN=`** 三字节。
6. 找到后构造并返回 CN 值；找不到进入错误/空返回路径。

## 与 `update_file` 的交叉验证

`update_file` 在 `.exe/.dll` 安全分支中调用 `0x140006C30`，随后要求返回字符串精确等于 `Turtle WoW`。因此当前最强静态重建链是：

`download -> pe-sign verify -> require Valid -> subject CN extraction -> CN == "Turtle WoW" -> accept signer-policy gate`。

静态证据没有证明项目额外 pin 了 leaf thumbprint、issuer 或 serial，因此不做这种过度断言。

## 与样本自身 Authenticode 的交叉验证

最终 byte-level 复核确认当前 Launcher 样本本身携带完整 `WIN_CERTIFICATE`（Security Directory `0x1F71C00 / 0x26E8`）。PKCS#7 叶子证书 Subject 含 `O=Turtle WoW, CN=Turtle WoW`，Issuer 为 `Sectigo Public Code Signing CA EV R36`；独立重算的 Authenticode SHA-256 与 signed content digest 完全一致。详见 `10_NATIVE_ULTIMATE/AUTHENTICODE_FORENSICS.md`。
