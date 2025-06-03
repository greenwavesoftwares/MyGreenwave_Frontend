import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

const cellStyle = { padding: "8px 12px" };
import {
  getReviewedTourClaims,
  downloadTourClaimSupportingDocument,
  downloadTourClaimExpanseDocument,
  getTourClaimTableDraftData,
  ApprovedTourClaim,
  RejectTourClaim
} from "../claimServices";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { ToggleButton } from "primereact/togglebutton";
import { Card } from "primereact/card";

const HRTourClaimTable = () => {
  const toast = useRef(null);
  const [reviewedtourclaimData, setreviewedtourclaimData] = useState();
  const [loading, setLoading] = useState();
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewtabledata, setviewtabledata] = useState();
  const [reviewData, setreviewData] = useState([]);

  const datebody = (rowData) => {
    return (
      <div className="flex flex-col justify-center items-center">
        <span className=" text-center"> {rowData.from_date}</span>
        <span className="text-center"> to </span>
        <span className=" text-center"> {rowData.to_date} </span>
      </div>
    );
  };

  const tourDetailsBody = (rowData) => (
    <div
      className="test"
      style={{ display: "grid", justifyContent: "flex-start" }}
    >
      <div className="display-flex">
        <span className="font-semibold">Destination:</span>
        {rowData["destination"]}
      </div>
      <div className="display-flex">
        <span className="font-semibold">Purpose:</span> {rowData["purpose"]}
      </div>
      <div className="display-flex">
        <span className="font-semibold">Project:</span> {rowData["project"]}
      </div>
      <div className="display-flex">
        <span className="font-semibold">Type:</span> {rowData["type"]}
      </div>
      <div className="display-flex">
        <span className="font-semibold">On Account:</span> {rowData["account"]}
      </div>
    </div>
  );
  const claimCalculationBody = (rowData) => (
    <div className="flex flex-col items-end justify-center  space-y-1">
      <div>
        <span className="font-semibold text-gray-700">Expense:</span> ₹
        {rowData["total_expense"]}
      </div>
      <div>
        <span className="font-semibold text-gray-700">Advance:</span> ₹
        {rowData["advance"]}
      </div>
      <hr className="w-2/3 border-gray-300" />
      {rowData["dueAmount"] > 0 ? (
        <div>
          <span className="font-semibold text-yellow-700">Due:</span> ₹
          {rowData["dueAmount"]}
        </div>
      ) : (
        <div>
          <span className="font-semibold text-green-700">Claim:</span> ₹
          {rowData["amountToBeClaimed"]}
        </div>
      )}
    </div>
  );
  const downloadExpense = (rowData) => {
    const handleDownloadFile = async (claim_id) => {
      try {
        let d = await downloadTourClaimExpanseDocument(claim_id);
      } catch (error) {
        toast.current.show({
          severity: "error",
          summary: "error",
          detail: "Something Wrong.",
        });
      }
    };

    const viewtable = async (claim_id) => {
      try {
        let data = await getTourClaimTableDraftData(claim_id);
        setviewtabledata(data.tourClaimRecords);

        setShowViewDialog(true);
      } catch (error) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Failed to load table.",
        });
      }
    };

    return (
      <div className="flex justify-center items-center gap-2">
        <Button
          icon="pi pi-download"
          className="p-button-sm p-button-text p-button-success"
          onClick={() => {
            handleDownloadFile(rowData.claim_id);
          }}
          tooltip={""}
        />
        <Button
          icon="pi pi-eye"
          className="p-button-sm p-button-text p-button-success"
          onClick={() => {
            viewtable(rowData.claim_id);
          }}
          tooltip={""}
        />
      </div>
    );
  };

  const downloadSupportingDocument = (rowData) => {
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

    return (
      <Button
        icon="pi pi-download"
        className="p-button-sm p-button-text p-button-success"
        onClick={() => {
          handleDownloadFile(rowData.claim_id);
        }}
        tooltip={`${rowData.filename}`}
      />
    );
  };

  const actionbody =  (rowData) => {
    // const [reason, setReason] = useState("");
    // const [settlementAmount, setSettlementAmount] = useState("");
    const handleApproveSubmit = async() => {
      try {
        const response =await ApprovedTourClaim(rowData.claim_id, "Approved");
        if (response.status) {
            setreviewedtourclaimData(response.data)
              toast.current.show({
          severity: "sucess",
          summary: "sucess",
          detail: response.message,
        });
            
        }else{
             toast.current.show({
          severity: "error",
          summary: "Error",
          detail: response.message,
        });
        }
      } catch (error) {
         toast.current.show({
          severity: "error",
          summary: "Error",
          detail: error?.message,
        });
      }
    };

    const handleSubmitReject=async()=>{
     
      try {
        const response =await RejectTourClaim(rowData.claim_id, "Rejected");
        if (response.status) {
            setreviewedtourclaimData(response.data)
              toast.current.show({
          severity: "sucess",
          summary: "sucess",
          detail: response.message,
        });
            
        }else{
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: response.message,
        });
        }
      } catch (error) {

      }
    }

    return (
      <div className="flex gap-2">
        <Button
          label="Approve"
          size="small"
          severity="success"
          onClick={() => handleApproveSubmit()} 
        />
        <Button label="Reject" size="small" severity="danger"   onClick={() => handleSubmitReject()} />
      </div>
    );
  };

  useEffect(() => {
    const fetchreviewedtourclaim = async () => {
      try {
        const result = await getReviewedTourClaims();
        if (!result.status) {
          toast.current.show({
            severity: "error",
            summary: "error",
            detail: result.message,
          });
        }
        setreviewedtourclaimData(result.data);
      } catch (error) {
        console.error("Error fetching claims:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchreviewedtourclaim();
  }, [setreviewedtourclaimData]);
  return (
    <div>
      <Toast ref={toast} />
      <DataTable
        value={reviewedtourclaimData}
        loading={loading}
        paginator
        rows={10}
        showGridlines
        className="text-xs"
        //style={{backgroundColor:"e6f0ff"}}

        tableStyle={{
          minWidth: "100%",
          fontSize: "0.7rem",
          backgroundColor: "#e6f0ff",
        }}
      >
        <Column
          field="name"
          header="Name"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />

        <Column
          body={datebody}
          header="Claim Duration"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />

        <Column
          body={tourDetailsBody}
          header="Tour Details"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />

        <Column
          body={claimCalculationBody}
          header="Claim Calculation"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />

        <Column
          field="Expense"
          header="Expense"
          body={downloadExpense}
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
          sortable
          filter
        />

        <Column
          field="supportingDocuments"
          header="Supporting Documents"
          body={downloadSupportingDocument}
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <Column
          field="status"
          header="Status"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        {/* Action Columns */}
        <Column
          body={actionbody}
          header="Approval Action"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
      </DataTable>
      <Dialog
        header="Tour Claim Details"
        visible={showViewDialog}
        style={{ width: "90vw" }}
        onHide={() => setShowViewDialog(false)}
        modal
      >
        <DataTable
          value={viewtabledata}
          showGridlines 
        className="text-xs"
        tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
        >
          <Column
            field="date"
            header="Date"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
          />
          <Column
            field="lodging"
            header="Lodging"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
          />
          <Column
            field="breakfast"
            header="Breakfast"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
          />
          <Column
            field="lunch"
            header="Lunch"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
          />
          <Column
            field="snacks"
            header="Snacks"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
          />
          <Column
            field="dinner"
            header="Dinner"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
          />
          <Column
            field="teaWater"
            header="Tea & Water"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
          />
          <Column
            field="longTravel"
            header="Airfare, Bus, Train, Taxi Rental"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
          />
          <Column
            field="shortTravel"
            header="Auto, Cab"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
          />
          <Column
            field="tollTax"
            header="Parking, Toll, Fuel"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
          />
          <Column
            field="incidentals"
            header="Incidentals"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
          />
          <Column
            field="other"
            header="Other Business Expenses"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
          />
          <Column
            field="total"
            header="Total"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
          />
          <Column
            field="remarks"
            header="Remarks"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
          />
        </DataTable>
      </Dialog>
    </div>
  );
};

export default HRTourClaimTable;
