import React, { useEffect, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Chip, Container, LinearProgress } from "@mui/material";
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
import GlobalFilterHeader from "../../components/Table/GlobalFilterHeader";
import MapsHomeWorkIcon from "@mui/icons-material/MapsHomeWork";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import PersonOffOutlinedIcon from "@mui/icons-material/PersonOffOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { Skeleton } from "primereact/skeleton";
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
    categoryList:[]
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
  //Page Loader 
  const [loader,setLoader]=useState(false)

  const itemRenderer = (item, itemIndex, userCount, severity) => (
    <a
      className="p-menuitem-link flex align-items-center gap-2"
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
      {/* <Badge severity={severity} /> */}
      <span className="font-bold p-overlay-badge">
        {item.name}
        {/* <Badge value={userCount} severity={severity} /> */}
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
    <GlobalFilterHeader
      start={
        <TabMenu
          model={adminHeaderMenuItems}
          activeIndex={activeIndex}
          onTabChange={(e) => setActiveIndex(e.index)}
          className="tabMenuStyle"
        />
      }
      table={adminTable}
      setTable={setAdminTable}
    />
  );
  useEffect(() => {
    const init = async () => {
      setLoader(true)
      const data = await onPageLoad();
      console.log("Data::",data)
      if (data) {
        setLoader(false)
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
  //console.log("totalActiveGroup",(adminInfo.userGroup?.filter((ele)=> ele.active === true))?.length);

  
  return (
    <>
      <div className="container mx-auto px-4">
        <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
          <div className=" ">
            <div className="cardStyle mt-4 py-2.5 px-4 bg-white shadow rounded">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg blue-icon">
                      <MapsHomeWorkIcon />
                    </div>
                    <div>
                      <h1 className="text-1xl font-bold text-gray-900">
                        Admin Page
                      </h1>
                      <p
                        className=" titleTextStyle"
                        style={{ fontSize: "0.8rem" }}
                      >
                        Manage users, permissions, and access controls
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="flex items-center ">
                    <Button
                      rounded
                      icon="pi pi-plus"
                      size="small"
                      style={{ padding: "0.35rem 0.7rem", columnGap: "0.3rem" }}
                      onClick={() => {
                        setUserInfoVisible(true);
                        setEditMode(false);
                        setUserInfo(userDataStructure);
                      }}
                    >
                      Add User
                    </Button>

                    <div></div>
                  </div>
                </div>
              </div>
            </div>
            <div className=" mt-1 py-2.5 ">
              <div className="my-grid">
                <div className="cardStyle rounded-xl shadow-sm p-3 border border-gray-200 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div
                          className="green-BG rounded-full mr-3"
                          style={{ width: "0.7rem", height: "0.7rem" }}
                        ></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Active Users
                        </p>
                      </div>
                    </div>
                    {loader ? (
                      <Skeleton shape="circle" size="2rem"></Skeleton>
                    ) : (
                      <div className="flex items-center">
                        <PersonOutlineOutlinedIcon className=" mr-2 green-icon-noBG" />
                        <span
                          className=" font-bold text-gray-900"
                          style={{ fontSize: "1.2rem" }}
                        >
                          {adminInfo?.userCount?.active ?? "NA"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="cardStyle rounded-xl shadow-sm p-3 border border-gray-200 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div
                          className="red-BG rounded-full mr-3"
                          style={{ width: "0.7rem", height: "0.7rem" }}
                        ></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Inactive Users
                        </p>
                      </div>
                    </div>
                    {loader ? (
                      <Skeleton shape="circle" size="2rem"></Skeleton>
                    ) : (
                      <div className="flex items-center">
                        <PersonOffOutlinedIcon className=" mr-2 red-icon-noBG" />
                        <span
                          className="font-bold text-gray-900"
                          style={{ fontSize: "1.2rem" }}
                        >
                          {adminInfo?.userCount?.inActive ?? "NA"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="cardStyle rounded-xl shadow-sm p-3 border border-gray-200 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div
                          className="blue-BG rounded-full mr-3"
                          style={{ width: "0.7rem", height: "0.7rem" }}
                        ></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          User Groups
                        </p>
                      </div>
                    </div>
                    {loader ? (
                      <Skeleton shape="circle" size="2rem"></Skeleton>
                    ) : (
                    <div className="flex items-center">
                      <GroupOutlinedIcon className=" mr-2 blue-icon-noBG" />
                      <span
                        className=" font-bold text-gray-900"
                        style={{ fontSize: "1.2rem" }}
                      >
                        {adminInfo.userGroup?.filter(
                          (ele) => ele.active === true
                        )?.length ?? "NA"}
                      </span>
                    </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-1 mb-4 cardStyle">
              {/* <SpeedDial
                radius={80}
                style={{ right: "2rem", bottom: "2rem", position: "fixed" }}
                showIcon="pi pi-user-plus"
                hideIcon="pi pi-user-plus"
                onClick={() => {
                  setUserInfoVisible(true);
                  setEditMode(false);
                  setUserInfo(userDataStructure);
                }}
              /> */}
              <DataTable
                value={adminTable.table}
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25, 50]}
                header={adminHeader}
                size="small"
                className="dataTableHeader dataTableBody dataTableBodyPadding dataTablePaginator dropDownStyle"
                selectionMode="single"
                onRowSelect={(row) => {
                  setUserInfoVisible(true);
                  setEditMode(true);
                  setUserInfo(row.data);
                }}
                stripedRows
                dataKey="userId"
                filters={adminTable.filterStructure}
                globalFilterFields={["userName", "userId", "phoneNumber"]}
                emptyMessage={ loader ? <LinearProgress color="inherit" /> : "No Data Found" }
              >
                <Column
                  header="User Name"
                  //style={{ width: "25%" }}
                  body={(rowData) => (
                    <div className="userNameCell">
                      <Avatar
                        label={rowData.initial.initialName}
                        style={{
                          backgroundColor: rowData.initial.initialColor,
                          color: "#FFFFFF",
                          width: "1.8rem",
                          height: "1.8rem",
                          fontSize: "0.85rem",
                        }}
                        size="normal"
                        shape="circle"
                        className="mr-3"
                      />
                      <span>
                        <b style={{ fontSize: "0.75rem" }}>
                          {rowData.userName}
                        </b>
                        <br />
                        <div
                          className="titleTextStyle"
                          style={{ fontSize: "0.72rem" }}
                        >
                          {rowData.userId}
                        </div>
                      </span>
                    </div>
                  )}
                ></Column>
                <Column
                  field="phoneNumber"
                  header="Phone Number"
                  style={{ width: "12rem" }}
                ></Column>
                <Column
                  header="User Group"
                  //style={{ width: "25%" }}
                  body={(rowData) => (
                    <div>
                      {rowData.groupNames.map((groupName, index) => (
                        <span key={index}>
                          <Chip
                            label={groupName}
                            icon={<GroupOutlinedIcon />}
                            size="small"
                            variant=""
                            className="mr-1 mb-1 infoChipStyle"
                          />
                        </span>
                      ))}
                    </div>
                  )}
                ></Column>
                <Column
                  header="Status"
                  style={{ width: "10rem" }}
                  body={(rowData) => (
                    <>
                      <Chip
                        label={rowData.active ? "Active" : "Inactive"}
                        // color={rowData.active ? "success" : "error"}
                        icon={
                          rowData.active ? (
                            <PersonOutlineOutlinedIcon />
                          ) : (
                            <PersonOffOutlinedIcon />
                          )
                        }
                        size="small"
                        //variant="outlined"
                        className={`mr-2 mb-2 ${rowData.active ? "activeChipStyle" : "inActiveChipStyle"}`}
                      />
                    </>
                  )}
                ></Column>
                <Column
                  header="Reset Password"
                  style={{ width: "9rem" }}
                  body={(rowData) => (
                    <Button
                      icon="pi pi-key"
                      rounded
                      severity="warning"
                      size="small"
                      text
                      aria-label="Bookmark"
                      style={{ width: "2rem", height: "2rem" }}
                      onClick={() => {
                        setResetPasswordVisible(true);
                        setUserInfo(rowData);
                      }}
                    />
                  )}
                ></Column>
                <Column
                  header="Logs"
                  style={{ width: "9rem" }}
                  body={(row) => (
                    <Button
                      icon="pi pi-file"
                      rounded
                      severity="info"
                      style={{ width: "2rem", height: "2rem" }}
                      text
                      aria-label="Bookmark"
                      onClick={() => {
                        setUserLogVisible(true);
                        setUserInfo(row);
                      }}
                    />
                  )}
                ></Column>
              </DataTable>
            </div>
          </div>
        </div>
      </div>
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
        categoryData={adminInfo.categoryData}
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
