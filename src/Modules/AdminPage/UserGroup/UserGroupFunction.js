import {
  showErrorMessage,
  showSuccessMessage,
} from "../../../components/Toast/ShowMessage";
import { addUserGroupAPI, editUserGroupAPI } from "./UserGroupAPI";

const addUserGroup = async (
  userGroupData,
  setUserGroupValidation,
  toastRef,
  userGroupList,
  setUserGroupTable,
  userGroupValidationStructure
) => {
  if (
    !userGroupData.groupId ||
    !userGroupData.groupName ||
    !userGroupData.phoneNumber ||
    !userGroupData.groupManager
  ) {
    setUserGroupValidation((prev) => ({
      ...prev,
      groupId: userGroupData.groupId ? true : false,
      groupName: userGroupData.groupName ? true : false,
      phoneNumber: userGroupData.phoneNumber ? true : false,
      groupManager: userGroupData.groupManager ? true : false,
    }));
    showErrorMessage(toastRef, "Validation Error", "Please enter all fields");
    return;
  }
  setUserGroupValidation(userGroupValidationStructure);
  const data = await addUserGroupAPI(userGroupData, toastRef);
  if (data) {
    setUserGroupTable((prev) => ({
      ...prev,
      table: [...prev.table, userGroupData],
    }));
    userGroupList.push(userGroupData);
    showSuccessMessage(toastRef, "Success", "Group Added Successfully");
  }
};
const editUserGroup = async (
  e,
  userGroupTable,
  setUserGroupTable,
  toastRef,
  userGroupList
) => {
  let _TableData = [...userGroupTable.table];
  let { newData } = e;
  const data = await editUserGroupAPI(newData.groupId, newData, toastRef);
  if (data) {
    _TableData[_TableData.findIndex((obj) => obj.groupId === newData.groupId)] =
      newData;
    setUserGroupTable((prev) => ({ ...prev, table: _TableData }));
    userGroupList[
      userGroupList.findIndex((p) => p.groupId === newData.groupId)
    ] = newData;
    showSuccessMessage(toastRef, "Success", "Group Updated Successfully");
  }
};
export { addUserGroup, editUserGroup };
