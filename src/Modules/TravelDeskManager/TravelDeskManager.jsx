import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { useEffect, useState } from "react";
import {
  getMyFormParticularRequisitionId,
  getMyFormTravelData,
} from "../TravelDesk/TravelDeskAPI";
import { getUserData } from "../Login/Encrypt";
import { Box, Button, Grid } from "@mui/material";
import { Dialog } from "primereact/dialog";
import MyForm from "../TravelDesk/MyForms";
import "./TravelDeskManager.css";
import { InputTextarea } from 'primereact/inputtextarea';
import { FloatLabel } from "primereact/floatlabel";
import { Button as PrimeReactButton } from "primereact/button";
import { ProgressBar } from "primereact/progressbar";
import { InputText } from "primereact/inputtext";
const PENDING_STATUS = "Pending";

export default function TravelDeskManager() {
  const [travelData, setTravelData] = useState(null);
  const [formData, setFormData] = useState({});
  const [visible, setVisible] = useState(false);
  const [globalFilter, setGlobalFilter] = useState(null);
  const { token } = getUserData();

  useEffect(() => {
    fetchTravelData();
  }, []);


  const fetchTravelData = async () => {
    try {
      const { data } = await getMyFormTravelData(token);
      console.log("response", data);
      const pendingData = data.filter(
        (item) => item?.status === PENDING_STATUS
      );
      setTravelData(pendingData ?? []);
    } catch (error) {
      console.error("Error fetching travel data:", error);
    }
  };

  const handleShowClick = async (e, rowData) => {
    console.log("rowdata", rowData);
    console.log("Event", e);
    const { data } = await getMyFormParticularRequisitionId(
      token,
      rowData.requisionId
    );
    console.log("requisionId Data :", data);
    if(data)
    {
    setFormData(data);
    setVisible(true);
    }
  };



   const renderHeader = () => {
    return (
      
      <InputText
        type="search"
        className="p-inputtext-sm"
        onInput={(e) => setGlobalFilter(e.target.value)}
        placeholder="Search.."
      />
   
);
  }
  const header = renderHeader();

  return (
    
    <div>
      {/* DataTable */}
     
      <DataTable value={travelData} className="UserInfoTableStyle HeaderColor"
      emptyMessage={travelData? 'No Adhoc Jobs Found' :<ProgressBar mode="indeterminate" style={{ height: '6px' }}/>}
      header={header} globalFilter={globalFilter}
      >
        <Column sortable field="date" header="Date"></Column>
        <Column sortable field="user_id" header="Name"></Column>
        <Column sortable field="typeOfTravel" header="Type of Travel"></Column>
        <Column sortable field="purpose" header="Purpose of Travel"></Column>
        <Column sortable field="projectName" header="Project Name"></Column>
        <Column sortable field="city" header="City"></Column>
        <Column
          body={(rowData) => {
            return (
              <Button
                variant="contained"
                size="small"
                onClick={(e) => handleShowClick(e, rowData)}
              >
                Show
              </Button>
            );
          }}
          header="View"
        ></Column>
      </DataTable>
     

{/* Dialog component */}
      <Dialog
        header="Details"
        visible={visible}
        style={{ width: "90vw" }}
        onHide={() => {
          if (!visible) return;
          setVisible(false);
          setFormData({});
        }}
      >
        <Grid container spacing={2}>
          <Grid size={6}>Purpose : {formData?.purpose}</Grid>
          <Grid size={6}>Project Name : {formData?.projectName}</Grid>
          <Grid size={6}>City : {formData?.city}</Grid>
          <Grid size={6}>Locality/Area : {formData?.localityArea}</Grid>
          <Grid size={4}>Type of Travel : {formData?.typeOfTravel}</Grid>
          <Grid size={4}>Advance Requested : {formData?.advanceRequested}</Grid>
          <Grid size={4}>Advance Given : {formData?.advance}</Grid>
          <Grid size={12}>
            <DataTable
              header="Mode of Transport"
              value={formData?.transportModes}
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
              value={formData?.accommodations}
            >
              <Column field="type" header="Type"></Column>
              <Column field="numberOfRooms" header="Number Of Rooms"></Column>
              <Column field="numberOfNights" header="Number Of Nights"></Column>
              <Column field="checkIn" header="Check In"></Column>
              <Column field="checkOut" header="Check Out"></Column>
              <Column field="comment" header="Comment"></Column>
            </DataTable>
          </Grid>

         <Box display="flex" gap={2} flexDirection="row" marginTop={2}>
  <Grid item xs={6} >
    
    Manager Name: <div style={{fontWeight:"bold",color:"blue"}}>{formData?.manager_id}</div>
  </Grid>
  <Grid item xs={6}>
    <FloatLabel>
      <InputTextarea
        value={formData?.manager_suggestion}
        onChange={(e) => setFormData({ ...formData, manager_suggestion: e.target.value })}
      />
      <label htmlFor="managercomment">Manager Comment</label>
    </FloatLabel>
  </Grid>
</Box>
<PrimeReactButton  raised icon="pi pi-check" rounded outlined aria-label="Verify" severity="success"/>
<PrimeReactButton raised icon="pi pi-times" rounded outlined severity="danger" aria-label="Cancel" />

        </Grid>
      </Dialog>
       
    
    </div>
  );
}
