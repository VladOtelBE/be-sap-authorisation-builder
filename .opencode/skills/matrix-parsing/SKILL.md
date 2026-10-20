---
name: matrix-parsing
description: How to read an S/4HANA authorisation matrix workbook (Business Profile List + Fiori Tile List + Admin sheets) and extract the apps/tcodes and access types for one Business Profile.
---

## Expected workbook structure (reference: W&J matrix v1 2026-04-28)
The parser locates everything **by header text, not by fixed position**, so column shifts are tolerated.

### Sheet `Business Profile List`
Header row contains: `Pilot`, `Domain (BPML L1)`, `Business Profile`, `Derivation by`, `Comments (func / business)`.
One row per Business Profile. `Derivation by` describes the org perimeter, e.g.
- `COMPANY CODE - Creation / Modify / Display` → derived roles per company code
- `PLANT 9201 - ...` → derived per plant
- `CROSS MAISON (ALL MARKETS) - ...` → `_ALL` only in the client; a demo derived role may be added on request
- `MAISON/ MARKET/CHANNEL ...` → derived per sales org / distribution channel (ask user for mapping)

### Sheet `Fiori Tile List`
- Row with group headers (domains) above the real header row.
- Real header row contains `#`, `BPML L1`, `BPML L2`, `Fiori Tile ID / Transaction code / WRICEF ID`,
  `Comment`, then **one column per Business Profile** (exact same name as in the profile list,
  sometimes with trailing spaces → always trim).
- Cell value at (entry, profile) = access type; empty = not assigned.

### Sheet `Admin`
Allowed values: BPML L1/L2 lists and access types:
`FULL (Create/Update/Delete)`, `Display Only`, `Update Only`.

## Interpreting the entry ID
| Pattern | Meaning | Tile type |
|---|---|---|
| `F` + digits (e.g. F4111), optionally suffix | SAP Fiori app ID (Fiori Apps Library) | Fiori (UI5) – resolve via app ID |
| Classic tcode (letters/digits, e.g. MM42, VK11, BP) | SAP GUI transaction | WebGUI tile (SAP GUI for HTML) |
| `Z*` / `Y*` | Custom tcode or app | Ask user / resolve in system |
| WRICEF IDs (project specific) | Custom development | Ask user – gap |

Notes:
- Some tcodes also exist as an F-number transaction (e.g. `F4111` is a TSTC entry) – check TSTC.
- The `Comment` column often contains the app title + rationale (e.g. "GUI because more fields than the
  Fiori version"). Keep it in the design as `matrixComment`, it is the business justification.
- Access type on display tcodes (MM43, CS03…) stays display by nature; ACTVT from the access type
  applies to the authorisation objects proposed for the role.

## Tool
```
node scripts/parse-matrix.mjs <file.xlsx> --list
node scripts/parse-matrix.mjs <file.xlsx> --profile "<Business Profile>" [--out <file.json>]
```
The script opens the workbook read-only (works even if it is open in Excel – it copies it to a temp file first).
Always cross-check: total rows, rows for the profile, distinct access types.
