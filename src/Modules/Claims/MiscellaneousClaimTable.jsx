import React, { useEffect, useState,useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { getOtherClaims,downloadOtherClaimSupportingDocument } from './claimServices'; // Adjust the path as needed
const cellStyle = { padding: "8px 12px" };
//import { Button } from "primereact/button";
import { Toast } from 'primereact/toast';
import { ProgressBar } from "primereact/progressbar";
import {CustomColumn,DataTableComponent} from "../../components/DataTable/DataTableComponent";
import CustomButton from "../../components/Button/Button";
import {
  showSuccessMessage,
  showErrorMessage,
  showWarningMessage,
} from "../../components/Toast/ShowMessage";



const MiscellaneousClaimTable = () => {
    const toastRef = useRef(null);
  const [data, setData] = useState([]);
  const [loader, setLoader] = useState(false);
   
  const downloadSupportingDocument = (rowData) => {
      const handleDownloadFile = async (claim_id) => {
        try {
          let response = await downloadOtherClaimSupportingDocument(claim_id);
          if(!response.status)
          {
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
          error?.message,
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
          style={!rowData.filename ? { color: '#708090' }:{}}
          disabled={rowData.filename?false:true}
        />
      );
    };
  

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        setLoader(true)
        const result = await getOtherClaims();
        setData(result);
      } catch (error) {
        console.error('Error fetching claims:', error);
      } finally {
        setLoader(false);
      }
    };

    fetchClaims();
  }, []);

  return (
    <div>
    <Toast ref={toastRef} />
        <DataTableComponent
          data={data}
        
          rows={10}
      
          showGridlines
          stripedRows
          dataKey="claim_id"
        //  emptyMessage="No claims found."
          tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
         emptyMessage={
          loader? (
             <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
           
          ) : (
              "No data found"
          )
        }
        >
          <CustomColumn field="type" header="Claim Type" sortable filter  />
          <CustomColumn field="claim_date" header="Application Date" sortable filter  />
          <CustomColumn field="amount" header="Amount" sortable filter  />
          <CustomColumn field="reason" header="Details" sortable filter  />
          <CustomColumn field="status" header="Status" sortable filter  />
          <CustomColumn field="approver_remarks" header="Approved Remarks" sortable filter  />
          <CustomColumn field="approver" header="Approver" sortable filter />
            <CustomColumn
                    field="downloadSupportingDocument"
                    header="Supporting Document"
                    body={downloadSupportingDocument}
                    headerStyle={cellStyle}
                    bodyStyle={cellStyle}
                   // sortable filter
                  />
        </DataTableComponent>
         </div>
  );
};

export default MiscellaneousClaimTable;
