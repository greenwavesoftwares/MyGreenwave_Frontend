import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { getOtherClaims } from './claimServices'; // Adjust the path as needed

const MiscellaneousClaimTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="p-6  rounded-2xl shadow-lg">
      <h2 className="text-lg font-semibold text-gray-800  mb-6">🧾 Miscellaneous Claims</h2>
      <div className="rounded-xl overflow-hidden">
        <DataTable
          value={data}
          paginator
          rows={10}
          loading={loading}
          showGridlines
          stripedRows
          dataKey="id"
          emptyMessage="No claims found."
          className="p-datatable-sm text-sm"
        >
          <Column field="type" header="Claim Type" sortable filter style={{ minWidth: '150px' }} />
          <Column field="claim_date" header="Application Date" sortable filter style={{ minWidth: '140px' }} />
          <Column field="amount" header="Amount" sortable filter style={{ minWidth: '100px' }} />
          <Column field="reason" header="Details" sortable filter style={{ minWidth: '180px' }} />
          <Column field="status" header="Status" sortable filter style={{ minWidth: '120px' }} />
          <Column field="approver_remarks" header="Approved Remarks" sortable filter style={{ minWidth: '200px' }} />
          <Column field="approver" header="Approver" sortable filter style={{ minWidth: '150px' }} />
        </DataTable>
      </div>
    </div>
  );
};

export default MiscellaneousClaimTable;
