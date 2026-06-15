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

  /**
   * GET /activityTracker/projects
   * Returns all projects belonging to the logged-in user's groups.
   */
  getProjects: async () => {
    const response = await axios.get(`${apiEndPoint}/projects`, {
      headers: getHeaders(),
    });
    return response.data;
  },

  /**
   * GET /activityTracker/projects/assignee
   * Returns published projects assigned to the logged-in user.
   */
  getProjectsByAssignee: async () => {
    const response = await axios.get(`${apiEndPoint}/projects/assignee`, {
      headers: getHeaders(),
    });
    return response.data;
  },

  /**
   * GET /activityTracker/projects/{projectId}
   */
  getProjectById: async (projectId) => {
    const response = await axios.get(`${apiEndPoint}/projects/${projectId}`, {
      headers: getHeaders(),
    });
    return response.data;
  },

  /**
   * POST /activityTracker/projects
   * Body:
   * {
   *   "projectId": "PRJ001",
   *   "projectName": "Project A",
   *   "poNumber": "PO123",
   *   "siteCustomer": "ABC",
   *   "projectStatus": "Draft",
   *   "createdBy": "admin",
   *   "createdAt": "2026-06-05T09:30:19.069Z",
   *   "groupIds": ["G1", "G2"]
   * }
   */
  createProject: async (projectData) => {
    const response = await axios.post(`${apiEndPoint}/projects`, projectData, {
      headers: getHeaders(),
    });
    return response.data;
  },

  /**
   * PUT /activityTracker/projects
   * Body:
   * {
   *   "projectId": "PRJ001",
   *   "projectName": "Updated Name",
   *   "poNumber": "PO123",
   *   "siteCustomer": "ABC",
   *   "projectStatus": "Draft",
   *   "updatedBy": "admin"
   * }
   */
  updateProject: async (projectData) => {
    const response = await axios.put(`${apiEndPoint}/projects`, projectData, {
      headers: getHeaders(),
    });
    return response.data;
  },

  /**
   * PUT /activityTracker/projects/{projectId}/submit/{projectStatus}
   */
  submitProject: async (projectId, projectStatus) => {
    const response = await axios.put(
      `${apiEndPoint}/projects/${projectId}/submit/${projectStatus}`,
      {},
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * DELETE /activityTracker/projects/{projectId}
   */
  deleteProject: async (projectId) => {
    const response = await axios.delete(
      `${apiEndPoint}/projects/${projectId}`,
      { headers: getHeaders() },
    );
    return response.data;
  },

  // ============================================================
  // ACTIVITIES
  // ============================================================

  /**
   * GET /activityTracker/projects/{projectId}/activities
   * Returns all activities grouped by module.
   */
  getAllActivities: async (projectId) => {
    const response = await axios.get(
      `${apiEndPoint}/projects/${projectId}/activities`,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * GET /activityTracker/projects/{projectId}/activities/{resourceCode}
   * Returns activities filtered by resourceId/resourceCode.
   */
  getActivitiesByResource: async (projectId, resourceCode) => {
    const response = await axios.get(
      `${apiEndPoint}/projects/${projectId}/activities/${resourceCode}`,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * POST /activityTracker/projects/{projectId}/activities
   * Body: ProjectActivitiesResponse (modules → children tree)
   */
  createActivities: async (projectId, payload) => {
    const response = await axios.post(
      `${apiEndPoint}/projects/${projectId}/activities`,
      payload,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * POST /activityTracker/projects/{projectId}/activity
   * Creates a single activity. moduleId must be set inside the body —
   * the module must already exist (moduleId FK).
   * Body:
   * {
   *   "activityId": "ACT001",
   *   "moduleId": "MOD001",
   *   "activityName": "Cable Laying",
   *   "resourceId": "EMP001",
   *   "plannedStart": "2026-06-05T09:33:47.392Z",
   *   "plannedStop": "2026-06-05T17:33:47.392Z",
   *   "durationHrs": 8,
   *   "activityStatus": "pending"
   * }
   */
  createActivity: async (projectId, activityData) => {
    const response = await axios.post(
      `${apiEndPoint}/projects/${projectId}/activity`,
      activityData,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * PUT /activityTracker/activities/{projectId}
   * Body: Activity object with activityId set.
   */
  updateActivity: async (projectId, activityData) => {
    const response = await axios.put(
      `${apiEndPoint}/activities/${projectId}`,
      activityData,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * GET /activityTracker/activities/{activityId}
   */
  getActivity: async (activityId) => {
    const response = await axios.get(
      `${apiEndPoint}/activities/${activityId}`,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * DELETE /activityTracker/activities/{activityId}
   */
  deleteActivity: async (activityId) => {
    const response = await axios.delete(
      `${apiEndPoint}/activities/${activityId}`,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * PATCH /activityTracker/activities/{activityId}/status
   * Body:
   * {
   *   "status": "Running",       // Not Ready | Pending | Running | Paused | Completed
   *   "actualTime": "2026-06-05T09:35:19.717Z"
   * }
   */
  updateActivityStatus: async (activityId, statusPayload) => {
    const response = await axios.patch(
      `${apiEndPoint}/activities/${activityId}/status`,
      statusPayload,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * GET /activityTracker/isUserHasPendingActivity
   * Query params: userId, fromDate, toDate
   * Returns: boolean
   */
  isUserHasPendingActivity: async (userId, fromDate, toDate) => {
    const response = await axios.get(
      `${apiEndPoint}/isUserHasPendingActivity`,
      {
        headers: getHeaders(),
        params: {
          userId,
          fromDate,
          toDate,
        },
      },
    );
    return response.data;
  },

  // ============================================================
  // ACTIVITY REJECTIONS
  // ============================================================

  /**
   * POST /activityTracker/activities/reject/{activityId}
   * Body: { "reason": "Incorrect planned hours" }
   */
  rejectActivity: async (activityId, reason) => {
    const response = await axios.post(
      `${apiEndPoint}/activities/reject/${activityId}`,
      { reason },
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * GET /activityTracker/activities/{activityId}/rejections
   */
  getActivityRejections: async (activityId) => {
    const response = await axios.get(
      `${apiEndPoint}/activities/${activityId}/rejections`,
      { headers: getHeaders() },
    );
    return response.data;
  },

  // ============================================================
  // ACTIVITY PAUSES
  // ============================================================

  /**
   * GET /activityTracker/activities/{activityId}/pauses
   */
  getActivityPauses: async (activityId) => {
    const response = await axios.get(
      `${apiEndPoint}/activities/${activityId}/pauses`,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * DELETE /activityTracker/activities/{activityId}/pauses
   */
  deleteActivityPauses: async (activityId) => {
    const response = await axios.delete(
      `${apiEndPoint}/activities/${activityId}/pauses`,
      { headers: getHeaders() },
    );
    return response.data;
  },

  // ============================================================
  // COMMENTS
  // ============================================================

  /**
   * GET /activityTracker/projects/{projectId}/comments
   */
  getComments: async (projectId) => {
    const response = await axios.get(
      `${apiEndPoint}/projects/${projectId}/comments`,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * GET /activityTracker/projects/{projectId}/activity/{activityId}/comments
   */
  getCommentsByActivity: async (projectId, activityId) => {
    const response = await axios.get(
      `${apiEndPoint}/projects/${projectId}/activity/${activityId}/comments`,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * POST /activityTracker/projects/{projectId}/comments
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
   *   "createdBy": "admin",
   *   "createdAt": "2026-06-05T09:37:04.818Z"
   * }
   */
  addComment: async (projectId, commentPayload) => {
    const response = await axios.post(
      `${apiEndPoint}/projects/${projectId}/comments`,
      commentPayload,
      { headers: getHeaders() },
    );
    return response.data;
  },

  // ============================================================
  // ACTIVITY TREE
  // ============================================================

  /**
   * POST /activityTracker/postActivityTree
   * Upserts a full project tree (project + groups + activities + comments) in one call.
   * Body: ProjectTreeDTO
   * {
   *   "id": "PRJ001",
   *   "project": "Project A",
   *   "po": "PO123",
   *   "site": "ABC Corp",
   *   "status": "draft",
   *   "groups": ["G1", "G2"],
   *   "rows": [
   *     {
   *       "id": "ACT001",
   *       "parentId": null,
   *       "moduleId": "MOD001",
   *       "module": "Electrical",
   *       "task": "Cable Laying",
   *       "resource": "EMP001",
   *       "plannedStart": "2026-06-05T09:00:00.000Z",
   *       "plannedStop": "2026-06-05T17:00:00.000Z",
   *       "durationHrs": 8,
   *       "status": "pending",
   *       "sortOrder": 0,
   *       "comments": []
   *     }
   *   ]
   * }
   * Response: true (boolean)
   */
  postActivityTree: async (projectTreePayload) => {
    const response = await axios.post(
      `${apiEndPoint}/postActivityTree`,
      projectTreePayload,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * GET /activityTracker/getActivityTree
   * Returns all ProjectTreeDTOs for the logged-in user's groups.
   * Response: List<ProjectTreeDTO> or 204 No Content
   */
  getActivityTree: async () => {
    const response = await axios.get(`${apiEndPoint}/getActivityTree`, {
      headers: getHeaders(),
    });
    return response.data;
  },

  // ============================================================
  // USER GROUPS / ADMIN
  // ============================================================

  /**
   * GET /admin/getallgroups
   */
  getAllGroups: async () => {
    const response = await axios.get(`${host}admin/getallgroups`, {
      headers: getHeaders(),
    });
    return response.data;
  },

  /**
   * POST /admin/getUserIdAndLeavesBygroupIds
   * Body: ["groupId1", "groupId2"]
   */
  getUserIdAndLeavesBygroupIds: async (groupIds) => {
    const response = await axios.post(
      `${host}admin/getUserIdAndLeavesBygroupIds`,
      groupIds,
      { headers: getHeaders() },
    );
    return response.data;
  },
};

export default activityTrackerApi;
