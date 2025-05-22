import React from 'react'


import { TabView, TabPanel } from "primereact/tabview";

import ApprovedTourClaimTable from './ApprovedTourClaimTable';
import AppliedTourClaimTable from './AppliedTourClaimTable';

 const AdminTourClaims  = () => {
  return (
   
    <div className='max-w-[85rem] mx-auto p-4 min-h-screen bg-gray-100'>
        <TabView >
             <TabPanel header="Applied">
             <AppliedTourClaimTable/>    
            </TabPanel> 
             <TabPanel header="Approved">
              <ApprovedTourClaimTable/>
            </TabPanel>   
        </TabView>
    </div>

   
  )
}

export default AdminTourClaims
