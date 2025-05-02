import { FilterMatchMode } from "primereact/api";
import React, { useEffect, useRef, useState } from "react";
import { addUserGroup, editUserGroup } from "./UserGroupFunction";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";
import DialogComponent from "../../../components/Dialog/DialogComponent";
import { Grid } from "@mui/material";
import Toast from "../../../components/Toast/Toast";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import "./UserGroup.css";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Checkbox } from "primereact/checkbox";

const UserGroup = ({
  onHide,
  dialogVisible = false,
  userGroupList,
  managerList,
}) => {
  const toastRef = useRef(null);
  const tableStructure = () => ({
    table: [],
    filterText: "",
    filterStructure: {
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    },
  });
  const userGroupStructure = {
    groupId: "",
    active: true,
    phoneNumber: "",
    homePage: "",
    groupManager: "",
    groupName: "",
  };
  const userGroupValidationStructure = {
    groupId: true,
    phoneNumber: true,
    groupManager: true,
    groupName: true,
  };
  const [userGroupData, setUserGroupData] = useState(userGroupStructure);
  const [userGroupValidation, setUserGroupValidation] = useState(
    userGroupValidationStructure
  );
  const [userGroupTable, setUserGroupTable] = useState(tableStructure);
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

  useEffect(() => {
    if (dialogVisible)
      setUserGroupTable((prev) => ({
        ...prev,
        table: userGroupList,
      }));
    else {
      setUserGroupTable(tableStructure);
      setUserGroupData(userGroupStructure);
      setUserGroupValidation(userGroupValidationStructure);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogVisible, userGroupList]);

  return (
    <>
      <DialogComponent
        header="Add User Group"
        visible={dialogVisible}
        onHide={onHide}
        className="userGroupDialog"
      >
        <Grid container>
          <Grid size={2} className="userGroupCell">
            <span className="font-bold">Group ID</span>
          </Grid>
          <Grid size={4} className="userGroupCell">
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
          <Grid size={2} className="userGroupCell">
            <span className="font-bold">Group Name</span>
          </Grid>
          <Grid size={4} className="userGroupCell">
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
          <Grid size={2} className="userGroupCell">
            <span className="font-bold">Manager</span>
          </Grid>
          <Grid size={4} className="userGroupCell">
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
              options={managerList}
              optionLabel="userName"
              optionValue="userId"
              placeholder="Select Manager"
              className="w-full mr-1"
            />
          </Grid>
          <Grid size={2} className="userGroupCell">
            <span className="font-bold">Phone</span>
          </Grid>
          <Grid size={4} className="userGroupCell">
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
          <Grid size={2} className="userGroupCell">
            <span className="font-bold">Active</span>
          </Grid>
          <Grid size={4} className="userGroupCell">
            <Checkbox
              checked={userGroupData.active}
              onChange={(e) =>
                setUserGroupData((prev) => ({ ...prev, active: e.checked }))
              }
            />
          </Grid>
          <Grid size={6} className="userGroupCell flex justify-content-center">
            <Button
              label="Add Group"
              icon="pi pi-plus"
              severity="info"
              aria-label="Bookmark"
              onClick={async () => {
                await addUserGroup(
                  userGroupData,
                  setUserGroupValidation,
                  toastRef,
                  userGroupList,
                  setUserGroupTable,
                  userGroupValidationStructure
                );
                console.log(userGroupTable);
              }}
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
                  userGroupList
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
                  managerList.filter(
                    (m) =>
                      m.userId.toLowerCase() ===
                      rowData.groupManager.toLowerCase()
                  )[0]?.userName
                }
                editor={(options) => (
                  <Dropdown
                    value={options.value}
                    filter
                    onChange={(e) => options.editorCallback(e.value)}
                    options={managerList}
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

export default UserGroup;
