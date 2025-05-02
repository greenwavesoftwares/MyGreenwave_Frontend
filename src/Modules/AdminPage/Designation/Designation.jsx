import { FilterMatchMode } from "primereact/api";
import React, { useEffect, useRef, useState } from "react";
import { addDesignation } from "./DesignationFunction";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";
import DialogComponent from "../../../components/Dialog/DialogComponent";
import { Grid } from "@mui/material";
import Toast from "../../../components/Toast/Toast";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import "./Designation.css";

const Designation = ({ onHide, dialogVisible = false, designationList }) => {
  const toastRef = useRef(null);
  const tableStructure = () => ({
    table: [],
    filterText: "",
    filterStructure: {
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    },
  });
  const [newDesignation, setNewDesignation] = useState("");
  const [designationValidation, setDesignationValidation] = useState(true);
  const [designationTable, setDesignationTable] = useState(tableStructure);

  useEffect(() => {
    if (dialogVisible)
      setDesignationTable((prev) => ({
        ...prev,
        table: designationList.map((item) => ({
          designation: item,
        })),
      }));
    else {
      setDesignationTable(tableStructure);
      setNewDesignation("");
      setDesignationValidation(true);
    }
  }, [dialogVisible, designationList]);

  const designationHeader = (
    <div className="flex justify-content-end">
      <IconField iconPosition="left">
        <InputIcon className="pi pi-search" />
        <InputText
          value={designationTable.filterText}
          onChange={(e) => {
            const value = e.target.value;
            let _filters = designationTable.filterStructure;
            _filters["global"].value = value;
            setDesignationTable((p) => ({
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
  return (
    <>
      <DialogComponent
        header="Add Designation"
        visible={dialogVisible}
        onHide={onHide}
        className="designationDialog"
      >
        <Grid container>
          <Grid size={6} className="designationCell">
            <span className="font-bold">Designation</span>
          </Grid>
          <Grid size={4.5} className="designationCell">
            <InputText
              invalid={!designationValidation}
              className="w-full mr-1"
              value={newDesignation}
              onChange={(e) => setNewDesignation(e.target.value)}
            />
          </Grid>
          <Grid size={1.5} className="designationCell">
            <Button
              label="Add"
              icon="pi pi-plus"
              severity="info"
              aria-label="Bookmark"
              onClick={async () =>
                await addDesignation(
                  newDesignation,
                  toastRef,
                  designationList,
                  setDesignationTable,
                  setDesignationValidation
                )
              }
            />
          </Grid>
          <Grid size={12}>
            <DataTable
              value={designationTable.table}
              filters={designationTable.filterStructure}
              globalFilterFields={["designation"]}
              header={designationHeader}
            >
              <Column field="designation" header="Designation"></Column>
            </DataTable>
          </Grid>
        </Grid>
      </DialogComponent>
      <Toast ref={toastRef} />
    </>
  );
};

export default Designation;
