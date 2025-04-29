import { Button, Typography } from "@mui/material";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React from "react";
//SCSS Import
import "../Appraisal/Appraisal.scss";


const AppraisalTracker = () => {
  return (
    <>
      <div className="container mx-auto px-4">
        <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
          <div className="card mt-4  bg-white shadow rounded">
            <DataTable
              size="small"
              stripedRows
              header={
                <Typography className="text-sm">All Appraisals</Typography>
              }
              // value={appraisalList}
              showGridlines
              className="dataTableHeader dataTableBody dataTableBodyPadding"
            >
              <Column header="Employee Name"></Column>
              <Column header="Appraisal Date"></Column>
              <Column header="Reviewed"></Column>
              <Column header="Approved"></Column>

              <Column
                body={(rowData) => {
                  return (
                    <Button size="small" variant="contained">
                      Show Form
                    </Button>
                  );
                }}
                header="Form"
              ></Column>
              <Column
                body={(rowData) => {
                  return (
                    <Button size="small" variant="contained">
                      Show Form
                    </Button>
                  );
                }}
                header="Excel Download"
              ></Column>
            </DataTable>
          </div>
        </div>
      </div>
    </>
  );
};
export default AppraisalTracker;
