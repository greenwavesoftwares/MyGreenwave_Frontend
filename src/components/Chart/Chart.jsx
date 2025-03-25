import { Chart } from "primereact/chart";
import React from "react";

const CustomChart = ({ style, type, data, options }) => {
  return (
    <>
      <Chart style={style} type={type} data={data} options={options} />
    </>
  );
};

export default CustomChart;
