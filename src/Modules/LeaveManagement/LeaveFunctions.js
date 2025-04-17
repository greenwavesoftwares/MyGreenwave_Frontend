import { getDataOnLoad } from './LeaveManagementAPI';
import { format, parse } from "date-fns";
import { getHolidays } from '../HolidayMaster/HolidayAPI';

const dateformat='yyyy-MM-dd';

const onPageLoad = async(userId,year) => {
  const leaveData={chartData:{},tableData:[],cardData:{},calenderData:{},holidays:{}};
  let value=await getDataOnLoad(userId,year);
  let holidays= await getHolidays();
  leaveData.chartData= await setChartData(value.attendanceLeaveCount);
  leaveData.tableData= value.userLeaves;
  leaveData.cardData= value.userLeaveCounts;
  leaveData.calenderData= await setCalenderData(value.userLeaves,holidays.holiday);
  leaveData.holidays=holidays.holiday;
  return leaveData;
  // downloadZip();
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
const setCalenderData= async (userLeaves,holidays)=>{
  let calenderDataList=[];
  userLeaves.map(row=>{
    let calenderData={};
    calenderData.start= row.fromDate;
    calenderData.end= (row.actualLeave>1)?getNextDate(row.toDate):row.toDate;
    calenderData.color= getColorBySeverity(row.severity);
    calenderData.overlap= false;
    calenderData.display= "background";
    calenderData.id= row.reason;

    calenderDataList.push(calenderData);
  });

  holidays.map(row=>{
    let calenderData={};
    calenderData.start= row.fromDate;
    calenderData.end= (row.totalNoOfDays>1)?getNextDate(row.toDate):row.toDate;
    calenderData.color= getColorBySeverity("info");
    calenderData.overlap= false;
    calenderData.display= "background";
    calenderData.id= row.holidays;

    calenderDataList.push(calenderData);
  });

  return calenderDataList;
}


const getNextDate=(date)=>{
  let parsedDate=parse(date, dateformat, new Date());
  parsedDate.setDate(parsedDate.getDate()+1);
  return format(parsedDate,dateformat);
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
const getColorBySeverity=(severity)=>{
  const documentStyle = getComputedStyle(document.documentElement);
  let color="";
  switch (severity) {
    case "success" : color=documentStyle.getPropertyValue("--green-500"); break;
    case "warning" : color=documentStyle.getPropertyValue("--yellow-300"); break;
    case "danger" : color=documentStyle.getPropertyValue("--red-500"); break;
    case "info" : color=documentStyle.getPropertyValue("--blue-500"); break;
    default: color=""; break;
  }
  return color;
}

export {getCurrentDate,onPageLoad,getYearList}