import React, { useState } from "react";
import { PencilSquareIcon, TrashIcon, CheckIcon, ArrowDownTrayIcon, PlusIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";




const TravelDeskDataTable = () => {
    const [rows, setRows] = useState([]);

    const handleAdd = () => {
        setRows([
            ...rows,
            {
                mode: "",
                fromDate: "",
                comment: "",
                isEditable: true, // new rows are editable initially
            },
        ]);
    };

    const handleChange = (index, field, value) => {
        const updatedRows = [...rows];
        updatedRows[index][field] = value;
        setRows(updatedRows);
    };

    const handleSave = (index) => {
        const row = rows[index];
        if (!row.mode || !row.fromDate) {
            alert("Please select both Mode and From Date before saving.");
            return;
        }

        const updatedRows = [...rows];
        updatedRows[index].isEditable = false;
        setRows(updatedRows);
    };

    const handleEdit = (index) => {
        const updatedRows = [...rows];
        updatedRows[index].isEditable = true;
        setRows(updatedRows);
    };

    const handleDelete = (index) => {
        const updatedRows = [...rows];
        updatedRows.splice(index, 1);
        setRows(updatedRows);
    };

    const handleExport = () => {
        if (rows.length === 0) {
            alert("No data available to export.");
            return;
        }

        // Prepare data for Excel
        const exportData = rows.map(({ mode, fromDate, comment }) => ({
            Mode: mode,
            "From Date": fromDate,
            Comment: comment,
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "TravelData");

        const excelBuffer = XLSX.write(workbook, {
            bookType: "xlsx",
            type: "array",
        });

        const fileData = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(fileData, "TravelData.xlsx");
    };

    return (
        <section className="bg-gray-50 dark:bg-gray-900 py-3 sm:py-5">
            <div className="px-4 mx-auto max-w-[85rem] lg:px-12">
                <div className="relative overflow-hidden">
                    {/* Header */}
                    <div className="flex flex-col px-4 py-3 space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 lg:space-x-4">
                        <div className="flex items-center flex-1 space-x-4">
                            <h5 className="text-gray-500 text-lg font-semibold">
                                Mode of Transport
                            </h5>
                        </div>
                        <div className="flex flex-col flex-shrink-0 space-y-3 md:flex-row md:items-center md:space-y-0 md:space-x-3">
                            <button
                                type="button"
                                onClick={handleAdd}
                                className="bg-white text-black border border-black px-4 py-2 rounded hover:bg-black hover:text-Black transition flex items-center"
                            >
                                <PlusIcon className="w-5 h-5 mr-2" />
                                Add
                            </button>
                            <button
                                type="button"
                                onClick={handleExport}
                                className="bg-white text-black border border-black px-4 py-2 rounded hover:bg-black hover:text-Black transition flex items-center"
                            >
                                <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
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
                                        <th className="px-4 py-3 w-45">Mode</th>
                                        <th className="px-4 py-3 w-40">From Date</th>
                                        <th className="px-4 py-3 w-96">Comment</th> {/* Wider for comments */}
                                        <th className="px-4 py-3 w-20">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, index) => (
                                        <tr key={index} className="border-b dark:border-gray-700 text-center">
                                            <td className="px-4 py-3 text-center">
                                                {row.isEditable ? (
                                                    <div className="relative">
                                                        <select
                                                            value={row.mode}
                                                            onChange={(e) =>
                                                                handleChange(index, "mode", e.target.value)
                                                            }
                                                            className="appearance-none bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-10"
                                                        >
                                                            <option value="">Select</option>
                                                            <option value="Train">Train</option>
                                                            <option value="Flight">Flight</option>
                                                            <option value="Rental Car">Rental Car</option>
                                                            <option value="Others">Others</option>
                                                        </select>
                                                        <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none pl-8" />
                                                    </div>
                                                ) : (
                                                    row.mode
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {row.isEditable ? (
                                                    <input
                                                        type="date"
                                                        value={row.fromDate}
                                                        onChange={(e) =>
                                                            handleChange(index, "fromDate", e.target.value)
                                                        }
                                                        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
                                                    />
                                                ) : (
                                                    row.fromDate
                                                )}
                                            </td>
                                            <td className="px-2 py-2 w-[300px] max-w-[300px] align-middle text-center">
                                                {row.isEditable ? (
                                                    <div className="flex items-center justify-center h-full w-full">
                                                        <input
                                                            type="text"
                                                            value={row.comment}
                                                            onChange={(e) => handleChange(index, "comment", e.target.value)}
                                                            placeholder="Enter comment"
                                                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg w-full p-2"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center h-full w-full break-words text-center px-2 py-2">
                                                        {row.comment}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 align-middle">
                                                <div className="flex items-center gap-2 justify-start h-full">
                                                    {row.isEditable ? (
                                                        <button
                                                            onClick={() => handleSave(index)}
                                                            className="text-green-600 hover:text-green-800 p-0 m-0 flex items-center justify-center h-6 w-6"
                                                            title="Save"
                                                        >
                                                            <CheckIcon className="h-5 w-5" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleEdit(index)}
                                                            className="text-blue-600 hover:text-blue-800 p-0 m-0 flex items-center justify-center h-6 w-6"
                                                            title="Edit"
                                                        >
                                                            <PencilSquareIcon className="h-5 w-5" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(index)}
                                                        className="text-red-600 hover:text-red-800 p-0 m-0 flex items-center justify-center h-6 w-6"
                                                        title="Delete"
                                                    >
                                                        <TrashIcon className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                            </table>

                            {/* Empty state */}
                            {rows.length === 0 && (
                                <div className="text-center text-gray-400 py-4">
                                    No data added yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TravelDeskDataTable;