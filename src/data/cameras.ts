export interface PricingTier {
  minDays: number;
  maxDays: number;
  rate: number;
  label: string;
  sublabel?: string;
}

export interface CameraItem {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  badge: string;
  isAvailable: boolean;
  statusText?: string;
  totalUnits?: number;
  depositAmount: number; // Uniform 1000 for active units
  standardRate: number;  // 1-day rate
  bulkRate: number;      // 6+ days rate
  pricingTiers: PricingTier[];
  meetupDeposit: number;
  courierDeposit: number;
  rating: number;
  reviewCount: number;
  specs: string[];
  image: string;
  gradient: string;
  themeColor: string;
  bagItems: {
    id: number;
    title: string;
    badge: string;
    color: string;
    tagBg: string;
    desc: string;
    spec: string;
    tip: string;
  }[];
}


export const CAMERA_INVENTORY: Record<string, number> = {
  'dji-pocket-3': 1,
  'canon-g7x-mark-iii': 2,
};

export const getCameraCapacity = (cameraId: string): number => {
  return CAMERA_INVENTORY[cameraId] ?? 1;
};

export const CAMERAS: CameraItem[] = [
  {
    id: 'dji-pocket-3',
    name: 'DJI Osmo Pocket 3 Standard Kit',
    totalUnits: 1,
    shortName: 'Osmo Pocket 3',
    tagline: '1-inch sensor, 4K/120fps mechanical gimbal & rotatable OLED screen',
    badge: 'Available Now',
    statusText: 'Ready to Rent',
    image: '/dji-pocket-3-hero.png',
    isAvailable: true,
    depositAmount: 1000,
    standardRate: 450,
    bulkRate: 350,
    meetupDeposit: 1000,
    courierDeposit: 1000,
    pricingTiers: [
      { minDays: 1, maxDays: 2, rate: 450, label: '1–2 Days', sublabel: 'Standard (₱450/d)' },
      { minDays: 3, maxDays: 5, rate: 400, label: '3–5 Days', sublabel: 'Trip Saver (₱400/d)' },
      { minDays: 6, maxDays: 999, rate: 350, label: '6+ Days', sublabel: 'Long-Term (₱350/d)' },
    ],
    rating: 4.98,
    reviewCount: 180,
    specs: ['4K/120fps', '1-inch CMOS Sensor', 'ActiveTrack 6.0', '128GB MicroSD Included'],
    gradient: 'from-[#EDE8FC] via-[#FEF0E7] to-[#E8F7F1]',
    themeColor: '#C9B8F0',
    bagItems: [
      {
        id: 1,
        title: 'DJI Osmo Pocket 3 Unit',
        badge: 'Main Gimbal',
        color: 'bg-[#EDE8FC] text-[#553C9A]',
        tagBg: 'bg-[#C9B8F0]',
        desc: '1-inch CMOS sensor, 4K/60fps ultra-smooth mechanical 3-axis gimbal with 2" rotatable OLED screen.',
        spec: '4K/60fps • 10-bit D-Log M • 1-inch Sensor',
        tip: 'Flip screen sideways to immediately power on and start recording!'
      },
      {
        id: 2,
        title: 'Carrying Case',
        badge: 'Travel Case',
        color: 'bg-[#FEF0E7] text-[#C05621]',
        tagBg: 'bg-[#F5C6A8]',
        desc: 'Custom weatherproof padded protective organizer case designed for Osmo Pocket 3 and all kit accessories.',
        spec: 'EVA Shockproof Shell • Water-Resistant • Sanitized',
        tip: 'Hospital-grade sanitized and sealed prior to handoff.'
      },
      {
        id: 3,
        title: 'Protective Cover',
        badge: 'Lens Shield',
        color: 'bg-[#E8F7F1] text-[#234E52]',
        tagBg: 'bg-[#A8DBC8]',
        desc: 'Hard-shell shield that safely clamps and locks the gimbal motor while carrying inside your bag.',
        spec: 'Gimbal Lock Clamp • Magnetic Latch • Scratch Proof',
        tip: 'Snap this on whenever storing or moving between shooting spots.'
      },
      {
        id: 4,
        title: 'Ulanzi Tripod',
        badge: 'Tripod Stand',
        color: 'bg-[#EDE8FC] text-[#553C9A]',
        tagBg: 'bg-[#C9B8F0]',
        desc: 'Compact desktop mini tripod with 1/4" screw thread for rock-steady timelapse, talking-head, and desk shots.',
        spec: '1/4" Threaded • Anti-Slip Feet • Foldable',
        tip: 'Perfect for cafe food vlogs, study streams, or table sit-downs.'
      },
      {
        id: 5,
        title: '128GB MicroSD Card',
        badge: 'High Speed',
        color: 'bg-[#FEF0E7] text-[#C05621]',
        tagBg: 'bg-[#F5C6A8]',
        desc: 'SanDisk Extreme MicroSD card certified for uninterrupted 4K video recording and high bitrate clips.',
        spec: '128GB Storage • Fast Write Speed • 4K Ready',
        tip: 'Formatted clean before handoff. Zero leftover clips.'
      },
      {
        id: 6,
        title: 'Card Reader (OTG Dual Interface)',
        badge: 'Instant Transfer',
        color: 'bg-[#E8F7F1] text-[#234E52]',
        tagBg: 'bg-[#A8DBC8]',
        desc: 'Dual OTG card reader (Lightning & USB-C) for instant plug-and-play photo and video export directly to your smartphone.',
        spec: 'Dual Lightning & Type-C OTG • Plug & Play',
        tip: 'Plug into iPhone Files or Android Gallery to export full 4K clips without a PC.'
      }
    ]},
  {
    id: 'canon-g7x-mark-iii',
    name: 'Canon PowerShot G7 X Mark III Creator Vlogging Kit',
    shortName: 'Canon G7 X Mark III',
    tagline: '20.1MP 1.0-inch stacked CMOS sensor, 4.2x f/1.8–2.8 lens & 180° flip touchscreen for iconic warm skin tones',
    badge: 'Available Now',
    statusText: 'Ready to Rent',
    image: '/canon-g7x-hero.png',
    isAvailable: true,
    depositAmount: 1000,
    standardRate: 550,
    bulkRate: 450,
    meetupDeposit: 1000,
    courierDeposit: 1000,
    pricingTiers: [
      { minDays: 1, maxDays: 2, rate: 550, label: '1–2 Days', sublabel: 'Standard (₱550/d)' },
      { minDays: 3, maxDays: 5, rate: 500, label: '3–5 Days', sublabel: 'Trip Saver (₱500/d)' },
      { minDays: 6, maxDays: 999, rate: 450, label: '6+ Days', sublabel: 'Long-Term (₱450/d)' },
    ],
    rating: 4.97,
    reviewCount: 38,
    specs: ['20.1MP 1.0" Stacked CMOS', '4.2x f/1.8–2.8 Zoom (24–100mm)', '4K 30p Uncropped Video', '180° Flip-Up Touchscreen'],
    gradient: 'from-[#FEF0E7] via-[#FFF3D6] to-[#EDE8FC]',
    themeColor: '#F5C6A8',
    bagItems: [
      {
        id: 1,
        title: 'Canon G7X III Camera Body',
        badge: 'Main Unit',
        color: 'bg-[#FEF0E7] text-[#C05621]',
        tagBg: 'bg-[#F5C6A8]',
        desc: '20.1MP 1.0-inch stacked sensor, fast f/1.8–2.8 4.2x optical zoom lens, DIGIC 8 processor, and 180° flip-up touchscreen for aesthetic vlogs & concert shots.',
        spec: '20.1MP • 4K 30p Uncropped • 180° Flip Touchscreen • Optical IS',
        tip: 'Flip screen up for instant selfie framing; use the tactile control ring around the lens for smooth zooming.'
      },
      {
        id: 2,
        title: 'Camera Bag & Pouch',
        badge: 'Bag & Pouch',
        color: 'bg-[#EDE8FC] text-[#553C9A]',
        tagBg: 'bg-[#C9B8F0]',
        desc: 'Custom compartmentalized organizer travel bag plus soft protective sleeve pouch to safeguard the camera body and accessories.',
        spec: 'Padded Dividers • Soft Inner Pouch • Water-Resistant Canvas',
        tip: 'Hospital-grade sanitized and sealed at our Pasig base prior to every release.'
      },
      {
        id: 3,
        title: '32GB SD Card',
        badge: 'Storage',
        color: 'bg-[#E8F7F1] text-[#234E52]',
        tagBg: 'bg-[#A8DBC8]',
        desc: 'Fast read/write SD memory card certified for 4K video recording and high-speed continuous photo shooting.',
        spec: '32GB Capacity • Class 10 UHS-I • 4K Ready',
        tip: 'Sanitized, formatted, and zero leftover clips before every rental handoff.'
      },
      {
        id: 4,
        title: 'Card Reader (OTG Dual Interface)',
        badge: 'Instant Transfer',
        color: 'bg-[#FEF0E7] text-[#C05621]',
        tagBg: 'bg-[#F5C6A8]',
        desc: 'Plug-and-play high-speed card reader to transfer full-resolution photos and 4K clips directly to your iPhone or Android.',
        spec: 'Dual Lightning & Type-C OTG • Plug & Play',
        tip: 'Import straight into iOS Photos or Google Photos to post your reels and TikToks without a computer!'
      },
      {
        id: 5,
        title: 'Battery & Charger',
        badge: 'Power Kit',
        color: 'bg-[#EDE8FC] text-[#553C9A]',
        tagBg: 'bg-[#C9B8F0]',
        desc: 'OEM Canon rechargeable lithium-ion battery plus dedicated AC wall charger dock for rapid power-ups.',
        spec: 'Rechargeable Li-ion • Dedicated AC Wall Dock Charger',
        tip: 'Charge conveniently overnight or between shoot locations.'
      },
      {
        id: 6,
        title: 'Wrist Strap',
        badge: 'Anti-Drop',
        color: 'bg-[#E8F7F1] text-[#234E52]',
        tagBg: 'bg-[#A8DBC8]',
        desc: 'Adjustable woven lanyard attached to the camera eyelet to prevent accidental drops in crowded spaces.',
        spec: 'Reinforced Paracord • Quick-Cinch Toggle',
        tip: 'Always loop around your wrist before lifting the camera in crowds or over bridges.'
      },
      {
        id: 7,
        title: 'Silicon Case',
        badge: 'Protective Grip',
        color: 'bg-[#FEF0E7] text-[#C05621]',
        tagBg: 'bg-[#F5C6A8]',
        desc: 'Custom-molded silicone case providing non-slip ergonomic grip and drop cushioning without blocking any buttons or ports.',
        spec: 'Shock-Absorbing Silicone • Non-Slip Matte Finish',
        tip: 'Provides secure, comfortable one-handed grip when filming talking-head vlogs.'
      },
      {
        id: 8,
        title: 'Ulanzi MT-44 Extendable Tripod',
        badge: 'Extendable Tripod',
        color: 'bg-[#EDE8FC] text-[#553C9A]',
        tagBg: 'bg-[#C9B8F0]',
        desc: 'Versatile extendable vlog tripod with integrated 2-in-1 phone clip and cold shoe mount, perfect for handheld vlogging, concerts, and table filming.',
        spec: 'Extendable Monopod/Tripod • 360° Ball Head • Cold Shoe',
        tip: 'Extend fully for elevated concert stage shots or group selfie angles!'
      }
    ]},
  {
    id: 'kodak-pixpro-fz55',
    name: 'KODAK PIXPRO FZ55 Digital Camera',
    shortName: 'Kodak Pixpro FZ55',
    tagline: 'Viral compact Y2K digicam aesthetic with 16MP CMOS sensor, 5x optical zoom & 1080p Full HD video',
    badge: 'Coming Soon',
    statusText: 'Lineup Addition',
    image: '/kodak-pixpro-fz55-hero.png',
    isAvailable: false,
    depositAmount: 0,
    standardRate: 0,
    bulkRate: 0,
    meetupDeposit: 0,
    courierDeposit: 0,
    pricingTiers: [],
    rating: 5.0,
    reviewCount: 12,
    specs: ['16MP CMOS Sensor', '5x Optical Zoom (28–140mm)', '1080p Full HD Video', '2.7" LCD Screen'],
    gradient: 'from-[#FFF6EE] via-[#EDE8FC] to-[#FAFAF7]',
    themeColor: '#F5C6A8',
    bagItems: [
      {
        id: 1,
        title: 'KODAK PIXPRO FZ55 Digital Camera Unit',
        badge: '16MP Sensor',
        color: 'bg-[#FEF0E7] text-[#C05621]',
        tagBg: 'bg-[#F5C6A8]',
        desc: 'Ultra-compact silver digicam with 5x optical zoom, 28mm wide angle & iconic Y2K vintage color profile.',
        spec: '16MP 1/2.3" CMOS • 5x Optical Zoom • 1080p FHD',
        tip: 'Shoot with flash indoors or at night for that authentic early 2000s party film vibe.'
      },
      {
        id: 2,
        title: '64GB Extreme SD / MicroSD Card',
        badge: 'Included Storage',
        color: 'bg-[#EDE8FC] text-[#553C9A]',
        tagBg: 'bg-[#C9B8F0]',
        desc: 'High-speed storage card capable of storing thousands of high-res vintage digicam shots and FHD videos.',
        spec: '64GB Storage • Fast Write Speed',
        tip: 'No need to buy your own memory card; it comes fully formatted and ready.'
      },
      {
        id: 3,
        title: 'Rechargeable Li-Ion Battery & Charging Cable',
        badge: 'Extended Power',
        color: 'bg-[#E8F7F1] text-[#234E52]',
        tagBg: 'bg-[#A8DBC8]',
        desc: 'Rechargeable Kodak LB-012 battery pack and USB charging cable.',
        spec: 'LB-012 Li-ion • USB Fast Charge Cable',
        tip: 'Easy top-up with any standard power bank or wall adapter.'
      },
      {
        id: 4,
        title: 'Dual Lightning & USB-C OTG Card Reader',
        badge: 'Instant Transfer',
        color: 'bg-[#EDE8FC] text-[#553C9A]',
        tagBg: 'bg-[#C9B8F0]',
        desc: 'Plug-and-play adapter to instantly transfer photos directly to your iPhone or Android phone.',
        spec: 'Dual Lightning + Type-C OTG',
        tip: 'Instantly post your straight-out-of-camera digicam shots on Instagram stories or TikTok.'
      },
      {
        id: 5,
        title: 'Protective Padded Travel Pouch & Wrist Strap',
        badge: 'Everyday Travel',
        color: 'bg-[#FEF0E7] text-[#C05621]',
        tagBg: 'bg-[#F5C6A8]',
        desc: 'Soft padded protective case with security wrist lanyard to keep your camera safe during concerts.',
        spec: 'Shockproof padding • Security Wrist Lanyard',
        tip: 'Keep the strap around your wrist while dancing and filming at events.'
      }
    ]
  }
];
