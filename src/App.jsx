import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Carousel from "./components/Carousel/Carousel";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
import "primereact/resources/primereact.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import DialogComponent from "./components/Dialog/DialogComponent";
import DropdownCheckbox from "./components/DropdownCheckbox/DropdownCheckbox";
import TravelDesk from "./Modules/TravelDesk/TravelDesk";
import SalarySlip from "./Modules/SalarySlip/Salaryslip";
import Login from "./Modules/Login/Login";
import AdminPage from "./Modules/AdminPage/AdminPage";
import ModeOfTransportTable from "./Modules/TravelDesk/ModeOfTransportTable";
import Appraisal from "./Modules/Appraisal/Appraisal";
import Claim from "./Modules/Claims/Claim";
import TourClaim from "./Modules/Claims/TourClaim";
import MiscellaneousClaim from "./Modules/Claims/MiscellaneousClaim";
import LoanApplication from "./Modules/Claims/LoanApplication";
import AppraisalsReview from "./Modules/Appraisal/Appraisals Review/AppraisalsReview";
import AppraisalsApprover from "./Modules/Appraisal/Appraisals Approver/AppraisalsApprover";
import SalarySlipUpload from "./Modules/SalarySlip/SalarySlipUpload";
import AppraisalTracker from "./Modules/AppraisalTracker/AppraisalTracker";
import TrainingMaster from "./Modules/Training_Master/TrainingMaster";
import HolidayMaster from "./Modules/HolidayMaster/HolidayMaster";
import Nalanda from "./Modules/Nalanda/Nalanda";
import TrainingScheduleMaster from "./Modules/TrainingScheduleMaster/TrainingScheduleMaster";
import LeaveApplication from "./Modules/LeaveManagement/LeaveApplication/LeaveApplication";
import LeaveManagerApproval from "./Modules/LeaveManagement/LeaveManagerApproval/LeaveManagerApproval";
import LeaveAdmin from "./Modules/LeaveManagement/LeaveAdmin/LeaveAdmin";
import AccountTourClaims from "./Modules/Claims/Account/AccountTourClaims";
import HRTourClaims from "./Modules/Claims/HR/HRTourClaims";
import HRLoanApplication from "./Modules/Claims/HR/HRLoanApplication";
import TravelDeskAdvanced from "./Modules/TravelDesk/TravelDeskAdvanced";
import TravelDeskManager from "./Modules/TravelDeskManager/TravelDeskManager";
import UserProfile from "./Modules/UserProfile/UserProfile";
import AccountMiscellanousClaim from "./Modules/Claims/Account/AccountMiscellanousClaim";
import Referral from "./Modules/Referrals/Referral";
import HRReferralPage from "./Modules/Referrals/HRReferralPage";
import HomePage from "./Modules/Home/HomePage";
import HomepageMaster from "./Modules/HomePageMaster/HomepageMaster";

//Menu Bar
import MenuBar from "./components/MenuBar/MenuBar";
import OpenTravelsTableCopy from "./Modules/TravelDesk/OpenTravelsTableCopy";
import AccountMain from "./Modules/TravelDesk/TravelDeskAccount/AccountMain";
import TravelDeskBooking from "./Modules/TravelDesk/TravelDeskBooking";

function App() {
  return (
    <Router>
      <MenuBar>
        {/* <DropdownCheckbox> </DropdownCheckbox> */}
        {/* <DialogComponent></DialogComponent> */}
        {/* <DatePicker></DatePicker> */}
        {/* <Carousel> </Carousel> */}
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/leave-application" element={<LeaveApplication />} />
          <Route
            path="/leave-manager-approval"
            element={<LeaveManagerApproval />}
          />
          <Route path="/leave-admin" element={<LeaveAdmin />} />
          <Route path="/travel-desk" element={<TravelDesk />} />
          <Route path="/travel-deskmanager" element={<TravelDeskManager />} />
          <Route
            path="/travel-desk-advanced"
            element={<TravelDeskAdvanced />}
          />
          <Route
            path="/travel-desk-advanced2"
            element={<OpenTravelsTableCopy />}
          />
          <Route path="/travel-desk-booking" element={<TravelDeskBooking />} />
          <Route path="/travel-desk-booking2" element={<AccountMain />} />

          <Route path="/salary-slip" element={<SalarySlip />} />
          <Route
            path="/ModeOfTransportTable"
            element={<ModeOfTransportTable />}
          />
          <Route path="/appraisal" element={<Appraisal />} />
          <Route path="/claim" element={<Claim />} />
          <Route path="/tour-claim" element={<TourClaim />} />
          <Route path="/account-tour-claim" element={<AccountTourClaims />} />
          <Route path="/hr-tour-claim" element={<HRTourClaims />} />
          <Route path="/miscellaneous-claim" element={<MiscellaneousClaim />} />
          <Route
            path="/account-miscellaneous-claim"
            element={<AccountMiscellanousClaim />}
          />
          <Route path="/loan-application" element={<LoanApplication />} />
          <Route path="/hr-loan-application" element={<HRLoanApplication />} />
          <Route path="/referral" element={<Referral />} />
          <Route path="/hr-referral" element={<HRReferralPage />} />

          <Route path="/appraisals-review" element={<AppraisalsReview />} />
          <Route path="/appraisals-approver" element={<AppraisalsApprover />} />
          <Route path="/salaryslipupload" element={<SalarySlipUpload />} />
          <Route path="/appraisaltracker" element={<AppraisalTracker />} />
          <Route path="/training-master" element={<TrainingMaster />} />
          <Route path="/holidaymaster" element={<HolidayMaster />} />
          <Route path="/nalanda" element={<Nalanda />} />
          <Route
            path="/training-schedule-master"
            element={<TrainingScheduleMaster />}
          />
          <Route path="/userprofile" element={<UserProfile />} />
          <Route path="/homePage" element={<HomePage />} />
          <Route path="/homepageMaster" element={<HomepageMaster />} />
        </Routes>
      </MenuBar>
    </Router>
  );
}

export default App;
