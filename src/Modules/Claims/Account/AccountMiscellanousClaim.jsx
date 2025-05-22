import React from 'react'


import { TabView, TabPanel } from "primereact/tabview";

import AccountMiscellanousClaimApprover from './AccountMiscellanousClaimApprover';
import AccountMiscellanousClaimHistory from './AccountMiscellanousClaimHistory';

 const AccountMiscellanousClaim  = () => {
  return (
    <div className='max-w-[85rem] mx-auto p-4 min-h-screen bg-gray-100'>
        <TabView >
             <TabPanel header="Applied">
             <AccountMiscellanousClaimApprover/>    
            </TabPanel> 
            <TabPanel header="History">
             <AccountMiscellanousClaimHistory/>    
            </TabPanel> 
        </TabView>
    </div>

   
  )
}

export default AccountMiscellanousClaim
