/** Khớp `ReferenceSketchQuotaDto` — GET /ai/reference-sketches/quota. */
export interface ReferenceSketchQuotaDto {
  enabled: boolean;
  used: number;
  limit: number;
  resetsAt: string | null;
  /** % giảm giá đơn toàn sàn khi gắn ảnh AI làm reference (admin cấu hình tại /admin/fee-policy). */
  discountPercent: number;
}

/** Khớp `ReferenceSketchImageDto` — 1 ảnh phác thảo đã sinh. */
export interface ReferenceSketchImageDto {
  id: string;
  variantIndex: number;
  url: string;
  labelVi: string;
  labelEn: string;
}

export type ReferenceSketchStatus = 'Pending' | 'Running' | 'Succeeded' | 'Blocked' | 'Failed';

/** Khớp `ReferenceSketchGenerationDto` — GET /ai/reference-sketches/{id} (fallback poll). */
export interface ReferenceSketchGenerationDto {
  generationId: string;
  status: ReferenceSketchStatus;
  percent: number;
  images: ReferenceSketchImageDto[] | null;
  error: string | null;
  blockReasonVi: string | null;
  blockReasonEn: string | null;
}

/** Khớp `LayoutHintDto` — 1 gợi ý bố cục trong nút "🎲 Gợi ý bố cục độc đáo". */
export interface LayoutHintDto {
  technique: string;
  textVi: string;
}

/** Khớp `SuggestLayoutHintsResultDto` — POST /ai/reference-sketches/layout-hints. */
export interface SuggestLayoutHintsResultDto {
  hints: LayoutHintDto[];
}

/** Khớp `ReferenceSketchProgressEvent` — event SignalR `AiReferenceSketchProgress`. */
export interface ReferenceSketchProgressEvent {
  generationId: string;
  stage: 'policy_check' | 'blocked' | 'writing_prompt' | 'generating' | 'done' | 'failed';
  percent: number;
  perImage: number[] | null;
  images: ReferenceSketchImageDto[] | null;
  error: string | null;
  blockReasonVi: string | null;
  blockReasonEn: string | null;
}
