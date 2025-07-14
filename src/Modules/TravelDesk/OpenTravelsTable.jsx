import { TabView, TabPanel } from "primereact/tabview";

import ApprovedTable from "./ApprovedTable";
import CompletedTable from "./CompletedTable";

const OpenTravelsTable = () => {
  return (
    <div className="container mx-auto px-4">
        <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
          <div className="cardStyle mt-4 bg-white shadow rounded">
      <TabView>
        <TabPanel header="On Going Travel">
          <ApprovedTable />
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



export default OpenTravelsTable;
