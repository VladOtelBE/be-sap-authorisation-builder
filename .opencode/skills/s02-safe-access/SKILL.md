---
name: s02-safe-access
description: Rules and known pitfalls for accessing the SAP target system (S02) through the ABAP ADT MCP tools - sequential calls, session recovery, SQL dialect, approval rules.
---

## Connection facts (verify on each run)
- Tools prefix: `mario-andreschak-mcp-abap-adt-s02_` (see `config/project.json`).
- The ADT connection is bound to one client (currently **120**). Verify with:
  `SELECT MANDT, AGR_NAME FROM AGR_DEFINE WHERE AGR_NAME LIKE 'Z_VOT%'` → MANDT column shows the client.

## Pitfalls observed
1. **Never call S02 tools in parallel.** Parallel calls corrupt the session → every following call
   returns HTTP 400 / "Internal server error".
2. Recovery: call `login` once (it may return a schema-validation error in the client but still
   re-authenticates), then retry the failed call **once**. If it fails again, the query itself is
   probably invalid (see 3).
3. `runQuery` uses ABAP SQL (Open SQL) via ADT data preview:
   - Use `~` for alias columns in joins (`M~WERKS`), `ORDER BY x DESCENDING`.
   - Some tables fail (e.g. TCETRAL, T000 with unknown fields) – check field names via `ddicElement`
     before retrying; do not loop.
   - Always set `rowNumber`.
4. `hasTransportConfig` / `searchObject` return 400 when the session is broken – same recovery.

## Approval rules
- Read-only tools (`runQuery`, `tableContents`, `searchObject`, `getObjectSource`, `ddicElement`,
  `objectStructure`, `healthcheck`, `dumps`) → no approval needed.
- Anything that creates/changes/deletes/activates/runs → explicit user approval per object.

## Useful read-only queries
| Purpose | Query |
|---|---|
| Role exists | `SELECT AGR_NAME, PARENT_AGR FROM AGR_DEFINE WHERE AGR_NAME = '<role>'` |
| Role menu | `SELECT OBJECT_ID, PARENT_ID, REPORTTYPE, REPORT, URL FROM AGR_HIER WHERE AGR_NAME = '<role>'` |
| Role tcodes | `SELECT LOW FROM AGR_1251 WHERE AGR_NAME = '<role>' AND OBJECT = 'S_TCODE'` |
| User assignment | `SELECT AGR_NAME, FROM_DAT, TO_DAT FROM AGR_USERS WHERE UNAME = '<user>'` |
| Tcode exists | `SELECT TCODE FROM TSTC WHERE TCODE IN (...)` |
| Company codes | `SELECT BUKRS, BUTXT, LAND1 FROM T001 WHERE BUKRS IN (...)` |
| Plants of company code | `SELECT W~WERKS FROM T001W AS W INNER JOIN T001K AS K ON K~BWKEY = W~BWKEY WHERE K~BUKRS = '<bukrs>'` |
| Purchasing orgs | `SELECT EKORG, BUKRS FROM T024E` |
| Sales orgs | `SELECT VKORG, BUKRS FROM TVKO` |
