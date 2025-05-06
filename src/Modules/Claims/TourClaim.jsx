import React, { useState, useEffect } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import TourClaimForm from "./TourClaimForm";
import TourClaimTable from "./TourClaimTable";
import DraftForm from "./DraftForm";
import MyTourClaims from "./MyTourClaims";
import { Button } from "primereact/button";
import { getDraftData, handleSaveToDraft } from "./claimServices";

const TourClaim = () => {
 
  const [editableMode, seteditableMode] = useState(false); // true by default
  const [toggleNewClaim, settoggleNewClaim] = useState(false); // controls form+table visibility
  const [draftData, setDraftData] = useState([]);
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
    requisition_id: "",
    travelMode: "",
    travelType: "",
    destination: "",
    purpose: "",
    projectName: "",
    onAccount: "",
    travelfromDate: "",
    claimFromDate: "",
    claimToDate: "",
    filename: "",
    file_type: "",
  });
  // const [viewtable,setviewtable]=useState([]);

  useEffect(
    () => {
      const fetchDraftData = async () => {
        try {
          const formattedDraftData = await getDraftData();
          setDraftData(formattedDraftData);

          if (formattedDraftData.length == 0) {
               settoggleNewClaim(true);
          }
        } catch (err) {
          console.error("Error loading draft data:", err);
          setDraftData([]); // fallback
        }
      };
      fetchDraftData();
    },
    [],[draftData]
  );

  const handleSaveToDraft = () => {
    // After saving to draft, hide form and table again
    // settoggleNewClaim(false);
    // seteditableMode(true); // reset to editable mode
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-white min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto bg-white shadow-2xl rounded-3xl transition-all duration-300">
        <TabView className="p-tabview-custom">
          <TabPanel header="New Claim">
            <div className="space-y-6">
              {draftData.length > 0 && !toggleNewClaim && !editableMode && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
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
                          requisition_id: "",
                          travelMode: "",
                          travelType: "",
                          destination: "",
                          purpose: "",
                          projectName: "",
                          onAccount: "",
                          travelfromDate: "",
                          claimFromDate: "",
                          claimToDate: "",
                          filename: "",
                          file_type: "",
                        });
                        settourClaimTableData([]);
                      }}
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
                  />
                </>
              ) : (
                ""
              )}
            </div>
          </TabPanel>

          {/* My Claims Tab */}
          <TabPanel header="My Claims">
            <div className="space-y-10">
              <div className="bg-white border border-blue-100 rounded-xl p-6 shadow-sm">
                <h2 className="text-md font-semibold text-blue-800 mb-4">
                  📂 My Claims
                </h2>
                <MyTourClaims/>
              </div>
            </div>
          </TabPanel>
        </TabView>
      </div>
    </div>
  );
};

export default TourClaim;
