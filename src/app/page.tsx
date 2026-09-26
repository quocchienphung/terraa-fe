import { Header } from "@/components/sites/anodeenergy-framer-website-108d0ac2/root-8a5edab2/Header";
import { Hero } from "@/components/sites/anodeenergy-framer-website-108d0ac2/root-8a5edab2/Hero";
import { ClientTicker } from "@/components/sites/anodeenergy-framer-website-108d0ac2/root-8a5edab2/ClientTicker";
import { WhatWeDo } from "@/components/sites/anodeenergy-framer-website-108d0ac2/root-8a5edab2/WhatWeDo";
import { Solutions } from "@/components/sites/anodeenergy-framer-website-108d0ac2/root-8a5edab2/Solutions";
import { GlobalFootprint } from "@/components/sites/anodeenergy-framer-website-108d0ac2/root-8a5edab2/GlobalFootprint";
import { FeaturedProjects } from "@/components/sites/anodeenergy-framer-website-108d0ac2/root-8a5edab2/FeaturedProjects";
import { Testimonials } from "@/components/sites/anodeenergy-framer-website-108d0ac2/root-8a5edab2/Testimonials";
import { News } from "@/components/sites/anodeenergy-framer-website-108d0ac2/root-8a5edab2/News";
import { CTA } from "@/components/sites/anodeenergy-framer-website-108d0ac2/root-8a5edab2/CTA";
import { Footer } from "@/components/sites/anodeenergy-framer-website-108d0ac2/root-8a5edab2/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="relative bg-white">
        <Hero />
        <ClientTicker />
        <WhatWeDo />
        <Solutions />
        <GlobalFootprint />
        <FeaturedProjects />
        <Testimonials />
        <News />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
