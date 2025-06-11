import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
//Call Api
import {
  getAdvanceDetails,
  getMyFormParticularRequisitionId,
  getApprovedAndSettledAndCompleteRequestedData,
  updateTravelRequisition2,
  uploadDocumentsByReqId,
  downloadDocumentsByReqId
} from "./TravelDeskAPI";
import { getUserData } from "../Login/Encrypt";
import { FilterMatchMode } from "primereact/api";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import RequisitionFormView from "./RequisitionFormView";
import { Chip, IconButton } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import VisibilityIcon from "@mui/icons-material/Visibility";
const cellStyle = { padding: "12px 16px" };
import { FileUpload } from "primereact/fileupload";
import {Button} from "primereact/button"

const ApprovedTable = () => {
  const [expandedRows, setExpandedRows] = useState(!null);

  const [visible, setVisible] = useState(false);
  const toast = useRef();
  const [editRowId, setEditRowId] = useState(null);
  const [approvedAndSettledTravelData, setApprovedAndSettledTravelData] =
    useState([]);
  const [newAdvanceAmount, setNewAdvanceAmount] = useState(0.0);
  const [approvedAndSettledFilters, setApprovedAndSettledFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    date: { value: null, matchMode: FilterMatchMode.CONTAINS },
    userName: { value: null, matchMode: FilterMatchMode.CONTAINS },
    empCode: { value: null, matchMode: FilterMatchMode.CONTAINS },
    projectName: { value: null, matchMode: FilterMatchMode.CONTAINS },
    unsettledAmount: { value: null, matchMode: FilterMatchMode.CONTAINS },
    advanceRequested: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const [completedGlobalFilterValue, setCompletedGlobalFilterValue] =
    useState("");
  const [
    approvedAndSettledGlobalFilterValue,
    setApprovedAndSettledGlobalFilterValue,
  ] = useState("");
  // function mergeTravelData(mergedData, dummydataJson) {
  //     const dataMap = new Map();

  //     // Create a lookup map for dummydata
  //     dummydataJson.forEach((entry) => {
  //       dataMap.set(entry.userId.toLowerCase(), {
  //         unsettledAmount: parseFloat(entry.unsettledAmount),
  //         claimUnderProcess: entry.claimUnderProcess,
  //       });
  //     });

  //     // Merge dummydata into dummyobj
  //     const merged = mergedData.map((entry) => {
  //       const match = dataMap.get(entry.user_id.toLowerCase());
  //       return {
  //         ...entry,
  //         unsettledAmount: match ? match.unsettledAmount : 0.0,
  //         claimUnderProcess: match ? match.claimUnderProcess : 0,
  //       };
  //     });

  //     return merged;
  //   }
  const [rowData, setRowData] = useState({});

  //const rowExpansionTemplate = (rowData) => (

  const rowExpansionTemplate = (rowData) => {
    
    const handleSaveAdvance = async(row) => {
     // let updatedExpandableData = null;
    try{
      let updatedData={...row,advance: newAdvanceAmount}
     let responseData=  await updateTravelRequisition2(        
          updatedData,
          updatedData.travelId,
          'Settled'
        );

      if(responseData.status)
      {
       
         const response =
          await getApprovedAndSettledAndCompleteRequestedData();
      setApprovedAndSettledTravelData(response.data);
      setEditRowId(null);
      toast.current?.show({
            severity: "success",
            summary: "Success",
            detail: responseData.message,
          });
         
     }else{
     
          toast.current?.show({
            severity: "error",
            summary: "error",
            detail: responseData.message,
          });
      
    }
    }catch(error)
    {
       toast.current?.show({
            severity: "error",
            summary: "error",
            detail: error?.message,
          });
    }
      
     
    };

    const handleCancelAdvance = (row) => {
      setEditRowId(null);
      setNewAdvanceAmount(row.advance);
    };

    const setAdvanceActions = (row) => {
      if (editRowId === row.requisionId && !row.claimUnderProcess && row.status==="Approved") {
        return (
          <>
            <IconButton
              aria-label="Save"
              size="small"
              color="success"
              onClick={() => handleSaveAdvance(row)}
            >
              <SaveIcon />
            </IconButton>
            <IconButton
              aria-label="Cancel"
              size="small"
              color="error"
              onClick={() => handleCancelAdvance(row)}
            >
              <CancelIcon />
            </IconButton>
          </>
        );
      }


      if (!row.claimUnderProcess && row.status==="Approved") {
        return (
          <IconButton
            aria-label="Edit"
            label="View"
            onClick={() => {
              setEditRowId(row.requisionId);
              setNewAdvanceAmount(row.advance);
            }}
          >
            <EditIcon />
          </IconButton>
        );
      }else 
      if(row.claimUnderProcess)
      {
       return <h3>Pending Unsettled Claim</h3>;
      }
      else{
       
      }
    };

    const supportingDocumentBody = (rowData) => {
        // const [fileUploaded, setFileUploaded] = useState(
        //   rowData.filename ? true : false
        // );
        // const [togglefileUpload, settogglefileUpload] = useState(
        //   rowData.filename ? false : true
        // );
        const handleDownloadFile = async (requisionId) => {
          try {
            let d = await downloadDocumentsByReqId(requisionId);
          } catch (error) {
            toast.current?.show({
              severity: "error",
              summary: "error",
              detail: "Something Wrong.",
            });
          }
        };
        // const onFileSelect = async (event) => {
        //   const file = event.files[0]; // Get the uploaded file
         
        //   const formData = new FormData();
        //   formData.append("file", file); // Append file to formData
    
        //   try {
        //     const response = await uploadDocumentsByReqId(
        //       file,
        //       rowData.requisionId
        //     ); // Adjust this call accordingly
        //     if(response.status)
        //     {
        //       setFileUploaded(true);
        //   settogglefileUpload(false);
          

          
    
        //     toast.current?.show({
        //       severity: "success",
        //       summary: "Success",
        //       detail: "File Uploaded",
        //     });
        //   }else{
        //       toast.current?.show({
        //       severity: "error",
        //       summary: "Error",
        //       detail: response.message,
        //     });
        //   }
        //   } catch (error) {
        //     toast.current?.show({
        //       severity: "error",
        //       summary: "Error",
        //       detail: "Upload failed",
        //     });
        //     console.log(error);
        //     setFileUploaded(false);
        //     settogglefileUpload(true);
        //   }
        // };
        return (
        <Button
                icon="pi pi-download"
                className="p-button-sm p-button-text p-button-success"
                onClick={() => {
                  handleDownloadFile(rowData.requisionId);
                }}
                 disabled={rowData.file_name == null}
                tooltip={`${rowData.file_name}`}
              />
        );
      };

    return (
      <DataTable
        value={rowData.expandableData}
        showGridlines
        dataKey="requisionId"
        className="text-xs"
        tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
      >
        {/* <Column field="requisionId" header="Requisition ID" /> */}
        <Column field="date" header="Date" />
        <Column field="advanceRequested" header="Advance Requested" />
        <Column field="status" header="Status" />
        <Column
          body={advanceColumnBody}
          header="Advance Given"
          headerStyle={{ textAlign: "center" }}
          style={{ textAlign: "center" }}
        />
        <Column
          body={setAdvanceActions}
          header="Set Advance"
          headerStyle={{ textAlign: "center" }}
          style={{ textAlign: "center" }}
        />
        <Column
          body={(rowData) => (
            <IconButton
              aria-label="View"
              onClick={() => handelShowRequisitionForm(rowData.requisionId)}
            >
              <VisibilityIcon />
            </IconButton>
          )}
          header="View"
          headerStyle={{ textAlign: "center" }}
          style={{ textAlign: "center" }}
        />

          <Column
                    header="Download Document"
                    body={supportingDocumentBody}
                    headerStyle={cellStyle}
                    bodyStyle={{ ...cellStyle, whiteSpace: "pre-line" }}
                    sortable
                    filter
                  />
      </DataTable>
    );
  };

  useEffect(() => {
    const fetchApprovedAndSettledTravelData = async () => {
      try {
        // const { token } = getUserData();

        // const advancedData = await getAdvanceDetails();

        const approvedandsettledresponse =
          await getApprovedAndSettledAndCompleteRequestedData();

        if (!approvedandsettledresponse.status) {
          toast.current?.show({
            severity: "error",
            summary: "error",
            detail: approvedandsettledresponse.message,
          });
        }

        // const cleanedData = approvedAndSettledMergedData.data.map((item) => {
        //   const { unsettledAmount, ...rest } = item;
        //   console.log("unsettledAmount ::: ", unsettledAmount);
        //   return rest;
        // });

        // const finalData = mergeTravelData(cleanedData, advancedData.data);
        setApprovedAndSettledTravelData(approvedandsettledresponse.data);
      } catch (error) {
        console.error("Error fetching travel data:", error);
      }
    };

    fetchApprovedAndSettledTravelData();
  }, []);

  // const approvedAndSettledOnGlobalFilterChange = (e) => {
  //   const value = e.target.value;
  //   let _approvedAndSettledFilters = { ...approvedAndSettledFilters };

  //   _approvedAndSettledFilters["global"].value = value;

  //   setApprovedAndSettledFilters(_approvedAndSettledFilters);
  //   setApprovedAndSettledGlobalFilterValue(value);
  // };

  const handelShowRequisitionForm = async (requisionId) => {
    // console.log("clickrequisionId", requisionId);
    //Dialog visible set
    setVisible(true);
    const { token } = getUserData();
    const response = await getMyFormParticularRequisitionId(token, requisionId);
    setRowData(response?.data);
  };

  // const renderHeaderForApprovedAndSettledTravelData = () => {
  //   const tabItems = [{ label: "Approved Travels Table" }];
  //   return (
  //     <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
  //       <InputText
  //         value={approvedAndSettledGlobalFilterValue}
  //         onChange={approvedAndSettledOnGlobalFilterChange}
  //         placeholder="Keyword Search"
  //         className="w-full sm:w-auto"
  //       />
  //     </div>
  //   );
  // };
  // const approvedAndSettledTravelDataHeader =
  //   renderHeaderForApprovedAndSettledTravelData();

  const advanceColumnBody = (row) => {
    if (editRowId === row.requisionId) {
      return (
        <InputText
          size="small"
          value={newAdvanceAmount}
          onChange={(e) => setNewAdvanceAmount(e.target.value)}
        />
      );
    }
    return row.advance;
  };

  // const updateTravelRequisitionStatus = async (rowData, statusName) => {
  //   try {
  //     //console.log('updateTravelRequisitionStatus : rowData : ', rowData)
  //     const { token } = getUserData();
  //     const updateTravelRequisitionStatusResponse =
  //       await updateTravelRequisition(
  //         token,
  //         rowData,
  //         rowData.travelId,
  //         statusName
  //       );

  //     toast.current.show({
  //       severity: "success",
  //       summary: "Success",
  //       detail: "You have successfully applied for approval.",
  //     });
  //     // console.log(
  //     //   "updateTravelRequisitionStatusResponse :=:=>> ",
  //     //   updateTravelRequisitionStatusResponse
  //     // );
  //   } catch (error) {
  //     toast.current.show({
  //       severity: "error",
  //       summary: "error",
  //       detail: error.message,
  //     });
  //   }
  // };

  const completeTravel=async(rowData)=>{
   //  let updatedData={...row,advance: newAdvanceAmount}
     let responseData=  await updateTravelRequisition2(        
          rowData,
          rowData.travelId,
          'CompleteRequested'
        );
     if(responseData.status)
     {
      let response=  await getApprovedAndSettledAndCompleteRequestedData()
      setApprovedAndSettledTravelData(response.data);
     // setEditRowId(null);
      toast.current?.show({
            severity: "success",
            summary: "Success",
            detail: responseData.message,
          });

      // Optionally reset newAdvanceAmount
     }
      else{
    toast.current?.show({
            severity: "error",
            summary: "error",
            detail: responseData.message,
          });
     }
  }

  const checkBody=(rowData)=>{
        return(
      <Button
        icon="pi pi-check"
        className="p-button-sm p-button-text p-button-success"
          onClick={() => {
          completeTravel(rowData.expandableData[0], "CompleteRequested");
          }}
          tooltip="Complete Travel"
        disabled={rowData.requestCompletedFlag === false}
        />
      // <span>Hii</span>
        )
        
    }

  return (
    <>
      <div className="px-4 mx-auto max-w-[85rem] lg:px-12">
        <Toast ref={toast} />
        <DataTable
          value={approvedAndSettledTravelData}
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionMode="single"
          rowExpansionTemplate={rowExpansionTemplate}
          showGridlines
          className="text-xs"
          tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
          paginator
          size="small"
          rows={10}
          // rowsPerPageOptions={
          //   approvedAndSettledTravelData.length > 50
          //     ? [5, 10, 25, 50, approvedAndSettledTravelData.length]
          //     : approvedAndSettledTravelData.length > 25 &&
          //       approvedAndSettledTravelData.length < 50
          //     ? [5, 10, 25, approvedAndSettledTravelData.length]
          //     : approvedAndSettledTravelData.length > 10 &&
          //       approvedAndSettledTravelData.length < 25
          //     ? [5, 10, approvedAndSettledTravelData.length]
          //     : approvedAndSettledTravelData.length > 5 &&
          //       approvedAndSettledTravelData.length < 10
          //     ? [5, approvedAndSettledTravelData.length]
          //     : [5]
          // }
         // paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
        //  currentPageReportTemplate="{first} to {last} of {totalRecords}"
          dataKey="travelId"
         // filters={approvedAndSettledFilters}
          // globalFilterFields={[
          //   "date",
          //   "userName",
          //   "empCode",
          //   "projectName",
          //   "unsettledAmount",
          //   "advanceRequested",
          // ]}
       //   header={approvedAndSettledTravelDataHeader}
          emptyMessage="No data found."
        //  removableSort
        //  sortMode="multiple"

        //   rowClassName={(rowData) => {
        //   if (rowData[0].status == "Applied") return "bg-cyan-50";
        //   if (rowData[0].status == "Reviewing") return "bg-green-50";
        // }}
        >
          {/* <Column
              field="date"
              header="Date"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
              sortable
              filter
            /> */}
          <Column expander style={{ width: "3rem" }} />
{/* 
          <Column
            field="travelId"
            header="travelId"
            headerStyle={{ textAlign: "center" }}
            style={{ textAlign: "center" }}
            sortable
            filter
          /> */}
          <Column
            field="userName"
            header="Name"
            headerStyle={{ textAlign: "center" }}
            style={{ textAlign: "center" }}
            sortable
            filter
          />
          <Column
            field="fromDate"
            header="From Date"
            headerStyle={{ textAlign: "center" }}
            style={{ textAlign: "center" }}
            sortable
            filter
          />
          <Column
            field="tentativeToDate"
            header="Tentative To Date"
            headerStyle={{ textAlign: "center" }}
            style={{ textAlign: "center" }}
            sortable
            filter
          />

          <Column
            field="empCode"
            header="Employee Code"
            headerStyle={{ textAlign: "center" }}
            style={{ textAlign: "center" }}
            sortable
            filter
          />

          <Column
            field="purpose"
            header="Purpose"
            headerStyle={{ textAlign: "center" }}
            // headerClassName="center-header"
            style={{ textAlign: "center" }}
            sortable
            filter
          />
          <Column
            field="projectName"
            header="Project Name"
            headerStyle={{ textAlign: "center" }}
            // headerClassName="center-header"
            style={{ textAlign: "center" }}
            sortable
            filter
          />

          <Column
            field="localityArea"
            header="Locality/Area"
            headerStyle={{ textAlign: "center" }}
            // headerClassName="center-header"
            style={{ textAlign: "center" }}
            sortable
            filter
          />
          <Column
            field="city"
            header="City"
            headerStyle={{ textAlign: "center" }}
            // headerClassName="center-header"
            style={{ textAlign: "center" }}
            sortable
            filter
          />
          <Column
            field="typeOfTravel"
            header="Type Of Travel"
            headerStyle={{ textAlign: "center" }}
            // headerClassName="center-header"
            style={{ textAlign: "center" }}
            sortable
            filter
          />

          <Column
            field="unsettledAmount"
            header="Total Unsettled Amount"
            headerStyle={{ textAlign: "center" }}
            style={{ textAlign: "center" }}
            sortable
            filter
          />

          {/* <Column
              body={advanceColumnBody}
              header="Advance Given"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
            /> */}
          {/* <Column
              body={(rowData) => {
                return (
                  <Chip
                    label={rowData.status}
                    size="medium"
                    color={
                      rowData.status.toLowerCase() === "approved" ||
                      rowData.status.toLowerCase() === "completed"
                        ? "success"
                        : "warning"
                    }
                  />
                );
              }}
              header="Status"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
            /> */}
          {/* <Column
              body={(rowData) => {
                return (
                  <IconButton
                    aria-label="View"
                    onClick={() => {
                      handelShowRequisitionForm(rowData.requisionId);
                    }}
                  >
                    <VisibilityIcon />
                  </IconButton>
                );
              }}
              header="View"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
            /> */}
          {/* <Column
                body={setAdvanceActions}
                header="Set Advance"
                headerStyle={{ textAlign: "center" }}
                style={{ textAlign: "center" }}
              /> */}

          <Column body={checkBody} header="Complete Travel"></Column>
          {/* <Column
            body={(rowData) => {
              return (
                !rowData.requestCompletedFlag?(
                <IconButton
                  aria-label="Complete"
                  onClick={() => {
                    completeTravel(rowData.expandableData[0],"CompleteRequested")
                    // updateTravelRequisitionStatus(
                    //   rowData.expandableData[0],
                    //   "CompleteRequested"
                    // );
                  }}
                 // disabled={rowData.requestCompletedFlag}
                >
                  <CheckIcon />
                </IconButton>):(<span>''</span>)
              );
            }}
            header="Travel Complete"
            headerStyle={{ textAlign: "center" }}
            style={{ textAlign: "center" }}
          /> */}
        </DataTable>
        <Dialog
          header="Requisition Form View"
          visible={visible}
          style={{ width: "70rem" }}
          onHide={() => {
            if (!visible) return;
            setVisible(false);
          }}
        >
          <h2>Requisition Form View</h2>
          <RequisitionFormView rowData={rowData} />
        </Dialog>
      </div>
    </>
  );
};

export default ApprovedTable;
