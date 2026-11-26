// Path icon lấy từ Lucide (https://lucide.dev), license ISC.
// Copyright (c) Lucide Contributors. Cho phép dùng, sửa, phân phối kèm ghi chú này.

function BaseIcon({ className, children, fill }) {
  let fillValue = "none";
  if (fill) {
    fillValue = fill;
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={fillValue}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function HeartIcon({ className, filled }) {
  let fill = "none";
  if (filled) {
    fill = "currentColor";
  }

  return (
    <BaseIcon className={className} fill={fill}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </BaseIcon>
  );
}

export function SunIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </BaseIcon>
  );
}

export function MoonIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </BaseIcon>
  );
}

export function MenuIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </BaseIcon>
  );
}

export function CloseIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="M18 6 6 18M6 6l12 12" />
    </BaseIcon>
  );
}

export function ArrowUpIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="m5 12 7-7 7 7M12 19V5" />
    </BaseIcon>
  );
}

export function ChevronLeftIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="m15 18-6-6 6-6" />
    </BaseIcon>
  );
}

export function ChevronRightIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="m9 18 6-6-6-6" />
    </BaseIcon>
  );
}

// Mục Hot + nhãn HOT
export function FireIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </BaseIcon>
  );
}

// Mục Mới khai trương
export function SparklesIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4M22 5h-4M4 17v2M5 18H3" />
    </BaseIcon>
  );
}

// Mục Mới cập nhật
export function ClockIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </BaseIcon>
  );
}

// Tiền điện
export function ZapIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </BaseIcon>
  );
}

// Tiền nước
export function DropletIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
    </BaseIcon>
  );
}

export function CheckIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="M20 6 9 17l-5-5" />
    </BaseIcon>
  );
}

export function ArrowLeftIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="m12 19-7-7 7-7M19 12H5" />
    </BaseIcon>
  );
}

export function MapPinIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </BaseIcon>
  );
}

export function CalendarIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </BaseIcon>
  );
}

export function DownloadIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </BaseIcon>
  );
}

export function ShareIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
    </BaseIcon>
  );
}

export function LinkIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </BaseIcon>
  );
}

export function CopyIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <rect x="8" y="8" width="14" height="14" rx="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </BaseIcon>
  );
}

export function LogOutIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    </BaseIcon>
  );
}

export function DashboardIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </BaseIcon>
  );
}

export function BuildingIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4M10 10h4M10 14h4M10 18h4" />
    </BaseIcon>
  );
}

export function DoorIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="M13 4h3a2 2 0 0 1 2 2v14" />
      <path d="M2 20h3" />
      <path d="M13 20h9" />
      <path d="M10 12v.01" />
      <path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z" />
    </BaseIcon>
  );
}

export function MessageIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </BaseIcon>
  );
}

export function PlusIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </BaseIcon>
  );
}

export function PencilIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
      <path d="m15 5 4 4" />
    </BaseIcon>
  );
}

export function TrashIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <path d="M10 11v6M14 11v6" />
    </BaseIcon>
  );
}

export function UploadIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m17 8-5-5-5 5" />
      <path d="M12 3v12" />
    </BaseIcon>
  );
}

export function SearchIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </BaseIcon>
  );
}

export function UserIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </BaseIcon>
  );
}

export function UsersIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </BaseIcon>
  );
}

export function ChevronDownIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="m6 9 6 6 6-6" />
    </BaseIcon>
  );
}


export function ExternalLinkIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </BaseIcon>
  );
}

export function AlertIcon({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </BaseIcon>
  );
}
