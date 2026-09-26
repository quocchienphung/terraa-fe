import type {
  FooterColumn,
  MapLocation,
  MenuLink,
  NewsItem,
  Project,
  Solution,
  Testimonial,
} from "@/types/anode";

const IMG = "/images/reference";

export const HERO = {
  intro:
    "Utility-scale storage hardware and the dispatch software that decides when it earns — from interconnection to first revenue in 14 months.",
  label: "Home",
  headline: "We build grid-scale storage. We also run it.",
  practice:
    "Containerized LFP storage and bidirectional power conversion, engineered as a single certified unit and built for twenty-year assets.",
  process:
    "Deployed on a twelve to sixteen month schedule and dispatched from day one on our own software, with fleet availability published every year.",
  video: `${IMG}/hero-battery-storage.mp4`,
  poster: `${IMG}/hero-battery-storage-poster.webp`,
};

export const TICKER_EYEBROW = "POWERING THE GRID FOR OPERATORS ACROSS NORTH AMERICA";

export const WHAT_WE_DO = {
  label: "What We Do",
  statement:
    "We build, deploy, and run grid-scale battery storage — one team from the interconnection study through to the megawatt-hours a site bids each morning.",
  ctas: [
    { label: "Our Story", href: "/about", sweep: "brand" as const },
    { label: "Our Solutions", href: "/solutions/plp", sweep: "ink" as const },
  ],
  supporting:
    "Owning the hardware and the dispatch software means the asset that gets built is the asset that gets bid — no seam between what is installed and what earns.",
};

export const SOLUTIONS: Solution[] = [
  {
    number: "01",
    title: "Systems",
    intro: "Battery storage hardware, built for twenty-year assets.",
    capabilities: [
      { label: "LFP Storage", icon: "lfp" },
      { label: "Bidirectional PCS", icon: "pcs" },
      { label: "UL 9540A Enclosure", icon: "enclosure" },
    ],
    description:
      "Containerized LFP and bidirectional power conversion, tested at the enclosure rather than the cell — so what you certify is what you operate.",
    cta: { label: "Explore Systems", href: "/solutions/systems" },
    image: { src: `${IMG}/solution-systems.webp`, width: 2093, height: 2400 },
  },
  {
    number: "02",
    title: "Deployment",
    intro:
      "Three ways to work with us: complete storage systems, deployment from site survey to energization, and the software that runs the fleet.",
    capabilities: [
      { label: "Engineering & Studies", icon: "engineering" },
      { label: "Installation", icon: "installation" },
      { label: "Commissioning", icon: "commissioning" },
    ],
    description:
      "We carry the project from interconnection study through energization, which is how first revenue lands in fourteen months.",
    cta: { label: "Explore Deployment", href: "/solutions/deployment" },
    image: { src: `${IMG}/solution-deployment.webp`, width: 2400, height: 1600 },
  },
  {
    number: "03",
    title: "Software",
    intro: "Monitoring and performance across every site.",
    capabilities: [
      { label: "Site Monitoring", icon: "monitoring" },
      { label: "Performance", icon: "performance" },
      { label: "State of Health", icon: "health" },
    ],
    description:
      "Forecasts price, bids into day-ahead and real-time, and tracks degradation block by block. Runs on our hardware or yours.",
    cta: { label: "Explore Software", href: "/solutions/software" },
    image: { src: `${IMG}/solution-software.webp`, width: 2400, height: 2145 },
  },
];

export const MAP = {
  label: "Global Footprint",
  title: "Where We Operate",
  /** Perspective poster: SSR placeholder and WebGL fallback. Not a map projection. */
  image: `${IMG}/globe-night.webp`,
  /**
   * Location selected on load (Rotterdam). The globe opens on Eurasia like the poster, so the
   * first selection is one that is actually on screen; the Texas sites rotate in afterwards.
   */
  initialIndex: 6,
  kinds: {
    site: "Operating site",
    office: "Office",
    dev: "In development",
  },
};

/**
 * Coordinates: offices use city-centre values (rounded, gazetteer-level). Project sites are
 * demo content without published locations, so each uses a representative point for the
 * region named in `place` and is flagged `approximate` — the pin marks the region only.
 */
export const MAP_LOCATIONS: MapLocation[] = [
  {
    geo: { lat: 31.9, lon: -102.1, precision: "approximate" },
    kind: "site",
    name: "Bell Junction",
    place: "West Texas · ERCOT",
    description:
      "Standalone storage dispatching into ERCOT West. Containerized LFP, energized and operated by Anode from first dispatch.",
  },
  {
    geo: { lat: 29.8, lon: -95.0, precision: "approximate" },
    kind: "site",
    name: "Cedar Bayou",
    place: "Gulf Coast, Texas · ERCOT",
    description:
      "Fourteen months from interconnection study to first dispatch. The enclosure Anode certified is the enclosure Anode operates.",
  },
  {
    geo: { lat: 30.3, lon: -104.0, precision: "approximate" },
    kind: "site",
    name: "Marfa Flats",
    place: "Far West Texas · ERCOT",
    description:
      "Merchant storage running day-ahead co-optimization on Anode dispatch software, with degradation tracked block by block.",
  },
  {
    geo: { lat: 35.2, lon: -101.8, precision: "approximate" },
    kind: "site",
    name: "Salt Fork",
    place: "Texas Panhandle · ERCOT",
    description:
      "Completed its first augmentation cycle with no measured capacity shortfall against the contracted curve.",
  },
  {
    geo: { lat: 32.78, lon: -96.8, precision: "city" },
    kind: "office",
    name: "Dallas HQ",
    place: "Dallas, Texas",
    description:
      "Headquarters — development, engineering, and the operations desk that dispatches the fleet.",
  },
  {
    geo: { lat: 30.27, lon: -97.74, precision: "city" },
    kind: "office",
    name: "Austin",
    place: "Austin, Texas",
    description: "Software and market operations — the team behind Argus and the bidding stack.",
  },
  {
    geo: { lat: 51.92, lon: 4.48, precision: "approximate" },
    kind: "dev",
    name: "Rotterdam",
    place: "Netherlands · TenneT",
    description: "Grid-services storage in development with a European utility partner.",
  },
  {
    geo: { lat: -34.93, lon: 138.6, precision: "approximate" },
    kind: "dev",
    name: "Adelaide",
    place: "South Australia · NEM",
    description:
      "Utility-scale storage in development in one of the world’s fastest-moving storage markets.",
  },
  {
    geo: { lat: -33.45, lon: -70.67, precision: "approximate" },
    kind: "dev",
    name: "Santiago",
    place: "Chile · SEN",
    description: "Storage co-located with solar in development in the Chilean national grid.",
  },
];

export const PROJECTS_SECTION = {
  label: "Selected Work",
  title: "Featured Projects",
  cycleMs: 4500,
};

export const PROJECTS: Project[] = [
  {
    year: "2025",
    title: "Bell Junction",
    slug: "bell-junction",
    mw: "120",
    mwh: "480",
    months: "13",
    description:
      "Hybrid site pairing existing generation with storage under a single point of interconnection.",
    image: { src: `${IMG}/project-bell-junction.webp`, width: 2048, height: 2294 },
  },
  {
    year: "2026",
    title: "Cedar Bayou",
    slug: "cedar-bayou",
    mw: "200",
    mwh: "800",
    months: "14",
    description:
      "Four-hour storage co-located with an existing solar interconnect, bid into ERCOT day-ahead from month one.",
    image: { src: `${IMG}/project-cedar-bayou.jpg`, width: 2048, height: 1534 },
  },
  {
    year: "2025",
    title: "Marfa Flats",
    slug: "marfa-flats",
    mw: "150",
    mwh: "600",
    months: "16",
    description: "Standalone storage on a constrained node, cycling twice daily against congestion.",
    image: { src: `${IMG}/project-marfa-flats.webp`, width: 2048, height: 1365 },
  },
  {
    year: "2024",
    title: "Salt Fork",
    slug: "salt-fork",
    mw: "90",
    mwh: "360",
    months: "15",
    description:
      "First fleet site to complete a full augmentation cycle with no measured capacity shortfall.",
    image: { src: `${IMG}/project-salt-fork.webp`, width: 2048, height: 1365 },
  },
];

export const TESTIMONIALS_SECTION = {
  kicker: "What our partners say",
  cycleMs: 7000,
};

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Anode took Cedar Bayou from interconnection study to first dispatch in fourteen months, and the enclosure we certified is the enclosure we operate.",
    name: "Dana Whitfield",
    role: "VP Development at Cedar Bayou Partners",
    logo: {
      src: `${IMG}/testimonial-logo-cedar-bayou.svg`,
      width: 59,
      height: 36,
      alt: "VP Development at Cedar Bayou Partners",
    },
  },
  {
    quote:
      "Their dispatch software paid for itself in the first quarter — day-ahead bids we could never have run by hand, and degradation tracked block by block.",
    name: "Marcus Feld",
    role: "Asset Manager at Marfa Flats Storage",
    logo: {
      src: `${IMG}/testimonial-logo-marfa-flats.svg`,
      width: 97,
      height: 50,
      alt: "Asset Manager at Marfa Flats Storage",
    },
  },
  {
    quote:
      "The augmentation cycle at Salt Fork closed with no measured capacity shortfall. That is the first time a vendor has hit that number for us.",
    name: "Priya Raghunathan",
    role: "Head of Operations at Salt Fork Energy",
    logo: {
      src: `${IMG}/testimonial-logo-salt-fork.svg`,
      width: 58,
      height: 40,
      alt: "Head of Operations at Salt Fork Energy",
    },
  },
];

export const NEWS_SECTION = {
  label: "News",
  title: "Get the latest updates on press releases and other announcements",
};

export const NEWS: NewsItem[] = [
  {
    date: "08.06.2026",
    title: "Anode reaches 1.4 GWh of contracted storage across ERCOT",
    href: "/news/anode-1-4-gwh-contracted",
    image: { src: `${IMG}/news-desert-road.webp`, width: 1024, height: 683 },
  },
  {
    date: "08.02.2026",
    title: "Cedar Bayou energizes fourteen months after interconnection",
    href: "/news/cedar-bayou-energised",
    image: { src: `${IMG}/news-dam.webp`, width: 1024, height: 768 },
  },
  {
    date: "07.27.2026",
    title: "Anode publishes its first annual fleet availability report",
    href: "/news/first-fleet-availability-report",
    image: { src: `${IMG}/solution-systems.webp`, width: 2093, height: 2400 },
  },
  {
    date: "07.27.2026",
    title: "Dispatch adds day-ahead co-optimization across every site",
    href: "/news/dispatch-day-ahead",
    image: { src: `${IMG}/solution-deployment.webp`, width: 2400, height: 1600 },
  },
];

export const CTA = {
  title: "Ready to build?",
  button: { label: "Start a Project", href: "/contact" },
};

export const FOOTER = {
  title: "Talk with an expert at Anode",
  placeholder: "Your email",
  submit: "Sign Up",
  copyright: "©2026 Anode Energy",
  rights: "All Rights Reserved.",
  credit: { label: "Website by Flowit.Supply", href: "https://flowit.supply" },
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Cookie Policy", href: "/" },
  ],
  wordmark: `${IMG}/footer-wordmark.svg`,
  vectorBg: `${IMG}/footer-vector-bg.png`,
};

export const FOOTER_COLUMNS: FooterColumn[][] = [
  [
    {
      title: "Company",
      links: [
        { label: "Home", href: "/" },
        { label: "About", href: "/about" },
        { label: "Solutions", href: "/solutions/plp" },
        { label: "Projects", href: "/projects" },
        { label: "Careers", href: "/careers" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      title: "Solutions",
      links: [
        { label: "Systems", href: "/solutions/systems" },
        { label: "Deployment", href: "/solutions/deployment" },
        { label: "Software", href: "/solutions/software" },
      ],
    },
  ],
  [
    {
      title: "Media",
      links: [
        { label: "Newsroom", href: "/news/filters/all" },
        { label: "Announcements", href: "/news/filters/announcement" },
        { label: "Editorial", href: "/news/filters/editorial" },
        { label: "Shareholder Letters", href: "/news/filters/shareholder-letter" },
      ],
    },
    {
      title: "Social",
      links: [
        { label: "LinkedIn", href: "https://www.linkedin.com", external: true },
        { label: "X (Twitter)", href: "https://x.com", external: true },
      ],
    },
  ],
];

export const NAV = {
  logo: `${IMG}/nav-logo.svg`,
  contact: { label: "Contact Us", href: "/contact" },
};

export const MENU = {
  primary: [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Solutions", href: "/solutions/plp", count: 3 },
    { label: "Projects", href: "/projects", count: 4 },
  ] satisfies MenuLink[],
  secondary: [
    { label: "Newsroom", href: "/news/filters/all" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
  ] satisfies MenuLink[],
  follow: [
    { label: "Instagram", href: "https://instagram.com" },
    { label: "x", href: "https://x.com" },
    { label: "Facebook", href: "https://facebook.com" },
    { label: "Linkedin", href: "https://www.linkedin.com" },
  ] satisfies MenuLink[],
  hq: ["2100 McKinney Ave", "Dallas, TX 75201"],
  clock: { city: "DALLAS", timeZone: "America/Chicago" },
};
