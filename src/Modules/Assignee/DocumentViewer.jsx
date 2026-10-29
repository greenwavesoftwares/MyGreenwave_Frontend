import { useState, forwardRef, useImperativeHandle } from "react";
import DocViewer from "react-doc-viewer";
import { Dialog } from "primereact/dialog";
import { IconButton, Tooltip } from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import CustomPNGView from "./CustomPNGView";
import CustomExcelView from "./CustomExcelView";
import CustomDocxView from "./CustomDocxView";
import CustomPDFView from "./CustomPDFView";
import CustomDialogHeader from "./CustomDialogHeader";
import {
  DocViewerMaximizedContext,
  DocViewerZoomContext,
  ZOOM_STEPS,
} from "./DocViewerMaximizedContext";
import "./assignee-theme.css"; // REFACTOR: shared reset/tokens
import "./DocumentViewer.css";
import { getPortalContainer } from "./portalContainer";
import CustomJPGView from "./CustomJPGView";
import CustomMailViewer from "./CustomMailViewer";
import CustomTXTView from "./CustomTXTView";

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
  const [zoom, setZoom] = useState(1);

  const zoomIn = () => setZoom((z) => ZOOM_STEPS.find((s) => s > z + 0.001) ?? z);
  const zoomOut = () =>
    setZoom((z) => [...ZOOM_STEPS].reverse().find((s) => s < z - 0.001) ?? z);
  const resetZoom = () => setZoom(1);

  // Plain-text style files (.txt/.json/.log/.md). Browsers report wildly
  // different MIME types for these (application/json, text/markdown, or an
  // empty / octet-stream type for .log), and react-doc-viewer picks the
  // renderer from the data: URI's MIME type. So for these extensions the
  // MIME is normalised to text/plain, which CustomTXTView handles. The
  // file name (and so its extension) is untouched, hence Download still
  // saves it as the original .json/.log/.md file.
  const TEXT_EXTENSIONS = ["txt", "json", "log", "md"];
  const isTextFile = (name = "") =>
    TEXT_EXTENSIONS.includes(name.split(".").pop()?.toLowerCase());

  const fileToDataUri = (file, fileName = file?.name) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        resolve(
          isTextFile(fileName) && typeof result === "string"
            ? result.replace(/^data:[^,]*?(;base64)?,/, "data:text/plain$1,")
            : result,
        );
      };
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
          uri: await fileToDataUri(file, file.name),
          fileName: file.name,
        }))
      );
      setDocs(newDocs); // replace; use [...docs, ...newDocs] to append instead
      setActiveIndex(0);
      setZoom(1);
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
    setZoom(1);
    setDialogVisible(true);
  };

  // Open a single Blob (e.g. from an API "get file" call) by converting it
  // to a data: URI first, same as a locally picked file would be.
  const openBlob = async (blob, fileName) => {
    setLoading(true);
    try {
      const uri = await fileToDataUri(blob, fileName);
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
    className="pj-scope doc-viewer-dialog"
    header={
      <div className="doc-viewer-header-row">
        <CustomDialogHeader docs={docs} activeIndex={activeIndex} />
        {docs.length > 0 && (
          <div className="doc-viewer-zoom" role="group" aria-label="Zoom">
            <Tooltip title="Zoom out">
              <span>
                <IconButton
                  size="small"
                  aria-label="Zoom out"
                  onClick={zoomOut}
                  disabled={zoom <= ZOOM_STEPS[0]}
                >
                  <ZoomOutIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Reset to fit">
              <button
                type="button"
                className="doc-viewer-zoom-label"
                onClick={resetZoom}
              >
                {Math.round(zoom * 100)}%
              </button>
            </Tooltip>
            <Tooltip title="Zoom in">
              <span>
                <IconButton
                  size="small"
                  aria-label="Zoom in"
                  onClick={zoomIn}
                  disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
                >
                  <ZoomInIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </div>
        )}
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
    appendTo={getPortalContainer} // REFACTOR: was `.pai-page || body`
    baseZIndex={22000}
    style={{ width: "80vw", height: "85vh", zIndex:2200 }}
    contentStyle={{ height: "100%", padding: 0 }}
    maximizable
    modal
    dismissableMask
    maximized={isMaximized}
    onMaximize={(e) => setIsMaximized(e.maximized)}
  >
    {docs.length === 0 ? (
      <p className="doc-viewer-empty-state">
        No document loaded. Pick a PDF, Word, Excel, PNG, JPG, TXT, JSON, LOG, MD, or email file above.
      </p>
    ) : (
      <DocViewerMaximizedContext.Provider value={isMaximized}>
       <DocViewerZoomContext.Provider value={zoom}>
        <DocViewer
          documents={docs}
          pluginRenderers={[
            CustomPNGView,
            CustomExcelView,
            CustomDocxView,
            CustomPDFView,
            CustomJPGView,
            CustomMailViewer,
            CustomTXTView,
          ]}
          onDocumentChange={(doc) => {
            const idx = docs.findIndex((d) => d.uri === doc.uri);
            if (idx !== -1 && idx !== activeIndex) {
              setActiveIndex(idx);
              setZoom(1); // new document → back to fit
            }
          }}
          config={{
            header: {
              disableHeader: false,
              disableFileName: true,
              retainURLParams: false,
            },
          }}
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
       </DocViewerZoomContext.Provider>
      </DocViewerMaximizedContext.Provider>
    )}
  </Dialog>
);
});

export default DocumentViewer;
