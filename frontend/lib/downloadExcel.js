import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useGlobalAlert } from "@/stores/globalAlert";

/**
 * 범용 엑셀 다운로드 함수 (멀티 시트 지원)
 * @param {Object} options
 * @param {string} options.fileName
 * @param {Array} options.sheets - [{ name, headers?, data }]
 */
export const downloadExcel = ({ fileName, sheets = [] }) => {
  if (!Array.isArray(sheets)) return;

  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const today = `${yyyy}${mm}${dd}`;

  const workbook = XLSX.utils.book_new();

  sheets.forEach(({ name, headers, data }) => {
    if (!data || data.length === 0) return;

    const finalHeaders = headers || Object.keys(data[0]);
    const rows = [
      finalHeaders,
      ...data.map((row) => finalHeaders.map((h) => row[h])),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    for (const cell in worksheet) {
      if (cell[0] === "!") continue;
      const value = worksheet[cell].v;
      if (typeof value === "number") {
        worksheet[cell].z = "#,##0";
      } else {
        worksheet[cell].s = { alignment: { horizontal: "center" } };
      }
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, name);
  });

  // ✅ 실제 시트가 하나도 없는 경우 에러 방지
  if (workbook.SheetNames.length === 0) {
    useGlobalAlert.getState().showAlert("다운로드할 데이터가 없습니다.");
    return;
  }

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
    cellStyles: true,
  });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(blob, `${fileName}_${today}.xlsx`);
};
