interface BulkStockEntry {
  sku: string;
  date: string;
  quantity: number;
}

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
