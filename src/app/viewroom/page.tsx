import type { Metadata } from "next";
import { Header } from "@/components/sites/farmio-framer-website-711ac6e6/shared/Header";
import { CtaFooter } from "@/components/sites/farmio-framer-website-711ac6e6/shared/CtaFooter";
import { SectionTag } from "@/components/sites/farmio-framer-website-711ac6e6/shared/SectionTag";
import { ViewroomClient } from "@/components/viewroom/ViewroomClient";

export const metadata: Metadata = {
  title: "Viewroom — Farmio",
  description: "Explore a site in 3D — orbit, fly through or take a guided tour. Built to open real 3D Gaussian Splatting scans in the same viewer.",
};

/**
 * Viewroom in the Farmio design system. There is no Farmio reference for this page: the layout is
 * derived from the site's tokens (mist section, tag + heading, 20px radius frame, pill controls).
 * The 3D stage is the point of the page, so it spans the full width and fills the first screen.
 * The viewer itself (ViewroomClient → ViewroomShell → TerraViewport) is unchanged in behaviour.
 */
export default function ViewroomPage() {
  return (
    <>
      <Header />
      <main className="relative bg-farm-mist pb-10 md:pb-[50px] desk:pb-[90px]">
        {/* One screen tall: a compact intro, then the viewer takes every remaining pixel (flex-1). */}
        <section
          aria-labelledby="viewroom-title"
          className="flex h-svh min-h-[620px] flex-col gap-4 px-5 pb-5 pt-[80px] md:min-h-[700px] md:gap-6 md:px-[30px] md:pb-[30px] md:pt-[88px] desk:pt-[112px]"
        >
          <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-2 md:flex-row md:items-end md:justify-between md:gap-10">
            <div className="flex flex-col gap-1 md:gap-2">
              <SectionTag>Viewroom</SectionTag>
              <h1 id="viewroom-title" className="fm-h3 text-farm-ink">
                Explore in 3D.
              </h1>
            </div>
            <p className="fm-p16 text-balance text-farm-body md:max-w-[460px]">
              Inspect a place instead of watching a video. Today&apos;s scene is a prototype mesh; real 3D Gaussian Splatting scans will open in this same viewer.
            </p>
          </div>
          {/* Full-bleed stage: wider than the 1320px text column, only the page gutter around it. */}
          <div className="relative min-h-[400px] w-full flex-1 overflow-hidden rounded-[20px] bg-[#121312] md:min-h-[480px]">
            <div className="absolute inset-0">
              <ViewroomClient debug={process.env.NODE_ENV !== "production"} />
            </div>
          </div>
        </section>
      </main>
      <CtaFooter />
    </>
  );
}
