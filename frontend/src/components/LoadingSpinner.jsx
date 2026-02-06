import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = "default", text = "Carregando..." }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-8 w-8",
    lg: "h-12 w-12"
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary mb-4`} />
      <p className="text-neutral-500 text-sm">{text}</p>
    </div>
  );
};

export default LoadingSpinner;
