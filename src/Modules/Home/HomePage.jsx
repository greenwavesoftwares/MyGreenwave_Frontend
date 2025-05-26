import {
  Avatar,
  Grid,
  Card,
  Typography,
  Tooltip,
  IconButton,
  Button,
  Box,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import "./HomePage.css";
import { Galleria } from "primereact/galleria";
import { formatDate } from "../Appraisal/formatDate";
import { Image } from "primereact/image";
import { Dialog } from "primereact/dialog";
import InfoIcon from "@mui/icons-material/Info";
import { Checkbox } from "primereact/checkbox";
import { Tag } from "primereact/tag";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import CircularProgress from "@mui/material/CircularProgress";

//Api
import { homePageApi, getUserDataAPI } from "./HomePageAPI";
import { getUserData } from "../Login/Encrypt";
const imageApiUrl = import.meta.env.VITE_IMAGE_API;
//SCSS Import
import "../Appraisal/Appraisal.scss";

const HomePage = () => {
  const [notificationData, setNotificationData] = useState([]);
  const [eventData, setEventData] = useState([]);
  const [basicUserInfo, setBasicUserInfo] = useState({});
  const [visible, setVisible] = useState(false);
  const [userProfile, setUserProfile] = useState({});
  const [loader, setLoader] = useState(false);

  //Call Home PAhe All
  const getHomePageData = async () => {
    try {
      const { token } = getUserData();
      //Get User Data
      const userDetails = await getUserDataAPI(token);
      setUserProfile(userDetails.data);

      //Home Page Loader
      setLoader(true);

      const response = await homePageApi();
      if (response.status === 200) {
        //Get Notification Data
        setNotificationData(response.data.notification);
        //Get Event Data
        setEventData(response.data.event);
        //Get Basic User Info
        setBasicUserInfo(response.data.personalData);
        //Set Loader to false
        setLoader(false);
      }
    } catch (error) {
      if (error) {
        setLoader(false);
        console.error("Error fetching home page data:", error);
      }
      else{
        setLoader(false);
        console.error("Error fetching home page data: Unknown error");
      }
    }
  };

  //Call Home Page API
  useEffect(() => {
    getHomePageData();
  }, []);

  //Notification Template
  const itemNotificationTemplate = (item) => {
    return (
      <div style={{ display: "grid", justifyContent: "start" }}>
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
        <Typography
          className="fontSize-sm"
          sx={{ fontWeight: 600, marginBottom: "0.2rem" }}
        >
          {formatDate(item.Fromdate)} - {formatDate(item.Todate)}
        </Typography>
        <Typography className="fontSize-sm" sx={{ marginBottom: "0.2rem" }}>
          {item.notification}
        </Typography>
        <a
          style={{ fontWeight: "bold" }}
          className=""
          target="_blank"
          href={item.url}
        >
          Click Here For More Information
        </a>
      </div>
    );
  };

  //Event Template
  const itemEventTemplate = (item) => {
    return (
      <>
        <Image
          src={`${imageApiUrl}/events/image/${item.filename}`}
          alt="Image"
          style={{ height: "100%" }}
        />

        <InfoIcon
          onClick={() => setVisible(true)}
          className="infobtn"
          color="secondary"
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
              {formatDate(item.Fromdate)} - {formatDate(item.Todate)}
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
      return ele;
    });

    return formattedName.join(" ");
  };

  //console.log("basicUserInfo",basicUserInfo);

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
                    <Avatar sx={{ width: 86, height: 86 }}>
                      <Image
                        src={`${imageApiUrl}/images/image/${
                          userProfile.employeeId +
                          userProfile.userName?.replace(" ", "_")
                        }.png`}
                        alt="Image"
                        style={{ height: "100%" }}
                      />
                    </Avatar>
                  </Grid>
                  <Grid>
                    <Grid item xs={12}>
                      <Card
                        className="cardNew BorderRadius"
                        sx={{
                          padding: "0.9rem",
                          //background:"linear-gradient(119deg, transparent 0%, #dde45024 100%)",
                        }}
                      >
                        <Grid container>
                          {/* Employee ID */}
                          <Grid size={12}>
                            <div className="NewCard">
                              <Typography
                                className="fontSize-sm"
                                sx={{ m: 0, fontWeight: 500 }}
                              >
                                Employee ID
                              </Typography>

                              <Typography id="empID" className="fontSize-sm">
                                {userProfile?.employeeId}
                              </Typography>
                            </div>
                          </Grid>

                          {/* Designation */}
                          <Grid size={12}>
                            <div className="NewCard">
                              <Typography
                                className="fontSize-sm"
                                sx={{ m: 0, fontWeight: 500 }}
                              >
                                Designation
                              </Typography>

                              <Typography
                                id="designation"
                                className="fontSize-sm"
                              >
                                {userProfile?.designation}
                              </Typography>
                            </div>
                          </Grid>

                          {/* Department */}
                          <Grid size={12}>
                            <div className="NewCard">
                              <Typography
                                className="fontSize-sm"
                                sx={{ m: 0, fontWeight: 500 }}
                              >
                                Department
                              </Typography>

                              <Typography
                                id="department"
                                className="fontSize-sm"
                              >
                                {userProfile?.department}
                              </Typography>
                            </div>
                          </Grid>

                          {/* Date of Joining */}
                          <Grid size={12}>
                            <div className="NewCard">
                              <Typography
                                className="fontSize-sm"
                                sx={{ m: 0, fontWeight: 500 }}
                              >
                                Date Of Joining
                              </Typography>

                              <Typography id="doj" className="fontSize-sm">
                                {formatDate(userProfile?.doj)}
                              </Typography>
                            </div>
                          </Grid>

                          {/* Password Expiration Date */}
                          <Grid size={12}>
                            <div className="NewCard">
                              <Typography
                                className="fontSize-sm"
                                sx={{ m: 0, fontWeight: 500 }}
                              >
                                Password Expires
                              </Typography>

                              <Typography id="passExp" className="fontSize-sm">
                                {userProfile?.passwordExpiryDate}
                              </Typography>
                            </div>
                          </Grid>

                          {/* Manager */}
                          <Grid size={12}>
                            <div className="NewCard">
                              <Typography
                                className="fontSize-sm"
                                sx={{ m: 0, fontWeight: 500 }}
                              >
                                Manager
                              </Typography>

                              <Typography id="manager" className="fontSize-sm">
                                {emailToName(userProfile?.manager)}
                              </Typography>
                            </div>
                          </Grid>
                        </Grid>
                      </Card>
                    </Grid>
                  </Grid>
                  <Grid sx={{ marginTop: "0.5rem" }}>
                    <Grid item xs={12}>
                      <Card
                        className="cardNew BorderRadius"
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
                                severity="success"
                                className="TagStyle"
                                value={basicUserInfo.lastAppraisalDate ?? "NA"}
                                rounded
                              ></Tag>
                            </div>
                          </Grid>

                          {/* Next Appraisal Date */}
                          <Grid item>
                            <div className="NewCard">
                              <Typography
                                className="fontSize-sm"
                                sx={{ m: 0, fontWeight: 500 }}
                              >
                                Next Appraisal Date
                              </Typography>
                              <Tag
                                severity="success"
                                className="TagStyle"
                                value={basicUserInfo.nextAppraisalDate ?? "NA"}
                                rounded
                              ></Tag>
                            </div>
                          </Grid>
                        </Grid>
                      </Card>
                    </Grid>
                  </Grid>

                  <Grid sx={{ marginTop: "0.5rem" }}>
                    <Grid item xs={12}>
                      <Card
                        className="cardNew BorderRadius"
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
                                severity="Info"
                                className="TagStyle"
                                value={basicUserInfo.currentTraining ?? "NA"}
                                rounded
                              ></Tag>
                            </div>
                          </Grid>

                          {/* Next Training */}
                          <Grid item>
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
                                value={basicUserInfo.nextTraining ?? "NA"}
                                rounded
                              ></Tag>
                            </div>
                          </Grid>
                        </Grid>
                      </Card>
                    </Grid>
                  </Grid>

                  <Grid sx={{ marginTop: "0.5rem" }}>
                    <Grid item xs={12}>
                      <Card
                        className="cardNew BorderRadius"
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
                                value={basicUserInfo?.approvedClaims}
                                rounded
                              ></Tag>
                            </div>
                          </Grid>

                          {/* Reviewing / Reviewed Claims */}
                          <Grid item>
                            <div className="NewCard">
                              <Typography className="fontSize-sm">
                                Reviewing / Reviewed Claims
                              </Typography>

                              <Tag
                                severity="success"
                                className="TagStyle"
                                value={basicUserInfo?.reviewingOrReviewedClaims}
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
                    <Grid item xs={12}>
                      <Card
                        className="cardNew BorderRadius"
                        sx={
                          {
                            //p: 2,
                            //background:"linear-gradient(119deg, transparent 0%, #dde45024 100%)",
                          }
                        }
                      >
                        <Grid container direction="column" spacing={1}>
                          {/*Carousel */}
                          <Grid item>
                            <div
                              className="NewCard"
                              style={{ height: "18.5rem", display: "grid" }}
                            >
                              <Typography sx={{ m: "0.2rem", fontWeight: 500 }}>
                                Next Public Holiday :
                              </Typography>

                              <Galleria
                                value={eventData}
                                className="NotificationThumbnail"
                                item={itemEventTemplate}
                                //thumbnail={notificationThumbnailTemplate}
                                showThumbnailNavigators={false}
                                circular
                                autoPlay
                                transitionInterval={10000}
                                //showIndicators
                                //showIndicatorsOnItem
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
                          <Grid item xs={12}>
                            <Card
                              className="cardNew BorderRadius"
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
                                      {basicUserInfo?.totalUnsettledAdvance}
                                    </Typography>
                                  </div>
                                </Grid>

                                {/* Loan Amount Pending */}
                                <Grid item>
                                  <div className="NewCard">
                                    <Typography className="fontSize-sm">
                                      Loan Amount Pending
                                    </Typography>

                                    <Typography className="fontSize-sm">
                                      {basicUserInfo?.loanAmountPending}
                                    </Typography>
                                  </div>
                                </Grid>
                              </Grid>
                            </Card>
                          </Grid>
                        </Grid>
                        {/* CL And PL Section */}
                        <Grid sx={{ marginTop: "0.5rem" }}>
                          <Grid item xs={12}>
                            <Card
                              className="cardNew BorderRadius"
                              sx={{
                                padding: "0.9rem",
                                //background:"linear-gradient(119deg, transparent 0%, #dde45024 100%)",
                              }}
                            >
                              <Grid container direction="column" spacing={1}>
                                {/*CL Available*/}
                                <Grid item>
                                  <div className="NewCard">
                                    <Typography className="fontSize-sm">
                                      CL Available
                                    </Typography>

                                    <Typography className="fontSize-sm">
                                      {basicUserInfo?.clAvailable}
                                    </Typography>
                                  </div>
                                </Grid>

                                {/* PL Available */}
                                <Grid item>
                                  <div className="NewCard">
                                    <Typography className="fontSize-sm">
                                      PL Available
                                    </Typography>

                                    <Typography className="fontSize-sm">
                                      {basicUserInfo?.plAvailable}
                                    </Typography>
                                  </div>
                                </Grid>
                              </Grid>
                            </Card>
                          </Grid>
                        </Grid>
                        {/* Attendance / Leaves Taken (Current Month) */}
                        <Grid sx={{ marginTop: "0.5rem" }}>
                          <Grid item xs={12}>
                            <Card
                              className="cardNew BorderRadius"
                              sx={{
                                padding: "0.9rem",
                                //background:"linear-gradient(119deg, transparent 0%, #dde45024 100%)",
                              }}
                            >
                              <Grid container direction="column" spacing={1}>
                                {/*Attendance / Leaves Taken (Current Month)*/}
                                <Grid item>
                                  <div className="NewCard">
                                    <Typography className="fontSize-sm">
                                      Attendance / Leaves Taken (Current Month)
                                    </Typography>

                                    <Typography className="fontSize-sm">
                                      {
                                        basicUserInfo?.attendanceOrLeavesTakenCurrentMonth
                                      }
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
                          <Grid item xs={12}>
                            <Card
                              className="cardNew BorderRadius"
                              sx={{
                                p: 2,
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
                                transitionInterval={5000}
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
        </div>
      )}
    </>
  );
};

export default HomePage;
