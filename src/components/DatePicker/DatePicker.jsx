import React, { useState } from "react";
import { Calendar } from "primereact/calendar";
import "./DatePicker.css"; // Import your custom CSS file

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
}) => {
  return (
    <div className="calendar-wrapper">
      <Calendar
        value={value}
        onChange={onChange}
        selectionMode={selectionMode}
        readOnlyInput={readOnlyInput}
        hideOnRangeSelection={hideOnRangeSelection}
        disabledDays={disabledDays}
        className="calendar"
        placeholder="Select a date" // Hint text here
        minDate={minDate}
        showIcon={showIcon}
        dateFormat={dateFormat}
        invalid={invalid}
        disabled={disabled}
      />
    </div>
  );
};

export default DatePicker;
