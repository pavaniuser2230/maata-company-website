/**
 * Official MAATA Brand & Editorial Asset Registry
 *
 * Uses the exact four uploaded brand assets directly without redrawing,
 * regenerating, or modifying the logo or founder identities.
 */

export interface BrandAssetConfig {
  id: 'logo' | 'founderBalaji' | 'founderPavani' | 'foundersCombined';
  src: string;
  alt: string;
  objectPosition: string;
  aspectClass: string;
  fitMode: 'cover' | 'contain';
  caption: string;
}

export const BRAND_ASSETS: Record<BrandAssetConfig['id'], BrandAssetConfig> = {
  logo: {
    id: 'logo',
    src: '/assets/aistudio/Maata_Parrot_App_Watermark_01d4c364.png',
    alt: 'MAATA Technologies — Official MAATA Logo',
    objectPosition: '50% 50%',
    aspectClass: 'h-10 w-10',
    fitMode: 'contain',
    caption: 'Official MAATA Brand Mark',
  },
  founderBalaji: {
    id: 'founderBalaji',
    src: '/assets/aistudio/Professional_Portrait_with_Tilak_Accent_5b614492.png',
    alt: 'G. Balaji Reddy — Founder of MAATA Technologies',
    objectPosition: '50% 18%',
    aspectClass: 'aspect-square',
    fitMode: 'cover',
    caption: 'G. Balaji Reddy · Founder',
  },
  founderPavani: {
    id: 'founderPavani',
    src: '/assets/aistudio/Elegant_Teal_Corporate_Profile_Portrait_e58d5226.png',
    alt: 'G. Pavani — Co-Founder & Chief Executive Officer of MAATA Technologies',
    objectPosition: '50% 50%',
    aspectClass: 'aspect-square',
    fitMode: 'contain',
    caption: 'G. Pavani · Co-Founder & CEO',
  },
  foundersCombined: {
    id: 'foundersCombined',
    src: '/assets/aistudio/Maata_Technologies__Connected_India_f8d55b97.png',
    alt: 'G. Balaji Reddy and G. Pavani — Founders of MAATA Technologies',
    objectPosition: '50% 50%',
    aspectClass: 'aspect-[3/2]',
    fitMode: 'cover',
    caption: 'G. Balaji Reddy (Founder) & G. Pavani (Co-Founder & CEO) · MAATA Technologies',
  },
};

export const EDITORIAL_SCENES = {
  communityHero: {
    src: '/src/assets/images/hero_indian_community_1794853935648.jpg',
    alt: 'Everyday Indian community members—shopkeepers, students, families, delivery riders, doctors, and skilled workers—in a South Indian town market street',
    caption: 'Everyday Indian communities connected across towns, neighbourhoods, and local services.',
  },
  companyHeroCommunity: {
    src: '/src/assets/images/company_hero_shopkeeper_community_1794855078159.jpg',
    alt: 'South Indian local shopkeeper smiling across his store counter while serving customers and community members',
    caption: 'From local shopkeeper experience to a connected Indian service ecosystem.',
  },
  townDawn: {
    src: '/src/assets/images/south_indian_town_dawn_1794846722757.jpg',
    alt: 'Morning market street in an Andhra Pradesh town at sunrise',
    caption: 'Fig. 1 — Everyday morning commerce along a South Indian regional market street.',
  },
  merchantCounter: {
    src: '/src/assets/images/local_indian_merchant_scene_1794846723405.jpg',
    alt: 'Local South Indian neighbourhood provision shopkeeper and customer at the store counter',
    caption: 'Fig. 2 — Neighbourhood shopkeepers remain the anchor of everyday Indian community trust.',
  },
  commerceCraft: {
    src: '/src/assets/images/connected_commerce_craft_1794846725105.jpg',
    alt: 'Handwritten cloth-bound shop ledger beside a smartphone on a teakwood counter',
    caption: 'Fig. 3 — Bridging real shopkeeper workflows with practical digital business tools.',
  },
} as const;

export interface FounderGallerySlide {
  id: string;
  url: string;
  original_name?: string;
  alt_text: string;
  caption: string;
  focal_position: string;
  display_order: number;
}

export const FOUNDER_GALLERY_FALLBACK: FounderGallerySlide[] = [
  {
    id: 'media-gallery-01',
    url: '/assets/aistudio/image_6fa97355.png',
    original_name: 'Founders Leadership Studio Portrait',
    alt_text:
      'G. Balaji Reddy (Founder) and G. Pavani (Co-Founder & CEO) in executive attire at the MAATA Technologies desk',
    caption:
      'G. Balaji Reddy (Founder) & G. Pavani (Co-Founder & CEO) — From Local Experience to a Connected India.',
    focal_position: '60% 24%',
    display_order: 1,
  },
  {
    id: 'media-gallery-02',
    url: '/assets/aistudio/image_b7c2d33f.png',
    original_name: 'Founders Traditional Attire Desk Portrait',
    alt_text:
      'G. Balaji Reddy in cream kurta and shawl alongside G. Pavani in red kurti with MAATA laptop and mug',
    caption: 'A local business experience paired with a young technology vision — Together, MAATA.',
    focal_position: '50% 28%',
    display_order: 2,
  },
  {
    id: 'media-gallery-03',
    url: '/assets/aistudio/Introducing_Maata_s_Leadership_Team_b9ca1410.png',
    original_name: 'Introducing Maata Leadership Team Showcase',
    alt_text:
      'Introducing the father-daughter leadership team behind MAATA: G. Balaji Reddy (Founder) and G. Pavani (Co-Founder & CEO)',
    caption:
      'A father-daughter team united by a shared vision to build a people-first Indian digital ecosystem.',
    focal_position: '50% 46%',
    display_order: 3,
  },
  {
    id: 'media-gallery-04',
    url: '/assets/aistudio/image_4e120cb0.png',
    original_name: 'Founders Chittoor Workspace Collaboration',
    alt_text:
      'G. Balaji Reddy and G. Pavani seated behind the MAATA laptop in the Chittoor workspace',
    caption:
      'Built for Indian communities — practical everyday collaboration from Chittoor, Andhra Pradesh.',
    focal_position: '50% 24%',
    display_order: 4,
  },
];

