import React, { useState,useEffect } from "react";
import GlobalFilterHeader from "../../../components/Table/GlobalFilterHeader";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { getOntourReportData,getCurrentMonthRange } from "./LeaveAdminFunctions";
import DatePicker from "../../../components/DatePicker/DatePicker";

const OnTourReport = ({ tableStructure }) => {
  const [onTourTable, setOnTourTable] = useState(tableStructure);
  const [selectedDates, setSelectedDates] = useState(getCurrentMonthRange());
  const dateSelectionHeader = (
    <div>
      <div>
        <DatePicker
          value={selectedDates}
          onChange={async (e) => {
            let dates = e.value;
            setSelectedDates(dates);
            if (dates[0] && dates[1]) {
              let data = await getOntourReportData(dates);
              setOnTourTable((prev) => ({
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
      table={onTourTable}
      setTable={setOnTourTable}
    />
  );

  useEffect(() => {
      console.log(selectedDates)
      const loadData = async () => {
        if (selectedDates[0] && selectedDates[1]) {
        let data = await getOntourReportData(selectedDates);
              setOnTourTable((prev) => ({
                ...prev,
                table: data,
              }));
            
        }
      };
      loadData();
    }, []);

  return (
    <DataTable
      value={onTourTable.table}
      filters={onTourTable.filterStructure}
      globalFilterFields={[
        "userName",
        "employeeId",
        "department",
        "fromDate",
        "toDate",
        "totalDays",
        "used",
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
      <Column field="userName" header="Name" className="w-[15rem]"></Column>
      <Column field="employeeId" header="Emp ID" className="w-[10rem]" />
      <Column field="department" header="Department" className="w-[14rem]" />
      <Column
        field="fromDate"
        header="From Date"
        className="w-[14rem]"
        sortable
      ></Column>
      <Column
        field="toDate"
        header="To Date"
        className="w-[14rem]"
        sortable
      ></Column>
      <Column
        field="totalDays"
        header="Total Days"
        className="w-[10rem]"
      ></Column>
      <Column
        field="used"
        header="Used"
        className="w-[10rem]"
        body={(row) => (
          <i
            className={`pi ${
              row.used
                ? "pi-check-circle text-green-500"
                : "pi-times-circle text-red-500"
            }`}
          />
        )}
      ></Column>
    </DataTable>
  );
};

export default OnTourReport;
