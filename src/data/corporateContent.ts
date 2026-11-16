export interface FounderProfile {
  id: 'balaji' | 'pavani';
  assetId: 'founderBalaji' | 'founderPavani';
  name: string;
  role: string;
  originNote: string;
  bio: string;
  perspectiveQuote: string;
  responsibilities: string[];
}

export type EcosystemCategory =
  | 'All'
  | 'Communication'
  | 'Mobility & Services'
  | 'Commerce & Business'
  | 'Trust & Utility';

export interface EcosystemFeature {
  id: string;
  index: string;
  title: string;
  category: Exclude<EcosystemCategory, 'All'>;
  shortTag: string;
  description: string;
  highlightNote: string;
  previewHeadline: string;
  previewSubline: string;
  previewItems: string[];
  actionLabel: string;
  actionHref: string;
}

export interface BusinessCapability {
  id: string;
  index: string;
  title: string;
  subtitle: string;
  description: string;
  practicalBenefit: string;
  previewRows: { label: string; value: string }[];
}

export interface CommunityParticipant {
  id: string;
  label: string;
  telugu: string;
  roleSummary: string;
  connections: string[];
  x: number;
  y: number;
}

export interface JourneyMilestone {
  id: string;
  step: string;
  dateLabel: string;
  isPlaceholder: boolean;
  title: string;
  description: string;
}

export type NewsCategory =
  | 'All'
  | 'Announcements'
  | 'Product Updates'
  | 'Company News'
  | 'Articles & Insights'
  | 'Featured Stories';

export interface NewsArticle {
  id: string;
  category: Exclude<NewsCategory, 'All'>;
  featured?: boolean;
  dateLabel: string;
  location: string;
  readTime: string;
  title: string;
  excerpt: string;
  body: string[];
}

export interface WorkArea {
  id: string;
  index: string;
  area: string;
  description: string;
  focus: string[];
}

/**
 * Editable Founder Profiles (Phase 2 — Strict factual alignment, no invented credentials)
 */
export const FOUNDERS: FounderProfile[] = [
  {
    id: 'balaji',
    assetId: 'founderBalaji',
    name: 'G. Balaji Reddy',
    role: 'Founder',
    originNote: 'Local Market Experience · Chittoor, Andhra Pradesh',
    bio: 'Grounded in practical local market experience, G. Balaji Reddy guides MAATA Technologies with real-world understanding of how neighbourhood shops, families, workers, and everyday commerce operate across Indian towns. [Editable biography]',
    perspectiveQuote:
      'Technology becomes genuinely useful when it respects how local markets and everyday people already communicate and trade.',
    responsibilities: [
      'Business vision',
      'Local market experience',
      'Investment',
      'Development support',
    ],
  },
  {
    id: 'pavani',
    assetId: 'founderPavani',
    name: 'G. Pavani',
    role: 'Co-Founder & CEO',
    originNote: 'Product Leadership & Operations · Chittoor, Andhra Pradesh',
    bio: 'G. Pavani leads product management, planning, working models, and operational execution at MAATA Technologies—turning everyday local insights into structured, approachable digital experiences for MAATA India. [Editable biography]',
    perspectiveQuote:
      'Every feature in MAATA is planned, tested, and refined so people across towns, villages, and cities can use it with clarity and confidence.',
    responsibilities: [
      'Product management',
      'App planning and coordination',
      'Feature requirements and information',
      'Testing and working models',
      'Marketing and promotions',
      'Presentations and product explanations',
      'Business and operational coordination',
    ],
  },
];

/**
 * Exact Vision & Mission Statements
 */
export const VISION_MISSION = {
  vision: {
    label: 'Our Vision',
    statement:
      'To make useful digital experiences more accessible to people across India, regardless of location or language.',
  },
  mission: {
    label: 'Our Mission',
    statement:
      'To build simple, practical and locally relevant technology that connects people, businesses and everyday services.',
  },
} as const;

/**
 * Editable Company Journey Timeline (Unconfirmed entries clearly marked as placeholders)
 */
export const JOURNEY_TIMELINE: JourneyMilestone[] = [
  {
    id: 'origin',
    step: '01',
    dateLabel: 'Foundation Chapter · Chittoor',
    isPlaceholder: false,
    title: 'Local Market Observation & The Idea of MAATA',
    description:
      'Inspired by everyday communication across local shops and neighbourhoods in Chittoor, the concept of connecting Indian communities under one practical platform took shape.',
  },
  {
    id: 'partnership',
    step: '02',
    dateLabel: 'Leadership Formation',
    isPlaceholder: false,
    title: 'G. Balaji Reddy & G. Pavani Form MAATA Technologies',
    description:
      'Local market experience, investment, and business vision joined with structured product management, testing, and technology-driven execution.',
  },
  {
    id: 'ecosystem-design',
    step: '03',
    dateLabel: 'Product Milestone [Placeholder — Editable Date]',
    isPlaceholder: true,
    title: 'Planning & Working Models for the Connected Ecosystem',
    description:
      'Feature requirements and unified user flows structured across communication, rides, local services, work discovery, and MAATA Business. [Editable milestone entry]',
  },
  {
    id: 'maata-app',
    step: '04',
    dateLabel: 'Public Platform [Placeholder — Editable Date]',
    isPlaceholder: true,
    title: 'MAATA India Digital Platform & Corporate Web Presence',
    description:
      'Establishing maataapp.com for everyday users and businesses alongside the dedicated MAATA Technologies corporate headquarters website. [Editable milestone entry]',
  },
];

/**
 * All 16 Features of the MAATA Digital Ecosystem
 */
export const ECOSYSTEM_FEATURES: EcosystemFeature[] = [
  {
    id: 'chats-messaging',
    index: '01',
    title: 'Chats and Messaging',
    category: 'Communication',
    shortTag: 'Everyday Conversations',
    description:
      'Direct, familiar messaging designed for everyday conversations between families, friends, neighbours, and local businesses.',
    highlightNote: 'Built around the spirit of మాట (Maata) — natural daily dialogue.',
    previewHeadline: 'Neighbourhood & Personal Chat',
    previewSubline: 'Clean conversation threads with quick sharing',
    previewItems: [
      'Direct one-to-one messages',
      'Share photos, notes, and shop details',
      'Clear status and straightforward controls',
    ],
    actionLabel: 'Explore Chats on MAATA',
    actionHref: 'https://maataapp.com',
  },
  {
    id: 'voice-video-calls',
    index: '02',
    title: 'Voice and Video Calls',
    category: 'Communication',
    shortTag: 'Audio & Visual Clarity',
    description:
      'Clear voice and video calling so families, community members, and local service contacts can speak face-to-face without switching apps.',
    highlightNote: 'Accessible calling integrated alongside daily messaging.',
    previewHeadline: 'Voice & Video Connection',
    previewSubline: 'Stay close across towns, villages, and cities',
    previewItems: [
      'Direct voice calling',
      'Face-to-face video calls',
      'Simple call controls from chat threads',
    ],
    actionLabel: 'Explore Calling on MAATA',
    actionHref: 'https://maataapp.com',
  },
  {
    id: 'status-updates',
    index: '03',
    title: 'Status Updates',
    category: 'Communication',
    shortTag: 'Daily Moments',
    description:
      'Share brief photo, text, or announcement updates with contacts and local circles throughout the day.',
    highlightNote: 'Useful for personal moments and timely local shop updates.',
    previewHeadline: 'Everyday Status Updates',
    previewSubline: 'Quick snapshots shared with your circle',
    previewItems: [
      'Visual and text status sharing',
      'Contact-based visibility',
      'Simple browsing across recent updates',
    ],
    actionLabel: 'Explore Status Updates',
    actionHref: 'https://maataapp.com',
  },
  {
    id: 'reels',
    index: '04',
    title: 'Reels',
    category: 'Communication',
    shortTag: 'Short Indian Stories',
    description:
      'Short vertical video discovery showcasing everyday local talent, neighbourhood stories, and business highlights.',
    highlightNote: 'Designed for relatable regional expression.',
    previewHeadline: 'Short Vertical Video Feed',
    previewSubline: 'Discover local creators, shops, and everyday stories',
    previewItems: [
      'Full-screen vertical playback',
      'Regional & community discovery',
      'Share directly into chats and groups',
    ],
    actionLabel: 'Explore Reels on MAATA',
    actionHref: 'https://maataapp.com',
  },
  {
    id: 'groups-communities-channels',
    index: '05',
    title: 'Groups, Communities and Channels',
    category: 'Communication',
    shortTag: 'Shared Circles',
    description:
      'Organised spaces for families, neighbourhood associations, local markets, and regional broadcast channels.',
    highlightNote: 'Brings community notices and group discussions into one place.',
    previewHeadline: 'Groups & Regional Channels',
    previewSubline: 'Connected circles for towns, streets, and interest groups',
    previewItems: [
      'Family & neighbourhood group chats',
      'Community announcements & updates',
      'Topic and local broadcast channels',
    ],
    actionLabel: 'Explore Communities',
    actionHref: 'https://maataapp.com',
  },
  {
    id: 'maata-ai',
    index: '06',
    title: 'MAATA AI',
    category: 'Trust & Utility',
    shortTag: 'Guided Assistance',
    description:
      'Integrated intelligent assistance inside the MAATA ecosystem to help users find information, navigate features, and get everyday clarity.',
    highlightNote: 'Designed to make digital guidance approachable for everyone.',
    previewHeadline: 'MAATA AI Assistant',
    previewSubline: 'Practical assistance built into the ecosystem',
    previewItems: [
      'Everyday questions and guidance',
      'Accessible regional context',
      'Clean conversational interface',
    ],
    actionLabel: 'Explore MAATA AI',
    actionHref: 'https://maataapp.com',
  },
  {
    id: 'book-a-ride',
    index: '07',
    title: 'Book a Ride',
    category: 'Mobility & Services',
    shortTag: 'Local Travel',
    description:
      'Simple ride booking connecting passengers with nearby local transport across neighbourhoods, towns, and cities.',
    highlightNote: 'Straightforward pickup and destination selection.',
    previewHeadline: 'Everyday Ride Booking',
    previewSubline: 'Request local travel with clear route details',
    previewItems: [
      'Select pickup and drop points',
      'Connect with nearby rides',
      'Live trip tracking via Maps',
    ],
    actionLabel: 'Explore Book a Ride',
    actionHref: 'https://maataapp.com',
  },
  {
    id: 'driver-captain',
    index: '08',
    title: 'Driver Captain',
    category: 'Mobility & Services',
    shortTag: 'Driver Mode',
    description:
      'Dedicated experience for local drivers and captains to receive ride requests, navigate routes, and manage their availability.',
    highlightNote: 'Built to respect local drivers’ daily schedules.',
    previewHeadline: 'Driver Captain Workspace',
    previewSubline: 'Availability, ride requests, and route guidance',
    previewItems: [
      'Go online or offline cleanly',
      'Accept nearby passenger requests',
      'Integrated navigation and trip view',
    ],
    actionLabel: 'Explore Driver Captain',
    actionHref: 'https://maataapp.com',
  },
  {
    id: 'local-services',
    index: '09',
    title: 'Local Services',
    category: 'Mobility & Services',
    shortTag: 'Trusted Trades',
    description:
      'Discover and reach nearby skilled service providers—from household repairs to essential everyday assistance.',
    highlightNote: 'Helps residents find dependable local help quickly.',
    previewHeadline: 'Neighbourhood Services Directory',
    previewSubline: 'Connect directly with local technicians & providers',
    previewItems: [
      'Browse everyday home & local services',
      'View provider location & details',
      'Contact directly through MAATA',
    ],
    actionLabel: 'Explore Local Services',
    actionHref: 'https://maataapp.com',
  },
  {
    id: 'find-work-hire-workers',
    index: '10',
    title: 'Find Work and Hire Workers',
    category: 'Mobility & Services',
    shortTag: 'Livelihood Bridge',
    description:
      'A direct local bridge helping people find everyday work opportunities and helping families or businesses hire skilled workers nearby.',
    highlightNote: 'Practical livelihood discovery within local communities.',
    previewHeadline: 'Work & Hiring Board',
    previewSubline: 'Local opportunities connecting workers and employers',
    previewItems: [
      'Browse nearby work requirements',
      'Post local hiring needs clearly',
      'Direct communication between parties',
    ],
    actionLabel: 'Explore Work & Hiring',
    actionHref: 'https://maataapp.com',
  },
  {
    id: 'shops-and-orders',
    index: '11',
    title: 'Shops and Orders',
    category: 'Commerce & Business',
    shortTag: 'Neighbourhood Shopping',
    description:
      'Browse nearby stores, view available goods, and place local orders directly with familiar neighbourhood shops.',
    highlightNote: 'Keeps everyday retail connected to local store owners.',
    previewHeadline: 'Local Shops & Customer Orders',
    previewSubline: 'Discover neighbourhood stores and place orders directly',
    previewItems: [
      'Explore local shop catalogues',
      'Place and track shop orders',
      'Coordinate directly with store owners',
    ],
    actionLabel: 'Explore Shops & Orders',
    actionHref: 'https://maataapp.com',
  },
  {
    id: 'maata-business',
    index: '12',
    title: 'MAATA Business',
    category: 'Commerce & Business',
    shortTag: 'Merchant Hub',
    description:
      'Dedicated digital presence and storefront workspace built specifically for Indian shopkeepers, small enterprises, and local merchants.',
    highlightNote: 'Turn everyday shop experience into an organised online presence.',
    previewHeadline: 'MAATA Business Storefront',
    previewSubline: 'Manage your shop profile, catalog, and customer orders',
    previewItems: [
      'Digital shopfront & product listings',
      'Customer order handling',
      'Integrated with Business Tools',
    ],
    actionLabel: 'Explore MAATA Business',
    actionHref: 'https://maataapp.com',
  },
  {
    id: 'business-tools',
    index: '13',
    title: 'Business Tools',
    category: 'Commerce & Business',
    shortTag: 'Shop Operations',
    description:
      'Practical day-to-day operational tools including billing, stock management, GST-related reports, and customer management.',
    highlightNote: 'Designed around real shopkeeper counter routines.',
    previewHeadline: 'Billing, Stock & GST Tools',
    previewSubline: 'Structured records replacing scattered paper slips',
    previewItems: [
      'Quick customer billing',
      'Stock quantity tracking',
      'GST-related summary reports',
    ],
    actionLabel: 'Explore Business Tools',
    actionHref: 'https://maataapp.com',
  },
  {
    id: 'maps-live-location',
    index: '14',
    title: 'Maps and Live Location',
    category: 'Trust & Utility',
    shortTag: 'Local Navigation',
    description:
      'Location discovery and live location sharing across rides, local shops, services, and personal safety check-ins.',
    highlightNote: 'Supports accurate discovery across towns and neighbourhoods.',
    previewHeadline: 'Maps & Live Location Sharing',
    previewSubline: 'Find nearby places and share live routes safely',
    previewItems: [
      'Discover nearby shops & services',
      'Live trip and location sharing',
      'Clear regional street context',
    ],
    actionLabel: 'Explore Maps & Location',
    actionHref: 'https://maataapp.com',
  },
  {
    id: 'safety-and-privacy',
    index: '15',
    title: 'Safety and Privacy',
    category: 'Trust & Utility',
    shortTag: 'User Control',
    description:
      'Clear privacy settings and user safety controls so individuals and families stay in command of their information and visibility.',
    highlightNote: 'Respectful defaults built for everyday confidence.',
    previewHeadline: 'Privacy & Safety Controls',
    previewSubline: 'Manage profile visibility, contacts, and sharing preferences',
    previewItems: [
      'Profile and status visibility settings',
      'Location sharing permissions',
      'Block & report safety controls',
    ],
    actionLabel: 'Explore Safety & Privacy',
    actionHref: 'https://maataapp.com',
  },
  {
    id: 'settings-coins-help',
    index: '16',
    title: 'Settings, Coins and Help',
    category: 'Trust & Utility',
    shortTag: 'Account & Support',
    description:
      'Centralised account preferences, MAATA Coins utility tracking, and approachable help resources whenever users need assistance.',
    highlightNote: 'Simple settings and accessible guidance in one place.',
    previewHeadline: 'Account Settings, Coins & Help',
    previewSubline: 'Personal preferences, rewards view, and user support',
    previewItems: [
      'Language and account preferences',
      'Coins balance and activity overview',
      'Help centre & support contact',
    ],
    actionLabel: 'Visit MAATA App',
    actionHref: 'https://maataapp.com',
  },
];

/**
 * MAATA Business Showcase Capabilities
 */
export const BUSINESS_MODULES: BusinessCapability[] = [
  {
    id: 'billing',
    index: '01',
    title: 'Billing',
    subtitle: 'Clear, fast counter invoices',
    description:
      'Create itemised customer bills directly at the shop counter without bulky hardware or confusing accounting jargon.',
    practicalBenefit: 'Replaces hasty paper slips with clean digital records you can recall anytime.',
    previewRows: [
      { label: 'Workflow', value: 'Item selection → Instant bill summary' },
      { label: 'Format', value: 'Digital customer receipt & record' },
      { label: 'Focus', value: 'Speed at everyday retail counters' },
    ],
  },
  {
    id: 'stock',
    index: '02',
    title: 'Stock Management',
    subtitle: 'Organised inventory visibility',
    description:
      'Keep track of available shop goods, quantities, and restock priorities so shelves stay prepared for regular customers.',
    practicalBenefit: 'Know what is moving fast and avoid unexpected stockouts during busy hours.',
    previewRows: [
      { label: 'Tracking', value: 'Catalogue items & available counts' },
      { label: 'Updates', value: 'Adjusted alongside daily shop activity' },
      { label: 'Focus', value: 'Clear inventory overview for owners' },
    ],
  },
  {
    id: 'gst',
    index: '03',
    title: 'GST-Related Reports',
    subtitle: 'Structured tax-ready summaries',
    description:
      'Organise billing records into clear GST-related summaries that simplify periodic filing and merchant bookkeeping.',
    practicalBenefit: 'Reduces manual end-of-month sorting of handwritten ledgers and loose bills.',
    previewRows: [
      { label: 'Structure', value: 'Categorised billing & tax breakdowns' },
      { label: 'Access', value: 'Prepared for merchant & accountant review' },
      { label: 'Focus', value: 'Orderly business compliance support' },
    ],
  },
  {
    id: 'online-store',
    index: '04',
    title: 'Online Store Capabilities',
    subtitle: 'Extend your shop to nearby residents',
    description:
      'Present your store’s catalogue inside MAATA so neighbourhood customers can browse products and place orders directly.',
    practicalBenefit: 'Serve loyal local customers online without losing your shop’s independent identity.',
    previewRows: [
      { label: 'Storefront', value: 'Verified local shop profile & catalogue' },
      { label: 'Orders', value: 'Incoming order queue & customer chat' },
      { label: 'Focus', value: 'Connecting local shelves to nearby homes' },
    ],
  },
  {
    id: 'customer-tools',
    index: '05',
    title: 'Customer & Business Tools',
    subtitle: 'Everyday relationship management',
    description:
      'Keep regular customer connections, shop updates, and daily operational utilities organised within one merchant workspace.',
    practicalBenefit: 'Strengthen repeat neighbourhood trust with responsive communication.',
    previewRows: [
      { label: 'Communication', value: 'Direct chat with regular shoppers' },
      { label: 'Visibility', value: 'Share shop hours & availability updates' },
      { label: 'Focus', value: 'Long-term neighbourhood retention' },
    ],
  },
];

/**
 * Local India Community Participants (Zero fabricated coverage or user statistics)
 */
export const LOCAL_COMMUNITY_ROLES: CommunityParticipant[] = [
  {
    id: 'shops',
    label: 'Neighbourhood Shops',
    telugu: 'దుకాణాలు',
    roleSummary:
      'Provision stores, medical counters, bakeries, and everyday retailers serving their immediate streets and villages.',
    connections: ['customers', 'families', 'small-businesses', 'drivers'],
    x: 130,
    y: 88,
  },
  {
    id: 'services',
    label: 'Local Service Providers',
    telugu: 'సేవలు',
    roleSummary:
      'Electricians, plumbers, repair technicians, tutors, and skilled local professionals relied upon daily.',
    connections: ['families', 'customers', 'small-businesses'],
    x: 470,
    y: 88,
  },
  {
    id: 'drivers',
    label: 'Drivers',
    telugu: 'డ్రైవర్లు',
    roleSummary:
      'Auto, cab, and local transport captains connecting neighbourhoods, markets, and transit points.',
    connections: ['customers', 'families', 'shops'],
    x: 92,
    y: 215,
  },
  {
    id: 'workers',
    label: 'Workers',
    telugu: 'కార్మికులు',
    roleSummary:
      'Skilled and daily-wage workers finding dependable local work directly within their town or district.',
    connections: ['small-businesses', 'services', 'families'],
    x: 508,
    y: 215,
  },
  {
    id: 'customers',
    label: 'Customers',
    telugu: 'వినియోగదారులు',
    roleSummary:
      'Everyday residents seeking reliable goods, rides, services, and clear communication without friction.',
    connections: ['shops', 'services', 'drivers', 'families'],
    x: 210,
    y: 332,
  },
  {
    id: 'families',
    label: 'Families',
    telugu: 'కుటుంబాలు',
    roleSummary:
      'Households staying connected through chats, calls, community groups, and trusted local access.',
    connections: ['customers', 'shops', 'services', 'drivers', 'workers'],
    x: 300,
    y: 195,
  },
  {
    id: 'small-businesses',
    label: 'Small Businesses',
    telugu: 'చిన్న వ్యాపారాలు',
    roleSummary:
      'Independent merchants and growing enterprises using billing, stock, GST reports, and digital storefronts.',
    connections: ['shops', 'workers', 'services', 'customers'],
    x: 390,
    y: 332,
  },
];

/**
 * Newsroom Articles (Structured for future CMS integration; honest foundational / placeholder entries)
 */
export const NEWSROOM_POSTS: NewsArticle[] = [
  {
    id: 'maata-corporate-launch',
    category: 'Announcements',
    featured: true,
    dateLabel: 'Official Announcement',
    location: 'Chittoor, Andhra Pradesh',
    readTime: '3 min read',
    title: 'MAATA Technologies Launches Dedicated Corporate Website for the MAATA India Ecosystem',
    excerpt:
      'Introducing the corporate headquarters digital presence for MAATA Technologies—distinct from the live MAATA India application at maataapp.com.',
    body: [
      'MAATA Technologies has established its corporate web platform to present the company’s leadership, origins in Chittoor, product ecosystem vision, and merchant focus.',
      'Guided by Founder G. Balaji Reddy and Co-Founder & CEO G. Pavani, MAATA Technologies connects practical local market experience with disciplined product management.',
      'The live consumer and business application continues to operate independently at https://maataapp.com.',
    ],
  },
  {
    id: 'ecosystem-16-pillars',
    category: 'Product Updates',
    dateLabel: 'Product Brief',
    location: 'MAATA India',
    readTime: '4 min read',
    title: 'Inside the 16 Connected Capabilities of the MAATA Digital Ecosystem',
    excerpt:
      'How messaging, calls, rides, local services, work discovery, and MAATA Business come together in one approachable Indian platform.',
    body: [
      'Rather than forcing residents and small shopkeepers in towns and villages to juggle disconnected apps, MAATA structures everyday communication, mobility, services, and retail tools under one roof.',
      'From Chats and Voice/Video Calls to Book a Ride, Driver Captain, Find Work, and Business Tools, every capability is planned around real daily utility.',
    ],
  },
  {
    id: 'chittoor-roots',
    category: 'Company News',
    dateLabel: 'Company Note',
    location: 'Chittoor, Andhra Pradesh',
    readTime: '3 min read',
    title: 'Why Building From Chittoor Shapes Better Technology for Everyday India',
    excerpt:
      'Proximity to real neighbourhood shops, regional language expression, and everyday users keeps our engineering grounded.',
    body: [
      'When software is designed inside regional towns rather than isolated metro glass towers, everyday priorities become immediately clear.',
      'Working from Chittoor, Andhra Pradesh ensures MAATA Technologies tests ideas against real shop counter speeds, varied network conditions, and genuine community expectations.',
    ],
  },
  {
    id: 'local-shop-digital-tools',
    category: 'Articles & Insights',
    dateLabel: 'Editorial Insight',
    location: 'MAATA Business',
    readTime: '4 min read',
    title: 'From Paper Ledgers to Practical Billing, Stock & GST Clarity',
    excerpt:
      'Why neighbourhood shopkeepers need calm, straightforward business tools instead of complex enterprise software.',
    body: [
      'Neighbourhood merchants juggle customer trust, inventory restocking, billing, and seasonal GST summaries every day.',
      'MAATA Business focuses on practical counter-friendly workflows—helping shopkeepers keep orderly records while opening an online presence for nearby buyers.',
    ],
  },
  {
    id: 'word-maata-story',
    category: 'Featured Stories',
    featured: true,
    dateLabel: 'Featured Story',
    location: 'Andhra Pradesh, India',
    readTime: '3 min read',
    title: 'మాట (Maata): The Meaning of a Spoken Word in Everyday Indian Communities',
    excerpt:
      'How a single Telugu word representing speech, expression, and promise inspired the visual identity of The MAATA Connection.',
    body: [
      'In Telugu, మాట (Maata) means word, speech, or expression. Across Indian markets, a person’s word carries trust.',
      'The MAATA Connection visual language traces how one glowing spoken word expands into shared understanding and bridges local people, shops, drivers, and services.',
    ],
  },
];

/**
 * Careers Areas of Work (No unconfirmed job vacancies advertised)
 */
export const CAREER_AREAS: WorkArea[] = [
  {
    id: 'product-engineering',
    index: '01',
    area: 'Product & Software Engineering',
    description:
      'Building reliable, responsive mobile and web systems tailored for everyday devices and varied Indian connectivity.',
    focus: ['Frontend & mobile interfaces', 'Scalable backend services', 'Maps & real-time reliability'],
  },
  {
    id: 'design-research',
    index: '02',
    area: 'Design, Accessibility & Regional UX',
    description:
      'Designing intuitive, language-considerate experiences for first-time smartphone users, merchants, drivers, and families.',
    focus: ['Visual systems', 'Regional clarity & usability', 'Interactive prototyping'],
  },
  {
    id: 'business-merchant-ops',
    index: '03',
    area: 'Merchant Support & Local Operations',
    description:
      'Partnering directly with neighbourhood shopkeepers, service providers, and drivers to understand real-world workflows.',
    focus: ['Local merchant onboarding', 'Field feedback loops', 'Community coordination'],
  },
  {
    id: 'brand-comms',
    index: '04',
    area: 'Marketing, Presentations & Community Outreach',
    description:
      'Communicating MAATA’s practical value clearly across towns, districts, and emerging Indian digital communities.',
    focus: ['Product demonstrations', 'Regional storytelling', 'Community partnerships'],
  },
];
