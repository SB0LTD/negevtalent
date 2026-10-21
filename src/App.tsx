import { Routes, Route } from "react-router-dom";
import { RootLayout } from "@/layouts/RootLayout";
import { HomePage } from "@/pages/HomePage";
import { ThankYouPage } from "@/pages/ThankYouPage";
import { AuthProvider } from "@/admin/AuthContext";
import { RequireAuth } from "@/admin/RequireAuth";
import { RequireRole } from "@/admin/RequireRole";
import { AdminLayout } from "@/admin/AdminLayout";
import { LoginPage } from "@/admin/LoginPage";
import { DashboardPage } from "@/admin/DashboardPage";
import { ApplicationsPage } from "@/admin/ApplicationsPage";
import { ApplicationDetailPage } from "@/admin/ApplicationDetailPage";
import { AdminsPage } from "@/admin/AdminsPage";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="thank-you" element={<ThankYouPage />} />
        </Route>

        <Route path="admin/login" element={<LoginPage />} />
        <Route path="admin" element={<RequireAuth />}>
          <Route element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="applications" element={<ApplicationsPage />} />
            <Route path="applications/:id" element={<ApplicationDetailPage />} />
            <Route
              path="admins"
              element={
                <RequireRole allow={["superadmin"]} redirect="/admin">
                  <AdminsPage />
                </RequireRole>
              }
            />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
