import { TabView, TabPanel } from "primereact/tabview";

import SetteldTable from "./SetteldTable";
import ApprovedTable from "./ApprovedTable";
import CompleteRequestedTable from "./CompleteRequestedTable";
import CompletedTable from "./CompletedTable";

const OpenTravelsTableCopy = () => {
  return (
    <div className="max-w-[85rem] mx-auto p-4 min-h-screen bg-gray-100">
      <TabView>
        <TabPanel header="Approved">
          <ApprovedTable />
        </TabPanel>
        {/* <TabPanel header="Setteld">
          <SetteldTable />
        </TabPanel> */}
      </TabView>
      {/* <TabView>
        <TabPanel header="CompleteRequested">
          <CompleteRequestedTable />
        </TabPanel>
        <TabPanel header="Competed">
          <CompletedTable />
        </TabPanel>
      </TabView> */}
    </div>
  );
};

export default OpenTravelsTableCopy;
