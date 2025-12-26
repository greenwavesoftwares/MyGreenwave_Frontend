
import { TabView, TabPanel } from "primereact/tabview";
import ReferralTable from "./ReferralTable";
import ReferralForm from "./ReferralForm";



 const Referral  = () => {
  return (
    // <div className="container mx-auto px-4">
    //   <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
    //     <div className="card mt-4 py-2 px-3">
       <div className="min-h-screen py-5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className=" rounded-2xl shadow-xl overflow-hidden">
          <div className="h-42 bg-gradient-to-r from-blue-600 to-blue-700 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <img
                src="https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Professional"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative h-full flex flex-col justify-center px-6">
              <h1 className="text-2xl font-bold text-white mb-2">
                Application Form
              </h1>
              <p className="text-blue-100">
                Complete your profile in a few simple steps
              </p>
            </div>
          </div>
          <TabView>
            <TabPanel header="New Form">
              <ReferralForm />
            </TabPanel>
            <TabPanel header="History">
              <ReferralTable />
            </TabPanel>
          </TabView>
        </div>
      </div>
    </div>
  );
}

export default Referral

