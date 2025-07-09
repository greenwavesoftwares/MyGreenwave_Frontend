import  { useState, useEffect, useRef } from "react";


const cellStyle = { padding: "8px 12px" };
import {
  getAppliedTourClaims,
  downloadTourClaimSupportingDocument,
  downloadTourClaimExpanseDocument,
  getTourClaimTableDraftData,
  CheckForAnyTourClaimsInStatusReviewing,
  tourClaimSendForApproval
} from "../claimServices";
import { DataTable } from "primereact/datatable";


import { ProgressBarComponent } from "../../../components/ProgressBar/ProgressBarComponent";
import {
  CustomColumn,
  DataTableComponent,
} from "../../../components/DataTable/DataTableComponent";

import CustomToast from "../../../components/Toast/Toast";
import CustomButton from "../../../components/Button/Button";

import CustomDialog from "../../../components/Dialog/DialogComponent"
import {
  showSuccessMessage,
  showErrorMessage,
  showWarningMessage,
} from "../../../components/Toast/ShowMessage";
import { FilterMatchMode } from "primereact/api";
import { InputText } from "primereact/inputtext";



const AppliedTourClaimTable = () => {
  const toastRef = useRef(null);
  const [appliedtourclaimData, setappliedtourclaimData] = useState();
  const [loader, setLoader] = useState(false);
  //const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewtabledata, setviewtabledata] = useState();
  //const [reviewData, setreviewData] = useState([]);

   const [globalFilterValue, setGlobalFilterValue] =
        useState(""); 
      const [globalFilterRows, setGlobalFilterRows] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        name: { value: null, matchMode: FilterMatchMode.CONTAINS },
        'Claim Duration': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'Tour Details': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'Claim Calculation': { value: null, matchMode: FilterMatchMode.CONTAINS },
        status: { value: null, matchMode: FilterMatchMode.CONTAINS },
     
        Expense: { value: null, matchMode: FilterMatchMode.CONTAINS },
       
      });
    
      const onGlobalFilterChange = (e) => {
        const value = e.target.value;
        let _globalFilterRows = { ...globalFilterRows };
    
        _globalFilterRows["global"].value = value;
    
        setGlobalFilterRows(_globalFilterRows);
        setGlobalFilterValue(value);
      };
    
      const renderHeaderForGlobalSearch = () => {
        return (
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <InputText
              value={globalFilterValue}
              onChange={onGlobalFilterChange}
              placeholder="Keyword Search"
              className="w-full sm:w-auto"
            />
          </div>
        );
      };
    
       const dataTableHeader = renderHeaderForGlobalSearch();

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
         showErrorMessage(toastRef, "error", error?.message);
        
      }
    };

    const viewtable = async (claim_id) => {
      try {
        let data = await getTourClaimTableDraftData(claim_id);
        setviewtabledata(data.tourClaimRecords);
         console.log('data', data)
        setShowViewDialog(true);
      } catch (error) {
         showErrorMessage(toastRef, "error", "Failed to load table");
       
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
         showErrorMessage(toastRef, "error", 'Something Wrong');
      
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
            showSuccessMessage(
          toastRef,
          "success",
         "reviewed"
        );
          
        }

        if (data.status == false) {
           showErrorMessage(toastRef, "error", data.message);
        
        }
      } catch (error) {
         showErrorMessage(toastRef, "error", error?.message);
      
      }
    };

    const handleSendForApprovalClick = async () => {
     if (!reason || !settlementAmount) {
      showWarningMessage(toastRef, "warn", "Fill the settlement amount and reason");
      return;
    }
      let response = await tourClaimSendForApproval(
        rowData.claim_id,
        reason,
        settlementAmount
      );
      if (response.status) {
        setappliedtourclaimData(response.data);
        setReason('');
        setSettlementAmount('')
          showSuccessMessage(
                  toastRef,
                  "success",
                  "Sent For Approval"
                );
       
      }

      if (response.status == false) {
         showErrorMessage(toastRef, "error", response.message);
       
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
              placeholder="Approval Amount"
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

            <CustomButton
              label="Send for Approval"
              severity="success"
              size="small"
              className="px-1 py-1 text-white rounded-lg shadow hover:shadow-md transition w-36 "
              onClick={handleSendForApprovalClick}
            />
          </div>
        ) : (
          <CustomButton label="Review" size="small" onClick={handleReviewClick} />
        )}
      </div>
    );
  };

  useEffect(() => {
    const fetchappliedtourclaim = async () => {
      try {
        setLoader(true)
        const result = await getAppliedTourClaims();
        if (!result.status) {
           showErrorMessage(toastRef, "error", result.message);
         
        }
        setappliedtourclaimData(result.data);
      } catch (error) {
        console.error("Error fetching claims:", error);
      } finally {
        setLoader(false);
      }
    };

    fetchappliedtourclaim();
  }, [setappliedtourclaimData]);
  return (
    <div>
      <CustomToast ref={toastRef} />
      <DataTable
        value={appliedtourclaimData}
       // loading={loading}
        paginator
        rows={10}
        showGridlines
        className="text-xs"
       
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
       
        tableStyle={{
          minWidth: "100%",
          fontSize: "0.7rem",
          backgroundColor: "#e6f0ff",
        }}
        rowClassName={(rowData) => {
          if (rowData[0].status == "Applied") return "bg-cyan-50";
          if (rowData[0].status == "Reviewing") return "bg-green-50";
        }}

         header={dataTableHeader}
        filters={globalFilterRows}
        globalFilterFields={[
          "name",
          "Claim Duration",
          "Tour Details",
          "Claim Calculation",
          "Expense",
          "status",
          
        ]}
      >
        <CustomColumn
          field="name"
          header="Name"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />

        <CustomColumn
          body={datebody}
          header="Claim Duration"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />

        <CustomColumn
          body={tourDetailsBody}
          header="Tour Details"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />

        <CustomColumn
          body={claimCalculationBody}
          header="Claim Calculation"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />

        <CustomColumn
          field="Expense"
          header="Expense"
          body={downloadExpense}
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
          sortable
          filter
        />

        <CustomColumn
          field="supportingDocuments"
          header="Supporting Documents"
          body={downloadSupportingDocument}
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <CustomColumn
          field="status"
          header="Status"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        {/* Action Columns */}
        <CustomColumn
          body={actionbody}
          header="Approval Action"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
      </DataTable>
      <CustomDialog
        header="Tour Claim Details"
        visible={showViewDialog}
        style={{ width: "90vw" }}
        onHide={() => setShowViewDialog(false)}
        
      >
        <DataTableComponent
          data={viewtabledata}
           
          showGridlines
          tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
          paginator={false}
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

export default AppliedTourClaimTable;
