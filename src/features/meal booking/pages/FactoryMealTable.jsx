import React, { useState, useEffect, useRef } from "react";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";

import { getUserData } from "../../../Modules/Login/Encrypt";

import {
  CustomColumn,
  DataTableComponent,
} from "../../../components/DataTable/DataTableComponent";

import { getMealBookingsByUserId, updateMeal } from "../api/client";

import CustomToast from "../../../components/Toast/Toast";
import {
  showSuccessMessage,
  showErrorMessage,
} from "../../../components/Toast/ShowMessage";
import { getMonth, toDate } from "date-fns";
import { Tag } from "primereact/tag";

const FactoryMealTable = () => {
  const toast = useRef(null);

  const { token, userDetails } = getUserData();

  const [tableData, setTableData] = useState([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date(),
    lunchType: "Lunch",
    mealOn: 0,
  });

  const timeOptions = [
    { label: "Lunch", value: "Lunch" },
    { label: "ES", value: "ES" },
  ];

  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchData = async () => {
    try {
      const response = await getMealBookingsByUserId(
        userDetails.employeeId,
        token,
      );

      const mappedData = response.data.map((item, index) => ({
        id: index + 1,
        ...item,
      }));

      setTableData(mappedData);
    } catch {
      showErrorMessage(toast, "Error", "Failed to load data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddRow = () => {
    setFormData({
      date: new Date(),
      lunchType: "Lunch",
      mealOn: 0,
    });
    setIsEdit(false);
    setDialogVisible(true);
  };

  const handleEditRow = (row) => {
    setFormData({
      ...row,
      date: new Date(row.date),
    });
    setIsEdit(true);
    setDialogVisible(true);
  };

  const handleSaveRow = async () => {
    try {
      const isDuplicate = tableData.find(
        (item) =>
          (!isEdit || item.id !== formData.id) &&
          formatDate(item.date) === formatDate(formData.date) &&
          item.lunchType === formData.lunchType,
      );

      if (isDuplicate) {
        showErrorMessage(
          toast,
          "Duplicate",
          "Meal already added for this Date & Time",
        );
        return;
      }

      if (formData.mealOn === 0) {
        showErrorMessage(toast, "Zero", "Meal Zero Not Allowed");
        return;
      }

      if (userDetails.employeeId !== 11111) {
        showErrorMessage(toast, "Error", "This feature Only for Kaka");
        return;
      }

      const payload = [
        {
          date: formatDate(formData.date),
          userId: userDetails.employeeId,
          time: formData.lunchType,
          mealOn: formData.mealOn,
          roti: 0,
          extraMeal: 0,
          menu: "No Menu Added",
          scanned: true
        },
      ];

      const response = await updateMeal(payload, token);

      if (response.status === 200) {
        showSuccessMessage(toast, "Success", "Saved Successfully");
      }

      setDialogVisible(false);
      fetchData();
    } catch (err) {
      showErrorMessage(toast, "Error", err.message);
    }
  };

  const handleDeleteRow = async (row) => {
    try {
      const payload = [
        {
          date: formatDate(row.date),
          userId: userDetails.employeeId,
          time: row.lunchType,
          mealOn: 0,
          roti: 0,
          extraMeal: 0,
          menu: "No Menu Added",
          scanned: false,
        },
      ];

      if (userDetails.employeeId !== 11111) {
        showErrorMessage(toast, "Error", "This feature Only for Kaka");
        return;
      }

      const response = await updateMeal(payload, token);

      if (response.status === 200) {
        showSuccessMessage(toast, "Deleted", "Meal Deleted");
      }

      fetchData();
    } catch (err) {
      showErrorMessage(toast, "Error", err.message);
    }
  };

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const today = new Date();

// 1st day of current month
const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  return (
    <div>
      <CustomToast ref={toast} />

      <DataTableComponent data={tableData} rows={15} showGridlines stripedRows>
        <CustomColumn
          field="date"
          header="Date"
          body={(row) => formatDate(row.date)}
        />
        <CustomColumn
          header="Day"
          body={(row) => {
            return <p>{days[new Date(row?.date).getDay()]}</p>;
          }}
        />

        <CustomColumn
          field="lunchType"
          header="Time"
          body={(ele) => (
            <Tag
              value={ele.lunchType}
              rounded
              severity={
                ele?.lunchType.toLowerCase() === "lunch"
                  ? "success"
                  : "secondary"
              }
            />
          )}
        />

        <CustomColumn field="mealOn" header="No of People" />

        <CustomColumn
          header="Action"
          body={(row) => (
            <div className="flex gap-2 justify-center">
              <Button
                className="rounded-full text-teal-500 hover:bg-teal-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                style={{
                  width: "1.5rem",
                  height: "1.5rem",
                }}
                icon="pi pi-pencil"
                rounded
                size="small"
                text
                onClick={() => handleEditRow(row)}
                disabled={
                  !(
                    new Date(row.date).getFullYear() ===
                      new Date().getFullYear() &&
                    new Date(row.date).getMonth() === new Date().getMonth()
                  )
                }
              />

              <Button
                className="rounded-full  text-red-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                style={{
                  width: "1.5rem",
                  height: "1.5rem",
                }}
                icon="pi pi-trash"
                rounded
                size="small"
                text
                severity="danger"
                onClick={() => handleDeleteRow(row)}
                disabled={
                  !(
                    new Date(row.date).getFullYear() ===
                      new Date().getFullYear() &&
                    new Date(row.date).getMonth() === new Date().getMonth()
                  )
                }
              />
            </div>
          )}
        />
      </DataTableComponent>

      <div className="flex justify-end -mt-6 mr-2 md:mr-6">
        <Button icon="pi pi-plus" size="small" rounded severity="info" onClick={handleAddRow} />
      </div>

      <Dialog
        header={isEdit ? "Edit Meal" : "Add Meal"}
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        style={{ width: "90vw", maxWidth: "420px" }}
        breakpoints={{ "960px": "75vw", "640px": "95vw" }}
        contentStyle={{ maxHeight: "60vh", overflowY: "auto" }}
        draggable={false}
        className="dialogHeader dialogContent"
      >
        <div className="flex flex-column gap-3">
          <Calendar
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.value })}
            dateFormat="yy-mm-dd"
            showIcon
            className="w-full NumberFieldStyle"
            minDate={firstDayOfMonth}
            maxDate={today}
            //enabledDates={new Date()}
            
          />

          <Dropdown
            options={timeOptions}
            value={formData.lunchType}
            onChange={(e) => setFormData({ ...formData, lunchType: e.value })}
            className="dropDownStyle w-full"
          />

          <InputNumber
            value={formData.mealOn}
            onValueChange={(e) => setFormData({ ...formData, mealOn: e.value })}
            min={0}
            className="NumberFieldStyle"
          />

          <Button label="Save" size="small" onClick={handleSaveRow} />
        </div>
      </Dialog>
    </div>
  );
};

export default FactoryMealTable;
