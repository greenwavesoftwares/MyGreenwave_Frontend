import React, { useState, useEffect, useRef } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import TourClaimForm from "./TourClaimForm";
import TourClaimTable from "./TourClaimTable";
import DraftForm from "./DraftForm";
import MyTourClaims from "./MyTourClaims";
import { getDraftData, getTravelDropDown, formateDate } from "./claimServices";

const TRAVEL_TYPE_OPTIONS = [
  "Others",
  "Sales Marketing",
  "Project",
  "Service Paid",
  "Service Fees",
  "Survey",
  "Training",
];

// Safety cap on the number of rows auto-created from a date range
const MAX_CLAIM_DAYS = 366;

// A blank expense row, same shape TourClaimTable uses
const BLANK_EXPENSE_ROW = {
  Date: "",
  Lodging: "",
  Breakfast: "",
  Lunch: "",
  Snacks: "",
  Dinner: "",
  "Tea & Water": "",
  "Airfare, Bus, Train, Taxi Rental": "",
  "Auto, Cab": "",
  "Parking, Toll, Fuel": "",
  Incidentals: "",
  "Other Business Expenses": "",
  Total: 0,
  Remarks: "",
};

// A function (not a constant) so the dates are "today" each time it's used
const createEmptyClaimForm = () => ({
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

const TourClaim = () => {
  const toast = useRef(null);

  // UI mode
  const [editableMode, seteditableMode] = useState(false); // editing an existing draft
  const [toggleNewClaim, settoggleNewClaim] = useState(false); // creating a new claim

  // Claim editor data
  const [tourclaimformData, settourclaimformData] = useState(
    createEmptyClaimForm,
  );
  const [tourClaimTableData, settourClaimTableData] = useState([]);
  // Always points at the latest table rows, so the date-range sync never
  // works from a stale copy
  const tableDataRef = useRef([]);
  tableDataRef.current = tourClaimTableData;
  const [formErrors, setFormErrors] = useState({});
  const [selectedtravelMode, setselectedtravelMode] = useState(null);
  const [tourclaimFormLabeData] = useState({});

  // Server data
  const [draftData, setDraftData] = useState([]);
  const [travelModeOptions, setTravelModeOptions] = useState([]);

  const fetchDraftData = async () => {
    try {
      const response = await getDraftData();
      if (response.status) {
        setDraftData(response.data);
        if (response.data.length === 0) {
          settoggleNewClaim(true); // nothing to list, go straight to the form
        }
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: response.message,
        });
      }
    } catch (err) {
      console.error("Error loading draft data:", err);
      setDraftData([]);
    }
  };

  const fetchDropdownList = async () => {
    try {
      const travelModeData = await getTravelDropDown();
      if (travelModeData.status) setTravelModeOptions(travelModeData.data);
    } catch (error) {
      console.error("Error fetching travel dropdown:", error);
    }
  };

  useEffect(() => {
    fetchDropdownList();
    fetchDraftData();
  }, []);

  // Clears the claim editor back to a blank state
  const resetClaimEditor = () => {
    settourclaimformData(createEmptyClaimForm());
    settourClaimTableData([]);
    setselectedtravelMode(null);
    setFormErrors({});
  };

  const startNewClaim = () => {
    resetClaimEditor();
    seteditableMode(false);
    settoggleNewClaim(true);
  };

  // DraftForm resets the form with `[]` after delete/apply, which would break
  // the controlled inputs (the form data is an object). Coerce that to a
  // proper empty form.
  const setClaimFormDataSafe = (value) => {
    if (Array.isArray(value)) {
      settourclaimformData(createEmptyClaimForm());
    } else {
      settourclaimformData(value);
    }
  };

  const showDateRangeMessage = (severity, detail) =>
    toast.current?.show({
      severity,
      summary: severity === "error" ? "Error" : "Warning",
      detail,
      life: 5000,
    });

  // Rebuilds the expense table so it has one row per day from `from` to `to`
  // (inclusive). Rows already present for a date in range keep their data;
  // rows outside the range are removed. Every case where it can't do this
  // (or has to discard entered data) is reported to the user.
  const syncTableRowsToDateRange = (from, to) => {
    if (!from || !to) {
      showDateRangeMessage(
        "warn",
        "Select both Claim From and Claim To dates to create the expense rows.",
      );
      return;
    }

    const start = new Date(from);
    const end = new Date(to);
    if (isNaN(start) || isNaN(end)) {
      showDateRangeMessage(
        "error",
        "Invalid claim date. Please pick the dates again.",
      );
      return;
    }
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (start > end) {
      showDateRangeMessage(
        "error",
        "Claim From date cannot be after Claim To date.",
      );
      return;
    }

    const days = Math.round((end - start) / 86400000) + 1;
    if (days > MAX_CLAIM_DAYS) {
      showDateRangeMessage(
        "error",
        `The claim period is ${days} days. Rows can be created for at most ${MAX_CLAIM_DAYS} days.`,
      );
      return;
    }

    // Format every date first, so a bad date is reported before the
    // table is touched
    const keys = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = formateDate(d);
      if (!key) {
        showDateRangeMessage(
          "error",
          "Could not read one of the dates in the claim period.",
        );
        return;
      }
      keys.push(key);
    }

    const current = tableDataRef.current;
    const existing = new Map(
      current.filter((r) => r.Date).map((r) => [formateDate(r.Date), r]),
    );
    const rows = keys.map(
      (key) => existing.get(key) || { ...BLANK_EXPENSE_ROW, Date: key },
    );

    // Rows that fall outside the new range are discarded; tell the user if
    // any of them had entered data
    const keySet = new Set(keys);
    const droppedWithData = current.filter(
      (r) =>
        r.Date &&
        !keySet.has(formateDate(r.Date)) &&
        (Number(r.Total) > 0 || r.Remarks),
    );

    settourClaimTableData(rows);

    if (droppedWithData.length > 0) {
      showDateRangeMessage(
        "warn",
        `${droppedWithData.length} row(s) with entered data were outside the new date range and were removed.`,
      );
    }
  };

  const showDrafts =
    draftData.length > 0 && !toggleNewClaim && !editableMode;
  const showEditor = editableMode || toggleNewClaim;

  return (
    <div className="container mx-auto px-4">
      <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
        <div className="mt-3 shadow rounded">
          <Toast ref={toast} />
          <TabView>
            <TabPanel header="New Claim">
              {showDrafts && (
                <div className="defaultBorder">
                  <div className="flex justify-between items-center p-2">
                    <h2 className="text-md font-semibold text-gray-700">
                      📝 My Drafts
                    </h2>
                    <Button
                      label="Add New Claim"
                      icon="pi pi-plus"
                      className="p-button-sm"
                      onClick={startNewClaim}
                      size="small"
                      rounded
                      style={{ padding: "0.3rem 0.7rem", fontSize: "0.85rem" }}
                    />
                  </div>

                  <DraftForm
                    draftData={draftData}
                    setDraftData={setDraftData}
                    refreshDraftData={fetchDraftData}
                    seteditableMode={seteditableMode}
                    settoggleNewClaim={settoggleNewClaim}
                    settourclaimformData={setClaimFormDataSafe}
                    settourClaimTableData={settourClaimTableData}
                    setselectedtravelMode={setselectedtravelMode}
                  />
                </div>
              )}

              {showEditor && (
                <>
                  <TourClaimForm
                    tourclaimformData={tourclaimformData}
                    settourclaimformData={settourclaimformData}
                    tourclaimFormLabeData={tourclaimFormLabeData}
                    editableMode={editableMode}
                    toggleNewClaim={toggleNewClaim}
                    travelTypeOptions={TRAVEL_TYPE_OPTIONS}
                    travelModeOptions={travelModeOptions}
                    selectedtravelMode={selectedtravelMode}
                    setselectedtravelMode={setselectedtravelMode}
                    formErrors={formErrors}
                    setFormErrors={setFormErrors}
                    onDateRangeChange={syncTableRowsToDateRange}
                  />

                  <TourClaimTable
                    editableMode={editableMode}
                    seteditableMode={seteditableMode}
                    toggleNewClaim={toggleNewClaim}
                    settoggleNewClaim={settoggleNewClaim}
                    tourClaimTableData={tourClaimTableData}
                    settourClaimTableData={settourClaimTableData}
                    tourclaimformData={tourclaimformData}
                    settourclaimformData={settourclaimformData}
                    setDraftData={setDraftData}
                    draftData={draftData}
                    formErrors={formErrors}
                    setFormErrors={setFormErrors}
                    setselectedtravelMode={setselectedtravelMode}
                  />
                </>
              )}
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
