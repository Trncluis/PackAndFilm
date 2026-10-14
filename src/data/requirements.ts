export interface RentalRequirementStep {
  step: number;
  title: string;
  badge: string;
  desc: string;
  details: string[];
  mandatoryText: string;
}

export const PASIG_MEETUP_HUBS = [
  'SM East Ortigas',
  'Bridgetowne',
  'Opus Mall'
];

export const FIVE_STEP_REQUIREMENTS: RentalRequirementStep[] = [
  {
    step: 1,
    title: 'Personal Identification',
    badge: 'Two Valid IDs',
    desc: 'Two valid IDs (front & back) with handwritten authorization slip and selfie.',
    details: [
      'Two (2) valid IDs (front and back). At least one ID must show your current address and signature.',
      'Write 3 specimen signatures and "For Pack and Film Camera Rental purposes only" on a paper and take a photo together with your IDs.',
      'Submit a selfie holding your 2 valid IDs and the paper.',
      'Students may submit: Valid Student ID + Current (COR) + Parent/Guardian Government ID.'
    ],
    mandatoryText: 'Required for identity verification before release'
  },
  {
    step: 2,
    title: 'Proof of Billing',
    badge: 'Address Verification',
    desc: 'Proof of residential billing matching the name and address on your valid ID.',
    details: [
      'Must match the name and address on your valid ID.',
      'Accepted: utility bills, bank statements, delivery receipts, etc.',
      'For delivery receipts (Shopee, Lazada, TikTok), send at least 2 screenshots showing your name and address.',
      'If bills are under someone else\'s name, kindly provide their ID for verification.'
    ],
    mandatoryText: 'Address must match valid ID record'
  },
  {
    step: 3,
    title: 'Active Social Media Accounts',
    badge: 'Identity Match',
    desc: 'Submit your main personal Instagram or Facebook account for verification.',
    details: [
      'Must be your main personal account.',
      'We do not accept: locked/private accounts, business-only accounts, dummy accounts, or suspicious/new profiles.',
      'We may decline rentals if verification is incomplete or suspicious.',
      'For students, please provide active Facebook and Instagram accounts of parent/guardian.'
    ],
    mandatoryText: 'Used for direct coordination and verification'
  },
  {
    step: 4,
    title: 'Emergency Contact Persons',
    badge: 'Two Reachable Contacts',
    desc: 'Provide two emergency contacts in case we cannot reach you during the rental period.',
    details: [
      'Kindly provide the full name, active contact number, and FB/IG profile link in case we cannot reach you during the rental period.',
      'Once booking is confirmed, we\'ll contact these persons and inform them that they are your emergency contacts. Please inform them to respond to our message or call.'
    ],
    mandatoryText: 'Required contact network for equipment security'
  },
  {
    step: 5,
    title: 'Other Requirements',
    badge: 'Final Clearance',
    desc: 'Selfie holding 2 IDs stating rental details and admin friend request.',
    details: [
      'Submit a selfie holding your 2 valid IDs stating your rental details (Full Name, rental dates, camera unit, and rental purpose).',
      'Send a friend request to our Facebook admin account ("PackAndFilm Camera Rentals") for verification and security purposes.',
      'Once approved, sign the digital rental agreement sent by the owner prior to handover.'
    ],
    mandatoryText: 'Quick verification directly from your phone'
  }
];

export const STUDENT_EXEMPTION_NOTICE = {
  title: 'Student Alternative Available',
  desc: 'Enrolled students may submit: Valid Student ID + Current Certificate of Registration (COR) + Parent/Guardian Government ID.'
};
