import { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import { Card } from "primereact/card";
import { Container } from "@mui/material";
import { TabView, TabPanel } from "primereact/tabview";
import {
  getLeaveOnBehalfData,
  getLeaveRequestsForAdminApproval,
  getUserLeaveInfo,
} from "./LeaveAdminFunctions";
import { getUserData } from "../../Login/Encrypt";
import "./LeaveAdmin.css";
import { Tooltip } from "primereact/tooltip";
import { Tag } from "primereact/tag";
import { FilterMatchMode } from "primereact/api";
import UserLeaveInfo from "./UserLeaveInfo";
import LeaveRequestTable from "./LeaveRequestTable";
import OnTourReport from "./OnTourReport";
import LeaveReport from "./LeaveReport";
import LeaveOnBehalf from "./LeaveOnBehalf";
import { getUserIdAndName } from "../../AdminPage/AdminFunction";

const LeaveAdmin = () => {
  const tableStructure = () => ({
    table: [],
    filterText: "",
    filterStructure: {
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    },
  });

  const [leaveRequestTable, setLeaveRequestTable] = useState(tableStructure);
  const [userLeaveInfoTable, setUserLeaveInfoTable] = useState(tableStructure);
  const [leaveOnBehalfTable, setLeaveOnBehalfTable] = useState(tableStructure);
  const [userInfo] = useState(getUserData()?.userDetails);
  const [userList, setUserList] = useState([]);
  const statusBodyTemplate = (row) => {
    return (
      <>
        <Tooltip
          target={"#leave_" + row.leaveId}
          mouseTrack
          className={row.status === "Rejected" ? "block" : "hidden"}
        >
          <b>Rejected By :</b> {row.rejectedBy}
          <br />
          <b>Rejected Reason :</b> {row.rejectedReason}
        </Tooltip>
        <Tag
          id={"leave_" + row.leaveId}
          value={row.status}
          severity={row.severity}
          data-pr-position="mouse"
        />
      </>
    );
  };

  useEffect(() => {
    const init = async () => {
      await getLeaveRequestData();
      await getUserLeaveInfoOnLoad(new Date().getFullYear());
      await getLeaveOnBehalfTableData();
      setUserList(await getUserIdAndName());
    };
    init();
  }, []);

  const getLeaveRequestData = async () => {
    let data = await getLeaveRequestsForAdminApproval();
    setLeaveRequestTable((prev) => ({ ...prev, table: data }));
  };
  const getUserLeaveInfoOnLoad = async (year) => {
    let data = await getUserLeaveInfo(year);
    setUserLeaveInfoTable((prev) => ({
      ...prev,
      table: data,
    }));
  };
  const getLeaveOnBehalfTableData = async () => {
    let data = await getLeaveOnBehalfData();
    setLeaveOnBehalfTable((prev) => ({
      ...prev,
      table: data,
    }));
  };
  return (
    <>
      <Container maxWidth="lg">
        <Grid
          container
          spacing={1}
          marginTop={2}
          sx={{
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Grid size={12}>
            <Card>
              <TabView>
                <TabPanel header="Leave Requests">
                  <LeaveRequestTable
                    leaveRequestTable={leaveRequestTable}
                    setLeaveRequestTable={setLeaveRequestTable}
                    userInfo={userInfo}
                  />
                </TabPanel>
                <TabPanel header="User Leave Info">
                  <UserLeaveInfo
                    userLeaveInfoTable={userLeaveInfoTable}
                    setUserLeaveInfoTable={setUserLeaveInfoTable}
                    statusBodyTemplate={statusBodyTemplate}
                  />
                </TabPanel>
                <TabPanel header="Leave On Behalf">
                  <LeaveOnBehalf
                    leaveOnBehalfTable={leaveOnBehalfTable}
                    setLeaveOnBehalfTable={setLeaveOnBehalfTable}
                    userList={userList}
                  />
                </TabPanel>
                <TabPanel header="On Tour Report">
                  <OnTourReport tableStructure={tableStructure} />
                </TabPanel>
                <TabPanel header="Leave Report">
                  <LeaveReport
                    tableStructure={tableStructure}
                    statusBodyTemplate={statusBodyTemplate}
                  />
                </TabPanel>
              </TabView>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default LeaveAdmin;
