export const BRAND_COLORS = {
  midnightTeal: '#092F35',
  deepTeal: '#0F4C5C',
  darkTeal: '#0A3A47',
  emerald: '#0F8A5F',
  deepGreen: '#0B5D4B',
  warmIvory: '#F7F4EC',
  warmIvoryMuted: '#EDE8DA',
  accentYellow: '#FFD84A',
  white: '#FFFFFF',
} as const;

export const COMPANY_INFO = {
  companyName: 'MAATA TECHNOLOGIES',
  companyDisplay: 'MAATA Technologies',
  publicBrand: 'MAATA India',
  teluguWord: 'మాట',
  teluguMeaning: 'Word · Speech · Expression',
  tagline: 'Built in India. Designed for Indians.',
  centralConcept: 'From Local Experience to a Connected India.',
  location: 'Chittoor, Andhra Pradesh, India',
  appUrl: 'https://maataapp.com',
  supportEmail: 'support@maataapp.com',
  secondarySupportEmail: 'maatasupport215@gmail.com',
  socialLinks: [
    {
      label: 'Instagram',
      href: 'https://www.instagram.com/maata_india/',
      handle: '@maata_india',
    },
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/company/maata-india/',
      handle: 'MAATA India',
    },
    {
      label: 'Facebook',
      href: 'https://www.facebook.com/profile.php?id=61596128342302',
      handle: 'MAATA India',
    },
    {
      label: 'YouTube',
      href: 'https://www.youtube.com/@MaataIndiaOfficial',
      handle: '@MaataIndiaOfficial',
    },
    {
      label: 'X (Twitter)',
      href: 'https://x.com/MaataIndia',
      handle: '@MaataIndia',
    },
  ],
} as const;

export interface NavItem {
  label: string;
  to: string;
  children?: { label: string; description: string; to: string }[];
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { label: 'Home', to: '/' },
  {
    label: 'Company',
    to: '/company',
    children: [
      {
        label: 'Why MAATA',
        description: 'Everyday Indian motivation and local origins.',
        to: '/company#why-maata',
      },
      {
        label: 'Founders & Leadership',
        description: 'G. Balaji Reddy and G. Pavani.',
        to: '/company#leadership',
      },
      {
        label: 'Vision & Mission',
        description: 'Accessible digital experiences across India.',
        to: '/company#vision',
      },
      {
        label: 'Company Journey',
        description: 'Editable milestones from Chittoor outward.',
        to: '/company#journey',
      },
    ],
  },
  {
    label: 'MAATA App',
    to: '/app',
    children: [
      {
        label: '16-Feature Ecosystem',
        description: 'Chats, calls, rides, services, work & AI.',
        to: '/app#ecosystem',
      },
      {
        label: 'MAATA Business',
        description: 'Billing, stock, GST reports & online store.',
        to: '/app#business',
      },
      {
        label: 'Local India Network',
        description: 'Shops, drivers, workers, services & families.',
        to: '/app#local-india',
      },
    ],
  },
  { label: 'Technology', to: '/technology' },
  { label: 'Newsroom', to: '/news' },
  { label: 'Careers', to: '/careers' },
  { label: 'Contact Us', to: '/contact' },
];

export const TYPOGRAPHY_SCALE = {
  heroHeadline: 'text-[clamp(2.35rem,4.3vw,4rem)] leading-[1.08] tracking-tight font-semibold',
  sectionHeadline: 'text-[clamp(1.75rem,3vw,2.75rem)] leading-[1.15] tracking-tight font-semibold',
  cardHeadline: 'text-xl md:text-2xl leading-snug font-semibold',
  editorialQuote: 'font-editorial italic text-[clamp(1.35rem,2.2vw,1.95rem)] leading-relaxed',
  body: 'text-[15px] md:text-base leading-[1.7]',
  kicker: 'text-xs font-medium tracking-[0.12em] uppercase',
} as const;
