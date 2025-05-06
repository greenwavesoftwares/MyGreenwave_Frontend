import { Chip } from "@mui/material";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React from "react";

const LastYearGoal = ({ appraiserPreviousSaveFormData }) => {
  console.log("LastYearData", appraiserPreviousSaveFormData);
  return (
    <>
      <DataTable
        size="small"
        stripedRows
        value={appraiserPreviousSaveFormData}
        header="Last Year Goal"
        showGridlines
        className="dataTableHeader dataTableBody dataTableBodyPadding mb-3"
      >
        <Column
          field="future_personal_KRA_goals"
          header="My Aspirations (2 Professional and 2 Personal Goals)"
        ></Column>
        <Column  header="Personal/Professional"
        body={(rowData)=>{
          return(
             <Chip style={{textTransform:'capitalize'}} size="small" label={rowData.goalType ?? ""}/> 
          )
        }}
        ></Column>
        <Column
          header="Training"
          body={(rowData) => {
            return (
              <div style={{ display: "flex", flexWrap: "wrap",justifyContent:'center' }}>
                {rowData.training?.map((item, index) => {
                  return (
                    <Chip
                      size="small"
                      color="primary"
                      key={index}
                      label={item}
                      style={{ marginRight: "0.2rem", marginBottom: "0.2rem" }}
                    />
                  );
                })}
              </div>
            );
          }}
        ></Column>
        <Column field="reviewers_comment" header="Reviewer's Comment"></Column>
        <Column
          field="appraisers_comments"
          header="Appraiser's Comments"
        ></Column>
      </DataTable>
    </>
  );
};
export default LastYearGoal;
