// Pure-helper unit tests written as Playwright test() blocks with NO page
// (there is no vitest/jest in this repo). These import the pure helpers
// directly from src/lib and assert their behaviour. This spec is intentionally
// outside the tsc project set (tsconfig.app.json includes only ./src), so it is
// never type-checked by `tsc -b`; Playwright compiles it with its own esbuild.

import { test, expect } from "@playwright/test";
import {
  canManageAdmins,
  canEditApplications,
  canExport,
} from "../src/lib/roles";
import {
  genderLabelHe,
  STATUS_LABEL_HE,
} from "../src/lib/applications";
import { toCsv, formatDateHe } from "../src/lib/format";
import type { CsvColumn } from "../src/lib/format";

test.describe("roles.ts predicates", () => {
  test("canManageAdmins is superadmin-only", () => {
    expect(canManageAdmins("superadmin")).toBe(true);
    expect(canManageAdmins("admin")).toBe(false);
    expect(canManageAdmins("viewer")).toBe(false);
  });

  test("canEditApplications allows admin + superadmin", () => {
    expect(canEditApplications("superadmin")).toBe(true);
    expect(canEditApplications("admin")).toBe(true);
    expect(canEditApplications("viewer")).toBe(false);
  });

  test("canExport allows every role (viewer and up)", () => {
    expect(canExport("superadmin")).toBe(true);
    expect(canExport("admin")).toBe(true);
    expect(canExport("viewer")).toBe(true);
  });
});

test.describe("genderLabelHe (CRM code mapping)", () => {
  test("maps known codes", () => {
    expect(genderLabelHe("7")).toBe("זכר");
    expect(genderLabelHe("0")).toBe("נקבה");
    expect(genderLabelHe("1")).toBe("אחר");
  });

  test("falls back to לא צוין for undefined/empty/unknown", () => {
    expect(genderLabelHe(undefined)).toBe("לא צוין");
    expect(genderLabelHe("")).toBe("לא צוין");
    expect(genderLabelHe("99")).toBe("לא צוין");
  });
});

test.describe("status label map", () => {
  test("has the locked Hebrew values", () => {
    expect(STATUS_LABEL_HE.new).toBe("חדש");
    expect(STATUS_LABEL_HE.contacted).toBe("נוצר קשר");
    expect(STATUS_LABEL_HE.interview).toBe("ראיון");
    expect(STATUS_LABEL_HE.accepted).toBe("התקבל");
    expect(STATUS_LABEL_HE.rejected).toBe("נדחה");
  });
});

test.describe("toCsv", () => {
  interface Row {
    a: string;
    b: string;
  }
  const columns: CsvColumn<Row>[] = [
    { key: "a", header: "A" },
    { key: "b", header: "B" },
  ];

  test("output starts with the UTF-8 BOM", () => {
    const csv = toCsv<Row>([{ a: "x", b: "y" }], columns);
    expect(csv.startsWith("\uFEFF")).toBe(true);
  });

  test("escapes cells containing comma, quote, or newline", () => {
    const rows: Row[] = [
      { a: "has,comma", b: 'has"quote' },
      { a: "has\nnewline", b: "plain" },
    ];
    const csv = toCsv<Row>(rows, columns);
    const lines = csv.slice("\uFEFF".length).split("\r\n");
    // Header + 2 data rows (the embedded newline must be inside a quoted cell,
    // so it does NOT create an extra CSV line).
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe("A,B");
    // Comma-containing cell is quoted; embedded quote is doubled.
    expect(lines[1]).toBe('"has,comma","has""quote"');
    // Newline-containing cell is quoted (and the literal \n is preserved).
    expect(lines[2]).toBe('"has\nnewline",plain');
  });
});

test.describe("formatDateHe", () => {
  test("returns a he-IL formatted string for a known ISO input", () => {
    const out = formatDateHe("2026-10-20T07:45:00.000Z");
    // he-IL short date uses DD.MM.YYYY separators; assert structure, not the
    // exact day (which depends on the runner's timezone).
    expect(out).toMatch(/^\d{1,2}\.\d{1,2}\.\d{4}$/);
    expect(out).toContain("2026");
  });
});
