import { BulkStockEntry } from '@/types';

/**
 * Parse CSV content into BulkStockEntry array
 */
export const parseStockCSV = (content: string): BulkStockEntry[] => {
  const lines = content.trim().split('\n');
  const entries: BulkStockEntry[] = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const [sku, date, quantityStr] = line.split(',').map((s) => s.trim());
    const quantity = parseInt(quantityStr, 10);

    if (sku && date && !isNaN(quantity)) {
      entries.push({ sku, date, quantity });
    }
  }

  return entries;
};

/**
 * Pick and parse a CSV file for bulk stock upload
 * Note: Requires expo-document-picker and expo-file-system to be imported dynamically
 */
export const pickAndParseCSV = async (): Promise<BulkStockEntry[]> => {
  const DocumentPicker = await import('expo-document-picker');
  const FileSystem = await import('expo-file-system');

  const result = await DocumentPicker.getDocumentAsync({
    type: 'text/csv',
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) {
    throw new Error('File selection cancelled');
  }

  const file = result.assets[0];
  const content = await FileSystem.readAsStringAsync(file.uri);
  
  return parseStockCSV(content);
};

/**
 * Generate CSV template content
 */
export const generateCSVTemplate = (): string => {
  const today = new Date();
  const dates: string[] = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today.getTime());
    date.setDate(today.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }

  const header = 'sku,date,quantity';
  const rows = dates.map((dateStr: string) => `SKU-001,${dateStr},10`);

  return [header, ...rows].join('\n');
};

/**
 * Validate CSV entries
 */
export const validateCSVEntries = (
  entries: BulkStockEntry[]
): { valid: BulkStockEntry[]; errors: Array<{ index: number; error: string }> } => {
  const valid: BulkStockEntry[] = [];
  const errors: Array<{ index: number; error: string }> = [];

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  entries.forEach((entry, index) => {
    if (!entry.sku) {
      errors.push({ index, error: 'Missing SKU' });
      return;
    }

    if (!dateRegex.test(entry.date)) {
      errors.push({ index, error: 'Invalid date format (expected YYYY-MM-DD)' });
      return;
    }

    if (entry.quantity < 0) {
      errors.push({ index, error: 'Quantity must be non-negative' });
      return;
    }

    valid.push(entry);
  });

  return { valid, errors };
};
