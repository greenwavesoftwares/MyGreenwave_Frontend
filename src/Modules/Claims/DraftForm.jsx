import React, { useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { FileUpload } from "primereact/fileupload";

import TourClaimForm from "./TourClaimForm";
import TourClaimTable from "./TourClaimTable";
import { FiUpload } from "react-icons/fi";
import {
  getTravelDropDown,
  uploadSupportingDocuments,
  deleteDraftList,
  applyClaim,
  downloadTourClaimSupportingDocument,
  getTourClaimTableDraftData,
  getlatestclaimtodate,
  formateDate,
} from "./claimServices";

const DraftForm = ({
  draftData,
  setDraftData,
  seteditableMode,
  editableMode,
  settoggleNewClaim,
  tourclaimforsettoggleNewClaimmData,
  settourclaimformData,
  settourClaimTableData,
  travelOptions,
  setTravelModeOptions
  
}) => {
  const cellStyle = { padding: "12px 16px" };
  const toast = useRef(null);

  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState(null);

  const handleDelete = async (claim_id, status) => {
    let response = await deleteDraftList(claim_id, status);
    if (!response.status) {
      toast.current.show({
        severity: "error",
        summary: "error",
        detail: response.message,
      });
    } else {
     
      toast.current.show({
        severity: "success",
        summary: "Success",
        detail: response.message,
      });
       setDraftData(response.data);
      if (response.data.length == 0) {
      settoggleNewClaim(true);
      seteditableMode(false);
      settourClaimTableData([]);
      settourclaimformData([])
    }
    }

    
  };

  const handleApplyApproval = async (claim_id, status) => {
    try {
      let response = await applyClaim(claim_id, status);
      if (!response.status) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: error?.message,
        });
      } else {
         toast.current.show({
          severity: "success",
          summary: "Success",
          detail: "You have successfully applied for approval.",
        });
        setDraftData(response.data);
        if (response.data.length == 0) {
          settoggleNewClaim(true);
          seteditableMode(false);
          settourClaimTableData([]);
        }
       
      }
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to apply: " + (error?.message || error),
      });
    }
  };

  const handleEdit = async (claim_id, requisition_id) => {
    try {
      const data = await getTourClaimTableDraftData(claim_id);
      const travelDropDown = await getTravelDropDown();
     
     let obj = travelDropDown.data;
    //  setTravelModeOptions(obj)

      const matchedItem = obj.find(item => item.value === data.requisition_id);

// const travelmodeLabel = matchedItem ? matchedItem.label : null;
  
      let dates = await getlatestclaimtodate(requisition_id);

     
      // console.log('all data',obj)      
      // console.log('this should be selected',matchedItem)
      // console.log('req id',data.requisition_id)
              
           
      settourclaimformData({
        advance: 0,
        claim_id: data.claim_id,
        requisition_id: requisition_id,
        travelMode: matchedItem,
        travelType: data.type,
        destination: data.destination,
        purpose: data.purpose,
        projectName: data.project,
        onAccount: data.account,
        travelfromDate: formateDate(dates[0].travelfromdate),
        claimFromDate: formateDate(dates[0].claimformdate),
        claimToDate: formateDate(dates[0].claimtodate),
        filename: data.filename,
        file_type: data.file_type,
      });
      // settourClaimTableData(data.tourClaimRecords)

      const formattedRows = data.tourClaimRecords.map((row) => ({
        Date: row.date,
        Lodging: row.lodging, // typo fixed from "loading"
        Breakfast: row.breakfast,
        Lunch: row.lunch,
        Snacks: row.snacks,
        Dinner: row.dinner,
        "Tea & Water": row.teaWater,
        "Airfare, Bus, Train, Taxi Rental": row.longTravel,
        "Auto, Cab": row.shortTravel,
        "Parking, Toll, Fuel": row.tollTax,
        Incidentals: row.incidentals,
        "Other Business Expenses": row.other,
        Total: row.total,
        Remarks: row.remarks,
      }));

      settourClaimTableData(formattedRows);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  const actionBodyTemplate = (rowData) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-pencil"
        className="p-button-sm p-button-text p-button-info"
        onClick={() => {
          seteditableMode(true);
          handleEdit(rowData.claim_id, rowData.requisition_id);
        }}
        tooltip="Edit"
      />
      <Button
        icon="pi pi-trash"
        className="p-button-sm p-button-text p-button-danger"
        onClick={() => handleDelete(rowData.claim_id, "Cancelled")}
        tooltip="Delete"
      />
      <Button
        icon="pi pi-send"
        label="Apply"
        className="p-button-sm p-button-success p-button-text"
        onClick={() => handleApplyApproval(rowData.claim_id, "Applied")}
        tooltip="Apply for Approval"
      />
    </div>
  );

  const claimCalculationBody = (rowData) => (
    <div className="text-xs space-y-1 flex flex-col justify-center">
      <div>
        <span className="font-bold">Expense:</span> ₹{rowData["total_expense"]}
      </div>
      <div>
        <span className="font-bold">Advance:</span> ₹{rowData["advance"]}
      </div>
      <hr />
      {rowData["dueAmount"] ? (
        <div>
          <span className="font-bold">Due:</span> ₹{rowData["dueAmount"]}
        </div>
      ) : (
        <div>
          <span className="font-bold">Claim:</span> ₹
          {rowData["amountToBeClaimed"]}
        </div>
      )}
    </div>
  );

  const tourDetailsBody = (rowData) => (
    <div className="text-xs space-y-1 flex flex-col justify-center">
      <div>
        <span className="font-bold">Destination:</span> {rowData["destination"]}
      </div>
      <div>
        <span className="font-bold">Purpose:</span> {rowData["purpose"]}
      </div>
      <div>
        <span className="font-bold">Project:</span> {rowData["project"]}
      </div>
      <div>
        <span className="font-bold">Type:</span> {rowData["type"]}
      </div>
    </div>
  );

  const handleAddRow = () => {
    console.log("Add row clicked!");
    // You can add logic to add a new blank row if needed
  };

  const supportingDocumentBody = (rowData) => {
    const [fileUploaded, setFileUploaded] = useState(
      rowData.filename ? true : false
    );
    const [togglefileUpload, settogglefileUpload] = useState(
      rowData.filename ? false : true
    );
    const handleDownloadFile = async (claim_id) => {
      try {
        let d = await downloadTourClaimSupportingDocument(claim_id);
      } catch (error) {
        toast.current.show({
          severity: "error",
          summary: "error",
          detail: "Something Wrong.",
        });
      }
    };
    const onFileSelect = async (event) => {
      const file = event.files[0]; // Get the uploaded file
      setFileUploaded(true);
      settogglefileUpload(false);

      const formData = new FormData();
      formData.append("file", file); // Append file to formData

      try {
        const response = await uploadSupportingDocuments(
          file,
          rowData.claim_id
        ); // Adjust this call accordingly
        toast.current.show({
          severity: "success",
          summary: "Success",
          detail: "File Uploaded",
        });
      } catch (error) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Upload failed",
        });
        console.log(error);
        setFileUploaded(false);
        settogglefileUpload(true);
      }
    };
    return (
      <div className="flex flex-col justify-center mb-2 gap-x-2 gap-y-2">
        <Toast ref={toast} />

        {togglefileUpload ? (
          <FileUpload
            mode="basic"
            name="file"
            accept="*/*"
            customUpload
            uploadHandler={onFileSelect}
            maxFileSize={1000000}
            chooseLabel="Upload"
          />
        ) : null}

        {fileUploaded && (
          <div>
            <Button
              icon="pi pi-download"
              className="p-button-sm p-button-text p-button-success"
              onClick={() => {
                handleDownloadFile(rowData.claim_id);
              }}
              tooltip={`${rowData.filename}`}
            />
            <Button
              icon="pi pi-times"
              className="p-button-sm p-button-text p-button-danger"
              onClick={() => {
                setFileUploaded(false);
                settogglefileUpload(true);
              }}
              tooltip="Cancel"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div>
        <DataTable
          value={draftData}
          showGridlines
          paginator
          rows={10}
          className="text-xs"
          tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
        >
          <Column
            field="requisition_id"
            header="Claim Id"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
            sortable
            filter
          />
          
          <Column
            field="to_date"
            header="To"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
            sortable
            filter
          />
          <Column
            field="account"
            header="On Account"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
            sortable
            filter
          />
          <Column
            header="Tour Details"
            body={tourDetailsBody}
            headerStyle={cellStyle}
            bodyStyle={{ ...cellStyle, whiteSpace: "pre-line" }}
            sortable
            filter
          />
          <Column
            header="Claim Calculation"
            body={claimCalculationBody}
            headerStyle={cellStyle}
            bodyStyle={{ ...cellStyle, whiteSpace: "pre-line" }}
            sortable
            filter
          />
          <Column
            header="Upload Supporting Document"
            body={supportingDocumentBody}
            headerStyle={cellStyle}
            bodyStyle={{ ...cellStyle, whiteSpace: "pre-line" }}
            sortable
            filter
          />
          <Column
            header="Action"
            body={actionBodyTemplate}
            headerStyle={{ ...cellStyle, textAlign: "center" }}
            bodyStyle={{ ...cellStyle, textAlign: "center" }}
            sortable
            filter
          />
        </DataTable>
      </div>

      {/* 
            Future Dialog if needed
            <Dialog
                header="Edit Tour Claim"
                visible={editDialogVisible}
                onHide={() => setEditDialogVisible(false)}
                style={{ width: '80vw' }}
                breakpoints={{ '960px': '75vw', '641px': '90vw' }}
                modal
            >
                <TourClaimForm mode="popup" />
                <div className="flex justify-center gap-2 mt-4">
                    <Button label="Download" icon="pi pi-download" className="p-button-sm p-button-success" />
                </div>
                <TourClaimTable mode="popup" />
            </Dialog>
            */}
    </div>
  );
};

export default DraftForm;
