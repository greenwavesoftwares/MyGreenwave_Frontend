import { Button, Paper } from "@mui/material";
import FileCopyOutlinedIcon from "@mui/icons-material/FileCopyOutlined";
import PersonIcon from "@mui/icons-material/Person";
import KeyIcon from "@mui/icons-material/Key";
import { useEffect, useState } from "react";
import { getUserData } from "../Login/Encrypt";
import { getUserDetailsAPI } from "../Login/LoginAPI";
import ResetPassword from "../ResetPassword/ResetPassword";
import UserLog from "../AdminPage/UserLog/UserLog";
import Typography from "../../components/Typography/Typography";
import Chip from "../../components/Chip/Chip";
import "./UserProfile.css";
import "./UserProfile.scss";
import { TabPanel, TabView } from "primereact/tabview";
import EmailIcon from "@mui/icons-material/Email";
import WorkIcon from "@mui/icons-material/Work";
import ShieldIcon from "@mui/icons-material/Shield";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EditIcon from "@mui/icons-material/Edit";
import EventIcon from "@mui/icons-material/Event";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import GppGoodIcon from "@mui/icons-material/GppGood";
import CallIcon from "@mui/icons-material/Call";
import DescriptionIcon from "@mui/icons-material/Description";
import InfoIcon from "@mui/icons-material/Info";
export default function UserProfile() {
  const [showAccountInfo, setShowAccountInfo] = useState(true); //state to show the Account Details if true and to show the Reset Password component if false
  const [userDetails, setUserDetails] = useState(null); //state to hold the user details
  const [showLogsDialog, setShowLogsdialog] = useState(false); //state to show logs if true
  const token = getUserData().token; //constant to hold current token

  const fetchData = async () => {
    const details = await getUserDetailsAPI(token);
    setUserDetails(details);
  };
  const onHideLogs = () => {
    setShowLogsdialog(false);
  };
  useEffect(() => {
    fetchData();
  }, []);

  function getInitialsFromEmail(email) {
    const namePart = email.split("@")[0];
    const parts = namePart.split(".");

    const initials = parts.map((part) => part.charAt(0).toUpperCase()).join("");

    return initials;
  }

  return (
    <>
      {userDetails && (
        <div className="container mx-auto px-4">
          <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
            <div className="cardStyle mt-3  shadow rounded">
              <TabView panelContainerClassName="tab-view">
                <TabPanel
                  header="Account Info"
                  headerClassName="tab-view"
                  contentClassName="tab-view"
                  className="tab-view"
                >
                  {/* <Paper className="paper-div">
              <div className="table-header">User Profile</div>
              <div className="table">
              
              
                <div className="table-row">
                  <Typography className="table-cell table-cell-header">User Name</Typography>
                  <Typography className="table-cell">{userDetails.userName}</Typography>
                </div>

                <div className="table-row">
                  <Typography className="table-cell table-cell-header">User Id</Typography>
                  <Typography className="table-cell">{userDetails.userId}</Typography>
                </div>

                <div className="table-row">
                  <Typography className="table-cell table-cell-header">
                    Allotted Pages
                  </Typography>
                  <div className="table-cell">
                    <div className="table-cell-allottedpages">
                      {userDetails.allotedPages.map(
                        (allotedPage, pageIndex) => (
                          <Chip size={"small"}  key={pageIndex} label={allotedPage} className="chip-info"/>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="table-row">
                  <Typography className="table-cell table-cell-header">
                    Phone Number
                  </Typography>
                  <Typography className="table-cell">{userDetails.phoneNumber}</Typography>
                </div>

                <div className="table-row">
                  <Typography className="table-cell table-cell-header">Created On</Typography>
                  <Typography className="table-cell">{userDetails.createdOn}</Typography>
                </div>

                <div className="table-row">
                  <Typography className="table-cell table-cell-header">
                    Last Modified On
                  </Typography>
                  <Typography className="table-cell">{userDetails.modifiedOn}</Typography>
                </div>

                <div className="table-row">
                  <Typography className="table-cell table-cell-header">Created By</Typography>
                  <Typography className="table-cell">{userDetails.createdBy}</Typography>
                </div>

                <div className="table-row">
                  <Typography className="table-cell table-cell-header">
                    Last Modified By
                  </Typography>
                  <Typography className="table-cell">{userDetails.modifiedBy}</Typography>
                </div>

                <div className="table-row">
                  <Typography className="table-cell table-cell-header">Last Login</Typography>
                  <Typography className="table-cell">{userDetails.lastLogin}</Typography>
                </div>

                <div className="table-row">
                  <Typography className="table-cell table-cell-header">
                    Password Expiry Date
                  </Typography>
                  <Typography className="table-cell">
                    {userDetails.passwordExpiryDate}
                  </Typography>
                </div>

                <div className="table-row">
                  <Typography className="table-cell table-cell-header">Logs</Typography>
                  <div className="table-cell">
                    <FileCopyOutlinedIcon
                      color="info"
                      className="logs-icon"
                      onClick={() => {
                        setShowLogsdialog(true);
                      }}
                    />
                  </div>
                </div>
              </div>
            </Paper> */}

                  <div
                    className="   min-h-screen rounded-sm shadow-1"
                    style={{ borderRadius: "1rem" }}
                  >
                    <div
                      className="overflow-hidden defaultBorder"
                      style={{ borderRadius: "1rem 1rem 0rem 0rem" }}
                    >
                      {/* Header Section */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-7 py-5 rounded-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-semibold shadow-lg">
                              {getInitialsFromEmail(userDetails.userId)}
                            </div>
                            <div style={{ marginLeft: "0.5rem" }}>
                              <p
                                className="text-2xl font-bold"
                                style={{ color: "#4b5563" }}
                              >
                                {userDetails.userName}
                              </p>
                              <p
                                className="font-medium  mt-1"
                                style={{ color: "#4b5563" }}
                              >
                                <EmailIcon
                                  style={{
                                    marginRight: "0.35rem",
                                    fontSize: "1rem",
                                  }}
                                />
                                {userDetails.userId}
                              </p>
                              <p
                                className="  flex items-center mt-1"
                                style={{ color: "#4b5563" }}
                              >
                                {/* <MapPin className="w-4 h-4 mr-1" /> */}
                                <CallIcon
                                  style={{
                                    marginRight: "0.35rem",
                                    fontSize: "1rem",
                                  }}
                                />
                                {userDetails.phoneNumber}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Permissions & Access*/}
                      <div
                        className=" space-y-3"
                        style={{ padding: "1rem 1rem 0 1rem" }}
                      >
                        <div className="cardBG rounded-xl p-4">
                          <div
                            className=" mb-3"
                            style={{ display: "flex", alignItems: "center" }}
                          >
                            <GppGoodIcon
                              style={{
                                color: "#16a34a",
                                marginRight: "0.7rem",
                                fontSize: "1.3rem",
                              }}
                            />

                            <Typography
                              className=""
                              style={{
                                //color: "#4b5563",
                                fontSize: "0.88rem",
                                fontWeight: 600,
                              }}
                            >
                              Allotted Pages
                            </Typography>
                          </div>

                          {userDetails.allotedPages.map(
                            (allotedPage, pageIndex) => (
                              <Chip
                                size={"small"}
                                key={pageIndex}
                                label={allotedPage}
                                className="chip-info"
                                style={{
                                  margin: "0.3rem",
                                  color: "#1e40af !important",
                                }}
                              />
                            )
                          )}
                        </div>
                      </div>
                      {/* System Information */}
                      <div className="p-3 space-y-3">
                        <div className="cardBG rounded-xl p-4">
                          <div className="mb-4" style={{ display: "flex" }}>
                            <InfoIcon
                              style={{
                                color: "#486cf7",
                                marginRight: "0.7rem",
                                fontSize: "1.3rem",
                              }}
                            />

                            <Typography
                              className=""
                              style={{
                                //color: "#4b5563",
                                fontSize: "0.88rem",
                                fontWeight: 600,
                              }}
                            >
                              System Information
                            </Typography>
                          </div>

                          <div className="w-full px-8">
                            <div
                              className="grid grid-cols-2 gap-6"
                              style={{ display: "grid" }}
                            >
                              <div className="space-y-4">
                                {/* Created On */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Created On
                                  </label>
                                  <div
                                    className="px-3 py-2 inputFieldStyle border rounded-lg text-gray-900 flex items-center"
                                    style={{ borderColor: "#e5e7eb" }}
                                  >
                                    <CalendarTodayIcon
                                      style={{
                                        color: "#9ca3af",
                                        marginRight: "0.6rem",
                                        fontSize: "0.95rem",
                                      }}
                                    />
                                    {userDetails.createdOn}
                                  </div>
                                </div>

                                {/* Last Modified By */}
                                <div className="mt-4">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Modified By
                                  </label>
                                  <div
                                    className="px-3 py-2 inputFieldStyle border rounded-lg text-gray-900 flex items-center"
                                    style={{ borderColor: "#e5e7eb" }}
                                  >
                                    <EditIcon
                                      style={{
                                        color: "#9ca3af",
                                        marginRight: "0.6rem",
                                        fontSize: "0.95rem",
                                      }}
                                    />
                                    {userDetails.modifiedBy}
                                  </div>
                                </div>

                                {/* Last Login */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Login
                                  </label>
                                  <div
                                    className="px-3 py-2 inputFieldStyle border rounded-lg text-gray-900 flex items-center"
                                    style={{ borderColor: "#e5e7eb" }}
                                  >
                                    <AccessTimeIcon
                                      style={{
                                        color: "#9ca3af",
                                        marginRight: "0.6rem",
                                        fontSize: "0.95rem",
                                      }}
                                    />
                                    {userDetails.lastLogin}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                {/* Created By */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Created By
                                  </label>
                                  <div
                                    className="px-3 py-2 inputFieldStyle border rounded-lg text-gray-900 flex items-center"
                                    style={{ borderColor: "#e5e7eb" }}
                                  >
                                    <PersonIcon
                                      style={{
                                        color: "#9ca3af",
                                        marginRight: "0.6rem",
                                        fontSize: "0.95rem",
                                      }}
                                    />
                                    {userDetails.createdBy}
                                  </div>
                                </div>

                                {/* Last Modified On */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Modified On
                                  </label>
                                  <div
                                    className="px-3 py-2 inputFieldStyle border rounded-lg text-gray-900 flex items-center"
                                    style={{ borderColor: "#e5e7eb" }}
                                  >
                                    <EventIcon
                                      style={{
                                        color: "#9ca3af",
                                        marginRight: "0.6rem",
                                        fontSize: "0.95rem",
                                      }}
                                    />
                                    {userDetails.modifiedOn}
                                  </div>
                                </div>

                                {/* Password Expiry */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password Expiry
                                  </label>
                                  <div
                                    className="px-3 py-2 inputFieldStyle border rounded-lg text-gray-900 flex items-center"
                                    style={{ borderColor: "#e5e7eb" }}
                                  >
                                    <VpnKeyIcon
                                      style={{
                                        color: "#9ca3af",
                                        marginRight: "0.6rem",
                                        fontSize: "0.95rem",
                                      }}
                                    />
                                    {userDetails.passwordExpiryDate}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Logs Section */}
                      <div
                        className=" space-y-3"
                        style={{ padding: "0rem 1rem 1rem 1rem" }}
                      >
                        <div className="cardBG rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            {/*  */}
                            <div
                              className=" mb-3"
                              style={{ display: "flex", alignItems: "center" }}
                            >
                              <DescriptionIcon
                                style={{
                                  color: "#ea580c",
                                  marginRight: "0.7rem",
                                  fontSize: "1.3rem",
                                }}
                              />

                              <Typography
                                className=""
                                style={{
                                  //color: "#4b5563",
                                  fontSize: "0.85rem",
                                  fontWeight: 600,
                                }}
                              >
                                Activity Logs
                              </Typography>
                            </div>

                            <Button
                              size="small"
                              startIcon={<DescriptionIcon />}
                              variant="contained"
                              onClick={() => {
                                setShowLogsdialog(true);
                              }}
                              sx={{ borderRadius: "1rem", boxShadow: "none" }}
                            >
                              {" "}
                              View Logs
                            </Button>
                          </div>
                          <p className="text-gray-600 text-sm mt-2">
                            View detailed activity logs and system events for
                            this user account.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabPanel>
                <TabPanel
                  header="Change Password"
                  headerClassName="tab-view"
                  className="tab-view"
                  contentClassName="tab-view"
                >
                  <ResetPassword
                    userDetails={userDetails}
                    currentPasswordCheck={true}
                  />
                </TabPanel>
              </TabView>
              <UserLog
                dialogVisible={showLogsDialog}
                onHide={onHideLogs}
                userId={userDetails?.userId}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
