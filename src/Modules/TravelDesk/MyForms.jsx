import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button, Chip, Grid } from "@mui/material";
//Call Api
import { getMyFormParticularRequisitionId } from "./TravelDeskAPI";
import { getUserData } from "../Login/Encrypt";
import { Dialog } from "primereact/dialog";
import { useState } from "react";

const MyForm = ({ myFormTableData }) => {
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

  return (
    <>
      <DataTable value={myFormTableData}>
        <Column field="date" header="Date"></Column>
        <Column field="purpose" header="Purpose"></Column>
        <Column field="projectName" header="Project Name"></Column>
        <Column field="city" header="City"></Column>
        <Column
          body={(rowData) => {
            return (
              <Chip
                label={rowData.status}
                size="medium"
                color={
                  rowData.status.toLowerCase() === "approved" || rowData.status.toLowerCase() ==="completed"
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
        <Column
          field=""
          header="Download ticket
"
        ></Column>
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
              <Column
                field="mode"
                header="Mode"
              ></Column>
              <Column
                field="fromDate"
                header="From Date"
              ></Column>
               <Column
                field="comment"
                header="Comment"
              ></Column>
              <Column
                field="manager_remark"
                header="Manager Remark"
              ></Column>
            </DataTable>
          </Grid>

          <Grid size={12}>
            <DataTable
              header="Reservation of Accommodation"
              value={rowData.accommodations}
            >
              <Column
                field="type"
                header="Type"
              ></Column>
              <Column
                field="numberOfRooms"
                header="Number Of Rooms"
              ></Column>
               <Column
                field="numberOfNights"
                header="Number Of Nights"
              ></Column>
              <Column
                field="checkIn"
                header="Check In"
              ></Column>
              <Column
                field="checkOut"
                header="Check Out"
              ></Column>
              <Column
                field="comment"
                header="Comment"
              ></Column>
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
