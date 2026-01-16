import { useRef, useState } from "react";
import Grid from "@mui/material/Grid";
import Toast from "../../../components/Toast/Toast";
import ConfirmDialog from "../../../components/ConfirmDialog/ConfirmDialog";
import { showConfirm } from "../../../components/ConfirmDialog/ShowConfirm";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import {
  approveLeave,
  rejectLeave,
  reviewingLeave,
} from "./LeaveManagerApprovalFunctions";
import "./LeaveManagerApproval.css";
import CustomButton from "../../../components/Button/Button";
import { InputSwitch } from "primereact/inputswitch";
import { InputTextarea } from "primereact/inputtextarea";
import CustomDialog from "../../../components/Dialog/DialogComponent";
import Poll from "../../../components/Poll/Poll";
import GlobalFilterHeader from "../../../components/Table/GlobalFilterHeader";

const LeaveRequestTable = ({
  leaveRequestTable,
  setLeaveRequestTable,
  userInfo,
}) => {
  const [selectedLeave, setSelectedLeave] = useState({});
  const toastRef = useRef(null);
  const [rejectedReason, setRejectedReason] = useState("");
  const [rejectedValidation, setRejectedValidation] = useState(true);
  const [rejectVisible, setRejectVisible] = useState(false);

  const actionBodyTemplate = (row) => {
    return (
      <>
        <CustomButton
          icon="pi pi-check"
          className="mr-2"
          rounded
          severity="success"
          disabled={
            (row.isReviewing === true && row.reviewingBy !== userInfo.userId) ||
            row.isReviewing === false
          }
          onClick={async () => {
            showConfirm(
              "Confirmation",
              "Do you want to approve this leave?",
              async () => {
                await approveLeave(row, toastRef, setLeaveRequestTable);
              },
              null
            );
          }}
        />
        <CustomButton
          icon="pi pi-times"
          rounded
          severity="danger"
          disabled={
            (row.isReviewing === true && row.reviewingBy !== userInfo.userId) ||
            row.isReviewing === false
          }
          onClick={() => {
            showRejectDialog(row);
          }}
        />
      </>
    );
  };
  const reviewingBodyTemplate = (row) => {
    let isDisabled =
      row.isReviewing === true && row.reviewingBy !== userInfo.userId;
    return (
      <>
        <InputSwitch
          tooltip={isDisabled ? `Reviewing By : ${row.reviewingBy}` : ""}
          tooltipOptions={{ position: "top", showOnDisabled: true }}
          disabled={isDisabled}
          style={{
            display:
              row.type != "CL" &&
              (row.status == "Pending" ||
                row.status == "Reviewing" ||
                row.status == "Reviewed")
                ? "inline-block"
                : "none",
          }}
          checked={row.isReviewing}
          onChange={async (e) => {
            setLeaveRequestTable((prev) => ({
              ...prev,
              table: prev.table.map((p) => ({
                ...p,
                isReviewing:
                  p.leaveId === row.leaveId ? e.value : p.isReviewing,
                reviewingBy:
                  p.leaveId === row.leaveId ? userInfo.userId : p.reviewingBy,
              })),
            }));
            await reviewingLeave(row, e.value, toastRef);
          }}
        />
      </>
    );
  };
  const leaveHeader = (
    <GlobalFilterHeader
      start={<span>Leaves</span>}
      table={leaveRequestTable}
      setTable={setLeaveRequestTable}
    />
  );
  const showRejectDialog = (row) => {
    setSelectedLeave(row);
    setRejectVisible(true);
  };
  const hideRejectDialog = () => {
    setSelectedLeave({});
    setRejectedReason("");
    setRejectVisible(false);
  };

  return (
    <>
      <DataTable
        value={leaveRequestTable.table}
        filters={leaveRequestTable.filterStructure}
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
        className="dataTableHeader dataTableBody dataTableBodyPadding dataTablePaginator defaultBorder dropDownStyle"
      >
        <Column field="userName" header="Name" className="w-[14vw]"></Column>
        <Column
          field="fromDate"
          header="From Date"
          className="w-[14vw]"
          sortable
        ></Column>
        <Column
          field="toDate"
          header="To Date"
          className="w-[14vw]"
          sortable
        ></Column>
        <Column
          field="actualLeave"
          header="Leave"
          className="w-[10vw]"
        ></Column>
        <Column field="type" header="Type" className="w-[10vw]"></Column>
        <Column field="reason" header="Reason" className="w-[15vw]"></Column>
        <Column
          header="Action"
          className="w-[20vw]"
          body={actionBodyTemplate}
        ></Column>
        <Column
          header="Reviewing"
          className="w-[10vw]"
          body={reviewingBodyTemplate}
        ></Column>
      </DataTable>
      <CustomDialog
        header="Reject Reason"
        visible={rejectVisible}
        className="leaveDialog"
        onHide={hideRejectDialog}
      >
        <Grid container rowSpacing={1.5}>
          <Grid size={4}>Reason</Grid>
          <Grid size={8}>
            <InputTextarea
              value={rejectedReason}
              autoResize
              rows={3}
              cols={24}
              onChange={(e) => {
                setRejectedReason(e.target.value);
              }}
              className="w-full"
              invalid={!rejectedValidation}
            />
          </Grid>
          <Grid size={12} className="flex justify-center">
            <CustomButton
              label="Reject"
              onClick={async () => {
                await rejectLeave(
                  selectedLeave,
                  rejectedReason,
                  setRejectedValidation,
                  hideRejectDialog,
                  toastRef,
                  setLeaveRequestTable
                );
              }}
            />
          </Grid>
        </Grid>
      </CustomDialog>
      <Toast ref={toastRef} />
      <ConfirmDialog />
    </>
  );
};

export default LeaveRequestTable;
