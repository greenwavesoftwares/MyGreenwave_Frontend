import React, { useRef } from 'react';

import { Dropdown } from 'primereact/dropdown';
//import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { FileUpload } from 'primereact/fileupload';
import { Toast } from 'primereact/toast';



const TourClaimForm = () => {
    const toast = useRef(null);

    const onUpload = () => {
        toast.current.show({ severity: 'success', summary: 'Success', detail: 'File Uploaded' });
    };
    return (
        <div className="p-4">
            {/* Tour Claim Box */}
            <div className="border border-gray-200 shadow-md rounded-lg p-4 bg-white space-y-6 mt-4">
                {/* Header */}
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <label className="text-lg font-semibold text-gray-800">Tour Claim</label>
                    <div>
                        <Toast ref={toast} />
                        <FileUpload
                            mode="basic"
                            name="demo[]"
                            url="/api/upload"
                            accept="image/*"
                            maxFileSize={1000000}
                            onUpload={onUpload}
                        />
                    </div>
                </div>

                {/* Travel Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3  md:justify-items-center gap-x-20 ml-8">
                    <div>
                        <label htmlFor="Select-Travel" className="block text-sm font-medium text-gray-700 mb-1">Select Travel</label>
                        <Dropdown inputId="Select-Travel" className="w-62 md:w-[15.5rem]" />
                    </div>
                    <div>
                        <label htmlFor="Type-of-Travel" className="block text-sm font-medium text-gray-700 mb-1">Type of Travel</label>
                        <Dropdown inputId="Type-of-Travel" className="w-62 md:w-[15.5rem]" />
                    </div>
                    <div>
                        <label htmlFor="Destination" className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                        <InputText inputId="Destination" className="w-62 md:w-[15.5rem]" />
                    </div>
                </div>

                {/* Purpose / Project / Account */}
                <div className="grid grid-cols-1 md:grid-cols-3  gap-x-20 ml-8">
                    <div>
                        <label htmlFor="Purpose-of-Trip" className="block text-sm font-medium text-gray-700 mb-1">Purpose of Trip</label>
                        <InputText inputId="Purpose-of-Trip" className="w-62 md:w-[15.5rem]" />
                    </div>
                    <div>
                        <label htmlFor="Project-Name" className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                        <InputText inputId="Project-Name" className="w-62 md:w-[15.5rem]" />
                    </div>
                    <div>
                        <label htmlFor="On-Account" className="block text-sm font-medium text-gray-700 mb-1">On Account</label>
                        <InputText inputId="On-Account" className="w-62 md:w-[15.5rem]" />
                    </div>
                </div>

                {/* Date Range & Advance */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-20 ml-8 items-end">
                    <div>
                        <label htmlFor="fromdate" className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                        <Calendar inputId="fromdate" showIcon className="w-62 md:w-[15.5rem]" />
                    </div>
                    <div>
                        <label htmlFor="todate" className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                        <Calendar inputId="todate" showIcon className="w-62 md:w-[15.5rem]" />
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 shadow-sm rounded-md px-4 py-2 h-12">
                        <span className="text-gray-700 font-medium">Available Advance:</span>
                        <span className="text-green-600 font-bold">₹5000</span>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default TourClaimForm