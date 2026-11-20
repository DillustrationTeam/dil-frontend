'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import {
  PROFILE_TAB_DEFINITIONS,
  PersonalTab,
  ProfileTabPreferences,
  loadProfileTabPreferences,
  saveProfileTabPreferences,
} from '@/features/profile-settings/utils/profile-tab-preferences';

const sectionTitleClass = 'text-2xl font-extrabold uppercase tracking-wide text-brand-periwinkle';

export function ProfileTabsSettingsForm() {
  const [preferences, setPreferences] = useState<ProfileTabPreferences | null>(null);

  useEffect(() => {
    setPreferences(loadProfileTabPreferences());
  }, []);

  if (!preferences) {
    return null;
  }

  const labelOf = (id: PersonalTab) => PROFILE_TAB_DEFINITIONS.find((definition) => definition.id === id)?.label ?? id;

  const update = (next: ProfileTabPreferences) => {
    setPreferences(next);
    saveProfileTabPreferences(next);
  };

  const toggleHidden = (id: PersonalTab) => {
    const isHidden = preferences.hidden.includes(id);
    if (!isHidden && preferences.hidden.length >= preferences.order.length - 1) {
      toast.error('Cần hiện ít nhất 1 danh mục.');
      return;
    }
    update({
      ...preferences,
      hidden: isHidden ? preferences.hidden.filter((item) => item !== id) : [...preferences.hidden, id],
    });
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= preferences.order.length) return;
    const nextOrder = [...preferences.order];
    [nextOrder[index], nextOrder[target]] = [nextOrder[target], nextOrder[index]];
    update({ ...preferences, order: nextOrder });
  };

  const resetDefaults = () => {
    update({ order: PROFILE_TAB_DEFINITIONS.map((definition) => definition.id), hidden: [] });
    toast.success('Đã khôi phục mặc định.');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section className="glass-container space-y-4 rounded-[32px] p-6 md:p-8">
        <p className={sectionTitleClass}>Danh mục hồ sơ</p>
        <p className="text-sm text-outline">
          Chọn danh mục nào hiển thị trên trang hồ sơ cá nhân của bạn, và sắp xếp lại thứ tự hiển thị.
        </p>

        <ul className="space-y-2">
          {preferences.order.map((id, index) => {
            const isHidden = preferences.hidden.includes(id);
            return (
              <li key={id} className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3">
                <span className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label="Di chuyển lên"
                    className="rounded p-0.5 text-outline transition hover:text-white disabled:opacity-30"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === preferences.order.length - 1}
                    aria-label="Di chuyển xuống"
                    className="rounded p-0.5 text-outline transition hover:text-white disabled:opacity-30"
                  >
                    <ChevronDown size={14} />
                  </button>
                </span>

                <span className={`flex-1 text-sm font-medium ${isHidden ? 'text-outline' : 'text-white'}`}>
                  {labelOf(id)}
                </span>

                <button
                  type="button"
                  onClick={() => toggleHidden(id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    isHidden
                      ? 'bg-white/5 text-outline hover:text-white'
                      : 'bg-brand-periwinkle/15 text-brand-periwinkle hover:bg-brand-periwinkle/25'
                  }`}
                >
                  {isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                  {isHidden ? 'Đang ẩn' : 'Đang hiện'}
                </button>
              </li>
            );
          })}
        </ul>

        <button type="button" onClick={resetDefaults} className="text-xs font-semibold text-outline hover:text-white">
          Khôi phục mặc định
        </button>
      </section>
    </div>
  );
}
