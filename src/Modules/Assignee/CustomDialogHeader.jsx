import React from "react";

import "./DocumentViewer.css";

// Maps a file extension to the badge modifier class defined in
// DocumentViewer.css (.doc-viewer-badge--pdf/--doc/--xls/--png/--jpg/--txt), which
// themselves resolve their colors from the --dv-* tokens (light/dark
// aware). Anything not listed falls back to the neutral base badge style.
const TYPE_BADGE = {
  pdf: { label: "PDF", modifier: "pdf" },
  doc: { label: "DOC", modifier: "doc" },
  docx: { label: "DOC", modifier: "doc" },
  xls: { label: "XLS", modifier: "xls" },
  xlsx: { label: "XLS", modifier: "xls" },
  csv: { label: "CSV", modifier: "xls" },
  png: { label: "PNG", modifier: "png" },
  jpg: { label: "JPG", modifier: "jpg" },
  jpeg: { label: "JPG", modifier: "jpg" },
  txt: { label: "TXT", modifier: "txt" },
  json: { label: "JSON", modifier: "txt" },
  log: { label: "LOG", modifier: "txt" },
  md: { label: "MD", modifier: "txt" },
  eml: { label: "EML", modifier: "mail" },
  msg: { label: "MSG", modifier: "mail" },
};

const getExt = (fileName = "") => fileName.split(".").pop()?.toLowerCase() ?? "";

/**
 * Custom header for the viewer Dialog: file-type badge + filename +
 * position indicator when multiple documents are loaded.
 *
 * Props:
 * - docs: the full documents array passed to DocViewer
 * - activeIndex: index of the currently displayed document within docs
 */
export default function CustomDialogHeader({ docs = [], activeIndex = 0 }) {
  const activeDoc = docs[activeIndex];
  const ext = getExt(activeDoc?.fileName);
  const badge = TYPE_BADGE[ext] || { label: ext ? ext.toUpperCase() : "FILE", modifier: null };

  return (
    <div className="doc-viewer-header">
      <span
        className={`doc-viewer-badge${badge.modifier ? ` doc-viewer-badge--${badge.modifier}` : ""}`}
      >
        {badge.label}
      </span>

      <span className="doc-viewer-filename" title={activeDoc?.fileName}>
        {activeDoc?.fileName || "Document"}
      </span>

      {docs.length > 1 && (
        <span className="doc-viewer-position">
          {activeIndex + 1} / {docs.length}
        </span>
      )}
    </div>
  );
}