import { createContext, useContext } from "react";

// Carries `isMaximized` to plugin renderers (CustomPDFView etc.) WITHOUT
// putting it on the document objects passed to <DocViewer documents={...}>.
//
// Why this exists: react-doc-viewer's AppProvider does
//   useEffect(() => dispatch(setAllDocuments(documents)), [documents])
// — any new `documents` ARRAY REFERENCE (even with identical uris) makes
// it re-run, which replaces currentDocument with a fresh object that has
// no `fileType`/`fileData` yet. The effect that's supposed to re-fetch
// fileType only depends on [currentFileNo, documentURI], neither of which
// changes when you just toggle maximize — so fileType never comes back,
// CurrentRenderer stays undefined, and ProxyRenderer renders nothing,
// permanently. Keeping `documents` a stable reference and passing
// isMaximized through context instead avoids triggering that reset.
export const DocViewerMaximizedContext = createContext(false);

export const useDocViewerMaximized = () => useContext(DocViewerMaximizedContext);


// Zoom level for the document body (1 = fit to the viewer, 0.5 = 50%, 2 = 200%).
// Same reason as above for living in context: it must reach the plugin
// renderers WITHOUT touching the `documents` array passed to <DocViewer>.
export const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
export const DocViewerZoomContext = createContext(1);
export const useDocViewerZoom = () => useContext(DocViewerZoomContext);
