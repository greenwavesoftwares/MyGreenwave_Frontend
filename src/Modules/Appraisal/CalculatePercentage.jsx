import React from "react";
const CalculatePercentage = ({ current, proposed }) => {
  const percentage = (((proposed - current) / current) * 100).toFixed(1);
  return (
    <span
      style={{ color: percentage > 0 ? "#00cb00" : "red", marginLeft: "4px",fontWeight:600 }}
    >
      ({isNaN(percentage) ? 0 : percentage}%)
    </span>
  );
};

export default CalculatePercentage;
