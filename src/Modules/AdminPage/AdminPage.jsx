import React, { useEffect, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Chip, Container, Grid } from "@mui/material";
import { TabMenu } from "primereact/tabmenu";
import { Badge } from "primereact/badge";
import {
  addDesignation,
  addNewUser,
  addUserGroup,
  editUserGroup,
  onPageLoad,
  setNewPassword,
} from "./AdminFunction";
import "./AdminPage.css";
import DialogComponent from "../../components/Dialog/DialogComponent";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Avatar } from "primereact/avatar";
import DatePicker from "../../components/DatePicker/DatePicker";
import Toast from "../../components/Toast/Toast";
import { FilterMatchMode } from "primereact/api";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { TabPanel, TabView } from "primereact/tabview";
import { ToggleButton } from "primereact/togglebutton";
import { InputNumber } from "primereact/inputnumber";
import { ListBox } from "primereact/listbox";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CropSquareIcon from "@mui/icons-material/CropSquare";
import SpeedDial from "../../components/SpeedDial/SpeedDial";
import { Password } from "primereact/password";
import { MultiSelect } from "primereact/multiselect";
import { Checkbox } from "primereact/checkbox";

const AdminPage = () => {
  //Table structure and Validations for admin page
  const dialogVisible = {
    addUserDialogVisible: false,
    editUserDialogVisible: false,
    designationDialogVisible: false,
    userGroupDialogVisible: false,
    userDepartmentDialogVisible: false,
    resetPasswordDialogVisible: false,
    userLogsDialogVisible: false,
  };
  const tableStructure = () => ({
    table: [],
    filterText: "",
    filterStructure: {
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    },
  });
  const userDataStructure = () => ({
    userId: "",
    userName: "",
    employeeId: "",
    password: "",
    phoneNumber: "",
    espHomepage: "",
    workflowHomepage: "",
    active: true,
    createdOn: "",
    modifiedOn: "",
    createdBy: "",
    modifiedBy: "",
    department: "",
    firstLoginRequired: true,
    passwordExpiryDuraton: 90,
    passwordExpiryDate: "",
    lastLogin: "",
    dob: "",
    doj: "",
    dobDate: "",
    dojDate: "",
    designation: "",
    deviceSerialNo: "",
    computerName: "",
    operatingSystem: "",
    systemManufacturer: "",
    systemModel: "",
    memory: "",
    processor: "",
    manager: "",
    group: [],
    groupNames: [],
    allotedPages: [],
    espAllottedPageList: [],
    workflowAllottedPageList: [],
    allEspPageList: [],
    allWorkflowPageList: [],
  });
  const userDataValidationStructure = () => ({
    userId: true,
    userName: true,
    employeeId: true,
    phoneNumber: true,
    espHomepage: true,
    active: true,
    department: true,
    passwordExpiryDuraton: true,
    doj: true,
    dob: true,
    designation: true,
    manager: true,
    group: true,
    allotedPages: true,
  });
  const resetPasswordStructure = {
    userId: "",
    newPassword: "",
    confirmPassword: "",
  };
  const resetPasswordValidationStructure = {
    newPassword: true,
    confirmPassword: true,
  };
  const userGroupStructure = {
    groupId: null,
    active: true,
    phoneNumber: null,
    homePage: "",
    groupManager: null,
    groupName: null,
  };
  const userGroupValidationStructure = {
    groupId: true,
    phoneNumber: true,
    groupManager: true,
    groupName: true,
  };

  const toastRef = useRef(null);
  const [adminInfo, setAdminInfo] = useState({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [userData, setUserData] = useState(userDataStructure);
  const [userDataValidation, setUserDataValidation] = useState(
    userDataValidationStructure
  );
  const [adminDialogVisible, setAdminDialogVisible] = useState(dialogVisible);
  const [adminTable, setAdminTable] = useState(tableStructure);
  const [designationTable, setDesignationTable] = useState(tableStructure);
  const [userGroupTable, setUserGroupTable] = useState(tableStructure);
  const [userDepartmentTable, setUserDepartmentTable] =
    useState(tableStructure);
  const [newDesignation, setNewDesignation] = useState("");
  const [resetPassword, setResetPassword] = useState(resetPasswordStructure);
  const [resetPasswordValidation, setResetPasswordValidation] = useState(
    resetPasswordValidationStructure
  );
  const [userGroupData, setUserGroupData] = useState(userGroupStructure);
  const [userGroupValidation, setUserGroupValidation] = useState(
    userGroupValidationStructure
  );
  const itemRenderer = (item, itemIndex, userCount, severity) => (
    <a
      className="p-menuitem-link flex align-items-center gap-2 bg-gray-50"
      onClick={() => {
        itemIndex === 0
          ? setAdminTable((prev) => ({
              ...prev,
              table: adminInfo.userdata.filter((row) => row.active),
            }))
          : setAdminTable((prev) => ({
              ...prev,
              table: adminInfo.userdata.filter((row) => !row.active),
            }));
        setActiveIndex(itemIndex);
      }}
    >
      <Badge severity={severity} />
      <span className="font-bold p-overlay-badge">
        {item.name}
        <Badge value={userCount} severity={severity} />
      </span>
    </a>
  );
  const adminHeaderMenuItems = [
    {
      name: "Active Users",
      template: (item) =>
        itemRenderer(item, 0, adminInfo?.userCount?.active, "success"),
    },
    {
      name: "Inactive Users",
      template: (item) =>
        itemRenderer(item, 1, adminInfo?.userCount?.inActive, "danger"),
    },
  ];
  const adminHeader = (
    <div className="flex justify-content-between align-items-center">
      <TabMenu
        model={adminHeaderMenuItems}
        activeIndex={activeIndex}
        onTabChange={(e) => setActiveIndex(e.index)}
      />
      <IconField iconPosition="left">
        <InputIcon className="pi pi-search" />
        <InputText
          value={adminTable.filterText}
          onChange={(e) => {
            const value = e.target.value;
            let _filters = adminTable.filterStructure;
            _filters["global"].value = value;
            setAdminTable((p) => ({
              ...p,
              filterStructure: _filters,
              filterText: value,
            }));
          }}
          placeholder="Search"
        />
      </IconField>
    </div>
  );
  const designationHeader = (
    <div className="flex justify-content-end">
      <IconField iconPosition="left">
        <InputIcon className="pi pi-search" />
        <InputText
          value={designationTable.filterText}
          onChange={(e) => {
            const value = e.target.value;
            let _filters = designationTable.filterStructure;
            _filters["global"].value = value;
            setDesignationTable((p) => ({
              ...p,
              filterStructure: _filters,
              filterText: value,
            }));
          }}
          placeholder="Search"
        />
      </IconField>
    </div>
  );
  const userGroupHeader = (
    <div className="flex justify-content-between align-items-center">
      <span>User Groups</span>
      <IconField iconPosition="left">
        <InputIcon className="pi pi-search" />
        <InputText
          value={userGroupTable.filterText}
          onChange={(e) => {
            const value = e.target.value;
            let _filters = userGroupTable.filterStructure;
            _filters["global"].value = value;
            setUserGroupTable((p) => ({
              ...p,
              filterStructure: _filters,
              filterText: value,
            }));
          }}
          placeholder="Search"
        />
      </IconField>
    </div>
  );
  const allocatedPagesTemplate = (option) => {
    return (
      <div className="flex align-items-center">
        {userData.allotedPages.includes(option) ? (
          <CheckBoxIcon className="mr-2" color="info" />
        ) : (
          <CropSquareIcon className="mr-2" color="error" />
        )}
        <div>{option}</div>
      </div>
    );
  };
  useEffect(() => {
    const init = async () => {
      const data = await onPageLoad();
      if (data) {
        setAdminInfo(data);
        setAdminTable((prev) => ({
          ...prev,
          table: data.userdata.filter((row) => row.active),
        }));
      } else {
        console.error("Error fetching user data");
      }
    };

    init();
  }, []);
  const showUserDataForAdd = () => {
    setUserData(userDataStructure);
    setAdminDialogVisible((prev) => ({
      ...prev,
      addUserDialogVisible: true,
    }));
  };
  const showUserDataForEdit = (event) => {
    setUserData(event.data);
    setAdminDialogVisible((prev) => ({
      ...prev,
      editUserDialogVisible: true,
    }));
  };
  const hideUserData = () => {
    setUserData(userDataStructure);
    setAdminDialogVisible(dialogVisible);
    setUserDataValidation(userDataValidationStructure);
  };
  const showDesignationDialog = () => {
    setDesignationTable((prev) => ({
      ...prev,
      table: adminInfo.designations.map((item) => ({
        designation: item,
      })),
    }));
    setAdminDialogVisible((prev) => ({
      ...prev,
      designationDialogVisible: true,
    }));
  };
  const hideDesignationDialog = () => {
    setDesignationTable(tableStructure);
    setAdminDialogVisible((prev) => ({
      ...prev,
      designationDialogVisible: false,
    }));
  };
  const showUserGroupDialog = () => {
    setUserGroupTable((prev) => ({
      ...prev,
      table: adminInfo.userGroup,
    }));
    setAdminDialogVisible((prev) => ({
      ...prev,
      userGroupDialogVisible: true,
    }));
  };
  const hideUserGroupDialog = () => {
    setUserGroupTable(tableStructure);
    setAdminDialogVisible((prev) => ({
      ...prev,
      userGroupDialogVisible: false,
    }));
    setUserGroupData(userGroupStructure);
    setUserGroupValidation(userGroupValidationStructure);
  };
  const showResetPasswordDialog = (rowData) => {
    setResetPassword((prev) => ({
      ...prev,
      userId: rowData.userId,
    }));
    setAdminDialogVisible((prev) => ({
      ...prev,
      resetPasswordDialogVisible: true,
    }));
  };
  const hideResetPasswordDialog = () => {
    setResetPassword(resetPasswordStructure);
    setResetPasswordValidation(resetPasswordValidationStructure);
    setAdminDialogVisible((prev) => ({
      ...prev,
      resetPasswordDialogVisible: false,
    }));
  };

  return (
    <>
      <Container size="lg" className="mt-5">
        <SpeedDial
          radius={80}
          style={{ right: "2rem", bottom: "2rem", position: "fixed" }}
          showIcon="pi pi-user-plus"
          hideIcon="pi pi-user-plus"
          onClick={showUserDataForAdd}
        />
        <DataTable
          value={adminTable.table}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          header={adminHeader}
          selectionMode="single"
          onRowSelect={showUserDataForEdit}
          dataKey="userId"
          filters={adminTable.filterStructure}
          globalFilterFields={["userName", "userId"]}
        >
          <Column
            header="User Name"
            style={{ width: "25%" }}
            body={(rowData) => (
              <div className="userNameCell">
                <Avatar
                  label={rowData.initialName}
                  size="large"
                  shape="circle"
                  className="mr-3"
                />
                <span>
                  <b>{rowData.userName}</b>
                  <br />
                  {rowData.userId}
                </span>
              </div>
            )}
          ></Column>
          <Column
            field="phoneNumber"
            header="Phone Number"
            style={{ width: "15%" }}
          ></Column>
          <Column
            header="User Group"
            style={{ width: "25%" }}
            body={(rowData) => (
              <div>
                {rowData.groupNames.map((groupName, index) => (
                  <span key={index}>
                    <Chip label={groupName} className="mr-2 mb-2" />
                  </span>
                ))}
              </div>
            )}
          ></Column>
          <Column
            header="Reset Password"
            style={{ width: "20%" }}
            body={(rowData) => (
              <Button
                icon="pi pi-key"
                rounded
                severity="warning"
                aria-label="Bookmark"
                onClick={() => showResetPasswordDialog(rowData)}
              />
            )}
          ></Column>
          <Column
            header="Logs"
            style={{ width: "15%" }}
            body={(rowData) => (
              <Button
                icon="pi pi-file"
                rounded
                severity="info"
                aria-label="Bookmark"
              />
            )}
          ></Column>
        </DataTable>
      </Container>
      <DialogComponent
        header="Add User"
        visible={adminDialogVisible.addUserDialogVisible}
        onHide={hideUserData}
        className="userEditDialog"
      >
        <TabView>
          <TabPanel header="General Information">
            <Grid container>
              <Grid size={6} className="editUserCell">
                <span className="font-bold">Email Id</span>
              </Grid>
              <Grid size={6} className="editUserCell">
                <InputText
                  value={userData.userId}
                  invalid={!userDataValidation.userId}
                  onChange={(e) =>
                    setUserData((prev) => ({
                      ...prev,
                      userId: e.target.value,
                    }))
                  }
                />
              </Grid>
              <Grid size={6} className="editUserCell">
                <span className="font-bold">Employee Id</span>
              </Grid>
              <Grid size={6} className="editUserCell">
                <InputText
                  value={userData.employeeId}
                  invalid={!userDataValidation.employeeId}
                  onChange={(e) =>
                    setUserData((prev) => ({
                      ...prev,
                      employeeId: e.target.value,
                    }))
                  }
                />
              </Grid>
              <Grid size={6} className="editUserCell">
                <span className="font-bold">User Name</span>
              </Grid>
              <Grid size={6} className="editUserCell">
                <InputText
                  value={userData.userName}
                  invalid={!userDataValidation.userName}
                  onChange={(e) =>
                    setUserData((prev) => ({
                      ...prev,
                      userName: e.target.value,
                    }))
                  }
                />
              </Grid>
              <Grid size={6} className="editUserCell">
                <span className="font-bold">Date of Birth</span>
              </Grid>
              <Grid size={6} className="editUserCell">
                <DatePicker
                  value={userData.dobDate}
                  invalid={!userDataValidation.dob}
                  onChange={(e) =>
                    setUserData((p) => ({ ...p, dobDate: e.value }))
                  }
                  selectionMode={"single"}
                  dateFormat="dd/mm/yy"
                  readOnlyInput
                  showIcon
                />
              </Grid>
              <Grid size={6} className="editUserCell">
                <span className="font-bold">Date of Joining</span>
              </Grid>
              <Grid size={6} className="editUserCell">
                <DatePicker
                  value={userData.dojDate}
                  invalid={!userDataValidation.doj}
                  onChange={(e) =>
                    setUserData((p) => ({ ...p, dojDate: e.value }))
                  }
                  selectionMode={"single"}
                  dateFormat="dd/mm/yy"
                  readOnlyInput
                  showIcon
                />
              </Grid>
              <Grid size={6} className="editUserCell">
                <span className="font-bold">Phone Number</span>
              </Grid>
              <Grid size={6} className="editUserCell">
                <InputNumber
                  mode="decimal"
                  min={0}
                  maxLength={10}
                  minFractionDigits={0}
                  maxFractionDigits={0}
                  value={userData.phoneNumber}
                  useGrouping={false}
                  invalid={!userDataValidation.phoneNumber}
                  onValueChange={(e) =>
                    setUserData((prev) => ({
                      ...prev,
                      phoneNumber: e.value,
                    }))
                  }
                />
              </Grid>
              <Grid size={6} className="editUserCell">
                <span className="font-bold">Designation</span>
              </Grid>
              <Grid size={4.5} className="editUserCell">
                <Dropdown
                  value={userData.designation}
                  invalid={!userDataValidation.designation}
                  onChange={async (e) =>
                    setUserData((prev) => ({
                      ...prev,
                      designation: e.value,
                    }))
                  }
                  options={adminInfo.designations}
                  placeholder="Select Designation"
                  className="w-full"
                  filter
                />
              </Grid>
              <Grid size={1.5} className="editUserCell">
                <Button
                  icon="pi pi-plus"
                  rounded
                  severity="info"
                  aria-label="Bookmark"
                  className="ml-2"
                  onClick={showDesignationDialog}
                />
              </Grid>

              <Grid size={6} className="editUserCell">
                <span className="font-bold">Manager</span>
              </Grid>
              <Grid size={6} className="editUserCell">
                <Dropdown
                  value={userData.manager}
                  invalid={!userDataValidation.manager}
                  filter
                  onChange={async (e) =>
                    setUserData((prev) => ({
                      ...prev,
                      manager: e.value,
                    }))
                  }
                  options={adminInfo.managerinfo}
                  optionLabel="userName"
                  optionValue="userId"
                  placeholder="Select Manager"
                  className="w-full"
                />
              </Grid>

              <Grid size={6} className="editUserCell">
                <span className="font-bold">User Group</span>
              </Grid>
              <Grid size={4.5} className="editUserCell">
                <MultiSelect
                  value={userData.group}
                  invalid={!userDataValidation.group}
                  onChange={async (e) =>
                    setUserData((prev) => ({
                      ...prev,
                      group: e.value,
                    }))
                  }
                  filter
                  maxSelectedLabels={2}
                  options={adminInfo.userGroup?.filter((p) => p.active)}
                  optionLabel="groupName"
                  optionValue="groupId"
                  placeholder="Select User Group"
                  className="w-full"
                />
              </Grid>
              <Grid size={1.5} className="editUserCell">
                <Button
                  icon="pi pi-plus"
                  rounded
                  severity="info"
                  aria-label="Bookmark"
                  className="ml-2"
                  onClick={showUserGroupDialog}
                />
              </Grid>
              <Grid size={6} className="editUserCell">
                <span className="font-bold">User Department</span>
              </Grid>
              <Grid size={4.5} className="editUserCell">
                <Dropdown
                  value={userData.department}
                  invalid={!userDataValidation.department}
                  onChange={async (e) =>
                    setUserData((prev) => ({
                      ...prev,
                      department: e.value,
                    }))
                  }
                  options={adminInfo.departmentData}
                  filter
                  optionLabel="deptName"
                  optionValue="deptId"
                  placeholder="Select Department"
                  className="w-full"
                />
              </Grid>
              <Grid size={1.5} className="editUserCell">
                <Button
                  icon="pi pi-plus"
                  rounded
                  severity="info"
                  aria-label="Bookmark"
                  className="ml-2"
                />
              </Grid>
              <Grid size={6} className="editUserCell">
                <span className="font-bold">Status</span>
              </Grid>
              <Grid size={6} className="editUserCell">
                <ToggleButton
                  checked={userData.active}
                  onLabel="Active"
                  offLabel="Inactive"
                  onChange={(e) =>
                    setUserData((prev) => ({
                      ...prev,
                      active: e.value,
                    }))
                  }
                  className="w-8rem"
                />
              </Grid>
              <Grid size={6} className="editUserCell">
                <span className="font-bold">
                  Required password change on first login
                </span>
              </Grid>
              <Grid size={6} className="editUserCell">
                <ToggleButton
                  checked={userData.firstLoginRequired}
                  onChange={(e) =>
                    setUserData((prev) => ({
                      ...prev,
                      firstLoginRequired: e.value,
                    }))
                  }
                  className="w-8rem"
                />
              </Grid>
              <Grid size={6} className="editUserCell">
                <span className="font-bold">
                  Password Exipry duration (days)
                </span>
              </Grid>
              <Grid size={6} className="editUserCell">
                <InputNumber
                  value={userData.passwordExpiryDuraton}
                  invalid={!userDataValidation.passwordExpiryDuraton}
                  mode="decimal"
                  min={0}
                  maxLength={3}
                  minFractionDigits={0}
                  maxFractionDigits={0}
                  useGrouping={false}
                  onValueChange={(e) =>
                    setUserData((prev) => ({
                      ...prev,
                      passwordExpiryDuraton: e.value,
                    }))
                  }
                />
              </Grid>
            </Grid>
          </TabPanel>
          <TabPanel header="Page Allocation">
            <Grid container>
              <Grid size={6} className="editUserCell">
                <div className="flex flex-column gap-3">
                  <span className="font-bold">My Greenwave Pages</span>
                  <ListBox
                    value={userData.allotedPages}
                    onChange={(e) =>
                      setUserData((prev) => ({
                        ...prev,
                        allotedPages: e.value,
                      }))
                    }
                    itemTemplate={allocatedPagesTemplate}
                    options={adminInfo.pages}
                    invalid={!userDataValidation.allotedPages}
                    className="w-full"
                    listClassName="max-h-16rem"
                    multiple
                    filter
                  />
                </div>
              </Grid>
              <Grid size={6} className="editUserCell">
                <div className="flex flex-column gap-3">
                  <span className="font-bold">Select a ESS Homepage</span>
                  <ListBox
                    value={userData.espHomepage}
                    invalid={!userDataValidation.espHomepage}
                    onChange={(e) =>
                      setUserData((prev) => ({
                        ...prev,
                        espHomepage: e.value,
                      }))
                    }
                    options={userData.allotedPages}
                    className="w-full"
                    listClassName="max-h-16rem"
                    filter
                  />
                </div>
              </Grid>
            </Grid>
          </TabPanel>
        </TabView>
        <Button
          label="Add User"
          icon="pi pi-user-plus"
          severity="success"
          aria-label="Bookmark"
          className="mt-3 mr-2"
          onClick={async () => {
            addNewUser(
              userData,
              toastRef,
              setUserDataValidation,
              hideUserData,
              adminTable.table
            );
          }}
        />
      </DialogComponent>
      <DialogComponent
        header="Edit User Profile"
        visible={adminDialogVisible.editUserDialogVisible}
        onHide={hideUserData}
        className="userEditDialog"
      >
        <TabView>
          <TabPanel header="General Information">
            <Grid container>
              <Grid size={6} className="editUserCell">
                <span className="font-bold">Email Id</span>
              </Grid>
              <Grid size={6} className="editUserCell">
                <span>{userData.userId}</span>
              </Grid>
              <Grid size={6} className="editUserCell">
                <span className="font-bold">Employee Id</span>
              </Grid>
              <Grid size={6} className="editUserCell">
                <span>{userData.employeeId}</span>
              </Grid>
              <Grid size={6} className="editUserCell">
                <span className="font-bold">User Name</span>
              </Grid>
              <Grid size={6} className="editUserCell">
                <InputText
                  value={userData.userName}
                  invalid={!userDataValidation.userName}
                  onChange={(e) =>
                    setUserData((prev) => ({
                      ...prev,
                      userName: e.target.value,
                    }))
                  }
                />
              </Grid>
              <Grid size={6} className="editUserCell">
                <span className="font-bold">Date of Birth</span>
              </Grid>
              <Grid size={6} className="editUserCell">
                <DatePicker
                  value={userData.dobDate}
                  invalid={!userDataValidation.dob}
                  onChange={(e) =>
                    setUserData((p) => ({ ...p, dobDate: e.value }))
                  }
                  selectionMode={"single"}
                  dateFormat="dd/mm/yy"
                  readOnlyInput
                  showIcon
                />
              </Grid>
              <Grid size={6} className="editUserCell">
                <span className="font-bold">Date of Joining</span>
              </Grid>
              <Grid size={6} className="editUserCell">
                <DatePicker
                  value={userData.dojDate}
                  invalid={!userDataValidation.doj}
                  onChange={(e) =>
                    setUserData((p) => ({ ...p, dojDate: e.value }))
                  }
                  selectionMode={"single"}
                  dateFormat="dd/mm/yy"
                  readOnlyInput
                  showIcon
                />
              </Grid>
              <Grid size={6} className="editUserCell">
                <span className="font-bold">Phone Number</span>
              </Grid>
              <Grid size={6} className="editUserCell">
                <InputNumber
                  mode="decimal"
                  invalid={!userDataValidation.phoneNumber}
                  min={0}
                  maxLength={10}
                  minFractionDigits={0}
                  maxFractionDigits={0}
                  value={userData.phoneNumber}
                  useGrouping={false}
                  onValueChange={(e) =>
                    setUserData((prev) => ({
                      ...prev,
                      phoneNumber: e.value,
                    }))
                  }
                />
              </Grid>
              <Grid size={6} className="editUserCell">
                <span className="font-bold">Designation</span>
              </Grid>
              <Grid size={4.5} className="editUserCell">
                <Dropdown
                  value={userData.designation}
                  invalid={!userDataValidation.designation}
                  onChange={async (e) =>
                    setUserData((prev) => ({
                      ...prev,
                      designation: e.value,
                    }))
                  }
                  options={adminInfo.designations}
                  placeholder="Select Designation"
                  className="w-full"
                  filter
                />
              </Grid>
              <Grid size={1.5} className="editUserCell">
                <Button
                  icon="pi pi-plus"
                  rounded
                  severity="info"
                  aria-label="Bookmark"
                  className="ml-2"
                  onClick={showDesignationDialog}
                />
              </Grid>

              <Grid size={6} className="editUserCell">
                <span className="font-bold">Manager</span>
              </Grid>
              <Grid size={6} className="editUserCell">
                <Dropdown
                  value={userData.manager}
                  invalid={!userDataValidation.manager}
                  filter
                  onChange={async (e) =>
                    setUserData((prev) => ({
                      ...prev,
                      manager: e.value,
                    }))
                  }
                  options={adminInfo.managerinfo}
                  optionLabel="userName"
                  optionValue="userId"
                  placeholder="Select Manager"
                  className="w-full"
                />
              </Grid>

              <Grid size={6} className="editUserCell">
                <span className="font-bold">User Group</span>
              </Grid>
              <Grid size={4.5} className="editUserCell">
                <MultiSelect
                  value={userData.group}
                  invalid={!userDataValidation.group}
                  onChange={async (e) =>
                    setUserData((prev) => ({
                      ...prev,
                      group: e.value,
                    }))
                  }
                  filter
                  maxSelectedLabels={2}
                  options={adminInfo.userGroup}
                  optionLabel="groupName"
                  optionValue="groupId"
                  placeholder="Select User Group"
                  className="w-full"
                />
              </Grid>
              <Grid size={1.5} className="editUserCell">
                <Button
                  icon="pi pi-plus"
                  rounded
                  severity="info"
                  aria-label="Bookmark"
                  className="ml-2"
                  onClick={showUserGroupDialog}
                />
              </Grid>
              <Grid size={6} className="editUserCell">
                <span className="font-bold">User Department</span>
              </Grid>
              <Grid size={4.5} className="editUserCell">
                <Dropdown
                  value={userData.department}
                  invalid={!userDataValidation.department}
                  filter
                  onChange={async (e) =>
                    setUserData((prev) => ({
                      ...prev,
                      department: e.value,
                    }))
                  }
                  options={adminInfo.departmentData}
                  optionLabel="deptName"
                  optionValue="deptId"
                  placeholder="Select Department"
                  className="w-full"
                />
              </Grid>
              <Grid size={1.5} className="editUserCell">
                <Button
                  icon="pi pi-plus"
                  rounded
                  severity="info"
                  aria-label="Bookmark"
                  className="ml-2"
                />
              </Grid>
              <Grid size={6} className="editUserCell">
                <span className="font-bold">Status</span>
              </Grid>
              <Grid size={6} className="editUserCell">
                <ToggleButton
                  checked={userData.active}
                  onLabel="Active"
                  offLabel="Inactive"
                  onChange={(e) =>
                    setUserData((prev) => ({
                      ...prev,
                      active: e.value,
                    }))
                  }
                  className="w-8rem"
                />
              </Grid>
              <Grid size={6} className="editUserCell">
                <span className="font-bold">
                  Required password change on first login
                </span>
              </Grid>
              <Grid size={6} className="editUserCell">
                <ToggleButton
                  checked={userData.firstLoginRequired}
                  onChange={(e) =>
                    setUserData((prev) => ({
                      ...prev,
                      firstLoginRequired: e.value,
                    }))
                  }
                  className="w-8rem"
                />
              </Grid>
              <Grid size={6} className="editUserCell">
                <span className="font-bold">
                  Password Exipry duration (days)
                </span>
              </Grid>
              <Grid size={6} className="editUserCell">
                <InputNumber
                  value={userData.passwordExpiryDuraton}
                  invalid={!userDataValidation.passwordExpiryDuraton}
                  mode="decimal"
                  min={0}
                  maxLength={3}
                  minFractionDigits={0}
                  maxFractionDigits={0}
                  useGrouping={false}
                  onValueChange={(e) =>
                    setUserData((prev) => ({
                      ...prev,
                      passwordExpiryDuraton: e.value,
                    }))
                  }
                />
              </Grid>
              <Grid size={6} className="editUserCell">
                <span className="font-bold">Password Expiry Date</span>
              </Grid>
              <Grid size={6} className="editUserCell">
                <span>{userData.passwordExpiryDate}</span>
              </Grid>
              <Grid size={6} className="editUserCell">
                <span className="font-bold">Last Login</span>
              </Grid>
              <Grid size={6} className="editUserCell">
                <span>{userData.lastLogin}</span>
              </Grid>
            </Grid>
          </TabPanel>
          <TabPanel header="Page Allocation">
            <Grid container>
              <Grid size={6} className="editUserCell">
                <div className="flex flex-column gap-3">
                  <span className="font-bold">My Greenwave Pages</span>
                  <ListBox
                    value={userData.allotedPages}
                    invalid={!userDataValidation.allotedPages}
                    onChange={(e) =>
                      setUserData((prev) => ({
                        ...prev,
                        allotedPages: e.value,
                      }))
                    }
                    itemTemplate={allocatedPagesTemplate}
                    options={adminInfo.pages}
                    className="w-full"
                    listClassName="max-h-16rem"
                    multiple
                    filter
                  />
                </div>
              </Grid>
              <Grid size={6} className="editUserCell">
                <div className="flex flex-column gap-3">
                  <span className="font-bold">Select a ESS Homepage</span>
                  <ListBox
                    value={userData.espHomepage}
                    invalid={!userDataValidation.espHomepage}
                    onChange={(e) =>
                      setUserData((prev) => ({
                        ...prev,
                        espHomepage: e.value,
                      }))
                    }
                    options={userData.allotedPages}
                    className="w-full"
                    listClassName="max-h-16rem"
                    filter
                  />
                </div>
              </Grid>
            </Grid>
          </TabPanel>
        </TabView>
        <Button
          label="Update User"
          icon="pi pi-user"
          severity="success"
          aria-label="Bookmark"
          className="mt-3 mr-2"
          onClick={async () => {
            hideUserData();
          }}
        />
      </DialogComponent>
      <DialogComponent
        header="Add Designation"
        visible={adminDialogVisible.designationDialogVisible}
        onHide={hideDesignationDialog}
        className="userEditDialog"
      >
        <Grid container>
          <Grid size={6} className="editUserCell">
            <span className="font-bold">Designation</span>
          </Grid>
          <Grid size={4.5} className="editUserCell">
            <InputText
              value={newDesignation}
              onChange={(e) => setNewDesignation(e.target.value)}
            />
          </Grid>
          <Grid size={1.5} className="editUserCell">
            <Button
              label="Add"
              icon="pi pi-plus"
              severity="info"
              aria-label="Bookmark"
              onClick={async () =>
                await addDesignation(
                  newDesignation,
                  toastRef,
                  setAdminInfo,
                  setDesignationTable
                )
              }
            />
          </Grid>
          <Grid size={12}>
            <DataTable
              value={designationTable.table}
              filters={designationTable.filterStructure}
              globalFilterFields={["designation"]}
              header={designationHeader}
            >
              <Column field="designation" header="Designation"></Column>
            </DataTable>
          </Grid>
        </Grid>
      </DialogComponent>
      <DialogComponent
        header="Reset Password"
        visible={adminDialogVisible.resetPasswordDialogVisible}
        onHide={hideResetPasswordDialog}
        className="resetPasswordDialog"
      >
        <Grid container>
          <Grid size={5} className="editUserCell">
            <span className="font-bold">Enter New Password</span>
          </Grid>
          <Grid size={7} className="editUserCell">
            <div className="card flex justify-content-center">
              <Password
                value={resetPassword.newPassword}
                toggleMask
                invalid={!resetPasswordValidation.newPassword}
                onChange={(e) =>
                  setResetPassword((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
              />
            </div>
          </Grid>
          <Grid size={5} className="editUserCell">
            <span className="font-bold">Confirm Password</span>
          </Grid>
          <Grid size={7} className="editUserCell">
            <div className="card flex justify-content-center">
              <Password
                value={resetPassword.confirmPassword}
                toggleMask
                invalid={!resetPasswordValidation.confirmPassword}
                onChange={(e) =>
                  setResetPassword((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
              />
            </div>
          </Grid>
          <Grid size={12} className="flex justify-content-center">
            <Button
              label="Set Password"
              icon="pi pi-key"
              severity="success"
              aria-label="Bookmark"
              className="mt-3 mr-2"
              onClick={async () => {
                setNewPassword(
                  resetPassword,
                  toastRef,
                  hideResetPasswordDialog,
                  setResetPasswordValidation
                );
              }}
            />
          </Grid>
        </Grid>
      </DialogComponent>
      <DialogComponent
        header="Add User Group"
        visible={adminDialogVisible.userGroupDialogVisible}
        onHide={hideUserGroupDialog}
        className="userEditDialog"
      >
        <Grid container>
          <Grid size={2} className="editUserCell">
            <span className="font-bold">Group ID</span>
          </Grid>
          <Grid size={4} className="editUserCell">
            <InputText
              className="w-full mr-1"
              invalid={!userGroupValidation.groupId}
              value={userGroupData.groupId}
              onChange={(e) =>
                setUserGroupData((prev) => ({
                  ...prev,
                  groupId: e.target.value,
                }))
              }
            />
          </Grid>
          <Grid size={2} className="editUserCell">
            <span className="font-bold">Group Name</span>
          </Grid>
          <Grid size={4} className="editUserCell">
            <InputText
              invalid={!userGroupValidation.groupName}
              className="w-full"
              value={userGroupData.groupName}
              onChange={(e) =>
                setUserGroupData((prev) => ({
                  ...prev,
                  groupName: e.target.value,
                }))
              }
            />
          </Grid>
          <Grid size={2} className="editUserCell">
            <span className="font-bold">Manager</span>
          </Grid>
          <Grid size={4} className="editUserCell">
            <Dropdown
              value={userGroupData.groupManager}
              invalid={!userGroupValidation.groupManager}
              filter
              onChange={async (e) =>
                setUserGroupData((prev) => ({
                  ...prev,
                  groupManager: e.value,
                }))
              }
              options={adminInfo.managerinfo}
              optionLabel="userName"
              optionValue="userId"
              placeholder="Select Manager"
              className="w-full mr-1"
            />
          </Grid>
          <Grid size={2} className="editUserCell">
            <span className="font-bold">Phone</span>
          </Grid>
          <Grid size={4} className="editUserCell">
            <InputNumber
              inputClassName="w-full"
              mode="decimal"
              min={0}
              maxLength={10}
              minFractionDigits={0}
              maxFractionDigits={0}
              value={userGroupData.phoneNumber}
              useGrouping={false}
              invalid={!userGroupValidation.phoneNumber}
              onValueChange={(e) =>
                setUserGroupData((prev) => ({
                  ...prev,
                  phoneNumber: e.value,
                }))
              }
            />
          </Grid>
          <Grid size={2} className="editUserCell">
            <span className="font-bold">Active</span>
          </Grid>
          <Grid size={4} className="editUserCell">
            <Checkbox
              checked={userGroupData.active}
              onChange={(e) =>
                setUserGroupData((prev) => ({ ...prev, active: e.checked }))
              }
            />
          </Grid>
          <Grid size={6} className="editUserCell flex justify-content-center">
            <Button
              label="Add Group"
              icon="pi pi-plus"
              severity="info"
              aria-label="Bookmark"
              onClick={async () =>
                await addUserGroup(
                  userGroupData,
                  setUserGroupValidation,
                  toastRef,
                  setAdminInfo,
                  setUserGroupTable,
                  userGroupValidationStructure
                )
              }
            />
          </Grid>
          <Grid size={12}>
            <DataTable
              value={userGroupTable.table}
              filters={userGroupTable.filterStructure}
              globalFilterFields={[
                "groupId",
                "groupName",
                "active",
                "phoneNumber",
                "groupManager",
              ]}
              header={userGroupHeader}
              paginator
              rows={5}
              rowsPerPageOptions={[5, 10, 25, 50]}
              editMode="row"
              onRowEditComplete={async (e) =>
                await editUserGroup(
                  e,
                  userGroupTable,
                  setUserGroupTable,
                  toastRef,
                  setAdminInfo
                )
              }
            >
              <Column header="Edit" rowEditor></Column>
              <Column
                field="groupId"
                header="Id"
                className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]"
              ></Column>
              <Column
                field="groupName"
                header="Name"
                editor={(options) => (
                  <InputText
                    className="w-full"
                    type="text"
                    value={options.value}
                    onChange={(e) => options.editorCallback(e.target.value)}
                  />
                )}
              ></Column>
              <Column
                field="groupManager"
                header="Manager"
                body={(rowData) =>
                  adminInfo.managerinfo.filter(
                    (m) => m.userId === rowData.groupManager
                  )[0]?.userName
                }
                editor={(options) => (
                  <Dropdown
                    value={options.value}
                    filter
                    onChange={(e) => options.editorCallback(e.value)}
                    options={adminInfo.managerinfo}
                    optionLabel="userName"
                    optionValue="userId"
                    placeholder="Select Manager"
                    className="w-full"
                  />
                )}
              ></Column>
              <Column
                field="phoneNumber"
                header="Phone"
                editor={(options) => (
                  <InputNumber
                    mode="decimal"
                    inputClassName="w-full"
                    min={0}
                    maxLength={10}
                    minFractionDigits={0}
                    maxFractionDigits={0}
                    value={options.value}
                    useGrouping={false}
                    onValueChange={(e) => options.editorCallback(e.value)}
                  />
                )}
              ></Column>
              <Column
                field="active"
                header="Active"
                body={(rowData) => (
                  <Checkbox disabled checked={rowData.active} />
                )}
                editor={(options) => (
                  <Checkbox
                    checked={options.value}
                    onChange={(e) => options.editorCallback(e.checked)}
                  />
                )}
              ></Column>
            </DataTable>
          </Grid>
        </Grid>
      </DialogComponent>
      <Toast ref={toastRef} />
    </>
  );
};

export default AdminPage;
