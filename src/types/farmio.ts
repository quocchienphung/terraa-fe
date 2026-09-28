export interface FarmioImage {
  src: string;
  width: number;
  height: number;
  alt: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface Stat {
  value: string;
  label: string;
}

export interface SolutionCard {
  title: string;
  body: string;
  tags: [string, string];
  image: FarmioImage;
  /** Desktop card height (px): the three cards step up 363 → 445 → 712. */
  desktopHeight: number;
}

export interface ServiceItem {
  title: string;
  body: string;
  image: FarmioImage;
  background: FarmioImage;
}

export interface ImpactStat {
  value: string;
  body: string;
  icon: string;
}

export interface Step {
  step: string;
  title: string;
  body: string;
}

export interface TeamMember {
  name: string;
  role: string;
  image: FarmioImage;
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  image: FarmioImage;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FooterColumn {
  title: string;
  links: (NavLink & { external?: boolean })[];
}
