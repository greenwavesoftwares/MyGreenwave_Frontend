import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

function TodayMeal() {
  return (
    <>
      <h1>TodayMeal</h1>
      <DataTable
        size="small"
        //    emptyMessage={
        //      loader ? <LinearProgress color="inherit" /> : "No Data Found"
        //    }
        //    value={mealList}
        showGridlines
        stripedRows
        className="dataTableHeader dataTableBody dataTableBodyPadding"
      >
        <Column
          header="Date"
          //  body={(ele) => {
          //    return <p>{ele.date}</p>;
          //  }}
        ></Column>
      </DataTable>
    </>
  );
}

export default TodayMeal;
