import { format } from "date-fns";
import { addUserLogAPI, getUserLogsAPI } from "./UserLogAPI";

const logStructure = {
  transactionId: "",
  userId: "",
  tableName: "UserCredentials",
  doneBy: "",
  data: "",
  reason: "",
  oldData: {},
  newData: {},
};
const yyyyMMddHHmmssSSS = "yyyyMMddHHmmssSSS";

const getUserLogs = async (userId) => {
  let data = await getUserLogsAPI(userId);
  
  if (data) {
    data.forEach((d) => {
      d.oldData = d.oldData.length>0&&convertJSONToUserData(JSON.parse(d.oldData));
      d.newData = d.newData.length>0&&convertJSONToUserData(JSON.parse(d.newData));
    });
    
    return data;
  }
  return null;
};
const addLogForChanges = async (
  editMode,
  prevData,
  newData,
  doneBy,
  toastRef
) => {
  let logData = logStructure;
  logData.transactionId = "T" + format(new Date(), yyyyMMddHHmmssSSS);
  logData.userId = newData.userId;
  logData.doneBy = doneBy;
  logData.data = editMode
    ? await getChangeLogAsString(prevData, newData)
    : "New user created having id: " + newData.userId;
  logData.oldData = convertUserDataToJSON(prevData);
  logData.newData = convertUserDataToJSON(newData);
  addUserLogAPI(logData, toastRef);
};

const getChangeLogAsString = async (prevData, newData) => {
  let tempChangeString = "";

  if (newData.userName !== prevData.userName) {
    tempChangeString += `Username changed from ${prevData.userName} to ${newData.userName}\n`;
  }

  if (newData.phoneNumber !== prevData.phoneNumber) {
    tempChangeString += `Phone Number changed from ${prevData.phoneNumber} to ${newData.phoneNumber}\n`;
  }

  // ESS specific changes
  if (newData.designation !== prevData.designation) {
    tempChangeString += `Designation changed from ${prevData.designation} to ${newData.designation}\n`;
  }

  if (newData.deviceSerialNo !== prevData.deviceSerialNo) {
    tempChangeString += `Device Serial No. changed from ${prevData.deviceSerialNo} to ${newData.deviceSerialNo}\n`;
  }

  if (newData.computerName !== prevData.computerName) {
    tempChangeString += `Computer Name changed from ${prevData.computerName} to ${newData.computerName}\n`;
  }

  if (newData.operatingSystem !== prevData.operatingSystem) {
    tempChangeString += `Laptop Operating System changed from ${prevData.operatingSystem} to ${newData.operatingSystem}\n`;
  }

  if (newData.systemManufacturer !== prevData.systemManufacturer) {
    tempChangeString += `Laptop System Manufacturer changed from ${prevData.systemManufacturer} to ${newData.systemManufacturer}\n`;
  }

  if (newData.systemModel !== prevData.systemModel) {
    tempChangeString += `Laptop System Model changed from ${prevData.systemModel} to ${newData.systemModel}\n`;
  }

  if (newData.memory !== prevData.memory) {
    tempChangeString += `Laptop Memory changed from ${prevData.memory} to ${newData.memory}\n`;
  }

  if (newData.processor !== prevData.processor) {
    tempChangeString += `Laptop Processor changed from ${prevData.processor} to ${newData.processor}\n`;
  }

  // Group changes
  const removedGroups = prevData.group.filter(
    (group) => !newData.group.includes(group)
  );
  if (removedGroups.length > 0) {
    tempChangeString += `${removedGroups.join(
      ","
    )} groups removed from the list.\n`;
  }

  const addedGroups = newData.group.filter(
    (group) => !prevData.group.includes(group)
  );
  if (addedGroups.length > 0) {
    tempChangeString += `${addedGroups.join(",")} groups add to the list.\n`;
  }

  if (newData.department !== prevData.department) {
    tempChangeString += `Department changed from ${prevData.department} to ${newData.department}\n`;
  }

  if (newData.espHomepage !== prevData.espHomepage) {
    tempChangeString += `Homepage changed from ${prevData.espHomepage} to ${newData.espHomepage}\n`;
  }

  if (newData.active !== prevData.active) {
    tempChangeString += `User changed from ${
      prevData.active ? "Active" : "InActive"
    } to ${newData.active ? "Active" : "InActive"}\n`;
  }

  if (newData.firstLoginRequired !== prevData.firstLoginRequired) {
    tempChangeString += `First Login required changed from ${prevData.firstLoginRequired} to ${newData.firstLoginRequired}\n`;
  }

  if (newData.passwordExpiryDuraton !== prevData.passwordExpiryDuraton) {
    tempChangeString += `Expiry Date duration from ${prevData.passwordExpiryDuraton} to ${newData.passwordExpiryDuraton}\n`;
  }

  // Allotted Pages
  const removedPages = prevData.allotedPages.filter(
    (page) => !newData.allotedPages.includes(page)
  );
  if (removedPages.length > 0) {
    tempChangeString += `${removedPages.join(
      ","
    )} pages removed from the list.\n`;
  }

  const addedPages = newData.allotedPages.filter(
    (page) => !prevData.allotedPages.includes(page)
  );
  if (addedPages.length > 0) {
    tempChangeString += `${addedPages.join(",")} pages added to the list.\n`;
  }

  return tempChangeString;
};
const convertUserDataToJSON = (data) => {
  return JSON.stringify({
    userID: data.userId || "",
    userName: data.userName || "",
    password: data.password || "",
    group: data.group || [],
    phone: data.phoneNumber || "",
    espHomePage: data.espHomepage || "",
    allotedPages: data.allotedPages || [],
    active: data.active ?? false,
    createdOn: data.createdOn || "",
    modifiedOn: data.modifiedOn || "",
    createdBy: data.createdBy || "",
    modifiedBy: data.modifiedBy || "",
    department: data.department || "",
    employeeId: data.employeeId || "",
    designation: data.designation || "",
    deviceSerialNo: data.deviceSerialNo || "",
    computerName: data.computerName || "",
    operatingSystem: data.operatingSystem || "",
    systemManufacturer: data.systemManufacturer || "",
    systemModel: data.systemModel || "",
    memory: data.memory || "",
    processor: data.processor || "",
    manager: data.manager || "",
    firstLoginRequired: data.firstLoginRequired ?? false,
    passwordExpiryDuration: data.passwordExpiryDuraton ?? "",
    passwordExpiryDate: data.passwordExpiryDate || "",
    lastLogIn: data.lastLogin || "",
    dob: data.dob || "",
    doj: data.doj || "",
    espAllottedPageList: data.espAllottedPageList || [],
    workflowAllottedPageList: data.workflowAllottedPageList || [],
    allEspPageList: data.allEspPageList || [],
    allWorkflowPageList: data.allWorkflowPageList || [],
  });
};
const convertJSONToUserData = (data) => {
  return {
    userId: data.userID ?? "",
    userName: data.userName ?? "",
    employeeId: data.employeeId ?? "",
    password: data.password ?? "",
    phoneNumber: data.phone ?? "",
    espHomepage: data.espHomePage ?? "",
    workflowHomepage: data.workFlowHomePage ?? "",
    active: data.active ?? false,
    createdOn: data.createdOn ?? "",
    modifiedOn: data.modifiedOn ?? "",
    createdBy: data.createdBy ?? "",
    modifiedBy: data.modifiedBy ?? "",
    department: data.department ?? "",
    firstLoginRequired: data.firstLoginRequired ?? false,
    passwordExpiryDuraton: data.passwordExpiryDuration ?? "",
    passwordExpiryDate: data.passwordExpiryDate ?? "",
    lastLogin: data.lastLogIn ?? "",
    dob: data.dob || "",
    doj: data.doj || "",
    designation: data.designation ?? "",
    deviceSerialNo: data.deviceSerialNo ?? "",
    computerName: data.computerName ?? "",
    operatingSystem: data.operatingSystem ?? "",
    systemManufacturer: data.systemManufacturer ?? "",
    systemModel: data.systemModel ?? "",
    memory: data.memory ?? "",
    processor: data.processor ?? "",
    manager: data.manager || "",
    group: data.group || [],
    allotedPages: data.allotedPages || [],
    espAllottedPageList: data.espAllottedPageList || [],
    workflowAllottedPageList: data.workflowAllottedPageList || [],
    allEspPageList: data.allEspPageList || [],
    allWorkflowPageList: data.allWorkflowPageList || [],
  };
};

export { addLogForChanges, convertJSONToUserData, getUserLogs };
