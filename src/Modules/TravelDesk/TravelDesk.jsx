import React, { useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { Button, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

const TravelDesk = () => {
  const [transportModal, setTransportModal] = useState(false);
  const [accommodationModal, setAccommodationModal] = useState(false);
  const [travelType, setTravelType] = useState(null);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-10">
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl">
      <form className="grid grid-cols-2 gap-6">
        {/* Name */}
        <div className="col-span-1">
          <label className="block text-gray-600 font-semibold">Name</label>
          <input
            type="text"
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value="Rudraneel Ghosh"
            readOnly
          />
        </div>
        
        {/* Date */}
        <div className="col-span-1">
          <label className="block text-gray-600 font-semibold">Date</label>
          <input
            type="text"
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value="31/03/2025"
            readOnly
          />
        </div>

        {/* Department */}
        <div className="col-span-1">
          <label className="block text-gray-600 font-semibold">Department</label>
          <input
            type="text"
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value="Software"
            readOnly
          />
        </div>
        
        {/* Employee Code */}
        <div className="col-span-1">
          <label className="block text-gray-600 font-semibold">Employee Code</label>
          <input
            type="text"
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value="152"
            readOnly
          />
        </div>

        {/* Travel Type */}
        <div className="col-span-2">
          <label className="block text-gray-600 font-semibold">Select Travel Type</label>
          <select className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Select Travel Type</option>
          </select>
        </div>

        {/* Advanced Amount */}
        <div className="col-span-2">
          <label className="block text-gray-600 font-semibold">Advanced Amount</label>
          <input
            type="text"
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
            readOnly
          />
        </div>
      </form>
    </div>
  </div>
);
};

export default TravelDesk;
