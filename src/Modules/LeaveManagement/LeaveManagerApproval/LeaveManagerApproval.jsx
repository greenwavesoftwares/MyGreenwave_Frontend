import React, { useEffect, useRef, useState } from "react";
import Grid from "@mui/material/Grid";
import { Card } from "primereact/card";
import { Container } from "@mui/material";
import Toast from "../../../components/Toast/Toast";
import ConfirmDialog from "../../../components/ConfirmDialog/ConfirmDialog";
import { showConfirm } from "../../../components/ConfirmDialog/showConfirm";
import Calender from "../../../components/Calender/Calender";
import { TabView, TabPanel } from "primereact/tabview";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import {
  approveLeave,
  getCurrentDate,
  onPageLoad,
  onSelectRowEdit,
  rejectLeave,
  reviewingLeave,
} from "./LeaveManagerApprovalFunctions";
import { getUserData } from "../../Login/Encrypt";
import "./LeaveManagerApproval.css";
import { Tooltip } from "primereact/tooltip";
import { Tag } from "primereact/tag";
import { FilterMatchMode } from "primereact/api";
import { InputIcon } from "primereact/inputicon";
import { IconField } from "primereact/iconfield";
import { Avatar } from "primereact/avatar";
import { OverlayPanel } from "primereact/overlaypanel";
import { AvatarGroup } from "primereact/avatargroup";
import { Chip } from "primereact/chip";
import CustomButton from "../../../components/Button/Button";
import CustomInputText from "../../../components/InputText/InputText";
import { InputSwitch } from "primereact/inputswitch";
import { showConfirmPopup } from "../../../components/ConfirmPopup/ShowConfirmPopup";
import { InputTextarea } from "primereact/inputtextarea";
import CustomConfirmPopup from "../../../components/ConfirmPopup/ConfirmPopup";
import CustomDialog from "../../../components/Dialog/DialogComponent";
import Poll from "../../../components/Poll/Poll";

const LeaveManagerApproval = () => {
  const tableStructure = () => ({
    table: [],
    filterText: "",
    filterStructure: {
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    },
  });
  const [leaveRequestTable, setLeaveRequestTable] = useState(tableStructure);
  const [teamLeaveTable, setTeamLeaveTable] = useState(tableStructure);
  const [teamLeaveCalender, setTeamLeaveCalender] = useState([]);
  const [selectedTeamLeave, setSelectedTeamLeave] = useState([]);
  const toastRef = useRef(null);
  const tooltipRef = useRef(null);
  const overlayRef = useRef(null);
  const [userInfo] = useState(getUserData()?.userDetails);
  const [rejectedReason, setRejectedReason] = useState("");
  const [rejectedValidation, setRejectedValidation] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState({});
  const [rejectVisible, setRejectVisible] = useState(false);
  const [pollStop, setPollStop] = useState(false);

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
                await approveLeave(row, toastRef);
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
    return (
      <InputSwitch
        disabled={
          row.isReviewing === true && row.reviewingBy !== userInfo.userId
        }
        style={{
          display:
            row.type != "CL" &&
            (row.status == "Pending" ||
              row.status == "Reviewing" ||
              row.status == "Reviewed")
              ? "block"
              : "none",
        }}
        checked={row.isReviewing}
        onChange={async (e) => {
          setLeaveRequestTable((prev) => ({
            ...prev,
            table: prev.table.map((p) => ({
              ...p,
              isReviewing: p.leaveId === row.leaveId ? e.value : p.isReviewing,
              reviewingBy:
                p.leaveId === row.leaveId ? userInfo.userId : p.reviewingBy,
            })),
          }));
          await reviewingLeave(row, e.value, toastRef);
        }}
      />
    );
  };
  const statusBodyTemplate = (row) => {
    return (
      <>
        <Tooltip
          target={"#leave_" + row.leaveId}
          mouseTrack
          className={row.status === "Rejected" ? "block" : "hidden"}
        >
          <b>Rejected By :</b> {row.rejectedBy}
          <br />
          <b>Rejected Reason :</b> {row.rejectedReason}
        </Tooltip>
        <Tag
          id={"leave_" + row.leaveId}
          value={row.status}
          severity={row.severity}
          data-pr-position="mouse"
        />
      </>
    );
  };
  const leaveHeader = (
    <div className="flex justify-content-between align-items-center">
      <span>Leaves</span>
      <IconField iconPosition="left">
        <InputIcon className="pi pi-search" />
        <CustomInputText
          value={leaveRequestTable.filterText}
          onChange={(e) => {
            const value = e.target.value;
            let _filters = leaveRequestTable.filterStructure;
            _filters["global"].value = value;
            setLeaveRequestTable((p) => ({
              ...p,
              filterStructure: _filters,
              filterText: value,
            }));
          }}
          placeholder="Search"
        />
      </IconField>
    </div>
  );
  function getInitials(name) {
    return name
      ? name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .toUpperCase()
      : "";
  }
  const leaveCalenderContent = (date) => {
    const leaves = date.event.extendedProps.leaves || [];
    const visibleLeaves = leaves.slice(0, 5); // Show first 5 users
    const hiddenCount = leaves.length - visibleLeaves.length;
    const avatarContent = (
      <AvatarGroup>
        {visibleLeaves.map((user, index) => (
          <Avatar
            label={user.initialName}
            style={{
              backgroundColor: user.initialColor,
            }}
            className="text-white"
            shape="circle"
            size="large"
            key={index}
            onMouseEnter={(e) => overlayRef.current?.show(e)}
          />
        ))}
        {hiddenCount > 0 && (
          <Avatar
            shape="circle"
            size="large"
            label={`+${hiddenCount}`}
            onMouseEnter={(e) => overlayRef.current?.show(e)}
          />
        )}
      </AvatarGroup>
    );
    const chipContent = (
      <div className="flex flex-column">
        {visibleLeaves.map((user, index) => (
          <Chip
            className={`pl-2 mb-1`}
            style={{ backgroundColor: user.statusColor }}
            key={index}
            template={() => {
              return (
                <div className={`py-1 text-50 text-xs truncate`}>
                  {user.userName}
                </div>
              );
            }}
            onMouseEnter={(e) => overlayRef.current?.show(e)}
          />
        ))}
        {hiddenCount > 0 && (
          <Chip
            className={`pl-2 mb-1`}
            template={() => {
              return (
                <div className={`py-1 text-50 text-xs truncate`}>
                  {`+${hiddenCount} others`}
                </div>
              );
            }}
            onMouseEnter={(e) => overlayRef.current?.show(e)}
          />
        )}
      </div>
    );

    return chipContent;
  };

  useEffect(() => {
    const init = async () => await getLeaveData();
    init();
  }, []);
  const getLeaveData = async () => {
    let data = await onPageLoad();
    setLeaveRequestTable((prev) => ({ ...prev, table: data.requestData }));
    setTeamLeaveTable((prev) => ({ ...prev, table: data.tableData }));
    setTeamLeaveCalender(data.calenderData);
  };
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
      <Poll func={getLeaveData} stop={pollStop} interval={5} />
      <Container maxWidth="lg">
        <Grid
          container
          spacing={1}
          marginTop={2}
          sx={{
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Grid size={12}>
            <Card>
              <TabView>
                <TabPanel header="Leave Requests">
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
                  >
                    <Column
                      field="userName"
                      header="User Name"
                      className="w-[14vw]"
                    ></Column>
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
                    <Column
                      field="type"
                      header="Type"
                      className="w-[10vw]"
                    ></Column>
                    <Column
                      field="reason"
                      header="Reason"
                      className="w-[15vw]"
                    ></Column>
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
                </TabPanel>
                <TabPanel header="Team Leaves">
                  <Tooltip
                    ref={tooltipRef}
                    target="#selectedEvent"
                    mouseTrack
                  />
                  <Calender
                    initialView="dayGridMonth"
                    events={teamLeaveCalender}
                    eventContent={leaveCalenderContent}
                    eventBackgroundColor="transparent"
                    eventBorderColor="transparent"
                    eventTextColor="inherit"
                    eventMouseEnter={(e) =>
                      setSelectedTeamLeave(e.event.extendedProps.leaves)
                    }
                  ></Calender>
                </TabPanel>
              </TabView>
            </Card>
          </Grid>
        </Grid>
      </Container>
      {/* <OverlayPanel ref={overlayRef}>
        <DataTable value={selectedTeamLeave} size="small">
          <Column field="userName" header="Name" />
          <Column field="fromDate" header="Date" />
          <Column field="type" header="Type" />
          <Column field="reason" header="Reason" />
          <Column field="status" header="Status" />
        </DataTable>
      </OverlayPanel> */}
      <OverlayPanel
        ref={overlayRef}
        showCloseIcon
        onHide={() => overlayRef.current?.hide()}
      >
        <div className="p-2 min-w-[250px] max-h-[300px] overflow-y-auto">
          {selectedTeamLeave.map((user, index) => (
            <div
              key={index}
              className="p-2 border-b border-[#e0e0e0] flex flex-col gap-1"
            >
              <div className="font-bold text-[#333]">{user.userName}</div>
              <div className="flex flex-wrap text-[0.85rem] gap-2">
                <span>
                  <strong>Date:</strong> {user.fromDate}
                </span>
                <span>
                  <strong>Type:</strong> {user.type}
                </span>
              </div>
              <div className="text-[0.85rem] text-[#555]">
                <strong>Reason:</strong> {user.reason}
              </div>
              <div>
                <span
                  className={`px-[6px] py-[2px] text-50 rounded text-xs `}
                  style={{ backgroundColor: user.statusColor, color: "white" }}
                >
                  {user.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </OverlayPanel>
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
                  toastRef
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

export default LeaveManagerApproval;
