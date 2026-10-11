// Ikon garis sederhana, 20 × 20.
type IconProps = { className?: string };

function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const IconSearch = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </Svg>
);

export const IconSun = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Svg>
);

export const IconMoon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
  </Svg>
);

export const IconPin = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </Svg>
);

export const IconCalendar = (props: IconProps) => (
  <Svg {...props}>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Svg>
);

export const IconClock = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);

export const IconTicket = (props: IconProps) => (
  <Svg {...props}>
    <path d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a3 3 0 0 0 0-6z" />
    <path d="M14 5v14" strokeDasharray="2 3" />
  </Svg>
);

export const IconUsers = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8" />
  </Svg>
);

export const IconLink = (props: IconProps) => (
  <Svg {...props}>
    <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
    <path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
  </Svg>
);

export const IconArrow = (props: IconProps) => (
  <Svg {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const IconHome = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" />
  </Svg>
);

export const IconNews = (props: IconProps) => (
  <Svg {...props}>
    <rect x="3" y="4" width="14" height="16" rx="2" />
    <path d="M17 8h3a1 1 0 0 1 1 1v9a2 2 0 0 1-4 0M7 8h6M7 12h6M7 16h4" />
  </Svg>
);

export const IconGrid = (props: IconProps) => (
  <Svg {...props}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.2" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2" />
  </Svg>
);

export const IconInfo = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v6M12 7.5v.2" />
  </Svg>
);

export const IconImage = (props: IconProps) => (
  <Svg {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="M21 16l-5-4.5L7 19" />
  </Svg>
);

export const IconLayers = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5" />
  </Svg>
);

export const IconTag = (props: IconProps) => (
  <Svg {...props}>
    <path d="M3 12V4h8l10 10-8 8L3 12z" />
    <circle cx="8" cy="9" r="1.4" />
  </Svg>
);

export const IconMegaphone = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 10v4h3l7 4V6l-7 4H4zM18 9a4 4 0 0 1 0 6" />
  </Svg>
);

export const IconSliders = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </Svg>
);

export const IconMenu = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const IconChevronLeft = (props: IconProps) => (
  <Svg {...props}>
    <path d="M14.5 6l-6 6 6 6" />
  </Svg>
);

export const IconLogout = (props: IconProps) => (
  <Svg {...props}>
    <path d="M10 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h4M15 8l4 4-4 4M19 12H9" />
  </Svg>
);

// Ikon media sosial sebagai tautan ke akun situs.
export const IconInstagram = (props: IconProps) => (
  <Svg {...props}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <path d="M17.3 6.7v.1" />
  </Svg>
);

export const IconTiktok = (props: IconProps) => (
  <Svg {...props}>
    <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" />
    <path d="M14 3c.3 2.6 2 4.4 4.8 4.7" />
  </Svg>
);

export const IconYoutube = (props: IconProps) => (
  <Svg {...props}>
    <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
    <path d="M10.2 9.3v5.4l4.6-2.7-4.6-2.7z" />
  </Svg>
);

export const IconFacebook = (props: IconProps) => (
  <Svg {...props}>
    <path d="M14 21v-8h3l.5-3.5H14V7.4c0-1 .4-1.9 2-1.9h1.7V2.4C17 2.2 16 2 15 2c-2.700 0-4.500 1.700-4.500 4.700v2.800H7.500V13h3v8" />
  </Svg>
);

// Ikon tombol bagikan.
export const IconWhatsapp = (props: IconProps) => (
  <Svg {...props}>
    <path d="M3.5 20.5l1.3-4.4A8.5 8.5 0 1 1 8 19.3z" />
    <path d="M9 8.6c0 3.2 2.6 6 6.2 6.4l1-1.5-2-1-.9.9c-1-.5-1.8-1.3-2.3-2.3l.9-.9-1-2z" />
  </Svg>
);

export const IconX = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4.5 4.5l15 15M19.5 4.5l-15 15" />
  </Svg>
);

export const IconTelegram = (props: IconProps) => (
  <Svg {...props}>
    <path d="M21 4L3 11.2l5.6 2 2 5.8 3-3.9 4.4 3.4z" />
    <path d="M8.6 13.2L21 4" />
  </Svg>
);

export const IconThreads = (props: IconProps) => (
  <Svg {...props}>
    <path d="M17.2 8.2C16.3 5.6 14.5 4 12 4 8.2 4 6 7.2 6 12s2.2 8 6 8c3 0 5-1.7 5-4.1 0-2.2-1.9-3.6-4.6-3.6-2 0-3.2.9-3.2 2.2 0 1.2 1 2 2.5 2 2.2 0 3.3-1.7 3.3-4.3 0-2-1-3.2-2.8-3.2-1.1 0-1.9.4-2.5 1.200" />
  </Svg>
);

export const IconShare = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="17.5" cy="5.5" r="2.5" />
    <circle cx="17.5" cy="18.5" r="2.5" />
    <path d="M8.2 10.8l7.1-4.1M8.2 13.2l7.1 4.1" />
  </Svg>
);

export const IconChart = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />
  </Svg>
);

export const IconInbox = (props: IconProps) => (
  <Svg {...props}>
    <path d="M3 13l3-8h12l3 8v6H3z" />
    <path d="M3 13h5l1 3h6l1-3h5" />
  </Svg>
);

export const IconPage = (props: IconProps) => (
  <Svg {...props}>
    <path d="M6 3h8l4 4v14H6z" />
    <path d="M14 3v4h4M9 12h6M9 16h6" />
  </Svg>
);

export const IconMail = (props: IconProps) => (
  <Svg {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M4 7l8 6 8-6" />
  </Svg>
);

export const IconDatabase = (props: IconProps) => (
  <Svg {...props}>
    <ellipse cx="12" cy="5.5" rx="7.5" ry="3" />
    <path d="M4.5 5.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6" />
    <path d="M4.5 11.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6" />
  </Svg>
);

export const IconDownload = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 4v11m-5-5 5 5 5-5M5 20h14" />
  </Svg>
);
