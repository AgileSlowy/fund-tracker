import { createId } from "./storage";

const REQUIRED_HEADERS = ["date", "deposit", "withdraw", "note"];
const RATE_HEADERS = ["jiaDailyRate", "dailyRate"];

export function parseCSV(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = () => {
      const text = String(reader.result || "").replace(/^\uFEFF/, "");
      const rows = parseCSVText(text);
      const errors = [];
      const records = [];

      if (rows.length === 0 || rows.every((row) => row.every((cell) => cell.trim() === ""))) {
        resolve({ records: [], errors: ["CSV 文件为空。"] });
        return;
      }

      const headers = rows[0].map((cell) => cell.trim());
      const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
      const hasRateHeader = RATE_HEADERS.some((header) => headers.includes(header));

      if (missingHeaders.length > 0 || !hasRateHeader) {
        const missingText = [
          ...missingHeaders,
          ...(!hasRateHeader ? ["jiaDailyRate 或 dailyRate"] : [])
        ].join(", ");
        resolve({ records: [], errors: [`表头缺少字段：${missingText}。`] });
        return;
      }

      rows.slice(1).forEach((cells, index) => {
        if (cells.every((cell) => cell.trim() === "")) return;

        const row = Object.fromEntries(headers.map((header, headerIndex) => [header, cells[headerIndex] ?? ""]));
        const validation = validateCSVRow(row, index + 2);

        if (validation.error) {
          errors.push(validation.error);
        } else {
          records.push(validation.record);
        }
      });

      resolve({ records, errors });
    };

    reader.onerror = () => {
      resolve({ records: [], errors: ["读取 CSV 文件失败。"] });
    };

    reader.readAsText(file, "utf-8");
  });
}

export function validateCSVRow(row, rowIndex) {
  const rawDate = String(row.date || "").trim();
  const normalizedDate = normalizeDateString(rawDate);
  const hasJiaRate = row.jiaDailyRate !== undefined && String(row.jiaDailyRate).trim() !== "";
  const dailyRateText = String(hasJiaRate ? row.jiaDailyRate : row.dailyRate ?? "").trim();
  const depositText = String(row.deposit || "").trim();
  const withdrawText = String(row.withdraw || "").trim();
  const note = String(row.note || "").trim();

  if (!normalizedDate) {
    return { error: `第 ${rowIndex} 行：date 日期格式不正确，应为 YYYY-MM-DD 或 YYYY/M/D。` };
  }

  if (dailyRateText === "" || Number.isNaN(Number(dailyRateText))) {
    return { error: `第 ${rowIndex} 行：jiaDailyRate 必须是数字。` };
  }

  const deposit = depositText === "" ? 0 : Number(depositText);
  const withdraw = withdrawText === "" ? 0 : Number(withdrawText);

  if (Number.isNaN(deposit) || deposit < 0) {
    return { error: `第 ${rowIndex} 行：deposit 必须为非负数字。` };
  }

  if (Number.isNaN(withdraw) || withdraw < 0) {
    return { error: `第 ${rowIndex} 行：withdraw 必须为非负数字。` };
  }

  return {
    record: {
      id: createId(),
      date: normalizedDate,
      dailyRate: hasJiaRate ? getCalculatedRate(Number(dailyRateText)) / 100 : Number(dailyRateText) / 100,
      deposit,
      withdraw,
      note
    }
  };
}

export function recordsToCSV(records) {
  const headers = [
    "date",
    "dailyRatePercent",
    "deposit",
    "withdraw",
    "note",
    "dailyProfit",
    "currentAmount",
    "totalInvested",
    "cumulativeProfit",
    "cumulativeReturnPercent"
  ];

  const rows = records.map((record) => [
    record.date,
    round(record.dailyRate * 100, 3),
    round(record.deposit, 2),
    round(record.withdraw, 2),
    record.note || "",
    round(record.dailyProfit, 2),
    round(record.currentAmount, 2),
    round(record.totalInvested, 2),
    round(record.cumulativeProfit, 2),
    round(record.cumulativeReturn * 100, 4)
  ]);

  return [headers, ...rows].map((row) => row.map(escapeCSVCell).join(",")).join("\n");
}

export function downloadCSVTemplate() {
  const template = [
    "date,dailyRate,deposit,withdraw,note",
    "2026-05-21,1.00,100,0,首次买入",
    "2026-05-22,-0.50,0,0,市场下跌",
    "2026-05-23,0.80,100,0,继续定投"
  ].join("\n");

  downloadTextFile(template, "fund-records-template.csv");
}

export function downloadCSV(records) {
  downloadTextFile(recordsToCSV(records), `fund-records-${getTodayString()}.csv`);
}

function parseCSVText(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  rows.push(row);
  return rows;
}

function normalizeDateString(dateString) {
  const matched = dateString.match(/^(\d{4})([-/])(\d{1,2})\2(\d{1,2})$/);
  if (!matched) return "";

  const year = Number(matched[1]);
  const month = Number(matched[3]);
  const day = Number(matched[4]);
  const date = new Date(year, month - 1, day);
  const isValid = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;

  if (!isValid) return "";

  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0")
  ].join("-");
}

function escapeCSVCell(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function downloadTextFile(content, filename) {
  const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function round(value, precision = 2) {
  const factor = 10 ** precision;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function getCalculatedRate(inputRate) {
  return round(Number(inputRate || 0) / 2, 3);
}
