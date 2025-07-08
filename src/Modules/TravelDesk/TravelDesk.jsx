import { TabView, TabPanel } from "primereact/tabview";
import MyForm from "./MyForms";
import RequisitionForm from "./RequisitionForm";

const TravelDesk = () => {
 
  return (
    <div className="container mx-auto px-4">
      <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
        <div className="cardStyle mt-4 bg-white shadow rounded">
      <TabView>
        <TabPanel header="Requisition Form">
   <RequisitionForm/>
        </TabPanel>
        <TabPanel header="My Forms">
          <MyForm/>
        </TabPanel>
      </TabView>
    </div>
     </div>
      </div>
  );
};




export default TravelDesk