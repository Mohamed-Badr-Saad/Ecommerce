const spreadsheetFormula = /^[\u0009\u000a\u000d ]*[=+\-@]/;

export function csvCell(value: unknown) {
  const serialized = String(value ?? "");
  const safeValue = spreadsheetFormula.test(serialized) ? `'${serialized}` : serialized;
  return `"${safeValue.replaceAll('"', '""')}"`;
}
