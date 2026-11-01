import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock
} from 'lucide-react';
import {
  BookingRecord,
  DayAvailabilityInfo,
  getCameraDayAvailability
} from '../data/bookings';

interface UnifiedRentalCalendarProps {
  rentalType: 'same-day' | 'multi-day';
  startDate: string;
  endDate: string;
  todayStr: string;
  cameraId: string;
  bookings: BookingRecord[];
  onDateRangeChange: (startDate: string, endDate: string) => void;
  hasConflict?: boolean;
  conflictMessage?: string;
  isStartTurnover?: boolean;
  isEndTurnover?: boolean;
}

export const UnifiedRentalCalendar: React.FC<UnifiedRentalCalendarProps> = ({
  rentalType,
  startDate,
  endDate,
  todayStr,
  cameraId,
  bookings,
  onDateRangeChange,
  hasConflict,
  conflictMessage,
  isStartTurnover,
  isEndTurnover
}) => {
  // Calendar View Month/Year
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const base = startDate || todayStr;
    const [y, m, d] = base.split('-').map(Number);
    return new Date(y, m - 1, d || 1);
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  // State machine for multi-day picking: whether next click sets start or end
  const [selectingEnd, setSelectingEnd] = useState<boolean>(false);
  const [tempStart, setTempStart] = useState<string>(startDate);

  // Sync tempStart when props change
  React.useEffect(() => {
    setTempStart(startDate);
  }, [startDate]);

  // Calendar days grid
  const allCalendarDays = useMemo(() => {
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
  }, [year, month]);

  // Handle cell click
  const handleDateClick = (dateStr: string, dayInfo: DayAvailabilityInfo) => {
    if (dayInfo.status === 'past' || dayInfo.status === 'booked') return;

    if (rentalType === 'same-day') {
      onDateRangeChange(dateStr, dateStr);
      setSelectingEnd(false);
      return;
    }

    // MULTI-DAY MODE
    if (!selectingEnd) {
      setTempStart(dateStr);
      setSelectingEnd(true);
      const [y, m, d] = dateStr.split('-').map(Number);
      const nextDayStr = new Date(y, m - 1, d + 1).toISOString().split('T')[0];
      onDateRangeChange(dateStr, nextDayStr);
    } else {
      if (dateStr > tempStart) {
        onDateRangeChange(tempStart, dateStr);
        setSelectingEnd(false);
      } else if (dateStr < tempStart) {
        setTempStart(dateStr);
        setSelectingEnd(true);
        const [y, m, d] = dateStr.split('-').map(Number);
        const nextDayStr = new Date(y, m - 1, d + 1).toISOString().split('T')[0];
        onDateRangeChange(dateStr, nextDayStr);
      } else {
        onDateRangeChange(dateStr, dateStr);
        setSelectingEnd(false);
      }
    }
  };

  const handleJumpToday = () => {
    const [y, m] = todayStr.split('-').map(Number);
    setCurrentMonth(new Date(y, m - 1, 1));
    if (rentalType === 'same-day') {
      onDateRangeChange(todayStr, todayStr);
    } else {
      const [ty, tm, td] = todayStr.split('-').map(Number);
      const nextDayStr = new Date(ty, tm - 1, td + 1).toISOString().split('T')[0];
      onDateRangeChange(todayStr, nextDayStr);
    }
  };

  // Human-readable date labels
  const formatShortDate = (dStr: string) => {
    if (!dStr) return '';
    try {
      const [y, m, d] = dStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return dStr;
    }
  };

  const calculateDaysCount = () => {
    if (!startDate || !endDate) return 1;
    if (startDate === endDate) return 1;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  };

  const daysCount = calculateDaysCount();

  return (
    <div className="rounded-[28px] border-2 border-[#1A1A2E] bg-white shadow-[6px_6px_0px_0px_#1A1A2E] p-4 sm:p-6 space-y-4 isolate">
      
      {/* Calendar Header with Navigation */}
      <div className="flex items-center justify-between pb-3.5 border-b-2 border-[#E8E4F0]">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-black text-base sm:text-lg text-[#1A1A2E] uppercase tracking-wider">
              {monthNames[month]} {year}
            </h4>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#EDE8FC] text-[#553C9A] border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E]">
              Metro Manila
            </span>
          </div>
          <p className="text-xs text-[#6B6B8A] font-semibold mt-1">
            {rentalType === 'same-day'
              ? 'Tap your desired shoot date below.'
              : selectingEnd
              ? 'Now tap your return date (2+ days).'
              : 'Tap your start date, then your end date.'}
          </p>
        </div>

        {/* Month Navigation Chevrons with PackAndFilm Neo-Brutalist Hard Shadows */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="w-9 h-9 rounded-full bg-[#FAFAF7] border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 flex items-center justify-center text-[#1A1A2E] transition-all cursor-pointer active:translate-y-0.5"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="w-9 h-9 rounded-full bg-[#FAFAF7] border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 flex items-center justify-center text-[#1A1A2E] transition-all cursor-pointer active:translate-y-0.5"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Column Headers */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {daysOfWeek.map((d) => (
          <span
            key={d}
            className="text-[11px] font-black uppercase text-[#6B6B8A] tracking-wider py-1 select-none"
          >
            {d}
          </span>
        ))}
      </div>

      {/* Big Interactive Days Grid with Neo-Brutalist Component Shadows */}
      <div className="grid grid-cols-7 gap-y-2.5 gap-x-1 sm:gap-x-2">
        {allCalendarDays.map((item, idx) => {
          const dayInfo = getCameraDayAvailability(cameraId, item.dateStr, todayStr, bookings);

          const isPast = dayInfo.status === 'past';
          const isBooked = dayInfo.status === 'booked';
          const isTurnover = dayInfo.status === 'turnover';
          const isAvailable = dayInfo.status === 'available';
          const isToday = item.dateStr === todayStr;

          const isRangeActive = Boolean(startDate && endDate && startDate !== endDate);
          const isRangeStart = isRangeActive && item.dateStr === startDate;
          const isRangeEnd = isRangeActive && item.dateStr === endDate;
          const isRangeMiddle = isRangeActive && startDate < item.dateStr && item.dateStr < endDate;
          const isSingleSelected = (!isRangeActive && (item.dateStr === startDate || item.dateStr === endDate)) || (startDate === endDate && item.dateStr === startDate);

          const isDisabled = !item.isCurrentMonth || isPast || isBooked;

          return (
            <button
              key={idx}
              type="button"
              disabled={isDisabled}
              onClick={() => handleDateClick(item.dateStr, dayInfo)}
              title={dayInfo.tooltip}
              className={`relative h-11 sm:h-12 rounded-2xl flex flex-col items-center justify-center transition-all select-none ${
                !item.isCurrentMonth
                  ? 'text-[#CBD5E0] cursor-not-allowed opacity-40 font-medium'
                  : isRangeStart
                  ? 'bg-[#C9B8F0] text-[#1A1A2E] border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E] rounded-l-2xl rounded-r-none font-black z-10'
                  : isRangeEnd
                  ? 'bg-[#C9B8F0] text-[#1A1A2E] border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E] rounded-r-2xl rounded-l-none font-black z-10'
                  : isRangeMiddle
                  ? 'bg-[#EDE8FC] text-[#553C9A] border-y-2 border-[#1A1A2E] rounded-none font-black'
                  : isSingleSelected
                  ? 'bg-[#C9B8F0] text-[#1A1A2E] border-2 border-[#1A1A2E] shadow-[3px_3px_0px_#1A1A2E] rounded-2xl font-black scale-105 z-10'
                  : isToday
                  ? 'bg-[#FEF0E7] text-[#C05621] border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#F5C6A8] hover:shadow-[3px_3px_0px_#1A1A2E] rounded-2xl font-black hover:-translate-y-0.5 cursor-pointer'
                  : isTurnover
                  ? 'bg-[#EDE8FC] text-[#553C9A] border-2 border-[#C9B8F0] hover:border-[#1A1A2E] shadow-2xs hover:shadow-[2px_2px_0px_#1A1A2E] rounded-2xl font-black hover:-translate-y-0.5 cursor-pointer'
                  : isBooked
                  ? 'bg-[#FFF5F5] text-[#C53030] line-through border border-[#FEB2B2]/60 rounded-2xl font-bold cursor-not-allowed opacity-75'
                  : isPast
                  ? 'text-[#CBD5E0] bg-gray-50/50 cursor-not-allowed font-medium'
                  : 'text-[#1A1A2E] font-extrabold text-sm sm:text-base rounded-2xl border border-transparent hover:border-2 hover:border-[#1A1A2E] hover:bg-[#E8F7F1] hover:text-[#2F855A] hover:shadow-[2px_2px_0px_#1A1A2E] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer'
              }`}
            >
              <span className="leading-none text-xs sm:text-sm">{item.day}</span>

              {/* Status Indicator Dots */}
              {item.isCurrentMonth && !isPast && (
                <div className="h-1.5 flex items-center justify-center mt-1">
                  {isSingleSelected || isRangeStart || isRangeEnd ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#553C9A]" />
                  ) : isToday ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#DD6B20]" />
                  ) : isTurnover ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6B46C1]" />
                  ) : isBooked ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E53E3E]" />
                  ) : isAvailable ? (
                    <span className="w-1 h-1 rounded-full bg-[#38A169]/50" />
                  ) : null}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend & Quick Actions Bar */}
      <div className="pt-3.5 border-t-2 border-[#E8E4F0] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#6B6B8A]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 font-bold text-[#1A1A2E]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C9B8F0] border border-[#1A1A2E]" />
            <span>Selected</span>
          </span>
          {rentalType === 'multi-day' && (
            <span className="flex items-center gap-1.5 font-bold text-[#553C9A]">
              <span className="w-2.5 h-2.5 rounded-md bg-[#EDE8FC] border border-[#C9B8F0]" />
              <span>In Range</span>
            </span>
          )}
          <span className="flex items-center gap-1.5 font-bold text-[#2F855A]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38A169]" />
            <span>Available</span>
          </span>
          <span className="flex items-center gap-1.5 font-bold text-[#553C9A]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6B46C1]" />
            <span>Turnover (2 PM)</span>
          </span>
          <span className="flex items-center gap-1.5 font-bold text-[#C53030]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E53E3E]" />
            <span>Reserved</span>
          </span>
          <span className="flex items-center gap-1.5 font-bold text-[#C05621]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DD6B20]" />
            <span>Today</span>
          </span>
        </div>

        {/* Neo-brutalist styled Jump to Today button with border and shadow */}
        <button
          type="button"
          onClick={handleJumpToday}
          className="px-3 py-1.5 rounded-full bg-white border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 text-xs font-black text-[#553C9A] flex items-center gap-1.5 cursor-pointer transition-all active:translate-y-0.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#DD6B20]" />
          <span>Jump to Today</span>
        </button>
      </div>

      {/* Selected Window Summary Banner with Neo-Brutalist Border & Shadow */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#EDE8FC]/40 via-white to-[#FEF0E7]/40 border-2 border-[#1A1A2E] shadow-[3px_3px_0px_#1A1A2E] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <CalendarIcon className="w-4 h-4 text-[#553C9A] shrink-0" />
          <div className="text-xs font-bold text-[#1A1A2E]">
            {rentalType === 'same-day' ? (
              <span>
                Shoot Date: <span className="font-black text-[#553C9A]">{formatShortDate(startDate) || 'None picked'}</span>
              </span>
            ) : (
              <span>
                Rental Window: <span className="font-black text-[#553C9A]">{formatShortDate(startDate) || 'Start'}</span> → <span className="font-black text-[#553C9A]">{formatShortDate(endDate) || 'End'}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-black px-3 py-1 rounded-full bg-[#EDE8FC] text-[#553C9A] border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E]">
            {rentalType === 'same-day' ? '1 Day Shoot' : `${daysCount} ${daysCount === 1 ? 'Day' : 'Days'} Total`}
          </span>

          {isStartTurnover && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#B45309]" />
              <span>Afternoon Pickup (2 PM)</span>
            </span>
          )}
        </div>
      </div>

      {/* Conflict Notice if any */}
      {hasConflict && conflictMessage && (
        <div className="p-3.5 rounded-2xl bg-[#FFF5F5] border-2 border-[#FEB2B2] text-xs font-bold text-[#C53030] flex items-center gap-2 animate-fadeIn shadow-xs">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{conflictMessage}</span>
        </div>
      )}
    </div>
  );
};
