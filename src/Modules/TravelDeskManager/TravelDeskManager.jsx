import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { useEffect, useRef, useState } from "react";
import {
  downloadDocumentsByReqId,
  getAdvanceDetails,
  getManagerwiseongoingtravels,
  getMyFormParticularRequisitionId,
  // getMyFormTravelData,
  getTravelsByStatus,
  updateTravelRequisition,
  getExpandableData,
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
import {
  showInfoMessage,
  showSuccessMessage,
} from "../../components/Toast/ShowMessage";
import RequisitionFormView from "../TravelDesk/RequisitionFormView";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord"; // or any other icon
import { TabPanel, TabView } from "primereact/tabview";
import { SelectButton } from "primereact/selectbutton";
import RequisitionFormView2 from "../TravelDesk/RequisitionFormView2";

const renderStatusChip = (row) => {
  const status = row?.status || "";
  let color = "default";

  switch (status.toLowerCase()) {
    case "approved":
    case "completed":
    case "settled":
      color = "success";
      break;

    case "completerequested":
    case "managerreviewed":
      color = "info";
      break;

    case "rejected":
    case "cancelled":
    case "pending":
      color = "error";
      break;

    default:
      color = "info";
  }

  return <Chip label={status} color={color} size="small" />;
};


const RenderPendingIcon = () => (
<FiberManualRecordIcon
                  fontSize="small"
                  style={{ fontSize: ".8rem" }}
                  color="warning" // or use a specific color code
                  // style={{ color: '#fbc02d' }} // yellow for "pending"
                />)

const tabs=["Pending", "History"];

export default function TravelDeskManager() {
  const [travelData, setTravelData] = useState(null); //  DataTable data
  const [formData, setFormData] = useState({}); //form data for storing the managers remarks
  const [visible, setVisible] = useState(false); //Dialog visibility
  const [globalFilter, setGlobalFilter] = useState(null); // Global filter for DataTable
  const [expandedRows, setExpandedRows] = useState(null); //for expanded rows in DataTable
  const [activeTab, setActiveTab] = useState(tabs[0]); //for active tab in DataTable

  const PENDING_STATUS = "Pending";
  const { token, userDetails } = getUserData();
  const toastRef = useRef(null);
  console.log("userDetails", userDetails);

  useEffect(() => {
    fetchTravelData();
  }, []);

  const fetchTravelData = async () => {
    try {
      const response = await getManagerwiseongoingtravels(); //await getTravelsByStatus(token, PENDING_STATUS);
      console.log("response.data", response.data);

      // const pendingData = data.filter(
      //   (item) =>
      //     // item?.status=== PENDING_STATUS  &&
      //     item?.manager_id === userDetails?.userId
      // );

      // const { data: advanceTravelData } = await getAdvanceDetails();
      //  console.log("advanceTravelData", advanceTravelData);

      // const updatedPendingData = pendingData.map((travel) => {
      //   const userName =
      //     advanceTravelData?.find(
      //       (claims) => claims?.userId === travel?.user_id
      //     )?.userName || "Unknown User";

      //   const unsettledAmount =
      //     advanceTravelData?.find(
      //       (claims) => claims?.userId === travel?.user_id
      //     )?.unsettledAmount || 0;

      //   return {
      //     ...travel,
      //     userName,
      //     unsettledAmount,
      //   };
      // });
      // console.log("Updated Pending Data:", updatedPendingData);
      if (response.status) {
        setTravelData(response.data);
      } else {
        showInfoMessage(toastRef, "Error", response.message);
      }
    } catch (error) {
      console.error("Error fetching travel data:", error);
      setTravelData([]);
    }
  };

  const updateTravelInfo = (expandedRows) => {
    // const hasPendingInExpanded = expandedRows?.some(row => row.status?.toLowerCase() === "pending");
    // console.log("FormData ", formData.travelId, formData.status, hasPendingInExpanded);
    const hasPendingInExpanded = expandedRows?.some(
      (row) => row.status?.toLowerCase() === "pending"
    );
    // debugger;
    const updatedTravelData = travelData?.map((item) => {
      if (item.travelId === formData.travelId && !hasPendingInExpanded) {
        console.log("The object which is being updated : ", item);
        return {
          ...item,
          managerActionRequiredFlag: false, // Update the status in the travel data
        };
      }
      return item;
    });

    console.log("Updated Travel Data : ", updatedTravelData);
    return updatedTravelData;
  };

  //Any travel that is pending can see the details and approve or reject
  const handleApproveTravel = async () => {
    console.log("handleApproveTravel() called");
    try {
      const updatedForm = {
        ...formData,
        status: "ManagerReviewed",
      };

      const response = await updateTravelRequisition(
        updatedForm,
        formData.requisionId,
        "ManagerReviewed"
      );

      const { status } = response;
      console.log("Updated Response : ", response);
      if (status === 200) {
        console.log("Travel approved successfully");
        showSuccessMessage(
          toastRef,
          "Success",
          "Travel approved successfully !"
        );

        // setFormData({});
        // const updatedPendingData = travelData.filter(
        //   (item) => item.requisionId !== formData.requisionId
        // );
        // setTravelData(updatedPendingData);
        // await fetchTravelData(); // Refresh the travel data after approval

        const newExpanedRows = expandedRows?.map((row) => {
          if (row.requisionId === formData.requisionId) {
            return {
              ...row,
              status: "ManagerReviewed", // Update the status in the expanded row
            };
          }
          return row;
        });
        const updatedTravelData = updateTravelInfo(newExpanedRows); // Update the travel data with the new status
        setTravelData(updatedTravelData); // Update the travel data with the new status
        setExpandedRows(newExpanedRows); // Update the expanded rows state

        //  await handlerowexpand();
        setFormData({});
        setVisible(false);
      }
    } catch (error) {
      console.error("Error approving travel:", error);
      showInfoMessage(
        toastRef,
        "Error",
        "Failed to approve travel. Please try again."
      );
    }
  };

  const handleRejectTravel = async () => {
    console.log("handleRejectTravel() called");
    try {
      const updatedForm = {
        ...formData,
        status: "Rejected",
      };

      const response = await updateTravelRequisition(
        updatedForm,
        formData.requisionId,
        "Rejected"
      );

      const { status } = response;
      if (status === 200) {
        console.log("Travel rejected successfully");
        showInfoMessage(toastRef, "Success", "Travel rejected successfully !");

        // setFormData({});
        // const updatedPendingData = travelData.filter(
        //   (item) => item.requisionId !== formData.requisionId
        // );
        // setTravelData(updatedPendingData);
        // await fetchTravelData(); // Refresh the travel data after approval
        //  await handlerowexpand();

        setTravelData(updateTravelInfo);
        const newExpanedRows = expandedRows?.map((row) => {
          if (row.requisionId === formData.requisionId) {
            return {
              ...row,
              status: "Rejected", // Update the status in the expanded row
            };
          }
          return row;
        });
        setExpandedRows(newExpanedRows); // Update the expanded rows state
        setFormData({});
        setVisible(false);
      }
    } catch (error) {
      console.error("Error rejecting travel:", error);
      showInfoMessage(
        toastRef,
        "Error",
        "Failed to reject travel. Please try again."
      );
    }
  };

  const handleShowClick = async (e, rowData) => {
    try {
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
    } catch (error) {
      console.error("Error fetching form data:", error);
      setFormData({});
      showInfoMessage(
        toastRef,
        "Error",
        "Failed to fetch form data. Please try again."
      );
    }
  };

  const isRowClicked = (rowData) => {
    // console.log("Row clicked");
    console.log("rowData", rowData);
    return (
      travelData?.length > 0 &&
      formData?.requisionId === rowData?.requisionId &&
      !visible
    );
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center">
      <InputText
        type="search"
        className="p-inputtext-sm"
        onInput={(e) => setGlobalFilter(e.target.value)}
        placeholder="Search.."
      />

       <SelectButton  value={activeTab} onChange={(e) => setActiveTab(e.value)} options={tabs}  allowEmpty={false}/>
       </div>
    );
  };

  const renderShowButton = (rowData) => {
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
  };

  const renderDownloadTicket = (rowData) => {
    return (
      <Box>
        <PrimeReactButton
          variant="contained"
          icon="pi pi-download"
          size="small"
          disabled={!rowData?.file_name}
          onClick={async () => {
            console.log("Download ticket clicked for row:", rowData);
            const { status, message } = await downloadDocumentsByReqId(
              rowData.requisionId
            );
            // console.log("Ticket data:", ticket);

            if (!status) {
              showInfoMessage(
                toastRef,
                "Error",
                message || "Failed to download ticket."
              );
              return;
            }

            // Implement download logic here
          }}
        />
      </Box>
    );
  };

  const rowExpansionTemplate = (row) => {
    // const updatedTravelData = travelData.filter(
    //   (travel) => travel.travelId === row.travelId
    console.log(" Expanded row", row);
    // );
    return (
      <>
        <DataTable
          value={row}
          showGridlines
          className="text-xs"
          tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
          size="small"
        >
          <Column sortable field="date" header="Date"></Column>
          {/* <Column sortable field="user_id" header="Name"></Column> */}
          <Column
            sortable
            field="status"
            header="Status"
            body={renderStatusChip}
          ></Column>
          {/* <Column sortable field="purpose" header="Purpose of Travel"></Column>
        <Column sortable field="projectName" header="Project Name"></Column>
        <Column sortable field="city" header="City"></Column> */}
          <Column
            sortable
            field="advanceRequested"
            header="Advance Requested"
          ></Column>
          <Column sortable field="advance" header="Advance Given"></Column>
          <Column body={renderShowButton} header="View"></Column>
          <Column body={renderDownloadTicket} header="Ticket"></Column>
        </DataTable>
      </>
    );
  };

  // const uniqueTravels = travelData?.reduce((acc, item) => {
  //   if (!acc[item?.travelId]) {
  //     acc[item?.travelId] = item; // store only the first occurrence
  //   }
  //   return acc;
  // }, {});

  // const updatedTravelData = Object.values(uniqueTravels ?? []).map((travel) => {
  //   const foundPendingData = travelData?.find(
  //     (item) =>
  //       item.travelId === travel.travelId && item.status === PENDING_STATUS
  //   );

  //   return {
  //     ...travel,
  //     pending: foundPendingData ? true : false,
  //   };
  // });
  const handlerowexpand = async (data) => {
    console.log("data -> ", data);
    console.log("travelId", Object.keys(data)[0]);
    // return;
    const travelId = Object.keys(data)[0];
    let response = await getExpandableData(travelId);
    setExpandedRows(response.data);
    console.log("response", response);
  };

  // const handlerowexpand = async (data) => {
  //   console.log("data -> ", data);
  //   console.log("travelId", Object.keys(data)[0]);
  //   // return;
  //   const travelId = Object.keys(data)[0];
  //   let response = await getExpandableData(travelId);
  //   setExpandedRows(response.data);
  //   console.log("response", response);
  // };

  const updatedTravelData = activeTab === tabs[0]
    ? travelData?.filter((item) => item?.managerActionRequiredFlag)?? []
    : travelData?.filter((item) => !item?.managerActionRequiredFlag) ?? []; 
  return (
    // <div className="max-w-[85rem] mx-auto p-4 min-h-screen bg-gray-100"></div>
    <div className="max-w-[85rem] mx-auto p-4 min-h-screen bg-gray-100">
      {/* DataTable */}
      <CustomToast ref={toastRef} />
       {/* <SelectButton value={activeTab} onChange={(e) => setActiveTab(e.value)} options={tabs} /> */}
      <DataTable
        className="text-xs"
        tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
        showGridlines
        value={updatedTravelData}
        expandedRows={expandedRows}
        onRowToggle={(e) => handlerowexpand(e.data)}
        rowExpansionTemplate={() => rowExpansionTemplate(expandedRows)}
        paginator
        rows={10}
        dataKey="travelId"
        emptyMessage={
          travelData?.length === 0 ? (
            "No data found"
          ) : (
            <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
          )
        }
        header={renderHeader}
        globalFilter={globalFilter}
      >
        <Column expander />
        <Column
          field="userName"
          header="User"
          sortable
          body={(rowData) => (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {rowData.managerActionRequiredFlag && (
               <RenderPendingIcon />
              )}
              {rowData.userName}
            </div>
          )}
        />

        <Column sortable field="unsettledAmount" header="Unsettled"></Column>
        <Column sortable field="fromDate" header="From Date"></Column>
        <Column
          sortable
          field="tentativeToDate"
          header="Tentative To Date"
        ></Column>

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
          <RequisitionFormView2
            rowData={formData}
            handleApproveTravel={handleApproveTravel}
            handleRejectTravel={handleRejectTravel}
            formData={formData}
            setFormData={setFormData}
          />
        </Grid>
      </Dialog>
    </div>
  );
}
