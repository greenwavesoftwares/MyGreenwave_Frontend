import React, { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { getLoanDetails } from "./claimServices";
import { ProgressBar } from "primereact/progressbar";
const cellStyle = { padding: "8px 12px" };
import {
  CustomColumn,
  DataTableComponent,
} from "../../components/DataTable/DataTableComponent";
import CustomButton from "../../components/Button/Button";

const LoanTable = () => {
  const [loanData, setloanData] = useState();
  const [loader, setLoader] = useState(false);

  useEffect(() => {
    const fetchloandetails = async () => {
      try {
        setLoader(true);
        const result = await getLoanDetails();
        setloanData(result.data);
        console.log(result.data);
        setLoader(false);
      } catch (error) {
        console.error("Error fetching claims:", error);
         setLoader(false);
      } finally {
        setLoader(false);
      }
      
    };

    fetchloandetails();
  }, [setloanData]);

  return (
    <DataTableComponent
      data={loanData}
      showGridlines
      className="text-xs"
      tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
      emptyMessage={
        loader ? (
          <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
        ) : (
          "No data found"
        )
      }
       rows={10}
    >
      <CustomColumn
        field="claimDate"
        header="Claim Date"
        headerStyle={{ ...cellStyle, minWidth: "100px" }}
        bodyStyle={{ ...cellStyle, minWidth: "100px" }}
      />
      <CustomColumn
        field="requirementDate"
        header="Loan Start Date"
        headerStyle={cellStyle}
        bodyStyle={cellStyle}
      />
      <CustomColumn
        field="amount"
        header="Loan Amount"
        headerStyle={cellStyle}
        bodyStyle={cellStyle}
      />
      <CustomColumn
        field="emi"
        header="Total EMIs"
        headerStyle={cellStyle}
        bodyStyle={cellStyle}
      />
      <CustomColumn
        field="emiAmount"
        header="EMI Amount"
        headerStyle={cellStyle}
        bodyStyle={cellStyle}
      />
      <CustomColumn
        field="numberOfEMIsPending"
        header="EMIs Pending"
        headerStyle={cellStyle}
        bodyStyle={cellStyle}
      />
      <CustomColumn
        field="loanAmountPending"
        header="Pending Loan Amount"
        headerStyle={cellStyle}
        bodyStyle={cellStyle}
      />
      <CustomColumn
        field="numberOfMonthsAfterLastEMI"
        header="Months After Last EMI"
        headerStyle={cellStyle}
        bodyStyle={cellStyle}
      />
      <CustomColumn
        field="reason"
        header="Reason"
        headerStyle={{ ...cellStyle, minWidth: "100px" }}
        bodyStyle={{ ...cellStyle, minWidth: "100px" }}
      />
      <CustomColumn
        field="status"
        header="Status"
        headerStyle={cellStyle}
        bodyStyle={cellStyle}
      />
      <CustomColumn
        field="approverName"
        header="Approver Name"
        headerStyle={cellStyle}
        bodyStyle={cellStyle}
      />
      {/* <Column field="approver" header="Approver Email" style={{ minWidth: '150px' }}/> */}
      <CustomColumn
        field="approver_remarks"
        header="Approver Remarks"
        headerStyle={cellStyle}
        bodyStyle={cellStyle}
      />
    </DataTableComponent>
  );
};

export default LoanTable;
