export interface ParsedImportRow {
  date: string;
  description: string;
  amount: number;
}

function parseCSVLines(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function isValidDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function parseDate(raw: string): string | null {
  const value = raw.trim();
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    if (!isValidDate(Number(year), Number(month), Number(day))) return null;
    return value;
  }
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    if (!isValidDate(Number(year), Number(month), Number(day))) return null;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return null;
}

function parseAmount(raw: string): number | null {
  const cleaned = raw
    .trim()
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(,|$))/g, "")
    .replace(",", ".");
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

export interface CSVImportResult {
  rows: ParsedImportRow[];
  errors: string[];
}

export function parseTransactionsCSV(text: string): CSVImportResult {
  const lines = parseCSVLines(text);
  if (lines.length === 0) {
    return { rows: [], errors: ["Arquivo vazio."] };
  }

  const headers = lines[0].map(normalizeHeader);
  const dateIdx = headers.findIndex((h) => h === "data" || h === "date");
  const descriptionIdx = headers.findIndex(
    (h) => h === "descricao" || h === "description" || h === "historico",
  );
  const amountIdx = headers.findIndex(
    (h) => h === "valor" || h === "amount" || h === "value",
  );

  if (dateIdx === -1 || descriptionIdx === -1 || amountIdx === -1) {
    return {
      rows: [],
      errors: [
        "O arquivo precisa ter colunas de Data, Descrição e Valor (nos cabeçalhos).",
      ],
    };
  }

  const rows: ParsedImportRow[] = [];
  const errors: string[] = [];

  lines.slice(1).forEach((cells, index) => {
    const lineNumber = index + 2;
    const date = parseDate(cells[dateIdx] ?? "");
    const description = (cells[descriptionIdx] ?? "").trim();
    const amount = parseAmount(cells[amountIdx] ?? "");

    if (!date) {
      errors.push(`Linha ${lineNumber}: data inválida.`);
      return;
    }
    if (!description) {
      errors.push(`Linha ${lineNumber}: descrição vazia.`);
      return;
    }
    if (amount === null) {
      errors.push(`Linha ${lineNumber}: valor inválido.`);
      return;
    }

    rows.push({ date, description, amount });
  });

  return { rows, errors };
}
