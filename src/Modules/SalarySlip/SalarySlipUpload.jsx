import React, { useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import { FileUpload } from "primereact/fileupload";
import { uploadSalarySlip } from "./SalarySlipAPI";
import { saveSalarySlipData } from "./SalarySlipAPI";
import { uploadForm16Zip } from "./SalarySlipAPI";
import { Button } from "primereact/button";
import { getUserData } from "../Login/Encrypt";

export default function SalarySlipUpload() {
  const [rowDataList, setRowDataList] = useState([]);
  const [sumOfNetPayable, setSumOfNetPayable] = useState(0);
  const toast = useRef(null);
  const fileUploadRef = useRef(null);
  const zipfileUploadRef = useRef(null);
  const department = "Accounts";

  const onExcelUpload = async (event) => {
    const file = event.files[0];

    try {
      const response = await uploadSalarySlip(file, department);
      console.log("Upload response:", response);

      setRowDataList(response.rowDataList);
      setSumOfNetPayable(response.sumOfNetPayable);

      toast.current.show({
        severity: "success",
        summary: "Upload Successful",
        detail: "Salary slip uploaded.",
      });
    } catch (error) {
      console.error("Upload failed:", error);
      toast.current.show({
        severity: "error",
        summary: "Upload Failed",
        detail: "Something went wrong.",
      });
    }
  };

  const onSave = async () => {
    try {
      await saveSalarySlipData(rowDataList, department);

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
    const department = "Accounts";

    try {
      const result = await uploadForm16Zip(zipFile, department);
      console.log(result);

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
    <div className="card p-4" style={{ maxWidth: "95%", margin: "0 auto" }}>
      <Toast ref={toast} />

      <div
        className="p-3 mb-3"
        style={{
          background: "#e3f2fd",
          borderLeft: "5px solid #64b5f6",
          borderRadius: "10px",
          color: "#0d47a1",
          fontWeight: "600",
          fontSize: "1rem",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
          transition: "box-shadow 0.3s ease-in-out",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 6px 14px rgba(0, 0, 0, 0.15)";
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
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <img
              src=".\src\assets\Images\GreenwaveLogo.png"
              alt="Upload Icon"
              style={{ width: "40px", height: "40px" }}
            />
            <div
              style={{
                fontSize: "1.5 rem",
                fontWeight: "bold",
              }}
            >
              Upload Salary Slip & Form 16
            </div>
          </div>

          <FileUpload
            ref={zipfileUploadRef}
            name="zipFile"
            accept=".zip"
            maxFileSize={1000000}
            customUpload
            uploadHandler={onZipUpload}
            mode="basic"
            chooseLabel="Choose Form 16"
            uploadLabel="Upload"
          />
          <FileUpload
            ref={fileUploadRef}
            name="excel[]"
            accept=".xls,.xlsx"
            maxFileSize={1000000}
            customUpload
            uploadHandler={onExcelUpload}
            mode="basic"
            chooseLabel="Choose Excel File"
            uploadLabel="Upload"
          />
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
          <div style={{ fontWeight: 600, fontSize: "1rem", color: "#0f3c68" }}>
            Total Net Payable: ₹ {sumOfNetPayable}
          </div>
        </div>
      )}

      {rowDataList.length > 0 && (
        <div className="mt-4" style={{ overflowX: "auto" }}>
          <DataTable
            value={rowDataList}
            paginator
            rows={10}
            scrollable
            scrollHeight="400px"
            className="text-sm"
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
      )}
    </div>
  );
}
