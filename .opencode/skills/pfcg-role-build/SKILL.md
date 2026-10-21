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
### A. Transport + packages (reuse if existing – see config.transport)
- Workbench request (ADT `createTransport` works) for repository objects; client-specific FLP content and
  roles go on a **customizing** request (`config.transport.customizingRequest`). Note: the Launchpad
  Designer does NOT prompt for a request when a catalog is created; it records on the user's open
  customizing task → tell the user.
- Packages: ADT `createObject` for DEVC fails ("incomplete data") → create in SE21 (WebGUI): super-package
  `Z_BEMIND` (structure package, software component HOME, layer from config), sub-package `Z_BM_ROLESAUTHORS`.
- Verify: `SELECT DEVCLASS, PARENTCL, PDEVCLASS FROM TDEVC WHERE DEVCLASS IN ('Z_BEMIND','Z_BM_ROLESAUTHORS')`.

### B. Helper class `Z_VOT_BEMIND_ROLE_BUILDER` (source: `abap/`)
Runs via `runClass` (IF_OO_ADT_CLASSRUN). Idempotent: existing roles are skipped, never overwritten.
Uses SAP standard APIs verified in S02: `PRGN_RFC_CREATE_ACTIVITY_GROUP`, `PRGN_STRU_CHECK_CATALOG_NODES`,
`PRGN_STRU_CHECK_APPS_OF_NODES`, `PRGN_SAVE_ROLE_MENU` (same sequence as `CL_PFCG_FIORI_HELPER`),
`PRGN_AUTO_GENERATE_PROFILE_NEW`, `PRGN_1252_SAVE_ORG_LEVELS`, `PRGN_RFC_CREATE_DERIVATION`,
`BAPI_USER_ACTGROUPS_ASSIGN` (replaces ALL roles of the user!).
Per new profile: change the constants (request, roles, texts, catalog, space, user, FLP role) and
`get_derived_org_levels` from design.json, show the diff to the user, then syntax check + activate.
Menu node format (like SAP_BR_* roles): catalog = AGR_HIER OT/CAT_PROVIDER + AGR_BUFFI URL
`X-SAP-UI2-CATALOGPAGE:<catalog>?AUTH_DEFAULTS=X&DEST_FES=`; space = OT/SPACE_PROVIDER + URL `<space id>`.

### C. Role content (master `_ALL`)
- Menu: business catalogs (or custom catalog) + space `Z_VOT_BEMIND_SP_<KEY>`.
- Authorisations: from catalogs' S_SERVICE + S_TCODE (start authorisations), then SU24 proposals;
  set ACTVT per access type (config `accessTypes`); org levels `*` in `_ALL`.
- Generate profile. Verify via AGR_1251 / AGR_1016.

### D. Derived roles
- Name `Z_VOT_BEMIND_<KEY>_<PERIMETER>` (e.g. `_COM1`), parent = `_ALL`.
- Org levels: `BUKRS`, `WERKS`, `EKORG`, `VKORG` (+ `VTWEG`, `SPART` = `*` unless specified) from design.
- Generate profile, verify.

### E. Catalog, pages & space (client-specific, browser, admin user)
- Catalog: `/UI2/FLPD_CUST` (Designer) → create catalog `Z_VOT_BEMIND_BC_<KEY>`.
- Tile references: `/UI2/FLPCM_CUST` (Content Manager) → select catalog → "Add Tiles/TMs to Selected Catalog"
  → search (tcode or **tile title** – tcode search is truncated at 40 rows!) → pick row with Tile+TM from the
  design's technical catalog → "Add Tile/TM Reference". One tile per call (dialog closes after each add).
- **Close the Content Manager before using the Designer** on the same catalog (WebGUI session holds the lock).
- Custom TM/tile (only if approved): Designer → Target Mappings → Create (Application Type Transaction),
  then Tiles → "+" → App Launcher – Static with same semantic object/action.
- Pages: `#FLPPage-manage` (script `scripts/flp/build-page.js`); space: `#FLPSpace-manage` (untick
  "Also create a page", enter the customizing request, add the pages in order, Save).
- The space is added to the role menu by the helper class (OT / SPACE_PROVIDER).

### F. Test user
`config.testUser.id`. Create in SU01 if missing (user type Dialog, initial password typed at runtime, never
stored). Assign the derived role(s) + `config.testUser.flpRole` (Z_FLP_USER in S02/120: /UI2/FLP + FLP services).

### F2. Known system limit: S#/318 "First call Transaction SU25" (verified S02/120, 2026-10-21)
`PRGN_AUTO_GENERATE_PROFILE_NEW` (rebuild modes X/M/F) calls `PRGN_CHECK_PROFGEN_TABLES`, which only checks
`PRGN_STAT` for STAT_GRP 001 / STEP_NR 1 or 2 **for the current release** (`sy-saprl`). If missing, background
auth generation is refused even though USOBT_C/USOBX_C are filled. **Never run SU25 without system-owner approval.**
Workaround (approved): finish in PFCG dialog via browser:
1. PFCG → role `_ALL` → Authorizations → "Change authorization data" (SU25 info popup → Enter).
2. Org-level popup → "Full authorization" → Save.
3. For each object class with status "Mssng values": **double-click the status icon** (svg inside
   `a[title="Mssng values"]`) → "Assign Full Authorization for Subtree" → Execute. Batch ≤ 5 per call (timeouts).
4. Save (Ctrl+S) → toolbar button `[title="Generate (Shift+F5)"]` → accept profile name → Execute.
5. Toolbar `[title="Generate derived roles (Ctrl+Shift+F4)"]` → Continue → derived roles adjusted + generated.
6. Assign roles in SU01 (Roles tab: type into cells `grid#C102#<row>,2#if`), Ctrl+S.
Notes: `PRGN_RFC_CREATE_DERIVATION` returns `derivation_ok = 'Y'`. Org values are in AGR_1252 (AGR_1251 holds `$VARBL`).
Only use '*' for open fields when the user approved it (test roles); production roles need explicit values.

### F3. Automatic authorization overrides (config `authOverrides`, user decision 2026-10-21)
After generating the master role's authorizations and BEFORE generating the profile, apply every rule in
`config/project.json → authOverrides.rules` whose trigger matches (e.g. tcode BP in the role):
- `F_KNA1_GRP` (customer account group) and `F_LFA1_GRP` (supplier account group): ACTVT = ACTVT of the matrix
  access type of the BP entry (FULL → 01,02,03,06), account group `*`.
- Why: SU24 proposes only ACTVT F4 → "No authorization to display accounts from account group XXXX" in BP.
In PFCG (dialog): Change Authorization Data → find the object (Ctrl+F, object name) → change ACTVT values
(pencil icon on the field) → set account group → Save → Generate → Generate derived roles.
List the overrides applied in the build log. Overrides are not "making things up": they are approved project rules.

### G. Verification
`AGR_DEFINE`, `AGR_AGRS`, `AGR_1251` (ACTVT), `AGR_USERS` for user, `AGR_HIERT` (menu texts).
