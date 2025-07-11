import MiscellaneousClaimForm from "./MiscellaneousClaimForm";
import React from "react";
import { TabView, TabPanel } from "primereact/tabview";
import DraftForm from "./DraftForm";
import MiscellaneousClaimTable from "./MiscellaneousClaimTable";

const MiscellaneousClaim = () => {
  return (
    <div className="container mx-auto px-4">
      <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
        <div className="mt-4  shadow rounded">
          <TabView>
            <TabPanel header="New Claim">
              <MiscellaneousClaimForm />
            </TabPanel>
            {/* <TabPanel header="My Drafts" >
                    <DraftForm/>
                    </TabPanel> */}
            <TabPanel header="My Claims">
              <MiscellaneousClaimTable />
            </TabPanel>
          </TabView>
        </div>
      </div>
    </div>
  );
};

export default MiscellaneousClaim;
