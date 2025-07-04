import  { useState, useEffect, useRef } from "react";
import {
  CustomColumn,
  DataTableComponent,
} from "../../../components/DataTable/DataTableComponent";
import {ProgressBarComponent} from "../../../components/ProgressBar/ProgressBarComponent"

const cellStyle = { padding: "8px 12px" };
import {
  getReviewedTourClaims,
  downloadTourClaimSupportingDocument,
  downloadTourClaimExpanseDocument,
  getTourClaimTableDraftData,
  ApprovedTourClaim,
  RejectTourClaim
} from "../claimServices";

import {
  showSuccessMessage,
  showErrorMessage,
  showWarningMessage,
} from "../../../components/Toast/ShowMessage";
import CustomToast from "../../../components/Toast/Toast";
import CustomDialog from "../../../components/Dialog/DialogComponent"
import CustomButton from "../../../components/Button/Button";
import { FilterMatchMode } from "primereact/api";
import { InputText } from "primereact/inputtext";

const HRTourClaimTable = () => {
  const toastRef = useRef(null);
  const [reviewedtourclaimData, setreviewedtourclaimData] = useState();
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
              "Claim Duration": { value: null, matchMode: FilterMatchMode.CONTAINS },
              "Tour Details": { value: null, matchMode: FilterMatchMode.CONTAINS },
               "Claim Calculation": { value: null, matchMode: FilterMatchMode.CONTAINS },
               Expense: { value: null, matchMode: FilterMatchMode.CONTAINS },
               status: { value: null, matchMode: FilterMatchMode.CONTAINS },           
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
          showErrorMessage(
          toastRef,
         "error",
         "Something Wrong."
        );
       
      }
    };

    const viewtable = async (claim_id) => {
      try {
        let data = await getTourClaimTableDraftData(claim_id);
        setviewtabledata(data.tourClaimRecords);
        console.log('data', data)

        setShowViewDialog(true);
      } catch (error) {
          showErrorMessage(
                  toastRef,
                 "error",
                 "Failed to load table."
                );
        
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
          showErrorMessage(
          toastRef,
         "error",
         error?.message
        );
       
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

  const actionbody =  (rowData) => {
    // const [reason, setReason] = useState("");
    // const [settlementAmount, setSettlementAmount] = useState("");
    const handleApproveSubmit = async() => {
      try {
        const response =await ApprovedTourClaim(rowData.claim_id, "Approved");
        if (response.status) {
            setreviewedtourclaimData(response.data)
             showSuccessMessage(
                      toastRef,
                      "success",
                      response.message 
                    );
             
            
        }else{
            showErrorMessage(
          toastRef,
         "error",
          response.message
        );
            
        }
      } catch (error) {
        showErrorMessage(
          toastRef,
         "error",
         error?.message
        );
        
      }
    };

    const handleSubmitReject=async()=>{
     
      try {
        const response =await RejectTourClaim(rowData.claim_id, "Rejected");
        if (response.status) {
            setreviewedtourclaimData(response.data)
             showSuccessMessage(
                      toastRef,
                      "success",
                      response.message ,
                    );
            
            
        }else{
            showErrorMessage(
          toastRef,
         "error",
          result.message
        );
       
        }
      } catch (error) {
          showErrorMessage(
          toastRef,
         "error",
         error?.message
        );
      }
    }

    return (
      <div className="flex gap-2">
        <CustomButton
          label="Approve"
          size="small"
          severity="success"
          onClick={() => handleApproveSubmit()} 
        />
        <CustomButton label="Reject" size="small" severity="danger"   onClick={() => handleSubmitReject()} />
      </div>
    );
  };

  useEffect(() => {
    const fetchreviewedtourclaim = async () => {
      try {
        setLoader(true)
        const result = await getReviewedTourClaims();
        if (!result.status) {
            showErrorMessage(
          toastRef,
         "error",
          result.message
        );
          
        }
        console.log('result.data', result.data)
        setreviewedtourclaimData(result.data);
      } catch (error) {
        console.error("Error fetching claims:", error);
      } finally {
        setLoader(false);
      }
    };

    fetchreviewedtourclaim();
  }, [setreviewedtourclaimData]);
  return (
    <div>
      <CustomToast ref={toastRef} />
      <DataTableComponent
        data={reviewedtourclaimData}
        //loading={loading}
       // paginator
        rows={10}
        emptyMessage={
                loader ? (
                  <ProgressBarComponent mode="indeterminate" style={{ height: "6px" }} />
                ) : (
                  "No data found"
                )}  
        className="text-xs"
        tableStyle={{
          minWidth: "100%",
          fontSize: "0.7rem",
          backgroundColor: "#e6f0ff",
        }}

        header={dataTableHeader}
        filters={globalFilterRows}
        globalFilterFields={[
          "name",
          "Claim Duration",
          "Tour Details",
          "Claim Calculation",
          "Expense",
          "status"
        ]}


      >
        <CustomColumn
          field="name"
          header="Name"
         sortable={true}
          filter={true}
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />

        <CustomColumn
          body={datebody}
          header="Claim Duration"
           sortable={true}
          filter={true}
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />

        <CustomColumn
          body={tourDetailsBody}
          header="Tour Details"
          sortable={true}
          filter={true}
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />

        <CustomColumn
          body={claimCalculationBody}
          header="Claim Calculation"
          sortable={true}
          filter={true}
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        
        {/* settlement_amount */}

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
        <CustomColumn
          field="status"
          header="Status"
          sortable={true}
          filter={true}
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        {/* Action Columns */}
        <CustomColumn
          body={actionbody}
          header="Approval Action"
          sortable={false}
          filter={false}
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
      </DataTableComponent>
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

export default HRTourClaimTable;
