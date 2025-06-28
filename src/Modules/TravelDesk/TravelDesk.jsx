import { TabView, TabPanel } from "primereact/tabview";
import MyForm from "./MyForms";
import RequisitionForm from "./RequisitionForm";

const TravelDesk = () => {
 
  return (
    <div className="max-w-[85rem] mx-auto p-6 min-h-screen bg-gray-100">
      <TabView>
        <TabPanel header="Requisition Form">
   <RequisitionForm/>
        </TabPanel>
        <TabPanel header="My Forms">
          <MyForm/>
        </TabPanel>
      </TabView>
    </div>
  );
};




export default TravelDesk