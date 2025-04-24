import React from "react";
import { PencilSquareIcon, TrashIcon, CheckIcon, ArrowDownTrayIcon, PlusIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "react-datepicker/dist/react-datepicker.css";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { showWarningMessage } from "../../components/Toast/ShowMessage";



const AccommodationTable = ({ disableAddRow, accommodations, setAccommodations }) => {
    //const [accommodations, setAccommodations] = useState([]);

    const toastRef = useRef(null);

    const handleAdd = () => {
        if (disableAddRow) {
            showWarningMessage(toastRef,"Please fill all required fields before adding a row.");
            return;
        }

        setAccommodations([
            ...accommodations,
            {
                type: "",              // Type of stay
                numberOfRooms: "",         // Number of rooms
                checkIn: "",       // Check-in date
                checkOut: "",      // Check-out date
                numberOfNights: "",        // Automatically calculated
                comment: "",           // Optional comment
                isEditable: true,      // Row is editable on creation
            },
        ]);
    };


    const handleChange = (index, field, value) => {
        const updatedRows = [...accommodations];
        updatedRows[index][field] = value;

        const checkIn = updatedRows[index].checkIn;
        const checkOut = updatedRows[index].checkOut;

        // Auto-calculate No. of Nights if both dates are filled
        if (checkIn && checkOut) {
            const inDate = new Date(checkIn);
            const outDate = new Date(checkOut);

            if (!isNaN(inDate) && !isNaN(outDate) && outDate >= inDate) {
                const diffTime = outDate - inDate;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                updatedRows[index].numberOfNights = diffDays;
            } else {
                updatedRows[index].numberOfNights = "";
            }
        }

        setAccommodations(updatedRows);
    };


   

    const handleSave = (index) => {
        const row = accommodations[index];

        // Validate required fields
        if (!row.type || !row.checkIn || !row.checkOut || !row.numberOfRooms) {
            showWarningMessage(toastRef,"Please fill all required fields: Type, No. of Rooms, Check-In Date, and Check-Out Date.");
            return;
        }

        const updatedRows = [...accommodations];
        updatedRows[index].isEditable = false;
        setAccommodations(updatedRows);
    };


    const handleEdit = (index) => {
        const updatedRows = [...accommodations];
        updatedRows[index].isEditable = true;
        setAccommodations(updatedRows);
    };

    const handleDelete = (index) => {
        const updatedRows = [...accommodations];
        updatedRows.splice(index, 1);
        setAccommodations(updatedRows);
    };

    const handleExport = () => {
        if (accommodations.length === 0) {
            showWarningMessage(toastRef,"No data available to export.");
            return;
        }

        // Prepare data for Excel
        const exportData = accommodations.map(({ type, numberOfRooms, checkIn, checkOut, numberOfNights, comment }) => ({
            Type: type,
            "No. of Rooms": numberOfRooms,
            "Check-In Date": checkIn,
            "Check-Out Date": checkOut,
            "No. of Nights": numberOfNights,
            Comment: comment,
        }));


        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "AccomodationData");

        const excelBuffer = XLSX.write(workbook, {
            bookType: "xlsx",
            type: "array",
        });

        const fileData = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(fileData, "AccomodationData.xlsx");
    };

    return (
        <>
            <Toast ref={toastRef} />
        <section className="bg-gray-50 dark:bg-gray-900 py-3 sm:py-5">
            <div className="px-4 mx-auto max-w-[85rem] lg:px-12">
                <div className="relative overflow-hidden">
                    {/* Header */}
                    <div className="flex flex-col px-4 space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 lg:space-x-4">
                        <div className="flex items-center flex-1 space-x-4">
                            <h5 className="text-gray-500 text-lg font-semibold">
                                Reservation of Accommodation
                            </h5>
                        </div>
                        <div className="flex flex-col flex-shrink-0 space-y-2 md:flex-row md:items-center md:space-y-0 md:space-x-2">
                            <button
                                type="button"
                                onClick={handleAdd}
                                disabled={disableAddRow}
                                className="bg-white text-black border border-black px-3 py-1.5 rounded hover:bg-black hover:text-Black transition flex items-center text-sm"
                            >
                                <PlusIcon className="w-4 h-4 mr-1" />
                                Add
                            </button>
                            <button
                                type="button"
                                onClick={handleExport}
                                className="bg-white text-black border border-black px-3 py-1.5 rounded hover:bg-black hover:text-Black transition flex items-center text-sm"
                            >
                                <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                                Export
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="mt-4 border border-red-200 rounded-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 dark:bg-gray-200 dark:text-gray-400 text-center">
                                    <tr>
                                        <th className="px-2 py-3 w-[15%]">Type</th>
                                        <th className="px-2 py-3 w-[15%]">No. of Rooms</th>
                                        <th className="px-2 py-3 w-[15%]">Check-In Date</th>
                                        <th className="px-2 py-3 w-[15%]">Check-Out Date</th>
                                        <th className="px-2 py-3 w-[15%]">No. of Nights</th>
                                        <th className="px-2 py-3 w-[15%]">Comment</th>
                                        <th className="px-2 py-3 w-[15%]">Actions</th>
                                    </tr>

                                </thead>
                                <tbody>
                                    {accommodations.map((row, index) => (
                                        <tr key={index} className="border-b dark:border-gray-700 text-center">
                                            <td className="px-1 py-1 text-left text-xs">
                                                {row.isEditable ? (
                                                    <div className="relative w-[180px] ml-4"> {/* Adjusted width and added left margin here */}
                                                        <select
                                                            value={row.type}
                                                            onChange={(e) => handleChange(index, "type", e.target.value)}
                                                            className="appearance-none bg-white border border-gray-300 text-gray-700 text-xs rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full h-9 px-3 py-1 text-left"

                                                        >
                                                            <option value="">Select</option>
                                                            <option value="Hotel">Hotel</option>
                                                            <option value="Customer Guest House">Customer Guest House</option>
                                                            <option value="Service Appartment">Service Appartment</option>
                                                            <option value="Long-Term Rent">Long-Term Rent</option>
                                                            <option value="Own Arrangement">Own Arrangement</option>
                                                            <option value="Others">Others</option>
                                                        </select>
                                                        <ChevronDownIcon
                                                            className="w-3 h-3 text-gray-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none"
                                                        />
                                                    </div>

                                                ) : (
                                                    <span className="text-xs">{row.type}</span>
                                                )}
                                            </td>

                                            <td className="px-2 py-2 w-[300px] max-w-[300px] align-middle text-center">
                                                {row.isEditable ? (
                                                    <div className="flex items-center justify-center h-full w-full">
                                                        <input
                                                            type="number"
                                                            value={row.numberOfRooms}
                                                            onChange={(e) => handleChange(index, "numberOfRooms", e.target.value)}
                                                            placeholder="Enter No of Rooms"
                                                            className="bg-white border border-gray-300 text-gray-900 text-xs rounded-lg w-full p-2"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center h-full w-full px-2 py-2">
                                                        <p className="break-words whitespace-pre-wrap text-center">
                                                            {row.numberOfRooms}
                                                        </p>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Check-In Date */}
                                            <td className="px-4 py-3 text-center">
                                                {row.isEditable ? (
                                                    <input
                                                        type="date"
                                                        value={row.checkIn}
                                                        onChange={(e) =>
                                                            handleChange(index, "checkIn", e.target.value)
                                                        }
                                                        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-md w-full px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                                                    />
                                                ) : (
                                                    row.checkIn
                                                )}
                                            </td>

                                            {/* Check-Out Date */}
                                            <td className="px-4 py-3 text-center">
                                                {row.isEditable ? (
                                                    <input
                                                        type="date"
                                                        value={row.checkOut}
                                                        onChange={(e) =>
                                                            handleChange(index, "checkOut", e.target.value)
                                                        }
                                                        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-md w-full px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                                                    />
                                                ) : (
                                                    row.checkOut
                                                )}
                                            </td>


                                            <td className="px-4 py-3 text-center">
                                                {row.isEditable ? (
                                                    <input
                                                        type="text"
                                                        value={row.numberOfNights || ""}
                                                        readOnly
                                                        className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-md w-full px-3 py-2"
                                                    />
                                                ) : (
                                                    row.numberOfNights
                                                )}
                                            </td>

                                            <td className="px-2 py-2 w-[300px] max-w-[300px] text-center align-middle">
                                                {row.isEditable ? (
                                                    <div className="flex items-center justify-center w-full">
                                                        <input
                                                            type="text"
                                                            value={row.comment}
                                                            onChange={(e) => handleChange(index, "comment", e.target.value)}
                                                            placeholder="Enter comment"
                                                            className="bg-white border border-gray-300 text-gray-900 text-xs rounded-lg w-full p-2"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="px-2 py-1">
                                                        <p className="break-words whitespace-pre-wrap text-center">
                                                            {row.comment}
                                                        </p>
                                                    </div>
                                                )}
                                            </td>



                                            <td className="px-4 py-2 align-middle">
                                                <div className="flex items-center space-x-4 justify-start">
                                                    {row.isEditable ? (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleSave(index);
                                                            }}
                                                            className="text-green-600 hover:text-green-800"
                                                            title="Save"
                                                        >
                                                            <CheckIcon className="h-12 w-12" /> {/* icon size increased */}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleEdit(index);
                                                            }}
                                                            className="text-blue-600 hover:text-blue-800"
                                                            title="Edit"
                                                        >
                                                            <PencilSquareIcon className="h-12 w-12" /> {/* icon size increased */}
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleDelete(index);
                                                        }}
                                                        className="text-red-600 hover:text-red-800"
                                                        title="Delete"
                                                    >
                                                        <TrashIcon className="h-12 w-12" /> {/* icon size increased */}
                                                    </button>
                                                </div>
                                            </td>




                                        </tr>
                                    ))}
                                </tbody>

                            </table>

                            {/* Empty state */}
                            {accommodations.length === 0 && (
                                <div className="text-center text-gray-400 py-4">
                                    No data added yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
        </>
    );
};

export default AccommodationTable;