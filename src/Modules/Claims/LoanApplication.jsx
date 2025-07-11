
import React,{useState} from 'react';
import { TabView, TabPanel } from "primereact/tabview";
import LoanApplicationForm from './LoanApplicationForm';
import LoanTable from './LoanTable';


const LoanApplication = () => {
  const [loanData,setloanData]=useState();
  return (
    <div>
    <div className="container mx-auto px-4">
      <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
        <div className="mt-4  shadow rounded">
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
    </div>
</div>

  )
}

export default LoanApplication