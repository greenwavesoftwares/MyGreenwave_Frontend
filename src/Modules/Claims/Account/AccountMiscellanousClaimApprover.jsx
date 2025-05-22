import React, { useEffect, useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import {
  getAppliedMiscellanousClaimAccount,
  downloadOtherClaimSupportingDocument,
  approveMiscellanousClaim,
  rejectMiscellanousClaim
} from "../claimServices"; // Adjust the path as needed
const cellStyle = { padding: "8px 12px" };
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

const AccountMiscellanousClaimApprover = () => {
  const toast = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [miscellanousData,setmiscellanousData]=useState()
  
  const downloadSupportingDocument = (rowData) => {

    const handleDownloadFile = async (claim_id) => {
      try {
        let response = await downloadOtherClaimSupportingDocument(claim_id);
        if (!response.status) {
          toast.current.show({
            severity: "error",
            summary: "error",
            detail: response.message,
          });
        }
      } catch (error) {
        toast.current.show({
          severity: "error",
          summary: "error",
          detail: error?.message,
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
    const [remarks,setRemarks]=useState()
      
      const handleRejectClick=async(claim_id,remarks)=>{
      try{
            let response=  await rejectMiscellanousClaim(claim_id,remarks)
            if(response.status)
            {
              setmiscellanousData(response.data)
               toast.current.show({ 
                  severity: 'success', 
                  summary: 'Success', 
                  detail: response.message
              });
              setRemarks('')
              setmiscellanousData(response.data)

             
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
            let response=  await approveMiscellanousClaim(claim_id,remarks)
            if(response.status)
            {
              setmiscellanousData(response.data)
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
             className="bg-green-100 text-green-800 hover:bg-green-200 border-none"
             onClick={()=>handleApproveClick(rowData.claim_id,remarks)}
            
           
          />
          <Button
            label="Reject"
            size="small"
          className="bg-red-100 text-red-800 hover:bg-red-200 border-none"
            onClick={()=>handleRejectClick(rowData.claim_id,remarks)}
     
          />
        </div>
      </div>
    );
  };
  
  

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const response = await getAppliedMiscellanousClaimAccount();
        if (response.status) {
          setmiscellanousData(response.data);
        } else {
          toast.current.show({
            severity: "error",
            summary: "error",
            detail: response.message,
          });
        }
      } catch (error) {
        console.error("Error fetching claims:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, []);

  return (
    <div>
      <Toast ref={toast} />
      <DataTable
        value={miscellanousData}
        paginator
        rows={10}
        loading={loading}
        showGridlines
        stripedRows
        dataKey="claim_id"
        emptyMessage="No claims found."
        tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
      >
       
        {/* <Column field="claim_id" header="claim_id" sortable filter /> */}
        <Column field="name" header="Name" sortable filter />
        <Column field="designation" header="Designation" sortable filter />
        
        <Column field="type" header="Claim Type" sortable filter />
        <Column field="claim_date" header="Application Date" sortable filter />
        <Column field="amount" header="Amount" sortable filter />
        <Column field="reason" header="Details" sortable filter />
        <Column field="status" header="Status" sortable filter />
        {/* <Column
          field="approver_remarks"
          header="Approved Remarks"s
          sortable
          filter
        /> */}
        {/* <Column field="approver" header="Approver" sortable filter /> */}
        <Column
          field="downloadSupportingDocument"
          header="Supporting Document"
          body={downloadSupportingDocument}
          headerStyle={{...cellStyle,maxWidth:"125px"}}
          bodyStyle={{...cellStyle,maxWidth:"125px"}}
          sortable
          filter
        />
        <Column
                body={actionbody}
                header="Action"
                
                headerStyle={{...cellStyle,}}
                bodyStyle={{...cellStyle,}}
              />
      </DataTable>
    </div>
  );
};

export default AccountMiscellanousClaimApprover;
