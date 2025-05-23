import React from "react";
import { Paper, Chip, Badge, Tooltip } from "@mui/material";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import "./UserLog.css"; 

const UserDetailsTable = ({ 
    newUserDetails //updated information of the user 
  , oldUserDetails, //old information of user
    changes //the keys where changes are made
  }) => {

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
    },
    { label: "Password Expiry Duration (days)", key: "passwordExpiryDuraton" },
    { label: "Password Expiry Date", key: "passwordExpiryDate" },
    { label: "Allotted Pages", key: "allotedPages", isChips: true },
  ];
  
  const isHighLighted = (key) => changes.includes(key);//checks whether the value of a particular key is updated or not
  const valueChangeTooltip = (key, oldVal, newVal) => {
    if (Array.isArray(oldVal) && Array.isArray(newVal)) {
      const removed = oldVal.filter((val) => !newVal.includes(val));
      const added = newVal.filter((val) => !oldVal.includes(val));
      return `${removed.length ? `${removed.join(", ")} removed` : ""}${
        removed.length && added.length ? ", " : ""
      }${added.length ? `${added.join(", ")} added` : ""} in Field ${key}`;
    } else return `Field ${key} updated from ${oldVal} to ${newVal}`;
  };

  const tableData = fields.map(
    ({ label, key, isChips, isBoolean, trueText, falseText }) => {
      const formatValue = (val) => {
        if (isBoolean) return val ? trueText || "Yes" : falseText || "No";
        if (isChips && Array.isArray(val)) {
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
          />
        ),
        oldData: (
          <div className="info-modified-wrap">
            {formatValue(oldUserDetails[key])}
          </div>
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
              >
                <Badge
                  color="error"
                  badgeContent=" "
                  variant="dot"
                  className="table-cell-info-badge"
                  anchorOrigin={{ vertical: "top", horizontal: "right" }}
                />
              </Tooltip>
            )}
          </div>
        ),
      };
    }
  );

  return (
    <Paper className="paper-div-info" elevation={2}>
      <DataTable
        value={tableData}
        className="p-datatable-sm"
        scrollable
        scrollHeight="400px"
        showGridlines
      >
        <Column header="Field" field="field" />
        <Column header="Old Data" field="oldData" />
        <Column header="New Data" field="newData" />
      </DataTable>
    </Paper>
  );
};

export default UserDetailsTable;
