import  { useRef, useState } from "react";
//import { InputText } from "primereact/inputtext";
import { CustomeFileUpload } from "../../components/FileUpload/CustomeFileUpload";
//import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import Dropdown from "../../components/Claim/Dropdown";
import { ApplyOtherClaim } from "./claimServices";
import { getUserData } from "../Login/Encrypt";
import CustomButton from "../../components/Button/Button";

const userDetails = getUserData()?.userDetails;
import {
  showSuccessMessage,
  showErrorMessage,
  showWarningMessage,
} from "../../components/Toast/ShowMessage";
import CustomInputText from "../../components/InputText/InputText"

const MiscellaneousClaimForm = () => {
  const toastRef = useRef(null);
  const fileUploadRef = useRef(null);
  const [file, setFile] = useState(null);
  const [claimType, setClaimType] = useState(null);
  const [claimAmount, setClaimAmount] = useState("");
  const [claimDetails, setClaimDetails] = useState("");

  const claimOptions = [
    { label: "Client Entertainment Claim", value: "Client Entertainment Claim" },
    { label: "Medical Insurance Claim", value: "Medical Insurance Claim" },
    { label: "Local Conveyance Claim", value: "Local Conveyance Claim" },
    { label: "Staff Welfare Claim", value: "Staff Welfare Claim" },
    { label: "Food Claim", value: "Food Claim" },
  ];

  const placeholder = "Select Claim Type";

  const onUpload = async (event) => {
    if (event.files && event.files.length > 0) {
      setFile(event.files[0]);
        showSuccessMessage(toastRef,"success","File Uploaded")
     
    }
  };

  const handleOnClick = async () => {
    if (!claimType || !claimAmount || !claimDetails || !file) {
      showWarningMessage(toastRef,"warn", "Please fill all fields and upload a file.",)
     
      return;
    }

    try {
      const data = await ApplyOtherClaim(file, claimType, claimAmount, claimDetails);

      if (data.status === true) {
        showSuccessMessage(
          toastRef,
          "success",
         data.message,
        );
    
      

        setFile(null);
        setClaimAmount("");
        setClaimDetails("");
        fileUploadRef.current?.clear();
      }
    } catch (error) {
        showErrorMessage(
                toastRef,
               "error",
               error?.message || "Upload failed"
              );
     
    }
  };

  return (
    <div className="flex items-center justify-center px-4 overflow-x-hidden">
      <Toast ref={toastRef} />
      <div className="bg-white p-6 max-w-3xl w-full mx-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
          Miscellaneous Claim
        </h2>

        <div className="space-y-6">
          {/* Claim Type */}
          <div className="flex items-center">
            <label className="w-1/3 text-sm font-medium text-gray-700">Claim Type</label>
            <div className="w-2/3">
              <Dropdown
                claimOptions={claimOptions}
                claimType={claimType}
                setClaimType={setClaimType}
                placehonder={placeholder}
              />
            </div>
          </div>

          {/* Employee Code */}
          <div className="flex items-center">
            <label className="w-1/3 text-sm font-medium text-gray-700">Employee Code</label>
            <div className="w-2/3">
              <div className="bg-gray-100 shadow-sm rounded-md px-4 py-2  flex items-center text-gray-700">
                {userDetails?.employeeId || "N/A"}
              </div>
            </div>
          </div>

          {/* Claim Amount */}
          <div className="flex items-center">
            <label className="w-1/3 text-sm font-medium text-gray-700">Claim Amount (INR)</label>
            <div className="w-2/3">
              <CustomInputText
                className="w-full  rounded-md shadow-sm"
                value={claimAmount}
                onChange={(e) => setClaimAmount(e.target.value)}
              />
            </div>
          </div>

          {/* Claim Details */}
          <div className="flex items-center">
            <label className="w-1/3 text-sm font-medium text-gray-700">Details of the Claim</label>
            <div className="w-2/3">
              <CustomInputText
                className="w-full  rounded-md shadow-sm"
                value={claimDetails}
                onChange={(e) => setClaimDetails(e.target.value)}
              />
            </div>
          </div>

          {/* File Upload */}
          <div className="flex items-center">
            <label className="w-1/3 text-sm font-medium text-gray-700">Upload File</label>
            <div className="w-2/3">
              <CustomeFileUpload
                ref={fileUploadRef}
                name="file"
                customUpload
                uploadHandler={onUpload}
                mode="basic"
                chooseLabel="Choose File"
                accept="*/*"
                maxFileSize={1000000}
                className="p-button-success"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center mt-6">
            <CustomButton
              label="Send for Approval"
              icon="pi pi-send"
              className="px-6 py-2 p-button-success"
              onClick={handleOnClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiscellaneousClaimForm;
