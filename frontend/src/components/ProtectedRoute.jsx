import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import api from '@/lib/axios';

const accessCache = {
  data: null,
  timestamp: 0,
  userId: null,
  CACHE_DURATION: 30000,
  
  isValid(userId) {
    return (
      this.data !== null &&
      this.userId === userId &&
      Date.now() - this.timestamp < this.CACHE_DURATION
    );
  },
  
  set(userId, data) {
    this.data = data;
    this.userId = userId;
    this.timestamp = Date.now();
  },
  
  clear() {
    this.data = null;
    this.timestamp = 0;
    this.userId = null;
  }
};

export const clearAccessCache = () => {
  console.log('🧹 Clearing access cache');
  accessCache.clear();
};

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  const exemptRoutes = ['/access-denied', '/payment-history', '/admin/settings', '/admin/notifications', '/admin/subscriptions', '/admin/plans', '/admin/analytics'];
  const isExemptRoute = exemptRoutes.includes(location.pathname);
  
  const [hasAccess, setHasAccess] = useState(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const checkAccessWithRetry = useCallback(async (userId, retryCount = 0) => {
    try {
      console.log(`📡 Fetching subscription status... (attempt ${retryCount + 1}/${maxRetries})`);
      const response = await api.get('/subscriptions/me/hours', {
        timeout: 10000,
      });
      const { durationType, remaining, daysRemaining } = response.data;

      let userHasAccess = false;
      if (durationType === 'days') {
        userHasAccess = (daysRemaining !== undefined && daysRemaining > 0);
      } else {
        userHasAccess = (remaining !== undefined && remaining > 0);
      }

      console.log('🔐 Access check result:', { durationType, remaining, daysRemaining, userHasAccess });

      accessCache.set(userId, { hasAccess: userHasAccess, durationType, remaining, daysRemaining });

      return userHasAccess;
    } catch (error) {
      console.error(`❌ Error checking access (attempt ${retryCount + 1}):`, error.response?.status, error.message);

      const isNetworkError = !error.response || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK';
      
      if (isNetworkError && retryCount < maxRetries - 1) {

        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return checkAccessWithRetry(userId, retryCount + 1);
      }

      if (error.response?.status === 401 || error.response?.status === 403) {
        return false;
      }

      if (accessCache.data !== null && accessCache.userId === userId) {
        console.log('📦 Using stale cache due to network error');
        return accessCache.data.hasAccess;
      }

      console.warn('⚠️ Network error without cache - granting temporary access');
      return true;
    }
  }, []);

  useEffect(() => {
    const checkUserAccess = async () => {
      console.log('🔍 Checking access for:', { 
        isAuthenticated, 
        hasUser: !!user, 
        email: user?.email,
        isAdmin: user?.isAdmin,
        pathname: location.pathname 
      });

      if (user?.isAdmin) {
        console.log('✅ Admin user - full access granted');
        setHasAccess(true);
        setCheckingAccess(false);
        return;
      }

      if (isExemptRoute) {
        console.log('✅ Exempt route - access granted');
        setHasAccess(true);
        setCheckingAccess(false);
        return;
      }

      if (accessCache.isValid(user?.id)) {
        console.log('📦 Using cached access:', accessCache.data.hasAccess);
        setHasAccess(accessCache.data.hasAccess);
        setCheckingAccess(false);
        return;
      }

      const userHasAccess = await checkAccessWithRetry(user?.id);
      setHasAccess(userHasAccess);
      setCheckingAccess(false);
    };

    if (isAuthenticated && user) {
      checkUserAccess();
    } else if (!isAuthenticated && !loading) {
      console.log('⚠️ Not authenticated, will redirect to login');
      setCheckingAccess(false);
    }
  }, [isAuthenticated, user, loading, location.pathname, isExemptRoute, checkAccessWithRetry]);

  if (!loading && !isAuthenticated) {

    console.log('🔄 Redirecting to login - not authenticated');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (loading || (checkingAccess && !isExemptRoute)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-300">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (hasAccess === false && !user?.isAdmin && !isExemptRoute) {
    return <Navigate to="/access-denied" replace />;
  }

  if (hasAccess === true || isExemptRoute || user?.isAdmin) {
    return children;
  }

  return null;
};

export default ProtectedRoute;
