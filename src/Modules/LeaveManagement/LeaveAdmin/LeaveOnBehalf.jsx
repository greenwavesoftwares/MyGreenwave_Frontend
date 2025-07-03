import React, { useEffect, useRef, useState } from "react";
import DatePicker from "../../../components/DatePicker/DatePicker";
import { DataTable } from "primereact/datatable";
import GlobalFilterHeader from "../../../components/Table/GlobalFilterHeader";
import { Column } from "primereact/column";
import CustomButton from "../../../components/Button/Button";
import CustomDialog from "../../../components/Dialog/DialogComponent";
import Grid from "@mui/material/Grid";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { applyLeaveOnBehalf } from "./LeaveAdminFunctions";
import CustomToast from "../../../components/Toast/Toast";

const LeaveOnBehalf = ({
  leaveOnBehalfTable,
  setLeaveOnBehalfTable,
  userList,
}) => {
  const leaveStructure = {
    userId: "",
    type: "",
    dates: [],
    reason: "",
  };
  const leaveValidationStructure = {
    userId: true,
    type: true,
    dates: true,
    reason: true,
  };
  const [leaveVisible, setLeaveVisible] = useState(false);
  const [leaveData, setLeaveData] = useState(leaveStructure);
  const [leaveValidation, setLeaveValidation] = useState(
    leaveValidationStructure
  );
  const toastRef = useRef(null);

  const addButtonHeader = (
    <div>
      <CustomButton
        outlined
        label={"Add Leave"}
        onClick={() => setLeaveVisible(true)}
      />
    </div>
  );
  const leaveHeader = (
    <GlobalFilterHeader
      start={addButtonHeader}
      table={leaveOnBehalfTable}
      setTable={setLeaveOnBehalfTable}
    />
  );
  useEffect(() => {
    setLeaveData(leaveStructure);
    setLeaveValidation(leaveValidationStructure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaveVisible]);
  return (
    <>
      <DataTable
        value={leaveOnBehalfTable.table}
        filters={leaveOnBehalfTable.filterStructure}
        globalFilterFields={[
          "userName",
          "fromDate",
          "toDate",
          "actualLeave",
          "type",
          "reason",
        ]}
        header={leaveHeader}
        paginator
        rows={10}
        rowsPerPageOptions={[10, 25, 50]}
        sortField="fromDate"
        sortOrder={-1}
        size="small"
         className="dataTableHeader dataTableBody dataTableBodyPadding dataTablePaginator defaultBorder"
      >
        <Column field="userName" header="Name" className="w-[14vw]" />
        <Column
          field="fromDate"
          header="From Date"
          className="w-[14vw]"
          sortable
        />
        <Column field="toDate" header="To Date" className="w-[14vw]" sortable />
        <Column field="type" header="Type" className="w-[10vw]" />
        <Column field="actualLeave" header="Leave" className="w-[10vw]" />
        <Column field="reason" header="Reason" className="w-[15vw]" />
      </DataTable>

      <CustomDialog
        header="Add Leave"
        visible={leaveVisible}
        className="w-[35rem] dialogHeader dialogContent"
        onHide={() => setLeaveVisible(false)}
      >
        <Grid container rowSpacing={1.5}>
          <Grid size={6}>User</Grid>
          <Grid size={6}>
            <Dropdown
              value={leaveData.userId}
              invalid={!leaveValidation.userId}
              onChange={async (e) =>
                setLeaveData((prev) => ({
                  ...prev,
                  userId: e.value,
                }))
              }
              options={userList}
              optionLabel="userName"
              optionValue="userId"
              placeholder="Select User"
              className="w-full dropDownStyle"
              filter
            />
          </Grid>
          <Grid size={6}>Type</Grid>
          <Grid size={6}>
            <Dropdown
              value={leaveData.type}
              invalid={!leaveValidation.type}
              onChange={async (e) =>
                setLeaveData((prev) => ({
                  ...prev,
                  type: e.value,
                }))
              }
              options={["CL", "PL", "Medical"]}
              placeholder="Select Type"
              className="w-full dropDownStyle"
              filter
            />
          </Grid>
          <Grid size={6}>Date</Grid>
          <Grid size={6}>
            <DatePicker
              value={leaveData.dates}
              onChange={(e) => {
                setLeaveData((prevData) => ({
                  ...prevData,
                  dates: e.value,
                }));
              }}
              selectionMode="range"
              readOnlyInput
              hideOnRangeSelection
              disabledDays={[0, 6]}
              showIcon
              dateFormat="dd/mm/yy"
              inputClassName="w-full calendarStyleInput inputFieldStyle"
              invalid={!leaveValidation.dates}
              className="calendarStyle inputFieldStyle"
            />
          </Grid>
          <Grid size={6}>Reason</Grid>
          <Grid size={6}>
            <InputTextarea
              value={leaveData.reason}
              autoResize
              rows={3}
              cols={24}
              onChange={(e) => {
                setLeaveData((prevData) => ({
                  ...prevData,
                  reason: e.target.value,
                }));
              }}
              className="w-full inputFieldStyle"
              invalid={!leaveValidation.reason}
            />
          </Grid>
          <Grid size={12} style={{ display: "flex", justifyContent: "center" }}>
            <CustomButton
              label="Apply"
              onClick={async () => {
                await applyLeaveOnBehalf(
                  leaveData,
                  setLeaveValidation,
                  setLeaveOnBehalfTable,
                  setLeaveVisible,
                  toastRef
                );
              }}
            />
          </Grid>
        </Grid>
      </CustomDialog>
      <CustomToast ref={toastRef} />
    </>
  );
};

export default LeaveOnBehalf;
