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
import Restricted from "../../Restricted";
import ClientPage from "../../features/meal booking/pages/ClientPage";
import MealAdminPage from "../../features/meal booking/pages/MealAdminPage";
import CookMealVerification from "../../features/meal booking/pages/CookMealVerification";
import Assignee from "../../Modules/Assignee/Assignee";

function WrappedRoutes() {
  return (
    <React.Fragment>
      {/* Redirect base to home */}
      <Route index element={<Navigate to="home" />} />

      {/* Admin section with nested routes */}
      <Route path="admin" element={<Outlet />}>
        {AdminRoutes()}
      </Route>

      {/* Individual Routes */}
      <Route path="leave" element={<LeaveApplication />} />
      <Route path="travel-desk" element={<TravelDesk />} />
      <Route path="salary-slip" element={<SalarySlip />} />
      <Route path="appraisal" element={<Appraisal />} />
      <Route path="referral" element={<Referral />} />
      <Route path="nalanda" element={<Nalanda />} />
      <Route path="profile" element={<UserProfile />} />
      <Route path="home" element={<HomePage />} />
      <Route path="meal" element={<ClientPage />} />
      <Route path="admin-meal" element={<MealAdminPage />} />
      <Route path="meal-verification" element={<CookMealVerification />} />
      <Route path="assignee" element={<Assignee/>}/>

      {/* Claim section with nested routes */}
      <Route path="claim" element={<Outlet />}>
        <Route path="tour" element={<TourClaim />} />
        <Route path="miscellaneous" element={<MiscellaneousClaim />} />
        <Route path="loan" element={<LoanApplication />} />
      </Route>

      {/* For wrong routing go to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
       <Route path="restricted" element={<Restricted/>}/>
    </React.Fragment>
  );
}

export default WrappedRoutes;
