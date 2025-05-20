import { Badge, Card, Chip, Grid, Paper, Typography } from "@mui/material";
import FileCopyOutlinedIcon from "@mui/icons-material/FileCopyOutlined";
import PersonIcon from "@mui/icons-material/Person";
import KeyIcon from "@mui/icons-material/Key";
import "./UserProfile.css";
import { useEffect, useState } from "react";
import { getUserData } from "../Login/Encrypt";
import { getUserDetails } from "../Login/LoginAPI";

export default function UserProfile() {
  const [userDetails, setUserDetails] = useState(null);
  const token = getUserData().token;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const details = await getUserDetails(token);
    setUserDetails(details);
  };
  return (
    <>
      {userDetails && (
        <div className="main-div">
          <div className="card-div">
            <Card variant="elevation" className="card-style">
              <div className="card-icon">
                <PersonIcon sx={{ height: "100%" }} />
              </div>
              <div className="inner-card-style">
                <Typography variant="h6" fontWeight="bold">
                  Account Info
                </Typography>
                <Typography color="textSecondary">
                  View your account information
                </Typography>
              </div>
            </Card>
            <Card variant="elevation" className="card-style">
              <div className="card-icon">
                <KeyIcon sx={{ height: "100%" }} />
              </div>
              <div className="inner-card-style">
                <Typography variant="h6" fontWeight="bold">
                  Change Password
                </Typography>
                <Typography color="textSecondary">
                  Change your password and security key
                </Typography>
              </div>
            </Card>
          </div>

          <Paper className="paper-div">
            <Typography className="table-header">User Profile</Typography>

            <div className="table">
              <div className="table-row">
                <div className="table-cell table-cell-header">User Name</div>
                <div className="table-cell">{userDetails.userName}</div>
              </div>

              <div className="table-row">
                <div className="table-cell table-cell-header">User Id</div>
                <div className="table-cell">{userDetails.userId}</div>
              </div>

              <div className="table-row">
                <div className="table-cell table-cell-header">
                  Allotted Pages
                </div>
                <div className="table-cell">
                  <div className="table-cell-allottedpages">
                    {userDetails.allotedPages.map((allotedPage, pageIndex) => (
                      <Chip key={pageIndex} label={allotedPage} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="table-row">
                <div className="table-cell table-cell-header">Phone Number</div>
                <div className="table-cell">{userDetails.phoneNumber}</div>
              </div>

              <div className="table-row">
                <div className="table-cell table-cell-header">Created On</div>
                <div className="table-cell">{userDetails.createdOn}</div>
              </div>

              <div className="table-row">
                <div className="table-cell table-cell-header">
                  Last Modified On
                </div>
                <div className="table-cell">{userDetails.modifiedOn}</div>
              </div>

              <div className="table-row">
                <div className="table-cell table-cell-header">Created By</div>
                <div className="table-cell">{userDetails.createdBy}</div>
              </div>

              <div className="table-row">
                <div className="table-cell table-cell-header">
                  Last Modified By
                </div>
                <div className="table-cell">{userDetails.modifiedBy}</div>
              </div>

              <div className="table-row">
                <div className="table-cell table-cell-header">Last Login</div>
                <div className="table-cell">{userDetails.lastLogin}</div>
              </div>

              <div className="table-row">
                <div className="table-cell table-cell-header">
                  Password Expiry Date
                </div>
                <div className="table-cell">
                  {userDetails.passwordExpiryDate}
                </div>
              </div>

              <div className="table-row">
                <div className="table-cell table-cell-header">Logs</div>
                <div className="table-cell">
                  <Badge color="info" variant="standard">
                    <FileCopyOutlinedIcon color="info" />
                  </Badge>
                </div>
              </div>
            </div>
          </Paper>
        </div>
      )}
    </>
  );
}
