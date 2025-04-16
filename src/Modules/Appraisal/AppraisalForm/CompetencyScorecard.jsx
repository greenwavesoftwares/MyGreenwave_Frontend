import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { useEffect, useState } from "react";

const CompetencyScorecard = ({ appraiserPreviousSaveFormDat }) => {
  const [selectedRowData, setSelectedRowData] = useState([]);

  useEffect(() => {
    if (appraiserPreviousSaveFormDat?.length > 0) {
      setSelectedRowData(appraiserPreviousSaveFormDat);
    }
  }, [appraiserPreviousSaveFormDat]);
  console.log("Previous_CompetencyScoreCardData",selectedRowData);

  return (
    <>
      <DataTable
        size="small"
        stripedRows
        showGridlines
        value={selectedRowData}
       className="dataTableHeader dataTableBody dataTableBodyPadding"
      >
        <Column field="personal_goals" header="Through the Rear View Mirror - My Last Year's Traning Goals"></Column>
        <Column field="level_of_fullfillment" header="Level of fullfillment (1/5)"></Column>
        <Column field="relevance" header="Relevance"></Column>
        <Column field="appraisers_comments" header="Reviewer's Comment"></Column>
        <Column field="reviewers_comment" header="Appraiser's Comments"></Column>
        <Column header="Edit"></Column>
        <Column header="Delete"></Column>
      </DataTable>
    </>
  );
};

export default CompetencyScorecard;
