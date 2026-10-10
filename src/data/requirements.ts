export interface RentalRequirementStep {
  step: number;
  title: string;
  badge: string;
  desc: string;
  details: string[];
  mandatoryText: string;
}

export const PASIG_MEETUP_HUBS = [
  'Pasig City: SM Megamall (Building A/B Ground Lobby)',
  'Pasig City: Estancia Mall / Capitol Commons',
  'Pasig City: Kapitolyo Food Hub (Pioneer / East Capitol Dr)',
  'Pasig City: Arcovia City (C-5 Pasig)',
  'Pasig City: Ortigas MRT Station / Robinsons Galleria'
];

export const FIVE_STEP_REQUIREMENTS: RentalRequirementStep[] = [
  {
    step: 1,
    title: 'Two Valid IDs + Written Authorization Slip',
    badge: 'Identity Verification',
    desc: 'Upload 2 valid government IDs plus a handwritten authorization slip and a live selfie holding both.',
    details: [
      'ID #1: Primary Gov ID (Passport, UMID, Driver\'s License, National ID).',
      'ID #2: Secondary ID (Company ID, Postal ID, PRC, or Student ID).',
      'Handwritten Slip: Write "For PackAndFilm rental purposes only", current date, and 3 specimen signatures on clean paper.',
      'Selfie: Take a clear front camera selfie holding your primary ID and the handwritten slip side by side.'
    ],
    mandatoryText: 'Required for all primary renters before equipment handover'
  },
  {
    step: 2,
    title: 'Proof of Address / E-Commerce Receipts',
    badge: 'Address Match',
    desc: 'Verify your residential address in Metro Manila.',
    details: [
      'Option A: Latest utility bill (Meralco, Maynilad, Converge, Credit Card) under your name within the last 3 months.',
      'Option B: Screenshots of 2 successfully delivered Shopee or Lazada orders showing matching full legal name and complete delivery address.'
    ],
    mandatoryText: 'Address must match delivery/meetup area'
  },
  {
    step: 3,
    title: 'Active Personal Instagram or Facebook Account',
    badge: 'Identity Match',
    desc: 'Submit your active personal Instagram or Facebook profile so our team can verify and contact you.',
    details: [
      'Must be your active personal account that you regularly use.',
      'Dummy, newly created burner, or empty placeholder accounts are not accepted.',
      'Used for fast handover coordination and verification updates.'
    ],
    mandatoryText: 'Used for direct coordination on IG & Messenger'
  },
  {
    step: 4,
    title: 'Two (2) Emergency Contacts',
    badge: 'Safety Network',
    desc: 'Provide two reachable emergency contacts for security and verification.',
    details: [
      'Contact 1: Family Member / Guardian (Government ID required if applying for Student Exemption).',
      'Contact 2: Second Emergency Contact (Friend, colleague, or travel companion — No ID required).'
    ],
    mandatoryText: 'Contacted solely in emergency situations'
  },
  {
    step: 5,
    title: '5-Second Verification Video & Handover Agreement',
    badge: 'Final Clearance',
    desc: 'Quick face confirmation and digital terms sign-off prior to unit handoff.',
    details: [
      'Record a brief 5-second selfie video stating: "Hi PackAndFilm, I am [Your Name] and I agree to the camera rental terms."',
      'Digital acknowledgment of equipment checklist and sanitization seal in Pasig City.'
    ],
    mandatoryText: 'Quick 30-second completion right from your phone'
  }
];

export const STUDENT_EXEMPTION_NOTICE = {
  title: 'Student Exemption Available',
  desc: 'Enrolled students can waive the secondary government ID requirement by presenting a valid Student ID + current Term Certificate of Registration (COR) + Parent / Guardian ID verification.'
};
