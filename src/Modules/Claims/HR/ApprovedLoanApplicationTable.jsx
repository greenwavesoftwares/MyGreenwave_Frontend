import React, { useEffect, useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { getloanclaimsapproveandreject } from "../claimServices";
const cellStyle = { padding: "8px 12px" };
import { Toast } from "primereact/toast";

const ApprovedLoanApplicationTable = () => {
  const toast = useRef(null);
  const [loanData, setloanData] = useState();
  const [loading, setLoading] = useState();

  useEffect(() => {
    const fetchloandetails = async () => {
      try {
        const result = await getloanclaimsapproveandreject();
        if (!result.status) {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: result.message,
          });
        } else {
          setloanData(result.data);
        }
      } catch (error) {
        console.error("Error fetching claims:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchloandetails();
  }, []);

  return (
    <div>
      <Toast ref={toast} />
      <DataTable
        value={loanData}
        loading={loading}
        showGridlines
        className="text-xs"
        tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
      >
        <Column
          field="name"
          header="Name"
          headerStyle={{ ...cellStyle, maxWidth: "107px" }}
          bodyStyle={{ ...cellStyle, maxWidth: "107px" }}
        />
        <Column
          field="designation"
          header="Designation"
          headerStyle={{ ...cellStyle, maxWidth: "107px" }}
          bodyStyle={{ ...cellStyle, maxWidth: "107px" }}
        />
        <Column
          field="claimDate"
          header="Claim Date"
          headerStyle={{ ...cellStyle, minWidth: "100px" }}
          bodyStyle={{ ...cellStyle, minWidth: "100px" }}
        />
        <Column
          field="requirementDate"
          header="Loan Start Date"
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <Column
          field="amount"
          header="Loan Amount"
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <Column
          field="emi"
          header="Total EMIs"
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <Column
          field="emiAmount"
          header="EMI Amount"
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <Column
          field="numberOfEMIsPending"
          header="EMIs Pending"
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <Column
          field="loanAmountPending"
          header="Pending Loan Amount"
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <Column
          field="numberOfMonthsAfterLastEMI"
          header="Months After Last EMI"
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <Column
          field="reason"
          header="Reason"
          headerStyle={{ ...cellStyle, minWidth: "100px" }}
          bodyStyle={{ ...cellStyle, minWidth: "100px" }}
        />
        <Column
          field="status"
          header="Status"
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <Column
          field="approverName"
          header="Approver Name"
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        {/* <Column field="approver" header="Approver Email" style={{ minWidth: '150px' }}/> */}
        <Column
          field="approver_remarks"
          header="Approver Remarks"
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
      </DataTable>
    </div>
  );
};

export default ApprovedLoanApplicationTable;
