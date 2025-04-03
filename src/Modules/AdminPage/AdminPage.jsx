import React, { useEffect, useState } from "react";
import { ProductService } from "../../Services/ProductService";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Container } from "@mui/material";
import Grid from "../../components/Grid/Grid";
import { TabMenu } from "primereact/tabmenu";
import { Badge } from "primereact/badge";

const AdminPage = () => {
  const [tableData, setTableData] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRenderer = (item, itemIndex, userCount, severity) => (
    <a
      className="p-menuitem-link flex align-items-center gap-2"
      onClick={() => setActiveIndex(itemIndex)}
    >
      <Badge severity={severity} />
      <span className="font-bold p-overlay-badge">
        {item.name}
        <Badge
          value={userCount}
          severity={severity}
          className="userCountBadge"
        />
      </span>
    </a>
  );
  const items = [
    {
      name: "Active Users",
      template: (item) => itemRenderer(item, 0, 12, "success"),
    },
    {
      name: "Inactive Users",
      template: (item) => itemRenderer(item, 1, 2, "danger"),
    },
  ];

  useEffect(() => {
    ProductService.getProducts().then((data) => setTableData(data));
  }, []);
  const header = (
    <div>
      <TabMenu
        model={items}
        activeIndex={activeIndex}
        onTabChange={(e) => setActiveIndex(e.index)}
      />
    </div>
  );
  return (
    <>
      <Container size="lg" className="mt-5">
        <DataTable
          value={tableData}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          tableStyle={{ minWidth: "50rem" }}
          header={header}
        >
          <Column field="name" header="Name" style={{ width: "25%" }}></Column>
          <Column
            field="description"
            header="Description"
            style={{ width: "25%" }}
          ></Column>
          <Column
            field="category"
            header="Category"
            style={{ width: "25%" }}
          ></Column>
          <Column
            field="quantity"
            header="Quantity"
            style={{ width: "25%" }}
          ></Column>
        </DataTable>
      </Container>
    </>
  );
};

export default AdminPage;
