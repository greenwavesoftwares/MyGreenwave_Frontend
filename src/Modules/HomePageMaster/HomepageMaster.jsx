import React, { useEffect, useRef, useState } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { getEventsAndNotices, deleteEventAndNotification } from "./HomePageAPI";
import { getUserData } from "../Login/Encrypt";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import "../Appraisal/Appraisal.scss";
import { Button, Chip, Fab, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CreateIcon from "@mui/icons-material/Create";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import {
  showErrorMessage,
  showWarningMessage,
} from "../../components/Toast/ShowMessage";
import { Toast } from "primereact/toast";
import EventIcon from "@mui/icons-material/Event";
import { Dialog } from "primereact/dialog";
import CreateEvent from "./CreateEvent";
import CreateNotification from "./CreateNotification";

const HomepageMaster = () => {
  //For Toast
  const toastRef = useRef(null);
  const [eventsData, setEventsData] = useState([]);
  const [notificationsData, setNotificationsData] = useState([]);
  const [visible, setVisible] = useState(false);
  const [selectRowEventData, setSelectRowEventData] = useState(null);
  const [updateEventDataProps, setUpdateEventDataProps] = useState(null);
  const [createEventDataProps, setCreateEventDataProps] = useState(null);
  //Create New Notification
  const [createNotificationDialog, setCreateNotificationDialog] =useState(false);
  //Create New Notification Dialog Close
  const [createNotificationDialogProps, setCreateNotificationDialogProps] =useState(null);

  // Function to fetch events and notices
  const getEventsAndNoticesFn = async () => {
    try {
      const { token } = getUserData();
      const response = await getEventsAndNotices(token);
      console.log("Events and Notices:", response.data);
      //Set Event Data
      setEventsData(response?.data.eventsList);
      //Set Notification DAta
      setNotificationsData(response?.data.notificationList);
    } catch (error) {
      console.log(error);
    }
  };

  //Call the function to get events and notices
  useEffect(() => {
    getEventsAndNoticesFn();
  }, [updateEventDataProps, createEventDataProps,createNotificationDialogProps]);

  //Delete Row Handle For Events
  const handelDeleteEventRow = async (rowId, title, filename) => {
    //console.log("Row ID to delete:", rowId);
    try {
      const deleteRowData = eventsData.filter((ele) => {
        return ele.rowId !== rowId;
      });
      const { token } = getUserData();
      const response = await deleteEventAndNotification(token, rowId, filename);
      //console.log("Delete Response:", response);
      if (response.status === 201) {
        showErrorMessage(toastRef, `${title}`, "Event Deleted Successfully");
        setEventsData(deleteRowData);
      }
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  //Delete Row Handle For Notifications
  const handelDeleteNotificationRow = async (rowId, title, filename) => {
    try {
      const deleteRowData = notificationsData.filter((ele) => {
        return ele.rowId !== rowId;
      });
      const { token } = getUserData();
      const response = await deleteEventAndNotification(token, rowId, filename);
      console.log("Delete Response:", response);
      if (response.status === 201) {
        showErrorMessage(
          toastRef,
          `${title}`,
          "Notification Deleted Successfully"
        );
        setNotificationsData(deleteRowData);
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      showErrorMessage(toastRef, "Error", "Failed to delete notification");
    }
  };

  //Create New Event Form
  const handelShowCreateNewEvent = () => {
    setVisible(true);
    setSelectRowEventData(null);
    console.log("Create New Event Clicked");
  };

  //Create New Notification Form
  const handelCreateNewNotification = () => {
    setCreateNotificationDialog(true);
  };

  //Edit Event Form
  const handelEditEventForm = (rowData) => {
    //console.log("Edit Event Form Clicked",rowData);
    setSelectRowEventData(rowData);
    setVisible(true);
  };

  //Edit Notification Row
  const handelNotificationRowEdit = (rowData) => {
    console.log("Edit Notification Row Clicked", rowData);
    setSelectRowEventData(rowData);
    setVisible(true);
  };


//Get Current Date in YYYY-MM-DD format
const date = new Date();
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, '0'); 
const day = String(date.getDate()).padStart(2, '0');
const formattedDate = `${year}-${month}-${day}`;

  

  console.log("Update Event Data:", updateEventDataProps);
  return (
    <div className="container mx-auto px-4">
      <div className="md:w-11/12 lg:w-11/12 xl:w-11/12 2xl:w-11/12  mx-auto">
        <div className="card mt-4 py-2 px-3">
          <div className="card">
            <TabView className="tabStyle">
              <TabPanel header="Events" leftIcon="pi pi-calendar mr-2">
                <DataTable
                  size="small"
                  stripedRows
                  className="dataTableHeader tableBorder dataTableBody dataTableBodyPadding"
                  value={eventsData}
                >
                  <Column field="title" header="Title"></Column>
                  <Column field="notification" header="Event"></Column>
                  <Column
                    style={{ width: "7rem" }}
                    field="fromdate"
                    header="Start Date"
                  ></Column>
                  <Column
                    style={{ width: "7rem" }}
                    field="toDate"
                    header="Expire Date"
                  ></Column>
                  <Column
                    header="Status"
                   // sortable 
                    body={(rowData) => {
                      return (
                        <>
                        {formattedDate >= rowData.toDate ? (
                          <Chip size="small" label="Expired" color="error" />
                        ) : (
                          <Chip size="small" label="Active" color="success" />
                          
                        )}
                        
                        </>
                      )
                    }
                  }
                      
                  ></Column>
                  <Column field="url" header="URL"></Column>
                  <Column
                    header="Edit"
                    body={(rowData) => {
                      return (
                        <IconButton
                          onClick={() => handelEditEventForm(rowData)}
                          size="small"
                          aria-label="CreateIcon"
                        >
                          <CreateIcon
                            sx={{ color: "#64b5f6", fontSize: "1.2rem" }}
                          />
                        </IconButton>
                      );
                    }}
                  ></Column>
                  <Column
                    style={{ width: "6rem" }}
                    header="Delete"
                    body={(rowData) => {
                      return (
                        <IconButton
                          onClick={(e) => {
                            handelDeleteEventRow(
                              rowData.rowId,
                              rowData.title,
                              rowData.filename
                            );
                          }}
                          size="small"
                          aria-label="DeleteIcon"
                        >
                          <DeleteIcon
                            sx={{ color: "#ff8a80", fontSize: "1.2rem" }}
                          />
                        </IconButton>
                      );
                    }}
                  ></Column>
                </DataTable>
                <div
                  style={{ position: "fixed", bottom: "2rem", right: "1.5rem" }}
                >
                  <Fab size="small" color="primary" aria-label="add">
                    <EventIcon onClick={() => handelShowCreateNewEvent()} />
                  </Fab>
                </div>
              </TabPanel>
              <TabPanel header="Notifications" leftIcon="pi pi-bell mr-2">
                <DataTable
                  value={notificationsData}
                  size="small"
                  stripedRows
                  className="dataTableHeader tableBorder dataTableBody dataTableBodyPadding"
                >
                  <Column
                    style={{ width: "10rem" }}
                    field="title"
                    header="Title"
                  ></Column>
                  <Column field="notification" header="Notification"></Column>
                  <Column
                    style={{ width: "7rem" }}
                    field="fromdate"
                    header="Start Date"
                  ></Column>
                  <Column
                    style={{ width: "7rem" }}
                    field="toDate"
                    header="Expire Date"
                  ></Column>
                    <Column
                    header="Status"
                   // sortable 
                    body={(rowData) => {
                      return (
                        <>
                        {formattedDate >= rowData.toDate ? (
                          <Chip size="small" label="Expired" color="error" />
                        ) : (
                          <Chip size="small" label="Active" color="success" />
                          
                        )}
                        
                        </>
                      )
                    }
                  }
                      
                  ></Column>
                  <Column field="url" header="URL"></Column>
                  <Column
                    header="Edit"
                    body={(rowData) => {
                      return (
                        <IconButton
                          onClick={() => handelNotificationRowEdit(rowData)}
                          size="small"
                          aria-label="CreateIcon"
                        >
                          <CreateIcon
                            sx={{ color: "#64b5f6", fontSize: "1.2rem" }}
                          />
                        </IconButton>
                      );
                    }}
                  ></Column>
                  <Column
                    style={{ width: "6rem" }}
                    header="Delete"
                    body={(rowData) => {
                      return (
                        <IconButton
                          onClick={(e) => {
                            handelDeleteNotificationRow(
                              rowData.rowId,
                              rowData.title,
                              rowData.filename
                            );
                          }}
                          size="small"
                          aria-label="DeleteIcon"
                        >
                          <DeleteIcon
                            sx={{ color: "#ff8a80", fontSize: "1.2rem" }}
                          />
                        </IconButton>
                      );
                    }}
                  ></Column>
                </DataTable>
                <div
                  style={{ position: "fixed", bottom: "2rem", right: "1.5rem" }}
                >
                  <Fab size="small" color="primary" aria-label="add">
                    <NotificationsActiveIcon
                      onClick={() => handelCreateNewNotification()}
                    />
                  </Fab>
                </div>
              </TabPanel>
            </TabView>
          </div>
        </div>
      </div>

      <Dialog
        header={selectRowEventData ? "Edit Event" : "Create New Event"}
        visible={visible}
        className="dialogHeader dialogContent"
        style={{ width: "25rem", zIndex: +99999 }}
        onHide={() => {
          if (!visible) return;
          setVisible(false);
          setSelectRowEventData(null);
        }}
      >
        <CreateEvent
          selectRowEventData={selectRowEventData}
          setVisible={setVisible}
          setUpdateEventDataProps={setUpdateEventDataProps}
          setCreateEventDataProps={setCreateEventDataProps}
        />
      </Dialog>
      <Toast ref={toastRef} />

      <Dialog
        header="Create Notification"
        visible={createNotificationDialog}
        className="dialogHeader dialogContent"
        style={{ width: "25rem" }}
        onHide={() => {
          if (!createNotificationDialog) return;
          setCreateNotificationDialog(false);
        }}
      >
        <CreateNotification setCreateNotificationDialog={setCreateNotificationDialog} 
        setCreateNotificationDialogProps={setCreateNotificationDialogProps}
        />
      </Dialog>
    </div>
  );
};
export default HomepageMaster;
