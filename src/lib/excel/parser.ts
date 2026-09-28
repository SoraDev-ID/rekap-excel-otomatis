import * as XLSX from 'xlsx';
import { sanitizeRowData } from './sanitizer';

export interface ParsedSheetData {
  sheetName: string;
  columns: string[];
  columnTypes: Record<string, 'number' | 'string' | 'date'>;
  previewRows: Record<string, any>[];
  totalRows: number;
  sanitizedCount: number;
  threatsDetected: string[];
  allRows: Record<string, any>[];
}

export function parseExcelBuffer(buffer: Buffer, requestedSheet?: string): ParsedSheetData {
  const workbook = XLSX.read(buffer, {
    type: 'buffer',
    cellDates: true,
    cellNF: false,
    cellText: false,
  });

  const sheetName = requestedSheet && workbook.SheetNames.includes(requestedSheet)
    ? requestedSheet
    : workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error('File Excel tidak memiliki lembar kerja (worksheet).');
  }

  const worksheet = workbook.Sheets[sheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
    raw: false,
    dateNF: 'yyyy-mm-dd',
  });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('Lembar kerja kosong atau tidak memiliki data.');
  }

  // Sanitize all rows against formula injection
  const { data: sanitizedRows, sanitizedCount, threatsDetected } = sanitizeRowData(rawRows);

  // Extract columns
  const firstRow = sanitizedRows[0] || {};
  const columns = Object.keys(firstRow);

  // Detect column data types
  const columnTypes: Record<string, 'number' | 'string' | 'date'> = {};
  for (const col of columns) {
    let numericCount = 0;
    let validCount = 0;

    for (let i = 0; i < Math.min(sanitizedRows.length, 50); i++) {
      const val = sanitizedRows[i][col];
      if (val !== undefined && val !== null && val !== '') {
        validCount++;
        // Remove currency symbols / commas if any
        const cleanedStr = String(val).replace(/[^0-9.-]/g, '');
        if (!isNaN(Number(cleanedStr)) && cleanedStr !== '') {
          numericCount++;
        }
      }
    }

    if (validCount > 0 && numericCount / validCount >= 0.7) {
      columnTypes[col] = 'number';
    } else {
      columnTypes[col] = 'string';
    }
  }

  return {
    sheetName,
    columns,
    columnTypes,
    previewRows: sanitizedRows.slice(0, 10),
    totalRows: sanitizedRows.length,
    sanitizedCount,
    threatsDetected,
    allRows: sanitizedRows,
  };
}
