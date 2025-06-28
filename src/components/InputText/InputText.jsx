import { InputText } from "primereact/inputtext";
import React, { useEffect, useState } from "react";

const CustomInputText = ({
  value,
  onChange,
  placeholder,
  size = "small",
  className,
  id,
  name,

  type,

  required = true,
  disabled = false,
}) => {
  const [sizeClassName, setSizeClassName] = useState("");
  useEffect(() => {
    switch (size.toLowerCase()) {
      case "small":
        setSizeClassName("p-inputtext-sm");
        break;
      case "large":
        setSizeClassName("p-inputtext-lg");
        break;
      default:
        setSizeClassName("");
        break;
    }
  }, [size]);
  return (
    <InputText
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`${sizeClassName} ${className}`}
      id={id}
      type={type}
      required={required}
      disabled={disabled}
    />
  );
};

export default CustomInputText;
