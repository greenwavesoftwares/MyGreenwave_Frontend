import { useState, useEffect, useRef } from "react";


const cellStyle = { padding: "8px 12px" };
//import { getApprovedTourClaims } from "../claimServices";
import {

  downloadTourClaimSupportingDocument,
  downloadTourClaimExpanseDocument,
  getTourClaimTableDraftData,
  getApprovedTourClaims,
} from "../claimServices";
import { ProgressBarComponent } from "../../../components/ProgressBar/ProgressBarComponent";
import {
  CustomColumn,
  DataTableComponent,
} from "../../../components/DataTable/DataTableComponent";

import CustomToast from "../../../components/Toast/Toast";
import CustomButton from "../../../components/Button/Button";

import CustomDialog from "../../../components/Dialog/DialogComponent";
import {
  showSuccessMessage,
  showErrorMessage,
} from "../../../components/Toast/ShowMessage";

//import { Button } from "primereact/button";
//import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";

const ApprovedTourClaimTable = () => {
  const toastRef = useRef(null);
  const [approvedtourclaimData, setapprovedtourclaimData] = useState();
  const [loader, setLoader] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewtabledata, setviewtabledata] = useState();
  const [rowData, setRowData] = useState({});

  const downloadExpense = (rowData) => {
    const handleDownloadFile = async (claim_id) => {
      try {
        let d = await downloadTourClaimExpanseDocument(claim_id);
      } catch (error) {
          showErrorMessage(toastRef, "error",  "Something Wrong.");
        
      }
    };

    const viewtable = async (claim_id) => {
      try {
        let data = await getTourClaimTableDraftData(claim_id);
        setviewtabledata(data.tourClaimRecords);
        console.log('data', data)

        setShowViewDialog(true);
      } catch (error) {
          showErrorMessage(toastRef, "error",  error?.message);
       
      }
    };

    return (
      <div className="flex justify-center items-center gap-2">
        <CustomButton
          icon="pi pi-download"
          className="p-button-sm p-button-text p-button-success"
          onClick={() => {
            handleDownloadFile(rowData.claim_id);
          }}
          tooltip={""}
        />
        <CustomButton
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
          showErrorMessage(toastRef, "error",  error?.message);
       
      }
    };

    return (
      <CustomButton
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

  const reviewer_approver_remarks_body = (rowData) => {
    return (
      <div className="space-y-1 flex flex-col justify-center items-start">
        <div>
          <span className="font-semibold">Reviewer:</span>{" "}
          {rowData["reviewer_remarks"]}
        </div>
        <div>
          <span className="font-semibold">Approver:</span>{" "}
          {rowData["approver_remarks"]}
        </div>
      </div>
    );
  };
  useEffect(() => {
    const fetchapprovedtourclaim = async () => {
      try {
        setLoader(true)
        const result = await getApprovedTourClaims();
        if (!result.status) {
            showErrorMessage(toastRef, "error",  result.message);
         
        }
        setapprovedtourclaimData(result.data);
        setRowData(result.data);
        console.log(result);
      } catch (error) {
          showErrorMessage(toastRef, "error",  error?.message);
        console.error("Error fetching claims:", error);
      } finally {
        setLoader(false);
      }
    };

    fetchapprovedtourclaim();
  }, [setapprovedtourclaimData]);
  return (
    <div>
      <CustomToast ref={toastRef} />
      <DataTableComponent
        data={approvedtourclaimData}
        // loading={loading}
        //  paginator
        rows={10}
        //  showGridlines
        className="text-xs"
        tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
        emptyMessage={
          loader ? (
            <ProgressBarComponent
              mode="indeterminate"
              style={{ height: "6px" }}
            />
          ) : (
            "No data found"
          )
        }
      >
        <CustomColumn
          field="name"
          header="Name"
          sortable={true}
          filter={true}
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

        <CustomColumn
          body={datebody}
          header="Claim Duration"
          sortable={true}
          filter={true}
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

        <CustomColumn
          body={tourDetailsBody}
          header="Tour Details"
          sortable={true}
          filter={true}
          style={{ width: "300px" }}
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
        <CustomColumn
          field="account"
          header="On Account"
          sortable={true}
          filter={true}
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />

        <CustomColumn
          header="Claim Calculation"
          body={claimCalculationBody}
          sortable={true}
          filter={true}
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
        <CustomColumn
          field="settlement_amount"
          header="Paid"
          sortable={true}
          filter={true}
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <CustomColumn
          body={reviewer_approver_remarks_body}
          header="Reviewer Comments"
          sortable={true}
          filter={true}
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />

        <CustomColumn
          field="Expense"
          header="Expense"
          body={downloadExpense}
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
          sortable={true}
          filter={true}
        />

        <CustomColumn
          field="supportingDocuments"
          header="Supporting Documents"
          body={downloadSupportingDocument}
          sortable={true}
          filter={true}
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
      </DataTableComponent>
      <CustomDialog
        header="Tour Claim Details"
        visible={showViewDialog}
        style={{ width: "90vw" }}
        onHide={() => setShowViewDialog(false)}
        modal
      >
        <DataTableComponent
          data={viewtabledata}
          //showGridlines
          rows={10}
          paginator={false}
           tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
        >
          <CustomColumn
            field="date"
            header="Date"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
          />
          <CustomColumn
            field="lodging"
            header="Lodging"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
          />
          <CustomColumn
            field="breakfast"
            header="Breakfast"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
          />
          <CustomColumn
            field="lunch"
            header="Lunch"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
          />
          <CustomColumn
            field="snacks"
            header="Snacks"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
          />
          <CustomColumn
            field="dinner"
            header="Dinner"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
          />
          <CustomColumn
            field="teaWater"
            header="Tea & Water"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
          />
          <CustomColumn
            field="longTravel"
            header="Airfare, Bus, Train, Taxi Rental"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
          />
          <CustomColumn
            field="shortTravel"
            header="Auto, Cab"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
          />
          <CustomColumn
            field="tollTax"
            header="Parking, Toll, Fuel"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
          />
          <CustomColumn
            field="incidentals"
            header="Incidentals"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
          />
          <CustomColumn
            field="other"
            header="Other Business Expenses"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
          />
          <CustomColumn
            field="total"
            header="Total"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
          />
          <CustomColumn
            field="remarks"
            header="Remarks"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
          />
        </DataTableComponent>
      </CustomDialog>
    </div>
  );
};

export default ApprovedTourClaimTable;
