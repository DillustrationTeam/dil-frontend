export type PersonalTab = 'reputation' | 'requested' | 'saved' | 'liked';

export const PROFILE_TAB_DEFINITIONS: { id: PersonalTab; label: string }[] = [
  { id: 'reputation', label: 'Độ uy tín' },
  { id: 'requested', label: 'Đơn đã đặt' },
  { id: 'saved', label: 'Đã lưu' },
  { id: 'liked', label: 'Yêu thích' },
];

const DEFAULT_ORDER: PersonalTab[] = PROFILE_TAB_DEFINITIONS.map((definition) => definition.id);
const STORAGE_KEY = 'dillustration:personal-profile-tabs';

export interface ProfileTabPreferences {
  order: PersonalTab[];
  hidden: PersonalTab[];
}

const DEFAULT_PREFERENCES: ProfileTabPreferences = { order: DEFAULT_ORDER, hidden: [] };

function isPersonalTab(value: unknown): value is PersonalTab {
  return typeof value === 'string' && (DEFAULT_ORDER as string[]).includes(value);
}

function normalize(preferences: { order?: unknown; hidden?: unknown }): ProfileTabPreferences {
  const order = Array.isArray(preferences.order) ? preferences.order.filter(isPersonalTab) : [];
  const dedupedOrder = Array.from(new Set(order));
  for (const id of DEFAULT_ORDER) {
    if (!dedupedOrder.includes(id)) dedupedOrder.push(id);
  }

  const hidden = Array.isArray(preferences.hidden) ? preferences.hidden.filter(isPersonalTab) : [];
  const dedupedHidden = Array.from(new Set(hidden));

  // Dữ liệu lưu bị hỏng (ẩn hết tab) — trả về mặc định thay vì để trang hồ sơ không còn tab nào.
  if (dedupedHidden.length >= dedupedOrder.length) {
    return DEFAULT_PREFERENCES;
  }

  return { order: dedupedOrder, hidden: dedupedHidden };
}

export function loadProfileTabPreferences(): ProfileTabPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return normalize(JSON.parse(raw));
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveProfileTabPreferences(preferences: ProfileTabPreferences): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalize(preferences)));
}

export function getVisibleOrderedTabs(
  preferences: ProfileTabPreferences
): { id: PersonalTab; label: string }[] {
  const byId = new Map(PROFILE_TAB_DEFINITIONS.map((definition) => [definition.id, definition]));
  return preferences.order
    .filter((id) => !preferences.hidden.includes(id))
    .map((id) => byId.get(id))
    .filter((definition): definition is { id: PersonalTab; label: string } => Boolean(definition));
}
