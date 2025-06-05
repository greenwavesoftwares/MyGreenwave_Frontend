import { TabView, TabPanel } from "primereact/tabview";

import ApprovedTable from "./ApprovedTable";
import CompletedTable from "./CompletedTable";

const OpenTravelsTableCopy = () => {
  return (
    <div className="max-w-[85rem] mx-auto p-4 min-h-screen bg-gray-100">
      <TabView>
        <TabPanel header="Approved And Settled Data">
          <ApprovedTable />
        </TabPanel>
        <TabPanel header="Complete And CompleteRequested Data">
          <CompletedTable />
        </TabPanel>
      </TabView>
    </div>
  );
};

export default OpenTravelsTableCopy;
