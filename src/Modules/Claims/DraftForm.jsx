import { useState, useRef } from "react";
import {
  DataTableComponent,
  CustomColumn,
} from "../../components/DataTable/DataTableComponent";
import CustomDialog from "../../components/Dialog/DialogComponent";
 
import { Toast } from "primereact/toast";
import { FileUpload } from "primereact/fileupload";
import CustomButton from "../../components/Button/Button";
import {
  showSuccessMessage,
  showErrorMessage,
  showWarningMessage,
} from "../../components/Toast/ShowMessage";
const initialFormState = {
  // id: Date.now(),
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
  downloadTourClaimExpanseDocument,
} from "./claimServices";
 
import { getTravelDetailsFromTravelId2 } from "../TravelDesk/TravelDeskAPI";
import LinearProgressMUI from "../../components/LinearProgressMUI";
 
const DraftForm = ({
  draftData,
  setDraftData,
  refreshDraftData,
  seteditableMode,
  editableMode,
  settoggleNewClaim,
  tourclaimforsettoggleNewClaimmData,
  settourclaimformData,
  settourClaimTableData,
  travelOptions,
  setTravelModeOptions,
  setselectedtravelMode,
}) => {
  const cellStyle = {};
  const toastRef = useRef(null);
  const [rowData, setRowData] = useState({});
 
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewtabledata, setviewtabledata] = useState();
  const [uploadProgress, setUploadProgress] = useState({});
  // const [loadingRows, setLoadingRows] = useState({});
 
  const handleDelete = async (claim_id, status) => {
    let response = await deleteDraftList(claim_id, status);
    if (!response.status) {
      showErrorMessage(toastRef, "error", response.message);
    } else {
      showSuccessMessage(
        toastRef,
        "success",
        response.message || "One more draft data deleted",
      );
 
      setDraftData(response.data);
      if (response.data.length == 0) {
        settoggleNewClaim(true);
        seteditableMode(false);
        settourClaimTableData([]);
        settourclaimformData([]);
      }
      settourClaimTableData([]);
      setselectedtravelMode(null);
      settourclaimformData([]);
    }
  };
 
  const handleApplyApproval = async (claim_id, status) => {
    try {
      console.log();
      let response = await applyClaim(claim_id, status);
      if (!response.status) {
        showErrorMessage(toastRef, "error", response.message);
      } else {
        showSuccessMessage(
          toastRef,
          "success",
          "You have successfully applied for approval.",
        );
 
        setDraftData(response.data);
        if (response.data.length == 0) {
          settoggleNewClaim(true);
          seteditableMode(false);
          settourClaimTableData([]);
          setselectedtravelMode(null);
          settourclaimformData([]);
        }
        settourClaimTableData([]);
        setselectedtravelMode(null);
        settourclaimformData([]);
      }
    } catch (error) {
      showErrorMessage(
        toastRef,
        "error",
        "Failed to apply: " + (error?.message || error),
      );
    }
  };
 
  const handleEdit = async (claim_id, travel_id) => {
    try {
      const data = await getTourClaimTableDraftData(claim_id);
      const travelDropDown = await getTravelDropDown();
      console.log("travelDropDown", travelDropDown);
 
      let obj = travelDropDown.data;
      const matchedItem = obj.find((item) => item.value === data.travel_id);
      if (travel_id === "Long-Term-Local-Conveyance") {
        setselectedtravelMode(matchedItem);
      } else {
        //const travelmode= await getTravelMode(travel_id)
        let responsedata = await getTravelDetailsFromTravelId2(travel_id);
        let data = responsedata.data;
        let labelname =
          data.city + " - " + data.fromDate + " - " + data.projectName;
        // console.log('travelmode', travelmode)
        setselectedtravelMode({ label: labelname, value: travel_id });
      }
      let dates = await getlatestclaimtodate(travel_id);
      // console.log('dates',dates)
 
      // travel_id==='Long-Term-Local-Conveyance'?setselectedtravelMode(matchedItem):setselectedtravelMode({label:travelmode.data,value:travel_id})
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
        claimFromDate: data.from_date,
        claimToDate: data.to_date,
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
      console.log("formattedRows", formattedRows);
 
      settourClaimTableData(formattedRows);
      seteditableMode(true);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };
 
  const actionBodyTemplate = (rowData) => (
    <div className="flex gap-2">
      <CustomButton
        icon="pi pi-pencil"
        className="p-button-sm p-button-text p-button-info"
        onClick={() => {
          handleEdit(rowData.claim_id, rowData.travel_id);
        }}
        tooltip="Edit"
      />
      <CustomButton
        icon="pi pi-trash"
        className="p-button-sm p-button-text p-button-danger"
        onClick={() => handleDelete(rowData.claim_id, "Cancelled")}
        tooltip="Delete"
      />
      <CustomButton
        icon="pi pi-send"
        label="Apply"
        className="p-button-sm p-button-success p-button-text"
        onClick={() => {
          if (rowData.total_expense > 0) {
            handleApplyApproval(rowData.claim_id, "Applied");
          } else {
            showErrorMessage(toastRef, "error", "claim amount is zero");
          }
        }}
        tooltip="Apply for Approval"
      />
    </div>
  );
 
  const claimCalculationBody = (rowData) => (
    <div className="text-xs space-y-1 flex flex-col justify-center items-end">
      <div>
        <span className="font-semibold text-gray-700">Advance:</span> ₹
        {rowData["advance"]}
      </div>
      <div>
        <span className="font-semibold text-gray-700">
          Expenditure Claimed:
        </span>{" "}
        ₹{rowData["total_expense"]}
      </div>
      <div>
        <span className="font-semibold text-gray-700">Claim Approved:</span> ₹
        {rowData["approvedAmount"]}
      </div>
      <hr />
      {rowData["dueAmount"] ? (
        <div>
          <span className="font-bold">Due:</span> ₹{rowData["dueAmount"]}
        </div>
      ) : (
        <div>
          <span className="font-bold">Claim:</span> ₹
          {rowData["amountToBeClaimed"]}
        </div>
      )}
    </div>
  );
 
  const tourDetailsBody = (rowData) => (
    <div className="flex flex-col items-start justify-center space-y-1">
      <div>
        <span className="font-bold">Destination:</span> {rowData["destination"]}
      </div>
      <div>
        <span className="font-bold">Purpose:</span> {rowData["purpose"]}
      </div>
      <div>
        <span className="font-bold">Project:</span> {rowData["project"]}
      </div>
      <div>
        <span className="font-bold">Type:</span> {rowData["type"]}
      </div>
    </div>
  );
 
  const handleAddRow = () => {
    console.log("Add row clicked!");
    // You can add logic to add a new blank row if needed
  };
 
  const supportingDocumentBody = (rowData) => {
    //const isLoading = loadingRows[rowData.claim_id];
    const [fileUploaded, setFileUploaded] = useState(
      rowData.filename ? true : false,
    );
    const [togglefileUpload, settogglefileUpload] = useState(
      rowData.filename ? false : true,
    );
    const handleDownloadFile = async (claim_id) => {
      try {
        let d = await downloadTourClaimSupportingDocument(claim_id);
      } catch (error) {
        showErrorMessage(toastRef, "error", "Something Wrong.");
      }
    };
    const onFileSelect = async (event) => {
      const file = event.files[0]; // Get the uploaded file
      setFileUploaded(true);
      settogglefileUpload(false);
 
      // //test
      // setUploadProgress(10); // start
      // // fake progress simulation
      // const interval = setInterval(() => {
      //   setUploadProgress((prev) => {
      //     if (prev >= 90) return prev;
      //     return prev + 10;
      //   });
      // }, 300);
      // // test
 
      // Start progress
      setUploadProgress((prev) => ({
        ...prev,
        [rowData.claim_id]: 10,
      }));
 
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          const current = prev[rowData.claim_id] || 0;
          if (current >= 90) return prev;
          return {
            ...prev,
            [rowData.claim_id]: current + 10,
          };
        });
      }, 300);
 
      const formData = new FormData();
      formData.append("file", file); // Append file to formData
 
      try {
        const response = await uploadSupportingDocuments(
          file,
          rowData.claim_id,
        ); // Adjust this call accordingly
 
        //test
        clearInterval(interval);
 
        setUploadProgress((prev) => ({
          ...prev,
          [rowData.claim_id]: 100,
        }));
 
        //test
 
        if (response == "File uploaded successfully") {
          showSuccessMessage(toastRef, "success", "File Uploaded");
          await refreshDraftData();
        }
      } catch (error) {
        //test
        clearInterval(interval);
 
        setUploadProgress((prev) => ({
          ...prev,
          [rowData.claim_id]: 0,
        }));
        //test
        showErrorMessage(toastRef, "error", "Upload failed");
 
        console.log(error);
        setFileUploaded(false);
        settogglefileUpload(true);
      }
    };
 
    const progress = uploadProgress[rowData.claim_id] || 0;
 
    return (
      <div className="flex flex-col justify-center mb-2 gap-x-2 gap-y-2">
        {progress > 0 && progress < 100 && (
          <LinearProgressMUI value={progress} />
        )}
        {togglefileUpload ? (
          <FileUpload
            mode="basic"
            name="file"
            accept="*/*"
            auto
            customUpload
            uploadHandler={onFileSelect}
            maxFileSize={5000000000}
            chooseLabel="Upload"
          />
        ) : null}
 
        {fileUploaded && (
          <div>
            <CustomButton
              icon="pi pi-download"
              className="p-button-sm p-button-text p-button-success"
              onClick={() => {
                handleDownloadFile(rowData.claim_id);
              }}
              tooltip={`${rowData.filename}`}
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
 
  const downloadExpense = (rowData) => {
    const handleDownloadFile = async (claim_id) => {
      try {
        let d = await downloadTourClaimExpanseDocument(claim_id);
      } catch (error) {
        showErrorMessage(toastRef, "error", "Something Wrong.");
      }
    };
 
    const viewtable = async (claim_id) => {
      try {
        let data = await getTourClaimTableDraftData(claim_id);
        setviewtabledata(data.tourClaimRecords);
        setShowViewDialog(true);
      } catch (error) {
        showErrorMessage(toastRef, "error", "Failed to load table.");
      }
    };
 
    return (
      <div className="flex justify-center items-center gap-2">
        <CustomButton
          icon="pi pi-download"
          rounded
          outlined
          severity="success"
          disabled={false}
          onClick={() => {
            handleDownloadFile(rowData.claim_id);
          }}
          size=""
          label={""}
          className="p-button-sm p-button-text p-button-success"
        />
        {/* <Button
          icon="pi pi-download"
          className="p-button-sm p-button-text p-button-success"
          onClick={() => {
            handleDownloadFile(rowData.claim_id);
          }}
          tooltip={""}
        /> */}
        <CustomButton
          icon="pi pi-eye"
          rounded
          outlined
          severity="success"
          disabled={false}
          onClick={() => {
            viewtable(rowData.claim_id);
          }}
          className="p-button-sm p-button-text p-button-success"
        />
      </div>
    );
  };
 
  const datebody = (rowData) => {
    return (
      <div className="flex flex-col justify-center items-center">
        <span> {rowData.from_date}</span>
        <span> to </span>
        <span> {rowData.to_date} </span>
      </div>
    );
  };
 
  const totals = Array.isArray(viewtabledata)
    ? {
        lodging: viewtabledata.reduce(
          (s, r) => s + (Number(r.lodging) || 0),
          0,
        ),
        breakfast: viewtabledata.reduce(
          (s, r) => s + (Number(r.breakfast) || 0),
          0,
        ),
        lunch: viewtabledata.reduce((s, r) => s + (Number(r.lunch) || 0), 0),
        snacks: viewtabledata.reduce((s, r) => s + (Number(r.snacks) || 0), 0),
        dinner: viewtabledata.reduce((s, r) => s + (Number(r.dinner) || 0), 0),
        teaWater: viewtabledata.reduce(
          (s, r) => s + (Number(r.teaWater) || 0),
          0,
        ),
        longTravel: viewtabledata.reduce(
          (s, r) => s + (Number(r.longTravel) || 0),
          0,
        ),
        shortTravel: viewtabledata.reduce(
          (s, r) => s + (Number(r.shortTravel) || 0),
          0,
        ),
        tollTax: viewtabledata.reduce(
          (s, r) => s + (Number(r.tollTax) || 0),
          0,
        ),
        incidentals: viewtabledata.reduce(
          (s, r) => s + (Number(r.incidentals) || 0),
          0,
        ),
        other: viewtabledata.reduce((s, r) => s + (Number(r.other) || 0), 0),
        total: viewtabledata.reduce((s, r) => s + (Number(r.total) || 0), 0),
      }
    : {};
 
  return (
    <div>
      <Toast ref={toastRef} />
      <div>
        <DataTableComponent
          data={draftData}
          rows={10}
          //textSize="text-xs"
          tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
          emptyMessage="No data found"
          className="dataTableHeader dataTableBody dataTableBodyPadding dataTablePaginator"
        >
          <CustomColumn
            header="Claim Duration"
            body={datebody}
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
            sortable={true}
            filter={true}
          />
          <CustomColumn
            field="account"
            header="On Account"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
            sortable
            filter
          />
          <CustomColumn
            header="Tour Details"
            body={tourDetailsBody}
            headerStyle={cellStyle}
            style={{ width: "200px" }}
            bodyStyle={{ ...cellStyle, whiteSpace: "pre-line" }}
            sortable={true}
            filter={true}
          />
          <CustomColumn
            header="Claim Calculation"
            body={claimCalculationBody}
            headerStyle={{ ...cellStyle, width: "200px", whiteSpace: "normal" }}
            bodyStyle={{ ...cellStyle, whiteSpace: "pre-line" }}
            sortable={true}
            filter={true}
          />
          <CustomColumn
            header="Upload Supporting Document"
            body={supportingDocumentBody}
            headerStyle={cellStyle}
            bodyStyle={{ ...cellStyle, whiteSpace: "pre-line" }}
            sortable={true}
            filter={true}
          />
          <CustomColumn
            field="Expense"
            header="Expense"
            body={downloadExpense}
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
          />
          <CustomColumn
            header="Action"
            body={actionBodyTemplate}
            headerStyle={{ ...cellStyle, textAlign: "center" }}
            bodyStyle={{ ...cellStyle, textAlign: "center" }}
            sortable={true}
            filter={true}
          />
        </DataTableComponent>
 
        <CustomDialog
          header="Tour Claim Details"
          visible={showViewDialog}
          style={{ width: "90vw" }}
          onHide={() => setShowViewDialog(false)}
          modal
        >
          <DataTableComponent
            data={viewtabledata}
            rows={10}
            textSize="text-xs"
            tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
            emptyMessage="No data found"
            className={
              "dataTableHeader dataTableBody dataTableBodyPadding dataTablePaginator"
            }
          >
            {/* </DataTableComponent> */}
            {/* <DataTable
                  value={viewtabledata}
                  showGridlines
                className="text-xs"
                tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
                > */}
            <CustomColumn
              field="date"
              header="Date"
              headerStyle={{ ...cellStyle, minWidth: "100px" }}
              bodyStyle={cellStyle}
              footer="Total"
            />
            <CustomColumn
              field="lodging"
              header="Lodging"
              headerStyle={cellStyle}
              bodyStyle={cellStyle}
              footer={totals.lodging?.toFixed(2)}
            />
            <CustomColumn
              field="breakfast"
              header="Breakfast"
              headerStyle={cellStyle}
              bodyStyle={cellStyle}
              footer={totals.breakfast?.toFixed(2)}
            />
            <CustomColumn
              field="lunch"
              header="Lunch"
              headerStyle={cellStyle}
              bodyStyle={cellStyle}
              footer={totals.lunch?.toFixed(2)}
            />
            <CustomColumn
              field="snacks"
              header="Snacks"
              headerStyle={cellStyle}
              bodyStyle={cellStyle}
              footer={totals.snacks?.toFixed(2)}
            />
            <CustomColumn
              field="dinner"
              header="Dinner"
              headerStyle={cellStyle}
              bodyStyle={cellStyle}
              footer={totals.dinner?.toFixed(2)}
            />
            <CustomColumn
              field="teaWater"
              header="Tea & Water"
              headerStyle={cellStyle}
              bodyStyle={cellStyle}
              footer={totals.teaWater?.toFixed(2)}
            />
            <CustomColumn
              field="longTravel"
              header="Airfare, Bus, Train,Taxi Rental"
              headerStyle={cellStyle}
              bodyStyle={cellStyle}
              footer={totals.longTravel?.toFixed(2)}
            />
            <CustomColumn
              field="shortTravel"
              header="Auto, Cab"
              headerStyle={cellStyle}
              bodyStyle={cellStyle}
              footer={totals.shortTravel?.toFixed(2)}
            />
            <CustomColumn
              field="tollTax"
              header="Parking, Toll, Fuel"
              headerStyle={cellStyle}
              bodyStyle={cellStyle}
              footer={totals.tollTax?.toFixed(2)}
            />
            <CustomColumn
              field="incidentals"
              header="Incidentals"
              headerStyle={cellStyle}
              bodyStyle={cellStyle}
              footer={totals.incidentals?.toFixed(2)}
            />
            <CustomColumn
              field="other"
              header="Other Business Expenses"
              headerStyle={cellStyle}
              bodyStyle={cellStyle}
              footer={totals.other?.toFixed(2)}
            />
            <CustomColumn
              field="total"
              header="Total"
              headerStyle={cellStyle}
              bodyStyle={cellStyle}
              footer={totals.total?.toFixed(2)}
            />
            <CustomColumn
              field="remarks"
              header="Remarks"
              headerStyle={cellStyle}
              bodyStyle={cellStyle}
            />
          </DataTableComponent>
        </CustomDialog>
      </div>
    </div>
  );
};
 
export default DraftForm;
 
 