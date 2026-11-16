export interface TranslationDictionary {
  meta: {
    siteName: string;
    home: { title: string; description: string };
    company: { title: string; description: string };
    app: { title: string; description: string };
    technology: { title: string; description: string };
    news: { title: string; description: string };
    careers: { title: string; description: string };
    contact: { title: string; description: string };
    privacy: { title: string; description: string };
    terms: { title: string; description: string };
  };
  a11y: {
    primaryNav: string;
    mobileNav: string;
    homeLogoAria: string;
    openMenu: string;
    closeMenu: string;
    toggleSubmenu: string;
    expandSection: string;
    languageSelectorLabel: string;
    languageMenuLabel: string;
    opensInNewTab: string;
    followOnSocial: string;
    connectOnSocial: string;
    openMaataAppSite: string;
    privateLeadershipAccess: string;
  };
  nav: {
    home: string;
    company: string;
    maataApp: string;
    technology: string;
    newsroom: string;
    careers: string;
    contactUs: string;
    exploreAppCta: string;
    subitems: {
      whyMaata: { label: string; description: string };
      foundersLeadership: { label: string; description: string };
      visionMission: { label: string; description: string };
      companyJourney: { label: string; description: string };
      ecosystem16: { label: string; description: string };
      maataBusiness: { label: string; description: string };
      localIndiaNetwork: { label: string; description: string };
    };
  };
  banner: {
    regionLabel: string;
    details: string;
    dismiss: string;
    seededAnnouncement: {
      title: string;
      summary: string;
      body: string;
    };
  };
  hero: {
    sectionAria: string;
    corporateIdentity: string;
    location: string;
    headlineBrand: string;
    headlineItalic: string;
    supportingText: string;
    exploreCompanyCta: string;
    discoverMaataCta: string;
    everydayConnectionPrefix: string;
    mobileFallbackCaption: string;
    imageAlt: string;
    nodes: {
      chat: { label: string; detail: string };
      voice: { label: string; detail: string };
      shopping: { label: string; detail: string };
      jobs: { label: string; detail: string };
      services: { label: string; detail: string };
      maps: { label: string; detail: string };
      communities: { label: string; detail: string };
    };
  };
  companyHeroVisual: {
    captionSuffix: string;
    imageAlt: string;
    nodes: {
      businesses: { label: string; subtitle: string };
      communication: { label: string; subtitle: string };
      services: { label: string; subtitle: string };
      community: { label: string; subtitle: string };
    };
  };
  home: {
    whyMaataKicker: string;
    whyMaataAccent: string;
    whyMaataHeadline: string;
    whyMaataBody1: string;
    whyMaataBody2: string;
    bridgeIllustrationAria: string;
    bridgeNodes: {
      families: string;
      shopkeepers: string;
      workers: string;
      drivers: string;
      communities: string;
    };
    townDawnAlt: string;
    townDawnCaption: string;
    merchantCounterAlt: string;
    merchantCounterCaption: string;
    foundersCombinedAlt: string;
    foundersCombinedCaption: string;
    foundersStoryKicker: string;
    storyHeadline: string;
    storyParagraphs: [string, string];
    exploreLeadershipCta: string;
    ecosystemKicker: string;
    ecosystemTitle: string;
    ecosystemSerifAccent: string;
    ecosystemDescription: string;
    openMaataAppCta: string;
    businessKicker: string;
    businessTitle: string;
    businessSerifAccent: string;
    businessDescription: string;
    localIndiaKicker: string;
    localIndiaAccent: string;
    localIndiaTitle: string;
    localIndiaSerifAccent: string;
    localIndiaDescription: string;
    visionKicker: string;
    visionTitle: string;
    visionSerifAccent: string;
    journeyKicker: string;
    journeyTitle: string;
    journeySerifAccent: string;
    journeyDescription: string;
    newsroomKicker: string;
    newsroomTitle: string;
    newsroomSerifAccent: string;
    openFullNewsroomCta: string;
    careersKicker: string;
    careersTitle: string;
    careersSerifAccent: string;
    careersDescription: string;
    contactKicker: string;
    contactTitle: string;
    contactSerifAccent: string;
    contactDescription: string;
    headquartersLabel: string;
    officialEmailLabel: string;
    officialSocialLabel: string;
    existingAppLabel: string;
  };
  companyPage: {
    heroEyebrowSuffix: string;
    heroHeadlineItalic: string;
    heroSupportingText: string;
    whyMaataKicker: string;
    partnershipKicker: string;
    partnershipTitle: string;
    partnershipSerifAccent: string;
    partnershipSummary: string;
    journeyKicker: string;
    journeyTitle: string;
    journeySerifAccent: string;
    exploreAppCta: string;
  };
  founders: {
    keyResponsibilities: string;
    balaji: {
      role: string;
      originNote: string;
      bio: string;
      perspectiveQuote: string;
      responsibilities: string[];
    };
    pavani: {
      role: string;
      originNote: string;
      bio: string;
      perspectiveQuote: string;
      responsibilities: string[];
    };
  };
  visionMission: {
    visionLabel: string;
    visionStatement: string;
    missionLabel: string;
    missionStatement: string;
  };
  journey: {
    milestoneLabel: string;
    editablePlaceholder: string;
    milestones: {
      origin: { dateLabel: string; title: string; description: string };
      partnership: { dateLabel: string; title: string; description: string };
      'ecosystem-design': { dateLabel: string; title: string; description: string };
      'maata-app': { dateLabel: string; title: string; description: string };
    };
  };
  gallery: {
    eyebrow: string;
    heading: string;
    subline: string;
    carouselAria: string;
    momentsLabel: string;
    prevPhotoAria: string;
    nextPhotoAria: string;
    slidesTabAria: string;
    showPhotoAria: string;
    pauseSlideshowAria: string;
    resumeSlideshowAria: string;
    defaultSlides: Record<string, { caption: string; alt: string }>;
  };
  appPage: {
    heroEyebrow: string;
    heroTitle: string;
    heroSerifAccent: string;
    heroDescription: string;
    visitAppCta: string;
    businessKicker: string;
    businessTitle: string;
    businessSerifAccent: string;
    localIndiaKicker: string;
    localIndiaTitle: string;
    localIndiaSerifAccent: string;
  };
  ecosystem: {
    categoryTablistAria: string;
    categories: {
      All: string;
      Communication: string;
      'Mobility & Services': string;
      'Commerce & Business': string;
      'Trust & Utility': string;
    };
    featurePrefix: string;
    interactivePreview: string;
    visualWidgets: {
      chatIncoming: string;
      chatReply: string;
      voiceReady: string;
      directCall: string;
      statusItems: [string, string, string];
      shortVideo: string;
      regionalCreators: string;
      groupNames: [string, string, string];
      activeLabel: string;
      maataAiTitle: string;
      maataAiBody: string;
      pickupLabel: string;
      routeReady: string;
      destinationLabel: string;
      driverModeTitle: string;
      driverModeSub: string;
      readyBadge: string;
      servicesList: [string, string, string, string];
      findWorkTitle: string;
      findWorkSub: string;
      hireWorkersTitle: string;
      hireWorkersSub: string;
      localStoreTitle: string;
      directOrder: string;
      localStoreSub: string;
      merchantStorefront: string;
      merchantStorefrontSub: string;
      businessToolsList: [string, string, string];
      regionalMapTitle: string;
      regionalMapSub: string;
      privacyTitle: string;
      protectedBadge: string;
      privacySub: string;
      settingsCoinsTitle: string;
      settingsCoinsSub: string;
    };
    features: Record<
      string,
      {
        title: string;
        shortTag: string;
        description: string;
        highlightNote: string;
        previewHeadline: string;
        previewSubline: string;
        previewItems: [string, string, string];
        actionLabel: string;
      }
    >;
  };
  business: {
    commerceCraftAlt: string;
    commerceCraftCaption: string;
    cardHeadline: string;
    cardBody: string;
    exploreBusinessCta: string;
    tablistAria: string;
    moduleLabelPrefix: string;
    interfacePreview: string;
    practicalValueLabel: string;
    modules: Record<
      string,
      {
        title: string;
        subtitle: string;
        description: string;
        practicalBenefit: string;
        previewRows: { label: string; value: string }[];
      }
    >;
  };
  localIndia: {
    mapHeader: string;
    mapInstruction: string;
    mapAria: string;
    participantLabel: string;
    connectedWithinMaata: string;
    inspectAriaPrefix: string;
    roles: Record<
      string,
      {
        label: string;
        nativeScript: string;
        roleSummary: string;
      }
    >;
  };
  technology: {
    heroEyebrow: string;
    heroTitle: string;
    heroSerifAccent: string;
    heroDescription: string;
    explore16Cta: string;
    visitAppCta: string;
    foundationsKicker: string;
    foundationsTitle: string;
    foundationsSerifAccent: string;
    pillars: {
      index: string;
      title: string;
      description: string;
    }[];
    separationKicker: string;
    separationTitle: string;
    separationBody: string;
    taglineBadge: string;
    canvas: {
      title: string;
      narrativeSubtitle: string;
      spokenWordSvg: string;
      connectedIndiaSvg: string;
      tablistAria: string;
      networkNodes: {
        shops: string;
        people: string;
        services: string;
        towns: string;
      };
      stages: {
        id: number;
        index: string;
        label: string;
        nativeAccent: string;
        title: string;
        description: string;
      }[];
    };
  };
  newsroom: {
    heroEyebrowPrefix: string;
    heroTitlePrefix: string;
    heroSerifAccent: string;
    heroDescription: string;
    announcementsSectionLabel: string;
    pinnedLabel: string;
    announcementKinds: {
      company_announcement: string;
      product_update: string;
      new_feature: string;
      service_notification: string;
      important_notice: string;
    };
    categoryTablistAria: string;
    categories: {
      All: string;
      Announcements: string;
      'Product Updates': string;
      'Company News': string;
      'Articles & Insights': string;
      'Featured Stories': string;
    };
    searchPlaceholder: string;
    searchAria: string;
    publishedFallback: string;
    topicsLabel: string;
    readStory: string;
    collapseStory: string;
    readFullDispatch: string;
    closeDispatch: string;
    emptyTitle: string;
    emptyDescription: string;
    resetFilters: string;
    seededArticles: Record<
      string,
      {
        title: string;
        short_summary: string;
        content: string;
        author: string;
        tags: string[];
      }
    >;
  };
  careers: {
    heroEyebrowPrefix: string;
    heroTitlePrefix: string;
    heroSerifAccent: string;
    heroDescription: string;
    futureOpportunitiesLabel: string;
    futureOpportunitiesNote: string;
    formTitle: string;
    locationBadge: string;
    fullNameLabel: string;
    fullNamePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    areaLabel: string;
    introLabel: string;
    introPlaceholder: string;
    directDeskPrefix: string;
    submitCta: string;
    submittingCta: string;
    successTitle: string;
    successBodyPrefix: string;
    successRefLabel: string;
    submitAnotherCta: string;
    validation: {
      fullName: string;
      email: string;
      intro: string;
      submitError: string;
    };
    areas: Record<
      string,
      {
        area: string;
        description: string;
        focus: string[];
      }
    >;
  };
  contact: {
    heroEyebrowPrefix: string;
    heroTitlePrefix: string;
    heroSerifAccent: string;
    heroDescription: string;
    directChannelsKicker: string;
    headquartersTitle: string;
    officialEmailTitle: string;
    officialSocialTitle: string;
    usingAppTitle: string;
    usingAppPrefix: string;
    openMaataDomainAria: string;
    formTablistAria: string;
    fullNameLabel: string;
    fullNamePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    messageLabel: string;
    receivedSuffix: string;
    successBodyPrefix: string;
    referenceIdLabel: string;
    submitAnotherCta: string;
    submittingCta: string;
    submitPrefix: string;
    validation: {
      name: string;
      email: string;
      orgRequiredPrefix: string;
      message: string;
      submitError: string;
    };
    tabs: {
      general: {
        label: string;
        heading: string;
        orgLabel: string;
        orgPlaceholder: string;
        messagePlaceholder: string;
      };
      business: {
        label: string;
        heading: string;
        orgLabel: string;
        orgPlaceholder: string;
        messagePlaceholder: string;
      };
      partnership: {
        label: string;
        heading: string;
        orgLabel: string;
        orgPlaceholder: string;
        messagePlaceholder: string;
      };
      feedback: {
        label: string;
        heading: string;
        orgLabel: string;
        orgPlaceholder: string;
        messagePlaceholder: string;
      };
    };
  };
  stayConnected: {
    kickerPrefix: string;
    headingLead: string;
    headingAccent: string;
    subtitle: string;
    officialEmailTitle: string;
    officialSocialTitle: string;
    officialAccountsBadge: string;
    openPlatformAria: string;
  };
  legal: {
    kickerPrefix: string;
    appliesToPrefix: string;
    privacyTitle: string;
    termsTitle: string;
    privacy: {
      s1Title: string;
      s1BodyPre: string;
      s1BodyPost: string;
      s2Title: string;
      s2BodyPre: string;
      s2Or: string;
      s3Title: string;
      s3BodyPre: string;
      s3Or: string;
    };
    terms: {
      s1Title: string;
      s1Body: string;
      s2Title: string;
      s2Body: string;
      s3Title: string;
      s3BodyPre: string;
      s3BodyMid: string;
      s3Or: string;
    };
  };
  footer: {
    connectLabel: string;
    connectSubtitle: string;
    companyDescriptionPrefix: string;
    companyDescriptionMid: string;
    companyDescriptionSuffix: string;
    locationLabel: string;
    officialEmailTitle: string;
    companyNavTitle: string;
    productNavTitle: string;
    governanceNavTitle: string;
    links: {
      whyMaataStory: string;
      foundersLeadership: string;
      visionMission: string;
      companyJourney: string;
      newsroom: string;
      careers: string;
      contactUs: string;
      maataIndiaApp: string;
      ecosystem16: string;
      maataBusiness: string;
      localIndiaNetwork: string;
      technology: string;
      privacyPolicy: string;
      termsConditions: string;
      supportDesk: string;
      alternateSupport: string;
    };
    copyrightSuffix: string;
    centralConcept: string;
  };
}
