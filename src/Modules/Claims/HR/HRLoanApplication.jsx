import React from 'react'
import { TabView, TabPanel } from "primereact/tabview";
import ApprovedLoanApplicationTable from './ApprovedLoanApplicationTable';
import HRLoanApplicationTable from './HRLoanApplicationTable';

 const HRLoanApplication  = () => {
  return (
   
    
 <div className="container mx-auto px-4">
          <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
            <div className="mt-3  shadow rounded">
        <TabView >
             <TabPanel header="Applied">
             <HRLoanApplicationTable/>    
            </TabPanel> 
             <TabPanel header="History">
              <ApprovedLoanApplicationTable/>
            </TabPanel>   
        </TabView>
    </div>
</div>
</div>
   
  )
}

export default HRLoanApplication
