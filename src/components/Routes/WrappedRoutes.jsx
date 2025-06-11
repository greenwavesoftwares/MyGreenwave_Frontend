import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
import "primereact/resources/primereact.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import TravelDesk from "../../Modules/TravelDesk/TravelDesk";
import SalarySlip from "../../Modules/SalarySlip/Salaryslip";
import Appraisal from "../../Modules/Appraisal/Appraisal";
import TourClaim from "../../Modules/Claims/TourClaim";
import MiscellaneousClaim from "../../Modules/Claims/MiscellaneousClaim";
import LoanApplication from "../../Modules/Claims/LoanApplication";
import Nalanda from "../../Modules/Nalanda/Nalanda";
import LeaveApplication from "../../Modules/LeaveManagement/LeaveApplication/LeaveApplication";
import UserProfile from "../../Modules/UserProfile/UserProfile";
import Referral from "../../Modules/Referrals/Referral";
import HomePage from "../../Modules/Home/HomePage";

// Admin Sub-Routes
import AdminRoutes from "./AdminRoutes";
import React from "react";

function WrappedRoutes() {
  return (
    <React.Fragment>
      {/* Redirect base to home */}
      <Route index element={<Navigate to="home-page" />} />

      {/* Admin section with nested routes */}
      <Route path="admin" element={<Outlet />}>
        {AdminRoutes()}
      </Route>

      {/* Individual Routes */}
      <Route path="leave-application" element={<LeaveApplication />} />
      <Route path="travel-desk" element={<TravelDesk />} />
      <Route path="salary-slip" element={<SalarySlip />} />
      <Route path="appraisal" element={<Appraisal />} />
      <Route path="referral" element={<Referral />} />
      <Route path="nalanda" element={<Nalanda />} />
      <Route path="profile" element={<UserProfile />} />
      <Route path="home" element={<HomePage />} />

      {/* Claim section with nested routes */}
      <Route path="claim" element={<Outlet />}>
        <Route path="tour" element={<TourClaim />} />
        <Route path="miscellaneous" element={<MiscellaneousClaim />} />
        <Route path="loan-application" element={<LoanApplication />} />
      </Route>

      {/* For wrong routing go to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </React.Fragment>
  );
}

export default WrappedRoutes;
