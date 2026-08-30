# Authenticode forensics

## Confirmed from sample bytes

The PE Security Directory contains a complete PKCS#7 SignedData object.

- Security table: `0x1F71C00` + `0x26E8`
- PKCS#7 payload length: **9,952 bytes**
- Embedded Authenticode digest algorithm: **SHA-256**
- Embedded `SpcIndirectDataContent` digest: `C6C30AAB3471547E258CC4D9406843CFC56C38887CF6E41904E9CA8D9161D8F6`
- Independently recomputed Authenticode SHA-256: `C6C30AAB3471547E258CC4D9406843CFC56C38887CF6E41904E9CA8D9161D8F6`
- Digest match: **YES**

## Code-signing identity

Leaf certificate:

- Subject includes `O=Turtle WoW, CN=Turtle WoW`
- Issuer: `C=GB, O=Sectigo Limited, CN=Sectigo Public Code Signing CA EV R36`
- Serial: `222DFA3ED57295BD0BAD2384B906E198`
- Validity: `2025-01-08T00:00:00Z` → `2028-04-07T23:59:59Z`
- SHA-256 certificate fingerprint: `0C8C22F9B6F74CC5EFA1BCC71407272C197DF500D8756CFD8C26AC096AF2B828`
- EKU: Code Signing

## Timestamp

ASN.1 `signingTime`: **2026-03-22 11:32:23 UTC**. PE timestamp: `2026-03-22 11:32:12 UTC`, 11 seconds earlier.

## Updater cross-check

Native machine code requires verification status byte `== 3`, then extracts certificate subject `CN=`, and `update_file` requires exact signer name `Turtle WoW`. With upstream `pe-sign 0.1.10` enum ordering, status `3` corresponds at high confidence to `PeSignStatus::Valid`.

The complete detailed report and certificate inventory are preserved in the Ultimate text snapshot.
