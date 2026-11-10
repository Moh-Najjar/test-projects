/**
 * Turns the stored old/new JSON into a list of field values that actually differ.
 * Reordering the same table cells is ignored. Label columns are used as row names.
 */

export type AuditChangeKind = 'simple' | 'selection' | 'cell';

export interface AuditValueChange {
  id: string;
  fieldKey: string;
  kind: AuditChangeKind;
  rowLabel: string | null;
  columnKey: string | null;
  before: string;
  after: string;
}

export interface AuditDiffResult {
  changes: AuditValueChange[];
  /** Changes beyond the render cap. The count still includes them. */
  hiddenCount: number;
  /** True when a non-empty payload could not be read as JSON. */
  unreadable: boolean;
}

const CHANGE_LIMIT = 400;

interface SnapshotCell {
  rowKey: string;
  columnKey: string;
  value: string;
  rowLabel: string;
}

interface FieldSnapshot {
  fieldKey: string;
  simple: string;
  multi: string;
  cells: Map<string, SnapshotCell>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const formatScalar = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
};

const isNumericText = (value: string): boolean => /^-?\d+(\.\d+)?$/.test(value);

const humanize = (key: string): string => key.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();

const cellId = (rowKey: string, columnKey: string): string => `${rowKey}::${columnKey}`;

const isFieldSnapshot = (value: Record<string, unknown>): boolean =>
  'SimpleValue' in value ||
  'RawTableValues' in value ||
  'RawTableCellValues' in value ||
  'MultiSelectValues' in value;

/** Reads `RawTableValues` rows. The first text column becomes the row label. */
const readRawTableValues = (value: unknown): Map<string, SnapshotCell> => {
  const cells = new Map<string, SnapshotCell>();
  if (!Array.isArray(value)) return cells;

  for (const row of value) {
    if (!isRecord(row) || !isRecord(row.Columns)) continue;
    const rowKey = typeof row.RowKey === 'string' ? row.RowKey : '';

    const entries: Array<{ columnKey: string; text: string }> = [];
    let rowLabel = '';
    for (const [columnKey, columnValue] of Object.entries(row.Columns)) {
      const text = formatScalar(columnValue);
      entries.push({ columnKey, text });
      if (rowLabel.length === 0 && text.length > 0 && !isNumericText(text)) {
        rowLabel = text;
      }
    }

    const label = rowLabel.length > 0 ? rowLabel : humanize(rowKey);
    for (const entry of entries) {
      cells.set(cellId(rowKey, entry.columnKey), {
        rowKey,
        columnKey: entry.columnKey,
        value: entry.text,
        rowLabel: label,
      });
    }
  }

  return cells;
};

/** Fallback when the payload only has the flat cell list. */
const readRawTableCells = (value: unknown): Map<string, SnapshotCell> => {
  const grouped = new Map<string, Array<{ columnKey: string; text: string }>>();
  if (!Array.isArray(value)) return new Map();

  for (const cell of value) {
    if (!isRecord(cell)) continue;
    const rowKey = typeof cell.RowKey === 'string' ? cell.RowKey : '';
    const columnKey = typeof cell.ColumnKey === 'string' ? cell.ColumnKey : '';
    const bucket = grouped.get(rowKey) ?? [];
    bucket.push({ columnKey, text: formatScalar(cell.Value) });
    grouped.set(rowKey, bucket);
  }

  const cells = new Map<string, SnapshotCell>();
  for (const [rowKey, entries] of grouped) {
    let rowLabel = '';
    for (const entry of entries) {
      if (rowLabel.length === 0 && entry.text.length > 0 && !isNumericText(entry.text)) {
        rowLabel = entry.text;
      }
    }
    const label = rowLabel.length > 0 ? rowLabel : humanize(rowKey);
    for (const entry of entries) {
      cells.set(cellId(rowKey, entry.columnKey), {
        rowKey,
        columnKey: entry.columnKey,
        value: entry.text,
        rowLabel: label,
      });
    }
  }

  return cells;
};

const readCells = (field: Record<string, unknown>): Map<string, SnapshotCell> => {
  const fromRows = readRawTableValues(field.RawTableValues);
  if (fromRows.size > 0) return fromRows;
  return readRawTableCells(field.RawTableCellValues);
};

const emptyField = (fieldKey: string): FieldSnapshot => ({
  fieldKey,
  simple: '',
  multi: '',
  cells: new Map(),
});

const buildField = (fieldKey: string, value: unknown): FieldSnapshot => {
  if (!isRecord(value)) {
    return { fieldKey, simple: formatScalar(value), multi: '', cells: new Map() };
  }

  const multi = Array.isArray(value.MultiSelectValues)
    ? value.MultiSelectValues
        .map((entry) => formatScalar(entry))
        .filter((entry) => entry.length > 0)
        .join(', ')
    : '';

  return {
    fieldKey,
    simple: formatScalar(value.SimpleValue),
    multi,
    cells: readCells(value),
  };
};

/** Parses JSON, including a second pass when the value was double-encoded. */
const parseJsonText = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    // Some payloads escape "&" as "\&", which is not valid JSON.
    return JSON.parse(raw.replace(/\\&/g, '&'));
  }
};

const parseStored = (raw: string | null): { ok: true; value: unknown } | { ok: false } => {
  if (raw === null || raw.trim().length === 0) return { ok: true, value: null };
  try {
    const once = parseJsonText(raw);
    if (typeof once === 'string') {
      try {
        return { ok: true, value: parseJsonText(once) };
      } catch {
        return { ok: true, value: once };
      }
    }
    return { ok: true, value: once };
  } catch {
    return { ok: false };
  }
};

const toFieldMap = (value: unknown): Record<string, FieldSnapshot> => {
  if (value === null || value === undefined) return {};

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return { value: buildField('value', { SimpleValue: value }) };
  }

  if (!isRecord(value)) return {};

  if (isFieldSnapshot(value)) {
    const key = typeof value.FieldKey === 'string' && value.FieldKey.length > 0 ? value.FieldKey : 'value';
    return { [key]: buildField(key, value) };
  }

  const map: Record<string, FieldSnapshot> = {};
  for (const [key, field] of Object.entries(value)) {
    map[key] = buildField(key, field);
  }
  return map;
};

const stableRowLabel = (before: SnapshotCell | undefined, after: SnapshotCell | undefined): string | null => {
  const beforeLabel = before?.rowLabel ?? '';
  const afterLabel = after?.rowLabel ?? '';
  if (beforeLabel.length > 0 && beforeLabel === afterLabel) return beforeLabel;
  if (beforeLabel.length > 0 && afterLabel.length === 0) return beforeLabel;
  if (afterLabel.length > 0 && beforeLabel.length === 0) return afterLabel;
  const rowKey = before?.rowKey ?? after?.rowKey ?? '';
  const human = humanize(rowKey);
  return human.length > 0 ? human : null;
};

export const diffAuditValues = (oldValue: string | null, newValue: string | null): AuditDiffResult => {
  const previous = parseStored(oldValue);
  const next = parseStored(newValue);
  const unreadable =
    (!previous.ok && oldValue !== null && oldValue.trim().length > 0) ||
    (!next.ok && newValue !== null && newValue.trim().length > 0);

  const beforeMap = previous.ok ? toFieldMap(previous.value) : {};
  const afterMap = next.ok ? toFieldMap(next.value) : {};
  const found: AuditValueChange[] = [];

  const fieldKeys = [...new Set([...Object.keys(beforeMap), ...Object.keys(afterMap)])].sort((a, b) =>
    a.localeCompare(b),
  );

  for (const fieldKey of fieldKeys) {
    const before = beforeMap[fieldKey] ?? emptyField(fieldKey);
    const after = afterMap[fieldKey] ?? emptyField(fieldKey);

    if (before.simple !== after.simple && (before.simple.length > 0 || after.simple.length > 0)) {
      found.push({
        id: `${fieldKey}::simple`,
        fieldKey,
        kind: 'simple',
        rowLabel: null,
        columnKey: null,
        before: before.simple,
        after: after.simple,
      });
    }

    if (before.multi !== after.multi && (before.multi.length > 0 || after.multi.length > 0)) {
      found.push({
        id: `${fieldKey}::selection`,
        fieldKey,
        kind: 'selection',
        rowLabel: null,
        columnKey: null,
        before: before.multi,
        after: after.multi,
      });
    }

    const ids = [...new Set([...before.cells.keys(), ...after.cells.keys()])].sort((a, b) => a.localeCompare(b));
    for (const id of ids) {
      const beforeCell = before.cells.get(id);
      const afterCell = after.cells.get(id);
      const beforeText = beforeCell?.value ?? '';
      const afterText = afterCell?.value ?? '';
      if (beforeText === afterText) continue;
      if (beforeText.length === 0 && afterText.length === 0) continue;

      found.push({
        id: `${fieldKey}::${id}`,
        fieldKey,
        kind: 'cell',
        rowLabel: stableRowLabel(beforeCell, afterCell),
        columnKey: beforeCell?.columnKey ?? afterCell?.columnKey ?? null,
        before: beforeText,
        after: afterText,
      });
    }
  }

  return {
    changes: found.slice(0, CHANGE_LIMIT),
    hiddenCount: Math.max(0, found.length - CHANGE_LIMIT),
    unreadable,
  };
};

/** Field keys present in either stored payload, used to identify the form. */
export const storedFieldKeys = (oldValue: string | null, newValue: string | null): string[] => {
  const previous = parseStored(oldValue);
  const next = parseStored(newValue);
  const beforeMap = previous.ok ? toFieldMap(previous.value) : {};
  const afterMap = next.ok ? toFieldMap(next.value) : {};
  return [...new Set([...Object.keys(beforeMap), ...Object.keys(afterMap)])];
};

/** Pretty JSON for the raw panels. Invalid JSON is shown unchanged. */
export const prettyStoredValue = (raw: string | null): string => {
  if (raw === null || raw.trim().length === 0) return '';
  try {
    const parsed: unknown = JSON.parse(raw);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return raw;
  }
};
