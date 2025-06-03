import React, { useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
//Call Api
import {
  getMyFormParticularRequisitionId,
  getTravelsByStatus,
  updateTravelRequisition,
} from "./TravelDeskAPI";
import { getUserData } from "../Login/Encrypt";
import { Dialog } from "primereact/dialog";
import { useState } from "react";
import RequisitionFormView from "./RequisitionFormView";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";
import { Chip, IconButton } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import VisibilityIcon from "@mui/icons-material/Visibility";
import dummyData from "./DummyDataForOpenTravelsTable";
import { Toast } from "primereact/toast";
import { TabMenu } from "primereact/tabmenu";
import { Skeleton } from "primereact/skeleton";

const TravelDeskBooking = () => {
  const toast = useRef(null);
  const [approvedAndSettledTravelData, setApprovedAndSettledTravelData] =
    useState([]);
  const [completedTravelData, setCompletedTravelData] = useState([]);
  //Dialog visible
  const [visible, setVisible] = useState(false);
  const [rowData, setRowData] = useState({});
  const [editRowId, setEditRowId] = useState(null);
  const [newAdvanceAmount, setNewAdvanceAmount] = useState(0.0);
  const [
    approvedAndSettledGlobalFilterValue,
    setApprovedAndSettledGlobalFilterValue,
  ] = useState("");
  const [approvedAndSettledFilters, setApprovedAndSettledFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    date: { value: null, matchMode: FilterMatchMode.CONTAINS },
    userName: { value: null, matchMode: FilterMatchMode.CONTAINS },
    empCode: { value: null, matchMode: FilterMatchMode.CONTAINS },
    projectName: { value: null, matchMode: FilterMatchMode.CONTAINS },
    unsettledAmount: { value: null, matchMode: FilterMatchMode.CONTAINS },
    advanceRequested: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const [completedGlobalFilterValue, setCompletedGlobalFilterValue] =
    useState("");
  const [completedFilters, setCompletedFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    date: { value: null, matchMode: FilterMatchMode.CONTAINS },
    userName: { value: null, matchMode: FilterMatchMode.CONTAINS },
    empCode: { value: null, matchMode: FilterMatchMode.CONTAINS },
    projectName: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const [completedChecked, setCompletedChecked] = useState(0);
  const [isApprovedAndSettledLoading, setIsApprovedAndSettledLoading] =
    useState(false);
  const [isCompletedLoading, setIsCompletedLoading] = useState(false);

  const [completedActiveTabIndex, setCompletedActiveTabIndex] = useState(0); // 0: Settled, 1: Approved
  const { token, userDetails } = getUserData();
  const dummyDataJson = dummyData;
  console.log("dummyDataJson ==>> ", dummyDataJson);
  const items = Array.from({ length: 5 }, (v, i) => i);

  function mergeTravelData(mergedData, dummydataJson) {
    const dataMap = new Map();

    // Create a lookup map for dummydata
    dummydataJson.forEach((entry) => {
      dataMap.set(entry.user_id.toLowerCase(), {
        unsettledAmount: parseFloat(entry.unsettledAmount),
        bit: entry.bit,
      });
    });

    // Merge dummydata into dummyobj
    const merged = mergedData.map((entry) => {
      const match = dataMap.get(entry.user_id.toLowerCase());
      return {
        ...entry,
        unsettledAmount: match ? match.unsettledAmount : 0.0,
        bit: match ? match.bit : 0,
      };
    });

    return merged;
  }

  useEffect(() => {
    const fetchApprovedAndSettledTravelData = async () => {
      setIsApprovedAndSettledLoading(true); // Start loading
      try {
        let approvedAndSettledMergedData = null;
        approvedAndSettledMergedData = await getTravelsByStatus(
          token,
          "ManagerReviewed"
        );
        const cleanedData = approvedAndSettledMergedData.data.map((item) => {
          const { unsettledAmount, ...rest } = item;
          console.log("unsettledAmount ::: ", unsettledAmount);
          return rest;
        });
        const finalData = mergeTravelData(cleanedData, dummyDataJson);
        setApprovedAndSettledTravelData(finalData);
      } catch (error) {
        console.error("Error fetching travel data:", error);
      } finally {
        setIsApprovedAndSettledLoading(false); // Stop loading
      }
    };

    fetchApprovedAndSettledTravelData();
  }, [dummyDataJson]);

  useEffect(() => {
    const fetchCompletedTravelData = async () => {
      setIsCompletedLoading(true);
      try {
        let completedMergedData = null;
        if (completedChecked === 0) {
          completedMergedData = await getTravelsByStatus(
            token,
            "CompleteRequested"
          );
        } else if (completedChecked === 1) {
          completedMergedData = await getTravelsByStatus(token, "Completed");
        } else if (completedChecked === 2) {
          completedMergedData = await getTravelsByStatus(token, "Approved");
        } else if (completedChecked === 3) {
          completedMergedData = await getTravelsByStatus(token, "Pending");
        } else if (completedChecked === 4) {
          completedMergedData = await getTravelsByStatus(token, "Rejected");
        } else {
          completedMergedData = await getTravelsByStatus(token, "Settled");
        }

        setCompletedTravelData(completedMergedData.data); // Save data to state
      } catch (error) {
        console.error("Error fetching travel data:", error);
      } finally {
        setIsCompletedLoading(false); // Stop loading
      }
    };

    fetchCompletedTravelData();
  }, [completedChecked]);

  const updateTravelRequisitionStatus = async (rowData, statusName) => {
    const updateTravelRequisitionStatusResponse = await updateTravelRequisition(
      token,
      rowData,
      rowData.requisionId,
      statusName
    );
    toast.current.show({
      severity: "success",
      summary: "Success",
      detail: "You have successfully applied for approval.",
    });
    console.log(
      "updateTravelRequisitionStatusResponse :=:=>> ",
      updateTravelRequisitionStatusResponse
    );
  };

  const handelShowRequisitionForm = async (requisionId) => {
    console.log("clickrequisionId", requisionId);
    //Dialog visible set
    setVisible(true);
    const response = await getMyFormParticularRequisitionId(token, requisionId);
    setRowData(response?.data);
  };

  const advanceColumnBody = (row) => {
    if (editRowId === row.requisionId) {
      return (
        <InputText
          size="small"
          value={newAdvanceAmount}
          onChange={(e) => setNewAdvanceAmount(e.target.value)}
        />
      );
    }
    return row.advance;
  };

  const approvedAndSettledOnGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _approvedAndSettledFilters = { ...approvedAndSettledFilters };

    _approvedAndSettledFilters["global"].value = value;

    setApprovedAndSettledFilters(_approvedAndSettledFilters);
    setApprovedAndSettledGlobalFilterValue(value);
  };

  const completedOnGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _completedFilters = { ...completedFilters };

    _completedFilters["global"].value = value;

    setCompletedFilters(_completedFilters);
    setCompletedGlobalFilterValue(value);
  };
  const renderHeaderForApprovedAndSettledTravelData = () => {
    const tabItems = [{ label: "ManagerReviewed Travels Table" }];
    return (
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <TabMenu model={tabItems} activeIndex={0} />
        </div>
        <InputText
          value={approvedAndSettledGlobalFilterValue}
          onChange={approvedAndSettledOnGlobalFilterChange}
          placeholder="Keyword Search"
          className="w-full sm:w-auto"
        />
      </div>
    );
  };

  const renderHeaderForCompletedTravelData = () => {
    const tabItems = [
      { label: "Approved Travels Table" },
      { label: "Completed Travels Table" },
      { label: "CompleteRequested Travels Table" },
      { label: "Pending Travels Table" },
      { label: "Rejected Travels Table" },
      { label: "Settled Travels Table" },
    ];
    return (
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <TabMenu
            model={tabItems}
            activeIndex={completedActiveTabIndex}
            onTabChange={(e) => {
              setCompletedActiveTabIndex(e.index), setCompletedChecked(e.index);
            }}
          />
        </div>
        <InputText
          value={completedGlobalFilterValue}
          onChange={completedOnGlobalFilterChange}
          placeholder="Keyword Search"
          className="w-full sm:w-auto"
        />
      </div>
    );
  };

  const approvedAndSettledTravelDataHeader =
    renderHeaderForApprovedAndSettledTravelData();

  const completedTravelDataHeader = renderHeaderForCompletedTravelData();

  return (
    <>
      <div className="px-4 mx-auto max-w-[85rem] lg:px-12">
        <Toast ref={toast} />
        {isApprovedAndSettledLoading ? (
          <DataTable
            value={items}
            paginator
            loading={isApprovedAndSettledLoading}
            showGridlines
            rows={5}
            rowsPerPageOptions={
              items.length > 50
                ? [5, 10, 25, 50, items.length]
                : items.length > 25 && items.length < 50
                ? [5, 10, 25, items.length]
                : items.length > 10 && items.length < 25
                ? [5, 10, items.length]
                : items.length > 5 && items.length < 10
                ? [5, items.length]
                : [5]
            }
            paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
            currentPageReportTemplate="{first} to {last} of {totalRecords}"
            header={approvedAndSettledTravelDataHeader}
            emptyMessage="No data found."
          >
            <Column
              field="date"
              header="Date"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
              sortable
              body={<Skeleton />}
            />
            <Column
              field="userName"
              header="Name"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
              sortable
              body={<Skeleton />}
            />
            <Column
              field="empCode"
              header="Employee Code"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
              sortable
              body={<Skeleton />}
            />
            <Column
              field="projectName"
              header="Project Name"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
              sortable
              body={<Skeleton />}
            />
            <Column
              field="unsettledAmount"
              header="Total Unsettled Amount"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
              sortable
              body={<Skeleton />}
            />
            <Column
              field="advanceRequested"
              header="Advance Requested"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
              sortable
              body={<Skeleton />}
            />
            <Column
              body={<Skeleton />}
              header="Advance Given"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
            />
            <Column
              body={<Skeleton />}
              header="Status"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
            />
            <Column
              body={<Skeleton />}
              header="View"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
            />
            <Column
              body={<Skeleton />}
              header="Travel Complete"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
            />
          </DataTable>
        ) : (
          <DataTable
            value={approvedAndSettledTravelData}
            paginator
            size="small"
            showGridlines
            rows={5}
            rowsPerPageOptions={
              approvedAndSettledTravelData.length > 50
                ? [5, 10, 25, 50, approvedAndSettledTravelData.length]
                : approvedAndSettledTravelData.length > 25 &&
                  approvedAndSettledTravelData.length < 50
                ? [5, 10, 25, approvedAndSettledTravelData.length]
                : approvedAndSettledTravelData.length > 10 &&
                  approvedAndSettledTravelData.length < 25
                ? [5, 10, approvedAndSettledTravelData.length]
                : approvedAndSettledTravelData.length > 5 &&
                  approvedAndSettledTravelData.length < 10
                ? [5, approvedAndSettledTravelData.length]
                : [5]
            }
            paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
            currentPageReportTemplate="{first} to {last} of {totalRecords}"
            dataKey="id"
            filters={approvedAndSettledFilters}
            globalFilterFields={[
              "date",
              "userName",
              "empCode",
              "projectName",
              "unsettledAmount",
              "advanceRequested",
            ]}
            header={approvedAndSettledTravelDataHeader}
            emptyMessage="No data found."
            removableSort
            sortMode="multiple"
          >
            <Column
              field="date"
              header="Date"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
              sortable
            />
            <Column
              field="userName"
              header="Name"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
              sortable
            />
            <Column
              field="empCode"
              header="Employee Code"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
              sortable
            />
            <Column
              field="projectName"
              header="Project Name"
              headerStyle={{ textAlign: "center" }}
              // headerClassName="center-header"
              style={{ textAlign: "center" }}
              sortable
            />
            <Column
              field="unsettledAmount"
              header="Total Unsettled Amount"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
              sortable
            />
            <Column
              field="advanceRequested"
              header="Advance Requested"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
              sortable
            />
            <Column
              body={advanceColumnBody}
              header="Advance Given"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
            />
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
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
            />
            <Column
              body={(rowData) => {
                return (
                  <IconButton
                    aria-label="View"
                    onClick={() => {
                      handelShowRequisitionForm(rowData.requisionId);
                    }}
                  >
                    <VisibilityIcon />
                  </IconButton>
                );
              }}
              header="View"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
            />
            <Column
              body={(rowData) => {
                return (
                  <IconButton
                    aria-label="Complete"
                    onClick={() => {
                      updateTravelRequisitionStatus(
                        rowData,
                        "CompleteRequested"
                      );
                    }}
                  >
                    <CheckIcon />
                  </IconButton>
                );
              }}
              header="Travel Complete"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
            />
          </DataTable>
        )}
        {isCompletedLoading ? (
          <DataTable
            value={items}
            paginator
            showGridlines
            rows={5}
            rowsPerPageOptions={
              items.length > 50
                ? [5, 10, 25, 50, items.length]
                : items.length > 25 && items.length < 50
                ? [5, 10, 25, items.length]
                : items.length > 10 && items.length < 25
                ? [5, 10, items.length]
                : items.length > 5 && items.length < 10
                ? [5, items.length]
                : [5]
            }
            paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
            currentPageReportTemplate="{first} to {last} of {totalRecords}"
            header={completedTravelDataHeader}
            emptyMessage="No data found."
          >
            <Column
              field="date"
              header="Date"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
              sortable
              body={<Skeleton />}
            />
            <Column
              field="userName"
              header="Name"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
              sortable
              body={<Skeleton />}
            />
            <Column
              field="empCode"
              header="Employee Code"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
              sortable
              body={<Skeleton />}
            />
            <Column
              field="projectName"
              header="Project Name"
              headerStyle={{ textAlign: "center" }}
              // headerClassName="center-header"
              style={{ textAlign: "center" }}
              sortable
              body={<Skeleton />}
            />
            <Column
              field="unsettledAmount"
              header="Total Unsettled Amount"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
              sortable
              body={<Skeleton />}
            />
            <Column
              field="advanceRequested"
              header="Advance Requested"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
              sortable
              body={<Skeleton />}
            />
            <Column
              field="advance"
              header="Advance Given"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
              sortable
              body={<Skeleton />}
            />
            <Column
              body={<Skeleton />}
              header="Status"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
            />
            <Column
              body={<Skeleton />}
              header="View"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
            />
          </DataTable>
        ) : (
          <DataTable
            value={completedTravelData}
            paginator
            size="small"
            showGridlines
            rows={5}
            rowsPerPageOptions={
              completedTravelData.length > 50
                ? [5, 10, 25, 50, completedTravelData.length]
                : completedTravelData.length > 25 &&
                  completedTravelData.length < 50
                ? [5, 10, 25, completedTravelData.length]
                : completedTravelData.length > 10 &&
                  completedTravelData.length < 25
                ? [5, 10, completedTravelData.length]
                : completedTravelData.length > 5 &&
                  completedTravelData.length < 10
                ? [5, completedTravelData.length]
                : [5]
            }
            paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
            currentPageReportTemplate="{first} to {last} of {totalRecords}"
            dataKey="id"
            filters={completedFilters}
            globalFilterFields={["date", "userName", "empCode", "projectName"]}
            header={completedTravelDataHeader}
            emptyMessage="No data found."
            removableSort
            sortMode="multiple"
          >
            <Column
              field="date"
              header="Date"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
              sortable
            />
            <Column
              field="userName"
              header="Name"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
              sortable
            />
            <Column
              field="empCode"
              header="Employee Code"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
              sortable
            />
            <Column
              field="projectName"
              header="Project Name"
              headerStyle={{ textAlign: "center" }}
              // headerClassName="center-header"
              style={{ textAlign: "center" }}
              sortable
            />
            <Column
              field="unsettledAmount"
              header="Total Unsettled Amount"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
              sortable
            />
            <Column
              field="advanceRequested"
              header="Advance Requested"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
              sortable
            />
            <Column
              field="advance"
              header="Advance Given"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
              sortable
            />
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
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
            />
            <Column
              body={(rowData) => {
                return (
                  <IconButton
                    aria-label="View"
                    onClick={() => {
                      handelShowRequisitionForm(rowData.requisionId);
                    }}
                  >
                    <VisibilityIcon />
                  </IconButton>
                );
              }}
              header="View"
              headerStyle={{ textAlign: "center" }}
              style={{ textAlign: "center" }}
            />
          </DataTable>
        )}

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
          <RequisitionFormView
            rowData={rowData}
            // handleApproveTravel={handleApproveTravel}
            // handleRejectTravel={handleRejectTravel}
            // formData={rowData}
            // setFormData={setRowData}
          />
        </Dialog>
      </div>
    </>
  );
};

export default TravelDeskBooking;
