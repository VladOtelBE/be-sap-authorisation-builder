---
name: flp-tile-testing
description: Procedure to test every tile of a Fiori Launchpad role with the browser (Playwright) - login handoff, opening each space/page/tile, checking errors, exercising navigation buttons read-only, collecting evidence, and writing test-results.json.
---

## Setup
1. Read `config/project.json` → `system.flpUrl`, `testUser.id`.
2. `playwright_browser_navigate` to the FLP URL. When the login page shows, **stop and ask the user**
   to enter the test user credentials in the browser (never type the password yourself).
   Confirm the logged-in user (user menu / `#Shell-home` → user actions → "About" or "Settings").
3. Language EN unless user says otherwise.

## Per tile
For each tile in `design.json` (space → page → section → tile order):
1. Navigate to the page (space menu), take an accessibility snapshot, locate the tile by title.
2. **Presence**: tile visible? (fail = not in role / catalog / page).
3. **Open**: click tile, wait for app load (max 30 s). Fail conditions:
   - FLP error dialogs: "Could not open app", "App could not be opened because the SAP UI5 component…",
     "Navigation to this application is not supported", "You are not authorized…"
   - WebGUI: "You are not authorized to use transaction", short dump screen, empty frame.
   - UI5: MessagePage with error, red message strip, HTTP 403/500 in network requests (`/sap/opu/odata`).
4. **Navigation buttons** (read-only): collect visible buttons/links in the app header/toolbar
   (snapshot). For each *navigation-type* control (Go, Display, Navigate to…, related apps,
   Back, tabs, "Other functions" menu entries that open screens): click, check no error, go back.
   **Never click**: Save, Post, Delete, Release, Activate, Create (final step), Submit, Approve.
   For WebGUI: use Enter/F4 help on first field, toolbar navigation, then "Cancel"/"Exit" (F3/F12).
5. Back to the page (`Shell-home` or browser back), continue.
6. On failure: screenshot `output/<KEY>/screens/<tileId>.png`, console errors, failed network calls.

## Result schema (`output/<KEY>/<KEY>_test-results.json`)
```json
{
  "profileKey": "MDM_HQ", "role": "Z_VOT_BEMIND_MDM_HQ_COM1", "user": "Z_VOT_BM_T1",
  "system": "S02/120", "startedAt": "ISO", "finishedAt": "ISO",
  "results": [
    { "space": "", "page": "", "section": "", "tileTitle": "", "entryId": "", "tileType": "FIORI|WEBGUI",
      "presence": "PASS|FAIL", "open": "PASS|FAIL|SKIPPED",
      "navigation": [ { "control": "", "result": "PASS|FAIL", "note": "" } ],
      "status": "PASS|FAIL|PARTIAL", "error": "", "evidence": "", "proposedFix": "" }
  ]
}
```
Then `node scripts/build-test-report.mjs output/<KEY>/<KEY>_test-results.json`.

## Proven technique (S02/120, 2026-10-21) – script `scripts/flp/test-tile.js`
- Open a page directly: `#Launchpad-openFLPPage?spaceId=<SPACE>&pageId=<PAGE>`; go to `#Shell-home` between tiles.
- Tile titles contain soft hyphens → match with regex `/Main.*tain.*Arti.*cle/`.
- Max 2–3 tiles per `browser_run_code_unsafe` call (tool timeout ~60 s).
- WebGUI apps run in an iframe whose URL contains `webgui`. **Only read VISIBLE message bars/dialogs** –
  WebGUI keeps old messages in hidden ARIA live regions (caused false FAILs on MM41-43).
- "Open" = tile visible + app loaded without error. "Navigation" = enter an existing object in display
  (prepare read-only test data by SQL first: BP, info record, BOM...), press header/texts/Go, then Exit/Back.
- Fiori list apps: press **Go**, check row count + OData status (403 = S_SERVICE missing). Big result sets may
  stay busy long (F4111: 531 records) – check the $batch response before declaring a failure.
- SU53 in a second tab fails in WebGUI ("current transaction must be terminated") – instead check the role
  (AGR_1251) for the object named in the message.
- Use data of the role perimeter (e.g. COM1 plants) to verify the org restriction (F5238 listed only PCEN/PPRD).

## Failure analysis hints
| Symptom | Likely cause | Check |
|---|---|---|
| Tile missing | business catalog not in role / not on page | AGR_HIER, page content |
| "Could not open app" | target mapping missing (technical catalog not in role) | /UI2/PB_C_TM, role menu |
| Not authorised (tcode) | S_TCODE / start authorisation missing | AGR_1251 S_TCODE |
| 403 OData | S_SERVICE missing | AGR_1251 S_SERVICE |
| Data not displayed | org-level authorisation | AGR_1252, SU53 |
