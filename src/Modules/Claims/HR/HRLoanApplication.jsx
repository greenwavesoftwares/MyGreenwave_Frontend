import React from 'react'
import { TabView, TabPanel } from "primereact/tabview";
import ApprovedLoanApplicationTable from './ApprovedLoanApplicationTable';
import HRLoanApplicationTable from './HRLoanApplicationTable';

 const HRLoanApplication  = () => {
  return (
   
    <div className='max-w-[85rem] mx-auto p-4 min-h-screen bg-gray-100'>
        <TabView >
             <TabPanel header="Applied">
             <HRLoanApplicationTable/>    
            </TabPanel> 
             <TabPanel header="Approved">
              <ApprovedLoanApplicationTable/>
            </TabPanel>   
        </TabView>
    </div>

   
  )
}

export default HRLoanApplication
