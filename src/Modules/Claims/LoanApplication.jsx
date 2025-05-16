
import React,{useState} from 'react';
import { TabView, TabPanel } from "primereact/tabview";
import LoanApplicationForm from './LoanApplicationForm';
import LoanTable from './LoanTable';


const LoanApplication = () => {
  const [loanData,setloanData]=useState();
  return (
    <div>
    <div className='max-w-[85rem] mx-auto p-4 min-h-screen bg-gray-100'>
        <TabView >
            <TabPanel header="New Claim">
              <LoanApplicationForm/>
            </TabPanel>           
            <TabPanel header="My Claims">
               <LoanTable loanData={loanData} setloanData={setloanData}/>
            </TabPanel>
        </TabView>
    </div>
</div>

  )
}

export default LoanApplication