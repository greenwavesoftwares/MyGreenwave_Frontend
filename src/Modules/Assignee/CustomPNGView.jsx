import React from "react";

const CustomPNGView = ({ mainState: { currentDocument } }) => {
  if (!currentDocument) return null;

  return (
    <div id="my-png-renderer">
      <img id="png-img" src={currentDocument.fileData} />
    </div>
  );
};

CustomPNGView.fileTypes = ["png", "image/png"];
CustomPNGView.weight = 1;

export default CustomPNGView;