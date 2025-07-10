import { TabView, TabPanel } from "primereact/tabview";

import OngoingTravel from "./OngoingTravel";
import CompletedTable from "../CompletedTable";

const AccountMain = () => {
  return (
    <div className="container mx-auto px-4">
        <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
          <div className="cardStyle mt-4 bg-white shadow rounded">
      <TabView>
        <TabPanel header="On Going Travel">
          <OngoingTravel />
        </TabPanel>
        <TabPanel header="History">
          <CompletedTable />
        </TabPanel>
      </TabView>
    </div>
    </div>
    </div>
  );
};




export default AccountMain