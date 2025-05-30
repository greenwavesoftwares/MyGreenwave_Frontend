import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import React, { useEffect, useRef, useState } from "react";
import {
  showErrorMessage,
  showSuccessMessage,
} from "../../components/Toast/ShowMessage";
import { useForm } from "react-hook-form";
import { postCreateNotification } from "./HomePageAPI";
import { getUserData } from "../Login/Encrypt";

const CreateNotification = ({setCreateNotificationDialog,setCreateNotificationDialogProps}) => {
  const toastRef = useRef(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm();

  
  const newNotification = async (data) => {
    console.log("New Notification Data:", data);
    const notificationData = {
      ...data,
      rowId: "",
      type: "notification",
      filename: "",
      serverUrl: "",
      status: "",
    };
    const { token } = getUserData();
    //Call NOtification API
    const response = await postCreateNotification(token, notificationData);
    console.log("response:", response);
    if (response.status === 201) {
      showSuccessMessage(toastRef, `${data.title}`, "New Notification Added");
      setCreateNotificationDialog(false);
      setCreateNotificationDialogProps(notificationData);
    } else {
      showErrorMessage(toastRef, "", "Error");
    }
  };

  //Input Style
  const inputStyle = {
    border: "1px solid #eae0e0",
    borderRadius: "5px",
    fontSize: "14px",
    padding: "8px",
  };

  return (
    <div>
      <div>
        <form onSubmit={handleSubmit(newNotification)}>
          <div style={{ display: "grid", gap: "10px" }}>
            <input
              style={inputStyle}
              type="text"
              {...register("title", { required: "Title is required" })}
              placeholder="Title"
            />
            {errors.title?.message
              ? showErrorMessage(toastRef, `${errors.title?.message}`, "")
              : null}
            <input
              style={inputStyle}
              type="text"
              {...register("notification", {
                required: "Notification is required",
              })}
              placeholder="Description"
            />
            {errors.notification?.message
              ? showErrorMessage(
                  toastRef,
                  `${errors.notification?.message}`,
                  ""
                )
              : null}
            <input
              style={inputStyle}
              type="date"
              {...register("fromdate", { required: "From Date is required" })}
              onFocus={(e) => (e.target.type = "date")}
              onBlur={(e) => (e.target.type = "text")}
              placeholder="From Date"
              format="yyyy-MM-dd"
            />
            {errors.fromdate?.message
              ? showErrorMessage(toastRef, `${errors.fromdate?.message}`, "")
              : null}
            <input
              style={inputStyle}
              type="date"
              {...register("toDate", { required: "To Date is required" })}
              onFocus={(e) => (e.target.type = "date")}
              onBlur={(e) => (e.target.type = "text")}
              placeholder="To Date"
              format="yyyy-MM-dd"
            />
            {errors.toDate?.message
              ? showErrorMessage(toastRef, `${errors.toDate?.message}`, "")
              : null}
            <input
              style={inputStyle}
              type="text"
              {...register("url")}
              placeholder="URL"
            />

            {errors.eventImage?.message
              ? showErrorMessage(toastRef, `${errors.eventImage?.message}`, "")
              : null}
            <input
              style={{
                background: "#1e88e5",
                color: "white",
                borderRadius: "5px",
                padding: "5px",
              }}
              type="submit"
            />
          </div>
        </form>
        <Toast ref={toastRef} />
      </div>
    </div>
  );
};
export default CreateNotification;
