import Image from "next/image";
import { CONTACT_HREF, HERO } from "../shared/content";
import { PillButton } from "../shared/PillButton";

const GLASS = "border border-[rgba(187,187,187,0.15)] backdrop-blur-[12px]";

/**
 * Full-bleed field photo under a 73% black overlay. Desktop fills the viewport and centres the
 * content between 184px top / 60px bottom padding; tablet and phone size to content.
 */
export function Hero() {
  return (
    <section
      id="home"
      aria-labelledby="hero-title"
      className="relative isolate flex flex-col justify-center overflow-hidden px-5 pb-[60px] pt-[120px] text-white md:px-[30px] md:pt-[140px] desk:min-h-svh desk:pt-[184px]"
    >
      <Image src={HERO.image.src} alt="" fill sizes="100vw" fetchPriority="high" loading="eager" className="-z-10 object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-black/[0.73]" />

      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-10 md:gap-20 desk:gap-32">
        <div className="flex flex-col items-start gap-3">
          <p className={`rounded-full px-3 py-[5px] fm-p14 text-farm-sand ${GLASS}`}>{HERO.tag}</p>
          <h1 id="hero-title" className="fm-h1 max-w-[630px] text-white">
            {HERO.title}
          </h1>
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className={`w-[238px] rounded-2xl bg-white/10 p-[10px] ${GLASS}`}>
            <video
              src={HERO.media.video}
              autoPlay
              muted
              loop
              playsInline
              aria-label={`${HERO.media.title}: tractor working a field`}
              className="h-[130px] w-[218px] rounded-[14px] bg-white/10 object-cover"
            />
            <div className="mt-[10px] flex flex-col gap-[6px]">
              <p className="fm-p18 text-white">{HERO.media.title}</p>
              <p className="fm-p14 text-farm-sand">{HERO.media.body}</p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-5 md:w-[350px] md:gap-6">
            <p className="fm-p18 text-balance text-farm-mist">{HERO.body}</p>
            <PillButton href={CONTACT_HREF}>{HERO.cta}</PillButton>
          </div>
        </div>
      </div>
    </section>
  );
}
