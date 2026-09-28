"use client";

import { useState, type FormEvent } from "react";
import { CONTACT } from "../shared/content";
import { MailIcon, PhoneIcon } from "../shared/icons";
import { PillSubmit } from "../shared/PillButton";
import { SectionTag } from "../shared/SectionTag";

const FIELD = "h-11 w-full rounded-lg bg-[#f3f3f3] px-4 fm-p14 text-farm-ink placeholder:text-[#999] focus-visible:outline-2 focus-visible:outline-farm-ink";
const LABEL = "flex flex-col gap-2 fm-p16 text-farm-ink";

function ContactLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a href={href} className="group relative inline-flex items-center gap-3 fm-h6 text-farm-ink no-underline focus-visible:outline-none">
      <span className="flex h-[26px] w-[22px] flex-none items-end">{icon}</span>
      <span className="relative">
        {label}
        <span aria-hidden className="absolute bottom-0 left-0 h-px w-0.5 bg-farm-ink opacity-0 transition-[width,opacity] duration-400 ease-farm motion-reduce:transition-none group-hover:w-full group-hover:opacity-100 group-focus-visible:w-full group-focus-visible:opacity-100" />
      </span>
    </a>
  );
}

/**
 * Contact page body (reference /contact-us). There is no backend: submitting composes an email in
 * the visitor's own mail app (mailto) and says so; nothing is sent from the page.
 */
export function ContactSection() {
  const [composed, setComposed] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = `${data.get("firstName") ?? ""} ${data.get("lastName") ?? ""}`.trim();
    const subject = `Farming enquiry${name ? ` from ${name}` : ""}`;
    const body = `${data.get("message") ?? ""}\n\n${name}\n${data.get("email") ?? ""}`;
    window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setComposed(true);
  };

  return (
    <section aria-labelledby="contact-title" className="bg-white px-5 pb-[60px] pt-[120px] md:px-[30px] md:pt-[140px] desk:pt-[180px]">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-10 desk:flex-row desk:justify-between desk:gap-0">
        <div className="flex flex-col desk:w-[630px] desk:pr-10">
          <div className="flex flex-col gap-5">
            <SectionTag>{CONTACT.tag}</SectionTag>
            <h1 id="contact-title" className="fm-h1 text-farm-ink">
              {CONTACT.title}
            </h1>
            <p className="fm-p16 text-farm-body">{CONTACT.body}</p>
          </div>
          <div className="mt-8 flex flex-col items-start gap-6 border-t border-farm-sand pt-8">
            <ContactLink href={`tel:${CONTACT.phone}`} icon={<PhoneIcon className="size-[22px]" />} label={CONTACT.phone} />
            <ContactLink href={`mailto:${CONTACT.email}`} icon={<MailIcon className="size-[22px]" />} label={CONTACT.email} />
          </div>
        </div>

        <form onSubmit={onSubmit} aria-labelledby="form-title" className="flex flex-col gap-6 rounded-[20px] border border-farm-sand p-5 md:p-8 desk:w-[620px]">
          <h2 id="form-title" className="fm-h4 text-farm-ink">
            {CONTACT.formTitle}
          </h2>
          <div className="grid gap-5 md:grid-cols-2 md:gap-4">
            <label className={LABEL}>
              First name
              <input name="firstName" autoComplete="given-name" required placeholder="Johan" className={FIELD} />
            </label>
            <label className={LABEL}>
              Last name
              <input name="lastName" autoComplete="family-name" placeholder="Malik" className={FIELD} />
            </label>
          </div>
          <label className={LABEL}>
            Email
            <input name="email" type="email" autoComplete="email" required placeholder="Enter your email" className={FIELD} />
          </label>
          <label className={LABEL}>
            Message
            <textarea name="message" required rows={5} placeholder="Enter your message" className={`${FIELD} h-[116px] resize-y py-3`} />
          </label>
          <div className="flex flex-col items-start gap-3">
            <PillSubmit type="submit">{CONTACT.submit}</PillSubmit>
            <p aria-live="polite" className="fm-p14 text-farm-body">
              {composed
                ? "Your email app should now open with this message. Nothing has been sent from this page."
                : "Sending opens your own email app — nothing is submitted from this page."}
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
