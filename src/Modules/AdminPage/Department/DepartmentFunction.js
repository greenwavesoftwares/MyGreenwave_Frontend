import {
  showErrorMessage,
  showSuccessMessage,
} from "../../../components/Toast/ShowMessage";
import { addDepartmentAPI, editDepartmentAPI } from "./DepartmentAPI";

const addDepartment = async (
  departmentData,
  setDepartmentValidation,
  toastRef,
  departmentList,
  setDepartmentTable,
  departmentValidationStructure
) => {
  if (
    !departmentData.deptId ||
    !departmentData.deptName ||
    !departmentData.deptManager
  ) {
    setDepartmentValidation((prev) => ({
      ...prev,
      deptId: departmentData.deptId ? true : false,
      deptName: departmentData.deptName ? true : false,
      deptManager: departmentData.deptManager ? true : false,
    }));
    showErrorMessage(toastRef, "Validation Error", "Please enter all fields");
    return;
  }
  setDepartmentValidation(departmentValidationStructure);
  const data = await addDepartmentAPI(departmentData, toastRef);
  if (data) {
    departmentList.push(departmentData);
    setDepartmentTable((prev) => ({
      ...prev,
      table: [...prev.table, departmentData],
    }));
    showSuccessMessage(toastRef, "Success", "Department Added Successfully");
  }
};
const editDepartment = async (
  e,
  departmentTable,
  setDepartmentTable,
  toastRef,
  departmentList
) => {
  let _TableData = [...departmentTable.table];
  let { newData } = e;
  const data = await editDepartmentAPI(newData.deptId, newData, toastRef);
  if (data) {
    _TableData[_TableData.findIndex((obj) => obj.deptId === newData.deptId)] =
      newData;
    setDepartmentTable((prev) => ({ ...prev, table: _TableData }));
    departmentList[
      departmentList.findIndex((p) => p.deptId === newData.deptId)
    ] = newData;
    showSuccessMessage(toastRef, "Success", "Department Updated Successfully");
  }
};
export { addDepartment, editDepartment };
