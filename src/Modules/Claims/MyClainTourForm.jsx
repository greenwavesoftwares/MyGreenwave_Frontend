import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

const cellStyle = { padding: '4px 8px' }; // 0.25rem 0.5rem

const MyClaimTable = () => {
    

    const tableData = [
        {
            To: 'Anish Yadav',
            Type: 'Official',
            Destination: 'Delhi',
            Purpose: 'Conference',
            Project: 'ITC PCPB',
            'On Account': 'Training',
            'Advance (INR)': 5000,
            'Expense (INR)': 6200,
            'Claim (INR)': 1200,
            'Due (INR)': 0,
            'Settled Amount': '₹'+6200,
            Status: 'Approved',
            'Reviewer Remarks': 'Looks good',
            Reviewer: 'Rahul Sharma',
            'Approver Remarks': 'Approved without changes',
            Approver: 'Rahul Sharma'
        },
        {
            To: 'Neha Kumari',
            Type: 'Official',
            Destination: 'Bangalore',
            Purpose: 'Client Meeting',
            Project: 'UrbanConnect',
            'On Account': 'Business',
            'Advance (INR)': 7000,
            'Expense (INR)': 6500,
            'Claim (INR)': 0,
            'Due (INR)': 500,
            'Settled Amount': '₹'+7000,
            Status: 'Settled',
            'Reviewer Remarks': 'Exceeded limit slightly',
            Reviewer: 'Rahul Sharma',
            'Approver Remarks': 'Approved with note',
            Approver: 'Priya Singh'
        }
    ];

    const claimCalculationBody = (rowData) => (
        <div className="text-xs space-y-1 flex flex-col justify-center">
            <div><span className='font-bold'><span className='font-bold'>Expense:</span></span> ₹{rowData['Expense (INR)']}</div>
            <div><span className='font-bold'><span className='font-bold'>Advance:</span></span> ₹{rowData['Advance (INR)']}</div>
            <hr/>
            {rowData['Due (INR)'] ? (
                <div className=''><span className='font-bold'><span className='font-bold'>Due:</span></span> ₹{rowData['Due (INR)']}</div>
            ) : (
                <div className=''><span className='font-bold'><span className='font-bold'>Claim:</span></span>: ₹{rowData['Claim (INR)']}</div>
            )}

        </div>
    );

    const tourDetailsBody = (rowData) => (
        <div className="text-xs space-y-1 flex flex-col justify-center">
            <div> <span className='font-bold'><span className='font-bold'>Destination:</span></span>{rowData['Destination']}</div>
            <div><span className='font-bold'><span className='font-bold'>Purpose:</span></span> {rowData['Purpose']}</div>
            <div className=''><span className='font-bold'>Project:</span>{rowData['Project']}</div>
            <div className=''><span className='font-bold'>Type:</span> {rowData['Type']}</div>
        </div>
    );
    const approverBody = (rowData) => (
        <div className="text-xs space-y-1 flex flex-col justify-center">
            <div>
                <span className="font-bold">{rowData['Approver']}:</span> {rowData['Approver Remarks']}
            </div>
        </div>
    );
    const reviewerBody = (rowData) => (
        <div className="text-xs space-y-1 flex flex-col justify-center">
            <div>
                <span className="font-bold">{rowData['Reviewer']}:</span> {rowData['Reviewer Remarks']}
            </div>
        </div>
    );

    return (
        <div className="overflow-x-auto">
            <DataTable value={tableData} tableStyle={{ fontSize: '0.7rem', minWidth: '71rem' }}>
                <Column field="To" header="To" headerStyle={cellStyle} bodyStyle={cellStyle} />
                <Column field="On Account" header="On Account" headerStyle={cellStyle} bodyStyle={cellStyle} />
                <Column header="Tour Details" body={tourDetailsBody} headerStyle={cellStyle} />
                <Column header="Claim Calculation" body={claimCalculationBody} headerStyle={cellStyle} />
                <Column field="Settled Amount" header="Settled Amount" headerStyle={cellStyle} bodyStyle={cellStyle} />
                <Column field="Status" header="Status" headerStyle={cellStyle} bodyStyle={cellStyle} />
                {/* <Column field="Reviewer Remarks" header="Reviewer Remarks" headerStyle={cellStyle} bodyStyle={cellStyle} />
                <Column field="Remarks" header="Remarks" headerStyle={cellStyle} bodyStyle={cellStyle} /> */}

                <Column header="Reviewer-Remarks" body={reviewerBody} headerStyle={cellStyle} />
                <Column header="Approver-Remarks" body={approverBody} headerStyle={cellStyle} />
                {/* <Column field="Approver Remarks" header="Approver Remarks" headerStyle={cellStyle} bodyStyle={cellStyle} />
                <Column field="Approver" header="Approver" headerStyle={cellStyle} bodyStyle={cellStyle} /> */}
            </DataTable>
        </div>
    );
};

export default MyClaimTable;
