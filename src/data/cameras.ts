export interface CameraItem {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  badge: string;
  isAvailable: boolean;
  standardRate: number; // 1-2 days rate (e.g. 500)
  bulkRate: number;     // 3+ days rate (e.g. 450)
  meetupDeposit: number;
  courierDeposit: number;
  rating: number;
  reviewCount: number;
  specs: string[];
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
    shortName: 'Pocket 3',
    tagline: '1-inch sensor, 4K/120fps mechanical gimbal & rotatable OLED screen',
    badge: 'Available Now',
    isAvailable: true,
    standardRate: 450,
    bulkRate: 420,
    meetupDeposit: 1000,
    courierDeposit: 1000,
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
    id: 'insta360-x4',
    name: 'Insta360 X4 8K 360° Creator Kit',
    shortName: 'Insta360 X4',
    tagline: 'Shoot first, point later! 8K 360° capture, invisible selfie stick & bullet-time',
    badge: 'Coming Soon',
    isAvailable: false,
    standardRate: 650,
    bulkRate: 580,
    meetupDeposit: 1500,
    courierDeposit: 3000,
    rating: 4.96,
    reviewCount: 42,
    specs: ['8K 30fps 360°', 'Invisible Selfie Stick', 'FlowState Stabilization', 'Waterproof to 10m'],
    gradient: 'from-[#FEF0E7] via-[#FFF3D6] to-[#EDE8FC]',
    themeColor: '#F5C6A8',
    bagItems: [
      {
        id: 1,
        title: 'Insta360 X4 Camera Body',
        badge: '8K Dual Lens',
        color: 'bg-[#FEF0E7] text-[#C05621]',
        tagBg: 'bg-[#F5C6A8]',
        desc: 'Dual 1/2" sensors with 8K 360° recording, 5.7K 60fps, and active HDR for action vlogs.',
        spec: '8K 360° Video • FlowState • AI Gesture Control',
        tip: 'Use standard lens guards to protect dual fisheye lenses!'
      },
      {
        id: 2,
        title: '114cm Invisible Selfie Stick',
        badge: 'Drone Effect',
        color: 'bg-[#EDE8FC] text-[#553C9A]',
        tagBg: 'bg-[#C9B8F0]',
        desc: 'Automatically stitches out in video giving you floating drone third-person angles.',
        spec: '114cm extension • Lightweight aircraft aluminum',
        tip: 'Keep the stick in a straight line with the camera for 100% invisible stitching.'
      },
      {
        id: 3,
        title: '128GB High-Speed Extreme Pro MicroSD',
        badge: 'V30 Extreme',
        color: 'bg-[#E8F7F1] text-[#234E52]',
        tagBg: 'bg-[#A8DBC8]',
        desc: 'Pre-formatted high bitrate card certified for 8K panoramic recording.',
        spec: '128GB • 200MB/s Read • A2 V30 speed',
        tip: 'Supports up to 3+ hours of continuous 360 recording.'
      },
      {
        id: 4,
        title: 'Removable Premium Lens Guards',
        badge: 'Dual Protection',
        color: 'bg-[#EDE8FC] text-[#553C9A]',
        tagBg: 'bg-[#C9B8F0]',
        desc: 'Optical-grade curved lens shields that screw on for scratch protection.',
        spec: 'Anti-scratch glass • Multi-coating anti-glare',
        tip: 'Turn on Lens Guard mode in settings for optical correction.'
      },
      {
        id: 5,
        title: 'Dual Battery & Fast Charging Hub',
        badge: 'All Day Power',
        color: 'bg-[#FEF0E7] text-[#C05621]',
        tagBg: 'bg-[#F5C6A8]',
        desc: 'Two 2290mAh batteries and fast multi-charger to never miss a moment.',
        spec: '2x 2290mAh Batteries • Fast Charge Case',
        tip: 'Each battery provides up to 135 mins of recording.'
      },
      {
        id: 6,
        title: 'Bullet Time Cord & Tabletop Tripod',
        badge: 'Matrix FX',
        color: 'bg-[#E8F7F1] text-[#234E52]',
        tagBg: 'bg-[#A8DBC8]',
        desc: 'Swing accessory and mini tripod handle for slow-mo 360 orbit shots.',
        spec: 'Bullet-time handle • 1/4" tripod folding legs',
        tip: 'Set camera to Bullet-time mode and swing overhead!'
      },
      {
        id: 7,
        title: 'Fast OTG Transfer Cable',
        badge: 'Instant Edit',
        color: 'bg-[#EDE8FC] text-[#553C9A]',
        tagBg: 'bg-[#C9B8F0]',
        desc: 'Direct USB-C to iOS / Android cable for lightning editing inside Insta360 app.',
        spec: 'High-speed passthrough • Zero Wi-Fi lag',
        tip: 'Use Insta360 AI edit templates to generate reels in 60s.'
      },
      {
        id: 8,
        title: 'Shockproof Hard Travel Case',
        badge: 'Padded Pouch',
        color: 'bg-[#FEF0E7] text-[#C05621]',
        tagBg: 'bg-[#F5C6A8]',
        desc: 'Form-fitting custom organizer bag with moisture repellent exterior.',
        spec: 'Sanitized EVA case • Weather resistant',
        tip: 'Available for Pasig meetup or Metro Manila Grab Express.'
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
    standardRate: 900,
    bulkRate: 800,
    meetupDeposit: 3000,
    courierDeposit: 5000,
    rating: 5.0,
    reviewCount: 19,
    specs: ['40.2MP X-Trans 5', '20 Film Simulations', '6.0-Stop IBIS', 'Fixed 23mm F2.0 Lens'],
    gradient: 'from-[#E8F7F1] via-[#EDE8FC] to-[#FEF0E7]',
    themeColor: '#A8DBC8',
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
