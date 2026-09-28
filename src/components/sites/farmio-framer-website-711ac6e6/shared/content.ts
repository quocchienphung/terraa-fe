import type {
  FaqItem,
  FarmioImage,
  FooterColumn,
  ImpactStat,
  NavLink,
  ServiceItem,
  SolutionCard,
  Stat,
  Step,
  TeamMember,
  Testimonial,
} from "@/types/farmio";

/**
 * Farmio copy and media, verbatim from https://farmio.framer.website/ (captured 2026-09-28).
 * Source typos ("Ger started", "Receive ar to smart…") are kept on purpose so the clone can be
 * compared 1:1; fix them here when the copy is customised.
 */

export const ASSETS = "/sites/farmio-framer-website-711ac6e6/shared";
const IMG = `${ASSETS}/images`;

const img = (file: string, width: number, height: number, alt: string): FarmioImage => ({ src: `${IMG}/${file}`, width, height, alt });

export const LOGO = { src: `${IMG}/logo.svg`, width: 135, height: 44, alt: "Farmio" };

/** Section anchors; absolute (`/#…`) so they also work from /viewroom and /contact-us. */
export const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "/#home" },
  { label: "About us", href: "/#about" },
  { label: "Services", href: "/#service" },
  { label: "Gallery", href: "/#gallery" },
  { label: "Testimonials", href: "/#testimonial" },
];

/** Not in the reference: the entry point to the retained 3D viewer. */
export const VIEWROOM_LINK: NavLink = { label: "Viewroom", href: "/viewroom" };

export const CONTACT_HREF = "/contact-us";

export const HERO = {
  tag: "Smart farming solutions",
  title: "Innovative Technology for Agricultural Growth",
  media: {
    video: `${ASSETS}/videos/farming-in-motion.mp4`,
    title: "Farming in Motion",
    body: "Real-time insights driving smarter decisions.",
  },
  body: "Farmio delivers smart farming solutions to improve productivity and promote sustainable agricultural growth.",
  cta: "Ger started",
  image: img("hero-field.webp", 2880, 1600, ""),
};

export const ABOUT = {
  tag: "About Us",
  title: "Powering the future of agriculture through innovation powering the future of agriculture",
  stats: [
    { value: "12+", label: "Years of experience" },
    { value: "235K+", label: "Acres Improved" },
    { value: "421K+", label: "Farmer around world" },
    { value: "$12B+", label: "Agricultural product" },
  ] satisfies Stat[],
};

export const SOLUTIONS = {
  tag: "Our solutions",
  title: "One platform complete agriculture solutions",
  cta: "Contact us",
  cards: [
    {
      title: "Precision farming solutions",
      body: "Use advanced technology to monitor crops and maximize yield with confidence.",
      tags: ["Data insights", "Smart Monitoring"],
      image: img("solution-precision.webp", 900, 1139, "Aerial view of a green crop field with a single tree"),
      desktopHeight: 363,
    },
    {
      title: "Farm management system",
      body: "Plan, track, and manage every farming activity effortlessly from one simple digital platform.",
      tags: ["Time Efficiency", "Digital Control"],
      image: img("solution-management.webp", 900, 1139, "Combine harvester working a wheat field at dusk"),
      desktopHeight: 445,
    },
    {
      title: "Sustainable agriculture services",
      body: "Improve soil health, save resources, and grow responsibly with eco-friendly practices.",
      tags: ["Sustainability", "Smart Practices"],
      image: img("solution-sustainable.webp", 850, 1532, "Hands holding a mound of dark soil"),
      desktopHeight: 712,
    },
  ] satisfies SolutionCard[],
};

export const SERVICES = {
  tag: "Our services",
  title: "Advanced Services for Modern Agriculture",
  hint: "[ Keep Scrolling ]",
  items: [
    {
      title: "Agriculture consulting",
      body: "Smart, sustainable farming guidance tailored to your needs.",
      image: img("service-1.webp", 1400, 1031, "Tractor spraying a green field at sunrise"),
      background: img("service-1-bg.webp", 1440, 1083, ""),
    },
    {
      title: "Agri-Technology integration",
      body: "Implementing smart tools and IoT-driven dashboards for real-time farming.",
      image: img("service-2.webp", 1400, 1031, "Tractor seeding a dry field"),
      background: img("service-2-bg.webp", 2160, 1625, ""),
    },
    {
      title: "Farm management services",
      body: "Comprehensive farm planning, monitoring, and performance reporting for maximum efficiency.",
      image: img("service-3.webp", 1400, 1031, "Grain pouring into a trailer during harvest"),
      background: img("service-3-bg.webp", 2160, 1625, ""),
    },
    {
      title: "Supply chain & market access",
      body: "Helping farmers connect with buyers, suppliers, and global agriculture markets seamlessly.",
      image: img("service-4.webp", 1400, 1031, "Aerial view of a tractor spraying crop rows"),
      background: img("service-4-bg.webp", 2160, 1625, ""),
    },
    {
      title: "Training & support",
      body: "Farmer education programs, workshops, and 24/7 technical support for continuous growth.",
      image: img("service-5.webp", 1400, 1031, "Two farmers shaking hands in a cornfield at sunset"),
      background: img("service-5-bg.webp", 1440, 1083, ""),
    },
  ] satisfies ServiceItem[],
};

export const FEATURES = {
  tag: "Features",
  title: "Driving Global Impact via Sustainable Agriculture",
  body: "At Farmio, we help farmers adopt smart and sustainable practices that improve crop quality, protect natural resources.",
  stats: [
    {
      value: "60%",
      body: "Our end-to-end agriculture solutions empower farmers and agribusinesses with integrated technology",
      icon: `${ASSETS}/icons/feature-growth.svg`,
    },
    {
      value: "55%",
      body: "Sustainable methods ensuring long-term growth, stronger harvests, and resilient farming systems",
      icon: `${ASSETS}/icons/feature-tools.svg`,
    },
  ] satisfies ImpactStat[],
  image: img("features-roots.webp", 1420, 1131, "Hands lifting a seedling with its roots from a planter"),
};

export const HOW_IT_WORKS = {
  tag: "How it works",
  title: "Sustainable Change, Global Impact",
  steps: [
    { step: "Step 01", title: "Create your account to start farming smarter", body: "Sign up on Farmio and easily set up your farm profile in just a few minutes." },
    { step: "Step 02", title: "Add farm details for personalized insights", body: "Enter crop types, land size, and location to get personalized insights." },
    { step: "Step 03", title: "Start optimizing your farm for better yields", body: "Receive ar to smart recommendations and manage your farm digitally." },
  ] satisfies Step[],
};

/** Four columns: [top, bottom] tiles; the third column is one tall image. */
export const GALLERY = {
  tag: "Our gallery",
  title: "Inside our farming world",
  columns: [
    [img("gallery-1.webp", 800, 711, "Rows of leafy crops"), img("gallery-2.webp", 720, 862, "Worker holding harvested lettuce in a greenhouse")],
    [img("gallery-3.webp", 800, 958, "Farmer raking between vegetable rows"), img("gallery-4.webp", 800, 711, "Peppers ripening in a greenhouse")],
    [img("gallery-5.webp", 800, 1664, "Farmers harvesting pumpkins in an autumn field")],
    [img("gallery-6.webp", 800, 711, "Potted plants in a nursery"), img("gallery-7.webp", 800, 958, "Seedling beds inside a polytunnel")],
  ] satisfies FarmioImage[][],
};

export const TEAM = {
  tag: "Our team",
  title: "Our team members",
  members: [
    { name: "Sarah Wilson", role: "Chief Executive Officer (CEO)", image: img("team-sarah-wilson.webp", 900, 1129, "Portrait of Sarah Wilson") },
    { name: "Michael Brown", role: "Head of Agricultural", image: img("team-michael-brown.webp", 900, 1129, "Portrait of Michael Brown") },
    { name: "John Carter", role: "Chief Technology Officer", image: img("team-john-carter.webp", 900, 1129, "Portrait of John Carter") },
  ] satisfies TeamMember[],
};

export const TESTIMONIALS = {
  tag: "Testimonials",
  title: "What farmers say about farmio",
  body: "Real experiences from farmers who trust Farmio to improve their farms and harvests.",
  items: [
    {
      quote: "“Managing my entire farm from one platform has changed the way I work. Farmio is a real game-changer.”",
      name: "John Miller",
      role: "Crop Producer, Texas",
      image: img("testimonial-john-miller.webp", 800, 746, "John Miller in a field"),
    },
    {
      quote: "“Farmio helped me reduce fertilizer waste and improve soil quality. My profits have increased every season.”",
      name: "Hasan Ali",
      role: "Rice Farmer, Bangladesh",
      image: img("testimonial-hasan-ali.webp", 624, 582, "Hasan Ali among his crops"),
    },
    {
      quote: "Since using Farmio, my crop planning has become easier and more accurate. I save time, reduce waste, and get better yields.",
      name: "Rahim Ahmed",
      role: "Vegetable Farmer, USA",
      image: img("testimonial-rahim-ahmed.webp", 624, 582, "Rahim Ahmed holding a potted plant"),
    },
    {
      quote: "“Farmio’s smart insights helped me improve soil health and increase production without increasing costs.”",
      name: "Amina Khatun",
      role: "Smallholder Farmer, India",
      image: img("testimonial-amina-khatun.webp", 624, 582, "Amina Khatun tending plants"),
    },
  ] satisfies Testimonial[],
};

export const FAQ = {
  tag: "Faqs",
  title: "Got questions? We’ve got answers",
  image: img("faq-drone.webp", 1296, 1296, "Drone spraying a cornfield"),
  items: [
    {
      question: "What is Farmio?",
      answer:
        "Farmio is a digital agriculture platform providing smart farming solutions, agri-technology services, and sustainable farming support to help farmers increase productivity and reduce costs.",
    },
    {
      question: "Who can use Farmio services?",
      answer: "Farmio empowers farmers with smart farming technologies that enable better decision-making for land, crops, and resource management.",
    },
    {
      question: "Is Farmio available worldwide?",
      answer: "Through advanced digital tools and data-driven insights, Farmio helps farmers optimize yields, minimize risks, and improve overall farm efficiency.",
    },
    {
      question: "Does Farmio support sustainable farming?",
      answer: "Farmio promotes sustainable farming practices by reducing waste, supporting eco-friendly agriculture, and ensuring long-term productivity.",
    },
    {
      question: "How can I get started with Farmio?",
      answer: "Designed with farmers in mind, Farmio delivers reliable technology and expert support to make farming smarter, easier, and more profitable.",
    },
    {
      question: "What if I’m not satisfied with the Farmio?",
      answer:
        "Farmio is a digital agriculture platform that provides smart farming solutions and agri-technology services to help farmers increase productivity and reduce operational costs.",
    },
  ] satisfies FaqItem[],
};

export const CTA = {
  tag: "Join us",
  title: "Ready to transform your farming with smart technology?",
  cta: "Ger started",
  image: img("cta-field.webp", 1440, 869, ""),
};

export const FOOTER = {
  blurb: "Transforming agriculture through smart, sustainable innovation.",
  email: "info@farmio.com",
  copyright: "© 2026 Farmio. All Rights Reserved.",
  columns: [
    {
      title: "Quick links",
      links: [
        { label: "Home", href: "/#home" },
        { label: "About us", href: "/#about" },
        { label: "Our solutions", href: "/#our-solutions" },
        { label: "Our services", href: "/#service" },
      ],
    },
    {
      title: "Navigation",
      links: [
        { label: "Our team", href: "/#team" },
        { label: "Testimonial", href: "/#testimonial" },
        { label: "Faqs", href: "/#faq-section" },
        { label: "Contact us", href: CONTACT_HREF },
      ],
    },
    {
      title: "Social Handle",
      links: [
        { label: "Facebook", href: "https://facebook.com", external: true },
        { label: "Instagram", href: "https://Instagram.com", external: true },
        { label: "Threads", href: "https://threads.com", external: true },
        { label: "Pinterest", href: "https://pinterest.com", external: true },
      ],
    },
  ] satisfies FooterColumn[],
};

export const CONTACT = {
  tag: "Contact us",
  title: "Let’s talk about your farming needs",
  body: "Get expert guidance and support for smarter, more productive farming.",
  phone: "+123456789",
  email: "info@farmio.com",
  formTitle: "Get in touch with us",
  submit: "Send your message",
};
