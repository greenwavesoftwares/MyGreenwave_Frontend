// src/api/activityTrackerApi.js
import axios from "axios";
import { getUserData } from "../Modules/Login/Encrypt";

const host = import.meta.env.VITE_END_POINT;
const apiEndPoint = host + "activityTracker";
const token = `Bearer ${getUserData()?.token}`;

const activityTrackerApi = {
  // ------------------------------------------------------------------
  // PROJECTS
  // ------------------------------------------------------------------

  getProjects: async () => {
    const response = await axios.get(`${apiEndPoint}/projects`, {
      headers: {
        Authorization: token,
      },
    });
    return response.data;
  },

  getProjectById: async (projectId) => {
    const response = await axios.get(`${apiEndPoint}/projects/${projectId}`, {
      headers: {
        Authorization: token,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  createProject: async (projectData) => {
    const response = await axios.post(`${apiEndPoint}/projects`, projectData, {
      headers: {
        Authorization: token,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  updateProject: async (projectData) => {
    const response = await axios.put(`${apiEndPoint}/projects`, projectData, {
      headers: {
        Authorization: token,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  submitProject: async (projectId, projectStatus) => {
    const response = await axios.put(
      `${apiEndPoint}/projects/${projectId}/submit/${projectStatus}`,
      {
        headers: {
          Authorization: token,
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },

  // ------------------------------------------------------------------
  // ACTIVITIES
  // ------------------------------------------------------------------

  getAllActivities: async (projectId) => {
    const response = await axios.get(
      `${apiEndPoint}/projects/${projectId}/activities`,
      {
        headers: {
          Authorization: token,
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },

  getActivitiesByResource: async (projectId, resourceCode) => {
    const response = await axios.get(
      `${apiEndPoint}/projects/${projectId}/activities/${resourceCode}`,
      {
        headers: {
          Authorization: token,
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },

  createActivities: async (projectId, activitiesPayload) => {
    const response = await axios.post(
      `${apiEndPoint}/projects/${projectId}/activities`,
      activitiesPayload,
      {
        headers: {
          Authorization: token,
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  },

  updateActivity: async (projectId, activityData) => {
    const response = await axios.put(
      `${apiEndPoint}/activities/${projectId}`,
      activityData,
      {
        headers: {
          Authorization: token,
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  },

  updateActivityStatus: async (activityId, statusPayload) => {
    const response = await axios.patch(
      `${apiEndPoint}/activities/${activityId}/status`,
      statusPayload,
      {
        headers: {
          Authorization: token,
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  },

  deleteActivity: async (activityId) => {
    const response = await axios.delete(
      `${apiEndPoint}/activities/${activityId}`,
      {
        headers: {
          Authorization: token,
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  },

  rejectActivity: async (activityId, reason) => {
    const response = await axios.post(
      `${apiEndPoint}/activities/reject/${activityId}`,
      { reason },
      {
        headers: {
          Authorization: token,
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  },

  // ------------------------------------------------------------------
  // COMMENTS
  // ------------------------------------------------------------------

  getComments: async (projectId) => {
    const response = await axios.get(
      `${apiEndPoint}/projects/${projectId}/comments`,
    );

    return response.data;
  },

  addComment: async (projectId, commentPayload) => {
    const response = await axios.post(
      `${apiEndPoint}/projects/${projectId}/comments`,
      commentPayload,
      {
        headers: {
          Authorization: token,
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  },
};

export default activityTrackerApi;
