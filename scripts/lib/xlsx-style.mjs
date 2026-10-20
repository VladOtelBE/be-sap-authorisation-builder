// Shared Excel styling helpers (exceljs)
export const COLORS = {
  header: 'FF1F3864', headerFont: 'FFFFFFFF', band: 'FFF2F2F2',
  pass: 'FFC6EFCE', fail: 'FFFFC7CE', warn: 'FFFFEB9C', fiori: 'FFDDEBF7', webgui: 'FFFCE4D6',
};

export function addTable(ws, columns, rows, { freeze = true } = {}) {
  ws.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 20 }));
  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: COLORS.headerFont } };
  head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.header } };
  head.alignment = { vertical: 'middle', wrapText: true };
  head.height = 30;
  for (const r of rows) ws.addRow(r);
  ws.eachRow((row, i) => {
    row.alignment = { vertical: 'top', wrapText: true };
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = { top: { style: 'thin', color: { argb: 'FFBFBFBF' } }, bottom: { style: 'thin', color: { argb: 'FFBFBFBF' } },
        left: { style: 'thin', color: { argb: 'FFBFBFBF' } }, right: { style: 'thin', color: { argb: 'FFBFBFBF' } } };
    });
    if (i === 1) row.alignment = { vertical: 'middle', wrapText: true };
  });
  if (freeze) ws.views = [{ state: 'frozen', ySplit: 1 }];
  if (rows.length) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
}

export function fill(cell, argb) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}
