import React, { useRef, useEffect, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { FiCopy } from 'react-icons/fi';
import { getTravelDropDown, getTourClaimFormDetails, getTourClaimList,getAdvance } from './claimServices'

//import { FileUpload } from 'primereact/fileupload';
//import { Toast } from 'primereact/toast';





const TourClaimForm = ({ tourclaimformData, settourclaimformData, tourclaimFormLabeData }) => {

    // const toast = useRef(null);
   const [advance,setadvance]=useState(null)
   const [lastestClaimToDate,setlastestClaimToDate]=useState(null)
  const [travelModeOptions, setTravelModeOptions] = useState([]);
const [travelTypeOptions, settravelTypeOptions] = useState([
        "Others",
        "Sales Marketing",
        "Project",
        "Service Paid",
        "Service Fees",
        "Survey",
        "Training"
    ])



    // const onUpload = () => {
    //     toast.current.show({ severity: 'success', summary: 'Success', detail: 'File Uploaded' });
    // };




    const handleChange = (field, value) => {
        settourclaimformData(prev => ({ ...prev, [field]: value }));
        if (field === 'travelMode' && value != 'Long-Term-Local-Conveyance') {
            fetchTourClaimFormDetails(value);
        }
    };
    const fetchTourClaimFormDetails = async (id) => {
        try {
            const data = await getTourClaimFormDetails(id);
            settourclaimformData(prev => ({
                ...prev,
                projectName: data.projectName, purpose: data.purpose, travelMode: id, travelType: data.typeOfTravel
            }))
            //  setTravelModeOptions({label:id,value:id});

            //settravelTypeOptions([{ label: data.typeOfTravel, value: data.typeOfTravel }]);

           
            // You can update your form data or label data here if needed
        } catch (error) {
            console.error('Error fetching tour claim details:', error);
        }
    };


    useEffect(() => {
        const fetchAdvanceBalence=async()=>{
            try{
                const advanceblance=await getAdvance();
                setadvance(advanceblance)
            }catch(error){
                console.error("Error in get advancebalace:", error);
            }
        }
        const fetchDropdownList = async () => {
            try {
                const tourClaimList = await getTourClaimList();
    
                // Filter by specific requisition_id
                const filteredClaims = tourClaimList.filter(
                    (row) => row.requisition_id === '9f152da3-72de-4ae9-82c5-75273761665e'
                );
    
                // Find the latest to_date
                // console.log(filteredClaims)
                let latestToDate = null;
                filteredClaims[0].expandabledata.forEach((claim) => {
                    const claimToDate = claim.to_date
                    if(claim.status!='Rejected')
                    {
                    if (!latestToDate || claimToDate > latestToDate) {
                        latestToDate = claimToDate;
                    }}
                });
                // settourclaimformData((prev) => ({
                //     ...prev,
                //     claimFromDate: latestToDate
                // }));
                setlastestClaimToDate(latestToDate)

               // console.log(tourclaimformData)
                
               console.log("testing",tourclaimFormLabeData.claimFromDate,latestToDate)
    
                const travelDropDownData = await getTravelDropDown();
                travelDropDownData["In-Station Local Conveyance"] = "Long-Term-Local-Conveyance";
    
                const formattedOptions = Object.entries(travelDropDownData).map(([label, value]) => ({
                    label,
                    value
                }));
                setTravelModeOptions(formattedOptions);
    
            } catch (error) {
                console.error("Error fetching tour claim list:", error);
            }
        };
        fetchAdvanceBalence();
        fetchDropdownList();
    }, []);

    console.log("tesing",tourclaimformData.travelMode)

    
    return (
        <div className="p-4">
            <div className="border border-gray-200 shadow-md rounded-lg p-4 bg-white space-y-6 mt-4">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <label className="text-lg font-semibold text-gray-800">Tour Claim</label>

                    <div className="flex justify-between items-center   px-4 mt-4 h-12 w-62">
                        <span className="text-gray-700 font-medium">Available Advance:</span>
                        <span className="text-green-600 font-bold">{advance}</span>
                    </div>
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
                                        onClick={() => settourclaimformData({ destination: tourclaimFormLabeData.destination })}
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
                                        onClick={() => settourclaimformData({ purpose: tourclaimFormLabeData.purposeOfTrip })}
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
                                        onClick={() => settourclaimformData({ projectName: tourclaimFormLabeData.projectName })}
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
                                        onClick={() => settourclaimformData({ onAccount: tourclaimFormLabeData.onAccount })}
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
                            <div className="flex items-center">
                                <span>
                                    Travel From Date: {tourclaimFormLabeData.fromDate ? new Date(tourclaimFormLabeData.fromDate).toLocaleDateString() : ""}
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

                        {/* FromDate as simple Label */}
                        <div className="w-62 px-3 py-2   shadow-sm  h-12 rounded-md bg-gray-100 text-gray-700 items-center">
                            {tourclaimformData.fromDate ? new Date(tourclaimformData.fromDate).toLocaleDateString() : "No Date Selected"}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="fromdate" className="block text-sm font-medium text-gray-700 mb-1">
                            <div className="flex items-center">
                                <span>
                                    Claim From Date: {tourclaimFormLabeData.fromDate ? new Date(tourclaimFormLabeData.fromDate).toLocaleDateString() : ""}
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

                        {/* FromDate as simple Label */}
                        <div className="w-62  py-2  shadow-sm rounded-md px-4 h-12 text-gray-700 items-center">
                            {lastestClaimToDate}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="todate" className="block text-sm font-medium text-gray-700 mb-1">
                            <div className="flex  items-center">
                                <span>
                                    Claim To Date:- {tourclaimFormLabeData.toDate ? new Date(tourclaimFormLabeData.toDate).toLocaleDateString() : ""}
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

                        {/* <span className="text-gray-700 font-medium">{tourclaimformData.toDate}</span>
                        <label></label> */}

                        <Calendar
                            inputId="todate"
                            showIcon
                            className="w-62"
                            value={tourclaimformData.toDate>new Date()?tourclaimformData.toDate:new Date()}
                            onChange={(e) => handleChange('toDate', e.value)}

                        />
                    </div>

                </div>
            </div>
        </div>
    );
};

export default TourClaimForm;
