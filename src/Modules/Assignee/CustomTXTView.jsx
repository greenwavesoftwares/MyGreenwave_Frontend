import React, { useMemo } from "react";

import "./CustomViews.css";
import { useDocViewerZoom } from "./DocViewerMaximizedContext";

/**
 * Renders plain-text style files: .txt, .json, .log and .md.
 *
 * - The file arrives as a base64 data: URI (see DocumentViewer.jsx), so it is
 *   decoded here as UTF-8 (falling back to the raw bytes as Latin-1 if the
 *   file isn't valid UTF-8, e.g. old Windows-1252 text files).
 * - .json is pretty-printed (indented); if it isn't valid JSON the raw text is
 *   shown as-is. .md is shown as raw Markdown source.
 * - Text is rendered inside a <pre>, so React escapes it — no HTML injection.
 * - Zoom scales the font size; long lines wrap so there's no sideways scroll.
 */

// data:<mime>;base64,<data> (or url-encoded data) -> string
const dataUriToText = (dataUri) => {
  if (typeof dataUri !== "string") return "";
  const commaIndex = dataUri.indexOf(",");
  if (commaIndex === -1) return "";
  const meta = dataUri.slice(0, commaIndex);
  const payload = dataUri.slice(commaIndex + 1);

  let bytes;
  if (/;base64/i.test(meta)) {
    const binary = atob(payload);
    bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  } else {
    bytes = new TextEncoder().encode(decodeURIComponent(payload));
  }

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
};

const BASE_FONT_SIZE = 13; // px at 100% zoom

const getExt = (doc) =>
  (doc?.fileName || doc?.uri || "").split("?")[0].split(".").pop()?.toLowerCase();

const formatText = (raw, ext) => {
  if (ext === "json") {
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw; // not valid JSON — show exactly what's in the file
    }
  }
  return raw;
};

const CustomTXTView = ({ mainState: { currentDocument } }) => {
  const zoom = useDocViewerZoom();

  const { text, error } = useMemo(() => {
    if (!currentDocument?.fileData) return { text: "", error: null };
    try {
      const raw = dataUriToText(currentDocument.fileData).replace(/^\uFEFF/, "");
      return { text: formatText(raw, getExt(currentDocument)), error: null };
    } catch (err) {
      console.error("Failed to read text file", err);
      return { text: "", error: err?.message || "Failed to read text file" };
    }
  }, [currentDocument]);

  if (!currentDocument) return null;

  return (
    <div id="my-txt-renderer" className="doc-txt-renderer">
      {error ? (
        <p className="doc-txt-error">{error}</p>
      ) : text === "" ? (
        <p className="doc-txt-empty">This file is empty.</p>
      ) : (
        <pre
          className="doc-txt-content"
          style={{ fontSize: `${BASE_FONT_SIZE * zoom}px` }}
        >
          {text}
        </pre>
      )}
    </div>
  );
};

// Matched by extension and by MIME type (DocumentViewer normalises these
// files' data: URI MIME to text/plain, the rest are belt-and-braces).
CustomTXTView.fileTypes = [
  "txt",
  "json",
  "log",
  "md",
  "text/plain",
  "application/json",
  "text/markdown",
];
CustomTXTView.weight = 1;

export default CustomTXTView;
