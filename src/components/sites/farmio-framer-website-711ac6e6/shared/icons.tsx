import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

/** Button arrow (reference mask "Vector", 14×13 viewBox). */
export function ArrowIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 14 13" fill="none" aria-hidden {...props}>
      <path
        d="M0.875 7h1.823M12.542 7L8.167 2.625M12.542 7L8.167 11.375M12.542 7H4.885"
        stroke="currentColor"
        strokeWidth={1.31}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** FAQ chevron, pointing up (open state); rotate 180° for closed. */
export function ChevronIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 14 8" fill="none" aria-hidden {...props}>
      <path
        d="M1 7l5.293-5.293C6.626 1.374 6.793 1.207 7 1.207s.374.167.707.5L13 7"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const QUOTE_MARK =
  "M4.7 5.981H2.563V4.272c0-.942.767-1.709 1.709-1.709h.214c.355 0 .641-.285.641-.64V.641C5.127.286 4.841 0 4.486 0h-.214C1.912 0 0 1.912 0 4.272v6.409c0 .708.574 1.282 1.282 1.282H4.7c.707 0 1.281-.574 1.281-1.282V7.263c0-.707-.574-1.282-1.281-1.282Z";

/** Testimonial opening quote (two marks). */
export function QuoteIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 14 14" fill="currentColor" aria-hidden {...props}>
      <path d={QUOTE_MARK} transform="translate(0.164 1.019)" />
      <path d={QUOTE_MARK} transform="translate(7.854 1.019)" />
    </svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 14 14" fill="currentColor" aria-hidden {...props}>
      <path
        transform="translate(0.7 1.05)"
        d="M8.789 7.634l-.319.317s-.757.754-2.826-1.303C3.576 4.591 4.333 3.838 4.333 3.838l.201-.2c.495-.492.541-1.281.11-1.858L3.761.601C3.227-.112 2.195-.206 1.583.402L.484 1.495C.181 1.797-.023 2.188.002 2.622c.063 1.11.566 3.499 3.369 6.287 2.972 2.955 5.762 3.073 6.902 2.967.361-.034.675-.218.928-.469l.994-.989c.671-.667.482-1.812-.377-2.278l-1.337-.727c-.564-.307-1.251-.217-1.692.221Z"
      />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 14 14" fill="currentColor" aria-hidden {...props}>
      <path
        transform="translate(0.636 2.089)"
        fillRule="evenodd"
        d="M5.091 0h2.545c2.4 0 3.6 0 4.346.746.745.745.745 1.945.745 4.345s0 3.6-.745 4.345c-.746.746-1.946.746-4.346.746H5.091c-2.4 0-3.6 0-4.345-.746C0 8.691 0 7.491 0 5.091s0-3.6.746-4.345C1.491 0 2.691 0 5.091 0Zm4.785 2.179L8.502 3.324c-.593.494-1.005.837-1.353 1.061-.337.216-.566.289-.785.289-.22 0-.448-.073-.785-.289-.348-.224-.76-.567-1.354-1.061L2.851 2.179a.477.477 0 0 0-.611.733l1.398 1.165c.564.47 1.021.851 1.424 1.11.421.271.83.442 1.302.442.471 0 .881-.171 1.301-.442.403-.259.861-.64 1.425-1.11l1.397-1.165a.477.477 0 1 0-.611-.733Z"
      />
    </svg>
  );
}
