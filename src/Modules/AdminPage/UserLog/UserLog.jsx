import { useEffect, useState } from "react";
import "./UserLog.css";
import DialogComponent from "../../../components/Dialog/DialogComponent";
import { getUserLogs } from "./UserLogFunction";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Grid } from "@mui/material";
import UserInformation from "./UserInformation";

const UserLog = ({ userId, onHide, dialogVisible = false }) => {
  const [logList, setLogList] = useState([]);//state to manage the list of logs
  const [expandedRows, setExpandedRows] = useState([]);//state to manage the expanded rows of the table

  /**
   * 
   * @param {*} newData 
   * @param {*} oldData 
   * @returns the keys whose values are updated in a transaction
   */
  const compareChanges = (newData, oldData) => {
    const changes = Object.keys(oldData).filter((key) => {//find the keys that have been updated
      const oldVal = oldData[key];//stores the old value for a particular key
      const newVal = newData[key];//stores the new values for a particular key
      if(Array.isArray(oldVal) && Array.isArray(newVal)){//checks whether oldVal and newVal are arrays
        const hasRemovedItems=!oldVal.every(val=>newVal.includes(val))//checks whether any item is removed
        const hasAddedItems=!newVal.every(val=>oldVal.includes(val))//checks whether any item is added
        return hasRemovedItems||hasAddedItems //returns true if any item is removed or added

      }
      else
        return oldVal!==newVal  //returns true if oldVal and newVal are not equal
    });

    return changes;//returns the keys whose values are updated in a transaction
  };
  /**
   * 
   * @param {*} data 
   * @returns returns the component to be displayed on table expansion
   */
  const rowExpansionTemplate = (data) => {
    const changes = compareChanges(data.newData, data.oldData);//compares the old and new data to find the updated keys
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
  /**
   * useEffect to fetch user logs on component load
   */
  useEffect(() => {
    const init = async () => {
      dialogVisible ? setLogList(await getUserLogs(userId)) : setLogList([]);//fetch the user logs only when the state dialogVisible is true
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogVisible]);

  return (
    <>
    {/* Custom dialog to view transaction */}
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
