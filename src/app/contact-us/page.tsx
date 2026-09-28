import type { Metadata } from "next";
import { Header } from "@/components/sites/farmio-framer-website-711ac6e6/shared/Header";
import { Faq } from "@/components/sites/farmio-framer-website-711ac6e6/shared/Faq";
import { CtaFooter } from "@/components/sites/farmio-framer-website-711ac6e6/shared/CtaFooter";
import { ContactSection } from "@/components/sites/farmio-framer-website-711ac6e6/contact-us-0353b788/ContactSection";

export const metadata: Metadata = {
  title: "Contact us — Farmio",
  description: "Get expert guidance and support for smarter, more productive farming.",
};

/** Reference /contact-us: contact block, then the shared FAQ and CTA/footer. */
export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="relative bg-white">
        <ContactSection />
        <Faq />
      </main>
      <CtaFooter />
    </>
  );
}
