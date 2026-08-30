# `signature_check` machine-code control-flow evidence

Target: `0x140006C30–0x14000725F` (`src/updater/signature_check.rs`).

## Verification status gate

```asm
0x140006D0E  call   0x140890A00
0x140006D1E  movzx  ebx, byte ptr [rbp+0x3F0]
0x140006D4E  cmp    bl, 0x3
0x140006D51  jne    0x140006F1A
```

Only status value `3` proceeds. The binary embeds `pe-sign 0.1.10`; upstream `PeSignStatus` orders fieldless variants `UntrustedCertificateChain`, `Expired`, `Invalid`, `Valid`, making `Valid == 3` under sequential Rust discriminants. Thus the high-confidence reconstruction is a `PeSignStatus::Valid` requirement.

## Subject CN extraction

At `0x1400070FD–0x140007115`, machine code requires at least three bytes and directly tests for ASCII `CN=`:

```asm
0x1400070F2  cmp    rdi, 0x3
0x1400070FD  movzx  r8d, word ptr [rbx]
0x140007101 xor    r8d, 0x4E43
0x140007108 movzx  r9d, byte ptr [rbx+0x2]
0x14000710D xor    r9d, 0x3D
0x140007111 or     r9w, r8w
0x140007115 jne    0x1400070E0
```

`update_file` then requires the returned signer string to equal exact ten-character `Turtle WoW`.

Static reconstruction:

```text
PE update candidate
  -> pe-sign verification
  -> require status == Valid
  -> extract certificate subject CN
  -> require CN == "Turtle WoW"
  -> accept signer-policy gate
```

No project-level leaf-thumbprint/issuer/serial pinning is claimed without additional evidence.
