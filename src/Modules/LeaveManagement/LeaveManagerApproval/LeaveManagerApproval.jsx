import { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import { Card } from "primereact/card";
import { Container } from "@mui/material";
import { TabView, TabPanel } from "primereact/tabview";
import { getUserData } from "../../Login/Encrypt";
import "./LeaveManagerApproval.css";
import { FilterMatchMode } from "primereact/api";
import LeaveRequestTable from "./LeaveRequestTable";
import TeamLeaveCalender from "./TeamLeaveCalender";
import {
  getLeaveRequestsForManagerApproval,
  getTeamLeavesCalenderForManager,
} from "./LeaveManagerApprovalFunctions";
import Poll from "../../../components/Poll/Poll";

const LeaveManagerApproval = () => {
  const tableStructure = () => ({
    table: [],
    filterText: "",
    filterStructure: {
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    },
  });
  const [leaveRequestTable, setLeaveRequestTable] = useState(tableStructure);
  const [teamLeaveCalender, setTeamLeaveCalender] = useState([]);
  const [pollStop] = useState(false);

  // const [teamLeaveTable, setTeamLeaveTable] = useState(tableStructure);
  const [userInfo] = useState(getUserData()?.userDetails);
  useEffect(() => {
    const init = async () => {
      await getLeaveData();
      await getCalenderData();
    };
    init();
  }, []);
  const getLeaveData = async () => {
    let data = await getLeaveRequestsForManagerApproval();
    setLeaveRequestTable((prev) => ({ ...prev, table: data }));
  };
  const getCalenderData = async () => {
    let data = await getTeamLeavesCalenderForManager();
    setTeamLeaveCalender(data);
  };
  return (
    <>
      <Poll func={getLeaveData} stop={pollStop} interval={5} />
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
                <TabPanel header="Team Leaves">
                  <TeamLeaveCalender teamLeaveCalender={teamLeaveCalender} />
                </TabPanel>
              </TabView>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default LeaveManagerApproval;
