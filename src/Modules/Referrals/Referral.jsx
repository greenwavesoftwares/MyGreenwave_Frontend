
import { TabView, TabPanel } from "primereact/tabview";
import ReferralTable from "./ReferralTable";
import ReferralForm from "./ReferralForm";



 const Referral  = () => {
  return (
   
    <div className='max-w-[85rem] mx-auto p-4 min-h-screen '>
        <TabView >
           <TabPanel header="New Form">
            <ReferralForm/>
            </TabPanel> 
            <TabPanel header="History">
            <ReferralTable/>
            </TabPanel> 
            
        </TabView>
    </div>

   
  )
}

export default Referral

