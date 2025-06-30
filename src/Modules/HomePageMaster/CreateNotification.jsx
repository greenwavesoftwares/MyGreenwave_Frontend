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

const CreateNotification = ({
  setCreateNotificationDialog,
  setCreateNotificationDialogProps,
}) => {
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
    if(data.fromdate > data.toDate) {
        return showErrorMessage(toastRef, "Error", "To Date must be greater than or equal to From Date");
      }
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
              className="inputFieldStyle"
              type="text"
              {...register("title", { required: "Title is required" })}
              placeholder="Title"
            />
            {errors.title && (
              <p style={{ color: "red", fontSize: "0.8rem" }}>
                {errors.title.message}
              </p>
            )}
            <input
              style={inputStyle}
              className="inputFieldStyle"
              type="text"
              {...register("notification", {
                required: "Notification is required",
              })}
              placeholder="Description"
            />
            {errors.notification && (
              <p style={{ color: "red", fontSize: "0.8rem" }}>
                {errors.notification.message}
              </p>
            )}
            <input
              style={inputStyle}
              className="inputFieldStyle"
              type="date"
              {...register("fromdate", { required: "From Date is required" })}
              onFocus={(e) => (e.target.type = "date")}
              onBlur={(e) => (e.target.type = "text")}
              placeholder="From Date"
              format="yyyy-MM-dd"
            />
            {errors.fromdate && (
              <p style={{ color: "red", fontSize: "0.8rem" }}>
                {errors.fromdate.message}
              </p>
            )}
            <input
              style={inputStyle}
              className="inputFieldStyle"
              type="date"
              {...register("toDate", { required: "To Date is required" })}
              onFocus={(e) => (e.target.type = "date")}
              onBlur={(e) => (e.target.type = "text")}
              placeholder="To Date"
              format="yyyy-MM-dd"
            />
            {errors.toDate && (
              <p style={{ color: "red", fontSize: "0.8rem" }}>
                {errors.toDate.message}
              </p>
            )}
            <input
              style={inputStyle}
              className="inputFieldStyle"
              type="text"
              {...register("url",{ required: "URL is required" })}
              placeholder="URL"
            />

            {errors.url && (
              <p style={{ color: "red", fontSize: "0.8rem" }}>
                {errors.url.message}
              </p>
            )}
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
