import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

const cellStyle = { padding: "8px 12px" };
import {
  getAppliedTourClaims,
  downloadTourClaimSupportingDocument,
  downloadTourClaimExpanseDocument,
  getTourClaimTableDraftData,
  CheckForAnyTourClaimsInStatusReviewing,
  tourClaimSendForApproval
} from "../claimServices";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { ToggleButton } from "primereact/togglebutton";
import { Card } from "primereact/card";

const AppliedTourClaimTable = () => {
  const toast = useRef(null);
  const [appliedtourclaimData, setappliedtourclaimData] = useState();
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

  const actionbody = (rowData) => {
    const [reason, setReason] = useState("");
    const [settlementAmount, setSettlementAmount] = useState("");
    const handleReviewClick = async () => {
      try {
        let data = await CheckForAnyTourClaimsInStatusReviewing(
          rowData.userId,
          rowData.claim_id
        );

        if (data.status) {
          setappliedtourclaimData(data.data);
          toast.current.show({
            severity: "success",
            summary: "Success",
            detail: "reviewed",
          });
        }

        if (data.status == false) {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: data.message,
          });
        }
      } catch (error) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: error?.message || "Failed to load table.",
        });
      }
    };

    const handleSendForApprovalClick = async () => {
      let response = await tourClaimSendForApproval(
        rowData.claim_id,
        reason,
        settlementAmount
      );
      if (response.status) {
        setappliedtourclaimData(response.data);
        setReason('');
        setSettlementAmount('')

        toast.current.show({
          severity: "success",
          summary: "Success",
          detail: "Sent For Approval",
        });
      }

      if (response.status == false) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: response.message,
        });
      }
    };

    return (
      <div>
        {rowData.status === "Reviewing" ? (
          <div className="flex flex-col justify-center items-center gap-2 p-2">
            <input
              id="settlementAmount"
              type="number"
              value={settlementAmount}
              onChange={(e) => setSettlementAmount(e.target.value)}
              placeholder="Settlement Amount"
              className="flex-1 border border-gray-300 rounded-lg p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-36"
            />

            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="reason"
              rows={3}
              className="flex-1 border border-gray-300 rounded-lg p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-36"
            />

            <Button
              label="Send for Approval"
              severity="success"
              size="small"
              className="px-1 py-1 text-white rounded-lg shadow hover:shadow-md transition w-36 "
              onClick={handleSendForApprovalClick}
            />
          </div>
        ) : (
          <Button label="Review" size="small" onClick={handleReviewClick} />
        )}
      </div>
    );
  };

  useEffect(() => {
    const fetchappliedtourclaim = async () => {
      try {
        const result = await getAppliedTourClaims();
        if (!result.status) {
          toast.current.show({
            severity: "error",
            summary: "error",
            detail: result.message,
          });
        }
        setappliedtourclaimData(result.data);
      } catch (error) {
        console.error("Error fetching claims:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchappliedtourclaim();
  }, [setappliedtourclaimData]);
  return (
    <div>
      <Toast ref={toast} />
      <DataTable
        value={appliedtourclaimData}
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
        rowClassName={(rowData) => {
          if (rowData[0].status == "Applied") return "bg-cyan-50";
          if (rowData[0].status == "Reviewing") return "bg-green-50";
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
          tableStyle={{ minWidth: "50rem" }}
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

export default AppliedTourClaimTable;
