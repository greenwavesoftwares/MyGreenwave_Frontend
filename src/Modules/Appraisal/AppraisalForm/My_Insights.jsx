import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { useEffect, useState } from "react";

const MyInsights = ({ appraiserPreviousSaveFormDat }) => {
  const [selectedRowData, setSelectedRowData] = useState([]);

  useEffect(() => {
    if (appraiserPreviousSaveFormDat?.length > 0) {
      setSelectedRowData(appraiserPreviousSaveFormDat);
    }
  }, [appraiserPreviousSaveFormDat]);
  console.log("Previous_MyInsightsCardData", selectedRowData);

  return (
    <>
      <DataTable
        size="small"
        stripedRows
        value={selectedRowData}
        showGridlines
        className="dataTableHeader dataTableBody dataTableBodyPadding"
      >
        <Column field="my_ideas" header="My Ideas"></Column>
        <Column field="my_contribution_plans" header="My Contribution Plans"></Column>
        <Column field="reviewers_comment" header="Reviewer's Comment"></Column>
        <Column field="appraisers_comments" header="Appraiser's Comments"></Column>
        <Column header="Edit"></Column>
        <Column header="Delete"></Column>
      </DataTable>
    </>
  );
};

export default MyInsights;
