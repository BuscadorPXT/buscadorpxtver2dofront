import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../contexts/AuthContext';
import WhatsAppButton from '../components/WhatsAppButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft, Store, Package, DollarSign, Info } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getProductCategory = (supplierName) => {
    if (supplierName.includes('Tech')) return { name: 'Tecnologia', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    if (supplierName.includes('Casa')) return { name: 'Casa & Decoração', color: 'bg-green-100 text-green-700 border-green-200' };
    if (supplierName.includes('Moda')) return { name: 'Moda & Estilo', color: 'bg-purple-100 text-purple-700 border-purple-200' };
    return { name: 'Geral', color: 'bg-gray-100 text-gray-700 border-gray-200' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando produto...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Produto não encontrado</h2>
          <p className="text-gray-600 mb-6">O produto que você procura não existe ou foi removido.</p>
          <Button asChild>
            <Link to="/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos produtos
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const category = getProductCategory(product.supplier.name);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-6">
          <Button variant="ghost" asChild className="text-gray-600 hover:text-gray-900">
            <Link to="/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos produtos
            </Link>
          </Button>
        </div>

        <div className="space-y-6">

          <Card className="shadow-sm border-gray-200">
            <CardHeader className="border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-5 w-5 text-gray-500" />
                    <Badge className={`${category.color} border`}>
                      {category.name}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                    {product.name}
                  </CardTitle>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Preço</span>
                  </div>
                  <div className="text-3xl font-bold text-green-600">
                    {formatPrice(product.price)}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Descrição do Produto</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-200">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <Store className="h-5 w-5 mr-2" />
                Informações do Fornecedor
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">
                    {product.supplier.name}
                  </h3>
                  {product.supplier.description && (
                    <p className="text-gray-600 mb-3">
                      {product.supplier.description}
                    </p>
                  )}
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Contato WhatsApp</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Entre em contato diretamente com o fornecedor para mais informações, negociação de preços e condições de compra.
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    <span className="font-medium">Número:</span> {product.supplier.whatsappNumber}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <WhatsAppButton
                      whatsappNumber={product.supplier.whatsappNumber}
                      productName={product.name}
                      supplierName={product.supplier.name}
                      className="flex-1 sm:flex-none"
                    >
                      Interesse neste produto
                    </WhatsAppButton>
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        const cleanNumber = product.supplier.whatsappNumber.replace(/\D/g, '');
                        const message = encodeURIComponent(
                          `Olá! Gostaria de conhecer mais produtos da ${product.supplier.name}.`
                        );
                        window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
                      }}
                      className="flex-1 sm:flex-none"
                    >
                      Ver catálogo do fornecedor
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-200">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Informações Adicionais
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID do Produto:</span>
                    <span className="font-medium">#{product.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Categoria:</span>
                    <span className="font-medium">{category.name}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fornecedor ID:</span>
                    <span className="font-medium">#{product.supplier.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      Disponível
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;