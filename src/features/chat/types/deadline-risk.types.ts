/**
 * DTO cho widget tiến độ / AI Deadline Predictor trên Workroom (UC46).
 *
 * 📌 Cố ý khai báo lại thay vì import từ `features/ai-assistant`: quy tắc Silo của
 * repo cấm feature import chéo feature (`docs/04-conventions.md`). Shape này khớp
 * `DeadlineRiskDto` của module AI — đổi backend thì sửa cả hai chỗ.
 */

export interface DeadlineReminderDto {
  deadlineReminderId: string;
  commissionId: string;
  milestoneId: string | null;
  remindAt: string;
  channel: string;
  sentAt: string | null;
  riskScore: number;
  isManual: boolean;
}

export type DeadlineRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface DeadlineRiskDto {
  commissionId: string;
  /** 0..1 — càng cao càng dễ trễ hạn. */
  riskScore: number;
  riskLevel: DeadlineRiskLevel;
  deadline: string | null;
  /** Mốc hoàn thành đang thực hiện (1-based). */
  currentStage: number;
  predictedAt: string | null;
  nextRemindAt: string | null;
  modelVersion: string | null;
  reminders: DeadlineReminderDto[];
}
