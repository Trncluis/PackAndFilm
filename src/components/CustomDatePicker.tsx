import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';

interface BookedRange {
  startDate: string;
  endDate: string;
  title?: string;
  renterTag?: string;
}

interface CustomDatePickerProps {
  value: string; // 'YYYY-MM-DD'
  onChange: (val: string) => void;
  minDate?: string; // 'YYYY-MM-DD'
  label?: React.ReactNode;
  isRequired?: boolean;
  placeholder?: string;
  bookedRanges?: BookedRange[];
  hasConflict?: boolean;
  conflictMessage?: string;
  hasError?: boolean;
  errorMessage?: string;
  rangeStart?: string;
  rangeEnd?: string;
  isEndDate?: boolean;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = React.memo(({
  value,
  onChange,
  minDate,
  label,
  isRequired = false,
  placeholder = 'Select date',
  bookedRanges = [],
  hasConflict = false,
  conflictMessage,
  hasError = false,
  errorMessage,
  rangeStart,
  rangeEnd,
  isEndDate = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial view year and month from value or minDate or today
  const getInitialDate = () => {
    if (value) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d || 1);
    }
    if (minDate) {
      const [y, m, d] = minDate.split('-').map(Number);
      return new Date(y, m - 1, d || 1);
    }
    return new Date();
  };

  const [currentMonth, setCurrentMonth] = useState<Date>(getInitialDate);

  // Sync current month when value changes
  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-').map(Number);
      setCurrentMonth(new Date(y, m - 1, d || 1));
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Days calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonthDays = Array.from({ length: firstDayOfMonth }, (_, i) => ({
    day: daysInPrevMonth - firstDayOfMonth + i + 1,
    isCurrentMonth: false,
    dateStr: `${year}-${String(month).padStart(2, '0')}-${String(daysInPrevMonth - firstDayOfMonth + i + 1).padStart(2, '0')}`
  }));

  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return {
      day: d,
      isCurrentMonth: true,
      dateStr
    };
  });

  const totalGridCount = 42;
  const remainingDays = totalGridCount - (prevMonthDays.length + currentMonthDays.length);
  const nextMonthDays = Array.from({ length: remainingDays }, (_, i) => {
    const d = i + 1;
    const nextY = month === 11 ? year + 1 : year;
    const nextM = month === 11 ? 1 : month + 2;
    const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return {
      day: d,
      isCurrentMonth: false,
      dateStr
    };
  });

  const allCalendarDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

  // Helper date string formatter
  const formatFriendlyDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const isDateDisabled = (dateStr: string) => {
    if (minDate && dateStr < minDate) return true;
    return false;
  };

  const isDateTurnover = (dateStr: string) => {
    if (!isEndDate) {
      // Start Date (Pickup): date where a previous multi-day rental returns, and no booking starts
      const hasEnding = bookedRanges.some(b => b.endDate === dateStr && b.startDate < b.endDate);
      const hasStarting = bookedRanges.some(b => b.startDate === dateStr);
      return hasEnding && !hasStarting;
    } else {
      // End Date (Return): date where a next multi-day rental starts, and no booking ends
      const hasStarting = bookedRanges.some(b => b.startDate === dateStr && b.startDate < b.endDate);
      const hasEnding = bookedRanges.some(b => b.endDate === dateStr);
      return hasStarting && !hasEnding;
    }
  };

  const isDateBooked = (dateStr: string) => {
    if (!isEndDate) {
      // For pickup input: booked if inside any reservation, unless it is a turnover return day
      return bookedRanges.some(b => {
        if (b.startDate === b.endDate) return dateStr === b.startDate;
        return dateStr >= b.startDate && dateStr < b.endDate;
      });
    } else {
      // For return input: booked if inside any reservation, unless it is a turnover pickup day
      return bookedRanges.some(b => {
        if (b.startDate === b.endDate) return dateStr === b.startDate;
        return dateStr > b.startDate && dateStr <= b.endDate;
      });
    }
  };

  const getBookedInfo = (dateStr: string) => {
    return bookedRanges.find(b => dateStr >= b.startDate && dateStr <= b.endDate);
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (dateStr: string) => {
    onChange(dateStr);
    setIsOpen(false);
  };

  const handlePickToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (minDate && todayStr < minDate) {
      onChange(minDate);
    } else {
      onChange(todayStr);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label className="block text-xs font-extrabold text-[#1A1A2E] mb-1.5 flex items-center gap-1">
          <span>{label}</span>
          {isRequired && <span className="text-red-500 font-bold">*</span>}
        </label>
      )}

      {/* Trigger Button styled with PackAndFilm Pastel Design Language */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[50px] px-4 py-2.5 rounded-2xl border-2 text-left transition-all flex items-center justify-between gap-3 bg-[#FAFAF7] cursor-pointer group ${
          isOpen
            ? 'border-[#1A1A2E] shadow-[3px_3px_0px_#1A1A2E] bg-white ring-2 ring-[#C9B8F0]/40'
            : hasConflict || hasError
            ? 'border-[#FEB2B2] bg-[#FFF5F5] hover:border-red-400 ring-2 ring-red-100'
            : 'border-[#E8E4F0] hover:border-[#1A1A2E] hover:bg-white hover:shadow-[2px_2px_0px_#1A1A2E]'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
              hasConflict || hasError
                ? 'bg-[#FED7D7] text-[#C53030]'
                : isEndDate
                ? 'bg-[#FEF0E7] text-[#C05621]'
                : 'bg-[#EDE8FC] text-[#553C9A]'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            {value ? (
              <div className="font-extrabold text-xs sm:text-sm text-[#1A1A2E] truncate">
                {formatFriendlyDate(value)}
              </div>
            ) : (
              <div className="text-xs sm:text-sm font-semibold text-[#6B6B8A]">
                {placeholder}
              </div>
            )}
            <div className="text-[10px] font-bold text-[#6B6B8A] tracking-wider uppercase">
              {value === todayStr ? 'Today' : value ? value : 'Pick a Date'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {value && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-1 rounded-lg text-gray-400 hover:text-[#1A1A2E] hover:bg-[#EDE8FC] transition-colors"
              title="Clear date"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <span
            className={`text-xs font-black px-2 py-0.5 rounded-full border transition-colors ${
              isOpen
                ? 'bg-[#1A1A2E] text-white border-[#1A1A2E]'
                : 'bg-white text-[#553C9A] border-[#E8E4F0]'
            }`}
          >
            {isOpen ? 'Close' : 'Calendar'}
          </span>
        </div>
      </button>

      {/* Popover Calendar with Gen-Z Pastel Neo-Brutalist Theme */}
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 z-50 w-full sm:w-[330px] bg-white rounded-[28px] border-2 border-[#1A1A2E] shadow-[6px_6px_0px_0px_#1A1A2E] p-4.5 animate-fadeIn">
          
          {/* Header Month / Year Navigation */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E8E4F0]">
            <div>
              <h4 className="font-black text-sm text-[#1A1A2E] tracking-tight">
                {monthNames[month]} {year}
              </h4>
              <p className="text-[10px] font-semibold text-[#6B6B8A]">
                Metro Manila Booking Calendar
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-7 h-7 rounded-xl bg-[#FAFAF7] border border-[#E8E4F0] hover:bg-[#EDE8FC] hover:border-[#C9B8F0] flex items-center justify-center text-[#1A1A2E] transition-colors cursor-pointer"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-7 h-7 rounded-xl bg-[#FAFAF7] border border-[#E8E4F0] hover:bg-[#EDE8FC] hover:border-[#C9B8F0] flex items-center justify-center text-[#1A1A2E] transition-colors cursor-pointer"
                aria-label="Next month"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {daysOfWeek.map((d, idx) => (
              <span
                key={idx}
                className="text-[11px] font-black text-[#6B6B8A] uppercase tracking-wider py-1"
              >
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {allCalendarDays.map((item, idx) => {
              const disabled = isDateDisabled(item.dateStr);
              const isSelected = value === item.dateStr;
              const isToday = item.dateStr === todayStr;
              const turnover = isDateTurnover(item.dateStr);
              const booked = !turnover && isDateBooked(item.dateStr);
              const bookedInfo = (booked || turnover) ? getBookedInfo(item.dateStr) : null;

              // Range calculation if rangeStart and rangeEnd are given
              const inRange =
                rangeStart &&
                rangeEnd &&
                item.dateStr >= rangeStart &&
                item.dateStr <= rangeEnd;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && handleSelectDay(item.dateStr)}
                  title={
                    turnover
                      ? (!isEndDate
                        ? `Turnover Day • Available for Pickup (Previous rental returns on ${bookedInfo?.endDate})`
                        : `Turnover Day • Available for Return (Next rental picks up on ${bookedInfo?.startDate})`)
                      : booked
                      ? `Reserved (${bookedInfo?.startDate} to ${bookedInfo?.endDate})`
                      : disabled
                      ? 'Date unavailable'
                      : formatFriendlyDate(item.dateStr)
                  }
                  className={`relative h-9 rounded-xl font-bold text-xs flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
                    !item.isCurrentMonth
                      ? 'text-gray-300 opacity-60'
                      : isSelected
                      ? 'bg-[#1A1A2E] text-white shadow-sm ring-2 ring-[#C9B8F0]'
                      : inRange
                      ? 'bg-[#EDE8FC] text-[#553C9A]'
                      : turnover
                      ? 'bg-[#FFF9F2] text-[#C05621] border border-[#F5C6A8] hover:bg-[#FEF0E7]'
                      : booked
                      ? 'bg-[#FFF5F5] text-[#C53030] border border-[#FEB2B2] hover:bg-[#FED7D7]'
                      : disabled
                      ? 'text-gray-300 bg-gray-50/60 cursor-not-allowed'
                      : 'text-[#1A1A2E] hover:bg-[#EDE8FC] hover:text-[#553C9A]'
                  }`}
                >
                  <span className="leading-none">{item.day}</span>

                  {/* Indicator Dots */}
                  {booked ? (
                    <span
                      className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-red-500"
                      title="Booked Slot"
                    />
                  ) : turnover ? (
                    <span
                      className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#DD6B20]"
                      title="Turnover Day • Handover Available"
                    />
                  ) : isToday && !isSelected ? (
                    <span
                      className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#38A169]"
                      title="Today"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Legend Strip */}
          <div className="mt-3 pt-2.5 border-t border-[#E8E4F0] flex items-center justify-between text-[10px] text-[#6B6B8A]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#38A169]" />
                <span className="font-semibold">Open</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="font-semibold">Booked</span>
              </span>
            </div>

            <button
              type="button"
              onClick={handlePickToday}
              className="text-[11px] font-extrabold text-[#6B46C1] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-[#F5C6A8]" />
              <span>Jump to Today</span>
            </button>
          </div>

        </div>
      )}

      {/* Inline Conflict or Error Notice */}
      {hasConflict && conflictMessage ? (
        <p className="mt-1.5 text-xs text-red-600 font-semibold flex items-center gap-1">
          <span>⚠️</span> {conflictMessage}
        </p>
      ) : hasError && errorMessage ? (
        <p className="mt-1.5 text-xs text-red-600 font-semibold flex items-center gap-1">
          <span>⚠️</span> {errorMessage}
        </p>
      ) : null}
    </div>
  );
});
