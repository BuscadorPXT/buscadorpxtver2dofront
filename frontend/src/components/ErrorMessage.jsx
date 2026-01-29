import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ErrorMessage = ({ 
  title = "Ops! Algo deu errado", 
  message = "Não foi possível carregar os dados. Tente novamente.", 
  onRetry,
  showRetry = true 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 max-w-md mx-auto">
      <div className="text-center space-y-4">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600">{message}</p>
        </div>
        
        {showRetry && onRetry && (
          <Button onClick={onRetry} variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
