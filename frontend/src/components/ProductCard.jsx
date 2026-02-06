import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import WhatsAppButton from './WhatsAppButton';
import { Eye, Star, TrendingUp } from 'lucide-react';

const ProductCard = ({ product }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getProductCategory = (supplierName) => {
    if (supplierName.includes('Tech')) return { name: 'Tecnologia', color: 'bg-blue-100 text-blue-800' };
    if (supplierName.includes('Casa')) return { name: 'Casa & Decoração', color: 'bg-green-100 text-green-800' };
    if (supplierName.includes('Moda')) return { name: 'Moda & Estilo', color: 'bg-purple-100 text-purple-800' };
    return { name: 'Geral', color: 'bg-neutral-100 text-neutral-800' };
  };

  const category = getProductCategory(product.supplier.name);

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-neutral-800 dark:border-neutral-700">
      <div className="aspect-video relative overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="absolute top-4 right-4">
          <Badge className="bg-white/95 text-neutral-900 font-semibold px-3 py-1 shadow-lg">
            {formatPrice(product.price)}
          </Badge>
        </div>

        <div className="absolute top-4 left-4">
          <Badge className={`${category.color} font-medium`}>
            {category.name}
          </Badge>
        </div>

        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex gap-2">
            <Button asChild className="flex-1 bg-white/90 text-neutral-900 hover:bg-white">
              <Link to={`/products/${product.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalhes
              </Link>
            </Button>
            <WhatsAppButton
              whatsappNumber={product.supplier.whatsappNumber}
              productName={product.name}
              supplierName={product.supplier.name}
              className="bg-green-600/90 hover:bg-green-600"
            />
          </div>
        </div>
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-bold line-clamp-2 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors dark:text-white">
            {product.name}
          </CardTitle>
          <div className="flex items-center ml-2">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm text-neutral-600 dark:text-neutral-400 ml-1">4.5</span>
          </div>
        </div>
        <CardDescription className="line-clamp-3 text-neutral-600 dark:text-neutral-400">
          {product.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-neutral-500 uppercase tracking-wide">Fornecedor</p>
              <button
                onClick={() => {
                  const cleanNumber = product.supplier.whatsappNumber.replace(/\D/g, '');
                  const message = encodeURIComponent(
                    `Olá! Gostaria de conhecer mais produtos da ${product.supplier.name}.`
                  );
                  window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
                }}
                className="text-sm font-semibold text-green-600 hover:text-green-700 hover:underline transition-colors"
              >
                {product.supplier.name}
              </button>
            </div>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500">Preço</p>
              <p className="text-xl font-bold text-neutral-900">{formatPrice(product.price)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-500">Avaliação</p>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < 4 ? 'text-yellow-400 fill-current' : 'text-neutral-300'
                    }`}
                  />
                ))}
                <span className="text-xs text-neutral-600 ml-1">(4.5)</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 md:opacity-100 opacity-100">
            <Button asChild variant="outline" className="flex-1">
              <Link to={`/products/${product.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                Detalhes
              </Link>
            </Button>
            <WhatsAppButton
              whatsappNumber={product.supplier.whatsappNumber}
              productName={product.name}
              supplierName={product.supplier.name}
              size="sm"
            >
              Contato
            </WhatsAppButton>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
