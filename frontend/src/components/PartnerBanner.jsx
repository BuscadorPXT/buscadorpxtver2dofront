import { useState, useEffect } from 'react';
import { api } from '../contexts/AuthContext';
import { ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';

const PartnerBanner = () => {
  const [partners, setPartners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const response = await api.get('/partners/active');
      setPartners(response.data);
    } catch (error) {
      console.error('Erro ao buscar parceiros:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (partners.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % partners.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [partners.length]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + partners.length) % partners.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % partners.length);
  };

  const handleBannerClick = (redirectUrl) => {
    window.open(redirectUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading || partners.length === 0) {
    return null;
  }

  const currentPartner = partners[currentIndex];

  return (
    <div className="w-full mb-6">
      <Card className="overflow-hidden">
        <div className="relative group">
          {/* Mobile: altura fixa com object-contain para não cortar */}
          <div
            onClick={() => handleBannerClick(currentPartner.redirectUrl)}
            className="sm:hidden cursor-pointer relative w-full overflow-hidden bg-white h-[100px]"
          >
            <img
              src={currentPartner.imageUrl}
              alt={currentPartner.name}
              className="w-full h-full object-contain object-center transition-transform duration-300 group-hover:scale-[1.02]"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
              <div className="flex items-center gap-2 text-white">
                <ExternalLink className="h-5 w-5" />
                <span className="font-medium">Visitar {currentPartner.name}</span>
              </div>
            </div>
          </div>

          {/* Desktop: proporção dinâmica com object-cover */}
          <div
            onClick={() => handleBannerClick(currentPartner.redirectUrl)}
            className="hidden sm:block cursor-pointer relative w-full overflow-hidden bg-white"
            style={{ 
              aspectRatio: '8.27 / 1',
              minHeight: '80px',
              maxHeight: '200px'
            }}
          >
            <img
              src={currentPartner.imageUrl}
              alt={currentPartner.name}
              className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
              <div className="flex items-center gap-2 text-white">
                <ExternalLink className="h-5 w-5" />
                <span className="font-medium">Visitar {currentPartner.name}</span>
              </div>
            </div>
          </div>

          {partners.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                aria-label="Banner anterior"
              >
                <ChevronLeft className="h-5 w-5 text-gray-800" />
              </button>

              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                aria-label="Próximo banner"
              >
                <ChevronRight className="h-5 w-5 text-gray-800" />
              </button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {partners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? 'bg-white w-6'
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`Ir para banner ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PartnerBanner;
