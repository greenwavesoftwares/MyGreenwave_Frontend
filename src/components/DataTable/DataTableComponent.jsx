// DataTableComponent.js
import { DataTable } from "primereact/datatable";
import { ProgressBar } from "primereact/progressbar";
import { Column } from "primereact/column";

export const DataTableComponent = ({
  data,
  rows,
  tableStyle,
  emptyMessage,
  children,
  className,
  dataKey,
  paginator = true,
   header,
   filters,
  globalFilterFields
}) => {
  return (
    <DataTable
      value={data}
      showGridlines
      paginator={paginator}
      rows={rows}
      className={className}
      tableStyle={tableStyle}
      emptyMessage={emptyMessage}
      dataKey={dataKey}
       header={header}
        filters={filters}
        globalFilterFields={globalFilterFields}
    >
      {children}
    </DataTable>
  );
};

export const ExpandableDataTableComponent = ({
  data,
  rows,
  className,
  tableStyle,
  dataKey,
  emptyMessage,
  children,
  onRowToggle,
  expandedRows,
  rowExpansionTemplate,
  header,
  filters,
  globalFilterFields
  
}) => {
  return (
    <DataTable
      value={data}
      expandedRows={expandedRows}
      onRowToggle={onRowToggle}
      rowExpansionTemplate={rowExpansionTemplate}
      showGridlines
      className={className}
      tableStyle={tableStyle}
      dataKey={dataKey}
      paginator
      rows={rows}
      emptyMessage={emptyMessage}
       header={header}
        filters={filters}
        globalFilterFields={globalFilterFields}
    >
      {children}
    </DataTable>
  );
};

export const CustomeEditableDataTable=({ref,
          value,
          editMode,
          dataKey,
          onRowEditComplete,
          editingRows,
          onRowEditChange,
          header,
         className,
           textSize,
            tableStyle,
          emptyMessage,
          children
})=>{
return(
   <DataTable
          ref={ref}
          value={value}
          editMode={editMode}
          dataKey={dataKey}
          onRowEditComplete={onRowEditComplete}
          editingRows={editingRows}
          onRowEditChange={onRowEditChange}
          header={header}
        className={className}
           textSize={textSize}
            tableStyle={tableStyle}
          emptyMessage={emptyMessage}
          showGridlines
        >
           {children}
        </DataTable>
)}

export const CustomColumn = ({
  field,
  header,
  headerStyle,
  bodyStyle,
  sortable = false,
  filter = false,
  body,
}) => {
  return (
    <Column
      field={field}
      header={header}
      headerStyle={headerStyle}
      bodyStyle={bodyStyle}
      sortable={sortable}
      filter={filter}
      body={body} // optional body renderer if needed
    />
  );
};


export const CustomEditableColumn = ({
 field,
          header,
          editor=false,
          body,
          headerStyle,
          bodyStyle
}) => {
  return (
    <Column
      field={field}
      header={header}
      editor={editor}
     // headerStyle={headerStyle}
    //  bodyStyle={bodyStyle}
     // sortable={sortable}
     // filter={filter}
      body={body} // optional body renderer if needed
    />
  );
};

