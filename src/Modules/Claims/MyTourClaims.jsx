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
import { ProgressBar } from "primereact/progressbar";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import {ExpandableDataTableComponent,CustomColumn,DataTableComponent} from "../../components/DataTable/DataTableComponent";
import CustomButton from "../../components/Button/Button";
import { FilterMatchMode } from "primereact/api";
import { InputText } from "primereact/inputtext";
import {Tooltip as Muitooltip} from "@mui/material";


//import ViewTable from "./ViewTable";
const cellStyle = {
  padding: "0.5rem 1rem",
  textAlign: "center",
  verticalAlign: "middle",
};

const MyTourClaims = () => {
  const [loader,setLoader]=useState(false)
  const [rowData, setRowData] = useState({});
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewtabledata, setviewtabledata] = useState();
  const [expandedRows, setExpandedRows] = useState(null);
  const [tourClaims, setTourClaims] = useState([]);
  const toast = useRef(null);

 

  const [globalFilterValue, setGlobalFilterValue] =
      useState("");
    const [globalFilterRows, setGlobalFilterRows] = useState({
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      fromDate: { value: null, matchMode: FilterMatchMode.CONTAINS },
      actualToDate: { value: null, matchMode: FilterMatchMode.CONTAINS },
      tentativeToDate: { value: null, matchMode: FilterMatchMode.CONTAINS },
      project: { value: null, matchMode: FilterMatchMode.CONTAINS },
      purpose: { value: null, matchMode: FilterMatchMode.CONTAINS },
   
      destination: { value: null, matchMode: FilterMatchMode.CONTAINS },
      type: { value: null, matchMode: FilterMatchMode.CONTAINS },
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
            className="w-full sm:w-auto"
          />
        </div>
      );
    };
  
     const dataTableHeader = renderHeaderForGlobalSearch();

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
   // approvedAmount
    <div className="flex flex-col items-end justify-center space-y-1">
       <div>
        <span className="font-semibold text-gray-700">Advance:</span> ₹
        {rowData["advance"]}
      </div>
      <div>
        <span className="font-semibold text-gray-700">Expense:</span> ₹
        {rowData["total_expense"]}
      </div>
      <div>
        <span className="font-semibold text-gray-700">Claim Approved:</span> ₹
        {rowData["approvedAmount"]}
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
        <span > {rowData.to_date} </span>
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
        <CustomButton
          icon="pi pi-download"
          className="p-button-sm p-button-text p-button-success"
          onClick={() => {
            handleDownloadFile(rowData.claim_id);
          }}
          tooltip={""}
        />
        <CustomButton
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
      <CustomButton
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
   
      <DataTableComponent
       rows={10}
            textSize="text-xs"
            tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
            emptyMessage="No data found"
         
        data={rowData.expandabledata}
        showGridlines  
        className="text-xs"
        //tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
      >
    <Column
        header="S.NO"
       body={(rowData, { rowIndex }) => (
    <Muitooltip title={rowData.claim_id} placement="top">
      <span>{rowIndex + 1}</span>
    </Muitooltip>
  )}
        style={{ width: '3rem' }}
      />
         {/* <CustomColumn
          header="Claim Id"
         
        field="claim_id"
          headerStyle={{ ...cellStyle, width: "120px", whiteSpace: "normal" }}
        /> */}
        
        <CustomColumn
          header="Claim Duration"
          body={datebody}
          headerStyle={{ ...cellStyle, width: "120px", whiteSpace: "normal" }}
        />
       
        <CustomColumn
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
        <CustomColumn
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
        <CustomColumn
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
        <CustomColumn
          field="status"
          header="Status"
          body={statusBody}
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <CustomColumn
          field="Expense"
          header="Expense"
          body={downloadExpense}
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <CustomColumn
          field="downloadSupportingDocument"
          header="Supporting Document"
          body={downloadSupportingDocument}
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
      </DataTableComponent>
  
  );

  useEffect(() => {
    const fetchTourClaimList = async () => {
      try {
        setLoader(true)
        const data = await getTourClaimList();
        setTourClaims(data);
        console.log('Data :-' ,data);
      } catch (error) {
        console.error("Error fetching tour claim list:", error);
      }
      setLoader(false)
    };

    fetchTourClaimList();
  }, []);

  return (
    <div className="overflow-x-auto p-4">
      <ExpandableDataTableComponent
        data={tourClaims}
        expandedRows={expandedRows}
        onRowToggle={(e) => setExpandedRows(e.data)}
        rowExpansionTemplate={rowExpansionTemplate}
          //showGridlines
        className="text-xs"
        tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
        dataKey="travel_id"
         paginator
        rows={10}
         emptyMessage={
          loader? (
             <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
           
          ) : (
              "No data found"
          )
        }
         header={dataTableHeader}
        filters={globalFilterRows}
        globalFilterFields={[
          "fromDate",
          "tentativeToDate",
          "actualToDate",
          "project",
          "purpose",
          "destination",
          "type",
        ]}
      >
        <Column expander style={{ width: "3rem" }} />
         {/* <CustomColumn
          field="travel_id"
          header="travel_id"
          sortable={true}
          filter={true}
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        /> */}

        <CustomColumn
          field="fromDate"
          header="From Date"
          sortable={true}
          filter={true}
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <CustomColumn
          field="tentativeToDate"
          header="Tentative Date"
          sortable={true}
          filter={true}
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <CustomColumn
          field="actualToDate"
          header="Actual To Date"
          sortable={true}
          filter={true}
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        {/* <CustomColumn
          field="project"
          header="Project"
          sortable={true}
          filter={true}
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        /> */}
         <Column  header="Project Name"
                 body={(rowData) => (
            <Muitooltip title={rowData.travel_id} placement="top">
              <span>{rowData.project}</span>
            </Muitooltip>
          )}></Column>
        <CustomColumn
          field="purpose"
          header="Purpose"
          sortable={true}
          filter={true}
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <CustomColumn
          field="destination"
          header="Destination"
         sortable={true}
          filter={true}
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
        <CustomColumn
          field="type"
          header="Type"
          sortable={true}
          filter={true}
          headerStyle={cellStyle}
          bodyStyle={cellStyle}
        />
      </ExpandableDataTableComponent>
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
          className="text-xs"
           tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
        >
           <CustomColumn field="travel_id" header="travel_id"  headerStyle={{...cellStyle,minWidth:"100px"}}
          bodyStyle={cellStyle} />
          <CustomColumn field="date" header="Date"  headerStyle={{...cellStyle,minWidth:"100px"}}
          bodyStyle={cellStyle} />
          <CustomColumn field="lodging" header="Lodging"   headerStyle={cellStyle}
          bodyStyle={cellStyle}/>
          <CustomColumn field="breakfast" header="Breakfast"   headerStyle={cellStyle}
          bodyStyle={cellStyle}/>
          <CustomColumn field="lunch" header="Lunch"   headerStyle={cellStyle}
          bodyStyle={cellStyle}/>
          <CustomColumn field="snacks" header="Snacks"   headerStyle={cellStyle}
          bodyStyle={cellStyle}/>
          <CustomColumn field="dinner" header="Dinner"  headerStyle={cellStyle}
          bodyStyle={cellStyle}/>
          <CustomColumn field="teaWater" header="Tea & Water"   headerStyle={cellStyle}
          bodyStyle={cellStyle}/>
          <CustomColumn
            field="longTravel"
            header="Airfare, Bus, Train, Taxi Rental"
            headerStyle={cellStyle}
            bodyStyle={cellStyle}
          />
          <CustomColumn field="shortTravel" header="Auto, Cab"  headerStyle={cellStyle}
          bodyStyle={cellStyle} />
          <CustomColumn field="tollTax" header="Parking, Toll, Fuel"  headerStyle={cellStyle}
          bodyStyle={cellStyle}/>
          <CustomColumn field="incidentals" header="Incidentals"  headerStyle={cellStyle}
          bodyStyle={cellStyle}/>
          <CustomColumn field="other" header="Other Business Expenses"  headerStyle={cellStyle}
          bodyStyle={cellStyle}/>
          <CustomColumn field="total" header="Total"  headerStyle={cellStyle}
          bodyStyle={cellStyle}/>
          <CustomColumn field="remarks" header="Remarks"  headerStyle={cellStyle}
          bodyStyle={cellStyle}/>
        </DataTable>
      </Dialog>
    </div>
  );
};

export default MyTourClaims;
