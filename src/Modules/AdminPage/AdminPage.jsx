import React, { useEffect, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Chip, Container } from "@mui/material";
import { TabMenu } from "primereact/tabmenu";
import { Badge } from "primereact/badge";
import { onPageLoad } from "./AdminFunction";
import "./AdminPage.css";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Avatar } from "primereact/avatar";
import Toast from "../../components/Toast/Toast";
import { FilterMatchMode } from "primereact/api";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import SpeedDial from "../../components/SpeedDial/SpeedDial";
import Designation from "./Designation/Designation";
import UserGroup from "./UserGroup/UserGroup";
import Department from "./Department/Department";
import UserInfo from "./UserInfo/UserInfo";
import ResetPassword from "./ResetPassword/ResetPassword";
import UserLog from "./UserLog/UserLog";

const AdminPage = () => {
  //Table structure and Validations for admin page
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
    lastLogin: null,
    dob: null,
    doj: null,
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
  const toastRef = useRef(null);
  const [editMode, setEditMode] = useState(false);
  const [userInfo, setUserInfo] = useState(userDataStructure);
  const [userInfoVisible, setUserInfoVisible] = useState(false);
  const [userLogVisible, setUserLogVisible] = useState(false);
  const [designationVisible, setDesignationVisible] = useState(false);
  const [userGroupVisible, setUserGroupVisible] = useState(false);
  const [departmentVisible, setDepartmentVisible] = useState(false);
  const [resetPasswordVisible, setResetPasswordVisible] = useState(false);
  const [adminInfo, setAdminInfo] = useState({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [adminTable, setAdminTable] = useState(tableStructure);

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

  useEffect(() => {
    setAdminInfo((prev) => ({
      ...prev,
      userCount: {
        active: prev.userdata?.filter((user) => user.active).length,
        inActive: prev.userdata?.filter((user) => !user.active).length,
      },
    }));
  }, [adminTable]);

  return (
    <>
      <Container size="lg" className="mt-5">
        <SpeedDial
          radius={80}
          style={{ right: "2rem", bottom: "2rem", position: "fixed" }}
          showIcon="pi pi-user-plus"
          hideIcon="pi pi-user-plus"
          onClick={() => {
            setUserInfoVisible(true);
            setEditMode(false);
            setUserInfo(userDataStructure);
          }}
        />
        <DataTable
          value={adminTable.table}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          header={adminHeader}
          selectionMode="single"
          onRowSelect={(row) => {
            setUserInfoVisible(true);
            setEditMode(true);
            setUserInfo(row.data);
          }}
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
                  label={rowData.initial.initialName}
                  style={{
                    backgroundColor: rowData.initial.initialColor,
                    color: "#FFFFFF",
                  }}
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
                onClick={() => {
                  setResetPasswordVisible(true);
                  setUserInfo(rowData);
                }}
              />
            )}
          ></Column>
          <Column
            header="Logs"
            style={{ width: "15%" }}
            body={(row) => (
              <Button
                icon="pi pi-file"
                rounded
                severity="info"
                aria-label="Bookmark"
                onClick={() => {
                  setUserLogVisible(true);
                  setUserInfo(row);
                }}
              />
            )}
          ></Column>
        </DataTable>
      </Container>
      <UserInfo
        editMode={editMode}
        userInfo={userInfo}
        onHide={() => {
          setUserInfoVisible(false);
          setEditMode(false);
        }}
        dialogVisible={userInfoVisible}
        setAdminTable={setAdminTable}
        userList={adminInfo.userdata}
        managerList={adminInfo.managerinfo}
        designationList={adminInfo.designations}
        userGroupList={adminInfo.userGroup}
        departmentList={adminInfo.departmentData}
        pageList={adminInfo.pages}
        userDataStructure={userDataStructure}
        userDataValidationStructure={userDataValidationStructure}
        showActiveData={activeIndex === 0 ? true : false}
      />
      <UserLog
        userId={userInfo.userId}
        onHide={() => {
          setUserLogVisible(false);
        }}
        dialogVisible={userLogVisible}
      />

      <Designation
        dialogVisible={designationVisible}
        onHide={() => {
          setDesignationVisible(false);
        }}
        designationList={adminInfo.designations}
      />
      <ResetPassword
        dialogVisible={resetPasswordVisible}
        onHide={() => setResetPasswordVisible(false)}
        userInfo={userInfo}
      />
      <UserGroup
        dialogVisible={userGroupVisible}
        onHide={() => setUserGroupVisible(false)}
        userGroupList={adminInfo.userGroup}
        managerList={adminInfo.managerinfo}
      />
      <Department
        dialogVisible={departmentVisible}
        onHide={() => setDepartmentVisible(false)}
        departmentList={adminInfo.departmentData}
        managerList={adminInfo.managerinfo}
      />
      <Toast ref={toastRef} />
    </>
  );
};

export default AdminPage;
