import React from "react";
import { Dialog } from "primereact/dialog";
import { Grid } from "@mui/material";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

const RequisitionFormView = ({ rowData }) => {
  return (
    <>
      <Grid container spacing={2}>
        <Grid size={6}>Purpose : {rowData.purpose}</Grid>
        <Grid size={6}>Project Name : {rowData.projectName}</Grid>
        <Grid size={6}>City : {rowData.city}</Grid>
        <Grid size={6}>Locality/Area : {rowData.localityArea}</Grid>
        <Grid size={4}>Type of Travel : {rowData.typeOfTravel}</Grid>
        <Grid size={4}>Advance Requested : {rowData.advanceRequested}</Grid>
        <Grid size={4}>Advance Given : {rowData.advance}</Grid>
        <Grid size={12}>
          <DataTable header="Mode of Transport" value={rowData.transportModes}>
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
    </>
  );
};

export default RequisitionFormView;
