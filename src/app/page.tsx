import { Header } from "@/components/sites/farmio-framer-website-711ac6e6/shared/Header";
import { Faq } from "@/components/sites/farmio-framer-website-711ac6e6/shared/Faq";
import { CtaFooter } from "@/components/sites/farmio-framer-website-711ac6e6/shared/CtaFooter";
import { Hero } from "@/components/sites/farmio-framer-website-711ac6e6/root-8a5edab2/Hero";
import { LogoTicker } from "@/components/sites/farmio-framer-website-711ac6e6/root-8a5edab2/LogoTicker";
import { About } from "@/components/sites/farmio-framer-website-711ac6e6/root-8a5edab2/About";
import { Solutions } from "@/components/sites/farmio-framer-website-711ac6e6/root-8a5edab2/Solutions";
import { Services } from "@/components/sites/farmio-framer-website-711ac6e6/root-8a5edab2/Services";
import { Features } from "@/components/sites/farmio-framer-website-711ac6e6/root-8a5edab2/Features";
import { WorldGlobe } from "@/components/sites/farmio-framer-website-711ac6e6/root-8a5edab2/WorldGlobe";
import { HowItWorks } from "@/components/sites/farmio-framer-website-711ac6e6/root-8a5edab2/HowItWorks";
import { Gallery } from "@/components/sites/farmio-framer-website-711ac6e6/root-8a5edab2/Gallery";
import { Team } from "@/components/sites/farmio-framer-website-711ac6e6/root-8a5edab2/Team";
import { Testimonials } from "@/components/sites/farmio-framer-website-711ac6e6/root-8a5edab2/Testimonials";

/**
 * Farmio homepage (https://farmio.framer.website/). Two retained sections from the previous site
 * are integrated: the logo ticker (after the hero) and the WebGL Earth (after Features).
 */
export default function Home() {
  return (
    <>
      <Header />
      <main className="relative bg-white">
        <Hero />
        <LogoTicker />
        <About />
        <Solutions />
        <Services />
        <Features />
        <WorldGlobe />
        <HowItWorks />
        <Gallery />
        <Team />
        <Testimonials />
        <Faq />
      </main>
      <CtaFooter />
    </>
  );
}
