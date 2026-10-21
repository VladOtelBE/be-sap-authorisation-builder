# Test report – MDM_HQ

Role(s): `Z_VOT_BEMIND_MDM_HQ_COM1 (+ Z_FLP_USER)` · User: `Z_VOT_BM_T1` · System: S02/120 · 2026-10-21T12:46:00Z → 2026-10-21T13:31:00Z

**18 tiles – 18 PASS / 0 PARTIAL / 0 FAIL**

| Page | Tile | ID | Type | Opens | Nav | Status | Error / fix |
|---|---|---|---|---|---|---|---|
| Business Partners | Maintain Business Partner | BP | WEBGUI | PASS | 3/4 | PASS | FIXED 13:22: F_KNA1_GRP + F_LFA1_GRP ACTVT 01/02/03/06, KTOKD/KTOKK * in _ALL, derived regenerated. Now an automatic rule (config authOverrides). |
| Articles & Purchasing Info Records | Create Article | MM41 | WEBGUI | PASS | - | PASS |  |
| Articles & Purchasing Info Records | Maintain Article | MM42 | WEBGUI | PASS | - | PASS |  |
| Articles & Purchasing Info Records | Display Article | MM43 | WEBGUI | PASS | - | PASS |  |
| Articles & Purchasing Info Records | Create Purchasing Info Record | ME11 | WEBGUI | PASS | - | PASS |  |
| Articles & Purchasing Info Records | Change Purchasing Info Record | ME12 | WEBGUI | PASS | - | PASS |  |
| Articles & Purchasing Info Records | Display Purchasing Info Record | ME13 | WEBGUI | PASS | 3/3 | PASS |  |
| Articles & Purchasing Info Records | Export Master Data - Products | F3251 | FIORI | PASS | 1/1 | PASS |  |
| Bills of Material | Create Bill of Material | CS01 | WEBGUI | PASS | - | PASS |  |
| Bills of Material | Change Bill of Material | CS02 | WEBGUI | PASS | - | PASS |  |
| Bills of Material | Manage Multilevel Bill of Material | F5238 | FIORI | PASS | 3/3 | PASS |  |
| Bills of Material | Display Bill of Material | CS03 | WEBGUI | PASS | 3/3 | PASS |  |
| Bills of Material | Display Multilevel BOM Explosion | CS12 | WEBGUI | PASS | - | PASS |  |
| Bills of Material | Compare Bills of Material | F5938 | FIORI | PASS | - | PASS |  |
| Sales Prices | Manage Prices - Sales | F4111 | FIORI | PASS | 1/1 | PASS | Performance only: advise users to filter by condition type before Go. |
| Sales Prices | Create Condition | VK11 | WEBGUI | PASS | - | PASS |  |
| Sales Prices | Change Condition | VK12 | WEBGUI | PASS | - | PASS | Custom target mapping PriceCondition-changeCondition -> VK12 works (generic, no preset). |
| Sales Prices | Display Condition | VK13 | WEBGUI | PASS | - | PASS |  |