import { useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
//Call Api
import {
  getMyFormParticularRequisitionId,
  getTravelsByStatus,
} from "./TravelDeskAPI";
import { getUserData } from "../Login/Encrypt";
import { useState } from "react";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";
import { Chip, IconButton } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";

const CompleteRequestedTable = () => {
  const [completedTravelData, setCompletedTravelData] = useState([]);

  const [completedGlobalFilterValue, setCompletedGlobalFilterValue] =
    useState("");
  const [completedFilters, setCompletedFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    date: { value: null, matchMode: FilterMatchMode.CONTAINS },
    userName: { value: null, matchMode: FilterMatchMode.CONTAINS },
    empCode: { value: null, matchMode: FilterMatchMode.CONTAINS },
    projectName: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  useEffect(() => {
    const fetchCompletedTravelData = async () => {
      try {
        const { token } = getUserData();
        const completedMergedData = await getTravelsByStatus(token, "CompleteRequested");
        setCompletedTravelData(completedMergedData.data); // Save data to state
      } catch (error) {
        console.error("Error fetching travel data:", error);
      }
    };

    fetchCompletedTravelData();
  }, []);

  const handelShowRequisitionForm = async (requisionId) => {
    console.log("clickrequisionId", requisionId);
    //Dialog visible set
    setVisible(true);
    const { token } = getUserData();
    const response = await getMyFormParticularRequisitionId(token, requisionId);
    setRowData(response?.data);
  };

  const completedOnGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _completedFilters = { ...completedFilters };

    _completedFilters["global"].value = value;

    setCompletedFilters(_completedFilters);
    setCompletedGlobalFilterValue(value);
  };

  const renderHeaderForCompletedTravelData = () => {
    const tabItems = [
      { label: "Completed Travels Table" },
    ];
    return (
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
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

  const completedTravelDataHeader = renderHeaderForCompletedTravelData();

  return (
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
  )
}

export default CompleteRequestedTable