import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { api } from '../contexts/AuthContext';

const DateFilter = ({ selectedDate, onDateChange }) => {
  const [availableDates, setAvailableDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchAvailableDates();
  }, []);

  const fetchAvailableDates = async () => {
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

  const convertToDate = (ddmm) => {
    if (!ddmm) return null;
    const [day, month] = ddmm.split('-').map(Number);
    const year = new Date().getFullYear();
    return new Date(year, month - 1, day);
  };

  const convertToDDMM = (date) => {
    if (!date) return null;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}`;
  };

  const formatDisplayDate = (ddmm) => {
    if (!ddmm) return 'Selecionar data';
    const [day, month] = ddmm.split('-');
    const year = new Date().getFullYear();
    return `${day}/${month}/${year}`;
  };

  const isDateAvailable = (date) => {
    const ddmm = convertToDDMM(date);
    return availableDates.includes(ddmm);
  };

  const modifiers = {
    available: (date) => isDateAvailable(date),
  };

  const modifiersStyles = {
    available: {
      fontWeight: 'bold',
      backgroundColor: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
      borderRadius: '0.375rem',
    },
  };

  const handleSelect = (date) => {
    if (date && isDateAvailable(date)) {
      const ddmm = convertToDDMM(date);
      onDateChange(ddmm);
      setOpen(false);
    }
  };

  if (loading) {
    return (
      <Button variant="outline" disabled className="w-full">
        <CalendarIcon className="mr-2 h-4 w-4" />
        Carregando...
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !selectedDate && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDisplayDate(selectedDate)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate ? convertToDate(selectedDate) : undefined}
          onSelect={handleSelect}
          disabled={(date) => !isDateAvailable(date)}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          initialFocus
        />
        {availableDates.length > 0 && (
          <div className="p-3 border-t text-xs text-muted-foreground">
            <p className="mb-2 font-medium">Datas disponíveis:</p>
            <div className="flex flex-wrap gap-1">
              {availableDates.slice(0, 10).map((date) => (
                <button
                  key={date}
                  onClick={() => {
                    onDateChange(date);
                    setOpen(false);
                  }}
                  className={cn(
                    'px-2 py-1 text-xs rounded hover:bg-accent',
                    selectedDate === date && 'bg-primary text-primary-foreground'
                  )}
                >
                  {formatDisplayDate(date)}
                </button>
              ))}
              {availableDates.length > 10 && (
                <span className="px-2 py-1 text-xs">
                  +{availableDates.length - 10} mais
                </span>
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default DateFilter;
