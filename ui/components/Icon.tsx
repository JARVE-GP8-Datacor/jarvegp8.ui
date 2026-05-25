import type { SVGProps } from "react";

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "width" | "height"> {
  size?: number;
}
interface PinProps extends IconProps {
  filled?: boolean;
}
interface DotProps extends IconProps {
  color?: string;
}

const base = (size: number): SVGProps<SVGSVGElement> => ({
  viewBox: "0 0 24 24",
  width: size,
  height: size,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const SearchIcon = ({ size = 18, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const FilterIcon = ({ size = 16, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M3 5h18M6 12h12M10 19h4" />
  </svg>
);

export const ChevronIcon = ({ size = 14, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const GridIcon = ({ size = 16, ...rest }: IconProps) => (
  <svg {...base(size)} strokeLinecap={undefined} strokeLinejoin={undefined} {...rest}>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </svg>
);

export const ListIcon = ({ size = 16, ...rest }: IconProps) => (
  <svg {...base(size)} strokeLinejoin={undefined} {...rest}>
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </svg>
);

export const PinIcon = ({ size = 14, filled, ...rest }: PinProps) => (
  <svg {...base(size)} strokeWidth={1.75} fill={filled ? "currentColor" : "none"} {...rest}>
    <path d="M12 2 9 8H4l4 4-1 6 5-3 5 3-1-6 4-4h-5z" />
  </svg>
);

export const ArrowIcon = ({ size = 14, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const XIcon = ({ size = 14, ...rest }: IconProps) => (
  <svg {...base(size)} strokeLinejoin={undefined} {...rest}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const CheckIcon = ({ size = 14, ...rest }: IconProps) => (
  <svg {...base(size)} strokeWidth={2.5} {...rest}>
    <path d="m5 12 5 5L20 7" />
  </svg>
);

export const DotIcon = ({ size = 8, color = "currentColor", ...rest }: DotProps) => (
  <svg viewBox="0 0 8 8" width={size} height={size} {...rest}>
    <circle cx="4" cy="4" r="3" fill={color} />
  </svg>
);

export const ClockIcon = ({ size = 18, ...rest }: IconProps) => (
  <svg {...base(size)} strokeWidth={1.75} {...rest}>
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 7 12 12 15 14" />
  </svg>
);

export const DownloadIcon = ({ size = 14, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export const ChevronMotif = ({ size = 120, ...rest }: IconProps) => (
  <svg viewBox="0 0 120 120" width={size} height={size} fill="currentColor" {...rest}>
    <polygon points="60,0 120,0 90,30 30,60 90,90 120,120 60,120 0,60" />
  </svg>
);

export const PaperclipIcon = ({ size = 14, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.49" />
  </svg>
);

export const SendIcon = ({ size = 15, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M22 2L11 13" />
    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

export const CalendarBlankIcon = ({ size = 22, ...rest }: IconProps) => (
  <svg {...base(size)} strokeWidth={1.75} {...rest}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 10h18" />
    <path d="M8 4v4" />
    <path d="M16 4v4" />
  </svg>
);
