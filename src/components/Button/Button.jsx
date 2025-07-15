import { Button } from "primereact/button";
import React from "react";
import 'primeicons/primeicons.css';

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
  tooltip,
  style

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
      tooltip={tooltip}
      style={style}
    />
  );
};

export default CustomButton;
