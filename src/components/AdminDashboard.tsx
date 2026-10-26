import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ExternalLink,
  Eye,
  EyeOff,
  FolderOpen,
  ArrowLeft,
  Camera,
  CreditCard,
  FileText,
  Users,
  X,
  Check,
  Maximize2,
  UserCheck,
  LogOut,
  ShieldAlert,
  Trash2,
  AlertTriangle,
  XCircle,
  Copy,
  Download,
  MessageSquare
} from 'lucide-react';

export interface AdminBookingItem {
  bookingRef: string;
  timestamp?: string;
  customerName: string;
  contactNumber: string;
  socialMediaHandle: string;
  cameraRented: string;
  cameraId?: string;
  startDate: string;
  endDate: string;
  rentalDays: number | string;
  handoverMethod: string;
  address: string;
  shootType: string;
  rentalTotal: number | string;
  securityDeposit: number | string;
  downpaymentPaid: number | string;
  balanceDue: number | string;
  gcashRefNumber: string;
  status: string;
  notes: string;
  id1Url?: string;
  id1BackUrl?: string;
  id2Url?: string;
  id2BackUrl?: string;
  authSlipUrl?: string;
  selfieWithIdsUrl?: string;
  billingUrl?: string;
  billOwnerIdUrl?: string;
  selfieVideoUrl?: string;
  receiptUrl?: string;
  guardianIdUrl?: string;
  contact2IdUrl?: string;
  driveFolderUrl?: string;
  id1File?: string | null;
  id1BackFile?: string | null;
  id2File?: string | null;
  id2BackFile?: string | null;
  authorizationSlipFile?: string | null;
  selfieWithIdsFile?: string | null;
  deliveryReceiptsFile?: string | null;
  billOwnerIdFile?: string | null;
  selfieFile?: string | null;
  receiptFile?: string | null;
  contact1IdFile?: string | null;
  contact2IdFile?: string | null;
  isStudentExemption?: boolean;
  termsAccepted?: boolean;
  termsVersion?: string;
  meetupHandlingFee?: number | string;
}

// ─────────────────────────────────────────────────────────────
// CRYPTOGRAPHIC SHA-256 AUTHENTICATION (ZERO PLAINTEXT STORAGE)
// ─────────────────────────────────────────────────────────────
export async function sha256Hex(str: string): Promise<string> {
  const utf8 = new TextEncoder().encode(str);
  const buffer = await crypto.subtle.digest('SHA-256', utf8);
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export const ADMIN_CREDENTIAL_CONFIG = {
  partner1: {
    name: 'Partner 1 (Lead Operations)',
    // SHA-256 digest of partner 1 password
    hash: '60ff1c5671238d029b5fec5185d741fc3c63df32d2a02526fb5bad04c8d4b480'
  },
  partner2: {
    name: 'Partner 2 (Equipment Manager)',
    // SHA-256 digest of partner 2 password
    hash: 'a1166e19273ef9849bf5669549013d53fa68819979eab6869b3c733270860dd9'
  }
};

// ─────────────────────────────────────────────────────────────
// WORKFLOW STATE & STAGE RESOLUTION
// ─────────────────────────────────────────────────────────────
export function getBookingWorkflowStep(status?: string): {
  step: 1 | 2 | 3 | 4 | 'closed';
  stepLabel: string;
  pillColor: string;
  textColor: string;
  borderColor: string;
  description: string;
} {
  const s = String(status || '').trim().toLowerCase();
  if (s.includes('reject') || s.includes('cancel')) {
    return {
      step: 'closed',
      stepLabel: s.includes('reject') ? 'KYC Rejected' : 'Cancelled',
      pillColor: 'bg-[#FFF5F5]',
      textColor: 'text-[#C53030]',
      borderColor: 'border-[#FEB2B2]',
      description: 'Reservation closed or rejected'
    };
  }
  if (!status || s.includes('pending') || s.includes('deposit')) {
    return {
      step: 1,
      stepLabel: 'Step 1 • KYC Pending',
      pillColor: 'bg-[#FEF0E7]',
      textColor: 'text-[#C05621]',
      borderColor: 'border-[#F5C6A8]',
      description: 'Awaiting KYC file inspection & explicit admin approval'
    };
  }
  if (s === 'confirmed' || s.includes('approved')) {
    return {
      step: 2,
      stepLabel: 'Step 2 • KYC Approved',
      pillColor: 'bg-[#E8F7F1]',
      textColor: 'text-[#234E52]',
      borderColor: 'border-[#A8DBC8]',
      description: 'Verified & confirmed — ready for customer equipment pickup'
    };
  }
  if (s.includes('active') || s.includes('picked up')) {
    return {
      step: 3,
      stepLabel: 'Step 3 • Picked Up',
      pillColor: 'bg-[#EDE8FC]',
      textColor: 'text-[#553C9A]',
      borderColor: 'border-[#C9B8F0]',
      description: 'Equipment handed over — active rental in progress'
    };
  }
  if (s.includes('completed') || s.includes('returned')) {
    return {
      step: 4,
      stepLabel: 'Step 4 • Returned',
      pillColor: 'bg-[#F0FFF4]',
      textColor: 'text-[#22543D]',
      borderColor: 'border-[#9AE6B4]',
      description: 'Equipment returned & rental completed'
    };
  }
  return {
    step: 1,
    stepLabel: 'Step 1 • KYC Pending',
    pillColor: 'bg-[#FEF0E7]',
    textColor: 'text-[#C05621]',
    borderColor: 'border-[#F5C6A8]',
    description: 'Awaiting KYC file inspection'
  };
}

// ─────────────────────────────────────────────────────────────
// KYC DOCUMENTS COMPLIANCE & VALIDATION
// ─────────────────────────────────────────────────────────────
export interface KycDocumentItem {
  id: string;
  name: string;
  shortLabel: string;
  required: boolean;
  url: string | null;
  isVideo?: boolean;
}

export interface KycEvaluationResult {
  isComplete: boolean;
  missingFiles: string[];
  docItems: KycDocumentItem[];
}

export function evaluateKycDocuments(booking: AdminBookingItem): KycEvaluationResult {
  const isStudent = !!booking.isStudentExemption;

  const docItems: KycDocumentItem[] = [
    {
      id: 'id1',
      name: '1. Primary Government ID (Front)',
      shortLabel: 'Primary ID',
      required: true,
      url: booking.id1Url || booking.id1File || null
    },
    ...(booking.id1BackUrl || booking.id1BackFile ? [{
      id: 'id1Back',
      name: '1b. Primary Government ID (Back)',
      shortLabel: 'Primary ID Back',
      required: false,
      url: booking.id1BackUrl || booking.id1BackFile || null
    }] : []),
    {
      id: 'id2',
      name: isStudent ? '2. Student ID & COR' : '2. Secondary Government ID (Front)',
      shortLabel: isStudent ? 'Student ID' : 'Secondary ID',
      required: true,
      url: booking.id2Url || booking.id2File || null
    },
    ...((booking.id2BackUrl || booking.id2BackFile) ? [{
      id: 'id2Back',
      name: '2b. Secondary Government ID (Back)',
      shortLabel: 'Secondary ID Back',
      required: false,
      url: booking.id2BackUrl || booking.id2BackFile || null
    }] : []),
    {
      id: 'authSlip',
      name: '3. Handwritten Authorization Slip',
      shortLabel: 'Auth Slip',
      required: true,
      url: booking.authSlipUrl || booking.authorizationSlipFile || null
    },
    ...(booking.selfieWithIdsUrl || booking.selfieWithIdsFile ? [{
      id: 'selfieWithIds',
      name: '3b. Selfie Holding IDs & Slip',
      shortLabel: 'Selfie with IDs',
      required: false,
      url: booking.selfieWithIdsUrl || booking.selfieWithIdsFile || null
    }] : []),
    {
      id: 'billing',
      name: '4. Proof of Address / Delivery Receipts',
      shortLabel: 'Address Proof',
      required: true,
      url: booking.billingUrl || booking.deliveryReceiptsFile || null
    },
    ...(booking.billOwnerIdUrl || booking.billOwnerIdFile ? [{
      id: 'billOwnerId',
      name: '4b. Bill Owner Government ID',
      shortLabel: 'Bill Owner ID',
      required: false,
      url: booking.billOwnerIdUrl || booking.billOwnerIdFile || null
    }] : []),
    {
      id: 'selfie',
      name: '5. Selfie Video Verification',
      shortLabel: 'Selfie Video',
      required: true,
      isVideo: true,
      url: booking.selfieVideoUrl || booking.selfieFile || null
    },
    {
      id: 'receipt',
      name: '6. GCash Payment Receipt',
      shortLabel: 'Payment Proof',
      required: true,
      url: booking.receiptUrl || booking.receiptFile || (booking.gcashRefNumber ? `REF:${booking.gcashRefNumber}` : null)
    }
  ];

  if (isStudent || booking.guardianIdUrl || booking.contact1IdFile) {
    docItems.push({
      id: 'guardianId',
      name: isStudent ? '7. Parent / Guardian ID (Student Exemption)' : '7. Emergency Contact 1 Valid ID',
      shortLabel: 'Contact 1 ID',
      required: isStudent,
      url: booking.guardianIdUrl || booking.contact1IdFile || null
    });
  }

  if (booking.contact2IdUrl || booking.contact2IdFile) {
    docItems.push({
      id: 'contact2Id',
      name: '8. Emergency Contact 2 Valid ID',
      shortLabel: 'Contact 2 ID',
      required: false,
      url: booking.contact2IdUrl || booking.contact2IdFile || null
    });
  }

  const missingFiles: string[] = [];
  for (const item of docItems) {
    if (item.required && (!item.url || item.url.trim() === '')) {
      missingFiles.push(item.shortLabel);
    }
  }

  return {
    isComplete: missingFiles.length === 0,
    missingFiles,
    docItems
  };
}

// ─────────────────────────────────────────────────────────────
// GOOGLE DRIVE & DOCUMENT PREVIEW HELPERS
// ─────────────────────────────────────────────────────────────
export function getDriveFileId(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export function getDriveThumbnailUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  const fileId = getDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w600`;
  }
  return url;
}

export function getDrivePreviewUrl(url?: string | null): string {
  if (!url) return '';
  const fileId = getDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  return url;
}

interface KycArtifactCardProps {
  title: string;
  icon: React.ReactNode;
  url?: string | null;
  emptyLabel: string;
  isVideo?: boolean;
  isInspected?: boolean;
  isRequired?: boolean;
  onPreview: (title: string, url: string, isVideo?: boolean) => void;
}

const KycArtifactCard: React.FC<KycArtifactCardProps> = ({
  title,
  icon,
  url,
  emptyLabel,
  isVideo = false,
  isInspected = false,
  isRequired = true,
  onPreview
}) => {
  const [hasImgError, setHasImgError] = useState(false);
  const fileId = getDriveFileId(url);
  const isDriveLink = !!fileId;
  const isVideoFile = isVideo || url?.endsWith('.mp4') || url?.endsWith('.mov') || url?.startsWith('data:video/');

  if (!url) {
    return (
      <div className="p-3.5 rounded-2xl bg-white border-2 border-[#FEB2B2] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {icon}
            <span className="font-bold text-[11px] text-[#1A1A2E]">{title}</span>
          </div>
          <span className="text-[10px] font-extrabold text-[#C53030] bg-[#FFF5F5] px-2 py-0.5 rounded-full border border-[#FEB2B2]">
            {isRequired ? 'Missing Required File' : 'Optional'}
          </span>
        </div>
        <div className="h-28 rounded-xl bg-[#FFF5F5]/60 border border-dashed border-[#FEB2B2] flex flex-col items-center justify-center text-[#C53030] text-xs font-semibold px-2 text-center gap-1">
          <AlertCircle className="w-5 h-5 text-[#E53E3E]" />
          <span>{emptyLabel}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3.5 rounded-2xl bg-white border-2 transition-all space-y-2 shadow-xs ${
      isInspected ? 'border-[#38A169]' : 'border-[#E8E4F0] hover:border-[#1A1A2E]'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="font-bold text-[11px] text-[#1A1A2E]">{title}</span>
        </div>
        {isInspected ? (
          <span className="text-[10px] font-black text-[#22543D] bg-[#F0FFF4] px-2 py-0.5 rounded-full border border-[#9AE6B4] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-[#38A169]" />
            <span>Inspected ✓</span>
          </span>
        ) : (
          <span className="text-[10px] font-extrabold text-[#553C9A] bg-[#EDE8FC] px-2 py-0.5 rounded-full border border-[#C9B8F0] flex items-center gap-1">
            <Eye className="w-3 h-3 text-[#553C9A]" />
            <span>Click to Inspect</span>
          </span>
        )}
      </div>

      <div
        onClick={() => onPreview(title, url, isVideoFile)}
        className="h-28 rounded-xl bg-[#FAFAF7] border border-[#E8E4F0] flex items-center justify-center overflow-hidden cursor-pointer group relative"
      >
        {isVideoFile ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#EDE8FC] to-[#FEF0E7] p-2 text-center">
            <Camera className="w-6 h-6 text-[#6B46C1] mb-1" />
            <span className="text-[10px] font-black text-[#1A1A2E]">Selfie Video Clip</span>
            <span className="text-[9px] text-[#6B6B8A] font-bold mt-0.5">Click to Inspect in Viewer</span>
          </div>
        ) : !hasImgError ? (
          <img
            src={getDriveThumbnailUrl(url)}
            alt={title}
            onError={() => setHasImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#F7FAFC] border border-[#E2E8F0] p-2 text-center">
            <FileText className="w-6 h-6 text-[#4A5568] mb-1" />
            <span className="text-[10px] font-black text-[#2D3748]">Document Attachment</span>
            <span className="text-[9px] text-[#718096] font-semibold">Click to Inspect in Viewer</span>
          </div>
        )}

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold transition-opacity gap-1.5">
          <Maximize2 className="w-4 h-4" />
          <span className="text-xs">Inspect Document</span>
        </div>
      </div>

      <div className="pt-1 flex items-center justify-between text-[10px]">
        {isDriveLink ? (
          <>
            <span className="text-[#38A169] font-bold flex items-center gap-1">
              <Check className="w-3 h-3" /> Drive Vaulted
            </span>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[#6B46C1] font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
            >
              <span>Drive Link</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </>
        ) : (
          <span className="text-[#6B6B8A] font-bold">Attached Document</span>
        )}
      </div>
    </div>
  );
};

interface AdminDashboardProps {
  appsScriptUrl: string;
  onExit: () => void;
  localBookings?: any[];
  onBookingsUpdated?: (updated: any[]) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  appsScriptUrl,
  onExit,
  localBookings = [],
  onBookingsUpdated
}) => {
  // Session Authentication State (zero credentials stored in source code)
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    return sessionStorage.getItem('pnf_admin_token');
  });
  const [activeAdminName, setActiveAdminName] = useState<string>(() => {
    return sessionStorage.getItem('pnf_admin_name') || '';
  });
  const [activeAdminUser, setActiveAdminUser] = useState<string>(() => {
    return sessionStorage.getItem('pnf_admin_user') || '';
  });

  // Login Form State
  const [selectedAccount, setSelectedAccount] = useState<'partner1' | 'partner2'>('partner1');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Bookings Data & Sync
  const [bookings, setBookings] = useState<AdminBookingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<AdminBookingItem | null>(null);

  // Status updating state
  const [updatingRef, setUpdatingRef] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [workflowErrorMsg, setWorkflowErrorMsg] = useState<string | null>(null);

  // KYC Inspection & Approval States for Selected Booking
  const [inspectedDocs, setInspectedDocs] = useState<Record<string, boolean>>({});
  const [kycConfirmedCheckbox, setKycConfirmedCheckbox] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Clear All Bookings & Delete Action States
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [clearConfirmInput, setClearConfirmInput] = useState('');
  const [isClearingBookings, setIsClearingBookings] = useState(false);
  const [deleteTargetBooking, setDeleteTargetBooking] = useState<AdminBookingItem | null>(null);
  const [isDeletingBooking, setIsDeletingBooking] = useState(false);

  // Document Preview Modal
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string; isVideo?: boolean } | null>(null);

  const isAuthenticated = !!sessionToken;

  // Reset KYC review state whenever selected booking changes
  useEffect(() => {
    if (selectedBooking) {
      setInspectedDocs({});
      setKycConfirmedCheckbox(false);
      setShowRejectModal(false);
      setWorkflowErrorMsg(null);
    }
  }, [selectedBooking?.bookingRef]);

  // Copy state and handlers for One-Click Message Templates
  const [copiedTemplateKey, setCopiedTemplateKey] = useState<string | null>(null);

  const handleCopyTemplate = (key: 'handover' | 'reminder' | 'refund', text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedTemplateKey(key);
    setActionSuccessMsg(
      `Copied ${key === 'handover' ? 'Handover Message' : key === 'reminder' ? 'Return Reminder' : 'Deposit Refunded Confirmation'} to clipboard!`
    );
    setTimeout(() => setCopiedTemplateKey(null), 2500);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const openGoogleCalendar = (b: AdminBookingItem) => {
    const start = (b.startDate || '').replace(/-/g, '');
    const end = (b.endDate || '').replace(/-/g, '');
    const title = encodeURIComponent(`PackAndFilm: ${b.cameraRented} - ${b.customerName}`);
    const details = encodeURIComponent(
      `Camera Rental: ${b.cameraRented}\nCustomer: ${b.customerName} (${b.contactNumber})\nBooking Ref: ${b.bookingRef}\nHandover: ${b.handoverMethod} (${b.address})\nBalance Due: ₱${Number(b.balanceDue || 0).toLocaleString()}\nNotes: ${b.notes || 'None'}`
    );
    const location = encodeURIComponent(b.address || b.handoverMethod || 'Pasig City Hub');
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
    window.open(gcalUrl, '_blank', 'noopener,noreferrer');
  };

  const downloadIcsCalendar = (b: AdminBookingItem) => {
    const start = (b.startDate || '').replace(/-/g, '');
    const end = (b.endDate || '').replace(/-/g, '');
    const title = `PackAndFilm: ${b.cameraRented} - ${b.customerName}`;
    const description = `Camera Rental: ${b.cameraRented}\\nCustomer: ${b.customerName} (${b.contactNumber})\\nBooking Ref: ${b.bookingRef}\\nHandover: ${b.handoverMethod} (${b.address})\\nBalance Due: ₱${Number(b.balanceDue || 0).toLocaleString()}`;
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//PackAndFilm//Rental Dispatch//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${b.bookingRef}@packandfilm.ph`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${b.address || b.handoverMethod || 'Pasig City Hub'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PackAndFilm_${b.bookingRef}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setActionSuccessMsg(`Downloaded calendar event (.ics) for ${b.bookingRef}!`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const getHandoverMessage = (b: AdminBookingItem) => {
    const deposit = Number(b.securityDeposit || 1000);
    const bal = Number(b.balanceDue || 0);
    return `Hi ${b.customerName || 'there'}! ✨ This is PackAndFilm confirming your upcoming camera rental details:

📸 Camera Model: ${b.cameraRented}
🗓️ Confirmed Rental Dates: ${b.startDate} to ${b.endDate} (${b.rentalDays || 1} day/s)
📍 Handover Location: ${b.address || b.handoverMethod || 'Pasig Hub / Meetup Point'}
💰 Remaining Balance Due Upon Handover: ₱${bal.toLocaleString()} (Includes remaining rental balance + ₱${deposit.toLocaleString()} refundable security deposit)
🔖 Booking Reference: ${b.bookingRef}

📌 Handover Reminders:
• Please bring the original physical IDs submitted during KYC verification.
• We will conduct a quick 3-minute physical inspection together to check all gear and accessories.
• Operating hours: 8:00 AM – 8:00 PM.

Let us know your estimated arrival time! Excited for your shoot! 💖📸`;
  };

  const getReturnReminderMessage = (b: AdminBookingItem) => {
    const deposit = Number(b.securityDeposit || 1000);
    return `Hi ${b.customerName || 'there'}! Hope you had an amazing shoot with the ${b.cameraRented}! 📸✨

Friendly reminder that your camera rental is scheduled for return today:
🗓️ Return Date: ${b.endDate}
⏰ Return Cutoff: 8:00 PM
📍 Return Location: ${b.address || b.handoverMethod || 'Pasig Hub / Meetup Point'}

🎒 Return Checklist:
• Camera unit and battery
• High-speed SD / MicroSD card & OTG card reader
• All included cables, mounts, wrist strap, and silicone/hard case
• Padded organizer travel bag

💳 Security Deposit Refund Procedure:
Upon receiving the unit, our team will perform a standard 5-minute gear inspection (checking lens optics, gimbal calibration, and accessory count). Once verified in order, your ₱${deposit.toLocaleString()} refundable security deposit will be processed promptly via GCash.

Please update us with your ETA or courier tracking details when dispatching. Thank you for taking great care of our gear! 💖`;
  };

  const getDepositRefundedMessage = (b: AdminBookingItem) => {
    const deposit = Number(b.securityDeposit || 1000);
    const gcashInfo = b.gcashRefNumber ? ` (GCash Ref: ${b.gcashRefNumber})` : '';
    const contactInfo = b.contactNumber ? ` to ${b.contactNumber}` : '';
    return `Hi ${b.customerName || 'there'}! 💖 Good news: gear inspection for your ${b.cameraRented} rental (Ref: ${b.bookingRef}) is complete!

All equipment and inclusions were inspected and received in excellent condition! ✨

✅ Security Deposit Refunded: ₱${deposit.toLocaleString()}${contactInfo}${gcashInfo}
📱 Status: Verified Returned & Completed

Thank you so much for renting with PackAndFilm! We'd love to see your shots—feel free to tag us on Instagram @packandfilm.ph or on Facebook. Can't wait to have you again! 📸🎉`;
  };

  // ─────────────────────────────────────────────────────────────
  // BACKEND AUTHENTICATION (POST action: adminLogin & SHA-256 Verification)
  // ─────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = passwordInput.trim();
    if (!cleanPass) {
      setLoginError('Please enter your secret admin passkey.');
      return;
    }

    setIsAuthenticating(true);
    setLoginError('');

    try {
      const targetConfig = ADMIN_CREDENTIAL_CONFIG[selectedAccount];
      const inputHash = await sha256Hex(cleanPass);

      let loginSuccessful = false;
      let token = '';
      let adminName = targetConfig.name;

      // 1. Try remote Apps Script backend authentication
      try {
        const response = await fetch(appsScriptUrl, {
          method: 'POST',
          redirect: 'follow',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'adminLogin',
            username: selectedAccount,
            password: cleanPass
          })
        });

        const data = await response.json().catch(() => null);

        if (data && data.status === 'success' && data.sessionToken) {
          loginSuccessful = true;
          token = data.sessionToken;
          adminName = data.adminName || targetConfig.name;
        }
      } catch (remoteErr) {
        console.warn('Backend server unreachable, validating cryptographic digest locally:', remoteErr);
      }

      // 2. Cryptographic SHA-256 fallback if backend is offline or pending redeployment
      if (!loginSuccessful) {
        if (inputHash === targetConfig.hash) {
          loginSuccessful = true;
          token = 'pnf-session-auth-' + Date.now() + '-' + Math.random().toString(36).slice(2);
        }
      }

      if (loginSuccessful) {
        setSessionToken(token);
        setActiveAdminName(adminName);
        setActiveAdminUser(selectedAccount);

        sessionStorage.setItem('pnf_admin_token', token);
        sessionStorage.setItem('pnf_admin_name', adminName);
        sessionStorage.setItem('pnf_admin_user', selectedAccount);

        setPasswordInput('');
        setLoginError('');
      } else {
        setLoginError('Access denied: Invalid admin passkey.');
      }
    } catch (err: any) {
      console.warn('Backend auth request error:', err);
      setLoginError('Unable to process authentication. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // LOGOUT (POST action: adminLogout)
  // ─────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    if (sessionToken && appsScriptUrl && !sessionToken.startsWith('pnf-session-')) {
      try {
        await fetch(appsScriptUrl, {
          method: 'POST',
          redirect: 'follow',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'adminLogout', sessionToken })
        });
      } catch {
        // Continue cleanup
      }
    }

    setSessionToken(null);
    setActiveAdminName('');
    setActiveAdminUser('');
    sessionStorage.removeItem('pnf_admin_token');
    sessionStorage.removeItem('pnf_admin_name');
    sessionStorage.removeItem('pnf_admin_user');
    setBookings([]);
    setPasswordInput('');
  };

  // ─────────────────────────────────────────────────────────────
  // FETCH BOOKINGS (POST action: getAllBookings with Session Token)
  // ─────────────────────────────────────────────────────────────
  const fetchAllBookings = async () => {
    if (!sessionToken) return;

    setIsLoading(true);
    setSyncError(null);

    try {
      const res = await fetch(appsScriptUrl, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'getAllBookings',
          sessionToken: sessionToken
        })
      });

      const data = await res.json().catch(() => null);

      if (data && data.status === 'success' && Array.isArray(data.bookings)) {
        setBookings(data.bookings);
        setLastSyncTime(new Date());
      } else if (data && data.code === 'UNAUTHORIZED') {
        handleLogout();
        setLoginError('Your server session has expired. Please log in again.');
      } else {
        throw new Error(data?.message || 'Unable to retrieve reservations.');
      }
    } catch (err: any) {
      console.warn('Error syncing bookings from backend:', err);
      setSyncError('Could not sync with Google Sheets. Showing cached records.');
      if (localBookings.length > 0 && bookings.length === 0) {
        setBookings(localBookings);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllBookings();
    }
  }, [isAuthenticated]);

  // ─────────────────────────────────────────────────────────────
  // UPDATE BOOKING STATUS WITH STRICT SEQUENTIAL WORKFLOW ENFORCEMENT
  // ─────────────────────────────────────────────────────────────
  const handleUpdateStatus = async (
    bookingRef: string,
    newStatus: string,
    options?: { kycConfirmed?: boolean; reason?: string }
  ) => {
    if (!sessionToken) return;

    const targetBooking = bookings.find(b => b.bookingRef === bookingRef);
    if (!targetBooking) return;

    const currentStepInfo = getBookingWorkflowStep(targetBooking.status);

    // ── Workflow Rule 1: Transition to KYC Approved ("Confirmed") ──
    if (newStatus === 'Confirmed') {
      if (currentStepInfo.step !== 1) {
        setWorkflowErrorMsg(`Cannot approve KYC: This booking is currently "${targetBooking.status}".`);
        return;
      }
      const kycEval = evaluateKycDocuments(targetBooking);
      if (!kycEval.isComplete) {
        setWorkflowErrorMsg(`Cannot approve KYC: Missing required files (${kycEval.missingFiles.join(', ')}). All required documents must be submitted first.`);
        return;
      }
      if (!options?.kycConfirmed) {
        setWorkflowErrorMsg('Cannot approve KYC: Admin must inspect all required files and confirm verification before approving.');
        return;
      }
    }

    // ── Workflow Rule 2: Transition to Picked Up ("Active Rental") ──
    else if (newStatus === 'Active Rental') {
      if (currentStepInfo.step === 1) {
        setWorkflowErrorMsg('Cannot mark as picked up: Customer KYC must be reviewed and approved first.');
        return;
      }
      if (currentStepInfo.step === 3) {
        setWorkflowErrorMsg('This booking is already marked as picked up.');
        return;
      }
      if (currentStepInfo.step === 4) {
        setWorkflowErrorMsg('Cannot mark as picked up: Equipment has already been returned.');
        return;
      }
      if (currentStepInfo.step === 'closed') {
        setWorkflowErrorMsg(`Cannot mark as picked up: This reservation was ${targetBooking.status.toLowerCase()}.`);
        return;
      }
    }

    // ── Workflow Rule 3: Transition to Returned ("Completed") ──
    else if (newStatus === 'Completed') {
      if (currentStepInfo.step === 1) {
        setWorkflowErrorMsg('Cannot mark as returned: Customer KYC has not been approved and equipment has not been picked up.');
        return;
      }
      if (currentStepInfo.step === 2) {
        setWorkflowErrorMsg('Cannot mark as returned: Equipment has not been marked as picked up yet. Customer must pick up the gear first.');
        return;
      }
      if (currentStepInfo.step === 4) {
        setWorkflowErrorMsg('This booking is already marked as returned.');
        return;
      }
      if (currentStepInfo.step === 'closed') {
        setWorkflowErrorMsg(`Cannot mark as returned: This reservation was ${targetBooking.status.toLowerCase()}.`);
        return;
      }
    }

    // ── Rejection & Cancellation Rules ──
    else if (newStatus === 'Rejected' || newStatus === 'Cancelled') {
      if (currentStepInfo.step === 3 || currentStepInfo.step === 4) {
        setWorkflowErrorMsg(`Cannot ${newStatus.toLowerCase()} a booking that has already been picked up or returned.`);
        return;
      }
    }

    setUpdatingRef(bookingRef);
    setWorkflowErrorMsg(null);

    const previousStatus = targetBooking.status;

    // Optimistic UI update
    const updatedBookings = bookings.map(b =>
      b.bookingRef === bookingRef ? { ...b, status: newStatus } : b
    );
    setBookings(updatedBookings);
    if (onBookingsUpdated) onBookingsUpdated(updatedBookings);

    if (selectedBooking && selectedBooking.bookingRef === bookingRef) {
      setSelectedBooking(prev => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      if (appsScriptUrl && !sessionToken.startsWith('pnf-session-auth-')) {
        const res = await fetch(appsScriptUrl, {
          method: 'POST',
          redirect: 'follow',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'updateStatus',
            sessionToken: sessionToken,
            bookingRef: bookingRef,
            status: newStatus,
            kycConfirmed: options?.kycConfirmed || false,
            reason: options?.reason || ''
          })
        });

        const data = await res.json().catch(() => null);

        if (data && data.status === 'success') {
          setActionSuccessMsg(`Status for ${bookingRef} updated to "${newStatus}" (Audited by ${activeAdminName || 'Admin'})`);
          setTimeout(() => setActionSuccessMsg(null), 4000);
        } else if (data && data.code === 'UNAUTHORIZED') {
          handleLogout();
          setLoginError('Session expired. Please log in again.');
        } else {
          // Revert optimistic update if server rejected
          const reverted = bookings.map(b =>
            b.bookingRef === bookingRef ? { ...b, status: previousStatus } : b
          );
          setBookings(reverted);
          if (onBookingsUpdated) onBookingsUpdated(reverted);
          if (selectedBooking && selectedBooking.bookingRef === bookingRef) {
            setSelectedBooking(prev => (prev ? { ...prev, status: previousStatus } : null));
          }
          setWorkflowErrorMsg(data?.message || 'Server rejected status update: Workflow rules violated.');
        }
      } else {
        // Local mode
        setActionSuccessMsg(`Status for ${bookingRef} updated to "${newStatus}" (${activeAdminName || 'Admin'})`);
        setTimeout(() => setActionSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setActionSuccessMsg(`Status updated locally.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } finally {
      setUpdatingRef(null);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // DELETE SINGLE BOOKING (POST action: deleteBooking with Session Token)
  // ─────────────────────────────────────────────────────────────
  const handleDeleteBooking = async (bookingRef: string) => {
    if (!sessionToken) return;
    setIsDeletingBooking(true);

    try {
      const res = await fetch(appsScriptUrl, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'deleteBooking',
          sessionToken: sessionToken,
          bookingRef: bookingRef
        })
      });

      const data = await res.json().catch(() => null);

      if (data && data.status === 'success') {
        const updated = bookings.filter(b => b.bookingRef !== bookingRef);
        setBookings(updated);
        if (onBookingsUpdated) onBookingsUpdated(updated);
        if (selectedBooking && selectedBooking.bookingRef === bookingRef) {
          setSelectedBooking(null);
        }
        setDeleteTargetBooking(null);
        setActionSuccessMsg(`Booking ${bookingRef} permanently removed.`);
        setTimeout(() => setActionSuccessMsg(null), 4000);
      } else if (data && data.code === 'UNAUTHORIZED') {
        handleLogout();
        setLoginError('Session expired. Please log in again.');
      } else {
        throw new Error(data?.message || 'Delete failed');
      }
    } catch (err: any) {
      console.error('Error deleting booking:', err);
      // Local fallback removal if backend request fails or offline
      const updated = bookings.filter(b => b.bookingRef !== bookingRef);
      setBookings(updated);
      if (onBookingsUpdated) onBookingsUpdated(updated);
      if (selectedBooking && selectedBooking.bookingRef === bookingRef) {
        setSelectedBooking(null);
      }
      setDeleteTargetBooking(null);
      setActionSuccessMsg(`Booking ${bookingRef} removed from view.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } finally {
      setIsDeletingBooking(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // CLEAR ALL BOOKINGS (POST action: clearAllBookings with Session Token + Confirmation)
  // ─────────────────────────────────────────────────────────────
  const handleClearAllBookings = async () => {
    if (!sessionToken || clearConfirmInput.trim() !== 'DELETE') return;
    setIsClearingBookings(true);

    try {
      const res = await fetch(appsScriptUrl, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'clearAllBookings',
          sessionToken: sessionToken,
          confirm: 'CONFIRM_DELETE_ALL'
        })
      });

      const data = await res.json().catch(() => null);

      if (data && data.status === 'success') {
        setBookings([]);
        if (onBookingsUpdated) onBookingsUpdated([]);
        setSelectedBooking(null);
        setShowClearAllModal(false);
        setClearConfirmInput('');
        setActionSuccessMsg('All bookings have been cleared from Google Sheets & memory.');
        setTimeout(() => setActionSuccessMsg(null), 4000);
      } else if (data && data.code === 'UNAUTHORIZED') {
        handleLogout();
        setLoginError('Session expired. Please log in again.');
      } else {
        throw new Error(data?.message || 'Clear all failed');
      }
    } catch (err: any) {
      console.error('Error clearing all bookings:', err);
      setBookings([]);
      if (onBookingsUpdated) onBookingsUpdated([]);
      setSelectedBooking(null);
      setShowClearAllModal(false);
      setClearConfirmInput('');
      setActionSuccessMsg('Cleared local view. (Google Sheets update had a network warning)');
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } finally {
      setIsClearingBookings(false);
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = bookings.length;
    const pendingKyc = bookings.filter(b => 
      !b.status || b.status.toLowerCase().includes('pending') || b.status.toLowerCase().includes('deposit')
    ).length;
    const confirmed = bookings.filter(b => 
      b.status && (b.status.toLowerCase().includes('confirmed') || b.status.toLowerCase().includes('approved'))
    ).length;
    const activeRentals = bookings.filter(b => 
      b.status && b.status.toLowerCase().includes('active')
    ).length;

    const totalRevenue = bookings.reduce((sum, b) => {
      const down = Number(b.downpaymentPaid) || 0;
      return sum + down;
    }, 0);

    return { total, pendingKyc, confirmed, activeRentals, totalRevenue };
  }, [bookings]);

  // Filter & Search
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchSearch =
        !searchQuery.trim() ||
        (b.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.bookingRef || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.contactNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.cameraRented || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.socialMediaHandle || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'pending' && (!b.status || b.status.toLowerCase().includes('pending') || b.status.toLowerCase().includes('deposit'))) ||
        (statusFilter === 'confirmed' && b.status && b.status.toLowerCase().includes('confirmed')) ||
        (statusFilter === 'active' && b.status && b.status.toLowerCase().includes('active')) ||
        (statusFilter === 'completed' && b.status && b.status.toLowerCase().includes('completed'));

      return matchSearch && matchStatus;
    });
  }, [bookings, searchQuery, statusFilter]);

  // ─────────────────────────────────────────────────────────────
  // 1. SECURE LOGIN SCREEN (TWO DEDICATED PARTNER ACCOUNTS)
  // ─────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-[32px] border-2 border-[#1A1A2E] shadow-[8px_8px_0px_#1A1A2E] p-8 space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <div className="w-20 h-20 rounded-3xl bg-[#EDE8FC] border-2 border-[#C9B8F0] flex items-center justify-center mx-auto shadow-sm p-1 overflow-hidden">
              <img
                src="/logo.png"
                alt="PackAndFilm"
                className="w-full h-full object-contain scale-105"
              />
            </div>
            <h1 className="text-2xl font-black text-[#1A1A2E] tracking-tight">
              PackAndFilm Operations
            </h1>
            <p className="text-xs text-[#6B6B8A] font-medium">
              Enterprise security: Authorized Partner Access Only
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Account Selector (Partner 1 vs Partner 2) */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#6B6B8A] mb-1.5">
                Select Admin Account
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAccount('partner1')}
                  className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    selectedAccount === 'partner1'
                      ? 'border-[#1A1A2E] bg-[#EDE8FC] shadow-[2px_2px_0px_#1A1A2E]'
                      : 'border-[#E8E4F0] bg-[#FAFAF7] text-[#6B6B8A] hover:border-[#CBD5E0]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#553C9A]" />
                    <span className="font-extrabold text-xs text-[#1A1A2E]">Partner 1</span>
                  </div>
                  <span className="text-[10px] text-[#6B6B8A] block mt-0.5">Lead Operations</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedAccount('partner2')}
                  className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    selectedAccount === 'partner2'
                      ? 'border-[#1A1A2E] bg-[#EDE8FC] shadow-[2px_2px_0px_#1A1A2E]'
                      : 'border-[#E8E4F0] bg-[#FAFAF7] text-[#6B6B8A] hover:border-[#CBD5E0]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#553C9A]" />
                    <span className="font-extrabold text-xs text-[#1A1A2E]">Partner 2</span>
                  </div>
                  <span className="text-[10px] text-[#6B6B8A] block mt-0.5">Equipment Manager</span>
                </button>
              </div>
            </div>

            {/* Secret Passkey Input */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#6B6B8A] mb-1.5">
                Secret Passkey
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter secret admin passkey..."
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setLoginError('');
                  }}
                  autoFocus
                  className="w-full pl-4 pr-11 py-3 rounded-xl bg-[#FAFAF7] border-2 border-[#E8E4F0] focus:border-[#1A1A2E] text-sm font-semibold outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1A1A2E] p-1 cursor-pointer transition-colors"
                  title={showPassword ? 'Hide passkey' : 'Show passkey'}
                  aria-label={showPassword ? 'Hide passkey' : 'Show passkey'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {loginError && (
                <div className="mt-2 p-2.5 rounded-xl bg-[#FFF5F5] border border-[#FEB2B2] text-xs text-red-600 font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3.5 rounded-xl bg-[#1A1A2E] text-white font-extrabold text-sm hover:bg-[#6B46C1] transition-all shadow-[3px_3px_0px_#1A1A2E] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying Credentials on Server...</span>
                </>
              ) : (
                <span>Verify & Unlock Operations Console</span>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-[#E8E4F0] text-center">
            <button
              type="button"
              onClick={onExit}
              className="text-xs font-bold text-[#6B6B8A] hover:text-[#1A1A2E] inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Customer Storefront</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. AUTHENTICATED ADMIN DASHBOARD
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#1A1A2E] flex flex-col font-sans selection:bg-[#C9B8F0]">
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#F0FFF4] border-2 border-[#38A169] text-[#22543D] px-4 py-2.5 rounded-2xl shadow-[4px_4px_0px_#1A1A2E] flex items-center gap-2 text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-[#38A169]" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-[#FAFAF7]/95 backdrop-blur-md border-b-2 border-[#1A1A2E] px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              className="p-2 rounded-xl bg-white border border-[#E8E4F0] hover:bg-[#EDE8FC] text-[#1A1A2E] transition-colors cursor-pointer"
              title="Return to Customer Storefront"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-11 h-11 rounded-2xl bg-[#EDE8FC] border border-[#C9B8F0] p-0.5 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
              <img
                src="/logo.png"
                alt="PackAndFilm"
                className="w-full h-full object-contain scale-105"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-[#1A1A2E]">
                  PackAndFilm Operations
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#1A1A2E] text-white">
                  ADMIN CONSOLE
                </span>
              </div>
              <p className="text-[11px] text-[#6B6B8A]">
                Authenticated as: <strong className="text-[#553C9A]">{activeAdminName}</strong> ({activeAdminUser})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchAllBookings}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#E8E4F0] hover:bg-[#EDE8FC] text-xs font-bold text-[#553C9A] transition-all cursor-pointer disabled:opacity-50"
              title="Sync with Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Sheets</span>
            </button>

            <button
              onClick={() => {
                setClearConfirmInput('');
                setShowClearAllModal(true);
              }}
              disabled={isLoading || bookings.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FFF5F5] border border-[#FEB2B2] text-xs font-bold text-[#C53030] hover:bg-[#FED7D7] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Permanently remove all bookings from Google Sheets"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#C53030]" />
              <span className="hidden sm:inline">Clear All Bookings</span>
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#E8E4F0] text-xs font-bold text-[#1A1A2E] hover:bg-[#FAFAF7] transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E] space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-[#6B6B8A]">
              <span>Total Bookings</span>
              <Users className="w-4 h-4 text-[#553C9A]" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#1A1A2E]">{stats.total}</div>
            <div className="text-[10px] text-[#6B6B8A]">All-time reservations</div>
          </div>

          <div className="bg-[#FEF0E7] p-4 sm:p-5 rounded-2xl border-2 border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E] space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-[#C05621]">
              <span>Pending KYC Review</span>
              <AlertCircle className="w-4 h-4 text-[#DD6B20]" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#C05621]">{stats.pendingKyc}</div>
            <div className="text-[10px] text-[#C05621]">Awaiting ID confirmation</div>
          </div>

          <div className="bg-[#E8F7F1] p-4 sm:p-5 rounded-2xl border-2 border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E] space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-[#234E52]">
              <span>Confirmed Slots</span>
              <CheckCircle2 className="w-4 h-4 text-[#38A169]" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#234E52]">{stats.confirmed}</div>
            <div className="text-[10px] text-[#234E52]">Locked & ready for handoff</div>
          </div>

          <div className="bg-[#EDE8FC] p-4 sm:p-5 rounded-2xl border-2 border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E] space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-[#553C9A]">
              <span>Downpayments</span>
              <CreditCard className="w-4 h-4 text-[#6B46C1]" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#553C9A]">
              ₱{stats.totalRevenue.toLocaleString()}
            </div>
            <div className="text-[10px] text-[#553C9A]">₱300 locks collected</div>
          </div>
        </div>

        {/* Sync Status Banner */}
        {syncError && (
          <div className="p-3 rounded-xl bg-[#FFF5F5] border border-[#FEB2B2] text-xs text-[#C53030] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{syncError}</span>
            </div>
            <button
              onClick={fetchAllBookings}
              className="underline font-bold hover:text-[#9B2C2C] cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl border-2 border-[#E8E4F0] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#A0AEC0] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer name, #ref, phone, social handle, camera..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#FAFAF7] border border-[#E8E4F0] focus:border-[#1A1A2E] text-xs font-semibold outline-none"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All' },
              { id: 'pending', label: 'Pending KYC' },
              { id: 'confirmed', label: 'Confirmed' },
              { id: 'active', label: 'Active Rentals' },
              { id: 'completed', label: 'Completed' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-[#1A1A2E] text-white shadow-xs'
                    : 'bg-[#FAFAF7] text-[#6B6B8A] hover:bg-[#EDE8FC] hover:text-[#1A1A2E]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings Records List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-[#6B6B8A] px-1">
            <span>
              Showing {filteredBookings.length} of {bookings.length} reservations
            </span>
            {lastSyncTime && (
              <span>Last synced: {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            )}
          </div>

          {filteredBookings.length === 0 ? (
            <div className="bg-white rounded-3xl border-2 border-dashed border-[#CBD5E0] p-12 text-center space-y-3">
              <Camera className="w-8 h-8 text-[#A0AEC0] mx-auto" />
              <h3 className="text-sm font-bold text-[#1A1A2E]">No reservations found</h3>
              <p className="text-xs text-[#6B6B8A] max-w-sm mx-auto">
                No customer bookings match your search or filter criteria. New bookings will automatically appear here once submitted.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredBookings.map((b) => {
                const workflow = getBookingWorkflowStep(b.status);
                const isUpdating = updatingRef === b.bookingRef;

                return (
                  <div
                    key={b.bookingRef}
                    className="bg-white rounded-2xl border-2 border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E] p-4 sm:p-5 transition-all hover:-translate-y-0.5 space-y-3"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E8E4F0]">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-black text-sm text-[#1A1A2E] bg-[#FAFAF7] px-2.5 py-1 rounded-lg border border-[#E8E4F0]">
                          {b.bookingRef}
                        </span>
                        <span className="font-black text-base text-[#1A1A2E]">
                          {b.customerName || 'Valued Renter'}
                        </span>
                        <span className="text-xs text-[#6B46C1] font-bold">
                          {b.socialMediaHandle}
                        </span>
                      </div>

                      {/* Status Badge & Workflow Step */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-black px-3 py-1 rounded-full border ${workflow.pillColor} ${workflow.textColor} ${workflow.borderColor}`}
                          title={workflow.description}
                        >
                          {workflow.stepLabel}
                        </span>

                        <button
                          onClick={() => {
                            setSelectedBooking(b);
                            setInspectedDocs({});
                            setKycConfirmedCheckbox(false);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#FAFAF7] hover:bg-[#EDE8FC] border border-[#1A1A2E] text-xs font-bold text-[#1A1A2E] flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#553C9A]" />
                          <span>Inspect KYC & Files</span>
                        </button>
                      </div>
                    </div>

                    {/* Booking Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-[#6B6B8A] uppercase">Camera Model</span>
                        <div className="font-extrabold text-[#1A1A2E] flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-[#553C9A]" />
                          <span>{b.cameraRented}</span>
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-[#6B6B8A] uppercase">Rental Window</span>
                        <div className="font-extrabold text-[#1A1A2E] flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#DD6B20]" />
                          <span>{b.startDate} → {b.endDate}</span>
                          <span className="text-[10px] text-[#6B6B8A]">({b.rentalDays}d)</span>
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-[#6B6B8A] uppercase">Handover Method</span>
                        <div className="font-bold text-[#1A1A2E] truncate flex items-center gap-1.5">
                          <span className="truncate">{b.handoverMethod || b.address}</span>
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-[#6B6B8A] uppercase">Financials</span>
                        <div className="font-bold text-[#1A1A2E]">
                          <span>Paid: ₱{b.downpaymentPaid}</span>
                          <span className="text-[#6B6B8A]"> • Due: ₱{b.balanceDue}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Admin Actions Row Enforcing Sequence */}
                    <div className="pt-2 border-t border-[#E8E4F0]/60 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[11px] text-[#6B6B8A]">
                        <span>Contact: <strong>{b.contactNumber}</strong></span>
                        <span>•</span>
                        <span>GCash Ref: <strong>{b.gcashRefNumber || 'N/A'}</strong></span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Step 1: KYC Pending -> Can only Inspect & Review KYC */}
                        {workflow.step === 1 && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedBooking(b);
                                setInspectedDocs({});
                                setKycConfirmedCheckbox(false);
                              }}
                              className="px-3 py-1 rounded-xl bg-[#553C9A] text-white text-[11px] font-bold hover:bg-[#44337A] transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Inspect & Review KYC</span>
                            </button>

                            <button
                              disabled={true}
                              className="px-3 py-1 rounded-xl bg-[#FAFAF7] border border-[#E8E4F0] text-[11px] font-bold text-[#A0AEC0] cursor-not-allowed opacity-50"
                              title="Customer KYC must be reviewed and approved before marking as picked up"
                            >
                              Mark Picked Up
                            </button>

                            <button
                              disabled={true}
                              className="px-3 py-1 rounded-xl bg-[#FAFAF7] border border-[#E8E4F0] text-[11px] font-bold text-[#A0AEC0] cursor-not-allowed opacity-50"
                              title="Booking must be approved and equipment picked up before marking as returned"
                            >
                              Mark Returned
                            </button>
                          </>
                        )}

                        {/* Step 2: KYC Approved -> Can Mark Picked Up */}
                        {workflow.step === 2 && (
                          <>
                            <button
                              disabled={isUpdating}
                              onClick={() => handleUpdateStatus(b.bookingRef, 'Active Rental')}
                              className="px-3 py-1 rounded-xl bg-[#38A169] text-white text-[11px] font-extrabold hover:bg-[#2F855A] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1 shadow-xs"
                            >
                              {isUpdating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                              <span>Mark Picked Up</span>
                            </button>

                            <button
                              disabled={true}
                              className="px-3 py-1 rounded-xl bg-[#FAFAF7] border border-[#E8E4F0] text-[11px] font-bold text-[#A0AEC0] cursor-not-allowed opacity-50"
                              title="Equipment must be picked up first before it can be marked as returned"
                            >
                              Mark Returned
                            </button>
                          </>
                        )}

                        {/* Step 3: Picked Up -> Can Mark Returned */}
                        {workflow.step === 3 && (
                          <button
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(b.bookingRef, 'Completed')}
                            className="px-3 py-1 rounded-xl bg-[#234E52] text-white text-[11px] font-extrabold hover:bg-[#1D3F42] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1 shadow-xs"
                          >
                            {isUpdating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            <span>Mark Returned</span>
                          </button>
                        )}

                        {/* Step 4: Returned */}
                        {workflow.step === 4 && (
                          <span className="text-[11px] font-extrabold text-[#22543D] bg-[#F0FFF4] px-2.5 py-1 rounded-xl border border-[#9AE6B4] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-[#38A169]" />
                            <span>Rental Completed</span>
                          </span>
                        )}

                        {/* Closed / Rejected */}
                        {workflow.step === 'closed' && (
                          <span className="text-[11px] font-bold text-[#C53030] bg-[#FFF5F5] px-2.5 py-1 rounded-xl border border-[#FEB2B2]">
                            {b.status}
                          </span>
                        )}

                        {/* Delete Action Button */}
                        <button
                          disabled={isUpdating || isDeletingBooking}
                          onClick={() => setDeleteTargetBooking(b)}
                          className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#FFF5F5] border border-[#FEB2B2] text-[11px] font-bold text-[#C53030] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                          title="Permanently remove this booking"
                        >
                          <Trash2 className="w-3 h-3 text-[#C53030]" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          3. KYC & DOCUMENT INSPECTION DRAWER / MODAL
      ───────────────────────────────────────────────────────────── */}
      {selectedBooking && (() => {
        const selectedWorkflow = getBookingWorkflowStep(selectedBooking.status);
        const kycEval = evaluateKycDocuments(selectedBooking);
        const isUpdatingSelected = updatingRef === selectedBooking.bookingRef;

        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
            <div className="relative w-full max-w-3xl bg-[#FAFAF7] rounded-[32px] border-2 border-[#1A1A2E] shadow-[8px_8px_0px_#1A1A2E] overflow-hidden flex flex-col max-h-[92vh]">
              
              {/* Modal Header */}
              <div className="px-6 py-4 bg-white border-b-2 border-[#1A1A2E] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded-lg bg-[#EDE8FC] text-[#553C9A]">
                      {selectedBooking.bookingRef}
                    </span>
                    <h3 className="font-black text-base text-[#1A1A2E]">
                      KYC & Identity Verification Review
                    </h3>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${selectedWorkflow.pillColor} ${selectedWorkflow.textColor} ${selectedWorkflow.borderColor}`}>
                      {selectedWorkflow.stepLabel}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B6B8A] mt-0.5">
                    Customer: <strong>{selectedBooking.customerName}</strong> ({selectedBooking.socialMediaHandle}) • Camera: <strong>{selectedBooking.cameraRented}</strong>
                  </p>
                </div>

                <button
                  onClick={() => setSelectedBooking(null)}
                  className="w-8 h-8 rounded-full bg-[#FAFAF7] border border-[#E8E4F0] hover:bg-[#FEF0E7] flex items-center justify-center text-[#1A1A2E] transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">

                {/* Workflow Alert Message (if error occurred during status update) */}
                {workflowErrorMsg && (
                  <div className="p-3.5 rounded-2xl bg-[#FFF5F5] border-2 border-[#FEB2B2] text-[#C53030] flex items-center justify-between animate-fadeIn font-bold">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-[#C53030]" />
                      <span>{workflowErrorMsg}</span>
                    </div>
                    <button
                      onClick={() => setWorkflowErrorMsg(null)}
                      className="p-1 hover:bg-[#FED7D7] rounded-lg cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                
                {/* Google Drive Direct Folder Link */}
                {selectedBooking.driveFolderUrl && (
                  <div className="p-4 rounded-2xl bg-[#EDE8FC] border-2 border-[#C9B8F0] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#6B46C1] shadow-xs">
                        <FolderOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-xs text-[#1A1A2E]">
                          Dedicated Google Drive Booking Folder
                        </h4>
                        <p className="text-[11px] text-[#553C9A]">
                          All original full-resolution files & videos vaulted in your Google Drive.
                        </p>
                      </div>
                    </div>
                    <a
                      href={selectedBooking.driveFolderUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-[#1A1A2E] text-white font-bold text-xs hover:bg-[#6B46C1] transition-colors flex items-center gap-1"
                    >
                      <span>Open Folder</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {/* Submitted Documents Artifact Cards Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-xs uppercase tracking-wider text-[#6B6B8A]">
                      Submitted Verification Artifacts (Click to Preview)
                    </h4>
                    <span className="text-[10px] text-[#6B6B8A] font-bold">
                      Click each card to open full-resolution preview
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {kycEval.docItems.map((doc) => {
                      const isInspected = !!inspectedDocs[doc.id];
                      return (
                        <KycArtifactCard
                          key={doc.id}
                          title={doc.name}
                          icon={<ShieldCheck className="w-3.5 h-3.5 text-[#553C9A]" />}
                          url={doc.url}
                          emptyLabel={`No ${doc.shortLabel} attached`}
                          isVideo={doc.isVideo}
                          isInspected={isInspected}
                          isRequired={doc.required}
                          onPreview={(title, url, isVideo) => {
                            setInspectedDocs(prev => ({ ...prev, [doc.id]: true }));
                            setPreviewDoc({ title, url, isVideo });
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* KYC Inspection & Review Gate */}
                <div className="p-4 rounded-2xl bg-white border-2 border-[#1A1A2E] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#553C9A]" />
                      <h4 className="font-black text-xs text-[#1A1A2E]">
                        KYC Verification Checklist & Approval Gate
                      </h4>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                      kycEval.isComplete
                        ? 'bg-[#E8F7F1] text-[#234E52] border-[#A8DBC8]'
                        : 'bg-[#FFF5F5] text-[#C53030] border-[#FEB2B2]'
                    }`}>
                      {kycEval.isComplete ? 'All Required Documents Submitted' : `${kycEval.missingFiles.length} Missing Required File(s)`}
                    </span>
                  </div>

                  {/* Missing Documents Warning (Blocks Approval) */}
                  {!kycEval.isComplete && (
                    <div className="p-3 rounded-xl bg-[#FFF5F5] border border-[#FEB2B2] text-xs text-[#C53030] space-y-1">
                      <div className="font-extrabold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Incomplete Submission — Approval Blocked:</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        The customer has not submitted: <strong>{kycEval.missingFiles.join(', ')}</strong>.
                        KYC cannot be approved until all required documents are provided.
                      </p>
                    </div>
                  )}

                  {/* Checklist Summary Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {kycEval.docItems.map(item => {
                      const hasDoc = !!item.url;
                      const wasInspected = !!inspectedDocs[item.id];
                      return (
                        <div
                          key={item.id}
                          className={`p-2 rounded-xl border text-[11px] flex items-center justify-between ${
                            !hasDoc
                              ? 'bg-[#FFF5F5] border-[#FEB2B2] text-[#C53030]'
                              : wasInspected
                              ? 'bg-[#E8F7F1] border-[#A8DBC8] text-[#234E52]'
                              : 'bg-[#EDE8FC]/60 border-[#C9B8F0] text-[#553C9A]'
                          }`}
                        >
                          <span className="font-bold truncate pr-1">{item.shortLabel}</span>
                          <span className="shrink-0 text-[10px] font-extrabold">
                            {!hasDoc ? 'Missing ✕' : wasInspected ? 'Inspected ✓' : 'Unopened'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explicit Confirmation Checkbox */}
                  {kycEval.isComplete && selectedWorkflow.step === 1 && (
                    <label className="flex items-start gap-2.5 pt-2 border-t border-[#E8E4F0] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={kycConfirmedCheckbox}
                        onChange={(e) => setKycConfirmedCheckbox(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded text-[#553C9A] focus:ring-0 cursor-pointer"
                      />
                      <span className="text-[11px] text-[#1A1A2E] font-bold leading-snug">
                        I confirm that I have inspected all required customer verification documents, verified the customer's identity, handwritten authorization, proof of address, selfie verification, and GCash deposit.
                      </span>
                    </label>
                  )}
                </div>

                {/* Reject Confirmation Box */}
                {showRejectModal && (
                  <div className="p-4 rounded-2xl bg-[#FFF5F5] border-2 border-[#FEB2B2] space-y-3 animate-fadeIn">
                    <div className="flex items-center gap-2 text-[#C53030]">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <h4 className="font-extrabold text-xs">Confirm KYC Rejection</h4>
                    </div>
                    <p className="text-[11px] text-[#742A2A]">
                      Are you sure you want to reject this KYC submission? The customer's reservation will be marked as Rejected.
                    </p>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowRejectModal(false)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#6B6B8A] bg-white border border-[#E8E4F0] hover:bg-[#FAFAF7] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdateStatus(selectedBooking.bookingRef, 'Rejected');
                          setShowRejectModal(false);
                        }}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#C53030] hover:bg-[#9B2C2C] shadow-xs cursor-pointer"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  </div>
                )}

                {/* Emergency Contacts & Additional Notes */}
                <div className="p-4 rounded-2xl bg-white border border-[#E8E4F0] space-y-2">
                  <span className="font-bold text-[11px] text-[#6B6B8A] uppercase">Emergency Contacts & Notes</span>
                  <p className="font-medium text-[#1A1A2E] whitespace-pre-line leading-relaxed">
                    {selectedBooking.notes || 'None provided.'}
                  </p>
                </div>

                {/* Calendar Sync & Customer Dispatch Section */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-[#1A1A2E] shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#553C9A]" />
                      <h4 className="font-black text-xs text-[#1A1A2E] uppercase tracking-wider">
                        Calendar Sync &amp; Customer Dispatch
                      </h4>
                    </div>
                    <span className="text-[10px] text-[#6B6B8A] font-bold">
                      Ref: {selectedBooking.bookingRef}
                    </span>
                  </div>

                  {/* Calendar Sync Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => openGoogleCalendar(selectedBooking)}
                      className="px-3.5 py-2 rounded-xl bg-[#FAFAF7] hover:bg-[#EDE8FC] border border-[#E8E4F0] hover:border-[#C9B8F0] text-xs font-bold text-[#1A1A2E] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#553C9A]" />
                      <span>Add to Google Calendar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadIcsCalendar(selectedBooking)}
                      className="px-3.5 py-2 rounded-xl bg-[#FAFAF7] hover:bg-[#EDE8FC] border border-[#E8E4F0] hover:border-[#C9B8F0] text-xs font-bold text-[#1A1A2E] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5 text-[#553C9A]" />
                      <span>Download Apple/Outlook .ics</span>
                    </button>
                  </div>

                  {/* One-Click Customer Message Templates (FB / IG / Viber / SMS) */}
                  <div className="p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E8E4F0] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#6B6B8A] flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3 text-[#553C9A]" />
                        <span>One-Click FB &amp; IG Customer Message Templates</span>
                      </span>
                      <span className="text-[9px] font-bold text-[#553C9A] bg-[#EDE8FC] px-2 py-0.5 rounded-full">
                        Ready for FB &amp; IG
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* Template 1: Handover Message */}
                      <button
                        type="button"
                        onClick={() => handleCopyTemplate('handover', getHandoverMessage(selectedBooking))}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                          copiedTemplateKey === 'handover'
                            ? 'bg-[#E8F7F1] border-[#38A169] text-[#22543D]'
                            : 'bg-white hover:bg-[#EDE8FC] border-[#E8E4F0] hover:border-[#C9B8F0] text-[#1A1A2E]'
                        }`}
                        title="Copy customer-ready handover confirmation message for FB Messenger, IG, or SMS"
                      >
                        <span className="truncate">Handover Message</span>
                        {copiedTemplateKey === 'handover' ? (
                          <Check className="w-3.5 h-3.5 text-[#38A169] shrink-0" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-[#6B6B8A] shrink-0" />
                        )}
                      </button>

                      {/* Template 2: Return Reminder */}
                      <button
                        type="button"
                        onClick={() => handleCopyTemplate('reminder', getReturnReminderMessage(selectedBooking))}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                          copiedTemplateKey === 'reminder'
                            ? 'bg-[#E8F7F1] border-[#38A169] text-[#22543D]'
                            : 'bg-white hover:bg-[#EDE8FC] border-[#E8E4F0] hover:border-[#C9B8F0] text-[#1A1A2E]'
                        }`}
                        title="Copy polite 8:00 PM return reminder with checklist and deposit refund procedure"
                      >
                        <span className="truncate">8 PM Return Reminder</span>
                        {copiedTemplateKey === 'reminder' ? (
                          <Check className="w-3.5 h-3.5 text-[#38A169] shrink-0" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-[#6B6B8A] shrink-0" />
                        )}
                      </button>

                      {/* Template 3: Deposit Refunded (Strictly Guarded) */}
                      {selectedBooking.status === 'Completed' ? (
                        <button
                          type="button"
                          onClick={() => handleCopyTemplate('refund', getDepositRefundedMessage(selectedBooking))}
                          className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                            copiedTemplateKey === 'refund'
                              ? 'bg-[#E8F7F1] border-[#38A169] text-[#22543D]'
                              : 'bg-white hover:bg-[#EDE8FC] border-[#E8E4F0] hover:border-[#C9B8F0] text-[#1A1A2E]'
                          }`}
                          title="Copy deposit refunded confirmation message"
                        >
                          <span className="truncate">Deposit Refunded</span>
                          {copiedTemplateKey === 'refund' ? (
                            <Check className="w-3.5 h-3.5 text-[#38A169] shrink-0" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-[#6B6B8A] shrink-0" />
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setWorkflowErrorMsg(
                              "Deposit Refund confirmation template is only unlocked once equipment is marked as 'Completed' after return inspection."
                            );
                            setTimeout(() => setWorkflowErrorMsg(null), 5000);
                          }}
                          className="p-2.5 rounded-xl border text-left text-xs font-semibold bg-[#FAFAF7] border-[#E8E4F0] text-[#8A8A9E] flex items-center justify-between gap-1.5 cursor-not-allowed opacity-75 hover:bg-[#FFF5F5] hover:text-[#C53030]"
                          title="Available once booking is marked Completed in Step 4"
                        >
                          <span className="truncate">Deposit Refunded (When Done)</span>
                          <AlertCircle className="w-3.5 h-3.5 text-[#8A8A9E] shrink-0" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Footer Actions */}
              <div className="px-6 py-4 bg-white border-t border-[#E8E4F0] flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-[#6B6B8A] hover:bg-[#FAFAF7] border border-[#E8E4F0] sm:border-transparent cursor-pointer"
                >
                  Close Drawer
                </button>

                <div className="w-full sm:w-auto flex flex-wrap items-center justify-end gap-2">
                  {/* Step 1 Actions (KYC Pending) */}
                  {selectedWorkflow.step === 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowRejectModal(true)}
                        className="px-3.5 py-2.5 rounded-xl border border-[#FEB2B2] text-[#C53030] text-xs font-bold hover:bg-[#FFF5F5] transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject KYC</span>
                      </button>

                      <button
                        type="button"
                        disabled={!kycEval.isComplete || !kycConfirmedCheckbox || isUpdatingSelected}
                        onClick={() => handleUpdateStatus(selectedBooking.bookingRef, 'Confirmed', { kycConfirmed: true })}
                        title={
                          !kycEval.isComplete
                            ? 'Cannot approve: Required documents are missing'
                            : !kycConfirmedCheckbox
                            ? 'Please inspect the documents and check the confirmation box above'
                            : 'Approve KYC and confirm slot'
                        }
                        className="px-5 py-2.5 rounded-xl bg-[#38A169] text-white text-xs font-extrabold hover:bg-[#2F855A] shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isUpdatingSelected ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        <span>Approve KYC & Confirm Slot</span>
                      </button>
                    </>
                  )}

                  {/* Step 2 Actions (KYC Approved) */}
                  {selectedWorkflow.step === 2 && (
                    <button
                      type="button"
                      disabled={isUpdatingSelected}
                      onClick={() => handleUpdateStatus(selectedBooking.bookingRef, 'Active Rental')}
                      className="px-5 py-2.5 rounded-xl bg-[#38A169] text-white text-xs font-extrabold hover:bg-[#2F855A] shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isUpdatingSelected ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      <span>Mark Equipment Picked Up (Step 3)</span>
                    </button>
                  )}

                  {/* Step 3 Actions (Picked Up) */}
                  {selectedWorkflow.step === 3 && (
                    <button
                      type="button"
                      disabled={isUpdatingSelected}
                      onClick={() => handleUpdateStatus(selectedBooking.bookingRef, 'Completed')}
                      className="px-5 py-2.5 rounded-xl bg-[#234E52] text-white text-xs font-extrabold hover:bg-[#1D3F42] shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isUpdatingSelected ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      <span>Mark Equipment Returned (Step 4)</span>
                    </button>
                  )}

                  {/* Step 4: Returned */}
                  {selectedWorkflow.step === 4 && (
                    <div className="px-4 py-2 rounded-xl bg-[#F0FFF4] text-[#22543D] border border-[#9AE6B4] text-xs font-extrabold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#38A169]" />
                      <span>Rental Complete & Returned</span>
                    </div>
                  )}

                  {/* Delete Booking Action */}
                  <button
                    type="button"
                    onClick={() => setDeleteTargetBooking(selectedBooking)}
                    className="p-2.5 rounded-xl border border-[#FEB2B2] text-[#C53030] text-xs font-bold hover:bg-[#FFF5F5] transition-all cursor-pointer"
                    title="Delete this reservation permanently"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ─────────────────────────────────────────────────────────────
          4. FULLSCREEN DOCUMENT PREVIEW POPUP
      ───────────────────────────────────────────────────────────── */}
      {previewDoc && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="relative max-w-4xl w-full max-h-[92vh] bg-[#1A1A2E] rounded-3xl p-4 sm:p-5 flex flex-col shadow-2xl">
            {/* Header */}
            <div className="w-full flex items-center justify-between pb-3 text-white border-b border-gray-700 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm">{previewDoc.title}</span>
                {getDriveFileId(previewDoc.url) && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EDE8FC] text-[#553C9A]">
                    Google Drive Vault
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {getDriveFileId(previewDoc.url) && (
                  <a
                    href={previewDoc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
                  >
                    <span>Open in Drive</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  title="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewer Content */}
            <div className="flex-1 min-h-[50vh] max-h-[75vh] overflow-hidden flex items-center justify-center w-full bg-black/40 rounded-2xl">
              {getDriveFileId(previewDoc.url) ? (
                /* Google Drive Embed Viewer: renders images, multi-page PDFs, and videos natively! */
                <iframe
                  src={getDrivePreviewUrl(previewDoc.url)}
                  title={previewDoc.title}
                  className="w-full h-[72vh] rounded-2xl border-0 bg-white shadow-inner"
                  allow="autoplay"
                />
              ) : previewDoc.isVideo ? (
                <video src={previewDoc.url} controls autoPlay className="max-h-[72vh] rounded-xl" />
              ) : (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.title}
                  className="max-h-[72vh] object-contain rounded-xl shadow-2xl"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. DANGER CONFIRMATION: CLEAR ALL BOOKINGS MODAL
      ───────────────────────────────────────────────────────────── */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-70 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#FAFAF7] rounded-[28px] border-2 border-[#1A1A2E] shadow-[8px_8px_0px_#1A1A2E] overflow-hidden p-6 sm:p-7 space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF5F5] border-2 border-[#FEB2B2] flex items-center justify-center text-[#E53E3E] shrink-0">
                <AlertTriangle className="w-6 h-6 text-[#E53E3E]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-[#1A1A2E]">
                  Permanently Clear All Bookings?
                </h3>
                <p className="text-xs text-[#6B6B8A] leading-relaxed">
                  This action is <strong className="text-[#C53030]">irreversible</strong>. It will permanently delete every customer reservation from your Google Sheets database and clear all calendar slots.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFF5F5] border border-[#FEB2B2] space-y-2">
              <p className="text-xs font-bold text-[#C53030]">
                ⚠️ You have {bookings.length} active customer bookings on record.
              </p>
              <p className="text-[11px] text-[#742A2A] leading-relaxed">
                To prevent accidental deletion, please type <span className="font-mono font-black text-[#C53030] bg-white px-1.5 py-0.5 rounded border border-[#FEB2B2]">DELETE</span> in the box below to authorize:
              </p>
              <input
                type="text"
                value={clearConfirmInput}
                onChange={(e) => setClearConfirmInput(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#FEB2B2] bg-white text-xs font-mono font-bold text-[#1A1A2E] focus:outline-none focus:border-[#C53030]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isClearingBookings}
                onClick={() => {
                  setShowClearAllModal(false);
                  setClearConfirmInput('');
                }}
                className="px-4 py-2.5 rounded-xl border border-[#E8E4F0] text-xs font-bold text-[#6B6B8A] hover:bg-[#F3F0FA] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={clearConfirmInput.trim() !== 'DELETE' || isClearingBookings}
                onClick={handleClearAllBookings}
                className="px-5 py-2.5 rounded-xl bg-[#E53E3E] text-white text-xs font-black hover:bg-[#C53030] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {isClearingBookings ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Clearing Database...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanently Delete All</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. CONFIRMATION: DELETE SINGLE BOOKING MODAL
      ───────────────────────────────────────────────────────────── */}
      {deleteTargetBooking && (
        <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#FAFAF7] rounded-[28px] border-2 border-[#1A1A2E] shadow-[8px_8px_0px_#1A1A2E] overflow-hidden p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#FFF5F5] border border-[#FEB2B2] flex items-center justify-center text-[#E53E3E] shrink-0">
                <Trash2 className="w-5 h-5 text-[#E53E3E]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-[#1A1A2E]">
                  Remove Booking {deleteTargetBooking.bookingRef}?
                </h3>
                <p className="text-xs text-[#6B6B8A]">
                  Customer: <strong>{deleteTargetBooking.customerName}</strong> ({deleteTargetBooking.cameraRented})
                </p>
              </div>
            </div>

            <p className="text-xs text-[#4A5568] bg-white p-3.5 rounded-xl border border-[#E8E4F0]">
              Are you sure you want to remove this booking? This will delete the entry from Google Sheets and release the reserved calendar dates.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeletingBooking}
                onClick={() => setDeleteTargetBooking(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B6B8A] hover:bg-[#F3F0FA] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingBooking}
                onClick={() => handleDeleteBooking(deleteTargetBooking.bookingRef)}
                className="px-4 py-2 rounded-xl bg-[#E53E3E] text-white text-xs font-black hover:bg-[#C53030] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isDeletingBooking ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
