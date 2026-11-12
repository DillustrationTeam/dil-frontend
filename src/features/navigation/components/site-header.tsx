'use client';

import { PublicHeader } from '@/components/navigation/PublicHeader';

/**
 * Header dùng chung cho route group `(workspace)` — tái sử dụng PublicHeader
 * để thanh điều hướng trên `/notifications`, `/ai`, `/checkout` đồng nhất với trang chủ.
 */
export function SiteHeader() {
  return <PublicHeader />;
}
