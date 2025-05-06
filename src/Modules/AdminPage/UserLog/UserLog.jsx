import React, { useEffect, useState } from "react";
import "./UserLog.css";
import DialogComponent from "../../../components/Dialog/DialogComponent";
import { getUserLogs } from "./UserLogFunction";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Grid } from "@mui/material";

const UserLog = ({ userId, onHide, dialogVisible = false }) => {
  const [logList, setLogList] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);
  const rowExpansionTemplate = (data) => {
    return (
      <Grid container>
        <Grid size={2}>User ID</Grid>
        <Grid size={5}>{data.oldData.userId}</Grid>
        <Grid size={5}>{data.newData.userId}</Grid>
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
              dataKey="timestamp"
            >
              <Column
                expander={(row) => {
                  return row[0].data;
                }}
                style={{ width: "5rem" }}
              />
              <Column
                style={{ width: "20%" }}
                field="transactionId"
                header="Transaction Id"
              ></Column>
              <Column
                style={{ width: "15%" }}
                field="timestamp"
                header="Time"
              ></Column>
              <Column
                style={{ width: "25%" }}
                field="doneBy"
                header="Modified By"
                className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]"
              ></Column>
              <Column
                style={{ width: "40%" }}
                field="data"
                header="Information Modified"
              ></Column>
            </DataTable>
          </Grid>
        </Grid>
      </DialogComponent>
    </>
  );
};

export default UserLog;
