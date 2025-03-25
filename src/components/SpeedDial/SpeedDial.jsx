import { SpeedDial } from "primereact/speeddial";
import React from "react";

const CustomSpeedDial = ({ radius, style, showIcon, hideIcon, onClick }) => {
  return (
    <>
      <SpeedDial
        radius={radius}
        style={style}
        showIcon={showIcon}
        hideIcon={hideIcon}
        onClick={onClick}
      />
    </>
  );
};

export default CustomSpeedDial;
