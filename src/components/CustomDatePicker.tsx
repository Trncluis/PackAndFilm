import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  const uniqueIdRef = useRef<string>(`cal-${Math.random().toString(36).substring(2, 9)}`);

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

  // Close when another calendar instance opens
  useEffect(() => {
    const handleOtherCalendarOpen = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.id !== uniqueIdRef.current) {
        setIsOpen(false);
      }
    };
    window.addEventListener('packandfilm-calendar-open', handleOtherCalendarOpen);
    return () => {
      window.removeEventListener('packandfilm-calendar-open', handleOtherCalendarOpen);
    };
  }, []);

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

  const daysOfWeek = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

  // Days calculation: Only compute when calendar popup is open to preserve 60 FPS typing speed
  const allCalendarDays = useMemo(() => {
    if (!isOpen) return [];

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

    // Dynamic grid: only complete the final week row rather than hardcoding 42 cells (6 rows)
    const totalDays = prevMonthDays.length + currentMonthDays.length;
    const remainingDays = totalDays % 7 === 0 ? 0 : 7 - (totalDays % 7);
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

    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  }, [isOpen, year, month]);

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

  const toggleOpen = () => {
    if (!isOpen) {
      window.dispatchEvent(new CustomEvent('packandfilm-calendar-open', {
        detail: { id: uniqueIdRef.current }
      }));
    }
    setIsOpen(!isOpen);
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
        onClick={toggleOpen}
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
              className="p-1 rounded-lg text-gray-400 hover:text-[#1A1A2E] hover:bg-[#EDE8FC] transition-colors cursor-pointer"
              title="Clear date"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <span
            className={`text-xs font-black px-2.5 py-1 rounded-full border-2 transition-all flex items-center gap-1 ${
              isOpen
                ? 'bg-[#C9B8F0] text-[#1A1A2E] border-[#1A1A2E] shadow-2xs'
                : 'bg-white text-[#553C9A] border-[#E8E4F0] group-hover:border-[#C9B8F0]'
            }`}
          >
            <span>{isOpen ? 'Close' : 'Calendar'}</span>
          </span>
        </div>
      </button>

      {/* Popover Calendar with Gen-Z Pastel Neo-Brutalist Theme */}
      {isOpen && (
        <div className={`absolute top-[calc(100%+8px)] ${isEndDate ? 'right-0' : 'left-0'} z-50 w-[310px] sm:w-[330px] bg-[#FAFAF7] rounded-[28px] border-2 border-[#1A1A2E] shadow-[6px_6px_0px_0px_#1A1A2E] p-3.5 sm:p-4 animate-fadeIn isolate`}>
          
          {/* Header Month / Year Navigation */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E8E4F0]">
            <div>
              <h4 className="font-black text-base text-[#1A1A2E] tracking-tight">
                {monthNames[month]} {year}
              </h4>
              <p className="text-[11px] font-semibold text-[#6B6B8A] mt-0.5">
                Metro Manila Booking Calendar
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-full bg-white border border-[#E8E4F0] hover:border-[#1A1A2E] hover:bg-[#EDE8FC] flex items-center justify-center text-[#1A1A2E] transition-all shadow-2xs hover:shadow-[2px_2px_0px_#1A1A2E] cursor-pointer active:translate-y-0.5"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-full bg-white border border-[#E8E4F0] hover:border-[#1A1A2E] hover:bg-[#EDE8FC] flex items-center justify-center text-[#1A1A2E] transition-all shadow-2xs hover:shadow-[2px_2px_0px_#1A1A2E] cursor-pointer active:translate-y-0.5"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {daysOfWeek.map((d, idx) => (
              <span
                key={idx}
                className="text-[11px] font-black text-[#6B6B8A] uppercase tracking-wider py-0.5 select-none"
              >
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid with Connected Range Styling */}
          <div className="grid grid-cols-7 gap-1">
            {allCalendarDays.map((item, idx) => {
              const disabled = isDateDisabled(item.dateStr);
              const isSelected = value === item.dateStr;
              const isToday = item.dateStr === todayStr;
              const turnover = isDateTurnover(item.dateStr);
              const booked = !turnover && isDateBooked(item.dateStr);
              const bookedInfo = (booked || turnover) ? getBookedInfo(item.dateStr) : null;

              // Range calculation if rangeStart and rangeEnd are given
              const isRangeActive = Boolean(rangeStart && rangeEnd && rangeStart !== rangeEnd);
              const isRangeStart = isRangeActive && item.dateStr === rangeStart;
              const isRangeEnd = isRangeActive && item.dateStr === rangeEnd;
              const isRangeMiddle = isRangeActive && rangeStart! < item.dateStr && item.dateStr < rangeEnd!;

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
                  className={`relative w-full aspect-square rounded-xl font-black text-xs flex flex-col items-center justify-center p-0.5 transition-all cursor-pointer select-none ${
                    !item.isCurrentMonth
                      ? 'text-[#CBD5E0] cursor-not-allowed opacity-50 font-medium'
                      : isRangeStart
                      ? 'bg-[#C9B8F0] text-[#1A1A2E] border-2 border-[#1A1A2E] rounded-l-xl rounded-r-none font-black shadow-xs z-10'
                      : isRangeEnd
                      ? 'bg-[#C9B8F0] text-[#1A1A2E] border-2 border-[#1A1A2E] rounded-r-xl rounded-l-none font-black shadow-xs z-10'
                      : isRangeMiddle
                      ? 'bg-[#EDE8FC] text-[#553C9A] rounded-none font-black border-y-2 border-[#1A1A2E]'
                      : isSelected
                      ? 'bg-[#C9B8F0] text-[#1A1A2E] border-2 border-[#1A1A2E] rounded-xl font-black shadow-[2px_2px_0px_#1A1A2E] scale-105 z-10'
                      : isToday
                      ? 'bg-[#FEF0E7] text-[#C05621] border border-[#F5C6A8] rounded-xl font-black hover:border-[#1A1A2E] hover:shadow-[2px_2px_0px_#1A1A2E]'
                      : turnover
                      ? 'bg-[#EDE8FC] text-[#553C9A] border border-[#C9B8F0] hover:border-[#1A1A2E] hover:shadow-[2px_2px_0px_#1A1A2E] rounded-xl font-black'
                      : booked
                      ? 'bg-[#FFF5F5] text-[#C53030] line-through border border-[#FEB2B2]/60 rounded-xl font-bold cursor-not-allowed opacity-75'
                      : disabled
                      ? 'text-[#CBD5E0] bg-gray-50/50 cursor-not-allowed font-medium'
                      : 'text-[#1A1A2E] font-extrabold hover:bg-[#E8F7F1] hover:text-[#2F855A] hover:border hover:border-[#A8DBC8] hover:shadow-[2px_2px_0px_#1A1A2E] hover:-translate-y-0.5 active:translate-y-0'
                  }`}
                >
                  <span className="leading-none">{item.day}</span>

                  {/* Indicator Dots */}
                  {item.isCurrentMonth && (
                    <>
                      {isToday && !isSelected && !isRangeStart && !isRangeEnd ? (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-[#DD6B20] mt-0.5 shrink-0"
                          title="Today"
                        />
                      ) : turnover && !isSelected && !isRangeStart && !isRangeEnd ? (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-[#6B46C1] mt-0.5 shrink-0"
                          title="Turnover Day • Handover Available"
                        />
                      ) : booked && !isRangeMiddle ? (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-[#E53E3E] mt-0.5 shrink-0"
                          title="Booked Slot"
                        />
                      ) : null}
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend Strip */}
          <div className="mt-3 pt-2.5 border-t border-[#E8E4F0] flex items-center justify-between text-[10px] text-[#6B6B8A]">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 font-bold text-[#2F855A]">
                <span className="w-2 h-2 rounded-full bg-[#38A169]" />
                <span>Open</span>
              </span>
              <span className="flex items-center gap-1 font-bold text-[#553C9A]">
                <span className="w-2 h-2 rounded-full bg-[#6B46C1]" />
                <span>Turnover</span>
              </span>
              <span className="flex items-center gap-1 font-bold text-[#C53030]">
                <span className="w-2 h-2 rounded-full bg-[#E53E3E]" />
                <span>Reserved</span>
              </span>
            </div>

            <button
              type="button"
              onClick={handlePickToday}
              className="text-[11px] font-extrabold text-[#553C9A] hover:text-[#1A1A2E] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#DD6B20]" />
              <span>Today</span>
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
