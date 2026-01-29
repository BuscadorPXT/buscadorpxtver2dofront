import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

const WhatsAppButton = ({ 
  whatsappNumber, 
  productName, 
  supplierName, 
  className = "",
  size = "default",
  variant = "default",
  children 
}) => {
  const handleWhatsAppClick = () => {

    const cleanNumber = whatsappNumber.replace(/\D/g, '');

    const message = encodeURIComponent(
      `Olá! Tenho interesse no produto "${productName}" da ${supplierName}. ` +
      `Poderia me fornecer mais informações sobre preço, disponibilidade e condições de compra?`
    );

    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${message}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button
      onClick={handleWhatsAppClick}
      className={`bg-green-600 hover:bg-green-700 text-white ${className}`}
      size={size}
      variant={variant}
    >
      <MessageCircle className="h-4 w-4 mr-2" />
      {children || 'WhatsApp'}
    </Button>
  );
};

export default WhatsAppButton;
