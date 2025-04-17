import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';

const dummyData = [
    {
        date: '2025-04-17',
        lodging: 1000,
        breakfast: 200,
        lunch: 300,
        snacks: 100,
        dinner: 400,
        incidentals: 150,
        travel: 1200,
        transport: 600,
        sumanPaid: 100,
        materialPaid: 200,
        dataRecharge: 50,
        regFees: 300,
        total: 4600,
    }
];

const initialFormState = {
    date: '',
    lodging: '',
    breakfast: '',
    lunch: '',
    snacks: '',
    dinner: '',
    incidentals: '',
    travel: '',
    transport: '',
    sumanPaid: '',
    materialPaid: '',
    dataRecharge: '',
    regFees: '',
};

const TourClaimTable = () => {
    const [data, setData] = useState(dummyData);
    const [editData, setEditData] = useState(null);
    const [visible, setVisible] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    const openEditDialog = (rowData) => {
        setIsEdit(true);
        setEditData({ ...rowData });
        setVisible(true);
    };

    const openAddDialog = () => {
        setIsEdit(false);
        setEditData(initialFormState);
        setVisible(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        const updatedRow = {
            ...editData,
            total: calculateTotal(editData),
        };

        if (isEdit) {
            const updatedData = data.map((item) =>
                item.date === editData.date ? updatedRow : item
            );
            setData(updatedData);
        } else {
            setData([...data, updatedRow]);
        }

        setVisible(false);
    };

    const calculateTotal = (entry) => {
        const keys = Object.keys(initialFormState).filter(k => k !== 'date');
        return keys.reduce((sum, key) => sum + (parseFloat(entry[key]) || 0), 0);
    };

    const actionBodyTemplate = (rowData) => (
        <div className="flex gap-2">
            <Button icon="pi pi-pencil" className="p-button-sm p-button-text p-button-info" onClick={() => openEditDialog(rowData)} />
            <Button icon="pi pi-trash" className="p-button-sm p-button-text p-button-danger" onClick={() => handleDelete(rowData.date)} />
        </div>
    );

    const handleDelete = (date) => {
        const updated = data.filter(item => item.date !== date);
        setData(updated);
    };

    return (
        <>
            <div className="flex justify-end mb-2">
                <Button label="Add Row" icon="pi pi-plus" className="p-button-sm " onClick={openAddDialog}/>
            </div>

            <DataTable
                value={data}
                scrollable
                scrollHeight="250px"
                className="text-xs"
                tableStyle={{ minWidth: '100%', fontSize: '0.7rem' }}
            >
                <Column field="date" header="Date" />
                <Column field="lodging" header="Lodging" />
                <Column field="breakfast" header="Breakfast" />
                <Column field="lunch" header="Lunch" />
                <Column field="snacks" header="Snacks" />
                <Column field="dinner" header="Dinner" />
                <Column field="incidentals" header="Incidentals" />
                <Column field="travel" header="Airfare, Train, Bus etc." />
                <Column field="transport" header="Taxi, Shuttle, Parking, Car Rental" />
                <Column field="sumanPaid" header="SUMAN PAID" />
                <Column field="materialPaid" header="MATERIAL PAID" />
                <Column field="dataRecharge" header="DATA RECHARGE" />
                <Column field="regFees" header="Reg. Fees & Other Business Expenses" />
                <Column field="total" header="Total" />
                <Column header="Action" body={actionBodyTemplate} />
            </DataTable>

            {/* Edit/Add Dialog */}
            <Dialog
                header={isEdit ? "Edit Claim" : "Add Claim"}
                visible={visible}
                onHide={() => setVisible(false)}
                style={{ width: '50vw' }}
            >
                {editData && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        {Object.entries(initialFormState).map(([key]) => (
                            <div key={key} className="flex flex-col">
                                <label className="text-xs font-medium text-gray-700 mb-1 capitalize">{key}</label>
                                <InputText
                                    name={key}
                                    value={editData[key] || ''}
                                    onChange={handleChange}
                                    className="p-inputtext-sm"
                                />
                            </div>
                        ))}
                        <div className="col-span-2 flex justify-end mt-4">
                            <Button label="Save" icon="pi pi-check" onClick={handleSubmit} className="p-button-sm" />
                        </div>
                    </div>
                )}
            </Dialog>
            {/* Button */}
            <div className="flex justify-end mt-4">
                <Button label="Save to Draft" icon="pi pi-save" className="p-button-sm" />
            </div>
        </>
    );
};

export default TourClaimTable;
