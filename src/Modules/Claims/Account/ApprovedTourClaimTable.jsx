import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";

const cellStyle = { padding: "8px 12px" };
//import { getApprovedTourClaims } from "../claimServices";
import {
  getTourClaimList,
  downloadTourClaimSupportingDocument,
  downloadTourClaimExpanseDocument,
  getTourClaimTableDraftData,
  getApprovedTourClaims,
} from "../claimServices";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

const ApprovedTourClaimTable = () => {
  const toast = useRef(null);
  const [approvedtourclaimData, setapprovedtourclaimData] = useState();
  const [loading, setLoading] = useState();
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewtabledata, setviewtabledata] = useState();

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

  const tourDetailsBody = (rowData) => (
    <div className="space-y-1 flex flex-col justify-center items-start">
      <div>
        <span className="font-semibold">Destination:</span>{" "}
        {rowData["destination"]}
      </div>
      <div>
        <span className="font-semibold">Purpose:</span> {rowData["purpose"]}
      </div>
      <div>
        <span className="font-semibold">Project:</span> {rowData["project"]}
      </div>
      <div>
        <span className="font-semibold">Type:</span> {rowData["type"]}
      </div>
    </div>
  );
  const datebody = (rowData) => {
    return (
      <div className="flex flex-col justify-center items-center">
        <span className=" text-center"> {rowData.from_date}</span>
        <span className="text-center"> to </span>
        <span className=" text-center"> {rowData.from_date} </span>
      </div>
    );
  };

  const reviewer_approver_remarks_body=(rowData)=>{
   return(
    <div className="space-y-1 flex flex-col justify-center items-start">
      <div>
        <span className="font-semibold">Reviewer:</span>{" "}
        {rowData["reviewer_remarks"]}
      </div>
      <div>
        <span className="font-semibold">Approver:</span> {rowData["approver_remarks"]}
      </div>
      
    </div>
   )
  }
  useEffect(() => {
    const fetchapprovedtourclaim = async () => {
      try {
        const result = await getApprovedTourClaims();
        if (!result.status) {
          toast.current.show({
            severity: "error",
            summary: "error",
            detail: result.message,
          });
        }
        setapprovedtourclaimData(result.data);
        console.log(result);
      } catch (error) {
        console.error("Error fetching claims:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchapprovedtourclaim();
  }, [setapprovedtourclaimData]);
  return (
    <div>
      <Toast ref={toast} />
      <DataTable
        value={approvedtourclaimData}
        loading={loading}
        paginator
        rows={10}
        showGridlines
        className="text-xs"
        tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
      >
        <Column
          field="name"
          header="Name"
          sortable
          filter
      
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        {/* <Column
          field="emp_id"
          header="Employee ID"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        /> */}

        <Column
          body={datebody}
          header="Claim Duration"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        
        {/* <Column
          field="from_date"
          header="From"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <Column
          field="to_date"
          header="To"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        /> */}

        <Column
          body={tourDetailsBody}
          header="Tour Details"
          sortable
          filter
          style={{width:'300px'}}
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />

        {/* <Column
          field="type"
          header="Type"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <Column
          field="destination"
          header="Destination"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <Column
          field="purpose"
          header="Purpose"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <Column
          field="project"
          header="Project"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        /> */}
        <Column
          field="account"
          header="On Account"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />

        <Column
          header="Claim Calculation"
          body={claimCalculationBody}
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        {/* <Column
          field="advance"
          header="Advance"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <Column
          field="total_expense"
          header="Expense"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <Column
          field="amountToBeClaimed"
          header="Claim"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <Column
          field="dueAmount"
          header="Due"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        /> */}
        <Column
          field="settlement_amount"
          header="Paid"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <Column
         body={reviewer_approver_remarks_body}
          header="Reviewer Comments"
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

export default ApprovedTourClaimTable;
