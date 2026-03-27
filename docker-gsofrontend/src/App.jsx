import { useReducer, useEffect, useState, memo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom'; // ← ADD useNavigate
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Loginpage from "./pages/LoginScreen/Loginpage";
import Dashboard from "./pages/Userdashboard/Dashboard";
import Maintenace from "./pages/Maintenance/Maintenance";
import Carpentry from "./pages/Maintenance/Carpentry";
import Janitorial from "./pages/Maintenance/Janitorial";
import Electrical from "./pages/Maintenance/Electrical";
import AirConditioning from "./pages/Maintenance/AirConditioning";
import Notifications from "./pages/Userdashboard/Notifications";
import Schedules from "./pages/Userdashboard/Schedules";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import Signuppage from "./pages/SignupScreen/Signuppage";
import Adminnotifications from "./pages/Admin/Adminnotifications";
import AdminSchedules from "./pages/Admin/AdminSchedules";
import AdminMaintenance from "./pages/Admin/AdminMaintenance";
import Requests from "./pages/Admin/Requests";
import AdminJanitorial from "./pages/Admin/adminMaintenance/AdminJanitorial";
import AdminElectrical from "./pages/Admin/adminMaintenance/AdminElectrical";
import AdminCarpentry from "./pages/Admin/adminMaintenance/AdminCarpentry";
import AdminAirconditioning from "./pages/Admin/adminMaintenance/AdminAirconditioning";
import AdminCarpentryform from "./pages/Admin/AdminCarpentryform";
import StaffDashboard from "./pages/Staff/StaffDashboard.jsx";
import StaffSlipRequests from "./pages/Staff/StaffSlipRequests.jsx";
import UserRequests from "./pages/Staff/UserRequests.jsx";
import StaffViewMaintenanceRequestForm from "./pages/Staff/StaffViewMaintenanceRequestForm.jsx";
import AdminUserRequests from "./pages/Admin/AdminUserRequests.jsx";
import AdminUserRequestsForm from "./pages/Admin/AdminUserRequestsForm.jsx";
import StaffMaintenanceRequestForm from "./pages/Staff/StaffMaintenanceRequestForm.jsx";
import HeadDashboard from "./pages/Head/HeadDashboard.jsx";
import HeadMaintenance from "./pages/Head/headmaintenance/HeadMaintenance.jsx";
import HeadJanitorial from "./pages/Head/headmaintenance/HeadJanitorial.jsx";
import HeadCarpentry from "./pages/Head/headmaintenance/HeadCarpentry.jsx";
import HeadElectrical from "./pages/Head/headmaintenance/HeadElectrical.jsx";
import HeadAirconditioning from "./pages/Head/headmaintenance/HeadAirconditioning.jsx";
import StaffMaintenance from "./pages/Staff/StaffMaintenance/StaffMaintenance.jsx";
import StaffJanitorial from "./pages/Staff/StaffMaintenance/StaffJanitorial.jsx";
import StaffElectrical from "./pages/Staff/StaffMaintenance/StaffElectrical.jsx";
import StaffCarpentry from "./pages/Staff/StaffMaintenance/StaffCarpentry.jsx";
import StaffAirconditioning from "./pages/Staff/StaffMaintenance/StaffAirconditioning.jsx";
import HeadRequests from "./pages/Head/HeadRequests.jsx";
import HeadMaintenanceRequestForm from "./pages/Head/HeadMaintenanceRequestForm.jsx";
import RequestStatus from "./pages/Userdashboard/RequestStatus.jsx";
import ViewMaintenanceRequestForm from "./pages/Userdashboard/ViewMaintenanceRequestForm.jsx";
import UserFeedback from "./pages/Userdashboard/UserFeedback.jsx";
import Profile from "./pages/Userdashboard/Profile.jsx";
import UserChangePass from "./pages/Userdashboard/UserChangePass.jsx";
import Report from "./pages/Staff/Report.jsx";
import CampusDirectorDashboard from "./pages/CampusDirector/CampusDirectorDashboard.jsx";
import CampusDirectorRequests from "./pages/CampusDirector/CampusDirectorRequests.jsx";
import CampusDirectorMaintenanceRequestForm from "./pages/CampusDirector/CampusDirectorMaintenanceRequestForm.jsx";
import ViewUserRequestForm from "./pages/Staff/ViewUserRequestForm.jsx";
import StaffNotifications from "./pages/Staff/StaffNotifications.jsx";
import HeadNotifications from "./pages/Head/HeadNotifications.jsx";
import CampusDirectorNotifications from "./pages/CampusDirector/CampusDirectorNotifications.jsx";
import { StaffNotificationProvider } from "./components/StaffSidebar";
import { AdminNotificationProvider } from "./components/AdminSidebar.jsx";
import { UserNotificationProvider } from "./components/Sidebar.jsx";
import { HeadNotificationProvider } from "./components/HeadSidebar.jsx";
import { CampusDirectorNotificationProvider } from "./components/CampusDirectorSidebar.jsx";
import StaffRequestStatus from "./pages/Staff/StaffRequestStatus";
import StaffFeedback from "./pages/Staff/StaffFeedback.jsx";
import FeedbackReview from "./pages/Staff/FeedbackReview.jsx";



function App() {
  const token = localStorage.getItem('token'); // Retrieve token from localStorage

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Loginpage />} />
        <Route path="/loginpage" element={<Loginpage />} />
        <Route path="/signuppage" element={<Signuppage />} />

        {/* User Dashboard Routes - wrapped with UserNotificationProvider */}
        <Route
          path="/dashboard"
          element={
            <UserNotificationProvider>
              <Dashboard />
            </UserNotificationProvider>
          }
        />
        <Route
          path="/notifications"
          element={
            <UserNotificationProvider>
              <Notifications />
            </UserNotificationProvider>
          }
        />
        <Route
          path="/schedules"
          element={
            <UserNotificationProvider>
              <Schedules />
            </UserNotificationProvider>
          }
        />
        <Route
          path="/requeststatus"
          element={
            <UserNotificationProvider>
              <RequestStatus />
            </UserNotificationProvider>
          }
        />
        <Route
          path="/viewmaintenancerequestform/:id"
          element={
            <UserNotificationProvider>
              <ViewMaintenanceRequestForm />
            </UserNotificationProvider>
          }
        />
        <Route
          path="/userfeedback/:id"
          element={
            <UserNotificationProvider>
              <UserFeedback token={token} />
            </UserNotificationProvider>
          }
        />
        <Route
          path="/profile"
          element={
            <UserNotificationProvider>
              <Profile />
            </UserNotificationProvider>
          }
        />
        <Route
          path="/userchangepass"
          element={
            <UserNotificationProvider>
              <UserChangePass />
            </UserNotificationProvider>
          }
        />

        {/* Maintenance Routes - wrapped with UserNotificationProvider */}
        <Route
          path="/maintenance"
          element={
            <UserNotificationProvider>
              <Maintenace />
            </UserNotificationProvider>
          }
        />
        <Route
          path="/janitorial"
          element={
            <UserNotificationProvider>
              <Janitorial token={token} />
            </UserNotificationProvider>
          }
        />
        <Route
          path="/carpentry"
          element={
            <UserNotificationProvider>
              <Carpentry />
            </UserNotificationProvider>
          }
        />
        <Route
          path="/electrical"
          element={
            <UserNotificationProvider>
              <Electrical />
            </UserNotificationProvider>
          }
        />
        <Route
          path="/airconditioning"
          element={
            <UserNotificationProvider>
              <AirConditioning />
            </UserNotificationProvider>
          }
        />

        {/* Admin Routes - wrapped with AdminNotificationProvider */}
        <Route
          path="/admindashboard"
          element={
            <AdminNotificationProvider>
              <AdminDashboard />
            </AdminNotificationProvider>
          }
        />
        <Route
          path="/adminnotifications"
          element={
            <AdminNotificationProvider>
              <Adminnotifications />
            </AdminNotificationProvider>
          }
        />
        <Route
          path="/adminschedules"
          element={
            <AdminNotificationProvider>
              <AdminSchedules />
            </AdminNotificationProvider>
          }
        />
        <Route
          path="/adminmaintenance"
          element={
            <AdminNotificationProvider>
              <AdminMaintenance />
            </AdminNotificationProvider>
          }
        />
        <Route
          path="/requests"
          element={
            <AdminNotificationProvider>
              <Requests token={token} />
            </AdminNotificationProvider>
          }
        />
        <Route
          path="/adminjanitorial"
          element={
            <AdminNotificationProvider>
              <AdminJanitorial token={token} />
            </AdminNotificationProvider>
          }
        />
        <Route
          path="/adminelectrical"
          element={
            <AdminNotificationProvider>
              <AdminElectrical token={token} />
            </AdminNotificationProvider>
          }
        />
        <Route
          path="/admincarpentry"
          element={
            <AdminNotificationProvider>
              <AdminCarpentry token={token} />
            </AdminNotificationProvider>
          }
        />
        <Route
          path="/adminairconditioning"
          element={
            <AdminNotificationProvider>
              <AdminAirconditioning token={token} />
            </AdminNotificationProvider>
          }
        />
        <Route
          path="/admincarpentryform/:id"
          element={
            <AdminNotificationProvider>
              <AdminCarpentryform token={token} />
            </AdminNotificationProvider>
          }
        />
        <Route
          path="/adminuserrequests"
          element={
            <AdminNotificationProvider>
              <AdminUserRequests token={token} />
            </AdminNotificationProvider>
          }
        />
        <Route
          path="/adminuserrequestsform/:user_id"
          element={
            <AdminNotificationProvider>
              <AdminUserRequestsForm />
            </AdminNotificationProvider>
          }
        />

        {/* Staff Routes - wrapped with StaffNotificationProvider */}
        <Route
          path="/staffdashboard"
          element={
            <StaffNotificationProvider>
              <StaffDashboard />
            </StaffNotificationProvider>
          }
        />
        <Route
          path="/staffrequeststatus"
          element={
            <StaffNotificationProvider>
              <StaffRequestStatus />
            </StaffNotificationProvider>
          }
        />

         <Route
          path="/stafffeedback/:id"
          element={
            <StaffNotificationProvider>
              <StaffFeedback />
            </StaffNotificationProvider>
          }
        />

        <Route
          path="/staffsliprequests"
          element={
            <StaffNotificationProvider>
              <StaffSlipRequests token={token} />
            </StaffNotificationProvider>
          }
        />
        <Route
          path="/userrequests"
          element={
            <StaffNotificationProvider>
              <UserRequests />
            </StaffNotificationProvider>
          }
        />
        <Route
          path="/staffmaintenancerequestform/:id"
          element={
            <StaffNotificationProvider>
              <StaffMaintenanceRequestForm token={token} />
            </StaffNotificationProvider>
          }
        />
        <Route
          path="/staffmaintenance"
          element={
            <StaffNotificationProvider>
              <StaffMaintenance token={token} />
            </StaffNotificationProvider>
          }
        />
        <Route
          path="/staffjanitorial"
          element={
            <StaffNotificationProvider>
              <StaffJanitorial token={token} />
            </StaffNotificationProvider>
          }
        />
        <Route
          path="/staffelectrical"
          element={
            <StaffNotificationProvider>
              <StaffElectrical token={token} />
            </StaffNotificationProvider>
          }
        />
        <Route
          path="/staffcarpentry"
          element={
            <StaffNotificationProvider>
              <StaffCarpentry token={token} />
            </StaffNotificationProvider>
          }
        />
        <Route
          path="/staffairconditioning"
          element={
            <StaffNotificationProvider>
              <StaffAirconditioning token={token} />
            </StaffNotificationProvider>
          }
        />
        <Route
          path="/report"
          element={
            <StaffNotificationProvider>
              <Report token={token} />
            </StaffNotificationProvider>
          }
        />
        <Route
          path="/staffviewmaintenancerequestform/:id"
          element={
            <StaffNotificationProvider>
              <StaffViewMaintenanceRequestForm token={token} />
            </StaffNotificationProvider>
          }
        />

<Route
          path="/feedbackreview/:id"
          element={
            <StaffNotificationProvider>
              <FeedbackReview token={token} />
            </StaffNotificationProvider>
          }
        />

        <Route
          path="/viewuserrequestform/:user_id"
          element={
            <StaffNotificationProvider>
              <ViewUserRequestForm />
            </StaffNotificationProvider>
          }
        />

        <Route
          path="/staffnotifications"
          element={
            <StaffNotificationProvider>
              <StaffNotifications token={token} />
            </StaffNotificationProvider>
          }
        />

        {/* Head Routes - wrapped with HeadNotificationProvider */}
        <Route
          path="/headdashboard"
          element={
            <HeadNotificationProvider>
              <HeadDashboard token={token} />
            </HeadNotificationProvider>
          }
        />
        <Route
          path="/headmaintenance"
          element={
            <HeadNotificationProvider>
              <HeadMaintenance token={token} />
            </HeadNotificationProvider>
          }
        />
        <Route
          path="/headjanitorial"
          element={
            <HeadNotificationProvider>
              <HeadJanitorial token={token} />
            </HeadNotificationProvider>
          }
        />
        <Route
          path="/headcarpentry"
          element={
            <HeadNotificationProvider>
              <HeadCarpentry token={token} />
            </HeadNotificationProvider>
          }
        />
        <Route
          path="/headelectrical"
          element={
            <HeadNotificationProvider>
              <HeadElectrical token={token} />
            </HeadNotificationProvider>
          }

        />
        <Route
          path="/headelectrical"
          element={
            <HeadNotificationProvider>
              <HeadElectrical token={token} />
            </HeadNotificationProvider>
          }

        />
        <Route
          path="/headnotifications"
          element={
            <HeadNotificationProvider>
              <HeadNotifications token={token} />
            </HeadNotificationProvider>
          }
        />

        <Route
          path="/headrequests"
          element={
            <HeadNotificationProvider>
              <HeadRequests token={token} />
            </HeadNotificationProvider>
          }
        />
        <Route path="/headmaintenancerequestform/:id" element={<HeadNotificationProvider><HeadMaintenanceRequestForm token={token} /></HeadNotificationProvider>
        }
        />

        {/* Campus Director Routes - wrapped with CampusDirectorNotificationProvider */}
        <Route
          path="/campusdirectordashboard"
          element={
            <CampusDirectorNotificationProvider>
              <CampusDirectorDashboard token={token} />
            </CampusDirectorNotificationProvider>
          }
        />
        <Route
          path="/campusdirectorrequests"
          element={
            <CampusDirectorNotificationProvider>
              <CampusDirectorRequests token={token} />
            </CampusDirectorNotificationProvider>
          }
        />
        <Route
          path="/campusdirectormaintenancerequestform/:id"
          element={
            <CampusDirectorNotificationProvider>
              <CampusDirectorMaintenanceRequestForm token={token} />
            </CampusDirectorNotificationProvider>
          }
        />
        <Route
          path="/campusdirectornotifications"
          element={
            <CampusDirectorNotificationProvider>
              <CampusDirectorNotifications token={token} />
            </CampusDirectorNotificationProvider>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;