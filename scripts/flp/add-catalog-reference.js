// Playwright snippet for /UI2/FLPCM_CUST (Launchpad Content Manager, WebGUI)
// Adds a Tile+TM *reference* to the currently selected catalog.
// Usage (via playwright browser_run_code_unsafe): edit the ITEMS array, then run.
// Each item: [searchTerm, navigationIntent, originalTileCatalog, originalTMCatalog]
// Only adds when exactly ONE row matches all 4 criteria (never guesses).
async (page) => {
  const ITEMS = globalThis.__BM_ITEMS || [];
  const txt = async (cell) => { const cb = cell.locator('[role="combobox"]'); return (await cb.count()) ? ((await cb.first().textContent()) || '').trim() : ''; };
  const openAdd = async () => {
    const box = page.getByRole('textbox', { name: 'Search Tiles/Target Mappings' });
    if (!(await box.count())) {
      await page.getByRole('button', { name: 'Add Tiles/Target Mappings' }).click();
      await page.waitForTimeout(800);
      await page.getByText('Add Tiles/TMs to Selected Catalog').click();
      await box.waitFor({ timeout: 15000 });
      await page.waitForTimeout(2000);
    }
    return box;
  };
  const addOne = async (term, intent, tileCat, tmCat) => {
    const box = await openAdd();
    await box.fill(term); await box.press('Enter');
    // wait until a result row shows a matching intent (max 15 s)
    let matches = [];
    for (let i = 0; i < 15; i++) {
      await page.waitForTimeout(1000);
      matches = [];
      const rows = await page.locator('[role="row"]').all();
      for (const r of rows) {
        const cells = await r.locator('[role="gridcell"]').all();
        if (cells.length < 18) continue;
        if (await txt(cells[2]) === 'Tile + TM' && await txt(cells[12]) === intent && await txt(cells[15]) === tileCat && await txt(cells[16]) === tmCat) matches.push(r);
      }
      if (matches.length) break;
    }
    if (matches.length !== 1) return `${term}: ${matches.length} candidates - SKIPPED`;
    await matches[0].locator('[role="gridcell"]').nth(3).click();
    await page.waitForTimeout(800);
    await page.getByRole('button', { name: 'Add Tile/TM Reference' }).click();
    await page.waitForTimeout(3500);
    return `${term}: ` + (((await page.locator('[role="alert"]').last().textContent().catch(() => '')) || '').trim());
  };
  const out = [];
  for (const it of ITEMS) out.push(await addOne(...it));
  return out.join('\n');
}
