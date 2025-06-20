// DataTableComponent.js
import { DataTable } from "primereact/datatable";
import { ProgressBar } from "primereact/progressbar";
import { Column } from "primereact/column";

export const DataTableComponent = ({ data, rows,  tableStyle, emptyMessage, children,className }) => {
  return (
    <DataTable
      value={data}
      showGridlines
      paginator
      rows={rows}
      className={className}
      tableStyle={tableStyle}
      emptyMessage={emptyMessage}
    >
      {children}
    </DataTable>
  );
};

export const ExpandableDataTableComponent=({ data, rows, className, tableStyle,dataKey, emptyMessage, children ,onRowToggle,expandedRows,rowExpansionTemplate})=>
{
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
                emptyMessage={
                  emptyMessage
               }
             
             >
              {children}
             </DataTable>
  );
}

export const CustomColumn = ({
  field,
  header,
  headerStyle,
  bodyStyle,
  sortable = false,
  filter = false,
  body
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



