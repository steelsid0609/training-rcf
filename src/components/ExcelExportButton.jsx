// src/components/ExcelExportButton.jsx
import React, { useState } from "react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/**
 * Generic button that downloads data to Excel.
 *
 * Props:
 *  - getData: async () => Array<object> | object[]
 *      Function that returns ALL records you want to export.
 *  - filenamePrefix: string
 *      Prefix for the excel file name, e.g. "applications".
 *  - label?: string
 *      Button text (default: "Export to Excel").
 *  - style?: object
 *      Inline style for the button (you can pass your applyBtn style).
 */
export default function ExcelExportButton({
  getData,
  filenamePrefix = "export",
  label = "Export to Excel",
  style = {},
}) {
  const [exporting, setExporting] = useState(false);

  function formatDate(raw) {
    if (!raw) return "";
    try {
      if (raw?.toDate && typeof raw.toDate === "function") {
        return raw.toDate().toLocaleString();
      }
      const d = raw instanceof Date ? raw : new Date(raw);
      if (isNaN(d.getTime())) return String(raw);
      return d.toLocaleString();
    } catch {
      return String(raw);
    }
  }

  // Flatten an object for Excel (handles nested objects & timestamps)
  function flattenForExport(obj) {
    const out = {};

    function recurse(prefix, val) {
      if (val == null) {
        out[prefix] = "";
        return;
      }
      if (val?.toDate && typeof val.toDate === "function") {
        out[prefix] = formatDate(val);
        return;
      }
      if (val instanceof Date) {
        out[prefix] = val.toLocaleString();
        return;
      }
      if (typeof val === "object" && !Array.isArray(val)) {
        Object.keys(val).forEach((k) => {
          const key = prefix ? `${prefix}.${k}` : k;
          recurse(key, val[k]);
        });
        return;
      }
      if (Array.isArray(val)) {
        out[prefix] = val
          .map((it) => {
            if (it == null) return "";
            if (it?.toDate && typeof it.toDate === "function")
              return formatDate(it);
            if (typeof it === "object") return JSON.stringify(it);
            return String(it);
          })
          .join(", ");
        return;
      }
      out[prefix] = val;
    }

    if (typeof obj !== "object" || obj === null) return { value: obj };

    Object.keys(obj).forEach((k) => recurse(k, obj[k]));
    return out;
  }

  async function handleExport() {
    if (!getData) return;

    try {
      setExporting(true);
      const records = await getData();

      if (!records || records.length === 0) {
        toast.info("No records to export.");
        return;
      }

      const flattened = records.map(flattenForExport);
      const allKeys = Array.from(
        flattened.reduce((set, rec) => {
          Object.keys(rec).forEach((k) => set.add(k));
          return set;
        }, new Set())
      );

      const normalized = flattened.map((rec) =>
        allKeys.reduce((acc, k) => {
          acc[k] = rec[k] ?? "";
          return acc;
        }, {})
      );

      const ws = XLSX.utils.json_to_sheet(normalized, { header: allKeys });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], {
        type: "application/octet-stream",
      });

      const iso = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      const filename = `${filenamePrefix}_${iso}.xlsx`;

      saveAs(blob, filename);
      toast.success("Excel export ready.");
    } catch (err) {
      console.error("ExcelExportButton error", err);
      toast.error("Export failed: " + (err.message || err.code || err));
    } finally {
      setExporting(false);
    }
  }

  return (
    <button onClick={handleExport} disabled={exporting} style={style}>
      {exporting ? "Exporting..." : label}
    </button>
  );
}
