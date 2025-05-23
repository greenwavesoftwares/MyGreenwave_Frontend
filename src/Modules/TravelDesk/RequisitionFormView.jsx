import React from "react";
import { Dialog } from "primereact/dialog";
import { Box, Grid } from "@mui/material";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { getUserData } from "../Login/Encrypt";
import { InputTextarea } from "primereact/inputtextarea";
import { FloatLabel } from "primereact/floatlabel";
import { Button as PrimeReactButton } from "primereact/button";

const RequisitionFormView = ({ rowData ,handleApproveTravel,handleRejectTravel,formData,setFormData}) => {
  const { userDetails } = getUserData();
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
        <Grid size={12}> {
          formData?.manager_id === userDetails?.userId ?
          <Box display="flex" gap={2} flexDirection="row" marginTop={2}>
            <Grid item xs={6}>
              Manager Name:{" "}
              <div style={{ fontWeight: "bold", color: "blue" }}>
                {formData?.manager_id}
              </div>
            </Grid>
            <Grid item xs={6}>
              <FloatLabel>
                <InputTextarea
                  value={formData?.manager_suggestion}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      manager_suggestion: e.target.value,
                    })
                  }
                />
                <label htmlFor="managercomment">Manager Comment</label>
              </FloatLabel>
            </Grid>
             {/* Button */}
          <PrimeReactButton
            raised
            icon="pi pi-check"
            rounded
            
            aria-label="Verify"
            severity="success"
            disabled={!formData?.manager_suggestion?.trim()}
            onClick={handleApproveTravel}
          />
          <PrimeReactButton
            raised
            icon="pi pi-times"
            rounded
            
            severity="danger"
            aria-label="Cancel"
             disabled={!formData?.manager_suggestion?.trim()}
              onClick={handleRejectTravel}
          />
          </Box>
          :
          (
            <div>
          Manager Comment : {rowData.manager_suggestion}
          </div>)
        }
</Grid>
      </Grid>
    </>
  );
};

export default RequisitionFormView;
