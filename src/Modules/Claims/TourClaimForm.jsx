import React, { useRef, useEffect, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import {
  getTourClaimFormDetails,
  getAdvance,
  getlatestclaimtodate,
} from "./claimServices";

const TourClaimForm = ({
  tourclaimformData,
  settourclaimformData,
  tourclaimFormLabeData,
  editableMode,
  toggleNewClaim,
  travelModeOptions,
  travelTypeOptions,
}) => {
  const [advance, setadvance] = useState(null);

  const [isFormExpanded, setIsFormExpanded] = useState(true);

  const handleChange = (value) => {
    settourclaimformData((prev) => ({ ...prev, value }));
  };

  const fetchTourClaimFormDetails = async (id) => {
    try {
      if (id === "Long-Term-Local-Conveyance") {
        settourclaimformData((prev) => ({
          ...prev,
          advance: advance,
          requisition_id: "Long-Term-Local-Conveyance",
          projectName: "",
          purpose: "",
          travelMode: "Long-Term-Local-Conveyance",
          travelType: "",
          destination: "",
          onAccount: "",
          travelfromDate: "",
          claimFromDate: "",
          claimToDate: "",
        }));
      } else {
        const data = await getTourClaimFormDetails(id);
        const dates = await getlatestclaimtodate(id);
        console.log("testing anish");

        settourclaimformData((prev) => ({
          ...prev,
          advance: advance,
          requisition_id: id,
          projectName: data.projectName,
          purpose: data.purpose,
          travelMode: id,
          travelType: data.typeOfTravel,
          destination: data.city,
          onAccount: "",
          travelfromDate: dates[0].travelfromdate,
          claimFromDate: dates[0].claimformdate,
          claimToDate: dates[0].claimtodate,
        }));
      }
    } catch (error) {
      console.error("Error fetching tour claim details:", error);
    }
  };

  useEffect(() => {
    const fetchAdvanceBalence = async () => {
      try {
        const advanceblance = await getAdvance();
        setadvance(advanceblance);
      } catch (error) {
        console.error("Error in get advancebalace:", error);
      }
    };
    // const fetchDropdownList = async () => {
    //   try {
    //     const travelDropDownData = await getTravelDropDown();
    //     travelDropDownData["In-Station Local Conveyance"] =
    //       "Long-Term-Local-Conveyance";

    //     const formattedOptions = Object.entries(travelDropDownData).map(
    //       ([label, value]) => ({
    //         label,
    //         value,
    //       })
    //     );

    //     setTravelModeOptions(formattedOptions);
    //   } catch (error) {
    //     console.error("Error fetching tour claim list:", error);
    //   }
    // };
    fetchAdvanceBalence();
    //   fetchDropdownList();
  }, []);

  // console.log("tourclaimformData",tourclaimformData.travelMode?.label)

  return (
    <div className="p-4">
      <div className="p-4 bg-white space-y-6 mt-4">
        <div className="flex  items-center ">
          <Button
            label="Tour Claim"
            icon={isFormExpanded ? "pi pi-chevron-up" : "pi pi-chevron-down"}
            className={`p-button-sm ml-8  ${
              isFormExpanded
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
            onClick={() => setIsFormExpanded(!isFormExpanded)}
          />

          <div className="flex justify-between items-center   px-4 mt-2 h-12 mr-8">
            <span className="text-gray-700 font-medium">
              Available Advance:
            </span>
            <span className="text-green-600 font-bold">{advance}</span>
          </div>
        </div>

        {isFormExpanded && (
          <div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-20 ml-8 gap-y-4 mb-4 justify-items-center mt-6">
              <div>
                <label
                  htmlFor="Select-Travel"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Select Travel
                </label>
                {editableMode === true ? (
                    <InputText
                  inputId="Select-Travel"
                  className="w-62"
                  value={
                    tourclaimformData.travelMode?.label
                  }
              
                  disabled
                />
                ) : (
                  <Dropdown
                    inputId="Select-Travel"
                    className="w-62 "
                    //value={selectedtravelMode}
                    value={tourclaimformData.travelMode?.label}
                    options={travelModeOptions}
                    //optionLabel="lable"
                    onChange={(e) => {
                      handleChange(e.value);
                      fetchTourClaimFormDetails(e.value);
                    }}
                    placeholder="Select a Mode"
                  />
                )}
              </div>
              <div>
                <label
                  htmlFor="Type-of-Travel"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Type of Travel
                </label>
                <Dropdown
                  inputId="Type-of-Travel"
                  className="w-62 text-sm"
                  value={tourclaimformData.travelType}
                  options={travelTypeOptions}
                  onChange={(e) => handleChange(e.value)}
                  placeholder="Select a Type"
                  disabled={
                    tourclaimformData.travelMode !==
                    "Long-Term-Local-Conveyance"
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="Destination"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Destination
                </label>

                <InputText
                  inputId="Destination"
                  className="w-62 text-sm"
                  value={tourclaimformData.destination}
                  onChange={(e) => handleChange(e.target.value)}
                  disabled={
                    tourclaimformData.travelMode !==
                    "Long-Term-Local-Conveyance"
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="Purpose-of-Trip"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Purpose of Trip
                </label>

                <InputText
                  inputId="Purpose-of-Trip"
                  className="w-62 text-sm"
                  value={tourclaimformData.purpose}
                  onChange={(e) => handleChange(e.target.value)}
                  disabled={
                    tourclaimformData.travelMode !==
                    "Long-Term-Local-Conveyance"
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="Project-Name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Project Name
                </label>

                <InputText
                  inputId="Project-Name"
                  className="w-62"
                  value={tourclaimformData.projectName}
                  onChange={(e) => handleChange(e.target.value)}
                  disabled={
                    tourclaimformData.travelMode !==
                    "Long-Term-Local-Conveyance"
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="On-Account"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  On Account:
                </label>
                <InputText
                  inputId="On-Account"
                  className="w-62"
                  value={tourclaimformData.onAccount}
                  onChange={(e) => handleChange(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="fromdate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Travel From Date:
                </label>
                <InputText
                  inputId="travelfromDate"
                  className="w-62"
                  value={
                    tourclaimformData.travelfromDate
                      ? new Date(
                          tourclaimformData.travelfromDate
                        ).toLocaleDateString()
                      : "No Date Selected"
                  }
                  onChange={(e) => handleChange(e.target.value)}
                  disabled
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="claimFromDate">Claim From Date:-</label>

                {toggleNewClaim ? (
                  <Calendar
                    inputId="claimFromDate"
                    showIcon
                    className="w-62"
                    value={tourclaimformData.claimFromDate}
                    onChange={(e) => handleChange(e.value)}
                    disabled={
                      tourclaimformData.travelMode !==
                      "Long-Term-Local-Conveyance"
                    }
                  />
                ) : (
                  <Calendar
                    inputId="claimFromDate"
                    showIcon
                    className="w-62"
                    value={new Date(tourclaimformData.claimFromDate)}
                    disabled
                  />
                )}
              </div>

              <div>
                <label
                  htmlFor="claimToDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  <div className="flex  items-center">
                    <span>
                      Claim To Date:-{" "}
                      {tourclaimFormLabeData.toDate
                        ? new Date(
                            tourclaimFormLabeData.toDate
                          ).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                </label>
                <Calendar
                  inputId="claimToDate"
                  showIcon
                  className="w-62"
                  value={new Date(tourclaimformData.claimToDate)}
                  onChange={(e) => handleChange(e.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TourClaimForm;
