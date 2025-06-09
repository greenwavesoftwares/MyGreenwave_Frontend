import { TabView, TabPanel } from "primereact/tabview";

import OngoingTravel from "./OngoingTravel";
import CompletedTable from "../CompletedTable";

const AccountMain = () => {
  return (
    <div className="max-w-[85rem] mx-auto p-4 min-h-screen bg-gray-100">
      <TabView>
        <TabPanel header="On Going Travel">
          <OngoingTravel />
        </TabPanel>
        <TabPanel header="History">
          <CompletedTable />
        </TabPanel>
      </TabView>
    </div>
  );
};




export default AccountMain