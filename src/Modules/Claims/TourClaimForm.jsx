import React, {  useEffect, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
//import { Button } from "primereact/button";
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
//import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import {
  getTourClaimFormDetails,
  getAdvance,
  getlatestclaimtodate,
  
} from "./claimServices";
import {getTravelDetailsFromTravelId2} from "../TravelDesk/TravelDeskAPI"

const TourClaimForm = ({
  tourclaimformData,
  settourclaimformData,
  tourclaimFormLabeData,
  editableMode,
  toggleNewClaim,
  travelModeOptions,
  travelTypeOptions,
    selectedtravelMode,
    setselectedtravelMode
}) => {

  
  const [advance, setadvance] = useState(null);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const handleChange = (field, value) => {   
      settourclaimformData((prev) => ({ ...prev, [field]: value }));
  };

  

  const fetchTourClaimFormDetails = async (id) => {
    console.log('id', id)
    try {
      if (id === "Long-Term-Local-Conveyance") {
        settourclaimformData((prev) => ({
          ...prev,
          advance: advance,
          travel_id: "Long-Term-Local-Conveyance",
          projectName: "",
          purpose: "",
          travelType: "",
          destination: "",
          onAccount: "",
          travelfromDate: "",
          claimFromDate: "",
          claimToDate: "",
        }));
      } else {
        //const data = await getTourClaimFormDetails(id);
      const responseData=await getTravelDetailsFromTravelId2(id)
      // console.log('data.typeOfTravel.',data.typeOfTravel)
      // console.log('data.porpus.',data.purpose)
      // console.log('data.projectName', data.projectName)
      // console.log('data.city', data.city)
      let data=responseData.data

      console.log('data', data)

      const dates = await getlatestclaimtodate(id);

        settourclaimformData((prev) => ({
          ...prev,
          advance: advance,
          travel_id: id,
          projectName: data.projectName,
          purpose: data.purpose,       
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
    fetchAdvanceBalence();
  }, []);

 

  return (
    <div className="p-4">
      <div className="p-4 bg-white space-y-6 mt-4">
        <Accordion defaultExpanded>
        <AccordionSummary
          expandIcon={<ArrowDropDownIcon />}
          aria-controls="panel2-content"
          id="panel2-header"
        >
          <Typography component="span" className="ml-2">Available Advance - {advance}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
             
          
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-20 ml-8 gap-y-4 mb-4 justify-items-center mt-2">
              <div>
                <label
                  htmlFor="Select-Travel"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Select Travel -
                </label>
                {editableMode?<InputText
                  inputId="selectedtravelMode_value"
                  className="w-62 text-3xs"
                  value={selectedtravelMode?selectedtravelMode.label:''}
                 // onChange={(e) =>handleChange("destination", e.target.value)}
                  disabled
                />:
                  <Dropdown
                    inputId="Select-Travel"
                    className="w-62 "
                   value={selectedtravelMode?selectedtravelMode.value:''}
                    options={travelModeOptions}
                   
                    onChange={(e) => {
                 
                      fetchTourClaimFormDetails(e.value); 
                      setselectedtravelMode(e)  
                    }}
                    placeholder="Select a Mode"
                    disabled={editableMode === true }
                  />
}
                 
              </div>
              <div>
                <label
                  htmlFor="Type-of-Travel"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Type of Travel -
                </label>
                <Dropdown
                  inputId="Type-of-Travel"
                  className="w-62 text-sm"
                  value={tourclaimformData.travelType}
                  options={travelTypeOptions}
                  onChange={(e) => handleChange("travelType", e.value)}
                  placeholder="Select a Type"
                  disabled={
                    (selectedtravelMode?selectedtravelMode.value:'') !==
                    "Long-Term-Local-Conveyance"
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="Destination"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Destination -
                </label>

                <InputText
                  inputId="Destination"
                  className="w-62 text-sm"
                  value={tourclaimformData.destination}
                  onChange={(e) =>handleChange("destination", e.target.value)}
                  disabled={
                    (selectedtravelMode?selectedtravelMode.value:'') !==
                    "Long-Term-Local-Conveyance"
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="Purpose-of-Trip"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Purpose of Trip -
                </label>

                <InputText
                  inputId="Purpose-of-Trip"
                  className="w-62 text-sm"
                  value={tourclaimformData.purpose}
                  onChange={(e) => handleChange("purpose", e.target.value)}
                  disabled={
                    (selectedtravelMode?selectedtravelMode.value:'') !==
                    "Long-Term-Local-Conveyance"
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="Project-Name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Project Name -
                </label>

                <InputText
                  inputId="Project-Name"
                  className="w-62"
                  value={tourclaimformData.projectName}
                  onChange={(e) =>  handleChange("projectName", e.target.value)}
                 disabled={
                    (selectedtravelMode?selectedtravelMode.value:'') !==
                    "Long-Term-Local-Conveyance"
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="On-Account"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  On Account -
                </label>
                <InputText
                  inputId="On-Account"
                  className="w-62"
                  value={tourclaimformData.onAccount}
                  onChange={(e) => handleChange("onAccount", e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="fromdate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Travel From Date -
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
                  onChange={(e) =>  handleChange("travelfromDate", e.target.value)}
                  disabled
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="claimFromDate">Claim From Date:-</label>

                {toggleNewClaim ? (
                  <Calendar
                    inputId="claimFromDate"
                    showIcon
                     dateFormat="dd-mm-yy"
                    className="w-62"
                    value={new Date(tourclaimformData.claimFromDate)}
                    onChange={(e) =>handleChange("claimFromDate", e.value)}
                    disabled={
                    (selectedtravelMode?selectedtravelMode.value:'') !==
                    "Long-Term-Local-Conveyance"
                  }
                  />
                ) : (
                  <Calendar
                    inputId="claimFromDate"
                    showIcon
                     dateFormat="dd-mm-yy"
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
                      Claim To Date -
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
                   dateFormat="dd-mm-yy"
                  className="w-62"
                  value={new Date(tourclaimformData.claimToDate)}
                  onChange={(e) =>  handleChange("claimToDate", e.target.value)}
                    minDate={
                    tourclaimformData.claimFromDate
                      ? new Date(tourclaimformData.claimFromDate)
                      : null
                  }
                />
              </div>
            </div>
        
       
          </Typography>
        </AccordionDetails>
      </Accordion>
        {/* <div className="flex  items-center ">
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
                {editableMode?<InputText
                  inputId="selectedtravelMode_value"
                  className="w-62 text-3xs"
                  value={selectedtravelMode?selectedtravelMode.label:''}
                 // onChange={(e) =>handleChange("destination", e.target.value)}
                  disabled
                />:
                  <Dropdown
                    inputId="Select-Travel"
                    className="w-62 "
                   value={selectedtravelMode?selectedtravelMode.value:''}
                    options={travelModeOptions}
                   
                    onChange={(e) => {
                 
                      fetchTourClaimFormDetails(e.value); 
                      setselectedtravelMode(e)  
                    }}
                    placeholder="Select a Mode"
                    disabled={editableMode === true }
                  />
}
                 
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
                  onChange={(e) => handleChange("travelType", e.value)}
                  placeholder="Select a Type"
                  disabled={
                    (selectedtravelMode?selectedtravelMode.value:'') !==
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
                  onChange={(e) =>handleChange("destination", e.target.value)}
                  disabled={
                    (selectedtravelMode?selectedtravelMode.value:'') !==
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
                  onChange={(e) => handleChange("purpose", e.target.value)}
                  disabled={
                    (selectedtravelMode?selectedtravelMode.value:'') !==
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
                  onChange={(e) =>  handleChange("projectName", e.target.value)}
                 disabled={
                    (selectedtravelMode?selectedtravelMode.value:'') !==
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
                  onChange={(e) => handleChange("onAccount", e.target.value)}
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
                  onChange={(e) =>  handleChange("travelfromDate", e.target.value)}
                  disabled
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="claimFromDate">Claim From Date:-</label>

                {toggleNewClaim ? (
                  <Calendar
                    inputId="claimFromDate"
                    showIcon
                     dateFormat="dd-mm-yy"
                    className="w-62"
                    value={new Date(tourclaimformData.claimFromDate)}
                    onChange={(e) =>handleChange("claimFromDate", e.value)}
                    disabled={
                    (selectedtravelMode?selectedtravelMode.value:'') !==
                    "Long-Term-Local-Conveyance"
                  }
                  />
                ) : (
                  <Calendar
                    inputId="claimFromDate"
                    showIcon
                     dateFormat="dd-mm-yy"
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
                   dateFormat="dd-mm-yy"
                  className="w-62"
                  value={new Date(tourclaimformData.claimToDate)}
                  onChange={(e) =>  handleChange("claimToDate", e.target.value)}
                    minDate={
                    tourclaimformData.claimFromDate
                      ? new Date(tourclaimformData.claimFromDate)
                      : null
                  }
                />
              </div>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default TourClaimForm;
