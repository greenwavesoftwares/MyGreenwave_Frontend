import React from 'react';
import { TabView, TabPanel } from "primereact/tabview";


import TourClaimForm from './TourClaimForm';
import TourClaimTable from './TourClaimTable';
import DraftForm from './DraftForm';


const TourClaim = () => {

    return (
        <div>
            <div className='max-w-[85rem] mx-auto p-6 min-h-screen bg-gray-100'>
                <TabView >
                    <TabPanel header="New Claim">
                        <TourClaimForm />
                        <TourClaimTable/>
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



    );
};

export default TourClaim;
