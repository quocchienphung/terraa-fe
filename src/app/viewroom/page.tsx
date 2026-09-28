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
 * The viewer itself (ViewroomClient → ViewroomShell → TerraViewport) is unchanged in behaviour.
 */
export default function ViewroomPage() {
  return (
    <>
      <Header />
      <main className="relative bg-farm-mist">
        <section aria-labelledby="viewroom-title" className="px-5 pb-[60px] pt-[104px] md:px-[30px] md:pb-20 md:pt-[118px] desk:pb-[120px] desk:pt-[136px]">
          <div className="mx-auto flex max-w-[1320px] flex-col gap-6 md:gap-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-10">
              <div className="flex flex-col gap-3 md:gap-4">
                <SectionTag>Viewroom</SectionTag>
                <h1 id="viewroom-title" className="fm-h1 text-farm-ink">
                  Explore in 3D.
                </h1>
              </div>
              <p className="fm-p18 text-balance text-farm-body md:max-w-[465px]">
                Inspect a place instead of watching a video. Today&apos;s scene is a prototype mesh; real 3D Gaussian Splatting scans will open in this same viewer.
              </p>
            </div>
            {/* Sized so the whole frame, toolbar included, fits the first screen under the title. */}
            <div className="h-[max(420px,calc(100svh-370px))] w-full overflow-hidden rounded-[20px] bg-[#121312] md:h-[max(480px,calc(100svh-320px))] desk:h-[max(520px,calc(100svh-316px))]">
              <ViewroomClient debug={process.env.NODE_ENV !== "production"} />
            </div>
          </div>
        </section>
      </main>
      <CtaFooter />
    </>
  );
}
