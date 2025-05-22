import React, { useEffect, useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import {
  getTourClaimList,
  AddRowINExcel,
  downloadTourClaimSupportingDocument,
  downloadTourClaimExpanseDocument,
  getTourClaimTableDraftData,
} from "./claimServices";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { FileUpload } from "primereact/fileupload";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";

//import ViewTable from "./ViewTable";
const cellStyle = {
  padding: "0.5rem 1rem",
  textAlign: "center",
  verticalAlign: "middle",
};

const MyTourClaims = () => {
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewtabledata, setviewtabledata] = useState();
  const [expandedRows, setExpandedRows] = useState(null);
  const [tourClaims, setTourClaims] = useState([]);
  const toast = useRef(null);

  const handleDownloadFile = async () => {
    try {
      //await AddRowINExcel()
    } catch (error) {
      console.log(error);
    }
  };

  const tourDetailsBody = (rowData) => (
    <div className="text-xs space-y-1 flex flex-col justify-center">
      <div>
        <span className="font-bold">Destination:</span> {rowData["destination"]}
      </div>
      <div>
        <span className="font-bold">Purpose:</span> {rowData["purpose"]}
      </div>
      <div>
        <span className="font-bold">Project:</span> {rowData["project"]}
      </div>
      <div>
        <span className="font-bold">Type:</span> {rowData["type"]}
      </div>
    </div>
  );

  const claimCalculationBody = (rowData) => (
    <div className="flex flex-col items-end justify-center space-y-1">
      <div>
        <span className="font-semibold text-gray-700">Expense:</span> ₹
        {rowData["total_expensevance"]}
      </div>
      <div>
        <span className="font-semibold text-gray-700">Advance:</span> ₹
        {rowData["advance"]}
      </div>
      <hr className="w-2/3 border-gray-300" />
      {rowData["dueAmount"] > 0 ? (
        <div>
          <span className="font-semibold text-yellow-700">Due:</span> ₹
          {rowData["dueAmount"]}
        </div>
      ) : (
        <div>
          <span className="font-semibold text-green-700">Claim:</span> ₹
          {rowData["amountToBeClaimed"]}
        </div>
      )}
    </div>
  );

  const approverBody = (rowData) => (
    <div className="flex flex-col items-end justify-center text-gray-800 space-y-1">
      <div>{rowData["approverName"] || "NA"}</div>
      <div className="italic text-gray-600">
        {rowData["approver_remarks"] || "No remarks"}
      </div>
    </div>
  );

  const reviewerBody = (rowData) => (
    <div className="flex flex-col items-end justify-center  text-gray-800 space-y-1">
      <div>{rowData["reviewerName"] || "NA"}</div>
      <div className="italic text-gray-600">
        {rowData["reviewer_remarks"] || "No remarks"}
      </div>
    </div>
  );

  const statusBody = (rowData) => {
    const status = rowData.status?.toLowerCase();
    const severity =
      status === "approved"
        ? "success"
        : status === "settled"
        ? "info"
        : "warning";
    return (
      <div className="flex justify-center">
        <Tag
          value={rowData.status || "Pending"}
          severity={severity}
          className="text-xs"
        />
      </div>
    );
  };

  const datebody = (rowData) => {
    return (
      <div className="flex flex-col justify-center items-center">
        <span > {rowData.from_date}</span>
        <span > to </span>
        <span > {rowData.from_date} </span>
      </div>
    );
  };

  const downloadExpense = (rowData) => {
    const handleDownloadFile = async (claim_id) => {
      try {
        let d = await downloadTourClaimExpanseDocument(claim_id);
      } catch (error) {
        toast.current.show({
          severity: "error",
          summary: "error",
          detail: "Something Wrong.",
        });
      }
    };

    const viewtable = async (claim_id) => {
      try {
        let data = await getTourClaimTableDraftData(claim_id);
        setviewtabledata(data.tourClaimRecords);
         setShowViewDialog(true);
      } catch (error) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Failed to load table.",
        });
      }
    };

    return (
      <div className="flex justify-center items-center gap-2">
        <Button
          icon="pi pi-download"
          className="p-button-sm p-button-text p-button-success"
          onClick={() => {
            handleDownloadFile(rowData.claim_id);
          }}
          tooltip={""}
        />
        <Button
          icon="pi pi-eye"
          className="p-button-sm p-button-text p-button-success"
          onClick={() => {
            viewtable(rowData.claim_id);
          }}
          tooltip={""}
        />
      </div>
    );
  };

  const downloadSupportingDocument = (rowData) => {
    const handleDownloadFile = async (claim_id) => {
      try {
        let d = await downloadTourClaimSupportingDocument(claim_id);
      } catch (error) {
        toast.current.show({
          severity: "error",
          summary: "error",
          detail: "Something Wrong.",
        });
      }
    };

    return (
      <Button
        icon="pi pi-download"
        className="p-button-sm p-button-text p-button-success"
        onClick={() => {
          handleDownloadFile(rowData.claim_id);
        }}
        tooltip={`${rowData.filename}`}
      />
    );
  };

  const rowExpansionTemplate = (rowData) => (
   
      <DataTable
        value={rowData.expandabledata}
        showGridlines
        
        className="text-xs"
        tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
      >
        <Column
          header="Claim Duration"
          body={datebody}
          headerStyle={{ ...cellStyle, width: "120px", whiteSpace: "normal" }}
        />
       
        <Column
          header="Claim Calculation"
          body={claimCalculationBody}
          headerStyle={{ ...cellStyle, width: "200px", whiteSpace: "normal" }}
          bodyStyle={{
            ...cellStyle,
            width: "200px",
            whiteSpace: "normal",
            wordBreak: "break-word",
          }}
        />
        <Column
          header="Approver - Remarks"
          body={approverBody}
          headerStyle={{ ...cellStyle, width: "200px", whiteSpace: "normal" }}
          bodyStyle={{
            ...cellStyle,
            width: "200px",
            whiteSpace: "normal",
            wordBreak: "break-word",
          }}
        />
        <Column
          header="Reviewer - Remarks"
          body={reviewerBody}
          headerStyle={{ ...cellStyle, width: "200px", whiteSpace: "normal" }}
          bodyStyle={{
            ...cellStyle,
            width: "200px",
            whiteSpace: "normal",
            wordBreak: "break-word",
          }}
        />
        <Column
          field="status"
          header="Status"
          body={statusBody}
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <Column
          field="Expense"
          header="Expense"
          body={downloadExpense}
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <Column
          field="downloadSupportingDocument"
          header="Supporting Document"
          body={downloadSupportingDocument}
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
      </DataTable>
  
  );

  useEffect(() => {
    const fetchTourClaimList = async () => {
      try {
        const data = await getTourClaimList();
        setTourClaims(data);
        console.log(data);
      } catch (error) {
        console.error("Error fetching tour claim list:", error);
      }
    };

    fetchTourClaimList();
  }, []);

  return (
    <div className="overflow-x-auto p-4">
      <DataTable
        value={tourClaims}
        expandedRows={expandedRows}
        onRowToggle={(e) => setExpandedRows(e.data)}
        rowExpansionTemplate={rowExpansionTemplate}
          showGridlines
        className="text-xs"
        tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
        dataKey="requisition_id"
         paginator
        rows={10}
      >
        <Column expander style={{ width: "3rem" }} />
        <Column
          field="fromDate"
          header="From Date"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <Column
          field="tentativeToDate"
          header="Tentative Date"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <Column
          field="actualToDate"
          header="Actual To Date"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <Column
          field="project"
          header="Project"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <Column
          field="purpose"
          header="Purpose"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <Column
          field="destination"
          header="Destination"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <Column
          field="type"
          header="Type"
          sortable
          filter
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
      </DataTable>
      <Dialog
        header="Tour Claim Details"
        visible={showViewDialog}
        style={{ width: "90vw" }}
        onHide={() => setShowViewDialog(false)}
        modal
      >
        <DataTable
          value={viewtabledata}
          showGridlines
          tableStyle={{ minWidth: "50rem" }}
        >
          <Column field="date" header="Date"  headerStyle={cellStyle}
          bodyStyle={cellStyle} />
          <Column field="lodging" header="Lodging"   headerStyle={cellStyle}
          bodyStyle={cellStyle}/>
          <Column field="breakfast" header="Breakfast"   headerStyle={cellStyle}
          bodyStyle={cellStyle}/>
          <Column field="lunch" header="Lunch"   headerStyle={cellStyle}
          bodyStyle={cellStyle}/>
          <Column field="snacks" header="Snacks"   headerStyle={cellStyle}
          bodyStyle={cellStyle}/>
          <Column field="dinner" header="Dinner"  headerStyle={cellStyle}
          bodyStyle={cellStyle}/>
          <Column field="teaWater" header="Tea & Water"   headerStyle={cellStyle}
          bodyStyle={cellStyle}/>
          <Column
            field="longTravel"
            header="Airfare, Bus, Train, Taxi Rental"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
          />
          <Column field="shortTravel" header="Auto, Cab"  headerStyle={cellStyle}
          bodyStyle={cellStyle} />
          <Column field="tollTax" header="Parking, Toll, Fuel"  headerStyle={cellStyle}
          bodyStyle={cellStyle}/>
          <Column field="incidentals" header="Incidentals"  headerStyle={cellStyle}
          bodyStyle={cellStyle}/>
          <Column field="other" header="Other Business Expenses"  headerStyle={cellStyle}
          bodyStyle={cellStyle}/>
          <Column field="total" header="Total"  headerStyle={cellStyle}
          bodyStyle={cellStyle}/>
          <Column field="remarks" header="Remarks"  headerStyle={cellStyle}
          bodyStyle={cellStyle}/>
        </DataTable>
      </Dialog>
    </div>
  );
};

export default MyTourClaims;
