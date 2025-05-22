import { Button } from "primereact/button";
import React from "react";

const CustomButton = ({
  icon,
  rounded,
  outlined,
  severity,
  disabled,
  onClick,
  size = "small",
  label,
  className,
}) => {
  return (
    <Button
      icon={icon}
      rounded={rounded}
      outlined={outlined}
      severity={severity}
      disabled={disabled}
      onClick={onClick}
      size={size}
      label={label}
      className={className}
    />
  );
};

export default CustomButton;
