import React, { useEffect, useState,useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { getOtherClaims,downloadOtherClaimSupportingDocument } from './claimServices'; // Adjust the path as needed
const cellStyle = { padding: "8px 12px" };
import { Button } from "primereact/button";
import { Toast } from 'primereact/toast';


const MiscellaneousClaimTable = () => {
    const toast = useRef(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const downloadSupportingDocument = (rowData) => {
      const handleDownloadFile = async (claim_id) => {
        try {
          let response = await downloadOtherClaimSupportingDocument(claim_id);
          if(!response.status)
          {
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
  

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const result = await getOtherClaims();
        setData(result);
      } catch (error) {
        console.error('Error fetching claims:', error);
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
          value={data}
          paginator
          rows={10}
          loading={loading}
          showGridlines
          stripedRows
          dataKey="claim_id"
          emptyMessage="No claims found."
          tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
        >
          <Column field="type" header="Claim Type" sortable filter  />
          <Column field="claim_date" header="Application Date" sortable filter  />
          <Column field="amount" header="Amount" sortable filter  />
          <Column field="reason" header="Details" sortable filter  />
          <Column field="status" header="Status" sortable filter  />
          <Column field="approver_remarks" header="Approved Remarks" sortable filter  />
          <Column field="approver" header="Approver" sortable filter />
            <Column
                    field="downloadSupportingDocument"
                    header="Supporting Document"
                    body={downloadSupportingDocument}
                    headerStyle={cellStyle}
                    bodyStyle={cellStyle}
                    sortable filter
                  />
        </DataTable>
         </div>
  );
};

export default MiscellaneousClaimTable;
