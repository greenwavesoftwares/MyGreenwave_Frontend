import { useEffect, useState } from 'react';


import {getloanclaimsapproveandreject} from './claimServices'
const cellStyle = { padding: "8px 12px" };
import { Toast } from "primereact/toast";
import {
  CustomColumn,
  DataTableComponent,
} from "../../../components/DataTable/DataTableComponent";

import {ProgressBarComponent} from "../../../components/ProgressBar/ProgressBarComponent"
import {
  showSuccessMessage,
  showErrorMessage,
  showWarningMessage,
} from  "../../../components/Toast/ShowMessage";

const LoanApplicationTable = () => {
    const toastRef = useRef(null);
   const [loanData,setloanData]=useState();
    const [loader,setLoader]=useState(false);
    
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
             setloanData(result.data);
           }
         } catch (error) {
           showErrorMessage(
          toastRef,
         "error",
         error?.message
        );
           console.error("Error fetching claims:", error);
         } finally {
           setLoader(false);
         }
       };
     
       fetchloandetails();
     }, []);
  
  return (
    <div>
       <Toast ref={toastRef} />
       <DataTableComponent data={loanData}   className="text-xs"
           tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
           emptyMessage={
        loader ? (
          <ProgressBarComponent mode="indeterminate" style={{ height: "6px" }} />
        ) : (
          "No data found"
        )
      }
           >
     <Column 
     field="claimDate" 
     header="Claim Date" 
     headerStyle={{ ...cellStyle, minWidth: '100px' }} 
     bodyStyle={{ ...cellStyle, minWidth: '100px'}} 
   />
     <CustomColumn field="requirementDate" header="Loan Start Date" headerStyle={cellStyle}
               bodyStyle={cellStyle}/>
     <CustomColumn field="amount" header="Loan Amount" headerStyle={cellStyle}
               bodyStyle={cellStyle}/>
     <CustomColumn field="emi" header="Total EMIs" headerStyle={cellStyle}
               bodyStyle={cellStyle}/>
     <CustomColumn field="emiAmount" header="EMI Amount" headerStyle={cellStyle}
               bodyStyle={cellStyle}/>
     <CustomColumn field="numberOfEMIsPending" header="EMIs Pending" headerStyle={cellStyle}
               bodyStyle={cellStyle}/>
     <CustomColumn field="loanAmountPending" header="Pending Loan Amount" headerStyle={cellStyle}
               bodyStyle={cellStyle}/>
     <CustomColumn field="numberOfMonthsAfterLastEMI" header="Months After Last EMI" headerStyle={cellStyle}
               bodyStyle={cellStyle}/>
     <CustomColumn field="reason" header="Reason"  headerStyle={{ ...cellStyle, minWidth: '100px' }} 
     bodyStyle={{ ...cellStyle, minWidth: '100px'}} />
     <CustomColumn field="status" header="Status" headerStyle={cellStyle}
               bodyStyle={cellStyle}/>
     <CustomColumn field="approverName" header="Approver Name" headerStyle={cellStyle}
               bodyStyle={cellStyle}/>
     {/* <Column field="approver" header="Approver Email" style={{ minWidth: '150px' }}/> */}
     <CustomColumn field="approver_remarks" header="Approver Remarks" headerStyle={cellStyle}
               bodyStyle={cellStyle}/>
   </DataTableComponent>
   </div>
  )
}

export default LoanApplicationTable
