import { Typography } from "@mui/material";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import {
  showErrorMessage,
  showSuccessMessage,
} from "../../components/Toast/ShowMessage";
import { putUpdateEvent, postCreateEvent } from "./HomePageAPI";
import { getUserData } from "../Login/Encrypt";
const CreateEvent = ({
  selectRowEventData,
  setVisible,
  setUpdateEventDataProps,
  setCreateEventDataProps,
}) => {
  //For Toast
  const toastRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm();

  const newEvent = async (data) => {
    const { token } = getUserData();
    if (selectRowEventData) {
      //console.log("Update Event Data:", data);
      //Update API Call
      const updateEventData = {
        ...data,
        rowId: selectRowEventData.rowId,
        type: selectRowEventData.type,
        filename: selectRowEventData.filename,
        serverUrl: selectRowEventData.serverUrl,
        status: selectRowEventData.status,
      };
      //console.log("Update Event Data:", updateEventData);
      const upDateEvent = await putUpdateEvent(token, updateEventData);
      //console.log("Update Event Response:", upDateEvent);
      if (upDateEvent.status === 201) {
        showSuccessMessage(
          toastRef,
          `${data.title}`,
          "Event Updated Successfully"
        );
        setUpdateEventDataProps(updateEventData);
        setVisible(false);
        reset();
      } else {
        showErrorMessage(toastRef, "Error", "Failed to Update Event");
      }
    } else {
      //reset(selectRowEventData);
      const createNewEvent = {
        rowId: "",
        title: data.title,
        notification: data.notification,
        fromdate: data.fromdate,
        toDate: data.toDate,
        url: data.url,
        type: "event",
        filename: "",
        serverUrl: "",
        status: "",
      };
      //console.log("date",data.fromdate,data.toDate);
      if(data.fromdate > data.toDate) {
        return showErrorMessage(toastRef, "Error", "To Date must be greater than or equal to From Date");
      }
      // Build FormData for file upload
      const formData = new FormData();
      formData.append(
        "data",
        new Blob([JSON.stringify(createNewEvent)], { type: "application/json" })
      );
      if (data.eventImage && data.eventImage.length > 0) {
        formData.append("file", data.eventImage[0]);
      } else {
        formData.append("file", null);
      }

      //Call Create API
      const { token } = getUserData();
      const createEvent = await postCreateEvent(token, formData);
      console.log("Create Event Response:", createEvent);
      if (createEvent.status === 201) {
        showSuccessMessage(
          toastRef,
          `${data.title}`,
          "Event Created Successfully"
        );
        setCreateEventDataProps(createNewEvent);
      } else {
        showErrorMessage(toastRef, "Error", "Failed to Create Event");
      }
      setVisible(false);
    }
  };
  //console.log("input errors", errors);

  //Input style for the form fields
  const inputStyle = {
   // border: "1px solid #eae0e0",
    borderRadius: "5px",
    fontSize: "14px",
    padding: "8px",
  };

  console.log("selectRowEventData", selectRowEventData);

  // Select Row Event Data
  useEffect(() => {
    if (selectRowEventData) {
      setValue("title", selectRowEventData.title || "");
      setValue("notification", selectRowEventData.notification || "");
      setValue("fromdate", selectRowEventData.fromdate);
      setValue("toDate", selectRowEventData.toDate);
      setValue("url", selectRowEventData.url || "");
    }
  }, [selectRowEventData]);

  return (
    <div>
      <form onSubmit={handleSubmit(newEvent)}>
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
            {...register("url")}
            placeholder="URL"
          />
          {!selectRowEventData && (
            <input
              type="file"
              className="fileInputStyle"
              accept="image/*"
              {...register("eventImage", { required: "Image is required" })}
            />
          )}
          {errors.eventImage && (
            <p style={{ color: "red", fontSize: "0.8rem" }}>
              {errors.eventImage.message}
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
  );
};

export default CreateEvent;
