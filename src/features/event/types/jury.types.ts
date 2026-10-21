export interface JuryCriterion {
  id: string;
  name: string;
  description?: string;
  maxScore: number;
  weight: number;
  displayOrder: number;
}

export interface CriteriaScoreItem {
  criteriaId: string;
  criteriaName?: string;
  score: number;
}

export interface SubmitScoreRequest {
  submissionId: string;
  totalScore: number;
  notes?: string;
  noConflictOfInterest: boolean;
  nominateSpecialAward?: boolean;
  specialAwardCategory?: string;
  criteriaScores: CriteriaScoreItem[];
}

export interface SubmissionScoreResponse {
  submissionId: string;
  score: number;
  totalAverageScore?: number | null;
  notes?: string;
  gradedAt: string;
  isLocked: boolean;
}

export interface JurySubmissionItem {
  id: string;
  code: string;
  title: string;
  description?: string;
  category?: string;
  artworkImageUrl: string;
  artworkThumbnailUrl?: string;
  submittedAt: string;
  aiScanPassed: boolean;
  voteCount: number;
  score?: number | null;
  isGraded: boolean;
  gradedScore?: number | null;
  notes?: string;
  criteriaScores?: Record<string, number>;
  noConflictOfInterest?: boolean;
  nominateSpecialAward?: boolean;
  specialAwardCategory?: string;
  isLocked?: boolean;
}

export interface JuryEvaluationDraft {
  submissionId: string;
  totalScore: number;
  criteriaScores: Record<string, number>;
  notes: string;
  noConflictOfInterest: boolean;
  nominateSpecialAward?: boolean;
  specialAwardCategory?: string;
  updatedAt: string;
  isLocked?: boolean;
}

export interface JuryStats {
  totalAssigned: number;
  gradedCount: number;
  remainingCount: number;
  progressPercent: number;
}

export interface JuryMemberInfo {
  id: string;
  eventId: string;
  eventTitle?: string;
  creatorId: string;
  creatorUserId?: string;
  userId?: string;
  creatorName?: string;
  creatorDisplayName?: string;
  creatorEmail?: string;
  creatorAvatarUrl?: string;
  isHeadJury: boolean;
  role: string;
}

export interface JuryProgressItem {
  id: string;
  name: string;
  gradedPercent: number;
  completedCount: number;
  totalAssigned: number;
  statusLabel: string;
  isCompleted: boolean;
}

export interface CombinedScoreItem {
  rank: number;
  submissionId: string;
  title: string;
  code: string;
  category?: string;
  artworkImageUrl: string;
  juryScoreAvg: number;
  headJuryScore: number;
  deviationPercent: number;
}

export interface ArbitrationCase {
  id: string;
  submissionId: string;
  title: string;
  code: string;
  category?: string;
  artworkImageUrl: string;
  deviationPercent: number;
  notes: string;
  status: string;
  decision?: string;
}

export interface WinnerApprovalItem {
  awardName: string;
  submissionId: string;
  title: string;
  code: string;
  scoreOrVotes: string;
  status: string;
}

export interface HeadJuryWorkspaceData {
  totalSubmissions: number;
  gradedSubmissions: number;
  completedJuryCount: number;
  totalJuryCount: number;
  anomalyFlagsCount: number;
  overallProgressPercent: number;
  juryProgressList: JuryProgressItem[];
  combinedScores: CombinedScoreItem[];
  arbitrationCases: ArbitrationCase[];
  finalWinners: WinnerApprovalItem[];
  allJuryCompleted: boolean;
  disputesResolved: boolean;
  winnersConfirmed: boolean;
  isResultsApproved: boolean;
}

