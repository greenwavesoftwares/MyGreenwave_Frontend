import axios from "axios";
import React, { useState, useEffect } from "react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import ModeOfTransportTable from "./ModeOfTransportTable"; // update path as needed
import AccommodationTable from "./AccommodationTable";
import { getUserData } from "../Login/Encrypt"; // adjust path if needed
import { Button } from "primereact/button";
//import { Toast } from "primereact/toast";
import CustomToast from "../../components/Toast/Toast";

import CustomInputText from "../../components/InputText/InputText";

import { InputNumber } from "primereact/inputnumber";
import { Calendar } from 'primereact/calendar';
import { useRef } from "react";
import {
  showSuccessMessage,
  showErrorMessage,
  showWarningMessage,
} from "../../components/Toast/ShowMessage";

import { Dropdown } from "primereact/dropdown";
//Call Api
import {
  getMyFormTravelData_New,
  getMyFormTravelData,
  getTravelDropDown,
  createRequisition,
} from "../TravelDesk/TravelDeskAPI";
//MY Form Component Call
import MyForm from "./MyForms";
import { getTravelDetailsFromTravelId2 } from "./TravelDeskAPI";
//import {getTravelDropDown} from '../Claims/claimServices'

const TravelDeskNew = () => {
  const minfromDate = new Date();
  const [travelModeOptions, setTravelModeOptions] = useState([]);
  const [selectedtravelMode, setselectedtravelMode] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isEditable, setIsEditable] = useState(true); // Default: true for "New Travel"
  const [active, setActive] = useState("requisition");
  const [formErrors, setFormErrors] = useState({});
  const [userInfo, setUserInfo] = useState({
    name: "",
    department: "",
    employeeCode: "",
    date: "",
    manager_id: "",
  });

   const [typeOfTravelOptions, settypeOfTravelOptions] = useState(["Sales Marketing","Project","Service Paid","Service Free","Survey","Training","Others"]);

  const [formFields, setFormFields] = useState({
    travelId: "",
    purpose: "",
    projectName: "",
    city: "",
    localityArea: "",
    typeOfTravel: "",
    advanceRequested: "",
    fromDate: "",
    tentativeToDate: "",
  });



  const [transportModes, setTransportModes] = useState([]);
  const [accommodations, setAccommodations] = useState([]);

  //Set MY Form Table Data
  const [myFormTableData, setMyFormTableData] = useState([]);

  const toastRef = useRef(null);

  const handlesetFormData = async (travelId) => {
    if (travelId != "New Travel") {
      setIsEditable(false);
     
      let response = await getTravelDetailsFromTravelId2(travelId);
       setFormErrors({
          purpose: false,
          projectName: false,
          city: false,
          localityArea: false,
          typeOfTravel: false,
          advanceRequested: false,
          fromDate: false,
          tentativeToDate: false,
  });

      if (!response.status) {
        showErrorMessage("error", "Error", response.message);
        

        setFormFields({
          travelId: "",
          purpose: "",
          projectName: "",
          city: "",
          localityArea: "",
          typeOfTravel: "",
          advanceRequested: "",
          fromDate: "",
          tentativeToDate: "",
        });
      } else {
        setFormFields({
          travelId: travelId,
          purpose: response.data.purpose,
          projectName: response.data.projectName,
          city: response.data.city,
          localityArea: response.data.localityArea,
          typeOfTravel: response.data.typeOfTravel,
          advanceRequested: response.data.advanceRequested,
          fromDate: response.data.fromDate,
          tentativeToDate: response.data.tentativeToDate,
        });
      }
    } else {
      setIsEditable(true);
      setFormFields({
        travelId: "",
        purpose: "",
        projectName: "",
        city: "",
        localityArea: "",
        typeOfTravel: "",
        advanceRequested: "",
        fromDate: "",
        tentativeToDate: "",
      });
    }
  };

  //My Form Api Call
  const myFormApi = async () => {
    try {
      // const { token } = getUserData();
      //await getMyFormTravelData()
      const response = await getMyFormTravelData_New();
      console.log(1213, response);
      if (!response.status) {
        showErrorMessage("error", "Error", response.message);
      } else {
        setMyFormTableData(response.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

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
        manager_id: userData.userDetails.manager,
      });
    }
    const fetchDropdownList = async () => {
      try {
        const travelModeData = await getTravelDropDown();
        if (travelModeData.status) setTravelModeOptions(travelModeData.data);
      } catch (error) {
        console.error("Error fetching tour claim list:", error);
      }
    };
    fetchDropdownList();
    //MY Form api function call
    myFormApi();
  }, [active]);

  useEffect(() => {}, [transportModes, accommodations]); // Update dependencies as needed

  // Update text input fields
  // const handleInputChange = (e) => {
  //   console.log(e.target.value)
  //   const { name, value } = e.target;
  // //     if (name === "advanceRequested") {
  // //   // Allow empty string (user is clearing input)
  // //   if (value === "" || /^\d+$/.test(value)) {
  // //     setFormFields((prev) => ({ ...prev, [name]: value }));
  // //     setFormErrors((prev) => ({ ...prev, [name]: false }));
  // //   }
  // //   return; // Ignore anything else (like 100-200, 12.5, abc)
  // // }

  // if (value.trim() !== "") {
  //   setFormErrors((prev) => ({ ...prev, [name]: false }));
  //   return;
  // }
  // setFormFields((prev) => ({ ...prev, [name]: value }));
  // };

  const endPoint = import.meta.env.VITE_END_POINT;

  const validateForm = () => {
    const requiredFields = [
      "purpose",
      "projectName",
      "city",
      "localityArea",
      "typeOfTravel",
      "fromDate",
      "tentativeToDate",
      //"advanceRequested",
    ];

    const errors = {};


    requiredFields.forEach((field) => {
      if (!formFields[field] || formFields[field].toString().trim() === "") {
        errors[field] = true;
      }
    });

    setFormErrors(errors); // highlight those with errors


    return Object.keys(errors).length === 0; // valid if no errors
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    console.log("My formFields : ", formFields);
    e.preventDefault();

    const token = userData.token;
    try {
      // ✅ Filter finalized rows
      const finalizedTransportModes = transportModes.filter(
        (row) => !row.isEditable
      );
      const finalizedAccommodations = accommodations.filter(
        (row) => !row.isEditable
      );

      const payload = {
        // ...userInfo,           // includes name, department, employeeCode, etc.
        ...formFields, // includes purpose, fromDate, tentativeToDate, etc.
        advancedAmount: parseFloat(formFields.advanceRequested || 0), // maps to "advance"
        manager_id: userInfo.manager_id,
        transportModes: finalizedTransportModes,
        accommodations: finalizedAccommodations,
        status: "",
      };
      console.log('formErrors', formErrors)

      if (!validateForm()) {
        //const firstKey = Object.keys(formErrors)[0];
        if (toastRef?.current) {
          showErrorMessage(
            toastRef,
            "Error",
            `Please fill in all required fields.`
          );
        }
        // showErrorMessage(
        //   "error",
        //   "Error",
        //   "Please fill in all required fields."
        // );
        // alert("Please fill in all required fields.");
        return;
      }

      if (formFields.fromDate > formFields.tentativeToDate) {
        if (toastRef?.current) {
          showErrorMessage(
            "error",
            "Error",
            "From Date cannot be later than Tentative To Date."
          );
        }

        return;
      }
      console.log("payload", payload);
      let response = await createRequisition(payload);

      if (response.status) {
        showSuccessMessage(
          toastRef,
          "✅ Submitted!",
          `Requisition ID: ${response.data.requisionId}`
        );
        setFormFields({
          travelId: "",
          purpose: "",
          projectName: "",
          city: "",
          localityArea: "",
          typeOfTravel: "",
          advanceRequested: "",
          fromDate: "",
          tentativeToDate: "",
        });

        const today = new Date().toISOString().slice(0, 10);
        setUserInfo((prev) => ({
          ...prev,
          date: today,
        }));

        setTransportModes([]);
        setAccommodations([]);
      } else {
        showErrorMessage(toastRef, "Error", response.message);
      }
    } catch (error) {
      showErrorMessage(toastRef, "Error", error.message);
    }
  };

  const handleInputWithValidation = (field, value) => {
  setFormFields((prev) => ({
    ...prev,
    [field]: value,
  }));
  console.log('field', field)

  if (field==='fromDate') 
    {
      setFormErrors((prev) => ({
      ...prev,
      fromDate: !value?true:false
      }));
}else if(field==='tentativeToDate')
  {
     setFormErrors((prev) => ({
      ...prev,
      tentativeToDate: !value?true:false
      }));
  }else if(field==='typeOfTravel')
    {
        setFormErrors((prev) => ({
      ...prev,
      typeOfTravel: value.trim() === "" ? true : false
      }));
    }else{

  setFormErrors((prev) => ({
    ...prev,
    [field]: value.trim() === "" ? true : false,
  }));
};
  }

  return (
    <>
      <CustomToast ref={toastRef} />
      {/* rest of your component */}
      <div className="max-w-[85rem] mx-auto p-6 min-h-screen bg-gray-100">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Tab navigation buttons */}
          <div className="inline-flex rounded-md overflow-hidden mb-6">
            <button
              type="button"
              onClick={() => setActive("requisition")}
              className={`w-40 py-1.5 pl-4 pr-2 text-sm font-medium text-left focus:outline-none
              ${
                active === "requisition"
                  ? "border-b-2 border-primary-500 text-primary-500"
                  : "hover:border-b-2 hover:border-primary-500 text-gray-900"
              }
            `}
            >
              Requisition Form
            </button>

            <div className="border-l-2 border-primary-500" />

            <button
              type="button"
              onClick={() => setActive("myforms")}
              className={`w-30 py-1.5 pl-4 pr-2 text-sm font-medium text-left focus:outline-none
              ${
                active === "myforms"
                  ? "border-b-2 border-primary-500 text-primary-500"
                  : "hover:border-b-2 hover:border-primary-500 text-gray-900"
              }
            `}
            >
              My Forms
            </button>
          </div>

          {/* Requisition Form Section */}
          <div className="max-w-6xl mx-auto">
            {active === "requisition" && (
              <form onSubmit={handleSubmit}>
                <div className="space-y-12">
                  {/* Personal Information Section */}
                  <div>
                    <h2 className="text-2xl font-semibold leading-7 text-gray-900 mb-5 border-b border-gray-900/12 pb-4">
                      Travel Requisition Form
                    </h2>

                    <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                      <div className="sm:col-span-5">
                        <label
                          htmlFor="travel-type"
                          className="block text-sm font-medium leading-6 text-gray-900"
                        >
                          Type Mode
                        </label>
                        <div className="mt-2 relative">
                          <Dropdown
                            inputId="Select-Mode"
                          //  className="w-52 h-10 text-sm shadow-sm mb-2"
                            panelClassName="text-sm"
                            dropdownIcon="pi pi-chevron-down"
                            value={
                              selectedtravelMode ? selectedtravelMode.value : ""
                            }
                            options={travelModeOptions}
                            onChange={(e) => {
                              handlesetFormData(e.value);
                              setselectedtravelMode(e);
                            }}
                            placeholder="Select a Mode"
                          />
                        </div>
                      </div>

                      {/* Purpose field */}
                      <div className="sm:col-span-5">
                        <label
                          htmlFor="purpose"
                          className="block text-sm font-medium leading-6 text-gray-900"
                        >
                          Purpose
                        </label>
                        <div className="mt-2">
                          <CustomInputText
                            id="purpose"
                            name="purpose"
                            type="text"
                            value={formFields.purpose}
                            onChange={(e) => handleInputWithValidation("purpose", e.target.value)}
                            // onChange={(e) => {
                            //   console.log("Purpose : ", e.target.value);
                            //   const value = e.target.value;
                            //   if (value.trim() === "") {
                            //     setFormErrors((prev) => ({
                            //       ...prev,
                            //       purpose: true
                            //     }));
                            //   //  return;
                            //   }
                            //   setFormFields({ ...formFields, purpose: value });
                            // }}
                            autoComplete="off"
                            required
                            disabled={!isEditable}
                            className={` 
                            ${formErrors.purpose ? "ring-2 ring-red-500 focus:ring-red-500" : ""} `}
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-5 ">
                        <label
                          htmlFor="projectName"
                          className="block text-sm font-medium leading-6 text-gray-900"
                        >
                          Project Name
                        </label>
                        <div className="mt-2">
                          <CustomInputText
                            id="projectName"
                            name="projectName"
                            type="text"
                            value={formFields.projectName}
                             onChange={(e) => handleInputWithValidation("projectName", e.target.value)}
                            // onChange={(e) => {
                            //   {
                            //     console.log('FormErrors', formErrors)
                            //     const value = e.target.value;
                            //     if (value.trim() === "") {
                            //       setFormErrors((prev) => ({
                            //         ...prev,
                            //         projectName: true,
                            //       }));
                            //       // return;
                            //     }
                            //     setFormFields((prev) => ({
                            //       ...prev,
                            //       projectName: value,
                            //     }));
                            //   }
                            // }}
                            autoComplete="off"
                            disabled={!isEditable}
                            className={`
    ${formErrors.projectName ? "ring-2 ring-red-500 focus:ring-red-500" : ""} 
   `}
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-5">
                        <label
                          htmlFor="city"
                          className="block text-sm font-medium leading-6 text-gray-900"
                        >
                          City
                        </label>
                        <div className="mt-2">
                          <CustomInputText
                            id="city"
                            name="city"
                            type="text"
                            value={formFields.city}
                             onChange={(e) => handleInputWithValidation("city", e.target.value)}
                            // onChange={(e) => {
                            //   {
                            //     const value = e.target.value;
                            //     if (value.trim() === "") {
                            //       setFormErrors((prev) => ({
                            //         ...prev,
                            //         city: false,
                            //       }));
                            //       // return;
                            //     }
                            //     setFormFields((prev) => ({
                            //       ...prev,
                            //       city: value,
                            //     }));
                            //   }
                            // }}
                            autoComplete="off"
                            disabled={!isEditable}
                            className={`
    ${formErrors.city ? "ring-2 ring-red-500 focus:ring-red-500" : ""} 
   `}
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-5">
                        <label
                          htmlFor="locality"
                          className="block text-sm font-medium leading-6 text-gray-900"
                        >
                          Locality/Area
                        </label>
                        <div className="mt-2">
                          <CustomInputText
                            id="localityArea"
                            name="localityArea"
                            type="text"
                            value={formFields.localityArea}
                             onChange={(e) => handleInputWithValidation("localityArea", e.target.value)}
                            // onChange={(e) => {
                            //   {
                            //     const value = e.target.value;
                            //     if (value.trim() === "") {
                            //       setFormErrors((prev) => ({
                            //         ...prev,
                            //         localityArea: false,
                            //       }));
                            //       // return;
                            //     }
                            //     setFormFields((prev) => ({
                            //       ...prev,
                            //       localityArea: value,
                            //     }));
                            //   }
                            // }}
                            autoComplete="off"
                            disabled={!isEditable}
                            className={`
    ${formErrors.localityArea ? "ring-2 ring-red-500 focus:ring-red-500" : ""} 
   `}
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-5">
                        <label
                          htmlFor="travel-type"
                          className="block text-sm font-medium leading-6 text-gray-900"
                        >
                          Type of Travel
                        </label>
                        <div className="mt-2 relative">
                          <Dropdown
                            inputId="Select-Travel"
              
                            panelClassName="text-sm"
                            dropdownIcon="pi pi-chevron-down"
                            value={formFields.typeOfTravel}
                            options={typeOfTravelOptions}
                             onChange={(e) => handleInputWithValidation("typeOfTravel", e.value)}
                          //  onChange={(e) => {
                          //     {
                          //       const value = e.value;
                          //       if (value.trim() === "") {
                          //         setFormErrors((prev) => ({
                          //           ...prev,
                          //           typeOfTravel: false,
                          //         }));
                          //         // return;
                          //       }
                          //       setFormFields((prev) => ({
                          //         ...prev,
                          //         typeOfTravel: value,
                          //       }));
                          //     }
                          //   }}
                            placeholder="Select One"
                             disabled={!isEditable}
                               className={`${formErrors.tentativeToDate ? "ring-2 ring-red-500 focus:ring-red-500" : ""}`}
                          />
                          {/* <select
                            id="travel-type"
                            name="typeOfTravel"
                            value={formFields.typeOfTravel}
                            // onChange={(e) =>
                            //   setFormFields({
                            //     ...formFields,
                            //     typeOfTravel: e.target.value,
                            //   })
                            // }
                            onChange={(e) => {
                              {
                                const value = e.target.value;
                                if (value.trim() === "") {
                                  setFormErrors((prev) => ({
                                    ...prev,
                                    typeOfTravel: false,
                                  }));
                                  // return;
                                }
                                setFormFields((prev) => ({
                                  ...prev,
                                  typeOfTravel: value,
                                }));
                              }
                            }}
                            disabled={!isEditable}
                            className={`block w-full rounded-md border-0 py-1.5 pl-2 text-gray-900 shadow-sm ring-1 ring-inset 
    ${formErrors.typeOfTravel ? "ring-red-500 focus:ring-red-500" : "ring-gray-300 focus:ring-indigo-600"} 
    placeholder:text-gray-400 sm:text-sm sm:leading-6`}
                          >
                            <option value="" disabled className="text-gray-400">
                              Select one
                            </option>
                            <option value="Sales Marketing">
                              Sales Marketing
                            </option>
                            <option value="Project">Project</option>
                            <option value="Service Paid">Service Paid</option>
                            <option value="Service Free">Service Free</option>
                            <option value="Survey">Survey</option>
                            <option value="Training">Training</option>
                            <option value="Others">Others</option>
                          </select> */}
                          <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center pr-1"></div>
                        </div>
                      </div>

                      {/* From Date field */}
                      <div className="sm:col-span-5">
                        <label
                          htmlFor="fromDate"
                          className="block text-sm font-medium leading-6 text-gray-900"
                        >
                          From Date
                        </label>
                        <div className="mt-2">
                          <Calendar  value={new Date(formFields.fromDate)} 
                           onChange={(e) => handleInputWithValidation("fromDate", e.value)}
                          // onChange={(e) => {
                          //     {
                          //       const value = e.value;
                          //         console.log("value", value)
                          //       if (!value) {
                          //         setFormErrors((prev) => ({
                          //           ...prev,
                          //           fromDate: false,
                          //         }));
                          //         // return;
                          //       }
                              
                          //       setFormFields((prev) => ({
                          //         ...prev,
                          //         fromDate: value,
                          //       }));
                          //     }
                          //   }}  
                            maxDate={new Date(formFields.tentativeToDate) || undefined}
                             // locale="es"
                               disabled={!isEditable}
                               dateFormat="dd/mm/yy"
                                className={`${formErrors.fromDate ? "ring-2 ring-red-500 focus:ring-red-500" : ""}`}
                              />
                          
                          {/* <input
                            type="date"
                            name="fromDate"
                            required
                            id="fromDate"
                            value={formFields.fromDate}
                            min={minfromDate}
                            max={formFields.tentativeToDate || undefined}
                            // onChange={(e) =>
                            //   setFormFields({
                            //     ...formFields,
                            //     fromDate: e.target.value,
                            //   })
                            // }
                            onChange={(e) => {
                              {
                                const value = e.target.value;
                                if (value.trim() === "") {
                                  setFormErrors((prev) => ({
                                    ...prev,
                                    fromDate: false,
                                  }));
                                  // return;
                                }
                                setFormFields((prev) => ({
                                  ...prev,
                                  fromDate: value,
                                }));
                              }
                            }}
                            autoComplete="off"
                            disabled={!isEditable}
                            className={`block w-full rounded-md border-0 py-1.5 pl-2 text-gray-900 shadow-sm ring-1 ring-inset 
    ${formErrors.fromDate ? "ring-red-500 focus:ring-red-500" : "ring-gray-300 focus:ring-indigo-600"} 
    placeholder:text-gray-400 sm:text-sm sm:leading-6`}
                          /> */}
                        </div>
                      </div>

                      {/* Tentative To Date field */}
                      <div className="sm:col-span-5">
                        <label
                          htmlFor="tentativeToDate"
                          className="block text-sm font-medium leading-6 text-gray-900"
                        >
                          Tentative To Date
                        </label>
                        <div className="mt-2">
                          <Calendar  value={new Date(formFields.tentativeToDate)} 
                           onChange={(e) => handleInputWithValidation("tentativeToDate", e.value)}
                          // onChange={(e) => {
                          //     {
                          //       const value = e.value;
                          //       console.log("value", value)
                          //       if (!value) {
                          //         setFormErrors((prev) => ({
                          //           ...prev,
                          //           tentativeToDate: false,
                          //         }));
                          //         // return;
                          //       }
                             
                          //       setFormFields((prev) => ({
                          //         ...prev,
                          //         tentativeToDate: value,
                          //       }));
                          //     }
                          //   }} 
                            //max={new Date(formFields.tentativeToDate) || undefined}
                             // locale="es"
                               disabled={!isEditable}
                               minDate={new Date(formFields.fromDate) || undefined} // prevent selecting before fromDate
                                dateFormat="dd/mm/yy"
                            className={`${formErrors.tentativeToDate ? "ring-2 ring-red-500 focus:ring-red-500" : ""}`}
                              />
                          {/* <input
                            type="date"
                            name="tentativeToDate"
                            required
                            id="tentativeToDate"
                            value={formFields.tentativeToDate}
                            // onChange={(e) =>
                            //   setFormFields({
                            //     ...formFields,
                            //     tentativeToDate: e.target.value,
                            //   })
                            // }
                            onChange={(e) => {
                              {
                                const value = e.target.value;
                                if (value.trim() === "") {
                                  setFormErrors((prev) => ({
                                    ...prev,
                                    tentativeToDate: false,
                                  }));
                                  // return;
                                }
                                setFormFields((prev) => ({
                                  ...prev,
                                  tentativeToDate: value,
                                }));
                              }
                            }}
                            min={formFields.fromDate || undefined} // prevent selecting before fromDate
                            //max={formFields.tentativeToDate ?? undefined}
                            autoComplete="off"
                            disabled={!isEditable}
                            className={`block w-full rounded-md border-0 py-1.5 pl-2 text-gray-900 shadow-sm ring-1 ring-inset 
    ${formErrors.tentativeToDate ? "ring-red-500 focus:ring-red-500" : "ring-gray-300 focus:ring-indigo-600"} 
                           placeholder:text-gray-400 sm:text-sm sm:leading-6`}
                          /> */}
                        </div>
                      </div>

                      {/* Advanced Amount field */}
                      <div className="sm:col-span-5">
                        <label
                          htmlFor="advanced-amount"
                          className="block text-sm font-medium leading-6 text-gray-900"
                        >
                          Advanced Amount
                        </label>
                        <div className="mt-2">
                          <InputNumber
                            value={formFields.advanceRequested || 0}
                            name="advanceRequested"
                            onChange={(e) => {
                              {
                                console.log(
                                  " Event : ",
                                  e,
                                  " value : ",
                                  e.value
                                );
                                const value = e.value;
                                //                             if (value) {
                                //   setFormErrors((prev) => ({ ...prev, advanceRequested: false }));
                                //   return;
                                // }
                                console.log(
                                  "My advanceRequested : ",
                                  formErrors.advanceRequested
                                );
                                setFormFields((prev) => ({
                                  ...prev,
                                  advanceRequested: value,
                                }));
                              }
                            }}
                            mode="decimal"
                //             className={` 
                //   ${formErrors.advanceRequested ? "ring-red-500 focus:ring-red-500" : ""} 
                // `}
                            min={0}
                          />
                          {/* <CustomInputText required
                            id="advanced-amount"
                            name="advanceRequested"
                            type="number"
                            
                            min={0}
                            value={formFields.advanceRequested}
                            // onChange={(e) =>
                            //   setFormFields({
                            //     ...formFields,
                            //     advanceRequested: e.target.value,
                            //   })
                            // }
                              onChange={handleInputChange}
                            autoComplete="off"
                            className={`block w-full rounded-md border-0 py-1.5 pl-2 text-gray-900 shadow-sm ring-1 ring-inset 
                  ${formErrors.advanceRequested ? "ring-red-500 focus:ring-red-500" : "ring-gray-300 focus:ring-indigo-600"} 
                  placeholder:text-gray-400 sm:text-sm sm:leading-6`}
                          /> */}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-5">
                  <ModeOfTransportTable
                    transportModes={transportModes}
                    setTransportModes={setTransportModes}
                  />
                </div>
                <div>
                  <AccommodationTable
                    accommodations={accommodations}
                    setAccommodations={setAccommodations}
                  />
                </div>
                <div className="card flex justify-content-center h-10 px-4 text-lg">
                  <Button label="Submit" onClick={handleSubmit} />
                </div>
              </form>
            )}
          </div>

          {/* My Forms Section (placeholder) */}
          {active === "myforms" && <MyForm myFormTableData={myFormTableData} />}
        </div>
      </div>
    </>
  );
};

export default TravelDeskNew;
