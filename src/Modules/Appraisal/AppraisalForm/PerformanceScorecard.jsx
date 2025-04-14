import { Button } from "primereact/button";
import { Button as MuiButton } from "@mui/material";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { FloatLabel } from "primereact/floatlabel";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const PerformanceScorecardDateTable = ({
  PerformanceScorecardData,
  appraiserPreviousSaveFormData,
}) => {
  //Dialog Visible
  const [visible, setVisible] = useState(false);
  //Set Level Full Fulfillment Data Dropdown
  const [fulFillment, setFulFillment] = useState(null);
  //each dialog row data
  const [selectedRowData, setSelectedRowData] = useState([]);
  //For Edit Section
  const [rowIndex, setRowIndex] = useState(null);
  //React Hooks Form
  const { register, handleSubmit, reset, setValue } = useForm();
  const handlePerformerScorecardSubmit = (data, event) => {
    event.preventDefault();
    //console.log("data :>> ", data);

    if (rowIndex !== null) {
      const updated = [...selectedRowData];
      // console.log("updated",updated[rowIndex]);
      updated[rowIndex] = data;
      setSelectedRowData(updated);
      setRowIndex(null);
      reset();
    } else {
      setSelectedRowData([...selectedRowData, data]);
    }
    ///PerformanceScorecardData(...selectedRowData);
    //For reset downdown
    setFulFillment(null);
    //reset hole form
    reset();
    setVisible(false);
  };

//
useEffect(() => {
  PerformanceScorecardData(selectedRowData);
}, [selectedRowData]);

  //Set Api Data : Performance Scorecard already saved data
  useEffect(() => {
    if (appraiserPreviousSaveFormData?.length > 0) {
      setSelectedRowData(appraiserPreviousSaveFormData);
    }
  }, [appraiserPreviousSaveFormData]);

  console.log("selectedRowData", ...selectedRowData);
  console.log("appraiserPreviousSaveFormData", appraiserPreviousSaveFormData);

  const LevelFullfillmentData = [
    { Level: 1 },
    { Level: 2 },
    { Level: 3 },
    { Level: 4 },
    { Level: 5 },
  ];

  //Delete Row Data
  const handleDeleteRow = (e) => {
    //console.log("deleteRowData",e);
    const updateTableData = selectedRowData.filter((ele) => ele !== e);
    //console.log("updateTableData",updateTableData);
    setSelectedRowData(updateTableData);
  };

  //Edit Section
  const handleEditRow = (e, id) => {
    setRowIndex(id.rowIndex);
    setVisible(true);
    reset(e);
    //console.log("id",id);
  };

  return (
    <>
      {/* Popup */}
      
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "0 0.2rem 0.35rem 0",
        }}
      >
        <MuiButton
          size="small"
          variant="contained"
          color="success"
          sx={{ boxShadow: "none" }}
          onClick={() => setVisible(true)}
        >
          Add New Row
        </MuiButton>
      </div>
      <Dialog
        header="Performance Scorecard"
        className="dialogHeader dialogContent"
        visible={visible}
        style={{ width: "20rem" }}
        onHide={() => setVisible(false)}
      >
        <form onSubmit={handleSubmit(handlePerformerScorecardSubmit)}>
          <div
            style={{
              display: "grid",
              justifyItems: "center",
              rowGap: "0.2rem",
            }}
          >
            <FloatLabel className="mt-1">
              <InputText
                id="my_last_year_KRA"
                // required
                type="test"
                placeholder=" My Last Year's KRA"
                className="p-inputtext-sm"
                {...register("my_last_year_KRA")}
              />
              <label htmlFor=" My Last Year's KRA">my_last_year_KRA</label>
            </FloatLabel>
            <FloatLabel>
              <Dropdown
                value={fulFillment}
                //required
                onChange={(e) => setFulFillment(e.value)}
                options={LevelFullfillmentData}
                optionLabel="Level"
                {...register("level_of_fullfillment")}
                placeholder="fullfillment"
                //className="w-full"
              />
              <label htmlFor="remarks">Remarks</label>
            </FloatLabel>
            <FloatLabel>
              <InputText
                id="remarks"
                //required
                type="test"
                className="p-inputtext-sm"
                {...register("remarks")}
              />
              <label htmlFor="remarks">Remarks</label>
            </FloatLabel>
            <FloatLabel>
              <InputTextarea
                id="reviewers_comment"
                //required
                type="test"
                className="p-inputtext-sm"
                {...register("reviewers_comment")}
              />
              <label htmlFor="reviewers_comment">reviewers_comment</label>
            </FloatLabel>
            <FloatLabel>
              <InputTextarea
                id="appraisers_comments"
                required
                type="test"
                className="p-inputtext-sm"
                {...register("appraisers_comments")}
              />
              <label htmlFor="remarks">appraisers_comments</label>
            </FloatLabel>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "0 0.2rem 0.35rem 0",
              }}
            >
              <MuiButton variant="contained" type="submit" size="small">
                Submit
              </MuiButton>
            </div>
          </div>
        </form>
      </Dialog>

      <DataTable
        size="small"
        value={selectedRowData}
        stripedRows
        showGridlines
        className="dataTableHeader dataTableBody dataTableBodyPadding"
      >
        <Column
          field="my_last_year_KRA"
          header="Through the Rear View Mirror - My Last Year's KRA"
        ></Column>
        <Column
          field="level_of_fullfillment"
          header="Level of fullfillment (Rate yourself on scale of 1 to 5. 1 being the lowest and 5 highest)"
        ></Column>
        <Column field="remarks" header="Remarks"></Column>
        <Column field="reviewers_comment" header="Reviewer's Comment"></Column>
        <Column
          field="appraisers_comments"
          header="Appraiser's Comments"
        ></Column>
        <Column
          header="Edit"
          body={(rowData, id) => {
            return (
              <Button
                icon="pi pi-pencil"
                size="small"
                text
                onClick={() => {
                  handleEditRow(rowData, id);
                }}
              />
            );
          }}
        />
        <Column
          header="Delete"
          body={(rowData) => {
            return (
              <Button
                severity="danger"
                size="small"
                icon="pi pi-trash"
                rounded
                text
                onClick={() => {
                  handleDeleteRow(rowData);
                }}
              />
            );
          }}
        />
      </DataTable>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "0.35rem 0.2rem 0.35rem 0",
        }}
      >
        {/* <MuiButton
          variant="contained"
          sx={{ boxShadow: "none" }}
          size="small"
          onClick={() => PerformanceScorecardData(selectedRowData)}
        >
          Submit
        </MuiButton> */}
      </div>
    </>
  );
};

export default PerformanceScorecardDateTable;
