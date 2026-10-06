import React from "react";
import ZoomableImage from "./ZoomableImage";

const CustomJPGView = ({ mainState: { currentDocument } }) => {
  if (!currentDocument) return null;
  return <ZoomableImage id="jpg-img" src={currentDocument.fileData} />;
};

CustomJPGView.fileTypes = ["jpg", "image/jpeg"];
CustomJPGView.weight = 1;

export default CustomJPGView;
