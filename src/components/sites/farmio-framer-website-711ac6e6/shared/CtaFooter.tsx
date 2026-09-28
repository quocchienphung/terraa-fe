import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CONTACT_HREF, CTA, FOOTER, LOGO } from "./content";
import { PillButton } from "./PillButton";
import { SectionTag } from "./SectionTag";
import { WordReveal } from "./WordReveal";

function FooterLink({ href, label, external, className }: { href: string; label: string; external?: boolean; className?: string }) {
  const cls = cn("fm-underline relative inline-block fm-p18 text-farm-body no-underline transition-colors duration-300 hover:text-farm-ink focus-visible:text-farm-ink focus-visible:outline-none", className);
  const line = <span aria-hidden className="fm-line absolute left-0 top-[27.8px] h-px bg-farm-ink" />;
  return external || href.startsWith("mailto:") ? (
    <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={cls}>
      {label}
      {line}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {label}
      {line}
    </Link>
  );
}

/**
 * "Join us" CTA and the footer card, sharing one field photo (75% black overlay) as in the
 * reference ("CTA & Footer").
 */
export function CtaFooter() {
  return (
    <div className="relative isolate overflow-hidden py-[60px] md:pb-[60px] md:pt-20">
      <Image src={CTA.image.src} alt="" fill sizes="100vw" className="-z-10 object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-black/75" />

      <section aria-labelledby="cta-title" className="px-5 pb-[50px] md:px-[30px] md:pb-[60px] desk:pb-20">
        <div className="mx-auto flex max-w-[1380px] flex-col items-center gap-6 text-center">
          <div className="flex flex-col items-center gap-4 md:gap-5">
            <SectionTag light>{CTA.tag}</SectionTag>
            <WordReveal id="cta-title" className="fm-h2 max-w-[738px] text-white">
              {CTA.title}
            </WordReveal>
          </div>
          <PillButton href={CONTACT_HREF}>{CTA.cta}</PillButton>
        </div>
      </section>

      <footer className="px-5 md:px-[30px]">
        <div className="mx-auto flex max-w-[1380px] flex-col gap-[30px] rounded-xl bg-white px-5 py-6 md:gap-10 md:rounded-[20px] md:p-9 desk:gap-[52px] desk:p-12">
          <div className="flex flex-col gap-8 md:gap-10 desk:flex-row desk:justify-between">
            <div className="flex max-w-[344px] flex-col items-start gap-4">
              <Link href="/#home" aria-label="Farmio — home" className="block rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-farm-ink">
                <Image src={LOGO.src} alt="" width={LOGO.width} height={LOGO.height} className="h-11 w-[135px]" />
              </Link>
              <p className="fm-p18 text-farm-ink">{FOOTER.blurb}</p>
              <FooterLink href={`mailto:${FOOTER.email}`} label={FOOTER.email} />
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-6 md:flex md:justify-between md:gap-10 desk:w-[668px]">
              {FOOTER.columns.map((col) => (
                <nav key={col.title} aria-label={col.title} className="flex flex-col gap-[14px] md:gap-4">
                  <p className="fm-p18 text-farm-ink">{col.title}</p>
                  <ul className="flex flex-col gap-3">
                    {col.links.map((l) => (
                      <li key={l.label}>
                        <FooterLink href={l.href} label={l.label} external={"external" in l && l.external} />
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>
          </div>

          <div className="border-t border-farm-ink/60 pt-3">
            <p className="text-center fm-p16 text-farm-body">{FOOTER.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
