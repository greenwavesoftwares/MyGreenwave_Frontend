import { useEffect, useState, useRef } from "react";

import {
  getAppliedMiscellanousClaimAccount,
  downloadOtherClaimSupportingDocument,
  approveMiscellanousClaim,
  rejectMiscellanousClaim,
} from "../claimServices"; // Adjust the path as needed
const cellStyle = { padding: "8px 12px" };
import {
  showSuccessMessage,
  showErrorMessage,
  showWarningMessage,
} from "../../../components/Toast/ShowMessage";

import CustomButton from "../../../components/Button/Button";
import CustomToast from "../../../components/Toast/Toast";
import {
  CustomColumn,
  DataTableComponent,
} from "../../../components/DataTable/DataTableComponent";
import { ProgressBarComponent } from "../../../components/ProgressBar/ProgressBarComponent";
import { FilterMatchMode } from "primereact/api";
import { InputText } from "primereact/inputtext";


const AccountMiscellanousClaimApprover = () => {
  const toastRef = useRef(null);

  const [loader, setLoader] = useState(false);
  const [miscellanousData, setmiscellanousData] = useState();

 const [globalFilterValue, setGlobalFilterValue] =
        useState("");
      const [globalFilterRows, setGlobalFilterRows] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        name: { value: null, matchMode: FilterMatchMode.CONTAINS },
        designation: { value: null, matchMode: FilterMatchMode.CONTAINS },
        type: { value: null, matchMode: FilterMatchMode.CONTAINS },
        claim_date: { value: null, matchMode: FilterMatchMode.CONTAINS },
        amount: { value: null, matchMode: FilterMatchMode.CONTAINS },
        status: { value: null, matchMode: FilterMatchMode.CONTAINS },
        reason: { value: null, matchMode: FilterMatchMode.CONTAINS },
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
         style={!rowData.filename ? { color: '#708090' }:{}}
          disabled={rowData.filename?false:true}
      />
    );
  };

  const actionbody = (rowData) => {
    const [remarks, setRemarks] = useState();


    const handleRejectClick = async (claim_id, remarks) => {
      try {
         if(!claim_id || !remarks)
        {
          showWarningMessage(toastRef,'Warning','First Fill Remarks')
          return
        }
        let response = await rejectMiscellanousClaim(claim_id, remarks);
        if (response.status) {
          setmiscellanousData(response.data);
          showSuccessMessage(toastRef, "success", response.message);
          setRemarks("");
          setmiscellanousData(response.data);
        } else {
          showErrorMessage(toastRef, "error", response.message);
        }
      } catch (error) {
        showErrorMessage(toastRef, "error", error?.message);
      }
    };

    const handleApproveClick = async (claim_id, remarks) => {
      try {
        if(!claim_id || !remarks)
        {
          showWarningMessage(toastRef,'Warning','First Fill Remarks')
          return
        }
        let response = await approveMiscellanousClaim(claim_id, remarks);
        if (response.status) {
          setmiscellanousData(response.data);
          showSuccessMessage(toastRef, "success", response.message);
        } else {
          showErrorMessage(toastRef, "error", response.message);
        }
      } catch (error) {
        showErrorMessage(toastRef, "error", error?.message);
      }
    };

    return (
      <div className="flex flex-col gap-y-2 max-w-xs">
        {" "}
        {/* limits total width */}
        <textarea
          placeholder="remarks"
          className="border border-md rounded-md p-2 w-full"
          rows={2}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        ></textarea>
        <div className="flex gap-x-1">
          <CustomButton
            label="Approve"
            size="small"
            className="bg-green-100 text-green-800 hover:bg-green-200 border-none"
            onClick={() => handleApproveClick(rowData.claim_id, remarks)}
          />
          <CustomButton
            label="Reject"
            size="small"
            className="bg-red-100 text-red-800 hover:bg-red-200 border-none"
            onClick={() => handleRejectClick(rowData.claim_id, remarks)}
          />
        </div>
      </div>
    );
  };

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        setLoader(true)
        const response = await getAppliedMiscellanousClaimAccount();
        if (response.status) {
          setmiscellanousData(response.data);
        } else {
          showErrorMessage(toastRef, "error", response.message);
        }
      } catch (error) {
        showErrorMessage(toastRef, "error", error?.message);
        console.error("Error fetching claims:", error);
      } finally {
        setLoader(false);
      }
    };

    fetchClaims();
  }, []);

  return (
    <div>
      <CustomToast ref={toastRef} />
      <DataTableComponent
        data={miscellanousData}
       // paginator
        rows={10}
       // loading={loading}
       // showGridlines
      //  stripedRows
        dataKey="claim_id"
         emptyMessage={
          loader ? (
            <ProgressBarComponent
              mode="indeterminate"
              style={{ height: "6px" }}
            />
          ) : (
            "No data found"
          )
        }
       
        tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
        className={"defaultBorder"}
        header={dataTableHeader}
        filters={globalFilterRows}
        globalFilterFields={[
          "name",
          "designation",
          "type",
          "claim_date",
          "amount",
          "status",
          "reason"
        ]}
      >
        {/* <Column field="claim_id" header="claim_id" sortable filter /> */}
        <CustomColumn field="name" header="Name" sortable={true} filter={true} />
        <CustomColumn field="designation" header="Designation" sortable filter />

        <CustomColumn field="type" header="Claim Type" sortable={true} filter={true} />
        <CustomColumn field="claim_date" header="Application Date" sortable={true} filter={true} />
        <CustomColumn field="amount" header="Amount" sortable={true} filter={true} />
        <CustomColumn field="reason" header="Details" sortable={true} filter={true} />
        <CustomColumn field="status" header="Status" sortable={true} filter={true}/>
        {/* <Column
          field="approver_remarks"
          header="Approved Remarks"s
          sortable
          filter
        /> */}
        {/* <Column field="approver" header="Approver" sortable filter /> */}
        <CustomColumn
          field="downloadSupportingDocument"
          header="Supporting Document"
          body={downloadSupportingDocument}
          headerStyle={{ ...cellStyle, maxWidth: "125px" }}
          bodyStyle={{ ...cellStyle, maxWidth: "125px" }}
         sortable={true} filter={true}
        />
        <CustomColumn
          body={actionbody}
          header="Action"
          headerStyle={{ ...cellStyle }}
          bodyStyle={{ ...cellStyle }}
        />
      </DataTableComponent>
    </div>
  );
};

export default AccountMiscellanousClaimApprover;
