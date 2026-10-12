'use client';

import React from 'react';
import { PublishResultsTable } from './publish-results-table';
import { PublishChecklistAside } from './publish-checklist-aside';

export function PublishTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <div className="lg:col-span-7">
        <PublishResultsTable />
      </div>
      <div className="lg:col-span-5">
        <PublishChecklistAside />
      </div>
    </div>
  );
}
