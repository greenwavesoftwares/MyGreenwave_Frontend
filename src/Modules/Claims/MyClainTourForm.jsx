import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

const cellStyle = { padding: '8px 12px' }; // 0.25rem 0.5rem

const MyClaimTable = () => {
    return (
        <div className="overflow-x-auto">
            <DataTable tableStyle={{ fontSize: '0.7rem', minWidth: '60rem' }}>
                <Column field="To" header="To" headerStyle={cellStyle} bodyStyle={cellStyle} />
                <Column field="Type" header="Type" headerStyle={cellStyle} bodyStyle={cellStyle} />
                <Column field="Destination" header="Destination" headerStyle={cellStyle} bodyStyle={cellStyle} />
                <Column field="Purpose" header="Purpose" headerStyle={cellStyle} bodyStyle={cellStyle} />
                <Column field="Project" header="Project" headerStyle={cellStyle} bodyStyle={cellStyle} />
                <Column field="On Account" header="On Account" headerStyle={cellStyle} bodyStyle={cellStyle} />
                <Column field="Advance (INR)" header="Advance (INR)" headerStyle={cellStyle} bodyStyle={cellStyle} />
                <Column field="Expense (INR)" header="Expense (INR)" headerStyle={cellStyle} bodyStyle={cellStyle} />
                <Column field="Claim (INR)" header="Claim (INR)" headerStyle={cellStyle} bodyStyle={cellStyle} />
                <Column field="Due (INR)" header="Due (INR)" headerStyle={cellStyle} bodyStyle={cellStyle} />
                <Column field="Settled Amount" header="Settled Amount" headerStyle={cellStyle} bodyStyle={cellStyle} />
                <Column field="Status" header="Status" headerStyle={cellStyle} bodyStyle={cellStyle} />
                <Column field="Reviewer Remarks" header="Reviewer Remarks" headerStyle={cellStyle} bodyStyle={cellStyle} />
                <Column field="Remarks" header="Remarks" headerStyle={cellStyle} bodyStyle={cellStyle} />
                <Column field="Approver Remarks" header="Approver Remarks" headerStyle={cellStyle} bodyStyle={cellStyle} />
                <Column field="Approver" header="Approver" headerStyle={cellStyle} bodyStyle={cellStyle} />
            </DataTable>
        </div>
    );
};

export default MyClaimTable;
