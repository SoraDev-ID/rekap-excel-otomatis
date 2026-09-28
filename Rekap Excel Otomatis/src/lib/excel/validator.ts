export interface ValidationResult {
  isValid: boolean;
  detectedType: string;
  error?: string;
}

export function validateExcelFile(buffer: Buffer, declaredMimeType: string, fileName: string): ValidationResult {
  // Max size: 10MB
  const MAX_SIZE = 10 * 1024 * 1024;
  if (buffer.length > MAX_SIZE) {
    return {
      isValid: false,
      detectedType: 'unknown',
      error: 'Ukuran file melebihi batas maksimal 10MB.',
    };
  }

  if (buffer.length < 4) {
    return {
      isValid: false,
      detectedType: 'corrupt',
      error: 'File terlalu kecil atau rusak.',
    };
  }

  // Check Magic Bytes
  // XLSX / DOCX / PPTX (ZIP): 50 4B 03 04 (PK\x03\x04)
  const isZip = buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
  // XLS (Compound Document Binary File): D0 CF 11 E0 A1 B1 1A E1
  const isOled = buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0;

  const ext = fileName.toLowerCase().split('.').pop() || '';

  if (isZip) {
    if (ext === 'xlsx' || declaredMimeType.includes('openxmlformats') || declaredMimeType.includes('spreadsheetml')) {
      return {
        isValid: true,
        detectedType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }
  }

  if (isOled) {
    if (ext === 'xls' || declaredMimeType.includes('ms-excel')) {
      return {
        isValid: true,
        detectedType: 'application/vnd.ms-excel',
      };
    }
  }

  // Check if CSV: Text without null bytes (binary controls)
  if (ext === 'csv' || declaredMimeType.includes('csv') || declaredMimeType.includes('text/plain')) {
    let hasNullByte = false;
    const checkLength = Math.min(buffer.length, 1024);
    for (let i = 0; i < checkLength; i++) {
      if (buffer[i] === 0x00) {
        hasNullByte = true;
        break;
      }
    }
    if (!hasNullByte) {
      return {
        isValid: true,
        detectedType: 'text/csv',
      };
    }
  }

  return {
    isValid: false,
    detectedType: 'disallowed',
    error: 'Tipe file tidak valid. Hanya file Excel (.xlsx, .xls) atau CSV resmi yang diizinkan.',
  };
}
