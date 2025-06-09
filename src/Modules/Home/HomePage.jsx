import {
  Avatar,
  Grid,
  Card,
  Typography,
  Tooltip,
  IconButton,
  Button,
  Box,
  Switch,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import "./HomePage.css";
import { Galleria } from "primereact/galleria";
import { formatDate, formatDateTime } from "../Appraisal/formatDate";
import { Image } from "primereact/image";
import { Dialog } from "primereact/dialog";
import InfoIcon from "@mui/icons-material/Info";
import { Checkbox } from "primereact/checkbox";
import { Tag } from "primereact/tag";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import CircularProgress from "@mui/material/CircularProgress";
import WorkIcon from "@mui/icons-material/Work";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { Card as PrimeReactCard } from "primereact/card";
import { styled } from "@mui/material/styles";
import Badge from "@mui/material/Badge";
import EditIcon from "@mui/icons-material/Edit";
import Toast from "../../components/Toast/Toast";
import CommentIcon from "@mui/icons-material/Comment";
//Api
import {
  getUserDataAPI,
  getAppraisalData,
  getTrainingData,
  getNextHoliday,
  getEventData,
  getHomePageEvent,
  getNotificationData,
  getProfileImage,
  getTourClaimsData,
  postProfilePictureUpload,
  postOnTourSwitchUpdate,
  postFeedbackForm,
} from "./HomePageAPI";
import { getUserData } from "../Login/Encrypt";
const endPoint = import.meta.env.VITE_END_POINT;
const imageApiUrl = import.meta.env.VITE_IMAGE_API;
//SCSS Import
import "../Appraisal/Appraisal.scss";
import {
  showErrorMessage,
  showSuccessMessage,
} from "../../components/Toast/ShowMessage";

const HomePage = () => {
  const toastRef = useRef(null);
  const fileInputRef = useRef(null);
  const [notificationData, setNotificationData] = useState([]);
  const [eventData, setEventData] = useState([]);
  const [basicUserInfo, setBasicUserInfo] = useState({});
  const [visible, setVisible] = useState(false);
  const [userProfile, setUserProfile] = useState({});
  const [loader, setLoader] = useState(false);
  //Set Appraisal Data
  const [appraisalData, setAppraisalData] = useState({});
  //Set Training Data
  const [trainingData, setTrainingData] = useState({});
  //Set Next Holiday Data
  const [nextHolidayData, setNextHolidayData] = useState({});
  //Set Event Image
  const [eventImage, setEventImage] = useState(null);
  const [eventImageFileName, setEventImageFileName] = useState(null);
  //Set Profile Image
  const [userProfileImage, setUserProfileImage] = useState(null);
  //Set Tour Claims
  const [tourClaims, setTourClaims] = useState({});
  const [onTourSwitch, setOnTourSwitch] = useState(false);
  //Feedback Visible
  const [feedbackDialogVisible, setFeedbackDialogVisible] = useState(false);
  const [feedback, setFeedback] = useState("");

  //Call Home PAhe All
  const getHomePageData = async () => {
    try {
      const { token } = getUserData();
      const user_doj = formatDate(getUserData().userDetails.doj);

      //Get User Data
      const userDetails = await getUserDataAPI(token);
      setUserProfile(userDetails.data);
      //Home Page Loader
      setLoader(true);
      //Appraisal API Call
      const appraisalResponse = await getAppraisalData(token, user_doj);
      //Training Api Call
      const trainingResponse = await getTrainingData(token);
      //Next Holiday API Call
      const nextHolidayResponse = await getNextHoliday(token);
      //Event API Call
      const eventResponse = await getEventData(token);
      //Notification API Call
      const notificationResponse = await getNotificationData(token);
      //Tour Claims
      const tourClaimsResponse = await getTourClaimsData(token);

      //User Profile
      //Set User Profile File Name
      const {
        userDetails: { employeeId, userName },
      } = getUserData();
      const userProfileFileName = employeeId + userName;
      //Call User Profile API
      const getUserProfileImage = await getProfileImage(userProfileFileName);
      console.log("userProfileFileName", userProfileFileName);
      const blobResponse = URL.createObjectURL(getUserProfileImage.data);

      if (appraisalResponse.status === 200) {
        //Appraisal Data
        setAppraisalData(appraisalResponse.data.appraisalTable);
        // Training Data
        setTrainingData(trainingResponse.data);
        // Next Holiday Data
        setNextHolidayData(nextHolidayResponse.data);
        //Event Data
        setEventData(eventResponse.data.eventList);
        //Notification Data
        setNotificationData(notificationResponse.data.notificationtList);
        //Tour Claims Data
        setTourClaims(tourClaimsResponse.data);
        //Set User Profile Image
        setUserProfileImage(blobResponse);
        //Set Loader to false
        setLoader(false);
      }
    } catch (error) {
      if (error) {
        setLoader(false);
        console.error("Error fetching home page data:", error);
      } else {
        setLoader(false);
        console.error("Error fetching home page data: Unknown error");
      }
    }
  };

  //Call Home Page API
  useEffect(() => {
    getHomePageData();
  }, []);

  //Fetch Event Image
  useEffect(() => {
    const fetchEventImage = async () => {
      try {
        if (eventImageFileName) {
          const response = await getHomePageEvent(eventImageFileName);
          const imageUrl = URL.createObjectURL(response.data);
          setEventImage(imageUrl);
        }
      } catch (err) {
        console.error("Failed to fetch event image:", err);
      }
    };

    fetchEventImage();
  }, [eventImageFileName]);

  //Notification Template
  const itemNotificationTemplate = (item) => {
    return (
      <PrimeReactCard
        className="primeReactCardStyle"
        style={{ boxShadow: "none" }}
        title={
          <Typography
            sx={{
              fontSize: "1rem !important",
              fontWeight: 700,
              color: "#3be4b4",
              textTransform: "capitalize",
            }}
          >
            {item.title}
          </Typography>
        }
        subTitle={
          <Typography
            className="fontSize-sm"
            sx={{ fontWeight: 600, marginBottom: "0.2rem" }}
          >
            {`${item.fromdate} - ${item.toDate}`}
          </Typography>
        }
        footer={
          <a
            style={{ fontWeight: "bold", fontSize: "0.8rem" }}
            className=""
            target="_blank"
            href={item.url}
          >
            Click Here For More Information
          </a>
        }
      >
        <Typography className="fontSize-sm" sx={{ marginBottom: "0.2rem" }}>
          {item.notification}
        </Typography>
      </PrimeReactCard>
      // <div style={{ display: "grid", justifyContent: "start" }}>
      //   <Typography
      //     sx={{
      //       fontSize: "1rem !important",
      //       fontWeight: 700,
      //       color: "#3be4b4",
      //       textTransform: "capitalize",
      //     }}
      //   >
      //     {item.title}
      //   </Typography>
      //   <Typography
      //     className="fontSize-sm"
      //     sx={{ fontWeight: 600, marginBottom: "0.2rem" }}
      //   >
      //     {`${item.fromdate} - ${item.toDate}`}
      //   </Typography>
      //   <Typography className="fontSize-sm" sx={{ marginBottom: "0.2rem" }}>
      //     {item.notification}
      //   </Typography>
      //   <a
      //     style={{ fontWeight: "bold" }}
      //     className=""
      //     target="_blank"
      //     href={item.url}
      //   >
      //     Click Here For More Information
      //   </a>
      // </div>
    );
  };

  //Event Template
  const itemEventTemplate = (item) => {
    setEventImageFileName(item.filename);

    return (
      <>
        {eventImage && (
          <Image src={eventImage} alt="Image" style={{ height: "100%" }} />
        )}

        <InfoIcon
          onClick={() => setVisible(true)}
          className="infobtn"
          color="info"
        />
        <Dialog
          header={item.title}
          visible={visible}
          style={{ width: "50vw" }}
          onHide={() => {
            if (!visible) return;
            setVisible(false);
          }}
          className="dialogHeader dialogContent"
        >
          <div style={{ padding: "0.5rem 0" }}>
            <Typography style={{ fontWeight: 600, marginBottom: "0.4rem" }}>
              {item.fromdate} - {item.toDate}
            </Typography>
            <Typography>{item.notification}</Typography>
          </div>
        </Dialog>
      </>
    );
  };

  //Notification Thumbnail Template
  // const notificationThumbnailTemplate = (item) => {
  //   return <p>{item.title}</p>;
  // };

  //Email ID to Name
  const emailToName = (email) => {
    if (!email) return "";
    const name = email?.split("@")[0];
    const nameParts = name.split(".");
    const formattedName = nameParts.map((ele) => {
      //console.log("email",ele[0].toUpperCase().concat(ele.slice(1)));
      return ele[0].toUpperCase().concat(ele.slice(1));
    });

    return formattedName.join(" ");
  };

  //For MUI Avatar
  const StyledBadge = styled(Badge)(({ theme }) => ({
    "& .MuiBadge-badge": {
      backgroundColor: "#2196f3",
      color: "white",
      boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
      borderRadius: "50%",
      width: 22,
      height: 22,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      bottom: 0,
      //right: 0,
      top: 20,
      //left:5
    },
  }));

  //On Tour Switch
  const handleChangeOnTour = async (event) => {
    //console.log("event.target.checked", event.target.checked);
    const checkValue = event.target.checked;
    const { token } = getUserData();
    const onTourSwitchUpdate = await postOnTourSwitchUpdate(token, checkValue);
    //console.log("onTourSwitchUpdate", onTourSwitchUpdate);
    if (onTourSwitchUpdate.status === 200) {
      setOnTourSwitch(checkValue);
      showSuccessMessage(toastRef, "Confirmed", "Your tour has started");
    } else if (onTourSwitchUpdate.status === 400) {
      showErrorMessage(
        toastRef,
        "Invalid Action",
        "You might have already closed a travel today!"
      );
    } else {
      showErrorMessage(toastRef, "Error", "Internal Server Error");
    }
  };

  //Set On Tour Switch Api Value
  useEffect(() => {
    setOnTourSwitch(nextHolidayData?.onTour ?? false);
  }, [nextHolidayData]);

  //Change Profile Picture
  const inputRef = useRef(null); // Make sure this is declared at the top of your component
  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      console.warn("No file selected.");
      return;
    }

    console.log("upload_file", file);

    const {
      token,
      userDetails: { employeeId, userName },
    } = getUserData();

    try {
      const profileUploadResponse = await postProfilePictureUpload(
        token,
        file,
        employeeId,
        userName
      );

      console.log("profileUploadResponse", profileUploadResponse);

      if (profileUploadResponse?.status === 201) {
        const imageUrl = URL.createObjectURL(file);
        setUserProfileImage(imageUrl);
        showSuccessMessage(toastRef, "Success", "File Upload Successfully");
      } else {
        showErrorMessage(toastRef, "Error", "File upload failed");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      showErrorMessage(toastRef, "Error", "Something went wrong");
    } finally {
      // Reset input so user can reselect the same file
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  //Submit Feedback
  const handelFeedBackSubmit = async (e) => {
    e.preventDefault();
    console.log("Feedback submitted:", feedback);
    const { token } = getUserData();
    const feedbackApiResponse = await postFeedbackForm(token, feedback);
    console.log("feedbackApiResponse", feedbackApiResponse);
    if (feedbackApiResponse.status === 200) {
      showSuccessMessage(
        toastRef,
        "Success",
        "Feedback submitted successfully"
      );
      setFeedback("");
      setFeedbackDialogVisible(false);
    } else {
      showErrorMessage(toastRef, "Error", "Feedback submission failed");
    }
  };

  return (
    <>
      {loader ? (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <div className="container mx-auto px-4">
          <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
            <div className="card mt-4 py-2 px-3">
              <Grid container spacing={2}>
                <Grid size={3}>
                  <Grid
                    size={12}
                    container
                    direction="row"
                    sx={{
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <StyledBadge
                      overlap="circular"
                      anchorOrigin={{ vertical: "top", horizontal: "right" }}
                      badgeContent={
                        <>
                          <input
                            ref={inputRef}
                            id="avatar-upload"
                            type="file"
                            style={{
                              display: "none",
                            }}
                            accept="image/*"
                            onChange={handleAvatarChange}
                          />
                          <label htmlFor="avatar-upload">
                            <IconButton
                              size="small"
                              component="span"
                              // style={{ padding: 0, background: "#6366f1", borderRadius: "50%" }}
                            >
                              <EditIcon
                                fontSize="small"
                                sx={{ color: "white", fontSize: "0.9rem" }}
                              />
                            </IconButton>
                          </label>
                        </>
                      }
                    >
                      <Avatar
                        sx={{
                          width: 140,
                          height: 140,
                          background: "#F2F2FE",
                          border: "4px solid #fff",
                        }}
                      >
                        <Image
                          src={userProfileImage}
                          alt="Image"
                          style={{ height: "100%" }}
                        />
                      </Avatar>
                    </StyledBadge>
                  </Grid>
                  <Grid>
                    <Grid size={12}>
                      {/* <Card
                      className="cardNew BorderRadius cardStyle" 
                        sx={{
                          padding: "0.9rem",
                          //background:"linear-gradient(119deg, transparent 0%, #dde45024 100%)",
                        }}
                      >  */}
                      <Grid container>
                        {/* Employee Name */}
                        <Grid size={12}>
                          <div style={{ textAlign: "center" }}>
                            <Typography
                              id="userName"
                              style={{ color: "#29343D", fontSize: "1.1rem" }}
                            >
                              {userProfile?.userName}
                            </Typography>
                          </div>
                        </Grid>

                        {/* Designation */}
                        <Grid size={12}>
                          <div style={{ textAlign: "center" }}>
                            <Typography
                              id="designation"
                              className="fontSize-sm"
                              sx={{ color: "#645e5e" }}
                            >
                              {userProfile?.designation}
                            </Typography>
                          </div>
                        </Grid>

                        {/* Department */}

                        <Grid
                          size={12}
                          sx={{
                            padding: "0.3rem",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              marginTop: "0.3rem",
                              columnGap: "1rem",
                            }}
                          >
                            <Typography
                              id="department"
                              className="fontSize-sm"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                color: "#645e5e",
                              }}
                            >
                              <Tooltip title="Department" placement="top">
                                <WorkIcon
                                  fontSize="small"
                                  className="departmentIconStyle"
                                />
                              </Tooltip>
                              {userProfile?.department}
                            </Typography>

                            <Typography
                              id="manager"
                              className="fontSize-sm"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                color: "#645e5e",
                              }}
                            >
                              <Tooltip title="Manager Name" placement="top">
                                <SupervisorAccountIcon
                                  fontSize="small"
                                  className="managerIconStyle"
                                />
                              </Tooltip>
                              {emailToName(userProfile?.manager)}
                            </Typography>
                          </div>
                        </Grid>
                      </Grid>
                      {/* </Card>  */}
                    </Grid>
                  </Grid>
                  <Grid sx={{ marginTop: "0.5rem" }}>
                    <Grid size={12}>
                      <Card
                        className="cardNew BorderRadius cardStyle"
                        sx={{
                          padding: "0.9rem",
                          //background:"linear-gradient(119deg, transparent 0%, #dde45024 100%)",
                        }}
                      >
                        <Grid container direction="column" spacing={1}>
                          {/*Last Appraisal Date */}
                          <Grid size={12}>
                            <div className="NewCard">
                              <Typography
                                className="fontSize-sm"
                                sx={{ m: 0, fontWeight: 500 }}
                              >
                                Last Appraisal Date
                              </Typography>

                              <Tag
                                style={{ background: "#8399a2" }}
                                //severity="success"
                                className="TagStyle"
                                value={appraisalData.lastAppraisalDate ?? "NA"}
                                rounded
                              ></Tag>
                            </div>
                          </Grid>

                          {/* Next Appraisal Date */}
                          <Grid>
                            <div className="NewCard">
                              <Typography
                                className="fontSize-sm"
                                sx={{ m: 0, fontWeight: 500 }}
                              >
                                Next Appraisal Date
                              </Typography>
                              <Tag
                                style={{ background: "#8399a2" }}
                                //severity="success"
                                className="TagStyle"
                                value={appraisalData.nextAppraisalDate ?? "NA"}
                                rounded
                              ></Tag>
                            </div>
                          </Grid>
                        </Grid>
                      </Card>
                    </Grid>
                  </Grid>

                  <Grid sx={{ marginTop: "0.5rem" }}>
                    <Grid size={12}>
                      <Card
                        className="cardNew BorderRadius cardStyle"
                        sx={{
                          padding: "0.9rem",
                          //background:"linear-gradient(119deg, transparent 0%, #dde45024 100%)",
                        }}
                      >
                        <Grid container direction="column" spacing={1}>
                          {/*Current Training */}
                          <Grid size={12}>
                            <div className="NewCard">
                              <Typography className="fontSize-sm">
                                Current Training
                              </Typography>

                              <Tag
                                severity="info"
                                className="TagStyle"
                                value={trainingData.currentTraining ?? "NA"}
                                rounded
                              ></Tag>
                            </div>
                          </Grid>

                          {/* Next Training */}
                          <Grid>
                            <div className="NewCard">
                              <Typography
                                className="fontSize-sm"
                                sx={{ m: 0, fontWeight: 500 }}
                              >
                                Next Training
                              </Typography>

                              <Tag
                                severity="Info"
                                className="TagStyle"
                                value={trainingData.nextTraining ?? "NA"}
                                rounded
                              ></Tag>
                            </div>
                          </Grid>
                        </Grid>
                      </Card>
                    </Grid>
                  </Grid>

                  <Grid sx={{ marginTop: "0.5rem" }}>
                    <Grid size={12}>
                      <Card
                        className="cardNew BorderRadius cardStyle"
                        sx={{
                          padding: "0.9rem",
                          //background:"linear-gradient(119deg, transparent 0%, #dde45024 100%)",
                        }}
                      >
                        <Grid container direction="column" spacing={1}>
                          {/*Approved Claims*/}
                          <Grid size={12}>
                            <div className="NewCard">
                              <Typography
                                className="fontSize-sm"
                                sx={{ m: 0, fontWeight: 500 }}
                              >
                                Approved Claims
                              </Typography>

                              <Tag
                                severity="success"
                                className="TagStyle"
                                value={tourClaims?.approvedClaims ?? "NA"}
                                rounded
                              ></Tag>
                            </div>
                          </Grid>

                          {/* Reviewing / Reviewed Claims */}
                          <Grid>
                            <div className="NewCard">
                              <Typography className="fontSize-sm">
                                Reviewing / Reviewed Claims
                              </Typography>

                              <Tag
                                severity="success"
                                className="TagStyle"
                                value={
                                  tourClaims?.tourClaimsUnderReview ?? "NA"
                                }
                                rounded
                              ></Tag>
                            </div>
                          </Grid>
                          <Grid>
                            <div className="NewCard">
                              <Typography className="fontSize-sm">
                                Travel Status
                              </Typography>

                              <Tag
                                severity="success"
                                className="TagStyle"
                                value={
                                  tourClaims?.travelReqUnderProcessStatus ??
                                  "NA"
                                }
                                rounded
                              ></Tag>
                            </div>
                          </Grid>
                        </Grid>
                      </Card>
                    </Grid>
                  </Grid>
                </Grid>
                <Grid size={9}>
                  <Grid>
                    <Grid size={12}>
                      <Card
                        className="cardNew BorderRadius cardStyle"
                        sx={
                          {
                            //p: 2,
                            //background:"linear-gradient(119deg, transparent 0%, #dde45024 100%)",
                          }
                        }
                      >
                        <Grid container direction="column" spacing={1}>
                          {/*Carousel */}
                          <Grid>
                            <div
                              className="NewCard"
                              style={{ height: "19.3rem", display: "grid" }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <Typography
                                  sx={{ m: "0.2rem 0.5rem", fontWeight: 500 }}
                                >
                                  {nextHolidayData?.nextHoliday}
                                </Typography>

                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <Typography
                                    sx={{ m: "0.2rem 0.5rem", fontWeight: 500 }}
                                  >
                                    On Tour
                                  </Typography>
                                  <Switch
                                    size="small"
                                    checked={onTourSwitch}
                                    onChange={handleChangeOnTour}
                                  />

                                  <IconButton
                                    aria-label="delete"
                                    size="small"
                                    onClick={() =>
                                      setFeedbackDialogVisible(true)
                                    }
                                  >
                                    <CommentIcon fontSize="inherit" />
                                  </IconButton>
                                </div>
                              </div>
                              <Galleria
                                value={eventData}
                                className="NotificationThumbnail"
                                item={itemEventTemplate}
                                //thumbnail={notificationThumbnailTemplate}
                                // showThumbnailNavigators={false}
                                circular
                                autoPlay
                                transitionInterval={5 * 1000}
                                showIndicators
                                //showIndicatorsOnItem
                                // showItemNavigatorsOnHover
                                // showItemNavigators
                              />
                            </div>
                          </Grid>
                        </Grid>
                      </Card>
                    </Grid>
                    <Grid container spacing={2}>
                      <Grid size={5}>
                        {/* Claims */}
                        <Grid sx={{ marginTop: "0.5rem" }}>
                          <Grid size={12}>
                            <Card
                              className="cardNew BorderRadius cardStyle"
                              sx={{
                                padding: "0.9rem",
                                //background:"linear-gradient(119deg, transparent 0%, #dde45024 100%)",
                              }}
                            >
                              <Grid container direction="column" spacing={1}>
                                {/*Total Unsettled Advance*/}
                                <Grid size={12}>
                                  <div className="NewCard">
                                    <Typography className="fontSize-sm">
                                      Total Unsettled Advance
                                    </Typography>

                                    <Typography className="fontSize-sm">
                                      {tourClaims?.totalUnsettledAmount ?? "NA"}
                                    </Typography>
                                  </div>
                                </Grid>

                                {/* Loan Amount Pending */}
                                <Grid>
                                  <div className="NewCard">
                                    <Tooltip
                                      placement="top"
                                      title={`Total Loan Amount - ${tourClaims?.totalLoanAmount}`}
                                    >
                                      <Typography className="fontSize-sm">
                                        Loan Amount Pending
                                      </Typography>
                                    </Tooltip>

                                    <Typography className="fontSize-sm">
                                      {tourClaims?.pendingLoanAmount ?? "NA"}
                                    </Typography>
                                  </div>
                                </Grid>
                              </Grid>
                            </Card>
                          </Grid>
                        </Grid>
                        {/* CL And PL Section */}
                        <Grid sx={{ marginTop: "0.5rem" }}>
                          <Grid size={12}>
                            <Card
                              className="cardNew BorderRadius cardStyle"
                              sx={{
                                padding: "0.9rem",
                                //background:"linear-gradient(119deg, transparent 0%, #dde45024 100%)",
                              }}
                            >
                              <Grid container direction="column" spacing={1}>
                                {/*CL Available*/}
                                <Grid>
                                  <div className="NewCard">
                                    <Tooltip
                                      placement="top"
                                      title={`Total CL Used - ${tourClaims?.clUsed}`}
                                    >
                                      <Typography className="fontSize-sm">
                                        CL Available
                                      </Typography>
                                    </Tooltip>

                                    <Typography className="fontSize-sm">
                                      {tourClaims?.clAvailable ?? "NA"}
                                    </Typography>
                                  </div>
                                </Grid>

                                {/* PL Available */}
                                <Grid>
                                  <div className="NewCard">
                                    <Tooltip
                                      placement="top"
                                      title={`Total PL Used - ${tourClaims?.plUsed}`}
                                    >
                                      <Typography className="fontSize-sm">
                                        PL Available
                                      </Typography>
                                    </Tooltip>

                                    <Typography className="fontSize-sm">
                                      {tourClaims?.plAvailable ?? "NA"}
                                    </Typography>
                                  </div>
                                </Grid>
                              </Grid>
                            </Card>
                          </Grid>
                        </Grid>
                        {/* Attendance / Leaves Taken (Current Month) */}
                        <Grid sx={{ marginTop: "0.5rem" }}>
                          <Grid size={12}>
                            <Card
                              className="cardNew BorderRadius cardStyle"
                              sx={{
                                padding: "0.9rem",
                                //background:"linear-gradient(119deg, transparent 0%, #dde45024 100%)",
                              }}
                            >
                              <Grid container direction="column" spacing={1}>
                                {/*Attendance / Leaves Taken (Current Month)*/}
                                <Grid>
                                  <div className="NewCard">
                                    <Typography className="fontSize-sm">
                                      Attendance / Leaves Taken (Current Month)
                                    </Typography>

                                    <Typography className="fontSize-sm">
                                      {tourClaims?.leaveAndAttendanceInMonth ??
                                        "NA"}
                                    </Typography>
                                  </div>
                                </Grid>
                              </Grid>
                            </Card>
                          </Grid>
                        </Grid>
                      </Grid>
                      <Grid size={7}>
                        <Grid sx={{ marginTop: "0.5rem" }}>
                          <Grid size={12}>
                            <Card
                              className="cardNew BorderRadius cardStyle"
                              sx={{
                                //p: 2,
                                height: "15.5rem",
                                //background:"linear-gradient(119deg, transparent 0%, #dde45024 100%)",
                              }}
                            >
                              <Galleria
                                value={notificationData}
                                className="NotificationThumbnail"
                                item={itemNotificationTemplate}
                                //thumbnail={notificationThumbnailTemplate}
                                showThumbnailNavigators={false}
                                circular
                                autoPlay
                                transitionInterval={5 * 1000}
                              />
                            </Card>
                          </Grid>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </div>
          </div>
          <Dialog
            header="YOUR FEEDBACK FORM"
            visible={feedbackDialogVisible}
            style={{ width: "30vw" }}
            onHide={() => {
              if (!feedbackDialogVisible) return;
              setFeedbackDialogVisible(false);
            }}
            className="dialogHeader dialogContent"
          >
            <div style={{ display: "grid" }}>
              <form onSubmit={handelFeedBackSubmit}>
                <input
                  type="text"
                  id="feedText"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Enter Your Feedback"
                  style={{
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                    padding: "0.5rem",
                    width: "100%",
                    marginTop: "0.5rem",
                  }}
                />
                <br />
                <button
                  type="submit"
                  style={{
                    backgroundColor: "rgb(76, 175, 80)",
                    color: "white",
                    padding: "5px 10px",
                    border: "none",
                    borderRadius: "1rem",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "14px",
                    marginTop: "10px",
                  }}
                >
                  Submit
                </button>
              </form>
            </div>
          </Dialog>
          <Toast ref={toastRef} />
        </div>
      )}
    </>
  );
};

export default HomePage;
