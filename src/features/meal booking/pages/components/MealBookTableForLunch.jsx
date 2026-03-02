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
import { CheckCircle, XCircle } from "lucide-react";


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
      setMealList(response.data);
      console.log("list_meal_api_res", response.data, response, mealList);
      console.log("CheckArray", Array.isArray(response.data));
      //NOTE Weekly Check Status
      Array.isArray(response.data) &&
        response.data.map((ele) => {
          //Exclude Sunday And Saturday
          const day = new Date(ele.date).getDay();
          console.log("day", day);
          if (day != 0 && day != 6) {
            //console.log("Check_Meal", ele.Meal_On);
            if (ele.mealOn === 1) {
              count.push(ele.mealOn);
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

  //NOTE Add Extra Meal
  function handelExtraMeal(value) {
    return async function updateExtraMeal(count) {
      const updateList = mealList.map((ele) => {
        return ele.date === value.date
          ? {
              ...ele,
              extraMeal: count,
            }
          : ele;
      });
      const response = await updateMeal(updateList, token);
      if (response.status === 200) {
        //Call Meal All Data
        mealData();
        showSuccessMessage(
          toastRef,
          "Success",
          "Extra Meal Updated Successfully",
        );
      }
      //console.log("updateList", updateList);
    };
  }

  //NOTE Meal Update (Toggle Button)
  async function handleMealOnChange(changeDate, checked, extraMeal) {
    console.log(
      "On_Change_Checked_Status",
      checked,
      changeDate,
      extraMeal,
      extraMeal > 0,
    );
    //If Extra Meal Already Book
    if (checked && extraMeal > 0) {
      return showWarningMessage(toastRef, "Warning", "Extra Meal Already Book");
    }
    //Update Meal
    const updateList = mealList.map((ele) => {
      return ele.date === changeDate
        ? {
            ...ele,
            mealOn: ele.mealOn === 0 ? 1 : 0,
          }
        : ele;
    });
    console.log("Meal_UpdateList", updateList);
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
      setWeeklyCheck(true);
      const weekUpdateList = mealList.map((ele) => {
        if (
          new Date(ele.date).getDay() === 0 || new Date(ele.date).getDay() === 6
        ) {
          return {
            ...ele,
            //mealOn: 0,
          };
        }
        //Meal On Excepted Sunday And Saturday
        return {
          ...ele,
          mealOn: 1,
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
      //check if any extra meal already booked
      const hasExtraMeal = mealList.some((ele) => ele.extraMeal > 0);
      if (hasExtraMeal) {
        showWarningMessage(
          toastRef,
          "Warning",
          "Extra Meal Already Booked. Cannot disabled weekly booking.",
        );
        return;
      }
      //Status False
      setWeeklyCheck(false);
      //Weekly all meal set 0
      const weekMealOffData = mealList.map((ele) => {
        return {
          ...ele,
          mealOn: 0,
        };
      });
      try {
        //Update api call for meal off
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

  console.log("weeklyCheck", weeklyCheck);
  //console.log("mealList", mealList);

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
                severity={ele.mealOn > 0 ? "success" : "contrast"}
                icon={ele.scanned ? "pi pi-qrcode":"pi pi-times"}
                rounded
                value={ele.time}
              ></Tag>
            );
          }}
        ></Column>
        {/* <Column
          header="Scan Status"
          body={(ele) => {
            return (
              <Tag
                className="meal-app-tag"
                severity={ele.scanned? "success" : "warning"}
                icon="pi pi-user"
                rounded
                value={ele.scanned ? "Scanned":"Not Scanned"}
              ></Tag>
            );
          }}
        ></Column> */}
        
        <Column
          header="ON/OFF"
          body={(ele) => {
            return (
              <Switch
                name="Meal_On"
                size="small"
                checked={ele.mealOn > 0 ? true : false}
                onChange={() =>
                  handleMealOnChange(ele.date, ele.mealOn, ele.extraMeal)
                }
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
                count={ele.extraMeal ?? "NA"}
                checked={ele.mealOn > 0 ? true : false}
                updateExtraMeal={handelExtraMeal({
                  date: ele.date,
                  count: ele.extraMeal,
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
