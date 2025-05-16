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
import AdminTourClaims from "./Modules/Claims/Admin/AdminTourClaims";
function App() {
  return (
    <Router>
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
        <Route path="/salary-slip" element={<SalarySlip />} />
        <Route
          path="/ModeOfTransportTable"
          element={<ModeOfTransportTable />}
        />
        <Route path="/appraisal" element={<Appraisal />} />
        <Route path="/claim" element={<Claim />} />
        <Route path="/tour-claim" element={<TourClaim />} />
                <Route path="/admin-tour-claim" element={<AdminTourClaims/> } />
        <Route path="/miscellaneous-claim" element={<MiscellaneousClaim />} />
        <Route path="/loan-application" element={<LoanApplication />} />
        <Route path="/appraisals-review" element={<AppraisalsReview />} />
        <Route path="/appraisals-approver" element={<AppraisalsApprover />} />
        <Route path="/salaryslipupload" element={<SalarySlipUpload />} />
        <Route path="/appraisal-tracker" element={<AppraisalTracker />} />
        <Route path="/training-master" element={<TrainingMaster />} />
        <Route path="/holiday-master" element={<HolidayMaster />} />
        <Route path="/nalanda" element={<Nalanda />} />
        <Route
          path="/training-schedule-master"
          element={<TrainingScheduleMaster />}
        />
      </Routes>
    </Router>
  );
}

export default App;
