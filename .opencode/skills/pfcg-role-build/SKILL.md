---
name: pfcg-role-build
description: How to build PFCG business roles (master _ALL + derived per org perimeter) with Fiori spaces/pages and catalogs in S/4HANA on-premise, including transport/package setup, approval flow and verification.
---

## Prerequisites (read from config/project.json)
transport layer, packages, naming, test user, access types → ACTVT.

## Approval protocol
1. Print an **object plan** table: `# | type | name | description | package | transport | action (create/update)`.
2. Wait for explicit user approval. Approval of the table covers only the listed objects.
3. Create one object at a time, verify it, log it in `output/<KEY>/<KEY>_build-log.md`.

## Step details
### A. Transport + packages
- `createTransport` (workbench) with text `BeMind - <KEY> role build`.
- Super-package `Z_BEMIND` (structure package, transport layer from config, software component HOME),
  sub-package `Z_BM_ROLESAUTHORS` (super-package = `Z_BEMIND`).
- Verify: `SELECT DEVCLASS, PARENTCL, PDEVCLASS FROM TDEVC WHERE DEVCLASS IN ('Z_BEMIND','Z_BM_ROLESAUTHORS')`.

### B. Helper class `Z_VOT_BEMIND_ROLE_BUILDER` (source: `abap/`)
Runs via `runClass` (IF_OO_ADT_CLASSRUN). Uses standard function modules found in S02:
`PRGN_RFC_CREATE_ACTIVITY_GROUP` (create role), `PRGN_RFC_CHANGE_TEXTS`, `PRGN_RFC_ADD_AGRS_TO_COLL_AGR`,
`BAPI_USER_ACTGROUPS_ASSIGN` (assign roles), `BAPI_USER_CREATE1` (test user).
Menu entries for catalogs / spaces and derivation use PFCG APIs – verify each API exists in the
system (`SELECT FUNCNAME FROM TFDIR WHERE FUNCNAME = '...'`) before relying on it; if not available,
fall back to the browser (PFCG in WebGUI) and tell the user.
The class must be parameterised by a design JSON passed as constant/input – no business data hard-coded
beyond what the user approved.

### C. Role content (master `_ALL`)
- Menu: business catalogs (or custom catalog) + space `Z_VOT_BEMIND_SP_<KEY>`.
- Authorisations: from catalogs' S_SERVICE + S_TCODE (start authorisations), then SU24 proposals;
  set ACTVT per access type (config `accessTypes`); org levels `*` in `_ALL`.
- Generate profile. Verify via AGR_1251 / AGR_1016.

### D. Derived roles
- Name `Z_VOT_BEMIND_<KEY>_<PERIMETER>` (e.g. `_COM1`), parent = `_ALL`.
- Org levels: `BUKRS`, `WERKS`, `EKORG`, `VKORG` (+ `VTWEG`, `SPART` = `*` unless specified) from design.
- Generate profile, verify.

### E. Spaces & pages
Created in the launchpad apps "Manage Launchpad Spaces" / "Manage Launchpad Pages" (browser) or
transaction `/UI2/FLPCM_CONF` – with the transport and package from config. Then add the space to
the master role menu (Launchpad Space entry).

### F. Test user
`Z_VOT_BM_T1` (config). Create if missing (initial password from the user at runtime, never stored),
user type Dialog, assign the derived (or _ALL) role(s) + required technical FLP role if needed
(check: `SAP_UI2_USER_700` or the project's technical role – ask user).

### G. Verification
`AGR_DEFINE`, `AGR_AGRS`, `AGR_1251` (ACTVT), `AGR_USERS` for user, `AGR_HIERT` (menu texts).
