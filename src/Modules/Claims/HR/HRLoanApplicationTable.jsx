import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
const cellStyle = { padding: "8px 12px" };
import { getLoanDetails } from "../claimServices";

const HRLoanApplicationTable = () => {
  const [loanData, setloanData] = useState();
  const [loading, setLoading] = useState();

  const actionbody = () => {
    return (
      <div className="flex  flex-col gap-y-2">
        <textarea
          name=""
          id=""
          className="border border-md rounded-md"
          rows={3}
        ></textarea>
        <div className="flex gap-x-2">
          <Button label="Approve" size="small" severity="success" />
          <Button label="Reject" size="small" severity="danger" />
        </div>
      </div>
    );
  };

  useEffect(() => {
    const fetchloandetails = async () => {
      try {
        const result = await getLoanDetails();
        setloanData(result.data);
        console.log(result.data);
      } catch (error) {
        console.error("Error fetching claims:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchloandetails();
  }, [setloanData]);
  return (
    <DataTable
      value={loanData}
      loading={loading}
      showGridlines
      paginator
      rows={10}
      showGridlinesclassName="text-xs"
      tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
    >
      <Column
        field="claimDate"
        header="Claim Date"
         sortable
          filter
        headerStyle={{ ...cellStyle, minWidth: "100px" }}
        bodyStyle={{ ...cellStyle, minWidth: "100px" }}
      />
      <Column
        field="requirementDate"
        header="Loan Start Date"
         sortable
          filter
        headerStyle={cellStyle}
        bodyStyle={cellStyle}
      />
      <Column
        field="amount"
        header="Loan Amount"
         sortable
          filter
        headerStyle={cellStyle}
        bodyStyle={cellStyle}
      />
      <Column
        field="emi"
        header="Total EMIs"
         sortable
          filter
        headerStyle={cellStyle}
        bodyStyle={cellStyle}
      />
      <Column
        field="emiAmount"
        header="EMI Amount"
         sortable
          filter
        headerStyle={cellStyle}
        bodyStyle={cellStyle}
      />
      <Column
        field="numberOfEMIsPending"
        header="EMIs Pending"
         sortable
          filter
        headerStyle={cellStyle}
        bodyStyle={cellStyle}
      />
      <Column
        field="loanAmountPending"
        header="Pending Loan Amount"
         sortable
          filter
        headerStyle={cellStyle}
        bodyStyle={cellStyle}
      />
      <Column
        field="numberOfMonthsAfterLastEMI"
        header="Months After Last EMI"
         sortable
          filter
        headerStyle={cellStyle}
        bodyStyle={cellStyle}
      />
      <Column
        field="reason"
        header="Reason"
         sortable
          filter
        headerStyle={{ ...cellStyle, minWidth: "100px" }}
        bodyStyle={{ ...cellStyle, minWidth: "100px" }}
      />
      <Column
        field="status"
        header="Status"
         sortable
          filter
        headerStyle={cellStyle}
        bodyStyle={cellStyle}
      />

      <Column
        body={actionbody}
        header="Action"
         sortable
          filter
        headerStyle={cellStyle}
        bodyStyle={cellStyle}
      />
    </DataTable>
  );
};

export default HRLoanApplicationTable;
