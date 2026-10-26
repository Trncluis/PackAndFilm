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
  gradient: string;
  themeColor: string;
  image: string;
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
    shortName: 'Pocket 3',
    tagline: '1-inch sensor, 4K/120fps mechanical gimbal & rotatable OLED screen',
    badge: 'Available Now',
    statusText: 'Ready to Rent',
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
    specs: ['4K/120fps Video', '1-inch CMOS Sensor', 'ActiveTrack 6.0', '128GB MicroSD Included'],
    gradient: 'from-[#EDE8FC] via-[#FEF0E7] to-[#E8F7F1]',
    themeColor: '#C9B8F0',
    image: '/dji-pocket-3-hero.png',
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
    image: '/canon-g7x-hero.png',
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
    id: 'fujifilm-x100vi',
    name: 'Fujifilm X100VI Digital Film Simulation Kit',
    shortName: 'Fuji X100VI',
    tagline: 'Vintage cinematic tones with 40.2MP X-Trans CMOS sensor & built-in Film Sims',
    badge: 'Coming Soon',
    isAvailable: false,
    depositAmount: 3000,
    standardRate: 900,
    bulkRate: 800,
    meetupDeposit: 3000,
    courierDeposit: 5000,
    pricingTiers: [
      { minDays: 1, maxDays: 2, rate: 900, label: '1–2 Days', sublabel: 'Target Rate (₱900/d)' },
      { minDays: 3, maxDays: 5, rate: 850, label: '3–5 Days', sublabel: 'Extended (₱850/d)' },
      { minDays: 6, maxDays: 999, rate: 800, label: '6+ Days', sublabel: 'Long-Term (₱800/d)' },
    ],
    rating: 5.0,
    reviewCount: 19,
    specs: ['40.2MP X-Trans 5', '20 Film Simulations', '6.0-Stop IBIS', 'Fixed 23mm F2.0 Lens'],
    gradient: 'from-[#E8F7F1] via-[#EDE8FC] to-[#FEF0E7]',
    themeColor: '#A8DBC8',
    image: '/fujifilm-x100vi-hero.jpg',
    bagItems: [
      {
        id: 1,
        title: 'Fujifilm X100VI Camera Unit',
        badge: '40.2MP Sensor',
        color: 'bg-[#E8F7F1] text-[#234E52]',
        tagBg: 'bg-[#A8DBC8]',
        desc: '40.2MP APS-C sensor with 20 iconic film simulation recipes (Classic Chrome, Reala Ace).',
        spec: '40.2MP • In-body Image Stabilization • Hybrid Viewfinder',
        tip: 'Choose Classic Chrome film sim recipe for that nostalgic film recipe tone.'
      },
      {
        id: 2,
        title: '128GB UHS-II Extreme SD Card',
        badge: 'Pro Storage',
        color: 'bg-[#EDE8FC] text-[#553C9A]',
        tagBg: 'bg-[#C9B8F0]',
        desc: 'Fast write speed SD card for RAW + JPEG film simulation captures.',
        spec: '128GB • 300MB/s UHS-II Speed Class 90',
        tip: 'Shoot in Fine JPEG for instant mobile transfer without editing.'
      },
      {
        id: 3,
        title: 'Black Mist Filter (1/4 Diffusion)',
        badge: 'Dreamy Glow',
        color: 'bg-[#FEF0E7] text-[#C05621]',
        tagBg: 'bg-[#F5C6A8]',
        desc: 'Adds soft cinematic halation and reduces digital harshness around highlights.',
        spec: '49mm Thread • 1/4 Mist Strength • Anti-reflective',
        tip: 'Best for portraits, golden hour shoots, and street neon night photography.'
      },
      {
        id: 4,
        title: 'Lens Adapter Ring & Metal Square Hood',
        badge: 'Retro Flair',
        color: 'bg-[#EDE8FC] text-[#553C9A]',
        tagBg: 'bg-[#C9B8F0]',
        desc: 'Weather-sealing adapter ring with vintage aesthetic square lens hood.',
        spec: 'Anodized aluminum • Weather sealing mount',
        tip: 'Keeps front lens element protected from sudden rain and accidental drops.'
      },
      {
        id: 5,
        title: 'Dual NP-W126S Batteries & Dual Charger',
        badge: 'Extended Power',
        color: 'bg-[#E8F7F1] text-[#234E52]',
        tagBg: 'bg-[#A8DBC8]',
        desc: 'Two OEM batteries and dual slot USB-C charging dock for all-day street shoots.',
        spec: '2x NP-W126S • USB-C Fast Dual Dock',
        tip: 'Keep spare battery in the internal case pouch.'
      },
      {
        id: 6,
        title: 'Premium Leather Neck & Hand Strap',
        badge: 'Aesthetic Strap',
        color: 'bg-[#FEF0E7] text-[#C05621]',
        tagBg: 'bg-[#F5C6A8]',
        desc: 'Genuine leather neck strap with quick-release anchors and scratch pads.',
        spec: 'Vintage tan leather • Scratch guard rings',
        tip: 'Aesthetic street look for photo walks.'
      },
      {
        id: 7,
        title: 'High Speed SD OTG Card Reader',
        badge: 'Mobile Transfer',
        color: 'bg-[#EDE8FC] text-[#553C9A]',
        tagBg: 'bg-[#C9B8F0]',
        desc: 'Dual Lightning & Type-C SD reader to pull photos immediately to Lightroom or Photos.',
        spec: 'Direct OTG • Works with iPhone & Android',
        tip: 'Transfer straight to your phone for instant Instagram posting.'
      },
      {
        id: 8,
        title: 'Custom Padded Canvas Camera Bag',
        badge: 'Carry Kit',
        color: 'bg-[#E8F7F1] text-[#234E52]',
        tagBg: 'bg-[#A8DBC8]',
        desc: 'Shock-absorbing protective case tailored for the X100VI and accessories.',
        spec: 'Padded dividers • Water-resistant canvas',
        tip: 'Sanitized at our Pasig base before every rental.'
      }
    ]
  }
];
