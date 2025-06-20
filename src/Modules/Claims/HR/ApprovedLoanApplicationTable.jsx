import { useEffect, useState, useRef } from "react";
import {
  CustomColumn,
  DataTableComponent,
} from "../../../components/DataTable/DataTableComponent";

import { getloanclaimsapproveandreject } from "../claimServices";
const cellStyle = { padding: "8px 12px" };

import CustomToast from "../../../components/Toast/Toast";
import {
  showSuccessMessage,
  showErrorMessage,
  showWarningMessage,
} from "../../../components/Toast/ShowMessage";

import {ProgressBarComponent} from "../../../components/ProgressBar/ProgressBarComponent"


const ApprovedLoanApplicationTable = () => {
  const toastRef = useRef(null);
  const [loanData, setloanData] = useState();
  const [loader, setLoader] = useState(false);

  useEffect(() => {
    const fetchloandetails = async () => {
      try {
        setLoader(true)
        const result = await getloanclaimsapproveandreject();
       
        if (!result.status) {
          showErrorMessage(
          toastRef,
         "error",
          result.message
        );
        } else {
          console.log('result', result)
          setloanData(result.data);
           setLoader(false)
        }
      } catch (error) {
         showErrorMessage(
          toastRef,
         "error",
          error?.message
        );
        console.error("Error fetching claims:", error);
      } finally {
        
        setLoader(false)
      }
    };

    fetchloandetails();
  }, []);

  return (
    <div>
      <CustomToast ref={toastRef} />
      <DataTableComponent
        data={loanData} 
        rows={10}     
       // showGridlines
        className="text-xs"
        tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
         emptyMessage={
                loader ? (
                  <ProgressBarComponent mode="indeterminate" style={{ height: "6px" }} />
                ) : (
                  "No data found"
                )}
      >
        <CustomColumn
          field="name"
          header="Name"
          headerStyle={{ ...cellStyle, maxWidth: "107px" }}
          bodyStyle={{ ...cellStyle, maxWidth: "107px" }}
        />
        <CustomColumn
          field="designation"
          header="Designation"
          headerStyle={{ ...cellStyle, maxWidth: "107px" }}
          bodyStyle={{ ...cellStyle, maxWidth: "107px" }}
        />
        <CustomColumn
          field="claimDate"
          header="Claim Date"
          headerStyle={{ ...cellStyle, minWidth: "100px" }}
          bodyStyle={{ ...cellStyle, minWidth: "100px" }}
        />
        <CustomColumn
          field="requirementDate"
          header="Loan Start Date"
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <CustomColumn
          field="amount"
          header="Loan Amount"
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <CustomColumn
          field="emi"
          header="Total EMIs"
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <CustomColumn
          field="emiAmount"
          header="EMI Amount"
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <CustomColumn
          field="numberOfEMIsPending"
          header="EMIs Pending"
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <CustomColumn
          field="loanAmountPending"
          header="Pending Loan Amount"
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <CustomColumn
          field="numberOfMonthsAfterLastEMI"
          header="Months After Last EMI"
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <CustomColumn
          field="reason"
          header="Reason"
          headerStyle={{ ...cellStyle, minWidth: "100px" }}
          bodyStyle={{ ...cellStyle, minWidth: "100px" }}
        />
        <CustomColumn
          field="status"
          header="Status"
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <CustomColumn
          field="approverName"
          header="Approver Name"
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        {/* <Column field="approver" header="Approver Email" style={{ minWidth: '150px' }}/> */}
        <CustomColumn
          field="approver_remarks"
          header="Approver Remarks"
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
      </DataTableComponent>
    </div>
  );
};

export default ApprovedLoanApplicationTable;
