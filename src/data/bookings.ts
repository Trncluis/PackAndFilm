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
}

// Check date collision specifically for the selected camera
export const checkCameraDateConflict = (
  cameraId: string,
  startStr: string,
  endStr: string,
  bookingsList: BookingRecord[] = INITIAL_BOOKINGS
): CameraConflictResult => {
  if (!startStr || !endStr || !cameraId) {
    return { hasConflict: false, conflictingBooking: null, message: '' };
  }

  // Filter bookings belonging to currently selected camera
  const cameraBookings = bookingsList.filter((b) => b.cameraId === cameraId);

  // Overlap condition: startStr <= b.endDate && b.startDate <= endStr
  for (const booked of cameraBookings) {
    if (startStr <= booked.endDate && booked.startDate <= endStr) {
      return {
        hasConflict: true,
        conflictingBooking: booked,
        message: `This camera unit is already reserved for these dates (${booked.startDate} to ${booked.endDate}). Please select a different rental window.`
      };
    }
  }

  return { hasConflict: false, conflictingBooking: null, message: '' };
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
