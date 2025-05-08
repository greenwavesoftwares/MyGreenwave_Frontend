import { SpeedDial } from "primereact/speeddial";
import { Tooltip } from "primereact/tooltip";
import React, { useEffect, useState } from "react";

const CustomSpeedDial = ({
  radius,
  style,
  showIcon,
  hideIcon,
  onClick,
  model,
  className,
  direction = "down-right",
}) => {
  const [tooltipTarget, setTooltipTarget] = useState("");
  const [speedDialClassName, setSpeedDialClassName] = useState(className);
  const [tooltipPosition, settooltipPostion] = useState("left");
  useEffect(() => {
    let tooltipClass = "";
    switch (direction.trim().toLowerCase()) {
      case "down-right":
        tooltipClass = "speeddial-bottom-right";
        settooltipPostion("left");
        break;
    }
    setTooltipTarget(`.${tooltipClass} .p-speeddial-action`);
    setSpeedDialClassName(`${tooltipClass} ${speedDialClassName}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <Tooltip target={tooltipTarget} position={tooltipPosition} />
      <SpeedDial
        radius={radius}
        style={style}
        showIcon={showIcon}
        hideIcon={hideIcon}
        onClick={onClick}
        model={model}
        className={speedDialClassName}
      />
    </>
  );
};

export default CustomSpeedDial;
