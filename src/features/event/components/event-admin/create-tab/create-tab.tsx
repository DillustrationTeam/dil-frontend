'use client';

import React from 'react';
import { EventCreateForm } from './event-create-form';
import type { EventListItemDto } from '../../../types/event.types';

interface CreateTabProps {
  selectedEvent: EventListItemDto | null;
  onSaveSuccess: (savedEvent: EventListItemDto) => void;
  onCancelEdit: () => void;
}

export function CreateTab({ selectedEvent, onSaveSuccess, onCancelEdit }: CreateTabProps) {
  return (
    <div className="w-full">
      <EventCreateForm
        key={selectedEvent?.id ?? 'create'}
        selectedEvent={selectedEvent}
        onSaveSuccess={onSaveSuccess}
        onCancelEdit={onCancelEdit}
      />
    </div>
  );
}
