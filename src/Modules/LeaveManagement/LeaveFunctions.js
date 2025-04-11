import React from 'react';
import { ProductService } from '../../Services/ProductService';
import { getDataOnLoad } from './LeaveManagementAPI';
import { format } from "date-fns";

const onPageLoad = async(userId,year) => {
    const leaveData={chartData:{},tableData:[],cardData:{}};
    let value=await getDataOnLoad(userId,year);
    leaveData.chartData= await setChartData(value.attendanceLeaveCount);
    leaveData.tableData= value.userLeaves;
    leaveData.cardData= value.userLeaveCounts;
    return leaveData;
    // downloadZip();
}
const getCurrentDate = () => {
    const currentDate=new Date();
    return currentDate;
}
const getYearList=()=>{
  let year=2023;
  const yearList=[];
  for(let i=year;i<=format(new Date(),"yyyy");i++){
    yearList.push(i);
  }
  return yearList;
}
const setChartData = async (chartData) => {
    let month=[],workingDay=[],attendance=[],leave=[],cumulativeLeave=[];
    chartData.map((p)=>{
        month.push(p.monthName);
        workingDay.push(p.workingDay);
        attendance.push(p.attendance);
        leave.push(p.leave);
        cumulativeLeave.push(p.cumulative_Leave);
    });

    const dataOptions={data:{},options:{}};

    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue("--text-color");
    const textColorSecondary = documentStyle.getPropertyValue(
      "--text-color-secondary"
    );
    const data = {
      labels: month,
      datasets: [
        {
          type: "bar",
          label: "Working Day",
          backgroundColor: documentStyle.getPropertyValue("--yellow-300"),
          data: workingDay,
          borderColor: "white",
          borderWidth: 2,
          order: 2
        },
        {
          type: "bar",
          label: "Attendence",
          backgroundColor: documentStyle.getPropertyValue("--blue-500"),
          data: attendance,
          borderColor: "white",
          borderWidth: 2,
          order: 2
        },
        {
          type: "bar",
          label: "Leave",
          backgroundColor: documentStyle.getPropertyValue("--red-500"),
          data: leave,
          order: 2
        },
        {
            type: "line",
            label: "Cumulative Leave",
            borderColor: documentStyle.getPropertyValue("--green-500"),
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            data: cumulativeLeave,
            order: 1
        }
      ],
    };

    const options = {
        maintainAspectRatio: false,
        aspectRatio: 0.6,
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
              color: textColorSecondary,
            },
            grid: {
              display: false,
            },
          },
          y: {
            ticks: {
              color: textColorSecondary,
            },
            grid: {
              display: false,
            },
          },
        },
    };
    dataOptions.data=data;
    dataOptions.options=options;

    return dataOptions;
}

export {getCurrentDate,onPageLoad,getYearList}