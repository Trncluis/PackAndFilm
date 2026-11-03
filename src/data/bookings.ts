export interface BookingRecord {
  id: string;
  cameraId: string;
  title: string;
  renterTag: string;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;   // 'YYYY-MM-DD'
  hub: string;
  status: 'Confirmed' | 'Deposit Paid';
}

// Initial bookings starts 100% empty; availability is strictly populated by confirmed customer bookings
export const INITIAL_BOOKINGS: BookingRecord[] = [];

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
}

// Check date collision specifically for the selected camera
export const checkCameraDateConflict = (
  cameraId: string,
  startStr: string,
  endStr: string,
  bookingsList: BookingRecord[] = INITIAL_BOOKINGS
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

  // Filter bookings belonging to currently selected camera
  const cameraBookings = bookingsList.filter((b) => b.cameraId === cameraId);

  for (const booked of cameraBookings) {
    const s1 = booked.startDate;
    const e1 = booked.endDate;
    const s2 = startStr;
    const e2 = endStr;

    // Disjoint: One booking completely ends before the other starts
    if (e1 < s2 || e2 < s1) {
      continue;
    }

    // Any overlapping date is a genuine conflict (full day reserved)
    return {
      hasConflict: true,
      conflictingBooking: booked,
      message: `This camera unit is already reserved for these dates (${booked.startDate} to ${booked.endDate}). Please select a different rental window.`
    };
  }

  return {
    hasConflict: false,
    conflictingBooking: null,
    isTurnover: false,
    isStartTurnover: false,
    isEndTurnover: false,
    pickupWindow: '8:00 AM – 11:00 PM (Flexible)',
    returnWindow: '8:00 AM – 11:00 PM (Flexible)',
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

  const cameraBookings = bookingsList.filter(b => b.cameraId === cameraId);

  // If this date is within ANY booking for this camera (startDate <= dateStr <= endDate), it is reserved
  const reservedBooking = cameraBookings.find(b => b.startDate <= dateStr && dateStr <= b.endDate);
  if (reservedBooking) {
    return {
      dateStr,
      dayName,
      dayNum,
      status: 'booked',
      label: 'Booked',
      tooltip: reservedBooking.startDate === reservedBooking.endDate
        ? `Reserved for Same-Day rental on ${dateStr}`
        : `Reserved from ${reservedBooking.startDate} to ${reservedBooking.endDate}`,
      conflictingBooking: reservedBooking
    };
  }

  // Otherwise fully available
  return {
    dateStr,
    dayName,
    dayNum,
    status: 'available',
    label: 'Available',
    tooltip: `Available for rental on ${dateStr}`
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
