import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { connectSocket, disconnectSocket } from "./socket";
import Landing from "./pages/Auth/Landing";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import DashboardRouter from "./pages/Dashboard/DashboardRouter";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminUsers from "./pages/Admin/AdminUsers";
import AdminVerifications from "./pages/Admin/AdminVerifications";
import AdminReports from "./pages/Admin/AdminReports";
import AdminTrips from "./pages/Admin/AdminTrips";
import AdminAnnouncements from "./pages/Admin/AdminAnnouncements";
import AdminSettings from "./pages/Admin/AdminSettings";
import AdminDestinations from "./pages/Admin/AdminDestinations";
import AdminDestinationDetail from "./pages/Admin/AdminDestinationDetail";
import RequireRole from "./pages/Auth/RequireRole";
import Blogs from "./pages/Blogs";
import User from "./pages/Dashboard/User";
import Verification from "./pages/Dashboard/Verification";
import EditProfile from "./pages/Dashboard/EditProfile";
import Matches from "./pages/Dashboard/Matches";
import Messages from "./pages/Dashboard/Messages";
import Trips from "./pages/Dashboard/Trips";
import CreateTrip from "./pages/Dashboard/CreateTrip";
import Safety from "./pages/Dashboard/Safety";
import ReportIssue from "./pages/Dashboard/ReportIssue";
import Notifications from "./pages/Dashboard/Notifications";
import Settings from "./pages/Dashboard/Settings";
import SearchPage from "./pages/Search/SearchPage";
import ChatPage from "./pages/Chat/ChatPage";
import FeedPage from "./pages/Feed/FeedPage";
import AIChat from "./pages/AI/AIChat";
import RequestsPage from "./pages/Requests/RequestsPage";
import ExploreDestinations from "./pages/ExploreDestinations";
import { getUser } from "./services/auth";

export default function App() {
  useEffect(() => {
    const user = getUser();
    if (user?.id) {
      connectSocket(user.id);
    }

    return () => {
      disconnectSocket();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/home" element={<Landing />} />
        <Route path="/blogs" element={<Blogs />} />

        {/* New Feature Routes */}
        <Route path="/search" element={<SearchPage />} />
        <Route path="/chat" element={<Navigate to="/dashboard/messages" replace />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/ai-assistant" element={<AIChat />} />
        <Route path="/requests" element={<RequestsPage />} />
        <Route path="/explore-destinations" element={<ExploreDestinations />} />

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardRouter />} />
        
        {/* Admin Routes */}
        <Route path="/dashboard/admin" element={<RequireRole role="admin"><AdminDashboard /></RequireRole>} />
        <Route path="/dashboard/admin/users" element={<RequireRole role="admin"><AdminUsers /></RequireRole>} />
        <Route path="/dashboard/admin/trips" element={<RequireRole role="admin"><AdminTrips /></RequireRole>} />
        <Route path="/dashboard/admin/verifications" element={<RequireRole role="admin"><AdminVerifications /></RequireRole>} />
        <Route path="/dashboard/admin/reports" element={<RequireRole role="admin"><AdminReports /></RequireRole>} />
        <Route path="/dashboard/admin/announcements" element={<RequireRole role="admin"><AdminAnnouncements /></RequireRole>} />
        <Route path="/dashboard/admin/settings" element={<RequireRole role="admin"><AdminSettings /></RequireRole>} />
        <Route path="/dashboard/admin/destinations" element={<RequireRole role="admin"><AdminDestinations /></RequireRole>} />
        <Route path="/dashboard/admin/destinations/:name" element={<RequireRole role="admin"><AdminDestinationDetail /></RequireRole>} />

        <Route path="/dashboard/user" element={<RequireRole role="user"><User /></RequireRole>} />
        <Route path="/dashboard/verification" element={<RequireRole role="user"><Verification /></RequireRole>} />
        <Route path="/dashboard/edit-profile" element={<RequireRole role="user"><EditProfile /></RequireRole>} />
        <Route path="/dashboard/matches" element={<RequireRole role="user"><Matches /></RequireRole>} />
        <Route path="/dashboard/messages" element={<RequireRole role="user"><Messages /></RequireRole>} />
        <Route path="/dashboard/notifications" element={<RequireRole role="user"><Notifications /></RequireRole>} />
        <Route path="/dashboard/trips" element={<RequireRole role="user"><Trips /></RequireRole>} />
        <Route path="/dashboard/trips/create" element={<RequireRole role="user"><CreateTrip /></RequireRole>} />
        <Route path="/dashboard/safety" element={<RequireRole role="user"><Safety /></RequireRole>} />
        <Route path="/dashboard/report" element={<RequireRole role="user"><ReportIssue /></RequireRole>} />
        <Route path="/dashboard/settings" element={<RequireRole role="user"><Settings /></RequireRole>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
