import {
  showErrorMessage,
  showSuccessMessage,
} from "../../../components/Toast/ShowMessage";
import { addDesignationAPI, getAllDesignationsAPI } from "./DesignationAPI";

const getAllDesignations = async () => {
  const data = await getAllDesignationsAPI();
  return data ? data : null;
};
const addDesignation = async (
  designation,
  toastRef,
  tableData,
  setDesignationTable,
  setDesignationValidation
) => {
  if (!designation) {
    setDesignationValidation(false);
    showErrorMessage(toastRef, "Error", "Please Enter Designation");
    return;
  }
  const data = await addDesignationAPI(designation, toastRef);
  if (data) {
    tableData.push(designation);
    setDesignationTable((prev) => ({
      ...prev,
      table: [
        ...prev.table,
        {
          designation: designation,
        },
      ],
    }));
    showSuccessMessage(toastRef, "Success", "Designation Added Successfully");
    setDesignationValidation(true);
  }
};
export { getAllDesignations, addDesignation };
