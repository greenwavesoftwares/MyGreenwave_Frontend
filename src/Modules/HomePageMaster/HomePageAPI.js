import axios from "axios";
const endPoint = import.meta.env.VITE_END_POINT;

//Get all events and notifications
const getEventsAndNotices = async (token) => {
  try {
    const response = await axios.get(
      `${endPoint}homepagemaster/all-event-or-notification`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response;
  } catch (error) {
    console.error("Error fetching events and notices:", error);
  }
};

//Delete Event or Notification
const deleteEventAndNotification = async (token, rowId, filename) => {
  console.log("header", token, rowId);
  try {
    const response = await axios.delete(
      `${endPoint}homepagemaster/delete-event-or-notification?rowid=${rowId}&filename=${filename}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response;
  } catch (error) {
    console.error("Error deleting event:", error);
  }
};

//Update Event or Notification
const putUpdateEvent = async (token, rowData) => {
  try {
    const response = await axios.put(
      `${endPoint}homepagemaster/update-event-or-notification`,
      rowData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response;
  } catch (error) {
    console.error("Error updating event:", error);
    throw error;
  }
};

//Crate Only Event 
const postCreateEvent = async (token, data, ) => {
 console.log("postCreateEventAndNotificationData:", data);
  try {
    const response = await axios.post(
      `${endPoint}homepagemaster/save-event-or-image-upload`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response;
  } catch (error) {
    console.log("Error creating event:", error);
  }
};


//Create Only Notification
const postCreateNotification = async (token, data) => {
  try {
    const response = await axios.post(
      `${endPoint}homepagemaster/save-notification`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response;
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};
export {
  getEventsAndNotices,
  deleteEventAndNotification,
  putUpdateEvent,
  postCreateEvent,
  postCreateNotification
};
