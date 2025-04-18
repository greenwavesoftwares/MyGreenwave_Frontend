import React, { useRef } from 'react';

import { Dropdown } from 'primereact/dropdown';
//import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { FileUpload } from 'primereact/fileupload';
import { Toast } from 'primereact/toast';



const TourClaimForm = ({ mode = 'full' }) => {
    const isPopup = mode === 'popup';
    const toast = useRef(null);

    const onUpload = () => {
        toast.current.show({ severity: 'success', summary: 'Success', detail: 'File Uploaded' });
    };
    const inputWidth = isPopup ? 'w-40' : 'w-62';
    const gridCols = isPopup ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3';
    const gridGap = isPopup ? 'gap-x-6 ml-4 mb-4' : 'gap-x-20 ml-8 mb-4';
    const t = isPopup ? 'text-sm' : 'text-lg';
    

    

    return (
         <div className="p-4">
            {/* Tour Claim Box */}
            <div className="border border-gray-200 shadow-md rounded-lg p-4 bg-white space-y-6 mt-4">
                {/* Header */}
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <label className={`${t} font-semibold text-gray-800`}>Tour Claim</label>
                    <div  >
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
                <div className={`grid ${gridCols} justify-items-center  gap-y-4 ${gridGap} `}>
                    <div>
                        <label htmlFor="Select-Travel" className="block text-sm font-medium text-gray-700 mb-1">Select Travel</label>
                        <Dropdown inputId="Select-Travel" className={`${inputWidth}`} />
                    </div>
                    <div>
                        <label htmlFor="Type-of-Travel" className="block text-sm font-medium text-gray-700 mb-1">Type of Travel</label>
                        <Dropdown inputId="Type-of-Travel" className={`${inputWidth}`} />
                    </div>
                    <div>
                        <label htmlFor="Destination" className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                        <InputText inputId="Destination" className={`${inputWidth}`} />
                    </div>
             
                {/* Purpose / Project / Account */}
               
                    <div>
                        <label htmlFor="Purpose-of-Trip" className="block text-sm font-medium text-gray-700 mb-1">Purpose of Trip</label>
                        <InputText inputId="Purpose-of-Trip" className={`${inputWidth}`} />
                    </div>
                    <div>
                        <label htmlFor="Project-Name" className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                        <InputText inputId="Project-Name" className={`${inputWidth}`} />
                    </div>
                    <div>
                        <label htmlFor="On-Account" className="block text-sm font-medium text-gray-700 mb-1">On Account</label>
                        <InputText inputId="On-Account" className={`${inputWidth}`} />
                    </div>
                {/* </div> */}

                {/* Date Range & Advance */}
                {/* <div className="grid grid-cols-2 md:grid-cols-3 gap-x-20 ml-8 items-end"> */}
                    <div>
                        <label htmlFor="fromdate" className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                        <Calendar inputId="fromdate" showIcon className={`${inputWidth}`} />
                    </div>
                    <div>
                        <label htmlFor="todate" className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                        <Calendar inputId="todate" showIcon className={`${inputWidth}`} />
                    </div>
                    <div className={`flex justify-between items-center bg-gray-50 shadow-sm rounded-md px-4 mt-4 h-12 ${inputWidth}`}>
                        <span className="text-gray-700 font-medium">Available Advance:</span>
                        <span className="text-green-600 font-bold">₹5000</span>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default TourClaimForm