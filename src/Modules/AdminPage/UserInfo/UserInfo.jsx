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
  categoryData,
}) => {
  console.log("User data structure:", userDataStructure);
  console.log("User info::", userInfo);
  const toastRef = useRef(null);
  const [userData, setUserData] = useState(userDataStructure);
  const [prevUserData, setPrevUserData] = useState(userDataStructure);
  const [userDataValidation, setUserDataValidation] = useState(
    userDataValidationStructure,
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
        className="userDialog dialogHeader dialogContent"
      >
        <TabView className="tabStyle tabStyle_No_BG defaultBorder mt-2">
          <TabPanel header="General Information" leftIcon="pi pi-user mr-2">
            {/* Personal Information */}
            <div className=" rounded-lg defaultBorder overflow-hidden mt-2">
              <div className="flex items-center gap-2 px-2 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <div className="">
                  <i
                    className="pi pi-envelope  ml-1 bold"
                    style={{ fontSize: "0.7rem" }}
                  ></i>
                </div>
                <h3 className="text-md">Personal Information</h3>
              </div>
              <Grid container columnSpacing={4}>
                <Grid size={6} className="userCell">
                  {editMode ? (
                    <>
                      <div className="w-full ml-2">
                        <label className="block text-sm2 font-medium text-gray-700 mb-1">
                          <i
                            className="pi pi-envelope mr-2 ml-1 bold"
                            style={{ fontSize: "0.7rem" }}
                          ></i>
                          Email Id
                        </label>
                        <div
                          className="bg-red-300 inputFieldStyle mr-2"
                          style={{ borderRadius: "0.3rem" }}
                        >
                          <span>{userData.userId}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-full ml-2">
                        <label className="block text-sm2 font-medium text-gray-700 mb-1">
                          <i
                            className="pi pi-envelope mr-2 ml-1 bold"
                            style={{ fontSize: "0.7rem" }}
                          ></i>
                          Email Id
                        </label>
                        <div
                          className="  rounded-lg text-gray-900 flex items-center"
                          style={{ borderColor: "#e5e7eb" }}
                        >
                          <InputText
                            value={userData.userId}
                            invalid={!userDataValidation.userId}
                            className="inputFieldStyle w-full"
                            placeholder="Enter Email Id"
                            onChange={(e) =>
                              setUserData((prev) => ({
                                ...prev,
                                userId: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </>
                  )}
                </Grid>

                <Grid size={6} className="userCell">
                  {editMode ? (
                    <div className="w-full ml-2">
                      <label className="block text-sm2 font-medium text-gray-700 mb-1">
                        <i
                          className="pi pi-id-card mr-2 ml-1 bold"
                          style={{ fontSize: "0.8rem" }}
                        ></i>
                        Employee Id
                      </label>
                      <div
                        className="bg-red-300 inputFieldStyle mr-2"
                        style={{ borderRadius: "0.3rem" }}
                      >
                        <span style={{ borderRadius: "0.3rem" }}>
                          {userData.employeeId}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full mr-2">
                      <label className="block text-sm2 font-medium text-gray-700 mb-1">
                        <i
                          className="pi pi-building mr-2 ml-1 bold"
                          style={{ fontSize: "0.75rem" }}
                        ></i>
                        Employee Id
                      </label>
                      <div
                        className="  rounded-lg text-gray-900 flex items-center"
                        style={{ borderColor: "#e5e7eb" }}
                      >
                        <InputText
                          value={userData.employeeId}
                          invalid={!userDataValidation.employeeId}
                          className="inputFieldStyle w-full"
                          placeholder="Enter Employee Id"
                          onChange={(e) =>
                            setUserData((prev) => ({
                              ...prev,
                              employeeId: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  )}
                </Grid>
                <Grid size={6} className="userCell">
                  <div className="w-full ml-2">
                    <label className="block text-sm2 font-medium text-gray-700 mb-1">
                      <i
                        className="pi pi-user mr-2 ml-1 bold"
                        style={{ fontSize: "0.7rem" }}
                      ></i>
                      User Name
                    </label>
                    <div
                      className="  rounded-lg text-gray-900 flex items-center"
                      style={{ borderColor: "#e5e7eb" }}
                    >
                      <InputText
                        value={userData.userName}
                        invalid={!userDataValidation.userName}
                        className="inputFieldStyle w-full"
                        placeholder="Enter User Name"
                        onChange={(e) =>
                          setUserData((prev) => ({
                            ...prev,
                            userName: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </Grid>
                <Grid size={6} className="userCell">
                  <div className="w-full mr-2">
                    <label className="block text-sm2 font-medium text-gray-700 mb-1">
                      <i
                        className="pi pi-phone mr-2 ml-1 bold"
                        style={{ fontSize: "0.7rem" }}
                      ></i>
                      Phone Number
                    </label>
                    <div
                      className="  rounded-lg text-gray-900 flex items-center"
                      style={{ borderColor: "#e5e7eb" }}
                    >
                      <InputNumber
                        mode="decimal"
                        min={0}
                        maxLength={10}
                        minFractionDigits={0}
                        maxFractionDigits={0}
                        value={userData.phoneNumber}
                        placeholder="Enter Phone Number"
                        className="NumberFieldStyle w-full"
                        useGrouping={false}
                        invalid={!userDataValidation.phoneNumber}
                        onValueChange={(e) =>
                          setUserData((prev) => ({
                            ...prev,
                            phoneNumber: e.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </Grid>
                <Grid size={6} className="userCell">
                  <div className="w-full ml-2">
                    <label className="block text-sm2 font-medium text-gray-700 mb-1">
                      <i
                        className="pi pi-calendar mr-2 ml-1 bold"
                        style={{ fontSize: "0.7rem" }}
                      ></i>
                      Date of Birth
                    </label>
                    <div
                      className="  rounded-lg text-gray-900 flex items-center"
                      style={{ borderColor: "#e5e7eb" }}
                    >
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
                        className="w-full"
                      />
                    </div>
                  </div>
                </Grid>
                <Grid size={6} className="userCell">
                  <div className="w-full mr-2">
                    <label className="block text-sm2 font-medium text-gray-700 mb-1">
                      <i
                        className="pi pi-calendar-times mr-2 ml-1 bold"
                        style={{ fontSize: "0.7rem" }}
                      ></i>
                      Date of Joining
                    </label>
                    <div
                      className="w-full rounded-lg text-gray-900 flex items-center"
                      style={{ borderColor: "#e5e7eb" }}
                    >
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
                        style={{ maxWidth: "100%" }}
                      />
                    </div>
                  </div>
                </Grid>
              </Grid>
            </div>

            {/* Organization Information */}

            <div className=" rounded-lg defaultBorder overflow-hidden mt-2">
              <div className="flex items-center gap-2 px-2 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                <div className="">
                  <i
                    className="pi pi-building  ml-1 bold"
                    style={{ fontSize: "0.7rem" }}
                  ></i>
                </div>
                <h3 className="text-md">Organization Information</h3>
              </div>
              <Grid container columnSpacing={2}>
                {/* Designation */}
                <Grid size={6} className="userCell ">
                  <div className="w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-full ml-2">
                        <label className="block text-sm2 font-medium text-gray-700 mb-1">
                          <i
                            className="pi pi-building-columns mr-2 ml-1 bold"
                            style={{ fontSize: "0.7rem" }}
                          ></i>
                          Designation
                        </label>
                        <div
                          className="  rounded-lg text-gray-900 flex items-center"
                          style={{ borderColor: "#e5e7eb" }}
                        >
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
                            className="w-full dropDownStyle"
                            filter
                          />
                        </div>
                      </div>
                      <Button
                        icon="pi pi-plus"
                        rounded
                        severity="info"
                        aria-label="Bookmark"
                        className="mt-4"
                        //size="small"
                        style={{
                          width: "2.5rem",
                          height: "2.2rem",
                          fontSize: "0.8rem",
                        }}
                        onClick={() => setDesignationVisible(true)}
                      />
                    </div>
                  </div>
                </Grid>

                <Grid size={6} className="userCell">
                  <div className="w-full ml-2">
                    <label className="block text-sm2 font-medium text-gray-700 mb-1">
                      <i
                        className="pi pi-users mr-2 ml-1 bold"
                        style={{ fontSize: "0.7rem" }}
                      ></i>
                      Manager
                    </label>
                    <div
                      className="  rounded-lg text-gray-900 flex items-center"
                      style={{ borderColor: "#e5e7eb" }}
                    >
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
                        className="w-full dropDownStyle mr-2"
                        //style={{width:"1rem"}}
                      />
                    </div>
                  </div>
                </Grid>

                {/* User Group */}
                <Grid size={6} className="userCell ">
                  <div className="w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-full ml-2">
                        <label className="block text-sm2 font-medium text-gray-700 mb-1">
                          <i
                            className="pi pi-users mr-2 ml-1 bold"
                            style={{ fontSize: "0.7rem" }}
                          ></i>
                          User Groups
                        </label>
                        <div
                          className="  rounded-lg text-gray-900 flex items-center"
                          style={{ borderColor: "#e5e7eb" }}
                        >
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
                            className="w-full multiselectDropdownStyle multiSelectFontStyle"
                          />
                        </div>
                      </div>

                      <Button
                        icon="pi pi-plus"
                        rounded
                        severity="info"
                        aria-label="Bookmark"
                        className="mt-4"
                        //size="small"
                        style={{
                          width: "2.5rem",
                          height: "2.2rem",
                          fontSize: "0.8rem",
                        }}
                        onClick={() => setUserGroupVisible(true)}
                      />
                    </div>
                  </div>
                </Grid>

                {/* User Department */}
                <Grid size={6} className="userCell ">
                  <div className="w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-full ml-2">
                        <label className="block text-sm2 font-medium text-gray-700 mb-1">
                          <i
                            className="pi pi-users mr-2 ml-1 bold"
                            style={{ fontSize: "0.7rem" }}
                          ></i>
                          User Department
                        </label>
                        <div
                          className="  rounded-lg text-gray-900 flex items-center"
                          style={{ borderColor: "#e5e7eb" }}
                        >
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
                            className="w-full dropDownStyle"
                          />
                        </div>
                      </div>

                      <Button
                        icon="pi pi-plus"
                        rounded
                        severity="info"
                        aria-label="Bookmark"
                        className="mt-4 mr-2"
                        //size="small"
                        style={{
                          width: "2.5rem",
                          height: "2.2rem",
                          fontSize: "0.8rem",
                        }}
                        onClick={() => setDepartmentVisible(true)}
                      />
                    </div>
                  </div>
                </Grid>
              </Grid>
            </div>

            {/* Category Info */}

            <div className=" rounded-lg defaultBorder overflow-hidden mt-2">
              <div className="flex items-center gap-2 px-2 py-2 bg-gradient-to-r  from-violet-500 to-violet-600 text-white">
                <div className="">
                  <i
                    className="pi pi-shield  ml-1 bold"
                    style={{ fontSize: "0.7rem" }}
                  ></i>
                </div>
                <h3 className="text-md">Category Info</h3>
              </div>
              <Grid container columnSpacing={4}>
                <Grid size={6} className="userCell">
                  <span className="font-bold ml-2 text-sm2">Categories</span>
                </Grid>
                <Grid size={6} className="userCell">
                  <div className="w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-full ml-2">
                        <div
                          className="  rounded-lg text-gray-900 flex items-center"
                          style={{ borderColor: "#e5e7eb" }}
                        >
                          <Dropdown
                            value={userData.allocatedCategories?.[0] ?? null}
                            invalid={!userDataValidation.allocatedCategories}
                            onChange={(e) =>
                              setUserData((prev) => ({
                                ...prev,
                                allocatedCategories: e.value ? [e.value] : [],
                              }))
                            }
                            filter
                            options={categoryData}
                            optionLabel="categoryName"
                            optionValue="categoryId"
                            placeholder="Select Categories"
                            className="w-full dropDownStyle"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Grid>
              </Grid>
            </div>
            {/* Security & Access */}

            <div className=" rounded-lg defaultBorder overflow-hidden mt-2">
              <div className="flex items-center gap-2 px-2 py-2 bg-gradient-to-r  from-amber-500 to-orange-600 text-white">
                <div className="">
                  <i
                    className="pi pi-shield  ml-1 bold"
                    style={{ fontSize: "0.7rem" }}
                  ></i>
                </div>
                <h3 className="text-md">Security & Access</h3>
              </div>
              <Grid container columnSpacing={4}>
                <Grid size={6} className="userCell">
                  <span className="font-bold ml-2 text-sm2">Status</span>
                </Grid>
                <Grid size={6} className="userCell">
                  <div className="w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-full ml-2">
                        <div
                          className="  rounded-lg text-gray-900 flex items-center"
                          style={{ borderColor: "#e5e7eb" }}
                        >
                          <ToggleButton
                            checked={userData.active}
                            onLabel="Active"
                            offLabel="Inactive"
                            onIcon="pi pi-check"
                            offIcon="pi pi-times"
                            onChange={(e) =>
                              setUserData((prev) => ({
                                ...prev,
                                active: e.value,
                              }))
                            }
                            className="w-6rem toggleButton"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Grid>
                <Grid size={6} className="userCell">
                  <span className="font-bold ml-2 text-sm2">
                    Required password change on first login
                  </span>
                </Grid>
                <Grid size={6} className="userCell">
                  <div className="w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-full ml-2">
                        <div
                          className="  rounded-lg text-gray-900 flex items-center"
                          style={{ borderColor: "#e5e7eb" }}
                        >
                          <ToggleButton
                            checked={userData.firstLoginRequired}
                            onIcon="pi pi-lock"
                            offIcon="pi pi-lock-open"
                            onChange={(e) =>
                              setUserData((prev) => ({
                                ...prev,
                                firstLoginRequired: e.value,
                              }))
                            }
                            className="w-6rem toggleButton"
                          />
                        </div>
                      </div>{" "}
                    </div>{" "}
                  </div>
                </Grid>

                <Grid size={6} className="userCell">
                  <span className="font-bold ml-2 text-sm2">
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
                    className="NumberFieldStyle"
                  />
                </Grid>
                {editMode && (
                  <Grid size={6} className="userCell">
                    <span className="font-bold ml-2 text-sm2">
                      Password Expiry Date
                    </span>
                  </Grid>
                )}
                {editMode && (
                  <Grid size={6} className="userCell">
                    <span
                      className="inputFieldStyle"
                      style={{ width: "200px", borderRadius: "0.3rem" }}
                    >
                      {userData.passwordExpiryDate}
                    </span>
                  </Grid>
                )}
                {editMode && (
                  <Grid size={6} className="userCell">
                    <span className="font-bold ml-2 text-sm2">Last Login</span>
                  </Grid>
                )}
                {editMode && (
                  <Grid size={6} className="userCell">
                    <span
                      className="inputFieldStyle"
                      style={{ width: "200px", borderRadius: "0.3rem" }}
                    >
                      {userData.lastLogin}
                    </span>
                  </Grid>
                )}
              </Grid>
            </div>
          </TabPanel>
          <TabPanel header="Page Allocation" leftIcon="pi pi-cog mr-2">
            <div className="py-2">
              <div className="">
                {/* Allocated Pages */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-2 py-3 rounded-md mb-2">
                    <div className="flex items-center gap-2 ml-2">
                      <div className=" bg-gradient-to-br  rounded-lg flex items-center justify-center">
                        <i
                          className="pi pi-cog bold"
                          style={{ fontSize: "1.2rem", color: "black" }}
                        ></i>
                      </div>
                      <h3 className="font-medium" style={{ color: "black" }}>
                        My Greenwave Pages
                      </h3>
                    </div>
                  </div>
                  <div>
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
                      className="w-full listBoxStyle"
                      listClassName="max-h-[16rem] "
                      multiple
                      filter
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="py-2">
              <div className="">
                {/* Select a Homepage */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-2 py-3 rounded-md mb-2">
                    <div className="flex items-center gap-2 ml-2">
                      <div className=" bg-gradient-to-br  rounded-lg flex items-center justify-center">
                        <i
                          className="pi pi-home bold"
                          style={{ fontSize: "1.1rem", color: "black" }}
                        ></i>
                      </div>
                      <h3 className="font-medium" style={{ color: "black" }}>
                        Select a Homepage
                      </h3>
                    </div>
                  </div>
                  <div>
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
                      className="w-full listBoxStyle"
                      listClassName="max-h-[16rem]"
                      filter
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>
        </TabView>
        <Button
          label={editMode ? "Update User" : "Add User"}
          icon={"pi " + (editMode ? "pi-user" : "pi-user-plus")}
          severity="success"
          aria-label="Bookmark"
          size="small"
          className="mt-2 ml-2"
          style={{ padding: "0.5rem 0.7rem", fontSize: "0.85rem" }}
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
              prevUserData,
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
