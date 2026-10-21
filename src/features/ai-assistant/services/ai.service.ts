import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api.types';
import type { AiConversationDto, AiMessageDto, AiPage, DeadlineReminderDto, DeadlineRiskDto } from '../types/ai.types';

async function call<T>(method: 'get' | 'post', url: string, data?: unknown, params?: object, signal?: AbortSignal) {
  try {
    const response = await apiClient.request<ApiResponse<T>>({ method, url, data, params, signal, timeout: 90000 });
    if (response.data.error) throw { response: { data: response.data } };
    if (response.data.data === null) throw new Error('Máy chủ chưa trả dữ liệu trợ lý.');
    return { data: response.data.data, meta: response.data.meta };
  } catch (error) {
    const info = (error as { response?: { data?: { error?: { detail?: string; title?: string; details?: string[]; message?: string } } } })?.response?.data?.error;
    throw new Error(info?.detail || info?.message || info?.details?.join(' · ') || info?.title || (error instanceof Error && error.message !== 'Network Error' ? error.message : 'Không kết nối được trợ lý. Vui lòng thử lại.'));
  }
}
async function list<T>(url: string, cursor?: string, signal?: AbortSignal): Promise<AiPage<T>> {
  const r = await call<T[]>('get', url, undefined, { cursor, limit: 20 }, signal);
  return { items: r.data, nextCursor: typeof r.meta?.nextCursor === 'string' ? r.meta.nextCursor : null };
}
export const aiService = {
  conversations: (cursor?: string, signal?: AbortSignal) => list<AiConversationDto>('/ai/conversations', cursor, signal),
  create: (topic: string, contextType: string, contextId?: string) => call<AiConversationDto>('post', '/ai/conversations', { topic, contextType, contextId }).then(r => r.data),
  messages: (id: string, cursor?: string, signal?: AbortSignal) => list<AiMessageDto>(`/ai/conversations/${id}/messages`, cursor, signal),
  send: (id: string, content: string) => call<{ userMessage: AiMessageDto; assistantMessage: AiMessageDto }>('post', `/ai/conversations/${id}/messages`, { content }).then(r => r.data),
  feedback: (id: string, helpful: boolean) => call<{ aiMessageId: string; helpful: boolean }>('post', `/ai/messages/${id}/feedback`, { helpful }).then(r => r.data),
  risk: (id: string, signal?: AbortSignal) => call<DeadlineRiskDto>('get', `/commissions/${id}/deadline-risks`, undefined, undefined, signal).then(r => r.data),
  predict: (id: string) => call<DeadlineRiskDto>('post', `/commissions/${id}/deadline-risks/predict`, {}).then(r => r.data),
  remind: (id: string, remindAt: string, milestoneId?: string) => call<DeadlineReminderDto>('post', `/commissions/${id}/deadline-reminders`, { remindAt, milestoneId, channel: 'InApp' }).then(r => r.data),
  briefHelper: (data: { description?: string; style?: string; budget?: number; title?: string; surpriseMe?: boolean }) => call<{ content: string }>('post', '/ai/brief-helper', data).then(r => r.data),
  standardizeRevision: (data: { feedback: string; milestoneTitle?: string }) => call<{ content: string }>('post', '/ai/standardize-revision', data).then(r => r.data),
  disputeSummary: (disputeId: string) => call<{ summary: string }>('get', `/admin/disputes/${disputeId}/ai-summary`).then(r => r.data),
};
