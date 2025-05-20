import React, { useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button, Chip, Grid } from "@mui/material";
//Call Api
import {
  getMyFormParticularRequisitionId,
  getTravelsByStatus,
} from "./TravelDeskAPI";
import { getUserData } from "../Login/Encrypt";
import { Dialog } from "primereact/dialog";
import { useState } from "react";
import RequisitionFormView from "./RequisitionFormView";

const OpenTravelsTable = () => {
  const [travelData, setTravelData] = useState([]);
  //Dialog visible
  const [visible, setVisible] = useState(false);
  const [rowData, setRowData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { token } = getUserData();
        const responseApproved = await getTravelsByStatus(token, "Approved");
        const responseSettled = await getTravelsByStatus(token, "Settled");
        console.log("Fetched travel data: ", responseApproved.data);
        console.log("Fetched travel data 2: ", responseSettled.data);
        const mergedData = [...responseApproved.data, ...responseSettled.data];
        setTravelData(mergedData); // Save data to state
      } catch (error) {
        console.error("Error fetching travel data:", error);
      }
    };

    fetchData();
  }, []);

  const handelShowPreviousData = async (requisionId) => {
    console.log("clickrequisionId", requisionId);
    //Dialog visible set
    setVisible(true);
    const { token } = getUserData();
    const response = await getMyFormParticularRequisitionId(token, requisionId);
    setRowData(response?.data);
    console.log("response", response);
    console.log("response data :; ", response.data);
  };

  // If there's no data yet
  if (!travelData || travelData.length === 0) {
    return (
      <div
      // className="px-4 mx-auto max-w-[85rem] lg:px-12"
      >
        <text>No approved travels found.</text>
      </div>
    );
  }

  return (
    <>
      {/* <div className="px-4 mx-auto max-w-[85rem] lg:px-12"> */}
      <text>Open Travels Table</text>

      <DataTable value={travelData}>
        <Column field="date" header="Date"></Column>
        <Column field="userName" header="Name"></Column>
        <Column field="empCode" header="Employee Code"></Column>
        <Column
          field="projectName"
          header="Project Name"
          style={{ alignItems: "center", justifyContent: "center" }}
        ></Column>
        <Column field="unsettledAmount" header="Unsettled Amount"></Column>
        <Column field="advanceRequested" header="Advance Requested"></Column>
        <Column field="advance" header="Advance Given"></Column>
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
                onClick={() => {
                  handelShowPreviousData(rowData.requisionId);
                }}
              >
                <i className="pi pi-eye" style={{ color: "black" }}></i>
              </Button>
            );
          }}
          header="View"
        ></Column>
        <Column
          body={(rowData) => {
            return (
              <Button
                variant="contained"
                onClick={() => {
                  handelShowPreviousData(rowData.requisionId);
                }}
              >
                <i className="pi pi-pencil" style={{ color: "black" }}></i>
              </Button>
            );
          }}
          header="Set Advance"
        ></Column>
        <Column
          body={(rowData) => {
            return (
              <Button
                variant="contained"
                onClick={() => {
                  handelShowPreviousData(rowData.requisionId);
                }}
              >
                <i className="pi pi-check" style={{ color: "black" }}></i>
              </Button>
            );
          }}
          header="Travel Complete"
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
        {console.log("visible", visible)}
        <text variant="h6">Requisition Form View</text>
        {/* <RequisitionFormView rowData={rowData} /> */}
        <div style={{ padding: 20 }}>
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
                <Column
                  field="numberOfNights"
                  header="Number Of Nights"
                ></Column>
                <Column field="checkIn" header="Check In"></Column>
                <Column field="checkOut" header="Check Out"></Column>
                <Column field="comment" header="Comment"></Column>
              </DataTable>
            </Grid>

            <Grid size={12}>Manager Name : {rowData.manager_id}</Grid>
            <Grid size={12}>
              Manager Comment : {rowData.manager_suggestion}
            </Grid>
          </Grid>
        </div>
      </Dialog>
    </>
  );
};

export default OpenTravelsTable;
