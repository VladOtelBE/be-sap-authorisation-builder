// Playwright snippet for "Manage Launchpad Pages" (intent #FLPPage-manage), S/4HANA 2023 on-premise.
// Creates ONE page with sections and tiles taken from ONE catalog (manually selected).
// Run with playwright browser_run_code_unsafe after replacing CONFIG. Start on the page LIST
// (…/flp?sap-client=120#FLPPage-manage). Proven on S02/120 on 2026-10-20 (Z_VOT_BEMIND_PG_MDM_HQ_*).
//
// UI facts learned (do not change without re-testing):
// - Transport field appears in the Create dialog only after the first "Create" click.
// - Catalog selection dialog: click the row's checkbox (role=checkbox "Item Selection"), then "Select".
// - With >1 section, the tile "Add" button opens an "Add to Sections" popover: tick the section, press Add.
//   With exactly 1 section the tile is added directly.
// - Tiles are matched by the start of their title in the side panel (e.g. "Export Master Data").
async (page) => {
  const CONFIG = {
    id: 'Z_VOT_BEMIND_PG_XXX',
    description: 'BeMind XXX - ...',
    title: '...',
    transport: 'S02K9XXXXX',
    catalog: 'Z_VOT_BEMIND_BC_XXX',
    sections: [ { title: 'Create & Maintain', tiles: ['Tile title 1'] } ],
  };
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const idle = async () => { for (let i = 0; i < 25; i++) { await page.waitForTimeout(800); if (!(await page.locator('#sap-ui-blocklayer-popup').isVisible().catch(() => false))) return; } };
  const log = [];
  // 1. create page
  await page.getByRole('button', { name: 'Create', exact: true }).click(); await idle();
  const dlg = page.getByRole('dialog', { name: 'Create Page' });
  const inp = dlg.locator('input');
  await inp.nth(0).fill(CONFIG.id); await inp.nth(1).fill(CONFIG.description); await inp.nth(2).fill(CONFIG.title);
  await dlg.getByRole('button', { name: 'Create' }).click(); await idle();
  if (await dlg.isVisible().catch(() => false)) {
    const n = await inp.count(); await inp.nth(n - 1).fill(CONFIG.transport); await inp.nth(n - 1).press('Tab');
    await dlg.getByRole('button', { name: 'Create' }).click(); await idle();
  }
  log.push('created ' + page.url());
  // 2. edit mode + select catalog
  await page.getByRole('button', { name: 'Edit' }).click(); await idle();
  await page.getByRole('tab', { name: 'Manually Selected' }).click(); await idle();
  await page.getByRole('button', { name: 'Additional Options' }).click(); await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'Select Catalogs' }).click(); await idle();
  const cdlg = page.getByRole('dialog').filter({ hasText: 'Select Catalogs' }).last();
  const s = cdlg.getByRole('searchbox'); await s.fill(CONFIG.catalog); await s.press('Enter'); await page.waitForTimeout(2500);
  await cdlg.getByRole('listitem').filter({ hasText: CONFIG.catalog }).getByRole('checkbox').first().click();
  await cdlg.getByRole('button', { name: 'Select' }).click(); await idle(); await page.waitForTimeout(2500);
  const side = page.getByRole('complementary', { name: 'Side Content' });
  // 3. create all sections first
  for (let si = 0; si < CONFIG.sections.length; si++) {
    if (si > 0) { await page.getByRole('button', { name: 'Add Section' }).last().click(); await page.waitForTimeout(1200); }
    const t = page.locator('input[placeholder="Enter a section title"]').nth(si);
    await t.fill(CONFIG.sections[si].title); await t.press('Tab'); await page.waitForTimeout(400);
  }
  // 4. add tiles
  const multi = CONFIG.sections.length > 1;
  for (const sec of CONFIG.sections) for (const tile of sec.tiles) {
    const row = side.locator('li').filter({ hasText: new RegExp('^\\s*' + esc(tile)) }).first();
    await row.getByRole('button', { name: 'Add' }).click(); await page.waitForTimeout(800);
    if (multi) {
      const pop = page.locator('.sapMPopover:visible').last();
      await pop.getByRole('checkbox', { name: sec.title, exact: true }).click(); await page.waitForTimeout(300);
      await pop.getByRole('button', { name: 'Add' }).click();
    }
    await page.waitForTimeout(1500);
  }
  // 5. verify + save
  for (const g of await page.getByRole('group').filter({ has: page.locator('input[placeholder="Enter a section title"]') }).all()) {
    log.push(`  ${await g.locator('input[placeholder="Enter a section title"]').inputValue()} => ${JSON.stringify(await g.locator('.sapMGTHdrTxt').allInnerTexts())}`);
  }
  await page.getByRole('button', { name: 'Save' }).click(); await idle(); await page.waitForTimeout(1500);
  const errs = await page.locator('[role="alertdialog"]:visible').allInnerTexts();
  log.push(errs.length ? 'ERRORS: ' + errs.join(' | ') : (await page.getByRole('button', { name: 'Edit' }).isVisible() ? 'saved' : 'save state unknown'));
  return log.join('\n');
}
