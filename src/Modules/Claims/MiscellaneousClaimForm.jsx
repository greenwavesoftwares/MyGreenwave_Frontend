import { useRef, useState } from "react";
//import { InputText } from "primereact/inputtext";
import { CustomeFileUpload } from "../../components/FileUpload/CustomeFileUpload";
//import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import Dropdown from "../../components/Claim/Dropdown";
import { ApplyOtherClaim } from "./claimServices";
import { getUserData } from "../Login/Encrypt";
import CustomButton from "../../components/Button/Button";
import { FileUpload } from "primereact/fileupload";
import { Button } from "primereact/button";

const userDetails = getUserData()?.userDetails;
import {
  showSuccessMessage,
  showErrorMessage,
  showWarningMessage,
} from "../../components/Toast/ShowMessage";
import CustomInputText from "../../components/InputText/InputText";
//MUI Icon
import TextSnippetOutlinedIcon from "@mui/icons-material/TextSnippetOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { Chip, Grid, Typography } from "@mui/material";

const MiscellaneousClaimForm = () => {
    const [fileUploaded, setFileUploaded] = useState(false);
  const toastRef = useRef(null);
  const fileUploadRef = useRef(null);
  const [file, setFile] = useState(null);
  const [claimType, setClaimType] = useState(null);
  const [claimAmount, setClaimAmount] = useState("");
  const [claimDetails, setClaimDetails] = useState("");

  const claimOptions = [
    { label: "Client Engagement", value: "Client Engagement" },
    { label: "Medical Insurance", value: "Medical Insurance" },
    {
      label: "Local Conveyance Without Account",
      value: "Local Conveyance Without Account",
    },
    { label: "Staff Welfare", value: "Staff Welfare" },
    { label: "Food", value: "Food Claim" },
  ];

  const placeholder = "Select Claim Type";

  const onUpload = async (event) => {
    if (event.files && event.files.length > 0) {
      setFile(event.files[0]);
      showSuccessMessage(toastRef, "success", "File Uploaded");
       setFileUploaded(true);
    }
  };

  const handleOnClick = async () => {
    if (!claimType || !claimAmount || !claimDetails || !file) {
      showWarningMessage(
        toastRef,
        "warn",
        "Please fill all fields and upload a file."
      );
      return;
    }

    try {
      const data = await ApplyOtherClaim(
        file,
        claimType,
        claimAmount,
        claimDetails
      );
      console.log(data ,"data....")

      if (data.status === true) {
        showSuccessMessage(toastRef, "success", data.message);

        setFile(null);
        setClaimAmount("");
        setClaimDetails("");
        fileUploadRef.current?.clear();
      }else
      {
        showErrorMessage(toastRef, "error", data?.message || "Upload failed");
      }
    } catch (error) {
      showErrorMessage(toastRef, "error", error?.message || "Upload failed");
    }
  };

  return (
    <div >
      <Toast ref={toastRef} />

      {/* Miscellaneous Claim */}
      <div className="cardBG rounded-xl p-4 mb-3 defaultBorder">
        <div className="flex justify-content-between mb-4">
        <div className="" style={{ display: "flex", alignItems: "center" }}>
          <TextSnippetOutlinedIcon
            style={{
              color: "#119ac5",
              marginRight: "0.7rem",
              fontSize: "1.4rem",
            }}
          />
          <Typography
            className=""
            style={{
              //color: "#4b5563",
              fontSize: "0.88rem",
              fontWeight: 600,
            }}
          >
            Miscellaneous Claim
          </Typography>
        </div>
        <div>
          <Chip label={`Employee Code ${userDetails?.employeeId || "N/A"}`} size="small" color="info"/>
        </div>
        </div>

        <Grid container spacing={{ xs: 2, sm: 2, md: 10, lg: 10, xl: 10 }}>
          <Grid item size={{xs:12,sm:12, md:4, lg:4, xl:4}}>
            {/* Claim Type */}
            <div >
              <label  className="block text-sm font-medium text-gray-700 mb-1">
                Claim Type
              </label>
              <div >
                <Dropdown
                  claimOptions={claimOptions}
                  claimType={claimType}
                  setClaimType={setClaimType}
                  placehonder={placeholder}
                />
              </div>
            </div>
          </Grid>

          {/* Employee Code */}
          {/* <Grid size={6}>
            
            <div className="flex items-center">
              <label className="w-1/3 text-sm font-medium text-gray-700">
                Employee Code
              </label>
              <div className="w-2/3">
                <div className="bg-gray-100 shadow-sm rounded-md px-4 py-2  flex items-center text-gray-700">
                  {userDetails?.employeeId || "N/A"}
                </div>
              </div>
            </div>
          </Grid> */}
          <Grid  item size={{xs:12,sm:12, md:4, lg:4, xl:4}}>
            {/* Claim Amount */}
             <div >
              <label  className="block text-sm font-medium text-gray-700 mb-1">
               Claim Amount (INR)
              </label>
              <div >
                <CustomInputText
                  className="w-full  inputFieldStyle"
                  value={claimAmount}
                  // onChange={(e) => setClaimAmount(e.target.value)}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*\.?\d*$/.test(value)) {
                      // allows only digits and optional decimal
                      setClaimAmount(value);
                    }
                  }}
                />
              </div>
            </div>
          </Grid>
          <Grid  item size={{xs:12,sm:12, md:4, lg:4, xl:4}}>
            {/* Claim Details */}
            <div >
              <label  className="block text-sm font-medium text-gray-700 mb-1">
               Details of the Claim
              </label>
              <div >
                <CustomInputText
                   className="w-full  inputFieldStyle"
                  value={claimDetails}
                  onChange={(e) => setClaimDetails(e.target.value)}
                />
              </div>
            </div>
          </Grid>
          </Grid>
          <Grid container spacing={2}  className="mt-6">
          <Grid size={6}>
            {/* File Upload */}
            <div className="flex items-center justify-content-end">
              {/* <label className="w-1/3 text-sm font-medium text-gray-700">
                Upload File
              </label> */}
              <div >
                 {!fileUploaded ? (
                          <FileUpload
                            mode="basic"
                            name="file"
                           accept="*/*"
                            customUpload
                            uploadHandler={onUpload}
                            maxFileSize={50000000}
                            chooseLabel="Upload Document"
                            className="selectButtonStyle"
                          />
                        ) : (
                          <div className="flex align-items-center gap-2 mt-2">
                            <span className="text-green-600 font-medium">
                              File uploaded successfully
                            </span>
                            <Button
                              icon="pi pi-refresh"
                              className="p-button-sm p-button-text p-button-warning"
                              onClick={() => {
                                setFileUploaded(false);
                              }}
                              tooltip="Re-upload"
                              tooltipOptions={{ position: "top" }}
                            />
                          </div>
                        )}
                
               
              </div>
            </div>
          </Grid>
          
          <Grid size={6}>
            {/* Submit Button */}
            <div className="flex items-center justify-content-start">
              <CustomButton
                label="Send for Approval"
                icon="pi pi-send"
                className="px-4 py-2 p-button-success"
                onClick={handleOnClick}
              />
            </div>
          </Grid>
        </Grid>
      </div>
    </div>
  );
};

export default MiscellaneousClaimForm;
