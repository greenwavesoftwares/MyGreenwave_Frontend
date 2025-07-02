
import { TabView, TabPanel } from "primereact/tabview";
import ReferralTable from "./ReferralTable";
import ReferralForm from "./ReferralForm";



 const Referral  = () => {
  return (
   
    <div className="container mx-auto px-4">
          <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
            <div className="card mt-4 py-2 px-3">
        <TabView >
           <TabPanel header="New Form">
            <ReferralForm/>
            </TabPanel> 
            <TabPanel header="History">
            <ReferralTable/>
            </TabPanel> 
            
        </TabView>
    </div>
    </div>
    </div>

   
  )
}

export default Referral

