function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportToCSV(
  filename: string,
  headers: string[],
  rows: string[][],
  summaryRows?: string[][],
) {
  const allRows = [headers, ...rows];
  if (summaryRows && summaryRows.length > 0) {
    allRows.push([]);
    allRows.push(...summaryRows);
  }
  const lines = allRows.map((row) => row.map(csvEscape).join(","));
  const csvContent = "﻿" + lines.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename);
}

export async function exportToPDF(
  filename: string,
  title: string,
  headers: string[],
  rows: string[][],
  summaryLines?: string[],
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 16);

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 22,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [15, 110, 86] },
  });

  if (summaryLines && summaryLines.length > 0) {
    const { finalY } = (
      doc as unknown as { lastAutoTable: { finalY: number } }
    ).lastAutoTable;
    doc.setFontSize(10);
    summaryLines.forEach((line, index) => {
      doc.text(line, 14, finalY + 10 + index * 6);
    });
  }

  doc.save(filename);
}
