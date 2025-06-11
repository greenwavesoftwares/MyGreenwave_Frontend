import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Chip, Grid, IconButton } from "@mui/material";
//Call Api
import { getMyFormParticularRequisitionId } from "./TravelDeskAPI";
import { getUserData } from "../Login/Encrypt";
import { Dialog } from "primereact/dialog";
import CheckIcon from "@mui/icons-material/Check";
import { useState } from "react";
import {Button } from "primereact/button"

const MyForm = ({ myFormTableData }) => {
  const [expandedRows, setExpandedRows] = useState(null);
  console.log("table data", myFormTableData);
  //Dialog visible
  const [visible, setVisible] = useState(false);
  //
  const [rowData, setRowData] = useState({});

  const handelShowPreviousData = async (requisionId) => {
    console.log("clickrequisionId", requisionId);
    //Dialog visible set
    setVisible(true);
    const { token } = getUserData();
    const response = await getMyFormParticularRequisitionId(token, requisionId);
    setRowData(response?.data);
    console.log("response", response);
  };

  const rowExpansionTemplate = (rowData) => (
    <DataTable
      value={rowData.expandableData}
      showGridlines
      dataKey="requisionId"
      className="text-xs"
      tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
    >
      <Column field="date" header="Date"></Column>
      <Column field="advance" header="Advance"></Column>
      <Column
        body={(rowData) => {
          return (
            <Chip
              label={rowData.status}
              size="medium"
              color={
                rowData.status.toLowerCase() === "approved" ||
                rowData.status.toLowerCase() === "completed"
                  ? "success"
                  : "warning"
              }
            />
          );
        }}
        header="Status"
      ></Column>
      <Column
        body={(rowData) => {
          return (
            <Button
              variant="contained"
              onClick={(e) => {
                handelShowPreviousData(rowData.requisionId);
              }}
            >
              Show
            </Button>
          );
        }}
        header="View"
      ></Column>
      <Column field="" header="Download ticket"></Column>
    </DataTable>
  );

  const completeTravel = async (rowData) => {
    //  let updatedData={...row,advance: newAdvanceAmount}
    let response = await updateTravelRequisition(
      rowData,
      rowData.travelId,
      "CompleteRequested"
    );

    if (response.status != 201) {
      toast.current?.show({
        severity: "error",
        summary: "error",
        detail: response.data,
      });
    } else {
      let response = await getApprovedAndSettledAndCompleteRequestedData();
      setApprovedAndSettledTravelData(response.data);
      // setEditRowId(null);
      toast.current?.show({
        severity: "success",
        summary: "Success",
        detail: response.message,
      });

      // Optionally reset newAdvanceAmount
    }
  };

  const checkBody=(rowData)=>{
      return(
    <Button
      icon="pi pi-check"
      className="p-button-sm p-button-text p-button-success"
        onClick={() => {
        completeTravel(rowData.expandableData[0], "CompleteRequested");
        }}
        tooltip="Complete Travel"
      disabled={rowData.requestCompletedFlag === false}
      />
    // <span>Hii</span>
      )
      
  }

  return (
    <>
      <DataTable
        value={myFormTableData}
        expandedRows={expandedRows}
        onRowToggle={(e) => setExpandedRows(e.data)}
        rowExpansionTemplate={rowExpansionTemplate}
        showGridlines
        className="text-xs"
        tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
        dataKey="travelId"
        paginator
        rows={10}
      >
        <Column expander style={{ width: "3rem" }} />
        <Column field="fromDate" header="From Date"></Column>
        <Column field="tentativeToDate" header="Tentative To Date"></Column>
        <Column field="purpose" header="Purpose"></Column>
        <Column field="projectName" header="Project Name"></Column>
        <Column field="city" header="City"></Column>
        <Column field="localityArea" header="Locality/Area"></Column>
        <Column field="typeOfTravel" header="Type Of Travel"></Column>
        <Column body={checkBody} header="Complete Travel"></Column>
       
        {/* <Column
  body={(rowData) => {
    return (
      <Button
        icon="pi pi-check"
        label="Apply"
        className="p-button-sm p-button-success p-button-text"
        onClick={() => {
          completeTravel(rowData.expandableData[0], "CompleteRequested");
        }}
        tooltip="Apply for Approval"
       // disabled={rowData.requestCompletedFlag === false}
      />
    );
  }}
  header="Travel Complete"
  headerStyle={{ textAlign: "center" }}
  style={{ textAlign: "center" }}
/> */}
      </DataTable>

      <Dialog
        header="Requisition Form View"
        visible={visible}
        style={{ width: "70rem" }}
        onHide={() => {
          if (!visible) return;
          setVisible(false);
        }}
      >
        <Grid container spacing={2}>
          <Grid size={6}>Purpose : {rowData.purpose}</Grid>
          <Grid size={6}>Project Name : {rowData.projectName}</Grid>
          <Grid size={6}>City : {rowData.city}</Grid>
          <Grid size={6}>Locality/Area : {rowData.localityArea}</Grid>
          <Grid size={4}>Type of Travel : {rowData.typeOfTravel}</Grid>
          <Grid size={4}>Advance Requested : {rowData.advanceRequested}</Grid>
          <Grid size={4}>Advance Given : {rowData.advance}</Grid>
          <Grid size={12}>
            <DataTable
              header="Mode of Transport"
              value={rowData.transportModes}
            >
              <Column field="mode" header="Mode"></Column>
              <Column field="fromDate" header="From Date"></Column>
              <Column field="comment" header="Comment"></Column>
              <Column field="manager_remark" header="Manager Remark"></Column>
            </DataTable>
          </Grid>

          <Grid size={12}>
            <DataTable
              header="Reservation of Accommodation"
              value={rowData.accommodations}
            >
              <Column field="type" header="Type"></Column>
              <Column field="numberOfRooms" header="Number Of Rooms"></Column>
              <Column field="numberOfNights" header="Number Of Nights"></Column>
              <Column field="checkIn" header="Check In"></Column>
              <Column field="checkOut" header="Check Out"></Column>
              <Column field="comment" header="Comment"></Column>
            </DataTable>
          </Grid>

          <Grid size={12}>Manager Name : {rowData.manager_id}</Grid>
          <Grid size={12}>Manager Comment : {rowData.manager_suggestion}</Grid>
        </Grid>
      </Dialog>
    </>
  );
};
export default MyForm;
