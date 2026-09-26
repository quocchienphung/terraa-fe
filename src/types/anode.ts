export type MarkerKind = "site" | "office" | "dev";

/**
 * How much a coordinate can be trusted:
 * - `city`: city-centre coordinate of the named office city (gazetteer value, 0.01°).
 * - `approximate`: representative point for the region named in `place`; the real site
 *   location is not published, so the pin marks the region, not the asset.
 */
export type GeoPrecision = "city" | "approximate";

export interface GeoPoint {
  lat: number;
  lon: number;
  precision: GeoPrecision;
}

export interface MapLocation {
  /** `null` = location unknown: listed and selectable, but no pin is drawn. */
  geo: GeoPoint | null;
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
