import { AggregationRow, RecapSummaryData } from '../supabase/types';

export interface AggregationOptions {
  groupByColumn: string;
  metricColumn: string;
  aggregation: 'sum' | 'average' | 'count' | 'min' | 'max';
  recapTitle?: string;
}

export function aggregateData(
  rows: Record<string, any>[],
  options: AggregationOptions,
  sanitizedCount: number = 0
): RecapSummaryData {
  const { groupByColumn, metricColumn, aggregation, recapTitle } = options;

  const groups: Record<string, number[]> = {};

  for (const row of rows) {
    const rawGroupVal = row[groupByColumn];
    const groupKey = rawGroupVal !== undefined && rawGroupVal !== null && String(rawGroupVal).trim() !== ''
      ? String(rawGroupVal).trim()
      : '(Lainnya / Kosong)';

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }

    const rawMetric = row[metricColumn];
    let numVal = 0;
    if (rawMetric !== undefined && rawMetric !== null && rawMetric !== '') {
      const cleaned = String(rawMetric).replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed)) {
        numVal = parsed;
      }
    }

    groups[groupKey].push(numVal);
  }

  let overallSum = 0;
  let allNumericValues: number[] = [];

  const aggregationRows: AggregationRow[] = Object.keys(groups).map((groupKey) => {
    const values = groups[groupKey];
    const count = values.length;
    const sum = values.reduce((acc, curr) => acc + curr, 0);
    const average = count > 0 ? Math.round((sum / count) * 100) / 100 : 0;
    const min = values.length > 0 ? Math.min(...values) : 0;
    const max = values.length > 0 ? Math.max(...values) : 0;

    overallSum += sum;
    allNumericValues = allNumericValues.concat(values);

    return {
      group: groupKey,
      count,
      sum,
      average,
      min,
      max,
    };
  });

  // Sort descending by selected metric or sum
  aggregationRows.sort((a, b) => {
    if (aggregation === 'count') return b.count - a.count;
    if (aggregation === 'average') return b.average - a.average;
    if (aggregation === 'min') return b.min - a.min;
    if (aggregation === 'max') return b.max - a.max;
    return b.sum - a.sum;
  });

  const totalRecords = rows.length;
  const overallAverage = allNumericValues.length > 0
    ? Math.round((overallSum / allNumericValues.length) * 100) / 100
    : 0;

  const firstRow = rows[0] || {};
  const columns = Object.keys(firstRow);

  return {
    recapTitle: recapTitle || `Rekap Otomatis: ${metricColumn} berdasarkan ${groupByColumn}`,
    groupByColumn,
    metricColumn,
    aggregation,
    totalRecords,
    overallSum,
    overallAverage,
    aggregations: aggregationRows,
    columns,
    sampleRows: rows.slice(0, 10),
    sanitizedFormulasCount: sanitizedCount,
  };
}
