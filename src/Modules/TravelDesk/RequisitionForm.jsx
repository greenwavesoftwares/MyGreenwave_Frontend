///import axios from "axios";
import { useState, useEffect } from "react";
//import { ChevronDownIcon } from "@heroicons/react/16/solid";
import ModeOfTransportTable from "./ModeOfTransportTable";
import AccommodationTable from "./AccommodationTable";
import { getUserData } from "../Login/Encrypt";
//import { Button } from "primereact/button";
import CustomButton from "../../components/Button/Button";

import CustomToast from "../../components/Toast/Toast";
import { CustomeCalender } from "../../components/Calender/CustomeCalender";

import CustomInputText from "../../components/InputText/InputText";
import { formateDate } from "../../Modules/Claims/claimServices";

import { InputNumber } from "primereact/inputnumber";
//import { Calendar } from "primereact/calendar";
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
  getTravelDropDown,
  createRequisition,
} from "../TravelDesk/TravelDeskAPI";
//MY Form Component Call
import MyForm from "./MyForms";
import { getTravelDetailsFromTravelId2 } from "./TravelDeskAPI";
//import {getTravelDropDown} from '../Claims/claimServices'
import { getAdvance } from "../../Modules/Claims/claimServices";

const RequisitionForm = () => {
  const minfromDate = new Date();
  const [travelModeOptions, setTravelModeOptions] = useState([]);
  const [advance,setAdvance]=useState();
  const [selectedtravelMode, setselectedtravelMode] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isEditable, setIsEditable] = useState(true); // Default: true for "New Travel"

  const [formErrors, setFormErrors] = useState({});
  const [userInfo, setUserInfo] = useState({
    name: "",
    department: "",
    employeeCode: "",
    date: "",
    manager_id: "",
  });

  const [typeOfTravelOptions, settypeOfTravelOptions] = useState([
    "Sales Marketing",
    "Project",
    "Service Paid",
    "Service Free",
    "Survey",
    "Training",
    "Others",
  ]);

  const [formFields, setFormFields] = useState({
    travelId: "",
    purpose: "",
    projectName: "",
    city: "",
    localityArea: "",
    typeOfTravel: "",
    advanceRequested: "",
    fromDate: new Date(),
    tentativeToDate: new Date(),
  });

  const [transportModes, setTransportModes] = useState([]);
  const [accommodations, setAccommodations] = useState([]);

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
          fromDate: new Date(),
          tentativeToDate: new Date(),
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
          fromDate: formateDate(response.data.fromDate),
          tentativeToDate: formateDate(response.data.tentativeToDate),
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
        fromDate: new Date(),
        tentativeToDate: new Date(),
      });
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
            const advanceblance = await getAdvance();
            setAdvance(advanceblance);
        const travelModeData = await getTravelDropDown();
        if (travelModeData.status) setTravelModeOptions(travelModeData.data);
      } catch (error) {
        console.error("Error fetching tour claim list:", error);
      }
    };
    fetchDropdownList();
  }, []);

  //useEffect(() => {}, [transportModes, accommodations]); // Update dependencies as needed

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
      //   const finalizedTransportModes = transportModes.filter(
      //     (row) => !row.isEditable
      //   );
      //   const finalizedAccommodations = accommodations.filter(
      //     (row) => !row.isEditable
      //   );

       // Validate transportModes: check for incomplete rows
  const incompleteTransportRows = transportModes.filter((row) => {
    return (
      !row?.mode || row.mode?.trim() === ""|| 
    !row?.fromDate || row.fromDate.toString().trim() === "" 
     
    );
  });

  if (incompleteTransportRows.length > 0) {
    showWarningMessage(
      toastRef,
      "Warning",
      "Please complete all Transport Mode entries or remove incomplete rows."
    );
    return;
  }

  const incompleteAccommodationsRows = accommodations.filter((row) => {
    return (
      !row?.type || row.type?.trim() === "" || 
      !row?.numberOfRooms || row.numberOfRooms?.trim() === "" ||
       !row?.checkIn || row.checkIn?.toString().trim() === "" || 
      !row?.checkOut || row.checkOut?.toString().trim() === "" ||
      !row?.numberOfNights || row.numberOfNights == null
    );
  });

  if (incompleteAccommodationsRows.length > 0) {
    showWarningMessage(
      toastRef,
      "Warning",
      "Please complete all Accomodation entries or remove incomplete rows."
    );
    return;
  }



      const payload = {
        // ...userInfo,           // includes name, department, employeeCode, etc.
        ...formFields, // includes purpose, fromDate, tentativeToDate, etc.
        advancedAmount: parseFloat(formFields.advanceRequested || 0), // maps to "advance"
        manager_id: userInfo.manager_id,
        transportModes: transportModes,
        accommodations: accommodations,
        status: "",
      };
      console.log("formErrors", formErrors);

      if (!validateForm()) {
        //const firstKey = Object.keys(formErrors)[0];
        if (toastRef?.current) {
          showErrorMessage(
            toastRef,
            "Error",
            `Please fill in all required fields.`
          );
        }

        return;
      }

      //   if (formFields.fromDate > formFields.tentativeToDate) {
      //     if (toastRef?.current) {
      //       showErrorMessage(
      //         "error",
      //         "Error",
      //         "From Date cannot be later than Tentative To Date."
      //       );
      //     }

      //     return;
      //   }
      console.log("payload", payload);
      console.log("submit is called", payload);
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
          fromDate: new Date(),
          tentativeToDate: new Date(),
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
    console.log("field", field);

    if (field === "fromDate") {
      setFormErrors((prev) => ({
        ...prev,
        fromDate: !value ? true : false,
      }));
    } else if (field === "tentativeToDate") {
      setFormErrors((prev) => ({
        ...prev,
        tentativeToDate: !value ? true : false,
      }));
    } else if (field === "typeOfTravel") {
      setFormErrors((prev) => ({
        ...prev,
        typeOfTravel: value.trim() === "" ? true : false,
      }));
    } else {
      setFormErrors((prev) => ({
        ...prev,
        [field]: value.trim() === "" ? true : false,
      }));
    }
  };

  return (
    <>
      <CustomToast ref={toastRef} />

      <div className="p-4 min-h-screen bg-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-12">
            <div>
              <h2 className="text-2xl font-semibold leading-7 text-gray-900 mb-5 border-b border-gray-900/12 pb-4">
                Available Advance - {advance}
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
                      value={selectedtravelMode ? selectedtravelMode.value : ""}
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
                      onChange={(e) =>
                        handleInputWithValidation("purpose", e.target.value)
                      }
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
                      onChange={(e) =>
                        handleInputWithValidation("projectName", e.target.value)
                      }
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
                      onChange={(e) =>
                        handleInputWithValidation("city", e.target.value)
                      }
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
                      onChange={(e) =>
                        handleInputWithValidation(
                          "localityArea",
                          e.target.value
                        )
                      }
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
                      onChange={(e) =>
                        handleInputWithValidation("typeOfTravel", e.value)
                      }
                      placeholder="Select One"
                      disabled={!isEditable}
                      className={`${formErrors.tentativeToDate ? "ring-2 ring-red-500 focus:ring-red-500" : ""}`}
                    />

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
                    <CustomeCalender
                      value={new Date(formFields.fromDate)}
                      onChange={(e) =>
                        handleInputWithValidation(
                          "fromDate",
                          formateDate(e.value)
                        )
                      }
                      maxDate={(() => {
                        const date = new Date(formFields.tentativeToDate);
                        const today = new Date();
                        return date.getDate() === today.getDate() &&
                          date.getMonth() === today.getMonth() &&
                          date.getFullYear() === today.getFullYear()
                          ? undefined
                          : date;
                      })()}
                      minDate={
                        //new Date(formFields.fromDate) ||
                        new Date()
                      }
                      // locale="es"
                      disabled={!isEditable}
                      dateFormat="dd/mm/yy"
                      className={`${formErrors.fromDate ? "ring-2 ring-red-500 focus:ring-red-500" : ""}`}
                    />
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
                    <CustomeCalender
                      value={new Date(formFields.tentativeToDate)}
                      onChange={(e) =>
                        handleInputWithValidation(
                          "tentativeToDate",
                          formateDate(e.value)
                        )
                      }
                      disabled={!isEditable}
                      minDate={new Date(formFields.fromDate)} // prevent selecting before fromDate
                      dateFormat="dd/mm/yy"
                      className={`${formErrors.tentativeToDate ? "ring-2 ring-red-500 focus:ring-red-500" : ""}`}
                    />
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
                          console.log(" Event : ", e, " value : ", e.value);
                          const value = e.value;

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
                      min={0}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-5">
            <ModeOfTransportTable
              transportModes={transportModes}
              setTransportModes={setTransportModes}
              formFields={formFields}
              formErrors={formErrors}
            />
          </div>
          <div>
            <AccommodationTable
              accommodations={accommodations}
              setAccommodations={setAccommodations}
              formFields={formFields}
              formErrors={formErrors}
            />
          </div>
          <div className="card flex justify-content-center h-10 px-4 text-lg">
            <CustomButton label="Submit" onClick={handleSubmit} />
          </div>
        </div>
      </div>
    </>
  );
};

export default RequisitionForm;
