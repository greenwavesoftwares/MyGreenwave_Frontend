import React from 'react';
import { TabView, TabPanel } from "primereact/tabview";
import TourClaimForm from './TourClaimForm';
import TourClaimTable from './TourClaimTable';
import DraftForm from './DraftForm';
import MyClainTourForm from './MyClainTourForm';

const TourClaim = () => {
    return (
        <div className="bg-gradient-to-br from-blue-50 to-white min-h-screen py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto bg-white shadow-2xl rounded-3xl   transition-all duration-300">
                {/* <h4 className="text-xl font-bold text-center text-blue-800 mb-6">
                    Tour Claim Portal
                </h4> */}

                <TabView className="p-tabview-custom">
                    <TabPanel header="New Claim">
                        <div className="space-y-6">
                            <TourClaimForm />
                            <TourClaimTable />
                        </div>
                    </TabPanel>

                    <TabPanel header="MyDrafts-MyClaims">
                        <div className="space-y-10">

                            {/* My Drafts Section */}
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm">
                                <h2 className="text-md font-semibold text-gray-700 mb-4">📝 My Drafts</h2>
                                <DraftForm />
                            </div>

                            {/* My Claims Section */}
                            <div className="bg-white border border-blue-100 rounded-xl p-6 shadow-sm">
                                <h2 className="text-md font-semibold text-blue-800 mb-4">📂 My Claims</h2>
                                <MyClainTourForm />
                            </div>
                        </div>
                    </TabPanel>

                    {/* <TabPanel header="My Claims">
                        <div className="bg-white border border-blue-100 rounded-xl p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-blue-800 mb-4">📁 My Claims</h2>
                            <p className="text-gray-600">No data available.</p>

                        </div>
                    </TabPanel> */}
                </TabView>
            </div>
        </div>
    );
};

export default TourClaim;
