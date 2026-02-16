import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { ListOfMeals, updateMeal } from "../../api/client";
import { useEffect, useRef, useState } from "react";
import { Tag } from "primereact/tag";
import Switch from "@mui/material/Switch";
import CartCounter from "./CardCouter";
import { LinearProgress } from "@mui/material";
import {
  showErrorMessage,
  showInfoMessage,
  showSuccessMessage,
  showWarningMessage,
} from "../../../../components/Toast/ShowMessage";
import { Toast } from "primereact/toast";
import { getUserData } from "../../../../Modules/Login/Encrypt";

function MealBookTableForLunch({ setCallDashboardApi }) {
  const [mealList, setMealList] = useState([]);
  const [loader, setLoader] = useState(false);
  const [weeklyCheck, setWeeklyCheck] = useState(false);
  const [dataTableAPICall, setDataTableAPICall] = useState(null);

  //For Toast
  const toastRef = useRef(null);
  //Get User Token
  const { token } = getUserData();
  //List of Meals API Call
  async function mealData() {
    try {
      let count = [];
      setLoader(true);
      const response = await ListOfMeals(token);
      setMealList(response[0]);
      console.log("list_meal_api_res", response);
      //NOTE Weekly Check Status
      Array.isArray(response) &&
        response?.map((ele) => {
          //Exclude Sunday And Saturday
          const day = new Date(ele.Date).getDay();
          if (day != 0 && day != 6) {
            //console.log("Check_Meal", ele.Meal_On);
            if (ele.Meal_On === 1) {
              count.push(ele.Meal_On);
            }
          }
        });
      console.log("count", count);
      //Toggle on if all day meal already book or on change meal book
      if (count.length === 5) {
        setWeeklyCheck(true);
      }
      //Toggle of
      else if (count.length >= 5) {
        setWeeklyCheck(false);
      } else {
        setWeeklyCheck(false);
      }
    } catch (error) {
      console.log("Failed to fetch data", error);
    } finally {
      setLoader(false);
    }
  }

  //Use Effect to call meal data
  useEffect(() => {
    mealData();
  }, [dataTableAPICall]);

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  //Add Extra Meal
  function handelExtraMeal(value) {
    return async function updateExtraMeal(count) {
      const updateList = mealList.map((ele) => {
        return ele.Date === value.date
          ? {
              ...ele,
              Extra_Meal: count,
            }
          : ele;
      });
      const response = await updateMeal(updateList, token);
      if (response.status === 200) {
        showSuccessMessage(
          toastRef,
          "Success",
          "Extra Meal Updated Successfully",
        );
      }
      console.log("updateList", updateList);
    };
  }

  //Meal Update (Toggle Button)
  async function handleMealOnChange(changeDate, checked) {
    console.log("On_Change_Checked_Status", checked,changeDate);
    const updateList = mealList.map((ele) => {
      return ele.date === changeDate
        ? {
            ...ele,
            meal_On: ele.meal_On === 0 ? 1 : 0,
          }
        : ele;
    });
    console.log("updateList",updateList);
    setMealList(updateList);
    const response = await updateMeal(updateList, token);
    if (response.status === 200) {
      //NOTE Call Top 4 Card APi
      setCallDashboardApi((prev) => !prev);
      //NOTE Data Table API Call State
      setDataTableAPICall(updateList);
      showSuccessMessage(toastRef, "Success", "Meal Booked Successfully");
    }
  }

  //IMPORTANT Weekend Meal Book
  async function handleWeekendMealBooking(checked) {
    //NOTE Weekly Meal ON
    if (checked) {
      setWeeklyCheck(true)
      const weekUpdateList = mealList.map((ele) => {
        if (
          new Date(ele.Date).getDay() === 0 ||
          new Date(ele.Date).getDay() === 6
        ) {
          return {
            ...ele,
            Meal_On: 0,
          };
        }
        return {
          ...ele,
          Meal_On: 1,
        };
      });

      try {
        //Update api call
        const response = await updateMeal(weekUpdateList, token);
        if (response.status === 200) {
          setMealList(weekUpdateList);
          
          showInfoMessage(toastRef, "Success", "Meals booked for the week");
        }
      } catch (error) {
        console.log("Weekend meal book error", error);
        showErrorMessage(toastRef, "Error", `${error.message}`);
      }
    }
    //NOTE Weekly Meal OFF
    else {
       setWeeklyCheck(false)
      const weekMealOffData = mealList.map((ele) => {
        return {
          ...ele,
          Meal_On: 0,
        };
      });
      try {
        //Update api call
        const response = await updateMeal(weekMealOffData, token);
        if (response.status === 200) {
          setMealList(weekMealOffData);
          showWarningMessage(
            toastRef,
            "Warning",
            "Meals are turned off for the entire week",
          );
        }
      } catch (error) {
        console.log("Weekend meal off failed", error);
        showErrorMessage(toastRef, "Error", `${error.message}`);
      }
      console.log("weekMealOffData", weekMealOffData);
    }
  }

  console.log("weeklyCheck",weeklyCheck);

  return (
    <>
      <DataTable
        size="small"
        header={
          <>
            <div className="flex justify-between items-center">
              <p>Meal Booking</p>
              <>
                <div className="flex items-center">
                  <p>*Weekly Booking</p>
                  <Switch
                    size="small"
                    checked={weeklyCheck}
                    onChange={(e) => {
                      handleWeekendMealBooking(e.target.checked);
                    }}
                  />
                </div>
              </>
            </div>
          </>
        }
        emptyMessage={
          loader ? <LinearProgress color="inherit" /> : "No Data Found"
        }
        value={mealList}
        showGridlines
        stripedRows
        className="dataTableHeader dataTableBody dataTableBodyPadding"
      >
        <Column
          header="Date"
          body={(ele) => {
            return <p>{ele.date}</p>;
          }}
        ></Column>
        <Column
          header="Day"
          body={(ele) => {
            return <p>{days[new Date(ele.date).getDay()]}</p>;
          }}
        ></Column>
        <Column
          header="Time"
          body={(ele) => {
            return (
              <Tag
                className="meal-app-tag"
                severity={ele.meal_On > 0 ? "success" : "contrast"}
                rounded
                value={ele.time}
              ></Tag>
            );
          }}
        ></Column>
        <Column
          header="ON/OFF"
          body={(ele) => {
            return (
              <Switch
                name="Meal_On"
                size="small"
                checked={ele.meal_On > 0 ? true : false}
                onChange={() => handleMealOnChange(ele.date, ele.meal_On)}
              />
            );
          }}
        ></Column>
        {/* <Column
          header="Roti"
          body={(ele) => {
            return (
              <Switch size="small" checked={ele.roti > 0 ? true : false} />
            );
          }}
        ></Column> */}
        <Column
          header="Additional Meals"
          body={(ele) => {
            return (
              <CartCounter
                count={ele.extra_Meal ??"NA"}
                checked={ele.meal_On > 0 ? true : false}
                updateExtraMeal={handelExtraMeal({
                  date: ele.date,
                  count: ele.extra_Meal,
                })}
              />
            );
          }}
        ></Column>
      </DataTable>

      <Toast ref={toastRef} />
    </>
  );
}

export default MealBookTableForLunch;
