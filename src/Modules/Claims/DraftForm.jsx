import React from 'react'
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';


const DraftForm = () => {
    const actionBodyTemplate = (rowData) => (
        <div className="flex gap-2">
            <Button icon="pi pi-pencil" className="p-button-sm p-button-text p-button-info" onClick={() => openEditDialog(rowData)} />
            <Button icon="pi pi-trash" className="p-button-sm p-button-text p-button-danger" onClick={() => handleDelete(rowData.date)} />
        </div>
    );
    return (
        <DataTable tableStyle={{ minWidth: '50rem' }}>
            <Column field="To" header="To"></Column>
            <Column field="Type" header="Type"></Column>
            <Column field="Destination" header="Destination"></Column>
            <Column field="Purpose" header="Purpose"></Column>
            <Column field="Project" header="Project"></Column>
            <Column field="On Account" header="On Account"></Column>
            <Column field="Advance (INR)" header="Advance (INR)"></Column>
            <Column field="Expense (INR)" header="Expense (INR)"></Column>
            <Column field="Claim (INR)" header="Claim (INR)"></Column>
            <Column field="Due (INR)" header="Due (INR)"></Column>
            <Column header="Action" body={actionBodyTemplate} />
        </DataTable>
    )
}

export default DraftForm