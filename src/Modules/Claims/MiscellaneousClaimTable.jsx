import React, { useEffect, useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import {
  getOtherClaims,
  downloadOtherClaimSupportingDocument,
} from "./claimServices"; // Adjust the path as needed
const cellStyle = {};
//import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import {
  CustomColumn,
  DataTableComponent,
} from "../../components/DataTable/DataTableComponent";
import CustomButton from "../../components/Button/Button";
import {
  showSuccessMessage,
  showErrorMessage,
  showWarningMessage,
} from "../../components/Toast/ShowMessage";

import { FilterMatchMode } from "primereact/api";
import { InputText } from "primereact/inputtext";

const MiscellaneousClaimTable = () => {
  const toastRef = useRef(null);
  const [data, setData] = useState([]);
  const [loader, setLoader] = useState(false);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [globalFilterRows, setGlobalFilterRows] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    type: { value: null, matchMode: FilterMatchMode.CONTAINS },
    claim_date: { value: null, matchMode: FilterMatchMode.CONTAINS },
    amount: { value: null, matchMode: FilterMatchMode.CONTAINS },
    reason: { value: null, matchMode: FilterMatchMode.CONTAINS },
    status: { value: null, matchMode: FilterMatchMode.CONTAINS },

    approver_remarks: { value: null, matchMode: FilterMatchMode.CONTAINS },
    approver: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _globalFilterRows = { ...globalFilterRows };

    _globalFilterRows["global"].value = value;

    setGlobalFilterRows(_globalFilterRows);
    setGlobalFilterValue(value);
  };

  const renderHeaderForGlobalSearch = () => {
    return (
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Keyword Search"
          className="w-full sm:w-auto inputFieldStyle"
        />
      </div>
    );
  };

  const dataTableHeader = renderHeaderForGlobalSearch();

  const downloadSupportingDocument = (rowData) => {
    const handleDownloadFile = async (claim_id) => {
      try {
        let response = await downloadOtherClaimSupportingDocument(claim_id);
        if (!response.status) {
          showErrorMessage(toastRef, "error", response.message);
        }
      } catch (error) {
        showErrorMessage(toastRef, "error", error?.message);
      }
    };

    return (
      <CustomButton
        icon="pi pi-download"
        className="p-button-sm p-button-text p-button-success"
        onClick={() => {
          handleDownloadFile(rowData.claim_id);
        }}
        tooltip={`${rowData.filename}`}
        style={!rowData.filename ? { color: "#708090" } : {}}
        disabled={rowData.filename ? false : true}
      />
    );
  };

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        setLoader(true);
        const result = await getOtherClaims();
        setData(result);
      } catch (error) {
        console.error("Error fetching claims:", error);
      } finally {
        setLoader(false);
      }
    };

    fetchClaims();
  }, []);

  return (
    <div>
      <Toast ref={toastRef} />
      <DataTableComponent
        data={data}
        rows={10}
        className={
          "dataTableHeader dataTableBody dataTableBodyPadding dataTablePaginator"
        }
        showGridlines
        stripedRows
        dataKey="claim_id"
        //  emptyMessage="No claims found."
        tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
        emptyMessage={
          loader ? (
            <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
          ) : (
            "No data found"
          )
        }
        header={dataTableHeader}
        filters={globalFilterRows}
        globalFilterFields={[
          "type",
          "claim_date",
          "amount",
          "reason",
          "status",
          "approver_remarks",
          "approver",
        ]}
      >
        <CustomColumn field="type" header="Claim Type" sortable filter />
        <CustomColumn
          field="claim_date"
          header="Application Date"
          sortable
          filter
        />
        <CustomColumn field="amount" header="Amount" sortable filter />
        <CustomColumn field="reason" header="Details" sortable filter />
        <CustomColumn field="status" header="Status" sortable filter />
        <CustomColumn
          field="approver_remarks"
          header="Approved Remarks"
          sortable
          filter
        />
        <CustomColumn field="approver" header="Approver" sortable filter />
        <CustomColumn
          field="downloadSupportingDocument"
          header="Supporting Document"
          body={downloadSupportingDocument}
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
          // sortable filter
        />
      </DataTableComponent>
    </div>
  );
};

export default MiscellaneousClaimTable;
