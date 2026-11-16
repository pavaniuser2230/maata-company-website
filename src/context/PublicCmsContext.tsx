import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  FOUNDERS as DEFAULT_FOUNDERS,
  JOURNEY_TIMELINE as DEFAULT_JOURNEY,
  VISION_MISSION as DEFAULT_VISION_MISSION,
  CAREER_AREAS as DEFAULT_CAREER_AREAS,
  type FounderProfile,
  type JourneyMilestone,
  type WorkArea,
} from '../data/corporateContent';
import { COMPANY_INFO } from '../theme/tokens';
import { FOUNDER_GALLERY_FALLBACK, type FounderGallerySlide } from '../config/brandAssets';
import {
  publicApi,
  type CmsAnnouncement,
  type CmsArticle,
  type CmsTranslationsBootstrap,
} from '../services/cmsApi';
import { useLanguage } from './LanguageContext';
import { EN_DICT } from '../i18n/locales/en';

interface PublicCmsState {
  loading: boolean;
  companySections: {
    about: {
      companyName: string;
      publicBrand: string;
      tagline: string;
      centralConcept: string;
      heroSupportingText: string;
      whyMaataHeadline: string;
      whyMaataBody: string;
    };
    story: {
      headline: string;
      paragraphs: string[];
    };
    founders: FounderProfile[];
    vision_mission: {
      vision: { label: string; statement: string };
      mission: { label: string; statement: string };
    };
    journey: JourneyMilestone[];
    careers: {
      intro: string;
      futureOpportunitiesNote: string;
      areas: WorkArea[];
    };
    contact: {
      companyName: string;
      location: string;
      supportEmail: string;
      secondarySupportEmail?: string;
      appUrl: string;
      socialLinks: { label: string; href: string; handle: string }[];
    };
  };
  articles: CmsArticle[];
  announcements: CmsAnnouncement[];
  banners: CmsAnnouncement[];
  founderGallery: FounderGallerySlide[];
  refreshPublicCms: () => Promise<void>;
}

const DEFAULT_STATE: PublicCmsState['companySections'] = {
  about: {
    companyName: COMPANY_INFO.companyName,
    publicBrand: COMPANY_INFO.publicBrand,
    tagline: COMPANY_INFO.tagline,
    centralConcept: COMPANY_INFO.centralConcept,
    heroSupportingText:
      'An Indian digital ecosystem bringing communication, everyday services and local businesses closer together.',
    whyMaataHeadline: 'Technology Should Understand Everyday India.',
    whyMaataBody:
      'Across Indian towns, villages, and neighbourhoods, daily life depends on real human relationships—ordinary people and families staying in touch, trusted shopkeepers opening their shutters every morning, skilled workers looking for steady work, and drivers keeping communities moving.',
  },
  story: {
    headline: 'Local Experience. Technology-Driven Execution.',
    paragraphs: [
      'MAATA Technologies is built on a complementary founder partnership rooted in Chittoor, Andhra Pradesh.',
      'Inspired by the Telugu word "మాట" (Maata — word, speech, expression), the platform turns everyday human reliability into accessible digital infrastructure.',
    ],
  },
  founders: DEFAULT_FOUNDERS,
  vision_mission: {
    vision: { ...DEFAULT_VISION_MISSION.vision },
    mission: { ...DEFAULT_VISION_MISSION.mission },
  },
  journey: DEFAULT_JOURNEY,
  careers: {
    intro:
      'At MAATA Technologies, engineers, designers, and local community specialists work together to make practical digital products accessible across India.',
    futureOpportunitiesNote:
      'MAATA Technologies does not list unconfirmed or placeholder job openings. As new roles open across engineering, design, and regional community operations in Chittoor and across India, verified listings will be published here.',
    areas: DEFAULT_CAREER_AREAS,
  },
  contact: {
    companyName: COMPANY_INFO.companyName,
    location: COMPANY_INFO.location,
    supportEmail: COMPANY_INFO.supportEmail,
    secondarySupportEmail: COMPANY_INFO.secondarySupportEmail,
    appUrl: COMPANY_INFO.appUrl,
    socialLinks: [...COMPANY_INFO.socialLinks],
  },
};

const EMPTY_TRANSLATIONS: CmsTranslationsBootstrap = {
  companySections: {},
  articles: {},
  announcements: {},
  mediaAssets: {},
};

interface RawCmsBootstrap {
  companySections: PublicCmsState['companySections'];
  articles: CmsArticle[];
  announcements: CmsAnnouncement[];
  banners: CmsAnnouncement[];
  founderGallery: FounderGallerySlide[];
  translations: CmsTranslationsBootstrap;
}

function nonEmpty(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function sameSeedText(rawValue: unknown, seededEnValue: string): boolean {
  if (typeof rawValue !== 'string') return false;
  return rawValue.trim().toLowerCase() === seededEnValue.trim().toLowerCase();
}

function resolveCuratedField(
  rawValue: unknown,
  seededEnValue: string,
  dictValue: string
): string {
  const base = typeof rawValue === 'string' && rawValue.trim().length > 0 ? rawValue : seededEnValue;
  return sameSeedText(base, seededEnValue) ? dictValue : base;
}

const PublicCmsContext = createContext<PublicCmsState>({
  loading: false,
  companySections: DEFAULT_STATE,
  articles: [],
  announcements: [],
  banners: [],
  founderGallery: FOUNDER_GALLERY_FALLBACK,
  refreshPublicCms: async () => {},
});

export const PublicCmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language, dict } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState<RawCmsBootstrap>({
    companySections: DEFAULT_STATE,
    articles: [],
    announcements: [],
    banners: [],
    founderGallery: FOUNDER_GALLERY_FALLBACK,
    translations: EMPTY_TRANSLATIONS,
  });

  const refreshPublicCms = useCallback(async () => {
    try {
      const data = await publicApi.getBootstrap(language);
      setRawData((prev) => ({
        companySections: {
          about: data.companySections.about || prev.companySections.about,
          story: data.companySections.story || prev.companySections.story,
          founders: Array.isArray(data.companySections.founders)
            ? data.companySections.founders
            : prev.companySections.founders,
          vision_mission: data.companySections.vision_mission || prev.companySections.vision_mission,
          journey: Array.isArray(data.companySections.journey)
            ? data.companySections.journey
            : prev.companySections.journey,
          careers: data.companySections.careers || prev.companySections.careers,
          contact: data.companySections.contact || prev.companySections.contact,
        },
        articles: data.articles || [],
        announcements: data.announcements || [],
        banners: data.banners || [],
        founderGallery:
          Array.isArray(data.founderGallery) && data.founderGallery.length > 0
            ? data.founderGallery.map((item, idx) => ({
                id: item.id,
                url: item.url,
                original_name: item.original_name,
                alt_text: item.alt_text,
                caption: item.caption || '',
                focal_position: item.focal_position || '50% 25%',
                display_order: typeof item.display_order === 'number' ? item.display_order : idx + 1,
              }))
            : prev.founderGallery,
        translations: data.translations || EMPTY_TRANSLATIONS,
      }));
    } catch {
      // Keep clean default copy if backend is temporarily unreachable
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    void refreshPublicCms();
  }, [refreshPublicCms]);

  const localizedState = useMemo(() => {
    if (language === 'en') {
      return {
        companySections: rawData.companySections,
        articles: rawData.articles,
        announcements: rawData.announcements,
        banners: rawData.banners,
        founderGallery: rawData.founderGallery,
      };
    }

    const trSections = rawData.translations.companySections || {};
    const rawSec = rawData.companySections;

    // 1. About section
    const trAbout = trSections.about || {};
    const localizedAbout = {
      ...rawSec.about,
      tagline: nonEmpty(trAbout.tagline, rawSec.about.tagline),
      centralConcept: nonEmpty(trAbout.centralConcept, rawSec.about.centralConcept),
      heroSupportingText: nonEmpty(
        trAbout.heroSupportingText,
        resolveCuratedField(
          rawSec.about.heroSupportingText,
          DEFAULT_STATE.about.heroSupportingText,
          dict.hero.supportingText
        )
      ),
      whyMaataHeadline: nonEmpty(
        trAbout.whyMaataHeadline,
        resolveCuratedField(
          rawSec.about.whyMaataHeadline,
          DEFAULT_STATE.about.whyMaataHeadline,
          dict.home.whyMaataHeadline
        )
      ),
      whyMaataBody: nonEmpty(
        trAbout.whyMaataBody,
        resolveCuratedField(
          rawSec.about.whyMaataBody,
          DEFAULT_STATE.about.whyMaataBody,
          dict.home.whyMaataBody1
        )
      ),
    };

    // 2. Story section
    const trStory = trSections.story || {};
    const rawParagraphs = Array.isArray(rawSec.story.paragraphs)
      ? rawSec.story.paragraphs
      : DEFAULT_STATE.story.paragraphs;
    const localizedStory = {
      headline: nonEmpty(
        trStory.headline,
        resolveCuratedField(
          rawSec.story.headline,
          DEFAULT_STATE.story.headline,
          dict.home.storyHeadline
        )
      ),
      paragraphs:
        Array.isArray(trStory.paragraphs) && trStory.paragraphs.some((p: unknown) => typeof p === 'string' && p.trim())
          ? rawParagraphs.map((p, idx) => nonEmpty(trStory.paragraphs[idx], p))
          : rawParagraphs.map((p, idx) => {
              const seededEn = DEFAULT_STATE.story.paragraphs[idx];
              const dictVal = dict.home.storyParagraphs[idx];
              return seededEn && dictVal ? resolveCuratedField(p, seededEn, dictVal) : p;
            }),
    };

    // 3. Founders section
    const trFoundersList: any[] = Array.isArray(trSections.founders?.items)
      ? trSections.founders.items
      : Array.isArray(trSections.founders)
      ? trSections.founders
      : [];
    const localizedFounders = rawSec.founders.map((f, idx) => {
      const trItem =
        trFoundersList.find((item) => item && item.id === f.id) || trFoundersList[idx] || {};
      const seededEn = DEFAULT_FOUNDERS.find((item) => item.id === f.id);
      const dictFounder =
        f.id === 'balaji' ? dict.founders.balaji : f.id === 'pavani' ? dict.founders.pavani : null;

      return {
        ...f,
        role: nonEmpty(
          trItem.role,
          seededEn && dictFounder
            ? resolveCuratedField(f.role, seededEn.role, dictFounder.role)
            : f.role
        ),
        originNote: nonEmpty(
          trItem.originNote,
          seededEn && dictFounder
            ? resolveCuratedField(f.originNote, seededEn.originNote, dictFounder.originNote)
            : f.originNote
        ),
        bio: nonEmpty(
          trItem.bio,
          seededEn && dictFounder
            ? resolveCuratedField(f.bio, seededEn.bio, dictFounder.bio)
            : f.bio
        ),
        perspectiveQuote: nonEmpty(
          trItem.perspectiveQuote,
          seededEn && dictFounder
            ? resolveCuratedField(
                f.perspectiveQuote,
                seededEn.perspectiveQuote,
                dictFounder.perspectiveQuote
              )
            : f.perspectiveQuote
        ),
        responsibilities:
          Array.isArray(trItem.responsibilities) && trItem.responsibilities.length > 0
            ? trItem.responsibilities.map((r: unknown, rIdx: number) =>
                nonEmpty(r, f.responsibilities[rIdx] || '')
              )
            : f.responsibilities.map((r, rIdx) => {
                const enResp = seededEn?.responsibilities[rIdx];
                const dictResp = dictFounder?.responsibilities[rIdx];
                return enResp && dictResp ? resolveCuratedField(r, enResp, dictResp) : r;
              }),
      };
    });

    // 4. Vision & Mission
    const trVm = trSections.vision_mission || {};
    const localizedVisionMission = {
      vision: {
        label: nonEmpty(
          trVm.vision?.label,
          resolveCuratedField(
            rawSec.vision_mission.vision.label,
            DEFAULT_VISION_MISSION.vision.label,
            dict.visionMission.visionLabel
          )
        ),
        statement: nonEmpty(
          trVm.vision?.statement,
          resolveCuratedField(
            rawSec.vision_mission.vision.statement,
            DEFAULT_VISION_MISSION.vision.statement,
            dict.visionMission.visionStatement
          )
        ),
      },
      mission: {
        label: nonEmpty(
          trVm.mission?.label,
          resolveCuratedField(
            rawSec.vision_mission.mission.label,
            DEFAULT_VISION_MISSION.mission.label,
            dict.visionMission.missionLabel
          )
        ),
        statement: nonEmpty(
          trVm.mission?.statement,
          resolveCuratedField(
            rawSec.vision_mission.mission.statement,
            DEFAULT_VISION_MISSION.mission.statement,
            dict.visionMission.missionStatement
          )
        ),
      },
    };

    // 5. Journey milestones
    const trJourneyList: any[] = Array.isArray(trSections.journey?.items)
      ? trSections.journey.items
      : Array.isArray(trSections.journey)
      ? trSections.journey
      : [];
    const localizedJourney = rawSec.journey.map((m, idx) => {
      const trItem =
        trJourneyList.find((item) => item && item.id === m.id) || trJourneyList[idx] || {};
      const seededEn = DEFAULT_JOURNEY.find((item) => item.id === m.id);
      const dictMilestone =
        dict.journey.milestones[m.id as keyof typeof dict.journey.milestones];

      return {
        ...m,
        dateLabel: nonEmpty(
          trItem.dateLabel,
          seededEn && dictMilestone
            ? resolveCuratedField(m.dateLabel, seededEn.dateLabel, dictMilestone.dateLabel)
            : m.dateLabel
        ),
        title: nonEmpty(
          trItem.title,
          seededEn && dictMilestone
            ? resolveCuratedField(m.title, seededEn.title, dictMilestone.title)
            : m.title
        ),
        description: nonEmpty(
          trItem.description,
          seededEn && dictMilestone
            ? resolveCuratedField(m.description, seededEn.description, dictMilestone.description)
            : m.description
        ),
      };
    });

    // 6. Careers section
    const trCareers = trSections.careers || {};
    const trAreasList: any[] = Array.isArray(trCareers.areas) ? trCareers.areas : [];
    const localizedCareers = {
      intro: nonEmpty(
        trCareers.intro,
        resolveCuratedField(
          rawSec.careers.intro,
          DEFAULT_STATE.careers.intro,
          dict.careers.heroDescription
        )
      ),
      futureOpportunitiesNote: nonEmpty(
        trCareers.futureOpportunitiesNote,
        resolveCuratedField(
          rawSec.careers.futureOpportunitiesNote,
          DEFAULT_STATE.careers.futureOpportunitiesNote,
          dict.careers.futureOpportunitiesNote
        )
      ),
      areas: rawSec.careers.areas.map((area, idx) => {
        const trArea =
          trAreasList.find((a) => a && a.id === area.id) || trAreasList[idx] || {};
        const seededEn = DEFAULT_CAREER_AREAS.find((a) => a.id === area.id);
        const dictArea = dict.careers.areas[area.id];
        return {
          ...area,
          area: nonEmpty(
            trArea.area,
            seededEn && dictArea
              ? resolveCuratedField(area.area, seededEn.area, dictArea.area)
              : area.area
          ),
          description: nonEmpty(
            trArea.description,
            seededEn && dictArea
              ? resolveCuratedField(area.description, seededEn.description, dictArea.description)
              : area.description
          ),
          focus:
            Array.isArray(trArea.focus) && trArea.focus.length > 0
              ? trArea.focus.map((fItem: unknown, fIdx: number) =>
                  nonEmpty(fItem, area.focus[fIdx] || '')
                )
              : area.focus.map((fItem, fIdx) => {
                  const enFocus = seededEn?.focus[fIdx];
                  const dictFocus = dictArea?.focus[fIdx];
                  return enFocus && dictFocus
                    ? resolveCuratedField(fItem, enFocus, dictFocus)
                    : fItem;
                }),
        };
      }),
    };

    // 7. Articles
    const trArticles = rawData.translations.articles || {};
    const localizedArticles = rawData.articles.map((art) => {
      const tr = trArticles[art.id] || {};
      const enSeeded = EN_DICT.newsroom.seededArticles[art.id];
      const dictSeeded = dict.newsroom.seededArticles[art.id];
      const isUneditedSeeded =
        Boolean(enSeeded && dictSeeded) && sameSeedText(art.title, enSeeded.title);

      return {
        ...art,
        title: nonEmpty(tr.title, isUneditedSeeded ? dictSeeded.title : art.title),
        short_summary: nonEmpty(
          tr.shortSummary ?? tr.short_summary,
          isUneditedSeeded && sameSeedText(art.short_summary, enSeeded.short_summary)
            ? dictSeeded.short_summary
            : art.short_summary
        ),
        content: nonEmpty(
          tr.content,
          isUneditedSeeded && sameSeedText(art.content, enSeeded.content)
            ? dictSeeded.content
            : art.content
        ),
        author: nonEmpty(
          tr.author,
          isUneditedSeeded && sameSeedText(art.author, enSeeded.author)
            ? dictSeeded.author
            : art.author
        ),
        seo_title: nonEmpty(tr.seoTitle ?? tr.seo_title, art.seo_title),
        seo_description: nonEmpty(tr.seoDescription ?? tr.seo_description, art.seo_description),
        tags:
          Array.isArray(tr.tags) && tr.tags.length > 0
            ? tr.tags.map(String)
            : isUneditedSeeded
            ? dictSeeded.tags
            : art.tags,
      };
    });

    // 8. Announcements & Banners
    const trAnnouncements = rawData.translations.announcements || {};
    const localizeAnnouncement = (ann: CmsAnnouncement): CmsAnnouncement => {
      const tr = trAnnouncements[ann.id] || {};
      const isSeededBanner =
        ann.id === 'ann-maata-platform-live' ||
        sameSeedText(ann.title, EN_DICT.banner.seededAnnouncement.title);

      return {
        ...ann,
        title: nonEmpty(
          tr.title,
          isSeededBanner ? dict.banner.seededAnnouncement.title : ann.title
        ),
        summary: nonEmpty(
          tr.summary,
          isSeededBanner && sameSeedText(ann.summary, EN_DICT.banner.seededAnnouncement.summary)
            ? dict.banner.seededAnnouncement.summary
            : ann.summary
        ),
        body: nonEmpty(
          tr.body,
          isSeededBanner && sameSeedText(ann.body, EN_DICT.banner.seededAnnouncement.body)
            ? dict.banner.seededAnnouncement.body
            : ann.body
        ),
      };
    };

    const localizedAnnouncements = rawData.announcements.map(localizeAnnouncement);
    const localizedBanners = rawData.banners.map(localizeAnnouncement);

    // 9. Founder Gallery Slides
    const trMedia = rawData.translations.mediaAssets || {};
    const localizedGallery = rawData.founderGallery.map((slide) => {
      const tr = trMedia[slide.id] || {};
      const enDefault = EN_DICT.gallery.defaultSlides[slide.id];
      const dictDefault = dict.gallery.defaultSlides[slide.id];

      return {
        ...slide,
        caption: nonEmpty(
          tr.caption,
          enDefault && dictDefault
            ? resolveCuratedField(slide.caption, enDefault.caption, dictDefault.caption)
            : slide.caption
        ),
        alt_text: nonEmpty(
          tr.altText ?? tr.alt_text,
          enDefault && dictDefault
            ? resolveCuratedField(slide.alt_text, enDefault.alt, dictDefault.alt)
            : slide.alt_text
        ),
      };
    });

    return {
      companySections: {
        about: localizedAbout,
        story: localizedStory,
        founders: localizedFounders,
        vision_mission: localizedVisionMission,
        journey: localizedJourney,
        careers: localizedCareers,
        contact: rawSec.contact,
      },
      articles: localizedArticles,
      announcements: localizedAnnouncements,
      banners: localizedBanners,
      founderGallery: localizedGallery,
    };
  }, [dict, language, rawData]);

  return (
    <PublicCmsContext.Provider
      value={{
        loading,
        companySections: localizedState.companySections,
        articles: localizedState.articles,
        announcements: localizedState.announcements,
        banners: localizedState.banners,
        founderGallery: localizedState.founderGallery,
        refreshPublicCms,
      }}
    >
      {children}
    </PublicCmsContext.Provider>
  );
};

export function usePublicCms() {
  return useContext(PublicCmsContext);
}
