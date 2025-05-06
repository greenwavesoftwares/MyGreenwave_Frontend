import React, { useEffect, useRef, useState } from "react";
import { Grid } from "@mui/material";
import "./UserInfo.css";
import DialogComponent from "../../../components/Dialog/DialogComponent";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import DatePicker from "../../../components/DatePicker/DatePicker";
import Toast from "../../../components/Toast/Toast";
import { TabPanel, TabView } from "primereact/tabview";
import { ToggleButton } from "primereact/togglebutton";
import { InputNumber } from "primereact/inputnumber";
import { ListBox } from "primereact/listbox";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CropSquareIcon from "@mui/icons-material/CropSquare";
import { MultiSelect } from "primereact/multiselect";
import { addOrEditUser } from "./UserInfoFunction";
import Designation from "../Designation/Designation";
import UserGroup from "../UserGroup/UserGroup";
import Department from "../Department/Department";

const UserInfo = ({
  editMode = false,
  userInfo = {},
  onHide,
  dialogVisible = false,
  setAdminTable,
  userList,
  managerList,
  designationList,
  userGroupList,
  departmentList,
  pageList,
  userDataStructure,
  userDataValidationStructure,
  showActiveData,
}) => {
  const toastRef = useRef(null);
  const [userData, setUserData] = useState(userDataStructure);
  const [prevUserData, setPrevUserData] = useState(userDataStructure);
  const [userDataValidation, setUserDataValidation] = useState(
    userDataValidationStructure
  );
  const [designationVisible, setDesignationVisible] = useState(false);
  const [userGroupVisible, setUserGroupVisible] = useState(false);
  const [departmentVisible, setDepartmentVisible] = useState(false);
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
    if (dialogVisible) {
      if (editMode) {
        setUserData(userInfo);
        setPrevUserData(userInfo);
      } else {
        setUserData(userDataStructure);
        setPrevUserData(userDataStructure);
      }
    } else {
      setUserData(userDataStructure);
      setPrevUserData(userDataStructure);
      setUserDataValidation(userDataValidationStructure);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogVisible]);

  return (
    <>
      <DialogComponent
        header={editMode ? "Edit User Profile" : "Add User"}
        visible={dialogVisible}
        onHide={onHide}
        className="userDialog"
      >
        <TabView>
          <TabPanel header="General Information">
            <Grid container>
              <Grid size={6} className="userCell">
                <span className="font-bold">Email Id</span>
              </Grid>
              <Grid size={6} className="userCell">
                {editMode ? (
                  <span>{userData.userId}</span>
                ) : (
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
                )}
              </Grid>
              <Grid size={6} className="userCell">
                <span className="font-bold">Employee Id</span>
              </Grid>
              <Grid size={6} className="userCell">
                {editMode ? (
                  <span>{userData.employeeId}</span>
                ) : (
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
                )}
              </Grid>
              <Grid size={6} className="userCell">
                <span className="font-bold">User Name</span>
              </Grid>
              <Grid size={6} className="userCell">
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
              <Grid size={6} className="userCell">
                <span className="font-bold">Date of Birth</span>
              </Grid>
              <Grid size={6} className="userCell">
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
              <Grid size={6} className="userCell">
                <span className="font-bold">Date of Joining</span>
              </Grid>
              <Grid size={6} className="userCell">
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
              <Grid size={6} className="userCell">
                <span className="font-bold">Phone Number</span>
              </Grid>
              <Grid size={6} className="userCell">
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
              <Grid size={6} className="userCell">
                <span className="font-bold">Designation</span>
              </Grid>
              <Grid size={4.5} className="userCell">
                <Dropdown
                  value={userData.designation}
                  invalid={!userDataValidation.designation}
                  onChange={async (e) =>
                    setUserData((prev) => ({
                      ...prev,
                      designation: e.value,
                    }))
                  }
                  options={designationList}
                  placeholder="Select Designation"
                  className="w-full"
                  filter
                />
              </Grid>
              <Grid size={1.5} className="userCell">
                <Button
                  icon="pi pi-plus"
                  rounded
                  severity="info"
                  aria-label="Bookmark"
                  className="ml-2"
                  onClick={() => setDesignationVisible(true)}
                />
              </Grid>

              <Grid size={6} className="userCell">
                <span className="font-bold">Manager</span>
              </Grid>
              <Grid size={6} className="userCell">
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
                  options={managerList}
                  optionLabel="userName"
                  optionValue="userId"
                  placeholder="Select Manager"
                  className="w-full"
                />
              </Grid>

              <Grid size={6} className="userCell">
                <span className="font-bold">User Group</span>
              </Grid>
              <Grid size={4.5} className="userCell">
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
                  options={userGroupList?.filter((p) => p.active)}
                  optionLabel="groupName"
                  optionValue="groupId"
                  placeholder="Select User Group"
                  className="w-full"
                />
              </Grid>
              <Grid size={1.5} className="userCell">
                <Button
                  icon="pi pi-plus"
                  rounded
                  severity="info"
                  aria-label="Bookmark"
                  className="ml-2"
                  onClick={() => setUserGroupVisible(true)}
                />
              </Grid>
              <Grid size={6} className="userCell">
                <span className="font-bold">User Department</span>
              </Grid>
              <Grid size={4.5} className="userCell">
                <Dropdown
                  value={userData.department}
                  invalid={!userDataValidation.department}
                  onChange={async (e) =>
                    setUserData((prev) => ({
                      ...prev,
                      department: e.value,
                    }))
                  }
                  options={departmentList}
                  filter
                  optionLabel="deptName"
                  optionValue="deptId"
                  placeholder="Select Department"
                  className="w-full"
                />
              </Grid>
              <Grid size={1.5} className="userCell">
                <Button
                  icon="pi pi-plus"
                  rounded
                  severity="info"
                  aria-label="Bookmark"
                  className="ml-2"
                  onClick={() => setDepartmentVisible(true)}
                />
              </Grid>
              <Grid size={6} className="userCell">
                <span className="font-bold">Status</span>
              </Grid>
              <Grid size={6} className="userCell">
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
              <Grid size={6} className="userCell">
                <span className="font-bold">
                  Required password change on first login
                </span>
              </Grid>
              <Grid size={6} className="userCell">
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
              <Grid size={6} className="userCell">
                <span className="font-bold">
                  Password Exipry duration (days)
                </span>
              </Grid>
              <Grid size={6} className="userCell">
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
              {editMode && (
                <Grid size={6} className="userCell">
                  <span className="font-bold">Password Expiry Date</span>
                </Grid>
              )}
              {editMode && (
                <Grid size={6} className="userCell">
                  <span>{userData.passwordExpiryDate}</span>
                </Grid>
              )}
              {editMode && (
                <Grid size={6} className="userCell">
                  <span className="font-bold">Last Login</span>
                </Grid>
              )}
              {editMode && (
                <Grid size={6} className="userCell">
                  <span>{userData.lastLogin}</span>
                </Grid>
              )}
            </Grid>
          </TabPanel>
          <TabPanel header="Page Allocation">
            <Grid container>
              <Grid size={{ lg: 6, md: 12 }} className="userCell">
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
                    options={pageList}
                    invalid={!userDataValidation.allotedPages}
                    className="w-full"
                    listClassName="max-h-16rem"
                    multiple
                    filter
                  />
                </div>
              </Grid>
              <Grid size={{ lg: 6, md: 12 }} className="userCell">
                <div className="flex flex-column gap-3">
                  <span className="font-bold">Select a Homepage</span>
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
          label={editMode ? "Update User" : "Add User"}
          icon={"pi " + (editMode ? "pi-user" : "pi-user-plus")}
          severity="success"
          aria-label="Bookmark"
          className="mt-3 mr-2"
          onClick={async () => {
            await addOrEditUser(
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
            );
          }}
        />
      </DialogComponent>
      <Designation
        dialogVisible={designationVisible}
        onHide={() => {
          setDesignationVisible(false);
        }}
        designationList={designationList}
      />
      <UserGroup
        dialogVisible={userGroupVisible}
        onHide={() => setUserGroupVisible(false)}
        userGroupList={userGroupList}
        managerList={managerList}
      />
      <Department
        dialogVisible={departmentVisible}
        onHide={() => setDepartmentVisible(false)}
        departmentList={departmentList}
        managerList={managerList}
      />
      <Toast ref={toastRef} />
    </>
  );
};

export default UserInfo;
