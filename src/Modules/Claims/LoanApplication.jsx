
import React from 'react';
import { TabView, TabPanel } from "primereact/tabview";

import LoanApplicationForm from './LoanApplicationForm';
import DraftForm from './DraftForm';

const LoanApplication = () => {
  return (
    <div>
    <div className='max-w-[85rem] mx-auto p-4 min-h-screen bg-gray-100'>
        <TabView >
            <TabPanel header="New Claim">
              <LoanApplicationForm/>
            </TabPanel>


            <TabPanel header="My Drafts" >
            <DraftForm/>
            </TabPanel>
            <TabPanel header="My Claims">
                <p className="m-0">My Claims</p>
            </TabPanel>
        </TabView>
    </div>
</div>

  )
}

export default LoanApplication