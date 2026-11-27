import ExcelJS from "exceljs";

// Giá trị hiển thị của 1 ô. Ô công thức (file xuất từ Google Sheets có __xludf.DUMMYFUNCTION)
// thì lấy kết quả đã tính sẵn, không lấy công thức.
export function cellToValue(value) {
  if (value === undefined || value === null) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value !== "object") {
    return value;
  }
  if ("result" in value || "formula" in value || "sharedFormula" in value) {
    return cellToValue(value.result);
  }
  if (Array.isArray(value.richText)) {
    return value.richText.map((part) => part.text).join("");
  }
  if ("hyperlink" in value) {
    if (typeof value.text === "string" && value.text !== "") {
      return value.text;
    }
    return value.hyperlink;
  }
  if ("text" in value) {
    return cellToValue(value.text);
  }
  // Ô lỗi (#N/A, #REF!...) coi như trống
  return null;
}

// Đọc file .xlsx (Buffer) → { "tên sheet": [[ô, ô, ...], ...] }, dòng 0 = dòng 1 trong Excel.
// Bỏ các dòng trống ở cuối (file thường được định dạng sẵn tới dòng 1000).
export async function readXlsx(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheets = {};
  workbook.eachSheet((worksheet) => {
    const rows = [];
    let lastFilledRow = 0;

    for (let r = 1; r <= worksheet.rowCount; r++) {
      const row = worksheet.getRow(r);
      const cells = [];
      let filled = false;
      for (let c = 1; c <= worksheet.columnCount; c++) {
        const value = cellToValue(row.getCell(c).value);
        cells.push(value);
        if (value !== null && String(value).trim() !== "") {
          filled = true;
        }
      }
      rows.push(cells);
      if (filled) {
        lastFilledRow = r;
      }
    }

    sheets[worksheet.name] = rows.slice(0, lastFilledRow);
  });

  return sheets;
}
