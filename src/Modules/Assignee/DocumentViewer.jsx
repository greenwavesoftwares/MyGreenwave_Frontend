import { useState, forwardRef, useImperativeHandle } from "react";
import DocViewer from "react-doc-viewer";
import { Dialog } from "primereact/dialog";
import { IconButton, Tooltip } from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import CustomPNGView from "./CustomPNGView";
import CustomExcelView from "./CustomExcelView";
import CustomPDFView from "./CustomPDFView";
import CustomDialogHeader from "./CustomDialogHeader";
import { DocViewerMaximizedContext } from "./DocViewerMaximizedContext";
import "./DocumentViewer.css";

/**
 * DocumentViewer — everything in one file, no Electron main/preload needed.
 *
 * Why: a page can never load an arbitrary local path like
 * "file:///D:/books/whatever.pdf" directly — Chromium blocks it
 * (blocked:other) regardless of framework. The only way to view a local
 * file without a separate preload/IPC script is to have the user pick it
 * via <input type="file">.
 *
 * IMPORTANT: we convert the file to a base64 data: URI, NOT a blob: URL.
 * react-doc-viewer issues a HEAD request to check file size before
 * loading, and Chrome's blob: URLs don't support HEAD (you'll see
 * "net::ERR_METHOD_NOT_ALLOWED" and an infinite loading spinner).
 * data: URIs don't have that problem since the browser serves them
 * locally regardless of method.
 *
 * The viewer itself now opens in a PrimeReact Dialog once files are
 * picked, rather than rendering inline.
 *
 * It can also be driven from another component (e.g. an attachment pill
 * in a comments list) instead of the local file picker: mount it with
 * `hideTrigger` and grab a ref, then call `ref.current.openBlob(blob,
 * fileName)` — typically with a Blob returned from a "download file" API
 * call — to preview that file in the same Dialog. This reuses the same
 * data: URI approach as handleFiles below, since the react-doc-viewer
 * HEAD-request issue applies to server-fetched files too.
 */
const DocumentViewer = forwardRef(function DocumentViewer(
  { hideTrigger = false },
  ref,
) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMaximized, setIsMaximized] = useState(false);

  const fileToDataUri = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setLoading(true);
    try {
      const newDocs = await Promise.all(
        files.map(async (file) => ({
          uri: await fileToDataUri(file),
          fileName: file.name,
        }))
      );
      setDocs(newDocs); // replace; use [...docs, ...newDocs] to append instead
      setActiveIndex(0);
      setDialogVisible(true);
    } finally {
      setLoading(false);
      // reset the input so picking the same file again still fires onChange
      e.target.value = "";
    }
  };

  // Open one or more already-resolved docs ({ uri, fileName }), e.g. built
  // by a caller that already has a data: URI.
  const openDocs = (newDocs) => {
    const list = Array.isArray(newDocs) ? newDocs : [newDocs];
    if (list.length === 0) return;
    setDocs(list);
    setActiveIndex(0);
    setDialogVisible(true);
  };

  // Open a single Blob (e.g. from an API "get file" call) by converting it
  // to a data: URI first, same as a locally picked file would be.
  const openBlob = async (blob, fileName) => {
    setLoading(true);
    try {
      const uri = await fileToDataUri(blob);
      openDocs([{ uri, fileName }]);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({ openDocs, openBlob }));

  const downloadActiveDoc = () => {
    const activeDoc = docs[activeIndex];
    if (!activeDoc) return;
    const a = document.createElement("a");
    a.href = activeDoc.uri;
    a.download = activeDoc.fileName || "download";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (

      <Dialog
        className="doc-viewer-dialog"
        header={
          <div className="doc-viewer-header-row">
            <CustomDialogHeader docs={docs} activeIndex={activeIndex} />
            {docs.length > 0 && (
              <Tooltip title="Download">
                <IconButton
                  size="small"
                  className="doc-viewer-download-btn"
                  aria-label="Download file"
                  onClick={downloadActiveDoc}
                >
                  <DownloadOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </div>
        }
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        // Rendered from inside a MUI Dialog (CommentsActionDialog), whose
        // .MuiModal-root sits at z-index 1300. PrimeReact computes its own
        // mask/panel z-index dynamically starting well below that, so
        // without this it silently renders *behind* the MUI dialog.
        // appendTo targets `.pai-page` — same container CommentsActionDialog's
        // MUI Dialog uses — rather than raw document.body, so this stays a
        // real DOM descendant of the page wrapper the app's .light/.dark
        // theme class lives on and DocumentViewer.css's --dv-* tokens keep
        // resolving correctly. baseZIndex pushes both the mask and the
        // panel above 1300 regardless of where it's appended.
        appendTo={() => document.querySelector(".pai-page") || document.body}
        baseZIndex={1400}
        style={{ width: "80vw", height: "85vh" }}
        contentStyle={{ height: "100%", padding: 0 }}
        maximizable
        modal
        dismissableMask
        // PrimeReact Dialog only manages its own maximized state
        // internally when you DON'T pass onMaximize. The moment you
        // pass onMaximize, it flips into a controlled component
        // (`var maximized = props.onMaximize ? props.maximized : ...`)
        // and expects the `maximized` prop to be fed back in. Without
        // it, `props.maximized` sits at its default (false) forever,
        // so `.p-dialog-maximized` (width/height: 100vw/100vh
        // !important) never gets applied — the click still fires and
        // flips isMaximized (so the PDF canvas rescales via context),
        // but the dialog panel itself never visually grows.
        maximized={isMaximized}
        onMaximize={(e) => setIsMaximized(e.maximized)}
      >
        {docs.length === 0 ? (
          <p className="doc-viewer-empty-state">
            No document loaded. Pick a PDF, Word, Excel, or PNG file above.
          </p>
        ) : (
          // isMaximized is provided via context, NOT by rebuilding the
          // `documents` array below. react-doc-viewer's AppProvider does
          // `useEffect(() => dispatch(setAllDocuments(documents)), [documents])`
          // — any new array/object reference there (even with identical
          // uris) makes it reset currentDocument to a fresh object with no
          // fileType/fileData. The effect that's supposed to re-fetch
          // fileType only depends on [currentFileNo, documentURI], neither
          // of which changes on a maximize toggle, so it never re-runs —
          // fileType (and therefore CurrentRenderer) stays stuck
          // `undefined`, and the library renders nothing, permanently.
          // Passing `documents={docs}` keeps that array reference stable
          // across maximize/restore, since `docs` only changes via
          // setDocs/openDocs/openBlob (an actual new document set).
          <DocViewerMaximizedContext.Provider value={isMaximized}>
            <DocViewer
              documents={docs}
              pluginRenderers={[CustomPNGView, CustomExcelView, CustomPDFView]}
              onDocumentChange={(doc) => {
                const idx = docs.findIndex((d) => d.uri === doc.uri);
                if (idx !== -1) setActiveIndex(idx);
              }}
              config={{
                header: {
                  // react-doc-viewer's own FileName sub-component derives
                  // its label from currentDocument.uri (never fileName),
                  // by splitting on "/" and taking the last segment — that
                  // logic assumes real URLs. Our data: URIs' MIME type
                  // itself contains a "/", so the split lands mid-MIME-type
                  // and the "last segment" ends up being
                  // ";base64,<entire file>", rendered as a huge garbled
                  // string across the dialog. CustomDialogHeader.jsx
                  // already shows the correct name (from
                  // currentDocument.fileName), so disable this. Keep the
                  // header itself enabled — that's also where the
                  // prev/next multi-document nav lives.
                  disableHeader: false,
                  disableFileName: true,
                  retainURLParams: false,
                }
              }}
              // HeaderBar (prev/next nav) reads its colors from this
              // `theme` prop, merged over the library's own defaultTheme
              // ({ primary: "#fff", text_primary: "#000", ... }) — not
              // from DocumentViewer.css. Pointing it at our --dv-* custom
              // properties means it's read live off whichever ancestor's
              // tokens are in scope, so it tracks light/dark automatically.
              theme={{
                primary: "var(--dv-surface)",
                secondary: "var(--dv-primary)",
                tertiary: "var(--dv-surface-2)",
                text_primary: "var(--dv-text)",
                text_secondary: "#fff",
                text_tertiary: "var(--dv-text-faint)",
              }}
              style={{ height: "100%" }}
            />
          </DocViewerMaximizedContext.Provider>
        )}
      </Dialog>
  );
});

export default DocumentViewer;
