# Build log – MDM_HQ (S02 / client 120)

Transport request: **S02K901596** "BeMind - MDM_HQ role build" (workbench, target V02) – task S02K901597 (OTEL)

| # | Timestamp (UTC) | Object | Type | Action | Tool | Result |
|---|---|---|---|---|---|---|
| 1 | 2026-10-20 16:05 | S02K901596 | Workbench request | create | ADT `createTransport` | OK |
| 2 | 2026-10-20 16:07 | Z_BEMIND | Structure package (HOME, ZV02) | create | SE21 (WebGUI) – ADT createObject failed "incomplete data" | OK – E071 S02K901597 |
| 3 | 2026-10-20 16:08 | Z_BM_ROLESAUTHORS | Development package, super = Z_BEMIND (HOME, ZV02) | create | SE21 (WebGUI) – ADT createObject failed "incomplete data" | OK – E071 S02K901597 |
| 4 | 2026-10-20 16:11 | Z_VOT_BEMIND_BC_MDM_HQ ("BeMind - MDM Central HQ") | FLP catalog, client-specific (120) | create (empty, no tiles yet) | /UI2/FLPD_CUST | Created – **DEVIATION**: no transport prompt; Designer recorded it automatically on existing customizing task S02K901581 (request S02K901580 "BeMind SE63 test - Z_VOT_BEMIND catalog + role", OTEL, 14.10.2026). Planned new customizing request 1b NOT created. **User decision: keep S02K901580 for all client-120 FLP content (catalog, pages, space).** |
| 5 | 2026-10-20 16:16–16:27 | Z_VOT_BEMIND_BC_MDM_HQ | 15 Tile+TM references added | add reference | /UI2/FLPCM_CUST "Add Tiles/TMs to Selected Catalog" → "Add Tile/TM Reference" | OK – verified in /UI2/FLPD_CUST: 15 tiles. MM41/42/43 (SAP_TC_RFM_MD_ITM_BE_APPS), ME11/12/13 (SAP_TC_PRC_BE_APPS), CS01/02/03/12 (SAP_TC_SCM_PP_BE_APPS), VK11/VK13 (SAP_TC_CEC_SD_BE_APPS), F4111 (SAP_TC_CEC_SD_COMMON), F5238/F5938 (SAP_TC_PLM_COMMON). |

| 6 | 2026-10-20 16:33 | Z_VOT_BEMIND_BC_MDM_HQ | + BP reference (BusinessPartner-maintain, SAP_TC_CA_BP_BE_APPS) | add reference | /UI2/FLPCM_CUST | OK – standard tile found by title search ("BP" search was truncated at 40 rows) |
| 7 | 2026-10-20 16:34 | Z_VOT_BEMIND_BC_MDM_HQ | + F3251 "Export Master Data - Products" (MasterData-export, otc=194, SAP_TC_CMD_CMP_MONPROCS_COMMON) | add reference | /UI2/FLPCM_CUST | OK – user choice: Products variant only |
| 8 | 2026-10-20 16:36 | VK12 custom TM | create target mapping | /UI2/FLPD_CUST | **FAILED** – "Page X-SAP-UI2-CATALOGPAGE:Z_VOT_BEMIND_BC_MDM_HQ is locked for customizing scope" (lock held by the WebGUI /UI2/FLPCM_CUST session). Logged off to release the lock → re-login needed. |

| 9 | 2026-10-20 16:41 | TM PriceCondition-changeCondition → VK12 | custom target mapping (Transaction, no params, desktop+tablet) | create | /UI2/FLPD_CUST | OK (after logoff released lock; SM12 showed 0 locks) |
| 10 | 2026-10-20 16:42 | Tile "Change Condition" | App Launcher – Static, SO PriceCondition / action changeCondition, icon sap-icon://edit | create | /UI2/FLPD_CUST | OK |

Catalog status: **18 tiles / 18 target mappings** = all 18 matrix entries (verified in /UI2/FLPD_CUST).

| 11 | 2026-10-20 16:45 | Z_VOT_BEMIND_PG_MDM_HQ_BP "Business Partners" | Page: [Create & Maintain] BP | create | Manage Launchpad Pages (#FLPPage-manage) | OK – S02K901580 |
| 12 | 2026-10-20 16:50 | Z_VOT_BEMIND_PG_MDM_HQ_ART "Articles & Purchasing Info Records" | Page: [Articles] MM41/42/43 · [Purchasing Info Records] ME11/12/13 · [Tools] F3251 | create | idem | OK – S02K901580 |
| 13 | 2026-10-21 08:19 | Z_VOT_BEMIND_PG_MDM_HQ_BOM "Bills of Material" | Page: [Create & Maintain] CS01/CS02/F5238 · [Display & Analyse] CS03/CS12/F5938 | create (first save lost on session timeout, redone) | idem | OK – S02K901580 |
| 14 | 2026-10-21 08:21 | Z_VOT_BEMIND_PG_MDM_HQ_PRICE "Sales Prices" | Page: [Create & Maintain] F4111/VK11/VK12 · [Display & Analyse] VK13 | create | idem | OK – S02K901580 |
| 15 | 2026-10-21 08:23 | Z_VOT_BEMIND_SP_MDM_HQ "Master Data Management" | Space with pages BP, ART, BOM, PRICE (in this order, all visible) | create | Manage Launchpad Spaces (#FLPSpace-manage) | OK – S02K901580 |

| 16 | 2026-10-21 08:33 | Z_VOT_BEMIND_ROLE_BUILDER | ABAP class (IF_OO_ADT_CLASSRUN), package Z_BM_ROLESAUTHORS | create + activate | ADT | OK – S02K901596 (fix: PT1252_T does not exist → local type) |
| 17 | 2026-10-21 08:39 | Z_VOT_BM_T1 | Dialog user, last name "BeMind Test", initial password typed in SU01 (not stored) | create | SU01 (WebGUI) | OK – USR02 USTYP=A |
| 18 | 2026-10-21 08:40 | Z_VOT_BEMIND_MDM_HQ_ALL | Master role, menu: catalog Z_VOT_BEMIND_BC_MDM_HQ (28 apps resolved) + space Z_VOT_BEMIND_SP_MDM_HQ | create via class | runClass | Role + menu OK. **Auth generation FAILED** in background: "S#/318 First call Transaction SU25 and fill Profile Generator tables" (USOBT_C has 654k rows; message is shown when the PFCG first-use flag is not set in client 120) |
| 19 | 2026-10-21 08:40 | Z_VOT_BEMIND_MDM_HQ_COM1 | Derived role, 30 org values saved, derivation=Y | create via class | runClass | Role created, derived, but no auth data (master had none); profile name T-S2480632 reserved |
| 20 | 2026-10-21 08:40 | Z_VOT_BM_T1 role assignment | – | assign via class | runClass | **NOT done** (class stops before assignment if derived step reports failure on auth) – AGR_USERS empty |
| 21 | 2026-10-21 08:43 | Z_VOT_BEMIND_MDM_HQ_ALL | PFCG "Change Authorization Data": SU25 info popup (dismissed), org levels → Full authorization (*), Save | update | PFCG (WebGUI) | Auth data saved (data status "Saved"), **109 open fields** (no default values from SU24) → profile **not generated** yet, awaiting user decision |

| 22 | 2026-10-21 09:08 | Root cause analysis S#/318 | – | read-only | SE37 PRGN_CHECK_PROFGEN_TABLES + SE16 PRGN_STAT | PRGN_STAT has SU25 step 1/2 only for releases 752/756, none for 758 → background check fails. USOBT_C/USOBX_C are filled. User decision: **do NOT run SU25**; finish in PFCG dialog (option A). Screenshots: screens/prgn_stat.png, screens/prgn_check_profgen_tables.png |
| 23 | 2026-10-21 09:57 | Z_VOT_BEMIND_MDM_HQ_ALL | 109 open fields → '*' via "Assign Full Authorization for Subtree" on 20 object classes (user decision: * for test role) | update | PFCG (WebGUI) | OK – 0 open fields |
| 24 | 2026-10-21 09:58 | Z_VOT_BEMIND_MDM_HQ_ALL | Generate profile | generate | PFCG | OK – profile T-S2480634, 535 auth values |
| 25 | 2026-10-21 09:59 | Z_VOT_BEMIND_MDM_HQ_COM1 | "Generate derived roles" from master | adjust + generate | PFCG | OK – 535 auth values, profile T-S2480632, AGR_1252 keeps COM1 org values (BUKRS COM1, 22 WERKS, EKORG 9000/9001/PO01, VKORG LA01/SO01) |
| 26 | 2026-10-21 10:01 | Z_VOT_BM_T1 | Roles Z_VOT_BEMIND_MDM_HQ_COM1 + Z_FLP_USER (valid to 31.12.9999) | assign | SU01 | OK – AGR_USERS |
| 27 | 2026-10-21 10:05 | Z_VOT_BEMIND_ROLE_BUILDER | Fixes: derivation_ok 'Y', sy-subrc capture, verification reads AGR_1252, header documents S#/318 limit | update + activate | ADT | OK – re-run: roles skipped, assignment re-applied, verification all green |

**Lesson:** never keep /UI2/FLPCM_CUST (WebGUI) and /UI2/FLPD_CUST open on the same catalog – the WebGUI session holds the page lock.

### Open points found while adding references (resolved, kept for history)
- **BP**: no *tile* exists for `BusinessPartner-maintain` in any catalog of client 120 – only target mappings ("TM only", e.g. SAP_TC_CA_BP_BE_APPS / SAP_NW_BE_APPS). Needs a custom tile (+ reference to the standard TM) in the Z catalog.
- **F3251**: no generic tile; 3 standard tiles exist in SAP_TC_CMD_CMP_MONPROCS_COMMON, each preset to one object type: "Export Master Data - Business Partners" (otc=147), "- Products" (otc=194), "- BP Relationships" (otc=1405).
- **VK12**: as planned, custom tile + custom TM `PriceCondition-changeCondition` → VK12.
- Title differences vs design: MM42 standard tile = "Maintain Article" (design said "Change Article"); CS01/02/03 = "Create/Change/Display Bill of Material"; CS12 = "Display Multilevel BOM Explosion"; F4111 = "Manage Prices" / "Sales". References keep SAP titles.
