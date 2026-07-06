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
  //                        PROJECTS
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
   * Returns published projects assigned to the logged-in user with counts.
   */
  getProjectsByAssignee: async () => {
    const response = await axios.get(`${apiEndPoint}/projects/assignee`, {
      headers: getHeaders(),
    });
    return response.data;
  },

  /**
   * GET /activityTracker/projects/assigneeGroup
   * Returns projects assigned to the user's group with counts.
   */
  getProjectsByAssigneeGroup: async () => {
    const response = await axios.get(`${apiEndPoint}/projects/assigneeGroup`, {
      headers: getHeaders(),
    });
    return response.data;
  },

  /**
   * GET /activityTracker/projects/{projectId}
   * Returns details for a specific project.
   * @param {string} projectId
   */
  getProjectById: async (projectId) => {
    const response = await axios.get(`${apiEndPoint}/projects/${projectId}`, {
      headers: getHeaders(),
    });
    return response.data;
  },

  /**
   * POST /activityTracker/projects
   * Creates a new project and maps it to groups.
   * @param {Object} projectData (ProjectGroupRequest)
   * @example
   * {
   * "projectId": "string",
   * "projectName": "string",
   * "poNumber": "string",
   * "siteCustomer": "string",
   * "projectStatus": "string",
   * "createdBy": "string",
   * "createdAt": "2026-06-05T09:30:19.069Z",
   * "groupIds": ["group1", "group2"]
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
   * Updates an existing project's metadata.
   * @param {Object} projectData (Project Model)
   * @example
   * {
   * "projectId": "string",
   * "projectName": "string",
   * "poNumber": "string",
   * "siteCustomer": "string",
   * "projectStatus": "string",
   * "createdBy": "string",
   * "createdAt": "2026-06-05T09:30:19.069Z",
   * "updatedBy": "string",
   * "updatedAt": "2026-06-06T09:30:19.069Z"
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
   * Submits a project, effectively changing its status.
   * @param {string} projectId
   * @param {string} projectStatus (e.g., 'Published', 'Draft')
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
   * Deletes a project by ID.
   * @param {string} projectId
   */
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
  //                  PROJECT USER RATINGS
  // ============================================================

  /**
   * GET /activityTracker/projects/{projectId}/userRatings
   * Retrieves all user ratings for a specific project.
   * @param {string} projectId
   */
  getUserRatingsByProjectId: async (projectId) => {
    const response = await axios.get(
      `${apiEndPoint}/projects/${projectId}/userRatings`,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * GET /activityTracker/projects/userRatings
   * Retrieves user ratings for multiple projects.
   * @param {Array<string>} projectIds - Array of project IDs.
   */
  getUserRatingsByProjectIds: async (projectIds) => {
    const response = await axios.get(`${apiEndPoint}/projects/userRatings`, {
      headers: getHeaders(),
      params: { projectIds }, // Axios will serialize this array into the query string
    });
    return response.data;
  },

  /**
   * GET /activityTracker/users/{userId}/userRatings
   * Retrieves all user ratings submitted by (or for) a specific user.
   * @param {string} userId
   */
  getUserRatingsByUserId: async (userId) => {
    const response = await axios.get(
      `${apiEndPoint}/users/${userId}/userRatings`,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * GET /activityTracker/users/userRatings
   * Retrieves user ratings for multiple users.
   * @param {Array<string>} userIds - Array of user IDs.
   */
  getUserRatingsByUserIds: async (userIds) => {
    const response = await axios.get(`${apiEndPoint}/users/userRatings`, {
      headers: getHeaders(),
      params: { userIds },
    });
    return response.data;
  },

  /**
   * POST /activityTracker/userRatings/{projectId}
   * Creates a new project user rating tied to a specific project ID in the path.
   * @param {string} projectId
   * @param {Object} ratingPayload (ProjectUserRating Model)
   * @example
   * {
   * "projectId": "string",
   * "userId": "string",
   * "name": "string",
   * "rating": 5,
   * "comments": "Excellent job on the deployment",
   * "avgTimeFromTasks": 4.5,
   * "avgFulfillmentFromTasks": 5.0,
   * "avgInnovationFromTasks": 4.0,
   * "ratedAt": "2026-06-05T09:30:19.069Z",
   * "ratedBy": "ManagerName"
   * }
   */
  createProjectUserRating: async (projectId, ratingPayload) => {
    const response = await axios.post(
      `${apiEndPoint}/userRatings/${projectId}`,
      ratingPayload,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * PUT /activityTracker/userRatings/{projectId}
   * Updates an existing project user rating tied to a specific project ID in the path.
   * @param {string} projectId
   * @param {Object} ratingPayload (ProjectUserRating Model)
   */
  updateProjectUserRating: async (projectId, ratingPayload) => {
    const response = await axios.put(
      `${apiEndPoint}/userRatings/${projectId}`,
      ratingPayload,
      { headers: getHeaders() },
    );
    return response.data;
  },

  // ============================================================
  //                 PROJECT UPDATE CATEGORIES
  // ============================================================

  /**
   * GET /activityTracker/projects/{projectId}/categories
   * Retrieves all categories for a specific project.
   * @param {string} projectId
   */
  getCategoriesByProject: async (projectId) => {
    const response = await axios.get(
      `${apiEndPoint}/projects/${projectId}/categories`,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * PUT /activityTracker/projects/categories/{categoryId}
   * Updates an existing project update category.
   * @param {string} categoryId
   * @param {Object} categoryData (ProjectUpdateCategory Model)
   */
  updateCategory: async (categoryId, categoryData) => {
    const response = await axios.put(
      `${apiEndPoint}/projects/categories/${categoryId}`,
      categoryData,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * DELETE /activityTracker/projects/categories/{categoryId}
   * Deletes a project update category by its ID.
   * @param {string} categoryId
   */
  deleteCategory: async (categoryId) => {
    const response = await axios.delete(
      `${apiEndPoint}/projects/categories/${categoryId}`,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * POST /activityTracker/projects/category
   * Creates a single project update category.
   * @param {Object} categoryData (ProjectUpdateCategory Model)
   */
  createCategory: async (categoryData) => {
    const response = await axios.post(
      `${apiEndPoint}/projects/category`,
      categoryData,
      { headers: getHeaders() },
    );
    return response.data;
  },

  // Note: Update your existing createCategory to reflect bulk creation if needed,
  // or use this dedicated method for the List<ProjectUpdateCategory> endpoint.
  /**
   * POST /activityTracker/projects/categories
   * Bulk creates multiple project update categories.
   * @param {Array<Object>} categoriesData Array of ProjectUpdateCategory Models
   */
  createCategories: async (categoriesData) => {
    const response = await axios.post(
      `${apiEndPoint}/projects/categories`,
      categoriesData,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * GET /activityTracker/projects/{projectId}/updates
   * Retrieves the entire update grid (categories, snapshots, and entries) for a project.
   * @param {string} projectId
   */
  getAllUpdates: async (projectId) => {
    const response = await axios.get(
      `${apiEndPoint}/projects/${projectId}/updates`,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * GET /activityTracker/api/projects/{projectId}/updates/categories/check-name
   * Checks if a category name already exists within a project.
   * Note: The Java controller explicitly includes '/api/' in this specific route.
   * @param {string} projectId
   * @param {string} categoryName
   */
  checkCategoryNameExists: async (projectId, categoryName) => {
    const response = await axios.get(
      `${apiEndPoint}/api/projects/${projectId}/updates/categories/check-name`,
      {
        headers: getHeaders(),
        params: { name: categoryName },
      },
    );
    return response.data;
  },

  // ============================================================
  //                 PROJECT UPDATE SNAPSHOTS
  // ============================================================

  /**
   * POST /activityTracker/projects/snapshots
   * Creates a new project update snapshot.
   * @param {Object} snapshotData (ProjectUpdateSnapshot Model)
   */
  createSnapshot: async (snapshotData) => {
    const response = await axios.post(
      `${apiEndPoint}/projects/snapshots`,
      snapshotData,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * GET /activityTracker/projects/{projectId}/snapshots
   * Retrieves all snapshots for a specific project.
   * @param {string} projectId
   */
  getSnapshotsByProject: async (projectId) => {
    const response = await axios.get(
      `${apiEndPoint}/projects/${projectId}/snapshots`,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * PUT /activityTracker/projects/snapshots/{snapshotId}
   * Updates an existing project update snapshot.
   * @param {string} snapshotId
   * @param {Object} snapshotData (ProjectUpdateSnapshot Model)
   */
  updateSnapshot: async (snapshotId, snapshotData) => {
    const response = await axios.put(
      `${apiEndPoint}/projects/snapshots/${snapshotId}`,
      snapshotData,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * DELETE /activityTracker/projects/snapshots/{snapshotId}
   * Deletes a project update snapshot by its ID.
   * @param {string} snapshotId
   */
  deleteSnapshot: async (snapshotId) => {
    const response = await axios.delete(
      `${apiEndPoint}/projects/snapshots/${snapshotId}`,
      { headers: getHeaders() },
    );
    return response.data;
  },

  // ============================================================
  //                 PROJECT UPDATE NOTES
  // ============================================================

  /**
   * POST /activityTracker/projects/notes
   * Creates a new project update note.
   * @param {Object} noteData (ProjectUpdateNote Model)
   */
  createNote: async (noteData) => {
    const response = await axios.post(
      `${apiEndPoint}/projects/notes`,
      noteData,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * GET /activityTracker/projects/{projectId}/categories/{categoryId}/snapshots/{snapshotId}/notes
   * Retrieves notes for a specific cell intersection (Project + Category + Snapshot).
   * @param {string} projectId
   * @param {string} categoryId
   * @param {string} snapshotId
   */
  getNotesByCell: async (projectId, categoryId, snapshotId) => {
    const response = await axios.get(
      `${apiEndPoint}/projects/${projectId}/categories/${categoryId}/snapshots/${snapshotId}/notes`,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * GET /activityTracker/projects/snapshots/{snapshotId}/notes
   * Retrieves all notes associated with a specific snapshot.
   * @param {string} snapshotId
   */
  getNotesBySnapshot: async (snapshotId) => {
    const response = await axios.get(
      `${apiEndPoint}/projects/snapshots/${snapshotId}/notes`,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * PUT /activityTracker/projects/notes/{noteId}
   * Fully updates an existing project update note.
   * @param {string} noteId
   * @param {Object} noteData (ProjectUpdateNote Model)
   */
  updateNote: async (noteId, noteData) => {
    const response = await axios.put(
      `${apiEndPoint}/projects/notes/${noteId}`,
      noteData,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * PATCH /activityTracker/projects/notes/{noteId}/text
   * Partially updates just the text of a specific note.
   * @param {string} noteId
   * @param {string} newText (String payload)
   */
  updateNoteText: async (noteId, newText) => {
    const response = await axios.patch(
      `${apiEndPoint}/projects/notes/${noteId}/text`,
      newText,
      // Pass Content-Type text/plain if your backend treats the raw string as plain text
      { headers: { ...getHeaders(), "Content-Type": "text/plain" } },
    );
    return response.data;
  },

  /**
   * DELETE /activityTracker/projects/notes/{noteId}
   * Deletes a project update note by its ID.
   * @param {string} noteId
   */
  deleteNote: async (noteId) => {
    const response = await axios.delete(
      `${apiEndPoint}/projects/notes/${noteId}`,
      { headers: getHeaders() },
    );
    return response.data;
  },

  // ============================================================
  //                  PROJECT UPDATE SHARES
  // ============================================================

  /**
   * POST /activityTracker/projects/categories/shares
   * Creates a new project update share.
   * @param {Object} shareData (ProjectUpdateShare Model)
   */
  createShare: async (shareData) => {
    const response = await axios.post(
      `${apiEndPoint}/projects/categories/shares`,
      shareData,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * GET /activityTracker/projects/{projectId}/categories/{categoryId}/shares
   * Retrieves all shares for a specific project and category.
   * @param {string} projectId
   * @param {string} categoryId
   */
  getSharesByProjectAndCategory: async (projectId, categoryId) => {
    const response = await axios.get(
      `${apiEndPoint}/projects/${projectId}/categories/${categoryId}/shares`,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * PUT /activityTracker/projects/{projectId}/categories/{categoryId}/shares/{userId}
   * Updates an existing project update share.
   * @param {string} projectId
   * @param {string} categoryId
   * @param {string} userId
   * @param {Object} shareData (ProjectUpdateShare Model)
   */
  updateShare: async (projectId, categoryId, userId, shareData) => {
    const response = await axios.put(
      `${apiEndPoint}/projects/${projectId}/categories/${categoryId}/shares/${userId}`,
      shareData,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * DELETE /activityTracker/projects/{projectId}/categories/{categoryId}/shares/{userId}
   * Deletes a project update share by project, category, and user IDs.
   * @param {string} projectId
   * @param {string} categoryId
   * @param {string} userId
   */
  deleteShare: async (projectId, categoryId, userId) => {
    const response = await axios.delete(
      `${apiEndPoint}/projects/${projectId}/categories/${categoryId}/shares/${userId}`,
      { headers: getHeaders() },
    );
    return response.data;
  },

  // ============================================================
  //                        ACTIVITIES
  // ============================================================

  /**
   * GET /activityTracker/projects/{projectId}/activities
   * Returns all activities grouped by module for a given project.
   * @param {string} projectId
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
   * Returns activities for a specific project filtered by resource/employee.
   * @param {string} projectId
   * @param {string} resourceCode
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
   * Bulk creates activities/modules via the tree response payload.
   * @param {string} projectId
   * @param {Object} payload (ProjectActivitiesResponse DTO)
   * Expected to have project details and an array of `modules` containing `children` (activities).
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
   * Creates a single activity. The moduleId must already exist.
   * @param {string} projectId
   * @param {Object} activityData (Activity Model)
   * @example
   * {
   * "activityId": "string",
   * "projectId": "string",
   * "moduleId": "string",
   * "activityName": "string",
   * "parentActivityId": "string",
   * "resourceId": "string",
   * "plannedStart": "2026-06-05T09:33:47.392Z",
   * "durationHrs": 8.0,
   * "plannedStop": "2026-06-05T17:33:47.392Z",
   * "activityStatus": "Pending",
   * "sortOrder": 0
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
   * Updates a single activity.
   * @param {string} projectId
   * @param {Object} activityData (Activity Model with activityId present)
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
   * Gets a specific activity by its ID.
   * @param {string} activityId
   */
  getActivity: async (activityId) => {
    const response = await axios.get(
      `${apiEndPoint}/activities/${activityId}`,
      {
        headers: getHeaders(),
      },
    );
    return response.data;
  },

  /**
   * DELETE /activityTracker/activities/{activityId}
   * Deletes a specific activity.
   * @param {string} activityId
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
   * Updates the status of an activity, managing pause/resume logic.
   * @param {string} activityId
   * @param {Object} statusPayload (ActivityStatus DTO)
   * @example
   * {
   * "status": "Running", // Not Ready | Pending | Running | Paused | Completed
   * "actualTime": "2026-06-05T09:35:19.717Z"
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
   * Checks if a user has activities pending between dates.
   * @param {string} userId
   * @param {string} fromDate (Timestamp)
   * @param {string} toDate (Timestamp)
   * @returns {boolean}
   */
  isUserHasPendingActivity: async (userId, fromDate, toDate) => {
    const response = await axios.get(
      `${apiEndPoint}/isUserHasPendingActivity`,
      {
        headers: getHeaders(),
        params: { userId, fromDate, toDate },
      },
    );
    return response.data;
  },

  // ============================================================
  //                  ACTIVITY REJECTIONS
  // ============================================================

  /**
   * POST /activityTracker/activities/reject/{activityId}
   * Logs a rejection reason for an activity.
   * @param {string} activityId
   * @param {string} reason
   * @example Payload Sent: { "reason": "Incorrect planned hours" }
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
   * Gets the rejection history for an activity.
   * @param {string} activityId
   * @returns Array of ActivityReject model
   */
  getActivityRejections: async (activityId) => {
    const response = await axios.get(
      `${apiEndPoint}/activities/${activityId}/rejections`,
      { headers: getHeaders() },
    );
    return response.data;
  },

  // ============================================================
  //                    ACTIVITY PAUSES
  // ============================================================

  /**
   * GET /activityTracker/activities/{activityId}/pauses
   * Gets the pause/resume history for an activity.
   * @param {string} activityId
   * @returns Array of ActivityPauses model
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
   * Deletes all pause records for an activity.
   * @param {string} activityId
   */
  deleteActivityPauses: async (activityId) => {
    const response = await axios.delete(
      `${apiEndPoint}/activities/${activityId}/pauses`,
      { headers: getHeaders() },
    );
    return response.data;
  },

  // ============================================================
  //                        COMMENTS
  // ============================================================

  /**
   * GET /activityTracker/projects/{projectId}/comments
   * Gets all flat comments for a project.
   * @param {string} projectId
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
   * Gets all flat comments for a specific activity within a project.
   * @param {string} projectId
   * @param {string} activityId
   */
  getCommentsByActivity: async (projectId, activityId) => {
    const response = await axios.get(
      `${apiEndPoint}/projects/${projectId}/activity/${activityId}/comments`,
      { headers: getHeaders() },
    );
    return response.data;
  },

  getCommentsAndReplies: async (projectId) => {
    const response = await axios.get(
      `${apiEndPoint}/projects/${projectId}/commentReplyTree`,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * POST /activityTracker/projects/{projectId}/comments
   * Adds a new comment to a project/activity.
   * @param {string} projectId
   * @param {Object} commentPayload (Comment Model)
   * @example
   * {
   * "commentDescription": "string",
   * "commentType": "string",
   * "resolutionDate": "2026-06-05", // SQL Date
   * "responsibility": "string",
   * "activityId": "string",
   * "moduleId": "string",
   * "actionPoint": "string",
   * "others": "string",
   * "attachmentBase64": "base64string", // Transient file bytes
   * "attachmentName": "file.pdf", // Transient file name
   * "createdBy": "string",
   * "createdAt": "2026-06-05T09:37:04.818Z"
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

  /**
   * DELETE /activityTracker/comments/{commentId}
   * Deletes a specific comment.
   * @param {string} commentId
   */
  deleteComment: async (commentId) => {
    const response = await axios.delete(
      `${apiEndPoint}/comments/${commentId}`,
      {
        headers: getHeaders(),
      },
    );
    return response.data;
  },

  /**
   * GET /activityTracker/projects/{projectId}/commentReplyTree
   * Gets comments and their corresponding replies mapped in a tree format for a whole project.
   * @param {string} projectId
   * @returns Array of CommentReplyTree DTO
   */
  getCommentReplyTreeByProjectId: async (projectId) => {
    const response = await axios.get(
      `${apiEndPoint}/projects/${projectId}/commentReplyTree`,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * GET /activityTracker/projects/{projectId}/commentReplyTree/{activityId}
   * Gets comments and their replies in a tree format for a specific activity.
   * @param {string} projectId
   * @param {string} activityId
   * @returns Array of CommentReplyTree DTO
   */
  getCommentReplyTreeByProjectIdAndActivityId: async (
    projectId,
    activityId,
  ) => {
    const response = await axios.get(
      `${apiEndPoint}/projects/${projectId}/commentReplyTree/${activityId}`,
      { headers: getHeaders() },
    );
    return response.data;
  },

  // ============================================================
  //                        REPLIES
  // ============================================================

  /**
   * GET /activityTracker/comments/{commentId}/replies
   * Gets all flat replies belonging to a specific comment.
   * @param {string} commentId
   */
  getReplies: async (commentId) => {
    const response = await axios.get(
      `${apiEndPoint}/comments/${commentId}/replies`,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * POST /activityTracker/comments/{commentId}/replies
   * Adds a reply to a comment.
   * @param {string} commentId
   * @param {Object} replyPayload (Reply Model)
   * @example
   * {
   * "replyText": "string",
   * "createdBy": "string",
   * "createdAt": "2026-06-17T09:00:00.000Z",
   * "attachmentBase64": "base64string", // Transient
   * "attachmentName": "file.pdf" // Transient
   * }
   */
  addReply: async (commentId, replyPayload) => {
    const response = await axios.post(
      `${apiEndPoint}/comments/${commentId}/replies`,
      replyPayload,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * DELETE /activityTracker/replies/{replyId}
   * Deletes a specific reply.
   * @param {string} replyId
   */
  deleteReply: async (replyId) => {
    const response = await axios.delete(`${apiEndPoint}/replies/${replyId}`, {
      headers: getHeaders(),
    });
    return response.data;
  },

  // ============================================================
  //                     ACTIVITY TREE
  // ============================================================

  /**
   * POST /activityTracker/postActivityTree
   * Upserts a full project tree (project + groups + activities + comments) in one call.
   * @param {Object} projectTreePayload (ProjectTreeDTO)
   * @example
   * {
   * "id": "PRJ001",
   * "project": "Project A",
   * "po": "PO123",
   * "site": "ABC Corp",
   * "status": "draft",
   * "groups": ["G1", "G2"],
   * "rows": [
   * {
   * "id": "ACT001",
   * "parentId": null,
   * "moduleId": "MOD001",
   * "module": "Electrical",
   * "task": "Cable Laying",
   * "resource": "EMP001",
   * "plannedStart": "2026-06-05T09:00:00.000Z",
   * "durationHrs": 8,
   * "status": "pending",
   * "comments": []
   * }
   * ]
   * }
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
   * Returns all ProjectTreeDTOs for all projects in the system.
   * @returns Array of ProjectTreeDTO
   */
  getActivityTree: async () => {
    const response = await axios.get(`${apiEndPoint}/getActivityTree`, {
      headers: getHeaders(),
    });
    return response.data;
  },

  /**
   * GET /activityTracker/getActivityTreeByUser
   * Returns all ProjectTreeDTOs applicable to the logged-in user.
   * @returns Array of ProjectTreeDTO
   */
  getActivityTreeByUser: async () => {
    const response = await axios.get(`${apiEndPoint}/getActivityTreeByUser`, {
      headers: getHeaders(),
    });
    return response.data;
  },

  /**
   * GET /activityTracker/getActivityTreeCreatedByUser
   * Returns all ProjectTreeDTOs that were explicitly created by the logged-in user.
   * @returns Array of ProjectTreeDTO
   */
  getActivityTreeCreatedByUser: async () => {
    const response = await axios.get(
      `${apiEndPoint}/getActivityTreeCreatedByUser`,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * GET /activityTracker/getNonPublishedActivityTreesByUser
   * Returns ProjectTreeDTOs for the user that are NOT yet in 'Published' status.
   * @returns Array of ProjectTreeDTO
   */
  getNonPublishedActivityTreesByUser: async () => {
    const response = await axios.get(
      `${apiEndPoint}/getNonPublishedActivityTreesByUser`,
      { headers: getHeaders() },
    );
    return response.data;
  },

  // ============================================================
  //                         FILES
  // ============================================================

  /**
   * GET /activityTracker/minIoFile
   * Downloads an attachment securely via MinIO.
   * @param {string} minioKey - The unique key/filename generated in MinIO
   * @param {string} bucketName - The specific MinIO bucket (e.g. comments, replies)
   * @returns {Blob} Binary file data for download/rendering
   */
  getMinIoFile: async (minioKey, bucketName) => {
    const response = await axios.get(`${apiEndPoint}/minIoFile`, {
      headers: getHeaders(),
      params: { minioKey, bucketName },
      responseType: "blob",
    });
    return response.data;
  },

  // ============================================================
  //                   USER GROUPS / ADMIN
  // ============================================================

  /**
   * GET /admin/getallgroups
   * Fetches all user groups from the admin API.
   * Note: Hits the main host path, not the activityTracker subset.
   */
  getAllGroups: async () => {
    const response = await axios.get(`${host}admin/getallgroups`, {
      headers: getHeaders(),
    });
    return response.data;
  },

  /**
   * POST /admin/getUserIdAndLeavesBygroupIds
   * Gets user IDs and leaf nodes based on provided group IDs.
   * Note: Hits the main host path, not the activityTracker subset.
   * @param {Array<string>} groupIds
   * @example ["groupId1", "groupId2"]
   */
  getUserIdAndLeavesBygroupIds: async (groupIds) => {
    const response = await axios.post(
      `${host}admin/getUserIdAndLeavesBygroupIds`,
      groupIds,
      { headers: getHeaders() },
    );
    return response.data;
  },

  /**
   * GET /admin/getLeavesByUserId/{userId}
   * Gets user ID and leaf nodes based on provided user ID.
   * Note: Hits the main host path, not the activityTracker subset.
   * @param {string} userId
   */
  getLeavesByUserId: async (userId) => {
    const response = await axios.get(
      `${host}admin/getLeavesByUserId/${userId}`,
      {
        headers: getHeaders(),
      },
    );
    return response.data;
  },

  /**
   * GET /admin/getLeavesWithHolidaysByUserId/{userId}
   * Gets user ID and leaf nodes based on provided user ID.
   * Note: Hits the main host path, not the activityTracker subset.
   * @param {string} userId
   */
  getLeavesWithHolidaysByUserId: async (userId) => {
    const response = await axios.get(
      `${host}admin/getLeavesWithHolidaysByUserId/${userId}`,
      {
        headers: getHeaders(),
      },
    );
    return response.data;
  },
};

export default activityTrackerApi;
