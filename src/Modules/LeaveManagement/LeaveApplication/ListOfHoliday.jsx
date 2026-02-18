import { Dialog } from "primereact/dialog";
import { useEffect, useState } from "react";
import { getHolidaysAPI } from "../../HolidayMaster/HolidayAPI";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
//SCSS Import
import "../../Appraisal/Appraisal.scss";
import "../../Home/HomePage.scss";
import { useMediaQuery, useTheme } from "@mui/material";
import { getUserData } from "../../Login/Encrypt";


const ListOfHoliday = ({ visible, setHolidayList }) => {
  const [holiday, setHoliday] = useState("");
  //mobile view
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  async function holidayList() {
    try {
      const response = await getHolidaysAPI();
      //Get Current Year
      const currentYear=new Date().getFullYear()
      //Get Login User ID
      const userInfo=getUserData()
      const userId=userInfo?.userDetails.employeeId
      //Filter current year data and restricted holiday for login user
      const filterCurrentYear = response?.holiday.filter(
        (ele) => ele.year === currentYear && (!ele.restrictedUsers || ele.restrictedUsers.includes(userId))
      );
       setHoliday(filterCurrentYear);
    } catch (error) {
      console.log("Failed to fetch holiday api", error);
    }
  }

  useEffect(() => {
    holidayList();
  }, []);

  return (
    <>
      <Dialog
        header="Holiday List"
        visible={visible}
        style={{ width: isMobile ? "90%" : "50vw" }}
        onHide={() => {
          if (visible) setHolidayList(false);
        }}
        className="dialogHeader dialogContent"
      >
        <>
          <DataTable
            size="small"
            stripedRows
            value={holiday}
            className="dataTableHeader dataTableBody dataTableBodyPadding dataTablePaginator"
          >
            <Column field="year" header="Year"></Column>
            <Column field="holidays" header="Holiday Name"></Column>
            <Column field="fromDate" header="From Date"></Column>
            <Column field="toDate" header="To Date"></Column>
            <Column
              header="Type"
              body={(rowData) => {
                return (
                  <Tag
                    value={rowData.type}
                    rounded
                    severity={rowData.type === "Public" ? "success" : "warning"}
                  />
                );
              }}
            ></Column>
            <Column field="totalNoOfDays" header="No Of Days"></Column>
          </DataTable>
        </>
      </Dialog>
    </>
  );
};
export default ListOfHoliday;
