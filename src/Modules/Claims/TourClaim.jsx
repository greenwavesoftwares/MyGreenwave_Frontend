import React, { useState, useEffect, useRef } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import TourClaimForm from "./TourClaimForm";
import TourClaimTable from "./TourClaimTable";
import DraftForm from "./DraftForm";
import MyTourClaims from "./MyTourClaims";
import { Button } from "primereact/button";
import {
  getDraftData,
  handleSaveToDraft,
  getTravelDropDown,
} from "./claimServices";
import { Toast } from "primereact/toast";

const TourClaim = () => {
  const toast = useRef();

  const [editableMode, seteditableMode] = useState(false); // true by default
  const [toggleNewClaim, settoggleNewClaim] = useState(false); // controls form+table visibility
  const [formErrors, setFormErrors] = useState({});
  const [draftData, setDraftData] = useState([]);
  const [travelModeOptions, setTravelModeOptions] = useState([]);
  const [selectedtravelMode, setselectedtravelMode] = useState(null);
  const [travelTypeOptions, settravelTypeOptions] = useState([
    "Others",
    "Sales Marketing",
    "Project",
    "Service Paid",
    "Service Fees",
    "Survey",
    "Training",
  ]);
  const [tourClaimTableData, settourClaimTableData] = useState(
    []
    //     {
    //     'Date': '',
    //     'Lodging': '',
    //     'Breakfast': '',
    //     'Lunch': '',
    //     'Snacks': '',
    //     'Dinner': '',
    //     'Tea & Water': '',
    //     'Airfare, Bus, Train, Taxi Rental': '',
    //     'Auto, Cab': '',
    //     'Parking, Toll, Fuel': '',
    //     'Incidentals': '',
    //     'Other Business Expenses': '',
    //     'Total': '',
    // }
  );
  const [tourclaimFormLabeData, settourclaimFormLabeData] = useState([]);

  const [tourclaimformData, settourclaimformData] = useState({
    claim_id: "",
    advance: "",
    travel_id: "",

    travelType: "",
    destination: "",
    purpose: "",
    projectName: "",
    onAccount: "",
    travelfromDate: "",
    claimFromDate: new Date(),
    claimToDate: new Date(),
    filename: "",
    file_type: "",
  });
  // const [viewtable,setviewtable]=useState([]);

  useEffect(() => {
    const fetchDraftData = async () => {
      try {
        const response = await getDraftData();
        if (response.status) {
          setDraftData(response.data);
          if (response.data.length == 0) {
            settoggleNewClaim(true);
          }
        } else {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: response.message,
          });
        }
      } catch (err) {
        console.error("Error loading draft data:", err);
        setDraftData([]); // fallback
      }
    };

    const fetchDropdownList = async () => {
      try {
        const travelModeData = await getTravelDropDown();
        console.log("travelModeData",travelModeData)
        if (travelModeData.status) setTravelModeOptions(travelModeData.data);
      } catch (error) {
        console.error("Error fetching tour claim list:", error);
      }
    };
    fetchDropdownList();

    fetchDropdownList();
    fetchDraftData();
  }, []);

  const handleSaveToDraft = () => {
    // After saving to draft, hide form and table again
    // settoggleNewClaim(false);
    // seteditableMode(true); // reset to editable mode
  };

  return (
    <div className="container mx-auto px-4">
      <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
        <div className="mt-3  shadow rounded">
          <Toast ref={toast} />
          <TabView>
            <TabPanel header="New Claim">
              <div className="">
                {draftData.length > 0 && !toggleNewClaim && !editableMode && (
                  <div className="defaultBorder">
                    <div className="flex justify-between items-center p-2 ">
                      <h2 className="text-md font-semibold text-gray-700">
                        📝 My Drafts
                      </h2>
                      <Button
                        label="Add New Claim"
                        icon="pi pi-plus"
                        className="p-button-sm"
                        onClick={() => {
                          settoggleNewClaim(true);
                          seteditableMode(false);
                          settourclaimformData({
                            claim_id: "",
                            advance: "",
                            travel_id: "",
                            travelMode: "",
                            travelType: "",
                            destination: "",
                            purpose: "",
                            projectName: "",
                            onAccount: "",
                            travelfromDate: "",
                            claimFromDate: new Date(),
                            claimToDate: new Date(),
                            filename: "",
                            file_type: "",
                          });
                          settourClaimTableData([]);
                          setselectedtravelMode(null);
                        }}
                        size="small"
                        rounded
                        style={{padding: "0.3rem 0.7rem",fontSize:"0.85rem"}}
                      />
                    </div>

                    <DraftForm
                      draftData={draftData}
                      setDraftData={setDraftData}
                      editableMode={editableMode}
                      seteditableMode={seteditableMode}
                      tourclaimformData={tourclaimformData}
                      settourclaimformData={settourclaimformData}
                      settourClaimTableData={settourClaimTableData}
                      settoggleNewClaim={settoggleNewClaim}
                      setTravelModeOptions={setTravelModeOptions}
                      selectedtravelMode={selectedtravelMode}
                      setselectedtravelMode={setselectedtravelMode}
                    />
                  </div>
                )}
                {editableMode || toggleNewClaim ? (
                  <>
                    <TourClaimForm
                      tourclaimformData={tourclaimformData}
                      settourclaimformData={settourclaimformData}
                      onSaveToDraft={handleSaveToDraft}
                      tourclaimFormLabeData={tourclaimFormLabeData}
                      editableMode={editableMode}
                      toggleNewClaim={toggleNewClaim}
                      travelTypeOptions={travelTypeOptions}
                      travelModeOptions={travelModeOptions}
                      selectedtravelMode={selectedtravelMode}
                      setselectedtravelMode={setselectedtravelMode}
                      formErrors={formErrors}
                      setFormErrors={setFormErrors}
                    />

                    <TourClaimTable
                      editableMode={editableMode}
                      seteditableMode={seteditableMode}
                      toggleNewClaim={toggleNewClaim}
                      settoggleNewClaim={settoggleNewClaim}
                      settourClaimTableData={settourClaimTableData}
                      tourClaimTableData={tourClaimTableData}
                      settourclaimFormLabeData={settourclaimFormLabeData}
                      settourclaimformData={settourclaimformData}
                      tourclaimformData={tourclaimformData}
                      setDraftData={setDraftData}
                       draftData={draftData}
                      formErrors={formErrors}
                      setFormErrors={setFormErrors}
                    />
                  </>
                ) : (
                  ""
                )}
              </div>
            </TabPanel>
            <TabPanel header="History">
              <MyTourClaims />
            </TabPanel>
          </TabView>
        </div>
      </div>
    </div>
  );
};

export default TourClaim;
