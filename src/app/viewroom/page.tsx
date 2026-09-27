import type { Metadata } from "next";
import { Header } from "@/components/sites/anodeenergy-framer-website-108d0ac2/root-8a5edab2/Header";
import { Footer } from "@/components/sites/anodeenergy-framer-website-108d0ac2/root-8a5edab2/Footer";
import { SectionLabel } from "@/components/sites/anodeenergy-framer-website-108d0ac2/shared/SectionLabel";
import { ViewroomClient } from "@/components/viewroom/ViewroomClient";

export const metadata: Metadata = {
  title: "Viewroom",
  description: "Explore a site in 3D — orbit, fly through or take a guided tour. Built to open real 3D Gaussian Splatting scans in the same viewer.",
};

export default function ViewroomPage() {
  return (
    <>
      <Header />
      <main data-nav-theme="dark" className="relative bg-ink text-white">
        <section
          aria-labelledby="viewroom-title"
          className="mx-auto flex w-full max-w-[1800px] flex-col gap-5 px-4 pb-4 pt-[96px] tab:gap-6 tab:px-8 tab:pb-8 tab:pt-[118px]"
        >
          <div className="flex flex-col gap-3 tab:flex-row tab:items-end tab:justify-between tab:gap-10">
            <div className="flex flex-col gap-3">
              <SectionLabel light>VIEWROOM</SectionLabel>
              <h1
                id="viewroom-title"
                className="text-[34px] font-normal leading-[1.05] tracking-[-1.7px] tab:text-[48px] tab:tracking-[-2.4px] desk:text-[64px] desk:tracking-[-3.2px]"
              >
                Explore in 3D.
              </h1>
            </div>
            <p className="max-w-[460px] text-[14px] leading-[1.45] tracking-[-0.28px] text-white/70 tab:pb-1 tab:text-[15px]">
              Inspect a place instead of watching a video. Today&apos;s scene is a prototype mesh; real 3D Gaussian Splatting scans will open in this same viewer.
            </p>
          </div>
          <div className="h-[max(380px,calc(100svh-272px))] w-full tab:h-[max(460px,calc(100svh-256px))] desk:h-[max(520px,calc(100svh-272px))]">
            <ViewroomClient debug={process.env.NODE_ENV !== "production"} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
