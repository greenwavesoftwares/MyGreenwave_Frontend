import React, { useEffect, useState } from "react";
import "./UserLog.css";
import DialogComponent from "../../../components/Dialog/DialogComponent";
import { getUserLogs } from "./UserLogFunction";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Grid } from "@mui/material";
import UserInformation from "./UserInformation";

const UserLog = ({ userId, onHide, dialogVisible = false }) => {
  const [logList, setLogList] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);
  const compareChanges = (newData, oldData) => {
    const changes = Object.keys(oldData).filter((key) => {
      const oldVal = oldData[key];
      const newVal = newData[key];

      // Convert both to strings safely for comparison
      const oldStr =
        oldVal !== undefined && oldVal !== null
          ? String(oldVal).trim().toLowerCase()
          : "";
      const newStr =
        newVal !== undefined && newVal !== null
          ? String(newVal).trim().toLowerCase()
          : "";

      return oldStr !== newStr;
    });

    return changes;
  };

  const rowExpansionTemplate = (data) => {
    const changes = compareChanges(data.newData, data.oldData);
    console.log("Changes logged:", changes);
    return (
      <Grid container spacing={2}>
        <Grid item xs={12} gap={4}>
          <UserInformation
            header={"Old Data"}
            changes={changes}
            oldUserDetails={data.oldData}
            newUserDetails={data.newData}
          />
        </Grid>
      </Grid>
    );
  };

  useEffect(() => {
    const init = async () => {
      dialogVisible ? setLogList(await getUserLogs(userId)) : setLogList([]);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogVisible]);

  return (
    <>
      <DialogComponent
        header={"User Logs"}
        visible={dialogVisible}
        className="userLogDialog"
        onHide={onHide}
      >
        <Grid container>
          <Grid size={12}>
            <DataTable
              value={logList}
              paginator
              rows={10}
              rowsPerPageOptions={[5, 10, 25, 50]}
              tableStyle={{ width: "100%", tableLayout: "fixed" }}
              expandedRows={expandedRows}
              rowExpansionTemplate={rowExpansionTemplate}
              onRowToggle={(e) => setExpandedRows(e.data)}
              scrollable scrollHeight="400px"
              dataKey="timestamp"
            >
              <Column
                expander={(row) => {
                  return row[0].data;
                }}
                className="max-w-[10px]"
              />
              <Column
                field="transactionId"
                header="Transaction Id"
                className="whitespace-nowrap overflow-hidden text-ellipsis user-logs-datatable-columns user-logs-datatable-columns-transactionid"
                headerClassName="logs-header"
              ></Column>
              <Column
                field="timestamp"
                header="Time"
                className="whitespace-nowrap overflow-hidden text-ellipsis user-logs-datatable-columns user-logs-datatable-columns-timestamp"
                headerClassName="logs-header"
              ></Column>
              <Column
                field="doneBy"
                header="Modified By"
                className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] user-logs-datatable-columns user-logs-datatable-columns-modifiedby"
                headerClassName="logs-header"
              ></Column>
              <Column
                field="data"
                header="Information Modified"
                className="whitespace-nowrap overflow-hidden info-modified-wrap user-logs-datatable-columns user-logs-datatable-columns-information"
                headerClassName="logs-header"
              ></Column>
            </DataTable>
          </Grid>
        </Grid>
      </DialogComponent>
    </>
  );
};

export default UserLog;
