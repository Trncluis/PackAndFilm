import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { CameraItem } from '../data/cameras';
import {
  BookingRecord,
  DayAvailabilityInfo,
  getCameraDayAvailability,
  getCameraNext7DaysAvailability
} from '../data/bookings';

// ─────────────────────────────────────────────────────────────
// 1. DYNAMIC CATALOG CARD HEADER BADGE
// ─────────────────────────────────────────────────────────────
interface CameraAvailabilityBadgeProps {
  camera: CameraItem;
  todayStr: string;
  bookings: BookingRecord[];
  onOpenCalendar?: () => void;
}

export const CameraAvailabilityBadge: React.FC<CameraAvailabilityBadgeProps> = ({
  camera,
  todayStr,
  bookings,
  onOpenCalendar
}) => {
  if (!camera.isAvailable) {
    return (
      <span className="text-[10px] font-black text-[#6B6B8A] bg-white px-2.5 py-1 rounded-full border border-[#E8E4F0]">
        Lineup Addition
      </span>
    );
  }

  const todayInfo = getCameraDayAvailability(camera.id, todayStr, todayStr, bookings);

  if (todayInfo.status === 'available') {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenCalendar?.();
        }}
        className="text-[10px] font-black text-[#2F855A] bg-[#E8F7F1] hover:bg-[#D6F0E6] px-2.5 py-1 rounded-full border border-[#A8DBC8] hover:border-[#1A1A2E] inline-flex items-center gap-1.5 shadow-2xs hover:shadow-[2px_2px_0px_#1A1A2E] transition-all cursor-pointer group/badge"
        title="100% Free today! Click to view full month calendar"
      >
        <span className="w-2 h-2 rounded-full bg-[#38A169] animate-pulse" />
        <span>Available Today</span>
        <ChevronRight className="w-3 h-3 text-[#2F855A] opacity-70 group-hover/badge:translate-x-0.5 transition-transform" />
      </button>
    );
  }



  // Booked today: Find next free date
  let nextFreeText = 'Soon';
  const next7Days = getCameraNext7DaysAvailability(camera.id, todayStr, bookings);
  const nextOpen = next7Days.find(d => d.status === 'available');
  if (nextOpen) {
    const [, m, d] = nextOpen.dateStr.split('-').map(Number);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    nextFreeText = `${months[m - 1]} ${d}`;
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpenCalendar?.();
      }}
      className="text-[10px] font-black text-[#C05621] bg-[#FFF0E7] hover:bg-[#FFE3D0] px-2.5 py-1 rounded-full border border-[#F5C6A8] hover:border-[#1A1A2E] inline-flex items-center gap-1.5 shadow-2xs hover:shadow-[2px_2px_0px_#1A1A2E] transition-all cursor-pointer group/badge"
      title={`Currently reserved. Next free slot starts ${nextFreeText}. Click to view calendar.`}
    >
      <Clock className="w-3 h-3 text-[#DD6B20]" />
      <span>Booked Today • Free {nextFreeText}</span>
      <ChevronRight className="w-3 h-3 text-[#C05621] opacity-70 group-hover/badge:translate-x-0.5 transition-transform" />
    </button>
  );
};

// ─────────────────────────────────────────────────────────────
// 2. 7-DAY MINI AVAILABILITY STRIP FOR CATALOG CARDS
// ─────────────────────────────────────────────────────────────
interface CameraWeekAvailabilityStripProps {
  camera: CameraItem;
  todayStr: string;
  bookings: BookingRecord[];
  onSelectDate: (cameraId: string, dateStr: string) => void;
  onOpenMonthCalendar: (camera: CameraItem) => void;
}

const TWO_LETTER_DAYS: Record<string, string> = {
  Sun: 'SU',
  Mon: 'MO',
  Tue: 'TU',
  Wed: 'WE',
  Thu: 'TH',
  Fri: 'FR',
  Sat: 'SA',
};

export const CameraWeekAvailabilityStrip: React.FC<CameraWeekAvailabilityStripProps> = ({
  camera,
  todayStr,
  bookings,
  onSelectDate,
  onOpenMonthCalendar
}) => {
  const [hoveredDay, setHoveredDay] = useState<DayAvailabilityInfo | null>(null);

  const days = useMemo(() => {
    return getCameraNext7DaysAvailability(camera.id, todayStr, bookings);
  }, [camera.id, todayStr, bookings]);

  const availableCount = days.filter(d => d.status === 'available').length;

  return (
    <div className="mt-3.5 p-3.5 sm:p-4 rounded-2xl bg-white border-2 border-[#1A1A2E] shadow-[3px_3px_0px_#1A1A2E] space-y-2.5 transition-all">
      {/* Strip Header with Icon Box & Neo-Brutalist Full Month Button */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-[#EDE8FC] border border-[#1A1A2E] flex items-center justify-center text-[#553C9A] shrink-0 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-[#553C9A]" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#1A1A2E] truncate">
            Live 7-Day Availability
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenMonthCalendar(camera);
          }}
          className="shrink-0 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-white border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 text-[10px] font-black text-[#553C9A] flex items-center gap-1 transition-all cursor-pointer active:translate-y-0.5 whitespace-nowrap"
          title="Open full interactive month calendar"
        >
          <span>Full Month</span>
          <ChevronRight className="w-3 h-3 text-[#553C9A]" />
        </button>
      </div>

      {/* 7-Day Interactive Day Strip Styled with Balanced Squircle Badges */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {days.map((day) => {
          const isToday = day.dateStr === todayStr;
          const isAvailable = day.status === 'available';
          const isBooked = day.status === 'booked';
          const dayCode = TWO_LETTER_DAYS[day.dayName] || day.dayName.slice(0, 2).toUpperCase();

          return (
            <button
              key={day.dateStr}
              type="button"
              disabled={isBooked}
              aria-label={isToday ? `Today, ${day.dayName} ${day.dayNum}` : `${day.dayName} ${day.dayNum}, ${day.status}`}
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
              onClick={(e) => {
                e.stopPropagation();
                if (!isBooked) {
                  onSelectDate(camera.id, day.dateStr);
                }
              }}
              className={`w-full min-w-0 aspect-[4/5] py-1.5 sm:py-2 px-0.5 rounded-xl sm:rounded-2xl flex flex-col items-center justify-between transition-all select-none ${
                isToday
                  ? 'bg-[#FEF0E7] text-[#C05621] border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#F5C6A8] hover:shadow-[2px_2px_0px_#1A1A2E] hover:-translate-y-0.5 cursor-pointer font-black'
                  : isBooked
                  ? 'bg-[#FFF5F5] text-[#C53030]/80 border border-[#FEB2B2]/70 font-bold opacity-75 cursor-not-allowed'
                  : 'bg-[#FAFAF7] text-[#1A1A2E] border-2 border-[#E8E4F0] hover:border-[#1A1A2E] hover:bg-[#E8F7F1] hover:text-[#2F855A] hover:shadow-[2px_2px_0px_#1A1A2E] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer font-extrabold'
              }`}
              title={isToday ? `Today (${day.dayName} ${day.dayNum}) • ${day.tooltip}` : day.tooltip}
            >
              <span className="text-[10px] sm:text-[11px] font-black uppercase leading-none tracking-tight">
                {isToday ? 'TD' : dayCode}
              </span>
              <span className={`text-xs sm:text-sm font-black leading-none ${isBooked ? 'line-through opacity-70' : ''}`}>
                {day.dayNum}
              </span>
              <div className="h-1.5 flex items-center justify-center">
                {isToday ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DD6B20]" />
                ) : isBooked ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E53E3E]" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38A169]" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Status Bar / Tooltip Line with Pastel Badges */}
      <div className="pt-2 border-t-2 border-[#E8E4F0] flex items-center justify-between text-[10px] min-h-[26px]">
        {hoveredDay ? (
          <div className="flex items-center gap-1.5 font-black text-[#1A1A2E] truncate animate-fadeIn">
            {hoveredDay.status === 'available' && (
              <span className="text-[#2F855A] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#38A169]" />
                <span>{hoveredDay.dateStr}: 100% Free • Click to Book</span>
              </span>
            )}

            {hoveredDay.status === 'booked' && (
              <span className="text-[#C53030] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#E53E3E]" />
                <span>{hoveredDay.dateStr}: Reserved by verified renter</span>
              </span>
            )}
          </div>
        ) : (
          <>
            <span className="font-extrabold text-[#2F855A] flex items-center gap-1.5 bg-[#E8F7F1] px-2 py-0.5 rounded-full border border-[#A8DBC8]">
              <Check className="w-3 h-3 text-[#2F855A]" />
              <span>{availableCount} of 7 days available</span>
            </span>
            <span className="text-[10px] font-bold text-[#6B6B8A] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#DD6B20]" />
              <span>Click day to start</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 3. INTERACTIVE FULL-MONTH FLEET AVAILABILITY MODAL
// ─────────────────────────────────────────────────────────────
interface CameraMonthCalendarModalProps {
  camera: CameraItem | null;
  todayStr: string;
  bookings: BookingRecord[];
  onClose: () => void;
  onBookCamera: (cameraId: string, prefillStartDate?: string) => void;
}

export const CameraMonthCalendarModal: React.FC<CameraMonthCalendarModalProps> = ({
  camera,
  todayStr,
  bookings,
  onClose,
  onBookCamera
}) => {
  if (!camera) return null;

  const [currentDate, setCurrentDate] = useState(() => {
    const [y, m] = todayStr.split('-').map(Number);
    return new Date(y, m - 1, 1);
  });

  // Selected date inside live calendar (selecting does NOT jump straight to booking modal)
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleJumpToday = () => {
    const [y, m] = todayStr.split('-').map(Number);
    setCurrentDate(new Date(y, m - 1, 1));
    setSelectedDate(todayStr);
  };

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

  // Calendar matrix calculation with padding days matching UnifiedRentalCalendar
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthLastDate = new Date(year, month, 0).getDate();

    const prevMonthDays = Array.from({ length: firstDayIndex }, (_, i) => {
      const d = prevMonthLastDate - firstDayIndex + i + 1;
      const prevY = month === 0 ? year - 1 : year;
      const prevM = month === 0 ? 12 : month;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      return {
        day: d,
        isCurrentMonth: false,
        dateStr,
        dayInfo: getCameraDayAvailability(camera.id, dateStr, todayStr, bookings)
      };
    });

    const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      return {
        day: d,
        isCurrentMonth: true,
        dateStr,
        dayInfo: getCameraDayAvailability(camera.id, dateStr, todayStr, bookings)
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
        dateStr,
        dayInfo: getCameraDayAvailability(camera.id, dateStr, todayStr, bookings)
      };
    });

    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  }, [camera.id, year, month, todayStr, bookings]);

  // Selected date status info
  const selectedDayInfo = useMemo(() => {
    if (!selectedDate) return null;
    return getCameraDayAvailability(camera.id, selectedDate, todayStr, bookings);
  }, [camera.id, selectedDate, todayStr, bookings]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 overflow-hidden animate-fadeIn">
      {/* Hardware-accelerated static backdrop layer */}
      <div
        className="fixed inset-0 bg-black/75 transition-opacity will-change-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl bg-[#FAFAF7] rounded-[28px] sm:rounded-[32px] border-2 border-[#1A1A2E] shadow-[8px_8px_0px_0px_#1A1A2E] overflow-hidden flex flex-col max-h-[92vh] z-10 isolate">
        
        {/* Modal Header Bar with Neo-Brutalist Badges */}
        <div className="px-5 sm:px-6 py-4 bg-white border-b-2 border-[#1A1A2E] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EDE8FC] border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E] flex items-center justify-center text-[#553C9A] shrink-0 p-1.5">
              <img
                src={camera.image}
                alt={camera.name}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-[#1A1A2E] leading-tight">
                  {camera.shortName}
                </h3>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#EDE8FC] text-[#553C9A] border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E]">
                  Live Calendar
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#6B6B8A] font-semibold mt-0.5">
                ₱{camera.standardRate}/day • Free OTG Readers &amp; 128GB MicroSD Included
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 flex items-center justify-center text-[#1A1A2E] transition-all cursor-pointer shrink-0 active:translate-y-0.5"
            aria-label="Close calendar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1 space-y-4">
          
          {/* Month Navigation Strip with Metro Manila Badge & Neo-brutalist buttons */}
          <div className="flex items-center justify-between bg-white p-3.5 sm:p-4 rounded-2xl border-2 border-[#1A1A2E] shadow-[3px_3px_0px_#1A1A2E]">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-black text-base sm:text-lg text-[#1A1A2E] tracking-tight">
                  {monthNames[month]} {year}
                </h4>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#EDE8FC] text-[#553C9A] border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E]">
                  Metro Manila
                </span>
              </div>
              <p className="text-[11px] font-semibold text-[#6B6B8A] mt-0.5">
                Metro Manila Booking Calendar
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-9 h-9 rounded-full bg-white border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 flex items-center justify-center text-[#1A1A2E] transition-all cursor-pointer active:translate-y-0.5"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-9 h-9 rounded-full bg-white border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 flex items-center justify-center text-[#1A1A2E] transition-all cursor-pointer active:translate-y-0.5"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid Container styled matching UnifiedRentalCalendar */}
          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border-2 border-[#1A1A2E] shadow-[4px_4px_0px_0px_#1A1A2E] max-w-sm sm:max-w-md mx-auto">
            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center mb-2">
              {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map((d) => (
                <div key={d} className="text-[10px] sm:text-[11px] font-black uppercase text-[#6B6B8A] tracking-wider py-1 select-none">
                  {d}
                </div>
              ))}
            </div>

            {/* Date Cells */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {calendarDays.map((item, idx) => {
                const dayInfo = item.dayInfo;
                const isPast = dayInfo.status === 'past';
                const isBooked = dayInfo.status === 'booked';
                const isAvailable = dayInfo.status === 'available';
                const isToday = item.dateStr === todayStr;
                const isSelected = item.dateStr === selectedDate;
                const isDisabled = !item.isCurrentMonth || isPast || isBooked;

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      if (!isDisabled) {
                        // Toggles selection without auto-jumping to booking modal
                        setSelectedDate(prev => prev === item.dateStr ? null : item.dateStr);
                      }
                    }}
                    title={dayInfo.tooltip}
                    className={`relative w-full aspect-square rounded-xl sm:rounded-2xl flex flex-col items-center justify-center p-0.5 sm:p-1 transition-all select-none ${
                      !item.isCurrentMonth
                        ? 'text-[#CBD5E0] cursor-not-allowed opacity-40 font-medium'
                        : isSelected
                        ? 'bg-[#C9B8F0] text-[#1A1A2E] border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E] font-black scale-105 z-10'
                        : isToday
                        ? 'bg-[#FEF0E7] text-[#C05621] border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#F5C6A8] hover:shadow-[2px_2px_0px_#1A1A2E] font-black hover:-translate-y-0.5 cursor-pointer'
                        : isBooked
                        ? 'bg-[#FFF5F5] text-[#C53030] line-through border border-[#FEB2B2]/60 font-bold cursor-not-allowed opacity-75'
                        : isPast
                        ? 'text-[#CBD5E0] bg-gray-50/50 cursor-not-allowed font-medium'
                        : 'text-[#1A1A2E] font-extrabold text-xs sm:text-sm border border-transparent hover:border-2 hover:border-[#1A1A2E] hover:bg-[#E8F7F1] hover:text-[#2F855A] hover:shadow-[2px_2px_0px_#1A1A2E] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer'
                    }`}
                  >
                    <span className="leading-none text-xs sm:text-sm font-black">{item.day}</span>

                    {/* Status Indicator Dots */}
                    {item.isCurrentMonth && !isPast && (
                      <div className="h-1.5 flex items-center justify-center mt-0.5 sm:mt-1">
                        {isSelected ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#553C9A]" />
                        ) : isToday ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#DD6B20]" />
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
            <div className="mt-3.5 pt-3.5 border-t-2 border-[#E8E4F0] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#6B6B8A]">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5 font-bold text-[#1A1A2E]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C9B8F0] border border-[#1A1A2E]" />
                  <span>Selected</span>
                </span>
                <span className="flex items-center gap-1.5 font-bold text-[#2F855A]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#38A169]" />
                  <span>Available</span>
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

              {/* Neo-brutalist styled Jump to Today button */}
              <button
                type="button"
                onClick={handleJumpToday}
                className="px-3 py-1.5 rounded-full bg-white border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 text-xs font-black text-[#553C9A] flex items-center gap-1.5 cursor-pointer transition-all active:translate-y-0.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#DD6B20]" />
                <span>Jump to Today</span>
              </button>
            </div>
          </div>

          {/* Selected Date Summary Banner (Only shown when a date is clicked) */}
          {selectedDate && selectedDayInfo && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#EDE8FC]/40 via-white to-[#FEF0E7]/40 border-2 border-[#1A1A2E] shadow-[3px_3px_0px_#1A1A2E] flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-[#553C9A] shrink-0" />
                <div className="text-xs font-bold text-[#1A1A2E]">
                  <span>
                    Selected Date: <span className="font-black text-[#553C9A]">{formatShortDate(selectedDate)}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-[#E8F7F1] text-[#2F855A] border border-[#A8DBC8] flex items-center gap-1">
                  <Check className="w-3 h-3 text-[#2F855A]" />
                  <span>100% Available</span>
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="text-[10px] font-bold text-[#6B6B8A] hover:text-[#1A1A2E] hover:underline px-1.5 py-0.5 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer CTA */}
        <div className="px-5 sm:px-6 py-4 bg-white border-t-2 border-[#1A1A2E] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs">
            <span className="font-bold text-[#6B6B8A]">Instant Reservation: </span>
            <span className="font-black text-[#1A1A2E]">Pasig Hub &amp; Grab Express</span>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onBookCamera(camera.id, selectedDate || undefined);
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#1A1A2E] hover:bg-[#553C9A] text-white text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 border-2 border-[#1A1A2E] shadow-[3px_3px_0px_#1A1A2E] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 cursor-pointer active:translate-y-0.5"
          >
            <span>{selectedDate ? `Book for ${formatShortDate(selectedDate)}` : 'Book This Unit Now'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

