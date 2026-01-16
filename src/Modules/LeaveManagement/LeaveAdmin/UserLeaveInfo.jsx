import React, { useEffect, useState } from "react";
import { getUserLeaveInfo, getYearList } from "./LeaveAdminFunctions";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import GlobalFilterHeader from "../../../components/Table/GlobalFilterHeader";

const UserLeaveInfo = ({
  userLeaveInfoTable,
  setUserLeaveInfoTable,
  statusBodyTemplate,
}) => {
  const [expandedRows, setExpandedRows] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(0);
  const userLeaveInfoTableHeader = (
    <GlobalFilterHeader
      start={
        <div>
          <Dropdown
            value={selectedYear}
            onChange={async (e) => {
              setSelectedYear(e.value);
            }}
            options={years}
            placeholder="Select a Year"
            className="w-full dropDownStyle"
          />
        </div>
      }
      table={userLeaveInfoTable}
      setTable={setUserLeaveInfoTable}
    />
  );
  const rowExpansionTemplate = (data) => {
    return (
      <DataTable
        value={data.leaveList}
        removableSort
        sortField="fromDate"
        sortOrder={-1}
        size="small"
         className="dataTableHeader dataTableBody dataTableBodyPadding dataTablePaginator defaultBorder"
      >
        <Column
          field="fromDate"
          header="From Date"
          style={{ width: "14vw" }}
          sortable
        ></Column>
        <Column
          field="toDate"
          header="To Date"
          style={{ width: "14vw" }}
          sortable
        ></Column>
        <Column
          field="actualLeave"
          header="Leave"
          style={{ width: "10vw" }}
        ></Column>
        <Column field="type" header="Type" style={{ width: "10vw" }}></Column>
        <Column
          field="reason"
          header="Reason"
          style={{ width: "15vw" }}
        ></Column>
        <Column
          header="Status"
          body={statusBodyTemplate}
          style={{ width: "10vw" }}
        ></Column>
      </DataTable>
    );
  };

  useEffect(() => {
    let yearList = getYearList();
    setYears(yearList);
    setSelectedYear(yearList[yearList.length - 1]);
  }, []);
  useEffect(() => {
    const init = async () => {
      let data = await getUserLeaveInfo(selectedYear);
      setUserLeaveInfoTable((prev) => ({
        ...prev,
        table: data,
      }));
    };
    if (selectedYear !== 0) init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  return (
    <DataTable
      removableSort
      value={userLeaveInfoTable.table}
      filters={userLeaveInfoTable.filterStructure}
      globalFilterFields={[
        "userName",
        "employeeId",
        "department",
        "cl",
        "pl",
        "medical",
        "compensatory",
      ]}
      header={userLeaveInfoTableHeader}
      paginator
      rows={10}
      rowsPerPageOptions={
        userLeaveInfoTable.table.length > 50
          ? [5, 10, 25, 50, userLeaveInfoTable.table.length]
          : userLeaveInfoTable.table.length > 25
          ? [5, 10, 25, userLeaveInfoTable.table.length]
          : userLeaveInfoTable.table.length > 10
          ? [5, 10, userLeaveInfoTable.table.length]
          : userLeaveInfoTable.table.length > 5
          ? [5, userLeaveInfoTable.table.length]
          : [5]
      }
      paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
      currentPageReportTemplate="{first} to {last} of {totalRecords}"
      sortField="fromDate"
      sortOrder={-1}
      size="small"
      expandedRows={expandedRows}
      rowExpansionTemplate={rowExpansionTemplate}
      onRowToggle={(e) => {
        setExpandedRows(e.data);
      }}
       className="dataTableHeader dataTableBody dataTableBodyPadding dataTablePaginator defaultBorder"
    >
      <Column
        expander={(row) => {
          return row[0]?.leaveList;
        }}
        style={{ width: "5rem" }}
      />
      <Column field="userName" header="Name" className="w-[20vw]"></Column>
      <Column
        field="employeeId"
        header="Emp ID"
        className="w-[10vw]"
        sortable
      ></Column>
      <Column
        field="department"
        header="Department"
        className="w-[15vw]"
        sortable
      ></Column>
      <Column field="cl" header="CL" className="w-[10vw]"></Column>
      <Column field="pl" header="PL" className="w-[10vw]"></Column>
      <Column field="medical" header="Medical" className="w-[10vw]"></Column>
      <Column
        field="compensatory"
        header="Compensatory"
        className="w-[10vw]"
      ></Column>
    </DataTable>
  );
};

export default UserLeaveInfo;
