import React, { useState, useEffect,useRef } from "react";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
const cellStyle = { padding: "8px 12px" };
import { getloanclaimsapplied,rejectLoanClaim,approveLoanClaim  } from "../claimServices";
import { Toast } from "primereact/toast";

const HRLoanApplicationTable = () => {
  const toast = useRef(null);
  const [loanData, setloanData] = useState();
  const [loading, setLoading] = useState();
  const [remarks,setRemarks]=useState()

  const actionbody = (rowData) => {
    
    const handleRejectClick=async(claim_id,remarks)=>{
    try{
          let response=  await rejectLoanClaim(claim_id,remarks)
          if(response.status)
          {
            setloanData(response.data)
             toast.current.show({ 
                severity: 'success', 
                summary: 'Success', 
                detail: response.message
            });
           
          }else
          {
          toast.current.show({
          severity: "error",
          summary: "error",
          detail: response.message,
        });
          }
       }catch(error)
       {
          toast.current.show({
          severity: "error",
          summary: "error",
          detail: error?.message
        });
       }
   
    }


    const handleApproveClick=async(claim_id,remarks)=>{
    try{
          let response=  await approveLoanClaim(claim_id,remarks)
          if(response.status)
          {
            setloanData(response.data)
             toast.current.show({ 
                severity: 'success', 
                summary: 'Success', 
                detail: response.message
            });
           
          }else
          {
          toast.current.show({
          severity: "error",
          summary: "error",
          detail: response.message,
        });
          }
       }catch(error)
       {
          toast.current.show({
          severity: "error",
          summary: "error",
          detail: error?.message
        });
       }
   
    }
    
  return (
    <div className="flex flex-col gap-y-2 max-w-xs"> {/* limits total width */}
      <textarea
        placeholder="remarks"
        className="border border-md rounded-md p-2 w-full"
        rows={2}
        value={remarks}
     onChange={(e) => setRemarks(e.target.value)}
      ></textarea>
      <div className="flex gap-x-1">
        <Button
          label="Approve"
          size="small"
          severity="success"
          onClick={()=>handleApproveClick(rowData.claimId,remarks)}
          
         
        />
        <Button
          label="Reject"
          size="small"
          severity="danger"
          onClick={()=>handleRejectClick(rowData.claimId,remarks)}
   
        />
      </div>
    </div>
  );
};


 useEffect(() => {
  const fetchloandetails = async () => {
    try {
      const result = await getloanclaimsapplied();
      if (!result.status) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: result.message,
        });
      } else {
        setloanData(result.data);
      }
    } catch (error) {
      console.error("Error fetching claims:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchloandetails();
}, []);
  return (
    <div>
       <Toast ref={toast} />
    <DataTable
      value={loanData}
      loading={loading}
      showGridlines
      paginator
      rows={10}
      showGridlinesclassName="text-xs"
      tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
    >
      <Column
        field="name"
        header="Name"   
        headerStyle={{...cellStyle,maxWidth:"107px"}}
        bodyStyle={{...cellStyle,maxWidth:"107px"}}
      />
       <Column
        field="designation"
        header="Designation"   
        headerStyle={{...cellStyle,maxWidth:"107px"}}
        bodyStyle={{...cellStyle,maxWidth:"107px"}}
      />
    
      <Column
        field="claimDate"
        header="Claim Date"   
        headerStyle={{...cellStyle,maxWidth:"115px"}}
        bodyStyle={{...cellStyle,maxWidth:"115px"}}
      />
      <Column
        field="requirementDate"
        header="Loan Start Date"
        
      
       headerStyle={{...cellStyle,maxWidth:"107px"}}
        bodyStyle={{...cellStyle,maxWidth:"107px"}}
      />
      <Column
        field="amount"
        header="Loan Amount"
        
         
        headerStyle={{...cellStyle,maxWidth:"107px"}}
        bodyStyle={{...cellStyle,maxWidth:"107px"}}

      />
      <Column
        field="emi"
        header="Total EMIs"
        
        
      headerStyle={{...cellStyle,maxWidth:"107px"}}
        bodyStyle={{...cellStyle,maxWidth:"107px"}}
      />
      <Column
        field="emiAmount"
        header="EMI Amount"
       
      headerStyle={{...cellStyle,maxWidth:"107px"}}
        bodyStyle={{...cellStyle,maxWidth:"107px"}}
      />
      <Column
        field="numberOfEMIsPending"
        header="EMIs Pending"
       
        headerStyle={{...cellStyle,maxWidth:"107px"}}
        bodyStyle={{...cellStyle,maxWidth:"107px"}}
      />
      <Column
        field="loanAmountPending"
        header="Pending Loan Amount"
        
      headerStyle={{...cellStyle,maxWidth:"107px"}}
        bodyStyle={{...cellStyle,maxWidth:"107px"}}
      />
      <Column
        field="numberOfMonthsAfterLastEMI"
        header="Months After Last EMI"
        
        headerStyle={{...cellStyle,maxWidth:"107px"}}
        bodyStyle={{...cellStyle,maxWidth:"107px"}}
      />
      <Column
        field="reason"
        header="Reason"
         
       headerStyle={{...cellStyle,maxWidth:"107px"}}
        bodyStyle={{...cellStyle,maxWidth:"107px"}}
      />
      <Column
        field="status"
        header="Status"
        
       headerStyle={{...cellStyle,maxWidth:"107px"}}
        bodyStyle={{...cellStyle,maxWidth:"107px"}}
      />

      <Column
        body={actionbody}
        header="Action"
        
        headerStyle={{...cellStyle,}}
        bodyStyle={{...cellStyle}}
      />
    </DataTable>
    </div>
  );
};

export default HRLoanApplicationTable;
