import React from "react";
import ZoomableImage from "./ZoomableImage";

const CustomPNGView = ({ mainState: { currentDocument } }) => {
  if (!currentDocument) return null;
  return <ZoomableImage id="png-img" src={currentDocument.fileData} />;
};

CustomPNGView.fileTypes = ["png", "image/png"];
CustomPNGView.weight = 1;

export default CustomPNGView;
