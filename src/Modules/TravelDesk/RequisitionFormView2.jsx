import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Box, Grid } from "@mui/material";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { getUserData } from "../Login/Encrypt";
import { InputTextarea } from "primereact/inputtextarea";
import { FloatLabel } from "primereact/floatlabel";
import { Button as PrimeReactButton } from "primereact/button";
import { InputText } from "primereact/inputtext";

const RequisitionFormView2 = ({
  rowData,
  handleApproveTravel,
  handleRejectTravel,
  formData,
  setFormData,
}) => {
  console.log("rowData : ", rowData);
  console.log("formData : ", formData);

  const { userDetails } = getUserData();
  const [editingRows, setEditingRows] = useState({});
  const [editingRows2, setEditingRows2] = useState({});

  const textEditor = (options) => (
    <InputText
      value={options.value}
      onChange={(e) => options.editorCallback(e.target.value)}
      className="text-xs  w-full"
    />
  );

  const onRowEditComplete = (e) => {
    const { newData, index } = e;
    console.log("newData", newData);
    console.log("index", index);
    // if (!newData.mode || !newData.fromDate) {
    //   showWarningMessage(toastRef,"Mode and From Date are required.");
    //   return;
    // }
    const updated = rowData;
    updated.transportModes[index] = newData;
    setFormData(updated);
    rowData.transportModes[index] = newData;
  };

  const onRowEditComplete2 = (e) => {
    const { newData, index } = e;
    // if (!newData.mode || !newData.fromDate) {
    //   showWarningMessage(toastRef,"Mode and From Date are required.");
    //   return;
    // }
    const updated = rowData;
    updated.accommodations[index] = newData;
    setFormData(updated);
    rowData.accommodations[index] = newData;
  };

  return (
    <>
      <Grid container spacing={2}>
        <Grid size={6} sx={{ border: "1px solid #ccc", borderRadius: 2, p: 2 }}>
          <span
            style={{
              fontWeight: "bold",
              fontSize: "1.1rem",
              marginRight: "4px",
            }}
          >
            Purpose :{" "}
          </span>
          <span>{rowData.purpose}</span>
        </Grid>
        <Grid size={6} sx={{ border: "1px solid #ccc", borderRadius: 2, p: 2 }}>
          <span
            style={{
              fontWeight: "bold",
              fontSize: "1.1rem",
              marginRight: "4px",
            }}
          >
            Project Name :{" "}
          </span>
          <span>{rowData.projectName}</span>
        </Grid>
        <Grid size={6} sx={{ border: "1px solid #ccc", borderRadius: 2, p: 2 }}>
          <span
            style={{
              fontWeight: "bold",
              fontSize: "1.1rem",
              marginRight: "4px",
            }}
          >
            City :{" "}
          </span>
          <span>{rowData.city}</span>
        </Grid>
        <Grid size={6} sx={{ border: "1px solid #ccc", borderRadius: 2, p: 2 }}>
          <span
            style={{
              fontWeight: "bold",
              fontSize: "1.1rem",
              marginRight: "4px",
            }}
          >
            Locality/Area :{" "}
          </span>
          <span>{rowData.localityArea}</span>
        </Grid>
        <Grid size={6} sx={{ border: "1px solid #ccc", borderRadius: 2, p: 2 }}>
          <span
            style={{
              fontWeight: "bold",
              fontSize: "1.1rem",
              marginRight: "4px",
            }}
          >
            Type of Travel :{" "}
          </span>
          <span>{rowData.typeOfTravel}</span>
        </Grid>
        <Grid size={6} sx={{ border: "1px solid #ccc", borderRadius: 2, p: 2 }}>
          <span
            style={{
              fontWeight: "bold",
              fontSize: "1.1rem",
              marginRight: "4px",
            }}
          >
            Advance Requested :{" "}
          </span>
          <span>{rowData.advanceRequested}</span>
        </Grid>
        <Grid
          size={12}
          sx={{ border: "1px solid #ccc", borderRadius: 2, p: 2 }}
        >
          <span
            style={{
              fontWeight: "bold",
              fontSize: "1.1rem",
              marginRight: "4px",
            }}
          >
            Advance Given :{" "}
          </span>
          <span>{rowData.advance}</span>
        </Grid>
        <Grid size={12} sx={{ border: "1px solid #ccc" }}>
          <DataTable
            header="Mode of Transport"
            value={rowData.transportModes}
            editMode="row"
            dataKey="mode"
            onRowEditComplete={onRowEditComplete}
            editingRows={editingRows}
            onRowEditChange={(e) => setEditingRows(e.data)}
          >
            <Column field="mode" header="Mode"></Column>
            <Column field="fromDate" header="From Date"></Column>
            <Column field="comment" header="Comment"></Column>
            {/* <Column field="manager_remark" header="Manager Remark"></Column> */}
            <Column
              field="manager_remark"
              header="Manager Remark"
              editor={textEditor}
            ></Column>
            <Column rowEditor={true} headerStyle={{ width: "10%" }} />
          </DataTable>
        </Grid>

        <Grid size={12} sx={{ border: "1px solid #ccc" }}>
          <DataTable
            header="Reservation of Accommodation"
            value={rowData.accommodations}
            editMode="row"
            dataKey="type"
            onRowEditComplete={onRowEditComplete2}
            editingRows={editingRows2}
            onRowEditChange={(e) => setEditingRows2(e.data)}
          >
            <Column field="type" header="Type"></Column>
            <Column field="numberOfRooms" header="Number Of Rooms"></Column>
            <Column field="numberOfNights" header="Number Of Nights"></Column>
            <Column field="checkIn" header="Check In"></Column>
            <Column field="checkOut" header="Check Out"></Column>
            <Column field="comment" header="Comment"></Column>
            {/* <Column field="manager_remark" header="Manager Remarks"></Column> */}
            <Column
              field="manager_remark"
              header="Manager Remark"
              editor={textEditor}
            ></Column>
            <Column rowEditor={true} headerStyle={{ width: "10%" }} />
          </DataTable>
        </Grid>

        {/* <Grid size={6} sx={{ border: "1px solid #ccc", borderRadius: 2, p: 2 }}>
          <span
            style={{
              fontWeight: "bold",
              fontSize: "1.1rem",
              marginRight: "4px",
            }}
          >
            Manager Name :{" "}
          </span>
          {rowData.manager_id}
        </Grid> */}
        <Grid
          size={12}
          sx={{ border: "1px solid #ccc", borderRadius: 2, p: 2 }}
        >
          {" "}
          {formData?.manager_id === userDetails?.userId &&
          formData?.status === "Pending" ? (
            <Box
              display="flex"
              gap={2}
              flexDirection="row"
              marginTop={2}
              alignItems={"center"}
              justifyContent={"center"}
            >
              {/* <Grid item xs={6}>
                Manager Name:{" "}
                <div style={{ fontWeight: "bold", color: "blue" }}>
                  {formData?.manager_id}
                </div>
              </Grid> */}
              <FloatLabel>
                <InputTextarea
                  cols={50}
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
          ) : (
            <div>Manager Comment : {rowData.manager_suggestion}</div>
          )}
        </Grid>
      </Grid>
    </>
  );
};

export default RequisitionFormView2;
