import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import { useAuth } from "./contexts/AuthContext";
import LoadingSpinner from "./components/LoadingSpinner";
import { useTheme } from "./contexts/ThemeContext";

const Login = lazy(() => import("./pages/Login"));
const Feed = lazy(() => import("./pages/Feed"));
const Profile = lazy(() => import("./pages/Profile"));
const Friends = lazy(() => import("./pages/Friends"));
const Discover = lazy(() => import("./pages/Discover"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Settings = lazy(() => import("./pages/Settings"));
const PostDetail = lazy(() => import("./pages/PostDetail"));

function ProtectedRoute() {
  const { t } = useTheme();
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <main className="auth-page"><LoadingSpinner label={t("กำลังตรวจสอบการเข้าสู่ระบบ...", "Checking your session...")} /></main>;
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

function PublicOnlyRoute() {
  const { user, loading } = useAuth();
  if (loading) return <main className="auth-page"><LoadingSpinner /></main>;
  return user ? <Navigate to="/feed" replace /> : <Outlet />;
}

export default function App() {
  const { t } = useTheme();
  return (
    <Suspense fallback={<main className="auth-page"><LoadingSpinner label={t("กำลังเปิดหน้า...", "Opening page...")} /></main>}><Routes>
      <Route element={<PublicOnlyRoute />}><Route path="/login" element={<Login />} /><Route path="/register" element={<Navigate to="/login" replace />} /></Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/feed" element={<Feed />} />
          <Route path="/post/:postId" element={<PostDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/feed" replace />} />
    </Routes></Suspense>
  );
}
