import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { saveAs } from 'file-saver';

import type {
  GetSubmissionDetailsResponse,
  FieldValue,
  RawTableValueRow,
  TableColumn,
  TableValueRow,
} from '../../../core/types/getSubmissionDetailsResponse';
import type { GetDropdownListValuesResponse } from '../../../core/types/getDropdownListValuesResponse';

// ─── Control-key constants ────────────────────────────────────────────────────

const CONTROL_KEY_DROPDOWN = 'DROPDOWN';
const CONTROL_KEY_MULTISELECT = 'MULTISELECT';
const CONTROL_KEY_TABLE = 'TABLE';
const CONTROL_KEY_RAW_TABLE = 'RAW_TABLE';
const CONTROL_KEY_LABEL = 'LABEL';
const CONTROL_KEY_DATEPICKER = 'DATEPICKER';

/** Field row / info-line vertical spacing (twentieths of a point) */
const FIELD_ROW_SPACING = 180;
const INFO_LINE_SPACING = 120;
const SECTION_GAP_SPACING = 360;
const TABLE_BLOCK_GAP_SPACING = 320;

// ─── Colour palette (hex without #) ──────────────────────────────────────────

const COLORS = {
  primary: '1A6F8E',
  white: 'FFFFFF',
  lightGrey: 'F2F5F8',
  rowDivider: 'D8E4EC',
  labelGrey: '4A5568',
  black: '1A202C',
  refGrey: '718096',
} as const;

// ─── Border helpers ───────────────────────────────────────────────────────────

const NO_BORDER = { style: BorderStyle.NIL, size: 0, color: COLORS.white } as const;

const CELL_BORDER = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: COLORS.rowDivider,
} as const;

const ALL_NO_BORDER = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
} as const;

const ALL_CELL_BORDER = {
  top: CELL_BORDER,
  bottom: CELL_BORDER,
  left: CELL_BORDER,
  right: CELL_BORDER,
} as const;

// ─── RTL/LTR alignment helper ─────────────────────────────────────────────────

/** Returns START alignment (left in LTR, right in RTL) for body text. */
const startAlign = (isAr: boolean): (typeof AlignmentType)[keyof typeof AlignmentType] =>
  isAr ? AlignmentType.RIGHT : AlignmentType.LEFT;

/** Picks the English or Arabic string based on export locale. */
const locText = (enVal: string, arVal: string, isAr: boolean): string =>
  isAr ? arVal : enVal;

// ─── Helper: resolve a dropdown code → display label ─────────────────────────

const resolveDropdownLabel = (
  code: string,
  lookupTypeId: number | undefined,
  dropdownData: GetDropdownListValuesResponse,
  isAr: boolean,
): string => {
  if (lookupTypeId === undefined) return code;
  const options = dropdownData[String(lookupTypeId)] ?? [];
  const match = options.find((opt) => opt.code === code || String(opt.lookupValueId) === code);
  if (match === undefined) return code;
  return isAr ? match.nameAr : match.nameEn;
};

// ─── Helper: format a scalar/dropdown/multi field value as text ───────────────

/**
 * Turns an API scalar into text.
 * Numeric KPIs are JSON numbers and checkboxes are booleans, so `.trim()`
 * cannot be called on `value` directly.
 */
const readScalarText = (value: string | number | boolean | null): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '';
  }
  if (typeof value === 'boolean') return String(value);
  return '';
};

const resolveFieldDisplayValue = (
  fv: FieldValue,
  dropdownData: GetDropdownListValuesResponse,
  isAr: boolean,
): string => {
  const controlKey = fv.controlType.controlKey;
  const lookupTypeId = fv.lookupType?.lookupTypeId;
  const text = readScalarText(fv.value);

  if (controlKey === CONTROL_KEY_DROPDOWN) {
    if (text.trim() === '') return '—';
    return resolveDropdownLabel(text, lookupTypeId, dropdownData, isAr);
  }

  if (controlKey === CONTROL_KEY_MULTISELECT) {
    if (fv.multiSelectValues === null || fv.multiSelectValues.length === 0) return '—';
    return fv.multiSelectValues
      .map((code) => resolveDropdownLabel(code, lookupTypeId, dropdownData, isAr))
      .join('، ');
  }

  if (controlKey === CONTROL_KEY_DATEPICKER) {
    if (text.trim() === '') return '—';
    try {
      return new Date(text).toLocaleDateString(isAr ? 'ar' : 'en', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return text;
    }
  }

  if (text.trim() === '') return '—';
  return text;
};

// ─── Helper: "| Section Title" paragraph (teal, bidirectional-aware) ──────────

const buildSectionHeader = (text: string, isAr: boolean): Paragraph =>
  new Paragraph({
    spacing: { before: 360, after: 180 },
    bidirectional: isAr,
    children: [
      new TextRun({
        text: '| ',
        bold: true,
        color: COLORS.primary,
        size: 24,
        rightToLeft: isAr,
      }),
      new TextRun({
        text,
        bold: true,
        color: COLORS.primary,
        size: 24,
        rightToLeft: isAr,
      }),
    ],
  });

// ─── Helper: inline "Label: Value" row for submission info ────────────────────

const buildInfoLine = (label: string, value: string, isAr: boolean): Paragraph =>
  new Paragraph({
    spacing: { before: INFO_LINE_SPACING, after: INFO_LINE_SPACING },
    bidirectional: isAr,
    children: [
      new TextRun({ text: `${label}: `, bold: true, color: COLORS.labelGrey, size: 19, rightToLeft: isAr }),
      new TextRun({ text: value, color: COLORS.black, size: 19, rightToLeft: isAr }),
    ],
  });

// ─── Helper: single KPI field row (label cell | value cell) ──────────────────

const buildFieldRow = (label: string, value: string, isEvenRow: boolean, isAr: boolean): TableRow =>
  new TableRow({
    children: [
      // In RTL documents the label column visually appears on the right, value on the left
      new TableCell({
        width: { size: 78, type: WidthType.PERCENTAGE },
        shading: { fill: isEvenRow ? COLORS.lightGrey : COLORS.white },
        borders: ALL_CELL_BORDER,
        children: [
          new Paragraph({
            spacing: { before: FIELD_ROW_SPACING, after: FIELD_ROW_SPACING },
            bidirectional: isAr,
            alignment: startAlign(isAr),
            children: [
              new TextRun({ text: label, color: COLORS.black, size: 18, rightToLeft: isAr }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 22, type: WidthType.PERCENTAGE },
        shading: { fill: isEvenRow ? COLORS.lightGrey : COLORS.white },
        borders: ALL_CELL_BORDER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: FIELD_ROW_SPACING, after: FIELD_ROW_SPACING },
            bidirectional: isAr,
            children: [
              new TextRun({ text: value, bold: true, color: COLORS.primary, size: 18, rightToLeft: isAr }),
            ],
          }),
        ],
      }),
    ],
  });

// ─── Helper: KPI fields two-column bordered table with teal header ────────────

const buildFieldsTable = (rows: Array<[string, string]>, isAr: boolean): Table => {
  const headerRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 78, type: WidthType.PERCENTAGE },
        shading: { fill: COLORS.primary },
        borders: ALL_CELL_BORDER,
        children: [
          new Paragraph({
            spacing: { before: FIELD_ROW_SPACING, after: FIELD_ROW_SPACING },
            bidirectional: isAr,
            alignment: startAlign(isAr),
            children: [
              new TextRun({
                text: isAr ? 'المؤشر' : 'Indicator',
                bold: true,
                color: COLORS.white,
                size: 18,
                rightToLeft: isAr,
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 22, type: WidthType.PERCENTAGE },
        shading: { fill: COLORS.primary },
        borders: ALL_CELL_BORDER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: FIELD_ROW_SPACING, after: FIELD_ROW_SPACING },
            bidirectional: isAr,
            children: [
              new TextRun({
                text: isAr ? 'القيمة' : 'Value',
                bold: true,
                color: COLORS.white,
                size: 18,
                rightToLeft: isAr,
              }),
            ],
          }),
        ],
      }),
    ],
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    visuallyRightToLeft: isAr,
    borders: ALL_NO_BORDER,
    rows: [
      headerRow,
      ...rows.map(([label, value], idx) => buildFieldRow(label, value, idx % 2 === 0, isAr)),
    ],
  });
};

// ─── Helper: full-width teal "Table / Grid Data" banner ──────────────────────

const buildTableSectionBanner = (isAr: boolean): Paragraph =>
  new Paragraph({
    spacing: { before: 280, after: 0 },
    bidirectional: isAr,
    alignment: startAlign(isAr),
    shading: { fill: COLORS.primary, type: 'clear', color: 'auto' },
    children: [
      new TextRun({
        text: isAr ? 'بيانات الجدول / الشبكة' : 'Table / Grid Data',
        bold: true,
        color: COLORS.white,
        size: 20,
        rightToLeft: isAr,
      }),
    ],
  });

// ─── Helper: build a styled data table for a TABLE-type field ────────────────

const buildTableControl = (
  fv: FieldValue,
  dropdownData: GetDropdownListValuesResponse,
  isAr: boolean,
): Table | null => {
  if (fv.columns === null || fv.tableValues === null || fv.tableValues.length === 0) return null;

  const colDefs = fv.columns;
  const colWidthPct = Math.floor(100 / colDefs.length);

  const headerRow = new TableRow({
    children: colDefs.map((col) =>
      new TableCell({
        width: { size: colWidthPct, type: WidthType.PERCENTAGE },
        shading: { fill: COLORS.primary },
        borders: ALL_CELL_BORDER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: FIELD_ROW_SPACING, after: FIELD_ROW_SPACING },
            bidirectional: isAr,
            children: [
              new TextRun({
                text: locText(col.labelEn, col.labelAr, isAr),
                bold: true,
                color: COLORS.white,
                size: 18,
                rightToLeft: isAr,
              }),
            ],
          }),
        ],
      })
    ),
  });

  const dataRows = fv.tableValues.map((row: TableValueRow, rowIdx: number) => {
    const bgColor = rowIdx % 2 === 0 ? COLORS.white : COLORS.lightGrey;

    const cells = colDefs.map((col) => {
      const rawValue = row.columns[col.columnKey];
      let cellText = rawValue !== undefined ? String(rawValue) : '—';

      if (col.controlType.controlKey === CONTROL_KEY_DROPDOWN && col.lookupType !== null) {
        cellText = resolveDropdownLabel(cellText, col.lookupType.lookupTypeId, dropdownData, isAr);
      }

      return new TableCell({
        width: { size: colWidthPct, type: WidthType.PERCENTAGE },
        shading: { fill: bgColor },
        borders: ALL_CELL_BORDER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: FIELD_ROW_SPACING, after: FIELD_ROW_SPACING },
            bidirectional: isAr,
            children: [
              new TextRun({ text: cellText, size: 18, color: COLORS.black, rightToLeft: isAr }),
            ],
          }),
        ],
      });
    });

    return new TableRow({ children: cells });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    visuallyRightToLeft: isAr,
    rows: [headerRow, ...dataRows],
  });
};

// ─── RAW_TABLE helpers (mirrors RawTable.tsx / fieldValueToFormField.ts) ─────

/** True when the RAW_TABLE uses a dedicated LABEL column for row text */
const hasLabelColumn = (columns: TableColumn[]): boolean =>
  columns.some((col) => col.controlType.controlKey === CONTROL_KEY_LABEL);

/**
 * Resolves the optional row-label column header for RAW_TABLE fields that do
 * not include a dedicated LABEL column (e.g. DESCRIPTION).
 */
const resolveRawTableRowLabelHeaders = (
  columns: TableColumn[],
): { rowLabelEn: string; rowLabelAr: string } | null => {
  if (hasLabelColumn(columns)) return null;
  return { rowLabelEn: 'Description', rowLabelAr: 'الوصف' };
};

/** Resolves bilingual display text for a LABEL grid cell */
const resolveLabelCellText = (
  rowLabelEn: string,
  rowLabelAr: string,
  columnValue: string | number | undefined,
  isAr: boolean,
): string => {
  const fallback = columnValue !== undefined ? String(columnValue) : '—';
  const en = rowLabelEn.trim() !== '' ? rowLabelEn : fallback;
  const ar = rowLabelAr.trim() !== '' ? rowLabelAr : fallback;
  return locText(en, ar, isAr);
};

/** Resolves a single RAW_TABLE cell value with locale-aware labels and control types */
const resolveRawTableCellText = (
  col: TableColumn,
  row: RawTableValueRow,
  dropdownData: GetDropdownListValuesResponse,
  isAr: boolean,
): string => {
  const rawValue = row.columns[col.columnKey];

  if (col.controlType.controlKey === CONTROL_KEY_LABEL) {
    return resolveLabelCellText(row.rowLabelEn, row.rowLabelAr, rawValue, isAr);
  }

  if (rawValue === undefined || String(rawValue).trim() === '') return '—';
  const strValue = String(rawValue);

  if (col.controlType.controlKey === CONTROL_KEY_DROPDOWN && col.lookupType !== null) {
    return resolveDropdownLabel(strValue, col.lookupType.lookupTypeId, dropdownData, isAr);
  }

  if (col.controlType.controlKey === CONTROL_KEY_DATEPICKER) {
    try {
      return new Date(strValue).toLocaleDateString(isAr ? 'ar' : 'en', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return strValue;
    }
  }

  return strValue;
};

const buildRawTableHeaderCell = (
  label: string,
  colWidthPct: number,
  isAr: boolean,
): TableCell =>
  new TableCell({
    width: { size: colWidthPct, type: WidthType.PERCENTAGE },
    shading: { fill: COLORS.primary },
    borders: ALL_CELL_BORDER,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: FIELD_ROW_SPACING, after: FIELD_ROW_SPACING },
        bidirectional: isAr,
        children: [
          new TextRun({
            text: label,
            bold: true,
            color: COLORS.white,
            size: 18,
            rightToLeft: isAr,
          }),
        ],
      }),
    ],
  });

const buildRawTableDataCell = (
  cellText: string,
  colWidthPct: number,
  bgColor: string,
  isAr: boolean,
): TableCell =>
  new TableCell({
    width: { size: colWidthPct, type: WidthType.PERCENTAGE },
    shading: { fill: bgColor },
    borders: ALL_CELL_BORDER,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: FIELD_ROW_SPACING, after: FIELD_ROW_SPACING },
        bidirectional: isAr,
        children: [
          new TextRun({ text: cellText, size: 18, color: COLORS.black, rightToLeft: isAr }),
        ],
      }),
    ],
  });

// ─── Helper: build a styled data table for a RAW_TABLE-type field ────────────

const buildRawTableControl = (
  fv: FieldValue,
  dropdownData: GetDropdownListValuesResponse,
  isAr: boolean,
): Table | null => {
  if (fv.columns === null || fv.rawTableValues === null || fv.rawTableValues.length === 0) return null;

  const colDefs = fv.columns;
  const rowLabelHeaders = resolveRawTableRowLabelHeaders(colDefs);
  const hasRowLabelColumn = rowLabelHeaders !== null;
  const totalColumns = colDefs.length + (hasRowLabelColumn ? 1 : 0);
  const colWidthPct = Math.floor(100 / totalColumns);

  const headerCells: TableCell[] = [];

  if (hasRowLabelColumn && rowLabelHeaders !== null) {
    headerCells.push(
      buildRawTableHeaderCell(
        locText(rowLabelHeaders.rowLabelEn, rowLabelHeaders.rowLabelAr, isAr),
        colWidthPct,
        isAr,
      ),
    );
  }

  headerCells.push(
    ...colDefs.map((col) =>
      buildRawTableHeaderCell(locText(col.labelEn, col.labelAr, isAr), colWidthPct, isAr),
    ),
  );

  const headerRow = new TableRow({ children: headerCells });

  const dataRows = fv.rawTableValues.map((row, rowIdx) => {
    const bgColor = rowIdx % 2 === 0 ? COLORS.white : COLORS.lightGrey;
    const cells: TableCell[] = [];

    if (hasRowLabelColumn) {
      const rowLabelText = locText(row.rowLabelEn, row.rowLabelAr, isAr);
      cells.push(
        buildRawTableDataCell(
          rowLabelText.trim() !== '' ? rowLabelText : '—',
          colWidthPct,
          bgColor,
          isAr,
        ),
      );
    }

    cells.push(
      ...colDefs.map((col) =>
        buildRawTableDataCell(
          resolveRawTableCellText(col, row, dropdownData, isAr),
          colWidthPct,
          bgColor,
          isAr,
        ),
      ),
    );

    return new TableRow({ children: cells });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    visuallyRightToLeft: isAr,
    rows: [headerRow, ...dataRows],
  });
};

// ─── Main export function ─────────────────────────────────────────────────────

/**
 * Generates and triggers a DOCX download for a single KPI submission.
 * Fully supports RTL layout when `isAr` is true: paragraph bidirectional,
 * TextRun rightToLeft, and Table visuallyRightToLeft are all applied.
 */
export const exportSubmissionToDocx = async (
  detail: GetSubmissionDetailsResponse,
  dropdownData: GetDropdownListValuesResponse,
  isAr: boolean,
  locale: string,
): Promise<void> => {
  // ── Date format helper ───────────────────────────────────────────────────

  const formatDate = (iso: string | null): string => {
    if (iso === null) return '—';
    try {
      return new Date(iso).toLocaleDateString(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return iso;
    }
  };

  const periodLabel = new Date(detail.reportingDate).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });

  // ── Title block ──────────────────────────────────────────────────────────

  const titleParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 80 },
    bidirectional: isAr,
    children: [
      new TextRun({
        text: isAr ? detail.formNameAr : detail.formNameEn,
        bold: true,
        color: COLORS.primary,
        size: 44,
        rightToLeft: isAr,
      }),
    ],
  });

  const refParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 360 },
    bidirectional: isAr,
    children: [
      new TextRun({
        text: detail.referenceNumber,
        color: COLORS.refGrey,
        size: 20,
        italics: true,
      }),
    ],
  });

  // ── Submission Information section ───────────────────────────────────────

  const metaHeader = buildSectionHeader(
    isAr ? 'معلومات التقديم' : 'Submission Information',
    isAr,
  );

  const approvalLines: Paragraph[] =
    detail.approvedByUserName !== null
      ? [
          buildInfoLine(isAr ? 'اعتمد بواسطة' : 'Approved By', detail.approvedByUserName, isAr),
          buildInfoLine(isAr ? 'تاريخ الاعتماد' : 'Approved At', formatDate(detail.approvedAt), isAr),
        ]
      : [];

  const rejectionLine: Paragraph[] =
    detail.rejectionReason !== null && detail.rejectionReason.length > 0
      ? [buildInfoLine(isAr ? 'سبب الرفض' : 'Rejection Reason', detail.rejectionReason, isAr)]
      : [];

  const notesLine: Paragraph[] =
    detail.notes !== null && detail.notes.length > 0
      ? [buildInfoLine(isAr ? 'ملاحظات' : 'Notes', detail.notes, isAr)]
      : [];

  const metaLines: Paragraph[] = [
    buildInfoLine(isAr ? 'رقم المرجع' : 'Reference Number', detail.referenceNumber, isAr),
    buildInfoLine(isAr ? 'الحالة' : 'Status', detail.submissionStatus, isAr),
    buildInfoLine(isAr ? 'نموذج المؤشرات' : 'KPI Form', isAr ? detail.formNameAr : detail.formNameEn, isAr),
    buildInfoLine(isAr ? 'المديرية' : 'Directorate', isAr ? detail.directorateNameAr : detail.directorateNameEn, isAr),
    buildInfoLine(isAr ? 'الفترة' : 'Period', periodLabel, isAr),
    buildInfoLine(isAr ? 'أدخل بواسطة' : 'Submitted By', detail.enteredByUserName, isAr),
    buildInfoLine(isAr ? 'تاريخ الإنشاء' : 'Created At', formatDate(detail.createdAt), isAr),
    buildInfoLine(isAr ? 'تاريخ التقديم' : 'Submitted At', formatDate(detail.submittedAt), isAr),
    ...approvalLines,
    ...rejectionLine,
    ...notesLine,
  ];

  const spacerAfterMeta = new Paragraph({ spacing: { after: SECTION_GAP_SPACING }, children: [] });

  // ── KPI Field Values section ─────────────────────────────────────────────

  const fieldsHeader = buildSectionHeader(
    isAr ? 'قيم المؤشرات' : 'KPI Field Values',
    isAr,
  );

  const visibleFields = detail.fieldValues.filter((fv) => fv.isVisible);

  // Scalar fields → two-column bordered table
  const scalarRows: Array<[string, string]> = [];
  // TABLE-type fields rendered separately below
  const tableFields: FieldValue[] = [];

  for (const fv of visibleFields) {
    if (
      fv.controlType.controlKey === CONTROL_KEY_TABLE ||
      fv.controlType.controlKey === CONTROL_KEY_RAW_TABLE
    ) {
      tableFields.push(fv);
    } else {
      const label = isAr ? fv.labelAr : fv.labelEn;
      const value = resolveFieldDisplayValue(fv, dropdownData, isAr);
      scalarRows.push([label, value]);
    }
  }

  const scalarFieldsBlock: Array<Paragraph | Table> = scalarRows.length > 0
    ? [buildFieldsTable(scalarRows, isAr)]
    : [];

  // TABLE blocks — each with its own "Table / Grid Data" teal banner
  const tableBlocks: Array<Paragraph | Table> = [];
  for (const fv of tableFields) {
    const label = isAr ? fv.labelAr : fv.labelEn;
    const tableBlock =
      fv.controlType.controlKey === CONTROL_KEY_RAW_TABLE
        ? buildRawTableControl(fv, dropdownData, isAr)
        : buildTableControl(fv, dropdownData, isAr);

    tableBlocks.push(buildTableSectionBanner(isAr));

    tableBlocks.push(
      new Paragraph({
        spacing: { before: FIELD_ROW_SPACING, after: FIELD_ROW_SPACING },
        bidirectional: isAr,
        alignment: startAlign(isAr),
        children: [
          new TextRun({ text: label, color: COLORS.labelGrey, size: 18, rightToLeft: isAr }),
        ],
      })
    );

    if (tableBlock !== null) {
      tableBlocks.push(tableBlock);
    } else {
      tableBlocks.push(
        new Paragraph({
          spacing: { after: FIELD_ROW_SPACING },
          bidirectional: isAr,
          children: [new TextRun({ text: '—', color: COLORS.refGrey, size: 18, rightToLeft: isAr })],
        })
      );
    }

    tableBlocks.push(new Paragraph({ spacing: { after: TABLE_BLOCK_GAP_SPACING }, children: [] }));
  }

  // ── Footer ───────────────────────────────────────────────────────────────

  const footerParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 480 },
    bidirectional: isAr,
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.rowDivider } },
    children: [
      new TextRun({
        text: isAr
          ? `تم التصدير بتاريخ: ${new Date().toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' })}`
          : `Exported on ${new Date().toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        color: COLORS.refGrey,
        size: 16,
        rightToLeft: isAr,
      }),
    ],
  });

  // ── Assemble document ────────────────────────────────────────────────────

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          titleParagraph,
          refParagraph,
          metaHeader,
          ...metaLines,
          spacerAfterMeta,
          fieldsHeader,
          ...scalarFieldsBlock,
          ...tableBlocks,
          footerParagraph,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `ASEZA-${detail.referenceNumber}.docx`);
};
