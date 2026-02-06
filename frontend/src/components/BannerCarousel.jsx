import { memo, useState, useEffect } from 'react';
import { UserPlus, Zap, CalendarClock } from 'lucide-react';

const TOTAL_BANNERS = 3;

const BannerCarousel = memo(function BannerCarousel() {
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % TOTAL_BANNERS);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full lg:flex-1 flex flex-col gap-2 min-h-[180px] lg:h-full">
      {/* Banner */}
      <div className="w-full flex-1 min-h-[140px] lg:min-h-[180px] rounded-2xl overflow-hidden relative">
        {/* Banner 1 - Indicação */}
        <div
          className={`absolute inset-0 transition-all duration-700 ${currentBanner === 0 ? 'opacity-100 translate-x-0' : currentBanner > 0 ? 'opacity-0 -translate-x-full' : 'opacity-0 translate-x-full'}`}
          style={{
            background: 'linear-gradient(135deg, #059669 0%, #047857 40%, #065f46 100%)',
          }}
        >
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
          <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-emerald-400/20 rounded-full" />

          {/* Content */}
          <div className="relative z-10 p-3 lg:p-5 h-full flex flex-col justify-between">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 bg-white/20 rounded-xl backdrop-blur-sm">
                <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="bg-white/20 text-white text-[10px] lg:text-xs font-bold px-2 lg:px-3 py-0.5 lg:py-1 rounded-full uppercase tracking-wider">
                Novidade
              </span>
            </div>
            <div className="my-1 lg:my-2">
              <h2 className="text-white text-base lg:text-xl font-bold mb-0.5 lg:mb-1">Programa de Indicação</h2>
              <p className="text-white/90 text-xs lg:text-sm leading-relaxed">
                Indique amigos e ganhe{' '}
                <span className="text-yellow-300 font-bold text-sm lg:text-lg">R$100</span>{' '}
                por cada nova assinatura!
              </p>
            </div>
            <div className="flex items-center gap-4 pb-2 lg:pb-4">
              <button className="flex items-center gap-1.5 lg:gap-2 bg-white text-emerald-700 px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl font-bold text-xs lg:text-sm hover:bg-emerald-50 transition-all active:scale-95 lg:hover:scale-105 shadow-lg">
                <UserPlus className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                Indicar
              </button>
            </div>
          </div>
        </div>

        {/* Banner 2 - Planos */}
        <div
          className={`absolute inset-0 transition-all duration-700 ${currentBanner === 1 ? 'opacity-100 translate-x-0' : currentBanner > 1 ? 'opacity-0 -translate-x-full' : 'opacity-0 translate-x-full'}`}
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 40%, #5b21b6 100%)',
          }}
        >
          <div className="absolute top-0 right-0 w-32 lg:w-48 h-32 lg:h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-1/3 w-24 lg:w-32 h-24 lg:h-32 bg-white/5 rounded-full translate-y-1/2" />
          <div className="absolute top-1/2 right-1/4 w-16 lg:w-20 h-16 lg:h-20 bg-purple-400/20 rounded-full" />

          <div className="relative z-10 p-3 lg:p-5 h-full flex flex-col justify-between">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 bg-white/20 rounded-xl backdrop-blur-sm">
                <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <span className="bg-white/20 text-white text-[10px] lg:text-xs font-bold px-2 lg:px-3 py-0.5 lg:py-1 rounded-full uppercase tracking-wider">
                Promoção
              </span>
            </div>
            <div className="my-1 lg:my-2">
              <h2 className="text-white text-base lg:text-xl font-bold mb-0.5 lg:mb-1">Ganhe Meses Grátis!</h2>
              <div className="space-y-0">
                <p className="text-white/90 text-xs lg:text-sm">
                  Anual: <span className="text-yellow-300 font-bold">+3 meses</span>
                </p>
                <p className="text-white/90 text-xs lg:text-sm">
                  Semestral: <span className="text-yellow-300 font-bold">+2 meses</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 pb-2 lg:pb-4">
              <button className="flex items-center gap-1.5 lg:gap-2 bg-white text-purple-700 px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl font-bold text-xs lg:text-sm hover:bg-purple-50 transition-all active:scale-95 lg:hover:scale-105 shadow-lg">
                <Zap className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                Assinar
              </button>
            </div>
          </div>
        </div>

        {/* Banner 3 - Ciclo de 30 dias */}
        <div
          className={`absolute inset-0 transition-all duration-700 ${currentBanner === 2 ? 'opacity-100 translate-x-0' : currentBanner > 2 ? 'opacity-0 -translate-x-full' : 'opacity-0 translate-x-full'}`}
          style={{
            background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 40%, #0ea5e9 100%)',
          }}
        >
          <div className="absolute top-0 right-0 w-32 lg:w-48 h-32 lg:h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-1/3 w-24 lg:w-32 h-24 lg:h-32 bg-white/5 rounded-full translate-y-1/2" />
          <div className="absolute top-1/2 right-1/4 w-16 lg:w-20 h-16 lg:h-20 bg-sky-400/20 rounded-full" />

          <div className="relative z-10 p-3 lg:p-5 h-full flex flex-col justify-between">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 bg-white/20 rounded-xl backdrop-blur-sm">
                <CalendarClock className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
              </div>
              <span className="bg-white/20 text-white text-[10px] lg:text-xs font-bold px-2 lg:px-3 py-0.5 lg:py-1 rounded-full uppercase tracking-wider">
                Como funciona
              </span>
            </div>
            <div className="my-1 lg:my-2">
              <h2 className="text-white text-base lg:text-xl font-bold mb-0.5 lg:mb-1">Ciclo de 30 Dias</h2>
              <p className="text-white/90 text-xs lg:text-sm leading-relaxed">
                Ao ativar sua assinatura, seu ciclo de{' '}
                <span className="text-yellow-300 font-bold">30 dias</span>{' '}
                começa. O vencimento cai na mesma data e horário do mês seguinte.
              </p>
            </div>
            <div className="flex items-center gap-2 pb-2 lg:pb-4">
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-xl text-white/90 text-[10px] lg:text-xs">
                <span>Ex: 31/12 10h</span>
                <span className="text-yellow-300 font-bold">→</span>
                <span>30/01 10h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Banner indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {Array.from({ length: TOTAL_BANNERS }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentBanner(index)}
              className={`w-2 h-2 rounded-full transition-all ${currentBanner === index ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/70'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

export default BannerCarousel;
