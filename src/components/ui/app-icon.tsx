import { Image } from 'expo-image';

import { Colors } from '@/constants/theme';

const paths = {
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  back: '<path d="m14 5-7 7 7 7"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  down: '<path d="m5 9 7 7 7-7"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  user: '<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v5M17 3v5M3 11h18"/>',
  plan: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  chart: '<path d="M5 20v-6M12 20V9M19 20V3"/>',
  history: '<rect x="5" y="5" width="14" height="16" rx="2"/><rect x="9" y="2" width="6" height="6" rx="2"/><path d="M9 14h6M12 11v6"/>',
  wall: '<path d="M4 3h16v14H9l-5 4zM8 7h8M8 11h6"/>',
  logout: '<path d="M10 3H4v18h6M9 12h12m-5-5 5 5-5 5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v3"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="m3 3 18 18M10 5c7-2 12 7 12 7a20 20 0 0 1-4 4M6 6a20 20 0 0 0-4 6s4 7 10 7a12 12 0 0 0 5-1M10 10a3 3 0 0 0 4 4"/>',
  search: '<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  weight: '<rect x="4" y="4" width="16" height="17" rx="4"/><path d="M8 4a4 4 0 0 0 8 0M12 5V3"/>',
  fork: '<path d="M4 3v6a3 3 0 0 0 6 0V3M7 3v18M20 3c-4 2-5 6-5 10h5M20 3v18"/>',
  bowl: '<path d="M3 12h18a9 9 0 0 1-18 0ZM8 8c-3-2 2-3 0-6M13 8c-3-2 2-3 0-6M17 8c-3-2 2-3 0-6"/>',
  apple: '<path d="M12 6c-9-6-13 5-7 13 3 4 5 1 7 1s4 3 7-1c6-8 2-19-7-13ZM12 6c0-4 3-5 5-5"/>',
  moon: '<path d="M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12Z"/>',
  shield: '<path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6zM8 11l3 3 5-6"/>',
  settings: '<path d="m9 3-1 3-3 1v4l-2 2 2 3 3-1 2 3h4l1-3 3-1v-4l2-2-2-3-3 1-2-3z"/><circle cx="11" cy="10" r="3"/>',
  upload: '<path d="M7 18H5a4 4 0 0 1-1-8 8 8 0 0 1 16-1 5 5 0 0 1 0 10h-3M12 21V9m-4 4 4-4 4 4"/>',
  bank: '<path d="m2 7 10-5 10 5ZM3 21h18M4 18h16M6 10v5M12 10v5M18 10v5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  heart: '<path d="M12 21 3 12C-3 3 9-2 12 6c3-8 15-3 9 6z"/>',
  phone: '<path d="m5 3 4 4-2 3a15 15 0 0 0 7 7l3-2 4 4c-3 6-10 1-14-3S-1 6 5 3Z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v.2"/>',
} as const;

export type IconName = keyof typeof paths;

export function AppIcon({ name, size = 24, color = Colors.textSecondary }: { name: IconName; size?: number; color?: string }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
  return <Image source={{ uri: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` }} style={{ width: size, height: size }} accessible={false} />;
}
