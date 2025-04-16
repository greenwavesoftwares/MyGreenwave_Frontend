import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { useEffect, useState } from "react";

const FutureGoals = ({ appraiserPreviousSaveFormDat }) => {
  const [selectedRowData, setSelectedRowData] = useState([]);

  useEffect(() => {
    if (appraiserPreviousSaveFormDat?.length > 0) {
      setSelectedRowData(appraiserPreviousSaveFormDat);
    }
  }, [appraiserPreviousSaveFormDat]);
  console.log("Previous_FutureGoalsCardData", selectedRowData);

  return (
    <>
      <DataTable
        size="small"
        stripedRows
        value={selectedRowData}
        showGridlines
        className="dataTableHeader dataTableBody dataTableBodyPadding"
      >
        <Column field="future_personal_KRA_goals" header="My Aspirations (2 Professional and 2 Personal Goal identification for 12-36 Months)"></Column>
        <Column field="goalType" header="Personal/Professional"></Column>
        <Column field="reviewers_comment" header="Reviewer's Comment"></Column>
        <Column field="appraisers_comments" header="Appraiser's Comments"></Column>
        <Column header="Edit"></Column>
        <Column header="Delete"></Column>
      </DataTable>
    </>
  );
};

export default FutureGoals;
