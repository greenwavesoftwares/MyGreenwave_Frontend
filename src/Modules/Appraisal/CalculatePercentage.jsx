import React from "react";

const CalculatePercentage = ({ current, proposed }) => {
  if (proposed <= 0 || current <= 0) {
    return (
      <span style={{ color: "red", marginLeft: "4px", fontWeight: 600 }}>
        (NA)
      </span>
    );
  }

  const rawPercentage = ((proposed - current) / current) * 100;

  if (isNaN(rawPercentage)) {
    return (
      <span style={{ color: "red", marginLeft: "4px", fontWeight: 600 }}>
        (0%)
      </span>
    );
  }

  return (
    <span
      style={{
        color: rawPercentage > 0 ? "#00cb00" : "red",
        marginLeft: "4px",
        fontWeight: 600,
      }}
    >
      ({rawPercentage.toFixed(1)}%)
    </span>
  );
};

export default CalculatePercentage;
