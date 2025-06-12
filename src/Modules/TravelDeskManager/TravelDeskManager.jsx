import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { useEffect, useRef, useState } from "react";
import {
  getAdvanceDetails,
  getMyFormParticularRequisitionId,
  // getMyFormTravelData,
  getTravelsByStatus,
  updateTravelRequisition,
} from "../TravelDesk/TravelDeskAPI";
import { getUserData } from "../Login/Encrypt";
import { Box, Button, Chip, CircularProgress, Grid } from "@mui/material";
import { Dialog } from "primereact/dialog";
import MyForm from "../TravelDesk/MyForms";
import "./TravelDeskManager.css";
import { InputTextarea } from "primereact/inputtextarea";
import { FloatLabel } from "primereact/floatlabel";
import { Button as PrimeReactButton } from "primereact/button";
import { ProgressBar } from "primereact/progressbar";
import { InputText } from "primereact/inputtext";
import CustomToast from "../../components/Toast/Toast";
import {  showInfoMessage, showSuccessMessage } from "../../components/Toast/ShowMessage";
import RequisitionFormView from "../TravelDesk/RequisitionFormView";
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'; // or any other icon

export default function TravelDeskManager() {


  const [travelData, setTravelData] = useState(null);//  DataTable data
  const [formData, setFormData] = useState({});//form data for storing the managers remarks
  const [visible, setVisible] = useState(false);//Dialog visibility
  const [globalFilter, setGlobalFilter] = useState(null);// Global filter for DataTable
  const [expandedRows, setExpandedRows] = useState(null);//for expanded rows in DataTable



  const PENDING_STATUS = "Pending";
  const { token,userDetails } = getUserData();
  const toastRef=useRef(null);
  console.log('userDetails',userDetails)

  useEffect(() => {
    fetchTravelData();
  }, []);

  const fetchTravelData = async () => {
    try {
      const { data } = await getTravelsByStatus(token, PENDING_STATUS);
      console.log("response", data);
      const pendingData = data.filter(
        (item) => 
          // item?.status=== PENDING_STATUS  &&
        item?.manager_id === userDetails?.userId
      );

      const {data : advanceTravelData}= await getAdvanceDetails();
      console.log("advanceTravelData", advanceTravelData);

      const updatedPendingData = pendingData.map((travel) => {
        const userName=advanceTravelData?.find(
          (claims) => claims?.userId === travel?.user_id
        )?.userName || "Unknown User";

          const unsettledAmount=advanceTravelData?.find(
          (claims) => claims?.userId === travel?.user_id
        )?.unsettledAmount || 0;
       
        return {
          ...travel,
          userName,
          unsettledAmount
        };
    });
    console.log('Updated Pending Data:', updatedPendingData);
     setTravelData(updatedPendingData ?? []);
    } catch (error) {
      console.error("Error fetching travel data:", error);
      setTravelData([])
    }
  };

  const handleApproveTravel = async () => {

    console.log('handleApproveTravel() called');
       const updatedForm = {
      ...formData,
      status: "ManagerReviewed",
     };

   const response=await updateTravelRequisition( updatedForm, formData.requisionId, 'ManagerReviewed');

   if(response?.status===201){
    console.log('Travel approved successfully');
    showSuccessMessage(toastRef,"Success", "Travel approved successfully !");
    
    // setFormData({});
    const updatedPendingData = travelData.filter(
      (item) => item.requisionId !== formData.requisionId
    );
    setTravelData(updatedPendingData);
    setVisible(false);
   }
  }

  const handleRejectTravel = async () => {
     console.log('handleRejectTravel() called');

     const updatedForm = {
      ...formData,
      status: "Rejected",
     };

   const response=await updateTravelRequisition(token, updatedForm, formData.requisionId, 'Rejected');

   if(response?.status===201){
    console.log('Travel rejected successfully');
    showInfoMessage(toastRef,"Success", "Travel rejected successfully !");
    
    // setFormData({});
    const updatedPendingData = travelData.filter(
      (item) => item.requisionId !== formData.requisionId
    );
    setTravelData(updatedPendingData);
    setVisible(false);
   }

  }

  const handleShowClick = async (e, rowData) => {
    e.stopPropagation(); // Prevent the event from bubbling up
    if (visible) return; // Prevent multiple clicks
    console.log("rowdata", rowData);
    console.log("Event", e);
    //temporarily set the requisitionId to formData
    setFormData({ ...formData, requisionId: rowData.requisionId }); //for loading
    const { data } = await getMyFormParticularRequisitionId(
      token,
      rowData.requisionId
    );
    console.log("requisionId Data :", data);
    // await new Promise(resolve => setTimeout(resolve, 5000));
    if (data) {
      setFormData(data);
      //When the original form data is loaded then the dialog is visible
      setVisible(true);
    }
  };

  const isRowClicked = (rowData) => {
    // console.log("Row clicked");
    return (
      travelData?.length > 0 &&
      formData?.requisionId === rowData?.requisionId &&
      !visible
    );
  };

  const renderHeader = () => {
    return (
      <InputText
        type="search"
        className="p-inputtext-sm"
        onInput={(e) => setGlobalFilter(e.target.value)}
        placeholder="Search.."
      />
    );
  };

  const renderShowButton =(rowData) => {
            return (
              <Button
                variant="contained"
                size="small"
                onClick={(e) => handleShowClick(e, rowData)}
                endIcon={
                  isRowClicked(rowData) && (
                    <CircularProgress size="1rem" color="white" />
                  )
                }
              >
                Show
              </Button>
            );
          }

          const renderStatusChip = (row) => {
const status = row?.status;
  let color = 'default';

  switch (status?.toLowerCase()) {
    case 'approved':
    case 'completed':
      color = 'success';
      break;
    case 'pending':
      color = 'error';
      break;
    case 'rejected':
    case 'cancelled':
      color = 'error';
      break;
    default:
      color = 'info';
  }

  return <Chip label={status} color={color} size="small" />;
};



          const rowExpansionTemplate = (row) => {
            const updatedTravelData=travelData.filter(travel=> travel.travelId === row.travelId);
  return (
    <>
    <DataTable
        value={updatedTravelData}
          className="text-xs"
        tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
         showGridlines
       
      >
        <Column sortable field="date" header="Date"></Column>
        {/* <Column sortable field="user_id" header="Name"></Column> */}
        <Column sortable field="status" header="Status" body={renderStatusChip}></Column>
        {/* <Column sortable field="purpose" header="Purpose of Travel"></Column>
        <Column sortable field="projectName" header="Project Name"></Column>
        <Column sortable field="city" header="City"></Column> */}
        <Column sortable field="advanceRequested" header="Advance Requested"></Column>
        <Column sortable field="advance" header="Advance Given"></Column>
        <Column
          body={renderShowButton}
          header="View"
        ></Column>
      </DataTable>
    </>
  );
}




const uniqueTravels =
  travelData?.reduce((acc, item) => {
    if (!acc[item?.travelId]) {
      acc[item?.travelId] = item; // store only the first occurrence
    }
    return acc;
  }, {})

const updatedTravelData = Object.values(uniqueTravels??[]).map((travel) => { 
  const foundPendingData = travelData?.find(
    (item) => item.travelId === travel.travelId && item.status === PENDING_STATUS
  );

  return {
    ...travel,
    pending: foundPendingData ? true : false,
  };
 });

  return (
    // <div className="max-w-[85rem] mx-auto p-4 min-h-screen bg-gray-100"></div>
    <div className="max-w-[85rem] mx-auto p-4 min-h-screen bg-gray-100">
      {/* DataTable */}
    <CustomToast ref={toastRef} />
      <DataTable
        value={updatedTravelData}
        className="text-xs"
        expandedRows={expandedRows}
        onRowToggle={(e) => setExpandedRows(e.data)}
        rowExpansionTemplate={(row)=>rowExpansionTemplate(row,travelData)}
        // dataKey="travelId"
        emptyMessage={
          travelData?.length === 0 ? (
            "No data found"
          ) : (
            <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
          )
        }
        header={renderHeader}
        globalFilter={globalFilter}
         showGridlines
        // className="text-xs"
        tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
         paginator
          size="small"
          rows={10}
      >
         <Column expander />
         <Column
  field="userName"
  header="User"
  sortable
  body={(rowData) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {rowData.pending && (
        <FiberManualRecordIcon
          fontSize="small"
          style={{ fontSize: '.8rem' }}
          color="warning" // or use a specific color code
          // style={{ color: '#fbc02d' }} // yellow for "pending"
        />
      )}
      {rowData.userName}
    </div>
  )}
/>

        <Column sortable field="unsettledAmount" header="Unsettled"></Column>
        <Column sortable field="fromDate" header="From Date"></Column>
        <Column sortable field="tentativeToDate" header="Tentative To Date"></Column>
        
        {/* <Column sortable field="user_id" header="Name"></Column> */}
        <Column sortable field="typeOfTravel" header="Type of Travel"></Column>
        <Column sortable field="purpose" header="Purpose of Travel"></Column>
        <Column sortable field="projectName" header="Project Name"></Column>
         <Column sortable field="localityArea" header="Locality/Area"></Column>
        <Column sortable field="city" header="City"></Column>
        {/* <Column
          body={renderShowButton}
          header="View"
        ></Column> */}
      </DataTable>

      {/* Dialog component */}
      <Dialog
        header="Details"
        visible={visible}
        style={{ width: "90vw" }}
        maximizable
        onHide={() => {
          if (!visible) return;
          setVisible(false);
          setFormData({});
        }}
      >
        {/* Dialog content */}
        <Grid container spacing={2}>
          <RequisitionFormView 
          rowData={formData} 
          handleApproveTravel={handleApproveTravel} 
          handleRejectTravel={handleRejectTravel}
          formData={formData}
          setFormData={setFormData}
           />
          {/* <Grid size={6}>Purpose : {formData?.purpose}</Grid>
          <Grid size={6}>Project Name : {formData?.projectName}</Grid>
          <Grid size={6}>City : {formData?.city}</Grid>
          <Grid size={6}>Locality/Area : {formData?.localityArea}</Grid>
          <Grid size={4}>Type of Travel : {formData?.typeOfTravel}</Grid>
          <Grid size={4}>Advance Requested : {formData?.advanceRequested}</Grid>
          <Grid size={4}>Advance Given : {formData?.advance}</Grid>
          <Grid size={12}>
            <DataTable
              header="Mode of Transport"
              value={formData?.transportModes}
            >
              <Column field="mode" header="Mode"></Column>
              <Column field="fromDate" header="From Date"></Column>
              <Column field="comment" header="Comment"></Column>
              <Column field="manager_remark" header="Manager Remark"></Column>
            </DataTable>
          </Grid>

          <Grid size={12}>
            <DataTable
              header="Reservation of Accommodation"
              value={formData?.accommodations}
            >
              <Column field="type" header="Type"></Column>
              <Column field="numberOfRooms" header="Number Of Rooms"></Column>
              <Column field="numberOfNights" header="Number Of Nights"></Column>
              <Column field="checkIn" header="Check In"></Column>
              <Column field="checkOut" header="Check Out"></Column>
              <Column field="comment" header="Comment"></Column>
            </DataTable>
          </Grid> */}
        {/* Maneger's I/P */}
        {
          // formData?.manager_id === userDetails?.userId &&
          // <Box display="flex" gap={2} flexDirection="row" marginTop={2}>
          //   <Grid item xs={6}>
          //     Manager Name:{" "}
          //     <div style={{ fontWeight: "bold", color: "blue" }}>
          //       {formData?.manager_id}
          //     </div>
          //   </Grid>
          //   <Grid item xs={6}>
          //     <FloatLabel>
          //       <InputTextarea
          //         value={formData?.manager_suggestion}
          //         onChange={(e) =>
          //           setFormData({
          //             ...formData,
          //             manager_suggestion: e.target.value,
          //           })
          //         }
          //       />
          //       <label htmlFor="managercomment">Manager Comment</label>
          //     </FloatLabel>
          //   </Grid>
          //    {/* Button */}
          // <PrimeReactButton
          //   raised
          //   icon="pi pi-check"
          //   rounded
            
          //   aria-label="Verify"
          //   severity="success"
          //   disabled={!formData?.manager_suggestion?.trim()}
          //   onClick={handleApproveTravel}
          // />
          // <PrimeReactButton
          //   raised
          //   icon="pi pi-times"
          //   rounded
            
          //   severity="danger"
          //   aria-label="Cancel"
          //    disabled={!formData?.manager_suggestion?.trim()}
          //     onClick={handleRejectTravel}
          // />
          // </Box>
        }

         
        </Grid>
      </Dialog>
    </div>
  );
}
