import React, { useState } from "react";
import GlobalFilterHeader from "../../../components/Table/GlobalFilterHeader";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { getLeaveReportData } from "./LeaveAdminFunctions";
import DatePicker from "../../../components/DatePicker/DatePicker";

const LeaveReport = ({ tableStructure, statusBodyTemplate }) => {
  const [leaveReportTable, setLeaveReportTable] = useState(tableStructure);
  const [selectedDates, setSelectedDates] = useState([]);
  const dateSelectionHeader = (
    <div>
      <div>
        <DatePicker
          value={selectedDates}
          onChange={async (e) => {
            let dates = e.value;
            setSelectedDates(dates);
            if (dates[0] && dates[1]) {
              let data = await getLeaveReportData(dates);
              setLeaveReportTable((prev) => ({
                ...prev,
                table: data,
              }));
            }
          }}
          selectionMode="range"
          readOnlyInput
          hideOnRangeSelection
          showIcon
          dateFormat="dd/mm/yy"
          placeholder="Select Date Range"
        />
      </div>
    </div>
  );
  const leaveHeader = (
    <GlobalFilterHeader
      start={dateSelectionHeader}
      table={leaveReportTable}
      setTable={setLeaveReportTable}
    />
  );

  return (
    <DataTable
      value={leaveReportTable.table}
      filters={leaveReportTable.filterStructure}
      globalFilterFields={[
        "userName",
        "employeeId",
        "department",
        "fromDate",
        "toDate",
        "actualLeave",
        "type",
        "reason",
        "status",
      ]}
      header={leaveHeader}
      paginator
      rows={10}
      rowsPerPageOptions={[10, 25, 50]}
      sortField="fromDate"
      sortOrder={-1}
      size="small"
       className="dataTableHeader dataTableBody dataTableBodyPadding dataTablePaginator defaultBorder"
    >
      <Column field="userName" header="Name" className="w-[25rem]" />
      <Column field="employeeId" header="Emp ID" className="w-[10rem]" />
      <Column field="department" header="Department" className="w-[14rem]" />
      <Column
        field="fromDate"
        header="From Date"
        className="w-[14rem]"
        sortable
      />
      <Column field="toDate" header="To Date" className="w-[14rem]" sortable />
      <Column field="actualLeave" header="Leave" className="w-[10rem]" />
      <Column field="type" header="Type" className="w-[10rem]" />
      <Column field="reason" header="Reason" className="w-[15rem]" />
      <Column
        field="status"
        header="Status"
        body={statusBodyTemplate}
        className="w-[10rem]"
      />
    </DataTable>
  );
};

export default LeaveReport;
