import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/16/solid';
import ModeOfTransportTable from './ModeOfTransportTable' // update path as needed
import AccommodationTable from './AccommodationTable'
import { getUserData } from '../Login/Encrypt'; // adjust path if needed
import { Button } from 'primereact/button';
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { showSuccessMessage, showErrorMessage, showWarningMessage } from "../../components/Toast/ShowMessage";




const TravelDesk = () => {
  const [userData, setUserData] = useState(null);
  const [active, setActive] = useState('requisition');
  const [userInfo, setUserInfo] = useState({
    name: '',
    department: '',
    employeeCode: '',
    date: '',
    manager_id: ''
  });


  const [formFields, setFormFields] = useState({
    purpose: '',
    projectName: '',
    city: '',
    localityArea: '',
    typeOfTravel: '',
    advanceRequested: '',
    fromDate: '',
    tentativeToDate: ''
  });

  const [transportModes, setTransportModes] = useState([]);
  const [accommodations, setAccommodations] = useState([]);

  const toastRef = useRef(null);


  useEffect(() => {
    const userData = getUserData();

    const today = new Date().toISOString().slice(0, 10);
    if (userData?.userDetails) {
      setUserData(userData);
      setUserInfo({
        name: userData.userDetails.userName,
        department: userData.userDetails.department,
        employeeCode: userData.userDetails.employeeId,
        date: today,
        manager_id: userData.userDetails.manager
      });
    }
  }, []);
  useEffect(() => {
    console.log('Transport Modes:', transportModes);
    console.log('Accommodations:', accommodations);
  }
    , [transportModes, accommodations]); // Update dependencies as needed

  // Update text input fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormFields((prev) => ({ ...prev, [name]: value }));
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = userData.token;
    console.log('User Info:', userInfo);

    // ✅ Filter finalized rows
    const finalizedTransportModes = transportModes.filter(row => !row.isEditable);
    const finalizedAccommodations = accommodations.filter(row => !row.isEditable);

    const payload = {
      ...userInfo,           // includes name, department, employeeCode, etc.
      ...formFields,         // includes purpose, fromDate, tentativeToDate, etc.
      advancedAmount: parseFloat(formFields.advanceRequested || 0), // maps to "advance"
      manager_id: userInfo.manager_id,
      transportModes: finalizedTransportModes,
      accommodations: finalizedAccommodations
    };

    try {
      console.log('Payload:', payload);
      const response = await axios.post(
        'http://localhost:8081/traveldesk/travels',
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('API Response:', response.data);

      if (response.data.includes("Travel requisition submitted successfully")) {
        showSuccessMessage(toastRef, "✅ Submitted!", `Requisition ID: ${response.data.split(':')[1].trim()}`);

        // ✅ Reset all fields
        setFormFields({
          purpose: '',
          projectName: '',
          city: '',
          localityArea: '',
          typeOfTravel: '',
          advanceRequested: ''
        });

        const today = new Date().toISOString().slice(0, 10);
        setUserInfo((prev) => ({
          ...prev,
          date: today
        }));

        setTransportModes([]);
        setAccommodations([]);
      } else {
        showErrorMessage(toastRef, 'Something went wrong');
      }
    } catch (error) {
      console.error('Submission error:', error.response || error.message);

      if (error.response?.status === 401) {
        showWarningMessage(toastRef, '⚠️ Session expired. Please re-login.');
      } else {
        showErrorMessage(toastRef, '❌ Error while submitting');
      }
    }
  };


  return (
    <>
      <Toast ref={toastRef} />
      {/* rest of your component */}
      <div className="max-w-[85rem] mx-auto p-6 min-h-screen bg-gray-100">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Tab navigation buttons */}
          <div className="inline-flex rounded-md overflow-hidden mb-6">
            <button
              type="button"
              onClick={() => setActive('requisition')}
              className={`w-40 py-1.5 pl-4 pr-2 text-sm font-medium text-left focus:outline-none
              ${active === 'requisition'
                  ? 'border-b-2 border-primary-500 text-primary-500'
                  : 'hover:border-b-2 hover:border-primary-500 text-gray-900'}
            `}
            >
              Requisition Form
            </button>

            <div className="border-l-2 border-primary-500" />

            <button
              type="button"
              onClick={() => setActive('myforms')}
              className={`w-30 py-1.5 pl-4 pr-2 text-sm font-medium text-left focus:outline-none
              ${active === 'myforms'
                  ? 'border-b-2 border-primary-500 text-primary-500'
                  : 'hover:border-b-2 hover:border-primary-500 text-gray-900'}
            `}
            >
              My Forms
            </button>
          </div>

          {/* Requisition Form Section */}
          <div className="max-w-6xl mx-auto">
            {active === 'requisition' && (
              <form onSubmit={handleSubmit}>
                <div className="space-y-12">
                  {/* Personal Information Section */}
                  <div>
                    <h2 className="text-2xl font-semibold leading-7 text-gray-900 mb-5 border-b border-gray-900/12 pb-4">
                      Travel Requisition Form</h2>

                    <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                      {/* Name field (disabled) */}
                      {/* <div className="sm:col-span-3 pl-3">
                      <label htmlFor="Name" className="block text-sm font-medium leading-6 text-gray-900">Name</label>
                      <div className="mt-2">
                        <input
                          type="text"
                          name="Name"
                          id="Name"
                          value={userInfo.name}
                          disabled
                          className="block w-full rounded-md border-0 py-1.5 pl-2 bg-gray-200 text-gray-500 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm cursor-not-allowed"
                        />
                      </div>
                    </div> */}


                      {/* Department field (disabled) */}
                      {/* <div className="sm:col-span-4">
                      <label htmlFor="department" className="block text-sm font-medium leading-6 text-gray-900">Department</label>
                      <div className="mt-2">
                        <input
                          id="department"
                          name="department"
                          type="text"
                          value={userInfo.department}
                          disabled
                          className="block w-full rounded-md border-0 py-1.5 pl-2 bg-gray-200 text-gray-500 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm cursor-not-allowed"
                        />
                      </div>
                    </div> */}

                      {/* Employee Code field (disabled) */}
                      {/* <div className="sm:col-span-5">
                      <label htmlFor="employeeCode" className="block text-sm font-medium leading-6 text-gray-900">Employee Code</label>
                      <div className="mt-2">
                        <input
                          id="employeeCode"
                          name="employeeCode"
                          type="text"
                          value={userInfo.employeeCode}
                          disabled
                          className="block w-full rounded-md border-0 py-1.5 pl-2 bg-gray-200 text-gray-500 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm cursor-not-allowed"
                        />
                      </div>
                    </div> */}

                      {/* Purpose field */}
                      <div className="sm:col-span-5">
                        <label htmlFor="purpose" className="block text-sm font-medium leading-6 text-gray-900">
                          Purpose
                        </label>
                        <div className="mt-2">
                          <input
                            id="purpose"
                            name="purpose"
                            type="text"
                            value={formFields.purpose}                // Binds the value to state
                            onChange={handleInputChange}              // Updates state on change
                            autoComplete="off"
                            className="block w-full rounded-md border-0 py-1.5 pl-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          />
                        </div>
                      </div>


                      {/* Project Name field */}
                      {/* Project Name field */}
                      <div className="sm:col-span-5 ">
                        <label htmlFor="projectName" className="block text-sm font-medium leading-6 text-gray-900">
                          Project Name
                        </label>
                        <div className="mt-2">
                          <input
                            id="projectName"
                            name="projectName"
                            type="text"
                            value={formFields.projectName}
                            onChange={(e) =>
                              setFormFields({ ...formFields, projectName: e.target.value })
                            }
                            autoComplete="off"
                            className="block w-full rounded-md border-0 py-1.5 pl-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          />
                        </div>
                      </div>

                      {/* City field */}
                      <div className="sm:col-span-5">
                        <label htmlFor="city" className="block text-sm font-medium leading-6 text-gray-900">
                          City
                        </label>
                        <div className="mt-2">
                          <input
                            id="city"
                            name="city"
                            type="text"
                            value={formFields.city}
                            onChange={(e) =>
                              setFormFields({ ...formFields, city: e.target.value })
                            }
                            autoComplete="off"
                            className="block w-full rounded-md border-0 py-1.5 pl-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          />
                        </div>
                      </div>


                      {/* Locality/Area field */}
                      <div className="sm:col-span-5">
                        <label htmlFor="locality" className="block text-sm font-medium leading-6 text-gray-900">
                          Locality/Area
                        </label>
                        <div className="mt-2">
                          <input
                            id="locality"
                            name="locality"
                            type="text"
                            value={formFields.localityArea}
                            onChange={(e) =>
                              setFormFields({ ...formFields, localityArea: e.target.value })
                            }
                            autoComplete="off"
                            className="block w-full rounded-md border-0 py-1.5 pl-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          />
                        </div>
                      </div>

                      {/* Type of Travel dropdown */}
                      <div className="sm:col-span-5">
                        <label htmlFor="travel-type" className="block text-sm font-medium leading-6 text-gray-900">
                          Type of Travel
                        </label>
                        <div className="mt-2 relative">
                          <select
                            id="travel-type"
                            name="typeOfTravel"
                            value={formFields.typeOfTravel}
                            onChange={(e) =>
                              setFormFields({ ...formFields, typeOfTravel: e.target.value })
                            }
                            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-21 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 appearance-none"
                          >
                            <option value="" disabled className="text-gray-400">Select one</option>
                            <option value="Sales Marketing">Sales Marketing</option>
                            <option value="Project">Project</option>
                            <option value="Service Paid">Service Paid</option>
                            <option value="Service Free">Service Free</option>
                            <option value="Survey">Survey</option>
                            <option value="Training">Training</option>
                            <option value="Others">Others</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center pr-1">
                            <ChevronDownIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
                          </div>
                        </div>
                      </div>

                      {/* Advanced Amount field */}
                      <div className="sm:col-span-5">
                        <label htmlFor="advanced-amount" className="block text-sm font-medium leading-6 text-gray-900">
                          Advanced Amount
                        </label>
                        <div className="mt-2">
                          <input
                            id="advanced-amount"
                            name="advanceRequested"
                            type="number"
                            value={formFields.advanceRequested}
                            onChange={(e) =>
                              setFormFields({ ...formFields, advanceRequested: e.target.value })
                            }
                            autoComplete="off"
                            className="block w-full rounded-md border-0 py-1.5 pl-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          />
                        </div>
                      </div>


                      {/* From Date field */}
                      <div className="sm:col-span-5">
                        <label htmlFor="fromDate" className="block text-sm font-medium leading-6 text-gray-900">
                          From Date
                        </label>
                        <div className="mt-2">
                          <input
                            type="date"
                            name="fromDate"
                            id="fromDate"
                            value={formFields.fromDate}
                            onChange={(e) =>
                              setFormFields({ ...formFields, fromDate: e.target.value })
                            }
                            autoComplete="off"
                            className="block w-full rounded-md border-0 py-1.5 pl-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          />
                        </div>
                      </div>

                      {/* Tentative To Date field */}
                      <div className="sm:col-span-5">
                        <label htmlFor="tentativeToDate" className="block text-sm font-medium leading-6 text-gray-900">
                          Tentative To Date
                        </label>
                        <div className="mt-2">
                          <input
                            type="date"
                            name="tentativeToDate"
                            id="tentativeToDate"
                            value={formFields.tentativeToDate}
                            onChange={(e) =>
                              setFormFields({ ...formFields, tentativeToDate: e.target.value })
                            }
                            autoComplete="off"
                            className="block w-full rounded-md border-0 py-1.5 pl-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          />
                        </div>
                      </div>





                    </div>
                  </div>
                </div>
                <div className="pt-5">
                  <ModeOfTransportTable transportModes={transportModes} setTransportModes={setTransportModes} />
                </div>
                <div>
                  <AccommodationTable accommodations={accommodations} setAccommodations={setAccommodations} />
                </div>
                <div className="card flex justify-content-center h-10 px-4 text-lg">
                  <Button label="Submit" onClick={handleSubmit} />
                </div>
              </form>
            )}
          </div>

          {/* My Forms Section (placeholder) */}
          {active === 'myforms' && (
            <div>My Forms table goes here</div>
          )}

        </div>
      </div>
    </>

  );
};

export default TravelDesk;