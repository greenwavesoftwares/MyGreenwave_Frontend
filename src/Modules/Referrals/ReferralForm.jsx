import React, { useState, useRef } from "react";
import { FileUpload } from "primereact/fileupload";
import { Button } from "primereact/button";
import { giveReferral } from "./ReferralService";
import { Toast } from "primereact/toast";
import { Stepper } from "primereact/stepper";
import { StepperPanel } from "primereact/stepperpanel";
import { validate as validateEmail } from 'email-validator';
import Person2OutlinedIcon from '@mui/icons-material/Person2Outlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
const ReferralForm = () => {
  const toast = useRef();
  const stepperRef = useRef(null);

  const [referralformData, setReferralformData] = useState({
    experience: "",
    name: "",
    email: "",
    number: "",
    education: "",
    role: "",
    totalExpYear: "",
    releventExpYear: "",
    technology: "",
    department: "",
    file: null,
  });

  // Generic handler for text/select inputs
  const handleChange = (e) => {
    const { id, value } = e.target;
    setReferralformData((prev) => ({ ...prev, [id]: value}));
  };

  // File input handler
  const handleFileUpload = (e) => {
    setReferralformData((prev) => ({ ...prev, file: e.files[0] }));
    toast.current.show({
      severity: "success",
      summary: "Success",
      detail: "File Uploaded",
    });
  };

  // Submit handler
  const handleSubmit = async () => {
    if(
    !referralformData.experience ||
    !referralformData.name ||
    !referralformData.email ||
    !referralformData.number ||
    !referralformData.education ||
    !referralformData.role ||
    !referralformData.totalExpYear ||
    !referralformData.releventExpYear ||
    !referralformData.technology ||
    !referralformData.department ||
    !referralformData.file
  ){
       toast.current.show({
        severity: "warn",
        summary: "Warning",
        detail: "Please Fill All Required Field",
      });
      return
  }

  if(!validateEmail(referralformData.email))
  {
     toast.current.show({
        severity: "warn",
        summary: "Warning",
        detail: "not a valid email",
      });
      return
  }
    
    
    const response = await giveReferral(referralformData);
    if (!response.status) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: response.message,
      });
    } else {
      setReferralformData({
        experience: "",
        name: "",
        email: "",
        number: "",
        education: "",
        role: "",
        totalExpYear: "",
        releventExpYear: "",
        technology: "",
        department: "",
        file: null,
      });
      toast.current.show({
        severity: "success",
        summary: "Success",
        detail: response.message,
      });
    }
  };

  return (
    <>
      <Toast ref={toast} />
      {/* <div className="w-3/4 mx-auto overflow-hidden">
       
        <div className="text-2xl py-4 px-6 text-gray-900 text-center font-bold uppercase">
          Referral Form
        </div>

        <div className="flex gap-x-20">
          <div className="mb-4 w-1/2">
            <label className="block text-gray-700 font-bold mb-2">
              Experience
            </label>
            <select
              id="experience"
              value={referralformData.experience}
              onChange={handleChange}
              className="shadow border rounded w-full py-2 px-3 text-gray-700"
            >
              <option value="">Select Experience type</option>
              <option value="Fresher">Fresher</option>
              <option value="Experienced">Experienced</option>
            </select>
          </div>
          <div className="mb-4 w-1/2">
            <label className="block text-gray-700 font-bold mb-2">Name</label>
            <input
              id="name"
              type="text"
              value={referralformData.name}
              onChange={handleChange}
              className="shadow border rounded w-full py-2 px-3 text-gray-700"
              placeholder="Enter name"
            />
          </div>
        </div>

        <div className="flex gap-x-20">
          <div className="mb-4 w-1/2">
            <label className="block text-gray-700 font-bold mb-2">Email</label>
            <input
              id="email"
              type="email"
              value={referralformData.email}
              onChange={handleChange}
              className="shadow border rounded w-full py-2 px-3 text-gray-700"
              placeholder="Enter email"
            />
          </div>
          <div className="mb-4 w-1/2">
            <label className="block text-gray-700 font-bold mb-2">
              Phone Number
            </label>
            <input
              id="number"
              type="tel"
              value={referralformData.number}
              onChange={handleChange}
              className="shadow border rounded w-full py-2 px-3 text-gray-700"
              placeholder="Enter phone number"
            />
          </div>
        </div>

        <div className="flex gap-x-20">
          <div className="mb-4 w-1/2">
            <label className="block text-gray-700 font-bold mb-2">
              Highest Education
            </label>
            <input
              id="education"
              type="text"
              value={referralformData.education}
              onChange={handleChange}
              className="shadow border rounded w-full py-2 px-3 text-gray-700"
              placeholder="Enter highest education"
            />
          </div>
          <div className="mb-4 w-1/2">
            <label className="block text-gray-700 font-bold mb-2">
              Department
            </label>
            <input
              id="department"
              type="text"
              value={referralformData.department}
              onChange={handleChange}
              className="shadow border rounded w-full py-2 px-3 text-gray-700"
              placeholder="Enter Department"
            />
          </div>
        </div>

        <div className="flex gap-x-20">
          <div className="mb-4 w-1/2">
            <label className="block text-gray-700 font-bold mb-2">
              Technology
            </label>
            <input
              id="technology"
              type="text"
              value={referralformData.technology}
              onChange={handleChange}
              className="shadow border rounded w-full py-2 px-3 text-gray-700"
              placeholder="Enter technology name"
            />
          </div>
          <div className="mb-4 w-1/2">
            <label className="block text-gray-700 font-bold mb-2">Role</label>
            <input
              id="role"
              type="text"
              value={referralformData.role}
              onChange={handleChange}
              className="shadow border rounded w-full py-2 px-3 text-gray-700"
              placeholder="Enter role"
            />
          </div>
        </div>

        <div className="flex gap-x-20">
          <div className="mb-4 w-1/2">
            <label className="block text-gray-700 font-bold mb-2">
              Working Experience (Years)
            </label>
            <select
              id="totalExpYear"
              name="totalExpYear"
              value={referralformData.totalExpYear}
              onChange={handleChange}
              className="shadow border rounded w-full py-2 px-3 text-gray-700"
            >
              <option value="">Select year</option>
              {Array.from({ length: 60 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4 w-1/2">
            <label className="block text-gray-700 font-bold mb-2">
              Relevant Experience (Years)
            </label>
            <select
              id="releventExpYear"
              value={referralformData.releventExpYear}
              onChange={handleChange}
              className="shadow border rounded w-full py-2 px-3 text-gray-700"
            >
              <option value="">Select year</option>
              {Array.from({ length: 60 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mb-4">
          <FileUpload
            mode="basic"
            name="file"
            accept="application/pdf"
            maxFileSize={1000000}
            customUpload
            uploadHandler={handleFileUpload}
            chooseLabel="Upload Resume"
            contentStyle={{ background: "#ffffff" }}
            style={{ height: "3rem" }}
          />
          <Button
            label="Submit Referral"
            severity="success"
            onClick={() => {
              handleSubmit();
            }}
          />
        </div>
      </div> */}

      <div className="">
        <Stepper
          ref={stepperRef}
          // orientation="vertical"
          style={{ flexBasis: "100%" }}
          className="hideStepperNumber titleStyle stepperPadding hideStepperNavbar"
        >
          <StepperPanel
            header={
              <span style={{ fontSize: "0.7rem" }}>Personal Information</span>
            }
          >
            <div className="flex flex-column">
              <div className="flex items-center mb-2">
                <Person2OutlinedIcon className=" mr-2 blue-icon-withBGColor " />
                <div>
                  <h2 className="text-sm font-bold text-gray-900">
                    Personal Information
                  </h2>
                  <p className="text-xs defaultFont">
                    Please provide your basic contact details
                  </p>
                </div>
              </div>
              <div style={{ display: "grid", rowGap: "0.5rem" }}>
                <div>
                  <label className="block font-bold mb-1 defaultFont defaultFontSize-sm">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={referralformData.name}
                    onChange={handleChange}
                    className="inputFieldStyle rounded w-full"
                    placeholder="Enter Full Name"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1 defaultFont defaultFontSize-sm">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={referralformData.email}
                    onChange={handleChange}
                    className="inputFieldStyle rounded w-full"
                    placeholder="Enter Email"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1 defaultFont defaultFontSize-sm">
                    Phone Number
                  </label>
                  <input
                    id="number"
                    type="tel"
                    value={referralformData.number}
                    onChange={handleChange}
                    className="inputFieldStyle rounded w-full"
                    placeholder="Enter Phone Number"
                  />
                </div>
              </div>
            </div>
            <div className="flex pt-4 justify-content-end">
              <Button
                label="Next"
                icon="pi pi-arrow-right"
                size="small"
                rounded
                style={{ padding: "0.4rem 1rem" }}
                iconPos="right"
                onClick={() => {
                  stepperRef.current.nextCallback();
                  setActiveStep((prev) => prev + 1);
                }}
              />
            </div>
          </StepperPanel>

          <StepperPanel
            header={
              <span style={{ fontSize: "0.7rem" }}>
                Professional Information
              </span>
            }
          >
            <div className="flex flex-column ">
              <div className="flex flex-column ">
                <div className="flex items-center mb-2">
                  <BusinessCenterOutlinedIcon className=" mr-2 blue-icon-withBGColor " />
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">
                      Professional Information
                    </h2>
                    <p className="defaultFont text-xs">
                      Tell us about your work experience
                    </p>
                  </div>
                </div>
                <div>
                  <div className="mb-2 w-full">
                    <label className="block text-gray-700 font-bold mb-2 defaultFont defaultFontSize-sm">
                      Experience
                    </label>
                    <select
                      id="experience"
                      value={referralformData.experience}
                      onChange={handleChange}
                      className="inputFieldStyle rounded w-full"
                    >
                      <option value="">Select Experience type</option>
                      <option value="Fresher">Fresher</option>
                      <option value="Experienced">Experienced</option>
                    </select>
                  </div>
                  <div className="mb-2 w-full">
                    <label className="block text-gray-700 font-bold mb-2 defaultFont defaultFontSize-sm">
                      Role
                    </label>
                    <input
                      id="role"
                      type="text"
                      value={referralformData.role}
                      onChange={handleChange}
                      className="inputFieldStyle rounded w-full"
                      placeholder="Enter Role"
                    />
                  </div>

                 <div className="mb-2 w-full">
                    <label
                      className="block text-gray-700 font-bold mb-2 defaultFont defaultFontSize-sm
"
                    >
                      Technology
                    </label>
                    <input
                      id="technology"
                      type="text"
                      value={referralformData.technology}
                      onChange={handleChange}
                      className="inputFieldStyle rounded w-full"
                      placeholder="Enter Technology Name"
                    />
                  </div>
                  <div className="mb-2 w-full">
                    <label className="block text-gray-700 font-bold mb-2 defaultFont defaultFontSize-sm">
                      Relevant Experience (Years)
                    </label>
                    <select
                      id="releventExpYear"
                      value={referralformData.releventExpYear}
                      onChange={handleChange}
                      className="inputFieldStyle rounded w-full"
                    >
                      <option value="">Select Year</option>
                      {Array.from({ length: 60 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="mb-2">
                      <label className="block text-gray-700 font-bold mb-2 defaultFont defaultFontSize-sm">
                        Working Experience (Years)
                      </label>
                      <select
                        id="totalExpYear"
                        name="totalExpYear"
                        value={referralformData.totalExpYear}
                        onChange={handleChange}
                        className="inputFieldStyle rounded"
                        style={{ width: "100%" }}
                      >
                        <option value="">Select Year</option>
                        {Array.from({ length: 60 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex pt-4 justify-content-between">
              <Button
                label="Back"
                severity="secondary"
                icon="pi pi-arrow-left"
                size="small"
                rounded
                style={{ padding: "0.4rem 1rem" }}
                onClick={() => {
                  stepperRef.current.prevCallback();
                  setActiveStep((prev) => prev - 1);
                }}
              />
              <Button
                label="Next"
                icon="pi pi-arrow-right"
                iconPos="right"
                size="small"
                rounded
                style={{ padding: "0.4rem 1rem" }}
                onClick={() => {
                  stepperRef.current.nextCallback();
                  setActiveStep((prev) => prev + 1);
                }}
              />
            </div>
          </StepperPanel>

          <StepperPanel
            header={
              <span style={{ fontSize: "0.7rem" }}>Educational Background</span>
            }
          >
            <div className="flex flex-column ">
              <div className="flex items-center mb-2">
                <SchoolOutlinedIcon className=" mr-2 blue-icon-withBGColor " />
                <div>
                  <h2 className="text-sm font-bold text-gray-900">
                    Educational Background
                  </h2>
                  <p className="defaultFont text-xs">
                    Share your educational qualifications
                  </p>
                </div>
              </div>
              <div>
                <div style={{ display: "grid" }}>
                  <div className="mb-2">
                    <label className="block text-gray-700 font-bold mb-2 defaultFont defaultFontSize-sm">
                      Highest Education
                    </label>
                    <input
                      id="education"
                      type="text"
                      value={referralformData.education}
                      onChange={handleChange}
                      className="inputFieldStyle rounded w-full"
                      placeholder="Enter Highest Education"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block text-gray-700 font-bold mb-2 defaultFont defaultFontSize-sm">
                      Department
                    </label>
                    <input
                      id="department"
                      type="text"
                      value={referralformData.department}
                      onChange={handleChange}
                      className="inputFieldStyle rounded w-full"
                      placeholder="Enter Department"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex pt-4 justify-content-between">
              <Button
                label="Back"
                severity="secondary"
                icon="pi pi-arrow-left"
                size="small"
                rounded
                style={{ padding: "0.4rem 1rem" }}
                onClick={() => {
                  stepperRef.current.prevCallback();
                  setActiveStep((prev) => prev - 1);
                }}
              />
              <Button
                label="Next"
                icon="pi pi-arrow-right"
                iconPos="right"
                size="small"
                rounded
                style={{ padding: "0.4rem 1rem" }}
                onClick={() => {
                  stepperRef.current.nextCallback();
                  setActiveStep((prev) => prev + 1);
                }}
              />
            </div>
          </StepperPanel>

          <StepperPanel
            header={<span style={{ fontSize: "0.7rem" }}>Document Upload</span>}
          >
            <div className="flex flex-column h-14rem ">
              <div className="flex items-center mb-2">
                <UploadFileOutlinedIcon className=" mr-2 blue-icon-withBGColor " />
                <div>
                  <h2 className="text-sm font-bold text-gray-900">
                    Document Upload
                  </h2>
                  <p className="defaultFont text-xs">
                    Upload any relevant documents or certificates
                  </p>
                </div>
              </div>
              <div
                className=" border-2 border-dashed surface-border border-round surface-ground flex-auto flex justify-content-center align-items-center font-medium"
                style={{ borderColor: "#c5c5c5 !importnat" }}
              >
                <FileUpload
                  mode="basic"
                  name="file"
                  accept="application/pdf"
                  maxFileSize={1000000}
                  customUpload
                  uploadHandler={handleFileUpload}
                  chooseLabel="Upload Resume"
                  contentStyle={{ background: "#ffffff" }}
                  style={{ height: "3rem" }}
                />
              </div>
            </div>
            <div className="flex pt-4 justify-content-between">
              <Button
                label="Back"
                severity="secondary"
                icon="pi pi-arrow-left"
                size="small"
                rounded
                style={{ padding: "0.4rem 1rem" }}
                onClick={() => {
                  stepperRef.current.prevCallback();
                  setActiveStep((prev) => prev - 1);
                }}
              />
              <Button
                label="Submit"
                icon="pi pi-save"
                severity="success"
                size="small"
                rounded
                style={{ padding: "0.4rem 1rem" }}
                iconPos="right"
                onClick={() => {
                  handleSubmit();
                }}
              />
            </div>
          </StepperPanel>
        </Stepper>
      </div>
    </>
  );
};

export default ReferralForm;
