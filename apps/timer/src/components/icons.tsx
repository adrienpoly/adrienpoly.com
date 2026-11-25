// Icons from the design, drawn inline so they take the color of their context.

interface IconProps {
  size?: number;
  /** Stroke width, for the line icons. */
  weight?: number;
}

const line = (size: number, weight: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: weight,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

const solid = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "currentColor",
  "aria-hidden": true,
});

export const PlusIcon = ({ size = 22, weight = 3 }: IconProps) => (
  <svg {...line(size, weight)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const CloseIcon = ({ size = 18, weight = 2.6 }: IconProps) => (
  <svg {...line(size, weight)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const ChevronIcon = ({ size = 18, weight = 2 }: IconProps) => (
  <svg {...line(size, weight)}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const CheckIcon = ({ size = 34, weight = 3 }: IconProps) => (
  <svg {...line(size, weight)}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export const HandleIcon = ({ size = 16, weight = 2 }: IconProps) => (
  <svg {...line(size, weight)}>
    <path d="M5 9h14M5 15h14" />
  </svg>
);

export const RestartIcon = ({ size = 20, weight = 2.6 }: IconProps) => (
  <svg {...line(size, weight)}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
  </svg>
);

export const RotateIcon = ({ size = 20, weight = 2.2 }: IconProps) => (
  <svg {...line(size, weight)}>
    <rect x="3" y="7" width="18" height="10" rx="2" />
    <path d="M7 3h6M17 21h-6" />
  </svg>
);

export const TrashIcon = ({ size = 20, weight = 2.2 }: IconProps) => (
  <svg {...line(size, weight)}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </svg>
);

export const SettingsIcon = ({ size = 22, weight = 2 }: IconProps) => (
  <svg {...line(size, weight)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const PlayIcon = ({ size = 20 }: IconProps) => (
  <svg {...solid(size)}>
    <path d="M7 4.5v15l12-7.5z" />
  </svg>
);

export const PauseIcon = ({ size = 32 }: IconProps) => (
  <svg {...solid(size)}>
    <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
  </svg>
);

export const PreviousIcon = ({ size = 22 }: IconProps) => (
  <svg {...solid(size)}>
    <path d="M6 5h2v14H6zM20 5v14L9 12z" />
  </svg>
);

export const NextIcon = ({ size = 22 }: IconProps) => (
  <svg {...solid(size)}>
    <path d="M16 5h2v14h-2zM4 5v14l11-7z" />
  </svg>
);
