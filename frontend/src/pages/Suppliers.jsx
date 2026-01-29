import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import SupplierPriorityManager from '@/components/SupplierPriorityManager';

const Suppliers = () => {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <Navigate to="/access-denied" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gestão de Fornecedores
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie prioridades e patrocínios de fornecedores
          </p>
        </div>

        <SupplierPriorityManager />
      </div>
    </div>
  );
};

export default Suppliers;
