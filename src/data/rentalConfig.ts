/**
 * PackAndFilm Rental Business Configuration & Source of Truth (Version Oct 2026)
 * 
 * Sourced directly from:
 * 1. Requirements.pdf
 * 2. T&C.pdf
 * 3. How to Book.pdf
 */

export const RENTAL_CONFIG = {
  // Brand & Contact
  brandName: 'PackAndFilm',
  legalName: 'Pack and Film - Camera Rentals',
  instagramHandle: '@packandfilm.ph',
  instagramUrl: 'https://www.instagram.com/packandfilm.ph/',
  facebookHandle: '@Pack and Film',
  facebookUrl: 'https://www.facebook.com/people/Pack-and-Film/61595302043810/',
  messengerUrl: 'https://www.facebook.com/people/Pack-and-Film/61595302043810/',
  facebookAdminAccount: 'Pack and Film',

  // Operating Hours
  operatingHours: '8:00 AM – 8:00 PM ONLY',
  startHourStr: '8:00 AM',
  endHourStr: '8:00 PM',

  // Pricing & Duration Tiers (DJI Osmo Pocket 3)
  pricingTiers: [
    { minDays: 1, maxDays: 1, rate: 450, label: '1 Day (₱450/day)' },
    { minDays: 2, maxDays: 3, rate: 420, label: '2–3 Days Tier (₱420/day)' },
    { minDays: 4, maxDays: 5, rate: 380, label: '4–5 Days Tier (₱380/day)' },
    { minDays: 6, maxDays: 999, rate: 350, label: '6+ Days Long Term (₱350/day)' }
  ],
  reservationFee: 300, // Credited toward rental fee, non-refundable
  securityDeposit: 1000, // Refunded within 24 hours after equipment return and inspection
  meetupHandlingFee: 200, // Charged for all meetup transactions
  cancellationPenalty: 500, // In addition to forfeiture of ₱300 reservation fee
  lateReturnFeeHourly: 150, // Per hour starting 30 mins after agreed return time
  lateReturnInconvenienceFee: 2000, // Charged if more than 2 hours late (+ 1 full extra day rental)

  // Meetup Locations (Handout Source of Truth)
  meetupLocations: [
    'SM East Ortigas',
    'Bridgetowne',
    'Opus Mall'
  ] as const,

  // Delivery Service (Handout Source of Truth)
  deliveryService: 'Grab Express ONLY',
  deliveryPolicy: 'The owner shall be responsible for booking the rider for both the release and return of the device, and the renter will shoulder all delivery fees.',

  // Terms & Conditions Version
  termsVersion: 'v2026.10-Oct',
  termsLastUpdated: 'October 2026',
  depositRefundWindow: 'within 24 hours of equipment return and inspection',
  requirementsWindow: 'within 24 hours to secure reservation'
};

export type MeetupLocation = typeof RENTAL_CONFIG.meetupLocations[number];

/**
 * 5-Step Process from How to Book.pdf
 */
export const HOW_TO_BOOK_STEPS = [
  {
    step: '01',
    title: 'Initial inquiry',
    badge: 'Check Availability',
    desc: 'Check live calendar availability directly on our website or DM us your preferred dates on Instagram/Facebook. Select your schedule and calculate your rental rate instantly starting at ₱450/day only!'
  },
  {
    step: '02',
    title: 'Settle the downpayment',
    badge: 'Upload Documents',
    desc: 'Upload your 2 valid IDs. For students: Student ID + COR + Parent/Guardian Government ID. Provide three handwritten signatures, and a selfie photo directly through our mobile-friendly checkout form.'
  },
  {
    step: '03',
    title: 'Reservation form',
    badge: '₱300 Slot Deposit',
    desc: 'Secure your calendar slot by sending the ₱300 reservation fee via GCash or Bank Transfer. This is credited directly toward your total rental fee (not an extra charge!). Enter your GCash reference number to submit.'
  },
  {
    step: '04',
    title: 'Confirmation & Contract signing',
    badge: '15-Min Quick Review',
    desc: 'We review your requirements in 15 minutes. Once approved, you’ll receive your official #PNF-2026-XXX booking reference card and digital agreement. Your dates are officially locked!'
  },
  {
    step: '05',
    title: 'Meet-up or delivery',
    badge: 'Gear Handover',
    desc: 'Settle remaining balance + ₱1,000 refundable security deposit before release (8:00 AM – 8:00 PM). Unit may be claimed via Meetup at SM East Ortigas, Bridgetowne, or Opus Mall with ₱200 handling fee or via Grab Express ONLY. Security Deposit will refunded within 24 hours after inspection.'
  }
];

/**
 * 5 Requirements from Requirements.pdf
 */
export const REQUIREMENTS_DATA = [
  {
    step: '01',
    title: 'Personal Identification',
    badge: 'Two Valid IDs',
    items: [
      'Two (2) valid IDs (front and back images).',
      'Write the date, 3 specimen signatures and "For Pack and Film Camera Rental purposes only" on clean paper, and take a photo together with your IDs.',
      'Submit a selfie holding your 2 valid IDs and the paper slip.',
      'At least one ID must show your current address and signature.',
      'Students may submit: Valid Student ID + Current Certificate of Registration (COR) + Parent/Guardian Government ID.'
    ]
  },
  {
    step: '02',
    title: 'Proof of Billing',
    badge: 'Address Verification',
    items: [
      'Must match the name and address on your valid ID.',
      'Accepted: utility bills, bank statements, delivery receipts, etc.',
      'For delivery receipts (Shopee, Lazada, TikTok), send at least 2 screenshots showing your name and complete delivery address.',
      'If bills are under someone else’s name, kindly provide their valid government ID for verification.'
    ]
  },
  {
    step: '03',
    title: 'Active Social Media Accounts',
    badge: 'Identity Match',
    items: [
      'Must be your main personal account.',
      'We do not accept: locked/private accounts, business-only accounts, dummy accounts, or suspicious/new profiles.',
      'We may decline rentals if verification is incomplete or suspicious.',
      'For minors, please provide active Facebook and Instagram accounts of parent/guardian.'
    ]
  },
  {
    step: '04',
    title: 'Emergency Contact Persons',
    badge: 'Two Reachable Contacts',
    items: [
      'Kindly provide the full name, active contact number, photo of valid ID, and FB/IG profile link for two (2) emergency contacts in case we cannot reach you during the rental period.',
      'Once booking is confirmed, we’ll contact these persons and inform them that they are your emergency contacts. Please inform them to respond to our message or call.'
    ]
  },
  {
    step: '05',
    title: 'Other Requirements',
    badge: 'Final Clearance',
    items: [
      'Submit a selfie video holding your 2 valid IDs stating your rental details (Full Name, rental dates, camera unit, and rental purpose).',
      'Send a friend request to our Facebook admin account ("PackAndFilm Camera Rentals") for verification and security purposes.',
      'If rental application is approved, renter must be willing to sign the rental agreement to be sent by the owner.'
    ]
  }
];

/**
 * 8 Numbered Clauses from T&C.pdf
 */
export const TERMS_AND_CONDITIONS_DATA = [
  {
    number: '01',
    title: 'Downpayment',
    highlight: '₱300 Downpayment • 24-Hour Requirements Window',
    content: [
      'A ₱300 down payment and complete requirements within 24 hours is needed to reserve your slots.',
      'Final balance must be settled prior to pick-up or meet-up.'
    ]
  },
  {
    number: '02',
    title: 'Cancellation Policy',
    highlight: 'Strictly NO Cancellation • ₱500 Penalty',
    content: [
      'Strictly NO cancellation once the booking has been confirmed.',
      'Any cancellation by the renter may result in a ₱500 cancellation penalty, in addition to the forfeiture of the ₱300 non-refundable reservation fee.',
      'Be advised that all payments made, excluding the security deposit, are strictly non-refundable and non-transferable under any circumstance, as the reserved dates are blocked off and made unavailable to other renters once booking is confirmed.',
      'Full payment of the remaining balance is required before the release of the unit.'
    ]
  },
  {
    number: '03',
    title: 'Security Deposit',
    highlight: '₱1,000 Deposit • Refunded Within 24 Hours',
    content: [
      '₱1,000 Security Deposit is required.',
      'The deposit will be fully refunded within 24 hours of the equipment being returned, provided it is in the same condition as when it was rented.',
      'This deposit will be used to cover any unpaid balances, damages, loss, or unreturned accessories, and will be refunded after return and successful inspection of the unit.'
    ]
  },
  {
    number: '04',
    title: 'Rental Period & Shipping',
    highlight: '8:00 AM – 8:00 PM ONLY • ₱200 Meetup Fee • Grab Express ONLY',
    content: [
      'Rental Period: 8:00 AM - 8:00 PM ONLY.',
      'Unit can be claimed via Grab Express delivery or through meet-up at SM East, Bridgetowne, or Opus.',
      'However, a ₱200 handling fee will be charged for all meet-up transactions.',
      'The owner shall be responsible for booking the rider for both the release and return of the device and the renter will shoulder all delivery fees.',
      'Late Return Policy: To avoid affecting the next renter’s booking, equipment must be returned on time. (Applies to each camera rented.)',
      '₱150/hour late fee will be charged automatically starting 30 minutes after the agreed return time.',
      'If the equipment is more than 2 hours late, the late fee will automatically convert to one (1) full extra day’s rental at the standard daily rate, plus a ₱2,000 inconvenience fee due to the disruption caused to scheduled bookings.',
      'Failure to settle outstanding penalties may result in legal action, permanent blacklisting, and the public posting of unresolved rental cases on our social media platforms.'
    ]
  },
  {
    number: '05',
    title: 'Device Responsibility',
    highlight: 'Handle With Care • No Sub-Renting • Card Wiping Policy',
    content: [
      'The renter assumes full responsibility for the device during the rental period. HANDLE THE UNIT WITH CARE AT ALL TIMES.',
      'The unit and accessories will be released in a good working condition and must be returned in the same condition.',
      'The renter is fully liable for any damage, malfunction, loss, or theft, including scratches, cracked screen, water damage, camera damage, or missing accessories.',
      'Repair or replacement charges will be charged to the renter if any damages exceed the security deposit. Failure to settle will result in a formal case filing.',
      'Sub-renting or lending the unit to another person is strictly prohibited.',
      'Pack and Film - Camera Rentals is not responsible for any missed opportunities, lost data (e.g., corrupted memory cards), project delays, or financial losses resulting from equipment malfunction or user error.',
      'The renter is solely responsible for backing up their footage/photos before returning the equipment. Pack and Film - Camera Rentals wipes all memory cards immediately upon return.'
    ]
  },
  {
    number: '06',
    title: 'Delivery Inspection',
    highlight: 'Pre-Release Inspection • Photo Proof Required',
    content: [
      'All units and accessories are inspected before release.',
      'Renter must check the unit upon pick-up and send a photo of it and all the accessories for proof of receipt.',
      'Devices, including its accessories, must be returned in the exact same working condition received.'
    ]
  },
  {
    number: '07',
    title: 'Unreturned Device / Unsettled Balance Policy',
    highlight: 'Emergency Escalation & Unreturned Unit Procedure',
    content: [
      'In the event that the renter fails to return the rented device on the agreed return date and cannot be contacted, the owner may immediately communicate with the emergency contact provided by the renter.',
      'If the designated emergency contacts are also unreachable, the owner may contact any family member, relative, or friend of the renter identified through the renter’s social media accounts.',
      'If no response is received and the device remains unreturned within twenty-four (24) hours or renter refuses to settle any outstanding obligations, the owner reserves the right to publicly disclose the renter\'s photographs, conversation records, and other relevant evidence on social media or other appropriate platforms for the purpose of protecting the owner’s rights, recovering the device, and collecting unpaid obligations.'
    ]
  },
  {
    number: '08',
    title: 'Valid ID Policy & General Terms',
    highlight: 'Confidentiality • Secure Deletion • Right to Decline',
    content: [
      'Pack and Film camera rental requires renters to present and submit a photocopy or digital copy of a valid government-issued ID for identity verification.',
      'The renter authorizes Pack and Film camera rental to keep this copy confidentially until the equipment is returned and the transaction is fully completed. The copy will then be securely deleted or destroyed.',
      'Pack and Film Camera Rental reserves the right to decline a transaction if verification is incomplete or suspicious.',
      'If terms are violated, owner may terminate the agreement and security deposit is automatically forfeited.',
      'Terms & Conditions are subject to change without prior notice. The version sent at the time of booking shall govern the rental agreement.'
    ]
  }
];

export const TERMS_ACKNOWLEDGEMENT_TEXT =
  'By proceeding with the reservation payment, the renter acknowledges that they have read, understood, and agreed to all the Terms & Conditions of Pack and Film Camera Rental.';
