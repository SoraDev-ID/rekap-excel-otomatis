export interface SanitizationResult<T = any> {
  data: T[];
  sanitizedCount: number;
  threatsDetected: string[];
}

const DANGEROUS_PREFIXES = ['=', '+', '-', '@', '\t', '\r', '|'];
const DANGEROUS_PATTERNS = [
  /cmd/i,
  /powershell/i,
  /hyperlink/i,
  /dde/i,
  /exec/i,
  /mshta/i,
  /cscript/i,
  /wscript/i,
  /regsvr32/i,
];

export function sanitizeCellValue(val: any): { sanitized: any; wasSanitized: boolean; reason?: string } {
  if (typeof val !== 'string') {
    return { sanitized: val, wasSanitized: false };
  }

  const trimmed = val.trim();
  if (!trimmed) {
    return { sanitized: val, wasSanitized: false };
  }

  // Check prefix
  const firstChar = trimmed[0];
  const hasDangerousPrefix = DANGEROUS_PREFIXES.includes(firstChar);

  // Check for dangerous formulas like =HYPERLINK("http://evil.com"), =cmd|' /C calc'!A0
  let matchesPattern = false;
  let matchedName = '';
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      matchesPattern = true;
      matchedName = pattern.toString();
      break;
    }
  }

  if (hasDangerousPrefix || matchesPattern) {
    // Prepend single quote to neutralize formula execution in Excel/Spreadsheet apps
    // and strip control characters
    const cleaned = trimmed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
    const safeString = `'${cleaned}`;
    return {
      sanitized: safeString,
      wasSanitized: true,
      reason: matchesPattern ? `Pattern: ${matchedName}` : `Prefix: ${firstChar}`,
    };
  }

  return { sanitized: val, wasSanitized: false };
}

export function sanitizeRowData(rows: Record<string, any>[]): SanitizationResult<Record<string, any>> {
  let sanitizedCount = 0;
  const threatsDetected: string[] = [];

  const sanitizedRows = rows.map((row) => {
    const newRow: Record<string, any> = {};
    for (const [key, value] of Object.entries(row)) {
      const { sanitized, wasSanitized, reason } = sanitizeCellValue(value);
      newRow[key] = sanitized;
      if (wasSanitized) {
        sanitizedCount++;
        if (reason && !threatsDetected.includes(reason)) {
          threatsDetected.push(reason);
        }
      }
    }
    return newRow;
  });

  return {
    data: sanitizedRows,
    sanitizedCount,
    threatsDetected,
  };
}
