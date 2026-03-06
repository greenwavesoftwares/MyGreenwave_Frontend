import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { LinearProgress } from "@mui/material";
import { Tag } from "primereact/tag";

function TodayMeal({ loader, todayMealBooked }) {
  console.log("todayMealBooked", todayMealBooked);
  return (
    <>
      <DataTable
        size="small"
        emptyMessage={
          loader ? <LinearProgress color="inherit" /> : "No Data Found"
        }
        value={todayMealBooked}
        paginator={todayMealBooked?.length >= 10}
        rows={10}
        rowsPerPageOptions={[10, 15, 20, 50]}
        showGridlines
        stripedRows
        className="dataTableHeader dataTableBody dataTableBodyPadding dataTablePaginator dropDownStyle"
      >
        <Column
          header="Name"
          body={(ele) => {
            return <p>{ele.userName || "NA"}</p>;
          }}
        ></Column>
        <Column
          header="Emp ID"
          body={(ele) => {
            return <p>{ele.employeeId || "NA"}</p>;
          }}
        ></Column>
        <Column
          header="Meal Type"
          body={(ele) => {
            return <Tag value={ele.lunchType || "NA"} rounded />;
          }}
        ></Column>
        <Column
          header="Extra Meal"
          body={(ele) => {
            //return <Tag value={ele.extraMeal || "0"} rounded />;
             return <p>{ele.extraMeal || "0"}</p>;
          }}
        ></Column>
        <Column
          header="Scan Time"
          body={(ele) => {
            return <p>{ele.scanTime || "--"}</p>;
          }}
        ></Column>
        <Column
          header="Scan Status"
          body={(ele) => {
            return (
              <Tag
                value={ele?.scanned ? "Completed" : "Pending"}
                severity={ele?.scanned ? "success" : "warning"}
                icon={ele?.scanned ? "pi pi-check" : "pi pi-clock"}
              />
            );
          }}
        ></Column>
      </DataTable>
    </>
  );
}

export default TodayMeal;
