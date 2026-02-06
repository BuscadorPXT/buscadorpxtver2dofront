import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X } from 'lucide-react';
import { api } from '../contexts/AuthContext';

function formatDateDisplay(ddmm) {
  const [day, month] = ddmm.split('-').map(Number);
  const now = new Date();
  let year = now.getFullYear();
  if (month > now.getMonth() + 1) {
    year--;
  }
  const date = new Date(year, month - 1, day);
  return {
    weekday: date.toLocaleDateString('pt-BR', { weekday: 'long' }),
    dayMonth: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', ''),
    year,
  };
}

function isTodayDate(ddmm) {
  const today = new Date();
  const todayDDMM = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  return ddmm === todayDDMM;
}

function isYesterdayDate(ddmm) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDDMM = `${String(yesterday.getDate()).padStart(2, '0')}-${String(yesterday.getMonth() + 1).padStart(2, '0')}`;
  return ddmm === yesterdayDDMM;
}

const DatePickerDropdown = ({ selectedDate, onDateChange }) => {
  const [availableDates, setAvailableDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const dateButtonRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchDates = async () => {
      try {
        const response = await api.get('/sheets/dates');
        const { dates, latest } = response.data;
        setAvailableDates(dates);
        if (!selectedDate && latest) {
          onDateChange(latest);
        }
      } catch (error) {
        console.error('Erro ao buscar datas disponíveis:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDates();
  }, []);

  const handleButtonClick = () => {
    if (dateButtonRef.current) {
      const rect = dateButtonRef.current.getBoundingClientRect();
      if (window.innerWidth < 640) {
        setDropdownPosition({ top: rect.bottom + 8, left: 16 });
      } else {
        setDropdownPosition({ top: rect.bottom + 8, left: rect.left });
      }
    }
    setShowDatePicker((prev) => !prev);
  };

  const handleSelectDate = (date) => {
    onDateChange(date);
    setShowDatePicker(false);
  };

  if (loading) {
    return (
      <button disabled className="w-full sm:w-auto bg-primary/50 rounded-xl px-3 sm:px-5 py-2.5 sm:py-3 text-primary-foreground font-bold opacity-70">
        Carregando...
      </button>
    );
  }

  const display = selectedDate ? formatDateDisplay(selectedDate) : null;

  return (
    <div className="w-full sm:w-auto relative" data-datepicker>
      <button
        ref={dateButtonRef}
        type="button"
        onClick={handleButtonClick}
        className="w-full sm:w-auto bg-primary rounded-xl px-3 sm:px-5 py-2.5 sm:py-3 text-primary-foreground flex items-center justify-between sm:justify-start gap-3 sm:gap-4 font-bold shadow-lg cursor-pointer hover:bg-primary/90 transition-all"
      >
        <div>
          {display ? (
            <>
              <span className="text-primary-foreground/70 text-[10px] sm:text-xs block capitalize">
                {display.weekday}, {display.year}
              </span>
              <span className="text-lg sm:text-2xl">
                {display.dayMonth}
              </span>
            </>
          ) : (
            <span className="text-base sm:text-xl">Selecionar...</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-white/80 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} />
      </button>

      {showDatePicker && createPortal(
        <>
          <div
            className="fixed inset-0 z-[99998] bg-black/20 sm:bg-transparent"
            onClick={() => setShowDatePicker(false)}
          />
          <div
            className="fixed bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 p-3 sm:p-4 z-[99999] max-h-[70vh] sm:max-h-[400px] overflow-y-auto"
            style={{
              top: dropdownPosition.top,
              left: isMobile ? 16 : dropdownPosition.left,
              right: isMobile ? 16 : 'auto',
              width: isMobile ? 'calc(100% - 32px)' : '300px',
            }}
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300 text-sm sm:text-base">
                Datas ({availableDates.length})
              </span>
              <button
                onClick={() => setShowDatePicker(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {availableDates.length === 0 ? (
              <div className="text-center py-4 text-neutral-500">
                <p className="text-sm">Carregando datas...</p>
              </div>
            ) : (
              <div className="space-y-1">
                {availableDates.map((date) => {
                  const dateDisplay = formatDateDisplay(date);
                  const isSelected = date === selectedDate;
                  const today = isTodayDate(date);
                  const yesterday = isYesterdayDate(date);

                  return (
                    <button
                      key={date}
                      onClick={() => handleSelectDate(date)}
                      className={`w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all text-left ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 active:bg-neutral-200 dark:active:bg-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-bold text-sm sm:text-base ${
                          isSelected ? 'bg-white/20' : 'bg-neutral-100 dark:bg-neutral-800'
                        }`}>
                          {date.split('-')[0]}
                        </div>
                        <div>
                          <div className="font-medium capitalize text-sm sm:text-base">{dateDisplay.weekday}</div>
                          <div className={`text-[10px] sm:text-xs ${isSelected ? 'text-white/80' : 'text-neutral-500 dark:text-neutral-400'}`}>
                            {dateDisplay.dayMonth} de {dateDisplay.year}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {today && (
                          <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                          }`}>
                            Hoje
                          </span>
                        )}
                        {yesterday && (
                          <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                          }`}>
                            Ontem
                          </span>
                        )}
                        {isSelected && (
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default DatePickerDropdown;
