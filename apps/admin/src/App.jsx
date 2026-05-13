import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import AdminLayout from "./layouts/AdminLayout.jsx";
import AdminGuard from "./components/AdminGuard.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <SignedOut>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </SignedOut>

      <SignedIn>
        <AdminGuard>
          <Routes>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </AdminGuard>
      </SignedIn>
    </BrowserRouter>
  );
}
