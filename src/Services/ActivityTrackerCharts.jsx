import * as React from "react";
import { Chart } from "react-google-charts";
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";

const projectsData = [
  {
    createdBy: "ashok.singh@greenwave.co.in",
    createdAt: "2026-06-26T11:27:41.323+00:00",
    updatedBy: "ashok.singh@greenwave.co.in",
    updatedAt: "2026-06-26T11:43:32.290+00:00",
    timeEfficiencyRating: null,
    timeEfficiencyComments: null,
    fulfillmentRating: null,
    fulfillmentComments: null,
    innovationRating: null,
    innovationComments: null,
    overallComments: null,
    groups: ["avrajit.roy@greenwave.co.in"],
    id: "prj_1782472400251_enc85b",
    project: "Project 1",
    po: "po 123",
    site: "Kolkata",
    status: "published",
    resourceRatings: [],
    rows: [
      {
        moduleId: "mod_31ba248f-18c",
        resourceName: "Eman Kalyan Mahata",
        plannedStart: "2026-07-01T10:00:00",
        durationHrs: 2,
        plannedStop: "2026-07-01T12:00:00",
        actualStart: null,
        actualStop: null,
        actualElapsedHrs: null,
        sortOrder: 0,
        createdBy: "ashok.singh@greenwave.co.in",
        createdAt: "2026-06-26T11:43:32.460+00:00",
        creatorType: null,
        feedbackRating: null,
        feedbackComments: null,
        timeEfficiencyRating: null,
        timeEfficiencyComments: null,
        fulfillmentRating: null,
        fulfillmentComments: null,
        innovationRating: null,
        innovationComments: null,
        actiVityRejectCount: 0,
        commentCount: 0,
        replyCount: 0,
        id: "49b08e3c-68e5-4240-8e88-2b01c6e226be",
        parentId: null,
        module: "Project Setup",
        task: "Kickoff Meeting",
        resource: "Eman.Mahata@greenwave.co.in",
        status: "Pending",
      },
      {
        moduleId: "mod_31ba248f-18c",
        resourceName: "Sreepriya Roy",
        plannedStart: "2026-07-02T10:00:00",
        durationHrs: 8,
        plannedStop: "2026-07-02T18:00:00",
        actualStart: "2026-06-26T11:36:30.467+00:00",
        actualStop: "2026-06-29T07:59:35.683+00:00",
        actualElapsedHrs: -76.51,
        sortOrder: 0,
        createdBy: "ashok.singh@greenwave.co.in",
        createdAt: "2026-06-26T11:43:32.473+00:00",
        creatorType: null,
        feedbackRating: null,
        feedbackComments: null,
        timeEfficiencyRating: null,
        timeEfficiencyComments: null,
        fulfillmentRating: null,
        fulfillmentComments: null,
        innovationRating: null,
        innovationComments: null,
        actiVityRejectCount: 2,
        commentCount: 1,
        replyCount: 0,
        id: "f5aadb48-8a11-4bdf-a60f-a9f2c6de113d",
        parentId: null,
        module: "Project Setup",
        task: "Requirement Gathering",
        resource: "Sreepriya.Roy@greenwave.co.in",
        status: "Completed",
      },
      {
        moduleId: "mod_efaa42be-327",
        resourceName: "Suraj Shaw",
        plannedStart: "2026-07-03T10:00:00",
        durationHrs: 6,
        plannedStop: "2026-07-03T16:00:00",
        actualStart: null,
        actualStop: null,
        actualElapsedHrs: null,
        sortOrder: 0,
        createdBy: "ashok.singh@greenwave.co.in",
        createdAt: "2026-06-26T11:43:32.483+00:00",
        creatorType: null,
        feedbackRating: null,
        feedbackComments: null,
        timeEfficiencyRating: null,
        timeEfficiencyComments: null,
        fulfillmentRating: null,
        fulfillmentComments: null,
        innovationRating: null,
        innovationComments: null,
        actiVityRejectCount: 0,
        commentCount: 0,
        replyCount: 0,
        id: "223d6431-02f2-4219-ae2c-5c0c9be80ca6",
        parentId: null,
        module: "User Management",
        task: "UI Design",
        resource: "suraj.shaw@greenwave.co.in",
        status: "Pending",
      },
      {
        moduleId: "mod_efaa42be-327",
        resourceName: "Tredipta Mondal",
        plannedStart: "2026-07-06T10:00:00",
        durationHrs: 16,
        plannedStop: "2026-07-07T18:00:00",
        actualStart: null,
        actualStop: null,
        actualElapsedHrs: null,
        sortOrder: 0,
        createdBy: "ashok.singh@greenwave.co.in",
        createdAt: "2026-06-26T11:43:32.490+00:00",
        creatorType: null,
        feedbackRating: null,
        feedbackComments: null,
        timeEfficiencyRating: null,
        timeEfficiencyComments: null,
        fulfillmentRating: null,
        fulfillmentComments: null,
        innovationRating: null,
        innovationComments: null,
        actiVityRejectCount: 0,
        commentCount: 0,
        replyCount: 0,
        id: "367fc5d2-01a8-4666-84e3-0c69c1c6779f",
        parentId: null,
        module: "User Management",
        task: "Backend Development",
        resource: "tredipta.mondal@greenwave.co.in",
        status: "Pending",
      },
      {
        moduleId: "mod_efaa42be-327",
        resourceName: "Suraj Shaw",
        plannedStart: "2026-07-06T10:00:00",
        durationHrs: 12,
        plannedStop: "2026-07-07T14:00:00",
        actualStart: null,
        actualStop: null,
        actualElapsedHrs: null,
        sortOrder: 0,
        createdBy: "ashok.singh@greenwave.co.in",
        createdAt: "2026-06-26T11:43:32.500+00:00",
        creatorType: null,
        feedbackRating: null,
        feedbackComments: null,
        timeEfficiencyRating: null,
        timeEfficiencyComments: null,
        fulfillmentRating: null,
        fulfillmentComments: null,
        innovationRating: null,
        innovationComments: null,
        actiVityRejectCount: 0,
        commentCount: 0,
        replyCount: 0,
        id: "f68c6bcb-72d6-4646-8b20-2cb344ade282",
        parentId: null,
        module: "User Management",
        task: "Frontend Development",
        resource: "suraj.shaw@greenwave.co.in",
        status: "Pending",
      },
      {
        moduleId: "mod_299dc728-9b7",
        resourceName: "Indranil Ghosh",
        plannedStart: "2026-07-06T10:00:00",
        durationHrs: 10,
        plannedStop: "2026-07-07T12:00:00",
        actualStart: null,
        actualStop: null,
        actualElapsedHrs: null,
        sortOrder: 0,
        createdBy: "ashok.singh@greenwave.co.in",
        createdAt: "2026-06-26T11:43:32.510+00:00",
        creatorType: null,
        feedbackRating: null,
        feedbackComments: null,
        timeEfficiencyRating: null,
        timeEfficiencyComments: null,
        fulfillmentRating: null,
        fulfillmentComments: null,
        innovationRating: null,
        innovationComments: null,
        actiVityRejectCount: 0,
        commentCount: 0,
        replyCount: 0,
        id: "213ff6e8-33c1-4d4e-8c35-dd0254b5c12e",
        parentId: null,
        module: "Authentication",
        task: "API Development",
        resource: "indranil.ghosh@greenwave.co.in",
        status: "Pending",
      },
      {
        moduleId: "mod_299dc728-9b7",
        resourceName: "Tredipta Mondal",
        plannedStart: "2026-07-08T10:00:00",
        durationHrs: 6,
        plannedStop: "2026-07-08T16:00:00",
        actualStart: null,
        actualStop: null,
        actualElapsedHrs: null,
        sortOrder: 0,
        createdBy: "ashok.singh@greenwave.co.in",
        createdAt: "2026-06-26T11:43:32.517+00:00",
        creatorType: null,
        feedbackRating: null,
        feedbackComments: null,
        timeEfficiencyRating: null,
        timeEfficiencyComments: null,
        fulfillmentRating: null,
        fulfillmentComments: null,
        innovationRating: null,
        innovationComments: null,
        actiVityRejectCount: 0,
        commentCount: 0,
        replyCount: 0,
        id: "bf5eda37-9e05-4c0b-b284-5f7af75ecb59",
        parentId: null,
        module: "Authentication",
        task: "Testing",
        resource: "tredipta.mondal@greenwave.co.in",
        status: "Pending",
      },
      {
        moduleId: "mod_5b244fcc-2a3",
        resourceName: "Suraj Shaw",
        plannedStart: "2026-07-08T10:00:00",
        durationHrs: 8,
        plannedStop: "2026-07-08T18:00:00",
        actualStart: null,
        actualStop: null,
        actualElapsedHrs: null,
        sortOrder: 0,
        createdBy: "ashok.singh@greenwave.co.in",
        createdAt: "2026-06-26T11:43:32.527+00:00",
        creatorType: null,
        feedbackRating: null,
        feedbackComments: null,
        timeEfficiencyRating: null,
        timeEfficiencyComments: null,
        fulfillmentRating: null,
        fulfillmentComments: null,
        innovationRating: null,
        innovationComments: null,
        actiVityRejectCount: 0,
        commentCount: 0,
        replyCount: 0,
        id: "b606fa4d-cb56-48c9-afbd-5ac60f3f0992",
        parentId: null,
        module: "Reports",
        task: "Report Design",
        resource: "suraj.shaw@greenwave.co.in",
        status: "Pending",
      },
      {
        moduleId: "mod_5b244fcc-2a3",
        resourceName: "Ashok Singh",
        plannedStart: "2026-07-09T10:00:00",
        durationHrs: 4,
        plannedStop: "2026-07-09T14:00:00",
        actualStart: "2026-06-26T11:29:06.523+00:00",
        actualStop: "2026-06-26T11:50:09.500+00:00",
        actualElapsedHrs: -308.66,
        sortOrder: 0,
        createdBy: "ashok.singh@greenwave.co.in",
        createdAt: "2026-06-26T11:43:32.533+00:00",
        creatorType: null,
        feedbackRating: null,
        feedbackComments: "good work",
        timeEfficiencyRating: 7,
        timeEfficiencyComments: "Good",
        fulfillmentRating: 8,
        fulfillmentComments: "Good",
        innovationRating: 4,
        innovationComments: "Good",
        actiVityRejectCount: 0,
        commentCount: 1,
        replyCount: 2,
        id: "5bcc8caf-268c-435e-925b-0fc6b3f78201",
        parentId: null,
        module: "Reports",
        task: "Review",
        resource: "ashok.singh@greenwave.co.in",
        status: "Finished",
      },
      {
        moduleId: "mod_973211a9-c57",
        resourceName: "Eman Kalyan Mahata",
        plannedStart: "2026-07-10T10:00:00",
        durationHrs: 2,
        plannedStop: "2026-07-10T12:00:00",
        actualStart: null,
        actualStop: null,
        actualElapsedHrs: null,
        sortOrder: 0,
        createdBy: "ashok.singh@greenwave.co.in",
        createdAt: "2026-06-26T11:43:32.543+00:00",
        creatorType: null,
        feedbackRating: null,
        feedbackComments: null,
        timeEfficiencyRating: null,
        timeEfficiencyComments: null,
        fulfillmentRating: null,
        fulfillmentComments: null,
        innovationRating: null,
        innovationComments: null,
        actiVityRejectCount: 0,
        commentCount: 0,
        replyCount: 0,
        id: "ea52bb64-a18f-4f80-a2e5-ff11328abafc",
        parentId: null,
        module: "Deployment",
        task: "Go-Live",
        resource: "Eman.Mahata@greenwave.co.in",
        status: "Pending",
      },
      {
        moduleId: "mod_e19797bb-3f7",
        resourceName: "Ashok Singh",
        plannedStart: "2026-06-29T17:15:00",
        durationHrs: 10,
        plannedStop: "2026-07-01T11:15:00",
        actualStart: "2026-06-26T12:35:18.773+00:00",
        actualStop: null,
        actualElapsedHrs: null,
        sortOrder: 0,
        createdBy: "ashok.singh@greenwave.co.in",
        createdAt: "2026-06-26T11:43:32.550+00:00",
        creatorType: null,
        feedbackRating: null,
        feedbackComments: null,
        timeEfficiencyRating: null,
        timeEfficiencyComments: null,
        fulfillmentRating: null,
        fulfillmentComments: null,
        innovationRating: null,
        innovationComments: null,
        actiVityRejectCount: 0,
        commentCount: 0,
        replyCount: 0,
        id: "c53abe9d-5198-4398-8121-da9b8ab935c5",
        parentId: null,
        module: "Module 1",
        task: "Task 1",
        resource: "ashok.singh@greenwave.co.in",
        status: "Running",
      },
      {
        moduleId: "mod_5b244fcc-2a3",
        resourceName: "Ashok Singh",
        plannedStart: "2026-07-09T10:00:00",
        durationHrs: 0,
        plannedStop: "2026-07-09T10:00:00",
        actualStart: "2026-06-26T11:40:27.123+00:00",
        actualStop: "2026-06-26T11:51:46.087+00:00",
        actualElapsedHrs: -304.64,
        sortOrder: 1,
        createdBy: "ashok.singh@greenwave.co.in",
        createdAt: "2026-06-26T11:43:32.560+00:00",
        creatorType: "Assignee",
        feedbackRating: null,
        feedbackComments: null,
        timeEfficiencyRating: null,
        timeEfficiencyComments: null,
        fulfillmentRating: null,
        fulfillmentComments: null,
        innovationRating: null,
        innovationComments: null,
        actiVityRejectCount: 1,
        commentCount: 0,
        replyCount: 0,
        id: "36241236-34e8-41eb-87d5-a237a13200e4",
        parentId: "5bcc8caf-268c-435e-925b-0fc6b3f78201",
        module: "Reports",
        task: "Module 1 Review",
        resource: "ashok.singh@greenwave.co.in",
        status: "Completed",
      },
      {
        moduleId: "mod_5b244fcc-2a3",
        resourceName: "Ashok Singh",
        plannedStart: "2026-07-09T10:00:00",
        durationHrs: 2,
        plannedStop: "2026-07-09T12:00:00",
        actualStart: "2026-06-26T11:43:51.643+00:00",
        actualStop: "2026-06-26T11:50:04.667+00:00",
        actualElapsedHrs: -306.67,
        sortOrder: 1,
        createdBy: "ashok.singh@greenwave.co.in",
        createdAt: "2026-06-26T11:43:32.567+00:00",
        creatorType: "Assignee",
        feedbackRating: null,
        feedbackComments: null,
        timeEfficiencyRating: null,
        timeEfficiencyComments: null,
        fulfillmentRating: null,
        fulfillmentComments: null,
        innovationRating: null,
        innovationComments: null,
        actiVityRejectCount: 0,
        commentCount: 0,
        replyCount: 0,
        id: "5f1f34ef-c16b-447e-88e9-8192bfb88055",
        parentId: "5bcc8caf-268c-435e-925b-0fc6b3f78201",
        module: "Reports",
        task: "module 2 Review",
        resource: "ashok.singh@greenwave.co.in",
        status: "Completed",
      },
      {
        moduleId: "mod_e19797bb-3f7",
        resourceName: "Ashok Singh",
        plannedStart: "2026-06-29T17:15:00",
        durationHrs: 0,
        plannedStop: "2026-06-29T17:15:00",
        actualStart: null,
        actualStop: null,
        actualElapsedHrs: null,
        sortOrder: 1,
        createdBy: "ashok.singh@greenwave.co.in",
        createdAt: "2026-06-26T12:35:26.630+00:00",
        creatorType: "Assignee",
        feedbackRating: null,
        feedbackComments: null,
        timeEfficiencyRating: null,
        timeEfficiencyComments: null,
        fulfillmentRating: null,
        fulfillmentComments: null,
        innovationRating: null,
        innovationComments: null,
        actiVityRejectCount: 0,
        commentCount: 0,
        replyCount: 0,
        id: "b1ee224e-1898-47c9-9eb7-7b9ec745f1e2",
        parentId: "c53abe9d-5198-4398-8121-da9b8ab935c5",
        module: "Module 1",
        task: "tw",
        resource: "ashok.singh@greenwave.co.in",
        status: "Pending",
      },
    ],
  },
  {
    createdBy: "ashok.singh@greenwave.co.in",
    createdAt: "2026-06-29T10:28:50.220+00:00",
    updatedBy: "ashok.singh@greenwave.co.in",
    updatedAt: "2026-06-30T06:56:49.060+00:00",
    timeEfficiencyRating: null,
    timeEfficiencyComments: null,
    fulfillmentRating: null,
    fulfillmentComments: null,
    innovationRating: null,
    innovationComments: null,
    overallComments: null,
    groups: ["avrajit.roy@greenwave.co.in"],
    id: "prj_1782728919004_2e72wj",
    project: "Project p1",
    po: "po p1",
    site: "kolkata",
    status: "published",
    resourceRatings: [],
    rows: [
      {
        moduleId: "mod_fe3f4275-1c6",
        resourceName: "Eman Kalyan Mahata",
        plannedStart: "2026-07-01T10:00:00",
        durationHrs: 14,
        plannedStop: "2026-07-02T16:00:00",
        actualStart: null,
        actualStop: null,
        actualElapsedHrs: null,
        sortOrder: 0,
        createdBy: "ashok.singh@greenwave.co.in",
        createdAt: "2026-06-30T06:56:49.370+00:00",
        creatorType: null,
        feedbackRating: null,
        feedbackComments: null,
        timeEfficiencyRating: null,
        timeEfficiencyComments: null,
        fulfillmentRating: null,
        fulfillmentComments: null,
        innovationRating: null,
        innovationComments: null,
        actiVityRejectCount: 0,
        commentCount: 0,
        replyCount: 0,
        id: "78b83e4f-fc80-4288-8b61-ee2b31b71fb0",
        parentId: null,
        module: "Project Setup",
        task: "Kickoff Meeting",
        resource: "Eman.Mahata@greenwave.co.in",
        status: "Pending",
      },
      {
        moduleId: "mod_fe3f4275-1c6",
        resourceName: "Sreepriya Roy",
        plannedStart: "2026-07-02T10:00:00",
        durationHrs: 12,
        plannedStop: "2026-07-03T14:00:00",
        actualStart: "2026-06-30T06:57:18.303+00:00",
        actualStop: null,
        actualElapsedHrs: null,
        sortOrder: 0,
        createdBy: "ashok.singh@greenwave.co.in",
        createdAt: "2026-06-30T06:56:49.383+00:00",
        creatorType: null,
        feedbackRating: null,
        feedbackComments: null,
        timeEfficiencyRating: null,
        timeEfficiencyComments: null,
        fulfillmentRating: null,
        fulfillmentComments: null,
        innovationRating: null,
        innovationComments: null,
        actiVityRejectCount: 0,
        commentCount: 0,
        replyCount: 0,
        id: "c591f662-5799-4f96-9302-9aa0252db41d",
        parentId: null,
        module: "Project Setup",
        task: "Requirement Gathering",
        resource: "Sreepriya.Roy@greenwave.co.in",
        status: "Running",
      },
      {
        moduleId: "mod_d763e4af-6de",
        resourceName: "Suraj Shaw",
        plannedStart: "2026-07-03T10:00:00",
        durationHrs: 20,
        plannedStop: "2026-07-07T14:00:00",
        actualStart: null,
        actualStop: null,
        actualElapsedHrs: null,
        sortOrder: 0,
        createdBy: "ashok.singh@greenwave.co.in",
        createdAt: "2026-06-30T06:56:49.397+00:00",
        creatorType: null,
        feedbackRating: null,
        feedbackComments: null,
        timeEfficiencyRating: null,
        timeEfficiencyComments: null,
        fulfillmentRating: null,
        fulfillmentComments: null,
        innovationRating: null,
        innovationComments: null,
        actiVityRejectCount: 0,
        commentCount: 0,
        replyCount: 0,
        id: "9ccadf64-0cc1-449a-b6f0-21e3b2771b79",
        parentId: null,
        module: "User Management",
        task: "UI Design",
        resource: "suraj.shaw@greenwave.co.in",
        status: "Pending",
      },
      {
        moduleId: "mod_d763e4af-6de",
        resourceName: "Tredipta Mondal",
        plannedStart: "2026-07-06T10:00:00",
        durationHrs: 16,
        plannedStop: "2026-07-07T18:00:00",
        actualStart: null,
        actualStop: null,
        actualElapsedHrs: null,
        sortOrder: 0,
        createdBy: "ashok.singh@greenwave.co.in",
        createdAt: "2026-06-30T06:56:49.403+00:00",
        creatorType: null,
        feedbackRating: null,
        feedbackComments: null,
        timeEfficiencyRating: null,
        timeEfficiencyComments: null,
        fulfillmentRating: null,
        fulfillmentComments: null,
        innovationRating: null,
        innovationComments: null,
        actiVityRejectCount: 0,
        commentCount: 0,
        replyCount: 0,
        id: "7bd693a5-367b-4c04-9bc4-f44316b822a8",
        parentId: null,
        module: "User Management",
        task: "Backend Development",
        resource: "tredipta.mondal@greenwave.co.in",
        status: "Pending",
      },
      {
        moduleId: "mod_d763e4af-6de",
        resourceName: "Ishanee Panda",
        plannedStart: "2026-07-06T10:00:00",
        durationHrs: 12,
        plannedStop: "2026-07-07T14:00:00",
        actualStart: null,
        actualStop: null,
        actualElapsedHrs: null,
        sortOrder: 0,
        createdBy: "ashok.singh@greenwave.co.in",
        createdAt: "2026-06-30T06:56:49.420+00:00",
        creatorType: null,
        feedbackRating: null,
        feedbackComments: null,
        timeEfficiencyRating: null,
        timeEfficiencyComments: null,
        fulfillmentRating: null,
        fulfillmentComments: null,
        innovationRating: null,
        innovationComments: null,
        actiVityRejectCount: 0,
        commentCount: 0,
        replyCount: 0,
        id: "1ab73f06-0bd8-4cea-bee6-8d032467e06d",
        parentId: null,
        module: "User Management",
        task: "Frontend Development",
        resource: "ishanee.panda@greenwave.co.in",
        status: "Pending",
      },
      {
        moduleId: "mod_803b0504-f75",
        resourceName: "Suraj Shaw",
        plannedStart: "2026-07-08T10:00:00",
        durationHrs: 25,
        plannedStop: "2026-07-13T11:00:00",
        actualStart: null,
        actualStop: null,
        actualElapsedHrs: null,
        sortOrder: 0,
        createdBy: "ashok.singh@greenwave.co.in",
        createdAt: "2026-06-30T06:56:49.437+00:00",
        creatorType: null,
        feedbackRating: null,
        feedbackComments: null,
        timeEfficiencyRating: null,
        timeEfficiencyComments: null,
        fulfillmentRating: null,
        fulfillmentComments: null,
        innovationRating: null,
        innovationComments: null,
        actiVityRejectCount: 0,
        commentCount: 0,
        replyCount: 0,
        id: "f40d7329-c82b-4c42-a8f3-c6df3512e6e7",
        parentId: null,
        module: "Reports",
        task: "Report Design",
        resource: "suraj.shaw@greenwave.co.in",
        status: "Pending",
      },
      {
        moduleId: "mod_803b0504-f75",
        resourceName: "Ashok Singh",
        plannedStart: "2026-07-09T10:00:00",
        durationHrs: 48,
        plannedStop: "2026-07-16T18:00:00",
        actualStart: null,
        actualStop: null,
        actualElapsedHrs: null,
        sortOrder: 0,
        createdBy: "ashok.singh@greenwave.co.in",
        createdAt: "2026-06-30T06:56:49.470+00:00",
        creatorType: null,
        feedbackRating: null,
        feedbackComments: null,
        timeEfficiencyRating: null,
        timeEfficiencyComments: null,
        fulfillmentRating: null,
        fulfillmentComments: null,
        innovationRating: null,
        innovationComments: null,
        actiVityRejectCount: 0,
        commentCount: 0,
        replyCount: 0,
        id: "665b0e65-5559-4185-a137-ec4d7723caea",
        parentId: null,
        module: "Reports",
        task: "Review",
        resource: "ashok.singh@greenwave.co.in",
        status: "Pending",
      },
      {
        moduleId: "mod_ca4cfcb0-32e",
        resourceName: "Eman Kalyan Mahata",
        plannedStart: "2026-07-10T10:00:00",
        durationHrs: 24,
        plannedStop: "2026-07-14T18:00:00",
        actualStart: null,
        actualStop: null,
        actualElapsedHrs: null,
        sortOrder: 0,
        createdBy: "ashok.singh@greenwave.co.in",
        createdAt: "2026-06-30T06:56:49.503+00:00",
        creatorType: null,
        feedbackRating: null,
        feedbackComments: null,
        timeEfficiencyRating: null,
        timeEfficiencyComments: null,
        fulfillmentRating: null,
        fulfillmentComments: null,
        innovationRating: null,
        innovationComments: null,
        actiVityRejectCount: 0,
        commentCount: 0,
        replyCount: 0,
        id: "3cb39b5b-4b4a-46c2-adf2-c1c47f75304f",
        parentId: null,
        module: "Deployment",
        task: "Go-Live",
        resource: "Eman.Mahata@greenwave.co.in",
        status: "Pending",
      },
    ],
  },
  {
    createdBy: "Sreepriya.Roy@greenwave.co.in",
    createdAt: "2026-06-29T06:49:12.783+00:00",
    updatedBy: "Sreepriya.Roy@greenwave.co.in",
    updatedAt: "2026-06-29T09:44:22.867+00:00",
    timeEfficiencyRating: null,
    timeEfficiencyComments: null,
    fulfillmentRating: null,
    fulfillmentComments: null,
    innovationRating: null,
    innovationComments: null,
    overallComments: null,
    groups: ["avrajit.roy@greenwave.co.in"],
    id: "prj_1782714896146_i4zm9n",
    project: "wdwq",
    po: "weqd",
    site: "qwe",
    status: "published",
    resourceRatings: [],
    rows: [
      {
        moduleId: "mod_607accf9-2eb",
        resourceName: "Sreepriya Roy",
        plannedStart: "2026-06-30T11:20:00",
        durationHrs: 0.5,
        plannedStop: "2026-06-30T11:50:00",
        actualStart: "2026-06-29T11:34:35.670+00:00",
        actualStop: "2026-06-29T11:34:37.617+00:00",
        actualElapsedHrs: -18.76,
        sortOrder: 0,
        createdBy: "Sreepriya.Roy@greenwave.co.in",
        createdAt: "2026-06-29T09:44:23.053+00:00",
        creatorType: null,
        feedbackRating: null,
        feedbackComments: null,
        timeEfficiencyRating: null,
        timeEfficiencyComments: null,
        fulfillmentRating: null,
        fulfillmentComments: null,
        innovationRating: null,
        innovationComments: null,
        actiVityRejectCount: 0,
        commentCount: 0,
        replyCount: 0,
        id: "d1dbc31a-4a44-4f0b-886d-9601ae867270",
        parentId: null,
        module: "we",
        task: "ee",
        resource: "Sreepriya.Roy@greenwave.co.in",
        status: "Completed",
      },
      {
        moduleId: "mod_607accf9-2eb",
        resourceName: "Sreepriya Roy",
        plannedStart: "2026-06-29T15:15:00",
        durationHrs: 0.5,
        plannedStop: "2026-06-29T15:45:00",
        actualStart: "2026-06-29T09:51:12.840+00:00",
        actualStop: null,
        actualElapsedHrs: null,
        sortOrder: 0,
        createdBy: "Sreepriya.Roy@greenwave.co.in",
        createdAt: "2026-06-29T09:44:23.140+00:00",
        creatorType: null,
        feedbackRating: null,
        feedbackComments: null,
        timeEfficiencyRating: null,
        timeEfficiencyComments: null,
        fulfillmentRating: null,
        fulfillmentComments: null,
        innovationRating: null,
        innovationComments: null,
        actiVityRejectCount: 0,
        commentCount: 1,
        replyCount: 0,
        id: "df0d1bae-0924-4fcd-b364-be76ed5c1c74",
        parentId: null,
        module: "we",
        task: "sxd",
        resource: "Sreepriya.Roy@greenwave.co.in",
        status: "Paused",
      },
      {
        moduleId: "mod_607accf9-2eb",
        resourceName: "Sreepriya Roy",
        plannedStart: "2026-06-29T13:45:00",
        durationHrs: 0.5,
        plannedStop: "2026-06-29T14:15:00",
        actualStart: "2026-06-29T09:30:24.137+00:00",
        actualStop: null,
        actualElapsedHrs: null,
        sortOrder: 0,
        createdBy: "Sreepriya.Roy@greenwave.co.in",
        createdAt: "2026-06-29T09:44:23.240+00:00",
        creatorType: null,
        feedbackRating: null,
        feedbackComments: null,
        timeEfficiencyRating: null,
        timeEfficiencyComments: null,
        fulfillmentRating: null,
        fulfillmentComments: null,
        innovationRating: null,
        innovationComments: null,
        actiVityRejectCount: 0,
        commentCount: 0,
        replyCount: 0,
        id: "9ba36ad2-4b3b-413b-906b-359cf8e0d6b9",
        parentId: null,
        module: "we",
        task: "sss",
        resource: "Sreepriya.Roy@greenwave.co.in",
        status: "Running",
      },
      {
        moduleId: "mod_607accf9-2eb",
        resourceName: "Sreepriya Roy",
        plannedStart: "2026-06-29T13:45:00",
        durationHrs: 0.5,
        plannedStop: "2026-06-29T14:15:00",
        actualStart: "2026-06-29T08:19:05.453+00:00",
        actualStop: "2026-06-29T09:30:22.493+00:00",
        actualElapsedHrs: 0.76,
        sortOrder: 1,
        createdBy: "Sreepriya.Roy@greenwave.co.in",
        createdAt: "2026-06-29T09:44:23.260+00:00",
        creatorType: null,
        feedbackRating: null,
        feedbackComments: null,
        timeEfficiencyRating: null,
        timeEfficiencyComments: null,
        fulfillmentRating: null,
        fulfillmentComments: null,
        innovationRating: null,
        innovationComments: null,
        actiVityRejectCount: 0,
        commentCount: 0,
        replyCount: 0,
        id: "610c348a-62fc-4973-a4aa-dc8d068f0747",
        parentId: "9ba36ad2-4b3b-413b-906b-359cf8e0d6b9",
        module: "we",
        task: "ddd",
        resource: "Sreepriya.Roy@greenwave.co.in",
        status: "Completed",
      },
      {
        moduleId: "mod_607accf9-2eb",
        resourceName: "Sreepriya Roy",
        plannedStart: "2026-06-29T15:15:00",
        durationHrs: 0.5,
        plannedStop: "2026-06-29T15:45:00",
        actualStart: "2026-06-29T09:51:45.660+00:00",
        actualStop: "2026-06-29T09:51:47.127+00:00",
        actualElapsedHrs: -0.39,
        sortOrder: 1,
        createdBy: "Sreepriya.Roy@greenwave.co.in",
        createdAt: "2026-06-29T09:44:23.273+00:00",
        creatorType: null,
        feedbackRating: null,
        feedbackComments: null,
        timeEfficiencyRating: null,
        timeEfficiencyComments: null,
        fulfillmentRating: null,
        fulfillmentComments: null,
        innovationRating: null,
        innovationComments: null,
        actiVityRejectCount: 0,
        commentCount: 0,
        replyCount: 0,
        id: "65af9e40-daa4-419a-9faf-2edb09048d7c",
        parentId: "df0d1bae-0924-4fcd-b364-be76ed5c1c74",
        module: "we",
        task: "ssd",
        resource: "Sreepriya.Roy@greenwave.co.in",
        status: "Completed",
      },
      {
        moduleId: "mod_607accf9-2eb",
        resourceName: "Sreepriya Roy",
        plannedStart: "2026-06-29T15:15:00",
        durationHrs: 0,
        plannedStop: "2026-06-29T15:15:00",
        actualStart: null,
        actualStop: null,
        actualElapsedHrs: null,
        sortOrder: 1,
        createdBy: "Sreepriya.Roy@greenwave.co.in",
        createdAt: "2026-06-29T10:51:23.910+00:00",
        creatorType: "Assignee",
        feedbackRating: null,
        feedbackComments: null,
        timeEfficiencyRating: null,
        timeEfficiencyComments: null,
        fulfillmentRating: null,
        fulfillmentComments: null,
        innovationRating: null,
        innovationComments: null,
        actiVityRejectCount: 0,
        commentCount: 0,
        replyCount: 0,
        id: "999015e8-a3cc-4af8-910b-e926dba036e1",
        parentId: "df0d1bae-0924-4fcd-b364-be76ed5c1c74",
        module: "we",
        task: "v hv hn",
        resource: "Sreepriya.Roy@greenwave.co.in",
        status: "Pending",
      },
    ],
  },
];

const ActivityTrackerCharts = () => {
  // --- STATE ---
  const [project, setProject] = React.useState("All");
  const [resourceFilter, setResourceFilter] = React.useState("All");
  const [timeView, setTimeView] = React.useState("Weekly"); // Daily, Weekly, Monthly

  // --- DERIVED DATA FOR DROPDOWNS ---
  // Get a unique list of all resources across all projects for the dropdown
  const allResources = Array.from(
    new Set(
      projectsData
        .flatMap((p) => p.rows)
        .map((task) => task.resourceName)
        .filter(Boolean),
    ),
  ).sort();

  // --- MASTER FILTER ---
  // Filter the data by both Project ID and Resource Name before passing it to charts
  const getFilteredData = () => {
    let filtered = projectsData;

    if (project !== "All") {
      filtered = filtered.filter((p) => p.id === project);
    }

    if (resourceFilter !== "All") {
      filtered = filtered
        .map((p) => ({
          ...p,
          // Only keep tasks assigned to the selected resource
          rows: p.rows.filter((task) => task.resourceName === resourceFilter),
        }))
        // Remove projects that are now empty after filtering rows
        .filter((p) => p.rows.length > 0);
    }

    return filtered;
  };

  const masterFilteredData = getFilteredData();

  // --- DATE HELPER ---
  // Returns a formatted label (e.g., "Jun 29") and a numeric timestamp for sorting
  const getTimeLabelAndValue = (dateString, mode) => {
    const date = new Date(dateString);
    let label, sortValue;

    if (mode === "Daily") {
      label = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      sortValue = date.setHours(0, 0, 0, 0);
    } else if (mode === "Monthly") {
      label = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      sortValue = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
    } else {
      // Weekly
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);

      // Clone date to avoid mutating the original object
      const monday = new Date(date);
      monday.setDate(diff);
      monday.setHours(0, 0, 0, 0);

      // Use Thursday to accurately determine the target month and week number
      // (This properly handles weeks that overlap two different months)
      const thursday = new Date(monday);
      thursday.setDate(monday.getDate() + 3);

      // Calculate week of the month (1-5)
      const weekOfMonth = Math.ceil(thursday.getDate() / 7);

      // Helper for "1st", "2nd", "3rd", etc.
      const getOrdinal = (n) => {
        if (n === 1) return "1st";
        if (n === 2) return "2nd";
        if (n === 3) return "3rd";
        return `${n}th`;
      };

      const monthAndYearName = thursday.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });

      label = `${getOrdinal(weekOfMonth)} wk ${monthAndYearName}`;
      sortValue = monday.getTime(); // Keep sorting based on Monday to ensure correct chronological grouping
    }

    return { label, sortValue };
  };

  // --- CHART 1: Workload Generator ---
  const getResourceWorkloadData = (data, mode) => {
    const workloadByTime = {};
    const uniqueResources = new Set();
    const timeMap = new Map(); // Used to sort dates chronologically

    data
      .flatMap((p) => p.rows)
      .forEach((task) => {
        if (task.resourceName && task.durationHrs && task.plannedStart) {
          const { label, sortValue } = getTimeLabelAndValue(
            task.plannedStart,
            mode,
          );

          timeMap.set(sortValue, label);
          uniqueResources.add(task.resourceName);

          if (!workloadByTime[label]) workloadByTime[label] = {};
          workloadByTime[label][task.resourceName] =
            (workloadByTime[label][task.resourceName] || 0) + task.durationHrs;
        }
      });

    // Sort time columns chronologically
    const sortedTimeValues = Array.from(timeMap.keys()).sort((a, b) => a - b);
    const sortedLabels = sortedTimeValues.map((val) => timeMap.get(val));
    const resourceArray = Array.from(uniqueResources).sort();

    if (sortedLabels.length === 0)
      return [
        ["Time", "Hours"],
        ["No Data", 0],
      ];

    const headers = ["Time", ...resourceArray];
    const rows = sortedLabels.map((label) => {
      const rowData = [label];
      resourceArray.forEach((res) => {
        rowData.push(workloadByTime[label][res] || 0);
      });
      return rowData;
    });

    return [headers, ...rows];
  };

  // --- OTHER CHART GENERATORS ---
  const getTaskStatusData = (data) => {
    const statusCounts = {};
    data
      .flatMap((p) => p.rows)
      .forEach((task) => {
        const status = task.status || "Unknown";
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
    if (Object.keys(statusCounts).length === 0)
      return [
        ["Status", "Count"],
        ["No Data", 1],
      ];
    return [["Status", "Task Count"], ...Object.entries(statusCounts)];
  };

  const getEstimationAccuracyData = (data) => {
    const chartData = data
      .flatMap((p) => p.rows)
      .filter((task) => task.actualElapsedHrs !== null)
      .map((task) => [
        task.task || "Unknown Task",
        task.durationHrs || 0,
        task.actualElapsedHrs !== null ? Math.abs(task.actualElapsedHrs) : 0,
      ]);

    if (chartData.length === 0)
      return [
        ["Task", "Planned", "Actual"],
        ["No tasks", 0, 0],
      ];
    return [["Task", "Planned Hours", "Actual Hours"], ...chartData];
  };

  const getModuleEffortData = (data) => {
    const projectBreakdown = {};
    const uniqueModules = new Set();

    data.forEach((p) => {
      const projectName = p.project || "Unknown Project";
      projectBreakdown[projectName] = projectBreakdown[projectName] || {};
      p.rows.forEach((task) => {
        if (task.module && task.durationHrs) {
          uniqueModules.add(task.module);
          projectBreakdown[projectName][task.module] =
            (projectBreakdown[projectName][task.module] || 0) +
            task.durationHrs;
        }
      });
    });

    const modulesArray = Array.from(uniqueModules);
    const headers = ["Project Name", ...modulesArray];
    const rows = Object.keys(projectBreakdown).map((projectName) => {
      const rowData = [projectName];
      modulesArray.forEach((mod) => {
        rowData.push(projectBreakdown[projectName][mod] || 0);
      });
      return rowData;
    });

    if (rows.length === 0)
      return [
        ["Project", "Hours"],
        ["No Data", 0],
      ];
    return [headers, ...rows];
  };

  return (
    <>
      {/* FILTERS SECTION */}
      <div
        style={{
          border: "1px solid #ccc",
          padding: "15px",
          borderRadius: "8px",
          margin: "10px",
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        {/* Project Filter */}
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel id="project-select-label">Select Project</InputLabel>
          <Select
            labelId="project-select-label"
            value={project}
            label="Select Project"
            onChange={(e) => setProject(e.target.value)}
          >
            <MenuItem value="All">All Projects</MenuItem>
            {projectsData.map((proj) => (
              <MenuItem key={proj.id} value={proj.id}>
                {proj.project}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Resource Filter */}
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel id="resource-select-label">Select Resource</InputLabel>
          <Select
            labelId="resource-select-label"
            value={resourceFilter}
            label="Select Resource"
            onChange={(e) => setResourceFilter(e.target.value)}
          >
            <MenuItem value="All">All Resources</MenuItem>
            {allResources.map((res) => (
              <MenuItem key={res} value={res}>
                {res}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Time View Toggle (For Workload Chart) */}
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel id="time-view-label">Workload View</InputLabel>
          <Select
            labelId="time-view-label"
            value={timeView}
            label="Workload View"
            onChange={(e) => setTimeView(e.target.value)}
          >
            <MenuItem value="Daily">Daily</MenuItem>
            <MenuItem value="Weekly">Weekly</MenuItem>
            <MenuItem value="Monthly">Monthly</MenuItem>
          </Select>
        </FormControl>
      </div>

      {/* CHARTS GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          padding: "20px",
        }}
      >
        {/* Chart 1: Resource Workload */}
        <div
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            borderRadius: "8px",
          }}
        >
          <Chart
            chartType="ColumnChart"
            width="100%"
            height="400px"
            data={getResourceWorkloadData(masterFilteredData, timeView)}
            options={{
              title: `Resource Workload (${timeView})`,
              hAxis: {
                title:
                  timeView === "Daily"
                    ? "Day"
                    : timeView === "Monthly"
                      ? "Month"
                      : "Week",
              },
              vAxis: { title: "Total Planned Hours" },
              isStacked: true,
              legend: { position: "right" },
            }}
          />
        </div>

        {/* Chart 2: Task Status */}
        <div
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            borderRadius: "8px",
          }}
        >
          <Chart
            chartType="PieChart"
            width="100%"
            height="400px"
            data={getTaskStatusData(masterFilteredData)}
            options={{ title: "Overall Task Status", pieHole: 0.4 }}
          />
        </div>

        {/* Chart 3: Estimation Accuracy */}
        <div
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            borderRadius: "8px",
          }}
        >
          <Chart
            chartType="BarChart"
            width="100%"
            height="400px"
            data={getEstimationAccuracyData(masterFilteredData)}
            options={{
              title: "Estimation Accuracy: Planned vs Actual",
              hAxis: { title: "Hours" },
              vAxis: { title: "Task" },
              colors: ["#3366cc", "#dc3912"],
            }}
          />
        </div>

        {/* Chart 4: Module Effort Breakdown */}
        <div
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            borderRadius: "8px",
          }}
        >
          <Chart
            chartType="ColumnChart"
            width="100%"
            height="400px"
            data={getModuleEffortData(masterFilteredData)}
            options={{
              title: "Module Effort by Project",
              hAxis: { title: "Project" },
              vAxis: { title: "Hours" },
              isStacked: true,
            }}
          />
        </div>
      </div>
    </>
  );
};

export default ActivityTrackerCharts;
