import React, { useRef } from 'react';

import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';




const MiscellaneousClaimForm = () => {
     const toast = useRef(null);
        
          const onUpload = () => {
            toast.current.show({ severity: 'success', summary: 'Success', detail: 'File Uploaded' });
          };
    return (

        <div className="mt-6 bg-white p-6 rounded-2xl shadow-md border border-gray-200 mx-4 md:mx-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Loan Application Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <div>
                    <label htmlFor="emp-code" className="block text-sm font-medium text-gray-700 mb-1">Employee Code</label>
                    <div className="w-62 bg-gray-100 shadow-sm rounded-md px-4 py-2 h-12 flex items-center text-gray-700">
                        156
                    </div>
                </div>

                <div>
                    <label htmlFor="Project-Name" className="block text-sm font-medium text-gray-700 mb-1">Loan Amount (INR)</label>
                    <InputText inputId="Project-Name" className="w-62 h-12 rounded-md shadow-sm" />
                </div>

                <div>
                    <label htmlFor="On-Account" className="block text-sm font-medium text-gray-700 mb-1">Loan Tenure (in Months)</label>
                    <InputText inputId="On-Account" className="w-62 h-12 rounded-md shadow-sm" />
                </div>

                <div>
                    <label htmlFor="emi-amount" className="block text-sm font-medium text-gray-700 mb-1">EMI Amount (INR)</label>
                    <div className="w-62 bg-gray-100 shadow-sm rounded-md px-4 py-2 h-12 flex items-center text-gray-700">
                        0.00
                    </div>
                </div>

                <div>
                    <label htmlFor="fromdate" className="block text-sm font-medium text-gray-700 mb-1">Requirement Date</label>
                    <Calendar inputId="fromdate" showIcon className="w-62 h-12 rounded-md shadow-sm" />
                </div>

                <div>
                    <label htmlFor="purpose-loan" className="block text-sm font-medium text-gray-700 mb-1">Purpose of Loan</label>
                    <InputText inputId="purpose-loan" className="w-62 h-12 rounded-md shadow-sm" />
                </div>
                <div className="flex justify-center w-full">
                    <Button label="Apply" icon="pi pi-check" />
                </div>
            </div>
        </div>


    )
}

export default MiscellaneousClaimForm