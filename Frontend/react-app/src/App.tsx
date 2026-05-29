import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";
import UserDashboardPage from "./pages/Dashboard";
import ProfileEditPage from "./pages/Profile";
import PurchaseOrderPage from "./pages/PurchaseOrder";
import AdminDashboardPage from "./pages/admin/Dashboard";
import AdminSignupPage from "./pages/admin/Signup";
import CompanySignupPage from "./pages/company/Signup";
import CompanyProfilePage from "./pages/company/Profile";
import CompanyDashboardPage from "./pages/company/Dashboard";
import { AuthProvider } from "./contexts/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<UserDashboardPage />} />
        <Route path="/profile" element={<ProfileEditPage />} />
        <Route path="/purchase-order" element={<PurchaseOrderPage />} />
        <Route path="/admin/signup" element={<AdminSignupPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/company/signup" element={<CompanySignupPage />} />
        <Route path="/company/profile" element={<CompanyProfilePage />} />
        <Route path="/company/dashboard" element={<CompanyDashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
