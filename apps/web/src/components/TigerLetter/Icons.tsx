import React from "react";

function IconBase({
  children,
  size = 18,
  color = "currentColor",
}: {
  children: React.ReactNode;
  size?: number;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const Icons = {
  upload: (
    <IconBase>
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M4 20h16" />
    </IconBase>
  ),
  image: (
    <IconBase>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </IconBase>
  ),
  calendar: (
    <IconBase>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4" />
      <path d="M8 3v4" />
      <path d="M3 11h18" />
    </IconBase>
  ),
  type: (
    <IconBase>
      <path d="M4 6h16" />
      <path d="M12 6v14" />
    </IconBase>
  ),
  bold: (
    <IconBase>
      <path d="M6 4h7a4 4 0 0 1 0 8H6z" />
      <path d="M6 12h8a4 4 0 0 1 0 8H6z" />
    </IconBase>
  ),
  italic: (
    <IconBase>
      <path d="M19 4h-6" />
      <path d="M11 20H5" />
      <path d="M14 4 10 20" />
    </IconBase>
  ),
  underline: (
    <IconBase>
      <path d="M7 4v6a5 5 0 0 0 10 0V4" />
      <path d="M5 20h14" />
    </IconBase>
  ),
  alignLeft: (
    <IconBase>
      <path d="M4 6h16" />
      <path d="M4 12h10" />
      <path d="M4 18h16" />
    </IconBase>
  ),
  alignCenter: (
    <IconBase>
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M4 18h16" />
    </IconBase>
  ),
  alignRight: (
    <IconBase>
      <path d="M4 6h16" />
      <path d="M10 12h10" />
      <path d="M4 18h16" />
    </IconBase>
  ),
  list: (
    <IconBase>
      <path d="M9 6h11" />
      <path d="M9 12h11" />
      <path d="M9 18h11" />
      <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
    </IconBase>
  ),
  ordered: (
    <IconBase>
      <path d="M10 6h10" />
      <path d="M10 12h10" />
      <path d="M10 18h10" />
      <path d="M4 5h2v4" />
      <path d="M4 13c0-1 1-2 2-2s2 1 2 2c0 2-4 2-4 4h4" />
    </IconBase>
  ),
  save: (
    <IconBase>
      <path d="M5 21h14" />
      <path d="M19 21V7l-3-3H5v17" />
      <path d="M9 21v-8h6v8" />
    </IconBase>
  ),
  export: (
    <IconBase>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </IconBase>
  ),
  drafts: (
    <IconBase>
      <path d="M8 3h8l5 5v13H8z" />
      <path d="M8 3v5h5" />
      <path d="M4 7v14h12" />
    </IconBase>
  ),
  trash: (
    <IconBase>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
    </IconBase>
  ),
  stamp: (
    <IconBase>
      <path d="M8 6a4 4 0 1 1 8 0c0 2 1 3 2 4H6c1-1 2-2 2-4Z" />
      <path d="M6 10h12v3H6z" />
      <path d="M5 17h14" />
    </IconBase>
  ),
  pen: (
    <IconBase>
      <path d="m12 20 7-7 2 2-7 7-4 1 1-4Z" />
    </IconBase>
  ),
  palette: (
    <IconBase>
      <path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 0-4h-1a2 2 0 0 1 0-4h1a4 4 0 0 0 0-8Z" />
      <circle cx="7.5" cy="10.5" r="1" />
      <circle cx="12" cy="7.5" r="1" />
      <circle cx="16.5" cy="10.5" r="1" />
    </IconBase>
  ),
  settings: (
    <IconBase>
      <path d="M12 3v3" />
      <path d="M12 18v3" />
      <path d="M3 12h3" />
      <path d="M18 12h3" />
      <path d="m5.6 5.6 2.1 2.1" />
      <path d="m16.3 16.3 2.1 2.1" />
      <path d="m18.4 5.6-2.1 2.1" />
      <path d="m7.7 16.3-2.1 2.1" />
      <circle cx="12" cy="12" r="3" />
    </IconBase>
  ),
  move: (
    <IconBase>
      <path d="M12 2v20" />
      <path d="M2 12h20" />
      <path d="m15 5-3-3-3 3" />
      <path d="m15 19-3 3-3-3" />
    </IconBase>
  ),
  mail: (
    <IconBase>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </IconBase>
  ),
  plane: (
    <IconBase>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4Z" />
    </IconBase>
  ),
};
