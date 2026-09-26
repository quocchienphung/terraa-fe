import Image from "next/image";
import Link from "next/link";
import { FOOTER, FOOTER_COLUMNS } from "@/lib/constants";
import type { FooterColumn } from "@/types/anode";

function FooterLink({ label, href, external }: FooterColumn["links"][number]) {
  const inner = (
    <>
      <span aria-hidden className="absolute bottom-0 -left-px z-[1] h-px w-px bg-white transition-[width] duration-[400ms] ease-cta group-hover:w-[calc(100%+2px)] group-focus-visible:w-[calc(100%+2px)]" />
      <p className="relative z-[1] whitespace-pre text-[12px] leading-[14.4px] tracking-[-0.48px] text-white">{label}</p>
    </>
  );
  const cls = "group relative flex h-4 items-center overflow-hidden px-[2px] no-underline focus-visible:outline-none";
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <Link prefetch={false} href={href} className={cls}>
      {inner}
    </Link>
  );
}

function Column({ column }: { column: FooterColumn }) {
  return (
    <div className="flex flex-1 flex-col items-start gap-4">
      <p className="whitespace-pre text-[14px] font-medium leading-[16.8px] tracking-[-0.56px] text-muted-1">{column.title}</p>
      <ul className="flex list-none flex-col items-start gap-[2px] p-0">
        {column.links.map((l) => (
          <li key={l.label}>
            <FooterLink {...l} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer data-nav-theme="dark" className="relative flex flex-col items-center gap-[10px] overflow-hidden bg-ink-2 px-4 pb-10 pt-12 tab:pb-4 tab:pt-16">
      <div className="relative z-[1] flex w-full max-w-[1800px] flex-col items-center overflow-hidden">
        <div className="flex w-full flex-col items-start gap-20 overflow-hidden tab:gap-[120px]">
          <div className="flex w-full flex-col items-start gap-20 tab:flex-row">
            <div className="flex w-full max-w-[680px] flex-col items-start gap-4 overflow-clip tab:flex-1">
              <h4 className="w-full max-w-[380px] whitespace-pre-wrap text-[20px] font-normal leading-[1.15] tracking-[-0.8px] text-white tab:text-[22px] tab:tracking-[-0.88px] desk:text-[32px] desk:tracking-[-1.28px]">
                {FOOTER.title}
              </h4>
              <form className="flex w-full items-end gap-[2px] overflow-hidden" action="#" method="post">
                <label className="flex flex-1 flex-col items-start gap-[10px] tab:w-[190px] tab:flex-none">
                  <span className="sr-only">Email address</span>
                  <span className="flex w-full items-center overflow-hidden bg-[rgba(227,227,227,0.2)] p-[13px] backdrop-blur-[5px]">
                    <input
                      type="email"
                      name="email"
                      placeholder={FOOTER.placeholder}
                      className="w-full min-w-0 flex-1 bg-transparent text-[11px] leading-[11px] tracking-[-0.44px] text-line outline-none placeholder:text-line"
                    />
                  </span>
                </label>
                <button
                  type="submit"
                  className="flex h-10 w-[180px] flex-none cursor-pointer items-center justify-center rounded-[2px] border-0 bg-white px-6 py-3 tab:w-[84px]"
                >
                  <p className="whitespace-pre text-[11px] leading-[15.4px] tracking-[-0.44px] text-ink-2">{FOOTER.submit}</p>
                </button>
              </form>
            </div>

            <div className="flex w-full flex-col items-start gap-20 tab:flex-1 tab:gap-[120px]">
              {FOOTER_COLUMNS.map((row, i) => (
                <div key={i} className="flex w-full items-start gap-8">
                  {row.map((col) => (
                    <Column key={col.title} column={col} />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="flex w-full flex-col items-center justify-center gap-4">
            <div className="flex w-full flex-col items-start gap-8 tab:flex-row tab:items-end">
              <div className="relative aspect-[7.40741] w-[300px] flex-none">
                <Image src={FOOTER.wordmark} alt="Anode" fill sizes="300px" className="object-cover" />
              </div>
              <p className="whitespace-pre-wrap text-[12px] leading-[14.4px] tracking-[-0.48px] text-muted-4 tab:flex-1">{FOOTER.copyright}</p>
              <div className="flex flex-col items-start tab:flex-1">
                {FOOTER.legal.map((l) => (
                  <p key={l.label} className="whitespace-pre text-[12px] leading-[14.4px] tracking-[-0.48px] text-muted-4">
                    <Link prefetch={false} href={l.href} className="text-white no-underline">
                      {l.label}
                    </Link>
                  </p>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <p className="whitespace-pre text-[12px] leading-[14.4px] tracking-[-0.48px] text-muted-4">{FOOTER.rights}</p>
                <p className="whitespace-pre text-[12px] leading-[14.4px] tracking-[-0.48px] text-muted-4">
                  <a href={FOOTER.credit.href} target="_blank" rel="noreferrer" className="no-underline">
                    {FOOTER.credit.label}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div aria-hidden className="absolute inset-0 z-0 rotate-180 opacity-50">
        <Image src={FOOTER.vectorBg} alt="" fill sizes="100vw" className="object-cover" />
      </div>
    </footer>
  );
}
