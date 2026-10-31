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
      pickupWindow: '8:00 AM – 12:00 AM (Flexible)',
      returnWindow: '8:00 AM – 12:00 AM (Flexible)'
    };
  }

  // Filter bookings belonging to currently selected camera
  const cameraBookings = bookingsList.filter((b) => b.cameraId === cameraId);

  let startTurnoverBooking: BookingRecord | null = null;
  let endTurnoverBooking: BookingRecord | null = null;

  for (const booked of cameraBookings) {
    const s1 = booked.startDate;
    const e1 = booked.endDate;
    const s2 = startStr;
    const e2 = endStr;

    // Disjoint: One booking completely ends before the other starts
    if (e1 < s2 || e2 < s1) {
      continue;
    }

    // Consecutive booking condition (Turnover on same date):
    // 1. Previous rental ends on the exact day this rental starts (e.g. Oct 31 -> Nov 1 and Nov 1 -> Nov 2)
    const isConsecutiveAfter = (e1 === s2 && s1 < e1 && s2 < e2);
    // 2. This rental ends on the exact day next rental starts (e.g. Oct 30 -> Oct 31 and Oct 31 -> Nov 1)
    const isConsecutiveBefore = (e2 === s1 && s2 < e2 && s1 < e1);

    if (isConsecutiveAfter) {
      startTurnoverBooking = booked;
      continue;
    }
    if (isConsecutiveBefore) {
      endTurnoverBooking = booked;
      continue;
    }

    // In all other cases where dates overlap, it is a genuine conflict
    return {
      hasConflict: true,
      conflictingBooking: booked,
      message: `This camera unit is already reserved for these dates (${booked.startDate} to ${booked.endDate}). Please select a different rental window.`
    };
  }

  const isStartTurnover = !!startTurnoverBooking;
  const isEndTurnover = !!endTurnoverBooking;
  const isTurnover = isStartTurnover || isEndTurnover;

  if (isTurnover) {
    let turnoverNote = '';
    if (isStartTurnover && isEndTurnover) {
      turnoverNote = `Scheduled transition: Pickup begins from 2:00 PM on ${startStr}, and return is scheduled by 12:00 PM on ${endStr}.`;
    } else if (isStartTurnover) {
      turnoverNote = `Scheduled transition: Pickup is available starting from 2:00 PM on ${startStr}.`;
    } else {
      turnoverNote = `Scheduled transition: Return is scheduled by 12:00 PM on ${endStr}.`;
    }

    return {
      hasConflict: false,
      conflictingBooking: startTurnoverBooking || endTurnoverBooking,
      isTurnover: true,
      isStartTurnover,
      isEndTurnover,
      turnoverNote,
      pickupWindow: isStartTurnover ? '2:00 PM – 12:00 AM (Afternoon Pickup)' : '8:00 AM – 12:00 AM (Flexible)',
      returnWindow: isEndTurnover ? '8:00 AM – 12:00 PM (Morning Return)' : '8:00 AM – 12:00 AM (Flexible)',
      message: ''
    };
  }

  return {
    hasConflict: false,
    conflictingBooking: null,
    isTurnover: false,
    isStartTurnover: false,
    isEndTurnover: false,
    pickupWindow: '8:00 AM – 12:00 AM (Flexible)',
    returnWindow: '8:00 AM – 12:00 AM (Flexible)',
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
