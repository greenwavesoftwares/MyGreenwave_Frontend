import React, { useRef, useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { FileUpload } from "primereact/fileupload";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";

import * as XLSX from "xlsx";
//import { FiUpload } from "react-icons/fi";


import {
  getTravelDropDown,
  uploadSupportingDocuments,
  deleteDraftList,
  applyClaim,
  downloadTourClaimSupportingDocument,
  getTourClaimTableDraftData,
  getlatestclaimtodate,
  formateDate,
  getTravelMode,
  getDraftData,
   getTourClaimFormDetails,
  getAdvance,
 
} from "./claimServices";

const cellStyle = { padding: "8px 12px" };

const initialFormState = {
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
  Total: "",
  Remarks: "",
};


const Test = () => {
 const [editableMode, seteditableMode] = useState(false); // true by default
   const [toggleNewClaim, settoggleNewClaim] = useState(false); // controls form+table visibility
   const [draftData, setDraftData] = useState([]);
   const [travelModeOptions, setTravelModeOptions] = useState([]);
    const [selectedtravelMode,setselectedtravelMode]=useState(null)
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
           const response = await getDraftData();
           if(response.status)
           {
              setDraftData(response.data);
               if (response.data.length == 0) {
                settoggleNewClaim(true);
           }
           }else
           {
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
             if(travelModeData.status)    
               setTravelModeOptions(travelModeData.data);
             } catch (error) {
               console.error("Error fetching tour claim list:", error);
             }
           };
        const fetchAdvanceBalence = async () => {     
          try {
            const advanceblance = await getAdvance();
            setadvance(advanceblance);
    
          } catch (error) {
            console.error("Error in get advancebalace:", error);
          }
          
        };
        fetchAdvanceBalence();
 
       fetchDropdownList()
       fetchDraftData();
     },
     []
   );
 
  const handleDeleteDraft = async (claim_id, status) => {
    let response = await deleteDraftList(claim_id, status);
    if (!response.status) {
      toast.current?.show({
        severity: "error",
        summary: "error",
        detail: response.message,
      });
    } else {
      toast.current?.show({
        severity: "success",
        summary: "Success",
        detail: response.message || "One more draft data deleted",
      });
      setDraftData(response.data);
      if (response.data.length === 0) {
        settoggleNewClaim(true);
        seteditableMode(false);
        settourClaimTableData([]);
        settourclaimformData([]);
      }
    }
  };

  const handleApplyApproval = async (claim_id, status) => {
    try {
      let response = await applyClaim(claim_id, status);
      if (!response.status) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: error?.message,
        });
      } else {
        toast.current?.show({
          severity: "success",
          summary: "Success",
          detail: "You have successfully applied for approval.",
        });
        setDraftData(response.data);
        if (response.data.length === 0) {
          settoggleNewClaim(true);
          seteditableMode(false);
          settourClaimTableData([]);
        }
      }
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to apply: " + (error?.message || error),
      });
    }
  };

  const handleEdit = async (claim_id, travel_id) => {
    try {
      const data = await getTourClaimTableDraftData(claim_id);
      //const travelDropDown = await getTravelDropDown();
      let obj = travelModeOptions;
      const matchedItem = obj.find(item => item.value === data.travel_id);

      if (travel_id === 'Long-Term-Local-Conveyance') {
        setselectedtravelMode(matchedItem);
      } else {
        const travelmode = await getTravelMode(travel_id);
        setselectedtravelMode({ label: travelmode.data, value: travel_id });
      }

      let dates = await getlatestclaimtodate(travel_id);

      settourclaimformData({
        advance: 0,
        claim_id: data.claim_id,
        travel_id: travel_id,
        travelType: data.type,
        destination: data.destination,
        purpose: data.purpose,
        projectName: data.project,
        onAccount: data.account,
        travelfromDate: formateDate(dates[0].travelfromdate),
        claimFromDate: travel_id === 'Long-Term-Local-Conveyance' ? data.from_date : formateDate(dates[0].claimformdate),
        claimToDate: travel_id === 'Long-Term-Local-Conveyance' ? data.to_date : formateDate(dates[0].claimtodate),
        filename: data.filename,
        file_type: data.file_type,
      });

      const formattedRows = data.tourClaimRecords.map((row) => ({
        Date: row.date,
        Lodging: row.lodging,
        Breakfast: row.breakfast,
        Lunch: row.lunch,
        Snacks: row.snacks,
        Dinner: row.dinner,
        "Tea & Water": row.teaWater,
        "Airfare, Bus, Train, Taxi Rental": row.longTravel,
        "Auto, Cab": row.shortTravel,
        "Parking, Toll, Fuel": row.tollTax,
        Incidentals: row.incidentals,
        "Other Business Expenses": row.other,
        Total: row.total,
        Remarks: row.remarks,
      }));

      settourClaimTableData(formattedRows);
      seteditableMode(true);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  const actionBodyTemplateDraft = (rowData) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-pencil"
        className="p-button-sm p-button-text p-button-info"
        onClick={() => handleEdit(rowData.claim_id, rowData.travel_id)}
        tooltip="Edit"
      />
      <Button
        icon="pi pi-trash"
        className="p-button-sm p-button-text p-button-danger"
        onClick={() => handleDeleteDraft(rowData.claim_id, "Cancelled")}
        tooltip="Delete"
      />
      <Button
        icon="pi pi-send"
        label="Apply"
        className="p-button-sm p-button-success p-button-text"
        onClick={() => handleApplyApproval(rowData.claim_id, "Applied")}
        tooltip="Apply for Approval"
      />
    </div>
  );

  const claimCalculationBody = (rowData) => (
    <div className="text-xs space-y-1 flex flex-col justify-center">
      <div><span className="font-bold">Expense:</span> ₹{rowData["total_expense"]}</div>
      <div><span className="font-bold">Advance:</span> ₹{rowData["advance"]}</div>
      <hr />
      {rowData["dueAmount"] ? (
        <div><span className="font-bold">Due:</span> ₹{rowData["dueAmount"]}</div>
      ) : (
        <div><span className="font-bold">Claim:</span> ₹{rowData["amountToBeClaimed"]}</div>
      )}
    </div>
  );

  const tourDetailsBody = (rowData) => (
    <div className="text-xs space-y-1 flex flex-col justify-center">
      <div><span className="font-bold">Destination:</span> {rowData["destination"]}</div>
      <div><span className="font-bold">Purpose:</span> {rowData["purpose"]}</div>
      <div><span className="font-bold">Project:</span> {rowData["project"]}</div>
      <div><span className="font-bold">Type:</span> {rowData["type"]}</div>
    </div>
  );

  const supportingDocumentBody = (rowData) => {
    const [fileUploaded, setFileUploaded] = useState(!!rowData.filename);
    const [togglefileUpload, settogglefileUpload] = useState(!rowData.filename);

    const handleDownloadFile = async (claim_id) => {
      try {
        await downloadTourClaimSupportingDocument(claim_id);
      } catch (error) {
        toast.current?.show({
          severity: "error",
          summary: "error",
          detail: "Something Wrong.",
        });
      }
    };

    const onFileSelect = async (event) => {
      const file = event.files[0];
      setFileUploaded(true);
      settogglefileUpload(false);

      try {
        await uploadSupportingDocuments(file, rowData.claim_id);
        toast.current?.show({
          severity: "success",
          summary: "Success",
          detail: "File Uploaded",
        });
      } catch (error) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Upload failed",
        });
        setFileUploaded(false);
        settogglefileUpload(true);
      }
    };

    return (
      <div className="flex flex-col justify-center mb-2 gap-x-2 gap-y-2">
        {togglefileUpload && (
          <FileUpload
            mode="basic"
            name="file"
            accept="*/*"
            customUpload
            uploadHandler={onFileSelect}
            maxFileSize={1000000}
            chooseLabel="Upload"
          />
        )}
        {fileUploaded && (
          <div>
            <Button
              icon="pi pi-download"
              className="p-button-sm p-button-text p-button-success"
              onClick={() => handleDownloadFile(rowData.claim_id)}
              tooltip={rowData.filename}
            />
            <Button
              icon="pi pi-times"
              className="p-button-sm p-button-text p-button-danger"
              onClick={() => {
                setFileUploaded(false);
                settogglefileUpload(true);
              }}
              tooltip="Cancel"
            />
          </div>
        )}
      </div>
    );
  };

  //table
  const [editingIndex, setEditingIndex] = useState(null);
    const toast = useRef(null);
  
    const calculateTotal = (entry) => {
      const keys = Object.keys(initialFormState).filter(
        (k) => k !== "Date" && k !== "Remarks"
      );
      return keys.reduce((sum, key) => sum + (parseFloat(entry[key]) || 0), 0);
    };
  
    const hasDuplicateDatesOrZeroTotal = (data) => {
      const seen = new Set();
      for (let row of data) {
        const date = row["Date"];
        const total = parseFloat(row["Total"]) || 0;
        if (!date) continue;
        if (seen.has(date))
          return { hasIssue: true, reason: "Duplicate date found" };
        seen.add(date);
        if (total === 0)
          return { hasIssue: true, reason: "Total amount is zero" };
      }
      return { hasIssue: false };
    };
  
    const handleChangeTable = (e, rowIndex) => {
      const { name, value } = e.target;
      const updatedData = [...tourClaimTableData];
      updatedData[rowIndex] = {
        ...updatedData[rowIndex],
        [name]: value,
      };
      // updatedData[rowIndex]["Total"] = calculateTotal(updatedData[rowIndex]);
      settourClaimTableData(updatedData);
    };
  
    const handleDateChange = (e, rowIndex) => {
      const updatedData = [...tourClaimTableData];
      updatedData[rowIndex]["Date"] = formateDate(e.value); //e.value?.toISOString().split("T")[0] || "";
      settourClaimTableData(updatedData);
    };
  
    const openEditMode = (index) => {
      const updatedData = [...tourClaimTableData];
      updatedData[index]["Total"] = 0; // Reset only the Total
      settourClaimTableData(updatedData);
      setEditingIndex(index);
    };
  
    const handleDelete = (index) => {
      const updated = tourClaimTableData.filter((_, i) => i !== index);
      settourClaimTableData(updated);
      setEditingIndex(null);
    };
  
    const handleAddRow = () => {
      settourClaimTableData([
        ...tourClaimTableData,
        { ...initialFormState, Total: 0 },
      ]);
      setEditingIndex(tourClaimTableData.length);
    };
  
    const onFileSelect = (event) => {
      const file = event.files[0];
      const reader = new FileReader();
  
      reader.onload = (e) => {
        const bstr = e.target.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
  
        const headerRowIndex = 15;
        const headers = XLSX.utils.sheet_to_json(worksheet, {
          range: headerRowIndex,
          header: 1,
        })[0];
  
        settourclaimFormLabeData({
          destination: worksheet["C12"]?.v || "",
          purposeOfTrip: worksheet["C13"]?.v || "",
          projectName: worksheet["J9"]?.v || "",
          onAccount: worksheet["J10"]?.v || "",
          fromDate: formateDate(worksheet["J11"]?.v),
          toDate: formateDate(worksheet["J12"]?.v),
        });
  
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          range: 15,
          header: headers,
          defval: "",
        });
  
        const validatedData = [];
        const existingDates = new Set(tourClaimTableData.map((r) => r["Date"]));
        let skippedRows = 0;
  
        jsonData.forEach((row) => {
          const formattedRow = { ...initialFormState };
          let isValid = true;
  
          for (const key of Object.keys(initialFormState)) {
            const value = row[key];
            if (key === "Date") {
              const parsedDate = formateDate(value);
              if (!parsedDate || existingDates.has(parsedDate)) {
                isValid = false;
                break;
              }
              formattedRow[key] = parsedDate;
              existingDates.add(parsedDate);
            } else {
              const num = parseFloat(value);
              formattedRow[key] = !isNaN(num) ? num : 0;
            }
          }
  
          if (isValid) {
            formattedRow["Total"] = calculateTotal(formattedRow);
            validatedData.push(formattedRow);
          } else {
            skippedRows++;
          }
        });
  
        settourClaimTableData((prev) => [...prev, ...validatedData]);
  
        toast.current?.show({
          severity: "info",
          summary: "Import Result",
          detail: `${validatedData.length} row(s) imported. ${skippedRows} skipped.`,
        });
      };
  
      reader.readAsBinaryString(file);
    };
  
    const handleSaveToDraft = async () => {
      try {
        const response = await savetodraft(tourclaimformData, tourClaimTableData);
        //   if (response?.success) {
        if(!response.status)
        {
           toast.current.show({
              severity: "error",
              summary: "error",
              detail: response.message,
            });
        }else{
           toast.current.show({
              severity: "success",
              summary: "success",
              detail: response.message,
            });
        setDraftData(response.data);
        seteditableMode(false);
        settoggleNewClaim(false);
       
      }
       
       
      } catch (error) {
        toast.current.show({ severity: "error", summary: "error", detail: error?.message });
        console.log(error);
      }
    };
  
    const handleUpdate = async () => {
      try {
        const response = await updateDraftdata(
          tourclaimformData,
          tourClaimTableData,
          tourclaimformData.claim_id
        );
        if(!response.status)
        {
           toast.current.show({
              severity: "error",
              summary: "error",
              detail: response.message,
            });
        }else
        {
          toast.current.show({
              severity: "success",
              summary: "Success",
              detail: response.message,
            });
        setDraftData(response.data);
        seteditableMode(false);
         
        }
      } catch (error) {
        toast.current.show({ severity: "error", summary: "", detail: error });
        console.log(error);
      }
    };
    const renderCell = (rowData, field, rowIndex) => {
      if (editingIndex === rowIndex) {
        if (field === "Date") {
          return (
            <Calendar
              value={rowData["Date"] ? new Date(rowData["Date"]) : null}
              onChange={(e) => handleDateChange(e, rowIndex)}
              dateFormat="yy-mm-dd"
              showIcon
              className="p-inputtext-sm w-full"
                minDate={
      tourclaimformData.claimFromDate
        ? new Date(tourclaimformData.claimFromDate)
        : null
    }
    maxDate={
      tourclaimformData.claimToDate
        ? new Date(tourclaimformData.claimToDate)
        : null
    }
            />
          );
        } else if (field == "Remarks") {
          return (
            <InputText
              name={field}
              value={rowData[field] || ""}
              onChange={(e) => handleChangeTable(e, rowIndex)}
              className="p-inputtext-sm w-full"
            />
          );
        } else if (field == "Total") {
          return (
            <InputText
              name={field}
              value={rowData[field] || ""}
              onChange={(e) => handleChangeTable(e, rowIndex)}
              className="p-inputtext-sm w-full"
              disabled
            />
          );
        }
  
        return (
          <InputText
            name={field}
            value={rowData[field] || ""}
            onChange={(e) => handleChangeTable(e, rowIndex)}
            onKeyPress={(e) => {
              const key = e.key;
              const currentValue = rowData[field] || "";
  
              // Allow digits and a single dot
              if (!/[\d.]/.test(key)) {
                e.preventDefault();
              }
  
              // Prevent more than one dot
              if (key === "." && currentValue.includes(".")) {
                e.preventDefault();
              }
            }}
            onPaste={(e) => {
              const paste = e.clipboardData.getData("text");
              // Allow only valid float numbers
              if (!/^\d*\.?\d*$/.test(paste)) {
                e.preventDefault();
              }
            }}
            className="p-inputtext-sm w-full"
          />
        );
      }
      return <span>{rowData[field]}</span>;
    };
  
    const actionBodyTemplateTable = (row, { rowIndex }) => (
      <div className="flex gap-2">
        {editingIndex === rowIndex ? (
          <Button
            icon="pi pi-check"
            className="p-button-sm p-button-success"
            onClick={() => {
              // const result = hasDuplicateDatesOrZeroTotal(tourClaimTableData);
              // if (result.hasIssue) {
              //   toast.current?.show({
              //     severity: "warn",
              //     summary: "Validation Warning",
              //     detail: result.reason,
              //   });
              //   return;
              // }
  
              const updated = [...tourClaimTableData];
              updated[editingIndex]["Total"] = calculateTotal(
                updated[editingIndex]
              );
              settourClaimTableData(updated);
              setEditingIndex(null);
            }}
          />
        ) : (
          <Button
            icon="pi pi-pencil"
            className="p-button-sm p-button-text p-button-info"
            onClick={() => openEditMode(rowIndex)}
          />
        )}
        <Button
          icon="pi pi-trash"
          className="p-button-sm p-button-text p-button-danger"
          onClick={() => handleDelete(rowIndex)}
        />
      </div>
    );
  
    const fields = Object.keys(initialFormState);
    const handleDownloadFile = async () => {
      try {
        let d = await downloadTourClaimExpanseDocument(
         
        );
      } catch (error) {
        console.log(error);
      }
    };


    //form

     
      const [advance, setadvance] = useState(null);
      const [isFormExpanded, setIsFormExpanded] = useState(true);
      const handleChange = (field, value) => {   
          settourclaimformData((prev) => ({ ...prev, [field]: value }));
      };
    
      const fetchTourClaimFormDetails = async (id) => {
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
            const data = await getTourClaimFormDetails(id);
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
    
     
    
    //   useEffect(() => {
    //     const fetchAdvanceBalence = async () => {     
    //       try {
    //         const advanceblance = await getAdvance();
    //         setadvance(advanceblance);
    
    //       } catch (error) {
    //         console.error("Error in get advancebalace:", error);
    //       }
          
    //     };
    //     fetchAdvanceBalence();
    //   }, []);
    
     
  

  return (
    <div>
      <Toast ref={toast} />

      {/* draft */}
      {draftData.length > 0 && !toggleNewClaim && !editableMode && (
      <div>
        <DataTable
          value={draftData}
          showGridlines
          paginator
          rows={10}
          className="text-xs"
          tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
        >
          <Column field="claim_id" header="Claim Id" headerStyle={cellStyle} bodyStyle={cellStyle} sortable filter />
          <Column field="travel_id" header="Travel ID" headerStyle={cellStyle} bodyStyle={cellStyle} sortable filter />
          <Column field="to_date" header="To" headerStyle={cellStyle} bodyStyle={cellStyle} sortable filter />
          <Column field="account" header="On Account" headerStyle={cellStyle} bodyStyle={cellStyle} sortable filter />
          <Column header="Tour Details" body={tourDetailsBody} headerStyle={cellStyle} bodyStyle={{ ...cellStyle, whiteSpace: "pre-line" }} sortable filter />
          <Column header="Claim Calculation" body={claimCalculationBody} headerStyle={cellStyle} bodyStyle={{ ...cellStyle, whiteSpace: "pre-line" }} sortable filter />
          <Column header="Upload Supporting Document" body={supportingDocumentBody} headerStyle={cellStyle} bodyStyle={{ ...cellStyle, whiteSpace: "pre-line" }} sortable filter />
          <Column header="Action" body={actionBodyTemplateDraft} headerStyle={{ ...cellStyle, textAlign: "center" }} bodyStyle={{ ...cellStyle, textAlign: "center" }} sortable filter />
        </DataTable>
      </div>
      )}
        {editableMode || toggleNewClaim ? (
      <>
      {/* form */}
      <div>
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
                          onChange={(e) =>  handleChange("claimToDate", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
      </div>

      {/* table */}
      <div>
         <>
              <Toast ref={toast} />
              <div className="flex justify-end mb-2 gap-2">
                <FileUpload
                  mode="basic"
                  name="file"
                  accept=".xls,.xlsx"
                  customUpload
                  uploadHandler={onFileSelect}
                  maxFileSize={1000000}
                  chooseLabel="Upload"
                />
                <Button
                  // label="Add Row"
                  icon="pi pi-plus"
                  className="p-button-sm "
                  onClick={handleAddRow}
                  tooltip="Add Row"
                />
                <Button
                  icon="pi pi-file-export"
                  className="p-button-sm"
                  onClick={() => {
                    handleDownloadFile();
                  }}
                  tooltip="Export Excel"
                />
              </div>
        
              <DataTable
                value={tourClaimTableData}
                  showGridlines
                scrollable
                scrollHeight="250px"
                className="text-xs"
                tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
              >
                {fields.map((field) => (
                  <Column
                    key={field}
                    header={field}
                    body={(rowData, options) =>
                      renderCell(rowData, field, options.rowIndex)
                    }
                    headerStyle={{
                      ...cellStyle,
                      width: field === "Date" ? "100px" : undefined, // wider width for Date
                    }}
                    bodyStyle={{
                      ...cellStyle,
                      width: field === "Date" ? "100px" : undefined,
                    }}
                  />
                ))}
                <Column
                  header="Action"
                  body={actionBodyTemplateTable}
                  headerStyle={cellStyle}
                  bodyStyle={cellStyle}
                />
              </DataTable>
        
              <div className="flex justify-center mt-4">
                {editableMode ? (
                  <div className="flex gap-2">
                    <Button
                      label="Update"
                      icon="pi pi-save"
                      className="p-button-sm"
                      onClick={() => {
                        const result = hasDuplicateDatesOrZeroTotal(tourClaimTableData);
                        if (result.hasIssue) {
                          toast.current?.show({
                            severity: "warn",
                            summary: "Validation Warning",
                            detail: result.reason,
                          });
                        } else {
                          handleUpdate();
                          toast.current.show({
                            severity: "success",
                            summary: "Updated",
                            detail: "Tour claim updated!",
                          });
                        }
                      }}
                    />
                    <Button
                      label="Home"
                      icon="pi pi-home"
                      onClick={() => {
                        seteditableMode(false);
                      }}
                      className="p-button-sm"
                    />
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      label="Save to Draft"
                      icon="pi pi-save"
                      className="p-button-sm"
                      onClick={() => {
                        const result = hasDuplicateDatesOrZeroTotal(tourClaimTableData);
                        if (result.hasIssue) {
                          toast.current?.show({
                            severity: "warn",
                            summary: "Validation Warning",
                            detail: result.reason,
                          });
                          return;
                        }
                        handleSaveToDraft();
                      }}
                    />
        
                    <Button
                      label="Home"
                      icon="pi pi-home"
                      onClick={() => {
                        seteditableMode(false);
                        settoggleNewClaim(false);
                      }}
                      className="p-button-sm"
                    />
                  </div>
                )}
              </div>
            </>
      </div>
      
      </>
       ) : (
                ""
              )}
    </div>
  );
};

export default Test;
