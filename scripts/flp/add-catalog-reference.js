// Playwright snippet for /UI2/FLPCM_CUST (Launchpad Content Manager, WebGUI) – proven on S02/120 (2026-10-20/21).
// Adds ONE Tile+TM *reference* to the currently selected catalog (select it first via "Search Catalogs").
// Usage: browser_run_code_unsafe with this content; set ITEM. Run ONE item per call:
//   the add dialog closes after each add, and the tool times out after ~60 s.
// ITEM = [searchTerm, navigationIntent, originalTileCatalog, originalTMCatalog, optionalTitle]
//   searchTerm: tcode, F-number or TILE TITLE (tcode search is truncated at 40 rows, e.g. "BP" -> use the title)
//   optionalTitle: filter on tile title when several variants exist (e.g. 'Export Master Data - Products')
// Only adds when exactly ONE row matches all criteria (never guesses).
// Grid column indexes (S02): 2 = match type ("Tile + TM"), 7 = tile title, 12 = navigation intent,
//   15 = original tile catalog, 16 = original TM catalog.
async (page) => {
  const ITEM = ['MM42', 'Article-maintain', 'SAP_TC_RFM_MD_ITM_BE_APPS', 'SAP_TC_RFM_MD_ITM_BE_APPS', ''];
  const [term, intent, tileCat, tmCat, title] = ITEM;
  const txt = async (cell) => { const cb = cell.locator('[role="combobox"]'); return (await cb.count()) ? ((await cb.first().textContent({ timeout: 2000 }).catch(() => '')) || '').trim() : ''; };
  let box = page.getByRole('textbox', { name: 'Search Tiles/Target Mappings' });
  if (!(await box.count())) {
    await page.getByRole('button', { name: 'Add Tiles/Target Mappings' }).click({ timeout: 8000 });
    await page.waitForTimeout(800);
    await page.getByText('Add Tiles/TMs to Selected Catalog').click();
    await box.waitFor({ timeout: 15000 });
    await page.waitForTimeout(3000);
  }
  await box.fill(term); await box.press('Enter');
  let matches = [];
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(1000);
    matches = [];
    for (const r of await page.locator('[role="row"]').all()) {
      const cells = await r.locator('[role="gridcell"]').all();
      if (cells.length < 18) continue;
      if (await txt(cells[2]) !== 'Tile + TM') continue;
      if (intent && await txt(cells[12]) !== intent) continue;
      if (await txt(cells[15]) !== tileCat || await txt(cells[16]) !== tmCat) continue;
      if (title && await txt(cells[7]) !== title) continue;
      matches.push(r);
    }
    if (matches.length) break;
  }
  if (matches.length !== 1) return `${term}: ${matches.length} candidates - SKIPPED (refine ITEM)`;
  await matches[0].locator('[role="gridcell"]').nth(3).click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'Add Tile/TM Reference' }).click();
  await page.waitForTimeout(4000);
  return `${term}: ` + (((await page.locator('[role="alert"]').last().textContent({ timeout: 3000 }).catch(() => '')) || '').trim());
}
