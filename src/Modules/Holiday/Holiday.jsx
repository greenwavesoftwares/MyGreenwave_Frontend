import { Container, Grid } from "@mui/material";
import { FilterMatchMode } from "primereact/api";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { useEffect, useState } from "react";
import { getHolidays } from "../HolidayMaster/HolidayFunction";
import GlobalFilterHeader from "../../components/Table/GlobalFilterHeader";
import { getUserData } from "../Login/Encrypt";

const Holiday = () => {
  const tableStructure = () => ({
    table: [],
    filterText: "",
    filterStructure: {
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    },
  });
  const [holidayTable, setHolidayTable] = useState(tableStructure);
  const [userInfo] = useState(getUserData()?.userDetails);

  const holidayHeader = (
    <GlobalFilterHeader
      start={<span>Holidays</span>}
      table={holidayTable}
      setTable={setHolidayTable}
    />
  );

  useEffect(() => {
    const init = async () => {
      const data = await getHolidays();
      const currentYearHoliday = data.holiday
        .filter((holiday) => holiday.year === new Date().getFullYear())
        .filter(
          (holiday) =>
            holiday.type !== "Restricted" ||
            holiday.restrictedUsers.includes(userInfo?.employeeId)
        );
      setHolidayTable((prev) => ({ ...prev, table: currentYearHoliday }));
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <Container size="lg" className="mt-5">
        <Grid container>
          <Grid size={12}>
            <DataTable
              value={holidayTable.table}
              filters={holidayTable.filterStructure}
              globalFilterFields={["holidays", "fromDate", "fromDate", "type"]}
              header={holidayHeader}
              paginator
              rows={10}
              rowsPerPageOptions={[10, 25, 50]}
            >
              <Column field="year" header="Year"></Column>
              <Column field="holidays" header="Holiday Name"></Column>
              <Column field="fromDate" header="From Date"></Column>
              <Column field="toDate" header="To Date"></Column>
              <Column field="type" header="Type"></Column>
              <Column field="totalNoOfDays" header="No Of Days"></Column>
            </DataTable>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default Holiday;
