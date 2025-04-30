import React, { useState, useRef, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { FileUpload } from 'primereact/fileupload';
import * as XLSX from 'xlsx';
import { formateDate } from './claimServices'; 

const cellStyle = { padding: '8px 12px' };

const initialFormState = {
    'Date': '',
    'Lodging': '',
    'Breakfast': '',
    'Lunch': '',
    'Snacks': '',
    'Dinner': '',
    'Tea & Water': '',
    'Airfare, Bus, Train, Taxi Rental': '',
    'Auto, Cab': '',
    'Parking, Toll, Fuel': '',
    'Incidentals': '',
    'Other Business Expenses': '',
    'Total': '',
};

const TourClaimTable = ({ editableMode, seteditableMode, toggleNewClaim, settoggleNewClaim, settourClaimTableData, tourClaimTableData, settourclaimFormLabeData }) => {
    const [editingIndex, setEditingIndex] = useState(null);
    const [rowData, setrowData] = useState([]);
    const toast = useRef(null);
    const hasDuplicateDatesOrZeroTotal = (data) => {
        const seen = new Set();
    
        for (let row of data) {
            const date = row['Date'];
            const total = parseFloat(row['Total']) || 0;
    
            if (!date) continue;
    
            // Check for duplicate date
            if (seen.has(date)) return { hasIssue: true, reason: 'Duplicate date found' };
            seen.add(date);
    
            // Check for zero total
            if (total === 0) return { hasIssue: true, reason: 'Total amount is zero' };
        }
    
        return { hasIssue: false };
    };
    useEffect(() => {
        const transformed = tourClaimTableData.map(row => ({
            'Date': row.date,
            'Lodging': row.lodging,
            'Breakfast': row.breakfast,
            'Lunch': row.lunch,
            'Snacks': row.snacks,
            'Dinner': row.dinner,
            'Tea & Water': row.teaWater,
            'Airfare, Bus, Train, Taxi Rental': row.longTravel,
            'Auto, Cab': row.shortTravel,
            'Parking, Toll, Fuel': row.tollTax,
            'Incidentals': row.incidentals,
            'Other Business Expenses': row.other,
            'Total': row.total,
        }));
        setrowData(transformed);
    }, [tourClaimTableData]);

    const calculateTotal = (entry) => {
        const keys = Object.keys(initialFormState).filter(k => k !== 'Date');
        return keys.reduce((sum, key) => sum + (parseFloat(entry[key]) || 0), 0);
    };

    const handleChange = (e, rowIndex) => {
        const { name, value } = e.target;
        const updatedData = [...rowData];
        updatedData[rowIndex] = {
            ...updatedData[rowIndex],
            [name]: value
        };
        updatedData[rowIndex]['Total'] = calculateTotal(updatedData[rowIndex]);
        setrowData(updatedData);
    };

    const handleDateChange = (e, rowIndex) => {
        const updatedData = [...rowData];
        updatedData[rowIndex]['Date'] = e.value?.toISOString().split('T')[0] || '';
        setrowData(updatedData);
    };

    const openEditMode = (index) => {
        setEditingIndex(index);
    };

    const handleDelete = (index) => {
        const updated = rowData.filter((_, i) => i !== index);
        setrowData(updated);
        setEditingIndex(null);
    };

    const handleAddRow = () => {
        setrowData([...rowData, { ...initialFormState, Total: 0 }]);
        setEditingIndex(rowData.length);
    };
    const onFileSelect = (event) => {
        const file = event.files[0];
        const reader = new FileReader();
    
        reader.onload = (e) => {
            const bstr = e.target.result;
            const workbook = XLSX.read(bstr, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
    
            const headerRowIndex = 15;
            const headers = XLSX.utils.sheet_to_json(worksheet, {
                range: headerRowIndex,
                header: 1
            })[0];
    
            // Set form labels
            settourclaimFormLabeData({
                destination: worksheet['C12']?.v || '',
                purposeOfTrip: worksheet['C13']?.v || '',
                projectName: worksheet['J9']?.v || '',
                onAccount: worksheet['J10']?.v || '',
                fromDate: formateDate(worksheet['J11']?.v),
                toDate: formateDate(worksheet['J12']?.v)
            });
    
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                range: 15,
                header: headers,
                defval: ''
            });
    
            const validatedData = [];
            const existingDates = new Set(rowData.map(r => r['Date'])); // Get dates from existing data
            let skippedRows = 0;
    
            jsonData.forEach((row) => {
                const formattedRow = { ...initialFormState };
                let isValid = true;
    
                for (const key of Object.keys(initialFormState)) {
                    const value = row[key];
    
                    if (key === 'Date') {
                        const parsedDate = formateDate(value);
    
                        // Check if date is valid and not already present
                        if (!parsedDate || existingDates.has(parsedDate)) {
                            isValid = false;
                            break;
                        }
    
                        formattedRow[key] = parsedDate;
                        existingDates.add(parsedDate);
                    } else {
                        const num = parseFloat(value);
                        formattedRow[key] = !isNaN(num) ? num : 0;
                    }
                }
    
                if (isValid) {
                    formattedRow['Total'] = calculateTotal(formattedRow);
                    validatedData.push(formattedRow);
                } else {
                    skippedRows++;
                }
            });
    
            setrowData(prevData => [...prevData, ...validatedData]);
    
            toast.current?.show({
                severity: 'info',
                summary: 'Import Result',
                detail: `${validatedData.length} row(s) imported. ${skippedRows} row(s) skipped due to duplicate or invalid dates.`,
            });
        };
    
        reader.readAsBinaryString(file);
    };
    
    

    const renderCell = (rowData, field, rowIndex) => {
        if (editingIndex === rowIndex) {
            if (field === 'Date') {
                return (
                    <Calendar
                        value={rowData['Date'] ? new Date(rowData['Date']) : null}
                        onChange={(e) => handleDateChange(e, rowIndex)}
                        dateFormat="yy-mm-dd"
                        showIcon
                        className="p-inputtext-sm w-full"
                    />
                );
            }
            return (
                <InputText
                    name={field}
                    value={rowData[field] || ''}
                    onChange={(e) => handleChange(e, rowIndex)}
                    className="p-inputtext-sm w-full"
                />
            );
        }
        return <span>{rowData[field]}</span>;
    };

    const actionBodyTemplate = (row, { rowIndex }) => (
        <div className="flex gap-2">
            {editingIndex === rowIndex ? (
                <Button
                    icon="pi pi-check"
                    className="p-button-sm p-button-success"
                    onClick={() => {
                        const result = hasDuplicateDatesOrZeroTotal(rowData);
                    
                        if (result.hasIssue) {
                            toast.current?.show({
                                severity: 'warn',
                                summary: 'Validation Warning',
                                detail: result.reason,
                            });
                            return; // Don't continue
                        }
                    
                        setEditingIndex(null);
                    }}
                />
            ) : (
                <Button
                    icon="pi pi-pencil"
                    className="p-button-sm p-button-text p-button-info"
                    onClick={() => openEditMode(rowIndex)}
                />
            )}
            <Button
                icon="pi pi-trash"
                className="p-button-sm p-button-text p-button-danger"
                onClick={() => handleDelete(rowIndex)}
            />
        </div>
    );
    

    const fields = [
        { field: 'Date', header: 'Date' },
        { field: 'Lodging', header: 'Lodging' },
        { field: 'Breakfast', header: 'Breakfast' },
        { field: 'Lunch', header: 'Lunch' },
        { field: 'Snacks', header: 'Snacks' },
        { field: 'Dinner', header: 'Dinner' },
        
        { field: 'Tea & Water', header: 'Tea & Water' },
        { field: 'Airfare, Bus, Train, Taxi Rental', header: 'Airfare, Bus, Train, Taxi Rental' },
        { field: 'Auto, Cab', header: 'Auto, Cab' },
        { field: 'Parking, Toll, Fuel', header: 'Parking, Toll, Fuel' },
        { field: 'Incidentals', header: 'Incidentals' },
        { field: 'Other Business Expenses', header: 'Other Business Expenses' },
        { field: 'Total', header: 'Total' },
    ];

    return (
        <>
            <div className="flex justify-end mb-2 gap-x-2">
                <Toast ref={toast} />

                <div className="p-button-sm">
                    <FileUpload
                        mode="basic"
                        name="file"
                        accept=".xls,.xlsx"
                        customUpload
                        uploadHandler={onFileSelect}
                        maxFileSize={1000000}
                        chooseLabel="Upload"
                    />
                </div>

                <Button label="Add Row" icon="pi pi-plus" className="p-button-sm" onClick={handleAddRow} />
            </div>

            <DataTable
                value={rowData}
                scrollable
                scrollHeight="250px"
                className="text-xs"
                tableStyle={{ minWidth: '100%', fontSize: '0.7rem' }}
            >
                {fields.map(({ field, header }) => (
                    <Column
                        key={field}
                        header={header}
                        body={(rowData, options) => renderCell(rowData, field, options.rowIndex)}
                        headerStyle={cellStyle}
                        bodyStyle={cellStyle}
                    />
                ))}
                <Column header="Action" body={actionBodyTemplate} headerStyle={cellStyle} bodyStyle={cellStyle} />
            </DataTable>

            <div className="flex justify-center mt-4">
                {editableMode === true ? (
                    <Button
                        label="Update"
                        icon="pi pi-save"
                        className="p-button-sm"
                        onClick={() => {
                            const result = hasDuplicateDatesOrZeroTotal(rowData);
                            if (result.hasIssue) {
                                toast.current?.show({
                                    severity: 'warn',
                                    summary: 'Validation Warning',
                                    detail: result.reason,
                                });
                                return; // Don't continue
                            
                            }else{
                            seteditableMode(false);
                            toast.current.show({ severity: 'success', summary: 'Updated', detail: 'Tour claim updated!' });
                            }
                        }}
                    />
                ) : (
                    <Button
                        label="Save to Draft"
                        icon="pi pi-save"
                        className="p-button-sm"
                        onClick={() => {
                            const result = hasDuplicateDatesOrZeroTotal(rowData);
                    
                            if (result.hasIssue) {
                                toast.current?.show({
                                    severity: 'warn',
                                    summary: 'Validation Warning',
                                    detail: result.reason,
                                });
                                return; // Don't continue
                            }
                            {
                            seteditableMode(false);
                            settoggleNewClaim(false);
                            toast.current.show({ severity: 'info', summary: 'Draft Saved', detail: 'Saved locally.' });
                            }
                        }}
                    />
                )}
            </div>
        </>
    );
};

export default TourClaimTable;
