import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { getTourClaimList } from './claimServices';
import { Tag } from 'primereact/tag';

const cellStyle = {
    padding: '0.5rem 1rem',
    textAlign: 'center',
    verticalAlign: 'middle'
};

const MyTourClaims = () => {
    const [expandedRows, setExpandedRows] = useState(null);
    const [tourClaims, setTourClaims] = useState([]);

    const tourDetailsBody = (rowData) => (
        <div className="text-xs space-y-1 flex flex-col justify-center">  
            <div><span className='font-bold'>Destination:</span> {rowData['destination']}</div>
            <div><span className='font-bold'>Purpose:</span> {rowData['purpose']}</div>
            <div><span className='font-bold'>Project:</span> {rowData['project']}</div>
            <div><span className='font-bold'>Type:</span> {rowData['type']}</div>
        </div>
    );

    const claimCalculationBody = (rowData) => (
        <div className="flex flex-col items-center justify-center text-sm space-y-1">
            <div>
                <span className="font-semibold text-gray-700">Expense:</span> ₹{rowData['total_expensevance']}
            </div>
            <div>
                <span className="font-semibold text-gray-700">Advance:</span> ₹{rowData['advance']}
            </div>
            <hr className="w-2/3 border-gray-300" />
            {rowData['dueAmount'] > 0 ? (
                <div>
                    <span className="font-semibold text-yellow-700">Due:</span> ₹{rowData['dueAmount']}
                </div>
            ) : (
                <div>
                    <span className="font-semibold text-green-700">Claim:</span> ₹{rowData['amountToBeClaimed']}
                </div>
            )}
        </div>
    );

    const approverBody = (rowData) => (
        <div className="flex flex-col items-center justify-center text-sm text-gray-800 space-y-1">
            <div>
                 {rowData['approver'] || 'NA'}
            </div>
            <div className="italic text-gray-600">
                {rowData['approver_remarks'] || 'No remarks'}
            </div>
        </div>
    );

    const reviewerBody = (rowData) => (
        <div className="flex flex-col items-center justify-center text-sm text-gray-800 space-y-1">
            <div>
              {rowData['reviewer'] || 'NA'}
            </div>
            <div className="italic text-gray-600">
                {rowData['reviewer_remarks'] || 'No remarks'}
            </div>
        </div>
    );

    const statusBody = (rowData) => {
        const status = rowData.status?.toLowerCase();
        const severity = status === 'approved' ? 'success' : status === 'settled' ? 'info' : 'warning';
        return (
            <div className="flex justify-center">
                <Tag value={rowData.status || 'Pending'} severity={severity} className="text-xs" />
            </div>
        );
    };

    const datebody=(rowData)=>{
        return(
            <div className='flex flex-col justify-center items-center'>   
            <span className='text-sm text-center'> {rowData.from_date}</span>
            <span className='text-sm text-center'> to  </span>
            <span className='text-sm text-center'> {rowData.from_date} </span>
            </div>
        )
    }

    const rowExpansionTemplate = (rowData) => (
        <div className="p-4 bg-gray-50 rounded-lg shadow-md">
           <DataTable
  value={rowData.expandabledata}
  className="text-sm text-center"
  tableStyle={{ minWidth: '60rem' }}
>
    <Column header="Date" body={datebody} headerStyle={{ ...cellStyle, width: '120px', whiteSpace: 'normal' }} />
    <Column header="Claim Details" body={tourDetailsBody}   headerStyle={{ ...cellStyle, width: '200px', whiteSpace: 'normal' }}
      bodyStyle={{ ...cellStyle, width: '200px', whiteSpace: 'normal', wordBreak: 'break-word' }} />
    <Column header="Claim Calculation" body={claimCalculationBody}   headerStyle={{ ...cellStyle, width: '200px', whiteSpace: 'normal' }}
      bodyStyle={{ ...cellStyle, width: '200px', whiteSpace: 'normal', wordBreak: 'break-word' }} />
    <Column 
      header="Approver - Remarks" 
      body={approverBody}
      headerStyle={{ ...cellStyle, width: '200px', whiteSpace: 'normal' }}
      bodyStyle={{ ...cellStyle, width: '200px', whiteSpace: 'normal', wordBreak: 'break-word' }}
    />
    <Column 
      header="Reviewer - Remarks" 
      body={reviewerBody}
      headerStyle={{ ...cellStyle, width: '200px', whiteSpace: 'normal' }}
      bodyStyle={{ ...cellStyle, width: '200px', whiteSpace: 'normal', wordBreak: 'break-word' }}
    />
    <Column field="status" header="Status" body={statusBody} headerStyle={cellStyle} bodyStyle={cellStyle} />
</DataTable>

        </div>
    );

    useEffect(() => {
        const fetchTourClaimList = async () => {
            try {
                const data = await getTourClaimList();
                setTourClaims(data);
                console.log(data)
            } catch (error) {
                console.error("Error fetching tour claim list:", error);
            }
        };

        fetchTourClaimList();
    }, []);

    return (
        <div className="overflow-x-auto p-4">
            <DataTable
                value={tourClaims}
                expandedRows={expandedRows}
                onRowToggle={(e) => setExpandedRows(e.data)}
                rowExpansionTemplate={rowExpansionTemplate}
                dataKey="requisition_id"
                className="rounded-lg shadow-lg text-center"
                tableStyle={{ fontSize: '0.875rem', minWidth: '60rem' }}
            >
                <Column expander style={{ width: '3rem' }} />
                <Column field="fromDate" header="From Date" headerStyle={cellStyle} bodyStyle={cellStyle} />
                <Column field="tentativeToDate" header="Tentative Date" headerStyle={cellStyle} bodyStyle={cellStyle} />
                <Column field="actualToDate" header="Actual To Date" headerStyle={cellStyle} bodyStyle={cellStyle} />
                <Column field="project" header="Project" headerStyle={cellStyle} bodyStyle={cellStyle} />
                <Column field="purpose" header="Purpose" headerStyle={cellStyle} bodyStyle={cellStyle} />
                <Column field="destination" header="Destination" headerStyle={cellStyle} bodyStyle={cellStyle} />
                <Column field="type" header="Type" headerStyle={cellStyle} bodyStyle={cellStyle} />
            </DataTable>
        </div>
    );
};

export default MyTourClaims;
