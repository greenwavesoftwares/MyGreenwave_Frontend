import { format } from "date-fns";
import {
  showErrorMessage,
  showSuccessMessage,
} from "../../../components/Toast/ShowMessage";
import { addNewUserAPI, editUserAPI } from "./UserInfoAPI";
import { getInitial } from "../AdminFunction";
import { addLogForChanges } from "../UserLog/UserLogFunction";
import { getUserData } from "../../Login/Encrypt";

const yyyyMMdd = "yyyy-MM-dd";
const userDetails = getUserData()?.userDetails;

const validateFormValues = (
  editMode,
  userList,
  userData,
  userDataValidationStructure,
  setUserDataValidation,
  toastRef
) => {
  // eslint-disable-next-line no-useless-escape
  const isValidEmail = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g;
  if (
    (!editMode && (!userData.userId || !userData.employeeId)) ||
    !userData.userName ||
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
    return false;
  }
  setUserDataValidation(userDataValidationStructure);
  if (!editMode && !userData.userId.match(isValidEmail)) {
    setUserDataValidation((prev) => ({
      ...prev,
      userId: false,
    }));
    showErrorMessage(toastRef, "Validation Error", "Invalid Email ID");
    return false;
  }
  if (
    !editMode &&
    userList.filter((user) => user.userId === userData.userId).length > 0
  ) {
    setUserDataValidation((prev) => ({
      ...prev,
      userId: false,
    }));
    showErrorMessage(toastRef, "Validation Error", "User ID already exists");
    return false;
  }
  if (
    !editMode &&
    userList.filter((user) => user.employeeId == userData.employeeId).length > 0
  ) {
    setUserDataValidation((prev) => ({
      ...prev,
      employeeId: false,
    }));
    showErrorMessage(
      toastRef,
      "Validation Error",
      "Employee ID already exists"
    );
    return false;
  }
  if (!userData.allotedPages.includes(userData.espHomepage)) {
    setUserDataValidation((prev) => ({
      ...prev,
      espHomepage: false,
    }));
    showErrorMessage(toastRef, "Validation Error", "Select a Home Page");
    return false;
  }
  return true;
};
const addOrEditUser = async (
  editMode,
  userData,
  toastRef,
  setUserDataValidation,
  dialogVisible,
  userList,
  userDataValidationStructure,
  setAdminTable,
  showActiveData,
  userGroupList,
  prevUserData
) => {
  if (
    !validateFormValues(
      editMode,
      userList,
      userData,
      userDataValidationStructure,
      setUserDataValidation,
      toastRef
    )
  )
    return;
  userData.dob = format(userData.dobDate, yyyyMMdd);
  userData.doj = format(userData.dojDate, yyyyMMdd);
  userData.initial = getInitial(userData.userName);
  userData.groupNames = userData.group.map(
    (g) => userGroupList.filter((p) => p.groupId === g)[0].groupName
  );
  const data = editMode
    ? await editUserAPI(userData, toastRef)
    : await addNewUserAPI(userData, toastRef);
  if (data) {
    if (editMode)
      userList[userList.findIndex((p) => p.userId === userData.userId)] =
        userData;
    else userList.push(userData);
    setAdminTable((prev) => ({
      ...prev,
      table: userList.filter((p) => p.active === showActiveData),
    }));
    addLogForChanges(editMode, prevUserData, userData, userDetails.userId);
    showSuccessMessage(
      toastRef,
      "Success",
      `User ${editMode ? "Edited" : "Added"}  Successfully`
    );
    dialogVisible = false;
  }
};

export { addOrEditUser };
