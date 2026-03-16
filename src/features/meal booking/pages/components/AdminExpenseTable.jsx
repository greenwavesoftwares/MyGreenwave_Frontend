import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { getUserData } from "../../../../Modules/Login/Encrypt";
import { expenseDelete, fetchExpense } from "../../api/admin";
import {
  showErrorMessage,
  showSuccessMessage,
} from "../../../../components/Toast/ShowMessage";
import { Toast } from "primereact/toast";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Box, Button, CircularProgress, LinearProgress } from "@mui/material";
import { Tag } from "primereact/tag";
import { Pencil, Trash } from "lucide-react";

//Lazy Loading Component
const AddNewExpense = lazy(() => import("./AddNewExpense"));

function AdminExpenseTable() {
  const [expense, setExpense] = useState([]);
  const [loader, setLoader] = useState(false);
  const [reloadExpenseData, setReloadExpenseData] = useState(false);
  const [selectRowData, setSelectRowData] = useState(null);

  //Dialog Visible
  const [visible, setVisible] = useState(false);

  //For Toast
  const toastRef = useRef(null);
  //Get User Token
  const { token } = getUserData();

  //IMPORTANT Fetch All Expense List
  async function allExpenseList() {
    try {
      setLoader(true);
      const response = await fetchExpense(token);
      console.log("response_dailyExpenseData",response.dailyExpenseData);
      setExpense(response.dailyExpenseData);
    } catch (error) {
      console.log(error);
      showErrorMessage(toastRef, "Error", "Failed to fetch expense data");
    } finally {
      setLoader(false);
    }
  }

  //Call All Expense List Using useEffect
  useEffect(() => {
    allExpenseList();
  }, [reloadExpenseData]);

  //Handle Delete Expense
  async function handelDelete(date, time) {
    const data = {
      date: date.split("T")[0],
      time: time,
    };

    try {
      const response = await expenseDelete(token, data);
      console.log("res", response);
      if (response.status === 200) {
        showSuccessMessage(
          toastRef,
          "Success",
          `${data.date} expense deleted successfully`,
        );
        //Refresh Expense List
        allExpenseList();
      }
    } catch (error) {
      console.log(error);
      showErrorMessage(toastRef, "Error", "Failed to delete expense");
    }
  }

  //Update Expense
  function updateExpense(ele, rowIndex) {
    console.log("update expense", ele, "row_data", rowIndex);
    //rowindex is used to identify which row is being edited
    setSelectRowData(ele);
    //Dialog Visibility 
    setVisible(true)
  }

  console.log("Parent_Dialog_Visible_State", visible);

  return (
    <>
      <DataTable
        size="small"
        emptyMessage={
          loader ? <LinearProgress color="inherit" /> : "No Data Found"
        }
        header={
          <>
            <div className="flex justify-between items-center">
              <p>All Expense</p>
              <Button
                size="small"
                variant="contained"
                sx={{ boxShadow: "none" }}
                onClick={() => setVisible(true)}
              >
                Add Expense
              </Button>
            </div>
          </>
        }
        value={expense}
        showGridlines
        stripedRows
        paginator={expense?.length > 10 ? true : false}
        rows={10}
        className="dataTableHeader dataTableBody dataTableBodyPadding dataTablePaginator"
      >
        <Column
          header="Date"
          body={(ele) => <p>{ele.date?.split("T")[0]}</p>}
        ></Column>
        <Column
          header="Time"
          body={(ele) => (
            <Tag
              value={ele.time}
              rounded
              severity={ele?.time.toLowerCase() === "lunch" ? "success" : ""}
            />
          )}
        ></Column>

        <Column header="Expense" body={(ele) => <p>{ele.expense}</p>}></Column>

        <Column header="Breakup" body={(ele) => <p>{ele.breakup}</p>}></Column>

        <Column header="Details" body={(ele) => <p>{ele.details}</p>}></Column>
        <Column
          header="Edit"
          body={(ele, { rowIndex }) => (
            <div className="flex items-center justify-center space-x-3">
              <button
                className="rounded-full text-teal-500 hover:bg-teal-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                style={{
                  width: "1.5rem",
                  height: "1.5rem",
                }}
                onClick={() => 
                {
                  console.log("update object--",ele);
                  updateExpense(ele, rowIndex)}}
              >
                <Pencil size={16} />
              </button>
            </div>
          )}
        ></Column>
        <Column
          header="Delete"
          body={(e) => {
            return (
              <div className="flex items-center justify-center space-x-3">
                <button
                  className="rounded-full  text-red-400 hover:bg-red-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  style={{
                    width: "1.5rem",
                    height: "1.5rem",
                  }}
                  onClick={() => handelDelete(e.date, e.time)}
                >
                  <Trash size={16} />
                </button>
              </div>
            );
          }}
        ></Column>
      </DataTable>

      {/* Form visible */}
      {visible && (
        <Suspense
          fallback={
            <>
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                <CircularProgress />
              </Box>
            </>
          }
        >
          <AddNewExpense
            setReloadExpenseData={setReloadExpenseData}
            selectRowData={selectRowData}
            setSelectRowData={setSelectRowData}
            visible={visible}
            setVisible={setVisible}
          />
        </Suspense>
        
      )}
      <Toast ref={toastRef} />
    </>
  );
}

export default AdminExpenseTable;
