import Fab from "@mui/material/Fab";
import AddIcon from "@mui/icons-material/Add";
import { Dialog } from "primereact/dialog";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@mui/material";
import { Calendar } from "primereact/calendar";
import { FloatLabel } from "primereact/floatlabel";
import { getSummary } from "../../api/admin";
import { getUserData } from "../../../../Modules/Login/Encrypt";
import DownloadIcon from "@mui/icons-material/Download";
import {
  showErrorMessage,
  showSuccessMessage,
} from "../../../../components/Toast/ShowMessage";
import { Toast } from "primereact/toast";

function GetExpenseSummaryDialog() {
  const [visible, setVisible] = useState(false);
  const [isExcelDownloadButtonDisable, setIsExcelDownloadButtonDisable] =
    useState(false);
  //Get User Token
  const { token } = getUserData();
  //React Hooks Form
  const { control, handleSubmit, reset } = useForm();
  //For Toast
  const toastRef = useRef(null);

  //Excel Download API Call
  async function handleSummaryData(ele) {
    const date = new Date(ele.date);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    try {
      setIsExcelDownloadButtonDisable(true);
      const response = await getSummary(token, {
        month,
        year,
      });

      if (response.status === 200) {
        console.log("Api_response", response);
        setIsExcelDownloadButtonDisable(false);
        showSuccessMessage(
          toastRef,
          "Success",
          "Excel file generated successfully",
        );
        setVisible(false);
        reset(); //Rest From
      }
    } catch (error) {
      console.log("Excel download error", error);
      showErrorMessage(
        toastRef,
        "Error",
        "Excel download failed. Please try again",
      );
    } finally {
      setIsExcelDownloadButtonDisable(false);
    }
  }

  return (
    <>
      <Toast ref={toastRef} />
      <Fab
        color="primary"
        aria-label="add"
        size="small"
        onClick={() => setVisible(true)}
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
      >
        <DownloadIcon />
      </Fab>

      <Dialog
        header="Download Summary (Excel)"
        visible={visible}
        style={{ width: "20rem" }}
        onHide={() => {
          if (!visible) return;
          setVisible(false);
          reset(); //Reset From
        }}
        className="dialogHeader dialogContent"
      >
        <form
          onSubmit={handleSubmit(handleSummaryData)}
          className="grid gap-3 pt-3 px-2 mt-3 items-center"
          style={{ justifyContent: "center" }}
        >
          <Controller
            name="date"
            control={control}
            rules={{ required: "Date is required" }}
            render={({ field }) => (
              <>
                <FloatLabel>
                  <Calendar
                    inputId="month_year"
                    {...field}
                    view="month"
                    dateFormat="mm/yy"
                    className="w-full"
                  />
                  <label htmlFor="month_year">Select Month & Year</label>
                </FloatLabel>
              </>
            )}
          />
          <Button
            variant="contained"
            sx={{ boxShadow: "none" }}
            size="small"
            type="submit"
            loading={isExcelDownloadButtonDisable}
            loadingPosition="start"
            disabled={isExcelDownloadButtonDisable}
          >
            Download Summary
          </Button>
        </form>
      </Dialog>
    </>
  );
}

export default GetExpenseSummaryDialog;
