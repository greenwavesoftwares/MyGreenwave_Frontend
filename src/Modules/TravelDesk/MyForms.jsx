import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Chip } from "@mui/material";
import { FilterMatchMode } from "primereact/api";
import { InputText } from "primereact/inputtext";
import { Tooltip } from 'primereact/tooltip';
import {Tooltip as Muitooltip} from "@mui/material";
//Call Api
import {
  getMyFormParticularRequisitionId,
  getExpandableData,
  getMyFormTravelData_New,
} from "./TravelDeskAPI";
// import {
//   getMyFormTravelData_New,
//   getMyFormTravelData,
//   getTravelDropDown,
//   createRequisition,
// } from "../TravelDesk/TravelDeskAPI";
import { getUserData } from "../Login/Encrypt";
import { Dialog } from "primereact/dialog";
//import CheckIcon from "@mui/icons-material/Check";
//import { useState } from "react";
import { Button } from "primereact/button";
import RequisitionFormView from "./RequisitionFormView";

const MyForm = () => {
  const [myFormTableData, setMyFormTableData] = useState([]);
  const [expandedRows, setExpandedRows] = useState(null);
  console.log("table data", myFormTableData);
  //Dialog visible
  const [visible, setVisible] = useState(false);
  //
  const [rowData, setRowData] = useState({});

  const [globalFilterValue, setGlobalFilterValue] =
    useState("");
  const [globalFilterRows, setGlobalFilterRows] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    fromDate: { value: null, matchMode: FilterMatchMode.CONTAINS },
    tentativeToDate: { value: null, matchMode: FilterMatchMode.CONTAINS },
    purpose: { value: null, matchMode: FilterMatchMode.CONTAINS },
    projectName: { value: null, matchMode: FilterMatchMode.CONTAINS },
    city: { value: null, matchMode: FilterMatchMode.CONTAINS },
    localityArea: { value: null, matchMode: FilterMatchMode.CONTAINS },
    typeOfTravel: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  //My Form Api Call

  useEffect(() => {
    const myFormApi = async () => {
      try {
        // const { token } = getUserData();
        //await getMyFormTravelData()
        const response = await getMyFormTravelData_New();
        console.log(1213, response);
        if (!response.status) {
          showErrorMessage("error", "Error", response.message);
        } else {
          setMyFormTableData(response.data);
        }
      } catch (error) {
        console.log(error);
      }
    };

    // fetchDropdownList();
    //MY Form api function call
    myFormApi();
  }, []);

  const handelShowPreviousData = async (requisionId) => {
    console.log("clickrequisionId", requisionId);
    //Dialog visible set
    setVisible(true);
    const { token } = getUserData();
    const response = await getMyFormParticularRequisitionId(token, requisionId);
    setRowData(response?.data);
    console.log("response", response);
  };

  const rowExpansionTemplate = (rowData) => (
    <DataTable
      value={rowData}
      showGridlines
      dataKey="requisionId"
      className="text-xs"
      tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
    >
      {/* <Column
      header="S.No"
      body={(_, { rowIndex }) => rowIndex + 1}
      style={{ width: '3rem' }}
    /> */}

      <Column
        header="S.NO"
       body={(rowData, { rowIndex }) => (
    <Muitooltip title={rowData.requisionId} placement="top">
      <span>{rowIndex + 1}</span>
    </Muitooltip>
  )}
        style={{ width: '3rem' }}
      />
      <Column field="date" header="Application Date"></Column>
      <Column field="advanceRequested" header="Advance Requested"></Column>
      <Column field="advance" header="Advance Given"></Column>
      <Column
        body={(rowData) => {
          return (
            <Chip
              label={rowData.status}
              size="medium"
              color={
                rowData.status.toLowerCase() === "approved" ||
                rowData.status.toLowerCase() === "completed"
                  ? "success"
                  : "warning"
              }
            />
          );
        }}
        header="Status"
      ></Column>
      <Column
        body={(rowData) => {
          return (
            <Button
              variant="contained"
              onClick={(e) => {
                handelShowPreviousData(rowData.requisionId);
              }}
            >
              Show
            </Button>
          );
        }}
        header="View"
      ></Column>
      <Column field="" header="Download ticket"></Column>
    </DataTable>
  );

  const completeTravel = async (rowData) => {
    //  let updatedData={...row,advance: newAdvanceAmount}

    let response = await updateTravelRequisition(
      rowData,
      rowData.travelId,
      "CompleteRequested"
    );

    if (response.status != 201) {
      toast.current?.show({
        severity: "error",
        summary: "error",
        detail: response.data,
      });
    } else {
      let response = await getApprovedAndSettledAndCompleteRequestedData();
      setApprovedAndSettledTravelData(response.data);
      // setEditRowId(null);
      toast.current?.show({
        severity: "success",
        summary: "Success",
        detail: response.message,
      });

      // Optionally reset newAdvanceAmount
    }
  };

  const checkBody = (rowData) => {
    return (
      <Button
        icon="pi pi-check"
        style={rowData.travelCompleteFlag === false ? { color: "#708090" } : {}}
        className="p-button-sm p-button-text p-button-success "
        onClick={() => {
          completeTravel(rowData.expandableData[0], "CompleteRequested");
        }}
        tooltip="Complete Travel"
        disabled={rowData.travelCompleteFlag === false}
      />
      // <span>Hii</span>
    );
  };

  const handlerowexpand = async (data) => {
    console.log("data -> ", data);
    console.log("travelId", Object.keys(data)[0]);
    // return;
    const travelId = Object.keys(data)[0];
    let response = await getExpandableData(travelId);
    setExpandedRows(response.data);
    console.log("response", response);
  };

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

  return (
    <>
      <DataTable
        value={myFormTableData}
        expandedRows={expandedRows}
        onRowToggle={(e) => handlerowexpand(e.data)}
        rowExpansionTemplate={rowExpansionTemplate(expandedRows)}
        showGridlines
        //className="text-xs"
        tableStyle={{ minWidth: "100%", fontSize: "0.7rem" }}
        dataKey="travelId"
        rowClassName={(rowData) => {
          if (rowData[0].travelCompleteFlag) return "bg-red-50";
          //if (!rowData[0].travelCompleteFlag) return "bg-green-50";
        }}
        paginator
        rows={10}
        header={dataTableHeader}
        filters={globalFilterRows}
        globalFilterFields={[
          "fromDate",
          "tentativeToDate",
          "purpose",
          "projectName",
          "city",
          "localityArea",
          "typeOfTravel",
        ]}
        className="dataTableHeader dataTableBody dataTableBodyPadding dataTablePaginator"
      >
        <Column expander style={{ width: "3rem" }} />
        <Column field="fromDate" header="From Date"></Column>
        <Column field="tentativeToDate" header="Tentative To Date"></Column>
        <Column field="purpose" header="Description"></Column>
        <Column  header="Project Name"
         body={(rowData) => (
    <Muitooltip title={rowData.travelId} placement="top">
      <span>{rowData.projectName}</span>
    </Muitooltip>
  )}></Column>
        <Column field="city" header="City"></Column>
        <Column field="localityArea" header="Locality/Area"></Column>
        <Column field="typeOfTravel" header="Type Of Travel"></Column>
        <Column body={checkBody} header="Complete Travel"></Column>

        {/* <Column
  body={(rowData) => {
    return (
      <Button
        icon="pi pi-check"
        label="Apply"
        className="p-button-sm p-button-success p-button-text"
        onClick={() => {
          completeTravel(rowData.expandableData[0], "CompleteRequested");
        }}
        tooltip="Apply for Approval"
       // disabled={rowData.requestCompletedFlag === false}
      />
    );
  }}
  header="Travel Complete"
  headerStyle={{ textAlign: "center" }}
  style={{ textAlign: "center" }}
/> */}
      </DataTable>
      <Dialog
        header="Requisition Form View"
        visible={visible}
        style={{ width: "70rem" }}
        onHide={() => {
          if (!visible) return;
          setVisible(false);
        }}
      >
        <h2>Requisition Form View</h2>
        <RequisitionFormView rowData={rowData} />
      </Dialog>

      {/* <Dialog
        header="Requisition Form View"
        visible={visible}
        style={{ width: "70rem" }}
        onHide={() => {
          if (!visible) return;
          setVisible(false);
        }}
      >
        <Grid container spacing={2}>
          <Grid size={6}>Purpose : {rowData.purpose}</Grid>
          <Grid size={6}>Project Name : {rowData.projectName}</Grid>
          <Grid size={6}>City : {rowData.city}</Grid>
          <Grid size={6}>Locality/Area : {rowData.localityArea}</Grid>
          <Grid size={4}>Type of Travel : {rowData.typeOfTravel}</Grid>
          <Grid size={4}>Advance Requested : {rowData.advanceRequested}</Grid>
          <Grid size={4}>Advance Given : {rowData.advance}</Grid>
          <Grid size={12}>
            <DataTable
              header="Mode of Transport"
              value={rowData.transportModes}
            >
              <Column field="mode" header="Mode"></Column>
              <Column field="fromDate" header="From Date"></Column>
              <Column field="comment" header="Comment"></Column>
              <Column field="manager_remark" header="Manager Remark"></Column>
            </DataTable>
          </Grid>

          <Grid size={12}>
            <DataTable
              header="Reservation of Accommodation"
              value={rowData.accommodations}
            >
              <Column field="type" header="Type"></Column>
              <Column field="numberOfRooms" header="Number Of Rooms"></Column>
              <Column field="numberOfNights" header="Number Of Nights"></Column>
              <Column field="checkIn" header="Check In"></Column>
              <Column field="checkOut" header="Check Out"></Column>
              <Column field="comment" header="Comment"></Column>
            </DataTable>
          </Grid>

          <Grid size={12}>Manager Name : {rowData.manager_id}</Grid>
          <Grid size={12}>Manager Comment : {rowData.manager_suggestion}</Grid>
        </Grid>
      </Dialog> */}
    </>
  );
};
export default MyForm;
