import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import dummyDataAPICall from "./dummyData";
import { useEffect, useState } from "react";
import { LinearProgress } from "@mui/material";

function TodayMeal() {
  const [data, setData] = useState([]);
  const [loader, setLoader] = useState(false);
  async function fetchMealBooking() {
    try {
      //Set Loader
      setLoader(true);
      const response = await dummyDataAPICall();
      setData(response);
      console.log("res", response);
    } catch (error) {
      console.log("Failed to fetch meal data", error);
    } finally {
      setLoader(false);
    }
  }

  useEffect(() => {
    fetchMealBooking();
  }, []);

  return (
    <>
      <DataTable
        size="small"
        emptyMessage={
          loader ? <LinearProgress color="inherit" /> : "No Data Found"
        }
        value={data}
        showGridlines
        stripedRows
        className="dataTableHeader dataTableBody dataTableBodyPadding"
      >
        <Column
          header="Name"
          body={(ele) => {
            return <p>{ele.name}</p>;
          }}
        ></Column>
        <Column
          header="Emp ID"
          body={(ele) => {
            return <p>{ele.id}</p>;
          }}
        ></Column>
        <Column
          header="Lunch Type"
          body={(ele) => {
            return <p>NA</p>;
          }}
        ></Column>
        <Column
          header="Scan Time"
          body={(ele) => {
            return <p>{ele.scanTime}</p>;
          }}
        ></Column>
        <Column
          header="Scan Status"
          body={(ele) => {
            return <p>NA</p>;
          }}
        ></Column>
      </DataTable>
    </>
  );
}

export default TodayMeal;
