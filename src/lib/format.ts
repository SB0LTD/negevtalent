// Pure formatting helpers and CSV utilities. No React, no firebase imports.
// Both date helpers accept an ISO-8601 string ONLY; any Firestore Timestamp
// must be converted by the caller via ts?.toDate().toISOString() first.

// Shared non-gender missing-value fallback.
export const MISSING = "—";

const dateFormatter = new Intl.DateTimeFormat("he-IL", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dateTimeFormatter = new Intl.DateTimeFormat("he-IL", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateHe(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function formatDateTimeHe(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

export interface CsvColumn<Row> {
  key: keyof Row | string;
  header: string;
  // Optional cell accessor; when omitted the row[key] value is stringified.
  value?: (row: Row) => string;
}

function escapeCsvCell(raw: string): string {
  if (/[",\r\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function toCsv<Row>(rows: Row[], columns: CsvColumn<Row>[]): string {
  const headerLine = columns
    .map((col) => escapeCsvCell(col.header))
    .join(",");

  const dataLines = rows.map((row) =>
    columns
      .map((col) => {
        const cell = col.value
          ? col.value(row)
          : String((row as Record<string, unknown>)[col.key as string] ?? "");
        return escapeCsvCell(cell);
      })
      .join(","),
  );

  // Prefix with UTF-8 BOM so spreadsheet apps detect encoding (Hebrew safe).
  return "\uFEFF" + [headerLine, ...dataLines].join("\r\n");
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
