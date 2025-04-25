import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import TourClaimForm from './TourClaimForm';
import TourClaimTable from './TourClaimTable';

const cellStyle = { padding: '12px 16px' };

const DraftForm = ({ draftData, setDraftData, seteditableMode, editableMode,tourclaimformData,settourclaimformData,settourClaimTableData }) => {



    const [editDialogVisible, setEditDialogVisible] = useState(false);
    const [selectedRowData, setSelectedRowData] = useState(null);

    // const openEditDialog = (rowData) => {
    //     setSelectedRowData(rowData);
    //     setEditDialogVisible(true);
    // };

    const handleDelete = (id) => {
        setDraftData(prev => prev.filter(row => row.date !== id));
    };

    const handleApplyApproval = (rowData) => {
        console.log('Apply for Approval clicked:', rowData);
    };

    const handleEdit = async (claim_id) => {
        const myHeaders = new Headers();
        myHeaders.append("Authorization", "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJraXNvbG95LnJveUBncmVlbndhdmUuY28uaW4iLCJpYXQiOjE3NDU1Nzk3MDYsImV4cCI6MTc0NTU4MzMwNn0.QrcYXI4MMBVKdu6PJpjJqiokrRtuT45faRHc3JGaY4E");
    
        const requestOptions = {
            method: "GET",
            headers: myHeaders,
            redirect: "follow"
        };
    
        try {
            const response = await fetch(`http://localhost:8081/claims/tour-claims/${claim_id}`, requestOptions);
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const data = await response.json();
    
            settourclaimformData({
                travelMode: '',
                travelType: '',
                destination: data.destination,
                purpose: data.purpose,
                projectName: data.project,
                onAccount: data.account,
                fromDate: new Date(data.from_date),
                toDate: new Date(data.to_date)
            });
            settourClaimTableData(data.tourClaimRecords)

    
            
        } catch (error) {
            console.error("Fetch error:", error);
        }
    };
    
    const actionBodyTemplate = (rowData) => (
        <div className="flex gap-2">
            <Button
                icon="pi pi-pencil"
                className="p-button-sm p-button-text p-button-info"
                onClick={() => {
                    seteditableMode(true);
                    handleEdit(rowData.claim_id);
                }}
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

    const claimCalculationBody = (rowData) => (
        <div className="text-xs space-y-1 flex flex-col justify-center">
            <div><span className='font-bold'><span className='font-bold '>Expense:</span></span> ₹{rowData['total_expense']}</div>
            <div><span className='font-bold'><span className='font-bold'>Advance:</span></span> ₹{rowData['advance']}</div>
            <hr />
            {rowData['dueAmount'] ? (
                <div className=''><span className='font-bold'><span className='font-bold'>Due:</span></span> ₹{rowData['dueAmount']}</div>
            ) : (
                <div className=''><span className='font-bold'><span className='font-bold'>Claim:</span></span>: ₹{rowData['amountToBeClaimed']}</div>
            )}

        </div>
    );

    const tourDetailsBody = (rowData) => (
        <div className="text-xs space-y-1 flex flex-col justify-center">
            <div> <span className='font-bold'><span className='font-bold'>Destination:</span></span>{rowData['destination']}</div>
            <div><span className='font-bold'><span className='font-bold'>Purpose:</span></span> {rowData['purpose']}</div>
            <div className=''><span className='font-bold'>Project:</span>{rowData['project']}</div>
            <div className=''><span className='font-bold'>Type:</span> {rowData['type']}</div>
        </div>
    );





    return (
        <div>
            <div>
                <DataTable value={draftData} tableStyle={{ fontSize: '0.7rem', minWidth: '71rem' }}>
                    <Column field="claim_id" header="Claim Id" headerStyle={cellStyle} bodyStyle={cellStyle} />
                    <Column field="to_date" header="To" headerStyle={cellStyle} bodyStyle={cellStyle} />
                    <Column field="account" header="On Account" headerStyle={cellStyle} bodyStyle={cellStyle} />



                    {/* ✅ Single column for all tourdetails-related fields */}
                    <Column
                        header="Tour Details"
                        body={tourDetailsBody}
                        headerStyle={cellStyle}
                        bodyStyle={{ ...cellStyle, whiteSpace: 'pre-line' }}
                    />

                    {/* ✅ Single column for all claim-related fields */}
                    <Column
                        header="Claim Calculation"
                        body={claimCalculationBody}
                        headerStyle={cellStyle}
                        bodyStyle={{ ...cellStyle, whiteSpace: 'pre-line' }}
                    />

                    <Column
                        header="Action"
                        body={actionBodyTemplate}
                        headerStyle={{ ...cellStyle, textAlign: 'center' }}
                        bodyStyle={{ ...cellStyle, textAlign: 'center' }}
                    />
                </DataTable>
            </div>

            {/* <Dialog
                header="Edit Tour Claim"
                visible={editDialogVisible}
                onHide={() => setEditDialogVisible(false)}
                style={{ width: '80vw' }}
                breakpoints={{ '960px': '75vw', '641px': '90vw' }}
                modal
            >
                {/* <TourClaimForm mode="popup" />
                <div className="flex justify-center gap-2 mt-4">
                    <Button
                        label="Download"
                        icon="pi pi-download"
                        className="p-button-sm p-button-success"
                    />
                </div>
                <TourClaimTable mode="popup" /> */}
            {/* </Dialog> */}
        </div>
    );
};

export default DraftForm;
