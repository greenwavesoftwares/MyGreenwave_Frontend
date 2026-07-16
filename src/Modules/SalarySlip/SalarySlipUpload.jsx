import React, { useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import { FileUpload } from "primereact/fileupload";
import { uploadSalarySlip } from "./SalarySlipAPI";
import { saveSalarySlipData } from "./SalarySlipAPI";
import { uploadForm16Zip } from "./SalarySlipAPI";
import { getUserData } from "../Login/Encrypt";
import { ProgressSpinner } from "primereact/progressspinner";
import GreenwaveLogo from "../../assets/Images/GreenwaveLogo.png";

export default function SalarySlipUpload() {
  const [rowDataList, setRowDataList] = useState([]);
  const [sumOfNetPayable, setSumOfNetPayable] = useState(0);
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);
  const fileUploadRef = useRef(null);
  const zipfileUploadRef = useRef(null);
  const [userInfo] = useState(getUserData());
  console.log(userInfo.userDetails);

  const onExcelUpload = async (event) => {
    setLoading(true); // Start spinner
    const file = event.files[0];

    try {
      const response = await uploadSalarySlip(
        file,
        userInfo.userDetails.department
      );
      console.log(response);
      if (!response.rowDataList || response.rowDataList.length === 0) {
        toast.current.show({
          severity: "warn",
          summary: "Upload failed!!",
          detail: response.message,
        });
        setRowDataList([]); // Clear previous table if needed
        setSumOfNetPayable(0);
        return; // Exit early
      }
      setRowDataList(response.rowDataList);
      setSumOfNetPayable(response.sumOfNetPayable);

      toast.current.show({
        severity: "success",
        summary: "Upload Successful",
        detail: response.message,
      });
    } catch (error) {
      console.error("Upload failed:", error);
      toast.current.show({
        severity: "error",
        summary: "Upload Failed",
        detail: "Something went wrong.",
      });
    } finally {
      setLoading(false); // Stop spinner
    }
  };

  const onSave = async () => {
    try {
      await saveSalarySlipData(rowDataList, userInfo.userDetails.department);

      toast.current.show({
        severity: "success",
        summary: "Data Saved",
        detail: "Salary slips have been saved successfully.",
      });

      setRowDataList([]);
      setSumOfNetPayable(0);

      if (fileUploadRef.current) {
        fileUploadRef.current.clear();
      }
    } catch (error) {
      console.log(error);

      toast.current.show({
        severity: "error",
        summary: "Save Failed",
        detail: "You have already saved the data for this month.",
      });

      setRowDataList([]);
      setSumOfNetPayable(0);

      if (fileUploadRef.current) {
        fileUploadRef.current.clear();
      }
    }
  };

  const onZipUpload = async ({ files }) => {
    const zipFile = files[0];

    try {
      const result = await uploadForm16Zip(
        zipFile,
        userInfo.userDetails.department
      );

      toast.current.show({
        severity: "success",
        summary: "Upload Successful",
        detail: result.message || "Form 16 ZIP uploaded successfully!",
      });

      // Optionally reset or do something else here
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Upload Failed",
        detail:
          error.response?.data?.message || "Failed to upload Form 16 ZIP file.",
      });
    }
  };

  return (
    <div className="container mx-auto px-4">
      <div className="mx-auto">
        <div className="card mt-4 py-2 px-3">
          <Toast ref={toast} />

          <div
            className="p-2 mb-3 salarySlip-HeaderBG"
            style={{
             
              borderLeft: "5px solid #64b5f6",
              borderRadius: "10px",
              
              fontWeight: "600",
              fontSize: "1rem",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
              transition: "box-shadow 0.3s ease-in-out",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "0 6px 14px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.1)";
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <img
                  src={GreenwaveLogo}
                  alt="Upload Icon"
                  style={{ width: "30px", height: "30px", marginLeft:"0.5rem" }}
                />
                <div
                  style={{
                   fontSize: "0.85rem",
                    fontWeight: "bold",
                     marginLeft:"0.5rem"
                  }}
                >
                  Upload Salary Slip & Form 16
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                }}
              >
                <FileUpload
                  ref={zipfileUploadRef}
                  name="zipFile"
                  accept=".zip"
                  maxFileSize={1024*1024*1024}

                  customUpload
                  uploadHandler={onZipUpload}
                  mode="basic"
                  chooseLabel="Choose Form 16"
                  uploadLabel="Upload"
                  className="fileUpload-btn-Style"
                />
                <FileUpload
                  ref={fileUploadRef}
                  name="excel[]"
                  accept=".xls,.xlsx"
                  maxFileSize={1024*1024*1024}
                  customUpload
                  uploadHandler={onExcelUpload}
                  mode="basic"
                  chooseLabel="Choose Excel File"
                  uploadLabel="Upload"
                   className="fileUpload-btn-Style"
                />
              </div>
            </div>
          </div>
          {rowDataList?.length > 0 && (
            <div
              className="flex justify-between align-items-center p-3 mt-3"
              style={{
                background: "#d1e7dd",
                borderLeft: "5px solidrgb(36, 215, 144)",
                borderRadius: "6px",
                color: "#0f5132",
                fontWeight: "600",
                fontSize: "1rem",
              }}
            >
              <div
                style={{ fontWeight: 600, fontSize: "1rem", color: "#0f3c68" }}
              >
                Total Net Payable: ₹ {sumOfNetPayable}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <ProgressSpinner
                style={{ width: "50px", height: "50px" }}
                strokeWidth="8"
                fill="var(--surface-ground)"
                animationDuration=".5s"
              />
            </div>
          ) : (
            rowDataList.length > 0 && (
              <div className="mt-4" style={{ width: "88vw" }}>
                <DataTable
                  value={rowDataList}
                  paginator
                  rows={3}
                  scrollable
                  className="text-sm"
                  showGridlines
                  stripedRows
                  tableStyle={{ minWidth: "50rem" }}
                >
                  {Object.keys(rowDataList[0]).map((colKey) => (
                    <Column
                      key={colKey}
                      field={colKey}
                      header={colKey}
                      style={{ minWidth: "150px" }}
                    />
                  ))}
                </DataTable>
                <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
                  <button
                    className="p-button p-component p-button-success"
                    onClick={onSave}
                  >
                    Save
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
