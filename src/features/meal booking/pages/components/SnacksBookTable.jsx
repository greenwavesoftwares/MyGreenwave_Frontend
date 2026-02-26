import React from "react";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { ListOfSnacks, updateMeal } from "../../api/client";
import { useEffect, useRef, useState } from "react";
import { Tag } from "primereact/tag";
import Switch from "@mui/material/Switch";
import CartCounter from "./CardCouter";
import { LinearProgress } from "@mui/material";
import {
  showSuccessMessage,
} from "../../../../components/Toast/ShowMessage";
import { Toast } from "primereact/toast";
import { getUserData } from "../../../../Modules/Login/Encrypt";

function SnacksBookTable() {
  const [snacksList, setSnacksList] = useState([]);
  const [loader, setLoader] = useState(false);
  //const [weeklyCheck, setWeeklyCheck] = useState(false);
  //const [dataTableAPICall, setDataTableAPICall] = useState(null);

  //For Toast
  const toastRef = useRef(null);
  //Get User Token
  const { token } = getUserData();
  //List of Snack API Call
  async function fetchSnackData() {
    try {
      setLoader(true);
      const response = await ListOfSnacks(token);
      setSnacksList(response.data);
    } catch (error) {
      console.log("Failed to fetch snacks data", error);
    } finally {
      setLoader(false);
    }
  }

  //Use Effect to call snack data
  useEffect(() => {
    fetchSnackData();
  }, []);

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  //NOTE Meal Update (Toggle Button)
  async function handleMealOnChange(changeDate, checked, extraMeal) {
    console.log(
      "On_Change_Checked_Status",
      checked,
      changeDate,
      extraMeal,
      extraMeal > 0,
    );

    //Update Snacks
    const updateList = snacksList.map((ele) => {
      return ele.date === changeDate
        ? {
            ...ele,
            mealOn: ele.mealOn === 0 ? 1 : 0,
          }
        : ele;
    });
    setSnacksList(updateList);
    const response = await updateMeal(updateList, token);
    if (response.status === 200) {
      //NOTE Call Top 4 Card APi
      //  setCallDashboardApi((prev) => !prev);
      //NOTE Data Table API Call State
      //setDataTableAPICall(updateList);
      showSuccessMessage(toastRef, "Success", "Snack Booked Successfully");
    }
  }
  return (
    <>
      <DataTable
        size="small"
        emptyMessage={
          loader ? <LinearProgress color="inherit" /> : "No Data Found"
        }
        value={snacksList}
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
                rounded
                value={ele?.time.toLowerCase()=='es'?"Snacks":"NA"}
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
                checked={ele.mealOn > 0 ? true : false}
                onChange={() =>
                  handleMealOnChange(ele.date, ele.mealOn, ele.extraMeal)
                }
              />
            );
          }}
        ></Column>
      </DataTable>

      <Toast ref={toastRef} />
    </>
  );
}

export default SnacksBookTable;
