export type MarkerKind = "site" | "office" | "dev";

export interface MapLocation {
  left: number;
  top: number;
  kind: MarkerKind;
  name: string;
  place: string;
  description: string;
}

export interface Capability {
  label: string;
  icon: "lfp" | "pcs" | "enclosure" | "engineering" | "installation" | "commissioning" | "monitoring" | "performance" | "health";
}

export interface Solution {
  number: string;
  title: string;
  intro: string;
  capabilities: Capability[];
  description: string;
  cta: { label: string; href: string };
  image: { src: string; width: number; height: number };
}

export interface Project {
  year: string;
  title: string;
  slug: string;
  mw: string;
  mwh: string;
  months: string;
  description: string;
  image: { src: string; width: number; height: number };
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  logo: { src: string; width: number; height: number; alt: string };
}

export interface NewsItem {
  date: string;
  title: string;
  href: string;
  image: { src: string; width: number; height: number };
}

export interface FooterColumn {
  title: string;
  links: { label: string; href: string; external?: boolean }[];
}

export interface MenuLink {
  label: string;
  href: string;
  count?: number;
}
