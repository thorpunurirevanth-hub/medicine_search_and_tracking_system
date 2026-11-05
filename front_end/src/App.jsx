import { Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import { useAuth } from "./auth/AuthProvider.jsx";
import { dashboardPathFor } from "./auth/roleRoutes.js";
import ProtectedRoute, { GuestRoute } from "./components/ProtectedRoute.jsx";
import CustomerLayout from "./components/CustomerLayout.jsx";
import PharmacyLayout from "./components/PharmacyLayout.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminProfilePage from "./pages/AdminProfilePage.jsx";
import CartPage from "./pages/CartPage.jsx";
import MedicalAssistantPage from "./pages/MedicalAssistantPage.jsx";
import CustomerRegistrationPage from "./pages/CustomerRegistrationPage.jsx";
import CustomerDashboardPage from "./pages/CustomerDashboardPage.jsx";
import PrescriptionUploadPage from "./pages/PrescriptionUploadPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import MedicineSearchPage from "./pages/MedicineSearchPage.jsx";
import MyOrdersPage from "./pages/MyOrdersPage.jsx";
import PharmacyDiscoveryPage from "./pages/PharmacyDiscoveryPage.jsx";
import PharmacyOverviewPage from "./pages/PharmacyOverviewPage.jsx";
import PharmacyInventoryPage from "./pages/PharmacyInventoryPage.jsx";
import PharmacyAddMedicinePage from "./pages/PharmacyAddMedicinePage.jsx";
import PharmacyOrdersPage from "./pages/PharmacyOrdersPage.jsx";
import PharmacyPrescriptionsPage from "./pages/PharmacyPrescriptionsPage.jsx";
import PharmacyProfilePage from "./pages/PharmacyProfilePage.jsx";
import AdminManagementPage from "./pages/AdminManagementPage.jsx";
import PharmacyRegistrationPage from "./pages/PharmacyRegistrationPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import HomePage from "./pages/HomePage.jsx";

function App() {
  const { session, signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const dashboardPath = dashboardPathFor(session?.user?.role);

  function updateSession(nextSession) {
    if (nextSession) {
      signIn(nextSession);
      navigate(dashboardPathFor(nextSession.user.role), { replace: true });
      return;
    }
    signOut();
    navigate("/login", { replace: true });
  }

  const homePage = (
    <HomePage
      onRequestAuth={() => navigate("/login")}
      onSessionChange={updateSession}
      session={session}
    />
  );

  return (
    <Routes>
      <Route path="/" element={session ? <Navigate replace to={dashboardPath} /> : homePage} />
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Navigate replace to="/register/customer" /></GuestRoute>} />
      <Route path="/register/customer" element={<GuestRoute><CustomerRegistrationPage /></GuestRoute>} />
      <Route path="/register/pharmacy" element={<GuestRoute><PharmacyRegistrationPage /></GuestRoute>} />
      <Route path="/customer" element={
        <ProtectedRoute role="user">
          <CustomerLayout onSessionChange={updateSession} session={session}><Outlet /></CustomerLayout>
        </ProtectedRoute>
      }>
        <Route index element={<Navigate replace to="dashboard" />} />
        <Route path="dashboard" element={<CustomerDashboardPage />} />
        <Route path="medicines" element={<MedicineSearchPage />} />
        <Route path="pharmacies" element={<PharmacyDiscoveryPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="orders" element={<MyOrdersPage />} />
        <Route path="prescriptions" element={<PrescriptionUploadPage />} />
        <Route path="assistant" element={<MedicalAssistantPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="/pharmacy" element={
        <ProtectedRoute role="pharmacy">
          <PharmacyLayout onSessionChange={updateSession} session={session}><Outlet /></PharmacyLayout>
        </ProtectedRoute>
      }>
        <Route index element={<Navigate replace to="dashboard" />} />
        <Route path="dashboard" element={<PharmacyOverviewPage session={session} />} />
        <Route path="inventory" element={<PharmacyInventoryPage session={session} />} />
        <Route path="add-medicine" element={<PharmacyAddMedicinePage session={session} />} />
        <Route path="medicines/new" element={<PharmacyAddMedicinePage session={session} />} />
        <Route path="medicines/:medicineId/edit" element={<PharmacyAddMedicinePage session={session} />} />
        <Route path="orders" element={<PharmacyOrdersPage session={session} />} />
        <Route path="prescriptions" element={<PharmacyPrescriptionsPage session={session} />} />
        <Route path="profile" element={<PharmacyProfilePage session={session} />} />
      </Route>
      <Route path="/admin" element={
        <ProtectedRoute role="admin">
          <AdminLayout onSessionChange={updateSession} session={session}><Outlet /></AdminLayout>
        </ProtectedRoute>
      }>
        <Route index element={<Navigate replace to="dashboard" />} />
        <Route path="dashboard" element={<AdminDashboard session={session} />} />
        <Route path="profile" element={<AdminProfilePage session={session} />} />
        <Route path="customers" element={<AdminManagementPage resource="customers" session={session} />} />
        <Route path="pharmacies" element={<AdminManagementPage resource="pharmacies" session={session} />} />
        <Route path="medicines" element={<AdminManagementPage resource="medicines" session={session} />} />
        <Route path="orders" element={<AdminManagementPage resource="orders" session={session} />} />
        <Route path="feedback" element={<AdminManagementPage resource="feedback" session={session} />} />
      </Route>
      <Route path="*" element={<Navigate replace to={session ? dashboardPath : "/"} />} />
    </Routes>
  );
}

export default App;
