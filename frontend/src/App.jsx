import { Routes, Route } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/public/Home";
import About from "./pages/public/About";
import Membership from "./pages/public/Membership";
import Trainers from "./pages/public/Trainers";
import Gallery from "./pages/public/Gallery";
import Contact from "./pages/public/Contact";
import Login from "./pages/auth/Login";

import Dashboard from "./pages/admin/Dashboard";
import Members from "./pages/admin/Members";
import AddMember from "./pages/admin/AddMember";
import MemberProfile from "./pages/admin/MemberProfile";
import EditMember from "./pages/admin/EditMember";
import Payments from "./pages/admin/Payments";
import DueOverdue from "./pages/admin/DueOverdue";
import Reports from "./pages/admin/Reports";
import Plans from "./pages/admin/Plans";
import Notifications from "./pages/admin/Notifications";
import AuditLogs from "./pages/admin/AuditLogs";
import SettingsPage from "./pages/admin/Settings";

export default function App() {
  return (
    <Routes>
      {/* Public BODY FLEX website */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/membership" element={<Membership />} />
        <Route path="/trainers" element={<Trainers />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/contact" element={<Contact />} />
      </Route>

      <Route path="/login" element={<Login />} />

      {/* Admin application */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="members" element={<Members />} />
        <Route path="members/new" element={<AddMember />} />
        <Route path="members/:id" element={<MemberProfile />} />
        <Route path="members/:id/edit" element={<EditMember />} />
        <Route path="payments" element={<Payments />} />
        <Route path="due" element={<DueOverdue />} />
        <Route path="reports" element={<Reports />} />
        <Route path="plans" element={<Plans />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Home />} />
    </Routes>
  );
}
