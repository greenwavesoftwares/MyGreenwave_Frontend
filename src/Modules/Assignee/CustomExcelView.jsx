import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";

import "./CustomViews.css";

/**
 * Renders .xlsx/.xls/.csv as an HTML table with sheet tabs.
 *
 * Why custom: react-doc-viewer's built-in spreadsheet support proxies
 * through a Microsoft Office Online iframe, which needs a publicly
 * reachable URL — it cannot render a local data: URI at all. Parsing
 * with SheetJS (xlsx) client-side is the only way to view a locally
 * picked spreadsheet without a backend.
 */
const CustomExcelView = ({ mainState: { currentDocument } }) => {
  const [sheets, setSheets] = useState([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentDocument) return;

    try {
      // fileData is "data:<mime>;base64,<data>" — XLSX.read wants just the base64 part.
      const base64 = currentDocument.fileData.split(",")[1];
      const workbook = XLSX.read(base64, { type: "base64" });

      const parsed = workbook.SheetNames.map((name) => ({
        name,
        rows: XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1 }),
      }));

      setSheets(parsed);
      setActiveSheet(0);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to parse spreadsheet");
    }
  }, [currentDocument]);

  if (!currentDocument) return null;
  if (error) return <p className="doc-excel-error">{error}</p>;
  if (sheets.length === 0) return null;

  const rows = sheets[activeSheet]?.rows || [];

  return (
    <div id="my-excel-renderer" className="doc-excel-renderer">
      {sheets.length > 1 && (
        <div className="doc-excel-tabs">
          {sheets.map((sheet, i) => (
            <button
              key={sheet.name}
              onClick={() => setActiveSheet(i)}
              className={`doc-excel-tab${i === activeSheet ? " active" : ""}`}
            >
              {sheet.name}
            </button>
          ))}
        </div>
      )}

      <table className="doc-excel-table">
        <tbody>
          {rows.map((row, rIdx) => (
            <tr key={rIdx}>
              {row.map((cell, cIdx) => (
                <td key={cIdx}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

CustomExcelView.fileTypes = [
  "xlsx",
  "xls",
  "csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];
CustomExcelView.weight = 1;

export default CustomExcelView;
