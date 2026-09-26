import type { SVGProps } from "react";
import type { Capability, MarkerKind } from "@/types/anode";

type IconProps = SVGProps<SVGSVGElement>;

/** 20×20 (or 16×16) stroked arrow used inside every Arrow CTA. */
export function ArrowRightIcon({ size = 20, ...props }: IconProps & { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className="block"
      {...props}
    >
      <path d="M4 12h15" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

/** Dotted arrow (35×26 viewBox) used by carousel buttons, project cards and the menu. */
export function DotArrowIcon({
  width = 20,
  height = 15,
  flip = false,
  ...props
}: IconProps & { width?: number; height?: number; flip?: boolean }) {
  const dots: [number, number][] = [
    [1.3, 12.7],
    [6.6, 12.7],
    [12, 12.7],
    [17.3, 12.7],
    [22.6, 12.7],
    [27.9, 12.7],
    [33.2, 12.7],
    [27.9, 6.3],
    [22.6, 1.3],
    [27.9, 19.1],
    [22.6, 24.1],
  ];
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 35 26"
      fill="none"
      aria-hidden="true"
      className={flip ? "block -scale-x-100" : "block"}
      {...props}
    >
      {dots.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.33" fill="currentColor" />
      ))}
    </svg>
  );
}

/** Menu button mark: 3 squares in a row that morph into an X of 5 squares. */
export function MenuMarkIcon(props: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="block overflow-visible" {...props}>
      <rect className="mk-edge" x="4" y="10" width="4" height="4" fill="currentColor" />
      <rect className="mk-hold" x="10" y="10" width="4" height="4" fill="currentColor" />
      <rect className="mk-edge" x="16" y="10" width="4" height="4" fill="currentColor" />
      <rect className="mk-corner" x="4" y="4" width="4" height="4" fill="currentColor" />
      <rect className="mk-corner" x="16" y="4" width="4" height="4" fill="currentColor" />
      <rect className="mk-corner" x="4" y="16" width="4" height="4" fill="currentColor" />
      <rect className="mk-corner" x="16" y="16" width="4" height="4" fill="currentColor" />
    </svg>
  );
}

/** Map marker glyphs. */
export function MarkerIcon({ kind, size = 14, ...props }: IconProps & { kind: MarkerKind; size?: number }) {
  if (kind === "site") {
    const pts: [number, number][] = [
      [4, 12],
      [8, 12],
      [12, 12],
      [16, 12],
      [20, 12],
      [12, 4],
      [12, 8],
      [12, 16],
      [12, 20],
    ];
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="block" {...props}>
        {pts.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.4" fill="currentColor" />
        ))}
      </svg>
    );
  }
  if (kind === "office") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="block" {...props}>
        <circle cx="12" cy="12" r="4.6" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="block" {...props}>
      <circle cx="12" cy="12" r="5.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

/** Capability chip glyphs (18×18, stroked with the ink color). */
export function CapabilityIcon({ icon }: { icon: Capability["icon"] }) {
  const common = {
    viewBox: "0 0 24 24",
    width: "100%",
    height: "100%",
    fill: "none",
    stroke: "#0a0a0a",
    strokeLinecap: "butt" as const,
    "aria-hidden": true,
    className: "block overflow-visible",
  };
  switch (icon) {
    case "lfp":
      return (
        <svg {...common} strokeWidth="1.5">
          <path d="M6 4v16" />
          <path d="M11 4v16" />
          <path d="M16 4v16" />
          <path d="M21 4v16" />
        </svg>
      );
    case "pcs":
      return (
        <svg {...common} strokeWidth="1.5">
          <path d="M4 20L18 6" />
          <path d="M18 16V6H8" />
        </svg>
      );
    case "enclosure":
      return (
        <svg {...common} strokeWidth="1.5">
          <path d="M3 8V3h5" />
          <path d="M16 3h5v5" />
          <path d="M21 16v5h-5" />
          <path d="M8 21H3v-5" />
        </svg>
      );
    case "engineering":
      return (
        <svg {...common} strokeWidth="1">
          <path d="M12 4v16" />
          <path d="M3 15h18" />
        </svg>
      );
    case "installation":
      return (
        <svg {...common} strokeWidth="1">
          <path d="M3 15l5-5" />
          <path d="M9 15l5-5" />
          <path d="M15 15l5-5" />
          <path d="M2 20h20" />
        </svg>
      );
    case "commissioning":
      return (
        <svg {...common} strokeWidth="1">
          <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18" />
          <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8" />
          <path d="M12 11.4a0.6 0.6 0 1 0 0 1.2 0.6 0.6 0 0 0 0-1.2" />
        </svg>
      );
    case "monitoring":
      return (
        <svg {...common} strokeWidth="1">
          <path d="M14 10a4.5 4.5 0 1 0-9 0 4.5 4.5 0 0 0 9 0" />
          <path d="M13.5 13.5L21 21" />
        </svg>
      );
    case "performance":
      return (
        <svg {...common} strokeWidth="1">
          <path d="M12 4v8" />
          <path d="M6 6l3 6" />
          <path d="M18 6l-3 6" />
          <path d="M2 17h20" />
        </svg>
      );
    case "health":
      return (
        <svg {...common} strokeWidth="1">
          <path d="M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9" />
          <path d="M12 2v3" />
          <path d="M4.6 5.6l2.1 2.1" />
          <path d="M19.4 5.6l-2.1 2.1" />
          <path d="M12 19v3" />
        </svg>
      );
  }
}

/** Menu clock face (30×30). */
export function ClockIcon({ hourAngle, minuteAngle }: { hourAngle: number; minuteAngle: number }) {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true" className="block flex-none">
      <circle cx="15" cy="15" r="14" stroke="#3a3a3a" strokeWidth="1" />
      <line
        x1="15"
        y1="15"
        x2="15"
        y2="8.5"
        stroke="#00e05c"
        strokeWidth="1.4"
        strokeLinecap="round"
        transform={`rotate(${hourAngle} 15 15)`}
      />
      <line
        x1="15"
        y1="15"
        x2="15"
        y2="5.5"
        stroke="#ffffff"
        strokeWidth="1"
        strokeLinecap="round"
        transform={`rotate(${minuteAngle} 15 15)`}
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Client logos in the marquee (placeholder "logoipsum" marks, verbatim) */
/* ------------------------------------------------------------------ */

const CLOUD_PATH =
  "M82 26H72V20C72 18 71.4 16.1 70.3 14.4C69.2 12.8 67.7 11.5 65.8 10.8C64 10 62 9.8 60 10.2C58.1 10.6 56.3 11.5 54.9 12.9C53.5 14.3 52.6 16.1 52.2 18C51.8 20 52 22 52.8 23.8C53.5 25.7 54.8 27.2 56.4 28.3C58.1 29.4 60 30 62 30H88V40H62C58 40 54.2 38.8 50.9 36.6C47.6 34.4 45 31.3 43.5 27.7C42.4 24.9 42.5 21.6 40.8 19.1C40.1 18 39 17.1 37.7 16.5C36.4 16 35 15.9 33.6 16.1C32.3 16.4 31 17.1 30.1 18.1C29.1 19 28.4 20.3 28.1 21.6C27.9 23 28 24.4 28.5 25.7C29.1 27 30 28.1 31.1 28.8C32.3 29.6 33.6 30 35 30H40.2C42 34 45 37.5 48.7 40C48.7 40 48.7 40 48.7 40H35C31.6 40 28.4 39 25.6 37.1C22.8 35.3 20.6 32.6 19.3 29.5C18.5 27.6 18.4 25.4 17.3 23.8C16.9 23.1 16.3 22.6 15.5 22.3C14.8 22 14 21.9 13.2 22.1C12.4 22.2 11.7 22.6 11.2 23.2C10.6 23.7 10.2 24.4 10.1 25.2C9.9 26 10 26.8 10.3 27.5C10.6 28.3 11.1 28.9 11.8 29.3C12.4 29.8 13.2 30 14 30L15.2 30C15.3 30.3 15.5 30.7 15.6 31C17.1 34.6 19.5 37.7 22.7 40H14C11.2 40 8.5 39.2 6.2 37.6C3.9 36.1 2.1 33.9 1.1 31.4C0 28.8 -0.3 26 0.3 23.3C0.8 20.6 2.1 18.1 4.1 16.1C6.1 14.1 8.6 12.8 11.3 12.3C14 11.7 16.8 12 19.4 13.1C19.8 13.3 20.3 13.5 20.8 13.7C21.4 12.7 22.1 11.8 23 11C25.4 8.6 28.4 7 31.7 6.3C35 5.7 38.4 6 41.5 7.3C42.8 7.8 44 8.5 45.1 9.3C45.9 8.1 46.8 6.9 47.9 5.9C50.7 3.1 54.2 1.2 58.1 0.4C62 -0.4 66 0 69.7 1.5C73.3 3 76.4 5.6 78.6 8.9C80.8 12.2 82 16 82 20V26Z";

function CloudMark() {
  return (
    <svg viewBox="0 0 88 40" height="22" width="48.4" fill="currentColor" aria-hidden="true" className="block flex-none">
      <path d={CLOUD_PATH} fillRule="evenodd" clipRule="evenodd" />
      <path d="M88 3C88 4.7 86.7 6 85 6C83.3 6 82 4.7 82 3C82 1.3 83.3 0 85 0C86.7 0 88 1.3 88 3Z" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

function StackedWordmark() {
  return (
    <svg viewBox="0 0 268 40" height="22" width="147.4" fill="currentColor" aria-hidden="true" className="block flex-none">
      <path
        d="M258.1 30.1V17.2C258.1 16.8 257.7 16.5 257.4 16.5H256.9C256.6 16.5 256.3 16.7 256.2 16.9L251.7 27.6C251.1 29.1 249.6 30.1 247.9 30.1C246.2 30.1 244.7 29.1 244.1 27.6L239.6 16.9C239.5 16.7 239.2 16.5 238.9 16.5H238.4C238.1 16.5 237.7 16.8 237.7 17.2V30.1H233.5V17.2C233.5 14.5 235.7 12.3 238.4 12.3H238.9C240.9 12.3 242.7 13.5 243.5 15.3L247.9 25.8L252.3 15.3C253.1 13.5 254.9 12.3 256.9 12.3H257.4C260.1 12.3 262.3 14.5 262.3 17.2V30.1H258.1ZM214.4 30.1C210.1 30.1 206.7 26.6 206.7 22.4V12.3H210.9V22.4C210.9 24.3 212.5 25.9 214.4 25.9H223.3C225.2 25.9 226.8 24.3 226.8 22.4V12.3H231V22.4C231 26.6 227.6 30.1 223.3 30.1H214.4ZM198.9 25.9C199.6 25.9 200.2 25.3 200.2 24.6C200.2 23.9 199.7 23.3 199 23.3H189.1C186 23.3 183.6 20.8 183.6 17.8C183.6 14.8 186 12.3 189.1 12.3H204.5V16.5H189.1C188.4 16.5 187.8 17.1 187.8 17.8C187.8 18.5 188.4 19.1 189.1 19.1H199.1C202.1 19.2 204.5 21.6 204.5 24.6C204.5 27.6 202 30.1 198.9 30.1H183.6V25.9H198.9ZM160 30.1V17.2C160 14.5 162.2 12.3 164.9 12.3H175.7C179.2 12.3 182 15.1 182 18.6C182 22.1 179.2 25 175.7 25H164.2V30.1H160ZM164.2 17.2V20.7H175.7C176.9 20.7 177.9 19.8 177.9 18.6C177.9 17.5 176.9 16.5 175.7 16.5H164.9C164.6 16.5 164.2 16.8 164.2 17.2ZM153 12.3H157.1V30.1H153V12.3ZM141.8 25.9C144.4 25.9 146.6 23.8 146.6 21.2C146.6 18.6 144.4 16.5 141.8 16.5H135.3C132.7 16.5 130.6 18.6 130.6 21.2C130.6 23.8 132.7 25.9 135.3 25.9H141.8ZM141.8 12.3C146.8 12.3 150.7 16.3 150.7 21.2C150.7 26.1 146.8 30.1 141.8 30.1H135.3C130.4 30.1 126.4 26.1 126.4 21.2C126.4 16.3 130.4 12.3 135.3 12.3H141.8ZM110.1 30.1C105.1 30.1 101.1 26.1 101.1 21.2C101.1 16.3 105.1 12.3 110.1 12.3H122.9V16.5H110.1C107.5 16.5 105.3 18.6 105.3 21.2C105.3 23.8 107.5 25.9 110.1 25.9H119.5C120.2 25.9 120.8 25.3 120.8 24.6C120.8 23.9 120.2 23.3 119.5 23.3H109.3V19.1H119.5C122.6 19.1 125.1 21.6 125.1 24.6C125.1 27.6 122.6 30.1 119.5 30.1H110.1ZM90.8 25.9C93.4 25.9 95.6 23.8 95.6 21.2C95.6 18.6 93.4 16.5 90.8 16.5H84.3C81.7 16.5 79.6 18.6 79.6 21.2C79.6 23.8 81.7 25.9 84.3 25.9H90.8ZM90.8 12.3C95.8 12.3 99.7 16.3 99.7 21.2C99.7 26.1 95.8 30.1 90.8 30.1H84.3C79.4 30.1 75.4 26.1 75.4 21.2C75.4 16.3 79.4 12.3 84.3 12.3H90.8ZM58.2 25.2C58.2 25.6 58.5 25.9 58.9 25.9H74.6V30.1H58.9C56.2 30.1 54 27.9 54 25.2V12.2H58.2V25.2ZM267.4 12.2C267.4 13.3 266.4 14.3 265.2 14.3C264 14.3 263.1 13.3 263.1 12.2C263.1 11 264 10 265.2 10C266.4 10 267.4 11 267.4 12.2Z"
        fillRule="evenodd"
        clipRule="evenodd"
      />
      <path d="M16.4 34.1C16.7 35.8 18.2 37 20 37C21.8 37 23.3 35.8 23.6 34.1L23.9 33H35.2C31.5 37.3 26.1 40 20 40C13.9 40 8.5 37.3 4.8 33H16.1L16.4 34.1Z" fillRule="evenodd" clipRule="evenodd" />
      <path d="M14.8 27H25.2L26.2 22H39.9C39.7 24.5 38.9 26.9 37.9 29H2.1C1.1 26.9 0.3 24.5 0.1 22H13.8L14.8 27Z" fillRule="evenodd" clipRule="evenodd" />
      <path d="M12.5 16H27.5L28.6 11H40V18H0V11H11.4L12.5 16Z" fillRule="evenodd" clipRule="evenodd" />
      <path d="M0.7 0C4.3 0.2 7.5 2.1 9.3 5H30.7C32.6 2.1 35.8 0.2 39.4 0H40V7H0V0H0.7Z" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

function PeakWordmark() {
  return (
    <svg viewBox="0 0 240 49" height="22" width="107.76" fill="currentColor" aria-hidden="true" className="block flex-none">
      <path
        d="M23.6 0.6C19.9 1.8 16.9 5.5 10.9 12.9C3.5 22.1 -0.2 26.7 0 30.5C0.2 33.2 1.3 35.6 3.2 37.4C6.1 40 11.9 40 23.7 40H24.3C27.2 40 29.9 38.7 31.7 36.5C37.7 29.1 40.6 25.4 44.5 24.9C45.4 24.8 46.4 24.8 47.3 24.9C49.9 25.3 52 27 55 30.4C50.3 21.5 41.6 3.8 31.4 0.6C28.9 -0.2 26.2 -0.2 23.6 0.6Z"
        fillRule="evenodd"
        clipRule="evenodd"
      />
      <path
        d="M110.6 41.8C113.4 41.3 116.5 41.1 119.4 41.4L118.9 46C116.5 45.8 113.8 45.9 111.4 46.3C108.9 46.8 106.9 47.5 105.7 48.3L103.1 44.4C105.1 43.1 107.8 42.2 110.6 41.8Z M160.3 21.8C165.9 21.8 169.9 25.7 169.9 31.3C169.9 37.4 165.3 40.5 161 40.5C158.5 40.5 156.4 39.4 155.1 37.4V47.6H150.8V31.3C150.8 25.5 154.7 21.8 160.3 21.8ZM160.3 25.8C157.2 25.8 155.1 28 155.1 31.1C155.1 34.3 157.2 36.5 160.3 36.5C163.4 36.5 165.5 34.3 165.5 31.1C165.5 28 163.4 25.8 160.3 25.8Z M90.5 21.8C96.1 21.8 100.1 25.7 100.1 31.1C100.1 36.5 96.1 40.5 90.5 40.5C84.9 40.5 81 36.5 81 31.1C81 25.7 84.9 21.8 90.5 21.8ZM90.5 25.8C87.4 25.8 85.3 28 85.3 31.1C85.3 34.3 87.4 36.5 90.5 36.5C93.7 36.5 95.7 34.3 95.7 31.1C95.7 28 93.7 25.8 90.5 25.8Z M120.5 23.5L118.4 25.1C119.7 26.7 120.4 28.8 120.4 31.1C120.4 36.5 116.5 40.5 110.9 40.5C105.3 40.5 101.3 36.5 101.3 31.1C101.3 25.7 105.3 21.8 110.9 21.8C112.1 21.8 113.3 22 114.3 22.3L117.8 19.8L120.5 23.5ZM110.9 25.8C107.7 25.8 105.6 28 105.6 31.1C105.6 34.3 107.7 36.5 110.9 36.5C114 36.5 116.1 34.3 116.1 31.1C116.1 28 114 25.8 110.9 25.8Z M131.2 21.8C136.8 21.8 140.7 25.7 140.7 31.1C140.7 36.5 136.8 40.5 131.2 40.5C125.6 40.5 121.6 36.5 121.6 31.1C121.6 25.7 125.6 21.8 131.2 21.8ZM131.2 25.8C128.1 25.8 125.9 28 125.9 31.1C125.9 34.3 128.1 36.5 131.2 36.5C134.3 36.5 136.4 34.3 136.4 31.1C136.4 28 134.3 25.8 131.2 25.8Z M178.5 21.8C182.9 21.8 185.5 24.2 185.6 27.4H181.4C181.3 26.3 180.3 25.5 178.6 25.5C176.7 25.5 175.8 26.4 175.8 27.5C175.8 28.8 177.4 29 179.3 29.3C181.7 29.6 186 30.1 186 34.5C186 38.1 183.1 40.5 178.6 40.5C174.1 40.5 171.2 38.1 171.1 34.8H175.4C175.5 35.9 176.5 36.7 178.6 36.7C180.8 36.7 181.7 35.8 181.7 34.8C181.7 33.4 180.1 33.2 178.2 33C175.5 32.6 171.5 32.1 171.5 27.8C171.5 24.2 174.3 21.8 178.5 21.8Z M192.3 31.5C192.3 34.9 194.1 36.5 196.8 36.5C199.5 36.5 201.3 34.9 201.3 31.5V22.3H205.5V31.5C205.5 37.4 202 40.5 196.8 40.5C191.5 40.5 188 37.5 188 31.5V22.3H192.3V31.5Z M227.9 21.8C232.1 21.8 235.3 24.3 235.3 29.9V40H231.1V29.9C231.1 27 229.6 25.8 227.5 25.8C225.4 25.8 223.9 27 223.9 29.9V40H219.6V29.9C219.6 27 218.1 25.8 216 25.8C214 25.8 212.5 27 212.5 29.9V40H208.2V29.9C208.2 24.3 211.4 21.8 215.6 21.8C218.3 21.8 220.5 22.9 221.8 25C223 22.9 225.2 21.8 227.9 21.8Z M67.6 35.8H79.9V40H63V16.5H67.6V35.8Z M147.6 40H143.3V22.3H147.6V40Z M145.4 14.2C147.1 14.2 148.3 15.5 148.3 17.1C148.3 18.8 147.1 20 145.4 20C143.8 20 142.6 18.8 142.6 17.1C142.6 15.5 143.8 14.2 145.4 14.2Z M239.8 21.8C239.8 22.9 238.9 23.9 237.7 23.9C236.5 23.9 235.6 22.9 235.6 21.8C235.6 20.6 236.5 19.7 237.7 19.7C238.9 19.7 239.8 20.6 239.8 21.8Z"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CloudWordmark() {
  return (
    <svg viewBox="0 0 303 40" height="22" width="166.65" fill="currentColor" aria-hidden="true" className="block flex-none">
      <path
        d="M293.3 11L293.4 11C295.3 11.1 296.9 12.4 297.4 14.1L297.5 14.3L302.3 34H295.9L293 22.3L290.7 29.4C290.1 31.4 288.2 32.8 286.1 32.8C284.1 32.8 282.3 31.5 281.6 29.6L281.5 29.4L279.3 22.3L276.4 34H270L274.8 14.3L274.8 14.1C275.4 12.3 277.1 11 279 11L279.2 11C280.9 11.1 282.5 12.2 283.1 13.8L283.1 14L286.1 23.3L289.1 14L289.1 13.8C289.8 12.1 291.4 11 293.3 11ZM258.5 34C252.2 34 247 28.9 247 22.5V11H253.2V22.5C253.2 25.4 255.6 27.8 258.5 27.8C261.4 27.8 263.8 25.4 263.8 22.5V11H270.1V22.5C270.1 28.9 264.9 34 258.5 34ZM246.2 11V17.2C243.6 17.2 241.2 19 240.4 21.6L239.3 25.2C237.8 30.4 233 34 227.6 34V27.8C230.2 27.8 232.6 26 233.4 23.4L234.4 19.8C236 14.6 240.8 11 246.2 11ZM221.7 20.9C222.7 20.9 223.6 20.1 223.6 19.1C223.6 18.1 222.7 17.2 221.7 17.2H214.8V20.9H221.7ZM221.7 11C226.2 11 229.8 14.6 229.8 19.1C229.8 23.5 226.2 27.2 221.7 27.2H214.8V34H208.6V16.6C208.6 13.5 211.1 11 214.2 11H221.7ZM199.8 11H206V34H199.8V11ZM186.1 16.9H184.9C181.8 16.9 179.3 19.4 179.3 22.5C179.3 25.6 181.8 28.1 184.9 28.1H186.1C189.3 28.1 191.8 25.6 191.8 22.5C191.8 19.4 189.3 16.9 186.1 16.9ZM184.9 10.7H186.1C192.7 10.7 198 16 198 22.5C198 29.1 192.7 34.3 186.1 34.3H184.9C178.4 34.3 173.1 29.1 173.1 22.5C173.1 16 178.4 10.7 184.9 10.7ZM170.8 17.2H158.7C155.8 17.2 153.4 19.6 153.4 22.5C153.4 25.4 155.8 27.8 158.7 27.8H164.7C165.3 27.7 165.9 27.2 165.9 26.5V25.9H156.5V19.7H166.9C169.8 19.7 172.1 22 172.1 24.8V26.5C172.1 30.6 168.8 33.9 164.8 34H158.7C152.3 34 147.2 28.9 147.2 22.5C147.2 16.1 152.3 11 158.7 11H170.8V17.2ZM134.6 16.9H133.4C130.3 16.9 127.8 19.4 127.8 22.5C127.8 25.6 130.3 28.1 133.4 28.1H134.6C137.7 28.1 140.2 25.6 140.2 22.5C140.2 19.4 137.7 16.9 134.6 16.9ZM133.4 10.7H134.6C141.2 10.7 146.4 16 146.4 22.5C146.4 29.1 141.2 34.3 134.6 34.3H133.4C126.9 34.3 121.6 29.1 121.6 22.5C121.6 16 126.9 10.7 133.4 10.7ZM101.8 24.7V11H108V24.7C108 26.4 109.4 27.8 111.1 27.8H120.5V34H111.1C106 34 101.8 29.8 101.8 24.7Z"
        fillRule="evenodd"
        clipRule="evenodd"
      />
      <path d={CLOUD_PATH} fillRule="evenodd" clipRule="evenodd" />
      <path d="M88 3C88 4.7 86.7 6 85 6C83.3 6 82 4.7 82 3C82 1.3 83.3 0 85 0C86.7 0 88 1.3 88 3Z" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

/** The four marks in the order they appear in the marquee. */
export const MARQUEE_LOGOS = [CloudMark, StackedWordmark, PeakWordmark, CloudWordmark];
