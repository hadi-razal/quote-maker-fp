import type { SVGProps } from "react";

const base = (props: SVGProps<SVGSVGElement>) => ({
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
});

export const IconUp = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M8 13V3M4 7l4-4 4 4" />
  </svg>
);

export const IconDown = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M8 3v10M4 9l4 4 4-4" />
  </svg>
);

export const IconCopy = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
    <path d="M10.5 3.5h-7a1 1 0 0 0-1 1v7" />
  </svg>
);

export const IconTrash = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M2.5 4h11M6 4V2.5h4V4M4 4l.7 9.5h6.6L12 4M6.5 6.5v5M9.5 6.5v5" />
  </svg>
);

export const IconPlus = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M8 3v10M3 8h10" />
  </svg>
);

export const IconLibrary = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M2.5 3.5h4a2 2 0 0 1 2 2v8a1.6 1.6 0 0 0-1.6-1.6H2.5zM13.5 3.5h-4a2 2 0 0 0-2 2v8a1.6 1.6 0 0 1 1.6-1.6h4.4z" />
  </svg>
);

export const IconPrint = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4.5 6V2.5h7V6M4.5 12.5h-2v-5h11v5h-2" />
    <rect x="4.5" y="9.5" width="7" height="4" rx="0.6" />
  </svg>
);

export const IconDownload = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M8 2.5v8M5 7.5l3 3 3-3M2.5 13.5h11" />
  </svg>
);

export const IconUpload = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M8 11V3M5 6l3-3 3 3M2.5 13.5h11" />
  </svg>
);

export const IconBack = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M13 8H3M7 4 3 8l4 4" />
  </svg>
);

export const IconWarning = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M8 2.5 14.5 13.5h-13z" />
    <path d="M8 6.5v3.2M8 11.8v.2" />
  </svg>
);

export const IconCheck = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 8.5 6.5 12 13 4.5" />
  </svg>
);

export const IconImage = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="2.5" y="3.5" width="11" height="9" rx="1.2" />
    <circle cx="6" cy="6.6" r="1" />
    <path d="m3.2 11.4 3-3 2.6 2.6 1.8-1.6 2.2 2" />
  </svg>
);

export const IconClose = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m4 4 8 8M12 4l-8 8" />
  </svg>
);

export const IconChevronRight = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m6 3.5 4.5 4.5L6 12.5" />
  </svg>
);

export const IconChevronDown = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m3.5 6 4.5 4.5L12.5 6" />
  </svg>
);

export const IconSearch = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="7" cy="7" r="4.5" />
    <path d="m10.5 10.5 3 3" />
  </svg>
);

export const IconShare = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="4" cy="8" r="1.7" />
    <circle cx="11.8" cy="3.8" r="1.7" />
    <circle cx="11.8" cy="12.2" r="1.7" />
    <path d="m5.5 7.2 4.8-2.6M5.5 8.8l4.8 2.6" />
  </svg>
);

export const IconLink = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m6.3 9.7-1.1 1.1a2.4 2.4 0 0 1-3.4-3.4l2.1-2.1a2.4 2.4 0 0 1 3.4 0" />
    <path d="m9.7 6.3 1.1-1.1a2.4 2.4 0 0 1 3.4 3.4l-2.1 2.1a2.4 2.4 0 0 1-3.4 0" />
    <path d="m6 10 4-4" />
  </svg>
);

export const IconUser = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="8" cy="5.2" r="2.4" />
    <path d="M3.2 13.3c.6-2.4 2.2-3.6 4.8-3.6s4.2 1.2 4.8 3.6" />
  </svg>
);

export const IconMail = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="2" y="3.5" width="12" height="9" rx="1.4" />
    <path d="m3 5 5 4 5-4" />
  </svg>
);

export const IconEye = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M1.5 8s2.4-4 6.5-4 6.5 4 6.5 4-2.4 4-6.5 4S1.5 8 1.5 8Z" />
    <circle cx="8" cy="8" r="1.7" />
  </svg>
);

export const IconEdit = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m3 11.5-.5 2 2-.5 7.8-7.8-1.5-1.5zM9.8 4.7l1.5 1.5" />
    <path d="M8 3H3.5a1 1 0 0 0-1 1v8.5a1 1 0 0 0 1 1H12a1 1 0 0 0 1-1V8" />
  </svg>
);
