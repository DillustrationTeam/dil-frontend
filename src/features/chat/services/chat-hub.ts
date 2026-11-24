import { hubUrl } from '@/lib/realtime-url';

/** URL hub SignalR của Workroom Chat (UC43). */
export function chatHubUrl(): string {
  return hubUrl('/hubs/chat');
}
