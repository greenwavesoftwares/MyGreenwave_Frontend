import { Calendar } from "primereact/calendar";
import "./DatePicker.css"; // Import your custom CSS file
import React, { useEffect, useState } from "react";

const DatePicker = ({
  value,
  onChange,
  selectionMode,
  readOnlyInput,
  hideOnRangeSelection,
  disabledDays,
  minDate,
  showIcon,
  dateFormat,
  invalid,
  disabled,
  inputClassName,
  disabledDates,
  size = "small",
  placeholder = "Select a date",
  maxDate,
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
    <div className="calendar-wrapper">
      <Calendar
        value={value}
        onChange={onChange}
        selectionMode={selectionMode}
        readOnlyInput={readOnlyInput}
        hideOnRangeSelection={hideOnRangeSelection}
        disabledDays={disabledDays}
        className="calendar calendarStyle"
        placeholder={placeholder}
        minDate={minDate}
        showIcon={showIcon}
        dateFormat={dateFormat}
        invalid={invalid}
        disabled={disabled}
        inputClassName={`${sizeClassName} ${inputClassName}`}
        disabledDates={disabledDates}
        maxDate={maxDate}
      />
    </div>
  );
};

export default DatePicker;
