
import { TabView, TabPanel } from "primereact/tabview";

import HRApprovalPage from "./HRApprovalPage";
import HRReferralTable from "./HRReferralTable";




 const HRReferralPage  = () => {
  return (
   
    <div className='max-w-[85rem] mx-auto p-4 min-h-screen '>
        <TabView >
           <TabPanel header="Referred">
            <HRApprovalPage/>
            </TabPanel> 
            <TabPanel header="History">
            <HRReferralTable/>
            </TabPanel> 
            
        </TabView>
    </div>

   
  )
}

export default HRReferralPage

