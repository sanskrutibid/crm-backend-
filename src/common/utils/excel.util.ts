import * as ExcelJS from 'exceljs';

/**
 * Generates a styled Excel workbook Buffer from a headers array and a 2D rows array.
 * Includes professional styling such as navy header background, white bold text,
 * Segoe UI typography, zebra-striped rows, light gray borders, and auto-fitted columns.
 */
export async function generateExcelBuffer(
  sheetName: string,
  headers: string[],
  rows: any[][],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName.slice(0, 31)); // sheetName limit is 31 chars in Excel

  // Set up columns
  worksheet.columns = headers.map((header) => ({
    header,
    key: header,
  }));

  // Add rows
  worksheet.addRows(rows);

  // Style header row (Row 1)
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = {
      name: 'Segoe UI',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E78' }, // Professional Navy
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      bottom: { style: 'medium', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    };
  });

  // Style data rows
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header
    row.height = 22;
    row.eachCell((cell) => {
      cell.font = {
        name: 'Segoe UI',
        size: 10,
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'left',
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      };

      // Zebra striping (alternate row colors)
      if (rowNumber % 2 === 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' }, // Off-white / light slate
        };
      }
    });
  });

  // Auto-fit column widths
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const valStr = cell.value !== null && cell.value !== undefined ? String(cell.value) : '';
      if (valStr.length > maxLength) {
        maxLength = valStr.length;
      }
    });
    // Give some padding and set min/max constraints
    column.width = Math.min(Math.max(maxLength + 4, 12), 45);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as unknown as Buffer;
}
