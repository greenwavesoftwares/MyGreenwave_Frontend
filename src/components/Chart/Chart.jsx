import { Chart } from "primereact/chart";
import React from "react";

const CustomChart = ({ style, type, data, options, className }) => {
  return (
    <>
      <Chart
        style={style}
        type={type}
        data={data}
        options={options}
        className={className}
      />
    </>
  );
};

export default CustomChart;
