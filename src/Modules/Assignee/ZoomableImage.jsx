import React from "react";
import "./CustomViews.css";
import { useDocViewerZoom } from "./DocViewerMaximizedContext";

/**
 * Image that fits the viewer at zoom 1, shrinks below it, and grows past it
 * (the container scrolls). Shared by the PNG and JPG renderers.
 */
const ZoomableImage = ({ src, id, alt = "" }) => {
  const zoom = useDocViewerZoom();

  const style =
    zoom > 1
      ? { width: `${zoom * 100}%`, height: "auto", maxWidth: "none", maxHeight: "none" }
      : { width: "auto", height: "auto", maxWidth: `${zoom * 100}%`, maxHeight: `${zoom * 100}%` };

  return (
    <div className="doc-image-renderer">
      <img id={id} className="doc-image" src={src} alt={alt} style={style} />
    </div>
  );
};

export default ZoomableImage;
