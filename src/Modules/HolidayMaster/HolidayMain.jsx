import React from 'react'


import { TabView, TabPanel } from "primereact/tabview";

import LeaveMaster from './LeaveMaster';
import HolidayMaster from './HolidayMaster';

 const HolidayMain  = () => {
  return (
   
    
 <div className="container mx-auto px-4">
          <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
            <div className="mt-3  shadow rounded">
        <TabView >
             <TabPanel header="Holidays">
             <HolidayMaster/>    
            </TabPanel> 
             <TabPanel header="Leave Master">
              <LeaveMaster/>
            </TabPanel>   
        </TabView>
    </div>
</div>
</div>
   
  )
}

export default HolidayMain
