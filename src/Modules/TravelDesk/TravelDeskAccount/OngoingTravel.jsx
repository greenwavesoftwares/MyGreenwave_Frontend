import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import {
  DataTableComponent,
  CustomColumn,
  ExpandableDataTableComponent,
} from "../../../components/DataTable/DataTableComponent";
import CustomDialog from "../../../components/Dialog/DialogComponent";
import { ProgressBarComponent } from "../../../components/ProgressBar/ProgressBarComponent";
//Call Api
import {
  getAdvanceDetails,
  getMyFormParticularRequisitionId,
  getOngoingTravelData,
  updateTravelRequisition2,
  downloadDocumentsByReqId,
  uploadDocumentsByReqId,
} from "../TravelDeskAPI";
import { getUserData } from "../../Login/Encrypt";
import { FilterMatchMode } from "primereact/api";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import RequisitionFormView from "../RequisitionFormView";
import { Chip, IconButton } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import VisibilityIcon from "@mui/icons-material/Visibility";
// import { Button } from "primereact/button";
import CustomButton from "../../../components/Button/Button";
const cellStyle = { padding: "8px 12px" };
import { FileUpload } from "primereact/fileupload";
// import { ProgressBar } from "primereact/progressbar";

const OngoingTravel = () => {
  const [loader, setLoader] = useState(false);

  const [expandedRows, setExpandedRows] = useState(!null);

  const [visible, setVisible] = useState(false);
  const toast = useRef();
  const [editRowId, setEditRowId] = useState(null);
  const [ongoingtravelData, setongoingtravelData] = useState([]);
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

  const [rowData, setRowData] = useState({});

  const rowExpansionTemplate = (rowData) => {
    console.log("test", rowData.checkAtleastOneManagerReviewed);

    const supportingDocumentBody = (rowData) => {
      const [fileUploaded, setFileUploaded] = useState(
        rowData.file_name ? true : false
      );
      const [togglefileUpload, settogglefileUpload] = useState(
        rowData.file_name ? false : true
      );
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
      const onFileSelect = async (event) => {
        const file = event.files[0]; // Get the uploaded file
        setFileUploaded(true);
        settogglefileUpload(false);
        const formData = new FormData();
        formData.append("file", file); // Append file to formData

        try {
          const response = await uploadDocumentsByReqId(
            file,
            rowData.requisionId
          ); // Adjust this call accordingly
          if (response.message === "File uploaded successfully") {
            toast.current?.show({
              severity: "success",
              summary: "Success",
              detail: response.message,
            });
          } else {
            toast.current?.show({
              severity: "error",
              summary: "Error",
              detail: response.message,
            });
          }
        } catch (error) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Upload failed",
          });
          console.log(error);
          setFileUploaded(false);
          settogglefileUpload(true);
        }
      };
      return (
        <div className="flex flex-col justify-center mb-2 gap-x-2 gap-y-2">
          {togglefileUpload ? (
            <FileUpload
              mode="basic"
              name="file"
              accept="*/*"
              customUpload
              uploadHandler={onFileSelect}
              maxFileSize={1000000}
              chooseLabel="Upload"
            />
          ) : null}

          {fileUploaded && (
            <div>
              <CustomButton
                icon="pi pi-download"
                className="p-button-sm p-button-text p-button-success"
                onClick={() => {
                  handleDownloadFile(rowData.requisionId);
                }}
                tooltip={`${rowData.file_name}`}
              />
              <CustomButton
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

    const actionbody = (rowData) => {
      //   if (!rowData.checkAtleastOneManagerReviewed) {
      //     return <span>Not eligible</span>
      //   }

      // const [reason, setReason] = useState("");
      // const [settlementAmount, setSettlementAmount] = useState("");
      const handleApproveSubmit = async () => {
        try {
          const responseData = await updateTravelRequisition2(
            rowData,
            rowData.travelId,
            "Approved"
          );
          if (responseData.status) {
            let response = await getOngoingTravelData();
            setongoingtravelData(response.data);
            // setreviewedtourclaimData(response.data);
            toast.current.show({
              severity: "success",
              summary: "success",
              detail: "Approved",
            });
          } else {
            toast.current.show({
              severity: "error",
              summary: "Error",
              detail: responseData.message,
            });
          }
        } catch (error) {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: error?.message,
          });
        }
      };

      const handleSubmitReject = async () => {
        try {
          const response = await updateTravelRequisition2(
            rowData,
            rowData.travelId,
            "Rejected"
          ); //await RejectTourClaim(rowData.claim_id, "Rejected");
          if (response.status) {
            let response = await getOngoingTravelData();
            setongoingtravelData(response.data);
            toast.current.show({
              severity: "success",
              summary: "success",
              detail: "Rejected",
            });
          } else {
            toast.current.show({
              severity: "error",
              summary: "Error",
              detail: response.message,
            });
          }
        } catch (error) {}
      };

      return (
        <div className="flex gap-2">
          {rowData.status === "ManagerReviewed" ? (
            <>
              <CustomButton
                label="Approve"
                size="small"
                severity="success"
                onClick={() => handleApproveSubmit()}
              />
              <CustomButton
                label="Reject"
                size="small"
                severity="danger"
                onClick={() => handleSubmitReject()}
              />
            </>
          ) : (
            <span className="text-gray-500 italic">Action Taken</span>
          )}
        </div>
      );
    };

    // const handleSaveAdvance = async (row) => {
    //   let updatedData = { ...row, advance: newAdvanceAmount };
    //   let response = await updateTravelRequisition(
    //     updatedData,
    //     updatedData.travelId,
    //     "Settled"
    //   );

    //   if (!response.status) {
    //     toast.current?.show({
    //       severity: "error",
    //       summary: "error",
    //       detail: response.message,
    //     });
    //   } else {
    //     setApprovedAndSettledTravelData(response.data);
    //     setEditRowId(null);
    //     toast.current?.show({
    //       severity: "success",
    //       summary: "Success",
    //       detail: response.message,
    //     });
    //   }
    // };

    // const handleCancelAdvance = (row) => {
    //   setEditRowId(null);
    //   setNewAdvanceAmount(row.advance);
    // };

    // const setAdvanceActions = (row) => {
    //   if (
    //     editRowId === row.requisionId &&
    //     !row.claimUnderProcess &&
    //     row.status === "Approved"
    //   ) {
    //     return (
    //       <>
    //         <IconButton
    //           aria-label="Save"
    //           size="small"
    //           color="success"
    //           onClick={() => handleSaveAdvance(row)}
    //         >
    //           <SaveIcon />
    //         </IconButton>
    //         <IconButton
    //           aria-label="Cancel"
    //           size="small"
    //           color="error"
    //           onClick={() => handleCancelAdvance(row)}
    //         >
    //           <CancelIcon />
    //         </IconButton>
    //       </>
    //     );
    //   }
    //   if (!row.claimUnderProcess && row.status === "Approved") {
    //     return (
    //       <IconButton
    //         aria-label="Edit"
    //         label="View"
    //         onClick={() => {
    //           setEditRowId(row.requisionId);
    //           setNewAdvanceAmount(row.advance);
    //         }}
    //       >
    //         <EditIcon />
    //       </IconButton>
    //     );
    //   }
    //   return <h3>Pending Unsettled Claim</h3>;
    // };

    return (
      <DataTableComponent
        data={rowData.expandableData}
        rows={10}
        paginator={false}
        // showGridlines
        dataKey="requisionId"
        className="text-xs"
        tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
      >
        {/* <Column field="requisionId" header="Requisition ID" /> */}
        <CustomColumn field="date" header="Date" />
        <CustomColumn field="advanceRequested" header="Advance Requested" />
        <CustomColumn field="status" header="Status" />

        <CustomColumn
          body={advanceColumnBody}
          header="Advance Given"
          headerStyle={{ textAlign: "center" }}
          style={{ textAlign: "center" }}
        />
        {/* <Column
          body={setAdvanceActions}
          header="Set Advance"
          headerStyle={{ textAlign: "center" }}
          style={{ textAlign: "center" }}
        /> */}
        <CustomColumn
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

        <CustomColumn
          header="Document"
          body={supportingDocumentBody}
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />

        <CustomColumn
          body={actionbody}
          header="Approval Action"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
          // disabled={rowData.checkAtleastOneManagerReviewed === false }
        />
      </DataTableComponent>
    );
  };

  useEffect(() => {
    const fetchongoingtravelData = async () => {
      setLoader(true);
      try {
        const approvedandsettledresponse = await getOngoingTravelData();

        if (!approvedandsettledresponse.status) {
          toast.current?.show({
            severity: "error",
            summary: "error",
            detail: approvedandsettledresponse.message,
          });
        }

        setongoingtravelData(approvedandsettledresponse.data);
        setLoader(false);
      } catch (error) {
        console.error("Error fetching travel data:", error);
      }
    };

    fetchongoingtravelData();
  }, []);

  const handelShowRequisitionForm = async (requisionId) => {
    setVisible(true);
    const { token } = getUserData();
    const response = await getMyFormParticularRequisitionId(token, requisionId);
    setRowData(response?.data);
  };

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

  //   const conpleteTravel = async (rowData) => {
  //     let response = await updateTravelRequisition(
  //       rowData,
  //       rowData.travelId,
  //       "CompleteRequested"
  //     );

  //     if (!response.status) {
  //       toast.current?.show({
  //         severity: "error",
  //         summary: "error",
  //         detail: response.message,
  //       });
  //     } else {
  //       setApprovedAndSettledTravelData(response.data);

  //       toast.current?.show({
  //         severity: "success",
  //         summary: "Success",
  //         detail: response.message,
  //       });
  //     }
  //   };

  const tourDetailsBody = (rowData) => (
    <div className="flex flex-col items-start justify-center space-y-1">
      <div>
        <span className="font-bold">City:</span> {rowData["city"]}
      </div>
      <div>
        <span className="font-bold">Purpose:</span> {rowData["purpose"]}
      </div>
      <div>
        <span className="font-bold">Project:</span> {rowData["projectName"]}
      </div>
      <div>
        <span className="font-bold">Type Of Travel:</span>{" "}
        {rowData["typeOfTravel"]}
      </div>
    </div>
  );

  return (
    <>
      <div className="px-4 mx-auto max-w-[85rem] lg:px-12">
        <Toast ref={toast} />
        <ExpandableDataTableComponent
          data={ongoingtravelData}
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionMode="single"
          rowExpansionTemplate={rowExpansionTemplate}
          // showGridlines
          className="text-xs"
          tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
          paginator
          // size="small"
          rows={10}
          dataKey="travelId"
          emptyMessage={
            loader ? (
              <ProgressBarComponent
                mode="indeterminate"
                style={{ height: "6px" }}
              />
            ) : (
              "No data found"
            )
          }
        >
          <CustomColumn expander style={{ width: "3rem" }} />

          {/* <Column
            field="travelId"
            header="travelId"
            headerStyle={{ textAlign: "center" }}
            style={{ textAlign: "center" }}
            sortable
            filter
          /> */}
          <CustomColumn
            field="userName"
            header="Name"
            headerStyle={{ textAlign: "center" }}
            style={{ textAlign: "center" }}
            sortable
            filter
          />
          <CustomColumn
            field="unsettledAmount"
            header="Total Unsettled Amount"
            headerStyle={{ textAlign: "center" }}
            style={{ textAlign: "center" }}
            sortable
            filter
          />
          <CustomColumn
            field="fromDate"
            header="From Date"
            headerStyle={{ textAlign: "center" }}
            style={{ textAlign: "center" }}
            sortable
            filter
          />
          <CustomColumn
            field="tentativeToDate"
            header="Tentative To Date"
            headerStyle={{ textAlign: "center" }}
            style={{ textAlign: "center" }}
            sortable
            filter
          />

          <CustomColumn
            field="empCode"
            header="Employee Code"
            headerStyle={{ textAlign: "center" }}
            style={{ textAlign: "center" }}
            sortable
            filter
          />

          <CustomColumn
            //field="purpose"
            header="Travel Details"
            body={tourDetailsBody}
            headerStyle={{ textAlign: "center" }}
            style={{ textAlign: "center" }}
            sortable
            filter
          />
          {/* <Column
            field="projectName"
            header="Project Name"
            headerStyle={{ textAlign: "center" }}
            style={{ textAlign: "center" }}
            sortable
            filter
          /> */}

          <CustomColumn
            field="localityArea"
            header="Locality/Area"
            headerStyle={{ textAlign: "center" }}
            style={{ textAlign: "center" }}
            sortable
            filter
          />
          {/* <Column
            field="city"
            header="City"
            headerStyle={{ textAlign: "center" }}
            style={{ textAlign: "center" }}
            sortable
            filter
          /> */}
          {/* <Column
            field="typeOfTravel"
            header="Type Of Travel"
            headerStyle={{ textAlign: "center" }}
            style={{ textAlign: "center" }}
            sortable
            filter
          /> */}

          {/* <Column
            body={(rowData) => {
              return !rowData.requestCompletedFlag ? (
                <IconButton
                  aria-label="Complete"
                  onClick={() => {
                    conpleteTravel(
                      rowData.expandableData[0],
                      "CompleteRequested"
                    );
                  }}
                >
                  <CheckIcon />
                </IconButton>
              ) : (
                <span>Completed</span>
              );
            }}
            header="Travel Complete"
            headerStyle={{ textAlign: "center" }}
            style={{ textAlign: "center" }}
          /> */}
        </ExpandableDataTableComponent>
        <CustomDialog
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
        </CustomDialog>
      </div>
    </>
  );
};

export default OngoingTravel;
