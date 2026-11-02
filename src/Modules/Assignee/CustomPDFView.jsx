import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import * as pdfjsLib from "pdfjs-dist";
import PdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?worker";
// Base styles for pdf.js' text layer (transparent, selectable text on top of the canvas)
import "pdfjs-dist/web/pdf_viewer.css";

import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import "./CustomViews.css";
import "./CustomPDFView.css";
import { useDocViewerZoom } from "./DocViewerMaximizedContext";

/**
 * Browser-style PDF viewer (react-doc-viewer plugin renderer).
 *
 * Features
 *  - Toolbar: sidebar toggle, previous / next page, editable "page N / total"
 *    box, and find-in-document (Enter / Shift+Enter / F3, Ctrl+F focuses it).
 *  - Sidebar tabs:
 *      Pages    -> lazy thumbnails, click to jump
 *      Contents -> the PDF's own bookmarks; if it has none, a list generated
 *                  from the larger-font headings found in the text
 *      Results  -> every search hit with a snippet; click to jump to it
 *  - Pages are virtualised: only pages near the viewport are rasterised, the
 *    rest are exact-size placeholders, so big PDFs stay light.
 *  - Selectable text layer with highlighted search matches.
 *  - Internal links jump to their page; external links open in a new tab.
 *  - Zoom comes from the dialog header (DocViewerZoomContext): 1 = fit width.
 */

/* ------------------------------ constants ------------------------------ */

const MAX_RESULTS = 2000; // stop collecting search hits after this many
const MAX_AUTO_TOC = 500; // cap on auto-generated contents entries
const SCROLLER_PAD = 16; // padding (px) around the pages in the scroll area
const THUMB_W = 116; // thumbnail width (px)

/* ------------------------------ helpers ------------------------------ */

// "data:application/pdf;base64,...." -> Uint8Array (what pdf.js wants)
const dataUriToBytes = (uri) => {
  const comma = uri.indexOf(",");
  const meta = uri.slice(0, comma);
  const payload = uri.slice(comma + 1);
  if (/;base64/i.test(meta)) {
    const bin = atob(payload);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  return new TextEncoder().encode(decodeURIComponent(payload));
};

// Only allow harmless URL schemes from links inside a PDF.
const isSafeUrl = (u) => /^(https?:|mailto:|tel:)/i.test((u || "").trim());

// Resolve a PDF destination (named string or explicit array) to
// { page (1-based), top (PDF units from the page bottom, or null) }.
const resolveDest = async (pdf, dest) => {
  try {
    let d = dest;
    if (typeof d === "string") d = await pdf.getDestination(d); // named dest
    if (!Array.isArray(d)) return null;
    const ref = d[0];
    let pageIndex;
    if (ref && typeof ref === "object") pageIndex = await pdf.getPageIndex(ref);
    else if (Number.isInteger(ref)) pageIndex = ref;
    else return null;
    // Some destinations also say how far down the page to land.
    const mode = d[1]?.name;
    let top = null;
    if (mode === "XYZ" && typeof d[3] === "number") top = d[3];
    else if ((mode === "FitH" || mode === "FitBH") && typeof d[2] === "number")
      top = d[2];
    return { page: pageIndex + 1, top };
  } catch {
    return null;
  }
};

// Scroll `sc` only if `el` is near/over an edge, then centre it. Used for
// search matches (pages area) and the active thumbnail/result (sidebar).
const centerInScroller = (sc, el, horizontal = true) => {
  if (!sc || !el) return;
  const s = sc.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  let dy = 0;
  let dx = 0;
  if (r.top - s.top < 60 || r.bottom - s.top > s.height - 60) {
    dy = r.top - s.top - s.height / 2;
  }
  if (horizontal && (r.left < s.left + 40 || r.right > s.right - 40)) {
    dx = r.left - s.left - s.width / 2;
  }
  if (dy || dx) sc.scrollBy({ top: dy, left: dx });
};

// Keep key presses inside our text inputs. Without this, a handler higher up
// (the dialog, react-doc-viewer or an app-wide hotkey) can swallow the keys,
// which makes the box look uneditable. Ctrl/Cmd+F is the one exception: it
// re-selects the search box instead of opening the browser's own find bar.
const isolateKeys = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") return;
  e.stopPropagation();
  e.nativeEvent?.stopImmediatePropagation?.();
};

// Wrap the matched characters of each text-layer <span> in a <mark>.
//   layer      : { textDivs, strs, dirty:Set } for one rendered page
//   highlights : [{ id, ranges:[{item,s,e}] }] matches on that page
//   currentId  : id of the "active" match (drawn in orange)
const applyHighlights = (layer, highlights, currentId) => {
  const { textDivs, strs, dirty } = layer;
  // 1) undo previous highlighting
  dirty.forEach((i) => {
    if (textDivs[i]) textDivs[i].textContent = strs[i];
  });
  dirty.clear();
  if (!highlights || !highlights.length) return;
  // Safety: the span list must line up with the text items.
  if (!textDivs || textDivs.length !== strs.length) return;

  // 2) group ranges per text item
  const byItem = new Map();
  for (const h of highlights) {
    for (const r of h.ranges) {
      if (!byItem.has(r.item)) byItem.set(r.item, []);
      byItem.get(r.item).push({ s: r.s, e: r.e, id: h.id });
    }
  }
  // 3) rebuild each affected span as text + <mark> + text ...
  byItem.forEach((list, i) => {
    const div = textDivs[i];
    if (!div) return;
    list.sort((a, b) => a.s - b.s);
    const str = strs[i];
    const frag = document.createDocumentFragment();
    let pos = 0;
    for (const r of list) {
      if (r.s > pos) frag.append(str.slice(pos, r.s));
      const m = document.createElement("mark");
      m.className = "pdfv-hl" + (r.id === currentId ? " pdfv-hl--current" : "");
      m.textContent = str.slice(r.s, r.e);
      frag.append(m);
      pos = r.e;
    }
    if (pos < str.length) frag.append(str.slice(pos));
    div.replaceChildren(frag);
    dirty.add(i);
  });
};

// Turn one page's text items into visual lines: [{ text, h (font size), y }].
// An item with hasEOL ends the current line.
const extractLines = (t) => {
  const lines = [];
  let cur = null;
  const flush = () => {
    if (cur && cur.text.trim()) lines.push(cur);
    cur = null;
  };
  for (const it of t.items) {
    if (!cur) cur = { text: "", h: 0, y: 0 };
    cur.text += it.str;
    if (it.str.trim()) {
      if (it.height > cur.h) cur.h = it.height; // biggest glyph on the line
      cur.y = it.transform[5]; // baseline, PDF units from the bottom
    }
    if (it.hasEOL) flush();
  }
  flush();
  return lines;
};

// Build a contents list from headings when the PDF has no bookmarks.
// Idea: the most common font size is "body text"; lines clearly larger than
// that, and short, are headings. The top 3 sizes become levels 0/1/2.
// Lines that repeat on many pages (running headers/footers) are ignored.
const buildAutoToc = (pageLines) => {
  // 1) find the body font size (weighted by amount of text)
  const weight = new Map();
  pageLines.forEach((lines) =>
    lines.forEach((l) => {
      const k = Math.round(l.h * 2) / 2;
      weight.set(k, (weight.get(k) || 0) + l.text.length);
    }),
  );
  let body = 0;
  let best = 0;
  weight.forEach((w, k) => {
    if (w > best) {
      best = w;
      body = k;
    }
  });
  if (!body) return [];

  // 2) how often does each line repeat? (headers / footers)
  const repeats = new Map();
  pageLines.forEach((lines) => {
    const seen = new Set(lines.map((l) => l.text.trim().toLowerCase()));
    seen.forEach((s) => repeats.set(s, (repeats.get(s) || 0) + 1));
  });
  const maxRepeat = Math.max(3, Math.ceil(pageLines.length * 0.25));

  // 3) collect heading candidates
  const cands = [];
  pageLines.forEach((lines, pi) =>
    lines.forEach((l) => {
      const text = l.text.replace(/\s+/g, " ").trim();
      const size = Math.round(l.h * 2) / 2;
      if (size < body * 1.15) return; // not clearly bigger than body text
      if (text.length < 2 || text.length > 100) return; // too short/long
      if (!/[A-Za-z\u00C0-\u024F\u0400-\u04FF]/.test(text)) return; // no letters
      if ((repeats.get(text.toLowerCase()) || 0) > maxRepeat) return;
      cands.push({ text, size, page: pi + 1, top: l.y + l.h });
    }),
  );

  // 4) map the 3 biggest sizes to indentation levels
  const sizes = [...new Set(cands.map((c) => c.size))]
    .sort((a, b) => b - a)
    .slice(0, 3);
  return cands
    .filter((c) => sizes.includes(c.size))
    .slice(0, MAX_AUTO_TOC)
    .map((c) => ({ ...c, level: sizes.indexOf(c.size) }));
};

/* ------------------------------ page ------------------------------ */

// One PDF page: a fixed-size box that draws the canvas, text layer and link
// hot-spots only while it is near the viewport.
const PdfPage = memo(function PdfPage({
  pdf,
  pageNum,
  size, // { w, h } of the page at scale 1
  cssWidth, // displayed width in CSS px (changes instantly with zoom)
  renderWidth, // width the bitmap is rendered at (settles after zoom)
  root, // the scroll container (for IntersectionObserver)
  getText, // cached text-content loader
  highlights, // search matches on this page
  currentId, // id of the active match if it is on this page, else -1
  focusToken, // bumps each time the user navigates to a match
  onDest, // click handler for internal links
  registerEl, // lets the parent keep a ref to this page element
}) {
  const elRef = useRef(null);
  const hostRef = useRef(null); // canvas + text layer live here (managed by hand)
  const layerRef = useRef(null); // { textDivs, strs, dirty } of the text layer
  const handledToken = useRef(0); // last focusToken we already scrolled for
  const [near, setNear] = useState(false);
  const [links, setLinks] = useState([]);
  const [layerVersion, setLayerVersion] = useState(0);

  const cssScale = cssWidth / size.w;

  // Tell the parent about our DOM node (used for page jumps / page tracking).
  useEffect(() => {
    registerEl(pageNum, elRef.current);
    return () => registerEl(pageNum, null);
  }, [pageNum, registerEl]);

  // Track whether we are within ~1500px of the viewport.
  useEffect(() => {
    if (!root || !elRef.current) return;
    const io = new IntersectionObserver(
      ([entry]) => setNear(entry.isIntersecting),
      { root, rootMargin: "1500px 0px" },
    );
    io.observe(elRef.current);
    return () => io.disconnect();
  }, [root]);

  // Draw canvas, text layer and links (or free them when far away).
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (!near || !renderWidth) {
      host.replaceChildren(); // free the bitmap
      layerRef.current = null;
      setLinks((l) => (l.length ? [] : l));
      return;
    }

    let cancelled = false;
    let renderTask = null;
    let textLayer = null;
    let tlDiv = null;

    (async () => {
      try {
        const page = await pdf.getPage(pageNum);
        if (cancelled) return;

        // Bitmap size: crisp on retina, but capped to keep memory sane.
        const renderScale = renderWidth / size.w;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const outScale = Math.min(
          renderScale * dpr,
          4096 / size.w,
          8192 / size.h,
        );
        const viewport = page.getViewport({ scale: outScale });

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));
        canvas.className = "pdfv-canvas";
        const ctx = canvas.getContext("2d");

        renderTask = page.render({ canvasContext: ctx, canvas, viewport });
        await renderTask.promise;
        if (cancelled) return;

        // Swap in the new canvas only once it is finished => no blank flash.
        const old = host.querySelector("canvas");
        if (old) old.replaceWith(canvas);
        else host.prepend(canvas);

        // Selectable text on top of the canvas (also what we highlight).
        const tc = await getText(pageNum);
        if (cancelled) return;
        const cssViewport = page.getViewport({ scale: renderScale });
        tlDiv = document.createElement("div");
        tlDiv.className = "textLayer pdfv-textlayer";
        host.append(tlDiv);

        let textDivs;
        let strs;
        if (pdfjsLib.TextLayer) {
          // pdf.js v4+
          textLayer = new pdfjsLib.TextLayer({
            textContentSource: tc.content,
            container: tlDiv,
            viewport: cssViewport,
          });
          await textLayer.render();
          textDivs = textLayer.textDivs;
          strs = textLayer.textContentItemsStr;
        } else {
          // pdf.js v3 fallback
          textDivs = [];
          strs = [];
          const task = pdfjsLib.renderTextLayer({
            textContentSource: tc.content,
            container: tlDiv,
            viewport: cssViewport,
            textDivs,
            textContentItemsStr: strs,
          });
          await task.promise;
        }
        if (cancelled) {
          tlDiv.remove();
          return;
        }
        // Remove the previous text layer now that the new one is ready.
        host.querySelectorAll(".pdfv-textlayer").forEach((n) => {
          if (n !== tlDiv) n.remove();
        });
        layerRef.current = { textDivs, strs, dirty: new Set() };
        setLayerVersion((v) => v + 1); // triggers highlight effect below

        // Clickable link areas, positioned in % so they follow zoom.
        const annots = await page.getAnnotations({ intent: "display" });
        if (cancelled) return;
        const v1 = page.getViewport({ scale: 1 });
        const ls = [];
        annots.forEach((a, i) => {
          if (a.subtype !== "Link") return;
          const url = a.url || a.unsafeUrl;
          if (!a.dest && !url) return;
          const [x1, y1, x2, y2] = v1.convertToViewportRectangle(a.rect);
          ls.push({
            key: i,
            left: (Math.min(x1, x2) / v1.width) * 100,
            top: (Math.min(y1, y2) / v1.height) * 100,
            width: (Math.abs(x2 - x1) / v1.width) * 100,
            height: (Math.abs(y2 - y1) / v1.height) * 100,
            dest: a.dest,
            url,
          });
        });
        setLinks(ls);
      } catch (err) {
        if (err?.name !== "RenderingCancelledException" && !cancelled) {
          console.error(`PDF page ${pageNum} failed to render`, err);
        }
      }
    })();

    // Cleanup: stop any in-flight work for this page.
    return () => {
      cancelled = true;
      try {
        renderTask?.cancel();
        textLayer?.cancel?.();
      } catch {
        /* ignore */
      }
      if (tlDiv && !layerRef.current) tlDiv.remove();
    };
  }, [near, renderWidth, pdf, pageNum, size.w, size.h, getText]);

  // Apply search highlights, and centre the active match once per navigation.
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    applyHighlights(layer, highlights, currentId);
    if (currentId >= 0 && focusToken !== handledToken.current) {
      const mark = hostRef.current?.querySelector(".pdfv-hl--current");
      if (mark) {
        handledToken.current = focusToken;
        centerInScroller(root, mark);
      }
    }
  }, [layerVersion, highlights, currentId, focusToken, root]);

  return (
    <div
      ref={elRef}
      className="pdfv-page"
      data-page={pageNum}
      style={{
        width: cssWidth,
        height: size.h * cssScale,
        // pdf.js text-layer CSS reads these to scale text with the page
        "--scale-factor": cssScale,
        "--total-scale-factor": cssScale,
        "--user-unit": 1,
      }}
    >
      {/* canvas + text layer are inserted here imperatively */}
      <div ref={hostRef} className="pdfv-page-host" />
      <div className="pdfv-links">
        {links.map((l) => {
          const style = {
            left: `${l.left}%`,
            top: `${l.top}%`,
            width: `${l.width}%`,
            height: `${l.height}%`,
          };
          // internal link -> jump inside the document
          if (l.dest) {
            return (
              <a
                key={l.key}
                className="pdfv-link"
                style={style}
                role="button"
                onClick={(e) => {
                  e.preventDefault();
                  onDest(l.dest);
                }}
              />
            );
          }
          // external link -> new tab (only safe schemes get an href)
          return (
            <a
              key={l.key}
              className="pdfv-link"
              style={style}
              href={isSafeUrl(l.url) ? l.url : undefined}
              target="_blank"
              rel="noopener noreferrer"
            />
          );
        })}
      </div>
    </div>
  );
});

/* ------------------------------ thumbnail ------------------------------ */

// Small page preview in the sidebar; rendered only while near the sidebar view.
const Thumb = memo(function Thumb({ pdf, pageNum, size, active, root, onClick }) {
  const btnRef = useRef(null);
  const canvasRef = useRef(null);
  const [near, setNear] = useState(false);

  // Are we close to the visible part of the sidebar?
  useEffect(() => {
    if (!root || !btnRef.current) return;
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), {
      root,
      rootMargin: "300px 0px",
    });
    io.observe(btnRef.current);
    return () => io.disconnect();
  }, [root]);

  // Draw when near, release the bitmap when far.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!near) {
      canvas.width = 0;
      return;
    }
    let cancelled = false;
    let task = null;
    (async () => {
      try {
        const page = await pdf.getPage(pageNum);
        if (cancelled) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: (THUMB_W * dpr) / size.w });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        task = page.render({
          canvasContext: canvas.getContext("2d"),
          canvas,
          viewport,
        });
        await task.promise;
      } catch {
        /* cancelled */
      }
    })();
    return () => {
      cancelled = true;
      try {
        task?.cancel();
      } catch {
        /* ignore */
      }
    };
  }, [near, pdf, pageNum, size.w]);

  return (
    <button
      ref={btnRef}
      type="button"
      className={`pdfv-thumb${active ? " is-active" : ""}`}
      data-thumb={pageNum}
      onClick={() => onClick(pageNum)}
    >
      <div
        className="pdfv-thumb-frame"
        style={{ width: THUMB_W, height: (THUMB_W * size.h) / size.w }}
      >
        <canvas ref={canvasRef} />
      </div>
      <span className="pdfv-thumb-num">{pageNum}</span>
    </button>
  );
});

/* ------------------------------ outline ------------------------------ */

// One bookmark from the PDF's own outline (recursive, collapsible).
const OutlineNode = ({ node, level, onNavigate }) => {
  const [open, setOpen] = useState(false);
  const hasKids = node.items && node.items.length > 0;
  return (
    <li>
      <div className="pdfv-ol-row" style={{ paddingLeft: 6 + level * 14 }}>
        {hasKids ? (
          <button
            type="button"
            className="pdfv-ol-toggle"
            aria-label={open ? "Collapse" : "Expand"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? (
              <ExpandMoreIcon fontSize="small" />
            ) : (
              <ChevronRightIcon fontSize="small" />
            )}
          </button>
        ) : (
          <span className="pdfv-ol-spacer" />
        )}
        <button
          type="button"
          className="pdfv-ol-title"
          title={node.title}
          style={{
            fontWeight: node.bold ? 600 : undefined,
            fontStyle: node.italic ? "italic" : undefined,
          }}
          onClick={() => onNavigate(node)}
        >
          {node.title || "(untitled)"}
        </button>
      </div>
      {hasKids && open && (
        <ul className="pdfv-ol-list">
          {node.items.map((c, i) => (
            <OutlineNode
              key={i}
              node={c}
              level={level + 1}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

/* ------------------------------ main ------------------------------ */

const CustomPDFView = ({ mainState: { currentDocument } }) => {
  const zoom = useDocViewerZoom(); // 1 = fit width (from the dialog header)
  const fileData = currentDocument?.fileData; // the PDF as a data: URI

  // ----- refs (values that must not trigger re-renders) -----
  const rootRef = useRef(null);
  const searchInputRef = useRef(null);
  const pageEls = useRef([]); // DOM node of every page (index = page-1)
  const textCache = useRef(new Map()); // page -> Promise of its text
  const searchToken = useRef(0); // bumps to cancel an in-flight search
  const tocRun = useRef(0); // bumps to cancel contents generation
  const scrollRatio = useRef(0); // scrollTop / scrollHeight (keeps position on zoom)
  const rafRef = useRef(0); // requestAnimationFrame handle for scroll
  const editingPage = useRef(false); // true while typing in the page box
  const resultsRef = useRef([]); // latest results for callbacks

  // ----- document state -----
  const [pdf, setPdf] = useState(null);
  const [sizes, setSizes] = useState(null); // [{w,h,rotate}] per page
  const [outline, setOutline] = useState(undefined); // undefined=loading, null=none
  const [autoToc, setAutoToc] = useState(null); // null | "scanning" | entries[]
  const [error, setError] = useState(null);

  // ----- layout state -----
  const [scroller, setScroller] = useState(null); // pages scroll container
  const [sideScroller, setSideScroller] = useState(null); // sidebar scroll container
  const [viewportW, setViewportW] = useState(0);
  const [renderWidth, setRenderWidth] = useState(0);

  // ----- navigation state -----
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tab, setTab] = useState("pages"); // pages | outline | results

  // ----- search state -----
  const [query, setQuery] = useState("");
  const [searchedQuery, setSearchedQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searchProgress, setSearchProgress] = useState(null); // null | {done,total}
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [focusToken, setFocusToken] = useState(0);

  resultsRef.current = results;

  /* ---------- load the document ---------- */
  useEffect(() => {
    if (!fileData) return;
    let cancelled = false;
    let task = null;
    let worker = null;
    let port = null;

    // reset everything for the new document
    setPdf(null);
    setSizes(null);
    setOutline(undefined);
    setAutoToc(null);
    setError(null);
    setQuery("");
    setSearchedQuery("");
    setResults([]);
    setCurrentIdx(-1);
    setSearchProgress(null);
    setCurrentPage(1);
    setTab("pages");
    textCache.current = new Map();
    pageEls.current = [];
    searchToken.current++;
    tocRun.current++;

    (async () => {
      try {
        // A dedicated worker per document, so closing one never breaks the next.
        port = new PdfWorker();
        worker = new pdfjsLib.PDFWorker({ port });
        task = pdfjsLib.getDocument({ data: dataUriToBytes(fileData), worker });
        const doc = await task.promise;
        if (cancelled) return;

        // Read every page's size up front => exact scroll height + page jumps.
        const out = new Array(doc.numPages);
        for (let i = 0; i < doc.numPages; i += 40) {
          const batch = [];
          for (let j = i; j < Math.min(i + 40, doc.numPages); j++) {
            batch.push(
              doc.getPage(j + 1).then((p) => {
                const v = p.getViewport({ scale: 1 });
                out[j] = { w: v.width, h: v.height, rotate: p.rotate };
              }),
            );
          }
          await Promise.all(batch);
          if (cancelled) return;
        }
        setPdf(doc);
        setSizes(out);

        // The PDF's own bookmarks (null when it has none).
        doc
          .getOutline()
          .then((o) => !cancelled && setOutline(o && o.length ? o : null))
          .catch(() => !cancelled && setOutline(null));
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load PDF", err);
        setError(
          err?.name === "PasswordException"
            ? "This PDF is password-protected. Please download it to open it."
            : err?.message || "Failed to render PDF",
        );
      }
    })();

    // Cleanup: cancel searches and free the worker.
    return () => {
      cancelled = true;
      searchToken.current++;
      tocRun.current++;
      try {
        task?.destroy();
      } catch {
        /* ignore */
      }
      try {
        worker?.destroy();
      } catch {
        /* ignore */
      }
      try {
        port?.terminate();
      } catch {
        /* ignore */
      }
    };
  }, [fileData]);

  /* ---------- width / fit-to-width ---------- */
  // Measure the pages area (re-measured when the dialog is resized/maximised).
  useEffect(() => {
    if (!scroller || typeof ResizeObserver === "undefined") return;
    const measure = () => setViewportW(scroller.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(scroller);
    return () => ro.disconnect();
  }, [scroller]);

  // Page width on screen: fit-to-width * zoom.
  const cssWidth = Math.max(
    160,
    Math.round((viewportW - SCROLLER_PAD * 2) * zoom),
  );

  // Zoom/resize scale the existing bitmaps with CSS right away; the pages are
  // re-rendered at the new resolution once the width has settled.
  useEffect(() => {
    if (!viewportW) return;
    const t = setTimeout(() => setRenderWidth(cssWidth), renderWidth ? 180 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cssWidth, viewportW]);

  // Keep the reading position when the page size changes (zoom/resize).
  useLayoutEffect(() => {
    if (scroller && scrollRatio.current) {
      scroller.scrollTop = scrollRatio.current * scroller.scrollHeight;
    }
  }, [cssWidth, scroller]);

  // Once loaded: narrow viewer => start with sidebar closed. Focus is moved
  // to the pages once so keyboard paging works (it never steals it again).
  useEffect(() => {
    if (!pdf) return;
    if (rootRef.current && rootRef.current.clientWidth < 700) {
      setSidebarOpen(false);
    }
    scroller?.focus({ preventScroll: true });
  }, [pdf, scroller]);

  /* ---------- which page is on screen? ---------- */
  const onScroll = useCallback(() => {
    if (!scroller) return;
    scrollRatio.current = scroller.scrollTop / (scroller.scrollHeight || 1);
    if (rafRef.current) return; // already scheduled this frame
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const els = pageEls.current;
      if (!els.length) return;
      // binary search: last page whose top is above the middle of the view
      const probe = scroller.scrollTop + scroller.clientHeight / 2;
      let lo = 0;
      let hi = els.length - 1;
      let found = 0;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const el = els[mid];
        if (el && el.offsetTop <= probe) {
          found = mid;
          lo = mid + 1;
        } else hi = mid - 1;
      }
      setCurrentPage(found + 1);
    });
  }, [scroller]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // Mirror the current page into the box (unless the user is typing in it).
  useEffect(() => {
    if (!editingPage.current) setPageInput(String(currentPage));
  }, [currentPage]);

  const registerEl = useCallback((n, el) => {
    pageEls.current[n - 1] = el;
  }, []);

  const numPages = pdf?.numPages || 0;

  /* ---------- navigation ---------- */
  // Scroll to a page (optionally to a y position inside it).
  const goToPage = useCallback(
    (n, topUnits = null) => {
      if (!scroller || !sizes) return;
      const page = Math.min(Math.max(1, n), sizes.length);
      const el = pageEls.current[page - 1];
      if (!el) return;
      let y = el.offsetTop - 8;
      const sz = sizes[page - 1];
      // y offset only for unrotated pages (rotated ones just land on the top)
      if (topUnits != null && sz.rotate % 360 === 0) {
        const off = (sz.h - topUnits) * (cssWidth / sz.w);
        y += Math.min(Math.max(0, off), el.offsetHeight);
      }
      scroller.scrollTo({ top: Math.max(0, y) });
      setCurrentPage(page);
    },
    [scroller, sizes, cssWidth],
  );

  // Jump to a PDF destination (link or bookmark).
  const goToDest = useCallback(
    async (dest) => {
      if (!pdf) return;
      const r = await resolveDest(pdf, dest);
      if (r) goToPage(r.page, r.top);
    },
    [pdf, goToPage],
  );

  // Click on a PDF bookmark.
  const navigateOutline = useCallback(
    (node) => {
      if (node.dest) goToDest(node.dest);
      else if (node.url && isSafeUrl(node.url))
        window.open(node.url, "_blank", "noopener,noreferrer");
    },
    [goToDest],
  );

  /* ---------- page text (shared by text layer, search and contents) ---------- */
  // Returns (and caches) { content, items, starts, text } for a page:
  //   items  : text items in the same order as the text-layer spans
  //   starts : offset of each item inside `text`
  //   text   : the whole page as one string (a space at each line end)
  const getText = useCallback(
    (n) => {
      const cache = textCache.current;
      if (!cache.has(n)) {
        cache.set(
          n,
          (async () => {
            const page = await pdf.getPage(n);
            const content = await page.getTextContent();
            const items = content.items.filter((i) => typeof i.str === "string");
            const starts = [];
            let text = "";
            for (const it of items) {
              starts.push(text.length);
              text += it.str.replace(/\u00a0/g, " "); // same length as original
              if (it.hasEOL) text += " ";
            }
            return { content, items, starts, text };
          })(),
        );
      }
      return cache.get(n);
    },
    [pdf],
  );

  /* ---------- auto-generated contents ---------- */
  // Only runs when the PDF has no bookmarks and the Contents tab is opened.
  useEffect(() => {
    if (tab !== "outline" || outline !== null || autoToc !== null || !pdf) return;
    const run = tocRun.current;
    setAutoToc("scanning");
    (async () => {
      const pageLines = [];
      for (let p = 1; p <= pdf.numPages; p++) {
        const t = await getText(p);
        if (run !== tocRun.current) return; // document changed meanwhile
        pageLines.push(extractLines(t));
      }
      setAutoToc(buildAutoToc(pageLines));
    })();
  }, [tab, outline, autoToc, pdf, getText]);

  /* ---------- search ---------- */
  // Make match number `idx` the active one (wraps around) and scroll to it.
  const gotoMatch = useCallback(
    (idx, list) => {
      const arr = list || resultsRef.current;
      if (!arr.length) return;
      const i = ((idx % arr.length) + arr.length) % arr.length;
      const m = arr[i];
      setCurrentIdx(i);
      setFocusToken((t) => t + 1); // tells the page to centre the highlight
      // If its page is not on screen yet, scroll there first.
      const el = pageEls.current[m.page - 1];
      if (el && scroller) {
        const sr = scroller.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        const visible = r.bottom > sr.top && r.top < sr.bottom;
        if (!visible) scroller.scrollTo({ top: Math.max(0, el.offsetTop - 8) });
      }
    },
    [scroller],
  );

  // Search every page for `raw` (case-insensitive), filling results as it goes.
  const runSearch = useCallback(
    async (raw) => {
      const token = ++searchToken.current; // newer searches cancel older ones
      const needle = raw.toLowerCase().replace(/\s+/g, " ").trim();
      setSearchedQuery(raw.trim());
      if (!needle || !pdf) {
        setResults([]);
        setCurrentIdx(-1);
        setSearchProgress(null);
        return;
      }
      setTab("results");
      setCurrentIdx(-1);
      const found = [];
      let jumped = false;
      setSearchProgress({ done: 0, total: pdf.numPages });

      for (let p = 1; p <= pdf.numPages; p++) {
        const t = await getText(p);
        if (token !== searchToken.current) return; // superseded
        const hay = t.text.toLowerCase();
        let from = 0;
        let at;
        while ((at = hay.indexOf(needle, from)) !== -1) {
          const end = at + needle.length;
          // Which text items does this match cover? (may span several)
          const ranges = [];
          for (let i = 0; i < t.items.length; i++) {
            const st = t.starts[i];
            const en = st + t.items[i].str.length;
            if (en <= at) continue;
            if (st >= end) break;
            ranges.push({
              item: i,
              s: Math.max(at, st) - st,
              e: Math.min(end, en) - st,
            });
          }
          found.push({
            id: found.length,
            page: p,
            ranges,
            // snippet shown in the Results tab (trimmed to whole words)
            before: t.text.slice(Math.max(0, at - 32), at).replace(/^\S*\s/, ""),
            match: t.text.slice(at, end),
            after: t.text.slice(end, end + 56).replace(/\s\S*$/, ""),
          });
          from = end; // continue after this match (no overlaps)
          if (found.length >= MAX_RESULTS) break;
        }
        if (found.length >= MAX_RESULTS) break;

        // Publish progress every 12 pages and jump to the first hit asap.
        if (p % 12 === 0 || p === pdf.numPages) {
          setResults(found.slice());
          setSearchProgress({ done: p, total: pdf.numPages });
          if (!jumped && found.length) {
            jumped = true;
            gotoMatch(0, found.slice());
          }
        }
      }
      if (token !== searchToken.current) return;
      const finalList = found.slice();
      setResults(finalList);
      setSearchProgress(null);
      if (!jumped && finalList.length) gotoMatch(0, finalList);
    },
    [pdf, getText, gotoMatch],
  );

  // Search as you type (350ms after the last keystroke).
  useEffect(() => {
    if (!pdf) return;
    if (!query.trim()) {
      // empty box => clear everything
      searchToken.current++;
      setResults([]);
      setCurrentIdx(-1);
      setSearchedQuery("");
      setSearchProgress(null);
      return;
    }
    const t = setTimeout(() => runSearch(query), 350);
    return () => clearTimeout(t);
  }, [query, pdf, runSearch]);

  const clearSearch = () => {
    setQuery("");
    setTab((t) => (t === "results" ? "pages" : t));
  };

  // Keys inside the search box.
  const onSearchKeyDown = (e) => {
    isolateKeys(e); // keep typing away from outer handlers
    if (e.key === "Enter") {
      e.preventDefault();
      // Enter on a not-yet-searched query searches now; otherwise next/prev.
      if (query.trim() && query.trim() !== searchedQuery) runSearch(query);
      else if (results.length) gotoMatch(currentIdx + (e.shiftKey ? -1 : 1));
    } else if (e.key === "Escape") {
      clearSearch(); // Esc clears the search without closing the dialog
      scroller?.focus({ preventScroll: true });
    }
  };

  // Keys anywhere in the viewer: Ctrl/Cmd+F focuses search, F3 = next match.
  const onRootKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
      e.preventDefault();
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    } else if (e.key === "F3") {
      e.preventDefault();
      gotoMatch(currentIdx + (e.shiftKey ? -1 : 1));
    }
  };

  // Results grouped per page (stable array per page => cheap re-renders).
  const resultsByPage = useMemo(() => {
    const m = new Map();
    results.forEach((r) => {
      if (!m.has(r.page)) m.set(r.page, []);
      m.get(r.page).push({ id: r.id, ranges: r.ranges });
    });
    return m;
  }, [results]);

  const currentMatch = currentIdx >= 0 ? results[currentIdx] : null;
  const matchPages = resultsByPage.size;

  /* ---------- keep the sidebar scrolled to the active item ---------- */
  useEffect(() => {
    if (!sidebarOpen || !sideScroller) return;
    const sel =
      tab === "pages"
        ? `[data-thumb="${currentPage}"]`
        : tab === "results" && currentIdx >= 0
          ? `[data-result="${currentIdx}"]`
          : null;
    if (!sel) return;
    // scroll the sidebar (vertically only) so the active item stays visible
    centerInScroller(sideScroller, sideScroller.querySelector(sel), false);
  }, [currentPage, currentIdx, tab, sidebarOpen, sideScroller]);

  /* ---------- render ---------- */
  if (!currentDocument) return null;

  // Go to the page typed in the page box.
  const commitPageInput = () => {
    const n = parseInt(pageInput, 10);
    if (n) goToPage(n);
  };

  const hasQuery = query.trim().length > 0;

  return (
    <div
      id="my-pdf-renderer"
      className="pdfv"
      ref={rootRef}
      tabIndex={-1}
      onKeyDown={onRootKeyDown}
    >
      {error ? (
        <p className="doc-pdf-error">{error}</p>
      ) : !sizes || !pdf ? (
        <p className="pdfv-loading">Loading PDF…</p>
      ) : (
        <>
          {/* ================= toolbar ================= */}
          <div className="pdfv-toolbar">
            {/* show / hide the sidebar */}
            <button
              type="button"
              className="pdfv-btn"
              title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
              aria-label="Toggle sidebar"
              aria-pressed={sidebarOpen}
              onClick={() => setSidebarOpen((o) => !o)}
            >
              {sidebarOpen ? (
                <MenuOpenIcon fontSize="small" />
              ) : (
                <MenuIcon fontSize="small" />
              )}
            </button>

            {/* previous / next page + "page N / total" box */}
            <div className="pdfv-pager" role="group" aria-label="Page navigation">
              <button
                type="button"
                className="pdfv-btn"
                title="Previous page"
                aria-label="Previous page"
                disabled={currentPage <= 1}
                onClick={() => goToPage(currentPage - 1)}
              >
                <KeyboardArrowUpIcon fontSize="small" />
              </button>
              <button
                type="button"
                className="pdfv-btn"
                title="Next page"
                aria-label="Next page"
                disabled={currentPage >= numPages}
                onClick={() => goToPage(currentPage + 1)}
              >
                <KeyboardArrowDownIcon fontSize="small" />
              </button>
              <input
                className="pdfv-page-input"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                aria-label="Page number"
                value={pageInput}
                onFocus={(e) => {
                  editingPage.current = true; // stop mirroring while typing
                  e.target.select();
                }}
                onChange={(e) => setPageInput(e.target.value.replace(/\D/g, ""))}
                onBlur={() => {
                  editingPage.current = false;
                  setPageInput(String(currentPage));
                }}
                onKeyDown={(e) => {
                  isolateKeys(e);
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitPageInput();
                    e.currentTarget.blur();
                  } else if (e.key === "Escape") {
                    e.currentTarget.blur();
                  }
                }}
                onKeyUp={isolateKeys}
                onKeyPress={isolateKeys}
              />
              <span className="pdfv-page-total">/ {numPages}</span>
            </div>

            {/* find in document */}
            <div className="pdfv-search">
              <SearchIcon fontSize="small" className="pdfv-search-icon" />
              <input
                ref={searchInputRef}
                className="pdfv-search-input"
                type="text"
                autoComplete="off"
                spellCheck={false}
                placeholder="Find in document"
                aria-label="Find in document"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onSearchKeyDown}
                onKeyUp={isolateKeys}
                onKeyPress={isolateKeys}
              />
              {hasQuery && (
                <span className="pdfv-search-count">
                  {searchProgress
                    ? `${results.length}…`
                    : results.length
                      ? `${currentIdx + 1} / ${results.length}`
                      : searchedQuery === query.trim()
                        ? "0 results"
                        : ""}
                </span>
              )}
              <button
                type="button"
                className="pdfv-btn pdfv-btn--sm"
                title="Previous match (Shift+Enter)"
                aria-label="Previous match"
                disabled={!results.length}
                onClick={() => gotoMatch(currentIdx - 1)}
              >
                <KeyboardArrowUpIcon fontSize="small" />
              </button>
              <button
                type="button"
                className="pdfv-btn pdfv-btn--sm"
                title="Next match (Enter)"
                aria-label="Next match"
                disabled={!results.length}
                onClick={() => gotoMatch(currentIdx + 1)}
              >
                <KeyboardArrowDownIcon fontSize="small" />
              </button>
              {hasQuery && (
                <button
                  type="button"
                  className="pdfv-btn pdfv-btn--sm"
                  title="Clear (Esc)"
                  aria-label="Clear search"
                  onClick={clearSearch}
                >
                  <CloseIcon fontSize="small" />
                </button>
              )}
            </div>
          </div>

          <div className="pdfv-body">
            {/* ================= sidebar ================= */}
            {sidebarOpen && (
              <aside className="pdfv-sidebar">
                <div className="pdfv-tabs" role="tablist">
                  {[
                    ["pages", "Pages"],
                    ["outline", "Contents"],
                    [
                      "results",
                      results.length ? `Results (${results.length})` : "Results",
                    ],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={tab === id}
                      className={`pdfv-tab${tab === id ? " is-active" : ""}`}
                      onClick={() => setTab(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="pdfv-side-scroll" ref={setSideScroller}>
                  {/* --- Pages: thumbnails --- */}
                  {tab === "pages" && (
                    <div className="pdfv-thumbs">
                      {sizes.map((sz, i) => (
                        <Thumb
                          key={i}
                          pdf={pdf}
                          pageNum={i + 1}
                          size={sz}
                          active={currentPage === i + 1}
                          root={sideScroller}
                          onClick={goToPage}
                        />
                      ))}
                    </div>
                  )}

                  {/* --- Contents: real bookmarks, else generated headings --- */}
                  {tab === "outline" &&
                    (outline === undefined ? (
                      <p className="pdfv-side-msg">Loading contents…</p>
                    ) : outline ? (
                      <ul className="pdfv-ol-list pdfv-ol-root">
                        {outline.map((n, i) => (
                          <OutlineNode
                            key={i}
                            node={n}
                            level={0}
                            onNavigate={navigateOutline}
                          />
                        ))}
                      </ul>
                    ) : autoToc === null || autoToc === "scanning" ? (
                      <p className="pdfv-side-msg">
                        No bookmarks in this PDF — scanning pages for headings…
                      </p>
                    ) : autoToc.length === 0 ? (
                      <p className="pdfv-side-msg">
                        No table of contents or headings could be found. Use the
                        Pages tab or search instead.
                      </p>
                    ) : (
                      <>
                        <p className="pdfv-side-note">
                          Generated from headings in the document
                        </p>
                        <ul className="pdfv-ol-list pdfv-ol-root">
                          {autoToc.map((h, i) => (
                            <li key={i}>
                              <button
                                type="button"
                                className="pdfv-toc-item"
                                style={{ paddingLeft: 12 + h.level * 14 }}
                                title={h.text}
                                onClick={() => goToPage(h.page, h.top)}
                              >
                                <span className="pdfv-toc-text">{h.text}</span>
                                <span className="pdfv-toc-page">{h.page}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </>
                    ))}

                  {/* --- Results: every search hit --- */}
                  {tab === "results" && (
                    <div className="pdfv-results">
                      {!hasQuery && !results.length ? (
                        <p className="pdfv-side-msg">
                          Type in “Find in document” to search every page. Click a
                          result to jump to it.
                        </p>
                      ) : (
                        <>
                          <p className="pdfv-results-summary">
                            {searchProgress
                              ? `Searching… ${searchProgress.done}/${searchProgress.total} pages`
                              : results.length
                                ? `${results.length}${results.length >= MAX_RESULTS ? "+" : ""} match${results.length === 1 ? "" : "es"} on ${matchPages} page${matchPages === 1 ? "" : "s"}`
                                : `No results for “${searchedQuery}”`}
                          </p>
                          {results.map((r, i) => (
                            <React.Fragment key={r.id}>
                              {/* page heading when the page changes */}
                              {(i === 0 || results[i - 1].page !== r.page) && (
                                <div className="pdfv-results-page">
                                  Page {r.page}
                                </div>
                              )}
                              <button
                                type="button"
                                data-result={r.id}
                                className={`pdfv-result${r.id === currentIdx ? " is-active" : ""}`}
                                onClick={() => gotoMatch(r.id)}
                              >
                                <span>{r.before}</span>
                                <mark>{r.match}</mark>
                                <span>{r.after}</span>
                              </button>
                            </React.Fragment>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </aside>
            )}

            {/* ================= pages ================= */}
            <div
              className="pdfv-scroller"
              ref={setScroller}
              onScroll={onScroll}
              tabIndex={0}
            >
              <div className="pdfv-pages">
                {sizes.map((sz, i) => {
                  const n = i + 1;
                  return (
                    <PdfPage
                      key={n}
                      pdf={pdf}
                      pageNum={n}
                      size={sz}
                      cssWidth={cssWidth}
                      renderWidth={renderWidth}
                      root={scroller}
                      getText={getText}
                      highlights={resultsByPage.get(n)}
                      currentId={
                        currentMatch && currentMatch.page === n
                          ? currentMatch.id
                          : -1
                      }
                      focusToken={focusToken}
                      onDest={goToDest}
                      registerEl={registerEl}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Supported file extensions
CustomPDFView.fileTypes = ["pdf", "application/pdf"];

// Priority of this viewer among available document viewers
CustomPDFView.weight = 1;

export default CustomPDFView;
