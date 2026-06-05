// src/api/activityTrackerApi.js

import axios from "axios";
import { getUserData } from "../Modules/Login/Encrypt";

const host = import.meta.env.VITE_END_POINT;
const apiEndPoint = `${host}activityTracker`;

const getHeaders = () => ({
  Authorization: `Bearer ${getUserData()?.token}`,
  "Content-Type": "application/json",
});

const activityTrackerApi = {
  // ============================================================
  // PROJECTS
  // ============================================================

  getProjects: async () => {
    const response = await axios.get(`${apiEndPoint}/projects`, {
      headers: getHeaders(),
    });
    return response.data;
  },

  getProjectById: async (projectId) => {
    const response = await axios.get(`${apiEndPoint}/projects/${projectId}`, {
      headers: getHeaders(),
    });
    return response.data;
  },

  /**
   * Body:
   * {
   *   "projectId": "PRJ001",
   *   "projectName": "Project A",
   *   "poNumber": "PO123",
   *   "siteCustomer": "ABC",
   *   "projectStatus": "Draft",
   *   "groupIds": ["G1","G2"]
   * }
   */
  createProject: async (projectData) => {
    const response = await axios.post(`${apiEndPoint}/projects`, projectData, {
      headers: getHeaders(),
    });
    return response.data;
  },

  /**
   * Body:
   * {
   *   "projectId": "PRJ001",
   *   "projectName": "Updated Name",
   *   "poNumber": "PO123",
   *   "siteCustomer": "ABC",
   *   "projectStatus": "Draft"
   * }
   */
  updateProject: async (projectData) => {
    const response = await axios.put(`${apiEndPoint}/projects`, projectData, {
      headers: getHeaders(),
    });
    return response.data;
  },

  submitProject: async (projectId, projectStatus) => {
    const response = await axios.put(
      `${apiEndPoint}/projects/${projectId}/submit/${projectStatus}`,
      {},
      {
        headers: getHeaders(),
      },
    );
    return response.data;
  },

  deleteProject: async (projectId) => {
    const response = await axios.delete(
      `${apiEndPoint}/projects/${projectId}`,
      {
        headers: getHeaders(),
      },
    );
    return response.data;
  },

  // ============================================================
  // ACTIVITIES
  // ============================================================

  getAllActivities: async (projectId) => {
    const response = await axios.get(
      `${apiEndPoint}/projects/${projectId}/activities`,
      {
        headers: getHeaders(),
      },
    );
    return response.data;
  },

  getActivitiesByResource: async (projectId, resourceCode) => {
    const response = await axios.get(
      `${apiEndPoint}/projects/${projectId}/activities/${resourceCode}`,
      {
        headers: getHeaders(),
      },
    );
    return response.data;
  },

  /**
   * Body:
   * ProjectActivitiesResponse
   */
  createActivities: async (projectId, payload) => {
    const response = await axios.post(
      `${apiEndPoint}/projects/${projectId}/activities`,
      payload,
      {
        headers: getHeaders(),
      },
    );
    return response.data;
  },

  /**
   * POST /projects/{projectId}/activity/{moduleName}
   *
   * Body:
   * {
   *   "activityName": "Cable Laying",
   *   "resourceId": "EMP001",
   *   "resourceName": "John",
   *   "plannedStart": "2026-06-05T09:33:47.392Z",
   *   "plannedStop": "2026-06-05T17:33:47.392Z",
   *   "durationHrs": 8,
   *   "activityStatus": "Not Ready"
   * }
   */
  createActivity: async (projectId, moduleName, activityData) => {
    const response = await axios.post(
      `${apiEndPoint}/projects/${projectId}/activity/${moduleName}`,
      activityData,
      {
        headers: getHeaders(),
      },
    );
    return response.data;
  },

  /**
   * Body:
   * Activity object
   */
  updateActivity: async (projectId, activityData) => {
    const response = await axios.put(
      `${apiEndPoint}/activities/${projectId}`,
      activityData,
      {
        headers: getHeaders(),
      },
    );
    return response.data;
  },

  getActivity: async (activityId) => {
    const response = await axios.get(
      `${apiEndPoint}/activities/${activityId}`,
      {
        headers: getHeaders(),
      },
    );
    return response.data;
  },

  deleteActivity: async (activityId) => {
    const response = await axios.delete(
      `${apiEndPoint}/activities/${activityId}`,
      {
        headers: getHeaders(),
      },
    );
    return response.data;
  },

  /**
   * Body:
   * {
   *   "status": "Running",
   *   "actualTime": "2026-06-05T09:35:19.717Z"
   * }
   *
   * Allowed status:
   * Not Ready
   * Pending
   * Running
   * Paused
   * Completed
   */
  updateActivityStatus: async (activityId, statusPayload) => {
    const response = await axios.patch(
      `${apiEndPoint}/activities/${activityId}/status`,
      statusPayload,
      {
        headers: getHeaders(),
      },
    );
    return response.data;
  },

  // ============================================================
  // ACTIVITY REJECTIONS
  // ============================================================

  /**
   * Body:
   * {
   *   "reason": "Incorrect planned hours"
   * }
   */
  rejectActivity: async (activityId, reason) => {
    const response = await axios.post(
      `${apiEndPoint}/activities/reject/${activityId}`,
      { reason },
      {
        headers: getHeaders(),
      },
    );
    return response.data;
  },

  getActivityRejections: async (activityId) => {
    const response = await axios.get(
      `${apiEndPoint}/activities/${activityId}/rejections`,
      {
        headers: getHeaders(),
      },
    );
    return response.data;
  },

  // ============================================================
  // ACTIVITY PAUSES
  // ============================================================

  getActivityPauses: async (activityId) => {
    const response = await axios.get(
      `${apiEndPoint}/activities/${activityId}/pauses`,
      {
        headers: getHeaders(),
      },
    );
    return response.data;
  },

  deleteActivityPauses: async (activityId) => {
    const response = await axios.delete(
      `${apiEndPoint}/activities/${activityId}/pauses`,
      {
        headers: getHeaders(),
      },
    );
    return response.data;
  },

  // ============================================================
  // COMMENTS
  // ============================================================

  getComments: async (projectId) => {
    const response = await axios.get(
      `${apiEndPoint}/projects/${projectId}/comments`,
      {
        headers: getHeaders(),
      },
    );
    return response.data;
  },

  /**
   * Body:
   * {
   *   "projectId": "PRJ001",
   *   "commentDescription": "Issue found",
   *   "commentType": "Observation",
   *   "resolutionDate": "2026-06-05T09:37:04.818Z",
   *   "responsibility": "Site Team",
   *   "activityId": "ACT001",
   *   "moduleId": "MOD001",
   *   "actionPoint": "Fix alignment",
   *   "others": "",
   *   "attachMent": "",
   *   "createdBy": "admin"
   * }
   */
  addComment: async (projectId, commentPayload) => {
    const response = await axios.post(
      `${apiEndPoint}/projects/${projectId}/comments`,
      commentPayload,
      {
        headers: getHeaders(),
      },
    );
    return response.data;
  },

  // ============================================================
  // User Groups
  // ============================================================

  getAllGroups: async () => {
    const response = await axios.get(`${host}admin/getallgroups`, {
      headers: getHeaders(),
    });
    return response.data;
  },

  // Body:
  //   [
  // 	  "string"
  // 	]
  getUserIdAndLeavesBygroupIds: async (groupIds) => {
    const response = await axios.post(
      `${host}admin/getUserIdAndLeavesBygroupIds`,
      groupIds,
      {
        headers: getHeaders(),
      },
    );
    return response.data;
  },
};

export default activityTrackerApi;
