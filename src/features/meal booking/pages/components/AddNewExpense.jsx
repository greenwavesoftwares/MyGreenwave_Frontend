import { useEffect, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { Controller, useForm } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { addNewExpense } from "../../api/admin";
import { getUserData } from "../../../../Modules/Login/Encrypt";
import { Toast } from "primereact/toast";
import {
  showErrorMessage,
  showSuccessMessage,
  showWarningMessage,
} from "../../../../components/Toast/ShowMessage";
import Button from "@mui/material/Button";
//For Prevent Re-Render
import { memo } from "react";

function AddNewExpense({
  setReloadExpenseData,
  selectRowData,
  setSelectRowData,
  visible,
  setVisible,
}) {

  //React Hooks Form
  const { register, control, handleSubmit, reset, setValue } = useForm();
  //Get User Token
  const { token } = getUserData();
  //For Toast
  const toastRef = useRef(null);

  //Time Options
  const timeOptions = ["Lunch", "ES"];

  //Formate Date
  const formatDateLocal = (date) => {
    if (!date) return null;

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    return `${y}-${m}-${d}`;
  };
  //Add New Expense
  async function handleAddNewExpense(ele) {
    setReloadExpenseData(false);
    const data = {
      date: formatDateLocal(ele.date),
      time: ele.time,
      expense: ele.expense,
      breakup: ele.breakup,
      details: ele.details,
    };
    if(ele.expense <=0 ){
      return showWarningMessage(toastRef,"Waring","The expense value must be greater than zero")
    }
    try {
      const response = await addNewExpense(token, data);
      if (response.status === 200) {
        //TODO Update Data Call in same post api 
        showSuccessMessage(toastRef, "Success", "New Expense Added");
        //Reset Form
        reset();
        setSelectRowData(null)
        //Dialog Visible
        //small delay lets toast render
        setTimeout(() => {
          setVisible(false);
          setReloadExpenseData(true);
        }, 500);
      }
    } catch (error) {
      console.log("Failed to insert data", error.message);
      showErrorMessage(toastRef, "Error", `${error.message}`);
    }
  }

  //Selected Row Value
  useEffect(() => {
    //If Select Row Data Present
    if (selectRowData) {
      setValue("date", new Date(selectRowData.date));
      setValue("time", selectRowData.time);
      setValue("expense", selectRowData.expense);
      setValue("breakup", selectRowData.breakup);
      setValue("details", selectRowData.details);
    }
  }, [selectRowData, setValue]);

  console.log("Select_Row_Data", selectRowData);
  // console.log("Child_Dialog_Visible_State",setVisible)

  return (
    <>
    <Toast ref={toastRef} />
      <div className="card flex justify-content-center">
        <Dialog
          header={selectRowData ? "Update Expense" : "Add New Expense"}
          visible={visible}
          style={{ width: "20rem" }}
          onHide={() => {
            if (!visible) return;
            setVisible(false);
            setSelectRowData(null)
            //Reset Form
            reset();
          }}
          className="dialogHeader dialogContent"
        >
          <form
            className="grid gap-2 pt-3 px-2"
            onSubmit={handleSubmit((ele) => handleAddNewExpense(ele))}
          >
            <Controller
              name="date"
              control={control}
              rules={{ required: "Date is required" }}
              render={({ field }) => (
                <Calendar
                  {...field}
                  dateFormat="yy-mm-dd"
                  showIcon
                  placeholder="Select Date"
                  className="calendarStyle w-full"
                />
              )}
            />
            <Controller
              name="time"
              control={control}
              rules={{ required: "Time is required" }}
              render={({ field }) => (
                <Dropdown
                  options={timeOptions}
                  required
                  className="dropDownStyle w-full"
                  placeholder="Select Time"
                  {...field}
                />
              )}
            />
            <InputText
              className="inputFieldStyle w-full"
              placeholder="Enter Expense Amount"
              required
              {...register("expense", {
                minLength: 1,
              })}
              type="number"
            />
            <InputText
              className="inputFieldStyle w-full"
              placeholder="Expense breakup"
              {...register("breakup")}
              type="text"
            />
            <InputText
              className="inputFieldStyle w-full"
              {...register("details")}
              placeholder="Additional details"
              type="text"
            />
            <Button
              variant="contained"
              sx={{ boxShadow: "none" }}
              size="small"
              type="submit"
            >
              {selectRowData ? "Update Expense" : " Add Expense"}
            </Button>
          </form>
        </Dialog>
        
      </div>
    </>
  );
}

export default memo(AddNewExpense);
