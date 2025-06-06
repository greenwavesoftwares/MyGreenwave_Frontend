import { TabView, TabPanel } from "primereact/tabview";

import ApprovedTable from "./ApprovedTable";
import CompletedTable from "./CompletedTable";

const OpenTravelsTableCopy = () => {
  return (
    <div className="max-w-[85rem] mx-auto p-4 min-h-screen bg-gray-100">
      <TabView>
        <TabPanel header="On Going Travel">
          <ApprovedTable />
        </TabPanel>
        <TabPanel header="History">
          <CompletedTable />
        </TabPanel>
      </TabView>
    </div>
  );
};

export default OpenTravelsTableCopy;
