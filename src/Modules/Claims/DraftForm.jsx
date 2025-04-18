import React, { useState,useRef } from 'react'
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import TourClaimForm from './TourClaimForm'; // update path as needed
import TourClaimTable from './TourClaimTable';
const cellStyle = { padding: '8px 12px' }; // 0.25rem 0.5rem




const DraftForm = () => {
     
    const [tableData, setTableData] = useState([
        {
            id: 1,
            To: 'John Doe',
            Type: 'Official',
            Destination: 'Mumbai',
            Purpose: 'Client Meeting',
            Project: 'ITC PCPB',
            'On Account': 'Business',
            'Advance (INR)': 5000,
            'Expense (INR)': 4500,
            'Claim (INR)': 500,
            'Due (INR)': 0,
            date: '2025-04-18'
        }
    ]);

    const [editDialogVisible, setEditDialogVisible] = useState(false);
    const [selectedRowData, setSelectedRowData] = useState(null);

    const openEditDialog = (rowData) => {
        setSelectedRowData(rowData);
        setEditDialogVisible(true);
    };

    const handleDelete = (id) => {
        setTableData(prev => prev.filter(row => row.date !== id));
    };

    const handleApplyApproval = (rowData) => {
        console.log('Apply for Approval clicked:', rowData);
    };

    const actionBodyTemplate = (rowData) => (
        <div className="flex gap-2">
            <Button
                icon="pi pi-pencil"
                className="p-button-sm p-button-text p-button-info"
                onClick={() => openEditDialog(rowData)}
                tooltip="Edit"
            />
            <Button
                icon="pi pi-trash"
                className="p-button-sm p-button-text p-button-danger"
                onClick={() => handleDelete(rowData.date)}
                tooltip="Delete"
            />
            <Button
                icon="pi pi-send"
                label="Apply"
                className="p-button-sm p-button-success p-button-text"
                onClick={() => handleApplyApproval(rowData)}
                tooltip="Apply for Approval"
            />
        </div>
    );

    return (
        <div>
            <DataTable value={tableData} tableStyle={{ fontSize: '0.7rem', minWidth: '60rem'  }}>
                <Column field="To" header="To" headerStyle={cellStyle} bodyStyle={cellStyle} />
                <Column field="Type" header="Type" headerStyle={cellStyle} bodyStyle={cellStyle} />
                <Column field="Destination" header="Destination"  headerStyle={cellStyle} bodyStyle={cellStyle}/>
                <Column field="Purpose" header="Purpose" headerStyle={cellStyle} bodyStyle={cellStyle}/>
                <Column field="Project" header="Project" headerStyle={cellStyle} bodyStyle={cellStyle}/>
                <Column field="On Account" header="On Account" headerStyle={cellStyle} bodyStyle={cellStyle}/>
                <Column field="Advance (INR)" header="Advance (INR)" headerStyle={cellStyle} bodyStyle={cellStyle}/>
                <Column field="Expense (INR)" header="Expense (INR)" headerStyle={cellStyle} bodyStyle={cellStyle} />
                <Column field="Claim (INR)" header="Claim (INR)" headerStyle={cellStyle} bodyStyle={cellStyle}/>
                <Column field="Due (INR)" header="Due (INR)" headerStyle={cellStyle} bodyStyle={cellStyle}/>
                <Column header="Action" body={actionBodyTemplate} headerStyle={cellStyle} bodyStyle={cellStyle}/>
            </DataTable>

            <Dialog
                header="Edit Tour Claim"
                visible={editDialogVisible}
                onHide={() => setEditDialogVisible(false)}
                style={{ width: '80vw' }}
                breakpoints={{ '960px': '75vw', '641px': '90vw' }}
                modal
            >
                <TourClaimForm mode="popup" />
                <div className='flex justify-center gap-2'>
                    
                    <Button
                        label="Download"
                        icon="pi pi-download"
                        className="p-button-sm p-button-success"
                    />
                </div>

                <TourClaimTable mode="popup"/>
            </Dialog>
        </div>
    );
};

export default DraftForm;
