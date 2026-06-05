// src/examples/exampleUsage.js

import activityTrackerApi from "./activityTrackerApi";

// ------------------------------------------------------------
// STORE JWT TOKEN
// ------------------------------------------------------------

localStorage.setItem("jwtToken", "YOUR_JWT_TOKEN_HERE");

// ------------------------------------------------------------
// GET PROJECTS
// ------------------------------------------------------------

export const fetchProjects = async () => {
  try {
    const projects = await activityTrackerApi.getProjects();

    console.log("||||||||||||||||Projects:", projects);
  } catch (error) {
    console.error("||||||||||||||||", error);
  }
};

// ------------------------------------------------------------
// CREATE PROJECT
// ------------------------------------------------------------

export const createProject = async () => {
  const payload = {
    projectId: "PRJ001",
    projectName: "Solar Plant Installation",
    poNumber: "PO-2026-1001",
    siteCustomer: "ABC Industries",
    projectStatus: "TODO",
    createdBy: "admin",
  };

  try {
    const response = await activityTrackerApi.createProject(payload);

    console.log("||||||||||||||||Create Project Response:", response);
  } catch (error) {
    console.error("||||||||||||||||", error);
  }
};

// ------------------------------------------------------------
// CREATE ACTIVITIES
// ------------------------------------------------------------

export const createActivities = async () => {
  const payload = {
    modules: [
      {
        id: "MOD001",
        name: "Electrical",
        children: [
          {
            id: "ACT001",
            name: "Cable Laying",
            resourceName: "John",
            plannedStart: "2026-06-04T09:00:00",
            plannedStop: "2026-06-04T18:00:00",
            durationHrs: 9,
            activityStatus: "TODO",
            children: [
              {
                id: "SUB001",
                name: "Underground Cabling",
                resourceName: "Mike",
                plannedStart: "2026-06-04T10:00:00",
                plannedStop: "2026-06-04T13:00:00",
                durationHrs: 3,
                activityStatus: "TODO",
              },
            ],
          },
        ],
      },
    ],
  };

  try {
    const response = await activityTrackerApi.createActivities(
      "PRJ001",
      payload,
    );

    console.log("||||||||||||||||Activities Created:", response);
  } catch (error) {
    console.error("||||||||||||||||", error);
  }
};

// ------------------------------------------------------------
// UPDATE ACTIVITY STATUS
// ------------------------------------------------------------

export const updateStatus = async () => {
  const payload = {
    status: "IN_PROGRESS",
    actualTime: new Date(),
  };

  try {
    const response = await activityTrackerApi.updateActivityStatus(
      "ACT001",
      payload,
    );

    console.log("||||||||||||||||Status Updated:", response);
  } catch (error) {
    console.error("||||||||||||||||", error);
  }
};

// ------------------------------------------------------------
// REJECT ACTIVITY
// ------------------------------------------------------------

export const rejectActivity = async () => {
  try {
    const response = await activityTrackerApi.rejectActivity(
      "ACT001",
      "Incorrect wiring installation",
    );

    console.log("||||||||||||||||Rejected:", response);
  } catch (error) {
    console.error("||||||||||||||||", error);
  }
};

// ------------------------------------------------------------
// ADD COMMENT
// ------------------------------------------------------------

export const addComment = async () => {
  const payload = {
    commentDescription: "Need site inspection",
    commentType: "ISSUE",
    responsibility: "Site Engineer",
    actionPoint: "Fix panel alignment",
    createdBy: "admin",
  };

  try {
    const response = await activityTrackerApi.addComment("PRJ001", payload);

    console.log("||||||||||||||||Comment Added:", response);
  } catch (error) {
    console.error("||||||||||||||||", error);
  }
};

// ------------------------------------------------------------
// CALL METHODS
// ------------------------------------------------------------

// fetchProjects();
// createProject();
// createActivities();
// updateStatus();
// rejectActivity();
// addComment();
