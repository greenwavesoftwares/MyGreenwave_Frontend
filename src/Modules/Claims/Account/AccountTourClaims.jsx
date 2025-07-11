import React from "react";

import { TabView, TabPanel } from "primereact/tabview";

import ApprovedTourClaimTable from "./ApprovedTourClaimTable";
import AppliedTourClaimTable from "./AppliedTourClaimTable";

const AdminTourClaims = () => {
  return (
    <div className="container mx-auto px-4">
      <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
        <div className="mt-3  shadow rounded">
          <TabView>
            <TabPanel header="Applied">
              <AppliedTourClaimTable />
            </TabPanel>
            <TabPanel header="Approved">
              <ApprovedTourClaimTable />
            </TabPanel>
          </TabView>
        </div>
      </div>
    </div>
  );
};

export default AdminTourClaims;
