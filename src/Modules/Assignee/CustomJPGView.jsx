import React from "react";

const CustomJPGView = ({ mainState: { currentDocument } }) => {
  if (!currentDocument) return null;
  

  return (
    <div id="my-jpg-renderer">
      <img id="jpg-img" src={currentDocument.fileData} />
    </div>
  );
};

CustomJPGView.fileTypes = ["jpg", "image/jpeg"];
CustomJPGView.weight = 1;

export default CustomJPGView;