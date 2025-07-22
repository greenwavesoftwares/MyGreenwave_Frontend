import { FilterMatchMode } from "primereact/api";
import React, { useEffect, useRef, useState } from "react";
import { addDepartment, editDepartment } from "./DepartmentFunction";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";
import DialogComponent from "../../../components/Dialog/DialogComponent";
import { Grid } from "@mui/material";
import Toast from "../../../components/Toast/Toast";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import "./Department.css";
import { Dropdown } from "primereact/dropdown";

const Department = ({
  onHide,
  dialogVisible = false,
  departmentList,
  managerList,
}) => {
  const toastRef = useRef(null);
  const tableStructure = () => ({
    table: [],
    filterText: "",
    filterStructure: {
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    },
  });
  const departmentStructure = {
    deptId: "",
    deptManager: "",
    deptName: "",
  };
  const departmentValidationStructure = {
    deptId: true,
    deptManager: true,
    deptName: true,
  };
  const [departmentData, setDepartmentData] = useState(departmentStructure);
  const [departmentValidation, setDepartmentValidation] = useState(
    departmentValidationStructure
  );
  const [departmentTable, setDepartmentTable] = useState(tableStructure);
  const departmentHeader = (
    <div className="flex justify-content-between align-items-center">
      <span>User Department</span>
      <IconField iconPosition="left">
        {/* <InputIcon className="pi pi-search" /> */}
        <InputText
          value={departmentTable.filterText}
          className="inputFieldStyle"
          onChange={(e) => {
            const value = e.target.value;
            let _filters = departmentTable.filterStructure;
            _filters["global"].value = value;
            setDepartmentTable((p) => ({
              ...p,
              filterStructure: _filters,
              filterText: value,
            }));
          }}
          placeholder="Search"
        />
      </IconField>
    </div>
  );

  useEffect(() => {
    if (dialogVisible)
      setDepartmentTable((prev) => ({
        ...prev,
        table: departmentList,
      }));
    else {
      setDepartmentTable(tableStructure);
      setDepartmentData(departmentStructure);
      setDepartmentValidation(departmentValidationStructure);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogVisible, departmentList]);

  return (
    <>
      <DialogComponent
        header="Add User Department"
        visible={dialogVisible}
        onHide={onHide}
        className="departmentDialog"
      >
        <Grid container>
          <Grid size={6} className="departmentCell">
            <span className="font-bold" style={{fontSize:"0.85rem"}}>Department ID</span>
          </Grid>
          <Grid size={6} className="departmentCell">
            <InputText
              className="w-full inputFieldStyle mr-2"
              size={"small"}
              invalid={!departmentValidation.deptId}
              value={departmentData.deptId}
              onChange={(e) =>
                setDepartmentData((prev) => ({
                  ...prev,
                  deptId: e.target.value,
                }))
              }
            />
          </Grid>
          <Grid size={6} className="departmentCell">
            <span className="font-bold" style={{fontSize:"0.85rem"}}>Department Name</span>
          </Grid>
          <Grid size={6} className="departmentCell">
            <InputText
              invalid={!departmentValidation.deptName}
              className="w-full inputFieldStyle mr-2"
              value={departmentData.deptName}
              onChange={(e) =>
                setDepartmentData((prev) => ({
                  ...prev,
                  deptName: e.target.value,
                }))
              }
            />
          </Grid>
          <Grid size={6} className="departmentCell">
            <span className="font-bold" style={{fontSize:"0.85rem"}}>Manager</span>
          </Grid>
          <Grid size={6} className="departmentCell">
            <Dropdown
              value={departmentData.deptManager}
              invalid={!departmentValidation.deptManager}
              filter
              onChange={async (e) =>
                setDepartmentData((prev) => ({
                  ...prev,
                  deptManager: e.value,
                }))
              }
              options={managerList}
              optionLabel="userName"
              optionValue="userId"
              placeholder="Select Manager"
              className="w-full mr-1 dropDownStyle"
            />
          </Grid>
            <Grid size={12} className="py-2 px-2">
            <Button
              label="Add Department"
              size="small"
              icon="pi pi-plus"
              severity="info"
              aria-label="Bookmark"
              onClick={async () =>
                await addDepartment(
                  departmentData,
                  setDepartmentValidation,
                  toastRef,
                  departmentList,
                  setDepartmentTable,
                  departmentValidationStructure
                )
              }
            />
          </Grid>
          <Grid size={12}>
            <DataTable
              value={departmentTable.table}
              filters={departmentTable.filterStructure}
              globalFilterFields={["deptId", "deptName", "deptManager"]}
              header={departmentHeader}
              paginator
              rows={5}
              rowsPerPageOptions={[5, 10, 25, 50]}
              editMode="row"
              onRowEditComplete={async (e) =>
                await editDepartment(
                  e,
                  departmentTable,
                  setDepartmentTable,
                  toastRef,
                  departmentList
                )
              }
              className="dataTableHeader dataTableBody dataTableBodyPadding dataTablePaginator defaultBorder dropDownStyle"
              size="small"
            >
              <Column header="Edit" rowEditor></Column>
              <Column field="deptId" header="Id"></Column>
              <Column
                field="deptName"
                header="Name"
                editor={(options) => (
                  <InputText
                    className="w-full inputFieldStyle"
                    type="text"
                    value={options.value}
                    onChange={(e) => options.editorCallback(e.target.value)}
                  />
                )}
              ></Column>
              <Column
                field="deptManager"
                header="Manager"
                body={(rowData) =>
                  managerList.filter(
                    (m) =>
                      m.userId.toLowerCase() ===
                      rowData.deptManager.toLowerCase()
                  )[0]?.userName
                }
                editor={(options) => (
                  <Dropdown
                    value={options.value}
                    filter
                    onChange={(e) => options.editorCallback(e.value)}
                    options={managerList}
                    optionLabel="userName"
                    optionValue="userId"
                    placeholder="Select Manager"
                    className="w-full"
                  />
                )}
              ></Column>
            </DataTable>
          </Grid>
        </Grid>
      </DialogComponent>
      <Toast ref={toastRef} />
    </>
  );
};

export default Department;
