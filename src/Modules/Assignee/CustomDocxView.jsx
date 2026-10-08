import React, { useEffect, useRef, useState } from "react";
import { renderAsync } from "docx-preview";

import "./CustomViews.css";
import { useDocViewerZoom } from "./DocViewerMaximizedContext";

/**
 * Renders .docx with docx-preview.
 *
 * Why docx-preview (not mammoth): it keeps the Word document's own styling —
 * text/highlight/table-shading colors, fonts, sizes, borders, images and the
 * page layout — so the preview matches the original colour coding.
 *
 * Why custom at all: react-doc-viewer's built-in "doc" renderer proxies through
 * Microsoft Office Online, which can't load a local data: URI.
 *
 * - Pages are kept on a white "paper" background with black default text so the
 *   document's colours stay accurate in dark mode too (see CustomViews.css).
 * - At zoom 1 the page is scaled down to fit the viewer width; zoom scales it
 *   from there. The page is always centered.
 * - Legacy binary .doc is not supported by docx-preview; a message is shown
 *   (the Download button still works).
 */

// data:<mime>;base64,<data>  ->  ArrayBuffer
const dataUriToArrayBuffer = (dataUri) => {
  const base64 = dataUri.split(",")[1] || "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
};

// Links from the document: keep only safe schemes, open in a new tab.
const sanitizeLinks = (root) => {
  root.querySelectorAll("a[href]").forEach((a) => {
    const href = (a.getAttribute("href") || "").trim();
    if (!/^(https?:|mailto:|tel:|#)/i.test(href)) {
      a.removeAttribute("href");
    } else {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    }
  });
};

const CustomDocxView = ({ mainState: { currentDocument } }) => {
  const scrollRef = useRef(null);
  const bodyRef = useRef(null);
  const styleRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fitScale, setFitScale] = useState(1);
  const zoom = useDocViewerZoom();

  // Scale so the widest page fits the viewer width (never enlarge past 100%).
  const computeFit = () => {
    const scroller = scrollRef.current;
    const body = bodyRef.current;
    if (!scroller || !body) return;
    const sections = body.querySelectorAll("section.docx");
    if (!sections.length) return;
    let widest = 0;
    sections.forEach((s) => {
      widest = Math.max(widest, s.offsetWidth);
    });
    if (!widest) return;
    const available = scroller.clientWidth - 32; // renderer padding
    setFitScale(Math.min(1, Math.max(0.2, available / widest)));
  };

  useEffect(() => {
    if (!currentDocument?.fileData) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const isLegacyDoc =
      /\.doc$/i.test(currentDocument.uri || "") ||
      /\.doc$/i.test(currentDocument.fileName || "") ||
      /application\/msword/i.test(currentDocument.fileData.slice(0, 40));

    if (isLegacyDoc) {
      setError(
        "Preview isn't available for legacy .doc files. Please download the file to view it.",
      );
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const arrayBuffer = dataUriToArrayBuffer(currentDocument.fileData);
        // The container divs are always mounted (see return), so refs exist.
        bodyRef.current.innerHTML = "";
        styleRef.current.innerHTML = "";
        await renderAsync(arrayBuffer, bodyRef.current, styleRef.current, {
          className: "docx",
          inWrapper: true,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          useBase64URL: true, // inline images — no blob: URLs to leak/revoke
        });
        if (cancelled) return;
        sanitizeLinks(bodyRef.current);
        setLoading(false);
        computeFit();
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to render docx", err);
        setError(err?.message || "Failed to read Word document");
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDocument]);

  // Refit when the dialog is resized / maximized.
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => computeFit());
    ro.observe(scroller);
    return () => ro.disconnect();
  }, []);

  if (!currentDocument) return null;

  return (
    <div id="my-docx-renderer" className="doc-docx-renderer" ref={scrollRef}>
      {error && <p className="doc-docx-error">{error}</p>}
      {loading && !error && (
        <p className="doc-docx-loading">Loading document…</p>
      )}
      <div
        className="doc-docx-stage"
        style={{
          zoom: fitScale * zoom,
          visibility: loading || error ? "hidden" : "visible",
          display: error ? "none" : undefined,
        }}
      >
        <div ref={styleRef} />
        <div ref={bodyRef} className="doc-docx-body" />
      </div>
    </div>
  );
};

CustomDocxView.fileTypes = [
  "docx",
  "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];
CustomDocxView.weight = 1;

export default CustomDocxView;
