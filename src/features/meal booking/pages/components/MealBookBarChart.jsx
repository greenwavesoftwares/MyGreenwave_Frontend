import React, { useEffect, useState } from "react";
import { Chart } from "primereact/chart";

export default function MealBookBarChart({ allChartData }) {
  const [chartData, setChartData] = useState(null);
  const [chartOptions, setChartOptions] = useState({});

  //Get Current Theme
  const theme=localStorage.getItem("Theme")
  console.log("current_theme",theme);

  console.log("allChartData",allChartData);

  useEffect(() => {
    if (!Array.isArray(allChartData) || allChartData.length === 0) return;

    //Filter Lunch Data
    const lunchData = allChartData.filter((ele) => ele?.time === "Lunch");
    //Filter Snacks Data
    const snacksData = allChartData.filter((ele) => ele?.time === "ES");

    //X axis label
    const xAxisLabels = lunchData.map((ele) => ele.date);
    //Y1 axis data
    const y1AxisData = lunchData.map((ele) => Number(ele.meals));
    //Y1 axis data
    const y2AxisData = snacksData.map((ele) => Number(ele.meals));

    const documentStyle = getComputedStyle(document.documentElement);
    
    //X and Y Axis Color
    const textColor = documentStyle.getPropertyValue("--chart-axis-color").trim();
    const surfaceBorder = documentStyle.getPropertyValue("--surface-border");
   

    //set chart data
    setChartData({
      labels: xAxisLabels,
      datasets: [
        {
          label: "Lunch",
          backgroundColor: ["rgba(75, 192, 192, 0.2)"],
          borderColor: ["rgb(75, 192, 192)"],
          borderWidth: 1,
          data: y1AxisData,
        },
        {
          label: "Snacks",
          backgroundColor: ["rgba(255, 159, 64, 0.2)"],
          borderColor: ["rgb(255, 159, 64)"],
          borderWidth: 1,
          data: y2AxisData,
        },
      ],
    });

    setChartOptions({
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: textColor,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColor,
            font: { weight: 500 },
        
          },
          grid: { display: false },
        },
        y: {
          ticks: { color: textColor },
          grid: { color: surfaceBorder },
        },
      },
    });
  }, [allChartData]);

  if (!chartData) return <p>Loading chart...</p>;


  return (
    <Chart type="bar" data={chartData} options={chartOptions} height="300" />
  );
}
