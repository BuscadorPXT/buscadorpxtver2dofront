import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import PlanExpiredModal from './components/PlanExpiredModal';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminPanel from './pages/AdminPanel';
import Suppliers from './pages/Suppliers';
import Subscriptions from './pages/Subscriptions';
import PlansManagement from './pages/PlansManagement';
import PaymentHistory from './pages/PaymentHistory';
import AccessDenied from './pages/AccessDenied';
import AdminNotifications from './pages/AdminNotifications';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import MyDevices from './pages/MyDevices';
import AdminUserSessions from './pages/AdminUserSessions';
import { Toaster } from 'sonner';
import { useHoursCheck } from './hooks/useHoursCheck';
import { usePageTracking } from './hooks/usePageTracking';
import './App.css';

function RouterContent() {

  usePageTracking();
  const { showExpiredModal, setShowExpiredModal } = useHoursCheck();

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          } />
          <Route path="/products/:id" element={
            <ProtectedRoute>
              <ProductDetail />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/suppliers" element={
            <ProtectedRoute>
              <Suppliers />
            </ProtectedRoute>
          } />
          <Route path="/admin/subscriptions" element={
            <ProtectedRoute>
              <Subscriptions />
            </ProtectedRoute>
          } />
          <Route path="/admin/plans" element={
            <ProtectedRoute>
              <PlansManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/notifications" element={
            <ProtectedRoute>
              <AdminNotifications />
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          } />
          <Route path="/payment-history" element={
            <ProtectedRoute>
              <PaymentHistory />
            </ProtectedRoute>
          } />
          <Route path="/access-denied" element={
            <ProtectedRoute>
              <AccessDenied />
            </ProtectedRoute>
          } />
          <Route path="/my-devices" element={
            <ProtectedRoute>
              <MyDevices />
            </ProtectedRoute>
          } />
          <Route path="/admin/users/:userId/sessions" element={
            <ProtectedRoute>
              <AdminUserSessions />
            </ProtectedRoute>
          } />
        </Routes>
        <PlanExpiredModal 
          open={showExpiredModal} 
          onOpenChange={setShowExpiredModal} 
        />
        <Toaster position="top-right" />
      </div>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <RouterContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
