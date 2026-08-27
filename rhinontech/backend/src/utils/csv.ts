/**
 * Minimal RFC-4180 CSV writer.
 *
 * A leading =, +, - or @ makes Excel and Sheets treat a cell as a formula, so
 * those are prefixed with an apostrophe. Without it, an imported lead whose
 * name begins "=" becomes an executable cell in someone's spreadsheet.
 */
function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) str = `'${str}`;
  if (/["\n\r,]/.test(str)) str = `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function toCsv(columns: { key: string; label: string }[], rows: Record<string, unknown>[]): string {
  const header = columns.map((c) => escapeCell(c.label)).join(",");
  const body = rows.map((row) => columns.map((c) => escapeCell(row[c.key])).join(",")).join("\n");
  // BOM so Excel opens UTF-8 (accented names, ₹) correctly instead of mojibake.
  return `﻿${header}\n${body}\n`;
}

export function csvFilename(prefix: string): string {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.csv`;
}
