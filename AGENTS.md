# be-sap-authorisation-builder – Project Rules

These rules apply to EVERY agent in this repository (orchestrator and sub-agents).

## Mission
From an S/4HANA authorisation matrix (Excel), build Fiori-only end-user business roles:
1. Analyse the matrix and propose a Fiori layout (spaces / pages / tiles) per Business Profile.
2. Build the roles in the target system (`_ALL` master role + derived roles per org perimeter).
3. Test every tile of the built role in the Fiori Launchpad (FLP).

## Mandatory deliverables per Business Profile
| # | Deliverable | Location |
|---|---|---|
| D1 | End-user layout proposition (Excel): spaces/pages with technical + end-user names, tiles per page | `output/<PROFILE_KEY>/<PROFILE_KEY>_Layout.xlsx` |
| D2 | Role design (JSON, machine readable, input for the builder) | `output/<PROFILE_KEY>/<PROFILE_KEY>_design.json` |
| D3 | Built role(s) in the target system, assigned to the test user | Target system (PFCG) |
| D4 | Test report (Excel + Markdown) | `output/<PROFILE_KEY>/<PROFILE_KEY>_TestReport.xlsx` / `.md` |

## Hard rules (never break)
1. **Never make anything up.** Every tile, catalog, target mapping, tcode, org value must be either
   (a) read from the matrix, or (b) read from the target system. If unsure → ask the user. Unresolved
   items go to the "Gaps & Open Points" sheet, never silently guessed.
2. **Ask before EVERY creation/change in the SAP system.** One explicit approval per object (or per
   clearly listed batch the user approved). Read-only queries do not need approval.
3. **Naming:** every object created in SAP starts with `Z_VOT_BEMIND`. Exceptions only where SAP
   length limits forbid it and the user approved (see `config/project.json` → `naming`).
4. **Packages/transports:** repository objects go in package `Z_BM_ROLESAUTHORS` (super-package
   `Z_BEMIND`), transport layer `ZV02`, recorded on a workbench request. Never use `$TMP` unless told.
5. **System access discipline (S02):** call the ADT MCP tools **sequentially, never in parallel** –
   parallel calls break the session. On HTTP 400/500 after a working call, re-run `login` once, then retry once.
6. **Fiori only for end users:** native Fiori apps → Fiori tiles; classic transactions → **SAP GUI for
   HTML (WebGUI) tiles**. No SAP GUI access is designed for end users.
7. **Access type semantics (ACTVT):** `FULL (Create/Update/Delete)` = 01, 02, 03, 06 ·
   `Update Only` = 02, 03 · `Display Only` = 03.
8. **Never store passwords** in files, prompts or commits. Users type credentials in the browser themselves.
   The only exception is the initial password of a newly created test user, which is given by the user
   at runtime and must not be written to the repository.
9. **Check-in format** after every step (compact):
   ```
   DONE: ...
   NEXT: ...
   QUESTIONS / BLOCKERS: ...
   ```

## Project configuration
All system-specific values (system, client, FLP URL, test user, prefixes, packages, transport layer)
live in `config/project.json`. Agents must read it at the start of a run and never hard-code them.
