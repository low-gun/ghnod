import React from "react";

export default function ExcelDownloadButton({
  fileName,
  sheetName,
  headers,
  data,
  extraSheets = [], // ✅ 추가
}) {
  const handleDownload = async () => {
    const { downloadExcel } = await import("@/lib/downloadExcel");

    // ✅ 메인 시트
    const mainSheet = {
      name: sheetName,
      headers,
      data,
    };

    // ✅ 추가 시트들 처리
    const extra = await Promise.all(
      extraSheets.map(async (sheet) => {
        const result = await sheet.fetch();
        return {
          name: sheet.name,
          data: result,
        };
      })
    );

    downloadExcel({ fileName, sheets: [mainSheet, ...extra] });
  };

  return (
    <button
      onClick={handleDownload}
      style={{
        padding: "8px 12px",
        backgroundColor: "#217346", // 엑셀 초록색
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
      }}
    >
      Excel
    </button>
  );
}
