import { useEffect, useRef, useState } from "react";
import "./UserLog.css";
import "./UserLog.scss";
import DialogComponent from "../../../components/Dialog/DialogComponent";
import { getUserLogs } from "./UserLogFunction";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Chip, Grid } from "@mui/material";
import UserInformation from "./UserInformation";
import Toast from "../../../components/Toast/Toast";
import Typography from "../../../components/Typography/Typography";

const UserLog = ({
  userId, //userId of the user
  onHide, //function to be called when the dialog is closed
  dialogVisible = false, //prop to handle whether the dialog is open or closed
}) => {
  const [logList, setLogList] = useState([]); //state to manage the list of logs
  const [expandedRows, setExpandedRows] = useState([]); //state to manage the expanded rows of the table
  const toastRef = useRef(null);
  /**
   *
   * @param {*} newData
   * @param {*} oldData
   * @returns the keys whose values are updated in a transaction
   */
  const compareChanges = (newData, oldData) => {
    const changes = Object.keys(oldData).filter((key) => {
      //find the keys that have been updated
      const oldVal = oldData[key]; //stores the old value for a particular key
      const newVal = newData[key]; //stores the new values for a particular key
      if (Array.isArray(oldVal) && Array.isArray(newVal)) {
        //checks whether oldVal and newVal are arrays
        const hasRemovedItems = !oldVal.every((val) => newVal.includes(val)); //checks whether any item is removed
        const hasAddedItems = !newVal.every((val) => oldVal.includes(val)); //checks whether any item is added
        return hasRemovedItems || hasAddedItems; //returns true if any item is removed or added
      } else return oldVal !== newVal; //returns true if oldVal and newVal are not equal
    });

    return changes; //returns the keys whose values are updated in a transaction
  };
  /**
   *
   * @param {*} data
   * @returns returns the component to be displayed on table expansion
   */
  const rowExpansionTemplate = (data) => {
    const changes = compareChanges(data.newData, data.oldData); //compares the old and new data to find the updated keys
    if (!(data.oldData || data.newData)) {
      toastRef.current.show({
        severity: "error",
        summary: "Error",
        detail: "No Logs Found",
      });
      return;
    }
    return (
      <Grid container spacing={2}>
        <Grid item xs={12} gap={4}>
          <UserInformation
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
      dialogVisible ? setLogList(await getUserLogs(userId)) : setLogList([]); //fetch the user logs only when the state dialogVisible is true
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
        className="user-log-dialog"
        contentClassName="user-log-dialog-content"
        headerClassName="user-log-dialog-header"
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
              scrollable
              scrollHeight="400px"
              dataKey="timestamp"
              // tableClassName=""
              paginatorClassName="table-paginator-info"
              
              
            >
              <Column
                expander={(row) => {
                  return row[0].data;
                }}
                style={{width:'1px'}}
                headerClassName="table-header-info"
                className="user-logs-datatable-columns"
              
                // className="max-w-[10px]"
              />
              
              <Column
                field="transactionId"
                header={() => (
                  <Typography variant="subtitle2">Transaction Id</Typography>
                )}
                body={(rowData) => (
                  <Typography variant="body2">
                    {rowData.transactionId}
                  </Typography>
                )}
                headerClassName="table-header-info"
                className="whitespace-nowrap overflow-hidden text-ellipsis user-logs-datatable-columns user-logs-datatable-columns-transactionid"
              />
              <Column
                field="timestamp"
                header={() => <Typography variant="subtitle2">Time</Typography>}
                body={(rowData) => (
                  <Typography variant="body2">{rowData.timestamp}</Typography>
                )}
                headerClassName="table-header-info"
                className="whitespace-nowrap overflow-hidden text-ellipsis user-logs-datatable-columns user-logs-datatable-columns-timestamp"
              />
              <Column
                field="doneBy"
                header={() => (
                  <Typography variant="subtitle2">Modified By</Typography>
                )}
                body={(rowData) => (
                  <Typography variant="body2">{rowData.doneBy}</Typography>
                )}
                headerClassName="table-header-info"
                className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] user-logs-datatable-columns user-logs-datatable-columns-modifiedby"
              />
              <Column
                field="data"
                header={() => (
                  <Typography variant="subtitle2">
                    Information Modified
                  </Typography>
                )}
                body={(rowData) => (
                  <Typography variant="body2">{rowData.data}</Typography>
                )}
                headerClassName="table-header-info"
                className="whitespace-nowrap overflow-hidden info-modified-wrap user-logs-datatable-columns user-logs-datatable-columns-information"
              />
            </DataTable>
          </Grid>
        </Grid>
      </DialogComponent>
      <Toast ref={toastRef} />
    </>
  );
};

export default UserLog;
