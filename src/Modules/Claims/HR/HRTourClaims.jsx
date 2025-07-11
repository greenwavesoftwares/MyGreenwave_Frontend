import React from 'react'


import { TabView, TabPanel } from "primereact/tabview";

import ApprovedTourClaimTable from './ApprovedTourClaimTable';
import HRTourClaimTable from './HRTourClaimTable';

 const HRTourClaims  = () => {
  return (
   
    
 <div className="container mx-auto px-4">
          <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
            <div className="mt-3  shadow rounded">
        <TabView >
             <TabPanel header="Reviewed">
             <HRTourClaimTable/>    
            </TabPanel> 
             <TabPanel header="History">
              <ApprovedTourClaimTable/>
            </TabPanel>   
        </TabView>
    </div>
</div>
</div>
   
  )
}

export default HRTourClaims
