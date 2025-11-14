import { Navigate, Outlet, Route } from "react-router-dom";
import AdminPage from "../../Modules/AdminPage/AdminPage";
import AppraisalsReview from "../../Modules/Appraisal/Appraisals Review/AppraisalsReview";
import AppraisalsApprover from "../../Modules/Appraisal/Appraisals Approver/AppraisalsApprover";
import SalarySlipUpload from "../../Modules/SalarySlip/SalarySlipUpload";
import AppraisalTracker from "../../Modules/AppraisalTracker/AppraisalTracker";
import TrainingMaster from "../../Modules/Training_Master/TrainingMaster";
import HolidayMaster from "../../Modules/HolidayMaster/HolidayMaster";
import TrainingScheduleMaster from "../../Modules/TrainingScheduleMaster/TrainingScheduleMaster";
import LeaveManagerApproval from "../../Modules/LeaveManagement/LeaveManagerApproval/LeaveManagerApproval";
import LeaveAdmin from "../../Modules/LeaveManagement/LeaveAdmin/LeaveAdmin";
import AccountTourClaims from "../../Modules/Claims/Account/AccountTourClaims";
import HRTourClaims from "../../Modules/Claims/HR/HRTourClaims";
import HRLoanApplication from "../../Modules/Claims/HR/HRLoanApplication";
import TravelDeskManager from "../../Modules/TravelDeskManager/TravelDeskManager";
import AccountMiscellanousClaim from "../../Modules/Claims/Account/AccountMiscellanousClaim";
import HRReferralPage from "../../Modules/Referrals/HRReferralPage";
import HomepageMaster from "../../Modules/HomePageMaster/HomepageMaster";
import HolidayMain from "../../Modules/HolidayMaster/HolidayMain"

import AccountMain from "../../Modules/TravelDesk/TravelDeskAccount/AccountMain";
import OpenTravelsTable from "../../Modules/TravelDesk/OpenTravelsTable";
import React from "react";

function AdminRoutes() {
  return (
    <React.Fragment>
      {/* Admin home */}
      <Route index element={<AdminPage />} />

      {/* Leave */}
      <Route path="leave" element={<Outlet />}>
        <Route path="manager" element={<LeaveManagerApproval />} />
        {/* Holiday */}
      <Route path="holiday" element={<HolidayMain/>} />
        <Route index element={<LeaveAdmin />} />
      </Route>

      {/* Travel desk */}
      <Route path="travel-desk" element={<Outlet />}>
        <Route path="manager" element={<TravelDeskManager />} />
        <Route path="overview" element={<OpenTravelsTable />} />
        {/* <Route path="booking" element={<TravelDeskBooking />} /> */}
        <Route path="booking" element={<AccountMain />} />
      </Route>

      {/* Claim */}
      <Route path="claim" element={<Outlet />}>
        <Route path="review-tour" element={<AccountTourClaims />} />
        <Route path="approve-tour" element={<HRTourClaims />} />
        <Route path="miscellaneous" element={<AccountMiscellanousClaim />} />
        <Route path="loan" element={<HRLoanApplication />} />
      </Route>

      {/* Referral */}
      <Route path="referral" element={<HRReferralPage />} />

      {/* Appraisals */}
      <Route path="appraisal" element={<Outlet />}>
        <Route path="review" element={<AppraisalsReview />} />
        <Route path="approver" element={<AppraisalsApprover />} />
        <Route index element={<AppraisalTracker />} />
      </Route>

      {/* Salary Slip */}
      <Route path="salary-slip" element={<SalarySlipUpload/>} />

      {/* Training */}
      <Route path="training" element={<Outlet />}>
        <Route index element={<TrainingMaster />} />
        <Route path="schedule" element={<TrainingScheduleMaster />} />
      </Route>

      

      {/* Home Page */}
      <Route path="event" element={<HomepageMaster />} />

      {/* For wrong routing go to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </React.Fragment>
  );
}

export default AdminRoutes;
