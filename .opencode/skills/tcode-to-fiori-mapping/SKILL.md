---
name: tcode-to-fiori-mapping
description: Resolve each matrix entry (Fiori app ID or classic tcode) to its Fiori launchpad content in the target system - technical catalog, target mapping (semantic object/action), tile title, app type - using only read-only queries. Never guess.
---

## Principle
Every mapping value written to `design.json` must come from a query result in the target system,
with its `source` recorded. If no result → entry goes to `gaps` with the reason. Ask the user.

## Sources in the target system (verified on S02, S/4HANA 2023)
### 1. Target mapping cache `/UI2/PB_C_TM` (primary source)
Columns usable in `runQuery` (avoid STRING/RAWSTRING columns: `URL`, `PARAMETERS`, `URLT_PARAMETERS`
– they make the ADT data preview fail with "Internal server error"):
`ID, PARENTID, SEM_OBJ, SEM_ACT, APP_TYPE, TCODE, UI5_COMPONENT_ID, WD_APPL_ID, SYSTEM_ALIAS, INFORMATION, CONF_TEXT`

- `PARENTID` = catalog, format `X-SAP-UI2-ADCAT:<TECH_CATALOG>:<SCOPE>` (technical catalog, e.g.
  `X-SAP-UI2-ADCAT:SAP_TC_CA_PR_BE_APPS:S4CMD`). `SAP_TC_*_BE_APPS` = back-end (target mapping) catalogs.
- `APP_TYPE`: `TR` = SAP GUI transaction (→ WebGUI), `SAPUI5` = UI5 app, `WDA` = Web Dynpro, `URL`.
- Classic tcode lookup:
  ```sql
  SELECT PARENTID, SEM_OBJ, SEM_ACT, APP_TYPE, TCODE FROM /UI2/PB_C_TM
   WHERE TCODE IN ('MM42','VK11',...)
  ```
  Keep max ~7 tcodes per query (large results + session stability).

### 2. Fiori app ID (F-number) – proven resolution chain (works when INFORMATION is empty)
1. `SELECT TCODE FROM TSTC WHERE TCODE IN ('F5238',...)` + `TSTCT` (SPRSL='E') for the title.
2. `SELECT OBJ_NAME, DEVCLASS FROM TADIR WHERE PGMID='R3TR' AND OBJECT='TRAN' AND OBJ_NAME IN (...)` → package.
3. `SELECT OBJ_NAME, OBJECT FROM TADIR WHERE DEVCLASS IN (...) AND OBJECT IN ('WAPA','UIAD')` → app
   descriptor GUID(s) + BSP app.
4. `SELECT ID, PARENTID, SEM_OBJ, SEM_ACT, UI5_COMPONENT_ID FROM /UI2/PB_C_TM WHERE ID LIKE '%<UIAD GUID>%'`
   → exact target mapping (ID = `...CATALOGPAGE:<TC>:<GUID>_TM`). If no hit, match the BSP name with
   `UI5_COMPONENT_ID` (e.g. BSP `MD_CMPEXPFILES1` ↔ `mdm.cmd.cmpexportfiles1`).

Additional notes:
- `SELECT TCODE FROM TSTC WHERE TCODE = 'F4111'` – many apps have an F-number transaction (package
  name hints the UI component, e.g. `UI_SD_SALESPRICES_MANAGES1`).
- `/UI2/PB_C_TM` with `INFORMATION` or `UI5_COMPONENT_ID` – the app ID is often in `INFORMATION`.
  Try `WHERE INFORMATION LIKE '%F4111%'`.
- Standard business roles (`SAP_BR_*`) menu texts: `SELECT OBJECT_ID, TEXT FROM AGR_HIERT WHERE
  AGR_NAME = 'SAP_BR_...' AND SPRAS = 'E'` (catalog/space titles). Do NOT select `AGR_HIER-URL`
  or `AGR_BUFFI-URL` (string columns → failure).
- Catalog objects: ADT `searchObject` with `objType: UIAC` (technical catalogs), `UIPG` (page templates),
  `UIST` (space templates). App descriptors `UIAD` have hashed names → not useful for search by app ID.

### 3. Business catalog / tile (visual) level
Note (S02/120): the tile cache `/UI2/PB_C_TILE` may be EMPTY (filled only on FLP usage) → business
catalogs cannot be found by SQL. Then: either check the FLP Content Manager (`/UI2/FLPCM_CUST`) in the
browser, or propose a custom business catalog (gap to confirm by the user).
Tile titles: use `TSTCT` (tcodes) / `TSTCT` of the F-transaction (apps); retail tcodes have dynamic
texts ("Create Material &") → use the matrix comment wording and say so in `mappingRationale`.
Also: some tcodes have only parameterised intents (e.g. VK12 → `setSalesPricesMaterials`) → raise a gap.

Business catalogs (`SAP_*_BC_*`) contain tiles referencing the technical catalog target mappings.
For the design we need at least: technical catalog + semantic object/action + title.
If a standard business catalog containing the tile is found, record it as `businessCatalog`
(preferred to assign in the role). Otherwise mark `needsCustomCatalog: true` (builder will create
`Z_VOT_BEMIND_TC_<KEY>` with references to the standard target mappings, after approval).

## Choosing among several mappings for one tcode
A tcode can exist in many catalogs (e.g. `BP` in 8 catalogs). Choose by:
1. Industry/scope fitting the system & matrix (e.g. `S4RFM` Retail Fashion for MM41/42/43 when the
   matrix says "Retail article"; `S4CMD` Cross Master Data for BP).
2. Semantic action that matches the tcode intent (MM42 → `change`/`maintain`, MM43 → `display`).
3. Prefer catalogs used by an `SAP_BR_*` role related to the profile domain.
Record alternatives in `alternatives[]` and explain the choice in `mappingRationale`.
If no criterion separates two candidates → ask the user.

## Output fields per entry (design.json → tiles[])
`entryId, matrixRow, matrixComment, accessType, tileType (FIORI|WEBGUI), title, semanticObject,
semanticAction, technicalCatalog, scope, businessCatalog, appType, needsCustomCatalog, source,
alternatives[], mappingRationale`
