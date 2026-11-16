import crypto from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { env } from '../config/env.ts';
import { hashPassword, isStrongPassword, writeAuditLog } from '../auth/security.ts';

const INITIAL_COMPANY_SECTIONS: Record<string, { title: string; payload: unknown }> = {
  about: {
    title: 'About MAATA Technologies',
    payload: {
      companyName: 'MAATA TECHNOLOGIES',
      publicBrand: 'MAATA India',
      tagline: 'Built in India. Designed for Indians.',
      centralConcept: 'From Local Experience to a Connected India.',
      heroSupportingText:
        'An Indian digital ecosystem bringing communication, everyday services and local businesses closer together.',
      whyMaataHeadline: 'Technology Should Understand Everyday India.',
      whyMaataBody:
        'Across Indian towns, villages, and neighbourhoods, daily life depends on real human relationships—ordinary people and families staying in touch, trusted shopkeepers opening their shutters every morning, skilled workers looking for steady work, and drivers keeping communities moving.',
    },
  },
  story: {
    title: 'Company Story',
    payload: {
      headline: 'Local Experience. Technology-Driven Execution.',
      paragraphs: [
        'MAATA Technologies is built on a complementary founder partnership rooted in Chittoor, Andhra Pradesh.',
        'Inspired by the Telugu word "మాట" (Maata — word, speech, expression), the platform turns everyday human reliability into accessible digital infrastructure.',
      ],
    },
  },
  founders: {
    title: 'Founders & Leadership',
    payload: [
      {
        id: 'balaji',
        assetId: 'founderBalaji',
        name: 'G. Balaji Reddy',
        role: 'Founder',
        originNote: 'Local Market Experience · Chittoor, Andhra Pradesh',
        bio: 'Grounded in practical local market experience, G. Balaji Reddy guides MAATA Technologies with real-world understanding of how neighbourhood shops, families, workers, and everyday commerce operate across Indian towns.',
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
        bio: 'G. Pavani leads product management, planning, working models, and operational execution at MAATA Technologies—turning everyday local insights into structured, approachable digital experiences for MAATA India.',
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
    ],
  },
  vision_mission: {
    title: 'Vision & Mission',
    payload: {
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
    },
  },
  journey: {
    title: 'Company Journey & Milestones',
    payload: [
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
          'Feature requirements and unified user flows structured across communication, rides, local services, work discovery, and MAATA Business.',
      },
      {
        id: 'maata-app',
        step: '04',
        dateLabel: 'Public Platform [Placeholder — Editable Date]',
        isPlaceholder: true,
        title: 'MAATA India Digital Platform & Corporate Web Presence',
        description:
          'Establishing maataapp.com for everyday users and businesses alongside the dedicated MAATA Technologies corporate headquarters website.',
      },
    ],
  },
  careers: {
    title: 'Careers Information',
    payload: {
      intro:
        'At MAATA Technologies, engineers, designers, and local community specialists work together to make practical digital products accessible across India.',
      futureOpportunitiesNote:
        'MAATA Technologies does not list unconfirmed or placeholder job openings. As new roles open across engineering, design, and regional community operations in Chittoor and across India, verified listings will be published here.',
      areas: [
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
      ],
    },
  },
  contact: {
    title: 'Contact Details',
    payload: {
      companyName: 'MAATA TECHNOLOGIES',
      location: 'Chittoor, Andhra Pradesh, India',
      supportEmail: 'support@maataapp.com',
      secondarySupportEmail: 'maatasupport215@gmail.com',
      appUrl: 'https://maataapp.com',
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
    },
  },
};

const INITIAL_ARTICLES = [
  {
    id: 'art-corporate-launch',
    title: 'MAATA Technologies Launches Dedicated Corporate Website for the MAATA India Ecosystem',
    slug: 'maata-technologies-corporate-website-launch',
    cover_image_url: '/src/assets/images/south_indian_town_dawn_1794846722757.jpg',
    short_summary:
      'Introducing the corporate headquarters digital presence for MAATA Technologies—distinct from the live MAATA India application at maataapp.com.',
    content:
      'MAATA Technologies has established its corporate web platform to present the company leadership, origins in Chittoor, product ecosystem vision, and merchant focus.\n\nGuided by Founder G. Balaji Reddy and Co-Founder & CEO G. Pavani, MAATA Technologies connects practical local market experience with disciplined product management.\n\nThe live consumer and business application continues to operate independently at https://maataapp.com.',
    author: 'MAATA Corporate Desk',
    category: 'Announcements',
    tags: ['MAATA Technologies', 'Chittoor', 'Corporate'],
    seo_title: 'MAATA Technologies Launches Corporate Website | MAATA India',
    seo_description:
      'Official corporate announcement introducing the MAATA Technologies headquarters website in Chittoor, Andhra Pradesh.',
    status: 'published',
  },
  {
    id: 'art-16-ecosystem-pillars',
    title: 'Inside the 16 Connected Capabilities of the MAATA Digital Ecosystem',
    slug: 'inside-16-connected-capabilities-maata-ecosystem',
    cover_image_url: '/src/assets/images/connected_commerce_craft_1794846725105.jpg',
    short_summary:
      'How messaging, calls, rides, local services, work discovery, and MAATA Business come together in one approachable Indian platform.',
    content:
      'Rather than forcing residents and small shopkeepers in towns and villages to juggle disconnected apps, MAATA structures everyday communication, mobility, services, and retail tools under one roof.\n\nFrom Chats and Voice/Video Calls to Book a Ride, Driver Captain, Find Work, and Business Tools, every capability is planned around real daily utility.',
    author: 'MAATA Product Team',
    category: 'Product Updates',
    tags: ['MAATA App', 'Ecosystem', 'MAATA Business'],
    seo_title: '16 Connected Capabilities in the MAATA Digital Ecosystem',
    seo_description:
      'Discover how MAATA India unites messaging, calls, rides, local services, and MAATA Business.',
    status: 'published',
  },
  {
    id: 'art-chittoor-roots',
    title: 'Why Building From Chittoor Shapes Better Technology for Everyday India',
    slug: 'building-from-chittoor-for-everyday-india',
    cover_image_url: '/src/assets/images/local_indian_merchant_scene_1794846723405.jpg',
    short_summary:
      'Proximity to real neighbourhood shops, regional language expression, and everyday users keeps our engineering grounded.',
    content:
      'When software is designed inside regional towns rather than isolated metro glass towers, everyday priorities become immediately clear.\n\nWorking from Chittoor, Andhra Pradesh ensures MAATA Technologies tests ideas against real shop counter speeds, varied network conditions, and genuine community expectations.',
    author: 'MAATA Engineering',
    category: 'Company News',
    tags: ['Chittoor', 'Andhra Pradesh', 'Engineering'],
    seo_title: 'Why Building From Chittoor Shapes Better Technology | MAATA',
    seo_description:
      'How regional perspective in Chittoor informs practical software design at MAATA Technologies.',
    status: 'published',
  },
  {
    id: 'art-word-maata',
    title: 'మాట (Maata): The Meaning of a Spoken Word in Everyday Indian Communities',
    slug: 'meaning-of-maata-spoken-word-indian-communities',
    cover_image_url: '/src/assets/images/local_indian_merchant_scene_1794846723405.jpg',
    short_summary:
      'How a single Telugu word representing speech, expression, and promise inspired the visual identity of The MAATA Connection.',
    content:
      'In Telugu, మాట (Maata) means word, speech, or expression. Across Indian markets, a person’s word carries trust.\n\nThe MAATA Connection visual language traces how one glowing spoken word expands into shared understanding and bridges local people, shops, drivers, and services.',
    author: 'MAATA Brand Studio',
    category: 'Featured Stories',
    tags: ['Telugu', 'Brand Story', 'The MAATA Connection'],
    seo_title: 'మాట (Maata): The Meaning Behind MAATA Technologies',
    seo_description:
      'Explore the Telugu origin of MAATA and the story behind The MAATA Connection.',
    status: 'published',
  },
];

const INITIAL_MEDIA = [
  {
    id: 'media-logo-original',
    filename: 'Maata_Parrot_App_Watermark_01d4c364.png',
    original_name: 'Original MAATA Logo',
    mime_type: 'image/png',
    url: '/assets/aistudio/Maata_Parrot_App_Watermark_01d4c364.png',
    category: 'company_logo',
    alt_text: 'MAATA Technologies — Official Original MAATA Logo',
    is_protected: 1,
  },
  {
    id: 'media-founder-balaji',
    filename: 'Professional_Portrait_with_Tilak_Accent_5b614492.png',
    original_name: 'G. Balaji Reddy Portrait',
    mime_type: 'image/png',
    url: '/assets/aistudio/Professional_Portrait_with_Tilak_Accent_5b614492.png',
    category: 'founder_photo',
    alt_text: 'G. Balaji Reddy — Founder of MAATA Technologies',
    is_protected: 1,
  },
  {
    id: 'media-founder-pavani',
    filename: 'Elegant_Teal_Corporate_Profile_Portrait_e58d5226.png',
    original_name: 'G. Pavani Portrait',
    mime_type: 'image/png',
    url: '/assets/aistudio/Elegant_Teal_Corporate_Profile_Portrait_e58d5226.png',
    category: 'founder_photo',
    alt_text: 'G. Pavani — Co-Founder & CEO of MAATA Technologies',
    is_protected: 1,
  },
  {
    id: 'media-founders-combined',
    filename: 'Maata_Technologies__Connected_India_f8d55b97.png',
    original_name: 'Combined Founders Portrait',
    mime_type: 'image/png',
    url: '/assets/aistudio/Maata_Technologies__Connected_India_f8d55b97.png',
    category: 'founder_photo',
    alt_text: 'G. Balaji Reddy and G. Pavani — Leadership of MAATA Technologies',
    is_protected: 1,
  },
  {
    id: 'media-scene-town',
    filename: 'south_indian_town_dawn_1794846722757.jpg',
    original_name: 'South Indian Town Dawn',
    mime_type: 'image/jpeg',
    url: '/src/assets/images/south_indian_town_dawn_1794846722757.jpg',
    category: 'banner',
    alt_text: 'Morning market street in an Andhra Pradesh town at sunrise',
    is_protected: 0,
  },
  {
    id: 'media-scene-merchant',
    filename: 'local_indian_merchant_scene_1794846723405.jpg',
    original_name: 'Local Indian Merchant Counter',
    mime_type: 'image/jpeg',
    url: '/src/assets/images/local_indian_merchant_scene_1794846723405.jpg',
    category: 'article_cover',
    alt_text: 'Local South Indian neighbourhood provision shopkeeper and customer',
    is_protected: 0,
  },
  {
    id: 'media-scene-craft',
    filename: 'connected_commerce_craft_1794846725105.jpg',
    original_name: 'Connected Commerce Craft',
    mime_type: 'image/jpeg',
    url: '/src/assets/images/connected_commerce_craft_1794846725105.jpg',
    category: 'product_screenshot',
    alt_text: 'Handwritten shop ledger beside a smartphone on a teakwood counter',
    is_protected: 0,
  },
];

export function seedInitialData(db: DatabaseSync): void {
  // 1. Seed Company Sections if missing
  const sectionCount = db.prepare('SELECT COUNT(*) as c FROM company_sections').get() as { c: number };
  if (sectionCount.c === 0) {
    const insertSection = db.prepare(`
      INSERT INTO company_sections (section_key, title, draft_json, published_json, status, updated_by, published_at)
      VALUES (?, ?, ?, ?, 'published', 'system-seed', datetime('now'))
    `);
    for (const [key, item] of Object.entries(INITIAL_COMPANY_SECTIONS)) {
      const jsonStr = JSON.stringify(item.payload);
      insertSection.run(key, item.title, jsonStr, jsonStr);
    }
  }

  // 2. Seed Articles if empty
  const articleCount = db.prepare('SELECT COUNT(*) as c FROM articles').get() as { c: number };
  if (articleCount.c === 0) {
    const insertArticle = db.prepare(`
      INSERT INTO articles (
        id, title, slug, cover_image_url, short_summary, content, author, category,
        tags_json, seo_title, seo_description, publish_at, status, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, 'system-seed', 'system-seed')
    `);
    for (const art of INITIAL_ARTICLES) {
      insertArticle.run(
        art.id,
        art.title,
        art.slug,
        art.cover_image_url,
        art.short_summary,
        art.content,
        art.author,
        art.category,
        JSON.stringify(art.tags),
        art.seo_title,
        art.seo_description,
        art.status
      );
    }
  }

  // 3. Seed Announcements if empty
  const announcementCount = db.prepare('SELECT COUNT(*) as c FROM announcements').get() as { c: number };
  if (announcementCount.c === 0) {
    db.prepare(`
      INSERT INTO announcements (
        id, kind, title, summary, body, image_url, is_pinned, visibility, status,
        show_as_banner, publish_at, starts_at, expires_at, created_by, updated_by
      ) VALUES (
        ?, 'company_announcement', ?, ?, ?, '', 1, 'public', 'published',
        1, datetime('now'), datetime('now', '-1 day'), NULL, 'system-seed', 'system-seed'
      )
    `).run(
      'ann-maata-platform-live',
      'MAATA India Digital Platform — Live at maataapp.com',
      'The consumer & merchant application operates independently at maataapp.com alongside this corporate headquarters site.',
      'Explore chats, local services, rides, work discovery, and MAATA Business directly on the live MAATA India application.'
    );
  }

  // 4. Seed Protected & Editorial Media Assets if core brand assets are missing
  const protectedMediaCount = db
    .prepare('SELECT COUNT(*) as c FROM media_assets WHERE is_protected = 1')
    .get() as { c: number };
  if (protectedMediaCount.c === 0) {
    const insertMedia = db.prepare(`
      INSERT OR IGNORE INTO media_assets (
        id, filename, original_name, mime_type, size_bytes, url, category, alt_text, is_protected, uploaded_by
      ) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, 'system-seed')
    `);
    for (const m of INITIAL_MEDIA) {
      insertMedia.run(
        m.id,
        m.filename,
        m.original_name,
        m.mime_type,
        m.url,
        m.category,
        m.alt_text,
        m.is_protected
      );
    }
  }

  // 5. Seed Leadership Executive Workspace starter items ONLY when empty
  const workCount = db
    .prepare('SELECT COUNT(*) as c FROM leadership_work_items')
    .get() as { c: number };
  if (workCount.c === 0) {
    const insertWork = db.prepare(`
      INSERT INTO leadership_work_items (
        id, domain, title, category, summary, owner_name, priority, status, progress_pct, target_date, notes, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'system-seed', 'system-seed')
    `);

    const starterWork = [
      [
        'lw-prod-01',
        'product',
        'Regional Telugu-First Onboarding & Merchant Store Flow',
        'MAATA App',
        'Streamlining first-time shopkeeper and resident onboarding in maataapp.com with clear bilingual guidance.',
        'G. Pavani',
        'high',
        'in_progress',
        75,
        null,
        'Coordinating feature requirements and field feedback from Chittoor pilot stores.',
      ],
      [
        'lw-prod-02',
        'product',
        'MAATA Business Billing & Stock Ledger Clarity',
        'MAATA Business',
        'Refining everyday GST invoice workflows and low-connectivity resilience for neighbourhood merchants.',
        'G. Pavani',
        'high',
        'in_review',
        85,
        null,
        'Working model reviewed with local retail feedback.',
      ],
      [
        'lw-mkt-01',
        'marketing',
        'Chittoor District Local Merchant Outreach Program',
        'Regional Outreach',
        'Structured product demonstrations and hands-on onboarding sessions for local shopkeepers and service providers.',
        'G. Balaji Reddy & G. Pavani',
        'high',
        'in_progress',
        60,
        null,
        'Includes presentation walkthroughs and Telugu promotional materials.',
      ],
      [
        'lw-mkt-02',
        'marketing',
        'MAATA India Official Social Channel Rollout',
        'Brand & Digital',
        'Coordinated updates across Instagram, LinkedIn, Facebook, YouTube, and X aligned with corporate newsroom releases.',
        'G. Pavani',
        'medium',
        'completed',
        100,
        null,
        'Official channels connected across public website and footer.',
      ],
      [
        'lw-test-01',
        'testing',
        '16-Feature Connected Ecosystem End-to-End Verification',
        'QA & Working Models',
        'End-to-end validation of Chats, Voice/Video Calls, Ride Booking, Find Work, and Local Services across budget Android handsets.',
        'G. Pavani',
        'high',
        'in_progress',
        70,
        null,
        'Testing reliability over 3G/4G switching in regional towns.',
      ],
      [
        'lw-test-02',
        'testing',
        'Driver Captain & Ride Booking Route Accuracy Check',
        'Mobility QA',
        'Field testing pickup landmark clarity and driver confirmation flow around Chittoor town corridors.',
        'G. Pavani',
        'medium',
        'planned',
        25,
        null,
        'Scheduled for next regional field check.',
      ],
    ];

    for (const row of starterWork) {
      insertWork.run(...row);
    }
  }

  const reportCount = db
    .prepare('SELECT COUNT(*) as c FROM leadership_reports')
    .get() as { c: number };
  if (reportCount.c === 0) {
    db.prepare(`
      INSERT INTO leadership_reports (
        id, title, report_type, period_label, summary, metrics_json, highlights, author_name, status, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'final', 'system-seed', 'system-seed')
    `).run(
      'rep-exec-foundation',
      'MAATA Technologies Foundation & Ecosystem Readiness Brief',
      'executive_summary',
      'Current Cycle',
      'Consolidated executive overview covering corporate platform separation, MAATA India operational focus in Chittoor, and leadership governance.',
      JSON.stringify([
        { label: 'Core Focus Region', value: 'Chittoor, AP', note: 'Primary field operations' },
        { label: 'Live Product Domain', value: 'maataapp.com', note: 'Independent product stack' },
        { label: 'Ecosystem Pillars Tracked', value: '16', note: 'Communication, services, mobility, business' },
      ]),
      '1. Corporate website & CMS kept strictly separate from live maataapp.com backend.\n2. Official communication and social channels unified under corporate governance.\n3. Local shopkeeper feedback actively guiding MAATA Business usability.',
      'G. Pavani'
    );
  }

  const docCount = db
    .prepare('SELECT COUNT(*) as c FROM leadership_documents')
    .get() as { c: number };
  if (docCount.c === 0) {
    db.prepare(`
      INSERT INTO leadership_documents (
        id, title, category, summary, content, classification, uploaded_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, 'leadership_only', 'system-seed', 'system-seed')
    `).run(
      'doc-charter-01',
      'MAATA Technologies Leadership Charter & Architecture Boundaries',
      'governance',
      'Internal leadership reference defining operational responsibilities between Founder (G. Balaji Reddy) and Co-Founder & CEO (G. Pavani), plus system separation guidelines.',
      'Founder (G. Balaji Reddy): Business vision, local market experience, investment, and development support.\n\nCo-Founder & CEO (G. Pavani): Product management, app planning and coordination, feature requirements, testing and working models, marketing and promotions, presentations, and operational execution.\n\nPlatform Boundary: The MAATA Technologies corporate website and Private Leadership Portal remain completely separate from the live MAATA India product backend at https://maataapp.com.',
    );
  }

  // 6. Optional Env-Based Super Admin Bootstrap (only when explicitly configured via env vars and zero super_admins exist)
  if (env.adminBootstrapEmail && env.adminBootstrapPassword) {
    const superAdminExists = db
      .prepare("SELECT COUNT(*) as c FROM admin_users WHERE role = 'super_admin'")
      .get() as { c: number };
    if (superAdminExists.c === 0) {
      const pwCheck = isStrongPassword(env.adminBootstrapPassword);
      if (!pwCheck.valid) {
        console.warn(`[MAATA Auth] Skipping ADMIN_BOOTSTRAP_PASSWORD: ${pwCheck.reason}`);
        return;
      }
      const userId = crypto.randomUUID();
      const bootstrapName = env.adminBootstrapName || 'MAATA Super Admin';
      const leadershipRole = /pavani/i.test(bootstrapName) ? 'ceo' : 'none';
      db.prepare(`
        INSERT INTO admin_users (id, name, email, password_hash, role, leadership_role, is_active)
        VALUES (?, ?, ?, ?, 'super_admin', ?, 1)
      `).run(
        userId,
        bootstrapName,
        env.adminBootstrapEmail,
        hashPassword(env.adminBootstrapPassword),
        leadershipRole
      );
      writeAuditLog(db, {
        actorUserId: userId,
        actorEmail: env.adminBootstrapEmail,
        actorRole: 'super_admin',
        action: 'BOOTSTRAP_SUPER_ADMIN',
        resourceType: 'admin_users',
        resourceId: userId,
      });
    }
  }
}
