"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { MENU } from "@/lib/constants";
import type { MenuLink } from "@/types/anode";
import { ClockIcon, DotArrowIcon } from "../shared/icons";

function useCityTime(timeZone: string) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, []);
  if (!now) return { label: "--:-- --", hour: 0, minute: 0 };
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  return { label: `${get("hour")}:${get("minute")} ${get("dayPeriod")}`, hour, minute };
}

/** Column label + rule, both revealed with the same rise-in mask. */
function ColumnHead({ children, open, delay }: { children: string; open: boolean; delay: number }) {
  return (
    <>
      <p className="font-pt text-[11px] uppercase leading-[15.4px] text-menu-muted">
        <span className="inline-block overflow-hidden align-top">
          <span
            className={cn("inline-block transition-transform duration-[750ms] ease-nav", open ? "translate-y-0" : "translate-y-[110%]")}
            style={{ transitionDelay: `${delay}ms` }}
          >
            {children}
          </span>
        </span>
      </p>
      <div className="mb-[26px] mt-[14px] h-px w-full bg-menu-rule" />
    </>
  );
}

function BigLink({ item, open, delay, onNavigate }: { item: MenuLink; open: boolean; delay: number; onNavigate: () => void }) {
  return (
    <li className="h-[48px] tab:h-[65px]">
      <Link
        prefetch={false}
        href={item.href}
        onClick={onNavigate}
        className="group inline-flex items-start text-[40px] leading-[48px] tracking-[-1.6px] text-white no-underline tab:text-[54px] tab:leading-[64.8px] tab:tracking-[-2.16px] focus-visible:outline-none"
      >
        <span className="block overflow-hidden">
          <span
            className={cn("block transition-transform duration-[750ms] ease-nav", open ? "translate-y-0" : "translate-y-[110%]")}
            style={{ transitionDelay: `${delay}ms` }}
          >
            <span className="roll">
              <span>{item.label}</span>
              <span aria-hidden>{item.label}</span>
            </span>
          </span>
        </span>
        {item.count ? (
          <sup className="ml-[6px] mt-[3.74px] font-pt text-[11px] leading-[15.4px] tracking-[0.66px] text-menu-muted">{`[${item.count}]`}</sup>
        ) : null}
        <span
          aria-hidden
          className="ml-[18px] mt-[12px] flex text-white opacity-0 transition-[opacity,transform] duration-[450ms] ease-cta -translate-x-[14px] group-hover:translate-x-0 group-hover:opacity-100 tab:mt-[20px]"
        >
          <DotArrowIcon width={35} height={26} />
        </span>
      </Link>
    </li>
  );
}

function SmallLink({ item, open, delay }: { item: MenuLink; open: boolean; delay: number }) {
  return (
    <li className="h-[22px]">
      <a
        href={item.href}
        target="_blank"
        rel="noreferrer"
        className="group inline-flex text-[14px] leading-[21.7px] tracking-[-0.42px] text-[#fcfcfc] no-underline focus-visible:outline-none"
      >
        <span className="block overflow-hidden">
          <span
            className={cn("block transition-transform duration-[750ms] ease-nav", open ? "translate-y-0" : "translate-y-[110%]")}
            style={{ transitionDelay: `${delay}ms` }}
          >
            <span className="roll">
              <span>{item.label}</span>
              <span aria-hidden>{item.label}</span>
            </span>
          </span>
        </span>
      </a>
    </li>
  );
}

export function MenuOverlay({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const time = useCityTime(MENU.clock.timeZone);
  const hourAngle = ((time.hour % 12) + time.minute / 60) * 30;
  const minuteAngle = time.minute * 6;

  return (
    <div
      id="site-menu"
      aria-hidden={!open}
      data-lenis-prevent
      data-open={open}
      className="menu-overlay fixed inset-0 z-[50] overflow-y-auto bg-ink text-white"
    >
      <div className="flex flex-col gap-14 px-4 pb-12 pt-[120px] tab:flex-row tab:px-11 tab:pb-20 tab:pt-[212px]">
        <div className="flex-1">
          <ColumnHead open={open} delay={0}>
            Menu
          </ColumnHead>
          <ul className="flex list-none flex-col p-0">
            {MENU.primary.map((item, i) => (
              <BigLink key={item.label} item={item} open={open} delay={40 + i * 40} onNavigate={onNavigate} />
            ))}
          </ul>
        </div>

        <div className="flex-1">
          <div className="hidden tab:block">
            <ColumnHead open={open} delay={80}>
              {" "}
            </ColumnHead>
          </div>
          <ul className="flex list-none flex-col p-0">
            {MENU.secondary.map((item, i) => (
              <BigLink key={item.label} item={item} open={open} delay={200 + i * 40} onNavigate={onNavigate} />
            ))}
          </ul>
        </div>

        <div className="flex-1">
          <ColumnHead open={open} delay={120}>
            Follow Us
          </ColumnHead>
          <ul className="mb-14 list-none p-0">
            {MENU.follow.map((item, i) => (
              <SmallLink key={item.label} item={item} open={open} delay={160 + i * 40} />
            ))}
          </ul>

          <ColumnHead open={open} delay={200}>
            HQ
          </ColumnHead>
          <address className="not-italic">
            {MENU.hq.map((line, i) => (
              <span key={line} className="block overflow-hidden text-[14px] leading-[21.7px] tracking-[-0.42px]">
                <span
                  className={cn("inline-block underline transition-transform duration-[750ms] ease-nav", open ? "translate-y-0" : "translate-y-[110%]")}
                  style={{ transitionDelay: `${320 + i * 40}ms` }}
                >
                  {line}
                </span>
              </span>
            ))}
          </address>
          <div className="mt-[30px] flex items-center gap-3">
            <ClockIcon hourAngle={hourAngle} minuteAngle={minuteAngle} />
            <span className="font-fragment text-[11px] leading-[14.85px] tracking-[0.22px]">
              <span className="block overflow-hidden">
                <span
                  className={cn("inline-block text-white transition-transform duration-[750ms] ease-nav", open ? "translate-y-0" : "translate-y-[110%]")}
                  style={{ transitionDelay: "400ms" }}
                >
                  {MENU.clock.city}
                </span>
              </span>
              <span className="block overflow-hidden">
                <span
                  className={cn("inline-block text-menu-muted transition-transform duration-[750ms] ease-nav", open ? "translate-y-0" : "translate-y-[110%]")}
                  style={{ transitionDelay: "440ms" }}
                >
                  {time.label}
                </span>
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
