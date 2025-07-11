import { useState, useEffect, useRef } from "react";
const cellStyle = { padding: "8px 12px" };
import {
  getloanclaimsapplied,
  rejectLoanClaim,
  approveLoanClaim,
} from "../claimServices";
import CustomToast from "../../../components/Toast/Toast";
import {
  showSuccessMessage,
  showErrorMessage,
  showWarningMessage
} from "../../../components/Toast/ShowMessage";
import CustomButton from "../../../components/Button/Button";
import {
  CustomColumn,
  DataTableComponent,
} from "../../../components/DataTable/DataTableComponent";
import { ProgressBarComponent } from "../../../components/ProgressBar/ProgressBarComponent";
import { FilterMatchMode } from "primereact/api";
import { InputText } from "primereact/inputtext";

const HRLoanApplicationTable = () => {
  const toastRef = useRef(null);
  const [loanData, setloanData] = useState();
  const [loader, setLoader] = useState(false);
  const [remarks, setRemarks] = useState();

          const [globalFilterValue, setGlobalFilterValue] =
            useState("");
            const [globalFilterRows, setGlobalFilterRows] = useState({
            global: { value: null, matchMode: FilterMatchMode.CONTAINS },
            claimDate: { value: null, matchMode: FilterMatchMode.CONTAINS },
            requirementDate: { value: null, matchMode: FilterMatchMode.CONTAINS },
            amount: { value: null, matchMode: FilterMatchMode.CONTAINS },
            emi: { value: null, matchMode: FilterMatchMode.CONTAINS },
            emiAmount: { value: null, matchMode: FilterMatchMode.CONTAINS },
         
            numberOfEMIsPending: { value: null, matchMode: FilterMatchMode.CONTAINS },
            numberOfMonthsAfterLastEMI: { value: null, matchMode: FilterMatchMode.CONTAINS },
            reason: { value: null, matchMode: FilterMatchMode.CONTAINS },
            loanAmountPending: { value: null, matchMode: FilterMatchMode.CONTAINS },
            status: { value: null, matchMode: FilterMatchMode.CONTAINS },
            name: { value: null, matchMode: FilterMatchMode.CONTAINS },
            
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

  const actionbody = (rowData) => {
    const handleRejectClick = async (claim_id, remarks) => {
      try {
            if(!claim_id || !remarks)
                  {
                    showWarningMessage(toastRef,'Warning','First Fill Remarks')
                    return
                  }
        let response = await rejectLoanClaim(claim_id, remarks);
        if (response.status) {
          setloanData(response.data);
          showSuccessMessage(toastRef, "success", response.message);
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
        let response = await approveLoanClaim(claim_id, remarks);
        if (response.status) {
          setloanData(response.data);
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
            severity="success"
            onClick={() => handleApproveClick(rowData.claimId, remarks)}
          />
          <CustomButton
            label="Reject"
            size="small"
            severity="danger"
            onClick={() => handleRejectClick(rowData.claimId, remarks)}
          />
        </div>
      </div>
    );
  };

  useEffect(() => {
    const fetchloandetails = async () => {
      try {
        setLoader(true);
        const result = await getloanclaimsapplied();
        if (!result.status) {
          showErrorMessage(toastRef, "error", result.message);
        } else {
          setloanData(result.data);
        }
      } catch (error) {
        console.error("Error fetching claims:", error);
      } finally {
        setLoader(false);
      }
    };

    fetchloandetails();
  }, []);
  return (
    <div>
      <CustomToast ref={toastRef} />
      <DataTableComponent
        data={loanData}
        rows={10}
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
        className="text-xs defaultBorder"
        tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
        header={dataTableHeader}
        filters={globalFilterRows}
        globalFilterFields={[
          "name",
          "designation",
          "claimDate",
          "requirementDate",
          "amount",
          "emiAmount",
          "numberOfEMIsPending",
          "loanAmountPending",
          "numberOfMonthsAfterLastEMI",
          "reason",
          "status",
         

        ]}
      >
        <CustomColumn
          field="name"
          header="Name"
          headerStyle={{ ...cellStyle, maxWidth: "107px" }}
          bodyStyle={{ ...cellStyle, maxWidth: "107px" }}
        />
        <CustomColumn
          field="designation"
          header="Designation"
          headerStyle={{ ...cellStyle, maxWidth: "107px" }}
          bodyStyle={{ ...cellStyle, maxWidth: "107px" }}
        />

        <CustomColumn
          field="claimDate"
          header="Claim Date"
          headerStyle={{ ...cellStyle, maxWidth: "115px" }}
          bodyStyle={{ ...cellStyle, maxWidth: "115px" }}
        />
        <CustomColumn
          field="requirementDate"
          header="Loan Start Date"
          headerStyle={{ ...cellStyle, maxWidth: "107px" }}
          bodyStyle={{ ...cellStyle, maxWidth: "107px" }}
        />
        <CustomColumn
          field="amount"
          header="Loan Amount"
          headerStyle={{ ...cellStyle, maxWidth: "107px" }}
          bodyStyle={{ ...cellStyle, maxWidth: "107px" }}
        />
        <CustomColumn
          field="emi"
          header="Total EMIs"
          headerStyle={{ ...cellStyle, maxWidth: "107px" }}
          bodyStyle={{ ...cellStyle, maxWidth: "107px" }}
        />
        <CustomColumn
          field="emiAmount"
          header="EMI Amount"
          headerStyle={{ ...cellStyle, maxWidth: "107px" }}
          bodyStyle={{ ...cellStyle, maxWidth: "107px" }}
        />
        <CustomColumn
          field="numberOfEMIsPending"
          header="EMIs Pending"
          headerStyle={{ ...cellStyle, maxWidth: "107px" }}
          bodyStyle={{ ...cellStyle, maxWidth: "107px" }}
        />
        <CustomColumn
          field="loanAmountPending"
          header="Pending Loan Amount"
          headerStyle={{ ...cellStyle, maxWidth: "107px" }}
          bodyStyle={{ ...cellStyle, maxWidth: "107px" }}
        />
        <CustomColumn
          field="numberOfMonthsAfterLastEMI"
          header="Months After Last EMI"
          headerStyle={{ ...cellStyle, maxWidth: "107px" }}
          bodyStyle={{ ...cellStyle, maxWidth: "107px" }}
        />
        <CustomColumn
          field="reason"
          header="Reason"
          headerStyle={{ ...cellStyle, maxWidth: "107px" }}
          bodyStyle={{ ...cellStyle, maxWidth: "107px" }}
        />
        <CustomColumn
          field="status"
          header="Status"
          headerStyle={{ ...cellStyle, maxWidth: "107px" }}
          bodyStyle={{ ...cellStyle, maxWidth: "107px" }}
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

export default HRLoanApplicationTable;
