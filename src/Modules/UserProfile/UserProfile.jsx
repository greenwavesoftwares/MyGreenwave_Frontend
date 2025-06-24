import { Badge, Card, Chip, Grid, Paper } from "@mui/material";
import FileCopyOutlinedIcon from "@mui/icons-material/FileCopyOutlined";
import PersonIcon from "@mui/icons-material/Person";
import KeyIcon from "@mui/icons-material/Key";
import { useEffect, useState } from "react";
import { getUserData } from "../Login/Encrypt";
import { getUserDetailsAPI } from "../Login/LoginAPI";
import ResetPassword from "../ResetPassword/ResetPassword";
import UserLog from "../AdminPage/UserLog/UserLog";
import Typography from "../../components/Typography/Typography";
import "./UserProfile.css";
import "./UserProfile.scss";
import { TabPanel, TabView } from "primereact/tabview";

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

  return (
    <>
      {userDetails && (
        <div className="main-div">
          <TabView panelContainerClassName="tab-view" >
            <TabPanel header="Account Info" headerClassName="tab-view" contentClassName="tab-view" className="tab-view">
            <Paper className="paper-div">
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
                          <Chip key={pageIndex} label={allotedPage} className="chip-info"/>
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
            </Paper>
          
          </TabPanel>
          <TabPanel header="Change Password" headerClassName="tab-view" className="tab-view" contentClassName="tab-view">
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
      )}
    </>
  );
}
