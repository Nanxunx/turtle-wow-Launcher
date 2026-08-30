# Sample identity — final verified record

This file supersedes fingerprint/signature statements in intermediate drafts.

## File fingerprints

- File: `turtle-wow(6).exe`
- Size: **32,981,736 bytes** (`0x1F742E8`)
- MD5: `d14f9bd959c1c48060182706f355362d`
- SHA-1: `b32243a1c5e53122ad92e2c32349d9ee892126ee`
- SHA-256: `58b5f61bf70bbab56dc16af0d20d7351ac6ddb6051eea1058f56ee2a204be4f6`
- PE: PE32+ / AMD64 / Windows GUI
- Image base: `0x140000000`
- Entry RVA: `0x103E2C8` (VA `0x14103E2C8`)
- PE timestamp: `2026-03-22 11:32:12 UTC`
- PE checksum field: `0x1F84001`

## Security Directory

- File offset: `0x1F71C00`
- Size: `0x26E8` = **9,960 bytes**
- File size equals `security_offset + security_size`: **yes**
- `WIN_CERTIFICATE.dwLength`: `0x26E8`
- Revision: `0x200`
- Certificate type: `0x2` (`WIN_CERT_TYPE_PKCS_SIGNED_DATA`)

An intermediate report incorrectly treated `0x1F71C00` as EOF and described the certificate as missing. Final byte-level recheck shows the complete certificate table is present.
