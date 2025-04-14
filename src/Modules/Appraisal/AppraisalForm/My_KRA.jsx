import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { useEffect, useState } from "react";

const MyKRA = ({ appraiserPreviousSaveFormDat }) => {
  const [selectedRowData, setSelectedRowData] = useState([]);

  useEffect(() => {
    if (appraiserPreviousSaveFormDat?.length > 0) {
      setSelectedRowData(appraiserPreviousSaveFormDat);
    }
  }, [appraiserPreviousSaveFormDat]);
  console.log("Previous_MyKRACardData", selectedRowData);

  return (
    <>
      <DataTable
        size="small"
        stripedRows
        value={selectedRowData}
        showGridlines
        className="dataTableHeader dataTableBody dataTableBodyPadding"
      >
       <Column field="my_next12month_KRA" header="My KRA - Next 12 Months (To be aligend to professional and Personal Goals)"></Column>
                       <Column field="reviewers_comment" header="Reviewer's Comment"></Column>
                       <Column field="appraisers_comments" header="Appraiser's Comments"></Column>
                       <Column header="Edit"></Column>
                       <Column header="Delete"></Column>
      </DataTable>
    </>
  );
};

export default MyKRA;
