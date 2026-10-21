// Playwright snippet - Fiori Tester: open tiles from FLP pages and classify the result (read-only).
// Usage: browser_run_code_unsafe with this file content; edit TESTS. Keep <= 3 tiles per call (tool timeout).
// Lessons (S02/120, 2026-10-21):
//  - WebGUI keeps old messages in hidden ARIA live regions -> only read VISIBLE message bars/dialogs.
//  - Tile titles contain soft hyphens -> match with regex like /Main.*tain.*Arti.*cle/.
//  - Go to #Shell-home between tiles to close the previous WebGUI session cleanly.
async (page) => {
  const FLP = 'https://bedusapp01.dev.bearingpoint.com:4430/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html?sap-client=120&sap-language=EN';
  const SPACE = 'Z_VOT_BEMIND_SP_MDM_HQ';
  const TESTS = [ ['Z_VOT_BEMIND_PG_MDM_HQ_XXX', /Tile.*Title/] ];
  const test = async (pageId, re) => {
    const r = { tile: String(re), presence: 'FAIL', open: 'SKIPPED', hash: '', title: '', msg: '', error: '' };
    await page.goto(`${FLP}#Shell-home`); await page.waitForTimeout(2000);
    await page.goto(`${FLP}#Launchpad-openFLPPage?spaceId=${SPACE}&pageId=${pageId}`); await page.waitForTimeout(5000);
    const tile = page.locator('.sapMGT:visible').filter({ hasText: re }).first();
    if (!(await tile.count())) { r.error = 'tile not visible'; return r; }
    r.presence = 'PASS';
    await tile.click(); await page.waitForTimeout(11000);
    r.hash = await page.evaluate(() => location.hash);
    const flpErr = await page.locator('[role="alertdialog"]:visible, .sapMMessageBox:visible, .sapMMessagePage:visible').allInnerTexts();
    const gui = page.frames().find((f) => f.url().includes('webgui'));
    let vis = '';
    if (gui) {
      r.title = await gui.title().catch(() => '');
      vis = await gui.evaluate(() => Array.from(document.querySelectorAll('[role="dialog"], .lsMessageBar, [ct="MB"], [class*="MessageBar"]'))
        .filter((e) => e.offsetParent !== null).map((e) => e.innerText.trim()).join(' | ')).catch(() => '');
    } else {
      r.title = await page.title();
      vis = (await page.locator('.sapMMsgStrip:visible, .sapMMessagePage:visible').allInnerTexts()).join(' | ');
    }
    r.msg = vis.slice(0, 250);
    const bad = flpErr.length > 0 || /not authorized|no authorization|keine Berechtigung|Short dump|Runtime Error|could not be opened/i.test(vis);
    r.error = flpErr.length ? flpErr.join(' | ').slice(0, 300) : (bad ? r.msg : '');
    r.open = bad ? 'FAIL' : 'PASS';
    return r;
  };
  const out = [];
  for (const [p, re] of TESTS) out.push(await test(p, re));
  return JSON.stringify(out, null, 1);
}
