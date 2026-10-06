// Import React and required hooks
import React, { useEffect, useRef, useState } from "react";

// Import PDF.js library for loading and rendering PDF files
import * as pdfjsLib from "pdfjs-dist";

// Import the PDF worker file URL (used by PDF.js for background processing)
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

import "./CustomViews.css";
import {
  useDocViewerMaximized,
  useDocViewerZoom,
} from "./DocViewerMaximizedContext";

// Configure PDF.js to use the imported worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

/**
 * Custom PDF Viewer Component
 * Renders every page of a PDF as a vertically scrollable list of canvases.
 * currentDocument.fileData contains the PDF as a data URI.
 */
const CustomPDFView = ({ mainState: { currentDocument } }) => {
  // Reference to the container where canvases will be appended
  const containerRef = useRef(null);

  // Stores any rendering/loading errors
  const [error, setError] = useState(null);

  // Read from context, NOT currentDocument.isMaximized — the `documents`
  // array fed to <DocViewer> has to stay a stable reference across
  // maximize/restore (see DocumentViewer.jsx for why), so isMaximized can
  // no longer be spread onto each document object.
  const isMaximized = useDocViewerMaximized();

  // Zoom is applied instantly via CSS (the canvases are width:100% of a
  // container sized to zoom * 100%). The pages are only re-rendered at a
  // higher resolution when zoom crosses a bucket threshold, so zooming
  // stays smooth and text stays sharp.
  const zoom = useDocViewerZoom();
  const resolutionBoost = zoom <= 1.25 ? 1 : zoom <= 2 ? 1.6 : 2.2;

  // Runs whenever the selected document (or maximized state) changes
  useEffect(() => {
    // Exit if no document is selected
    if (!currentDocument) return;

    // Flag to prevent state updates after component unmounts
    let cancelled = false;

    // Function responsible for loading and rendering the PDF
    const renderPdf = async () => {
      try {
        // Load the PDF document
        const pdf = await pdfjsLib.getDocument(currentDocument.fileData)
          .promise;

        // Stop if component has already unmounted
        if (cancelled) return;

        // Get the container element
        const container = containerRef.current;

        // First render of this document → append pages as they finish.
        // Re-render at a new resolution → build off-screen and swap in one go,
        // so the view doesn't flash empty or lose its scroll position.
        const isRerender = container.childElementCount > 0;
        const fragment = isRerender ? document.createDocumentFragment() : null;

        // Loop through every page in the PDF
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          // Load the current page
          const page = await pdf.getPage(pageNum);
          const scale = (isMaximized ? 3 : 2.5) * resolutionBoost;

          // Create a viewport (controls page size and zoom level)
          const viewport = page.getViewport({ scale });

          // Create a canvas element for rendering the page
          const canvas = document.createElement("canvas");

          // Set canvas dimensions equal to page dimensions
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          // Apply canvas styling via a themed CSS class instead of inline
          // styles (box-shadow now respects light/dark via --boxShadowPaper)
          canvas.className = "doc-pdf-canvas";

          // Get the 2D drawing context
          const ctx = canvas.getContext("2d");

          // Render the PDF page onto the canvas
          await page.render({
            canvasContext: ctx,
            viewport,
          }).promise;

          // Stop rendering if component has unmounted
          if (cancelled) return;

          // Add the rendered page to the container (or the off-screen fragment)
          (fragment || container).appendChild(canvas);
        }

        if (fragment) container.replaceChildren(fragment);
      } catch (err) {
        // Display error only if component is still mounted
        if (!cancelled) {
          setError(err.message || "Failed to render PDF");
        }
      }
    };

    // Start rendering the PDF
    renderPdf();

    // Cleanup function executed when component unmounts
    // or before rendering a different document
    return () => {
      cancelled = true;
    };
  }, [currentDocument, isMaximized, resolutionBoost]); // Re-run when doc, maximized state or zoom bucket changes

  // Render nothing if no document is selected
  if (!currentDocument) return null;

  return (
    <div id="my-pdf-renderer" className="doc-pdf-renderer">
      {/* Display error message if rendering fails */}
      {error ? (
        <p className="doc-pdf-error">{error}</p>
      ) : (
        // Container where PDF page canvases will be inserted
        <div
          ref={containerRef}
          className="doc-pdf-pages"
          style={{ width: `${zoom * 100}%` }}
        />
      )}
    </div>
  );
};

// Supported file extensions
CustomPDFView.fileTypes = ["pdf", "application/pdf"];

// Priority of this viewer among available document viewers
CustomPDFView.weight = 1;

// Export the component
export default CustomPDFView;
