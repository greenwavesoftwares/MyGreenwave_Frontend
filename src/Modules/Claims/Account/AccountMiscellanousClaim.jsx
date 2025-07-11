import React from "react";

import { TabView, TabPanel } from "primereact/tabview";

import AccountMiscellanousClaimApprover from "./AccountMiscellanousClaimApprover";
import AccountMiscellanousClaimHistory from "./AccountMiscellanousClaimHistory";

const AccountMiscellanousClaim = () => {
  return (
    <div className="container mx-auto px-4">
      <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
        <div className="mt-3  shadow rounded">
          <TabView>
            <TabPanel header="Applied">
              <AccountMiscellanousClaimApprover />
            </TabPanel>
            <TabPanel header="History">
              <AccountMiscellanousClaimHistory />
            </TabPanel>
          </TabView>
        </div>
      </div>
    </div>
  );
};

export default AccountMiscellanousClaim;
