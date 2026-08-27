#!/usr/bin/env node
/**
 * Source of truth for humans: data/catalogs/*.xlsx
 * Source of truth for Playwright: data/generated/*.json
 *
 * First run (no xlsx): CSV in test-cases/ → formatted xlsx + json
 * Later runs: xlsx → json (CSV is ignored unless --from-csv)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
import { flagsFor } from './automation-flags.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const csvDir = path.join(root, 'test-cases');
const xlsxDir = path.join(root, 'data', 'catalogs');
const jsonDir = path.join(root, 'data', 'generated');
const fromCsv = process.argv.includes('--from-csv');

const STANDARD_EXTRA = ['priority', 'automated', 'tags', 'skipReason'];
const HEADER_FILL = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1F4E79' },
};

fs.mkdirSync(xlsxDir, { recursive: true });
fs.mkdirSync(jsonDir, { recursive: true });

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < src.length; i += 1) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || (c === '\r' && src[i + 1] === '\n')) {
      if (c === '\r') i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (c !== '\r') {
      cell += c;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((x) => String(x).trim()));
}

function rowsToObjects(rows) {
  const [header, ...body] = rows;
  return body.map((line) => {
    const obj = {};
    header.forEach((key, i) => {
      obj[key] = line[i] ?? '';
    });
    return obj;
  });
}

function enrichStandard(records) {
  return records.map((row) => {
    const flags = flagsFor(row.id);
    return {
      id: row.id,
      module: row.module || '',
      env: row.env || '',
      priority: row.priority || flags.priority,
      automated: row.automated || flags.automated,
      title: row.title || '',
      precondition: row.precondition || '',
      steps: row.steps || '',
      data: row.data || '',
      expected: row.expected || '',
      tags: row.tags || '',
      skipReason: row.skipReason || flags.skipReason,
    };
  });
}

function enrichGeneric(records) {
  return records.map((row) => {
    const flags = flagsFor(row.id);
    return {
      ...row,
      priority: row.priority || flags.priority,
      automated: row.automated || flags.automated,
      skipReason: row.skipReason || flags.skipReason,
      tags: row.tags || '',
    };
  });
}

async function writeXlsx(filePath, records) {
  const headers = Object.keys(records[0] || { id: '' });
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'manthan-e2e';
  const sheet = workbook.addWorksheet('Cases', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: true }],
  });

  const widths = {
    id: 20,
    module: 22,
    env: 10,
    priority: 10,
    automated: 12,
    title: 48,
    precondition: 42,
    steps: 52,
    data: 30,
    expected: 58,
    skipReason: 36,
    tags: 18,
    type: 12,
    save: 10,
    roleName: 22,
    description: 36,
    clicks: 28,
    expectedResult: 48,
  };

  sheet.columns = headers.map((key) => ({
    header: key,
    key,
    width: widths[key] || 24,
  }));

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri', size: 11 };
  headerRow.fill = HEADER_FILL;
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  headerRow.height = 22;

  for (const record of records) {
    const added = sheet.addRow(headers.map((h) => record[h] ?? ''));
    added.alignment = { vertical: 'top', wrapText: true };
    added.height = 48;
  }

  const autoCol = headers.indexOf('automated') + 1;
  if (autoCol > 0) {
    sheet.addConditionalFormatting({
      ref: `${colLetter(autoCol)}2:${colLetter(autoCol)}${records.length + 1}`,
      rules: [
        {
          type: 'containsText',
          operator: 'containsText',
          text: 'Yes',
          style: {
            fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFC6EFCE' } },
            font: { color: { argb: 'FF006100' } },
          },
        },
        {
          type: 'containsText',
          operator: 'containsText',
          text: 'No',
          style: {
            fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFD9D9D9' } },
            font: { color: { argb: 'FF666666' } },
          },
        },
      ],
    });
  }

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length },
  };

  await workbook.xlsx.writeFile(filePath);
}

function colLetter(n) {
  let s = '';
  let num = n;
  while (num > 0) {
    const m = (num - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    num = Math.floor((num - 1) / 26);
  }
  return s;
}

async function readXlsx(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.worksheets[0];
  const headers = [];
  sheet.getRow(1).eachCell((cell, col) => {
    headers[col] = String(cell.value ?? '').trim();
  });
  const records = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj = {};
    headers.forEach((key, col) => {
      if (!key) return;
      const value = row.getCell(col).value;
      obj[key] = value == null ? '' : String(value);
    });
    if (obj.id) records.push(obj);
  });
  return records;
}

function writeJson(filePath, records) {
  fs.writeFileSync(filePath, `${JSON.stringify(records, null, 2)}\n`);
}

const csvFiles = fs
  .readdirSync(csvDir)
  .filter((name) => name.endsWith('.csv'))
  .sort();

for (const csvName of csvFiles) {
  const stem = csvName.replace(/\.csv$/, '');
  const csvPath = path.join(csvDir, csvName);
  const xlsxPath = path.join(xlsxDir, `${stem}.xlsx`);
  const jsonPath = path.join(jsonDir, `${stem}.json`);
  const standard = stem !== 'rbac-create-role' && stem !== 'rbac-modules';

  let records;
  if (fs.existsSync(xlsxPath) && !fromCsv) {
    records = await readXlsx(xlsxPath);
    console.log(`xlsx → json  ${stem}  (${records.length} cases)`);
  } else {
    const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
    const raw = rowsToObjects(rows);
    records = standard ? enrichStandard(raw) : enrichGeneric(raw);
    await writeXlsx(xlsxPath, records);
    console.log(`csv → xlsx   ${stem}  (${records.length} cases)`);
  }

  writeJson(jsonPath, records);
}

console.log(`Wrote catalogs to ${xlsxDir}`);
console.log(`Wrote JSON to ${jsonDir}`);
