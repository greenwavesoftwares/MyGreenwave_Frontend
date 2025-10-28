import React, { useEffect, useState } from "react";
import { getNalandaData, certificateDownload } from "./NalandaAPI";
import { getUserData } from "../Login/Encrypt";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Tooltip,
  Typography,
} from "@mui/material";
import { formatDate } from "../Appraisal/formatDate";
//Icon Import
import DeleteIcon from "@mui/icons-material/Delete";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import BackupIcon from "@mui/icons-material/Backup";
import AddIcon from "@mui/icons-material/Add";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import HourglassBottomOutlinedIcon from "@mui/icons-material/HourglassBottomOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";

const Nalanda = () => {
  //
  const [nalanda, setNalanda] = useState([]);
  //For Card Data Only
  const [nalandaCardData, setNalandaCardData] = useState([]);
  const [loader, setLoader] = useState(false);
  //Total Training
  const [totalTraining, setTotalTraining] = useState([]);
  //Active Card State
  const [activeCard, setActiveCard] = useState("totalTraining");

  //User Token
  const { token } = getUserData();
  //Api Call Function
  const getData = async () => {
    try {
      setLoader(true);
      const response = await getNalandaData(token);
      console.log("response", response);
      //Set Api Data
      setNalanda(response?.data.trainingEventTablelist);
      //Set Data For Card Only
      setNalandaCardData(response?.data.trainingEventTablelist);
      //Total Trining
      setTotalTraining(response?.data.trainingEventTablelist);
      //Set Loader False
      setLoader(false);
    } catch (error) {
      console.error("Error fetching Nalanda data:", error);
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  //Certificate Download
  const handelDownload = async (eventId) => {
    console.log("click_btn_eventId", eventId);
    const { token } = getUserData();
    const response = await certificateDownload(token, eventId);
    console.log("download_btn", response);
  };

  //Filter Completed Training
  const completedTraining = nalandaCardData?.filter((ele) => {
    return ele.status.toLowerCase() === "completed";
  });

  //Filter Pending Training
  const pendingTraining = nalandaCardData?.filter((ele) => {
    return ele.status.toLowerCase() === "not completed";
  });

  //Certificate Available
  const certificateAvailable = nalandaCardData?.filter((ele) => {
    return ele.isCertificateAvailable === true;
  });

  //Total Training For DataTable Only
  function getTotalTrainingDataOnly() {
    return setNalanda(totalTraining);
  }

  //Completed Training for DataTable Only
  function getCompletedDataOnly() {
    return setNalanda(completedTraining);
  }

  //Pending Training for DataTable Only
  function getPendingDataOnly() {
    return setNalanda(pendingTraining);
  }

  //Available Certificate for DataTable Only
  function getCertificateAvailableOnly() {
    return setNalanda(certificateAvailable);
  }

  //Active Card Handler
  function handleCardClick(cardId) {
    setActiveCard(cardId);
  }

  return (
    <>
      <div className="container mx-auto px-4">
        <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
          <div className=" mt-4">
            <div className="cardStyle mb-1 py-2.5 px-4 bg-white shadow rounded">
              <div className="flex items-center gap-6">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg blue-icon">
                      <AutoStoriesIcon />
                    </div>
                    <div>
                      <h1 className="text-1xl font-bold text-gray-900">
                        Nalanda
                      </h1>
                      <p
                        className=" titleTextStyle"
                        style={{ fontSize: "0.8rem" }}
                      >
                        Manage and track your professional development journey
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className=" mt-1 py-2.5 ">
              <div className="my-grid-new">
                {/* Total Training */}
                <Box
                  sx={{
                    borderLeft:
                      activeCard === "totalTraining"
                        ? "5px solid #1976d2 !important"
                        : "",
                  }}
                  className=" cardStyle rounded-xl shadow-sm p-3 border border-gray-200 hover:shadow-md transition-shadow duration-200"
                  onClick={(e) => {
                    getTotalTrainingDataOnly(),
                      handleCardClick("totalTraining");
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex align-items-center">
                        <SchoolOutlinedIcon className=" mr-2 blue-icon-noBG" />
                        <p className="text-sm font-medium text-gray-600">
                          Total Trainings
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span
                        className=" font-bold text-gray-900"
                        style={{ fontSize: "1.2rem" }}
                      >
                        {nalandaCardData?.length ?? "NA"}
                      </span>
                    </div>
                  </div>
                </Box>
                {/* Completed Training */}

                <Box
                  sx={{
                    borderLeft:
                      activeCard === "completdTraining"
                        ? "5px solid #4caf50 !important"
                        : "",
                  }}
                  className="cardStyle rounded-xl shadow-sm p-3 border border-gray-200 hover:shadow-md transition-shadow duration-200"
                  onClick={(e) => {
                    getCompletedDataOnly(), handleCardClick("completdTraining");
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex items-center">
                        <div className="flex align-items-center">
                          <CheckCircleOutlineOutlinedIcon className=" mr-2 green-icon-noBG" />
                          <p className="text-sm font-medium text-gray-600">
                            Completed
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span
                        className=" font-bold text-gray-900"
                        style={{ fontSize: "1.2rem" }}
                      >
                        {completedTraining?.length ?? "NA"}
                      </span>
                    </div>
                  </div>
                </Box>

                {/* Pending Training */}
                <Box
                  sx={{
                    borderLeft:
                      activeCard === "pendingTraining"
                        ? "5px solid #cbc45d !important"
                        : "",
                  }}
                  className="cardStyle rounded-xl shadow-sm p-3 border border-gray-200 hover:shadow-md transition-shadow duration-200"
                  onClick={(e) => {
                    getPendingDataOnly(), handleCardClick("pendingTraining");
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex align-items-center">
                        <HourglassBottomOutlinedIcon className=" mr-2 yellow-icon-noBG" />
                        <p className="text-sm font-medium text-gray-600">
                          Pending
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span
                        className=" font-bold text-gray-900"
                        style={{ fontSize: "1.2rem" }}
                      >
                        {pendingTraining?.length ?? "NA"}
                      </span>
                    </div>
                  </div>
                </Box>
                {/* With Certificates */}
                <Box
                  sx={{
                    borderLeft:
                      activeCard === "withCertificates"
                        ? "5px solid #5ecb5e !important"
                        : "",
                  }}
                  className="cardStyle rounded-xl shadow-sm p-3 border border-gray-200 hover:shadow-md transition-shadow duration-200"
                  onClick={(e) => {
                    getCertificateAvailableOnly(),
                      handleCardClick("withCertificates");
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex align-items-center">
                        <VerifiedOutlinedIcon className=" mr-2 green-icon-noBG" />
                        <p className="text-sm font-medium text-gray-600">
                          With Certificates
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {/* <PersonOutlineOutlinedIcon className=" mr-2 green-icon-noBG" /> */}
                      <span
                        className=" font-bold text-gray-900"
                        style={{ fontSize: "1.2rem" }}
                      >
                        {certificateAvailable?.length ?? "NA"}
                      </span>
                    </div>
                  </div>
                </Box>
              </div>
            </div>

            <div className="mt-1 mb-4 cardStyle">
              <DataTable
                size="small"
                emptyMessage={
                  loader ? <LinearProgress color="inherit" /> : "No Data Found"
                }
                header={<Typography className="text-sm">Nalanda</Typography>}
                value={nalanda}
                showGridlines
                stripedRows
                className="dataTableHeader dataTableBody dataTableBodyPadding"
              >
                <Column
                  header="Form Date"
                  body={(rowData) => {
                    return (
                      <Typography sx={{ fontSize: "0.8rem" }}>
                        {formatDate(rowData.fromDate)}
                      </Typography>
                    );
                  }}
                ></Column>
                <Column
                  header="To Date"
                  body={(rowData) => {
                    return (
                      <Typography sx={{ fontSize: "0.8rem" }}>
                        {formatDate(rowData.toDate)}
                      </Typography>
                    );
                  }}
                ></Column>
                <Column
                  header="Training Name"
                  style={{ width: "30rem" }}
                  field="trainingName"
                ></Column>
                <Column
                  header="Status"
                  body={(rowData) => {
                    return (
                      <Chip
                        size="small"
                        color={
                          rowData.status.toLowerCase() === "completed"
                            ? "success"
                            : "warning"
                        }
                        label={rowData.status}
                      />
                    );
                  }}
                ></Column>
                <Column
                  header="Certificate"
                  body={(rowData) => {
                    return (
                      <>
                        <Tooltip
                          title={
                            rowData.isCertificateAvailable
                              ? "Download Now"
                              : "Certificate Not Available"
                          }
                          followCursor
                        >
                          <div>
                            <Button
                              variant="contained"
                              sx={{ boxShadow: "none" }}
                              disabled={!rowData.isCertificateAvailable}
                              onClick={() => {
                                handelDownload(rowData.eventId);
                              }}
                              size="small"
                            >
                              Download
                            </Button>
                          </div>
                        </Tooltip>
                      </>
                    );
                  }}
                ></Column>
              </DataTable>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default Nalanda;
