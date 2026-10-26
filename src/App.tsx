/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Camera,
  Calendar,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Truck,
  MapPin,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  X,
  Upload,
  Copy,
  ExternalLink,
  HelpCircle,
  ArrowRight,
  Zap,
  Check,
  MessageCircle,
  FileText,
  ShoppingBag,
  Menu,
  AlertCircle,
  CalendarX,
  CalendarCheck,
  CheckCheck,
  FileCheck,
  Video,
  GraduationCap,
  Loader2,
  Clock
} from 'lucide-react';

import { CAMERAS, CameraItem } from './data/cameras';
import {
  INITIAL_BOOKINGS,
  BookingRecord,
  checkCameraDateConflict,
  findNextFreeWindowForCamera
} from './data/bookings';
import {
  PASIG_MEETUP_HUBS,
  FIVE_STEP_REQUIREMENTS,
  STUDENT_EXEMPTION_NOTICE
} from './data/requirements';
import {
  RENTAL_CONFIG,
  HOW_TO_BOOK_STEPS,
  TERMS_AND_CONDITIONS_DATA,
  TERMS_ACKNOWLEDGEMENT_TEXT
} from './data/rentalConfig';

import { CustomDatePicker } from './components/CustomDatePicker';
import { CustomSelect } from './components/CustomSelect';
import { AdminDashboard } from './components/AdminDashboard';

const DOWNPAYMENT_FEE = RENTAL_CONFIG.reservationFee;

// Google Apps Script Webhook URL for Live Google Sheets Integration
const APPS_SCRIPT_URL: string = "https://script.google.com/macros/s/AKfycbziRdlYg7VekgaVnhThEhXb_I1XScjYc8pSomjXM1wG_iMqYiIfR8PG3IUWE6YPhAkx/exec";

interface BookingState {
  cameraId: string;
  startDate: string;
  endDate: string;
  handoverMode: 'meetup' | 'courier';
  meetupLocation: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  gcashAccountName: string;
  gcashAccountNumber: string;
  deliveryAddress: string;
  socialHandle: string;
  shootType: string;
  id1Type: string;
  id1File: string | null;
  id1Name: string;
  id1BackFile: string | null;
  id1BackName: string;
  id2Type: string;
  id2File: string | null;
  id2Name: string;
  id2BackFile: string | null;
  id2BackName: string;
  authorizationSlipFile: string | null;
  selfieWithIdsFile: string | null;
  deliveryReceiptsFile: string | null;
  isBillUnderOtherName: boolean;
  billOwnerIdFile: string | null;
  billOwnerIdName: string;
  emergencyContact1Name: string;
  emergencyContact1Phone: string;
  emergencyContact1Rel: string;
  contact1IdFile: string | null;
  contact1IdName: string;
  emergencyContact1Social: string;
  emergencyContact2Name: string;
  emergencyContact2Phone: string;
  emergencyContact2Rel: string;
  contact2IdFile: string | null;
  contact2IdName: string;
  emergencyContact2Social: string;
  selfieVideoConfirmed: boolean;
  isStudentExemption: boolean;
  studentCORFile: string | null;
  selfieFile: string | null;
  gcashRefNumber: string;
  receiptFile: string | null;
  termsAccepted: boolean;
  termsVersion: string;
  termsAcceptedAt?: string;
  bookingRef: string;
  driveFolderUrl?: string | null;
}

export default function App() {
  // Admin View State: Strictly Option B (Accessible exclusively via typing "/#admin" or "/admin" in the browser URL)
  const checkIsAdminRoute = (): boolean => {
    if (typeof window === 'undefined') return false;
    const rawHash = decodeURIComponent(window.location.hash || '').trim().toLowerCase();
    const rawPath = decodeURIComponent(window.location.pathname || '').trim().toLowerCase();
    return (
      rawHash === '#admin' ||
      rawHash === '#/admin' ||
      rawHash.startsWith('#admin') ||
      rawPath === '/admin' ||
      rawPath === '/admin/' ||
      rawPath === '/#admin'
    );
  };

  const [isAdminView, setIsAdminView] = useState<boolean>(() => checkIsAdminRoute());

  // Listen to browser navigation changes
  useEffect(() => {
    const handleLocationChange = () => {
      setIsAdminView(checkIsAdminRoute());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Mobile Nav Drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Selected Camera State (Defaults to DJI Osmo Pocket 3)
  const [selectedCameraId, setSelectedCameraId] = useState<string>('dji-pocket-3');
  const selectedCamera = CAMERAS.find(c => c.id === selectedCameraId && c.isAvailable) || CAMERAS.find(c => c.isAvailable) || CAMERAS[0];

  // Pricing Calculator State
  const todayStr = new Date().toISOString().split('T')[0];
  const nextDay = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];

  const [calcStartDate, setCalcStartDate] = useState(todayStr);
  const [calcEndDate, setCalcEndDate] = useState(nextDay);
  const [calcHandover, setCalcHandover] = useState<'meetup' | 'courier'>('meetup');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('open_modal') === 'true' || !!p.get('step');
    }
    return false;
  });
  const [modalStep, setModalStep] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const stepParam = p.get('step');
      if (stepParam) return parseInt(stepParam, 10);
    }
    return 1;
  });
  const [copiedGcash, setCopiedGcash] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [previewBagItem, setPreviewBagItem] = useState<number | null>(null);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Terms and Conditions State
  const [openTermsClause, setOpenTermsClause] = useState<number | null>(null);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);

  // Form State for Booking
  const [booking, setBooking] = useState<BookingState>(() => {
    const hasMockFiles = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mock_files') === 'true';
    return {
      cameraId: 'dji-pocket-3',
      startDate: todayStr,
      endDate: nextDay,
      handoverMode: 'meetup',
      meetupLocation: PASIG_MEETUP_HUBS[0],
      fullName: '',
      mobileNumber: '',
      email: '',
      gcashAccountName: '',
      gcashAccountNumber: '',
      deliveryAddress: '',
      socialHandle: '',
      shootType: 'Travel / Vacation Vlogging',
      id1Type: 'Philippine Passport',
      id1File: hasMockFiles ? 'data:image/png;base64,mock_id1' : null,
      id1Name: hasMockFiles ? 'mock_passport.jpg' : '',
      id1BackFile: hasMockFiles ? 'data:image/png;base64,mock_id1back' : null,
      id1BackName: hasMockFiles ? 'mock_passport_back.jpg' : '',
      id2Type: 'Company ID / Secondary Gov ID',
      id2File: hasMockFiles ? 'data:image/png;base64,mock_id2' : null,
      id2Name: hasMockFiles ? 'mock_secondary_id.jpg' : '',
      id2BackFile: hasMockFiles ? 'data:image/png;base64,mock_id2back' : null,
      id2BackName: hasMockFiles ? 'mock_secondary_back.jpg' : '',
      authorizationSlipFile: hasMockFiles ? 'data:image/png;base64,mock_auth' : null,
      selfieWithIdsFile: hasMockFiles ? 'data:image/png;base64,mock_selfie' : null,
      deliveryReceiptsFile: hasMockFiles ? 'data:image/png;base64,mock_receipt' : null,
      isBillUnderOtherName: false,
      billOwnerIdFile: null,
      billOwnerIdName: '',
      emergencyContact1Name: '',
      emergencyContact1Phone: '',
      emergencyContact1Rel: 'Family Member',
      contact1IdFile: hasMockFiles ? 'data:image/png;base64,mock_contact1_id' : null,
      contact1IdName: hasMockFiles ? 'parent_guardian_gov_id.jpg' : '',
      emergencyContact1Social: '',
      emergencyContact2Name: '',
      emergencyContact2Phone: '',
      emergencyContact2Rel: 'Friend / Colleague',
      contact2IdFile: null,
      contact2IdName: '',
      emergencyContact2Social: '',
      selfieVideoConfirmed: hasMockFiles,
      isStudentExemption: false,
      studentCORFile: null,
      selfieFile: hasMockFiles ? 'data:video/mp4;base64,mock_video' : null,
      gcashRefNumber: hasMockFiles ? '1234567890123' : '',
      receiptFile: hasMockFiles ? 'data:image/png;base64,mock_receipt_payment' : null,
      termsAccepted: false,
      termsVersion: RENTAL_CONFIG.termsVersion,
      termsAcceptedAt: '',
      bookingRef: '',
      driveFolderUrl: null,
    };
  });

  const modalCamera = useMemo(
    () => CAMERAS.find(c => c.id === booking.cameraId && c.isAvailable) || selectedCamera,
    [booking.cameraId, selectedCamera]
  );

  // Calculate Duration and Price Helper dynamically reading from target camera & duration tiers
  const calculateQuote = useCallback((start: string, end: string, mode: 'meetup' | 'courier', camera: CameraItem = selectedCamera) => {
    // Helper to get daily rate and tier label based on duration from the camera's own configuration
    const getDailyRateInfo = (d: number) => {
      if (camera.pricingTiers && camera.pricingTiers.length > 0) {
        const matched = camera.pricingTiers.find(t => d >= t.minDays && d <= t.maxDays);
        if (matched) {
          const isBulk = matched.rate < camera.standardRate;
          return { rate: matched.rate, isBulk, tierLabel: `${matched.label} (${matched.sublabel || `₱${matched.rate}/day`})` };
        }
      }

      // Fallback for future cameras without specific tiers
      const isBulk = d >= 3;
      const rate = isBulk ? camera.bulkRate : camera.standardRate;
      return { rate, isBulk, tierLabel: isBulk ? 'Bulk Rate' : 'Standard Rate' };
    };

    let days = 1;
    if (start && end) {
      const d1 = new Date(start);
      const d2 = new Date(end);
      const diffTime = d2.getTime() - d1.getTime();
      days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (days <= 0 || isNaN(days)) days = 1;
    }

    const rateInfo = getDailyRateInfo(days);
    const rentalTotal = days * rateInfo.rate;
    // Uniform, per-camera configured deposit (strictly ₱1,000 for active units)
    const deposit = camera.depositAmount || camera.meetupDeposit || RENTAL_CONFIG.securityDeposit;

    // Meetup handling fee: ₱200 for meet-up transactions; ₱0 for Grab Express (renter pays rider directly)
    const meetupHandlingFee = mode === 'meetup' ? RENTAL_CONFIG.meetupHandlingFee : 0;
    const downpayment = DOWNPAYMENT_FEE; // ₱300 non-refundable reservation fee credited to rental
    const remainingRentalBalance = Math.max(0, rentalTotal - downpayment);
    const paymentOnHandover = remainingRentalBalance + deposit + meetupHandlingFee;
    const totalPackageValue = rentalTotal + deposit + meetupHandlingFee;
    const refundAfterReturn = deposit;
    const balanceDue = paymentOnHandover;

    return {
      days,
      rate: rateInfo.rate,
      tierLabel: rateInfo.tierLabel,
      rentalTotal,
      baseRental: rentalTotal,
      deposit,
      isDepositConfirmed: true,
      depositNote: null,
      meetupFee: meetupHandlingFee,
      meetupHandlingFee,
      total: totalPackageValue,
      totalPackageValue,
      downpayment,
      remainingRentalBalance,
      paymentOnHandover,
      refundAfterReturn,
      balanceDue,
      isBulk: rateInfo.isBulk
    };
  }, [selectedCamera]);

  const currentQuote = useMemo(
    () => calculateQuote(calcStartDate, calcEndDate, calcHandover, selectedCamera),
    [calculateQuote, calcStartDate, calcEndDate, calcHandover, selectedCamera]
  );
  const modalQuote = useMemo(
    () => calculateQuote(booking.startDate, booking.endDate, booking.handoverMode, modalCamera),
    [calculateQuote, booking.startDate, booking.endDate, booking.handoverMode, modalCamera]
  );

  // Google Sheets Sync and Loading States
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [sheetSyncError, setSheetSyncError] = useState<string | null>(null);
  const [sheetLastSynced, setSheetLastSynced] = useState<Date | null>(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingSubmitError, setBookingSubmitError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 5000);
  };

  // Helper to normalize various date formats returned by Google Sheets
  const normalizeDateStr = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
        return trimmed.substring(0, 10);
      }
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
      return trimmed;
    }
    if (val instanceof Date && !isNaN(val.getTime())) {
      return val.toISOString().split('T')[0];
    }
    return '';
  };

  // Map Google Sheet row objects to internal BookingRecord structure
  const mapSheetRowToBooking = (row: any, index: number): BookingRecord | null => {
    if (!row || typeof row !== 'object') return null;

    const startRaw = row.startDate || row['Start Date'] || row.start || row['start_date'];
    const endRaw = row.endDate || row['End Date'] || row.end || row['end_date'];

    const startDate = normalizeDateStr(startRaw);
    const endDate = normalizeDateStr(endRaw);

    if (!startDate || !endDate) return null;

    const camRaw = String(
      row.cameraId || row['Camera ID'] || row.cameraRented || row['Camera Rented'] || row.camera || ''
    ).trim().toLowerCase();

    let matchedCameraId = 'dji-pocket-3';
    if (camRaw.includes('canon') || camRaw.includes('g7x') || camRaw.includes('g7 x') || camRaw.includes('powershot')) {
      matchedCameraId = 'canon-g7x-mark-iii';
    } else if (camRaw.includes('fuji') || camRaw.includes('x100')) {
      matchedCameraId = 'fujifilm-x100vi';
    } else if (camRaw.includes('pocket') || camRaw.includes('dji')) {
      matchedCameraId = 'dji-pocket-3';
    } else {
      const found = CAMERAS.find(c =>
        c.id.toLowerCase() === camRaw ||
        c.name.toLowerCase().includes(camRaw) ||
        c.shortName.toLowerCase().includes(camRaw)
      );
      if (found) matchedCameraId = found.id;
    }

    const id = String(row.bookingRef || row['Booking Ref'] || row.id || `sheet-${index + 1}`);
    const customer = String(row.customerName || row['Customer Name'] || row.customerTag || row.renterTag || row.title || 'Reserved Slot');
    const social = String(
      row.socialMediaHandle || row['Social Media Handle'] || row.customerTag || row.renterTag ||
      (row.customerName ? `@${String(row.customerName).toLowerCase().replace(/[^a-z0-9_.]/g, '')}` : '@renter')
    );
    const hub = String(row.handoverMethod || row['Handover Method'] || row.address || row.hub || 'Metro Manila');
    const status = (String(row.status || '').toLowerCase().includes('deposit') ? 'Deposit Paid' : 'Confirmed') as 'Confirmed' | 'Deposit Paid';

    return {
      id,
      cameraId: matchedCameraId,
      title: `${customer} • Camera Rental`,
      renterTag: social,
      startDate,
      endDate,
      hub,
      status
    };
  };

  // Dynamic Bookings State (loaded from storage if user made reservations, otherwise starts with default sample bookings)
  const [bookings, setBookings] = useState<BookingRecord[]>(() => {
    try {
      localStorage.removeItem('packandfilm_active_bookings');
      const saved = localStorage.getItem('packandfilm_bookings_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_BOOKINGS; // default fallback
  });

  // Sync bookings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('packandfilm_bookings_v2', JSON.stringify(bookings));
    } catch {
      // fallback
    }
  }, [bookings]);

  // ── Hero Carousel Live Availability & Smart Priority Logic ──
  const heroCameraAvailability = useMemo(() => {
    const checkStatus = (camId: string) => {
      const conflict = checkCameraDateConflict(camId, todayStr, todayStr, bookings);
      if (!conflict.hasConflict) {
        return { isAvailableToday: true, label: 'Available Today', nextFree: null };
      }
      const nextWindow = findNextFreeWindowForCamera(camId, todayStr, 1, bookings);
      let formattedNext = nextWindow.start;
      try {
        const [y, m, d] = nextWindow.start.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        formattedNext = `${monthNames[dateObj.getMonth()]} ${dateObj.getDate()}`;
      } catch {
        // fallback
      }
      return {
        isAvailableToday: false,
        label: 'Booked Today',
        nextFree: formattedNext,
      };
    };

    return {
      'dji-pocket-3': checkStatus('dji-pocket-3'),
      'canon-g7x-mark-iii': checkStatus('canon-g7x-mark-iii'),
    };
  }, [todayStr, bookings]);

  // Priority initial slide: if DJI is booked today and Canon is free today, default to Canon!
  const [heroSlideId, setHeroSlideId] = useState<'dji-pocket-3' | 'canon-g7x-mark-iii'>(() => {
    const djiConflict = checkCameraDateConflict('dji-pocket-3', todayStr, todayStr, bookings);
    const canonConflict = checkCameraDateConflict('canon-g7x-mark-iii', todayStr, todayStr, bookings);
    if (djiConflict.hasConflict && !canonConflict.hasConflict) {
      return 'canon-g7x-mark-iii';
    }
    return 'dji-pocket-3';
  });

  const [isHeroHovered, setIsHeroHovered] = useState(false);

  // Auto-rotate hero slide every 5.5s unless hovered
  useEffect(() => {
    if (isHeroHovered) return;
    const interval = setInterval(() => {
      setHeroSlideId(prev => (prev === 'dji-pocket-3' ? 'canon-g7x-mark-iii' : 'dji-pocket-3'));
    }, 5500);
    return () => clearInterval(interval);
  }, [isHeroHovered]);

  const HERO_SLIDES_CONFIG = {
    'dji-pocket-3': {
      id: 'dji-pocket-3',
      name: 'DJI Osmo Pocket 3',
      shortName: 'DJI Pocket 3',
      bundleTag: 'CREATOR COMBO',
      rate: 450,
      bulkRateText: 'As low as ₱350/d on 6+ days',
      image: '/dji-pocket-3-hero.png',
      alt: 'DJI Osmo Pocket 3 Standard Kit',
      hasLed: true,
      chips: [
        { text: '4K 60fps / 120fps', position: '-top-4 -left-4', bg: 'bg-[#F5C6A8]', rotate: 'rotate-[-5deg]', anim: 'animate-float-subtle' },
        { text: '128GB MicroSD Included', position: 'top-1/2 -right-4', bg: 'bg-[#A8DBC8]', rotate: 'rotate-[6deg]', anim: 'animate-float-gentle' },
        { text: 'Ultra Compact Gimbal', position: '-bottom-4 left-6', bg: 'bg-[#C9B8F0]', rotate: 'rotate-[-3deg]', anim: '' },
      ],
    },
    'canon-g7x-mark-iii': {
      id: 'canon-g7x-mark-iii',
      name: 'Canon PowerShot G7 X Mark III',
      shortName: 'Canon G7 X',
      bundleTag: 'VLOGGER BUNDLE',
      rate: 500,
      bulkRateText: 'As low as ₱400/d on 6+ days',
      image: '/canon-g7x-hero.png',
      alt: 'Canon PowerShot G7 X Mark III Creator Kit',
      hasLed: false,
      chips: [
        { text: '20.1MP 1.0" Sensor', position: '-top-4 -left-4', bg: 'bg-[#F5C6A8]', rotate: 'rotate-[-5deg]', anim: 'animate-float-subtle' },
        { text: '180° Flip Screen', position: 'top-1/2 -right-4', bg: 'bg-[#FFE8A3]', rotate: 'rotate-[6deg]', anim: 'animate-float-gentle' },
        { text: '4.2x Optical Zoom', position: '-bottom-4 left-6', bg: 'bg-[#C9B8F0]', rotate: 'rotate-[-3deg]', anim: '' },
      ],
    },
  };
  const activeHeroSlide = HERO_SLIDES_CONFIG[heroSlideId];
  const activeHeroAvailability = heroCameraAvailability[heroSlideId];

  // Live Calendar Sync from Google Sheets Webhook
  const fetchLiveCalendarFromSheet = async (isManualRefresh: boolean = false) => {
    const targetUrl = (APPS_SCRIPT_URL && APPS_SCRIPT_URL !== 'YOUR_DEPLOYED_WEB_APP_URL_HERE')
      ? APPS_SCRIPT_URL
      : (import.meta.env?.VITE_APPS_SCRIPT_URL as string) || '';

    if (!targetUrl) {
      if (isManualRefresh) {
        showToast('Please set APPS_SCRIPT_URL at the top of App.tsx to sync live with Google Sheets.', 'info');
      }
      return;
    }

    setIsSyncingSheet(true);
    setSheetSyncError(null);

    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error(`Google Sheets responded with HTTP status ${response.status}`);
      }

      const data = await response.json();
      const rawRecords: any[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.bookings)
          ? data.bookings
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.records)
              ? data.records
              : [];

      const parsed = rawRecords
        .map((r, i) => mapSheetRowToBooking(r, i))
        .filter((b): b is BookingRecord => b !== null);

      if (parsed.length > 0) {
        setBookings(parsed);
        setSheetLastSynced(new Date());
        if (isManualRefresh) {
          showToast(`Synced ${parsed.length} live bookings from Google Sheets!`, 'success');
        }
      } else {
        setBookings([]);
        setSheetLastSynced(new Date());
        if (isManualRefresh) {
          showToast('Connected to Google Sheets: All dates are currently open.', 'info');
        }
      }
    } catch (err: any) {
      console.warn('Failed to sync live calendar from Google Sheets, using fallback:', err);
      setSheetSyncError(err?.message || 'Connection failed');
      // Fall back to default sample bookings if network request fails
      setBookings(prev => (prev.length > 0 ? prev : INITIAL_BOOKINGS));
      if (isManualRefresh) {
        showToast('Failed to connect to Google Sheets. Using backup calendar.', 'error');
      }
    } finally {
      setIsSyncingSheet(false);
    }
  };

  // Perform a fetch GET request to APPS_SCRIPT_URL on initial page mount
  useEffect(() => {
    fetchLiveCalendarFromSheet(false);
  }, []);

  // Date Conflict State specifically scoped to selected camera and actual bookings
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleFilterCameraId, setScheduleFilterCameraId] = useState<string>('all');
  const calcConflict = useMemo(
    () => checkCameraDateConflict(selectedCameraId, calcStartDate, calcEndDate, bookings),
    [selectedCameraId, calcStartDate, calcEndDate, bookings]
  );
  const modalConflict = useMemo(
    () => checkCameraDateConflict(booking.cameraId, booking.startDate, booking.endDate, bookings),
    [booking.cameraId, booking.startDate, booking.endDate, bookings]
  );

  // Jump to next available window for Calculator
  const handleAutoPickNextAvailable = () => {
    const nextSlot = findNextFreeWindowForCamera(selectedCameraId, calcStartDate, currentQuote.days, bookings);
    setCalcStartDate(nextSlot.start);
    setCalcEndDate(nextSlot.end);
  };

  // Jump to next available window for Modal
  const handleModalAutoPickNextAvailable = () => {
    const nextSlot = findNextFreeWindowForCamera(booking.cameraId, booking.startDate, modalQuote.days, bookings);
    setBooking(prev => ({
      ...prev,
      startDate: nextSlot.start,
      endDate: nextSlot.end,
    }));
  };

  // Form Step Validation State & Auto-Scroll
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [stepAttempted, setStepAttempted] = useState<Record<number, boolean>>({});
  const modalBodyRef = useRef<HTMLDivElement>(null);

  const clearFieldError = (fieldName: string) => {
    setValidationErrors(prev => {
      if (!prev[fieldName]) return prev;
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  const scrollToField = (fieldKey: string) => {
    setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`[data-field-key="${fieldKey}"]`) || document.getElementById(`field-${fieldKey}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
          el.focus({ preventScroll: true });
        } else {
          const input = el.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
            'input:not([type="hidden"]):not([type="file"]), textarea, select'
          );
          if (input) {
            input.focus({ preventScroll: true });
          } else {
            const focusable = el.querySelector<HTMLElement>('button, label, input[type="file"], input[type="checkbox"]');
            if (focusable) {
              focusable.focus({ preventScroll: true });
            }
          }
        }
      }
    }, 60);
  };

  const validateStep = (stepNumber: number): boolean => {
    setStepAttempted(prev => ({ ...prev, [stepNumber]: true }));
    const errors: Record<string, string> = {};

    const stepFieldOrder: Record<number, string[]> = {
      1: ['cameraId', 'startDate', 'endDate', 'dateConflict'],
      2: booking.handoverMode === 'meetup' ? ['meetupLocation'] : ['deliveryAddress'],
      3: [
        'id1File',
        'id1BackFile',
        'id2File',
        ...(booking.isStudentExemption ? [] : ['id2BackFile']),
        'authorizationSlipFile',
        'selfieWithIdsFile',
        'deliveryReceiptsFile',
        ...(booking.isBillUnderOtherName ? ['billOwnerIdFile'] : []),
        'selfieVideoConfirmed',
        'selfieFile',
      ],
      4: [
        'fullName',
        'mobileNumber',
        'email',
        'shootType',
        'socialHandle',
        'emergencyContact1Name',
        'emergencyContact1Phone',
        'emergencyContact1Social',
        ...(booking.isStudentExemption ? ['contact1IdFile'] : []),
        'emergencyContact2Name',
        'emergencyContact2Phone',
        'gcashAccountName',
        'gcashAccountNumber',
      ],
      5: ['gcashRefNumber', 'receiptFile', 'termsAccepted'],
    };

    if (stepNumber === 1) {
      const chosenCam = CAMERAS.find(c => c.id === booking.cameraId);
      if (!chosenCam || !chosenCam.isAvailable) {
        errors.cameraId = 'The selected camera is coming soon and cannot be booked yet. Please select an available camera (DJI Osmo Pocket 3 or Canon PowerShot G7 X Mark III).';
      }
      if (!booking.startDate) {
        errors.startDate = 'Please select a pickup/start date.';
      }
      if (!booking.endDate) {
        errors.endDate = 'Please select a return/end date.';
      }
      if (booking.startDate && booking.endDate && booking.startDate > booking.endDate) {
        errors.endDate = 'End date cannot be earlier than start date.';
      }
      if (modalConflict.hasConflict) {
        errors.dateConflict = modalConflict.message || 'The selected dates conflict with an active booking.';
      }
    } else if (stepNumber === 2) {
      if (booking.handoverMode === 'meetup') {
        if (!booking.meetupLocation || !booking.meetupLocation.trim()) {
          errors.meetupLocation = 'Please select your preferred meetup station (SM East Ortigas, Bridgetowne, or Opus Mall).';
        }
      } else if (booking.handoverMode === 'courier') {
        if (!booking.deliveryAddress || booking.deliveryAddress.trim().length < 8) {
          errors.deliveryAddress = 'Please enter a complete delivery address for Grab Express (min. 8 characters).';
        }
      }
    } else if (stepNumber === 3) {
      // 1. Personal Identification
      if (!booking.id1File) {
        errors.id1File = 'Primary Valid ID (Front) upload is required.';
      }
      if (!booking.id1BackFile) {
        errors.id1BackFile = 'Primary Valid ID (Back) upload is required.';
      }

      if (booking.isStudentExemption) {
        if (!booking.id2File) {
          errors.id2File = 'Student ID and Current Certificate of Registration (COR) upload is required.';
        }
      } else {
        if (!booking.id2File) {
          errors.id2File = 'Secondary Valid ID (Front) upload is required.';
        }
        if (!booking.id2BackFile) {
          errors.id2BackFile = 'Secondary Valid ID (Back) upload is required.';
        }
      }

      // Authorization Slip
      if (!booking.authorizationSlipFile) {
        errors.authorizationSlipFile = 'Handwritten authorization slip photo with IDs (date, 3 specimen signatures & "For Pack and Film Camera Rental purposes only") is required.';
      }

      // Selfie holding IDs and slip
      if (!booking.selfieWithIdsFile) {
        errors.selfieWithIdsFile = 'Selfie photo holding your 2 valid IDs and handwritten authorization slip is required.';
      }

      // 2. Proof of Billing / Delivery Receipts
      if (!booking.deliveryReceiptsFile) {
        errors.deliveryReceiptsFile = 'Proof of billing or 2 online delivery receipts (Shopee/Lazada/TikTok) showing your name and address is required.';
      }
      if (booking.isBillUnderOtherName && !booking.billOwnerIdFile) {
        errors.billOwnerIdFile = 'Valid government ID of the person named on the bill is required for verification.';
      }

      // 3. Selfie Video Verification
      if (!booking.selfieVideoConfirmed) {
        errors.selfieVideoConfirmed = 'You must confirm the selfie video statement requirement.';
      }
      if (!booking.selfieFile) {
        errors.selfieFile = 'Selfie video holding your 2 valid IDs stating rental details is required.';
      }
    } else if (stepNumber === 4) {
      if (!booking.fullName || booking.fullName.trim().length < 3) {
        errors.fullName = 'Full legal name (as printed on your primary ID) is required.';
      }
      const phoneDigits = (booking.mobileNumber || '').replace(/\D/g, '');
      if (!phoneDigits || phoneDigits.length < 10) {
        errors.mobileNumber = 'Please provide a valid 11-digit mobile number (e.g. 0917-XXX-XXXX).';
      }
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!booking.email || !emailPattern.test(booking.email.trim())) {
        errors.email = 'Please provide a valid email address.';
      }
      if (!booking.shootType || !booking.shootType.trim()) {
        errors.shootType = 'Please select your shoot or event purpose.';
      }
      if (!booking.socialHandle || booking.socialHandle.trim().length < 2) {
        errors.socialHandle = 'Please provide your main personal active Facebook or Instagram account.';
      }

      // Emergency Contact 1: Primary family member, relative, or guardian reference
      if (!booking.emergencyContact1Name || !booking.emergencyContact1Name.trim()) {
        errors.emergencyContact1Name = booking.isStudentExemption
          ? 'Parent or Legal Guardian full legal name is required for Student Exemption.'
          : 'Emergency Contact 1 (Family Member / Guardian) full legal name is required.';
      }
      const c1PhoneDigits = (booking.emergencyContact1Phone || '').replace(/\D/g, '');
      if (!c1PhoneDigits || c1PhoneDigits.length < 10) {
        errors.emergencyContact1Phone = 'Emergency Contact 1 active contact number is required.';
      }
      if (!booking.emergencyContact1Social || !booking.emergencyContact1Social.trim()) {
        errors.emergencyContact1Social = 'FB/IG profile link or handle for Emergency Contact 1 is required.';
      }

      // Parent/Guardian Government ID Upload: Required ONLY when Student Exemption applies
      if (booking.isStudentExemption && !booking.contact1IdFile) {
        errors.contact1IdFile = 'Parent / Guardian Valid Government ID upload is required for Student Exemption.';
      }

      // Emergency Contact 2: Friend, colleague, or travel companion (No ID upload required)
      if (!booking.emergencyContact2Name || !booking.emergencyContact2Name.trim()) {
        errors.emergencyContact2Name = 'Emergency Contact 2 full legal name is required.';
      }
      const c2PhoneDigits = (booking.emergencyContact2Phone || '').replace(/\D/g, '');
      if (!c2PhoneDigits || c2PhoneDigits.length < 10) {
        errors.emergencyContact2Phone = 'Emergency Contact 2 active contact number is required.';
      }

      // Security Deposit Refund GCash
      if (!booking.gcashAccountName || booking.gcashAccountName.trim().length < 2) {
        errors.gcashAccountName = 'GCash Account Name is required for your deposit refund.';
      }
      const gcashDigits = (booking.gcashAccountNumber || '').replace(/\D/g, '');
      if (!gcashDigits || gcashDigits.length < 10) {
        errors.gcashAccountNumber = 'Valid GCash Mobile Number is required for your deposit refund.';
      }
    } else if (stepNumber === 5) {
      const cleanRef = (booking.gcashRefNumber || '').replace(/\s+/g, '');
      if (!cleanRef || cleanRef.length < 9) {
        errors.gcashRefNumber = 'Please enter your valid GCash reference number (typically 13 digits).';
      }
      if (!booking.receiptFile) {
        errors.receiptFile = 'GCash payment receipt upload is required to complete your booking.';
      }
      if (!booking.termsAccepted) {
        errors.termsAccepted = 'You must actively review and agree to the Terms and Conditions before submitting payment.';
      }
    }

    setValidationErrors(errors);

    const hasErrors = Object.keys(errors).length > 0;
    if (hasErrors) {
      const fieldOrder = stepFieldOrder[stepNumber] || [];
      const firstField = fieldOrder.find(k => errors[k]) || Object.keys(errors)[0];
      if (firstField) {
        scrollToField(firstField);
      }
      const firstErrorMsg = errors[firstField] || Object.values(errors)[0];
      showToast(firstErrorMsg, 'error');
      return false;
    }

    return true;
  };

  // Quick Preset Handlers
  const handleSetPreset = (daysCount: number) => {
    const start = new Date();
    const end = new Date(start.getTime() + 86400000 * daysCount);
    const sStr = start.toISOString().split('T')[0];
    const eStr = end.toISOString().split('T')[0];
    setCalcStartDate(sStr);
    setCalcEndDate(eStr);
  };

  // Open Modal with prefilled calculator dates (blocking if conflict)
  const handleOpenBookingModal = (targetCameraId?: string) => {
    const requestedCam = CAMERAS.find(c => c.id === targetCameraId);
    let activeCamId = (requestedCam && requestedCam.isAvailable) ? requestedCam.id : selectedCameraId;
    if (!CAMERAS.find(c => c.id === activeCamId)?.isAvailable) {
      activeCamId = 'dji-pocket-3';
    }
    if (activeCamId !== selectedCameraId) {
      setSelectedCameraId(activeCamId);
    }
    const activeConflict = checkCameraDateConflict(activeCamId, calcStartDate, calcEndDate, bookings);
    if (activeConflict.hasConflict) {
      const nextWindow = findNextFreeWindowForCamera(activeCamId, calcStartDate, currentQuote.days, bookings);
      setCalcStartDate(nextWindow.start);
      setCalcEndDate(nextWindow.end);
      setBooking(prev => ({
        ...prev,
        cameraId: activeCamId,
        startDate: nextWindow.start,
        endDate: nextWindow.end,
        handoverMode: calcHandover,
      }));
    } else {
      setBooking(prev => ({
        ...prev,
        cameraId: activeCamId,
        startDate: calcStartDate,
        endDate: calcEndDate,
        handoverMode: calcHandover,
      }));
    }
    setBookingSubmitError(null);
    setModalStep(1);
    setIsModalOpen(true);
  };

  // Launch Confetti when Step 6 reached
  useEffect(() => {
    if (modalStep === 6 && isModalOpen) {
      const end = Date.now() + 2.5 * 1000;
      const colors = ['#C9B8F0', '#F5C6A8', '#A8DBC8', '#FFD1DC', '#FFE8A3'];

      (function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, [modalStep, isModalOpen]);

  // Helper to optimize image file sizes before upload
  const processUploadFile = async (file: File): Promise<string> => {
    if (!file.type.startsWith('image/')) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const MAX_DIM = 1600;
          let width = img.width;
          let height = img.height;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Real File Upload Handler (reads actual images / documents selected by the user)
  const handleRealFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field:
      | 'id1File'
      | 'id1BackFile'
      | 'id2File'
      | 'id2BackFile'
      | 'selfieFile'
      | 'selfieWithIdsFile'
      | 'receiptFile'
      | 'authorizationSlipFile'
      | 'deliveryReceiptsFile'
      | 'billOwnerIdFile'
      | 'studentCORFile'
      | 'contact1IdFile'
      | 'contact2IdFile',
    nameField?: 'id1Name' | 'id1BackName' | 'id2Name' | 'id2BackName' | 'billOwnerIdName' | 'contact1IdName' | 'contact2IdName'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await processUploadFile(file);
      setBooking(prev => ({
        ...prev,
        [field]: dataUrl,
        ...(nameField ? { [nameField]: file.name } : {}),
      }));
      clearFieldError(field);
    } catch {
      showToast('Error reading file. Please try again.', 'error');
    }
  };

  const handleRemoveFile = (
    field:
      | 'id1File'
      | 'id1BackFile'
      | 'id2File'
      | 'id2BackFile'
      | 'selfieFile'
      | 'selfieWithIdsFile'
      | 'receiptFile'
      | 'authorizationSlipFile'
      | 'deliveryReceiptsFile'
      | 'billOwnerIdFile'
      | 'studentCORFile'
      | 'contact1IdFile'
      | 'contact2IdFile',
    nameField?: 'id1Name' | 'id1BackName' | 'id2Name' | 'id2BackName' | 'billOwnerIdName' | 'contact1IdName' | 'contact2IdName'
  ) => {
    setBooking(prev => ({
      ...prev,
      [field]: null,
      ...(nameField ? { [nameField]: '' } : {}),
    }));
  };

  // Copy GCash handler
  const handleCopyGcash = () => {
    navigator.clipboard.writeText('09064178301');
    setCopiedGcash(true);
    setTimeout(() => setCopiedGcash(false), 2000);
  };

  const handleCopyRef = () => {
    navigator.clipboard.writeText(booking.bookingRef);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  // Submit Step 5 -> 6 (Records real booking in state & posts to Google Sheets)
  const handleFinalizeBooking = async () => {
    if (isSubmittingBooking) return;

    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const newRef = `#PNF-2026-${randomCode}`;

    const c1Name = booking.emergencyContact1Name;
    const c1Phone = booking.emergencyContact1Phone;
    const c1Rel = booking.emergencyContact1Rel || (booking.isStudentExemption ? 'Parent / Legal Guardian' : 'Family Member');
    const c1Social = booking.emergencyContact1Social;

    const emergencyContactsText = [
      c1Name
        ? `${c1Name} (${c1Phone} - ${c1Rel}) [Social: ${c1Social || 'N/A'}]`
        : '',
      booking.emergencyContact2Name
        ? `${booking.emergencyContact2Name} (${booking.emergencyContact2Phone} - ${booking.emergencyContact2Rel || 'Friend'}) [Social: ${booking.emergencyContact2Social || 'N/A'}]`
        : ''
    ].filter(Boolean).join('; ') || 'None provided';

    const newBookingRecord: BookingRecord = {
      id: `b-${Date.now()}-${randomCode}`,
      cameraId: booking.cameraId,
      title: `${booking.fullName ? booking.fullName : 'Renter'} • Camera Rental`,
      renterTag: booking.socialHandle || (booking.fullName ? `@${booking.fullName.toLowerCase().replace(/[^a-z0-9_.]/g, '')}` : '@renter'),
      startDate: booking.startDate,
      endDate: booking.endDate,
      hub: booking.handoverMode === 'meetup' ? `Meetup: ${booking.meetupLocation}` : 'Grab Express Delivery (Metro Manila)',
      status: 'Deposit Paid'
    };

    // Payload structure for Google Sheets & Google Drive
    const payload = {
      bookingRef: newRef,
      customerName: booking.fullName || 'Valued Renter',
      contactNumber: booking.mobileNumber || 'Not provided',
      socialMediaHandle: booking.socialHandle || '@renter',
      cameraRented: modalCamera.name,
      cameraId: modalCamera.id,
      startDate: booking.startDate,
      endDate: booking.endDate,
      rentalDays: modalQuote.days,
      handoverMethod: booking.handoverMode === 'meetup' ? `Meetup (${booking.meetupLocation} - ₱200 Fee)` : 'Grab Express Delivery (Renter shoulders fee)',
      address: booking.handoverMode === 'meetup' ? booking.meetupLocation : (booking.deliveryAddress || 'Metro Manila'),
      shootType: booking.shootType || 'Travel / Vacation Vlogging',
      rentalTotal: modalQuote.rentalTotal,
      securityDeposit: modalQuote.deposit,
      meetupHandlingFee: modalQuote.meetupFee,
      downpaymentPaid: DOWNPAYMENT_FEE,
      balanceDue: modalQuote.balanceDue,
      gcashRefNumber: booking.gcashRefNumber || 'N/A',
      termsAccepted: booking.termsAccepted,
      termsVersion: booking.termsVersion || RENTAL_CONFIG.termsVersion,
      termsAcceptedAt: booking.termsAcceptedAt || new Date().toISOString(),
      notes: 'Emergency Contacts: ' + emergencyContactsText,
      // KYC Uploaded Files passed to Google Apps Script -> Google Drive:
      id1File: booking.id1File,
      id1BackFile: booking.id1BackFile,
      id2File: booking.isStudentExemption ? (booking.studentCORFile || booking.id2File) : booking.id2File,
      id2BackFile: booking.id2BackFile,
      contact1IdFile: booking.isStudentExemption ? booking.contact1IdFile : null,
      contact2IdFile: null,
      isStudentExemption: booking.isStudentExemption,
      authorizationSlipFile: booking.authorizationSlipFile,
      selfieWithIdsFile: booking.selfieWithIdsFile,
      deliveryReceiptsFile: booking.deliveryReceiptsFile,
      billOwnerIdFile: booking.billOwnerIdFile,
      selfieFile: booking.selfieFile,
      receiptFile: booking.receiptFile
    };

    // Pre-flight check: Re-verify date availability before submitting
    const currentConflict = checkCameraDateConflict(booking.cameraId, booking.startDate, booking.endDate, bookings);
    if (currentConflict.hasConflict) {
      const conflictMsg = currentConflict.message || 'The selected dates conflict with an existing confirmed booking. Please choose different dates.';
      setBookingSubmitError(conflictMsg);
      showToast(conflictMsg, 'error');
      return;
    }

    const targetUrl = (APPS_SCRIPT_URL && APPS_SCRIPT_URL !== 'YOUR_DEPLOYED_WEB_APP_URL_HERE')
      ? APPS_SCRIPT_URL
      : (import.meta.env?.VITE_APPS_SCRIPT_URL as string) || '';

    if (!targetUrl) {
      const configError = 'Reservation backend URL is not configured. Please contact PackAndFilm support.';
      setBookingSubmitError(configError);
      showToast(configError, 'error');
      return;
    }

    setIsSubmittingBooking(true);
    setBookingSubmitError(null);

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Reservation server error (HTTP status ${response.status}). Please try again.`);
      }

      const resJson = await response.json().catch(() => null);

      if (!resJson) {
        throw new Error('Invalid response received from reservation server. Please verify your connection.');
      }

      if (resJson.status === 'error') {
        throw new Error(resJson.message || 'The reservation server rejected the booking. Please review your details and try again.');
      }

      const driveLink = resJson.driveFolderUrl || null;

      // Real confirmed booking verified by backend:
      setBookings(prev => [newBookingRecord, ...prev]);
      setBooking(prev => ({
        ...prev,
        bookingRef: newRef,
        driveFolderUrl: driveLink,
      }));
      setBookingSubmitError(null);
      setModalStep(6);
      showToast('Reservation & documents secured in Google Drive!', 'success');
    } catch (err: any) {
      console.error('Error submitting booking to Google Sheets:', err);
      const errorMsg = err?.message || 'Failed to submit reservation to Google Sheets. Please check your connection and try again.';
      setBookingSubmitError(errorMsg);
      showToast(errorMsg, 'error');
      // DO NOT advance to Step 6 on failure! Customer remains on Step 5 with form inputs preserved.
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Dynamic Bag items derived from selected camera
  const currentBagItems = selectedCamera.bagItems;

  // FAQ items updated directly from PDF handouts (Requirements, T&C, How to Book)
  const faqs = [
    {
      q: 'Where are your meetup locations and what are the fees?',
      a: 'Meet-ups are held at SM East Ortigas, Bridgetowne, or Opus Mall between 8:00 AM and 8:00 PM. A ₱200 handling fee is charged for all meet-up transactions. For delivery, we use Grab Express ONLY (owner books the rider for both release and return, and the renter shoulders all delivery fees).'
    },
    {
      q: 'What are your rental operating hours?',
      a: 'Our rental operating window is strictly 8:00 AM – 8:00 PM ONLY. All gear pickups, meetups, deliveries, and returns must be scheduled within this period.'
    },
    {
      q: 'How does the ₱300 downpayment work?',
      a: 'A ₱300 down payment and complete requirements within 24 hours are needed to reserve your calendar slot. This ₱300 is credited directly toward your total rental fee (not an extra charge!). Full payment of the remaining rental balance must be settled prior to equipment release.'
    },
    {
      q: 'How does the Security Deposit refund work?',
      a: 'A refundable Security Deposit (₱1,000 for active rental units including DJI Osmo Pocket 3 and Canon PowerShot G7 X Mark III) is required before release. The deposit is fully refunded within 24 hours of the equipment being returned, provided it is in the same condition as when rented. It covers any unpaid balances, damages, loss, or unreturned accessories.'
    },
    {
      q: 'What is your cancellation policy?',
      a: 'Strictly NO cancellation once the booking has been confirmed. Any cancellation by the renter may result in a ₱500 cancellation penalty, in addition to the forfeiture of the ₱300 non-refundable reservation fee. All payments made (excluding security deposit) are strictly non-refundable and non-transferable.'
    },
    {
      q: 'What is your Late Return Policy?',
      a: 'To avoid affecting the next renter’s booking, equipment must be returned on time. A ₱150/hour late fee is charged automatically starting 30 minutes after the agreed return time. If equipment is more than 2 hours late, the fee automatically converts to one (1) full extra day’s rental at standard daily rate, plus a ₱2,000 inconvenience fee.'
    },
    {
      q: 'What documents are required to rent?',
      a: 'Requirements: 1. Two (2) valid IDs (front & back) with at least one showing current address & signature; 2. Handwritten authorization slip (date, 3 specimen signatures, "For Pack and Film Camera Rental purposes only") and selfie holding your IDs and slip; 3. Proof of billing / 2 online delivery receipts (Shopee/Lazada/TikTok); 4. Main personal social media account; 5. Two emergency contacts with valid ID photos and profile links; 6. 5-second selfie video holding your 2 IDs stating rental details.'
    },
    {
      q: 'Are students eligible to rent without a secondary government ID?',
      a: 'Yes! Enrolled students may submit: Valid Student ID + Current Certificate of Registration (COR) + Parent/Guardian Government ID (front & back).'
    },
    {
      q: 'How do I transfer photos and videos to my smartphone?',
      a: 'Super easy! We provide high-speed OTG card readers for both iPhone (Lightning / USB-C) and Android. You can export your clips directly into your phone Photos or Files app in seconds. Please remember to back up your footage before return, as memory cards are wiped immediately upon return.'
    }
  ];

  // ─────────────────────────────────────────────────────────────
  // OPERATIONAL / ADMIN DASHBOARD VIEW
  // ─────────────────────────────────────────────────────────────
  if (isAdminView) {
    return (
      <AdminDashboard
        appsScriptUrl={APPS_SCRIPT_URL}
        onExit={() => {
          setIsAdminView(false);
          if (typeof window !== 'undefined') {
            if (window.location.hash) {
              window.history.pushState(null, '', window.location.pathname);
            }
            if (window.location.pathname.startsWith('/admin')) {
              window.history.pushState(null, '', '/');
            }
          }
        }}
        localBookings={bookings}
        onBookingsUpdated={(updated) => setBookings(updated)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#1A1A2E] flex flex-col font-sans selection:bg-[#C9B8F0] selection:text-[#1A1A2E]">

      {/* Toast Notification for Google Sheets Sync & Network Alerts */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] sm:w-full animate-fadeIn pointer-events-auto">
          <div
            className={`p-4 rounded-2xl border-2 shadow-[6px_6px_0px_#1A1A2E] flex items-center justify-between gap-3 ${toast.type === 'error'
              ? 'bg-[#FFF5F5] border-[#E53E3E] text-[#9B2C2C]'
              : toast.type === 'success'
                ? 'bg-[#F0FFF4] border-[#38A169] text-[#22543D]'
                : 'bg-[#EDE8FC] border-[#6B46C1] text-[#44337A]'
              }`}
          >
            <div className="flex items-center gap-2.5 text-xs font-bold leading-snug">
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
              {toast.type === 'info' && <Sparkles className="w-4 h-4 text-[#6B46C1] shrink-0" />}
              <span>{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-gray-400 hover:text-gray-700 p-1 rounded-lg shrink-0 cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. NAVIGATION BAR
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#FAFAF7]/90 backdrop-blur-md border-b border-[#E8E4F0] px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">

          {/* Logo & Subtitle */}
          <a
            href="#"
            className="flex items-center gap-3 group"
            title="PackAndFilm"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#C9B8F0] via-[#F5C6A8] to-[#A8DBC8] p-0.5 shadow-sm group-hover:rotate-6 transition-transform shrink-0">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center overflow-hidden p-0">
                <img
                  src="/logo.png"
                  alt="PackAndFilm Logo"
                  className="w-full h-full object-contain scale-105"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-[#1A1A2E]">PackAndFilm</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EDE8FC] text-[#553C9A] border border-[#C9B8F0]/50">
                  Camera Rentals
                </span>
              </div>
              <p className="text-xs text-[#6B6B8A] font-medium tracking-wide">@packandfilm.ph • Metro Manila</p>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#1A1A2E]">
            <a href="#catalog" className="hover:text-[#6B46C1] transition-colors">Camera Catalog</a>
            <a href="#bag" className="hover:text-[#6B46C1] transition-colors">What&apos;s in the Bag</a>
            <a href="#kyc-requirements" className="hover:text-[#6B46C1] transition-colors">Requirements</a>
            <a href="#how" className="hover:text-[#6B46C1] transition-colors">How to Book</a>
            <a href="#pricing" className="hover:text-[#6B46C1] transition-colors">Pricing & Calculator</a>
            <a href="#terms" className="hover:text-[#6B46C1] transition-colors">Terms</a>
            <a href="#faq" className="hover:text-[#6B46C1] transition-colors">FAQ</a>
          </nav>

          {/* CTA & Mobile Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenBookingModal()}
              className="relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm bg-[#1A1A2E] text-white shadow-md hover:bg-[#2B2B48] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              <span>Book Now</span>
              <ArrowRight className="w-4 h-4 text-[#F5C6A8]" />
              <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A8DBC8] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#A8DBC8]"></span>
              </span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-[#1A1A2E] bg-white border border-[#E8E4F0] hover:bg-[#EDE8FC]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-[#E8E4F0] flex flex-col gap-2.5 pb-2 px-2 animate-fadeIn">
            <a
              href="#catalog"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-sm font-semibold hover:bg-[#EDE8FC]"
            >
              Camera Catalog
            </a>
            <a
              href="#bag"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-sm font-semibold hover:bg-[#EDE8FC]"
            >
              What&apos;s in the Bag
            </a>
            <a
              href="#kyc-requirements"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-sm font-semibold hover:bg-[#EDE8FC]"
            >
              Rental Requirements
            </a>
            <a
              href="#how"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-sm font-semibold hover:bg-[#EDE8FC]"
            >
              How to Book
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-sm font-semibold hover:bg-[#EDE8FC]"
            >
              Pricing Calculator
            </a>
            <a
              href="#terms"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-sm font-semibold hover:bg-[#EDE8FC]"
            >
              Terms & Conditions
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-sm font-semibold hover:bg-[#EDE8FC]"
            >
              FAQ
            </a>
          </div>
        )}
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. HERO SECTION
      ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-8 pb-16 md:pt-16 md:pb-24 px-4 sm:px-8">
        {/* Soft Pastel Background Blobs */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-[#EDE8FC] via-[#FEF0E7] to-[#E8F7F1] rounded-full blur-3xl opacity-70 -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EDE8FC] border border-[#C9B8F0] shadow-sm text-xs font-bold text-[#553C9A] transform -rotate-1 hover:rotate-0 transition-transform">
              <Sparkles className="w-3.5 h-3.5 text-[#6B46C1]" />
              <span>No. 1 Aesthetic Camera Rental • Metro Manila</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-5xl xl:text-[3.5rem] font-black text-[#1A1A2E] tracking-tight leading-[1.15]">
              Your creative bestie <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6B46C1] via-[#DD6B20] to-[#2C7A7B]">
                for every trip, concert &amp;{' '}
                <span className="relative inline-block">
                  <span className="relative z-10">core memory</span>
                  <span className="absolute bottom-1 left-0 w-full h-3 bg-[#F5C6A8]/55 -rotate-1 rounded-md -z-0"></span>
                </span>
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl text-[#6B6B8A] font-medium max-w-xl leading-relaxed">
              Rent creator cameras including the <strong className="text-[#1A1A2E] font-bold">DJI Osmo Pocket 3</strong> &amp; <strong className="text-[#1A1A2E] font-bold">Canon PowerShot G7 X Mark III</strong> starting at just <span className="underline decoration-[#C9B8F0] decoration-4 font-bold text-[#1A1A2E]">₱450/day</span> (as low as ₱350/day on extended rentals). Meet-up at SM East, Bridgetowne, or Opus &amp; Grab Express Delivery across Metro Manila (8:00 AM – 8:00 PM).
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2 w-full sm:w-auto">
              <a
                href="#catalog"
                className="flex-1 sm:flex-none px-7 py-4 rounded-full font-extrabold text-base bg-[#C9B8F0] text-[#1A1A2E] border-2 border-[#1A1A2E] shadow-[4px_4px_0px_0px_#1A1A2E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#1A1A2E] transition-all cursor-pointer flex items-center justify-center gap-2 text-center"
              >
                <span>Select Camera & Dates</span>
              </a>

              <a
                href="#kyc-requirements"
                className="flex-1 sm:flex-none px-6 py-4 rounded-full font-bold text-base bg-white text-[#1A1A2E] border-2 border-[#E8E4F0] hover:border-[#1A1A2E] hover:bg-[#FEF0E7] transition-all text-center"
              >
                Rental Requirements
              </a>
            </div>

            {/* Trust Badges Strip */}
            <div className="w-full pt-4 border-t border-[#E8E4F0]/80">
              <p className="text-xs uppercase font-extrabold text-[#6B6B8A] tracking-wider mb-3">
                Metro Manila • 8:00 AM – 8:00 PM
              </p>
              <div className="flex flex-wrap gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-[#E8E4F0] text-[#1A1A2E] shadow-sm">
                  <MapPin className="w-3.5 h-3.5 text-[#DD6B20]" />
                  SM East • Bridgetowne • Opus
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-[#E8E4F0] text-[#1A1A2E] shadow-sm">
                  <Clock className="w-3.5 h-3.5 text-[#319795]" />
                  8:00 AM – 8:00 PM
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-[#E8E4F0] text-[#1A1A2E] shadow-sm">
                  <CreditCard className="w-3.5 h-3.5 text-[#6B46C1]" />
                  ₱300 Slot Downpayment
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-[#E8E4F0] text-[#1A1A2E] shadow-sm">
                  <Truck className="w-3.5 h-3.5 text-[#DD6B20]" />
                  Grab Express Delivery ONLY
                </span>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Interactive Product Visual Card (Smart Priority Carousel) */}
          <div
            className="lg:col-span-5 relative flex justify-center"
            onMouseEnter={() => setIsHeroHovered(true)}
            onMouseLeave={() => setIsHeroHovered(false)}
          >

            {/* Ambient Sticker Chips Floating — Synced with Active Slide */}
            {activeHeroSlide.chips.map((chip, idx) => (
              <div
                key={`${activeHeroSlide.id}-chip-${idx}`}
                className={`absolute ${chip.position} z-20 ${chip.bg} text-[#1A1A2E] font-black text-xs px-3.5 py-1.5 rounded-full border-2 border-[#1A1A2E] shadow-[3px_3px_0px_#1A1A2E] ${chip.rotate} ${chip.anim} transition-all duration-300 pointer-events-none select-none`}
              >
                {chip.text}
              </div>
            ))}

            {/* Main Product Showcase Box */}
            <div className="w-full max-w-sm rounded-[32px] bg-white border-2 border-[#1A1A2E] shadow-[8px_8px_0px_0px_#1A1A2E] p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-1">

              {/* Header inside card: Mac window dots + Camera Switcher Tabs */}
              <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E4F0] gap-2">
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="w-3 h-3 rounded-full bg-[#E53E3E]" />
                  <div className="w-3 h-3 rounded-full bg-[#D69E2E]" />
                  <div className="w-3 h-3 rounded-full bg-[#38A169]" />
                </div>

                {/* Interactive Carousel Toggle Tabs */}
                <div className="flex items-center bg-[#F4F2F8] p-1 rounded-xl border border-[#E8E4F0] gap-1">
                  <button
                    type="button"
                    onClick={() => setHeroSlideId('dji-pocket-3')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                      heroSlideId === 'dji-pocket-3'
                        ? 'bg-white text-[#1A1A2E] shadow-xs border border-[#E8E4F0]'
                        : 'text-[#6B6B8A] hover:text-[#1A1A2E]'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        heroCameraAvailability['dji-pocket-3'].isAvailableToday
                          ? 'bg-emerald-500 shadow-[0_0_4px_#10B981]'
                          : 'bg-amber-500'
                      }`}
                    />
                    DJI Pocket 3
                  </button>

                  <button
                    type="button"
                    onClick={() => setHeroSlideId('canon-g7x-mark-iii')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                      heroSlideId === 'canon-g7x-mark-iii'
                        ? 'bg-white text-[#1A1A2E] shadow-xs border border-[#E8E4F0]'
                        : 'text-[#6B6B8A] hover:text-[#1A1A2E]'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        heroCameraAvailability['canon-g7x-mark-iii'].isAvailableToday
                          ? 'bg-emerald-500 shadow-[0_0_4px_#10B981]'
                          : 'bg-amber-500'
                      }`}
                    />
                    Canon G7 X
                  </button>
                </div>
              </div>

              {/* Sub-header: Bundle Tag & Live Status Badge */}
              <div className="flex items-center justify-between pt-3 pb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6B6B8A]">
                  {activeHeroSlide.bundleTag}
                </span>

                {/* Smart Live Availability Badge */}
                {activeHeroAvailability.isAvailableToday ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black shadow-xs animate-pulse-soft">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Available Today
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-black shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Booked Today • Free {activeHeroAvailability.nextFree}
                  </span>
                )}
              </div>

              {/* Camera Showcase Area with Levitation & Click to Book */}
              <div
                onClick={() => handleOpenBookingModal(activeHeroSlide.id)}
                className="py-4 flex flex-col items-center justify-center relative select-none cursor-pointer group"
                title={`Click to rent ${activeHeroSlide.name}`}
              >
                {/* Ambient Radial Glow */}
                <div className="absolute w-52 h-52 rounded-full bg-gradient-to-tr from-[#C9B8F0]/30 via-[#EDE8FC]/40 to-[#A8DBC8]/30 blur-2xl -z-0 pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center">
                  <div className="relative animate-camera-levitate transform-gpu will-change-transform transition-transform duration-500 group-hover:scale-105">
                    <img
                      key={activeHeroSlide.id}
                      src={activeHeroSlide.image}
                      alt={activeHeroSlide.alt}
                      className="w-auto h-56 sm:h-64 object-contain drop-shadow-[0_16px_28px_rgba(26,26,46,0.18)] transition-all duration-500"
                      loading="eager"
                      fetchPriority="high"
                    />

                    {/* Micro Active Status LED for DJI Pocket 3 */}
                    {activeHeroSlide.hasLed && (
                      <span
                        className="absolute top-[48.2%] left-[34.2%] w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34D399] animate-pulse pointer-events-none"
                        title="Ready for Rental"
                      />
                    )}
                  </div>

                  {/* Dynamic Floor Shadow */}
                  <div
                    className="w-28 h-2.5 rounded-[100%] bg-[#1A1A2E] blur-xs mt-1 animate-camera-shadow pointer-events-none transform-gpu"
                    aria-hidden="true"
                  />
                </div>
              </div>

              {/* Carousel Slide Indicator Dots */}
              <div className="flex items-center justify-center gap-1.5 pb-3">
                <button
                  type="button"
                  onClick={() => setHeroSlideId('dji-pocket-3')}
                  aria-label="View DJI Osmo Pocket 3"
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    heroSlideId === 'dji-pocket-3'
                      ? 'w-6 bg-[#1A1A2E]'
                      : 'w-2 bg-[#E8E4F0] hover:bg-[#6B6B8A]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setHeroSlideId('canon-g7x-mark-iii')}
                  aria-label="View Canon PowerShot G7 X Mark III"
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    heroSlideId === 'canon-g7x-mark-iii'
                      ? 'w-6 bg-[#1A1A2E]'
                      : 'w-2 bg-[#E8E4F0] hover:bg-[#6B6B8A]'
                  }`}
                />
              </div>

              {/* Card Footer Breakdown */}
              <div className="bg-[#FAFAF7] rounded-2xl p-3.5 border border-[#E8E4F0] flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-[#6B6B8A]">
                    {activeHeroSlide.shortName} Daily
                  </div>
                  <div className="text-xl font-black text-[#1A1A2E]">
                    ₱{activeHeroSlide.rate} <span className="text-xs font-normal text-[#6B6B8A]">/ day</span>
                  </div>
                  <div className="text-[10px] text-[#553C9A] font-bold">
                    {activeHeroSlide.bulkRateText}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenBookingModal(activeHeroSlide.id)}
                  className="px-4 py-2 rounded-xl bg-[#1A1A2E] text-white font-bold text-xs hover:bg-[#6B46C1] transition-colors cursor-pointer shadow-sm hover:shadow flex items-center gap-1 group"
                >
                  <span>Rent Kit</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. WHAT'S IN THE BAG SECTION (8-Card Grid)
      ───────────────────────────────────────────────────────────── */}
      <section id="bag" className="py-16 sm:py-20 px-4 sm:px-8 bg-white border-y border-[#E8E4F0]">
        <div className="max-w-7xl mx-auto">

          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F7F1] text-[#234E52] border border-[#A8DBC8] text-xs font-bold mb-3">
              <ShoppingBag className="w-3.5 h-3.5 text-[#319795]" />
              <span>Full Kit Inclusions &amp; Accessories</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1A1A2E] tracking-tight">
              What&apos;s in the Bag?
            </h2>
            <p className="mt-2 text-base text-[#6B6B8A] font-medium">
              Sanitized at our Pasig base before every rental. Everything you need to film, shoot, and export directly to your smartphone.
            </p>

            {/* Camera Switcher Tabs for Bag Inclusions */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              {CAMERAS.filter(c => c.isAvailable).map((cam) => {
                const isActive = selectedCameraId === cam.id;
                return (
                  <button
                    key={cam.id}
                    type="button"
                    onClick={() => setSelectedCameraId(cam.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#1A1A2E] text-white border-[#1A1A2E] shadow-sm'
                        : 'bg-[#FAFAF7] text-[#6B6B8A] border-[#E8E4F0] hover:text-[#1A1A2E] hover:border-[#1A1A2E]'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5 text-[#F5C6A8]" />
                    <span>{cam.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 8-Card Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {currentBagItems.map((item) => (
              <div
                key={item.id}
                className="group relative bg-[#FAFAF7] rounded-[24px] border-2 border-[#E8E4F0] p-5 flex flex-col justify-between hover:border-[#1A1A2E] hover:shadow-[4px_4px_0px_0px_#1A1A2E] hover:-translate-y-1 transition-all duration-200"
              >
                <div>
                  {/* Top Bar inside Card */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-[#E8E4F0] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                      <Camera className="w-6 h-6 text-[#1A1A2E]" />
                    </div>
                    <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full ${item.color}`}>
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#1A1A2E] group-hover:text-[#6B46C1] transition-colors">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-xs text-[#6B6B8A] leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#E8E4F0]/80">
                  <div className="text-[11px] font-semibold text-[#1A1A2E] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#38A169]" />
                    <span>{item.spec}</span>
                  </div>
                  <button
                    onClick={() => setPreviewBagItem(previewBagItem === item.id ? null : item.id)}
                    className="mt-2 text-[11px] font-bold text-[#6B46C1] hover:underline flex items-center gap-1"
                  >
                    <span>{previewBagItem === item.id ? 'Hide Pro-Tip ▲' : 'View Pro-Tip ▼'}</span>
                  </button>
                  {previewBagItem === item.id && (
                    <div className="mt-2 p-2 rounded-xl bg-white border border-[#C9B8F0] text-[11px] text-[#553C9A] leading-tight animate-fadeIn">
                      💡 {item.tip}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. HOW TO BOOK SECTION (5 Simple Steps from Handout)
      ───────────────────────────────────────────────────────────── */}
      <section id="how" className="py-16 sm:py-20 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">

          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF0E7] text-[#C05621] border border-[#F5C6A8] text-xs font-bold mb-3">
              <Zap className="w-3.5 h-3.5 text-[#DD6B20]" />
              <span>Guidelines for Smooth Rentals</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1A1A2E] tracking-tight">
              How to Book
            </h2>
            <p className="mt-2 text-base text-[#6B6B8A] font-medium">
              Guidelines for smooth rentals • Simple 5-step process from initial inquiry to handover.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 relative">
            {HOW_TO_BOOK_STEPS.map((s, idx) => {
              const badgeColors = [
                'bg-[#C9B8F0]',
                'bg-[#F5C6A8]',
                'bg-[#A8DBC8]',
                'bg-[#EDE8FC]',
                'bg-[#FEF0E7]'
              ];
              const iconColors = [
                'bg-[#EDE8FC] text-[#6B46C1]',
                'bg-[#FEF0E7] text-[#DD6B20]',
                'bg-[#E8F7F1] text-[#234E52]',
                'bg-[#EDE8FC] text-[#553C9A]',
                'bg-[#FEF0E7] text-[#C05621]'
              ];
              const icons = [
                <Calendar key="1" className="w-6 h-6" />,
                <ShieldCheck key="2" className="w-6 h-6" />,
                <CreditCard key="3" className="w-6 h-6" />,
                <FileCheck key="4" className="w-6 h-6" />,
                <Camera key="5" className="w-6 h-6" />
              ];

              return (
                <div
                  key={s.step}
                  className="bg-white rounded-[28px] border-2 border-[#E8E4F0] hover:border-[#1A1A2E] shadow-none hover:shadow-[5px_5px_0px_0px_#1A1A2E] p-6 flex flex-col justify-between relative group hover:-translate-y-1 transition-all duration-200"
                >
                  <div className={`absolute -top-3.5 left-6 ${badgeColors[idx % badgeColors.length]} text-[#1A1A2E] font-black text-xs px-3 py-1 rounded-full border border-[#E8E4F0] group-hover:border-[#1A1A2E] transition-colors`}>
                    STEP {s.step}
                  </div>
                  <div>
                    <div className={`w-12 h-12 rounded-2xl ${iconColors[idx % iconColors.length]} flex items-center justify-center mb-5 mt-2`}>
                      {icons[idx % icons.length]}
                    </div>
                    <div className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-[#6B46C1] mb-1.5 bg-[#EDE8FC] px-2 py-0.5 rounded-md">
                      {s.badge}
                    </div>
                    <h3 className="text-lg font-black text-[#1A1A2E] leading-snug">
                      {s.title}
                    </h3>
                    <p className="mt-2.5 text-xs text-[#6B6B8A] leading-relaxed font-medium">
                      {s.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Handout Footer Call-Out */}
          <div className="mt-10 p-5 sm:p-6 rounded-2xl bg-[#EDE8FC] border-2 border-[#E8E4F0] hover:border-[#1A1A2E] shadow-none hover:shadow-[4px_4px_0px_0px_#1A1A2E] flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-200">
            <div className="text-center sm:text-left">
              <span className="text-sm font-black text-[#1A1A2E] block">
                Thank you for choosing PackAndFilm as your creative bestie! Happy shooting!
              </span>
              <span className="text-xs font-semibold text-[#553C9A] mt-0.5 block">
                DM US NOW or book directly through our fast checkout form below.
              </span>
            </div>
            <button
              onClick={() => handleOpenBookingModal()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-black text-xs bg-[#1A1A2E] text-white hover:bg-[#6B46C1] transition-all shadow-md cursor-pointer shrink-0"
            >
              <span>Book Your Camera Now</span>
              <ArrowRight className="w-4 h-4 text-[#F5C6A8]" />
            </button>
          </div>

          {/* Why Rent With Us • What You Can Expect Section */}
          <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-white border-2 border-[#E8E4F0] hover:border-[#1A1A2E] shadow-none hover:shadow-[6px_6px_0px_0px_#1A1A2E] transition-all duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#E8E4F0]">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDE8FC] text-[#553C9A] text-xs font-bold mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#6B46C1]" />
                  <span>What You Can Expect</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[#1A1A2E]">
                  Why Creators & Concert-Goers Rent With Us
                </h3>
                <p className="text-xs sm:text-sm text-[#6B6B8A] mt-1 font-medium">
                  Transparent terms, completely equipped creator kits, and direct support across Metro Manila.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <a
                  href="https://www.instagram.com/packandfilm.ph/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-[#EDE8FC] hover:bg-[#DBCBF7] text-[#553C9A] font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Instagram @packandfilm.ph</span>
                </a>
                <a
                  href="https://www.facebook.com/people/Pack-and-Film/61595302043810/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-[#1A1A2E] hover:bg-[#553C9A] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#F5C6A8]" />
                  <span>Facebook @Pack and Film</span>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#E8F7F1] flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5 text-[#234E52]" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-[#1A1A2E]">Fast Digital Verification</h4>
                  <p className="text-xs text-[#6B6B8A] mt-1 leading-relaxed font-medium">
                    No physical paperwork or printed forms. Upload your IDs right from your phone for swift 15-minute verification.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FEF0E7] flex items-center justify-center shrink-0 mt-0.5">
                  <ShoppingBag className="w-5 h-5 text-[#C05621]" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-[#1A1A2E]">All-in-One Ready Kits</h4>
                  <p className="text-xs text-[#6B6B8A] mt-1 leading-relaxed font-medium">
                    Sanitized camera kit (Pocket 3 or Canon G7 X), high-speed storage, direct phone OTG reader, and protective casing included.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EDE8FC] flex items-center justify-center shrink-0 mt-0.5">
                  <CreditCard className="w-5 h-5 text-[#553C9A]" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-[#1A1A2E]">Same-Day Deposit Refund</h4>
                  <p className="text-xs text-[#6B6B8A] mt-1 leading-relaxed font-medium">
                    Security deposits are sent directly back to your GCash account immediately once unit is inspected upon return.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          CAMERA CATALOG SECTION
      ───────────────────────────────────────────────────────────── */}
      <section id="catalog" className="py-16 sm:py-20 px-4 sm:px-8 bg-[#FAFAF7]">
        <div className="max-w-7xl mx-auto">

          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDE8FC] text-[#553C9A] border border-[#C9B8F0] text-xs font-bold mb-3">
              <Camera className="w-3.5 h-3.5 text-[#6B46C1]" />
              <span>Multi-Camera Lineup</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1A1A2E] tracking-tight">
              Pick Your Camera
            </h2>
            <p className="mt-2 text-base text-[#6B6B8A] font-medium">
              Curated cameras for concerts, travel vlogs, and street photography across Metro Manila.
            </p>
          </div>

          {/* Camera Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CAMERAS.map((cam) => {
              const isSelected = selectedCameraId === cam.id;
              const isAvailable = cam.isAvailable;

              return (
                <div
                  key={cam.id}
                  onClick={() => {
                    if (!isAvailable) {
                      showToast(`✨ ${cam.name} is coming soon to our lineup! Currently, the DJI Osmo Pocket 3 and Canon PowerShot G7 X Mark III are available for rental.`, 'info');
                      return;
                    }
                    setSelectedCameraId(cam.id);
                  }}
                  className={`relative rounded-[28px] border-2 p-6 flex flex-col justify-between transition-all ${!isAvailable
                    ? 'bg-[#FAFAF7]/95 border-[#E8E4F0] hover:border-[#F5C6A8] hover:shadow-[3px_3px_0px_0px_#F5C6A8] cursor-pointer'
                    : isSelected
                      ? 'bg-white border-[#1A1A2E] shadow-[6px_6px_0px_0px_#1A1A2E] -translate-y-1 cursor-pointer'
                      : 'bg-white/90 border-[#E8E4F0] hover:border-[#1A1A2E] hover:shadow-[3px_3px_0px_0px_#1A1A2E] cursor-pointer'
                    }`}
                >
                  <div>
                    {/* Badge & Status Header */}
                    <div className="flex items-center justify-between mb-3">
                      {isAvailable ? (
                        <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-[#EDE8FC] text-[#553C9A] border border-[#C9B8F0] flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#38A169] animate-pulse" />
                          <span>{cam.badge}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-[#FEF0E7] text-[#C05621] border border-[#F5C6A8] flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#DD6B20]" />
                          <span>Coming Soon</span>
                        </span>
                      )}

                      {isAvailable ? (
                        <span className="text-[10px] font-bold text-[#38A169] bg-[#E8F7F1] px-2.5 py-0.5 rounded-full border border-[#A8DBC8] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-[#38A169]" />
                          <span>Ready to Rent</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-[#6B6B8A] bg-white px-2.5 py-0.5 rounded-full border border-[#E8E4F0]">
                          Lineup Addition
                        </span>
                      )}
                    </div>

                    {/* Camera Product Image with Consistent 4:3 Aspect Ratio */}
                    <div className="relative w-full aspect-[4/3] rounded-2xl bg-gradient-to-b from-[#F5F2FC] via-[#FAFAF7] to-[#FEF6F0] p-4 flex items-center justify-center overflow-hidden border border-[#E8E4F0] mb-3.5 group">
                      <img
                        src={cam.image}
                        alt={cam.name}
                        className="h-full w-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <span className="absolute bottom-2.5 left-2.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-[#1A1A2E]/85 backdrop-blur-xs text-white shadow-xs">
                        {cam.shortName.toUpperCase()}
                      </span>
                      {!isAvailable && (
                        <span className="absolute top-2.5 right-2.5 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-[#FEF0E7] text-[#C05621] border border-[#F5C6A8]">
                          Preview Only
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-black text-[#1A1A2E] mt-1">
                      {cam.name}
                    </h3>

                    {/* Status Tag for Upcoming Cameras */}
                    {!isAvailable && (
                      <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-[#FFF6EE] border border-[#F5C6A8]/70 flex items-center gap-2 text-[11px] font-bold text-[#C05621]">
                        <Sparkles className="w-3.5 h-3.5 text-[#DD6B20] shrink-0" />
                        <span>Planned Lineup • Preview Only</span>
                      </div>
                    )}

                    <p className="text-xs text-[#6B6B8A] mt-2 leading-relaxed">
                      {cam.tagline}
                    </p>

                    {/* Specs Pills */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {cam.specs.map((spec, i) => (
                        <span key={i} className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-[#FAFAF7] border border-[#E8E4F0] text-[#1A1A2E]">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#E8E4F0]">
                    <div className="flex items-baseline justify-between mb-3">
                      <div>
                        <span className="text-2xl font-black text-[#1A1A2E]">₱{cam.standardRate}</span>
                        <span className="text-xs font-semibold text-[#6B6B8A]">
                          {isAvailable ? ' / day (1d)' : ' / day (Target)'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-[#38A169]">From ₱{cam.bulkRate}/day</span>
                        <span className="text-[10px] block text-[#6B6B8A]">
                          {isAvailable ? 'Tier discounts up to 6+d' : 'Expected bulk'}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-[#6B6B8A] mb-3 flex items-center justify-between">
                      <span className="font-semibold text-[#1A1A2E]">
                        Refundable Deposit: ₱{(cam.depositAmount || cam.meetupDeposit || 1000).toLocaleString()}
                      </span>
                      <span className="text-[10px] font-bold text-[#2F855A] bg-[#E8F7F1] px-2 py-0.5 rounded-md border border-[#A8DBC8]">
                        Meetup & Grab Express
                      </span>
                    </div>

                    {isAvailable ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCameraId(cam.id);
                          const pricingEl = document.getElementById('pricing');
                          pricingEl?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`w-full py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${isSelected
                          ? 'bg-[#1A1A2E] text-white shadow-sm'
                          : 'bg-[#FAFAF7] hover:bg-[#EDE8FC] text-[#1A1A2E] border border-[#E8E4F0]'
                          }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-4 h-4 text-[#A8DBC8]" />
                            <span>Selected Camera Active</span>
                          </>
                        ) : (
                          <span>Select & Calculate Dates</span>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          showToast(`✨ ${cam.name} is coming soon to our lineup! You can DM us on Instagram @packandfilm.ph to be notified as soon as units arrive.`, 'info');
                        }}
                        className="w-full py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 bg-[#F3F1ED] hover:bg-[#FEF0E7] text-[#6B6B8A] hover:text-[#C05621] border border-[#E8E4F0] hover:border-[#F5C6A8] cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5 text-[#DD6B20]" />
                        <span>Coming Soon • Inquire / Notify Me</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          RENTAL REQUIREMENTS & VERIFICATION SECTION
      ───────────────────────────────────────────────────────────── */}
      <section id="kyc-requirements" className="py-16 sm:py-20 px-4 sm:px-8 bg-white border-y border-[#E8E4F0]">
        <div className="max-w-7xl mx-auto">

          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF0E7] text-[#C05621] border border-[#F5C6A8] text-xs font-bold mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-[#DD6B20]" />
              <span>Safety & Transparent Verification</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1A1A2E] tracking-tight">
              Rental Requirements
            </h2>
            <p className="mt-2 text-base text-[#6B6B8A] font-medium">
              We protect both our equipment and your deposit. Simple, clear guidelines verified directly from your phone.
            </p>
          </div>

          {/* 5 Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FIVE_STEP_REQUIREMENTS.map((req) => (
              <div
                key={req.step}
                className="group bg-[#FAFAF7] rounded-[24px] border-2 border-[#E8E4F0] p-6 flex flex-col justify-between hover:border-[#1A1A2E] hover:shadow-[5px_5px_0px_0px_#1A1A2E] hover:-translate-y-1 transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-8 h-8 rounded-xl bg-[#1A1A2E] text-white flex items-center justify-center font-black text-xs">
                      0{req.step}
                    </span>
                    <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#EDE8FC] text-[#553C9A]">
                      {req.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-[#1A1A2E]">
                    {req.title}
                  </h3>
                  <p className="text-xs text-[#6B6B8A] mt-2 font-medium">
                    {req.desc}
                  </p>

                  <ul className="mt-4 space-y-2 text-[11px] text-[#1A1A2E]">
                    {req.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#38A169] shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 pt-3 border-t border-[#E8E4F0] text-[10px] font-bold text-[#6B6B8A]">
                  {req.mandatoryText}
                </div>
              </div>
            ))}

            {/* Student Exemption Highlight Card */}
            <div className="group bg-[#E8F7F1] rounded-[24px] border-2 border-[#A8DBC8] hover:border-[#1A1A2E] p-6 flex flex-col justify-between hover:shadow-[5px_5px_0px_0px_#1A1A2E] hover:-translate-y-1 transition-all duration-200">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="w-6 h-6 text-[#234E52]" />
                  <span className="font-extrabold text-sm text-[#234E52]">
                    {STUDENT_EXEMPTION_NOTICE.title}
                  </span>
                </div>
                <p className="text-xs text-[#234E52] leading-relaxed font-medium">
                  {STUDENT_EXEMPTION_NOTICE.desc}
                </p>
                <div className="mt-4 p-3 bg-white/80 rounded-xl text-[11px] text-[#234E52] font-semibold space-y-1">
                  <div>✓ Valid Student ID (front &amp; back)</div>
                  <div>✓ Current Certificate of Registration (COR)</div>
                  <div>✓ Parent / Guardian Government ID</div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#A8DBC8] text-[10px] font-black text-[#234E52]">
                STUDENTS NATIONWIDE WELCOME!
              </div>
            </div>
          </div>

        </div>
      </section>



      {/* ─────────────────────────────────────────────────────────────
          5. INTERACTIVE PRICING CALCULATOR
      ───────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-16 sm:py-20 px-4 sm:px-8 bg-gradient-to-b from-[#FAFAF7] to-[#EDE8FC]/40">
        <div className="max-w-5xl mx-auto">

          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDE8FC] text-[#553C9A] border border-[#C9B8F0] text-xs font-bold mb-3">
              <CreditCard className="w-3.5 h-3.5 text-[#6B46C1]" />
              <span>Transparent Calculator</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1A1A2E] tracking-tight">
              Real-Time Pricing Calculator
            </h2>
            <p className="mt-2 text-base text-[#6B6B8A] font-medium">
              Pick your rental dates and delivery mode to calculate exact quotes, bulk discounts, and security deposit details.
            </p>
          </div>

          {/* Calculator Card */}
          <div className="bg-white rounded-[32px] border-2 border-[#1A1A2E] shadow-[8px_8px_0px_0px_#1A1A2E] p-5 sm:p-8 md:p-10">

            {/* Step 0: Camera Switcher directly inside the calculator */}
            <div className="mb-8 pb-6 border-b border-[#E8E4F0]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <label className="text-xs font-black uppercase tracking-wider text-[#6B6B8A]">
                  Step 1: Select Camera Model
                </label>
                <span className="text-[11px] font-bold text-[#553C9A] bg-[#EDE8FC] px-2.5 py-0.5 rounded-full w-fit">
                  Active: {selectedCamera.name}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CAMERAS.map((cam) => {
                  const isCur = selectedCameraId === cam.id;
                  const isAvailable = cam.isAvailable;
                  return (
                    <button
                      key={cam.id}
                      type="button"
                      onClick={() => {
                        if (!isAvailable) {
                          showToast(`✨ ${cam.name} is coming soon to our lineup! Currently, the DJI Osmo Pocket 3 and Canon PowerShot G7 X Mark III are available for rental.`, 'info');
                          return;
                        }
                        setSelectedCameraId(cam.id);
                      }}
                      className={`min-h-[52px] p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${!isAvailable
                        ? 'border-[#E8E4F0] bg-[#FAFAF7]/80 text-[#6B6B8A] cursor-not-allowed hover:border-[#F5C6A8]'
                        : isCur
                          ? 'border-[#1A1A2E] bg-[#EDE8FC] shadow-[3px_3px_0px_#1A1A2E] cursor-pointer'
                          : 'border-[#E8E4F0] bg-[#FAFAF7] hover:border-[#C9B8F0] cursor-pointer'
                        }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`font-black text-xs line-clamp-1 ${!isAvailable ? 'text-[#6B6B8A]' : 'text-[#1A1A2E]'}`}>
                          {cam.shortName}
                        </span>
                        {isCur ? (
                          <Check className="w-3.5 h-3.5 text-[#553C9A] shrink-0" />
                        ) : !isAvailable ? (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#FEF0E7] text-[#C05621] border border-[#F5C6A8]">
                            Coming Soon
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#6B6B8A]">₱{cam.standardRate}/d</span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] w-full">
                        <span className={`font-extrabold ${!isAvailable ? 'text-[#6B6B8A]' : 'text-[#553C9A]'}`}>
                          ₱{cam.standardRate}/day {!isAvailable && <span className="text-[9px] font-normal text-[#8A8A9E]">(Target)</span>}
                        </span>
                        <span className={`text-[10px] font-bold ${!isAvailable ? 'text-[#8A8A9E]' : 'text-[#38A169]'}`}>
                          {!isAvailable ? 'Pre-launch' : `₱${cam.bulkRate} bulk`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Camera Official Tiered Pricing Strip */}
            {selectedCamera.pricingTiers && selectedCamera.pricingTiers.length > 0 && (
              <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-[#FAFAF7] border border-[#E8E4F0]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
                  <span className="text-xs font-black uppercase tracking-wider text-[#1A1A2E] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#553C9A]" />
                    <span>{selectedCamera.shortName} Official Rental Rates</span>
                  </span>
                  <span className="text-[11px] font-bold text-[#234E52] bg-[#E8F7F1] px-2.5 py-0.5 rounded-full border border-[#A8DBC8] w-fit">
                    Refundable Deposit: ₱{(selectedCamera.depositAmount || selectedCamera.meetupDeposit || 1000).toLocaleString()} (Meetup &amp; Grab Express)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {selectedCamera.pricingTiers.map((tier, idx) => {
                    const isTierActive = currentQuote.days >= tier.minDays && currentQuote.days <= tier.maxDays;
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-center transition-all ${isTierActive
                          ? 'bg-[#EDE8FC] border-[#553C9A] shadow-xs'
                          : 'bg-white border-[#E8E4F0]'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold text-[#6B6B8A] block">{tier.label}</span>
                        <span className="text-base font-black text-[#1A1A2E] mt-0.5 block">
                          ₱{tier.rate} <span className="text-[10px] font-semibold text-[#6B6B8A]">/ day</span>
                        </span>
                        <span className="text-[10px] text-[#553C9A] font-bold block">
                          {tier.sublabel || (tier.rate === selectedCamera.standardRate ? 'Standard' : 'Tier Discount')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Responsive Flex-Col on Mobile / 12-Col on Desktop */}
            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8">

              {/* Controls Column */}
              <div className="w-full lg:col-span-7 space-y-6">

                {/* Quick Date Presets */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6B6B8A] mb-2">
                    Step 2: Quick Trip Presets
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleSetPreset(2)}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FAFAF7] border border-[#E8E4F0] hover:border-[#1A1A2E] hover:bg-[#FEF0E7] transition-all cursor-pointer flex-1 sm:flex-none text-center"
                    >
                      Concert Night (2 Days)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetPreset(3)}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FAFAF7] border border-[#E8E4F0] hover:border-[#1A1A2E] hover:bg-[#EDE8FC] transition-all cursor-pointer flex-1 sm:flex-none text-center"
                    >
                      Weekend Getaway (3 Days)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetPreset(5)}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FAFAF7] border border-[#E8E4F0] hover:border-[#1A1A2E] hover:bg-[#E8F7F1] transition-all cursor-pointer flex-1 sm:flex-none text-center"
                    >
                      Out of Town (5 Days)
                    </button>
                  </div>
                </div>

                {/* Date Inputs with Custom Pastel Calendar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CustomDatePicker
                    label="Start Date (Pickup / Delivery)"
                    placeholder="Select trip start date"
                    value={calcStartDate}
                    minDate={todayStr}
                    rangeStart={calcStartDate}
                    rangeEnd={calcEndDate}
                    bookedRanges={bookings.filter(b => b.cameraId === selectedCameraId)}
                    hasConflict={calcConflict.hasConflict}
                    onChange={(newStart) => {
                      setCalcStartDate(newStart);
                      if (newStart > calcEndDate) {
                        setCalcEndDate(newStart);
                      }
                    }}
                  />

                  <CustomDatePicker
                    label="End Date (Return Date)"
                    placeholder="Select return date"
                    value={calcEndDate}
                    minDate={calcStartDate || todayStr}
                    rangeStart={calcStartDate}
                    rangeEnd={calcEndDate}
                    isEndDate={true}
                    bookedRanges={bookings.filter(b => b.cameraId === selectedCameraId)}
                    hasConflict={calcConflict.hasConflict}
                    onChange={(newEnd) => setCalcEndDate(newEnd)}
                  />
                </div>

                {/* Dynamic Conflict Detection Scoped to Camera */}
                {calcConflict.hasConflict ? (
                  <div className="p-4 rounded-2xl bg-[#FFF5F5] border-2 border-[#FEB2B2] text-[#9B2C2C] space-y-2.5 animate-fadeIn">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#FED7D7] flex items-center justify-center shrink-0 mt-0.5">
                        <CalendarX className="w-4 h-4 text-[#C53030]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="font-black text-xs text-[#9B2C2C]">
                            {selectedCamera.shortName} Unavailable on These Dates
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEB2B2] text-[#9B2C2C]">
                            Reserved
                          </span>
                        </div>
                        <p className="text-xs text-[#C53030] mt-1 font-medium leading-relaxed">
                          {calcConflict.message}
                        </p>
                        <div className="text-[11px] text-[#9B2C2C] font-semibold mt-1">
                          Location: {calcConflict.conflictingBooking?.hub}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#FEB2B2]/60 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAutoPickNextAvailable}
                        className="min-h-[40px] px-4 py-2 rounded-xl bg-[#E53E3E] text-white text-xs font-bold hover:bg-[#C53030] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Jump to Next Free Dates</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowScheduleModal(true)}
                        className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white border border-[#FEB2B2] text-xs font-bold text-[#9B2C2C] hover:bg-[#FED7D7] transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>View {selectedCamera.shortName} Schedule</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-[#E8F7F1] border border-[#A8DBC8] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#234E52] gap-2">
                    <div className="flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4 text-[#38A169] shrink-0" />
                      <span className="font-bold">{selectedCamera.shortName} is 100% Available</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowScheduleModal(true)}
                      className="text-[11px] font-bold text-[#234E52] hover:text-[#1A1A2E] underline cursor-pointer text-left sm:text-right"
                    >
                      View Busy Calendar
                    </button>
                  </div>
                )}

                {/* Handover Mode Selection */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6B6B8A] mb-2">
                    Step 3: Handover &amp; Return Method (Metro Manila)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                    <button
                      type="button"
                      onClick={() => setCalcHandover('meetup')}
                      className={`min-h-[88px] p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${calcHandover === 'meetup'
                        ? 'border-[#1A1A2E] bg-[#EDE8FC] shadow-[3px_3px_0px_#1A1A2E]'
                        : 'border-[#E8E4F0] bg-[#FAFAF7] hover:border-[#C9B8F0]'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-[#1A1A2E]">Meet-up Hubs</span>
                        {calcHandover === 'meetup' && <Check className="w-4 h-4 text-[#553C9A]" />}
                      </div>
                      <p className="mt-1 text-xs text-[#6B6B8A] leading-tight">
                        SM East Ortigas, Bridgetowne, or Opus Mall (8:00 AM – 8:00 PM).
                      </p>
                      <div className="mt-2 text-[11px] font-bold text-[#553C9A] flex items-center justify-between">
                        <span>Handling Fee: +₱200</span>
                        <span>Deposit: ₱{currentQuote.deposit.toLocaleString()}</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCalcHandover('courier')}
                      className={`min-h-[88px] p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${calcHandover === 'courier'
                        ? 'border-[#1A1A2E] bg-[#FEF0E7] shadow-[3px_3px_0px_#1A1A2E]'
                        : 'border-[#E8E4F0] bg-[#FAFAF7] hover:border-[#F5C6A8]'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-[#1A1A2E]">Grab Express ONLY</span>
                        {calcHandover === 'courier' && <Check className="w-4 h-4 text-[#C05621]" />}
                      </div>
                      <p className="mt-1 text-xs text-[#6B6B8A] leading-tight">
                        Owner books rider for release &amp; return. Renter shoulders delivery fee.
                      </p>
                      <div className="mt-2 text-[11px] font-bold text-[#C05621] flex items-center justify-between">
                        <span>8:00 AM – 8:00 PM ONLY</span>
                        <span>Deposit: ₱{currentQuote.deposit.toLocaleString()}</span>
                      </div>
                    </button>

                  </div>
                </div>

                {/* Bulk Promo Notification */}
                {currentQuote.isBulk ? (
                  <div className="p-3.5 rounded-2xl bg-[#E8F7F1] border border-[#A8DBC8] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#A8DBC8] flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-[#234E52]" />
                    </div>
                    <div className="text-xs">
                      <span className="font-extrabold text-[#234E52]">Tier Discount Applied! </span>
                      <span className="text-[#234E52]">
                        You unlocked ₱{currentQuote.rate}/day ({currentQuote.tierLabel}).
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-[#FAFAF7] border border-[#E8E4F0] flex items-center justify-between text-xs text-[#6B6B8A]">
                    <span>Tip: Rent for 2+ days to unlock lower daily rates (down to <strong>₱{selectedCamera.bulkRate || 350}/day</strong> on 6+ days for {selectedCamera.shortName}).</span>
                  </div>
                )}

              </div>

              {/* Quote Breakdown Output Column (Stacks naturally on mobile) */}
              <div className="w-full lg:col-span-5 bg-[#FAFAF7] rounded-[28px] border-2 border-[#E8E4F0] p-6 flex flex-col justify-between">

                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#E8E4F0]">
                    <span className="text-xs font-black uppercase text-[#6B6B8A]">Price Breakdown</span>
                    <span className="text-xs font-bold text-[#1A1A2E] bg-white px-2.5 py-1 rounded-full border border-[#E8E4F0]">
                      {currentQuote.days} {currentQuote.days === 1 ? 'Day' : 'Days'} Total
                    </span>
                  </div>

                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-[#6B6B8A]">
                        Base Rental ({currentQuote.days}d × ₱{currentQuote.rate})
                      </span>
                      <span className="font-bold text-[#1A1A2E]">
                        ₱{currentQuote.rentalTotal.toLocaleString()}
                      </span>
                    </div>

                    {currentQuote.meetupFee > 0 && (
                      <div className="flex justify-between items-center text-[#553C9A]">
                        <span>Meetup Handling Fee</span>
                        <span className="font-bold">
                          +₱{currentQuote.meetupFee.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {calcHandover === 'courier' && (
                      <div className="flex justify-between items-center text-[#C05621] text-xs">
                        <span>Grab Express Delivery Fee</span>
                        <span className="font-semibold">Paid by Renter to Rider</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1 text-[#6B6B8A]">
                        <span>Security Deposit</span>
                        <span className="text-[10px] text-[#38A169] font-bold">(100% Refundable)</span>
                      </div>
                      <span className="font-bold text-[#1A1A2E]">
                        ₱{currentQuote.deposit.toLocaleString()}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-[#E8E4F0] flex justify-between items-center">
                      <span className="font-extrabold text-[#1A1A2E]">Total Package Value</span>
                      <span className="font-black text-xl text-[#1A1A2E]">
                        ₱{currentQuote.totalPackageValue.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Payment Schedule Card */}
                  <div className="mt-6 p-4 rounded-2xl bg-white border border-[#E8E4F0] space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#553C9A]">1. Pay Now via GCash (Reservation):</span>
                      <span className="font-extrabold text-[#553C9A] px-2 py-0.5 rounded bg-[#EDE8FC]">
                        ₱{DOWNPAYMENT_FEE} (Credited to rental)
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-[#1A1A2E] block">2. Total Payment on Handover:</span>
                        <span className="text-[10px] text-[#6B6B8A]">
                          ₱{currentQuote.remainingRentalBalance.toLocaleString()} rental bal + ₱{currentQuote.deposit.toLocaleString()} deposit{currentQuote.meetupFee > 0 ? ' + ₱200 meetup' : ''}
                        </span>
                      </div>
                      <span className="font-extrabold text-sm text-[#1A1A2E]">
                        ₱{currentQuote.paymentOnHandover.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1.5 border-t border-[#E8E4F0]">
                      <div>
                        <span className="font-bold text-[#2F855A] block">3. Security Deposit Refund:</span>
                        <span className="text-[10px] text-[#2F855A]/80">Sent to GCash within 24 hours of inspection</span>
                      </div>
                      <span className="font-extrabold text-[#2F855A]">
                        + ₱{currentQuote.deposit.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    disabled={calcConflict.hasConflict}
                    onClick={() => handleOpenBookingModal()}
                    className={`w-full min-h-[50px] py-3.5 px-6 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${calcConflict.hasConflict
                      ? 'bg-gray-200 text-gray-400 border-2 border-gray-300 cursor-not-allowed shadow-none'
                      : 'bg-[#1A1A2E] text-white hover:bg-[#6B46C1] shadow-md hover:shadow-lg cursor-pointer'
                      }`}
                  >
                    {calcConflict.hasConflict ? (
                      <>
                        <CalendarX className="w-4 h-4 text-red-500" />
                        <span>Dates Reserved — Cannot Book</span>
                      </>
                    ) : (
                      <>
                        <span>Reserve These Dates</span>
                        <ArrowRight className="w-4 h-4 text-[#F5C6A8]" />
                      </>
                    )}
                  </button>
                  <p className="mt-2 text-center text-[11px] text-[#6B6B8A]">
                    {calcConflict.hasConflict
                      ? 'Please select an open date window above to proceed with reservation.'
                      : 'No obligation until downpayment is verified in GCash.'}
                  </p>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          TERMS AND CONDITIONS ACCORDION SECTION
      ───────────────────────────────────────────────────────────── */}
      <section id="terms" className="py-16 sm:py-20 px-4 sm:px-8 bg-[#FAFAF7] border-b border-[#E8E4F0]">
        <div className="max-w-4xl mx-auto">

          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF0E7] text-[#C05621] border border-[#F5C6A8] text-xs font-bold mb-3">
              <FileText className="w-3.5 h-3.5 text-[#DD6B20]" />
              <span>Guidelines for Smooth Rentals</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1A1A2E] tracking-tight">
              Terms &amp; Conditions
            </h2>
            <p className="mt-2 text-base text-[#6B6B8A] font-medium">
              Transparent, straightforward rental policies. Please review these terms before booking.
            </p>
          </div>

          <div className="space-y-3">
            {TERMS_AND_CONDITIONS_DATA.map((clause, index) => {
              const isOpen = openTermsClause === index;
              return (
                <div
                  key={clause.number}
                  className={`rounded-2xl border-2 transition-all ${isOpen
                    ? 'border-[#1A1A2E] bg-white shadow-[3px_3px_0px_#1A1A2E]'
                    : 'border-[#E8E4F0] bg-white hover:border-[#C9B8F0]'
                    }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenTermsClause(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-[#EDE8FC] text-[#553C9A] flex items-center justify-center font-black text-xs shrink-0">
                        {clause.number}
                      </span>
                      <div>
                        <span className="font-extrabold text-sm sm:text-base text-[#1A1A2E] block">
                          {clause.title}
                        </span>
                        <span className="text-[11px] text-[#6B6B8A] font-medium hidden sm:block">
                          {clause.highlight}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform ${isOpen ? 'rotate-180 bg-[#C9B8F0] text-[#1A1A2E]' : 'bg-[#FAFAF7] text-[#6B6B8A]'
                        }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-[#4A4A68] space-y-2 border-t border-[#E8E4F0]/60 pt-3 leading-relaxed">
                      {clause.content.map((p, idx) => (
                        <p key={idx} className="flex items-start gap-2">
                          <span className="text-[#6B46C1] font-bold mt-0.5">•</span>
                          <span>{p}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 p-4 rounded-2xl bg-[#EDE8FC] border border-[#C9B8F0] text-center text-xs text-[#553C9A] font-semibold">
            {TERMS_ACKNOWLEDGEMENT_TEXT}
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. FAQ ACCORDION SECTION (8 Interactive Items)
      ───────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-16 sm:py-20 px-4 sm:px-8 bg-white border-t border-[#E8E4F0]">
        <div className="max-w-4xl mx-auto">

          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F7F1] text-[#234E52] border border-[#A8DBC8] text-xs font-bold mb-3">
              <HelpCircle className="w-3.5 h-3.5 text-[#319795]" />
              <span>Got Questions?</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1A1A2E] tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-base text-[#6B6B8A] font-medium">
              Everything about safety, student KYC, security deposits, and hassle-free returns.
            </p>
          </div>

          <div className="space-y-3.5">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className={`rounded-2xl border-2 transition-all ${isOpen
                    ? 'border-[#1A1A2E] bg-[#FAFAF7] shadow-[3px_3px_0px_#1A1A2E]'
                    : 'border-[#E8E4F0] bg-white hover:border-[#C9B8F0]'
                    }`}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span className="font-extrabold text-base text-[#1A1A2E]">
                      {faq.q}
                    </span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform ${isOpen ? 'rotate-180 bg-[#C9B8F0] text-[#1A1A2E]' : 'bg-[#FAFAF7] text-[#6B6B8A]'
                      }`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-sm text-[#6B6B8A] leading-relaxed animate-fadeIn border-t border-[#E8E4F0]/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Need More Assistance */}
          <div className="mt-12 text-center p-6 rounded-3xl bg-[#FEF0E7] border border-[#F5C6A8] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <div className="font-bold text-sm text-[#C05621]">Have a custom shoot schedule or urgent inquiry?</div>
              <div className="text-xs text-[#6B6B8A]">Our team answers within 10 minutes on Instagram & Messenger.</div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href="https://www.instagram.com/packandfilm.ph/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-full bg-[#1A1A2E] text-white font-bold text-xs hover:bg-[#553C9A] transition-colors flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#F5C6A8]" />
                <span>DM on Instagram</span>
              </a>
              <a
                href="https://www.facebook.com/people/Pack-and-Film/61595302043810/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-full bg-white border border-[#F5C6A8] text-[#C05621] font-bold text-xs hover:bg-[#FEF0E7] transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Facebook @Pack and Film</span>
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          FOOTER
      ───────────────────────────────────────────────────────────── */}
      <footer className="mt-auto bg-[#1A1A2E] text-white py-12 px-4 sm:px-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">

          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white p-0.5 flex items-center justify-center shadow-md overflow-hidden shrink-0">
                <img
                  src="/logo.png"
                  alt="PackAndFilm Logo"
                  className="w-full h-full object-contain scale-105"
                />
              </div>
              <span className="font-black text-xl tracking-tight">PackAndFilm</span>
            </div>
            <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
              Metro Manila’s favorite pastel aesthetic camera rental for DJI Osmo Pocket 3, Canon PowerShot G7 X Mark III &amp; Fujifilm X100VI. Designed for creators, concert-goers, and vloggers. Mag-vlog na, wag nang mag-ipon.
            </p>
            <div className="pt-2 text-xs text-gray-500 font-mono">
              Meetups at SM East Ortigas, Bridgetowne &amp; Opus Mall (₱200 fee) • Grab Express Delivery ONLY across Metro Manila (8:00 AM – 8:00 PM).
            </div>
          </div>

          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#C9B8F0] mb-3">
              Quick Links
            </div>
            <ul className="space-y-2 text-xs text-gray-300">
              <li><a href="#bag" className="hover:text-white transition-colors">What&apos;s in the Bag</a></li>
              <li><a href="#how" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing & Calculator</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#F5C6A8] mb-3">
              Community & Socials
            </div>
            <div className="space-y-2 text-xs text-gray-300">
              <p>
                <a
                  href="https://www.instagram.com/packandfilm.ph/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-white hover:text-[#F5C6A8] transition-colors inline-flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#F5C6A8]" />
                  <span>Instagram: @packandfilm.ph</span>
                </a>
              </p>
              <p>
                <a
                  href="https://www.facebook.com/people/Pack-and-Film/61595302043810/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-white hover:text-[#C9B8F0] transition-colors inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#C9B8F0]" />
                  <span>Facebook: Pack and Film</span>
                </a>
              </p>
              <p className="text-gray-400">Email: rentals@packandfilm.ph</p>
              <p className="text-gray-400">GCash: 0906 417 8301</p>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <div>© {new Date().getFullYear()} PackAndFilm Philippines. All rights reserved.</div>
          <div className="flex flex-wrap items-center gap-4">
            <span>Terms of Rental</span>
            <span>Privacy Policy</span>
            <span>KYC Compliance</span>
          </div>
        </div>
      </footer>

      {/* ─────────────────────────────────────────────────────────────
          7. MULTI-STEP BOOKING MODAL (STATE MACHINE: 6 STEPS)
      ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          {/* Hardware-accelerated static backdrop layer */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity will-change-[opacity]"
            onClick={() => setIsModalOpen(false)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-2xl bg-[#FAFAF7] rounded-[32px] border-2 border-[#1A1A2E] shadow-[8px_8px_0px_0px_#1A1A2E] overflow-hidden flex flex-col max-h-[92vh] z-10 isolate transform-gpu">

            {/* Modal Header */}
            <div className="px-6 py-4 bg-white border-b border-[#E8E4F0] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#EDE8FC] border border-[#C9B8F0] p-0.5 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                  <img
                    src="/logo.png"
                    alt="PackAndFilm"
                    className="w-full h-full object-contain scale-105"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-lg text-[#1A1A2E]">
                      {modalStep === 6 ? 'Booking Confirmed' : `Book Your ${modalCamera.shortName}`}
                    </span>
                    {modalStep < 6 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EDE8FC] text-[#553C9A]">
                        Step {modalStep} of 5
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6B6B8A]">
                    {modalStep === 1 && 'Confirm rental duration & dates (8:00 AM – 8:00 PM)'}
                    {modalStep === 2 && 'Choose Meetup (₱200 fee) or Grab Express Delivery'}
                    {modalStep === 3 && 'ID verification & document uploads (confidential)'}
                    {modalStep === 4 && 'Renter contact details & refund info'}
                    {modalStep === 5 && 'GCash downpayment (₱300) & Terms agreement'}
                    {modalStep === 6 && 'Ready for handover! Check your details'}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-full bg-[#FAFAF7] border border-[#E8E4F0] hover:bg-[#FEF0E7] hover:border-[#1A1A2E] flex items-center justify-center text-[#1A1A2E] transition-all cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Progress Bar (Steps 1 to 5) */}
            {modalStep < 6 && (
              <div className="w-full bg-[#E8E4F0] h-1.5 flex">
                <div
                  className="bg-gradient-to-r from-[#C9B8F0] via-[#F5C6A8] to-[#A8DBC8] h-full transition-all duration-300"
                  style={{ width: `${(modalStep / 5) * 100}%` }}
                />
              </div>
            )}

            {/* Modal Scrollable Body */}
            <div ref={modalBodyRef} className="p-6 overflow-y-auto space-y-6 flex-1">

              {/* ───────────────── STEP 1: DATES & PRICING BREAKDOWN ───────────────── */}
              {modalStep === 1 && (
                <div className="space-y-5 animate-fadeIn">
                  {/* Camera Model Banner / Switcher */}
                  <div className="p-3.5 bg-white rounded-2xl border border-[#E8E4F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#6B6B8A] block">Selected Camera Unit</span>
                      <span className="text-sm font-black text-[#1A1A2E]">{modalCamera.name}</span>
                    </div>
                    <div data-field-key="cameraId" className="w-full sm:w-64">
                      <CustomSelect
                        value={booking.cameraId}
                        options={CAMERAS.map(c => ({
                          value: c.id,
                          label: c.shortName,
                          badge: c.isAvailable ? `₱${c.standardRate}/d` : 'Coming Soon',
                          sublabel: c.isAvailable ? c.name : `${c.name} (Upcoming Lineup)`,
                          disabled: !c.isAvailable,
                        }))}
                        size="sm"
                        hasError={!!validationErrors.cameraId}
                        errorMessage={validationErrors.cameraId}
                        onChange={(newId) => {
                          const targetCam = CAMERAS.find(c => c.id === newId);
                          if (!targetCam || !targetCam.isAvailable) {
                            showToast(`✨ ${targetCam?.name || 'This camera'} is coming soon and cannot be booked yet.`, 'info');
                            return;
                          }
                          setBooking(b => ({ ...b, cameraId: newId }));
                          setSelectedCameraId(newId);
                          clearFieldError('cameraId');
                        }}
                      />
                    </div>
                  </div>

                  {/* Camera Stock Reassurance Note */}
                  <div className="p-3 rounded-2xl bg-[#E8F7F1]/80 border border-[#A8DBC8] flex items-center justify-between gap-3 text-xs text-[#234E52]">
                    <div className="flex items-center gap-2 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-[#38A169] shrink-0" />
                      <span>Selected Rental Unit: {modalCamera.name}</span>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white text-[#234E52] border border-[#A8DBC8] shrink-0">
                      In Stock
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div data-field-key="startDate">
                      <CustomDatePicker
                        label="Start Date (Pickup / Delivery)"
                        isRequired={true}
                        placeholder="Select pickup date"
                        value={booking.startDate}
                        minDate={todayStr}
                        rangeStart={booking.startDate}
                        rangeEnd={booking.endDate}
                        bookedRanges={bookings.filter(b => b.cameraId === booking.cameraId)}
                        hasConflict={modalConflict.hasConflict}
                        conflictMessage={modalConflict.message}
                        hasError={!!validationErrors.startDate}
                        errorMessage={validationErrors.startDate}
                        onChange={(val) => {
                          setBooking(b => ({
                            ...b,
                            startDate: val,
                            endDate: val > b.endDate ? val : b.endDate,
                          }));
                          clearFieldError('startDate');
                          clearFieldError('endDate');
                          clearFieldError('dateConflict');
                        }}
                      />
                    </div>

                    <div data-field-key="endDate">
                      <CustomDatePicker
                        label="End Date (Return Date)"
                        isRequired={true}
                        placeholder="Select return date"
                        value={booking.endDate}
                        minDate={booking.startDate || todayStr}
                        rangeStart={booking.startDate}
                        rangeEnd={booking.endDate}
                        isEndDate={true}
                        bookedRanges={bookings.filter(b => b.cameraId === booking.cameraId)}
                        hasConflict={modalConflict.hasConflict}
                        conflictMessage={modalConflict.message}
                        hasError={!!validationErrors.endDate}
                        errorMessage={validationErrors.endDate}
                        onChange={(val) => {
                          setBooking(b => ({ ...b, endDate: val }));
                          clearFieldError('endDate');
                          clearFieldError('dateConflict');
                        }}
                      />
                    </div>
                  </div>

                  {/* Rental Hours Notice Banner */}
                  <div className="p-3 rounded-2xl bg-[#EDE8FC] border border-[#C9B8F0] flex items-center justify-between gap-3 text-xs text-[#553C9A]">
                    <div className="flex items-center gap-2 font-bold">
                      <Clock className="w-4 h-4 text-[#553C9A] shrink-0" />
                      <span>Rental Period: 8:00 AM – 8:00 PM ONLY</span>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white text-[#553C9A] border border-[#C9B8F0] shrink-0">
                      Standard Schedule
                    </span>
                  </div>

                  {/* Modal Conflict Alert or Green Availability Check */}
                  {modalConflict.hasConflict ? (
                    <div data-field-key="dateConflict" className="p-3.5 rounded-2xl bg-[#FFF5F5] border-2 border-[#FEB2B2] text-[#9B2C2C] space-y-2 animate-fadeIn">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#FED7D7] flex items-center justify-center shrink-0 mt-0.5">
                          <CalendarX className="w-4 h-4 text-[#C53030]" />
                        </div>
                        <div>
                          <div className="font-black text-xs text-[#9B2C2C]">
                            ⚠️ Date Conflict: Selected Dates Are Reserved!
                          </div>
                          <p className="text-[11px] text-[#C53030] mt-0.5 leading-relaxed font-medium">
                            {modalConflict.message}
                          </p>
                          <div className="text-[10px] text-[#9B2C2C] mt-0.5 font-bold">
                            📍 Assigned: {modalConflict.conflictingBooking?.hub} ({modalConflict.conflictingBooking?.status})
                          </div>
                        </div>
                      </div>

                      <div className="pt-1.5 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleModalAutoPickNextAvailable}
                          className="px-3 py-1.5 rounded-xl bg-[#E53E3E] text-white text-xs font-bold hover:bg-[#C53030] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Auto-Pick Next Available Dates ➔</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowScheduleModal(true)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-[#FEB2B2] text-xs font-bold text-[#9B2C2C] hover:bg-[#FED7D7] transition-colors cursor-pointer"
                        >
                          View Booked Calendar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-[#E8F7F1] border border-[#A8DBC8] flex items-center justify-between text-xs text-[#234E52]">
                      <div className="flex items-center gap-1.5">
                        <CalendarCheck className="w-4 h-4 text-[#38A169] shrink-0" />
                        <span className="font-bold">Dates 100% Available! Proceed to Handover.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowScheduleModal(true)}
                        className="text-[11px] font-bold text-[#234E52] hover:text-[#1A1A2E] underline cursor-pointer"
                      >
                        Busy Calendar
                      </button>
                    </div>
                  )}

                  {/* Summary Card */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E8E4F0] space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#6B6B8A]">Rental Duration</span>
                      <span className="font-bold text-[#1A1A2E]">
                        {modalQuote.days} {modalQuote.days === 1 ? 'Day' : 'Days'} • {modalQuote.tierLabel}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#6B6B8A]">
                        Rental Rate {modalQuote.isBulk && '(Tier Discount Active!)'}
                      </span>
                      <span className="font-bold text-[#1A1A2E]">₱{modalQuote.rate}/day</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#6B6B8A]">Base Rental Cost</span>
                      <span className="font-bold text-[#1A1A2E]">₱{modalQuote.rentalTotal.toLocaleString()}</span>
                    </div>

                    {booking.handoverMode === 'meetup' && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#6B6B8A]">Meet-up Handling Fee</span>
                        <span className="font-bold text-[#553C9A]">₱200</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[#6B6B8A]">Refundable Security Deposit</span>
                        <span className="text-[10px] text-[#2F855A] font-extrabold bg-[#E8F7F1] px-1.5 py-0.2 rounded border border-[#A8DBC8]">
                          100% Refundable
                        </span>
                      </div>
                      <span className="font-bold text-[#2F855A]">
                        ₱{modalQuote.deposit.toLocaleString()}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-[#E8E4F0] flex items-center justify-between text-xs font-black">
                      <span className="text-[#1A1A2E]">Total Package Value</span>
                      <span className="text-sm text-[#1A1A2E]">₱{modalQuote.total.toLocaleString()}</span>
                    </div>

                    {/* Step 1 Clear Payment Breakdown */}
                    <div className="pt-2 border-t border-dashed border-[#E8E4F0] grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-xl bg-[#007DFE]/10 border border-[#007DFE]/20">
                        <span className="block font-black text-xs text-[#007DFE]">1. Pay Now via GCash</span>
                        <span className="block font-black text-sm text-[#007DFE] mt-0.5">₱{DOWNPAYMENT_FEE}</span>
                        <span className="block text-[10px] text-[#6B6B8A] mt-0.5 leading-tight">Credited toward rental fee</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#FAFAF7] border border-[#1A1A2E]/20">
                        <span className="block font-black text-xs text-[#1A1A2E]">2. Pay on Handover</span>
                        <span className="block font-black text-sm text-[#1A1A2E] mt-0.5">₱{modalQuote.paymentOnHandover.toLocaleString()}</span>
                        <span className="block text-[10px] text-[#6B6B8A] mt-0.5 leading-tight">
                          ₱{modalQuote.remainingRentalBalance.toLocaleString()} bal + ₱{modalQuote.deposit.toLocaleString()} dep{modalQuote.meetupFee > 0 ? ' + ₱200 meetup' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ───────────────── STEP 2: HANDOVER MODE ───────────────── */}
              {modalStep === 2 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-[#6B6B8A]">
                      Select Your Preferred Handover Option
                    </span>
                    <span className="text-[11px] font-extrabold text-[#553C9A] bg-[#EDE8FC] px-2 py-0.5 rounded-full">
                      8:00 AM – 8:00 PM ONLY
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Meetup Option */}
                    <div
                      onClick={() => setBooking(b => ({ ...b, handoverMode: 'meetup' }))}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${booking.handoverMode === 'meetup'
                        ? 'border-[#1A1A2E] bg-[#EDE8FC] shadow-[3px_3px_0px_#1A1A2E]'
                        : 'border-[#E8E4F0] bg-white hover:border-[#C9B8F0]'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-[#1A1A2E]">Meet-up (₱200 Fee)</span>
                        {booking.handoverMode === 'meetup' && <Check className="w-4 h-4 text-[#553C9A]" />}
                      </div>
                      <p className="mt-1 text-xs text-[#6B6B8A]">
                        SM East Ortigas, Bridgetowne, or Opus Mall.
                      </p>
                      <div className="mt-3 text-xs font-bold text-[#553C9A] flex items-center justify-between">
                        <span>₱200 handling fee applies</span>
                        <span className="text-[10px] text-[#2F855A] bg-[#E8F7F1] px-1.5 py-0.5 rounded">
                          ₱{modalQuote.deposit.toLocaleString()} Deposit
                        </span>
                      </div>
                    </div>

                    {/* Courier Option */}
                    <div
                      onClick={() => setBooking(b => ({ ...b, handoverMode: 'courier' }))}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${booking.handoverMode === 'courier'
                        ? 'border-[#1A1A2E] bg-[#FEF0E7] shadow-[3px_3px_0px_#1A1A2E]'
                        : 'border-[#E8E4F0] bg-white hover:border-[#F5C6A8]'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-[#1A1A2E]">Grab Express Delivery</span>
                        {booking.handoverMode === 'courier' && <Check className="w-4 h-4 text-[#C05621]" />}
                      </div>
                      <p className="mt-1 text-xs text-[#6B6B8A]">
                        Grab Express ONLY. Owner books rider for release & return; renter shoulders fees.
                      </p>
                      <div className="mt-3 text-xs font-bold text-[#C05621] flex items-center justify-between">
                        <span>Metro Manila delivery</span>
                        <span className="text-[10px] text-[#2F855A] bg-[#E8F7F1] px-1.5 py-0.5 rounded">
                          ₱{modalQuote.deposit.toLocaleString()} Deposit
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Location Specific Input */}
                  {booking.handoverMode === 'meetup' ? (
                    <div data-field-key="meetupLocation">
                      <CustomSelect
                        label="Choose Meet-up Hub (₱200 Handling Fee):"
                        isRequired={true}
                        value={booking.meetupLocation}
                        options={PASIG_MEETUP_HUBS.map(hub => ({ value: hub, label: `${hub} (₱200 handling fee)` }))}
                        hasError={!!validationErrors.meetupLocation}
                        errorMessage={validationErrors.meetupLocation}
                        onChange={(val) => {
                          setBooking(b => ({ ...b, meetupLocation: val }));
                          clearFieldError('meetupLocation');
                        }}
                      />
                      <p className="mt-1.5 text-[11px] text-[#6B6B8A]">
                        Available at SM East Ortigas, Bridgetowne, or Opus Mall (8:00 AM – 8:00 PM). Exact landmark verified prior to meet-up.
                      </p>
                    </div>
                  ) : (
                    <div data-field-key="deliveryAddress">
                      <label className="block text-xs font-bold text-[#1A1A2E] mb-1.5 flex items-center gap-1">
                        <span>Delivery Address for Grab Express Delivery:</span>
                        <span className="text-red-500 font-bold">*</span>
                      </label>
                      <textarea
                        rows={2}
                        placeholder="House/Condo Unit, Street, Barangay, City, Landmark (Metro Manila)"
                        value={booking.deliveryAddress}
                        onChange={(e) => {
                          setBooking(b => ({ ...b, deliveryAddress: e.target.value }));
                          clearFieldError('deliveryAddress');
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-xs sm:text-sm font-medium transition-colors ${validationErrors.deliveryAddress
                          ? 'border-red-400 bg-[#FFF5F5] focus:outline-none ring-2 ring-red-200'
                          : 'border-[#E8E4F0] focus:border-[#1A1A2E]'
                          }`}
                      />
                      {validationErrors.deliveryAddress && (
                        <p className="mt-1 text-xs text-red-600 font-bold flex items-center gap-1">
                          <span>⚠️</span> {validationErrors.deliveryAddress}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-[#6B6B8A]">
                        Grab Express ONLY (8:00 AM – 8:00 PM). Owner books the rider for both release and return of the device; renter shoulders all delivery fees.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ───────────────── STEP 3: RENTAL REQUIREMENTS & VERIFICATION ───────────────── */}
              {modalStep === 3 && (
                <div className="space-y-4 animate-fadeIn">

                  {/* Reassurance Banner */}
                  <div className="p-3.5 rounded-2xl bg-[#EDE8FC] border border-[#C9B8F0] flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-[#553C9A] shrink-0 mt-0.5" />
                    <div className="text-xs text-[#553C9A] leading-relaxed">
                      <strong>Confidential Verification:</strong> Pack and Film camera rental requires renters to submit a digital copy of valid IDs for identity verification. We keep this confidentially until your equipment is safely returned, after which copies are securely deleted.
                    </div>
                  </div>

                  {/* Student Applicant Toggle */}
                  <div className="p-3.5 rounded-2xl bg-[#E8F7F1] border-2 border-[#A8DBC8] flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <GraduationCap className="w-5 h-5 text-[#234E52] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-black text-[#234E52] block">
                          Applying as a Student?
                        </span>
                        <span className="text-[11px] text-[#234E52]/80 leading-tight block mt-0.5">
                          Students may submit: Valid Student ID + Current (COR) + Parent/Guardian Government ID.
                        </span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={booking.isStudentExemption}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setBooking(b => ({
                            ...b,
                            isStudentExemption: checked,
                            id1Type: checked ? 'Valid Student ID' : 'Philippine Passport',
                          }));
                          clearFieldError('id2File');
                          clearFieldError('id2BackFile');
                          clearFieldError('contact1IdFile');
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#38A169]"></div>
                    </label>
                  </div>

                  {/* 1A. Primary ID (Front & Back) */}
                  <div className={`p-3.5 rounded-2xl bg-white border-2 space-y-2.5 transition-colors ${validationErrors.id1File || validationErrors.id1BackFile ? 'border-red-400 bg-[#FFF5F5]/40 shadow-sm' : 'border-[#E8E4F0]'
                    }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#1A1A2E] flex items-center gap-1">
                        <span>1A. {booking.isStudentExemption ? 'Valid Student ID (Front & Back)' : 'Primary Valid Government ID (Front & Back)'}</span>
                        <span className="text-red-500 font-bold">*</span>
                        {(booking.id1File && (booking.isStudentExemption || booking.id1BackFile)) && (
                          <span className="text-[10px] font-bold text-[#38A169] bg-[#E8F7F1] px-1.5 py-0.5 rounded">Uploaded ✓</span>
                        )}
                      </span>
                      <div className="w-full sm:w-56">
                        <CustomSelect
                          value={booking.id1Type}
                          options={booking.isStudentExemption ? [
                            { value: 'Valid Student ID', label: 'Valid Student ID' }
                          ] : [
                            { value: 'Philippine Passport', label: 'Philippine Passport' },
                            { value: "Driver's License", label: "Driver's License" },
                            { value: 'National ID / UMID', label: 'National ID / UMID' },
                            { value: 'PRC ID', label: 'PRC ID' },
                            { value: 'Postal ID / SSS / Voter', label: 'Postal ID / SSS / Voter' }
                          ]}
                          size="sm"
                          onChange={(val) => {
                            setBooking(b => ({ ...b, id1Type: val }));
                            clearFieldError('id1Type');
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {/* Front Upload */}
                      <div data-field-key="id1File">
                        <label className={`cursor-pointer w-full px-3 py-2 rounded-xl border-2 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs ${validationErrors.id1File
                          ? 'bg-[#FFF5F5] border-red-400 text-red-600 ring-2 ring-red-100'
                          : 'bg-[#FAFAF7] border-[#C9B8F0] text-[#6B46C1] hover:bg-[#EDE8FC]'
                          }`}>
                          <Upload className="w-3.5 h-3.5" />
                          <span className="truncate flex items-center gap-1">
                            <span>{booking.id1File ? 'Change Front Photo' : 'Upload Front Photo'}</span>
                            <span className="text-red-500 font-bold">*</span>
                          </span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => handleRealFileUpload(e, 'id1File', 'id1Name')}
                          />
                        </label>
                        {booking.id1File && (
                          <div className="flex items-center justify-between text-[11px] pt-1 px-1">
                            <span className="text-[#38A169] font-bold truncate max-w-[150px]">{booking.id1Name || 'Front Attached'}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile('id1File', 'id1Name')}
                              className="text-red-500 hover:text-red-700 underline text-[10px]"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                        {validationErrors.id1File && (
                          <p className="text-xs text-red-600 font-bold flex items-center gap-1 pt-1">
                            <span>⚠️</span> {validationErrors.id1File}
                          </p>
                        )}
                      </div>

                      {/* Back Upload */}
                      <div data-field-key="id1BackFile">
                        <label className={`cursor-pointer w-full px-3 py-2 rounded-xl border-2 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs ${validationErrors.id1BackFile
                          ? 'bg-[#FFF5F5] border-red-400 text-red-600 ring-2 ring-red-100'
                          : 'bg-[#FAFAF7] border-[#C9B8F0] text-[#6B46C1] hover:bg-[#EDE8FC]'
                          }`}>
                          <Upload className="w-3.5 h-3.5" />
                          <span className="truncate flex items-center gap-1">
                            <span>{booking.id1BackFile ? 'Change Back Photo' : 'Upload Back Photo'}</span>
                            <span className="text-red-500 font-bold">*</span>
                          </span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => handleRealFileUpload(e, 'id1BackFile', 'id1BackName')}
                          />
                        </label>
                        {booking.id1BackFile && (
                          <div className="flex items-center justify-between text-[11px] pt-1 px-1">
                            <span className="text-[#38A169] font-bold truncate max-w-[150px]">{booking.id1BackName || 'Back Attached'}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile('id1BackFile', 'id1BackName')}
                              className="text-red-500 hover:text-red-700 underline text-[10px]"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                        {validationErrors.id1BackFile && (
                          <p className="text-xs text-red-600 font-bold flex items-center gap-1 pt-1">
                            <span>⚠️</span> {validationErrors.id1BackFile}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 1B. Secondary ID (Front & Back) OR Current COR */}
                  <div className={`p-3.5 rounded-2xl bg-white border-2 space-y-2.5 transition-colors ${validationErrors.id2File || validationErrors.id2BackFile ? 'border-red-400 bg-[#FFF5F5]/40 shadow-sm' : 'border-[#E8E4F0]'
                    }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1A1A2E] flex items-center gap-1">
                        <span>1B. {booking.isStudentExemption ? 'Current Certificate of Registration (COR)' : 'Secondary Valid ID (Front & Back)'}</span>
                        <span className="text-red-500 font-bold">*</span>
                        {(booking.id2File && (booking.isStudentExemption || booking.id2BackFile)) && (
                          <span className="text-[10px] font-bold text-[#38A169] bg-[#E8F7F1] px-1.5 py-0.5 rounded">Uploaded ✓</span>
                        )}
                      </span>
                      <span className="text-[10px] text-[#6B6B8A] font-semibold">
                        {booking.isStudentExemption ? 'Current Semester' : 'Address & Signature'}
                      </span>
                    </div>

                    {booking.isStudentExemption ? (
                      <div data-field-key="id2File">
                        <label className={`cursor-pointer w-full px-3.5 py-2 rounded-xl border-2 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs ${validationErrors.id2File
                          ? 'bg-[#FFF5F5] border-red-400 text-red-600 ring-2 ring-red-100'
                          : 'bg-[#FAFAF7] border-[#F5C6A8] text-[#DD6B20] hover:bg-[#FEF0E7]'
                          }`}>
                          <Upload className="w-3.5 h-3.5" />
                          <span className="flex items-center gap-1">
                            <span>{booking.id2File ? 'Change Certificate of Registration (COR)' : 'Upload Current (COR) PDF or Photo'}</span>
                            <span className="text-red-500 font-bold">*</span>
                          </span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => handleRealFileUpload(e, 'id2File', 'id2Name')}
                          />
                        </label>
                        {booking.id2File && (
                          <div className="flex items-center justify-between text-[11px] pt-1 px-1">
                            <span className="text-[#38A169] font-bold truncate max-w-[200px]">{booking.id2Name || 'COR Attached'}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile('id2File', 'id2Name')}
                              className="text-red-500 hover:text-red-700 underline text-[10px]"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                        {validationErrors.id2File && (
                          <p className="text-xs text-red-600 font-bold flex items-center gap-1 pt-1">
                            <span>⚠️</span> {validationErrors.id2File}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {/* Front Upload */}
                        <div data-field-key="id2File">
                          <label className={`cursor-pointer w-full px-3 py-2 rounded-xl border-2 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs ${validationErrors.id2File
                            ? 'bg-[#FFF5F5] border-red-400 text-red-600 ring-2 ring-red-100'
                            : 'bg-[#FAFAF7] border-[#F5C6A8] text-[#DD6B20] hover:bg-[#FEF0E7]'
                            }`}>
                            <Upload className="w-3.5 h-3.5" />
                            <span className="truncate flex items-center gap-1">
                              <span>{booking.id2File ? 'Change Front Photo' : 'Upload Secondary Front'}</span>
                              <span className="text-red-500 font-bold">*</span>
                            </span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={(e) => handleRealFileUpload(e, 'id2File', 'id2Name')}
                            />
                          </label>
                          {booking.id2File && (
                            <div className="flex items-center justify-between text-[11px] pt-1 px-1">
                              <span className="text-[#38A169] font-bold truncate max-w-[150px]">{booking.id2Name || 'Front Attached'}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveFile('id2File', 'id2Name')}
                                className="text-red-500 hover:text-red-700 underline text-[10px]"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                          {validationErrors.id2File && (
                            <p className="text-xs text-red-600 font-bold flex items-center gap-1 pt-1">
                              <span>⚠️</span> {validationErrors.id2File}
                            </p>
                          )}
                        </div>

                        {/* Back Upload */}
                        <div data-field-key="id2BackFile">
                          <label className={`cursor-pointer w-full px-3 py-2 rounded-xl border-2 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs ${validationErrors.id2BackFile
                            ? 'bg-[#FFF5F5] border-red-400 text-red-600 ring-2 ring-red-100'
                            : 'bg-[#FAFAF7] border-[#F5C6A8] text-[#DD6B20] hover:bg-[#FEF0E7]'
                            }`}>
                            <Upload className="w-3.5 h-3.5" />
                            <span className="truncate flex items-center gap-1">
                              <span>{booking.id2BackFile ? 'Change Back Photo' : 'Upload Secondary Back'}</span>
                              <span className="text-red-500 font-bold">*</span>
                            </span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={(e) => handleRealFileUpload(e, 'id2BackFile', 'id2BackName')}
                            />
                          </label>
                          {booking.id2BackFile && (
                            <div className="flex items-center justify-between text-[11px] pt-1 px-1">
                              <span className="text-[#38A169] font-bold truncate max-w-[150px]">{booking.id2BackName || 'Back Attached'}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveFile('id2BackFile', 'id2BackName')}
                                className="text-red-500 hover:text-red-700 underline text-[10px]"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                          {validationErrors.id2BackFile && (
                            <p className="text-xs text-red-600 font-bold flex items-center gap-1 pt-1">
                              <span>⚠️</span> {validationErrors.id2BackFile}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 1C. Handwritten Authorization Slip + IDs */}
                  <div data-field-key="authorizationSlipFile" className={`p-3.5 rounded-2xl bg-white border-2 space-y-1.5 transition-colors ${validationErrors.authorizationSlipFile ? 'border-red-400 bg-[#FFF5F5]/40 shadow-sm' : 'border-[#E8E4F0]'
                    }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1A1A2E] flex items-center gap-1">
                        <span>1C. Handwritten Authorization Paper Photo with IDs</span>
                        <span className="text-red-500 font-bold">*</span>
                        {booking.authorizationSlipFile && <span className="text-[10px] font-bold text-[#38A169] bg-[#E8F7F1] px-1.5 py-0.5 rounded">Uploaded ✓</span>}
                      </span>
                      <span className="text-[10px] text-[#553C9A] font-extrabold bg-[#EDE8FC] px-2 py-0.5 rounded">
                        Required
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B6B8A]">
                      Write the date, 3 specimen signatures, and <strong>&quot;For Pack and Film Camera Rental purposes only&quot;</strong> on a paper and take a photo together with your IDs.
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <label className={`cursor-pointer px-3.5 py-2 rounded-xl border-2 text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs ${validationErrors.authorizationSlipFile
                        ? 'bg-[#FFF5F5] border-red-400 text-red-600 ring-2 ring-red-100'
                        : 'bg-[#FAFAF7] border-[#A8DBC8] text-[#234E52] hover:bg-[#E8F7F1]'
                        }`}>
                        <FileCheck className="w-3.5 h-3.5" />
                        <span className="flex items-center gap-1">
                          <span>{booking.authorizationSlipFile ? 'Replace Slip Photo' : 'Upload Paper Photo with IDs'}</span>
                          <span className="text-red-500 font-bold">*</span>
                        </span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => handleRealFileUpload(e, 'authorizationSlipFile')}
                        />
                      </label>

                      {booking.authorizationSlipFile && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-[#38A169] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Slip Attached</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile('authorizationSlipFile')}
                            className="text-red-500 hover:text-red-700 text-[11px] underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    {validationErrors.authorizationSlipFile && (
                      <p className="text-xs text-red-600 font-bold flex items-center gap-1 pt-1">
                        <span>⚠️</span> {validationErrors.authorizationSlipFile}
                      </p>
                    )}
                  </div>

                  {/* 1D. Selfie Holding 2 Valid IDs and Paper */}
                  <div data-field-key="selfieWithIdsFile" className={`p-3.5 rounded-2xl bg-white border-2 space-y-1.5 transition-colors ${validationErrors.selfieWithIdsFile ? 'border-red-400 bg-[#FFF5F5]/40 shadow-sm' : 'border-[#E8E4F0]'
                    }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1A1A2E] flex items-center gap-1">
                        <span>1D. Selfie Holding Your 2 Valid IDs & Paper</span>
                        <span className="text-red-500 font-bold">*</span>
                        {booking.selfieWithIdsFile && <span className="text-[10px] font-bold text-[#38A169] bg-[#E8F7F1] px-1.5 py-0.5 rounded">Uploaded ✓</span>}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B6B8A]">
                      Submit a clear selfie holding your 2 valid IDs and the handwritten slip.
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <label className={`cursor-pointer px-3.5 py-2 rounded-xl border-2 text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs ${validationErrors.selfieWithIdsFile
                        ? 'bg-[#FFF5F5] border-red-400 text-red-600 ring-2 ring-red-100'
                        : 'bg-[#FAFAF7] border-[#C9B8F0] text-[#553C9A] hover:bg-[#EDE8FC]'
                        }`}>
                        <Upload className="w-3.5 h-3.5" />
                        <span className="flex items-center gap-1">
                          <span>{booking.selfieWithIdsFile ? 'Replace Selfie Photo' : 'Upload Selfie Holding IDs & Paper'}</span>
                          <span className="text-red-500 font-bold">*</span>
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleRealFileUpload(e, 'selfieWithIdsFile')}
                        />
                      </label>

                      {booking.selfieWithIdsFile && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-[#38A169] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Selfie Attached</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile('selfieWithIdsFile')}
                            className="text-red-500 hover:text-red-700 text-[11px] underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    {validationErrors.selfieWithIdsFile && (
                      <p className="text-xs text-red-600 font-bold flex items-center gap-1 pt-1">
                        <span>⚠️</span> {validationErrors.selfieWithIdsFile}
                      </p>
                    )}
                  </div>

                  {/* 2. Proof of Billing / 2 Online Delivery Receipts */}
                  <div data-field-key="deliveryReceiptsFile" className={`p-3.5 rounded-2xl bg-white border-2 space-y-2 transition-colors ${validationErrors.deliveryReceiptsFile || validationErrors.billOwnerIdFile ? 'border-red-400 bg-[#FFF5F5]/40 shadow-sm' : 'border-[#E8E4F0]'
                    }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1A1A2E] flex items-center gap-1">
                        <span>2. Proof of Billing (Must match name & address)</span>
                        <span className="text-red-500 font-bold">*</span>
                        {booking.deliveryReceiptsFile && <span className="text-[10px] font-bold text-[#38A169] bg-[#E8F7F1] px-1.5 py-0.5 rounded">Uploaded ✓</span>}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B6B8A]">
                      Accepted: utility bills, bank statements, or at least 2 screenshots of delivered online orders (Shopee, Lazada, TikTok) showing your name and address.
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <label className={`cursor-pointer px-3.5 py-2 rounded-xl border-2 text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs ${validationErrors.deliveryReceiptsFile
                        ? 'bg-[#FFF5F5] border-red-400 text-red-600 ring-2 ring-red-100'
                        : 'bg-[#FAFAF7] border-[#E8E4F0] text-[#1A1A2E] hover:bg-[#EDE8FC] hover:border-[#1A1A2E]'
                        }`}>
                        <Upload className="w-3.5 h-3.5" />
                        <span className="flex items-center gap-1">
                          <span>{booking.deliveryReceiptsFile ? 'Replace Billing Proof' : 'Upload Bill / 2 Delivery Receipts'}</span>
                          <span className="text-red-500 font-bold">*</span>
                        </span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => handleRealFileUpload(e, 'deliveryReceiptsFile')}
                        />
                      </label>

                      {booking.deliveryReceiptsFile && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-[#38A169] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Proof Attached</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile('deliveryReceiptsFile')}
                            className="text-red-500 hover:text-red-700 text-[11px] underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Toggle: If bill is under someone else's name */}
                    <div className="pt-2 border-t border-[#E8E4F0] space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#1A1A2E]">
                        <input
                          type="checkbox"
                          checked={booking.isBillUnderOtherName}
                          onChange={(e) => {
                            setBooking(b => ({ ...b, isBillUnderOtherName: e.target.checked }));
                            if (!e.target.checked) clearFieldError('billOwnerIdFile');
                          }}
                          className="rounded text-[#6B46C1] focus:ring-0 w-4 h-4 cursor-pointer"
                        />
                        <span>Bill is under someone else&apos;s name (e.g. parent or landlord)</span>
                      </label>

                      {booking.isBillUnderOtherName && (
                        <div data-field-key="billOwnerIdFile" className="p-3 rounded-xl bg-[#FFF9F2] border border-[#F5C6A8] space-y-2">
                          <p className="text-[11px] text-[#7B341E] leading-relaxed">
                            Kindly provide their valid government ID for verification:
                          </p>
                          <div className="flex flex-wrap items-center gap-3">
                            <label className={`cursor-pointer px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs ${validationErrors.billOwnerIdFile
                              ? 'bg-[#FFF5F5] border-red-400 text-red-600 ring-2 ring-red-100'
                              : 'bg-white border-[#F5C6A8] text-[#DD6B20] hover:bg-[#FEF0E7]'
                              }`}>
                              <Upload className="w-3.5 h-3.5" />
                              <span className="flex items-center gap-1">
                                <span>{booking.billOwnerIdFile ? 'Change Bill Owner ID' : 'Upload Bill Owner ID'}</span>
                                <span className="text-red-500 font-bold">*</span>
                              </span>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                className="hidden"
                                onChange={(e) => handleRealFileUpload(e, 'billOwnerIdFile', 'billOwnerIdName')}
                              />
                            </label>
                            {booking.billOwnerIdFile && (
                              <span className="text-[11px] text-[#38A169] font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span className="truncate max-w-[150px]">{booking.billOwnerIdName || 'ID Attached'}</span>
                              </span>
                            )}
                          </div>
                          {validationErrors.billOwnerIdFile && (
                            <p className="text-xs text-red-600 font-bold">⚠️ {validationErrors.billOwnerIdFile}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {validationErrors.deliveryReceiptsFile && (
                      <p className="text-xs text-red-600 font-bold flex items-center gap-1 pt-1">
                        <span>⚠️</span> {validationErrors.deliveryReceiptsFile}
                      </p>
                    )}
                  </div>

                  {/* 5. 5-Second Selfie Video */}
                  <div className={`p-3.5 rounded-2xl bg-white border-2 space-y-2 transition-colors ${validationErrors.selfieFile || validationErrors.selfieVideoConfirmed ? 'border-red-400 bg-[#FFF5F5]/40 shadow-sm' : 'border-[#E8E4F0]'
                    }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1A1A2E] flex items-center gap-1">
                        <span>5. Selfie Video Stating Rental Details</span>
                        <span className="text-red-500 font-bold">*</span>
                        {booking.selfieFile && <span className="text-[10px] font-bold text-[#38A169] bg-[#E8F7F1] px-1.5 py-0.5 rounded">Uploaded ✓</span>}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B6B8A]">
                      Submit a short selfie video holding your 2 valid IDs stating your rental details.
                    </p>
                    <div data-field-key="selfieVideoConfirmed">
                      <label className="flex items-center gap-2 pt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={booking.selfieVideoConfirmed}
                          onChange={(e) => {
                            setBooking(b => ({ ...b, selfieVideoConfirmed: e.target.checked }));
                            clearFieldError('selfieVideoConfirmed');
                          }}
                          className="rounded text-[#6B46C1] focus:ring-0 w-4 h-4 cursor-pointer"
                        />
                        <span className={`text-[11px] font-bold flex items-center gap-1 ${validationErrors.selfieVideoConfirmed ? 'text-red-600' : 'text-[#1A1A2E]'}`}>
                          <span>I confirm this selfie video is me holding my valid IDs stating rental details</span>
                          <span className="text-red-500 font-bold">*</span>
                        </span>
                      </label>
                      {validationErrors.selfieVideoConfirmed && (
                        <p className="text-xs text-red-600 font-bold flex items-center gap-1 pt-1">
                          <span>⚠️</span> {validationErrors.selfieVideoConfirmed}
                        </p>
                      )}
                    </div>
                    <div data-field-key="selfieFile" className="pt-1">
                      <label className={`cursor-pointer px-3.5 py-2 rounded-xl border-2 text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs ${validationErrors.selfieFile
                        ? 'bg-[#FFF5F5] border-red-400 text-red-600 ring-2 ring-red-100'
                        : 'bg-[#FAFAF7] border-[#A8DBC8] text-[#234E52] hover:bg-[#E8F7F1]'
                        }`}>
                        <Video className="w-3.5 h-3.5" />
                        <span className="flex items-center gap-1">
                          <span>{booking.selfieFile ? 'Replace Selfie Video' : 'Upload Selfie Video'}</span>
                          <span className="text-red-500 font-bold">*</span>
                        </span>
                        <input
                          type="file"
                          accept="video/*,image/*"
                          className="hidden"
                          onChange={(e) => handleRealFileUpload(e, 'selfieFile')}
                        />
                      </label>
                      {booking.selfieFile && (
                        <div className="flex items-center gap-2 text-xs pt-1">
                          <span className="text-[#38A169] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Video Attached ✓</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile('selfieFile')}
                            className="text-red-500 hover:text-red-700 text-[11px] underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                      {validationErrors.selfieFile && (
                        <p className="text-xs text-red-600 font-bold flex items-center gap-1 pt-1">
                          <span>⚠️</span> {validationErrors.selfieFile}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Summary Banner if any KYC fields missing */}
                  {stepAttempted[3] && Object.keys(validationErrors).length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-[#FFF5F5] border-2 border-[#FEB2B2] text-xs text-[#9B2C2C] space-y-1 animate-fadeIn">
                      <div className="font-bold flex items-center gap-1.5">
                        <span>⚠️</span>
                        <span>Please complete all required verification steps above:</span>
                      </div>
                      <ul className="list-disc list-inside text-[11px] space-y-0.5 pl-2 font-medium">
                        {validationErrors.id1File && <li>Primary Valid ID (Front)</li>}
                        {validationErrors.id1BackFile && <li>Primary Valid ID (Back)</li>}
                        {validationErrors.id2File && <li>Secondary Valid ID or Student COR</li>}
                        {validationErrors.id2BackFile && <li>Secondary Valid ID (Back)</li>}
                        {validationErrors.authorizationSlipFile && <li>Handwritten Authorization Paper Photo with IDs</li>}
                        {validationErrors.selfieWithIdsFile && <li>Selfie holding 2 valid IDs and paper</li>}
                        {validationErrors.deliveryReceiptsFile && <li>Proof of Billing / Delivery Receipts</li>}
                        {validationErrors.billOwnerIdFile && <li>Bill owner valid government ID</li>}
                        {validationErrors.selfieVideoConfirmed && <li>Selfie video confirmation checkbox</li>}
                        {validationErrors.selfieFile && <li>Selfie video file</li>}
                      </ul>
                    </div>
                  )}

                </div>
              )}

              {/* ───────────────── STEP 4: RENTER CONTACT DETAILS ───────────────── */}
              {modalStep === 4 && (
                <div className="space-y-4 animate-fadeIn">
                  <div data-field-key="fullName">
                    <label className="block text-xs font-bold text-[#1A1A2E] mb-1">
                      Full Legal Name (as shown on ID) <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Alyssa Marie Santos"
                      value={booking.fullName}
                      onChange={(e) => {
                        setBooking(b => ({ ...b, fullName: e.target.value }));
                        clearFieldError('fullName');
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${validationErrors.fullName
                        ? 'border-red-400 bg-[#FFF5F5] ring-2 ring-red-200'
                        : 'bg-white border-[#E8E4F0] focus:border-[#1A1A2E]'
                        }`}
                    />
                    {validationErrors.fullName && (
                      <p className="mt-1 text-xs text-red-600 font-bold flex items-center gap-1">
                        <span>⚠️</span> {validationErrors.fullName}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div data-field-key="mobileNumber">
                      <label className="block text-xs font-bold text-[#1A1A2E] mb-1">
                        Active Mobile Number <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="0917-XXX-XXXX"
                        value={booking.mobileNumber}
                        onChange={(e) => {
                          setBooking(b => ({ ...b, mobileNumber: e.target.value }));
                          clearFieldError('mobileNumber');
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${validationErrors.mobileNumber
                          ? 'border-red-400 bg-[#FFF5F5] ring-2 ring-red-200'
                          : 'bg-white border-[#E8E4F0] focus:border-[#1A1A2E]'
                          }`}
                      />
                      {validationErrors.mobileNumber && (
                        <p className="mt-1 text-xs text-red-600 font-bold flex items-center gap-1">
                          <span>⚠️</span> {validationErrors.mobileNumber}
                        </p>
                      )}
                    </div>

                    <div data-field-key="email">
                      <label className="block text-xs font-bold text-[#1A1A2E] mb-1">
                        Email Address <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="yourname@gmail.com"
                        value={booking.email}
                        onChange={(e) => {
                          setBooking(b => ({ ...b, email: e.target.value }));
                          clearFieldError('email');
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${validationErrors.email
                          ? 'border-red-400 bg-[#FFF5F5] ring-2 ring-red-200'
                          : 'bg-white border-[#E8E4F0] focus:border-[#1A1A2E]'
                          }`}
                      />
                      {validationErrors.email && (
                        <p className="mt-1 text-xs text-red-600 font-bold flex items-center gap-1">
                          <span>⚠️</span> {validationErrors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Shoot Purpose & Social Media Handle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div data-field-key="shootType">
                      <CustomSelect
                        label="Shoot / Event Purpose"
                        isRequired={true}
                        value={booking.shootType}
                        options={[
                          { value: 'Travel / Vacation Vlogging', label: 'Travel / Vacation Vlogging' },
                          { value: 'Concert / Music Festival', label: 'Concert / Music Festival' },
                          { value: 'Content Creation / TikTok / IG', label: 'Content Creation / TikTok / IG' },
                          { value: 'Birthday / Event / Party', label: 'Birthday / Event / Party' },
                          { value: 'Commercial / Brand Shoot', label: 'Commercial / Brand Shoot' },
                          { value: 'Personal / Casual Use', label: 'Personal / Casual Use' },
                        ]}
                        onChange={(val) => {
                          setBooking(b => ({ ...b, shootType: val }));
                          clearFieldError('shootType');
                        }}
                        hasError={!!validationErrors.shootType}
                        errorMessage={validationErrors.shootType}
                      />
                    </div>

                    <div data-field-key="socialHandle">
                      <label className="block text-xs font-bold text-[#1A1A2E] mb-1.5">
                        Active Personal Instagram or Facebook Account <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="@your_personal_handle or FB/IG profile link"
                        value={booking.socialHandle}
                        onChange={(e) => {
                          setBooking(b => ({ ...b, socialHandle: e.target.value }));
                          clearFieldError('socialHandle');
                        }}
                        className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${validationErrors.socialHandle
                          ? 'border-red-400 bg-[#FFF5F5] ring-2 ring-red-200'
                          : 'bg-white border-[#E8E4F0] focus:border-[#1A1A2E]'
                          }`}
                      />
                      <p className="mt-1 text-[11px] text-[#6B6B8A]">
                        Must be your main personal account. Locked/dummy/business-only accounts are not accepted.
                      </p>
                      {validationErrors.socialHandle && (
                        <p className="mt-1 text-xs text-red-600 font-bold flex items-center gap-1">
                          <span>⚠️</span> {validationErrors.socialHandle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Emergency Contacts */}
                  <div className={`p-4 rounded-2xl bg-white border-2 space-y-3 transition-colors ${validationErrors.emergencyContact1Name || validationErrors.emergencyContact1Phone || validationErrors.emergencyContact1Social || validationErrors.contact1IdFile || validationErrors.emergencyContact2Name || validationErrors.emergencyContact2Phone
                    ? 'border-red-400 bg-[#FFF5F5]/40 shadow-sm'
                    : 'border-[#E8E4F0]'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-[#1A1A2E] block">
                          Emergency Contact Persons (2 Required) <span className="text-red-500 font-bold">*</span>
                        </span>
                        <p className="text-[11px] text-[#6B6B8A] mt-0.5 leading-snug">
                          Kindly provide full name and active contact details. Contact 1 is your primary family or guardian reference{booking.isStudentExemption ? ' (parent/guardian valid ID required for student exemption)' : ''}. Contact 2 is a second reference (friend, colleague, or travel companion — no ID required).
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
                      {/* Contact 1: Family Member / Guardian */}
                      <div className="flex flex-col justify-between p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E8E4F0] space-y-2.5">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-[11px] font-bold text-[#1A1A2E]">
                              {booking.isStudentExemption ? 'Contact 1: Parent or Legal Guardian' : 'Contact 1: Family Member / Relative'} <span className="text-red-500 font-bold">*</span>
                            </label>
                            <span className="text-[10px] text-[#553C9A] font-bold bg-[#EDE8FC] px-1.5 py-0.5 rounded">
                              {booking.isStudentExemption ? 'Parent / Guardian' : 'Primary Reference'}
                            </span>
                          </div>

                          {booking.isStudentExemption && (
                            <p className="text-[10px] text-[#DD6B20] font-semibold bg-[#FEF0E7] p-2 rounded-lg border border-[#F5C6A8]">
                              For Student Exemption: Please provide your parent or legal guardian details and active social handle below, along with their valid government ID.
                            </p>
                          )}

                          <div data-field-key="emergencyContact1Name">
                            <input
                              type="text"
                              placeholder={booking.isStudentExemption ? "Parent / Guardian Full Legal Name *" : "Full Legal Name (e.g. Maria Santos) *"}
                              value={booking.emergencyContact1Name}
                              onChange={(e) => {
                                setBooking(b => ({ ...b, emergencyContact1Name: e.target.value }));
                                clearFieldError('emergencyContact1Name');
                              }}
                              className={`w-full px-3 py-2 rounded-xl bg-white border text-xs font-semibold focus:border-[#1A1A2E] ${validationErrors.emergencyContact1Name
                                ? 'border-red-400 bg-[#FFF5F5] ring-2 ring-red-200'
                                : 'border-[#E8E4F0]'
                                }`}
                            />
                            {validationErrors.emergencyContact1Name && (
                              <p className="mt-1 text-xs text-red-600 font-bold">⚠️ {validationErrors.emergencyContact1Name}</p>
                            )}
                          </div>

                          <div data-field-key="emergencyContact1Phone">
                            <input
                              type="tel"
                              placeholder={booking.isStudentExemption ? "Parent / Guardian Contact Number (09XX-XXX-XXXX) *" : "Active Contact Number (09XX-XXX-XXXX) *"}
                              value={booking.emergencyContact1Phone}
                              onChange={(e) => {
                                setBooking(b => ({ ...b, emergencyContact1Phone: e.target.value }));
                                clearFieldError('emergencyContact1Phone');
                              }}
                              className={`w-full px-3 py-2 rounded-xl bg-white border text-xs font-semibold focus:border-[#1A1A2E] ${validationErrors.emergencyContact1Phone
                                ? 'border-red-400 bg-[#FFF5F5] ring-2 ring-red-200'
                                : 'border-[#E8E4F0]'
                                }`}
                            />
                            {validationErrors.emergencyContact1Phone && (
                              <p className="mt-1 text-xs text-red-600 font-bold">⚠️ {validationErrors.emergencyContact1Phone}</p>
                            )}
                          </div>

                          <div data-field-key="emergencyContact1Rel">
                            <input
                              type="text"
                              placeholder={booking.isStudentExemption ? "Relationship (e.g. Mother, Father, Legal Guardian) *" : "Relationship (e.g. Mother, Father, Sister) *"}
                              value={booking.emergencyContact1Rel}
                              onChange={(e) => {
                                setBooking(b => ({ ...b, emergencyContact1Rel: e.target.value }));
                                clearFieldError('emergencyContact1Rel');
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E4F0] text-xs font-semibold focus:border-[#1A1A2E]"
                            />
                          </div>

                          <div data-field-key="emergencyContact1Social">
                            <input
                              type="text"
                              placeholder={booking.isStudentExemption ? "Parent / Guardian FB / IG Link or Handle *" : "FB / IG Profile Link or Handle *"}
                              value={booking.emergencyContact1Social}
                              onChange={(e) => {
                                setBooking(b => ({ ...b, emergencyContact1Social: e.target.value }));
                                clearFieldError('emergencyContact1Social');
                              }}
                              className={`w-full px-3 py-2 rounded-xl bg-white border text-xs font-semibold focus:border-[#1A1A2E] ${validationErrors.emergencyContact1Social
                                ? 'border-red-400 bg-[#FFF5F5] ring-2 ring-red-200'
                                : 'border-[#E8E4F0]'
                                }`}
                            />
                            {validationErrors.emergencyContact1Social && (
                              <p className="mt-1 text-xs text-red-600 font-bold">⚠️ {validationErrors.emergencyContact1Social}</p>
                            )}
                          </div>
                        </div>

                        {/* Contact 1 ID Upload — REQUIRED ONLY FOR STUDENT EXEMPTION */}
                        {booking.isStudentExemption && (
                          <div data-field-key="contact1IdFile" className="pt-2 border-t border-[#E8E4F0] space-y-1.5 animate-fadeIn">
                            <div className="flex items-center justify-between text-[11px] font-bold text-[#1A1A2E]">
                              <span className="flex items-center gap-1">
                                <span>Parent / Guardian Valid Government ID</span>
                                <span className="text-red-500 font-bold">*</span>
                              </span>
                              {booking.contact1IdFile && <span className="text-[10px] text-[#38A169] bg-[#E8F7F1] px-1.5 py-0.5 rounded">Uploaded ✓</span>}
                            </div>
                            <p className="text-[10px] text-[#6B6B8A]">
                              Required for Student Exemption: Photo of parent or legal guardian&apos;s valid government-issued ID.
                            </p>
                            <label className={`cursor-pointer w-full py-2 px-3 rounded-xl bg-white border-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs ${validationErrors.contact1IdFile
                              ? 'border-red-400 text-red-600 bg-red-50 ring-2 ring-red-100'
                              : 'border-[#C9B8F0] text-[#6B46C1] hover:bg-[#EDE8FC]'
                              }`}>
                              <Upload className="w-3.5 h-3.5" />
                              <span>{booking.contact1IdFile ? 'Change Parent / Guardian ID' : 'Upload Parent / Guardian ID *'}</span>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                className="hidden"
                                onChange={(e) => {
                                  handleRealFileUpload(e, 'contact1IdFile', 'contact1IdName');
                                  clearFieldError('contact1IdFile');
                                }}
                              />
                            </label>
                            {booking.contact1IdFile && (
                              <div className="flex items-center justify-between text-[11px] px-1">
                                <span className="text-[#38A169] font-bold truncate max-w-[150px]">{booking.contact1IdName || 'ID Attached'}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile('contact1IdFile', 'contact1IdName')}
                                  className="text-red-500 hover:text-red-700 underline text-[10px]"
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                            {validationErrors.contact1IdFile && (
                              <p className="text-xs text-red-600 font-bold">⚠️ {validationErrors.contact1IdFile}</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Contact 2: Second Emergency Contact (Friend / Colleague — No ID upload required) */}
                      <div className="flex flex-col justify-between p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E8E4F0] space-y-2.5">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-[11px] font-bold text-[#1A1A2E]">
                              Contact 2: Second Reference <span className="text-red-500 font-bold">*</span>
                            </label>
                            <span className="text-[10px] text-[#6B6B8A] font-semibold">
                              Friend / Colleague / Companion
                            </span>
                          </div>

                          <div data-field-key="emergencyContact2Name">
                            <input
                              type="text"
                              placeholder="Full Legal Name (e.g. Juan Cruz) *"
                              value={booking.emergencyContact2Name}
                              onChange={(e) => {
                                setBooking(b => ({ ...b, emergencyContact2Name: e.target.value }));
                                clearFieldError('emergencyContact2Name');
                              }}
                              className={`w-full px-3 py-2 rounded-xl bg-white border text-xs font-semibold focus:border-[#1A1A2E] ${validationErrors.emergencyContact2Name
                                ? 'border-red-400 bg-[#FFF5F5] ring-2 ring-red-200'
                                : 'border-[#E8E4F0]'
                                }`}
                            />
                            {validationErrors.emergencyContact2Name && (
                              <p className="mt-1 text-xs text-red-600 font-bold">⚠️ {validationErrors.emergencyContact2Name}</p>
                            )}
                          </div>

                          <div data-field-key="emergencyContact2Phone">
                            <input
                              type="tel"
                              placeholder="Active Contact Number (09XX-XXX-XXXX) *"
                              value={booking.emergencyContact2Phone}
                              onChange={(e) => {
                                setBooking(b => ({ ...b, emergencyContact2Phone: e.target.value }));
                                clearFieldError('emergencyContact2Phone');
                              }}
                              className={`w-full px-3 py-2 rounded-xl bg-white border text-xs font-semibold focus:border-[#1A1A2E] ${validationErrors.emergencyContact2Phone
                                ? 'border-red-400 bg-[#FFF5F5] ring-2 ring-red-200'
                                : 'border-[#E8E4F0]'
                                }`}
                            />
                            {validationErrors.emergencyContact2Phone && (
                              <p className="mt-1 text-xs text-red-600 font-bold">⚠️ {validationErrors.emergencyContact2Phone}</p>
                            )}
                          </div>

                          <div>
                            <input
                              type="text"
                              placeholder="Relationship / Context (Optional, e.g. Travel Companion)"
                              value={booking.emergencyContact2Rel}
                              onChange={(e) => setBooking(b => ({ ...b, emergencyContact2Rel: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E4F0] text-xs font-semibold focus:border-[#1A1A2E]"
                            />
                          </div>

                          <div>
                            <input
                              type="text"
                              placeholder="FB / IG Profile Link or Handle (Optional)"
                              value={booking.emergencyContact2Social}
                              onChange={(e) => setBooking(b => ({ ...b, emergencyContact2Social: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E4F0] text-xs font-semibold focus:border-[#1A1A2E]"
                            />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#E8E4F0]">
                          <p className="text-[10px] text-[#6B6B8A] leading-tight">
                            Note: ID upload is not required for Emergency Contact 2.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* GCash details for security deposit return */}
                  <div className={`p-4 rounded-2xl bg-[#E8F7F1] border-2 space-y-3 transition-colors ${validationErrors.gcashAccountName || validationErrors.gcashAccountNumber
                    ? 'border-red-400 bg-red-50/50 shadow-sm'
                    : 'border-[#A8DBC8]'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[#234E52]" />
                        <span className="text-xs font-extrabold text-[#234E52]">
                          GCash Account for ₱{modalQuote.deposit.toLocaleString()} Security Deposit Refund <span className="text-red-500 font-bold">*</span>
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-[#234E52] bg-white px-2 py-0.5 rounded-full border border-[#A8DBC8]">
                        Within 24 Hours
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div data-field-key="gcashAccountName">
                        <label className="block text-[11px] font-bold text-[#234E52] mb-1">
                          Account Name <span className="text-red-500 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. ALYSSA M. S."
                          value={booking.gcashAccountName}
                          onChange={(e) => {
                            setBooking(b => ({ ...b, gcashAccountName: e.target.value }));
                            clearFieldError('gcashAccountName');
                          }}
                          className={`w-full px-3 py-2 rounded-xl bg-white border text-xs font-bold uppercase transition-colors ${validationErrors.gcashAccountName ? 'border-red-400 ring-2 ring-red-200' : 'border-[#A8DBC8]'
                            }`}
                        />
                        {validationErrors.gcashAccountName && (
                          <p className="mt-1 text-xs text-red-600 font-bold flex items-center gap-1">
                            <span>⚠️</span> {validationErrors.gcashAccountName}
                          </p>
                        )}
                      </div>
                      <div data-field-key="gcashAccountNumber">
                        <label className="block text-[11px] font-bold text-[#234E52] mb-1">
                          Account Number (GCash Mobile) <span className="text-red-500 font-bold">*</span>
                        </label>
                        <input
                          type="tel"
                          placeholder="0917-XXX-XXXX"
                          value={booking.gcashAccountNumber}
                          onChange={(e) => {
                            setBooking(b => ({ ...b, gcashAccountNumber: e.target.value }));
                            clearFieldError('gcashAccountNumber');
                          }}
                          className={`w-full px-3 py-2 rounded-xl bg-white border text-xs font-bold transition-colors ${validationErrors.gcashAccountNumber ? 'border-red-400 ring-2 ring-red-200' : 'border-[#A8DBC8]'
                            }`}
                        />
                        {validationErrors.gcashAccountNumber && (
                          <p className="mt-1 text-xs text-red-600 font-bold flex items-center gap-1">
                            <span>⚠️</span> {validationErrors.gcashAccountNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-[#234E52]">
                      Your ₱{modalQuote.deposit.toLocaleString()} security deposit will be fully refunded within 24 hours of the equipment being returned, provided it is in the same condition as when it was rented.
                    </p>
                  </div>
                </div>
              )}

              {/* ───────────────── STEP 5: GCASH DOWNPAYMENT DRAWER ───────────────── */}
              {modalStep === 5 && (
                <div className="space-y-4 animate-fadeIn relative">
                  {bookingSubmitError && (
                    <div className="p-4 rounded-2xl bg-[#FFF5F5] border-2 border-red-300 text-red-700 flex items-start gap-3 animate-fadeIn shadow-xs">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <div className="font-black text-red-800">Reservation Could Not Be Completed</div>
                        <p className="mt-0.5 leading-relaxed font-semibold">{bookingSubmitError}</p>
                      </div>
                    </div>
                  )}

                  {isSubmittingBooking && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-xs rounded-2xl z-30 flex flex-col items-center justify-center p-6 text-center animate-fadeIn shadow-sm border border-[#E8E4F0]">
                      <div className="w-12 h-12 rounded-2xl bg-[#EDE8FC] flex items-center justify-center mb-3 shadow-inner">
                        <Loader2 className="w-6 h-6 animate-spin text-[#6B46C1]" />
                      </div>
                      <h4 className="text-sm font-black text-[#1A1A2E]">
                        Securing your slot and syncing with Google Sheets...
                      </h4>
                      <p className="text-xs text-[#6B6B8A] mt-1 max-w-xs leading-relaxed">
                        Transmitting reservation details to our live backend database.
                      </p>
                    </div>
                  )}

                  {/* GCash Pastel Drawer Box */}
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-[#007DFE]/10 via-[#C9B8F0]/30 to-[#FEF0E7] border-2 border-[#007DFE]/30 relative overflow-hidden">
                    <div className="flex items-center justify-between pb-3 border-b border-[#007DFE]/20">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-[#007DFE] text-white flex items-center justify-center font-black text-xs">
                          G
                        </div>
                        <span className="font-extrabold text-sm text-[#1A1A2E]">Official GCash Merchant</span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-white text-[#007DFE] text-xs font-black border border-[#007DFE]/30 shadow-xs">
                        Downpayment Due Now: ₱{DOWNPAYMENT_FEE}
                      </span>
                    </div>

                    <div className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                      {/* Real GCash / InstaPay QR Code Image */}
                      <div className="bg-white p-3 rounded-2xl border-2 border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E] flex flex-col items-center justify-center">
                        <div className="w-36 h-36 bg-white rounded-xl overflow-hidden flex items-center justify-center border border-[#E8E4F0] p-1.5 shadow-inner">
                          <img
                            src="/gcash-qr.png"
                            alt="GCash / InstaPay QR Code"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="mt-2 text-[10px] font-mono font-bold text-[#6B6B8A] tracking-wider uppercase text-center">
                          SCAN TO PAY VIA GCASH / INSTAPAY
                        </span>
                      </div>

                      {/* Number & Copy info */}
                      <div className="space-y-2.5">
                        <div>
                          <div className="text-[11px] text-[#6B6B8A] font-semibold">Account Name:</div>
                          <div className="text-sm font-black text-[#1A1A2E] tracking-wide">DI ** E MA *** E C.</div>
                        </div>

                        <div>
                          <div className="text-[11px] text-[#6B6B8A] font-semibold">GCash Mobile:</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono font-extrabold text-sm text-[#1A1A2E] bg-white px-2.5 py-1 rounded-lg border border-[#E8E4F0]">
                              0906 417 8301
                            </span>
                            <button
                              type="button"
                              onClick={handleCopyGcash}
                              className="p-1.5 rounded-lg bg-white border border-[#E8E4F0] hover:bg-[#EDE8FC] text-xs font-bold text-[#553C9A] flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>{copiedGcash ? 'Copied!' : 'Copy'}</span>
                            </button>
                          </div>
                        </div>

                        <div className="text-[11px] text-[#6B6B8A] leading-tight pt-1">
                          Send exact <strong>₱300</strong> to lock your chosen dates. The remaining balance is settled upon handover!
                        </div>
                      </div>
                    </div>

                    {/* Transparent Final Cost Breakdown & Payment Milestones */}
                    <div className="mt-3 p-4 rounded-3xl bg-white border-2 border-[#1A1A2E]/10 shadow-xs space-y-3.5 text-xs">
                      {/* Section 1: Rental & Package Breakdown */}
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-[#E8E4F0]">
                          <span className="font-black text-xs uppercase tracking-wider text-[#1A1A2E]">
                            1. Booking Cost Breakdown
                          </span>
                          <span className="text-[11px] font-bold text-[#553C9A] bg-[#EDE8FC] px-2.5 py-0.5 rounded-full border border-[#C9B8F0]">
                            {modalQuote.days} {modalQuote.days === 1 ? 'Day' : 'Days'} • {modalQuote.tierLabel}
                          </span>
                        </div>

                        <div className="mt-2.5 space-y-2 text-xs">
                          <div className="flex justify-between items-center text-[#6B6B8A]">
                            <span>Rental Duration:</span>
                            <span className="font-bold text-[#1A1A2E]">{modalQuote.days} {modalQuote.days === 1 ? 'Day' : 'Days'}</span>
                          </div>
                          <div className="flex justify-between items-center text-[#6B6B8A]">
                            <span>Rental Rate:</span>
                            <span className="font-bold text-[#1A1A2E]">₱{modalQuote.rate}/day</span>
                          </div>
                          <div className="flex justify-between items-center text-[#1A1A2E] font-semibold">
                            <span>Base Rental Cost:</span>
                            <span className="font-black text-[#1A1A2E]">₱{modalQuote.rentalTotal.toLocaleString()}</span>
                          </div>
                          {booking.handoverMode === 'meetup' ? (
                            <div className="flex justify-between items-center text-[#1A1A2E] font-semibold">
                              <span>Meetup Handling Fee ({booking.meetupLocation || 'SM East / Bridgetowne / Opus'}):</span>
                              <span className="font-black text-[#1A1A2E]">₱{modalQuote.meetupFee.toLocaleString()}</span>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center text-[#6B6B8A]">
                              <span>Delivery via Grab Express:</span>
                              <span className="font-bold text-[#1A1A2E]">Renter shoulders fee to rider</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center text-[#2F855A]">
                            <span className="flex items-center gap-1.5">
                              <span>Refundable Security Deposit:</span>
                              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-[#E8F7F1] text-[#2F855A] border border-[#A8DBC8]">
                                100% Refundable
                              </span>
                            </span>
                            <span className="font-black text-[#2F855A]">
                              ₱{modalQuote.deposit.toLocaleString()}
                            </span>
                          </div>
                          <div className="pt-2 border-t border-[#E8E4F0] flex justify-between items-center">
                            <span className="font-black text-xs text-[#1A1A2E]">Total Package Value:</span>
                            <span className="font-black text-sm text-[#1A1A2E]">₱{modalQuote.total.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Clear 3-Milestone Payment Schedule */}
                      <div className="pt-2 border-t border-[#E8E4F0]">
                        <div className="text-[11px] font-black uppercase tracking-wider text-[#1A1A2E] mb-2.5">
                          2. Payment Schedule (When & What You Pay)
                        </div>

                        <div className="space-y-2">
                          {/* Milestone 1: Pay Now */}
                          <div className="p-3 rounded-2xl bg-[#007DFE]/10 border-2 border-[#007DFE]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-[#007DFE] text-white flex items-center justify-center text-[10px] font-black">1</span>
                                <span className="font-black text-xs text-[#007DFE] uppercase tracking-wide">Pay Now via GCash (Downpayment):</span>
                              </div>
                              <p className="text-[11px] text-[#6B6B8A] mt-0.5 pl-5.5">
                                Reserves your slot. Counted directly toward your rental payment (not an extra charge).
                              </p>
                            </div>
                            <div className="text-right pl-5.5 sm:pl-0 shrink-0">
                              <span className="font-black text-base text-[#007DFE]">₱{DOWNPAYMENT_FEE}</span>
                            </div>
                          </div>

                          {/* Milestone 2: Pay on Handover */}
                          <div className="p-3 rounded-2xl bg-[#FAFAF7] border-2 border-[#1A1A2E]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-[#1A1A2E] text-white flex items-center justify-center text-[10px] font-black">2</span>
                                <span className="font-black text-xs text-[#1A1A2E] uppercase tracking-wide">Total Remaining Payment on Handover:</span>
                              </div>
                              <p className="text-[11px] text-[#6B6B8A] mt-0.5 pl-5.5">
                                Remaining rental balance (<strong>₱{modalQuote.remainingRentalBalance.toLocaleString()}</strong>)
                                {modalQuote.meetupFee > 0 && <> + Meetup handling fee (<strong>₱{modalQuote.meetupFee.toLocaleString()}</strong>)</>}
                                {' '}+ Refundable security deposit (<strong>₱{modalQuote.deposit.toLocaleString()}</strong>).
                              </p>
                            </div>
                            <div className="text-right pl-5.5 sm:pl-0 shrink-0">
                              <span className="font-black text-base text-[#1A1A2E]">₱{modalQuote.paymentOnHandover.toLocaleString()}</span>
                            </div>
                          </div>

                          {/* Milestone 3: Refund After Return */}
                          <div className="p-3 rounded-2xl bg-[#E8F7F1] border-2 border-[#38A169]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-[#38A169] text-white flex items-center justify-center text-[10px] font-black">3</span>
                                <span className="font-black text-xs text-[#2F855A] uppercase tracking-wide">Security Deposit Refund After Return:</span>
                              </div>
                              <p className="text-[11px] text-[#234E52] mt-0.5 pl-5.5">
                                Full security deposit sent back directly to your GCash within 24 Hours of equipment return and inspection.
                              </p>
                            </div>
                            <div className="text-right pl-5.5 sm:pl-0 shrink-0">
                              <span className="font-black text-base text-[#2F855A]">
                                ₱{modalQuote.refundAfterReturn.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Timing Clarity Callout */}
                        <div className="mt-2.5 p-2.5 rounded-xl bg-[#FFF9F2] border border-[#F5C6A8] text-[11px] text-[#7B341E] flex items-start gap-2">
                          <span className="shrink-0 text-sm">💡</span>
                          <span className="leading-snug">
                            <strong>Payment Timing Clarity:</strong> The ₱300 downpayment is already deducted from your rental fee (leaving only <strong>₱{modalQuote.remainingRentalBalance.toLocaleString()}</strong> rental balance). {modalQuote.meetupFee > 0 && <>A ₱200 handling fee applies for meetup transactions. </>}The <strong>₱{modalQuote.deposit.toLocaleString()}</strong> security deposit is separate and 100% refundable upon safe return.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reference Number input */}
                  <div data-field-key="gcashRefNumber">
                    <label className="block text-xs font-bold text-[#1A1A2E] mb-1">
                      GCash Reference Number (13 Digits) <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      placeholder="e.g. 1002 8492 1192 1"
                      value={booking.gcashRefNumber}
                      onChange={(e) => {
                        setBooking(b => ({ ...b, gcashRefNumber: e.target.value }));
                        clearFieldError('gcashRefNumber');
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono font-bold text-[#1A1A2E] transition-colors ${validationErrors.gcashRefNumber
                        ? 'border-red-400 bg-[#FFF5F5] ring-2 ring-red-200'
                        : 'bg-white border-[#E8E4F0] focus:border-[#1A1A2E]'
                        }`}
                    />
                    {validationErrors.gcashRefNumber && (
                      <p className="mt-1 text-xs text-red-600 font-bold flex items-center gap-1">
                        <span>⚠️</span> {validationErrors.gcashRefNumber}
                      </p>
                    )}
                  </div>

                  {/* Required GCash Receipt Upload */}
                  <div data-field-key="receiptFile" className={`p-3.5 rounded-xl border transition-all ${validationErrors.receiptFile
                    ? 'bg-[#FFF5F5] border-red-300 ring-2 ring-red-100'
                    : booking.receiptFile
                      ? 'bg-[#E8F7F1]/50 border-[#A8DBC8]'
                      : 'bg-white border-[#E8E4F0]'
                    }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <label className="text-xs font-bold text-[#1A1A2E] flex items-center gap-1">
                            <span>Upload GCash Payment Receipt</span>
                            <span className="text-red-500 font-black">*</span>
                          </label>
                          {booking.receiptFile && (
                            <span className="text-[10px] font-black text-[#2F855A] bg-[#E8F7F1] px-2 py-0.5 rounded-full border border-[#A8DBC8]">
                              Receipt Attached ✓
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#6B6B8A] mt-0.5">
                          Required to complete your booking. Please attach a screenshot of your ₱300 downpayment transfer.
                        </p>
                      </div>

                      <label className={`cursor-pointer px-3.5 py-2 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 transition-all shrink-0 justify-center ${booking.receiptFile
                        ? 'bg-white border border-[#A8DBC8] text-[#2F855A] hover:bg-[#E8F7F1]'
                        : validationErrors.receiptFile
                          ? 'bg-red-50 border-2 border-red-400 text-red-600 hover:bg-red-100'
                          : 'bg-[#1A1A2E] text-white hover:bg-[#6B46C1] shadow-sm'
                        }`}>
                        <Upload className="w-3.5 h-3.5" />
                        <span>{booking.receiptFile ? 'Change Receipt' : 'Attach GCash Receipt *'}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            handleRealFileUpload(e, 'receiptFile');
                            clearFieldError('receiptFile');
                          }}
                        />
                      </label>
                    </div>

                    {validationErrors.receiptFile && (
                      <p className="mt-2 text-xs text-red-600 font-bold flex items-center gap-1">
                        <span>⚠️</span> {validationErrors.receiptFile}
                      </p>
                    )}
                  </div>

                  {/* Active Terms & Conditions Agreement */}
                  <div data-field-key="termsAccepted" className={`p-4 rounded-2xl border-2 transition-all ${validationErrors.termsAccepted
                    ? 'bg-[#FFF5F5] border-red-300 ring-2 ring-red-100'
                    : booking.termsAccepted
                      ? 'bg-[#E8F7F1]/60 border-[#38A169]/40'
                      : 'bg-white border-[#E8E4F0]'
                    }`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="modalTermsCheckbox"
                        checked={booking.termsAccepted}
                        onChange={(e) => {
                          setBooking(b => ({
                            ...b,
                            termsAccepted: e.target.checked,
                            termsAcceptedAt: e.target.checked ? new Date().toISOString() : undefined,
                          }));
                          clearFieldError('termsAccepted');
                        }}
                        className="mt-0.5 w-4 h-4 rounded text-[#6B46C1] focus:ring-[#6B46C1] border-gray-300 cursor-pointer"
                      />
                      <div className="flex-1 text-xs">
                        <label htmlFor="modalTermsCheckbox" className="font-bold text-[#1A1A2E] cursor-pointer">
                          I have read, understood, and agree to the{' '}
                          <button
                            type="button"
                            onClick={() => setShowTermsModal(true)}
                            className="text-[#6B46C1] underline font-black hover:text-[#553C9A] cursor-pointer inline-flex items-center gap-0.5"
                          >
                            <span>Terms and Conditions</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>{' '}
                          of Pack and Film Camera Rental. <span className="text-red-500 font-bold">*</span>
                        </label>
                        <p className="text-[11px] text-[#6B6B8A] mt-1 leading-relaxed">
                          Includes ₱300 reservation downpayment (credited to rental), ₱{modalQuote.deposit.toLocaleString()} security deposit (refunded within 24h of return), 8:00 AM – 8:00 PM rental period, ₱200 meetup handling fee, and Grab Express delivery rules.
                        </p>
                      </div>
                    </div>
                    {validationErrors.termsAccepted && (
                      <p className="mt-2 text-xs text-red-600 font-bold flex items-center gap-1 pl-7">
                        <span>⚠️</span> {validationErrors.termsAccepted}
                      </p>
                    )}
                  </div>

                </div>
              )}

              {/* ───────────────── STEP 6: CONFIRMATION SUCCESS SCREEN ───────────────── */}
              {modalStep === 6 && (
                <div className="space-y-6 text-center animate-fadeIn py-2">

                  {/* Big Mascot Celebration */}
                  <div className="relative w-24 h-24 mx-auto">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#A8DBC8] via-[#C9B8F0] to-[#F5C6A8] p-1 shadow-lg">
                      <div className="w-full h-full bg-white rounded-[22px] p-2 flex items-center justify-center">
                        <img
                          src="/logo.png"
                          alt="PackAndFilm Mascot"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#38A169] border-2 border-white flex items-center justify-center shadow-md">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-[#1A1A2E] tracking-tight">
                      You&apos;re Officially Booked!
                    </h3>
                    <p className="mt-1 text-sm text-[#6B6B8A] font-medium">
                      Your {modalCamera.name} has been reserved.
                    </p>
                  </div>

                  {/* Booking Reference Pill */}
                  <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white border-2 border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E]">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#6B6B8A] block">Booking Reference</span>
                      <span className="font-mono font-black text-base text-[#1A1A2E]">{booking.bookingRef}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyRef}
                      className="p-1.5 rounded-lg bg-[#FAFAF7] hover:bg-[#EDE8FC] text-xs font-bold text-[#553C9A] flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedRef ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* Booking Summary Card */}
                  <div className="bg-white rounded-2xl border border-[#E8E4F0] p-4 text-left text-xs space-y-2.5">
                    <div className="flex justify-between">
                      <span className="text-[#6B6B8A]">Camera Model:</span>
                      <span className="font-bold text-[#553C9A]">{modalCamera.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B6B8A]">Renter Name:</span>
                      <span className="font-bold text-[#1A1A2E]">{booking.fullName || 'Valued Creator'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B6B8A]">Rental Dates:</span>
                      <span className="font-bold text-[#1A1A2E]">{booking.startDate} to {booking.endDate} ({modalQuote.days} days)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B6B8A]">Handover Mode:</span>
                      <span className="font-bold text-[#1A1A2E]">
                        {booking.handoverMode === 'meetup'
                          ? `${booking.meetupLocation || 'Pasig Meetup Hub'} (₱200 Meetup Fee)`
                          : 'Grab Express Delivery (Renter shoulders fee)'}
                      </span>
                    </div>
                    {booking.handoverMode === 'meetup' && (
                      <div className="flex justify-between">
                        <span className="text-[#6B6B8A]">Meetup Handling Fee:</span>
                        <span className="font-bold text-[#1A1A2E]">₱{modalQuote.meetupFee.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[#6B6B8A]">Rental Window:</span>
                      <span className="font-bold text-[#1A1A2E]">8:00 AM – 8:00 PM ONLY</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B6B8A]">Downpayment Paid:</span>
                      <span className="font-bold text-[#007DFE]">₱{DOWNPAYMENT_FEE} (Ref: {booking.gcashRefNumber || 'Verified'} • Credited to rental)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B6B8A]">Remaining Rental Balance:</span>
                      <span className="font-bold text-[#1A1A2E]">₱{modalQuote.remainingRentalBalance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B6B8A]">Refundable Security Deposit:</span>
                      <span className="font-bold text-[#2F855A]">
                        ₱{modalQuote.deposit.toLocaleString()} (100% Refundable)
                      </span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-[#E8E4F0]">
                      <span className="font-black text-[#1A1A2E]">Total Due on Handover:</span>
                      <span className="font-black text-sm text-[#1A1A2E]">₱{modalQuote.paymentOnHandover.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-[#2F855A]">
                      <span className="font-bold">Security Deposit Refund:</span>
                      <span className="font-black">
                        ₱{modalQuote.refundAfterReturn.toLocaleString()} (Within 24h of return via GCash)
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[#E8E4F0]">
                      <span className="text-[#6B6B8A]">Terms & Conditions:</span>
                      <span className="font-bold text-[#38A169] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accepted ({booking.termsVersion || '2026 Edition'})</span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B6B8A]">KYC Status:</span>
                      <span className="font-extrabold text-[#553C9A] bg-[#EDE8FC] px-2 py-0.5 rounded-full">
                        Pending 15-Min Quick Review
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-[#234E52] bg-[#E8F7F1] p-2 rounded-xl border border-[#A8DBC8]">
                      <span className="font-bold flex items-center gap-1.5">
                        <CheckCheck className="w-3.5 h-3.5 text-[#38A169]" />
                        <span>KYC Documents & Video:</span>
                      </span>
                      <span className="font-extrabold text-[#2F855A]">
                        {booking.driveFolderUrl ? 'Vaulted in Google Drive ✓' : 'Encrypted & Uploaded ✓'}
                      </span>
                    </div>
                  </div>

                  {/* Direct Contact Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
                    <a
                      href="https://www.instagram.com/packandfilm.ph/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white font-extrabold text-xs shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Chat on Instagram</span>
                    </a>
                    <a
                      href="https://www.facebook.com/people/Pack-and-Film/61595302043810/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 px-4 rounded-2xl bg-[#0084FF] text-white font-extrabold text-xs hover:bg-[#0070D8] shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Chat on Facebook Page</span>
                    </a>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="py-3 px-5 rounded-2xl bg-[#FAFAF7] border-2 border-[#1A1A2E] text-[#1A1A2E] font-bold text-xs hover:bg-[#EDE8FC] transition-colors"
                    >
                      Done & Return
                    </button>
                  </div>

                </div>
              )}

            </div>

            {/* Modal Navigation Buttons (Steps 1 to 5) */}
            {modalStep < 6 && (
              <div className="px-6 py-4 bg-white border-t border-[#E8E4F0] flex items-center justify-between">
                {modalStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setValidationErrors({});
                      setModalStep(s => Math.max(1, s - 1));
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B6B8A] hover:bg-[#FAFAF7] hover:text-[#1A1A2E] transition-colors cursor-pointer"
                  >
                    ← Back
                  </button>
                ) : (
                  <div />
                )}

                <div>
                  {modalStep === 1 && (
                    <button
                      disabled={modalConflict.hasConflict}
                      type="button"
                      onClick={() => {
                        if (validateStep(1)) {
                          setModalStep(2);
                        }
                      }}
                      className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${modalConflict.hasConflict
                        ? 'bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed shadow-none'
                        : 'bg-[#1A1A2E] text-white hover:bg-[#6B46C1] cursor-pointer'
                        }`}
                    >
                      {modalConflict.hasConflict ? (
                        <>
                          <CalendarX className="w-3.5 h-3.5 text-red-500" />
                          <span>Dates Booked — Cannot Proceed</span>
                        </>
                      ) : (
                        <>
                          <span>Next: Handover</span>
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}

                  {modalStep === 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (validateStep(2)) {
                          setModalStep(3);
                        }
                      }}
                      className="px-6 py-2.5 rounded-full bg-[#1A1A2E] text-white text-xs font-bold hover:bg-[#6B46C1] transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Next: Quick KYC</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}

                  {modalStep === 3 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (validateStep(3)) {
                          setModalStep(4);
                        }
                      }}
                      className="px-6 py-2.5 rounded-full bg-[#1A1A2E] text-white text-xs font-bold hover:bg-[#6B46C1] transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Next: Contact Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}

                  {modalStep === 4 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (validateStep(4)) {
                          setModalStep(5);
                        }
                      }}
                      className="px-6 py-2.5 rounded-full bg-[#1A1A2E] text-white text-xs font-bold hover:bg-[#6B46C1] transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Next: GCash Downpayment</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}

                  {modalStep === 5 && (
                    <button
                      disabled={isSubmittingBooking}
                      type="button"
                      onClick={() => {
                        if (validateStep(5)) {
                          handleFinalizeBooking();
                        }
                      }}
                      className="px-7 py-2.5 rounded-full bg-[#38A169] text-white text-xs font-extrabold hover:bg-[#2F855A] shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-80 disabled:cursor-wait"
                    >
                      {isSubmittingBooking ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Securing your slot and syncing with Google Sheets...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Confirm & Lock Dates</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          UNAVAILABLE / BOOKED DATES CALENDAR MODAL
      ───────────────────────────────────────────────────────────── */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#FAFAF7] rounded-[32px] border-2 border-[#1A1A2E] shadow-[8px_8px_0px_0px_#1A1A2E] overflow-hidden flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="px-6 py-4 bg-white border-b border-[#E8E4F0] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EDE8FC] flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#6B46C1]" />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#1A1A2E]">
                    Camera Reservation Schedule
                  </h3>
                  <p className="text-xs text-[#6B6B8A]">
                    Live tracker of active reservations across Metro Manila
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowScheduleModal(false)}
                className="w-8 h-8 rounded-full bg-[#FAFAF7] border border-[#E8E4F0] hover:bg-[#FEF0E7] flex items-center justify-center text-[#1A1A2E] transition-all cursor-pointer"
                aria-label="Close schedule modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Camera Filter Bar inside Schedule Modal */}
            <div className="px-6 py-2.5 bg-[#FAFAF7] border-b border-[#E8E4F0] flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setScheduleFilterCameraId('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${scheduleFilterCameraId === 'all'
                  ? 'bg-[#1A1A2E] text-white shadow-sm'
                  : 'bg-white text-[#6B6B8A] border border-[#E8E4F0] hover:text-[#1A1A2E]'
                  }`}
              >
                All Cameras ({bookings.length})
              </button>
              {CAMERAS.map((cam) => {
                const count = bookings.filter((b) => b.cameraId === cam.id).length;
                const isCur = scheduleFilterCameraId === cam.id;
                return (
                  <button
                    key={cam.id}
                    type="button"
                    onClick={() => setScheduleFilterCameraId(cam.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${isCur
                      ? 'bg-[#6B46C1] text-white shadow-sm'
                      : 'bg-white text-[#6B6B8A] border border-[#E8E4F0] hover:text-[#1A1A2E]'
                      }`}
                  >
                    {cam.shortName} ({count})
                  </button>
                );
              })}
            </div>

            {/* Calendar Availability Status Bar */}
            <div className="px-6 py-2.5 bg-white border-b border-[#E8E4F0] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#6B6B8A]">
                <span className={`w-2 h-2 rounded-full ${isSyncingSheet ? 'bg-amber-400 animate-ping' : sheetSyncError ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <span className="font-semibold text-[11px]">
                  {isSyncingSheet ? 'Syncing with Google Sheets...' : sheetSyncError ? 'Offline Calendar Backup' : 'Live Reservation Tracker • Metro Manila'}
                </span>
              </div>
              <span className="text-[10px] text-[#8C7BAE] font-semibold">
                {sheetLastSynced
                  ? `Synced ${sheetLastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Real-time Availability'}
              </span>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {(() => {
                const filteredBookings = bookings.filter(
                  (bRecord) => scheduleFilterCameraId === 'all' || bRecord.cameraId === scheduleFilterCameraId
                );

                return (
                  <>
                    {/* Legend & Info Strip */}
                    <div className="p-3.5 rounded-2xl bg-[#E8F7F1] border border-[#A8DBC8] flex items-center justify-between text-xs text-[#234E52]">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${filteredBookings.length > 0 ? 'bg-amber-500' : 'bg-[#38A169]'
                            }`}
                        />
                        <span className="font-bold">
                          {filteredBookings.length === 0
                            ? 'All Dates 100% Available!'
                            : `${filteredBookings.length} Active Booking${filteredBookings.length > 1 ? 's' : ''}`}
                        </span>
                      </div>
                      <span className="font-semibold">
                        {filteredBookings.length === 0 ? 'No conflicting dates' : 'Remaining dates open'}
                      </span>
                    </div>

                    {filteredBookings.length === 0 ? (
                      <div className="py-10 px-5 text-center rounded-2xl bg-white border border-[#E8E4F0] space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#E8F7F1] text-[#234E52] flex items-center justify-center mx-auto">
                          <CalendarCheck className="w-6 h-6 text-[#38A169]" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-[#1A1A2E]">
                            No Booked Dates for this Unit!
                          </h4>
                          <p className="text-xs text-[#6B6B8A] mt-1 max-w-sm mx-auto leading-relaxed">
                            Every date is completely available for rent. Choose your preferred schedule in the calculator or book now to lock your slot!
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowScheduleModal(false)}
                          className="mt-2 px-5 py-2.5 rounded-xl bg-[#1A1A2E] text-white text-xs font-bold hover:bg-[#6B46C1] transition-colors cursor-pointer"
                        >
                          Select Dates in Calculator ➔
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredBookings.map((bRecord) => {
                          const afterDate = new Date(new Date(bRecord.endDate).getTime() + 86400000).toISOString().split('T')[0];
                          const afterEnd = new Date(new Date(bRecord.endDate).getTime() + 86400000 * 3).toISOString().split('T')[0];
                          const camInfo = CAMERAS.find((c) => c.id === bRecord.cameraId);

                          return (
                            <div
                              key={bRecord.id}
                              className="p-4 rounded-2xl bg-white border-2 border-[#E8E4F0] hover:border-[#1A1A2E] transition-all space-y-2.5 shadow-sm"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-xs px-2.5 py-0.5 rounded-full bg-[#FFF5F5] text-[#C53030] border border-[#FEB2B2] flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                  <span>{bRecord.startDate} to {bRecord.endDate}</span>
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAFAF7] border border-[#E8E4F0] text-[#1A1A2E]">
                                    {camInfo?.shortName || bRecord.cameraId}
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EDE8FC] text-[#553C9A]">
                                    Slot Reserved
                                  </span>
                                </div>
                              </div>

                              <div>
                                <div className="font-black text-sm text-[#1A1A2E]">
                                  {camInfo?.name || bRecord.cameraId}
                                </div>
                                <div className="text-xs text-[#6B6B8A] mt-0.5 flex items-center gap-2">
                                  <span>Equipment Reserved</span>
                                  <span>•</span>
                                  <span>Metro Manila Service Hub</span>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-[#E8E4F0]/60 flex items-center justify-end">
                                {camInfo?.isAvailable ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedCameraId(bRecord.cameraId);
                                      setCalcStartDate(afterDate);
                                      setCalcEndDate(afterEnd);
                                      setBooking((b) => ({
                                        ...b,
                                        cameraId: bRecord.cameraId,
                                        startDate: afterDate,
                                        endDate: afterEnd,
                                      }));
                                      setShowScheduleModal(false);
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-[#FAFAF7] hover:bg-[#EDE8FC] border border-[#C9B8F0] text-xs font-bold text-[#6B46C1] transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                                  >
                                    <span>Rent Right After ({afterDate})</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      showToast(`✨ ${camInfo?.name || 'This camera'} is coming soon to our lineup! The DJI Osmo Pocket 3 and Canon PowerShot G7 X Mark III are currently available for rental.`, 'info');
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-[#FAFAF7] border border-[#E8E4F0] text-xs font-bold text-[#6B6B8A] hover:bg-[#FEF0E7] hover:text-[#C05621] transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <Clock className="w-3 h-3 text-[#DD6B20]" />
                                    <span>Coming Soon • Not Yet Bookable</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Customer Schedule Modal Footer */}
            <div className="px-6 py-4 bg-white border-t border-[#E8E4F0] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2.5 rounded-xl border border-[#E8E4F0] text-xs font-bold text-[#6B6B8A] hover:bg-[#FAFAF7] transition-all cursor-pointer"
              >
                Close Calendar
              </button>

              <button
                type="button"
                onClick={() => {
                  handleAutoPickNextAvailable();
                  setShowScheduleModal(false);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#1A1A2E] text-white text-xs font-bold hover:bg-[#6B46C1] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#F5C6A8]" />
                <span>Auto-Select Free Date Window</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TERMS AND CONDITIONS FULL MODAL
      ───────────────────────────────────────────────────────────── */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-[#FAFAF7] rounded-[32px] border-2 border-[#1A1A2E] shadow-[8px_8px_0px_0px_#1A1A2E] overflow-hidden flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="px-6 py-4 bg-white border-b-2 border-[#1A1A2E] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EDE8FC] border border-[#C9B8F0] flex items-center justify-center text-[#553C9A]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-[#1A1A2E]">
                    Terms &amp; Conditions
                  </h3>
                  <p className="text-xs text-[#6B6B8A] font-medium">
                    Guidelines for smooth rentals • Updated from Official Handouts
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="w-8 h-8 rounded-full bg-[#FAFAF7] border border-[#E8E4F0] hover:bg-[#FEF0E7] flex items-center justify-center text-[#1A1A2E] transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-3.5 flex-1 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#FFF9F2] border border-[#F5C6A8] text-[11px] text-[#7B341E] leading-relaxed">
                <strong>Important Notice:</strong> By proceeding with the reservation payment, the renter acknowledges that they have read, understood, and agreed to all the Terms &amp; Conditions of Pack and Film Camera Rental.
              </div>

              <div className="space-y-3">
                {TERMS_AND_CONDITIONS_DATA.map((clause, index) => {
                  const isOpen = openTermsClause === index;
                  return (
                    <div
                      key={clause.number}
                      className={`rounded-2xl border-2 transition-all ${
                        isOpen
                          ? 'border-[#1A1A2E] bg-white shadow-[3px_3px_0px_#1A1A2E]'
                          : 'border-[#E8E4F0] bg-white hover:border-[#C9B8F0]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenTermsClause(isOpen ? null : index)}
                        className="w-full p-3.5 text-left flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-[#EDE8FC] text-[#553C9A] flex items-center justify-center font-black text-[11px]">
                            {clause.number}
                          </span>
                          <span className="font-black text-xs text-[#1A1A2E]">
                            {clause.title}
                          </span>
                        </div>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-transform ${
                          isOpen ? 'rotate-180 bg-[#C9B8F0] text-[#1A1A2E]' : 'bg-[#FAFAF7] text-[#6B6B8A]'
                        }`}>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 border-t border-[#E8E4F0] text-xs text-[#4A4A68] space-y-2 leading-relaxed">
                          {clause.content.map((point, pIdx) => (
                            <p key={pIdx} className="flex items-start gap-2">
                              <span className="text-[#6B46C1] font-bold mt-0.5">•</span>
                              <span>{point}</span>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-3.5 rounded-2xl bg-[#EDE8FC] border border-[#C9B8F0] text-center text-[11px] text-[#553C9A] font-semibold">
                {TERMS_ACKNOWLEDGEMENT_TEXT}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-white border-t border-[#E8E4F0] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="px-4 py-2.5 rounded-xl border border-[#E8E4F0] text-xs font-bold text-[#6B6B8A] hover:bg-[#FAFAF7] transition-all cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  setBooking(b => ({
                    ...b,
                    termsAccepted: true,
                    termsAcceptedAt: new Date().toISOString(),
                  }));
                  clearFieldError('termsAccepted');
                  setShowTermsModal(false);
                  showToast('Terms and Conditions accepted!', 'success');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#38A169] text-white text-xs font-bold hover:bg-[#2F855A] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>I Understand &amp; Agree to Terms</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Floating Messenger Quick Contact Pill */}
      <div className="fixed bottom-5 right-5 z-30">
        <button
          onClick={() => handleOpenBookingModal()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1A1A2E] text-white text-xs font-bold shadow-lg border-2 border-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Camera className="w-4 h-4 text-[#F5C6A8]" />
          <span>Rent a Camera</span>
        </button>
      </div>

    </div>
  );
}
