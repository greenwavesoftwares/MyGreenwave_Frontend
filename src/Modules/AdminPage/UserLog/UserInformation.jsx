import { Paper, Chip, Badge, Tooltip } from "@mui/material";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import "./UserLog.css";

const UserDetailsTable = ({
  newUserDetails, //updated information of the user
  oldUserDetails, //old information of user
  changes, //the keys where changes are made
}) => {
  //constant to record all possible keys to be displayed in the table
  const fields = [
    { label: "Email ID", key: "userId" },
    { label: "User Name", key: "userName" },
    { label: "Employee Id", key: "employeeId" },
    { label: "Phone Number", key: "phoneNumber" },
    { label: "Designation", key: "designation" },
    { label: "Device Serial No.", key: "deviceSerialNo" },
    { label: "Computer Name", key: "computerName" },
    { label: "Operating System", key: "operatingSystem" },
    { label: "System Manufacturer", key: "systemManufacturer" },
    { label: "System Model", key: "systemModel" },
    { label: "Memory", key: "memory" },
    { label: "Processor", key: "processor" },
    { label: "Manager", key: "manager" },
    { label: "User Group", key: "group" },
    { label: "Department", key: "department" },
    { label: "ESP Homepage", key: "espHomepage" },
    { label: "Workflow Homepage", key: "workflowHomepage" },
    {
      label: "Status",
      key: "active",
      isBoolean: true,
      trueText: "Active",
      falseText: "Inactive",
    },
    { label: "Created On", key: "createdOn" },
    { label: "Modified On", key: "modifiedOn" },
    { label: "Created By", key: "createdBy" },
    { label: "Modified By", key: "modifiedBy" },
    { label: "Last Login", key: "lastLogin" },
    {
      label: "Required Password Change on First Login",
      key: "firstLoginRequired",
      isBoolean: true,
    },
    { label: "Password Expiry Duration (days)", key: "passwordExpiryDuraton" },
    { label: "Password Expiry Date", key: "passwordExpiryDate" },
    { label: "Allotted Pages", key: "allotedPages", isChips: true },
  ];

  const isHighLighted = (key) => changes.includes(key); //checks whether the value of a particular key is updated or not
  /**
   *
   * @param {*} key
   * @param {*} oldVal
   * @param {*} newVal
   * @returns the changes that are made in a particular transaction for a particular key
   * The returned value is displayed on a tooltip on hover displayed in the tooltip
   */
  const valueChangeTooltip = (key, oldVal, newVal) => {
    if (Array.isArray(oldVal) && Array.isArray(newVal)) {
      //checks whether old and updated values are keys or not
      const removed = oldVal.filter((val) => !newVal.includes(val)); //checks which values are removed from the array
      const added = newVal.filter((val) => !oldVal.includes(val)); //check which values are added to the array
      return `${removed.length ? `${removed.join(", ")} removed` : ""}${
        removed.length && added.length ? ", " : ""
      }${added.length ? `${added.join(", ")} added` : ""} in Field ${key}`;
    } else
      return `Field ${
        fields.find((field) => field.key === key).label
      } updated from ${oldVal} to ${newVal}`;
  };
  /**
   * returns the inner table of the transaction table,
   * which will be displayed on value update
   */
  const tableData = fields.map(
    ({ label //label to be displayed as table header
     , key //key of the field
     , isChips //checks whether the values are displayed in a chips
     , isBoolean //checks whether the field is boolean or not
     , trueText //text to display when the boolean value is true
     , falseText //text to display when the boolean value is false
    }) => {
      /**
       * 
       * @param {*} val 
       * @returns the value in updated format
       */
      const formatValue = (val) => {
        if (isBoolean) return val ? trueText || "Yes" : falseText || "No";
        //checks whether the value is boolean or not, if so return trueText or falseText if available else return Yes or No
        if (isChips && Array.isArray(val)) {//checks whether the value is an array or not, and whether the values are to be displayed in chips or not
          return (
            <div className="table-cell-allottedpages-info">
              {val.map((page, i) => (
                <Chip key={i} label={page} size="small" />
              ))}
            </div>
          );
        }
        return val ?? "—";
      };

      return {
        field: (
          <Chip
            label={label}
            className="ellipsis-text"
            color={isHighLighted(key) ? "warning" : "default"}
            size="small"
          />//checks whether the field is highlighted or not, if so display it in warning color else display it in default color
        ),
        oldData: (
          <div className="info-modified-wrap">
            {formatValue(oldUserDetails[key])}
          </div>
          // display the old value in the table
        ),
        newData: (
          <div className="info-modified-wrap">
            {formatValue(newUserDetails[key])}
            {isHighLighted(key) && (
              <Tooltip
                title={valueChangeTooltip(
                  key,
                  oldUserDetails[key],
                  newUserDetails[key]
                )}
                style={{zIndex:'1000'}}
              >
                <Badge
                  color="error"
                  badgeContent=" "
                  variant="dot" style={{cursor:'pointer'}}
                  className="table-cell-info-badge"
                  anchorOrigin={{ vertical: "top", horizontal: "right" }}
                />
              </Tooltip>
            )}
          </div>
          // display the updated value in the table, show the tooltip on hovering a badge if the value has been changed
        ),
      };
    }
  );

  return (
    <Paper className="paper-div-info" elevation={2}>
      <DataTable
        value={tableData}
        className="p-datatable-sm"
        scrollable //the datatable is scrollable
        scrollHeight="400px" //the maximum height of the datatable
        showGridlines //show gridlines between cells
      >
        <Column header="Field" field="field" />
        <Column header="Old Data" field="oldData" />
        <Column header="New Data" field="newData" />
      </DataTable>
    </Paper>
  );
};

export default UserDetailsTable;
