import React, { useRef,useEffect,useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { FiCopy } from 'react-icons/fi';
import {getTravelDropDown} from './claimServices'
//import { FileUpload } from 'primereact/fileupload';
//import { Toast } from 'primereact/toast';



const travelTypeOptions = [
    { label: 'Official', value: 'Official' },
    { label: 'Personal', value: 'Personal' },
    { label: 'Other', value: 'Other' }
];

const TourClaimForm = ({ tourclaimformData, settourclaimformData, tourclaimFormLabeData }) => {
    // const toast = useRef(null);
    const [travelModeOptions, setTravelModeOptions] = useState([]);

    // const onUpload = () => {
    //     toast.current.show({ severity: 'success', summary: 'Success', detail: 'File Uploaded' });
    // };

    const handleChange = (field, value) => {
        settourclaimformData(prev => ({ ...prev, [field]: value }));
    };


    
    useEffect(() => {
        const fetchDropdownList = async () => {
            try {
                const data = await getTravelDropDown(); // data is an object of key-value pairs
                console.log('Fetched travel dropdown:', data);
                data["In-Station Local Conveyance"] = "Long-Term-Local-Conveyance";

                // Convert to array of { label, value }
                const formattedOptions = Object.entries(data).map(([label, value]) => ({
                    label,
                    value
                }));

                // Append or replace (your choice):
                // If appending to existing:
                // setTravelModeOptions(prev => [...prev, ...formattedOptions]);

                // If replacing:
                setTravelModeOptions(formattedOptions);

            } catch (error) {
                console.error("Error fetching tour claim list:", error);
            }
        };

        fetchDropdownList();
    }, []);
    return (
        <div className="p-4">
            <div className="border border-gray-200 shadow-md rounded-lg p-4 bg-white space-y-6 mt-4">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <label className="text-lg font-semibold text-gray-800">Tour Claim</label>
                    {/* <div>
                        <Toast ref={toast} />
                        <FileUpload
                            mode="basic"
                            name="demo[]"
                            url="/api/upload"
                            accept=".xls,.xlsx"
                            maxFileSize={1000000}
                            onUpload={onUpload}
                        />
                    </div> */}
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-20 ml-8 gap-y-4 mb-4 justify-items-center">
                    <div>
                        <label htmlFor="Select-Travel" className="block text-sm font-medium text-gray-700 mb-1">Select Travel</label>
                        <Dropdown
                            inputId="Select-Travel"
                            className="w-62"
                            value={tourclaimformData.travelMode}
                            options={travelModeOptions}
                            onChange={(e) => handleChange('travelMode', e.value)}
                            placeholder="Select a Mode"
                        />
                    </div>
                    <div>
                        <label htmlFor="Type-of-Travel" className="block text-sm font-medium text-gray-700 mb-1">Type of Travel</label>
                        <Dropdown
                            inputId="Type-of-Travel"
                            className="w-62"
                            value={tourclaimformData.travelType}
                            options={travelTypeOptions}
                            onChange={(e) => handleChange('travelType', e.value)}
                            placeholder="Select a Type"
                        />
                    </div>
                    <div>
                        <label htmlFor="Destination" className="block text-sm font-medium text-gray-700 mb-1">
                            <div className="flex  items-center">
                                <span>Destination:- {tourclaimFormLabeData.destination}</span>
                                {tourclaimFormLabeData.destination && (
                                    <i
                                        className="pi pi-clone cursor-pointer text-blue-600 hover:text-blue-800 ml-2"
                                        title="Copy"
                                        onClick={() => settourclaimformData({destination:tourclaimFormLabeData.destination})}
                                    />
                                )}
                            </div>
                        </label>

                        <InputText
                            inputId="Destination"
                            className="w-62"
                            value={tourclaimformData.destination}
                            onChange={(e) => handleChange('destination', e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="Purpose-of-Trip" className="block text-sm font-medium text-gray-700 mb-1">
                            <div className="flex  items-center">
                                <span>Purpose of Trip:- {tourclaimFormLabeData.purposeOfTrip}</span>
                                {tourclaimFormLabeData.purposeOfTrip && (
                                    <i
                                        className="pi pi-clone cursor-pointer text-blue-600 hover:text-blue-800 ml-2"
                                        title="Copy"
                                        onClick={() => settourclaimformData({purpose:tourclaimFormLabeData.purposeOfTrip})}
                                    />
                                )}
                            </div>
                        </label>

                        <InputText
                            inputId="Purpose-of-Trip"
                            className="w-62"
                            value={tourclaimformData.purpose}
                            onChange={(e) => handleChange('purpose', e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="Project-Name" className="block text-sm font-medium text-gray-700 mb-1">
                            <div className="flex  items-center">
                                <span>Project Name: {tourclaimFormLabeData.projectName}</span>
                                {tourclaimFormLabeData.projectName && (
                                    <i
                                        className="pi pi-clone cursor-pointer text-blue-600 hover:text-blue-800 ml-2"
                                        title="Copy"
                                        onClick={() => settourclaimformData({projectName:tourclaimFormLabeData.projectName })}
                                    />
                                )}
                            </div>
                        </label>

                        <InputText
                            inputId="Project-Name"
                            className="w-62"
                            value={tourclaimformData.projectName}
                            onChange={(e) => handleChange('projectName', e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="On-Account" className="block text-sm font-medium text-gray-700 mb-1">
                            <div className="flex  items-center">
                                <span>On Account:- {tourclaimFormLabeData.onAccount}</span>
                                {tourclaimFormLabeData.onAccount && (
                                    <i
                                        className="pi pi-clone cursor-pointer text-blue-600 hover:text-blue-800 ml-2"
                                        title="Copy"
                                        onClick={() =>  settourclaimformData({onAccount:tourclaimFormLabeData.onAccount })}
                                    />
                                )}
                            </div>
                        </label>
                        <InputText
                            inputId="On-Account"
                            className="w-62"
                            value={tourclaimformData.onAccount}
                            onChange={(e) => handleChange('onAccount', e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="fromdate" className="block text-sm font-medium text-gray-700 mb-1">
                            <div className="flex  items-center">
                                <span>
                                    From Date:- {tourclaimFormLabeData.fromDate ? new Date(tourclaimFormLabeData.fromDate).toLocaleDateString() : ""}
                                </span>
                                {tourclaimFormLabeData.fromDate && (
                                    <i
                                        className="pi pi-clone cursor-pointer text-blue-600 hover:text-blue-800 ml-2"
                                        title="Copy"
                                        onClick={() =>
                                            settourclaimformData(prev => ({
                                                ...prev,
                                                fromDate: new Date(tourclaimFormLabeData.fromDate)
                                            }))
                                        }
                                    />
                                )}
                            </div>
                        </label>

                        <Calendar
                            inputId="fromdate"
                            showIcon
                            className="w-62"
                            value={tourclaimformData.fromDate}
                            onChange={(e) => handleChange('fromDate', e.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="todate" className="block text-sm font-medium text-gray-700 mb-1">
                            <div className="flex  items-center">
                                <span>
                                    To Date:- {tourclaimFormLabeData.toDate ? new Date(tourclaimFormLabeData.toDate).toLocaleDateString() : ""}
                                </span>
                                {tourclaimFormLabeData.toDate && (
                                    <i
                                        className="pi pi-clone cursor-pointer text-blue-600 hover:text-blue-800 ml-2"
                                        title="Copy"
                                        onClick={() =>
                                            settourclaimformData(prev => ({
                                                ...prev,
                                                toDate: new Date(tourclaimFormLabeData.toDate)
                                            }))
                                        }
                                    />
                                )}
                            </div>
                        </label>

                        <Calendar
                            inputId="todate"
                            showIcon
                            className="w-62"
                            value={tourclaimformData.toDate}
                            onChange={(e) => handleChange('toDate', e.value)}
                        />
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 shadow-sm rounded-md px-4 mt-4 h-12 w-62">
                        <span className="text-gray-700 font-medium">Available Advance:</span>
                        <span className="text-green-600 font-bold">₹5000</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TourClaimForm;
