import { parse } from "date-fns";
import {
  addDesignationAPI,
  addUserGroupAPI,
  editUserGroupAPI,
  getAllDesignationsAPI,
  getAllManagersAPI,
  getDataOnLoad,
} from "./AdminAPI";
import {
  showErrorMessage,
  showSuccessMessage,
} from "../../components/Toast/ShowMessage";

const onPageLoad = async () => {
  let adminInfo = {};
  const data = await getDataOnLoad();
  if (data) {
    data.userdata.forEach((user) => {
      user.initialName = getInitialUserName(user.userName);
      user.dojDate = parse(user.doj, "yyyy-MM-dd", new Date());
      user.dobDate = parse(user.doj, "yyyy-MM-dd", new Date());
    });
    adminInfo = data;
    adminInfo.userCount = {};
    adminInfo.userCount.active = data.userdata.filter(
      (user) => user.active
    ).length;
    adminInfo.userCount.inActive = data.userdata.filter(
      (user) => !user.active
    ).length;
    adminInfo.designations = await getAllDesignations();
  }
  return adminInfo;
};
const getAllDesignations = async () => {
  const data = await getAllDesignationsAPI();
  return data ? data : null;
};
const addDesignation = async (
  designation,
  toastRef,
  setAdminInfo,
  setDesignationTable
) => {
  const data = await addDesignationAPI(designation, toastRef);
  if (data) {
    setAdminInfo((prev) => ({
      ...prev,
      designations: [...prev.designations, designation],
    }));
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
  }
};
// const getManagers = async () => {
//   const data = await getAllManagersAPI();
//   return data ? data : null;
// };
const getInitialUserName = (userName) => {
  if (!userName) return "";

  return userName
    .split(" ")
    .filter((word) => word.length > 0)
    .map((word) => word[0].toUpperCase())
    .join("");
};
const setNewPassword = async (
  resetPassword,
  toastRef,
  hideResetPasswordDialog,
  setResetPasswordValidation
) => {
  if (!resetPassword.newPassword || !resetPassword.confirmPassword) {
    showErrorMessage(toastRef, "Validation Error", "Please enter all fields");
    setResetPasswordValidation((prev) => ({
      ...prev,
      newPassword: resetPassword.newPassword ? false : true,
      confirmPassword: resetPassword.confirmPassword ? false : true,
    }));
    return;
  }
  if (resetPassword.newPassword !== resetPassword.confirmPassword) {
    showErrorMessage(
      toastRef,
      "Validation Error",
      "New password and confirm password should be same"
    );
    setResetPasswordValidation((prev) => ({
      ...prev,
      newPassword: true,
      confirmPassword: false,
    }));
    return;
  }
  hideResetPasswordDialog();
};
const addNewUser = async (
  userData,
  toastRef,
  setUserDataValidation,
  hideUserData,
  userList
) => {
  if (
    !userData.userId ||
    !userData.userName ||
    !userData.employeeId ||
    !userData.phoneNumber ||
    !userData.espHomepage ||
    !userData.department ||
    !userData.passwordExpiryDuraton ||
    !userData.dojDate ||
    !userData.dobDate ||
    !userData.designation ||
    !userData.manager ||
    !userData.group.length ||
    !userData.allotedPages.length
  ) {
    setUserDataValidation((prev) => ({
      ...prev,
      userId: userData.userId ? true : false,
      userName: userData.userName ? true : false,
      employeeId: userData.employeeId ? true : false,
      phoneNumber: userData.phoneNumber ? true : false,
      espHomepage: userData.espHomepage ? true : false,
      department: userData.department ? true : false,
      passwordExpiryDuraton: userData.passwordExpiryDuraton ? true : false,
      doj: userData.dojDate ? true : false,
      dob: userData.dobDate ? true : false,
      designation: userData.designation ? true : false,
      manager: userData.manager ? true : false,
      group: userData.group.length ? true : false,
      allotedPages: userData.allotedPages.length ? true : false,
    }));
    showErrorMessage(toastRef, "Validation Error", "Please enter all fields");
    return;
  }
  if (userList.filter((user) => user.userId === userData.userId).length > 0) {
    setUserDataValidation((prev) => ({
      ...prev,
      userId: userData.userId ? true : false,
    }));
    showErrorMessage(toastRef, "Validation Error", "User ID already exists");
    return;
  }
  if (
    userList.filter((user) => user.employeeId === userData.employeeId).length >
    0
  ) {
    setUserDataValidation((prev) => ({
      ...prev,
      employeeId: userData.employeeId ? true : false,
    }));
    showErrorMessage(
      toastRef,
      "Validation Error",
      "Employee ID already exists"
    );
    return;
  }
  showSuccessMessage(toastRef, "Success", "User Added Successfully");
  hideUserData();
};
const addUserGroup = async (
  userGroupData,
  setUserGroupValidation,
  toastRef,
  setAdminInfo,
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
    setAdminInfo((prev) => ({
      ...prev,
      userGroup: [...prev.userGroup, userGroupData],
    }));
    setUserGroupTable((prev) => ({
      ...prev,
      table: [...prev.table, userGroupData],
    }));
    showSuccessMessage(toastRef, "Success", "Group Added Successfully");
  }
};
const editUserGroup = async (
  e,
  userGroupTable,
  setUserGroupTable,
  toastRef,
  setAdminInfo
) => {
  let _TableData = [...userGroupTable.table];
  let { newData } = e;
  const data = await editUserGroupAPI(newData.groupId, newData, toastRef);
  if (data) {
    let index = _TableData.findIndex((obj) => obj.groupId === newData.groupId);
    if (index === -1) {
      console.error("Group ID not found in the array.");
      return;
    }
    _TableData[index] = newData;
    setUserGroupTable((prev) => ({ ...prev, table: _TableData }));
    setAdminInfo((prev) => ({
      ...prev,
      userGroup: _TableData,
    }));
    showSuccessMessage(toastRef, "Success", "Group Updated Successfully");
  }
};

export {
  onPageLoad,
  addDesignation,
  setNewPassword,
  addNewUser,
  addUserGroup,
  editUserGroup,
};
