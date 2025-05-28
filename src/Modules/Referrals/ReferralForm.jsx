import React, { useState, useRef } from "react";
import { FileUpload } from "primereact/fileupload";
import { Button } from "primereact/button";
import { giveReferral } from "./ReferralService";
import { Toast } from "primereact/toast";

const ReferralForm = () => {
  const toast = useRef();
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
    setReferralformData((prev) => ({ ...prev, [id]: value }));
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
    <div className="w-3/4 mx-auto overflow-hidden">
      <Toast ref={toast} />
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
    </div>
  );
};

export default ReferralForm;
