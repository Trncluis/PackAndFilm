import { getCameraCapacity } from './cameras';

// 2-hour turnover buffer for equipment inspection, cleaning & battery recharge
export const TURNOVER_BUFFER_HOURS = 2;

export interface BookingRecord {
  id: string;
  cameraId: string;
  title: string;
  renterTag: string;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;   // 'YYYY-MM-DD'
  hub: string;
  status: 'Confirmed' | 'Deposit Paid';
  pickupTimeSlot?: string;
  returnTimeSlot?: string;
  pickupHour?: number;
  returnHour?: number;
  notes?: string;
}

// Initial bookings starts 100% empty; availability is strictly populated by confirmed customer bookings
export const INITIAL_BOOKINGS: BookingRecord[] = [];

// Helper to parse 12-hour ("3:00 PM", "3 PM", "3:00PM") or 24-hour ("15:00") string into hour 0-23
export function parseHourFromTimeStr(timeStr?: string | null): number | null {
  if (!timeStr) return null;
  const s = String(timeStr).trim().toUpperCase();
  // Match "3:00 PM" or "3:00PM" or "3 PM" or "3PM"
  const match12 = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
  if (match12) {
    let hour = parseInt(match12[1], 10);
    const isPM = match12[3] === 'PM';
    if (isPM && hour < 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;
    return hour;
  }
  // Match 24-hour "15:00"
  const match24 = s.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    return parseInt(match24[1], 10);
  }
  return null;
}

// Format hour (e.g. 17) to readable "5:00 PM"
export function formatHourToTimeStr(hour: number): string {
  if (hour === 0) return '12:00 AM';
  if (hour === 12) return '12:00 PM';
  if (hour < 12) return `${hour}:00 AM`;
  return `${hour - 12}:00 PM`;
}

// Extract pickup and return times and numeric hours from booking object or notes
export function extractBookingTimes(b: any): {
  pickupTime: string | null;
  returnTime: string | null;
  pickupHour: number | null;
  returnHour: number | null;
} {
  let pickup = b.pickupTimeSlot || b.pickupTime || b['Pickup Time Slot'] || b['Pickup Time'] || null;
  let ret = b.returnTimeSlot || b.returnTime || b['Return Time Slot'] || b['Return Time'] || null;

  if ((!pickup || !ret) && b.notes) {
    const pMatch = String(b.notes).match(/Pickup:\s*([^•\n;]+)/i);
    const rMatch = String(b.notes).match(/Return:\s*([^•\n;]+)/i);
    if (!pickup && pMatch) pickup = pMatch[1].trim();
    if (!ret && rMatch) ret = rMatch[1].trim();
  }

  return {
    pickupTime: pickup,
    returnTime: ret,
    pickupHour: b.pickupHour !== undefined && b.pickupHour !== null ? b.pickupHour : parseHourFromTimeStr(pickup),
    returnHour: b.returnHour !== undefined && b.returnHour !== null ? b.returnHour : parseHourFromTimeStr(ret),
  };
}

export interface DayHourAvailability {
  availableHours: number[]; // e.g. [17, 18, 19, 20, 21, 22, 23]
  blockedHours: number[];   // e.g. [8, 9, 10, 11, 12, 13, 14, 15, 16]
  earliestPickupHour: number | null; // e.g. 17 (5:00 PM)
  earliestPickupTime: string | null; // e.g. "5:00 PM"
  isTurnoverDay: boolean;
  turnoverReturnTime?: string | null;
  freeCapacityAtHour: Record<number, number>;
}

// Operating hours for PackAndFilm Pasig Hub & Courier Dispatch (8:00 AM to 11:00 PM)
export const OPERATING_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

// Calculate hourly availability for a given camera on a specific date considering turnover buffer
export function getCameraHourAvailabilityOnDate(
  cameraId: string,
  dateStr: string,
  bookingsList: BookingRecord[] = []
): DayHourAvailability {
  const capacity = getCameraCapacity(cameraId);
  const cameraBookings = bookingsList.filter(b => b.cameraId === cameraId);

  // Active bookings overlapping this date
  const activeBookings = cameraBookings.filter(b => b.startDate <= dateStr && dateStr <= b.endDate);

  const freeCapacityAtHour: Record<number, number> = {};
  const availableHours: number[] = [];
  const blockedHours: number[] = [];

  let isTurnoverDay = false;
  let turnoverReturnTime: string | null = null;

  for (const h of OPERATING_HOURS) {
    let busyUnits = 0;

    for (const b of activeBookings) {
      const times = extractBookingTimes(b);
      const isStartDay = b.startDate === dateStr;
      const isEndDay = b.endDate === dateStr;
      const isMiddleDay = b.startDate < dateStr && dateStr < b.endDate;

      if (isMiddleDay) {
        // Entire day is blocked by active multi-day rental
        busyUnits++;
      } else if (isStartDay && isEndDay) {
        // Same-day booking
        const startH = times.pickupHour ?? 8;
        const returnH = times.returnHour ?? 20;
        const busyUntilH = returnH + TURNOVER_BUFFER_HOURS;
        if (startH <= h && h < busyUntilH) {
          busyUnits++;
        }
        if (returnH < 23) {
          isTurnoverDay = true;
          turnoverReturnTime = times.returnTime || formatHourToTimeStr(returnH);
        }
      } else if (isEndDay) {
        // Return day of multi-day booking: busy until return hour + 2h buffer
        const returnH = times.returnHour ?? 20;
        const busyUntilH = returnH + TURNOVER_BUFFER_HOURS;
        if (h < busyUntilH) {
          busyUnits++;
        }
        if (returnH < 23) {
          isTurnoverDay = true;
          turnoverReturnTime = times.returnTime || formatHourToTimeStr(returnH);
        }
      } else if (isStartDay) {
        // Start day of multi-day booking: busy from pickup hour onwards
        const startH = times.pickupHour ?? 8;
        if (h >= startH) {
          busyUnits++;
        }
      }
    }

    const freeCap = Math.max(0, capacity - busyUnits);
    freeCapacityAtHour[h] = freeCap;

    if (freeCap > 0) {
      availableHours.push(h);
    } else {
      blockedHours.push(h);
    }
  }

  const earliestPickupHour = availableHours.length > 0 ? availableHours[0] : null;
  const earliestPickupTime = earliestPickupHour !== null ? formatHourToTimeStr(earliestPickupHour) : null;

  return {
    availableHours,
    blockedHours,
    earliestPickupHour,
    earliestPickupTime,
    isTurnoverDay: isTurnoverDay && availableHours.length > 0 && availableHours.length < OPERATING_HOURS.length,
    turnoverReturnTime,
    freeCapacityAtHour
  };
}

export interface CameraConflictResult {
  hasConflict: boolean;
  conflictingBooking: BookingRecord | null;
  message: string;
  isTurnover?: boolean;
  isStartTurnover?: boolean;
  isEndTurnover?: boolean;
  turnoverNote?: string;
  pickupWindow?: string;
  returnWindow?: string;
  earliestPickupHour?: number | null;
  earliestPickupTime?: string | null;
}

// Check date and time collision specifically for the selected camera with 2-hour turnover buffer
export const checkCameraDateConflict = (
  cameraId: string,
  startStr: string,
  endStr: string,
  bookingsList: BookingRecord[] = INITIAL_BOOKINGS,
  requestedPickupTime?: string,
  requestedReturnTime?: string
): CameraConflictResult => {
  if (!startStr || !endStr || !cameraId) {
    return {
      hasConflict: false,
      conflictingBooking: null,
      message: '',
      pickupWindow: '8:00 AM – 11:00 PM (Flexible)',
      returnWindow: '8:00 AM – 11:00 PM (Flexible)'
    };
  }

  const cameraName = cameraId === 'canon-g7x-mark-iii'
    ? 'Canon PowerShot G7 X Mark III'
    : 'DJI Osmo Pocket 3';

  const reqPickupH = parseHourFromTimeStr(requestedPickupTime);
  const reqReturnH = parseHourFromTimeStr(requestedReturnTime);

  // Real-world time check: if booking for today, pickup time cannot be in the past
  let currentManilaDateStr = '';
  let currentManilaHour = -1;
  try {
    currentManilaDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      hour: 'numeric',
      hour12: false
    }).formatToParts(new Date());
    const hourPart = parts.find(p => p.type === 'hour');
    if (hourPart) currentManilaHour = parseInt(hourPart.value, 10);
  } catch {
    currentManilaDateStr = new Date().toISOString().split('T')[0];
    currentManilaHour = new Date().getHours();
  }

  if (startStr === currentManilaDateStr && reqPickupH !== null && reqPickupH <= currentManilaHour) {
    return {
      hasConflict: true,
      conflictingBooking: null,
      message: `The selected pickup time (${requestedPickupTime}) has already passed for today. Please choose an upcoming hour.`
    };
  }

  // 1. Check start date hourly availability
  const startDayHours = getCameraHourAvailabilityOnDate(cameraId, startStr, bookingsList);
  if (startDayHours.availableHours.length === 0) {
    return {
      hasConflict: true,
      conflictingBooking: null,
      message: `All units of ${cameraName} are fully booked on ${startStr}. Please choose a different date.`
    };
  }

  // If specific pickup time requested, check if that hour is available
  if (reqPickupH !== null && !startDayHours.availableHours.includes(reqPickupH)) {
    const earliestTime = startDayHours.earliestPickupTime || 'later in the day';
    return {
      hasConflict: true,
      conflictingBooking: null,
      message: `The selected pickup time (${requestedPickupTime}) is unavailable on ${startStr} due to a prior booking's 2-hour turnover buffer. Earliest available pickup is ${earliestTime}.`,
      isTurnover: true,
      turnoverNote: `Available from ${earliestTime}`,
      earliestPickupHour: startDayHours.earliestPickupHour,
      earliestPickupTime: startDayHours.earliestPickupTime
    };
  }

  // 2. Check middle dates (if multi-day rental)
  const [startY, startM, startD] = startStr.split('-').map(Number);
  const [endY, endM, endD] = endStr.split('-').map(Number);
  const startDate = new Date(startY, startM - 1, startD);
  const endDate = new Date(endY, endM - 1, endD);

  let curDate = new Date(startDate.getTime() + 86400000); // start + 1 day
  while (curDate < endDate) {
    const yStr = curDate.getFullYear();
    const mStr = String(curDate.getMonth() + 1).padStart(2, '0');
    const dStr = String(curDate.getDate()).padStart(2, '0');
    const curStr = `${yStr}-${mStr}-${dStr}`;

    const midHours = getCameraHourAvailabilityOnDate(cameraId, curStr, bookingsList);
    // Middle day must have full-day availability (all 16 operating hours open)
    if (midHours.availableHours.length < OPERATING_HOURS.length) {
      return {
        hasConflict: true,
        conflictingBooking: null,
        message: `${cameraName} is reserved for dates including ${curStr}. Please select a different rental window.`
      };
    }
    curDate.setDate(curDate.getDate() + 1);
  }

  // 3. Check end date
  if (startStr !== endStr) {
    const endDayHours = getCameraHourAvailabilityOnDate(cameraId, endStr, bookingsList);
    if (reqReturnH !== null && !endDayHours.availableHours.includes(reqReturnH)) {
      return {
        hasConflict: true,
        conflictingBooking: null,
        message: `The selected return time (${requestedReturnTime}) on ${endStr} conflicts with an incoming reservation. Please select an earlier return time.`,
        isTurnover: true
      };
    }
  }

  // 4. Check Same-Day return time > pickup time
  if (startStr === endStr && reqPickupH !== null && reqReturnH !== null) {
    if (reqReturnH <= reqPickupH) {
      return {
        hasConflict: true,
        conflictingBooking: null,
        message: 'On same-day rentals, the return time must be after your pickup time.'
      };
    }
  }

  const isTurnover = startDayHours.isTurnoverDay;
  const earliestStr = startDayHours.earliestPickupTime;

  return {
    hasConflict: false,
    conflictingBooking: null,
    isTurnover,
    isStartTurnover: isTurnover,
    turnoverNote: isTurnover && earliestStr ? `Free from ${earliestStr} (2h buffer)` : undefined,
    pickupWindow: isTurnover && earliestStr ? `${earliestStr} – 11:00 PM` : '8:00 AM – 11:00 PM (Flexible)',
    returnWindow: '8:00 AM – 11:00 PM (Flexible)',
    earliestPickupHour: startDayHours.earliestPickupHour,
    earliestPickupTime: earliestStr,
    message: ''
  };
};

// Programmatically calculate the next available conflict-free window for the camera
export const findNextFreeWindowForCamera = (
  cameraId: string,
  startFromStr: string,
  durationDays: number = 2,
  bookingsList: BookingRecord[] = INITIAL_BOOKINGS
): { start: string; end: string } => {
  const base = new Date(startFromStr || new Date().toISOString().split('T')[0]);
  for (let i = 0; i < 60; i++) {
    const sDate = new Date(base.getTime() + 86400000 * i);
    const eDate = new Date(sDate.getTime() + 86400000 * Math.max(1, durationDays));
    const s = sDate.toISOString().split('T')[0];
    const e = eDate.toISOString().split('T')[0];
    const conflict = checkCameraDateConflict(cameraId, s, e, bookingsList);
    if (!conflict.hasConflict && s >= new Date().toISOString().split('T')[0]) {
      return { start: s, end: e };
    }
  }
  return { start: startFromStr, end: startFromStr };
};

export type DayAvailabilityStatus = 'available' | 'booked' | 'turnover' | 'past';

export interface DayAvailabilityInfo {
  dateStr: string;
  dayName: string;
  dayNum: number;
  status: DayAvailabilityStatus;
  label: string;
  tooltip: string;
  conflictingBooking?: BookingRecord;
  isTurnover?: boolean;
  earliestPickupTime?: string | null;
}

export function getCameraDayAvailability(
  cameraId: string,
  dateStr: string,
  todayStr: string,
  bookingsList: BookingRecord[] = []
): DayAvailabilityInfo {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = dayNames[dateObj.getDay()];
  const dayNum = dateObj.getDate();

  if (dateStr < todayStr) {
    return {
      dateStr,
      dayName,
      dayNum,
      status: 'past',
      label: 'Past',
      tooltip: 'Past date'
    };
  }

  const capacity = getCameraCapacity(cameraId);
  const hourAvail = getCameraHourAvailabilityOnDate(cameraId, dateStr, bookingsList);

  if (hourAvail.availableHours.length === 0) {
    return {
      dateStr,
      dayName,
      dayNum,
      status: 'booked',
      label: 'Booked',
      tooltip: `Fully reserved on ${dateStr} (all units booked)`
    };
  }

  // Turnover day: previous customer returned, but open for evening rental after 2-hour buffer!
  if (hourAvail.isTurnoverDay && hourAvail.earliestPickupTime) {
    const timeShort = hourAvail.earliestPickupTime.replace(':00', '');
    return {
      dateStr,
      dayName,
      dayNum,
      status: 'available',
      label: `Avail ${timeShort}`,
      tooltip: `Same-day turnaround! Available from ${hourAvail.earliestPickupTime} (2h buffer after previous return)`,
      isTurnover: true,
      earliestPickupTime: hourAvail.earliestPickupTime
    };
  }

  const minCapacity = Math.min(...Object.values(hourAvail.freeCapacityAtHour));
  const isOneLeft = minCapacity === 1 && capacity > 1;

  return {
    dateStr,
    dayName,
    dayNum,
    status: 'available',
    label: isOneLeft ? '1 Left' : 'Available',
    tooltip: isOneLeft
      ? `1 unit remaining on ${dateStr}`
      : `Available for rental on ${dateStr}`
  };
}

export function getCameraNext7DaysAvailability(
  cameraId: string,
  todayStr: string,
  bookingsList: BookingRecord[] = []
): DayAvailabilityInfo[] {
  const result: DayAvailabilityInfo[] = [];
  const [y, m, d] = todayStr.split('-').map(Number);
  const baseDate = new Date(y, m - 1, d);

  for (let i = 0; i < 7; i++) {
    const curDate = new Date(baseDate.getTime() + i * 86400000);
    const yStr = curDate.getFullYear();
    const mStr = String(curDate.getMonth() + 1).padStart(2, '0');
    const dStr = String(curDate.getDate()).padStart(2, '0');
    const dateStr = `${yStr}-${mStr}-${dStr}`;
    result.push(getCameraDayAvailability(cameraId, dateStr, todayStr, bookingsList));
  }
  return result;
}
