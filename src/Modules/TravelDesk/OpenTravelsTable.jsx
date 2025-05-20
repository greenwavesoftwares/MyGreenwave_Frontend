import React, { useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
//Call Api
import {
  getMyFormParticularRequisitionId,
  getTravelsByStatus,
} from "./TravelDeskAPI";
import { getUserData } from "../Login/Encrypt";
import { Dialog } from "primereact/dialog";
import { useState } from "react";
import RequisitionFormView from "./RequisitionFormView";
import { InputText } from "primereact/inputtext";
import { Chip, IconButton } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import PreviewIcon from "@mui/icons-material/Preview";

const OpenTravelsTable = () => {
  const [travelData, setTravelData] = useState([]);
  //Dialog visible
  const [visible, setVisible] = useState(false);
  const [rowData, setRowData] = useState({});
  const [editRowId, setEditRowId] = useState(null);
  const [newAdvanceAmount, setNewAdvanceAmount] = useState(0.0);

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

  const handelShowRequisitionForm = async (requisionId) => {
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
      <div>
        <h3>No approved travels found.</h3>
      </div>
    );
  }

  const handleSaveAdvance = (row) => {
    const updated = travelData.map((item) =>
      item.requisionId === row.requisionId
        ? { ...item, advance: newAdvanceAmount }
        : item
    );
    setTravelData(updated);
    setEditRowId(null);
    setNewAdvanceAmount(row.advance);
    // Add API call to update backend here if needed
  };

  const handleCancelAdvance = (row) => {
    setEditRowId(null);
    setNewAdvanceAmount(row.advance);
  };

  const advanceColumnBody = (row) => {
    if (editRowId === row.requisionId) {
      return (
        <InputText
          size="small"
          value={newAdvanceAmount}
          onChange={(e) => setNewAdvanceAmount(e.target.value)}
        />
      );
    }
    return row.advance;
  };

  const setAdvanceActions = (row) => {
    if (editRowId === row.requisionId) {
      return (
        <>
          <IconButton
            aria-label="Save"
            size="small"
            color="success"
            onClick={() => handleSaveAdvance(row)}
          >
            <SaveIcon />
          </IconButton>
          <IconButton
            aria-label="Cancel"
            size="small"
            color="error"
            onClick={() => handleCancelAdvance(row)}
          >
            <CancelIcon />
          </IconButton>
        </>
      );
    }
    return (
      <IconButton
        aria-label="Edit"
        label="View"
        onClick={() => {
          setEditRowId(row.requisionId);
          setNewAdvanceAmount(row.advance);
        }}
      >
        <EditIcon />
      </IconButton>
    );
  };

  return (
    <>
      {/* <div className="px-4 mx-auto max-w-[85rem] lg:px-12"> */}
      <h3>Open Travels Table</h3>

      <DataTable value={travelData}>
        <Column
          field="date"
          header="Date"
          headerStyle={{ textAlign: "center" }}
          style={{ textAlign: "center" }}
        />
        <Column
          field="userName"
          header="Name"
          headerStyle={{ textAlign: "center" }}
          style={{ textAlign: "center" }}
        />
        <Column
          field="empCode"
          header="Employee Code"
          headerStyle={{ textAlign: "center" }}
          style={{ textAlign: "center" }}
        />
        <Column
          field="projectName"
          header="Project Name"
          headerStyle={{ textAlign: "center" }}
          // headerClassName="center-header"
          style={{ textAlign: "center" }}
        />
        <Column
          field="unsettledAmount"
          header="Unsettled Amount"
          headerStyle={{ textAlign: "center" }}
          style={{ textAlign: "center" }}
        />
        <Column
          field="advanceRequested"
          header="Advance Requested"
          headerStyle={{ textAlign: "center" }}
          style={{ textAlign: "center" }}
        />
        <Column
          body={advanceColumnBody}
          header="Advance Given"
          headerStyle={{ textAlign: "center" }}
          style={{ textAlign: "center" }}
        />
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
          headerStyle={{ textAlign: "center" }}
          style={{ textAlign: "center" }}
        />
        <Column
          body={(rowData) => {
            return (
              <IconButton
                aria-label="View"
                onClick={() => {
                  handelShowRequisitionForm(rowData.requisionId);
                }}
              >
                <PreviewIcon />
              </IconButton>
            );
          }}
          header="View"
          headerStyle={{ textAlign: "center" }}
          style={{ textAlign: "center" }}
        />
        <Column
          body={setAdvanceActions}
          header="Set Advance"
          headerStyle={{ textAlign: "center" }}
          style={{ textAlign: "center" }}
        />
        <Column
          body={(rowData) => {
            return (
              <IconButton
                aria-label="Complete"
                onClick={() => {
                  handelShowRequisitionForm(rowData.requisionId);
                }}
              >
                <CheckIcon />
              </IconButton>
            );
          }}
          header="Travel Complete"
          headerStyle={{ textAlign: "center" }}
          style={{ textAlign: "center" }}
        />
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
        <h2>Requisition Form View</h2>
        <RequisitionFormView rowData={rowData} />
      </Dialog>
    </>
  );
};

export default OpenTravelsTable;
