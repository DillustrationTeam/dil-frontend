'use client';

import { useState } from 'react';
import { Searchbar } from '@/components/ui/searchbar';
import { Dropdown, DropdownOption } from '@/components/ui/dropdown';
import { AdminUserFilters } from '@/features/admin/types/admin.types';

export interface UserFilterProps {
  keyword: string;
  role: string | null;
  status: string | null;
  onFilterChange: (field: keyof AdminUserFilters, value: string | null) => void;
}

const roleOptions: DropdownOption[] = [
  { value: '', label: 'All Roles' },
  { value: 'Client', label: 'Client' },
  { value: 'Creator', label: 'Creator' },
  { value: 'Admin', label: 'Admin' },
];

const statusOptions: DropdownOption[] = [
  { value: '', label: 'All Statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Banned', label: 'Banned' },
];

export function UserFilter({
  keyword,
  role,
  status,
  onFilterChange,
}: UserFilterProps) {
  const [keywordInput, setKeywordInput] = useState(keyword);

  const handleSearch = () => {
    onFilterChange('keyword', keywordInput);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex-1">
        <Searchbar
          value={keywordInput}
          onChange={setKeywordInput}
          onSearch={handleSearch}
          placeholder="Search by name or email..."
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Dropdown
          value={role ?? ''}
          options={roleOptions}
          onChange={(val) => onFilterChange('role', val ? val : null)}
        />

        <Dropdown
          value={status ?? ''}
          options={statusOptions}
          onChange={(val) => onFilterChange('status', val ? val : null)}
        />
      </div>
    </div>
  );
}

export default UserFilter;
