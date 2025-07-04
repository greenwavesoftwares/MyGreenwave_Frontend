import { useEffect, useState, useRef } from "react";

import {
  getApprovedAndRejectMiscellanousClaim,
  downloadOtherClaimSupportingDocument,
} from "../claimServices"; // Adjust the path as needed
const cellStyle = { padding: "8px 12px" };

import CustomButton from "../../../components/Button/Button";

import CustomToast from "../../../components/Toast/Toast";
import { ProgressBarComponent } from "../../../components/ProgressBar/ProgressBarComponent";
import {
  CustomColumn,
  DataTableComponent,
} from "../../../components/DataTable/DataTableComponent";
import {
  showSuccessMessage,
  showErrorMessage,
} from "../../../components/Toast/ShowMessage";

import { FilterMatchMode } from "primereact/api";
import { InputText } from "primereact/inputtext";


const AccountMiscellanousClaimHistory = () => {
 const toastRef = useRef(null);
   const [data, setData] = useState([]);
   const [loader, setLoader] = useState(false);
 
    const [globalFilterValue, setGlobalFilterValue] =
        useState("");
      const [globalFilterRows, setGlobalFilterRows] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
         name: { value: null, matchMode: FilterMatchMode.CONTAINS },
               designation: { value: null, matchMode: FilterMatchMode.CONTAINS },
               type: { value: null, matchMode: FilterMatchMode.CONTAINS },
               claim_date: { value: null, matchMode: FilterMatchMode.CONTAINS },
               amount: { value: null, matchMode: FilterMatchMode.CONTAINS },
               status: { value: null, matchMode: FilterMatchMode.CONTAINS },
               reason: { value: null, matchMode: FilterMatchMode.CONTAINS },
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

   const downloadSupportingDocument = (rowData) => {
     const handleDownloadFile = async (claim_id) => {
       try {
         let response = await downloadOtherClaimSupportingDocument(claim_id);
         if (!response.status) {
           showErrorMessage(toastRef, "error", response.message);
          
         }
       } catch (error) {
         showErrorMessage(toastRef, "error", error?.message);
         
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
          style={!rowData.filename ? { color: '#708090' }:{}}
          disabled={rowData.filename?false:true}
       />
     );
   };

   const approverBody=(rowData)=>
  {
    return(
        <div className="flex">
            <span>{rowData.approverName}</span>:
            <span>{rowData.approver_remarks}</span>
        </div>
    )
  }
  
 
   useEffect(() => {
     const fetchClaims = async () => {
       try {
        setLoader(true)
         const response = await getApprovedAndRejectMiscellanousClaim();
         console.log('response', response)
         if (response.status) {
           setData(response.data);
         } else {
           showErrorMessage(toastRef, "error", response.message);
         
         }
       } catch (error) {
         showErrorMessage(toastRef, "error", error?.message);
         console.error("Error fetching claims:", error);
       } finally {
         setLoader(false);
       }
     };
 
     fetchClaims();
   }, []);
 
   return (
     <div>
       <CustomToast ref={toastRef} />
       <DataTableComponent
         data={data}
       
         rows={10}
       
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
         dataKey="claim_id"
        // emptyMessage="No claims found."
         tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
          header={dataTableHeader}
        filters={globalFilterRows}
        globalFilterFields={[
          "name",
          "designation",
          "type",
          "claim_date",
          "amount",
          "status",
          "reason"
        ]}

       >
        
         <CustomColumn field="name" header="Name" sortable={true} filter={true} />
         <CustomColumn field="designation" header="Designation" sortable={true} filter={true} />
         
         <CustomColumn field="type" header="Claim Type" sortable={true} filter={true} />
         <CustomColumn field="claim_date" header="Application Date" sortable={true} filter={true} />
         <CustomColumn field="amount" header="Amount" sortable={true} filter={true}/>
         <CustomColumn field="reason" header="Details" sortable={true} filter={true} />
         <CustomColumn field="status" header="Status" sortable={true} filter={true} />
         <CustomColumn
          body={approverBody}
           header="Approver-Remarks"
           sortable={false}
           filter={false}
         />
         {/* <Column field="approverName" header="Approver" sortable filter /> */}
         <CustomColumn
           field="downloadSupportingDocument"
           header="Supporting Document"
           body={downloadSupportingDocument}
           headerStyle={cellStyle}
           bodyStyle={cellStyle}
           sortable={false}
           filter={false}
         />
       </DataTableComponent>
     </div>
   );
}

export default AccountMiscellanousClaimHistory