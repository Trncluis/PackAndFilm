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

export const CAMERAS: CameraItem[] = [
  {
    id: 'dji-pocket-3',
    name: 'DJI Osmo Pocket 3 Standard Kit',
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
      { minDays: 1, maxDays: 1, rate: 450, label: '1 Day', sublabel: 'Standard (₱450/d)' },
      { minDays: 2, maxDays: 3, rate: 420, label: '2–3 Days', sublabel: 'Weekend Tier (₱420/d)' },
      { minDays: 4, maxDays: 5, rate: 380, label: '4–5 Days', sublabel: 'Extended Trip (₱380/d)' },
      { minDays: 6, maxDays: 999, rate: 350, label: '6+ Days', sublabel: 'Long-Term Value (₱350/d)' },
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
        desc: '1-inch CMOS sensor, 4K/120fps ultra-smooth mechanical 3-axis gimbal with 2" rotatable OLED screen.',
        spec: '4K/120fps • 10-bit D-Log M • 1-inch Sensor',
        tip: 'Flip screen sideways to immediately power on and start recording!'
      },
      {
        id: 2,
        title: '128GB MicroSD (SanDisk Extreme PRO)',
        badge: 'High Speed',
        color: 'bg-[#FEF0E7] text-[#C05621]',
        tagBg: 'bg-[#F5C6A8]',
        desc: 'SanDisk Extreme PRO V30 A2 rated. High bitrates for uninterrupted 4K video clips (4+ hrs).',
        spec: '128GB • 200MB/s Read • V30 4K Certified',
        tip: 'Formatted clean before handoff. Zero leftover clips.'
      },
      {
        id: 3,
        title: 'Dual OTG Card Reader (Lightning + Type-C)',
        badge: 'Instant Export',
        color: 'bg-[#E8F7F1] text-[#234E52]',
        tagBg: 'bg-[#A8DBC8]',
        desc: 'Plug-and-play adapter to move clips directly to iPhone Camera Roll or Android in seconds.',
        spec: 'Dual Type-C & Lightning • Plug & Play',
        tip: 'Open iOS Files app or Android Gallery to export in full 4K.'
      },
      {
        id: 4,
        title: 'Silicone Desktop Base',
        badge: 'Tabletop Stand',
        color: 'bg-[#EDE8FC] text-[#553C9A]',
        tagBg: 'bg-[#C9B8F0]',
        desc: 'Snug non-slip silicone cradle for steady cafe tabletop talking heads and timelapses.',
        spec: 'Anti-slip base • Compact • Drop-safe',
        tip: 'Perfect for cafe food vlogs, study-with-me streams, or sit-downs.'
      },
      {
        id: 5,
        title: 'Handle Extension Grip',
        badge: 'Comfort Grip',
        color: 'bg-[#FEF0E7] text-[#C05621]',
        tagBg: 'bg-[#F5C6A8]',
        desc: 'Adds comfortable grip length and includes standard 1/4" tripod screw thread.',
        spec: '1/4" Threaded base • Extra grip • Type-C Passthrough',
        tip: 'Allows you to mount onto any mini tripod or selfie stick.'
      },
      {
        id: 6,
        title: 'Protective Hard Lens Cover',
        badge: 'Lens Shield',
        color: 'bg-[#E8F7F1] text-[#234E52]',
        tagBg: 'bg-[#A8DBC8]',
        desc: 'Hard-shell shield that locks the gimbal motor safely while carrying inside your purse or tote.',
        spec: 'Gimbal clamp • Magnetic latch • Scratch proof',
        tip: 'Snap this on whenever storing or moving locations.'
      },
      {
        id: 7,
        title: 'Pastel Woven Wrist Strap',
        badge: 'Anti-Drop',
        color: 'bg-[#EDE8FC] text-[#553C9A]',
        tagBg: 'bg-[#C9B8F0]',
        desc: 'Reinforced woven paracord wrist lanyard with adjustable cinch toggle for concerts.',
        spec: 'Reinforced nylon • Adjustable cinch • Pastel hue',
        tip: 'Loop around your wrist before filming concert crowds.'
      },
      {
        id: 8,
        title: 'Weatherproof Shock Organizer Case',
        badge: 'Travel Bag',
        color: 'bg-[#FEF0E7] text-[#C05621]',
        tagBg: 'bg-[#F5C6A8]',
        desc: 'Padded EVA carry case with custom compartments for all items. Sanitized before handover.',
        spec: 'EVA shockproof shell • Water-resistant • Compact',
        tip: 'Hospital-grade sanitized and sealed at our Pasig base.'
      }
    ]
  },
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
    standardRate: 500,
    bulkRate: 400,
    meetupDeposit: 1000,
    courierDeposit: 1000,
    pricingTiers: [
      { minDays: 1, maxDays: 1, rate: 500, label: '1 Day', sublabel: 'Standard (₱500/d)' },
      { minDays: 2, maxDays: 3, rate: 450, label: '2–3 Days', sublabel: 'Weekend Tier (₱450/d)' },
      { minDays: 4, maxDays: 5, rate: 420, label: '4–5 Days', sublabel: 'Extended Trip (₱420/d)' },
      { minDays: 6, maxDays: 999, rate: 400, label: '6+ Days', sublabel: 'Long-Term Value (₱400/d)' },
    ],
    rating: 4.97,
    reviewCount: 38,
    specs: ['20.1MP 1.0" Stacked CMOS', '4.2x f/1.8–2.8 Zoom (24–100mm)', '4K 30p Uncropped Video', '180° Flip-Up Touchscreen'],
    gradient: 'from-[#FEF0E7] via-[#FFF3D6] to-[#EDE8FC]',
    themeColor: '#F5C6A8',
    bagItems: [
      {
        id: 1,
        title: 'Canon PowerShot G7 X Mark III Camera Body',
        badge: 'Main Unit',
        color: 'bg-[#FEF0E7] text-[#C05621]',
        tagBg: 'bg-[#F5C6A8]',
        desc: '20.1MP 1.0-inch stacked sensor, fast f/1.8–2.8 4.2x optical zoom lens, DIGIC 8 processor, and 180° flip-up touchscreen for aesthetic vlogs.',
        spec: '20.1MP • 4K 30p Uncropped • 180° Flip Touchscreen • Optical IS',
        tip: 'Flip screen up for instant selfie framing; use the tactile control ring around the lens for smooth zooming.'
      },
      {
        id: 2,
        title: '32GB High-Speed SD Card',
        badge: 'Storage',
        color: 'bg-[#EDE8FC] text-[#553C9A]',
        tagBg: 'bg-[#C9B8F0]',
        desc: 'Fast read/write SD memory card certified for 4K video recording and high-speed continuous photo shooting.',
        spec: '32GB Capacity • Class 10 UHS-I • 4K Ready',
        tip: 'Sanitized, formatted, and zero leftover clips before every rental handoff.'
      },
      {
        id: 3,
        title: 'SD Card Reader (OTG Dual Interface)',
        badge: 'Instant Transfer',
        color: 'bg-[#E8F7F1] text-[#234E52]',
        tagBg: 'bg-[#A8DBC8]',
        desc: 'Plug-and-play high-speed card reader to transfer full-resolution photos and 4K clips directly to your iPhone or Android.',
        spec: 'Dual Lightning & Type-C OTG • Plug & Play',
        tip: 'Import straight into iOS Photos or Google Photos to post your reels and TikToks without a computer!'
      },
      {
        id: 4,
        title: 'Dedicated Wall Battery Charger',
        badge: 'Fast Charging',
        color: 'bg-[#FEF0E7] text-[#C05621]',
        tagBg: 'bg-[#F5C6A8]',
        desc: 'OEM Canon battery charger dock for rapid AC wall charging between shoot locations or overnight.',
        spec: '100–240V AC Worldwide • LED Charge Indicator',
        tip: 'Recharge one battery at your accommodation while shooting out with the extra battery.'
      },
      {
        id: 5,
        title: 'Dual NB-13L Batteries (Main + Extra Battery)',
        badge: 'Extended Power',
        color: 'bg-[#EDE8FC] text-[#553C9A]',
        tagBg: 'bg-[#C9B8F0]',
        desc: 'Two lithium-ion batteries included so you can shoot events, concerts, and travel days without power anxiety.',
        spec: '2x NB-13L Batteries • 3.6V 1250mAh • Dual Power',
        tip: 'Keep the spare battery in your case pouch; swap in seconds when the battery icon blinks.'
      },
      {
        id: 6,
        title: 'Reinforced Wrist Strap',
        badge: 'Anti-Drop',
        color: 'bg-[#E8F7F1] text-[#234E52]',
        tagBg: 'bg-[#A8DBC8]',
        desc: 'Adjustable woven lanyard attached to the camera eyelet to prevent accidental drops in crowded spaces.',
        spec: 'Reinforced Paracord • Quick-Cinch Toggle',
        tip: 'Always loop around your wrist before lifting the camera in crowds or over bridges.'
      },
      {
        id: 7,
        title: 'Protective Silicone Case',
        badge: 'Grip & Cushion',
        color: 'bg-[#FEF0E7] text-[#C05621]',
        tagBg: 'bg-[#F5C6A8]',
        desc: 'Custom-molded silicone case providing non-slip ergonomic grip and drop cushioning without blocking any buttons or ports.',
        spec: 'Shock-Absorbing Silicone • Non-Slip Matte Finish',
        tip: 'Provides secure, comfortable one-handed grip when filming talking-head vlogs.'
      },
      {
        id: 8,
        title: 'Protective Camera Skin',
        badge: 'Body Protection',
        color: 'bg-[#EDE8FC] text-[#553C9A]',
        tagBg: 'bg-[#C9B8F0]',
        desc: 'Precision matte vinyl protective skin shielding the camera exterior from minor scuffs and daily cosmetic wear.',
        spec: 'Precision Die-Cut Vinyl • Anti-Scratch Finish',
        tip: 'Keeps the camera looking brand new and aesthetically clean for all your photos.'
      },
      {
        id: 9,
        title: 'Pre-installed Tempered Glass',
        badge: 'Screen Shield',
        color: 'bg-[#E8F7F1] text-[#234E52]',
        tagBg: 'bg-[#A8DBC8]',
        desc: '9H hardness optical tempered glass screen protector pre-installed over the 3.0" touchscreen to guard against scratches.',
        spec: '9H Hardness • Oleophobic Coating • Touch Responsive',
        tip: 'Touchscreen controls remain 100% responsive while keeping the screen pristine.'
      },
      {
        id: 10,
        title: 'Soft Protective Camera Pouch',
        badge: 'Daily Sleeve',
        color: 'bg-[#EDE8FC] text-[#553C9A]',
        tagBg: 'bg-[#C9B8F0]',
        desc: 'Soft padded drawstring pouch for carrying the G7 X Mark III safely inside your personal purse, tote, or jacket pocket.',
        spec: 'Cushioned Lining • Drawstring Closure • Compact',
        tip: 'Perfect for cafe-hopping when you want to travel light with just the camera.'
      },
      {
        id: 11,
        title: 'Weatherproof Padded Camera Bag',
        badge: 'Travel Bag',
        color: 'bg-[#FEF0E7] text-[#C05621]',
        tagBg: 'bg-[#F5C6A8]',
        desc: 'Custom compartmentalized organizer carry bag holding the camera, charger, spare battery, reader, and all kit items. Sanitized before handoff.',
        spec: 'Padded Dividers • Water-Resistant Canvas • Sanitized',
        tip: 'Sanitized hospital-grade at our Pasig base prior to every rental release.'
      }
    ]
  },
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
