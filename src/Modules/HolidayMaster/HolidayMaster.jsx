import { Container, Grid, Typography } from "@mui/material";
import { FilterMatchMode } from "primereact/api";
import { DataTable } from "primereact/datatable";
import React, { useEffect, useRef, useState } from "react";
import {
  addOrEditHoliday,
  getHolidays,
  getRowDataForEdit,
} from "./HolidayFunction";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";
import { Column } from "primereact/column";
import SpeedDial from "../../components/SpeedDial/SpeedDial";
import DialogComponent from "../../components/Dialog/DialogComponent";
import "./HolidayMaster.css";
import { Checkbox } from "primereact/checkbox";
import DatePicker from "../../components/DatePicker/DatePicker";
import { Button } from "primereact/button";
import { getUserIdAndEmpCodes } from "../AdminPage/AdminFunction";
import { MultiSelect } from "primereact/multiselect";
import Toast from "../../components/Toast/Toast";
import { Tag } from "primereact/tag";

const HolidayMaster = () => {
  const holidayStructure = {
    holidayId: "",
    dates: [],
    totalNoOfDays: 0,
    holidays: "",
    isRestricted: "",
    restrictedUsers: [],
  };
  const holidayValidationStructure = {
    dates: true,
    holidays: true,
    restrictedUsers: true,
  };
  const tableStructure = () => ({
    table: [],
    filterText: "",
    filterStructure: {
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    },
  });
  const toastRef = useRef(null);
  const [holidayVisible, setHolidayVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [holidayData, setHolidayData] = useState(holidayStructure);
  const [holidayValidation, setHolidayValidation] = useState(
    holidayValidationStructure
  );
  const [holidayTable, setHolidayTable] = useState(tableStructure);
  const [currentDate] = useState(new Date());
  const [allUserList, setAllUserList] = useState([]);
  const holidayHeader = (
    <div className="flex justify-content-between align-items-center">
      <span>Holidays</span>
      <IconField iconPosition="left">
        {/* <InputIcon className="pi pi-search" /> */}
        <InputText
          value={holidayTable.filterText}
          onChange={(e) => {
            const value = e.target.value;
            let _filters = holidayTable.filterStructure;
            _filters["global"].value = value;
            setHolidayTable((p) => ({
              ...p,
              filterStructure: _filters,
              filterText: value,
            }));
          }}
          placeholder="Search"
          className="inputFieldStyle p-inputtext-sm"
        />
      </IconField>
    </div>
  );
  useEffect(() => {
    const init = async () => {
      const data = await getHolidays();
      setHolidayTable((prev) => ({ ...prev, table: data.holiday }));
      const userList = await getUserIdAndEmpCodes();
      setAllUserList(userList);
    };
    init();
  }, []);

  const showHolidayDialog = (isEdit) => {
    setHolidayVisible(true);
    setHolidayData(holidayStructure);
    setEditMode(isEdit);
  };
  const hideHolidayDialog = () => {
    setHolidayVisible(false);
    setHolidayData(holidayStructure);
    setHolidayValidation(holidayValidationStructure);
    setEditMode(false);
  };

  return (
    <>
      <div className="container mx-auto px-4">
        <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
          <div className="cardStyle mt-4 bg-white shadow rounded">
            <SpeedDial
              radius={80}
              style={{ right: "1rem", bottom: "2rem", position: "fixed" }}
              showIcon="pi pi-calendar-plus"
              hideIcon="pi pi-calendar-plus"
              placeholder="Add Holiday"
              onClick={() => showHolidayDialog(false)}
              className="speedDialStyle"
            />
            <Grid container>
              <Grid size={12}>
                <DataTable
                  value={holidayTable.table}
                  filters={holidayTable.filterStructure}
                  globalFilterFields={[
                    "holidays",
                    "fromDate",
                    "fromDate",
                    "type",
                  ]}
                  header={holidayHeader}
                  paginator
                  size="small"
                  rows={12}
                  rowsPerPageOptions={[10, 25, 50]}
                  className="dataTableHeader dataTableBody dataTableBodyPadding dataTablePaginator dropDownStyle"
                >
                  <Column field="year" header="Year"></Column>
                  <Column field="holidays" header="Holiday Name"></Column>
                  <Column field="fromDate" header="From Date"></Column>
                  <Column field="fromDate" header="To Date"></Column>
                  <Column
                    header="Type"
                    body={(rowData) => {
                      return (
                        <Tag
                          value={rowData.type}
                          rounded
                          severity={
                            rowData.type === "Public" ? "success" : "warning"
                          }
                        />
                      );
                    }}
                  ></Column>
                  <Column field="totalNoOfDays" header="No Of Days"></Column>
                  <Column
                    header="Edit"
                    body={(row) => (
                      <Button
                        icon="pi pi-pencil"
                        rounded
                        text
                        severity="warning"
                        style={{ width: "2rem", height: "2rem" }}
                        onClick={async () => {
                          showHolidayDialog(true);
                          await getRowDataForEdit(setHolidayData, row);
                        }}
                      />
                    )}
                  ></Column>
                </DataTable>
              </Grid>
            </Grid>

            <DialogComponent
              header={(editMode ? "Edit" : "Add") + " Holiday"}
              visible={holidayVisible}
              className="holidayDialog dialogHeader dialogContent"
              onHide={hideHolidayDialog}
            >
              <Grid container>
                {!editMode && (
                  <Grid size={6} className="holidayCell">
                    Restricted
                  </Grid>
                )}
                {!editMode && (
                  <Grid size={6} className="holidayCell">
                    <Checkbox
                      checked={holidayData.isRestricted}
                      onChange={(e) => {
                        setHolidayData((prevData) => ({
                          ...prevData,
                          isRestricted: e.checked,
                        }));
                      }}
                    />
                  </Grid>
                )}
                {holidayData.isRestricted && (
                  <Grid size={6} className="holidayCell">
                    Select Users
                  </Grid>
                )}
                {holidayData.isRestricted && (
                  <Grid size={6} className="holidayCell">
                    <MultiSelect
                      value={holidayData.restrictedUsers}
                      onChange={async (e) =>
                        setHolidayData((prev) => ({
                          ...prev,
                          restrictedUsers: e.value,
                        }))
                      }
                      filter
                      maxSelectedLabels={2}
                      options={allUserList}
                      optionLabel="userName"
                      optionValue="empCode"
                      placeholder="Select One"
                      className="w-full"
                    />
                  </Grid>
                )}
                {!editMode && (
                  <Grid size={6} className="holidayCell">
                    Date
                  </Grid>
                )}
                {!editMode && (
                  <Grid size={6} className="holidayCell">
                    <DatePicker
                      value={holidayData.dates}
                      invalid={!holidayValidation.dates}
                      onChange={(e) => {
                        setHolidayData((prevData) => ({
                          ...prevData,
                          dates: e.value,
                        }));
                      }}
                      selectionMode="range"
                      readOnlyInput
                      hideOnRangeSelection
                      disabledDays={[0, 6]}
                      minDate={currentDate}
                      showIcon
                      dateFormat="dd/mm/yy"
                      className="w-full calendarStyle"
                    />
                  </Grid>
                )}
                <Grid size={6} className="holidayCell">
                  Name
                </Grid>
                <Grid size={6} className="holidayCell">
                  <InputText
                    value={holidayData.holidays}
                    invalid={!holidayValidation.holidays}
                    className="w-full inputFieldStyle p-inputtext-sm"
                    onChange={(e) => {
                      setHolidayData((prevData) => ({
                        ...prevData,
                        holidays: e.target.value,
                      }));
                    }}
                  />
                </Grid>
                <Grid
                  size={12}
                  style={{ display: "flex", justifyContent: "center" }}
                  className="holidayCell"
                >
                  <Button
                    label="Save"
                    size="small"
                    icon="pi pi-save"
                    onClick={async () => {
                      await addOrEditHoliday(
                        editMode,
                        holidayData,
                        setHolidayValidation,
                        toastRef,
                        holidayTable.table,
                        setHolidayTable,
                        setHolidayVisible
                      );
                    }}
                  />
                </Grid>
              </Grid>
            </DialogComponent>
            <Toast ref={toastRef} />
          </div>
        </div>
      </div>
    </>
  );
};

export default HolidayMaster;
