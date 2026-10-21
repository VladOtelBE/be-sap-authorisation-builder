// Playwright snippets for "Manage Launchpad Pages" (#FLPPage-manage), S/4HANA 2023 on-premise.
// Proven on S02/120 on 2026-10-21 (Z_VOT_BEMIND_PG_MDM_HQ_*). Run each STEP as a separate
// browser_run_code_unsafe call (tool timeout ~60 s). Replace CONFIG in every step.
//
// UI facts learned (do not change without re-testing):
// - The request field appears in the Create dialog only after the first "Create" click.
// - Create ALL sections first: "Add Section" resets the catalog side panel -> select the catalog AFTER.
// - Catalog dialog: tick the row checkbox (only if aria-checked != true), then "Select".
// - With >1 section, "Add" on a tile opens an "Add to Sections" popover; the section checkbox must be
//   found via its row text (names with "&" do not match by accessible name).
// - Tiles are matched by the start of their title in the side panel; max ~4 tiles per call.
// - Save: click Save in a separate call and verify that "Edit" is visible again (session timeouts lose it).
const CONFIG = {
  url: 'https://<host>/sap/bc/ui2/flp?sap-client=120&sap-language=EN#FLPPage-manage',
  id: 'Z_VOT_BEMIND_PG_<KEY>_<AREA>', description: 'BeMind <KEY> - ...', title: '...',
  request: 'S02K9XXXXX', catalog: 'Z_VOT_BEMIND_BC_<KEY>',
  sections: [{ title: 'Create & Maintain', tiles: ['Tile title 1'] }, { title: 'Display & Analyse', tiles: ['Tile title 2'] }],
};

// STEP 1 – create the page (start on the page list)
async (page) => {
  const idle = async () => { for (let i = 0; i < 20; i++) { await page.waitForTimeout(700); if (!(await page.locator('#sap-ui-blocklayer-popup').isVisible().catch(() => false))) return; } };
  await page.getByRole('button', { name: 'Create', exact: true }).click(); await idle();
  const dlg = page.getByRole('dialog', { name: 'Create Page' });
  const inp = dlg.locator('input');
  await inp.nth(0).fill(CONFIG.id); await inp.nth(1).fill(CONFIG.description); await inp.nth(2).fill(CONFIG.title);
  await dlg.getByRole('button', { name: 'Create' }).click(); await idle();
  if (await dlg.isVisible().catch(() => false)) {
    const n = await inp.count(); await inp.nth(n - 1).fill(CONFIG.request); await inp.nth(n - 1).press('Tab');
    await dlg.getByRole('button', { name: 'Create' }).click(); await idle();
  }
  return page.url();
};

// STEP 2 – edit mode, create sections, then select the catalog
async (page) => {
  const idle = async () => { for (let i = 0; i < 20; i++) { await page.waitForTimeout(700); if (!(await page.locator('#sap-ui-blocklayer-popup').isVisible().catch(() => false))) return; } };
  await page.getByRole('button', { name: 'Edit' }).click(); await idle();
  for (let si = 0; si < CONFIG.sections.length; si++) {
    if (si > 0) { await page.getByRole('button', { name: 'Add Section' }).last().click(); await page.waitForTimeout(1200); }
    const t = page.locator('input[placeholder="Enter a section title"]').nth(si);
    await t.fill(CONFIG.sections[si].title); await t.press('Tab');
  }
  await page.getByRole('tab', { name: 'Manually Selected' }).click(); await idle();
  await page.getByRole('button', { name: 'Additional Options' }).click(); await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'Select Catalogs' }).click(); await idle();
  const cdlg = page.getByRole('dialog').filter({ hasText: 'Select Catalogs' }).last();
  const s = cdlg.getByRole('searchbox'); await s.fill(CONFIG.catalog); await s.press('Enter'); await page.waitForTimeout(2500);
  const cb = cdlg.getByRole('listitem').filter({ hasText: CONFIG.catalog }).getByRole('checkbox').first();
  if ((await cb.getAttribute('aria-checked')) !== 'true') await cb.click();
  await cdlg.getByRole('button', { name: 'Select' }).click(); await idle();
  return 'sections + catalog ready';
};

// STEP 3 – add tiles of ONE section (repeat per section)
async (page) => {
  const SECTION = CONFIG.sections[0];
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const side = page.getByRole('complementary', { name: 'Side Content' });
  for (const tile of SECTION.tiles) {
    await side.locator('li').filter({ hasText: new RegExp('^\\s*' + esc(tile)) }).first().getByRole('button', { name: 'Add' }).click({ timeout: 8000 });
    await page.waitForTimeout(700);
    if (CONFIG.sections.length > 1) {
      const pop = page.locator('.sapMPopover:visible').last();
      await pop.locator('li').filter({ hasText: new RegExp('^\\s*' + esc(SECTION.title) + '\\s*$') }).locator('[role="checkbox"]').first().click({ timeout: 8000 });
      await page.waitForTimeout(250);
      await pop.getByRole('button', { name: 'Add' }).click();
    }
    await page.waitForTimeout(1100);
  }
  const out = [];
  for (const g of await page.getByRole('group').filter({ has: page.locator('input[placeholder="Enter a section title"]') }).all())
    out.push(`${await g.locator('input[placeholder="Enter a section title"]').inputValue()} => ${JSON.stringify(await g.locator('.sapMGTHdrTxt').allInnerTexts())}`);
  return out.join('\n');
};

// STEP 4 – save (then wait ~8 s and check: Edit button visible, tiles listed, no alert dialog)
async (page) => {
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(8000);
  const errs = await page.locator('[role="alertdialog"]:visible, [role="dialog"]:visible').allInnerTexts();
  return JSON.stringify({ saved: await page.getByRole('button', { name: 'Edit' }).isVisible().catch(() => false), tiles: await page.locator('.sapMGTHdrTxt').allInnerTexts(), errs });
};
