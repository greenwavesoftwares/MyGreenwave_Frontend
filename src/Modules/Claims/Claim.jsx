import React, { useRef, useState } from 'react';
import { TabView, TabPanel } from "primereact/tabview";
import { Dropdown } from 'primereact/dropdown'; <Button label="Submit" icon="pi pi-check" />
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { FileUpload } from 'primereact/fileupload';
import { Toast } from 'primereact/toast';


const Claim = () => {
  const [selectedClaimType, setSelectedClaimType] = useState(null);
  const claimtypelist = [
    { label: 'Tour Claim', value: 'Tour Claim' },
    { label: 'Loan Application', value: 'Loan Application' },
    { label: 'Miscellaneous Claim', value: 'Miscellaneous Claim' }
  ];
  console.log(selectedClaimType)
  const toast = useRef(null);

  const onUpload = () => {
    toast.current.show({ severity: 'success', summary: 'Success', detail: 'File Uploaded' });
  };
  return (
    <div>
      <div className='container mx-auto mt-4'>
        <TabView >
          <TabPanel header="New Claim">
            <div className="p-4">
              {/* Claim Type Dropdown */}
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <label className="text-gray-700 font-medium md:w-40">Claim Type</label>
                <Dropdown value={selectedClaimType}
                  onChange={(e) => setSelectedClaimType(e.value)}
                  options={claimtypelist}
                  optionLabel="label" placeholder="Select Claim Type" className="w-full md:w-72" />
              </div>

              {/* Tour Claim Box */}
              {selectedClaimType === 'Tour Claim' && (<div className="border border-gray-200 shadow-md rounded-lg p-4 bg-white space-y-6 mt-4">

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

                {/* Button */}
                <div className="flex justify-end">
                  <Button label="Save to Draft" icon="pi pi-save" />
                </div>
              </div>)}

              {selectedClaimType === 'Loan Application' && (
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
              )}

            </div>
          </TabPanel>


          <TabPanel header="My Drafts" >
            <p className="m-0">My Drafts</p>
          </TabPanel>
          <TabPanel header="My Claims">
            <p className="m-0">My Claims</p>
          </TabPanel>
        </TabView>
      </div>
    </div>



  );
};

export default Claim;
