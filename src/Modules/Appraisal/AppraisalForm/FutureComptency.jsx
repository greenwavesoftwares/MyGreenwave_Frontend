import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { useEffect, useState } from "react";

const FutureComptency = ({ appraiserPreviousSaveFormDat }) => {
  const [selectedRowData, setSelectedRowData] = useState([]);

  useEffect(() => {
    if (appraiserPreviousSaveFormDat?.length > 0) {
      setSelectedRowData(appraiserPreviousSaveFormDat);
    }
  }, [appraiserPreviousSaveFormDat]);
  console.log("Previous_FutureComptencyCardData", selectedRowData);

  return (
    <>
      <DataTable
        size="small"
        stripedRows
        value={selectedRowData}
        showGridlines
        className="dataTableHeader dataTableBody dataTableBodyPadding"
      >
        <Column field="goals" header="My Competency Goals (To be aligend to professional and Personal Goals)"></Column>
        <Column field="relevance" header="Relevance(H/M/L)"></Column>
        <Column field="target_date" header="Target Date (yyyy-mm-dd)"></Column>
        <Column field="reviewers_comment" header="Reviewer's Comment"></Column>
        <Column field="appraisers_comments" header="Appraiser's Comments"></Column>
        <Column header="Edit"></Column>
        <Column header="Delete"></Column>
      </DataTable>
    </>
  );
};

export default FutureComptency;
