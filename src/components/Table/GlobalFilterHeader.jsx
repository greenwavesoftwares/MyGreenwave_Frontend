import { FilterMatchMode } from "primereact/api";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import React from "react";
import CustomInputText from "../InputText/InputText";

const GlobalFilterHeader = ({ start = {}, table, setTable }) => {
  return (
    <div className="flex justify-between items-center">
      {start}
      <IconField iconPosition="left">
        <InputIcon className="pi pi-search" />
        <CustomInputText
          value={table.filterText}
          onChange={(e) => {
            const value = e.target.value;
            const _filters = {
              ...table.filterStructure,
              global: {
                ...table.filterStructure.global,
                value,
              },
            };
            setTable((p) => ({
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
};

export default GlobalFilterHeader;
