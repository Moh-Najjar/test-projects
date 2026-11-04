/**

 * One-off generator: ASEZA weekly progress report as a Word (.docx) file.

 * Run: node scripts/generate-weekly-progress-report.mjs

 */

import fs from 'node:fs';

import path from 'node:path';

import { fileURLToPath } from 'node:url';

import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OUTPUT_PATH = path.join(
  __dirname,
  'ASEZA_Weekly_Progress_Report_Week_Jun9-14_2026.docx',
);

const COLORS = {
  primary: '1A6F8E',

  white: 'FFFFFF',

  lightGrey: 'F2F5F8',

  rowDivider: 'D8E4EC',

  labelGrey: '4A5568',

  black: '1A202C',
};

const CELL_BORDER = {
  style: BorderStyle.SINGLE,

  size: 1,

  color: COLORS.rowDivider,
};

const ALL_CELL_BORDER = {
  top: CELL_BORDER,

  bottom: CELL_BORDER,

  left: CELL_BORDER,

  right: CELL_BORDER,
};

/** @param {string} text */

const heading1 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,

    spacing: { before: 360, after: 200 },

    children: [new TextRun({ text, bold: true, size: 32, color: COLORS.primary })],
  });

/** @param {string} text */

const heading2 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,

    spacing: { before: 280, after: 160 },

    children: [new TextRun({ text, bold: true, size: 26, color: COLORS.black })],
  });

/** @param {string} text */

const body = (text) =>
  new Paragraph({
    spacing: { after: 120 },

    children: [new TextRun({ text, size: 22, color: COLORS.black })],
  });

/** @param {string} text */

const bullet = (text) =>
  new Paragraph({
    spacing: { after: 80 },

    bullet: { level: 0 },

    children: [new TextRun({ text, size: 22, color: COLORS.black })],
  });

/** @param {string[][]} rows @param {number[]} colWidthsPct */

const buildTable = (rows, colWidthsPct) => {
  const tableRows = rows.map((row, rowIdx) => {
    const isHeader = rowIdx === 0;

    const bgColor = isHeader ? COLORS.primary : rowIdx % 2 === 0 ? COLORS.white : COLORS.lightGrey;

    return new TableRow({
      children: row.map(
        (cellText, colIdx) =>
          new TableCell({
            width: { size: colWidthsPct[colIdx] ?? 25, type: WidthType.PERCENTAGE },

            shading: { fill: bgColor },

            borders: ALL_CELL_BORDER,

            children: [
              new Paragraph({
                spacing: { before: 80, after: 80 },

                children: [
                  new TextRun({
                    text: cellText,

                    bold: isHeader,

                    size: 20,

                    color: isHeader ? COLORS.white : COLORS.black,
                  }),
                ],
              }),
            ],
          }),
      ),
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },

    rows: tableRows,
  });
};

const spacer = () => new Paragraph({ spacing: { after: 160 }, children: [] });

const doc = new Document({
  sections: [
    {
      properties: {},

      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,

          spacing: { after: 240 },

          children: [
            new TextRun({
              text: 'ASEZA Project — Weekly Progress Report',

              bold: true,

              size: 36,

              color: COLORS.primary,
            }),
          ],
        }),

        body('Reporting Period: Week of 9–14 June 2026'),

        body('Prepared by: Muhammad'),

        body('Project: ASEZA KPI Data Submission Portal (Frontend)'),

        spacer(),

        heading1('1. Executive Summary'),

        body(
          'This week focused on completing the new request experience and supporting features. The submission flow now includes review before submit, stronger validation, new form controls, DOCX export, a bilingual user guide with interactive tour, dynamic request info, and dark theme support.',
        ),

        body('Overall frontend status: ~85–90% complete. Core journey is ready for UAT.'),

        spacer(),

        heading1('2. Completed This Week'),

        bullet(
          'New form controls — Added RAW_TABLE (fixed grid with row labels) and CALCULATED_FIELD (auto-calculated values). All 10 control types are now in use.',
        ),

        bullet(
          'User guide — Bilingual guide page covering login, home, requests, and new request. Interactive Joyride tour available from the navbar lightbulb icon.',
        ),

        bullet(
          'Review before submission — Final Review & Confirm step with read-only summary, edit per section, validation summary, and confirmation checkbox before submit.',
        ),

        bullet(
          'Dynamic Request Information — Sidebar now shows live form name, directorate, and reporting period from the signed-in user profile (AR/EN).',
        ),

        bullet(
          'New validation rules — Per-page validation on stepper navigation, full-form validation before review, and support for all control types including TABLE, RAW_TABLE, and CALCULATED_FIELD.',
        ),

        bullet(
          'Dark theme — Light/dark mode toggle with persisted preference. Theme tokens updated for surfaces, text, and components across the app.',
        ),

        bullet(
          'Export request — Export any submission to DOCX from My Requests, with AR/EN labels, RTL support, and RAW_TABLE handling.',
        ),

        bullet('Data mapping — Aligned submit, read, validation, and export mapping for complex field types.'),

        bullet(
          'Stepper improvements — Form values persist across steps; success dialog navigates to My Requests after submit.',
        ),

        bullet('Arabic typography — Cairo font family added for better Arabic text rendering.'),

        spacer(),

        heading1('3. Form Controls'),

        buildTable(
          [
            ['Control', 'Component', 'Status'],

            ['TEXT / NUMBER', 'InputField', 'Done'],

            ['PERCENTAGE', 'PercentageField', 'Done'],

            ['DATEPICKER', 'Date', 'Done'],

            ['DROPDOWN', 'DropDown', 'Done'],

            ['MULTISELECT', 'MultiSelect', 'Done'],

            ['TABLE', 'TableGrid', 'Done'],

            ['RAW_TABLE', 'RawTable', 'Done — new this week'],

            ['LABEL', 'Label', 'Done'],

            ['CALCULATED_FIELD', 'CalculatedField', 'Done — new this week'],
          ],

          [25, 30, 45],
        ),

        spacer(),

        heading1('4. Module Status'),

        buildTable(
          [
            ['Module', 'Status'],

            ['Login (Microsoft Entra ID SSO)', 'Done'],

            ['Home Dashboard', 'Done'],

            ['My Requests (list, detail, approve/reject)', 'Done'],

            ['New Request (multi-step form + review)', 'Done'],

            ['DOCX Export', 'Done'],

            ['User Guide + Interactive Tour', 'Done'],

            ['Dark Theme', 'Done'],

            ['Bilingual Support (AR/EN)', 'Ongoing polish'],
          ],

          [55, 45],
        ),

        spacer(),

        heading1('5. Plan for Next Week'),

        bullet('Full QA pass across all control types and both languages'),

        bullet('Stakeholder UAT on the end-to-end submission flow'),

        bullet('Fix any issues found during testing (navigation, export edge cases)'),

        bullet('Final copy review for AR/EN strings'),

        bullet('Production deployment preparation'),

        bullet(
          'Dark theme — Light/dark mode toggle with persisted preference. Theme tokens updated for surfaces, text, and components across the app.',
        ),

        bullet(
          'Export request — Export any submission to DOCX from My Requests, with AR/EN labels, RTL support, and RAW_TABLE handling.',
        ),

        bullet('Data mapping — Aligned submit, read, validation, and export mapping for complex field types.'),

        bullet(
          'Stepper improvements — Form values persist across steps; success dialog navigates to My Requests after submit.',
        ),

        bullet('Arabic typography — Cairo font family added for better Arabic text rendering.'),

        spacer(),

        heading1('6. Summary'),

        body(
          'Major frontend milestones for the submission portal are now complete. Users can fill dynamic forms with new controls, review data before submitting, export requests as DOCX, follow a guided tour, and switch between light and dark themes. Remaining work is mainly testing, polish, and release readiness.',
        ),

        spacer(),

        body('Prepared by: Muhammad'),

        body('Date: 14 June 2026'),
      ],
    },
  ],
});

const buffer = await Packer.toBuffer(doc);

fs.writeFileSync(OUTPUT_PATH, buffer);

console.log(`Created: ${OUTPUT_PATH}`);
