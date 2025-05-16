
import MiscellaneousClaimForm from './MiscellaneousClaimForm'
import React from 'react';
import { TabView, TabPanel } from "primereact/tabview";
import DraftForm from './DraftForm';
import MiscellaneousClaimTable from './MiscellaneousClaimTable'


const MiscellaneousClaim = () => {
    return (
        <div>
            <div className='max-w-[85rem] mx-auto p-4 min-h-screen bg-gray-100'>
                <TabView >
                    <TabPanel header="New Claim">
                        <MiscellaneousClaimForm />
                    </TabPanel>
                    {/* <TabPanel header="My Drafts" >
                    <DraftForm/>
                    </TabPanel> */}
                    <TabPanel header="My Claims">
                      <MiscellaneousClaimTable/>
                    </TabPanel>
                </TabView>
            </div>
        </div>



    );
}

export default MiscellaneousClaim